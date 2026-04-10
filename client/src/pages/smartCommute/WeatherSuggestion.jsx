import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { weatherAPI } from '../../api/smartCommute';
import { useAuth } from '../../context/AuthContext';
import LocationAutocomplete from '../../components/LocationAutocomplete';
import CommuteMap from '../../components/CommuteMap';
import Footer from '../../components/common/Footer';
import UserNavbar from '../../components/common/UserNavbar';

const WeatherSuggestion = () => {
  const { user, logout } = useAuth();
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
  const [liveCoords, setLiveCoords] = useState(null);
  const [useLiveStart, setUseLiveStart] = useState(false);
  const [liveLocating, setLiveLocating] = useState(false);

  const handleCoordSelect = (fieldName, lat, lon) => {
    if (fieldName === 'origin') {
      setUseLiveStart(false);
      setLiveCoords(null);
      setStartCoords([lat, lon]);
    }
    else if (fieldName === 'destination') setEndCoords([lat, lon]);
  };

  // Live GPS location — sets origin with reverse-geocoded address
  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    setLiveLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lon } = pos.coords;
        setLiveCoords([lat, lon]);
        setUseLiveStart(true);
        setFormData((prev) => ({ ...prev, origin: `${lat.toFixed(6)}, ${lon.toFixed(6)}` }));
        setLiveLocating(false);
      },
      (err) => {
        console.error('Geolocation error:', err);
        alert('Unable to retrieve your location. Please allow location access.');
        setLiveLocating(false);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  // Callback from LocateControl button inside the map
  const handleMapLocate = (lat, lon, name) => {
    setLiveCoords([lat, lon]);
    setUseLiveStart(true);
    setFormData((prev) => ({ ...prev, origin: `${lat.toFixed(6)}, ${lon.toFixed(6)}` }));
  };

  const effectiveStartCoords = useLiveStart && liveCoords ? liveCoords : startCoords;

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
    if (e.target.name === 'origin') {
      setUseLiveStart(false);
      setLiveCoords(null);
    }

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
        originLat: effectiveStartCoords ? effectiveStartCoords[0] : undefined,
        originLon: effectiveStartCoords ? effectiveStartCoords[1] : undefined,
        destLat: endCoords ? endCoords[0] : undefined,
        destLon: endCoords ? endCoords[1] : undefined,
      });

      setCurrentWeather(response.data.weatherLog);
      fetchSuggestions(); // Refresh list
      setFormData({ origin: '', destination: '' });
      setStartCoords(null);
      setEndCoords(null);
      setLiveCoords(null);
      setUseLiveStart(false);
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
      const params = effectiveStartCoords ? { lat: effectiveStartCoords[0], lon: effectiveStartCoords[1] } : {};
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
      Clear: 'wb_sunny',
      Rain: 'cloud_queue',
      Clouds: 'cloud',
      Snow: 'ac_unit',
      Drizzle: 'cloud_queue',
      Thunderstorm: 'cloud_alert',
      Mist: 'cloud_queue',
      Fog: 'cloud_queue',
    };
    return icons[condition] || 'cloud';
  };

  const getTransportIcon = (mode) => {
    const icons = {
      Bus: 'directions_bus',
      Cycling: 'directions_bike',
      Walking: 'directions_walk',
      'Tuk-Tuk': 'three_wheeler_auto',
      Carpool: 'directions_car',
      Car: 'directions_car',
      Train: 'train',
      Metro: 'direction_subway',
    };
    return icons[mode] || 'directions_car';
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <UserNavbar userName={user?.name} onLogout={handleLogout} />

      <main className="px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-7xl">
        <div className="overflow-hidden rounded-3xl border border-emerald-100 bg-white shadow-lg">
          <div className="bg-linear-to-r from-emerald-700 to-green-600 px-6 py-6 text-white sm:px-8">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-100">Overview</p>
            <h1 className="mt-1 text-3xl font-bold sm:text-4xl">
              <span className="material-icons" style={{fontSize: '34px', verticalAlign: 'middle', marginRight: '8px'}}>cloud</span>
              Weather-Based Transport Suggestion
            </h1>
            <p className="mt-2 text-sm text-emerald-100 sm:text-base">
              Get eco-friendly transport recommendations based on current weather conditions
            </p>
          </div>

          <div className="space-y-6 p-5 sm:p-7">
            {/* Login Status Banner */}
            {!user ? (
              <div className="mb-1 flex items-center justify-between rounded-xl border-2 border-red-300 bg-red-50 p-4">
                <div className="flex items-center gap-3">
                  <span className="material-icons text-red-700" style={{fontSize: '32px'}}>warning</span>
                  <div>
                    <p className="text-lg font-bold text-red-900">Not Logged In</p>
                    <p className="text-sm text-red-700">
                      You can use Quick Check for weather info, but you need to log in to save suggestions.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => navigate('/login')}
                  className="rounded-lg bg-red-600 px-6 py-2 font-semibold text-white shadow-md transition-colors hover:bg-red-700"
                >
                  Login Now
                </button>
              </div>
            ) : (
              <div className="mb-1 flex items-center gap-3 rounded-xl border border-green-300 bg-green-50 p-3.5">
                <span className="material-icons" style={{fontSize: '24px', color: 'green'}}>check_circle</span>
                <p className="font-medium text-green-900">
                  Logged in as <span className="font-bold">{user.name}</span>
                </p>
              </div>
            )}

            {/* Info Box */}
            <div className="flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4">
              <span className="material-icons" style={{fontSize: '24px', color: '#2563eb'}}>lightbulb</span>
              <div className="flex-1 text-sm">
                <p className="mb-1 font-medium text-blue-900">Live Location Search Enabled</p>
                <p className="text-blue-700">
                  Start typing in the location fields to see real-time suggestions from OpenStreetMap.
                  Select from the dropdown to auto-fill accurate location names with coordinates.
                </p>
              </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Left Column - Form */}
          <div className="space-y-6">
            {/* Map */}
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/30 p-4 shadow-sm">
              <p className="mb-2 text-sm text-gray-600"><span className="material-icons" style={{fontSize: '18px', verticalAlign: 'middle', marginRight: '4px', display: 'inline-flex'}}>location_on</span>Select locations below to see them on the map</p>
              <CommuteMap
                startCoords={effectiveStartCoords}
                endCoords={endCoords}
                startLabel={formData.origin}
                endLabel={formData.destination}
                liveCoords={liveCoords}
                onLocate={handleMapLocate}
              />
            </div>
            {/* Get Suggestion Form */}
            <div className="rounded-2xl border border-emerald-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-xl font-semibold text-gray-800">
                Get Weather Suggestion
              </h2>

              <form onSubmit={handleGetSuggestion} className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-sm font-medium text-gray-700">Origin Location</label>
                    <button
                      type="button"
                      onClick={handleLocateMe}
                      disabled={liveLocating}
                      className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 disabled:text-gray-400 transition-colors"
                    >
                      {liveLocating ? (
                        <><span className="material-icons" style={{fontSize: '18px'}}>hourglass_empty</span> Locating...</>
                      ) : (
                        <><span className="material-icons" style={{fontSize: '18px'}}>location_on</span> Use My Location</>
                      )}
                    </button>
                  </div>
                  <LocationAutocomplete
                    name="origin"
                    value={formData.origin}
                    onChange={handleInputChange}
                    onCoordSelect={handleCoordSelect}
                    placeholder="Start typing your origin location..."
                    apiEndpoint="/smart-commute/weather-suggestion/autocomplete"
                    required
                  />
                </div>

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
                    className={`flex flex-1 items-center justify-center gap-1 rounded-lg px-4 py-2 font-medium transition-colors ${
                      !user
                        ? 'bg-gray-400 text-gray-700 cursor-not-allowed'
                        : loading
                        ? 'bg-gray-400 text-white'
                        : 'bg-green-600 text-white hover:bg-green-700'
                    }`}
                    title={!user ? 'Login required to save suggestions' : ''}
                  >
                    {loading ? 'Loading...' : !user ? (<><span className="material-icons" style={{fontSize: '18px'}}>lock</span> Login to Save</>) : 'Get Suggestion & Save'}
                  </button>

                  <button
                    type="button"
                    onClick={handleQuickCheck}
                    disabled={loading}
                    className="rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700 disabled:bg-gray-400"
                  >
                    Quick Check
                  </button>
                </div>
              </form>
            </div>

            {/* Current Weather Display */}
            {currentWeather && (
              <div className="relative overflow-hidden rounded-2xl bg-linear-to-br from-blue-600 via-blue-600 to-indigo-700 p-6 text-white shadow-xl">
                <div className="pointer-events-none absolute -right-16 -top-20 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
                <div className="pointer-events-none absolute -bottom-16 -left-16 h-40 w-40 rounded-full bg-cyan-200/20 blur-2xl" />

                <div className="relative">
                  <h3 className="mb-5 text-xl font-semibold">Current Suggestion</h3>

                  {/* Weather + Temp row */}
                  <div className="mb-5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="flex h-16 w-16 items-center justify-center rounded-2xl border border-white/25 bg-white/15 backdrop-blur-sm">
                        <span className="material-icons" style={{fontSize: '38px'}}>
                          {getWeatherIcon(currentWeather.weatherCondition)}
                        </span>
                      </span>
                      <div>
                        <p className="text-xs uppercase tracking-[0.18em] text-blue-100">Condition</p>
                        <p className="text-base font-semibold">{currentWeather.weatherCondition}</p>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-4xl font-bold leading-none">
                        {currentWeather.temperature?.toFixed(1)}°C
                      </div>
                      <div className="mt-1 text-sm text-blue-100">Current temperature</div>
                    </div>
                  </div>

                  {/* Recommended transport */}
                  <div className="mb-4 rounded-2xl border border-white/25 bg-white/15 p-4 backdrop-blur-sm">
                    <div className="mb-2 text-xs uppercase tracking-[0.18em] text-blue-100">Recommended Transport</div>
                    <div className="flex items-center gap-2 text-2xl font-semibold text-white">
                      <span className="material-icons" style={{fontSize: '30px'}}>
                        {getTransportIcon(currentWeather.suggestedTransport)}
                      </span>
                      {currentWeather.suggestedTransport}
                    </div>

                    {/* Show secondary weather-only suggestion when distance overrides */}
                    {currentWeather.adjustmentReason === 'distance-adjusted' && currentWeather.weatherTransport && currentWeather.weatherTransport !== currentWeather.suggestedTransport && (
                      <div className="mt-2 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs text-blue-50">
                        <span className="material-icons" style={{fontSize: '14px'}}>
                          {getTransportIcon(currentWeather.weatherTransport)}
                        </span>
                        Weather-only: {currentWeather.weatherTransport}
                      </div>
                    )}
                  </div>

                  {/* Distance + adjustment badges */}
                  <div className="mb-4 flex flex-wrap gap-2">
                    {currentWeather.distanceKm != null && (
                      <span className="inline-flex items-center gap-1 rounded-full border border-white/25 bg-white/15 px-3 py-1 text-sm font-medium text-white">
                        <span className="material-icons" style={{fontSize: '16px'}}>straighten</span>
                        {Number(currentWeather.distanceKm).toFixed(1)} km
                      </span>
                    )}
                    {currentWeather.adjustmentReason === 'distance-adjusted' && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-green-500 px-3 py-1 text-xs font-semibold text-white shadow-sm">
                        <span className="material-icons" style={{fontSize: '14px'}}>check_circle</span>
                        Distance Adjusted
                      </span>
                    )}
                    {currentWeather.adjustmentReason === 'weather-priority' && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-orange-500 px-3 py-1 text-xs font-semibold text-white shadow-sm">
                        <span className="material-icons" style={{fontSize: '14px'}}>warning</span>
                        Weather Priority
                      </span>
                    )}
                  </div>

                  {/* Distance legend */}
                  <div className="mb-4 grid grid-cols-2 gap-2 text-center sm:grid-cols-4">
                    {[{label:'0-2 km',icon:'directions_walk',name:'Walk'},{label:'2-5 km',icon:'directions_bike',name:'Cycle'},{label:'5-10 km',icon:'local_taxi',name:'Tuk-Tuk'},{label:'10+ km',icon:'directions_bus',name:'Bus'}].map(item => (
                      <div key={item.name} className="rounded-xl border border-white/20 bg-white/12 p-2 backdrop-blur-sm">
                        <span className="material-icons mb-1 block" style={{fontSize: '20px'}}>
                          {item.icon}
                        </span>
                        <div className="text-xs font-medium text-blue-50">{item.label}</div>
                      </div>
                    ))}
                  </div>

                  {currentWeather.humidity != null && (
                    <div className="inline-flex items-center gap-1 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-sm text-blue-50">
                      <span className="material-icons" style={{fontSize: '16px'}}>water_drop</span>
                      Humidity: {currentWeather.humidity}%
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right Column - History */}
          <div className="rounded-2xl border border-emerald-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-xl font-semibold text-gray-800">
              Recent Suggestions
            </h2>

            <div className="space-y-3 max-h-150 overflow-y-auto">
              {!user ? (
                <div className="text-center text-gray-500 py-8">
                  <p className="text-lg mb-2"><span className="material-icons" style={{fontSize: '32px', display: 'block', marginBottom: '8px'}}>lock</span>Login Required</p>
                  <p className="text-sm">Log in to view your suggestion history</p>
                  <button
                    onClick={() => navigate('/login')}
                    className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center justify-center gap-1 mx-auto"
                  >
                    <span className="material-icons" style={{fontSize: '18px'}}>login</span>Go to Login
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
                    className="rounded-xl border border-emerald-100 bg-emerald-50/20 p-4 transition-shadow hover:shadow-md"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span style={{fontSize: '24px'}}>
                            <span className="material-icons" style={{fontSize: '28px', display: 'inline-block'}}>
                              {getWeatherIcon(suggestion.weatherCondition)}
                            </span>
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
                          <span className="material-icons" style={{fontSize: '24px'}}>
                            {getTransportIcon(suggestion.suggestedTransport)}
                          </span>
                          {suggestion.suggestedTransport}
                        </div>

                        {/* Distance + reason badges */}
                        <div className="flex flex-wrap gap-1 mt-1">
                          {suggestion.distance != null && (
                            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full flex items-center gap-1">
                              <span className="material-icons" style={{fontSize: '12px'}}>straighten</span>{Number(suggestion.distance).toFixed(1)} km
                            </span>
                          )}
                          {suggestion.adjustmentReason === 'distance-adjusted' && (
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                              <span className="material-icons" style={{fontSize: '12px'}}>check_circle</span>Distance Adjusted
                            </span>
                          )}
                          {suggestion.adjustmentReason === 'weather-priority' && (
                            <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                              <span className="material-icons" style={{fontSize: '12px'}}>warning</span>Weather Priority
                            </span>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={() => handleDelete(suggestion._id)}
                        className="text-red-500 hover:text-red-700 transition-colors"
                      >
                        <span className="material-icons">delete</span>
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
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/40 p-6">
              <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-emerald-900">
                <span className="material-icons">lightbulb</span>
                How It Works
              </h3>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="rounded-xl border border-emerald-200 bg-white/80 p-4">
                  <p className="mb-3 flex items-center gap-2 font-semibold text-emerald-900">
                    <span className="material-icons" style={{fontSize: '18px'}}>cloud</span>
                    Weather Rules
                  </p>
                  <ul className="space-y-2 text-sm text-emerald-800">
                    <li><strong>Bad weather</strong> (Rain/Storm/Fog): weather always wins and suggests safe transit.</li>
                    <li><strong>Good weather</strong> (Clear/Clouds): distance takes priority for the best mode.</li>
                  </ul>
                </div>

                <div className="rounded-xl border border-emerald-200 bg-white/80 p-4">
                  <p className="mb-3 flex items-center gap-2 font-semibold text-emerald-900">
                    <span className="material-icons" style={{fontSize: '18px'}}>straighten</span>
                    Distance Rules (good weather)
                  </p>
                  <ul className="space-y-2 text-sm text-emerald-800">
                    <li className="flex items-center gap-2"><span className="font-semibold">0-2 km</span><span></span><span className="material-icons" style={{fontSize: '16px'}}>directions_walk</span><span>Walking</span></li>
                    <li className="flex items-center gap-2"><span className="font-semibold">2-5 km</span><span></span><span className="material-icons" style={{fontSize: '16px'}}>directions_bike</span><span>Cycling</span></li>
                    <li className="flex items-center gap-2"><span className="font-semibold">5-10 km</span><span></span><span className="material-icons" style={{fontSize: '16px'}}>local_taxi</span><span>Tuk-Tuk</span></li>
                    <li className="flex items-center gap-2"><span className="font-semibold">10+ km</span><span></span><span className="material-icons" style={{fontSize: '16px'}}>directions_bus</span><span>Bus</span></li>
                  </ul>
                </div>
              </div>

              <div className="mt-4 rounded-lg border border-emerald-200 bg-white/70 p-3 text-sm text-emerald-800">
                <p className="flex items-start gap-2">
                  <span className="material-icons mt-0.5" style={{fontSize: '16px'}}>lightbulb</span>
                  <span><strong>Quick Check</strong> gives instant weather without saving history. Select both origin and destination for distance-aware suggestions.</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default WeatherSuggestion;
