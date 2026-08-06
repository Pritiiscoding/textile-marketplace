import api from "./axios";

export const getSupplierDashboardStatsRequest = () => api.get("/dashboard/supplier");
