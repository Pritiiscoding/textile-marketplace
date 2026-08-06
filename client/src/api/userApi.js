import api from "./axios";

export const getProfileRequest = () => api.get("/users/profile");

// payload: { profile: {...}, completeOnboarding?: boolean }
export const updateProfileRequest = (payload) => api.put("/users/profile", payload);
