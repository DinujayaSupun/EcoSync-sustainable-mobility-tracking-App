import API from './axios';

const normalizeArray = (payload, fallbackKey) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (fallbackKey && Array.isArray(payload?.[fallbackKey])) return payload[fallbackKey];
  return [];
};

export const ChallengesAPI = {
  async getChallenges(params = {}) {
    const { data } = await API.get('/challenges', { params });

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
      challenges: normalizeArray(data, 'challenges'),
    };
  },

  async getRecommended(params = {}) {
    const { data } = await API.get('/challenges/recommended', { params });
    return normalizeArray(data);
  },

  async getMyChallenges() {
    const { data } = await API.get('/challenges/user');
    return normalizeArray(data, 'participations');
  },

  async getChallengeById(id) {
    const { data } = await API.get(`/challenges/${id}`);
    return data;
  },

  async createChallenge(payload) {
    const { data } = await API.post('/challenges', payload);
    return data;
  },

  async updateChallenge(id, payload) {
    const { data } = await API.put(`/challenges/${id}`, payload);
    return data;
  },

  async deleteChallenge(id) {
    const { data } = await API.delete(`/challenges/${id}`);
    return data;
  },

  async joinChallenge(id) {
    const { data } = await API.post(`/challenges/${id}/join`);
    return data;
  },

  async updateProgress(id, progress) {
    const { data } = await API.put(`/challenges/${id}/progress`, { progress });
    return data;
  },

  async leaveChallenge(id) {
    const { data } = await API.delete(`/challenges/${id}/leave`);
    return data;
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
