const mongoose = require("mongoose");

const challengeSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },

  description: {
    type: String,
    required: true
  },

  tagline: {
    type: String,
    required: true
  },

  transportMode: {
    type: String,
    enum: ["BUS", "TRAIN", "BIKE", "WALK"],
    required: true
  },

  emissionTarget: {
    type: Number, // kg CO2 to save
    required: true
  },

  durationDays: {
    type: Number,
    required: true
  },

  difficulty: {
    type: String,
    enum: ["EASY", "MEDIUM", "HARD"],
    required: true
  },

  rewardPoints: {
    type: Number,
    required: true
  },

  type: {
    type: String,
    enum: ["INDIVIDUAL", "SQUAD"],
    required: true
  },

  status: {
    type: String,
    enum: ["ACTIVE", "EXPIRED", "COMPLETED", "INACTIVE"],
    default: "ACTIVE"
  },

  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  deadline: {
    type: Date,
    required: true
  },

  isDeleted: {
    type: Boolean,
    default: false
  }

}, { timestamps: true });

module.exports = mongoose.model("Challenge", challengeSchema);