/**
 * Validation utilities for Smart Commute module
 */

/**
 * Validate coordinates
 * @param {number} latitude - Latitude value
 * @param {number} longitude - Longitude value
 * @returns {Object} Validation result
 */
function validateCoordinates(latitude, longitude) {
  const errors = [];

  if (latitude === undefined || latitude === null) {
    errors.push('Latitude is required');
  } else if (typeof latitude !== 'number') {
    errors.push('Latitude must be a number');
  } else if (latitude < -90 || latitude > 90) {
    errors.push('Latitude must be between -90 and 90');
  }

  if (longitude === undefined || longitude === null) {
    errors.push('Longitude is required');
  } else if (typeof longitude !== 'number') {
    errors.push('Longitude must be a number');
  } else if (longitude < -180 || longitude > 180) {
    errors.push('Longitude must be between -180 and 180');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate distance
 * @param {number} distance - Distance in km
 * @returns {Object} Validation result
 */
function validateDistance(distance) {
  const errors = [];

  if (distance === undefined || distance === null) {
    errors.push('Distance is required');
  } else if (typeof distance !== 'number') {
    errors.push('Distance must be a number');
  } else if (distance < 0) {
    errors.push('Distance cannot be negative');
  } else if (distance > 10000) {
    errors.push('Distance seems unrealistic (max 10000 km)');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate transport mode
 * @param {string} mode - Transport mode
 * @returns {Object} Validation result
 */
function validateTransportMode(mode) {
  const validModes = [
    'Walking',
    'Cycling',
    'Bus',
    'Car',
    'Carpool',
    'Train',
    'Metro',
    'Motorcycle',
    'Electric Vehicle',
    'Taxi',
    'Tram',
  ];

  const errors = [];

  if (!mode) {
    errors.push('Transport mode is required');
  } else if (typeof mode !== 'string') {
    errors.push('Transport mode must be a string');
  } else if (!validModes.includes(mode)) {
    errors.push(`Invalid transport mode. Valid modes: ${validModes.join(', ')}`);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate date range
 * @param {Date|string} startDate - Start date
 * @param {Date|string} endDate - End date
 * @returns {Object} Validation result
 */
function validateDateRange(startDate, endDate) {
  const errors = [];

  const start = startDate ? new Date(startDate) : null;
  const end = endDate ? new Date(endDate) : null;

  if (start && isNaN(start.getTime())) {
    errors.push('Invalid start date');
  }

  if (end && isNaN(end.getTime())) {
    errors.push('Invalid end date');
  }

  if (start && end && start > end) {
    errors.push('Start date cannot be after end date');
  }

  if (start && start > new Date()) {
    errors.push('Start date cannot be in the future');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate weather condition
 * @param {string} condition - Weather condition
 * @returns {Object} Validation result
 */
function validateWeatherCondition(condition) {
  const validConditions = [
    'Clear',
    'Rain',
    'Clouds',
    'Snow',
    'Drizzle',
    'Thunderstorm',
    'Mist',
    'Fog',
  ];

  const errors = [];

  if (!condition) {
    errors.push('Weather condition is required');
  } else if (!validConditions.includes(condition)) {
    errors.push(`Invalid weather condition. Valid conditions: ${validConditions.join(', ')}`);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate pagination parameters
 * @param {number} page - Page number
 * @param {number} limit - Items per page
 * @returns {Object} Validation result
 */
function validatePagination(page, limit) {
  const errors = [];

  if (page !== undefined) {
    const pageNum = parseInt(page);
    if (isNaN(pageNum) || pageNum < 1) {
      errors.push('Page must be a positive integer');
    }
  }

  if (limit !== undefined) {
    const limitNum = parseInt(limit);
    if (isNaN(limitNum) || limitNum < 1) {
      errors.push('Limit must be a positive integer');
    } else if (limitNum > 100) {
      errors.push('Limit cannot exceed 100');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Sanitize location string
 * @param {string} location - Location string
 * @returns {string} Sanitized location
 */
function sanitizeLocation(location) {
  if (!location || typeof location !== 'string') {
    return '';
  }
  
  return location.trim().replace(/[<>]/g, '');
}

module.exports = {
  validateCoordinates,
  validateDistance,
  validateTransportMode,
  validateDateRange,
  validateWeatherCondition,
  validatePagination,
  sanitizeLocation,
};
