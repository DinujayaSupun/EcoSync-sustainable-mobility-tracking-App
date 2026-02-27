/**
 * Smart Commute & Logistics Routes Index
 * 
 * This file exports all routes for the Smart Commute module.
 * Import this in your main app.js or server.js file.
 * 
 * Example usage:
 * const smartCommuteRoutes = require('./routes/smartCommute.routes');
 * app.use('/api', smartCommuteRoutes);
 */

const express = require('express');
const router = express.Router();

// Import individual route modules
const weatherRoutes = require('./weatherRoutes');

// Mount routes with their base paths
router.use('/weather-suggestion', weatherRoutes);

// Health check endpoint for Smart Commute module
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Smart Commute & Logistics module is running',
    version: '1.0.0',
    features: [
      'Weather-Based Green Suggestion',
    ],
  });
});

module.exports = router;
