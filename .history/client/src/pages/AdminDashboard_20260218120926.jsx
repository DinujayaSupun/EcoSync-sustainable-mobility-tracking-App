import { useContext, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
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
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
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
    fetchStats();
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
            <div className="h-64 bg-gray-50 flex items-center justify-center rounded border-2 border-dashed border-gray-200">
              <p className="text-gray-400">Recharts Bar Graph will go here</p>
            </div>
          </div>

          {/* Live Feed Section */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-xl font-bold mb-4 text-gray-800">Live Commute Feed</h3>
            <div className="space-y-3">
              {/* Placeholder for recent trips */}
              <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border-l-4 border-green-500">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <div className="flex-1">
                  <p className="text-sm text-gray-700">
                    <strong>Computing:</strong> Saved 1.2kg via Bus
                  </p>
                </div>
                <span className="text-xs text-gray-400">2 mins ago</span>
              </div>
              <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                <div className="flex-1">
                  <p className="text-sm text-gray-700">
                    <strong>Engineering:</strong> Saved 0.8kg via Bike
                  </p>
                </div>
                <span className="text-xs text-gray-400">5 mins ago</span>
              </div>
              <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg border-l-4 border-purple-500">
                <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
                <div className="flex-1">
                  <p className="text-sm text-gray-700">
                    <strong>Business:</strong> Saved 1.5kg via Train
                  </p>
                </div>
                <span className="text-xs text-gray-400">8 mins ago</span>
              </div>
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
            <button className="p-4 border-2 border-blue-200 rounded-lg hover:bg-blue-50 transition text-left">
              <Users className="text-blue-600 mb-2" size={28} />
              <h3 className="font-semibold text-gray-800">Manage Users</h3>
              <p className="text-sm text-gray-600">View and manage user accounts</p>
            </button>
            <button className="p-4 border-2 border-green-200 rounded-lg hover:bg-green-50 transition text-left">
              <Activity className="text-green-600 mb-2" size={28} />
              <h3 className="font-semibold text-gray-800">View Reports</h3>
              <p className="text-sm text-gray-600">Check sustainability reports</p>
            </button>
            <button className="p-4 border-2 border-purple-200 rounded-lg hover:bg-purple-50 transition text-left">
              <Settings className="text-purple-600 mb-2" size={28} />
              <h3 className="font-semibold text-gray-800">System Settings</h3>
              <p className="text-sm text-gray-600">Configure application settings</p>
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}

export default AdminDashboard
