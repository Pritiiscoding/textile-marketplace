import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getSupplierDashboardStatsRequest } from "../../api/dashboardApi";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  CartesianGrid,
} from "recharts";

const COLORS = ["#3b6cf7", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899"];

const DashboardPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await getSupplierDashboardStatsRequest();
        setStats(data);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load dashboard");
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  const openModal = (type) => {
    setModalType(type);
    setModalOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-200 border-t-brand-500" />
        <p className="mt-4 text-sm text-slate-400">Loading live analytics...</p>
      </div>
    );
  }

  if (error || !stats) {
    return <p className="text-red-500">{error || "Error loading dashboard"}</p>;
  }

  const analytics = stats.analytics || {
    ordersOverTime: [{ date: "Aug 1", orders: 1, revenue: 250 }],
    revenueByCategory: [{ name: "Textiles", value: 1000 }],
    inventoryLevels: [{ name: "Cotton", stock: 120 }],
  };

  const renderModal = () => {
    if (!modalOpen) return null;

    let content = null;
    switch (modalType) {
      case "revenue":
        content = (
          <div className="space-y-4">
            <h3 className="text-xl font-bold">Revenue Breakdown</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-emerald-50 dark:bg-emerald-950/20 rounded-lg">
                <span className="font-medium">Total Revenue</span>
                <span className="font-bold text-emerald-600">₹{(stats.totalRevenue || 0).toFixed(2)}</span>
              </div>
              <div className="text-sm text-surface-600 dark:text-slate-400">
                {analytics.ordersOverTime.length > 0 ? (
                  <div>
                    <p className="font-semibold mb-2">Recent Transactions:</p>
                    {analytics.ordersOverTime.slice(-5).map((item, i) => (
                      <div key={i} className="flex justify-between py-2 border-b border-surface-100 dark:border-slate-800">
                        <span>{item.date}</span>
                        <span className="font-medium">₹{item.revenue?.toFixed(2) || "0"}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p>No revenue data available</p>
                )}
              </div>
            </div>
          </div>
        );
        break;
      case "orders":
        content = (
          <div className="space-y-4">
            <h3 className="text-xl font-bold">Order Status Breakdown</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-4 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg text-center">
                <p className="text-2xl font-bold text-yellow-600">{stats.pendingOrders}</p>
                <p className="text-xs text-surface-600">Pending</p>
              </div>
              <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg text-center">
                <p className="text-2xl font-bold text-blue-600">{stats.acceptedOrders || 0}</p>
                <p className="text-xs text-surface-600">Accepted</p>
              </div>
              <div className="p-4 bg-purple-50 dark:bg-purple-950/20 rounded-lg text-center">
                <p className="text-2xl font-bold text-purple-600">{stats.preparingOrders || 0}</p>
                <p className="text-xs text-surface-600">Preparing</p>
              </div>
              <div className="p-4 bg-green-50 dark:bg-green-950/20 rounded-lg text-center">
                <p className="text-2xl font-bold text-green-600">{stats.completedOrders || 0}</p>
                <p className="text-xs text-surface-600">Completed</p>
              </div>
            </div>
            <button
              onClick={() => { setModalOpen(false); navigate("/supplier/orders"); }}
              className="w-full btn-primary py-2 rounded-lg text-sm"
            >
              View All Orders
            </button>
          </div>
        );
        break;
      case "products":
        content = (
          <div className="space-y-4">
            <h3 className="text-xl font-bold">Product Breakdown</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-brand-50 dark:bg-brand-950/20 rounded-lg">
                <span className="font-medium">Active Products</span>
                <span className="font-bold text-brand-600">{stats.activeProducts}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-red-50 dark:bg-red-950/20 rounded-lg">
                <span className="font-medium">Low Stock Items</span>
                <span className="font-bold text-red-600">{stats.lowStockProducts.length}</span>
              </div>
            </div>
            <button
              onClick={() => { setModalOpen(false); navigate("/supplier/inventory"); }}
              className="w-full btn-primary py-2 rounded-lg text-sm"
            >
              Manage Inventory
            </button>
          </div>
        );
        break;
      case "stock":
        content = (
          <div className="space-y-4">
            <h3 className="text-xl font-bold">Low Stock Alert</h3>
            <div className="space-y-2">
              {stats.lowStockProducts.length > 0 ? (
                stats.lowStockProducts.map((product, i) => (
                  <div key={i} className="p-3 bg-red-50 dark:bg-red-950/20 rounded-lg flex justify-between items-center">
                    <span className="font-medium">{product.name}</span>
                    <span className="text-sm text-red-600 font-bold">{product.stock} left</span>
                  </div>
                ))
              ) : (
                <p className="text-surface-600">All products are well stocked!</p>
              )}
            </div>
            <button
              onClick={() => { setModalOpen(false); navigate("/supplier/inventory"); }}
              className="w-full btn-primary py-2 rounded-lg text-sm"
            >
              Update Inventory
            </button>
          </div>
        );
        break;
      default:
        content = null;
    }

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
        <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-surface-200 dark:border-slate-700 p-6 shadow-2xl">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Details</h2>
            <button
              onClick={() => setModalOpen(false)}
              className="text-surface-600 hover:text-surface-900 dark:hover:text-white text-2xl"
            >
              ×
            </button>
          </div>
          {content}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8 text-surface-900 dark:text-white transition-colors duration-300">
      {/* Header Banner with Gradient */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-brand-600 to-brand-800 p-6 sm:p-8 shadow-lg">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2"></div>
        <div className="relative z-10">
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Supplier Analytics Dashboard</h1>
          <p className="text-sm text-brand-100 mt-1">Real-time marketplace revenue, order volume, and inventory telemetry</p>
        </div>
      </div>

      {/* Top Stat Cards with Clickable Action */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div 
          onClick={() => openModal("revenue")}
          className="p-5 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-lg hover:shadow-xl cursor-pointer transform hover:scale-105 transition-all duration-300"
        >
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">💰</span>
            <p className="text-xs font-semibold uppercase opacity-90">Total Revenue</p>
          </div>
          <p className="text-3xl font-extrabold">₹{(stats.totalRevenue || 0).toFixed(2)}</p>
          <p className="text-xs mt-2 opacity-75">Click for breakdown →</p>
        </div>
        
        <div 
          onClick={() => openModal("orders")}
          className="p-5 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-600 text-white shadow-lg hover:shadow-xl cursor-pointer transform hover:scale-105 transition-all duration-300"
        >
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">📦</span>
            <p className="text-xs font-semibold uppercase opacity-90">Total Orders</p>
          </div>
          <p className="text-3xl font-extrabold">{stats.totalOrders || stats.pendingOrders || 0}</p>
          <p className="text-xs mt-2 opacity-75">Click for breakdown →</p>
        </div>
        
        <div 
          onClick={() => openModal("products")}
          className="p-5 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg hover:shadow-xl cursor-pointer transform hover:scale-105 transition-all duration-300"
        >
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">🧵</span>
            <p className="text-xs font-semibold uppercase opacity-90">Active Products</p>
          </div>
          <p className="text-3xl font-extrabold">{stats.activeProducts}</p>
          <p className="text-xs mt-2 opacity-75">Click for breakdown →</p>
        </div>
        
        <div 
          onClick={() => openModal("stock")}
          className="p-5 rounded-2xl bg-gradient-to-br from-rose-500 to-rose-600 text-white shadow-lg hover:shadow-xl cursor-pointer transform hover:scale-105 transition-all duration-300"
        >
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">⚠️</span>
            <p className="text-xs font-semibold uppercase opacity-90">Low Stock Items</p>
          </div>
          <p className="text-3xl font-extrabold">{stats.lowStockProducts.length}</p>
          <p className="text-xs mt-2 opacity-75">Click for breakdown →</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <Link
          to="/supplier/inventory"
          className="flex items-center justify-center gap-2 p-4 rounded-xl bg-white dark:bg-slate-900 border border-surface-200 dark:border-slate-800 hover:border-brand-500 hover:shadow-md transition-all"
        >
          <span className="text-xl">➕</span>
          <span className="text-sm font-medium">Add Product</span>
        </Link>
        <Link
          to="/supplier/orders"
          className="flex items-center justify-center gap-2 p-4 rounded-xl bg-white dark:bg-slate-900 border border-surface-200 dark:border-slate-800 hover:border-brand-500 hover:shadow-md transition-all"
        >
          <span className="text-xl">📋</span>
          <span className="text-sm font-medium">View Orders</span>
        </Link>
        <Link
          to="/supplier/negotiations"
          className="flex items-center justify-center gap-2 p-4 rounded-xl bg-white dark:bg-slate-900 border border-surface-200 dark:border-slate-800 hover:border-brand-500 hover:shadow-md transition-all"
        >
          <span className="text-xl">🤝</span>
          <span className="text-sm font-medium">Negotiations</span>
        </Link>
      </div>

      {/* Feature 7: Recharts Supplier Dashboard Graphs */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Orders Over Time (Line Chart) */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-surface-200 dark:border-slate-800 shadow-card hover:shadow-lg transition-shadow">
          <h3 className="text-base font-bold mb-4 flex items-center gap-2 text-brand-900 dark:text-white">
            📈 Orders & Sales Volume Over Time
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={analytics.ordersOverTime}>
                <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-surface-200 dark:text-slate-800" />
                <XAxis dataKey="date" stroke="currentColor" className="text-surface-700 dark:text-slate-400 text-xs" />
                <YAxis stroke="currentColor" className="text-surface-700 dark:text-slate-400 text-xs" />
                <Tooltip contentStyle={{ backgroundColor: "#1e293b", borderColor: "#334155", color: "#fff", borderRadius: "12px" }} />
                <Line type="monotone" dataKey="revenue" stroke="#3b6cf7" strokeWidth={3} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Revenue by Category (Pie Chart) */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-surface-200 dark:border-slate-800 shadow-card hover:shadow-lg transition-shadow">
          <h3 className="text-base font-bold mb-4 flex items-center gap-2 text-brand-900 dark:text-white">
            🍰 Revenue Breakdown by Product Category
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={analytics.revenueByCategory}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name }) => name}
                >
                  {analytics.revenueByCategory.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: "#1e293b", borderColor: "#334155", color: "#fff", borderRadius: "12px" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Inventory Levels (Bar Chart) */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-surface-200 dark:border-slate-800 shadow-card hover:shadow-lg transition-shadow lg:col-span-2">
          <h3 className="text-base font-bold mb-4 flex items-center gap-2 text-brand-900 dark:text-white">
            📊 Current Product Stock Levels
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.inventoryLevels}>
                <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-surface-200 dark:text-slate-800" />
                <XAxis dataKey="name" stroke="currentColor" className="text-surface-700 dark:text-slate-400 text-xs" />
                <YAxis stroke="currentColor" className="text-surface-700 dark:text-slate-400 text-xs" />
                <Tooltip contentStyle={{ backgroundColor: "#1e293b", borderColor: "#334155", color: "#fff", borderRadius: "12px" }} />
                <Bar dataKey="stock" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Modal */}
      {renderModal()}
    </div>
  );
};

export default DashboardPage;

