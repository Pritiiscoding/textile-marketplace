import { useLocation, useNavigate, Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { visualSearchRequest } from "../../api/aiApi";
import ProductCard from "../../components/ProductCard";
import toast from "react-hot-toast";

const VisualSearchResultsPage = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // State passed via router: { results, detectedCategory, imagePreview, matchesCount }
  const {
    results: initialResults = [],
    detectedCategory = "Fabric",
    imagePreview = null,
    matchesCount = 0,
  } = location.state || {};

  const [products, setProducts] = useState(initialResults);
  const [sortBy, setSortBy] = useState("relevance");
  const [isRefining, setIsRefining] = useState(false);

  // If navigated here without state, redirect back
  useEffect(() => {
    if (!initialResults.length && !imagePreview) {
      navigate("/buyer", { replace: true });
    }
  }, []);

  const sorted = [...products].sort((a, b) => {
    if (sortBy === "price_asc") return a.price - b.price;
    if (sortBy === "price_desc") return b.price - a.price;
    if (sortBy === "name_asc") return a.name.localeCompare(b.name);
    return 0; // relevance — keep original order (backend already scored)
  });

  const fabricColors = {
    Denim: "bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-200 border-blue-200 dark:border-blue-800",
    Silk: "bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200 border-amber-200 dark:border-amber-800",
    Cotton: "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-200 border-emerald-200 dark:border-emerald-800",
    Linen: "bg-stone-100 dark:bg-stone-900/40 text-stone-800 dark:text-stone-200 border-stone-200 dark:border-stone-800",
    Wool: "bg-orange-100 dark:bg-orange-900/40 text-orange-800 dark:text-orange-200 border-orange-200 dark:border-orange-800",
    Velvet: "bg-purple-100 dark:bg-purple-900/40 text-purple-800 dark:text-purple-200 border-purple-200 dark:border-purple-800",
    Polyester: "bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700",
  };
  const tagClass = fabricColors[detectedCategory] || "bg-brand-100 dark:bg-brand-900/40 text-brand-800 dark:text-brand-200 border-brand-200 dark:border-brand-800";

  return (
    <div className="page-enter min-h-screen bg-surface-50 dark:bg-slate-950 transition-colors">
      {/* ── Top banner ── */}
      <div className="sticky top-0 z-10 bg-white dark:bg-slate-900 border-b border-surface-200 dark:border-slate-800 shadow-sm">
        <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6">
          <div className="flex items-center gap-4 flex-wrap">
            {/* Back */}
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-1.5 text-sm text-surface-600 dark:text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 transition"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </button>

            <div className="h-5 w-px bg-surface-200 dark:bg-slate-700" />

            {/* Uploaded thumbnail */}
            {imagePreview && (
              <img
                src={imagePreview}
                alt="Search swatch"
                className="h-10 w-10 rounded-xl object-cover border-2 border-brand-400 shadow-md"
              />
            )}

            {/* Heading */}
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-semibold uppercase tracking-widest text-brand-500">Visual Search</span>
                <span className={`inline-flex items-center gap-1 rounded-full border px-3 py-0.5 text-xs font-bold ${tagClass}`}>
                  📸 {detectedCategory}
                </span>
              </div>
              <h1 className="text-lg font-bold text-surface-900 dark:text-white leading-tight">
                {products.length} similar fabric{products.length !== 1 ? "s" : ""} found
              </h1>
            </div>

            {/* Sort */}
            <div className="ml-auto flex items-center gap-2">
              <label className="text-xs text-surface-600 dark:text-slate-400 font-medium hidden sm:block">Sort:</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="input-field text-xs py-2 pr-8 min-w-[150px]"
              >
                <option value="relevance">Best Match</option>
                <option value="price_asc">Price: Low → High</option>
                <option value="price_desc">Price: High → Low</option>
                <option value="name_asc">Name: A–Z</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        {/* ── AI detection card ── */}
        <div className="mb-6 flex items-start gap-4 rounded-2xl border border-brand-100 dark:border-brand-900/40 bg-gradient-to-r from-brand-50 to-indigo-50 dark:from-slate-900 dark:to-slate-800 p-4 shadow-card">
          {imagePreview && (
            <img
              src={imagePreview}
              alt="Your uploaded swatch"
              className="h-24 w-24 rounded-2xl object-cover border-2 border-brand-200 dark:border-brand-800 shadow-md flex-shrink-0"
            />
          )}
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-brand-500 mb-1">AI Vision Analysis</p>
            <p className="text-base font-bold text-surface-900 dark:text-white">
              Detected: <span className="text-brand-600 dark:text-brand-400">{detectedCategory}</span>
            </p>
            <p className="text-sm text-surface-600 dark:text-slate-400 mt-0.5">
              Showing all matching and similar products sorted by relevance score. 
              Best-matching products appear first.
            </p>
            <div className="mt-2 flex gap-2 flex-wrap">
              <Link
                to="/buyer"
                className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline"
              >
                ← Browse all products
              </Link>
              <span className="text-surface-300 dark:text-slate-600">|</span>
              <button
                onClick={() => navigate("/buyer")}
                className="text-xs font-semibold text-surface-600 dark:text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 transition"
              >
                Try another image
              </button>
            </div>
          </div>
        </div>

        {/* ── Products grid ── */}
        {isRefining ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="animate-pulse rounded-2xl border border-surface-100 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
                <div className="aspect-square bg-surface-100 dark:bg-slate-800" />
                <div className="p-4 space-y-2">
                  <div className="h-3 bg-surface-100 dark:bg-slate-800 rounded-full w-1/3" />
                  <div className="h-4 bg-surface-100 dark:bg-slate-800 rounded-full w-3/4" />
                  <div className="h-4 bg-surface-100 dark:bg-slate-800 rounded-full w-1/4 mt-4" />
                </div>
              </div>
            ))}
          </div>
        ) : sorted.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <span className="text-6xl mb-4">🔍</span>
            <h3 className="text-xl font-bold text-surface-900 dark:text-white mb-2">No exact matches found</h3>
            <p className="text-surface-600 dark:text-slate-400 mb-6 max-w-sm">
              We couldn't find products matching "{detectedCategory}". Try browsing the full catalog or uploading a different image.
            </p>
            <Link to="/buyer" className="btn-primary">Browse All Fabrics</Link>
          </div>
        ) : (
          <>
            {/* Relevance score indicator */}
            <div className="flex items-center gap-2 mb-4">
              <div className="flex-1 h-1 rounded-full bg-surface-100 dark:bg-slate-800 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-brand-400 to-indigo-500"
                  style={{ width: `${Math.min(100, (products.length / 20) * 100)}%` }}
                />
              </div>
              <span className="text-xs text-surface-500 dark:text-slate-500 font-medium flex-shrink-0">
                {products.length} results
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {sorted.map((product, i) => (
                <div key={product._id} className="relative">
                  {i < 3 && (
                    <span className="absolute top-2 left-2 z-10 rounded-full bg-gradient-to-r from-brand-500 to-indigo-600 px-2 py-0.5 text-[10px] font-bold text-white shadow-md">
                      {i === 0 ? "Best Match" : i === 1 ? "2nd" : "3rd"}
                    </span>
                  )}
                  <ProductCard product={product} />
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default VisualSearchResultsPage;
