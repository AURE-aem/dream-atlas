import assert from "node:assert/strict";
import test from "node:test";

import { runAgent } from "../lib/agent/runtime/runAgent.ts";

test("marks deterministic offline output as fallback when requested", async () => {
  const result = await runAgent({
    name: "Archivist.Title",
    run: async () => "A deterministic title",
    fallbackWhen: () => true,
  });

  assert.equal(result.value, "A deterministic title");
  assert.equal(result.trace.status, "fallback");
});

test("keeps deterministic infrastructure work as success", async () => {
  const result = await runAgent({
    name: "Memory.Match",
    run: async () => ({ relatedDreamIds: [] }),
  });

  assert.equal(result.trace.status, "success");
});
