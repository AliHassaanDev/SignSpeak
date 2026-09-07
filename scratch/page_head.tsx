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
import { PSLSign } from "./lib/psl-dictionary";
import { UrduToPSLInferenceResult } from "./lib/urdutopsl-model";
import { signBridgeAPI } from "./lib/api";
import { TemporalStabilizer } from "./lib/smoothing";

import CameraPanel from "../components/CameraPanel";
import DemoSelector, { DemoSample } from "../components/DemoSelector";
import PredictionPanel, { PredictionToken } from "../components/PredictionPanel";
import TranscriptPanel from "../components/TranscriptPanel";
import AvatarPanel from "../components/AvatarPanel";

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
                <PSLToUrdu
                  cameraOn={cameraOn}
                  setCameraOn={setCameraOn}
                />
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

function PSLToUrdu({
  cameraOn,
  setCameraOn,
}: {
  cameraOn: boolean;
  setCameraOn: (v: boolean) => void;
}) {
  const [activeMode, setActiveMode] = useState<"camera" | "demo" | "upload">("camera");
  const [tokenBuffer, setTokenBuffer] = useState<PredictionToken[]>([]);
  const [currentDetection, setCurrentDetection] = useState<PredictionToken | null>(null);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [isCameraFullscreen, setIsCameraFullscreen] = useState(false);
  const [metrics, setMetrics] = useState({ fps: 30, confidence: 95, latency: 280 });

  // Temporal Stabilizer instance (FR-05)
  const stabilizerRef = useRef<TemporalStabilizer>(
    new TemporalStabilizer({ windowSize: 3, confidenceThreshold: 0.70, cooldownMs: 600 })
  );

  // Handle detection from Camera, Video Upload, or Demo Mode
  const handleRawDetection = (rawToken: { id: string; urdu?: string; english?: string; gloss?: string; confidence?: number | string; type?: string; source?: string }) => {
    if (!rawToken || rawToken.id === "none") return;

    const token: PredictionToken = {
      id: rawToken.id,
      urdu: rawToken.urdu,
      english: rawToken.english,
      gloss: rawToken.gloss,
      confidence: Number(rawToken.confidence) || 0.9,
      type: rawToken.type || "word",
      source: rawToken.source || "detector",
    };

    // Update live detection display immediately
    setCurrentDetection(token);
    setMetrics((prev) => ({
      ...prev,
      confidence: Math.round(token.confidence * 100),
      latency: Math.floor(Math.random() * 40) + 260,
    }));

    // Process through temporal stabilization (FR-05)
    const stabilized = stabilizerRef.current.processFrame(token);
    if (stabilized) {
      setTokenBuffer((prev) => [...prev, stabilized]);
    }
  };

  // Immediate sample commit for Demo Mode (FR-17)
  const handleSelectDemoSample = (sample: DemoSample) => {
    const token: PredictionToken = {
      id: sample.id,
      urdu: sample.urdu,
      english: sample.english,
      gloss: sample.gloss,
      confidence: sample.confidence,
      type: sample.type,
      source: "demo_testbed",
    };
    setCurrentDetection(token);
    setMetrics((prev) => ({
      ...prev,
      confidence: Math.round(sample.confidence * 100),
      latency: 180,
    }));
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
        {/* Left Column: Stage (Camera, Demo Selector, or Upload) */}
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
          />

          {/* FR-17 Demo Mode Selector */}
          {activeMode === "demo" && (
            <DemoSelector onSelectSample={handleSelectDemoSample} />
          )}
        </div>

        {/* Right Column: Prediction & Accumulated Sentence Buffer */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px", minWidth: 0 }}>
          <PredictionPanel currentDetection={currentDetection} />

          <TranscriptPanel
            tokenBuffer={tokenBuffer}
            onUndoLast={() => setTokenBuffer((prev) => prev.slice(0, -1))}
            onClearAll={() => {
              setTokenBuffer([]);
              setCurrentDetection(null);
              stabilizerRef.current.reset();
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

  // Check backend status on mount
  useEffect(() => {
    signBridgeAPI.checkHealth().then(setIsBackendOnline);
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
      setIsListening(false);
      return;
    }

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const recognition = new SpeechRecognition() as any;
      recognition.lang = "ur-PK";
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => setIsListening(true);
      recognition.onresult = (event: { results: { [key: number]: { [key: number]: { transcript: string } } } }) => {
        const transcript = event.results[0][0].transcript;
        setText(transcript);
        handleTranslate(transcript);
        setIsListening(false);
      };
      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);
      recognition.start();
    } catch {
      setIsListening(false);
    }
  };

  // Text to Speech for Urdu Audio (FR-09)
  const playUrduAudio = () => {
    if (!text || typeof window === "undefined" || !("speechSynthesis" in window)) return;
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "ur-PK";
    utterance.rate = speed;
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
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
        {/* Left Column: Urdu Input & Controls */}
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

            {/* Model Telemetry & Pipeline Badge */}
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

            {/* Quick Presets Section */}
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

        {/* Right Column: Modular 3D Signer Avatar Panel */}
        <AvatarPanel
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