const mongoose = require("mongoose");

const badgeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, unique: true },
    description: { type: String, required: true, trim: true },

    // Rule type for auto awarding
    type: {
      type: String,
      required: true,
      enum: ["TRIP_COUNT", "TOTAL_DISTANCE", "TOTAL_CO2_SAVED"],
    },

    // Threshold to earn this badge
    threshold: { type: Number, required: true, min: 1 },

    // Optional image url (we will auto-fill using Unsplash if not provided)
    imageUrl: { type: String, default: "" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Badge", badgeSchema);