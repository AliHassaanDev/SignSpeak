# SignBridge PK (SignSpeak)
## Comprehensive Technical & Social Impact Documentation
### Two-Way Pakistani Sign Language (PSL) ⇄ Urdu Communication Assistant

---

## 1. Executive Summary

**SignBridge PK** (also known as **SignSpeak**) is an artificial intelligence-powered, bidirectional assistive communication platform engineered specifically for **Pakistani Sign Language (PSL)** and the **Urdu** language. 

Communication is a fundamental human right. Yet, across Pakistan, an estimated **1.5+ million Deaf and Hard of Hearing (DHH)** individuals experience severe daily communication barriers due to the absence of accessible, real-time sign language interpretation. 

SignBridge PK closes this divide with a unified, two-way bridge:
1. **PSL to Urdu (Hearing Assistance)**: Translates live camera gestures, recorded sign videos, or video uploads into fluent, grammatically accurate Urdu and English sentences with synchronized natural Urdu speech synthesis and silent intent extraction.
2. **Urdu to PSL (Deaf Assistance)**: Translates written Urdu script, Roman Urdu transliterations, and spoken Urdu speech into chronological Pakistani Sign Language visual sequences, animated gloss clips, and 3D avatar kinematics.
3. **Interactive PSL Academy & AI Tutor**: An educational suite featuring structured curriculum levels and a real-time conversational AI sign language tutor powered by Gemini models.

```
                  ┌──────────────────────────────────────────────┐
                  │                SIGNBRIDGE PK                 │
                  │       Two-Way Communication Assistant        │
                  └──────────────────────┬───────────────────────┘
                                         │
                 ┌───────────────────────┴───────────────────────┐
                 ▼                                               ▼
   ┌───────────────────────────┐                   ┌───────────────────────────┐
   │    DIRECTION 1: PSL → URDU │                   │   DIRECTION 2: URDU → PSL │
   ├───────────────────────────┤                   ├───────────────────────────┤
   │ • Video / Camera Capture  │                   │ • Urdu Script & Voice STT │
   │ • Gemini Multimodal Vision│                   │ • Roman Urdu Normalization│
   │ • Intent & Tone Extraction│                   │ • Rule & LLM Gloss Engine │
   │ • Urdu Audio Synthesis    │                   │ • PSL Video Player (60+)  │
   └───────────────────────────┘                   └───────────────────────────┘
                 │                                               │
                 └───────────────────────┬───────────────────────┘
                                         │
                                         ▼
                  ┌──────────────────────────────────────────────┐
                  │             LEARN PSL & AI TUTOR             │
                  │   Curriculum Levels 1-4 • Gemini PSL Tutor   │
                  └──────────────────────────────────────────────┘
```

---

## 2. Problem Statement

### 2.1 The Crisis of Linguistic Isolation in Pakistan
- **Population Impact**: Over **1.5 to 2 million individuals** in Pakistan communicate primarily or exclusively using Pakistani Sign Language (PSL).
- **Linguistic Reality of PSL**: PSL is not simply signed Urdu or English; it is a distinct, rich, visual-spatial language with its own grammatical structures, topic-comment sentence order, spatial referencing, facial morphology, and manual vocabulary. American Sign Language (ASL) models fail completely on PSL because the manual lexicons and fingerspelling alphabets differ fundamentally.
- **Extreme Interpreter Deficit**: Pakistan has fewer than 1 certified PSL interpreter per 100,000 deaf citizens. Human interpretation is geographically concentrated in major urban centers and is prohibitively expensive for everyday interactions.
- **Illiteracy & Dual-Language Burden**: Many deaf individuals in Pakistan have limited access to written Urdu education. Text-based translation apps (such as Google Translate) are ineffective for individuals who think and communicate spatially in PSL.

### 2.2 Critical Sectors Impacted

