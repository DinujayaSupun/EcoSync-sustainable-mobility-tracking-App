const express = require("express");
const router = express.Router();

const challengeController = require("../Controllers/challenge.controller");

const { validateCreateChallenge } = require("../validators/challenge.validator");
const { validate } = require("../middleware/validate.middleware");

const { protect } = require("../middleware/authMiddleware");


router.post(
  "/",
  protect,
  validateCreateChallenge,
  validate,
  challengeController.createChallenge
);

router.put("/:id", challengeController.updateChallenge);

router.delete("/:id", challengeController.deleteChallenge);

router.get("/", challengeController.getChallenges);

router.get("/recommended", challengeController.getRecommendedChallenges);

router.get("/:id", challengeController.getChallengeById);


router.post("/:id/join", protect, challengeController.joinChallenge);

router.get("/me", protect, challengeController.getMyChallenges);

router.put("/:id/progress", protect, challengeController.updateProgress);

router.delete("/:id/leave", protect, challengeController.leaveChallenge);



module.exports = router;