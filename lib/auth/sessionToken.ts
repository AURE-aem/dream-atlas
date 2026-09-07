import {
  createHmac,
  timingSafeEqual,
} from "node:crypto";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 8;

type SessionPayload = {
  userId: string;
  expiresAt: number;
};

function getSessionSecret(): string {
  const secret = process.env.SESSION_SECRET?.trim();

  if (!secret || secret.length < 32) {
    throw new Error(
      "SESSION_SECRET must contain at least 32 characters.",
    );
  }

  return secret;
}

function signPayload(payload: string): string {
  return createHmac("sha256", getSessionSecret())
    .update(payload)
    .digest("base64url");
}

function isSessionPayload(
  value: unknown,
): value is SessionPayload {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const payload = value as Partial<SessionPayload>;

  return (
    typeof payload.userId === "string" &&
    UUID_PATTERN.test(payload.userId) &&
    typeof payload.expiresAt === "number" &&
    Number.isFinite(payload.expiresAt)
  );
}

export function createSessionToken(
  userId: string,
  now = Date.now(),
): string {
  if (!UUID_PATTERN.test(userId)) {
    throw new Error("Invalid session user id.");
  }

  const payload: SessionPayload = {
    userId,
    expiresAt:
      now + SESSION_MAX_AGE_SECONDS * 1000,
  };

  const encodedPayload = Buffer.from(
    JSON.stringify(payload),
    "utf8",
  ).toString("base64url");

  const signature = signPayload(encodedPayload);

  return `${encodedPayload}.${signature}`;
}

export function verifySessionToken(
  token: string,
  now = Date.now(),
): SessionPayload | null {
  const [encodedPayload, signature, ...extraParts] =
    token.split(".");

  if (
    !encodedPayload ||
    !signature ||
    extraParts.length > 0
  ) {
    return null;
  }

  const expectedSignature = Buffer.from(
    signPayload(encodedPayload),
    "base64url",
  );
  const receivedSignature = Buffer.from(
    signature,
    "base64url",
  );

  if (
    expectedSignature.length !== receivedSignature.length ||
    !timingSafeEqual(
      expectedSignature,
      receivedSignature,
    )
  ) {
    return null;
  }

  let parsedPayload: unknown;

  try {
    parsedPayload = JSON.parse(
      Buffer.from(encodedPayload, "base64url").toString("utf8"),
    );
  } catch {
    return null;
  }

  if (
    !isSessionPayload(parsedPayload) ||
    parsedPayload.expiresAt <= now
  ) {
    return null;
  }

  return parsedPayload;
}
