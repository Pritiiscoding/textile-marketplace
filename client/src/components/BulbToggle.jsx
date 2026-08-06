import React from "react";
import { useTheme } from "../context/ThemeContext";

const BulbToggle = ({ className = "" }) => {
  const { darkMode, toggleDarkMode } = useTheme();

  // Note: Bulb ON represents Day/Light mode. Bulb OFF represents Night/Dark mode.
  // If darkMode is true (Night mode), bulb is OFF (click to turn ON Day mode).
  // If darkMode is false (Day mode), bulb is ON (click to turn OFF Night mode).
  const isBulbOn = !darkMode;

  return (
    <button
      type="button"
      id="theme-bulb-toggle"
      onClick={toggleDarkMode}
      className={`relative inline-flex items-center justify-center p-2 rounded-xl transition-all duration-300 group focus:outline-none focus:ring-2 focus:ring-amber-400/50 ${
        isBulbOn
          ? "bg-amber-400/15 hover:bg-amber-400/25 border border-amber-400/30 text-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.35)]"
          : "bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/80 text-slate-400 hover:text-slate-200"
      } ${className}`}
      title={isBulbOn ? "Turn OFF bulb (Night Mode)" : "Turn ON bulb (Day Mode)"}
      aria-label={isBulbOn ? "Switch to Night Mode" : "Switch to Day Mode"}
    >
      {/* Light glow halo when ON */}
      {isBulbOn && (
        <span className="absolute inset-0 rounded-xl bg-amber-400/20 blur-md animate-pulse pointer-events-none" />
      )}

      <div className="relative flex items-center justify-center w-6 h-6 transition-transform duration-300 group-hover:scale-110 active:scale-95">
        {/* Light rays around bulb when ON */}
        {isBulbOn && (
          <svg
            className="absolute inset-0 w-full h-full text-amber-300 animate-spin-slow opacity-80"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          >
            <line x1="12" y1="1" x2="12" y2="3" />
            <line x1="12" y1="21" x2="12" y2="23" />
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
            <line x1="1" y1="12" x2="3" y2="12" />
            <line x1="21" y1="12" x2="23" y2="12" />
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
          </svg>
        )}

        {/* Light Bulb SVG */}
        <svg
          className={`w-5 h-5 transition-all duration-300 ${
            isBulbOn
              ? "text-amber-300 drop-shadow-[0_0_8px_rgba(253,224,71,0.9)]"
              : "text-slate-400 group-hover:text-slate-200"
          }`}
          viewBox="0 0 24 24"
          fill={isBulbOn ? "currentColor" : "none"}
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {/* Bulb Outline & Glass */}
          <path d="M9 18h6" />
          <path d="M10 22h4" />
          <path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14" />
          {/* Filament inside bulb */}
          {isBulbOn && (
            <path
              d="M9.5 9l2.5-3 2.5 3"
              stroke="#ffffff"
              strokeWidth="1.5"
              fill="none"
              className="animate-pulse"
            />
          )}
        </svg>
      </div>
    </button>
  );
};


export default BulbToggle;
