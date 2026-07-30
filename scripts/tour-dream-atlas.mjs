import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createServer } from "node:net";
import {
  mkdir,
  mkdtemp,
  rm,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import { chromium } from "playwright";

import {
  ATLAS_MEMORY_OPEN_LINK_TEST_ID,
  ATLAS_MEMORY_PANEL_TEST_ID,
  isRectFullyInsideViewport,
} from "../lib/atlas/tour-contract.mjs";
import {
  createTourContextOptions,
  createTourLaunchOptions,
} from "./tour-browser-config.mjs";
import { materializeDreamLibrarySource } from "./dream-library-path.mjs";
import {
  warmRoute,
  warmTourRoutes,
} from "./tour-route-warmup.mjs";
import {
  getTourStepCount,
  getTourStepGuidance,
  HEADLESS_TOUR_PACE,
  VISIBLE_TOUR_PACE,
} from "./tour-presentation.mjs";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectDirectory = path.resolve(scriptDirectory, "..");
const argumentsList = process.argv.slice(2);
const mode = argumentsList.find((argument) => !argument.startsWith("--")) ?? "empty";
const headless = argumentsList.includes("--headless");
const noVideo = argumentsList.includes("--no-video");
const keepData = argumentsList.includes("--keep-data");
const defaultPace = headless ? HEADLESS_TOUR_PACE : VISIBLE_TOUR_PACE;
const slowMotion = readNumberArgument("--slow-mo", defaultPace.slowMotion);
const scenePause = readNumberArgument("--scene-pause", defaultPace.scenePause);
const routePause = readNumberArgument("--route-pause", defaultPace.routePause);
const cursorSteps = readNumberArgument(
  "--cursor-steps",
  defaultPace.cursorSteps,
);
const cueLead = headless ? 0 : Math.min(360, Math.round(scenePause * 0.26));
const explicitLibrary = readStringArgument("--demo-library");
const supportedModes = new Set(["empty", "demo", "llm"]);

if (!supportedModes.has(mode)) {
  throw new Error("Tour mode must be one of: empty, demo, llm.");
}

const tourStepTotal = getTourStepCount(mode);

if (mode === "llm" && !process.env.OPENAI_API_KEY) {
  throw new Error(
    "The LLM tour needs OPENAI_API_KEY in your local terminal environment.",
  );
}

const runTimestamp = new Date().toISOString().replaceAll(/[:.]/g, "-");
const reportDirectory = path.join(
  projectDirectory,
  "tour-results",
  `${runTimestamp}-${mode}`,
);
const isolatedRoot = await mkdtemp(
  path.join(tmpdir(), `dream-atlas-${mode}-tour-`),
);
const isolatedDataDirectory = path.join(isolatedRoot, "data");
const port = await reserveAvailablePort();
const baseUrl = `http://127.0.0.1:${port}`;
const checkpoints = [];
const browserProblems = [];
const videoFileName = `dream-atlas-${mode}-tour.webm`;
const videoPath = path.join(reportDirectory, videoFileName);
let server;
let browser;
let context;
let page;
let recordedVideo;
let recordingSaved = false;
let preservedResponse;
let observedViewport;
let failureScreenshot;
let tourStartedAt;

try {
  await mkdir(reportDirectory, { recursive: true });

  if (mode === "demo") {
    const librarySource = await materializeDreamLibrarySource(
      explicitLibrary ?? "Dream-Atlas-Demo-Dream-Library-v1",
      { cwd: projectDirectory, temporaryRoot: isolatedRoot },
    );
    try {
      console.log(`Using demo library: ${librarySource.sourcePath}`);
      await runNodeScript("scripts/import-dream-library.mjs", [
        librarySource.directory,
        "--force",
      ]);
    } finally {
      await librarySource.cleanup();
    }
  } else {
    await Promise.all([
      mkdir(path.join(isolatedDataDirectory, "dreams"), { recursive: true }),
      mkdir(path.join(isolatedDataDirectory, "constellations"), {
        recursive: true,
      }),
    ]);
  }

  // Turbopack's development persistence can retain route artifacts between
  // isolated tours and occasionally answer a valid dynamic memory route with
  // a stale 404. A clean generated cache is cheaper than a 60-second timeout
  // and never touches application source or user data.
  await runNodeScript("scripts/clean-next.mjs", []);
  server = startApplicationServer();
  await waitForApplication(baseUrl);
  await warmTourRoutes(baseUrl, { includeDemoMemory: mode === "demo" });

  browser = await chromium.launch(
    createTourLaunchOptions({
      headless,
      slowMotion,
      executablePath:
        process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ??
        chromium.executablePath(),
    }),
  );
  context = await browser.newContext(
    createTourContextOptions({
      headless,
      noVideo,
      videoDirectory: path.join(isolatedRoot, "video"),
    }),
  );
  await installTourEffects(context);
  page = await context.newPage();
  recordedVideo = page.video();
  tourStartedAt = Date.now();
  page.setDefaultTimeout(mode === "llm" ? 180_000 : 60_000);
  observedViewport = await page.evaluate(() => ({
    width: window.innerWidth,
    height: window.innerHeight,
  }));

  console.log(
    `Tour pace: ${slowMotion} ms action rhythm · ${scenePause} ms scene base · ${routePause} ms route settle${noVideo ? "" : " · video on"}`,
  );
  console.log(
    `Browser viewport: ${observedViewport.width}×${observedViewport.height}${headless ? " fixed" : " · fitted to the visible window"}`,
  );

  page.on("pageerror", (error) => {
    browserProblems.push(`Page error: ${error.message}`);
  });
  page.on("requestfailed", (request) => {
    if (request.url().startsWith(baseUrl)) {
      browserProblems.push(
        `Request failed: ${request.method()} ${request.url()} — ${request.failure()?.errorText ?? "unknown error"}`,
      );
    }
  });

  if (mode === "demo") {
    await tourDemoAtlas(page);
  } else {
    await tourNewAtlas(page, { llm: mode === "llm" });
  }

  assert.deepEqual(browserProblems, []);
  const durationMs = Date.now() - tourStartedAt;
  await context.close();
  context = undefined;
  if (recordedVideo) {
    await recordedVideo.saveAs(videoPath);
    recordingSaved = true;
  }

  await writeFile(
    path.join(reportDirectory, "report.json"),
    JSON.stringify(
      {
        mode,
        status: "passed",
        completedAt: new Date().toISOString(),
        checkpoints,
        video: recordedVideo ? videoFileName : null,
        browserViewport: observedViewport,
        durationMs,
      },
      null,
      2,
    ),
    "utf8",
  );

  console.log(`\n✓ Tour ${mode} completed without errors.`);
  console.log(`  Presentation: ${formatDuration(durationMs)}`);
  console.log(`  Report: ${reportDirectory}`);
  if (recordedVideo) console.log(`  Video: ${videoPath}`);
} catch (error) {
  if (page && !page.isClosed()) {
    await page
      .screenshot({
        path: path.join(reportDirectory, "tour-stopped-here.png"),
        animations: "allow",
      })
      .then(() => {
        failureScreenshot = "tour-stopped-here.png";
      })
      .catch(() => undefined);
  }
  await context?.close().catch(() => undefined);
  context = undefined;
  if (recordedVideo && !recordingSaved) {
    const failedVideoPath = path.join(
      reportDirectory,
      `dream-atlas-${mode}-tour-failed.webm`,
    );
    await recordedVideo
      .saveAs(failedVideoPath)
      .then(() => {
        recordingSaved = true;
      })
      .catch(() => undefined);
  }
  await writeFile(
    path.join(reportDirectory, "report.json"),
    JSON.stringify(
      {
        mode,
        status: "failed",
        completedAt: new Date().toISOString(),
        error: error instanceof Error ? error.message : String(error),
        browserProblems,
        checkpoints,
        browserViewport: observedViewport,
        failureScreenshot: failureScreenshot ?? null,
        durationMs: tourStartedAt ? Date.now() - tourStartedAt : null,
      },
      null,
      2,
    ),
    "utf8",
  ).catch(() => undefined);
  throw error;
} finally {
  await context?.close().catch(() => undefined);
  await browser?.close().catch(() => undefined);
  await stopApplicationServer(server);
  if (!keepData) {
    await rm(isolatedRoot, { force: true, recursive: true });
  } else {
    console.log(`Isolated test data kept at: ${isolatedRoot}`);
  }
}

async function tourNewAtlas(page, { llm }) {
  await step(page, "Open the empty Atlas", async () => {
    await page.goto(baseUrl, { waitUntil: "domcontentloaded" });
    await page.getByText("Your sky is still waiting.").waitFor();
    await waitForMemoryCount(page, 0);
    assert.equal(await page.locator('a[id^="atlas-star-"]').count(), 0);
  });

  await step(page, "Open the preservation flow", async () => {
    await clickRoute(
      page,
      page.getByRole("link", { name: "Preserve your dream" }),
      (url) => url.pathname === "/preserve",
    );
    await page
      .getByRole("textbox", { name: "What do you remember from your dream?" })
      .waitFor();
  });

  const dreamText = llm
    ? "I crossed a quiet bridge above silver water while a small red lantern followed me between the trees."
    : "I stood beside a quiet lake while a silver bird rested on my hand and a warm light moved beneath the water.";

  let rememberingBecameVisibleAt = 0;
  let cardBecameVisibleAt = 0;
  await step(page, "Preserve one dream", async () => {
    const dreamInput = page.getByRole("textbox", {
      name: "What do you remember from your dream?",
    });
    await dreamInput.click();
    await dreamInput.pressSequentially(dreamText, {
      delay: headless ? 0 : 24,
    });
    const preservationResponse = page.waitForResponse(
      (response) =>
        response.request().method() === "POST" &&
        response.url() === `${baseUrl}/api/dream`,
    );
    await page.getByRole("button", { name: /Preserve this memory/i }).click();
    await page.getByText("The Atlas is remembering.").waitFor();
    rememberingBecameVisibleAt = Date.now();
    await page
      .getByText("This happens automatically", { exact: false })
      .waitFor();
    const response = await preservationResponse;
    assert.ok(response.ok(), `Dream API returned ${response.status()}.`);
    preservedResponse = await response.json();
    await warmRoute(
      `${baseUrl}/dreams/${encodeURIComponent(preservedResponse.id)}`,
    );
    await page.getByText("Memory preserved").waitFor();
    cardBecameVisibleAt = Date.now();
  });

  assert.ok(
    cardBecameVisibleAt - rememberingBecameVisibleAt >= 2000,
    "The remembering view disappeared too quickly.",
  );
  assert.equal(preservedResponse?.persisted, true);
  assert.equal(preservedResponse?.originalDream, dreamText);

  if (llm) {
    const trace = Array.isArray(preservedResponse?.agentTrace)
      ? preservedResponse.agentTrace
      : [];
    const languageAgents = trace.filter(({ agent }) =>
      [
        "Archivist.Title",
        "Archivist.Narration",
        "Observer.Observation",
        "PatternKeeper.Motifs",
      ].includes(agent),
    );
    assert.equal(languageAgents.length, 4);
    assert.ok(
      languageAgents.every(({ status }) => status === "success"),
      "At least one LLM agent did not complete successfully.",
    );
  }

  await step(page, "Reveal the new star", async () => {
    await clickRoute(
      page,
      page.getByRole("link", { name: /See it become a star/i }),
      (url) =>
        url.pathname === "/" &&
        url.searchParams.get("new") === preservedResponse?.id,
    );
    await waitForMemoryCount(page, 1);
    assert.equal(await page.locator('a[id^="atlas-star-"]').count(), 1);
  });

  await step(page, "Open Dream Cards", async () => {
    await clickRoute(
      page,
      page.getByRole("link", { name: "Dream Cards" }),
      (url) => url.pathname === "/dreams",
    );
    await page.getByText("Your memory, preserved.").waitFor();
    await page.getByText(dreamText, { exact: false }).first().waitFor();
  });

  await tourMemoryViews(page);
}

async function tourDemoAtlas(page) {
  let focusedDreamId;

  await step(page, "Open the 38-dream demo Atlas", async () => {
    await page.goto(baseUrl, { waitUntil: "domcontentloaded" });
    await waitForMemoryCount(page, 38);
    assert.equal(await page.locator('a[id^="atlas-star-"]').count(), 38);
  });

  await step(page, "Trace the living constellation", async () => {
    await traceAtlasHighlights(page);
  });

  await step(page, "Search and choose a returning motif", async () => {
    const search = page.getByRole("textbox", {
      name: "Search dream memory",
    });
    await search.click();
    await search.pressSequentially("water", {
      delay: headless ? 0 : 70,
    });
    await page.getByRole("button", { name: "clear" }).waitFor();
    const firstResult = page.getByTestId("atlas-search-result").first();
    await firstResult.waitFor({ state: "visible" });
    focusedDreamId = await firstResult.getAttribute("data-dream-id");
    assert.ok(
      focusedDreamId,
      "The first Atlas search result is missing its stable dream id.",
    );
    await firstResult.hover();
    await demoBeat(page, visibleBeat(0.35));
    await firstResult.click();
    await waitForAtlasStarState(page, {
      dreamId: focusedDreamId,
      state: "active",
    });
    await waitForOpenAtlasMemoryPanel(page, {
      dreamId: focusedDreamId,
    });
    await demoBeat(page, visibleBeat(0.45));
  });

  await step(page, "Open the searched Dream Memory", async () => {
    assert.ok(focusedDreamId, "No searched Dream Memory was selected.");
    await warmRoute(
      `${baseUrl}/dreams/${encodeURIComponent(focusedDreamId)}`,
    );
    await clickRoute(
      page,
      page.getByTestId(ATLAS_MEMORY_OPEN_LINK_TEST_ID),
      (url) => url.pathname === `/dreams/${focusedDreamId}`,
    );
    await page.getByText(/Dream Memory \d+/).waitFor();
  });

  await tourDreamMemoryBoard(page);

  await step(page, "Return to all Dream Cards", async () => {
    await clickRoute(
      page,
      page.getByRole("link", { name: /Dream Cards/i }).first(),
      (url) => url.pathname === "/dreams",
    );
    await page.getByText("Your memory, preserved.").waitFor();
  });

  await tourMemoryViews(page, { tourBoardAfterOpening: false });
}

async function tourMemoryViews(page, { tourBoardAfterOpening = true } = {}) {
  await step(page, "Switch to the flowing Timeline", async () => {
    await page.getByRole("button", { name: "timeline" }).click();
    await page
      .getByRole("region", { name: "Dream memory timeline" })
      .waitFor();
  });

  await step(page, "Return to cards and open a Dream Memory", async () => {
    await page.getByRole("button", { name: "cards" }).click();
    await clickRoute(
      page,
      page
        .locator('a[href^="/dreams/"]')
        .filter({
          hasText: "Return to this memory",
        })
        .first(),
      (url) => url.pathname.startsWith("/dreams/"),
    );
    await page.getByText(/Dream Memory \d+/).waitFor();
  });

  if (tourBoardAfterOpening) {
    await tourDreamMemoryBoard(page);
  }
}

async function traceAtlasHighlights(page) {
  const atlas = page.getByRole("region", {
    name: "Interactive Dream Atlas",
  });
  await atlas.waitFor();
  await atlas.evaluate((element) =>
    element.scrollIntoView({ behavior: "smooth", block: "start" }),
  );
  await waitForSmoothScroll(page);
  const atlasBounds = await atlas.boundingBox();
  assert.ok(atlasBounds, "The interactive Atlas is not visible.");

  const points = await page
    .locator('a[id^="atlas-star-"]')
    .evaluateAll((elements) => {
      const safeBottom = window.innerHeight - 180;
      return elements
        .map((element) => {
          const bounds = element.getBoundingClientRect();
          return {
            x: bounds.left + bounds.width / 2,
            y: bounds.top + bounds.height / 2,
            dreamId: element.getAttribute("data-dream-id"),
            connections: Number(
              element.getAttribute("data-connection-count") ?? "0",
            ),
          };
        })
        .filter(
          ({ x, y, connections }) =>
            connections > 0 &&
            x >= 24 &&
            x <= window.innerWidth - 24 &&
            y >= 110 &&
            y <= safeBottom,
        )
        .sort(
          (first, second) =>
            first.x - second.x ||
            second.connections - first.connections ||
            first.y - second.y,
        );
    });

  assert.ok(points.length >= 3, "Too few connected stars are visible.");
  assert.ok(
    points.every(({ dreamId }) => dreamId),
    "A connected Atlas star is missing its stable dream id.",
  );
  const targetCount = Math.min(5, points.length);
  const targets = Array.from({ length: targetCount }, (_, index) => {
    const pointIndex =
      targetCount === 1
        ? 0
        : Math.round((index * (points.length - 1)) / (targetCount - 1));
    return points[pointIndex];
  });

  await page.mouse.move(
    atlasBounds.x + Math.min(48, atlasBounds.width * 0.08),
    atlasBounds.y + atlasBounds.height * 0.48,
  );
  for (const target of targets) {
    await page.mouse.move(target.x, target.y, {
      steps: cursorSteps,
    });
    await waitForOpenAtlasMemoryPanel(page, {
      dreamId: target.dreamId,
    });
    await demoBeat(page, visibleBeat(0.52));
  }
}

async function waitForOpenAtlasMemoryPanel(page, { dreamId }) {
  const panel = page.getByTestId(ATLAS_MEMORY_PANEL_TEST_ID);
  const openMemory = page.getByTestId(ATLAS_MEMORY_OPEN_LINK_TEST_ID);

  await panel.waitFor({ state: "visible" });
  await page.waitForFunction(
    ({ panelTestId, expectedDreamId }) =>
      document
        .querySelector(`[data-testid="${panelTestId}"]`)
        ?.getAttribute("data-dream-id") === expectedDreamId,
    {
      panelTestId: ATLAS_MEMORY_PANEL_TEST_ID,
      expectedDreamId: dreamId,
    },
  );
  await openMemory.waitFor({ state: "visible" });

  assert.equal(
    await panel.getAttribute("data-dream-id"),
    dreamId,
    "The Atlas preview opened for a different dream.",
  );
  assert.equal(
    new URL(await openMemory.getAttribute("href"), baseUrl).pathname,
    `/dreams/${dreamId}`,
    "The Atlas preview link points to a different dream.",
  );

  const [panelBounds, viewport] = await Promise.all([
    panel.boundingBox(),
    page.evaluate(() => ({
      width: window.innerWidth,
      height: window.innerHeight,
    })),
  ]);
  assert.ok(panelBounds, "The Atlas memory preview has no visible bounds.");
  assert.ok(
    isRectFullyInsideViewport(panelBounds, viewport),
    `The Atlas memory preview is clipped by the viewport (${Math.round(panelBounds.x)}, ${Math.round(panelBounds.y)}, ${Math.round(panelBounds.width)}×${Math.round(panelBounds.height)} inside ${viewport.width}×${viewport.height}).`,
  );

  return { openMemory, panel };
}

async function tourDreamMemoryBoard(page) {
  await step(page, "Wander across the Dream Memory", async () => {
    const resetView = page.getByTestId("memory-board-zoom");
    await resetView.waitFor();
    const initialZoom = await readBoardZoom(resetView);
    if (initialZoom !== 100) {
      await resetView.click();
      await waitForBoardZoom(page, { equals: 100 });
    }

    const viewport = page.getByTestId("memory-board-viewport");
    const surface = page.getByTestId("memory-board-surface");
    const bounds = await viewport.boundingBox();
    assert.ok(bounds, "The Dream Memory board has no visible bounds.");
    const viewBefore = await readBoardView(surface);
    const start = {
      x: bounds.x + bounds.width * 0.72,
      y: bounds.y + bounds.height * 0.64,
    };
    const finish = {
      x: bounds.x + bounds.width * 0.64,
      y: bounds.y + bounds.height * 0.3,
    };

    await page.mouse.move(start.x, start.y, {
      steps: Math.max(8, Math.round(cursorSteps / 2)),
    });
    await page.mouse.down();
    await page.mouse.move(finish.x, finish.y, {
      steps: cursorSteps + 12,
    });
    await page.mouse.up();
    await waitForBoardPan(page, {
      yLessThan: viewBefore.y - Math.min(80, bounds.height * 0.16),
    });
    const viewAfter = await readBoardView(surface);
    assert.ok(
      viewAfter.y < viewBefore.y,
      `Dragging did not move the Dream Memory board (${viewBefore.y} → ${viewAfter.y}).`,
    );
    await assertNoDocumentHorizontalOverflow(page);
    await demoBeat(page, visibleBeat(0.6));
  });

  await step(page, "Try the Dream Memory controls", async () => {
    const resetView = page.getByTestId("memory-board-zoom");
    const zoomOut = page.getByRole("button", { name: "Zoom out" });
    const zoomIn = page.getByRole("button", { name: "Zoom in" });

    await resetView.click();
    await waitForBoardZoom(page, { equals: 100 });
    await zoomOut.hover();
    await zoomOut.click();
    await waitForBoardZoom(page, { lessThan: 100 });
    await demoBeat(page, visibleBeat(0.35));
    await zoomIn.hover();
    await zoomIn.click();
    await waitForBoardZoom(page, { greaterThan: 82 });
    await zoomIn.click();
    await waitForBoardZoom(page, { greaterThan: 100 });
    await demoBeat(page, visibleBeat(0.45));
    await resetView.hover();
    await resetView.click();
    await waitForBoardZoom(page, { equals: 100 });
  });

  await step(page, "Find this memory in the Atlas", async () => {
    const dreamId = new URL(page.url()).pathname.split("/").filter(Boolean).at(-1);
    assert.ok(dreamId, "The open Dream Memory has no route id.");
    await clickRoute(
      page,
      page.getByTestId("dream-memory-find-in-atlas"),
      (url) =>
        url.pathname === "/" && url.searchParams.get("selected") === dreamId,
    );
    await page.getByRole("img", {
      name: "Dreams connected by recurring motifs and constellations",
    }).waitFor();
    const selectedStar = await waitForAtlasStarState(page, {
      dreamId,
      state: "selected",
    });
    const starBounds = await selectedStar.boundingBox();
    assert.ok(starBounds, "The selected Atlas star has no visible bounds.");
    await page.mouse.move(
      starBounds.x + starBounds.width / 2,
      starBounds.y + starBounds.height / 2,
      { steps: cursorSteps },
    );
    await waitForOpenAtlasMemoryPanel(page, { dreamId });
    await demoBeat(page, visibleBeat(0.45));
  });
}

async function step(page, label, action) {
  console.log(`→ ${label}`);
  const guidance = getTourStepGuidance(label);
  const cue = {
    description: guidance.description,
    index: checkpoints.length + 1,
    title: label,
    total: tourStepTotal,
  };

  if (page.url() !== "about:blank") {
    await showTourCue(page, cue);
    await demoBeat(page, cueLead);
  }

  await action();
  await showTourCue(page, cue);
  await assertNoDocumentHorizontalOverflow(page);
  await assertCriticalRegionsDoNotOverlap(page);
  await demoBeat(page, Math.round(scenePause * guidance.holdWeight));
  const fileName = `${String(checkpoints.length + 1).padStart(2, "0")}-${slug(label)}.png`;
  await page.screenshot({
    path: path.join(reportDirectory, fileName),
    animations: "allow",
  });
  checkpoints.push({
    label,
    url: page.url(),
    screenshot: fileName,
  });
  await hideTourCue(page);
  await demoBeat(page, headless ? 0 : 100);
}

async function clickRoute(page, locator, matchesUrl) {
  const navigation = page.waitForURL(matchesUrl, {
    waitUntil: "domcontentloaded",
  });
  await transitionTourCue(page);
  await locator.click();
  await navigation;
  await demoBeat(page, routePause);
}

async function waitForMemoryCount(page, expectedCount) {
  const count = page.getByTestId("atlas-memory-count");
  await count.waitFor();
  await page.waitForFunction(
    ({ testId, expected }) => {
      const value = document.querySelector(
        `[data-testid="${testId}"]`,
      )?.textContent;
      return value?.replaceAll(/\s+/g, " ").trim().startsWith(`${expected} preserved `);
    },
    { testId: "atlas-memory-count", expected: expectedCount },
  );

  const label = (await count.textContent())?.replaceAll(/\s+/g, " ").trim();
  const noun = expectedCount === 1 ? "memory" : "memories";
  assert.ok(
    label?.startsWith(`${expectedCount} preserved ${noun}`),
    `Expected ${expectedCount} preserved ${noun}, received "${label}".`,
  );
}

async function readBoardZoom(locator) {
  const value = Number(await locator.getAttribute("data-zoom-percent"));
  assert.ok(Number.isFinite(value), "The Dream Memory zoom value is missing.");
  return value;
}

async function waitForBoardZoom(page, expectation) {
  await page.waitForFunction(
    ({ testId, equals, greaterThan, lessThan }) => {
      const rawValue = document
        .querySelector(`[data-testid="${testId}"]`)
        ?.getAttribute("data-zoom-percent");
      const value = Number(rawValue);
      if (!Number.isFinite(value)) return false;
      if (typeof equals === "number") return value === equals;
      if (typeof greaterThan === "number") return value > greaterThan;
      if (typeof lessThan === "number") return value < lessThan;
      return false;
    },
    {
      testId: "memory-board-zoom",
      ...expectation,
    },
    { timeout: 5000 },
  );
}

async function readBoardView(locator) {
  const values = await locator.evaluate((element) => ({
    x: Number(element.getAttribute("data-view-x")),
    y: Number(element.getAttribute("data-view-y")),
    scale: Number(element.getAttribute("data-view-scale")),
  }));
  assert.ok(
    Object.values(values).every(Number.isFinite),
    "The Dream Memory board view state is missing.",
  );
  return values;
}

async function waitForBoardPan(page, { yLessThan }) {
  await page.waitForFunction(
    ({ testId, maximumY }) => {
      const rawValue = document
        .querySelector(`[data-testid="${testId}"]`)
        ?.getAttribute("data-view-y");
      const value = Number(rawValue);
      return Number.isFinite(value) && value < maximumY;
    },
    {
      testId: "memory-board-surface",
      maximumY: yLessThan,
    },
    { timeout: 5000 },
  );
}

async function waitForAtlasStarState(page, { dreamId, state }) {
  const star = page.locator(
    `a[data-dream-id="${dreamId}"][data-${state}="true"]`,
  );
  await star.waitFor({ state: "visible" });
  return star;
}

async function assertNoDocumentHorizontalOverflow(page) {
  const dimensions = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
    bodyWidth: document.body.getBoundingClientRect().width,
  }));
  assert.ok(
    dimensions.scrollWidth <= dimensions.clientWidth + 2,
    `The page is ${dimensions.scrollWidth - dimensions.clientWidth}px wider than its viewport.`,
  );
  assert.ok(
    dimensions.bodyWidth >= dimensions.clientWidth - 2,
    `The page body fills only ${Math.round(dimensions.bodyWidth)}px of a ${dimensions.clientWidth}px viewport.`,
  );
}

