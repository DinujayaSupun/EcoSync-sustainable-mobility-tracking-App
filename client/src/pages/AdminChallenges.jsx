import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChallengesAPI } from '../api/challenges.api';

const STATUS_OPTIONS = ['ACTIVE', 'INACTIVE', 'EXPIRED', 'COMPLETED'];
const TRANSPORT_OPTIONS = ['BUS', 'TRAIN', 'BIKE', 'WALK', 'CAR', 'VAN'];
const DIFFICULTY_OPTIONS = ['EASY', 'MEDIUM', 'HARD'];
const TYPE_OPTIONS = ['INDIVIDUAL', 'SQUAD'];

const toLabel = (value) => {
  if (!value) return '-';
  return String(value)
    .toLowerCase()
    .split('_')
    .map((word) => word[0]?.toUpperCase() + word.slice(1))
    .join(' ');
};

const formatDateInput = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 10);
};

export default function AdminChallenges() {
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [search, setSearch] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [transportMode, setTransportMode] = useState('');

  const [editingChallenge, setEditingChallenge] = useState(null);
  const [creating, setCreating] = useState(false);
  const [editForm, setEditForm] = useState({
    emissionTarget: '',
    durationDays: '',
    rewardPoints: '',
    status: 'ACTIVE',
    deadline: '',
  });
  const [createForm, setCreateForm] = useState({
    transportMode: 'BIKE',
    emissionTarget: '5',
    durationDays: '7',
    difficulty: 'EASY',
    type: 'INDIVIDUAL',
    rewardPoints: '100',
  });

  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState('');

  const loadChallenges = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await ChallengesAPI.getChallenges({ page: 1, limit: 200 });
      setChallenges(response.challenges || []);
    } catch (loadError) {
      setError(loadError?.response?.data?.message || 'Failed to load challenges.');
      setChallenges([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadChallenges();
  }, []);

  const filteredChallenges = useMemo(() => {
    return challenges.filter((challenge) => {
      const challengeName = String(challenge.title || '').toLowerCase();
      const challengeMode = String(challenge.transportMode || '').toLowerCase();
      const challengeDifficulty = String(challenge.difficulty || '').toLowerCase();
      const q = search.trim().toLowerCase();

      const matchesSearch = !q || challengeName.includes(q) || challengeMode.includes(q);
      const matchesDifficulty = !difficulty || challenge.difficulty === difficulty;
      const matchesMode = !transportMode || challenge.transportMode === transportMode;
      return matchesSearch && matchesDifficulty && matchesMode;
    });
  }, [challenges, search, difficulty, transportMode]);

  const openEdit = (challenge) => {
    setEditingChallenge(challenge);
    setEditForm({
      emissionTarget: String(challenge.emissionTarget ?? ''),
      durationDays: String(challenge.durationDays ?? ''),
      rewardPoints: String(challenge.rewardPoints ?? ''),
      status: challenge.status || 'ACTIVE',
      deadline: formatDateInput(challenge.deadline),
    });
    setError('');
    setSuccess('');
  };

  const closeEdit = () => {
    setEditingChallenge(null);
  };

  const openCreate = () => {
    setCreating(true);
    setError('');
    setSuccess('');
  };

  const closeCreate = () => {
    setCreating(false);
  };

  const handleCreate = async () => {
    const payload = {
      transportMode: createForm.transportMode,
      emissionTarget: Number(createForm.emissionTarget),
      durationDays: Number(createForm.durationDays),
      difficulty: createForm.difficulty,
      type: createForm.type,
      rewardPoints: Number(createForm.rewardPoints),
    };

    if (!payload.emissionTarget || payload.emissionTarget <= 0) {
      setError('Emission target must be greater than 0.');
      return;
    }
    if (!payload.durationDays || payload.durationDays <= 0) {
      setError('Duration must be greater than 0.');
      return;
    }
    if (!payload.rewardPoints || payload.rewardPoints <= 0) {
      setError('Reward points must be greater than 0.');
      return;
    }

    setSaving(true);
    setError('');
    setSuccess('');
    try {
      await ChallengesAPI.createChallenge(payload);
      setSuccess('Challenge created successfully.');
      closeCreate();
      await loadChallenges();
    } catch (createError) {
      setError(createError?.response?.data?.message || 'Failed to create challenge.');
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async () => {
    if (!editingChallenge?._id) return;

    const payload = {
      emissionTarget: Number(editForm.emissionTarget),
      durationDays: Number(editForm.durationDays),
      rewardPoints: Number(editForm.rewardPoints),
      status: editForm.status,
      deadline: editForm.deadline,
    };

    if (!payload.emissionTarget || payload.emissionTarget <= 0) {
      setError('Emission target must be greater than 0.');
      return;
    }
    if (!payload.durationDays || payload.durationDays <= 0) {
      setError('Duration must be greater than 0.');
      return;
    }
    if (!payload.rewardPoints || payload.rewardPoints <= 0) {
      setError('Reward points must be greater than 0.');
      return;
    }

    setSaving(true);
    setError('');
    setSuccess('');
    try {
      await ChallengesAPI.updateChallenge(editingChallenge._id, payload);
      setSuccess('Challenge updated successfully.');
      closeEdit();
      await loadChallenges();
    } catch (saveError) {
      setError(saveError?.response?.data?.message || 'Failed to update challenge.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (challengeId, challengeTitle) => {
    const confirmed = window.confirm(`Delete challenge "${challengeTitle}"? This will soft-delete it.`);
    if (!confirmed) return;

    setDeletingId(challengeId);
    setError('');
    setSuccess('');
    try {
      await ChallengesAPI.deleteChallenge(challengeId);
      setSuccess('Challenge deleted successfully.');
      setChallenges((prev) => prev.filter((challenge) => challenge._id !== challengeId));
    } catch (deleteError) {
      setError(deleteError?.response?.data?.message || 'Failed to delete challenge.');
    } finally {
      setDeletingId('');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-md">
          <div className="bg-linear-to-r from-purple-600 to-indigo-600 px-6 py-5 text-white">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-purple-100">Admin Panel</p>
                <h2 className="text-3xl font-bold">Challenge Management</h2>
                <p className="mt-1 text-sm text-purple-100">Edit challenge settings and manage challenge lifecycle.</p>
              </div>
              <Link
                to="/admin"
                className="inline-flex w-fit items-center rounded-lg bg-white px-4 py-2 font-medium text-purple-700 transition hover:bg-purple-50"
              >
                Back to Dashboard
              </Link>
              <button
                type="button"
                onClick={openCreate}
                className="inline-flex w-fit items-center rounded-lg border border-white/40 bg-purple-700/40 px-4 py-2 font-medium text-white transition hover:bg-purple-700/60"
              >
                Create Challenge
              </button>
            </div>
          </div>
        </div>

        {(error || success) && (
          <div className="mb-4 space-y-2">
            {error ? <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}
            {success ? <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">{success}</div> : null}
          </div>
        )}

        <div className="mb-4 grid grid-cols-1 gap-3 rounded-lg border border-gray-200 bg-white p-4 md:grid-cols-4">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by title or mode"
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
          <select
            value={difficulty}
            onChange={(event) => setDifficulty(event.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
          >
            <option value="">All Difficulties</option>
            <option value="EASY">Easy</option>
            <option value="MEDIUM">Medium</option>
            <option value="HARD">Hard</option>
          </select>
          <input
            value={transportMode}
            onChange={(event) => setTransportMode(event.target.value.toUpperCase())}
            placeholder="Filter mode e.g. BIKE"
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
          <button
            type="button"
            onClick={() => {
              setSearch('');
              setDifficulty('');
              setTransportMode('');
            }}
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Reset Filters
          </button>
        </div>

        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-md">
          {loading ? (
            <p className="px-6 py-8 text-center text-gray-600">Loading challenges...</p>
          ) : filteredChallenges.length === 0 ? (
            <p className="px-6 py-8 text-center text-gray-600">No challenges found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                  <tr>
                    <th className="px-4 py-3">Title</th>
                    <th className="px-4 py-3">Mode</th>
                    <th className="px-4 py-3">Difficulty</th>
                    <th className="px-4 py-3">Target</th>
                    <th className="px-4 py-3">Duration</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredChallenges.map((challenge) => (
                    <tr key={challenge._id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900">{challenge.title}</td>
                      <td className="px-4 py-3 text-gray-700">{toLabel(challenge.transportMode)}</td>
                      <td className="px-4 py-3 text-gray-700">{toLabel(challenge.difficulty)}</td>
                      <td className="px-4 py-3 text-gray-700">{challenge.emissionTarget} kg CO2</td>
                      <td className="px-4 py-3 text-gray-700">{challenge.durationDays} days</td>
                      <td className="px-4 py-3 text-gray-700">{toLabel(challenge.status)}</td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => openEdit(challenge)}
                          className="mr-3 font-semibold text-blue-600 hover:text-blue-800"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          disabled={deletingId === challenge._id}
                          onClick={() => handleDelete(challenge._id, challenge.title)}
                          className="font-semibold text-red-600 hover:text-red-800 disabled:opacity-50"
                        >
                          {deletingId === challenge._id ? 'Deleting...' : 'Delete'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {editingChallenge && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-lg">
            <h3 className="text-xl font-bold text-gray-900">Edit Challenge</h3>
            <p className="mt-1 text-sm text-gray-600">{editingChallenge.title}</p>

            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="text-sm text-gray-700">
                Emission Target
                <input
                  type="number"
                  min="0.1"
                  step="0.1"
                  value={editForm.emissionTarget}
                  onChange={(event) => setEditForm((prev) => ({ ...prev, emissionTarget: event.target.value }))}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
                />
              </label>

              <label className="text-sm text-gray-700">
                Duration Days
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={editForm.durationDays}
                  onChange={(event) => setEditForm((prev) => ({ ...prev, durationDays: event.target.value }))}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
                />
              </label>

              <label className="text-sm text-gray-700">
                Reward Points
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={editForm.rewardPoints}
                  onChange={(event) => setEditForm((prev) => ({ ...prev, rewardPoints: event.target.value }))}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
                />
              </label>

              <label className="text-sm text-gray-700">
                Status
                <select
                  value={editForm.status}
                  onChange={(event) => setEditForm((prev) => ({ ...prev, status: event.target.value }))}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
                >
                  {STATUS_OPTIONS.map((status) => (
                    <option key={status} value={status}>{toLabel(status)}</option>
                  ))}
                </select>
              </label>

              <label className="text-sm text-gray-700 sm:col-span-2">
                Deadline
                <input
                  type="date"
                  value={editForm.deadline}
                  onChange={(event) => setEditForm((prev) => ({ ...prev, deadline: event.target.value }))}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
                />
              </label>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={closeEdit}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-700 disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {creating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-lg">
            <h3 className="text-xl font-bold text-gray-900">Create Challenge</h3>
            <p className="mt-1 text-sm text-gray-600">This follows the backend AI challenge generation flow.</p>

            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="text-sm text-gray-700">
                Transport Mode
                <select
                  value={createForm.transportMode}
                  onChange={(event) => setCreateForm((prev) => ({ ...prev, transportMode: event.target.value }))}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
                >
                  {TRANSPORT_OPTIONS.map((mode) => (
                    <option key={mode} value={mode}>{toLabel(mode)}</option>
                  ))}
                </select>
              </label>

              <label className="text-sm text-gray-700">
                Difficulty
                <select
                  value={createForm.difficulty}
                  onChange={(event) => setCreateForm((prev) => ({ ...prev, difficulty: event.target.value }))}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
                >
                  {DIFFICULTY_OPTIONS.map((difficultyValue) => (
                    <option key={difficultyValue} value={difficultyValue}>{toLabel(difficultyValue)}</option>
                  ))}
                </select>
              </label>

              <label className="text-sm text-gray-700">
                Type
                <select
                  value={createForm.type}
                  onChange={(event) => setCreateForm((prev) => ({ ...prev, type: event.target.value }))}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
                >
                  {TYPE_OPTIONS.map((typeValue) => (
                    <option key={typeValue} value={typeValue}>{toLabel(typeValue)}</option>
                  ))}
                </select>
              </label>

              <label className="text-sm text-gray-700">
                Emission Target
                <input
                  type="number"
                  min="0.1"
                  step="0.1"
                  value={createForm.emissionTarget}
                  onChange={(event) => setCreateForm((prev) => ({ ...prev, emissionTarget: event.target.value }))}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
                />
              </label>

              <label className="text-sm text-gray-700">
                Duration Days
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={createForm.durationDays}
                  onChange={(event) => setCreateForm((prev) => ({ ...prev, durationDays: event.target.value }))}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
                />
              </label>

              <label className="text-sm text-gray-700">
                Reward Points
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={createForm.rewardPoints}
                  onChange={(event) => setCreateForm((prev) => ({ ...prev, rewardPoints: event.target.value }))}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
                />
              </label>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={closeCreate}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreate}
                disabled={saving}
                className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-700 disabled:opacity-50"
              >
                {saving ? 'Creating...' : 'Create Challenge'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
