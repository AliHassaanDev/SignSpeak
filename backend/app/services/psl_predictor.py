#!/usr/bin/env python3
"""
PSL (Pakistan Sign Language) Sign Predictor
=============================================

Takes a video of PSL signing -- a single sign OR a whole sequence of signs
forming a sentence -- and predicts what a mute/Deaf signer is communicating,
translating it into a fluent English/Urdu sentence a hearing person can
read (or, with --speak, hear) immediately. Uses Google's Gemini API for
video understanding.

WHY THIS VERSION IS MORE RELIABLE THAN A SINGLE API CALL
----------------------------------------------------------
No model can be 100% correct on every video -- video quality, lighting,
occlusion, and signing style all affect accuracy, and there's no way to
promise perfection. What we *can* do is make wrong or low-confidence
answers much rarer and much easier to spot:

1. File API upload (not inline base64) -- removes the ~20MB inline
   payload limit and lets Gemini process the full video losslessly.
2. Structured JSON output (response_schema) -- forces the model to
   report handshape, movement, orientation, location, AND a numeric
   confidence for every sign, instead of free-text prose that's hard
   to check.
3. Higher frame sampling for the video (custom fps via video_metadata)
   -- default Gemini video processing samples at 1 frame/sec, which
   can miss the fast transitions that carry meaning in sign language.
   We sample denser and request high media_resolution for hand detail.
4. Sharp still-frame cross-checking -- video frames get compressed hard
   by the video pipeline, which can blur small spatial distances (e.g.
   a thumb touching the lips vs. the jaw). We also extract several full
   -resolution still frames and send them alongside the video so the
   model can double check exactly where contact happens.
5. Self-consistency voting -- the model is asked the same question
   several times (independent trials). If most trials agree, that's
   the final answer and confidence is reported as high. If trials
   disagree, we surface ALL candidates plus an "agreement_rate" so the
   user knows to double check rather than silently trusting one guess.

Install:
    pip install google-genai opencv-python --break-system-packages
    # optional, only for --speak:
    pip install gTTS --break-system-packages

Usage:
    export GEMINI_API_KEY="your-key-here"
    python psl_predictor.py my_sign_video.mp4
    python psl_predictor.py my_sign_video.mp4 --trials 5 --json out.json
"""

import argparse
import json
import os
import re
import sys
import time
from collections import Counter
from pathlib import Path
from typing import Any, Optional

try:
    from google import genai
    from google.genai import types
except ImportError:
    print(
        "Missing dependency. Install it with:\n"
        "    pip install google-genai --break-system-packages",
        file=sys.stderr,
    )
    sys.exit(1)


# --------------------------------------------------------------------------
# Configuration
# --------------------------------------------------------------------------

MODEL_NAME = "gemini-3.6-flash"  # supports agentic video understanding
VIDEO_FPS = 8  # denser than Gemini's 1fps default, to catch fast sign transitions
NUM_KEY_FRAMES = 8  # sharp still frames sent alongside the video for fine detail
DEFAULT_TRIALS = 3
MAX_UPLOAD_WAIT_SECONDS = 120
MAX_RETRIES_PER_CALL = 3
RETRY_BACKOFF_SECONDS = 2

SUPPORTED_EXTENSIONS = {".mp4", ".webm", ".mov", ".mkv", ".avi"}

