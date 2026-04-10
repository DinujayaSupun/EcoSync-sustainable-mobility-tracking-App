const { body } = require("express-validator");

exports.validateCreateChallenge = [
  body("title")
    .optional()
    .trim()
    .isLength({ min: 3, max: 120 })
    .withMessage("Title must be between 3 and 120 characters"),

  body("description")
    .optional()
    .trim()
    .isLength({ min: 10, max: 1500 })
    .withMessage("Description must be between 10 and 1500 characters"),

  body("tagline")
    .optional()
    .trim()
    .isLength({ min: 3, max: 180 })
    .withMessage("Tagline must be between 3 and 180 characters"),

  body("transportMode")
    .isIn(["BUS", "TRAIN", "BIKE", "WALK", "CAR", "VAN"])
    .withMessage("Invalid transport mode"),

  body("emissionTarget")
    .isFloat({ min: 0.1 })
    .withMessage("CO2 saving target must be positive"),

  body("durationDays")
    .optional()
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
    .withMessage("Reward points must be positive"),

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

  body().custom((value) => {
    const hasDuration = value.durationDays !== undefined && value.durationDays !== null && value.durationDays !== "";
    const hasDeadline = value.deadline !== undefined && value.deadline !== null && value.deadline !== "";
    if (!hasDuration && !hasDeadline) {
      throw new Error("Provide durationDays or deadline");
    }
    return true;
  })
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
  body("title")
    .optional()
    .trim()
    .isLength({ min: 3, max: 120 })
    .withMessage("Title must be between 3 and 120 characters"),

  body("description")
    .optional()
    .trim()
    .isLength({ min: 10, max: 1500 })
    .withMessage("Description must be between 10 and 1500 characters"),

  body("tagline")
    .optional()
    .trim()
    .isLength({ min: 3, max: 180 })
    .withMessage("Tagline must be between 3 and 180 characters"),

  body("transportMode")
    .optional()
    .isIn(["BUS", "TRAIN", "BIKE", "WALK", "CAR", "VAN"])
    .withMessage("Invalid transport mode"),

  body("difficulty")
    .optional()
    .isIn(["EASY", "MEDIUM", "HARD"])
    .withMessage("Invalid difficulty"),

  body("type")
    .optional()
    .isIn(["INDIVIDUAL", "SQUAD"])
    .withMessage("Invalid challenge type"),

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