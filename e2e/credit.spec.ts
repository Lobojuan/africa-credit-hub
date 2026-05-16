/**
 * Credit Bureau E2E Suite
 *
 * Covers:
 *   - Borrower search / search page renders
 *   - Credit accounts page (list, add account form, filter banner)
 *   - Credit report page navigation
 *   - Dashboard renders for admin / super_admin
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

const ADMIN_SESSION = { userId: "e2e-admin-1", userRole: "admin" };
const SUPER_ADMIN_SESSION = { userId: "e2e-sa-1", userRole: "super_admin" };
const LENDER_SESSION = { userId: "e2e-lend-1", userRole: "lender" };

// ─── Dashboard ───────────────────────────────────────────────────────────────

test.describe("Credit Bureau — Dashboard", () => {
  test("dashboard page loads for super_admin", async ({ page }) => {
    await setSession(page, SUPER_ADMIN_SESSION);
    await page.goto("/dashboard");
    // Should not redirect to login
    await expect(page).not.toHaveURL(/\/login/, { timeout: 12000 });
    // Some content renders
    await expect(page.locator("main, [data-testid]").first()).toBeVisible({
      timeout: 12000,
    });
  });

  test("dashboard page loads for admin", async ({ page }) => {
    await setSession(page, ADMIN_SESSION);
    await page.goto("/dashboard");
    await expect(page).not.toHaveURL(/\/login/, { timeout: 12000 });
  });
});

// ─── Borrowers page ──────────────────────────────────────────────────────────

test.describe("Credit Bureau — Borrowers list", () => {
  test("borrowers page renders for super_admin", async ({ page }) => {
    await setSession(page, SUPER_ADMIN_SESSION);
    await page.goto("/borrowers");
    await expect(page).not.toHaveURL(/\/login/, { timeout: 12000 });
    // Page content renders (heading or table)
    await expect(page.locator("h1, h2, [data-testid]").first()).toBeVisible({
      timeout: 15000,
    });
  });

  test("search page shows borrower search input", async ({ page }) => {
    await setSession(page, SUPER_ADMIN_SESSION);
    await page.goto("/search");
    await expect(
      page.locator('[data-testid="input-borrower-search"]'),
    ).toBeVisible({ timeout: 15000 });
  });

  test("search input is interactive", async ({ page }) => {
    await setSession(page, SUPER_ADMIN_SESSION);
    await page.goto("/search");
    await page.waitForSelector('[data-testid="input-borrower-search"]', {
      timeout: 15000,
    });
    await page.fill('[data-testid="input-borrower-search"]', "Test Borrower");
    const val = await page
      .locator('[data-testid="input-borrower-search"]')
      .inputValue();
    expect(val).toBe("Test Borrower");
  });
});

// ─── Credit Accounts ─────────────────────────────────────────────────────────

test.describe("Credit Bureau — Credit Accounts", () => {
  test("credit accounts page title renders for admin", async ({ page }) => {
    await setSession(page, ADMIN_SESSION);
    await page.goto("/credit-accounts");
    await expect(
      page.locator('[data-testid="text-accounts-title"]'),
    ).toBeVisible({ timeout: 15000 });
  });

  test("credit accounts page renders for lender", async ({ page }) => {
    await setSession(page, LENDER_SESSION);
    await page.goto("/credit-accounts");
    await expect(
      page.locator('[data-testid="text-accounts-title"]'),
    ).toBeVisible({ timeout: 15000 });
  });

  test("add account button visible for admin", async ({ page }) => {
    await setSession(page, ADMIN_SESSION);
    await page.goto("/credit-accounts");
    await expect(
      page.locator('[data-testid="button-add-account"]'),
    ).toBeVisible({ timeout: 15000 });
  });

  test("URL with lender param shows filter banner with clear button", async ({
    page,
  }) => {
    await setSession(page, ADMIN_SESSION);
    await page.goto("/credit-accounts?lender=Test%20Bank");
    await page.waitForSelector('[data-testid="text-accounts-title"]', {
      timeout: 15000,
    });
    await expect(
      page.locator('[data-testid="button-clear-filter"]'),
    ).toBeVisible({ timeout: 10000 });
  });

  test("URL with type param shows filter banner with clear button", async ({
    page,
  }) => {
    await setSession(page, ADMIN_SESSION);
    await page.goto("/credit-accounts?type=mortgage");
    await page.waitForSelector('[data-testid="text-accounts-title"]', {
      timeout: 15000,
    });
    await expect(
      page.locator('[data-testid="button-clear-filter"]'),
    ).toBeVisible({ timeout: 10000 });
  });

  test("clear filter removes lender param from URL", async ({ page }) => {
    await setSession(page, ADMIN_SESSION);
    await page.goto("/credit-accounts?lender=Test%20Bank");
    await page.waitForSelector('[data-testid="button-clear-filter"]', {
      timeout: 15000,
    });
    await page.click('[data-testid="button-clear-filter"]');
    await expect(page).not.toHaveURL(/lender=/, { timeout: 8000 });
    await expect(
      page.locator('[data-testid="button-clear-filter"]'),
    ).not.toBeVisible({ timeout: 8000 });
  });

  test("add account form opens when button clicked", async ({ page }) => {
    await setSession(page, ADMIN_SESSION);
    await page.goto("/credit-accounts");
    await page.waitForSelector('[data-testid="button-add-account"]', {
      timeout: 15000,
    });
    await page.click('[data-testid="button-add-account"]');
    await expect(
      page.locator('[data-testid="form-add-account"]'),
    ).toBeVisible({ timeout: 8000 });
  });

  test("add account form has required fields", async ({ page }) => {
    await setSession(page, ADMIN_SESSION);
    await page.goto("/credit-accounts");
    await page.waitForSelector('[data-testid="button-add-account"]', {
      timeout: 15000,
    });
    await page.click('[data-testid="button-add-account"]');
    await page.waitForSelector('[data-testid="form-add-account"]', {
      timeout: 8000,
    });

    await expect(
      page.locator('[data-testid="input-lender"]'),
    ).toBeVisible({ timeout: 5000 });
    await expect(
      page.locator('[data-testid="input-account-number"]'),
    ).toBeVisible({ timeout: 5000 });
    await expect(
      page.locator('[data-testid="button-submit-account"]'),
    ).toBeVisible({ timeout: 5000 });
  });
});

// ─── Loan Origination page ───────────────────────────────────────────────────

test.describe("Credit Bureau — Loan Origination", () => {
  test("loan origination page renders for admin", async ({ page }) => {
    await setSession(page, ADMIN_SESSION);
    await page.goto("/loan-origination");
    await expect(page).not.toHaveURL(/\/login/, { timeout: 12000 });
    await expect(page.locator("h1, h2, [data-testid]").first()).toBeVisible({
      timeout: 15000,
    });
  });
});
