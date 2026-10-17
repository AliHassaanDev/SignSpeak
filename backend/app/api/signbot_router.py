"""
SignBot Router - Ethical Sign Language & SignSpeak Assistant API
================================================================
Provides conversational AI assistance specifically grounded in:
1. Ethical Sign Language, Deaf culture, respectful etiquette, and accessibility.
2. SignSpeak application architecture, 5-step PSL recognition pipeline, and 3D avatar.
"""

import json
import logging
import os
from typing import Any, Dict, List, Optional
from pydantic import BaseModel
from fastapi import APIRouter

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/signbot", tags=["SignBot"])

SIGNBOT_SYSTEM_PROMPT = """You are SignBot, the official AI assistant of SignSpeak (Two-Way Pakistani Sign Language Communication Platform).
You are an empathetic, culturally knowledgeable, and authoritative expert in:
1. ETHICAL SIGN LANGUAGE & DEAF CULTURE:
   - Deaf Culture & Community Etiquette:
     * Never grab or hold a signer's hands (it is the physical equivalent of muffling or silencing someone's voice).
     * Getting attention respectfully: wave gently in their field of vision, lightly tap on the shoulder, or flicker room lights. Never kick chairs, slap, or throw objects.
     * Eye Contact: Always look at the signer's face and eyes, NOT stare at their hands. Looking away is equivalent to walking away in spoken conversation.
     * In conversations with an interpreter or app: Face and speak directly to the Deaf person, never say "tell him/her" to the interpreter.
     * Walking through a signing conversation: Do not stop, stare, or make a dramatic bowing scene. Pass through quickly or sign "excuse me" (معاف کیجیے).
   - Respectful Terminology:
     * Preferred: "Deaf" (ڈیف / سماعت سے محروم), "Hard of Hearing" (کم سننے والا).
     * Strictly Avoid: "Deaf-mute", "Deaf and dumb", or "گونگا بہرا" (these are derogatory, outdated, and offensive; Deaf individuals have voices, their language is complete).
   - Ethical AI in Sign Language:
     * Language Sovereignty: Sign language belongs to the Deaf community. Technology should empower and include, not exploit, patronize, or "cure" deaf individuals ("Hearing saviorism").
     * Assistive Bridge vs. Professional Interpreters: SignSpeak is an assistive bridge for everyday communication, learning, and public service accessibility. For high-stakes medical, legal, or court settings, certified human PSL interpreters must always be used.
     * Privacy & Consent: Never film or record a Deaf person signing without their explicit, informed consent. SignSpeak processes video data securely and respectfully.
     * Respecting PSL as a Natural Language: PSL (Pakistani Sign Language) is NOT simple pantomime or signed Urdu; it is a full, distinct language with Subject-Object-Verb (SOV) syntax, spatial grammar, and regional dialects (Karachi, Lahore, Rawalpindi/Islamabad, Peshawar, Quetta).
     * Non-Manual Markers (NMMs): Facial expressions, head nods, and body posture are grammatical requirements in PSL (e.g., questions, intensity, negation).

2. SIGNSPEAK APPLICATION CAPABILITIES & HOW IT WORKS:
   - What SignSpeak is: A bi-directional communication bridge serving 1.5M+ deaf individuals and hearing communities in Pakistan.
   - Mode 1: Urdu → PSL (3D Avatar Animation):
     * Input: Urdu script or Roman Urdu (e.g., "شکریہ", "shukriya", "مدد", "salam").
     * Pipeline: Offline rule dictionary + Fuzzy matching + Gemini NLU gloss translation into PSL gloss sequences.
     * 3D Avatar: Mixamo humanoid model rendered in Three.js / React Three Fiber with 35+ animated joints, individual finger articulation, PSL alphabet fingerspelling fallback, playback controls (Play, Pause, Replay, 0.5x to 2x speed, Expanded View, Sign Chips).
   - Mode 2: PSL → Urdu (Video Sign Recognition):
     * Input: Live webcam recording or video file upload (.mp4, .webm).
     * Unified 5-Step Pipeline:
       1. Video Preprocessing: 30 FPS normalization and spatial scaling via OpenCV.
       2. Landmark Extraction: MediaPipe Pose & Hands with body/wrist coordinate normalization (462-dim velocity & spatial features).
       3. Temporal Segmentation: Kinetic velocity and movement energy segmentation into candidate intervals.
       4. Sequence Classification: Local BiLSTM neural network for 31 core dataset signs.
       5. Gemini Multimodal Vision Fallback & Language Refinement: Handles open-vocabulary gestures (Assalam-o-Alaikum, Water, Hello, etc.) and formulates fluent, grammatical Urdu sentences.
     * Text-to-Speech (TTS): Speaks recognized Urdu translations aloud with a single click.
   - Troubleshooting: Camera permissions, good lighting, webcam positioning, auto-play toggle, expanded view.

3. TEACHING COMMON PSL SIGNS & GESTURAL ETHICS:
   - When asked how to sign a word (e.g., "Thank You" / شکریہ, "Assalam-o-Alaikum" / سلام, "Water" / پانی, "Help" / مدد, "Hello" / ہیلو, "Sorry" / معافی):
     * Break down the gesture into: Handshape, Starting Position, Movement trajectory, and Non-Manual Markers (facial expression & eye contact).
     * Emphasize that in PSL, facial expressions (Non-Manual Markers) are grammatical essentials conveying mood, intensity, and question form.
     * Always reinforce respectful Deaf communication: maintain warm eye contact with the face/eyes, never stare downward at hands, and never physically hold someone's hands.
     * Encourage the user to test the word in SignSpeak's "Urdu to PSL" mode to view the animated 3D avatar with 35+ articulated joints and slow-motion (0.5x) playback.

RESPONSE GUIDELINES:
- Be warm, encouraging, respectful, and articulate.
- Provide clear markdown formatting with bullet points and bold highlights.
- Include 2 to 4 relevant suggested follow-up questions at the end formatted with SUGGESTIONS:
- Support both English and Urdu queries naturally (if asked in Urdu, answer in polite Urdu).
"""

