import { useEffect, useState } from "react";
import {
  adminGetOrdersRequest,
  adminUpdateOrderStatusRequest,
} from "../../api/adminApi";

const ALL_STATUSES = ["pending", "accepted", "preparing", "ready_for_dispatch", "completed", "cancelled"];

const STATUS_COLOR = {
  pending: "bg-yellow-100 text-yellow-700",
  accepted: "bg-blue-100 text-blue-700",
  preparing: "bg-indigo-100 text-indigo-700",
  ready_for_dispatch: "bg-purple-100 text-purple-700",
  completed: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
};

const statusLabel = (s) => s.split("_").map((w) => w[0].toUpperCase() + w.slice(1)).join(" ");

const AdminOrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState(null);

  const load = async () => {
    setIsLoading(true);
    setError("");
    try {
      const { data } = await adminGetOrdersRequest({ status: statusFilter || undefined, limit: 100 });
      setOrders(data.orders);
      setTotal(data.total);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load orders");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { load(); }, [statusFilter]);

  const handleStatusChange = async (order, newStatus) => {
    setUpdatingId(order._id);
    try {
      const { data } = await adminUpdateOrderStatusRequest(order._id, newStatus);
      setOrders((prev) => prev.map((o) => (o._id === order._id ? data.order : o)));
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update status");
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-brand-900">
          Orders <span className="ml-1 text-sm font-normal text-gray-400">({total})</span>
        </h2>
      </div>

      <div className="mb-4 flex gap-2 flex-wrap">
        {["", ...ALL_STATUSES].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`rounded-full px-3 py-1 text-sm ${
              statusFilter === s
                ? "bg-brand-600 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {s ? statusLabel(s) : "All"}
          </button>
        ))}
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
                <th className="px-4 py-3">Order ID</th>
                <th className="px-4 py-3">Buyer</th>
                <th className="px-4 py-3">Supplier</th>
                <th className="px-4 py-3">Total</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {orders.map((o) => (
                <tr key={o._id}>
                  <td className="px-4 py-2 font-mono text-xs text-gray-500">
                    #{o._id.slice(-8).toUpperCase()}
                  </td>
                  <td className="px-4 py-2 text-brand-900">
                    {o.buyerId?.profile?.companyName || o.buyerId?.email || "—"}
                  </td>
                  <td className="px-4 py-2 text-gray-600">
                    {o.supplierId?.profile?.companyName || o.supplierId?.email || "—"}
                  </td>
                  <td className="px-4 py-2 text-gray-600">${o.totalAmount.toFixed(2)}</td>
                  <td className="px-4 py-2 text-gray-500">
                    {new Date(o.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-2">
                    <select
                      value={o.status}
                      disabled={updatingId === o._id}
                      onChange={(e) => handleStatusChange(o, e.target.value)}
                      className={`rounded-full px-2 py-0.5 text-xs font-medium border-0 focus:outline-none cursor-pointer ${STATUS_COLOR[o.status]}`}
                    >
                      {ALL_STATUSES.map((s) => (
                        <option key={s} value={s}>{statusLabel(s)}</option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>{orders.length === 0 && (
            <p className="p-4 text-center text-sm text-gray-500">No orders found.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminOrdersPage;
