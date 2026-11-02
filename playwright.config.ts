import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "e2e",
  use: { baseURL: "http://localhost:5173" },
  webServer: { command: "npm run dev -- --port 5173 --strictPort", url: "http://localhost:5173", reuseExistingServer: true },
  projects: [
    // Headless Chrome hides scrollbars by default; keep them so the 1200px test sees a real one.
    { name: "chromium", use: { ...devices["Desktop Chrome"], launchOptions: { ignoreDefaultArgs: ["--hide-scrollbars"] } } },
    { name: "firefox", use: { ...devices["Desktop Firefox"] } },
  ],
});
