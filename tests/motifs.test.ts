import assert from "node:assert/strict";
import test from "node:test";

import {
  createPlayfulInterpretationFallback,
  rankRecurringMotifs,
} from "../lib/dream/motifs.ts";
import type { GeneratedDream } from "../types/dream.ts";

function dream(
  id: string,
  symbols: Array<{ symbol: string; count: number }>,
): GeneratedDream {
  return {
    id,
    createdAt: "2026-07-29T12:00:00.000Z",
    title: "A remembered dream",
    narration: "A preserved scene.",
    imagePrompt: "A quiet dreamscape.",
    originalDream: "A remembered fragment.",
    recurringSymbols: symbols,
    observation: "Only visible details are described.",
    risk: "none",
  };
}

test("ranks motifs by dream recurrence before raw occurrence count", () => {
  const motifs = rankRecurringMotifs({
    currentSymbols: [
      { symbol: "water", count: 1 },
      { symbol: "moon", count: 6 },
    ],
    previousDreams: [
      dream("11111111-1111-4111-8111-111111111111", [
        { symbol: "water", count: 2 },
        { symbol: "door", count: 1 },
      ]),
      dream("22222222-2222-4222-8222-222222222222", [
        { symbol: "water", count: 1 },
        { symbol: "door", count: 3 },
      ]),
    ],
  });

  assert.deepEqual(
    motifs.map(({ symbol, dreamCount }) => ({ symbol, dreamCount })),
    [
      { symbol: "water", dreamCount: 3 },
      { symbol: "door", dreamCount: 2 },
    ],
  );
});

test("creates a safe playful fallback from deterministic motifs", () => {
  const interpretation = createPlayfulInterpretationFallback([
    { symbol: "water", dreamCount: 3, totalCount: 5 },
    { symbol: "door", dreamCount: 2, totalCount: 2 },
  ]);

  assert.equal(interpretation.source, "fallback");
  assert.deepEqual(interpretation.motifs, ["water", "door"]);
  assert.match(interpretation.text, /playful reading/i);
  assert.doesNotMatch(interpretation.text, /diagnos/i);
});
