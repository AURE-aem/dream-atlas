import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const tourSource = await readFile(
  new URL("../scripts/tour-dream-atlas.mjs", import.meta.url),
  "utf8",
);
const atlasSource = await readFile(
  new URL("../components/DreamAtlas.tsx", import.meta.url),
  "utf8",
);
const boardSource = await readFile(
  new URL("../components/memory/DreamMemoryBoard.tsx", import.meta.url),
  "utf8",
);
const memorySource = await readFile(
  new URL("../app/dreams/[id]/page.tsx", import.meta.url),
  "utf8",
);

test("the tour creates only its original browser context", () => {
  assert.equal(tourSource.match(/browser\.newContext\(/g)?.length, 1);
  assert.doesNotMatch(tourSource, /keepReviewPageOpen/);
});

test("the Atlas exposes a stable clickable search-result contract", () => {
  assert.match(atlasSource, /data-testid="atlas-search-result"/);
  assert.match(atlasSource, /data-dream-id=\{node\.id\}/);
  assert.match(atlasSource, /setPinnedNodeId\(id\)/);
  assert.match(tourSource, /Search and choose a returning motif/);
});

test("the Dream Memory exposes stable board and Atlas navigation contracts", () => {
  assert.match(boardSource, /data-testid="memory-board-viewport"/);
  assert.match(boardSource, /data-testid="memory-board-surface"/);
  assert.match(boardSource, /surface\.dataset\.viewY/);
  assert.match(memorySource, /data-testid="dream-memory-find-in-atlas"/);
  assert.match(tourSource, /Find this memory in the Atlas/);
});
