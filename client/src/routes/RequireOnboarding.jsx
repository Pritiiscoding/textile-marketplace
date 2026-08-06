import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ONBOARDING_PATH = {
  supplier: "/supplier/onboarding",
  buyer: "/buyer/onboarding",
};

const RequireOnboarding = () => {
  // Disabled onboarding check - allow all access
  return <Outlet />;
};

export default RequireOnboarding;
