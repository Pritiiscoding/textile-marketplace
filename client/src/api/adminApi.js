import api from "./axios";

// Users
export const adminGetUsersRequest = (params) => api.get("/admin/users", { params });
export const adminUpdateUserRequest = (id, data) => api.patch(`/admin/users/${id}`, data);
export const adminDeleteUserRequest = (id) => api.delete(`/admin/users/${id}`);

// Products
export const adminGetProductsRequest = (params) => api.get("/admin/products", { params });
export const adminUpdateProductRequest = (id, data) => api.patch(`/admin/products/${id}`, data);
export const adminDeleteProductRequest = (id) => api.delete(`/admin/products/${id}`);

// Orders
export const adminGetOrdersRequest = (params) => api.get("/admin/orders", { params });
export const adminUpdateOrderStatusRequest = (id, status) =>
  api.patch(`/admin/orders/${id}/status`, { status });

// Activity log
export const getActivityLogsRequest = (params) => api.get("/admin/activity", { params });
