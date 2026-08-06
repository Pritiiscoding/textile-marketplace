import User from "../models/User.js";
import Product from "../models/Product.js";
import Order from "../models/Order.js";
import ActivityLog from "../models/ActivityLog.js";
import { logActivity } from "../utils/logActivity.js";
import fs from "fs";
import path from "path";

// ─── Users ────────────────────────────────────────────────────────────────────

export const getAllUsers = async (req, res) => {
  try {
    const { role, search, page = 1, limit = 50 } = req.query;
    const filter = {};
    if (role) filter.role = role;
    if (search) {
      const re = { $regex: search, $options: "i" };
      filter.$or = [{ email: re }, { "profile.companyName": re }, { "profile.contactName": re }];
    }
    const users = await User.find(filter)
      .select("-passwordHash")
      .sort({ createdAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit));
    const total = await User.countDocuments(filter);
    return res.status(200).json({ users, total });
  } catch (err) {
    return res.status(500).json({ message: "Server error fetching users" });
  }
};

export const updateUser = async (req, res) => {
  try {
    const { isActive, profile } = req.body;
    const user = await User.findById(req.params.id).select("-passwordHash");
    if (!user) return res.status(404).json({ message: "User not found" });
    if (isActive !== undefined) user.isActive = isActive;
    if (profile) user.profile = { ...user.profile, ...profile };
    await user.save();
    logActivity({ userId: req.user._id, userRole: "admin", action: "user_updated", targetType: "User", targetId: user._id });
    return res.status(200).json({ user });
  } catch (err) {
    return res.status(500).json({ message: "Server error updating user" });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    if (user.role === "admin") return res.status(403).json({ message: "Cannot delete admin accounts" });

    const userId = user._id;

    // 1. Delete associated products and clean up image files on disk
    const products = await Product.find({ supplierId: userId });
    for (const p of products) {
      for (const imageUrl of p.images || []) {
        try {
          const filePath = path.join(process.cwd(), imageUrl.replace(/^\//, ""));
          if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        } catch (e) {
          // ignore individual file deletion errors
        }
      }
    }
    await Product.deleteMany({ supplierId: userId });

    // 2. Delete orders (where user is buyer or supplier)
    await Order.deleteMany({ $or: [{ buyerId: userId }, { supplierId: userId }] });

    // 3. Delete carts
    const CartModule = await import("../models/Cart.js").catch(() => null);
    if (CartModule?.default) await CartModule.default.deleteMany({ buyerId: userId });

    // 4. Delete RFQs
    const RFQModule = await import("../models/RFQ.js").catch(() => null);
    if (RFQModule?.default) await RFQModule.default.deleteMany({ $or: [{ buyerId: userId }, { supplierId: userId }] });

    // 5. Delete Negotiations
    const NegModule = await import("../models/Negotiation.js").catch(() => null);
    if (NegModule?.default) await NegModule.default.deleteMany({ $or: [{ buyerId: userId }, { supplierId: userId }] });

    // 6. Delete Activity Logs
    await ActivityLog.deleteMany({ userId: userId });

    // 7. Delete User account
    await User.findByIdAndDelete(userId);

    logActivity({ userId: req.user._id, userRole: "admin", action: "user_deleted", targetType: "User", targetId: userId, meta: { email: user.email } });
    return res.status(200).json({ message: "User and all associated data deleted successfully" });
  } catch (err) {
    console.error("deleteUser cascade error:", err);
    return res.status(500).json({ message: "Server error deleting user" });
  }
};

// ─── Products ─────────────────────────────────────────────────────────────────

export const adminGetAllProducts = async (req, res) => {
  try {
    const { status, search, page = 1, limit = 50 } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (search) filter.$or = [
      { name: { $regex: search, $options: "i" } },
      { category: { $regex: search, $options: "i" } },
    ];
    const products = await Product.find(filter)
      .populate("supplierId", "email profile.companyName")
      .sort({ createdAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit));
    const total = await Product.countDocuments(filter);
    return res.status(200).json({ products, total });
  } catch (err) {
    return res.status(500).json({ message: "Server error fetching products" });
  }
};

export const adminUpdateProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!product) return res.status(404).json({ message: "Product not found" });
    logActivity({ userId: req.user._id, userRole: "admin", action: "product_updated", targetType: "Product", targetId: product._id, meta: { productName: product.name } });
    return res.status(200).json({ product });
  } catch (err) {
    return res.status(500).json({ message: "Server error updating product" });
  }
};

export const adminDeleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });
    logActivity({ userId: req.user._id, userRole: "admin", action: "product_deleted", targetType: "Product", targetId: product._id, meta: { productName: product.name } });
    return res.status(200).json({ message: "Product deleted" });
  } catch (err) {
    return res.status(500).json({ message: "Server error deleting product" });
  }
};

// ─── Orders ───────────────────────────────────────────────────────────────────

export const adminGetAllOrders = async (req, res) => {
  try {
    const { status, page = 1, limit = 50 } = req.query;
    const filter = {};
    if (status) filter.status = status;
    const orders = await Order.find(filter)
      .populate("buyerId", "email profile.companyName")
      .populate("supplierId", "email profile.companyName")
      .sort({ createdAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit));
    const total = await Order.countDocuments(filter);
    return res.status(200).json({ orders, total });
  } catch (err) {
    return res.status(500).json({ message: "Server error fetching orders" });
  }
};

export const adminUpdateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!order) return res.status(404).json({ message: "Order not found" });
    logActivity({ userId: req.user._id, userRole: "admin", action: "order_status_updated", targetType: "Order", targetId: order._id, meta: { to: status } });
    return res.status(200).json({ order });
  } catch (err) {
    return res.status(500).json({ message: "Server error updating order" });
  }
};

// ─── Activity Log ─────────────────────────────────────────────────────────────

export const getActivityLogs = async (req, res) => {
  try {
    const { userId, action, from, to, page = 1, limit = 100 } = req.query;
    const filter = {};
    if (userId) filter.userId = userId;
    if (action) filter.action = { $regex: action, $options: "i" };
    if (from || to) {
      filter.createdAt = {};
      if (from) filter.createdAt.$gte = new Date(from);
      if (to) filter.createdAt.$lte = new Date(to);
    }
    const logs = await ActivityLog.find(filter)
      .populate("userId", "email role profile.companyName")
      .sort({ createdAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit));
    const total = await ActivityLog.countDocuments(filter);
    return res.status(200).json({ logs, total });
  } catch (err) {
    return res.status(500).json({ message: "Server error fetching activity logs" });
  }
};
