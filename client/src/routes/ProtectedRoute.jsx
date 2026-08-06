import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// Usage:
// <Route element={<ProtectedRoute />}> ...any authenticated user... </Route>
// <Route element={<ProtectedRoute allowedRoles={['supplier']} />}> ...supplier only... </Route>
const ProtectedRoute = ({ allowedRoles }) => {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-brand-700">Loading...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
