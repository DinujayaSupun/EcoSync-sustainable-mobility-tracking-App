const express = require("express");
const router = express.Router();

const { protect } = require("../middleware/authMiddleware");
const { getMyAchievements } = require("../controllers/achievementController");

router.get("/my", protect, getMyAchievements);

module.exports = router;
