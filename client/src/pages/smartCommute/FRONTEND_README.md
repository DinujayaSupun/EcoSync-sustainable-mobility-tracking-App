# Smart Commute & Logistics - Frontend Documentation

## 📋 Overview

Complete React frontend for the **Smart Commute & Logistics** module of the University Carbon Tracking System. This frontend provides intuitive interfaces for all 5 backend features with real-time data visualization, AI predictions, and comprehensive tracking capabilities.

---

## 📦 Components Structure

```
client/src/
├── api/
│   ├── axios.js                    # Axios instance with auth configuration
│   └── smartCommute.js             # API integration layer (36 endpoints)
└── pages/smartCommute/
    ├── Dashboard.jsx               # Main dashboard & navigation
    ├── WeatherSuggestion.jsx       # Weather-based transport suggestions
    ├── RouteAnalysis.jsx           # Route comparison & traffic analysis
    ├── TransportHistory.jsx        # Transport logging & AI predictions
    ├── HeatMap.jsx                 # Carbon emission visualization
    ├── ParkingImpact.jsx           # Campus parking impact calculator
    ├── routes.jsx                  # Route configuration
    └── FRONTEND_README.md          # This file
```

---

## 🚀 Quick Start

### 1. Prerequisites

Ensure you have these installed:
- Node.js (v16 or higher)
- npm or yarn
- Backend server running on `http://localhost:5000`

### 2. Install Dependencies

```bash
cd client
npm install
```

Required packages:
- `react` (v18+)
- `react-router-dom` (v6+)
- `axios`
- `tailwindcss` (configured)

### 3. Environment Configuration

Create `.env` file in `client/` directory:

```env
# API Configuration
VITE_API_URL=http://localhost:5000/api

# External API Keys (Optional - backend also needs these)
VITE_OPENWEATHER_API_KEY=your_openweather_api_key
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
```

### 4. Configure Axios Base URL

Update `client/src/api/axios.js`:

```javascript
import axios from 'axios';

const instance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  withCredentials: true
});

// Add auth token interceptor
instance.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default instance;
```

### 5. Add Routes to App.jsx

```javascript
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import SmartCommuteRoutes from './pages/smartCommute/routes';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/smart-commute/*" element={<SmartCommuteRoutes />} />
        {/* Other routes */}
      </Routes>
    </Router>
  );
}

export default App;
```

### 6. Start Development Server

```bash
npm run dev
```

Access at: `http://localhost:5173/smart-commute`

---

## 📱 Features & Pages

### 1. Dashboard (`/smart-commute`)

**Purpose**: Main entry point with overview of all features

**Key Components**:
- 5 feature cards with navigation
- Module statistics (5 features, 36 endpoints)
- Benefits overview
- API integration info
- Health status indicator

**Features**:
- Click any feature card to navigate
- Real-time health check
- Comprehensive feature descriptions

---

### 2. Weather-Based Suggestions (`/smart-commute/weather`)

**Purpose**: Get eco-friendly transport recommendations based on weather

**API Endpoints Used**:
- `POST /weather-suggestion` - Create suggestion
- `GET /weather-suggestion/:userId` - Get user history
- `GET /weather-suggestion/current/:location` - Current weather
- `DELETE /weather-suggestion/:id` - Delete suggestion

**Features**:
- Origin/destination input
- Real-time weather data (temperature, humidity, conditions)
- Smart transport suggestions based on weather
- Suggestion history with timestamp
- Delete individual suggestions

**Key Components**:
- Current weather display card
- Origin/destination form
- Suggestion history list
- Weather condition badges

---

### 3. Route Analysis (`/smart-commute/routes`)

**Purpose**: Compare routes with traffic data and environmental impact

**API Endpoints Used**:
- `POST /route-analysis` - Create analysis
- `GET /route-analysis/:userId` - Get user analyses
- `GET /route-analysis/compare` - Compare routes
- `DELETE /route-analysis/:id` - Delete analysis

