import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

/* Models to try in order — fast flash models with broad free quota */
const MODELS = ["gemini-2.0-flash", "gemini-2.5-flash", "gemini-1.5-flash", "gemini-3.6-flash"] as const;

/* ── System instruction for the PSL Tutor ── */

function buildSystemInstruction(level: number): string {
  return `You are PSL-Tutor, an encouraging, expert Pakistan Sign Language (PSL) AI instructor.

LESSON DELIVERY RULES:
1. Teach concepts step-by-step based on the user's selected Level (${level} out of 4).
2. CRITICAL: Teach ONLY ONE concept or sign per response. Never mix two different signs (e.g. do NOT teach both a letter AND a greeting in the same message). Focus on one thing, explain it, then wait for the user before moving on.
3. For every concept or vocabulary word taught, provide a clear 1-sentence physical hand movement description in 'hand_description'.
4. Extract canonical uppercase PSL gloss tokens in 'gloss_tokens' (e.g. ['HELLO'], ['WATER'], ['LETTER_A']) so the 3D avatar player can demonstrate them. Use underscores for multi-word glosses. Only include tokens for the ONE concept being taught.
5. Periodically test the user with short interactive quizzes by populating 'quiz_options' (2-4 short answer choices). Leave empty when not quizzing.
6. Keep responses concise (2-4 sentences max in tutor_reply).
7. Be encouraging and use simple language suitable for beginners.
8. When the user answers a quiz correctly, praise them and move to the next concept. When wrong, explain the correct answer gently.

CURRICULUM LEVELS:
- Level 1: Fingerspelling (Urdu alphabet ا to ی), basic greetings (Salam, Shukriya), hand shapes (fist, open, point).
- Level 2: Emergencies (Madad, Hospital, Doctor), food/water (Khana, Pani), basic questions (Kaise hain?).
- Level 3: PSL word order, facial expressions, removing spoken filler words.
- Level 4: Reverse translation (PSL to Urdu), speed quizzes, real-world scenario practice.

AVAILABLE GLOSS TOKENS (use ONLY these for gloss_tokens):
HELLO, THANK_YOU, HOW_ARE_YOU, MY_NAME, WATER, EAT, PAKISTAN, GO, WHERE, YOU,
WELCOME, HOSPITAL, DOCTOR, GOODBYE, YES, NO, FRIEND, SCHOOL, PLEASE_HELP,
LETTER_A, LETTER_B, LETTER_C, LETTER_D, LETTER_E, LETTER_F, LETTER_G, LETTER_H,
LETTER_I, LETTER_J, LETTER_K, LETTER_L, LETTER_M, LETTER_N, LETTER_O, LETTER_P,
LETTER_Q, LETTER_R, LETTER_S, LETTER_T, LETTER_U, LETTER_V, LETTER_W, LETTER_X,
LETTER_Y, LETTER_Z, MY, NAME, I, WANT, WHAT, HOW, IS, NEAR, OF, HEALTH, SORRY, PLEASE

OUTPUT FORMAT — You MUST respond with valid JSON matching this exact schema:
{
  "tutor_reply": "Your teaching message (markdown OK, 2-4 sentences)",
  "gloss_tokens": ["ARRAY", "OF", "UPPERCASE_GLOSS_TOKENS"],
  "hand_description": "One sentence describing the physical hand movement for the sign",
  "current_level": ${level},
  "quiz_options": ["optional", "quiz", "choices"]
}`;
}

/* ── Call Gemini with retry + model fallback ── */

async function callGemini(
  contents: { role: "user" | "model"; parts: { text: string }[] }[],
  systemInstruction: string,
): Promise<string> {
  let lastError: Error | null = null;

  for (const model of MODELS) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents,
          config: {
            systemInstruction,
            responseMimeType: "application/json",
            temperature: 0.7,
            maxOutputTokens: 1024,
          },
        });

        const text = response.text;
        if (!text) {
          throw new Error("No text response from Gemini");
        }
        return text;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        lastError = err instanceof Error ? err : new Error(msg);

        /* Detect 429 rate-limit and 503 high-demand errors */
        const isRetryable = msg.includes("429") || msg.includes("RESOURCE_EXHAUSTED") || msg.includes("503") || msg.includes("UNAVAILABLE");
        if (isRetryable && attempt === 0) {
          /* Extract retry delay from the error message */
          const retryMatch = msg.match(/retry in (\d+)/);
          const delaySec = retryMatch ? Math.min(parseInt(retryMatch[1], 10), 30) : 5;
          console.warn(`[Tutor API] 429 on ${model}, retrying in ${delaySec}s...`);
          await new Promise((r) => setTimeout(r, delaySec * 1000));
          continue; // retry same model
        }

        /* Non-429 error or second 429 — try next model */
        console.warn(`[Tutor API] ${model} failed (attempt ${attempt + 1}): ${msg.substring(0, 100)}`);
        break;
      }
    }
  }

  throw lastError ?? new Error("All models failed");
}

/* ── POST /api/tutor ── */

export async function POST(req: NextRequest) {
  try {
    const { message, level, history } = await req.json();

    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { error: "Invalid request. 'message' field is required." },
        { status: 400 },
      );
    }

    const currentLevel = level ?? 1;
    const systemInstruction = buildSystemInstruction(currentLevel);

    /* Build conversation contents for Gemini */
    const contents: { role: "user" | "model"; parts: { text: string }[] }[] = [];

    /* Replay history */
    if (Array.isArray(history)) {
      for (const h of history) {
        contents.push({
          role: h.role === "model" ? "model" : "user",
          parts: [{ text: h.parts[0]?.text ?? "" }],
        });
      }
    }

    /* Add the current user message */
    contents.push({ role: "user", parts: [{ text: message }] });

    const text = await callGemini(contents, systemInstruction);

    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(text);
    } catch {
      console.error("[Gemini raw response]:", text.substring(0, 300));
      throw new Error("Gemini returned invalid JSON");
    }

    /* Validate & sanitize the response */
    const safeResponse = {
      tutor_reply: parsed.tutor_reply ?? "Let's continue learning!",
      gloss_tokens: Array.isArray(parsed.gloss_tokens) ? parsed.gloss_tokens : [],
      hand_description: parsed.hand_description ?? "",
      current_level: parsed.current_level ?? currentLevel,
      quiz_options: Array.isArray(parsed.quiz_options) ? parsed.quiz_options : [],
    };

    return NextResponse.json(safeResponse);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.error("[POST /api/tutor error]:", msg);

    /* Return a friendlier message for quota errors */
    const isQuota = msg.includes("429") || msg.includes("RESOURCE_EXHAUSTED");
    if (isQuota) {
      return NextResponse.json(
        {
          error: "Tutor API error",
          details: "Gemini free tier limit reached (20 requests/day). Please wait a minute and try again, or upgrade your API plan.",
        },
        { status: 429 },
      );
    }

    return NextResponse.json(
      { error: "Tutor API error", details: msg },
      { status: 500 },
    );
  }
}

export async function GET() {
  return NextResponse.json({
    service: "PSL Tutor",
    models: MODELS,
    status: "ready",
    levels: 4,
  });
}
