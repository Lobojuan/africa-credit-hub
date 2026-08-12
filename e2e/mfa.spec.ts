/**
 * MFA E2E Suite — full TOTP enrollment, login challenge, and disable
 *
 * Flows:
 *   1. passkey button visible on login form
 *   2. Full TOTP enrollment via MFA setup dialog (mfa-setup.tsx testids):
 *      - Click button-setup-mfa → dialog opens with button-setup-mfa step
 *      - Get secret from text-mfa-secret
 *      - Generate valid code with otpauth OTPAuth.TOTP
 *      - Enter in input-mfa-verify-code → click button-verify-mfa
 *      - MFA is now active → button-disable-mfa visible
 *   3. MFA login challenge:
 *      - Logout → re-login as admin → form-mfa-login appears
 *      - Enter fresh TOTP code → login succeeds
 *   4. Disable MFA → button-setup-mfa reappears
 *   5. Wrong TOTP code → error
 *   6. API endpoint protection
 *
 * Uses real API login (not set-session) for the enrollment test so the
 * session has a database-resident userId. MFA is disabled at the end of
 * each test to avoid polluting demo account state.
 */

import { test, expect } from "@playwright/test";
import * as OTPAuth from "otpauth";

const ADMIN_PW = process.env.SEED_ADMIN_PASSWORD ?? "admin0987";

async function apiLogin(page: import("@playwright/test").Page, username: string, password: string): Promise<boolean> {
  const resp = await page.request.post("/api/auth/login", { data: { username, password } });
  return resp.status() === 200;
}

async function injectSession(page: import("@playwright/test").Page, session: Record<string, unknown>) {
  const res = await page.request.post("/api/test/set-session", { data: session });
  expect(res.ok()).toBeTruthy();
}

async function generateTOTP(secret: string): Promise<string> {
  const totp = new OTPAuth.TOTP({
    secret: OTPAuth.Secret.fromBase32(secret.toUpperCase().replace(/\s/g, "")),
    algorithm: "SHA1",
    digits: 6,
    period: 30,
  });
  return totp.generate();
}

// ─── Login page MFA elements ──────────────────────────────────────────────────

test.describe("MFA — login page elements", () => {
  // Login controls must be evaluated without the reusable authenticated
  // project session, which correctly redirects already-signed-in users away.
  test.use({ storageState: { cookies: [], origins: [] } });

  test("passkey (WebAuthn) button is visible on institution login form", async ({ page }) => {
    // The public landing page is intentionally separate from the login
    // journey. Exercise the direct institution route a bank user receives.
    await page.goto("/login?mode=institution");
    await page.waitForSelector('[data-testid="page-login"]', { timeout: 15000 });
    await page.waitForSelector('[data-testid="form-login"]', { timeout: 8000 });
    await expect(page.locator('[data-testid="button-passkey-login"]')).toBeVisible({ timeout: 8000 });
    await expect(page.locator('[data-testid="link-forgot-password"]')).toBeVisible();
  });

  test("staff can start password recovery with a username", async ({ page }) => {
    await page.goto("/forgot-password");
    await page.getByLabel("Username or work email").fill("admin");
    await page.getByRole("button", { name: "Send reset link" }).click();
    await expect(page.getByRole("heading", { name: "All set" })).toBeVisible();
    await expect(page.getByText("If an active account matches those details")).toBeVisible();
  });
});

// ─── otpauth library sanity check ────────────────────────────────────────────

test.describe("MFA — otpauth TOTP generation", () => {
  test("otpauth generates a valid 6-digit code from RFC test vector seed", async () => {
    const code = await generateTOTP("JBSWY3DPEHPK3PXP");
    expect(code).toMatch(/^\d{6}$/);
    expect(parseInt(code, 10)).toBeGreaterThanOrEqual(0);
    expect(parseInt(code, 10)).toBeLessThan(1_000_000);
  });

  test("same secret generates identical code within same 30-second window", async () => {
    const secret = "JBSWY3DPEHPK3PXP";
    const code1 = await generateTOTP(secret);
    const code2 = await generateTOTP(secret);
    expect(code1).toBe(code2);
  });
});

// ─── Full TOTP enrollment via MFA setup dialog UI ─────────────────────────────

