const Commute = require("../models/Commute");
const Trip = require("../models/Trip");
const User = require("../models/User");
const Challenge = require("../models/Challenges/challenges");
const Participation = require("../models/Challenges/participation.model");
const AchievementEvent = require("../models/AchievementEvent");
const axios = require("axios");
const mongoose = require("mongoose");

// For badge evaluation after logging a commute
const { evaluateBadgesForUser } = require("../services/badgeAwardService");

const {
  calculateLinearRegression,
  calculateMonthlyProjection,
  calculateDailyProjection,
  categorizeRisk,
} = require("../utils/prediction");

// Emission factors (kg CO2 per km)
const EMISSION_FACTORS = {
  Car: 0.192,
  Bus: 0.105,
  Train: 0.041,
  Bike: 0,
  Walk: 0,
};

const CHALLENGE_MODE_TO_COMMUTE_TYPE = {
  BUS: "Bus",
  TRAIN: "Train",
  BIKE: "Bike",
  WALK: "Walk",
  CAR: "Car",
  VAN: "Car",
};

const CHALLENGE_MODE_TO_ICON = {
  BUS: "directions_bus",
  TRAIN: "train",
  BIKE: "directions_bike",
  WALK: "directions_walk",
  CAR: "directions_car",
  VAN: "airport_shuttle",
};

async function persistAchievementEvents({ userId, commuteId, achievements }) {
  const ops = [];

  for (const badge of achievements.newBadges || []) {
    if (!badge?._id) continue;
    const eventKey = `badge:${userId}:${badge._id}`;

    ops.push({
      updateOne: {
        filter: { eventKey },
        update: {
          $setOnInsert: {
            user: userId,
            eventKey,
            type: "BADGE_EARNED",
            badge: badge._id,
            sourceCommute: commuteId,
            title: `Badge Earned: ${badge.name}`,
            message: badge.description || "You earned a new badge.",
            icon: "workspace_premium",
            metadata: {
              badgeName: badge.name,
              badgeType: badge.type,
              threshold: badge.threshold,
            },
          },
        },
        upsert: true,
      },
    });
  }

  for (const challenge of achievements.completedChallenges || []) {
    if (!challenge?._id) continue;
    const eventKey = `challenge_completed:${userId}:${challenge._id}`;

    ops.push({
      updateOne: {
        filter: { eventKey },
        update: {
          $setOnInsert: {
            user: userId,
            eventKey,
            type: "CHALLENGE_COMPLETED",
            challenge: challenge._id,
            sourceCommute: commuteId,
            title: `Challenge Completed: ${challenge.title}`,
            message: `Reward: +${challenge.rewardPoints || 0} points`,
            icon: challenge.icon || "emoji_events",
            metadata: {
              challengeTitle: challenge.title,
              rewardPoints: challenge.rewardPoints || 0,
              transportMode: challenge.transportMode,
            },
          },
        },
        upsert: true,
      },
    });
  }

  if (!ops.length) return 0;

  const result = await AchievementEvent.bulkWrite(ops, { ordered: false });
  return result.upsertedCount || 0;
}

async function updateChallengeProgressForCommute({ userId, commute }) {
  const progressedChallenges = [];
  const completedChallenges = [];

  const participationDocs = await Participation.find({
    user: userId,
    status: "ACTIVE",
  }).populate("challenge");

  for (const participation of participationDocs) {
    const challenge = participation.challenge;

    if (!challenge) continue;
    if (challenge.isDeleted) continue;
    if (challenge.status !== "ACTIVE") continue;

    if (
      challenge.deadline &&
      new Date(challenge.deadline).getTime() < Date.now()
    ) {
      challenge.status = "EXPIRED";
      await challenge.save();
      continue;
    }

    const mappedTransportType =
      CHALLENGE_MODE_TO_COMMUTE_TYPE[challenge.transportMode];
    if (mappedTransportType && mappedTransportType !== commute.transportType) {
      continue;
    }

    const progressIncrement = Number(commute.co2Saved || 0);
    if (progressIncrement <= 0) continue;

    const previousProgress = Number(participation.progress || 0);
    const updatedProgress = previousProgress + progressIncrement;

    participation.progress = updatedProgress;
    participation.lastAutoSyncAt = commute.createdAt || new Date();

    const hasCompletedNow =
      updatedProgress >= Number(challenge.emissionTarget || 0);
    if (hasCompletedNow) {
      participation.status = "COMPLETED";

      if (!participation.rewardGranted) {
        participation.rewardGranted = true;
        participation.rewardedPoints = challenge.rewardPoints || 0;
        participation.rewardGrantedAt = new Date();
      }
    }

    await participation.save();

    progressedChallenges.push({
      _id: challenge._id,
      title: challenge.title,
      progressBefore: previousProgress,
      progressAfter: updatedProgress,
      increment: progressIncrement,
      emissionTarget: challenge.emissionTarget,
      icon: CHALLENGE_MODE_TO_ICON[challenge.transportMode] || "emoji_events",
      transportMode: challenge.transportMode,
    });

    if (hasCompletedNow) {
      completedChallenges.push({
        _id: challenge._id,
        title: challenge.title,
        rewardPoints: challenge.rewardPoints || 0,
        icon: CHALLENGE_MODE_TO_ICON[challenge.transportMode] || "emoji_events",
        transportMode: challenge.transportMode,
      });
    }
  }

  return { progressedChallenges, completedChallenges };
}
// Small eco-driving credit for car users (kg CO2 saved per km).
// This allows car trips to contribute a small positive value.
const CAR_ECO_CREDIT_PER_KM = 0.005;

