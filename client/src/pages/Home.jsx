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
      <nav className="sticky top-0 z-2000 border-b border-emerald-100/80 bg-white/90 shadow-sm backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-linear-to-br from-emerald-500 to-green-700 shadow-md">
              <span className="material-icons text-white" style={{fontSize: '24px'}}>eco</span>
            </div>
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight text-emerald-700 sm:text-3xl">EcoSync</h1>
              <p className="text-xs font-medium text-emerald-700/80 sm:text-sm">Smarter, cleaner commuting</p>
            </div>
          </div>

          <div className="flex flex-1 flex-wrap items-center justify-start gap-2 lg:justify-end">
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-800 shadow-sm">
              <span className="material-icons" style={{fontSize: '18px'}}>person</span>
              Welcome, {user?.name}!
            </span>
            <button
              onClick={() => navigate('/badges')}
              className="inline-flex items-center gap-2 rounded-full border border-amber-300 bg-amber-50 px-4 py-2.5 font-semibold text-amber-900 transition hover:bg-amber-100 hover:border-amber-400"
            >
              <span className="material-icons" style={{fontSize: '18px'}}>workspace_premium</span>
              Badges
            </button>
            <button
              onClick={() => navigate('/leaderboard')}
              className="inline-flex items-center gap-2 rounded-full border border-violet-300 bg-violet-50 px-4 py-2.5 font-semibold text-violet-900 transition hover:bg-violet-100 hover:border-violet-400"
            >
              <span className="material-icons" style={{fontSize: '18px'}}>leaderboard</span>
              Leaderboard
            </button>
            <button
              onClick={() => navigate('/commute-history')}
              className="inline-flex items-center gap-2 rounded-full border border-blue-300 bg-blue-50 px-4 py-2.5 font-semibold text-blue-900 transition hover:bg-blue-100 hover:border-blue-400"
            >
              <span className="material-icons" style={{fontSize: '18px'}}>history</span>
              Trip History
            </button>
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-2 rounded-full border border-rose-300 bg-rose-50 px-4 py-2.5 font-semibold text-rose-900 transition hover:bg-rose-100 hover:border-rose-400"
            >
              <span className="material-icons" style={{fontSize: '18px'}}>logout</span>
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
          <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="group rounded-2xl border-2 border-emerald-200 bg-linear-to-br from-emerald-50 via-emerald-50 to-green-100 p-6 shadow-md transition-all duration-300 hover:shadow-xl hover:border-emerald-400">
              <div className="flex items-center justify-between mb-3">
                <span className="material-icons" style={{fontSize: '32px', color: '#059669'}}>school</span>
                <p className="text-xs font-bold uppercase tracking-widest text-emerald-600">Faculty</p>
              </div>
              <h3 className="mb-1 text-sm font-semibold text-emerald-700">Your Faculty</h3>
              <p className="text-2xl font-bold text-emerald-900">{user?.faculty || 'Not Specified'}</p>
            </div>
            <div className="group rounded-2xl border-2 border-green-200 bg-linear-to-br from-green-50 via-green-50 to-emerald-100 p-6 shadow-md transition-all duration-300 hover:shadow-xl hover:border-green-400">
              <div className="flex items-center justify-between mb-3">
                <span className="material-icons" style={{fontSize: '32px', color: '#059669'}}>admin_panel_settings</span>
                <p className="text-xs font-bold uppercase tracking-widest text-green-600">Access Level</p>
              </div>
              <h3 className="mb-1 text-sm font-semibold text-green-700">Role</h3>
              <p className="text-2xl font-bold text-green-900 capitalize">{user?.role || 'User'}</p>
            </div>
            <div className="group rounded-2xl border-2 border-lime-200 bg-linear-to-br from-lime-50 via-lime-50 to-green-100 p-6 shadow-md transition-all duration-300 hover:shadow-xl hover:border-lime-400">
              <div className="flex items-center justify-between mb-3">
                <span className="material-icons" style={{fontSize: '32px', color: '#059669'}}>eco</span>
                <p className="text-xs font-bold uppercase tracking-widest text-lime-600">Eco Impact</p>
              </div>
              <h3 className="mb-1 text-sm font-semibold text-lime-700">CO₂ Saved</h3>
              <p className="text-2xl font-bold text-lime-900">{user?.total_co2_saved || 0} <span className="text-sm">kg</span></p>
            </div>
          </div>

          {/* Commute Analytics Section */}
          <div className="rounded-2xl border-2 border-emerald-100 bg-linear-to-br from-emerald-50/60 to-green-50/40 p-6 sm:p-7">
            <h3 className="mb-6 text-3xl font-bold text-emerald-900 flex items-center gap-3">
              <span className="material-icons" style={{fontSize: '32px'}}>analytics</span>
              Commute Analytics
            </h3>
            
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
                <div className="mb-7 grid grid-cols-1 gap-4 md:grid-cols-4">
                  <div className="group rounded-xl border-2 border-emerald-200 bg-linear-to-br from-white to-emerald-50/30 p-5 shadow-md transition-all duration-300 hover:shadow-lg hover:border-emerald-400">
                    <div className="flex items-center justify-between mb-3">
                      <span className="material-icons" style={{fontSize: '28px', color: '#059669'}}>directions_car</span>
                      <span className="inline-block rounded-full bg-emerald-100 px-2 py-1 text-xs font-bold text-emerald-700">Total</span>
                    </div>
                    <h4 className="text-xs font-semibold text-emerald-700 mb-2">Total Commutes</h4>
                    <p className="text-3xl font-bold text-emerald-900">{summary.totalCommutes}</p>
                  </div>
                  <div className="group rounded-xl border-2 border-green-200 bg-linear-to-br from-white to-green-50/30 p-5 shadow-md transition-all duration-300 hover:shadow-lg hover:border-green-400">
                    <div className="flex items-center justify-between mb-3">
                      <span className="material-icons" style={{fontSize: '28px', color: '#16a34a'}}>straighten</span>
                      <span className="inline-block rounded-full bg-green-100 px-2 py-1 text-xs font-bold text-green-700">Distance</span>
                    </div>
                    <h4 className="text-xs font-semibold text-green-700 mb-2">Total Distance</h4>
                    <p className="text-3xl font-bold text-green-900">{summary.totalDistance} <span className="text-lg">km</span></p>
                  </div>
                  <div className="group rounded-xl border-2 border-amber-200 bg-linear-to-br from-white to-amber-50/30 p-5 shadow-md transition-all duration-300 hover:shadow-lg hover:border-amber-400">
                    <div className="flex items-center justify-between mb-3">
                      <span className="material-icons" style={{fontSize: '28px', color: '#d97706'}}>cloud</span>
                      <span className="inline-block rounded-full bg-amber-100 px-2 py-1 text-xs font-bold text-amber-700">Emissions</span>
                    </div>
                    <h4 className="text-xs font-semibold text-amber-700 mb-2">Total Emissions</h4>
                    <p className="text-3xl font-bold text-amber-900">{summary.totalEmissions} <span className="text-lg">kg CO₂</span></p>
                  </div>
                  <div className="group rounded-xl border-2 border-teal-200 bg-linear-to-br from-white to-teal-50/30 p-5 shadow-md transition-all duration-300 hover:shadow-lg hover:border-teal-400">
                    <div className="flex items-center justify-between mb-3">
                      <span className="material-icons" style={{fontSize: '28px', color: '#0d9488'}}>schedule</span>
                      <span className="inline-block rounded-full bg-teal-100 px-2 py-1 text-xs font-bold text-teal-700">Duration</span>
                    </div>
                    <h4 className="text-xs font-semibold text-teal-700 mb-2">Total Duration</h4>
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
                      const iconMap = { 
                        Car: 'directions_car', 
                        Bus: 'directions_bus', 
                        Train: 'train', 
                        Bike: 'directions_bike', 
                        Walk: 'directions_walk' 
                      };
                      return (
                        <div key={type} className="group rounded-lg border-2 border-emerald-100 bg-linear-to-br from-emerald-50/60 to-green-50/40 p-5 transition-all duration-300 hover:border-emerald-400 hover:shadow-md">
                          <div className="flex items-center justify-between mb-3">
                            <span className="material-icons" style={{fontSize: '32px', color: '#059669'}}>
                              {iconMap[type]}
                            </span>
                            <span className="inline-block rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-700">{data.count}</span>
                          </div>
                          <h5 className="mb-3 font-bold text-emerald-900 text-lg">{type}</h5>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-700">Trips:</span>
                              <span className="font-semibold text-emerald-800">{data.count}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-700">Distance:</span>
                              <span className="font-semibold text-green-800">{data.distance} km</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-700">Emissions:</span>
                              <span className="font-semibold text-amber-800">{data.emissions} kg CO₂</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            ) : (
              <div className="rounded-2xl border-2 border-emerald-200 bg-linear-to-br from-emerald-50 to-green-50 p-10 text-center shadow-md">
                <span className="material-icons" style={{fontSize: '64px', color: '#059669', display: 'block', margin: '0 auto 16px'}}>assignment</span>
                <p className="mb-3 text-2xl font-bold text-emerald-900">No Commute Data Yet</p>
                <p className="text-lg text-emerald-700 mb-6">Start logging your commutes below to unlock analytics insights.</p>
                <div className="inline-block rounded-lg bg-linear-to-r from-emerald-500 to-green-500 px-6 py-3 font-semibold text-white">
                  <span className="material-icons" style={{fontSize: '18px', verticalAlign: 'middle', marginRight: '6px'}}>add_circle</span>
                  Start Logging Now
                </div>
              </div>
            )}
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
        <div className="overflow-hidden rounded-3xl border-2 border-emerald-100 bg-linear-to-br from-white via-emerald-50/40 to-green-50 shadow-lg">
          <div className="bg-linear-to-r from-emerald-700 to-green-600 px-6 py-5 text-white sm:px-7 sm:py-6">
            <div className="flex items-center gap-2 text-emerald-50/90">
              <span className="material-icons" style={{fontSize: '20px'}}>spa</span>
              <p className="text-xs font-semibold uppercase tracking-[0.2em]">Eco Habits</p>
            </div>
            <h3 className="mt-2 flex items-center gap-2 text-2xl font-bold sm:text-3xl">
              <span className="material-icons" style={{fontSize: '28px'}}>tips_and_updates</span>
              Sustainable Commute Tips
            </h3>
            <p className="mt-2 max-w-2xl text-sm text-emerald-100 sm:text-base">Small daily choices can significantly reduce your carbon footprint.</p>
          </div>

          <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 sm:p-5">
            {[
              { icon: 'directions_bike', title: 'Bike or Walk', body: 'For trips under 2 km to stay healthy and reduce emissions.' },
              { icon: 'train', title: 'Take the Train', body: 'It has the lowest emissions among motorized transport options.' },
              { icon: 'directions_bus', title: 'Share Rides', body: 'Carpooling or public buses reduce individual carbon footprint.' },
              { icon: 'bar_chart', title: 'Track Your Progress', body: 'Check your history regularly to measure your environmental impact.' },
            ].map((tip) => (
              <div key={tip.title} className="group rounded-2xl border-2 border-emerald-200 bg-white p-5 shadow-md transition-all duration-300 hover:-translate-y-1 hover:border-emerald-400 hover:shadow-xl">
                <div className="mb-3 flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 shadow-sm transition group-hover:bg-emerald-100">
                    <span className="material-icons" style={{fontSize: '24px'}}>{tip.icon}</span>
                  </span>
                  <p className="text-base font-bold text-emerald-900">{tip.title}</p>
                </div>
                <p className="text-sm leading-6 text-gray-700">{tip.body}</p>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}

export default Home
