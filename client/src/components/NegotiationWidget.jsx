import { useState } from "react";
import api from "../api/axios";
import toast from "react-hot-toast";

const NegotiationWidget = ({ productId, currentPrice, isOpen, onClose, unit = "meter" }) => {
  const [offeredPrice, setOfferedPrice] = useState(Math.round(currentPrice * 0.9));
  const [quantity, setQuantity] = useState(1);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post("/negotiations", { productId, offeredPrice, quantity, initialMessage: message });
      toast.success("Price offer sent to supplier!");
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to send price offer");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-surface-200 dark:border-slate-700 p-6 shadow-2xl text-surface-900 dark:text-white">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-xl font-bold text-brand-900 dark:text-white">Smart Price Negotiation</h3>
          <span className="text-xs px-2.5 py-1 bg-brand-500/20 text-brand-600 dark:text-brand-400 rounded-full font-semibold">Live Offer</span>
        </div>
        <p className="text-xs text-surface-700 dark:text-slate-400 mb-4">Original Unit Price: <span className="line-through">₹{currentPrice}</span></p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-surface-700 dark:text-slate-300 mb-1">Your Offered Price (₹ / {unit})</label>
            <input
              type="number"
              step="0.01"
              value={offeredPrice}
              onChange={(e) => setOfferedPrice(e.target.value)}
              required
              className="input-field"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-surface-700 dark:text-slate-300 mb-1">Quantity ({unit})</label>
            <input
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
              className="input-field"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-surface-700 dark:text-slate-300 mb-1">Message to Supplier</label>
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="e.g. Requesting a discount for ongoing quarterly contracts..."
              className="input-field"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-surface-200 dark:border-slate-700 bg-surface-100 dark:bg-slate-800 px-4 py-2.5 text-sm font-medium text-surface-700 dark:text-slate-300 hover:bg-surface-200 dark:hover:bg-slate-700 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg hover:opacity-90 disabled:opacity-50 transition"
            >
              {loading ? "Sending Offer..." : "Submit Counter Offer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

};

export default NegotiationWidget;
