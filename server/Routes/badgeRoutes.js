const express = require("express");
const { body } = require("express-validator");
const { protect, isAdmin } = require("../middleware/authMiddleware");
const badgeController = require("../controllers/badgeController");

const router = express.Router();

// Read
router.get("/", protect, badgeController.getAllBadges);
router.get("/:id", protect, badgeController.getBadgeById);

// Create (Admin)
router.post(
  "/",
  protect,
  isAdmin,
  [
    body("name").isString().trim().notEmpty(),
    body("description").isString().trim().notEmpty(),
    body("type").isIn(["TRIP_COUNT", "TOTAL_DISTANCE", "TOTAL_CO2_SAVED"]),
    body("threshold").isNumeric().toFloat(),
    body("imageUrl").optional().isString(),
  ],
  badgeController.createBadge
);

// Update (Admin)
router.patch(
  "/:id",
  protect,
  isAdmin,
  [
    body("name").optional().isString().trim().notEmpty(),
    body("description").optional().isString().trim().notEmpty(),
    body("type").optional().isIn(["TRIP_COUNT", "TOTAL_DISTANCE", "TOTAL_CO2_SAVED"]),
    body("threshold").optional().isNumeric().toFloat(),
    body("imageUrl").optional().isString(),
  ],
  badgeController.updateBadge
);

// Delete (Admin)
router.delete("/:id", protect, isAdmin, badgeController.deleteBadge);

// Manual award (Admin)
router.post("/:badgeId/award/:userId", protect, isAdmin, badgeController.awardBadge);

// Profile: my earned badges
router.get("/me/earned", protect, badgeController.getMyBadges);

module.exports = router;