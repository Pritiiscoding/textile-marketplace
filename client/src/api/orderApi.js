import api from "./axios";

export const getSupplierOrdersRequest = (status) =>
  api.get("/orders/supplier", { params: status ? { status } : {} });

export const getOrderByIdRequest = (id) => api.get(`/orders/${id}`);

export const updateOrderStatusRequest = (id, status) =>
  api.patch(`/orders/${id}/status`, { status });

// --- Buyer ---

export const checkoutRequest = (shippingInfo) =>
  api.post("/orders/checkout", { shippingInfo });

export const getMyOrdersRequest = (status) =>
  api.get("/orders/mine", { params: status ? { status } : {} });

export const getMyOrderByIdRequest = (id) => api.get(`/orders/mine/${id}`);
