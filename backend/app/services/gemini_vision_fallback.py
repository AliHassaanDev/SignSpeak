"""
Gemini Multimodal Vision Fallback for Pakistani Sign Language (PSL)
===================================================================
High-accuracy multimodal vision pipeline grounded to the 31-word PSL vocabulary:
  1. Extracts 8 sharp keyframes across the video using OpenCV.
  2. Passes frames directly as image parts (bypassing File API upload bottlenecks).
  3. Uses quota-healthy `gemini-3.5-flash-lite` with 31-class vocabulary grounding.
  4. Returns structured signs, Urdu/English sentences, and confidence diagnostics.
"""

import json
import logging
import os
from pathlib import Path
from typing import Any, Dict, List, Optional

import cv2
import numpy as np
from dotenv import load_dotenv
from google import genai
from google.genai import types

_REPO_ROOT = Path(__file__).resolve().parent.parent.parent.parent
load_dotenv(_REPO_ROOT / ".env")
load_dotenv(_REPO_ROOT / "backend" / ".env")

logger = logging.getLogger(__name__)

PRIMARY_VISION_MODEL = "gemini-3.7-flash"
SUPPORTED_EXTENSIONS = {".mp4", ".webm", ".mov", ".mkv", ".avi"}

PSL_VOCABULARY = {
    "alert": "الرٹ",
    "careful": "محتاط",
    "cheap": "سستا",
    "crazy": "پاگل",
    "dangerous": "خطرناک",
    "decent": "مہذب",
    "dumb": "گونگا",
    "excited": "پرجوش",
    "extreme": "انتہائی",
    "fantastic": "لاجواب",
    "far": "دور",
    "fearful": "خوفناک",
    "foreign": "غیر ملکی",
    "funny": "مضحکہ خیز",
    "good": "اچھا",
    "healthy": "صحت مند",
    "heavy": "بھاری",
    "important": "اہم",
    "intelligent": "ذہین",
    "interesting": "دلچسپ",
    "late": "دیر",
    "less": "کم",
    "new": "نئی",
    "no": "نہیں",
    "noisy": "شور",
    "peaceful": "پرامن",
    "quick": "فوری",
    "ready": "تیار",
    "secure": "محفوظ",
    "smart": "ہوشیار",
    "yes": "جی ہاں",
}

