"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  X,
  Send,
  MessageCircle,
  ChevronDown,
  Bot,
  User,
  Sparkles,
  Hand,
  Languages,
  HelpCircle,
  ShieldCheck,
  HeartHandshake,
  Cpu,
  RefreshCw,
  Camera,
  CheckCircle2,
} from "lucide-react";
import { signBridgeAPI } from "@/app/lib/api";
import { useLanguage } from "@/app/context/LanguageContext";

/* ─────────────────────── Types ─────────────────────── */

interface Message {
  id: string;
  role: "bot" | "user";
  text: string;
  time: string;
  source?: string;
  suggestions?: string[];
}

interface KBEntry {
  keywords: string[];
  answer: string;
  suggestions?: string[];
}

/* ─────────────────────── Comprehensive Knowledge Base ─────────────────────── */

const KB: KBEntry[] = [
  // ── Welcome & Greetings ──
  {
    keywords: ["hello", "hi", "hey", "salam", "السلام", "assalam", "start", "help"],
    answer:
      "### 👋 Welcome to SignBot!\n\nI am your **SignSpeak Assistant**, specialized in **Ethical Sign Language**, **Deaf Community Etiquette**, and guiding you through **all features of our app**.\n\nHow can I help you today?",
    suggestions: [
      "What are the rules of Deaf etiquette?",
      "What is ethical AI in sign language?",
      "How does Urdu to PSL work?",
      "How does PSL to Urdu work?",
    ],
  },

  // ── Ethical Sign Language: Deaf Culture & Etiquette ──
  {
    keywords: [
      "etiquette",
      "rules",
      "deaf etiquette",
      "how to behave",
      "grab hands",
      "touch hands",
      "attention",
      "eye contact",
      "polite",
      "manners",
    ],
    answer:
      "### 🤝 Essential Rules of Deaf Etiquette & Ethical Communication\n\nWhen communicating with Deaf individuals, observing cultural etiquette shows respect and builds trust:\n\n" +
      "1. **Never Grab a Signer's Hands** 🚫\n" +
      "   • Grabbing a Deaf person's hands while they sign is the physical equivalent of covering someone's mouth to silence them.\n\n" +
      "2. **Maintain Direct Eye Contact** 👀\n" +
      "   • Always look at the signer's eyes and face, NOT down at their hands. Looking away while they sign is viewed as abruptly walking away from a conversation.\n\n" +
      "3. **Getting Attention Politely** 🙋\n" +
      "   • Wave gently in their visual field, lightly tap on the upper arm or shoulder, or flicker the room lights in a group setting. Never kick chairs, slap, or throw objects.\n\n" +
      "4. **Speak Directly to the Person, Not the App/Interpreter** 👥\n" +
      "   • Look directly at the Deaf communicator. Avoid phrases like *'tell him'* or *'ask her'*.\n\n" +
      "5. **Walking Through a Sign Conversation** 🚶\n" +
      "   • If two people are signing in a corridor, do not stop and stare or duck dramatically. Walk through smoothly without drawing attention.",
    suggestions: [
      "What respectful terminology should I use?",
      "What is ethical AI in sign language?",
      "Is PSL a complete language?",
    ],
  },

  // ── Ethical Sign Language: Respectful Terminology ──
  {
    keywords: [
      "terminology",
      "mute",
      "dumb",
      "gonge",
      "behray",
      "offensive",
      "deaf mute",
      "deaf and dumb",
      "what word to use",
      "how to call deaf",
      "respectful words",
    ],
    answer:
      "### 💬 Respectful Terminology in Sign Language\n\nLanguage carries deep cultural impact. Here is how to refer to the Deaf community with dignity:\n\n" +
      "✅ **Respectful & Preferred Terms:**\n" +
      "• **\"Deaf\"** (ڈیف / قوتِ سماعت سے محروم افراد)\n" +
      "• **\"Hard of Hearing\"** (کم سننے والا فرد)\n" +
      "• **\"Deaf Community\"** (ڈیف کمیونٹی / بہرے افراد کی برادری)\n\n" +
      "❌ **Outdated & Offensive Terms to Strictly Avoid:**\n" +
      "• **\"Deaf-Mute\"** or **\"Deaf and Dumb\"**\n" +
      "• **\"گونگا بہرا\"** (Gonga Behra)\n\n" +
      "💡 **Why?** Deaf people are NOT 'dumb' or 'mute'. Their vocal mechanisms are functional, and they express themselves fluently in their complete native language: **Pakistani Sign Language (PSL)**.",
    suggestions: [
      "What are the rules of Deaf etiquette?",
      "Is PSL a complete language?",
      "What is ethical AI in sign language?",
    ],
  },

  // ── Ethical Sign Language: AI Ethics & Language Sovereignty ──
  {
    keywords: [
      "ethical ai",
      "ai ethics",
      "hearing saviorism",
      "saviorism",
      "ownership",
      "language sovereignty",
      "replace interpreter",
      "hospital",
      "court",
      "legal",
    ],
    answer:
      "### 🛡️ Ethical AI Principles in SignSpeak\n\nSignSpeak is committed to responsible, community-centered technology:\n\n" +
      "1. **Centering Deaf Community Ownership** 🤲\n" +
      "   • Sign language belongs to the Deaf community. Technology must empower and bridge communication rather than appropriate or attempt to 'cure' Deaf identity ('Hearing Saviorism').\n\n" +
      "2. **Assistive Bridge vs. Professional Interpreters** ⚖️\n" +
      "   • SignSpeak is an assistive bridge for daily conversations, family connection, and educational learning.\n" +
      "   • **Crucial Safety Note:** For critical medical diagnoses, legal hearings, courtroom testimony, or mental health consultations, **certified human sign language interpreters must always be used**.\n\n" +
      "3. **Informed Consent & Privacy** 🔒\n" +
      "   • Never film a Deaf person signing without their explicit, informed consent.\n" +
      "   • SignSpeak does NOT harvest or resell biometric gesture data.",
    suggestions: [
      "How does SignSpeak protect privacy?",
      "How does the 5-step recognition work?",
      "What are the rules of Deaf etiquette?",
    ],
  },

  // ── Ethical Sign Language: PSL as a Natural Language & Non-Manual Markers ──
  {
    keywords: [
      "psl grammar",
      "natural language",
      "is psl a language",
      "non manual",
      "facial expressions",
      "grammar",
      "syntax",
      "sov",
      "dialects",
      "regional",
    ],
    answer:
      "### 🇵🇰 Pakistani Sign Language (PSL): Linguistic Status & Ethics\n\n• **A Complete Natural Language:** PSL is NOT mere pantomime or signed Urdu word-by-word. It possesses its own rich morphology, spatial grammar, and **Subject-Object-Verb (SOV)** syntax.\n\n" +
      "• **Non-Manual Markers (NMMs) are Grammatical:** In PSL, facial expressions (raised eyebrows, tilted head, mouth shapes) are **grammatical necessities**, not emotional theatrics. For example, a raised eyebrow marks a yes/no question, while furrowed brows mark a question word (کہاں, کیوں).\n\n" +
      "• **Respecting Regional Dialects:** PSL has authentic regional dialects across Pakistan (Karachi, Lahore, Rawalpindi/Islamabad, Peshawar, Quetta, Multan). Ethical communication honors these regional variations rather than imposing a single artificial standard.",
    suggestions: [
      "What signs are supported in the app?",
      "How does Urdu to PSL work?",
      "What is Deaf etiquette?",
    ],
  },

  // ── About SignSpeak (App Overview) ──
  {
    keywords: ["what is signspeak", "about", "what is this app", "overview", "our app", "project", "signspeak"],
    answer:
      "### 🌟 About SignSpeak — Two-Way PSL Platform\n\n**SignSpeak** is an inclusive, browser-native two-way communication system designed for **1.5M+ deaf individuals** and hearing communities across Pakistan.\n\n" +
      "• 🔤 **Urdu → PSL (3D Avatar):** Type Urdu or Roman Urdu (e.g. *شکریہ*, *salam*, *madad*) and an interactive 3D avatar signs the translation in real-time.\n" +
      "• 📷 **PSL → Urdu (Video Recognition):** Use your camera or upload a video. Our unified 5-step pipeline detects gestures and translates them into natural, spoken Urdu sentences with Text-to-Speech (TTS).\n\n" +
      "No installation or special sensory gloves needed — it runs directly in modern browsers!",
    suggestions: [
      "How does Urdu to PSL work?",
      "How does PSL to Urdu work?",
      "What is the 5-step recognition pipeline?",
    ],
  },

  // ── Teaching Signs: How to Sign Thank You ──
  {
    keywords: ["thank you", "thanks", "shukriya", "شکریہ", "how to sign thank you", "how can i sign thank you"],
    answer:
      "### 🙏 How to Sign \"Thank You\" (شکریہ) in PSL\n\n" +
      "1. **Handshape:** Flatten your dominant hand with fingers straight together and thumb gently tucked.\n" +
      "2. **Starting Position:** Touch the tips of your fingers lightly to your chin or lower cheek.\n" +
      "3. **Movement:** Move your hand forward and slightly downward toward the person with your palm facing upward, as if offering sincere gratitude.\n" +
      "4. **Non-Manual Marker (Facial Expression):** Smile warmly and give a slight head nod. In PSL, facial expressions are grammatical essentials that convey sincerity!\n\n" +
      "💡 **Deaf Etiquette Reminder:** Maintain direct eye contact with the person's face/eyes while signing—never stare at their hands.\n\n" +
      "👉 *Tip: Switch to the **Urdu to PSL** tab, type 'شکریہ' or 'thank you', and watch our 3D avatar demonstrate this sign in 3D!*",
    suggestions: [
      "How do I sign \"Assalam-o-Alaikum\" (سلام)?",
      "What are the rules of Deaf etiquette?",
      "How does Urdu to PSL work?",
    ],
  },

  // ── Teaching Signs: How to Sign Salam / Greeting ──
  {
    keywords: ["salam", "assalam", "hello", "greeting", "ہیلو", "السلام علیکم", "how to sign salam", "how to sign hello"],
    answer:
      "### ✋ How to Sign \"Assalam-o-Alaikum\" (سلام / السلام علیکم) in PSL\n\n" +
      "1. **Handshape:** Open, flat dominant hand with fingers held together and thumb aligned.\n" +
      "2. **Starting Position:** Place fingertips gently near your right temple / forehead (resembling a polite, welcoming salute).\n" +
      "3. **Movement:** Sweep your hand outward and slightly forward toward the recipient in a smooth, welcoming arc.\n" +
      "4. **Non-Manual Marker:** Accompany with direct eye contact, a slight head bow, and a welcoming smile.\n\n" +
      "💡 **Cultural Note:** Direct eye contact is a key sign of respect in Deaf culture. You can test this sign in the **Urdu to PSL** tab or test your webcam recognition in **PSL to Urdu**!",
    suggestions: [
      "How do I sign \"Thank You\" (شکریہ)?",
      "What is the best way to get a Deaf person's attention?",
      "How does the camera recognize signs?",
    ],
  },

  // ── Teaching Signs: How to Sign Water ──
  {
    keywords: ["water", "pani", "پانی", "how to sign water"],
    answer:
      "### 💧 How to Sign \"Water\" (پانی) in PSL\n\n" +
      "1. **Handshape:** Form a 'W' shape or extended three fingers (index, middle, ring), or a slightly cupped hand.\n" +
      "2. **Position:** Bring your fingertips lightly to the corner of your mouth or chin.\n" +
      "3. **Movement:** Tap lightly twice near your lower lip/chin, signifying water or drinking.\n" +
      "4. **Facial Expression:** Natural engaged facial posture.\n\n" +
      "👉 *Try it in SignSpeak: Record yourself signing in **PSL → Urdu** mode or view it on the 3D avatar in **Urdu → PSL**!*",
    suggestions: [
      "How do I sign \"Thank You\"?",
      "What signs are supported by the camera?",
      "How does Urdu to PSL work?",
    ],
  },

  // ── App Feature: Urdu to PSL (Avatar & Input) ──
  {
    keywords: [
      "urdu to psl",
      "translate urdu",
      "type urdu",
      "text to sign",
      "roman urdu",
      "how to translate",
    ],
    answer:
      "### 🔤 How Urdu → PSL Translation Works in SignSpeak\n\n1. Select the **'Urdu to PSL'** tab in the main workspace.\n" +
      "2. **Type your text:** You can type native **Urdu script** (e.g., *شکریہ*, *پانی*, *ڈاکٹر*) OR **Roman Urdu** (e.g., *salam*, *madad*, *shukriya*).\n" +
      "3. Click **'Translate'**.\n" +
      "4. The system executes our translation engine:\n" +
      "   • **Rule-based & fuzzy matching** for instant offline response\n" +
      "   • **Gemini NLU** for complex linguistic phrasing & PSL gloss sequence generation\n" +
      "   • **Fingerspelling fallback** for novel words or proper names\n" +
      "5. The 3D avatar smoothly animates the signs! Use playback buttons (Play, Pause, Replay, 0.5×–2× speed) to review.",
    suggestions: [
      "How does the 3D avatar work?",
      "What is fingerspelling?",
      "How does PSL to Urdu work?",
    ],
  },

  // ── App Feature: 3D Avatar Engine ──
  {
    keywords: [
      "3d avatar",
      "avatar",
      "xbot",
      "animation",
      "3d model",
      "slerp",
      "joints",
      "playback",
      "speed",
      "expanded view",
    ],
    answer:
      "### 🤖 The 3D Sign Avatar Engine\n\nBuilt with Three.js & React Three Fiber:\n\n" +
      "• **Anatomical Accuracy:** Uses a rigged humanoid model with **35+ articulated joints**, including individual finger segments for authentic fingerspelling.\n" +
      "• **Smooth Animation:** Interpolates bone positions and rotations using **quaternion spherical linear interpolation (Slerp)**.\n" +
      "• **Interactive Controls:**\n" +
      "  ▶️ Play / ⏸️ Pause / 🔄 Replay\n" +
      "  ⚡ Variable speed: 0.5× (learning mode), 1.0×, 1.5×, 2.0×\n" +
      "  🏷️ Interactive Sign Chips: Click any sign chip to jump directly to that gesture\n" +
      "  🖥️ Expanded View: Enlarge the viewport or orbit/zoom the 3D camera with your mouse.",
    suggestions: [
      "What is fingerspelling?",
      "Can I type Roman Urdu?",
      "How does PSL to Urdu work?",
    ],
  },

  // ── App Feature: PSL to Urdu (5-Step Pipeline) ──
  {
    keywords: [
      "psl to urdu",
      "camera",
      "recognition",
      "detect",
      "pipeline",
      "5-step",
      "5 step",
      "bilstm",
      "mediapipe",
      "opencv",
      "fallback",
    ],
    answer:
      "### 📷 How PSL → Urdu Video Recognition Works (Unified 5-Step Pipeline)\n\nSignSpeak uses a state-of-the-art hybrid AI architecture:\n\n" +
      "1. **Step 1: Video Preprocessing (OpenCV)**\n" +
      "   • Standardizes video to 30 FPS, uniform 640×480 resolution, and temporal normalization.\n\n" +
      "2. **Step 2: Landmark Extraction (MediaPipe)**\n" +
      "   • Extracts upper-body pose & 21 hand landmarks per hand (462-dim combined spatial + velocity feature vector) normalized to body torso & wrists.\n\n" +
      "3. **Step 3: Kinetic Temporal Segmentation**\n" +
      "   • Analyzes motion energy and kinetic velocity profiles to segment continuous gestures into individual sign intervals.\n\n" +
      "4. **Step 4: Sequence Classification (BiLSTM / Conv1D)**\n" +
      "   • Classifies core in-distribution PSL vocabulary (e.g. *less*, *careful*, *noisy*, *dangerous*, *fantastic*).\n\n" +
      "5. **Step 5: Gemini Multimodal Vision Fallback & Language Refinement**\n" +
      "   • If gestures are open-vocabulary or out-of-distribution (e.g. *Assalam-o-Alaikum*, *Water*, *Hello*), Gemini Vision analyzes keyframes with PSL linguistic grounding and formulates natural Urdu SOV sentences.\n" +
      "   • Click **🔊 Speak** to hear the Urdu translation spoken aloud!",
    suggestions: [
      "What signs are supported?",
      "Camera not working?",
      "What is ethical AI in sign language?",
    ],
  },

  // ── App Feature: Supported Signs & Vocabulary ──
  {
    keywords: ["supported signs", "which words", "vocabulary", "sign list", "what signs", "classes"],
    answer:
      "### 🖐️ Supported Vocabulary in SignSpeak\n\nSignSpeak supports a dual-tier vocabulary:\n\n" +
      "1. **Core 31-Class Neural Dataset:**\n" +
      "   • *Alert, Careful, Cheap, Crazy, Dangerous, Decent, Dumb, Excited, Extreme, Fantastic, Far, Fearful, Foreign, Funny, Good, Healthy, Heavy, Important, Intelligent, Interesting, Late, Less, New, No, Noisy, Peaceful, Quick, Ready, Secure, Smart, Yes*.\n\n" +
      "2. **Open-Vocabulary Multimodal Recognition:**\n" +
      "   • Cultural greetings (السلام علیکم / Assalam-o-Alaikum, ہیلو / Hello)\n" +
      "   • Everyday needs (پانی / Water, کھانا / Food, مدد / Help, شکریہ / Thank You)\n\n" +
      "3. **Fingerspelling Fallback:**\n" +
      "   • Any name or unlisted word typed in Urdu or Roman Urdu is spelled letter-by-letter on the 3D avatar using the official PSL finger alphabet.",
    suggestions: [
      "How does fingerspelling work?",
      "How does the camera recognize signs?",
      "What is Deaf etiquette?",
    ],
  },

  // ── App Feature: Camera Troubleshooting ──
  {
    keywords: ["camera not working", "camera error", "permission", "allow camera", "webcam not", "lighting"],
    answer:
      "### 🔧 Camera & Video Troubleshooting Tips\n\nIf you experience issues with live recognition:\n\n" +
      "1. **Allow Permissions:** Click **Allow** when the browser prompts for camera access.\n" +
      "2. **Optimal Framing:** Keep your upper body (head, shoulders, and both hands) visible inside the camera frame.\n" +
      "3. **Good Lighting:** Ensure your face and hands are clearly lit from the front, avoiding harsh backlighting.\n" +
      "4. **Close Other Camera Apps:** Ensure Zoom, Teams, or Skype are closed so they do not lock the webcam.\n" +
      "5. **Use Video Upload:** You can also click the **Upload** tab and select any pre-recorded `.mp4` or `.webm` sign video!",
    suggestions: [
      "Can I upload a video instead?",
      "How does the 5-step recognition work?",
      "How does Urdu to PSL work?",
    ],
  },

  // ── App Feature: Text to Speech (TTS) ──
  {
    keywords: ["tts", "speak", "voice", "audio", "sound", "read aloud", "speaker"],
    answer:
      "### 🔊 Text-to-Speech (TTS) Readout\n\nSignSpeak includes native Urdu speech synthesis:\n\n" +
      "• Once a sign is recognized in the **PSL → Urdu** tab, click the **🔊 Speak** button.\n" +
      "• SignSpeak reads the Urdu translation aloud in a natural voice, bridging the communication gap for hearing individuals who do not know sign language.\n" +
      "• Click the button again at any time to pause speech playback.",
    suggestions: [
      "How does PSL to Urdu work?",
      "What is ethical AI in sign language?",
    ],
  },

  // ── Privacy & Security ──
  {
    keywords: ["privacy", "data", "safe", "secure", "record", "camera privacy"],
    answer:
      "### 🔒 Privacy & Data Protection\n\n• **Zero Facial Recognition:** SignSpeak extracts spatial joint coordinates (skeletal landmarks), NOT biometric identity or facial recognition data.\n" +
      "• **No Video Storage:** Live webcam streams are processed in temporary browser memory or through secure inference endpoints. Your video is never saved, archived, or sold to third parties.\n" +
      "• **Informed Consent:** We strongly advocate ethical signing standards: always inform signers before using camera-based assistive tools.",
    suggestions: [
      "What is ethical AI in sign language?",
      "What are the rules of Deaf etiquette?",
    ],
  },
];

