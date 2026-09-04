import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";

import { FileUserRepository } from "../lib/auth/fileRepository.ts";
import type { StoredUser } from "../lib/auth/types.ts";

const firstUser: StoredUser = {
  id: "11111111-1111-4111-8111-111111111111",
  email: "dreamer@example.com",
  passwordHash: "test-password-hash",
  createdAt: "2026-09-04T08:00:00.000Z",
};

const duplicateEmailUser: StoredUser = {
  id: "22222222-2222-4222-8222-222222222222",
  email: firstUser.email,
  passwordHash: "another-test-password-hash",
  createdAt: "2026-09-04T08:01:00.000Z",
};

test("stores, finds, and deletes a user", async (t) => {
  const temporaryRoot = await mkdtemp(
    path.join(tmpdir(), "dream-atlas-users-"),
  );

  t.after(() =>
    rm(temporaryRoot, { force: true, recursive: true }),
  );

  const repository = new FileUserRepository(temporaryRoot);

  await repository.save(firstUser);

  assert.deepEqual(
    await repository.findById(firstUser.id),
    firstUser,
  );
  assert.deepEqual(
    await repository.findByEmail("DREAMER@EXAMPLE.COM"),
    firstUser,
  );

  await repository.delete(firstUser.id);
  await repository.delete(firstUser.id);

  assert.equal(await repository.findById(firstUser.id), null);
});

test("rejects a duplicate normalized email", async (t) => {
  const temporaryRoot = await mkdtemp(
    path.join(tmpdir(), "dream-atlas-users-"),
  );

  t.after(() =>
    rm(temporaryRoot, { force: true, recursive: true }),
  );

  const repository = new FileUserRepository(temporaryRoot);

  await repository.save(firstUser);

  await assert.rejects(
    repository.save(duplicateEmailUser),
    /already exists/i,
  );
});
