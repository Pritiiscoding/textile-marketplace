import api from "./axios";

export const getCartRequest = () => api.get("/cart");

export const addCartItemRequest = (productId, quantity, color, negotiatedPrice) => {
  console.log("addCartItemRequest called with:", { productId, quantity, color, negotiatedPrice });
  return api.post("/cart/items", { productId, quantity, color, negotiatedPrice });
};

export const updateCartItemRequest = (productId, quantity, color) =>
  api.patch(`/cart/items/${productId}`, { quantity, color });

export const removeCartItemRequest = (productId, color) =>
  api.delete(`/cart/items/${productId}`, { params: color ? { color } : {} });

export const clearCartRequest = () => api.delete("/cart");
