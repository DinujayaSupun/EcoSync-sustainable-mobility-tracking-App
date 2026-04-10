import API from "./axios";

const BASE = "/challenges";

export const ChallengesAPI = {
  async createChallenge(payload) {
    const res = await API.post(`${BASE}`, payload);
    return res.data;
  },

  async getChallenges(params = {}) {
    const res = await API.get(`${BASE}`, { params });
    return res.data;
  },

  async getAdminChallenges(params = {}) {
    const res = await API.get(`${BASE}/admin/all`, { params });
    return res.data;
  },

  async getMyChallenges() {
    const res = await API.get(`${BASE}/user`);
    return res.data;
  },

  async getRecommendedChallenges(excludeMode) {
    const params = excludeMode ? { excludeMode } : undefined;
    const res = await API.get(`${BASE}/recommended`, { params });
    return res.data;
  },

  async getChallengeById(id) {
    const res = await API.get(`${BASE}/${id}`);
    return res.data;
  },

  async joinChallenge(id) {
    const res = await API.post(`${BASE}/${id}/join`);
    return res.data;
  },

  async updateProgress(id, payload) {
    const body =
      typeof payload === "number"
        ? { progress: payload }
        : payload && typeof payload === "object"
        ? payload
        : {};

    const res = await API.put(`${BASE}/${id}/progress`, body);
    return res.data;
  },

  async updateChallenge(id, payload) {
    const res = await API.put(`${BASE}/${id}`, payload);
    return res.data;
  },

  async deleteChallenge(id) {
    const res = await API.delete(`${BASE}/${id}`);
    return res.data;
  },

  async leaveChallenge(id) {
    const res = await API.delete(`${BASE}/${id}/leave`);
    return res.data;
  },
};