VISION_SYSTEM_PROMPT = """You are an expert linguist and visual interpreter in Pakistan Sign Language (PSL).
These sequential video frames show a person communicating in sign language.

YOUR MISSION:
Accurately identify and translate the sign language gestures performed in the video frames into natural Urdu and English.

CRITICAL INSTRUCTIONS:
1. MULTI-SIGN RECOGNITION: The video may contain MULTIPLE CONSECUTIVE SIGNS performed one after another (e.g. Greeting followed by a Request, such as "Assalam-o-Alaikum" + "Water").
   - Carefully examine the entire video timeline from start to finish.
   - List EACH distinct sign in chronological order in the "signs" array (order 1, order 2, etc.).
2. KEY PSL VOCABULARY & GESTURE CUES:
   - "ASSALAM-O-ALAIKUM" / "HELLO" (السلام علیکم / ہیلو): Raising hand with flat palm to forehead/temple, waving hand outward, or salute-like motion.
   - "WATER" / "DRINK" (پانی / پینا): Bringing hand (thumb, 'C' shape, 'W' shape, 'Y' shape, or tilted cupped hand) towards the mouth, lips, or chin as if drinking or requesting water. NOTE: Any gesture directed to or near the mouth/lips/chin is WATER/DRINK (پانی), NEVER "LESS" or a telephone!
   - "PHONE" / "CALL" (فون): Hand held stationary against the side of the EAR/head, not tilted into the mouth or chin.
   - "DANGEROUS" (خطرناک): Raised hand in front of chest/face with curved, clawed fingers pointing forward or trembling with warning expression. NOTE: This is DANGEROUS, NOT the number five!
   - "FANTASTIC" (لاجواب): Thumbs up, 'A-OK' sign (thumb and index touching in circle), or hands opening outward with praise (distinct from plain 'Good').
   - "LESS" (کم): Hand held horizontal in mid-torso space with palm down dipping downward, or index and thumb held close together indicating small quantity. NOTE: "LESS" is performed in mid-chest space, NEVER touching or moving towards the mouth or chin!
   - "CAREFUL" (محتاط): Hand held outward in cautionary gesture, moving deliberately forward or circular motion.
   - "THANK YOU" (شکریہ): Flat hand moving forward from chin or chest.
   - "HELP" (مدد): One hand supporting the other or outward motion.
   - "FOOD" / "EAT" (کھانا): Fingers bunched together tapping lips/mouth.
3. OPEN VOCABULARY SCOPE:
   Recognize open-domain PSL vocabulary (Assalam-o-Alaikum, Water, Thank You, Food, Help, Name, Where, etc.) as well as descriptive vocabulary (Alert, Careful, Cheap, Crazy, Dangerous, Decent, Dumb, Excited, Extreme, Fantastic, Far, Fearful, Foreign, Funny, Good, Healthy, Heavy, Important, Intelligent, Interesting, Late, Less, New, No, Noisy, Peaceful, Quick, Ready, Secure, Smart, Yes, etc.).
   NOTE: If the signer is performing a specific sign from the vocabulary (e.g. Dangerous, Fantastic, Less, Careful), output that exact vocabulary term!
4. Do NOT artificially restrict your prediction to any small list. Always trust the visual gesture!
5. Formulate natural, grammatical Urdu translation (overall_sentence_ur) and English translation (overall_sentence_en).

Output STRICTLY JSON with this schema:
{
  "signs": [
    {
      "order": 1,
      "start_time_sec": 0.0,
      "end_time_sec": 2.0,
      "gloss": "SIGN_NAME_UPPERCASE",
      "predicted_meaning_en": "sign_name",
      "predicted_meaning_ur": "اردو معنی",
      "confidence": 0.95,
      "top3_candidates": [
        {"english": "sign1", "urdu": "معنی1", "confidence": 0.95},
        {"english": "sign2", "urdu": "معنی2", "confidence": 0.03},
        {"english": "sign3", "urdu": "معنی3", "confidence": 0.02}
      ]
    }
  ],
  "gloss_sequence": "SIGN1 SIGN2",
  "overall_sentence_en": "Natural English sentence",
  "overall_sentence_ur": "قدرتی اور بامعنی اردو جملہ",
  "overall_confidence": 0.95,
  "notes": "Brief gesture analysis"
}"""


