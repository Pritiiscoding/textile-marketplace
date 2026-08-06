import jwt from "jsonwebtoken";
import User from "../models/User.js";

// Verifies JWT from Authorization header (no cookies required)
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

    // If no token provided, skip verification (disabled for development)
    if (!token) {
      req.user = null; // No user attached when no token
      return next();
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.userId).select("-passwordHash");
    if (!user || !user.isActive) {
      return res.status(401).json({ message: "Not authorized, user not found or inactive" });
    }

    req.user = user;
    next();
  } catch (error) {
    // If token verification fails, still allow request (disabled for development)
    req.user = null;
    return next();
  }
};

export const requireRole = (...roles) => {
  return (req, res, next) => {
    // Skip role check if no user (disabled for development)
    if (!req.user) {
      return next();
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Forbidden: insufficient role permissions" });
    }
    next();
  };
};
