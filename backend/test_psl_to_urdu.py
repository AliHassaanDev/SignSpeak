import requests
import json
import os

url = 'http://localhost:8000/api/translate/psl-to-urdu'
video_path = '../Assalam-o-Alaikum+water.webm'

print(f"Testing {url} with {video_path}")

try:
    with open(video_path, 'rb') as f:
        files = {'video': (os.path.basename(video_path), f, 'video/webm')}
        response = requests.post(url, files=files)
        
    print(f"Status Code: {response.status_code}")
    with open('test_output.json', 'w', encoding='utf-8') as out:
        json.dump(response.json(), out, indent=2, ensure_ascii=False)
    print("Response JSON written to test_output.json")
except Exception as e:
    print(f"Error: {e}")
