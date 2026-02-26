const Commute = require("../models/Commute");
const Trip = require("../models/Trip");
const axios = require("axios");
const mongoose = require("mongoose");
const { 
  calculateLinearRegression, 
  calculateMonthlyProjection, 
  calculateDailyProjection, 
  categorizeRisk 
} = require("../utils/prediction");

// Emission factors (kg CO2 per km)
const EMISSION_FACTORS = {
  Car: 0.192,
  Bus: 0.105,
  Train: 0.041,
  Bike: 0,
  Walk: 0,
};

// Helper function to geocode location using Nominatim API
const geocodeLocation = async (locationName) => {
  try {
    const response = await axios.get(
      "https://nominatim.openstreetmap.org/search",
      {
        params: {
          q: locationName,
          format: "json",
          limit: 1,
        },
        headers: {
          "User-Agent": "SmartCommuteLogger/1.0",
        },
      }
    );

    if (response.data && response.data.length > 0) {
      return {
        lat: parseFloat(response.data[0].lat),
        lon: parseFloat(response.data[0].lon),
      };
    } else {
      throw new Error("Location not found");
    }
  } catch (error) {
    throw new Error(`Geocoding failed: ${error.message}`);
  }
};

// Helper function to calculate route using OSRM API
const calculateRoute = async (startCoords, destCoords, transportType) => {
  try {
    // OSRM supports different profiles
    const profileMap = {
      Car: "car",
      Bus: "car", // Use car profile for bus
      Train: "car", // Use car profile for train (approximate)
      Bike: "bike",
      Walk: "foot",
    };

    const profile = profileMap[transportType] || "car";
    const url = `https://router.project-osrm.org/route/v1/${profile}/${startCoords.lon},${startCoords.lat};${destCoords.lon},${destCoords.lat}`;

    const response = await axios.get(url, {
      params: {
        overview: "false",
        steps: "false",
      },
    });

    if (response.data && response.data.routes && response.data.routes.length > 0) {
      const route = response.data.routes[0];
      return {
        distance: route.distance / 1000, // Convert meters to kilometers
        duration: route.duration / 60, // Convert seconds to minutes
      };
    } else {
      throw new Error("Route not found");
    }
  } catch (error) {
    throw new Error(`Route calculation failed: ${error.message}`);
  }
};

// Helper function to generate eco-friendly suggestions
const generateEcoSuggestion = (transportType, distance) => {
  if (distance < 2) {
    if (transportType === "Car" || transportType === "Bus" || transportType === "Train") {
      return `💡 Eco Tip: This journey is only ${distance.toFixed(2)} km! Consider walking or biking to reduce emissions to zero.`;
    } else if (transportType === "Bike") {
      return `🌟 Great choice! Biking keeps you healthy and produces zero emissions.`;
    } else if (transportType === "Walk") {
      return `🌟 Excellent! Walking is the most eco-friendly option with zero carbon footprint.`;
    }
  }

  if (transportType === "Car") {
    return `💡 Eco Tip: Consider taking the bus or train instead. You could reduce emissions by up to ${((EMISSION_FACTORS.Car - EMISSION_FACTORS.Train) * distance).toFixed(2)} kg CO2!`;
  } else if (transportType === "Bus") {
    return `👍 Good choice! Buses are more eco-friendly than cars. Consider train for even lower emissions.`;
  } else if (transportType === "Train") {
    return `🌟 Excellent choice! Trains have the lowest emissions among motorized transport.`;
  } else if (transportType === "Bike") {
    return `🌟 Great choice! Biking keeps you healthy and produces zero emissions.`;
  } else if (transportType === "Walk") {
    return `🌟 Excellent! Walking is the most eco-friendly option with zero carbon footprint.`;
  }

  return "Keep making eco-conscious commute choices!";
};

