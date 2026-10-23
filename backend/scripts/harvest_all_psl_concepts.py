import requests
import json
import time

headers = {"User-Agent": "Mozilla/5.0"}
r = requests.get('https://admin.psl.org.pk/api/category', headers=headers).json()
cats = r.get('data', [])

print(f"Total categories: {len(cats)}")

all_concepts = []
for c in cats:
    cid = c.get('id')
    cname = c.get('title')
    try:
        cr = requests.get(f'https://admin.psl.org.pk/api/category/{cid}', headers=headers, timeout=10).json()
        concepts = cr.get('data', {}).get('concepts', [])
        for conc in concepts:
            all_concepts.append({
                "category_id": cid,
                "category_name": cname,
                "concept_id": conc.get("id"),
                "title": conc.get("title"),
                "slug": conc.get("slug"),
                "urdu": conc.get("title_secondary")
            })
    except Exception as e:
        print(f"Error reading category {cid}: {e}")

print(f"Total concepts found across all categories: {len(all_concepts)}")

# Save to file
with open("psl_all_available_concepts.json", "w", encoding="utf-8") as f:
    json.dump(all_concepts, f, indent=2, ensure_ascii=False)

print("Saved to psl_all_available_concepts.json!")
