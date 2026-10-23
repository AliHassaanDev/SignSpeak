import requests
import sys

sys.stdout.reconfigure(encoding='utf-8')
queries = [
    'چائے اور دودھ',
    'میرا بھائی اور بہن',
    'ڈاکٹر نے دوائی دی',
    'آج کھانا کھاؤ',
    'کل صبح اسکول جاؤ'
]
for q in queries:
    r = requests.post('http://127.0.0.1:8000/api/text-to-psl', json={'text': q})
    print(f"\nQuery: {q} (Status: {r.status_code})")
    data = r.json()
    print(f"  Gloss: {data.get('psl_gloss')}")
    for item in data.get('animation_queue', []):
        print(f"    - [{item.get('token')}] ({item.get('type')}): {item.get('video_url')}")
