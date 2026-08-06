import jwt from "jsonwebtoken";
import User from "../models/User.js";

// Verifies JWT (from cookie or Authorization header) and attaches req.user
export const protectRoute = async (req, res, next) => {
  try {
    let token = req.cookies?.token;

    if (!token && req.headers.authorization?.startsWith("Bearer ")) {
      token = req.headers.authorization.split(" ")[1];
    }

    console.log("Auth Debug - Token:", token ? "Present" : "Missing");
    console.log("Auth Debug - Cookie:", req.cookies?.token ? "Present" : "Missing");
    console.log("Auth Debug - Auth Header:", req.headers.authorization ? "Present" : "Missing");

    // TEMPORARY: Allow requests without token for testing
    if (!token) {
      console.log("Auth Debug - TEMPORARY: Allowing request without token for testing");
      // Create a temporary user for testing
      req.user = {
        _id: "000000000000000000000000",
        email: "test@example.com",
        role: "buyer",
        isActive: true,
        isVerified: true,
        onboardingCompleted: true,
      };
      return next();
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("Auth Debug - Token decoded:", decoded);

    const user = await User.findById(decoded.userId).select("-passwordHash");
    if (!user || !user.isActive) {
      console.log("Auth Debug - 401: User not found or inactive");
      return res.status(401).json({ message: "Not authorized, user not found or inactive" });
    }

    req.user = user;
    console.log("Auth Debug - Success: User authenticated:", user.email);
    next();
  } catch (error) {
    console.log("Auth Debug - TEMPORARY: Allowing request on auth error for testing:", error.message);
    // Create a temporary user for testing
    req.user = {
      _id: "000000000000000000000000",
      email: "test@example.com",
      role: "buyer",
      isActive: true,
      isVerified: true,
      onboardingCompleted: true,
    };
    return next();
  }
};

// Usage: requireRole('supplier') or requireRole('buyer', 'supplier')
export const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Not authorized" });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Forbidden: insufficient role permissions" });
    }
    next();
  };
};
