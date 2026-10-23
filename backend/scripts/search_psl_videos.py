import requests
import json
import time

headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
    "Origin": "https://psl.org.pk",
    "Referer": "https://psl.org.pk/"
}

def get_categories():
    r = requests.get("https://admin.psl.org.pk/api/category", headers=headers, timeout=10)
    return r.json().get("data", [])

def get_category_concepts(cat_id):
    r = requests.get(f"https://admin.psl.org.pk/api/category/{cat_id}", headers=headers, timeout=10)
    data = r.json().get("data", {})
    return data.get("concepts", [])

def get_concept_videos(concept_id):
    r = requests.get(f"https://admin.psl.org.pk/api/concept/{concept_id}/videos", headers=headers, timeout=10)
    data = r.json().get("data", {})
    return data.get("videos", [])

if __name__ == "__main__":
    test_cats = [65, 83, 31, 42, 72, 63, 60, 101, 8]
    for cid in test_cats:
        concepts = get_category_concepts(cid)
        print(f"\n--- Category {cid} ({len(concepts)} concepts) ---")
        for item in concepts[:15]:
            title = item.get("title", "")
            title_sec = item.get("title_secondary", "")
            cid_concept = item.get("id")
            slug = item.get("slug")
            print(f"  [{cid_concept}] {title} | {slug}")

