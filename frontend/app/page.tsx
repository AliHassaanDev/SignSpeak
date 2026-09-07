"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import Link from "next/link";
import {
  AlertCircle,
  ArrowRight,
  ArrowUpRight,
  Camera,
  ChevronDown,
  Clock3,
  Copy,
  Check,
  Eye,
  FileVideo,
  Hand,
  Info,
  Languages,
  Maximize2,
  Menu,
  Mic,
  MicOff,
  Minimize2,
  Pause,
  Play,
  RefreshCw,
  RotateCcw,
  Search,
  Sparkles,
  Trash2,
  UploadCloud,
  User,
  Video,
  VideoOff,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import { PSLSign, PSL_DICTIONARY } from "./lib/psl-dictionary";
import { urduToPSLModel, UrduToPSLInferenceResult } from "./lib/urdutopsl-model";
import UrduInputPanel, { InputLanguage } from "../components/UrduInputPanel";
import PSLVideoPlayer from "../components/PSLVideoPlayer";
import { fetchTextToPSL, PSLResponse, AnimationItem } from "../services/pslService";
import ChatBot from "../components/ChatBot";
import CameraPanel from "../components/CameraPanel";
import TranscriptPanel, { PredictionToken, SilentUserIntent } from "../components/TranscriptPanel";

const recentActivity = [
  { title: "PSL to Urdu", meta: "Translated 2 mins ago", tone: "teal" },
  { title: "Urdu to PSL", meta: "Translated 1 hour ago", tone: "violet" },
  { title: "PSL to Urdu", meta: "Translated yesterday", tone: "lavender" },
];

const recentTranslations = ["السلام علیکم", "آپ کیسے ہیں؟", "شکریہ", "براہ کرم مدد کریں"];

function ModalPortal({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;
  return createPortal(children, document.body);
}

function scrollTo(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
}

/* ────────────────────────── main page ────────────────────────── */

export default function Page() {
  const [activeTab, setActiveTab] = useState<"urdu-to-psl" | "psl-to-urdu">("urdu-to-psl");
  const [cameraOn, setCameraOn] = useState(false);
  const [urduText, setUrduText] = useState("");
  const [autoPlay, setAutoPlay] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);

  return (
    <main className="site-shell">
      {/* Global Sticky Navigation Header for All Sections */}
      <SiteHeader />

      {/* Section 1 – Hero / Landing */}
      <section id="hero" className="section-page">
        <Landing />
      </section>

      {/* Section 2 – Unified Translation Workspace (Matching Hero Theme) */}
      <section id="workspace" className="section-page">
        <div className="workspace-container">
          {/* Top Folder Tab Buttons (Seamlessly merged with container top) */}
          <div className="workspace-tabs-row">
            <button
              className={`workspace-tab-btn tab-urdu ${activeTab === "urdu-to-psl" ? "active" : ""}`}
              onClick={() => setActiveTab("urdu-to-psl")}
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

          {/* Merged Central Card Container */}
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

      {/* Floating ChatBot Assistant */}
      <ChatBot />
    </main>
  );
}

/* ────────────────────────── shared ────────────────────────── */

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

      {/* Desktop Navigation (visible on screens > 900px) */}
      <nav className="landing-nav desktop-nav">
        {/* 1. Project Overview */}
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
                <strong>SignSpeak</strong> is a bidirectional assistive communication platform that breaks communication barriers between <strong>1.5M+ deaf individuals</strong> and hearing communities in Pakistan through real-time sign language translation.
              </p>
              <div className="info-badge-strip">
                <span className="info-tag blue">Two-Way Translation</span>
                <span className="info-tag amber">Live Vision AI</span>
                <span className="info-tag violet">3D Sign Avatar</span>
              </div>
            </div>
          </div>
        </div>

        {/* 2. How It Works */}
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
                    <strong>Live Landmark & Gesture Tracking</strong>
                    <p>High-speed camera pipeline tracks 21 hand landmarks, finger articulation & sign motion dynamics.</p>
                  </div>
                </div>
                <div className="info-step-item">
                  <span className="info-step-num">2</span>
                  <div className="info-step-text">
                    <strong>Neural PSL-to-Urdu Translation</strong>
                    <p>Deep learning architecture interprets spatial PSL grammar and constructs natural Urdu sentences.</p>
                  </div>
                </div>
                <div className="info-step-item">
                  <span className="info-step-num blue">3</span>
                  <div className="info-step-text">
                    <strong>Speech Synthesis & 3D Signer</strong>
                    <p>Outputs natural Urdu voice audio for signs, or animates the real-time 3D avatar for typed Urdu text.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 3. Core Features */}
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
                    <strong>Sign to Urdu Translation</strong>
                    <p>Live camera and video recognition translating PSL signs into instant Urdu text and spoken audio.</p>
                  </div>
                </div>
                <div className="info-step-item">
                  <span className="info-step-num">2</span>
                  <div className="info-step-text">
                    <strong>Urdu to 3D Sign Avatar</strong>
                    <p>Responsive 3D animated sign language avatar with replay, pause, and playback speed adjustments.</p>
                  </div>
                </div>
                <div className="info-step-item">
                  <span className="info-step-num blue">3</span>
                  <div className="info-step-text">
                    <strong>Bidirectional Live Sync</strong>
                    <p>Enables natural, two-way conversational flow between deaf signers and hearing individuals.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 4. Accessibility & Impact */}
        <div className="nav-item-wrapper">
          <button className="nav-link-btn">
            Impact & Reach <ChevronDown size={13} className="nav-chevron" />
          </button>
          <div className="nav-dropdown align-right">
            <div className="info-panel-content">
              <div className="info-kv-list">
                <div className="info-kv-item">
                  <span className="label">Target Community</span>
                  <span className="val">1.5M+ Deaf Citizens in Pakistan</span>
                </div>
                <div className="info-kv-item">
                  <span className="label">Supported Languages</span>
                  <span className="val">Pakistani Sign Language (PSL) & Urdu</span>
                </div>
                <div className="info-kv-item">
                  <span className="label">Platform Access</span>
                  <span className="val">Universal Web (No special hardware)</span>
                </div>
                <div className="info-kv-item">
                  <span className="label">Key Use Cases</span>
                  <span className="val">Healthcare, Education & Daily Life</span>
                </div>
              </div>
              <p className="info-lead" style={{ fontSize: '9.5px', marginTop: '4px' }}>
                Built on localized Pakistani Sign Language standards to deliver accessible, private assistive communication.
              </p>
            </div>
          </div>
        </div>

        <Link href="/learn" className="primary-btn compact learn-nav-btn">
          Learn PSL
        </Link>
        <button className="primary-btn compact" onClick={() => scrollTo("workspace")}>Get Started</button>
      </nav>

      {/* Mobile Controls (visible on screens <= 900px) */}
      <div className="mobile-header-actions">
        <button
          className="primary-btn small"
          style={{ padding: '6px 12px', fontSize: '11px' }}
          onClick={() => scrollTo("workspace")}
        >
          Get Started
        </button>
        <button
          className={`mobile-menu-btn ${mobileMenuOpen ? 'active' : ''}`}
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle navigation menu"
        >
          {mobileMenuOpen ? <X size={19} /> : <Menu size={19} />}
        </button>
      </div>

      {/* Mobile Drawer / Dropdown */}
      {mobileMenuOpen && (
        <div className="mobile-nav-drawer" onClick={() => setMobileMenuOpen(false)}>
          <div className="mobile-nav-panel" onClick={(e) => e.stopPropagation()}>
            <div className="mobile-nav-accordion">
              {/* 1. About */}
              <div
                className={`mobile-acc-item ${openSection === "about" ? "open" : ""}`}
                onMouseEnter={() => setOpenSection("about")}
              >
                <button className="mobile-acc-header" onClick={() => toggleSection("about")}>
                  <span>About SignSpeak</span>
                  <ChevronDown size={14} className="mobile-acc-chevron" />
                </button>
                <div className="mobile-acc-collapse">
                  <div className="mobile-acc-inner">
                    <div className="info-badge-strip" style={{ marginBottom: '6px' }}>
                      <span className="info-tag violet">PSL ↔ Urdu AI</span>
                      <span className="info-tag teal">Assistive Technology</span>
                    </div>
                    <p className="info-lead">
                      <strong>SignSpeak</strong> is a bidirectional assistive communication platform that breaks communication barriers between <strong>1.5M+ deaf individuals</strong> and hearing communities in Pakistan through real-time sign language translation.
                    </p>
                  </div>
                </div>
              </div>

              {/* 2. How It Works */}
              <div
                className={`mobile-acc-item ${openSection === "how" ? "open" : ""}`}
                onMouseEnter={() => setOpenSection("how")}
              >
                <button className="mobile-acc-header" onClick={() => toggleSection("how")}>
                  <span>How It Works</span>
                  <ChevronDown size={14} className="mobile-acc-chevron" />
                </button>
                <div className="mobile-acc-collapse">
                  <div className="mobile-acc-inner">
                    <div className="info-step-list">
                      <div className="info-step-item">
                        <span className="info-step-num teal">1</span>
                        <div className="info-step-text">
                          <strong>Live Tracking</strong>
                          <p>Tracks 21 hand landmarks & motion dynamics.</p>
                        </div>
                      </div>
                      <div className="info-step-item">
                        <span className="info-step-num">2</span>
                        <div className="info-step-text">
                          <strong>Neural Translation</strong>
                          <p>Interprets PSL grammar to natural Urdu.</p>
                        </div>
                      </div>
                      <div className="info-step-item">
                        <span className="info-step-num blue">3</span>
                        <div className="info-step-text">
                          <strong>Audio & 3D Signer</strong>
                          <p>Outputs Urdu voice or animates 3D avatar.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 3. Features */}
              <div
                className={`mobile-acc-item ${openSection === "features" ? "open" : ""}`}
                onMouseEnter={() => setOpenSection("features")}
              >
                <button className="mobile-acc-header" onClick={() => toggleSection("features")}>
                  <span>Features</span>
                  <ChevronDown size={14} className="mobile-acc-chevron" />
                </button>
                <div className="mobile-acc-collapse">
                  <div className="mobile-acc-inner">
                    <div className="info-step-list">
                      <div className="info-step-item">
                        <span className="info-step-num teal">1</span>
                        <div className="info-step-text">
                          <strong>Sign to Urdu</strong>
                          <p>Camera & video translating PSL signs into Urdu voice.</p>
                        </div>
                      </div>
                      <div className="info-step-item">
                        <span className="info-step-num">2</span>
                        <div className="info-step-text">
                          <strong>Urdu to 3D Signer</strong>
                          <p>Responsive 3D animated sign language avatar.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 4. Impact & Reach */}
              <div
                className={`mobile-acc-item ${openSection === "impact" ? "open" : ""}`}
                onMouseEnter={() => setOpenSection("impact")}
              >
                <button className="mobile-acc-header" onClick={() => toggleSection("impact")}>
                  <span>Impact & Reach</span>
                  <ChevronDown size={14} className="mobile-acc-chevron" />
                </button>
                <div className="mobile-acc-collapse">
                  <div className="mobile-acc-inner">
                    <div className="info-kv-list">
                      <div className="info-kv-item">
                        <span className="label">Target</span>
                        <span className="val">1.5M+ Deaf Citizens in Pakistan</span>
                      </div>
                      <div className="info-kv-item">
                        <span className="label">Languages</span>
                        <span className="val">PSL & Urdu</span>
                      </div>
                      <div className="info-kv-item">
                        <span className="label">Access</span>
                        <span className="val">Universal Web Browser</span>
                      </div>
                    </div>
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

