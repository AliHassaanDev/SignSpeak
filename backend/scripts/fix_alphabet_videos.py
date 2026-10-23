import os
import json
import subprocess
import urllib.request
import tempfile
import time

FFMPEG = 'C:/Users/User/AppData/Local/Python/pythoncore-3.14-64/Lib/site-packages/imageio_ffmpeg/binaries/ffmpeg-win-x86_64-v7.1.exe'
PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
JSON_PATH = os.path.join(PROJECT_ROOT, "psl_alphabet_videos.json")
OUTPUT_DIR = os.path.join(PROJECT_ROOT, "frontend", "public", "videos", "glosses")

def process_letter(letter_name, url):
    out_file = os.path.join(OUTPUT_DIR, f"{letter_name}.mp4")
    print(f"Processing {letter_name} from {url}...")
    
    # Download raw clip to temp file
    temp_raw = os.path.join(tempfile.gettempdir(), f"raw_{letter_name}.mp4")
    temp_trimmed = os.path.join(tempfile.gettempdir(), f"trim_{letter_name}.mp4")
    
    try:
        urllib.request.urlretrieve(url, temp_raw)
        
        # In PSL alphabet clips, the actor starts raising their hand at 1.3s - 1.5s,
        # signs clearly until ~3.2s, and lowers hand by 3.5s.
        # Starting at -ss 1.3 for -t 2.0 captures the complete, single-pass gesture with no delay!
        cmd = [
            FFMPEG, '-y',
            '-ss', '1.3',
            '-i', temp_raw,
            '-t', '2.0',
            '-c:v', 'libx264',
            '-preset', 'fast',
            '-crf', '23',
            '-pix_fmt', 'yuv420p',
            '-an', # Remove silent audio stream
            temp_trimmed
        ]
        res = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        if res.returncode == 0 and os.path.exists(temp_trimmed) and os.path.getsize(temp_trimmed) > 10000:
            os.replace(temp_trimmed, out_file)
            print(f"  [SUCCESS] {letter_name}.mp4 created ({os.path.getsize(out_file)} bytes)")
            return True
        else:
            print(f"  [FFMPEG ERROR] {res.stderr.decode('utf-8', errors='ignore')[:200]}")
            return False
    except Exception as e:
        print(f"  [DOWNLOAD/PROCESSING ERROR] {letter_name}: {e}")
        return False
    finally:
        if os.path.exists(temp_raw):
            try: os.remove(temp_raw)
            except: pass
        if os.path.exists(temp_trimmed):
            try: os.remove(temp_trimmed)
            except: pass

def main():
    if not os.path.exists(JSON_PATH):
        print(f"JSON not found: {JSON_PATH}")
        return
        
    with open(JSON_PATH, "r", encoding="utf-8") as f:
        alphabet_map = json.load(f)
        
    print(f"Found {len(alphabet_map)} letters to process.")
    start = time.time()
    success_count = 0
    
    for letter_name, url in sorted(alphabet_map.items()):
        if process_letter(letter_name, url):
            success_count += 1
            
    print(f"\n[DONE] Successfully processed {success_count}/{len(alphabet_map)} letters in {time.time() - start:.2f}s!")

if __name__ == "__main__":
    main()
