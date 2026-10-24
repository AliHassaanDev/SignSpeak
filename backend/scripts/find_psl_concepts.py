import requests
import json
import re

headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
    "Origin": "https://psl.org.pk",
    "Referer": "https://psl.org.pk/"
}

target_keywords = [
    "thank", "hello", "welcome", "water", "eat", "help", "hospital",
    "doctor", "name", "pakistan", "please", "how are you", "salam",
    "food", "drink", "medicine", "where", "you", "i", "my", "want",
    "good", "bad", "yes", "no", "stop", "police", "family", "school",
    "book", "learn", "speak", "sign", "love", "friend", "happy", "sad"
]

def find_matches():
    r = requests.get("https://admin.psl.org.pk/api/category", headers=headers, timeout=10)
    cats = r.json().get("data", [])
    
    matches = {}
    
    for c in cats:
        cid = c.get("id")
        cname = c.get("title")
        try:
            cr = requests.get(f"https://admin.psl.org.pk/api/category/{cid}", headers=headers, timeout=10)
            concepts = cr.json().get("data", {}).get("concepts", [])
            for conc in concepts:
                title = (conc.get("title") or "").strip()
                title_lower = title.lower()
                slug = (conc.get("slug") or "").lower()
                urdu = conc.get("title_secondary") or ""
                
                for kw in target_keywords:
                    # check exact match or word match
                    if kw == title_lower or kw == slug or re.search(r'\b' + re.escape(kw) + r'\b', title_lower):
                        key = kw.upper().replace(" ", "_")
                        if key not in matches:
                            matches[key] = []
                        matches[key].append({
                            "category_id": cid,
                            "category": cname,
                            "concept_id": conc.get("id"),
                            "title": title,
                            "slug": slug,
                            "urdu": urdu
                        })
        except Exception as e:
            print(f"Error reading cat {cid}: {e}")
            
    with open("psl_concept_matches.json", "w", encoding="utf-8") as f:
        json.dump(matches, f, indent=2, ensure_ascii=False)
        
    print(f"Matched {len(matches)} keywords! Saved to psl_concept_matches.json")
    for k, v in matches.items():
        print(f"{k}: {len(v)} matches (e.g. {v[0]['title']} [id: {v[0]['concept_id']}])")

if __name__ == "__main__":
    find_matches()
