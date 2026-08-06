import api from "./axios";

// --- Buyer / marketplace browsing ---

export const getProductsRequest = (params) => api.get("/products", { params });

export const getCategoriesRequest = () => api.get("/products/meta/categories");

// --- Supplier / inventory management ---

export const getMyProductsRequest = () => api.get("/products/mine");
export const getProductByIdRequest = (id) => api.get(`/products/${id}`);

// data: { name, category, description, colors, specs, stock, price, unit }
// imageFiles: File[]
export const createProductRequest = (data, imageFiles = []) => {
  const formData = buildProductFormData(data, imageFiles);
  return api.post("/products", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

export const updateProductRequest = (id, data, imageFiles = []) => {
  const formData = buildProductFormData(data, imageFiles);
  return api.put(`/products/${id}`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

export const toggleProductStatusRequest = (id) =>
  api.patch(`/products/${id}/toggle-status`);

export const deleteProductRequest = (id) => api.delete(`/products/${id}`);

export const deleteProductImageRequest = (id, imageIndex) =>
  api.delete(`/products/${id}/images/${imageIndex}`);

function buildProductFormData(data, imageFiles) {
  const formData = new FormData();
  Object.entries(data).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    if (key === "colors" && Array.isArray(value)) {
      formData.append(key, JSON.stringify(value));
    } else if (key === "specs" && typeof value === "object") {
      formData.append(key, JSON.stringify(value));
    } else {
      formData.append(key, value);
    }
  });
  imageFiles.forEach((file) => formData.append("images", file));
  return formData;
}
