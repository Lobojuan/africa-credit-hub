/**
 * Auth E2E Suite — the sole live administrator's sign-in security gate,
 * retired-account denial, role-based UI, and logout.
 *
 * Role-specific screens use isolated E2E sessions. They never reactivate the
 * retired accounts that were intentionally removed from normal login access.
 */

import { test, expect } from "@playwright/test";

async function injectSession(
  page: import("@playwright/test").Page,
  session: Record<string, unknown>,
) {
  const res = await page.request.post("/api/test/set-session", { data: session });
  expect(res.ok()).toBeTruthy();
}

// ─── Live login security ─────────────────────────────────────────────────────

test.describe("Live administrator login", () => {
  test("admin login requires an MFA challenge or enrollment before access", async ({ browser }) => {
    const pw = process.env.SEED_ADMIN_PASSWORD ?? "admin0987";
    // Do not inherit the authenticated project's saved session or browser
    // storage: this proves the password entry point itself cannot bypass MFA.
    const context = await browser.newContext();
    const response = await context.request.post("/api/auth/login", {
      data: { username: "admin", password: pw },
    });
    expect(response.ok()).toBeTruthy();
    const result = await response.json() as { requireMfa?: boolean; mfaRequired?: boolean; mfaEnabled?: boolean };
    // An enrolled account gets the code challenge; a legacy account is forced
    // into enrollment. Neither branch may silently become a normal login.
    expect(result.requireMfa || (result.mfaRequired && !result.mfaEnabled)).toBe(true);
    await context.close();
  });
});

// ─── Wrong credentials ────────────────────────────────────────────────────────

test.describe("Login — wrong credentials", () => {
  test("wrong password shows error and user stays unauthenticated", async ({
    page,
  }) => {
    await page.context().clearCookies();
    await page.goto("/login");
    await page.waitForSelector('[data-testid="page-login"]', { timeout: 15000 });
    await page.click('[data-testid="button-login-institution"]');
    await page.waitForSelector('[data-testid="form-login"]', { timeout: 8000 });
    await page.fill('[data-testid="input-username"]', "admin");
    await page.fill('[data-testid="input-password"]', "absolutely-wrong-password-xyz");
    await page.locator('[data-testid="form-login"]').locator('button[type="submit"]').click();

    await expect(
      page.locator('[data-testid="text-login-error"]'),
    ).toBeVisible({ timeout: 10000 });

    // Confirm user was NOT authenticated
    const currentUser = await page.locator('[data-testid="text-current-user"]').count();
    expect(currentUser).toBe(0);
  });
});

// ─── Workspace restriction — single-workspace accounts ───────────────────────

test.describe("Workspace restriction", () => {

  test("credit-only session is blocked from the Loto API", async ({ page }) => {
    await injectSession(page, {
      userId: "e2e-credit-only",
      userRole: "super_admin",
      allowedProducts: ["credit"],
    });
    const response = await page.request.get("/api/loto/admin/kpi");
    expect(response.status()).toBe(403);
  });

  test("regulator session can access /regulatory-dashboard", async ({ page }) => {
    await injectSession(page, { username: "registry_admin" });
    await page.goto("/regulatory-dashboard");
    await expect(
      page.locator('[data-testid="text-reg-dashboard-title"]'),
    ).toBeVisible({ timeout: 15000 });
  });
});

// ─── Role-level access (set-session) ─────────────────────────────────────────

test.describe("Role-level access via set-session", () => {
  test("super_admin accesses /dashboard", async ({ page }) => {
    await injectSession(page, { userId: "e2e-sa", userRole: "super_admin" });
    await page.goto("/dashboard");
    await expect(page).not.toHaveURL(/\/login/, { timeout: 12000 });
    await expect(page.locator("main, h1, [data-testid]").first()).toBeVisible({
      timeout: 12000,
    });
  });

  test("lender accesses /credit-accounts", async ({ page }) => {
    await injectSession(page, { userId: "e2e-lender", userRole: "lender" });
    await page.goto("/credit-accounts");
    await expect(
      page.locator('[data-testid="text-accounts-title"]'),
    ).toBeVisible({ timeout: 15000 });
  });

  test("regulator accesses /regulatory-dashboard", async ({ page }) => {
    // Use the seeded regulator so the dashboard has the organisation and
    // country context that its data queries require.
    await injectSession(page, { username: "registry_admin" });
    await page.goto("/regulatory-dashboard");
    await expect(
      page.locator('[data-testid="text-reg-dashboard-title"]'),
    ).toBeVisible({ timeout: 15000 });
  });

  test("dgi_officer accesses /admin/loto-fiscal", async ({ page }) => {
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

  test("unauthenticated /dashboard redirects to login", async ({ page }) => {
    await page.context().clearCookies();
    await page.goto("/dashboard");
    await expect(
      page
        .locator('[data-testid="page-login"], [data-testid="button-login-institution"]')
        .first(),
    ).toBeVisible({ timeout: 15000 });
  });
});

// ─── Logout ───────────────────────────────────────────────────────────────────

test.describe("Logout", () => {
  test("logout clears authenticated API access", async ({ page }) => {
    await injectSession(page, { username: "platform_admin" });
    // Verify the server-side session boundary directly. The UI redirects to
    // the public landing page after this request, which is already covered by
    // login navigation tests and behaves differently across browser engines.
    const logout = await page.request.post("/api/auth/logout");
    expect(logout.ok()).toBeTruthy();
    const session = await page.request.get("/api/auth/me");
    expect([401, 403]).toContain(session.status());
  });
});
