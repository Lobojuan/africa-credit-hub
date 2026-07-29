import "dotenv/config";
import { defineConfig, devices } from "@playwright/test";

/**
 * Browser tests must use a database that is disposable by design.  In
 * particular, they must never inherit a developer's application database:
 * Playwright starts the app with RUN_SEED=true and test data can be mutated by
 * nearly every spec.  Locally we derive a separate database from DATABASE_URL;
 * CI supplies its ephemeral service database directly.
 */
function resolveE2EDatabaseUrl(): string {
  const configuredUrl = process.env.E2E_DATABASE_URL;
  const sourceUrl = configuredUrl ?? (process.env.CI ? process.env.DATABASE_URL : undefined);

  if (sourceUrl) {
    const url = new URL(sourceUrl);
    const databaseName = url.pathname.replace(/^\//, "");
    if (!/(^|[_-])(e2e|test)([_-]|$)/i.test(databaseName)) {
      throw new Error(
        "E2E_DATABASE_URL must name an isolated database containing 'e2e' or 'test'; refusing to run browser tests against a shared database.",
      );
    }
    return url.toString();
  }

  if (!process.env.DATABASE_URL) {
    throw new Error(
      "DATABASE_URL is required to derive the local E2E database. Set E2E_DATABASE_URL to an isolated database URL instead.",
    );
  }

  const localE2EUrl = new URL(process.env.DATABASE_URL);
  localE2EUrl.pathname = "/universal_credit_hub_e2e";
  return localE2EUrl.toString();
}

const e2eDatabaseUrl = resolveE2EDatabaseUrl();
const e2ePiiEncryptionKey =
  process.env.E2E_PII_ENCRYPTION_KEY ?? "universal-credit-hub-e2e-encryption-key-not-for-production";
const e2ePiiEncryptionSalt =
  process.env.E2E_PII_ENCRYPTION_SALT ?? "universal-credit-hub-e2e-encryption-salt-not-for-production";

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
    // Keep browser-engine failures diagnosable in CI. E2E data is isolated and
    // seeded, so the retained artefacts never contain production customer data.
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
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
        /transaction-resolution\.spec\.ts/,
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
    // `db:push` and the seeded app both receive only the disposable E2E URL
    // from `env` below. This makes a fresh local run reproducible and keeps it
    // away from a developer's normal UCH data and encryption keys.
    command: "npm run db:push && npx tsx server/index.ts",
    url: "http://localhost:5001/api/health",
    reuseExistingServer: process.env.E2E_REUSE_EXISTING_SERVER === "true",
    timeout: 180000,
    env: {
      DATABASE_URL: e2eDatabaseUrl,
      RUN_SEED: "true",
      // E2E deliberately seeds multi-country coverage. Ghana-only cleanup is
      // for a country-scoped local demo, not for this disposable test database.
      SKIP_GHANA_CLEANUP: "true",
      SESSION_SECRET:
        process.env.E2E_SESSION_SECRET ?? "universal-credit-hub-e2e-session-secret-not-for-production",
      PII_ENCRYPTION_KEY: e2ePiiEncryptionKey,
      PII_ENCRYPTION_SALT: e2ePiiEncryptionSalt,
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
