import { NextRequest, NextResponse } from "next/server";

function chunkText(text: string, maxChars = 150): string[] {
  const words = text.split(/\s+/);
  const chunks: string[] = [];
  let current: string[] = [];
  let currentLen = 0;

  for (const w of words) {
    if (currentLen + w.length + 1 > maxChars && current.length > 0) {
      chunks.push(current.join(" "));
      current = [w];
      currentLen = w.length;
    } else {
      current.push(w);
      currentLen += w.length + 1;
    }
  }
  if (current.length > 0) {
    chunks.push(current.join(" "));
  }
  return chunks.length > 0 ? chunks : [text.slice(0, maxChars)];
}

async function synthesize(text: string, lang = "ur"): Promise<NextResponse> {
  const trimmed = text.trim();
  if (!trimmed) {
    return new NextResponse("Missing text parameter", { status: 400 });
  }

  // Clean language code e.g. "ur-PK" -> "ur"
  const cleanLang = lang.includes("-") ? lang.split("-")[0].toLowerCase() : lang.toLowerCase();
  const chunks = chunkText(trimmed, 150);

  try {
    // Attempt Google TTS first
    const audioBuffers: Buffer[] = [];
    let googleSuccess = true;

    for (const chunk of chunks) {
      const encodedText = encodeURIComponent(chunk);
      const googleTtsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&tl=${encodeURIComponent(cleanLang)}&client=tw-ob&q=${encodedText}`;

      const response = await fetch(googleTtsUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          Referer: "https://translate.google.com/",
        },
      });

      if (response.ok) {
        const arr = await response.arrayBuffer();
        audioBuffers.push(Buffer.from(arr));
      } else {
        googleSuccess = false;
        break;
      }
    }

    if (googleSuccess && audioBuffers.length > 0) {
      const combined = Buffer.concat(audioBuffers);
      return new NextResponse(combined, {
        status: 200,
        headers: {
          "Content-Type": "audio/mpeg",
          "Cache-Control": "public, max-age=86400",
        },
      });
    }
  } catch (err) {
    console.warn("[TTS Route] Google TTS fetch encountered error, trying backend:", err);
  }

  // Fallback to FastAPI backend /api/tts
  try {
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://127.0.0.1:8000";
    const backendRes = await fetch(`${backendUrl}/api/tts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: trimmed, language: cleanLang }),
    });

    if (backendRes.ok) {
      const audioBuffer = await backendRes.arrayBuffer();
      const contentType = backendRes.headers.get("content-type") || "audio/mpeg";
      return new NextResponse(audioBuffer, {
        status: 200,
        headers: {
          "Content-Type": contentType,
          "Cache-Control": "public, max-age=86400",
        },
      });
    }
  } catch (err) {
    console.error("[TTS Route] Backend fallback failed:", err);
  }

  return new NextResponse("Failed to synthesize audio", { status: 502 });
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const text = searchParams.get("text") || "";
    const lang = searchParams.get("lang") || "ur";
    return await synthesize(text, lang);
  } catch (error: unknown) {
    console.error("[TTS API Route GET Error]:", error);
    return new NextResponse((error as Error)?.message || "Internal error", { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const text = body?.text || "";
    const lang = body?.language || body?.lang || "ur";
    return await synthesize(text, lang);
  } catch (error: unknown) {
    console.error("[TTS API Route POST Error]:", error);
    return new NextResponse((error as Error)?.message || "Internal error", { status: 500 });
  }
}
