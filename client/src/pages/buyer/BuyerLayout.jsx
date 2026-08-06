import { Outlet } from "react-router-dom";
import { useEffect } from "react";
import { useCart } from "../../context/CartContext";

const BuyerLayout = () => {
  const { refreshCart } = useCart();

  useEffect(() => {
    refreshCart();
  }, [refreshCart]);

  return (
    <div className="min-h-screen bg-surface-50 dark:bg-surface-950 text-surface-900 dark:text-surface-50 transition-colors duration-300">
      {/* Content */}
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 page-enter">
        <Outlet />
      </div>
    </div>
  );

};

export default BuyerLayout;