| Sector | Existing Problem | Real-World Consequence |
| :--- | :--- | :--- |
| **Healthcare & Triage** | Doctors and nurses cannot understand non-verbal patients describing acute pain, symptoms, allergies, or trauma. | Diagnostic errors, delayed emergency care, and dangerous medical outcomes. |
| **Emergency Services** | Police stations, rescue services (Rescue 1122), and fire departments lack sign language capabilities. | Deaf victims cannot report accidents, abuse, or crimes independently. |
| **Education & Literacy** | Hearing teachers in mainstream or inclusive classrooms rarely know PSL; deaf children struggle with rote text memorization. | High dropout rates and delayed cognitive and linguistic development. |
| **Family & Community** | Over 90% of deaf children are born to hearing parents who do not know PSL. | "Dinner table syndrome"—severe emotional isolation within their own homes. |
| **Employment & Commerce** | Customer-facing jobs, bank branches, and public offices cannot accommodate deaf employees or patrons. | Severe economic marginalization and limited livelihood opportunities. |

---

## 3. The Solution & Value Proposition

SignBridge PK acts as a **virtual, 24/7, zero-cost bidirectional interpreter** deployed directly into the web browser on desktop and mobile devices without requiring expensive specialized hardware or sensor gloves.

### Core Value Deliverables:
- **Instant Two-Way Communication**: Hearing individuals speak or type Urdu; Deaf individuals sign into the camera. Both parties receive information in their native modality (speech/audio for the hearing, visual signs for the deaf).
- **Grammatically Fluent Intent Understanding**: Rather than translating isolated, disjointed words, the system extracts high-level communicative **intent, tone, and full sentences**.
- **Low Barrier to Entry**: Operates on standard smartphone or laptop webcams without external calibration hardware.
- **Inclusive Language Support**: Supports formal Urdu script, conversational Roman Urdu (e.g., `"mujhe doctor ke paas jana hai"`), and English phonetic representations.

---

## 4. Target Audience & Stakeholders Served

1. **Deaf and Hard of Hearing (DHH) Individuals**:
   - Empowered to communicate independently at grocery stores, pharmacies, police stations, transport terminals, and doctor visits.
   - Retain complete autonomy and privacy without needing a family member or third party to interpret private matters.
2. **Hearing Family Members, Friends, and Educators**:
   - Parents, siblings, and relatives of deaf children who wish to communicate naturally and learn PSL alongside them.
   - Special education teachers and inclusive school instructors.
3. **Medical and Emergency First Responders**:
   - ER doctors, triage nurses, and paramedical staff who must quickly determine what a deaf patient is experiencing.
4. **Public & Private Sector Service Providers**:
   - Bank tellers, NADRA registration desks, post offices, airline check-in counters, and retail cashiers.
5. **PSL Learners, Students, and Researchers**:
   - Anyone learning Pakistani Sign Language through interactive quiz modules and conversational AI instruction.

---

## 5. Technical Architecture & Technology Stack

SignBridge PK employs a modern, decoupled client-server architecture engineered for high throughput, sub-second inference responsiveness, and resilient offline fallbacks.

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                             FRONTEND ARCHITECTURE                                │
│                   Next.js 16 (Turbopack) • React 19 • TypeScript                 │
├──────────────────────────┬───────────────────────────┬───────────────────────────┤
│   PSL-to-Urdu Modules    │    Urdu-to-PSL Modules    │    Learning & Support     │
│  • CameraPanel (Webcam)  │  • PSLVideoPlayer         │  • /learn Page Route      │
│  • Video Upload Stream   │  • urduToPSLModel Engine  │  • TutorChat & QuizMode   │
│  • TranscriptPanel HUD   │  • Roman Urdu Preprocessor│  • ChatBot Widget         │
│  • Web Speech Audio TTS  │  • Gloss Video Registry   │  • Level Selector (1-4)   │
└──────────────────────────┴─────────────▲─────────────┴───────────────────────────┘
                                         │ HTTP REST (JSON / Multipart)
┌────────────────────────────────────────▼─────────────────────────────────────────┐
│                             BACKEND ARCHITECTURE                                 │
│                     FastAPI (Python 3.11) • Uvicorn Engine                       │
├──────────────────────────┬───────────────────────────┬───────────────────────────┤
│  POST /api/translate/    │  POST /api/text-to-psl    │  POST /api/translate/     │
│       psl-to-urdu        │  • PSLAnimationPipeline   │       urdu-to-psl         │
│  • Video temporary queue │  • Gemini 2.5 Flash Gloss │  • Word-level canonical   │
│  • psl_predictor engine  │  • Registry asset mapping │  • UAlpha40 Fingerspelling│
│  • Multi-sign parsing    │  • Rule fallback lookup   │  • Kinematic joint poses  │
└──────────────────────────┴─────────────▲─────────────┴───────────────────────────┘
                                         │ Google GenAI SDK
