import axios from "axios";

const ENV_BASE = (import.meta.env.VITE_API_BASE_URL || "").trim();

export const api = axios.create({
  baseURL: ENV_BASE,
});

// Automatically attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("aegis_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    // Global error handling can be expanded here
    if (error.response?.status === 401) {
      // Clear auth on 401 if needed
      // localStorage.removeItem("aegis_token");
    }
    return Promise.reject(error);
  }
);

export function getAuthHeaders() {
  const token = localStorage.getItem("aegis_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}
