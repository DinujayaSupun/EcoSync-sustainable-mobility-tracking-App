// client/src/gamification/api/leaderboard.api.js
import API from "./axios";

// ⚠️ Adjust only if your backend route prefix differs
const BASE = "/leaderboard";

function normalizePeriod(period) {
  const p = String(period || "").toLowerCase();
  if (p === "daily" || p === "weekly" || p === "monthly") return p;
  return "weekly"; // default
}

function normalizeBoard(board) {
  const b = String(board || "").toLowerCase();
  if (b === "hybrid" || b === "impact" || b === "efficiency") return b;
  return "hybrid";
}

export const LeaderboardAPI = {
  async getLeaderboard(period = "weekly", board = "hybrid") {
    const safePeriod = normalizePeriod(period);
    const safeBoard = normalizeBoard(board);
    const res = await API.get(`${BASE}?period=${safePeriod}&board=${safeBoard}`);
    return res.data;
  },
};