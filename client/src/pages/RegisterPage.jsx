import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import PhoneInput from "../components/PhoneInput";

const ROLES = [
  {
    id: "buyer",
    label: "Buyer",
    icon: "🛍️",
    desc: "Source fabrics & materials",
  },
  {
    id: "supplier",
    label: "Supplier",
    icon: "🏭",
    desc: "List & sell your products",
  },
];

const RegisterPage = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    email: "",
    password: "",
    role: "buyer",
    companyName: "",
    contactName: "",
    phone: "",
  });
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

    const payload = {
      email: form.email,
      password: form.password,
      role: form.role,
      profile: {
        companyName: form.companyName,
        contactName: form.contactName,
        phone: form.phone,
      },
    };

    const result = await register(payload);
    setIsSubmitting(false);

    if (result.success && result.autoLoggedIn) {
      // Auto-logged in — go straight to onboarding
      if (result.user.role === "supplier") {
        navigate("/supplier/onboarding", { replace: true });
      } else if (result.user.role === "buyer") {
        navigate("/buyer/onboarding", { replace: true });
      } else {
        navigate("/login", { replace: true });
      }
    } else if (result.success) {
      navigate("/login", { replace: true });
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
        <div className="overflow-hidden rounded-3xl bg-white dark:bg-slate-900 shadow-card border border-surface-100 dark:border-slate-800">
          {/* Header */}
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
            <h1 className="text-xl font-bold text-white">Create your account</h1>
            <p className="mt-1 text-sm text-white/55">Join the B2B textile marketplace</p>
          </div>

          {/* Form */}
          <div className="px-8 py-8">
            {error && (
              <div className="mb-5 flex items-start gap-2.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-100 dark:border-red-900/50 px-4 py-3 text-sm text-red-700 dark:text-red-300 animate-fade-in">
                <svg className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5" id="register-form">
              {/* Role selector */}
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-surface-700 dark:text-slate-400">
                  I am joining as a…
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {ROLES.map(({ id, label, icon, desc }) => (
                    <label
                      key={id}
                      id={`role-${id}`}
                      className={`cursor-pointer rounded-xl border-2 p-4 text-center transition-all duration-200 ${
                        form.role === id
                          ? "border-brand-500 bg-brand-50 dark:bg-brand-900/20 shadow-glow-sm"
                          : "border-surface-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-brand-300 hover:bg-surface-50"
                      }`}
                    >
                      <input
                        type="radio"
                        name="role"
                        value={id}
                        checked={form.role === id}
                        onChange={handleChange}
                        className="hidden"
                      />
                      <span className="block text-2xl mb-1">{icon}</span>
                      <span className={`block text-sm font-bold ${form.role === id ? "text-brand-700 dark:text-brand-400" : "text-brand-900 dark:text-white"}`}>
                        {label}
                      </span>
                      <span className="block text-xs text-surface-700 dark:text-slate-400 mt-0.5 leading-tight">{desc}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-surface-700 dark:text-slate-400" htmlFor="reg-email">
                  Email address
                </label>
                <input
                  id="reg-email"
                  type="email"
                  name="email"
                  required
                  value={form.email}
                  onChange={handleChange}
                  placeholder="you@company.com"
                  className="input-field"
                />
              </div>

              {/* Password */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-surface-700 dark:text-slate-400" htmlFor="reg-password">
                  Password <span className="normal-case text-surface-700 dark:text-slate-500 font-normal">(min. 8 characters)</span>
                </label>
                <div className="relative">
                  <input
                    id="reg-password"
                    type={showPass ? "text" : "password"}
                    name="password"
                    required
                    minLength={8}
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

              {/* Company name — suppliers only */}
              {form.role === "supplier" && (
                <div className="animate-fade-in">
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-surface-700 dark:text-slate-400" htmlFor="reg-company">
                    Company name
                  </label>
                  <input
                    id="reg-company"
                    type="text"
                    name="companyName"
                    required
                    value={form.companyName}
                    onChange={handleChange}
                    placeholder="e.g. Acme Textiles Ltd."
                    className="input-field"
                  />
                </div>
              )}

              {/* Contact name */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-surface-700 dark:text-slate-400" htmlFor="reg-contact">
                  Contact name
                </label>
                <input
                  id="reg-contact"
                  type="text"
                  name="contactName"
                  value={form.contactName}
                  onChange={handleChange}
                  placeholder="e.g. Alex Kim"
                  className="input-field"
                />
              </div>

              {/* Phone */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-surface-700 dark:text-slate-400" htmlFor="reg-phone">
                  Phone <span className="normal-case text-surface-700 dark:text-slate-500 font-normal">(optional)</span>
                </label>
                <PhoneInput
                  id="reg-phone"
                  value={form.phone}
                  onChange={(phone) => setForm((f) => ({ ...f, phone }))}
                />
              </div>

              <button
                type="submit"
                id="register-submit"
                disabled={isSubmitting}
                className="btn-primary w-full py-3 rounded-xl text-base"
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Creating account…
                  </span>
                ) : (
                  "Create account →"
                )}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-surface-700 dark:text-slate-400">
              Already have an account?{" "}
              <Link to="/login" className="font-semibold text-brand-600 hover:text-brand-700 hover:underline transition">
                Sign in
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

export default RegisterPage;
