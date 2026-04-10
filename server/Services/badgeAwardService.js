const mongoose = require("mongoose");
const Badge = require("../models/Badge");
const UserBadge = require("../models/UserBadge");
const Commute = require("../models/Commute");

/**
 * Convert userId string -> ObjectId safely
 */
function toObjectId(id) {
  if (!id) return null;
  if (id instanceof mongoose.Types.ObjectId) return id;
  if (!mongoose.Types.ObjectId.isValid(id)) return null;
  return new mongoose.Types.ObjectId(id);
}

/**
 * Calculates user stats from Commute collection.
 */
async function getUserTripStats(userId) {
  const userObjectId = toObjectId(userId);
  if (!userObjectId) {
    return { tripCount: 0, totalDistance: 0, totalCo2Saved: 0 };
  }

  const rows = await Commute.aggregate([
    { $match: { userId: userObjectId } },
    {
      $group: {
        _id: "$userId",
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
  const userObjectId = toObjectId(userId);
  const badgeObjectId = toObjectId(badgeId);

  if (!userObjectId || !badgeObjectId) {
    throw new Error("Invalid userId or badgeId");
  }

  const existing = await UserBadge.findOne({ userId: userObjectId, badgeId: badgeObjectId });
  if (existing) return { created: false, record: existing };

  const record = await UserBadge.create({
    userId: userObjectId,
    badgeId: badgeObjectId,
    awardedAt: new Date(),
  });

  return { created: true, record };
}

/**
 * Auto-evaluate and award all eligible badges for user.
 * Returns how many new badges were awarded + stats.
 */
async function evaluateBadgesForUser(userId) {
  const userObjectId = toObjectId(userId);
  if (!userObjectId) {
    return {
      newAwards: 0,
      awardedBadges: [],
      stats: { tripCount: 0, totalDistance: 0, totalCo2Saved: 0 },
    };
  }

  const stats = await getUserTripStats(userObjectId);
  const badges = await Badge.find();

  let newAwards = 0;
  const awardedBadges = [];

  for (const badge of badges) {
    if (!meetsCriteria(badge, stats)) continue;

    const existing = await UserBadge.findOne({ userId: userObjectId, badgeId: badge._id });
    if (existing) continue;

    try {
      await UserBadge.create({ userId: userObjectId, badgeId: badge._id, awardedAt: new Date() });
      newAwards += 1;
      awardedBadges.push({
        _id: badge._id,
        name: badge.name,
        description: badge.description,
        imageUrl: badge.imageUrl,
        type: badge.type,
        threshold: badge.threshold,
      });
    } catch (err) {
      // Ignore duplicates (race conditions)
      if (err?.code !== 11000) throw err;
    }
  }

  return { newAwards, awardedBadges, stats };
}

module.exports = {
  getUserTripStats,
  awardBadgeToUser,
  evaluateBadgesForUser,
};