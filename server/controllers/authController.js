import bcrypt from "bcryptjs";
import User from "../models/User.js";
import { generateToken } from "../utils/generateToken.js";
import { logActivity } from "../utils/logActivity.js";

// @route POST /api/auth/register
export const register = async (req, res) => {
  try {
    const { email, password, role, profile } = req.body;

    if (!email || !password || !role) {
      return res.status(400).json({ message: "Email, password, and role are required" });
    }

    if (!["buyer", "supplier"].includes(role)) {
      return res.status(400).json({ message: "Role must be 'buyer' or 'supplier'." });
    }

    if (password.length < 8) {
      return res.status(400).json({ message: "Password must be at least 8 characters" });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({ message: "An account with this email already exists" });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = await User.create({
      email: email.toLowerCase(),
      passwordHash,
      role,
      profile: profile || {},
      verificationToken: null,
      isVerified: true,
      isActive: true,
    });

    logActivity({ userId: user._id, userRole: user.role, action: "register", meta: { email: user.email } });

    // Auto-login: return token immediately so frontend can log in without extra step
    const token = generateToken(user._id, user.role);

    return res.status(201).json({
      message: "Registration successful.",
      token,
      user: user.toSafeObject(),
    });
  } catch (error) {
    console.error("Register error:", error.message);
    return res.status(500).json({ message: "Server error during registration" });
  }
};

// @route POST /api/auth/login
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user || !user.isActive) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const token = generateToken(user._id, user.role);

    logActivity({ userId: user._id, userRole: user.role, action: "login", meta: { email: user.email } });

    return res.status(200).json({
      user: user.toSafeObject(),
      token,
    });
  } catch (error) {
    console.error("Login error:", error.message);
    return res.status(500).json({ message: "Server error during login" });
  }
};

// @route POST /api/auth/logout
export const logout = async (req, res) => {
  return res.status(200).json({ message: "Logged out successfully" });
};

// @route GET /api/auth/me
export const getMe = async (req, res) => {
  return res.status(200).json({ user: req.user });
};

// @route GET /api/auth/seed-admin (temporary)
export const seedAdmin = async (req, res) => {
  try {
    const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@textile.dev";
    const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "Admin1234!";

    const existing = await User.findOne({ email: ADMIN_EMAIL });
    if (existing) {
      // Ensure admin flags are set correctly
      existing.role = "admin";
      existing.isVerified = true;
      existing.isActive = true;
      existing.onboardingCompleted = true;
      await existing.save();
      return res.status(200).json({ message: "Admin account already exists and has been updated!" });
    }

    const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);

    await User.create({
      email: ADMIN_EMAIL,
      passwordHash,
      role: "admin",
      isVerified: true,
      isActive: true,
      onboardingCompleted: true,
      verificationToken: null,
      profile: {
        companyName: "Textile Marketplace Admin",
        contactName: "Admin",
      },
    });

    return res.status(201).json({ message: `✅ Admin created! Email: ${ADMIN_EMAIL} | Password: ${ADMIN_PASSWORD}` });
  } catch (error) {
    console.error("Seed error:", error.message);
    return res.status(500).json({ message: "Server error during seeding" });
  }
};

// Stubs kept for route compatibility
export const verifyEmail = async (req, res) => {
  return res.status(200).json({ message: "Email verification is disabled." });
};

export const resendVerification = async (req, res) => {
  return res.status(200).json({ message: "Email verification is disabled." });
};
