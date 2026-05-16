import { defineConfig, devices } from "@playwright/test";

// Optional executable overrides — set these env vars in the Replit dev
// environment when Playwright's own browser binaries are unavailable.
// In CI, Playwright installs its own browsers and these are not needed.
const chromiumExec = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH;
const firefoxExec = process.env.PLAYWRIGHT_FIREFOX_EXECUTABLE_PATH;

const chromiumOptions = chromiumExec
  ? { executablePath: chromiumExec, args: ["--no-sandbox", "--disable-dev-shm-usage"] }
  : { args: ["--no-sandbox", "--disable-dev-shm-usage"] };

const firefoxOptions = firefoxExec
  ? { executablePath: firefoxExec }
  : {};

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
    // ── Legacy / existing specs ────────────────────────────────────────────
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        launchOptions: chromiumOptions,
      },
      testMatch: [/oauth-smoke\.spec\.ts/, /loto-admin-dashboard\.spec\.ts/],
    },
    {
      name: "oauth-smoke",
      use: {
        ...devices["Desktop Chrome"],
        launchOptions: chromiumOptions,
      },
      testMatch: /oauth-smoke\.spec\.ts/,
    },

    // ── Authenticated specs (role injection via set-session) ───────────────
    {
      name: "authenticated-chromium",
      use: {
        ...devices["Desktop Chrome"],
        launchOptions: chromiumOptions,
      },
      testMatch: [
        /auth\.spec\.ts/,
        /mfa\.spec\.ts/,
        /credit\.spec\.ts/,
        /loan-origination\.spec\.ts/,
        /collateral\.spec\.ts/,
        /loto\.spec\.ts/,
        /reports-drilldown\.spec\.ts/,
        /regulatory\.spec\.ts/,
      ],
    },
    {
      name: "authenticated-firefox",
      use: {
        ...devices["Desktop Firefox"],
        launchOptions: firefoxOptions,
      },
      testMatch: [
        /auth\.spec\.ts/,
        /credit\.spec\.ts/,
        /regulatory\.spec\.ts/,
        /reports-drilldown\.spec\.ts/,
      ],
    },

    // ── Unauthenticated / public-page specs ────────────────────────────────
    {
      name: "unauthenticated",
      use: {
        ...devices["Desktop Chrome"],
        launchOptions: chromiumOptions,
      },
      testMatch: [/consumer-portal\.spec\.ts/, /public-pages\.spec\.ts/],
    },

    // For convenience, map the old project names used in the existing CI YAML
    {
      name: "authenticated",
      use: {
        ...devices["Desktop Chrome"],
        launchOptions: chromiumOptions,
      },
      testMatch: [
        /auth\.spec\.ts/,
        /mfa\.spec\.ts/,
        /credit\.spec\.ts/,
        /loan-origination\.spec\.ts/,
        /collateral\.spec\.ts/,
        /loto\.spec\.ts/,
        /reports-drilldown\.spec\.ts/,
        /regulatory\.spec\.ts/,
      ],
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
      GOOGLE_CLIENT_ID: "mock-google-ci-client-id",
      GOOGLE_CLIENT_SECRET: "mock-google-ci-secret",
      MICROSOFT_CLIENT_ID: "mock-ms-ci-client-id",
      MICROSOFT_CLIENT_SECRET: "mock-ms-ci-secret",
      MICROSOFT_TENANT_ID: "common",
      CANONICAL_URL: "https://universalcredithub.com",
      SAML_IDP_ENTRY_POINT: "https://mock-idp.example.com/sso/saml",
    },
  },
});
