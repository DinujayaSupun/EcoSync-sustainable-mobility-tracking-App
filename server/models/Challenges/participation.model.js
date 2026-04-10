const mongoose = require("mongoose");

const participationSchema = new mongoose.Schema({
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    challenge: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Challenge",
      required: true
    },
    progress: {
      type: Number,
      default: 0
    },
    status: {
      type: String,
      enum: ["ACTIVE", "COMPLETED", "LEFT"],
      default: "ACTIVE"
    },
    rewardGranted: {
      type: Boolean,
      default: false
    },
    rewardedPoints: {
      type: Number,
      default: 0
    },
    rewardGrantedAt: {
      type: Date,
      default: null
    },
    lastAutoSyncAt: {
      type: Date,
      default: Date.now
    },
    joinedAt: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: true }
);


participationSchema.index({ user: 1, challenge: 1 }, { unique: true });

module.exports = mongoose.model("Participation", participationSchema);