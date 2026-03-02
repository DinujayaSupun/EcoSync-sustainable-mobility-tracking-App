const leaderboardService = require("../services/leaderboardService");

async function getLeaderboard(req, res, next) {
  try {
    const { period = "weekly", limit = 10 } = req.query;
    const data = await leaderboardService.getLeaderboard({ period, limit });

    res.json({ success: true, period, limit: Number(limit), data });
  } catch (err) {
    next(err);
  }
}

module.exports = { getLeaderboard };