/**
 * PSL Backend Service
 *
 * Communicates with the FastAPI backend (http://localhost:8000) to resolve
 * Urdu text into a PSL Gloss animation queue via the PSLAnimationPipeline.
 */

const BACKEND_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

/* ────────────────────────── Types ────────────────────────── */

export interface AnimationItem {
  token: string;
  type: "WORD" | "LETTER" | "WORD_SIGN" | "FINGERSPELLING";
  urdu?: string;
  english?: string;
  image_url?: string;
  asset?: string;
  duration_ms?: number;
}

export interface PSLResponse {
  input_text: string;
  source_lang?: string;
  urdu_translation?: string;
  psl_gloss: string;
  total_sequence_length: number;
  animation_queue: AnimationItem[];
}

/* ────────────────────────── API Call ────────────────────────── */

/**
 * Send English or Urdu text to the backend and receive a resolved PSL sequential sign queue.
 *
 * @param text        Raw text in English or Urdu
 * @param source_lang Optional language code: 'en' | 'ur' | 'auto'
 * @returns           Structured PSL animation payload with sequential 2s image queue
 * @throws            Error with descriptive message when backend is unreachable
 */
export async function fetchTextToPSL(text: string, source_lang: string = "auto"): Promise<PSLResponse> {
  const endpoint = `${BACKEND_BASE_URL}/api/text-to-psl`;

  let response: Response;
  try {
    response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, source_lang }),
    });
  } catch (networkError) {
    throw new Error(
      `Backend service is unreachable at ${endpoint}. ` +
        "Please ensure the FastAPI server is running (uvicorn app.main:app --port 8000)."
    );
  }

  if (!response.ok) {
    const errorBody = await response.text().catch(() => "Unknown error");
    throw new Error(
      `Backend responded with ${response.status}: ${errorBody}`
    );
  }

  const data: PSLResponse = await response.json();
  return data;
}
