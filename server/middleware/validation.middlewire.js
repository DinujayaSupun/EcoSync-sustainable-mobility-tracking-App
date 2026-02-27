// const { body, param, validationResult } = require("express-validator");

// const validateCarbonCreate = [
//   body("userId")
//     .notEmpty()
//     .withMessage("User ID is required"),

//   body("vehicleType")
//     .isIn(["PETROL_CAR", "ELECTRIC_BIKE", "LUXURY_BUS", "TRAIN", "WALK"])
//     .withMessage("Invalid vehicle type"),

//   body("distance")
//     .isFloat({ min: 0 })
//     .withMessage("Distance must be a positive number"),
// ];

// const validateObjectId = [
//   param("id")
//     .isMongoId()
//     .withMessage("Invalid record ID"),
// ];

// const handleValidation = (req, res, next) => {
//   const errors = validationResult(req);

//   if (!errors.isEmpty()) {
//     return res.status(400).json({
//       success: false,
//       errors: errors.array(),
//     });
//   }

//   next();
// };

// module.exports = {
//   validateCarbonCreate,
//   validateObjectId,
//   handleValidation,
// };