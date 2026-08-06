import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { verifyEmailRequest } from "../api/authApi";
import { useAuth } from "../context/AuthContext";

const VerifyEmailPage = () => {
  const { token } = useParams();
  const { resendVerification } = useAuth();
  const [status, setStatus] = useState("loading"); // loading, success, error
  const [message, setMessage] = useState("");
  const [resendEmail, setResendEmail] = useState("");
  const [resendStatus, setResendStatus] = useState(null);
  const [isResending, setIsResending] = useState(false);

  useEffect(() => {
    const verify = async () => {
      try {
        const { data } = await verifyEmailRequest(token);
        setStatus("success");
        setMessage(data.message);
      } catch (err) {
        setStatus("error");
        setMessage(err.response?.data?.message || "Verification failed");
      }
    };
    if (token) verify();
  }, [token]);

  const handleResendSubmit = async (e) => {
    e.preventDefault();
    if (!resendEmail) return;
    setIsResending(true);
    setResendStatus(null);
    const res = await resendVerification(resendEmail);
    setIsResending(false);
    setResendStatus(res);
  };

  const states = {
    loading: {
      icon: (
        <svg className="h-12 w-12 animate-spin text-brand-500" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      ),
      iconBg: "from-brand-400 to-brand-600",
      title: "Verifying your email…",
      subtitle: "Please wait while we activate your account.",
      action: null,
    },
    success: {
      icon: <span className="text-3xl">✅</span>,
      iconBg: "from-emerald-400 to-emerald-600",
      title: "Email Verified!",
      subtitle: message,
      action: (
        <Link to="/login" id="go-to-login" className="btn-primary w-full py-3 rounded-xl text-base text-center">
          Sign in to your account →
        </Link>
      ),
    },
    error: {
      icon: <span className="text-3xl">❌</span>,
      iconBg: "from-red-400 to-red-600",
      title: "Verification Failed",
      subtitle: message,
      action: (
        <div className="space-y-4 text-left">
          <form onSubmit={handleResendSubmit} className="space-y-3">
            <label className="block text-xs font-semibold uppercase tracking-wider text-surface-700 dark:text-slate-300">
              Resend verification email to:
            </label>
            <input
              type="email"
              required
              value={resendEmail}
              onChange={(e) => setResendEmail(e.target.value)}
              placeholder="you@company.com"
              className="input-field"
            />
            <button
              type="submit"
              disabled={isResending}
              className="btn-primary w-full py-2.5 rounded-xl text-sm"
            >
              {isResending ? "Resending..." : "Send new verification email"}
            </button>
          </form>

          {resendStatus && (
            <div className={`p-3 rounded-xl text-xs font-semibold ${resendStatus.success ? "bg-emerald-50 text-emerald-800 border border-emerald-200" : "bg-red-50 text-red-800 border border-red-200"}`}>
              {resendStatus.message}
              {resendStatus.verifyUrl && (
                <div className="mt-2 p-2 bg-white rounded border text-[11px] break-all font-normal">
                  Link: <a href={resendStatus.verifyUrl} className="text-brand-600 hover:underline">{resendStatus.verifyUrl}</a>
                </div>
              )}
            </div>
          )}

          <div className="pt-2 text-center">
            <Link to="/register" className="text-xs font-medium text-surface-700 hover:text-brand-600 hover:underline">
              Or create a new account →
            </Link>
          </div>
        </div>
      ),
    },
  };


  const state = states[status];

  return (
    <div className="flex min-h-[calc(100vh-60px)] items-center justify-center bg-surface-50 px-4 py-12">
      <div className="w-full max-w-md animate-fade-in-up">
        <div className="overflow-hidden rounded-3xl bg-white shadow-card border border-surface-100 text-center">
          {/* Header gradient */}
          <div
            className="px-8 py-8"
            style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)" }}
          >
            <Link to="/" className="inline-flex items-center gap-2 mb-2 group">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-brand-400 to-accent-500 text-sm font-bold text-white shadow-glow-sm transition-transform group-hover:scale-110">
                🧵
              </div>
              <span className="text-base font-bold text-white">
                Thread<span className="text-gradient">Loom</span>
              </span>
            </Link>
          </div>

          {/* Content */}
          <div className="px-8 py-10">
            <div
              className={`mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br ${state.iconBg} shadow-lg`}
            >
              {state.icon}
            </div>

            <h1 className="mb-3 text-2xl font-bold text-brand-900">{state.title}</h1>
            {state.subtitle && (
              <p className="mb-8 text-sm text-surface-700 leading-relaxed">{state.subtitle}</p>
            )}

            {state.action && <div>{state.action}</div>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmailPage;
