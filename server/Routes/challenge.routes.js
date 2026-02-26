const express = require("express");
const router = express.Router();

const controller = require("../Controllers/challenge.controller");
const { requireAdmin } = require("../middleware/role.middleware");

// Admin only
router.post("/", requireAdmin, controller.createChallenge);
router.put("/:id", requireAdmin, controller.updateChallenge);
router.delete("/:id", requireAdmin, controller.deleteChallenge);

// Public reads
router.get("/", controller.getChallenges);
router.get("/recommended", controller.getRecommendedChallenges);
router.get("/:id", controller.getChallengeById);

const { validateCreateChallenge } = require("../validators/challenge.validator");
const { validate } = require("../middleware/validate.middleware");

router.post(
  "/",
  requireAdmin,
  validateCreateChallenge,
  validate,
  controller.createChallenge
);

module.exports = router;