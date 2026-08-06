import express from "express";
import { protectRoute, requireRole } from "../middleware/authMiddleware.js";
import {
  getSupplierOrders,
  getOrderById,
  updateOrderStatus,
  createOrdersFromCart,
  getBuyerOrders,
  getBuyerOrderById,
} from "../controllers/orderController.js";

const router = express.Router();

// Buyer-only checkout + order history
router.post("/checkout", protectRoute, requireRole("buyer"), createOrdersFromCart);
router.get("/mine", protectRoute, requireRole("buyer"), getBuyerOrders);
router.get("/mine/:id", protectRoute, requireRole("buyer"), getBuyerOrderById);

// Supplier-only order management
router.get("/supplier", protectRoute, requireRole("supplier"), getSupplierOrders);
router.get("/:id", protectRoute, requireRole("supplier"), getOrderById);
router.patch(
  "/:id/status",
  protectRoute,
  requireRole("supplier"),
  updateOrderStatus
);

export default router;
