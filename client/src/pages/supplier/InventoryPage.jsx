import { useCallback, useEffect, useState } from "react";
import {
  getMyProductsRequest,
  deleteProductRequest,
  toggleProductStatusRequest,
} from "../../api/productApi";
import ProductFormModal from "../../components/ProductFormModal";
import { resolveImageUrl } from "../../utils/media";
import toast from "react-hot-toast";

const InventoryPage = () => {
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [modalState, setModalState] = useState({ open: false, product: null });

  const loadProducts = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data } = await getMyProductsRequest();
      setProducts(data.products);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load products");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  // Auto-refresh on product updates via WebSocket events
  useEffect(() => {
    const handleProductUpdate = () => {
      loadProducts();
    };

    window.addEventListener("tl:product_updated", handleProductUpdate);
    window.addEventListener("tl:new_product", handleProductUpdate);

    return () => {
      window.removeEventListener("tl:product_updated", handleProductUpdate);
      window.removeEventListener("tl:new_product", handleProductUpdate);
    };
  }, [loadProducts]);

  const handleDelete = async (product) => {
    if (!window.confirm(`Delete "${product.name}"? This cannot be undone.`)) return;
    try {
      await deleteProductRequest(product._id);
      setProducts((prev) => prev.filter((p) => p._id !== product._id));
      toast.success("Product deleted successfully!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete product");
    }
  };

  const handleToggleStatus = async (product) => {
    try {
      const { data } = await toggleProductStatusRequest(product._id);
      setProducts((prev) => prev.map((p) => (p._id === product._id ? data.product : p)));
      toast.success(`Product ${data.product.status === "available" ? "activated" : "deactivated"} successfully!`);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update status");
    }
  };

  const handleSaved = () => {
    setModalState({ open: false, product: null });
    loadProducts();
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-brand-900 dark:text-white">Inventory</h1>
        <button
          onClick={() => setModalState({ open: true, product: null })}
          className="btn-primary px-4 py-2 text-sm font-semibold text-white shadow-sm"
        >
          + Add Product
        </button>
      </div>

      {error && <p className="mb-4 text-sm text-red-600 dark:text-red-400">{error}</p>}

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-xl bg-surface-100 dark:bg-slate-800" />
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <span className="text-5xl mb-4">🧶</span>
          <p className="text-surface-700 dark:text-slate-400 font-medium">No products yet. Add your first one to get started.</p>
        </div>
      ) : (
        <div className="table-responsive">
          <div className="overflow-hidden rounded-2xl border border-surface-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-card">
            <table className="w-full text-sm">
              <thead className="bg-surface-50 dark:bg-slate-800/80 text-left">
                <tr>
                  <th className="px-4 py-3.5 text-xs font-semibold uppercase tracking-wider text-surface-600 dark:text-slate-400">Product</th>
                  <th className="px-4 py-3.5 text-xs font-semibold uppercase tracking-wider text-surface-600 dark:text-slate-400">Category</th>
                  <th className="px-4 py-3.5 text-xs font-semibold uppercase tracking-wider text-surface-600 dark:text-slate-400">Stock</th>
                  <th className="px-4 py-3.5 text-xs font-semibold uppercase tracking-wider text-surface-600 dark:text-slate-400">Price</th>
                  <th className="px-4 py-3.5 text-xs font-semibold uppercase tracking-wider text-surface-600 dark:text-slate-400">Status</th>
                  <th className="px-4 py-3.5 text-xs font-semibold uppercase tracking-wider text-surface-600 dark:text-slate-400 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-100 dark:divide-slate-800">
                {products.map((product) => (
                  <tr key={product._id} className="hover:bg-surface-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="flex items-center gap-3 px-4 py-3.5">
                      {product.images?.[0] ? (
                        <img
                          src={resolveImageUrl(product.images[0])}
                          alt={product.name}
                          className="h-10 w-10 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-lg bg-surface-100 dark:bg-slate-800 flex items-center justify-center">🧵</div>
                      )}
                      <span className="font-semibold text-brand-900 dark:text-white">{product.name}</span>
                    </td>
                    <td className="px-4 py-3.5 text-surface-700 dark:text-slate-400">{product.category}</td>
                    <td className="px-4 py-3.5 text-surface-700 dark:text-slate-400 font-medium">
                      {product.stock} {product.unit}
                    </td>
                    <td className="px-4 py-3.5 font-semibold text-surface-900 dark:text-white">₹{product.price.toFixed(2)}</td>
                    <td className="px-4 py-3.5">
                      <button
                        onClick={() => handleToggleStatus(product)}
                        className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                          product.status === "available"
                            ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50"
                            : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50"
                        }`}
                      >
                        {product.status === "available" ? "Available" : "Out of Stock"}
                      </button>
                    </td>
                    <td className="px-4 py-3.5 text-right font-medium">
                      <button
                        onClick={() => setModalState({ open: true, product })}
                        className="mr-4 text-brand-600 dark:text-brand-400 hover:underline"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(product)}
                        className="text-red-500 dark:text-red-400 hover:underline"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {modalState.open && (
        <ProductFormModal
          product={modalState.product}
          onClose={() => setModalState({ open: false, product: null })}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
};

export default InventoryPage;
