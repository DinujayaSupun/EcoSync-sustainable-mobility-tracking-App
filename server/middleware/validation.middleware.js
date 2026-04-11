const { body, param, validationResult } = require("express-validator");

const validateCarbonCreate = [
  body("userId").notEmpty().withMessage("User ID is required"),

  //   body("vehicleType")
  //     .isIn(["PETROL_CAR", "ELECTRIC_BIKE", "LUXURY_BUS", "TRAIN", "WALK"])
  //     .withMessage("Invalid vehicle type"),

  //   body("distance")
  //     .isFloat({ min: 0 })
  //     .withMessage("Distance must be a positive number"),
];

const validateObjectId = [
  param("id").isMongoId().withMessage("Invalid record ID"),
];

// User ID validation
const validateUserId = [
  param("id").isMongoId().withMessage("Invalid user ID format"),
];

// User update validation
const validateUserUpdate = [
  body("name").optional().trim().notEmpty().withMessage("Name cannot be empty"),
  body("email").optional().isEmail().withMessage("Invalid email format"),
  body("role")
    .optional()
    .isIn(["user", "admin"])
    .withMessage("Role must be either 'user' or 'admin'"),
];

// User create validation
const validateUserCreate = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Name is required")
    .isLength({ min: 2, max: 100 })
    .withMessage("Name must be between 2 and 100 characters"),
  body("email").trim().isEmail().withMessage("Invalid email format"),
  body("password")
    .isString()
    .withMessage("Password must be a string")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters long"),
  body("faculty")
    .optional({ nullable: true })
    .isString()
    .withMessage("Faculty must be a string"),
  body("role")
    .optional()
    .isIn(["user", "admin"])
    .withMessage("Role must be either 'user' or 'admin'"),
];

// Email report validation
const validateEmailReport = [
  body("startDate")
    .optional()
    .isISO8601()
    .withMessage("Start date must be in ISO 8601 format"),
  body("endDate")
    .optional()
    .isISO8601()
    .withMessage("End date must be in ISO 8601 format"),
  body("faculty").optional().isString().withMessage("Faculty must be a string"),
];

// Validate at least one field is present
const validateAtLeastOneField = (req, res, next) => {
  const { name, email, role } = req.body;
  if (!name && !email && !role) {
    return res.status(400).json({
      success: false,
      message: "At least one field (name, email, or role) must be provided",
    });
  }
  next();
};

// Sanitize MongoDB ObjectId
const sanitizeObjectId = (req, res, next) => {
  if (req.params.id) {
    req.params.id = req.params.id.trim();
  }
  next();
};

const handleValidation = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array(),
    });
  }

  next();
};

module.exports = {
  validateCarbonCreate,
  validateObjectId,
  validateUserId,
  validateUserCreate,
  validateUserUpdate,
  validateEmailReport,
  validateAtLeastOneField,
  sanitizeObjectId,
  handleValidation,
};
