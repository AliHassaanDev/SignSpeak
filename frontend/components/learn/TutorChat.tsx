"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  Send,
  Loader2,
  GraduationCap,
  RotateCcw,
  Sparkles,
  User,
  Check,
  Copy,
  Flame,
  Brain,
  Trash2,
  CheckCircle2,
  HelpCircle,
} from "lucide-react";
import type {
  ChatMessage,
  TutorLevel,
  TutorChatResponse,
  StudentMemory,
} from "../../types/tutor";
import {
  loadLevelChatMessages,
  saveLevelChatMessages,
  recordLearnedSigns,
  recordQuizAttempt,
  recordDiscussedTopic,
  resetAllTutorMemory,
} from "../../app/lib/tutorMemory";

interface TutorChatProps {
  level: TutorLevel;
  memory: StudentMemory;
  onTokensReceived: (tokens: string[], description: string) => void;
  onMemoryUpdated: (updatedMemory: StudentMemory) => void;
}

let msgCounter = 0;
const uid = () => `msg-${++msgCounter}-${Date.now()}`;

export default function TutorChat({
  level,
  memory,
  onTokensReceived,
  onMemoryUpdated,
}: TutorChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedQuizOpt, setSelectedQuizOpt] = useState<string | null>(null);

  const historyRef = useRef<{ role: "user" | "model"; parts: { text: string }[] }[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const loadingRef = useRef(false);
  const currentLevelRef = useRef<TutorLevel>(level);
  currentLevelRef.current = level;

  /* Keep stable references to callbacks and memory */
  const onTokensReceivedRef = useRef(onTokensReceived);
  onTokensReceivedRef.current = onTokensReceived;

  const onMemoryUpdatedRef = useRef(onMemoryUpdated);
  onMemoryUpdatedRef.current = onMemoryUpdated;

  const memoryRef = useRef(memory);
  memoryRef.current = memory;

  /* Auto-scroll when new messages arrive */
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  /* ── Send a message to the Gemini tutor ── */
  const sendToGemini = useCallback(
    async (text: string, isSeed: boolean, initialHistory?: typeof historyRef.current) => {
      if (loadingRef.current) return;
      loadingRef.current = true;
      setLoading(true);

      const targetHistory = initialHistory ? [...initialHistory] : [...historyRef.current];

      /* Add user message to UI (skip for seed — no visible user bubble) */
      if (!isSeed) {
        const userMsg: ChatMessage = { id: uid(), role: "user", text, timestamp: Date.now() };
        setMessages((prev) => {
          const updated = [...prev, userMsg];
          saveLevelChatMessages(currentLevelRef.current, updated);
          return updated;
        });
      }

      /* Push user message to history so Gemini gets conversation context */
      targetHistory.push({ role: "user", parts: [{ text }] });
      historyRef.current = targetHistory;

      try {
        const res = await fetch("/api/tutor", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: text,
            level: currentLevelRef.current,
            history: targetHistory,
            memory: memoryRef.current,
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

        setMessages((prev) => {
          const updated = [...prev, tutorMsg];
          saveLevelChatMessages(currentLevelRef.current, updated);
          return updated;
        });

        historyRef.current.push({ role: "model", parts: [{ text: data.tutor_reply }] });

        /* Update tokens on spotlight */
        if (data.gloss_tokens?.length) {
          onTokensReceivedRef.current(data.gloss_tokens, data.hand_description);
          // Record learned sign in student memory
          let mem = recordLearnedSigns(data.gloss_tokens, currentLevelRef.current, memoryRef.current);
          if (data.detected_topic) {
            mem = recordDiscussedTopic(data.detected_topic, mem);
          }
          onMemoryUpdatedRef.current(mem);
        } else if (data.detected_topic) {
          const mem = recordDiscussedTopic(data.detected_topic, memoryRef.current);
          onMemoryUpdatedRef.current(mem);
        }

        /* Update quiz result in memory if detected */
        if (typeof data.is_quiz_correct === "boolean") {
          const mem = recordQuizAttempt(data.is_quiz_correct, memoryRef.current);
          onMemoryUpdatedRef.current(mem);
        }

        setSelectedQuizOpt(null);
      } catch (err: unknown) {
        const errMsg = err instanceof Error ? err.message : "Unknown error";
        console.error("[TutorChat] Send error:", errMsg);
        const errMsg2: ChatMessage = {
          id: uid(),
          role: "tutor",
          text: `⚠️ **Tutor Note:** ${errMsg}. Let's try again in a moment!`,
          timestamp: Date.now(),
        };
        setMessages((prev) => {
          const updated = [...prev, errMsg2];
          saveLevelChatMessages(currentLevelRef.current, updated);
          return updated;
        });
      } finally {
        loadingRef.current = false;
        setLoading(false);
      }
    },
    [],
  );

  /* ── Level Changed: Load Persisted History or Seed First Message ── */
  useEffect(() => {
    const savedMessages = loadLevelChatMessages(level);

    if (savedMessages && savedMessages.length > 0) {
      // Restore persisted messages for this level!
      setMessages(savedMessages);

      // Reconstruct conversation history for Gemini
      const reconstructed: { role: "user" | "model"; parts: { text: string }[] }[] = [];
      for (const m of savedMessages) {
        reconstructed.push({
          role: m.role === "tutor" ? "model" : "user",
          parts: [{ text: m.text }],
        });
      }
      historyRef.current = reconstructed;

      // Update spotlight with the most recent sign taught in this level
      const lastWithSign = [...savedMessages].reverse().find((m) => m.glossTokens && m.glossTokens.length > 0);
      if (lastWithSign && lastWithSign.glossTokens) {
        onTokensReceivedRef.current(lastWithSign.glossTokens, lastWithSign.handDescription || "");
      }
    } else {
      // First time visiting this level: seed initial welcome message with student memory
      historyRef.current = [];
      setMessages([]);
      setInput("");

      const masteredList = (memoryRef.current.learnedSigns || []).map((s) => s.gloss).join(", ");
      const seedPrompt = masteredList
        ? `Start Level ${level} lesson. You remember me (I already mastered ${masteredList}). Greet me warmly, acknowledge my progress, and introduce the next sign or concept for Level ${level}.`
        : `Start Level ${level} lesson. Greet me warmly and introduce the very first concept and sign for this level.`;

      sendToGemini(seedPrompt, true, []);
    }
  }, [level, sendToGemini]);

  /* ── Restart Current Level Lesson ── */
  const restartLevelLesson = () => {
    if (loadingRef.current) return;
    historyRef.current = [];
    setMessages([]);
    setInput("");
    saveLevelChatMessages(level, []);

    const masteredList = (memoryRef.current.learnedSigns || []).map((s) => s.gloss).join(", ");
    const seedPrompt = masteredList
      ? `Restart Level ${level} lesson. You remember me (mastered signs: ${masteredList}). Introduce the first sign for Level ${level} step-by-step.`
      : `Start Level ${level} lesson. Greet me warmly and introduce the very first concept and sign for this level.`;

    sendToGemini(seedPrompt, true, []);
  };

  /* ── Full Reset of All Memory ── */
  const handleFullReset = () => {
    if (window.confirm("Are you sure you want to reset all tutor memory, chat histories, and mastered signs? This will start a fresh learning profile.")) {
      resetAllTutorMemory();
      window.location.reload();
    }
  };

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed || loadingRef.current) return;
    setInput("");
    sendToGemini(trimmed, false);
  };

  const handleQuizOption = (option: string) => {
    if (loadingRef.current) return;
    setSelectedQuizOpt(option);
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
    { label: "Do you remember me? 🧠", prompt: "Do you remember what signs and topics we have already learned and discussed so far?" },
    { label: "Review past signs 🔁", prompt: "Can we review the signs and topics we previously covered?" },
    { label: "اردو میں سمجھائیں 🇵🇰", prompt: "براہ کرم مجھے یہ تصور اردو میں آسان انداز میں سمجھائیں۔" },
    { label: "Example sentence 💬", prompt: "Can you show me an example sentence using this sign?" },
    { label: "Next concept ➡️", prompt: "I understand! Let's move to the next concept or sign." },
  ];

  const accuracy =
    memory.quizStats.totalQuestions > 0
      ? Math.round((memory.quizStats.correctAnswers / memory.quizStats.totalQuestions) * 100)
      : 100;

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
              <span className="tutor-status-text">
                Level {level} Active • {messages.length} messages saved
              </span>
            </div>
          </div>
        </div>

        <div className="tutor-header-actions">
          {/* Memory Active Indicator */}
          <div
            className="tutor-memory-indicator"
            title={`Memory Active: Tutor remembers ${memory.learnedSigns.length} mastered signs, ${memory.discussedTopics.length} discussed topics, and your quiz streak.`}
          >
            <Brain size={12} className="brain-pulse" />
            <span>Memory Active</span>
          </div>

          <button
            type="button"
            className="tutor-restart-btn"
            onClick={restartLevelLesson}
            disabled={loading}
            title="Restart this level's lesson conversation"
          >
            <RotateCcw size={12} />
            <span>Restart Level</span>
          </button>

          <button
            type="button"
            className="tutor-clear-btn"
            onClick={handleFullReset}
            title="Reset student memory and start fresh"
          >
            <Trash2 size={12} />
          </button>
        </div>
      </div>

      {/* Student Memory & Progress Ribbon */}
      <div className="tutor-memory-ribbon">
        <div className="ribbon-stat-item">
          <span className="ribbon-icon">🎓</span>
          <span className="ribbon-label">Mastered:</span>
          <span className="ribbon-value">{memory.learnedSigns.length} signs</span>
        </div>
        <div className="ribbon-divider" />
        <div className="ribbon-stat-item">
          <Flame size={13} color="#f97316" className="flame-animate" />
          <span className="ribbon-label">Streak:</span>
          <span className="ribbon-value">{memory.quizStats.currentStreak} 🔥</span>
        </div>
        <div className="ribbon-divider" />
        <div className="ribbon-stat-item">
          <span className="ribbon-icon">🎯</span>
          <span className="ribbon-label">Quiz Accuracy:</span>
          <span className="ribbon-value">
            {memory.quizStats.totalQuestions > 0 ? `${accuracy}% (${memory.quizStats.correctAnswers}/${memory.quizStats.totalQuestions})` : "Ready"}
          </span>
        </div>
        {memory.learnedSigns.length > 0 && (
          <div className="ribbon-recent-signs">
            <span className="recent-signs-label">Recent:</span>
            {memory.learnedSigns.slice(-3).map((s, idx) => (
              <span key={idx} className="recent-sign-chip" title={`Learned in Level ${s.level}`}>
                {s.label}
              </span>
            ))}
          </div>
        )}
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
                  <span className="hand-icon-label">✋ How to execute this sign:</span>
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
                <span className="typing-label">Tutor is recalling memory and typing...</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Interactive Quiz Option Buttons (when active) */}
      {lastTutorMsg?.quizOptions && lastTutorMsg.quizOptions.length > 0 && !loading && (
        <div className="tutor-quiz-options-dock">
          <div className="quiz-options-header">
            <HelpCircle size={14} color="#7c3aed" />
            <span className="quiz-options-label">Knowledge Check — Select Your Answer:</span>
          </div>
          <div className="quiz-options-grid">
            {lastTutorMsg.quizOptions.map((opt, i) => (
              <button
                key={i}
                type="button"
                className={`quiz-option-btn ${selectedQuizOpt === opt ? "selected" : ""}`}
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
          placeholder="Ask in Urdu, Roman Urdu, or English (e.g., 'How do I sign Salam?' or 'اگلا لفظ سکھائیں')"
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
