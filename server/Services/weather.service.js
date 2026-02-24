const axios = require('axios');

class WeatherService {
  constructor() {
    this.baseUrl = 'https://api.openweathermap.org/data/2.5/weather';
  }

  /**
   * Get API key from environment (loaded at runtime, not at module load)
   */
  getApiKey() {
    const apiKey = process.env.OPENWEATHER_API_KEY;
    if (!apiKey) {
      console.error('⚠️ OPENWEATHER_API_KEY is not set in environment variables!');
      throw new Error('OpenWeather API key is not configured');
    }
    return apiKey;
  }

  /**
   * Get weather data by coordinates (more reliable than city name)
   * @param {number} lat - Latitude
   * @param {number} lon - Longitude
   * @returns {Promise<Object>} Weather data
   */
  async getWeatherByCoords(lat, lon) {
    try {
      const apiKey = this.getApiKey();
      console.log('🌤️ Fetching weather by coords:', lat, lon);

      const response = await axios.get(this.baseUrl, {
        params: {
          lat,
          lon,
          appid: apiKey,
          units: 'metric',
        },
      });

      console.log('✅ Weather data received successfully (coords)');
      return {
        condition: response.data.weather[0].main,
        description: response.data.weather[0].description,
        temperature: response.data.main.temp,
        humidity: response.data.main.humidity,
        windSpeed: response.data.wind.speed,
      };
    } catch (error) {
      console.error('❌ Error fetching weather by coords:', error.message);
      throw new Error('Unable to fetch weather data for the selected location.');
    }
  }

  /**
   * Get weather data for a location
   * @param {string} location - City name or coordinates
   * @returns {Promise<Object>} Weather data
   */
  async getWeather(location) {
    try {
      const apiKey = this.getApiKey();
      
      console.log('🌤️ Fetching weather for:', location);
      console.log('🔑 API Key:', apiKey ? `${apiKey.substring(0, 10)}...` : 'UNDEFINED');
      console.log('📍 Full URL:', `${this.baseUrl}?q=${location}&appid=${apiKey}&units=metric`);
      
      const response = await axios.get(this.baseUrl, {
        params: {
          q: location,
          appid: apiKey,
          units: 'metric',
        },
      });

      console.log('✅ Weather data received successfully');
      
      return {
        condition: response.data.weather[0].main,
        description: response.data.weather[0].description,
        temperature: response.data.main.temp,
        humidity: response.data.main.humidity,
        windSpeed: response.data.wind.speed,
      };
    } catch (error) {
      console.error('❌ Error fetching weather data:', error.message);
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', error.response.data);
      }
      throw new Error('Unable to fetch weather data. Please check the location name.');
    }
  }

  /**
   * Suggest transport mode based on weather condition
   * @param {string} weatherCondition
   * @returns {string} transport mode
   */
  suggestTransport(weatherCondition) {
    const suggestions = {
      Rain: 'Bus',
      Drizzle: 'Bus',
      Thunderstorm: 'Bus',
      Snow: 'Bus',
      Clear: 'Cycling',
      Clouds: 'Carpool',
      Mist: 'Bus',
      Fog: 'Bus',
    };
    return suggestions[weatherCondition] || 'Carpool';
  }

  /**
   * Calculate straight-line distance between two coords using Haversine formula
   * @returns {number} distance in km
   */
  haversineDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth radius in km
    const toRad = (deg) => (deg * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  /**
   * Suggest transport purely based on distance
   * 0–2 km   → Walking
   * 2–5 km   → Cycling
   * 5–10 km  → Tuk-Tuk
   * 10+ km  → Bus
   */
  suggestByDistance(distanceKm) {
    if (distanceKm <= 2)  return 'Walking';
    if (distanceKm <= 5)  return 'Cycling';
    if (distanceKm <= 10) return 'Tuk-Tuk';
    return 'Bus';
  }

  /**
   * Bad-weather conditions where weather always overrides distance
   */
  isBadWeather(weatherCondition) {
    return ['Rain', 'Drizzle', 'Thunderstorm', 'Snow', 'Mist', 'Fog'].includes(weatherCondition);
  }

  /**
   * Apply distance-based adjustment on top of weather suggestion.
   * Bad weather → keep weather suggestion (Bus/Carpool).
   * Good weather → distance wins.
   * @returns {{ transport, reason, distanceKm }}
   */
  adjustSuggestion(weatherSuggestion, weatherCondition, distanceKm) {
    if (this.isBadWeather(weatherCondition)) {
      return {
        transport: weatherSuggestion,
        reason: 'weather-priority',
        distanceKm: parseFloat(distanceKm.toFixed(2)),
      };
    }
    const distanceSuggestion = this.suggestByDistance(distanceKm);
    return {
      transport: distanceSuggestion,
      reason: 'distance-adjusted',
      distanceKm: parseFloat(distanceKm.toFixed(2)),
    };
  }

  /**
   * Get weather-based + distance-adjusted transport suggestion
   * @param {string} location - fallback city name
   * @param {number|null} lat  - origin latitude
   * @param {number|null} lon  - origin longitude
   * @param {number|null} destLat - destination latitude
   * @param {number|null} destLon - destination longitude
   */
  async getWeatherBasedSuggestion(location, lat, lon, destLat, destLon) {
    try {
      const weather = (lat && lon)
        ? await this.getWeatherByCoords(lat, lon)
        : await this.getWeather(location);

      const weatherTransport = this.suggestTransport(weather.condition);

      // Apply distance-based adjustment when both coords are available
      let suggestedTransport = weatherTransport;
      let adjustmentReason = null;
      let distanceKm = null;

      if (lat && lon && destLat && destLon) {
        distanceKm = this.haversineDistance(lat, lon, destLat, destLon);
        const adjusted = this.adjustSuggestion(weatherTransport, weather.condition, distanceKm);
        suggestedTransport = adjusted.transport;
        adjustmentReason = adjusted.reason;
        distanceKm = adjusted.distanceKm;
        console.log(`📍 Distance: ${distanceKm} km | Adjusted: ${suggestedTransport} (${adjustmentReason})`);
      }

      return {
        weatherCondition: weather.condition,
        temperature: weather.temperature,
        humidity: weather.humidity,
        suggestedTransport,
        description: weather.description,
        distanceKm,
        adjustmentReason,
        weatherTransport, // original weather-only suggestion
      };
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new WeatherService();
