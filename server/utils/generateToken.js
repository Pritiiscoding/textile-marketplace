import jwt from "jsonwebtoken";

export const generateToken = (userId, role) => {
  return jwt.sign({ userId, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
};

export const setTokenCookie = (res, token) => {
  res.cookie("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "none", // Changed to 'none' for cross-origin (Vercel to Render)
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    domain: process.env.NODE_ENV === "production" ? ".onrender.com" : undefined,
  });
};
