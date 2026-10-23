import requests
import json
import time

headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
    "Origin": "https://psl.org.pk",
    "Referer": "https://psl.org.pk/"
}

r = requests.get("https://admin.psl.org.pk/api/category/101", headers=headers, timeout=10)
concepts = r.json().get("data", {}).get("concepts", [])
letters = {}

for c in concepts:
    title = (c.get("title") or "").strip().upper()
    cid = c.get("id")
    if len(title) == 1 and title.isalpha():
        for attempt in range(3):
            try:
                vr = requests.get(f"https://admin.psl.org.pk/api/concept/{cid}/videos", headers=headers, timeout=10)
                vids = vr.json().get("data", {}).get("videos", [])
                if vids:
                    url = vids[0].get("video_url")
                    letters[f"LETTER_{title}"] = url
                    print(f"LETTER_{title}: {url}")
                break
            except Exception as e:
                time.sleep(1)

with open("psl_alphabet_videos.json", "w") as f:
    json.dump(letters, f, indent=2)

print(f"Done! Found {len(letters)} alphabet videos")
