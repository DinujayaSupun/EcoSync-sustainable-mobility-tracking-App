const AchievementEvent = require("../models/AchievementEvent");

// @desc    Get current user's persisted achievement events
// @route   GET /api/achievements/my
// @access  Private
exports.getMyAchievements = async (req, res) => {
  try {
    const limit = Math.max(1, Math.min(100, Number(req.query.limit) || 30));
    const page = Math.max(1, Number(req.query.page) || 1);
    const skip = (page - 1) * limit;
    const filter = { user: req.user.id };

    const [rows, total] = await Promise.all([
      AchievementEvent.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("badge", "name imageUrl type threshold")
      .populate("challenge", "title rewardPoints transportMode"),
      AchievementEvent.countDocuments(filter),
    ]);

    const hasMore = skip + rows.length < total;

    res.status(200).json({
      success: true,
      count: rows.length,
      total,
      page,
      limit,
      hasMore,
      data: rows,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
