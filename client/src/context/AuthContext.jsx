import { createContext, useContext, useEffect, useState, useCallback } from "react";
import {
  loginRequest,
  registerRequest,
  logoutRequest,
  getMeRequest,
  resendVerificationRequest,
} from "../api/authApi";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchMe = useCallback(async () => {
    try {
      const { data } = await getMeRequest();
      setUser(data.user);
    } catch {
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
      setUser(data.user);
      // Store token as fallback for cross-origin
      if (data.token) {
        localStorage.setItem("auth_token", data.token);
      }
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
      setUser(data.user);
      // Store token as fallback for cross-origin
      if (data.token) {
        localStorage.setItem("auth_token", data.token);
      }
      return {
        success: true,
        message: data.message,
        verifyUrl: data.verifyUrl,
      };
    } catch (err) {
      const message = err.response?.data?.message || "Registration failed";
      setError(message);
      return { success: false, message };
    }
  };

  const resendVerification = async (email) => {
    try {
      const { data } = await resendVerificationRequest(email);
      return {
        success: true,
        message: data.message,
        verifyUrl: data.verifyUrl,
      };
    } catch (err) {
      const message = err.response?.data?.message || "Failed to resend verification email";
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
      setUser(null);
      localStorage.removeItem("auth_token");
    }
  };

  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    error,
    login,
    register,
    resendVerification,
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

