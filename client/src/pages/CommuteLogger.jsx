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
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">🚗 Smart Commute Logger</h2>

      {/* Interactive Map */}
      <div className="mb-5">
        <p className="text-sm text-gray-500 mb-2">📍 Search and select locations below to pin them on the map</p>
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
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-gray-700 font-medium">Start Location</label>
            <button
              type="button"
              onClick={handleLocateMe}
              disabled={liveLocating}
              className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 disabled:text-gray-400 transition-colors"
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

        <div>
          <label className="block text-gray-700 font-medium mb-2">
            Transport Type
          </label>
          <select
            name="transportType"
            value={formData.transportType}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            required
          >
            <option value="Car">🚗 Car</option>
            <option value="Bus">🚌 Bus</option>
            <option value="Train">🚆 Train</option>
            <option value="Bike">🚴 Bike</option>
            <option value="Walk">🚶 Walk</option>
          </select>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-lg transition duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {loading ? 'Calculating...' : 'Log Commute'}
        </button>
      </form>

      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {/* ── Weather-Based Transport Suggestion ── */}
      <div className="mt-6 border border-blue-100 rounded-xl overflow-hidden">
        <div className="bg-linear-to-r from-blue-600 to-blue-500 px-5 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">☁️</span>
            <h3 className="text-white font-semibold text-base">Weather-Based Transport Suggestion</h3>
          </div>
          <button
            type="button"
            onClick={() => fetchWeather(formData.startLocation)}
            disabled={weatherLoading || !formData.startLocation}
            className="text-xs bg-white text-blue-700 font-semibold px-3 py-1.5 rounded-lg hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {weatherLoading ? 'Checking…' : 'Check Weather'}
          </button>
        </div>

        <div className="bg-blue-50 px-5 py-4">
          {!formData.startLocation && !weather && (
            <p className="text-sm text-blue-500 text-center py-2">
              Enter a start location above, then click <strong>Check Weather</strong> for live transport suggestions.
            </p>
          )}

          {weatherError && (
            <p className="text-sm text-red-600 text-center py-2">{weatherError}</p>
          )}

          {weatherLoading && (
            <div className="flex items-center justify-center gap-2 py-4">
              <svg className="animate-spin h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
              <span className="text-sm text-blue-600">Fetching live weather…</span>
            </div>
          )}

          {weather && !weatherLoading && (
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Weather card */}
              <div className="flex-1 bg-white rounded-xl border border-blue-200 p-4 flex items-center gap-4 shadow-sm">
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
              <div className="flex-1 bg-white rounded-xl border border-green-200 p-4 shadow-sm">
                <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-2">Recommended Transport</p>
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
                  <div key={cond} className="bg-white rounded-lg border border-blue-100 px-3 py-2 text-center text-xs text-gray-600">
                    <div className="font-medium">{cond}</div>
                    <div className="text-green-600 font-semibold mt-0.5">→ {mode}</div>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>

      {result && (
        <div className="mt-6 space-y-4">
          <h3 className="text-xl font-bold text-gray-800">Trip Summary</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-600 font-medium">Distance</p>
              <p className="text-2xl font-bold text-blue-700">
                {result.distance.toFixed(2)} km
              </p>
            </div>

            <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
              <p className="text-sm text-purple-600 font-medium">Duration</p>
              <p className="text-2xl font-bold text-purple-700">
                {result.duration.toFixed(0)} min
              </p>
            </div>

            <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
              <p className="text-sm text-orange-600 font-medium">CO2 Emissions</p>
              <p className="text-2xl font-bold text-orange-700">
                {result.emissionEstimate.toFixed(2)} kg
              </p>
            </div>
          </div>

          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <p className="text-green-800">{result.ecoSuggestion}</p>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <p className="text-sm text-gray-600">
              <strong>From:</strong> {result.startLocation}
            </p>
            <p className="text-sm text-gray-600">
              <strong>To:</strong> {result.destination}
            </p>
            <p className="text-sm text-gray-600">
              <strong>Transport:</strong> {result.transportType}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default CommuteLogger;
