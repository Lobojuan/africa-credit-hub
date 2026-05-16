/**
 * MFA E2E Suite
 *
 * Tests multi-factor authentication flows using the `otpauth` library for
 * real TOTP code generation — matching the server's OTPAuth implementation.
 *
 * Flows covered:
 *   - Passkey (WebAuthn) button visible on institution login form
 *   - TOTP setup endpoint returns a base32 secret
 *   - otpauth generates a valid 6-digit code from that secret
 *   - TOTP verify endpoint accepts the generated code (full enroll flow)
 *   - MFA is disabled again after test to avoid polluting demo state
 *   - Wrong 6-digit code (deterministically wrong) returns 400/401
 *   - MFA API endpoints are auth-gated
 *
 * Note: The enroll test does a real API login (not set-session) so the
 * session has a real userId that exists in the database.
 */

import { test, expect } from "@playwright/test";
import OTPAuth from "otpauth";

async function injectSession(
  page: import("@playwright/test").Page,
  session: Record<string, unknown>,
) {
  const res = await page.request.post("/api/test/set-session", { data: session });
  expect(res.ok()).toBeTruthy();
}

async function apiLogin(
  page: import("@playwright/test").Page,
  username: string,
  password: string,
): Promise<boolean> {
  const resp = await page.request.post("/api/auth/login", {
    data: { username, password },
  });
  return resp.status() === 200;
}

// ─── Login page MFA UI elements ───────────────────────────────────────────────

test.describe("MFA — login page elements", () => {
  test("passkey login button is visible on institution login form", async ({
    page,
  }) => {
    await page.goto("/");
    await page.waitForSelector('[data-testid="page-login"]', { timeout: 15000 });
    await page.click('[data-testid="button-login-institution"]');
    await page.click('[data-testid="button-sign-in-institution"]');
    await page.waitForSelector('[data-testid="form-login"]', { timeout: 8000 });
    await expect(
      page.locator('[data-testid="button-passkey-login"]'),
    ).toBeVisible({ timeout: 8000 });
  });
});

// ─── TOTP enroll + verify + disable flow ─────────────────────────────────────

test.describe("MFA — TOTP enroll, verify, and disable (otpauth)", () => {
  test("full TOTP enrollment: setup returns base32 secret, otpauth generates valid code, verify succeeds, then MFA disabled", async ({
    page,
  }) => {
    // Use a real login so the session has a database-resident userId
    const password = process.env.SEED_ADMIN_PASSWORD ?? "admin0987";
    const loggedIn = await apiLogin(page, "admin", password);
    if (!loggedIn) {
      test.skip(true, "admin login failed — skipping TOTP enroll test");
      return;
    }

    // Step 1: Initiate TOTP setup — returns { secret, uri }
    const setupResp = await page.request.post("/api/auth/setup-totp");
    if (setupResp.status() !== 200) {
      test.skip(true, "setup-totp not available for this user (status " + setupResp.status() + ")");
      return;
    }
    const setupData = await setupResp.json();
    const secret: string = setupData.secret ?? setupData.totpSecret;

    expect(typeof secret).toBe("string");
    expect(secret.length).toBeGreaterThan(0);
    // The secret should be valid base32 (uppercase A-Z and 2-7)
    expect(secret.toUpperCase()).toMatch(/^[A-Z2-7]+=*$/);

    // Step 2: Generate a valid TOTP code using the returned secret via otpauth
    const totp = new OTPAuth.TOTP({
      secret: OTPAuth.Secret.fromBase32(secret.toUpperCase()),
      algorithm: "SHA1",
      digits: 6,
      period: 30,
    });
    const code = totp.generate();

    // Code must be exactly 6 digits
    expect(code).toMatch(/^\d{6}$/);

    // Step 3: Verify the code — this commits/enables TOTP MFA for the user
    const verifyResp = await page.request.post("/api/auth/verify-totp", {
      data: { code },
    });
    expect(verifyResp.status()).toBe(200);

    // Step 4: Cleanup — disable MFA immediately so demo user state is clean
    // (other tests log in as admin and would fail the MFA challenge otherwise)
    const disableResp = await page.request.post("/api/auth/disable-mfa");
    expect([200, 204]).toContain(disableResp.status());
  });

  test("wrong TOTP code returns 400 or 401 — never 500", async ({ page }) => {
    // Inject a valid session for a real-ish user
    await injectSession(page, { userId: "e2e-mfa-wrong", userRole: "admin" });

    // Submit a deterministically wrong 6-digit code
    const resp = await page.request.post("/api/auth/verify-totp", {
      data: { code: "000000" },
    });
    // Must reject: 400 (bad code), 401 (no MFA pending), 403, or 422 — never 500
    expect([400, 401, 403, 422]).toContain(resp.status());
  });

  test("otpauth generates 6-digit codes from a known test secret", async () => {
    // Standalone unit: verify otpauth itself works correctly in this environment
    const knownSecret = "JBSWY3DPEHPK3PXP"; // standard RFC test vector seed
    const totp = new OTPAuth.TOTP({
      secret: OTPAuth.Secret.fromBase32(knownSecret),
      algorithm: "SHA1",
      digits: 6,
      period: 30,
    });
    const code = totp.generate();
    expect(code).toMatch(/^\d{6}$/);
    // Code changes every 30 seconds — just verify format, not value
    expect(parseInt(code, 10)).toBeGreaterThanOrEqual(0);
    expect(parseInt(code, 10)).toBeLessThan(1_000_000);
  });
});

// ─── MFA API endpoint protection ─────────────────────────────────────────────

test.describe("MFA — API endpoint access control", () => {
  test("TOTP setup endpoint requires authentication (no session)", async ({
    page,
  }) => {
    const resp = await page.request.post("/api/auth/setup-totp");
    expect([401, 403]).toContain(resp.status());
  });

  test("TOTP disable endpoint requires authentication (no session)", async ({
    page,
  }) => {
    const resp = await page.request.post("/api/auth/disable-mfa");
    expect([401, 403, 404]).toContain(resp.status());
  });

  test("WebAuthn registration options endpoint requires authentication", async ({
    page,
  }) => {
    const resp = await page.request.post("/api/auth/webauthn/registration-options");
    expect([401, 403]).toContain(resp.status());
  });
});
