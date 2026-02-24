/**
 * Emission factors for different transport modes
 * Units: grams of CO2 per kilometer (g CO2/km)
 */
const emissionFactors = {
  // Existing factors
  PETROL_CAR: 120,
  ELECTRIC_BIKE: 10,
  BUS: 80,
  LUXURY_BUS: 60,
  TRAIN: 30,
  WALK: 0,
  
  // Additional factors for Smart Commute module
  CAR: 171,              // Average petrol car (g CO2/km)
  DIESEL_CAR: 164,       // Average diesel car
  HYBRID_CAR: 110,       // Hybrid vehicle
  ELECTRIC_CAR: 53,      // Electric vehicle (including electricity generation)
  MOTORCYCLE: 103,       // Average motorcycle
  SCOOTER: 72,           // Motor scooter
  
  CYCLING: 0,            // Bicycle (zero emissions)
  WALKING: 0,            // Walking (zero emissions)
  
  METRO: 41,             // Metro/Subway
  TRAM: 29,              // Tram
  
  CARPOOL_2: 85,         // Car with 2 passengers (171/2)
  CARPOOL_3: 57,         // Car with 3 passengers (171/3)
  CARPOOL_4: 43,         // Car with 4 passengers (171/4)
  
  TAXI: 180,             // Taxi (higher due to empty return trips)
  UBER_POOL: 95,         // Shared ride service
  
  // Public transport averages
  PUBLIC_TRANSIT: 89,    // Average public transport
};

/**
 * Fuel consumption rates (liters per 100 km)
 */
const fuelConsumption = {
  PETROL_CAR: 7.5,
  DIESEL_CAR: 6.5,
  HYBRID_CAR: 4.5,
  MOTORCYCLE: 4.0,
};

/**
 * CO2 emissions per liter of fuel (kg CO2/liter)
 */
const fuelEmissions = {
  PETROL: 2.31,          // kg CO2 per liter
  DIESEL: 2.68,          // kg CO2 per liter
  LPG: 1.51,             // kg CO2 per liter
  CNG: 1.85,             // kg CO2 per kg
};

/**
 * Get emission factor by transport mode
 * @param {string} mode - Transport mode
 * @returns {number} Emission factor in g CO2/km
 */
function getEmissionFactor(mode) {
  const normalizedMode = mode.toUpperCase().replace(/\s+/g, '_');
  return emissionFactors[normalizedMode] || emissionFactors.CAR;
}

/**
 * Calculate CO2 emissions for a trip
 * @param {number} distance - Distance in km
 * @param {string} mode - Transport mode
 * @returns {number} CO2 emissions in kg
 */
function calculateCO2(distance, mode) {
  const emissionFactor = getEmissionFactor(mode);
  return (distance * emissionFactor) / 1000; // Convert g to kg
}

/**
 * Calculate fuel cost
 * @param {number} distance - Distance in km
 * @param {string} fuelType - Type of fuel
 * @param {number} pricePerLiter - Fuel price per liter
 * @returns {number} Fuel cost
 */
function calculateFuelCost(distance, fuelType = 'PETROL_CAR', pricePerLiter = 1.5) {
  const consumption = fuelConsumption[fuelType] || fuelConsumption.PETROL_CAR;
  const litersUsed = (distance * consumption) / 100;
  return litersUsed * pricePerLiter;
}

/**
 * Check if transport mode is green/eco-friendly
 * @param {string} mode - Transport mode
 * @returns {boolean} True if green mode
 */
function isGreenTransport(mode) {
  const greenModes = ['WALKING', 'CYCLING', 'ELECTRIC_BIKE', 'ELECTRIC_CAR', 
                      'METRO', 'TRAIN', 'TRAM', 'BUS', 'PUBLIC_TRANSIT'];
  const normalizedMode = mode.toUpperCase().replace(/\s+/g, '_');
  return greenModes.includes(normalizedMode) || 
         emissionFactors[normalizedMode] <= 60; // Threshold for green transport
}

/**
 * Compare transport modes and provide recommendation
 * @param {number} distance - Distance in km
 * @param {Array<string>} modes - Array of transport modes to compare
 * @returns {Object} Comparison results
 */
function compareTransportModes(distance, modes = ['CAR', 'BUS', 'CYCLING']) {
  const comparisons = modes.map(mode => ({
    mode,
    co2: calculateCO2(distance, mode),
    emissionFactor: getEmissionFactor(mode),
    isGreen: isGreenTransport(mode),
  }));

  // Sort by CO2 emissions
  comparisons.sort((a, b) => a.co2 - b.co2);

  return {
    distance,
    comparisons,
    greenest: comparisons[0],
    dirtiest: comparisons[comparisons.length - 1],
  };
}

module.exports = {
  emissionFactors,
  fuelConsumption,
  fuelEmissions,
  getEmissionFactor,
  calculateCO2,
  calculateFuelCost,
  isGreenTransport,
  compareTransportModes,
};
