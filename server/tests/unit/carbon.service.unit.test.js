const {
  calculateEmissionSaved,
  getGreenestOption,
} = require("../../services/carbon.service");

describe("carbon.service unit tests", () => {
  describe("calculateEmissionSaved", () => {
    it("returns saved emission for lower-emission transport", () => {
      const result = calculateEmissionSaved("TRAIN", 10);
      expect(result).toBe(900);
    });

    it("returns 0 when transport emits more than baseline", () => {
      const result = calculateEmissionSaved("CAR", 10);
      expect(result).toBe(0);
    });

    it("throws 400 error for invalid vehicle type", () => {
      expect(() => calculateEmissionSaved("UNKNOWN_VEHICLE", 10)).toThrow(
        "Invalid vehicle type",
      );

      try {
        calculateEmissionSaved("UNKNOWN_VEHICLE", 10);
      } catch (error) {
        expect(error.status).toBe(400);
      }
    });
  });

  describe("getGreenestOption", () => {
    it("returns a valid best option and positive saving", () => {
      const result = getGreenestOption(15);

      expect(result).toHaveProperty("bestOption");
      expect(result).toHaveProperty("potentialSaving");
      expect(typeof result.bestOption).toBe("string");
      expect(result.potentialSaving).toBeGreaterThanOrEqual(0);
    });

    it("scales potential saving by distance", () => {
      const shortDistance = getGreenestOption(2);
      const longDistance = getGreenestOption(20);

      expect(longDistance.potentialSaving).toBeGreaterThan(
        shortDistance.potentialSaving,
      );
    });
  });
});
