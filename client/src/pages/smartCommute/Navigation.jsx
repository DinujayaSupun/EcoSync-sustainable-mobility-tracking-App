import { Link, useLocation } from 'react-router-dom';

/**
 * Navigation Component for Smart Commute Module
 * 
 * This component provides a consistent navigation bar across all Smart Commute pages.
 * Add this to the top of each page component for easy navigation.
 * 
 * Usage:
 * import SmartCommuteNav from './Navigation';
 * 
 * function MyPage() {
 *   return (
 *     <div>
 *       <SmartCommuteNav />
 *       {/* Rest of page content *\/}
 *     </div>
 *   );
 * }
 */

const SmartCommuteNav = () => {
  const location = useLocation();

  const navItems = [
    { path: '/smart-commute', label: 'Dashboard', icon: '🏠' },
    { path: '/smart-commute/weather', label: 'Weather', icon: '☁️' },
  ];

  const isActive = (path) => {
    if (path === '/smart-commute') {
      return location.pathname === path || location.pathname === '/smart-commute/';
    }
    return location.pathname === path;
  };

  return (
    <nav className="bg-white shadow-md mb-6 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo/Title */}
          <Link
            to="/smart-commute"
            className="flex items-center gap-2 text-xl font-bold text-gray-800 hover:text-green-600 transition-colors"
          >
            <span className="text-2xl">🚀</span>
            <span>Smart Commute</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-2">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-1 px-4 py-2 rounded-lg transition-all ${
                  isActive(item.path)
                    ? 'bg-green-500 text-white shadow-lg'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <span className="text-lg">{item.icon}</span>
                <span className="font-medium">{item.label}</span>
              </Link>
            ))}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 rounded-lg hover:bg-gray-100"
            onClick={() => {
              const menu = document.getElementById('mobile-menu');
              menu.classList.toggle('hidden');
            }}
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
        </div>

        {/* Mobile Navigation */}
        <div id="mobile-menu" className="hidden md:hidden pb-4">
          <div className="flex flex-col gap-2">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-2 px-4 py-3 rounded-lg transition-all ${
                  isActive(item.path)
                    ? 'bg-green-500 text-white shadow-lg'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
                onClick={() => {
                  document.getElementById('mobile-menu').classList.add('hidden');
                }}
              >
                <span className="text-xl">{item.icon}</span>
                <span className="font-medium">{item.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default SmartCommuteNav;

/**
 * Optional: Add "Back to Dashboard" Button Component
 * 
 * Use this at the top of feature pages to provide quick navigation back
 */
export const BackToDashboard = () => {
  return (
    <Link
      to="/smart-commute"
      className="inline-flex items-center gap-2 text-gray-600 hover:text-green-600 transition-colors mb-4"
    >
      <svg
        className="w-5 h-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M10 19l-7-7m0 0l7-7m-7 7h18"
        />
      </svg>
      <span className="font-medium">Back to Dashboard</span>
    </Link>
  );
};

/**
 * Optional: Breadcrumb Component
 * 
 * Shows navigation path: Home > Smart Commute > Feature
 */
export const Breadcrumb = ({ currentPage }) => {
  return (
    <nav className="flex items-center gap-2 text-sm text-gray-600 mb-4">
      <Link to="/" className="hover:text-green-600">
        Home
      </Link>
      <span>/</span>
      <Link to="/smart-commute" className="hover:text-green-600">
        Smart Commute
      </Link>
      {currentPage && (
        <>
          <span>/</span>
          <span className="text-gray-800 font-medium">{currentPage}</span>
        </>
      )}
    </nav>
  );
};
