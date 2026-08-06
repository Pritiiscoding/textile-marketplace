import api from "./axios";

export const semanticSearchRequest = (query) =>
  api.post("/ai/search", { query });

export const similarProductsRequest = (productId) =>
  api.get(`/ai/similar/${productId}`);

export const getRecommendationsRequest = () =>
  api.get("/ai/recommendations");

export const chatRequest = (message, productContext = []) =>
  api.post("/ai/chat", { message, productContext });

export const visualSearchRequest = (payload) =>
  api.post("/ai/visual-search", payload);

export const analyzeImageRequest = (payload) =>
  api.post("/ai/analyze-image", payload);
