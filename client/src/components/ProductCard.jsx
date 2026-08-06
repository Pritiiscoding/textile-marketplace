import { Link } from "react-router-dom";
import { resolveImageUrl } from "../utils/media";

const ProductCard = ({ product }) => {
  const isOutOfStock = product.status === "out_of_stock" || product.stock < 1;
  const thumb = resolveImageUrl(product.images?.[0]);

  return (
    <Link
      to={`/buyer/products/${product._id}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-surface-100 dark:border-slate-800 bg-white dark:bg-slate-900 transition-all duration-300 hover:shadow-xl hover:-translate-y-2 hover:border-brand-200 dark:hover:border-brand-500/30"
      style={{ boxShadow: '0 4px 24px rgba(15, 23, 42, 0.08), 0 1px 4px rgba(15, 23, 42, 0.05)' }}
    >
      {/* Image */}
      <div className="relative aspect-square overflow-hidden bg-surface-100 dark:bg-slate-800">
        {thumb ? (
          <img
            src={thumb}
            alt={product.name}
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <span className="text-4xl opacity-30">🧵</span>
          </div>
        )}

        {/* Gradient overlay on hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Status badge */}
        {isOutOfStock && (
          <span className="absolute right-2.5 top-2.5 badge badge-red">
            Out of Stock
          </span>
        )}

        {/* Category pill */}
        <span className="absolute bottom-2.5 left-2.5 badge badge-blue opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
          {product.category}
        </span>
      </div>

      {/* Info */}
      <div className="flex flex-1 flex-col p-4">
        <p className="text-[10px] font-bold uppercase tracking-widest text-brand-400 mb-1">
          {product.category}
        </p>
        <h3 className="font-bold text-brand-900 dark:text-white leading-snug line-clamp-2 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors duration-300">
          {product.name}
        </h3>

        {product.supplierId?.profile?.companyName && (
          <p className="mt-2 flex items-center gap-1.5 text-xs text-surface-700 dark:text-slate-400">
            <svg className="h-3.5 w-3.5 text-brand-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-2 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            {product.supplierId.profile.companyName}
          </p>
        )}

        <div className="mt-auto flex items-center justify-between pt-4 border-t border-surface-100 dark:border-slate-800">
          <div>
            <span className="text-lg font-extrabold text-brand-900 dark:text-white">
              ₹{product.price.toFixed(2)}
            </span>
            <span className="ml-1 text-xs text-surface-700 dark:text-slate-400">/ {product.unit}</span>
          </div>
          <span className="flex items-center gap-1 rounded-lg bg-gradient-to-r from-brand-50 to-brand-100 dark:from-slate-800 dark:to-slate-700 px-3 py-1.5 text-xs font-bold text-brand-600 dark:text-brand-400 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-2 group-hover:translate-x-0">
            View →
          </span>
        </div>
      </div>
    </Link>

  );
};

export default ProductCard;
