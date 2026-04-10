// client/src/pages/BadgeManagement.jsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BadgesAPI } from "../api/badges.api";
import { useAuth } from "../context/AuthContext";
import GamificationToast from "../components/common/GamificationToast";
import { useGamificationToast } from "../hooks/useGamificationToast";

const TYPES = ["TRIP_COUNT", "TOTAL_DISTANCE", "TOTAL_CO2_SAVED"];

const TYPE_LABELS = {
  TRIP_COUNT: "Trip Count",
  TOTAL_DISTANCE: "Total Distance",
  TOTAL_CO2_SAVED: "CO₂ Saved",
};

const THRESHOLD_HINTS = {
  TRIP_COUNT: "How many commute logs are required.",
  TOTAL_DISTANCE: "Total commute distance required in kilometers.",
  TOTAL_CO2_SAVED: "Total CO2 saved required in kilograms.",
};

// Empty form state used for both create and edit
const EMPTY_FORM = {
  name: "",
  description: "",
  type: "TRIP_COUNT",
  threshold: "",
  imageUrl: "",
};

export default function BadgeManagement() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [badges, setBadges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [initialForm, setInitialForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState("");
  const [showValidation, setShowValidation] = useState(false);
  const [saving, setSaving] = useState(false);

  // Image picker state — tracks current Unsplash page for swipe
  const [imgLoading, setImgLoading] = useState(false);
  const [imgPage, setImgPage] = useState(1);
  const [imgTotalPages, setImgTotalPages] = useState(0);

  // Delete confirmation state
  const [deletingId, setDeletingId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const { toast, showToast } = useGamificationToast();

  async function loadBadges(options = {}) {
    const { notifySuccess = false, silentError = false } = options;
    setLoading(true);
    setError("");
    try {
      const data = await BadgesAPI.getAllBadges();
      const list = Array.isArray(data)
        ? data
        : Array.isArray(data?.data)
        ? data.data
        : [];
      setBadges(list);
      if (notifySuccess) {
        showToast("success", "Badges refreshed.");
      }
    } catch (e) {
      const msg = e?.response?.data?.message || e?.message || "Failed to load badges.";
      setError(msg);
      if (!silentError) {
        showToast("error", msg);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadBadges({ silentError: true });
  }, []);

  // Open create modal
  function openCreate() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setInitialForm(EMPTY_FORM);
    setFormError("");
    setShowValidation(false);
    setImgPage(1);
    setImgTotalPages(0);
    setModalOpen(true);
  }

  // Open edit modal pre-filled with badge data
  function openEdit(badge) {
    const nextForm = {
      name: badge.name || "",
      description: badge.description || "",
      type: badge.type || "TRIP_COUNT",
      threshold: badge.threshold ?? "",
      imageUrl: badge.imageUrl || "",
    };

    setEditingId(badge._id);
    setForm(nextForm);
    setInitialForm(nextForm);
    setFormError("");
    setShowValidation(false);
    setImgPage(1);
    setImgTotalPages(0);
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setFormError("");
    setShowValidation(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
    setInitialForm(EMPTY_FORM);
  }

  function handleFormChange(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function validateForm(nextForm) {
    const errors = {};

    if (!nextForm.name.trim()) {
      errors.name = "Name is required.";
    } else if (nextForm.name.trim().length < 3) {
      errors.name = "Name must be at least 3 characters.";
    }

    if (!nextForm.description.trim()) {
      errors.description = "Description is required.";
    } else if (nextForm.description.trim().length < 10) {
      errors.description = "Description must be at least 10 characters.";
    }

    if (!TYPES.includes(nextForm.type)) {
      errors.type = "Select a valid badge type.";
    }

    const threshold = Number(nextForm.threshold);
    if (!Number.isFinite(threshold) || threshold < 1) {
      errors.threshold = "Threshold must be 1 or greater.";
    }

    if (nextForm.imageUrl.trim()) {
      try {
        new URL(nextForm.imageUrl.trim());
      } catch {
        errors.imageUrl = "Image URL must be a valid link.";
      }
    }

    return errors;
  }

  const fieldErrors = useMemo(() => validateForm(form), [form]);

  const formValidationMessage = useMemo(() => {
    const firstError = Object.values(fieldErrors)[0];
    return firstError || "";
  }, [fieldErrors]);

  const hasFormChanges = useMemo(() => {
    if (!editingId) {
      return (
        form.name.trim() !== "" ||
        form.description.trim() !== "" ||
        String(form.threshold).trim() !== "" ||
        form.imageUrl.trim() !== "" ||
        form.type !== EMPTY_FORM.type
      );
    }

    return (
      form.name !== initialForm.name ||
      form.description !== initialForm.description ||
      String(form.threshold) !== String(initialForm.threshold) ||
      form.imageUrl !== initialForm.imageUrl ||
      form.type !== initialForm.type
    );
  }, [editingId, form, initialForm]);

  const canSubmit = !saving && (editingId ? hasFormChanges : true);

  // Fetch image from Unsplash using badge name as query
  // Each call increments the page so admin gets a different image on each click
  async function fetchImage() {
    const query = form.name.trim() || "eco badge";
    const nextPage = imgPage;
    setImgLoading(true);
    try {
      const res = await BadgesAPI.getImageSuggestion(query, nextPage);
      if (res?.url) {
        setForm((prev) => ({ ...prev, imageUrl: res.url }));
        // Advance page for next click — wrap around when we reach the end
        const total = res.totalPages || 1;
        setImgTotalPages(total);
        setImgPage((prev) => (prev >= total ? 1 : prev + 1));
      } else {
        setFormError("No image found for this name. Try a different name.");
      }
    } catch {
      setFormError("Failed to fetch image. Check your Unsplash API key.");
    } finally {
      setImgLoading(false);
    }
  }

  async function handleSave(e) {
    e.preventDefault();
    setFormError("");
    setShowValidation(true);

    if (formValidationMessage) {
      setFormError("Please fix the highlighted fields.");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim(),
        type: form.type,
        threshold: Number(form.threshold),
        imageUrl: form.imageUrl.trim(),
      };

      if (editingId) {
        // Update existing badge
        await BadgesAPI.updateBadge(editingId, payload);
        showToast("success", "Badge updated successfully.");
      } else {
        // Create new badge
        await BadgesAPI.createBadge(payload);
        showToast("success", "Badge created successfully.");
      }

      closeModal();
      await loadBadges(); // Refresh list
    } catch (e) {
      setFormError(e?.response?.data?.message || e?.message || "Save failed.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    setDeleteError("");
    setDeleteLoading(true);
    try {
      await BadgesAPI.deleteBadge(id);
      setDeletingId(null);
      await loadBadges();
      showToast("success", "Badge deleted.");
    } catch (e) {
      setDeleteError(e?.response?.data?.message || "Delete failed.");
      showToast("error", e?.response?.data?.message || "Delete failed.");
    } finally {
      setDeleteLoading(false);
    }
  }

  async function handleRetryLoad() {
    await loadBadges({ notifySuccess: true });
  }

  function handleLogout() {
    logout();
    navigate("/login");
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
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-100">Administration</p>
                <h2 className="text-2xl font-bold sm:text-3xl">Badge Management</h2>
              </div>
            </div>
            <button
              onClick={openCreate}
              className="inline-flex items-center gap-1.5 rounded-full border border-emerald-100 bg-white px-4 py-2 text-sm font-semibold text-emerald-800 transition hover:bg-emerald-50"
            >
              <span className="material-icons" style={{ fontSize: "17px" }}>add_circle</span>
              Create Badge
            </button>
          </div>

          <div className="px-6 py-6 sm:px-7">
            <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="rounded-2xl border-2 border-emerald-200 bg-linear-to-br from-emerald-50 via-white to-green-100 p-5 shadow-sm">
                <p className="text-xs font-bold uppercase tracking-wider text-emerald-700">Total Badges</p>
                <p className="mt-2 text-3xl font-bold text-emerald-900">{badges.length}</p>
              </div>
              <div className="rounded-2xl border-2 border-blue-200 bg-linear-to-br from-blue-50 via-white to-emerald-50 p-5 shadow-sm">
                <p className="text-xs font-bold uppercase tracking-wider text-blue-700">Loaded State</p>
                <p className="mt-2 text-3xl font-bold text-blue-900">{loading ? "..." : "Ready"}</p>
              </div>
              <div className="rounded-2xl border-2 border-amber-200 bg-linear-to-br from-amber-50 via-white to-lime-50 p-5 shadow-sm">
                <p className="text-xs font-bold uppercase tracking-wider text-amber-700">Catalog Types</p>
                <p className="mt-2 text-3xl font-bold text-amber-900">{TYPES.length}</p>
              </div>
            </div>

            {loading && (
              <div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-10 text-center text-emerald-700">Loading badges...</div>
            )}

            {!loading && error && (
              <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
                <p className="text-red-700">{error}</p>
                <button
                  onClick={handleRetryLoad}
                  className="mt-3 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700"
                >
                  Retry
                </button>
              </div>
            )}

            {!loading && !error && (
              <div className="overflow-hidden rounded-2xl border border-emerald-100 bg-white shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-180 text-sm">
                    <thead className="border-b border-emerald-100 bg-emerald-50/80">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-emerald-700">Name</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-emerald-700">Type</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-emerald-700">Threshold</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-emerald-700">Description</th>
                        <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-emerald-700">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-emerald-50">
                      {badges.length === 0 && (
                        <tr>
                          <td colSpan={5} className="px-6 py-10 text-center text-gray-500">
                            No badges yet. Use "Create Badge" to add one.
                          </td>
                        </tr>
                      )}
                      {badges.map((badge) => (
                        <tr key={badge._id} className="transition hover:bg-emerald-50/40">
                          <td className="px-6 py-4 font-semibold text-gray-900">{badge.name}</td>
                          <td className="px-6 py-4">
                            <span className="rounded-full border border-gray-200 bg-gray-50 px-2 py-1 text-xs text-gray-700">
                              {TYPE_LABELS[badge.type] || badge.type}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-gray-700">{badge.threshold}</td>
                          <td className="max-w-xs truncate px-6 py-4 text-gray-600">{badge.description}</td>
                          <td className="px-6 py-4 text-right">
                            <button
                              onClick={() => openEdit(badge)}
                              className="mr-4 font-semibold text-blue-600 transition hover:text-blue-800"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => setDeletingId(badge._id)}
                              className="font-semibold text-red-500 transition hover:text-red-700"
                            >
                              Delete
                            </button>
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

      {/* Create / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl border border-emerald-100 bg-white p-6 shadow-xl">
            <h2 className="text-lg font-bold text-gray-900 mb-4">
              {editingId ? "Edit Badge" : "Create Badge"}
            </h2>

            <div className="mb-4 rounded-xl border border-emerald-100 bg-emerald-50/70 p-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">Preview</p>
              <p className="mt-1 text-sm font-bold text-emerald-900">{form.name.trim() || "Badge name"}</p>
              <p className="text-xs text-emerald-800/80">{TYPE_LABELS[form.type] || "Badge Type"} • Threshold {form.threshold || "-"}</p>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  name="name"
                  value={form.name}
                  onChange={handleFormChange}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="e.g. First Trip"
                />
                <p className="mt-1 text-xs text-gray-500">Use a short, memorable badge title.</p>
                {showValidation && fieldErrors.name && (
                  <p className="mt-1 text-xs text-red-600">{fieldErrors.name}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleFormChange}
                  rows={3}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="e.g. Completed your first sustainable commute."
                />
                <p className="mt-1 text-xs text-gray-500">Explain clearly how the badge is earned.</p>
                {showValidation && fieldErrors.description && (
                  <p className="mt-1 text-xs text-red-600">{fieldErrors.description}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select
                  name="type"
                  value={form.type}
                  onChange={handleFormChange}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  {TYPES.map((t) => (
                    <option key={t} value={t}>{TYPE_LABELS[t]}</option>
                  ))}
                </select>
                {showValidation && fieldErrors.type && (
                  <p className="mt-1 text-xs text-red-600">{fieldErrors.type}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Threshold</label>
                <input
                  name="threshold"
                  type="number"
                  min="1"
                  value={form.threshold}
                  onChange={handleFormChange}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="e.g. 10"
                />
                <p className="mt-1 text-xs text-gray-500">{THRESHOLD_HINTS[form.type]}</p>
                {showValidation && fieldErrors.threshold && (
                  <p className="mt-1 text-xs text-red-600">{fieldErrors.threshold}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Badge Image
                </label>

                {/* Image preview */}
                {form.imageUrl ? (
                  <div className="mb-2 w-full h-32 rounded-lg overflow-hidden border border-gray-200 bg-gray-50">
                    <img
                      src={form.imageUrl}
                      alt="Badge preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="mb-2 w-full h-32 rounded-lg border border-dashed border-gray-300 bg-gray-50 flex items-center justify-center text-gray-400 text-sm">
                    No image selected
                  </div>
                )}

                {/* Find / Next image buttons */}
                <div className="flex gap-2 mb-2">
                  <button
                    type="button"
                    onClick={fetchImage}
                    disabled={imgLoading}
                    className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium disabled:opacity-50"
                  >
                    {imgLoading ? "Fetching..." : form.imageUrl ? "→ Next Image" : "Find Image"}
                  </button>
                  {form.imageUrl && (
                    <button
                      type="button"
                      onClick={() => setForm((prev) => ({ ...prev, imageUrl: "" }))}
                      className="px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 text-xs hover:bg-gray-50"
                    >
                      Clear
                    </button>
                  )}
                </div>

                {/* Manual URL input */}
                <input
                  name="imageUrl"
                  value={form.imageUrl}
                  onChange={handleFormChange}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Or paste an image URL directly"
                />
                <p className="mt-1 text-xs text-gray-500">Optional for both create and edit. If set, it must be a valid URL.</p>
                {showValidation && fieldErrors.imageUrl && (
                  <p className="mt-1 text-xs text-red-600">{fieldErrors.imageUrl}</p>
                )}
              </div>

              {formError && (
                <p className="text-sm text-red-600">{formError}</p>
              )}

              {!formError && showValidation && formValidationMessage && (
                <p className="text-xs text-gray-500">
                  {formValidationMessage}
                </p>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!canSubmit}
                  className="px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm font-medium disabled:opacity-50"
                >
                  {saving ? "Saving..." : editingId ? "Save Changes" : "Create Badge"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="mx-4 w-full max-w-sm rounded-2xl border border-red-100 bg-white p-6 shadow-xl">
            <h2 className="text-lg font-bold text-gray-900 mb-2">Delete Badge?</h2>
            <p className="text-sm text-gray-600 mb-6">
              This will permanently delete the badge only if it has not been awarded to users.
            </p>
            {deleteError && (
              <p className="text-sm text-red-600 mb-4">{deleteError}</p>
            )}
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeletingId(null)}
                className="px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deletingId)}
                disabled={deleteLoading}
                className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-medium disabled:opacity-50"
              >
                {deleteLoading ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
