import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useCart } from "../../context/CartContext";
import { useAuth } from "../../context/AuthContext";
import { checkoutRequest } from "../../api/orderApi";
import PhoneInput from "../../components/PhoneInput";
import { toast } from "react-hot-toast";

const STEPS = ["Shipping", "Review", "Confirmation"];

const SHIPPING_LABELS = {
  contactName: "Contact name",
  phone: "Phone",
  street: "Street address",
  city: "City",
  state: "State / Region",
  country: "Country",
  zip: "ZIP / Postal code",
};

const emptyShipping = {
  contactName: "",
  phone: "",
  street: "",
  city: "",
  state: "",
  country: "",
  zip: "",
  notes: "",
};

const CheckoutPage = () => {
  const { cart, refreshCart, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(0); // 0=shipping, 1=review, 2=confirmation
  const [shipping, setShipping] = useState(emptyShipping);
  const [shippingError, setShippingError] = useState("");
  const [isPlacing, setIsPlacing] = useState(false);
  const [createdOrders, setCreatedOrders] = useState([]);

  useEffect(() => {
    refreshCart();
  }, [refreshCart]);

  useEffect(() => {
    const p = user?.profile || {};
    const addr = p.address || {};
    setShipping({
      contactName: p.contactName || "",
      phone: p.phone || "",
      street: addr.street || "",
      city: addr.city || "",
      state: addr.state || "",
      country: addr.country || "",
      zip: addr.zip || "",
      notes: "",
    });
  }, [user]);

  const items = (cart.items || []).filter((i) => i.productId);
  const total = items.reduce((sum, i) => {
    const price = i.negotiatedPrice || i.productId.price;
    return sum + price * i.quantity;
  }, 0);

  const handleShippingChange = (e) => {
    setShipping((s) => ({ ...s, [e.target.name]: e.target.value }));
  };

  const validateShipping = () => {
    // No client-side validation - let server handle it
    setShippingError("");
    return true;
  };

  const handleNextToReview = (e) => {
    e.preventDefault();
    if (validateShipping()) setStep(1);
  };

  const handlePlaceOrder = async () => {
    setIsPlacing(true);
    try {
      const { data } = await checkoutRequest({ shippingInfo: shipping });
      setCreatedOrders(data.orders);
      await clearCart();
      toast.success("Order placed successfully!");
      setStep(2);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to place order");
    } finally {
      setIsPlacing(false);
    }
  };

  if (items.length === 0 && step < 2) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <span className="text-6xl mb-4">🛒</span>
        <h1 className="mb-2 text-2xl font-bold text-brand-900 dark:text-white">Your cart is empty</h1>
        <p className="mb-6 text-surface-700 dark:text-slate-400">Add some items before checking out.</p>
        <Link
          to="/buyer"
          className="btn-primary rounded-xl px-6 py-2.5 text-sm font-semibold text-white"
        >
          Browse Marketplace
        </Link>
      </div>
    );
  }

  const field = (label, name, type = "text", placeholder = "") => (
    <div>
      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-surface-600 dark:text-slate-400">{label}</label>
      <input
        type={type}
        name={name}
        value={shipping[name] ?? ""}
        onChange={handleShippingChange}
        placeholder={placeholder}
        className="input-field"
      />
    </div>
  );

  return (
    <div className="mx-auto max-w-2xl">
      {/* Step indicator */}
      <div className="mb-10 flex items-center gap-0">
        {STEPS.map((label, i) => (
          <div key={label} className="flex flex-1 items-center">
            <div className="flex flex-col items-center">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold transition-all duration-300 ${
                  i < step
                    ? "bg-brand-600 text-white shadow-md shadow-brand-500/30"
                    : i === step
                    ? "border-2 border-brand-600 bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-400 shadow-md shadow-brand-500/20"
                    : "border-2 border-surface-200 dark:border-slate-700 bg-surface-50 dark:bg-slate-800 text-surface-400 dark:text-slate-500"
                }`}
              >
                {i < step ? "✓" : i + 1}
              </div>
              <span
                className={`mt-2 text-xs uppercase tracking-wider ${
                  i === step ? "font-bold text-brand-700 dark:text-brand-400" : "font-semibold text-surface-400 dark:text-slate-500"
                }`}
              >
                {label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`mb-5 h-1 flex-1 rounded-full mx-2 transition-colors duration-300 ${i < step ? "bg-brand-500" : "bg-surface-200 dark:bg-slate-700"}`} />
            )}
          </div>
        ))}
      </div>

      {/* Step 0: Shipping */}
      {step === 0 && (
        <div className="rounded-2xl border border-surface-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-card animate-fade-in-up">
          <h2 className="mb-6 text-xl font-bold text-brand-900 dark:text-white flex items-center gap-2">
            🚚 Shipping Information
          </h2>
          {shippingError && (
            <div className="mb-5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 px-4 py-3 text-sm text-red-700 dark:text-red-400">
              {shippingError}
            </div>
          )}
          <form onSubmit={handleNextToReview} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {field("Contact name", "contactName", "text", "e.g. Alex Kim")}
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-surface-600 dark:text-slate-400">Phone</label>
                <PhoneInput
                  value={shipping.phone}
                  onChange={(phone) => setShipping((s) => ({ ...s, phone }))}
                  className="input-field"
                />
              </div>
            </div>
            {field("Street address", "street")}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {field("City", "city")}
              {field("State / Region", "state")}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {field("Country", "country")}
              {field("ZIP / Postal code", "zip")}
            </div>
            <div className="pt-2">
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-surface-600 dark:text-slate-400">
                Delivery notes (optional)
              </label>
              <textarea
                name="notes"
                value={shipping.notes}
                onChange={handleShippingChange}
                rows={2}
                placeholder="e.g. Loading dock entrance, call ahead"
                className="input-field resize-none"
              />
            </div>
            <div className="pt-2 border-t border-surface-100 dark:border-slate-800 mt-2">
              <button
                type="submit"
                className="btn-primary w-full shadow-lg"
              >
                Continue to Review →
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Step 1: Review */}
      {step === 1 && (
        <div className="space-y-6 animate-fade-in-up">
          <div className="rounded-2xl border border-surface-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-card">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-bold text-brand-900 dark:text-white text-lg">Order Items</h2>
              <Link to="/buyer/cart" className="text-sm font-semibold text-brand-600 dark:text-brand-400 hover:underline">
                Edit cart
              </Link>
            </div>
            <ul className="divide-y divide-surface-100 dark:divide-slate-800">
              {items.map((item) => (
                <li
                  key={`${item.productId._id}:${item.color || ""}`}
                  className="flex items-center justify-between py-3 text-sm"
                >
                  <div>
                    <span className="font-semibold text-brand-900 dark:text-white">{item.productId.name}</span>
                    {item.color && <span className="ml-2 text-surface-500 dark:text-slate-400">({item.color})</span>}
                    <span className="ml-2 font-medium text-surface-600 dark:text-slate-400">× {item.quantity}</span>
                    {item.negotiatedPrice && (
                      <span className="ml-2 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                        (Negotiated)
                      </span>
                    )}
                  </div>
                  <span className="font-medium text-surface-900 dark:text-white">
                    ₹{((item.negotiatedPrice || item.productId.price) * item.quantity).toFixed(2)}
                  </span>
                </li>
              ))}
            </ul>
            <div className="mt-2 flex justify-between border-t border-surface-100 dark:border-slate-800 pt-4 text-lg font-bold text-brand-900 dark:text-white">
              <span>Total</span>
              <span>₹{total.toFixed(2)}</span>
            </div>
          </div>

          <div className="rounded-2xl border border-surface-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-card">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-bold text-brand-900 dark:text-white text-lg">Shipping to</h2>
              <button
                onClick={() => setStep(0)}
                className="text-sm font-semibold text-brand-600 dark:text-brand-400 hover:underline"
              >
                Edit address
              </button>
            </div>
            <div className="space-y-1 text-sm text-surface-700 dark:text-slate-300">
              <p className="font-semibold text-brand-900 dark:text-white">{shipping.contactName} · {shipping.phone}</p>
              <p>{shipping.street}</p>
              <p>{shipping.city}, {shipping.state} {shipping.zip}</p>
              <p>{shipping.country}</p>
              {shipping.notes && (
                <div className="mt-3 rounded-lg bg-surface-50 dark:bg-slate-800 p-3 italic text-surface-600 dark:text-slate-400 border border-surface-100 dark:border-slate-700">
                  "{shipping.notes}"
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setStep(0)}
              className="btn-outline flex-1 py-3"
            >
              ← Back
            </button>
            <button
              onClick={handlePlaceOrder}
              disabled={isPlacing}
              className="btn-primary flex-[2] py-3 shadow-lg disabled:opacity-70"
            >
              {isPlacing ? (
                <>
                  <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  Placing order...
                </>
              ) : (
                "Place Order"
              )}
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Confirmation */}
      {step === 2 && (
        <div className="rounded-2xl border border-surface-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-10 text-center shadow-card animate-fade-in-up">
          <div className="mb-6 text-6xl">🎉</div>
          <h2 className="mb-3 text-2xl font-bold text-brand-900 dark:text-white">Order Placed Successfully!</h2>
          <p className="text-surface-700 dark:text-slate-400 mb-2">
            {createdOrders.length > 1
              ? `${createdOrders.length} orders were created (one per supplier).`
              : "Your order has been created and sent to the supplier."}
          </p>
          <p className="mb-8 text-sm text-surface-500 dark:text-slate-500">
            You can track the status in your order history.
          </p>
          <div className="flex justify-center gap-4">
            <Link
              to="/buyer/orders"
              className="btn-primary px-6 py-2.5"
            >
              View Orders
            </Link>
            <Link
              to="/buyer"
              className="btn-outline px-6 py-2.5"
            >
              Keep Shopping
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default CheckoutPage;
