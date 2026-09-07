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
  Zap,
  Volume2,
  Camera,
  RefreshCw,
} from "lucide-react";

/* ─────────────────────── Types ─────────────────────── */

interface Message {
  id: string;
  role: "bot" | "user";
  text: string;
  time: string;
  suggestions?: string[];
}

/* ─────────────────────── Knowledge Base ─────────────────────── */

interface KBEntry {
  keywords: string[];
  answer: string;
  suggestions?: string[];
}

const KB: KBEntry[] = [
  {
    keywords: ["hello", "hi", "hey", "salam", "السلام", "assalam", "start", "help"],
    answer:
      "Hi! 👋 I'm **SignBot**, the SignSpeak assistant. I can help you understand how to use the app, learn about Pakistani Sign Language (PSL), or troubleshoot any issues.\n\nWhat would you like to know?",
    suggestions: [
      "How does Urdu to PSL work?",
      "How does PSL to Urdu work?",
      "What signs are supported?",
      "How do I start?",
    ],
  },
  {
    keywords: ["what is signspeak", "about", "what is this app", "what does this do", "overview"],
    answer:
      "**SignSpeak** is a two-way Pakistani Sign Language (PSL) communication platform. 🤝\n\nIt bridges communication between **1.5M+ deaf individuals** and hearing communities in Pakistan through:\n\n• 🔤 **Urdu → PSL** — Type Urdu text and watch a 3D avatar perform the signs\n• 📷 **PSL → Urdu** — Use your camera to recognize sign language gestures and get Urdu text output\n\nNo installation needed — it runs entirely in your browser!",
    suggestions: [
      "How does the 3D avatar work?",
      "Which languages are supported?",
      "Is this free to use?",
    ],
  },
  {
    keywords: [
      "urdu to psl",
      "translate urdu",
      "type urdu",
      "text to sign",
      "urdu sign",
      "how to translate",
      "translate text",
    ],
    answer:
      "**Urdu → PSL Translation** is simple! 📝\n\n1. Click the **\"Urdu to PSL\"** tab at the top of the workspace\n2. Type your Urdu text in the input box (e.g., *شکریہ* or *سلام*)\n3. You can also type **Roman Urdu** like *shukriya* or *salam* — it works too!\n4. Hit **Translate** and watch the 3D avatar perform the signs\n5. Use **Play / Pause** buttons to control the animation\n\n💡 *Tip: Enable Auto-Play to animate immediately on translation.*",
    suggestions: [
      "Can I type Roman Urdu?",
      "What signs are supported?",
      "How do I control the avatar?",
    ],
  },
  {
    keywords: [
      "psl to urdu",
      "sign to urdu",
      "camera",
      "webcam",
      "recognize",
      "recognition",
      "detect",
      "capture signs",
      "sign recognition",
    ],
    answer:
      "**PSL → Urdu Recognition** uses your webcam to detect signs! 📷\n\n1. Click the **\"PSL to Urdu\"** tab\n2. Click **\"Start Camera\"** and allow browser camera permissions\n3. Perform PSL signs in front of the camera\n4. Recognized signs appear as **Urdu text** in the output panel\n5. Click **🔊 Speak** to hear the Urdu translation read aloud\n\n💡 *Tip: Ensure good lighting and keep your hands within the camera frame for best results.*",
    suggestions: [
      "What signs can be recognized?",
      "Camera not working?",
      "Can I upload a video instead?",
    ],
  },
  {
    keywords: ["3d avatar", "avatar", "xbot", "animation", "3d model", "how does avatar"],
    answer:
      "The **3D Sign Avatar** is powered by Three.js + React Three Fiber! 🤖\n\nHere's how it works:\n• A **Mixamo Xbot** humanoid model is loaded once\n• Each PSL sign gloss (like `HELLO`, `THANK_YOU`) maps to a set of **bone keyframes** stored in a JSON dictionary\n• The avatar smoothly interpolates between poses using **quaternion slerp animation**\n• All 35+ joints are animated — including **individual fingers** for authentic fingerspelling\n\nYou can:\n✅ Play / Pause / Replay\n✅ Adjust speed (0.5× to 2×)\n✅ Use fullscreen expanded view\n✅ Orbit the 3D model with your mouse",
    suggestions: [
      "How do I control playback?",
      "What is fingerspelling?",
      "Why does the avatar not move?",
    ],
  },
  {
    keywords: [
      "supported signs",
      "supported words",
      "what signs",
      "which words",
      "vocabulary",
      "sign list",
      "what can i translate",
    ],
    answer:
      "SignSpeak currently supports these **PSL signs** natively:\n\n🖐️ **Greetings:** السلام علیکم, سلام, شکریہ, خوش آمدید, اللہ حافظ\n❓ **Questions:** آپ کیسے ہیں؟, کیسے ہیں\n🆘 **Emergency:** مدد, براہ کرم مدد کریں, ہسپتال, ڈاکٹر\n📅 **Daily:** پاکستان, پانی, کھانا, ہاں, نہیں, دوست, اسکول, میرا نام\n\n**Fingerspelling fallback:** Any word not in the dictionary is automatically spelled letter by letter using PSL finger alphabet.\n\n🤖 *AI-powered translation (Gemini) can handle many more phrases when configured.*",
    suggestions: [
      "What is fingerspelling?",
      "How does AI translation work?",
      "Can I add new signs?",
    ],
  },
  {
    keywords: ["roman urdu", "english", "roman", "latin", "shukriya", "salam"],
    answer:
      "Yes! SignSpeak accepts **Roman Urdu** and even some English words! 🎉\n\nExamples that work:\n• `salam` → سلام (Hello)\n• `shukriya` → شکریہ (Thank you)\n• `madad` → مدد (Help)\n• `paani` → پانی (Water)\n• `doctor` → ڈاکٹر\n• `pakistan` → پاکستان\n\nThe app converts Roman Urdu to Urdu script automatically before translating. If a word isn't in the dictionary, it falls back to letter-by-letter fingerspelling.",
    suggestions: [
      "What other words are supported?",
      "How does fingerspelling work?",
    ],
  },
  {
    keywords: ["fingerspell", "fingerspelling", "finger spell", "spelling", "letter by letter"],
    answer:
      "**Fingerspelling** is a fallback for words not in the PSL dictionary. ✋\n\nWhen you type a word that doesn't have a direct PSL sign (like a proper name or rare term), SignSpeak:\n\n1. Breaks the word into individual characters\n2. Maps each character to its PSL hand shape (e.g., `ا` → Letter A shape)\n3. Animates them one by one on the 3D avatar\n\nThis way, you can communicate **any word** even if a dedicated sign doesn't exist for it. Each letter gets its own `LETTER_X` animation keyframe.",
    suggestions: [
      "What signs have dedicated animations?",
      "How do I see which type each word is?",
    ],
  },
  {
    keywords: [
      "play",
      "pause",
      "replay",
      "speed",
      "playback",
      "control",
      "avatar control",
      "animation control",
    ],
    answer:
      "You have full **playback control** over the 3D avatar animation! 🎮\n\n▶️ **Play** — Start or resume the sign animation\n⏸️ **Pause** — Freeze the animation on the current sign\n🔄 **Replay** — Restart from the first sign in the sequence\n\n**Speed control:**\n• 0.5× — Slow motion for learning\n• 1× — Normal speed\n• 1.5× — Faster\n• 2× — Double speed\n\n**Sign chips** at the bottom show all signs in the current sequence — click any chip to jump directly to that sign.\n\n**Fullscreen / Expanded View** button lets you see the avatar in a larger view.",
    suggestions: [
      "What are sign chips?",
      "How do I use fullscreen?",
      "What is Auto-Play?",
    ],
  },
  {
    keywords: ["auto play", "autoplay", "automatically", "auto"],
    answer:
      "**Auto-Play** automatically starts the avatar animation as soon as you hit Translate — without needing to press Play manually.\n\nToggle it using the **Auto-Play on Translation** switch at the bottom of the avatar panel.\n\n✅ ON → Avatar plays immediately after translation\n❌ OFF → Translation runs but animation waits for you to press Play",
    suggestions: ["How do I control playback speed?", "What is the replay button?"],
  },
  {
    keywords: ["camera not working", "camera error", "permission", "allow camera", "camera denied", "webcam not"],
    answer:
      "If your camera isn't working, try these fixes: 🔧\n\n1. **Allow camera permission** — When prompted by the browser, click **Allow**\n2. **Check browser settings** — Go to browser Settings → Privacy → Camera and make sure SignSpeak is allowed\n3. **HTTPS required** — Camera access requires a secure connection (localhost works fine)\n4. **Try a different browser** — Chrome or Edge work best\n5. **Close other apps** — Ensure no other app (Zoom, Teams) is using the camera\n\nIf the issue persists, try the **Upload Video** option instead.",
    suggestions: [
      "Can I upload a video instead?",
      "What browsers are supported?",
    ],
  },
  {
    keywords: ["upload video", "video upload", "upload", "file", "video file"],
    answer:
      "Yes! You can **upload a video** instead of using your live camera. 🎥\n\nIn the PSL → Urdu tab:\n1. Click the **Upload** mode tab\n2. Click **Upload Video** and select a `.mp4` or `.webm` file\n3. The app will process the video and attempt to recognize PSL signs\n\n*This is useful if you want to test with pre-recorded signing videos.*",
    suggestions: ["What video formats are supported?", "How does live camera work?"],
  },
  {
    keywords: ["speak", "audio", "voice", "tts", "text to speech", "speech", "sound", "read aloud"],
    answer:
      "SignSpeak can **speak the translated Urdu text** aloud using your browser's built-in Text-to-Speech! 🔊\n\nIn the PSL → Urdu panel, after signs are recognized:\n• Click the **🔊 Speak** button to hear the Urdu text read out loud\n• Click again to **stop** the audio\n\nThe speech uses your OS language settings. If Urdu voice isn't available, it may fall back to another language.",
    suggestions: ["How do I recognize signs with the camera?", "Can I adjust speech speed?"],
  },
  {
    keywords: ["ai", "gemini", "artificial intelligence", "how ai works", "machine learning", "model"],
    answer:
      "SignSpeak uses **Google Gemini 2.5 Flash** for advanced translation! 🤖✨\n\nThe translation pipeline works in priority order:\n1. 📚 **Offline rule match** — instant, no network needed\n2. 🔍 **Fuzzy phrase matching** — partial word overlap\n3. 🤖 **Gemini AI** — handles novel vocabulary, Roman Urdu, English and complex sentences\n4. 📖 **Word-level substitution** — known word glosses\n5. 🖐️ **Fingerspelling fallback** — any remaining characters\n\nGemini is optional — the app works fully offline without it. Set `GEMINI_API_KEY` in the `.env` file to enable it.",
    suggestions: ["How do I enable Gemini?", "What is fingerspelling?"],
  },
  {
    keywords: ["psl", "pakistani sign language", "what is psl", "about psl", "sign language pakistan"],
    answer:
      "**Pakistani Sign Language (PSL)** is the indigenous visual-spatial language used by the Deaf community across Pakistan. 🇵🇰\n\n• PSL is a **distinct language** with its own grammar, syntax, and vocabulary\n• It's used by an estimated **1.5 million+ deaf people** in Pakistan\n• PSL uses **spatial grammar** — body orientation, facial expressions, and hand movements together convey meaning\n• It differs significantly from English Sign Language (ASL) or British Sign Language (BSL)\n\nSignSpeak is designed specifically for PSL and Urdu — not for other sign languages.",
    suggestions: [
      "What signs are supported?",
      "How does the translation work?",
      "What is fingerspelling?",
    ],
  },
  {
    keywords: ["how to start", "getting started", "begin", "first time", "new user", "how to use"],
    answer:
      "Welcome! Here's how to get started with SignSpeak in 3 steps: 🚀\n\n**Step 1 — Translate Urdu to PSL:**\n→ Scroll to the workspace, select **Urdu to PSL** tab, type something like *شکریہ* and click Translate.\n\n**Step 2 — Watch the 3D Avatar:**\n→ The avatar will perform the PSL sign. Use Play/Pause/Replay to control it.\n\n**Step 3 — Try PSL to Urdu:**\n→ Switch to the **PSL to Urdu** tab, allow camera access, and try performing a sign.\n\n💡 *Scroll down from the hero section or click **Start Translating** to jump straight to the workspace.*",
    suggestions: [
      "What signs can I type?",
      "How does the camera work?",
      "Can I type Roman Urdu?",
    ],
  },
  {
    keywords: ["avatar not moving", "not animating", "animation not working", "avatar stuck", "no animation"],
    answer:
      "If the avatar isn't moving, here are some things to check: 🔧\n\n1. **Make sure you pressed Translate first** — The avatar needs a translation result\n2. **Press the Play button** — If Auto-Play is off, you need to manually press ▶️\n3. **Check the sign chips** — If they show your words, the translation worked; click a chip to jump to that sign\n4. **Unknown words** — If a word isn't in the dictionary, it may be fingerspelled (slower animation)\n5. **Reload the page** — A fresh load re-fetches the animation dictionary\n\nIf none of these work, try a simple known word like *سلام* first.",
    suggestions: [
      "What signs are supported?",
      "How does fingerspelling work?",
      "How do I use Auto-Play?",
    ],
  },
  {
    keywords: ["fullscreen", "expanded view", "bigger", "larger view", "maximize"],
    answer:
      "You can view the 3D avatar in a **larger expanded view**! 🖥️\n\nClick the **\"Expanded View\"** button at the bottom-right of the avatar panel. This gives you a bigger rendering area to see the sign animations more clearly.\n\nClick **\"Exit Fullscreen\"** or press **Escape** to return to normal view.\n\nYou can also **orbit the 3D model** with your mouse — click and drag to rotate, scroll to zoom in/out.",
    suggestions: ["How do I control the avatar?", "How do I adjust playback speed?"],
  },
  {
    keywords: ["thank", "thanks", "thx", "great", "awesome", "nice", "good"],
    answer:
      "You're welcome! 😊 Happy to help.\n\nRemember, SignSpeak is here to make communication more accessible for the deaf community. If you have more questions, I'm always here!\n\nIs there anything else I can help you with?",
    suggestions: [
      "How does Urdu to PSL work?",
      "What signs are supported?",
      "Tell me about PSL",
    ],
  },
  {
    keywords: ["bye", "goodbye", "exit", "close", "done", "that's all"],
    answer:
      "Goodbye! 👋 Feel free to come back anytime you need help with SignSpeak.\n\nRemember — every sign matters. Keep making communication more inclusive! 🤟",
    suggestions: [],
  },
];

