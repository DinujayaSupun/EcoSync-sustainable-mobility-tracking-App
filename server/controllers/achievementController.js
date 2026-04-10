const AchievementEvent = require("../models/AchievementEvent");

// @desc    Get current user's persisted achievement events
// @route   GET /api/achievements/my
// @access  Private
exports.getMyAchievements = async (req, res) => {
  try {
    const limit = Math.max(1, Math.min(100, Number(req.query.limit) || 30));

    const rows = await AchievementEvent.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate("badge", "name imageUrl type threshold")
      .populate("challenge", "title rewardPoints transportMode");

    res.status(200).json({
      success: true,
      count: rows.length,
      data: rows,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
