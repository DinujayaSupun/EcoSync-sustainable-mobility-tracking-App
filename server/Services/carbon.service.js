const { emissionFactors } = require("../utils/emissionFactors");

const BASELINE = emissionFactors.PETROL_CAR;

// Calculate emission saved compared to petrol car
const calculateEmissionSaved = (vehicleType, distance) => {
  const vehicleEmission = emissionFactors[vehicleType];

  if (vehicleEmission === undefined) {
    const error = new Error("Invalid vehicle type");
    error.status = 400;
    throw error;
  }

  const saved = (BASELINE - vehicleEmission) * distance;

  return saved < 0 ? 0 : saved;
};

// Determine greenest possible option
const getGreenestOption = (distance) => {
  let bestOption = null;
  let maxSaved = -Infinity;

  for (const type in emissionFactors) {
    const saved = (BASELINE - emissionFactors[type]) * distance;

    if (saved > maxSaved) {
      maxSaved = saved;
      bestOption = type;
    }
  }

  return {
    bestOption,
    potentialSaving: maxSaved < 0 ? 0 : maxSaved,
  };
};

module.exports = {
  calculateEmissionSaved,
  getGreenestOption,
};
