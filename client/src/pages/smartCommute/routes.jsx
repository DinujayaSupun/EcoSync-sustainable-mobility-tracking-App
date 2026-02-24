import { Routes, Route } from 'react-router-dom';
import SmartCommuteDashboard from './Dashboard';
import WeatherSuggestion from './WeatherSuggestion';

/**
 * Smart Commute & Logistics Routes
 * 
 * This component defines all routes for the Smart Commute module.
 * Include these routes in your main App.jsx routing configuration.
 * 
 * Example usage in App.jsx:
 * 
 * import SmartCommuteRoutes from './pages/smartCommute/routes';
 * 
 * <Routes>
 *   <Route path="/smart-commute/*" element={<SmartCommuteRoutes />} />
 *   {/* Other routes *\/}
 * </Routes>
 */
const SmartCommuteRoutes = () => {
  return (
    <Routes>
      {/* Dashboard - Main entry point */}
      <Route index element={<SmartCommuteDashboard />} />
      <Route path="/" element={<SmartCommuteDashboard />} />
      
      {/* Feature Routes */}
      <Route path="/weather" element={<WeatherSuggestion />} />
    </Routes>
  );
};

export default SmartCommuteRoutes;

/**
 * Quick Setup Instructions:
 * ==========================
 * 
 * 1. Install required dependencies (if not already installed):
 *    npm install react-router-dom axios
 * 
 * 2. Add routes to your main App.jsx:
 * 
 *    import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
 *    import SmartCommuteRoutes from './pages/smartCommute/routes';
 * 
 *    function App() {
 *      return (
 *        <Router>
 *          <Routes>
 *            <Route path="/smart-commute/*" element={<SmartCommuteRoutes />} />
 *            {/* Other routes *\/}
 *          </Routes>
 *        </Router>
 *      );
 *    }
 * 
 * 3. Configure axios base URL in client/src/api/axios.js:
 *    const instance = axios.create({
 *      baseURL: 'http://localhost:5000/api/smart-commute'
 *    });
 * 
 * 4. Set environment variables in .env:
 *    VITE_API_URL=http://localhost:5000/api
 *    VITE_OPENWEATHER_API_KEY=your_key_here
 *    VITE_GOOGLE_MAPS_API_KEY=your_key_here
 * 
 * 5. Access the module at: http://localhost:5173/smart-commute
 * 
 * Route Structure:
 * ================
 * /smart-commute              → Dashboard (overview of all features)
 * /smart-commute/weather      → Weather-Based Suggestions
 * /smart-commute/routes       → Route Analysis & Traffic
 * /smart-commute/transport    → Transport History & Prediction
 * /smart-commute/heatmap      → Carbon Heat Map
 * /smart-commute/parking      → Parking Impact Calculator
 */
