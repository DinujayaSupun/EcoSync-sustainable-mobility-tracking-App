const CarbonRecord = require("../Models/carbonRecord");

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

const getAverageDailySaved = async (userId) => {
  const result = await CarbonRecord.aggregate([
    { $match: { userId } },
    {
      $group: {
        _id: {
          day: { $dayOfMonth: "$date" },
          month: { $month: "$date" },
          year: { $year: "$date" },
        },
        dailyTotal: { $sum: "$emissionSaved" },
      },
    },
  ]);

  if (result.length === 0) return 0;

  const total = result.reduce((sum, r) => sum + r.dailyTotal, 0);
  return total / result.length;
};

const forecastMonthlySavings = async (userId) => {
  const avgDaily = await getAverageDailySaved(userId);
  return avgDaily * 30;
};

const getUserPercentile = async (userId) => {
  const allUsers = await CarbonRecord.aggregate([
    {
      $group: {
        _id: "$userId",
        total: { $sum: "$emissionSaved" },
      },
    },
  ]);

  const currentUser = allUsers.find(u => u._id === userId);
  if (!currentUser) return 0;

  const sorted = allUsers.sort((a, b) => a.total - b.total);
  const rank = sorted.findIndex(u => u._id === userId);

  return Math.round((rank / sorted.length) * 100);
};

module.exports = {
  getUserTotalSaved,
  forecastMonthlySavings,
  getUserPercentile,
};
