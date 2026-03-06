// client/src/gamification/api/leaderboard.api.js
import API from "./axios";

// ⚠️ Adjust only if your backend route prefix differs
const BASE = "/leaderboard";

function normalizePeriod(period) {
  const p = String(period || "").toLowerCase();
  if (p === "daily" || p === "weekly" || p === "monthly") return p;
  return "weekly"; // default
}

export const LeaderboardAPI = {
  async getLeaderboard(period = "weekly") {
    const safePeriod = normalizePeriod(period);
    const res = await API.get(`${BASE}?period=${safePeriod}`);
    return res.data;
  },
};