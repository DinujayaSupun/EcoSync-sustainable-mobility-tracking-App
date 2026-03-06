const Badge = require("../models/Badge");

async function seedBadges() {
  const defaults = [
    {
      name: "First Trip",
      description: "Completed your first sustainable commute.",
      type: "TRIP_COUNT",
      threshold: 1,
      imageUrl: "",
    },
    {
      name: "Green Streak",
      description: "Completed 5 sustainable commutes.",
      type: "TRIP_COUNT",
      threshold: 5,
      imageUrl: "",
    },
    {
      name: "Regular Commuter",
      description: "Completed 10 sustainable commutes.",
      type: "TRIP_COUNT",
      threshold: 10,
      imageUrl: "",
    },
    {
      name: "Commute Champion",
      description: "Completed 25 sustainable commutes.",
      type: "TRIP_COUNT",
      threshold: 25,
      imageUrl: "",
    },
    {
      name: "Century Rider",
      description: "Completed 100 sustainable commutes.",
      type: "TRIP_COUNT",
      threshold: 100,
      imageUrl: "",
    },
    {
      name: "Road Warrior",
      description: "Reached 10 km of sustainable travel.",
      type: "TOTAL_DISTANCE",
      threshold: 10,
      imageUrl: "",
    },
    {
      name: "Distance Hero",
      description: "Reached 50 km of sustainable travel.",
      type: "TOTAL_DISTANCE",
      threshold: 50,
      imageUrl: "",
    },
    {
      name: "Marathon Commuter",
      description: "Reached 100 km of sustainable travel.",
      type: "TOTAL_DISTANCE",
      threshold: 100,
      imageUrl: "",
    },
    {
      name: "Long Hauler",
      description: "Reached 500 km of sustainable travel.",
      type: "TOTAL_DISTANCE",
      threshold: 500,
      imageUrl: "",
    },
    {
      name: "Eco Starter",
      description: "Saved 5 kg of CO₂ through sustainable travel.",
      type: "TOTAL_CO2_SAVED",
      threshold: 5,
      imageUrl: "",
    },
    {
      name: "CO₂ Saver",
      description: "Saved 20 kg of CO₂ through sustainable travel.",
      type: "TOTAL_CO2_SAVED",
      threshold: 20,
      imageUrl: "",
    },
    {
      name: "Climate Guardian",
      description: "Saved 50 kg of CO₂ through sustainable travel.",
      type: "TOTAL_CO2_SAVED",
      threshold: 50,
      imageUrl: "",
    },
    {
      name: "Carbon Crusher",
      description: "Saved 100 kg of CO₂ through sustainable travel.",
      type: "TOTAL_CO2_SAVED",
      threshold: 100,
      imageUrl: "",
    },
  ];

  // Insert only badges that don't already exist by name
  // This allows adding new badges without wiping the existing DB
  let seeded = 0;
  for (const badge of defaults) {
    const exists = await Badge.findOne({ name: badge.name });
    if (!exists) {
      await Badge.create(badge);
      seeded++;
    }
  }

  if (seeded > 0) console.log(`✅ Seeded ${seeded} new badge(s)`);
}

module.exports = seedBadges;