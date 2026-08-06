import { useCallback, useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { getProductsRequest, getCategoriesRequest } from "../../api/productApi";
import { getRecommendationsRequest } from "../../api/aiApi";
import ProductCard from "../../components/ProductCard";
import VisualSearchModal from "../../components/VisualSearchModal";

const SORT_OPTIONS = [
  { value: "newest",     label: "Newest" },
  { value: "price_asc",  label: "Price: Low → High" },
  { value: "price_desc", label: "Price: High → Low" },
  { value: "name_asc",   label: "Name: A–Z" },
];

const MarketplacePage = () => {
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });
  const [isLoading, setIsLoading] = useState(true);
  const [recommendations, setRecommendations] = useState([]);
  const [error, setError] = useState("");

  const [isVisualSearchOpen, setIsVisualSearchOpen] = useState(false);
  const [filters, setFilters] = useState({
    search: "",
    category: "",
    fabric: "",
    minPrice: "",
    maxPrice: "",
    sort: "newest",
  });
  const [page, setPage] = useState(1);
  const location = useLocation();

  // Sync URL search params
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const urlSearch = params.get("search") || "";
    const urlCategory = params.get("category") || "";
    if (urlSearch || urlCategory) {
      setFilters((prev) => ({ ...prev, search: urlSearch, category: urlCategory }));
      setPage(1);
    }
  }, [location.search]);

  useEffect(() => {
    getCategoriesRequest()
      .then(({ data }) => setCategories(data.categories))
      .catch(() => setCategories([]));
    getRecommendationsRequest()
      .then(({ data }) => setRecommendations(data.results || []))
      .catch(() => {});
  }, []);

  const loadProducts = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const params = { page, limit: 12 };
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== "" && value !== undefined && value !== null) {
          params[key] = value;
        }
      });
      const { data } = await getProductsRequest(params);
      setProducts(data.products);
      setPagination(data.pagination);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load products");
    } finally {
      setIsLoading(false);
    }
  }, [filters, page]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadProducts();
    }, 350);
    return () => clearTimeout(timer);
  }, [loadProducts]);

  // Auto-refresh on product updates via WebSocket events
  useEffect(() => {
    const handleProductUpdate = () => {
      loadProducts();
    };

    window.addEventListener("tl:product_updated", handleProductUpdate);
    window.addEventListener("tl:new_product", handleProductUpdate);

    return () => {
      window.removeEventListener("tl:product_updated", handleProductUpdate);
      window.removeEventListener("tl:new_product", handleProductUpdate);
    };
  }, [loadProducts]);

  const updateFilter = (key, value) => {
    setPage(1);
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const hasActiveFilters =
    filters.search || filters.category || filters.fabric || filters.minPrice || filters.maxPrice;

  const clearFilters = () => {
    setPage(1);
    setFilters({ search: "", category: "", fabric: "", minPrice: "", maxPrice: "", sort: "newest" });
  };

  return (
    <div className="page-enter fade-in">
      {/* Page header */}
      <div className="mb-8 flex items-end justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-brand-500 mb-2">
            {hasActiveFilters ? "Search Results" : "Marketplace"}
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-brand-900 dark:text-white">
            {hasActiveFilters ? "Filtered Products" : "Browse All Fabrics"}
          </h1>
          {!isLoading && (
            <p className="mt-2 text-sm text-surface-700 dark:text-slate-400">
              {products.length > 0
                ? `Showing ${products.length} product${products.length !== 1 ? "s" : ""}`
                : "No products found"}
            </p>
          )}
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setIsVisualSearchOpen(true)}
            className="flex items-center gap-2 rounded-xl border border-brand-500 bg-gradient-to-r from-brand-500/10 to-brand-600/10 px-5 py-2.5 text-xs font-bold text-brand-600 hover:from-brand-500/20 hover:to-brand-600/20 transition-all shadow-md hover:shadow-lg"
          >
            📸 Visual Swatch Search
          </button>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-2 rounded-xl border border-red-300 bg-gradient-to-r from-red-50 to-red-100 px-5 py-2.5 text-xs font-semibold text-red-600 hover:from-red-100 hover:to-red-200 transition-all shadow-md hover:shadow-lg"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* AI Recommendations */}
      {!hasActiveFilters && recommendations.length > 0 && (
        <div className="mb-8 rounded-2xl border border-brand-200 dark:border-slate-800 bg-gradient-to-br from-brand-50 to-brand-100 dark:from-slate-900 dark:to-slate-800 p-6 shadow-lg" style={{ boxShadow: '0 8px 30px rgba(59, 108, 247, 0.15)' }}>
          <div className="mb-4 flex items-center gap-3">
            <span className="text-2xl">✨</span>
            <h2 className="text-lg font-bold text-brand-900 dark:text-brand-300">Recommended for You</h2>
            <span className="badge badge-blue ml-auto">AI Powered</span>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {recommendations.slice(0, 4).map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="mb-8 rounded-2xl border border-surface-200 dark:border-slate-800 bg-gradient-to-br from-white to-surface-50 dark:from-slate-900 dark:to-slate-800 p-6 shadow-lg" style={{ boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)' }}>
        {/* Search */}
        <div className="relative mb-5">
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-surface-700 dark:text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={filters.search}
            onChange={(e) => updateFilter("search", e.target.value)}
            placeholder="Search products by name, fabric, or description…"
            className="input-field pl-12 py-3.5"
            id="marketplace-search"
          />
        </div>


        {/* Shop by Category */}
        <div className="mb-5">
          <p className="mb-3 text-xs font-bold uppercase tracking-wider text-surface-500 dark:text-slate-400">Shop by Category</p>
          <div className="flex flex-wrap gap-2.5">
            <button
              onClick={() => updateFilter("category", "")}
              className={`category-chip ${filters.category === "" ? "category-chip-active" : ""}`}
            >
              All
            </button>
            {categories.map((c) => (
              <button
                key={c}
                onClick={() => updateFilter("category", c)}
                className={`category-chip ${filters.category === c ? "category-chip-active" : ""}`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Filter row */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-4">

          {/* Fabric type */}
          <div className="col-span-1">
            <input
              type="text"
              value={filters.fabric}
              onChange={(e) => updateFilter("fabric", e.target.value)}
              placeholder="Fabric type"
              className="input-field text-sm py-2.5"
              id="filter-fabric"
            />
          </div>

          {/* Min price */}
          <div className="col-span-1">
            <input
              type="number"
              min="0"
              value={filters.minPrice}
              onChange={(e) => updateFilter("minPrice", e.target.value)}
              placeholder="Min price ₹"
              className="input-field text-sm py-2.5"
              id="filter-min-price"
            />
          </div>

          {/* Max price */}
          <div className="col-span-1">
            <input
              type="number"
              min="0"
              value={filters.maxPrice}
              onChange={(e) => updateFilter("maxPrice", e.target.value)}
              placeholder="Max price ₹"
              className="input-field text-sm py-2.5"
              id="filter-max-price"
            />
          </div>

          {/* Sort */}
          <div className="col-span-1">
            <select
              value={filters.sort}
              onChange={(e) => updateFilter("sort", e.target.value)}
              className="input-field text-sm py-2.5"
              id="filter-sort"
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-100 dark:border-red-900/50 px-4 py-3 text-sm text-red-700 dark:text-red-300">
          <svg className="h-4 w-4 text-red-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          {error}
        </div>
      )}

      {/* Products grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="animate-pulse rounded-2xl border border-surface-100 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden"
            >
              <div className="aspect-square bg-surface-100 dark:bg-slate-800" />
              <div className="p-4 space-y-2">
                <div className="h-3 bg-surface-100 dark:bg-slate-800 rounded-full w-1/3" />
                <div className="h-4 bg-surface-100 dark:bg-slate-800 rounded-full w-3/4" />
                <div className="h-3 bg-surface-100 dark:bg-slate-800 rounded-full w-1/2" />
                <div className="h-4 bg-surface-100 dark:bg-slate-800 rounded-full w-1/4 mt-4" />
              </div>
            </div>
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <span className="mb-4 text-5xl">🔍</span>
          <h3 className="mb-1 text-lg font-semibold text-brand-900 dark:text-white">No products found</h3>
          <p className="text-sm text-surface-700 dark:text-slate-400 mb-6">Try adjusting your filters or search terms</p>
          {hasActiveFilters && (
            <button onClick={clearFilters} className="btn-outline">
              Clear all filters
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {products.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="mt-10 flex items-center justify-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="flex items-center gap-1.5 rounded-xl border border-surface-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2 text-sm font-medium text-brand-900 dark:text-white hover:bg-surface-50 dark:hover:bg-slate-800 hover:border-brand-300 transition disabled:opacity-40 disabled:cursor-not-allowed shadow-card-sm"
              >
                ← Previous
              </button>
              <div className="flex items-center gap-1">
                {[...Array(Math.min(5, pagination.totalPages))].map((_, i) => {
                  const p = i + 1;
                  return (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={`h-9 w-9 rounded-xl text-sm font-semibold transition-all ${
                        p === page
                          ? "btn-primary shadow-glow-sm"
                          : "border border-surface-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-brand-900 dark:text-white hover:bg-surface-50 dark:hover:bg-slate-800 hover:border-brand-300"
                      }`}
                    >
                      {p}
                    </button>
                  );
                })}
              </div>
              <button
                disabled={page >= pagination.totalPages}
                onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                className="flex items-center gap-1.5 rounded-xl border border-surface-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2 text-sm font-medium text-brand-900 dark:text-white hover:bg-surface-50 dark:hover:bg-slate-800 hover:border-brand-300 transition disabled:opacity-40 disabled:cursor-not-allowed shadow-card-sm"
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}

      {/* Feature 4: Visual Search Modal */}
      <VisualSearchModal
        isOpen={isVisualSearchOpen}
        onClose={() => setIsVisualSearchOpen(false)}
        onResultsFound={(results) => setProducts(results)}
      />
    </div>
  );
};

export default MarketplacePage;
