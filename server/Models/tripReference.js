const mongoose = require("mongoose");

const tripReferenceSchema = new mongoose.Schema({

  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  vehicleType: {
    type: String,
    required: true
  },

  distance: Number,

  emissionAmount: {
    type: Number,
    required: true
  },

  timestamp: {
    type: Date,
    default: Date.now
  }

}, { timestamps: true });

module.exports = mongoose.model("TripReference", tripReferenceSchema);