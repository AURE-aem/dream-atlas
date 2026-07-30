import assert from "node:assert/strict";
import test from "node:test";

import {
  ensureVerbatimDreamCore,
  getDreamNarrationParts,
} from "../lib/dream/narration.ts";

test("injects the original dream verbatim when AI narration paraphrases it", () => {
  const original =
    'I saw a BLUE door marked "7"; it would not open — even when I knocked.';
  const result = ensureVerbatimDreamCore(
    "You return to a numbered door beneath a quiet sky.",
    original,
  );

  assert.ok(result.includes(original));
  assert.equal(result.split(original).length - 1, 1);
});

test("never rewrites an exact core already present in the narration", () => {
  const original = "Śniło mi się światło nad rzeką.";
  const narration = `“${original}” The river keeps moving beneath the light.`;

  assert.equal(ensureVerbatimDreamCore(narration, original), narration);
});

test("separates the immutable core from the AI-shaped surroundings", () => {
  const original = "A silver bird waited on my windowsill.";
  const parts = getDreamNarrationParts(
    `You remember it exactly: “${original}” The room beyond it softened into mist.`,
    original,
  );

  assert.equal(parts.core, original);
  assert.equal(
    parts.surrounding,
    "The room beyond it softened into mist.",
  );
});
