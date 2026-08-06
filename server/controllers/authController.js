import bcrypt from "bcryptjs";
import User from "../models/User.js";
import { generateToken, setTokenCookie } from "../utils/generateToken.js";
import { logActivity } from "../utils/logActivity.js";

import crypto from "crypto";
import { sendVerificationEmail } from "../utils/sendEmail.js";

// @route POST /api/auth/register
export const register = async (req, res) => {
  try {
    const { email, password, role, profile } = req.body;

    if (!email || !password || !role) {
      return res.status(400).json({ message: "Email, password, and role are required" });
    }

    if (!["buyer", "supplier"].includes(role)) {
      return res.status(400).json({ message: "Role must be 'buyer' or 'supplier'. Admin accounts are seeded separately." });
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
    
    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString("hex");

    const user = await User.create({
      email: email.toLowerCase(),
      passwordHash,
      role,
      profile: profile || {},
      verificationToken,
    });
    
    logActivity({ userId: user._id, userRole: user.role, action: "register", meta: { email: user.email } });

    // Send email via nodemailer (logs verify URL to console in dev if SMTP unavailable)
    const emailResult = await sendVerificationEmail(user.email, verificationToken);

    const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
    const verifyUrl = `${clientUrl}/verify/${verificationToken}`;

    const response = {
      message: emailResult?.sent
        ? "Registration successful. Please check your email to verify your account."
        : "Registration successful. Please verify your account using the link below.",
    };

    // If email failed to send (e.g. Resend unverified domain or missing SMTP), return verifyUrl in response
    if (!emailResult?.sent) {
      response.devVerifyUrl = verifyUrl;
    }

    return res.status(201).json(response);
  } catch (error) {
    console.error("Register error:", error.message);
    return res.status(500).json({ message: "Server error during registration" });
  }
};

// @route POST /api/auth/verify-email
export const verifyEmail = async (req, res) => {
  try {
    const { token } = req.body;
    
    if (!token) return res.status(400).json({ message: "Invalid token" });

    const user = await User.findOne({ verificationToken: token });
    
    if (!user) {
      return res.status(400).json({ message: "Invalid or expired verification link" });
    }

    user.isVerified = true;
    user.verificationToken = null; // consume token
    await user.save();

    return res.status(200).json({ message: "Email verified successfully. You can now log in." });
  } catch (error) {
    console.error("Verification error:", error.message);
    return res.status(500).json({ message: "Server error during verification" });
  }
};

// @route POST /api/auth/resend-verification
export const resendVerification = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({ message: "No account found with this email address" });
    }

    if (user.isVerified) {
      return res.status(400).json({ message: "This account is already verified. Please sign in." });
    }

    // Generate fresh token
    const verificationToken = crypto.randomBytes(32).toString("hex");
    user.verificationToken = verificationToken;
    await user.save();

    const emailResult = await sendVerificationEmail(user.email, verificationToken);

    const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
    const verifyUrl = `${clientUrl}/verify/${verificationToken}`;

    const response = {
      message: emailResult?.sent
        ? "Verification email resent. Please check your inbox."
        : "Verification email resent. Please verify your account using the link below.",
    };

    if (!emailResult?.sent && process.env.NODE_ENV !== "production") {
      response.verifyUrl = verifyUrl;
    }

    return res.status(200).json(response);
  } catch (error) {
    console.error("Resend verification error:", error.message);
    return res.status(500).json({ message: "Server error sending verification email" });
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

    if (!user.isVerified) {
      return res.status(401).json({ message: "Please verify your email before logging in" });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const token = generateToken(user._id, user.role);
    setTokenCookie(res, token);

    logActivity({ userId: user._id, userRole: user.role, action: 'login', meta: { email: user.email } });

    return res.status(200).json({
      user: user.toSafeObject(),
      token,
    });
  } catch (error) {
    console.error("Login error:", error.message);
    return res.status(500).json({ message: "Server error during login" });
  }
};

export const logout = async (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  });
  return res.status(200).json({ message: "Logged out successfully" });
};

// @route GET /api/auth/me
export const getMe = async (req, res) => {
  return res.status(200).json({ user: req.user });
};

// @route GET /api/auth/seed-admin (Temporary fallback)
export const seedAdmin = async (req, res) => {
  try {
    const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@textile.dev";
    const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "Admin1234!";

    const existing = await User.findOne({ email: ADMIN_EMAIL });
    if (existing) {
      return res.status(200).json({ message: "Admin account already exists!" });
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

    return res.status(201).json({ message: "✅ Admin account created successfully!" });
  } catch (error) {
    console.error("Seed error:", error.message);
    return res.status(500).json({ message: "Server error during seeding" });
  }
};
