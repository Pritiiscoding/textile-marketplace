import mongoose from "mongoose";

const negotiationSchema = new mongoose.Schema(
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
    originalPrice: {
      type: Number,
      required: true,
    },
    offeredPrice: {
      type: Number,
      required: true,
    },
    counterPrice: {
      type: Number,
    },
    quantity: {
      type: Number,
      default: 1,
    },
    unit: {
      type: String,
      default: "meter",
    },
    status: {
      type: String,
      enum: ["pending", "countered", "accepted", "declined", "completed"],
      default: "pending",
    },
    stage: {
      type: String,
      enum: ["offer_sent", "counter_sent", "buyer_response", "completed"],
      default: "offer_sent",
    },
    messages: [
      {
        senderRole: { type: String, enum: ["buyer", "supplier"] },
        text: String,
        createdAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

const Negotiation = mongoose.model("Negotiation", negotiationSchema);
export default Negotiation;
