import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ChallengesAPI } from "../api/challenges.api";
import GamificationToast from "../components/common/GamificationToast";
import Footer from "../components/common/Footer";
import UserNavbar from "../components/common/UserNavbar";
import { useGamificationToast } from "../hooks/useGamificationToast";

const FILTERS = {
  transportMode: ["ALL", "BUS", "TRAIN", "BIKE", "WALK", "CAR", "VAN"],
  difficulty: ["ALL", "EASY", "MEDIUM", "HARD"],
  type: ["ALL", "INDIVIDUAL", "SQUAD"],
};

function Pill({ active, children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "rounded-full border px-3 py-1.5 text-sm font-medium transition",
        active
          ? "border-emerald-600 bg-emerald-600 text-white"
          : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

function statusStyle(status) {
  if (status === "COMPLETED") return "bg-emerald-100 text-emerald-800 border-emerald-200";
  if (status === "EXPIRED") return "bg-emerald-100 text-emerald-800 border-emerald-200";
  if (status === "LEFT") return "bg-gray-100 text-gray-700 border-gray-200";
  return "bg-emerald-100 text-emerald-800 border-emerald-200";
}

function isExpiredParticipation(participation) {
  const challenge = participation?.challenge;
  if (!challenge) return false;
  if (challenge.status === "EXPIRED") return true;
  if (!challenge.deadline) return false;
  return new Date(challenge.deadline).getTime() < Date.now();
}

export default function Challenges() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [tab, setTab] = useState("available");
  const [available, setAvailable] = useState([]);
  const [recommended, setRecommended] = useState([]);
  const [myActive, setMyActive] = useState([]);
  const [completed, setCompleted] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [joiningId, setJoiningId] = useState("");
  const [leavingId, setLeavingId] = useState("");
  const [autoSyncing, setAutoSyncing] = useState(false);
  const [autoSyncNotice, setAutoSyncNotice] = useState("");

  const { toast, showToast } = useGamificationToast();
  const [expiredActionNotice, setExpiredActionNotice] = useState("");
  const hasAutoSyncedMyTabRef = useRef(false);
  const autoSyncingRef = useRef(false);
  const lastAutoSyncRunAtRef = useRef(0);

  const [filters, setFilters] = useState({
    transportMode: "ALL",
    difficulty: "ALL",
    type: "ALL",
  });

  useEffect(() => {
    if (!expiredActionNotice) return;
    const id = setTimeout(() => setExpiredActionNotice(""), 5000);
    return () => clearTimeout(id);
  }, [expiredActionNotice]);

  useEffect(() => {
    if (!autoSyncNotice) return;
    const id = setTimeout(() => setAutoSyncNotice(""), 3500);
    return () => clearTimeout(id);
  }, [autoSyncNotice]);

  function handleLogout() {
    logout();
    navigate("/login");
  }

  async function loadAvailableAndRecommended() {
    const params = {
      ...(filters.transportMode !== "ALL" ? { transportMode: filters.transportMode } : {}),
      ...(filters.difficulty !== "ALL" ? { difficulty: filters.difficulty } : {}),
      ...(filters.type !== "ALL" ? { type: filters.type } : {}),
    };

    const [availableRes, recommendedRes] = await Promise.all([
      ChallengesAPI.getChallenges(params),
      ChallengesAPI.getRecommendedChallenges(),
    ]);

    const availableList = Array.isArray(availableRes)
      ? availableRes
      : Array.isArray(availableRes?.challenges)
      ? availableRes.challenges
      : [];

    const recommendedList = Array.isArray(recommendedRes) ? recommendedRes : [];

    setAvailable(availableList);
    setRecommended(recommendedList);
  }

  async function loadMyChallenges() {
    const myRes = await ChallengesAPI.getMyChallenges();
    const myList = Array.isArray(myRes) ? myRes : [];

    const normalized = myList
      .filter((p) => p?.challenge)
      .map((p) => ({
        ...p,
        challengeId: p.challenge?._id || p.challenge,
      }));

    setMyActive(normalized.filter((p) => p.status === "ACTIVE"));
    setCompleted(normalized.filter((p) => p.status === "COMPLETED"));
  }

  async function loadAll() {
    setLoading(true);
    setError("");
    try {
      await Promise.all([loadAvailableAndRecommended(), loadMyChallenges()]);
    } catch (e) {
      const msg = e?.response?.data?.message || e?.message || "Failed to load challenges.";
      setError(msg);
      showToast("error", msg);
    } finally {
      setLoading(false);
    }
  }

  async function refreshChallengeState() {
    await Promise.all([loadAvailableAndRecommended(), loadMyChallenges()]);
  }

  useEffect(() => {
    loadAll();
  }, [filters.transportMode, filters.difficulty, filters.type]);

  const joinedIds = useMemo(() => {
    const ids = new Set();
    myActive.forEach((p) => ids.add(String(p.challengeId || p?.challenge?._id || "")));
    completed.forEach((p) => ids.add(String(p.challengeId || p?.challenge?._id || "")));
    return ids;
  }, [myActive, completed]);

  const stats = useMemo(() => {
    const totalRewarded = completed.reduce((sum, p) => sum + Number(p.rewardedPoints || 0), 0);
    return {
      active: myActive.length,
      completed: completed.length,
      rewarded: totalRewarded,
    };
  }, [myActive, completed]);

  const uniqueRecommended = useMemo(() => {
    const seen = new Set();
    return recommended.filter((item) => {
      const key = String(item?.title || "").trim().toLowerCase();
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [recommended]);

  async function handleJoin(challengeId) {
    setJoiningId(challengeId);
    try {
      await ChallengesAPI.joinChallenge(challengeId);
      showToast("success", "Challenge joined");
      await refreshChallengeState();
    } catch (e) {
      showToast("error", e?.response?.data?.message || "Failed to join challenge");
    } finally {
      setJoiningId("");
    }
  }

  async function handleLeave(challengeId) {
    setLeavingId(challengeId);
    try {
      await ChallengesAPI.leaveChallenge(challengeId);
      await refreshChallengeState();
      showToast("success", "Left challenge");
    } catch (e) {
      if (e?.response?.status === 404) {
        // If participation already changed state, resync to avoid stale local UI.
        await refreshChallengeState();
        showToast("info", "Challenge participation state changed. Refreshed your list.");
      } else {
        showToast("error", e?.response?.data?.message || "Failed to leave challenge");
      }
    } finally {
      setLeavingId("");
    }
  }

  async function syncParticipationProgress(participation, options = {}) {
    const { silent = false } = options;
    const challengeId = participation.challenge?._id || participation.challengeId;
    try {
      const updated = await ChallengesAPI.updateProgress(challengeId, { auto: true });

      if (updated?.autoIncrement === 0) {
        if (!silent) {
          showToast("error", updated?.message || "No new commute data to update this challenge yet.");
        }
        return { outcome: "no-change" };
      }

      if (updated?.status === "COMPLETED") {
        const completedRecord = {
          ...participation,
          ...updated,
          challengeId,
          challenge: participation.challenge,
        };

        setMyActive((prev) => prev.filter((p) => String(p.challengeId) !== String(challengeId)));
        setCompleted((prev) => {
          return [completedRecord, ...prev.filter((p) => String(p.challengeId) !== String(challengeId))];
        });

        if (!silent) {
          showToast(
            "success",
            `Challenge completed. +${updated.rewardedPoints || 0} points awarded.`
          );
          setTab("completed");
        }
        return { outcome: "completed", points: Number(updated.rewardedPoints || 0) };
      } else {
        setMyActive((prev) =>
          prev.map((p) =>
            String(p.challengeId) === String(challengeId)
              ? { ...p, progress: updated.progress, status: updated.status }
              : p
          )
        );
        if (!silent) {
          showToast("success", `Progress updated from commute logs (+${Number(updated?.autoIncrement || 0).toFixed(2)}).`);
        }
        return { outcome: "updated", amount: Number(updated?.autoIncrement || 0) };
      }
    } catch (e) {
      const status = e?.response?.status;
      const message = e?.response?.data?.message || "Failed to update progress";
      if (status === 409 && message === "This challenge has expired.") {
        setMyActive((prev) =>
          prev.map((p) => {
            const pChallengeId = p.challengeId || p.challenge?._id;
            if (String(pChallengeId) !== String(challengeId)) return p;
            return {
              ...p,
              challenge: {
                ...(p.challenge || {}),
                status: "EXPIRED",
              },
            };
          })
        );
        setExpiredActionNotice("This challenge has expired. Progress sync is now disabled.");
      }
      if (status === 409 && /participation is/.test(message)) {
        // Participation changed from ACTIVE (LEFT/COMPLETED), so remove stale local item.
        setMyActive((prev) => prev.filter((p) => String(p.challengeId || p.challenge?._id) !== String(challengeId)));
      }
      if (!silent) {
        showToast("error", e?.response?.data?.message || "Failed to update progress");
      }
      return { outcome: status === 409 ? "expired" : "error" };
    }
  }

  async function runAutoSyncForMyChallenges(options = {}) {
    const { showSummary = true, minIntervalMs = 8000 } = options;
    const now = Date.now();
    if (autoSyncingRef.current) return;
    if (now - lastAutoSyncRunAtRef.current < minIntervalMs) return;

    const activeParticipations = myActive.filter((p) => !isExpiredParticipation(p));
    if (activeParticipations.length === 0) return;

    autoSyncingRef.current = true;
    lastAutoSyncRunAtRef.current = now;
    setAutoSyncing(true);
    let updatedCount = 0;
    let completedCount = 0;
    let noChangeCount = 0;

    try {
      for (const participation of activeParticipations) {
        const result = await syncParticipationProgress(participation, { silent: true });
        if (result?.outcome === "updated") updatedCount += 1;
        if (result?.outcome === "completed") completedCount += 1;
        if (result?.outcome === "no-change") noChangeCount += 1;
      }

      if (showSummary || updatedCount > 0 || completedCount > 0) {
        setAutoSyncNotice(
          `Auto sync complete: ${updatedCount} updated, ${completedCount} completed, ${noChangeCount} no change.`
        );
      }
    } finally {
      autoSyncingRef.current = false;
      setAutoSyncing(false);
    }
  }

  useEffect(() => {
    if (tab !== "my") {
      hasAutoSyncedMyTabRef.current = false;
      return;
    }

    if (hasAutoSyncedMyTabRef.current) return;
    if (myActive.length === 0) return;

    hasAutoSyncedMyTabRef.current = true;
    runAutoSyncForMyChallenges({ showSummary: true, minIntervalMs: 0 });
  }, [tab, myActive]);

  useEffect(() => {
    if (tab !== "my") return;

    const id = setInterval(() => {
      runAutoSyncForMyChallenges({ showSummary: false });
    }, 30000);

    return () => clearInterval(id);
  }, [tab, myActive]);

  useEffect(() => {
    if (tab !== "my") return;

    function onFocusOrVisible() {
      if (document.visibilityState === "visible") {
        runAutoSyncForMyChallenges({ showSummary: false, minIntervalMs: 0 });
      }
    }

    window.addEventListener("focus", onFocusOrVisible);
    document.addEventListener("visibilitychange", onFocusOrVisible);

    return () => {
      window.removeEventListener("focus", onFocusOrVisible);
      document.removeEventListener("visibilitychange", onFocusOrVisible);
    };
  }, [tab, myActive]);

  return (
    <div className="min-h-screen bg-gray-100">
      <UserNavbar userName={user?.name} onLogout={handleLogout} />

      <main className="mx-auto max-w-7xl px-4 py-8">
        <GamificationToast toast={toast} />

        {expiredActionNotice && (
          <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">
            {expiredActionNotice}
          </div>
        )}

        {autoSyncNotice && (
          <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
            {autoSyncNotice}
          </div>
        )}

        <div className="overflow-hidden rounded-3xl border-2 border-emerald-100 bg-white shadow-xl">
          <div className="flex flex-col gap-4 border-b border-emerald-100 bg-linear-to-r from-emerald-700 to-green-600 px-6 py-5 text-white sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <span className="material-icons text-white" style={{ fontSize: "32px" }}>emoji_events</span>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-100">Gamification</p>
                <h2 className="text-2xl font-bold sm:text-3xl">Challenges</h2>
              </div>
            </div>
          </div>

          <div className="px-6 py-6 sm:px-7">
            <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
                <p className="text-xs font-bold uppercase tracking-wider text-emerald-700">Active</p>
                <p className="mt-2 text-3xl font-bold text-emerald-900">{stats.active}</p>
              </div>
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
                <p className="text-xs font-bold uppercase tracking-wider text-emerald-700">Completed</p>
                <p className="mt-2 text-3xl font-bold text-emerald-900">{stats.completed}</p>
              </div>
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
                <p className="text-xs font-bold uppercase tracking-wider text-emerald-700">Rewarded Points</p>
                <p className="mt-2 text-3xl font-bold text-emerald-900">{stats.rewarded}</p>
              </div>
            </div>

            <div className="mb-6 flex flex-wrap gap-2 border-b border-emerald-100 pb-4">
              <Pill active={tab === "available"} onClick={() => setTab("available")}>Available</Pill>
              <Pill active={tab === "my"} onClick={() => setTab("my")}>My Challenges</Pill>
              <Pill active={tab === "completed"} onClick={() => setTab("completed")}>Completed</Pill>
            </div>

            {tab === "available" && (
              <>
                <div className="mb-4 flex flex-wrap gap-3">
                  {Object.entries(FILTERS).map(([key, values]) => (
                    <select
                      key={key}
                      value={filters[key]}
                      onChange={(e) => setFilters((prev) => ({ ...prev, [key]: e.target.value }))}
                      className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700"
                    >
                      {values.map((v) => (
                        <option key={v} value={v}>{key === "type" ? `Type: ${v}` : key === "difficulty" ? `Difficulty: ${v}` : `Mode: ${v}`}</option>
                      ))}
                    </select>
                  ))}
                </div>

                {uniqueRecommended.length > 0 && (
                  <div className="mb-6 rounded-2xl border-2 border-emerald-200 bg-linear-to-br from-emerald-50 via-white to-green-100 p-4 shadow-sm">
                    <p className="mb-3 text-sm font-semibold text-emerald-800">Recommended for you</p>
                    <div className="flex flex-wrap gap-2">
                      {uniqueRecommended.map((c) => (
                        <span key={c._id} className="rounded-full border border-emerald-300 bg-white px-3 py-1 text-xs font-medium text-emerald-800">
                          {c.title}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {loading ? (
                  <div className="py-10 text-center text-gray-600">Loading challenges...</div>
                ) : error ? (
                  <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">{error}</div>
                ) : available.length === 0 ? (
                  <div className="rounded-xl border border-gray-200 bg-gray-50 p-6 text-gray-600">No available challenges found.</div>
                ) : (
                  <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                    {available.map((challenge) => {
                      const alreadyJoined = joinedIds.has(String(challenge._id));
                      return (
                        <div key={challenge._id} className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm">
                          <div className="mb-3 flex items-center justify-between">
                            <h3 className="text-lg font-bold text-gray-900">{challenge.title}</h3>
                            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800">
                              +{challenge.rewardPoints} pts
                            </span>
                          </div>
                          <p className="mb-2 text-sm font-medium text-emerald-700">{challenge.tagline}</p>
                          <p className="mb-4 text-sm text-gray-600">{challenge.description}</p>
                          <div className="mb-4 flex flex-wrap gap-2 text-xs">
                            <span className="rounded-full border border-gray-200 px-2.5 py-1">{challenge.transportMode}</span>
                            <span className="rounded-full border border-gray-200 px-2.5 py-1">{challenge.difficulty}</span>
                            <span className="rounded-full border border-gray-200 px-2.5 py-1">Saving Target: {challenge.emissionTarget} kg</span>
                            <span className="rounded-full border border-gray-200 px-2.5 py-1">{challenge.durationDays} days</span>
                          </div>
                          <button
                            type="button"
                            disabled={alreadyJoined || joiningId === challenge._id}
                            onClick={() => handleJoin(challenge._id)}
                            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {alreadyJoined ? "Joined" : joiningId === challenge._id ? "Joining..." : "Join Challenge"}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}

            {tab === "my" && (
              <>
                {autoSyncing && (
                  <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm font-medium text-emerald-800">
                    Auto-syncing challenge progress from your latest trips...
                  </div>
                )}

                {myActive.length === 0 ? (
                  <div className="rounded-xl border border-gray-200 bg-gray-50 p-6 text-gray-600">No active joined challenges.</div>
                ) : (
                  <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                    {myActive.map((participation) => {
                      const challenge = participation.challenge;
                      const challengeId = participation.challengeId || challenge?._id;
                      const isExpired = isExpiredParticipation(participation);
                      const deadlineText = challenge?.deadline
                        ? new Date(challenge.deadline).toLocaleString()
                        : "No deadline";
                      const current = Number(participation.progress || 0);
                      const target = Number(challenge?.emissionTarget || 1);
                      const percent = Math.min(100, Math.round((current / target) * 100));
                      return (
                        <div key={challengeId} className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm">
                          <div className="mb-3 flex items-center justify-between">
                            <h3 className="text-lg font-bold text-gray-900">{challenge?.title || "Challenge"}</h3>
                            <span className={[
                              "rounded-full border px-2.5 py-1 text-xs font-semibold",
                              statusStyle(participation.status),
                            ].join(" ")}>
                              {participation.status}
                            </span>
                          </div>

                          <p className="mb-3 text-sm text-gray-600">{challenge?.description}</p>

                          <div className="mb-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700">
                            <span className="font-semibold">
                              {isExpired ? "Expired on: " : "Deadline: "}
                            </span>
                            {deadlineText}
                          </div>

                          {isExpired && (
                            <div className="mb-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
                              This challenge has expired. You can view progress but cannot sync new progress.
                            </div>
                          )}

                          <div className="mb-2 flex items-center justify-between text-xs text-gray-600">
                            <span>{current.toFixed(2)} / {target.toFixed(2)}</span>
                            <span>{percent}%</span>
                          </div>
                          <div className="mb-4 h-2 w-full overflow-hidden rounded-full bg-gray-100">
                            <div className="h-full rounded-full bg-emerald-500" style={{ width: `${percent}%` }} />
                          </div>

                          <button
                            type="button"
                            onClick={() => handleLeave(challengeId)}
                            disabled={leavingId === challengeId}
                            className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-100 disabled:opacity-50"
                          >
                            {leavingId === challengeId ? "Leaving..." : "Leave Challenge"}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}

            {tab === "completed" && (
              <>
                {completed.length === 0 ? (
                  <div className="rounded-xl border border-gray-200 bg-gray-50 p-6 text-gray-600">No completed challenges yet.</div>
                ) : (
                  <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                    {completed.map((participation) => {
                      const challenge = participation.challenge;
                      const id = participation.challengeId || challenge?._id;
                      return (
                        <div key={id} className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm">
                          <div className="mb-3 flex items-center justify-between">
                            <h3 className="text-lg font-bold text-gray-900">{challenge?.title || "Challenge"}</h3>
                            <span className="rounded-full border border-emerald-200 bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-800">COMPLETED</span>
                          </div>
                          <p className="mb-3 text-sm text-gray-600">{challenge?.description}</p>
                          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-emerald-800">
                            <p className="text-sm font-semibold">Reward Received: +{participation.rewardedPoints || 0} points</p>
                            {participation.rewardGrantedAt && (
                              <p className="mt-1 text-xs">
                                Awarded at {new Date(participation.rewardGrantedAt).toLocaleString()}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
