/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  "#f0f4ff",
          100: "#e0e9ff",
          200: "#c1d3fe",
          300: "#93b4fd",
          400: "#6090fa",
          500: "#3b6cf7",
          600: "#2550ec",
          700: "#1d3dd9",
          800: "#1e33b0",
          900: "#0f172a",
          950: "#080d1a",
        },
        accent: {
          50:  "#fdf4ff",
          100: "#fae8ff",
          400: "#d946ef",
          500: "#a855f7",
          600: "#9333ea",
        },
        silk: {
          50:  "#fefce8",
          100: "#fef9c3",
          400: "#facc15",
          500: "#eab308",
        },
        surface: {
          0:   "#ffffff",
          50:  "#f8fafc",
          100: "#f1f5f9",
          200: "#e2e8f0",
          700: "#334155",
          800: "#1e293b",
          900: "#0f172a",
          950: "#020617",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        display: ["Inter", "system-ui", "sans-serif"],
      },
      backgroundImage: {
        "hero-gradient":
          "linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #0f2744 100%)",
        "card-gradient":
          "linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)",
        "cta-gradient":
          "linear-gradient(135deg, #3b6cf7 0%, #9333ea 100%)",
        "shimmer":
          "linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)",
      },
      animation: {
        "fade-in":       "fadeIn 0.4s ease-out",
        "fade-in-up":    "fadeInUp 0.5s ease-out",
        "slide-in-left": "slideInLeft 0.4s ease-out",
        "float":         "float 6s ease-in-out infinite",
        "pulse-slow":    "pulse 4s cubic-bezier(0.4,0,0.6,1) infinite",
        "shimmer":       "shimmer 2s infinite",
        "glow":          "glow 2s ease-in-out infinite alternate",
      },
      keyframes: {
        fadeIn: {
          "0%":   { opacity: "0" },
          "100%": { opacity: "1" },
        },
        fadeInUp: {
          "0%":   { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        slideInLeft: {
          "0%":   { opacity: "0", transform: "translateX(-16px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%":      { transform: "translateY(-10px)" },
        },
        shimmer: {
          "0%":   { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        glow: {
          "0%":   { boxShadow: "0 0 20px rgba(59,108,247,0.3)" },
          "100%": { boxShadow: "0 0 40px rgba(59,108,247,0.6)" },
        },
      },
      backdropBlur: {
        xs: "2px",
        "4xl": "72px",
      },
      boxShadow: {
        glass:      "0 8px 32px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.1)",
        "glass-sm": "0 4px 16px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.08)",
        card:       "0 4px 24px rgba(15,23,42,0.08), 0 1px 4px rgba(15,23,42,0.04)",
        "card-hover":"0 12px 48px rgba(15,23,42,0.15), 0 4px 12px rgba(15,23,42,0.08)",
        glow:       "0 0 30px rgba(59,108,247,0.4)",
        "glow-sm":  "0 0 15px rgba(59,108,247,0.3)",
      },
    },
  },
  plugins: [],
};
