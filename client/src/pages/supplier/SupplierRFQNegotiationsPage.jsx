import { useEffect, useState } from "react";
import { getRFQsRequest, respondRFQRequest } from "../../api/rfqApi";
import { getNegotiationsRequest, updateNegotiationRequest } from "../../api/negotiationApi";
import toast from "react-hot-toast";

const SupplierRFQNegotiationsPage = () => {
  const [activeTab, setActiveTab] = useState("rfqs"); // 'rfqs' | 'negotiations'
  const [rfqs, setRfqs] = useState([]);
  const [negotiations, setNegotiations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // RFQ response state
  const [rfqResponse, setRfqResponse] = useState({}); // { [rfqId]: { quotedPrice: '', notes: '' } }
  // Negotiation counter state
  const [negResponse, setNegResponse] = useState({}); // { [negId]: { counterPrice: '', message: '' } }

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [rfqRes, negRes] = await Promise.all([getRFQsRequest(), getNegotiationsRequest()]);
      setRfqs(rfqRes.data.rfqs || []);
      setNegotiations(negRes.data.negotiations || []);
    } catch {
      toast.error("Failed to load RFQs & Negotiations");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Auto-refresh on RFQ/Negotiation updates via WebSocket events
  useEffect(() => {
    const handleRFQUpdate = () => {
      fetchData();
    };

    window.addEventListener("tl:new_rfq", handleRFQUpdate);
    window.addEventListener("tl:rfq_updated", handleRFQUpdate);
    window.addEventListener("tl:new_negotiation", handleRFQUpdate);
    window.addEventListener("tl:negotiation_updated", handleRFQUpdate);

    return () => {
      window.removeEventListener("tl:new_rfq", handleRFQUpdate);
      window.removeEventListener("tl:rfq_updated", handleRFQUpdate);
      window.removeEventListener("tl:new_negotiation", handleRFQUpdate);
      window.removeEventListener("tl:negotiation_updated", handleRFQUpdate);
    };
  }, []);

  const handleRespondRFQ = async (id, status) => {
    console.log("handleRespondRFQ called with:", { id, status });
    
    // For decline, we don't need validation
    if (status === "rejected") {
      try {
        console.log("Declining RFQ:", id);
        await respondRFQRequest(id, { status });
        toast.success("RFQ declined successfully!");
        fetchData();
      } catch (err) {
        console.error("Decline RFQ error:", err);
        toast.error(err.response?.data?.message || "Failed to decline RFQ");
      }
      return;
    }

    // For quote, validate price
    const input = rfqResponse[id] || {};
    if (!input.quotedPrice || Number(input.quotedPrice) <= 0) {
      toast.error("Please enter a valid quoted price");
      return;
    }

    try {
      console.log("Submitting quote for RFQ:", id, "with price:", input.quotedPrice);
      await respondRFQRequest(id, {
        status,
        quotedPrice: Number(input.quotedPrice),
        supplierNotes: input.notes,
      });
      toast.success("Quote sent successfully!");
      fetchData();
    } catch (err) {
      console.error("Quote RFQ error:", err);
      toast.error(err.response?.data?.message || "Failed to send quote");
    }
  };

  const handleUpdateNegotiation = async (id, status) => {
    console.log("handleUpdateNegotiation called with:", { id, status });
    
    // For decline and accept, we don't need validation
    if (status === "declined" || status === "accepted") {
      try {
        console.log("Updating negotiation status:", id, status);
        await updateNegotiationRequest(id, { status });
        toast.success(`Offer ${status === "accepted" ? "accepted" : "declined"} successfully!`);
        fetchData();
      } catch (err) {
        console.error("Update negotiation error:", err);
        toast.error(err.response?.data?.message || "Failed to update negotiation");
      }
      return;
    }

    // For counter offer, validate price
    const input = negResponse[id] || {};
    if (!input.counterPrice || Number(input.counterPrice) <= 0) {
      toast.error("Please enter a valid counter price");
      return;
    }

    try {
      console.log("Sending counter offer for negotiation:", id, "with price:", input.counterPrice);
      await updateNegotiationRequest(id, {
        status,
        counterPrice: Number(input.counterPrice),
        message: input.message,
      });
      toast.success("Counter offer sent successfully!");
      fetchData();
    } catch (err) {
      console.error("Counter offer error:", err);
      toast.error(err.response?.data?.message || "Failed to send counter offer");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brand-900 dark:text-white">RFQs & Price Negotiations</h1>
        <p className="text-sm text-surface-500 dark:text-slate-400">
          Manage bulk inquiries, custom quotes, and buyer price offers.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-3 border-b border-surface-200 dark:border-slate-800 pb-3">
        <button
          onClick={() => setActiveTab("rfqs")}
          className={`rounded-full px-5 py-2 text-sm font-semibold transition-all ${
            activeTab === "rfqs"
              ? "bg-brand-600 text-white shadow-md"
              : "bg-surface-100 dark:bg-slate-800 text-surface-700 dark:text-slate-300 hover:bg-surface-200"
          }`}
        >
          📋 Requests for Quote ({rfqs.length})
        </button>
        <button
          onClick={() => setActiveTab("negotiations")}
          className={`rounded-full px-5 py-2 text-sm font-semibold transition-all ${
            activeTab === "negotiations"
              ? "bg-emerald-600 text-white shadow-md"
              : "bg-surface-100 dark:bg-slate-800 text-surface-700 dark:text-slate-300 hover:bg-surface-200"
          }`}
        >
          💬 Price Negotiations ({negotiations.length})
        </button>
      </div>

      {isLoading ? (
        <div className="p-8 text-center text-slate-400 animate-pulse">Loading inquiries...</div>
      ) : activeTab === "rfqs" ? (
        rfqs.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-surface-300 dark:border-slate-800 p-12 text-center text-surface-500 dark:text-slate-400">
            No RFQ inquiries received yet.
          </div>
        ) : (
          <div className="space-y-4">
            {rfqs.map((rfq) => (
              <div
                key={rfq._id}
                className="rounded-2xl border border-surface-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-card"
              >
                <div className="flex flex-wrap justify-between items-start gap-4 mb-3">
                  <div>
                    <h3 className="font-bold text-lg text-brand-900 dark:text-white">
                      {rfq.productId?.name || "Product Inquiry"}
                    </h3>
                    <p className="text-xs text-surface-500 dark:text-slate-400">
                      Buyer: <strong className="text-surface-700 dark:text-slate-300">{rfq.buyerId?.profile?.companyName || rfq.buyerId?.email}</strong>
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider ${
                      rfq.status === "quoted"
                        ? "bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400"
                        : rfq.status === "declined"
                        ? "bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-400"
                        : "bg-yellow-100 dark:bg-yellow-950/40 text-yellow-700 dark:text-yellow-400"
                    }`}
                  >
                    {rfq.status}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-surface-50 dark:bg-slate-800/50 p-4 rounded-xl text-sm mb-4">
                  <div>
                    <span className="text-xs text-surface-500 dark:text-slate-400 block">Requested Qty</span>
                    <strong className="text-brand-900 dark:text-white">{rfq.quantity} {rfq.unit || rfq.productId?.unit || "meter"}</strong>
                  </div>
                  <div>
                    <span className="text-xs text-surface-500 dark:text-slate-400 block">Target Delivery</span>
                    <strong className="text-brand-900 dark:text-white">
                      {rfq.targetDeliveryDate ? new Date(rfq.targetDeliveryDate).toLocaleDateString() : "Flexible"}
                    </strong>
                  </div>
                  <div>
                    <span className="text-xs text-surface-500 dark:text-slate-400 block">Quoted Price</span>
                    <strong className="text-emerald-600 dark:text-emerald-400">
                      {rfq.quotedPrice ? `₹${rfq.quotedPrice.toFixed(2)}` : "Pending Quote"}
                    </strong>
                  </div>
                </div>

                {rfq.customRequirements && (
                  <p className="text-sm text-surface-700 dark:text-slate-300 mb-4 bg-white dark:bg-slate-900 border border-surface-200 dark:border-slate-800 p-3 rounded-lg">
                    💬 <strong>Requirements:</strong> "{rfq.customRequirements}"
                  </p>
                )}

                {rfq.status === "pending" && (
                  <div className="mt-4 pt-4 border-t border-surface-100 dark:border-slate-800 space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <input
                        type="number"
                        placeholder="Quoted unit price (₹)"
                        value={rfqResponse[rfq._id]?.quotedPrice || ""}
                        onChange={(e) =>
                          setRfqResponse({
                            ...rfqResponse,
                            [rfq._id]: { ...rfqResponse[rfq._id], quotedPrice: e.target.value },
                          })
                        }
                        className="input-field py-2 text-sm"
                      />
                      <input
                        type="text"
                        placeholder="Optional notes or lead time estimate..."
                        value={rfqResponse[rfq._id]?.notes || ""}
                        onChange={(e) =>
                          setRfqResponse({
                            ...rfqResponse,
                            [rfq._id]: { ...rfqResponse[rfq._id], notes: e.target.value },
                          })
                        }
                        className="input-field py-2 text-sm"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleRespondRFQ(rfq._id, "quoted")}
                        className="btn-primary py-2 px-4 text-xs flex-1"
                      >
                        Submit Price Quote
                      </button>
                      <button
                        onClick={() => handleRespondRFQ(rfq._id, "rejected")}
                        className="rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/20 py-2 px-4 text-xs font-bold text-red-600 dark:text-red-400 hover:bg-red-100"
                      >
                        Decline
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )
      ) : (
        /* Negotiations Tab */
        negotiations.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-surface-300 dark:border-slate-800 p-12 text-center text-surface-500 dark:text-slate-400">
            No active price negotiations.
          </div>
        ) : (
          <div className="space-y-4">
            {negotiations.map((neg) => (
              <div
                key={neg._id}
                className="rounded-2xl border border-surface-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-card"
              >
                <div className="flex flex-wrap justify-between items-start gap-4 mb-3">
                  <div>
                    <h3 className="font-bold text-lg text-brand-900 dark:text-white">
                      {neg.productId?.name || "Product Negotiation"}
                    </h3>
                    <p className="text-xs text-surface-500 dark:text-slate-400">
                      Buyer: <strong className="text-surface-700 dark:text-slate-300">{neg.buyerId?.profile?.companyName || neg.buyerId?.email}</strong>
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider ${
                      neg.status === "accepted"
                        ? "bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400"
                        : neg.status === "declined"
                        ? "bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-400"
                        : "bg-indigo-100 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400"
                    }`}
                  >
                    {neg.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-surface-50 dark:bg-slate-800/50 p-4 rounded-xl text-sm mb-4">
                  <div>
                    <span className="text-xs text-surface-500 dark:text-slate-400 block">List Price</span>
                    <strong className="text-surface-700 dark:text-slate-300">₹{neg.originalPrice}</strong>
                  </div>
                  <div>
                    <span className="text-xs text-surface-500 dark:text-slate-400 block">Buyer Offer</span>
                    <strong className="text-emerald-600 dark:text-emerald-400">₹{neg.offeredPrice}</strong>
                  </div>
                  <div>
                    <span className="text-xs text-surface-500 dark:text-slate-400 block">Quantity</span>
                    <strong className="text-brand-900 dark:text-white">{neg.quantity || 1} {neg.unit || neg.productId?.unit || "meter"}</strong>
                  </div>
                  <div>
                    <span className="text-xs text-surface-500 dark:text-slate-400 block">Latest Counter</span>
                    <strong className="text-indigo-600 dark:text-indigo-400">
                      {neg.counterPrice ? `₹${neg.counterPrice}` : "—"}
                    </strong>
                  </div>
                </div>

                {neg.messages?.length > 0 && (
                  <div className="space-y-1.5 mb-4 max-h-40 overflow-y-auto p-3 bg-surface-50 dark:bg-slate-800/30 rounded-lg text-xs">
                    {neg.messages.map((m, idx) => (
                      <div key={idx} className="flex gap-2">
                        <span className="font-bold capitalize text-brand-600 dark:text-brand-400">{m.senderRole}:</span>
                        <span className="text-surface-700 dark:text-slate-300">{m.text}</span>
                      </div>
                    ))}
                  </div>
                )}

                {neg.status === "pending" || neg.status === "countered" ? (
                  <div className="pt-4 border-t border-surface-100 dark:border-slate-800 space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <input
                        type="number"
                        placeholder="Counter price offer (₹)"
                        value={negResponse[neg._id]?.counterPrice || ""}
                        onChange={(e) =>
                          setNegResponse({
                            ...negResponse,
                            [neg._id]: { ...negResponse[neg._id], counterPrice: e.target.value },
                          })
                        }
                        className="input-field py-2 text-sm"
                      />
                      <input
                        type="text"
                        placeholder="Note / message to buyer..."
                        value={negResponse[neg._id]?.message || ""}
                        onChange={(e) =>
                          setNegResponse({
                            ...negResponse,
                            [neg._id]: { ...negResponse[neg._id], message: e.target.value },
                          })
                        }
                        className="input-field py-2 text-sm"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleUpdateNegotiation(neg._id, "accepted")}
                        className="btn-primary py-2 px-4 text-xs flex-1 bg-emerald-600 hover:bg-emerald-500"
                      >
                        Accept Buyer Offer (₹{neg.offeredPrice})
                      </button>
                      <button
                        onClick={() => handleUpdateNegotiation(neg._id, "countered")}
                        className="btn-primary py-2 px-4 text-xs flex-1"
                      >
                        Send Counter Offer
                      </button>
                      <button
                        onClick={() => handleUpdateNegotiation(neg._id, "declined")}
                        className="rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/20 py-2 px-4 text-xs font-bold text-red-600 dark:text-red-400 hover:bg-red-100"
                      >
                        Decline
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
};

export default SupplierRFQNegotiationsPage;