class ChatRequest(BaseModel):
    message: str
    history: Optional[List[Dict[str, str]]] = None

class ChatResponse(BaseModel):
    answer: str
    suggestions: List[str]
    source: str

@router.post("/chat", response_model=ChatResponse)
def signbot_chat(req: ChatRequest):
    """
    SignBot conversational endpoint powered by Gemini AI with ethical PSL grounding.
    """
    user_query = req.message.strip()
    if not user_query:
        return ChatResponse(
            answer="Hi! I'm SignBot. How can I help you with ethical sign language or using SignSpeak today?",
            suggestions=["What is ethical sign language?", "How does Urdu to PSL work?", "What is Deaf etiquette?"],
            source="default"
        )

    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        return _fallback_local_response(user_query)

    try:
        from google import genai
        from google.genai import types

        client = genai.Client(api_key=api_key)

        # Build context from previous conversation turns
        conversation_context = ""
        if req.history:
            recent_turns = req.history[-6:]  # Last 3 rounds
            for turn in recent_turns:
                role = turn.get("role", "user")
                text = turn.get("text", "")
                conversation_context += f"{role.upper()}: {text}\n"

        prompt = f"""{SIGNBOT_SYSTEM_PROMPT}

CONVERSATION HISTORY:
{conversation_context}

USER QUERY:
{user_query}

Respond in clean markdown. At the very end of your response, provide 3 suggested follow-up questions formatted as:
SUGGESTIONS:
- Question 1
- Question 2
- Question 3
"""

        models_to_try = ["gemini-3.5-flash-lite", "gemini-3.1-flash-lite", "gemini-3.7-flash"]
        response = None
        for m in models_to_try:
            try:
                response = client.models.generate_content(
                    model=m,
                    contents=prompt,
                    config=types.GenerateContentConfig(
                        temperature=0.3,
                        max_output_tokens=1000
                    )
                )
                if response and response.text:
                    break
            except Exception as me:
                logger.debug(f"[SignBot] Model {m} failed: {me}")

        if response and response.text:
            text = response.text.strip()
            answer, suggestions = _extract_suggestions(text)
            return ChatResponse(
                answer=answer,
                suggestions=suggestions,
                source="gemini_ai"
            )

    except Exception as e:
        logger.warning(f"[SignBot] Gemini API failed: {e}; falling back to rule base.")

    return _fallback_local_response(user_query)


def _extract_suggestions(raw_text: str) -> tuple[str, List[str]]:
    """Separates the markdown answer from the suggestions block."""
    suggestions = [
        "What are the rules of Deaf etiquette?",
        "How does the 5-step PSL recognition work?",
        "What is ethical AI in sign language?",
        "How do I use the 3D avatar?"
    ]
    if "SUGGESTIONS:" in raw_text:
        parts = raw_text.split("SUGGESTIONS:")
        answer = parts[0].strip()
        raw_sugg = parts[1].strip()
        parsed = []
        for line in raw_sugg.split("\n"):
            cleaned = line.strip().lstrip("-").lstrip("*").lstrip("1234567890.").strip()
            if cleaned and len(cleaned) > 3:
                parsed.append(cleaned)
        if parsed:
            suggestions = parsed[:4]
        return answer, suggestions

    return raw_text, suggestions


