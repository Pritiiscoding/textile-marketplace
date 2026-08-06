import Order from "../models/Order.js";
import User from "../models/User.js";
import { logActivity } from "../utils/logActivity.js";
import Cart from "../models/Cart.js";
import Product from "../models/Product.js";
import { notifyUser } from "../utils/socket.js";
import { sendOrderPlacedEmail, sendOrderStatusEmail } from "../utils/email.js";

const STATUS_FLOW = [
  "pending",
  "accepted",
  "preparing",
  "ready_for_dispatch",
  "completed",
];

// @route POST /api/orders/checkout
// Body: { shippingInfo: {...} }
// Reads the buyer's cart, groups items by supplier (an Order is scoped to one
// supplier), validates stock, creates one Order per supplier, decrements
// stock, and clears the cart. Not wrapped in a Mongo transaction — this is a
// standalone MongoDB instance without replica-set support, so writes happen
// sequentially after all validation passes up front.
export const createOrdersFromCart = async (req, res) => {
  try {
    const { shippingInfo } = req.body;

    // No strict validation - allow order with minimal info
    if (!shippingInfo) {
      return res.status(400).json({ message: "shippingInfo is required" });
    }

    const cart = await Cart.findOne({ buyerId: req.user._id }).populate("items.productId");
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ message: "Your cart is empty" });
    }

    // Validate every item before writing anything
    for (const item of cart.items) {
      const product = item.productId;
      if (!product) {
        return res.status(400).json({ message: "One of the items in your cart no longer exists" });
      }
      if (product.status !== "available" || product.stock < item.quantity) {
        return res.status(400).json({
          message: `"${product.name}" doesn't have enough stock (requested ${item.quantity}, available ${product.stock})`,
        });
      }
    }

    // Group cart items by supplier
    const groupedBySupplier = new Map();
    for (const item of cart.items) {
      const supplierId = item.productId.supplierId.toString();
      if (!groupedBySupplier.has(supplierId)) {
        groupedBySupplier.set(supplierId, []);
      }
      groupedBySupplier.get(supplierId).push(item);
    }

    const createdOrders = [];
    for (const [supplierId, items] of groupedBySupplier.entries()) {
      const orderItems = items.map((item) => ({
        productId: item.productId._id,
        name: item.productId.name,
        quantity: item.quantity,
        price: item.negotiatedPrice || item.productId.price,
        color: item.color,
      }));
      const totalAmount = orderItems.reduce(
        (sum, i) => sum + i.price * i.quantity,
        0
      );

      const order = await Order.create({
        buyerId: req.user._id,
        supplierId,
        items: orderItems,
        totalAmount,
        shippingInfo,
      });
      createdOrders.push(order);

      // Decrement stock for each product in this order
      for (const item of items) {
        const product = item.productId;
        product.stock = Math.max(0, product.stock - item.quantity);
        await product.save();
        
        // Notify supplier about stock update
        notifyUser(supplierId, "product_updated", {
          productId: product._id,
          message: `Stock updated for "${product.name}" (remaining: ${product.stock})`,
          product,
        });
      }
    }

    cart.items = [];
    await cart.save();

    // Send notifications for each order (background, non-blocking)
    createdOrders.forEach((order) => {
      const suppId = order.supplierId.toString();
      logActivity({
        userId: req.user._id,
        userRole: "buyer",
        action: "order_placed",
        targetType: "Order",
        targetId: order._id,
        meta: { total: order.totalAmount, itemCount: order.items.length },
      });

      // Feature 1: Socket notification to supplier
      notifyUser(suppId, "new_order", {
        orderId: order._id,
        message: `🎉 New order received for ₹${order.totalAmount.toFixed(2)}`,
        order,
      });

      // Feature 10: Email notification to supplier (fire and forget)
      User.findById(suppId).then((supplier) => {
        if (supplier && supplier.email) {
          sendOrderPlacedEmail(supplier.email, order).catch((e) => {
            console.error("Email notification error:", e.message);
          });
        }
      }).catch((e) => {
        console.error("Error finding supplier for email:", e.message);
      });
    });

    return res.status(201).json({ orders: createdOrders });
  } catch (error) {
    console.error("Checkout error:", error.message);
    return res.status(500).json({ message: "Server error placing order" });
  }
};

