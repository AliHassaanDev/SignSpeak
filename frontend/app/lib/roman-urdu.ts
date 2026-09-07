/**
 * Roman Urdu / English → Urdu Script Converter
 *
 * Root cause this solves: the quick-preset chips send Urdu script ("کھانا")
 * which matches PSL_DICTIONARY keys directly, while anything typed in the
 * search box in Roman letters ("khana") never matched any Urdu-script key and
 * fell through to letter-by-letter fingerspelling (SPELL_k, SPELL_h, ...).
 *
 * Architecture (user-approved): convert the text entered in the search box to
 * Urdu script FIRST, then hand it to the normal Urdu→PSL pipeline. This is a
 * deterministic, offline map — no API call, no latency, no network failure.
 *
 * Matching strategy:
 *   1. Full-phrase match (multi-word entries, checked first).
 *   2. Word-by-word match with spelling-variant tolerance
 *      ("khana" / "khaana" / "khanaa" / "food" / "eat" → "کھانا").
 *   3. Unknown words pass through unchanged — fingerspelling remains the
 *      correct PSL fallback for out-of-vocabulary words and names.
 */

/* ────────────────── Multi-word phrase map (checked first) ────────────────── */

const PHRASE_MAP: Record<string, string> = {
  // Greetings
  "assalam o alaikum": "السلام علیکم",
  "assalamu alaikum": "السلام علیکم",
  "assalam alaikum": "السلام علیکم",
  "asalam alaikum": "السلام علیکم",
  "salam alaikum": "السلام علیکم",
  "salam alaykum": "السلام علیکم",
  "assalamualaikum": "السلام علیکم",

  // Questions
  "aap kaise hain": "آپ کیسے ہیں؟",
  "aap kaisay hain": "آپ کیسے ہیں؟",
  "aap kese hain": "آپ کیسے ہیں؟",
  "ap kaise hain": "آپ کیسے ہیں؟",
  "aap kaise ho": "آپ کیسے ہیں؟",
  "kya haal hai": "آپ کیسے ہیں؟",
  "kaise hain": "کیسے ہیں",
  "kaisay hain": "کیسے ہیں",
  "kese hain": "کیسے ہیں",

  // Emergency / help
  "barah karam madad karein": "براہ کرم مدد کریں",
  "meherbani madad karein": "براہ کرم مدد کریں",
  "please madad karein": "براہ کرم مدد کریں",
  "madad karein": "براہ کرم مدد کریں",
  "madad karen": "براہ کرم مدد کریں",
  "madad karo": "براہ کرم مدد کریں",

  // Welcome / goodbye
  "khush amdeed": "خوش آمدید",
  "khush aamdeed": "خوش آمدید",
  "khush amd": "خوش آمدید",
  "allah hafiz": "اللہ حافظ",
  "khuda hafiz": "اللہ حافظ",

  // My name
  "mera naam": "میرا نام",
  "mera nam": "میرا نام",
  "mara naam": "میرا نام",

  // English phrases
  hello: "السلام علیکم",
  "thank you": "شکریہ",
  thanks: "شکریہ",
  "how are you": "آپ کیسے ہیں؟",
  "please help": "براہ کرم مدد کریں",
  "help me": "براہ کرم مدد کریں",
  welcome: "خوش آمدید",
  goodbye: "اللہ حافظ",
  bye: "اللہ حافظ",
  "my name": "میرا نام",
};

/* ────────────────── Single-word map (with common variants) ────────────────── */

const WORD_MAP: Record<string, string> = {
  // Greetings
  salam: "سلام",
  salaam: "سلام",
  shukriya: "شکریہ",
  shukria: "شکریہ",
  shukarya: "شکریہ",
  sukriya: "شکریہ",
  khushamdeed: "خوش آمدید",

  // Emergency
  madad: "مدد",
  hospital: "ہسپتال",
  haspatal: "ہسپتال",
  doctor: "ڈاکٹر",
  daktar: "ڈاکٹر",
  daktir: "ڈاکٹر",

  // Daily
  pakistan: "پاکستان",
  pani: "پانی",
  paani: "پانی",
  panee: "پانی",
  khana: "کھانا",
  khaana: "کھانا",
  khanaa: "کھانا",
  khaanaa: "کھانا",
  haan: "ہاں",
  han: "ہاں",
  nahin: "نہیں",
  nahi: "نہیں",
  naheen: "نہیں",
  dost: "دوست",
  school: "اسکول",
  skool: "اسکول",
  iskool: "اسکول",

  // English single words
  hi: "سلام",
  water: "پانی",
  food: "کھانا",
  eat: "کھانا",
  meal: "کھانا",
  yes: "ہاں",
  no: "نہیں",
  friend: "دوست",
};

/* ────────────────── Fuzzy normalization (spelling variants) ────────────────── */

/**
 * Collapses repeated vowels so common Roman-Urdu long-vowel spellings unify:
 *   "khaana" → "khana", "salaam" → "salam", "paani" → "pani"
 * Applied to BOTH the map keys and the input, so matching stays consistent.
 */
function collapseVowels(word: string): string {
  return word.replace(/([aeiou])\1+/g, "$1");
}

// Pre-built normalized indexes: collapsed key → Urdu value
const PHRASE_NORM_INDEX: Record<string, string> = {};
for (const [k, v] of Object.entries(PHRASE_MAP)) {
  PHRASE_NORM_INDEX[collapseVowels(k)] = v;
}

const WORD_NORM_INDEX: Record<string, string> = {};
for (const [k, v] of Object.entries(WORD_MAP)) {
  WORD_NORM_INDEX[collapseVowels(k)] = v;
}

/* ────────────────── Public API ────────────────── */

/**
 * Detects whether the text is written in Latin (Roman) script.
 * Urdu-script input returns false and is left untouched by the converter.
 */
export function isRomanScript(text: string): boolean {
  const letters = text.replace(/[^a-zA-Z\u0600-\u06FF]/g, "");
  if (!letters) return false;
  const latin = (text.match(/[a-zA-Z]/g) || []).length;
  const arabic = (text.match(/[\u0600-\u06FF]/g) || []).length;
  return latin > arabic;
}

/**
 * Converts Roman Urdu / English text to Urdu script.
 *
 * Tries the full phrase first, then converts word by word. Unknown words are
 * passed through unchanged so the downstream fingerspelling fallback still
 * works for names and out-of-vocabulary words.
 *
 * Returns the ORIGINAL text unchanged when no conversion applies.
 */
export function convertRomanToUrdu(text: string): string {
  const cleaned = text
    .trim()
    .toLowerCase()
    .replace(/[،,۔.!؟?]/g, " ")
    .replace(/\s+/g, " ");
  if (!cleaned) return text;

  // 1. Full-phrase match (exact, then vowel-collapsed)
  if (PHRASE_MAP[cleaned]) return PHRASE_MAP[cleaned];
  const phraseNorm = collapseVowels(cleaned);
  if (PHRASE_NORM_INDEX[phraseNorm]) return PHRASE_NORM_INDEX[phraseNorm];

  // 2. Word-by-word conversion
  const words = cleaned.split(" ");
  let anyConverted = false;
  const convertedWords = words.map((w) => {
    if (!w) return w;
    const hit = WORD_MAP[w] ?? WORD_NORM_INDEX[collapseVowels(w)];
    if (hit) {
      anyConverted = true;
      return hit;
    }
    return w; // unknown word → pass through (fingerspelling fallback)
  });

  return anyConverted ? convertedWords.join(" ") : text;
}
