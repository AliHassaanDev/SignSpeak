import os
import requests
import json
import time

headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
    "Origin": "https://psl.org.pk",
    "Referer": "https://psl.org.pk/"
}

# Target directory
OUTPUT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "frontend", "public", "videos", "glosses"))
REGISTRY_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "frontend", "public", "data", "gloss_video_registry.json"))

os.makedirs(OUTPUT_DIR, exist_ok=True)

# Words mapped to PSL concept IDs
WORD_CONCEPTS = {
    "THANK_YOU": 4369,
    "HELLO": 4309,
    "WELCOME": 4380,
    "PLEASE": 4364,
    "HOW_ARE_YOU": 4310,
    "WATER": 7070,
    "HOSPITAL": 2371,
    "DOCTOR": 3957,
    "HELP": 5071,
    "PAKISTAN": 3836,
    "NAME": 600,
    "YES": 4396,
    "EAT": 8070,
    "DRINK": 4990,
    "WHERE": 4389,
    "YOU": 4124,
    "GOOD": 8037,
    "HAPPY": 5644,
    "SAD": 5845,
    "MEDICINE": 8074,
    "SCHOOL": 1313,
    "POLICE": 2781,
    "LEARN": 5109,
    "LOVE": 5122,
    "SPEAK": 5258,
}

def get_concept_video_url(cid):
    for _ in range(3):
        try:
            r = requests.get(f"https://admin.psl.org.pk/api/concept/{cid}/videos", headers=headers, timeout=10)
            if r.status_code == 200:
                videos = r.json().get("data", {}).get("videos", [])
                if videos:
                    return videos[0].get("video_url")
            return None
        except Exception:
            time.sleep(1)
    return None

def download_file(url, out_path):
    for _ in range(3):
        try:
            r = requests.get(url, stream=True, timeout=20)
            if r.status_code == 200:
                with open(out_path, "wb") as f:
                    for chunk in r.iter_content(chunk_size=16384):
                        if chunk:
                            f.write(chunk)
                return True
        except Exception:
            time.sleep(1)
    return False

def main():
    # Load or initialize registry
    registry = {}
    if os.path.exists(REGISTRY_PATH):
        try:
            with open(REGISTRY_PATH, "r", encoding="utf-8") as f:
                registry = json.load(f)
        except Exception:
            registry = {}

    # 1. Download Core Words
    print("=== Processing Core PSL Words ===")
    for token, cid in WORD_CONCEPTS.items():
        vurl = get_concept_video_url(cid)
        if not vurl:
            print(f"[-] No video found for {token} (cid {cid})")
            continue
        
        target_path = os.path.join(OUTPUT_DIR, f"{token}.mp4")
        print(f"[+] Downloading {token} from {vurl} ...")
        success = download_file(vurl, target_path)
        if success:
            file_size = os.path.getsize(target_path)
            print(f"    -> Saved {token}.mp4 ({file_size} bytes)")
            registry[token] = f"/videos/glosses/{token}.mp4"
        else:
            print(f"    -> FAILED to download {token}")

    # 2. Download Alphabet Letters A-Z
    print("\n=== Processing PSL Alphabet (A-Z) ===")
    try:
        r = requests.get("https://admin.psl.org.pk/api/category/101", headers=headers, timeout=10)
        concepts = r.json().get("data", {}).get("concepts", [])
        for c in concepts:
            title = (c.get("title") or "").strip().upper()
            cid = c.get("id")
            if len(title) == 1 and title.isalpha():
                token = f"LETTER_{title}"
                vurl = get_concept_video_url(cid)
                if not vurl:
                    continue
                target_path = os.path.join(OUTPUT_DIR, f"{token}.mp4")
                print(f"[+] Downloading {token} ...")
                success = download_file(vurl, target_path)
                if success:
                    file_size = os.path.getsize(target_path)
                    print(f"    -> Saved {token}.mp4 ({file_size} bytes)")
                    registry[token] = f"/videos/glosses/{token}.mp4"
    except Exception as e:
        print(f"Error fetching alphabets: {e}")

    # 3. Save Registry
    with open(REGISTRY_PATH, "w", encoding="utf-8") as f:
        json.dump(registry, f, indent=2, ensure_ascii=False)
    print(f"\n[DONE] Saved video registry with {len(registry)} real PSL video entries to {REGISTRY_PATH}")

if __name__ == "__main__":
    main()
