import sys, os
sys.stdout.reconfigure(encoding='utf-8')
sys.path.insert(0, os.path.abspath('.'))
from ml.models.urdutopsl_model import PSLAnimationPipeline

p = PSLAnimationPipeline('ml/data/animation_registry.json')
text = 'میرا نام امان ہے'

available_glosses_str = ", ".join(k for k in p.image_registry.keys() if not k.startswith("LETTER_"))
prompt = (
    f"You are an expert Pakistani Sign Language (PSL) translator.\n"
    f"Input (Urdu): \"{text}\"\n\n"
    f"Target Vocabulary (PSL word signs available in our library):\n"
    f"[{available_glosses_str}]\n\n"
    f"Instructions:\n"
    f"1. Convert into Pakistani Sign Language (PSL) grammar sequence (SOV order).\n"
    f"2. For proper nouns, names, or words NOT in the Target Vocabulary, output the name in uppercase English letters (e.g. 'AMAAN').\n"
    f"Output valid JSON: {{\"urdu_translation\": \"...\", \"psl_words\": [...]}}"
)
from google.genai import types
res = p._gemini_client.models.generate_content(
    model=p.GEMINI_MODEL,
    contents=prompt,
    config=types.GenerateContentConfig(response_mime_type="application/json", temperature=0.1)
)
print("Raw Gemini response text:")
print(res.text)
import json
parsed = json.loads(res.text)
raw_words = parsed.get("psl_words", [])
print("Raw words from Gemini:", raw_words)
print("After canonicalize_psl_words:", p.canonicalize_psl_words(raw_words))

