import os
import time
import logging
from typing import List
from google import genai

from app.models.schemas import PSLTokenResponse

logger = logging.getLogger(__name__)

class VideoSynthesizer:
    def __init__(self):
        self.video_cache_dir = "data/videos"
        os.makedirs(self.video_cache_dir, exist_ok=True)
        self.api_key = os.environ.get("GEMINI_API_KEY", "")
        self.client = None
        self.model_name = "gemini-omni-flash-preview"

    def generate_video(self, tokens: List[PSLTokenResponse]) -> str:
        """
        Takes a sequence of gloss tokens and returns a URL/path to the synthesized video.
        Uses Gemini Omni Flash to generate the video on the fly.
        """
        if not tokens:
            return ""

        gloss_ids = [t.gloss for t in tokens]
        logger.info(f"Synthesizing video for sequence: {gloss_ids}")

        if not self.api_key:
            logger.error("GEMINI_API_KEY is not configured on the backend. Returning mock video.")
            return "https://www.w3schools.com/html/mov_bbb.mp4"

        if not self.client:
            self.client = genai.Client(api_key=self.api_key)

        # Build prompt from descriptions
        descriptions = [t.description for t in tokens if t.description]
        prompt = f"A person facing the camera, performing Pakistani Sign Language in a continuous shot. The sequence of signs is: {', '.join(gloss_ids)}. Visual details: {' '.join(descriptions)}."

        try:
            logger.info("Calling Gemini Omni Flash Preview...")
            # Use Interactions API as specified for Omni Flash
            interaction = self.client.interactions.create(
                model=self.model_name,
                input=prompt
            )
            
            # Extract video from output steps
            for step in reversed(interaction.steps):
                if step.type == "model_output":
                    for part in step.content:
                        if hasattr(part, "video") and part.video:
                            # Save the video to disk
                            timestamp = int(time.time())
                            filename = f"generated_{timestamp}.mp4"
                            filepath = os.path.join(self.video_cache_dir, filename)
                            
                            if hasattr(part.video, "data") and part.video.data:
                                with open(filepath, "wb") as f:
                                    f.write(part.video.data)
                                logger.info(f"Saved generated video to {filepath}")
                                return f"http://localhost:8000/videos/{filename}"
                            elif hasattr(part.video, "uri") and part.video.uri:
                                logger.info(f"Generated video URI: {part.video.uri}")
                                return part.video.uri
                                
            logger.warning("No video found in Gemini output.")
            return "https://www.w3schools.com/html/mov_bbb.mp4"

        except Exception as e:
            logger.error(f"Failed to generate video: {str(e)}")
            return "https://www.w3schools.com/html/mov_bbb.mp4"

video_synthesizer = VideoSynthesizer()
