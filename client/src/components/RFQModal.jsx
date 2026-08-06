import { useState } from "react";
import api from "../api/axios";
import toast from "react-hot-toast";

const RFQModal = ({ productId, productName, isOpen, onClose, unit = "meter" }) => {
  const [quantity, setQuantity] = useState(500);
  const [targetDeliveryDate, setTargetDeliveryDate] = useState("");
  const [customRequirements, setCustomRequirements] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post("/rfq", { productId, quantity, targetDeliveryDate, customRequirements });
      toast.success("Request for Quote (RFQ) submitted to supplier!");
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to submit RFQ");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-surface-200 dark:border-slate-700 p-6 shadow-2xl text-surface-900 dark:text-white">
        <h3 className="text-xl font-bold mb-1 text-brand-900 dark:text-white">Request for Quote (RFQ)</h3>
        <p className="text-xs text-surface-700 dark:text-slate-400 mb-4">Product: <span className="text-brand-600 dark:text-brand-400 font-semibold">{productName}</span></p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-surface-700 dark:text-slate-300 mb-1">Bulk Quantity Needed ({unit})</label>
            <input
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              required
              className="input-field"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-surface-700 dark:text-slate-300 mb-1">Target Delivery Date</label>
            <input
              type="date"
              value={targetDeliveryDate}
              onChange={(e) => setTargetDeliveryDate(e.target.value)}
              className="input-field"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-surface-700 dark:text-slate-300 mb-1">Custom Specifications & Packaging</label>
            <textarea
              rows="3"
              value={customRequirements}
              onChange={(e) => setCustomRequirements(e.target.value)}
              placeholder="Specify fabric finish, custom roll width, packaging specs..."
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
              className="flex-1 rounded-xl bg-gradient-to-r from-brand-500 to-accent-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg hover:opacity-90 disabled:opacity-50 transition"
            >
              {loading ? "Submitting..." : "Send Bulk Inquiry"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

};

export default RFQModal;
