const { validationResult } = require("express-validator");
const badgeService = require("../services/badgeService");
const Badge = require("../models/Badge");
const User = require("../models/User");
const { awardBadgeToUser } = require("../services/badgeAwardService");
const UserBadge = require("../models/UserBadge");

function handleValidation(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ success: false, message: "Validation failed", errors: errors.array() });
    return true;
  }
  return false;
}

async function createBadge(req, res, next) {
  try {
    if (handleValidation(req, res)) return;

    const badge = await badgeService.createBadge(req.body);
    res.status(201).json({ success: true, data: badge });
  } catch (err) {
    next(err);
  }
}

async function getAllBadges(req, res, next) {
  try {
    const badges = await badgeService.getAllBadges();
    res.json({ success: true, data: badges });
  } catch (err) {
    next(err);
  }
}

async function getBadgeById(req, res, next) {
  try {
    const badge = await badgeService.getBadgeById(req.params.id);
    if (!badge) return res.status(404).json({ success: false, message: "Badge not found" });
    res.json({ success: true, data: badge });
  } catch (err) {
    next(err);
  }
}

async function updateBadge(req, res, next) {
  try {
    if (handleValidation(req, res)) return;

    const updated = await badgeService.updateBadge(req.params.id, req.body);
    if (!updated) return res.status(404).json({ success: false, message: "Badge not found" });

    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
}

async function deleteBadge(req, res, next) {
  try {
    const deleted = await badgeService.deleteBadge(req.params.id);
    if (!deleted) return res.status(404).json({ success: false, message: "Badge not found" });

    res.json({ success: true, message: "Badge deleted" });
  } catch (err) {
    next(err);
  }
}

/**
 * Manual award endpoint (admin-only route).
 */
async function awardBadge(req, res, next) {
  try {
    const { badgeId, userId } = req.params;

    const badge = await Badge.findById(badgeId);
    if (!badge) return res.status(404).json({ success: false, message: "Badge not found" });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    const result = await awardBadgeToUser(userId, badgeId);
    res.status(result.created ? 201 : 200).json({
      success: true,
      message: result.created ? "Badge awarded" : "Badge already awarded",
      data: result.record,
    });
  } catch (err) {
    // duplicate index
    if (err?.code === 11000) {
      return res.status(200).json({ success: true, message: "Badge already awarded" });
    }
    next(err);
  }
}

/**
 * Get current logged user's earned badges (profile view).
 */
async function getMyBadges(req, res, next) {
  try {
    const userId = req.user.id; // token payload
    const earned = await UserBadge.find({ userId })
      .populate("badgeId")
      .sort({ awardedAt: -1 });

    res.json({ success: true, data: earned });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createBadge,
  getAllBadges,
  getBadgeById,
  updateBadge,
  deleteBadge,
  awardBadge,
  getMyBadges,
};