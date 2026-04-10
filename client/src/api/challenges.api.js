import API from "./axios";

const BASE = "/challenges";

const normalizeArray = (payload, fallbackKey) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (fallbackKey && Array.isArray(payload?.[fallbackKey]))
    return payload[fallbackKey];
  return [];
};

export const ChallengesAPI = {
  async createChallenge(payload) {
    const { data } = await API.post(BASE, payload);
    return data;
  },

  async getChallenges(params = {}) {
    const { data } = await API.get(BASE, { params });

    if (Array.isArray(data)) {
      return {
        total: data.length,
        page: Number(params.page || 1),
        pages: 1,
        challenges: data,
      };
    }

    return {
      total: Number(data?.total || 0),
      page: Number(data?.page || params.page || 1),
      pages: Number(data?.pages || 1),
      challenges: normalizeArray(data, "challenges"),
    };
  },

  async getAdminChallenges(params = {}) {
    const { data } = await API.get(`${BASE}/admin/all`, { params });
    return data;
  },

  async getMyChallenges() {
    const { data } = await API.get(`${BASE}/user`);
    return normalizeArray(data, "participations");
  },

  async getRecommended(params = {}) {
    const { data } = await API.get(`${BASE}/recommended`, { params });
    return normalizeArray(data);
  },

  async getRecommendedChallenges(excludeMode) {
    const params = excludeMode ? { excludeMode } : undefined;
    return this.getRecommended(params);
  },

  async getChallengeById(id) {
    const { data } = await API.get(`${BASE}/${id}`);
    return data;
  },

  async joinChallenge(id) {
    const { data } = await API.post(`${BASE}/${id}/join`);
    return data;
  },

  async updateProgress(id, payload) {
    const body =
      typeof payload === "number"
        ? { progress: payload }
        : payload && typeof payload === "object"
          ? payload
          : { progress: payload };

    const { data } = await API.put(`${BASE}/${id}/progress`, body);
    return data;
  },

  async updateChallenge(id, payload) {
    const { data } = await API.put(`${BASE}/${id}`, payload);
    return data;
  },

  async deleteChallenge(id) {
    const { data } = await API.delete(`${BASE}/${id}`);
    return data;
  },

  async leaveChallenge(id) {
    const { data } = await API.delete(`${BASE}/${id}/leave`);
    return data;
  },
};
