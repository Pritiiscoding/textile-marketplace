import { useEffect, useState } from "react";
import {
  adminGetProductsRequest,
  adminDeleteProductRequest,
} from "../../api/adminApi";

const AdminProductsPage = () => {
  const [products, setProducts] = useState([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    setIsLoading(true);
    setError("");
    try {
      const { data } = await adminGetProductsRequest({ search, status, limit: 100 });
      setProducts(data.products);
      setTotal(data.total);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load products");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { load(); }, [search, status]);

  const handleDelete = async (product) => {
    if (!window.confirm(`Delete "${product.name}"?`)) return;
    try {
      await adminDeleteProductRequest(product._id);
      setProducts((prev) => prev.filter((p) => p._id !== product._id));
      setTotal((t) => t - 1);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete product");
    }
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-brand-900">
          Products <span className="ml-1 text-sm font-normal text-gray-400">({total})</span>
        </h2>
      </div>

      <div className="mb-4 flex gap-3">
        <input
          type="text"
          placeholder="Search name or category…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-64 rounded border border-gray-300 px-3 py-1.5 text-sm focus:border-brand-500 focus:outline-none"
        />
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="rounded border border-gray-300 px-3 py-1.5 text-sm focus:border-brand-500 focus:outline-none"
        >
          <option value="">All statuses</option>
          <option value="available">Available</option>
          <option value="out_of_stock">Out of Stock</option>
        </select>
      </div>

      {error && <p className="mb-3 text-sm text-red-600">{error}</p>}

      {isLoading ? (
        <p className="text-gray-500">Loading…</p>
      ) : (
        <div className="table-responsive">
          <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-brand-50 text-left text-brand-700">
              <tr>
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Supplier</th>
                <th className="px-4 py-3">Price</th>
                <th className="px-4 py-3">Stock</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {products.map((p) => (
                <tr key={p._id}>
                  <td className="px-4 py-2 font-medium text-brand-900">{p.name}</td>
                  <td className="px-4 py-2 text-gray-600">{p.category}</td>
                  <td className="px-4 py-2 text-gray-600">
                    {p.supplierId?.profile?.companyName || p.supplierId?.email || "—"}
                  </td>
                  <td className="px-4 py-2 text-gray-600">${p.price.toFixed(2)}</td>
                  <td className="px-4 py-2 text-gray-600">{p.stock} {p.unit}</td>
                  <td className="px-4 py-2">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      p.status === "available" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                    }`}>
                      {p.status === "available" ? "Available" : "Out of Stock"}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-right">
                    <button
                      onClick={() => handleDelete(p)}
                      className="text-red-600 hover:underline"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>{products.length === 0 && (
            <p className="p-4 text-center text-sm text-gray-500">No products found.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminProductsPage;
