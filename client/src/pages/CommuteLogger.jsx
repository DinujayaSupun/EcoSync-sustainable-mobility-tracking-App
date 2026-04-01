import { useState } from 'react';
import API from '../api/axios';
import LocationAutocomplete from '../components/LocationAutocomplete';
import CommuteMap from '../components/CommuteMap';
import { weatherAPI } from '../api/smartCommute';

const CommuteLogger = () => {
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

  const weatherIcons = { Clear: '☀️', Rain: '🌧️', Clouds: '☁️', Snow: '❄️', Drizzle: '🌦️', Thunderstorm: '⛈️', Mist: '🌫️', Fog: '🌫️' };
  const transportIcons = { Bus: '🚌', Cycling: '🚴', Walking: '🚶', Carpool: '🚗', Train: '🚂', Metro: '🚇' };

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
        <p className="mb-3 text-sm font-medium text-emerald-700">📍 Search and select locations below to pin them on the map</p>
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
        <div className="rounded-xl border border-emerald-100 bg-emerald-50/40 p-3 sm:p-4">
          <div className="flex items-center justify-between mb-1">
            <label className="block font-semibold text-emerald-900">Start Location</label>
            <button
              type="button"
              onClick={handleLocateMe}
              disabled={liveLocating}
              className="flex items-center gap-1 rounded-full border border-emerald-200 bg-white px-3 py-1.5 text-xs font-semibold text-emerald-700 transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {liveLocating ? (
                <><span className="animate-spin">⏳</span> Locating...</>
              ) : (
                <><span>📍</span> Use My Location</>
              )}
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

        <LocationAutocomplete
          name="destination"
          value={formData.destination}
          onChange={handleChange}
          onCoordSelect={handleCoordSelect}
          placeholder="e.g., Kandy, Sri Lanka"
          label="Destination"
          required
        />

        <div className="rounded-xl border border-emerald-100 bg-emerald-50/40 p-3 sm:p-4">
          <label className="mb-2 block font-semibold text-emerald-900">
            Transport Type
          </label>
          <select
            name="transportType"
            value={formData.transportType}
            onChange={handleChange}
            className="w-full rounded-xl border border-emerald-200 bg-white px-4 py-2.5 text-gray-700 shadow-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
            required
          >
            <option value="Car">🚗 Car</option>
            <option value="Bus">🚌 Bus</option>
            <option value="Train">🚆 Train</option>
            <option value="Bike">🚴 Bike</option>
            <option value="Walk">🚶 Walk</option>
          </select>
        </div>

        <div className="rounded-xl border border-emerald-100 bg-emerald-50/40 p-3 sm:p-4">
          <label className="mb-2 block font-semibold text-emerald-900">Faculty</label>
          <select
            name="faculty"
            value={formData.faculty}
            onChange={handleChange}
            className="w-full rounded-xl border border-emerald-200 bg-white px-4 py-2.5 text-gray-700 shadow-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
            required
          >
            <option value="">-- Select Faculty --</option>
            <option value="Faculty of Computing">🖥️ Faculty of Computing</option>
            <option value="Faculty of Engineering">⚙️ Faculty of Engineering</option>
            <option value="Faculty of Business">💼 Faculty of Business</option>
            <option value="Faculty of Science">🔬 Faculty of Science</option>
            <option value="Faculty of Arts">🎨 Faculty of Arts</option>
            <option value="Faculty of Medicine">🏥 Faculty of Medicine</option>
            <option value="Faculty of Law">⚖️ Faculty of Law</option>
            <option value="Faculty of Education">📚 Faculty of Education</option>
            <option value="Other">🏫 Other</option>
          </select>
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
              <span className="text-gray-700">📅 Weekday</span>
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
              <span className="text-gray-700">🛋️ Weekend</span>
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
      <div className="mt-6 overflow-hidden rounded-2xl border border-emerald-100 bg-white shadow-sm">
        <div className="flex items-center justify-between bg-linear-to-r from-emerald-700 to-green-600 px-5 py-3">
          <div className="flex items-center gap-2">
            <span className="text-xl">☁️</span>
            <h3 className="text-white font-semibold text-base">Weather-Based Transport Suggestion</h3>
          </div>
          <button
            type="button"
            onClick={() => fetchWeather(formData.startLocation)}
            disabled={weatherLoading || !formData.startLocation}
            className="rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {weatherLoading ? 'Checking…' : 'Check Weather'}
          </button>
        </div>

        <div className="bg-emerald-50/60 px-5 py-4">
          {!formData.startLocation && !weather && (
            <p className="py-2 text-center text-sm text-emerald-700">
              Enter a start location above, then click <strong>Check Weather</strong> for live transport suggestions.
            </p>
          )}

          {weatherError && (
            <p className="text-sm text-red-600 text-center py-2">{weatherError}</p>
          )}

          {weatherLoading && (
            <div className="flex items-center justify-center gap-2 py-4">
              <svg className="h-5 w-5 animate-spin text-emerald-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
              <span className="text-sm text-emerald-700">Fetching live weather…</span>
            </div>
          )}

          {weather && !weatherLoading && (
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Weather card */}
              <div className="flex flex-1 items-center gap-4 rounded-xl border border-emerald-200 bg-white p-4 shadow-sm">
                <span className="text-5xl">{weatherIcons[weather.weatherCondition] || '🌤️'}</span>
                <div>
                  <p className="text-2xl font-bold text-gray-800">{weather.temperature?.toFixed(1)}°C</p>
                  <p className="text-sm text-gray-500">{weather.weatherCondition}</p>
                  {weather.humidity != null && (
                    <p className="text-xs text-gray-400 mt-1">💧 Humidity: {weather.humidity}%</p>
                  )}
                </div>
              </div>

              {/* Suggestion card */}
              <div className="flex-1 rounded-xl border border-emerald-200 bg-white p-4 shadow-sm">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Recommended Transport</p>
                <div className="flex items-center gap-3">
                  <span className="text-4xl">{transportIcons[weather.suggestedTransport] || '🚗'}</span>
                  <div>
                    <p className="text-xl font-bold text-green-700">{weather.suggestedTransport}</p>
                    <p className="text-xs text-gray-500 mt-0.5">Best for current conditions</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* How it works */}
          {!weather && !weatherLoading && (
            <div className="mt-2 grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[['🌧️ Rain / Snow', 'Bus'], ['☀️ Clear Sky', 'Cycling'], ['☁️ Cloudy', 'Carpool'], ['⛈️ Storm', 'Train']]
                .map(([cond, mode]) => (
                  <div key={cond} className="rounded-lg border border-emerald-200 bg-white px-3 py-2 text-center text-xs text-gray-600">
                    <div className="font-medium">{cond}</div>
                    <div className="text-green-600 font-semibold mt-0.5">→ {mode}</div>
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
