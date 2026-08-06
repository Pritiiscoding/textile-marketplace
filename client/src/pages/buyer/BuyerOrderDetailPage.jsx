import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getMyOrderByIdRequest } from "../../api/orderApi";
import StatusStepper from "../../components/StatusStepper";

const BuyerOrderDetailPage = () => {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await getMyOrderByIdRequest(id);
        setOrder(data.order);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load order");
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [id]);

  // Auto-refresh on order updates via WebSocket events
  useEffect(() => {
    const handleOrderUpdate = () => {
      const load = async () => {
        try {
          const { data } = await getMyOrderByIdRequest(id);
          setOrder(data.order);
        } catch (err) {
          setError(err.response?.data?.message || "Failed to load order");
        }
      };
      load();
    };

    window.addEventListener("tl:order_status_updated", handleOrderUpdate);
    window.addEventListener("tl:new_order", handleOrderUpdate);

    return () => {
      window.removeEventListener("tl:order_status_updated", handleOrderUpdate);
      window.removeEventListener("tl:new_order", handleOrderUpdate);
    };
  }, [id]);

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

  return (
    <div>
      <Link to="/buyer/orders" className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-surface-500 dark:text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 transition">
        &larr; Back to orders
      </Link>

      <h1 className="mb-6 text-2xl font-bold text-brand-900 dark:text-white">
        Order #{order._id.slice(-8).toUpperCase()}
      </h1>

      {/* Status tracker */}
      <div className="mb-8 rounded-2xl border border-surface-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-card">
        {order.status === "cancelled" ? (
          <div className="rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 px-4 py-3 text-sm font-medium text-red-700 dark:text-red-400">
            This order was cancelled.
          </div>
        ) : (
          <StatusStepper currentStatus={order.status} />
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="rounded-2xl border border-surface-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-card">
            <h2 className="mb-4 font-bold text-brand-900 dark:text-white text-lg">Items Ordered</h2>
            <div className="table-responsive">
              <table className="w-full text-sm">
                <thead className="border-b border-surface-100 dark:border-slate-800 text-left text-surface-500 dark:text-slate-500">
                  <tr>
                    <th className="pb-3 font-medium uppercase tracking-wider text-xs">Product</th>
                    <th className="pb-3 font-medium uppercase tracking-wider text-xs">Color</th>
                    <th className="pb-3 font-medium uppercase tracking-wider text-xs">Qty</th>
                    <th className="pb-3 font-medium uppercase tracking-wider text-xs text-right">Unit Price</th>
                    <th className="pb-3 font-medium uppercase tracking-wider text-xs text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-50 dark:divide-slate-800/50">
                  {order.items.map((item, i) => (
                    <tr key={i}>
                      <td className="py-3 font-semibold text-brand-900 dark:text-white">{item.name}</td>
                      <td className="py-3 text-surface-600 dark:text-slate-400">{item.color || "—"}</td>
                      <td className="py-3 text-surface-600 dark:text-slate-400">{item.quantity}</td>
                      <td className="py-3 text-right text-surface-600 dark:text-slate-400">₹{item.price.toFixed(2)}</td>
                      <td className="py-3 text-right font-medium text-brand-900 dark:text-white">
                        ₹{(item.price * item.quantity).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-4 flex justify-end border-t border-surface-100 dark:border-slate-800 pt-4 text-lg font-bold text-brand-900 dark:text-white">
              Total: ₹{order.totalAmount.toFixed(2)}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl border border-surface-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-card">
            <h2 className="mb-3 font-bold text-brand-900 dark:text-white text-lg flex items-center gap-2">🏭 Supplier</h2>
            <p className="font-semibold text-brand-900 dark:text-white">
              {order.supplierId?.profile?.companyName || order.supplierId?.email || "—"}
            </p>
            {order.supplierId?.profile?.phone && (
              <p className="text-sm text-surface-600 dark:text-slate-400 mt-1">{order.supplierId.profile.phone}</p>
            )}
          </div>

          <div className="rounded-2xl border border-surface-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-card">
            <h2 className="mb-3 font-bold text-brand-900 dark:text-white text-lg flex items-center gap-2">🚚 Shipping Address</h2>
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
              <p className="text-sm text-surface-500 dark:text-slate-500 italic">No shipping info.</p>
            )}
          </div>

          <div className="rounded-2xl border border-surface-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-card">
            <h2 className="mb-2 font-bold text-brand-900 dark:text-white text-lg flex items-center gap-2">📅 Order Info</h2>
            <p className="text-sm text-surface-600 dark:text-slate-400">
              Placed:{" "}
              <span className="font-medium text-surface-900 dark:text-white">
                {new Date(order.createdAt).toLocaleDateString(undefined, {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </span>
            </p>
          </div>

          {order.status === "ready_for_dispatch" && (
            <div className="rounded-2xl border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50 dark:bg-emerald-950/40 p-4 shadow-card">
              <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
                🚚 Your order is ready for dispatch. The supplier will ship it soon.
              </p>
            </div>
          )}

          {order.status === "completed" && (
            <div className="rounded-2xl border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50 dark:bg-emerald-950/40 p-4 shadow-card">
              <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
                ✅ Order completed successfully!
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BuyerOrderDetailPage;
