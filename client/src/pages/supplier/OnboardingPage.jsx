import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { updateProfileRequest } from "../../api/userApi";
import api from "../../api/axios";

const FALLBACK_QUESTIONS = [
  "What primary textile products or fabrics do you manufacture or sell?",
  "Could you describe your typical minimum order quantity (MOQ) and production capacity?",
  "What are your target markets or specific industry certifications (e.g. GOTS, OEKO-TEX)?",
];

const EXAMPLES_PER_STEP = [
  ["Cotton Fabric", "Denim", "Silk Sarees", "Polyester Blends", "Yarn"],
  ["MOQ: 100 meters", "MOQ: 5,000 yards", "No MOQ", "Large scale production only"],
  ["OEKO-TEX Certified", "GOTS Organic", "ISO 9001", "Export quality"],
];

const PLACEHOLDERS_PER_STEP = [
  "e.g. We manufacture 100% Cotton and Denim fabrics...",
  "e.g. MOQ is 500 meters per color...",
  "e.g. We hold OEKO-TEX Standard 100 certification...",
];

const SupplierOnboardingPage = () => {
  const { user, isAuthenticated, isLoading, refreshUser } = useAuth();
  const navigate = useNavigate();

  const [messages, setMessages] = useState([]);
  const [history, setHistory] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [loadingAi, setLoadingAi] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const [summary, setSummary] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const bottomRef = useRef(null);
  const initialFetchedRef = useRef(false);

  useEffect(() => {
    if (isLoading) return;
    // Disabled authentication check
    // if (!isAuthenticated) return navigate("/login", { replace: true });
    // if (user?.onboardingCompleted) return navigate("/supplier", { replace: true });

    if (!initialFetchedRef.current) {
      initialFetchedRef.current = true;
      fetchNextQuestion([]);
    }
  }, [isLoading, isAuthenticated, user]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const fetchNextQuestion = async (hist) => {
    setLoadingAi(true);
    try {
      const { data } = await api.post("/ai/onboarding-next", { role: "supplier", history: hist });

      if (data.done && hist.length >= 3) {
        setIsDone(true);
        setSummary(data.summary);
        setMessages((prev) => [
          ...prev,
          { from: "bot", text: `Perfect! 🎉 ${data.summary || "I've captured your supplier profile."} Click below to launch your dashboard!` },
        ]);
      } else if (data.question && !data.done) {
        setMessages((prev) => [...prev, { from: "bot", text: data.question }]);
      } else {
        useFallback(hist);
      }
    } catch {
      useFallback(hist);
    } finally {
      setLoadingAi(false);
    }
  };

  const useFallback = (hist) => {
    const idx = hist.length;
    if (idx < FALLBACK_QUESTIONS.length) {
      setMessages((prev) => [...prev, { from: "bot", text: FALLBACK_QUESTIONS[idx] }]);
    } else {
      setIsDone(true);
      setMessages((prev) => [
        ...prev,
        { from: "bot", text: "Perfect! 🎉 I've captured your profile. Click below to launch your dashboard!" },
      ]);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!inputValue.trim() || loadingAi) return;
    sendResponse(inputValue.trim());
  };

  const sendResponse = (userAns) => {
    const lastBotMsg = [...messages].reverse().find((m) => m.from === "bot")?.text || "Question";

    const updatedHistory = [...history, { question: lastBotMsg, answer: userAns }];
    setHistory(updatedHistory);
    setMessages((prev) => [...prev, { from: "user", text: userAns }]);
    setInputValue("");

    fetchNextQuestion(updatedHistory);
  };

  const handleSave = async () => {
    setIsSubmitting(true);
    try {
      await updateProfileRequest({
        profile: {
          businessType: history[0]?.answer || "Textile Supplier",
          productCategories: [history[0]?.answer].filter(Boolean),
          fabricTypes: [history[1]?.answer, history[2]?.answer].filter(Boolean),
        },
        completeOnboarding: true,
      });
      await refreshUser();
      // Force navigation to supplier dashboard
      setTimeout(() => {
        navigate("/supplier", { replace: true });
      }, 100);
    } catch (err) {
      console.error("Error saving profile:", err);
      setIsSubmitting(false);
    }
  };

  const currentStep = Math.min(history.length, 3);
  const currentExamples = EXAMPLES_PER_STEP[currentStep] || [];
  const currentPlaceholder = PLACEHOLDERS_PER_STEP[currentStep] || "Type your response...";

  return (
    <div className="flex min-h-[calc(100vh-60px)] flex-col bg-slate-950 text-white">
      <div className="bg-slate-900 border-b border-slate-800 px-4 py-4 sm:px-6">
        <div className="mx-auto max-w-2xl flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold text-gradient">Smart Conversational AI Onboarding</h1>
            <p className="text-xs text-slate-400">Powered by Groq AI — Tailored dynamically to your supplier profile</p>
          </div>
          <span className="px-3 py-1 bg-brand-500/20 text-brand-400 rounded-full text-xs font-semibold">Live AI</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-6">
        <div className="mx-auto max-w-2xl space-y-4">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex items-end gap-2.5 animate-fade-in-up ${
                msg.from === "bot" ? "justify-start" : "justify-end"
              }`}
            >
              {msg.from === "bot" && (
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-brand-400 to-accent-500 text-sm flex-shrink-0">
                  🤖
                </div>
              )}
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 leading-relaxed shadow-sm ${
                  msg.from === "bot"
                    ? "rounded-bl-none bg-slate-800 text-slate-200 border border-slate-700"
                    : "rounded-br-none bg-brand-600 text-white"
                }`}
              >
                {msg.text}
              </div>
            </div>
          ))}

          {loadingAi && (
            <div className="flex items-end gap-2.5 animate-fade-in-up justify-start">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-brand-400 to-accent-500 text-sm flex-shrink-0">
                🤖
              </div>
              <div className="rounded-2xl rounded-bl-none bg-slate-800 px-4 py-3 text-slate-400 border border-slate-700 text-sm flex gap-1 items-center">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-500 animate-bounce" style={{ animationDelay: "0ms" }}></span>
                <span className="w-1.5 h-1.5 rounded-full bg-slate-500 animate-bounce" style={{ animationDelay: "150ms" }}></span>
                <span className="w-1.5 h-1.5 rounded-full bg-slate-500 animate-bounce" style={{ animationDelay: "300ms" }}></span>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      </div>

      <div className="bg-slate-900 border-t border-slate-800 px-4 py-4 sm:px-6 shadow-[0_-10px_40px_rgba(0,0,0,0.2)]">
        <div className="mx-auto max-w-2xl">
          {!isDone && currentExamples.length > 0 && (
            <div className="mb-3 flex flex-wrap gap-2">
              {currentExamples.map((ex) => (
                <button
                  key={ex}
                  type="button"
                  onClick={() => setInputValue(ex)}
                  className="rounded-full border border-slate-700 bg-slate-800 px-3 py-1 text-xs font-medium text-slate-300 hover:bg-brand-500/20 hover:text-brand-300 hover:border-brand-500/30 transition animate-fade-in-up"
                >
                  {ex}
                </button>
              ))}
            </div>
          )}

          {!isDone ? (
            <form onSubmit={handleSubmit} className="flex gap-2 relative">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={currentPlaceholder}
                disabled={loadingAi}
                className="w-full rounded-full border border-slate-700 bg-slate-950 px-5 py-3.5 pr-12 text-sm text-white focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 disabled:opacity-50 transition"
              />
              <button
                type="submit"
                disabled={loadingAi || !inputValue.trim()}
                className="absolute right-2 top-2 bottom-2 flex aspect-square items-center justify-center rounded-full bg-brand-600 text-white hover:bg-brand-500 disabled:opacity-40 transition shadow-glow-sm"
              >
                ↑
              </button>
            </form>
          ) : (
            <button
              onClick={handleSave}
              disabled={isSubmitting}
              className="w-full rounded-full bg-gradient-to-r from-brand-500 to-accent-500 py-3.5 font-bold text-white shadow-glow hover:opacity-90 transition disabled:opacity-50 flex justify-center items-center gap-2 text-lg"
            >
              {isSubmitting ? "Saving Profile..." : "Launch Supplier Dashboard 🚀"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default SupplierOnboardingPage;
