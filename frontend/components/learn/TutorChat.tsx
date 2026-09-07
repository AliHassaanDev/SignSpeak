"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Send, Loader2, GraduationCap, RotateCcw, Sparkles, User, Check, Copy } from "lucide-react";
import type {
  ChatMessage,
  TutorLevel,
  TutorChatResponse,
} from "../../types/tutor";

interface TutorChatProps {
  level: TutorLevel;
  onTokensReceived: (tokens: string[], description: string) => void;
}

let msgCounter = 0;
const uid = () => `msg-${++msgCounter}-${Date.now()}`;

export default function TutorChat({ level, onTokensReceived }: TutorChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const historyRef = useRef<{ role: "user" | "model"; parts: { text: string }[] }[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const loadingRef = useRef(false);
  const lastSeedLevel = useRef<TutorLevel | null>(null);

  /* Keep a stable reference to the latest callback */
  const onTokensReceivedRef = useRef(onTokensReceived);
  onTokensReceivedRef.current = onTokensReceived;

  /* Auto-scroll when new messages arrive */
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  /* ── Send a message to the Gemini tutor ── */
  const sendToGemini = useCallback(
    async (text: string, isSeed: boolean) => {
      /* Prevent concurrent requests */
      if (loadingRef.current) return;
      loadingRef.current = true;
      setLoading(true);

      /* Add user message to UI (skip for seed — no visible user bubble) */
      if (!isSeed) {
        const userMsg: ChatMessage = { id: uid(), role: "user", text, timestamp: Date.now() };
        setMessages((prev) => [...prev, userMsg]);
      }

      /* ALWAYS push user message to history so Gemini gets a valid conversation
         (Gemini requires conversations to start with role "user") */
      historyRef.current.push({ role: "user", parts: [{ text }] });

      try {
        const res = await fetch("/api/tutor", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: text,
            level,
            history: historyRef.current,
          }),
        });

        if (!res.ok) {
          const errBody = await res.text().catch(() => "");
          throw new Error(`${res.status}: ${errBody.substring(0, 120)}`);
        }

        const data: TutorChatResponse = await res.json();

        const tutorMsg: ChatMessage = {
          id: uid(),
          role: "tutor",
          text: data.tutor_reply,
          glossTokens: data.gloss_tokens,
          handDescription: data.hand_description,
          quizOptions: data.quiz_options,
          timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, tutorMsg]);
        historyRef.current.push({ role: "model", parts: [{ text: data.tutor_reply }] });

        if (data.gloss_tokens?.length) {
          onTokensReceivedRef.current(data.gloss_tokens, data.hand_description);
        }
      } catch (err: unknown) {
        const errMsg = err instanceof Error ? err.message : "Unknown error";
        console.error("[TutorChat] Send error:", errMsg);
        const errMsg2: ChatMessage = {
          id: uid(),
          role: "tutor",
          text: `Sorry, something went wrong: ${errMsg}. Please try again.`,
          timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, errMsg2]);
      } finally {
        loadingRef.current = false;
        setLoading(false);
      }
    },
    [level],
  );

  /* ── Seed welcome message when level changes ── */
  useEffect(() => {
    if (lastSeedLevel.current === level) return;
    lastSeedLevel.current = level;

    historyRef.current = [];
    setMessages([]);
    setInput("");

    sendToGemini(
      `Start Level ${level} lesson. Greet me warmly and introduce the very first concept and sign for this level.`,
      true,
    );
  }, [level]);

  useEffect(() => {
    return () => {
      lastSeedLevel.current = null;
    };
  }, [level]);

  const restartLesson = () => {
    if (loadingRef.current) return;
    historyRef.current = [];
    setMessages([]);
    setInput("");
    sendToGemini(
      `Start Level ${level} lesson. Greet me warmly and introduce the very first concept and sign for this level.`,
      true,
    );
  };

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed || loadingRef.current) return;
    setInput("");
    sendToGemini(trimmed, false);
  };

  const handleQuizOption = (option: string) => {
    if (loadingRef.current) return;
    sendToGemini(option, false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const copyMessage = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const lastTutorMsg = [...messages].reverse().find((m) => m.role === "tutor");

  const quickPrompts = [
    { label: "Quiz me 🎯", prompt: "Quiz me on what we just learned!" },
    { label: "Repeat slowly 🔁", prompt: "Can you repeat the sign and explain the exact hand motion slowly?" },
    { label: "Example sentence 💬", prompt: "Can you show me an example sentence using this sign?" },
    { label: "Next topic ➡️", prompt: "I understand! Let's move to the next concept or sign." },
  ];

  return (
    <div className="tutor-chat-container">
      {/* Top Header Bar */}
      <div className="tutor-chat-header">
        <div className="tutor-header-title-group">
          <div className="tutor-badge-icon">
            <GraduationCap size={16} />
          </div>
          <div>
            <div className="tutor-main-name">PSL AI Tutor (استاد)</div>
            <div className="tutor-status-row">
              <span className="tutor-status-dot" />
              <span className="tutor-status-text">Interactive Lesson Active</span>
            </div>
          </div>
        </div>

        <div className="tutor-header-actions">
          <span className="tutor-level-badge">Level {level}</span>
          <button
            type="button"
            className="tutor-restart-btn"
            onClick={restartLesson}
            disabled={loading}
            title="Restart this level's lesson"
          >
            <RotateCcw size={12} />
            <span>Restart</span>
          </button>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="tutor-messages" ref={scrollRef}>
        {messages.map((msg) => (
          <div key={msg.id} className={`tutor-msg ${msg.role}`}>
            <div className="msg-avatar">
              {msg.role === "tutor" ? (
                <div className="tutor-avatar-icon">
                  <Sparkles size={14} />
                </div>
              ) : (
                <div className="user-avatar-icon">
                  <User size={14} />
                </div>
              )}
            </div>

            <div className="msg-body">
              <div className="msg-bubble-wrap">
                <div className="msg-text">{msg.text}</div>
                {msg.role === "tutor" && (
                  <button
                    type="button"
                    className="msg-copy-btn"
                    onClick={() => copyMessage(msg.id, msg.text)}
                    title="Copy message"
                  >
                    {copiedId === msg.id ? <Check size={11} color="#10b981" /> : <Copy size={11} />}
                  </button>
                )}
              </div>

              {msg.handDescription && (
                <div className="msg-hand-desc">
                  <span className="hand-icon-label">✋ How to sign:</span>
                  <span>{msg.handDescription}</span>
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="tutor-msg tutor">
            <div className="msg-avatar">
              <div className="tutor-avatar-icon">
                <Sparkles size={14} />
              </div>
            </div>
            <div className="msg-body">
              <div className="msg-typing-wave">
                <span className="typing-dot" />
                <span className="typing-dot" />
                <span className="typing-dot" />
                <span className="typing-label">Tutor is typing...</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Interactive Quiz Option Buttons (when active) */}
      {lastTutorMsg?.quizOptions && lastTutorMsg.quizOptions.length > 0 && !loading && (
        <div className="tutor-quiz-options-dock">
          <div className="quiz-options-label">Select your answer:</div>
          <div className="quiz-options-grid">
            {lastTutorMsg.quizOptions.map((opt, i) => (
              <button
                key={i}
                type="button"
                className="quiz-option-btn"
                onClick={() => handleQuizOption(opt)}
                disabled={loading}
              >
                <span className="quiz-opt-letter">{String.fromCharCode(65 + i)}</span>
                <span className="quiz-opt-text">{opt}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Quick Prompts Strip */}
      <div className="tutor-quick-prompts-bar">
        {quickPrompts.map((q, idx) => (
          <button
            key={idx}
            type="button"
            className="tutor-quick-chip"
            onClick={() => sendToGemini(q.prompt, false)}
            disabled={loading}
          >
            {q.label}
          </button>
        ))}
      </div>

      {/* Input Dock */}
      <div className="tutor-input-bar">
        <textarea
          className="tutor-input"
          placeholder="Ask in Urdu, Roman Urdu, or English (e.g., How do I sign 'Salam'? / اگلا لفظ سکھائیں)"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={1}
          disabled={loading}
        />
        <button
          type="button"
          className="tutor-send-btn"
          onClick={handleSend}
          disabled={loading || !input.trim()}
          title="Send message to tutor (Enter)"
        >
          {loading ? <Loader2 size={16} className="spin" /> : <Send size={16} />}
        </button>
      </div>
    </div>
  );
}
