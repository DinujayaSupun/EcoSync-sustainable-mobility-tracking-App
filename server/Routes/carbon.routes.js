const express = require("express");
const router = express.Router();

const {
  createCarbonRecord,
  getUserRecords,
  getRecordById,
  updateRecord,
  deleteRecord,
  getUserInsights,
} = require("../Controllers/carbon.controller");

const {
  validateCarbonCreate,
  validateObjectId,
  handleValidation,
} = require("../middlewires/validation.middlewire");

router.post("/calculate",
  validateCarbonCreate,
  handleValidation,
  createCarbonRecord
);

router.get("/records/:userId", getUserRecords);

router.get("/record/:id",
  validateObjectId,
  handleValidation,
  getRecordById
);

router.put("/record/:id",
  validateObjectId,
  handleValidation,
  updateRecord
);

router.delete("/record/:id",
  validateObjectId,
  handleValidation,
  deleteRecord
);

router.get("/insights/:userId", getUserInsights);

module.exports = router;