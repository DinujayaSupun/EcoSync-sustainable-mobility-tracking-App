const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const {
  logCommute,
  getCommuteHistory,
  getEmissionSummary,
  autocompleteLocation,
  predictEmission,
  deleteCommute,
  updateCommute,
  recalculateCo2Saved,
  getCO2SavingsByTransportMode,
  getCarUsageImpact,
  getFooterStats,
} = require("../controllers/commuteController");

// All routes are protected with JWT authentication
router.get("/footer-stats", getFooterStats);
router.post("/log", protect, logCommute);
router.get("/history", protect, getCommuteHistory);
router.get("/emission-summary", protect, getEmissionSummary);
router.get("/autocomplete", protect, autocompleteLocation);
router.get("/predict", protect, predictEmission);
router.get("/co2-savings-by-mode", protect, getCO2SavingsByTransportMode);
router.get("/car-usage-impact", protect, getCarUsageImpact);
router.delete("/:id", protect, deleteCommute);
router.put("/:id", protect, updateCommute);
router.post("/recalculate-co2", protect, recalculateCo2Saved);

module.exports = router;
