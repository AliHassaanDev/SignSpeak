import requests
import json
import os

url = 'http://localhost:8000/api/translate/psl-to-urdu'
candidates = [
    '../Assalam-o-Alaikum+water.webm',
    '../ml/data/raw/archive/WLPSL/Videos/alert/1.mp4',
    'tests/fixtures/test.webm'
]
video_path = next((p for p in candidates if os.path.exists(p)), None)

if not video_path:
    print("No valid test video found.")
    exit(0)

print(f"Testing {url} with {video_path}")

try:
    with open(video_path, 'rb') as f:
        files = {'video': (os.path.basename(video_path), f, 'video/mp4')}
        response = requests.post(url, files=files)
        
    print(f"Status Code: {response.status_code}")
    with open('test_output.json', 'w', encoding='utf-8') as out:
        json.dump(response.json(), out, indent=2, ensure_ascii=False)
    print("Response JSON written to test_output.json")
except Exception as e:
    print(f"Error: {e}")