┌────────────────────────────────────────▼─────────────────────────────────────────┐
│                        EXTERNAL INTELLIGENCE LAYER                               │
│                         Google Gemini API Services                               │
│  • Gemini 3.6 / 3.7 Flash: Video Understanding, Spatial Landmark Reasoning      │
│  • Gemini 2.5 / 2.0 Flash: Natural Language Gloss Resolution & Interactive Tutor │
└──────────────────────────────────────────────────────────────────────────────────┘
```

### Detailed Technology Breakdown:

#### Frontend Ecosystem
- **Framework**: Next.js 16.3.2 (with Turbopack bundler)
- **Library**: React 19.2.8 & React DOM
- **Language**: TypeScript 5+ (Strict type checking, 0 compilation errors)
- **Styling**: Tailored Vanilla CSS design system with CSS custom properties (`var(--teal)`, `var(--violet)`, `var(--panel)`), glassmorphism (`backdrop-filter: blur(28px)`), dynamic animations, and mobile-responsive grid layouts.
- **Audio & Media**:
  - Web Audio API & HTML5 `<audio>` for synthesized Urdu speech.
  - Web Speech API (`SpeechRecognition` & `webkitSpeechRecognition`) for spoken Urdu voice input (`ur-PK`).
  - WebRTC `navigator.mediaDevices.getUserMedia` for 30 FPS camera streaming.
  - HTML5 Canvas for real-time video snapshotting and processing.

#### Backend Ecosystem
- **Web Engine**: FastAPI (ASGI asynchronous server framework)
- **Server**: Uvicorn with hot-reload capability
- **Data Validation**: Pydantic v2 schemas (`BaseModel`, `Field`)
- **File Handling**: Python `tempfile`, `shutil`, and `pathlib` for memory-safe multipart video stream processing.
- **CORS Middleware**: Comprehensive cross-origin configuration enabling secure frontend communication.

#### Machine Learning & Artificial Intelligence
- **Google GenAI Python SDK (`google-genai`)**: Interfacing with Google DeepMind's Gemini multimodal models.
- **Video Reasoning**: Gemini multimodal vision processing raw `.webm` / `.mp4` sign language recordings.
- **PSL Datasets Integrated**:
  - *DynamicWordLevelPakistanSignLanguage*: Dynamic words and conversational signs (Greetings, Emergency, Medical, Questions, Daily life).
  - *UAlpha40*: Standardized 40-character Pakistani Sign Language manual fingerspelling alphabet for spelling names and out-of-vocabulary terms.
- **Static Assets & Gloss Mapping**: 60+ pre-rendered high-definition PSL sign reference graphics located in `frontend/public/videos/glosses/`.

---

## 6. Detailed System Pipelines

### 6.1 Pipeline A: PSL to Urdu (Sign Recognition & Intent Extraction)

```
[ User Signs in Front of Webcam ]
                │
                ▼
[ CameraPanel.tsx: Records MediaStream at 30 FPS ]
                │ (User stops recording or uploads video file)
                ▼
[ Formats Video into Blob (video/webm;codecs=vp8,opus) ]
                │
                ▼ POST /api/translate/psl-to-urdu (Multipart Form)
[ FastAPI: urdu_psl_router.py ]
                │ (Saves video to secure temporary storage)
                ▼
[ Backend: psl_predictor.py ]
                │
                ├──> Uploads / Streams video to Google Gemini Multimodal Vision API
                │    Prompt: "Analyze this Pakistani Sign Language video. Identify each
                │             distinct sign chronologically. Extract overall meaning in
                │             Urdu and English, model confidence, and sign tokens."
                │
                ├──> Parses structured response:
                │    - overall_sentence_ur: "السلام علیکم، مجھے پانی چاہیے"
                │    - overall_sentence_en: "Hello, I need water."
                │    - signs: [{gloss: "HELLO", meaning_ur: "سلام"}, {gloss: "WATER", ...}]
                │    - confidence: 0.96
                │
                ▼ Clean up temporary video file
