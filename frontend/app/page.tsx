"use client";

import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import {
  ChevronDown,
  Copy,
  Check,
  Eye,
  Hand,
  Info,
  Languages,
  Menu,
  Mic,
  MicOff,
  Sparkles,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import { PSLSign, UrduToPSLInferenceResult } from "./lib/psl_types";
import { signBridgeAPI } from "./lib/api";

import CameraPanel from "../components/CameraPanel";

import { PredictionToken, SilentUserIntent } from "../components/TranscriptPanel";
import TranscriptPanel from "../components/TranscriptPanel";
import PSLVideoDisplay from "../components/PSLVideoDisplay";
import UrduInputPanel from "../components/UrduInputPanel";

function ModalPortal({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);
  if (!mounted) return null;
  return createPortal(children, document.body);
}

function scrollTo(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
}

/* ────────────────────────── Main Page Shell ────────────────────────── */

export default function Page() {
  const [activeTab, setActiveTab] = useState<"urdu-to-psl" | "psl-to-urdu">("urdu-to-psl");
  const [cameraOn, setCameraOn] = useState(false);
  const [urduText, setUrduText] = useState("");
  const [autoPlay, setAutoPlay] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);

  return (
    <main className="site-shell">
      {/* Global Sticky Navigation Header */}
      <SiteHeader />

      {/* Section 1 – Hero / Landing */}
      <section id="hero" className="section-page">
        <Landing />
      </section>

      {/* Section 2 – Unified Translation Workspace */}
      <section id="workspace" className="section-page">
        <div className="workspace-container">
          {/* Top Folder Tab Buttons */}
          <div className="workspace-tabs-row">
            <button
              className={`workspace-tab-btn tab-urdu ${activeTab === "urdu-to-psl" ? "active" : ""}`}
              onClick={() => setActiveTab("urdu-to-psl")}
              role="tab"
              aria-selected={activeTab === "urdu-to-psl"}
            >
              <div className="tab-medallion violet">
                <Languages size={18} />
              </div>
              <div className="tab-text-group">
                <span className="tab-title">Urdu to PSL</span>
                <span className="tab-subtitle">اردو سے اشارات</span>
              </div>
            </button>

            <button
              className={`workspace-tab-btn tab-psl ${activeTab === "psl-to-urdu" ? "active" : ""}`}
              onClick={() => setActiveTab("psl-to-urdu")}
              role="tab"
              aria-selected={activeTab === "psl-to-urdu"}
            >
              <div className="tab-medallion teal">
                <Hand size={18} />
              </div>
              <div className="tab-text-group">
                <span className="tab-title">PSL to Urdu</span>
                <span className="tab-subtitle">اشارات سے اردو</span>
              </div>
            </button>
          </div>

          {/* Central Card Container */}
          <div className={`workspace-card ${activeTab}`}>
            {activeTab === "urdu-to-psl" ? (
              <div className="tab-panel-fade" key="urdu-to-psl">
                <UrduToPSL
                  text={urduText}
                  setText={setUrduText}
                  autoPlay={autoPlay}
                  setAutoPlay={setAutoPlay}
                  isPlaying={isPlaying}
                  setIsPlaying={setIsPlaying}
                />
              </div>
            ) : (
              <div className="tab-panel-fade" key="psl-to-urdu">
                <PSLToUrdu />
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}

/* ────────────────────────── Shared Header & Logo ────────────────────────── */

function Logo() {
  return (
    <div className="logo" onClick={() => scrollTo("hero")} role="button" tabIndex={0}>
      <div className="logo-mark">
        <div className="logo-glow" />
        <svg
          className="logo-icon"
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M8 12C8 8.686 10.686 6 14 6H20C23.314 6 26 8.686 26 12C26 14.5 24.5 16.6 22.3 17.5L18 19.5"
            stroke="white"
            strokeWidth="2.6"
            strokeLinecap="round"
          />
          <path
            d="M24 20C24 23.314 21.314 26 18 26H12C8.686 26 6 23.314 6 20C6 17.5 7.5 15.4 9.7 14.5L14 12.5"
            stroke="white"
            strokeWidth="2.6"
            strokeLinecap="round"
          />
          <circle cx="16" cy="16" r="2.4" fill="#67e8f9" />
        </svg>
      </div>
      <span className="logo-brand">
        Sign<span className="logo-gradient">Speak</span>
      </span>
    </div>
  );
}

function SiteHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openSection, setOpenSection] = useState<string | null>("about");

  const toggleSection = (sec: string) => {
    setOpenSection(openSection === sec ? null : sec);
  };

  return (
    <header className="site-header">
      <Logo />

      {/* Desktop Navigation */}
      <nav className="landing-nav desktop-nav">
        <div className="nav-item-wrapper">
          <button className="nav-link-btn">
            About SignSpeak <ChevronDown size={13} className="nav-chevron" />
          </button>
          <div className="nav-dropdown align-left">
            <div className="info-panel-content">
              <div className="info-badge-strip">
                <span className="info-tag violet">PSL ↔ Urdu AI</span>
                <span className="info-tag teal">Assistive Technology</span>
              </div>
              <p className="info-lead">
                <strong>SignSpeak</strong> is a bidirectional assistive communication platform designed to reduce communication barriers for Pakistan&apos;s <strong>1.5M+ deaf individuals</strong> through real-time sign language translation.
              </p>
              <div className="info-badge-strip">
                <span className="info-tag blue">Two-Way Translation</span>
                <span className="info-tag amber">Live Vision AI</span>
                <span className="info-tag violet">3D Sign Avatar</span>
              </div>
            </div>
          </div>
        </div>

        <div className="nav-item-wrapper">
          <button className="nav-link-btn">
            How It Works <ChevronDown size={13} className="nav-chevron" />
          </button>
          <div className="nav-dropdown align-left">
            <div className="info-panel-content">
              <div className="info-step-list">
                <div className="info-step-item">
                  <span className="info-step-num teal">1</span>
                  <div className="info-step-text">
                    <strong>Landmark & Gesture Tracking</strong>
                    <p>Extracts 21 hand landmarks & spatial movement dynamics.</p>
                  </div>
                </div>
                <div className="info-step-item">
                  <span className="info-step-num">2</span>
                  <div className="info-step-text">
                    <strong>Neural PSL Translation</strong>
                    <p>Interprets spatial grammar and resolves Urdu sentences.</p>
                  </div>
                </div>
                <div className="info-step-item">
                  <span className="info-step-num blue">3</span>
                  <div className="info-step-text">
                    <strong>Speech & 3D Signer</strong>
                    <p>Generates natural voice or animates 3D PSL avatar.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="nav-item-wrapper">
          <button className="nav-link-btn">
            Features <ChevronDown size={13} className="nav-chevron" />
          </button>
          <div className="nav-dropdown align-right">
            <div className="info-panel-content">
              <div className="info-step-list">
                <div className="info-step-item">
                  <span className="info-step-num teal">1</span>
                  <div className="info-step-text">
                    <strong>Sign to Urdu</strong>
                    <p>Live camera and video recognition translating PSL signs.</p>
                  </div>
                </div>
                <div className="info-step-item">
                  <span className="info-step-num">2</span>
                  <div className="info-step-text">
                    <strong>Urdu to 3D Sign Avatar</strong>
                    <p>Kinematic 3D animated sign language avatar with timeline controls.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <button className="primary-btn compact" onClick={() => scrollTo("workspace")}>Get Started</button>
      </nav>

      {/* Mobile Menu */}
      <div className="mobile-header-actions">
        <button
          className="primary-btn small"
          style={{ padding: "6px 12px", fontSize: "11px" }}
          onClick={() => scrollTo("workspace")}
        >
          Get Started
        </button>
        <button
          className={`mobile-menu-btn ${mobileMenuOpen ? "active" : ""}`}
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle navigation menu"
        >
          {mobileMenuOpen ? <X size={19} /> : <Menu size={19} />}
        </button>
      </div>

      {mobileMenuOpen && (
        <div className="mobile-nav-drawer" onClick={() => setMobileMenuOpen(false)}>
          <div className="mobile-nav-panel" onClick={(e) => e.stopPropagation()}>
            <div className="mobile-nav-accordion">
              <div className={`mobile-acc-item ${openSection === "about" ? "open" : ""}`}>
                <button className="mobile-acc-header" onClick={() => toggleSection("about")}>
                  <span>About SignSpeak</span>
                  <ChevronDown size={14} className="mobile-acc-chevron" />
                </button>
                <div className="mobile-acc-collapse">
                  <div className="mobile-acc-inner">
                    <p className="info-lead">
                      Two-way Pakistani Sign Language assistive communication platform.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

/* ────────────────────────── Landing Section ────────────────────────── */

function Landing() {
  const [showLearnMore, setShowLearnMore] = useState(false);

  return (
    <div className="landing-page">
      <div className="landing-hero">
        <div className="hero-copy">
          <h1><span className="italic">Speak Freely.</span><br />Understand Deeply.</h1>
          <p>SignSpeak is a two-way sign language assistant bridging the communication barrier between PSL signers and Urdu speakers with real-time AI and 3D avatar animations.</p>
          <div className="hero-actions">
            <button className="primary-btn" onClick={() => scrollTo("workspace")}>Start Translating</button>
            <button className="secondary-btn" onClick={() => setShowLearnMore(true)}>Learn More</button>
          </div>

          <div className="feature-strip">
            <Feature icon={<Hand size={22} />} title="Two-Way Translation" text="PSL to Urdu & Urdu to PSL" tone="violet" />
            <Feature icon={<Sparkles size={21} />} title="AI Powered" text="Dynamic Word & Alphabet recognition" tone="teal" />
            <Feature icon={<Languages size={21} />} title="Universal Access" text="Zero-install browser application" tone="blue" />
          </div>
        </div>

        <div className="hero-art">
          <Image
            src="/hero-hand copy.png"
            alt="Pakistani Sign Language Illustration"
            width={820}
            height={850}
            className="hero-illustration"
            priority
          />
        </div>
      </div>

      <button className="scroll-indicator" onClick={() => scrollTo("workspace")} aria-label="Scroll down">
        <ChevronDown size={22} />
      </button>

      {showLearnMore && (
        <div className="modal-backdrop" onClick={() => setShowLearnMore(false)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-group">
                <h3>About SignSpeak</h3>
              </div>
              <button className="modal-close-btn" onClick={() => setShowLearnMore(false)} aria-label="Close modal">
                <X size={15} />
              </button>
            </div>
            <div className="modal-body">
              <p className="modal-summary">
                SignSpeak combines dynamic PSL sequence recognition, Urdu alphabet fingerspelling fallback, and 3D avatar playback.
              </p>
            </div>
            <div className="modal-footer">
              <button className="secondary-btn" onClick={() => setShowLearnMore(false)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Feature({ icon, title, text, tone }: { icon: React.ReactNode; title: string; text: string; tone: string }) {
  return (
    <div className="feature-item">
      <div className={`feature-icon ${tone}`}>{icon}</div>
      <div><h3>{title}</h3><p>{text}</p></div>
    </div>
  );
}

/* ────────────────────────── PSL to Urdu (Interactive) ────────────────────────── */

function PSLToUrdu() {
  const [tokenBuffer, setTokenBuffer] = useState<PredictionToken[]>([]);
  const [currentDetection, setCurrentDetection] = useState<PredictionToken | null>(null);
  const [externalIntent, setExternalIntent] = useState<SilentUserIntent | null>(null);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [isCameraFullscreen, setIsCameraFullscreen] = useState(false);
  const [metrics, setMetrics] = useState({ fps: 30, confidence: 95, latency: 280 });


  const [activeMode, setActiveMode] = useState<"camera" | "upload" | "demo">("camera");
  const [cameraOn, setCameraOn] = useState(false);

  // Handle detection from Camera, Video Upload, or Demo Mode
  const handleRawDetection = (rawToken: {
    id: string;
    urdu?: string;
    english?: string;
    gloss?: string;
    confidence?: number | string;
    type?: string;
    source?: string;
    tokens?: any[];
    intent?: any;
  }) => {
    if (!rawToken || rawToken.id === "none") return;

    if (rawToken.intent) {
      setExternalIntent(rawToken.intent);
    }

    // For backend video translation (Gemini Multimodal or GRU model multi-sign or single-sign):
    const isBackendVideoSource = rawToken.source === "gru_model" || rawToken.source === "gemini_multimodal_cv" || rawToken.source === "psl_predictor";
    if (isBackendVideoSource && Array.isArray(rawToken.tokens) && rawToken.tokens.length > 0) {
      const newTokens: PredictionToken[] = rawToken.tokens.map((t) => ({
        id: t.id || t.gloss || t.english || "gesture",
        urdu: t.urdu || "",
        english: t.english || "",
        gloss: t.gloss || "",
        confidence: Number(t.confidence) || 0.85,
        type: "word",
        source: rawToken.source || "gemini_multimodal_cv",
      }));

      // Update current detection to the primary / latest sign
      setCurrentDetection(newTokens[newTokens.length - 1]);
      setMetrics((prev) => ({
        ...prev,
        confidence: Math.round(Number(rawToken.confidence || 0.9) * 100),
        latency: 180,
      }));

      // Replace the sentence buffer with the new chronological signs for this video
      setTokenBuffer(newTokens);
      return;
    }

    const token: PredictionToken = {
      id: rawToken.id || rawToken.gloss || rawToken.english || "gesture",
      urdu: rawToken.urdu || "",
      english: rawToken.english || "",
      gloss: rawToken.gloss || "",
      confidence: Number(rawToken.confidence) || 0.9,
      type: (rawToken.type as "word" | "alphabet") || "word",
      source: rawToken.source || "detector",
    };

    // Update live detection display immediately
    setCurrentDetection(token);
    setMetrics((prev) => ({
      ...prev,
      confidence: Math.round(token.confidence * 100),
      latency: Math.floor(Math.random() * 40) + 260,
    }));

    // For backend video translation (single-shot fallback)
    setTokenBuffer((prev) => [...prev, token]);
  };


  return (
    <>
      <div className="page-header">
        <div>
          <h2 className="teal-title">PSL to Urdu Translator</h2>
          <p>Recognize Pakistani Sign Language gestures via live camera, demo testbed, or video upload into Urdu & English text and speech.</p>
        </div>
        <button className="info-btn" onClick={() => setShowInfoModal(true)}>
          <Info size={14} /> How It Works
        </button>
      </div>

      <div className="psl-layout">
        <div style={{ display: "flex", flexDirection: "column", gap: "16px", minWidth: 0 }}>
          <CameraPanel
            cameraOn={cameraOn}
            setCameraOn={setCameraOn}
            activeMode={activeMode}
            setActiveMode={setActiveMode}
            metrics={metrics}
            onDetection={handleRawDetection}
            isCameraFullscreen={isCameraFullscreen}
            setIsCameraFullscreen={setIsCameraFullscreen}
            onReset={() => {
              setTokenBuffer([]);
              setCurrentDetection(null);
              setExternalIntent(null);
            }}
          />


        </div>

        {/* Right Column: Prediction & Accumulated Sentence Buffer */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px", minWidth: 0 }}>
          <TranscriptPanel
            tokenBuffer={tokenBuffer}
            currentDetection={currentDetection}
            externalIntent={externalIntent}
            onUndoLast={() => {
              setTokenBuffer((prev) => prev.slice(0, -1));
              setExternalIntent(null);
            }}
            onClearAll={() => {
              setTokenBuffer([]);
              setCurrentDetection(null);
              setExternalIntent(null);
            }}
          />
        </div>
      </div>

      {/* Performance Tips */}
      <div className="tips-panel">
        <strong>Recognition Performance Tips:</strong>
        <span><Sparkles size={13} /> Good frontal lighting</span>
        <span><Eye size={13} /> High hand contrast against torso</span>
        <span><Hand size={13} /> Hold signs stably for ~300ms</span>
      </div>

      {/* Information Modal */}
      {showInfoModal && (
        <ModalPortal>
          <div className="modal-overlay" onClick={() => setShowInfoModal(false)}>
            <div className="modal-card" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Pakistani Sign Language (PSL) Recognition System</h3>
                <button className="close-btn" onClick={() => setShowInfoModal(false)}><X size={18} /></button>
              </div>
              <div className="modal-body">
                <p>
                  <strong>SignBridge PK</strong> utilizes client-side landmark extraction and temporal sequence recognition to identify dynamic PSL words and Urdu alphabet fingerspelling in real time.
                </p>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}
    </>
  );
}

/* ────────────────────────── Urdu to PSL (Interactive) ────────────────────────── */

function UrduToPSL({
  text,
  setText,
  autoPlay,
  setAutoPlay,
  isPlaying,
  setIsPlaying,
}: {
  text: string;
  setText: (v: string) => void;
  autoPlay: boolean;
  setAutoPlay: (v: boolean) => void;
  isPlaying: boolean;
  setIsPlaying: (v: boolean) => void;
}) {
  const [signs, setSigns] = useState<PSLSign[]>([]);
  const [inferenceResult, setInferenceResult] = useState<UrduToPSLInferenceResult | null>(null);
  const [currentSignIndex, setCurrentSignIndex] = useState(0);
  const [speed, setSpeed] = useState<number>(1);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [isBackendOnline, setIsBackendOnline] = useState<boolean>(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);

  // Check backend status on mount and cleanup audio/recognition on unmount
  useEffect(() => {
    signBridgeAPI.checkHealth().then(setIsBackendOnline);

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
        recognitionRef.current = null;
      }
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Perform translation using the API layer (with fallback)
  const handleTranslate = async (inputText: string = text) => {
    const trimmed = inputText.trim();
    if (!trimmed) {
      setSigns([]);
      setInferenceResult(null);
      setCurrentSignIndex(0);
      setIsPlaying(false);
      return;
    }
    const result = await signBridgeAPI.translateUrduToPSL(trimmed);
    setInferenceResult(result);
    setSigns(result.tokens);
    setCurrentSignIndex(0);
    if (autoPlay && result.tokens.length > 0) {
      setIsPlaying(true);
    }
  };

  // Initial translation if text provided
  useEffect(() => {
    if (text) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      handleTranslate(text);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Playback timer loop
  useEffect(() => {
    if (!isPlaying || signs.length === 0) return;

    const currentSign = signs[currentSignIndex] || signs[0];
    const duration = (currentSign.duration || 1500) / speed;

    const timer = setTimeout(() => {
      if (currentSignIndex < signs.length - 1) {
        setCurrentSignIndex((prev) => prev + 1);
      } else {
        setIsPlaying(false);
      }
    }, duration);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlaying, currentSignIndex, signs, speed]);

  // Voice recognition (Speech to Text in Urdu) FR-10 / FR-11
  const toggleVoiceInput = () => {
    if (typeof window === "undefined") return;
    const SpeechRecognition =
      (window as unknown as { SpeechRecognition?: new () => unknown; webkitSpeechRecognition?: new () => unknown }).SpeechRecognition ||
      (window as unknown as { SpeechRecognition?: new () => unknown; webkitSpeechRecognition?: new () => unknown }).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in this browser. Please use Chrome or Edge.");
      return;
    }

    if (isListening) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
        recognitionRef.current = null;
      }
      setIsListening(false);
      return;
    }

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const recognition = new (SpeechRecognition as any)();
      recognition.lang = "ur-PK";
      recognition.continuous = false;
      recognition.interimResults = false;
      recognitionRef.current = recognition;

      recognition.onstart = () => setIsListening(true);
      recognition.onresult = (event: { results: { [key: number]: { [key: number]: { transcript: string } } } }) => {
        const transcript = event.results[0][0].transcript;
        setText(transcript);
        handleTranslate(transcript);
        setIsListening(false);
        recognitionRef.current = null;
      };
      recognition.onerror = (err: unknown) => {
        console.warn("Speech recognition error:", err);
        setIsListening(false);
        recognitionRef.current = null;
      };
      recognition.onend = () => {
        setIsListening(false);
        recognitionRef.current = null;
      };
      recognition.start();
    } catch {
      setIsListening(false);
      recognitionRef.current = null;
    }
  };

  // Text to Speech for Urdu Audio (FR-09)
  const playUrduAudio = () => {
    const textToSpeak = text.trim();
    if (!textToSpeak) return;

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
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }

      const audio = new Audio(`/api/tts?text=${encodeURIComponent(textToSpeak)}&lang=${lang}`);
      audio.playbackRate = speed;
      audioRef.current = audio;
      setIsSpeaking(true);

      audio.onended = () => {
        setIsSpeaking(false);
        audioRef.current = null;
      };

      audio.onerror = () => {
        // Fallback to browser SpeechSynthesis if audio element fails
        if (typeof window !== "undefined" && "speechSynthesis" in window) {
          const utterance = new SpeechSynthesisUtterance(textToSpeak);
          utterance.lang = isUrdu ? "ur-PK" : "en-US";
          utterance.rate = speed;
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

      audio.play().catch((playErr) => {
        console.warn("[playUrduAudio] Audio playback failed, falling back to speech synthesis:", playErr);
        if (typeof window !== "undefined" && "speechSynthesis" in window) {
          const utterance = new SpeechSynthesisUtterance(textToSpeak);
          utterance.lang = isUrdu ? "ur-PK" : "en-US";
          utterance.rate = speed;
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

  // Copy Gloss Sequence
  const copyGlossSequence = () => {
    if (signs.length === 0) return;
    const glossStr = signs.map((s) => s.gloss).join(" ");
    navigator.clipboard.writeText(glossStr);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

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

  return (
    <>
      <div className="page-header">
        <div>
          <h2 className="violet-title">Urdu to PSL Translator</h2>
          <p>Translate Urdu text or spoken voice into real-time Pakistani Sign Language 3D avatar animations powered by the <strong>urdutopsl</strong> pipeline.</p>
        </div>
        <button className="info-btn" onClick={() => setShowInfoModal(true)}>
          <Info size={14} /> How It Works
        </button>
      </div>

      <div className="urdu-layout">
        <UrduInputPanel
          text={text}
          setText={setText}
          isListening={isListening}
          toggleVoiceInput={toggleVoiceInput}
          isSpeaking={isSpeaking}
          playUrduAudio={playUrduAudio}
          handleTranslate={handleTranslate}
          inferenceResult={inferenceResult}
          isBackendOnline={isBackendOnline}
          signs={signs}
          setSigns={setSigns}
          setInferenceResult={setInferenceResult}
          setIsPlaying={setIsPlaying}
        />

        <PSLVideoDisplay
          signs={signs}
          currentSignIndex={currentSignIndex}
          setCurrentSignIndex={setCurrentSignIndex}
          isPlaying={isPlaying}
          setIsPlaying={setIsPlaying}
          speed={speed}
          setSpeed={setSpeed}
          autoPlay={autoPlay}
          setAutoPlay={setAutoPlay}
          isFullscreen={isFullscreen}
          setIsFullscreen={setIsFullscreen}
          videoUrl={inferenceResult?.video_url}
        />
      </div>

      {/* How it works info modal */}
      {showInfoModal && (
        <ModalPortal>
          <div className="modal-overlay" onClick={() => setShowInfoModal(false)}>
            <div className="modal-card" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>About Pakistani Sign Language (PSL) Translation</h3>
                <button className="close-btn" onClick={() => setShowInfoModal(false)}><X size={18} /></button>
              </div>
              <div className="modal-body">
                <p>
                  <strong>Pakistani Sign Language (PSL)</strong> follows visual-spatial syntax, utilizing body orientation and two-handed movement. Unmapped words fall back smoothly to manual fingerspelling.
                </p>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}
    </>
  );
}