import { useEffect, useState } from "react";
import { getRFQsRequest } from "../../api/rfqApi";
import { getNegotiationsRequest, updateNegotiationRequest } from "../../api/negotiationApi";
import { useCart } from "../../context/CartContext";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../../api/axios";

const BuyerRFQNegotiationsPage = () => {
  const [activeTab, setActiveTab] = useState("rfqs"); // 'rfqs' | 'negotiations'
  const [rfqs, setRfqs] = useState([]);
  const [negotiations, setNegotiations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { addItem } = useCart();
  const navigate = useNavigate();

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

  const handleOrderQuotedProduct = async (product, price, qty, rfqId) => {
    console.log("handleOrderQuotedProduct called with:", { product, price, qty, rfqId });
    
    if (!product?._id) {
      toast.error("Product information not available");
      return;
    }
    
    // Check if product is available
    if (product.status && product.status !== "available") {
      toast.error("This product is currently not available");
      return;
    }
    
    if (product.stock !== undefined && product.stock < 1) {
      toast.error("This product is out of stock");
      return;
    }
    
    try {
      console.log("Adding to cart:", product._id, qty || 1, product.colors?.[0] || "", price);
      // Use the RFQ quantity, but ensure it's a valid number
      const quantityToAdd = qty && qty > 0 ? qty : 1;
      const cartResult = await addItem(product._id, quantityToAdd, product.colors?.[0] || "", price);
      console.log("Cart result:", cartResult);
      
      // Complete the RFQ if it was provided
      if (rfqId) {
        try {
          await api.patch(`/rfqs/${rfqId}/complete`);
          console.log("RFQ completed successfully");
        } catch (rfqError) {
          console.error("Failed to complete RFQ:", rfqError);
          // Don't fail the flow if RFQ completion fails
        }
      }
      
      toast.success(`Accepted quote added to cart! (${quantityToAdd} ${product.unit || "meter"})`);
      navigate("/buyer/cart");
    } catch (err) {
      console.error("Add to cart error:", err);
      console.error("Error response:", err.response);
      console.error("Error data:", err.response?.data);
      toast.error(err.response?.data?.message || "Failed to add product to cart");
    }
  };

  const handleAcceptNegotiation = async (id, finalPrice, product, qty) => {
    console.log("handleAcceptNegotiation called with:", { id, finalPrice, product, qty });
    
    if (!product?._id) {
      toast.error("Product information not available");
      return;
    }
    
    // Check if product is available
    if (product.status && product.status !== "available") {
      toast.error("This product is currently not available");
      return;
    }
    
    if (product.stock !== undefined && product.stock < 1) {
      toast.error("This product is out of stock");
      return;
    }
    
    try {
      console.log("Accepting negotiation:", id);
      await updateNegotiationRequest(id, { status: "accepted" });
      toast.success("Negotiated offer accepted! Proceeding to cart...");
      console.log("Adding to cart after accepting negotiation:", product._id, qty || 1, product.colors?.[0] || "", finalPrice);
      // Use the negotiation quantity, but ensure it's a valid number
      const quantityToAdd = qty && qty > 0 ? qty : 1;
      // Pass the negotiated price to the cart
      await addItem(product._id, quantityToAdd, product.colors?.[0] || "", finalPrice);
      
      // Complete the negotiation
      try {
        await api.patch(`/negotiations/${id}/complete`);
        console.log("Negotiation completed successfully");
      } catch (negError) {
        console.error("Failed to complete negotiation:", negError);
        // Don't fail the flow if negotiation completion fails
      }
      
      toast.success(`Negotiated offer added to cart! (${quantityToAdd} ${product.unit || "meter"})`);
      navigate("/buyer/cart");
    } catch (err) {
      console.error("Accept negotiation error:", err);
      console.error("Error response:", err.response);
      toast.error(err.response?.data?.message || "Failed to accept negotiation");
    }
  };

  const handleDeclineNegotiation = async (id) => {
    console.log("handleDeclineNegotiation called with:", id);
    try {
      console.log("Declining negotiation:", id);
      await updateNegotiationRequest(id, { status: "declined" });
      toast.success("Negotiation declined.");
      fetchData();
    } catch (err) {
      console.error("Decline negotiation error:", err);
      toast.error(err.response?.data?.message || "Failed to decline negotiation");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brand-900 dark:text-white">My RFQs & Price Offers</h1>
        <p className="text-sm text-surface-500 dark:text-slate-400">
          Track bulk quote requests and counter-offer responses from suppliers.
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
          📋 My RFQs ({rfqs.length})
        </button>
        <button
          onClick={() => setActiveTab("negotiations")}
          className={`rounded-full px-5 py-2 text-sm font-semibold transition-all ${
            activeTab === "negotiations"
              ? "bg-emerald-600 text-white shadow-md"
              : "bg-surface-100 dark:bg-slate-800 text-surface-700 dark:text-slate-300 hover:bg-surface-200"
          }`}
        >
          💬 Price Offers & Counters ({negotiations.length})
        </button>
      </div>

      {isLoading ? (
        <div className="p-8 text-center text-slate-400 animate-pulse">Loading requests...</div>
      ) : activeTab === "rfqs" ? (
        rfqs.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-surface-300 dark:border-slate-800 p-12 text-center text-surface-500 dark:text-slate-400">
            You haven't submitted any RFQ requests yet. Browse products to request bulk quotes!
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
                      Supplier: <strong className="text-surface-700 dark:text-slate-300">{rfq.supplierId?.profile?.companyName || rfq.supplierId?.email}</strong>
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

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-surface-50 dark:bg-slate-800/50 p-4 rounded-xl text-sm mb-3">
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
                    <span className="text-xs text-surface-500 dark:text-slate-400 block">Supplier Quote</span>
                    <strong className="text-emerald-600 dark:text-emerald-400">
                      {rfq.quotedPrice ? `₹${rfq.quotedPrice.toFixed(2)}` : "Awaiting Quote"}
                    </strong>
                  </div>
                </div>

                {rfq.supplierNotes && (
                  <p className="text-sm text-surface-700 dark:text-slate-300 mb-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 p-3 rounded-lg">
                    📌 <strong>Supplier Note:</strong> "{rfq.supplierNotes}"
                  </p>
                )}

                {rfq.status === "quoted" && rfq.productId && (
                  <div className="pt-3 border-t border-surface-100 dark:border-slate-800 flex justify-end">
                    <button
                      onClick={() => {
                        console.log("Accept Quote button clicked for RFQ:", rfq._id);
                        console.log("Product:", rfq.productId);
                        console.log("Product stock:", rfq.productId?.stock);
                        console.log("Product status:", rfq.productId?.status);
                        handleOrderQuotedProduct(rfq.productId, rfq.quotedPrice, rfq.quantity, rfq._id);
                      }}
                      className="btn-primary py-2.5 px-6 text-sm"
                    >
                      Accept Quote & Add to Cart 🛒
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )
      ) : (
        negotiations.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-surface-300 dark:border-slate-800 p-12 text-center text-surface-500 dark:text-slate-400">
            No active price negotiations. Make a counter offer on any product detail page!
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
                      Supplier: <strong className="text-surface-700 dark:text-slate-300">{neg.supplierId?.profile?.companyName || neg.supplierId?.email}</strong>
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
                    <span className="text-xs text-surface-500 dark:text-slate-400 block">My Offer</span>
                    <strong className="text-emerald-600 dark:text-emerald-400">₹{neg.offeredPrice}</strong>
                  </div>
                  <div>
                    <span className="text-xs text-surface-500 dark:text-slate-400 block">Quantity</span>
                    <strong className="text-brand-900 dark:text-white">{neg.quantity || 1} {neg.unit || neg.productId?.unit || "meter"}</strong>
                  </div>
                  <div>
                    <span className="text-xs text-surface-500 dark:text-slate-400 block">Supplier Counter</span>
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

                {neg.productId && (neg.status === "countered" || neg.status === "accepted" || neg.status === "pending") && (
                  <div className="pt-3 border-t border-surface-100 dark:border-slate-800 flex gap-2 justify-end">
                    {neg.status !== "declined" && neg.status !== "accepted" && (
                      <button
                        onClick={() => handleDeclineNegotiation(neg._id)}
                        className="rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/20 py-2 px-4 text-xs font-bold text-red-600 dark:text-red-400 hover:bg-red-100"
                      >
                        Decline
                      </button>
                    )}
                    <button
                      onClick={() => handleAcceptNegotiation(neg._id, neg.counterPrice || neg.offeredPrice, neg.productId, neg.quantity)}
                      className="btn-primary py-2.5 px-6 text-sm bg-emerald-600 hover:bg-emerald-500"
                    >
                      {neg.status === "accepted" ? "Proceed to Checkout 🛒" : "Accept Counter & Order 🛒"}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
};

export default BuyerRFQNegotiationsPage;
