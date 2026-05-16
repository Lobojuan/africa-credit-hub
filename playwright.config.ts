import { defineConfig, devices } from "@playwright/test";

// Use system Chromium in the Replit/NixOS environment when the standard
// Playwright browser cache is absent.
const NIX_CHROMIUM =
  "/nix/store/zi4f80l169xlmivz8vja8wlphq74qqk0-chromium-125.0.6422.141/bin/chromium";
const CHROMIUM_EXEC = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ?? NIX_CHROMIUM;

export default defineConfig({
  testDir: "./e2e",
  timeout: 40000,
  retries: 1,
  use: {
    // CI uses port 5001 (isolated); local dev reuses the existing server on 5000
    // (which is already started with ENABLE_E2E_TEST_AUTH=true by dev-server.sh).
    baseURL: process.env.CI ? "http://localhost:5001" : "http://localhost:5000",
    headless: true,
    ignoreHTTPSErrors: true,
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        launchOptions: { executablePath: CHROMIUM_EXEC, args: ["--no-sandbox", "--disable-dev-shm-usage"] },
      },
      testMatch: [/oauth-smoke\.spec\.ts/, /loto-admin-dashboard\.spec\.ts/],
    },
    {
      name: "oauth-smoke",
      use: {
        ...devices["Desktop Chrome"],
        launchOptions: { executablePath: CHROMIUM_EXEC, args: ["--no-sandbox", "--disable-dev-shm-usage"] },
      },
      testMatch: /oauth-smoke\.spec\.ts/,
    },
    {
      name: "authenticated",
      use: {
        ...devices["Desktop Chrome"],
        launchOptions: { executablePath: CHROMIUM_EXEC, args: ["--no-sandbox", "--disable-dev-shm-usage"] },
      },
      testMatch: [
        /auth\.spec\.ts/,
        /credit\.spec\.ts/,
        /collateral\.spec\.ts/,
        /loto\.spec\.ts/,
        /reports-drilldown\.spec\.ts/,
        /regulatory\.spec\.ts/,
      ],
    },
    {
      name: "unauthenticated",
      use: {
        ...devices["Desktop Chrome"],
        launchOptions: { executablePath: CHROMIUM_EXEC, args: ["--no-sandbox", "--disable-dev-shm-usage"] },
      },
      testMatch: [/consumer-portal\.spec\.ts/, /public-pages\.spec\.ts/],
    },
  ],
  webServer: {
    // CI: always starts its own isolated server on port 5001.
    // Local dev: reuses the existing dev server on port 5000 that is already
    // running with ENABLE_E2E_TEST_AUTH=true via dev-server.sh.
    command: "ENABLE_E2E_TEST_AUTH=true PORT=5001 npx tsx server/index.ts",
    url: process.env.CI ? "http://localhost:5001/api/health" : "http://localhost:5000/api/health",
    reuseExistingServer: !process.env.CI,
    timeout: 90000,
    env: {
      ENABLE_E2E_TEST_AUTH: "true",
      PORT: "5001",
      // Always use mock credentials so client_id assertions are unconditional.
      // Real deployments do not use playwright.config.ts for server startup.
      GOOGLE_CLIENT_ID: "mock-google-ci-client-id",
      GOOGLE_CLIENT_SECRET: "mock-google-ci-secret",
      MICROSOFT_CLIENT_ID: "mock-ms-ci-client-id",
      MICROSOFT_CLIENT_SECRET: "mock-ms-ci-secret",
      MICROSOFT_TENANT_ID: "common",
      // Production canonical URL — ensures redirect_uri and SAML ACS URLs always
      // embed https://universalcredithub.com so assertions are unconditional.
      CANONICAL_URL: "https://universalcredithub.com",
      // Fake SAML IdP so /api/auth/saml/login issues a redirect instead of 503.
      SAML_IDP_ENTRY_POINT: "https://mock-idp.example.com/sso/saml",
    },
  },
});
