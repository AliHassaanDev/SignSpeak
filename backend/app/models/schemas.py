from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

class TextToPSLRequest(BaseModel):
    text: str = Field(..., description="Text (English, Urdu script, or Roman Urdu) to translate into PSL animation sequence")
    source_lang: Optional[str] = Field("auto", description="Source language: 'ur', 'en', or 'auto'")

class PSLSignItem(BaseModel):
    token: str = Field(..., description="Gloss or letter token, e.g. WATER, LETTER_A")
    type: str = Field("WORD", description="'WORD' for word sign, 'LETTER' for fingerspelled character")
    urdu: Optional[str] = Field(None, description="Urdu translation/label of this token")
    english: Optional[str] = Field(None, description="English label of this token")
    image_url: Optional[str] = Field(None, description="Image asset path in public/videos/glosses")
    duration_ms: int = Field(2000, description="Duration to display this sign image in milliseconds")

class TextToPSLResponse(BaseModel):
    input_text: str
    source_lang: str
    urdu_translation: Optional[str] = None
    psl_gloss: str
    total_sequence_length: int
    animation_queue: List[PSLSignItem]

class UrduToPSLRequest(BaseModel):
    text: str = Field(..., description="Urdu text to translate to PSL")
    include_avatar_poses: bool = Field(True, description="Include detailed kinematic joint poses")
    speed_factor: float = Field(1.0, ge=0.5, le=2.0, description="Animation playback rate multiplier")

class PSLTokenResponse(BaseModel):
    id: str
    urdu: str
    gloss: str
    english: str
    category: str
    duration_ms: int
    confidence: float
    description: str
    avatar_pose: Optional[Dict[str, Any]] = None
    video_url: Optional[str] = None

class UrduToPSLResponse(BaseModel):
    model_name: str = "urdutopsl"
    model_version: str = "1.0.0-hybrid"
    input_urdu: str
    normalized_text: str
    tokens: List[PSLTokenResponse]
    video_url: Optional[str] = None
    gloss_sequence: List[str]
    total_duration_ms: int
    model_confidence: float

class ASRResponse(BaseModel):
    transcript: str
    confidence: float
    language: str

class TTSRequest(BaseModel):
    text: str = Field(..., description="Text to synthesize into speech")
    language: str = Field("ur", description="Language code, e.g., ur or en")

class AnimationMetadataResponse(BaseModel):
    token: str
    asset_url: str
    type: str
    duration_ms: int
    loop: bool
