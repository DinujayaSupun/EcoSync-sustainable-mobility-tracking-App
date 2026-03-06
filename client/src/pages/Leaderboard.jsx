// client/src/pages/Leaderboard.jsx
import React, { useEffect, useState } from "react";
import { LeaderboardAPI } from "../api/leaderboard.api";

const PERIODS = [
  { key: "daily", label: "Daily" },
  { key: "weekly", label: "Weekly" },
  { key: "monthly", label: "Monthly" },
];

// Medal emoji for top 3 ranks, number for the rest
function RankDisplay({ rank }) {
  if (rank === 1) return <span className="text-2xl">🥇</span>;
  if (rank === 2) return <span className="text-2xl">🥈</span>;
  if (rank === 3) return <span className="text-2xl">🥉</span>;
  return <span className="text-base font-semibold text-gray-500">#{rank}</span>;
}

export default function Leaderboard() {
  const [period, setPeriod] = useState("weekly");
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadLeaderboard() {
    setLoading(true);
    setError("");
    try {
      const data = await LeaderboardAPI.getLeaderboard(period);

      // Normalize response — backend returns { success: true, data: [] }
      // but may also return a plain array in future
      const list = Array.isArray(data)
        ? data
        : Array.isArray(data?.data)
        ? data.data
        : Array.isArray(data?.leaderboard)
        ? data.leaderboard
        : [];

      setEntries(list);
    } catch (e) {
      setError(
        e?.response?.data?.message ||
          e?.message ||
          "Failed to load leaderboard. Please try again."
      );
      setEntries([]);
    } finally {
      setLoading(false);
    }
  }

  // Reload whenever the selected period changes
  useEffect(() => {
    loadLeaderboard();
  }, [period]);

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-3xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h1 className="text-2xl font-bold text-gray-900">🏆 Leaderboard</h1>
          <p className="text-gray-600 mt-1">Top sustainable commuters on campus.</p>

          {/* Period switcher tabs */}
          <div className="mt-4 flex gap-2">
            {PERIODS.map((p) => (
              <button
                key={p.key}
                type="button"
                onClick={() => setPeriod(p.key)}
                className={[
                  "px-4 py-1.5 rounded-full text-sm border transition",
                  period === p.key
                    ? "bg-green-600 text-white border-green-600"
                    : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50",
                ].join(" ")}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Body */}
        <div className="mt-6">
          {loading && (
            <div className="py-10 text-center text-gray-600">Loading leaderboard...</div>
          )}

          {!loading && error && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-900">
                Couldn't load leaderboard
              </h3>
              <p className="text-sm text-gray-600 mt-2">{error}</p>
              <button
                type="button"
                onClick={loadLeaderboard}
                className="mt-4 px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm font-medium"
              >
                Retry
              </button>
            </div>
          )}

          {!loading && !error && entries.length === 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-900">No results yet</h3>
              <p className="text-sm text-gray-600 mt-2">
                Log more trips to appear on the {period} leaderboard.
              </p>
            </div>
          )}

          {!loading && !error && entries.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              {entries.map((entry, idx) => (
                <div
                  key={entry.userId || idx}
                  className={`flex items-center gap-4 px-6 py-4 border-b border-gray-50 last:border-0 ${
                    idx === 0 ? "bg-green-50" : ""
                  }`}
                >
                  {/* Rank medal or number */}
                  <div className="w-10 text-center">
                    <RankDisplay rank={idx + 1} />
                  </div>

                  {/* User name + optional champion title */}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 truncate">
                      {entry.name || "Unknown User"}
                    </p>
                    {entry.title && (
                      <span className="text-xs text-green-700 font-medium">
                        {entry.title}
                      </span>
                    )}
                  </div>

                  {/* Trip count, distance, CO₂ saved stats */}
                  <div className="flex gap-6 text-sm text-gray-600 shrink-0">
                    <div className="text-center">
                      <p className="font-semibold text-gray-900">{entry.tripCount ?? 0}</p>
                      <p className="text-xs text-gray-400">trips</p>
                    </div>
                    <div className="text-center">
                      <p className="font-semibold text-gray-900">
                        {(entry.totalDistanceKm ?? 0).toFixed(1)}
                      </p>
                      <p className="text-xs text-gray-400">km</p>
                    </div>
                    <div className="text-center">
                      <p className="font-semibold text-green-700">
                        {(entry.totalCo2Saved ?? 0).toFixed(2)}
                      </p>
                      <p className="text-xs text-gray-400">kg CO₂</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
