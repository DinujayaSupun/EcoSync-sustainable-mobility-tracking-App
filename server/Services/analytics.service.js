const CarbonRecord = require("../Models/carbonRecord");

// Total CO2 saved by user
const getUserTotalSaved = async (userId) => {
  const result = await CarbonRecord.aggregate([
    { $match: { userId } },
    {
      $group: {
        _id: null,
        totalSaved: { $sum: "$emissionSaved" },
      },
    },
  ]);

  return result[0]?.totalSaved || 0;
};

// Average daily savings (using createdAt from timestamps)
const getAverageDailySaved = async (userId) => {
  const result = await CarbonRecord.aggregate([
    { $match: { userId } },
    {
      $group: {
        _id: {
          day: { $dayOfMonth: "$createdAt" },
          month: { $month: "$createdAt" },
          year: { $year: "$createdAt" },
        },
        dailyTotal: { $sum: "$emissionSaved" },
      },
    },
  ]);

  if (result.length === 0) return 0;

  const total = result.reduce((sum, r) => sum + r.dailyTotal, 0);

  return total / result.length;
};

// Forecast based on average daily savings
const forecastMonthlySavings = async (userId) => {
  const avgDaily = await getAverageDailySaved(userId);
  return Math.round(avgDaily * 30);
};

// Social percentile ranking
const getUserPercentile = async (userId) => {
  const allUsers = await CarbonRecord.aggregate([
    {
      $group: {
        _id: "$userId",
        total: { $sum: "$emissionSaved" },
      },
    },
  ]);

  if (allUsers.length === 0) return 0;

  const sorted = allUsers.sort((a, b) => a.total - b.total);

  const rank = sorted.findIndex((u) => u._id === userId);

  if (rank === -1) return 0;

  // Higher total = higher percentile
  const percentile = ((sorted.length - rank) / sorted.length) * 100;

  return Math.round(percentile);
};

module.exports = {
  getUserTotalSaved,
  forecastMonthlySavings,
  getUserPercentile,
};
