/**
 * Reports Drill-Down E2E Suite
 *
 * Tests the reports page:
 *   - Page renders with title and export controls
 *   - Portfolio by Institution table rows exist
 *   - Clicking a lender row navigates to /credit-accounts?lender=<name>
 *   - Filter banner shows and clear button resets to /credit-accounts
 *
 * Uses /api/test/set-session for role injection.
 */

import { test, expect } from "@playwright/test";

const LENDER_SESSION = { userId: "e2e-lender-1", userRole: "lender" };
const SUPER_ADMIN_SESSION = { userId: "e2e-sa-1", userRole: "super_admin" };

async function gotoReports(
  page: import("@playwright/test").Page,
  session = SUPER_ADMIN_SESSION,
) {
  const res = await page.request.post("/api/test/set-session", { data: session });
  expect(res.ok()).toBeTruthy();
  await page.goto("/reports");
  await page.waitForSelector('[data-testid="text-reports-title"]', {
    timeout: 20000,
  });
}

// ─── Page structure ───────────────────────────────────────────────────────────

test.describe("Reports page — structure", () => {
  test("reports page title renders", async ({ page }) => {
    await gotoReports(page);
    await expect(
      page.locator('[data-testid="text-reports-title"]'),
    ).toBeVisible({ timeout: 10000 });
  });

  test("export controls render", async ({ page }) => {
    await gotoReports(page);
    await expect(
      page.locator('[data-testid="button-export-portfolio-csv"]'),
    ).toBeVisible({ timeout: 10000 });
    await expect(
      page.locator('[data-testid="button-export-borrowers-csv"]'),
    ).toBeVisible({ timeout: 10000 });
  });

  test("generate report card renders", async ({ page }) => {
    await gotoReports(page);
    await expect(
      page.locator('[data-testid="card-generate-report"]'),
    ).toBeVisible({ timeout: 10000 });
  });

  test("export audit trail card renders", async ({ page }) => {
    await gotoReports(page);
    await expect(
      page.locator('[data-testid="card-export-audit-trail"]'),
    ).toBeVisible({ timeout: 10000 });
  });
});

// ─── Lender drill-down ────────────────────────────────────────────────────────

test.describe("Reports — Portfolio by Institution drill-down", () => {
  test("lender rows render in portfolio table", async ({ page }) => {
    await gotoReports(page);
    // Wait for at least one lender row (data-testid pattern: row-lender-<name>)
    await expect(
      page.locator('[data-testid^="row-lender-"]').first(),
    ).toBeVisible({ timeout: 20000 });
  });

  test("clicking lender row navigates to credit-accounts with lender param", async ({
    page,
  }) => {
    await gotoReports(page);
    // Wait for lender rows to appear
    const firstRow = page.locator('[data-testid^="row-lender-"]').first();
    await firstRow.waitFor({ timeout: 20000 });

    // Capture the lender name from the testid attribute
    const testId = await firstRow.getAttribute("data-testid");
    const lenderName = testId?.replace("row-lender-", "") ?? "";

    await firstRow.click();

    // Should navigate to /credit-accounts with lender query param
    await expect(page).toHaveURL(/\/credit-accounts/, { timeout: 10000 });
    if (lenderName) {
      await expect(page).toHaveURL(
        new RegExp(`lender=${encodeURIComponent(lenderName).replace(/[()]/g, "\\$&")}`),
        { timeout: 10000 },
      );
    }
  });

  test("filter banner shows clear button after lender drill-down", async ({
    page,
  }) => {
    await gotoReports(page);
    const firstRow = page.locator('[data-testid^="row-lender-"]').first();
    await firstRow.waitFor({ timeout: 20000 });
    await firstRow.click();

    await page.waitForSelector('[data-testid="text-accounts-title"]', {
      timeout: 15000,
    });

    // Filter banner should show clear button when lender param is active
    await expect(
      page.locator('[data-testid="button-clear-filter"]'),
    ).toBeVisible({ timeout: 10000 });
  });

  test("clear filter button removes lender param and hides banner", async ({
    page,
  }) => {
    await gotoReports(page);
    const firstRow = page.locator('[data-testid^="row-lender-"]').first();
    await firstRow.waitFor({ timeout: 20000 });
    await firstRow.click();

    await page.waitForSelector('[data-testid="button-clear-filter"]', {
      timeout: 15000,
    });

    await page.click('[data-testid="button-clear-filter"]');

    // After clearing, the lender param should be gone
    await expect(page).not.toHaveURL(/lender=/, { timeout: 8000 });
    await expect(
      page.locator('[data-testid="button-clear-filter"]'),
    ).not.toBeVisible({ timeout: 8000 });
  });
});

// ─── Account type drill-down ─────────────────────────────────────────────────

test.describe("Reports — Account type drill-down", () => {
  test("account type rows render", async ({ page }) => {
    await gotoReports(page);
    await expect(
      page.locator('[data-testid^="row-type-"]').first(),
    ).toBeVisible({ timeout: 20000 });
  });

  test("clicking type row navigates to credit-accounts with type param", async ({
    page,
  }) => {
    await gotoReports(page);
    const firstTypeRow = page.locator('[data-testid^="row-type-"]').first();
    await firstTypeRow.waitFor({ timeout: 20000 });
    await firstTypeRow.click();

    await expect(page).toHaveURL(/\/credit-accounts/, { timeout: 10000 });
    await expect(page).toHaveURL(/type=/, { timeout: 10000 });
  });
});
