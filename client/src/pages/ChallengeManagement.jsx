import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ChallengesAPI } from "../api/challenges.api";
import GamificationToast from "../components/common/GamificationToast";
import { useGamificationToast } from "../hooks/useGamificationToast";

const TRANSPORT_MODES = ["BUS", "TRAIN", "BIKE", "WALK", "CAR", "VAN"];
const DIFFICULTIES = ["EASY", "MEDIUM", "HARD"];
const TYPES = ["INDIVIDUAL", "SQUAD"];
const STATUSES = ["ACTIVE", "INACTIVE"];

const EMPTY_CREATE_FORM = {
  transportMode: "BUS",
  emissionTarget: "",
  durationDays: "",
  difficulty: "EASY",
  type: "INDIVIDUAL",
  rewardPoints: "",
};

const EMPTY_EDIT_FORM = {
  emissionTarget: "",
  durationDays: "",
  rewardPoints: "",
  status: "ACTIVE",
  deadline: "",
};

export default function ChallengeManagement() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [query, setQuery] = useState("");

  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState(EMPTY_CREATE_FORM);
  const [createError, setCreateError] = useState("");
  const [createSaving, setCreateSaving] = useState(false);

  const [editOpen, setEditOpen] = useState(false);
  const [editingChallenge, setEditingChallenge] = useState(null);
  const [editForm, setEditForm] = useState(EMPTY_EDIT_FORM);
  const [initialEditForm, setInitialEditForm] = useState(EMPTY_EDIT_FORM);
  const [editError, setEditError] = useState("");
  const [editSaving, setEditSaving] = useState(false);

  const [deletingId, setDeletingId] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);
  const { toast, showToast } = useGamificationToast();

  function handleLogout() {
    logout();
    navigate("/login");
  }

  async function loadChallenges(options = {}) {
    const { notifySuccess = false, silentError = false } = options;
    setLoading(true);
    setError("");
    try {
      const data = await ChallengesAPI.getAdminChallenges({ page: 1, limit: 100 });
      const list = Array.isArray(data)
        ? data
        : Array.isArray(data?.challenges)
        ? data.challenges
        : [];
      setChallenges(list);
      if (notifySuccess) {
        showToast("success", "Challenges refreshed.");
      }
    } catch (e) {
      const msg = e?.response?.data?.message || e?.message || "Failed to load challenges.";
      setError(msg);
      if (!silentError) {
        showToast("error", msg);
      }
      setChallenges([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadChallenges({ silentError: true });
  }, []);

  const filteredChallenges = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return challenges;
    return challenges.filter((c) =>
      [c.title, c.tagline, c.description, c.transportMode, c.difficulty, c.type]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q))
    );
  }, [challenges, query]);

  const stats = useMemo(() => {
    const total = challenges.length;
    const active = challenges.filter((c) => c.status === "ACTIVE").length;
    const inactive = challenges.filter((c) => c.status === "INACTIVE").length;
    const avgReward = total
      ? Math.round(challenges.reduce((sum, c) => sum + Number(c.rewardPoints || 0), 0) / total)
      : 0;
    return { total, active, inactive, avgReward };
  }, [challenges]);

  const hasCreateChanges = useMemo(() => {
    return (
      createForm.transportMode !== EMPTY_CREATE_FORM.transportMode ||
      createForm.emissionTarget !== EMPTY_CREATE_FORM.emissionTarget ||
      createForm.durationDays !== EMPTY_CREATE_FORM.durationDays ||
      createForm.difficulty !== EMPTY_CREATE_FORM.difficulty ||
      createForm.type !== EMPTY_CREATE_FORM.type ||
      createForm.rewardPoints !== EMPTY_CREATE_FORM.rewardPoints
    );
  }, [createForm]);

  const createValidationMessage = useMemo(() => validateCreate(), [createForm]);

  function validateCreate() {
    if (!TRANSPORT_MODES.includes(createForm.transportMode)) return "Invalid transport mode.";
    const target = Number(createForm.emissionTarget);
    if (!Number.isFinite(target) || target <= 0) return "CO2 saving target must be positive.";
    const days = Number(createForm.durationDays);
    if (!Number.isInteger(days) || days < 1) return "Duration must be at least 1 day.";
    if (!DIFFICULTIES.includes(createForm.difficulty)) return "Invalid difficulty.";
    if (!TYPES.includes(createForm.type)) return "Invalid challenge type.";
    const points = Number(createForm.rewardPoints);
    if (!Number.isInteger(points) || points < 1) return "Reward points must be at least 1.";
    return "";
  }

  async function handleCreateSubmit(e) {
    e.preventDefault();
    setCreateError("");
    const validationMessage = validateCreate();
    if (validationMessage) {
      setCreateError(validationMessage);
      return;
    }

    setCreateSaving(true);
    try {
      await ChallengesAPI.createChallenge({
        transportMode: createForm.transportMode,
        emissionTarget: Number(createForm.emissionTarget),
        durationDays: Number(createForm.durationDays),
        difficulty: createForm.difficulty,
        type: createForm.type,
        rewardPoints: Number(createForm.rewardPoints),
      });
      setCreateOpen(false);
      setCreateForm(EMPTY_CREATE_FORM);
      await loadChallenges();
      showToast("success", "Challenge created successfully.");
    } catch (e2) {
      setCreateError(e2?.response?.data?.message || e2?.message || "Create failed.");
      showToast("error", e2?.response?.data?.message || e2?.message || "Create failed.");
    } finally {
      setCreateSaving(false);
    }
  }

  function openEdit(challenge) {
    const initialForm = {
      emissionTarget: String(challenge.emissionTarget ?? ""),
      durationDays: String(challenge.durationDays ?? ""),
      rewardPoints: String(challenge.rewardPoints ?? ""),
      status: challenge.status || "ACTIVE",
      deadline: challenge.deadline ? String(challenge.deadline).slice(0, 10) : "",
    };

    setEditingChallenge(challenge);
    setEditError("");
    setEditForm(initialForm);
    setInitialEditForm(initialForm);
    setEditOpen(true);
  }

  const hasEditChanges = useMemo(() => {
    if (!editOpen) return false;
    return (
      editForm.emissionTarget !== initialEditForm.emissionTarget ||
      editForm.durationDays !== initialEditForm.durationDays ||
      editForm.rewardPoints !== initialEditForm.rewardPoints ||
      editForm.status !== initialEditForm.status ||
      editForm.deadline !== initialEditForm.deadline
    );
  }, [editForm, initialEditForm, editOpen]);

  function validateEdit() {
    const target = Number(editForm.emissionTarget);
    if (!Number.isFinite(target) || target <= 0) return "CO2 saving target must be positive.";
    const days = Number(editForm.durationDays);
    if (!Number.isInteger(days) || days < 1) return "Duration must be at least 1 day.";
    const points = Number(editForm.rewardPoints);
    if (!Number.isInteger(points) || points < 1) return "Reward points must be at least 1.";
    if (!STATUSES.includes(editForm.status)) return "Invalid status.";
    if (editForm.deadline) {
      const date = new Date(editForm.deadline);
      if (Number.isNaN(date.getTime())) return "Invalid deadline date.";
    }
    return "";
  }

  async function handleEditSubmit(e) {
    e.preventDefault();
    if (!editingChallenge?._id) return;

    setEditError("");
    const validationMessage = validateEdit();
    if (validationMessage) {
      setEditError(validationMessage);
      return;
    }

    setEditSaving(true);
    try {
      await ChallengesAPI.updateChallenge(editingChallenge._id, {
        emissionTarget: Number(editForm.emissionTarget),
        durationDays: Number(editForm.durationDays),
        rewardPoints: Number(editForm.rewardPoints),
        status: editForm.status,
        deadline: editForm.deadline ? new Date(editForm.deadline).toISOString() : null,
      });
      setEditOpen(false);
      setEditingChallenge(null);
      await loadChallenges();
      showToast("success", "Challenge updated successfully.");
    } catch (e2) {
      setEditError(e2?.response?.data?.message || e2?.message || "Update failed.");
      showToast("error", e2?.response?.data?.message || e2?.message || "Update failed.");
    } finally {
      setEditSaving(false);
    }
  }

  async function handleDelete(id) {
    setDeleteError("");
    setDeleteLoading(true);
    try {
      await ChallengesAPI.deleteChallenge(id);
      setDeletingId("");
      await loadChallenges();
      showToast("success", "Challenge deleted.");
    } catch (e) {
      setDeleteError(e?.response?.data?.message || e?.message || "Delete failed.");
      showToast("error", e?.response?.data?.message || e?.message || "Delete failed.");
    } finally {
      setDeleteLoading(false);
    }
  }

  async function handleRetryLoad() {
    await loadChallenges({ notifySuccess: true });
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
              <p className="hidden text-xs font-medium text-emerald-700/80 md:block">Admin controls</p>
            </div>
          </div>

          <div className="flex min-w-0 flex-1 flex-nowrap items-center justify-end gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3.5 py-2 text-sm font-semibold text-emerald-800 shadow-sm">
              <span className="material-icons" style={{ fontSize: "17px" }}>person</span>
              {user?.name || "Admin"}
            </span>
            <button onClick={() => navigate("/admin")} className="inline-flex items-center gap-1.5 rounded-full border border-emerald-300 bg-emerald-100 px-3.5 py-2 text-sm font-semibold text-emerald-900 transition hover:bg-emerald-200 hover:border-emerald-400"><span className="material-icons" style={{ fontSize: "17px" }}>admin_panel_settings</span>Admin</button>
            <button onClick={() => navigate("/admin/users")} className="inline-flex items-center gap-1.5 rounded-full border border-cyan-300 bg-cyan-50 px-3.5 py-2 text-sm font-semibold text-cyan-900 transition hover:bg-cyan-100 hover:border-cyan-400"><span className="material-icons" style={{ fontSize: "17px" }}>groups</span>Users</button>
            <button onClick={() => navigate("/admin/reports")} className="inline-flex items-center gap-1.5 rounded-full border border-blue-300 bg-blue-50 px-3.5 py-2 text-sm font-semibold text-blue-900 transition hover:bg-blue-100 hover:border-blue-400"><span className="material-icons" style={{ fontSize: "17px" }}>analytics</span>Reports</button>
            <button onClick={() => navigate("/admin/challenges")} className="inline-flex items-center gap-1.5 rounded-full border border-indigo-300 bg-indigo-100 px-3.5 py-2 text-sm font-semibold text-indigo-900 transition hover:bg-indigo-200 hover:border-indigo-400"><span className="material-icons" style={{ fontSize: "17px" }}>emoji_events</span>Challenges</button>
            <button onClick={handleLogout} className="inline-flex items-center gap-1.5 rounded-full border border-rose-300 bg-rose-50 px-3.5 py-2 text-sm font-semibold text-rose-900 transition hover:bg-rose-100 hover:border-rose-400"><span className="material-icons" style={{ fontSize: "17px" }}>logout</span>Logout</button>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-7xl px-4 py-8">
        <GamificationToast toast={toast} />
        <div className="overflow-hidden rounded-3xl border-2 border-emerald-100 bg-white shadow-xl">
          <div className="flex flex-col gap-4 border-b border-emerald-100 bg-linear-to-r from-emerald-700 to-green-600 px-6 py-5 text-white sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <span className="material-icons text-white" style={{ fontSize: "32px" }}>emoji_events</span>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-100">Administration</p>
                <h2 className="text-2xl font-bold sm:text-3xl">Challenge Management</h2>
              </div>
            </div>
            <button
              onClick={() => setCreateOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-full border border-emerald-100 bg-white px-4 py-2 text-sm font-semibold text-emerald-800 transition hover:bg-emerald-50"
            >
              <span className="material-icons" style={{ fontSize: "17px" }}>add_circle</span>
              Create Challenge
            </button>
          </div>

          <div className="px-6 py-6 sm:px-7">
            <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
              <div className="rounded-2xl border-2 border-emerald-200 bg-linear-to-br from-emerald-50 via-white to-green-100 p-5 shadow-sm">
                <p className="text-xs font-bold uppercase tracking-wider text-emerald-700">Total</p>
                <p className="mt-2 text-3xl font-bold text-emerald-900">{stats.total}</p>
              </div>
              <div className="rounded-2xl border-2 border-blue-200 bg-linear-to-br from-blue-50 via-white to-emerald-50 p-5 shadow-sm">
                <p className="text-xs font-bold uppercase tracking-wider text-blue-700">Active</p>
                <p className="mt-2 text-3xl font-bold text-blue-900">{stats.active}</p>
              </div>
              <div className="rounded-2xl border-2 border-amber-200 bg-linear-to-br from-amber-50 via-white to-lime-50 p-5 shadow-sm">
                <p className="text-xs font-bold uppercase tracking-wider text-amber-700">Inactive</p>
                <p className="mt-2 text-3xl font-bold text-amber-900">{stats.inactive}</p>
              </div>
              <div className="rounded-2xl border-2 border-indigo-200 bg-linear-to-br from-indigo-50 via-white to-blue-50 p-5 shadow-sm">
                <p className="text-xs font-bold uppercase tracking-wider text-indigo-700">Avg Reward</p>
                <p className="mt-2 text-3xl font-bold text-indigo-900">{stats.avgReward}</p>
              </div>
            </div>

            <div className="mb-4">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by title, mode, type, or difficulty"
                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-800"
              />
            </div>

            {loading && <div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-10 text-center text-emerald-700">Loading challenges...</div>}

            {!loading && error && (
              <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
                <p className="text-red-700">{error}</p>
                <button onClick={handleRetryLoad} className="mt-3 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700">Retry</button>
              </div>
            )}

            {!loading && !error && (
              <div className="overflow-hidden rounded-2xl border border-emerald-100 bg-white shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-195 text-sm">
                    <thead className="border-b border-emerald-100 bg-emerald-50/80">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-emerald-700">Title</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-emerald-700">Mode</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-emerald-700">Type</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-emerald-700">Difficulty</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-emerald-700">Reward</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-emerald-700">Status</th>
                        <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-emerald-700">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-emerald-50">
                      {filteredChallenges.length === 0 && (
                        <tr>
                          <td colSpan={7} className="px-6 py-10 text-center text-gray-500">No challenges found.</td>
                        </tr>
                      )}
                      {filteredChallenges.map((c) => (
                        <tr key={c._id} className="transition hover:bg-emerald-50/40">
                          <td className="max-w-95 truncate px-6 py-4 font-semibold text-gray-900">{c.title}</td>
                          <td className="px-6 py-4 text-gray-700">{c.transportMode}</td>
                          <td className="px-6 py-4 text-gray-700">{c.type}</td>
                          <td className="px-6 py-4 text-gray-700">{c.difficulty}</td>
                          <td className="px-6 py-4 text-gray-700">{c.rewardPoints}</td>
                          <td className="px-6 py-4">
                            <span className={[
                              "rounded-full border px-2.5 py-1 text-xs font-semibold",
                              c.status === "ACTIVE"
                                ? "border-emerald-200 bg-emerald-100 text-emerald-800"
                                : "border-gray-200 bg-gray-100 text-gray-700",
                            ].join(" ")}>
                              {c.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button onClick={() => openEdit(c)} className="mr-4 font-semibold text-blue-600 transition hover:text-blue-800">Edit</button>
                            <button onClick={() => setDeletingId(c._id)} className="font-semibold text-red-500 transition hover:text-red-700">Delete</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {createOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-emerald-100 bg-white p-6 shadow-xl">
            <h3 className="mb-1 text-lg font-bold text-gray-900">Create Challenge</h3>
            <p className="mb-4 text-sm text-gray-600">Configure the challenge settings. Title and description are generated automatically.</p>

            <div className="mb-4 rounded-xl border border-emerald-100 bg-emerald-50/60 p-4">
              <p className="text-sm font-semibold text-emerald-900">Challenge Summary</p>
              <div className="mt-2 flex flex-wrap gap-2 text-xs">
                <span className="rounded-full border border-emerald-200 bg-white px-2.5 py-1 font-semibold text-emerald-700">
                  {createForm.transportMode}
                </span>
                <span className="rounded-full border border-emerald-200 bg-white px-2.5 py-1 font-semibold text-emerald-700">
                  {createForm.type}
                </span>
                <span className="rounded-full border border-emerald-200 bg-white px-2.5 py-1 font-semibold text-emerald-700">
                  {createForm.difficulty}
                </span>
                {createForm.durationDays && (
                  <span className="rounded-full border border-emerald-200 bg-white px-2.5 py-1 font-semibold text-emerald-700">
                    {createForm.durationDays} days
                  </span>
                )}
                {createForm.rewardPoints && (
                  <span className="rounded-full border border-emerald-200 bg-white px-2.5 py-1 font-semibold text-emerald-700">
                    +{createForm.rewardPoints} pts
                  </span>
                )}
              </div>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-semibold text-gray-800">Transport Mode</label>
                  <select
                    value={createForm.transportMode}
                    onChange={(e) => setCreateForm((p) => ({ ...p, transportMode: e.target.value }))}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                  >
                    {TRANSPORT_MODES.map((m) => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-semibold text-gray-800">Challenge Type</label>
                  <select
                    value={createForm.type}
                    onChange={(e) => setCreateForm((p) => ({ ...p, type: e.target.value }))}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                  >
                    {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold text-gray-800">CO2 Saving Target (kg)</label>
                <input
                  type="number"
                  min="0.1"
                  step="0.1"
                  value={createForm.emissionTarget}
                  onChange={(e) => setCreateForm((p) => ({ ...p, emissionTarget: e.target.value }))}
                  placeholder="e.g. 10"
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-semibold text-gray-800">Duration (days)</label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={createForm.durationDays}
                    onChange={(e) => setCreateForm((p) => ({ ...p, durationDays: e.target.value }))}
                    placeholder="e.g. 7"
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                  />
                  <p className="mt-1 text-xs text-gray-500">Deadline is generated from this duration when challenge is created.</p>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-semibold text-gray-800">Reward Points</label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={createForm.rewardPoints}
                    onChange={(e) => setCreateForm((p) => ({ ...p, rewardPoints: e.target.value }))}
                    placeholder="e.g. 120"
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold text-gray-800">Difficulty</label>
                <select
                  value={createForm.difficulty}
                  onChange={(e) => setCreateForm((p) => ({ ...p, difficulty: e.target.value }))}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                >
                  {DIFFICULTIES.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>

              {createError && <p className="text-sm text-red-600">{createError}</p>}
              {!createError && (!hasCreateChanges || createValidationMessage) && (
                <p className="text-xs text-gray-500">Fill required fields to enable challenge creation.</p>
              )}
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setCreateOpen(false);
                    setCreateError("");
                    setCreateForm(EMPTY_CREATE_FORM);
                  }}
                  className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createSaving || !hasCreateChanges || !!createValidationMessage}
                  className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
                >
                  {createSaving ? "Creating..." : "Create Challenge"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-emerald-100 bg-white p-6 shadow-xl">
            <h3 className="mb-1 text-lg font-bold text-gray-900">Edit Challenge</h3>
            <p className="mb-4 text-sm text-gray-600">Adjust values below and save your updates.</p>

            {editingChallenge && (
              <div className="mb-4 rounded-xl border border-emerald-100 bg-emerald-50/60 p-4">
                <p className="text-sm font-semibold text-emerald-900">{editingChallenge.title}</p>
                <p className="mt-1 text-xs text-emerald-800/80">{editingChallenge.tagline || "No tagline"}</p>
                <div className="mt-2 flex flex-wrap gap-2 text-xs">
                  <span className="rounded-full border border-emerald-200 bg-white px-2.5 py-1 font-semibold text-emerald-700">
                    {editingChallenge.transportMode}
                  </span>
                  <span className="rounded-full border border-emerald-200 bg-white px-2.5 py-1 font-semibold text-emerald-700">
                    {editingChallenge.type}
                  </span>
                  <span className="rounded-full border border-emerald-200 bg-white px-2.5 py-1 font-semibold text-emerald-700">
                    {editingChallenge.difficulty}
                  </span>
                </div>
              </div>
            )}

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-semibold text-gray-800">CO2 Saving Target (kg)</label>
                <input
                  type="number"
                  min="0.1"
                  step="0.1"
                  value={editForm.emissionTarget}
                  onChange={(e) => setEditForm((p) => ({ ...p, emissionTarget: e.target.value }))}
                  placeholder="e.g. 10"
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-semibold text-gray-800">Duration (days)</label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={editForm.durationDays}
                    onChange={(e) => setEditForm((p) => ({ ...p, durationDays: e.target.value }))}
                    placeholder="e.g. 7"
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-semibold text-gray-800">Reward Points</label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={editForm.rewardPoints}
                    onChange={(e) => setEditForm((p) => ({ ...p, rewardPoints: e.target.value }))}
                    placeholder="e.g. 120"
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <div>
                <p className="mb-2 block text-sm font-semibold text-gray-800">Status</p>
                <div className="flex gap-2">
                  {STATUSES.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setEditForm((p) => ({ ...p, status: s }))}
                      className={[
                        "rounded-full border px-3 py-1.5 text-sm font-semibold transition",
                        editForm.status === s
                          ? "border-emerald-300 bg-emerald-100 text-emerald-900"
                          : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50",
                      ].join(" ")}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="mb-1 flex items-center justify-between gap-2">
                  <label className="block text-sm font-semibold text-gray-800">Deadline</label>
                  {editForm.deadline && (
                    <button
                      type="button"
                      onClick={() => setEditForm((p) => ({ ...p, deadline: "" }))}
                      className="text-xs font-semibold text-blue-700 hover:text-blue-900"
                    >
                      Clear deadline
                    </button>
                  )}
                </div>
                <input
                  type="date"
                  value={editForm.deadline}
                  onChange={(e) => setEditForm((p) => ({ ...p, deadline: e.target.value }))}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                />
              </div>

              {editError && <p className="text-sm text-red-600">{editError}</p>}
              {!editError && !hasEditChanges && (
                <p className="text-xs text-gray-500">No changes yet. Update a value to enable save.</p>
              )}
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setEditOpen(false);
                    setEditingChallenge(null);
                    setEditError("");
                  }}
                  className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editSaving || !hasEditChanges}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {editSaving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deletingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="mx-4 w-full max-w-sm rounded-2xl border border-red-100 bg-white p-6 shadow-xl">
            <h3 className="mb-2 text-lg font-bold text-gray-900">Delete challenge?</h3>
            <p className="mb-4 text-sm text-gray-600">This will soft-delete the challenge and mark it inactive.</p>
            {deleteError && <p className="mb-4 text-sm text-red-600">{deleteError}</p>}
            <div className="flex justify-end gap-3">
              <button onClick={() => setDeletingId("")} className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Cancel</button>
              <button onClick={() => handleDelete(deletingId)} disabled={deleteLoading} className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50">{deleteLoading ? "Deleting..." : "Delete"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
