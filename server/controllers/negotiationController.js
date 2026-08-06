import Negotiation from "../models/Negotiation.js";
import Product from "../models/Product.js";
import Order from "../models/Order.js";
import { notifyUser } from "../utils/socket.js";
import { logActivity } from "../utils/logActivity.js";

// Create / Start Negotiation
export const startNegotiation = async (req, res) => {
  try {
    const { productId, offeredPrice, quantity = 1, initialMessage } = req.body;
    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ message: "Product not found" });

    const negotiation = await Negotiation.create({
      buyerId: req.user._id,
      supplierId: product.supplierId,
      productId,
      originalPrice: product.price,
      offeredPrice,
      quantity,
      unit: product.unit || "meter",
      status: "pending",
      stage: "offer_sent",
      messages: initialMessage ? [{ senderRole: "buyer", text: initialMessage }] : [],
    });

    notifyUser(product.supplierId.toString(), "new_negotiation", {
      message: `💬 New price offer of ₹${offeredPrice} on "${product.name}" (Qty: ${quantity} ${product.unit || "meter"})`,
      negotiation,
    });

    return res.status(201).json({ negotiation });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// Get user negotiations
export const getNegotiations = async (req, res) => {
  try {
    const filter = req.user.role === "supplier" ? { supplierId: req.user._id } : { buyerId: req.user._id };
    const list = await Negotiation.find(filter)
      .populate("productId", "name price images unit status stock colors")
      .populate("buyerId", "profile.companyName email")
      .populate("supplierId", "profile.companyName email")
      .sort({ updatedAt: -1 });

    return res.status(200).json({ negotiations: list });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// Update Negotiation (Accept, Decline, Counter)
export const updateNegotiation = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, counterPrice, message } = req.body;

    const neg = await Negotiation.findById(id);
    if (!neg) return res.status(404).json({ message: "Negotiation not found" });

    // Authorization check
    const isSupplier = req.user.role === "supplier";
    const isBuyer = req.user.role === "buyer";

    if (isSupplier && neg.supplierId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "You are not authorized to update this negotiation" });
    }
    if (isBuyer && neg.buyerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "You are not authorized to update this negotiation" });
    }

    // Prevent updates on already completed negotiations
    if (neg.status === "completed" || neg.status === "declined") {
      return res.status(400).json({ message: "Negotiation has already been completed" });
    }

    // Update status and stage based on action
    if (status) {
      neg.status = status;
      
      // Update stage based on status and who is updating
      if (status === "countered" && isSupplier) {
        neg.stage = "counter_sent";
      } else if (status === "accepted" && isBuyer) {
        neg.stage = "buyer_response";
      } else if (status === "accepted" && isSupplier) {
        neg.stage = "completed";
        neg.status = "completed";
      } else if (status === "declined") {
        neg.stage = "completed";
        neg.status = "declined";
      }
    }
    
    if (counterPrice) neg.counterPrice = counterPrice;
    if (message) {
      neg.messages.push({
        senderRole: req.user.role,
        text: message,
      });
    }

    await neg.save();

    // If supplier accepts the negotiation, create an order automatically
    if (status === "accepted" && isSupplier) {
      try {
        const product = await Product.findById(neg.productId);
        if (product && product.status === "available" && product.stock >= neg.quantity) {
          const finalPrice = neg.counterPrice || neg.offeredPrice;
          
          const order = await Order.create({
            buyerId: neg.buyerId,
            supplierId: neg.supplierId,
            items: [{
              productId: neg.productId,
              name: product.name,
              quantity: neg.quantity,
              price: finalPrice,
              color: neg.productId?.colors?.[0],
            }],
            totalAmount: finalPrice * neg.quantity,
            shippingInfo: {
              // Use minimal shipping info for auto-created orders
              address: "TBD - Buyer to provide shipping details",
              city: "TBD",
              state: "TBD",
              pincode: "000000",
              country: "India",
            },
          });

          // Decrement stock
          product.stock = Math.max(0, product.stock - neg.quantity);
          await product.save();

          // Log activity
          logActivity({
            userId: req.user._id,
            userRole: "supplier",
            action: "order_created_from_negotiation",
            targetType: "Order",
            targetId: order._id,
            meta: {
              negotiationId: neg._id,
              productName: product.name,
              finalPrice,
              quantity: neg.quantity,
            },
          });

          // Notify buyer about order creation
          notifyUser(neg.buyerId.toString(), "new_order", {
            message: `🎉 Order automatically created from accepted negotiation on "${product.name}" (Qty: ${neg.quantity} ${neg.unit || "meter"}) at ₹${finalPrice}`,
            order,
          });
        }
      } catch (orderError) {
        console.error("Error creating order from negotiation:", orderError);
        // Don't fail the negotiation update if order creation fails
      }
    }

    const targetUser = req.user.role === "supplier" ? neg.buyerId : neg.supplierId;
    notifyUser(targetUser.toString(), "negotiation_updated", {
      message: `🔄 Negotiation on your price offer — status now: ${neg.status}${neg.counterPrice ? ` (Counter: ₹${neg.counterPrice})` : ""}`,
      negotiation: neg,
    });

    return res.status(200).json({ negotiation: neg });
  } catch (err) {
    console.error("Negotiation update error:", err);
    return res.status(500).json({ message: err.message });
  }
};

// Complete negotiation when buyer accepts and places order
export const completeNegotiation = async (req, res) => {
  try {
    const { id } = req.params;
    const neg = await Negotiation.findById(id);
    if (!neg) return res.status(404).json({ message: "Negotiation not found" });

    if (neg.status === "completed") {
      return res.status(400).json({ message: "Negotiation is already completed" });
    }

    neg.status = "completed";
    neg.stage = "completed";
    await neg.save();

    return res.status(200).json({ negotiation: neg });
  } catch (err) {
    console.error("Negotiation completion error:", err);
    return res.status(500).json({ message: err.message });
  }
};
