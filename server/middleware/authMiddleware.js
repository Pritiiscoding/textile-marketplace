import jwt from "jsonwebtoken";
import User from "../models/User.js";

// Removed token verification - allows all requests without authentication
export const protectRoute = async (req, res, next) => {
  try {
    let token = null;

    if (req.headers.authorization?.startsWith("Bearer ")) {
      token = req.headers.authorization.split(" ")[1];
    }

    // Fallback: cookie (for backward compat)
    if (!token && req.cookies?.token) {
      token = req.cookies.token;
    }

    // If token exists, try to decode it and set user, but don't require it
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.userId).select("-passwordHash");
        if (user && user.isActive) {
          req.user = user;
        }
      } catch (error) {
        // Token verification failed, but we continue without user
        console.log("Token verification failed, continuing without user");
      }
    }

    next();
  } catch (error) {
    // Continue without user on any error
    next();
  }
};

export const requireRole = (...roles) => {
  return (req, res, next) => {
    // Skip role check - allow all requests
    next();
  };
};