async function assertCriticalRegionsDoNotOverlap(page) {
  if (new URL(page.url()).pathname !== "/") return;

  const overlaps = await page.evaluate(() => {
    const rectangle = (selector) => {
      const element = document.querySelector(selector);
      if (!(element instanceof HTMLElement || element instanceof SVGElement)) {
        return null;
      }
      const bounds = element.getBoundingClientRect();
      if (bounds.width === 0 || bounds.height === 0) return null;
      return {
        top: bounds.top,
        right: bounds.right,
        bottom: bounds.bottom,
        left: bounds.left,
      };
    };
    const intersects = (first, second) =>
      first.left < second.right - 1 &&
      first.right > second.left + 1 &&
      first.top < second.bottom - 1 &&
      first.bottom > second.top + 1;
    const regions = {
      canvas: rectangle('[data-testid="atlas-landing-canvas"]'),
      sidebar: rectangle('[data-testid="atlas-landing-sidebar"]'),
      search: rectangle('[data-testid="atlas-search-panel"]'),
      heading: rectangle('[data-testid="atlas-landing-heading"]'),
    };
    const pairs = [
      ["canvas", "sidebar"],
      ["search", "heading"],
    ];
    return pairs
      .filter(([first, second]) => {
        const firstRegion = regions[first];
        const secondRegion = regions[second];
        return (
          firstRegion &&
          secondRegion &&
          intersects(firstRegion, secondRegion)
        );
      })
      .map(([first, second]) => `${first} overlaps ${second}`);
  });

  assert.deepEqual(
    overlaps,
    [],
    `Critical landing regions overlap: ${overlaps.join(", ")}.`,
  );
}

