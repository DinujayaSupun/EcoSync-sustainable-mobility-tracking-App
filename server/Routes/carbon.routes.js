const express = require("express");
const router = express.Router();

const {
  createCarbonRecord,
  getUserInsights,
} = require("../Controllers/carbon.controller");

router.post("/calculate", createCarbonRecord);
router.get("/records/:userId", getUserRecords);
router.get("/record/:id", getRecordById);
router.put("/record/:id", updateRecord);
router.delete("/record/:id", deleteRecord);
router.get("/insights/:userId", getUserInsights);


module.exports = router;
