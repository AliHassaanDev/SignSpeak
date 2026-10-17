"use client";

import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Hand,
  Sparkles,
  CheckCircle2,
  Circle,
  Volume2,
  GraduationCap,
  Layers,
  Eye,
  ExternalLink,
  Flame,
  Brain,
  BookmarkCheck,
  RotateCcw,
} from "lucide-react";
import TutorChat from "../../components/learn/TutorChat";
import { CURRICULUM_LEVELS, type TutorLevel, type StudentMemory } from "../../types/tutor";
import { loadStudentMemory, DEFAULT_STUDENT_MEMORY } from "../lib/tutorMemory";

const TOKEN_URDU_MAP: Record<string, { urdu: string; english: string }> = {
  HELLO: { urdu: "سلام / السلام علیکم", english: "Hello / Greetings" },
  THANK_YOU: { urdu: "شکریہ", english: "Thank You" },
  HOW_ARE_YOU: { urdu: "آپ کیسے ہیں؟", english: "How are you?" },
  MY_NAME: { urdu: "میرا نام", english: "My Name" },
  WATER: { urdu: "پانی", english: "Water" },
  EAT: { urdu: "کھانا", english: "Eat / Food" },
  PAKISTAN: { urdu: "پاکستان", english: "Pakistan" },
  GO: { urdu: "جانا", english: "Go" },
  WHERE: { urdu: "کہاں", english: "Where" },
  YOU: { urdu: "آپ / تم", english: "You" },
  WELCOME: { urdu: "خوش آمدید", english: "Welcome" },
  HOSPITAL: { urdu: "ہسپتال", english: "Hospital" },
  DOCTOR: { urdu: "ڈاکٹر", english: "Doctor" },
  GOODBYE: { urdu: "اللہ حافظ", english: "Goodbye" },
  YES: { urdu: "ہاں / جی ہاں", english: "Yes" },
  NO: { urdu: "نہیں", english: "No" },
  FRIEND: { urdu: "دوست", english: "Friend" },
  SCHOOL: { urdu: "سکول / مدرسہ", english: "School" },
  PLEASE_HELP: { urdu: "برائے مہربانی مدد کریں", english: "Please Help" },
  SORRY: { urdu: "معاف کیجیے", english: "Sorry" },
  PLEASE: { urdu: "براہ کرم", english: "Please" },
  LETTER_A: { urdu: "حرف الف (A)", english: "Letter A (Alif)" },
  LETTER_B: { urdu: "حرف بے (B)", english: "Letter B (Bay)" },
  LETTER_C: { urdu: "حرف سے (C)", english: "Letter C" },
  LETTER_D: { urdu: "حرف دال (D)", english: "Letter D (Daal)" },
  LETTER_E: { urdu: "حرف عین (E)", english: "Letter E" },
  LETTER_F: { urdu: "حرف فے (F)", english: "Letter F (Fay)" },
  LETTER_G: { urdu: "حرف گاف (G)", english: "Letter G (Gaaf)" },
  LETTER_H: { urdu: "حرف ہے (H)", english: "Letter H (Hay)" },
  LETTER_I: { urdu: "حرف چھوٹی یہ (I)", english: "Letter I" },
  LETTER_J: { urdu: "حرف جیم (J)", english: "Letter J (Jeem)" },
  LETTER_K: { urdu: "حرف کاف (K)", english: "Letter K (Kaaf)" },
  LETTER_L: { urdu: "حرف لام (L)", english: "Letter L (Laam)" },
  LETTER_M: { urdu: "حرف میم (M)", english: "Letter M (Meem)" },
  LETTER_N: { urdu: "حرف نون (N)", english: "Letter N (Noon)" },
  LETTER_O: { urdu: "حرف واؤ (O)", english: "Letter O" },
  LETTER_P: { urdu: "حرف پے (P)", english: "Letter P (Pay)" },
  LETTER_Q: { urdu: "حرف قاف (Q)", english: "Letter Q (Qaaf)" },
  LETTER_R: { urdu: "حرف رے (R)", english: "Letter R (Ray)" },
  LETTER_S: { urdu: "حرف سین (S)", english: "Letter S (Seen)" },
  LETTER_T: { urdu: "حرف تے (T)", english: "Letter T (Tay)" },
  LETTER_U: { urdu: "حرف پیش (U)", english: "Letter U" },
  LETTER_V: { urdu: "حرف واؤ (V)", english: "Letter V" },
  LETTER_W: { urdu: "حرف واؤ (W)", english: "Letter W" },
  LETTER_X: { urdu: "حرف ایکس (X)", english: "Letter X" },
  LETTER_Y: { urdu: "حرف بڑی یہ (Y)", english: "Letter Y" },
  LETTER_Z: { urdu: "حرف زے (Z)", english: "Letter Z (Zay)" },
};

