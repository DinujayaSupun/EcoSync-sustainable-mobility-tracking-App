/**
 * Helper utilities for Smart Commute module
 */

/**
 * Format distance for display
 * @param {number} distance - Distance in km
 * @returns {string} Formatted distance
 */
function formatDistance(distance) {
  if (distance < 1) {
    return `${(distance * 1000).toFixed(0)} m`;
  }
  return `${distance.toFixed(2)} km`;
}

/**
 * Format duration for display
 * @param {number} minutes - Duration in minutes
 * @returns {string} Formatted duration
 */
function formatDuration(minutes) {
  if (minutes < 60) {
    return `${Math.round(minutes)} min`;
  }
  
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  
  if (mins === 0) {
    return `${hours} hr`;
  }
  
  return `${hours} hr ${mins} min`;
}

/**
 * Format CO2 emissions for display
 * @param {number} co2 - CO2 in kg
 * @returns {string} Formatted CO2
 */
function formatCO2(co2) {
  if (co2 < 1) {
    return `${(co2 * 1000).toFixed(0)} g`;
  }
  return `${co2.toFixed(2)} kg`;
}

/**
 * Calculate percentage difference
 * @param {number} value1 - First value
 * @param {number} value2 - Second value
 * @returns {number} Percentage difference
 */
function calculatePercentageDiff(value1, value2) {
  if (value2 === 0) return 0;
  return ((value1 - value2) / value2) * 100;
}

/**
 * Calculate moving average
 * @param {Array<number>} values - Array of values
 * @param {number} window - Window size
 * @returns {Array<number>} Moving average
 */
function calculateMovingAverage(values, window = 7) {
  if (!Array.isArray(values) || values.length === 0) {
    return [];
  }

  const result = [];
  for (let i = 0; i < values.length; i++) {
    const start = Math.max(0, i - window + 1);
    const subset = values.slice(start, i + 1);
    const avg = subset.reduce((sum, val) => sum + val, 0) / subset.length;
    result.push(avg);
  }
  
  return result;
}

/**
 * Group data by date
 * @param {Array<Object>} data - Array of objects with date field
 * @param {string} dateField - Name of date field
 * @returns {Object} Grouped data
 */
function groupByDate(data, dateField = 'date') {
  return data.reduce((acc, item) => {
    const date = new Date(item[dateField]).toISOString().split('T')[0];
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(item);
    return acc;
  }, {});
}

/**
 * Calculate statistics for an array of numbers
 * @param {Array<number>} values - Array of numbers
 * @returns {Object} Statistics (min, max, avg, sum, count)
 */
function calculateStats(values) {
  if (!Array.isArray(values) || values.length === 0) {
    return { min: 0, max: 0, avg: 0, sum: 0, count: 0 };
  }

  const sum = values.reduce((acc, val) => acc + val, 0);
  const count = values.length;
  const avg = sum / count;
  const min = Math.min(...values);
  const max = Math.max(...values);

  return {
    min: parseFloat(min.toFixed(2)),
    max: parseFloat(max.toFixed(2)),
    avg: parseFloat(avg.toFixed(2)),
    sum: parseFloat(sum.toFixed(2)),
    count,
  };
}

/**
 * Get date range for analysis
 * @param {number} days - Number of days to go back
 * @returns {Object} Start and end dates
 */
function getDateRange(days = 30) {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  return {
    startDate,
    endDate,
  };
}

/**
 * Calculate carbon savings
 * @param {number} actualCO2 - Actual CO2 emissions
 * @param {number} alternativeCO2 - Alternative CO2 emissions
 * @returns {Object} Savings data
 */
function calculateCarbonSavings(actualCO2, alternativeCO2) {
  const saved = alternativeCO2 - actualCO2;
  const percentage = alternativeCO2 > 0 
    ? ((saved / alternativeCO2) * 100) 
    : 0;

  return {
    savedKg: parseFloat(saved.toFixed(2)),
    percentageSaved: parseFloat(percentage.toFixed(2)),
    actualCO2: parseFloat(actualCO2.toFixed(2)),
    alternativeCO2: parseFloat(alternativeCO2.toFixed(2)),
  };
}

/**
 * Convert transport mode to display name
 * @param {string} mode - Transport mode
 * @returns {string} Display name
 */
function getTransportDisplayName(mode) {
  const displayNames = {
    CAR: 'Car',
    PETROL_CAR: 'Petrol Car',
    DIESEL_CAR: 'Diesel Car',
    ELECTRIC_CAR: 'Electric Car',
    HYBRID_CAR: 'Hybrid Car',
    BUS: 'Bus',
    TRAIN: 'Train',
    METRO: 'Metro',
    TRAM: 'Tram',
    CYCLING: 'Cycling',
    WALKING: 'Walking',
    MOTORCYCLE: 'Motorcycle',
    CARPOOL: 'Carpool',
    TAXI: 'Taxi',
  };

  const normalizedMode = mode.toUpperCase().replace(/\s+/g, '_');
  return displayNames[normalizedMode] || mode;
}

/**
 * Get recommendation based on conditions
 * @param {Object} conditions - Conditions object
 * @returns {string} Recommendation
 */
function getRecommendation(conditions) {
  const { distance, weatherCondition, trafficLevel, userPreference } = conditions;

  // Short distance recommendations
  if (distance < 2) {
    if (weatherCondition === 'Clear') {
      return 'Walking or cycling recommended for this short distance';
    }
    return 'Consider using a bus or shared transport';
  }

  // Medium distance recommendations
  if (distance < 10) {
    if (weatherCondition === 'Rain') {
      return 'Public transport recommended due to weather';
    }
    if (trafficLevel === 'High' || trafficLevel === 'Very High') {
      return 'Consider metro or train to avoid traffic';
    }
    return 'Cycling or public transport recommended';
  }

  // Long distance recommendations
  if (trafficLevel === 'High' || trafficLevel === 'Very High') {
    return 'Train or metro recommended to avoid heavy traffic';
  }

  return 'Public transport or carpool recommended for long distances';
}

/**
 * Generate heat map color based on CO2 level
 * @param {number} co2Level - CO2 level in kg
 * @returns {string} Color code
 */
function getHeatMapColor(co2Level) {
  if (co2Level < 50) return '#00FF00';      // Green - Low
  if (co2Level < 100) return '#FFFF00';    // Yellow - Medium
  if (co2Level < 200) return '#FFA500';    // Orange - High
  if (co2Level < 500) return '#FF4500';    // Orange-Red - Very High
  return '#FF0000';                         // Red - Critical
}

/**
 * Round to nearest decimal places
 * @param {number} value - Value to round
 * @param {number} decimals - Number of decimal places
 * @returns {number} Rounded value
 */
function roundTo(value, decimals = 2) {
  return parseFloat(value.toFixed(decimals));
}

module.exports = {
  formatDistance,
  formatDuration,
  formatCO2,
  calculatePercentageDiff,
  calculateMovingAverage,
  groupByDate,
  calculateStats,
  getDateRange,
  calculateCarbonSavings,
  getTransportDisplayName,
  getRecommendation,
  getHeatMapColor,
  roundTo,
};
