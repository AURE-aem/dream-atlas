import assert from "node:assert/strict";
import test from "node:test";

import {
  getTourStepCount,
  getTourStepGuidance,
  HEADLESS_TOUR_PACE,
  VISIBLE_TOUR_PACE,
} from "../scripts/tour-presentation.mjs";

test("the visible tour keeps a calm pace without stacking long global delays", () => {
  assert.ok(VISIBLE_TOUR_PACE.slowMotion <= 70);
  assert.ok(VISIBLE_TOUR_PACE.scenePause >= 400);
  assert.ok(VISIBLE_TOUR_PACE.scenePause <= 550);
  assert.ok(VISIBLE_TOUR_PACE.routePause <= 200);
  assert.ok(VISIBLE_TOUR_PACE.cursorSteps >= 24);
});

test("headless checks remove presentation-only waiting", () => {
  assert.equal(HEADLESS_TOUR_PACE.slowMotion, 0);
  assert.ok(HEADLESS_TOUR_PACE.scenePause <= 100);
  assert.ok(HEADLESS_TOUR_PACE.routePause <= 50);
});

test("tour guidance explains the five-star constellation trace", () => {
  const guidance = getTourStepGuidance("Trace the living constellation");

  assert.match(guidance.description, /five connected stars/i);
  assert.ok(guidance.holdWeight > 0);
});

test("tour guidance explains choosing a real Atlas search result", () => {
  const guidance = getTourStepGuidance(
    "Search and choose a returning motif",
  );

  assert.match(guidance.description, /choosing one focuses its star/i);
});

test("tour guidance names both interactive Dream Memory gestures", () => {
  assert.match(
    getTourStepGuidance("Wander across the Dream Memory").description,
    /drag/i,
  );
  assert.match(
    getTourStepGuidance("Try the Dream Memory controls").description,
    /lower-right corner/i,
  );
});

test("the presentation progress matches both regression tours", () => {
  assert.equal(getTourStepCount("empty"), 10);
  assert.equal(getTourStepCount("demo"), 10);
  assert.equal(getTourStepCount("llm"), 10);
});