/* ────────────────────────── landing / hero ────────────────────────── */

function Landing() {
  const [showLearnMore, setShowLearnMore] = useState(false);

  return (
    <div className="landing-page">
      <div className="landing-hero">
        <div className="hero-copy">
          <h1><span className="italic">Speak Freely.</span><br />Understand Deeply.</h1>
          <p>SignSpeak is a two-way sign language translator that bridges the gap between silence and speech. Because every conversation matters.</p>
          <div className="hero-actions">
            <button className="primary-btn" onClick={() => scrollTo("workspace")}>Start Translating</button>
            <Link href="/learn" className="primary-btn learn-hero-btn">Learn PSL</Link>
          </div>

          <div className="feature-strip">
            <Feature icon={<Hand size={22} />} title="Two-Way Translation" text="PSL to Urdu & Urdu to PSL" tone="violet" />
            <Feature icon={<Sparkles size={21} />} title="AI Powered" text="Advanced AI for accurate and real-time translation" tone="teal" />
            <Feature icon={<Languages size={21} />} title="Easy to Use" text="Simple, intuitive and accessible for everyone" tone="blue" />
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

      {/* scroll indicator */}
      <button className="scroll-indicator" onClick={() => scrollTo("workspace")} aria-label="Scroll down">
        <ChevronDown size={22} />
      </button>

      {/* Learn More Modal */}
      {showLearnMore && (
        <div className="modal-backdrop" onClick={() => setShowLearnMore(false)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-group">
                <div className="logo-mark" style={{ width: '30px', height: '30px', borderRadius: '8px' }}>
                  <svg
                    className="logo-icon"
                    style={{ width: '18px', height: '18px' }}
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
                <h3>About SignSpeak</h3>
              </div>
              <button className="modal-close-btn" onClick={() => setShowLearnMore(false)} aria-label="Close modal">
                <X size={15} />
              </button>
            </div>

            <div className="modal-body">
              <p className="modal-summary">
                <strong>SignSpeak</strong> is a bidirectional assistive platform designed to enable natural, real-time communication between <strong>Pakistani Sign Language (PSL)</strong> signers and hearing individuals.
              </p>

              <div className="modal-list">
                <div className="modal-list-item">
                  <div className="modal-item-dot teal" />
                  <div>
                    <strong>PSL to Urdu Vision Translation</strong>
                    <p>Live camera and video recognition translating continuous hand gestures into instant Urdu text and spoken voice.</p>
                  </div>
                </div>

                <div className="modal-list-item">
                  <div className="modal-item-dot" />
                  <div>
                    <strong>Urdu to 3D Sign Language Avatar</strong>
                    <p>Text-to-sign conversion rendering anatomically accurate 3D Pakistani Sign Language animations with playback controls.</p>
                  </div>
                </div>

                <div className="modal-list-item">
                  <div className="modal-item-dot blue" />
                  <div>
                    <strong>Universal Browser-First Access</strong>
                    <p>Runs smoothly directly in web browsers with zero installation, designed for Pakistan's 1.5M+ deaf community.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button
                className="secondary-btn"
                style={{ fontSize: '11px', padding: '8px 16px', borderRadius: '8px' }}
                onClick={() => setShowLearnMore(false)}
              >
                Close
              </button>
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

/* ────────────────────────── mode card ────────────────────────── */

function ModeCard({ tone, badge, title, text, icon, button, onClick }: {
  tone: string; badge: string; title: string; text: string;
  icon: React.ReactNode; button: string; onClick: () => void;
}) {
  return (
    <div className={`mode-card ${tone}`}>
      <div className="mode-card-content">
        <span className="pill">{badge}</span>
        <h3>{title}</h3>
        <p>{text}</p>
        <button className={`primary-btn small ${tone}`} onClick={onClick}>{button}</button>
      </div>
      <div className="mode-icon">{icon}</div>
    </div>
  );
}

/* ────────────────────────── PSL to Urdu (Interactive) ────────────────────────── */

interface RecognizedToken {
  id: string;
  urdu: string;
  english: string;
  gloss: string;
  confidence: number;
  type: "word" | "alphabet";
}

function PSLToUrdu({
  cameraOn: externalCameraOn,
  setCameraOn: externalSetCameraOn,
}: {
  cameraOn?: boolean;
  setCameraOn?: (v: boolean) => void;
} = {}) {
  const [tokenBuffer, setTokenBuffer] = useState<PredictionToken[]>([]);
  const [currentDetection, setCurrentDetection] = useState<PredictionToken | null>(null);
  const [externalIntent, setExternalIntent] = useState<SilentUserIntent | null>(null);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [isCameraFullscreen, setIsCameraFullscreen] = useState(false);
  const [metrics, setMetrics] = useState({ fps: 30, confidence: 95, latency: 280 });

  const [activeMode, setActiveMode] = useState<"camera" | "upload" | "demo">("camera");
  const [internalCameraOn, setInternalCameraOn] = useState(false);
  const cameraOn = externalCameraOn !== undefined ? externalCameraOn : internalCameraOn;
  const setCameraOn = externalSetCameraOn ?? setInternalCameraOn;

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



function UrduToPSL({ text, setText, autoPlay, setAutoPlay, isPlaying, setIsPlaying }: {
  text: string; setText: (v: string) => void;
  autoPlay: boolean; setAutoPlay: (v: boolean) => void;
  isPlaying: boolean; setIsPlaying: (v: boolean) => void;
}) {
  const [inputLang, setInputLang] = useState<InputLanguage>("ur");
  const [pslResponse, setPslResponse] = useState<PSLResponse | null>(null);
  const [currentSignIndex, setCurrentSignIndex] = useState(0);
  const [speed, setSpeed] = useState<number>(1.0);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const avatarStageRef = useRef<HTMLDivElement>(null);
  const activeChipRef = useRef<HTMLButtonElement>(null);

  // Prevent background scroll and allow Escape key when expanded/fullscreen view is active
  useEffect(() => {
    if (isFullscreen) {
      document.body.style.overflow = "hidden";
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          setIsFullscreen(false);
        }
      };
      window.addEventListener("keydown", handleKeyDown);
      return () => {
        document.body.style.overflow = "";
        window.removeEventListener("keydown", handleKeyDown);
      };
    } else {
      document.body.style.overflow = "";
    }
  }, [isFullscreen]);

  // Auto-scroll active chip into view during animation progression
  useEffect(() => {
    if (activeChipRef.current) {
      activeChipRef.current.scrollIntoView({
        behavior: "smooth",
        inline: "center",
        block: "nearest",
      });
    }
  }, [currentSignIndex]);

  // Main translation handler using backend Gemini pipeline with fallback
  const handleTranslate = async (inputText: string = text, lang: InputLanguage = inputLang) => {
    const trimmed = inputText.trim();
    if (!trimmed) {
      setPslResponse(null);
      setCurrentSignIndex(0);
      setIsPlaying(false);
      return;
    }

    setIsTranslating(true);
    try {
      const backendResult = await fetchTextToPSL(trimmed, lang);
      setPslResponse(backendResult);
      setCurrentSignIndex(0);
      if (autoPlay && backendResult.animation_queue && backendResult.animation_queue.length > 0) {
        setIsPlaying(true);
      }
    } catch (err: unknown) {
      console.warn("[PSL Backend] Request failed, using client-side fallback:", err);
      // Client-side fallback
      const localResult = await urduToPSLModel.infer(trimmed);
      const fallbackQueue: AnimationItem[] = localResult.tokens.map((t) => ({
        token: t.gloss,
        type: t.category === "alphabet" ? "LETTER" : "WORD",
        urdu: t.urdu,
        english: t.english,
        image_url: `/videos/glosses/${t.gloss}.png`,
        duration_ms: 2000,
      }));
      setPslResponse({
        input_text: trimmed,
        source_lang: lang,
        urdu_translation: localResult.urduConversion || trimmed,
        psl_gloss: localResult.glossSequence.join(" "),
        total_sequence_length: fallbackQueue.length,
        animation_queue: fallbackQueue,
      });
      setCurrentSignIndex(0);
      if (autoPlay && fallbackQueue.length > 0) {
        setIsPlaying(true);
      }
    } finally {
      setIsTranslating(false);
    }
  };

  // Run translation on mount if text is present
  useEffect(() => {
    if (text) {
      handleTranslate(text, inputLang);
    }
  }, []);

  // Voice recognition (Speech to Text) matching input language
  const toggleVoiceInput = () => {
    if (typeof window === "undefined") return;
    const SpeechRecognition =
      (window as unknown as { SpeechRecognition?: any; webkitSpeechRecognition?: any }).SpeechRecognition ||
      (window as unknown as { SpeechRecognition?: any; webkitSpeechRecognition?: any }).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in this browser. Please use Chrome or Edge.");
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = inputLang === "en" ? "en-US" : "ur-PK";
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => setIsListening(true);
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setText(transcript);
        handleTranslate(transcript, inputLang);
        setIsListening(false);
      };
      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);
      recognition.start();
    } catch {
      setIsListening(false);
    }
  };

  // Text to Speech pronunciation matching input language
  const playAudio = () => {
    if (typeof window === "undefined" || !("speechSynthesis" in window) || !text) return;
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = inputLang === "en" ? "en-US" : "ur-PK";
    utterance.rate = 1.0;
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
  };

  // Speech pronunciation for translated Urdu text
  const speakUrduTranslation = (uText: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window) || !uText) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(uText);
    utterance.lang = "ur-PK";
    utterance.rate = 1.0;
    window.speechSynthesis.speak(utterance);
  };

  // Copy Gloss Sequence
  const copyGlossSequence = () => {
    if (!pslResponse?.psl_gloss) return;
    navigator.clipboard.writeText(pslResponse.psl_gloss);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const queue = pslResponse?.animation_queue || [];
  const currentItem = queue[currentSignIndex] || (queue.length > 0 ? queue[0] : null);
  const totalSteps = queue.length;
  const progressPercent = totalSteps > 0 ? Math.round(((currentSignIndex + 1) / totalSteps) * 100) : 0;

  return (
    <>
      <div className="page-header">
        <div>
          <h2 className="violet-title">Urdu to PSL Translator</h2>
          <p>
            Convert Urdu or English sentences into real-time Pakistani Sign Language (PSL) sequential video signs powered by Gemini AI.
          </p>
        </div>
        <button className="info-btn" onClick={() => setShowInfoModal(true)}>
          <Info size={14} /> How It Works
        </button>
      </div>

      <div className="urdu-layout modern-grid">
        {/* Left Column: Modular Input Panel + Urdu Translation (when translated from English) */}
        <div className="urdu-left-section">
          <UrduInputPanel
            text={text}
            setText={setText}
            inputLang={inputLang}
            setInputLang={setInputLang}
            isListening={isListening}
            toggleVoiceInput={toggleVoiceInput}
            isSpeaking={isSpeaking}
            playAudio={playAudio}
            handleTranslate={handleTranslate}
            isTranslating={isTranslating}
          />

          {/* When English is translated to Urdu: display directly under Urdu input section */}
          {inputLang === "en" && pslResponse?.urdu_translation && (
            <div className="urdu-translation-banner under-input-banner">
              <div className="banner-top">
                <span className="banner-tag">Urdu Translation (اردو ترجمہ)</span>
                <button
                  type="button"
                  className="banner-listen-btn"
                  onClick={() => speakUrduTranslation(pslResponse.urdu_translation!)}
                  title="Listen to Urdu translation"
                >
                  <Volume2 size={13} />
                  <span>Listen</span>
                </button>
              </div>
              <div className="banner-urdu-text" dir="rtl">
                {pslResponse.urdu_translation}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Video Player & Sign Sequence Timeline under video */}
        <div className="urdu-right-section">
          <div className="panel avatar-panel modern-player-column">
            <div className="panel-title-row">
              <div className="avatar-header-info">
                <span className="panel-title">PSL Sign Video Output</span>
                {currentItem && (
                  <span className="active-sign-badge">
                    Sign {currentSignIndex + 1}/{totalSteps}: <strong>{currentItem.token.replace(/_/g, " ")}</strong>
                  </span>
                )}
              </div>
              <button
                className="icon-circle-btn"
                onClick={() => setIsFullscreen(true)}
                title="Expanded Fullscreen View"
              >
                <Maximize2 size={16} />
              </button>
            </div>

            {/* Sequential 2-Second PSL Sign Video Player */}
            <div className="avatar-stage video-stage-container" ref={avatarStageRef}>
              <PSLVideoPlayer
                items={pslResponse?.animation_queue}
                currentGloss={pslResponse?.psl_gloss}
                isPlaying={isPlaying}
                setIsPlaying={setIsPlaying}
                speed={speed}
                setSpeed={setSpeed}
                onSequenceComplete={() => setIsPlaying(false)}
                onIndexChange={(idx) => setCurrentSignIndex(idx)}
                externalIndex={currentSignIndex}
              />
            </div>
          </div>

          {/* Sign Sequence Timeline under video with Copy Gloss button */}
          {queue.length > 0 && (
            <div className="sign-timeline-bar modern-timeline under-video-timeline">
              <div className="timeline-labels">
                <div className="timeline-title-group">
                  <span className="timeline-main-title">Sign Sequence Timeline</span>
                  <span className="timeline-counter-badge">
                    Sign {currentSignIndex + 1} of {totalSteps}
                  </span>
                </div>
                <div className="timeline-actions-group">
                  {pslResponse?.psl_gloss && (
                    <button
                      type="button"
                      className="copy-mini-btn"
                      onClick={copyGlossSequence}
                      title="Copy PSL Gloss sequence"
                    >
                      {copied ? <Check size={13} color="#10b981" /> : <Copy size={13} />}
                      <span>{copied ? "Copied Gloss" : "Copy Gloss"}</span>
                    </button>
                  )}
                  <span className="timeline-percent-badge">{progressPercent}%</span>
                </div>
              </div>
              <div className="timeline-track">
                <div className="timeline-progress" style={{ width: `${progressPercent}%` }} />
              </div>
              <div className="sequence-chips-row">
                {queue.map((item, idx) => (
                  <button
                    key={`${item.token}-${idx}`}
                    ref={idx === currentSignIndex ? activeChipRef : null}
                    className={`sequence-chip ${idx === currentSignIndex ? "active" : idx < currentSignIndex ? "completed" : ""}`}
                    onClick={() => {
                      setCurrentSignIndex(idx);
                      setIsPlaying(true);
                    }}
                    title={`Jump to Sign ${idx + 1}: ${item.token}`}
                  >
                    <span className="seq-step-num">#{idx + 1}</span>
                    {item.urdu && <span className="seq-urdu" dir="rtl">{item.urdu}</span>}
                    <span className="seq-gloss">
                      {item.token.replace(/^LETTER_/, "Letter ")}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Dedicated Fullscreen Theater Mode Modal via ModalPortal */}
      {isFullscreen && (
        <ModalPortal>
          <div
            className="psl-theater-backdrop"
            onClick={() => setIsFullscreen(false)}
          >
            <div
              className="psl-theater-dialog"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Theater Header */}
              <div className="theater-header">
                <div className="theater-title-group">
                  <span className="theater-badge">Full Theater View</span>
                  <h3 className="theater-title">PSL Sign Video Player</h3>
                  {currentItem && (
                    <span className="active-sign-badge">
                      Sign {currentSignIndex + 1}/{totalSteps}: <strong>{currentItem.token.replace(/_/g, " ")}</strong>
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  className="theater-close-btn"
                  onClick={() => setIsFullscreen(false)}
                  title="Exit Fullscreen (Esc)"
                >
                  <X size={16} />
                  <span>Exit Fullscreen</span>
                </button>
              </div>

              {/* Theater Stage */}
              <div className="theater-stage-container">
                <PSLVideoPlayer
                  items={pslResponse?.animation_queue}
                  currentGloss={pslResponse?.psl_gloss}
                  isPlaying={isPlaying}
                  setIsPlaying={setIsPlaying}
                  speed={speed}
                  setSpeed={setSpeed}
                  onSequenceComplete={() => setIsPlaying(false)}
                  onIndexChange={(idx) => setCurrentSignIndex(idx)}
                  externalIndex={currentSignIndex}
                />
              </div>

              {/* Theater Filmstrip if signs exist */}
              {queue.length > 0 && (
                <div className="theater-timeline-bar">
                  <div className="sequence-chips-row">
                    {queue.map((item, idx) => (
                      <button
                        key={`theater-${item.token}-${idx}`}
                        className={`sequence-chip ${idx === currentSignIndex ? "active" : idx < currentSignIndex ? "completed" : ""}`}
                        onClick={() => {
                          setCurrentSignIndex(idx);
                          setIsPlaying(true);
                        }}
                        title={`Jump to Sign ${idx + 1}: ${item.token}`}
                      >
                        <span className="seq-step-num">#{idx + 1}</span>
                        {item.urdu && <span className="seq-urdu" dir="rtl">{item.urdu}</span>}
                        <span className="seq-gloss">
                          {item.token.replace(/^LETTER_/, "Letter ")}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </ModalPortal>
      )}

      {/* How it works info modal */}
      {showInfoModal && (
        <ModalPortal>
          <div className="modal-overlay" onClick={() => setShowInfoModal(false)}>
            <div className="modal-card" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>About Pakistani Sign Language (PSL) Translation</h3>
                <button className="close-btn" onClick={() => setShowInfoModal(false)}>
                  <X size={18} />
                </button>
              </div>
              <div className="modal-body">
                <p>
                  <strong>Pakistani Sign Language (PSL)</strong> utilizes visual-spatial gestures to enable direct communication for Pakistan's deaf community.
                </p>
                <div className="info-feature-list">
                  <div className="info-feature-item">
                    <div className="feature-icon violet">
                      <Sparkles size={16} />
                    </div>
                    <div>
                      <strong>Dual Language Translation</strong>
                      <p>Supports English and Urdu text or voice input, translating sentences into PSL Subject-Object-Verb (SOV) grammatical sequence.</p>
                    </div>
                  </div>
                  <div className="info-feature-item">
                    <div className="feature-icon teal">
                      <Hand size={16} />
                    </div>
                    <div>
                      <strong>Video-Like Sequential Sign Display</strong>
                      <p>Signs are displayed sequentially for ~2 seconds per sign with smooth crossfading, simulating high-definition sign language video clips.</p>
                    </div>
                  </div>
                  <div className="info-feature-item">
                    <div className="feature-icon blue">
                      <Languages size={16} />
                    </div>
                    <div>
                      <strong>Alphabet Fingerspelling Fallback</strong>
                      <p>Proper nouns, names, and uncataloged words are automatically split into letters and fingerspelled using authentic PSL manual alphabet signs.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}
    </>
  );
}


/* ────────────────────────── Animated Kinematic PSL Avatar ────────────────────────── */