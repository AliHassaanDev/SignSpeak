import requests
import sys

sys.stdout.reconfigure(encoding='utf-8')

test_queries = [
    "براہ کرم مدد کریں",            # Help
    "مجھے سر درد اور بخار ہے",      # Headache, fever
    "ڈاکٹر اور ہسپتال کہاں ہے",     # Doctor, hospital, where
    "کل صبح چائے اور روٹی کھاؤ",    # Tomorrow, morning, tea, roti, eat
    "گاڑی اور بس",                  # Car, bus
    "میرے والد اور والدہ",          # Father, mother
    "آج بارش اور سردی ہے",          # Today, rain, winter/cold
    "کالج اور یونیورسٹی",           # College, university
    "پانی اور جوس",                 # Water, juice
    "پولیس اور ایمرجنسی"            # Police, emergency
]

print("=== Testing Expanded PSL Word Vocabulary ===")
for q in test_queries:
    r = requests.post("http://127.0.0.1:8000/api/text-to-psl", json={"text": q})
    if r.status_code == 200:
        data = r.json()
        tokens = [x['token'] for x in data.get('animation_queue', [])]
        urls = [x.get('video_url') for x in data.get('animation_queue', [])]
        print(f"\n[Query]: {q}")
        print(f"  Gloss : {data.get('psl_gloss')}")
        print(f"  Tokens: {tokens}")
        print(f"  Videos: {urls}")
    else:
        print(f"\n[Query Failed]: {q} -> Status {r.status_code}")
