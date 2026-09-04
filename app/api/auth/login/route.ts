import { NextResponse } from "next/server";

import { userRepository } from "@/lib/auth/fileRepository";
import {
  hashPassword,
  verifyPassword,
} from "@/lib/auth/password";
import { createSession } from "@/lib/auth/session";
import type { PublicUser } from "@/lib/auth/types";

export const runtime = "nodejs";

function unauthorizedResponse() {
  return NextResponse.json(
    { error: "Invalid email or password." },
    { status: 401 },
  );
}

export async function POST(request: Request) {
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

  const { email, password } = body as {
    email?: unknown;
    password?: unknown;
  };

  if (
    typeof email !== "string" ||
    typeof password !== "string" ||
    !email.trim() ||
    !password
  ) {
    return unauthorizedResponse();
  }

  const normalizedEmail = email.trim().toLowerCase();

  let user;

  try {
    user = await userRepository.findByEmail(normalizedEmail);
  } catch (error) {
    console.error("Finding login user failed:", error);

    return NextResponse.json(
      { error: "Could not complete login." },
      { status: 500 },
    );
  }

  if (!user) {
    await hashPassword(password);
    return unauthorizedResponse();
  }

  const passwordIsValid = await verifyPassword(
    password,
    user.passwordHash,
  );

  if (!passwordIsValid) {
    return unauthorizedResponse();
  }

  await createSession(user.id);

  const publicUser: PublicUser = {
    id: user.id,
    email: user.email,
    createdAt: user.createdAt,
  };

  return NextResponse.json({ user: publicUser });
}