PROMPT = """You are an expert linguist and interpreter specializing in \
Pakistan Sign Language (PSL), helping a hearing person understand what a \
Deaf/mute signer is communicating in this video.

STEP 1 -- SEGMENT: The signer may perform ONE sign or a whole SEQUENCE of \
signs forming a sentence. Watch the full video and split it into distinct \
signs using natural boundaries: brief holds, changes in handshape/location, \
and transitional movements between signs. Give each sign an order index and \
its approximate start/end time in seconds within the video.

DO NOT OVER-SEGMENT: the hand passes through many incidental, unstable \
shapes WHILE MOVING from one sign to the next (co-articulation). A real \
sign is a handshape/location that is held steady for a sustained moment, \
not just any pose the hand happens to pass through mid-movement. If a \
handshape appears only fleetingly between two clear holds and does not \
itself look like a deliberate, complete sign, it is transitional noise -- \
do not report it as its own sign. When in doubt, prefer FEWER, more \
confident signs over more, shakier ones. The still frames described below \
are provided only to help you see the CONTACT POINT of signs you already \
identified from the video's motion -- they are not independent evidence of \
additional signs; do not add a sign just because one still frame happens \
to show an unusual pose.

STEP 2 -- DESCRIBE EACH SIGN: For every segmented sign, record the standard \
phonological parameters:
- Handshape & configuration
- Movement (path and manner)
- Palm & finger orientation
- Location & contact point on the body/space
- Non-manual markers (facial expression, mouth/eyebrow shape, head tilt or \
shake) -- in PSL these are NOT decorative, they carry grammar: e.g. raised \
eyebrows + forward head tilt typically mark a yes/no question, furrowed \
eyebrows mark a wh-question (who/what/where), a head shake can mean \
negation, and mouthing can disambiguate two signs with the same handshape.

STEP 3 -- GLOSS: Write the raw sign-order as a gloss sequence (each sign as \
a short UPPERCASE label in the order it was actually signed, PSL-SIGN-ORDER \
style, e.g. "TODAY SCHOOL GO-NOT ME"). This preserves the signer's actual \
language structure, separate from any translation.

STEP 4 -- TRANSLATE INTO A FLUENT SENTENCE: PSL word order is often \
different from spoken English/Urdu word order (e.g. time or topic first, \
question or negation markers placed differently, verbs sometimes last). Do \
NOT just output the signs word-for-word -- reorder and add function words \
as needed to produce ONE natural, grammatically correct sentence a hearing \
person would understand immediately, in both English and Urdu. Incorporate \
what the non-manual markers changed about the meaning (e.g. turn a \
statement into a question, or add "not").

IMPORTANT -- PRECISE CONTACT POINT: many PSL sign pairs share almost the \
same handshape and differ only by WHERE on the face/body the hand touches, \
or by a small difference in movement. Do not guess the location loosely -- \
name the exact contact point and be careful about commonly confused, \
closely-spaced locations, for example:
- Thumb touching the LIPS/mouth (often with a small tap or drinking-like \
motion) vs. thumb touching the JAW/CHIN (often with a stroking motion, \
mimicking a beard) -- these are different signs even though both use a \
closed fist with the thumb extended. Check the vertical position of the \
thumb relative to the corner of the mouth, not just "near the lower face".
- Signs near the forehead vs. temple vs. eyebrow.
- Signs near the chest vs. shoulder vs. collarbone.
If you are not certain which of two close locations was used, say so \
explicitly in that sign's alternate_candidates rather than picking one \
confidently.

PREFER COMMON MEANINGS: when a sign could plausibly mean either a common, \
everyday word (greeting, family term, food, feeling, etc.) or a rarer, \
more specialized one (military, religious, technical, formal), default to \
the common everyday meaning unless the video gives you a specific, clear \
reason to think otherwise. Put the rarer interpretation in \
alternate_candidates rather than as the primary answer unless you have \
strong evidence for it.

You have been given BOTH the full video (for movement and timing) AND \
several sharp still frames extracted from it (for fine handshape and \
contact-point detail, since video compression can blur small distances \
like lips vs. jaw). Cross-check the still frames whenever a sign's \
location is hard to pin down from the video alone.

Be honest about uncertainty: if a sign is ambiguous, blurry, or could \
plausibly mean more than one thing, lower its confidence score and list \
the alternate candidates you considered, with a short reason for each.

Respond ONLY with JSON matching the provided schema. Do not include any \
text outside the JSON."""

