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
        return 'trending_up';
      case 'Decreasing':
        return 'trending_down';
      case 'Stable':
        return 'trending_flat';
      default:
        return 'query_stats';
    }
  };

  const getRiskIcon = (riskLevel) => {
    switch (riskLevel) {
      case 'Low':
        return 'check_circle';
      case 'Medium':
        return 'warning';
      case 'High':
        return 'cancel';
      default:
        return 'query_stats';
    }
  };

  const getPredictionTypeLabel = (predictionType) => {
    switch (predictionType) {
      case 'Regression':
        return { icon: 'show_chart', label: 'Linear Regression', color: 'text-indigo-700' };
      case 'MonthlyProjection':
        return { icon: 'event', label: 'Monthly Projection', color: 'text-teal-700' };
      case 'DailyProjection':
        return { icon: 'analytics', label: 'Daily Projection', color: 'text-orange-700' };
      default:
        return { icon: 'assessment', label: 'Prediction', color: 'text-gray-700' };
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
      <div className="overflow-hidden rounded-2xl border-2 border-emerald-100 bg-linear-to-br from-white to-emerald-50/40 p-6 shadow-lg">
        <div className="animate-pulse space-y-4">
          <div className="flex items-center justify-between">
            <div className="h-7 w-2/3 rounded bg-emerald-100"></div>
            <div className="h-9 w-32 rounded-full bg-emerald-100"></div>
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <div className="h-28 rounded-2xl bg-emerald-50"></div>
            <div className="h-28 rounded-2xl bg-green-50"></div>
            <div className="h-28 rounded-2xl bg-lime-50"></div>
          </div>
          <div className="h-24 rounded-2xl bg-gray-100"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="overflow-hidden rounded-2xl border-2 border-emerald-100 bg-linear-to-br from-white to-emerald-50/40 p-6 shadow-lg">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h3 className="flex items-center gap-2 text-2xl font-bold text-emerald-900">
            <span className="material-icons" style={{fontSize: '28px'}}>query_stats</span>
            Emission Prediction
          </h3>
        </div>
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-center shadow-sm">
          <span className="material-icons mb-3 block text-emerald-600" style={{fontSize: '40px'}}>info</span>
          <p className="text-emerald-900 font-medium">{error}</p>
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
    <div className="overflow-hidden rounded-2xl border-2 border-emerald-100 bg-linear-to-br from-white via-white to-emerald-50/30 p-5 shadow-lg sm:p-6">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600">Forecast</p>
          <h3 className="flex items-center gap-2 text-2xl font-bold text-emerald-900">
            <span className="material-icons" style={{fontSize: '28px'}}>assessment</span>
            Next Month Emission Prediction
          </h3>
        </div>
        {prediction.predictionType && (
          <span className={`inline-flex w-fit items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold shadow-sm ${getPredictionTypeLabel(prediction.predictionType).color}`}>
            <span className="material-icons" style={{fontSize: '18px'}}>{getPredictionTypeLabel(prediction.predictionType).icon}</span>
            {getPredictionTypeLabel(prediction.predictionType).label}
          </span>
        )}
      </div>
      
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {/* Predicted Emission */}
        <div className="group rounded-2xl border-2 border-emerald-200 bg-linear-to-br from-emerald-50 via-white to-emerald-100 p-5 shadow-md transition-all duration-300 hover:border-emerald-400 hover:shadow-lg">
          <div className="mb-3 flex items-center justify-between">
            <h4 className="text-sm font-bold uppercase tracking-wider text-emerald-700">Predicted Emission</h4>
            <span className="material-icons text-emerald-600" style={{fontSize: '24px'}}>co2</span>
          </div>
          <p className="text-3xl font-bold text-emerald-900">
            {prediction.predictedEmission}
            <span className="text-lg ml-1">kg CO₂</span>
          </p>
        </div>

        {/* Trend */}
        <div className="group rounded-2xl border-2 border-green-200 bg-linear-to-br from-green-50 via-white to-emerald-100 p-5 shadow-md transition-all duration-300 hover:border-green-400 hover:shadow-lg">
          <div className="mb-3 flex items-center justify-between">
            <h4 className="text-sm font-bold uppercase tracking-wider text-green-700">Trend</h4>
            <span className="material-icons text-green-600" style={{fontSize: '24px'}}>show_chart</span>
          </div>
          <p className="flex items-center gap-3 text-3xl font-bold text-green-900">
            <span className="material-icons" style={{fontSize: '32px'}}>{getTrendIcon(prediction.trend)}</span>
            {prediction.trend}
          </p>
        </div>

        {/* Risk Level */}
        <div className={`group rounded-2xl border-2 p-5 shadow-md transition-all duration-300 ${getRiskColor(prediction.riskLevel)}`}>
          <div className="mb-3 flex items-center justify-between">
            <h4 className="text-sm font-bold uppercase tracking-wider">Risk Level</h4>
            <span className="material-icons" style={{fontSize: '24px'}}>security</span>
          </div>
          <p className="flex items-center gap-3 text-3xl font-bold">
            <span className="material-icons" style={{fontSize: '32px'}}>{getRiskIcon(prediction.riskLevel)}</span>
            {prediction.riskLevel}
          </p>
        </div>
      </div>

      {/* Info Section */}
      <div className="mt-4 rounded-2xl border border-emerald-100 bg-emerald-50/60 p-5 shadow-sm">
        <p className="flex items-start gap-2 text-sm text-gray-700">
          <span className="material-icons mt-0.5 text-emerald-700" style={{fontSize: '18px'}}>info</span>
          <span><strong>How it works:</strong> {getPredictionDescription(prediction.predictionType)}</span>
        </p>
        {prediction.riskLevel === 'High' && (
          <p className="mt-3 flex items-start gap-2 text-sm text-red-700">
            <span className="material-icons mt-0.5 text-red-600" style={{fontSize: '18px'}}>lightbulb</span>
            <span><strong>Tip:</strong> Your predicted emissions are high. Consider using public transport 
            or eco-friendly alternatives to reduce your carbon footprint!
            </span>
          </p>
        )}
        {prediction.riskLevel === 'Low' && (
          <p className="mt-3 flex items-start gap-2 text-sm text-green-700">
            <span className="material-icons mt-0.5 text-green-600" style={{fontSize: '18px'}}>celebration</span>
            <span><strong>Great job!</strong> Your carbon footprint is low. Keep up the excellent work!</span>
          </p>
        )}
      </div>
    </div>
  );
};

export default PredictionCard;