async function waitForSmoothScroll(page) {
  if (headless) return;

  await page.evaluate(
    () =>
      new Promise((resolve) => {
        const startedAt = performance.now();
        let previousY = window.scrollY;
        let stableFrames = 0;

        const observe = () => {
          const currentY = window.scrollY;
          stableFrames =
            Math.abs(currentY - previousY) < 0.5 ? stableFrames + 1 : 0;
          previousY = currentY;

          if (stableFrames >= 3 || performance.now() - startedAt >= 900) {
            resolve();
            return;
          }
          requestAnimationFrame(observe);
        };

        requestAnimationFrame(observe);
      }),
  );
}

async function showTourCue(page, cue) {
  const shown = await page.evaluate(
    (payload) => window.__dreamAtlasTour?.show(payload) === true,
    cue,
  );
  assert.equal(shown, true, "The guided tour cue could not be displayed.");
}

async function hideTourCue(page) {
  await page.evaluate(() => window.__dreamAtlasTour?.hide());
}

async function transitionTourCue(page) {
  await page.evaluate(() => window.__dreamAtlasTour?.transition());
}

function visibleBeat(weight) {
  return headless && scenePause <= HEADLESS_TOUR_PACE.scenePause
    ? 0
    : Math.round(scenePause * weight);
}

