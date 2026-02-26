const Badge = require("../models/Badge");

async function seedBadges() {
  const count = await Badge.countDocuments();
  if (count > 0) return;

  const defaults = [
    {
      name: "First Trip",
      description: "Completed your first sustainable commute.",
      type: "TRIP_COUNT",
      threshold: 1,
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
      name: "Distance Hero",
      description: "Reached 50 km of sustainable travel.",
      type: "TOTAL_DISTANCE",
      threshold: 50,
      imageUrl: "",
    },
    {
      name: "CO₂ Saver",
      description: "Saved 20 kg of CO₂ through sustainable travel.",
      type: "TOTAL_CO2_SAVED",
      threshold: 20,
      imageUrl: "",
    },
  ];

  await Badge.insertMany(defaults);
  console.log("✅ Seeded default badges");
}

module.exports = seedBadges;