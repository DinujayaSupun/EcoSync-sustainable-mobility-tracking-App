const { body, param, validationResult } = require("express-validator");

const validateCarbonCreate = [
  body("userId").notEmpty().withMessage("User ID is required"),

  body("vehicleType")
    .isIn(["PETROL_CAR", "ELECTRIC_BIKE", "LUXURY_BUS", "TRAIN", "WALK"])
    .withMessage("Invalid vehicle type"),

  body("distance")
    .isFloat({ min: 0 })
    .withMessage("Distance must be a positive number"),
];

const validateObjectId = [
  param("id").isMongoId().withMessage("Invalid record ID"),
];

// ============= ADMIN VALIDATION MIDDLEWARE =============

/**
 * Validate User ID parameter
 */
const validateUserId = [
  param("id")
    .notEmpty()
    .withMessage("User ID is required")
    .isMongoId()
    .withMessage("Invalid user ID format. Must be a valid MongoDB ObjectId"),
];

/**
 * Validate User Update Request
 */
const validateUserUpdate = [
  body("name")
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Name must be between 2 and 100 characters")
    .matches(/^[a-zA-Z\s'-]+$/)
    .withMessage(
      "Name can only contain letters, spaces, hyphens, and apostrophes",
    ),

  body("email")
    .optional()
    .trim()
    .isEmail()
    .withMessage("Please provide a valid email address")
    .normalizeEmail()
    .isLength({ max: 255 })
    .withMessage("Email must not exceed 255 characters"),

  body("faculty")
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Faculty must be between 2 and 100 characters")
    .matches(/^[a-zA-Z\s&-]+$/)
    .withMessage(
      "Faculty can only contain letters, spaces, hyphens, and ampersands",
    ),

  body("role")
    .optional()
    .trim()
    .isIn(["user", "admin"])
    .withMessage("Role must be either 'user' or 'admin'")
    .customSanitizer((value) => value.toLowerCase()),
];

/**
 * Validate email report request
 */
const validateEmailReport = [
  body("email")
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Please provide a valid email address")
    .normalizeEmail(),

  body("reportType")
    .optional()
    .isIn(["daily", "weekly", "monthly"])
    .withMessage("Report type must be 'daily', 'weekly', or 'monthly'"),
];

/**
 * Validate query parameters for pagination and filtering
 */
const validateQueryParams = [
  param("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Limit must be between 1 and 100"),

  param("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Page must be a positive integer"),
];

/**
 * Validate date range for reports
 */
const validateDateRange = [
  body("startDate")
    .optional()
    .isISO8601()
    .withMessage("Start date must be a valid ISO 8601 date")
    .custom((value, { req }) => {
      if (req.body.endDate && new Date(value) > new Date(req.body.endDate)) {
        throw new Error("Start date cannot be after end date");
      }
      return true;
    }),

  body("endDate")
    .optional()
    .isISO8601()
    .withMessage("End date must be a valid ISO 8601 date")
    .custom((value) => {
      if (new Date(value) > new Date()) {
        throw new Error("End date cannot be in the future");
      }
      return true;
    }),
];

/**
 * Custom validation to ensure at least one field is provided for update
 */
const validateAtLeastOneField = (req, res, next) => {
  const { name, email, faculty, role } = req.body;

  if (!name && !email && !faculty && !role) {
    return res.status(400).json({
      success: false,
      message:
        "At least one field (name, email, faculty, or role) must be provided for update",
      errors: [
        {
          field: "body",
          message: "No update fields provided",
        },
      ],
    });
  }

  next();
};

/**
 * Enhanced error handling middleware with detailed error messages
 */
const handleValidation = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map((error) => ({
      field: error.path || error.param,
      message: error.msg,
      value: error.value,
    }));

    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: formattedErrors,
    });
  }

  next();
};

/**
 * Sanitize and validate MongoDB ObjectId
 */
const sanitizeObjectId = (req, res, next) => {
  if (req.params.id) {
    req.params.id = req.params.id.trim();
  }
  next();
};

module.exports = {
  validateCarbonCreate,
  validateObjectId,
  handleValidation,
  // Admin-specific validators
  validateUserId,
  validateUserUpdate,
  validateEmailReport,
  validateQueryParams,
  validateDateRange,
  validateAtLeastOneField,
  sanitizeObjectId,
};
