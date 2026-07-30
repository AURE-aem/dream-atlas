import { NextResponse } from "next/server";

import { dreamRepository } from "@/lib/dream/fileRepository";

export const runtime = "nodejs";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  if (!UUID_PATTERN.test(id)) {
    return NextResponse.json({ error: "Invalid dream id." }, { status: 400 });
  }

  try {
    const dream = await dreamRepository.findById(id);

    if (!dream) {
      return NextResponse.json({ error: "Dream not found." }, { status: 404 });
    }

    return NextResponse.json(dream);
  } catch (error) {
    console.error("Dream detail endpoint failed:", error);

    return NextResponse.json(
      { error: "Could not load the dream." },
      { status: 500 },
    );
  }
}
