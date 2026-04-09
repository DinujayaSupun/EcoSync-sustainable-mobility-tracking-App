import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useCommute } from '../context/CommuteContext';
import Footer from '../components/common/Footer';
import UserNavbar from '../components/common/UserNavbar';

const TRANSPORT_TYPES = ['Car', 'Bus', 'Train', 'Bike', 'Walk'];

const CommuteHistory = () => {
  const { user, logout } = useAuth();
  const { refreshTrigger, onCommuteLogged } = useCommute();
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
  }, [refreshTrigger]);

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
      Car: 'directions_car',
      Bus: 'directions_bus',
      Train: 'train',
      Bike: 'directions_bike',
      Walk: 'directions_walk',
    };
    return icons[type] || 'directions_car';
  };

  const transportMeta = {
    Car: { label: 'Car', color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200' },
    Bus: { label: 'Bus', color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200' },
    Train: { label: 'Train', color: 'text-violet-700', bg: 'bg-violet-50', border: 'border-violet-200' },
    Bike: { label: 'Bike', color: 'text-lime-700', bg: 'bg-lime-50', border: 'border-lime-200' },
    Walk: { label: 'Walk', color: 'text-teal-700', bg: 'bg-teal-50', border: 'border-teal-200' },
  };

  // ── Delete ─────────────────────────────────────────────
  const handleDeleteConfirm = async () => {
    if (!deleteId) return;
    setDeleteLoading(true);
    try {
      await API.delete(`/commute/${deleteId}`);
      setHistory((prev) => prev.filter((t) => t._id !== deleteId));
      setDeleteId(null);
      // Trigger automatic refresh across all components
      onCommuteLogged({ action: 'deleted' });
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
      // Trigger automatic refresh across all components
      onCommuteLogged({ action: 'updated', ...data.data });
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update trip');
    } finally {
      setEditLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-emerald-50/30 to-green-50">
      <UserNavbar userName={user?.name} onLogout={handleLogout} />

      <main className="mx-auto max-w-384 px-4 py-8">
        <div className="overflow-hidden rounded-3xl border-2 border-emerald-100 bg-white shadow-xl">
          {/* Header */}
          <div className="flex flex-col gap-4 border-b border-emerald-100 bg-linear-to-r from-emerald-700 to-green-600 px-6 py-5 text-white sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <span className="material-icons text-white" style={{fontSize: '32px'}}>history</span>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-100">Trip Archive</p>
                <h2 className="text-2xl font-bold sm:text-3xl">Trip History</h2>
              </div>
            </div>
          </div>

          <div className="px-6 py-6 sm:px-7">
            {loading ? (
              <div className="rounded-2xl border border-emerald-100 bg-linear-to-br from-emerald-50/80 to-green-50/50 p-10 text-center shadow-sm">
                <div className="mx-auto mb-3 h-9 w-9 animate-spin rounded-full border-4 border-emerald-200 border-t-emerald-600"></div>
                <p className="text-sm font-medium text-emerald-700">Loading trip history…</p>
              </div>
            ) : error ? (
              <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-red-700 shadow-sm">{error}</div>
            ) : history.length === 0 ? (
              <div className="rounded-2xl border-2 border-emerald-100 bg-linear-to-br from-emerald-50 to-green-50 p-10 text-center shadow-sm">
                <span className="material-icons mx-auto mb-3 block text-emerald-600" style={{fontSize: '56px'}}>history_toggle_off</span>
                <p className="mb-2 text-2xl font-bold text-emerald-900">No commute history yet</p>
                <p className="mx-auto mb-6 max-w-xl text-base text-emerald-700">Start logging trips to build your history, track emissions, and compare transport choices.</p>
                <button
                  onClick={() => navigate('/')}
                  className="inline-flex items-center gap-2 rounded-full bg-linear-to-r from-emerald-600 to-green-600 px-5 py-3 font-semibold text-white shadow-md transition hover:from-emerald-700 hover:to-green-700"
                >
                  <span className="material-icons" style={{fontSize: '18px'}}>add_circle</span>
                  Start Logging Trips
                </button>
              </div>
            ) : (
              <>
                {/* Stats bar */}
                <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div className="rounded-2xl border border-emerald-200 bg-linear-to-br from-emerald-50 via-white to-emerald-100 p-5 shadow-sm">
                    <div className="mb-2 flex items-center gap-2 text-emerald-700">
                      <span className="material-icons" style={{fontSize: '20px'}}>route</span>
                      <span className="text-xs font-bold uppercase tracking-wider">Total Trips</span>
                    </div>
                    <p className="text-3xl font-bold text-emerald-900">{history.length}</p>
                  </div>
                  <div className="rounded-2xl border border-blue-200 bg-linear-to-br from-blue-50 via-white to-emerald-50 p-5 shadow-sm">
                    <div className="mb-2 flex items-center gap-2 text-blue-700">
                      <span className="material-icons" style={{fontSize: '20px'}}>straighten</span>
                      <span className="text-xs font-bold uppercase tracking-wider">Total Distance</span>
                    </div>
                    <p className="text-3xl font-bold text-blue-900">{history.reduce((s, t) => s + t.distance, 0).toFixed(2)} <span className="text-lg">km</span></p>
                  </div>
                  <div className="rounded-2xl border border-amber-200 bg-linear-to-br from-amber-50 via-white to-lime-50 p-5 shadow-sm">
                    <div className="mb-2 flex items-center gap-2 text-amber-700">
                      <span className="material-icons" style={{fontSize: '20px'}}>co2</span>
                      <span className="text-xs font-bold uppercase tracking-wider">Total Emissions</span>
                    </div>
                    <p className="text-3xl font-bold text-amber-900">{history.reduce((s, t) => s + t.emissionEstimate, 0).toFixed(2)} <span className="text-lg">kg CO₂</span></p>
                  </div>
                </div>

                {/* Table */}
                <div className="overflow-hidden rounded-2xl border border-emerald-100 bg-white shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="min-w-295 w-full">
                      <thead className="bg-linear-to-r from-emerald-50 via-white to-green-50">
                        <tr>
                          {['Date','Route','Transport','Distance','Duration','CO₂','Actions'].map((h) => (
                            <th key={h} className="px-6 py-4 text-left text-xs font-bold uppercase tracking-[0.18em] text-emerald-700">
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-emerald-100 bg-white">
                        {history.map((trip) => {
                          const meta = transportMeta[trip.transportType] || transportMeta.Car;
                          return (
                            <tr key={trip._id} className="transition hover:bg-emerald-50/60">
                              <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">
                                {formatDate(trip.createdAt)}
                              </td>
                              <td className="min-w-105 px-6 py-4 text-sm text-gray-900">
                                <div className="flex items-start gap-2">
                                  <span className="material-icons mt-0.5 text-emerald-600" style={{fontSize: '18px'}}>route</span>
                                  <span>{trip.startLocation} → {trip.destination}</span>
                                </div>
                              </td>
                              <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                                <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 font-semibold ${meta.bg} ${meta.border} ${meta.color}`}>
                                  <span className="material-icons" style={{fontSize: '18px'}}>{getTransportIcon(trip.transportType)}</span>
                                  {trip.transportType}
                                </span>
                              </td>
                              <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                                {trip.distance.toFixed(2)} km
                              </td>
                              <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                                {trip.duration.toFixed(0)} min
                              </td>
                              <td className="whitespace-nowrap px-6 py-4 text-sm font-bold">
                                <span className={trip.emissionEstimate === 0 ? 'text-emerald-700' : trip.emissionEstimate < 5 ? 'text-amber-600' : 'text-orange-600'}>
                                  {trip.emissionEstimate.toFixed(2)} kg
                                </span>
                              </td>
                              <td className="min-w-42.5 whitespace-nowrap px-6 py-4 text-sm">
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => openEdit(trip)}
                                    className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700 transition hover:bg-blue-100"
                                  >
                                    <span className="material-icons" style={{fontSize: '16px'}}>edit</span>
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => setDeleteId(trip._id)}
                                    className="inline-flex items-center gap-1 rounded-full bg-red-50 px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-100"
                                  >
                                    <span className="material-icons" style={{fontSize: '16px'}}>delete</span>
                                    Delete
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </main>

      {/* ── Delete Confirmation Modal ── */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-sm rounded-3xl border border-red-100 bg-white p-6 shadow-2xl mx-4">
            <h3 className="mb-2 flex items-center gap-2 text-lg font-bold text-gray-800">
              <span className="material-icons text-red-600" style={{fontSize: '24px'}}>delete_forever</span>
              Delete Trip
            </h3>
            <p className="mb-5 text-sm text-gray-600">
              Are you sure you want to delete this trip? This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteId(null)}
                disabled={deleteLoading}
                className="rounded-full border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={deleteLoading}
                className="rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-60"
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
          <div className="w-full max-w-md rounded-3xl border border-emerald-100 bg-white p-6 shadow-2xl mx-4">
            <h3 className="mb-1 flex items-center gap-2 text-lg font-bold text-gray-800">
              <span className="material-icons text-emerald-600" style={{fontSize: '24px'}}>edit</span>
              Edit Trip
            </h3>
            <p className="mb-4 text-xs text-gray-500">
              {editingTrip.startLocation} → {editingTrip.destination}
            </p>

            <div className="mb-4">
              <label className="mb-2 block text-sm font-semibold text-gray-700">Transport Type</label>
              <div className="grid grid-cols-3 gap-2">
                {TRANSPORT_TYPES.map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setEditTransport(type)}
                    className={`flex items-center justify-center gap-2 rounded-2xl border px-3 py-2.5 text-sm font-semibold transition ${
                      editTransport === type
                        ? 'border-emerald-500 bg-emerald-600 text-white shadow-sm'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-emerald-300 hover:bg-emerald-50'
                    }`}
                  >
                    <span className="material-icons" style={{fontSize: '18px'}}>{getTransportIcon(type)}</span>
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {/* Preview recalculated emission */}
            <div className="mb-4 rounded-2xl border border-emerald-100 bg-emerald-50/70 p-4 text-sm text-gray-700">
              <span className="font-semibold text-emerald-900">Estimated CO₂ after change: </span>
              <span className="font-bold text-orange-600">
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
                className="rounded-full border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleEditSave}
                disabled={editLoading || editTransport === editingTrip.transportType}
                className="rounded-full bg-linear-to-r from-emerald-600 to-green-600 px-4 py-2 text-sm font-semibold text-white transition hover:from-emerald-700 hover:to-green-700 disabled:opacity-60"
              >
                {editLoading ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
      
      <Footer />
    </div>
  );
};

export default CommuteHistory;

