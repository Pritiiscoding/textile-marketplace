import { useState } from "react";
import { analyzeImageRequest } from "../api/aiApi";
import toast from "react-hot-toast";

/**
 * ImageAIAnalyzer
 *
 * Props:
 *   imageFile  – a File object from an <input type="file">; takes priority
 *   imageUrl   – fallback public URL (used when no file is provided)
 *   onAnalyzed – callback({ category, colors, description })
 */
const ImageAIAnalyzer = ({ imageFile, imageUrl, onAnalyzed }) => {
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(null);

  const handleAnalyze = async () => {
    setAnalyzing(true);
    setResult(null);
    try {
      let payload;

      if (imageFile) {
        // Convert uploaded File → base64 data URL so server can read it
        const base64 = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(imageFile);
        });
        payload = { imageUrl: base64, filename: imageFile.name };
      } else if (imageUrl && !imageUrl.startsWith("blob:")) {
        payload = { imageUrl };
      } else {
        return toast.error("Please upload an image first before analyzing.");
      }

      const { data } = await analyzeImageRequest(payload);

      setResult(data);
      if (onAnalyzed) onAnalyzed(data);
      toast.success("✨ AI extracted fabric tags & details!");
    } catch (err) {
      console.error("ImageAIAnalyzer error:", err);
      toast.error("AI Analysis failed — check the server logs.");
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="mt-3 rounded-xl bg-surface-50 dark:bg-slate-800/80 border border-surface-200 dark:border-slate-700 p-3 text-xs">
      <div className="flex justify-between items-center">
        <span className="font-semibold text-brand-600 dark:text-brand-400">✨ AI Vision — Auto-Extract</span>
        <button
          type="button"
          onClick={handleAnalyze}
          disabled={analyzing || (!imageFile && !imageUrl)}
          className="rounded-lg bg-brand-600 px-3 py-1.5 text-[11px] font-bold text-white hover:bg-brand-500 disabled:opacity-50 transition flex items-center gap-1.5"
        >
          {analyzing ? (
            <>
              <svg className="h-3 w-3 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
              Analyzing…
            </>
          ) : "Auto-Extract Palette & Texture"}
        </button>
      </div>

      {result && (
        <div className="mt-3 pt-2 border-t border-surface-200 dark:border-slate-700/60 space-y-2 animate-fade-in">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-surface-600 dark:text-slate-400">Fabric Type: </span>
              <strong className="text-emerald-600 dark:text-emerald-400">{result.category}</strong>
            </div>
            <span className="text-[10px] font-bold text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-900/30 px-2 py-0.5 rounded-full">
              {Math.round((result.confidence || 0.85) * 100)}% match
            </span>
          </div>
          {result.material && (
            <div className="text-[11px]">
              <span className="text-surface-500 dark:text-slate-500">Material: </span>
              <span className="text-surface-800 dark:text-slate-200 font-medium">{result.material}</span>
            </div>
          )}
          {result.weave && (
            <div className="flex gap-3 text-[11px]">
              <span><span className="text-surface-500 dark:text-slate-500">Weave:</span> <span className="text-surface-800 dark:text-slate-200 font-medium">{result.weave}</span></span>
              {result.weight && <span><span className="text-surface-500 dark:text-slate-500">Weight:</span> <span className="text-surface-800 dark:text-slate-200 font-medium">{result.weight}</span></span>}
            </div>
          )}
          {result.pattern && (
            <div className="text-[11px]">
              <span className="text-surface-500 dark:text-slate-500">Pattern: </span>
              <span className="text-surface-800 dark:text-slate-200 font-medium">{result.pattern}</span>
            </div>
          )}
          <div className="flex flex-wrap items-center gap-1">
            <span className="text-[10px] text-surface-500 dark:text-slate-500 mr-1">Colors:</span>
            {result.colors.map((c, i) => (
              <span key={i} className="inline-block px-2 py-0.5 rounded-full bg-surface-200 dark:bg-slate-700 text-surface-800 dark:text-slate-200 text-[10px] font-medium">
                {c}
              </span>
            ))}
          </div>
          {result.suggestedUses?.length > 0 && (
            <div>
              <span className="text-[10px] text-surface-500 dark:text-slate-500">Best for: </span>
              <span className="text-[10px] text-brand-700 dark:text-brand-300 font-medium">{result.suggestedUses.join(" · ")}</span>
            </div>
          )}
          <p className="text-[10px] text-surface-500 dark:text-slate-500 italic">{result.description}</p>
        </div>
      )}
    </div>
  );
};

export default ImageAIAnalyzer;
