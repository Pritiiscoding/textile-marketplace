import express from "express";
import { protectRoute, requireRole } from "../middleware/authMiddleware.js";
import { getSupplierDashboardStats } from "../controllers/dashboardController.js";

const router = express.Router();

router.get(
  "/supplier",
  protectRoute,
  requireRole("supplier"),
  getSupplierDashboardStats
);

export default router;
