import { NextRequest, NextResponse } from "next/server";
import { urduToPSLModel } from "@/app/lib/urdutopsl-model";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const text = body.text || "";

    if (!text || typeof text !== "string") {
      return NextResponse.json(
        { error: "Invalid request. 'text' field is required." },
        { status: 400 }
      );
    }

    const inferenceResult = await urduToPSLModel.infer(text);

    /* Resolve video URLs from the gloss video registry */
    const videoRegistry = await fetch(
      `${req.nextUrl.origin}/data/gloss_video_registry.json`
    ).then((r) => r.json()).catch(() => ({}));

    const videoUrls = inferenceResult.glossSequence.map(
      (gloss: string) => videoRegistry[gloss] ?? null
    );

    return NextResponse.json({
      success: true,
      model: "urdutopsl",
      data: {
        ...inferenceResult,
        video_urls: videoUrls,
      },
    });
  } catch (error: any) {
    console.error("[POST /api/translate error]:", error);
    return NextResponse.json(
      { error: "Internal translation inference error", details: error?.message },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    model: "urdutopsl",
    status: "ready",
    architecture: "Hybrid Sequence Resolver + PSL Fingerspelling Fallback",
    supportedClasses: 60,
    alphabetClasses: 36,
  });
}
