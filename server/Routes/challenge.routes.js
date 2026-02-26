const express = require("express");
const router = express.Router();

const controller = require("../Controllers/challenge.controller");
const { requireAdmin } = require("../middleware/role.middleware");

const { validateCreateChallenge } = require("../validators/challenge.validator");
const { validate } = require("../middleware/validate.middleware");

const { protect, isAdmin } = require("../middleware/authMiddleware");

// Admin only route
router.post(
  "/",
  protect,           // <-- this populates req.user
  isAdmin,           // <-- now req.user exists
  validateCreateChallenge,
  validate,
  controller.createChallenge
);
router.put("/:id", requireAdmin, controller.updateChallenge);
router.delete("/:id", requireAdmin, controller.deleteChallenge);

// Public reads
router.get("/", controller.getChallenges);
router.get("/recommended", controller.getRecommendedChallenges);
router.get("/:id", controller.getChallengeById);





module.exports = router;