import os
import sys
from fastapi import APIRouter, HTTPException
from app.models.schemas import UrduToPSLRequest, UrduToPSLResponse, TextToPSLRequest
from app.services.urdutopsl_service import urdu_to_psl_service

# Ensure project root is reachable for ml package
_PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
if _PROJECT_ROOT not in sys.path:
    sys.path.insert(0, _PROJECT_ROOT)

try:
    from ml.models.urdutopsl_model import PSLAnimationPipeline
    _REGISTRY_PATH = os.path.join(_PROJECT_ROOT, "ml", "data", "animation_registry.json")
    psl_pipeline = PSLAnimationPipeline(registry_path=_REGISTRY_PATH)
except Exception as e:
    psl_pipeline = None

router = APIRouter(prefix="/api")

@router.post("/text-to-psl")
def text_to_psl(payload: TextToPSLRequest):
    """
    Translate raw Urdu text into a PSL Gloss animation queue.
    Accepts: {"text": "Mujhe doctor ke paas jana hai"}
    Returns: {input_text, psl_gloss, total_sequence_length, animation_queue}
    """
    if psl_pipeline is None:
        raise HTTPException(status_code=503, detail="PSL Animation Pipeline not initialized")
    try:
        source_lang = getattr(payload, "source_lang", "auto") or "auto"
        result = psl_pipeline.process(payload.text, source_lang)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/translate/urdu-to-psl", response_model=UrduToPSLResponse)
def translate_urdu_to_psl(payload: UrduToPSLRequest):
    """
    Translates input Urdu text into Pakistani Sign Language gloss tokens and 3D avatar animation poses.
    Uses the urdutopsl model architecture with word-level sign mapping and fingerspelling fallback.
    """
    try:
        response = urdu_to_psl_service.translate(payload)
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/model-info")
def model_info():
    return {
        "model_name": "urdutopsl",
        "supported_datasets": ["DynamicWordLevelPakistanSignLanguage", "UAlpha40"],
        "architecture": "Hybrid Sequence Embedding + PSL Fingerspelling Fallback",
        "exported_format": "ONNX / PyTorch"
    }
