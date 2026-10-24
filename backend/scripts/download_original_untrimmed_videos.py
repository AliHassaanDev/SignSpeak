import os
import json
import urllib.request
import time
from concurrent.futures import ThreadPoolExecutor, as_completed

PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
OUTPUT_DIR = os.path.join(PROJECT_ROOT, "frontend", "public", "videos", "glosses")
ALPHABET_JSON = os.path.join(PROJECT_ROOT, "psl_alphabet_videos.json")
CORE_JSON = os.path.join(PROJECT_ROOT, "psl_core_videos.json")

os.makedirs(OUTPUT_DIR, exist_ok=True)

def download_one(token, url):
    dest_path = os.path.join(OUTPUT_DIR, f"{token}.mp4")
    temp_path = dest_path + ".download"
    try:
        # Download directly from original CloudFront CDN URL with NO trimming or ffmpeg modification
        urllib.request.urlretrieve(url, temp_path)
        if os.path.exists(temp_path) and os.path.getsize(temp_path) > 10000:
            os.replace(temp_path, dest_path)
            size = os.path.getsize(dest_path)
            return token, True, f"{size} bytes (original)"
        else:
            return token, False, "Downloaded file too small or missing"
    except Exception as e:
        return token, False, str(e)
    finally:
        if os.path.exists(temp_path):
            try: os.remove(temp_path)
            except: pass

def main():
    print("=== Restoring Original Untrimmed PSL Videos ===")
    tasks = {}

    # 1. Alphabet Letters (LETTER_A - LETTER_Z)
    if os.path.exists(ALPHABET_JSON):
        with open(ALPHABET_JSON, "r", encoding="utf-8") as f:
            alpha_map = json.load(f)
            for tok, url in alpha_map.items():
                tasks[tok] = url

    # 2. Core Words
    if os.path.exists(CORE_JSON):
        with open(CORE_JSON, "r", encoding="utf-8") as f:
            core_map = json.load(f)
            for tok, url in core_map.items():
                tasks[tok] = url

    print(f"Total videos to restore to original raw versions: {len(tasks)}")
    start = time.time()
    success_count = 0

    with ThreadPoolExecutor(max_workers=8) as executor:
        futures = {executor.submit(download_one, tok, url): tok for tok, url in tasks.items()}
        for fut in as_completed(futures):
            tok, ok, msg = fut.result()
            if ok:
                success_count += 1
                print(f"  [OK] {tok}: {msg}")
            else:
                print(f"  [FAIL] {tok}: {msg}")

    print(f"\n[DONE] Restored {success_count}/{len(tasks)} videos to their original untrimmed state in {time.time() - start:.2f}s!")

if __name__ == "__main__":
    main()
