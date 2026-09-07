import shutil
import tempfile
import os
from pathlib import Path
from fastapi import APIRouter, HTTPException, UploadFile, File
from app.services.psl_predictor import predict

router = APIRouter(prefix="/api")


@router.post("/translate/psl-to-urdu")
async def translate_psl_to_urdu(video: UploadFile = File(...)):
    """
    Endpoint: POST /api/translate/psl-to-urdu
    
    Receives a video file (blob), saves it temporarily, and runs it through the
    psl_predictor Gemini pipeline to get the Urdu and English translations.
    """
    try:
        # Save uploaded video to a temporary file
        fd, temp_path = tempfile.mkstemp(suffix=".webm")
        with os.fdopen(fd, 'wb') as f:
            shutil.copyfileobj(video.file, f)
            
        path = Path(temp_path)
        
        # Predict using Gemini (via psl_predictor)
        result = predict(path)
        
        # Clean up temp file
        os.remove(temp_path)
        
        # result typically contains: {"overall_sentence_ur": "...", "overall_sentence_en": "...", ...}
        # map to expected frontend tokens
        return {
            "id": "video_translation",
            "confidence": result.get("model_reported_confidence", 1.0),
            "source": "psl_predictor",
            "intent": {
                "urduSentence": result.get("overall_sentence_ur", ""),
                "englishSentence": result.get("overall_sentence_en", ""),
                "intentSummary": "ویڈیو کا ترجمہ (Video Translation)",
                "tone": "informative",
                "modelUsed": "gemini-3.7-flash (video)"
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
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