RESPONSE_SCHEMA = {
    "type": "object",
    "properties": {
        "signs": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "order": {"type": "integer"},
                    "start_time_sec": {"type": "number"},
                    "end_time_sec": {"type": "number"},
                    "gloss": {"type": "string"},
                    "handshape": {"type": "string"},
                    "movement": {"type": "string"},
                    "palm_orientation": {"type": "string"},
                    "location_contact": {"type": "string"},
                    "non_manual_markers": {"type": "string"},
                    "predicted_meaning_en": {"type": "string"},
                    "predicted_meaning_ur": {"type": "string"},
                    "confidence": {"type": "number"},
                    "alternate_candidates": {
                        "type": "array",
                        "items": {
                            "type": "object",
                            "properties": {
                                "meaning_en": {"type": "string"},
                                "meaning_ur": {"type": "string"},
                                "reason": {"type": "string"},
                            },
                            "required": ["meaning_en", "reason"],
                        },
                    },
                },
                "required": [
                    "order",
                    "handshape",
                    "movement",
                    "predicted_meaning_en",
                    "confidence",
                ],
            },
        },
        "gloss_sequence": {"type": "string"},
        "overall_sentence_en": {"type": "string"},
        "overall_sentence_ur": {"type": "string"},
        "overall_confidence": {"type": "number"},
        "notes": {"type": "string"},
    },
    "required": ["signs", "gloss_sequence", "overall_sentence_en", "overall_confidence"],
}


# --------------------------------------------------------------------------
# Core steps
# --------------------------------------------------------------------------

def get_client(api_key: Optional[str] = None) -> "genai.Client":
    key = api_key or os.environ.get("GEMINI_API_KEY")
    if not key:
        raise RuntimeError(
            "No API key found. Pass --api-key or set the GEMINI_API_KEY "
            "environment variable."
        )
    return genai.Client(api_key=key)


def upload_video(client: "genai.Client", path: Path):
    """Upload the video via the File API and wait until it's ACTIVE."""
    print(f"Uploading {path.name} ...")
    uploaded = client.files.upload(file=str(path))

    waited = 0
    while uploaded.state.name == "PROCESSING":
        if waited >= MAX_UPLOAD_WAIT_SECONDS:
            raise TimeoutError("Video processing timed out on Gemini's side.")
        time.sleep(2)
        waited += 2
        uploaded = client.files.get(name=uploaded.name)

    if uploaded.state.name == "FAILED":
        raise RuntimeError("Gemini failed to process the uploaded video.")

    print("Upload ready.")
    return uploaded


def build_prompt(vocab: Optional[list[str]]) -> str:
    """Build the instruction prompt, optionally biased toward a known vocabulary."""
    prompt = PROMPT
    if vocab:
        vocab_list = ", ".join(v.strip() for v in vocab if v.strip())
        prompt += f"""

KNOWN VOCABULARY HINT: the signer is very likely using words/phrases from \
this list: [{vocab_list}]. For each sign, first check whether it matches \
one of these -- if so, use that as your primary prediction. Only propose \
a sign outside this list if you are confident none of these fit. Still \
report your real confidence and alternate_candidates as usual; this list \
is a hint to narrow your search, not a guarantee every sign is on it."""
    return prompt


def extract_key_frames(path: Path, n: int = NUM_KEY_FRAMES) -> list[bytes]:
    """
    Pull n evenly-spaced frames from the video at full resolution and
    encode them as JPEG bytes.

    Why: Gemini's video pipeline samples and compresses frames from the
    video stream, which can blur small spatial differences -- like a
    thumb touching the lips vs. the jaw, a few centimeters apart. Sending
    a handful of sharp standalone still images lets the model cross-check
    exactly where contact happens, on top of the video's movement/timing
    information.
    """
    try:
        import cv2
    except ImportError:
        print(
            "Note: opencv-python is not installed, so still-frame "
            "cross-checking is disabled (video-only analysis still runs).\n"
            "For better accuracy on fine hand/face detail, install it:\n"
            "    pip install opencv-python --break-system-packages",
            file=sys.stderr,
        )
        return []

    cap = cv2.VideoCapture(str(path))
    if not cap.isOpened():
        cap.release()
        return []

    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT)) or 0
    if total_frames <= 0:
        cap.release()
        return []

    n = min(n, total_frames)
    indices = [int(round(i * (total_frames - 1) / max(1, n - 1))) for i in range(n)]

    frames = []
    for idx in indices:
        cap.set(cv2.CAP_PROP_POS_FRAMES, idx)
        ok, frame = cap.read()
        if not ok:
            continue
        ok, buf = cv2.imencode(".jpg", frame, [cv2.IMWRITE_JPEG_QUALITY, 95])
        if ok:
            frames.append(buf.tobytes())
    cap.release()
    return frames


