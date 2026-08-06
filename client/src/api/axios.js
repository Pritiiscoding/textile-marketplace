import axios from "axios";

let API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
if (API_BASE_URL && !API_BASE_URL.endsWith("/api")) {
  API_BASE_URL = API_BASE_URL.replace(/\/$/, "") + "/api";
}

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: false,
  headers: {
    "Content-Type": "application/json",
  },
});

export default api;