def _fallback_local_response(query: str) -> ChatResponse:
    """Provides high-quality static responses when offline or API is unavailable."""
    q = query.lower()

    if any(k in q for k in ["etiquette", "respect", "grab", "touch", "eye contact", "attention", "polite"]):
        return ChatResponse(
            answer=(
                "### 🤝 Key Deaf Community Etiquette & Ethics\n\n"
                "When communicating with Deaf individuals, observing proper etiquette is essential:\n\n"
                "1. **Never Grab Hands**: Grabbing someone's hands while they sign is the physical equivalent of covering their mouth.\n"
                "2. **Maintain Direct Eye Contact**: Always look at the person's eyes and face, not down at their hands.\n"
                "3. **Getting Attention Politely**: Wave gently in their peripheral vision, lightly tap on the shoulder, or flicker room lights. Never throw objects or kick chairs.\n"
                "4. **Look at the Deaf Person, Not the Interpreter**: When using an interpreter or app, maintain eye contact with the Deaf communicator.\n"
                "5. **Walking Through a Sign Conversation**: Pass through briskly without ducking or making an exaggerated scene."
            ),
            suggestions=[
                "What respectful terminology should I use?",
                "What is ethical AI in sign language?",
                "How does SignSpeak work?"
            ],
            source="ethical_knowledge_base"
        )

    if any(k in q for k in ["terminology", "mute", "dumb", "gonge", "behray", "word", "offensive"]):
        return ChatResponse(
            answer=(
                "### 💬 Respectful Terminology in Sign Language\n\n"
                "Words shape dignity. Here are the ethical guidelines for terminology:\n\n"
                "• **Respectful Terms**: Use **\"Deaf\"** (ڈیف / سماعت سے محروم) or **\"Hard of Hearing\"** (کم سننے والا).\n"
                "• **Offensive Terms to Avoid**: Strictly avoid terms like **\"Deaf-mute\"**, **\"Deaf and dumb\"**, or **\"گونگا بہرا\"**.\n\n"
                "Deaf individuals are not 'mute' or 'dumb' — their vocal cords are intact, and they possess a rich, natural, grammatically complete language: Pakistani Sign Language (PSL)."
            ),
            suggestions=[
                "What are the rules of Deaf etiquette?",
                "Is PSL a complete language?",
                "How does Urdu to PSL work?"
            ],
            source="ethical_knowledge_base"
        )

    if any(k in q for k in ["ethical ai", "saviorism", "ownership", "sovereignty", "replace interpreter"]):
        return ChatResponse(
            answer=(
                "### 🤖 Ethical AI in Sign Language\n\n"
                "SignSpeak adheres to core ethical principles for accessibility technology:\n\n"
                "1. **Deaf Community Ownership**: Sign languages belong to the Deaf community. Technology must serve and empower, avoiding 'hearing saviorism'.\n"
                "2. **Assistive Bridge, Not Interpreter Replacement**: SignSpeak facilitates everyday communication and learning. Certified human interpreters must always be used for critical medical, legal, or courtroom settings.\n"
                "3. **Informed Consent & Privacy**: SignSpeak processes live camera feeds on-device or through secure inference without secretly harvesting gesture data.\n"
                "4. **Linguistic Authenticity**: PSL has its own syntax (SOV) and regional dialects, which our 5-step pipeline and multimodal vision respect."
            ),
            suggestions=[
                "How does the 5-step PSL pipeline work?",
                "What is Deaf etiquette?",
                "Can I use SignSpeak in hospitals?"
            ],
            source="ethical_knowledge_base"
        )

    if any(k in q for k in ["thank you", "thanks", "shukriya", "شکریہ"]):
        return ChatResponse(
            answer=(
                "### 🙏 How to Sign \"Thank You\" (شکریہ) in PSL\n\n"
                "1. **Handshape:** Flatten your dominant hand with fingers held straight together, thumb slightly tucked.\n"
                "2. **Starting Position:** Touch your fingertips gently to your chin or lower cheek.\n"
                "3. **Movement:** Move your hand forward and slightly downward toward the person with an open palm facing upward.\n"
                "4. **Non-Manual Marker (Facial Expression):** Smile warmly and nod your head slightly. In PSL, facial expressions are grammatical requirements that express genuine gratitude!\n\n"
                "💡 **Deaf Etiquette Reminder:** Always maintain direct eye contact with the person's face/eyes while signing—never stare at their hands. You can also view this in SignSpeak's **Urdu → PSL** tab with our 3D avatar!"
            ),
            suggestions=[
                "How do I sign \"Assalam-o-Alaikum\" (سلام)?",
                "What are the rules of Deaf etiquette?",
                "How does the 3D avatar demonstrate signs?"
            ],
            source="ethical_knowledge_base"
        )

    if any(k in q for k in ["salam", "assalam", "hello", "greeting", "ہیلو", "السلام علیکم"]):
        return ChatResponse(
            answer=(
                "### ✋ How to Sign \"Assalam-o-Alaikum\" (سلام / السلام علیکم) in PSL\n\n"
                "1. **Handshape:** Open flat dominant hand, fingers together, thumb aligned.\n"
                "2. **Starting Position:** Place fingertips near the right temple / forehead (similar to a respectful salute).\n"
                "3. **Movement:** Sweep your hand outward and slightly forward toward the other person with a welcoming motion.\n"
                "4. **Non-Manual Marker:** Maintain direct, friendly eye contact with a welcoming smile.\n\n"
                "💡 **Cultural Note:** In Pakistani Deaf culture, eye contact and facial warmth are fundamental signs of respect. Test it now in the **Urdu → PSL** tab!"
            ),
            suggestions=[
                "How do I sign \"Thank You\" (شکریہ)?",
                "What is the best way to get a Deaf person's attention?",
                "How does PSL to Urdu video recognition work?"
            ],
            source="ethical_knowledge_base"
        )

    if any(k in q for k in ["water", "pani", "پانی"]):
        return ChatResponse(
            answer=(
                "### 💧 How to Sign \"Water\" (پانی) in PSL\n\n"
                "1. **Handshape:** Form a 'W' shape or extended three fingers (index, middle, ring), or a cupped hand.\n"
                "2. **Location:** Bring the fingers lightly near the side of the lips or mouth.\n"
                "3. **Movement:** Tap lightly twice near the corner of the mouth or chin, indicating drinking/water.\n"
                "4. **Context:** Pair with natural facial engagement.\n\n"
                "💡 You can record yourself signing this in **PSL → Urdu** mode or watch it on the 3D avatar in **Urdu → PSL** mode!"
            ),
            suggestions=[
                "How do I sign \"Thank You\"?",
                "What signs are supported by the camera?",
                "How does Urdu to PSL work?"
            ],
            source="ethical_knowledge_base"
        )

    if any(k in q for k in ["help", "madad", "مدد"]):
        return ChatResponse(
            answer=(
                "### 🤝 How to Sign \"Help\" (مدد) in PSL\n\n"
                "1. **Handshape:** Non-dominant hand flat, palm facing up. Dominant hand in a thumbs-up fist.\n"
                "2. **Starting Position:** Place the dominant fist resting on the open non-dominant palm.\n"
                "3. **Movement:** Lift both hands together upward/forward toward the person you are assisting or receiving help from.\n"
                "4. **Directionality:** If you are asking for help (*\"help me\"*), move hands toward yourself. If offering help (*\"I help you\"*), move hands toward the other person (PSL directional verb grammar)!\n\n"
                "💡 Notice how directional verbs work in PSL grammar without needing separate words!"
            ),
            suggestions=[
                "What is directional verb grammar in PSL?",
                "How do I sign \"Thank You\"?",
                "What are the rules of Deaf etiquette?"
            ],
            source="ethical_knowledge_base"
        )

    return ChatResponse(
        answer=(
            "### Welcome to SignBot! 🤟\n\n"
            "I'm here to answer questions about **Ethical Sign Language**, **Deaf Community Etiquette**, and how **SignSpeak** works.\n\n"
            "Feel free to ask about:\n"
            "• **Deaf Etiquette & Respectful Terminology**\n"
            "• **Ethical AI & Privacy in Accessibility**\n"
            "• **Urdu → PSL 3D Avatar Translation**\n"
            "• **PSL → Urdu 5-Step Camera Pipeline**"
        ),
        suggestions=[
            "What is Deaf etiquette?",
            "What is ethical AI in sign language?",
            "How does Urdu to PSL work?",
            "How does PSL to Urdu work?"
        ],
        source="default_local"
    )
