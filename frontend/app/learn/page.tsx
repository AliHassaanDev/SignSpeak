"use client";

import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  BookOpen,
  Hand,
  Sparkles,
  CheckCircle2,
  Volume2,
  GraduationCap,
  Layers,
  HelpCircle,
  Eye,
  Info,
  ChevronRight,
} from "lucide-react";
import TutorChat from "../../components/learn/TutorChat";
import { CURRICULUM_LEVELS, type TutorLevel } from "../../types/tutor";

export default function LearnPage() {
  const [level, setLevel] = useState<TutorLevel>(1);
  const [glossTokens, setGlossTokens] = useState<string[]>([]);
  const [selectedTokenIndex, setSelectedTokenIndex] = useState(0);
  const [handDescription, setHandDescription] = useState("");
  const [imageError, setImageError] = useState(false);

  const handleTokensReceived = useCallback((tokens: string[], description: string) => {
    setGlossTokens(tokens);
    setSelectedTokenIndex(0);
    setImageError(false);
    setHandDescription(description);
  }, []);

  // When level changes, reset token selection
  useEffect(() => {
    setSelectedTokenIndex(0);
    setImageError(false);
  }, [level]);

  const currentLevel = CURRICULUM_LEVELS.find((l) => l.id === level)!;

  // Active token calculation: user selected or first received token or level default
  const defaultLevelToken = level === 1 ? "LETTER_A" : level === 2 ? "HOSPITAL" : level === 3 ? "WATER" : "THANK_YOU";
  const activeToken = glossTokens[selectedTokenIndex] || glossTokens[0] || defaultLevelToken;

  const speakText = (txt: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window) || !txt) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(txt);
    utterance.rate = 1.0;
    window.speechSynthesis.speak(utterance);
  };

  return (
    <main className="learn-shell">
      {/* Top Bar Header */}
      <header className="learn-topbar">
        <Link href="/" className="learn-back-btn" title="Back to Translator Studio">
          <ArrowLeft size={17} />
          <span className="back-btn-text">Translator</span>
        </Link>

        <div className="learn-brand">
          <div className="learn-brand-logo-mark">
            <GraduationCap size={20} />
          </div>
          <div className="learn-brand-text">
            <span className="learn-brand-main">SignSpeak <strong>Academy</strong></span>
            <span className="learn-brand-sub">Pakistani Sign Language (PSL) Tutor</span>
          </div>
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
          </div>
          <TutorChat level={level} onTokensReceived={handleTokensReceived} />
        </div>

        {/* Right Column: Visual Sign Spotlight, Instructions & Topics */}
        <div className="learn-pane learn-pane-right">
          {/* 1. Visual Sign Spotlight Card */}
          <div className="learn-card visual-spotlight-card">
            <div className="learn-card-header">
              <div className="card-header-title-group">
                <Eye size={15} className="header-icon-teal" />
                <span className="card-header-title">Sign Visual Spotlight</span>
              </div>
              <button
                type="button"
                className="speak-mini-btn"
                onClick={() => speakText(activeToken.replace(/LETTER_/g, "Letter ").replace(/_/g, " "))}
                title="Pronounce sign name"
              >
                <Volume2 size={13} />
                <span>Audio</span>
              </button>
            </div>

            {/* If multiple signs or letters were taught, show chip picker */}
            {glossTokens.length > 1 && (
              <div className="sign-tokens-selector-row">
                <span className="tokens-selector-label">Active Lesson Signs:</span>
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
                    <Hand size={34} color="#8b5cf6" />
                  </div>
                  <div className="fallback-token-name">{activeToken.replace(/_/g, " ")}</div>
                  <span className="fallback-hint">Gesture guidance below</span>
                </div>
              )}

              <div className="spotlight-bottom-meta">
                <div className="meta-sign-badge">
                  <Sparkles size={13} color="#10b981" />
                  <span>{activeToken.replace(/^LETTER_/, "Alphabet ").replace(/_/g, " ")}</span>
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
              <span className="hts-badge">GESTURE GUIDANCE</span>
            </div>
            <div className="hts-body-content">
              <p className="hts-body">
                {handDescription ||
                  (level === 1
                    ? "Form the letter handshape steadily facing frontward towards your conversation partner at chest level."
                    : "Follow the AI Tutor's real-time instructions in the chat on the left for exact hand orientation and movement.")}
              </p>
            </div>
          </div>

          {/* 3. Level Topics & Curriculum Checklist */}
          <div className="learn-card topics-card">
            <div className="learn-card-header">
              <div className="card-header-title-group">
                <Layers size={15} className="header-icon-blue" />
                <span className="card-header-title">Level {level} Curriculum Topics</span>
              </div>
              <span className="topics-count-badge">{currentLevel.topics.length} Key Skills</span>
            </div>
            <ul className="topics-checklist">
              {currentLevel.topics.map((topic, i) => (
                <li key={i} className="topic-check-item">
                  <CheckCircle2 size={16} className="check-icon-active" />
                  <span className="topic-text">{topic}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* 4. Practical PSL Pro-Tip */}
          <div className="learn-card learn-tip-card">
            <div className="learn-card-header">
              <div className="card-header-title-group">
                <Sparkles size={15} className="header-icon-amber" />
                <span className="card-header-title amber-title">PSL Pro-Tip</span>
              </div>
              <span className="tip-tag">TIP</span>
            </div>
            <p className="learn-tip-body">
              <strong>Non-Manual Markers Matter:</strong> In Pakistani Sign Language (PSL), eyebrows and head tilts indicate questions vs. statements. Hold each sign steadily for ~1 to 2 seconds for clear communication.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
