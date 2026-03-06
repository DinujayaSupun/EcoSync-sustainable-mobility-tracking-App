/**
 * Integration Guide for Smart Commute Module
 * 
 * This file shows how to integrate the Smart Commute routes
 * into your existing Express application.
 */

// ============================================
// OPTION 1: Import All Routes Together
// ============================================

const smartCommuteRoutes = require('./routes/smartCommute.routes');

// In your app.js or server.js, add:
app.use('/api', smartCommuteRoutes);

// This will create the following endpoints:
// - /api/weather-suggestion/*
// - /api/route-analysis/*
// - /api/transport-history/*
// - /api/heatmap/*
// - /api/parking-impact/*
// - /api/smart-commute/health


// ============================================
// OPTION 2: Import Routes Individually
// ============================================

const weatherRoutes = require('./routes/weatherRoutes');
const routeRoutes = require('./routes/routeRoutes');
const transportRoutes = require('./routes/transportRoutes');
const heatmapRoutes = require('./routes/heatmapRoutes');
const parkingImpactRoutes = require('./routes/parkingImpactRoutes');

// In your app.js or server.js, add:
app.use('/api/weather-suggestion', weatherRoutes);
app.use('/api/route-analysis', routeRoutes);
app.use('/api/transport-history', transportRoutes);
app.use('/api/heatmap', heatmapRoutes);
app.use('/api/parking-impact', parkingImpactRoutes);


// ============================================
// OPTION 3: With Authentication Middleware
// ============================================

const { protect } = require('./middleware/authMiddleware');
const smartCommuteRoutes = require('./routes/smartCommute.routes');

// Apply authentication to all Smart Commute routes
app.use('/api', protect, smartCommuteRoutes);

// Or apply authentication selectively:
app.use('/api/weather-suggestion', protect, weatherRoutes);
app.use('/api/route-analysis', protect, routeRoutes);
app.use('/api/transport-history', protect, transportRoutes);
app.use('/api/heatmap', heatmapRoutes); // Public access
app.use('/api/parking-impact', protect, parkingImpactRoutes);


// ============================================
// COMPLETE EXAMPLE: server.js
// ============================================

const express = require('express');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const cors = require('cors');

// Load environment variables
dotenv.config();

// Connect to database
connectDB();

const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// Existing routes
const authRoutes = require('./routes/authRoutes');
const commuteRoutes = require('./routes/commuteRoutes');
const carbonRoutes = require('./routes/carbon.routes');

app.use('/api/auth', authRoutes);
app.use('/api/commute', commuteRoutes);
app.use('/api/carbon', carbonRoutes);

// NEW: Smart Commute & Logistics routes
const smartCommuteRoutes = require('./routes/smartCommute.routes');
app.use('/api', smartCommuteRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Smart Commute module available at http://localhost:${PORT}/api`);
});


// ============================================
// Testing the Integration
// ============================================

// After integration, test the health check endpoint:
// GET http://localhost:5000/api/smart-commute/health

// Should return:
// {
//   "success": true,
//   "message": "Smart Commute & Logistics module is running",
//   "version": "1.0.0",
//   "features": [...]
// }

module.exports = app;