async function demoBeat(page, milliseconds) {
  if (milliseconds > 0) await page.waitForTimeout(milliseconds);
}

async function installTourEffects(context) {
  await context.addInitScript(() => {
    const guideId = "dream-atlas-guided-tour-cue";
    const guideStyleId = "dream-atlas-guided-tour-style";
    let cursor;

    const ensureGuide = () => {
      if (!document.getElementById(guideStyleId)) {
        const style = document.createElement("style");
        style.id = guideStyleId;
        style.textContent = [
          `#${guideId}{position:fixed;top:18px;left:50%;z-index:2147483644;width:min(580px,calc(100vw - 48px));box-sizing:border-box;padding:11px 15px 12px;border:1px solid rgba(226,232,240,.2);border-radius:16px;background:linear-gradient(135deg,rgba(8,12,28,.88),rgba(14,19,42,.76));box-shadow:0 18px 48px rgba(0,0,0,.32),0 0 32px rgba(149,166,255,.1);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);pointer-events:none;color:#f8fafc;opacity:0;transform:translate(-50%,-10px) scale(.985);transition:opacity 260ms ease,transform 360ms cubic-bezier(.2,.8,.2,1);font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}`,
          `#${guideId}[data-visible="true"]{opacity:1;transform:translate(-50%,0) scale(1)}`,
          `#${guideId}[data-transitioning="true"]{opacity:.58;transform:translate(-50%,-3px) scale(.992)}`,
          `#${guideId} [data-tour-meta]{display:flex;align-items:center;justify-content:space-between;gap:16px;margin-bottom:5px;color:rgba(226,232,240,.62);font-size:9px;font-weight:600;letter-spacing:.2em;text-transform:uppercase}`,
          `#${guideId} [data-tour-title]{font-family:Georgia,"Times New Roman",serif;font-size:17px;line-height:1.15;letter-spacing:.01em;color:rgba(255,255,255,.96)}`,
          `#${guideId} [data-tour-description]{margin-top:4px;color:rgba(226,232,240,.72);font-size:11px;line-height:1.45;letter-spacing:.015em}`,
          `#${guideId} [data-tour-track]{height:1px;margin-top:9px;overflow:hidden;background:rgba(226,232,240,.12)}`,
          `#${guideId} [data-tour-progress]{display:block;height:100%;width:0;background:linear-gradient(90deg,rgba(203,213,225,.35),rgba(255,255,255,.92));box-shadow:0 0 9px rgba(226,232,240,.5);transition:width 420ms cubic-bezier(.2,.8,.2,1)}`,
          `@media (max-width:700px){#${guideId}{top:10px;width:calc(100vw - 20px);padding:9px 12px 10px}#${guideId} [data-tour-description]{font-size:10px}}`,
        ].join("");
        document.head.append(style);
      }

      let guide = document.getElementById(guideId);
      if (!(guide instanceof HTMLElement)) {
        guide = document.createElement("aside");
        guide.id = guideId;
        guide.setAttribute("aria-hidden", "true");
        guide.setAttribute("data-testid", "dream-atlas-tour-cue");
        guide.innerHTML = [
          '<div data-tour-meta><span data-tour-kicker>Guided tour</span><span data-tour-count></span></div>',
          '<div data-tour-title></div>',
          '<div data-tour-description></div>',
          '<div data-tour-track><span data-tour-progress></span></div>',
        ].join("");
        document.body.append(guide);
      }
      return guide;
    };

    window.__dreamAtlasTour = {
      show({ description, index, title, total }) {
        const guide = ensureGuide();
        const count = guide.querySelector("[data-tour-count]");
        const titleElement = guide.querySelector("[data-tour-title]");
        const descriptionElement = guide.querySelector(
          "[data-tour-description]",
        );
        const progress = guide.querySelector("[data-tour-progress]");
        if (
          !(count instanceof HTMLElement) ||
          !(titleElement instanceof HTMLElement) ||
          !(descriptionElement instanceof HTMLElement) ||
          !(progress instanceof HTMLElement)
        ) {
          return false;
        }

        count.textContent = `${String(index).padStart(2, "0")} / ${String(total).padStart(2, "0")}`;
        titleElement.textContent = title;
        descriptionElement.textContent = description;
        progress.style.width = `${Math.min(100, (index / total) * 100)}%`;
        guide.dataset.transitioning = "false";
        guide.getBoundingClientRect();
        guide.dataset.visible = "true";
        return true;
      },
      transition() {
        const guide = document.getElementById(guideId);
        if (guide instanceof HTMLElement) {
          guide.dataset.transitioning = "true";
        }
      },
      hide() {
        const guide = document.getElementById(guideId);
        if (guide instanceof HTMLElement) {
          guide.dataset.visible = "false";
          guide.dataset.transitioning = "false";
        }
      },
    };

    document.addEventListener(
      "pointermove",
      (event) => {
        if (!(cursor instanceof HTMLElement) || !cursor.isConnected) {
          cursor = document.createElement("span");
          cursor.setAttribute("aria-hidden", "true");
          cursor.style.cssText = [
            "position:fixed",
            "left:0",
            "top:0",
            "z-index:2147483645",
            "width:20px",
            "height:20px",
            "border:1px solid rgba(248,250,252,.72)",
            "border-radius:999px",
            "pointer-events:none",
            "background:rgba(248,250,252,.06)",
            "box-shadow:0 0 14px rgba(226,232,240,.44),inset 0 0 8px rgba(255,255,255,.14)",
            "backdrop-filter:blur(1px)",
            "transform:translate(-50%,-50%)",
            "transition:left 38ms ease-out,top 38ms ease-out,opacity 150ms ease",
          ].join(";");
          document.documentElement.append(cursor);
        }
        cursor.style.left = `${event.clientX}px`;
        cursor.style.top = `${event.clientY}px`;
        cursor.style.opacity = "1";
      },
      true,
    );

    document.addEventListener(
      "pointerdown",
      (event) => {
        if (!(event.target instanceof Element)) return;
        const ring = document.createElement("span");
        ring.setAttribute("aria-hidden", "true");
        ring.style.cssText = [
          "position:fixed",
          `left:${event.clientX}px`,
          `top:${event.clientY}px`,
          "z-index:2147483646",
          "width:10px",
          "height:10px",
          "border:1px solid rgba(248,250,252,.82)",
          "border-radius:999px",
          "pointer-events:none",
          "opacity:.9",
          "transform:translate(-50%,-50%) scale(.55)",
          "box-shadow:0 0 16px rgba(226,232,240,.62)",
          "transition:transform 430ms ease-out,opacity 430ms ease-out",
        ].join(";");
        document.documentElement.append(ring);
        requestAnimationFrame(() => {
          ring.style.opacity = "0";
          ring.style.transform = "translate(-50%,-50%) scale(3.4)";
        });
        window.setTimeout(() => ring.remove(), 480);
      },
      true,
    );
  });
}

