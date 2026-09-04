import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";

import { userRepository } from "@/lib/auth/fileRepository";
import { hashPassword } from "@/lib/auth/password";
import { isTestApiRequestAuthorized } from "@/lib/auth/testApi";
import type { PublicUser } from "@/lib/auth/types";

export const runtime = "nodejs";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;
const MAX_PASSWORD_LENGTH = 128;

export async function POST(request: Request) {
  if (!isTestApiRequestAuthorized(request)) {
    return NextResponse.json(
      { error: "Forbidden." },
      { status: 403 },
    );
  }

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
    !EMAIL_PATTERN.test(email.trim()) ||
    email.length > 254
  ) {
    return NextResponse.json(
      { error: "A valid email is required." },
      { status: 400 },
    );
  }

  if (
    typeof password !== "string" ||
    password.length < MIN_PASSWORD_LENGTH ||
    password.length > MAX_PASSWORD_LENGTH
  ) {
    return NextResponse.json(
      {
        error:
          "Password must contain between 8 and 128 characters.",
      },
      { status: 400 },
    );
  }

  const normalizedEmail = email.trim().toLowerCase();

  const user = {
    id: randomUUID(),
    email: normalizedEmail,
    passwordHash: await hashPassword(password),
    createdAt: new Date().toISOString(),
  };

  try {
    await userRepository.save(user);
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes("already exists")
    ) {
      return NextResponse.json(
        { error: "A user with this email already exists." },
        { status: 409 },
      );
    }

    console.error("Creating test user failed:", error);

    return NextResponse.json(
      { error: "Could not create the user." },
      { status: 500 },
    );
  }

  const publicUser: PublicUser = {
    id: user.id,
    email: user.email,
    createdAt: user.createdAt,
  };

  return NextResponse.json(
    { user: publicUser },
    { status: 201 },
  );
}
