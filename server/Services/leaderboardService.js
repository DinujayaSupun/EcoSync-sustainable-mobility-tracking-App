const Commute = require("../models/Commute");
const User = require("../models/User");

const ALLOWED_PERIODS = new Set(["daily", "weekly", "monthly"]);
const ALLOWED_BOARDS = new Set(["hybrid", "impact", "efficiency"]);

const MIN_DISTANCE_HYBRID_BY_PERIOD = {
  daily: 1,
  weekly: 3,
  monthly: 5,
};

const MIN_ACTIVE_DAYS_HYBRID_BY_PERIOD = {
  daily: 1,
  weekly: 1,
  monthly: 1,
};

const MIN_DISTANCE_EFFICIENCY_BY_PERIOD = {
  daily: 2,
  weekly: 5,
  monthly: 10,
};

const MIN_ACTIVE_DAYS_EFFICIENCY_BY_PERIOD = {
  daily: 1,
  weekly: 1,
  monthly: 1,
};

function normalizePeriod(period) {
  const p = String(period || "").toLowerCase();
  return ALLOWED_PERIODS.has(p) ? p : "weekly";
}

function normalizeBoard(board) {
  const b = String(board || "").toLowerCase();
  return ALLOWED_BOARDS.has(b) ? b : "hybrid";
}

function round(value, digits = 4) {
  const n = Number(value || 0);
  return Number(n.toFixed(digits));
}

function percentileMap(rows, field) {
  if (!rows.length) return new Map();

  const sortedValues = [...new Set(rows.map((r) => Number(r[field] || 0)))].sort((a, b) => b - a);
  const maxRankIndex = Math.max(sortedValues.length - 1, 1);
  const rankByValue = new Map(sortedValues.map((v, idx) => [v, idx]));

  const map = new Map();
  for (const row of rows) {
    const v = Number(row[field] || 0);
    const idx = rankByValue.get(v) ?? maxRankIndex;
    const pct = sortedValues.length === 1 ? 100 : ((maxRankIndex - idx) / maxRankIndex) * 100;
    map.set(String(row._id), pct);
  }

  return map;
}

function compareBySortSpec(a, b, sortSpec) {
  for (const { field, dir } of sortSpec) {
    const av = a[field];
    const bv = b[field];

    if (av === bv) continue;
    if (av === null || av === undefined) return 1;
    if (bv === null || bv === undefined) return -1;

    if (dir === "desc") return bv > av ? 1 : -1;
    return av > bv ? 1 : -1;
  }

  return 0;
}

function getDateRange(period) {
  const end = new Date();
  const start = new Date(end);

  switch (period) {
    case "daily":
      start.setDate(end.getDate() - 1);
      break;
    case "weekly":
      start.setDate(end.getDate() - 7);
      break;
    case "monthly":
      start.setMonth(end.getMonth() - 1);
      break;
    default:
      start.setDate(end.getDate() - 7);
  }

  return { start, end };
}

