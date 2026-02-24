const mongoose = require('mongoose');

const weatherLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
  },
  origin: {
    type: String,
    required: [true, 'Origin location is required'],
    trim: true,
  },
  destination: {
    type: String,
    required: [true, 'Destination location is required'],
    trim: true,
  },
  weatherCondition: {
    type: String,
    required: [true, 'Weather condition is required'],
    enum: ['Clear', 'Rain', 'Clouds', 'Snow', 'Drizzle', 'Thunderstorm', 'Mist', 'Fog'],
  },
  suggestedTransport: {
    type: String,
    required: [true, 'Suggested transport is required'],
    enum: ['Walking', 'Cycling', 'Tuk-Tuk', 'Bus', 'Carpool', 'Train', 'Metro', 'Car'],
  },
  temperature: {
    type: Number,
  },
  humidity: {
    type: Number,
  },
  distance: {
    type: Number, // km between origin and destination
  },
  adjustmentReason: {
    type: String, // e.g. 'weather-priority' | 'distance-adjusted'
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

// Index for faster queries
weatherLogSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('WeatherLog', weatherLogSchema);
