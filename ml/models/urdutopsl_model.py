"""
UrduToPSL PyTorch Sequence Model Architecture (urdutopsl)

Model architecture designed for Kaggle training on Dynamic Word-Level PSL dataset + UAlpha40.
Converts normalized Urdu text embeddings into PSL Sign Gloss tokens and keyframe joint coordinates.
"""

import json
import os
import re
import time
from pathlib import Path
from typing import List, Dict, Optional

from dotenv import load_dotenv

# Load .env from the project root (Two-Way-PSL-Translator/) before any
# os.getenv() call.  The argument-less load_dotenv() additionally picks up a
# .env from the current working directory (e.g. backend/) if one exists.
_PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
load_dotenv(_PROJECT_ROOT / ".env")
load_dotenv()

# google-genai is an optional dependency: when it is not installed (or no
# GEMINI_API_KEY is configured) the pipeline transparently degrades to the
# rule-based gloss matching below, so the backend never hard-fails.
try:
    from google import genai
    from google.genai import types
    _GEMINI_SDK_AVAILABLE = True
except ImportError:  # pragma: no cover
    genai = None
    types = None
    _GEMINI_SDK_AVAILABLE = False


class PSLAnimationPipeline:
    """End-to-end pipeline: Urdu text -> PSL Gloss -> resolved .glb animation queue."""

    # Simple rule-based Urdu-to-PSL-Gloss translation map.
    # Keys include both Roman-Urdu (lowercase) and native Urdu script;
    # values are PSL Gloss strings.
    URDU_TO_GLOSS_RULES: Dict[str, str] = {
        # Roman Urdu
        "mujhe doctor ke paas jana hai": "I DOCTOR GO WANT",
        "mujhe madad chahiye": "I HELP WANT",
        "mera naam kya hai": "MY_NAME WHAT",
        "assalamu alaikum": "HELLO",
        "shukriya": "THANK_YOU",
        "kya haal hai": "HOW_ARE_YOU",
        # Native Urdu script
        "\u067e\u0627\u06a9\u0633\u062a\u0627\u0646": "PAKISTAN",
        "\u0622\u067e \u06a9\u06cc\u0633\u06d2 \u06c1\u06cc\u06ba": "HOW_ARE_YOU",
        "\u0622\u067e \u06a9\u06cc\u0633\u06d2 \u06c1\u06cc\u06ba\u061f": "HOW_ARE_YOU",
        "\u0628\u0631\u0627\u06c1 \u06a9\u0631\u0645 \u0645\u062f\u062f \u06a9\u0631\u06cc\u06ba": "PLEASE_HELP",
        "\u0634\u06a9\u0631\u06cc\u06c1": "THANK_YOU",
        "\u067e\u0627\u0646\u06cc": "WATER",
        "\u06a9\u06be\u0627\u0646\u0627": "EAT",
        "\u06a9\u06be\u0627\u0646\u0627 \u06a9\u06be\u0627\u0626\u06cc\u06ba": "EAT",
        # Additional word-level rules so the backend matches the frontend
        # dictionary glosses (and the keyframe JSON) instead of emitting
        # unresolved WORD_SIGN tokens.
        "\u0633\u0644\u0627\u0645": "HELLO",
        "\u0627\u0644\u0633\u0644\u0627\u0645 \u0639\u0644\u06cc\u06a9\u0645": "HELLO",
        "\u062e\u0648\u0634 \u0622\u0645\u062f\u06cc\u062f": "WELCOME",
        "\u0627\u0644\u0644\u06c1 \u062d\u0627\u0641\u0638": "GOODBYE",
        "\u062e\u0648\u062f\u0627 \u062d\u0627\u0641\u0638": "GOODBYE",
        "\u0645\u062f\u062f": "PLEASE_HELP",
        "\u06c1\u0633\u067e\u062a\u0627\u0644": "HOSPITAL",
        "\u0688\u0627\u06a9\u0679\u0631": "DOCTOR",
        "\u06c1\u0627\u06ba": "YES",
        "\u0646\u06c1\u06cc\u06ba": "NO",
        "\u062f\u0648\u0633\u062a": "FRIEND",
        "\u0627\u0633\u06a9\u0648\u0644": "SCHOOL",
        "\u0645\u06cc\u0631\u0627 \u0646\u0627\u0645": "MY_NAME",
    }

    # Common Roman-Urdu spelling variations → canonical forms.
    # Applied word-by-word during normalization so fuzzy inputs
    # like "kya hal ha" become "kya haal hai" and match a rule.
    ROMAN_URDU_ALIASES: Dict[str, str] = {
        "hal": "haal",
        "ha": "hai",
        "hain": "hai",
        "hyn": "hai",
        "kia": "kya",
        "ky": "kya",
        "kese": "kaise",
        "kaisy": "kaise",
        "kaisay": "kaise",
        "ap": "aap",
        "doc": "doctor",
        "dr": "doctor",
        "medad": "madad",
        "shukria": "shukriya",
        "paani": "pani",
        "pani": "pani",
    }

    # Word-level gloss map used for partial / fuzzy matching when
    # no full-phrase rule matches. Known words are replaced with their
    # gloss; unknown words fall through to uppercase fingerspelling.
    WORD_GLOSS_MAP: Dict[str, str] = {
        # Medical & Health
        "doctor": "DOCTOR", "ڈاکٹر": "DOCTOR",
        "hospital": "HOSPITAL", "ہسپتال": "HOSPITAL",
        "medicine": "MEDICINE", "dawa": "MEDICINE", "dawaii": "MEDICINE", "دوائی": "MEDICINE", "دوا": "MEDICINE",
        "fever": "FEVER", "bukhar": "FEVER", "بخار": "FEVER",
        "pain": "PAIN", "dard": "PAIN", "درد": "PAIN",
        "sick": "SICK", "bimar": "SICK", "بیمار": "SICK",
        "blood": "BLOOD", "khoon": "BLOOD", "خون": "BLOOD",
        "ambulance": "AMBULANCE", "ایمبولینس": "AMBULANCE",
        "nurse": "NURSE", "نرس": "NURSE",
        "emergency": "EMERGENCY", "ایمرجنسی": "EMERGENCY",
        "police": "POLICE", "پولیس": "POLICE",
        # Food & Drink
        "water": "WATER", "pani": "WATER", "paani": "WATER", "پانی": "WATER",
        "mineral_water": "MINERAL_WATER",
        "tea": "TEA", "chai": "TEA", "چائے": "TEA",
        "green_tea": "GREEN_TEA", "قہوہ": "GREEN_TEA",
        "milk": "MILK", "doodh": "MILK", "دودھ": "MILK",
        "bread": "BREAD", "roti": "BREAD", "روٹی": "BREAD",
        "food": "FOOD", "khana": "EAT", "eat": "EAT", "کھانا": "EAT", "کھائیں": "EAT",
        "drink": "DRINK", "peena": "DRINK", "پینا": "DRINK",
        "rice": "RICE", "chawal": "RICE", "چاول": "RICE",
        "meat": "MEAT", "gosht": "MEAT", "گوشت": "MEAT",
        "chicken": "CHICKEN", "murghi": "CHICKEN", "مرغی": "CHICKEN",
        "fish": "FISH", "machli": "FISH", "مچھلی": "FISH",
        "egg": "EGG", "anda": "EGG", "انڈہ": "EGG",
        "sugar": "SUGAR", "cheeni": "SUGAR", "چینی": "SUGAR",
        "salt": "SALT", "namak": "SALT", "نمک": "SALT",
        "fruit": "FRUIT", "phal": "FRUIT", "پھل": "FRUIT",
        "apple": "APPLE", "saib": "APPLE", "سیب": "APPLE",
        "banana": "BANANA", "kela": "BANANA", "کیلا": "BANANA",
        "breakfast": "BREAKFAST", "nashta": "BREAKFAST", "ناشتہ": "BREAKFAST",
        "lunch": "LUNCH", "dopahar_ka_khana": "LUNCH",
        "dinner": "DINNER", "raat_ka_khana": "DINNER",
        # People & Family
        "family": "FAMILY", "khandan": "FAMILY", "خاندان": "FAMILY",
        "mother": "MOTHER", "ammi": "MOTHER", "maa": "MOTHER", "امی": "MOTHER", "ماں": "MOTHER",
        "father": "FATHER", "abbu": "FATHER", "baap": "FATHER", "ابو": "FATHER", "باپ": "FATHER",
        "brother": "BROTHER", "bhai": "BROTHER", "بھائی": "BROTHER",
        "sister": "SISTER", "behn": "SISTER", "bahen": "SISTER", "بہن": "SISTER",
        "son": "SON", "beta": "SON", "بیٹا": "SON",
        "daughter": "DAUGHTER", "beti": "DAUGHTER", "بیٹی": "DAUGHTER",
        "friend": "FRIEND", "dost": "FRIEND", "دوست": "FRIEND",
        "baby": "BABY", "bacha": "CHILD", "child": "CHILD", "بچہ": "CHILD",
        "boy": "BOY", "larka": "BOY", "لڑکا": "BOY",
        "girl": "GIRL", "larki": "GIRL", "لڑکی": "GIRL",
        "man": "MAN", "aadmi": "MAN", "آدمی": "MAN",
        "woman": "WOMAN", "aurat": "WOMAN", "عورت": "WOMAN",
        "teacher": "TEACHER", "ustad": "TEACHER", "استاد": "TEACHER",
        "student": "STUDENT", "shagird": "STUDENT", "طالب_علم": "STUDENT",
        "person": "PERSON", "shakhs": "PERSON", "شخص": "PERSON",
        "name": "NAME", "naam": "NAME", "نام": "NAME",
        # Time & Calendar
        "time": "TIME", "waqt": "TIME", "وقت": "TIME",
        "today": "TODAY", "aaj": "TODAY", "آج": "TODAY",
        "tomorrow": "TOMORROW", "kal": "TOMORROW", "کل": "TOMORROW",
        "yesterday": "YESTERDAY", "guzra_kal": "YESTERDAY",
        "day": "DAY", "din": "DAY", "دن": "DAY",
        "night": "NIGHT", "raat": "NIGHT", "رات": "NIGHT",
        "morning": "MORNING", "subah": "MORNING", "صبح": "MORNING",
        "evening": "EVENING", "shaam": "EVENING", "شام": "EVENING",
        "afternoon": "AFTERNOON", "dopahar": "AFTERNOON", "دوپہر": "AFTERNOON",
        "hour": "HOUR", "ghanta": "HOUR", "گھنٹہ": "HOUR",
        "minute": "MINUTE", "منٹ": "MINUTE",
        "week": "WEEK", "hafta": "WEEK", "ہفتہ": "WEEK",
        "month": "MONTH", "mahina": "MONTH", "مہینہ": "MONTH",
        "year": "YEAR", "saal": "YEAR", "سال": "YEAR",
        "now": "NOW", "ab": "NOW", "اب": "NOW",
        "later": "LATER", "baad_mein": "LATER", "بعد": "LATER",
        "always": "ALWAYS", "hamesha": "ALWAYS", "ہمیشہ": "ALWAYS",
        "never": "NEVER", "kabhi_nahin": "NEVER",
        # Places & Transport
        "pakistan": "PAKISTAN", "پاکستان": "PAKISTAN",
        "school": "SCHOOL", "اسکول": "SCHOOL",
        "house": "HOUSE", "home": "HOUSE", "ghar": "HOUSE", "گھر": "HOUSE",
        "room": "ROOM", "kamra": "ROOM", "کمرہ": "ROOM",
        "office": "OFFICE", "daftar": "OFFICE", "دفتر": "OFFICE",
        "shop": "SHOP", "dukan": "SHOP", "دکان": "SHOP",
        "market": "MARKET", "bazaar": "MARKET", "بازار": "MARKET",
        "city": "CITY", "shehar": "CITY", "شہر": "CITY",
        "village": "VILLAGE", "gaon": "VILLAGE", "گاؤں": "VILLAGE",
        "road": "ROAD", "sadak": "ROAD", "sarak": "ROAD", "سڑک": "ROAD",
        "street": "STREET", "gali": "STREET", "گلی": "STREET",
        "car": "CAR", "gaari": "CAR", "gari": "CAR", "گاڑی": "CAR",
        "bus": "BUS", "بس": "BUS",
        "train": "TRAIN", "railgari": "TRAIN", "ٹرین": "TRAIN",
        "airport": "AIRPORT", "ایئرپورٹ": "AIRPORT",
        "mosque": "MOSQUE", "masjid": "MOSQUE", "مسجد": "MOSQUE",
        # Verbs & Actions
        "come": "COME", "aao": "COME", "aana": "COME", "آئیں": "COME", "آؤ": "COME", "آنا": "COME",
        "go": "GO", "jao": "GO", "jana": "GO", "جاؤ": "GO", "جانا": "GO", "جائیں": "GO",
        "want": "WANT", "chahiye": "WANT", "چاہیے": "WANT",
        "need": "NEED", "zaroorat": "NEED", "ضرورت": "NEED",
        "see": "SEE", "look": "LOOK", "dekhna": "SEE", "dekho": "SEE", "دیکھیں": "SEE", "دیکھنا": "SEE",
        "listen": "LISTEN", "hear": "HEAR", "suno": "LISTEN", "sunna": "LISTEN", "سنیں": "LISTEN", "سننا": "LISTEN",
        "speak": "SPEAK", "talk": "TALK", "bolo": "SPEAK", "bolna": "SPEAK", "بولیں": "SPEAK", "بولنا": "SPEAK",
        "sit": "SIT", "baitho": "SIT", "baithna": "SIT", "بیٹھیں": "SIT", "بیٹھنا": "SIT",
        "stand": "STAND", "khare_hona": "STAND", "کھڑے_ہونا": "STAND",
        "sleep": "SLEEP", "so": "SLEEP", "sona": "SLEEP", "سوئیں": "SLEEP", "سونا": "SLEEP",
        "wake": "WAKE", "jaagna": "WAKE", "جاگنا": "WAKE",
        "work": "WORK", "kaam": "WORK", "کام": "WORK",
        "play": "PLAY", "khel": "PLAY", "khelna": "PLAY", "کھیلنا": "PLAY",
        "buy": "BUY", "khareedna": "BUY", "خریدنا": "BUY",
        "give": "GIVE", "dena": "GIVE", "do": "GIVE", "دیں": "GIVE", "دینا": "GIVE",
        "take": "TAKE", "lena": "TAKE", "lo": "TAKE", "لیں": "TAKE", "لینا": "TAKE",
        "stop": "STOP", "ruko": "STOP", "rokna": "STOP", "رکیں": "STOP", "روکنا": "STOP",
        "read": "READ", "parhna": "READ", "پڑھیں": "READ", "پڑھنا": "READ",
        "write": "WRITE", "likhna": "WRITE", "لکھیں": "WRITE", "لکھنا": "WRITE",
        "learn": "LEARN", "seekhna": "LEARN", "سیکھیں": "LEARN", "سیکھنا": "LEARN",
        "teach": "TEACH", "parhana": "TEACH", "پڑھانا": "TEACH",
        "understand": "UNDERSTAND", "samajhna": "UNDERSTAND", "سمجھنا": "UNDERSTAND",
        "know": "KNOW", "jaanna": "KNOW", "جاننا": "KNOW",
        "live": "LIVE", "rehna": "LIVE", "رہنا": "LIVE",
        "love": "LOVE", "pyar": "LOVE", "mohabat": "LOVE", "پیار": "LOVE", "محبت": "LOVE",
        "like": "LIKE", "pasand": "LIKE", "پسند": "LIKE",
        "clean": "CLEAN", "saaf": "CLEAN", "saf": "CLEAN", "صاف": "CLEAN",
        "wash": "WASH", "dhona": "WASH", "دھونا": "WASH",
        "cook": "COOK", "pakana": "COOK", "پکانا": "COOK",
        "walk": "WALK", "chalna": "WALK", "چلنا": "WALK",
        "run": "RUN", "dorna": "RUN", "دوڑنا": "RUN",
        "wait": "WAIT", "intezar": "WAIT", "انتظار": "WAIT",
        "call": "CALL", "bulana": "CALL", "بلاؤ": "CALL", "بلانا": "CALL",
        "send": "SEND", "bhejna": "SEND", "بھیجنا": "SEND",
        "open": "OPEN", "kholna": "OPEN", "کھولنا": "OPEN",
        "close": "CLOSE", "band_karna": "CLOSE", "بند": "CLOSE",
        "help": "HELP", "madad": "HELP", "مدد": "HELP",
        # Common Courtesy & Feelings
        "thank_you": "THANK_YOU", "shukriya": "THANK_YOU", "شکریہ": "THANK_YOU",
        "hello": "HELLO", "salam": "HELLO", "assalamu_alaikum": "HELLO", "سلام": "HELLO", "السلام_علیکم": "HELLO",
        "welcome": "WELCOME", "khushamdeed": "WELCOME", "خوش_آمدید": "WELCOME",
        "goodbye": "GOODBYE", "allah_hafiz": "GOODBYE", "اللہ_حافظ": "GOODBYE",
        "sorry": "SORRY", "maaf_karna": "SORRY", "معاف_کرنا": "SORRY",
        "excuse_me": "EXCUSE_ME", "sunye": "EXCUSE_ME",
        "please": "PLEASE", "baraye_meharbani": "PLEASE", "براہ_کرم": "PLEASE",
        "how_are_you": "HOW_ARE_YOU", "aap_kaise_hain": "HOW_ARE_YOU",
        "fine": "FINE", "theek": "FINE", "ٹھیک": "FINE",
        "yes": "YES", "haan": "YES", "جی_ہاں": "YES", "ہاں": "YES",
        "no": "NO", "nahin": "NO", "nahee": "NO", "نہیں": "NO",
        "good_morning": "GOOD_MORNING", "subah_bakhair": "GOOD_MORNING", "صبح_بخیر": "GOOD_MORNING",
        "good_night": "GOOD_NIGHT", "shab_bakhair": "GOOD_NIGHT", "شب_بخیر": "GOOD_NIGHT",
        "congratulations": "CONGRATULATIONS", "mubarak": "CONGRATULATIONS", "مبارک": "CONGRATULATIONS",
        "happy": "HAPPY", "khush": "HAPPY", "خوش": "HAPPY",
        "sad": "SAD", "udas": "SAD", "اداس": "SAD",
        "tired": "TIRED", "thaka": "TIRED", "تھکا": "TIRED",
        "good": "GOOD", "acha": "GOOD", "achha": "GOOD", "اچھا": "GOOD",
        "bad": "BAD", "bura": "BAD", "برا": "BAD",
        "big": "BIG", "bara": "BIG", "بڑا": "BIG",
        "small": "SMALL", "chota": "SMALL", "چھوٹا": "SMALL",
        "hot": "HOT", "garam": "HOT", "گرم": "HOT",
        "cold": "COLD", "thanda": "COLD", "ٹھنڈا": "COLD",
        "new": "NEW", "naya": "NEW", "نیا": "NEW",
        "old": "OLD", "purana": "OLD", "پرانا": "OLD",
        "fast": "FAST", "tez": "FAST", "تیز": "FAST",
        "slow": "SLOW", "ahista": "SLOW", "آہستہ": "SLOW",
        "easy": "EASY", "aasan": "EASY", "آسان": "EASY",
        "difficult": "DIFFICULT", "mushkil": "DIFFICULT", "مشکل": "DIFFICULT",
        "beautiful": "BEAUTIFUL", "khoobsurat": "BEAUTIFUL", "خوبصورت": "BEAUTIFUL",
        "hungry": "HUNGRY", "bhook": "HUNGRY", "بھوک": "HUNGRY",
        "thirsty": "THIRSTY", "pyaas": "THIRSTY", "پیاس": "THIRSTY",
        "safe": "SAFE", "mahfooz": "SAFE", "محفوظ": "SAFE",
        "true": "TRUE", "sach": "TRUE", "سچ": "TRUE",
        "false": "FALSE", "jhoot": "FALSE", "جھوٹ": "FALSE",
        # Pronouns & Questions
        "i": "I", "mujhe": "I", "main": "I", "میں": "I",
        "you": "YOU", "aap": "YOU", "tum": "YOU", "آپ": "YOU", "تم": "YOU",
        "he": "HE", "she": "SHE", "woh": "HE", "وہ": "HE",
        "we": "WE", "hum": "WE", "ہم": "WE",
        "they": "THEY",
        "my": "MY", "mera": "MY", "meri": "MY", "میرے": "MY", "میرا": "MY", "میری": "MY",
        "your": "YOUR", "aapka": "YOUR", "tumhara": "YOUR", "آپکا": "YOUR", "تمہارا": "YOUR",
        "our": "OUR", "hamara": "OUR", "ہمارا": "OUR",
        "what": "WHAT", "kya": "WHAT", "کیا": "WHAT",
        "where": "WHERE", "kahan": "WHERE", "کہاں": "WHERE",
        "when": "WHEN", "kab": "WHEN", "کب": "WHEN",
        "why": "WHY", "kyun": "WHY", "کیوں": "WHY",
        "who": "WHO", "kaun": "WHO", "کون": "WHO",
        "how": "HOW", "kaise": "HOW", "کیسے": "HOW",
        "this": "THIS", "yeh": "THIS", "یہ": "THIS",
        "that": "THAT",
        "all": "ALL", "sab": "ALL", "سب": "ALL",
        "some": "SOME", "kuch": "SOME", "کچھ": "SOME",
        # Numbers
        "one": "ONE", "ek": "ONE", "ایک": "ONE",
        "two": "TWO", "do": "TWO", "دو": "TWO",
        "three": "THREE", "teen": "THREE", "تین": "THREE",
        "four": "FOUR", "chaar": "FOUR", "چار": "FOUR",
        "five": "FIVE", "paanch": "FIVE", "پانچ": "FIVE",
        "six": "SIX", "chhay": "SIX", "چھ": "SIX",
        "seven": "SEVEN", "saat": "SEVEN", "سات": "SEVEN",
        "eight": "EIGHT", "aath": "EIGHT", "آٹھ": "EIGHT",
        "nine": "NINE", "nau": "NINE", "نو": "NINE",
        "ten": "TEN", "das": "TEN", "دس": "TEN",
        # Expanded Medical & Health
        "clinic": "CLINIC", "کلینک": "CLINIC",
        "pharmacy": "PHARMACY", "medical_store": "PHARMACY", "میڈیکل_سٹور": "PHARMACY", "فارمیسی": "PHARMACY",
        "bandage": "BANDAGE", "patti": "BANDAGE", "پٹی": "BANDAGE",
        "cough": "COUGH", "khansi": "COUGH", "کھانسی": "COUGH",
        "headache": "HEADACHE", "sar_dard": "HEADACHE", "سر_درد": "HEADACHE",
        "stomach": "STOMACH", "pait": "STOMACH", "پیٹ": "STOMACH",
        "heart": "HEART", "dil": "HEART", "دل": "HEART",
        "eye": "EYE", "aankh": "EYE", "آنکھ": "EYE",
        "ear": "EAR", "kaan": "EAR", "کان": "EAR",
        "patient": "PATIENT", "mareez": "PATIENT", "مریض": "PATIENT",
        "operation": "OPERATION", "آپریشن": "OPERATION",
        "disease": "DISEASE", "bimari": "DISEASE", "بیماری": "DISEASE",
        "syrup": "SYRUP", "شربت": "SYRUP",
        # Expanded Emergency & Safety
        "fire": "FIRE", "aag": "FIRE", "آگ": "FIRE",
        "rescue": "RESCUE", "bachao": "RESCUE", "بچاؤ": "RESCUE",
        "careful": "CAREFUL", "ehtiat": "CAREFUL", "احتیاط": "CAREFUL",
        "danger": "DANGER", "khatra": "DANGER", "خطرہ": "DANGER",
        # Expanded Household & Items
        "money": "MONEY", "paise": "MONEY", "پیسے": "MONEY", "رقم": "MONEY",
        "book": "BOOK", "kitab": "BOOK", "کتاب": "BOOK",
        "pen": "PEN", "qalam": "PEN", "قلم": "PEN",
        "door": "DOOR", "darwaza": "DOOR", "دروازہ": "DOOR",
        "bed": "BED", "bistar": "BED", "بستر": "BED", "پلنگ": "BED",
        "fan": "FAN", "pankha": "FAN", "پنکھا": "FAN",
        "light": "LIGHT", "batti": "LIGHT", "roshni": "LIGHT", "بتی": "LIGHT", "روشنی": "LIGHT",
        "clothes": "CLOTHES", "kapray": "CLOTHES", "کپڑے": "CLOTHES",
        "bathroom": "BATHROOM", "غسل_خانہ": "BATHROOM", "باتھ_روم": "BATHROOM",
        # Expanded Places & Education
        "college": "COLLEGE", "کالج": "COLLEGE",
        "university": "UNIVERSITY", "jamia": "UNIVERSITY", "جامعہ": "UNIVERSITY", "یونیورسٹی": "UNIVERSITY",
        "bank": "BANK", "بینک": "BANK",
        "park": "PARK", "پارک": "PARK",
        "hotel": "HOTEL", "ہوٹل": "HOTEL",
        "station": "STATION", "اسٹیشن": "STATION",
        # Expanded Transport
        "bicycle": "BICYCLE", "cycle": "BICYCLE", "سائیکل": "BICYCLE",
        "rickshaw": "RICKSHAW", "رکشہ": "RICKSHAW",
        "motorcycle": "MOTORCYCLE", "bike": "MOTORCYCLE", "موٹر_سائیکل": "MOTORCYCLE",
        "boat": "BOAT", "kashti": "BOAT", "کشتی": "BOAT",
        # Expanded Food & Kitchen
        "coffee": "COFFEE", "کافی": "COFFEE",
        "roti": "ROTI", "روٹی": "ROTI",
        "curry": "CURRY", "salan": "CURRY", "سالن": "CURRY",
        "soup": "SOUP", "سوپ": "SOUP",
        "mango": "MANGO", "aam": "MANGO", "آم": "MANGO",
        "orange": "ORANGE", "malta": "ORANGE", "مالٹا": "ORANGE",
        "grape": "GRAPE", "angoor": "GRAPE", "انگور": "GRAPE",
        "potato": "POTATO", "aaloo": "POTATO", "آلو": "POTATO",
        "onion": "ONION", "pyaz": "ONION", "پیاز": "ONION",
        "tomato": "TOMATO", "tamatar": "TOMATO", "ٹماٹر": "TOMATO",
        "beef": "BEEF", "bada_gosht": "BEEF", "بڑا_گوشت": "BEEF",
        "mutton": "MUTTON", "chota_gosht": "MUTTON", "چھوٹا_گوشت": "MUTTON",
        "butter": "BUTTER", "makhan": "BUTTER", "مکھن": "BUTTER",
        "oil": "OIL", "teil": "OIL", "تیل": "OIL",
        "kitchen": "KITCHEN", "bawarchi_khana": "KITCHEN", "باورچی_خانہ": "KITCHEN",
        # Expanded Actions & Verbs
        "talk": "TALK", "baat": "TALK", "بات": "TALK",
        "say": "SAY", "kehna": "SAY", "کہنا": "SAY", "کہو": "SAY",
        "think": "THINK", "sochna": "THINK", "soch": "THINK", "سوچنا": "THINK", "سوچ": "THINK",
        "meet": "MEET", "milna": "MEET", "ملنا": "MEET", "ملیں": "MEET",
        "laugh": "LAUGH", "hansna": "LAUGH", "ہنسنا": "LAUGH", "ہنسیں": "LAUGH",
        "cry": "CRY", "rona": "CRY", "رونا": "CRY", "روئیں": "CRY",
        "remember": "REMEMBER", "yaad": "REMEMBER", "یاد": "REMEMBER",
        "forget": "FORGET", "bhoolna": "FORGET", "بھولنا": "FORGET",
        "stay": "STAY", "thehrna": "STAY", "ٹھہرنا": "STAY",
        "travel": "TRAVEL", "safar": "TRAVEL", "سفر": "TRAVEL",
        "start": "START", "shuru": "START", "شروع": "START",
        "finish": "FINISH", "khatam": "FINISH", "ختم": "FINISH",
        "cut": "CUT", "katna": "CUT", "کاٹنا": "CUT",
        "bring": "BRING", "laana": "BRING", "لانا": "BRING", "لاؤ": "BRING",
        "find": "FIND", "dhoondna": "FIND", "ڈھونڈنا": "FIND",
        "sell": "SELL", "bechna": "SELL", "بیچنا": "SELL",
        # Weather & Seasons
        "summer": "SUMMER", "garmi": "SUMMER", "گرمی": "SUMMER", "موسم_گرما": "SUMMER",
        "winter": "WINTER", "sardi": "WINTER", "سردی": "WINTER", "موسم_سرما": "WINTER",
        "rain": "RAIN", "barish": "RAIN", "بارش": "RAIN",
        "sun": "SUN", "sooraj": "SUN", "سورج": "SUN",
        # Days of the Week
        "sunday": "SUNDAY", "itwar": "SUNDAY", "اتوار": "SUNDAY",
        "monday": "MONDAY", "peer": "MONDAY", "پیر": "MONDAY",
        "tuesday": "TUESDAY", "mangal": "TUESDAY", "منگل": "TUESDAY",
        "wednesday": "WEDNESDAY", "budh": "WEDNESDAY", "بدھ": "WEDNESDAY",
        "thursday": "THURSDAY", "jummarat": "THURSDAY", "جمعرات": "THURSDAY",
        "friday": "FRIDAY", "jummah": "FRIDAY", "جمعہ": "FRIDAY",
        "saturday": "SATURDAY", "hafta": "SATURDAY", "ہفتہ": "SATURDAY",
        # Family & Relationships
        "husband": "HUSBAND", "shohar": "HUSBAND", "شوہر": "HUSBAND",
        "wife": "WIFE", "biwi": "WIFE", "بیوی": "WIFE",
        "parents": "PARENTS", "waldein": "PARENTS", "والدین": "PARENTS",
        "cousin": "COUSIN", "کزن": "COUSIN",
        "worker": "WORKER", "mazdoor": "WORKER", "مزدور": "WORKER",
        "boss": "BOSS", "afsar": "BOSS", "افسر": "BOSS",
        "enemy": "ENEMY", "dushman": "ENEMY", "دشمن": "ENEMY",
        "people": "PEOPLE", "log": "PEOPLE", "لوگ": "PEOPLE",
        # Locations & Positions
        "here": "HERE", "yahan": "HERE", "یہاں": "HERE",
        "there": "THERE", "wahan": "THERE", "وہاں": "THERE",
        "which": "WHICH", "kaunsa": "WHICH", "کونسا": "WHICH",
        "whose": "WHOSE", "kiska": "WHOSE", "کس_کا": "WHOSE",
        # Qualities & States
        "strong": "STRONG", "taqatwar": "STRONG", "طاقتور": "STRONG",
        "weak": "WEAK", "kamzor": "WEAK", "کمزور": "WEAK",
        "heavy": "HEAVY", "bhaari": "HEAVY", "بھاری": "HEAVY",
        "ugly": "UGLY", "badsoorat": "UGLY", "بدصورت": "UGLY",
        "poor": "POOR", "ghareeb": "POOR", "غریب": "POOR",
        "right": "RIGHT", "sahi": "RIGHT", "صحیح": "RIGHT",
        "wrong": "WRONG", "galat": "WRONG", "غلط": "WRONG",
        "ready": "READY", "taiyar": "READY", "تیار": "READY",
        "busy": "BUSY", "masroof": "BUSY", "مصروف": "BUSY",
        "free": "FREE", "faarigh": "FREE", "فارغ": "FREE",
        "early": "EARLY", "jaldi": "EARLY", "جلدی": "EARLY",
        "late": "LATE", "dair": "LATE", "دیر": "LATE",
    }

    # Punctuation to strip before rule matching (Urdu + Latin punctuation).
    _PUNCT_RE = re.compile(r"[\u061f\u060c\u06d4,\.\!\?\:;\-]")

    # Arabic diacritics (harakat) that users mix into typed Urdu text.
    _DIACRITICS_RE = re.compile(r"[\u064b-\u0652\u0670]")

    # Invisible / direction-marking characters that silently break exact
    # rule matching: ZWSP/ZWNJ/ZWJ, LRM/RLM, bidi isolates, BOM, tatweel.
    # Urdu IMEs frequently insert ZWNJ between words, which makes
    # "\u0627\u0644\u0633\u0644\u0627\u0645\u200c\u0639\u0644\u06cc\u06a9\u0645" != "\u0627\u0644\u0633\u0644\u0627\u0645 \u0639\u0644\u06cc\u06a9\u0645" and
    # sends the whole phrase to transliteration fingerspelling.
    _INVISIBLE_RE = re.compile(r"[\u200b-\u200f\u202a-\u202e\u2066-\u2069\ufeff\u0640]")

    # Arabic-script homoglyph folding. Typed Urdu frequently mixes Arabic
    # codepoints (\u064a yeh / \u0643 kaf / \u0629 teh marbuta) with their
    # Urdu equivalents (\u06cc / \u06a9 / \u06c1); exact string matching
    # fails silently unless they are folded to one canonical form.
    _HOMOGLYPHS = str.maketrans({
        "\u064a": "\u06cc",  # Arabic Yeh -> Farsi (Urdu) Yeh
        "\u0649": "\u06cc",  # Alef Maksura -> Farsi Yeh
        "\u0643": "\u06a9",  # Arabic Kaf -> Keheh
        "\u0629": "\u06c1",  # Teh Marbuta -> Goal Teh
    })

    # Minimum seconds between outbound Gemini calls. Keystroke-driven
    # re-translations (frontend debounces typing) would otherwise burn the
    # free-tier quota (5 req/min) within seconds of typing; throttled
    # requests fall through to the offline rules instead.
    GEMINI_MIN_INTERVAL_S = 1.2

    # System instruction for Gemini-based dynamic gloss translation.
    # Keeps output constrained to clean uppercase gloss tokens so it can
    # feed straight into resolve_token() without parsing.
    GEMINI_SYSTEM_INSTRUCTION = (
        "You are an expert Pakistan Sign Language (PSL) translator. "
        "Convert raw input text (which may be Native Urdu script, Roman Urdu "
        "like 'khana'/'shukriya', or English like 'food'/'school') into "
        "canonical uppercase PSL Gloss tokens.\n"
        "Rules:\n"
        "1. Map general concepts to canonical uppercase Gloss tokens "
        "(e.g., 'khana' / 'food' -> 'EAT', 'school' -> 'SCHOOL', "
        "'water' / 'pani' -> 'WATER').\n"
        "2. For proper nouns, specific names, or uncataloged terms "
        "(e.g., 'Amaan', 'LUMS'), return them in uppercase letters so "
        "downstream fingerspelling can process them.\n"
        "3. Output ONLY space-separated uppercase gloss tokens without "
        "punctuation, markdown formatting, quotes, or conversational "
        "explanations.\n"
        "4. Multi-word concepts are ONE token joined by underscores: "
        "THANK_YOU, HOW_ARE_YOU, MY_NAME, PLEASE_HELP — never emit them "
        "as separate space-separated words."
    )

    # Gemini model used for dynamic text -> gloss translation.
    GEMINI_MODEL = "gemini-3.5-flash-lite"

    # Canonical human-readable Urdu and English labels for all available word signs
    GLOSS_LABELS: Dict[str, Dict[str, str]] = {
        "THANK_YOU": {"urdu": "شکریہ", "english": "Thank you"},
        "HELLO": {"urdu": "السلام علیکم / سلام", "english": "Hello"},
        "WELCOME": {"urdu": "خوش آمدید", "english": "Welcome"},
        "EAT": {"urdu": "کھانا", "english": "Eat / Food"},
        "WATER": {"urdu": "پانی", "english": "Water"},
        "HOW_ARE_YOU": {"urdu": "آپ کیسے ہیں", "english": "How are you"},
        "PLEASE_HELP": {"urdu": "براہ کرم مدد کریں", "english": "Please help"},
        "PAKISTAN": {"urdu": "پاکستان", "english": "Pakistan"},
        "GO": {"urdu": "جانا", "english": "Go"},
        "WHERE": {"urdu": "کہاں", "english": "Where"},
        "YOU": {"urdu": "آپ / تم", "english": "You"},
        "HOSPITAL": {"urdu": "ہسپتال", "english": "Hospital"},
        "DOCTOR": {"urdu": "ڈاکٹر", "english": "Doctor"},
        "GOODBYE": {"urdu": "اللہ حافظ", "english": "Goodbye"},
        "YES": {"urdu": "ہاں", "english": "Yes"},
        "NO": {"urdu": "نہیں", "english": "No"},
        "FRIEND": {"urdu": "دوست", "english": "Friend"},
        "SCHOOL": {"urdu": "اسکول", "english": "School"},
        "MY_NAME": {"urdu": "میرا نام", "english": "My name"},
        "MY": {"urdu": "میرا", "english": "My"},
        "NAME": {"urdu": "نام", "english": "Name"},
        "I": {"urdu": "میں", "english": "I"},
        "WANT": {"urdu": "چاہیے", "english": "Want"},
        "WHAT": {"urdu": "کیا", "english": "What"},
        "HOW": {"urdu": "کیسے", "english": "How"},
        "IS": {"urdu": "ہے", "english": "Is"},
        "NEAR": {"urdu": "پاس / قریب", "english": "Near"},
        "OF": {"urdu": "کا / کے", "english": "Of"},
        "HEALTH": {"urdu": "حال / صحت", "english": "Health"},
        "SORRY": {"urdu": "معاف کیجئے", "english": "Sorry"},
        "PLEASE": {"urdu": "براہ کرم", "english": "Please"},
    }

    ROMAN_TO_URDU_LETTER: Dict[str, str] = {
        "A": "الف", "B": "بے", "C": "سی", "D": "ڈال", "E": "ای", "F": "فے",
        "G": "گاف", "H": "ہے", "I": "آئی", "J": "جیم", "K": "کاف", "L": "لام",
        "M": "میم", "N": "نون", "O": "او", "P": "پے", "Q": "قاف", "R": "رے",
        "S": "سین", "T": "ٹے", "U": "یو", "V": "وی", "W": "واؤ", "X": "ایکس",
        "Y": "وائی", "Z": "زے"
    }

    URDU_CHAR_TO_ROMAN: Dict[str, str] = {
        "ا": "A", "آ": "A", "ع": "A", "ء": "A",
        "ب": "B", "پ": "P", "ت": "T", "ٹ": "T", "ث": "S",
        "ج": "J", "چ": "C", "ح": "H", "خ": "K",
        "د": "D", "ڈ": "D", "ذ": "Z", "ر": "R", "ڑ": "R",
        "ز": "Z", "ژ": "Z", "س": "S", "ش": "S", "ص": "S", "ض": "Z",
        "ط": "T", "ظ": "Z", "غ": "G", "ف": "F", "ق": "Q", "ک": "K",
        "گ": "G", "ل": "L", "م": "M", "ن": "N", "ں": "N",
        "و": "W", "ہ": "H", "ھ": "H", "ی": "Y", "ے": "Y"
    }
    URDU_LETTER_MAP: Dict[str, str] = URDU_CHAR_TO_ROMAN

    # Synonym canonicalization applied to Gemini output only.  The frontend
    # keyframe dictionary (psl_glosses.json) keys animations by canonical
    # gloss names, so dynamic synonyms like FOOD must collapse to EAT or they
    # would degrade into letter-by-letter fingerspelling.
    GEMINI_GLOSS_SYNONYMS: Dict[str, str] = {
        "FOOD": "EAT",
        "EAT_FOOD": "EAT",
        "DRINK": "WATER",
        "HI": "HELLO",
        "BYE": "GOODBYE",
    }

    # Phrase-level canonicalization applied AFTER token joining.  Gemini
    # frequently answers "آپ کیسے ہیں" with reordered glosses like
    # "YOU HOW" that no token-level synonym map can repair; these map the
    # whole gloss string onto the single keyframe-dictionary entry.
    GEMINI_GLOSS_PHRASE_SYNONYMS: Dict[str, str] = {
        "YOU HOW": "HOW_ARE_YOU",
        "HOW YOU": "HOW_ARE_YOU",
    }

    def __init__(self, registry_path: str = "ml/data/animation_registry.json"):
        """Load the animation registry that maps words and letters to .glb assets."""
        self.registry_path = registry_path
        try:
            with open(registry_path, "r", encoding="utf-8") as f:
                self.registry: Dict = json.load(f)
        except FileNotFoundError:
            print(f"[PSLAnimationPipeline] Registry not found at {registry_path}, using empty fallback.")
            self.registry = {}

        # ── Offline vocabulary alignment with the frontend ──
        # frontend/public/data/psl_glosses.json is the single source of truth
        # for animatable glosses: any token NOT in it (or the registry /
        # known-token set) degrades to letter-by-letter fingerspelling in the
        # avatar.  Loading it here lets the backend validate and canonicalize
        # Gemini output (e.g. join "THANK YOU" -> "THANK_YOU") against the
        # animations that actually exist.
        self.animatable_glosses: set = set(self.KNOWN_GLOSS_TOKENS)
        for word in self.registry.get("words", {}):
            self.animatable_glosses.add(word.upper())
        gloss_json = _PROJECT_ROOT / "frontend" / "public" / "data" / "psl_glosses.json"
        try:
            with open(gloss_json, "r", encoding="utf-8") as f:
                self.animatable_glosses.update(json.load(f).keys())
            print(
                f"[PSLAnimationPipeline] Animatable gloss vocabulary: "
                f"{len(self.animatable_glosses)} entries (frontend keyframe dictionary aligned)."
            )
        except (OSError, json.JSONDecodeError) as e:
            print(
                f"[PSLAnimationPipeline] Could not load frontend keyframe dictionary ({e}) "
                "— Gemini gloss validation limited to built-in tokens."
            )

        # Homoglyph-folded rule index for resilient offline matching.
        self._folded_rules: Dict[str, str] = {
            self._fold_text(k): v for k, v in self.URDU_TO_GLOSS_RULES.items()
        }

        # ── Sign Image Registry for 2-Second Video-like Playback ──
        self.image_registry: Dict[str, str] = {}
        img_reg_json = _PROJECT_ROOT / "frontend" / "public" / "data" / "gloss_video_registry.json"
        try:
            with open(img_reg_json, "r", encoding="utf-8") as f:
                self.image_registry = json.load(f)
            print(f"[PSLAnimationPipeline] Loaded sign image registry: {len(self.image_registry)} items")
        except Exception as e:
            print(f"[PSLAnimationPipeline] Could not load image sign registry ({e})")

        # In-memory gloss cache: temperature 0.0 keeps results deterministic,
        # and caching shields the free-tier rate limit from repeated identical inputs.
        self._gloss_cache: Dict[str, str] = {}
        self._structured_cache: Dict[str, Any] = {}
        # Timestamp of the last outbound Gemini call (throttle guard).
        self._last_gemini_call = 0.0
        self._gemini_client = None
        api_key = os.getenv("GEMINI_API_KEY")
        if api_key and _GEMINI_SDK_AVAILABLE:
            try:
                self._gemini_client = genai.Client(api_key=api_key)
                print(
                    f"[PSLAnimationPipeline] Gemini gloss translation enabled "
                    f"({self.GEMINI_MODEL})."
                )
            except Exception as e:
                print(
                    f"[PSLAnimationPipeline] Gemini client init failed ({e}) "
                    "— rule-based fallback only."
                )
        elif not api_key:
            print("[PSLAnimationPipeline] GEMINI_API_KEY not set — rule-based gloss matching only.")
        else:
            print("[PSLAnimationPipeline] google-genai SDK not installed — rule-based gloss matching only.")

    # ------------------------------------------------------------------
    # Text normalisation
    # ------------------------------------------------------------------
    @staticmethod
    def _fold_text(text: str) -> str:
        """Fold text for resilient matching: strip punctuation, diacritics
        and invisible characters, homoglyph-fold Arabic->Urdu codepoints,
        then collapse whitespace.  Does NOT lowercase or apply Roman aliases
        (callers with Latin input should fold the lowercase form)."""
        t = PSLAnimationPipeline._PUNCT_RE.sub("", text)
        t = PSLAnimationPipeline._DIACRITICS_RE.sub("", t)
        # Replace invisible chars with SPACE (not empty) so ZWNJ between
        # words doesn't merge them: السلام‌علیکم → السلام علیکم, not السلامعلیکم.
        t = PSLAnimationPipeline._INVISIBLE_RE.sub(" ", t)
        t = t.translate(PSLAnimationPipeline._HOMOGLYPHS)
        return " ".join(t.split()).strip()

    def normalize_text(self, text: str) -> str:
        """Clean and normalise raw input before gloss matching.

        1. Strip punctuation, Arabic diacritics and invisible characters
           (ZWNJ/ZWJ/bidi marks), then collapse whitespace.
        2. Fold Arabic-script homoglyphs to their Urdu equivalents so typed
           text matches dictionary keys regardless of keyboard layout.
        3. For Latin-script (Roman Urdu) text: lowercase and replace
           common spelling variations with canonical forms
           (e.g. *hal* → *haal*, *ha* → *hai*, *kia* → *kya*).
        """
        cleaned = self._PUNCT_RE.sub("", text)
        cleaned = self._DIACRITICS_RE.sub("", cleaned)
        cleaned = self._INVISIBLE_RE.sub(" ", cleaned)
        cleaned = cleaned.translate(self._HOMOGLYPHS)
        cleaned = re.sub(r"\s+", " ", cleaned).strip()

        if not cleaned:
            return ""

        # Apply Roman-Urdu alias normalisation only to Latin-script input
        if cleaned[0].isascii():
            words = cleaned.lower().split()
            words = [self.ROMAN_URDU_ALIASES.get(w, w) for w in words]
            return " ".join(words)

        return cleaned

    # ------------------------------------------------------------------
    # Gemini dynamic translation (primary path when configured)
    # ------------------------------------------------------------------
    def translate_text_to_gloss_gemini(self, user_input: str) -> str:
        """Translate raw user text into PSL gloss tokens using gemini-2.5-flash.

        Handles Native Urdu, Roman Urdu and English input deterministically
        (temperature 0.0).  Raises on network / API / quota failures so the
        caller can fall back to rule-based matching.
        """
        response = self._gemini_client.models.generate_content(
            model=self.GEMINI_MODEL,
            contents=user_input,
            config=types.GenerateContentConfig(
                temperature=0.0,
                system_instruction=self.GEMINI_SYSTEM_INSTRUCTION,
                # Pure mapping task — no reasoning needed.  Disabling the
                # thinking budget keeps responses fast (~1-2s) so the
                # interactive translate button stays snappy.
                thinking_config=types.ThinkingConfig(thinking_budget=0),
            ),
        )
        return (response.text or "").strip()

    @staticmethod
    def _sanitize_gemini_gloss(raw: str) -> str:
        """Normalize model output to clean space-separated uppercase tokens.

        Defensively strips accidental markdown fences, quotes and stray
        punctuation so only [A-Z0-9_] gloss vocabulary remains for
        resolve_token().
        """
        gloss = raw.strip()
        # Remove markdown code fences / emphasis markers if present
        gloss = re.sub(r"```[a-zA-Z]*", "", gloss)
        gloss = re.sub(r"[*`\"']", "", gloss)
        # Keep only gloss-legal characters, then collapse whitespace
        gloss = re.sub(r"[^A-Za-z0-9_\s]", "", gloss.upper())
        return re.sub(r"\s+", " ", gloss).strip()

    # ------------------------------------------------------------------
    # Urdu text -> PSL Gloss
    # ------------------------------------------------------------------
    def _join_animatable_tokens(self, tokens: List[str]) -> List[str]:
        """Greedily merge consecutive tokens whose underscore form matches
        an animatable gloss (e.g. ``THANK + YOU -> THANK_YOU``).

        The frontend keyframe dictionary keys multi-word signs with
        underscores while Gemini emits them space-separated; without this
        join "MY NAME" stays two dead tokens and the avatar just idles.
        The longest window (3 tokens) is tried before 2 so that
        HOW + ARE + YOU resolves to the single HOW_ARE_YOU sign.
        """
        joined: List[str] = []
        i = 0
        n = len(tokens)
        while i < n:
            chosen: Optional[str] = None
            for window in (3, 2):  # longest match first
                if i + window <= n:
                    merged = "_".join(tokens[i:i + window])
                    if merged in self.animatable_glosses:
                        chosen = merged
                        i += window
                        break
            if chosen is None:
                chosen = tokens[i]
                i += 1
            joined.append(chosen)
        return joined

    def translate_to_gloss(self, urdu_text: str) -> str:
        """Convert raw text (Urdu script, Roman Urdu or English) to a PSL Gloss string.

        Matching priority:
        1. Exact offline rule match (Urdu script or normalised Roman
           Urdu) — deterministic, instant, no network dependency.
        2. Fuzzy partial rule match — if ≥ 50 % of a rule's words appear
           in the normalised input, use that rule's gloss.
        3. Gemini dynamic translation for vocabulary no rule covers —
           cached, throttled, then canonicalised (synonym folding +
           multi-word joining) against the animatable gloss vocabulary.
        4. Word-level match — replace known words via ``WORD_GLOSS_MAP``
           and transliterate / uppercase the rest.
        5. Full uppercase fallback (feeds fingerspelling downstream).

        Offline rules deliberately run FIRST: a phrase with a known rule
        must never depend on a network call whose answers vary between
        runs (observed live: the same "شکریہ" returned THANK_YOU, then
        the dead-token variant "THANK YOU", then six fingerspelled
        letters on three consecutive requests).
        """
        cleaned = self.normalize_text(urdu_text)
        if not cleaned:
            return ""

        # --- 1. Offline rules first (deterministic, instant) --------
        rule_hit = (
            self.URDU_TO_GLOSS_RULES.get(cleaned)
            or self._folded_rules.get(cleaned)
        )
        if rule_hit:
            return rule_hit

        # --- 2. Fuzzy partial-phrase match --------------------------
        input_words = set(cleaned.split())
        best_gloss: Optional[str] = None
        best_overlap = 0
        for rule_key, gloss in self.URDU_TO_GLOSS_RULES.items():
            rule_words = set(rule_key.split())
            overlap = len(input_words & rule_words)
            if (
                overlap > best_overlap
                and overlap >= max(1, len(rule_words) * 0.75)
                and len(input_words) > 0
                and (overlap / len(input_words)) >= 0.75
            ):
                best_overlap = overlap
                best_gloss = gloss
        if best_gloss is not None:
            return best_gloss

        # --- 3. Gemini dynamic translation (unknown vocabulary only) -
        if self._gemini_client is not None:
            cached = self._gloss_cache.get(urdu_text)
            if cached is not None:
                return cached

            now = time.time()
            if now - self._last_gemini_call < self.GEMINI_MIN_INTERVAL_S:
                print(
                    "[PSLAnimationPipeline] Gemini call throttled "
                    f"(< {self.GEMINI_MIN_INTERVAL_S}s since last request) "
                    "— using offline word matching."
                )
            else:
                self._last_gemini_call = now
                try:
                    raw_gloss = self.translate_text_to_gloss_gemini(urdu_text)
                    gloss = self._sanitize_gemini_gloss(raw_gloss)
                    if gloss:
                        # Canonicalize dynamic synonyms to keyframe-
                        # dictionary glosses (e.g. FOOD -> EAT), then join
                        # space-separated multi-word answers into the
                        # underscore forms the avatar actually animates
                        # (THANK YOU -> THANK_YOU, MY NAME -> MY_NAME).
                        tokens = [
                            self.GEMINI_GLOSS_SYNONYMS.get(tok, tok)
                            for tok in gloss.split()
                        ]
                        tokens = self._join_animatable_tokens(tokens)
                        gloss = " ".join(tokens)
                        gloss = self.GEMINI_GLOSS_PHRASE_SYNONYMS.get(gloss, gloss)
                        if len(self._gloss_cache) >= 256:
                            self._gloss_cache.clear()
                        self._gloss_cache[urdu_text] = gloss
                        return gloss
                    print(
                        "[PSLAnimationPipeline] Gemini returned an empty gloss "
                        "— falling back to rule-based matching."
                    )
                except Exception as e:
                    print(
                        f"[PSLAnimationPipeline] Gemini translation failed "
                        f"({str(e)[:200]}) — falling back to rule-based matching."
                    )

        # --- 4. Word-level gloss substitution -------------------------
        # --- 4. Word-level gloss substitution -------------------------
        result_tokens: List[str] = []
        OMIT_PARTICLES = {"اور", "aur", "and", "کا", "کی", "کے", "ko", "کو", "mein", "میں", "se", "سے", "hai", "hain", "ہو", "ہوں", "ہے", "ہیں"}
        for word in cleaned.split():
            if word in OMIT_PARTICLES:
                continue
            if word in self.WORD_GLOSS_MAP:
                result_tokens.append(self.WORD_GLOSS_MAP[word])
            elif not word.isascii():
                # Non-ASCII word (Urdu script) — transliterate each
                # character to its Roman equivalent so downstream tokens
                # are clean ASCII (e.g. ک → LETTER_K).
                for ch in word:
                    roman = self.URDU_LETTER_MAP.get(ch)
                    if roman:
                        result_tokens.append(f"LETTER_{roman}")
            else:
                result_tokens.append(word.upper())

        if result_tokens:
            return " ".join(result_tokens)

        # --- 5. Uppercase fallback ----------------------------------
        return cleaned.upper()

    # Set of gloss tokens that should ALWAYS be emitted as a single
    # WORD_SIGN item, even when no .glb asset exists in the registry.
    # This prevents known concepts from being split into per-character
    # fingerspelling by ``resolve_token()``.
    KNOWN_GLOSS_TOKENS: set = {
        # Frontend PSL_POSE_DICTIONARY canonical keys
        "EAT", "WATER", "THANK_YOU", "HOW_ARE_YOU", "PLEASE_HELP",
        "PAKISTAN", "GO", "WHERE", "YOU", "HOSPITAL",
        # Word signs present in the frontend keyframe dictionary
        # (psl_glosses.json) — must stay whole, never fingerspelled.
        "HELLO", "WELCOME", "GOODBYE", "YES", "NO",
        "FRIEND", "SCHOOL", "MY_NAME", "DOCTOR",
        # Common aliases (Roman-Urdu / native variants)
        "KHANA", "PANI", "SHUKRIYA", "KAHAN", "JANA", "JA",
        "AAP", "AP", "SALAM",
        # Tokens already in animation registry
        "DOCTOR", "WANT", "MEDICINE", "HELP",
        # Tokens from WORD_GLOSS_MAP
        "HEALTH", "WHAT", "IS", "NEAR", "OF", "I", "MY",
        "NAME", "HOW",
    }

    # Urdu-to-Roman transliteration map used inside translate_to_gloss()
    # when an unknown Urdu word must be emitted character-by-character.
    # Each Urdu character is mapped to its ASCII Roman equivalent so the
    # resulting gloss tokens (e.g. LETTER_K) are safe for asset pathing.
    URDU_LETTER_MAP: Dict[str, str] = {
        '\u0627': 'A', '\u0622': 'A', '\u0628': 'B', '\u067e': 'P',
        '\u062a': 'T', '\u0679': 'T', '\u062b': 'S', '\u062c': 'J',
        '\u0686': 'CH', '\u062d': 'H', '\u062e': 'KH', '\u062f': 'D',
        '\u0688': 'D', '\u0630': 'Z', '\u0631': 'R', '\u0691': 'R',
        '\u0632': 'Z', '\u0698': 'ZH', '\u0633': 'S', '\u0634': 'SH',
        '\u0635': 'S', '\u0636': 'Z', '\u0637': 'T', '\u0638': 'Z',
        '\u0639': 'A', '\u063a': 'GH', '\u0641': 'F', '\u0642': 'Q',
        '\u06a9': 'K', '\u06af': 'G', '\u0644': 'L', '\u0645': 'M',
        '\u0646': 'N', '\u06ba': 'N', '\u0648': 'W', '\u06c1': 'H',
        '\u06be': 'H', '\u0621': 'A', '\u06cc': 'Y', '\u06d2': 'E',
    }
    
    # Urdu-to-Roman character mapping for fallback fingerspelling.
    # When a word cannot be resolved as a gloss token, each Urdu character
    # is mapped to its Roman equivalent (e.g., '\u0628' -> 'B') so the frontend
    # receives standard LETTER_B tokens instead of raw Unicode.
    URDU_CHAR_TO_ROMAN: Dict[str, str] = {
        '\u0622': 'A', '\u0627': 'A', '\u0628': 'B', '\u067e': 'P',
        '\u062a': 'T', '\u0679': 'T', '\u062b': 'S', '\u062c': 'J',
        '\u0686': 'CH', '\u062d': 'H', '\u062e': 'KH', '\u062f': 'D',
        '\u0688': 'D', '\u0630': 'Z', '\u0631': 'R', '\u0691': 'R',
        '\u0632': 'Z', '\u0698': 'ZH', '\u0633': 'S', '\u0634': 'SH',
        '\u0635': 'S', '\u0636': 'Z', '\u0637': 'T', '\u0638': 'Z',
        '\u0639': 'A', '\u063a': 'GH', '\u0641': 'F', '\u0642': 'Q',
        '\u06a9': 'K', '\u06af': 'G', '\u0644': 'L', '\u0645': 'M',
        '\u0646': 'N', '\u06ba': 'N', '\u0648': 'W', '\u06c1': 'H',
        '\u06be': 'H', '\u0621': 'A', '\u06cc': 'Y', '\u06d2': 'E',
    }

    ROMAN_TO_URDU_LETTER: Dict[str, str] = {
        'A': 'الف', 'B': 'بے', 'C': 'سی', 'D': 'دال', 'E': 'ای',
        'F': 'فے', 'G': 'گاف', 'H': 'ہے', 'I': 'آئی', 'J': 'جیم',
        'K': 'کاف', 'L': 'لام', 'M': 'میم', 'N': 'نون', 'O': 'او',
        'P': 'پے', 'Q': 'قاف', 'R': 'رے', 'S': 'سین', 'T': 'تے',
        'U': 'یو', 'V': 'وی', 'W': 'ڈبلیو', 'X': 'ایکس', 'Y': 'وائی',
        'Z': 'زے'
    }

    # ------------------------------------------------------------------
    # Token -> animation asset resolution
    # ------------------------------------------------------------------
    def resolve_token(self, token: str) -> List[Dict]:
        """Resolve a single gloss token into animation asset(s).

        Resolution order:
        1. If the token exists in ``registry["words"]`` return it as a
           WORD_SIGN entry (has a real .glb asset).
        2. If the token is in the animatable gloss vocabulary (known
           tokens ∪ registry words ∪ frontend keyframe dictionary keys)
           emit a single WORD_SIGN — the frontend renders it through its
           keyframe pose dictionary.
        3. Otherwise break the token into individual characters and
           resolve each as a FINGERSPELLING entry from
           ``registry["alphabet"]``.
        """
        words = self.registry.get("words", {})
        alphabet = self.registry.get("alphabet", {})

        # --- 0. Pre-formed LETTER_X token (from transliteration) ---
        if token.startswith("LETTER_") and len(token) > 7:
            letter_part = token[7:]  # e.g. "K", "CH"
            if letter_part in alphabet:
                entry = alphabet[letter_part]
                return [{"token": token, "type": entry["type"], "asset": entry["asset"]}]
            return [{
                "token": token,
                "type": "FINGERSPELLING",
                "asset": f"letter_{letter_part.lower()}.glb",
            }]

        # --- 1. Registry word-level match (real .glb exists) ---
        if token in words:
            entry = words[token]
            return [{"token": token, "type": entry["type"], "asset": entry["asset"]}]

        # --- 2. Animatable gloss — single WORD_SIGN (keyframe pose) --
        if token.upper() in self.animatable_glosses:
            return [{
                "token": token.upper(),
                "type": "WORD_SIGN",
                "asset": f"{token.lower()}.glb",
            }]

        # --- 3. Fallback: fingerspell each character ---
        queue: List[Dict] = []
        for char in token:
            # Map Urdu characters to Roman equivalents
            roman = self.URDU_CHAR_TO_ROMAN.get(char, char.upper())

            if roman in alphabet:
                entry = alphabet[roman]
                queue.append({"token": f"LETTER_{roman}", "type": entry["type"], "asset": entry["asset"]})
            else:
                # Emit LETTER_X token for frontend procedural rendering
                queue.append({
                    "token": f"LETTER_{roman}",
                    "type": "FINGERSPELLING",
                    "asset": f"letter_{roman.lower()}.glb",
                })
        return queue

    # ------------------------------------------------------------------
    # Master translation & sequence generation
    # ------------------------------------------------------------------
    def canonicalize_psl_words(self, raw_words: List[str]) -> List[str]:
        """Canonicalize PSL grammar sequence:
        1. Greedily merges compound sign concepts (e.g. MY + NAME -> MY_NAME, HOW + ARE + YOU -> HOW_ARE_YOU).
        2. Eliminates redundant pronouns / overlaps when compound phrase signs are present
           (e.g. removes redundant YOU/HOW before/after HOW_ARE_YOU, removes redundant I/IS with MY_NAME).
        3. Collapses consecutive duplicate words, while preserving repeated fingerspelling letters in names.
        """
        if not raw_words:
            return []

        tokens: List[str] = []
        for w in raw_words:
            tok = str(w).upper().replace(" ", "_").strip()
            tok = re.sub(r'[^A-Z0-9_]', '', tok)
            if tok:
                tokens.append(tok)

        # Multi-word combinations known to exist as single video signs
        multiword_map = {
            ("HOW", "ARE", "YOU"): "HOW_ARE_YOU",
            ("HOW", "YOU"): "HOW_ARE_YOU",
            ("YOU", "HOW"): "HOW_ARE_YOU",
            ("THANK", "YOU"): "THANK_YOU",
            ("PLEASE", "HELP"): "PLEASE_HELP",
            ("PLEASE", "HELP", "ME"): "PLEASE_HELP",
            ("MY", "NAME"): "MY_NAME",
            ("MY", "NAME", "IS"): "MY_NAME",
            ("GOOD", "MORNING"): "GOOD_MORNING",
            ("GOOD", "NIGHT"): "GOOD_NIGHT",
            ("GREEN", "TEA"): "GREEN_TEA",
            ("MINERAL", "WATER"): "WATER",
            ("EAT", "FOOD"): "EAT",
            ("HELLO", "FRIEND"): "HELLO",
        }

        i = 0
        merged: List[str] = []
        while i < len(tokens):
            matched = False
            for window in (3, 2):
                if i + window <= len(tokens):
                    key = tuple(tokens[i:i + window])
                    if key in multiword_map:
                        merged.append(multiword_map[key])
                        i += window
                        matched = True
                        break
            if not matched:
                merged.append(tokens[i])
                i += 1

        # Redundancy & Gesture Overlap Elimination
        has_how_are_you = "HOW_ARE_YOU" in merged
        has_my_name = "MY_NAME" in merged
        has_please_help = "PLEASE_HELP" in merged
        has_thank_you = "THANK_YOU" in merged

        final_tokens: List[str] = []
        for tok in merged:
            # When HOW_ARE_YOU is signed, it incorporates the question and 2nd-person referent
            if has_how_are_you and tok in ("YOU", "HOW", "AAP", "TUM", "ARE"):
                continue
            # When MY_NAME is signed, 1st-person pronoun I / ME / MY / NAME is already included.
            # But NEVER remove 'I' if it is a single-letter fingerspelling in a name!
            if has_my_name and tok in ("ME", "MY", "NAME", "HAI", "HAIN"):
                continue
            # When PLEASE_HELP is signed, separate PLEASE or HELP is redundant
            if has_please_help and tok in ("PLEASE", "HELP", "MADAD"):
                continue
            # When THANK_YOU is alone with YOU, don't sign YOU again
            if has_thank_you and len(merged) <= 3 and tok in ("YOU", "THANK", "SHUKRIYA"):
                continue
            # Remove copula / helper tokens ONLY if length > 1 so single-letter fingerspelling like 'A' or 'I' is NEVER deleted!
            if len(tok) > 1 and tok in ("IS", "ARE", "AM", "HAI", "HAIN", "HOON", "THE"):
                continue
            final_tokens.append(tok)

        # Collapse adjacent identical words (exclude single letter fingerspelling in names like AMAAN or AHMAD)
        deduped: List[str] = []
        for tok in final_tokens:
            if deduped and deduped[-1] == tok and len(tok) > 1 and not tok.startswith("LETTER_"):
                continue
            deduped.append(tok)

        return deduped

    def translate_and_sequence(self, text: str, lang: str = "ur") -> Tuple[str, List[str]]:
        """Dual pipeline translating English/Urdu text to:
        1. Natural Urdu translation.
        2. Ordered PSL grammar words/tokens (SOV, question words at end, omitted copula).
        """
        cleaned = text.strip()
        urdu_translation = cleaned
        psl_words: List[str] = []

        if self._gemini_client is not None:
            cache_key = f"{lang}:{cleaned.lower()}"
            if cache_key in self._structured_cache:
                return self._structured_cache[cache_key]

            available_glosses_str = ", ".join(k for k in self.image_registry.keys() if not k.startswith("LETTER_"))

            prompt = (
                f"You are an expert Pakistani Sign Language (PSL) translator.\n"
                f"Input ({'English' if lang == 'en' else 'Urdu'}): \"{cleaned}\"\n\n"
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
            try:
                res = self._gemini_client.models.generate_content(
                    model=self.GEMINI_MODEL,
                    contents=prompt,
                    config=types.GenerateContentConfig(
                        response_mime_type="application/json",
                        temperature=0.1
                    )
                )
                if res.text:
                    parsed = json.loads(res.text)
                    u_trans = parsed.get("urdu_translation", cleaned).strip()
                    words = parsed.get("psl_words", [])
                    if words and isinstance(words, list):
                        clean_words = self.canonicalize_psl_words(words)
                        if clean_words:
                            self._structured_cache[cache_key] = (u_trans, clean_words)
                            return u_trans, clean_words
            except Exception as e:
                print(f"[PSLAnimationPipeline] Gemini translation error ({e}), using offline fallback.")

        # Offline fallback for common phrases
        if lang == "en":
            lower = cleaned.lower()
            rule_map = {
                "where is the hospital": ("ہسپتال کہاں ہے؟", ["HOSPITAL", "WHERE"]),
                "where is hospital": ("ہسپتال کہاں ہے؟", ["HOSPITAL", "WHERE"]),
                "how are you": ("آپ کیسے ہیں؟", ["HOW_ARE_YOU"]),
                "thank you": ("شکریہ", ["THANK_YOU"]),
                "hello": ("السلام علیکم", ["HELLO"]),
                "welcome": ("خوش آمدید", ["WELCOME"]),
                "i want water": ("مجھے پانی چاہیے", ["I", "WATER", "WANT"]),
                "water": ("پانی", ["WATER"]),
                "doctor": ("ڈاکٹر", ["DOCTOR"]),
                "hospital": ("ہسپتال", ["HOSPITAL"]),
                "pakistan": ("پاکستان", ["PAKISTAN"]),
                "please help": ("براہ کرم مدد کریں", ["PLEASE_HELP"]),
                "help": ("مدد", ["PLEASE_HELP"]),
                "goodbye": ("اللہ حافظ", ["GOODBYE"]),
                "yes": ("ہاں", ["YES"]),
                "no": ("نہیں", ["NO"]),
                "my name is": ("میرا نام ہے", ["MY_NAME"]),
            }
            for k, (u, w) in rule_map.items():
                if k in lower:
                    return u, self.canonicalize_psl_words(w)

            # Fallback for generic English words
            words = re.findall(r'[a-zA-Z]+', cleaned.upper())
            return cleaned, self.canonicalize_psl_words(words if words else [cleaned.upper()])
        else:
            # Native Urdu offline translation using rule match
            gloss_str = self.translate_to_gloss(cleaned)
            tokens = gloss_str.split()
            return cleaned, self.canonicalize_psl_words(tokens)

    def process(self, text: str, source_lang: str = "auto") -> Dict:
        """Full pipeline: English/Urdu text -> Urdu translation + PSL grammar -> 2-second sequential image sign queue.

        Returns a dictionary ready for JSON serialization:
        ``{"input_text", "source_lang", "urdu_translation", "psl_gloss", "total_sequence_length", "animation_queue"}``
        """
        cleaned = (text or "").strip()
        if not cleaned:
            return {
                "input_text": "",
                "source_lang": source_lang,
                "urdu_translation": "",
                "psl_gloss": "",
                "total_sequence_length": 0,
                "animation_queue": [],
            }

        # Auto-detect language if 'auto'
        detected_lang = source_lang
        if detected_lang == "auto":
            if re.search(r'[\u0600-\u06FF]', cleaned):
                detected_lang = "ur"
            else:
                detected_lang = "en"

        urdu_translation, psl_words = self.translate_and_sequence(cleaned, detected_lang)

        queue: List[Dict] = []
        for word in psl_words:
            tok = word.upper().replace(" ", "_").strip()
            if not tok:
                continue

            # Check if this token is a single letter or explicit LETTER_X
            is_letter = tok.startswith("LETTER_") or (len(tok) == 1 and tok.isalpha())
            if is_letter:
                char = tok.replace("LETTER_", "")
                letter_tok = f"LETTER_{char}"
                urdu_letter = self.ROMAN_TO_URDU_LETTER.get(char, char)
                video_asset = self.image_registry.get(letter_tok, f"/videos/glosses/{letter_tok}.mp4")
                image_asset = video_asset.replace(".mp4", ".png")
                queue.append({
                    "token": letter_tok,
                    "type": "LETTER",
                    "urdu": urdu_letter,
                    "english": char,
                    "video_url": video_asset,
                    "image_url": image_asset,
                    "asset": video_asset,
                    "duration_ms": 2000
                })
            elif tok in self.image_registry:
                label_info = self.GLOSS_LABELS.get(tok, {})
                video_asset = self.image_registry[tok]
                image_asset = video_asset.replace(".mp4", ".png")
                queue.append({
                    "token": tok,
                    "type": "WORD",
                    "urdu": label_info.get("urdu", tok),
                    "english": label_info.get("english", tok.replace("_", " ").title()),
                    "video_url": video_asset,
                    "image_url": image_asset,
                    "asset": video_asset,
                    "duration_ms": 2000
                })
            else:
                # Word is not in our data: break into individual letters (fingerspelling)
                clean_chars = re.findall(r'[A-Z0-9]', tok)
                if not clean_chars and not tok.isascii():
                    # Urdu characters fallback
                    for ch in tok:
                        roman_letter = self.URDU_CHAR_TO_ROMAN.get(ch, "A")
                        letter_tok = f"LETTER_{roman_letter}"
                        urdu_letter = self.ROMAN_TO_URDU_LETTER.get(roman_letter, ch)
                        video_asset = self.image_registry.get(letter_tok, f"/videos/glosses/{letter_tok}.mp4")
                        image_asset = video_asset.replace(".mp4", ".png")
                        queue.append({
                            "token": letter_tok,
                            "type": "LETTER",
                            "urdu": urdu_letter,
                            "english": roman_letter,
                            "video_url": video_asset,
                            "image_url": image_asset,
                            "asset": video_asset,
                            "duration_ms": 2000
                        })
                else:
                    for char in clean_chars:
                        letter_tok = f"LETTER_{char}"
                        urdu_letter = self.ROMAN_TO_URDU_LETTER.get(char, char)
                        video_asset = self.image_registry.get(letter_tok, f"/videos/glosses/{letter_tok}.mp4")
                        image_asset = video_asset.replace(".mp4", ".png")
                        queue.append({
                            "token": letter_tok,
                            "type": "LETTER",
                            "urdu": urdu_letter,
                            "english": char,
                            "video_url": video_asset,
                            "image_url": image_asset,
                            "asset": video_asset,
                            "duration_ms": 2000
                        })

        gloss_sequence_str = " ".join(item["token"] for item in queue)

        return {
            "input_text": text,
            "source_lang": detected_lang,
            "urdu_translation": urdu_translation,
            "psl_gloss": gloss_sequence_str,
            "total_sequence_length": len(queue),
            "animation_queue": queue,
        }


class UrduTokenizer:
    """Urdu character and subword tokenizer for urdutopsl."""
    def __init__(self, vocab: Optional[Dict[str, int]] = None):
        self.vocab = vocab or self._build_default_vocab()
        self.inv_vocab = {v: k for k, v in self.vocab.items()}

    def _build_default_vocab(self) -> Dict[str, int]:
        special_tokens = ["<PAD>", "<UNK>", "<SOS>", "<EOS>"]
        urdu_chars = [
            "ا", "آ", "ب", "پ", "ت", "ٹ", "ث", "ج", "چ", "ح", "خ", "د", "ڈ", "ذ", 
            "ر", "ڑ", "ز", "ژ", "س", "ش", "ص", "ض", "ط", "ظ", "ع", "غ", "ف", "ق", 
            "ک", "گ", "ل", "م", "ن", "ں", "و", "ہ", "ھ", "ء", "ی", "ے", " "
        ]
        return {tok: i for i, tok in enumerate(special_tokens + urdu_chars)}

    def encode(self, text: str) -> List[int]:
        tokens = [self.vocab.get("<SOS>", 2)]
        for char in text:
            tokens.append(self.vocab.get(char, self.vocab.get("<UNK>", 1)))
        tokens.append(self.vocab.get("<EOS>", 3))
        return tokens

    def decode(self, token_ids: List[int]) -> str:
        chars = []
        for tid in token_ids:
            if tid in self.inv_vocab and self.inv_vocab[tid] not in ["<PAD>", "<SOS>", "<EOS>", "<UNK>"]:
                chars.append(self.inv_vocab[tid])
        return "".join(chars)


# PSL Output Gloss Classes (60 Dynamic Words + 36 Alphabets)
PSL_GLOSS_CLASSES = [
    "HELLO", "SALAM", "THANK_YOU", "HOW_ARE_YOU", "WELCOME", "GOODBYE",
    "HELP", "HOSPITAL", "DOCTOR", "WATER", "FOOD_EAT", "YES", "NO",
    "FRIEND", "SCHOOL", "MY_NAME", "PAKISTAN", "FAMILY", "TEACHER",
    "ALIF", "BAY", "PAY", "TAY", "TAY_HARD", "SAY", "JEEM", "CHAY",
    "HAY", "KHAY", "DAAL", "DAAL_HARD", "ZAAL", "RAY", "RAY_HARD",
    "ZAY", "ZHAY", "SEEN", "SHEEN", "SAAD", "ZAAD", "TOY", "ZOY",
    "AIN", "GHAIN", "FAY", "QAAF", "KAAF", "GAAF", "LAAM", "MEEM",
    "NOON", "NOON_GHUNNA", "WAO", "HAY_GOAL", "HAMZA", "CHOTI_YE", "BADI_YE"
]

def save_model_config(output_dir: str = "./export"):
    """Exports model labels and metadata for runtime deployment."""
    os.makedirs(output_dir, exist_ok=True)
    config = {
        "model_name": "urdutopsl",
        "model_version": "1.0.0",
        "dataset": "DynamicWordLevelPakistanSignLanguage + UAlpha40",
        "num_classes": len(PSL_GLOSS_CLASSES),
        "gloss_classes": PSL_GLOSS_CLASSES,
        "input_modality": "text/audio",
        "output_modality": "psl_gloss_tokens_and_avatar_poses",
        "max_seq_len": 64,
        "embedding_dim": 128,
        "hidden_dim": 256
    }
    config_path = os.path.join(output_dir, "urdutopsl_config.json")
    with open(config_path, "w", encoding="utf-8") as f:
        json.dump(config, f, indent=2, ensure_ascii=False)
    print(f"[urdutopsl] Saved config to {config_path}")

if __name__ == "__main__":
    save_model_config()

    # --- PSLAnimationPipeline smoke test ---
    pipeline = PSLAnimationPipeline(registry_path="ml/data/animation_registry.json")
    test_input = "Mujhe doctor ke paas jana hai"
    result = pipeline.process(test_input)
    print("\n[PSLAnimationPipeline] Test payload:")
    print(json.dumps(result, indent=2, ensure_ascii=False))