function startApplicationServer() {
  const nextBinary = path.join(
    projectDirectory,
    "node_modules",
    "next",
    "dist",
    "bin",
    "next",
  );
  const child = spawn(
    process.execPath,
    [
      nextBinary,
      "dev",
      "--hostname",
      "127.0.0.1",
      "--port",
      String(port),
    ],
    {
      cwd: projectDirectory,
      env: {
        ...process.env,
        DREAM_ATLAS_DATA_DIR: isolatedDataDirectory,
        DREAM_AI_ENABLED: mode === "llm" ? "true" : "false",
      },
      stdio: ["ignore", "pipe", "pipe"],
    },
  );

  child.stdout.on("data", (chunk) => process.stdout.write(chunk));
  child.stderr.on("data", (chunk) => process.stderr.write(chunk));
  return child;
}

async function stopApplicationServer(child) {
  if (!child || child.exitCode !== null) return;
  child.kill("SIGTERM");
  await Promise.race([
    new Promise((resolve) => child.once("exit", resolve)),
    new Promise((resolve) => setTimeout(resolve, 3000)),
  ]);
  if (child.exitCode === null) child.kill("SIGKILL");
}

async function waitForApplication(url) {
  const deadline = Date.now() + 90_000;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(url, { cache: "no-store" });
      if (response.ok) return;
    } catch {
      // The development server is still compiling.
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error("Dream Atlas did not start within 90 seconds.");
}

