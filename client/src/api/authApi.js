import api from "./axios";

export const registerRequest = (data) => api.post("/auth/register", data);
export const loginRequest = (data) => api.post("/auth/login", data);
export const logoutRequest = () => api.post("/auth/logout");
export const getMeRequest = () => api.get("/auth/me");
export const verifyEmailRequest = (token) => api.post("/auth/verify-email", { token });
export const resendVerificationRequest = (email) => api.post("/auth/resend-verification", { email });

