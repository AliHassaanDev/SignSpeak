import os
import json
import re
import time
import requests
from concurrent.futures import ThreadPoolExecutor, as_completed

PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
CONCEPTS_FILE = os.path.join(PROJECT_ROOT, "psl_all_available_concepts.json")
OUTPUT_DIR = os.path.join(PROJECT_ROOT, "frontend", "public", "videos", "glosses")
REGISTRY_PATH = os.path.join(PROJECT_ROOT, "frontend", "public", "data", "gloss_video_registry.json")

os.makedirs(OUTPUT_DIR, exist_ok=True)

headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
    "Origin": "https://psl.org.pk",
    "Referer": "https://psl.org.pk/"
}

# Curated high-priority target keywords to search in 6516 PSL concepts
EXPANDED_TARGETS = [
    # Medical & Health Care
    "injection", "pill", "headache", "stomach", "heart", "eye", "ear", "teeth", "cough",
    "wound", "operation", "checkup", "clinic", "bandage", "fever", "pain", "patient",
    "disease", "pharmacy", "medical", "test", "tablet", "syrup",
    
    # Emergency & Assistance
    "help", "emergency", "danger", "police", "fire", "accident", "safe", "rescue",
    "security", "save", "urgent", "careful",
    
    # Daily Verbs
    "open", "close", "bring", "find", "wait", "stop", "talk", "say", "think", "look",
    "listen", "hear", "wash", "clean", "cook", "cut", "sleep", "wake", "sit", "stand",
    "walk", "run", "read", "write", "learn", "teach", "buy", "sell", "give", "take",
    "come", "go", "work", "play", "call", "send", "eat", "drink", "laugh", "cry",
    "remember", "forget", "help", "meet", "start", "finish", "stay", "travel",
    
    # Family & People
    "grandfather", "grandmother", "uncle", "aunt", "cousin", "husband", "wife",
    "parents", "family", "man", "woman", "boy", "girl", "child", "baby", "friend",
    "enemy", "neighbor", "person", "people", "teacher", "student", "boss", "worker",
    
    # Foods & Drinks
    "tea", "milk", "coffee", "juice", "water", "meat", "fish", "chicken", "beef", "mutton",
    "roti", "bread", "rice", "curry", "soup", "vegetable", "potato", "onion", "tomato",
    "apple", "banana", "mango", "orange", "grape", "fruit", "salt", "sugar", "egg",
    "butter", "oil", "sweet", "biscuit", "breakfast", "lunch", "dinner",
    
    # Places & Household
    "home", "house", "room", "door", "window", "kitchen", "bathroom", "table", "chair",
    "bed", "fan", "light", "phone", "bag", "book", "pen", "money", "clothes", "shoes",
    "school", "college", "university", "office", "bank", "shop", "market", "mosque",
    "park", "road", "street", "city", "village", "station", "airport", "hotel",
    
    # Transport & Vehicles
    "car", "bus", "train", "bicycle", "bike", "motorcycle", "rickshaw", "aeroplane", "boat",
    
    # Calendar, Time & Weather
    "today", "tomorrow", "yesterday", "morning", "afternoon", "evening", "night",
    "day", "week", "month", "year", "time", "hour", "minute", "clock", "now", "later",
    "always", "never", "early", "late", "sunday", "monday", "tuesday", "wednesday",
    "thursday", "friday", "saturday", "summer", "winter", "rain", "sun", "hot", "cold",
    
    # Adjectives & Feelings
    "happy", "sad", "angry", "tired", "hungry", "thirsty", "good", "bad", "beautiful",
    "ugly", "clean", "dirty", "big", "small", "tall", "short", "heavy", "light",
    "easy", "difficult", "fast", "slow", "rich", "poor", "strong", "weak", "new", "old",
    "true", "false", "right", "wrong", "busy", "free", "ready", "famous",
    
    # Questions & Pronouns
    "what", "where", "when", "why", "who", "how", "which", "whose", "this", "that",
    "these", "those", "here", "there", "i", "you", "he", "she", "we", "they", "my", "your"
]

def clean_token(s):
    tok = re.sub(r'[^A-Z0-9]+', '_', s.upper().strip()).strip('_')
    return tok

def get_concept_video_url(cid):
    for _ in range(3):
        try:
            r = requests.get(f"https://admin.psl.org.pk/api/concept/{cid}/videos", headers=headers, timeout=12)
            if r.status_code == 200:
                vids = r.json().get("data", {}).get("videos", [])
                if vids:
                    return vids[0].get("video_url")
            return None
        except Exception:
            time.sleep(1)
    return None

