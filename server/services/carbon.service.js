const {
  emissionFactors: EMISSION_FACTORS,
} = require("../utils/emissionFactors");

const BASELINE_VEHICLE = "PETROL_CAR";

// 1️⃣ Calculate emission for selected vehicle
const calculateEmission = (vehicleType, distance) => {
  const factor = EMISSION_FACTORS[vehicleType];

  if (!factor && factor !== 0) {
    const error = new Error("Invalid vehicle type");
    error.status = 400;
    throw error;
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
    comparisons,
  };
};

// 3️⃣ Calculate efficiency score (0 - 100)
const calculateEfficiencyScore = (selectedEmission, distance) => {
  const worstEmission = Math.max(
    ...Object.values(EMISSION_FACTORS).map((factor) => factor * distance),
  );

  if (worstEmission === 0) return 100;

  const score = ((worstEmission - selectedEmission) / worstEmission) * 100;

  return Math.round(score);
};

// 4️⃣ Calculate how much emission saved compared to worst option
const calculateEmissionSaved = (selectedVehicle, distance) => {
  const selectedEmission = calculateEmission(selectedVehicle, distance);
  const baselineEmission = calculateEmission(BASELINE_VEHICLE, distance);

  return Math.max(0, baselineEmission - selectedEmission);
};

// 5️⃣ Return the best possible option against a baseline car
const getGreenestOption = (distance) => {
  const baselineEmission = calculateEmission(BASELINE_VEHICLE, distance);

  let bestOption = BASELINE_VEHICLE;
  let lowestEmission = baselineEmission;

  Object.entries(EMISSION_FACTORS).forEach(([vehicle, factor]) => {
    const emission = factor * distance;
    if (emission < lowestEmission) {
      lowestEmission = emission;
      bestOption = vehicle;
    }
  });

  return {
    bestOption,
    potentialSaving: Math.max(0, baselineEmission - lowestEmission),
  };
};

// 6️⃣ Generate smart recommendation
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
  getGreenestOption,
  generateRecommendation,
};
