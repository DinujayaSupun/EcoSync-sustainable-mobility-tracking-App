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
} = require("../controllers/commuteController");
const { autocompleteLimiter, commuteLimiter } = require("../middleware/rateLimiter");

router.use(commuteLimiter);

// All routes are protected with JWT authentication
router.post("/log", protect, logCommute);
router.get("/history", protect, getCommuteHistory);
router.get("/emission-summary", protect, getEmissionSummary);
router.get("/autocomplete", protect, autocompleteLimiter, autocompleteLocation);
router.get("/predict", protect, predictEmission);
router.delete("/:id", protect, deleteCommute);
router.put("/:id", protect, updateCommute);
router.post("/recalculate-co2", protect, recalculateCo2Saved);

module.exports = router;
