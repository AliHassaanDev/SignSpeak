"""
Step 2: Signer and Landmark Extraction
======================================
Extracts skeleton and hand landmarks from preprocessed video frames:
  - MediaPipe Pose (33 body landmarks)
  - MediaPipe Left & Right Hands (21 landmarks each)
  - Wrist-Centric Normalization (invariance to hand position)
  - Torso-Centric Normalization (invariance to signer distance & body size)
  - Dynamic Velocity Vectors (Delta P = P_t - P_{t-1})
"""

import ctypes
import logging
import os
import sys
from pathlib import Path
from typing import Dict, List, Optional, Tuple

import numpy as np

# Windows Python 3.13 MediaPipe Tasks c_bindings free symbol patch
if sys.platform.startswith("win"):
    try:
        orig_cdll = ctypes.CDLL
        if not hasattr(ctypes, "_mediapipe_tasks_patched"):
            class PatchedCDLL(orig_cdll):
                def __getattr__(self, name):
                    if name == "free":
                        return ctypes.cdll.msvcrt.free
                    return super().__getattr__(name)
            ctypes.CDLL = PatchedCDLL
            ctypes._mediapipe_tasks_patched = True
    except Exception:
        pass

logger = logging.getLogger(__name__)

POSE_LANDMARKS_COUNT = 33
HAND_LANDMARKS_COUNT = 21

# Standard legacy dimensions
POSE_DIM_258 = POSE_LANDMARKS_COUNT * 4  # 132 (x, y, z, visibility)
HAND_DIM_258 = HAND_LANDMARKS_COUNT * 3  # 63 (x, y, z)
FEATURE_DIM_258 = POSE_DIM_258 + HAND_DIM_258 + HAND_DIM_258  # 258

# SOTA Normalized dimensions
SPATIAL_DIM_SOTA = (33 * 3) + (21 * 3) + (21 * 3) + 3 + 3  # 231
VELOCITY_DIM_SOTA = SPATIAL_DIM_SOTA                       # 231
FEATURE_DIM_462 = SPATIAL_DIM_SOTA + VELOCITY_DIM_SOTA      # 462


