import axios from "axios";

const rawApiUrl = (import.meta.env.VITE_API_URL || "http://localhost:5000/api").trim();

const normalizedApiUrl = (() => {
  const withoutTrailingSlash = rawApiUrl.replace(/\/+$/, "");
  return withoutTrailingSlash.endsWith("/api")
    ? withoutTrailingSlash
    : `${withoutTrailingSlash}/api`;
})();

const API = axios.create({
  baseURL: normalizedApiUrl,
});

// This automatically adds the JWT token to every request
API.interceptors.request.use((req) => {
  const token = localStorage.getItem("token");
  if (token) {
    req.headers.Authorization = `Bearer ${token}`;
  }
  return req;
});

export default API;
