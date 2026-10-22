import { defineConfig, devices } from "@playwright/test";

const PORT = 3100;

export default defineConfig({
  testDir: "./e2e",
  snapshotPathTemplate: "{testDir}/__screenshots__/{testFilePath}/{arg}{ext}",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  reporter: [["html", { open: "never" }]],
  use: {
    baseURL: `http://localhost:${PORT}`,
    viewport: { width: 1440, height: 900 },
    screenshot: "on",
    video: "on",
    trace: "retain-on-failure",
  },
  expect: {
    toHaveScreenshot: { animations: "disabled", maxDiffPixelRatio: 0.01 },
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } } }],
  webServer: {
    command: `./node_modules/.bin/next dev --port ${PORT}`,
    gracefulShutdown: { signal: "SIGTERM", timeout: 5000 },
    url: `http://localhost:${PORT}/api/health`,
    reuseExistingServer: !process.env.CI,
  },
});
