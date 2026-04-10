import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../api/axios';

const TripAchievements = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [storedEvents, setStoredEvents] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [eventsError, setEventsError] = useState('');

  useEffect(() => {
    const loadEvents = async () => {
      setLoadingEvents(true);
      setEventsError('');
      try {
        const { data } = await API.get('/achievements/my?limit=20');
        setStoredEvents(data.data || []);
      } catch (err) {
        setEventsError(err.response?.data?.message || 'Failed to load achievement history.');
      } finally {
        setLoadingEvents(false);
      }
    };

    loadEvents();
  }, []);

  const formattedHistory = useMemo(() => {
    return (storedEvents || []).map((evt) => {
      const time = new Date(evt.createdAt).toLocaleString();
      const badgeImageUrl = evt?.badge?.imageUrl || evt?.metadata?.badgeImageUrl || '';
      const badgeName = evt?.badge?.name || evt?.metadata?.badgeName || evt.title;
      return {
        id: evt._id,
        title: evt.title,
        message: evt.message,
        icon: evt.icon || 'emoji_events',
        badgeImageUrl,
        badgeName,
        time,
        type: evt.type,
      };
    });
  }, [storedEvents]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-emerald-50/30 to-green-50">
      <nav className="sticky top-0 z-2000 border-b border-emerald-100/80 bg-white/90 shadow-sm backdrop-blur-md">
        <div className="flex w-full items-center justify-between gap-3 px-4 py-3">
          <div className="mr-3 flex shrink-0 items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-linear-to-br from-emerald-500 to-green-700 shadow-md">
              <span className="material-icons text-white" style={{fontSize: '22px'}}>eco</span>
            </div>
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight text-emerald-700">EcoSync</h1>
              <p className="hidden text-xs font-medium text-emerald-700/80 md:block">Smarter, cleaner commuting</p>
            </div>
          </div>

          <div className="flex min-w-0 flex-1 flex-wrap items-center justify-end gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3.5 py-2 text-sm font-semibold text-emerald-800 shadow-sm max-sm:hidden">
              <span className="material-icons" style={{fontSize: '17px'}}>person</span>
              Welcome, {user?.name}!
            </span>
            <button
              onClick={() => navigate('/home')}
              className="inline-flex items-center gap-1.5 rounded-full border border-emerald-300 bg-emerald-50 px-3.5 py-2 text-sm font-semibold text-emerald-900 transition hover:bg-emerald-100 hover:border-emerald-400"
            >
              <span className="material-icons" style={{fontSize: '17px'}}>home</span>
              Home
            </button>
            <button
              onClick={() => navigate('/commute-logger')}
              className="inline-flex items-center gap-1.5 rounded-full border border-emerald-300 bg-emerald-50 px-3.5 py-2 text-sm font-semibold text-emerald-900 transition hover:bg-emerald-100 hover:border-emerald-400"
            >
              <span className="material-icons" style={{fontSize: '17px'}}>directions</span>
              Commute Logger
            </button>
            <button
              onClick={() => navigate('/commute-history')}
              className="inline-flex items-center gap-1.5 rounded-full border border-emerald-300 bg-emerald-50 px-3.5 py-2 text-sm font-semibold text-emerald-900 transition hover:bg-emerald-100 hover:border-emerald-400"
            >
              <span className="material-icons" style={{fontSize: '17px'}}>history</span>
              Trip History
            </button>
            <button
              onClick={() => navigate('/trip-achievements')}
              className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400 bg-emerald-100 px-3.5 py-2 text-sm font-semibold text-emerald-900 transition hover:bg-emerald-200 hover:border-emerald-500"
            >
              <span className="material-icons" style={{fontSize: '17px'}}>military_tech</span>
              Achievements
            </button>
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 rounded-full border border-rose-300 bg-rose-50 px-3.5 py-2 text-sm font-semibold text-rose-900 transition hover:bg-rose-100 hover:border-rose-400"
            >
              <span className="material-icons" style={{fontSize: '17px'}}>logout</span>
              Logout
            </button>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-384 px-4 py-8">
        <div className="overflow-hidden rounded-3xl border-2 border-emerald-100 bg-white shadow-xl">
          <div className="flex flex-col gap-4 border-b border-emerald-100 bg-linear-to-r from-emerald-700 to-green-600 px-6 py-5 text-white sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <span className="material-icons text-white" style={{fontSize: '32px'}}>emoji_events</span>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-100">Gamification</p>
                <h2 className="text-2xl font-bold sm:text-3xl">Achievement History</h2>
              </div>
            </div>
            <p className="text-sm text-emerald-100">Your complete persisted rewards and progress timeline.</p>
          </div>

          <div className="px-6 py-6 sm:px-7">
            <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <button
                onClick={() => navigate('/badges')}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-900 transition hover:border-emerald-400 hover:bg-emerald-100"
              >
                <span className="material-icons" style={{ fontSize: '20px' }}>workspace_premium</span>
                Open Badges
              </button>
              <button
                onClick={() => navigate('/challenges')}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-900 transition hover:border-emerald-400 hover:bg-emerald-100"
              >
                <span className="material-icons" style={{ fontSize: '20px' }}>emoji_events</span>
                Open Challenges
              </button>
            </div>

            <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">Stored Events</p>
                <p className="mt-1 text-lg font-bold text-emerald-900">{formattedHistory.length}</p>
              </div>
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">Badges + Challenges</p>
                <p className="mt-1 text-lg font-bold text-emerald-900">Persistent Tracking</p>
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-emerald-100 bg-white p-4 shadow-sm sm:p-5">
              <h3 className="mb-1 text-lg font-bold text-emerald-900">Stored Achievement History</h3>
              <p className="mb-3 text-sm text-emerald-700">Your persisted badge and challenge events are listed here.</p>

              {loadingEvents ? (
                <p className="text-sm text-emerald-700">Loading achievement history...</p>
              ) : eventsError ? (
                <p className="text-sm text-red-700">{eventsError}</p>
              ) : formattedHistory.length === 0 ? (
                <p className="text-sm text-emerald-700">No stored achievements yet.</p>
              ) : (
                <div className="space-y-2">
                  {formattedHistory.map((evt) => (
                    <div key={evt.id} className="rounded-xl border border-emerald-100 bg-emerald-50/40 px-3 py-3 transition hover:bg-emerald-50/70">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
                        <div className="flex items-start gap-2">
                          {evt.badgeImageUrl ? (
                            <img
                              src={evt.badgeImageUrl}
                              alt={evt.badgeName}
                              className="h-7 w-7 rounded-full border border-emerald-200 object-cover"
                              loading="lazy"
                            />
                          ) : (
                            <span className="material-icons text-emerald-700" style={{ fontSize: '18px' }}>{evt.icon}</span>
                          )}
                          <div>
                            <p className="text-sm font-semibold text-emerald-900">{evt.title}</p>
                            <p className="text-xs text-emerald-700">{evt.message}</p>
                            <span className="mt-1 inline-flex rounded-full border border-emerald-200 bg-white px-2 py-0.5 text-[10px] font-semibold text-emerald-800">
                              {evt.type}
                            </span>
                          </div>
                        </div>
                        <span className="text-xs text-emerald-700 sm:pt-0.5">{evt.time}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default TripAchievements;
