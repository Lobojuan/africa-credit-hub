import { defineConfig, devices } from "@playwright/test";

// Optional executable overrides for constrained local development environments.
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
  // A broken prerequisite (for example, login) can cascade into hundreds of
  // dependent failures. In CI, stop after a small, independent evidence set so
  // a failed run produces an actionable trace in minutes instead of consuming
  // the entire 60-minute job allowance. Local runs retain full-suite behavior.
  maxFailures: process.env.CI ? 3 : undefined,
  use: {
    // E2E must never borrow a developer's browser server or macOS service.
    // Port 5000 is commonly occupied by AirTunes on macOS, so every standard
    // run starts the same isolated server on 5001 as CI.
    baseURL: process.env.E2E_BASE_URL || "http://localhost:5001",
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
        /bank-control-center\.spec\.ts/,
        /bog-export\.spec\.ts/,
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

    // ── 4b. Authenticated WebKit — Safari-engine regression subset ──────────
    // WebKit is the closest CI coverage available for Safari. A real Safari
    // UAT remains required before a public Safari compatibility claim.
    {
      name: "authenticated-webkit",
      dependencies: ["setup"],
      use: {
        ...devices["Desktop Safari"],
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
    // Use the same isolated server locally and in CI. Developers who need to
    // target a separately managed environment must opt in explicitly with
    // E2E_REUSE_EXISTING_SERVER=true and E2E_BASE_URL.
    // Keep gateway credentials in the launch command as well as `env`: the
    // shell that starts webServer may otherwise retain parent CI credentials.
    command: "ENABLE_E2E_TEST_AUTH=true LOTO_USSD_TOKEN=ci-e2e-ussd-token LOTO_USSD_HMAC_SECRET='' PORT=5001 npx tsx server/index.ts",
    url: "http://localhost:5001/api/health",
    reuseExistingServer: process.env.E2E_REUSE_EXISTING_SERVER === "true",
    timeout: 90000,
    env: {
      ENABLE_E2E_TEST_AUTH: "true",
      // E2E calls the USSD gateway with this credential, exercising the same
      // token gate used by a real aggregator instead of relying on an IP bypass.
      LOTO_USSD_TOKEN: "ci-e2e-ussd-token",
      // Do not inherit a deployment HMAC secret into the deterministic CI
      // gateway. Production still validates HMAC whenever it is configured.
      LOTO_USSD_HMAC_SECRET: "",
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
