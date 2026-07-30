import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";

import { FileDreamRepository } from "../lib/dream/fileRepository.ts";
import type { GeneratedDream } from "../types/dream.ts";

const ids = [
  "11111111-1111-4111-8111-111111111111",
  "22222222-2222-4222-8222-222222222222",
] as const;

function dream(id: string, createdAt: string, originalDream: string): GeneratedDream {
  return {
    id,
    createdAt,
    title: `Dream ${id.slice(0, 4)}`,
    narration: `“${originalDream}” The remembered scene remains nearby.`,
    imagePrompt: "A quiet dreamscape.",
    originalDream,
    recurringSymbols: [{ symbol: "light", count: 1 }],
    observation: "A light remains visible in the scene.",
    risk: "none",
  };
}

test("persists two consecutive manual dreams as two readable records", async (t) => {
  const temporaryRoot = await mkdtemp(
    path.join(tmpdir(), "dream-atlas-repository-"),
  );
  t.after(() => rm(temporaryRoot, { force: true, recursive: true }));

  const repository = new FileDreamRepository(
    path.join(temporaryRoot, "dreams"),
  );
  const first = dream(
    ids[0],
    "2026-07-30T08:00:00.000Z",
    "A silver bird waited by the lake.",
  );
  const second = dream(
    ids[1],
    "2026-07-30T08:01:00.000Z",
    "Blue lamps floated between the trees.",
  );

  await repository.save(first);
  await repository.save(second);

  const stored = await repository.findAll();
  assert.equal(stored.length, 2);
  assert.deepEqual(
    stored.map(({ id }) => id),
    [second.id, first.id],
  );
  assert.deepEqual(await repository.findById(first.id), first);
  assert.deepEqual(await repository.findById(second.id), second);
});
