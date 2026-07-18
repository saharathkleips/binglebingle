import { defineConfig, devices } from "@playwright/test";

const baseUrl = process.env["PLAYWRIGHT_BASE_URL"] ?? "http://localhost:5173/binglebingle/";
const webServerCommand = process.env["PLAYWRIGHT_WEB_SERVER_COMMAND"] ?? "pnpm dev";

export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  forbidOnly: !!process.env["CI"],
  retries: process.env["CI"] ? 2 : 0,
  ...(process.env["CI"] ? { workers: 1 } : {}),
  timeout: 60_000,
  reporter: process.env["CI"] ? [["list"], ["html", { open: "never" }]] : "html",
  use: {
    baseURL: baseUrl,
    trace: "on-first-retry",
    video: "on",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: webServerCommand,
    url: baseUrl,
    reuseExistingServer: !process.env["CI"],
  },
});
