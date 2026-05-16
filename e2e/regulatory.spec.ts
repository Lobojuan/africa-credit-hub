/**
 * Regulatory Dashboard E2E Suite
 *
 * Tests KPI strip, portfolio status chart, data quality panel, sector NPL
 * heatmap, and institution compliance table as seen by regulator / platform_owner.
 *
 * Uses /api/test/set-session for role injection (ENABLE_E2E_TEST_AUTH=true).
 */

import { test, expect } from "@playwright/test";

const REGULATOR_SESSION = { userId: "e2e-reg-1", userRole: "regulator" };
const PLATFORM_OWNER_SESSION = { userId: "e2e-po-1", userRole: "platform_owner" };

async function gotoRegDashboard(page: import("@playwright/test").Page, session = REGULATOR_SESSION) {
  const res = await page.request.post("/api/test/set-session", { data: session });
  expect(res.ok()).toBeTruthy();
  await page.goto("/regulatory-dashboard");
  await page.waitForSelector('[data-testid="text-reg-dashboard-title"]', {
    timeout: 20000,
  });
}

// ─── KPI Strip ───────────────────────────────────────────────────────────────

test.describe("Regulatory Dashboard — KPI strip", () => {
  test("all 6 KPI stat cards render", async ({ page }) => {
    await gotoRegDashboard(page);

    const kpiIds = [
      "stat-total-borrowers",
      "stat-total-accounts",
      "stat-total-institutions",
      "stat-total-exposure",
      "stat-npl-ratio",
      "stat-data-quality",
    ];

    for (const testId of kpiIds) {
      await expect(page.locator(`[data-testid="${testId}"]`)).toBeVisible({
        timeout: 10000,
      });
    }
  });

  test("KPI values are non-empty strings", async ({ page }) => {
    await gotoRegDashboard(page);

    for (const testId of [
      "stat-total-borrowers",
      "stat-total-accounts",
      "stat-total-institutions",
    ]) {
      const text = await page.locator(`[data-testid="${testId}"]`).textContent();
      expect(text?.trim().length).toBeGreaterThan(0);
    }
  });

  test("platform_owner can also view the regulatory dashboard", async ({ page }) => {
    await gotoRegDashboard(page, PLATFORM_OWNER_SESSION);
    await expect(
      page.locator('[data-testid="stat-total-borrowers"]'),
    ).toBeVisible({ timeout: 10000 });
  });
});

// ─── Charts and panels ───────────────────────────────────────────────────────

test.describe("Regulatory Dashboard — charts and panels", () => {
  test("portfolio status chart renders", async ({ page }) => {
    await gotoRegDashboard(page);
    await expect(
      page.locator('[data-testid="chart-portfolio-status"]'),
    ).toBeVisible({ timeout: 10000 });
  });

  test("data quality panel renders with coverage bars", async ({ page }) => {
    await gotoRegDashboard(page);
    await expect(
      page.locator('[data-testid="panel-data-quality"]'),
    ).toBeVisible({ timeout: 10000 });

    const bars = ["quality-national-id", "quality-phone", "quality-email"];
    for (const barId of bars) {
      await expect(page.locator(`[data-testid="${barId}"]`)).toBeVisible({
        timeout: 10000,
      });
    }
  });

  test("data quality badge renders", async ({ page }) => {
    await gotoRegDashboard(page);
    await expect(
      page.locator('[data-testid="badge-data-quality"]'),
    ).toBeVisible({ timeout: 10000 });
  });

  test("sector NPL heatmap chart container renders", async ({ page }) => {
    await gotoRegDashboard(page);
    await expect(
      page.locator('[data-testid="chart-sector-npl"]'),
    ).toBeVisible({ timeout: 10000 });
  });

  test("sector NPL detail table container renders", async ({ page }) => {
    await gotoRegDashboard(page);
    await expect(
      page.locator('[data-testid="table-sector-npl"]'),
    ).toBeVisible({ timeout: 10000 });
  });
});

// ─── Institution compliance table ────────────────────────────────────────────

test.describe("Regulatory Dashboard — institution compliance table", () => {
  test("institution compliance table container renders", async ({ page }) => {
    await gotoRegDashboard(page);
    await expect(
      page.locator('[data-testid="table-institution-compliance"]'),
    ).toBeVisible({ timeout: 10000 });
  });

  test("NPL exposure summary panel renders key figures", async ({ page }) => {
    await gotoRegDashboard(page);
    await expect(
      page.locator('[data-testid="panel-npl-summary"]'),
    ).toBeVisible({ timeout: 10000 });
    await expect(
      page.locator('[data-testid="text-total-exposure"]'),
    ).toBeVisible({ timeout: 10000 });
    await expect(
      page.locator('[data-testid="text-npl-exposure"]'),
    ).toBeVisible({ timeout: 10000 });
  });

  test("delinquent and default counts are present", async ({ page }) => {
    await gotoRegDashboard(page);
    await expect(
      page.locator('[data-testid="text-delinquent-count"]'),
    ).toBeVisible({ timeout: 10000 });
    await expect(
      page.locator('[data-testid="text-default-count"]'),
    ).toBeVisible({ timeout: 10000 });
  });
});
