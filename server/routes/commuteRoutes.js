const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const {
  logCommute,
  getCommuteHistory,
  getEmissionSummary,
  autocompleteLocation,
} = require("../controllers/commuteController");

// All routes are protected with JWT authentication
router.post("/log", protect, logCommute);
router.get("/history", protect, getCommuteHistory);
router.get("/emission-summary", protect, getEmissionSummary);
router.get("/autocomplete", protect, autocompleteLocation);

module.exports = router;
