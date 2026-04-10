/*
  Standalone gamification seeder.
  - Seeds only badges + challenges.
  - Safe to remove without affecting runtime app behavior.
  - Runs only when explicitly executed.

  Usage:
    npm run seed:gamification
    npm run seed:gamification -- --reset
*/

require("dotenv").config();
const mongoose = require("mongoose");

const Badge = require("../models/Badge");
const Challenge = require("../models/challenges/challenges");
const User = require("../models/User");
const UserBadge = require("../models/UserBadge");
const Participation = require("../models/challenges/participation.model");

const shouldReset = process.argv.includes("--reset");

const BADGES = [
  {
    name: "First Green Ride",
    description: "Complete your first sustainable commute.",
    type: "TRIP_COUNT",
    threshold: 1,
    imageUrl:
      "https://images.unsplash.com/photo-1532339142463-fd0a8979791a?w=1200",
  },
  {
    name: "5 Trip Streak",
    description: "Complete 5 sustainable commutes.",
    type: "TRIP_COUNT",
    threshold: 5,
    imageUrl:
      "https://images.unsplash.com/photo-1502741338009-cac2772e18bc?w=1200",
  },
  {
    name: "10 Trip Streak",
    description: "Complete 10 sustainable commutes.",
    type: "TRIP_COUNT",
    threshold: 10,
    imageUrl:
      "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=1200",
  },
  {
    name: "Commute Consistency",
    description: "Complete 25 sustainable commutes.",
    type: "TRIP_COUNT",
    threshold: 25,
    imageUrl:
      "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1200",
  },
  {
    name: "Campus Road Warrior",
    description: "Complete 50 sustainable commutes.",
    type: "TRIP_COUNT",
    threshold: 50,
    imageUrl:
      "https://images.unsplash.com/photo-1465146344425-f00d5f5c8f07?w=1200",
  },

  {
    name: "Distance Starter",
    description: "Reach 20 km of sustainable travel.",
    type: "TOTAL_DISTANCE",
    threshold: 20,
    imageUrl:
      "https://images.unsplash.com/photo-1473448912268-2022ce9509d8?w=1200",
  },
  {
    name: "Distance Builder",
    description: "Reach 75 km of sustainable travel.",
    type: "TOTAL_DISTANCE",
    threshold: 75,
    imageUrl:
      "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=1200",
  },
  {
    name: "Distance Champion",
    description: "Reach 150 km of sustainable travel.",
    type: "TOTAL_DISTANCE",
    threshold: 150,
    imageUrl:
      "https://images.unsplash.com/photo-1493244040629-496f6d136cc3?w=1200",
  },
  {
    name: "Urban Explorer",
    description: "Reach 300 km of sustainable travel.",
    type: "TOTAL_DISTANCE",
    threshold: 300,
    imageUrl:
      "https://images.unsplash.com/photo-1472396961693-142e6e269027?w=1200",
  },
  {
    name: "Campus Navigator",
    description: "Reach 500 km of sustainable travel.",
    type: "TOTAL_DISTANCE",
    threshold: 500,
    imageUrl:
      "https://images.unsplash.com/photo-1446776877081-d282a0f896e2?w=1200",
  },

  {
    name: "CO2 Starter",
    description: "Save 10 kg of CO2.",
    type: "TOTAL_CO2_SAVED",
    threshold: 10,
    imageUrl:
      "https://images.unsplash.com/photo-1497436072909-60f360e1d4b1?w=1200",
  },
  {
    name: "CO2 Saver",
    description: "Save 30 kg of CO2.",
    type: "TOTAL_CO2_SAVED",
    threshold: 30,
    imageUrl:
      "https://images.unsplash.com/photo-1473773508845-188df298d2d1?w=1200",
  },
  {
    name: "CO2 Guardian",
    description: "Save 60 kg of CO2.",
    type: "TOTAL_CO2_SAVED",
    threshold: 60,
    imageUrl:
      "https://images.unsplash.com/photo-1511497584788-876760111969?w=1200",
  },
  {
    name: "Carbon Crusher",
    description: "Save 100 kg of CO2.",
    type: "TOTAL_CO2_SAVED",
    threshold: 100,
    imageUrl:
      "https://images.unsplash.com/photo-1465101162946-4377e57745c3?w=1200",
  },
  {
    name: "Net Zero Hero",
    description: "Save 200 kg of CO2.",
    type: "TOTAL_CO2_SAVED",
    threshold: 200,
    imageUrl:
      "https://images.unsplash.com/photo-1501004318641-b39e6451bec6?w=1200",
  },
];