// Centralized CO2 saved calculation used across create/update/recalculate flows.
const calculateCo2Saved = (distance, emissionEstimate, transportType) => {
  const carEmission = distance * EMISSION_FACTORS.Car;

  if (transportType === "Car") {
    return parseFloat((distance * CAR_ECO_CREDIT_PER_KM).toFixed(4));
  }

  return parseFloat(Math.max(0, carEmission - emissionEstimate).toFixed(4));
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
      },
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

// Haversine formula to calculate straight-line distance between two coordinates
// This formula accounts for the curvature of the Earth
// Formula: a = sin²(Δlat/2) + cos(lat1) * cos(lat2) * sin²(Δlon/2)
//          c = 2 * atan2(√a, √(1−a))
//          d = R * c
const haversineDistance = (startCoords, destCoords) => {
  const R = 6371; // Earth's mean radius in kilometers

  // Convert latitude difference from degrees to radians
  // Δlat = lat2 - lat1, then converted to radians by * (π/180)
  const dLat = ((destCoords.lat - startCoords.lat) * Math.PI) / 180;

  // Convert longitude difference from degrees to radians
  const dLon = ((destCoords.lon - startCoords.lon) * Math.PI) / 180;

  // Haversine formula component 'a':
  // sin²(Δlat/2) + cos(lat1) * cos(lat2) * sin²(Δlon/2)
  // This gives the square of half the chord length between the two points
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) + // sin²(Δlat/2)
    Math.cos((startCoords.lat * Math.PI) / 180) * // cos(lat1) in radians
      Math.cos((destCoords.lat * Math.PI) / 180) * // cos(lat2) in radians
      Math.sin(dLon / 2) * // sin(Δlon/2)
      Math.sin(dLon / 2); // squared

  // Angular distance in radians using atan2 for numerical stability
  // c = 2 * atan2(√a, √(1−a)) — the central angle between the two points
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  // Final distance = Earth's radius * central angle
  return R * c; // Result in kilometers
};

// Estimate travel duration based on transport type and distance
// Uses average real-world speeds (km/h) for each transport mode
const estimateDuration = (distance, transportType) => {
  // Average speeds in km/h for each transport type
  // Car: city driving average | Bus: including stops | Train: regional rail
  // Bike: cycling pace | Walk: average walking pace
  const speedMap = { Car: 50, Bus: 35, Train: 60, Bike: 15, Walk: 5 };

  // Use the mapped speed, default to 30 km/h if transport type is unknown
  const speed = speedMap[transportType] || 30;

  // Duration formula: time = distance / speed  →  then * 60 to convert hours → minutes
  // Example: 10 km by Car = (10 / 50) * 60 = 12 minutes
  return (distance / speed) * 60; // Result in minutes
};

