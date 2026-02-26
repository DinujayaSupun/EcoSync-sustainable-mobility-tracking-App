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

module.exports = router;