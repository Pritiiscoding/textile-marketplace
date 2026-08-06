import express from "express";
import { protectRoute, requireRole } from "../middleware/authMiddleware.js";
import {
  getCart,
  addCartItem,
  updateCartItem,
  removeCartItem,
  clearCart,
} from "../controllers/cartController.js";

const router = express.Router();

// Buyer-only cart management
router.get("/", protectRoute, requireRole("buyer"), getCart);
router.post("/items", protectRoute, requireRole("buyer"), addCartItem);
router.patch("/items/:productId", protectRoute, requireRole("buyer"), updateCartItem);
router.delete("/items/:productId", protectRoute, requireRole("buyer"), removeCartItem);
router.delete("/", protectRoute, requireRole("buyer"), clearCart);

export default router;
