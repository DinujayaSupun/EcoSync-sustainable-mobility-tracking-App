const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const leaderboardController = require("../controllers/leaderboardController");

const router = express.Router();

router.get("/", protect, leaderboardController.getLeaderboard);

module.exports = router;