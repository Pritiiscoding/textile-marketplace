import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { updateProfileRequest } from "../../api/userApi";
import api from "../../api/axios";

// Reliable fallback questions used when Groq is unavailable or returns bad JSON
const FALLBACK_QUESTIONS = [
  "What types of fabrics or textile products do you regularly source?",
  "What is your estimated monthly order volume or budget range?",
  "What is your preferred lead time — quick delivery or planned production cycles?",
  "Are there any specific quality certifications or sustainable fabric standards you require?",
];

const EXAMPLES_PER_STEP = [
  ["Cotton & Linen", "Denim & Twill", "Silk & Satin", "Polyester Blends", "Bedsheet & Towel Fabrics"],
  ["500 - 1,000 meters/month", "5,000+ yards/month", "₹50,000 - ₹2,00,000/month", "Small trial batches (100m)"],
  ["Immediate ready stock (7 days)", "2 - 4 weeks lead time", "Planned quarterly cycles"],
  ["OEKO-TEX Standard 100", "GOTS Organic Certified", "ISO 9001 Quality Standard", "No special certification needed"]
];

const PLACEHOLDERS_PER_STEP = [
  "e.g. 100% Cotton, Denim, Linen, Silk Sarees...",
  "e.g. 500 meters per month, or ₹1,00,000 monthly budget...",
  "e.g. 2-3 weeks, or immediate ready stock...",
  "e.g. OEKO-TEX, GOTS Organic, or standard commercial grade..."
];

const BuyerOnboardingPage = () => {
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
    // if (user?.onboardingCompleted) return navigate("/buyer", { replace: true });

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
      const { data } = await api.post("/ai/onboarding-next", { role: "buyer", history: hist });

      // Guard: if Groq says "done" too early (< 3 answers), treat as a question
      if (data.done && hist.length >= 3) {
        setIsDone(true);
        setSummary(data.summary);
        setMessages((prev) => [
          ...prev,
          { from: "bot", text: `Perfect! 🎉 ${data.summary || "I've captured your textile sourcing preferences."} Click below to launch your personalized marketplace!` },
        ]);
      } else if (data.question && !data.done) {
        setMessages((prev) => [...prev, { from: "bot", text: data.question }]);
      } else {
        // Groq returned done too early or empty question — use fallback
        useFallback(hist);
      }
    } catch {
      // Network error or Groq failure — use local fallback so conversation never stops
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
      // All fallback questions exhausted — wrap up
      setIsDone(true);
      setMessages((prev) => [
        ...prev,
        { from: "bot", text: "Perfect! 🎉 I've captured your sourcing preferences. Click below to launch your personalized marketplace!" },
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
          industry: history[0]?.answer || "Textile Sourcing",
          productCategories: [history[0]?.answer, history[1]?.answer].filter(Boolean),
        },
        completeOnboarding: true,
      });
      await refreshUser();
      // Force navigation to buyer marketplace
      setTimeout(() => {
        navigate("/buyer", { replace: true });
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
      {/* Dynamic Header */}
      <div className="bg-slate-900 border-b border-slate-800 px-4 py-4 sm:px-6">
        <div className="mx-auto max-w-2xl flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold text-gradient">Smart Conversational AI Onboarding</h1>
            <p className="text-xs text-slate-400">Powered by Groq AI — Tailored dynamically to your answers</p>
          </div>
          <span className="px-3 py-1 bg-brand-500/20 text-brand-400 rounded-full text-xs font-semibold">Live AI</span>
        </div>
      </div>

      {/* Chat Messages */}
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
                className={`max-w-[78%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  msg.from === "bot"
                    ? "bg-slate-900 text-slate-100 border border-slate-800 shadow-lg"
                    : "bg-brand-600 text-white shadow-glow-sm"
                }`}
              >
                {msg.text}
              </div>
            </div>
          ))}
          {loadingAi && (
            <div className="flex items-center gap-2 text-xs text-brand-400">
              <span className="animate-spin">🌀</span> Groq AI thinking next question...
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* Input / Complete Action */}
      <div className="border-t border-slate-800 bg-slate-900 px-4 py-4 sm:px-6">
        <div className="mx-auto max-w-2xl space-y-3">
          {!isDone && (
            <>
              {/* Quick Example Response Chips */}
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] font-semibold text-slate-400 mr-1">Suggested examples:</span>
                {currentExamples.map((ex) => (
                  <button
                    key={ex}
                    type="button"
                    disabled={loadingAi}
                    onClick={() => sendResponse(ex)}
                    className="rounded-full bg-slate-800 hover:bg-brand-600 hover:text-white border border-slate-700 text-slate-300 text-xs px-3 py-1 transition disabled:opacity-50"
                  >
                    + {ex}
                  </button>
                ))}
              </div>

              <form onSubmit={handleSubmit} className="flex gap-2">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder={currentPlaceholder}
                  className="flex-1 rounded-xl bg-slate-800 border border-slate-700 px-4 py-2.5 text-sm text-white focus:outline-none focus:border-brand-500"
                />
                <button
                  type="submit"
                  disabled={!inputValue.trim() || loadingAi}
                  className="btn-primary rounded-xl px-5 disabled:opacity-50 font-bold"
                >
                  Send
                </button>
              </form>
            </>
          )}

          {isDone && (
            <button
              onClick={handleSave}
              disabled={isSubmitting}
              className="btn-primary w-full py-3.5 rounded-xl font-bold text-base shadow-glow-sm"
            >
              {isSubmitting ? "Finalizing Profile..." : "🚀 Launch My Custom Marketplace"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default BuyerOnboardingPage;

