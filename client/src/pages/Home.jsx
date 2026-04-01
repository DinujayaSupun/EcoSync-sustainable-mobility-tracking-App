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
              className="bg-linear-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-4 py-2 rounded transition font-medium shadow-md"
            >
              🚀 Smart Commute
            </button>
            <button
              onClick={() => navigate('/badges')}
              className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded transition"
            >
              🏅 Badges
            </button>
            <button
              onClick={() => navigate('/leaderboard')}
              className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded transition"
            >
              🏆 Leaderboard
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
        <div className="mb-8 overflow-hidden rounded-2xl border border-emerald-100 bg-white shadow-lg">
          <div className="bg-linear-to-r from-emerald-700 to-green-600 px-6 py-5 text-white">
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-100">Overview</p>
            <h2 className="mt-1 text-3xl font-bold">Dashboard</h2>
          </div>
          <div className="p-5 sm:p-6">
          
          {/* Basic User Stats */}
          <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="rounded-xl border border-emerald-200 bg-linear-to-br from-emerald-50 to-green-100 p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Faculty</p>
              <h3 className="mt-2 text-2xl font-bold text-emerald-900">Faculty</h3>
              <p className="mt-2 text-gray-700">{user?.faculty || 'Not Specified'}</p>
            </div>
            <div className="rounded-xl border border-green-200 bg-linear-to-br from-green-50 to-emerald-100 p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-green-700">Access Level</p>
              <h3 className="mt-2 text-2xl font-bold text-green-900">Role</h3>
              <p className="mt-2 text-gray-700 capitalize">{user?.role || 'User'}</p>
            </div>
            <div className="rounded-xl border border-lime-200 bg-linear-to-br from-lime-50 to-green-100 p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-lime-700">Eco Impact</p>
              <h3 className="mt-2 text-2xl font-bold text-lime-900">CO2 Saved</h3>
              <p className="mt-2 text-gray-700">{user?.total_co2_saved || 0} kg</p>
            </div>
          </div>

          {/* Commute Analytics Section */}
          <div className="rounded-xl border border-emerald-100 bg-emerald-50/40 p-4 sm:p-5">
            <h3 className="mb-4 text-2xl font-bold text-emerald-900"> Commute Analytics</h3>
            
            {loadingSummary ? (
              <div className="animate-pulse">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-24 rounded-lg bg-emerald-100"></div>
                  ))}
                </div>
              </div>
            ) : summary && summary.totalCommutes > 0 ? (
              <>
                {/* Summary Cards */}
                <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
                  <div className="rounded-lg border border-emerald-200 bg-white p-5">
                    <h4 className="mb-2 text-sm font-semibold text-emerald-700">Total Commutes</h4>
                    <p className="text-3xl font-bold text-emerald-900">{summary.totalCommutes}</p>
                  </div>
                  <div className="rounded-lg border border-green-200 bg-white p-5">
                    <h4 className="mb-2 text-sm font-semibold text-green-700">Total Distance</h4>
                    <p className="text-3xl font-bold text-green-900">{summary.totalDistance} <span className="text-lg">km</span></p>
                  </div>
                  <div className="rounded-lg border border-amber-200 bg-white p-5">
                    <h4 className="mb-2 text-sm font-semibold text-amber-700">Total Emissions</h4>
                    <p className="text-3xl font-bold text-amber-900">{summary.totalEmissions} <span className="text-lg">kg CO₂</span></p>
                  </div>
                  <div className="rounded-lg border border-teal-200 bg-white p-5">
                    <h4 className="mb-2 text-sm font-semibold text-teal-700">Total Duration</h4>
                    <p className="text-3xl font-bold text-teal-900">{Math.round(summary.totalDuration / 60)} <span className="text-lg">hrs</span></p>
                  </div>
                </div>

                {/* Transport Breakdown */}
                <div className="rounded-lg border border-emerald-200 bg-white p-5">
                  <h4 className="mb-4 text-lg font-bold text-emerald-900">🚗 Transport Breakdown</h4>
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    {Object.entries(summary.transportBreakdown).map(([type, data]) => {
                      if (data.count === 0) return null;
                      const icons = { Car: '🚗', Bus: '🚌', Train: '🚆', Bike: '🚴', Walk: '🚶' };
                      return (
                        <div key={type} className="rounded-lg border border-emerald-100 bg-emerald-50/40 p-4">
                          <div className="text-2xl mb-2">{icons[type]}</div>
                          <h5 className="font-semibold text-emerald-900">{type}</h5>
                          <p className="text-sm text-gray-600">{data.count} trips</p>
                          <p className="text-sm text-gray-600">{data.distance} km</p>
                          <p className="text-sm font-semibold text-amber-700">{data.emissions} kg CO₂</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            ) : (
              <div className="rounded-xl border border-emerald-200 bg-white p-8 text-center shadow-sm">
                <p className="mb-2 text-xl font-semibold text-emerald-900">📝 No commute data yet</p>
                <p className="text-emerald-700">Start logging your commutes below to unlock analytics insights.</p>
              </div>
            )}
          </div>
          </div>
        </div>

        {/* Smart Commute Module Feature Card */}
        <div
          onClick={() => navigate('/smart-commute')}
          className="group relative mb-8 cursor-pointer overflow-hidden rounded-2xl border border-emerald-300 bg-linear-to-r from-emerald-600 via-green-600 to-emerald-700 p-6 text-white shadow-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl sm:p-8"
        >
          <div className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-white/10 blur-2xl" />
          <div className="pointer-events-none absolute -bottom-24 -left-20 h-64 w-64 rounded-full bg-emerald-300/20 blur-2xl" />

          <div className="relative flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div className="max-w-3xl">
              <p className="mb-2 inline-flex rounded-full border border-white/30 bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-50">
                Smart Mobility Hub
              </p>
              <h2 className="mb-3 flex items-center gap-2 text-3xl font-bold leading-tight sm:text-4xl">
                Smart Commute & Logistics
              </h2>
              <p className="mb-5 text-base text-emerald-50 sm:text-lg">
                Weather-based recommendations and carbon tracking for sustainable commuting.
              </p>
              <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-3">
                <div className="rounded-xl border border-white/30 bg-white/15 px-3 py-2.5 font-medium backdrop-blur-sm">☁️ Weather Suggestions</div>
                <div className="rounded-xl border border-white/30 bg-white/15 px-3 py-2.5 font-medium backdrop-blur-sm">🗺️ Heat Map Insights</div>
                <div className="rounded-xl border border-white/30 bg-white/15 px-3 py-2.5 font-medium backdrop-blur-sm">🅿️ Parking Impact</div>
              </div>
            </div>

            <div className="flex items-center self-end rounded-full border border-white/40 bg-white/15 px-5 py-3 text-sm font-semibold backdrop-blur-sm transition group-hover:bg-white/25 md:self-center">
              Open Module <span className="ml-2 text-2xl">→</span>
            </div>
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
        <div className="overflow-hidden rounded-2xl border border-emerald-100 bg-white shadow-lg">
          <div className="bg-linear-to-r from-emerald-700 to-green-600 px-6 py-5 text-white">
            <p className="text-xs font-semibold uppercase tracking-wider text-emerald-100">Eco Habits</p>
            <h3 className="mt-1 text-2xl font-bold">Sustainable Commute Tips</h3>
            <p className="mt-2 text-sm text-emerald-100">Small daily choices can significantly reduce your carbon footprint.</p>
          </div>

          <div className="grid grid-cols-1 gap-3 bg-linear-to-br from-emerald-50 via-white to-green-50 p-4 sm:grid-cols-2 sm:gap-4 sm:p-5">
            <div className="rounded-xl border border-emerald-200 bg-white p-4 shadow-sm">
              <p className="text-sm font-semibold text-emerald-700">🚴 Bike or Walk</p>
              <p className="mt-1 text-sm text-gray-700">For trips under 2 km to stay healthy and reduce emissions.</p>
            </div>
            <div className="rounded-xl border border-emerald-200 bg-white p-4 shadow-sm">
              <p className="text-sm font-semibold text-emerald-700">🚆 Take the Train</p>
              <p className="mt-1 text-sm text-gray-700">It has the lowest emissions among motorized transport options.</p>
            </div>
            <div className="rounded-xl border border-emerald-200 bg-white p-4 shadow-sm">
              <p className="text-sm font-semibold text-emerald-700">🚌 Share Rides</p>
              <p className="mt-1 text-sm text-gray-700">Carpooling or public buses reduce individual carbon footprint.</p>
            </div>
            <div className="rounded-xl border border-emerald-200 bg-white p-4 shadow-sm">
              <p className="text-sm font-semibold text-emerald-700">📊 Track Your Progress</p>
              <p className="mt-1 text-sm text-gray-700">Check your history regularly to measure your environmental impact.</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default Home