// Helper function to calculate route using OSRM API (with Haversine fallback)
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
      timeout: 8000, // 8 second timeout
    });

    if (
      response.data &&
      response.data.routes &&
      response.data.routes.length > 0
    ) {
      const route = response.data.routes[0];
      return {
        // OSRM returns distance in meters → divide by 1000 to get kilometers
        distance: route.distance / 1000,
        // OSRM returns duration in seconds → divide by 60 to get minutes
        duration: route.duration / 60,
        source: "osrm",
      };
    } else {
      throw new Error("Route not found");
    }
  } catch (error) {
    // Fallback: use Haversine straight-line distance when OSRM fails
    console.warn(`OSRM failed (${error.message}), using Haversine fallback.`);

    // Step 1: Calculate straight-line distance using Haversine formula
    const distance = haversineDistance(startCoords, destCoords);

    // Step 2: Apply a road detour factor of 1.3
    // Real road distances are typically ~30% longer than straight-line distance
    // e.g. straight-line = 10 km → road estimate = 13 km
    const adjustedDistance = distance * 1.3;

    // Step 3: Estimate travel time using average speed for transport type
    const duration = estimateDuration(adjustedDistance, transportType);

    return {
      // Round to 2 decimal places for cleaner output
      distance: parseFloat(adjustedDistance.toFixed(2)),
      duration: parseFloat(duration.toFixed(2)),
      source: "haversine_fallback",
    };
  }
};

