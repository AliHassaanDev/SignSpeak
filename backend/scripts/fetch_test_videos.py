import requests
import json

headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
    "Origin": "https://psl.org.pk",
    "Referer": "https://psl.org.pk/"
}

test_concepts = {
    "THANK_YOU": 4369,
    "HELLO": 4309,
    "WELCOME": 4380,
    "PLEASE": 4364,
    "HOW_ARE_YOU": 4310,
    "WATER": 7070,
    "HOSPITAL": 2371,
    "DOCTOR": 3957,
    "HELP": 5071,
    "PAKISTAN": 3836,
    "NAME": 600,
    "MY_NAME_IS": 4359,
    "YES": 4396
}

results = {}
for name, cid in test_concepts.items():
    try:
        r = requests.get(f"https://admin.psl.org.pk/api/concept/{cid}/videos", headers=headers, timeout=10)
        videos = r.json().get("data", {}).get("videos", [])
        if videos:
            v_url = videos[0].get("video_url")
            results[name] = {
                "concept_id": cid,
                "video_url": v_url,
                "total_variants": len(videos)
            }
            print(f"{name}: {v_url}")
        else:
            print(f"{name}: NO VIDEOS FOUND")
    except Exception as e:
        print(f"Error for {name}: {e}")

with open("psl_sample_videos.json", "w") as f:
    json.dump(results, f, indent=2)
