const express = require('express');
const router = express.Router();
const { getAdminStats, getAllUsers, deleteUser } = require('../controllers/adminController');
const { protect, isAdmin } = require('../middleware/authMiddleware');

// Secure Route: Only Admins can hit this
router.get('/stats', protect, isAdmin, getAdminStats);

// User Management Routes
router.get('/users', protect, isAdmin, getAllUsers);
router.delete('/users/:id', protect, isAdmin, deleteUser);

module.exports = router;