// @route GET /api/orders/mine
// List all orders placed by the logged-in buyer, most recent first
export const getBuyerOrders = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = { buyerId: req.user._id };
    if (status) filter.status = status;

    const orders = await Order.find(filter)
      .populate("supplierId", "profile.companyName email")
      .sort({ createdAt: -1 });

    return res.status(200).json({ orders });
  } catch (error) {
    console.error("Get buyer orders error:", error.message);
    return res.status(500).json({ message: "Server error fetching orders" });
  }
};

// @route GET /api/orders/mine/:id
export const getBuyerOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate(
      "supplierId",
      "profile.companyName profile.phone email"
    );
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }
    if (order.buyerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized to view this order" });
    }
    return res.status(200).json({ order, statusFlow: STATUS_FLOW });
  } catch (error) {
    return res.status(500).json({ message: "Server error fetching order" });
  }
};

// @route GET /api/orders/supplier
// List all orders for the logged-in supplier, most recent first
export const getSupplierOrders = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = { supplierId: req.user._id };
    if (status) filter.status = status;

    const orders = await Order.find(filter)
      .populate("buyerId", "email profile.companyName profile.contactName")
      .sort({ createdAt: -1 });

    return res.status(200).json({ orders });
  } catch (error) {
    console.error("Get supplier orders error:", error.message);
    return res.status(500).json({ message: "Server error fetching orders" });
  }
};

// @route GET /api/orders/:id
export const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate(
      "buyerId",
      "email profile.companyName profile.contactName profile.phone"
    );
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }
    if (order.supplierId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized to view this order" });
    }
    return res.status(200).json({ order, statusFlow: STATUS_FLOW });
  } catch (error) {
    return res.status(500).json({ message: "Server error fetching order" });
  }
};

// @route PATCH /api/orders/:id/status
// Body: { status: 'accepted' | 'preparing' | 'ready_for_dispatch' | 'completed' | 'cancelled' }
export const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const allowed = [...STATUS_FLOW, "cancelled"];

    if (!status || !allowed.includes(status)) {
      return res.status(400).json({ message: `status must be one of: ${allowed.join(", ")}` });
    }

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }
    if (order.supplierId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized to update this order" });
    }

    if (order.status === "completed" || order.status === "cancelled") {
      return res
        .status(400)
        .json({ message: `Order is already ${order.status} and cannot be changed` });
    }

    // Enforce forward-only progression through the stepper (cancellation always allowed)
    if (status !== "cancelled") {
      const currentIndex = STATUS_FLOW.indexOf(order.status);
      const nextIndex = STATUS_FLOW.indexOf(status);
      if (nextIndex !== currentIndex + 1) {
        return res.status(400).json({
          message: `Order must move through statuses in order. Current: ${order.status}, next allowed: ${STATUS_FLOW[currentIndex + 1] || "none"}`,
        });
      }
    }

    const prevStatus = order.status;
    order.status = status;
    await order.save();

    // If order is cancelled, restore stock
    if (status === "cancelled") {
      for (const item of order.items) {
        const product = await Product.findById(item.productId);
        if (product) {
          product.stock += item.quantity;
          await product.save();
          
          // Notify supplier about stock restoration
          notifyUser(order.supplierId, "product_updated", {
            productId: product._id,
            message: `Stock restored for "${product.name}" (current: ${product.stock})`,
            product,
          });
        }
      }
    }

    logActivity({
      userId: req.user._id,
      userRole: req.user.role,
      action: 'order_status_updated',
      targetType: 'Order',
      targetId: order._id,
      meta: { from: prevStatus, to: status },
    });

    // Feature 1: Socket notification to buyer
    notifyUser(order.buyerId, "order_status_updated", {
      orderId: order._id,
      status: order.status,
      message: `Your order #${order._id.toString().slice(-6)} is now ${order.status.replace(/_/g, " ").toUpperCase()}`,
      order,
    });

    // Feature 10: Email notification to buyer
    try {
      const buyer = await User.findById(order.buyerId);
      if (buyer && buyer.email) {
        sendOrderStatusEmail(buyer.email, order, status);
      }
    } catch (e) {
      console.error("Failed to send status update email:", e);
    }

    return res.status(200).json({ order });
  } catch (error) {
    console.error("Update order status error:", error.message);
    return res.status(500).json({ message: "Server error updating order status" });
  }
};
