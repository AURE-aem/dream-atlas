import { NextResponse } from "next/server";

import { dreamRepository } from "@/lib/dream/fileRepository";

export const runtime = "nodejs";

export async function GET() {
  try {
    const dreams = await dreamRepository.findAll();

    return NextResponse.json({
      dreams,
    });
  } catch (error) {
    console.error("Dream history endpoint failed:", error);

    return NextResponse.json(
      {
        error: "Could not load dream history.",
      },
      {
        status: 500,
      },
    );
  }
}
