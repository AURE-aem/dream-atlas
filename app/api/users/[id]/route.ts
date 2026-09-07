import { NextResponse } from "next/server";

import { userRepository } from "@/lib/auth/fileRepository";
import { isTestApiRequestAuthorized } from "@/lib/auth/testApi";

export const runtime = "nodejs";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!isTestApiRequestAuthorized(request)) {
    return NextResponse.json(
      { error: "Forbidden." },
      { status: 403 },
    );
  }

  const { id } = await params;

  if (!UUID_PATTERN.test(id)) {
    return NextResponse.json(
      { error: "Invalid user id." },
      { status: 400 },
    );
  }

  try {
    await userRepository.delete(id);

    return new Response(null, { status: 204 });
  } catch (error) {
    console.error("Deleting test user failed:", error);

    return NextResponse.json(
      { error: "Could not delete the user." },
      { status: 500 },
    );
  }
}
