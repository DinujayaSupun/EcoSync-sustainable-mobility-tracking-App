/**
 * ============================================
 * SMART COMMUTE MODULE - INTEGRATION EXAMPLE
 * ============================================
 * 
 * This file demonstrates how to integrate the Smart Commute module
 * into your existing React application.
 */

// ============================================
// 1. MAIN APP.JSX INTEGRATION
// ============================================

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';

// Import Smart Commute Routes
import SmartCommuteRoutes from './pages/smartCommute/routes';

// Your existing pages
import Home from './pages/Home';
import Login from './pages/login';
import AdminDashboard from './pages/AdminDashboard';
import CommuteLogger from './pages/CommuteLogger';
import CommuteHistory from './pages/CommuteHistory';
import UserManagement from './pages/UserManagement';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Routes>
            {/* Existing routes */}
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/commute-logger" element={<CommuteLogger />} />
            <Route path="/commute-history" element={<CommuteHistory />} />
            <Route path="/user-management" element={<UserManagement />} />

            {/* Smart Commute Module - ALL ROUTES */}
            <Route path="/smart-commute/*" element={<SmartCommuteRoutes />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

// ============================================
// 2. AXIOS CONFIGURATION
// ============================================

// File: client/src/api/axios.js

import axios from 'axios';

const instance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Request interceptor - Add auth token
instance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle errors
instance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized - redirect to login
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ============================================
// 3. AUTH CONTEXT (if you don't have one)
// ============================================

// File: client/src/context/AuthContext.jsx

import { createContext, useContext, useState, useEffect } from 'react';
import axios from '../api/axios';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in on mount
    const token = localStorage.getItem('token');
    if (token) {
      fetchUser();
    } else {
      setLoading(false);
    }
  }, []);

  const fetchUser = async () => {
    try {
      const response = await axios.get('/auth/me');
      setUser(response.data.user);
    } catch (error) {
      console.error('Failed to fetch user:', error);
      localStorage.removeItem('token');
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    const response = await axios.post('/auth/login', { email, password });
    localStorage.setItem('token', response.data.token);
    setUser(response.data.user);
    return response.data;
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  const value = {
    user,
    login,
    logout,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// ============================================
// 4. ENVIRONMENT VARIABLES
// ============================================

// File: client/.env

/*
# API Configuration
VITE_API_URL=http://localhost:5000/api

# External API Keys (backend also needs these)
VITE_OPENWEATHER_API_KEY=your_openweather_api_key_here
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
*/

// ============================================
// 5. NAVIGATION MENU INTEGRATION
// ============================================

// Add Smart Commute to your main navigation menu

const MainNavigation = () => {
  return (
    <nav className="bg-gray-800 text-white">
      <ul className="flex gap-4 p-4">
        <li><Link to="/">Home</Link></li>
        <li><Link to="/admin">Admin Dashboard</Link></li>
        <li><Link to="/commute-logger">Commute Logger</Link></li>
        <li><Link to="/commute-history">History</Link></li>
        
        {/* Add Smart Commute Link */}
        <li>
          <Link to="/smart-commute" className="flex items-center gap-2">
            <span>🚀</span>
            <span>Smart Commute</span>
          </Link>
        </li>
      </ul>
    </nav>
  );
};

// ============================================
// 6. HOME PAGE INTEGRATION
// ============================================

// Add Smart Commute card to your home page

const HomePage = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
      {/* Existing feature cards */}
      
      {/* Smart Commute Feature Card */}
      <Link
        to="/smart-commute"
        className="bg-gradient-to-br from-green-500 to-green-700 text-white rounded-xl p-6 hover:shadow-2xl transition-all"
      >
        <div className="text-5xl mb-4">🚀</div>
        <h2 className="text-2xl font-bold mb-2">Smart Commute</h2>
        <p className="mb-4">
          AI-powered transport recommendations, route analysis, and carbon tracking
        </p>
        <div className="text-sm">
          <div>✓ Weather-based suggestions</div>
          <div>✓ Route comparison</div>
          <div>✓ AI predictions</div>
          <div>✓ Heat map visualization</div>
          <div>✓ Parking impact calculator</div>
        </div>
      </Link>
    </div>
  );
};

// ============================================
// 7. OPTIONAL: WITH NAVIGATION COMPONENT
// ============================================

// If you want to add navigation to each page:

import SmartCommuteNav from './pages/smartCommute/Navigation';

const WeatherSuggestionPageWithNav = () => {
  return (
    <div>
      <SmartCommuteNav />
      {/* Rest of WeatherSuggestion component */}
    </div>
  );
};

// ============================================
// 8. BACKEND SERVER CONFIGURATION
// ============================================

// File: server/app.js or server/index.js

/*
const express = require('express');
const cors = require('cors');
const smartCommuteRoutes = require('./routes/smartCommute.routes');

const app = express();

// Middleware
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());

// Routes
app.use('/api/smart-commute', smartCommuteRoutes);

// Start server
app.listen(5000, () => {
  console.log('Server running on port 5000');
});
*/

// ============================================
// 9. DEPLOYMENT CHECKLIST
// ============================================

/*
FRONTEND:
✅ Install dependencies: npm install
✅ Configure .env file with API URL and keys
✅ Update axios baseURL for production
✅ Add Smart Commute routes to App.jsx
✅ Test all 5 features locally
✅ Build for production: npm run build

BACKEND:
✅ Install Smart Commute dependencies
✅ Configure .env with OpenWeather and Google Maps API keys
✅ Run MongoDB
✅ Test all API endpoints
✅ Enable CORS for frontend domain
✅ Deploy to production server

TESTING:
✅ Test health endpoint: GET /api/smart-commute/health
✅ Test authentication flow
✅ Test all CRUD operations
✅ Test external API integrations
✅ Test responsive design on mobile
*/

// ============================================
// 10. QUICK START COMMANDS
// ============================================

/*
# Frontend Setup
cd client
npm install
npm run dev

# Backend Setup  
cd server
npm install
npm start

# Access Application
Frontend: http://localhost:5173
Backend: http://localhost:5000
Smart Commute: http://localhost:5173/smart-commute
*/

// ============================================
// 11. TROUBLESHOOTING
// ============================================

/*
ISSUE: Routes not working
SOLUTION: Ensure BrowserRouter wraps App component in main.jsx

ISSUE: API calls fail
SOLUTION: Check axios baseURL matches backend URL

ISSUE: Authentication errors
SOLUTION: Verify token is saved in localStorage after login

ISSUE: CORS errors
SOLUTION: Configure CORS in backend to allow frontend origin

ISSUE: useAuth hook not found
SOLUTION: Ensure AuthProvider wraps App component
*/

// ============================================
// 12. PERFORMANCE OPTIMIZATION
// ============================================

// Use lazy loading for Smart Commute routes
import { lazy, Suspense } from 'react';

const SmartCommuteRoutes = lazy(() => import('./pages/smartCommute/routes'));

function App() {
  return (
    <Suspense fallback={<div>Loading Smart Commute...</div>}>
      <Routes>
        <Route path="/smart-commute/*" element={<SmartCommuteRoutes />} />
      </Routes>
    </Suspense>
  );
}

// ============================================
// READY TO USE!
// ============================================

// Your Smart Commute module is now fully integrated!
// Access it at: http://localhost:5173/smart-commute
