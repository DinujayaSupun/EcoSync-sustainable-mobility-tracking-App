const Badge = require("../models/Badge");
const { fetchEcoImageUrl } = require("./unsplashService");

async function createBadge(payload) {
  const { name, description, type, threshold, imageUrl } = payload;

  let finalImageUrl = imageUrl || "";
  if (!finalImageUrl) {
    // Third-party API usage (Unsplash)
    finalImageUrl = await fetchEcoImageUrl(`${name} eco badge`);
  }

  const badge = await Badge.create({
    name,
    description,
    type,
    threshold,
    imageUrl: finalImageUrl,
  });

  return badge;
}

async function getAllBadges() {
  return Badge.find().sort({ createdAt: -1 });
}

async function getBadgeById(id) {
  return Badge.findById(id);
}

async function updateBadge(id, payload) {
  const badge = await Badge.findById(id);
  if (!badge) return null;

  if (payload.name !== undefined) badge.name = payload.name;
  if (payload.description !== undefined) badge.description = payload.description;
  if (payload.type !== undefined) badge.type = payload.type;
  if (payload.threshold !== undefined) badge.threshold = payload.threshold;

  // If imageUrl explicitly provided -> use it. If not -> keep existing.
  if (payload.imageUrl !== undefined) badge.imageUrl = payload.imageUrl;

  await badge.save();
  return badge;
}

async function deleteBadge(id) {
  const badge = await Badge.findById(id);
  if (!badge) return null;
  await badge.deleteOne();
  return badge;
}

module.exports = {
  createBadge,
  getAllBadges,
  getBadgeById,
  updateBadge,
  deleteBadge,
};