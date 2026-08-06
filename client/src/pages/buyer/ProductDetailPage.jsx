import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { toast } from "react-hot-toast";
import { getProductByIdRequest } from "../../api/productApi";
import { similarProductsRequest } from "../../api/aiApi";
import ProductCard from "../../components/ProductCard";
import { useCart } from "../../context/CartContext";
import { resolveImageUrl } from "../../utils/media";
import RFQModal from "../../components/RFQModal";
import NegotiationWidget from "../../components/NegotiationWidget";

const ProductDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addItem } = useCart();

  const [product, setProduct] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeImage, setActiveImage] = useState(0);
  const [selectedColor, setSelectedColor] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [meters, setMeters] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [similar, setSimilar] = useState([]);

  // Feature 5 & 6 Modal States
  const [isRfqOpen, setIsRfqOpen] = useState(false);
  const [isNegotiateOpen, setIsNegotiateOpen] = useState(false);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const { data } = await getProductByIdRequest(id);
        setProduct(data.product);
        setSelectedColor(data.product.colors?.[0] || "");
        similarProductsRequest(id)
          .then(({ data: sim }) => setSimilar(sim.results || []))
          .catch(() => {});
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load product");
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [id]);

  const handleAddToCart = async () => {
    setIsAdding(true);
    try {
      // Use meters if provided and product unit is meter, otherwise use quantity
      const finalQuantity = (meters && product.unit === "meter") ? Number(meters) : quantity;
      await addItem(product._id, finalQuantity, selectedColor || undefined);
      toast.success(`Added ${finalQuantity} ${product.unit} to cart!`);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to add to cart");
    } finally {
      setIsAdding(false);
    }
  };

  const handleBuyNow = async () => {
    setIsAdding(true);
    try {
      // Use meters if provided and product unit is meter, otherwise use quantity
      const finalQuantity = (meters && product.unit === "meter") ? Number(meters) : quantity;
      await addItem(product._id, finalQuantity, selectedColor || undefined);
      navigate("/buyer/cart");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to add to cart");
      setIsAdding(false);
    }
  };

  if (isLoading) return (
    <div className="space-y-8 animate-pulse">
      <div className="h-6 w-32 bg-surface-100 dark:bg-slate-800 rounded"></div>
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <div className="aspect-square bg-surface-100 dark:bg-slate-800 rounded-2xl"></div>
        <div className="space-y-4">
          <div className="h-8 w-1/3 bg-surface-100 dark:bg-slate-800 rounded"></div>
          <div className="h-12 w-3/4 bg-surface-100 dark:bg-slate-800 rounded"></div>
          <div className="h-24 bg-surface-100 dark:bg-slate-800 rounded"></div>
        </div>
      </div>
    </div>
  );
  
  if (error) return <p className="text-red-600 dark:text-red-400">{error}</p>;
  if (!product) return null;

  const isOutOfStock = product.status === "out_of_stock" || product.stock < 1;
  const images = product.images || [];

  return (
    <div>
      <Link to="/buyer" className="mb-4 inline-block text-sm font-medium text-brand-600 dark:text-brand-400 hover:underline">
        &larr; Back to marketplace
      </Link>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
        <div>
          <div className="aspect-square overflow-hidden rounded-2xl bg-surface-100 dark:bg-slate-800 border border-surface-200 dark:border-slate-700 shadow-lg">
            {images.length > 0 ? (
              <img
                src={resolveImageUrl(images[activeImage])}
                alt={product.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-surface-500 dark:text-slate-500 text-6xl">
                🧶
              </div>
            )}
          </div>
          {images.length > 1 && (
            <div className="mt-4 flex gap-3">
              {images.map((img, i) => (
                <button
                  key={img}
                  onClick={() => setActiveImage(i)}
                  className={`h-20 w-20 overflow-hidden rounded-xl border-2 transition-all ${
                    i === activeImage ? "border-brand-500 shadow-md" : "border-surface-200 dark:border-slate-700 hover:border-brand-300 dark:hover:border-slate-500"
                  }`}
                >
                  <img src={resolveImageUrl(img)} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col">
          <p className="text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">{product.category}</p>
          <h1 className="mt-2 text-3xl sm:text-4xl font-extrabold text-brand-900 dark:text-white leading-tight">{product.name}</h1>
          {product.supplierId?.profile?.companyName && (
            <p className="mt-2 text-sm text-surface-600 dark:text-slate-400">
              Verified Supplier: <strong className="text-brand-800 dark:text-slate-200">{product.supplierId.profile.companyName}</strong>
            </p>
          )}

          <p className="mt-5 text-4xl font-black text-brand-900 dark:text-white">
            ₹{product.price.toFixed(2)}
            <span className="ml-1 text-base font-normal text-surface-500 dark:text-slate-400">/ {product.unit}</span>
          </p>

          <div className="mt-3">
            {isOutOfStock ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-red-100 dark:bg-red-900/30 px-3 py-1 text-sm font-semibold text-red-700 dark:text-red-400">
                <span className="h-2 w-2 rounded-full bg-red-500"></span> Out of stock
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 px-3 py-1 text-sm font-semibold text-emerald-700 dark:text-emerald-400">
                <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                {product.stock} {product.unit}(s) available in inventory
              </span>
            )}
          </div>

          {product.description && (
            <p className="mt-6 text-surface-700 dark:text-slate-300 leading-relaxed text-base">{product.description}</p>
          )}

          {/* Action Buttons for Feature 5 & Feature 6 */}
          <div className="mt-8 flex flex-wrap gap-3">
            <button
              onClick={() => setIsRfqOpen(true)}
              className="flex-1 rounded-xl bg-brand-50 dark:bg-slate-800 border border-brand-200 dark:border-brand-500/50 py-3 px-4 text-xs sm:text-sm font-bold text-brand-700 dark:text-brand-300 hover:bg-brand-100 dark:hover:bg-brand-500/20 transition flex items-center justify-center gap-2 shadow-sm"
            >
              📋 Request for Quote (RFQ)
            </button>
            <button
              onClick={() => setIsNegotiateOpen(true)}
              className="flex-1 rounded-xl bg-emerald-50 dark:bg-slate-800 border border-emerald-200 dark:border-emerald-500/50 py-3 px-4 text-xs sm:text-sm font-bold text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition flex items-center justify-center gap-2 shadow-sm"
            >
              💬 Make Counter Offer
            </button>
          </div>

          {product.colors?.length > 0 && (
            <div className="mt-8">
              <p className="mb-3 text-xs font-bold uppercase tracking-wider text-surface-500 dark:text-slate-400">Available Colors</p>
              <div className="flex flex-wrap gap-2.5">
                {product.colors.map((color) => (
                  <button
                    key={color}
                    onClick={() => setSelectedColor(color)}
                    className={`rounded-full border px-4 py-1.5 text-sm font-semibold transition-all ${
                      selectedColor === color
                        ? "border-brand-500 bg-brand-50 dark:bg-brand-500/20 text-brand-700 dark:text-brand-300 shadow-sm"
                        : "border-surface-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-surface-700 dark:text-slate-300 hover:border-surface-300 dark:hover:border-slate-600"
                    }`}
                  >
                    {color}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="mt-auto pt-8">
            {!isOutOfStock && (
              <>
                <div className="mb-4 flex items-center gap-4">
                  <label className="text-xs font-bold uppercase tracking-wider text-surface-500 dark:text-slate-400">Quantity</label>
                  <input
                    type="number"
                    min="1"
                    max={product.stock}
                    value={quantity}
                    onChange={(e) =>
                      setQuantity(Math.max(1, Math.min(product.stock, Number(e.target.value))))
                    }
                    className="w-24 input-field py-2 text-center font-semibold"
                  />
                </div>
                {product.unit === "meter" && (
                  <div className="mb-4 flex items-center gap-4">
                    <label className="text-xs font-bold uppercase tracking-wider text-surface-500 dark:text-slate-400">Meters</label>
                    <input
                      type="number"
                      min="0"
                      step="0.5"
                      max={product.stock}
                      value={meters}
                      onChange={(e) =>
                        setMeters(Math.max(0, Math.min(product.stock, Number(e.target.value))))}
                      className="w-24 input-field py-2 text-center font-semibold"
                      placeholder="Optional"
                    />
                  </div>
                )}
              </>
            )}

            <div className="flex gap-3">
              <button
                onClick={handleAddToCart}
                disabled={isOutOfStock || isAdding}
                className="btn-outline flex-1 py-3.5 text-base"
              >
                {isAdding ? "Adding..." : "Add to Cart"}
              </button>
              <button
                onClick={handleBuyNow}
                disabled={isOutOfStock || isAdding}
                className="btn-primary flex-1 py-3.5 text-base shadow-lg"
              >
                Buy Now
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Feature 5 RFQ Modal */}
      <RFQModal
        productId={product._id}
        productName={product.name}
        unit={product.unit || "meter"}
        isOpen={isRfqOpen}
        onClose={() => setIsRfqOpen(false)}
      />

      {/* Feature 6 Negotiation Widget */}
      <NegotiationWidget
        productId={product._id}
        currentPrice={product.price}
        unit={product.unit || "meter"}
        isOpen={isNegotiateOpen}
        onClose={() => setIsNegotiateOpen(false)}
      />

      {similar.length > 0 && (
        <div className="mt-20 border-t border-surface-200 dark:border-slate-800 pt-10">
          <h2 className="mb-8 text-2xl font-bold text-brand-900 dark:text-white">Similar Visually & Semantically</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {similar.slice(0, 5).map((p) => (
              <ProductCard key={p._id} product={p} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductDetailPage;
