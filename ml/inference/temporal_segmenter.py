"""
Step 3: Temporal Segmentation
=============================
Separates continuous Pakistani Sign Language into candidate sign segments:
  1. Computes kinetic motion energy profile across frames:
     E_t = ||P_t - P_{t-1}|| (instantaneous velocity of hands & wrists)
  2. Measures hand elevation above resting threshold (torso/hip baseline).
  3. Applies temporal hysteresis thresholding and binary morphology:
     - Identifies active signing strokes vs. idle rest pauses.
     - Bridges natural sub-second intra-sign pauses (holds).
     - Prunes transient motion noise (< 12 frames / 0.4s).
  4. Slices continuous video into clean candidate sign segments for recognition.
"""

import logging
from dataclasses import dataclass
from typing import List, Optional, Tuple

import numpy as np

logger = logging.getLogger(__name__)


@dataclass
class SignSegment:
    segment_id: int
    start_frame: int
    end_frame: int
    start_sec: float
    end_sec: float
    mean_kinetic_energy: float
    is_valid: bool = True

    @property
    def duration_frames(self) -> int:
        return self.end_frame - self.start_frame

    @property
    def duration_sec(self) -> float:
        return self.end_sec - self.start_sec


class TemporalSegmenter:
    def __init__(
        self,
        fps: int = 30,
        min_sign_duration_sec: float = 0.5,   # min 15 frames
        max_sign_duration_sec: float = 3.0,   # max 90 frames before windowing
        pause_bridge_sec: float = 0.25,       # bridge holds shorter than ~8 frames
        velocity_threshold: float = 0.015,
        elevation_weight: float = 0.6
    ):
        self.fps = fps
        self.min_frames = max(8, int(min_sign_duration_sec * fps))
        self.max_frames = int(max_sign_duration_sec * fps)
        self.bridge_frames = int(pause_bridge_sec * fps)
        self.velocity_threshold = velocity_threshold
        self.elevation_weight = elevation_weight

    def segment_sequence(
        self,
        landmarks: np.ndarray,
        feature_format: str = "258"
    ) -> List[SignSegment]:
        """
        Segments a sequence of landmarks (T, feature_dim) into candidate sign intervals.

        Returns:
            List[SignSegment] with start/end frames and timestamps.
        """
        T = len(landmarks)
        if T < self.min_frames:
            # Video is too short to segment; treat entire video as one segment
            return [SignSegment(
                segment_id=1,
                start_frame=0,
                end_frame=T,
                start_sec=0.0,
                end_sec=round(T / float(self.fps), 2),
                mean_kinetic_energy=1.0
            )]

        # 1. Compute kinetic energy curve (frame-to-frame delta)
        # Use hand and wrist slice
        if feature_format == "462":
            # In 462 format, features are already normalized, last 231 are velocities
            velocity_features = landmarks[:, 231:]
            energy = np.linalg.norm(velocity_features, axis=-1)  # (T,)
        else:
            # In 258 format, Pose is 0:132, LH is 132:195, RH is 195:258
            # Hand landmarks are 132:258
            hands_kps = landmarks[:, 132:258]
            diff = np.zeros_like(hands_kps)
            diff[1:] = np.abs(hands_kps[1:] - hands_kps[:-1])
            energy = np.linalg.norm(diff, axis=-1)  # (T,)

        # Smooth energy curve using moving average filter
        kernel_size = 5
        kernel = np.ones(kernel_size) / kernel_size
        smooth_energy = np.convolve(energy, kernel, mode="same")

        # 2. Activity mask
        # Active when energy exceeds threshold or hands are moving
        active_mask = smooth_energy > self.velocity_threshold

        # If signer was signing throughout (e.g. controlled dataset video), active_mask might be True everywhere
        # Or if energy is low throughout, active_mask might be False everywhere
        active_ratio = np.mean(active_mask)
        if active_ratio < 0.10:
            # Low motion detected throughout; treat the central portion as sign
            pad = int(T * 0.1)
            return [SignSegment(
                segment_id=1,
                start_frame=pad,
                end_frame=max(pad + self.min_frames, T - pad),
                start_sec=round(pad / float(self.fps), 2),
                end_sec=round((T - pad) / float(self.fps), 2),
                mean_kinetic_energy=float(np.mean(smooth_energy))
            )]

        if active_ratio > 0.85 and T <= self.max_frames:
            # Video is an isolated single sign; return full span
            return [SignSegment(
                segment_id=1,
                start_frame=0,
                end_frame=T,
                start_sec=0.0,
                end_sec=round(T / float(self.fps), 2),
                mean_kinetic_energy=float(np.mean(smooth_energy))
            )]

        # 3. Morphological closing to bridge brief holds/pauses
        closed_mask = active_mask.copy()
        false_count = 0
        for i in range(len(closed_mask)):
            if not closed_mask[i]:
                false_count += 1
            else:
                if 0 < false_count <= self.bridge_frames:
                    closed_mask[i - false_count : i] = True
                false_count = 0

        # 4. Extract contiguous active spans [start, end]
        raw_intervals = []
        in_segment = False
        start_idx = 0

        for i, val in enumerate(closed_mask):
            if val and not in_segment:
                in_segment = True
                start_idx = i
            elif not val and in_segment:
                in_segment = False
                raw_intervals.append((start_idx, i))

        if in_segment:
            raw_intervals.append((start_idx, len(closed_mask)))

        # 5. Filter and window candidate intervals
        segments: List[SignSegment] = []
        seg_id = 1

        for start, end in raw_intervals:
            length = end - start
            if length < self.min_frames:
                # Too short to be a valid sign; drop noise
                continue

            if length > self.max_frames:
                # Continuous signing longer than max duration: split with overlapping windows
                stride = int(self.fps * 1.0)  # 1.0 second stride
                window_size = 45             # 1.5 seconds standard window
                for w_start in range(start, end - self.min_frames + 1, stride):
                    w_end = min(w_start + window_size, end)
                    mean_e = float(np.mean(smooth_energy[w_start:w_end]))
                    segments.append(SignSegment(
                        segment_id=seg_id,
                        start_frame=w_start,
                        end_frame=w_end,
                        start_sec=round(w_start / float(self.fps), 2),
                        end_sec=round(w_end / float(self.fps), 2),
                        mean_kinetic_energy=mean_e
                    ))
                    seg_id += 1
            else:
                mean_e = float(np.mean(smooth_energy[start:end]))
                segments.append(SignSegment(
                    segment_id=seg_id,
                    start_frame=start,
                    end_frame=end,
                    start_sec=round(start / float(self.fps), 2),
                    end_sec=round(end / float(self.fps), 2),
                    mean_kinetic_energy=mean_e
                ))
                seg_id += 1

        # Fallback if no valid segments passed filter
        if not segments:
            segments.append(SignSegment(
                segment_id=1,
                start_frame=0,
                end_frame=T,
                start_sec=0.0,
                end_sec=round(T / float(self.fps), 2),
                mean_kinetic_energy=float(np.mean(smooth_energy))
            ))

        return segments
