"""
PSL → Urdu Translation Router
================================
Unified 5-Step PSL Video Translation Pipeline:
  Step 1: Video Preprocessing (OpenCV 30 FPS normalization)
  Step 2: Signer & Landmark Extraction (MediaPipe with wrist/body normalization)
  Step 3: Temporal Segmentation (Kinetic motion energy & hand elevation)
  Step 4: Sequence Classification (Conv1D + BiLSTM model)
  Step 5: LLM Language Refinement (Gemini NLU translation without hallucination)
"""

import os
from pathlib import Path
import shutil
import tempfile

from fastapi import APIRouter, HTTPException, Query, UploadFile, File

from app.services.psl_pipeline import run_psl_pipeline, get_recognizer, to_serializable

router = APIRouter(prefix="/api")


@router.post("/translate/psl-to-urdu")
def translate_psl_to_urdu(
    video: UploadFile = File(...),
    fast: bool = Query(
        default=False,
        description="Use fast Gemini model (lower latency, slight accuracy trade-off)"
    ),
    trials: int = Query(
        default=1, ge=1, le=5,
        description="Gemini trials for voting (1=fastest, 3=most accurate). Only applies in Gemini mode."
    ),
    force_gemini: bool = Query(
        default=False,
        description="Skip the local model and always use Gemini vision"
    ),
):
    """
    Translate a PSL sign video into Urdu using the unified 5-step pipeline:
      1. Video Preprocessing (OpenCV 30 FPS normalization)
      2. Signer & Landmark Extraction (MediaPipe with wrist/body normalization)
      3. Temporal Segmentation (Kinetic motion energy & hand elevation)
      4. Sequence Classification (Conv1D + BiLSTM model)
      5. LLM Language Refinement (Gemini NLU SOV translation without hallucination)

    Upload: multipart/form-data with field 'video' (mp4, webm, mov, avi)
    """
    # Save the upload to a temp file
    suffix = Path(video.filename).suffix if video.filename else ".webm"
    fd, temp_path = tempfile.mkstemp(suffix=suffix)
    try:
        with os.fdopen(fd, "wb") as f:
            shutil.copyfileobj(video.file, f)

        path = str(temp_path)

        # Run unified 5-step translation pipeline
        try:
            result = run_psl_pipeline(path, trials=trials, force_gemini=force_gemini, fast=fast)
        except FileNotFoundError as e:
            raise HTTPException(status_code=400, detail=f"Video file error: {e}")
        except TimeoutError:
            raise HTTPException(
                status_code=504,
                detail="Video translation processing timed out. Try a shorter video.",
            )
        except Exception as e:
            err_str = str(e).lower()
            if "quota" in err_str or "429" in err_str:
                raise HTTPException(
                    status_code=429,
                    detail="API quota exceeded. Please wait and try again.",
                )
            raise HTTPException(status_code=500, detail=str(e))

        # Format unified response for frontend
        source_used = str(result.get("pipeline_source", "unified_5step_local_pipeline"))
        signs = result.get("signs", [])
        tokens = [
            {
                "id": str(s.get("predicted_meaning_en", s.get("gloss", "sign"))),
                "urdu": str(s.get("predicted_meaning_ur", s.get("urdu", ""))),
                "english": str(s.get("predicted_meaning_en", s.get("english", ""))),
                "gloss": str(s.get("gloss", s.get("predicted_meaning_en", "").upper())),
                "confidence": float(s.get("confidence", result.get("overall_confidence", 0.9))),
            }
            for s in signs
        ]

        overall_conf = float(result.get("overall_confidence", 0.9))
        urdu_sent = str(result.get("overall_sentence_ur", ""))
        eng_sent = str(result.get("overall_sentence_en", ""))

        raw_classes = result.get("classes_supported", 31)
        classes_str = str(raw_classes) if isinstance(raw_classes, str) else f"{raw_classes} classes supported"

        response_payload = {
            "id": "video_translation",
            "confidence": round(overall_conf, 3),
            "urdu": urdu_sent,
            "english": eng_sent,
            "gloss": str(result.get("gloss_sequence", "")),
            "source": source_used,
            "model_info": {
                "type": "5-Step Pipeline (OpenCV + MediaPipe + Kinetic Segmentation + Conv1D-BiLSTM + Gemini NLU)",
                "source": source_used,
                "classes": classes_str,
                "reliability": str(result.get("reliability", "high"))
            },
            "intent": {
                "urduSentence": urdu_sent,
                "englishSentence": eng_sent,
                "intentSummary": "ویڈیو کا ترجمہ (PSL Video Translation)",
                "tone": "informative",
                "modelUsed": source_used,
            },
            "tokens": tokens,
            "raw_result": result,
        }
        return to_serializable(response_payload)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        try:
            os.remove(temp_path)
        except Exception:
            pass


@router.get("/wlpsl/status")
def wlpsl_status():
    """
    Returns the status of the local PSL recognition model and pipeline.
    """
    recognizer = get_recognizer()
    return {
        "loaded": recognizer.is_loaded,
        "supported_classes": [v["english"] for v in recognizer.classes.values()] if recognizer.is_loaded else [],
        "class_count": len(recognizer.classes),
        "expected_feature_dim": recognizer.expected_feature_dim,
        "mediapipe_available": recognizer.extractor.is_available,
        "mediapipe_engine": recognizer.extractor.engine_type,
        "confidence_threshold": recognizer.conf_threshold,
        "error": recognizer.load_error if not recognizer.is_loaded else None,
    }

