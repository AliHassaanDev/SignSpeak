import requests

headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
    "Origin": "https://psl.org.pk",
    "Referer": "https://psl.org.pk/"
}

for cid in [1, 2, 41, 65, 72]:
    try:
        r = requests.get(f"https://admin.psl.org.pk/api/category/{cid}", headers=headers, timeout=10)
        concepts = r.json().get("data", {}).get("concepts", [])
        for conc in concepts:
            title = (conc.get("title") or "").strip().lower()
            if title in ["no", "not", "stop", "go", "i", "my", "health", "near", "want", "what", "how"]:
                print(f"Cat {cid} [{conc.get('id')}] '{title}' -> slug: {conc.get('slug')}")
    except Exception as e:
        print(f"Error cat {cid}: {e}")
