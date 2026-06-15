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
  const [localWeather, setLocalWeather] = useState(null);
  const [localHourly, setLocalHourly] = useState([]);
  const [localDaily, setLocalDaily] = useState([]);
  const [localWeatherLoading, setLocalWeatherLoading] = useState(false);
  const [localWeatherError, setLocalWeatherError] = useState('');
  const [weatherMetricTab, setWeatherMetricTab] = useState('temperature');
  const [selectedDailyWeather, setSelectedDailyWeather] = useState(null);
  const [formData, setFormData] = useState({
    origin: '',
    destination: '',
  });

  const [startCoords, setStartCoords] = useState(null);
  const [endCoords, setEndCoords] = useState(null);
  const [liveCoords, setLiveCoords] = useState(null);
  const [useLiveStart, setUseLiveStart] = useState(false);
  const [liveLocating, setLiveLocating] = useState(false);

  const formatDayLabel = () => new Date().toLocaleDateString([], { weekday: 'long' });
  const formatHourLabel = () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });

  const loadLocalWeatherByCoords = async (lat, lon) => {
    setLocalWeatherLoading(true);
    setLocalWeatherError('');

    try {
      const [currentResponse, forecastResponse] = await Promise.all([
        weatherAPI.getCurrentWeather('my-location', { lat, lon }),
        weatherAPI.getForecast({ lat, lon }),
      ]);

      const current = currentResponse?.data || null;
      const forecast = forecastResponse?.data || {};

      setLocalWeather(current);
      setLocalHourly(forecast.hourly || []);
      const days = (forecast.daily || []).slice(0, 7);
      setLocalDaily(days);
      setSelectedDailyWeather((prev) => {
        if (prev) {
          return days.find((day) => day.date === prev.date) || days[0] || null;
        }
        return days[0] || null;
      });
    } catch (error) {
      console.error('Local weather fetch error:', error);
      setLocalWeatherError('Failed to load weather for your current location.');
    } finally {
      setLocalWeatherLoading(false);
    }
  };

  const loadMyLocationWeather = () => {
    if (!navigator.geolocation) {
      setLocalWeatherError('Geolocation is not supported by your browser.');
      return;
    }

    setLocalWeatherLoading(true);
    setLocalWeatherError('');

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lon } = pos.coords;
        await loadLocalWeatherByCoords(lat, lon);
      },
      (err) => {
        console.error('Geolocation error:', err);
        setLocalWeatherLoading(false);
        setLocalWeatherError('Please allow location access to load your local weather.');
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

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
        await loadLocalWeatherByCoords(lat, lon);
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
    loadLocalWeatherByCoords(lat, lon);
  };

  const effectiveStartCoords = useLiveStart && liveCoords ? liveCoords : startCoords;

  // Fetch user's suggestions
  useEffect(() => {
    if (user?._id || user?.id) {
      fetchSuggestions();
    }
  }, [user]);

  useEffect(() => {
    loadMyLocationWeather();
  }, []);

  const activeDailyWeather = selectedDailyWeather || localDaily[0] || null;
  const activeHourlySeries = activeDailyWeather?.hourly?.length ? activeDailyWeather.hourly : localHourly;

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
            <p className="mt-2 text-sm text-emerald-50 sm:text-base">
              Get eco-friendly transport recommendations based on current weather conditions
            </p>
          </div>

          <div className="space-y-6 p-5 sm:p-7">
            <div className="rounded-3xl border border-emerald-100 bg-white p-5 shadow-sm sm:p-6">
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-2xl font-bold text-emerald-700">My Location Weather</h2>
                  <p className="text-sm text-emerald-600">Actual weather based on your live GPS coordinates</p>
                </div>
                <button
                  type="button"
                  onClick={loadMyLocationWeather}
                  disabled={localWeatherLoading}
                  className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 disabled:bg-gray-400"
                >
                  {localWeatherLoading ? 'Refreshing...' : 'Refresh My Weather'}
                </button>
              </div>

              {localWeatherError && (
                <div className="mb-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {localWeatherError}
                </div>
              )}

              {localWeather && (
                <>
                  <div className="mb-4 grid grid-cols-1 gap-4 rounded-2xl border border-emerald-100 bg-linear-to-r from-emerald-50/60 to-green-50/60 p-4 md:grid-cols-2">
                    <div className="flex items-center gap-3">
                      <span className="material-icons text-emerald-600" style={{ fontSize: '42px' }}>
                        {getWeatherIcon(activeDailyWeather?.condition || localWeather.weatherCondition)}
                      </span>
                      <div>
                        <div className="text-5xl font-bold leading-none text-emerald-700">
                          {activeDailyWeather ? activeDailyWeather.maxTemp : Math.round(localWeather.temperature)}
                          <span className="ml-1 text-2xl">°C</span>
                        </div>
                        <div className="mt-1 text-sm capitalize text-emerald-600">
                          {activeDailyWeather ? activeDailyWeather.description : localWeather.description}
                        </div>
                        {activeDailyWeather && (
                          <div className="mt-1 text-xs font-semibold text-emerald-700">
                            {activeDailyWeather.dateLong}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="rounded-lg border border-emerald-100 bg-white px-3 py-2">
                        <p className="text-xs uppercase tracking-wide text-emerald-600">Humidity</p>
                        <p className="font-semibold text-emerald-700">{localWeather.humidity ?? '--'}%</p>
                      </div>
                      <div className="rounded-lg border border-emerald-100 bg-white px-3 py-2">
                        <p className="text-xs uppercase tracking-wide text-emerald-600">Wind</p>
                        <p className="font-semibold text-emerald-700">{Math.round((localWeather.windSpeed || 0) * 3.6)} km/h</p>
                      </div>
                      <div className="rounded-lg border border-emerald-100 bg-white px-3 py-2">
                        <p className="text-xs uppercase tracking-wide text-emerald-600">Day</p>
                        <p className="font-semibold text-emerald-700">{activeDailyWeather?.dayLabel || formatDayLabel()}</p>
                      </div>
                      <div className="rounded-lg border border-emerald-100 bg-white px-3 py-2">
                        <p className="text-xs uppercase tracking-wide text-emerald-600">Time</p>
                        <p className="font-semibold text-emerald-700">{formatHourLabel()}</p>
                      </div>
                    </div>
                  </div>

                  <div className="mb-3 flex items-center gap-2 border-b border-emerald-100 pb-2 text-sm font-semibold text-emerald-600">
                    {['temperature', 'precipitation', 'wind'].map((tab) => (
                      <button
                        key={tab}
                        type="button"
                        onClick={() => setWeatherMetricTab(tab)}
                        className={`rounded-full px-3 py-1 capitalize transition-colors ${
                          weatherMetricTab === tab
                            ? 'bg-emerald-600 text-white'
                            : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                        }`}
                      >
                        {tab}
                      </button>
                    ))}
                  </div>

                  {activeHourlySeries.length > 0 && (
                    <div className="mb-4 rounded-2xl border border-emerald-100 bg-emerald-50/40 p-4">
                      <div className="flex h-36 items-end gap-3 overflow-x-auto pb-2">
                        {activeHourlySeries.map((point, idx) => {
                          const value = weatherMetricTab === 'temperature'
                            ? point.temp
                            : weatherMetricTab === 'precipitation'
                              ? point.precipitation
                              : point.windKmh;
                          const max = Math.max(
                            ...activeHourlySeries.map((p) => weatherMetricTab === 'temperature'
                              ? p.temp
                              : weatherMetricTab === 'precipitation'
                                ? p.precipitation
                                : p.windKmh),
                            1,
                          );
                          const height = Math.max(12, Math.round((value / max) * 88));

                          return (
                            <button
                              key={`${point.time}-${idx}`}
                              type="button"
                              className="w-20 shrink-0 text-center"
                              onClick={() => {
                                if (activeDailyWeather) {
                                  setSelectedDailyWeather(activeDailyWeather);
                                }
                              }}
                            >
                              <div className="mb-2 text-xs font-semibold text-emerald-600 leading-none">
                                {value}{weatherMetricTab === 'temperature' ? '°' : weatherMetricTab === 'precipitation' ? '%' : ''}
                              </div>
                              <div className="mx-auto w-9 rounded-t-md bg-linear-to-t from-emerald-600 to-emerald-500" style={{ height: `${height}px` }} />
                              <div className="mt-2 text-xs text-gray-600 leading-none">{point.timeLabel}</div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {localDaily.length > 0 && (
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
                      {localDaily.map((day, idx) => (
                        <div
                          key={`${day.date}-${idx}`}
                          onClick={() => setSelectedDailyWeather(day)}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(event) => {
                            if (event.key === 'Enter' || event.key === ' ') {
                              event.preventDefault();
                              setSelectedDailyWeather(day);
                            }
                          }}
                          className={`cursor-pointer rounded-xl border p-2 text-center transition-all hover:-translate-y-0.5 hover:shadow-md ${
                            activeDailyWeather?.date === day.date
                              ? 'border-emerald-600/60 bg-emerald-100/60 shadow-md ring-2 ring-emerald-100'
                              : 'border-emerald-100 bg-white'
                          }`}
                        >
                          <p className="text-sm font-semibold text-emerald-700">{day.dayLabel}</p>
                          <p className="text-[11px] text-emerald-600">{day.dateLabel}</p>
                          <span className="material-icons mt-1 text-emerald-600" style={{ fontSize: '24px' }}>
                            {getWeatherIcon(day.condition)}
                          </span>
                          <p className="mt-1 text-sm font-medium text-emerald-700">{day.maxTemp}° {day.minTemp}°</p>
                          <p className="mt-1 text-[11px] capitalize text-gray-600">{day.description}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Left Column - Form */}
          <div className="space-y-6">
            {/* Map */}
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50/40 p-4 shadow-sm">
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
            <div className="rounded-2xl border border-emerald-100 bg-white p-6 shadow-sm">
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
                      className="flex items-center gap-1 text-sm text-emerald-600 hover:text-emerald-700 disabled:text-gray-400 transition-colors"
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
                        : 'bg-emerald-600 text-white hover:bg-emerald-700'
                    }`}
                    title={!user ? 'Login required to save suggestions' : ''}
                  >
                    {loading ? 'Loading...' : !user ? (<><span className="material-icons" style={{fontSize: '18px'}}>lock</span> Login to Save</>) : 'Get Suggestion & Save'}
                  </button>

                  <button
                    type="button"
                    onClick={handleQuickCheck}
                    disabled={loading}
                    className="rounded-lg bg-emerald-500 px-4 py-2 text-white transition-colors hover:bg-emerald-600 disabled:bg-gray-400"
                  >
                    Quick Check
                  </button>
                </div>
              </form>
            </div>

            {/* Current Weather Display */}
            {currentWeather && (
              <div className="relative overflow-hidden rounded-2xl bg-linear-to-br from-emerald-600 via-emerald-600 to-green-700 p-6 text-white shadow-xl">
                <div className="pointer-events-none absolute -right-16 -top-20 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
                <div className="pointer-events-none absolute -bottom-16 -left-16 h-40 w-40 rounded-full bg-emerald-200/20 blur-2xl" />

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
                        <p className="text-xs uppercase tracking-[0.18em] text-emerald-100">Condition</p>
                        <p className="text-base font-semibold">{currentWeather.weatherCondition}</p>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-4xl font-bold leading-none">
                        {currentWeather.temperature?.toFixed(1)}°C
                      </div>
                      <div className="mt-1 text-sm text-emerald-100">Current temperature</div>
                    </div>
                  </div>

                  {/* Recommended transport */}
                  <div className="mb-4 rounded-2xl border border-white/25 bg-white/15 p-4 backdrop-blur-sm">
                    <div className="mb-2 text-xs uppercase tracking-[0.18em] text-emerald-100">Recommended Transport</div>
                    <div className="flex items-center gap-2 text-2xl font-semibold text-white">
                      <span className="material-icons" style={{fontSize: '30px'}}>
                        {getTransportIcon(currentWeather.suggestedTransport)}
                      </span>
                      {currentWeather.suggestedTransport}
                    </div>

                    {/* Show secondary weather-only suggestion when distance overrides */}
                    {currentWeather.adjustmentReason === 'distance-adjusted' && currentWeather.weatherTransport && currentWeather.weatherTransport !== currentWeather.suggestedTransport && (
                      <div className="mt-2 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs text-emerald-50">
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
                        <div className="text-xs font-medium text-emerald-50">{item.label}</div>
                      </div>
                    ))}
                  </div>

                  {currentWeather.humidity != null && (
                    <div className="inline-flex items-center gap-1 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-sm text-emerald-50">
                      <span className="material-icons" style={{fontSize: '16px'}}>water_drop</span>
                      Humidity: {currentWeather.humidity}%
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right Column - History */}
            <div className="relative overflow-hidden rounded-3xl border border-emerald-100 bg-linear-to-br from-white via-emerald-50/40 to-green-50/40 p-6 shadow-lg shadow-emerald-100/20">
            <div className="pointer-events-none absolute -right-16 -top-20 h-44 w-44 rounded-full bg-emerald-200/25 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-20 -left-16 h-44 w-44 rounded-full bg-emerald-200/25 blur-3xl" />

            <div className="relative mb-5 flex items-center justify-between gap-3">
              <h2 className="flex items-center gap-2 text-xl font-bold text-emerald-700 sm:text-2xl">
                <span className="material-icons rounded-xl bg-emerald-700 p-1.5 text-white" style={{ fontSize: '18px' }}>history</span>
                Recent Suggestions
              </h2>
              <span className="rounded-full border border-emerald-200 bg-white px-3 py-1 text-xs font-semibold tracking-wide text-emerald-600">
                {user ? `${suggestions.length} items` : 'Private'}
              </span>
            </div>

            <div className="relative space-y-3 max-h-150 overflow-y-auto pr-1">
              {!user ? (
                <div className="rounded-2xl border border-emerald-100 bg-white/80 px-5 py-8 text-center text-gray-600 shadow-sm">
                  <p className="mb-2 text-lg font-semibold text-emerald-700">
                    <span className="material-icons" style={{ fontSize: '32px', display: 'block', marginBottom: '8px' }}>lock</span>
                    Login Required
                  </p>
                  <p className="text-sm">Log in to view your suggestion history</p>
                  <button
                    onClick={() => navigate('/login')}
                    className="mt-4 mx-auto flex items-center justify-center gap-1 rounded-full bg-emerald-600 px-4 py-2 text-white transition-colors hover:bg-emerald-700"
                  >
                    <span className="material-icons" style={{ fontSize: '18px' }}>login</span>Go to Login
                  </button>
                </div>
              ) : suggestions.length === 0 ? (
                <div className="rounded-2xl border border-emerald-100 bg-white/80 px-5 py-8 text-center text-gray-600 shadow-sm">
                  <p className="font-semibold text-emerald-700">No suggestions yet</p>
                  <p className="mt-2 text-sm">Create your first weather-based suggestion</p>
                </div>
              ) : (
                suggestions.map((suggestion) => (
                  <div
                    key={suggestion._id}
                    className="group rounded-2xl border border-emerald-100 bg-white/90 p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
                  >
                    <div className="mb-2 flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="mb-2 flex items-center gap-2">
                          <span className="rounded-xl border border-emerald-100 bg-emerald-50 p-1.5" style={{ fontSize: '24px' }}>
                            <span className="material-icons text-emerald-600" style={{ fontSize: '24px', display: 'inline-block' }}>
                              {getWeatherIcon(suggestion.weatherCondition)}
                            </span>
                          </span>
                          <span className="font-semibold text-gray-900">
                            {suggestion.weatherCondition}
                          </span>
                        </div>

                        <div className="mb-3 space-y-1 text-sm text-gray-700">
                          <p><span className="font-semibold text-gray-900">From:</span> {suggestion.origin}</p>
                          <p><span className="font-semibold text-gray-900">To:</span> {suggestion.destination}</p>
                        </div>

                        <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-emerald-700">
                          <span className="material-icons" style={{ fontSize: '20px' }}>
                            {getTransportIcon(suggestion.suggestedTransport)}
                          </span>
                          <span className="font-semibold">{suggestion.suggestedTransport}</span>
                        </div>

                        {/* Distance + reason badges */}
                        <div className="mt-1 flex flex-wrap gap-1.5">
                          {suggestion.distance != null && (
                            <span className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-gray-100 px-2.5 py-0.5 text-xs text-gray-700">
                              <span className="material-icons" style={{ fontSize: '12px' }}>straighten</span>{Number(suggestion.distance).toFixed(1)} km
                            </span>
                          )}
                          {suggestion.adjustmentReason === 'distance-adjusted' && (
                            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-100 px-2.5 py-0.5 text-xs text-emerald-700">
                              <span className="material-icons" style={{ fontSize: '12px' }}>check_circle</span>Distance Adjusted
                            </span>
                          )}
                          {suggestion.adjustmentReason === 'weather-priority' && (
                            <span className="inline-flex items-center gap-1 rounded-full border border-orange-200 bg-orange-100 px-2.5 py-0.5 text-xs text-orange-700">
                              <span className="material-icons" style={{ fontSize: '12px' }}>warning</span>Weather Priority
                            </span>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={() => handleDelete(suggestion._id)}
                        className="rounded-full border border-red-100 bg-red-50 p-1.5 text-red-500 transition-all hover:scale-105 hover:bg-red-100 hover:text-red-700"
                        title="Delete suggestion"
                      >
                        <span className="material-icons">delete</span>
                      </button>
                    </div>

                    <div className="mt-2 border-t border-emerald-100 pt-2 text-xs text-gray-500">
                      {new Date(suggestion.createdAt).toLocaleString()}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
            </div>

            {/* Info Section */}
            <div className="relative overflow-hidden rounded-3xl border border-emerald-100 bg-linear-to-br from-emerald-50/30 via-white to-green-50/30 p-6 shadow-lg shadow-emerald-100/20 sm:p-7">
              <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-emerald-200/25 blur-2xl" />
              <div className="pointer-events-none absolute -bottom-20 -left-12 h-44 w-44 rounded-full bg-emerald-200/25 blur-2xl" />

              <div className="relative mb-5 flex items-center justify-between gap-3">
                <h3 className="flex items-center gap-2 text-xl font-bold text-emerald-700 sm:text-2xl">
                  <span className="material-icons rounded-xl bg-emerald-700 p-1.5 text-white" style={{ fontSize: '18px' }}>lightbulb</span>
                  How It Works
                </h3>
                <span className="rounded-full border border-emerald-200 bg-white px-3 py-1 text-xs font-semibold tracking-wide text-emerald-600">
                  Smart Recommendation Logic
                </span>
              </div>

              <div className="relative grid grid-cols-1 gap-4 lg:grid-cols-2">
                <div className="rounded-2xl border border-emerald-100 bg-white/90 p-5 shadow-sm backdrop-blur-sm">
                  <p className="mb-3 flex items-center gap-2 font-semibold text-emerald-700">
                    <span className="material-icons rounded-lg bg-emerald-100 p-1 text-emerald-600" style={{ fontSize: '18px' }}>cloud</span>
                    Weather Rules
                  </p>
                  <ul className="space-y-3 text-sm text-emerald-700">
                    <li className="rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-2">
                      <strong>Bad weather</strong> (Rain/Storm/Fog): weather always wins and suggests safe transit.
                    </li>
                    <li className="rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-2">
                      <strong>Good weather</strong> (Clear/Clouds): distance takes priority for the best mode.
                    </li>
                  </ul>
                </div>

                <div className="rounded-2xl border border-emerald-100 bg-white/90 p-5 shadow-sm backdrop-blur-sm">
                  <p className="mb-3 flex items-center gap-2 font-semibold text-emerald-700">
                    <span className="material-icons rounded-lg bg-emerald-100 p-1 text-emerald-600" style={{ fontSize: '18px' }}>straighten</span>
                    Distance Rules (good weather)
                  </p>
                  <ul className="space-y-2.5 text-sm text-emerald-700">
                    <li className="flex items-center justify-between rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-2">
                      <span className="font-semibold">0-2 km</span>
                      <span className="flex items-center gap-2"><span className="material-icons" style={{ fontSize: '16px' }}>directions_walk</span>Walking</span>
                    </li>
                    <li className="flex items-center justify-between rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-2">
                      <span className="font-semibold">2-5 km</span>
                      <span className="flex items-center gap-2"><span className="material-icons" style={{ fontSize: '16px' }}>directions_bike</span>Cycling</span>
                    </li>
                    <li className="flex items-center justify-between rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-2">
                      <span className="font-semibold">5-10 km</span>
                      <span className="flex items-center gap-2"><span className="material-icons" style={{ fontSize: '16px' }}>local_taxi</span>Tuk-Tuk</span>
                    </li>
                    <li className="flex items-center justify-between rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-2">
                      <span className="font-semibold">10+ km</span>
                      <span className="flex items-center gap-2"><span className="material-icons" style={{ fontSize: '16px' }}>directions_bus</span>Bus</span>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="relative mt-5 rounded-2xl border border-emerald-100 bg-white/85 p-4 text-sm text-emerald-700 shadow-sm">
                <p className="flex items-start gap-2.5">
                  <span className="material-icons mt-0.5 rounded-md bg-emerald-100 p-1 text-emerald-600" style={{ fontSize: '16px' }}>bolt</span>
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