export default function LearnPage() {
  const [level, setLevel] = useState<TutorLevel>(1);
  const [glossTokens, setGlossTokens] = useState<string[]>([]);
  const [selectedTokenIndex, setSelectedTokenIndex] = useState(0);
  const [handDescription, setHandDescription] = useState("");
  const [imageError, setImageError] = useState(false);
  const [memory, setMemory] = useState<StudentMemory>(DEFAULT_STUDENT_MEMORY);

  // Load persistent student memory on client mount
  useEffect(() => {
    setMemory(loadStudentMemory());
  }, []);

  const handleTokensReceived = useCallback((tokens: string[], description: string) => {
    setGlossTokens(tokens);
    setSelectedTokenIndex(0);
    setImageError(false);
    setHandDescription(description);
  }, []);

  const handleMemoryUpdated = useCallback((updatedMemory: StudentMemory) => {
    setMemory({ ...updatedMemory });
  }, []);

  // When level changes, reset token selection
  useEffect(() => {
    setSelectedTokenIndex(0);
    setImageError(false);
  }, [level]);

  const currentLevel = CURRICULUM_LEVELS.find((l) => l.id === level)!;

  // Active token calculation: user selected or first received token or level default
  const defaultLevelToken =
    level === 1 ? "LETTER_A" : level === 2 ? "HOSPITAL" : level === 3 ? "WATER" : "THANK_YOU";
  const activeToken = glossTokens[selectedTokenIndex] || glossTokens[0] || defaultLevelToken;

  const tokenMeta = TOKEN_URDU_MAP[activeToken] || {
    urdu: activeToken.replace(/_/g, " "),
    english: activeToken.replace(/^LETTER_/, "Letter ").replace(/_/g, " "),
  };

  const speakText = (txt: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window) || !txt) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(txt);
    utterance.rate = 1.0;
    window.speechSynthesis.speak(utterance);
  };

  // Check if topic in curriculum is discussed in student memory
  const isTopicCovered = (topicName: string) => {
    const t = topicName.toLowerCase();
    return memory.discussedTopics.some((d) => {
      const dl = d.toLowerCase();
      return dl.includes(t) || t.includes(dl) || (t.includes("greeting") && dl.includes("salam"));
    });
  };

  return (
    <main className="learn-shell">
      {/* Top Bar Header */}
      <header className="learn-topbar">
        <Link href="/" className="learn-back-btn" title="Back to Translator Studio">
          <ArrowLeft size={16} />
          <span className="back-btn-text">Translator Studio</span>
        </Link>

        <div className="learn-brand">
          <div className="learn-brand-logo-mark">
            <GraduationCap size={20} />
          </div>
          <div className="learn-brand-text">
            <span className="learn-brand-main">
              SignSpeak <strong>Academy</strong>
            </span>
            <span className="learn-brand-sub">PSL AI Tutor with Memory (استاد)</span>
          </div>
        </div>

        {/* Global Student Stats Badge */}
        <div className="learn-header-stats">
          <span className="header-stat-chip" title="Total signs you've mastered across all sessions">
            <BookmarkCheck size={13} color="#10b981" />
            <span>{memory.learnedSigns.length} Mastered</span>
          </span>
          <span className="header-stat-chip" title="Current quiz streak">
            <Flame size={13} color="#f97316" />
            <span>{memory.quizStats.currentStreak} Streak</span>
          </span>
        </div>

        {/* Level Selector Tabs */}
        <div className="learn-level-tabs">
          {CURRICULUM_LEVELS.map((lv) => (
            <button
              key={lv.id}
              className={`level-tab ${lv.id === level ? "active" : ""}`}
              onClick={() => {
                setLevel(lv.id);
                setGlossTokens([]);
                setHandDescription("");
              }}
              title={lv.subtitle}
            >
              <span className="level-num">{lv.id}</span>
              <span className="level-label-group">
                <span className="level-title-short">Level {lv.id}</span>
                <span className="level-name-sub">{lv.title}</span>
              </span>
            </button>
          ))}
        </div>
      </header>

      {/* Split-Screen Studio Body */}
      <div className="learn-body">
        {/* Left Column: Interactive Chat with Gemini AI Tutor */}
        <div className="learn-pane learn-pane-left">
          <div className="level-info-strip">
            <div className="level-info-left">
              <span className="level-badge-pill">Curriculum Level {level}</span>
              <h2 className="level-info-title">{currentLevel.title}</h2>
              <span className="level-info-sub">{currentLevel.subtitle}</span>
            </div>
            <div className="level-info-right">
              <span className="memory-status-tag" title="Tutor remembers your history and past discussions">
                <Brain size={12} />
                <span>Context Retained</span>
              </span>
            </div>
          </div>

          <TutorChat
            level={level}
            memory={memory}
            onTokensReceived={handleTokensReceived}
            onMemoryUpdated={handleMemoryUpdated}
          />
        </div>

        {/* Right Column: Visual Sign Spotlight, Instructions, Mastered Shelf & Topics */}
        <div className="learn-pane learn-pane-right">
          {/* 1. Visual Sign Spotlight Card */}
          <div className="learn-card visual-spotlight-card">
            <div className="learn-card-header">
              <div className="card-header-title-group">
                <Eye size={15} className="header-icon-teal" />
                <span className="card-header-title">Sign Visual Spotlight</span>
              </div>
              <div className="card-header-actions">
                <button
                  type="button"
                  className="speak-mini-btn"
                  onClick={() => speakText(`${tokenMeta.english}. ${tokenMeta.urdu}`)}
                  title="Pronounce sign name"
                >
                  <Volume2 size={13} />
                  <span>Pronounce</span>
                </button>
                <Link
                  href={`/?input=${encodeURIComponent(tokenMeta.urdu)}&mode=urdu-to-psl`}
                  className="studio-link-btn"
                  title="Open this gesture in the interactive 3D Avatar Translator"
                >
                  <ExternalLink size={12} />
                  <span>3D Studio</span>
                </Link>
              </div>
            </div>

            {/* If multiple signs or letters were taught, show chip picker */}
            {glossTokens.length > 1 && (
              <div className="sign-tokens-selector-row">
                <span className="tokens-selector-label">Lesson Gesture Sequence:</span>
                <div className="tokens-chips-scroll">
                  {glossTokens.map((tok, idx) => (
                    <button
                      key={`${tok}-${idx}`}
                      type="button"
                      className={`token-selector-chip ${idx === selectedTokenIndex ? "active" : ""}`}
                      onClick={() => {
                        setSelectedTokenIndex(idx);
                        setImageError(false);
                      }}
                    >
                      <span className="chip-idx">#{idx + 1}</span>
                      <span className="chip-name">{tok.replace(/^LETTER_/, "Letter ")}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Sign Image Preview Canvas */}
            <div className="spotlight-image-stage">
              {!imageError ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={`/videos/glosses/${activeToken}.png`}
                  alt={`Pakistani Sign Language Gesture: ${activeToken}`}
                  className="spotlight-sign-img"
                  onError={() => setImageError(true)}
                />
              ) : (
                <div className="spotlight-fallback">
                  <div className="fallback-icon-ring">
                    <Hand size={36} color="#8b5cf6" />
                  </div>
                  <div className="fallback-token-name">{tokenMeta.english}</div>
                  <span className="fallback-hint">Sign representation loaded</span>
                </div>
              )}

              <div className="spotlight-bottom-meta">
                <div className="meta-sign-badge">
                  <Sparkles size={13} color="#10b981" />
                  <span className="badge-en">{tokenMeta.english}</span>
                  <span className="badge-separator">•</span>
                  <span className="badge-ur">{tokenMeta.urdu}</span>
                </div>
              </div>
            </div>
          </div>

          {/* 2. "How to Sign" Posture & Motion Instructions */}
          <div className="learn-card how-to-sign-card">
            <div className="learn-card-header">
              <div className="card-header-title-group">
                <Hand size={15} className="header-icon-violet" />
                <span className="card-header-title">How to Execute This Sign</span>
              </div>
              <button
                type="button"
                className="speak-mini-btn"
                onClick={() => speakText(handDescription)}
                disabled={!handDescription}
                title="Listen to gesture instructions"
              >
                <Volume2 size={12} />
                <span>Listen</span>
              </button>
            </div>
            <div className="hts-body-content">
              <p className="hts-body">
                {handDescription ||
                  (level === 1
                    ? "Form the letter handshape steadily facing frontward towards your conversation partner at chest level with fingers articulated clearly."
                    : "Follow the AI Tutor's real-time instructions in the chat on the left for exact hand orientation and kinetic movement.")}
              </p>
            </div>
          </div>

          {/* 3. Mastered Signs Shelf (Persistent Student Library) */}
          <div className="learn-card mastered-shelf-card">
            <div className="learn-card-header">
              <div className="card-header-title-group">
                <BookmarkCheck size={15} className="header-icon-emerald" />
                <span className="card-header-title">Mastered Signs Library</span>
              </div>
              <span className="shelf-count-badge">
                {memory.learnedSigns.length} {memory.learnedSigns.length === 1 ? "Sign" : "Signs"}
              </span>
            </div>

            {memory.learnedSigns.length > 0 ? (
              <div className="mastered-chips-grid">
                {memory.learnedSigns.map((sign, idx) => (
                  <button
                    key={`${sign.gloss}-${idx}`}
                    type="button"
                    className={`mastered-sign-btn ${activeToken === sign.gloss ? "active" : ""}`}
                    onClick={() => {
                      setGlossTokens([sign.gloss]);
                      setSelectedTokenIndex(0);
                      setImageError(false);
                    }}
                    title={`Click to view ${sign.label} in spotlight (Level ${sign.level})`}
                  >
                    <span className="ms-icon">✋</span>
                    <span className="ms-label">{sign.label}</span>
                    <span className="ms-lvl">L{sign.level}</span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="mastered-empty-state">
                <p className="empty-text">
                  Signs you practice with the AI Tutor will be automatically remembered here in your personal library.
                </p>
              </div>
            )}
          </div>

          {/* 4. Level Topics & Curriculum Checklist */}
          <div className="learn-card topics-card">
            <div className="learn-card-header">
              <div className="card-header-title-group">
                <Layers size={15} className="header-icon-blue" />
                <span className="card-header-title">Level {level} Curriculum Topics</span>
              </div>
              <span className="topics-count-badge">{currentLevel.topics.length} Key Skills</span>
            </div>
            <ul className="topics-checklist">
              {currentLevel.topics.map((topic, i) => {
                const covered = isTopicCovered(topic);
                return (
                  <li key={i} className={`topic-check-item ${covered ? "covered" : ""}`}>
                    {covered ? (
                      <CheckCircle2 size={16} className="check-icon-active" />
                    ) : (
                      <Circle size={16} className="check-icon-pending" />
                    )}
                    <span className="topic-text">{topic}</span>
                    {covered && <span className="topic-covered-tag">Discussed</span>}
                  </li>
                );
              })}
            </ul>
          </div>

          {/* 5. Practical PSL Pro-Tip */}
          <div className="learn-card learn-tip-card">
            <div className="learn-card-header">
              <div className="card-header-title-group">
                <Sparkles size={15} className="header-icon-amber" />
                <span className="card-header-title amber-title">PSL Pro-Tip & Etiquette</span>
              </div>
              <span className="tip-tag">TIP</span>
            </div>
            <p className="learn-tip-body">
              <strong>Non-Manual Markers Matter:</strong> In Pakistani Sign Language (PSL), eyebrows, head tilts, and mouth shapes are essential grammatical markers that differentiate questions from statements. Maintain direct eye contact with the signer’s face, not their hands!
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
