/**
 * Seed an admin account.
 * Usage:  node scripts/seedAdmin.js
 * Reads MONGO_URI and ADMIN_* vars from .env in the server directory.
 */

import dotenv from "dotenv";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "..", ".env") });

import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import User from "../models/User.js";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@textile.dev";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "Admin1234!";

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to MongoDB");

  const existing = await User.findOne({ email: ADMIN_EMAIL });

  if (existing) {
    await User.findByIdAndUpdate(existing._id, {
      role: "admin",
      isVerified: true,
      isActive: true,
      onboardingCompleted: true,
      verificationToken: null,
    });

    console.log(`Updated admin account: ${ADMIN_EMAIL}`);
    await mongoose.disconnect();
    return;
  }

  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);

  await User.create({
    email: ADMIN_EMAIL,
    passwordHash,
    role: "admin",
    isVerified: true,          // <-- Add this
    isActive: true,            // <-- Add this
    onboardingCompleted: true,
    verificationToken: null,   // <-- Add this
    profile: {
      companyName: "Textile Marketplace Admin",
      contactName: "Admin",
    },
  });

  console.log(`\n✅  Admin account created:`);
  console.log(`    Email:    ${ADMIN_EMAIL}`);
  console.log(`    Password: ${ADMIN_PASSWORD}`);
  console.log(`\nChange the password in production via ADMIN_EMAIL / ADMIN_PASSWORD env vars.\n`);

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});