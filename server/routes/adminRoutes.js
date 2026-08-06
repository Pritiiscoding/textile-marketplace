import express from "express";
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

router.get("/users", getAllUsers);
router.patch("/users/:id", updateUser);
router.delete("/users/:id", deleteUser);

router.get("/products", adminGetAllProducts);
router.patch("/products/:id", adminUpdateProduct);
router.delete("/products/:id", adminDeleteProduct);

router.get("/orders", adminGetAllOrders);
router.patch("/orders/:id/status", adminUpdateOrderStatus);

router.get("/activity", getActivityLogs);

export default router;
