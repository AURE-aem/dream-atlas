import assert from "node:assert/strict";
import test from "node:test";

import {
  ATLAS_MEMORY_OPEN_LINK_TEST_ID,
  ATLAS_MEMORY_PANEL_TEST_ID,
  isRectFullyInsideViewport,
} from "../lib/atlas/tour-contract.mjs";

test("the Atlas tour uses stable memory preview identifiers", () => {
  assert.equal(ATLAS_MEMORY_PANEL_TEST_ID, "atlas-memory-panel");
  assert.equal(ATLAS_MEMORY_OPEN_LINK_TEST_ID, "atlas-memory-open-link");
});

test("accepts a memory preview that is fully inside the tour viewport", () => {
  assert.equal(
    isRectFullyInsideViewport(
      { x: 32, y: 512, width: 352, height: 176 },
      { width: 1280, height: 720 },
    ),
    true,
  );
});

test("rejects a memory preview clipped below the tour viewport", () => {
  assert.equal(
    isRectFullyInsideViewport(
      { x: 32, y: 560, width: 352, height: 176 },
      { width: 1280, height: 720 },
    ),
    false,
  );
});
