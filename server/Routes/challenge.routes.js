const express = require("express");
const router = express.Router();

const challengeController = require("../controllers/challengeController");

const {
  validateCreateChallenge,
  validateUpdateChallenge,
  validateProgressUpdate,
} = require("../validators/challenge.validator");
const { validate } = require("../middleware/validate.middleware");

const { protect, isAdmin } = require("../middleware/authMiddleware");


router.post(
  "/",
  protect,
  isAdmin,
  validateCreateChallenge,
  validate,
  challengeController.createChallenge
);

router.get("/user", protect, challengeController.getMyChallenges);

router.get("/admin/all", protect, isAdmin, challengeController.getAdminChallenges);

router.put("/:id", protect, isAdmin, validateUpdateChallenge, validate, challengeController.updateChallenge);

router.delete("/:id", protect, isAdmin, challengeController.deleteChallenge);

router.get("/", challengeController.getChallenges);


router.get("/recommended", challengeController.getRecommendedChallenges); 

router.get("/:id", challengeController.getChallengeById);

router.post("/:id/join", protect, challengeController.joinChallenge);

router.put(
  "/:id/progress",
  protect,
  validateProgressUpdate,
  validate,
  challengeController.updateProgress
);

router.delete("/:id/leave", protect, challengeController.leaveChallenge);



module.exports = router;