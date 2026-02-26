const Badge = require("../models/Badge");
const UserBadge = require("../models/UserBadge");
const Trip = require("../models/Trip");

/**
 * Calculates user stats from Trip collection.
 */
async function getUserTripStats(userId) {
  const rows = await Trip.aggregate([
    { $match: { user: userId } },
    {
      $group: {
        _id: "$user",
        tripCount: { $sum: 1 },
        totalDistance: { $sum: "$distance" },
        totalCo2Saved: { $sum: "$co2Saved" },
      },
    },
  ]);

  const r = rows[0];
  return {
    tripCount: r?.tripCount || 0,
    totalDistance: r?.totalDistance || 0,
    totalCo2Saved: r?.totalCo2Saved || 0,
  };
}

/**
 * Checks if a badge should be awarded based on stats.
 */
function meetsCriteria(badge, stats) {
  switch (badge.type) {
    case "TRIP_COUNT":
      return stats.tripCount >= badge.threshold;
    case "TOTAL_DISTANCE":
      return stats.totalDistance >= badge.threshold;
    case "TOTAL_CO2_SAVED":
      return stats.totalCo2Saved >= badge.threshold;
    default:
      return false;
  }
}

/**
 * Awards a specific badge to a user (manual award).
 * Safe: duplicate protected by DB unique index + graceful handling.
 */
async function awardBadgeToUser(userId, badgeId) {
  // If already exists, return existing record (no error)
  const existing = await UserBadge.findOne({ userId, badgeId });
  if (existing) return { created: false, record: existing };

  const record = await UserBadge.create({ userId, badgeId, awardedAt: new Date() });
  return { created: true, record };
}

/**
 * Auto-evaluate and award all eligible badges for user.
 * Returns how many new badges were awarded.
 */
async function evaluateBadgesForUser(userId) {
  const stats = await getUserTripStats(userId);
  const badges = await Badge.find();

  let newAwards = 0;

  for (const badge of badges) {
    if (!meetsCriteria(badge, stats)) continue;

    const existing = await UserBadge.findOne({ userId, badgeId: badge._id });
    if (existing) continue;

    try {
      await UserBadge.create({ userId, badgeId: badge._id, awardedAt: new Date() });
      newAwards += 1;
    } catch (err) {
      // If unique index triggers due to race, ignore safely
      if (err?.code !== 11000) throw err;
    }
  }

  return { newAwards, stats };
}

module.exports = {
  getUserTripStats,
  awardBadgeToUser,
  evaluateBadgesForUser,
};