"""
Step 4: Sign Recognition Model Engine
=====================================
Orchestrates Steps 1 through 4:
  1. Video Preprocessing (OpenCV): 30 FPS normalization, spatial standardizing.
  2. Signer & Landmark Extraction: Pose & Hands with body/wrist normalization.
  3. Temporal Segmentation: Kinetic energy & motion velocity segmentation.
  4. Sequence Classification: Conv1D/BiLSTM sequence model evaluation:
     - Top-1 gloss prediction (English + Urdu)
     - Top-3 candidate ranking with relative likelihoods
     - Confidence calibration and uncertainty flagging (< 0.65 threshold)
     - Consecutive sliding-window deduplication
"""

import json
import logging
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

import numpy as np

from ml.inference.video_preprocessor import VideoPreprocessor
from ml.inference.landmark_extractor import LandmarkExtractor
from ml.inference.temporal_segmenter import TemporalSegmenter, SignSegment

logger = logging.getLogger(__name__)

SEQ_LEN = 45
CONFIDENCE_THRESHOLD = 0.75


class PSLRecognizer:
    def __init__(
        self,
        model_path: Optional[str] = None,
        classes_path: Optional[str] = None,
        confidence_threshold: float = CONFIDENCE_THRESHOLD,
    ):
        self.conf_threshold = confidence_threshold
        self.model = None
        self.classes: Dict[str, Dict[str, str]] = {}
        self.is_loaded = False
        self.load_error: Optional[str] = None
        self.expected_feature_dim = 258

        # Initialize sub-modules
        self.preprocessor = VideoPreprocessor(target_fps=30, target_size=(640, 480))
        self.extractor = LandmarkExtractor()
        self.segmenter = TemporalSegmenter(fps=30)

        # Resolve paths
        repo_root = Path(__file__).resolve().parent.parent.parent
        processed_dir = repo_root / "ml" / "data" / "processed"

        if model_path is None:
            for candidate in ["wlpsl_lstm.keras", "wlpsl_lstm.h5", "wlpsl_15c_modern.keras"]:
                p = processed_dir / candidate
                if p.exists():
                    model_path = str(p)
                    break

        if classes_path is None:
            cp = processed_dir / "wlpsl_classes.json"
            if cp.exists():
                classes_path = str(cp)

        self._load_classes(classes_path)
        self._load_model(model_path)

    def _load_classes(self, classes_path: Optional[str]):
        if not classes_path or not Path(classes_path).exists():
            self.load_error = f"Classes file not found: {classes_path}"
            logger.warning(self.load_error)
            return

        try:
            with open(classes_path, "r", encoding="utf-8") as f:
                data = json.load(f)

            if "classes" in data and "urdu_map" in data:
                normalized = {}
                for idx, name in enumerate(data["classes"]):
                    normalized[str(idx)] = {
                        "english": name,
                        "urdu": data["urdu_map"].get(name, name)
                    }
                self.classes = normalized
            else:
                self.classes = data

            logger.info(f"[PSLRecognizer] Loaded {len(self.classes)} sign classes.")
        except Exception as e:
            self.load_error = f"Error reading classes JSON: {e}"
            logger.error(self.load_error)

    def _load_model(self, model_path: Optional[str]):
        if not model_path or not Path(model_path).exists():
            self.load_error = f"Model file not found: {model_path}"
            logger.warning(self.load_error)
            return

        try:
            import tensorflow as tf
            self.model = tf.keras.models.load_model(model_path, compile=False)
            self.is_loaded = True
            
            # Detect model input feature dimension
            if hasattr(self.model, "input_shape") and self.model.input_shape:
                self.expected_feature_dim = self.model.input_shape[-1]
            logger.info(
                f"[PSLRecognizer] Model loaded successfully from {model_path} "
                f"(expected feature dim: {self.expected_feature_dim})"
            )
        except Exception as e:
            self.load_error = f"Failed to load Keras model: {e}"
            logger.error(self.load_error)

    def predict_segment(self, segment_landmarks: np.ndarray) -> Dict[str, Any]:
        """
        Classifies a single sign segment landmark array.
        Standardizes length to SEQ_LEN (45 frames) via linear interpolation.
        Returns Top-1 gloss, Urdu label, confidence, and Top-3 candidate predictions.
        """
        if not self.is_loaded or self.model is None:
            return {
                "english": "unknown",
                "urdu": "نامعلوم",
                "confidence": 0.0,
                "top3": [],
                "is_uncertain": True
            }

        T = len(segment_landmarks)
        if T != SEQ_LEN:
            indices = np.linspace(0, T - 1, SEQ_LEN, dtype=int)
            seq = segment_landmarks[indices]
        else:
            seq = segment_landmarks

        # Shape: (1, SEQ_LEN, feature_dim)
        X = np.expand_dims(seq.astype(np.float32), axis=0)
        probs = self.model.predict(X, verbose=0)[0]

        # Top-1
        best_idx = int(np.argmax(probs))
        best_conf = float(probs[best_idx])
        meta = self.classes.get(str(best_idx), {"english": "unknown", "urdu": "نامعلوم"})

        # Top-3 ranking
        top_k_indices = np.argsort(probs)[-3:][::-1]
        top3_list = []
        for rank, idx in enumerate(top_k_indices, start=1):
            c_meta = self.classes.get(str(idx), {"english": f"class_{idx}", "urdu": ""})
            top3_list.append({
                "rank": int(rank),
                "english": str(c_meta["english"]),
                "urdu": str(c_meta["urdu"]),
                "confidence": float(round(float(probs[idx]), 3))
            })

        second_conf = float(probs[top_k_indices[1]]) if len(top_k_indices) > 1 else 0.0
        margin = float(best_conf - second_conf)

        is_uncertain = bool(best_conf < self.conf_threshold or margin < 0.15)

        return {
            "english": str(meta["english"]),
            "urdu": str(meta["urdu"]),
            "confidence": float(round(best_conf, 3)),
            "margin": float(round(margin, 3)),
            "top3": top3_list,
            "is_uncertain": is_uncertain
        }

    def recognize_video(self, video_path: str) -> Dict[str, Any]:
        """
        Executes Steps 1 through 4 end-to-end on a video:
          Step 1: Preprocess video frames (30 FPS, standard 640x480).
          Step 2: Extract landmarks with normalization.
          Step 3: Segment continuous signing into candidate intervals.
          Step 4: Classify each segment and deduplicate.
        """
        # Step 1: Video Preprocessing
        frames, pre_meta = self.preprocessor.preprocess(video_path)
        if frames is None or len(frames) == 0:
            return {
                "success": False,
                "error": pre_meta.get("error", "video_preprocessing_failed"),
                "needs_gemini_fallback": True,
                "signs": []
            }

        # Step 2: Landmark Extraction
        feature_fmt = "462" if self.expected_feature_dim == 462 else "258"
        landmarks, ext_meta = self.extractor.extract_from_frames(frames, output_format=feature_fmt)

        if landmarks is None or not ext_meta.get("available") or not ext_meta.get("signer_detected"):
            logger.info("[PSLRecognizer] Landmarks unavailable or no signer detected; routing to Gemini vision.")
            return {
                "success": False,
                "needs_gemini_fallback": True,
                "reason": ext_meta.get("reason", "Landmarks unavailable on local runtime"),
                "extraction_meta": ext_meta,
                "signs": []
            }

        # Step 3: Temporal Segmentation
        segments: List[SignSegment] = self.segmenter.segment_sequence(landmarks, feature_format=feature_fmt)

        # Full-sequence evaluation
        pred_full = self.predict_segment(landmarks)

        # Step 4: Sequence Classification of each detected segment
        raw_predictions = []
        for seg in segments:
            seg_kps = landmarks[seg.start_frame : seg.end_frame]
            pred = self.predict_segment(seg_kps)
            raw_predictions.append({
                "order": int(seg.segment_id),
                "start_frame": int(seg.start_frame),
                "end_frame": int(seg.end_frame),
                "start_time_sec": float(seg.start_sec),
                "end_time_sec": float(seg.end_sec),
                "gloss": str(pred["english"].upper()),
                "predicted_meaning_en": str(pred["english"]),
                "predicted_meaning_ur": str(pred["urdu"]),
                "confidence": float(pred["confidence"]),
                "margin": float(pred.get("margin", 0.0)),
                "top3": pred["top3"],
                "is_uncertain": bool(pred["is_uncertain"])
            })

        # Calculate consensus across segments
        class_counts: Dict[str, int] = {}
        class_max_conf: Dict[str, float] = {}
        for p in raw_predictions:
            eng = p["predicted_meaning_en"]
            class_counts[eng] = class_counts.get(eng, 0) + 1
            class_max_conf[eng] = max(class_max_conf.get(eng, 0.0), p["confidence"])

        dom_item = max(class_counts.items(), key=lambda x: (x[1], class_max_conf[x[0]])) if class_counts else ("", 0)
        dom_eng = dom_item[0]
        dom_ratio = dom_item[1] / max(1, len(raw_predictions))

        full_eng = pred_full["english"]
        full_conf = pred_full["confidence"]
        full_margin = pred_full.get("margin", 0.0)

        # Check for single-sign agreement:
        # A video qualifies as a high-confidence in-distribution sign locally ONLY IF:
        # 1. The dominant segment matches full-sequence prediction
        # 2. Dominance ratio is high (>= 60% of segments)
        # 3. Overall confidence is high (>= 0.75) and margin is decisive (>= 0.20)
        is_isolated_confident = bool(
            dom_eng == full_eng and
            dom_ratio >= 0.60 and
            full_conf >= self.conf_threshold and
            full_margin >= 0.20
        )

        if is_isolated_confident and raw_predictions:
            best_conf = max(full_conf, class_max_conf.get(dom_eng, 0.0))
            meta = next((v for v in self.classes.values() if v.get("english") == dom_eng), {"urdu": ""})
            deduped_signs = [{
                "order": 1,
                "start_frame": int(raw_predictions[0]["start_frame"]),
                "end_frame": int(raw_predictions[-1]["end_frame"]),
                "start_time_sec": float(raw_predictions[0]["start_time_sec"]),
                "end_time_sec": float(raw_predictions[-1]["end_time_sec"]),
                "gloss": str(dom_eng.upper()),
                "predicted_meaning_en": str(dom_eng),
                "predicted_meaning_ur": str(meta.get("urdu", "")),
                "confidence": float(round(best_conf, 3)),
                "top3": pred_full["top3"],
                "is_uncertain": False
            }]
            needs_fallback = False
        else:
            # Multi-segment or uncertain: prune transient entry/exit noise
            filtered = []
            for idx, p in enumerate(raw_predictions):
                if len(raw_predictions) > 1 and (idx == 0 or idx == len(raw_predictions) - 1) and p["confidence"] < 0.25:
                    continue
                filtered.append(p)
            if not filtered:
                filtered = raw_predictions

            deduped_signs = self._deduplicate(filtered)

            # If no segments remain or all are empty, provide full prediction as candidate hypothesis
            if not deduped_signs and pred_full:
                meta = next((v for v in self.classes.values() if v.get("english") == full_eng), {"urdu": ""})
                deduped_signs = [{
                    "order": 1,
                    "start_frame": 0,
                    "end_frame": len(landmarks),
                    "start_time_sec": 0.0,
                    "end_time_sec": float(len(landmarks) / 30.0),
                    "gloss": str(full_eng.upper()),
                    "predicted_meaning_en": str(full_eng),
                    "predicted_meaning_ur": str(meta.get("urdu", "")),
                    "confidence": float(round(full_conf, 3)),
                    "top3": pred_full["top3"],
                    "is_uncertain": True
                }]

            needs_fallback = bool(
                len(deduped_signs) == 0 or
                any(s.get("is_uncertain", False) or s.get("confidence", 0) < self.conf_threshold for s in deduped_signs)
            )

        avg_conf = (
            sum(s["confidence"] for s in deduped_signs) / max(1, len(deduped_signs))
            if deduped_signs else 0.0
        )

        return {
            "success": True,
            "needs_gemini_fallback": needs_fallback,
            "signs": deduped_signs,
            "overall_confidence": float(round(float(avg_conf), 3)),
            "preprocessor_meta": pre_meta,
            "extraction_meta": ext_meta,
            "total_segments_detected": int(len(segments))
        }

    def _deduplicate(self, predictions: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Collapses consecutive identical predictions into a single sign window."""
        if not predictions:
            return []

        deduped = [predictions[0].copy()]
        for p in predictions[1:]:
            last = deduped[-1]
            if p["predicted_meaning_en"] == last["predicted_meaning_en"]:
                # Merge: keep highest confidence, extend end time
                if p["confidence"] > last["confidence"]:
                    last["confidence"] = p["confidence"]
                    last["top3"] = p["top3"]
                    last["is_uncertain"] = p["is_uncertain"]
                last["end_frame"] = p["end_frame"]
                last["end_time_sec"] = p["end_time_sec"]
            else:
                deduped.append(p.copy())

        # Re-number order
        for idx, s in enumerate(deduped, start=1):
            s["order"] = idx

        return deduped
