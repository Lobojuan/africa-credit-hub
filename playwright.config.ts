import { defineConfig, devices } from "@playwright/test";

// Optional executable overrides — set these env vars in the Replit dev
// environment when Playwright's own browser binaries are unavailable.
// In CI, Playwright installs its own browsers and these are not needed.
const chromiumExec = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH;
const firefoxExec = process.env.PLAYWRIGHT_FIREFOX_EXECUTABLE_PATH;

const chromiumOptions = chromiumExec
  ? { executablePath: chromiumExec, args: ["--no-sandbox", "--disable-dev-shm-usage"] }
  : { args: ["--no-sandbox", "--disable-dev-shm-usage"] };

const firefoxOptions = firefoxExec ? { executablePath: firefoxExec } : {};

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
    // ── 1. Global auth setup — runs before any authenticated project ──────────
    // Saves reusable session state to playwright/.auth/ so authenticated spec
    // projects can load the cookie/storage state directly without repeating the
    // login handshake on every test file.
    {
      name: "setup",
      testMatch: /auth\.setup\.ts/,
      use: {
        ...devices["Desktop Chrome"],
        launchOptions: chromiumOptions,
      },
    },

    // ── 2. Unauthenticated / public pages ────────────────────────────────────
    // No dependency on setup; no storageState. Tests public-facing pages and
    // unauthenticated consumer portal landing.
    {
      name: "unauthenticated",
      use: {
        ...devices["Desktop Chrome"],
        launchOptions: chromiumOptions,
      },
      testMatch: [/public-pages\.spec\.ts/],
    },

    // ── 3. Authenticated Chromium — main regression suite ────────────────────
    // Depends on setup; starts each test with the saved super_admin cookie.
    // Individual tests that need a different role still call set-session.
    {
      name: "authenticated-chromium",
      dependencies: ["setup"],
      use: {
        ...devices["Desktop Chrome"],
        launchOptions: chromiumOptions,
        storageState: "playwright/.auth/super_admin.json",
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
        /consumer-portal\.spec\.ts/,
        /batch-upload\.spec\.ts/,
        /bog-export\.spec\.ts/,
        /ghana-playbook\.spec\.ts/,
        /playbook-index\.spec\.ts/,
      ],
    },

    // ── 4. Authenticated Firefox — cross-browser regression subset ───────────
    {
      name: "authenticated-firefox",
      dependencies: ["setup"],
      use: {
        ...devices["Desktop Firefox"],
        launchOptions: firefoxOptions,
        storageState: "playwright/.auth/super_admin.json",
      },
      testMatch: [
        /auth\.spec\.ts/,
        /credit\.spec\.ts/,
        /regulatory\.spec\.ts/,
        /reports-drilldown\.spec\.ts/,
      ],
    },

    // ── 5. OAuth smoke — isolated project with mocked OAuth env vars ─────────
    // Intentionally separate so the loto-admin CI job does not need OAuth secrets.
    {
      name: "oauth-smoke",
      use: {
        ...devices["Desktop Chrome"],
        launchOptions: chromiumOptions,
      },
      testMatch: [/oauth-smoke\.spec\.ts/],
    },

    // ── 6. Loto admin — chromium only, DGI dashboard role-gated ─────────────
    {
      name: "chromium",
      dependencies: ["setup"],
      use: {
        ...devices["Desktop Chrome"],
        launchOptions: chromiumOptions,
        storageState: "playwright/.auth/super_admin.json",
      },
      testMatch: [/loto-admin-dashboard\.spec\.ts/],
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
