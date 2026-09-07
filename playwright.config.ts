import { existsSync } from "node:fs";
import path from "node:path";

import { defineConfig, devices } from "@playwright/test";

import { storageStatePath } from "./e2e/helpers/auth-state";

const localEnvPath = path.resolve(process.cwd(), ".env.local");

if (existsSync(localEnvPath)) {
  process.loadEnvFile(localEnvPath);
}

const baseURL =
  process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000";

export default defineConfig({
  testDir: "./e2e/tests",
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,

  reporter: [
    ["list"],
    ["html", { open: "never" }],
  ],

  use: {
    baseURL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },

  webServer: {
    command: "npm run dev",
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },

  projects: [
    {
      name: "auth-setup",
      testMatch: /auth\.setup\.ts/,
      teardown: "auth-cleanup",
      use: {
        ...devices["Desktop Chrome"],
      },
    },
    {
      name: "auth-cleanup",
      testMatch: /auth\.cleanup\.ts/,
    },
    {
      name: "desktop-chrome",
      testMatch: /dreams\.spec\.ts/,
      use: {
        ...devices["Desktop Chrome"],
      },
    },
    {
      name: "mobile-chrome",
      testMatch: /dreams\.spec\.ts/,
      use: {
        ...devices["Pixel 7"],
      },
    },
    {
      name: "authenticated-chrome",
      testMatch: /session\.spec\.ts/,
      dependencies: ["auth-setup"],
      use: {
        ...devices["Desktop Chrome"],
        storageState: storageStatePath,
      },
    },
  ],
});