async function getLeaderboard({ period = "weekly", board = "hybrid", limit = 10, userId }) {
  const safePeriod = normalizePeriod(period);
  const safeBoard = normalizeBoard(board);
  const safeLimit = Math.max(1, Math.min(100, Number(limit) || 10));

  const { start, end } = getDateRange(safePeriod);
  const msInDay = 1000 * 60 * 60 * 24;
  const periodDays = Math.max(1, Math.ceil((end - start) / msInDay));

  const baseRows = await Commute.aggregate([
    { $match: { createdAt: { $gte: start, $lte: end } } },
    {
      $group: {
        _id: "$userId",
        totalCo2Saved: { $sum: "$co2Saved" },
        totalDistanceKm: { $sum: "$distance" },
        tripCount: { $sum: 1 },
        activeDaySet: {
          $addToSet: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
          },
        },
        firstTripAt: { $min: "$createdAt" },
      },
    },
  ]);

  const rows = baseRows
    .map((r) => {
      const totalDistanceKm = Number(r.totalDistanceKm || 0);
      const totalCo2Saved = Number(r.totalCo2Saved || 0);
      const activeDays = Array.isArray(r.activeDaySet) ? r.activeDaySet.length : 0;
      const co2PerKm = totalDistanceKm > 0 ? totalCo2Saved / totalDistanceKm : 0;
      const consistency = activeDays / periodDays;

      return {
        ...r,
        totalCo2Saved,
        totalDistanceKm,
        tripCount: Number(r.tripCount || 0),
        activeDays,
        co2PerKm,
        consistency,
      };
    })
    .filter((r) => r.tripCount >= 1 && r.totalDistanceKm > 0);

  const minHybridDistance = MIN_DISTANCE_HYBRID_BY_PERIOD[safePeriod];
  const minHybridActiveDays = MIN_ACTIVE_DAYS_HYBRID_BY_PERIOD[safePeriod];
  const minEfficiencyDistance = MIN_DISTANCE_EFFICIENCY_BY_PERIOD[safePeriod];
  const minEfficiencyActiveDays = MIN_ACTIVE_DAYS_EFFICIENCY_BY_PERIOD[safePeriod];

  const hybridEligible = (r) =>
    r.totalDistanceKm >= minHybridDistance && r.activeDays >= minHybridActiveDays;
  const efficiencyEligible = (r) =>
    r.totalDistanceKm >= minEfficiencyDistance && r.activeDays >= minEfficiencyActiveDays;

  const hybridCandidates = rows.filter(hybridEligible);
  const impactCandidates = rows;
  const efficiencyCandidates = rows.filter(efficiencyEligible);

  const totalPctMap = percentileMap(hybridCandidates, "totalCo2Saved");
  const effPctMap = percentileMap(hybridCandidates, "co2PerKm");

  for (const r of rows) {
    const userKey = String(r._id);
    const totalPct = totalPctMap.get(userKey) ?? 0;
    const efficiencyPct = effPctMap.get(userKey) ?? 0;
    const consistencyScore = Math.min(1, r.consistency) * 100;

    r.totalPct = totalPct;
    r.efficiencyPct = efficiencyPct;
    r.consistencyScore = consistencyScore;
    r.hybridScore = 0.5 * totalPct + 0.35 * efficiencyPct + 0.15 * consistencyScore;
  }

  const boardConfig = {
    hybrid: {
      candidates: hybridCandidates,
      title: `${safePeriod.charAt(0).toUpperCase() + safePeriod.slice(1)} Hybrid Champion`,
      sort: [
        { field: "hybridScore", dir: "desc" },
        { field: "totalCo2Saved", dir: "desc" },
        { field: "co2PerKm", dir: "desc" },
        { field: "activeDays", dir: "desc" },
        { field: "firstTripAt", dir: "asc" },
      ],
    },
    impact: {
      candidates: impactCandidates,
      title: `${safePeriod.charAt(0).toUpperCase() + safePeriod.slice(1)} Impact Champion`,
      sort: [
        { field: "totalCo2Saved", dir: "desc" },
        { field: "totalDistanceKm", dir: "desc" },
        { field: "tripCount", dir: "desc" },
        { field: "firstTripAt", dir: "asc" },
      ],
    },
    efficiency: {
      candidates: efficiencyCandidates,
      title: `${safePeriod.charAt(0).toUpperCase() + safePeriod.slice(1)} Efficiency Champion`,
      sort: [
        { field: "co2PerKm", dir: "desc" },
        { field: "totalCo2Saved", dir: "desc" },
        { field: "activeDays", dir: "desc" },
        { field: "firstTripAt", dir: "asc" },
      ],
    },
  };

  const selectedBoard = boardConfig[safeBoard];
  const sorted = [...selectedBoard.candidates].sort((a, b) => compareBySortSpec(a, b, selectedBoard.sort));
  const limited = sorted.slice(0, safeLimit);

  const userIds = limited.map((r) => r._id);
  const users = await User.find({ _id: { $in: userIds } }).select("name");
  const userMap = new Map(users.map((u) => [String(u._id), u.name]));

  const data = limited.map((r, idx) => ({
    rank: idx + 1,
    userId: r._id,
    name: userMap.get(String(r._id)) || "Unknown",
    totalCo2Saved: round(r.totalCo2Saved, 2),
    totalDistanceKm: round(r.totalDistanceKm, 2),
    tripCount: r.tripCount,
    activeDays: r.activeDays,
    co2PerKm: round(r.co2PerKm, 4),
    hybridScore: round(r.hybridScore, 2),
    totalPct: round(r.totalPct, 2),
    efficiencyPct: round(r.efficiencyPct, 2),
    consistencyScore: round(r.consistencyScore, 2),
    ...(idx === 0 ? { title: selectedBoard.title } : {}),
  }));

  const currentUserId = String(userId || "");
  const myRankIndex = sorted.findIndex((r) => String(r._id) === currentUserId);

  const me =
    myRankIndex >= 0
      ? {
          rank: myRankIndex + 1,
          inTopList: myRankIndex < safeLimit,
        }
      : null;

  return {
    data,
    meta: {
      board: safeBoard,
      period: safePeriod,
      limit: safeLimit,
      eligibility: {
        hybrid: {
          minDistanceKm: minHybridDistance,
          minActiveDays: minHybridActiveDays,
        },
        efficiency: {
          minDistanceKm: minEfficiencyDistance,
          minActiveDays: minEfficiencyActiveDays,
        },
      },
      me,
    },
  };
}

module.exports = { getLeaderboard };