**Features**:
- Compare 3 routes: Fastest, Greenest, Cheapest
- Real-time traffic levels (low/moderate/high/severe)
- Distance, duration, and cost calculations
- CO₂ emissions for each route
- Route history tracking

**Key Components**:
- Route comparison cards (3 columns)
- Traffic level badges
- Price comparison
- Environmental impact indicators

---

### 4. Transport History (`/smart-commute/transport`)

**Purpose**: Log transport usage and get AI-powered predictions

**API Endpoints Used**:
- `POST /transport-history` - Log trip
- `GET /transport-history/:userId` - Get user history
- `POST /transport-history/predict` - Get AI prediction
- `GET /transport-history/stats/:userId` - Get statistics

**Features**:
- Transport mode logging (20+ modes)
- AI-powered next trip prediction
- Confidence percentages for predictions
- Green trip tracking
- Mode distribution visualization
- Total distance & CO₂ statistics

**Transport Modes Supported**:
- Walking, Cycling, E-Bike, E-Scooter
- Bus, Metro, Tram, Train
- Car (Petrol/Diesel/Electric/Hybrid)
- Motorcycle, Taxi, Ride-Share
- And more...

**Key Components**:
- Trip logging form
- AI prediction card with confidence bars
- Trip history table
- Mode distribution chart
- Statistics dashboard

---

### 5. Carbon Heat Map (`/smart-commute/heatmap`)

**Purpose**: Visualize carbon emissions by location

**API Endpoints Used**:
- `POST /heatmap` - Add data point
- `GET /heatmap/zones` - Get emission zones
- `GET /heatmap/aggregate` - Get aggregated data
- `DELETE /heatmap/:id` - Delete point

**Features**:
- Add emission data points (coordinates + value)
- Identify high emission zones (≥100 CO₂)
- Identify high green zones (≤10 CO₂)
- Color-coded markers (red/yellow/green)
- Location clustering

**Key Components**:
- Data entry form (latitude, longitude, emission)
- High emission zones list
- High green zones list
- Color legend
- Point count statistics

---

### 6. Parking Impact Calculator (`/smart-commute/parking`)

**Purpose**: Calculate CO₂ savings from reduced parking usage

**API Endpoints Used**:
- `POST /parking-impact` - Log parking data
- `GET /parking-impact/:campus` - Get campus data
- `GET /parking-impact/compare` - Compare campuses
- `POST /parking-impact/projection` - Calculate projections

**Features**:
- Campus selection (Main/North/South/Engineering/Medical)
- Parking reduction tracking
- CO₂ savings calculations
- Future projections (daily/weekly/monthly/yearly)
- Cross-campus comparison with rankings
- Average calculations

**Projection Calculations**:
- Daily: currentValue × 1
- Weekly: currentValue × 7
- Monthly: currentValue × 30
- Yearly: currentValue × 365

**Key Components**:
- Campus selector dropdown
- 4 statistics cards
- Data logging form (sticky column)
- Projection calculator
- Campus comparison table with rankings 🥇🥈🥉
- Reduction strategy info

---

## 🎨 Design System

### Color Palette

```css
/* Feature-specific gradients */
Weather:   from-blue-500 to-blue-700
Route:     from-purple-500 to-purple-700
Transport: from-indigo-500 to-indigo-700
HeatMap:   from-red-500 to-red-700
Parking:   from-green-500 to-green-700

/* Traffic levels */
Low:       bg-green-100 text-green-800
Moderate:  bg-yellow-100 text-yellow-800
High:      bg-orange-100 text-orange-800
Severe:    bg-red-100 text-red-800

/* Emission levels */
Low (<50):    bg-green-500
Medium (<100): bg-yellow-500
High (≥100):  bg-red-500
```

### Layout Patterns

**Grid Layout**: Used for feature cards, comparisons
```jsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
```

