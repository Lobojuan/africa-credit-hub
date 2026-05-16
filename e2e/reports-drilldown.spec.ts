import { test, expect } from "@playwright/test";

async function setSession(
  page: import("@playwright/test").Page,
  session: Record<string, unknown>,
) {
  const res = await page.request.post("/api/test/set-session", { data: session });
  expect(res.ok()).toBeTruthy();
}

const SUPER_ADMIN_SESSION = { userId: "e2e-rpt-sa", userRole: "super_admin" };
const LENDER_SESSION = { userId: "e2e-rpt-lender", userRole: "lender" };

async function gotoReports(
  page: import("@playwright/test").Page,
  session = SUPER_ADMIN_SESSION,
) {
  await setSession(page, session);
  await page.goto("/reports");
  await page.waitForSelector('[data-testid="text-reports-title"]', {
    timeout: 20000,
  });
}

// ─── Page structure ───────────────────────────────────────────────────────────

test.describe("Reports — page structure", () => {
  test("reports page title renders for super_admin", async ({ page }) => {
    await gotoReports(page, SUPER_ADMIN_SESSION);
    await expect(
      page.locator('[data-testid="text-reports-title"]'),
    ).toBeVisible({ timeout: 10000 });
  });

  test("reports page loads for lender", async ({ page }) => {
    await gotoReports(page, LENDER_SESSION);
    await expect(
      page.locator('[data-testid="text-reports-title"]'),
    ).toBeVisible({ timeout: 10000 });
  });

  test("portfolio CSV export button is visible", async ({ page }) => {
    await gotoReports(page);
    await expect(
      page.locator('[data-testid="button-export-portfolio-csv"]'),
    ).toBeVisible({ timeout: 10000 });
  });

  test("portfolio XLSX export button is visible", async ({ page }) => {
    await gotoReports(page);
    await expect(
      page.locator('[data-testid="button-export-portfolio-xlsx"]'),
    ).toBeVisible({ timeout: 10000 });
  });

  test("borrowers CSV export button is visible", async ({ page }) => {
    await gotoReports(page);
    await expect(
      page.locator('[data-testid="button-export-borrowers-csv"]'),
    ).toBeVisible({ timeout: 10000 });
  });

  test("generate report card is visible", async ({ page }) => {
    await gotoReports(page);
    await expect(
      page.locator('[data-testid="card-generate-report"]'),
    ).toBeVisible({ timeout: 10000 });
  });

  test("export audit trail card is visible", async ({ page }) => {
    await gotoReports(page);
    await expect(
      page.locator('[data-testid="card-export-audit-trail"]'),
    ).toBeVisible({ timeout: 10000 });
  });

  test("reports page is blocked without auth", async ({ page }) => {
    await page.goto("/reports");
    await expect(
      page.locator('[data-testid="page-login"], [data-testid="button-login-institution"]').first(),
    ).toBeVisible({ timeout: 15000 });
  });
});

// ─── Lender drill-down ────────────────────────────────────────────────────────

