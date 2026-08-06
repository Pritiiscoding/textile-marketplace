import ActivityLog from "../models/ActivityLog.js";

/**
 * Fire-and-forget activity log writer. Never throws — logging failures
 * must never break the primary request path.
 *
 * @param {Object} opts
 * @param {string|ObjectId} opts.userId
 * @param {string} opts.userRole
 * @param {string} opts.action   e.g. 'product_created'
 * @param {string} [opts.targetType]  e.g. 'Product'
 * @param {string|ObjectId} [opts.targetId]
 * @param {Object} [opts.meta]   extra context for the feed display
 */
export const logActivity = (opts) => {
  ActivityLog.create(opts).catch((err) => {
    console.warn("Activity log write failed (non-fatal):", err.message);
  });
};
