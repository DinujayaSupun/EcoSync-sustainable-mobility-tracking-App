const express = require('express');
const router = express.Router();
const { getAdminStats } = require('../controllers/adminController');
const { protect, isAdmin } = require('../middleware/authMiddleware');

// Secure Route: Only Admins can hit this
router.get('/stats', protect, isAdmin, getAdminStats);

module.exports = router;