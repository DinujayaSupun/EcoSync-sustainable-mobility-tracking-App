const express = require("express");
const router = express.Router();
const {
  registerUser,
  loginUser,
  getUserProfile,
} = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");
const { loginLimiter } = require("../middleware/rateLimiter");

// Public routes
router.post("/register", registerUser);
router.post("/login", loginLimiter, loginUser);

// Protected routes
router.get("/profile", protect, getUserProfile);

module.exports = router;
