import { useLocation, useNavigate } from 'react-router-dom';

const NAV_ITEMS = [
  {
    path: '/home',
    label: 'Home',
    icon: 'home',
    base: 'border-emerald-300/40 bg-emerald-800/40 text-emerald-100 hover:bg-emerald-700/50',
    active: 'border-emerald-300/40 bg-linear-to-r from-emerald-500 to-green-600 text-white shadow-lg',
  },
  {
    path: '/weather-suggestion',
    label: 'Check Weather',
    icon: 'cloud',
    base: 'border-emerald-300/40 bg-emerald-800/40 text-emerald-100 hover:bg-emerald-700/50',
    active: 'border-emerald-300/40 bg-linear-to-r from-emerald-500 to-green-600 text-white shadow-lg',
  },
  {
    path: '/badges',
    label: 'Badges',
    icon: 'workspace_premium',
    base: 'border-emerald-300/40 bg-emerald-800/40 text-emerald-100 hover:bg-emerald-700/50',
    active: 'border-emerald-300/40 bg-linear-to-r from-emerald-500 to-green-600 text-white shadow-lg',
  },
  {
    path: '/leaderboard',
    label: 'Leaderboard',
    icon: 'leaderboard',
    base: 'border-emerald-300/40 bg-emerald-800/40 text-emerald-100 hover:bg-emerald-700/50',
    active: 'border-emerald-300/40 bg-linear-to-r from-emerald-500 to-green-600 text-white shadow-lg',
  },
  {
    path: '/commute-history',
    label: 'Trip History',
    icon: 'history',
    base: 'border-emerald-300/40 bg-emerald-800/40 text-emerald-100 hover:bg-emerald-700/50',
    active: 'border-emerald-300/40 bg-linear-to-r from-emerald-500 to-green-600 text-white shadow-lg',
  },
];

const UserNavbar = ({ userName, onLogout }) => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <nav className="sticky top-0 z-2000 border-b border-emerald-600/80 bg-linear-to-r from-emerald-800 to-emerald-900 shadow-[0_14px_35px_-18px_rgba(16,185,129,0.45)] backdrop-blur-xl">
      <div className="w-full px-3 py-3 sm:px-4">
        <div className="flex flex-col gap-3 2xl:flex-row 2xl:items-center 2xl:justify-between">
          <button
            onClick={() => navigate('/home')}
            className="group flex w-fit items-center gap-3 rounded-2xl px-2 py-1 transition hover:bg-emerald-700/40"
            aria-label="Go to EcoSync home"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-linear-to-br from-emerald-400 to-green-500 shadow-[0_10px_24px_-10px_rgba(52,211,153,0.9)] ring-1 ring-emerald-300/40 transition group-hover:scale-105">
              <span className="material-icons text-white" style={{ fontSize: '22px' }}>eco</span>
            </div>
            <div className="text-left leading-tight">
              <h1 className="text-2xl font-extrabold tracking-tight text-white">EcoSync</h1>
              <p className="text-xs font-semibold text-emerald-200">Smarter, cleaner commuting</p>
            </div>
          </button>

          <div className="flex min-w-0 items-center gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-emerald-300/60 bg-emerald-700/55 px-4 py-2 text-sm font-semibold text-emerald-100 shadow-sm">
              <span className="material-icons" style={{ fontSize: '17px' }}>person</span>
              Welcome, {userName || 'User'}!
            </span>

            {NAV_ITEMS.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-2 text-sm font-semibold transition-all duration-300 ${isActive ? item.active : item.base}`}
                >
                  <span className="material-icons" style={{ fontSize: '17px' }}>{item.icon}</span>
                  {item.label}
                </button>
              );
            })}

            <button
              onClick={onLogout}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-emerald-300/60 bg-emerald-700/55 px-3.5 py-2 text-sm font-semibold text-emerald-100 transition-all duration-300 hover:bg-emerald-600/65"
            >
              <span className="material-icons" style={{ fontSize: '17px' }}>logout</span>
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default UserNavbar;
