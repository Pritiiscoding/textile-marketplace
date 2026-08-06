import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { chatRequest, semanticSearchRequest } from "../api/aiApi";
import { useAuth } from "../context/AuthContext";

// ─── Voice helpers ────────────────────────────────────────────────────────────
const SpeechRecognition =
  window.SpeechRecognition || window.webkitSpeechRecognition || null;

function speak(text) {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utt = new SpeechSynthesisUtterance(text);
  utt.rate = 1.05;
  utt.pitch = 1;
  window.speechSynthesis.speak(utt);
}

function stopSpeaking() {
  window.speechSynthesis?.cancel();
}

// ─── Component ────────────────────────────────────────────────────────────────
const AIChatWidget = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [open, setOpen] = useState(false);

  const [messages, setMessages] = useState([]);

  // Update initial message based on user role
  useEffect(() => {
    if (user) {
      const initialMessage = user.role === "supplier" 
        ? "Hi! I'm your textile business assistant. I can help with inventory management, pricing strategies, production planning, and market insights. What would you like to optimize today?"
        : "Hi! I'm your textile assistant. Ask me anything about fabrics, products, or your order.";
      
      setMessages([{ from: "bot", text: initialMessage }]);
    }
  }, [user]);

  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [searchResults, setSearchResults] = useState([]);

  const bottomRef = useRef(null);
  const recRef = useRef(null);
  // Scroll to bottom on new messages
  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  const addMessage = useCallback((from, text) => {
    setMessages((prev) => [...prev, { from, text }]);
  }, []);

  const send = useCallback(
    async (text) => {
      const trimmed = text?.trim();
      if (!trimmed || isLoading) return;
      addMessage("user", trimmed);
      setInput("");
      setIsLoading(true);
      setSearchResults([]);

      try {
        let products = [];
        
        // Check if the query is a general question (not a product search)
        const generalQuestions = [
          "return policy", "delivery", "shipping", "payment", "help", "how", "what", "when", "where", "why",
          "price negotiation", "recommendations", "support", "contact", "about", "account", "login", "register"
        ];
        
        const isGeneralQuestion = generalQuestions.some(q => trimmed.toLowerCase().includes(q));
        
        // Only search for products if it's not a general question
        if (!isGeneralQuestion) {
          try {
            const searchRes = await semanticSearchRequest(trimmed);
            products = searchRes.data.results?.slice(0, 4) || [];
          } catch (searchError) {
            console.error("Search error:", searchError);
            // ignore search error
          }
        }

        const chatRes = await chatRequest(trimmed, products);
        const reply = chatRes.data.reply || "I'm here to help with your textile sourcing needs!";

        addMessage("bot", reply);
        if (voiceEnabled) speak(reply);
        if (products.length > 0) setSearchResults(products);
      } catch (chatError) {
        console.error("Chat error:", chatError);
        console.error("Chat error response:", chatError.response);
        console.error("Chat error data:", chatError.response?.data);
        
        // Use fallback reply based on error
        let fallback = "I'm here to help with your textile sourcing needs! Please try asking about fabrics, products, or orders.";
        
        // If it's a server error, use a more specific message
        if (chatError.response?.status === 500) {
          fallback = "I'm having trouble connecting right now. Please try again in a moment.";
        } else if (chatError.response?.status === 401) {
          fallback = "Please log in to use the chat feature.";
        }
        
        addMessage("bot", fallback);
        if (voiceEnabled) speak(fallback);
      } finally {
        setIsLoading(false);
      }
    },
    [isLoading, voiceEnabled]
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    send(input);
  };

  const startListening = () => {
    if (!SpeechRecognition) {
      addMessage("bot", "Sorry, your browser doesn't support voice input.");
      return;
    }
    const rec = new SpeechRecognition();
    rec.lang = "en-US";
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    rec.onstart = () => setIsListening(true);
    rec.onresult = (e) => {
      const transcript = e.results[0][0].transcript;
      setInput(transcript);
      send(transcript);
    };
    rec.onerror = () => {
      setIsListening(false);
      addMessage("bot", "I didn't catch that — could you try again?");
    };
    rec.onend = () => setIsListening(false);
    rec.start();
    recRef.current = rec;
  };

  const stopListening = () => {
    recRef.current?.stop();
    setIsListening(false);
  };

  const toggleOpen = () => {
    setOpen((o) => !o);
    if (open) stopSpeaking();
  };

  // Hide widget on onboarding pages to prevent UI overlap with form buttons
  if (location.pathname.includes("/onboarding")) return null;
  if (!user) return null;

  return (
    <>
      {/* Floating button */}
      <button
        onClick={toggleOpen}
        aria-label="Open AI assistant"
        className="fixed bottom-6 right-6 z-50 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-accent-600 text-white shadow-2xl hover:shadow-3xl hover:scale-110 focus:outline-none focus:ring-4 focus:ring-brand-500/50 transition-all duration-300"
        style={{ boxShadow: '0 8px 30px rgba(59, 108, 247, 0.5)' }}
      >
        {open ? (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-7 w-7">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-7 w-7">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
        )}
      </button>

      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-24 right-6 z-50 flex w-80 flex-col rounded-2xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl sm:w-96 text-surface-900 dark:text-white overflow-hidden transition-all" style={{ boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)' }}>
          {/* Header */}
          <div className="flex items-center justify-between bg-gradient-to-r from-slate-900 to-brand-900 dark:from-slate-950 dark:to-slate-900 px-4 py-4 border-b border-slate-800">
            <div>
              <p className="font-bold text-white text-lg">Textile AI Assistant</p>
              <p className="text-xs text-slate-400 flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
                Smart B2B Fabric Recommendations
              </p>
            </div>
            <button
              onClick={() => setVoiceEnabled((v) => !v)}
              title={voiceEnabled ? "Mute voice output" : "Enable voice output"}
              className={`rounded-full p-2 text-sm transition-all duration-200 hover:scale-110 ${
                voiceEnabled ? "bg-brand-500 text-white shadow-lg" : "text-slate-400 hover:text-white hover:bg-slate-800"
              }`}
            >
              🔊
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 space-y-3 overflow-y-auto p-4" style={{ maxHeight: 320 }}>
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.from === "bot" ? "justify-start" : "justify-end"}`}>
                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed ${
                    msg.from === "bot"
                      ? "bg-brand-50 dark:bg-slate-800 text-brand-900 dark:text-slate-200 border border-brand-100 dark:border-slate-700"
                      : "bg-brand-600 text-white shadow-sm"
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="rounded-2xl bg-brand-50 dark:bg-slate-800 px-3.5 py-2 text-sm text-brand-500 dark:text-brand-400 border border-brand-100 dark:border-slate-700">
                  Thinking…
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Search results chips */}
          {searchResults.length > 0 && (
            <div className="border-t border-gray-100 dark:border-slate-800 px-3 py-2 bg-surface-50/50 dark:bg-slate-900/50">
              <p className="mb-1.5 text-xs font-medium text-surface-700 dark:text-slate-400">Related products</p>
              <div className="flex flex-wrap gap-1.5">
                {searchResults.map((p) => (
                  <Link
                    key={p._id}
                    to={user.role === "supplier" ? `/supplier/inventory` : `/buyer/products/${p._id}`}
                    className="rounded-full border border-brand-200 dark:border-slate-700 bg-brand-50 dark:bg-slate-800 px-2.5 py-1 text-xs text-brand-700 dark:text-brand-300 hover:bg-brand-100 dark:hover:bg-slate-700 transition"
                  >
                    {p.name}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Default quick prompts - shown when chat is idle */}
          {searchResults.length === 0 && messages.length <= 1 && (
            <div className="border-t border-gray-100 dark:border-slate-800 px-3 py-2 bg-surface-50/50 dark:bg-slate-900/50">
              <p className="mb-1.5 text-xs font-medium text-surface-700 dark:text-slate-400">
                {user.role === "supplier" ? "Supplier quick actions:" : "Suggested questions:"}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {user.role === "supplier" ? (
                  <>
                    <button
                      onClick={() => send("How can I optimize my inventory?")}
                      className="rounded-full border border-brand-200 dark:border-slate-700 bg-brand-50 dark:bg-slate-800 px-2.5 py-1 text-xs text-brand-700 dark:text-brand-300 hover:bg-brand-100 dark:hover:bg-slate-700 transition"
                    >
                      Inventory tips
                    </button>
                    <button
                      onClick={() => send("What's the best pricing strategy?")}
                      className="rounded-full border border-brand-200 dark:border-slate-700 bg-brand-50 dark:bg-slate-800 px-2.5 py-1 text-xs text-brand-700 dark:text-brand-300 hover:bg-brand-100 dark:hover:bg-slate-700 transition"
                    >
                      Pricing help
                    </button>
                    <button
                      onClick={() => send("How do I improve production efficiency?")}
                      className="rounded-full border border-brand-200 dark:border-slate-700 bg-brand-50 dark:bg-slate-800 px-2.5 py-1 text-xs text-brand-700 dark:text-brand-300 hover:bg-brand-100 dark:hover:bg-slate-700 transition"
                    >
                      Production
                    </button>
                    <button
                      onClick={() => send("What are current market trends?")}
                      className="rounded-full border border-brand-200 dark:border-slate-700 bg-brand-50 dark:bg-slate-800 px-2.5 py-1 text-xs text-brand-700 dark:text-brand-300 hover:bg-brand-100 dark:hover:bg-slate-700 transition"
                    >
                      Market trends
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => send("Find similar products")}
                      className="rounded-full border border-brand-200 dark:border-slate-700 bg-brand-50 dark:bg-slate-800 px-2.5 py-1 text-xs text-brand-700 dark:text-brand-300 hover:bg-brand-100 dark:hover:bg-slate-700 transition"
                    >
                      Find similar products
                    </button>
                    <button
                      onClick={() => send("Check product availability")}
                      className="rounded-full border border-brand-200 dark:border-slate-700 bg-brand-50 dark:bg-slate-800 px-2.5 py-1 text-xs text-brand-700 dark:text-brand-300 hover:bg-brand-100 dark:hover:bg-slate-700 transition"
                    >
                      Check availability
                    </button>
                    <button
                      onClick={() => send("Compare products")}
                      className="rounded-full border border-brand-200 dark:border-slate-700 bg-brand-50 dark:bg-slate-800 px-2.5 py-1 text-xs text-brand-700 dark:text-brand-300 hover:bg-brand-100 dark:hover:bg-slate-700 transition"
                    >
                      Compare products
                    </button>
                    <button
                      onClick={() => send("Delivery information")}
                      className="rounded-full border border-brand-200 dark:border-slate-700 bg-brand-50 dark:bg-slate-800 px-2.5 py-1 text-xs text-brand-700 dark:text-brand-300 hover:bg-brand-100 dark:hover:bg-slate-700 transition"
                    >
                      Delivery info
                    </button>
                    <button
                      onClick={() => send("Return policy")}
                      className="rounded-full border border-brand-200 dark:border-slate-700 bg-brand-50 dark:bg-slate-800 px-2.5 py-1 text-xs text-brand-700 dark:text-brand-300 hover:bg-brand-100 dark:hover:bg-slate-700 transition"
                    >
                      Return policy
                    </button>
                    <button
                      onClick={() => send("Price negotiation help")}
                      className="rounded-full border border-brand-200 dark:border-slate-700 bg-brand-50 dark:bg-slate-800 px-2.5 py-1 text-xs text-brand-700 dark:text-brand-300 hover:bg-brand-100 dark:hover:bg-slate-700 transition"
                    >
                      Price negotiation
                    </button>
                    <button
                      onClick={() => send("Product recommendations")}
                      className="rounded-full border border-brand-200 dark:border-slate-700 bg-brand-50 dark:bg-slate-800 px-2.5 py-1 text-xs text-brand-700 dark:text-brand-300 hover:bg-brand-100 dark:hover:bg-slate-700 transition"
                    >
                      Recommendations
                    </button>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Input */}
          <form onSubmit={handleSubmit} className="border-t border-gray-200 dark:border-slate-800 p-3">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={user.role === "supplier" ? "Ask about inventory, pricing, production..." : "Ask about fabrics, products..."}
                className="flex-1 rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
              <button
                type="button"
                onClick={isListening ? stopListening : startListening}
                className={`rounded-lg p-2 text-sm transition ${
                  isListening
                    ? "bg-red-500 text-white animate-pulse"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                }`}
                title="Voice input"
              >
                🎤
              </button>
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50 transition"
              >
                Send
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
};

export default AIChatWidget;
