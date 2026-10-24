import requests
import json
import time
from concurrent.futures import ThreadPoolExecutor, as_completed

headers = {"User-Agent": "Mozilla/5.0"}

def fetch_category(c):
    cid = c.get('id')
    cname = c.get('title')
    concepts_out = []
    for _ in range(3):
        try:
            r = requests.get(f'https://admin.psl.org.pk/api/category/{cid}', headers=headers, timeout=12)
            if r.status_code == 200:
                data = r.json().get('data', {}).get('concepts', [])
                for conc in data:
                    concepts_out.append({
                        "category_id": cid,
                        "category_name": cname,
                        "concept_id": conc.get("id"),
                        "title": (conc.get("title") or "").strip(),
                        "slug": (conc.get("slug") or "").strip(),
                        "urdu": (conc.get("title_secondary") or "").strip()
                    })
                return concepts_out
        except Exception:
            time.sleep(1)
    return concepts_out

def main():
    r = requests.get('https://admin.psl.org.pk/api/category', headers=headers, timeout=10).json()
    cats = r.get('data', [])
    print(f"Loaded {len(cats)} categories. Fetching all concepts in parallel...")
    
    all_concepts = []
    with ThreadPoolExecutor(max_workers=12) as executor:
        futures = {executor.submit(fetch_category, c): c['id'] for c in cats}
        for fut in as_completed(futures):
            res = fut.result()
            all_concepts.extend(res)
            
    print(f"Total concepts found: {len(all_concepts)}")
    with open("psl_all_available_concepts.json", "w", encoding="utf-8") as f:
        json.dump(all_concepts, f, indent=2, ensure_ascii=False)
    print("Saved to psl_all_available_concepts.json!")

if __name__ == "__main__":
    main()
