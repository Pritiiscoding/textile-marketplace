import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    name: { type: String, required: true }, // snapshot at time of order
    quantity: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true, min: 0 }, // unit price snapshot
    color: { type: String },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    buyerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    supplierId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    items: {
      type: [orderItemSchema],
      required: true,
      validate: (v) => Array.isArray(v) && v.length > 0,
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: [
        "pending",
        "accepted",
        "preparing",
        "ready_for_dispatch",
        "completed",
        "cancelled",
      ],
      default: "pending",
    },
    statusHistory: {
      type: [
        {
          status: { type: String, required: true },
          changedAt: { type: Date, default: Date.now },
        },
      ],
      default: [],
    },
    shippingInfo: {
      contactName: String,
      phone: String,
      street: String,
      city: String,
      state: String,
      country: String,
      zip: String,
      notes: String,
    },
  },
  { timestamps: true }
);

orderSchema.index({ buyerId: 1, createdAt: -1 });
orderSchema.index({ supplierId: 1, createdAt: -1 });

orderSchema.pre("save", function (next) {
  if (this.isNew || this.isModified("status")) {
    this.statusHistory.push({ status: this.status, changedAt: new Date() });
  }
  next();
});

const Order = mongoose.model("Order", orderSchema);
export default Order;
