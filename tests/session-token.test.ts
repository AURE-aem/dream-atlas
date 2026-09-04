import assert from "node:assert/strict";
import test from "node:test";

import {
  createSessionToken,
  SESSION_MAX_AGE_SECONDS,
  verifySessionToken,
} from "../lib/auth/sessionToken.ts";

const USER_ID = "11111111-1111-4111-8111-111111111111";
const NOW = Date.parse("2026-09-04T08:00:00.000Z");
const TEST_SECRET =
  "test-session-secret-with-at-least-32-characters";

const originalSessionSecret = process.env.SESSION_SECRET;

test.before(() => {
  process.env.SESSION_SECRET = TEST_SECRET;
});

test.after(() => {
  if (originalSessionSecret === undefined) {
    delete process.env.SESSION_SECRET;
  } else {
    process.env.SESSION_SECRET = originalSessionSecret;
  }
});

test("creates and verifies a valid session token", () => {
  const token = createSessionToken(USER_ID, NOW);

  assert.deepEqual(
    verifySessionToken(token, NOW),
    {
      userId: USER_ID,
      expiresAt: NOW + SESSION_MAX_AGE_SECONDS * 1000,
    },
  );
});

test("rejects a modified session token", () => {
  const token = createSessionToken(USER_ID, NOW);
  const [payload, signature] = token.split(".");
  const modifiedPayload = `${payload.slice(0, -1)}A`;

  assert.equal(
    verifySessionToken(
      `${modifiedPayload}.${signature}`,
      NOW,
    ),
    null,
  );
});

test("rejects an expired session token", () => {
  const token = createSessionToken(USER_ID, NOW);
  const afterExpiration =
    NOW + SESSION_MAX_AGE_SECONDS * 1000 + 1;

  assert.equal(
    verifySessionToken(token, afterExpiration),
    null,
  );
});

test("rejects a token signed with another secret", () => {
  const token = createSessionToken(USER_ID, NOW);

  process.env.SESSION_SECRET =
    "different-session-secret-with-32-characters";

  try {
    assert.equal(verifySessionToken(token, NOW), null);
  } finally {
    process.env.SESSION_SECRET = TEST_SECRET;
  }
});
