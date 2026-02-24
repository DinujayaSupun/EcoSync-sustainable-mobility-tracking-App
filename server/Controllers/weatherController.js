const WeatherLog = require('../models/WeatherLog');
const weatherService = require('../Services/weather.service');
const axios = require('axios');

/**
 * Generate and save weather-based transport suggestion
 * @route POST /api/weather-suggestion
 */
exports.createWeatherSuggestion = async (req, res) => {
  try {
    const { userId, origin, destination, originLat, originLon, destLat, destLon } = req.body;

    if (!userId || !origin || !destination) {
      return res.status(400).json({
        success: false,
        message: 'userId, origin, and destination are required',
      });
    }

    const originCity = origin.split(',')[0].trim();
    const lat  = originLat ? parseFloat(originLat) : null;
    const lon  = originLon ? parseFloat(originLon) : null;
    const dLat = destLat   ? parseFloat(destLat)   : null;
    const dLon = destLon   ? parseFloat(destLon)   : null;

    console.log('Creating suggestion — city:', originCity, '| origin coords:', lat, lon, '| dest coords:', dLat, dLon);

    const weatherData = await weatherService.getWeatherBasedSuggestion(originCity, lat, lon, dLat, dLon);

    const weatherLog = await WeatherLog.create({
      userId,
      origin,
      destination,
      weatherCondition: weatherData.weatherCondition,
      suggestedTransport: weatherData.suggestedTransport,
      temperature: weatherData.temperature,
      humidity: weatherData.humidity,
      distance: weatherData.distanceKm,
      adjustmentReason: weatherData.adjustmentReason,
    });

    res.status(201).json({
      success: true,
      message: 'Weather suggestion generated successfully',
      data: {
        weatherLog: {
          ...weatherLog.toObject(),
          distanceKm: weatherData.distanceKm,
          adjustmentReason: weatherData.adjustmentReason,
          weatherTransport: weatherData.weatherTransport,
        },
        description: weatherData.description,
      },
    });
  } catch (error) {
    console.error('Error creating weather suggestion:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to generate weather suggestion',
    });
  }
};

/**
 * Get weather suggestions for a user
 * @route GET /api/weather-suggestion/:userId
 */
exports.getWeatherSuggestions = async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 10, page = 1 } = req.query;

    const skip = (page - 1) * limit;

    const suggestions = await WeatherLog.find({ userId })
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip)
      .populate('userId', 'name email');

    const total = await WeatherLog.countDocuments({ userId });

    res.status(200).json({
      success: true,
      data: {
        suggestions,
        pagination: {
          total,
          page: parseInt(page),
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error('Error fetching weather suggestions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch weather suggestions',
    });
  }
};

/**
 * Update weather suggestion
 * @route PUT /api/weather-suggestion/:id
 */
exports.updateWeatherSuggestion = async (req, res) => {
  try {
    const { id } = req.params;
    const { origin, destination, weatherCondition, suggestedTransport } = req.body;

    const weatherLog = await WeatherLog.findById(id);

    if (!weatherLog) {
      return res.status(404).json({
        success: false,
        message: 'Weather suggestion not found',
      });
    }

    // Update fields
    if (origin) weatherLog.origin = origin;
    if (destination) weatherLog.destination = destination;
    if (weatherCondition) weatherLog.weatherCondition = weatherCondition;
    if (suggestedTransport) weatherLog.suggestedTransport = suggestedTransport;

    await weatherLog.save();

    res.status(200).json({
      success: true,
      message: 'Weather suggestion updated successfully',
      data: weatherLog,
    });
  } catch (error) {
    console.error('Error updating weather suggestion:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update weather suggestion',
    });
  }
};

/**
 * Delete weather suggestion
 * @route DELETE /api/weather-suggestion/:id
 */
exports.deleteWeatherSuggestion = async (req, res) => {
  try {
    const { id } = req.params;

    const weatherLog = await WeatherLog.findById(id);

    if (!weatherLog) {
      return res.status(404).json({
        success: false,
        message: 'Weather suggestion not found',
      });
    }

    await WeatherLog.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'Weather suggestion deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting weather suggestion:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete weather suggestion',
    });
  }
};

/**
 * Get current weather and suggestion for a location
 * @route GET /api/weather-suggestion/current/:location
 */
exports.getCurrentWeatherSuggestion = async (req, res) => {
  try {
    const { location } = req.params;
    const { lat, lon, destLat, destLon } = req.query;

    const cityName = location.split(',')[0].trim();
    const parsedLat  = lat     ? parseFloat(lat)     : null;
    const parsedLon  = lon     ? parseFloat(lon)     : null;
    const parsedDLat = destLat ? parseFloat(destLat) : null;
    const parsedDLon = destLon ? parseFloat(destLon) : null;

    console.log('Current weather — city:', cityName, '| origin:', parsedLat, parsedLon, '| dest:', parsedDLat, parsedDLon);

    const weatherData = await weatherService.getWeatherBasedSuggestion(cityName, parsedLat, parsedLon, parsedDLat, parsedDLon);

    res.status(200).json({
      success: true,
      data: weatherData,
    });
  } catch (error) {
    console.error('Error fetching current weather:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch current weather',
    });
  }
};

/**
 * Autocomplete location suggestions for weather feature
 * @route GET /api/weather-suggestion/autocomplete
 */
exports.autocompleteLocation = async (req, res) => {
  try {
    const { query } = req.query;

    if (!query || query.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Query must be at least 2 characters',
      });
    }

    // Using OpenStreetMap Nominatim API — restricted to Sri Lanka
    const response = await axios.get(
      'https://nominatim.openstreetmap.org/search',
      {
        params: {
          q: query,
          format: 'json',
          limit: 8,
          addressdetails: 1,
          countrycodes: 'lk',                          // Sri Lanka only
          viewbox: '79.5213,9.8315,81.8794,5.9169',   // Sri Lanka bounding box
          bounded: 0,                                  // prefer but don't strictly bound
        },
        headers: {
          'User-Agent': 'SmartCommuteWeather/1.0',
        },
      }
    );

    const suggestions = response.data.map((place) => ({
      display_name: place.display_name,
      lat: place.lat,
      lon: place.lon,
      type: place.type,
      class: place.class,
    }));

    res.status(200).json({
      success: true,
      data: suggestions,
    });
  } catch (error) {
    console.error('Autocomplete error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch location suggestions',
    });
  }
};
