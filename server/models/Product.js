import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      required: true,
      trim: true,
      // e.g. "cotton fabric", "silk", "denim", "yarn", "trims"
    },
    description: {
      type: String,
      default: "",
    },
    colors: {
      type: [String],
      default: [],
    },
    specs: {
      // free-form key/value pairs, e.g. { gsm: "180", width: "58in", composition: "100% cotton" }
      type: Map,
      of: String,
      default: {},
    },
    stock: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
      // price per unit, currency assumed consistent platform-wide for now
    },
    unit: {
      type: String,
      default: "meter",
      // e.g. meter, yard, kg, roll, piece
    },
    images: {
      type: [String],
      default: [],
    },
    supplierId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: ["available", "out_of_stock"],
      default: "available",
    },
    // Sentence-transformer embedding for semantic search (384-dim for all-MiniLM-L6-v2)
    embedding: {
      type: [Number],
      default: undefined,
      select: false, // never returned in normal queries — only fetched explicitly
    },
  },
  { timestamps: true }
);

productSchema.index({ supplierId: 1 });
productSchema.index({ category: 1 });
productSchema.index({ name: "text", description: "text" });

// Auto-force out_of_stock when stock hits zero. We intentionally do NOT
// auto-flip back to "available" when stock rises above zero, since suppliers
// may manually mark a product out_of_stock for reasons other than stock count.
productSchema.pre("save", function (next) {
  if (this.stock <= 0) {
    this.status = "out_of_stock";
  }
  next();
});

const Product = mongoose.model("Product", productSchema);
export default Product;