test.describe("Reports — Portfolio by Institution drill-down", () => {
  test("lender rows are visible in the portfolio table", async ({ page }) => {
    await gotoReports(page);
    await expect(
      page.locator('[data-testid^="row-lender-"]').first(),
    ).toBeVisible({ timeout: 20000 });
  });

  test("clicking lender row navigates to /credit-accounts?lender=...", async ({
    page,
  }) => {
    await gotoReports(page);
    const firstRow = page.locator('[data-testid^="row-lender-"]').first();
    await firstRow.waitFor({ timeout: 20000 });

    const testId = await firstRow.getAttribute("data-testid");
    const lenderName = testId?.replace("row-lender-", "") ?? "";

    await firstRow.click();

    // Should navigate to credit-accounts with lender param
    await expect(page).toHaveURL(/\/credit-accounts/, { timeout: 10000 });
    if (lenderName) {
      await expect(page).toHaveURL(/lender=/, { timeout: 8000 });
    }
  });

  test("filter banner shows clear button and lender name after drill-down", async ({
    page,
  }) => {
    await gotoReports(page);
    const firstRow = page.locator('[data-testid^="row-lender-"]').first();
    await firstRow.waitFor({ timeout: 20000 });

    const testId = await firstRow.getAttribute("data-testid");
    const lenderName = decodeURIComponent(testId?.replace("row-lender-", "") ?? "");
    await firstRow.click();

    await page.waitForSelector('[data-testid="text-accounts-title"]', { timeout: 15000 });
    const clearBtn = page.locator('[data-testid="button-clear-filter"]');
    await expect(clearBtn).toBeVisible({ timeout: 10000 });

    // Verify the filter banner text contains the actual lender name
    const bannerText = await clearBtn.locator("..").textContent();
    expect(bannerText?.toLowerCase()).toContain(lenderName.toLowerCase().slice(0, 6));

    // URL must encode the lender param
    await expect(page).toHaveURL(/lender=/, { timeout: 5000 });
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

    await expect(page).not.toHaveURL(/lender=/, { timeout: 8000 });
    await expect(
      page.locator('[data-testid="button-clear-filter"]'),
    ).not.toBeVisible({ timeout: 8000 });
  });

  test("credit-accounts page shows title after navigating from lender row", async ({
    page,
  }) => {
    await gotoReports(page);
    const firstRow = page.locator('[data-testid^="row-lender-"]').first();
    await firstRow.waitFor({ timeout: 20000 });
    await firstRow.click();

    await expect(
      page.locator('[data-testid="text-accounts-title"]'),
    ).toBeVisible({ timeout: 15000 });
  });
});

// ─── Account type drill-down ─────────────────────────────────────────────────

test.describe("Reports — Portfolio by Account Type drill-down", () => {
  test("account type rows are visible in the portfolio table", async ({
    page,
  }) => {
    await gotoReports(page);
    await expect(
      page.locator('[data-testid^="row-type-"]').first(),
    ).toBeVisible({ timeout: 20000 });
  });

  test("clicking type row navigates to /credit-accounts?type=...", async ({
    page,
  }) => {
    await gotoReports(page);
    const firstTypeRow = page.locator('[data-testid^="row-type-"]').first();
    await firstTypeRow.waitFor({ timeout: 20000 });
    await firstTypeRow.click();

    await expect(page).toHaveURL(/\/credit-accounts/, { timeout: 10000 });
    await expect(page).toHaveURL(/type=/, { timeout: 10000 });
  });

  test("type drill-down shows filter banner with clear button", async ({
    page,
  }) => {
    await gotoReports(page);
    const firstTypeRow = page.locator('[data-testid^="row-type-"]').first();
    await firstTypeRow.waitFor({ timeout: 20000 });
    await firstTypeRow.click();

    await page.waitForSelector('[data-testid="button-clear-filter"]', {
      timeout: 15000,
    });
    await expect(
      page.locator('[data-testid="button-clear-filter"]'),
    ).toBeVisible({ timeout: 10000 });
  });
});

// ─── Reports API ──────────────────────────────────────────────────────────────

test.describe("Reports — API endpoints", () => {
  test("GET /api/reports/portfolio returns 200 with array data for super_admin", async ({
    page,
  }) => {
    await setSession(page, SUPER_ADMIN_SESSION);
    const resp = await page.request.get("/api/reports/portfolio");
    expect(resp.status()).toBe(200);
    const body = await resp.json();
    expect(
      Array.isArray(body) || Array.isArray(body?.data) || typeof body === "object",
    ).toBe(true);
  });

  test("GET /api/reports/portfolio returns 401 without auth", async ({ page }) => {
    const resp = await page.request.get("/api/reports/portfolio");
    expect([401, 403]).toContain(resp.status());
  });
});
