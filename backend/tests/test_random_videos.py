import os
import sys
import glob
import random
import requests
import json
from pathlib import Path

# Fix Windows console UTF-8 output
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8")

REPO_ROOT = Path(__file__).resolve().parent.parent.parent
VIDEOS_DIR = REPO_ROOT / "ml" / "data" / "raw" / "archive" / "WLPSL" / "Videos"
API_URL = "http://127.0.0.1:8000/api/translate/psl-to-urdu"

def run_random_tests(num_samples: int = 5):
    if not VIDEOS_DIR.exists():
        print(f"Videos directory not found: {VIDEOS_DIR}")
        return

    # Find all class folders
    class_folders = [d for d in VIDEOS_DIR.iterdir() if d.is_dir()]
    if not class_folders:
        print("No class folders found.")
        return

    # Select random distinct classes (excluding 'alert' which was tested previously)
    eligible_classes = [c for c in class_folders if c.name != "alert"]
    chosen_classes = random.sample(eligible_classes, min(num_samples, len(eligible_classes)))

    print(f"\n=======================================================")
    print(f" RUNNING RANDOM PSL-TO-URDU TRANSLATION BENCHMARK ({len(chosen_classes)} videos)")
    print(f" Target Endpoint: {API_URL}")
    print(f"=======================================================\n")

    results = []

    for i, class_dir in enumerate(chosen_classes, start=1):
        class_name = class_dir.name
        video_files = list(class_dir.glob("*.mp4")) + list(class_dir.glob("*.webm"))
        if not video_files:
            continue

        selected_video = random.choice(video_files)
        print(f"--- TEST #{i}: Ground Truth Class: [{class_name.upper()}] ---")
        print(f" Video Path: {selected_video.relative_to(REPO_ROOT)}")

        try:
            with open(selected_video, "rb") as f:
                files = {"video": (selected_video.name, f, "video/mp4")}
                resp = requests.post(API_URL, files=files, timeout=60)

            print(f" HTTP Status: {resp.status_code}")
            if resp.status_code == 200:
                data = resp.json()
                urdu = data.get("urdu", "")
                english = data.get("english", "")
                gloss = data.get("gloss", "")
                conf = data.get("confidence", 0.0)
                source = data.get("source", "unknown")
                tokens = data.get("tokens", [])
                
                print(f" Predicted Gloss  : {gloss}")
                print(f" Urdu Translation : {urdu}")
                print(f" English Sentence : {english}")
                print(f" Confidence Score : {conf:.3f}")
                print(f" Pipeline Source  : {source}")
                print(f" Tokens Detected  : {[t.get('gloss') for t in tokens]}")
                print(f" Status: [PASS]\n")

                results.append({
                    "test_num": i,
                    "ground_truth": class_name,
                    "video": str(selected_video.name),
                    "gloss": gloss,
                    "urdu": urdu,
                    "english": english,
                    "confidence": conf,
                    "source": source,
                    "status": "PASS"
                })
            else:
                print(f" [FAIL] HTTP {resp.status_code}: {resp.text}\n")
                results.append({
                    "test_num": i,
                    "ground_truth": class_name,
                    "status": "FAIL",
                    "error": resp.text
                })
        except Exception as e:
            print(f" [ERROR]: {e}\n")
            results.append({
                "test_num": i,
                "ground_truth": class_name,
                "status": "ERROR",
                "error": str(e)
            })

    print("=======================================================")
    print(" SUMMARY OF RANDOM TRANSLATION TESTS")
    print("=======================================================")
    for r in results:
        if r.get("status") == "PASS":
            match = "EXACT" if r["ground_truth"].upper() in r["gloss"].upper() else "SEMANTIC/APPROX"
            print(f" Test #{r['test_num']}: GT={r['ground_truth'].upper():<12} -> Pred={r['gloss']:<12} | Conf: {r['confidence']:.2f} | Match: {match} | Urdu: {r['urdu']}")
        else:
            print(f" Test #{r.get('test_num')}: GT={r.get('ground_truth')} -> FAILED ({r.get('error')})")

    # Save results to json
    out_path = REPO_ROOT / "backend" / "tests" / "random_test_results.json"
    with open(out_path, "w", encoding="utf-8") as out_f:
        json.dump(results, out_f, indent=2, ensure_ascii=False)
    print(f"\nSaved full results log to: {out_path}")

if __name__ == "__main__":
    random.seed(42)  # For reproducible test run
    run_random_tests(num_samples=5)
