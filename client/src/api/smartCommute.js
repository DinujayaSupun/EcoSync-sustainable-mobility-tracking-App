import axios from './axios';

// ============================================
// HEALTH CHECK
// ============================================

export const healthCheck = async () => {
  const response = await axios.get('/smart-commute/health');
  return response.data;
};

// ============================================
// WEATHER-BASED GREEN SUGGESTION API
// ============================================

export const weatherAPI = {
  // Create weather suggestion
  createSuggestion: async (data) => {
    const response = await axios.post('/smart-commute/weather-suggestion', data);
    return response.data;
  },

  // Get suggestions for user
  getSuggestions: async (userId, params = {}) => {
    const response = await axios.get(`/smart-commute/weather-suggestion/${userId}`, { params });
    return response.data;
  },

  // Get current weather suggestion
  getCurrentWeather: async (location, params = {}) => {
    const response = await axios.get(`/smart-commute/weather-suggestion/current/${encodeURIComponent(location)}`, { params });
    return response.data;
  },

  // Update suggestion
  updateSuggestion: async (id, data) => {
    const response = await axios.put(`/smart-commute/weather-suggestion/${id}`, data);
    return response.data;
  },

  // Delete suggestion
  deleteSuggestion: async (id) => {
    const response = await axios.delete(`/smart-commute/weather-suggestion/${id}`);
    return response.data;
  },
};
