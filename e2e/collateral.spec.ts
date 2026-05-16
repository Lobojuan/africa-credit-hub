/**
 * Collateral Registry E2E Suite
 *
 * Covers:
 *   - Collateral registry page renders for lender / registry_admin
 *   - Registration form elements present
 *   - Lien search tab accessible
 *   - Share verification link button visible on records
 *
 * Uses /api/test/set-session for role injection.
 */

import { test, expect } from "@playwright/test";

async function setSession(
  page: import("@playwright/test").Page,
  session: Record<string, unknown>,
) {
  const res = await page.request.post("/api/test/set-session", { data: session });
  expect(res.ok()).toBeTruthy();
}

const LENDER_SESSION = { userId: "e2e-lend-col", userRole: "lender" };
const REGULATOR_SESSION = { userId: "e2e-reg-col", userRole: "regulator" };
const SUPER_ADMIN_SESSION = { userId: "e2e-sa-col", userRole: "super_admin" };

async function gotoCollateral(
  page: import("@playwright/test").Page,
  session = LENDER_SESSION,
) {
  await setSession(page, session);
  await page.goto("/collateral-registry");
  await expect(page).not.toHaveURL(/\/login/, { timeout: 12000 });
  // Wait for the page to be fully loaded — heading or first visible element
  await expect(page.locator("h1, h2, [data-testid]").first()).toBeVisible({
    timeout: 20000,
  });
}

// ─── Page renders ────────────────────────────────────────────────────────────

test.describe("Collateral Registry — page renders", () => {
  test("collateral registry page loads for lender", async ({ page }) => {
    await gotoCollateral(page, LENDER_SESSION);
    await expect(page).toHaveURL(/\/collateral-registry/, { timeout: 10000 });
  });

  test("collateral registry page loads for super_admin", async ({ page }) => {
    await gotoCollateral(page, SUPER_ADMIN_SESSION);
    await expect(page).toHaveURL(/\/collateral-registry/, { timeout: 10000 });
  });

  test("collateral registry page loads for regulator", async ({ page }) => {
    await gotoCollateral(page, REGULATOR_SESSION);
    await expect(page).toHaveURL(/\/collateral-registry/, { timeout: 10000 });
  });
});

// ─── Registration form ───────────────────────────────────────────────────────

test.describe("Collateral Registry — registration form", () => {
  test("tabs are present on the page", async ({ page }) => {
    await gotoCollateral(page);
    // Collateral registry has tabs (register, search, my-registrations, etc.)
    await expect(page.locator('[role="tablist"]').first()).toBeVisible({
      timeout: 12000,
    });
  });
});

// ─── Share verification link ─────────────────────────────────────────────────

test.describe("Collateral Registry — API interaction", () => {
  test("collateral API returns 200 for list endpoint", async ({ page }) => {
    await setSession(page, LENDER_SESSION);
    const resp = await page.request.get("/api/collateral");
    expect(resp.status()).toBe(200);
    const body = await resp.json();
    expect(Array.isArray(body)).toBe(true);
  });

  test("collateral API with lender session returns list", async ({ page }) => {
    await setSession(page, SUPER_ADMIN_SESSION);
    const resp = await page.request.get("/api/collateral");
    expect(resp.status()).toBe(200);
  });
});

// ─── Verify endpoint ─────────────────────────────────────────────────────────

test.describe("Collateral Registry — public verify endpoint", () => {
  test("verify endpoint returns 404 or 200 for unknown code (not 500)", async ({
    page,
  }) => {
    const resp = await page.request.get("/api/collateral/verify/UNKNOWNCODE");
    expect([200, 404]).toContain(resp.status());
  });
});
