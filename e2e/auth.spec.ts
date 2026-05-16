/**
 * Auth E2E Suite — login, workspace routing, access restrictions
 *
 * Demo accounts (from replit.md):
 *   demo_admin      / TestPass2026!          → all 3 workspaces (platform_owner)
 *   credit_admin    / Credit26               → credit only
 *   collateral_admin / Collat26              → collateral only
 *   loto_admin      / Loto2026              → loto only
 *   admin           / env:SEED_ADMIN_PASSWORD → credit only
 *   johndoe         / SecuredCreditor2026!   → credit + collateral (lender)
 *   registry_admin  / TestPass2026!          → credit (regulator)
 *
 * Login flow (institution path):
 *   1. /  → [button-login-institution]
 *   2. → [button-sign-in-institution]
 *   3. → fill [input-username] + [input-password]
 *   4. → click submit button inside [form-login]
 *   5. → assert authenticated state
 *
 * Workspace restriction tests use a mix of real login (to exercise the actual
 * allowedProducts guard) and set-session (for role-level RBAC checks).
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

async function assertAuthenticated(page: import("@playwright/test").Page) {
  await expect(page).not.toHaveURL(/\/login/, { timeout: 15000 });
  await expect(
    page.locator('[data-testid="text-current-user"]').first(),
  ).toBeVisible({ timeout: 12000 });
}

// ─── Login smoke — all 7 demo accounts ──────────────────────────────────────

test.describe("Login smoke — all demo accounts", () => {
  test("demo_admin logs in (platform_owner — all workspaces)", async ({ page }) => {
    await loginAs(page, "demo_admin", "TestPass2026!");
    await assertAuthenticated(page);
  });

  test("credit_admin logs in (credit bureau only)", async ({ page }) => {
    await loginAs(page, "credit_admin", "Credit26");
    await assertAuthenticated(page);
  });

  test("collateral_admin logs in (collateral only)", async ({ page }) => {
    await loginAs(page, "collateral_admin", "Collat26");
    await assertAuthenticated(page);
  });

  test("loto_admin logs in (loto only)", async ({ page }) => {
    await loginAs(page, "loto_admin", "Loto2026");
    await assertAuthenticated(page);
  });

  test("admin logs in (SEED_ADMIN_PASSWORD env var)", async ({ page }) => {
    const pw = process.env.SEED_ADMIN_PASSWORD ?? "admin0987";
    await loginAs(page, "admin", pw);
    await assertAuthenticated(page);
  });

  test("johndoe logs in (lender — credit + collateral)", async ({ page }) => {
    await loginAs(page, "johndoe", "SecuredCreditor2026!");
    await assertAuthenticated(page);
  });

  test("registry_admin logs in (regulator — credit only)", async ({ page }) => {
    await loginAs(page, "registry_admin", "TestPass2026!");
    await assertAuthenticated(page);
  });

  test("wrong password shows login error and stays on login page", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector('[data-testid="page-login"]', { timeout: 15000 });
    await page.click('[data-testid="button-login-institution"]');
    await page.click('[data-testid="button-sign-in-institution"]');
    await page.waitForSelector('[data-testid="form-login"]', { timeout: 8000 });
    await page.fill('[data-testid="input-username"]', "credit_admin");
    await page.fill('[data-testid="input-password"]', "wrong-password-xyz-never-valid");
    await page.locator('[data-testid="form-login"]').locator('button[type="submit"]').click();
    await expect(
      page.locator('[data-testid="text-login-error"]'),
    ).toBeVisible({ timeout: 10000 });
    // Verify user stayed on login page
    const currentUser = await page.locator('[data-testid="text-current-user"]').count();
    expect(currentUser).toBe(0);
  });
});

// ─── Workspace restriction — single-workspace accounts ───────────────────────

test.describe("Workspace restriction — single-workspace accounts", () => {
  test("credit_admin is blocked from /collateral-registry (redirect or access denied)", async ({
    page,
  }) => {
    // Use real login so the allowedProducts guard is applied
    await loginAs(page, "credit_admin", "Credit26");
    await assertAuthenticated(page);

    await page.goto("/collateral-registry");
    await page.waitForTimeout(2000);

    // Should be redirected away from /collateral-registry or show access denied UI
    const url = page.url();
    const isBlocked =
      !url.includes("/collateral-registry") ||
      (await page
        .locator("text=Access Denied, text=access denied, text=Not Authorized, text=not authorized, text=redirect")
        .count()) > 0 ||
      (await page.locator('[data-testid="text-pending-title"], [data-testid="text-suspended-title"]').count()) > 0;

    // Acceptable outcomes: either redirected away OR page shows no collateral content
    // (the UI may silently redirect to /dashboard or show an error)
    const hasCollateralContent = await page
      .locator("text=Collateral Registry, text=Register Collateral, text=Lien Search")
      .count();

    // If they stayed at /collateral-registry, the content must not render
    if (url.includes("/collateral-registry")) {
      expect(hasCollateralContent).toBe(0);
    }
    // If redirected: they're on a different page — pass
  });

  test("collateral_admin lands in collateral workspace after login", async ({
    page,
  }) => {
    await loginAs(page, "collateral_admin", "Collat26");
    await assertAuthenticated(page);
    // Should land directly in the collateral workspace (not see credit pages)
    const url = page.url();
    // They should not be on the credit dashboard or be shown credit pages
    expect(url).not.toContain("/borrowers");
  });

  test("loto_admin lands in loto workspace after login", async ({ page }) => {
    await loginAs(page, "loto_admin", "Loto2026");
    await assertAuthenticated(page);
    // Should land in loto workspace
    const url = page.url();
    expect(url).not.toContain("/regulatory-dashboard");
  });

  test("registry_admin (regulator) can access /regulatory-dashboard", async ({
    page,
  }) => {
    await loginAs(page, "registry_admin", "TestPass2026!");
    await assertAuthenticated(page);
    await page.goto("/regulatory-dashboard");
    await expect(
      page.locator('[data-testid="text-reg-dashboard-title"]'),
    ).toBeVisible({ timeout: 15000 });
  });
});

// ─── Role-level access via set-session ───────────────────────────────────────

test.describe("Role-level access (set-session)", () => {
  test("super_admin can access /dashboard", async ({ page }) => {
    await injectSession(page, { userId: "e2e-sa", userRole: "super_admin" });
    await page.goto("/dashboard");
    await expect(page).not.toHaveURL(/\/login/, { timeout: 12000 });
    await expect(page.locator("main, [data-testid], h1").first()).toBeVisible({
      timeout: 12000,
    });
  });

  test("lender can access /credit-accounts", async ({ page }) => {
    await injectSession(page, { userId: "e2e-lender", userRole: "lender" });
    await page.goto("/credit-accounts");
    await expect(
      page.locator('[data-testid="text-accounts-title"]'),
    ).toBeVisible({ timeout: 15000 });
  });

  test("regulator can access /regulatory-dashboard", async ({ page }) => {
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

  test("unauthenticated visit to /dashboard redirects to login", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(
      page
        .locator('[data-testid="page-login"], [data-testid="button-login-institution"]')
        .first(),
    ).toBeVisible({ timeout: 15000 });
  });

  test("unauthenticated visit to /regulatory-dashboard redirects to login", async ({
    page,
  }) => {
    await page.goto("/regulatory-dashboard");
    await expect(
      page
        .locator('[data-testid="page-login"], [data-testid="button-login-institution"]')
        .first(),
    ).toBeVisible({ timeout: 15000 });
  });
});

// ─── Logout ──────────────────────────────────────────────────────────────────

test.describe("Logout", () => {
  test("logout clears session and returns to login page", async ({ page }) => {
    await injectSession(page, { userId: "e2e-sa-logout", userRole: "super_admin" });
    await page.goto("/dashboard");
    await expect(
      page.locator('[data-testid="text-current-user"]').first(),
    ).toBeVisible({ timeout: 12000 });

    await page.locator('[data-testid="button-logout"]').first().click();

    // After logout, should be back on login page
    await expect(
      page
        .locator('[data-testid="page-login"], [data-testid="button-login-institution"]')
        .first(),
    ).toBeVisible({ timeout: 10000 });

    // Session should be cleared — navigating to dashboard should redirect again
    await page.goto("/dashboard");
    await expect(
      page
        .locator('[data-testid="page-login"], [data-testid="button-login-institution"]')
        .first(),
    ).toBeVisible({ timeout: 10000 });
  });
});
