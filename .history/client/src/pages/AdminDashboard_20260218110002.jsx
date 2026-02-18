import { useContext, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AuthContext } from '../context/AuthContext'
import { Users, Activity, BarChart3, Settings, LogOut } from 'lucide-react'
import API from '../api/axios'

const AdminDashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const [data, setData] = useState(null);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };
  
  useEffect(() => {
    const fetchStats = async () => {
      const res = await API.get('/admin/stats');
      setData(res.data);
    };
    fetchStats();
  }, []);

  if (!data) return <div className="p-10">Loading Intelligence...</div>;

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Admin Header */}
      <nav className="bg-gradient-to-r from-purple-600 to-indigo-600 shadow-lg">
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">Total Users</p>
                <p className="text-3xl font-bold text-gray-800 mt-1">0</p>
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
                <p className="text-3xl font-bold text-gray-800 mt-1">0 kg</p>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <Activity className="text-green-600" size={24} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-yellow-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">Active Today</p>
                <p className="text-3xl font-bold text-gray-800 mt-1">0</p>
              </div>
              <div className="bg-yellow-100 p-3 rounded-full">
                <BarChart3 className="text-yellow-600" size={24} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-purple-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">Faculties</p>
                <p className="text-3xl font-bold text-gray-800 mt-1">0</p>
              </div>
              <div className="bg-purple-100 p-3 rounded-full">
                <Settings className="text-purple-600" size={24} />
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

        <div className="p-8 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold mb-8 text-gray-800">University Sustainability Command Center</h1>

      {/* KPI Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <StatCard title="Students Engaged" value={data.kpis.totalStudents} unit="Users" icon={Users} color="#3b82f6" />
        <StatCard title="CO2 Offset" value={data.kpis.totalCO2} unit="kg" icon={Wind} color="#10b981" />
        <StatCard title="Distance Tracked" value={data.kpis.totalDistance} unit="km" icon={Map} color="#f59e0b" />
        <StatCard title="Tree Equivalent" value={data.kpis.treeEquivalent} unit="Trees" icon={Leaf} color="#059669" />
      </div>

      {/* Charts Section */}
      <div className="bg-white p-8 rounded-xl shadow-md">
        <h2 className="text-xl font-bold mb-6 text-gray-700">Participation by Faculty</h2>
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.facultyData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="faculty" />
              <YAxis />
              <Tooltip cursor={{fill: '#f3f4f6'}} />
              <Bar dataKey="students" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
      </main>
    </div>
  )
}

export default AdminDashboard
