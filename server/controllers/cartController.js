import Cart from "../models/Cart.js";
import Product from "../models/Product.js";

const populateOpts = {
  path: "items.productId",
  select: "name price images stock status unit supplierId",
};

const findOrCreateCart = async (buyerId) => {
  let cart = await Cart.findOne({ buyerId });
  if (!cart) {
    cart = await Cart.create({ buyerId, items: [] });
  }
  return cart;
};

// @route GET /api/cart
export const getCart = async (req, res) => {
  try {
    const cart = await findOrCreateCart(req.user._id);
    await cart.populate(populateOpts);
    return res.status(200).json({ cart });
  } catch (error) {
    console.error("Get cart error:", error.message);
    return res.status(500).json({ message: "Server error fetching cart" });
  }
};

// @route POST /api/cart/items
// Body: { productId, quantity, color, negotiatedPrice }
export const addCartItem = async (req, res) => {
  try {
    const { productId, quantity = 1, color, negotiatedPrice } = req.body;
    console.log("addCartItem called with:", { productId, quantity, color, negotiatedPrice, userId: req.user._id });

    if (!productId) {
      return res.status(400).json({ message: "productId is required" });
    }
    const qty = Number(quantity);
    if (!Number.isInteger(qty) || qty < 1) {
      return res.status(400).json({ message: "quantity must be a positive integer" });
    }

    const product = await Product.findById(productId);
    console.log("Product found:", product ? { id: product._id, name: product.name, status: product.status, stock: product.stock, unit: product.unit } : null);
    
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    if (product.status !== "available" || product.stock < 1) {
      return res.status(400).json({ message: "Product is currently out of stock" });
    }

    const cart = await findOrCreateCart(req.user._id);
    const existing = cart.items.find(
      (item) => item.productId.toString() === productId && (item.color || "") === (color || "")
    );

    const newQty = (existing?.quantity || 0) + qty;
    if (newQty > product.stock) {
      return res.status(400).json({
        message: `Only ${product.stock} ${product.unit}(s) available in stock`,
      });
    }

    if (existing) {
      existing.quantity = newQty;
      if (negotiatedPrice) existing.negotiatedPrice = negotiatedPrice;
    } else {
      cart.items.push({ 
        productId, 
        quantity: qty, 
        color: color || undefined,
        negotiatedPrice: negotiatedPrice || undefined
      });
    }

    await cart.save();
    await cart.populate(populateOpts);
    console.log("Cart saved successfully");
    return res.status(200).json({ cart });
  } catch (error) {
    console.error("Add cart item error:", error.message);
    console.error("Full error:", error);
    return res.status(500).json({ message: "Server error adding item to cart" });
  }
};

// @route PATCH /api/cart/items/:productId
// Body: { quantity, color }
export const updateCartItem = async (req, res) => {
  try {
    const { productId } = req.params;
    const { quantity, color } = req.body;

    const qty = Number(quantity);
    if (!Number.isInteger(qty) || qty < 1) {
      return res.status(400).json({ message: "quantity must be a positive integer" });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    if (qty > product.stock) {
      return res.status(400).json({
        message: `Only ${product.stock} ${product.unit}(s) available in stock`,
      });
    }

    const cart = await findOrCreateCart(req.user._id);
    const item = cart.items.find(
      (i) => i.productId.toString() === productId && (i.color || "") === (color || "")
    );
    if (!item) {
      return res.status(404).json({ message: "Item not found in cart" });
    }

    item.quantity = qty;
    await cart.save();
    await cart.populate(populateOpts);
    return res.status(200).json({ cart });
  } catch (error) {
    console.error("Update cart item error:", error.message);
    return res.status(500).json({ message: "Server error updating cart item" });
  }
};

// @route DELETE /api/cart/items/:productId?color=...
export const removeCartItem = async (req, res) => {
  try {
    const { productId } = req.params;
    const { color } = req.query;

    const cart = await findOrCreateCart(req.user._id);
    cart.items = cart.items.filter(
      (i) => !(i.productId.toString() === productId && (i.color || "") === (color || ""))
    );

    await cart.save();
    await cart.populate(populateOpts);
    return res.status(200).json({ cart });
  } catch (error) {
    console.error("Remove cart item error:", error.message);
    return res.status(500).json({ message: "Server error removing cart item" });
  }
};

// @route DELETE /api/cart
export const clearCart = async (req, res) => {
  try {
    const cart = await findOrCreateCart(req.user._id);
    cart.items = [];
    await cart.save();
    return res.status(200).json({ cart });
  } catch (error) {
    return res.status(500).json({ message: "Server error clearing cart" });
  }
};
