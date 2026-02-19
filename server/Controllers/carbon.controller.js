const CarbonRecord = require("../models/carbonRecord");
const {
  calculateEmissionSaved,
  getGreenestOption,
} = require("../services/carbon.service");

const {
  getUserTotalSaved,
  forecastMonthlySavings,
  getUserPercentile,
} = require("../services/analytics.service");

// CREATE
const createCarbonRecord = async (req, res, next) => {
  try {
    const { userId, vehicleType, distance } = req.body;

    const emissionSaved = calculateEmissionSaved(vehicleType, distance);
    const recommendation = getGreenestOption(distance);

    const record = await CarbonRecord.create({
      userId,
      vehicleType,
      distance,
      emissionSaved,
    });

    res.status(201).json({
      success: true,
      record,
      recommendation,
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

    let updateData = {};

    if (vehicleType && distance !== undefined) {
      const emissionSaved = calculateEmissionSaved(vehicleType, distance);
      updateData = { vehicleType, distance, emissionSaved };
    }

    const updatedRecord = await CarbonRecord.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    );

    if (!updatedRecord) {
      return res.status(404).json({
        success: false,
        message: "Carbon record not found",
      });
    }

    res.json({
      success: true,
      message: "Carbon record updated successfully",
      updatedRecord,
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
