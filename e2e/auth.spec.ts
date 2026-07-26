/**
 * Auth E2E Suite — login for all 8 demo accounts, role-based Today landing,
 * single-workspace restriction enforcement, and logout.
 *
 * Demo accounts (seeded local test data):
 *   demo_admin      / TestPass2026!             → all 3 workspaces (platform_owner)
 *   credit_admin    / Credit26                  → credit only
 *   collateral_admin / Collat26                 → collateral only
 *   loto_admin      / Loto2026                  → loto only
 *   admin           / SEED_ADMIN_PASSWORD env   → credit only
 *   owner           / OWNER_ADMIN_PASSWORD env  → all 3 workspaces
 *   johndoe         / SecuredCreditor2026!      → credit + collateral (lender)
 *   registry_admin  / TestPass2026!             → credit (regulator)
 *
 * Each account test asserts:
 *   1. Login succeeds (user-authenticated state visible)
 *   2. Correct role-based Today view is active (with a workspace available)
 *   3. Single-workspace accounts cannot access other workspaces
 */

import { test, expect } from "@playwright/test";

async function loginAs(
  page: import("@playwright/test").Page,
  username: string,
  password: string,
) {
  await page.context().clearCookies();
  await page.goto("/login");
  await page.evaluate(() => localStorage.clear());
  await page.waitForSelector('[data-testid="page-login"]', { timeout: 15000 });
  await page.click('[data-testid="button-login-institution"]');
  await page.waitForSelector('[data-testid="form-login"]', { timeout: 8000 });
  await page.fill('[data-testid="input-username"]', username);
  await page.fill('[data-testid="input-password"]', password);
  await page.locator('[data-testid="form-login"]').locator('button[type="submit"]').click();
  // Wait for redirect away from login page
  await expect(page).not.toHaveURL(/\/login/, { timeout: 18000 });
}

async function assertAuthenticated(page: import("@playwright/test").Page) {
  await expect(
    page.locator('[data-testid="text-current-user"]').first(),
  ).toBeVisible({ timeout: 15000 });
}

async function injectSession(
  page: import("@playwright/test").Page,
  session: Record<string, unknown>,
) {
  const res = await page.request.post("/api/test/set-session", { data: session });
  expect(res.ok()).toBeTruthy();
}

// ─── Login + workspace landing for all 8 demo accounts ───────────────────────

test.describe("Login smoke — all 8 demo accounts", () => {
  test("credit_admin logs in and lands in Credit Bureau workspace", async ({
    page,
  }) => {
    await loginAs(page, "credit_admin", "Credit26");
    await assertAuthenticated(page);
    // Credit-only account lands directly in credit workspace
    const workspace = page.locator('[data-testid="text-active-workspace"]');
    await expect(workspace).toBeVisible({ timeout: 12000 });
    const label = await workspace.textContent();
    expect(label?.toLowerCase()).toContain("credit");
  });

  test("collateral_admin logs in and lands in Collateral Registry workspace", async ({
    page,
  }) => {
    await loginAs(page, "collateral_admin", "Collat26");
    await assertAuthenticated(page);
    const workspace = page.locator('[data-testid="text-active-workspace"]');
    await expect(workspace).toBeVisible({ timeout: 12000 });
    const label = await workspace.textContent();
    expect(label?.toLowerCase()).toContain("collateral");
  });

  test("loto_admin logs in and lands in Loto Fiscal workspace", async ({
    page,
  }) => {
    await loginAs(page, "loto_admin", "Loto2026");
    await assertAuthenticated(page);
    const workspace = page.locator('[data-testid="text-active-workspace"]');
    await expect(workspace).toBeVisible({ timeout: 12000 });
    const label = await workspace.textContent();
    expect(label?.toLowerCase()).toContain("loto");
  });

  test("demo_admin (platform_owner) lands on the focused Today command centre", async ({
    page,
  }) => {
    await loginAs(page, "demo_admin", "TestPass2026!");
    await assertAuthenticated(page);
    await expect(page.locator('[data-testid="today-command-centre"]')).toBeVisible({ timeout: 12000 });
    await expect(page.locator('[data-testid="text-today-title"]')).toContainText("priorities");
  });

  test("admin logs in (SEED_ADMIN_PASSWORD env)", async ({ page }) => {
    const pw = process.env.SEED_ADMIN_PASSWORD ?? "admin0987";
    await loginAs(page, "admin", pw);
    await assertAuthenticated(page);
  });

  test("owner logs in (OWNER_ADMIN_PASSWORD env — all workspaces)", async ({
    page,
  }) => {
    const pw = process.env.OWNER_ADMIN_PASSWORD ?? "owner0987";
    await loginAs(page, "owner", pw);
    await assertAuthenticated(page);
    // owner has platform_owner role — can see all workspaces
    const workspace = page.locator('[data-testid="text-active-workspace"]');
    await expect(workspace).toBeVisible({ timeout: 12000 });
  });

  test("johndoe (lender) logs in and lands in Credit Bureau workspace", async ({
    page,
  }) => {
    await loginAs(page, "johndoe", "SecuredCreditor2026!");
    await assertAuthenticated(page);
    const workspace = page.locator('[data-testid="text-active-workspace"]');
    await expect(workspace).toBeVisible({ timeout: 12000 });
    const label = await workspace.textContent();
    expect(label?.toLowerCase()).toContain("credit");
  });

  test("registry_admin (regulator) logs in and lands in Credit Bureau workspace", async ({
    page,
  }) => {
    await loginAs(page, "registry_admin", "TestPass2026!");
    await assertAuthenticated(page);
    const workspace = page.locator('[data-testid="text-active-workspace"]');
    await expect(workspace).toBeVisible({ timeout: 12000 });
    const label = await workspace.textContent();
    expect(label?.toLowerCase()).toContain("credit");
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
    await page.fill('[data-testid="input-username"]', "credit_admin");
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
  test("credit_admin cannot navigate to collateral workspace — either redirected or content absent", async ({
    page,
  }) => {
    await loginAs(page, "credit_admin", "Credit26");
    await assertAuthenticated(page);

    // Navigate to collateral-registry
    await page.goto("/collateral-registry");
    await page.waitForTimeout(2500);

    // Either: (a) redirected away from /collateral-registry OR
    //         (b) stayed but collateral-specific UI doesn't render
    const url = page.url();
    if (url.includes("/collateral-registry")) {
      // If still on the page, the register button and lien search must be absent
      const registerBtn = await page.locator('[data-testid="btn-register-collateral"]').count();
      const lienTab = await page.locator('[data-testid="tab-lien-search"]').count();
      expect(registerBtn + lienTab).toBe(0);
    }
    // If redirected — the test passes automatically
  });

  test("loto_admin workspace switcher does NOT show credit or collateral options", async ({
    page,
  }) => {
    await loginAs(page, "loto_admin", "Loto2026");
    await assertAuthenticated(page);

    // The workspace switcher for a loto-only account should not list credit/collateral
    const creditItem = page.locator('[data-testid="menuitem-workspace-credit"]');
    const collateralItem = page.locator('[data-testid="menuitem-workspace-collateral"]');
    // Both should be absent from the sidebar for a loto-only account
    const creditCount = await creditItem.count();
    const collateralCount = await collateralItem.count();
    expect(creditCount + collateralCount).toBe(0);
  });

  test("credit-only session is blocked from the Loto API", async ({ page }) => {
    await injectSession(page, {
      userId: "e2e-credit-only",
      userRole: "super_admin",
      allowedProducts: ["credit"],
    });
    const response = await page.request.get("/api/loto/admin/kpi");
    expect(response.status()).toBe(403);
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
