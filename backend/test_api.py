import sys
import os
import asyncio
from fastapi.testclient import TestClient

root_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if root_dir not in sys.path:
    sys.path.append(root_dir)

from app.main import app

client = TestClient(app)

video_path = os.path.join(root_dir, "Assalam-o-Alaikum+water.webm")

with open(video_path, "rb") as f:
    response = client.post("/api/translate/psl-to-urdu", files={"video": ("test.webm", f, "video/webm")})

print(response.status_code)
print(response.json())
