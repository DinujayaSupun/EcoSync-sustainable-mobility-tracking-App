import { useContext, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AuthContext } from '../context/AuthContext'
import CommuteLogger from './CommuteLogger'
import PredictionCard from '../components/PredictionCard'
import API from '../api/axios'

const Home = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [summary, setSummary] = useState(null);
  const [loadingSummary, setLoadingSummary] = useState(true);

  useEffect(() => {
    fetchEmissionSummary();
  }, []);

  const fetchEmissionSummary = async () => {
    try {
      const { data } = await API.get('/commute/emission-summary');
      setSummary(data.data);
    } catch (err) {
      console.error('Failed to fetch emission summary:', err);
    } finally {
      setLoadingSummary(false);
    }
  };

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
              onClick={() => navigate('/smart-commute')}
              className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-4 py-2 rounded transition font-medium shadow-md"
            >
              🚀 Smart Commute
            </button>
            <button
              onClick={() => navigate('/commute-history')}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded transition"
            >
              📜 Trip History
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
          
          {/* Basic User Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
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

          {/* Commute Analytics Section */}
          <div className="border-t pt-6">
            <h3 className="text-2xl font-bold text-gray-800 mb-4">📊 Commute Analytics</h3>
            
            {loadingSummary ? (
              <div className="animate-pulse">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="bg-gray-100 h-24 rounded-lg"></div>
                  ))}
                </div>
              </div>
            ) : summary && summary.totalCommutes > 0 ? (
              <>
                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-5 rounded-lg border border-blue-200">
                    <h4 className="text-sm font-semibold text-blue-700 mb-2">Total Commutes</h4>
                    <p className="text-3xl font-bold text-blue-900">{summary.totalCommutes}</p>
                  </div>
                  <div className="bg-gradient-to-br from-green-50 to-green-100 p-5 rounded-lg border border-green-200">
                    <h4 className="text-sm font-semibold text-green-700 mb-2">Total Distance</h4>
                    <p className="text-3xl font-bold text-green-900">{summary.totalDistance} <span className="text-lg">km</span></p>
                  </div>
                  <div className="bg-gradient-to-br from-red-50 to-red-100 p-5 rounded-lg border border-red-200">
                    <h4 className="text-sm font-semibold text-red-700 mb-2">Total Emissions</h4>
                    <p className="text-3xl font-bold text-red-900">{summary.totalEmissions} <span className="text-lg">kg CO₂</span></p>
                  </div>
                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-5 rounded-lg border border-purple-200">
                    <h4 className="text-sm font-semibold text-purple-700 mb-2">Total Duration</h4>
                    <p className="text-3xl font-bold text-purple-900">{Math.round(summary.totalDuration / 60)} <span className="text-lg">hrs</span></p>
                  </div>
                </div>

                {/* Transport Breakdown */}
                <div className="bg-gray-50 rounded-lg p-5 border border-gray-200">
                  <h4 className="text-lg font-bold text-gray-800 mb-4">🚗 Transport Breakdown</h4>
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    {Object.entries(summary.transportBreakdown).map(([type, data]) => {
                      if (data.count === 0) return null;
                      const icons = { Car: '🚗', Bus: '🚌', Train: '🚆', Bike: '🚴', Walk: '🚶' };
                      return (
                        <div key={type} className="bg-white p-4 rounded-lg border border-gray-300">
                          <div className="text-2xl mb-2">{icons[type]}</div>
                          <h5 className="font-semibold text-gray-700">{type}</h5>
                          <p className="text-sm text-gray-600">{data.count} trips</p>
                          <p className="text-sm text-gray-600">{data.distance} km</p>
                          <p className="text-sm font-semibold text-red-600">{data.emissions} kg CO₂</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            ) : (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
                <p className="text-blue-800 text-lg mb-2">📝 No commute data yet</p>
                <p className="text-blue-600">Start logging your commutes below to see analytics!</p>
              </div>
            )}
          </div>
        </div>

        {/* Smart Commute Module Feature Card */}
        <div 
          onClick={() => navigate('/smart-commute')}
          className="bg-gradient-to-r from-green-500 to-green-700 rounded-lg shadow-lg p-8 mb-8 cursor-pointer hover:shadow-2xl transition-all transform hover:-translate-y-1"
        >
          <div className="flex items-center justify-between text-white">
            <div>
              <h2 className="text-3xl font-bold mb-3 flex items-center gap-2">
                🚀 Smart Commute & Logistics
              </h2>
              <p className="text-lg mb-4 text-green-50">
                Weather-based recommendations and carbon tracking for sustainable commuting
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                <div className="bg-white bg-opacity-20 rounded px-3 py-2">☁️ Weather Suggestions</div>
                <div className="bg-white bg-opacity-20 rounded px-3 py-2">🗺️ Heat Map</div>
                <div className="bg-white bg-opacity-20 rounded px-3 py-2">🅿️ Parking Impact</div>
              </div>
            </div>
            <div className="text-6xl">→</div>
          </div>
        </div>

        {/* Prediction Card */}
        <div className="mb-8">
          <PredictionCard />
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
