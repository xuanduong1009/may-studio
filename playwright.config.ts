import { defineConfig, devices } from "@playwright/test";
import { ADMIN, E2E_PORT, E2E_URL } from "./e2e/fixtures";

/**
 * End-to-end tests drive a real browser against a real server and its own throwaway database
 * (e2e/prepare-db.mjs). CI tests the production build; locally the dev server is used, so no build is needed.
 */
export default defineConfig({
  testDir: "e2e",
  // the tests share one database and the per-IP rate limits
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : [["list"]],
  timeout: 60_000,
  expect: { timeout: 10_000 },
  use: {
    baseURL: E2E_URL,
    locale: "vi-VN",
    // also skips the first-visit intro and shortens animations
    reducedMotion: "reduce",
    trace: "retain-on-failure",
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Pixel 7"] }, testMatch: /storefront/ },
  ],
  webServer: {
    command: `node e2e/prepare-db.mjs && npm run ${process.env.CI ? "start" : "dev"} -- -p ${E2E_PORT}`,
    url: E2E_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 240_000,
    env: {
      DATABASE_URL: "file:e2e.db",
      BETTER_AUTH_URL: E2E_URL,
      NEXT_PUBLIC_SITE_URL: E2E_URL,
      ADMIN_EMAILS: ADMIN.email,
      SEED_ADMIN_PASSWORD: ADMIN.password,
    },
  },
});
