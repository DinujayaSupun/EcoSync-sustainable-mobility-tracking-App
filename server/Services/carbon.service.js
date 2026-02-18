const emissionFactors = require("../utils/emissionFactors");

const BASELINE = emissionFactors.PETROL_CAR;

const calculateEmissionSaved = (vehicleType, distance) => {
  const vehicleEmission = emissionFactors[vehicleType];

  if (vehicleEmission === undefined) {
    throw new Error("Invalid vehicle type");
  }

  return (BASELINE - vehicleEmission) * distance;
};

const getGreenestOption = (distance) => {
  let bestOption = null;
  let maxSaved = -Infinity;

  for (let type in emissionFactors) {
    const saved = (BASELINE - emissionFactors[type]) * distance;
    if (saved > maxSaved) {
      maxSaved = saved;
      bestOption = type;
    }
  }

  return {
    bestOption,
    potentialSaving: maxSaved,
  };
};

module.exports = {
  calculateEmissionSaved,
  getGreenestOption,
};
