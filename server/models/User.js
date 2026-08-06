import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ["buyer", "supplier", "admin"],
      required: true,
    },
    profile: {
      companyName: { type: String, trim: true },
      contactName: { type: String, trim: true },
      phone: { type: String, trim: true },
      address: {
        street: String,
        city: String,
        state: String,
        country: String,
        zip: String,
      },
      // Supplier-specific fields (ignored for buyers)
      businessLicenseNumber: { type: String, trim: true },
      minimumOrderQuantity: { type: Number },
      businessType: { type: String, trim: true }, // e.g. "manufacturer", "wholesaler", "mill" (supplier) or "retailer", "garment factory" (buyer)
      operatingHours: { type: String, trim: true }, // e.g. "Mon-Sat 9am-6pm"
      productCategories: { type: [String], default: [] }, // supplier: categories sold | buyer: categories of interest
      fabricTypes: { type: [String], default: [] }, // supplier: fabrics offered | buyer: preferred fabrics
      // Buyer-specific fields (ignored for suppliers)
      industry: { type: String, trim: true }, // e.g. "apparel", "home textiles", "upholstery"
      typicalOrderQuantity: { type: Number },
      budgetRange: {
        min: { type: Number },
        max: { type: Number },
      },
    },
    onboardingCompleted: {
      type: Boolean,
      default: false,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    verificationToken: {
      type: String,
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

userSchema.methods.toSafeObject = function () {
  const obj = this.toObject();
  delete obj.passwordHash;
  return obj;
};

const User = mongoose.model("User", userSchema);
export default User;
