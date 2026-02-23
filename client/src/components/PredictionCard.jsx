import { useState, useEffect } from 'react';
import API from '../api/axios';

const PredictionCard = () => {
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchPrediction();
  }, []);

  const fetchPrediction = async () => {
    setLoading(true);
    setError('');

    try {
      const { data } = await API.get('/commute/predict');
      setPrediction(data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load prediction');
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (riskLevel) => {
    switch (riskLevel) {
      case 'Low':
        return 'bg-green-50 border-green-300 text-green-800';
      case 'Medium':
        return 'bg-yellow-50 border-yellow-300 text-yellow-800';
      case 'High':
        return 'bg-red-50 border-red-300 text-red-800';
      default:
        return 'bg-gray-50 border-gray-300 text-gray-800';
    }
  };

  const getTrendIcon = (trend) => {
    switch (trend) {
      case 'Increasing':
        return '📈';
      case 'Decreasing':
        return '📉';
      case 'Stable':
        return '➡️';
      default:
        return '📊';
    }
  };

  const getRiskIcon = (riskLevel) => {
    switch (riskLevel) {
      case 'Low':
        return '✅';
      case 'Medium':
        return '⚠️';
      case 'High':
        return '❌';
      default:
        return '📊';
    }
  };

  const getPredictionTypeLabel = (predictionType) => {
    switch (predictionType) {
      case 'Regression':
        return { icon: '📈', label: 'Linear Regression', color: 'text-indigo-700' };
      case 'MonthlyProjection':
        return { icon: '📅', label: 'Monthly Projection', color: 'text-teal-700' };
      case 'DailyProjection':
        return { icon: '📊', label: 'Daily Projection', color: 'text-orange-700' };
      default:
        return { icon: '📊', label: 'Prediction', color: 'text-gray-700' };
    }
  };

  const getPredictionDescription = (predictionType) => {
    switch (predictionType) {
      case 'Regression':
        return 'Based on your commute history (2+ months), we use linear regression to predict your next month\'s carbon emissions. The trend shows whether your emissions are increasing, decreasing, or staying stable.';
      case 'MonthlyProjection':
        return 'Based on your single month of commute data, we project that next month\'s emissions will be similar. Log more commutes for trend analysis!';
      case 'DailyProjection':
        return 'Based on your partial month data, we calculated your daily average emission and projected it over 30 days. Keep logging to improve prediction accuracy!';
      default:
        return 'Prediction based on your commute history.';
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-3">📊 Emission Prediction</h3>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
          <p className="text-blue-800">{error}</p>
          <p className="text-sm text-blue-600 mt-2">
            Keep logging your commutes to see predictions!
          </p>
        </div>
      </div>
    );
  }

  if (!prediction) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-gray-800">📊 Next Month Emission Prediction</h3>
        {prediction.predictionType && (
          <span className={`text-sm font-semibold px-3 py-1 rounded-full bg-indigo-100 ${getPredictionTypeLabel(prediction.predictionType).color}`}>
            {getPredictionTypeLabel(prediction.predictionType).icon} {getPredictionTypeLabel(prediction.predictionType).label}
          </span>
        )}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Predicted Emission */}
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-5 rounded-lg border border-blue-200">
          <h4 className="text-sm font-semibold text-blue-700 mb-2">Predicted Emission</h4>
          <p className="text-3xl font-bold text-blue-900">
            {prediction.predictedEmission}
            <span className="text-lg ml-1">kg CO₂</span>
          </p>
        </div>

        {/* Trend */}
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-5 rounded-lg border border-purple-200">
          <h4 className="text-sm font-semibold text-purple-700 mb-2">Trend</h4>
          <p className="text-3xl font-bold text-purple-900 flex items-center gap-2">
            {getTrendIcon(prediction.trend)} {prediction.trend}
          </p>
        </div>

        {/* Risk Level */}
        <div className={`p-5 rounded-lg border-2 ${getRiskColor(prediction.riskLevel)}`}>
          <h4 className="text-sm font-semibold mb-2">Risk Level</h4>
          <p className="text-3xl font-bold flex items-center gap-2">
            {getRiskIcon(prediction.riskLevel)} {prediction.riskLevel}
          </p>
        </div>
      </div>

      {/* Info Section */}
      <div className="mt-4 bg-gray-50 rounded-lg p-4 border border-gray-200">
        <p className="text-sm text-gray-700">
          <strong>ℹ️ How it works:</strong> {getPredictionDescription(prediction.predictionType)}
        </p>
        {prediction.riskLevel === 'High' && (
          <p className="text-sm text-red-700 mt-2">
            <strong>💡 Tip:</strong> Your predicted emissions are high. Consider using public transport 
            or eco-friendly alternatives to reduce your carbon footprint!
          </p>
        )}
        {prediction.riskLevel === 'Low' && (
          <p className="text-sm text-green-700 mt-2">
            <strong>🌟 Great job!</strong> Your carbon footprint is low. Keep up the excellent work!
          </p>
        )}
      </div>
    </div>
  );
};

export default PredictionCard;