// Helper function to generate eco-friendly suggestions
const generateEcoSuggestion = (transportType, distance) => {
  if (distance < 2) {
    if (
      transportType === "Car" ||
      transportType === "Bus" ||
      transportType === "Train"
    ) {
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
    const {
      startLocation,
      destination,
      transportType,
      faculty,
      dayType,
      startLat,
      startLon,
      destLat,
      destLon,
    } = req.body;
    const userId = req.user.id;

    // Validation
    if (
      !startLocation ||
      !destination ||
      !transportType ||
      !faculty ||
      !dayType
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Please provide start location, destination, transport type, faculty, and day type",
      });
    }

    if (!["Car", "Bus", "Train", "Bike", "Walk"].includes(transportType)) {
      return res.status(400).json({
        success: false,
        message: "Invalid transport type",
      });
    }

    const hasStartCoords =
      Number.isFinite(Number(startLat)) && Number.isFinite(Number(startLon));
    const hasDestCoords =
      Number.isFinite(Number(destLat)) && Number.isFinite(Number(destLon));

    // Use exact coordinates from client when available (GPS/autocomplete), otherwise geocode text.
    const startCoords = hasStartCoords
      ? { lat: Number(startLat), lon: Number(startLon) }
      : await geocodeLocation(startLocation);

    const destCoords = hasDestCoords
      ? { lat: Number(destLat), lon: Number(destLon) }
      : await geocodeLocation(destination);

    // Calculate route
    const routeData = await calculateRoute(
      startCoords,
      destCoords,
      transportType,
    );

    // Calculate CO2 emissions for this trip
    // Formula: emissions (kg CO2) = distance (km) × emission factor (kg CO2/km)
    // Example: 10 km by Car = 10 × 0.192 = 1.92 kg CO2
    const emissionEstimate =
      routeData.distance * EMISSION_FACTORS[transportType];

    // Calculate CO2 saved. Car trips receive a small eco-driving credit.
    const co2Saved = calculateCo2Saved(
      routeData.distance,
      emissionEstimate,
      transportType,
    );

    // Generate eco suggestion
    const ecoSuggestion = generateEcoSuggestion(
      transportType,
      routeData.distance,
    );

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
      co2Saved: co2Saved,
      ecoSuggestion,
    });

    // Update user's total CO2 saved
    await User.findByIdAndUpdate(
      userId,
      { $inc: { total_co2_saved: co2Saved } },
      { new: true },
    );

    // Also create a Trip record for admin statistics
    const transportModeMap = {
      Car: "car",
      Bus: "bus",
      Train: "train",
      Bike: "shuttle", // Map bike to shuttle for Trip model
      Walk: "walking",
    };

    await Trip.create({
      user: userId,
      origin: startLocation,
      destination: destination,
      distance: routeData.distance,
      transportMode: transportModeMap[transportType],
      co2Saved: co2Saved,
    });

    const achievements = {
      newBadges: [],
      progressedChallenges: [],
      completedChallenges: [],
    };

    // Auto-update challenge progress from this commute (do NOT fail commute if challenge logic fails)
    try {
      const challengeResult = await updateChallengeProgressForCommute({
        userId,
        commute,
      });
      achievements.progressedChallenges = challengeResult.progressedChallenges;
      achievements.completedChallenges = challengeResult.completedChallenges;
    } catch (e) {
      console.warn(
        "Challenge progress sync failed during commute log:",
        e.message,
      );
    }

    //Auto-award badges (do NOT fail commute if badge logic fails)
    try {
      const badgeResult = await evaluateBadgesForUser(userId);
      achievements.newBadges = badgeResult.awardedBadges || [];
    } catch (e) {
      console.warn("Badge evaluation failed:", e.message);
    }

    achievements.hasAny =
      achievements.newBadges.length > 0 ||
      achievements.completedChallenges.length > 0;

    // Persist earned achievements in a dedicated collection (idempotent upserts).
    try {
      const insertedEvents = await persistAchievementEvents({
        userId,
        commuteId: commute._id,
        achievements,
      });
      achievements.persistedEvents = insertedEvents;
    } catch (e) {
      console.warn("Achievement event persistence failed:", e.message);
    }

    res.status(201).json({
      success: true,
      message: "Commute logged successfully",
      distanceSource:
        routeData.source === "haversine_fallback"
          ? "Estimated (straight-line x1.3 road factor)"
          : "OSRM routing",
      data: {
        ...commute.toObject(),
        co2Saved: co2Saved,
      },
      achievements,
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

// @desc    Get public footer stats
// @route   GET /api/commute/footer-stats
// @access  Public
exports.getFooterStats = async (req, res) => {
  try {
    const [activeUserIds, co2Aggregate, activeChallenges] = await Promise.all([
      Commute.distinct("userId"),
      Commute.aggregate([
        {
          $group: {
            _id: null,
            totalCO2Saved: { $sum: "$co2Saved" },
          },
        },
      ]),
      Challenge.countDocuments({ isDeleted: false, status: "ACTIVE" }),
    ]);

    const totalCO2Saved = co2Aggregate[0]?.totalCO2Saved || 0;

    res.status(200).json({
      success: true,
      data: {
        activeUsers: activeUserIds.length,
        totalCO2Saved: parseFloat(totalCO2Saved.toFixed(2)),
        activeChallenges,
      },
    });
  } catch (error) {
    console.error("Get footer stats error:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve footer stats",
      data: {
        activeUsers: 0,
        totalCO2Saved: 0,
        activeChallenges: 0,
      },
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
          countrycodes: "lk", // Sri Lanka only
          viewbox: "79.5213,9.8315,81.8794,5.9169", // Sri Lanka bounding box
          bounded: 0, // prefer but don't strictly bound
        },
        headers: {
          "User-Agent": "SmartCommuteLogger/1.0",
        },
      },
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

    // Loop through each commute record and accumulate totals
    commutes.forEach((commute) => {
      // Running total of all kilometres travelled across all commutes
      summary.totalDistance += commute.distance;

      // Running total of all CO2 emissions (kg) across all commutes
      summary.totalEmissions += commute.emissionEstimate;

      // Running total of all travel time (minutes) across all commutes
      summary.totalDuration += commute.duration;

      // Break down stats per transport type (Car, Bus, Train, Bike, Walk)
      if (summary.transportBreakdown[commute.transportType]) {
        // Increment trip count for this transport type
        summary.transportBreakdown[commute.transportType].count += 1;

        // Accumulate emissions for this transport type
        summary.transportBreakdown[commute.transportType].emissions +=
          commute.emissionEstimate;

        // Accumulate distance for this transport type
        summary.transportBreakdown[commute.transportType].distance +=
          commute.distance;
      }
    });

    // Round all totals to 2 decimal places to avoid floating-point noise
    // e.g. 1.0000000001 becomes 1.00
    summary.totalDistance = parseFloat(summary.totalDistance.toFixed(2));
    summary.totalEmissions = parseFloat(summary.totalEmissions.toFixed(2));
    summary.totalDuration = parseFloat(summary.totalDuration.toFixed(2));

    // Round per-transport breakdown values as well
    Object.keys(summary.transportBreakdown).forEach((type) => {
      summary.transportBreakdown[type].emissions = parseFloat(
        summary.transportBreakdown[type].emissions.toFixed(2),
      );
      summary.transportBreakdown[type].distance = parseFloat(
        summary.transportBreakdown[type].distance.toFixed(2),
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

    // ── PREDICTION STRATEGY SELECTION ──────────────────────────────────────────
    // We use different algorithms depending on how much historical data exists.
    // More data = more accurate predictions.

    // Case 1: User has 2 or more complete months → Use Linear Regression
    // Linear Regression fits a straight line through monthly data points
    // and extrapolates the next value: y = mx + b
    // More months = more accurate slope (trend) calculation
    if (monthlyEmissions.length >= 2) {
      // Map MongoDB aggregate results into clean { month, emission, yearMonth } objects
      // 'index + 1' gives sequential month numbers (1, 2, 3...) for regression x-axis
      historicalData = monthlyEmissions.map((entry, index) => ({
        month: index + 1, // x-axis: month sequence
        emission: parseFloat(entry.totalEmission.toFixed(2)), // y-axis: total CO2 that month
        yearMonth: `${entry._id.year}-${String(entry._id.month).padStart(2, "0")}`, // label e.g. "2026-01"
      }));

      // Pass formatted data to linear regression utility
      // Returns: { nextMonthPrediction, trend (up/down/stable), predictionType }
      predictionResult = calculateLinearRegression(historicalData);
    }
    // Case 2: User has exactly 1 complete month → Use Monthly Projection
    // Cannot calculate a trend with one point, so we project forward
    // based on the single available month's total
    else if (monthlyEmissions.length === 1) {
      const singleMonthEmission = monthlyEmissions[0].totalEmission;

      historicalData = [
        {
          month: 1,
          emission: parseFloat(singleMonthEmission.toFixed(2)),
          yearMonth: `${monthlyEmissions[0]._id.year}-${String(monthlyEmissions[0]._id.month).padStart(2, "0")}`,
        },
      ];

      // Uses the single month as a baseline and projects the same value forward
      predictionResult = calculateMonthlyProjection(singleMonthEmission);
    }
    // Case 3: User has less than 1 month of data → Use Daily Projection
    // Not enough monthly data, so calculate a daily average
    // and scale it up to a full 30-day month
    else {
      // Fetch all individual commute records for the user
      const allCommutes = await Commute.find({ userId });

      if (allCommutes.length === 0) {
        return res.status(400).json({
          success: false,
          message:
            "No commute data available. Please log at least one commute to see predictions.",
        });
      }

      // Sum all emissions across all commutes using reduce
      // reduce(accumulator, currentValue) → starts at 0, adds each emissionEstimate
      const totalEmission = allCommutes.reduce(
        (sum, commute) => sum + commute.emissionEstimate,
        0, // initial accumulator value
      );

      // Use a Set to count unique calendar days that had commutes
      // Converts each date to "YYYY-MM-DD" string (drops time), Set removes duplicates
      // e.g. 3 trips on same day still counts as 1 day
      const uniqueDays = new Set(
        allCommutes.map(
          (commute) => new Date(commute.createdAt).toISOString().split("T")[0],
        ),
      );
      const daysLogged = uniqueDays.size; // number of unique days with commute activity

      // Project: dailyAverage = totalEmission / daysLogged
      //          monthlyEstimate = dailyAverage * 30
      predictionResult = calculateDailyProjection(totalEmission, daysLogged);

      historicalData = [
        {
          daysLogged,
          totalEmission: parseFloat(totalEmission.toFixed(2)),
          // dailyAverage = total / days → rounded to 2dp
          dailyAverage: parseFloat((totalEmission / daysLogged).toFixed(2)),
        },
      ];
    }

    // Categorize the predicted emission into a risk level (Low / Medium / High)
    // based on predefined CO2 thresholds in the categorizeRisk utility
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
      return res
        .status(404)
        .json({ success: false, message: "Trip not found" });
    }
    // Only the owner can delete
    if (trip.userId.toString() !== req.user.id.toString()) {
      return res
        .status(403)
        .json({ success: false, message: "Not authorised" });
    }

    // Subtract the co2Saved from user's total before deleting
    const co2SavedValue = trip.co2Saved || 0;
    await User.findByIdAndUpdate(
      trip.userId,
      { $inc: { total_co2_saved: -co2SavedValue } },
      { new: true },
    );

    await Commute.findByIdAndDelete(req.params.id);
    res
      .status(200)
      .json({ success: true, message: "Trip deleted successfully" });
  } catch (error) {
    console.error("Delete commute error:", error.message);
    res.status(500).json({ success: false, message: "Failed to delete trip" });
  }
};

// @desc  Update transport type of a commute trip
// @route PUT /api/commute/:id
// @access Private
exports.updateCommute = async (req, res) => {
  try {
    const { transportType } = req.body;
    const validTypes = ["Car", "Bus", "Train", "Bike", "Walk"];
    if (!transportType || !validTypes.includes(transportType)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid transport type" });
    }

    const trip = await Commute.findById(req.params.id);
    if (!trip) {
      return res
        .status(404)
        .json({ success: false, message: "Trip not found" });
    }
    if (trip.userId.toString() !== req.user.id.toString()) {
      return res
        .status(403)
        .json({ success: false, message: "Not authorised" });
    }

    // Preserve existing CO2 saved value if it exists
    // Only recalculate if the transport type is being changed
    const oldCo2Saved = trip.co2Saved || 0;
    const oldTransportType = trip.transportType;

    let newCo2Saved = oldCo2Saved; // Default: preserve existing value

    // Only recalculate CO2 saved if transport type is actually changing
    if (oldTransportType !== transportType) {
      // Recalculate emission using the new transport type
      // Formula: emissions (kg CO2) = distance (km) × emission factor (kg CO2/km)
      // e.g. switching from Car (0.192) to Train (0.041) on a 10 km trip:
      //      old = 10 × 0.192 = 1.92 kg CO2
      //      new = 10 × 0.041 = 0.41 kg CO2  → saves 1.51 kg CO2
      const newEmission = EMISSION_FACTORS[transportType] * trip.distance;

      // Calculate new co2Saved using the shared rule set.
      newCo2Saved = calculateCo2Saved(
        trip.distance,
        newEmission,
        transportType,
      );

      // Update the trip document fields with new values
      trip.transportType = transportType;
      trip.emissionEstimate = newEmission;
      trip.co2Saved = newCo2Saved;

      // Persist the updated document to MongoDB
      await trip.save();

      // Update user's total co2Saved with the difference
      const co2Difference = newCo2Saved - oldCo2Saved;
      await User.findByIdAndUpdate(
        trip.userId,
        { $inc: { total_co2_saved: co2Difference } },
        { new: true },
      );

      res.status(200).json({
        success: true,
        message: "Trip updated successfully",
        data: trip,
        co2DataPreserved: false,
        co2Recalculated: true,
      });
    } else {
      // Transport type not changed, no update needed
      res.status(200).json({
        success: true,
        message: "No changes made - same transport type",
        data: trip,
        co2DataPreserved: true,
        co2Recalculated: false,
      });
    }
  } catch (error) {
    console.error("Update commute error:", error.message);
    res.status(500).json({ success: false, message: "Failed to update trip" });
  }
};

// @desc  Recalculate total CO2 saved for user (for data migration)
// @route POST /api/commute/recalculate-co2
// @access Private
exports.recalculateCo2Saved = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get all commutes for this user
    const commutes = await Commute.find({ userId });

    let totalCo2Saved = 0;

    // Recalculate co2Saved only when value is truly missing.
    // This preserves existing stored values, including valid 0 entries.
    for (let commute of commutes) {
      if (commute.co2Saved === null || commute.co2Saved === undefined) {
        const co2Saved = calculateCo2Saved(
          commute.distance,
          commute.emissionEstimate,
          commute.transportType,
        );
        commute.co2Saved = co2Saved;
        await commute.save();
      }
      totalCo2Saved += commute.co2Saved;
    }

    // Update user's total
    const user = await User.findByIdAndUpdate(
      userId,
      { total_co2_saved: parseFloat(totalCo2Saved.toFixed(2)) },
      { new: true },
    );

    res.status(200).json({
      success: true,
      message: "CO2 saved values recalculated successfully",
      data: {
        userId,
        totalCo2Saved: user.total_co2_saved,
        commutesProcessed: commutes.length,
      },
    });
  } catch (error) {
    console.error("Recalculate CO2 error:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to recalculate CO2 saved",
    });
  }
};

