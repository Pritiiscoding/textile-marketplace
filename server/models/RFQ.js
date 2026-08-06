import mongoose from "mongoose";

const rfqSchema = new mongoose.Schema(
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
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
    },
    unit: {
      type: String,
      default: "meter",
    },
    targetDeliveryDate: {
      type: Date,
    },
    customRequirements: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ["pending", "quoted", "accepted", "rejected", "declined", "completed"],
      default: "pending",
    },
    stage: {
      type: String,
      enum: ["request_sent", "quote_sent", "buyer_response", "completed"],
      default: "request_sent",
    },
    quotedPrice: {
      type: Number,
    },
    supplierNotes: {
      type: String,
    },
  },
  { timestamps: true }
);

const RFQ = mongoose.model("RFQ", rfqSchema);
export default RFQ;
