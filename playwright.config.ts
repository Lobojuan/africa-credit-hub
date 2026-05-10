import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  timeout: 30000,
  retries: 1,
  use: {
    baseURL: "http://localhost:5000",
    headless: true,
    ignoreHTTPSErrors: true,
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: "ENABLE_E2E_TEST_AUTH=true PORT=5000 npx tsx server/index.ts",
    url: "http://localhost:5000/api/health",
    reuseExistingServer: false,
    timeout: 60000,
    env: {
      ENABLE_E2E_TEST_AUTH: "true",
      PORT: "5000",
    },
  },
});
