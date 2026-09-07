import asyncio
import shutil
import tempfile
import os
from pathlib import Path
from fastapi import APIRouter, HTTPException, Query, UploadFile, File
from app.services.psl_predictor import predict

router = APIRouter(prefix="/api")


@router.post("/translate/psl-to-urdu")
async def translate_psl_to_urdu(
    video: UploadFile = File(...),
    fast: bool = Query(default=False, description="Use fast model (gemini-2.0-flash) for ~40-50% lower latency"),
    trials: int = Query(default=1, ge=1, le=5, description="Number of parallel prediction trials for accuracy voting (1=fastest, 3=highest accuracy)"),
):
    """
    Endpoint: POST /api/translate/psl-to-urdu

    Receives a video file (blob), saves it temporarily, and runs it through the
    psl_predictor Gemini pipeline to get the Urdu and English translations.

    Query params:
      fast=true   Use the lighter gemini-2.0-flash model (~40-50% faster)
      trials=N    Run N parallel prediction passes and pick the majority answer
                  (default 1 for max speed; 3 for best accuracy at same latency)
    """
    # Save uploaded video to a temporary file (sync, small — safe to do in async)
    fd, temp_path = tempfile.mkstemp(suffix=".webm")
    try:
        with os.fdopen(fd, 'wb') as f:
            shutil.copyfileobj(video.file, f)

        path = Path(temp_path)

        # Run the blocking Gemini pipeline in a thread-pool so we never
        # block the FastAPI event loop while Gemini is processing.
        loop = asyncio.get_event_loop()
        try:
            result = await loop.run_in_executor(
                None,
                lambda: predict(path, trials=trials, fast=fast)
            )
        except FileNotFoundError as e:
            raise HTTPException(status_code=400, detail=f"Video file error: {e}")
        except TimeoutError:
            raise HTTPException(
                status_code=504,
                detail="Gemini video processing timed out. Try a shorter or smaller video."
            )
        except RuntimeError as e:
            err_str = str(e).lower()
            if "quota" in err_str or "429" in err_str:
                raise HTTPException(
                    status_code=429,
                    detail="Gemini API quota exceeded. Please wait a moment and try again."
                )
            raise HTTPException(status_code=500, detail=str(e))

        # Map to expected frontend tokens
        return {
            "id": "video_translation",
            "confidence": result.get("model_reported_confidence", 1.0),
            "source": "psl_predictor",
            "intent": {
                "urduSentence": result.get("overall_sentence_ur", ""),
                "englishSentence": result.get("overall_sentence_en", ""),
                "intentSummary": "ویڈیو کا ترجمہ (Video Translation)",
                "tone": "informative",
                "modelUsed": f"{'gemini-2.0-flash' if fast else 'gemini-3.6-flash'} (video, {trials} trial{'s' if trials > 1 else ''})"
            },
            "tokens": [
                {
                    "id": sign.get("predicted_meaning_en", ""),
                    "urdu": sign.get("predicted_meaning_ur", ""),
                    "english": sign.get("predicted_meaning_en", ""),
                    "gloss": sign.get("gloss", ""),
                    "confidence": sign.get("confidence", 0.0)
                } for sign in result.get("signs", [])
            ]
        }

    except HTTPException:
        raise  # re-raise our own HTTP exceptions as-is
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        # Always clean up the temp file
        try:
            os.remove(temp_path)
        except Exception:
            pass