// @desc  Get CO2 savings breakdown by transport mode
// @route GET /api/commute/co2-savings-by-mode
// @access Private
exports.getCO2SavingsByTransportMode = async (req, res) => {
  try {
    const userId = req.user.id;

    // Aggregate CO2 savings by transport type
    const co2SavingsByMode = await Commute.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(userId),
        },
      },
      {
        $group: {
          _id: "$transportType",
          count: { $sum: 1 },
          totalCO2Saved: { $sum: "$co2Saved" },
          totalEmissions: { $sum: "$emissionEstimate" },
          totalDistance: { $sum: "$distance" },
          avgCO2PerKm: { $avg: "$emissionEstimate" },
        },
      },
      {
        $sort: { totalCO2Saved: -1 },
      },
    ]);

    // Format results with precision
    const formatted = co2SavingsByMode.map((mode) => ({
      transportType: mode._id,
      count: mode.count,
      totalCO2Saved: parseFloat(mode.totalCO2Saved.toFixed(2)),
      totalEmissions: parseFloat(mode.totalEmissions.toFixed(2)),
      totalDistance: parseFloat(mode.totalDistance.toFixed(2)),
      avgCO2PerKm: parseFloat(mode.avgCO2PerKm.toFixed(4)),
    }));

    res.status(200).json({
      success: true,
      data: formatted,
    });
  } catch (error) {
    console.error("Get CO2 savings by mode error:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve CO2 savings breakdown",
    });
  }
};

