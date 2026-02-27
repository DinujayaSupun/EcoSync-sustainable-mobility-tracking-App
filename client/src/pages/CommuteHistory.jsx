import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api/axios';

const TRANSPORT_TYPES = ['Car', 'Bus', 'Train', 'Bike', 'Walk'];

const CommuteHistory = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Edit state
  const [editingTrip, setEditingTrip] = useState(null);
  const [editTransport, setEditTransport] = useState('');
  const [editLoading, setEditLoading] = useState(false);

  // Delete state
  const [deleteId, setDeleteId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    setLoading(true);
    setError('');

    try {
      const { data } = await API.get('/commute/history');
      setHistory(data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getTransportIcon = (type) => {
    const icons = {
      Car: '🚗',
      Bus: '🚌',
      Train: '🚆',
      Bike: '🚴',
      Walk: '🚶',
    };
    return icons[type] || '🚗';
  };

  // ── Delete ─────────────────────────────────────────────
  const handleDeleteConfirm = async () => {
    if (!deleteId) return;
    setDeleteLoading(true);
    try {
      await API.delete(`/commute/${deleteId}`);
      setHistory((prev) => prev.filter((t) => t._id !== deleteId));
      setDeleteId(null);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete trip');
    } finally {
      setDeleteLoading(false);
    }
  };

  // ── Edit ───────────────────────────────────────────────
  const openEdit = (trip) => {
    setEditingTrip(trip);
    setEditTransport(trip.transportType);
  };

  const handleEditSave = async () => {
    if (!editingTrip) return;
    setEditLoading(true);
    try {
      const { data } = await API.put(`/commute/${editingTrip._id}`, {
        transportType: editTransport,
      });
      setHistory((prev) =>
        prev.map((t) => (t._id === editingTrip._id ? data.data : t))
      );
      setEditingTrip(null);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update trip');
    } finally {
      setEditLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-800">📜 Trip History</h2>
            <button
              onClick={() => navigate('/')}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded transition"
            >
              ← Back to Dashboard
            </button>
          </div>

          {loading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
              <p className="mt-2 text-gray-600">Loading...</p>
            </div>
          ) : error ? (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">{error}</div>
          ) : history.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg mb-4">No commute history yet.</p>
              <button
                onClick={() => navigate('/')}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded transition"
              >
                Start Logging Trips
              </button>
            </div>
          ) : (
            <>
              {/* Stats bar */}
              <div className="mb-6 bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="flex items-center justify-between text-sm text-gray-700">
                  <span><strong>Total Trips:</strong> {history.length}</span>
                  <span>
                    <strong>Total Distance:</strong>{' '}
                    {history.reduce((s, t) => s + t.distance, 0).toFixed(2)} km
                  </span>
                  <span>
                    <strong>Total Emissions:</strong>{' '}
                    {history.reduce((s, t) => s + t.emissionEstimate, 0).toFixed(2)} kg CO₂
                  </span>
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      {['Date','Route','Transport','Distance','Duration','CO2','Actions'].map((h) => (
                        <th key={h} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {history.map((trip) => (
                      <tr key={trip._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(trip.createdAt)}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          <div className="max-w-xs truncate">
                            {trip.startLocation} → {trip.destination}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {getTransportIcon(trip.transportType)} {trip.transportType}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {trip.distance.toFixed(2)} km
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {trip.duration.toFixed(0)} min
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <span className={
                            trip.emissionEstimate === 0
                              ? 'text-green-600'
                              : trip.emissionEstimate < 5
                              ? 'text-yellow-600'
                              : 'text-orange-600'
                          }>
                            {trip.emissionEstimate.toFixed(2)} kg
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => openEdit(trip)}
                              className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-medium transition"
                            >
                              ✏️ Edit
                            </button>
                            <button
                              onClick={() => setDeleteId(trip._id)}
                              className="flex items-center gap-1 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-xs font-medium transition"
                            >
                              🗑️ Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Delete Confirmation Modal ── */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm mx-4">
            <h3 className="text-lg font-bold text-gray-800 mb-2">🗑️ Delete Trip</h3>
            <p className="text-gray-600 text-sm mb-5">
              Are you sure you want to delete this trip? This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteId(null)}
                disabled={deleteLoading}
                className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm font-medium transition"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={deleteLoading}
                className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-medium transition disabled:opacity-60"
              >
                {deleteLoading ? 'Deleting…' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Edit Modal ── */}
      {editingTrip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-bold text-gray-800 mb-1">✏️ Edit Trip</h3>
            <p className="text-gray-500 text-xs mb-4">
              {editingTrip.startLocation} → {editingTrip.destination}
            </p>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Transport Type</label>
              <div className="grid grid-cols-3 gap-2">
                {TRANSPORT_TYPES.map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setEditTransport(type)}
                    className={`py-2 rounded-lg border text-sm font-medium transition ${
                      editTransport === type
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {getTransportIcon(type)} {type}
                  </button>
                ))}
              </div>
            </div>

            {/* Preview recalculated emission */}
            <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-600 mb-4">
              <span className="font-medium">Estimated CO₂ after change: </span>
              <span className="text-orange-600 font-semibold">
                {(
                  { Car: 0.192, Bus: 0.105, Train: 0.041, Bike: 0, Walk: 0 }[editTransport] *
                  editingTrip.distance
                ).toFixed(2)}{' '}
                kg
              </span>
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setEditingTrip(null)}
                disabled={editLoading}
                className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm font-medium transition"
              >
                Cancel
              </button>
              <button
                onClick={handleEditSave}
                disabled={editLoading || editTransport === editingTrip.transportType}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition disabled:opacity-60"
              >
                {editLoading ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CommuteHistory;

