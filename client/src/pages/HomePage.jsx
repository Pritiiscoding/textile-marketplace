import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getProductsRequest, getCategoriesRequest } from "../api/productApi";
import ProductCard from "../components/ProductCard";

const CATEGORY_ICONS = {
  "Cotton Fabric": "🧵",
  "Denim": "👖",
  "Silk": "✨",
  "Linen": "🌿",
  "Yarn": "🧶",
  "Wool": "🐑",
  "Synthetic": "⚗️",
  "Trims": "🎀",
};

const STATS = [
  { value: "10,000+", label: "Products Listed",     icon: "📦", color: "from-brand-400 to-brand-600" },
  { value: "500+",    label: "Verified Suppliers",  icon: "✅", color: "from-emerald-400 to-emerald-600" },
  { value: "50+",     label: "Fabric Categories",   icon: "🎨", color: "from-accent-400 to-accent-600" },
];

const FEATURES = [
  {
    icon: "🔒",
    title: "Verified Suppliers",
    desc: "Every supplier is manually vetted and verified so you can source with complete confidence.",
    gradient: "from-brand-500 to-brand-700",
  },
  {
    icon: "🤖",
    title: "AI-Powered Matching",
    desc: "Our AI analyzes your buying profile and recommends the most relevant fabrics for your business.",
    gradient: "from-accent-500 to-accent-700",
  },
  {
    icon: "⚡",
    title: "Instant B2B Ordering",
    desc: "Place bulk orders, track shipments, and manage invoices — all inside one dashboard.",
    gradient: "from-silk-400 to-orange-500",
  },
];

