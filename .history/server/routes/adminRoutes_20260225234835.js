const express = require("express");
const router = express.Router();
const {
  getAdminStats,
  getAllUsers,
  updateUser,
  deleteUser,
  getRecentTrips,
  getReportData,
  emailReport,
  getAIInsights
} = require("../controllers/adminController");
const { protect, isAdmin } = require("../middleware/authMiddleware");

// Secure Route: Only Admins can hit this
router.get("/stats", protect, isAdmin, getAdminStats);

// User Management Routes
router.get("/users", protect, isAdmin, getAllUsers);
router.put("/users/:id", protect, isAdmin, updateUser);
router.delete("/users/:id", protect, isAdmin, deleteUser);

// Recent Trips for Live Feed
router.get("/recent-trips", protect, isAdmin, getRecentTrips);

// Report Generation
router.get("/report", protect, isAdmin, getReportData);

router.post("/email-report", protect, isAdmin, emailReport);

module.exports = router;
