import assert from "node:assert/strict";
import test from "node:test";

import {
  hashPassword,
  verifyPassword,
} from "../lib/auth/password.ts";

test("hashes and verifies the correct password", async () => {
  const password = "Dreamer123!";
  const passwordHash = await hashPassword(password);

  assert.match(passwordHash, /^scrypt:/);
  assert.doesNotMatch(passwordHash, new RegExp(password));
  assert.equal(
    await verifyPassword(password, passwordHash),
    true,
  );
});

test("rejects an incorrect password", async () => {
  const passwordHash = await hashPassword("Dreamer123!");

  assert.equal(
    await verifyPassword("WrongPassword123!", passwordHash),
    false,
  );
});

test("uses a different salt for identical passwords", async () => {
  const firstHash = await hashPassword("Dreamer123!");
  const secondHash = await hashPassword("Dreamer123!");

  assert.notEqual(firstHash, secondHash);
});

test("rejects invalid hashes and empty passwords", async () => {
  assert.equal(
    await verifyPassword("Dreamer123!", "invalid-hash"),
    false,
  );

  await assert.rejects(
    hashPassword(""),
    /must not be empty/i,
  );
});