const HomePage = () => {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [featured, setFeatured] = useState([]);
  const [categories, setCategories] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");

  const isBuyer = user?.role === "buyer";
  const isSeller = user?.role === "supplier";
  const isAdmin = user?.role === "admin";

  const dashboardPath = () => {
    if (!user) return "/login";
    if (user.role === "admin") return "/admin";
    if (user.role === "supplier") return user.onboardingCompleted ? "/supplier" : "/supplier/onboarding";
    return user.onboardingCompleted ? "/buyer" : "/buyer/onboarding";
  };

  // Removed the auto-redirect so authenticated users can actually view the landing page if they explicitly navigate to it (e.g. by clicking the logo)

  // Fetch categories for guests and buyers
  useEffect(() => {
    // Guests can browse categories too
    getCategoriesRequest()
      .then(({ data }) => setCategories(data.categories || []))
      .catch(() => {});

    // Featured products for everyone (guests + buyers)
    getProductsRequest({ limit: 8, sort: "newest", status: "available" })
      .then(({ data }) => setFeatured(data.products || []))
      .catch(() => {});
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      if (isBuyer) {
        navigate(`/buyer?search=${encodeURIComponent(searchQuery.trim())}`);
      } else {
        // Guest search redirects to login
        navigate("/login");
      }
    }
  };

  const getCategoryLink = (cat) => {
    if (isAuthenticated && isBuyer) {
      return `/buyer?category=${encodeURIComponent(cat)}`;
    }
    // Guests can browse but add-to-cart/checkout redirects to login
    return `/login`;
  };

  return (
    <div className="min-h-screen bg-surface-50">
      {/* ── Hero ──────────────────────────────────────────────── */}
      <section className="hero-bg relative">
        <div className="relative z-10 mx-auto max-w-6xl px-4 py-20 text-center sm:py-32 sm:px-6">
          {/* Badge */}
          <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-sm text-white/80 backdrop-blur-sm border border-white/15 animate-fade-in">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse-slow"></span>
            B2B Textile Marketplace — Trusted by 500+ Businesses
          </div>

          <h1 className="animate-fade-in-up text-4xl font-extrabold leading-tight tracking-tight text-white sm:text-6xl">
            Source Premium Textiles{" "}
            <span className="text-gradient">Directly from</span>
            <br className="hidden sm:block" />
            Verified Suppliers
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-white/65 sm:text-lg animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
            Browse thousands of fabrics, place bulk orders, and manage your entire
            supply chain — all in one intelligent B2B platform built for the textile industry.
          </p>

          {/* CTA / Search */}
          {isAuthenticated && isBuyer ? (
            <div
              className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center animate-fade-in-up"
              style={{ animationDelay: "0.2s" }}
            >
              <Link to="/buyer" className="btn-primary px-8 py-3.5 text-base rounded-xl">
                Launch Custom Marketplace
              </Link>
              <Link to="/buyer?search=" className="btn-secondary px-8 py-3.5 text-base rounded-xl">
                Browse Products
              </Link>
            </div>
          ) : !isAuthenticated ? (
            <div
              className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center animate-fade-in-up"
              style={{ animationDelay: "0.2s" }}
            >
              <Link to="/register" className="btn-primary px-8 py-3.5 text-base rounded-xl">
                Get Started Free
              </Link>
              <Link to="/login" className="btn-secondary px-8 py-3.5 text-base rounded-xl">
                Sign In
              </Link>
            </div>
          ) : null}

          {/* Floating fabric emoji decorations */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            {["🧵","🧶","✨","🌿"].map((emoji, i) => (
              <span
                key={i}
                className="absolute text-2xl opacity-10 animate-float"
                style={{
                  top: `${15 + i * 20}%`,
                  left: i % 2 === 0 ? `${5 + i * 3}%` : `${85 - i * 3}%`,
                  animationDelay: `${i * 1.5}s`,
                }}
              >
                {emoji}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Stats ─────────────────────────────────────────────── */}
      <section className="relative -mt-6 z-20 mx-auto max-w-4xl px-4 sm:px-6">
        <div className="grid grid-cols-3 gap-3 sm:gap-4">
          {STATS.map(({ value, label, icon, color }) => (
            <div
              key={label}
              className="animate-fade-in-up rounded-2xl bg-white p-4 text-center shadow-card border border-surface-100 sm:p-6"
            >
              <div className={`mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${color} text-lg shadow-sm`}>
                {icon}
              </div>
              <p className="text-xl font-extrabold text-brand-900 sm:text-2xl">{value}</p>
              <p className="mt-0.5 text-xs text-surface-700 leading-tight sm:text-sm">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Categories — Hidden for sellers, visible for guests and buyers ────── */}
      {!isSeller && categories.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
          <div className="mb-8 flex items-end justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-brand-500 mb-1">Browse</p>
              <h2 className="text-2xl font-bold tracking-tight text-brand-900">Shop by Category</h2>
            </div>
            {isAuthenticated && isBuyer && (
              <Link to="/buyer" className="text-sm font-medium text-brand-500 hover:text-brand-700 hover:underline transition">
                View all →
              </Link>
            )}
          </div>
          <div className="relative overflow-hidden -mx-4 px-4 sm:-mx-6 sm:px-6">
            <div className="flex gap-4 w-max animate-marquee pb-4" style={{ animationDuration: "35s" }}>
              {/* Original List */}
              {categories.slice(0, 12).map((cat, idx) => (
                <Link
                  key={`orig-${cat}-${idx}`}
                  to={getCategoryLink(cat)}
                  className="w-[140px] shrink-0 group flex flex-col items-center justify-center rounded-2xl border-2 border-b-4 border-surface-200 bg-white p-5 text-center shadow-md active:translate-y-1 active:border-b-2 hover:-translate-y-2 hover:shadow-xl hover:border-brand-300 transition-all duration-300 cursor-pointer"
                >
                  <span className="text-2xl mb-2 transition-transform duration-300 group-hover:scale-125">
                    {CATEGORY_ICONS[cat] || "🧷"}
                  </span>
                  <span className="text-xs font-semibold text-brand-800 leading-tight">{cat}</span>
                  {/* Show login hint for guests */}
                  {!isAuthenticated && (
                    <span className="mt-1 text-[9px] text-surface-700/50 leading-none">Sign in to browse</span>
                  )}
                </Link>
              ))}
              <div className="w-32 shrink-0"></div>
              {/* Duplicated List */}
              {categories.slice(0, 12).map((cat, idx) => (
                <Link
                  key={`dup-${cat}-${idx}`}
                  to={getCategoryLink(cat)}
                  className="w-[140px] shrink-0 group flex flex-col items-center justify-center rounded-2xl border-2 border-b-4 border-surface-200 bg-white p-5 text-center shadow-md active:translate-y-1 active:border-b-2 hover:-translate-y-2 hover:shadow-xl hover:border-brand-300 transition-all duration-300 cursor-pointer"
                >
                  <span className="text-2xl mb-2 transition-transform duration-300 group-hover:scale-125">
                    {CATEGORY_ICONS[cat] || "🧷"}
                  </span>
                  <span className="text-xs font-semibold text-brand-800 leading-tight">{cat}</span>
                  {!isAuthenticated && (
                    <span className="mt-1 text-[9px] text-surface-700/50 leading-none">Sign in to browse</span>
                  )}
                </Link>
              ))}
              <div className="w-32 shrink-0"></div>
              {/* Triple List */}
              {categories.slice(0, 12).map((cat, idx) => (
                <Link
                  key={`trip-${cat}-${idx}`}
                  to={getCategoryLink(cat)}
                  className="w-[140px] shrink-0 group flex flex-col items-center justify-center rounded-2xl border-2 border-b-4 border-surface-200 bg-white p-5 text-center shadow-md active:translate-y-1 active:border-b-2 hover:-translate-y-2 hover:shadow-xl hover:border-brand-300 transition-all duration-300 cursor-pointer"
                >
                  <span className="text-2xl mb-2 transition-transform duration-300 group-hover:scale-125">
                    {CATEGORY_ICONS[cat] || "🧷"}
                  </span>
                  <span className="text-xs font-semibold text-brand-800 leading-tight">{cat}</span>
                  {!isAuthenticated && (
                    <span className="mt-1 text-[9px] text-surface-700/50 leading-none">Sign in to browse</span>
                  )}
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Featured Products ──────────────────────────────────── */}
      {(!isAuthenticated || isBuyer) && featured.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6">
          <div className="mb-8 flex items-end justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-brand-500 mb-1">✨ Latest</p>
              <h2 className="text-2xl font-bold tracking-tight text-brand-900">Featured Products</h2>
            </div>
            <Link to={isAuthenticated ? "/buyer" : "/login"} className="text-sm font-medium text-brand-500 hover:text-brand-700 hover:underline transition">
              View all →
            </Link>
          </div>
          <div className="relative overflow-hidden -mx-4 px-4 sm:-mx-6 sm:px-6">
            <div className="flex gap-8 w-max animate-marquee pb-4" style={{ animationDuration: "35s" }}>
              {/* Original List */}
              {featured.map((product) => (
                <div key={`orig-${product._id}`} className="w-[280px] shrink-0">
                  <ProductCard product={product} />
                </div>
              ))}
              {/* Duplicated List for seamless scroll */}
              {featured.map((product) => (
                <div key={`dup-${product._id}`} className="w-[280px] shrink-0">
                  <ProductCard product={product} />
                </div>
              ))}
              {/* Triple for very wide screens */}
              {featured.map((product) => (
                <div key={`trip-${product._id}`} className="w-[280px] shrink-0">
                  <ProductCard product={product} />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Features ──────────────────────────────────────────── */}
      {!isAuthenticated && (
        <section className="bg-white py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="mb-12 text-center">
              <p className="text-xs font-semibold uppercase tracking-widest text-brand-500 mb-2">Why ThreadLoom</p>
              <h2 className="text-3xl font-bold tracking-tight text-brand-900 sm:text-4xl">
                The smarter way to source textiles
              </h2>
            </div>
            <div className="grid gap-6 sm:grid-cols-3">
              {FEATURES.map(({ icon, title, desc, gradient }) => (
                <div
                  key={title}
                  className="group rounded-2xl border border-surface-100 bg-surface-50 p-7 transition-all duration-300 hover:shadow-card-hover hover:-translate-y-1"
                >
                  <div className={`mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${gradient} text-xl shadow-sm transition-transform duration-300 group-hover:scale-110`}>
                    {icon}
                  </div>
                  <h3 className="mb-2 text-lg font-bold text-brand-900">{title}</h3>
                  <p className="text-sm text-surface-700 leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── CTA banner ────────────────────────────────────────── */}
      {!isAuthenticated && (
        <section className="relative overflow-hidden py-20">
          <div
            className="absolute inset-0"
            style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #0c1f3d 100%)" }}
          />
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div
              className="absolute right-0 top-0 h-96 w-96 rounded-full opacity-15"
              style={{ background: "radial-gradient(circle, #3b6cf7, transparent 70%)" }}
            />
          </div>
          <div className="relative z-10 mx-auto max-w-3xl px-4 text-center sm:px-6">
            <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              Are you a <span className="text-gradient">supplier?</span>
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-base text-white/65 leading-relaxed">
              List your products, connect with thousands of verified buyers, and grow your textile business on the fastest-growing B2B platform.
            </p>
            <Link
              to="/register"
              className="mt-8 inline-block btn-primary px-10 py-4 text-base rounded-xl"
            >
              Start Selling Today →
            </Link>
          </div>
        </section>
      )}
    </div>
  );
};

export default HomePage;
