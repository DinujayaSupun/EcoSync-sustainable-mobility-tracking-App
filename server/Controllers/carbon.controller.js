const CarbonRecord = require("../Models/carbonRecord");
const {
  calculateEmissionSaved,
  getGreenestOption,
} = require("../Services/carbon.service");

const {
  getUserTotalSaved,
  forecastMonthlySavings,
  getUserPercentile,
} = require("../Services/analytics.service");

const createCarbonRecord = async (req, res) => {
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
      record,
      recommendation,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getUserInsights = async (req, res) => {
  try {
    const { userId } = req.params;

    const totalSaved = await getUserTotalSaved(userId);
    const forecast = await forecastMonthlySavings(userId);
    const percentile = await getUserPercentile(userId);

    res.json({
      totalSaved,
      forecastMonthlySavings: forecast,
      socialPercentile: percentile,
      message: `You performed better than ${percentile}% of users`,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  createCarbonRecord,
  getUserInsights,
};
