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
      <div className="overflow-hidden rounded-2xl border border-emerald-100 bg-white p-6 shadow-lg">
        <div className="animate-pulse space-y-4">
          <div className="h-7 w-2/3 rounded bg-emerald-100"></div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <div className="h-28 rounded-xl bg-emerald-50"></div>
            <div className="h-28 rounded-xl bg-green-50"></div>
            <div className="h-28 rounded-xl bg-lime-50"></div>
          </div>
          <div className="h-20 rounded-xl bg-gray-100"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="overflow-hidden rounded-2xl border border-emerald-100 bg-white p-6 shadow-lg">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-2xl font-bold text-emerald-900">Emission Prediction</h3>
        </div>
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5 text-center">
          <p className="text-emerald-900">{error}</p>
          <p className="mt-2 text-sm text-emerald-700">
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
    <div className="overflow-hidden rounded-2xl border border-emerald-100 bg-white p-5 shadow-lg sm:p-6">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600">Forecast</p>
          <h3 className="text-2xl font-bold text-emerald-900">📊 Next Month Emission Prediction</h3>
        </div>
        {prediction.predictionType && (
          <span className={`w-fit rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-sm font-semibold ${getPredictionTypeLabel(prediction.predictionType).color}`}>
            {getPredictionTypeLabel(prediction.predictionType).icon} {getPredictionTypeLabel(prediction.predictionType).label}
          </span>
        )}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Predicted Emission */}
        <div className="rounded-xl border border-emerald-200 bg-linear-to-br from-emerald-50 to-green-100 p-5">
          <h4 className="mb-2 text-sm font-semibold text-emerald-700">Predicted Emission</h4>
          <p className="text-3xl font-bold text-emerald-900">
            {prediction.predictedEmission}
            <span className="text-lg ml-1">kg CO₂</span>
          </p>
        </div>

        {/* Trend */}
        <div className="rounded-xl border border-green-200 bg-linear-to-br from-green-50 to-emerald-100 p-5">
          <h4 className="mb-2 text-sm font-semibold text-green-700">Trend</h4>
          <p className="flex items-center gap-2 text-3xl font-bold text-green-900">
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
      <div className="mt-4 rounded-xl border border-emerald-100 bg-emerald-50/50 p-4">
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
