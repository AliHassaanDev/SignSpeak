import json

with open("psl_concept_matches.json", encoding="utf-8") as f:
    d = json.load(f)

for k in ["THANK", "HELLO", "WELCOME", "PLEASE", "HOW_ARE_YOU", "WATER", "HOSPITAL", "DOCTOR", "HELP", "PAKISTAN", "NAME"]:
    print(f"=== {k} ===")
    for item in d.get(k, []):
        cid = item.get("concept_id")
        title = item.get("title")
        slug = item.get("slug")
        cat = item.get("category")
        print(f"  id: {cid}, title: '{title}', slug: '{slug}', cat: '{cat}'")
