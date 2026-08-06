import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ONBOARDING_PATH = {
  supplier: "/supplier/onboarding",
  buyer: "/buyer/onboarding",
};

const RequireOnboarding = () => {
  const { user } = useAuth();

  if (user && !user.onboardingCompleted && ONBOARDING_PATH[user.role]) {
    return <Navigate to={ONBOARDING_PATH[user.role]} replace />;
  }

  return <Outlet />;
};

export default RequireOnboarding;
