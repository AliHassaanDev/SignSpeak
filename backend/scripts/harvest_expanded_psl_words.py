import os
import sys
import re
import json
import time
import requests
from concurrent.futures import ThreadPoolExecutor, as_completed

sys.stdout.reconfigure(encoding='utf-8')

headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
    "Origin": "https://psl.org.pk",
    "Referer": "https://psl.org.pk/"
}

OUTPUT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "frontend", "public", "videos", "glosses"))
REGISTRY_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "frontend", "public", "data", "gloss_video_registry.json"))
os.makedirs(OUTPUT_DIR, exist_ok=True)

# Broad curated dictionary of everyday conversational concepts
TARGET_CONCEPTS = [
    # Greetings & Courtesy
    "thank you", "hello", "welcome", "please", "how are you", "goodbye", "sorry", "excuse me",
    "fine", "yes", "no", "good morning", "good afternoon", "good night", "congratulations",
    
    # Medical & Emergency
    "hospital", "doctor", "medicine", "help", "emergency", "pain", "fever", "sick", "blood",
    "nurse", "ambulance", "police", "police officer", "accident", "danger", "safe", "treatment",
    
    # Food & Drink
    "water", "mineral water", "tea", "green tea", "milk", "coffee", "juice", "drink", "cold drink",
    "food", "eat", "bread", "rice", "meat", "chicken", "fish", "apple", "banana", "fruit",
    "vegetable", "sugar", "salt", "egg", "breakfast", "lunch", "dinner",
    
    # Actions & Verbs
    "come", "go", "go away", "want", "need", "see", "look", "listen", "hear", "speak",
    "sit", "stand", "sleep", "wake", "work", "play", "buy", "give", "take", "stop",
    "read", "write", "learn", "teach", "understand", "know", "live", "love", "like",
    "clean", "wash", "cook", "walk", "run", "wait", "call", "send", "open", "close",
    
    # Pronouns & Questions
    "i", "you", "he", "she", "we", "they", "my", "your", "our", "my name is",
    "what", "where", "when", "why", "who", "how", "this", "that", "all", "some", "none",
    
    # People & Family
    "family", "mother", "father", "brother", "sister", "son", "daughter", "friend", "baby",
    "child", "man", "woman", "teacher", "student", "boy", "girl", "person", "name",
    
    # Places & Environment
    "pakistan", "school", "home", "house", "room", "office", "market", "shop", "city",
    "village", "road", "street", "car", "bus", "train", "airport", "mosque",
    
    # Time & Calendar
    "time", "today", "tomorrow", "yesterday", "day", "night", "morning", "evening", "afternoon",
    "hour", "minute", "week", "month", "year", "now", "later", "always", "never",
    
    # Feelings & Adjectives
    "good", "bad", "happy", "sad", "angry", "tired", "big", "small", "hot", "cold",
    "new", "old", "clean", "dirty", "fast", "slow", "easy", "difficult", "beautiful",
    "hungry", "thirsty", "full", "empty", "true", "false",
    
    # Numbers
    "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten"
]

def load_all_categories():
    r = requests.get("https://admin.psl.org.pk/api/category", headers=headers, timeout=10)
    return r.json().get("data", [])

def get_category_concepts(cid):
    for _ in range(3):
        try:
            r = requests.get(f"https://admin.psl.org.pk/api/category/{cid}", headers=headers, timeout=10)
            if r.status_code == 200:
                return r.json().get("data", {}).get("concepts", [])
        except Exception:
            time.sleep(1)
    return []

def get_concept_video(cid):
    for _ in range(3):
        try:
            r = requests.get(f"https://admin.psl.org.pk/api/concept/{cid}/videos", headers=headers, timeout=10)
            if r.status_code == 200:
                vids = r.json().get("data", {}).get("videos", [])
                if vids:
                    return vids[0].get("video_url")
            return None
        except Exception:
            time.sleep(1)
    return None

def download_video(url, dest_path):
    if os.path.exists(dest_path) and os.path.getsize(dest_path) > 150000:
        return True # already downloaded
    for _ in range(3):
        try:
            r = requests.get(url, stream=True, timeout=25)
            if r.status_code == 200:
                with open(dest_path, "wb") as f:
                    for chunk in r.iter_content(chunk_size=16384):
                        if chunk: f.write(chunk)
                return True
        except Exception:
            time.sleep(1)
    return False

def main():
    print(f"Starting expanded dictionary harvest for {len(TARGET_CONCEPTS)} target concepts...")
    cats = load_all_categories()
    print(f"Loaded {len(cats)} categories from PSL platform.")

    # Match concepts
    matched_concepts = {} # token -> (concept_id, title, urdu)
    
    # Normalize targets
    clean_targets = {t.lower().strip(): t.upper().replace(" ", "_") for t in TARGET_CONCEPTS}
    
    for c in cats:
        cid = c.get("id")
        concepts = get_category_concepts(cid)
        for conc in concepts:
            title = (conc.get("title") or "").strip().lower()
            slug = (conc.get("slug") or "").strip().lower()
            urdu = conc.get("title_secondary") or ""
            conc_id = conc.get("id")
            
            # Exact match with target
            for target_text, token in clean_targets.items():
                if token in matched_concepts:
                    continue # already found an exact match
                if title == target_text or slug == target_text.replace(" ", "-"):
                    matched_concepts[token] = (conc_id, title, urdu)
                    print(f"  [MATCH] '{token}' -> Concept #{conc_id}: {title} ({urdu})")

    print(f"\nTotal matched concepts found: {len(matched_concepts)}")
    with open("matched_expanded_concepts.json", "w", encoding="utf-8") as f:
        json.dump({k: {"id": v[0], "title": v[1], "urdu": v[2]} for k, v in matched_concepts.items()}, f, indent=2, ensure_ascii=False)

    # Load registry
    registry = {}
    if os.path.exists(REGISTRY_PATH):
        with open(REGISTRY_PATH, "r", encoding="utf-8") as f:
            registry = json.load(f)

    # Fetch and download videos
    print("\nFetching video links and downloading clips...")
    download_count = 0
    
    def process_item(item):
        token, (conc_id, title, urdu) = item
        vurl = get_concept_video(conc_id)
        if not vurl:
            return token, False, "No video available"
        dest_file = os.path.join(OUTPUT_DIR, f"{token}.mp4")
        ok = download_video(vurl, dest_file)
        if ok:
            sz = os.path.getsize(dest_file)
            return token, True, f"{sz} bytes"
        return token, False, "Download error"

    with ThreadPoolExecutor(max_workers=6) as executor:
        futures = {executor.submit(process_item, it): it[0] for it in matched_concepts.items()}
        for fut in as_completed(futures):
            tok, ok, msg = fut.result()
            if ok:
                registry[tok] = f"/videos/glosses/{tok}.mp4"
                download_count += 1
                print(f"[OK] {tok}: {msg}")
            else:
                print(f"[FAIL] {tok}: {msg}")

    # Save registry
    with open(REGISTRY_PATH, "w", encoding="utf-8") as f:
        json.dump(registry, f, indent=2, ensure_ascii=False)

    print(f"\n[COMPLETE] Successfully expanded video registry to {len(registry)} real PSL video tokens!")

if __name__ == "__main__":
    main()
