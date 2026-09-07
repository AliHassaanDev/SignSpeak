import sys
import os
import json
import codecs

sys.path.append(os.path.abspath('backend'))
from dotenv import load_dotenv
load_dotenv()

from app.models.schemas import UrduToPSLRequest
from app.services.gemini_psl_agent import gemini_psl_agent
from app.services.video_synthesizer import video_synthesizer

def test_pipeline():
    # Using words that exist in the dictionary + some unknown words to show both word-level signs and fingerspelling
    urdu_text = "السلام علیکم آپ کیسے ہیں؟ میرا نام علی ہے۔ شکریہ"
    req = UrduToPSLRequest(text=urdu_text, source="user_input")
    
    with codecs.open("C:/Users/User/.gemini/antigravity-ide/brain/d4213170-47fc-4831-a894-c9ea48381e1c/pipeline_test_results.md", "w", "utf-8") as f:
        f.write("# PSL Translation Pipeline Test Results\n\n")
        f.write("## 1. Input Urdu\n")
        f.write(f"> {urdu_text}\n\n")
        
        res = gemini_psl_agent.translate(req)
        
        f.write("## 2. Gemini Agent Output (Glosses)\n")
        f.write(f"**Reordered Gloss Sequence:** `{' '.join(res.gloss_sequence)}`\n\n")
        f.write("| Token ID | Gloss | English |\n")
        f.write("|---|---|---|\n")
        for token in res.tokens:
            f.write(f"| {token.id} | {token.gloss} | {token.english} |\n")
            
        f.write("\n## 3. Detailed Descriptions (for Video Gen)\n")
        for token in res.tokens:
            f.write(f"### {token.gloss} ({token.category})\n")
            f.write(f"**Description:** {token.description}\n\n")

        f.write("## 4. Video Synthesizer\n")
        video_url = video_synthesizer.generate_video(res.tokens)
        f.write(f"**Synthesized Video URL:** `{video_url}`\n")

if __name__ == '__main__':
    test_pipeline()
