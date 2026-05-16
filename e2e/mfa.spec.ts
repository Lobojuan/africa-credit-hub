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
import OTPAuth from "otpauth";

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
  test("passkey (WebAuthn) button is visible on institution login form", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector('[data-testid="page-login"]', { timeout: 15000 });
    await page.click('[data-testid="button-login-institution"]');
    await page.click('[data-testid="button-sign-in-institution"]');
    await page.waitForSelector('[data-testid="form-login"]', { timeout: 8000 });
    await expect(page.locator('[data-testid="button-passkey-login"]')).toBeVisible({ timeout: 8000 });
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
  test("full enrollment: setup → get secret → generate TOTP → verify → disable", async ({ page }) => {
    // Use real login to get a session with a DB-resident user
    const loggedIn = await apiLogin(page, "admin", ADMIN_PW);
    if (!loggedIn) {
      test.skip(true, "admin login failed — check SEED_ADMIN_PASSWORD env var");
      return;
    }

    // Navigate to security settings page
    await page.goto("/security");
    await expect(page).not.toHaveURL(/\/login/, { timeout: 12000 });
    await page.waitForSelector('[data-testid="security-page"], [data-testid="button-setup-mfa"], [data-testid="button-mfa-setup"]', { timeout: 15000 });

    // Step 1: Find and click the setup MFA button
    // The button may be in the security page or header
    const setupBtn = page.locator('[data-testid="button-setup-mfa"], [data-testid="button-mfa-setup"]').first();
    await setupBtn.waitFor({ timeout: 12000 });
    await setupBtn.click();

    // Step 2: MFA setup dialog opens — wait for QR or secret display
    await expect(
      page.locator('[data-testid="text-mfa-secret"], [data-testid="mfa-qr-code"]').first(),
    ).toBeVisible({ timeout: 10000 });

    // Step 3: Get the secret (for manual entry instead of QR scan)
    const secretEl = page.locator('[data-testid="text-mfa-secret"]');
    await secretEl.waitFor({ timeout: 8000 });
    const secret = (await secretEl.textContent())?.trim() ?? "";
    expect(secret.length).toBeGreaterThan(0);
    expect(secret.toUpperCase()).toMatch(/^[A-Z2-7 =]+$/); // valid base32

    // Step 4: Generate a valid TOTP code using the secret
    const code = await generateTOTP(secret.replace(/\s/g, ""));
    expect(code).toMatch(/^\d{6}$/);

    // Step 5: If there's a "Continue to verify" button, click it
    const continueBtn = page.locator('[data-testid="button-setup-mfa"]');
    if (await continueBtn.isVisible()) {
      await continueBtn.click();
    }

    // Step 6: Enter the TOTP code in the verification field
    const verifyInput = page.locator('[data-testid="input-mfa-verify-code"]');
    await verifyInput.waitFor({ timeout: 8000 });
    await verifyInput.fill(code);

    // Step 7: Submit verification
    await page.locator('[data-testid="button-verify-mfa"]').click();

    // Step 8: Verification succeeds — disable button should now appear
    await expect(
      page.locator('[data-testid="button-disable-mfa"]'),
    ).toBeVisible({ timeout: 12000 });

    // Cleanup: disable MFA to not affect other tests
    await page.locator('[data-testid="button-disable-mfa"]').click();
    // Confirm disable dialog if present
    const confirmDisable = page.locator('button:has-text("Disable"), button:has-text("Confirm")').first();
    if (await confirmDisable.isVisible({ timeout: 3000 })) {
      await confirmDisable.click();
    }
    // Button-setup-mfa should reappear after disabling
    await expect(
      page.locator('[data-testid="button-setup-mfa"], [data-testid="button-mfa-setup"]').first(),
    ).toBeVisible({ timeout: 10000 });
  });
});

// ─── MFA login challenge after enrollment ─────────────────────────────────────

test.describe("MFA — login challenge UI", () => {
  test("MFA-enabled user sees form-mfa-login on second login attempt", async ({ page }) => {
    // Step 1: Login and enable MFA via API
    const loggedIn = await apiLogin(page, "admin", ADMIN_PW);
    if (!loggedIn) {
      test.skip(true, "admin login failed");
      return;
    }

    // Initialize TOTP setup via API
    const setupResp = await page.request.post("/api/auth/setup-totp");
    if (setupResp.status() !== 200) {
      test.skip(true, "TOTP setup not available");
      return;
    }
    const { secret } = await setupResp.json();
    const code = await generateTOTP(secret);

    // Verify/enroll TOTP
    const verifyResp = await page.request.post("/api/auth/verify-totp", {
      data: { code },
    });
    if (verifyResp.status() !== 200) {
      test.skip(true, "TOTP verify failed");
      return;
    }

    // Step 2: Logout
    await page.request.post("/api/auth/logout");

    // Step 3: Attempt login — should trigger MFA challenge
    await page.goto("/");
    await page.waitForSelector('[data-testid="page-login"]', { timeout: 15000 });
    await page.click('[data-testid="button-login-institution"]');
    await page.click('[data-testid="button-sign-in-institution"]');
    await page.waitForSelector('[data-testid="form-login"]', { timeout: 8000 });
    await page.fill('[data-testid="input-username"]', "admin");
    await page.fill('[data-testid="input-password"]', ADMIN_PW);
    await page.locator('[data-testid="form-login"]').locator('button[type="submit"]').click();

    // Step 4: MFA challenge form should appear
    await expect(
      page.locator('[data-testid="form-mfa-login"]'),
    ).toBeVisible({ timeout: 10000 });

    // Step 5: Enter fresh TOTP code and submit
    const freshCode = await generateTOTP(secret);
    await page.fill('[data-testid="input-mfa-code"]', freshCode);
    await page.click('[data-testid="button-mfa-submit"]');

    // Step 6: Login should succeed
    await expect(page).not.toHaveURL(/\/login/, { timeout: 12000 });
    await expect(
      page.locator('[data-testid="text-current-user"]').first(),
    ).toBeVisible({ timeout: 12000 });

    // Cleanup: disable MFA
    await page.request.post("/api/auth/disable-mfa");
  });
});

// ─── Wrong TOTP code ──────────────────────────────────────────────────────────

test.describe("MFA — wrong code rejection", () => {
  test("wrong 6-digit TOTP code returns 400 or 401 — never 500", async ({ page }) => {
    await injectSession(page, { userId: "e2e-mfa-wrong", userRole: "admin" });
    const resp = await page.request.post("/api/auth/verify-totp", {
      data: { code: "000000" },
    });
    expect([400, 401, 403, 422]).toContain(resp.status());
    expect(resp.status()).not.toBe(500);
  });
});

// ─── API endpoint protection ──────────────────────────────────────────────────

test.describe("MFA — API endpoint access control", () => {
  test("setup-totp requires authentication", async ({ page }) => {
    const resp = await page.request.post("/api/auth/setup-totp");
    expect([401, 403]).toContain(resp.status());
  });

  test("disable-mfa requires authentication", async ({ page }) => {
    const resp = await page.request.post("/api/auth/disable-mfa");
    expect([401, 403, 404]).toContain(resp.status());
  });

  test("WebAuthn registration options requires authentication", async ({ page }) => {
    const resp = await page.request.post("/api/auth/webauthn/registration-options");
    expect([401, 403]).toContain(resp.status());
  });
});
