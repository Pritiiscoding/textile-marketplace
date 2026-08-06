import axios from "axios";

let API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
if (API_BASE_URL && !API_BASE_URL.endsWith("/api")) {
  API_BASE_URL = API_BASE_URL.replace(/\/$/, "") + "/api";
}

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // send httpOnly cookie
  headers: {
    "Content-Type": "application/json",
  },
});

// Attach token from localStorage as Authorization header (fallback for cross-origin)
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("authToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