[ Returns JSON Payload to Client ]
                │
                ▼
[ TranscriptPanel.tsx: Instant HUD Display ]
                │
                ├──> Displays live Urdu sentence in Noto Nastaliq typography
                ├──> Displays English translation and confidence meter
                ├──> Renders individual sign token badges with duration and gloss
                ├──> Automatically triggers text-to-speech (TTS) in spoken Urdu
                └──> Provides one-click clipboard copy for clinical or text records
```

### 6.2 Pipeline B: Urdu to PSL (Text/Speech to Visual Sign Sequence)

```
[ User Enters Input ]
  ├── 1. Typed Urdu Script (e.g., "شکریہ")
  ├── 2. Spoken Urdu Voice (via Web Speech Recognition: ur-PK)
  ├── 3. Roman Urdu Transliteration (e.g., "doctor", "madad", "pani")
  └── 4. Quick Category Preset Buttons
                │
                ▼
[ Frontend: urduToPSLModel.infer() ]
                │
                ├──> Checks Roman-to-Urdu transliteration table
                ├──> Normalizes text (strips diacritics, extra whitespace)
                └──> Tokenizes into words and generates client-side fallback glosses
                │
                ▼ POST /api/text-to-psl (JSON: {"text": "..."})
[ Backend: PSLAnimationPipeline (translation.py) ]
                │
                ├──> Step 1: Query Gemini 2.5 Flash for natural PSL gloss sequence
                ├──> Step 2: Fallback to rule-based dictionary (URDU_TO_GLOSS_RULES)
                ├──> Step 3: Match tokens against animation_registry.json
                └──> Step 4: Unknown words fall back to UAlpha40 character-by-character fingerspelling
                │
                ▼ Returns animation queue with gloss tokens (e.g., ["THANK_YOU"])
[ PSLVideoPlayer.tsx Mounted in Avatar Stage ]
                │
                ├──> Resolves each token via gloss_video_registry.json
                ├──> Preloads and transitions visual sign assets (/videos/glosses/THANK_YOU.png)
                ├──> Displays live signing indicator badge ("Signing: THANK YOU")
                ├──> Synchronizes with timeline scrubber and progress indicator
                └──> Speed controls: Toggle between 0.6x (slow), 1.0x (normal), 1.4x (fast)
```

### 6.3 Pipeline C: Interactive PSL Academy & Conversational Tutor

```
[ User Navigates to /learn Route ]
                │
                ▼
[ Selects Curriculum Level (Level 1: Alphabet to Level 4: Advanced) ]
                │
                ▼
[ Types Question or Responds to Quiz in TutorChat.tsx ]
                │
                ▼ POST /api/tutor (JSON: { messages, level })
[ Next.js API Route: /api/tutor/route.ts ]
                │
                ├──> Enforces structured educational prompt template
                ├──> Primary Model: Gemini 2.0 Flash (with automatic 2.5 & 1.5 fallbacks)
                ├──> Enforces JSON response schema:
                │    {
                │      "tutor_reply": "To sign 'Water', tap three fingers to your chin...",
                │      "gloss_tokens": ["WATER"],
                │      "hand_description": "Three extended fingers tap near the mouth twice.",
                │      "quiz_options": ["Water", "Food", "Help"]
                │    }
                │
                ▼ Returns structured JSON to Client
[ TutorChat Renders Interactive UI ]
                ├──> Displays encouraging tutor explanation message
                ├──> Highlights physical hand placement description card
                ├──> Renders interactive multiple-choice quiz buttons
                └──> Updates right-hand visual preview with the demonstrated sign
