import { cookies } from "next/headers";

import { userRepository } from "@/lib/auth/fileRepository";
import {
  createSessionToken,
  SESSION_MAX_AGE_SECONDS,
  verifySessionToken,
} from "@/lib/auth/sessionToken";
import type { PublicUser } from "@/lib/auth/types";

export const SESSION_COOKIE_NAME = "dream_atlas_session";

function getSessionCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    maxAge: SESSION_MAX_AGE_SECONDS,
    path: "/",
  };
}

export async function createSession(
  userId: string,
): Promise<void> {
  const cookieStore = await cookies();

  cookieStore.set(
    SESSION_COOKIE_NAME,
    createSessionToken(userId),
    getSessionCookieOptions(),
  );
}

export async function deleteSession(): Promise<void> {
  const cookieStore = await cookies();

  cookieStore.delete(SESSION_COOKIE_NAME);
}

export async function getCurrentUser(): Promise<PublicUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  const session = verifySessionToken(token);

  if (!session) {
    return null;
  }

  const user = await userRepository.findById(session.userId);

  if (!user) {
    return null;
  }

  return {
    id: user.id,
    email: user.email,
    createdAt: user.createdAt,
  };
}
