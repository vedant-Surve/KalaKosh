import React, { useState, useRef, useEffect } from "react";
import client from "../api/client";
import { useAuth } from "../context/AuthContext";

/* ── Pratyaksha avatar SVG ───────────────────────────────────────────── */
const PratyakshaAvatar = ({ size = 40 }) => (
  <svg width={size} height={size} viewBox="0 0 40 40" fill="none" aria-hidden="true">
    <circle cx="20" cy="20" r="20" fill="url(#pGrad)" />
    <defs>
      <radialGradient id="pGrad" cx="40%" cy="35%" r="65%">
        <stop offset="0%" stopColor="#c0522b" />
        <stop offset="100%" stopColor="#1E2958" />
      </radialGradient>
    </defs>
    {/* Stylised Warli figure */}
    <circle cx="20" cy="13" r="3.5" fill="rgba(253,246,227,0.95)" />
    <line x1="20" y1="16.5" x2="20" y2="27" stroke="rgba(253,246,227,0.9)" strokeWidth="1.8" />
    <line x1="14" y1="21" x2="26" y2="21" stroke="rgba(253,246,227,0.9)" strokeWidth="1.8" />
    <line x1="20" y1="27" x2="14" y2="33" stroke="rgba(253,246,227,0.9)" strokeWidth="1.8" />
    <line x1="20" y1="27" x2="26" y2="33" stroke="rgba(253,246,227,0.9)" strokeWidth="1.8" />
  </svg>
);

/* ── Typing indicator ────────────────────────────────────────────────── */
const TypingIndicator = () => (
  <div className="flex items-center gap-1.5 px-4 py-3 rounded-2xl rounded-tl-sm w-fit bg-earth-100 shadow-sm">
    <span className="typing-dot" />
    <span className="typing-dot" />
    <span className="typing-dot" />
  </div>
);

/* ── Message bubble ──────────────────────────────────────────────────── */
function MessageBubble({ msg }) {
  const isUser = msg.role === "user";
  return (
    <div className={`flex gap-2.5 ${isUser ? "flex-row-reverse" : "flex-row"} items-end`}>
      {!isUser && (
        <div className="flex-shrink-0 shadow-sm rounded-full">
          <PratyakshaAvatar size={28} />
        </div>
      )}
      <div
        className={`max-w-[82%] px-4 py-3 text-xs sm:text-sm leading-relaxed ${
          isUser
            ? "bg-gradient-to-r from-terracotta to-terracotta-dark text-white rounded-2xl rounded-br-xs shadow-md"
            : "bg-white text-earth-900 border border-earth-900/10 rounded-2xl rounded-bl-xs shadow-sm"
        }`}
        style={{
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
        }}
      >
        {msg.content}
      </div>
    </div>
  );
}

/* ── Suggested prompts ───────────────────────────────────────────────── */
const SUGGESTIONS = [
  "What symbols are common in Warli art?",
  "Tell me about Madhubani painting traditions",
  "What is the significance of the sacred tree in tribal art?",
  "Explain Gond art from Madhya Pradesh",
];