async function reserveAvailablePort() {
  const server = createServer();
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  const address = server.address();
  assert.ok(address && typeof address !== "string");
  const selectedPort = address.port;
  await new Promise((resolve, reject) =>
    server.close((error) => (error ? reject(error) : resolve())),
  );
  return selectedPort;
}

async function runNodeScript(relativeScript, args) {
  const child = spawn(
    process.execPath,
    [path.join(projectDirectory, relativeScript), ...args],
    {
      cwd: projectDirectory,
      env: {
        ...process.env,
        DREAM_ATLAS_DATA_DIR: isolatedDataDirectory,
      },
      stdio: "inherit",
    },
  );
  const exitCode = await new Promise((resolve) => child.once("exit", resolve));
  if (exitCode !== 0) {
    throw new Error(`${relativeScript} failed with exit code ${exitCode}.`);
  }
}

function readStringArgument(name) {
  const inline = argumentsList.find((argument) =>
    argument.startsWith(`${name}=`),
  );
  if (inline) return inline.slice(name.length + 1);
  const index = argumentsList.indexOf(name);
  return index >= 0 ? argumentsList[index + 1] : undefined;
}

function readNumberArgument(name, fallback) {
  const value = Number(readStringArgument(name));
  return Number.isFinite(value) && value >= 0 ? value : fallback;
}

function formatDuration(milliseconds) {
  const totalSeconds = Math.round(milliseconds / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return minutes
    ? `${minutes} min ${String(seconds).padStart(2, "0")} s`
    : `${seconds} s`;
}

function slug(value) {
  return value
    .normalize("NFKD")
    .replaceAll(/[^\w]+/g, "-")
    .replaceAll(/(^-|-$)/g, "")
    .toLowerCase();
}