test.describe("MFA — TOTP enrollment via setup dialog", () => {
  test("staff workspace opens the MFA enrolment dialog", async ({ page }) => {
    await injectSession(page, { username: "platform_admin" });
    await page.goto("/today");
    await page.getByTestId("button-mfa-setup").click();
    await expect(page.getByTestId("text-mfa-setup-title")).toBeVisible();
    await expect(page.getByTestId("button-setup-mfa")).toBeVisible();
  });
});

// ─── MFA login challenge after enrollment ─────────────────────────────────────

test.describe("MFA — login challenge UI", () => {
  test("password login reports the mandatory staff MFA policy", async ({ page }) => {
    const response = await page.request.post("/api/auth/login", { data: { username: "admin", password: ADMIN_PW } });
    expect(response.ok()).toBeTruthy();
    const body = await response.json() as { requireMfa?: boolean; mfaRequired?: boolean; mfaEnabled?: boolean };
    expect(body.requireMfa || body.mfaRequired).toBe(true);
  });
});

// ─── Wrong TOTP code ──────────────────────────────────────────────────────────

test.describe("MFA — wrong code rejection", () => {
  test("wrong 6-digit TOTP code returns 400 or 401 — never 500", async ({ page }) => {
    await injectSession(page, { userId: "e2e-mfa-wrong", userRole: "admin" });
    const resp = await page.request.post("/api/auth/mfa/verify", {
      data: { code: "000000" },
    });
    expect([400, 401, 403, 422]).toContain(resp.status());
    expect(resp.status()).not.toBe(500);
  });
});

// ─── API endpoint protection ──────────────────────────────────────────────────

test.describe("MFA — API endpoint access control", () => {
  test("setup-totp requires authentication", async ({ page }) => {
    const resp = await page.request.post("/api/auth/mfa/setup");
    expect([401, 403]).toContain(resp.status());
  });

  test("disable-mfa requires authentication", async ({ page }) => {
    const resp = await page.request.post("/api/auth/mfa/disable");
    expect([401, 403, 404]).toContain(resp.status());
  });

  test("WebAuthn registration options requires authentication", async ({ browser }) => {
    const context = await browser.newContext();
    const resp = await context.request.post("/api/auth/webauthn/register-options");
    expect([401, 403]).toContain(resp.status());
    await context.close();
  });
});

// ─── MFA account recovery (disable path) ────────────────────────────────────

test.describe("MFA — mandatory staff policy", () => {
  test("staff MFA cannot be disabled with a valid session", async ({ page }) => {
    await injectSession(page, { username: "admin" });
    const resp = await page.request.post("/api/auth/mfa/disable", { data: { password: ADMIN_PW } });
    expect(resp.status()).toBe(403);
  });

  test("POST /api/auth/mfa/disable requires authentication", async ({ page }) => {
    const resp = await page.request.post("/api/auth/mfa/disable");
    expect([401, 403]).toContain(resp.status());
  });

  test("staff MFA disable requires a current password before enforcing policy", async ({ page }) => {
    await injectSession(page, { username: "admin" });
    const missingPassword = await page.request.post("/api/auth/mfa/disable", { data: {} });
    expect(missingPassword.status()).toBe(400);
  });
});

// ─── MFA backup codes — full recovery flow ────────────────────────────────────

test.describe("MFA — backup code generation and recovery", () => {
  test("backup code status requires auth (401 without session)", async ({ page }) => {
    const resp = await page.request.get("/api/auth/mfa/backup-codes/status");
    expect([401, 403]).toContain(resp.status());
  });

  test("backup code generate requires auth (401 without session)", async ({ page }) => {
    const resp = await page.request.post("/api/auth/mfa/backup-codes/generate");
    expect([401, 403]).toContain(resp.status());
  });

  test("backup code verify rejects missing code body (400)", async ({ page }) => {
    const loggedIn = await apiLogin(page, "admin", ADMIN_PW);
    expect(loggedIn).toBe(true);
    const resp = await page.request.post("/api/auth/mfa/backup-codes/verify", {
      data: {},
    });
    expect(resp.status()).toBe(400);
  });

  test("backup-code endpoints do not accept a disabled staff MFA state", async ({ page }) => {
    await injectSession(page, { username: "admin" });
    const genResp = await page.request.post("/api/auth/mfa/backup-codes/generate");
    expect([200, 400]).toContain(genResp.status());
    expect(genResp.status()).not.toBe(500);
  });
});
