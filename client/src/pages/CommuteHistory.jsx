import { useState, useEffect } from 'react';
import API from '../api/axios';

const CommuteHistory = () => {
  const [history, setHistory] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('history'); // 'history' or 'summary'

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    setError('');

    try {
      if (activeTab === 'history') {
        const { data } = await API.get('/commute/history');
        setHistory(data.data);
      } else {
        const { data } = await API.get('/commute/emission-summary');
        setSummary(data.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getTransportIcon = (type) => {
    const icons = {
      Car: '🚗',
      Bus: '🚌',
      Train: '🚆',
      Bike: '🚴',
      Walk: '🚶',
    };
    return icons[type] || '🚗';
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">📊 Commute Analytics</h2>

      {/* Tab Navigation */}
      <div className="flex space-x-2 mb-6 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('history')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'history'
              ? 'border-b-2 border-green-600 text-green-600'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          History
        </button>
        <button
          onClick={() => setActiveTab('summary')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'summary'
              ? 'border-b-2 border-green-600 text-green-600'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          Summary
        </button>
      </div>

      {loading ? (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      ) : error ? (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      ) : activeTab === 'history' ? (
        <div>
          {history.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No commute history yet. Start logging your trips!</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Route
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Transport
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Distance
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Duration
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      CO2
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {history.map((trip) => (
                    <tr key={trip._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(trip.createdAt)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        <div className="max-w-xs truncate">
                          {trip.startLocation} → {trip.destination}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {getTransportIcon(trip.transportType)} {trip.transportType}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {trip.distance.toFixed(2)} km
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {trip.duration.toFixed(0)} min
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <span
                          className={`${
                            trip.emissionEstimate === 0
                              ? 'text-green-600'
                              : trip.emissionEstimate < 5
                              ? 'text-yellow-600'
                              : 'text-orange-600'
                          }`}
                        >
                          {trip.emissionEstimate.toFixed(2)} kg
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        // Summary Tab
        <div>
          {summary && (
            <div className="space-y-6">
              {/* Overall Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <p className="text-sm text-blue-600 font-medium">Total Trips</p>
                  <p className="text-3xl font-bold text-blue-700">{summary.totalCommutes}</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <p className="text-sm text-green-600 font-medium">Total Distance</p>
                  <p className="text-3xl font-bold text-green-700">
                    {summary.totalDistance} km
                  </p>
                </div>
                <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                  <p className="text-sm text-orange-600 font-medium">Total Emissions</p>
                  <p className="text-3xl font-bold text-orange-700">
                    {summary.totalEmissions} kg CO2
                  </p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                  <p className="text-sm text-purple-600 font-medium">Total Time</p>
                  <p className="text-3xl font-bold text-purple-700">
                    {(summary.totalDuration / 60).toFixed(1)} hrs
                  </p>
                </div>
              </div>

              {/* Transport Breakdown */}
              <div>
                <h3 className="text-lg font-bold text-gray-800 mb-4">Transport Breakdown</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                  {Object.entries(summary.transportBreakdown).map(([type, data]) => (
                    <div
                      key={type}
                      className="bg-white border-2 border-gray-200 rounded-lg p-4 hover:shadow-md transition"
                    >
                      <div className="text-center">
                        <div className="text-4xl mb-2">{getTransportIcon(type)}</div>
                        <h4 className="font-semibold text-gray-800">{type}</h4>
                        <div className="mt-2 space-y-1 text-sm text-gray-600">
                          <p>Trips: {data.count}</p>
                          <p>Distance: {data.distance} km</p>
                          <p className={data.emissions === 0 ? 'text-green-600 font-medium' : ''}>
                            CO2: {data.emissions} kg
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Environmental Impact */}
              <div className="bg-gradient-to-r from-green-50 to-blue-50 p-6 rounded-lg border border-green-200">
                <h3 className="text-lg font-bold text-gray-800 mb-2">🌍 Environmental Impact</h3>
                <p className="text-gray-700">
                  You have traveled a total of <strong>{summary.totalDistance} km</strong>, producing{' '}
                  <strong>{summary.totalEmissions} kg of CO2</strong>.
                </p>
                {summary.totalEmissions > 0 && (
                  <p className="mt-2 text-gray-600 text-sm">
                    💡 Tip: By switching to bike or walk for short trips, you could significantly reduce
                    your carbon footprint!
                  </p>
                )}
                {summary.totalEmissions === 0 && (
                  <p className="mt-2 text-green-600 font-medium">
                    🌟 Amazing! You have zero carbon emissions from your logged commutes!
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CommuteHistory;