class LandmarkExtractor:
    def __init__(
        self,
        min_detection_confidence: float = 0.5,
        min_tracking_confidence: float = 0.5
    ):
        self.min_detection_confidence = min_detection_confidence
        self.min_tracking_confidence = min_tracking_confidence
        self._init_mediapipe()

    def _init_mediapipe(self):
        self.is_available = False
        self.holistic = None
        self.pose_detector = None
        self.hand_detector = None
        self.mp_module = None
        self.engine_type = "none"

        # 1. Try modern MediaPipe Tasks (PoseLandmarker + HandLandmarker)
        try:
            import mediapipe as mp
            from mediapipe.tasks import python as mp_python
            from mediapipe.tasks.python import vision as mp_vision

            repo_root = Path(__file__).resolve().parent.parent.parent
            models_dir = repo_root / "ml" / "data" / "models"
            pose_path = models_dir / "pose_landmarker_full.task"
            hand_path = models_dir / "hand_landmarker.task"

            if pose_path.exists() and hand_path.exists():
                pose_opts = mp_vision.PoseLandmarkerOptions(
                    base_options=mp_python.BaseOptions(model_asset_path=str(pose_path)),
                    min_pose_detection_confidence=self.min_detection_confidence,
                    min_tracking_confidence=self.min_tracking_confidence,
                    output_segmentation_masks=False
                )
                hand_opts = mp_vision.HandLandmarkerOptions(
                    base_options=mp_python.BaseOptions(model_asset_path=str(hand_path)),
                    min_hand_detection_confidence=self.min_detection_confidence,
                    min_tracking_confidence=self.min_tracking_confidence,
                    num_hands=2
                )
                self.pose_detector = mp_vision.PoseLandmarker.create_from_options(pose_opts)
                self.hand_detector = mp_vision.HandLandmarker.create_from_options(hand_opts)
                self.mp_module = mp
                self.is_available = True
                self.engine_type = "mediapipe_tasks"
                logger.info("[LandmarkExtractor] Initialized MediaPipe Tasks (Pose + Hand Landmarkers).")
                return
            else:
                logger.warning(f"[LandmarkExtractor] Model task files not found at {models_dir}")
        except Exception as e:
            logger.debug(f"[LandmarkExtractor] mediapipe.tasks initialization failed: {e}")

        # 2. Check for legacy mediapipe solutions holistic (MediaPipe <= 0.10.x / 1.1.x)
        try:
            import mediapipe as mp
            solutions = getattr(mp, "solutions", None)
            if solutions and hasattr(solutions, "holistic"):
                self.holistic = solutions.holistic.Holistic(
                    min_detection_confidence=self.min_detection_confidence,
                    min_tracking_confidence=self.min_tracking_confidence
                )
                self.is_available = True
                self.engine_type = "mp_solutions_holistic"
                logger.info("[LandmarkExtractor] Initialized legacy MediaPipe Holistic detector.")
                return
        except Exception as e:
            logger.debug(f"[LandmarkExtractor] mp.solutions.holistic not available: {e}")

        logger.info("[LandmarkExtractor] Native MediaPipe C++ bindings not available on this Python runtime.")

    def extract_from_frames(
        self,
        frames: List[np.ndarray],
        output_format: str = "462"  # "462" or "258"
    ) -> Tuple[Optional[np.ndarray], Dict[str, any]]:
        """
        Extracts keypoint sequences from preprocessed RGB frames.

        Returns:
            (landmarks_array, extraction_meta):
                landmarks_array: (T, feature_dim) float32 numpy array or None
                extraction_meta: Dict with detection diagnostics, hand visibility ratio, etc.
        """
        if not frames:
            return None, {
                "available": self.is_available,
                "engine": self.engine_type,
                "reason": "no_frames_provided",
                "hand_detected_frames": 0,
                "total_frames": 0,
                "hand_visibility_ratio": 0.0,
                "signer_detected": False
            }

        if not self.is_available:
            return None, {
                "available": False,
                "engine": self.engine_type,
                "reason": "MediaPipe detector not initialized on runtime",
                "hand_detected_frames": 0,
                "total_frames": int(len(frames)),
                "hand_visibility_ratio": 0.0,
                "signer_detected": False
            }

        raw_pose_list = []
        raw_lh_list = []
        raw_rh_list = []
        legacy_kps_list = []
        hand_detected_count = 0

        # Branch A: MediaPipe Tasks
        if self.engine_type == "mediapipe_tasks" and self.pose_detector and self.hand_detector:
            mp_img_cls = self.mp_module.Image
            mp_img_fmt = self.mp_module.ImageFormat.SRGB

            for frame in frames:
                mp_img = mp_img_cls(image_format=mp_img_fmt, data=frame)
                p_res = self.pose_detector.detect(mp_img)
                h_res = self.hand_detector.detect(mp_img)

                # 1. Pose landmarks (33, 3) + legacy (33 * 4)
                if p_res.pose_landmarks and len(p_res.pose_landmarks) > 0:
                    lms = p_res.pose_landmarks[0]
                    p_coords = np.array([[lm.x, lm.y, lm.z] for lm in lms], dtype=np.float32)
                    p_legacy = np.array([[lm.x, lm.y, lm.z, getattr(lm, "visibility", 1.0)] for lm in lms], dtype=np.float32).flatten()
                else:
                    p_coords = np.zeros((POSE_LANDMARKS_COUNT, 3), dtype=np.float32)
                    p_legacy = np.zeros(POSE_DIM_258, dtype=np.float32)

                # 2. Hand landmarks (21, 3 each)
                lh_coords = np.zeros((HAND_LANDMARKS_COUNT, 3), dtype=np.float32)
                rh_coords = np.zeros((HAND_LANDMARKS_COUNT, 3), dtype=np.float32)
                has_lh = False
                has_rh = False

                if h_res.hand_landmarks and h_res.handedness:
                    for h_lms, h_cats in zip(h_res.hand_landmarks, h_res.handedness):
                        cat_name = h_cats[0].category_name if h_cats else "Right"
                        coords = np.array([[lm.x, lm.y, lm.z] for lm in h_lms], dtype=np.float32)
                        if cat_name == "Left":
                            lh_coords = coords
                            has_lh = True
                        else:
                            rh_coords = coords
                            has_rh = True

                lh_legacy = lh_coords.flatten()
                rh_legacy = rh_coords.flatten()

                if has_lh or has_rh:
                    hand_detected_count += 1

                raw_pose_list.append(p_coords)
                raw_lh_list.append(lh_coords)
                raw_rh_list.append(rh_coords)
                legacy_kps_list.append(np.concatenate([p_legacy, lh_legacy, rh_legacy]))

        # Branch B: Legacy Holistic
        elif self.engine_type == "mp_solutions_holistic" and self.holistic:
            for frame in frames:
                frame.flags.writeable = False
                results = self.holistic.process(frame)
                frame.flags.writeable = True

                if results.pose_landmarks and results.pose_landmarks.landmark:
                    p_coords = np.array([[lm.x, lm.y, lm.z] for lm in results.pose_landmarks.landmark], dtype=np.float32)
                    p_legacy = np.array([[lm.x, lm.y, lm.z, lm.visibility] for lm in results.pose_landmarks.landmark], dtype=np.float32).flatten()
                else:
                    p_coords = np.zeros((POSE_LANDMARKS_COUNT, 3), dtype=np.float32)
                    p_legacy = np.zeros(POSE_DIM_258, dtype=np.float32)

                if results.left_hand_landmarks and results.left_hand_landmarks.landmark:
                    lh_coords = np.array([[lm.x, lm.y, lm.z] for lm in results.left_hand_landmarks.landmark], dtype=np.float32)
                    lh_legacy = lh_coords.flatten()
                    has_lh = True
                else:
                    lh_coords = np.zeros((HAND_LANDMARKS_COUNT, 3), dtype=np.float32)
                    lh_legacy = np.zeros(HAND_DIM_258, dtype=np.float32)
                    has_lh = False

                if results.right_hand_landmarks and results.right_hand_landmarks.landmark:
                    rh_coords = np.array([[lm.x, lm.y, lm.z] for lm in results.right_hand_landmarks.landmark], dtype=np.float32)
                    rh_legacy = rh_coords.flatten()
                    has_rh = True
                else:
                    rh_coords = np.zeros((HAND_LANDMARKS_COUNT, 3), dtype=np.float32)
                    rh_legacy = np.zeros(HAND_DIM_258, dtype=np.float32)
                    has_rh = False

                if has_lh or has_rh:
                    hand_detected_count += 1

                raw_pose_list.append(p_coords)
                raw_lh_list.append(lh_coords)
                raw_rh_list.append(rh_coords)
                legacy_kps_list.append(np.concatenate([p_legacy, lh_legacy, rh_legacy]))

        total_frames = int(len(frames))
        hand_visibility_ratio = float(hand_detected_count / max(1, total_frames))
        signer_detected = bool(np.abs(np.array(raw_pose_list)).sum() > 0)

        meta = {
            "available": True,
            "engine": self.engine_type,
            "total_frames": total_frames,
            "hand_detected_frames": int(hand_detected_count),
            "hand_visibility_ratio": float(round(hand_visibility_ratio, 3)),
            "signer_detected": signer_detected
        }

        if output_format == "462":
            pose_seq = np.array(raw_pose_list, dtype=np.float32)
            lh_seq = np.array(raw_lh_list, dtype=np.float32)
            rh_seq = np.array(raw_rh_list, dtype=np.float32)
            features = self._normalize_sota_sequence(pose_seq, lh_seq, rh_seq)
            return features, meta
        else:
            return np.array(legacy_kps_list, dtype=np.float32), meta

    def _normalize_sota_sequence(
        self,
        pose_seq: np.ndarray,
        lh_seq: np.ndarray,
        rh_seq: np.ndarray
    ) -> np.ndarray:
        """
        SOTA Invariant Feature Normalization:
          1. Pose normalized to mid-shoulder center and shoulder width.
          2. Hands normalized relative to their wrist (P_finger - P_wrist).
          3. Wrist location relative to torso tracked.
          4. Velocity vectors appended: Delta P = P_t - P_{t-1}.
        """
        T = len(pose_seq)

        # Mid-shoulder center & distance
        left_sh = pose_seq[:, 11, :3]   # (T, 3)
        right_sh = pose_seq[:, 12, :3]  # (T, 3)
        torso_center = (left_sh + right_sh) / 2.0  # (T, 3)
        sh_dist = np.linalg.norm(left_sh - right_sh, axis=-1, keepdims=True)  # (T, 1)
        sh_dist = np.where(sh_dist < 0.05, 0.25, sh_dist)  # avoid division by zero

        # Normalized Pose (torso invariant)
        pose_norm = (pose_seq - torso_center[:, None, :]) / sh_dist[:, None, :]

        # Handshape Normalization: subtract wrist (landmark 0) from finger landmarks
        lh_wrist = lh_seq[:, 0:1, :]
        rh_wrist = rh_seq[:, 0:1, :]

        lh_has_hand = (np.abs(lh_seq).sum(axis=(1, 2)) > 0)[:, None, None]
        rh_has_hand = (np.abs(rh_seq).sum(axis=(1, 2)) > 0)[:, None, None]

        lh_norm = np.where(lh_has_hand, (lh_seq - lh_wrist) / (sh_dist[:, None, :] * 0.4), 0.0)
        rh_norm = np.where(rh_has_hand, (rh_seq - rh_wrist) / (sh_dist[:, None, :] * 0.4), 0.0)

        # Wrist spatial location relative to body
        lh_pos = np.where(lh_has_hand, (lh_wrist - torso_center[:, None, :]) / sh_dist[:, None, :], 0.0)
        rh_pos = np.where(rh_has_hand, (rh_wrist - torso_center[:, None, :]) / sh_dist[:, None, :], 0.0)

        # Concatenate spatial features: (T, 231)
        spatial = np.concatenate([
            pose_norm.reshape(T, -1),
            lh_norm.reshape(T, -1),
            rh_norm.reshape(T, -1),
            lh_pos.reshape(T, -1),
            rh_pos.reshape(T, -1)
        ], axis=-1)

        # Velocity features: Delta P = P_t - P_{t-1}
        velocity = np.zeros_like(spatial)
        velocity[1:] = spatial[1:] - spatial[:-1]

        # Combined Spatial + Velocity Vector: (T, 462)
        features = np.concatenate([spatial, velocity], axis=-1)
        return features.astype(np.float32)

    def close(self):
        if self.pose_detector:
            try:
                self.pose_detector.close()
            except Exception:
                pass
            self.pose_detector = None
        if self.hand_detector:
            try:
                self.hand_detector.close()
            except Exception:
                pass
            self.hand_detector = None
        if self.holistic:
            try:
                self.holistic.close()
            except Exception:
                pass
            self.holistic = None
