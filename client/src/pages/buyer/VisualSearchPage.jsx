import { useEffect, useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { visualSearchRequest } from "../../api/aiApi";
import ProductCard from "../../components/ProductCard";
import toast from "react-hot-toast";

const VisualSearchPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state || {};
  const { imageBase64, fileName } = state;

  const [loading, setLoading] = useState(true);
  const [results, setResults] = useState([]);
  const [detectedCategory, setDetectedCategory] = useState("");

  useEffect(() => {
    if (!imageBase64) {
      toast.error("No image provided for visual search.");
      navigate("/buyer");
      return;
    }

    const performSearch = async () => {
      try {
        const { data } = await visualSearchRequest({
          imageData: imageBase64,
          filename: fileName,
        });
        setResults(data.results || []);
        setDetectedCategory(data.detectedCategory || "General");
      } catch (err) {
        toast.error("Visual search failed.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    performSearch();
  }, [imageBase64, fileName, navigate]);

  return (
    <div className="min-h-screen bg-surface-50 dark:bg-slate-900 pb-16">
      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-800 border-b border-surface-200 dark:border-slate-700 shadow-sm pt-8 pb-6 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center gap-6">
          <div className="shrink-0 relative group">
            <div className="w-32 h-32 md:w-40 md:h-40 rounded-2xl overflow-hidden border-4 border-white dark:border-slate-700 shadow-lg bg-surface-100 dark:bg-slate-700 flex items-center justify-center">
              {imageBase64 ? (
                <img src={imageBase64} alt="Search Query" className="w-full h-full object-cover" />
              ) : (
                <svg className="w-10 h-10 text-surface-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              )}
            </div>
            <div className="absolute -bottom-3 -right-3 bg-gradient-to-r from-brand-500 to-indigo-600 text-white w-12 h-12 rounded-full flex items-center justify-center shadow-lg border-4 border-white dark:border-slate-800">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
          
          <div className="flex-1 mt-4 md:mt-0">
            <h1 className="text-2xl md:text-3xl font-bold text-surface-900 dark:text-white">
              Visual Search Results
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <p className="text-surface-600 dark:text-slate-400">
                Found products matching your uploaded image.
              </p>
              {detectedCategory && !loading && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-brand-100 text-brand-800 dark:bg-brand-900/40 dark:text-brand-300 border border-brand-200 dark:border-brand-700/50">
                  <span className="mr-1.5">✨</span> Google Lens Match: {detectedCategory}
                </span>
              )}
            </div>
            
            <button 
              onClick={() => navigate('/buyer')}
              className="mt-5 text-sm font-semibold text-brand-600 dark:text-brand-400 hover:text-brand-700 flex items-center gap-1 transition-colors bg-brand-50 dark:bg-brand-900/20 px-4 py-2 rounded-xl w-fit"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
              Back to Marketplace
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 animate-pulse">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-white dark:bg-slate-800 rounded-3xl h-80 shadow-sm border border-surface-200 dark:border-slate-700 overflow-hidden">
                <div className="h-48 bg-surface-200 dark:bg-slate-700 w-full"></div>
                <div className="p-5 space-y-4">
                  <div className="h-4 bg-surface-200 dark:bg-slate-700 rounded w-3/4"></div>
                  <div className="h-4 bg-surface-200 dark:bg-slate-700 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        ) : results.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {results.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        ) : (
          <div className="text-center py-24 bg-white dark:bg-slate-800 rounded-3xl border border-surface-200 dark:border-slate-700 shadow-sm">
            <div className="text-7xl mb-5">🔍</div>
            <h3 className="text-2xl font-bold text-surface-900 dark:text-white">No exact matches found</h3>
            <p className="text-surface-600 dark:text-slate-400 mt-3 max-w-md mx-auto text-base">
              We couldn't find products that visually match your swatch. Try uploading a clearer photo or exploring the marketplace.
            </p>
            <Link to="/buyer" className="mt-8 inline-flex items-center px-6 py-3.5 border border-transparent text-base font-semibold rounded-2xl text-white bg-gradient-to-r from-brand-500 to-indigo-600 hover:opacity-90 shadow-lg shadow-brand-500/30 transition-all">
              Browse All Fabrics
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default VisualSearchPage;
