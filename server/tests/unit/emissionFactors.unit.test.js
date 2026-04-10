const {
  getEmissionFactor,
  calculateCO2,
  calculateFuelCost,
  isGreenTransport,
  compareTransportModes,
} = require("../../utils/emissionFactors");

describe("emissionFactors utility unit tests", () => {
  it("normalizes transport mode names", () => {
    expect(getEmissionFactor("electric bike")).toBe(10);
  });

  it("falls back to CAR when mode is unknown", () => {
    expect(getEmissionFactor("something-random")).toBe(171);
  });

  it("calculates CO2 in kg", () => {
    const co2 = calculateCO2(10, "BUS");
    expect(co2).toBe(0.8);
  });

  it("calculates fuel cost with default values", () => {
    const cost = calculateFuelCost(100);
    expect(cost).toBeCloseTo(11.25, 2);
  });

  it("classifies green transport correctly", () => {
    expect(isGreenTransport("WALKING")).toBe(true);
    expect(isGreenTransport("TAXI")).toBe(false);
  });

  it("compares transport modes sorted by lowest CO2", () => {
    const result = compareTransportModes(10, ["CAR", "BUS", "CYCLING"]);

    expect(result.greenest.mode).toBe("CYCLING");
    expect(result.dirtiest.mode).toBe("CAR");
    expect(result.comparisons[0].co2).toBeLessThanOrEqual(
      result.comparisons[1].co2,
    );
  });
});
