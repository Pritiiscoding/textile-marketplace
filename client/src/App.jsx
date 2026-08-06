import { Routes, Route } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";
import { ThemeProvider } from "./context/ThemeContext";
import { SocketProvider } from "./context/SocketContext";
import ProtectedRoute from "./routes/ProtectedRoute";
import RequireOnboarding from "./routes/RequireOnboarding";
import RedirectIfAuthenticated from "./routes/RedirectIfAuthenticated";
import Navbar from "./components/Navbar";
import AIChatWidget from "./components/AIChatWidget";

// Public / auth
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import VerifyEmailPage from "./pages/VerifyEmailPage";
import UnauthorizedPage from "./pages/UnauthorizedPage";
import NotFoundPage from "./pages/NotFoundPage";

// Supplier
import SupplierOnboardingPage from "./pages/supplier/OnboardingPage";
import SupplierLayout from "./pages/supplier/SupplierLayout";
import DashboardPage from "./pages/supplier/DashboardPage";
import InventoryPage from "./pages/supplier/InventoryPage";
import OrdersPage from "./pages/supplier/OrdersPage";
import OrderDetailPage from "./pages/supplier/OrderDetailPage";
import ProfilePage from "./pages/supplier/ProfilePage";
import SupplierRFQNegotiationsPage from "./pages/supplier/SupplierRFQNegotiationsPage";

// Buyer
import BuyerOnboardingPage from "./pages/buyer/OnboardingPage";
import BuyerLayout from "./pages/buyer/BuyerLayout";
import MarketplacePage from "./pages/buyer/MarketplacePage";
import ProductDetailPage from "./pages/buyer/ProductDetailPage";
import CartPage from "./pages/buyer/CartPage";
import CheckoutPage from "./pages/buyer/CheckoutPage";
import BuyerOrdersPage from "./pages/buyer/BuyerOrdersPage";
import BuyerOrderDetailPage from "./pages/buyer/BuyerOrderDetailPage";
import BuyerProfilePage from "./pages/buyer/BuyerProfilePage";
import VisualSearchPage from "./pages/buyer/VisualSearchPage";
import BuyerRFQNegotiationsPage from "./pages/buyer/BuyerRFQNegotiationsPage";

// Admin
import AdminLayout from "./pages/admin/AdminLayout";
import AdminUsersPage from "./pages/admin/AdminUsersPage";
import AdminProductsPage from "./pages/admin/AdminProductsPage";
import AdminOrdersPage from "./pages/admin/AdminOrdersPage";
import AdminActivityPage from "./pages/admin/AdminActivityPage";
import { Toaster } from "react-hot-toast";

const AppContent = () => {
  const { user } = useAuth();

  return (
    <SocketProvider user={user}>
      <Toaster position="top-center" />
      <Navbar />
      <AIChatWidget />

      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/verify/:token" element={<VerifyEmailPage />} />
        <Route path="/unauthorized" element={<UnauthorizedPage />} />

        <Route element={<RedirectIfAuthenticated />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
        </Route>

        {/* ── Supplier ── */}
        <Route element={<ProtectedRoute allowedRoles={["supplier"]} />}>
          <Route path="/supplier/onboarding" element={<SupplierOnboardingPage />} />
          <Route element={<RequireOnboarding />}>
            <Route path="/supplier" element={<SupplierLayout />}>
              <Route index element={<DashboardPage />} />
              <Route path="inventory" element={<InventoryPage />} />
              <Route path="orders" element={<OrdersPage />} />
              <Route path="orders/:id" element={<OrderDetailPage />} />
              <Route path="negotiations" element={<SupplierRFQNegotiationsPage />} />
              <Route path="profile" element={<ProfilePage />} />
            </Route>
          </Route>
        </Route>

        {/* ── Buyer ── */}
        <Route element={<ProtectedRoute allowedRoles={["buyer"]} />}>
          <Route path="/buyer/onboarding" element={<BuyerOnboardingPage />} />
          <Route element={<RequireOnboarding />}>
            <Route path="/buyer" element={<BuyerLayout />}>
              <Route index element={<MarketplacePage />} />
              <Route path="products/:id" element={<ProductDetailPage />} />
              <Route path="cart" element={<CartPage />} />
              <Route path="checkout" element={<CheckoutPage />} />
              <Route path="orders" element={<BuyerOrdersPage />} />
              <Route path="orders/:id" element={<BuyerOrderDetailPage />} />
              <Route path="negotiations" element={<BuyerRFQNegotiationsPage />} />
              <Route path="profile" element={<BuyerProfilePage />} />
              <Route path="visual-search" element={<VisualSearchPage />} />
            </Route>
          </Route>
        </Route>

        {/* ── Admin ── */}
        <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminUsersPage />} />
            <Route path="products" element={<AdminProductsPage />} />
            <Route path="orders" element={<AdminOrdersPage />} />
            <Route path="activity" element={<AdminActivityPage />} />
          </Route>
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </SocketProvider>
  );
};

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <CartProvider>
          <AppContent />
        </CartProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
