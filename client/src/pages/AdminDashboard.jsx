import { useContext, useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { AuthContext } from '../context/AuthContext'
import { Users, Activity, BarChart3, Settings, LogOut, Wind, Map, Leaf } from 'lucide-react'
import API from '../api/axios'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

const AdminDashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalCO2: 0,
    activeToday: 0,
    faculties: 0,
    facultyData: []
  });
  const [recentTrips, setRecentTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // challenge management states
  const [showChallenges, setShowChallenges] = useState(false);
  const [challenges, setChallenges] = useState([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createData, setCreateData] = useState({
    transportMode: '',
    emissionTarget: '',
    durationDays: '',
    difficulty: '',
    type: '',
    rewardPoints: ''
  });
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({
    emissionTarget: '',
    durationDays: '',
    rewardPoints: '',
    status: ''
  });

  // fetch challenges when needed
  const fetchChallenges = async () => {
    try {
      const res = await API.get('/challenges?limit=100');
      // controller returns { challenges: [...] }
      setChallenges(res.data.challenges || res.data);
    } catch (err) {
      console.error('Error fetching challenges:', err);
    }
  };

  useEffect(() => {
    if (showChallenges) fetchChallenges();
  }, [showChallenges]);

  const handleCreateChange = e => {
    setCreateData({ ...createData, [e.target.name]: e.target.value });
  };

  const handleCreateSubmit = async e => {
    e.preventDefault();
    try {
      await API.post('/challenges/', createData);
      fetchChallenges();
      setShowCreateForm(false);
      setCreateData({
        transportMode: '',
        emissionTarget: '',
        durationDays: '',
        difficulty: '',
        type: '',
        rewardPoints: ''
      });
    } catch (err) {
      console.error('Failed to create challenge', err);
    }
  };

  const startEdit = ch => {
    setEditingId(ch._id);
    setEditData({
      emissionTarget: ch.emissionTarget || '',
      durationDays: ch.durationDays || '',
      rewardPoints: ch.rewardPoints || '',
      status: ch.status || ''
    });
    setShowCreateForm(false);
  };

  const handleEditChange = e => {
    setEditData({ ...editData, [e.target.name]: e.target.value });
  };

  const submitEdit = async e => {
    e.preventDefault();
    try {
      await API.put(`/challenges/${editingId}`, editData);
      fetchChallenges();
      setEditingId(null);
      setEditData({ emissionTarget: '', durationDays: '', rewardPoints: '', status: '' });
    } catch (err) {
      console.error('Update failed', err);
    }
  };

  const handleDelete = async id => {
    if (window.confirm('Delete this challenge?')) {
      try {
        await API.delete(`/challenges/${id}`);
        fetchChallenges();
      } catch (err) {
        console.error('Delete failed', err);
      }
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };
  
  // Utility function to format time ago
  const getTimeAgo = (date) => {
    const now = new Date();
    const diffMs = now - new Date(date);
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  };
  
  // Get color scheme based on transport mode
  const getTransportStyle = (mode) => {
    const modes = {
      bus: { bg: 'bg-green-50', border: 'border-green-500', dot: 'bg-green-500' },
      train: { bg: 'bg-purple-50', border: 'border-purple-500', dot: 'bg-purple-500' },
      bike: { bg: 'bg-blue-50', border: 'border-blue-500', dot: 'bg-blue-500' },
      walking: { bg: 'bg-yellow-50', border: 'border-yellow-500', dot: 'bg-yellow-500' },
      shuttle: { bg: 'bg-indigo-50', border: 'border-indigo-500', dot: 'bg-indigo-500' },
      car: { bg: 'bg-red-50', border: 'border-red-500', dot: 'bg-red-500' }
    };
    return modes[mode?.toLowerCase()] || modes.bus;
  };
  
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await API.get('/admin/stats');
        setStats(res.data);
      } catch (error) {
        console.error('Error fetching admin stats:', error);
        // Use default stats on error
      } finally {
        setLoading(false);
      }
    };
    
    const fetchRecentTrips = async () => {
      try {
        const res = await API.get('/admin/recent-trips?limit=5');
        if (res.data.success) {
          setRecentTrips(res.data.trips);
        }
      } catch (error) {
        console.error('Error fetching recent trips:', error);
      }
    };
    
    fetchStats();
    fetchRecentTrips();
    
    // Refresh recent trips every 30 seconds
    const interval = setInterval(fetchRecentTrips, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return (
    <div className="flex justify-center items-center h-screen bg-gray-100">
      <div className="text-xl text-gray-600">Loading Dashboard...</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Admin Header */}
      <nav className="bg-linear-to-r from-purple-600 to-indigo-600 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-white">EcoSync Admin</h1>
            <p className="text-purple-100 text-sm">Administrator Dashboard</p>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-white font-medium">{user?.name}</span>
            <button 
              onClick={handleLogout}
              className="bg-white text-purple-600 px-4 py-2 rounded-lg hover:bg-purple-50 transition flex items-center gap-2"
            >
              <LogOut size={18} />
              Logout
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">Total Users</p>
                <p className="text-3xl font-bold text-gray-800 mt-1">{stats.totalUsers}</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <Users className="text-blue-600" size={24} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">Total CO2 Saved</p>
                <p className="text-3xl font-bold text-gray-800 mt-1">{stats.totalCO2} kg</p>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <Wind className="text-green-600" size={24} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-yellow-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">Active Today</p>
                <p className="text-3xl font-bold text-gray-800 mt-1">{stats.activeToday}</p>
              </div>
              <div className="bg-yellow-100 p-3 rounded-full">
                <Activity className="text-yellow-600" size={24} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-purple-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">Faculties</p>
                <p className="text-3xl font-bold text-gray-800 mt-1">{stats.faculties}</p>
              </div>
              <div className="bg-purple-100 p-3 rounded-full">
                <Settings className="text-purple-600" size={24} />
              </div>
            </div>
          </div>
        </div>

        {/* Charts and Live Feed Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Chart Section */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-xl font-bold mb-4 text-gray-800">Impact by Faculty</h3>
            <div className="h-64">
              {stats.facultyData && stats.facultyData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.facultyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis 
                      dataKey="faculty" 
                      tick={{ fill: '#6b7280', fontSize: 12 }}
                      axisLine={{ stroke: '#e5e7eb' }}
                    />
                    <YAxis 
                      tick={{ fill: '#6b7280', fontSize: 12 }}
                      axisLine={{ stroke: '#e5e7eb' }}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#fff', 
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                      }}
                      cursor={{ fill: 'rgba(139, 92, 246, 0.1)' }}
                    />
                    <Bar 
                      dataKey="students" 
                      fill="#8b5cf6" 
                      radius={[8, 8, 0, 0]}
                      name="Students"
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full bg-gray-50 flex items-center justify-center rounded border-2 border-dashed border-gray-200">
                  <p className="text-gray-400">No faculty data available</p>
                </div>
              )}
            </div>
          </div>

          {/* Live Feed Section */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-xl font-bold mb-4 text-gray-800">Live Commute Feed</h3>
            <div className="space-y-3">
              {recentTrips.length > 0 ? (
                recentTrips.map((trip) => {
                  const style = getTransportStyle(trip.transportMode);
                  return (
                    <div key={trip._id} className={`flex items-center gap-3 p-3 ${style.bg} rounded-lg border-l-4 ${style.border}`}>
                      <div className={`w-2 h-2 ${style.dot} rounded-full animate-pulse`}></div>
                      <div className="flex-1">
                        <p className="text-sm text-gray-700">
                          <strong>{trip.faculty}:</strong> Saved {trip.co2Saved}kg via {trip.transportMode.charAt(0).toUpperCase() + trip.transportMode.slice(1)}
                        </p>
                      </div>
                      <span className="text-xs text-gray-400">{getTimeAgo(trip.createdAt)}</span>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <Activity className="mx-auto mb-2" size={32} />
                  <p>No recent trips yet</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Admin Info */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-2xl font-bold mb-4 text-gray-800">Admin Profile</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-purple-50 p-4 rounded-lg">
              <p className="text-gray-600 text-sm font-medium">Name</p>
              <p className="text-lg font-semibold text-gray-800">{user?.name}</p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <p className="text-gray-600 text-sm font-medium">Email</p>
              <p className="text-lg font-semibold text-gray-800">{user?.email}</p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <p className="text-gray-600 text-sm font-medium">Role</p>
              <p className="text-lg font-semibold text-purple-600 uppercase">{user?.role}</p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold mb-4 text-gray-800">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link 
              to="/admin/users" 
              className="p-4 border-2 border-blue-200 rounded-lg hover:bg-blue-50 transition text-left block">
              <Users className="text-blue-600 mb-2" size={28} />
              <h3 className="font-semibold text-gray-800">Manage Users</h3>
              <p className="text-sm text-gray-600">View and manage user accounts</p>
            </Link>
            <Link 
              to="/admin/reports" 
              className="p-4 border-2 border-green-200 rounded-lg hover:bg-green-50 transition text-left block">
              <Activity className="text-green-600 mb-2" size={28} />
              <h3 className="font-semibold text-gray-800">View Reports</h3>
              <p className="text-sm text-gray-600">Check sustainability reports</p>
            </Link>
            <button className="p-4 border-2 border-purple-200 rounded-lg hover:bg-purple-50 transition text-left">
              <Settings className="text-purple-600 mb-2" size={28} />
              <h3 className="font-semibold text-gray-800">System Settings</h3>
              <p className="text-sm text-gray-600">Configure application settings</p>
            </button>
          </div>
        </div>

        {/* Challenge Management Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mt-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-800">Challenges</h2>
            <button
              onClick={() => setShowChallenges(prev => !prev)}
              className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition"
            >
              {showChallenges ? 'Hide' : 'Show'} Challenges
            </button>
          </div>

          {showChallenges && (
            <>
              <button
                onClick={() => {
                  setShowCreateForm(prev => !prev);
                  setEditingId(null);
                }}
                className="mb-4 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition"
              >
                {showCreateForm ? 'Cancel New' : 'Create New Challenge'}
              </button>

              {showCreateForm && (
                <form onSubmit={handleCreateSubmit} className="space-y-4 mb-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input
                      name="transportMode"
                      value={createData.transportMode}
                      onChange={handleCreateChange}
                      placeholder="Transport Mode"
                      className="border rounded p-2 w-full"
                      required
                    />
                    <input
                      name="emissionTarget"
                      value={createData.emissionTarget}
                      onChange={handleCreateChange}
                      placeholder="Emission Target"
                      className="border rounded p-2 w-full"
                      required
                    />
                    <input
                      name="durationDays"
                      type="number"
                      value={createData.durationDays}
                      onChange={handleCreateChange}
                      placeholder="Duration (days)"
                      className="border rounded p-2 w-full"
                      required
                    />
                    <input
                      name="difficulty"
                      value={createData.difficulty}
                      onChange={handleCreateChange}
                      placeholder="Difficulty"
                      className="border rounded p-2 w-full"
                      required
                    />
                    <input
                      name="type"
                      value={createData.type}
                      onChange={handleCreateChange}
                      placeholder="Type"
                      className="border rounded p-2 w-full"
                      required
                    />
                    <input
                      name="rewardPoints"
                      type="number"
                      value={createData.rewardPoints}
                      onChange={handleCreateChange}
                      placeholder="Reward Points"
                      className="border rounded p-2 w-full"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                  >
                    Create Challenge
                  </button>
                </form>
              )}

              {/* challenge list */}
              <div className="space-y-4">
                {challenges.length === 0 && (
                  <p className="text-gray-500">No challenges available.</p>
                )}
                {challenges.map(ch => (
                  <div
                    key={ch._id}
                    className="border rounded p-4 flex flex-col md:flex-row md:justify-between items-start md:items-center"
                  >
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-800">{ch.title}</h3>
                      <p className="text-sm text-gray-600">{ch.description}</p>
                      <p className="text-xs text-gray-500">
                        Mode: {ch.transportMode} | Target: {ch.emissionTarget} | Duration: {ch.durationDays}d | Reward: {ch.rewardPoints}
                      </p>
                    </div>
                    <div className="mt-2 md:mt-0 flex gap-2">
                      <button
                        onClick={() => startEdit(ch)}
                        className="px-3 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600 transition text-sm"
                      >
                        Update
                      </button>
                      <button
                        onClick={() => handleDelete(ch._id)}
                        className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition text-sm"
                      >
                        Delete
                      </button>
                    </div>

                    {editingId === ch._id && (
                      <form onSubmit={submitEdit} className="w-full mt-4 md:mt-0">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                          <input
                            name="emissionTarget"
                            value={editData.emissionTarget}
                            onChange={handleEditChange}
                            placeholder="Emission Target"
                            className="border rounded p-2 w-full"
                            required
                          />
                          <input
                            name="durationDays"
                            type="number"
                            value={editData.durationDays}
                            onChange={handleEditChange}
                            placeholder="Duration"
                            className="border rounded p-2 w-full"
                            required
                          />
                          <input
                            name="rewardPoints"
                            type="number"
                            value={editData.rewardPoints}
                            onChange={handleEditChange}
                            placeholder="Reward Points"
                            className="border rounded p-2 w-full"
                            required
                          />
                          <select
                            name="status"
                            value={editData.status}
                            onChange={handleEditChange}
                            className="border rounded p-2 w-full"
                          >
                            <option value="ACTIVE">ACTIVE</option>
                            <option value="INACTIVE">INACTIVE</option>
                          </select>
                        </div>
                        <div className="mt-2 flex gap-2">
                          <button
                            type="submit"
                            className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition text-sm"
                          >
                            Save
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingId(null)}
                            className="px-3 py-1 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition text-sm"
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  )
}

export default AdminDashboard
