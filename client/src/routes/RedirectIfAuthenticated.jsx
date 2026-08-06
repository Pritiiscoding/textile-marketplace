import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// Wraps guest-only pages (Login, Register) — if already logged in, redirect to dashboard
const RedirectIfAuthenticated = () => {
  // Disabled authentication redirect - allow access to login/register pages
  return <Outlet />;
};

export default RedirectIfAuthenticated;
