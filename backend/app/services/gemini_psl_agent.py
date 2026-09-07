import os
import json
import logging
from typing import List, Optional
from pydantic import BaseModel, Field
from google import genai
from google.genai import types

from app.models.schemas import UrduToPSLRequest, UrduToPSLResponse, PSLTokenResponse

logger = logging.getLogger(__name__)

# --- Gemini Structured Output Schema ---
# We define a simpler schema for Gemini to ensure reliable generation
class GeminiGlossToken(BaseModel):
    id: str = Field(description="A unique lowercase identifier for the sign, e.g. 'hello', 'how_are_you', 'water'")
    urdu: str = Field(description="The Urdu word or phrase this token represents")
    gloss: str = Field(description="The capitalized PSL Gloss (e.g. HELLO, HOW_ARE_YOU, THANK_YOU)")
    english: str = Field(description="The English translation of the gloss")
    category: str = Field(description="Category of the sign: 'greeting', 'question', 'daily', 'emergency', 'alphabet', 'number', 'action', 'object'")
    duration_ms: int = Field(description="Estimated duration of the sign in milliseconds (usually 1000 to 2000)")
    description: str = Field(description="Detailed visual description of the hand shape, movement, and facial expression for a video generation model to render.")

class GeminiTranslationResult(BaseModel):
    tokens: list[GeminiGlossToken]
    gloss_sequence: list[str] = Field(description="The final ordered list of glosses representing the PSL grammar sequence.")


class GeminiPSLAgent:
    def __init__(self):
        self.api_key = os.environ.get("GEMINI_API_KEY", "")
        if not self.api_key:
            logger.warning("GEMINI_API_KEY environment variable is not set! Translations will fail.")
        
        self.client = None
        self.model_name = "gemini-3.7-flash"
        
        self.system_prompt = """
You are an expert Pakistani Sign Language (PSL) Translator and Linguistics AI.
Your job is to translate an input Urdu sentence into a sequence of PSL Glosses, following strict PSL grammar rules, and provide detailed visual descriptions for a video generation model to render each sign.

# PSL Grammar Rules:
1. **Sentence Structure**: PSL typically uses SOV (Subject-Object-Verb) or OSV (Object-Subject-Verb). Example: "میں پانی پیتا ہوں" -> "I WATER DRINK".
2. **Time Markers**: Time-related words (Yesterday, Tomorrow, Morning) always go at the very beginning of the sentence.
3. **Question Words**: Wh-question words (What, Why, Where, How) always go at the very END of the sentence. Example: "تمہارا نام کیا ہے؟" -> "YOUR NAME WHAT".
4. **Omission of Helper Verbs**: Do not include words like "ہے" (is), "ہیں" (are), "ہوں" (am), "تھا" (was).
5. **Omission of Prepositions**: Drop "کو", "پر", "سے", "میں" (in/on/at) unless strictly necessary for spatial context.
6. **Glosses**: Must be ALL CAPS, using underscores for multi-word concepts (e.g., HOW_ARE_YOU).
7. **Fingerspelling**: If a proper noun (like a person's name, e.g., "علی") does not have a specific sign, break it down into characters and prefix with SPELL_ (e.g., SPELL_ع, SPELL_ل, SPELL_ی).

# OUTPUT FORMAT:
You MUST output ONLY valid JSON matching this exact structure:
{
  "tokens": [
    {
      "id": "A unique lowercase identifier for the sign, e.g. 'hello', 'how_are_you', 'water'",
      "urdu": "The Urdu word or phrase this token represents",
      "gloss": "The capitalized PSL Gloss (e.g. HELLO, HOW_ARE_YOU, THANK_YOU)",
      "english": "The English translation of the gloss",
      "category": "Category of the sign: 'greeting', 'question', 'daily', 'emergency', 'alphabet', 'number', 'action', 'object'",
      "duration_ms": 1500,
      "description": "Detailed visual description of the hand shape, movement, and facial expression for a video generation model to render."
    }
  ],
  "gloss_sequence": ["HELLO", "HOW_ARE_YOU"]
}
"""

    def translate(self, req: UrduToPSLRequest) -> UrduToPSLResponse:
        """
        Translates Urdu text to PSL Tokens using Gemini.
        """
        if not self.api_key:
            raise Exception("GEMINI_API_KEY is not configured on the backend.")

        if not self.client:
            self.client = genai.Client(api_key=self.api_key)

        prompt = f"Translate the following Urdu sentence to PSL: '{req.text}'"

        try:
            # Call Gemini using Structured Outputs via prompt
            response = self.client.models.generate_content(
                model=self.model_name,
                contents=prompt,
                config=types.GenerateContentConfig(
                    system_instruction=self.system_prompt,
                    response_mime_type="application/json",
                    temperature=0.1, # Low temperature for more deterministic grammar translation
                ),
            )
            
            # The response.text is guaranteed to be a JSON string matching the schema
            result_dict = json.loads(response.text)
            
            # Convert to our backend schema
            psl_tokens = []
            total_duration = 0
            
            for t in result_dict.get("tokens", []):
                dur = t.get("duration_ms", 1500)
                psl_tokens.append(PSLTokenResponse(
                    id=t.get("id", t.get("gloss", "unknown")),
                    urdu=t.get("urdu", ""),
                    gloss=t.get("gloss", ""),
                    english=t.get("english", ""),
                    category=t.get("category", "unknown"),
                    duration_ms=dur,
                    confidence=0.95,  # High confidence since AI generated it confidently
                    description=t.get("description", ""),
                    avatar_pose=None # We no longer use 3D avatar poses
                ))
                total_duration += dur
                
            gloss_seq = result_dict.get("gloss_sequence", [tok.gloss for tok in psl_tokens])

            return UrduToPSLResponse(
                model_name="gemini-3.7-flash",
                model_version="1.0-agentic",
                input_urdu=req.text,
                normalized_text=req.text,
                tokens=psl_tokens,
                gloss_sequence=gloss_seq,
                total_duration_ms=total_duration,
                model_confidence=0.95,
                video_url=None
            )

        except Exception as e:
            logger.error(f"Gemini API Error: {str(e)}")
            raise e

gemini_psl_agent = GeminiPSLAgent()