/* ══════════════════════════════════════════════════════════════════════
   PratyakshaChat — floating cultural AI assistant
══════════════════════════════════════════════════════════════════════ */
export default function PratyakshaChat() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "Namaste! 🙏 I am Pratyaksha, your guide through the living archive of India's indigenous art and oral heritage.\n\nAsk me about Warli motifs, Madhubani cosmology, tribal folklore, or any masterwork in our collection.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  /* Scroll to bottom whenever messages change */
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  /* Focus input when panel opens */
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 120);
  }, [open]);

  const send = async (text) => {
    const message = text ?? input.trim();
    if (!message) return;
    setInput("");
    setError("");

    const userMsg = { role: "user", content: message };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    const history = messages
      .filter((m) => m.role === "user" || m.role === "assistant")
      .slice(-18)
      .map(({ role, content }) => ({ role, content }));

    try {
      const { data } = await client.post("/chat", { message, history });
      setMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);
    } catch (err) {
      const detail = err.message || "Something went wrong.";
      setError(detail);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "I seem to have lost my train of thought. Please try again in a moment. 🙏",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  /* Listen for global open event dispatched from anywhere */
  useEffect(() => {
    const handler = (e) => {
      setOpen(true);
      if (e.detail?.prompt) {
        setTimeout(() => {
          send(e.detail.prompt);
        }, 300);
      }
    };
    document.addEventListener("open-pratyaksha", handler);
    return () => document.removeEventListener("open-pratyaksha", handler);
  }, [messages]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <>
      {/* ── Floating Launcher Button ─────────────────────── */}
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Open Pratyaksha chatbot"
        className={`fixed bottom-6 right-6 z-[9000] w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 hover:scale-105 border-2 ${
          open
            ? "bg-earth-900 border-white/30 rotate-45"
            : "bg-gradient-to-br from-terracotta via-terracotta-dark to-indigo-900 border-amber-accent/50 rotate-0 pulse-glow"
        }`}
      >
        {open ? (
          <svg width="22" height="22" viewBox="0 0 20 20" fill="white">
            <line x1="4" y1="4" x2="16" y2="16" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="16" y1="4" x2="4" y2="16" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
        ) : (
          <PratyakshaAvatar size={40} />
        )}

        {/* Live status dot */}
        {!open && (
          <span className="absolute top-1 right-1 w-3.5 h-3.5 rounded-full bg-amber-400 border-2 border-white shadow" />
        )}
      </button>

      {/* ── Chat Panel Modal ─────────────────────────────── */}
      {open && (
        <div className="slide-in fixed bottom-24 right-4 sm:right-6 z-[8999] w-[calc(100vw-32px)] sm:w-[420px] h-[560px] max-h-[calc(100vh-120px)] flex flex-col bg-parchment rounded-3xl overflow-hidden shadow-2xl border border-earth-900/15">
          {/* Header */}
          <div className="bg-gradient-to-r from-earth-900 via-indigo-950 to-earth-900 px-5 py-4 flex items-center justify-between text-white flex-shrink-0">
            <div className="flex items-center gap-3">
              <PratyakshaAvatar size={38} />
              <div>
                <p className="font-serif font-bold text-base text-white leading-tight">
                  Pratyaksha
                </p>
                <p className="text-[10px] uppercase font-bold tracking-widest text-amber-300/80">
                  Cultural AI Guide
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/10 text-[10px] font-semibold text-emerald-300">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Live
              </span>
              <button
                onClick={() => setOpen(false)}
                className="text-white/60 hover:text-white p-1 rounded-lg text-sm"
                aria-label="Close chat"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Not logged in warning banner */}
          {!user && (
            <div className="bg-amber-500/15 border-b border-amber-500/30 px-4 py-2 text-[11px] font-semibold text-amber-900 flex items-center justify-between flex-shrink-0">
              <span>🔒 Log in to have deep conversation with Pratyaksha.</span>
              <a href="/login" className="underline font-bold text-terracotta">Log in</a>
            </div>
          )}

          {/* Messages Scroll Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 scrollbar-thin">
            {messages.map((msg, i) => (
              <MessageBubble key={i} msg={msg} />
            ))}
            {loading && (
              <div className="flex gap-2 items-end">
                <PratyakshaAvatar size={26} />
                <TypingIndicator />
              </div>
            )}
            {error && (
              <p className="text-[11px] text-red-700 text-center font-medium bg-red-50 p-2 rounded-xl">
                {error}
              </p>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Quick suggestions when initial */}
          {messages.length === 1 && !loading && (
            <div className="p-3 bg-white/60 border-t border-earth-900/5 flex flex-wrap gap-1.5 flex-shrink-0">
              {SUGGESTIONS.map((s, i) => (
                <button
                  key={i}
                  onClick={() => (user ? send(s) : null)}
                  disabled={!user}
                  className="text-left text-[11px] bg-white hover:bg-earth-100 text-earth-800 px-3 py-1.5 rounded-full border border-earth-900/10 shadow-xs transition-all disabled:opacity-50"
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Input Box */}
          <div className="p-3 bg-white border-t border-earth-900/10 flex items-end gap-2 flex-shrink-0">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={!user || loading}
              placeholder={user ? "Ask about Indian art traditions & motifs…" : "Please log in to chat..."}
              rows={1}
              className="flex-1 resize-none input-cultural py-2 px-3 text-xs sm:text-sm max-h-24 rounded-xl disabled:bg-earth-100"
            />
            <button
              onClick={() => send()}
              disabled={!user || loading || !input.trim()}
              className="w-10 h-10 rounded-xl bg-terracotta hover:bg-terracotta-dark text-white flex items-center justify-center shadow-md transition-colors disabled:opacity-40 flex-shrink-0"
              aria-label="Send message"
            >
              {loading ? (
                <span className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} />
              ) : (
                <svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                </svg>
              )}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
