"""
PSL Gemini Predictor — Compatibility Wrapper
=============================================
Provides the legacy predict() entry point, routing directly to the
production-grade GeminiMultimodalVision fallback engine.
"""

from typing import Any, Dict, List, Optional
from app.services.gemini_vision_fallback import gemini_vision_fallback


def predict(
    video_path: str,
    api_key: Optional[str] = None,
    trials: int = 1,
    cleanup: bool = True,
    vocab: Optional[List[str]] = None,
    fast: bool = False,
) -> Dict[str, Any]:
    """
    Executes multimodal Gemini vision prediction on sign language video.
    """
    if api_key:
        gemini_vision_fallback.api_key = api_key

    return gemini_vision_fallback.predict(
        video_path=video_path,
        trials=trials,
        fast=fast,
        vocab_hint=vocab
    )