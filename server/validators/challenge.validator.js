const { body } = require("express-validator");

exports.validateCreateChallenge = [
  body("transportMode")
    .isIn(["BUS", "TRAIN", "BIKE", "WALK"])
    .withMessage("Invalid transport mode"),

  body("emissionTarget")
    .isFloat({ min: 0.1 })
    .withMessage("Emission target must be positive"),

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