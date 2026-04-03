import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api/axios';
import LocationAutocomplete from '../components/LocationAutocomplete';
import CommuteMap from '../components/CommuteMap';
import { weatherAPI } from '../api/smartCommute';

const CommuteLogger = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    startLocation: '',
    destination: '',
    transportType: 'Car',
    faculty: '',
    dayType: 'Weekday',
  });

  const [startCoords, setStartCoords] = useState(null);
  const [endCoords, setEndCoords] = useState(null);
  const [liveCoords, setLiveCoords] = useState(null);
  const [liveLocating, setLiveLocating] = useState(false);

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Weather suggestion state
  const [weather, setWeather] = useState(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [weatherError, setWeatherError] = useState('');

  const weatherIcons = { Clear: 'wb_sunny', Rain: 'cloud_queue', Clouds: 'cloud', Snow: 'ac_unit', Drizzle: 'cloud_queue', Thunderstorm: 'cloud_alert', Mist: 'cloud_queue', Fog: 'cloud_queue' };
  const transportIcons = { Bus: 'directions_bus', Cycling: 'directions_bike', Walking: 'directions_walk', Carpool: 'directions_car', Train: 'train', Metro: 'direction_subway' };

  const fetchWeather = async (location) => {
    if (!location) return;
    setWeatherLoading(true);
    setWeatherError('');
    setWeather(null);
    try {
      const params = startCoords ? { lat: startCoords[0], lon: startCoords[1] } : {};
      const res = await weatherAPI.getCurrentWeather(location, params);
      setWeather(res.data);
    } catch (e) {
      setWeatherError('Could not fetch weather. Please try again.');
    } finally {
      setWeatherLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleCoordSelect = (fieldName, lat, lon) => {
    if (fieldName === 'startLocation') {
      setStartCoords([lat, lon]);
    } else if (fieldName === 'destination') {
      setEndCoords([lat, lon]);
    }
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
        setStartCoords([lat, lon]);
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`
          );
          const data = await res.json();
          const name = data.display_name || `${lat.toFixed(5)}, ${lon.toFixed(5)}`;
          setFormData((prev) => ({ ...prev, startLocation: name }));
        } catch {
          setFormData((prev) => ({ ...prev, startLocation: `${lat.toFixed(5)}, ${lon.toFixed(5)}` }));
        }
        setLiveLocating(false);
      },
      (err) => {
        console.error('Geolocation error:', err);
        alert('Unable to retrieve your location. Please allow location access.');
        setLiveLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Callback from LocateControl button inside the map
  const handleMapLocate = (lat, lon, name) => {
    setLiveCoords([lat, lon]);
    setStartCoords([lat, lon]);
    setFormData((prev) => ({ ...prev, startLocation: name }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const { data } = await API.post('/commute/log', formData);
      setResult(data.data);
      // Reset form
      setFormData({
        startLocation: '',
        destination: '',
        transportType: 'Car',
        faculty: '',
        dayType: 'Weekday',
      });
      setStartCoords(null);
      setEndCoords(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to log commute. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-3xl border border-emerald-100 bg-linear-to-br from-emerald-50 via-white to-green-50 p-4 shadow-xl sm:p-6 lg:p-8">
      <div className="mb-6 rounded-2xl bg-linear-to-r from-emerald-700 to-green-600 p-5 text-white shadow-lg sm:mb-8 sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-emerald-100">Smart Mobility</p>
        <h2 className="mt-1 text-2xl font-bold sm:text-3xl">Smart Commute Logger</h2>
        <p className="mt-2 text-sm text-emerald-100 sm:text-base">
          Plan your trip, log it in seconds, and make eco-friendly transport choices.
        </p>
      </div>

      {/* Interactive Map */}
      <div className="mb-6 overflow-hidden rounded-2xl border border-emerald-100 bg-white p-4 shadow-sm sm:mb-7">
        <p className="mb-3 text-sm font-medium text-emerald-700"><span className="material-icons" style={{fontSize: '18px', verticalAlign: 'middle', marginRight: '4px', display: 'inline-flex'}}>location_on</span>Search and select locations below to pin them on the map</p>
        <CommuteMap
          startCoords={startCoords}
          endCoords={endCoords}
          startLabel={formData.startLocation}
          endLabel={formData.destination}
          transportType={formData.transportType}
          liveCoords={liveCoords}
          onLocate={handleMapLocate}
        />
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-5 rounded-2xl border border-emerald-100 bg-white p-4 shadow-sm sm:p-6">
        <div className="rounded-xl border-2 border-emerald-100 bg-linear-to-br from-emerald-50/80 to-green-50/50 p-4 sm:p-5">
          <div className="flex items-center justify-between mb-3">
            <label className="flex items-center gap-2 text-lg font-bold text-emerald-900">
              <span className="material-icons" style={{fontSize: '24px'}}>location_on</span>
              Start Location
            </label>
            <button
              type="button"
              onClick={handleLocateMe}
              disabled={liveLocating}
              className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-all duration-200 ${
                liveLocating
                  ? 'bg-gray-300 text-gray-700 cursor-not-allowed'
                  : 'bg-linear-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 shadow-md hover:shadow-lg'
              }`}
            >
              <span className="material-icons" style={{fontSize: '18px'}}>
                {liveLocating ? 'schedule' : 'my_location'}
              </span>
              {liveLocating ? 'Locating...' : 'Use My Location'}
            </button>
          </div>
          <LocationAutocomplete
            name="startLocation"
            value={formData.startLocation}
            onChange={handleChange}
            onCoordSelect={handleCoordSelect}
            placeholder="e.g., Colombo, Sri Lanka"
            required
          />
        </div>

        <div className="rounded-xl border-2 border-emerald-100 bg-linear-to-br from-emerald-50/80 to-green-50/50 p-4 sm:p-5">
          <label className="mb-3 flex items-center gap-2 text-lg font-bold text-emerald-900">
            <span className="material-icons" style={{fontSize: '24px'}}>pin_drop</span>
            Destination
          </label>
          <LocationAutocomplete
            name="destination"
            value={formData.destination}
            onChange={handleChange}
            onCoordSelect={handleCoordSelect}
            placeholder="e.g., Kandy, Sri Lanka"
            required
          />
        </div>

        <div className="rounded-xl border border-emerald-100 bg-emerald-50/40 p-3 sm:p-4">
          <label className="mb-4 flex items-center gap-2 text-lg font-bold text-emerald-900">
            <span className="material-icons" style={{fontSize: '24px'}}>directions_car</span>
            Transport Type
          </label>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
            {[
              { value: 'Car', icon: 'directions_car', label: 'Car' },
              { value: 'Bus', icon: 'directions_bus', label: 'Bus' },
              { value: 'Train', icon: 'train', label: 'Train' },
              { value: 'Bike', icon: 'directions_bike', label: 'Bike' },
              { value: 'Walk', icon: 'directions_walk', label: 'Walk' }
            ].map(option => (
              <button
                key={option.value}
                type="button"
                onClick={() => setFormData({...formData, transportType: option.value})}
                className={`relative flex flex-col items-center justify-center gap-2 rounded-lg border-2 p-4 transition-all duration-200 ${
                  formData.transportType === option.value
                    ? 'border-emerald-500 bg-emerald-100 shadow-lg scale-105'
                    : 'border-emerald-200 bg-white hover:border-emerald-400 hover:shadow-md'
                }`}
              >
                <span className="material-icons" style={{fontSize: '32px', color: formData.transportType === option.value ? '#059669' : '#6b7280'}}>
                  {option.icon}
                </span>
                <span className={`text-xs font-bold text-center ${
                  formData.transportType === option.value ? 'text-emerald-900' : 'text-gray-700'
                }`}>
                  {option.label}
                </span>
                {formData.transportType === option.value && (
                  <div className="absolute -top-2 -right-2 rounded-full bg-emerald-500 p-1">
                    <span className="material-icons" style={{fontSize: '16px', color: 'white'}}>check</span>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-emerald-100 bg-emerald-50/40 p-3 sm:p-4">
          <label className="mb-4 flex items-center gap-2 text-lg font-bold text-emerald-900">
            <span className="material-icons" style={{fontSize: '24px'}}>school</span>
            Faculty
          </label>
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { value: 'Faculty of Computing', icon: 'laptop', label: 'Computing' },
              { value: 'Faculty of Engineering', icon: 'engineering', label: 'Engineering' },
              { value: 'Faculty of Business', icon: 'trending_up', label: 'Business' },
              { value: 'Faculty of Science', icon: 'science', label: 'Science' },
              { value: 'Faculty of Arts', icon: 'palette', label: 'Arts' },
              { value: 'Faculty of Medicine', icon: 'medical_services', label: 'Medicine' },
              { value: 'Faculty of Law', icon: 'gavel', label: 'Law' },
              { value: 'Faculty of Education', icon: 'menu_book', label: 'Education' },
              { value: 'Other', icon: 'more_horiz', label: 'Other' }
            ].map(option => (
              <button
                key={option.value}
                type="button"
                onClick={() => setFormData({...formData, faculty: option.value})}
                className={`relative flex items-center gap-3 rounded-lg border-2 p-3.5 transition-all duration-200 text-left ${
                  formData.faculty === option.value
                    ? 'border-emerald-500 bg-emerald-100 shadow-lg'
                    : 'border-emerald-200 bg-white hover:border-emerald-400 hover:shadow-md hover:bg-emerald-50/50'
                }`}
              >
                <span className="material-icons" style={{fontSize: '28px', flexShrink: 0, color: formData.faculty === option.value ? '#059669' : '#6b7280'}}>
                  {option.icon}
                </span>
                <div className="flex-1">
                  <div className={`font-semibold text-sm ${
                    formData.faculty === option.value ? 'text-emerald-900' : 'text-gray-800'
                  }`}>
                    {option.label}
                  </div>
                </div>
                {formData.faculty === option.value && (
                  <div className="rounded-full bg-emerald-500 p-1">
                    <span className="material-icons" style={{fontSize: '16px', color: 'white'}}>check</span>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-emerald-100 bg-emerald-50/40 p-3 sm:p-4">
          <label className="mb-2 block font-semibold text-emerald-900">Day Type</label>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-3">
            <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-emerald-200 bg-white px-3 py-2 text-sm text-gray-700 transition hover:border-emerald-300 hover:bg-emerald-50">
              <input
                type="radio"
                name="dayType"
                value="Weekday"
                checked={formData.dayType === 'Weekday'}
                onChange={handleChange}
                className="accent-green-600 w-4 h-4"
              />
              <span className="material-icons" style={{fontSize: '18px', marginRight: '-4px'}}>calendar_month</span>
              <span className="text-gray-700">Weekday</span>
            </label>
            <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-emerald-200 bg-white px-3 py-2 text-sm text-gray-700 transition hover:border-emerald-300 hover:bg-emerald-50">
              <input
                type="radio"
                name="dayType"
                value="Weekend"
                checked={formData.dayType === 'Weekend'}
                onChange={handleChange}
                className="accent-green-600 w-4 h-4"
              />
              <span className="material-icons" style={{fontSize: '18px', marginRight: '-4px'}}>event_note</span>
              <span className="text-gray-700">Weekend</span>
            </label>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-linear-to-r from-emerald-600 to-green-600 py-3 font-semibold text-white shadow-md transition hover:from-emerald-700 hover:to-green-700 disabled:cursor-not-allowed disabled:from-gray-400 disabled:to-gray-500"
        >
          {loading ? 'Calculating...' : 'Log Commute'}
        </button>
      </form>

      {error && (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700 shadow-sm">
          {error}
        </div>
      )}

      {/* ── Weather-Based Transport Suggestion ── */}
      <div className="mt-6 overflow-hidden rounded-3xl border-2 border-emerald-100 bg-linear-to-br from-white via-emerald-50/40 to-green-50 shadow-lg">
        <div className="flex flex-col gap-4 bg-linear-to-r from-emerald-700 to-green-600 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-100">Live Forecast</p>
            <h3 className="mt-1 flex items-center gap-2 text-lg font-bold text-white sm:text-xl">
              <span className="material-icons" style={{fontSize: '24px'}}>cloud</span>
              Weather-Based Transport Suggestion
            </h3>
          </div>
          <button
            type="button"
            onClick={() => navigate('/weather-suggestion')}
            className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2.5 text-sm font-semibold text-emerald-800 shadow-sm transition hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <span className="material-icons" style={{fontSize: '18px'}}>travel_explore</span>
            Check Weather
          </button>
        </div>

        <div className="px-5 py-5 sm:px-6">
          {!formData.startLocation && !weather && (
            <div className="rounded-2xl border border-emerald-200 bg-white/80 px-4 py-4 text-center shadow-sm">
              <span className="material-icons mb-2 block text-emerald-600" style={{fontSize: '34px'}}>location_on</span>
              <p className="text-sm font-medium text-emerald-900">Add a start location to unlock live weather suggestions.</p>
              <p className="mt-1 text-sm text-emerald-700">Then use <strong>Check Weather</strong> for a transport recommendation.</p>
            </div>
          )}

          {weatherError && (
            <div className="mt-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-center text-sm text-red-700 shadow-sm">
              {weatherError}
            </div>
          )}

          {weatherLoading && (
            <div className="flex items-center justify-center gap-3 rounded-2xl border border-emerald-200 bg-white px-4 py-5 shadow-sm">
              <span className="material-icons animate-spin text-emerald-600" style={{fontSize: '24px'}}>progress_activity</span>
              <span className="text-sm font-medium text-emerald-800">Fetching live weather…</span>
            </div>
          )}

          {weather && !weatherLoading && (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <div className="rounded-2xl border border-emerald-200 bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-600">Current Weather</p>
                  <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">Live</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="material-icons text-emerald-700" style={{fontSize: '72px'}}>{weatherIcons[weather.weatherCondition] || 'cloud'}</span>
                  <div>
                    <p className="text-3xl font-bold text-gray-900">{weather.temperature?.toFixed(1)}°C</p>
                    <p className="text-sm font-medium text-gray-600">{weather.weatherCondition}</p>
                    {weather.humidity != null && (
                      <p className="mt-2 inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800">
                        <span className="material-icons" style={{fontSize: '16px'}}>water_drop</span>
                        Humidity: {weather.humidity}%
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-emerald-200 bg-linear-to-br from-emerald-50 to-green-100 p-5 shadow-sm">
                <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">Recommended Transport</p>
                <div className="flex items-center gap-4">
                  <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-emerald-700 shadow-sm">
                    <span className="material-icons" style={{fontSize: '32px'}}>{transportIcons[weather.suggestedTransport] || 'directions_car'}</span>
                  </span>
                  <div>
                    <p className="text-2xl font-bold text-emerald-900">{weather.suggestedTransport}</p>
                    <p className="text-sm text-emerald-700">Best for current conditions</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {!weather && !weatherLoading && (
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                ['Rain / Snow', 'Bus', 'umbrella'],
                ['Clear Sky', 'Bike', 'wb_sunny'],
                ['Cloudy', 'Carpool', 'cloud'],
                ['Storm', 'Train', 'bolt']
              ].map(([cond, mode, icon]) => (
                <div key={cond} className="rounded-2xl border border-emerald-200 bg-white p-4 text-center shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                  <span className="material-icons mb-2 block text-emerald-600" style={{fontSize: '26px'}}>{icon}</span>
                  <div className="text-sm font-semibold text-emerald-900">{cond}</div>
                  <div className="mt-1 text-sm text-gray-600">→ <span className="font-semibold text-emerald-700">{mode}</span></div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {result && (
        <div className="mt-6 space-y-4 rounded-2xl border border-emerald-100 bg-white p-4 shadow-sm sm:p-5">
          <h3 className="text-xl font-bold text-emerald-900">Trip Summary</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
              <p className="text-sm font-medium text-emerald-700">Distance</p>
              <p className="text-2xl font-bold text-emerald-800">
                {result.distance.toFixed(2)} km
              </p>
            </div>

            <div className="rounded-xl border border-green-200 bg-green-50 p-4">
              <p className="text-sm font-medium text-green-700">Duration</p>
              <p className="text-2xl font-bold text-green-800">
                {result.duration.toFixed(0)} min
              </p>
            </div>

            <div className="rounded-xl border border-lime-200 bg-lime-50 p-4">
              <p className="text-sm font-medium text-lime-700">CO2 Emissions</p>
              <p className="text-2xl font-bold text-lime-800">
                {result.emissionEstimate.toFixed(2)} kg
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
            <p className="font-medium text-emerald-800">{result.ecoSuggestion}</p>
          </div>

          <div className="rounded-xl border border-emerald-100 bg-white p-4">
            <p className="text-sm text-gray-700">
              <strong>From:</strong> {result.startLocation}
            </p>
            <p className="text-sm text-gray-700">
              <strong>To:</strong> {result.destination}
            </p>
            <p className="text-sm text-gray-700">
              <strong>Transport:</strong> {result.transportType}
            </p>
            {result.faculty && (
              <p className="text-sm text-gray-700">
                <strong>Faculty:</strong> {result.faculty}
              </p>
            )}
            {result.dayType && (
              <p className="text-sm text-gray-700">
                <strong>Day Type:</strong> {result.dayType}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CommuteLogger;
