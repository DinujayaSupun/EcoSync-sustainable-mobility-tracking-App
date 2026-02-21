import { useState } from 'react';
import API from '../api/axios';
import LocationAutocomplete from '../components/LocationAutocomplete';

const CommuteLogger = () => {
  const [formData, setFormData] = useState({
    startLocation: '',
    destination: '',
    transportType: 'Car',
  });

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
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
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to log commute. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">🚗 Smart Commute Logger</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <LocationAutocomplete
          name="startLocation"
          value={formData.startLocation}
          onChange={handleChange}
          placeholder="e.g., New York, NY"
          label="Start Location"
          required
        />

        <LocationAutocomplete
          name="destination"
          value={formData.destination}
          onChange={handleChange}
          placeholder="e.g., Boston, MA"
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