const DEFAULT_SUGGESTIONS = [
  "What are the rules of Deaf etiquette?",
  "What is ethical AI in sign language?",
  "How does Urdu to PSL work?",
  "How does PSL to Urdu work?",
];

/* ─────────────────────── Quick Actions ─────────────────────── */

const QUICK_ACTIONS = [
  { icon: <Hand size={13} />, label: "Sign 'Thank You'", query: "How can I sign 'Thank You' (شکریہ) in Pakistani Sign Language?" },
  { icon: <HeartHandshake size={13} />, label: "Deaf Etiquette", query: "What are the essential rules of Deaf etiquette when communicating in sign language?" },
  { icon: <ShieldCheck size={13} />, label: "Ethical AI", query: "What is ethical AI in sign language and how does SignSpeak respect Deaf community ownership?" },
  { icon: <Languages size={13} />, label: "Urdu → PSL", query: "How does Urdu to PSL translation work with the 3D avatar?" },
  { icon: <Camera size={13} />, label: "PSL → Urdu", query: "How does the 5-step PSL to Urdu camera recognition pipeline work?" },
  { icon: <HelpCircle size={13} />, label: "About PSL", query: "Is Pakistani Sign Language a complete natural language with its own grammar?" },
];

/* ─────────────────────── Helpers ─────────────────────── */

