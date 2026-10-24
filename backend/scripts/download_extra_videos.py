import os
import requests
import json
import time

headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
    "Origin": "https://psl.org.pk",
    "Referer": "https://psl.org.pk/"
}

OUTPUT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "frontend", "public", "videos", "glosses"))
REGISTRY_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "frontend", "public", "data", "gloss_video_registry.json"))

extra_concepts = {
    "NO": 8107,
    "GO": 5059,
    "WANT": 5315,
    "HOW": 7493,
    "MY_NAME": 4359,
    "MY": 4359,
    "GOODBYE": 4305,
    "FRIEND": 1647,
    "PLEASE_HELP": 5071, # reuse help
    "I": 4124, # pronoun
}

with open(REGISTRY_PATH, "r", encoding="utf-8") as f:
    reg = json.load(f)

for token, cid in extra_concepts.items():
    try:
        r = requests.get(f"https://admin.psl.org.pk/api/concept/{cid}/videos", headers=headers, timeout=10)
        vids = r.json().get("data", {}).get("videos", [])
        if vids:
            vurl = vids[0].get("video_url")
            out_file = os.path.join(OUTPUT_DIR, f"{token}.mp4")
            print(f"[+] Downloading {token} from {vurl}...")
            vr = requests.get(vurl, stream=True, timeout=20)
            if vr.status_code == 200:
                with open(out_file, "wb") as f:
                    for chunk in vr.iter_content(chunk_size=16384):
                        if chunk:
                            f.write(chunk)
                sz = os.path.getsize(out_file)
                print(f"    -> Saved {token}.mp4 ({sz} bytes)")
                reg[token] = f"/videos/glosses/{token}.mp4"
    except Exception as e:
        print(f"Failed {token}: {e}")

with open(REGISTRY_PATH, "w", encoding="utf-8") as f:
    json.dump(reg, f, indent=2, ensure_ascii=False)

print("[DONE] Extra videos downloaded!")
