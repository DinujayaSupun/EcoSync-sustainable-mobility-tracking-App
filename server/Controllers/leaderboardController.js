const leaderboardService = require("../services/leaderboardService");
const AchievementEvent = require("../models/AchievementEvent");

function getPeriodKey(period, now = new Date()) {
  const d = new Date(now);
  if (period === "daily") {
    return d.toISOString().slice(0, 10);
  }
  if (period === "monthly") {
    return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
  }

  // ISO week key for weekly notifications
  const tmp = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const day = tmp.getUTCDay() || 7;
  tmp.setUTCDate(tmp.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(tmp.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((tmp - yearStart) / 86400000) + 1) / 7);
  return `${tmp.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
}

async function persistHybridPodiumAchievement({ userId, period, rank }) {
  if (!userId) return;
  if (![1, 2, 3].includes(Number(rank))) return;

  const periodKey = getPeriodKey(period);
  const eventKey = `leaderboard_podium:${userId}:hybrid:${period}:${periodKey}:rank${rank}`;

  const medal = rank === 1 ? "🥇" : rank === 2 ? "🥈" : "🥉";
  const icon = rank === 1 ? "military_tech" : rank === 2 ? "workspace_premium" : "emoji_events";
  const title = `Hybrid Leaderboard: #${rank}`;
  const message = `${medal} You reached #${rank} on the ${period} Hybrid leaderboard.`;

  await AchievementEvent.updateOne(
    { eventKey },
    {
      $setOnInsert: {
        user: userId,
        eventKey,
        type: "LEADERBOARD_PODIUM",
        title,
        message,
        icon,
        metadata: {
          board: "hybrid",
          period,
          periodKey,
          rank,
        },
      },
    },
    { upsert: true }
  );
}

async function getLeaderboard(req, res, next) {
  try {
    const { period = "weekly", board = "hybrid", limit = 10 } = req.query;
    const result = await leaderboardService.getLeaderboard({
      period,
      board,
      limit,
      userId: req.user?.id,
    });

    if (result.meta?.board === "hybrid" && result.meta?.me?.rank) {
      try {
        await persistHybridPodiumAchievement({
          userId: req.user?.id,
          period: result.meta.period,
          rank: result.meta.me.rank,
        });
      } catch (e) {
        // Do not fail leaderboard response if notification persistence fails.
        console.warn("Failed to persist leaderboard podium achievement:", e.message);
      }
    }

    res.json({
      success: true,
      period: result.meta.period,
      board: result.meta.board,
      limit: result.meta.limit,
      data: result.data,
      meta: result.meta,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { getLeaderboard };