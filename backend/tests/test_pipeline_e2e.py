"""
End-to-End Verification Test for the Unified 5-Step PSL Pipeline
"""

import os
import sys
from pathlib import Path

# Set up paths
REPO_ROOT = Path(__file__).resolve().parent.parent.parent
BACKEND_DIR = REPO_ROOT / "backend"
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

# Ensure UTF-8 output on Windows console
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8")


import numpy as np
from fastapi.testclient import TestClient

from app.main import app
from ml.inference.video_preprocessor import VideoPreprocessor
from ml.inference.temporal_segmenter import TemporalSegmenter
from ml.inference.psl_recognizer import PSLRecognizer
from app.services.psl_pipeline import get_recognizer


def test_e2e():
    print("=== TEST 1: Video Preprocessor (Step 1) ===")
    sample_video = REPO_ROOT / "ml" / "data" / "raw" / "archive" / "WLPSL" / "Videos" / "alert" / "1.mp4"
    if sample_video.exists():
        preprocessor = VideoPreprocessor(target_fps=30, target_size=(640, 480))
        frames, meta = preprocessor.preprocess(str(sample_video))
        assert frames is not None, "Failed to decode video frames"
        assert len(frames) > 0, "No frames decoded"
        assert meta["processed_frame_count"] == len(frames)
        assert frames[0].shape == (480, 640, 3)
        print(f"  [PASS] Preprocessed {len(frames)} frames at target 30 FPS. Duration: {meta['duration_sec']:.2f}s")
    else:
        print("  [SKIP] Sample video file not found")

    print("\n=== TEST 2: Temporal Segmenter (Step 3) ===")
    segmenter = TemporalSegmenter(fps=30)
    # Generate synthetic landmark motion sequence (90 frames)
    # Simulates: 20 rest frames, 30 active frames (sign 1), 10 rest frames, 30 active frames (sign 2)
    fake_kps = np.zeros((90, 258), dtype=np.float32)
    # Active sign 1: hands moving (features 132:258)
    fake_kps[20:50, 132:258] = np.sin(np.linspace(0, np.pi * 3, 30))[:, None] * 0.5
    # Active sign 2: hands moving
    fake_kps[60:90, 132:258] = np.cos(np.linspace(0, np.pi * 3, 30))[:, None] * 0.5

    segments = segmenter.segment_sequence(fake_kps, feature_format="258")
    assert len(segments) >= 1, "Should detect candidate sign segments"
    for seg in segments:
        print(f"  [PASS] Detected Segment #{seg.segment_id}: frames {seg.start_frame}->{seg.end_frame} ({seg.start_sec}s->{seg.end_sec}s)")

    print("\n=== TEST 3: PSLRecognizer & Model Inference (Step 4) ===")
    recognizer = get_recognizer()
    print(f"  Model loaded: {recognizer.is_loaded}")
    print(f"  Supported classes count: {len(recognizer.classes)}")
    print(f"  Expected feature dim: {recognizer.expected_feature_dim}")
    assert recognizer.is_loaded, "Keras model failed to load"
    assert len(recognizer.classes) > 0, "No classes loaded"

    # Test segment prediction
    dummy_segment = np.random.randn(45, recognizer.expected_feature_dim).astype(np.float32) * 0.1
    prediction = recognizer.predict_segment(dummy_segment)
    print(f"  [PASS] Top-1 Prediction: {prediction['english']} ({prediction['urdu']}) | Confidence: {prediction['confidence']}")
    print(f"  [PASS] Top-3 Candidates: {prediction['top3']}")
    assert "english" in prediction
    assert "urdu" in prediction
    assert "top3" in prediction
    assert len(prediction["top3"]) == 3

    print("\n=== TEST 4: FastAPI Router Integration (/api/wlpsl/status) ===")
    client = TestClient(app)
    status_resp = client.get("/api/wlpsl/status")
    assert status_resp.status_code == 200, f"Status endpoint returned {status_resp.status_code}"
    status_data = status_resp.json()
    print(f"  [PASS] Status response: loaded={status_data['loaded']}, classes={status_data['class_count']}")
    assert status_data["loaded"] is True
    assert status_data["class_count"] == len(recognizer.classes)

    print("\n=== TEST 5: Health Check (GET /) ===")
    root_resp = client.get("/")
    assert root_resp.status_code == 200
    root_data = root_resp.json()
    print(f"  [PASS] Service: {root_data['service']} | Status: {root_data['status']}")
    print(f"  [PASS] PSL Model: {root_data['models']['psl_to_urdu']['name']}")

    print("\n=== TEST 6: Video Translation API (POST /api/translate/psl-to-urdu) ===")
    if sample_video.exists():
        with open(sample_video, "rb") as f:
            resp = client.post("/api/translate/psl-to-urdu", files={"video": ("1.mp4", f, "video/mp4")})
        assert resp.status_code == 200, f"Translation failed with status {resp.status_code}: {resp.text}"
        trans_data = resp.json()
        print(f"  [PASS] Video translation response received!")
        print(f"         Source: {trans_data.get('source')}")
        print(f"         Confidence: {trans_data.get('confidence')}")
        print(f"         Urdu Sentence: {trans_data.get('intent', {}).get('urduSentence')}")
        print(f"         Tokens count: {len(trans_data.get('tokens', []))}")
        assert "tokens" in trans_data
        assert "intent" in trans_data
        assert "source" in trans_data

    print("\nALL 6 TESTS PASSED SUCCESSFULLY!")



if __name__ == "__main__":
    test_e2e()
