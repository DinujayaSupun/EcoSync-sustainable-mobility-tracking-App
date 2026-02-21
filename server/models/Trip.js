const mongoose = require('mongoose');

const tripSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  origin: { type: String, required: true },
  destination: { type: String, required: true },
  distance: { type: Number, required: true }, // in Kilometers
  transportMode: { 
    type: String, 
    enum: ['bus', 'train', 'shuttle', 'car', 'walking'], 
    required: true 
  },
  co2Saved: { type: Number, required: true }, // in Kilograms
  tripDate: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('Trip', tripSchema);