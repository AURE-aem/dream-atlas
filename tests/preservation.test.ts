import assert from "node:assert/strict";
import test from "node:test";

import {
  getRemainingPreservationTime,
  MIN_PRESERVATION_VISIBLE_MS,
} from "../lib/dream/preservation.ts";

test("keeps the automatic preservation view visible for a stable interval", () => {
  assert.equal(
    getRemainingPreservationTime({
      startedAt: 100,
      minimumDurationMs: MIN_PRESERVATION_VISIBLE_MS,
      now: () => 350,
    }),
    2350,
  );

  assert.equal(
    getRemainingPreservationTime({
      startedAt: 100,
      minimumDurationMs: MIN_PRESERVATION_VISIBLE_MS,
      now: () => 4000,
    }),
    0,
  );
});
