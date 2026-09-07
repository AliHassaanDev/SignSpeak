"use client";

import React, { useState } from "react";
import { Copy, Check, Mic, MicOff, Sparkles, Volume2, VolumeX } from "lucide-react";
import { PSLSign, UrduToPSLInferenceResult } from "../app/lib/psl_types";

export interface UrduInputPanelProps {
  text: string;
  setText: (v: string) => void;
  isListening: boolean;
  toggleVoiceInput: () => void;
  isSpeaking: boolean;
  playUrduAudio: () => void;
  handleTranslate: (t: string) => void;
  inferenceResult: UrduToPSLInferenceResult | null;
  isBackendOnline: boolean;
  signs: PSLSign[];
  setSigns: (signs: PSLSign[]) => void;
  setInferenceResult: (res: UrduToPSLInferenceResult | null) => void;
  setIsPlaying: (playing: boolean) => void;
}

export default function UrduInputPanel({
  text,
  setText,
  isListening,
  toggleVoiceInput,
  isSpeaking,
  playUrduAudio,
  handleTranslate,
  inferenceResult,
  isBackendOnline,
  signs,
  setSigns,
  setInferenceResult,
  setIsPlaying,
}: UrduInputPanelProps) {
  const [copied, setCopied] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>("all");

  const categories = [
    { id: "all", label: "تمام اشارات (All)" },
    { id: "greeting", label: "سلام و دعائیں (Greetings)" },
    { id: "emergency", label: "ایمرجنسی و مدد (Emergency)" },
    { id: "daily", label: "روزمرہ گفتگو (Daily)" },
  ];

  const categoryPresets: Record<string, string[]> = {
    all: ["السلام علیکم", "آپ کیسے ہیں؟", "شکریہ", "براہ کرم مدد کریں", "پاکستان", "پانی", "ڈاکٹر", "میرا نام"],
    greeting: ["السلام علیکم", "سلام", "شکریہ", "خوش آمدید"],
    emergency: ["براہ کرم مدد کریں", "مدد", "ہسپتال", "ڈاکٹر"],
    daily: ["پاکستان", "پانی", "کھانا", "ہاں", "نہیں", "میرا نام"],
  };

  const copyGlossSequence = () => {
    if (signs.length === 0) return;
    const glossStr = signs.map((s) => s.gloss).join(" ");
    navigator.clipboard.writeText(glossStr);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="input-column">
      <div className="panel input-panel">
        <div className="panel-title-row">
          <span className="panel-title">Enter Urdu Text (اردو متن درج کریں)</span>
          <div className="input-actions">
            <button
              className={`icon-circle-btn ${isListening ? "active pulse" : ""}`}
              onClick={toggleVoiceInput}
              title="Voice Input (اردو بولیں) (FR-10)"
            >
              {isListening ? <MicOff size={15} color="#ef4444" /> : <Mic size={15} />}
            </button>
            {text && (
              <button
                className={`icon-circle-btn ${isSpeaking ? "active" : ""}`}
                onClick={playUrduAudio}
                title="Audio Pronunciation (FR-09)"
              >
                {isSpeaking ? <VolumeX size={15} /> : <Volume2 size={15} />}
              </button>
            )}
          </div>
        </div>

        <textarea
          dir="rtl"
          placeholder="یہاں اردو لکھیں یا بولیں... (مثال: السلام علیکم، آپ کیسے ہیں؟)"
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            handleTranslate(e.target.value);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleTranslate(text);
            }
          }}
          maxLength={500}
        />

        <div className="input-footer">
          <span className="counter">{text.length} / 500 Characters</span>
          {text && (
            <button
              className="clear-btn"
              onClick={() => {
                setText("");
                setSigns([]);
                setInferenceResult(null);
                setIsPlaying(false);
              }}
            >
              Clear Text
            </button>
          )}
        </div>

        {inferenceResult && (
          <div className="model-telemetry-badge">
            <span className="model-tag">
              Model: <strong>{inferenceResult.modelName}</strong> ({inferenceResult.modelVersion})
            </span>
            <span className="conf-tag">
              Confidence: {Math.round(inferenceResult.modelConfidence * 100)}%
            </span>
            <span className="token-tag">
              {inferenceResult.signCount} Signs generated
            </span>
            <span style={{ fontSize: "10px", color: isBackendOnline ? "#34d399" : "#a78bfa" }}>
              ● {isBackendOnline ? "FastAPI Connected" : "Local Engine"}
            </span>
          </div>
        )}

        <div className="translate-actions-row">
          <button
            className="primary-btn violet translate-btn"
            onClick={() => handleTranslate(text)}
          >
            <Sparkles size={15} /> Translate & Sign
          </button>
          {signs.length > 0 && (
            <button className="secondary-btn copy-gloss-btn" onClick={copyGlossSequence}>
              {copied ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
              <span>{copied ? "Copied" : "Copy Gloss"}</span>
            </button>
          )}
        </div>

        <div className="quick-presets-box">
          <div className="category-filter-row">
            {categories.map((cat) => (
              <button
                key={cat.id}
                className={`category-pill ${activeCategory === cat.id ? "active" : ""}`}
                onClick={() => setActiveCategory(cat.id)}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <div className="quick-chips-grid">
            {(categoryPresets[activeCategory] || categoryPresets.all).map((item) => (
              <button
                key={item}
                className={`quick-chip ${text.trim() === item ? "selected" : ""}`}
                onClick={() => {
                  setText(item);
                  handleTranslate(item);
                }}
                dir="rtl"
              >
                {item}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
