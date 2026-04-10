const mongoose = require("mongoose");

const achievementEventSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    eventKey: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ["BADGE_EARNED", "CHALLENGE_COMPLETED", "LEADERBOARD_PODIUM"],
      required: true,
      index: true,
    },
    badge: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Badge",
      default: null,
    },
    challenge: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Challenge",
      default: null,
    },
    sourceCommute: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Commute",
      default: null,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    icon: {
      type: String,
      default: "emoji_events",
      trim: true,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
);

achievementEventSchema.index({ user: 1, createdAt: -1 });

module.exports =
  mongoose.models.AchievementEvent ||
  mongoose.model("AchievementEvent", achievementEventSchema);