**Sticky Sidebar**: Used in parking impact page
```jsx
<div className="lg:col-span-1 lg:sticky lg:top-6 lg:self-start">
```

**Stats Cards**: Consistent design across all pages
```jsx
<div className="bg-gradient-to-br from-blue-500 to-blue-700 text-white rounded-lg p-6">
```

---

## 🔌 API Integration

### API Service Layer (`smartCommute.js`)

The API layer provides organized methods for all features:

```javascript
import { weatherAPI, routeAPI, transportAPI, heatmapAPI, parkingAPI } from '../api/smartCommute';

// Example usage
const handleCreateSuggestion = async (data) => {
  try {
    const result = await weatherAPI.createSuggestion(data);
    console.log('Success:', result);
  } catch (error) {
    console.error('Error:', error);
  }
};
```

### API Methods Available

**weatherAPI**: 5 methods (create, get, getCurrent, update, delete)  
**routeAPI**: 7 methods (create, get, getById, compare, update, delete, stats)  
**transportAPI**: 7 methods (create, get, getById, predict, delete, stats, getGreenTrips)  
**heatmapAPI**: 6 methods (create, get, getZones, aggregate, update, delete)  
**parkingAPI**: 7 methods (create, get, getByDate, compare, project, update, delete)

### Error Handling

All API calls include try-catch blocks:

```javascript
try {
  const response = await weatherAPI.createSuggestion(formData);
  // Handle success
} catch (error) {
  console.error('Error:', error);
  alert('Failed to create suggestion');
}
```

---

## 📊 State Management

All pages use React hooks for state management:

```javascript
import { useState, useEffect } from 'react';

// State examples
const [formData, setFormData] = useState({ /* initial values */ });
const [suggestions, setSuggestions] = useState([]);
const [currentWeather, setCurrentWeather] = useState(null);
const [loading, setLoading] = useState(false);
```

### Common State Patterns

**Form Data**: Object state for form inputs
**Lists**: Array state for fetched data
**Loading**: Boolean for loading indicators
**Selected Items**: String/object for active selections

---

## 🔐 Authentication

Components use `useAuth` hook from `AuthContext`:

```javascript
import { useAuth } from '../../context/AuthContext';

const MyComponent = () => {
  const { user } = useAuth();
  const userId = user?._id || user?.id;
  
  // Use userId in API calls
};
```

### Required Auth Context Structure

```javascript
// Client/src/context/AuthContext.jsx
const AuthContext = createContext({
  user: null,  // User object with _id or id
  login: () => {},
  logout: () => {}
});
```

---

## 🧪 Testing

### Manual Testing Checklist

**Dashboard**:
- [ ] All feature cards display correctly
- [ ] Navigation works for each feature
- [ ] Health check indicator shows status

**Weather Suggestions**:
- [ ] Form submission creates suggestion
- [ ] Current weather displays correctly
- [ ] Suggestion history loads
- [ ] Delete functionality works

**Route Analysis**:
- [ ] Route comparison returns 3 routes
- [ ] Traffic levels display correctly
- [ ] CO₂ calculations accurate
- [ ] Analysis history loads

**Transport History**:
- [ ] Trip logging saves data
- [ ] AI prediction displays with confidence
- [ ] Statistics calculate correctly
- [ ] Mode distribution shows

**Heat Map**:
- [ ] Data points save correctly
- [ ] High emission zones identified
- [ ] High green zones identified
- [ ] Color coding accurate

**Parking Impact**:
- [ ] Campus selection works
- [ ] Data logging saves
- [ ] Projections calculate correctly
- [ ] Campus comparison displays rankings

---

## 🐛 Common Issues & Solutions

### Issue 1: API Requests Failing

**Solution**: Check axios baseURL configuration
```javascript
// Verify in axios.js
baseURL: 'http://localhost:5000/api'
```

### Issue 2: Authentication Errors

**Solution**: Ensure token is in localStorage
```javascript
localStorage.setItem('token', 'your_jwt_token');
```

