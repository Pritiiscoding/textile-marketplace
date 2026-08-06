import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { visualSearchRequest } from "../api/aiApi";
import toast from "react-hot-toast";

const VisualSearchModal = ({ isOpen, onClose, onResultsFound }) => {
  const navigate = useNavigate();
  const [imagePreview, setImagePreview] = useState(null);
  const [imageBase64, setImageBase64] = useState(null);
  const [fileName, setFileName] = useState("");
  const [loading, setLoading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [detectedLabel, setDetectedLabel] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  const inputRef = useRef(null);

  if (!isOpen) return null;

  const processFile = (file) => {
    if (!file || !file.type.startsWith("image/")) {
      return toast.error("Please select an image file.");
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
      setImageBase64(reader.result); // full base64 data URL — safe to send to server
      setFileName(file.name);
    };
    reader.readAsDataURL(file);
  };

  const handleImageChange = (e) => processFile(e.target.files[0]);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    processFile(e.dataTransfer.files[0]);
  };

  const handleSearch = () => {
    if (!imageBase64) return toast.error("Please upload a fabric swatch photo first!");
    
    // Close modal and navigate to results page, passing the image data
    onClose();
    navigate("/buyer/visual-search", { 
      state: { imageBase64, fileName } 
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-surface-200 dark:border-slate-700 p-6 shadow-2xl text-surface-900 dark:text-white">
        {/* Header */}
        <div className="flex items-start justify-between mb-5">
          <div>
            <h3 className="text-xl font-bold text-brand-900 dark:text-white">Visual Fabric Search</h3>
            <p className="text-xs text-surface-700 dark:text-slate-400 mt-0.5">Upload a swatch photo — AI finds matching products</p>
          </div>
          <button onClick={onClose} className="text-surface-400 dark:text-slate-500 hover:text-surface-700 dark:hover:text-white ml-4 mt-0.5 transition">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-4">
          {/* Drop zone */}
          <div
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            className={`flex flex-col items-center justify-center border-2 border-dashed rounded-2xl p-6 cursor-pointer transition-all min-h-[160px]
              ${dragging
                ? "border-brand-500 bg-brand-50 dark:bg-brand-900/20 scale-[1.01]"
                : "border-surface-200 dark:border-slate-700 bg-surface-50 dark:bg-slate-800/50 hover:border-brand-400 hover:bg-brand-50/40 dark:hover:border-brand-600 dark:hover:bg-slate-800"
              }`}
          >
            {imagePreview ? (
              <>
                <img src={imagePreview} alt="Swatch preview" className="max-h-40 rounded-xl object-cover mb-3 shadow-md" />
                <p className="text-xs text-brand-600 dark:text-brand-400 font-medium">Click or drop to replace</p>
              </>
            ) : (
              <div className="text-center py-2">
                <div className="text-4xl mb-3">📸</div>
                <p className="text-sm font-semibold text-surface-700 dark:text-slate-300">Click or drag & drop a fabric photo</p>
                <p className="text-xs text-surface-500 dark:text-slate-500 mt-1">JPG, PNG, WEBP supported</p>
              </div>
            )}
            <input ref={inputRef} type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
          </div>

          {/* AI hint */}
          {imagePreview && !errorMsg && (
            <div className="flex items-center gap-2 rounded-xl bg-brand-50 dark:bg-slate-800 border border-brand-100 dark:border-slate-700 px-3 py-2">
              <span className="text-base">✨</span>
              <p className="text-xs text-brand-700 dark:text-brand-300 font-medium">
                {detectedLabel
                  ? `Detected: ${detectedLabel} — searching catalog…`
                  : "AI will classify your fabric and find the best matching products in the catalog"}
              </p>
            </div>
          )}

          {/* Inline error */}
          {errorMsg && (
            <div className="flex items-start gap-2 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 px-3 py-2.5">
              <span className="text-red-500 text-base mt-0.5">⚠️</span>
              <div>
                <p className="text-xs font-semibold text-red-700 dark:text-red-400">Search failed</p>
                <p className="text-[11px] text-red-600 dark:text-red-500 mt-0.5">{errorMsg}</p>
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <button
              onClick={onClose}
              className="flex-1 rounded-xl border border-surface-200 dark:border-slate-700 bg-surface-100 dark:bg-slate-800 px-4 py-2.5 text-sm font-semibold text-surface-700 dark:text-slate-300 hover:bg-surface-200 dark:hover:bg-slate-700 transition"
            >
              Cancel
            </button>
            <button
              onClick={handleSearch}
              disabled={loading || !imagePreview}
              className="flex-1 rounded-xl bg-gradient-to-r from-brand-500 to-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg hover:opacity-90 disabled:opacity-50 transition"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  Analyzing Swatch…
                </span>
              ) : "Find Similar Products"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VisualSearchModal;
