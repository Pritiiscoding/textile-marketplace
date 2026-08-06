import api from "./axios";

export const createRFQRequest = (data) => api.post("/rfq", data);
export const getRFQsRequest = () => api.get("/rfq");
export const respondRFQRequest = (id, payload) => api.patch(`/rfq/${id}`, payload);
