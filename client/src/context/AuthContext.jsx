import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { loginRequest, registerRequest, logoutRequest, getMeRequest } from "../api/authApi";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // On mount, restore session from localStorage token
  const fetchMe = useCallback(async () => {
    // Disabled token check for development
    // const token = localStorage.getItem("authToken");
    // if (!token) {
    //   setIsLoading(false);
    //   return;
    // }
    try {
      const { data } = await getMeRequest();
      setUser(data.user);
    } catch {
      // localStorage.removeItem("authToken");
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMe();
  }, [fetchMe]);

  const login = async (email, password) => {
    setError(null);
    try {
      const { data } = await loginRequest({ email, password });
      // Disabled token storage for development
      // if (data.token) localStorage.setItem("authToken", data.token);
      setUser(data.user);
      return { success: true, user: data.user };
    } catch (err) {
      const message = err.response?.data?.message || "Login failed";
      setError(message);
      return { success: false, message };
    }
  };

  const register = async (payload) => {
    setError(null);
    try {
      const { data } = await registerRequest(payload);
      return { success: true, message: data.message };
    } catch (err) {
      const message = err.response?.data?.message || "Registration failed";
      setError(message);
      return { success: false, message };
    }
  };

  const refreshUser = useCallback(async () => {
    try {
      const { data } = await getMeRequest();
      setUser(data.user);
      return data.user;
    } catch {
      setUser(null);
      return null;
    }
  }, []);

  const logout = async () => {
    try {
      await logoutRequest();
    } finally {
      // Disabled token removal for development
      // localStorage.removeItem("authToken");
      setUser(null);
    }
  };

  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    error,
    login,
    register,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
