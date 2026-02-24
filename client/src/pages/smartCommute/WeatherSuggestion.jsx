import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { weatherAPI } from '../../api/smartCommute';
import { useAuth } from '../../context/AuthContext';
import LocationAutocomplete from '../../components/LocationAutocomplete';
import CommuteMap from '../../components/CommuteMap';

const WeatherSuggestion = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [currentWeather, setCurrentWeather] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [formData, setFormData] = useState({
    origin: '',
    destination: '',
  });

  const [startCoords, setStartCoords] = useState(null);
  const [endCoords, setEndCoords] = useState(null);

  const handleCoordSelect = (fieldName, lat, lon) => {
    if (fieldName === 'origin') setStartCoords([lat, lon]);
    else if (fieldName === 'destination') setEndCoords([lat, lon]);
  };

  // Fetch user's suggestions
  useEffect(() => {
    if (user?._id || user?.id) {
      fetchSuggestions();
    }
  }, [user]);

  const fetchSuggestions = async () => {
    try {
      const userId = user._id || user.id;
      const response = await weatherAPI.getSuggestions(userId, { limit: 10 });
      setSuggestions(response.data.suggestions || []);
    } catch (error) {
      console.error('Error fetching suggestions:', error);
    }
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleGetSuggestion = async (e) => {
    e.preventDefault();
    
    // Check if user is logged in
    const userId = user?._id || user?.id;
    if (!user || !userId) {
      alert('Please log in to use this feature');
      return;
    }

    // Validate form data
    if (!formData.origin || !formData.destination) {
      alert('Please enter both origin and destination locations');
      return;
    }

    setLoading(true);
    try {
      console.log('Sending data:', {
        userId: user._id,
        origin: formData.origin,
        destination: formData.destination,
      });

      const response = await weatherAPI.createSuggestion({
        userId: userId,
        origin: formData.origin,
        destination: formData.destination,
        originLat: startCoords ? startCoords[0] : undefined,
        originLon: startCoords ? startCoords[1] : undefined,
        destLat: endCoords ? endCoords[0] : undefined,
        destLon: endCoords ? endCoords[1] : undefined,
      });

      setCurrentWeather(response.data.weatherLog);
      fetchSuggestions(); // Refresh list
      setFormData({ origin: '', destination: '' });
      setStartCoords(null);
      setEndCoords(null);
    } catch (error) {
      console.error('Error details:', error.response?.data);
      alert(error.response?.data?.message || 'Failed to get weather suggestion');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickCheck = async () => {
    if (!formData.origin) {
      alert('Please enter an origin location');
      return;
    }

    setLoading(true);
    try {
      console.log('Fetching weather for:', formData.origin);
      const params = startCoords ? { lat: startCoords[0], lon: startCoords[1] } : {};
      const response = await weatherAPI.getCurrentWeather(formData.origin, params);
      setCurrentWeather(response.data);
    } catch (error) {
      console.error('Weather fetch error:', error.response?.data);
      alert(error.response?.data?.message || 'Failed to fetch weather data. Please check your OpenWeather API key.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this suggestion?')) {
      try {
        await weatherAPI.deleteSuggestion(id);
        fetchSuggestions();
      } catch (error) {
        alert('Failed to delete suggestion');
      }
    }
  };

  const getWeatherIcon = (condition) => {
    const icons = {
      Clear: '☀️',
      Rain: '🌧️',
      Clouds: '☁️',
      Snow: '❄️',
      Drizzle: '🌦️',
      Thunderstorm: '⛈️',
      Mist: '🌫️',
      Fog: '🌫️',
    };
    return icons[condition] || '🌤️';
  };

  const getTransportIcon = (mode) => {
    const icons = {
      Bus: '🚌',
      Cycling: '🚴',
      Walking: '🚶',
      'Tuk-Tuk': '🛺',
      Carpool: '🚗',
      Car: '🚗',
      Train: '🚂',
      Metro: '🚇',
    };
    return icons[mode] || '🚗';
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            ☁️ Weather-Based Transport Suggestion
          </h1>
          <p className="text-gray-600 mb-4">
            Get eco-friendly transport recommendations based on current weather conditions
          </p>
          
          {/* Login Status Banner */}
          {!user ? (
            <div className="bg-red-50 border-2 border-red-300 rounded-lg p-4 flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <span className="text-3xl">⚠️</span>
                <div>
                  <p className="text-red-900 font-bold text-lg">Not Logged In</p>
                  <p className="text-red-700 text-sm">
                    You can use Quick Check for weather info, but you need to log in to save suggestions.
                  </p>
                </div>
              </div>
              <button
                onClick={() => navigate('/login')}
                className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-semibold transition-colors shadow-md"
              >
                Login Now
              </button>
            </div>
          ) : (
            <div className="bg-green-50 border border-green-300 rounded-lg p-3 flex items-center gap-3 mb-4">
              <span className="text-2xl">✅</span>
              <p className="text-green-900 font-medium">
                Logged in as <span className="font-bold">{user.name}</span>
              </p>
            </div>
          )}
          
          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
            <span className="text-2xl">💡</span>
            <div className="flex-1 text-sm">
              <p className="text-blue-900 font-medium mb-1">Live Location Search Enabled</p>
              <p className="text-blue-700">
                Start typing in the location fields to see real-time suggestions from OpenStreetMap. 
                Select from the dropdown to auto-fill accurate location names with coordinates.
              </p>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Form */}
          <div className="space-y-6">            {/* Map */}
            <div className="bg-white rounded-lg shadow-md p-4">
              <p className="text-sm text-gray-500 mb-2">📍 Select locations below to see them on the map</p>
              <CommuteMap
                startCoords={startCoords}
                endCoords={endCoords}
                startLabel={formData.origin}
                endLabel={formData.destination}
              />
            </div>
            {/* Get Suggestion Form */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                Get Weather Suggestion
              </h2>

              <form onSubmit={handleGetSuggestion} className="space-y-4">
                <LocationAutocomplete
                  name="origin"
                  value={formData.origin}
                  onChange={handleInputChange}
                  onCoordSelect={handleCoordSelect}
                  label="Origin Location"
                  placeholder="Start typing your origin location..."
                  apiEndpoint="/smart-commute/weather-suggestion/autocomplete"
                  required
                />

                <LocationAutocomplete
                  name="destination"
                  value={formData.destination}
                  onChange={handleInputChange}
                  onCoordSelect={handleCoordSelect}
                  label="Destination Location"
                  placeholder="Start typing your destination..."
                  apiEndpoint="/smart-commute/weather-suggestion/autocomplete"
                  required
                />

                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={loading || !user}
                    className={`flex-1 py-2 px-4 rounded-lg transition-colors font-medium ${
                      !user
                        ? 'bg-gray-400 text-gray-700 cursor-not-allowed'
                        : loading
                        ? 'bg-gray-400 text-white'
                        : 'bg-green-600 text-white hover:bg-green-700'
                    }`}
                    title={!user ? 'Login required to save suggestions' : ''}
                  >
                    {loading ? 'Loading...' : !user ? '🔒 Login to Save' : 'Get Suggestion & Save'}
                  </button>

                  <button
                    type="button"
                    onClick={handleQuickCheck}
                    disabled={loading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
                  >
                    Quick Check
                  </button>
                </div>
              </form>
            </div>

            {/* Current Weather Display */}
            {currentWeather && (
              <div className="bg-linear-to-br from-blue-500 to-blue-700 rounded-lg shadow-lg p-6 text-white">
                <h3 className="text-xl font-semibold mb-4">Current Suggestion</h3>

                {/* Weather + Temp row */}
                <div className="flex items-center justify-between mb-4">
                  <div className="text-5xl">
                    {getWeatherIcon(currentWeather.weatherCondition)}
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold">
                      {currentWeather.temperature?.toFixed(1)}°C
                    </div>
                    <div className="text-blue-100">
                      {currentWeather.weatherCondition}
                    </div>
                  </div>
                </div>

                {/* Recommended transport */}
                <div className="bg-white bg-opacity-20 rounded-lg p-4 mb-3">
                  <div className="text-sm text-blue-100 mb-1">Recommended Transport</div>
                  <div className="text-2xl font-semibold flex items-center gap-2">
                    {getTransportIcon(currentWeather.suggestedTransport)}
                    {currentWeather.suggestedTransport}
                  </div>
                  {/* Show secondary weather-only suggestion when distance overrides */}
                  {currentWeather.adjustmentReason === 'distance-adjusted' && currentWeather.weatherTransport && currentWeather.weatherTransport !== currentWeather.suggestedTransport && (
                    <div className="text-xs text-blue-200 mt-1">
                      Weather-only suggestion: {getTransportIcon(currentWeather.weatherTransport)} {currentWeather.weatherTransport}
                    </div>
                  )}
                </div>

                {/* Distance + adjustment badges */}
                <div className="flex flex-wrap gap-2 mb-3">
                  {currentWeather.distanceKm != null && (
                    <span className="bg-white bg-opacity-25 text-white text-sm px-3 py-1 rounded-full font-medium">
                      📏 {Number(currentWeather.distanceKm).toFixed(1)} km
                    </span>
                  )}
                  {currentWeather.adjustmentReason === 'distance-adjusted' && (
                    <span className="bg-green-400 bg-opacity-80 text-white text-xs px-3 py-1 rounded-full font-semibold">
                      ✅ Distance Adjusted
                    </span>
                  )}
                  {currentWeather.adjustmentReason === 'weather-priority' && (
                    <span className="bg-orange-400 bg-opacity-90 text-white text-xs px-3 py-1 rounded-full font-semibold">
                      ⚠️ Weather Priority
                    </span>
                  )}
                </div>

                {/* Distance legend */}
                <div className="grid grid-cols-4 gap-1 mb-3 text-center">
                  {[{label:'0–2 km',icon:'🚶',name:'Walk'},{label:'2–5 km',icon:'🚴',name:'Cycle'},{label:'5–10 km',icon:'🛺',name:'Tuk-Tuk'},{label:'10+ km',icon:'🚌',name:'Bus'}].map(item => (
                    <div key={item.name} className="bg-white bg-opacity-15 rounded p-1">
                      <div className="text-lg">{item.icon}</div>
                      <div className="text-xs text-blue-100">{item.label}</div>
                    </div>
                  ))}
                </div>

                {currentWeather.humidity && (
                  <div className="text-sm text-blue-100">
                    Humidity: {currentWeather.humidity}%
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Column - History */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Recent Suggestions
            </h2>

            <div className="space-y-3 max-h-150 overflow-y-auto">
              {!user ? (
                <div className="text-center text-gray-500 py-8">
                  <p className="text-lg mb-2">🔒 Login Required</p>
                  <p className="text-sm">Log in to view your suggestion history</p>
                  <button
                    onClick={() => navigate('/login')}
                    className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    Go to Login
                  </button>
                </div>
              ) : suggestions.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  <p>No suggestions yet</p>
                  <p className="text-sm mt-2">Create your first weather-based suggestion</p>
                </div>
              ) : (
                suggestions.map((suggestion) => (
                  <div
                    key={suggestion._id}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-2xl">
                            {getWeatherIcon(suggestion.weatherCondition)}
                          </span>
                          <span className="font-medium text-gray-800">
                            {suggestion.weatherCondition}
                          </span>
                        </div>

                        <div className="text-sm text-gray-600 mb-2">
                          <span className="font-medium">From:</span> {suggestion.origin}
                          <br />
                          <span className="font-medium">To:</span> {suggestion.destination}
                        </div>

                        <div className="flex items-center gap-2 text-green-700 font-medium">
                          {getTransportIcon(suggestion.suggestedTransport)}
                          {suggestion.suggestedTransport}
                        </div>

                        {/* Distance + reason badges */}
                        <div className="flex flex-wrap gap-1 mt-1">
                          {suggestion.distance != null && (
                            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                              📏 {Number(suggestion.distance).toFixed(1)} km
                            </span>
                          )}
                          {suggestion.adjustmentReason === 'distance-adjusted' && (
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                              ✅ Distance Adjusted
                            </span>
                          )}
                          {suggestion.adjustmentReason === 'weather-priority' && (
                            <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">
                              ⚠️ Weather Priority
                            </span>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={() => handleDelete(suggestion._id)}
                        className="text-red-500 hover:text-red-700 transition-colors"
                      >
                        🗑️
                      </button>
                    </div>

                    <div className="text-xs text-gray-400 mt-2">
                      {new Date(suggestion.createdAt).toLocaleString()}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Info Section */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-semibold text-blue-900 mb-3">
            💡 How It Works
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800">
            <div>
              <p className="font-semibold mb-1">☁️ Weather Rules</p>
              <p>• <strong>Bad weather</strong> (Rain/Storm/Fog): weather always wins — we suggest Bus or safe transit</p>
              <p>• <strong>Good weather</strong> (Clear/Clouds): distance takes priority for best mode</p>
            </div>
            <div>
              <p className="font-semibold mb-1">📏 Distance Rules (good weather)</p>
              <p>• 0–2 km → 🚶 Walking</p>
              <p>• 2–5 km → 🚴 Cycling</p>
              <p>• 5–10 km → 🛺 Tuk-Tuk</p>
              <p>• 10+ km → 🚌 Bus</p>
            </div>
          </div>
          <p className="text-xs text-blue-600 mt-3">💡 <strong>Quick Check</strong> gives instant weather without saving to history. Select both origin and destination for distance-aware suggestions.</p>
        </div>
      </div>
    </div>
  );
};

export default WeatherSuggestion;
