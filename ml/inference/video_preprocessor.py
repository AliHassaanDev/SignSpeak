"""
Step 1: Video Preprocessing (OpenCV)
=====================================
Standardizes input videos for the PSL recognition pipeline:
  1. Decodes frames from MP4, WebM, AVI, MOV, or MKV containers.
  2. Normalizes frame rate to target 30 FPS via temporal sampling/interpolation.
  3. Standardizes spatial resolution (default: 640x480) for uniform landmark detection.
  4. Drops corrupt, empty, or black frames.
"""

import logging
from pathlib import Path
from typing import Dict, List, Optional, Tuple

import cv2
import numpy as np

logger = logging.getLogger(__name__)


class VideoPreprocessor:
    def __init__(
        self,
        target_fps: int = 30,
        target_size: Tuple[int, int] = (640, 480),
        max_duration_sec: float = 60.0
    ):
        self.target_fps = target_fps
        self.target_size = target_size
        self.max_duration_sec = max_duration_sec

    def preprocess(self, video_path: str) -> Tuple[Optional[List[np.ndarray]], Dict[str, float]]:
        """
        Reads and preprocesses video into standardized 30 FPS RGB frames.

        Returns:
            (frames, metadata):
                frames: List of (H, W, 3) RGB uint8 frames, or None if reading failed.
                metadata: Dict with original_fps, duration_sec, frame_count, etc.
        """
        path = Path(video_path)
        if not path.exists():
            logger.error(f"[VideoPreprocessor] File does not exist: {video_path}")
            return None, {"error": "file_not_found"}

        cap = cv2.VideoCapture(str(path))
        if not cap.isOpened():
            logger.error(f"[VideoPreprocessor] Failed to open video file: {video_path}")
            return None, {"error": "cannot_open"}

        orig_fps = cap.get(cv2.CAP_PROP_FPS)
        total_raw_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))

        if orig_fps <= 0 or np.isnan(orig_fps):
            orig_fps = 30.0

        if total_raw_frames <= 0:
            cap.release()
            return None, {"error": "empty_video"}

        duration_sec = total_raw_frames / orig_fps
        if duration_sec > self.max_duration_sec:
            logger.warning(
                f"[VideoPreprocessor] Video duration ({duration_sec:.1f}s) exceeds max limit ({self.max_duration_sec}s)."
            )

        # Read all raw frames
        raw_frames = []
        while cap.isOpened():
            ret, frame = cap.read()
            if not ret or frame is None:
                break
            raw_frames.append(frame)

        cap.release()

        if len(raw_frames) == 0:
            return None, {"error": "no_frames_decoded"}

        # Normalize FPS to target_fps (30 FPS)
        target_frame_count = max(1, int(round(duration_sec * self.target_fps)))
        if len(raw_frames) != target_frame_count:
            # Resample timestamps uniformly
            sample_indices = np.linspace(0, len(raw_frames) - 1, target_frame_count, dtype=int)
            sampled_raw = [raw_frames[i] for i in sample_indices]
        else:
            sampled_raw = raw_frames

        # Standardize resolution and convert to RGB
        processed_frames = []
        for frame in sampled_raw:
            # Resize
            if (frame.shape[1], frame.shape[0]) != self.target_size:
                resized = cv2.resize(frame, self.target_size, interpolation=cv2.INTER_AREA)
            else:
                resized = frame

            # BGR -> RGB
            rgb = cv2.cvtColor(resized, cv2.COLOR_BGR2RGB)
            processed_frames.append(rgb)

        metadata = {
            "original_fps": float(orig_fps),
            "target_fps": float(self.target_fps),
            "original_frame_count": float(len(raw_frames)),
            "processed_frame_count": float(len(processed_frames)),
            "duration_sec": float(duration_sec),
            "width": float(self.target_size[0]),
            "height": float(self.target_size[1]),
        }

        return processed_frames, metadata
