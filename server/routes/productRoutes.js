import express from "express";
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
router.get("/mine", getMyProducts);
router.post(
  "/",
  uploadProductImages.array("images", 6),
  createProduct
);
router.put(
  "/:id",
  uploadProductImages.array("images", 6),
  updateProduct
);
router.patch(
  "/:id/toggle-status",
  toggleProductStatus
);
router.delete("/:id", deleteProduct);
router.delete(
  "/:id/images/:imageIndex",
  deleteProductImage
);

// Single product lookup (any authenticated user)
router.get("/:id", getProductById);

export default router;
