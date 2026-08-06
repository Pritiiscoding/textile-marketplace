import Product from "../models/Product.js";
import Order from "../models/Order.js";

const LOW_STOCK_THRESHOLD = 20;

// @route GET /api/dashboard/supplier
export const getSupplierDashboardStats = async (req, res) => {
  try {
    const supplierId = req.user._id;

    const [
      totalProducts,
      activeProducts,
      pendingOrders,
      acceptedOrders,
      preparingOrders,
      completedOrders,
      recentOrders,
      lowStockProducts,
      allOrders,
      allProducts,
    ] = await Promise.all([
      Product.countDocuments({ supplierId }),
      Product.countDocuments({ supplierId, status: "available" }),
      Order.countDocuments({ supplierId, status: "pending" }),
      Order.countDocuments({ supplierId, status: "accepted" }),
      Order.countDocuments({ supplierId, status: "preparing" }),
      Order.countDocuments({ supplierId, status: "completed" }),
      Order.find({ supplierId })
        .populate("buyerId", "email profile.companyName")
        .sort({ createdAt: -1 })
        .limit(5),
      Product.find({
        supplierId,
        stock: { $lte: LOW_STOCK_THRESHOLD, $gt: 0 },
      })
        .sort({ stock: 1 })
        .limit(10)
        .select("name stock unit"),
      Order.find({ supplierId }).sort({ createdAt: 1 }),
      Product.find({ supplierId }),
    ]);

    // Aggregate Analytics Data for Charts (Feature 7)
    // 1. Orders over time (Monthly aggregation)
    const monthlyDataMap = {};
    let totalRevenue = 0;
    allOrders.forEach((ord) => {
      totalRevenue += ord.totalAmount || 0;
      const month = new Date(ord.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" });
      if (!monthlyDataMap[month]) monthlyDataMap[month] = { date: month, orders: 0, revenue: 0 };
      monthlyDataMap[month].orders += 1;
      monthlyDataMap[month].revenue += ord.totalAmount || 0;
    });
    const ordersOverTime = Object.values(monthlyDataMap);

    // 2. Revenue by category & Inventory by product
    const categoryRevenueMap = {};
    const inventoryLevels = allProducts.map((p) => ({
      name: p.name.length > 15 ? p.name.substring(0, 15) + "..." : p.name,
      stock: p.stock,
      category: p.category,
    }));

    allOrders.forEach((ord) => {
      (ord.items || []).forEach((it) => {
        const matchingProd = allProducts.find((p) => p._id.toString() === it.productId?.toString());
        const cat = matchingProd ? matchingProd.category : "General";
        categoryRevenueMap[cat] = (categoryRevenueMap[cat] || 0) + (it.price * it.quantity);
      });
    });

    const revenueByCategory = Object.keys(categoryRevenueMap).map((cat) => ({
      name: cat,
      value: categoryRevenueMap[cat],
    }));

    return res.status(200).json({
      totalProducts,
      activeProducts,
      pendingOrders,
      acceptedOrders,
      preparingOrders,
      completedOrders,
      totalOrders: allOrders.length,
      recentOrders,
      lowStockProducts,
      lowStockThreshold: LOW_STOCK_THRESHOLD,
      totalRevenue,
      analytics: {
        ordersOverTime,
        revenueByCategory: revenueByCategory.length > 0 ? revenueByCategory : [{ name: "Textiles", value: totalRevenue || 100 }],
        inventoryLevels,
      },
    });
  } catch (error) {
    console.error("Dashboard stats error:", error.message);
    return res.status(500).json({ message: "Server error fetching dashboard stats" });
  }
};
