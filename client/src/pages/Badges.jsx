import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import BadgeCard from "../components/gamification/BadgeCard";
import { BadgesAPI } from "../api/badges.api";
import { useCommute } from "../context/CommuteContext";
import { useAuth } from "../context/AuthContext";
import GamificationToast from "../components/common/GamificationToast";
import { useGamificationToast } from "../hooks/useGamificationToast";

const TYPE_OPTIONS = [
  { key: "ALL", label: "All" },
  { key: "TRIP_COUNT", label: "Trip Count" },
  { key: "TOTAL_DISTANCE", label: "Total Distance" },
  { key: "TOTAL_CO2_SAVED", label: "CO₂ Saved" },
];

function FilterChip({ active, children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "px-3 py-1.5 rounded-full text-sm border transition",
        active
          ? "bg-emerald-600 text-white border-emerald-600"
          : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

export default function Badges() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { refreshTrigger } = useCommute();
  const [badges, setBadges] = useState([]);
  const [earnedIds, setEarnedIds] = useState(new Set());
  const [activeTab, setActiveTab] = useState("all"); // "all" or "mine"
  const [activeType, setActiveType] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedBadge, setSelectedBadge] = useState(null);
  const [modalImageFailed, setModalImageFailed] = useState(false);
  const { toast, showToast } = useGamificationToast();
  const selectedBadgeImage =
    selectedBadge?.imageUrl || selectedBadge?.image || selectedBadge?.iconUrl || "";
  const selectedBadgeEarned = selectedBadge ? earnedIds.has(selectedBadge?._id) : false;

  async function loadBadges(options = {}) {
    const { notifySuccess = false, silentError = false } = options;
    setLoading(true);
    setError("");
    try {
      // Fetch all badges and the current user's earned badges in parallel
      // to avoid two sequential round trips to the server
      const [data, earnedData] = await Promise.all([
        BadgesAPI.getAllBadges(),
        BadgesAPI.getMyEarnedBadges(),
      ]);

      // Normalize earned badges — UserBadge documents can be populated (badgeId._id)
      // or unpopulated (badgeId as a raw ObjectId string), so handle both shapes
      const earnedList = Array.isArray(earnedData)
        ? earnedData
        : Array.isArray(earnedData?.data)
        ? earnedData.data
        : Array.isArray(earnedData?.badges)
        ? earnedData.badges
        : [];
      setEarnedIds(new Set(earnedList.map((b) => b?.badgeId?._id || b?.badgeId || b?._id)));

      // Normalize all-badges response — backend may return a plain array,
      // { badges: [] }, or { data: [] } depending on the controller version
      const list = Array.isArray(data)
        ? data
        : Array.isArray(data?.badges)
        ? data.badges
        : Array.isArray(data?.data)
        ? data.data
        : [];

      setBadges(list);
      if (notifySuccess) {
        showToast("success", "Badges refreshed.");
      }
    } catch (e) {
      const msg =
        e?.response?.data?.message ||
        e?.message ||
        "Failed to load badges. Please try again.";

      setError(msg);
      if (!silentError) {
        showToast("error", msg);
      }
      setBadges([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadBadges({ silentError: true });
  }, [refreshTrigger]);

  async function handleRetry() {
    await loadBadges({ notifySuccess: true });
  }

  const filteredBadges = useMemo(() => {
    // First apply the My Badges / All Badges tab filter
    let list = activeTab === "mine" ? badges.filter((b) => earnedIds.has(b?._id)) : badges;
    // Then apply the type chip filter on top
    if (activeType !== "ALL") list = list.filter((b) => b?.type === activeType);
    return list;
  }, [badges, activeType, activeTab, earnedIds]);

  const completionRate = useMemo(() => {
    if (!badges.length) return 0;
    return Math.round((earnedIds.size / badges.length) * 100);
  }, [badges.length, earnedIds.size]);

  function handleLogout() {
    logout();
    navigate("/login");
  }

  function openBadgeModal(badge) {
    setModalImageFailed(false);
    setSelectedBadge(badge);
  }

  function closeBadgeModal() {
    setSelectedBadge(null);
  }

  useEffect(() => {
    if (!selectedBadge) return;

    const onKeyDown = (e) => {
      if (e.key === "Escape") closeBadgeModal();
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [selectedBadge]);

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
            <button onClick={() => navigate("/weather-suggestion")} className="inline-flex items-center gap-1.5 rounded-full border border-emerald-300 bg-emerald-50 px-3.5 py-2 text-sm font-semibold text-emerald-900 transition hover:bg-emerald-100 hover:border-emerald-400"><span className="material-icons" style={{ fontSize: "17px" }}>cloud</span>Check Weather</button>
            <button onClick={() => navigate("/badges")} className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400 bg-emerald-100 px-3.5 py-2 text-sm font-semibold text-emerald-900 transition hover:bg-emerald-200 hover:border-emerald-500"><span className="material-icons" style={{ fontSize: "17px" }}>workspace_premium</span>Badges</button>
            <button onClick={() => navigate("/leaderboard")} className="inline-flex items-center gap-1.5 rounded-full border border-emerald-300 bg-emerald-50 px-3.5 py-2 text-sm font-semibold text-emerald-900 transition hover:bg-emerald-100 hover:border-emerald-400"><span className="material-icons" style={{ fontSize: "17px" }}>leaderboard</span>Leaderboard</button>
            <button onClick={() => navigate("/challenges")} className="inline-flex items-center gap-1.5 rounded-full border border-emerald-300 bg-emerald-50 px-3.5 py-2 text-sm font-semibold text-emerald-900 transition hover:bg-emerald-100 hover:border-emerald-400"><span className="material-icons" style={{ fontSize: "17px" }}>emoji_events</span>Challenges</button>
            <button onClick={() => navigate("/trip-achievements")} className="inline-flex items-center gap-1.5 rounded-full border border-emerald-300 bg-emerald-50 px-3.5 py-2 text-sm font-semibold text-emerald-900 transition hover:bg-emerald-100 hover:border-emerald-400"><span className="material-icons" style={{ fontSize: "17px" }}>military_tech</span>Achievements</button>
            <button onClick={() => navigate("/commute-history")} className="inline-flex items-center gap-1.5 rounded-full border border-emerald-300 bg-emerald-50 px-3.5 py-2 text-sm font-semibold text-emerald-900 transition hover:bg-emerald-100 hover:border-emerald-400"><span className="material-icons" style={{ fontSize: "17px" }}>history</span>Trip History</button>
            <button onClick={handleLogout} className="inline-flex items-center gap-1.5 rounded-full border border-rose-300 bg-rose-50 px-3.5 py-2 text-sm font-semibold text-rose-900 transition hover:bg-rose-100 hover:border-rose-400"><span className="material-icons" style={{ fontSize: "17px" }}>logout</span>Logout</button>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-7xl px-4 py-8">
        <GamificationToast toast={toast} />
        <div className="overflow-hidden rounded-3xl border-2 border-emerald-100 bg-white shadow-xl">
          <div className="flex flex-col gap-4 border-b border-emerald-100 bg-linear-to-r from-emerald-700 to-green-600 px-6 py-5 text-white sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <span className="material-icons text-white" style={{ fontSize: "32px" }}>workspace_premium</span>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-100">Gamification</p>
                <h2 className="text-2xl font-bold sm:text-3xl">Badges</h2>
              </div>
            </div>
          </div>

          <div className="px-6 py-6 sm:px-7">
            <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="rounded-2xl border-2 border-emerald-200 bg-linear-to-br from-emerald-50 via-white to-green-100 p-5 shadow-sm transition hover:shadow-md">
                <p className="text-xs font-bold uppercase tracking-wider text-emerald-700">Total Badges</p>
                <p className="mt-2 text-3xl font-bold text-emerald-900">{badges.length}</p>
              </div>
              <div className="rounded-2xl border-2 border-emerald-200 bg-linear-to-br from-emerald-50 via-white to-green-100 p-5 shadow-sm transition hover:shadow-md">
                <p className="text-xs font-bold uppercase tracking-wider text-emerald-700">Earned</p>
                <p className="mt-2 text-3xl font-bold text-emerald-900">{earnedIds.size}</p>
              </div>
              <div className="rounded-2xl border-2 border-emerald-200 bg-linear-to-br from-emerald-50 via-white to-green-100 p-5 shadow-sm transition hover:shadow-md">
                <p className="text-xs font-bold uppercase tracking-wider text-emerald-700">Completion Rate</p>
                <p className="mt-2 text-3xl font-bold text-emerald-900">{completionRate}%</p>
              </div>
            </div>

            <div className="mb-4 flex flex-wrap gap-2 border-b border-emerald-100 pb-4">
              <button
                type="button"
                onClick={() => setActiveTab("all")}
                className={[
                  "rounded-full border px-4 py-2 text-sm font-semibold transition",
                  activeTab === "all"
                    ? "border-emerald-600 bg-emerald-600 text-white"
                    : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50",
                ].join(" ")}
              >
                All Badges
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("mine")}
                className={[
                  "rounded-full border px-4 py-2 text-sm font-semibold transition",
                  activeTab === "mine"
                    ? "border-emerald-600 bg-emerald-600 text-white"
                    : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50",
                ].join(" ")}
              >
                My Badges
                {earnedIds.size > 0 && (
                  <span className="ml-2 rounded-full border border-emerald-200 bg-white px-1.5 py-0.5 text-xs font-bold text-emerald-700">
                    {earnedIds.size}
                  </span>
                )}
              </button>
            </div>

            <div className="mb-6 flex flex-wrap gap-2">
              {TYPE_OPTIONS.map((opt) => (
                <FilterChip
                  key={opt.key}
                  active={activeType === opt.key}
                  onClick={() => setActiveType(opt.key)}
                >
                  {opt.label}
                </FilterChip>
              ))}
            </div>

            {loading && <div className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-10 text-center text-emerald-700">Loading badges...</div>}

            {!loading && error && (
              <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
                <h3 className="text-lg font-semibold text-red-900">Couldn't load badges</h3>
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

            {!loading && !error && filteredBadges.length === 0 && (
              <div className="rounded-2xl border border-emerald-100 bg-emerald-50/40 p-6">
                <h3 className="text-lg font-semibold text-emerald-900">No badges found</h3>
                <p className="mt-2 text-sm text-emerald-700">Try changing the filter or check again later.</p>
              </div>
            )}

            {!loading && !error && filteredBadges.length > 0 && (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {filteredBadges.map((badge) => (
                  <BadgeCard
                    key={badge?._id || badge?.id}
                    badge={badge}
                    earned={earnedIds.has(badge?._id)}
                    onClick={() => openBadgeModal(badge)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {selectedBadge && (
        <div
          className="fixed inset-0 z-3000 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm"
          onClick={closeBadgeModal}
        >
          <div
            className="w-full max-w-2xl overflow-hidden rounded-3xl border border-emerald-200 bg-white shadow-2xl animate-in fade-in zoom-in-95 duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative h-60 bg-linear-to-br from-emerald-700 via-green-600 to-teal-600">
              {selectedBadgeImage && !modalImageFailed ? (
                <img
                  src={selectedBadgeImage}
                  alt={selectedBadge?.name || "Badge"}
                  className={[
                    "absolute inset-0 h-full w-full object-cover transition",
                    selectedBadgeEarned ? "" : "grayscale opacity-55",
                  ].join(" ")}
                  referrerPolicy="no-referrer"
                  onError={() => setModalImageFailed(true)}
                />
              ) : (
                <div
                  className={[
                    "absolute inset-0 flex items-center justify-center bg-linear-to-br from-emerald-300 to-teal-500 text-6xl font-black text-white/90 transition",
                    selectedBadgeEarned ? "" : "grayscale opacity-60",
                  ].join(" ")}
                >
                  {(selectedBadge?.name || "B")
                    .split(" ")
                    .filter(Boolean)
                    .slice(0, 2)
                    .map((s) => s[0]?.toUpperCase() || "")
                    .join("") || "★"}
                </div>
              )}
              <div className="pointer-events-none absolute inset-0 bg-linear-to-b from-slate-900/25 via-emerald-900/45 to-slate-900/60" />

              {!selectedBadgeEarned && (
                <div className="pointer-events-none absolute inset-0 z-30 bg-slate-700/45" />
              )}

              <button
                type="button"
                onClick={closeBadgeModal}
                className="absolute right-4 top-4 z-40 rounded-full border border-white/40 bg-white/20 px-3 py-1 text-xs font-semibold text-white transition hover:bg-white/30"
              >
                Close
              </button>

              <div className="pointer-events-none absolute inset-0 bg-radial-[ellipse_at_center] from-white/30 via-transparent to-transparent" />

              <div
                className={[
                  "pointer-events-none absolute left-1/2 top-1/2 z-20 flex h-36 w-36 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-4 border-amber-200 bg-linear-to-br from-amber-200 to-yellow-500 text-5xl text-amber-900 shadow-xl animate-pulse transition",
                  selectedBadgeEarned ? "" : "grayscale opacity-65",
                ].join(" ")}
              >
                ★
              </div>

              <div className="pointer-events-none absolute bottom-4 left-1/2 z-20 -translate-x-1/2 rounded-full border border-white/30 bg-white/20 px-3 py-1 text-xs font-bold text-white">
                {earnedIds.has(selectedBadge?._id) ? "EARNED BADGE" : "LOCKED BADGE"}
              </div>
            </div>

            <div className="px-6 py-6">
              <h3 className="text-center text-2xl font-extrabold tracking-tight text-slate-900">
                {selectedBadge?.name || "Badge"}
              </h3>

              <p className="mt-2 text-center text-sm text-slate-600">
                {selectedBadge?.description || "No description provided."}
              </p>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}