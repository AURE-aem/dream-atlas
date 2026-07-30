import assert from "node:assert/strict";
import test from "node:test";

import {
  createTourContextOptions,
  createTourLaunchOptions,
  TOUR_RECORDING_SIZE,
} from "../scripts/tour-browser-config.mjs";

test("a visible tour uses the full Chromium window without a fixed viewport", () => {
  const launchOptions = createTourLaunchOptions({
    headless: false,
    slowMotion: 760,
    executablePath: "chromium",
  });
  const contextOptions = createTourContextOptions({
    headless: false,
    noVideo: false,
    videoDirectory: "video",
  });

  assert.deepEqual(launchOptions.args, ["--start-maximized"]);
  assert.equal(launchOptions.executablePath, "chromium");
  assert.equal(contextOptions.viewport, null);
  assert.equal("deviceScaleFactor" in contextOptions, false);
  assert.deepEqual(contextOptions.recordVideo?.size, TOUR_RECORDING_SIZE);
});

test("a headless tour keeps deterministic 1280 by 720 page dimensions", () => {
  const launchOptions = createTourLaunchOptions({
    headless: true,
    slowMotion: 0,
    executablePath: "chromium",
  });
  const contextOptions = createTourContextOptions({
    headless: true,
    noVideo: true,
  });

  assert.equal(launchOptions.executablePath, "chromium");
  assert.deepEqual(contextOptions.viewport, TOUR_RECORDING_SIZE);
  assert.equal(contextOptions.deviceScaleFactor, 1);
  assert.equal("recordVideo" in contextOptions, false);
});
