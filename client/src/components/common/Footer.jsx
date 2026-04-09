import { useNavigate } from 'react-router-dom';

const Footer = () => {
  const navigate = useNavigate();

  const handleNavigation = (path) => {
    navigate(path);
    window.scrollTo(0, 0);
  };

  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-linear-to-b from-emerald-900 to-emerald-950 text-gray-100">
      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-4 py-12 sm:py-16">
        {/* Footer Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 lg:gap-12">
          
          {/* Brand Section */}
          <div className="col-span-1 md:col-span-1">
            <button
              onClick={() => handleNavigation('/home')}
              className="mb-4 flex items-center gap-3 rounded-xl transition hover:opacity-90"
              aria-label="Go to EcoSync home"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-linear-to-br from-emerald-400 to-green-500 shadow-lg">
                <span className="material-icons text-white" style={{fontSize: '20px'}}>eco</span>
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">EcoSync</h2>
                <p className="text-xs text-emerald-200">Smarter Commuting</p>
              </div>
            </button>
            <p className="text-sm text-emerald-100 mb-4 leading-relaxed">
              Track your environmental impact and join a community of eco-conscious commuters making a difference.
            </p>
            <div className="flex gap-3">
              <a href="#" className="inline-flex items-center justify-center h-9 w-9 rounded-full bg-emerald-800 hover:bg-emerald-700 transition-all duration-300 hover:shadow-lg">
                <span className="material-icons text-sm">facebook</span>
              </a>
              <a href="#" className="inline-flex items-center justify-center h-9 w-9 rounded-full bg-emerald-800 hover:bg-emerald-700 transition-all duration-300 hover:shadow-lg">
                <span className="material-icons text-sm">language</span>
              </a>
              <a href="#" className="inline-flex items-center justify-center h-9 w-9 rounded-full bg-emerald-800 hover:bg-emerald-700 transition-all duration-300 hover:shadow-lg">
                <span className="material-icons text-sm">mail</span>
              </a>
              <a href="#" className="inline-flex items-center justify-center h-9 w-9 rounded-full bg-emerald-800 hover:bg-emerald-700 transition-all duration-300 hover:shadow-lg">
                <span className="material-icons text-sm">share</span>
              </a>
            </div>
          </div>

          {/* Main Features */}
          <div className="col-span-1">
            <h3 className="text-base font-bold text-white mb-5 flex items-center gap-2">
              <span className="material-icons text-emerald-400" style={{fontSize: '20px'}}>featured_play_list</span>
              Features
            </h3>
            <ul className="space-y-3">
              <li>
                <button 
                  onClick={() => handleNavigation('/home')}
                  className="text-sm text-emerald-100 hover:text-white hover:translate-x-1 transition-all duration-300 flex items-center gap-2 group"
                >
                  <span className="w-0 h-px bg-emerald-400 group-hover:w-3 transition-all duration-300"></span>
                  Dashboard
                </button>
              </li>
              <li>
                <button 
                  onClick={() => handleNavigation('/commute-logger')}
                  className="text-sm text-emerald-100 hover:text-white hover:translate-x-1 transition-all duration-300 flex items-center gap-2 group"
                >
                  <span className="w-0 h-px bg-emerald-400 group-hover:w-3 transition-all duration-300"></span>
                  Log Commute
                </button>
              </li>
              <li>
                <button 
                  onClick={() => handleNavigation('/commute-history')}
                  className="text-sm text-emerald-100 hover:text-white hover:translate-x-1 transition-all duration-300 flex items-center gap-2 group"
                >
                  <span className="w-0 h-px bg-emerald-400 group-hover:w-3 transition-all duration-300"></span>
                  Trip History
                </button>
              </li>
              <li>
                <button 
                  onClick={() => handleNavigation('/weather-suggestion')}
                  className="text-sm text-emerald-100 hover:text-white hover:translate-x-1 transition-all duration-300 flex items-center gap-2 group"
                >
                  <span className="w-0 h-px bg-emerald-400 group-hover:w-3 transition-all duration-300"></span>
                  Weather Insight
                </button>
              </li>
            </ul>
          </div>

          {/* Gamification */}
          <div className="col-span-1">
            <h3 className="text-base font-bold text-white mb-5 flex items-center gap-2">
              <span className="material-icons text-emerald-400" style={{fontSize: '20px'}}>emoji_events</span>
              Gamification
            </h3>
            <ul className="space-y-3">
              <li>
                <button 
                  onClick={() => handleNavigation('/badges')}
                  className="text-sm text-emerald-100 hover:text-white hover:translate-x-1 transition-all duration-300 flex items-center gap-2 group"
                >
                  <span className="w-0 h-px bg-emerald-400 group-hover:w-3 transition-all duration-300"></span>
                  Badges
                </button>
              </li>
              <li>
                <button 
                  onClick={() => handleNavigation('/leaderboard')}
                  className="text-sm text-emerald-100 hover:text-white hover:translate-x-1 transition-all duration-300 flex items-center gap-2 group"
                >
                  <span className="w-0 h-px bg-emerald-400 group-hover:w-3 transition-all duration-300"></span>
                  Leaderboard
                </button>
              </li>
              <li>
                <button 
                  onClick={() => handleNavigation('/challenges')}
                  className="text-sm text-emerald-100 hover:text-white hover:translate-x-1 transition-all duration-300 flex items-center gap-2 group"
                >
                  <span className="w-0 h-px bg-emerald-400 group-hover:w-3 transition-all duration-300"></span>
                  Challenges
                </button>
              </li>
              <li>
                <button 
                  onClick={() => handleNavigation('/reports')}
                  className="text-sm text-emerald-100 hover:text-white hover:translate-x-1 transition-all duration-300 flex items-center gap-2 group"
                >
                  <span className="w-0 h-px bg-emerald-400 group-hover:w-3 transition-all duration-300"></span>
                  Reports
                </button>
              </li>
            </ul>
          </div>

          {/* Quick Links & Info */}
          <div className="col-span-1">
            <h3 className="text-base font-bold text-white mb-5 flex items-center gap-2">
              <span className="material-icons text-emerald-400" style={{fontSize: '20px'}}>info</span>
              Resources
            </h3>
            <ul className="space-y-3">
              <li>
                <button
                  onClick={() => handleNavigation('/about-us')}
                  className="text-sm text-emerald-100 hover:text-white hover:translate-x-1 transition-all duration-300 flex items-center gap-2 group"
                >
                  <span className="w-0 h-px bg-emerald-400 group-hover:w-3 transition-all duration-300"></span>
                  About Us
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleNavigation('/privacy-policy')}
                  className="text-sm text-emerald-100 hover:text-white hover:translate-x-1 transition-all duration-300 flex items-center gap-2 group"
                >
                  <span className="w-0 h-px bg-emerald-400 group-hover:w-3 transition-all duration-300"></span>
                  Privacy Policy
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleNavigation('/terms-and-conditions')}
                  className="text-sm text-emerald-100 hover:text-white hover:translate-x-1 transition-all duration-300 flex items-center gap-2 group"
                >
                  <span className="w-0 h-px bg-emerald-400 group-hover:w-3 transition-all duration-300"></span>
                  Terms & Conditions
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleNavigation('/contact-support')}
                  className="text-sm text-emerald-100 hover:text-white hover:translate-x-1 transition-all duration-300 flex items-center gap-2 group"
                >
                  <span className="w-0 h-px bg-emerald-400 group-hover:w-3 transition-all duration-300"></span>
                  Contact Support
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Divider */}
        <div className="my-8 sm:my-10 border-t border-emerald-800"></div>

        {/* Bottom Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          {/* Left - Copyright */}
          <div className="text-center md:text-left">
            <p className="text-sm text-emerald-200">
              © {currentYear} EcoSync. All rights reserved.
            </p>
          </div>

          {/* Center - Stats */}
          <div className="hidden md:flex justify-center gap-6">
            <div className="text-center">
              <p className="text-xl font-bold text-emerald-300">5K+</p>
              <p className="text-xs text-emerald-200">Active Users</p>
            </div>
            <div className="text-center border-l border-r border-emerald-800 px-6">
              <p className="text-xl font-bold text-emerald-300">50T</p>
              <p className="text-xs text-emerald-200">CO₂ Saved</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-bold text-emerald-300">100+</p>
              <p className="text-xs text-emerald-200">Challenges</p>
            </div>
          </div>

          {/* Right - CTA Button */}
          <div className="text-center md:text-right">
            <button 
              onClick={() => handleNavigation('/home')}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-linear-to-r from-emerald-500 to-green-600 text-white font-semibold text-sm hover:shadow-lg hover:scale-105 transition-all duration-300"
            >
              <span className="material-icons" style={{fontSize: '16px'}}>arrow_forward</span>
              Get Started
            </button>
          </div>
        </div>
      </div>

      {/* Top Border Accent */}
      <div className="h-1 bg-linear-to-r from-emerald-500 via-green-500 to-emerald-500"></div>
    </footer>
  );
};

export default Footer;
