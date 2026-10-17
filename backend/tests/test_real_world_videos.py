import os
import sys
from pathlib import Path
import json

# Fix Windows console UTF-8 output
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8")

REPO_ROOT = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(REPO_ROOT / "backend"))
sys.path.insert(0, str(REPO_ROOT))

from dotenv import load_dotenv
load_dotenv(REPO_ROOT / ".env")
load_dotenv(REPO_ROOT / "backend" / ".env")

from app.services.psl_pipeline import run_psl_pipeline, get_recognizer
from app.services.gemini_vision_fallback import gemini_vision_fallback

VIDEOS_DIR = REPO_ROOT.parent / "Videos" if (REPO_ROOT.parent / "Videos").exists() else REPO_ROOT.parent

test_videos = [
    VIDEOS_DIR / "AOA.webm",
    VIDEOS_DIR / "Water.webm",
    VIDEOS_DIR / "water.mp4",
    VIDEOS_DIR / "AOA+Water.webm",
    VIDEOS_DIR / "hello_1622639997_27565.mp4",
    VIDEOS_DIR / "Hello_1667207692_26280.mp4",
    VIDEOS_DIR / "water_1669963414_39332.mp4",
]

print("=== REAL WORLD VIDEO DIAGNOSTIC TEST ===")
recognizer = get_recognizer()
print(f"Local Recognizer loaded: {recognizer.is_loaded}")

for vid in test_videos:
    if not vid.exists():
        print(f"\n[SKIP] File not found: {vid.name}")
        continue

    print(f"\n-------------------------------------------------------------")
    print(f"Testing Video: {vid.name} ({vid.stat().st_size:,} bytes)")
    
    # 1. Test local recognition alone to see its raw prediction & confidence
    local_res = recognizer.recognize_video(str(vid))
    print(f"  Local Recognizer:")
    print(f"    Success: {local_res.get('success')}")
    print(f"    Needs Fallback: {local_res.get('needs_gemini_fallback')}")
    print(f"    Overall Conf: {local_res.get('overall_confidence')}")
    signs = local_res.get('signs', [])
    for s in signs:
        print(f"    Segment {s['order']}: {s['gloss']} ({s['confidence']}) is_uncertain={s['is_uncertain']} top3={s.get('top3')}")
    
    # 2. Test Gemini Vision directly
    try:
        gemini_res = gemini_vision_fallback.predict(str(vid))
        print(f"  Gemini Vision Direct:")
        print(f"    Gloss: {gemini_res.get('gloss_sequence')}")
        print(f"    Urdu : {gemini_res.get('overall_sentence_ur')}")
        print(f"    Eng  : {gemini_res.get('overall_sentence_en')}")
        print(f"    Conf : {gemini_res.get('overall_confidence')}")
        print(f"    Signs: {[s.get('gloss') for s in gemini_res.get('signs', [])]}")
    except Exception as ge:
        print(f"  Gemini Direct Error: {ge}")

    # 3. Test Full Pipeline
    try:
        pipe_res = run_psl_pipeline(str(vid))
        print(f"  Full Pipeline Output:")
        print(f"    Source: {pipe_res.get('pipeline_source')}")
        print(f"    Gloss : {pipe_res.get('gloss_sequence')}")
        print(f"    Urdu  : {pipe_res.get('overall_sentence_ur')}")
        print(f"    Eng   : {pipe_res.get('overall_sentence_en')}")
        print(f"    Conf  : {pipe_res.get('overall_confidence')}")
    except Exception as pe:
        print(f"  Pipeline Error: {pe}")
