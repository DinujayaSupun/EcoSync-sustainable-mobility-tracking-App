const mongoose = require("mongoose");

const commuteSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    startLocation: {
      type: String,
      required: true,
    },
    destination: {
      type: String,
      required: true,
    },
    startCoords: {
      lat: { type: Number, required: true },
      lon: { type: Number, required: true },
    },
    destinationCoords: {
      lat: { type: Number, required: true },
      lon: { type: Number, required: true },
    },
    transportType: {
      type: String,
      enum: ["Car", "Bus", "Train", "Bike", "Walk"],
      required: true,
    },
    faculty: {
      type: String,
      required: true,
    },
    dayType: {
      type: String,
      enum: ["Weekday", "Weekend"],
      required: true,
    },
    distance: {
      type: Number, // in kilometers
      required: true,
    },
    duration: {
      type: Number, // in minutes
      required: true,
    },
    emissionEstimate: {
      type: Number, // in kg CO2
      required: true,
    },
    co2Saved: {
      type: Number, // in kg CO2 saved compared to car
      default: 0,
    },
    ecoSuggestion: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Commute", commuteSchema);
