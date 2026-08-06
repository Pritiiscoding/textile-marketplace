import { useEffect, useState } from "react";
import { getActivityLogsRequest } from "../../api/adminApi";

const ACTION_ICON = {
  login: "🔐",
  register: "🆕",
  product_created: "📦",
  product_updated: "✏️",
  product_deleted: "🗑️",
  order_placed: "🛒",
  order_status_updated: "🚚",
  cart_cleared: "🧹",
  profile_updated: "👤",
  user_updated: "🔧",
  user_deleted: "❌",
};

function humanize(action, meta, userRole) {
  switch (action) {
    case "login":
      return `logged in`;
    case "register":
      return `registered as ${userRole}`;
    case "product_created":
      return `created product "${meta?.productName || "unknown"}"`;
    case "product_updated":
      return `updated product "${meta?.productName || "unknown"}"`;
    case "product_deleted":
      return `deleted product "${meta?.productName || "unknown"}"`;
    case "order_placed":
      return `placed an order — $${meta?.total?.toFixed(2) || "?"} (${meta?.itemCount || "?"} item${meta?.itemCount !== 1 ? "s" : ""})`;
    case "order_status_updated":
      return `updated order status${meta?.from ? ` from ${meta.from}` : ""} to ${meta?.to || "?"}`;
    case "user_updated":
      return `updated a user account`;
    case "user_deleted":
      return `deleted user ${meta?.email || ""}`;
    default:
      return action.replace(/_/g, " ");
  }
}

function timeAgo(date) {
  const diff = (Date.now() - new Date(date)) / 1000;
  if (diff < 60) return `${Math.round(diff)}s ago`;
  if (diff < 3600) return `${Math.round(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.round(diff / 3600)}h ago`;
  return new Date(date).toLocaleDateString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

const ROLE_COLOR = {
  buyer: "text-blue-600",
  supplier: "text-green-600",
  admin: "text-red-600",
};

const AdminActivityPage = () => {
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [actionFilter, setActionFilter] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    setIsLoading(true);
    setError("");
    try {
      const { data } = await getActivityLogsRequest({
        action: actionFilter || undefined,
        limit: 200,
      });
      setLogs(data.logs);
      setTotal(data.total);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load activity");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { load(); }, [actionFilter]);

  // Poll every 15s to simulate live feed
  useEffect(() => {
    const interval = setInterval(load, 15_000);
    return () => clearInterval(interval);
  }, [actionFilter]);

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-brand-900">
          Activity Log <span className="ml-1 text-sm font-normal text-gray-400">({total} events)</span>
        </h2>
        <button
          onClick={load}
          className="text-sm text-brand-600 hover:underline"
        >
          ↻ Refresh
        </button>
      </div>

      <div className="mb-4">
        <input
          type="text"
          placeholder="Filter by action (e.g. order_placed)…"
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          className="w-72 rounded border border-gray-300 px-3 py-1.5 text-sm focus:border-brand-500 focus:outline-none"
        />
      </div>

      {error && <p className="mb-3 text-sm text-red-600">{error}</p>}

      {isLoading ? (
        <p className="text-gray-500">Loading…</p>
      ) : logs.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white p-8 text-center shadow-sm">
          <p className="text-gray-500">No activity logged yet.</p>
          <p className="mt-1 text-xs text-gray-400">Events appear here as users interact with the platform.</p>
        </div>
      ) : (
        <div className="space-y-1">
          {logs.map((log) => {
            const user = log.userId;
            const name = user?.profile?.companyName || user?.email || "Unknown";
            const role = user?.role || log.userRole;
            const icon = ACTION_ICON[log.action] || "•";
            const description = humanize(log.action, log.meta, role);

            return (
              <div
                key={log._id}
                className="flex items-start gap-3 rounded-lg border border-gray-100 bg-white px-4 py-3 shadow-sm"
              >
                <span className="mt-0.5 text-base leading-none">{icon}</span>
                <div className="flex-1 text-sm">
                  <span className={`font-medium ${ROLE_COLOR[role] || "text-gray-700"}`}>
                    {name}
                  </span>
                  <span className="text-gray-400"> ({role}) </span>
                  <span className="text-gray-700">{description}</span>
                </div>
                <span className="whitespace-nowrap text-xs text-gray-400">
                  {timeAgo(log.createdAt)}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AdminActivityPage;
