"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Volume2,
  VolumeX,
  Copy,
  Check,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  RotateCw,
  RotateCcw,
  Trash2,
  History,
} from "lucide-react";
import { useLanguage } from "../app/context/LanguageContext";

export interface PredictionToken {
  id: string;
  urdu: string;
  english: string;
  gloss: string;
  confidence: number;
  type: "word" | "alphabet";
  source?: string;
  start_time?: number;
  end_time?: number;
}

export interface SilentUserIntent {
  urduSentence: string;
  englishSentence: string;
  intentSummary: string;
  tone: string;
  modelUsed?: string;
}

export type UserIntent = SilentUserIntent;

export interface TranscriptPanelProps {
  tokenBuffer: PredictionToken[];
  currentDetection: PredictionToken | null;
  externalIntent?: SilentUserIntent | null;
  onUndoLast: () => void;
  onClearAll: () => void;
}

export default function TranscriptPanel({
  tokenBuffer,
  currentDetection,
  externalIntent,
  onUndoLast,
  onClearAll,
}: TranscriptPanelProps) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [copied, setCopied] = useState(false);
  const { t, isUrdu } = useLanguage();

  // Intent states
  const [intent, setIntent] = useState<SilentUserIntent | null>(externalIntent || null);
  const [history, setHistory] = useState<SilentUserIntent[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  // Audio reference for speaking the intended sentence
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Sync externalIntent if provided directly from video processing, or clear when empty
  useEffect(() => {
    if (externalIntent) {
      setIntent(externalIntent);
      setHistory(prev => {
        if (prev.length > 0 && prev[prev.length - 1].urduSentence === externalIntent.urduSentence) return prev;
        return [...prev, externalIntent];
      });
    } else {
      setIntent(null);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        audioRef.current = null;
      }
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
      setIsSpeaking(false);
      setCopied(false);
    }
  }, [externalIntent]);

  // When tokenBuffer and currentDetection are also cleared, ensure intent and speech/copy are reset
  useEffect(() => {
    if (!externalIntent && tokenBuffer.length === 0 && !currentDetection) {
      setIntent(null);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        audioRef.current = null;
      }
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
      setIsSpeaking(false);
      setCopied(false);
    }
  }, [externalIntent, tokenBuffer, currentDetection]);

  // Determine active token for Block 1 (Recent Detected Word)
  const hasBuffer = tokenBuffer.length > 0;
  const activeToken = currentDetection || (hasBuffer ? tokenBuffer[tokenBuffer.length - 1] : null);
  const isConfident = activeToken ? activeToken.confidence >= 0.70 : false;

  // Display pills for Block 2 (List of Detected Words)
  const displayPills: PredictionToken[] = hasBuffer
    ? tokenBuffer
    : (currentDetection ? [currentDetection] : []);

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);



  // Speech feature: speaks the user intended sentence ONLY
  const speakIntendedSentence = () => {
    const textToSpeak = (intent?.urduSentence || (displayPills.length > 0 ? displayPills.map(t => t.urdu).join(" ") : "")).trim();
    if (!textToSpeak) return;

    // Toggle off if already speaking
    if (isSpeaking) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        audioRef.current = null;
      }
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
      setIsSpeaking(false);
      return;
    }

    const isUrdu = /[\u0600-\u06FF]/.test(textToSpeak);
    const lang = isUrdu ? "ur" : "en";

    try {
      const audio = new Audio(`/api/tts?text=${encodeURIComponent(textToSpeak)}&lang=${lang}`);
      audioRef.current = audio;
      setIsSpeaking(true);

      audio.onended = () => {
        setIsSpeaking(false);
        audioRef.current = null;
      };

      audio.onerror = () => {
        // Fallback to browser SpeechSynthesis
        if (typeof window !== "undefined" && "speechSynthesis" in window) {
          const utterance = new SpeechSynthesisUtterance(textToSpeak);
          utterance.lang = isUrdu ? "ur-PK" : "en-US";
          utterance.onend = () => {
            setIsSpeaking(false);
            audioRef.current = null;
          };
          utterance.onerror = () => {
            setIsSpeaking(false);
            audioRef.current = null;
          };
          window.speechSynthesis.speak(utterance);
        } else {
          setIsSpeaking(false);
          audioRef.current = null;
        }
      };

      audio.play().catch(() => {
        if (typeof window !== "undefined" && "speechSynthesis" in window) {
          const utterance = new SpeechSynthesisUtterance(textToSpeak);
          utterance.lang = isUrdu ? "ur-PK" : "en-US";
          utterance.onend = () => {
            setIsSpeaking(false);
            audioRef.current = null;
          };
          utterance.onerror = () => {
            setIsSpeaking(false);
            audioRef.current = null;
          };
          window.speechSynthesis.speak(utterance);
        } else {
          setIsSpeaking(false);
          audioRef.current = null;
        }
      });
    } catch {
      setIsSpeaking(false);
      audioRef.current = null;
    }
  };

  const copyIntendedSentence = () => {
    const textToCopy = intent?.urduSentence || (displayPills.length > 0 ? displayPills.map(t => t.urdu).join(" ") : "");
    if (!textToCopy) return;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const hasContent = Boolean(intent?.urduSentence || displayPills.length > 0);

  return (
    <div className="panel translation-canvas" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div className="canvas-glow" />

      {/* ─── MAIN BLOCK: Translated User Intent ─── */}
      <div className="silent-intent-card" style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between", position: "relative" }}>
        
        {/* Top Header & Actions Toolbar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div className="silent-intent-badge-group">
            <span className="silent-intent-title">
              <Sparkles size={14} color="#7c3aed" />
              <span style={{ fontSize: '13px', fontWeight: 600 }}>{t.liveTranslationTitle}</span>
            </span>
            {intent?.tone && (
              <span className={`intent-tone-badge ${intent.tone}`}>
                {intent.tone}
              </span>
            )}
          </div>

          <div style={{ display: "flex", gap: "10px", alignItems: 'center' }}>
            {hasBuffer && (
              <button className="icon-subtle-btn" onClick={onUndoLast} title={t.undoBtn} style={{ background: "transparent", border: "none", cursor: "pointer", color: "#ef4444", display: "inline-flex", alignItems: "center", gap: "3px", fontSize: "11px", fontWeight: 500 }}>
                <RotateCcw size={13} /> {t.undoBtn}
              </button>
            )}
            {(hasBuffer || currentDetection || intent) && (
              <button
                className="icon-subtle-btn"
                onClick={() => {
                  onClearAll();
                  setIntent(null);
                  if (audioRef.current) {
                    audioRef.current.pause();
                    audioRef.current.currentTime = 0;
                    audioRef.current = null;
                  }
                  if (typeof window !== "undefined" && "speechSynthesis" in window) {
                    window.speechSynthesis.cancel();
                  }
                  setIsSpeaking(false);
                  setCopied(false);
                }}
                title={t.clearAllBtn}
                style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--muted)", display: "inline-flex", alignItems: "center", gap: "3px", fontSize: "11px", fontWeight: 500, marginRight: '8px' }}
              >
                <Trash2 size={13} /> {t.clearAllBtn}
              </button>
            )}

            <button
              className="refresh-icon-btn"
              onClick={() => setShowHistory(!showHistory)}
              title={t.historyBtnTitle}
              style={{
                background: showHistory ? "rgba(139, 92, 246, 0.15)" : "transparent",
                border: showHistory ? "1px solid rgba(139, 92, 246, 0.3)" : "1px solid transparent",
                borderRadius: "50%",
                width: "28px",
                height: "28px",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                color: showHistory ? "#7c3aed" : "var(--muted)",
                transition: "all 0.2s ease",
                position: 'relative'
              }}
            >
              <History size={14} />
              {history.length > 0 && <span style={{ position: 'absolute', top: -3, right: -3, background: '#ef4444', color: 'white', borderRadius: '50%', fontSize: '9px', width: '14px', height: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>{history.length}</span>}
            </button>

          </div>
        </div>

        {/* Translation History Dropdown */}
        {showHistory && (
          <div className="history-dropdown" style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px', marginBottom: '16px', maxHeight: '150px', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <h4 style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>{t.historyDropdownTitle}</h4>
              <button onClick={() => setHistory([])} style={{ border: 'none', background: 'transparent', color: '#ef4444', fontSize: '11px', cursor: 'pointer' }}>{t.clearAllBtn}</button>
            </div>
            {history.length === 0 ? <p style={{ fontSize: '11px', color: '#94a3b8', margin: 0 }}>{t.noHistoryLogs}</p> : [...history].reverse().map((h, i) => (
              <div key={i} style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '8px', marginBottom: '8px' }}>
                <p dir="rtl" style={{ margin: '0 0 4px 0', fontSize: '14px', fontWeight: 600, color: 'var(--foreground)' }}>{h.urduSentence}</p>
                <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>{h.englishSentence}</p>
              </div>
            ))}
          </div>
        )}

        {/* Translation Content Area */}
        <div className="silent-intent-body" style={{ minHeight: "130px", display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          {intent ? (
            <>
              <div className="silent-intent-urdu" dir="rtl" style={{ fontSize: "32px", lineHeight: "1.8", fontWeight: 700 }}>
                {intent.urduSentence}
              </div>
              {intent.englishSentence && (
                <div className="silent-intent-english" style={{ fontSize: "16px", marginTop: "8px", color: 'var(--muted)' }}>
                  &ldquo;{intent.englishSentence}&rdquo;
                </div>
              )}
            </>
          ) : (
            <div style={{ color: "var(--muted)", fontSize: "15px", padding: "20px 0", textAlign: "center" }}>
              {displayPills.length > 0 ? (
                <span>{isUrdu ? "ترجمہ ہو رہا ہے..." : "Translating..."}</span>
              ) : (
                <span>{t.waitingGesturesDesc}</span>
              )}
            </div>
          )}
        </div>

        {/* Bottom Actions (Speak & Copy) */}
        <div className="silent-intent-actions" style={{ marginTop: "24px", paddingTop: '16px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: "12px", color: "var(--muted)", maxWidth: '50%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {intent?.intentSummary ? `Context: ${intent.intentSummary}` : ""}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <button
              className={`primary-btn icon-text ${isSpeaking ? "active" : ""}`}
              onClick={speakIntendedSentence}
              disabled={!hasContent}
              style={{ padding: "8px 18px", fontSize: "12.5px" }}
              title="Speak the formulated intent sentence"
            >
              {isSpeaking ? <VolumeX size={15} /> : <Volume2 size={15} />}
              <span>{isSpeaking ? (isUrdu ? "روکیں" : "Stop") : t.listenBtn}</span>
            </button>

            <button
              className="secondary-btn icon-text"
              onClick={copyIntendedSentence}
              disabled={!hasContent}
              style={{ padding: "8px 14px", fontSize: "12.5px" }}
              title="Copy intent sentence"
            >
              {copied ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
              <span>{copied ? t.copiedBtn : t.copyBtn}</span>
            </button>
          </div>
        </div>
      </div>

      {/* ─── SUB BLOCK: Raw Detected Signs Buffer ─── */}
      <div style={{ display: "flex", flexDirection: "column", gap: "8px", padding: "0 12px" }}>
        <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
          {isUrdu ? "پہچانے گئے اشارات" : "Detected Signs (اشارے)"}: {displayPills.length > 0 && <span style={{ color: "var(--violet)", marginLeft: '4px' }}>{displayPills.length}</span>}
        </span>
        <div className="canvas-strip" style={{ minHeight: "56px", padding: "12px", background: "rgba(255, 255, 255, 0.4)", borderRadius: "12px", border: "1px dashed rgba(226, 232, 240, 0.8)", flexWrap: "wrap" }}>
          {displayPills.length === 0 ? (
            <span style={{ color: "var(--muted)", fontSize: "12px", margin: "auto", fontStyle: "italic" }}>
              {isUrdu ? "اشارات کی پٹی خالی ہے۔" : "Raw signs buffer is empty."}
            </span>
          ) : (
            displayPills.map((tok, idx) => (
              <div key={`${tok.id}-${idx}`} className="canvas-pill" style={{ opacity: idx === displayPills.length - 1 ? 1 : 0.85 }}>
                <span className="pill-urdu" dir="rtl" style={{ fontSize: "15px" }}>
                  {tok.urdu || tok.id}
                </span>
                <span className="pill-gloss" style={{ fontSize: "11px" }}>
                  {tok.gloss || tok.english}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