```

---

## 7. Comprehensive Inventory: What Has Been Built

### 7.1 Frontend Architecture (`frontend/`)

| File / Component | Type | Responsibility & Features |
| :--- | :--- | :--- |
| **`app/page.tsx`** | Page | Primary single-page application containing the hero section, navigation bar, workspace tab switcher, `PSLToUrdu` engine, `UrduToPSL` engine, and floating `ChatBot`. |
| **`app/learn/page.tsx`** | Page | Dedicated learning portal with a 4-tier curriculum level selector, split-screen interactive chat, physical hand description cards, and gloss token chips. |
| **`components/CameraPanel.tsx`** | Component | High-performance camera interface featuring live webcam stream management, video upload handling, recording timers, full-screen expansion, and instant reset workflows. |
| **`components/TranscriptPanel.tsx`** | Component | Glassmorphic HUD displaying recognized Urdu sentences, English translations, confidence meters, token badges, Urdu TTS audio playback, and clipboard copying. |
| **`components/PSLVideoPlayer.tsx`** | Component | Dual-slot smooth transition player for sign language visuals, supporting sequence playback, speed toggling (0.6x–1.4x), timeline progression, and pause/replay. |
| **`components/Avatar3D.tsx`** | Component | Three.js / React Three Fiber interactive 3D humanoid avatar capable of rendering joint kinematics and 3D sign poses. |
| **`components/ChatBot.tsx`** | Component | Floating intelligent assistant widget that guides first-time users on lighting, camera positioning, and application navigation. |
| **`components/learn/TutorChat.tsx`** | Component | Conversational AI tutoring interface providing step-by-step sign instructions, physical motion descriptions, and interactive quizzes. |
| **`app/lib/api.ts`** | Library | Strongly typed API client managing HTTP requests to the backend (`checkHealth`, `translatePSLToUrdu`, `translateUrduToPSL`). |
| **`app/lib/urdutopsl-model.ts`** | Library | Client-side hybrid inference engine with embedded Urdu dictionary, Roman Urdu tokenizer, and fingerspelling fallback. |
| **`app/lib/roman-urdu.ts`** | Library | Transliteration engine mapping common Roman Urdu phrases and phonetics to standardized Urdu orthography. |
| **`services/pslService.ts`** | Service | Dedicated service handling communication with the FastAPI `/api/text-to-psl` endpoint. |
| **`app/globals.css`** | Stylesheet | Unified 5,000+ line CSS design system containing custom design tokens, dark glassmorphism, responsive grids, and animation keyframes. |

### 7.2 Backend Architecture (`backend/`)

| File / Module | Type | Responsibility & Features |
| :--- | :--- | :--- |
| **`app/main.py`** | Entrypoint | FastAPI application configuration, CORS middleware, static asset mounting (`/videos`), and modular router registration. |
| **`app/api/urdu_psl_router.py`** | Router | Dedicated endpoint for `POST /api/translate/psl-to-urdu`, handling video payload uploads and delegating to the vision predictor. |
| **`app/api/translation.py`** | Router | Endpoints for `POST /api/text-to-psl`, `POST /api/translate/urdu-to-psl`, and `GET /api/model-info`. |
| **`app/api/speech.py`** | Router | Backend speech synthesis integration for text-to-speech audio streaming. |
| **`app/services/psl_predictor.py`** | Service | Gemini Multimodal Vision translation pipeline converting raw sign language video frames into natural Urdu and English sentences. |
| **`app/services/urdutopsl_service.py`** | Service | Canonical word-level dictionary matching service with video registry resolution and UAlpha40 fingerspelling fallback. |
| **`app/models/schemas.py`** | Models | Pydantic data schemas (`UrduToPSLRequest`, `PSLTokenResponse`, `TextToPSLRequest`, `UrduToPSLResponse`). |

### 7.3 Machine Learning Assets (`ml/` & `frontend/public/`)

| Asset Path | Responsibility |
| :--- | :--- |
| **`ml/models/urdutopsl_model.py`** | Python `PSLAnimationPipeline` engine combining Gemini gloss translation with rule-based fallback and asset registry resolution. |
| **`ml/data/animation_registry.json`** | Registry mapping canonical gloss tokens to 3D `.glb` character animation files. |
| **`frontend/public/data/gloss_video_registry.json`** | Registry mapping 60+ gloss tokens to high-definition sign visual files. |
| **`frontend/public/data/psl_glosses.json`** | Frontend keyframe dictionary defining joint positions and timing parameters. |
| **`frontend/public/videos/glosses/*.png`** | High-definition reference sign cards and alphabet illustrations for all core signs and letters. |

---

## 8. Real-World Societal Impact

```
                  ┌──────────────────────────────────────────────┐
                  │            REAL-WORLD IMPACT OF              │
                  │               SIGNBRIDGE PK                  │
                  └──────────────────────┬───────────────────────┘
                                         │
         ┌───────────────────────────────┼───────────────────────────────┐
         ▼                               ▼                               ▼
┌───────────────────┐           ┌───────────────────┐           ┌───────────────────┐
│  HEALTH & SAFETY  │           │ INDEPENDENCE &    │           │ SOCIAL INCLUSION  │
│   IN EMERGENCIES  │           │      DIGNITY      │           │    & EDUCATION    │
├───────────────────┤           ├───────────────────┤           ├───────────────────┤
│ • Zero-interpreter│           │ • Independent     │           │ • Hearing families│
│   triage in ERs.  │           │   medical visits  │           │   learn PSL at    │
│ • Rapid reporting │           │   and shopping.   │           │   home.           │
│   of accidents    │           │ • Complete        │           │ • Inclusive class-│
│   and emergencies.│           │   privacy for     │           │   room assistance.│
│ • Reduced clinical│           │   confidential    │           │ • Overcoming      │
│   misdiagnoses.   │           │   conversations.  │           │   social isolation│
└───────────────────┘           └───────────────────┘           └───────────────────┘
```

1. **Healthcare Equity**: Enables a deaf patient in Karachi, Lahore, or a rural clinic to explain symptoms directly to a doctor without needing a family member present to interpret sensitive health details.
2. **Economic Autonomy**: Allows deaf individuals to apply for jobs, interact with colleagues, and conduct banking transactions with independence and dignity.
3. **Closing the Educational Divide**: Provides hearing teachers and parents with a free, immediate tool to learn PSL alongside deaf children, reversing decades of linguistic isolation at the dinner table.
4. **Emergency Preparedness**: Equips first responders and rescue workers with an instant visual communication interface during natural disasters or medical emergencies.

---

## 9. Installation, Setup & Verification Guide

### 9.1 Prerequisites
- **Python**: Version 3.10 or 3.11 installed
- **Node.js**: Version 18, 20, or 22 installed (with npm)
- **Google Gemini API Key**: Obtainable from [Google AI Studio](https://aistudio.google.com/)

### 9.2 Environment Configuration
Create a `.env` file in the project root:
```env
GEMINI_API_KEY=your_google_gemini_api_key_here
```

Create a `.env.local` file in the `frontend/` directory:
```env
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
GEMINI_API_KEY=your_google_gemini_api_key_here
```

### 9.3 Installation Steps

#### Option A: Automated One-Click Setup (Windows)
Double-click `setup.bat` to install all dependencies for both Python and Node.js.

#### Option B: Manual Setup
**1. Setup Python Backend:**
```bash
python -m venv venv
# Windows:
.\venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

pip install -r backend/requirements.txt
```

**2. Setup Node.js Frontend:**
```bash
cd frontend
npm install
cd ..
```

### 9.4 Running the Application

#### Option A: Automated Launch (Windows)
Double-click `start.bat`.

#### Option B: Manual Launch
**Terminal 1 (Backend):**
```bash
cd backend
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

**Terminal 2 (Frontend):**
```bash
cd frontend
npm run dev
```

### 9.5 Service Endpoints

| Service | Access URL | Purpose |
| :--- | :--- | :--- |
| **SignBridge Web Application** | [http://localhost:3000](http://localhost:3000) | Full Two-Way Translator, Camera Interface, PSL Video Player |
| **Interactive PSL Academy** | [http://localhost:3000/learn](http://localhost:3000/learn) | Interactive AI Tutor, Curriculum Levels, Quizzes |
| **FastAPI Backend Root** | [http://localhost:8000](http://localhost:8000) | Health Check & Active Models Telemetry |
| **Interactive API Docs (Swagger)** | [http://localhost:8000/docs](http://localhost:8000/docs) | Interactive Swagger UI for all REST endpoints |
| **Alternative API Docs (ReDoc)** | [http://localhost:8000/redoc](http://localhost:8000/redoc) | Clean OpenAPI specifications |

---

## 10. Conclusion

SignBridge PK bridges the gap between silence and speech in Pakistan. By synthesizing **state-of-the-art multimodal artificial intelligence**, **linguistic domain modeling for PSL**, and an **accessible, human-centered user interface**, this project demonstrates how modern engineering can solve deep-rooted social problems and restore communication as an inclusive right for all.
