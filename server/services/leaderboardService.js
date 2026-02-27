const Trip = require("../models/Trip");
const User = require("../models/User");

function getDateRange(period) {
  const end = new Date();
  const start = new Date(end);

  switch (period) {
    case "daily":
      start.setDate(end.getDate() - 1);
      break;
    case "weekly":
      start.setDate(end.getDate() - 7);
      break;
    case "monthly":
      start.setMonth(end.getMonth() - 1);
      break;
    default:
      start.setDate(end.getDate() - 7);
  }

  return { start, end };
}

async function getLeaderboard({ period = "weekly", limit = 10 }) {
  const { start, end } = getDateRange(period);

  const rows = await Trip.aggregate([
    { $match: { tripDate: { $gte: start, $lte: end } } },
    {
      $group: {
        _id: "$user",
        totalCo2Saved: { $sum: "$co2Saved" },
        totalDistanceKm: { $sum: "$distance" },
        tripCount: { $sum: 1 },
      },
    },
    // fairness: require some activity
    { $match: { $or: [{ tripCount: { $gte: 2 } }, { totalDistanceKm: { $gte: 5 } }] } },
    { $sort: { totalCo2Saved: -1, totalDistanceKm: -1, tripCount: -1 } },
    { $limit: Number(limit) },
  ]);

  // Attach user names (simple approach)
  const userIds = rows.map((r) => r._id);
  const users = await User.find({ _id: { $in: userIds } }).select("name");
  const userMap = new Map(users.map((u) => [String(u._id), u.name]));

  const data = rows.map((r, idx) => ({
    rank: idx + 1,
    userId: r._id,
    name: userMap.get(String(r._id)) || "Unknown",
    totalCo2Saved: r.totalCo2Saved,
    totalDistanceKm: r.totalDistanceKm,
    tripCount: r.tripCount,
    ...(idx === 0 ? { title: "Weekly Champion" } : {}),
  }));

  return data;
}

module.exports = { getLeaderboard };