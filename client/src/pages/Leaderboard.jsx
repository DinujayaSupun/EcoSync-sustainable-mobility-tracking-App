import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import html2pdf from "html2pdf.js";
import { LeaderboardAPI } from "../api/leaderboard.api";
import { useCommute } from "../context/CommuteContext";
import { useAuth } from "../context/AuthContext";
import GamificationToast from "../components/common/GamificationToast";
import { useGamificationToast } from "../hooks/useGamificationToast";

const PERIODS = [
  { key: "daily", label: "Daily" },
  { key: "weekly", label: "Weekly" },
  { key: "monthly", label: "Monthly" },
];

const BOARDS = [
  { key: "hybrid", label: "Hybrid" },
  { key: "impact", label: "Impact" },
  { key: "efficiency", label: "Efficiency" },
];

// Medal emoji for top 3 ranks, number for the rest
function RankDisplay({ rank }) {
  if (rank === 1) return <span className="text-2xl">🥇</span>;
  if (rank === 2) return <span className="text-2xl">🥈</span>;
  if (rank === 3) return <span className="text-2xl">🥉</span>;
  return <span className="text-base font-semibold text-gray-500">#{rank}</span>;
}

export default function Leaderboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { refreshTrigger } = useCommute();
  const [period, setPeriod] = useState("weekly");
  const [board, setBoard] = useState("hybrid");
  const [entries, setEntries] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [exportingPdf, setExportingPdf] = useState(false);
  const { toast, showToast } = useGamificationToast();

  const periodLabel = useMemo(
    () => PERIODS.find((p) => p.key === period)?.label || "Weekly",
    [period]
  );

  const boardHelp = useMemo(() => {
    if (board === "hybrid") {
      return {
        title: "Hybrid",
        text: "Balanced ranking that combines total CO2 saved, CO2 saved per km, and consistency across active days.",
      };
    }

    if (board === "impact") {
      return {
        title: "Impact",
        text: "Ranks users by total CO2 saved. Best view for absolute environmental contribution.",
      };
    }

    return {
      title: "Efficiency",
      text: "Ranks users by CO2 saved per km, with eligibility checks, so users with different travel volume can compete fairly.",
    };
  }, [board]);

  const boardLabel = useMemo(
    () => BOARDS.find((b) => b.key === board)?.label || "Hybrid",
    [board]
  );

  const topMetricValue = useMemo(() => {
    if (!entries.length) return 0;
    if (board === "efficiency") {
      return Math.max(...entries.map((e) => Number(e?.co2PerKm || 0)));
    }
    if (board === "hybrid") {
      return Math.max(...entries.map((e) => Number(e?.hybridScore || 0)));
    }
    return Math.max(...entries.map((e) => Number(e?.totalCo2Saved || 0)));
  }, [entries, board]);

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  async function handleExportPdf() {
    if (loading || error || exportingPdf) return;

    setExportingPdf(true);

    try {
      const today = new Date();
      const datePart = today.toISOString().slice(0, 10);
      const generatedAt = today.toLocaleString();

      const scoreHeader =
        board === "hybrid"
          ? "Hybrid Score"
          : board === "efficiency"
          ? "CO2 per km"
          : "Active Days";

      const rowsHtml = entries
        .map((entry, idx) => {
          const rank = entry.rank || idx + 1;
          const name = escapeHtml(entry.name || "Unknown User");
          const tripCount = Number(entry.tripCount ?? 0);
          const totalDistance = Number(entry.totalDistanceKm ?? 0).toFixed(1);
          const totalCo2 = Number(entry.totalCo2Saved ?? 0).toFixed(2);
          const boardMetric =
            board === "hybrid"
              ? `${Number(entry.hybridScore ?? 0).toFixed(2)} pts`
              : board === "efficiency"
              ? `${Number(entry.co2PerKm ?? 0).toFixed(4)} kg/km`
              : `${Number(entry.activeDays ?? 0)} days`;

          return `
            <tr>
              <td style="padding:8px;border:1px solid #d1d5db;text-align:center;">${rank}</td>
              <td style="padding:8px;border:1px solid #d1d5db;">${name}</td>
              <td style="padding:8px;border:1px solid #d1d5db;text-align:right;">${tripCount}</td>
              <td style="padding:8px;border:1px solid #d1d5db;text-align:right;">${totalDistance}</td>
              <td style="padding:8px;border:1px solid #d1d5db;text-align:right;">${totalCo2}</td>
              <td style="padding:8px;border:1px solid #d1d5db;text-align:right;">${boardMetric}</td>
            </tr>
          `;
        })
        .join("");

      const exportRoot = document.createElement("div");
      exportRoot.style.background = "#ffffff";
      exportRoot.style.padding = "24px";
      exportRoot.style.fontFamily = "Segoe UI, Arial, sans-serif";
      exportRoot.style.color = "#0f172a";
      exportRoot.style.width = "1000px";

      exportRoot.innerHTML = `
        <div style="border:2px solid #86efac;border-radius:16px;overflow:hidden;">
          <div style="background:linear-gradient(90deg,#047857,#15803d);color:#ffffff;padding:18px 20px;">
            <div style="font-size:12px;letter-spacing:0.14em;text-transform:uppercase;opacity:0.9;">EcoSync</div>
            <h1 style="margin:6px 0 2px 0;font-size:28px;">Leaderboard Report</h1>
            <div style="font-size:13px;opacity:0.95;">Board: ${escapeHtml(boardLabel)} | Period: ${escapeHtml(periodLabel)} | Generated: ${escapeHtml(generatedAt)}</div>
          </div>

          <div style="padding:16px 18px;display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;">
            <div style="border:1px solid #d1fae5;background:#ecfdf5;border-radius:10px;padding:10px;">
              <div style="font-size:11px;text-transform:uppercase;color:#047857;font-weight:700;">Period</div>
              <div style="font-size:20px;color:#064e3b;font-weight:700;">${escapeHtml(periodLabel)}</div>
            </div>
            <div style="border:1px solid #bfdbfe;background:#eff6ff;border-radius:10px;padding:10px;">
              <div style="font-size:11px;text-transform:uppercase;color:#1d4ed8;font-weight:700;">Ranked Users</div>
              <div style="font-size:20px;color:#1e3a8a;font-weight:700;">${entries.length}</div>
            </div>
            <div style="border:1px solid #fde68a;background:#fffbeb;border-radius:10px;padding:10px;">
              <div style="font-size:11px;text-transform:uppercase;color:#b45309;font-weight:700;">Top Metric</div>
              <div style="font-size:20px;color:#78350f;font-weight:700;">${topMetricValue.toFixed(board === "efficiency" ? 4 : 2)}</div>
            </div>
          </div>

          <div style="padding:0 18px 18px 18px;">
            <div style="border:1px solid #d1d5db;border-radius:10px;overflow:hidden;">
              <table style="width:100%;border-collapse:collapse;font-size:13px;">
                <thead style="background:#f3f4f6;">
                  <tr>
                    <th style="padding:9px;border:1px solid #d1d5db;text-align:center;">Rank</th>
                    <th style="padding:9px;border:1px solid #d1d5db;text-align:left;">User</th>
                    <th style="padding:9px;border:1px solid #d1d5db;text-align:right;">Trips</th>
                    <th style="padding:9px;border:1px solid #d1d5db;text-align:right;">Distance (km)</th>
                    <th style="padding:9px;border:1px solid #d1d5db;text-align:right;">CO2 Saved (kg)</th>
                    <th style="padding:9px;border:1px solid #d1d5db;text-align:right;">${escapeHtml(scoreHeader)}</th>
                  </tr>
                </thead>
                <tbody>
                  ${rowsHtml || '<tr><td colspan="6" style="padding:14px;text-align:center;border:1px solid #d1d5db;">No leaderboard data available.</td></tr>'}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      `;

      document.body.appendChild(exportRoot);

      await html2pdf()
        .set({
          margin: [10, 10, 10, 10],
          filename: `leaderboard-${period}-${datePart}.pdf`,
          image: { type: "jpeg", quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true },
          jsPDF: { unit: "mm", format: "a4", orientation: "landscape" },
          pagebreak: { mode: ["avoid-all", "css", "legacy"] },
        })
        .from(exportRoot)
        .save();

      document.body.removeChild(exportRoot);
      showToast("success", "Leaderboard exported as PDF.");
    } catch (e) {
      showToast("error", e?.message || "Failed to export leaderboard PDF.");
    } finally {
      setExportingPdf(false);
    }
  }

  function handleLogout() {
    logout();
    navigate("/login");
  }

  async function loadLeaderboard(options = {}) {
    const { notifySuccess = false, silentError = false } = options;
    setLoading(true);
    setError("");
    try {
      const data = await LeaderboardAPI.getLeaderboard(period, board);

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
      setMeta(data?.meta || null);
      if (notifySuccess) {
        showToast("success", "Leaderboard refreshed.");
      }
    } catch (e) {
      const msg =
        e?.response?.data?.message ||
        e?.message ||
        "Failed to load leaderboard. Please try again.";
      setError(msg);
      if (!silentError) {
        showToast("error", msg);
      }
      setEntries([]);
      setMeta(null);
    } finally {
      setLoading(false);
    }
  }

  // Reload whenever the selected period changes or a new commute is logged
  useEffect(() => {
    loadLeaderboard({ silentError: true });
  }, [period, board, refreshTrigger]);

  async function handleRetry() {
    await loadLeaderboard({ notifySuccess: true });
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="sticky top-0 z-2000 border-b border-emerald-100/80 bg-white/90 shadow-sm backdrop-blur-md">
        <div className="flex w-full items-center justify-between gap-3 px-4 py-3">
          <div className="mr-3 flex shrink-0 items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-linear-to-br from-emerald-500 to-green-700 shadow-md">
              <span className="material-icons text-white" style={{ fontSize: "22px" }}>eco</span>
            </div>
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight text-emerald-700">EcoSync</h1>
              <p className="hidden text-xs font-medium text-emerald-700/80 md:block">Smarter, cleaner commuting</p>
            </div>
          </div>

          <div className="flex min-w-0 flex-1 flex-nowrap items-center justify-end gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3.5 py-2 text-sm font-semibold text-emerald-800 shadow-sm">
              <span className="material-icons" style={{ fontSize: "17px" }}>person</span>
              Welcome, {user?.name}!
            </span>
            <button onClick={() => navigate("/home")} className="inline-flex items-center gap-1.5 rounded-full border border-emerald-300 bg-emerald-50 px-3.5 py-2 text-sm font-semibold text-emerald-900 transition hover:bg-emerald-100 hover:border-emerald-400"><span className="material-icons" style={{ fontSize: "17px" }}>home</span>Home</button>
            <button onClick={() => navigate("/weather-suggestion")} className="inline-flex items-center gap-1.5 rounded-full border border-cyan-300 bg-cyan-50 px-3.5 py-2 text-sm font-semibold text-cyan-900 transition hover:bg-cyan-100 hover:border-cyan-400"><span className="material-icons" style={{ fontSize: "17px" }}>cloud</span>Check Weather</button>
            <button onClick={() => navigate("/badges")} className="inline-flex items-center gap-1.5 rounded-full border border-amber-300 bg-amber-50 px-3.5 py-2 text-sm font-semibold text-amber-900 transition hover:bg-amber-100 hover:border-amber-400"><span className="material-icons" style={{ fontSize: "17px" }}>workspace_premium</span>Badges</button>
            <button onClick={() => navigate("/leaderboard")} className="inline-flex items-center gap-1.5 rounded-full border border-violet-300 bg-violet-100 px-3.5 py-2 text-sm font-semibold text-violet-900 transition hover:bg-violet-200 hover:border-violet-400"><span className="material-icons" style={{ fontSize: "17px" }}>leaderboard</span>Leaderboard</button>
            <button onClick={() => navigate("/challenges")} className="inline-flex items-center gap-1.5 rounded-full border border-indigo-300 bg-indigo-50 px-3.5 py-2 text-sm font-semibold text-indigo-900 transition hover:bg-indigo-100 hover:border-indigo-400"><span className="material-icons" style={{ fontSize: "17px" }}>emoji_events</span>Challenges</button>
            <button onClick={() => navigate("/commute-history")} className="inline-flex items-center gap-1.5 rounded-full border border-blue-300 bg-blue-50 px-3.5 py-2 text-sm font-semibold text-blue-900 transition hover:bg-blue-100 hover:border-blue-400"><span className="material-icons" style={{ fontSize: "17px" }}>history</span>Trip History</button>
            <button onClick={handleLogout} className="inline-flex items-center gap-1.5 rounded-full border border-rose-300 bg-rose-50 px-3.5 py-2 text-sm font-semibold text-rose-900 transition hover:bg-rose-100 hover:border-rose-400"><span className="material-icons" style={{ fontSize: "17px" }}>logout</span>Logout</button>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-7xl px-4 py-8">
        <GamificationToast toast={toast} />
        <div className="overflow-hidden rounded-3xl border-2 border-emerald-100 bg-white shadow-xl">
          <div className="flex flex-col gap-4 border-b border-emerald-100 bg-linear-to-r from-emerald-700 to-green-600 px-6 py-5 text-white sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <span className="material-icons text-white" style={{ fontSize: "32px" }}>leaderboard</span>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-100">Gamification</p>
                <h2 className="text-2xl font-bold sm:text-3xl">Leaderboard</h2>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 sm:ml-auto">
              <button
                type="button"
                onClick={handleExportPdf}
                disabled={loading || Boolean(error) || exportingPdf}
                className={[
                  "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition",
                  loading || Boolean(error) || exportingPdf
                    ? "cursor-not-allowed border-emerald-200/60 bg-emerald-600/20 text-emerald-100/80"
                    : "border-white/80 bg-white text-emerald-800 hover:bg-emerald-50",
                ].join(" ")}
              >
                <span className="material-icons" style={{ fontSize: "18px" }}>
                  {exportingPdf ? "hourglass_top" : "picture_as_pdf"}
                </span>
                {exportingPdf ? "Exporting..." : "Export PDF"}
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              {PERIODS.map((p) => (
                <button
                  key={p.key}
                  type="button"
                  onClick={() => setPeriod(p.key)}
                  className={[
                    "rounded-full border px-4 py-2 text-sm font-semibold transition",
                    period === p.key
                      ? "border-white/80 bg-white text-emerald-800"
                      : "border-emerald-200/70 bg-emerald-600/40 text-emerald-50 hover:bg-emerald-600/55",
                  ].join(" ")}
                >
                  {p.label}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap gap-2">
              {BOARDS.map((b) => (
                <button
                  key={b.key}
                  type="button"
                  onClick={() => setBoard(b.key)}
                  className={[
                    "rounded-full border px-4 py-2 text-sm font-semibold transition",
                    board === b.key
                      ? "border-white/80 bg-white text-emerald-800"
                      : "border-emerald-200/70 bg-emerald-600/40 text-emerald-50 hover:bg-emerald-600/55",
                  ].join(" ")}
                >
                  {b.label}
                </button>
              ))}
            </div>
          </div>

          <div className="px-6 py-6 sm:px-7">
            <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="rounded-2xl border-2 border-emerald-200 bg-linear-to-br from-emerald-50 via-white to-green-100 p-5 shadow-sm transition hover:shadow-md">
                <p className="text-xs font-bold uppercase tracking-wider text-emerald-700">Current Period</p>
                <p className="mt-2 text-3xl font-bold text-emerald-900">{periodLabel}</p>
              </div>
              <div className="rounded-2xl border-2 border-blue-200 bg-linear-to-br from-blue-50 via-white to-emerald-50 p-5 shadow-sm transition hover:shadow-md">
                <p className="text-xs font-bold uppercase tracking-wider text-blue-700">Ranked Users</p>
                <p className="mt-2 text-3xl font-bold text-blue-900">{entries.length}</p>
              </div>
              <div className="rounded-2xl border-2 border-amber-200 bg-linear-to-br from-amber-50 via-white to-lime-50 p-5 shadow-sm transition hover:shadow-md">
                <p className="text-xs font-bold uppercase tracking-wider text-amber-700">
                  {board === "hybrid"
                    ? "Top Hybrid Score"
                    : board === "efficiency"
                    ? "Top CO2 per KM"
                    : "Top CO2 Saved"}
                </p>
                <p className="mt-2 text-3xl font-bold text-amber-900">
                  {topMetricValue.toFixed(board === "efficiency" ? 4 : 2)}{" "}
                  <span className="text-base">{board === "hybrid" ? "pts" : board === "efficiency" ? "kg/km" : "kg"}</span>
                </p>
              </div>
            </div>

            <div className="mb-4 rounded-xl border border-indigo-100 bg-indigo-50/70 px-4 py-3 text-sm text-indigo-900">
              <span className="font-semibold">{boardHelp.title}:</span> {boardHelp.text}
            </div>

            {!loading && !error && board !== "impact" && meta?.eligibility && (
              <div className="mb-4 rounded-xl border border-emerald-100 bg-emerald-50/70 px-4 py-3 text-sm text-emerald-800">
                {board === "hybrid"
                  ? `Eligibility: at least ${meta.eligibility.hybrid?.minDistanceKm ?? 0} km and ${meta.eligibility.hybrid?.minActiveDays ?? 0} active days in this period.`
                  : `Eligibility: at least ${meta.eligibility.efficiency?.minDistanceKm ?? 0} km and ${meta.eligibility.efficiency?.minActiveDays ?? 0} active days in this period.`}
              </div>
            )}

            {!loading && !error && meta?.me?.rank && (
              <div className="mb-4 rounded-xl border border-blue-100 bg-blue-50/70 px-4 py-3 text-sm text-blue-800">
                Your rank in this board: #{meta.me.rank}
              </div>
            )}

            {loading && (
              <div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-10 text-center text-emerald-700">Loading leaderboard...</div>
            )}

            {!loading && error && (
              <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
                <h3 className="text-lg font-semibold text-red-900">Couldn't load leaderboard</h3>
                <p className="mt-2 text-sm text-red-700">{error}</p>
                <button
                  type="button"
                  onClick={handleRetry}
                  className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700"
                >
                  Retry
                </button>
              </div>
            )}

            {!loading && !error && entries.length === 0 && (
              <div className="rounded-2xl border border-emerald-100 bg-emerald-50/40 p-6">
                <h3 className="text-lg font-semibold text-emerald-900">No results yet</h3>
                <p className="mt-2 text-sm text-emerald-700">Log more trips to appear on the {periodLabel.toLowerCase()} leaderboard.</p>
              </div>
            )}

            {!loading && !error && entries.length > 0 && (
              <div className="overflow-hidden rounded-2xl border border-emerald-100 bg-white shadow-sm">
                {entries.map((entry, idx) => (
                  <div
                    key={entry.userId || idx}
                    className={[
                      "flex flex-col gap-4 border-b border-emerald-50 px-6 py-4 transition last:border-0 md:flex-row md:items-center",
                      idx === 0 ? "bg-emerald-50/70" : "hover:bg-emerald-50/30",
                    ].join(" ")}
                  >
                    <div className="w-10 text-center">
                      <RankDisplay rank={entry.rank || idx + 1} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-gray-900">{entry.name || "Unknown User"}</p>
                      {entry.title && <span className="text-xs font-medium text-emerald-700">{entry.title}</span>}
                    </div>

                    <div className="grid shrink-0 grid-cols-4 gap-3 text-sm text-gray-600 md:min-w-96">
                      <div className="rounded-xl border border-gray-100 bg-gray-50 px-3 py-2 text-center">
                        <p className="font-semibold text-gray-900">{entry.tripCount ?? 0}</p>
                        <p className="text-xs text-gray-500">trips</p>
                      </div>
                      <div className="rounded-xl border border-gray-100 bg-gray-50 px-3 py-2 text-center">
                        <p className="font-semibold text-gray-900">{(entry.totalDistanceKm ?? 0).toFixed(1)}</p>
                        <p className="text-xs text-gray-500">km</p>
                      </div>
                      <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2 text-center">
                        <p className="font-semibold text-emerald-700">{(entry.totalCo2Saved ?? 0).toFixed(2)}</p>
                        <p className="text-xs text-emerald-600">kg CO2</p>
                      </div>
                      <div className="rounded-xl border border-violet-100 bg-violet-50 px-3 py-2 text-center">
                        {board === "hybrid" ? (
                          <>
                            <p className="font-semibold text-violet-700">{(entry.hybridScore ?? 0).toFixed(2)}</p>
                            <p className="text-xs text-violet-600">hybrid pts</p>
                          </>
                        ) : board === "efficiency" ? (
                          <>
                            <p className="font-semibold text-violet-700">{(entry.co2PerKm ?? 0).toFixed(4)}</p>
                            <p className="text-xs text-violet-600">kg/km</p>
                          </>
                        ) : (
                          <>
                            <p className="font-semibold text-violet-700">{entry.activeDays ?? 0}</p>
                            <p className="text-xs text-violet-600">active days</p>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
      </div>
  );
}
