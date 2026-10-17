import os
import sys
import numpy as np
import cv2
from pathlib import Path
from dotenv import load_dotenv

# Fix Windows console UTF-8 output
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8")

REPO_ROOT = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(REPO_ROOT / "backend"))
load_dotenv(REPO_ROOT / ".env")

from app.services.gemini_vision_fallback import gemini_vision_fallback

def test_open_vocabulary_gemini():
    print("Testing Gemini Vision Fallback with Open-Vocabulary PSL Prompt...")
    # Create a small dummy video of a person raising a hand to wave or drink
    dummy_video_path = REPO_ROOT / "backend" / "tests" / "fixtures" / "dummy_gesture.mp4"
    dummy_video_path.parent.mkdir(parents=True, exist_ok=True)
    
    # 30 frames of 640x480 RGB
    fourcc = cv2.VideoWriter_fourcc(*'mp4v')
    out = cv2.VideoWriter(str(dummy_video_path), fourcc, 30.0, (640, 480))
    for i in range(30):
        frame = np.ones((480, 640, 3), dtype=np.uint8) * 220
        # draw a simple signer silhouette
        cv2.circle(frame, (320, 150), 40, (50, 50, 50), -1) # head
        cv2.ellipse(frame, (320, 300), (80, 120), 0, 0, 360, (70, 70, 70), -1) # torso
        # moving arm
        hand_y = int(250 - i * 3)
        cv2.line(frame, (320, 240), (400, hand_y), (60, 60, 60), 8) # arm
        cv2.circle(frame, (400, hand_y), 15, (200, 180, 150), -1) # hand
        out.write(frame)
    out.release()
    
    try:
        res = gemini_vision_fallback.predict(str(dummy_video_path), fast=True)
        print("Response received successfully!")
        print(f"Gloss: {res.get('gloss_sequence')}")
        print(f"Urdu : {res.get('overall_sentence_ur')}")
        print(f"Eng  : {res.get('overall_sentence_en')}")
        print(f"Conf : {res.get('overall_confidence')}")
        print("Signs:", res.get("signs"))
    except Exception as e:
        print(f"Error: {e}")
    finally:
        if dummy_video_path.exists():
            try:
                dummy_video_path.unlink()
            except Exception:
                pass

if __name__ == "__main__":
    test_open_vocabulary_gemini()