const DEFAULT_SUGGESTIONS = [
  "How does Urdu to PSL work?",
  "What signs are supported?",
  "How does the camera work?",
  "What is PSL?",
];

/* ─────────────────────── Quick Actions ─────────────────────── */

const QUICK_ACTIONS = [
  { icon: <Languages size={13} />, label: "Urdu → PSL", query: "How does Urdu to PSL work?" },
  { icon: <Camera size={13} />, label: "PSL → Urdu", query: "How does PSL to Urdu work?" },
  { icon: <Hand size={13} />, label: "Supported Signs", query: "What signs are supported?" },
  { icon: <Sparkles size={13} />, label: "3D Avatar", query: "How does the 3D avatar work?" },
  { icon: <Zap size={13} />, label: "Get Started", query: "How do I get started?" },
  { icon: <HelpCircle size={13} />, label: "About PSL", query: "What is Pakistani Sign Language?" },
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
      if (q.includes(kw)) score += kw.split(" ").length; // longer phrase = higher score
    }
    if (score > bestScore) {
      bestScore = score;
      bestMatch = entry;
    }
  }

  if (bestMatch && bestScore > 0) {
    return { answer: bestMatch.answer, suggestions: bestMatch.suggestions ?? DEFAULT_SUGGESTIONS };
  }

  return {
    answer:
      "I'm not sure about that specific question. 🤔\n\nHere are some things I can help you with — tap one of the suggestions below or try rephrasing your question!",
    suggestions: DEFAULT_SUGGESTIONS,
  };
}

