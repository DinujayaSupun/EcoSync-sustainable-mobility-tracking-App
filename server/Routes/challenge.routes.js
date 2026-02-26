const express = require("express");
const router = express.Router();

const controller = require("../Controllers/Challenges/challenge.controller");
// NOTE: All challenge endpoints are intentionally exposed publicly.
// the token/authorization requirement has been removed for CRUD operations.

const { validateCreateChallenge } = require("../validators/challenge.validator");
const { validate } = require("../middleware/validate.middleware");

// Create a new challenge (previously admin-only)
router.post(
  "/",
  validateCreateChallenge,
  validate,
  controller.createChallenge
);

// Update / delete no longer require authentication
router.put("/:id", controller.updateChallenge);
router.delete("/:id", controller.deleteChallenge);

// Public reads
router.get("/", controller.getChallenges);
router.get("/recommended", controller.getRecommendedChallenges);
router.get("/:id", controller.getChallengeById);





module.exports = router;