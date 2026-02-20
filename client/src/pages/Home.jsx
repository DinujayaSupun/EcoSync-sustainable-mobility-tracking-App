import { useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import { AuthContext } from '../context/AuthContext'
import CommuteLogger from './CommuteLogger'

const Home = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-green-600">EcoSync</h1>
          <div className="flex items-center gap-4">
            <span className="text-gray-700">Welcome, {user?.name}!</span>
            <button
              onClick={() => navigate('/commute-history')}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded transition"
            >
              View History
            </button>
            <button 
              onClick={handleLogout}
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded transition"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>
      
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Dashboard Stats */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-3xl font-bold mb-4">Dashboard</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-green-50 p-6 rounded-lg border border-green-200">
              <h3 className="text-xl font-semibold text-green-700 mb-2">Faculty</h3>
              <p className="text-gray-700">{user?.faculty || 'Not Specified'}</p>
            </div>
            <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
              <h3 className="text-xl font-semibold text-blue-700 mb-2">Role</h3>
              <p className="text-gray-700 capitalize">{user?.role || 'User'}</p>
            </div>
            <div className="bg-purple-50 p-6 rounded-lg border border-purple-200">
              <h3 className="text-xl font-semibold text-purple-700 mb-2">CO2 Saved</h3>
              <p className="text-gray-700">{user?.total_co2_saved || 0} kg</p>
            </div>
          </div>
        </div>

        {/* Commute Logger */}
        <div className="mb-8">
          <CommuteLogger />
        </div>

        {/* Quick Tips Section */}
        <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-lg shadow-md p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4">🌱 Sustainable Commute Tips</h3>
          <ul className="space-y-2 text-gray-700">
            <li>🚴 <strong>Bike or Walk</strong> for trips under 2 km to stay healthy and reduce emissions</li>
            <li>🚆 <strong>Take the Train</strong> - It has the lowest emissions among motorized transport</li>
            <li>🚌 <strong>Share Rides</strong> - Carpooling or public buses reduce individual carbon footprint</li>
            <li>📊 <strong>Track Your Progress</strong> - Check your history to see your environmental impact</li>
          </ul>
        </div>
      </main>
    </div>
  )
}

export default Home