def run_single_trial(
    client: "genai.Client",
    video_file,
    temperature: float,
    key_frames: list[bytes],
    vocab: Optional[list[str]] = None,
) -> Optional[dict]:
    """One prediction attempt. Returns parsed JSON dict, or None on failure."""
    config = types.GenerateContentConfig(
        temperature=temperature,
        response_mime_type="application/json",
        response_schema=RESPONSE_SCHEMA,
        # High detail: hand shape carries meaning, so the default media
        # resolution is not enough for reliable sign recognition.
        media_resolution="MEDIA_RESOLUTION_HIGH",
    )

    # Gemini's default is 1 frame/sec, which can blur or skip the fast
    # hand transitions that separate one sign from the next in a
    # multi-sign sentence. Sample denser (up to 24 fps max) so consecutive
    # signs don't get merged into one blurry gesture.
    video_part = types.Part(
        file_data=types.FileData(file_uri=video_file.uri, mime_type=video_file.mime_type),
        video_metadata=types.VideoMetadata(fps=VIDEO_FPS),
    )

    frame_parts = [
        types.Part(inline_data=types.Blob(data=frame_bytes, mime_type="image/jpeg"))
        for frame_bytes in key_frames
    ]

    contents = [video_part, *frame_parts, build_prompt(vocab)]
    if frame_parts:
        contents.insert(
            1,
            f"The following {len(frame_parts)} images are sharp still frames "
            "extracted evenly across the same video, for cross-checking fine "
            "handshape and contact-point detail.",
        )

    last_error = None
    for attempt in range(1, MAX_RETRIES_PER_CALL + 1):
        try:
            response = client.models.generate_content(
                model=MODEL_NAME,
                contents=contents,
                config=config,
            )
            return json.loads(response.text)
        except Exception as exc:  # network errors, transient 5xx, bad JSON
            last_error = exc
            wait = RETRY_BACKOFF_SECONDS * attempt
            print(f"  Trial attempt {attempt} failed ({exc}); retrying in {wait}s...")
            time.sleep(wait)

    print(f"  Trial failed after {MAX_RETRIES_PER_CALL} attempts: {last_error}")
    return None


def normalize(text: str) -> str:
    """Normalize a sentence for comparison across trials (voting)."""
    text = text.lower().strip()
    text = re.sub(r"[^\w\s]", "", text)
    text = re.sub(r"\s+", " ", text)
    return text


def aggregate_trials(trials: list[dict]) -> dict:
    """
    Combine multiple independent predictions into one consensus answer
    via majority voting on the overall sentence, falling back to the
    highest-confidence trial when there's no majority.
    """
    if not trials:
        raise RuntimeError("All prediction trials failed -- no result to return.")

    normalized_to_original = {}
    votes = Counter()
    for t in trials:
        sentence = t.get("overall_sentence_en", "").strip()
        key = normalize(sentence)
        votes[key] += 1
        normalized_to_original.setdefault(key, []).append(t)

    winning_key, win_count = votes.most_common(1)[0]
    winning_trials = normalized_to_original[winning_key]

    # Among trials that agree on the winning answer, keep the one Gemini
    # itself was most confident about.
    best = max(winning_trials, key=lambda t: t.get("overall_confidence", 0))

    # Collect every distinct alternate sentence seen, for transparency.
    other_candidates = [
        {
            "overall_sentence_en": normalized_to_original[k][0].get("overall_sentence_en", ""),
            "overall_sentence_ur": normalized_to_original[k][0].get("overall_sentence_ur", ""),
            "votes": v,
        }
        for k, v in votes.items()
        if k != winning_key
    ]

    agreement_rate = win_count / len(trials)

    return {
        "overall_sentence_en": best.get("overall_sentence_en", ""),
        "overall_sentence_ur": best.get("overall_sentence_ur", ""),
        "gloss_sequence": best.get("gloss_sequence", ""),
        "signs": best.get("signs", []),
        "notes": best.get("notes", ""),
        "model_reported_confidence": best.get("overall_confidence", 0),
        "trials_run": len(trials),
        "trials_agreeing": win_count,
        "agreement_rate": round(agreement_rate, 2),
        "other_candidates_seen": other_candidates,
        "reliability": (
            "high" if agreement_rate >= 0.66 and best.get("overall_confidence", 0) >= 0.7
            else "medium" if agreement_rate >= 0.5
            else "low -- consider re-recording with clearer lighting/framing"
        ),
    }


