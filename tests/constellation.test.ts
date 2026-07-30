import assert from "node:assert/strict";
import test from "node:test";

import {
  materializeConstellation,
  planConstellation,
} from "../lib/constellation/weave.ts";
import type { Constellation, GeneratedDream } from "../types/dream.ts";

function dream(id: string, symbols: string[]): GeneratedDream {
  return {
    id,
    createdAt: "2026-07-29T12:00:00.000Z",
    title: `Dream ${id.slice(0, 4)}`,
    narration: "A preserved scene.",
    imagePrompt: "A quiet dreamscape.",
    originalDream: "A remembered fragment.",
    recurringSymbols: symbols.map((symbol) => ({ symbol, count: 1 })),
    observation: "Only visible details are described.",
    risk: "none",
  };
}

const ids = {
  current: "11111111-1111-4111-8111-111111111111",
  waterOne: "22222222-2222-4222-8222-222222222222",
  waterTwo: "33333333-3333-4333-8333-333333333333",
  forest: "44444444-4444-4444-8444-444444444444",
  constellation: "55555555-5555-4555-8555-555555555555",
};

test("creates a constellation only after a motif returns across three memories", () => {
  const plan = planConstellation({
    newDream: dream(ids.current, ["water", "moon"]),
    previousDreams: [
      dream(ids.waterOne, ["water"]),
      dream(ids.waterTwo, ["water", "depth"]),
      dream(ids.forest, ["forest"]),
    ],
    constellations: [],
  });

  assert.ok(plan);
  assert.equal(plan.insight.type, "new_constellation");
  assert.deepEqual(plan.insight.motifs, ["water"]);
  assert.deepEqual(plan.insight.dreamIds, [
    ids.current,
    ids.waterOne,
    ids.waterTwo,
  ]);
});

test("does not invent a constellation from one earlier echo", () => {
  const plan = planConstellation({
    newDream: dream(ids.current, ["water"]),
    previousDreams: [dream(ids.waterOne, ["water"])],
    constellations: [],
  });

  assert.equal(plan, undefined);
});

test("strengthens an existing constellation and preserves its identity", () => {
  const existing: Constellation = {
    id: ids.constellation,
    createdAt: "2026-07-01T12:00:00.000Z",
    updatedAt: "2026-07-20T12:00:00.000Z",
    name: "The Returning Tide",
    summary: "Water returned.",
    motifs: ["water", "depth"],
    dreamIds: [ids.waterOne, ids.waterTwo],
    strength: 2,
    confidence: 0.82,
  };
  const plan = planConstellation({
    newDream: dream(ids.current, ["water", "moon"]),
    previousDreams: [dream(ids.waterOne, ["water"])],
    constellations: [existing],
  });

  assert.ok(plan);
  assert.equal(plan.insight.type, "strengthened_constellation");
  assert.equal(plan.insight.constellationId, existing.id);

  const saved = materializeConstellation(
    plan,
    plan.insight,
    "2026-07-29T13:00:00.000Z",
  );
  assert.equal(saved.id, existing.id);
  assert.equal(saved.createdAt, existing.createdAt);
  assert.equal(saved.updatedAt, "2026-07-29T13:00:00.000Z");
  assert.equal(saved.strength, 3);
  assert.ok(saved.dreamIds.includes(ids.current));
});