// @desc    Log a new commute
// @route   POST /api/commute/log
// @access  Private
exports.logCommute = async (req, res) => {
  try {
    const { startLocation, destination, transportType, faculty, dayType } = req.body;
    const userId = req.user.id;

    // Validation
    if (!startLocation || !destination || !transportType || !faculty || !dayType) {
      return res.status(400).json({
        success: false,
        message: "Please provide start location, destination, transport type, faculty, and day type",
      });
    }

    if (!["Car", "Bus", "Train", "Bike", "Walk"].includes(transportType)) {
      return res.status(400).json({
        success: false,
        message: "Invalid transport type",
      });
    }

    // Geocode both locations
    const startCoords = await geocodeLocation(startLocation);
    const destCoords = await geocodeLocation(destination);

    // Calculate route
    const routeData = await calculateRoute(startCoords, destCoords, transportType);

    // Calculate emissions
    const emissionEstimate = routeData.distance * EMISSION_FACTORS[transportType];
    
    // Calculate CO2 saved compared to driving a car
    const carEmission = routeData.distance * EMISSION_FACTORS.Car;
    const co2Saved = Math.max(0, carEmission - emissionEstimate);

    // Generate eco suggestion
    const ecoSuggestion = generateEcoSuggestion(transportType, routeData.distance);

    // Save commute to database
    const commute = await Commute.create({
      userId,
      startLocation,
      destination,
      startCoords,
      destinationCoords: destCoords,
      transportType,
      faculty,
      dayType,
      distance: routeData.distance,
      duration: routeData.duration,
      emissionEstimate,
      ecoSuggestion,
    });

    // Also create a Trip record for admin statistics
    const transportModeMap = {
      Car: 'car',
      Bus: 'bus',
      Train: 'train',
      Bike: 'shuttle', // Map bike to shuttle for Trip model
      Walk: 'walking'
    };

    await Trip.create({
      user: userId,
      origin: startLocation,
      destination: destination,
      distance: routeData.distance,
      transportMode: transportModeMap[transportType],
      co2Saved: co2Saved
    });

    res.status(201).json({
      success: true,
      message: "Commute logged successfully",
      data: {
        ...commute.toObject(),
        co2Saved: co2Saved
      }
    });
  } catch (error) {
    console.error("Commute logging error:", error.message);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to log commute",
    });
  }
};

// @desc    Get user's commute history
// @route   GET /api/commute/history
// @access  Private
exports.getCommuteHistory = async (req, res) => {
  try {
    const userId = req.user.id;

    const commutes = await Commute.find({ userId })
      .sort({ createdAt: -1 })
      .select("-__v");

    res.status(200).json({
      success: true,
      count: commutes.length,
      data: commutes,
    });
  } catch (error) {
    console.error("Get commute history error:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve commute history",
    });
  }
};

// @desc    Autocomplete location suggestions
// @route   GET /api/commute/autocomplete
// @access  Private
exports.autocompleteLocation = async (req, res) => {
  try {
    const { query } = req.query;

    if (!query || query.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: "Query must be at least 2 characters",
      });
    }

    const response = await axios.get(
      "https://nominatim.openstreetmap.org/search",
      {
        params: {
          q: query,
          format: "json",
          limit: 8,
          addressdetails: 1,
          countrycodes: "lk",                          // Sri Lanka only
          viewbox: "79.5213,9.8315,81.8794,5.9169",   // Sri Lanka bounding box
          bounded: 0,                                  // prefer but don't strictly bound
        },
        headers: {
          "User-Agent": "SmartCommuteLogger/1.0",
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
    console.error("Autocomplete error:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to fetch location suggestions",
    });
  }
};

// @desc    Get emission summary for user
// @route   GET /api/commute/emission-summary
// @access  Private
exports.getEmissionSummary = async (req, res) => {
  try {
    const userId = req.user.id;

    const commutes = await Commute.find({ userId });

    const summary = {
      totalCommutes: commutes.length,
      totalDistance: 0,
      totalEmissions: 0,
      totalDuration: 0,
      transportBreakdown: {
        Car: { count: 0, emissions: 0, distance: 0 },
        Bus: { count: 0, emissions: 0, distance: 0 },
        Train: { count: 0, emissions: 0, distance: 0 },
        Bike: { count: 0, emissions: 0, distance: 0 },
        Walk: { count: 0, emissions: 0, distance: 0 },
      },
    };

    commutes.forEach((commute) => {
      summary.totalDistance += commute.distance;
      summary.totalEmissions += commute.emissionEstimate;
      summary.totalDuration += commute.duration;

      if (summary.transportBreakdown[commute.transportType]) {
        summary.transportBreakdown[commute.transportType].count += 1;
        summary.transportBreakdown[commute.transportType].emissions += commute.emissionEstimate;
        summary.transportBreakdown[commute.transportType].distance += commute.distance;
      }
    });

    // Round values for cleaner output
    summary.totalDistance = parseFloat(summary.totalDistance.toFixed(2));
    summary.totalEmissions = parseFloat(summary.totalEmissions.toFixed(2));
    summary.totalDuration = parseFloat(summary.totalDuration.toFixed(2));

    Object.keys(summary.transportBreakdown).forEach((type) => {
      summary.transportBreakdown[type].emissions = parseFloat(
        summary.transportBreakdown[type].emissions.toFixed(2)
      );
      summary.transportBreakdown[type].distance = parseFloat(
        summary.transportBreakdown[type].distance.toFixed(2)
      );
    });

    res.status(200).json({
      success: true,
      data: summary,
    });
  } catch (error) {
    console.error("Get emission summary error:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve emission summary",
    });
  }
};