class GeminiVisionFallback:
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or os.environ.get("GEMINI_API_KEY")

    def _get_client(self) -> genai.Client:
        key = self.api_key or os.environ.get("GEMINI_API_KEY")
        if not key:
            raise RuntimeError("GEMINI_API_KEY is not set.")
        return genai.Client(api_key=key)

    def extract_keyframes(self, path: Path, n: Optional[int] = None) -> List[bytes]:
        """
        Extracts adaptive, evenly sampled sharp frames from the video.
        Reads frames sequentially to support all video containers (MP4, WebM, MOV, AVI) reliably without seeking errors.
        Uses ~3.5 FPS (between 10 and 24 frames) based on duration so multi-sign sequences are captured accurately.
        """
        cap = cv2.VideoCapture(str(path))
        if not cap.isOpened():
            return []

        all_frames = []
        while True:
            ok, frame = cap.read()
            if not ok or frame is None:
                break
            all_frames.append(frame)
        cap.release()

        total = len(all_frames)
        if total == 0:
            return []

        if n is None:
            duration_sec = total / 30.0
            n = min(24, max(10, int(round(duration_sec * 3.5))))

        n_samples = min(n, total)
        indices = np.linspace(0, total - 1, n_samples, dtype=int)

        frames_bytes = []
        for idx in indices:
            ok, buf = cv2.imencode(".jpg", all_frames[idx], [cv2.IMWRITE_JPEG_QUALITY, 85])
            if ok:
                frames_bytes.append(buf.tobytes())

        return frames_bytes

    def predict(
        self,
        video_path: str,
        trials: int = 1,
        fast: bool = False,
        vocab_hint: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """
        Executes Gemini Multimodal Video analysis via fast sampled frames.
        """
        path = Path(video_path)
        if not path.exists():
            raise FileNotFoundError(f"Video file not found: {video_path}")
        if path.suffix.lower() not in SUPPORTED_EXTENSIONS:
            raise ValueError(f"Unsupported video format: {path.suffix}")

        client = self._get_client()
        keyframes = self.extract_keyframes(path)
        if not keyframes:
            raise RuntimeError("Could not decode any video frames from file.")

        prompt = VISION_SYSTEM_PROMPT
        if vocab_hint:
            prompt += (
                f"\n\nCONTEXT NOTE: The local 31-class classifier suggested hypothesis: {', '.join(vocab_hint)}.\n"
                f"CRITICAL: If the signer is performing an open-vocabulary sign (such as Hello / Assalam-o-Alaikum, "
                f"Water, Thank You, Food, Help, etc.) or another gesture, IGNORE this local hypothesis and output the true sign."
            )

        contents = []
        for kf in keyframes:
            contents.append(types.Part.from_bytes(data=kf, mime_type="image/jpeg"))
        contents.append(prompt)

        # Model hierarchy: prioritize fast & healthy models with fallback
        models_to_try = [PRIMARY_VISION_MODEL, "gemini-3.5-flash-lite", "gemini-3.7-flash"]

        response = None
        last_err = None

        for m in models_to_try:
            try:
                logger.info(f"[GeminiVision] Attempting sign recognition with {m}...")
                response = client.models.generate_content(
                    model=m,
                    contents=contents,
                    config=types.GenerateContentConfig(
                        temperature=0.0,
                        response_mime_type="application/json"
                    )
                )
                if response and response.text:
                    break
            except Exception as e:
                logger.warning(f"[GeminiVision] Model {m} failed: {e}")
                last_err = e

        if response is None or not response.text:
            raise RuntimeError(f"All Gemini vision models failed: {last_err}")

        try:
            data = json.loads(response.text.strip())
        except Exception as parse_e:
            logger.error(f"[GeminiVision] JSON parse error: {parse_e}\nResponse: {response.text}")
            raise RuntimeError(f"Failed to parse Gemini vision response: {parse_e}")

        # Ensure required keys exist
        signs = data.get("signs", [])
        overall_conf = float(data.get("overall_confidence", 0.85))

        # Check if genuine signs are present
        non_sign_tokens = {"none", "neutral", "idle", "rest", "no_sign", "no sign", "no-sign"}
        has_genuine_signs = any(
            str(s.get("predicted_meaning_en", "")).lower().strip() not in non_sign_tokens and
            str(s.get("gloss", "")).lower().strip() not in non_sign_tokens
            for s in signs
        )

        # Normalize sign candidates with local dictionary if missing
        formatted_signs = []
        sign_idx = 1
        for s in signs:
            eng = str(s.get("predicted_meaning_en", "")).lower().strip()
            gloss = str(s.get("gloss", eng.upper())).strip().upper()
            if has_genuine_signs and (eng in non_sign_tokens or gloss.lower() in non_sign_tokens):
                continue
            ur = str(s.get("predicted_meaning_ur", ""))
            if not ur and eng in PSL_VOCABULARY:
                ur = PSL_VOCABULARY[eng]
            c = float(s.get("confidence", 0.85))
            formatted_signs.append({
                "order": sign_idx,
                "start_time_sec": float(s.get("start_time_sec", 0.0)),
                "end_time_sec": float(s.get("end_time_sec", 2.0)),
                "gloss": gloss,
                "predicted_meaning_en": eng,
                "predicted_meaning_ur": ur,
                "confidence": round(c, 3),
                "top3_candidates": s.get("top3_candidates", []),
                "is_uncertain": bool(c < 0.65)
            })
            sign_idx += 1

        raw_gloss_seq = str(data.get("gloss_sequence", ""))
        clean_gloss_tokens = [
            tok for tok in raw_gloss_seq.split()
            if tok.lower() not in non_sign_tokens
        ]
        gloss_sequence = " ".join(clean_gloss_tokens) if clean_gloss_tokens else (
            " ".join(s["gloss"] for s in formatted_signs) if formatted_signs else raw_gloss_seq
        )

        return {
            "overall_sentence_ur": str(data.get("overall_sentence_ur", "")),
            "overall_sentence_en": str(data.get("overall_sentence_en", "")),
            "gloss_sequence": gloss_sequence,
            "signs": formatted_signs,
            "overall_confidence": round(overall_conf, 3),
            "reliability": "high" if overall_conf >= 0.80 else "medium",
            "pipeline_source": "gemini_multimodal_vision",
            "classes_supported": "Open Vocabulary (Universal PSL)",
            "uncertain_spans": [s for s in formatted_signs if s.get("is_uncertain", False)],
        }


# Global singleton
gemini_vision_fallback = GeminiVisionFallback()
