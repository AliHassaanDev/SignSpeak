import requests
import json
import sys

sys.stdout.reconfigure(encoding='utf-8')

for text in ['آپ کیسے ہیں؟', 'شکریہ', 'میرا نام امان ہے']:
    r = requests.post('http://127.0.0.1:8000/api/text-to-psl', json={'text': text})
    print(f"\n=== Query: {text} (Status: {r.status_code}) ===")
    data = r.json()
    print(f"Gloss: {data.get('psl_gloss')}")
    for it in data.get('animation_queue', []):
        print(f"  token={it.get('token')} type={it.get('type')} video={it.get('video_url')} image={it.get('image_url')}")
