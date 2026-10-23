import json
import os
import re

with open("psl_all_available_concepts.json", "r", encoding="utf-8") as f:
    concepts = json.load(f)

print(f"Total concepts: {len(concepts)}")

existing_videos = set()
vdir = "frontend/public/videos/glosses"
if os.path.exists(vdir):
    for f in os.listdir(vdir):
        if f.endswith(".mp4"):
            existing_videos.add(f[:-4].upper())

print(f"Existing video tokens: {len(existing_videos)}")

cats = set(c['category_name'] for c in concepts)
print(f"\nUnique category names ({len(cats)}):")
for c in sorted(cats):
    count = sum(1 for x in concepts if x['category_name'] == c)
    print(f" - {c} ({count} concepts)")
