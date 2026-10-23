import os
import subprocess
from pathlib import Path
import imageio_ffmpeg

def convert_all_glosses():
    ffmpeg = imageio_ffmpeg.get_ffmpeg_exe()
    repo_root = Path(__file__).resolve().parent.parent.parent
    gloss_dir = repo_root / "frontend" / "public" / "videos" / "glosses"

    png_files = sorted(list(gloss_dir.glob("*.png")))
    print(f"Found {len(png_files)} PNG files to convert in {gloss_dir}")

    success_count = 0
    for png in png_files:
        mp4_path = png.with_suffix(".mp4")
        cmd = [
            ffmpeg, "-y",
            "-loop", "1",
            "-i", str(png),
            "-c:v", "libx264",
            "-t", "2",
            "-pix_fmt", "yuv420p",
            "-vf", "scale=720:720:force_original_aspect_ratio=decrease,pad=720:720:(ow-iw)/2:(oh-ih)/2:color=black",
            "-r", "30",
            str(mp4_path)
        ]
        res = subprocess.run(cmd, capture_output=True, text=True)
        if res.returncode == 0 and mp4_path.exists():
            success_count += 1
            print(f"[OK] {png.name} -> {mp4_path.name} ({mp4_path.stat().st_size} bytes)")
        else:
            print(f"[FAIL] {png.name}: {res.stderr[:200]}")

    print(f"\nDone! Converted {success_count}/{len(png_files)} gloss videos successfully.")

if __name__ == "__main__":
    convert_all_glosses()
