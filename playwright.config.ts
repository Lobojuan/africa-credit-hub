import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  timeout: 30000,
  retries: 1,
  use: {
    // Port 5001 — dedicated to the Playwright test server so it never conflicts
    // with the dev workflow running on port 5000.
    baseURL: "http://localhost:5001",
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
    // Playwright always starts its own isolated server on port 5001 so the
    // env vars below (CANONICAL_URL, SAML_IDP_ENTRY_POINT, mock credentials)
    // are always present and assertions can be unconditional.
    command: "ENABLE_E2E_TEST_AUTH=true PORT=5001 npx tsx server/index.ts",
    url: "http://localhost:5001/api/health",
    reuseExistingServer: false,
    timeout: 60000,
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
