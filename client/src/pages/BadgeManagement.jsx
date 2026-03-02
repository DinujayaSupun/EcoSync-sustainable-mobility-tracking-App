// client/src/pages/BadgeManagement.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BadgesAPI } from "../api/badges.api";

const TYPES = ["TRIP_COUNT", "TOTAL_DISTANCE", "TOTAL_CO2_SAVED"];

const TYPE_LABELS = {
  TRIP_COUNT: "Trip Count",
  TOTAL_DISTANCE: "Total Distance",
  TOTAL_CO2_SAVED: "CO₂ Saved",
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
  const [badges, setBadges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null); // null = create, string = edit
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  // Delete confirmation state
  const [deletingId, setDeletingId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  async function loadBadges() {
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
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || "Failed to load badges.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadBadges();
  }, []);

  // Open create modal
  function openCreate() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFormError("");
    setModalOpen(true);
  }

  // Open edit modal pre-filled with badge data
  function openEdit(badge) {
    setEditingId(badge._id);
    setForm({
      name: badge.name || "",
      description: badge.description || "",
      type: badge.type || "TRIP_COUNT",
      threshold: badge.threshold ?? "",
      imageUrl: badge.imageUrl || "",
    });
    setFormError("");
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setFormError("");
  }

  function handleFormChange(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSave(e) {
    e.preventDefault();
    setFormError("");

    // Basic client-side validation
    if (!form.name.trim()) return setFormError("Name is required.");
    if (!form.description.trim()) return setFormError("Description is required.");
    if (form.threshold === "" || isNaN(Number(form.threshold)))
      return setFormError("Threshold must be a number.");

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
      } else {
        // Create new badge
        await BadgesAPI.createBadge(payload);
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
    setDeleteLoading(true);
    try {
      await BadgesAPI.deleteBadge(id);
      setDeletingId(null);
      await loadBadges();
    } catch (e) {
      alert(e?.response?.data?.message || "Delete failed.");
    } finally {
      setDeleteLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/admin")}
              className="text-gray-500 hover:text-gray-700 text-sm"
            >
              ← Admin
            </button>
            <h1 className="text-xl font-bold text-gray-900">🏅 Badge Management</h1>
          </div>
          <button
            onClick={openCreate}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
          >
            + Create Badge
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {loading && (
          <div className="py-10 text-center text-gray-600">Loading badges...</div>
        )}

        {!loading && error && (
          <div className="bg-white rounded-xl border border-gray-100 p-6">
            <p className="text-red-600">{error}</p>
            <button
              onClick={loadBadges}
              className="mt-3 px-4 py-2 bg-green-600 text-white rounded-lg text-sm"
            >
              Retry
            </button>
          </div>
        )}

        {!loading && !error && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Threshold</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Description</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {badges.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-10 text-center text-gray-500">
                      No badges yet. Click "+ Create Badge" to add one.
                    </td>
                  </tr>
                )}
                {badges.map((badge) => (
                  <tr key={badge._id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 font-medium text-gray-900">{badge.name}</td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 rounded-full text-xs border bg-gray-50 text-gray-700">
                        {TYPE_LABELS[badge.type] || badge.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-700">{badge.threshold}</td>
                    <td className="px-6 py-4 text-gray-600 max-w-xs truncate">{badge.description}</td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => openEdit(badge)}
                        className="text-blue-600 hover:text-blue-800 font-medium mr-4"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => setDeletingId(badge._id)}
                        className="text-red-500 hover:text-red-700 font-medium"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md mx-4 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">
              {editingId ? "Edit Badge" : "Create Badge"}
            </h2>

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
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleFormChange}
                  rows={2}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="e.g. Completed your first sustainable commute."
                />
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
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Image URL <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <input
                  name="imageUrl"
                  value={form.imageUrl}
                  onChange={handleFormChange}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Leave blank to auto-fetch from Unsplash"
                />
              </div>

              {formError && (
                <p className="text-sm text-red-600">{formError}</p>
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
                  disabled={saving}
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
          <div className="bg-white rounded-xl shadow-lg w-full max-w-sm mx-4 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-2">Delete Badge?</h2>
            <p className="text-sm text-gray-600 mb-6">
              This will permanently delete the badge. Users who earned it will keep their record.
            </p>
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
