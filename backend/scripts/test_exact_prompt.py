import sys, os, json
sys.stdout.reconfigure(encoding='utf-8')
sys.path.insert(0, os.path.abspath('.'))
from ml.models.urdutopsl_model import PSLAnimationPipeline
from google.genai import types

p = PSLAnimationPipeline('ml/data/animation_registry.json')
cleaned = 'میرا نام امان ہے'
available_glosses_str = ', '.join(k for k in p.image_registry.keys() if not k.startswith('LETTER_'))

prompt = (
    f"You are an expert Pakistani Sign Language (PSL) translator.\n"
    f"Input (Urdu): \"{cleaned}\"\n\n"
    f"Target Vocabulary (PSL word signs available in our library):\n"
    f"[{available_glosses_str}]\n\n"
    f"Instructions:\n"
    f"1. If input is English, provide an accurate, natural Urdu translation in Urdu script. If already Urdu, clean it.\n"
    f"2. Convert into Pakistani Sign Language (PSL) grammar sequence:\n"
    f"   - Sentence structure: Subject-Object-Verb (SOV) order.\n"
    f"   - Wh-questions (WHAT, WHERE, HOW, etc.) MUST be placed at the very end.\n"
    f"   - Omit copula/helper verbs (is, am, are, hai, hain, hoon).\n"
    f"   - NEVER duplicate signs: For 'how are you' / 'آپ کیسے ہیں', output ONLY ['HOW_ARE_YOU'] (do NOT output 'YOU' and 'HOW_ARE_YOU' together).\n"
    f"   - For 'my name' / 'میرا نام', output ['MY_NAME'] (do NOT output 'I' or split into 'MY' and 'NAME').\n"
    f"   - For 'please help' / 'مدد', output ['PLEASE_HELP'].\n"
    f"   - Match concepts to the Target Vocabulary tokens whenever possible (e.g. 'water' / 'پانی' -> 'WATER', 'where' / 'کہاں' -> 'WHERE', 'hospital' / 'ہسپتال' -> 'HOSPITAL', 'want' / 'چاہیے' -> 'WANT', 'I' / 'مجھے' / 'میں' -> 'I', 'food' / 'کھانا' -> 'EAT').\n"
    f"   - For proper nouns, names, or words NOT in the Target Vocabulary (e.g. 'Amaan', 'Lahore'), output the word in uppercase English letters so it can be fingerspelled letter-by-letter.\n\n"
    f"Output valid JSON matching this exact structure:\n"
    f"{{\n"
    f"  \"urdu_translation\": \"Urdu sentence in Urdu script\",\n"
    f"  \"psl_words\": [\"WORD1\", \"WORD2\"]\n"
    f"}}"
)

res = p._gemini_client.models.generate_content(
    model=p.GEMINI_MODEL,
    contents=prompt,
    config=types.GenerateContentConfig(response_mime_type="application/json", temperature=0.1)
)

print("RAW GEMINI RESPONSE:")
print(res.text)

parsed = json.loads(res.text)
words = parsed.get("psl_words", [])
print("\nWORDS BEFORE CANONICALIZATION:", words)
print("WORDS AFTER CANONICALIZATION:", p.canonicalize_psl_words(words))