function getTime() {
  return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function uid() {
  return Math.random().toString(36).slice(2);
}

function findAnswer(query: string): { answer: string; suggestions: string[] } {
  const q = query.toLowerCase().trim();
  let bestMatch: KBEntry | null = null;
  let bestScore = 0;

  for (const entry of KB) {
    let score = 0;
    for (const kw of entry.keywords) {
      if (q.includes(kw)) {
        score += kw.split(" ").length * 2;
      }
    }
    if (score > bestScore) {
      bestScore = score;
      bestMatch = entry;
    }
  }

  if (bestMatch && bestScore > 0) {
    return {
      answer: bestMatch.answer,
      suggestions: bestMatch.suggestions ?? DEFAULT_SUGGESTIONS,
    };
  }

  return {
    answer:
      "### Welcome to SignBot! 🤟\n\n" +
      "I can answer any questions about **Ethical Sign Language** (Deaf etiquette, cultural norms, respectful terminology, AI ethics) or **SignSpeak App Operations** (Urdu-to-PSL avatar, 5-step video recognition, and troubleshooting).\n\n" +
      "Try asking one of the suggested topics below, or click any quick action chip!",
    suggestions: DEFAULT_SUGGESTIONS,
  };
}

/** Rich Markdown Parser for SignBot: headers, bold, bullet points, numbers */
function renderMarkdown(text: string) {
  const lines = text.split("\n");
  return lines.map((line, idx) => {
    // Heading 3
    if (line.startsWith("### ")) {
      return (
        <h4 key={idx} style={{ fontSize: "13.5px", fontWeight: "700", margin: "6px 0 3px", color: "inherit" }}>
          {line.replace("### ", "")}
        </h4>
      );
    }
    // Heading 2
    if (line.startsWith("## ")) {
      return (
        <h3 key={idx} style={{ fontSize: "14.5px", fontWeight: "700", margin: "8px 0 4px", color: "inherit" }}>
          {line.replace("## ", "")}
        </h3>
      );
    }
    // Bullet item
    if (line.trim().startsWith("• ") || line.trim().startsWith("- ") || line.trim().startsWith("* ")) {
      const content = line.trim().replace(/^[•\-*]\s+/, "");
      return (
        <div key={idx} style={{ display: "flex", gap: "6px", margin: "2px 0", paddingLeft: "4px" }}>
          <span style={{ opacity: 0.7 }}>•</span>
          <span>{parseInlineMarkdown(content)}</span>
        </div>
      );
    }
    // Horizontal rule
    if (line.trim() === "---") {
      return <hr key={idx} style={{ border: "none", borderTop: "1px solid rgba(0,0,0,0.08)", margin: "8px 0" }} />;
    }
    // Empty line
    if (!line.trim()) {
      return <div key={idx} style={{ height: "4px" }} />;
    }
    // Regular paragraph
    return (
      <p key={idx} style={{ margin: "2px 0", lineHeight: "1.45" }}>
        {parseInlineMarkdown(line)}
      </p>
    );
  });
}

function parseInlineMarkdown(text: string) {
  // Bold **text**
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    // Italic *text*
    const subParts = part.split(/(\*[^*]+\*)/g);
    return subParts.map((sub, j) => {
      if (sub.startsWith("*") && sub.endsWith("*")) {
        return <em key={`${i}-${j}`}>{sub.slice(1, -1)}</em>;
      }
      return sub;
    });
  });
}

