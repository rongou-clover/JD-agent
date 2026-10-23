import { defineConfig, devices } from "@playwright/test";
import { ACCESS_COOKIE, signAccess } from "./src/auth/access-cookie";

const PORT = 3100;

/** Test-only access secret: the dev server gets it via env, the browser starts with a valid cookie. */
const E2E_SESSION_SECRET = "e2e-session-secret-not-used-anywhere-else";
const accessCookie = {
  name: ACCESS_COOKIE,
  value: signAccess(E2E_SESSION_SECRET, new Date()),
  domain: "localhost",
  path: "/",
  expires: -1,
  httpOnly: true,
  secure: false,
  sameSite: "Lax" as const,
};

export default defineConfig({
  testDir: "./e2e",
  snapshotPathTemplate: "{testDir}/__screenshots__/{testFilePath}/{arg}{ext}",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  reporter: [["html", { open: "never" }]],
  use: {
    baseURL: `http://localhost:${PORT}`,
    viewport: { width: 1440, height: 900 },
    /** Deterministic UI: no marquee, no random Home headline (src/ui/home/Headline.tsx). */
    contextOptions: { reducedMotion: "reduce" },
    storageState: { cookies: [accessCookie], origins: [] },
    screenshot: "on",
    video: "on",
    trace: "retain-on-failure",
  },
  expect: {
    toHaveScreenshot: { animations: "disabled", maxDiffPixelRatio: 0.01, stylePath: "./e2e/support/screenshot.css" },
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } } }],
  webServer: {
    command: `./node_modules/.bin/next dev --port ${PORT}`,
    gracefulShutdown: { signal: "SIGTERM", timeout: 5000 },
    url: `http://localhost:${PORT}/api/health`,
    reuseExistingServer: !process.env.CI,
    env: { ACCESS_PASSWORD: "e2e-password", SESSION_SECRET: E2E_SESSION_SECRET },
  },
});
