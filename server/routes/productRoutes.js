import express from "express";
import { protectRoute, requireRole } from "../middleware/authMiddleware.js";
import { uploadProductImages } from "../middleware/uploadMiddleware.js";
import {
  getAllProducts,
  getCategories,
  getMyProducts,
  getProductById,
  createProduct,
  updateProduct,
  toggleProductStatus,
  deleteProduct,
  deleteProductImage,
} from "../controllers/productController.js";

const router = express.Router();

// Public marketplace browsing (guests and authenticated users)
router.get("/", getAllProducts);
router.get("/meta/categories", getCategories);

// Supplier-only inventory management
router.get("/mine", protectRoute, requireRole("supplier"), getMyProducts);
router.post(
  "/",
  protectRoute,
  requireRole("supplier"),
  uploadProductImages.array("images", 6),
  createProduct
);
router.put(
  "/:id",
  protectRoute,
  requireRole("supplier"),
  uploadProductImages.array("images", 6),
  updateProduct
);
router.patch(
  "/:id/toggle-status",
  protectRoute,
  requireRole("supplier"),
  toggleProductStatus
);
router.delete("/:id", protectRoute, requireRole("supplier"), deleteProduct);
router.delete(
  "/:id/images/:imageIndex",
  protectRoute,
  requireRole("supplier"),
  deleteProductImage
);

// Single product lookup (any authenticated user)
router.get("/:id", protectRoute, getProductById);

export default router;
