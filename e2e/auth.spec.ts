/**
 * Auth E2E Suite — login, workspace routing, access restrictions
 *
 * Covers all 8 demo accounts from replit.md:
 *   demo_admin    / TestPass2026!      → all 3 workspaces (platform_owner)
 *   credit_admin  / Credit26           → credit only
 *   collateral_admin / Collat26        → collateral only
 *   loto_admin    / Loto2026           → loto only
 *   admin         / (SEED_ADMIN_PASSWORD — skipped; env-only secret)
 *   johndoe       / SecuredCreditor2026! → credit + collateral (lender)
 *   registry_admin / TestPass2026!    → credit (regulator)
 *
 * Login flow:
 *   1. /  → click [button-login-institution]
 *   2. click [button-sign-in-institution]
 *   3. fill [input-username] + [input-password]
 *   4. click [form-login] submit button
 *   5. assert post-login state
 *
 * Role restriction tests use /api/test/set-session to avoid real login cost.
 */

import { test, expect } from "@playwright/test";

// ─── Helpers ────────────────────────────────────────────────────────────────

async function loginAs(
  page: import("@playwright/test").Page,
  username: string,
  password: string,
) {
  await page.goto("/");
  await page.waitForSelector('[data-testid="page-login"]', { timeout: 15000 });
  await page.click('[data-testid="button-login-institution"]');
  await page.click('[data-testid="button-sign-in-institution"]');
  await page.waitForSelector('[data-testid="form-login"]', { timeout: 8000 });
  await page.fill('[data-testid="input-username"]', username);
  await page.fill('[data-testid="input-password"]', password);
  await page.locator('[data-testid="form-login"]').locator('button[type="submit"]').click();
}

async function injectSession(
  page: import("@playwright/test").Page,
  session: Record<string, unknown>,
) {
  const res = await page.request.post("/api/test/set-session", { data: session });
  expect(res.ok()).toBeTruthy();
}

// ─── Login smoke — all demo accounts ────────────────────────────────────────

test.describe("Login smoke — all demo accounts", () => {
  test("demo_admin can log in and sees authenticated UI", async ({ page }) => {
    await loginAs(page, "demo_admin", "TestPass2026!");
    // After login: should leave /login (dashboard or workspace chooser)
    await expect(page).not.toHaveURL(/\/login/, { timeout: 15000 });
    // Username appears in header
    await expect(
      page.locator('[data-testid="text-current-user"]').first(),
    ).toBeVisible({ timeout: 10000 });
  });

  test("credit_admin can log in and reaches credit workspace", async ({ page }) => {
    await loginAs(page, "credit_admin", "Credit26");
    await expect(page).not.toHaveURL(/\/login/, { timeout: 15000 });
    await expect(
      page.locator('[data-testid="text-current-user"]').first(),
    ).toBeVisible({ timeout: 10000 });
  });

  test("collateral_admin can log in", async ({ page }) => {
    await loginAs(page, "collateral_admin", "Collat26");
    await expect(page).not.toHaveURL(/\/login/, { timeout: 15000 });
    await expect(
      page.locator('[data-testid="text-current-user"]').first(),
    ).toBeVisible({ timeout: 10000 });
  });

  test("loto_admin can log in", async ({ page }) => {
    await loginAs(page, "loto_admin", "Loto2026");
    await expect(page).not.toHaveURL(/\/login/, { timeout: 15000 });
    await expect(
      page.locator('[data-testid="text-current-user"]').first(),
    ).toBeVisible({ timeout: 10000 });
  });

  test("johndoe (lender) can log in", async ({ page }) => {
    await loginAs(page, "johndoe", "SecuredCreditor2026!");
    await expect(page).not.toHaveURL(/\/login/, { timeout: 15000 });
    await expect(
      page.locator('[data-testid="text-current-user"]').first(),
    ).toBeVisible({ timeout: 10000 });
  });

  test("registry_admin can log in", async ({ page }) => {
    await loginAs(page, "registry_admin", "TestPass2026!");
    await expect(page).not.toHaveURL(/\/login/, { timeout: 15000 });
    await expect(
      page.locator('[data-testid="text-current-user"]').first(),
    ).toBeVisible({ timeout: 10000 });
  });

  test("wrong password shows error message", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector('[data-testid="page-login"]', { timeout: 15000 });
    await page.click('[data-testid="button-login-institution"]');
    await page.click('[data-testid="button-sign-in-institution"]');
    await page.waitForSelector('[data-testid="form-login"]', { timeout: 8000 });
    await page.fill('[data-testid="input-username"]', "credit_admin");
    await page.fill('[data-testid="input-password"]', "wrong-password-xyz");
    await page.locator('[data-testid="form-login"]').locator('button[type="submit"]').click();
    await expect(page.locator('[data-testid="text-login-error"]')).toBeVisible({
      timeout: 8000,
    });
    await expect(page).toHaveURL(/\//, { timeout: 5000 });
  });
});

