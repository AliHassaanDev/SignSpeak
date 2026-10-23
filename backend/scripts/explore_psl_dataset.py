import requests
import json

headers = {"User-Agent": "Mozilla/5.0"}
r = requests.get('https://admin.psl.org.pk/api/category', headers=headers).json()
cats = r.get('data', [])

print(f"Total categories: {len(cats)}")
for c in cats[:30]:
    cid = c.get('id')
    title = c.get('title')
    print(f"  ID {cid}: {title}")
