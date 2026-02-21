/**
 * Emission Prediction Utility
 * Implements multiple prediction strategies based on available data
 */

/**
 * Calculate linear regression coefficients (slope and intercept)
 * @param {Array} monthlyData - Array of objects with {month: number, emission: number}
 * @returns {Object} - {slope: number, intercept: number, nextMonthPrediction: number, trend: string, predictionType: string}
 */
const calculateLinearRegression = (monthlyData) => {
  const n = monthlyData.length;
  
  if (n < 2) {
    throw new Error('Insufficient data for linear regression. Need at least 2 months of data.');
  }

  // Extract x (month indices) and y (emissions)
  const x = monthlyData.map((_, index) => index + 1); // [1, 2, 3, ...]
  const y = monthlyData.map(data => data.emission);

  // Calculate means
  const meanX = x.reduce((sum, val) => sum + val, 0) / n;
  const meanY = y.reduce((sum, val) => sum + val, 0) / n;

  // Calculate slope (m) and intercept (b)
  let numerator = 0;
  let denominator = 0;

  for (let i = 0; i < n; i++) {
    numerator += (x[i] - meanX) * (y[i] - meanY);
    denominator += (x[i] - meanX) ** 2;
  }

  const slope = numerator / denominator;
  const intercept = meanY - slope * meanX;

  // Predict next month (n + 1)
  const nextMonth = n + 1;
  const nextMonthPrediction = slope * nextMonth + intercept;

  // Determine trend
  let trend;
  if (slope > 0.5) {
    trend = 'Increasing';
  } else if (slope < -0.5) {
    trend = 'Decreasing';
  } else {
    trend = 'Stable';
  }

  return {
    slope: parseFloat(slope.toFixed(2)),
    intercept: parseFloat(intercept.toFixed(2)),
    nextMonthPrediction: Math.max(0, parseFloat(nextMonthPrediction.toFixed(2))), // Ensure non-negative
    trend,
    predictionType: 'Regression',
  };
};

/**
 * Calculate prediction based on single month data
 * @param {number} monthlyEmission - Single month's total emission
 * @returns {Object} - {nextMonthPrediction: number, trend: string, predictionType: string}
 */
const calculateMonthlyProjection = (monthlyEmission) => {
  return {
    nextMonthPrediction: parseFloat(monthlyEmission.toFixed(2)),
    trend: 'Stable',
    predictionType: 'MonthlyProjection',
  };
};

/**
 * Calculate prediction based on partial month data (daily average)
 * @param {number} totalEmission - Total emission for partial month
 * @param {number} daysLogged - Number of days with logged commutes
 * @returns {Object} - {nextMonthPrediction: number, trend: string, predictionType: string}
 */
const calculateDailyProjection = (totalEmission, daysLogged) => {
  const dailyAverage = totalEmission / daysLogged;
  const projectedMonthlyEmission = dailyAverage * 30; // Project to 30 days

  return {
    nextMonthPrediction: Math.max(0, parseFloat(projectedMonthlyEmission.toFixed(2))),
    trend: 'Stable',
    predictionType: 'DailyProjection',
  };
};

/**
 * Categorize risk level based on predicted emission
 * @param {number} predictedEmission - Predicted emission value
 * @returns {string} - Risk level: 'Low', 'Medium', or 'High'
 */
const categorizeRisk = (predictedEmission) => {
  if (predictedEmission < 50) {
    return 'Low';
  } else if (predictedEmission >= 50 && predictedEmission <= 150) {
    return 'Medium';
  } else {
    return 'High';
  }
};

module.exports = {
  calculateLinearRegression,
  calculateMonthlyProjection,
  calculateDailyProjection,
  categorizeRisk,
};
