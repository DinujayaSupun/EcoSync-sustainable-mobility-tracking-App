const { body } = require("express-validator");

exports.validateCreateChallenge = [
  body("transportMode")
    .isIn(["BUS", "TRAIN", "BIKE", "WALK", "CAR", "VAN"])
    .withMessage("Invalid transport mode"),

  body("emissionTarget")
    .isFloat({ min: 0.1 })
    .withMessage("CO2 saving target must be positive"),

  body("durationDays")
    .isInt({ min: 1 })
    .withMessage("Duration must be at least 1 day"),

  body("difficulty")
    .isIn(["EASY", "MEDIUM", "HARD"])
    .withMessage("Invalid difficulty"),

  body("type")
    .isIn(["INDIVIDUAL", "SQUAD"])
    .withMessage("Invalid challenge type"),

  body("rewardPoints")
    .isInt({ min: 1 })
    .withMessage("Reward points must be positive")
];

exports.validateProgressUpdate = [
  body("progress")
    .optional()
    .isFloat({ gt: 0 })
    .withMessage("Progress increment must be a positive number"),
  body("auto")
    .optional()
    .isBoolean()
    .withMessage("auto must be true or false")
    .toBoolean(),
  body().custom((value) => {
    const hasProgress = value.progress !== undefined && value.progress !== null && value.progress !== "";
    const auto = value.auto === true;
    if (!hasProgress && !auto) {
      throw new Error("Provide a positive progress value or set auto=true");
    }
    return true;
  }),
];

exports.validateUpdateChallenge = [
  body("emissionTarget")
    .optional()
    .isFloat({ min: 0.1 })
    .withMessage("CO2 saving target must be positive"),

  body("durationDays")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Duration must be at least 1 day"),

  body("rewardPoints")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Reward points must be at least 1"),

  body("status")
    .optional()
    .isIn(["ACTIVE", "INACTIVE", "EXPIRED", "COMPLETED"])
    .withMessage("Invalid status"),

  body("deadline")
    .optional({ nullable: true })
    .custom((value) => {
      if (value === null || value === "") return true;
      const date = new Date(value);
      if (Number.isNaN(date.getTime())) {
        throw new Error("Invalid deadline date");
      }
      return true;
    }),
];