// @desc    Predict next month emissions using adaptive prediction strategies
// @route   GET /api/commute/predict
// @access  Private
exports.predictEmission = async (req, res) => {
  try {
    const userId = req.user.id;

    // Aggregate monthly emission totals for the user
    const monthlyEmissions = await Commute.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(userId),
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
          },
          totalEmission: { $sum: "$emissionEstimate" },
          daysWithCommutes: { $sum: 1 }, // Count commute entries
        },
      },
      {
        $sort: {
          "_id.year": 1,
          "_id.month": 1,
        },
      },
    ]);

    let predictionResult;
    let historicalData = [];

    // Case 1: User has 2 or more complete months - Use Linear Regression
    if (monthlyEmissions.length >= 2) {
      historicalData = monthlyEmissions.map((entry, index) => ({
        month: index + 1,
        emission: parseFloat(entry.totalEmission.toFixed(2)),
        yearMonth: `${entry._id.year}-${String(entry._id.month).padStart(2, "0")}`,
      }));

      predictionResult = calculateLinearRegression(historicalData);
    } 
    // Case 2: User has exactly 1 complete month - Use Monthly Projection
    else if (monthlyEmissions.length === 1) {
      const singleMonthEmission = monthlyEmissions[0].totalEmission;
      
      historicalData = [{
        month: 1,
        emission: parseFloat(singleMonthEmission.toFixed(2)),
        yearMonth: `${monthlyEmissions[0]._id.year}-${String(monthlyEmissions[0]._id.month).padStart(2, "0")}`,
      }];

      predictionResult = calculateMonthlyProjection(singleMonthEmission);
    } 
    // Case 3: User has less than 1 month (partial data) - Use Daily Projection
    else {
      // Get all commutes to calculate daily average
      const allCommutes = await Commute.find({ userId });

      if (allCommutes.length === 0) {
        return res.status(400).json({
          success: false,
          message: "No commute data available. Please log at least one commute to see predictions.",
        });
      }

      // Calculate total emissions and unique days
      const totalEmission = allCommutes.reduce(
        (sum, commute) => sum + commute.emissionEstimate,
        0
      );

      // Get unique days with commutes
      const uniqueDays = new Set(
        allCommutes.map((commute) => 
          new Date(commute.createdAt).toISOString().split('T')[0]
        )
      );
      const daysLogged = uniqueDays.size;

      predictionResult = calculateDailyProjection(totalEmission, daysLogged);

      historicalData = [{
        daysLogged,
        totalEmission: parseFloat(totalEmission.toFixed(2)),
        dailyAverage: parseFloat((totalEmission / daysLogged).toFixed(2)),
      }];
    }

    // Categorize risk level
    const riskLevel = categorizeRisk(predictionResult.nextMonthPrediction);

    res.status(200).json({
      success: true,
      data: {
        predictedEmission: predictionResult.nextMonthPrediction,
        trend: predictionResult.trend,
        riskLevel,
        predictionType: predictionResult.predictionType,
        historicalData,
      },
    });
  } catch (error) {
    console.error("Predict emission error:", error.message);
    
    if (error.message.includes("Insufficient data")) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to predict emissions",
    });
  }
};

// @desc  Delete a single commute trip
// @route DELETE /api/commute/:id
// @access Private
exports.deleteCommute = async (req, res) => {
  try {
    const trip = await Commute.findById(req.params.id);
    if (!trip) {
      return res.status(404).json({ success: false, message: 'Trip not found' });
    }
    // Only the owner can delete
    if (trip.userId.toString() !== req.user.id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorised' });
    }
    await Commute.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: 'Trip deleted successfully' });
  } catch (error) {
    console.error('Delete commute error:', error.message);
    res.status(500).json({ success: false, message: 'Failed to delete trip' });
  }
};

// @desc  Update transport type of a commute trip
// @route PUT /api/commute/:id
// @access Private
exports.updateCommute = async (req, res) => {
  try {
    const { transportType } = req.body;
    const validTypes = ['Car', 'Bus', 'Train', 'Bike', 'Walk'];
    if (!transportType || !validTypes.includes(transportType)) {
      return res.status(400).json({ success: false, message: 'Invalid transport type' });
    }

    const trip = await Commute.findById(req.params.id);
    if (!trip) {
      return res.status(404).json({ success: false, message: 'Trip not found' });
    }
    if (trip.userId.toString() !== req.user.id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorised' });
    }

    // Recalculate emission with updated transport type
    const newEmission = EMISSION_FACTORS[transportType] * trip.distance;
    trip.transportType = transportType;
    trip.emissionEstimate = newEmission;
    await trip.save();

    res.status(200).json({ success: true, message: 'Trip updated successfully', data: trip });
  } catch (error) {
    console.error('Update commute error:', error.message);
    res.status(500).json({ success: false, message: 'Failed to update trip' });
  }
};