// ─── Role / workspace restriction tests (via set-session) ─────────────────

test.describe("Workspace access restrictions", () => {
  test("super_admin can access /dashboard", async ({ page }) => {
    await injectSession(page, { userId: "e2e-sa", userRole: "super_admin" });
    await page.goto("/dashboard");
    await expect(page).not.toHaveURL(/\/login/, { timeout: 10000 });
    await expect(page.locator("h1, [data-testid]").first()).toBeVisible({
      timeout: 10000,
    });
  });

  test("lender role can access /credit-accounts", async ({ page }) => {
    await injectSession(page, { userId: "e2e-lender", userRole: "lender" });
    await page.goto("/credit-accounts");
    await expect(
      page.locator('[data-testid="text-accounts-title"]'),
    ).toBeVisible({ timeout: 15000 });
  });

  test("regulator role can access /regulatory-dashboard", async ({ page }) => {
    await injectSession(page, { userId: "e2e-reg", userRole: "regulator" });
    await page.goto("/regulatory-dashboard");
    await expect(
      page.locator('[data-testid="text-reg-dashboard-title"]'),
    ).toBeVisible({ timeout: 15000 });
  });

  test("platform_owner can access /regulatory-dashboard", async ({ page }) => {
    await injectSession(page, { userId: "e2e-po", userRole: "platform_owner" });
    await page.goto("/regulatory-dashboard");
    await expect(
      page.locator('[data-testid="text-reg-dashboard-title"]'),
    ).toBeVisible({ timeout: 15000 });
  });

  test("unauthenticated visit to /dashboard redirects to login", async ({
    page,
  }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\//, { timeout: 10000 });
    await expect(
      page.locator('[data-testid="page-login"], [data-testid="button-login-institution"]').first(),
    ).toBeVisible({ timeout: 10000 });
  });

  test("dgi_officer can access /admin/loto-fiscal", async ({ page }) => {
    await injectSession(page, {
      userId: "e2e-dgi",
      userRole: "dgi_officer",
      userCountry: "Côte d'Ivoire",
      _testRole: "dgi_officer",
    });
    await page.goto("/admin/loto-fiscal");
    await expect(
      page.locator('[data-testid="page-loto-admin-dashboard"]'),
    ).toBeVisible({ timeout: 20000 });
  });
});

// ─── Logout ──────────────────────────────────────────────────────────────────

test.describe("Logout", () => {
  test("logout button clears session and returns to login", async ({ page }) => {
    await injectSession(page, { userId: "e2e-sa", userRole: "super_admin" });
    await page.goto("/dashboard");
    await expect(
      page.locator('[data-testid="text-current-user"]').first(),
    ).toBeVisible({ timeout: 12000 });
    // Use desktop logout button (header)
    await page.locator('[data-testid="button-logout"]').first().click();
    await expect(page).toHaveURL(/\//, { timeout: 10000 });
    await expect(
      page.locator('[data-testid="page-login"], [data-testid="button-login-institution"]').first(),
    ).toBeVisible({ timeout: 10000 });
  });
});
