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
    {
      name: "oauth-smoke",
      use: { ...devices["Desktop Chrome"] },
      testMatch: /oauth-smoke\.spec\.ts/,
    },
  ],
  webServer: {
    command: "ENABLE_E2E_TEST_AUTH=true PORT=5000 npx tsx server/index.ts",
    url: "http://localhost:5000/api/health",
    reuseExistingServer: !process.env.CI,
    timeout: 60000,
    env: {
      ENABLE_E2E_TEST_AUTH: "true",
      PORT: "5000",
      GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || "mock-google-ci-client-id",
      GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET || "mock-google-ci-secret",
      MICROSOFT_CLIENT_ID: process.env.MICROSOFT_CLIENT_ID || "mock-ms-ci-client-id",
      MICROSOFT_CLIENT_SECRET: process.env.MICROSOFT_CLIENT_SECRET || "mock-ms-ci-secret",
      MICROSOFT_TENANT_ID: process.env.MICROSOFT_TENANT_ID || "common",
    },
  },
});
