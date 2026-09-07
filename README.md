# SignBridge PK (SignSpeak) 🇵🇰
### Two-Way Pakistani Sign Language (PSL) ⇄ Urdu Communication Assistant

[![Next.js](https://img.shields.io/badge/Frontend-Next.js%2016-black?logo=next.js)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI%20Python%203.11-009688?logo=fastapi)](https://fastapi.tiangolo.com/)
[![Gemini](https://img.shields.io/badge/AI-Google%20Gemini%20Multimodal-4285F4?logo=google)](https://ai.google.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5+-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![Status](https://img.shields.io/badge/Status-Active%20%26%20Verified-success)]()

---

## 📖 Complete Documentation
> **Looking for comprehensive technical and social impact documentation?**  
> 📄 Read the full [**Project Documentation (`docs/PROJECT_DOCUMENTATION.md`)**](docs/PROJECT_DOCUMENTATION.md) for deep dives into:
> - Problem Statement & The PSL Interpreter Deficit in Pakistan
> - Target Audience & Real-World Healthcare / Emergency Impact
> - End-to-End System Pipelines & Sequence Architecture
> - Complete Component & File Inventory

---

## 🌟 Overview

**SignBridge PK** is an AI-powered assistive communication platform that bridges the communication divide between Pakistan's **1.5+ million Deaf and Hard of Hearing (DHH)** citizens and the hearing community.

Traditional translation tools fail because Pakistani Sign Language (PSL) is an independent visual-spatial language with its own grammar and vocabulary, completely distinct from spoken Urdu or American Sign Language (ASL). SignBridge PK provides a real-time, browser-accessible, bidirectional solution.

---

## ✨ Key Features

### 1. 🤟 Direction 1: PSL to Urdu (Deaf → Hearing)
- **Real-Time Camera & Video Upload**: Record sign gestures directly via webcam or upload pre-recorded video files.
- **Multimodal Gemini Vision Pipeline**: Analyzes continuous sign gestures, extracts individual gloss tokens, and predicts model confidence.
- **Natural Intent Extraction**: Synthesizes fluent, natural Urdu and English sentences with tone classification (e.g., polite, urgent, inquiry, greeting).
- **Synchronized Urdu Audio (TTS)**: Automatically speaks the recognized Urdu sentence aloud for hearing conversation partners.

### 2. 🗣️ Direction 2: Urdu to PSL (Hearing → Deaf)
- **Multi-Modal Input**: Type formal Urdu script, speak into the microphone via Urdu Speech-to-Text (`ur-PK`), or use Roman Urdu transliteration (e.g., `doctor`, `madad`, `shukriya`).
- **Hybrid PSL Gloss Resolution**: Fast client-side tokenization backed by a Gemini-powered animation pipeline (`POST /api/text-to-psl`).
- **PSL Video Player**: Visual sequence player rendering 60+ pre-rendered sign graphics and UAlpha40 Urdu alphabet fingerspelling fallback.
- **Playback Controls**: Speed toggling (0.6x, 1.0x, 1.4x), timeline progression, replay, and fullscreen mode.

### 3. 🎓 Interactive PSL Academy & Conversational AI Tutor (`/learn`)
- **Curriculum Levels 1–4**: Covers Fingerspelling, Emergencies, Food & Questions, Grammar, and Reverse Translation.
- **Gemini AI Tutor**: Conversational instructor providing step-by-step guidance, physical hand movement descriptions, and interactive multiple-choice quizzes.

### 4. 💬 Help Assistant Widget (`ChatBot`)
- Floating interactive assistant offering instant tips on lighting, camera positioning, and application usage.

---

## 🚀 Quick Start Guide

### Prerequisites
- Python 3.10 or 3.11
- Node.js 18+ (with npm)
- A Google Gemini API Key from [Google AI Studio](https://aistudio.google.com/)

### Environment Setup
1. Create a `.env` file in the project root:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   ```
2. Create `frontend/.env.local`:
   ```env
   NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
   GEMINI_API_KEY=your_gemini_api_key_here
   ```

### Installation
**Windows Automated Setup:**
Double-click `setup.bat` to install all dependencies for both Python and Node.js.

**Manual Setup:**
```bash
# Setup Python Backend
python -m venv venv
.\venv\Scripts\activate      # On Linux/Mac: source venv/bin/activate
pip install -r backend/requirements.txt

# Setup Frontend
cd frontend
npm install
cd ..
```

### Running Locally
**Windows Automated Launch:**
Double-click `start.bat`.

**Manual Launch:**
```bash
# Terminal 1: Backend
cd backend
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload

# Terminal 2: Frontend
cd frontend
npm run dev
```

---

## 🌐 Application URLs

| Service | URL | Description |
| :--- | :--- | :--- |
| **Frontend Web App** | [http://localhost:3000](http://localhost:3000) | Two-Way Translator, Camera Interface, & Video Player |
| **Learn PSL Portal** | [http://localhost:3000/learn](http://localhost:3000/learn) | Curriculum Levels & Gemini AI Tutor |
| **FastAPI Backend** | [http://localhost:8000](http://localhost:8000) | Healthcheck & Model Status |
| **Interactive API Docs** | [http://localhost:8000/docs](http://localhost:8000/docs) | Swagger UI for testing REST endpoints |

---

## 🛠️ Technology Stack

- **Frontend**: Next.js 16 (App Router + Turbopack), React 19, TypeScript, Vanilla CSS (Glassmorphism), Lucide Icons.
- **Backend**: FastAPI (Python 3.11), Uvicorn ASGI server, Pydantic v2.
- **AI & Vision**: Google Gemini 3.6/3.7 Flash Multimodal Vision, Google GenAI SDK.
- **Datasets**: DynamicWordLevelPakistanSignLanguage, UAlpha40 Pakistani Sign Language Fingerspelling Alphabet.

---

## 📄 License
Academic and open research project created for advancing accessibility and inclusion in Pakistan.