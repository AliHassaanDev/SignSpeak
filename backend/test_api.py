import sys
import os
from fastapi.testclient import TestClient

root_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if root_dir not in sys.path:
    sys.path.append(root_dir)

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8")

from app.main import app

client = TestClient(app)

video_candidates = [
    os.path.join(root_dir, "ml", "data", "raw", "archive", "WLPSL", "Videos", "alert", "1.mp4"),
    os.path.join(root_dir, "backend", "tests", "fixtures", "test.webm")
]

video_path = next((p for p in video_candidates if os.path.exists(p)), None)
if video_path is None:
    print("No sample video found for test.")
    sys.exit(0)

print(f"Testing /api/translate/psl-to-urdu with {video_path}")
with open(video_path, "rb") as f:
    response = client.post("/api/translate/psl-to-urdu", files={"video": (os.path.basename(video_path), f, "video/mp4")})

print(f"Status Code: {response.status_code}")
print(response.json())
