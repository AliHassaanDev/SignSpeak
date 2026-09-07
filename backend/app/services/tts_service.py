import logging
import urllib.parse
import requests

logger = logging.getLogger(__name__)

class TTSService:
    def __init__(self):
        self.is_ready = True

    @staticmethod
    def _chunk_text(text: str, max_chars: int = 150) -> list[str]:
        words = text.split()
        chunks = []
        current: list[str] = []
        current_len = 0
        for w in words:
            if current_len + len(w) + 1 > max_chars and current:
                chunks.append(" ".join(current))
                current = [w]
                current_len = len(w)
            else:
                current.append(w)
                current_len += len(w) + 1
        if current:
            chunks.append(" ".join(current))
        return chunks or [text[:max_chars]]

    def synthesize_speech(self, text: str, language: str = "ur") -> bytes:
        """
        Synthesizes text to speech using Google TTS audio stream.
        Returns MP3 audio bytes.
        """
        logger.info(f"Synthesizing speech for text: '{text}' (lang: {language})")
        if not text or not text.strip():
            return b""

        clean_lang = language.split("-")[0].lower() if language else "ur"
        chunks = self._chunk_text(text.strip(), max_chars=150)

        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Referer": "https://translate.google.com/",
        }

        audio_chunks: list[bytes] = []
        try:
            for chunk in chunks:
                encoded_chunk = urllib.parse.quote(chunk)
                url = f"https://translate.google.com/translate_tts?ie=UTF-8&tl={clean_lang}&client=tw-ob&q={encoded_chunk}"
                res = requests.get(url, headers=headers, timeout=10)
                if res.status_code == 200 and res.content:
                    audio_chunks.append(res.content)
                else:
                    logger.warning(f"Google TTS returned status {res.status_code} for chunk: {chunk}")
            
            if audio_chunks:
                return b"".join(audio_chunks)
        except Exception as e:
            logger.error(f"TTS request failed: {e}")

        # Fallback dummy WAV header only if network request fails
        dummy_wav = bytes([
            0x52, 0x49, 0x46, 0x46, 0x24, 0x00, 0x00, 0x00, 
            0x57, 0x41, 0x56, 0x45, 0x66, 0x6d, 0x74, 0x20, 
            0x10, 0x00, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 
            0x44, 0xac, 0x00, 0x00, 0x88, 0x58, 0x01, 0x00, 
            0x02, 0x00, 0x10, 0x00, 0x64, 0x61, 0x74, 0x61, 
            0x00, 0x00, 0x00, 0x00
        ])
        return dummy_wav

tts_service = TTSService()
