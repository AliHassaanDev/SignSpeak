"use client";

import React, { useState } from "react";
import {
  Mic,
  MicOff,
  Sparkles,
  Volume2,
  VolumeX,
  Languages,
  ArrowRightLeft,
  X,
} from "lucide-react";
import { useLanguage } from "../app/context/LanguageContext";

export type InputLanguage = "ur" | "en";

export interface UrduInputPanelProps {
  text: string;
  setText: (v: string) => void;
  inputLang: InputLanguage;
  setInputLang: (lang: InputLanguage) => void;
  isListening: boolean;
  toggleVoiceInput: () => void;
  isSpeaking: boolean;
  playAudio: () => void;
  handleTranslate: (text: string, lang?: InputLanguage) => void;
  isTranslating?: boolean;
}

export default function UrduInputPanel({
  text,
  setText,
  inputLang,
  setInputLang,
  isListening,
  toggleVoiceInput,
  isSpeaking,
  playAudio,
  handleTranslate,
  isTranslating = false,
}: UrduInputPanelProps) {
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const { t, isUrdu } = useLanguage();

  const categories = [
    { id: "all", labelUrdu: isUrdu ? "تمام" : "تمام (All)", labelEn: isUrdu ? "تمام" : "All" },
    { id: "greeting", labelUrdu: isUrdu ? "سلام و دعائیں" : "سلام و دعائیں (Greetings)", labelEn: isUrdu ? "سلام و دعائیں" : "Greetings" },
    { id: "emergency", labelUrdu: isUrdu ? "ہیلپ و ایمرجنسی" : "ہیلپ و ایمرجنسی (Emergency)", labelEn: isUrdu ? "ہیلپ و ایمرجنسی" : "Emergency" },
    { id: "daily", labelUrdu: isUrdu ? "روزمرہ گفتگو" : "روزمرہ گفتگو (Daily)", labelEn: isUrdu ? "روزمرہ گفتگو" : "Daily" },
  ];

  const presetsUrdu: Record<string, string[]> = {
    all: ["السلام علیکم", "آپ کیسے ہیں؟", "شکریہ", "ہسپتال کہاں ہے؟", "براہ کرم مدد کریں", "پاکستان", "پانی", "میرا نام امان ہے"],
    greeting: ["السلام علیکم", "سلام", "آپ کیسے ہیں؟", "شکریہ", "خوش آمدید", "اللہ حافظ"],
    emergency: ["ہسپتال کہاں ہے؟", "براہ کرم مدد کریں", "مدد", "ڈاکٹر"],
    daily: ["مجھے پانی چاہیے", "کھانا", "میرا نام امان ہے", "پاکستان", "اسکول", "دوست", "ہاں", "نہیں"],
  };

  const presetsEn: Record<string, string[]> = {
    all: ["Where is the hospital?", "How are you?", "Thank you", "Please help", "I want water", "My name is Amaan", "Pakistan"],
    greeting: ["Hello", "How are you?", "Thank you", "Welcome", "Goodbye"],
    emergency: ["Where is the hospital?", "Please help", "I need a doctor", "Emergency"],
    daily: ["I want water", "I want to eat food", "My name is Amaan", "School", "Friend", "Yes", "No"],
  };

  const activePresets = inputLang === "en"
    ? presetsEn[activeCategory] || presetsEn.all
    : presetsUrdu[activeCategory] || presetsUrdu.all;

  const handleLanguageToggle = () => {
    const nextLang: InputLanguage = inputLang === "ur" ? "en" : "ur";
    setInputLang(nextLang);
    if (text) {
      handleTranslate(text, nextLang);
    }
  };

  return (
    <div className="input-column">
      <div className="panel input-panel modern-input-card">
        {/* Header Row with Title & Top-Right Language Switcher */}
        <div className="panel-title-row">
          <div className="panel-title-group">
            <span className="panel-title">
              {inputLang === "en" ? t.inputPanelTitleEn : t.inputPanelTitleUrdu}
            </span>
          </div>

          <div className="input-header-actions">
            {/* Top-Right Language Toggle Icon Button */}
            <button
              type="button"
              className={`lang-switch-btn ${inputLang === "en" ? "is-english" : "is-urdu"}`}
              onClick={handleLanguageToggle}
              title={`Switch input mode to ${inputLang === "en" ? "Urdu (اردو)" : "English (EN)"}`}
            >
              <Languages size={14} className="lang-icon" />
              <div className="lang-pill-track">
                <span className={`lang-pill-item ${inputLang === "ur" ? "active" : ""}`}>اردو</span>
                <span className={`lang-pill-item ${inputLang === "en" ? "active" : ""}`}>EN</span>
              </div>
              <ArrowRightLeft size={12} className="switch-arrow-icon" />
            </button>

            {/* Voice Input Button */}
            <button
              type="button"
              className={`icon-circle-btn ${isListening ? "active pulse" : ""}`}
              onClick={toggleVoiceInput}
              title={
                isListening
                  ? t.listeningBtn
                  : inputLang === "en"
                    ? "Speak in English (Voice input)"
                    : "اردو بولیں (Voice input)"
              }
            >
              {isListening ? <MicOff size={15} color="#ef4444" /> : <Mic size={15} />}
            </button>

            {/* TTS Pronunciation Button */}
            {text && (
              <button
                type="button"
                className={`icon-circle-btn ${isSpeaking ? "active" : ""}`}
                onClick={playAudio}
                title={t.audioPronounceBtn}
              >
                {isSpeaking ? <VolumeX size={15} /> : <Volume2 size={15} />}
              </button>
            )}
          </div>
        </div>

        {/* Textarea: Dynamic dir & placeholder */}
        <div className="textarea-wrapper">
          <textarea
            dir={inputLang === "en" ? "ltr" : "rtl"}
            placeholder={
              inputLang === "en"
                ? t.inputPlaceholderEn
                : t.inputPlaceholderUrdu
            }
            value={text}
            onChange={(e) => {
              setText(e.target.value);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleTranslate(text, inputLang);
              }
            }}
            maxLength={500}
            className={`modern-textarea ${inputLang === "en" ? "ltr-mode" : "rtl-mode"}`}
          />
        </div>

        {/* Textarea Footer: Char count & Clear */}
        <div className="input-footer">
          <span className="counter">{t.charCountLabel(text.length, 500)}</span>
          {text && (
            <button
              type="button"
              className="clear-btn"
              onClick={() => {
                setText("");
                handleTranslate("", inputLang);
              }}
            >
              <X size={13} /> {t.clearBtn}
            </button>
          )}
        </div>

        {/* Translate Action Button */}
        <div className="translate-actions-row">
          <button
            type="button"
            className="primary-btn violet translate-btn"
            onClick={() => handleTranslate(text, inputLang)}
            disabled={!text.trim() || isTranslating}
          >
            <Sparkles size={16} className={isTranslating ? "spin" : ""} />
            <span>{isTranslating ? t.translatingBtn : t.translateBtn}</span>
          </button>
        </div>

        {/* Quick Presets Section */}
        <div className="quick-presets-box">
          <div className="category-filter-row">
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                className={`category-pill ${activeCategory === cat.id ? "active" : ""}`}
                onClick={() => setActiveCategory(cat.id)}
              >
                {inputLang === "en" ? cat.labelEn : cat.labelUrdu}
              </button>
            ))}
          </div>

          <div className="quick-chips-grid">
            {activePresets.map((item) => (
              <button
                key={item}
                type="button"
                className={`quick-chip ${text.trim() === item ? "selected" : ""}`}
                onClick={() => {
                  setText(item);
                  handleTranslate(item, inputLang);
                }}
                dir={inputLang === "en" ? "ltr" : "rtl"}
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