def predict(
    video_path: str,
    api_key: Optional[str] = None,
    trials: int = DEFAULT_TRIALS,
    cleanup: bool = True,
    vocab: Optional[list[str]] = None,
) -> dict:
    """
    Full pipeline: upload video, run N independent predictions, and return
    a consensus result. This is the function to import and call from other
    Python code.
    """
    path = Path(video_path)
    if not path.exists():
        raise FileNotFoundError(f"No such file: {video_path}")
    if path.suffix.lower() not in SUPPORTED_EXTENSIONS:
        raise ValueError(
            f"Unsupported file type '{path.suffix}'. "
            f"Supported: {', '.join(sorted(SUPPORTED_EXTENSIONS))}"
        )

    client = get_client(api_key)
    uploaded = upload_video(client, path)
    key_frames = extract_key_frames(path)
    if key_frames:
        print(f"Extracted {len(key_frames)} still frames for detail cross-checking.")

    try:
        results = []
        # Slightly vary temperature across trials: 0 for a deterministic
        # baseline read, then a little diversity to catch cases where a
        # single pass latches onto the wrong interpretation.
        temperatures = [0.0] + [0.3 + 0.15 * i for i in range(trials - 1)]
        for i, temp in enumerate(temperatures, start=1):
            print(f"Running trial {i}/{trials} (temperature={temp:.2f}) ...")
            result = run_single_trial(client, uploaded, temp, key_frames, vocab)
            if result:
                results.append(result)

        return aggregate_trials(results)
    finally:
        if cleanup:
            try:
                client.files.delete(name=uploaded.name)
            except Exception:
                pass  # not critical if cleanup fails


# --------------------------------------------------------------------------
# Presentation
# --------------------------------------------------------------------------

def print_report(result: dict) -> None:
    print("\n" + "=" * 60)
    print("PSL PREDICTION RESULT")
    print("=" * 60)
    print(f"Reliability: {result['reliability'].upper()}  "
          f"(agreement {result['agreement_rate']*100:.0f}% across "
          f"{result['trials_agreeing']}/{result['trials_run']} trials, "
          f"model confidence {result['model_reported_confidence']:.2f})")
    print("-" * 60)
    print(f"English : {result['overall_sentence_en']}")
    if result.get("overall_sentence_ur"):
        print(f"Urdu    : {result['overall_sentence_ur']}")
    if result.get("gloss_sequence"):
        print(f"Gloss   : {result['gloss_sequence']}  (raw sign order, before translation)")

    if result.get("signs"):
        print(f"\nSign-by-sign breakdown ({len(result['signs'])} sign(s) detected):")
        for s in result["signs"]:
            timing = ""
            if s.get("start_time_sec") is not None:
                timing = f"  [{s.get('start_time_sec', 0):.1f}s-{s.get('end_time_sec', 0):.1f}s]"
            print(f"\n  [{s.get('order')}]{timing} {s.get('predicted_meaning_en')}"
                  f"  (confidence: {s.get('confidence', 0):.2f})")
            print(f"      Handshape : {s.get('handshape', '-')}")
            print(f"      Movement  : {s.get('movement', '-')}")
            print(f"      Orientation: {s.get('palm_orientation', '-')}")
            print(f"      Location  : {s.get('location_contact', '-')}")
            if s.get("non_manual_markers"):
                print(f"      Face/body : {s.get('non_manual_markers')}")
            alts = s.get("alternate_candidates") or []
            if alts:
                print("      Alternates considered:")
                for a in alts:
                    print(f"        - {a.get('meaning_en')}: {a.get('reason', '')}")

    if result.get("other_candidates_seen"):
        print("\nOther overall interpretations seen in disagreeing trials:")
        for c in result["other_candidates_seen"]:
            print(f"  - \"{c['overall_sentence_en']}\" ({c['votes']} vote(s))")

    if result.get("notes"):
        print(f"\nNotes: {result['notes']}")
    print("=" * 60 + "\n")