/* ─────────────────────── Component ─────────────────────── */

export default function ChatBot() {
  const { t, isUrdu } = useLanguage();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: uid(),
      role: "bot",
      text:
        "### 👋 Hello! I'm SignBot\n\n" +
        "I'm here to answer questions about **Ethical Sign Language** (Deaf culture & etiquette, respectful terminology, AI ethics) and **SignSpeak** (3D avatar translation, 5-step video recognition, and troubleshooting).\n\n" +
        "How can I assist you today?",
      time: getTime(),
      source: "knowledge_base",
      suggestions: DEFAULT_SUGGESTIONS,
    },
  ]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [unread, setUnread] = useState(0);
  const [minimized, setMinimized] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Scroll to bottom on new message
  useEffect(() => {
    if (open && !minimized) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, open, minimized]);

  // Focus input when opened
  useEffect(() => {
    if (open && !minimized) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [open, minimized]);

  const sendMessage = useCallback(
    async (text: string) => {
      const q = text.trim();
      if (!q) return;
      setInput("");

      const userMsg: Message = { id: uid(), role: "user", text: q, time: getTime() };
      setMessages((prev) => [...prev, userMsg]);
      setTyping(true);

      // Prepare conversation history for the AI backend
      const history = messages.slice(-6).map((m) => ({ role: m.role, text: m.text }));

      try {
        // Attempt backend AI query with ethical grounding
        const aiResponse = await signBridgeAPI.askSignBot(q, history);

        if (aiResponse && aiResponse.answer) {
          const botMsg: Message = {
            id: uid(),
            role: "bot",
            text: aiResponse.answer,
            time: getTime(),
            source: aiResponse.source,
            suggestions: aiResponse.suggestions || DEFAULT_SUGGESTIONS,
          };
          setMessages((prev) => [...prev, botMsg]);
          setTyping(false);
          if (!open) setUnread((n) => n + 1);
          return;
        }
      } catch (err) {
        console.warn("[SignBot] Backend chat failed, falling back to local KB:", err);
      }

      // Offline / Local KB Fallback
      setTimeout(() => {
        const { answer, suggestions } = findAnswer(q);
        const botMsg: Message = {
          id: uid(),
          role: "bot",
          text: answer,
          time: getTime(),
          source: "local_kb",
          suggestions,
        };
        setMessages((prev) => [...prev, botMsg]);
        setTyping(false);
        if (!open) setUnread((n) => n + 1);
      }, 350);
    },
    [messages, open]
  );

  const handleOpen = () => {
    setOpen(true);
    setMinimized(false);
    setUnread(0);
  };

  const handleClose = () => {
    setOpen(false);
    setUnread(0);
  };

  const handleReset = () => {
    setMessages([
      {
        id: uid(),
        role: "bot",
        text: isUrdu
          ? "### 🔄 نئی گفتگو شروع ہوئی\n\n" +
            "السلام علیکم! میں **سائن بوٹ** ہوں۔ مجھ سے **اخلاقی اشاراتی زبان**، **بہری برادری کے آداب**، یا **سائن اسپیک ایپ کے استعمال** کے بارے میں کچھ بھی پوچھیں!"
          : "### 🔄 Conversation Reset\n\n" +
            "Hi! I'm **SignBot**. Ask me anything about **Ethical Sign Language**, **Deaf Community Etiquette**, or how to use the **SignSpeak app**!",
        time: getTime(),
        source: "knowledge_base",
        suggestions: DEFAULT_SUGGESTIONS,
      },
    ]);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const quickActions = isUrdu
    ? [
        { icon: <Hand size={13} />, label: "شکریہ کا اشارہ", query: "پاکستانی اشاروں کی زبان میں شکریہ کیسے ادا کرتے ہیں؟" },
        { icon: <HeartHandshake size={13} />, label: "بہری برادری کے آداب", query: "اشاراتی زبان میں گفتگو کرتے وقت کن آداب کا خیال رکھنا چاہیے؟" },
        { icon: <ShieldCheck size={13} />, label: "اخلاقی اے آئی", query: "اشاراتی زبان میں اخلاقی اے آئی کا کیا مطلب ہے؟" },
        { icon: <Languages size={13} />, label: "اردو ➔ پی ایس ایل", query: "اردو سے پی ایس ایل ترجمہ کیسے کام کرتا ہے؟" },
        { icon: <Camera size={13} />, label: "پی ایس ایل ➔ اردو", query: "کیمرہ اشارات کی لائیو پہچان کیسے کرتا ہے؟" },
        { icon: <HelpCircle size={13} />, label: "پی ایس ایل کے بارے میں", query: "کیا پاکستانی اشاروں کی زبان ایک مکمل زبان ہے؟" },
      ]
    : QUICK_ACTIONS;

  return (
    <>
      {/* ── Floating Action Button ── */}
      {!open && (
        <button className="chatbot-fab" onClick={handleOpen} aria-label={t.botFabTooltip}>
          <MessageCircle size={22} />
          {unread > 0 && <span className="chatbot-fab-badge">{unread}</span>}
          <span className="chatbot-fab-tooltip">{t.botFabTooltip}</span>
        </button>
      )}

      {/* ── Chat Window ── */}
      {open && (
        <div className={`chatbot-window ${minimized ? "minimized" : ""}`}>
          {/* Header */}
          <div className="chatbot-header">
            <div className="chatbot-header-left">
              <div className="chatbot-avatar-dot">
                <Bot size={16} />
                <span className="chatbot-online-dot" />
              </div>
              <div className="chatbot-header-info">
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <span className="chatbot-title">{t.botTitle}</span>
                  <span
                    style={{
                      background: "rgba(255,255,255,0.2)",
                      fontSize: "9px",
                      padding: "1px 6px",
                      borderRadius: "10px",
                      color: "#fff",
                      fontWeight: 600,
                    }}
                  >
                    {t.botTag}
                  </span>
                </div>
                <span className="chatbot-subtitle">
                  {typing ? (
                    <span className="chatbot-typing-label">{t.botThinking}</span>
                  ) : (
                    t.botSubtitle
                  )}
                </span>
              </div>
            </div>
            <div className="chatbot-header-actions">
              <button
                className="chatbot-hdr-btn"
                onClick={handleReset}
                title={t.botResetTitle}
                aria-label={t.botResetTitle}
              >
                <RefreshCw size={14} />
              </button>
              <button
                className="chatbot-hdr-btn"
                onClick={() => setMinimized(!minimized)}
                title={minimized ? "Expand" : "Minimize"}
                aria-label="Minimize"
              >
                <ChevronDown size={15} className={`chatbot-minimize-icon ${minimized ? "rotated" : ""}`} />
              </button>
              <button
                className="chatbot-hdr-btn close"
                onClick={handleClose}
                title="Close"
                aria-label="Close chat"
              >
                <X size={15} />
              </button>
            </div>
          </div>

          {!minimized && (
            <>
              {/* Quick Actions Bar */}
              <div className="chatbot-quick-bar">
                {quickActions.map((a) => (
                  <button
                    key={a.label}
                    className="chatbot-quick-chip"
                    onClick={() => sendMessage(a.query)}
                  >
                    {a.icon}
                    {a.label}
                  </button>
                ))}
              </div>

              {/* Message Feed */}
              <div className="chatbot-messages">
                {messages.map((msg) => (
                  <div key={msg.id} className={`chatbot-msg-row ${msg.role}`}>
                    {msg.role === "bot" && (
                      <div className="chatbot-msg-avatar bot">
                        <Bot size={12} />
                      </div>
                    )}
                    <div className="chatbot-msg-col">
                      <div className={`chatbot-bubble ${msg.role}`}>
                        {renderMarkdown(msg.text)}
                        {msg.role === "bot" && msg.source === "gemini_ai" && (
                          <div
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px",
                              marginTop: "6px",
                              fontSize: "9px",
                              opacity: 0.65,
                              fontWeight: 600,
                            }}
                          >
                            <Sparkles size={10} />
                            Verified Ethical AI
                          </div>
                        )}
                      </div>
                      <span className="chatbot-msg-time">{msg.time}</span>
                      {/* Suggestion chips */}
                      {msg.role === "bot" && msg.suggestions && msg.suggestions.length > 0 && (
                        <div className="chatbot-suggestions">
                          {msg.suggestions.map((s) => (
                            <button
                              key={s}
                              className="chatbot-suggestion-chip"
                              onClick={() => sendMessage(s)}
                            >
                              {s}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    {msg.role === "user" && (
                      <div className="chatbot-msg-avatar user">
                        <User size={12} />
                      </div>
                    )}
                  </div>
                ))}

                {/* Typing indicator */}
                {typing && (
                  <div className="chatbot-msg-row bot">
                    <div className="chatbot-msg-avatar bot">
                      <Bot size={12} />
                    </div>
                    <div className="chatbot-bubble bot typing-bubble">
                      <span className="chatbot-dot" />
                      <span className="chatbot-dot" />
                      <span className="chatbot-dot" />
                    </div>
                  </div>
                )}

                <div ref={bottomRef} />
              </div>

              {/* Input Bar */}
              <div className="chatbot-input-bar">
                <input
                  ref={inputRef}
                  className="chatbot-input"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={t.botInputPlaceholder}
                  aria-label="Chat message input"
                  maxLength={300}
                />
                <button
                  className="chatbot-send-btn"
                  onClick={() => sendMessage(input)}
                  disabled={!input.trim()}
                  aria-label="Send message"
                >
                  <Send size={15} />
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}