def download_video(url, dest_path):
    if os.path.exists(dest_path) and os.path.getsize(dest_path) > 30000:
        return True
    temp_path = dest_path + ".download"
    for _ in range(3):
        try:
            r = requests.get(url, stream=True, timeout=25)
            if r.status_code == 200:
                with open(temp_path, "wb") as f:
                    for chunk in r.iter_content(chunk_size=16384):
                        if chunk: f.write(chunk)
                if os.path.exists(temp_path) and os.path.getsize(temp_path) > 10000:
                    os.replace(temp_path, dest_path)
                    return True
        except Exception:
            time.sleep(1)
    if os.path.exists(temp_path):
        try: os.remove(temp_path)
        except: pass
    return False

def main():
    print("=== Expanding PSL Word Sign Video Library ===")
    if not os.path.exists(CONCEPTS_FILE):
        print(f"Error: {CONCEPTS_FILE} not found.")
        return
        
    with open(CONCEPTS_FILE, "r", encoding="utf-8") as f:
        all_concepts = json.load(f)
        
    print(f"Total PSL concepts in dictionary database: {len(all_concepts)}")

    # Load existing registry
    registry = {}
    if os.path.exists(REGISTRY_PATH):
        try:
            with open(REGISTRY_PATH, "r", encoding="utf-8") as f:
                registry = json.load(f)
        except Exception:
            registry = {}
            
    print(f"Current registered video tokens: {len(registry)}")
    
    # Build match map: target keyword -> list of matching concepts
    target_clean = {t.lower(): clean_token(t) for t in EXPANDED_TARGETS}
    
    # Match candidate concepts (prioritize exact title match, then single-word title)
    matched = {} # token -> concept dict
    
    for c in all_concepts:
        t_raw = (c.get("title") or "").strip().lower()
        slug = (c.get("slug") or "").strip().lower()
        cid = c.get("concept_id")
        urdu = (c.get("urdu") or "").strip()
        
        for kw, tok in target_clean.items():
            if tok in matched:
                continue # already matched
            # Exact match check
            if t_raw == kw or slug == kw or slug == kw.replace(" ", "-"):
                matched[tok] = {
                    "token": tok,
                    "concept_id": cid,
                    "title": c.get("title"),
                    "urdu": urdu,
                    "category": c.get("category_name")
                }

    print(f"Matched {len(matched)} target word concepts from PSL database!")
    
    # Save the expanded mapping
    with open("psl_new_word_matches.json", "w", encoding="utf-8") as f:
        json.dump(matched, f, indent=2, ensure_ascii=False)
        
    # Download missing videos
    to_download = []
    for tok, data in matched.items():
        vfile = os.path.join(OUTPUT_DIR, f"{tok}.mp4")
        if not os.path.exists(vfile) or os.path.getsize(vfile) < 30000:
            to_download.append(data)
            
    print(f"Tokens requiring video download: {len(to_download)}")
    
    def process_item(item):
        tok = item["token"]
        cid = item["concept_id"]
        vurl = get_concept_video_url(cid)
        if not vurl:
            return tok, False, "No video URL"
        dest_path = os.path.join(OUTPUT_DIR, f"{tok}.mp4")
        ok = download_video(vurl, dest_path)
        if ok:
            sz = os.path.getsize(dest_path)
            return tok, True, f"{sz} bytes"
        return tok, False, "Download error"

    download_success = 0
    start = time.time()
    with ThreadPoolExecutor(max_workers=8) as executor:
        futures = {executor.submit(process_item, it): it["token"] for it in to_download}
        for fut in as_completed(futures):
            tok, ok, msg = fut.result()
            if ok:
                registry[tok] = f"/videos/glosses/{tok}.mp4"
                download_success += 1
                print(f"  [OK] {tok}: {msg}")
            else:
                print(f"  [SKIP] {tok}: {msg}")
                
    # Also register any existing mp4 files that aren't yet in registry
    for f in os.listdir(OUTPUT_DIR):
        if f.endswith(".mp4"):
            tok = f[:-4].upper()
            if tok not in registry and os.path.getsize(os.path.join(OUTPUT_DIR, f)) > 10000:
                registry[tok] = f"/videos/glosses/{f}"
                
    with open(REGISTRY_PATH, "w", encoding="utf-8") as f:
        json.dump(registry, f, indent=2, ensure_ascii=False)
        
    print(f"\n[DONE] Successfully downloaded {download_success} new word sign videos!")
    print(f"Total active PSL video library entries: {len(registry)} videos across words and fingerspelling!")

if __name__ == "__main__":
    main()