const CHALLENGES = [
  {
    title: "Bike Week Sprint",
    description: "Use a bike for your regular campus trips this week.",
    tagline: "Swap engine power for pedal power.",
    transportMode: "BIKE",
    emissionTarget: 8,
    durationDays: 7,
    difficulty: "EASY",
    rewardPoints: 80,
    type: "INDIVIDUAL",
  },
  {
    title: "Walk To Class",
    description: "Walk for short-distance routes instead of motor transport.",
    tagline: "Short steps, long-term impact.",
    transportMode: "WALK",
    emissionTarget: 5,
    durationDays: 7,
    difficulty: "EASY",
    rewardPoints: 60,
    type: "INDIVIDUAL",
  },
  {
    title: "Bus Rider Momentum",
    description: "Use the bus consistently for daily commute.",
    tagline: "Shared rides, shared gains.",
    transportMode: "BUS",
    emissionTarget: 12,
    durationDays: 10,
    difficulty: "MEDIUM",
    rewardPoints: 100,
    type: "INDIVIDUAL",
  },
  {
    title: "Train Route Shift",
    description: "Shift your primary commute to train where possible.",
    tagline: "Rails over roads.",
    transportMode: "TRAIN",
    emissionTarget: 15,
    durationDays: 14,
    difficulty: "MEDIUM",
    rewardPoints: 120,
    type: "INDIVIDUAL",
  },
  {
    title: "No Solo Car Days",
    description: "Reduce solo car usage and use lower-emission options.",
    tagline: "Think before ignition.",
    transportMode: "CAR",
    emissionTarget: 10,
    durationDays: 10,
    difficulty: "MEDIUM",
    rewardPoints: 110,
    type: "INDIVIDUAL",
  },
  {
    title: "Van Pool Upgrade",
    description: "Use pooled van trips and optimize route sharing.",
    tagline: "Fill seats, cut emissions.",
    transportMode: "VAN",
    emissionTarget: 16,
    durationDays: 14,
    difficulty: "HARD",
    rewardPoints: 150,
    type: "SQUAD",
  },
  {
    title: "Green Week Relay",
    description: "Your squad completes mixed sustainable commutes in one week.",
    tagline: "Team effort, cleaner campus.",
    transportMode: "BUS",
    emissionTarget: 20,
    durationDays: 7,
    difficulty: "MEDIUM",
    rewardPoints: 140,
    type: "SQUAD",
  },
  {
    title: "Bike Commute Ladder",
    description: "Increase bike commute frequency every two days.",
    tagline: "Climb the eco ladder.",
    transportMode: "BIKE",
    emissionTarget: 18,
    durationDays: 14,
    difficulty: "HARD",
    rewardPoints: 170,
    type: "INDIVIDUAL",
  },
  {
    title: "Zero Emission Mornings",
    description: "Start your day with zero-emission modes.",
    tagline: "Morning habits matter.",
    transportMode: "WALK",
    emissionTarget: 14,
    durationDays: 10,
    difficulty: "MEDIUM",
    rewardPoints: 130,
    type: "INDIVIDUAL",
  },
  {
    title: "Public Transit Champion",
    description: "Complete a long streak of bus or train commutes.",
    tagline: "Consistency beats convenience.",
    transportMode: "TRAIN",
    emissionTarget: 25,
    durationDays: 21,
    difficulty: "HARD",
    rewardPoints: 220,
    type: "INDIVIDUAL",
  },
  {
    title: "Campus Car Cutback",
    description: "Replace at least half your car trips this period.",
    tagline: "Half the car, double the impact.",
    transportMode: "CAR",
    emissionTarget: 22,
    durationDays: 21,
    difficulty: "HARD",
    rewardPoints: 210,
    type: "INDIVIDUAL",
  },
  {
    title: "Squad Sustainability Push",
    description: "Squad challenge focused on total group CO2 savings.",
    tagline: "Win together, save together.",
    transportMode: "BUS",
    emissionTarget: 30,
    durationDays: 21,
    difficulty: "HARD",
    rewardPoints: 260,
    type: "SQUAD",
  },
];

function buildDeadline(durationDays) {
  const deadline = new Date();
  deadline.setDate(deadline.getDate() + Number(durationDays));
  return deadline;
}

async function seedBadges() {
  let inserted = 0;
  let updated = 0;

  for (const badge of BADGES) {
    const result = await Badge.updateOne(
      { name: badge.name },
      { $set: badge },
      { upsert: true },
    );

    if (result.upsertedCount > 0) inserted += 1;
    else if (result.modifiedCount > 0) updated += 1;
  }

  return { inserted, updated, total: BADGES.length };
}

async function seedChallenges(createdBy) {
  let inserted = 0;
  let updated = 0;

  for (const item of CHALLENGES) {
    const challengeDoc = {
      ...item,
      status: "ACTIVE",
      isDeleted: false,
      createdBy: createdBy || null,
      deadline: buildDeadline(item.durationDays),
    };

    const result = await Challenge.updateOne(
      { title: item.title },
      { $set: challengeDoc },
      { upsert: true },
    );

    if (result.upsertedCount > 0) inserted += 1;
    else if (result.modifiedCount > 0) updated += 1;
  }

  return { inserted, updated, total: CHALLENGES.length };
}

async function resetGamificationCollections() {
  await Participation.deleteMany({});
  await UserBadge.deleteMany({});
  await Challenge.deleteMany({});
  await Badge.deleteMany({});
}

async function run() {
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    throw new Error("MONGO_URI is missing. Add it to server/.env");
  }

  await mongoose.connect(mongoUri);

  try {
    const admin = await User.findOne({ role: "admin" }).select("_id");

    if (shouldReset) {
      await resetGamificationCollections();
      console.log("[seed:gamification] Reset existing gamification data.");
    }

    const badgeSummary = await seedBadges();
    const challengeSummary = await seedChallenges(admin?._id);

    console.log("[seed:gamification] Done.");
    console.log("[seed:gamification] Badges:", badgeSummary);
    console.log("[seed:gamification] Challenges:", challengeSummary);
  } finally {
    await mongoose.disconnect();
  }
}

run()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("[seed:gamification] Failed:", err.message);
    process.exit(1);
  });
