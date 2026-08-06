import { createContext, useContext, useState, useCallback } from "react";
import {
  getCartRequest,
  addCartItemRequest,
  updateCartItemRequest,
  removeCartItemRequest,
  clearCartRequest,
} from "../api/cartApi";
import { useAuth } from "./AuthContext";

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  const { user } = useAuth();
  const [cart, setCart] = useState({ items: [] });
  const [isLoading, setIsLoading] = useState(false);

  const refreshCart = useCallback(async () => {
    if (!user || user.role !== "buyer") return;
    setIsLoading(true);
    try {
      const { data } = await getCartRequest();
      setCart(data.cart);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const addItem = async (productId, quantity = 1, color, negotiatedPrice) => {
    console.log("CartContext addItem called with:", { productId, quantity, color, negotiatedPrice });
    try {
      const { data } = await addCartItemRequest(productId, quantity, color, negotiatedPrice);
      console.log("CartContext addItem response:", data);
      setCart(data.cart);
      return data.cart;
    } catch (err) {
      console.error("CartContext addItem error:", err);
      throw err;
    }
  };

  const updateItem = async (productId, quantity, color) => {
    const { data } = await updateCartItemRequest(productId, quantity, color);
    setCart(data.cart);
    return data.cart;
  };

  const removeItem = async (productId, color) => {
    const { data } = await removeCartItemRequest(productId, color);
    setCart(data.cart);
    return data.cart;
  };

  const clearCart = async () => {
    const { data } = await clearCartRequest();
    setCart(data.cart);
    return data.cart;
  };

  const itemCount = (cart.items || []).reduce((sum, i) => sum + i.quantity, 0);

  const value = {
    cart,
    itemCount,
    isLoading,
    refreshCart,
    addItem,
    updateItem,
    removeItem,
    clearCart,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};
