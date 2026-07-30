import { NextResponse } from "next/server";

import { constellationRepository } from "@/lib/constellation/fileRepository";

export const runtime = "nodejs";

export async function GET() {
  try {
    const constellations = await constellationRepository.findAll();
    return NextResponse.json({ constellations });
  } catch (error) {
    console.error("Constellation endpoint failed:", error);
    return NextResponse.json(
      { error: "Could not load constellations." },
      { status: 500 },
    );
  }
}
