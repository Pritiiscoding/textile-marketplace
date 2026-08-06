import Product from "../models/Product.js";
import fs from "fs";
import path from "path";
import { embedProduct } from "./aiController.js";
import { logActivity } from "../utils/logActivity.js";

// @route GET /api/products
// Public/buyer marketplace listing with search, filters, and pagination.
// Query params: search, category, fabric, minPrice, maxPrice, sort, page, limit
export const getAllProducts = async (req, res) => {
  try {
    const {
      search,
      category,
      fabric,
      minPrice,
      maxPrice,
      sort,
      page = 1,
      limit = 12,
    } = req.query;

    const filter = {};

    if (category) {
      filter.category = { $regex: `^${escapeRegex(category)}$`, $options: "i" };
    }

    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }

    const orConditions = [];
    if (search) {
      const re = { $regex: escapeRegex(search), $options: "i" };
      orConditions.push({ name: re }, { description: re }, { category: re });
    }
    // "fabric" is matched loosely against category/description/colors, since
    // fabric composition lives in the free-form `specs` map rather than a
    // dedicated field.
    if (fabric) {
      const re = { $regex: escapeRegex(fabric), $options: "i" };
      orConditions.push({ category: re }, { description: re }, { colors: re });
    }
    if (orConditions.length > 0) {
      filter.$or = orConditions;
    }

    const sortMap = {
      newest: { createdAt: -1 },
      price_asc: { price: 1 },
      price_desc: { price: -1 },
      name_asc: { name: 1 },
    };
    const sortBy = sortMap[sort] || sortMap.newest;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(48, Math.max(1, parseInt(limit, 10) || 12));

    const [products, total] = await Promise.all([
      Product.find(filter)
        .populate("supplierId", "profile.companyName profile.address.city profile.address.country")
        .sort(sortBy)
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum),
      Product.countDocuments(filter),
    ]);

    return res.status(200).json({
      products,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum) || 1,
      },
    });
  } catch (error) {
    console.error("Get all products error:", error.message);
    return res.status(500).json({ message: "Server error fetching products" });
  }
};

// @route GET /api/products/meta/categories
// Distinct category list, used to populate marketplace filters.
export const getCategories = async (req, res) => {
  try {
    const categories = await Product.distinct("category");
    return res.status(200).json({ categories: categories.sort() });
  } catch (error) {
    return res.status(500).json({ message: "Server error fetching categories" });
  }
};

function escapeRegex(str) {
  return String(str).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// @route GET /api/products/mine
// List all products belonging to the logged-in supplier
export const getMyProducts = async (req, res) => {
  try {
    const products = await Product.find({ supplierId: req.user._id }).sort({
      createdAt: -1,
    });
    return res.status(200).json({ products });
  } catch (error) {
    console.error("Get my products error:", error.message);
    return res.status(500).json({ message: "Server error fetching products" });
  }
};

// @route GET /api/products/:id
export const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    return res.status(200).json({ product });
  } catch (error) {
    return res.status(500).json({ message: "Server error fetching product" });
  }
};

// @route POST /api/products
export const createProduct = async (req, res) => {
  try {
    const { name, category, description, colors, specs, stock, price, unit } =
      req.body;

    if (!name || !category || price === undefined) {
      return res
        .status(400)
        .json({ message: "name, category, and price are required" });
    }

    const uploadedImageUrls = (req.files || []).map(
      (file) => `/uploads/products/${file.filename}`
    );

    const product = await Product.create({
      name,
      category,
      description,
      colors: parseArrayField(colors),
      specs: parseJsonField(specs),
      stock: stock ?? 0,
      price,
      unit: unit || "",
      images: uploadedImageUrls,
      supplierId: req.user._id,
    });

    // Fire-and-forget: generate embedding + log activity (non-blocking)
    embedProduct(product._id);
    logActivity({
      userId: req.user._id,
      userRole: req.user.role,
      action: "product_created",
      targetType: "Product",
      targetId: product._id,
      meta: { productName: product.name },
    });

    return res.status(201).json({ product });
  } catch (error) {
    console.error("Create product error:", error.message);
    return res.status(500).json({ message: "Server error creating product" });
  }
};

// @route PUT /api/products/:id
export const updateProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    if (product.supplierId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized to edit this product" });
    }

    const { name, category, description, colors, specs, stock, price, unit, status } =
      req.body;

    if (name !== undefined) product.name = name;
    if (category !== undefined) product.category = category;
    if (description !== undefined) product.description = description;
    if (colors !== undefined) product.colors = parseArrayField(colors);
    if (specs !== undefined) product.specs = parseJsonField(specs);
    if (stock !== undefined) product.stock = stock;
    if (price !== undefined) product.price = price;
    if (unit !== undefined) product.unit = unit;
    if (status !== undefined && ["available", "out_of_stock"].includes(status)) {
      product.status = status;
    }

    const newImageUrls = (req.files || []).map(
      (file) => `/uploads/products/${file.filename}`
    );
    if (newImageUrls.length > 0) {
      product.images = [...product.images, ...newImageUrls];
    }

    await product.save();

    embedProduct(product._id);
    logActivity({
      userId: req.user._id,
      userRole: req.user.role,
      action: "product_updated",
      targetType: "Product",
      targetId: product._id,
      meta: { productName: product.name },
    });

    return res.status(200).json({ product });
  } catch (error) {
    console.error("Update product error:", error.message);
    return res.status(500).json({ message: "Server error updating product" });
  }
};

// @route PATCH /api/products/:id/toggle-status
export const toggleProductStatus = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    if (product.supplierId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized to edit this product" });
    }

    product.status = product.status === "available" ? "out_of_stock" : "available";
    await product.save();

    return res.status(200).json({ product });
  } catch (error) {
    return res.status(500).json({ message: "Server error toggling product status" });
  }
};

// @route DELETE /api/products/:id
export const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    if (product.supplierId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized to delete this product" });
    }

    // best-effort cleanup of local image files
    for (const imageUrl of product.images) {
      const filePath = path.join(process.cwd(), imageUrl.replace(/^\//, ""));
      fs.unlink(filePath, () => {});
    }

    await product.deleteOne();
    return res.status(200).json({ message: "Product deleted" });
  } catch (error) {
    return res.status(500).json({ message: "Server error deleting product" });
  }
};

// @route DELETE /api/products/:id/images/:imageIndex
export const deleteProductImage = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    if (product.supplierId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized to edit this product" });
    }

    const index = parseInt(req.params.imageIndex, 10);
    if (Number.isNaN(index) || index < 0 || index >= product.images.length) {
      return res.status(400).json({ message: "Invalid image index" });
    }

    const [removed] = product.images.splice(index, 1);
    if (removed) {
      const filePath = path.join(process.cwd(), removed.replace(/^\//, ""));
      fs.unlink(filePath, () => {});
    }

    await product.save();
    return res.status(200).json({ product });
  } catch (error) {
    return res.status(500).json({ message: "Server error removing image" });
  }
};

// --- helpers ---

// Accepts array, JSON string, or comma-separated string from multipart form data
function parseArrayField(value) {
  if (Array.isArray(value)) return value;
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) return parsed;
  } catch {
    // not JSON — fall through to comma split
  }
  return String(value)
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
}

function parseJsonField(value) {
  if (!value) return {};
  if (typeof value === "object") return value;
  try {
    return JSON.parse(value);
  } catch {
    return {};
  }
}
