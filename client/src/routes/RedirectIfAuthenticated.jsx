import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// Wraps guest-only pages (Login, Register) — if already logged in, redirect to dashboard
const RedirectIfAuthenticated = () => {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-200 border-t-brand-500" />
      </div>
    );
  }

  if (isAuthenticated && user) {
    let dest = "/";
    if (user.role === "admin") dest = "/admin";
    else if (user.role === "supplier") dest = user.onboardingCompleted ? "/supplier" : "/supplier/onboarding";
    else dest = user.onboardingCompleted ? "/buyer" : "/buyer/onboarding";

    return <Navigate to={dest} replace />;
  }

  return <Outlet />;
};

export default RedirectIfAuthenticated;
