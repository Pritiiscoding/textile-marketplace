// Product images are stored as server-relative paths (e.g. "/uploads/products/foo.jpg").
// Resolve them against the API's origin (stripping the trailing /api).
export const API_ORIGIN = (import.meta.env.VITE_API_URL || "http://localhost:5000/api").replace(
  /\/api\/?$/,
  ""
);

export const resolveImageUrl = (path) => (path ? `${API_ORIGIN}${path}` : null);
