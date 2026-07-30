export const TOUR_RECORDING_SIZE = Object.freeze({
  width: 1280,
  height: 720,
});

/**
 * @param {{
 *   headless: boolean;
 *   slowMotion: number;
 *   executablePath?: string;
 * }} configuration
 */
export function createTourLaunchOptions({
  headless,
  slowMotion,
  executablePath,
}) {
  /** @type {{
   *   headless: boolean;
   *   slowMo: number;
   *   args: string[];
   *   executablePath?: string;
   * }} */
  const options = {
    headless,
    slowMo: slowMotion,
    args: headless ? [] : ["--start-maximized"],
  };

  if (executablePath) {
    options.executablePath = executablePath;
  }

  return options;
}

/**
 * @typedef {{
 *   viewport: { width: number; height: number } | null;
 *   deviceScaleFactor?: number;
 *   reducedMotion: "no-preference";
 *   recordVideo?: {
 *     dir: string;
 *     size: { width: number; height: number };
 *   };
 * }} TourContextOptions
 */

/**
 * @param {{
 *   headless: boolean;
 *   noVideo?: boolean;
 *   videoDirectory?: string;
 * }} configuration
 * @returns {TourContextOptions}
 */
export function createTourContextOptions({
  headless,
  noVideo = true,
  videoDirectory,
}) {
  /** @type {TourContextOptions} */
  const options = {
    // A visible tour inherits the maximized window. Keeping a fixed emulated
    // viewport here leaves an artificial blank strip in headed Chromium on
    // scaled Windows displays.
    viewport: headless ? TOUR_RECORDING_SIZE : null,
    reducedMotion: "no-preference",
  };

  if (headless) {
    options.deviceScaleFactor = 1;
  }

  if (!noVideo) {
    if (!videoDirectory) {
      throw new Error("A video directory is required when recording the tour.");
    }
    options.recordVideo = {
      dir: videoDirectory,
      size: TOUR_RECORDING_SIZE,
    };
  }

  return options;
}
