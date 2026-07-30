import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

import { runDreamPipeline } from "@/lib/agent/orchestrator/runDreamPipeline";
import { dreamRepository } from "@/lib/dream/fileRepository";

export const runtime = "nodejs";

const MAX_DREAM_LENGTH = 3000;

export async function POST(request: NextRequest) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Request body must be valid JSON." },
      { status: 400 },
    );
  }

  if (typeof body !== "object" || body === null) {
    return NextResponse.json(
      { error: "Request body must be a JSON object." },
      { status: 400 },
    );
  }

  if (Object.prototype.hasOwnProperty.call(body, "choice")) {
    return NextResponse.json(
      {
        error:
          "The retired path-selection flow is no longer accepted. Refresh the page and preserve the dream once.",
      },
      { status: 409 },
    );
  }

  const dreamValue = (body as { dream?: unknown }).dream;

  if (typeof dreamValue !== "string" || !dreamValue.trim()) {
    return NextResponse.json(
      { error: "Dream description is required." },
      { status: 400 },
    );
  }

  const dream = dreamValue.trim();

  if (dream.length > MAX_DREAM_LENGTH) {
    return NextResponse.json(
      {
        error: `Dream description must not exceed ${MAX_DREAM_LENGTH} characters.`,
      },
      { status: 413 },
    );
  }

  try {
    const result = await runDreamPipeline({ dream });
    const persistedDream = await dreamRepository.findById(result.dream.id);

    if (!persistedDream) {
      throw new Error("Dream save could not be confirmed.");
    }

    revalidatePath("/");
    revalidatePath("/dreams");
    revalidatePath(`/dreams/${persistedDream.id}`);

    return NextResponse.json({
      ...persistedDream,
      rememberedFragment: dream,
      imageUrl: null,
      persisted: true,
      agentTrace: result.trace,
      pipelineDurationMs: result.totalDurationMs,
    }, {
      headers: {
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Dream pipeline failed:", error);

    return NextResponse.json(
      { error: "Could not preserve the dream memory." },
      { status: 500 },
    );
  }
}
