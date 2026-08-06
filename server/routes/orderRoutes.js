import express from "express";
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
router.post("/checkout", createOrdersFromCart);
router.get("/mine", getBuyerOrders);
router.get("/mine/:id", getBuyerOrderById);

// Supplier-only order management
router.get("/supplier", getSupplierOrders);
router.get("/:id", getOrderById);
router.patch(
  "/:id/status",
  updateOrderStatus
);

export default router;
