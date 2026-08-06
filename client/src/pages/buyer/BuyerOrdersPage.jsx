import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getMyOrdersRequest } from "../../api/orderApi";

const STATUS_LABEL = {
  pending: "Pending",
  accepted: "Accepted",
  preparing: "Preparing",
  ready_for_dispatch: "Ready for Dispatch",
  completed: "Completed",
  cancelled: "Cancelled",
};

const STATUS_COLOR = {
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

const BuyerOrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    setIsLoading(true);
    try {
      const { data } = await getMyOrdersRequest(filter || undefined);
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
      <h1 className="mb-6 text-2xl font-bold text-brand-900 dark:text-white">Order History</h1>

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

      {error && <p className="mb-4 text-sm text-red-600 dark:text-red-400">{error}</p>}

      {isLoading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl bg-surface-100 dark:bg-slate-800" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <span className="text-5xl mb-4">📦</span>
          <p className="text-surface-700 dark:text-slate-400 font-medium mb-2">No orders yet.</p>
          <Link to="/buyer" className="text-sm text-brand-600 dark:text-brand-400 hover:underline font-semibold">
            Browse the marketplace →
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div
              key={order._id}
              className="rounded-2xl border border-surface-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-card hover:shadow-card-hover transition-all"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-bold text-brand-900 dark:text-white">
                    Order #{order._id.slice(-8).toUpperCase()}
                  </p>
                  <p className="mt-0.5 text-sm text-surface-700 dark:text-slate-400">
                    Supplier: {order.supplierId?.profile?.companyName || order.supplierId?.email || "—"}
                  </p>
                  <p className="text-sm text-surface-700 dark:text-slate-400">
                    {new Date(order.createdAt).toLocaleDateString(undefined, {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                    &nbsp;·&nbsp;{order.items.length} item(s)&nbsp;·&nbsp;
                    <strong className="text-surface-900 dark:text-white">₹{order.totalAmount.toFixed(2)}</strong>
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      STATUS_COLOR[order.status] || "bg-surface-100 dark:bg-slate-800 text-surface-600 dark:text-slate-400"
                    }`}
                  >
                    {STATUS_LABEL[order.status] || order.status}
                  </span>
                  <Link
                    to={`/buyer/orders/${order._id}`}
                    className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline"
                  >
                    View details →
                  </Link>
                </div>
              </div>

              <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1 border-t border-surface-100 dark:border-slate-800 pt-3">
                {order.items.map((item, i) => (
                  <li key={i} className="text-xs text-surface-700 dark:text-slate-400">
                    {item.name}{item.color ? ` (${item.color})` : ""} × {item.quantity}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BuyerOrdersPage;
