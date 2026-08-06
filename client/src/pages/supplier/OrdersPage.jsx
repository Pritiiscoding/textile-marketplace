import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getSupplierOrdersRequest } from "../../api/orderApi";

const statusLabel = (status) =>
  status
    .split("_")
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(" ");

const statusColor = {
  pending: "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400",
  accepted: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400",
  preparing: "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400",
  ready_for_dispatch: "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400",
  completed: "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400",
  cancelled: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400",
};

const FILTERS = [
  { label: "All", value: "" },
  { label: "Pending", value: "pending" },
  { label: "Accepted", value: "accepted" },
  { label: "Preparing", value: "preparing" },
  { label: "Ready for Dispatch", value: "ready_for_dispatch" },
  { label: "Completed", value: "completed" },
  { label: "Cancelled", value: "cancelled" },
];

const OrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    setIsLoading(true);
    try {
      const { data } = await getSupplierOrdersRequest(filter || undefined);
      setOrders(data.orders);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load orders");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [filter]);

  // Auto-refresh on order updates via WebSocket events
  useEffect(() => {
    const handleOrderUpdate = () => {
      load();
    };

    window.addEventListener("tl:order_status_updated", handleOrderUpdate);
    window.addEventListener("tl:new_order", handleOrderUpdate);

    return () => {
      window.removeEventListener("tl:order_status_updated", handleOrderUpdate);
      window.removeEventListener("tl:new_order", handleOrderUpdate);
    };
  }, [filter]);

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-brand-900 dark:text-white">Orders</h1>

      {/* Filter tabs */}
      <div className="mb-5 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-all ${
              filter === f.value
                ? "bg-brand-600 text-white shadow-sm"
                : "bg-surface-100 dark:bg-slate-800 text-surface-700 dark:text-slate-300 hover:bg-surface-200 dark:hover:bg-slate-700 border border-surface-200 dark:border-slate-700"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {error && (
        <p className="mb-4 text-sm text-red-600 dark:text-red-400">{error}</p>
      )}

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-14 animate-pulse rounded-xl bg-surface-100 dark:bg-slate-800" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <span className="text-4xl mb-3">📦</span>
          <p className="text-surface-700 dark:text-slate-400 font-medium">No orders found.</p>
        </div>
      ) : (
        <div className="table-responsive">
          <div className="overflow-hidden rounded-2xl border border-surface-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-card">
            <table className="w-full text-sm">
              <thead className="bg-surface-50 dark:bg-slate-800/80 text-left">
                <tr>
                  <th className="px-4 py-3.5 text-xs font-semibold uppercase tracking-wider text-surface-600 dark:text-slate-400">Buyer</th>
                  <th className="px-4 py-3.5 text-xs font-semibold uppercase tracking-wider text-surface-600 dark:text-slate-400">Items</th>
                  <th className="px-4 py-3.5 text-xs font-semibold uppercase tracking-wider text-surface-600 dark:text-slate-400">Total</th>
                  <th className="px-4 py-3.5 text-xs font-semibold uppercase tracking-wider text-surface-600 dark:text-slate-400">Status</th>
                  <th className="px-4 py-3.5 text-xs font-semibold uppercase tracking-wider text-surface-600 dark:text-slate-400">Placed</th>
                  <th className="px-4 py-3.5 text-xs font-semibold uppercase tracking-wider text-surface-600 dark:text-slate-400 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-100 dark:divide-slate-800">
                {orders.map((order) => (
                  <tr key={order._id} className="hover:bg-surface-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-4 py-3.5 font-semibold text-brand-900 dark:text-white">
                      {order.buyerId?.profile?.companyName || order.buyerId?.email || "Buyer"}
                    </td>
                    <td className="px-4 py-3.5 text-surface-700 dark:text-slate-400">{order.items.length}</td>
                    <td className="px-4 py-3.5 font-semibold text-surface-900 dark:text-white">₹{order.totalAmount.toFixed(2)}</td>
                    <td className="px-4 py-3.5">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          statusColor[order.status] || "bg-surface-100 dark:bg-slate-800 text-surface-700 dark:text-slate-300"
                        }`}
                      >
                        {statusLabel(order.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-surface-700 dark:text-slate-400">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <Link
                        to={`/supplier/orders/${order._id}`}
                        className="inline-flex items-center gap-1 rounded-lg bg-brand-50 dark:bg-slate-800 px-3 py-1.5 text-xs font-semibold text-brand-600 dark:text-brand-400 hover:bg-brand-100 dark:hover:bg-slate-700 transition border border-brand-100 dark:border-slate-700"
                      >
                        View →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrdersPage;
