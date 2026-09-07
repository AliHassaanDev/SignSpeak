from fastapi import APIRouter, HTTPException, File, UploadFile, Form
from fastapi.responses import Response
from app.models.schemas import ASRResponse, TTSRequest
from app.services.asr_service import asr_service
from app.services.tts_service import tts_service
import traceback

router = APIRouter(prefix="/api")

@router.post("/asr", response_model=ASRResponse)
async def process_asr(file: UploadFile = File(...)):
    """
    Automatic Speech Recognition endpoint.
    Takes an audio file (wav, mp3, etc.) and returns the transcribed Urdu/English text.
    """
    try:
        audio_bytes = await file.read()
        result = asr_service.transcribe_audio(audio_bytes)
        return result
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/tts")
def process_tts(payload: TTSRequest):
    """
    Text to Speech endpoint.
    Takes Urdu/English text and returns a synthesized WAV audio file.
    """
    try:
        audio_bytes = tts_service.synthesize_speech(payload.text, payload.language)
        return Response(content=audio_bytes, media_type="audio/mpeg")
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
