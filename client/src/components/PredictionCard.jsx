import { useState, useEffect, useMemo } from 'react';
import API from '../api/axios';

const PredictionCard = () => {
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [calendarLoading, setCalendarLoading] = useState(false);
  const [calendarError, setCalendarError] = useState('');
  const [dailyEmissions, setDailyEmissions] = useState({});
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  useEffect(() => {
    if (!isCalendarOpen) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isCalendarOpen]);

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

  const formatDateKey = (dateObj) => {
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const fetchCalendarData = async () => {
    setCalendarLoading(true);
    setCalendarError('');

    try {
      const { data } = await API.get('/commute/history');
      const trips = data?.data || [];
      const grouped = {};

      trips.forEach((trip) => {
        const tripDate = new Date(trip.createdAt);
        if (Number.isNaN(tripDate.getTime())) return;

        const key = formatDateKey(tripDate);
        const emission = Number(trip.emissionEstimate || 0);
        grouped[key] = (grouped[key] || 0) + emission;
      });

      setDailyEmissions(grouped);
    } catch (err) {
      setCalendarError(err.response?.data?.message || 'Failed to load calendar data');
    } finally {
      setCalendarLoading(false);
    }
  };

  const openCalendar = async () => {
    setIsCalendarOpen(true);
    if (Object.keys(dailyEmissions).length === 0 && !calendarLoading) {
      await fetchCalendarData();
    }
  };

  const monthGrid = useMemo(() => {
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();
    const cells = [];

    for (let i = 0; i < firstDay; i += 1) {
      cells.push(null);
    }

    for (let day = 1; day <= totalDays; day += 1) {
      cells.push(new Date(year, month, day));
    }

    while (cells.length % 7 !== 0) {
      cells.push(null);
    }

    return cells;
  }, [calendarMonth]);

  const emissionValues = useMemo(() => {
    return Object.values(dailyEmissions).filter((value) => Number.isFinite(value));
  }, [dailyEmissions]);

  const getEmissionBand = (value) => {
    if (value == null) return 'none';
    if (emissionValues.length < 3) {
      if (value <= 2) return 'low';
      if (value >= 6) return 'high';
      return 'medium';
    }

    const sorted = [...emissionValues].sort((a, b) => a - b);
    const lowThreshold = sorted[Math.floor((sorted.length - 1) * 0.33)];
    const highThreshold = sorted[Math.floor((sorted.length - 1) * 0.66)];

    if (value <= lowThreshold) return 'low';
    if (value >= highThreshold) return 'high';
    return 'medium';
  };

  const getDayStyle = (value) => {
    const band = getEmissionBand(value);
    if (band === 'high') return 'border-red-300 bg-red-100 text-red-800';
    if (band === 'low') return 'border-green-300 bg-green-100 text-green-800';
    if (band === 'medium') return 'border-amber-300 bg-amber-100 text-amber-800';
    return 'border-slate-200 bg-slate-50 text-slate-500';
  };

  const isToday = (dateObj) => {
    const today = new Date();
    return (
      dateObj.getFullYear() === today.getFullYear() &&
      dateObj.getMonth() === today.getMonth() &&
      dateObj.getDate() === today.getDate()
    );
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
          prediction.predictionType === 'MonthlyProjection' ? (
            <button
              type="button"
              onClick={openCalendar}
              className={`inline-flex w-fit items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold shadow-sm transition hover:bg-emerald-100 ${getPredictionTypeLabel(prediction.predictionType).color}`}
            >
              <span className="material-icons" style={{fontSize: '18px'}}>{getPredictionTypeLabel(prediction.predictionType).icon}</span>
              {getPredictionTypeLabel(prediction.predictionType).label}
            </button>
          ) : (
            <span className={`inline-flex w-fit items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold shadow-sm ${getPredictionTypeLabel(prediction.predictionType).color}`}>
              <span className="material-icons" style={{fontSize: '18px'}}>{getPredictionTypeLabel(prediction.predictionType).icon}</span>
              {getPredictionTypeLabel(prediction.predictionType).label}
            </span>
          )
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

      {isCalendarOpen && (
        <div
          className="fixed inset-0 z-3000 flex items-start justify-center overflow-hidden bg-black/50 p-3 pt-20 sm:p-4 sm:pt-24"
          onClick={() => setIsCalendarOpen(false)}
        >
          <div
            className="w-full max-w-4xl overflow-hidden rounded-3xl border border-emerald-200 bg-white p-4 shadow-2xl sm:p-5"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <h4 className="text-lg font-bold text-emerald-900 sm:text-xl">Carbon Emission Calendar</h4>
              </div>
              <button
                type="button"
                onClick={() => setIsCalendarOpen(false)}
                className="rounded-full border border-red-200 bg-red-50 p-2 text-red-600 transition hover:bg-red-100"
                aria-label="Close calendar"
              >
                <span className="material-icons" style={{ fontSize: '18px' }}>close</span>
              </button>
            </div>

            <div className="mb-3 flex items-center justify-between rounded-2xl border border-emerald-100 bg-emerald-50/60 p-2.5 sm:p-3">
              <button
                type="button"
                onClick={() => setCalendarMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))}
                className="rounded-full border border-emerald-200 bg-white px-3 py-1 text-sm font-semibold text-emerald-800 transition hover:bg-emerald-100"
              >
                Prev
              </button>
              <p className="text-sm font-bold text-emerald-900 sm:text-base">
                {calendarMonth.toLocaleString('en-US', { month: 'long', year: 'numeric' })}
              </p>
              <button
                type="button"
                onClick={() => setCalendarMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))}
                className="rounded-full border border-emerald-200 bg-white px-3 py-1 text-sm font-semibold text-emerald-800 transition hover:bg-emerald-100"
              >
                Next
              </button>
            </div>

            {calendarLoading ? (
              <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-8 text-center text-emerald-700">
                Loading calendar data...
              </div>
            ) : calendarError ? (
              <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
                {calendarError}
              </div>
            ) : (
              <>
                <div className="mb-1.5 grid grid-cols-7 gap-1 text-center text-[11px] font-bold uppercase tracking-wider text-emerald-700 sm:text-xs">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                    <div key={day}>{day}</div>
                  ))}
                </div>

                <div className="grid grid-cols-7 gap-1">
                  {monthGrid.map((cellDate, index) => {
                    if (!cellDate) {
                      return <div key={`empty-${index}`} className="h-14 rounded-xl border border-transparent sm:h-16" />;
                    }

                    const key = formatDateKey(cellDate);
                    const emission = dailyEmissions[key];

                    return (
                      <div
                        key={key}
                        className={`h-14 rounded-xl border p-1.5 shadow-sm sm:h-16 sm:p-2 ${getDayStyle(emission)} ${isToday(cellDate) ? 'ring-2 ring-emerald-400' : ''}`}
                        title={emission != null ? `${emission.toFixed(2)} kg CO₂` : 'No data'}
                      >
                        <div className="text-xs font-bold sm:text-sm">{cellDate.getDate()}</div>
                        <div className="mt-1 text-[11px] font-semibold sm:text-xs">
                          {emission != null ? `${emission.toFixed(1)} kg` : 'No data'}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-2 text-xs font-semibold text-gray-700">
                  <span className="inline-flex items-center gap-1"><span className="h-3 w-3 rounded-full bg-green-500"></span> Low</span>
                  <span className="inline-flex items-center gap-1"><span className="h-3 w-3 rounded-full bg-amber-500"></span> Medium</span>
                  <span className="inline-flex items-center gap-1"><span className="h-3 w-3 rounded-full bg-red-500"></span> High</span>
                  <span className="inline-flex items-center gap-1"><span className="h-3 w-3 rounded-full bg-slate-300"></span> No data</span>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PredictionCard;
