import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// Usage:
// <Route element={<ProtectedRoute />}> ...any authenticated user... </Route>
// <Route element={<ProtectedRoute allowedRoles={['supplier']} />}> ...supplier only... </Route>
const ProtectedRoute = ({ allowedRoles }) => {
  // Disabled authentication check - allow all access
  return <Outlet />;
};

export default ProtectedRoute;
