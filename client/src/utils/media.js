// Product images are now stored as full URLs (e.g. "https://example.com/uploads/products/foo.jpg").
// If they're still relative paths, resolve them against the API's origin.
export const API_ORIGIN = (import.meta.env.VITE_API_URL || "http://localhost:5000/api").replace(
  /\/api\/?$/,
  ""
);

export const resolveImageUrl = (path) => {
  if (!path) return null;
  
  // If it's already a full URL, return it as is
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  
  // If it's a relative path starting with /uploads, resolve it
  if (path.startsWith('/uploads')) {
    return `${API_ORIGIN}${path}`;
  }
  
  // Otherwise, treat it as a relative path and resolve it
  return `${API_ORIGIN}${path.startsWith('/') ? '' : '/'}${path}`;
};
