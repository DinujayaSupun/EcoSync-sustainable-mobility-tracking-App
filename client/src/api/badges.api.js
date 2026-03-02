// client/src/gamification/api/badges.api.js
// Uses the existing axios instance your teammates already configured.
// If your axios instance path differs, change the import below accordingly.

import API from "./axios";

// ⚠️ Adjust only if your backend route prefix differs
const BASE = "/badges";

export const BadgesAPI = {
  // Public/User
  async getAllBadges() {
    const res = await API.get(`${BASE}`);
    return res.data;
  },

  async getBadgeById(id) {
    const res = await API.get(`${BASE}/${id}`);
    return res.data;
  },

  // Logged-in user (Protected)
  async getMyEarnedBadges() {
    // Your backend endpoint: GET /api/badges/me/earned
    const res = await API.get(`${BASE}/me/earned`);
    return res.data;
  },

  // Admin (Protected + Role)
  async createBadge(payload) {
    const res = await API.post(`${BASE}`, payload);
    return res.data;
  },

  async updateBadge(id, payload) {
    const res = await API.patch(`${BASE}/${id}`, payload);
    return res.data;
  },

  async deleteBadge(id) {
    const res = await API.delete(`${BASE}/${id}`);
    return res.data;
  },
};