def speak_result(text: str, lang: str, out_path: str) -> bool:
    """
    Synthesize the translated sentence as an MP3 so a hearing person can
    hear what the signer said, not just read it. Requires internet access
    and the gTTS package (pip install gTTS --break-system-packages).
    Returns True on success.
    """
    if not text.strip():
        print("Nothing to speak -- empty sentence.")
        return False
    try:
        from gtts import gTTS
    except ImportError:
        print(
            "To hear the sentence spoken aloud, install gTTS:\n"
            "    pip install gTTS --break-system-packages",
            file=sys.stderr,
        )
        return False

    try:
        gTTS(text=text, lang=lang).save(out_path)
        print(f"Spoken audio saved to {out_path}")
        return True
    except Exception as exc:
        print(f"Could not generate speech audio: {exc}", file=sys.stderr)
        return False


# --------------------------------------------------------------------------
# CLI
# --------------------------------------------------------------------------

def main():
    parser = argparse.ArgumentParser(
        description="Predict the meaning of Pakistan Sign Language (PSL) signs in a video."
    )
    parser.add_argument("video", help="Path to the video file (mp4, webm, mov, mkv, avi)")
    parser.add_argument(
        "--api-key",
        default=None,
        help="Gemini API key (defaults to GEMINI_API_KEY environment variable)",
    )
    parser.add_argument(
        "--trials",
        type=int,
        default=DEFAULT_TRIALS,
        help=f"Number of independent prediction passes to vote across (default: {DEFAULT_TRIALS})",
    )
    parser.add_argument(
        "--json",
        metavar="PATH",
        help="Also write the full result as JSON to this path",
    )
    parser.add_argument(
        "--keep-upload",
        action="store_true",
        help="Don't delete the uploaded video from Gemini's File API afterwards",
    )
    parser.add_argument(
        "--speak",
        metavar="OUT.mp3",
        help="Also save the translated sentence as spoken audio (requires gTTS + internet)",
    )
    parser.add_argument(
        "--speak-lang",
        default="en",
        help="Language for --speak: 'en' for English, 'ur' for Urdu (default: en)",
    )
    parser.add_argument(
        "--vocab",
        metavar="WORD1,WORD2,...",
        help=(
            "Comma-separated list of words/signs likely to appear (e.g. "
            "'salam,water,thank you,man,woman'). Narrowing the search space "
            "like this substantially improves accuracy for a known set of "
            "signs, since the model isn't guessing from scratch."
        ),
    )
    args = parser.parse_args()

    try:
        result = predict(
            args.video,
            api_key=args.api_key,
            trials=max(1, args.trials),
            cleanup=not args.keep_upload,
            vocab=args.vocab.split(",") if args.vocab else None,
        )
    except Exception as exc:
        print(f"Error: {exc}", file=sys.stderr)
        sys.exit(1)

    print_report(result)

    if args.json:
        with open(args.json, "w", encoding="utf-8") as f:
            json.dump(result, f, ensure_ascii=False, indent=2)
        print(f"Full result written to {args.json}")

    if args.speak:
        sentence = (
            result["overall_sentence_ur"]
            if args.speak_lang == "ur"
            else result["overall_sentence_en"]
        )
        speak_result(sentence, args.speak_lang, args.speak)


if __name__ == "__main__":
    main()