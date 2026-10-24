import json

with open("psl_concept_matches.json", encoding="utf-8") as f:
    d = json.load(f)

for k, items in d.items():
    print(f"{k}: {len(items)} items")
    for it in items[:3]:
        print(f"   [{it['concept_id']}] {it['title']} ({it['slug']}) in {it['category']}")
