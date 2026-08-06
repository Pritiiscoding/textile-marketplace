import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);
    const result = await login(form.email, form.password);
    setIsSubmitting(false);
    if (result.success) {
      const u = result.user;
      let dest;
      if (u.role === "admin") {
        dest = "/admin";
      } else if (u.role === "supplier") {
        dest = u.onboardingCompleted ? "/supplier" : "/supplier/onboarding";
      } else {
        dest = u.onboardingCompleted ? "/buyer" : "/buyer/onboarding";
      }
      navigate(dest, { replace: true });
    } else {
      setError(result.message);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-60px)] items-center justify-center bg-surface-50 dark:bg-surface-950 px-4 py-12">
      {/* Background decoration */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div
          className="absolute -top-40 -right-40 h-96 w-96 rounded-full opacity-5"
          style={{ background: "radial-gradient(circle, #3b6cf7, transparent 70%)" }}
        />
        <div
          className="absolute -bottom-40 -left-40 h-96 w-96 rounded-full opacity-5"
          style={{ background: "radial-gradient(circle, #9333ea, transparent 70%)" }}
        />
      </div>

      <div className="w-full max-w-md animate-fade-in-up">
        {/* Card */}
        <div className="overflow-hidden rounded-3xl bg-white dark:bg-slate-900 shadow-card border border-surface-100 dark:border-slate-800">
          {/* Header gradient strip */}
          <div
            className="px-8 py-8 text-center"
            style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)" }}
          >
            <Link to="/" className="inline-flex items-center gap-2 mb-4 group">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-400 to-accent-500 text-white text-base font-bold shadow-glow-sm transition-transform group-hover:scale-110">
                🧵
              </div>
              <span className="text-lg font-bold text-white">
                Thread<span className="text-gradient">Loom</span>
              </span>
            </Link>
            <h1 className="text-xl font-bold text-white">Welcome back</h1>
            <p className="mt-1 text-sm text-white/55">Sign in to your account</p>
          </div>

          {/* Form */}
          <div className="px-8 py-8">
            {error && (
              <div className="mb-5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-100 dark:border-red-900/50 px-4 py-3 text-sm text-red-700 dark:text-red-300 animate-fade-in">
                <div className="flex items-start gap-2.5">
                  <svg className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <p>{error}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5" id="login-form">
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-surface-700 dark:text-slate-400" htmlFor="login-email">
                  Email address
                </label>
                <input
                  id="login-email"
                  type="email"
                  name="email"
                  required
                  value={form.email}
                  onChange={handleChange}
                  placeholder="you@company.com"
                  className="input-field"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-surface-700 dark:text-slate-400" htmlFor="login-password">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="login-password"
                    type={showPass ? "text" : "password"}
                    name="password"
                    required
                    value={form.password}
                    onChange={handleChange}
                    placeholder="••••••••"
                    className="input-field pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-700 hover:text-brand-600 transition"
                    tabIndex={-1}
                    aria-label={showPass ? "Hide password" : "Show password"}
                  >
                    {showPass ? (
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                id="login-submit"
                disabled={isSubmitting}
                className="btn-primary w-full py-3 rounded-xl text-base"
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Signing in…
                  </span>
                ) : (
                  "Sign in →"
                )}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-surface-700 dark:text-slate-400">
              Don't have an account?{" "}
              <Link to="/register" className="font-semibold text-brand-600 hover:text-brand-700 hover:underline transition">
                Create one free
              </Link>
            </p>
          </div>
        </div>

        {/* Trust badges */}
        <div className="mt-6 flex items-center justify-center gap-6 text-xs text-surface-700 dark:text-slate-500">
          <span className="flex items-center gap-1"><span>🔒</span> SSL Secured</span>
          <span className="flex items-center gap-1"><span>✅</span> Verified Platform</span>
          <span className="flex items-center gap-1"><span>🏭</span> B2B Focused</span>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