### Issue 3: CORS Errors

**Solution**: Configure CORS in backend
```javascript
// server/app.js
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));
```

### Issue 4: useAuth Hook Not Found

**Solution**: Ensure AuthContext is provided
```javascript
// main.jsx or App.jsx
<AuthProvider>
  <App />
</AuthProvider>
```

### Issue 5: Routes Not Working

**Solution**: Check BrowserRouter setup
```javascript
// main.jsx
import { BrowserRouter } from 'react-router-dom';

<BrowserRouter>
  <App />
</BrowserRouter>
```

---

## 📈 Performance Optimization

### Best Practices Implemented

1. **Lazy Loading**: Use React.lazy for route components
2. **Memoization**: Use useMemo for expensive calculations
3. **Debouncing**: Debounce form inputs for API calls
4. **Pagination**: Implement for large data lists
5. **Caching**: Cache API responses where appropriate

### Example: Lazy Loading Routes

```javascript
import { lazy, Suspense } from 'react';

const Dashboard = lazy(() => import('./Dashboard'));
const WeatherSuggestion = lazy(() => import('./WeatherSuggestion'));

<Suspense fallback={<div>Loading...</div>}>
  <Routes>
    <Route path="/" element={<Dashboard />} />
    <Route path="/weather" element={<WeatherSuggestion />} />
  </Routes>
</Suspense>
```

---

## 🎯 Future Enhancements

### Planned Features

1. **Real-time Updates**: WebSocket integration for live data
2. **Map Integration**: Google Maps visualization for routes/heatmap
3. **Advanced Analytics**: Detailed charts and graphs
4. **Export Functionality**: CSV/PDF export for reports
5. **Mobile Optimization**: Responsive design improvements
6. **Offline Mode**: Service worker for offline access
7. **Notifications**: Push notifications for suggestions
8. **Dark Mode**: Theme switching capability

### Suggested Improvements

1. Add loading skeletons for better UX
2. Implement form validation libraries (Formik, Yup)
3. Add animation libraries (Framer Motion)
4. Integrate chart libraries (Chart.js, Recharts)
5. Add notification toasts (React-Toastify)
6. Implement date pickers (react-datepicker)

---

## 📚 Additional Resources

### Documentation Links

- [React Router v6 Docs](https://reactrouter.com/)
- [Axios Documentation](https://axios-http.com/)
- [Tailwind CSS Docs](https://tailwindcss.com/)
- [React Hooks Guide](https://react.dev/reference/react)

### Backend Documentation

- See `server/SMART_COMMUTE_README.md` for API documentation
- See `server/MODULE_SUMMARY.md` for endpoint reference
- See `server/INTEGRATION_GUIDE.js` for integration examples

---

## 🤝 Contributing

### Code Style Guidelines

1. Use functional components with hooks
2. Follow camelCase for variables and functions
3. Use PascalCase for component names
4. Keep components under 300 lines
5. Extract reusable logic into custom hooks
6. Add comments for complex logic

### Component Template

```javascript
import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { featureAPI } from '../../api/smartCommute';

const MyComponent = () => {
  // Auth
  const { user } = useAuth();
  
  // State
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Effects
  useEffect(() => {
    fetchData();
  }, []);
  
  // Handlers
  const fetchData = async () => {
    setLoading(true);
    try {
      const result = await featureAPI.getData();
      setData(result.data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Render
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Component JSX */}
    </div>
  );
};

export default MyComponent;
```

---

## 📞 Support

For issues or questions:
- Check backend API health: `GET /api/smart-commute/health`
- Review browser console for errors
- Verify network requests in DevTools
- Check backend logs for API errors

---

## 📄 License

Part of the University Carbon Tracking System  
Smart Commute & Logistics Module v1.0.0

---

**Last Updated**: 2024  
**Maintained By**: Development Team  
**Status**: ✅ Production Ready
