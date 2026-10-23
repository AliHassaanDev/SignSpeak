import requests
import json
import sys

sys.stdout.reconfigure(encoding='utf-8')


queries = [
    'شکریہ',
    'مجھے پانی چاہیے',
    'ہسپتال کہاں ہے؟',
    'ڈاکٹر کو بلاؤ',
    'میرا بھائی اور بہن',
    'آج اسکول ہے',
    'چائے اور دودھ',
    'صبح بخیر'
]
for q in queries:
    r = requests.post('http://127.0.0.1:8000/api/text-to-psl', json={'text': q})
    print(f"\nQuery: {q} (Status: {r.status_code})")
    data = r.json()
    print(f"  Urdu: {data.get('urdu_translation')}")
    print(f"  Gloss: {data.get('psl_gloss')}")
    for item in data.get('animation_queue', []):
        tok = item.get('token')
        typ = item.get('type')
        v_url = item.get('video_url')
        print(f"    - [{tok}] ({typ}): {v_url}")
