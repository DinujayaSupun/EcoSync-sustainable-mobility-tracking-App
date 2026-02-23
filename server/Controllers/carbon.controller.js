const CarbonRecord = require("../models/carbonRecord");

const {
  getUserTotalSaved,
  forecastMonthlySavings,
  getUserPercentile,
} = require("../services/analytics.service");

// CREATE
const {
  calculateEmission,
  calculateEmissionSaved,
  calculateEfficiencyScore,
  generateRecommendation,
  compareAllOptions,
} = require("../services/carbon.service");

// CREATE + CALCULATE
const createCarbonRecord = async (req, res, next) => {
  try {
    const { userId, vehicleType, distance } = req.body;

    // 1️⃣ Calculate emission produced
    const emissionProduced = calculateEmission(vehicleType, distance);

    // 2️⃣ Calculate emission saved vs worst option
    const emissionSaved = calculateEmissionSaved(vehicleType, distance);

    // 3️⃣ Calculate efficiency score
    const efficiencyScore = calculateEfficiencyScore(
      emissionProduced,
      distance,
    );

    // 4️⃣ Generate recommendation
    const recommendation = generateRecommendation(vehicleType, distance);

    // 5️⃣ Compare all transport options
    const comparison = compareAllOptions(vehicleType, distance);

    // 6️⃣ Save record in DB
    const record = await CarbonRecord.create({
      userId,
      vehicleType,
      distance,
      emissionProduced,
      emissionSaved,
    });

    res.status(201).json({
      success: true,
      message: "Carbon record created successfully",
      record,
      analytics: {
        emissionProduced,
        emissionSaved,
        efficiencyScore,
        recommendation,
        comparison,
      },
    });
  } catch (err) {
    next(err);
  }
};

// READ - All records for a user
const getUserRecords = async (req, res, next) => {
  try {
    const { userId } = req.params;

    const records = await CarbonRecord.find({ userId });

    res.json({
      success: true,
      count: records.length,
      records,
    });
  } catch (err) {
    next(err);
  }
};

// READ - Single record by ID
const getRecordById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const record = await CarbonRecord.findById(id);

    if (!record) {
      return res.status(404).json({
        success: false,
        message: "Carbon record not found",
      });
    }

    res.json({
      success: true,
      record,
    });
  } catch (err) {
    next(err);
  }
};

// UPDATE
const updateRecord = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { vehicleType, distance } = req.body;

    const record = await CarbonRecord.findById(id);

    if (!record) {
      return res.status(404).json({
        success: false,
        message: "Carbon record not found",
      });
    }

    let updatedVehicle = vehicleType || record.vehicleType;
    let updatedDistance =
      distance !== undefined ? distance : record.distance;

    // Recalculate everything properly
    const emissionProduced = calculateEmission(
      updatedVehicle,
      updatedDistance
    );

    const emissionSaved = calculateEmissionSaved(
      updatedVehicle,
      updatedDistance
    );

    const efficiencyScore = calculateEfficiencyScore(
      emissionProduced,
      updatedDistance
    );

    record.vehicleType = updatedVehicle;
    record.distance = updatedDistance;
    record.emissionProduced = emissionProduced;
    record.emissionSaved = emissionSaved;
    record.efficiencyScore = efficiencyScore;

    await record.save();

    res.json({
      success: true,
      message: "Carbon record updated successfully",
      updatedRecord: record,
    });
  } catch (err) {
    next(err);
  }
};

// DELETE
const deleteRecord = async (req, res, next) => {
  try {
    const { id } = req.params;

    const deletedRecord = await CarbonRecord.findByIdAndDelete(id);

    if (!deletedRecord) {
      return res.status(404).json({
        success: false,
        message: "Carbon record not found",
      });
    }

    res.json({
      success: true,
      message: "Carbon record deleted successfully",
    });
  } catch (err) {
    next(err);
  }
};

// INSIGHTS (Analytics)
const getUserInsights = async (req, res, next) => {
  try {
    const { userId } = req.params;

    const totalSaved = await getUserTotalSaved(userId);
    const forecast = await forecastMonthlySavings(userId);
    const percentile = await getUserPercentile(userId);

    res.json({
      success: true,
      totalSaved,
      forecastMonthlySavings: forecast,
      socialPercentile: percentile,
      message: `You performed better than ${percentile}% of users`,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createCarbonRecord,
  getUserRecords,
  getRecordById,
  updateRecord,
  deleteRecord,
  getUserInsights,
};
