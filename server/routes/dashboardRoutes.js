import express from "express";
import { getSupplierDashboardStats } from "../controllers/dashboardController.js";

const router = express.Router();

router.get("/supplier", getSupplierDashboardStats);

export default router;
