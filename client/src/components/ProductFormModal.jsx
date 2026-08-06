import { useState } from "react";
import { createProductRequest, updateProductRequest } from "../api/productApi";
import ImageAIAnalyzer from "./ImageAIAnalyzer";

const emptyForm = {
  name: "",
  category: "",
  description: "",
  colors: "",
  stock: "",
  price: "",
  unit: "",
};

const ProductFormModal = ({ product, onClose, onSaved }) => {
  const isEditing = !!product;
  const [form, setForm] = useState(
    product
      ? {
          name: product.name || "",
          category: product.category || "",
          description: product.description || "",
          colors: (product.colors || []).join(", "),
          stock: product.stock ?? "",
          price: product.price ?? "",
          unit: product.unit || "",
        }
      : emptyForm
  );
  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    const newFiles = Array.from(e.target.files || []);
    if (newFiles.length === 0) return;
    setImageFiles((prev) => [...prev, ...newFiles]);
    const newPreviews = newFiles.map((f) => URL.createObjectURL(f));
    setImagePreviews((prev) => [...prev, ...newPreviews]);
    e.target.value = "";
  };

  const removeImage = (index) => {
    URL.revokeObjectURL(imagePreviews[index]);
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.name || !form.category || form.price === "") {
      setError("Name, category, and price are required");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        name: form.name,
        category: form.category,
        description: form.description,
        colors: form.colors
          .split(",")
          .map((c) => c.trim())
          .filter(Boolean),
        stock: Number(form.stock) || 0,
        price: Number(form.price),
        unit: form.unit,
      };

      if (isEditing) {
        await updateProductRequest(product._id, payload, imageFiles);
      } else {
        await createProductRequest(payload, imageFiles);
      }
      onSaved();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save product");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4 animate-fade-in">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white dark:bg-slate-900 border border-surface-200 dark:border-slate-800 p-6 shadow-2xl text-surface-900 dark:text-white">
        <h2 className="mb-4 text-xl font-bold text-brand-900 dark:text-white">
          {isEditing ? "Edit Product" : "Add Product"}
        </h2>

        {error && (
          <div className="mb-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 px-3 py-2 text-sm text-red-700 dark:text-red-300">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-surface-700 dark:text-slate-300">
              Product name
            </label>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              className="input-field"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-surface-700 dark:text-slate-300">
                Category
              </label>
              <input
                name="category"
                value={form.category}
                onChange={handleChange}
                placeholder="e.g. Cotton Fabric"
                className="input-field"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-surface-700 dark:text-slate-300">
                Unit (optional)
              </label>
              <select
                name="unit"
                value={form.unit}
                onChange={handleChange}
                className="input-field"
              >
                <option value="">Select unit</option>
                {["meter", "quantity", "yard", "kg", "roll", "piece"].map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-surface-700 dark:text-slate-300">
              Description
            </label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={3}
              className="input-field"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-surface-700 dark:text-slate-300">
              Colors (comma-separated)
            </label>
            <input
              name="colors"
              value={form.colors}
              onChange={handleChange}
              placeholder="e.g. Red, Navy, Beige"
              className="input-field"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-surface-700 dark:text-slate-300">
                Stock
              </label>
              <input
                type="number"
                name="stock"
                min="0"
                value={form.stock}
                onChange={handleChange}
                className="input-field"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-surface-700 dark:text-slate-300">
                Price per unit (₹)
              </label>
              <input
                type="number"
                name="price"
                min="0"
                step="0.01"
                value={form.price}
                onChange={handleChange}
                className="input-field"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-surface-700 dark:text-slate-300">
              {isEditing ? "Add more images" : "Product Images"} <span className="text-brand-500 font-normal lowercase">(multiple allowed)</span>
            </label>

            {/* Preview grid of selected images */}
            {imagePreviews.length > 0 && (
              <div className="mb-2 flex flex-wrap gap-2">
                {imagePreviews.map((src, i) => (
                  <div key={i} className="relative group h-20 w-20 rounded-xl overflow-hidden border-2 border-brand-400 shadow-sm">
                    <img src={src} alt={`preview-${i}`} className="h-full w-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeImage(i)}
                      className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition text-white text-lg font-bold"
                      title="Remove"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* File input */}
            <label className="flex cursor-pointer items-center gap-2 rounded-xl border-2 border-dashed border-brand-300 dark:border-slate-600 bg-brand-50/40 dark:bg-slate-800/40 px-4 py-3 text-xs text-brand-600 dark:text-brand-400 hover:border-brand-500 hover:bg-brand-50 transition">
              <span className="text-lg">📁</span>
              <span className="font-semibold">{imagePreviews.length > 0 ? `Add more photos (${imagePreviews.length} selected)` : "Click to select photos"}</span>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileChange}
                className="hidden"
              />
            </label>

            {/* Feature 3: Image AI Vision Analyzer */}
            <ImageAIAnalyzer
              imageFile={imageFiles.length > 0 ? imageFiles[0] : null}
              onAnalyzed={(aiData) => {
                setForm((prev) => {
                  let enhancedDescription = aiData.description;
                  if (aiData.material) enhancedDescription += ` Material: ${aiData.material}.`;
                  if (aiData.pattern) enhancedDescription += ` Pattern: ${aiData.pattern}.`;
                  
                  return {
                    ...prev,
                    category: prev.category || aiData.category,
                    colors: prev.colors || aiData.colors.join(", "),
                    description: prev.description || enhancedDescription,
                  };
                });
              }}
            />
            {isEditing && product.images?.length > 0 && (
              <p className="mt-1 text-xs text-surface-700 dark:text-slate-400">
                {product.images.length} existing image(s). New uploads will be added.
              </p>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-surface-200 dark:border-slate-700 bg-surface-100 dark:bg-slate-800 px-4 py-2 text-sm font-semibold text-surface-700 dark:text-slate-300 hover:bg-surface-200 dark:hover:bg-slate-700 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary rounded-xl px-5 py-2 text-sm font-semibold text-white disabled:opacity-50 transition"
            >
              {isSubmitting ? "Saving..." : "Save Product"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

};

export default ProductFormModal;
