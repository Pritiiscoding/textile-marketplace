import api from "./axios";

export const startNegotiationRequest = (data) => api.post("/negotiations", data);
export const getNegotiationsRequest = () => api.get("/negotiations");
export const updateNegotiationRequest = (id, payload) => api.patch(`/negotiations/${id}`, payload);
