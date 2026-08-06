import { useCallback, useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getOrderByIdRequest, updateOrderStatusRequest } from "../../api/orderApi";
import StatusStepper from "../../components/StatusStepper";

const NEXT_STATUS = {
  pending: "accepted",
  accepted: "preparing",
  preparing: "ready_for_dispatch",
  ready_for_dispatch: "completed",
};

const nextLabel = {
  accepted: "Accept Order",
  preparing: "Start Preparing",
  ready_for_dispatch: "Mark Ready for Dispatch",
  completed: "Mark Completed",
};

const OrderDetailPage = () => {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  const loadOrder = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data } = await getOrderByIdRequest(id);
      setOrder(data.order);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load order");
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadOrder();
  }, [loadOrder]);

  // Auto-refresh on order updates via WebSocket events
  useEffect(() => {
    const handleOrderUpdate = () => {
      loadOrder();
    };

    window.addEventListener("tl:order_status_updated", handleOrderUpdate);
    window.addEventListener("tl:new_order", handleOrderUpdate);

    return () => {
      window.removeEventListener("tl:order_status_updated", handleOrderUpdate);
      window.removeEventListener("tl:new_order", handleOrderUpdate);
    };
  }, [loadOrder]);

  const handleUpdateStatus = async (status) => {
    setIsUpdating(true);
    try {
      const { data } = await updateOrderStatusRequest(id, status);
      setOrder(data.order);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update order status");
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-1/4 bg-surface-100 dark:bg-slate-800 rounded"></div>
        <div className="h-32 bg-surface-100 dark:bg-slate-800 rounded-2xl"></div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 h-64 bg-surface-100 dark:bg-slate-800 rounded-2xl"></div>
          <div className="space-y-6">
            <div className="h-32 bg-surface-100 dark:bg-slate-800 rounded-2xl"></div>
            <div className="h-32 bg-surface-100 dark:bg-slate-800 rounded-2xl"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) return <p className="rounded-xl bg-red-50 dark:bg-red-950/40 p-4 text-red-600 dark:text-red-400">{error}</p>;
  if (!order) return null;

  const upcomingStatus = NEXT_STATUS[order.status];
  const canAdvance = !!upcomingStatus;
  const canCancel = order.status !== "completed" && order.status !== "cancelled";

  return (
    <div>
      <Link to="/supplier/orders" className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-surface-500 dark:text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 transition">
        &larr; Back to orders
      </Link>

      <h1 className="mb-6 text-2xl font-bold text-brand-900 dark:text-white">
        Order #{order._id.slice(-8).toUpperCase()}
      </h1>

      <div className="mb-8 rounded-2xl border border-surface-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-card">
        <StatusStepper currentStatus={order.status} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="rounded-2xl border border-surface-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-card">
            <h2 className="mb-4 font-bold text-brand-900 dark:text-white text-lg">Order Items</h2>
            <div className="table-responsive">
              <table className="w-full text-sm">
                <thead className="border-b border-surface-100 dark:border-slate-800 text-left text-surface-500 dark:text-slate-500">
                  <tr>
                    <th className="pb-3 font-medium uppercase tracking-wider text-xs">Product</th>
                    <th className="pb-3 font-medium uppercase tracking-wider text-xs">Color</th>
                    <th className="pb-3 font-medium uppercase tracking-wider text-xs">Qty</th>
                    <th className="pb-3 font-medium uppercase tracking-wider text-xs text-right">Price</th>
                    <th className="pb-3 font-medium uppercase tracking-wider text-xs text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-50 dark:divide-slate-800/50">
                  {order.items.map((item, i) => (
                    <tr key={i}>
                      <td className="py-3 font-semibold text-brand-900 dark:text-white">{item.name}</td>
                      <td className="py-3 text-surface-600 dark:text-slate-400">{item.color || "—"}</td>
                      <td className="py-3 text-surface-600 dark:text-slate-400">{item.quantity}</td>
                      <td className="py-3 text-right text-surface-600 dark:text-slate-400">
                        ₹{item.price.toFixed(2)}
                      </td>
                      <td className="py-3 text-right font-medium text-surface-900 dark:text-white">
                        ₹{(item.price * item.quantity).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-4 flex justify-end border-t border-surface-100 dark:border-slate-800 pt-4">
              <span className="text-lg font-bold text-brand-900 dark:text-white">
                Total: ₹{order.totalAmount.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl border border-surface-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-card">
            <h2 className="mb-4 font-bold text-brand-900 dark:text-white text-lg flex items-center gap-2">
              👤 Buyer Details
            </h2>
            <div className="space-y-2">
              <p className="font-semibold text-brand-900 dark:text-white">
                {order.buyerId?.profile?.companyName || order.buyerId?.email}
              </p>
              {order.buyerId?.profile?.contactName && (
                <p className="text-sm text-surface-600 dark:text-slate-400">{order.buyerId.profile.contactName}</p>
              )}
              {order.buyerId?.profile?.phone && (
                <p className="text-sm text-surface-600 dark:text-slate-400">{order.buyerId.profile.phone}</p>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-surface-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-card">
            <h2 className="mb-4 font-bold text-brand-900 dark:text-white text-lg flex items-center gap-2">
              🚚 Shipping Info
            </h2>
            {order.shippingInfo ? (
              <div className="space-y-1.5 text-sm text-surface-700 dark:text-slate-300">
                <p className="font-semibold text-brand-900 dark:text-white">{order.shippingInfo.contactName}</p>
                <p>{order.shippingInfo.phone}</p>
                <p>{order.shippingInfo.street}</p>
                <p>
                  {order.shippingInfo.city}, {order.shippingInfo.state} {order.shippingInfo.zip}
                </p>
                <p>{order.shippingInfo.country}</p>
                {order.shippingInfo.notes && (
                  <div className="mt-3 rounded-lg bg-surface-50 dark:bg-slate-800 p-3 italic text-surface-600 dark:text-slate-400 border border-surface-100 dark:border-slate-700">
                    "{order.shippingInfo.notes}"
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-surface-500 dark:text-slate-500 italic">No shipping info provided.</p>
            )}
          </div>

          <div className="space-y-3">
            {canAdvance && (
              <button
                onClick={() => handleUpdateStatus(upcomingStatus)}
                disabled={isUpdating}
                className="btn-primary w-full shadow-lg"
              >
                {isUpdating ? "Updating..." : nextLabel[upcomingStatus]}
              </button>
            )}
            {canCancel && (
              <button
                onClick={() => {
                  if (window.confirm("Cancel this order? This cannot be undone.")) {
                    handleUpdateStatus("cancelled");
                  }
                }}
                disabled={isUpdating}
                className="w-full rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/20 py-2.5 text-sm font-bold text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 disabled:opacity-50 transition"
              >
                Cancel Order
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailPage;
