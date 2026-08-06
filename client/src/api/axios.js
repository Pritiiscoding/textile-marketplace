import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // send httpOnly cookie
  headers: {
    "Content-Type": "application/json",
  },
});

// Add Authorization header if token exists in localStorage (fallback for cross-origin)
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("auth_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => {
    // Store token from response if present
    if (response.data?.token) {
      localStorage.setItem("auth_token", response.data.token);
    }
    return response;
  },
  (error) => {
    // Clear token on 401 errors
    if (error.response?.status === 401) {
      localStorage.removeItem("auth_token");
    }
    return Promise.reject(error);
  }
);

export default api;
