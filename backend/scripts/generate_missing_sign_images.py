import os
import subprocess
import time

FFMPEG = 'C:/Users/User/AppData/Local/Python/pythoncore-3.14-64/Lib/site-packages/imageio_ffmpeg/binaries/ffmpeg-win-x86_64-v7.1.exe'
GLOSS_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "frontend", "public", "videos", "glosses"))

def main():
    print("=== Ensuring Every PSL Token has a High-Quality Sign Image (.png) ===")
    files = [f for f in os.listdir(GLOSS_DIR) if f.endswith(".mp4")]
    print(f"Total video clips: {len(files)}")
    
    generated = 0
    already_exist = 0
    
    for f in sorted(files):
        token = f[:-4]
        png_path = os.path.join(GLOSS_DIR, f"{token}.png")
        if os.path.exists(png_path) and os.path.getsize(png_path) > 5000:
            already_exist += 1
            continue
            
        mp4_path = os.path.join(GLOSS_DIR, f)
        
        # Extract a clean, representative gesture frame at 1.0s or 1.2s into the video
        cmd = [
            FFMPEG, '-y',
            '-ss', '1.0',
            '-i', mp4_path,
            '-frames:v', '1',
            '-q:v', '2',
            png_path
        ]
        res = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        if res.returncode == 0 and os.path.exists(png_path) and os.path.getsize(png_path) > 3000:
            generated += 1
            if generated <= 20 or generated % 20 == 0:
                print(f"  [CREATED PNG] {token}.png ({os.path.getsize(png_path)} bytes)")
        else:
            # Fallback to 0.5s if 1.0s is out of range
            cmd[2] = '0.5'
            res2 = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
            if res2.returncode == 0 and os.path.exists(png_path):
                generated += 1
                
    total_pngs = len([f for f in os.listdir(GLOSS_DIR) if f.endswith(".png")])
    print(f"\n[DONE] Already had {already_exist} PNGs, generated {generated} new PNGs.")
    print(f"Total available PSL sign images in library: {total_pngs}!")

if __name__ == "__main__":
    main()
