const EMISSION_FACTORS = require("../utils/emissionFactors");

// 1️⃣ Calculate emission for selected vehicle
const calculateEmission = (vehicleType, distance) => {
  const factor = EMISSION_FACTORS[vehicleType];

  if (!factor && factor !== 0) {
    throw new Error("Invalid vehicle type");
  }

  return factor * distance;
};

// 2️⃣ Compare selected vehicle with all options
const compareAllOptions = (selectedVehicle, distance) => {
  const selectedEmission = calculateEmission(selectedVehicle, distance);

  const comparisons = Object.keys(EMISSION_FACTORS).map((vehicle) => {
    const emission = calculateEmission(vehicle, distance);

    return {
      vehicle,
      emission,
      difference: selectedEmission - emission, 
      // positive = selected is worse
      // negative = selected is better
    };
  });

  return {
    selectedEmission,
    comparisons
  };
};

// 3️⃣ Calculate efficiency score (0 - 100)
const calculateEfficiencyScore = (selectedEmission, distance) => {
  const worstEmission = Math.max(
    ...Object.values(EMISSION_FACTORS).map(
      (factor) => factor * distance
    )
  );

  if (worstEmission === 0) return 100;

  const score =
    ((worstEmission - selectedEmission) / worstEmission) * 100;

  return Math.round(score);
};

// 4️⃣ Calculate how much emission saved compared to worst option
const calculateEmissionSaved = (selectedVehicle, distance) => {
  const selectedEmission = calculateEmission(selectedVehicle, distance);

  const worstEmission = Math.max(
    ...Object.values(EMISSION_FACTORS).map(
      (factor) => factor * distance
    )
  );

  return worstEmission - selectedEmission;
};

// 5️⃣ Generate smart recommendation
const generateRecommendation = (selectedVehicle, distance) => {
  const { comparisons } = compareAllOptions(selectedVehicle, distance);

  const betterOptions = comparisons
    .filter((c) => c.difference > 0)
    .sort((a, b) => b.difference - a.difference);

  if (betterOptions.length === 0) {
    return "Excellent choice! This is already one of the most eco-friendly options.";
  }

  return `Consider switching to ${betterOptions[0].vehicle} to reduce more emissions.`;
};

module.exports = {
  EMISSION_FACTORS,
  calculateEmission,
  compareAllOptions,
  calculateEfficiencyScore,
  calculateEmissionSaved,
  generateRecommendation
};