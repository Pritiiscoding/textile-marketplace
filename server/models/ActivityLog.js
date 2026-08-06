import mongoose from "mongoose";

const activityLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    userRole: {
      type: String,
      enum: ["buyer", "supplier", "admin"],
      required: true,
    },
    action: {
      type: String,
      required: true,
      // e.g. login, register, product_created, product_updated, product_deleted,
      //      order_placed, order_status_updated, cart_cleared, profile_updated
    },
    targetType: {
      type: String, // e.g. 'Product', 'Order', 'User'
      default: null,
    },
    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    meta: {
      // Free-form extra context, e.g. { productName: 'Cotton Blend', newStatus: 'shipped' }
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
    // Capped at 10 000 docs in dev; remove cap in production
  }
);

activityLogSchema.index({ userId: 1 });
activityLogSchema.index({ action: 1 });
activityLogSchema.index({ createdAt: -1 });

const ActivityLog = mongoose.model("ActivityLog", activityLogSchema);
export default ActivityLog;
