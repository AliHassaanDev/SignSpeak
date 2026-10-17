import os
import sys
import requests
import json
import numpy as np
import cv2
from pathlib import Path

# Fix Windows console UTF-8 output
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8")

REPO_ROOT = Path(__file__).resolve().parent.parent.parent
API_URL = "http://127.0.0.1:8000/api/translate/psl-to-urdu"

def test_api_open_vocabulary():
    print("Testing /api/translate/psl-to-urdu with open-vocabulary sign gesture (waving hand)...")
    test_video = REPO_ROOT / "backend" / "tests" / "fixtures" / "test_wave_hello.mp4"
    test_video.parent.mkdir(parents=True, exist_ok=True)

    # 45 frames of waving hand (Hello gesture)
    fourcc = cv2.VideoWriter_fourcc(*'mp4v')
    out = cv2.VideoWriter(str(test_video), fourcc, 30.0, (640, 480))
    for i in range(45):
        frame = np.ones((480, 640, 3), dtype=np.uint8) * 230
        cv2.circle(frame, (320, 160), 45, (60, 60, 60), -1) # head
        cv2.ellipse(frame, (320, 320), (90, 130), 0, 0, 360, (80, 80, 80), -1) # torso
        # Hand waving near face/head (classic hello/salam gesture)
        wave_x = int(380 + np.sin(i * 0.4) * 25)
        wave_y = int(140 + np.cos(i * 0.4) * 10)
        cv2.line(frame, (360, 240), (wave_x, wave_y), (60, 60, 60), 10)
        cv2.circle(frame, (wave_x, wave_y), 20, (180, 150, 120), -1)
        out.write(frame)
    out.release()

    try:
        # Test 1: Standard Auto Hybrid Mode (should trigger fallback due to low local confidence/margin)
        print("\n--- Running with Standard Auto Hybrid Mode ---")
        with open(test_video, "rb") as f:
            resp = requests.post(API_URL, files={"video": (test_video.name, f, "video/mp4")})
        print(f"Status: {resp.status_code}")
        data = resp.json()
        print(f"Source: {data.get('source')}")
        print(f"Gloss : {data.get('gloss')}")
        print(f"Urdu  : {data.get('urdu')}")
        print(f"Eng   : {data.get('english')}")

        # Test 2: Explicit force_gemini=true (AI Vision Mode)
        print("\n--- Running with force_gemini=true (AI Vision Mode) ---")
        with open(test_video, "rb") as f:
            resp = requests.post(f"{API_URL}?force_gemini=true", files={"video": (test_video.name, f, "video/mp4")})
        print(f"Status: {resp.status_code}")
        data = resp.json()
        print(f"Source: {data.get('source')}")
        print(f"Gloss : {data.get('gloss')}")
        print(f"Urdu  : {data.get('urdu')}")
        print(f"Eng   : {data.get('english')}")
    finally:
        if test_video.exists():
            try:
                test_video.unlink()
            except Exception:
                pass

if __name__ == "__main__":
    test_api_open_vocabulary()
