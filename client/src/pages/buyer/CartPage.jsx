import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../../context/CartContext";
import { resolveImageUrl } from "../../utils/media";
import toast from "react-hot-toast";

const CartPage = () => {
  const { cart, isLoading, refreshCart, updateItem, removeItem } = useCart();
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [busyKey, setBusyKey] = useState(null);

  useEffect(() => {
    refreshCart();
  }, [refreshCart]);

  const itemKey = (item) => `${item.productId._id}:${item.color || ""}`;

  const handleQuantityChange = async (item, newQty) => {
    if (newQty < 1) return;
    if (newQty > item.productId.stock) {
      setError(`Only ${item.productId.stock} items available in stock`);
      return;
    }
    setBusyKey(itemKey(item));
    setError("");
    try {
      await updateItem(item.productId._id, newQty, item.color);
      toast.success("Quantity updated successfully");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update quantity");
      toast.error("Failed to update quantity");
    } finally {
      setBusyKey(null);
    }
  };

  const handleRemove = async (item) => {
    setBusyKey(itemKey(item));
    try {
      await removeItem(item.productId._id, item.color);
      toast.success("Item removed from cart");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to remove item");
      toast.error("Failed to remove item");
    } finally {
      setBusyKey(null);
    }
  };

  const items = (cart.items || []).filter((i) => i.productId);
  const total = items.reduce((sum, i) => {
    const price = i.negotiatedPrice || i.productId.price;
    return sum + price * i.quantity;
  }, 0);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-24 animate-pulse rounded-2xl bg-surface-100 dark:bg-slate-800" />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <span className="text-6xl mb-4">🛒</span>
        <h1 className="mb-2 text-2xl font-bold text-brand-900 dark:text-white">Your cart is empty</h1>
        <p className="mb-6 text-surface-700 dark:text-slate-400">Browse the marketplace to find fabrics and materials.</p>
        <Link
          to="/buyer"
          className="btn-primary rounded-xl px-6 py-2.5 text-sm font-semibold text-white"
        >
          Browse Marketplace
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-brand-900 dark:text-white">Your Cart</h1>

      {error && (
        <p className="mb-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-100 dark:border-red-900/50 px-4 py-2 text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Cart items */}
        <div className="space-y-4 lg:col-span-2">
          {items.map((item) => {
            const product = item.productId;
            const key = itemKey(item);
            const isBusy = busyKey === key;
            const overStock = item.quantity > product.stock;

            return (
              <div
                key={key}
                className="flex gap-4 rounded-2xl border border-surface-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-card transition-all"
              >
                <Link to={`/buyer/products/${product._id}`} className="shrink-0">
                  {product.images?.[0] ? (
                    <img
                      src={resolveImageUrl(product.images[0])}
                      alt={product.name}
                      className="h-20 w-20 rounded-xl object-cover"
                    />
                  ) : (
                    <div className="h-20 w-20 rounded-xl bg-surface-100 dark:bg-slate-800 flex items-center justify-center text-2xl">🧵</div>
                  )}
                </Link>

                <div className="flex-1 min-w-0">
                  <Link
                    to={`/buyer/products/${product._id}`}
                    className="font-semibold text-brand-900 dark:text-white hover:text-brand-600 dark:hover:text-brand-400 transition"
                  >
                    {product.name}
                  </Link>
                  {item.color && <p className="text-xs text-surface-600 dark:text-slate-400 mt-0.5">Color: {item.color}</p>}
                  <p className="text-sm text-surface-600 dark:text-slate-400">
                    ₹{(item.negotiatedPrice || product.price).toFixed(2)} / {product.unit}
                    {item.negotiatedPrice && (
                      <span className="ml-2 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                        (Negotiated)
                      </span>
                    )}
                  </p>
                  {overStock && (
                    <p className="mt-1 text-xs text-red-600 dark:text-red-400 font-medium">
                      Only {product.stock} left in stock — please reduce quantity.
                    </p>
                  )}

                  <div className="mt-2.5 flex items-center gap-3">
                    <div className="flex items-center rounded-lg border border-surface-200 dark:border-slate-700 overflow-hidden">
                      <button
                        onClick={() => handleQuantityChange(item, item.quantity - 1)}
                        disabled={isBusy || item.quantity <= 1}
                        className="px-3 py-1.5 text-surface-600 dark:text-slate-400 hover:bg-surface-100 dark:hover:bg-slate-800 disabled:opacity-40 transition"
                      >
                        −
                      </button>
                      <span className="w-10 text-center text-sm font-semibold text-surface-900 dark:text-white border-x border-surface-200 dark:border-slate-700 py-1.5">{item.quantity}</span>
                      <button
                        onClick={() => handleQuantityChange(item, item.quantity + 1)}
                        disabled={isBusy || item.quantity >= product.stock}
                        className="px-3 py-1.5 text-surface-600 dark:text-slate-400 hover:bg-surface-100 dark:hover:bg-slate-800 disabled:opacity-40 transition"
                      >
                        +
                      </button>
                    </div>
                    <button
                      onClick={() => handleRemove(item)}
                      disabled={isBusy}
                      className="text-xs font-semibold text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 disabled:opacity-40 transition"
                    >
                      Remove
                    </button>
                  </div>
                </div>

                <div className="text-right font-bold text-brand-900 dark:text-white shrink-0">
                  ₹{(product.price * item.quantity).toFixed(2)}
                </div>
              </div>
            );
          })}
        </div>

        {/* Summary */}
        <div className="h-fit rounded-2xl border border-surface-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-card">
          <h2 className="mb-4 font-bold text-brand-900 dark:text-white text-lg">Order Summary</h2>
          <div className="flex justify-between text-sm text-surface-600 dark:text-slate-400 mb-2">
            <span>Subtotal ({items.reduce((n, i) => n + i.quantity, 0)} items)</span>
            <span>₹{total.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm text-surface-600 dark:text-slate-400 mb-3">
            <span>Shipping</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-medium">Free</span>
          </div>
          <div className="border-t border-surface-100 dark:border-slate-800 pt-3 flex justify-between text-base font-bold text-brand-900 dark:text-white">
            <span>Total</span>
            <span>₹{total.toFixed(2)}</span>
          </div>
          <button
            onClick={() => navigate("/buyer/checkout")}
            className="btn-primary mt-4 w-full rounded-xl py-2.5 text-sm font-semibold text-white"
          >
            Proceed to Checkout →
          </button>
          <Link to="/buyer" className="mt-3 block text-center text-xs text-surface-600 dark:text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 transition">
            ← Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
};

export default CartPage;
