import express from "express";
import { protectRoute, requireRole } from "../middleware/authMiddleware.js";
import {
  getAllUsers,
  updateUser,
  deleteUser,
  adminGetAllProducts,
  adminUpdateProduct,
  adminDeleteProduct,
  adminGetAllOrders,
  adminUpdateOrderStatus,
  getActivityLogs,
} from "../controllers/adminController.js";

const router = express.Router();
const admin = [protectRoute, requireRole("admin")];

router.get("/users", ...admin, getAllUsers);
router.patch("/users/:id", ...admin, updateUser);
router.delete("/users/:id", ...admin, deleteUser);

router.get("/products", ...admin, adminGetAllProducts);
router.patch("/products/:id", ...admin, adminUpdateProduct);
router.delete("/products/:id", ...admin, adminDeleteProduct);

router.get("/orders", ...admin, adminGetAllOrders);
router.patch("/orders/:id/status", ...admin, adminUpdateOrderStatus);

router.get("/activity", ...admin, getActivityLogs);

export default router;
