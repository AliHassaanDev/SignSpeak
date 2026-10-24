import os
import subprocess
import time

FFMPEG = 'C:/Users/User/AppData/Local/Python/pythoncore-3.14-64/Lib/site-packages/imageio_ffmpeg/binaries/ffmpeg-win-x86_64-v7.1.exe'
VIDEO_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "frontend", "public", "videos", "glosses"))

def get_duration(file_path):
    cmd = [FFMPEG, '-i', file_path]
    res = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
    for line in res.stderr.split('\n'):
        if 'Duration:' in line:
            part = line.split('Duration:')[1].split(',')[0].strip()
            h, m, s = part.split(':')
            return float(h)*3600 + float(m)*60 + float(s)
    return 0

def trim_video(file_path):
    dur = get_duration(file_path)
    if dur <= 0:
        return False
    
    fname = os.path.basename(file_path)
    is_letter = fname.startswith("LETTER_")
    
    # Target duration for single pass
    if is_letter:
        target_dur = 2.0
    else:
        # For words, standard single pass takes 2.8s - 3.2s
        if dur > 5.0:
            target_dur = min(3.2, dur * 0.45)
        elif dur > 3.5:
            target_dur = min(2.8, dur * 0.6)
        else:
            return False # already short enough
            
    tmp_out = file_path + ".trimmed.mp4"
    cmd = [
        FFMPEG, '-y',
        '-ss', '0',
        '-i', file_path,
        '-t', str(target_dur),
        '-c', 'copy',
        tmp_out
    ]
    res = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    if res.returncode == 0 and os.path.exists(tmp_out) and os.path.getsize(tmp_out) > 5000:
        # Atomic replace
        os.replace(tmp_out, file_path)
        return True
    else:
        if os.path.exists(tmp_out):
            os.remove(tmp_out)
        return False

def main():
    print(f"Trimming videos in {VIDEO_DIR} to single-pass demonstrations...")
    files = [f for f in os.listdir(VIDEO_DIR) if f.endswith(".mp4")]
    trimmed_count = 0
    start_time = time.time()
    
    for f in files:
        fp = os.path.join(VIDEO_DIR, f)
        if trim_video(fp):
            trimmed_count += 1
            print(f"  [TRIMMED] {f}")
            
    elapsed = time.time() - start_time
    print(f"\n[DONE] Trimmed {trimmed_count} of {len(files)} videos to single-pass in {elapsed:.2f}s!")

if __name__ == "__main__":
    main()