// @desc  Get car usage and CO2 savings impact
// @route GET /api/commute/car-usage-impact
// @access Private
exports.getCarUsageImpact = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get all commutes for this user
    const commutes = await Commute.find({ userId }).sort({ createdAt: -1 });

    // Calculate car usage statistics
    let carUsageStats = {
      totalCarTrips: 0,
      totalCarDistance: 0,
      totalCarEmissions: 0,
      carUsagePercentage: 0,
      co2SavedByUsingAlternatives: 0,
      monthlyCarStats: {},
    };

    // Track monthly car usage
    const monthlyStats = {};

    commutes.forEach((commute) => {
      // Get month key for grouping
      const monthKey = new Date(commute.createdAt)
        .toISOString()
        .substring(0, 7); // YYYY-MM

      if (!monthlyStats[monthKey]) {
        monthlyStats[monthKey] = {
          month: monthKey,
          carTrips: 0,
          carDistance: 0,
          carEmissions: 0,
          alternativeTrips: 0,
          co2Saved: 0,
        };
      }

      if (commute.transportType === "Car") {
        // Car usage stats
        carUsageStats.totalCarTrips += 1;
        carUsageStats.totalCarDistance += commute.distance;
        carUsageStats.totalCarEmissions += commute.emissionEstimate;

        // Monthly car stats
        monthlyStats[monthKey].carTrips += 1;
        monthlyStats[monthKey].carDistance += commute.distance;
        monthlyStats[monthKey].carEmissions += commute.emissionEstimate;
      } else {
        // Alternative transport usage
        monthlyStats[monthKey].alternativeTrips += 1;
        monthlyStats[monthKey].co2Saved += commute.co2Saved;
        carUsageStats.co2SavedByUsingAlternatives += commute.co2Saved;
      }
    });

    // Calculate car usage percentage
    if (commutes.length > 0) {
      carUsageStats.carUsagePercentage = parseFloat(
        ((carUsageStats.totalCarTrips / commutes.length) * 100).toFixed(2),
      );
    }

    // Round all values
    carUsageStats.totalCarDistance = parseFloat(
      carUsageStats.totalCarDistance.toFixed(2),
    );
    carUsageStats.totalCarEmissions = parseFloat(
      carUsageStats.totalCarEmissions.toFixed(2),
    );
    carUsageStats.co2SavedByUsingAlternatives = parseFloat(
      carUsageStats.co2SavedByUsingAlternatives.toFixed(2),
    );

    // Format monthly stats
    const formattedMonthlyStats = Object.keys(monthlyStats)
      .sort()
      .reverse()
      .map((month) => ({
        month: monthlyStats[month].month,
        carTrips: monthlyStats[month].carTrips,
        carDistance: parseFloat(monthlyStats[month].carDistance.toFixed(2)),
        carEmissions: parseFloat(monthlyStats[month].carEmissions.toFixed(2)),
        alternativeTrips: monthlyStats[month].alternativeTrips,
        co2Saved: parseFloat(monthlyStats[month].co2Saved.toFixed(2)),
      }));

    res.status(200).json({
      success: true,
      data: {
        summary: carUsageStats,
        monthlyBreakdown: formattedMonthlyStats,
        totalTrips: commutes.length,
      },
    });
  } catch (error) {
    console.error("Get car usage impact error:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve car usage impact",
    });
  }
};