/** Convert **bold** markdown to <strong> and \n to <br> */
function renderMarkdown(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    return part.split("\n").map((line, j) => (
      <span key={`${i}-${j}`}>
        {line}
        {j < part.split("\n").length - 1 && <br />}
      </span>
    ));
  });
}

/* ─────────────────────── Component ─────────────────────── */

export default function ChatBot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: uid(),
      role: "bot",
      text: "👋 Hi! I'm **SignBot**, your SignSpeak assistant.\n\nAsk me anything about how to use the app, Pakistani Sign Language, or the 3D avatar!",
      time: getTime(),
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
    (text: string) => {
      const q = text.trim();
      if (!q) return;
      setInput("");

      const userMsg: Message = { id: uid(), role: "user", text: q, time: getTime() };
      setMessages((prev) => [...prev, userMsg]);
      setTyping(true);

      // Simulate bot thinking delay
      setTimeout(() => {
        const { answer, suggestions } = findAnswer(q);
        const botMsg: Message = {
          id: uid(),
          role: "bot",
          text: answer,
          time: getTime(),
          suggestions,
        };
        setMessages((prev) => [...prev, botMsg]);
        setTyping(false);
        if (!open) setUnread((n) => n + 1);
      }, 600 + Math.random() * 400);
    },
    [open],
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
        text: "👋 Hi! I'm **SignBot**, your SignSpeak assistant.\n\nAsk me anything about the app, PSL, or the 3D avatar!",
        time: getTime(),
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

  return (
    <>
      {/* ── Floating Action Button ── */}
      {!open && (
        <button className="chatbot-fab" onClick={handleOpen} aria-label="Open chat assistant">
          <MessageCircle size={22} />
          {unread > 0 && <span className="chatbot-fab-badge">{unread}</span>}
          <span className="chatbot-fab-tooltip">Need help?</span>
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
                <span className="chatbot-title">SignBot</span>
                <span className="chatbot-subtitle">
                  {typing ? (
                    <span className="chatbot-typing-label">typing…</span>
                  ) : (
                    "SignSpeak Assistant · Online"
                  )}
                </span>
              </div>
            </div>
            <div className="chatbot-header-actions">
              <button
                className="chatbot-hdr-btn"
                onClick={handleReset}
                title="New conversation"
                aria-label="Reset chat"
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
                {QUICK_ACTIONS.map((a) => (
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
                  placeholder="Ask me anything about SignSpeak…"
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
