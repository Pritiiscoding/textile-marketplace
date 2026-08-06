import RFQ from "../models/RFQ.js";
import Product from "../models/Product.js";
import Order from "../models/Order.js";
import { notifyUser } from "../utils/socket.js";
import { logActivity } from "../utils/logActivity.js";

// Create RFQ (Buyer)
export const createRFQ = async (req, res) => {
  try {
    const { productId, quantity, targetDeliveryDate, customRequirements } = req.body;
    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ message: "Product not found" });

    const rfq = await RFQ.create({
      buyerId: req.user._id,
      supplierId: product.supplierId,
      productId,
      quantity,
      unit: product.unit || "meter",
      targetDeliveryDate,
      customRequirements,
      status: "pending",
      stage: "request_sent",
    });

    notifyUser(product.supplierId.toString(), "new_rfq", {
      message: `📋 New Bulk RFQ for "${product.name}" — ${quantity} ${product.unit || "meter"}s requested`,
      rfq,
    });

    return res.status(201).json({ rfq });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// Get User RFQs (Buyer or Supplier)
export const getRFQs = async (req, res) => {
  try {
    const filter = req.user.role === "supplier" ? { supplierId: req.user._id } : { buyerId: req.user._id };
    const rfqs = await RFQ.find(filter)
      .populate("productId", "name price images unit status stock colors")
      .populate("buyerId", "profile.companyName email")
      .populate("supplierId", "profile.companyName email")
      .sort({ createdAt: -1 });

    return res.status(200).json({ rfqs });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// Respond to RFQ (Supplier)
export const respondRFQ = async (req, res) => {
  try {
    const { id } = req.params;
    const { quotedPrice, supplierNotes, status } = req.body;

    const rfq = await RFQ.findById(id);
    if (!rfq) return res.status(404).json({ message: "RFQ not found" });

    // Authorization check - only supplier can respond
    if (rfq.supplierId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "You are not authorized to respond to this RFQ" });
    }

    // Only update if RFQ is still pending
    if (rfq.status !== "pending") {
      return res.status(400).json({ message: "RFQ has already been responded to" });
    }

    if (quotedPrice) rfq.quotedPrice = quotedPrice;
    if (supplierNotes) rfq.supplierNotes = supplierNotes;
    if (status) {
      rfq.status = status;
      if (status === "quoted") {
        rfq.stage = "quote_sent";
      } else if (status === "rejected" || status === "declined") {
        rfq.stage = "completed";
      }
    }

    await rfq.save();

    notifyUser(rfq.buyerId.toString(), "rfq_updated", {
      message: `✅ Supplier responded to your RFQ with status: ${rfq.status}${rfq.quotedPrice ? ` (₹${rfq.quotedPrice}/unit)` : ""}`,
      rfq,
    });

    return res.status(200).json({ rfq });
  } catch (err) {
    console.error("RFQ response error:", err);
    return res.status(500).json({ message: err.message });
  }
};

// Complete RFQ when buyer accepts quote and places order
export const completeRFQ = async (req, res) => {
  try {
    const { id } = req.params;
    const rfq = await RFQ.findById(id);
    if (!rfq) return res.status(404).json({ message: "RFQ not found" });

    if (rfq.status === "completed") {
      return res.status(400).json({ message: "RFQ is already completed" });
    }

    rfq.status = "completed";
    rfq.stage = "completed";
    await rfq.save();

    return res.status(200).json({ rfq });
  } catch (err) {
    console.error("RFQ completion error:", err);
    return res.status(500).json({ message: err.message });
  }
};
