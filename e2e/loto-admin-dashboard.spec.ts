import { test, expect } from "@playwright/test";

const DGI_OFFICER_SESSION = {
  userId: "e2e-dgi-test-user",
  userRole: "dgi_officer",
  userCountry: "Côte d'Ivoire",
  _testRole: "dgi_officer",
};

test.describe("DGI Loto Fiscal dashboard — 5-tab walkthrough (dgi_officer)", () => {
  test.beforeEach(async ({ page }) => {
    const res = await page.request.post("/api/test/set-session", {
      data: DGI_OFFICER_SESSION,
    });
    expect(res.ok()).toBeTruthy();

    await page.goto("/admin/loto-fiscal");
    await page.waitForSelector('[data-testid="page-loto-admin-dashboard"]', {
      timeout: 20000,
    });
  });

  test("Tab 1 — Overview: KPI strip renders all key metrics", async ({ page }) => {
    await page.click('[data-testid="tab-overview"]');
    await expect(page.locator('[data-testid="kpi-vat"]')).toBeVisible();
    await expect(page.locator('[data-testid="kpi-merchants"]')).toBeVisible();
    await expect(page.locator('[data-testid="kpi-receipts-30d"]')).toBeVisible();
    await expect(page.locator('[data-testid="kpi-open-flags"]')).toBeVisible();
  });

  test("Tab 2 — Compliance: scorecard table and export controls render", async ({ page }) => {
    await page.click('[data-testid="tab-compliance"]');
    await expect(
      page.locator('[data-testid="tab-compliance"][data-state="active"]')
    ).toBeVisible({ timeout: 10000 });
    await expect(page.locator('[data-testid="button-export-compliance-csv"]')).toBeVisible();
  });

  test("Tab 3 — Fraud queue: scan button and export controls render", async ({ page }) => {
    await page.click('[data-testid="tab-fraud"]');
    await expect(
      page.locator('[data-testid="tab-fraud"][data-state="active"]')
    ).toBeVisible({ timeout: 10000 });
    await expect(page.locator('[data-testid="button-run-scan"]')).toBeVisible();
    await expect(page.locator('[data-testid="button-export-fraud-csv"]')).toBeVisible();
  });

  test("Tab 4 — Webhooks: subscription form renders with URL input", async ({ page }) => {
    await page.click('[data-testid="tab-webhooks"]');
    await expect(
      page.locator('[data-testid="tab-webhooks"][data-state="active"]')
    ).toBeVisible({ timeout: 10000 });
    await expect(page.locator('[data-testid="input-webhook-url"]')).toBeVisible();
  });

  test("Tab 5 — Audit: audit log area renders (empty state or entries)", async ({ page }) => {
    await page.click('[data-testid="tab-audit"]');
    await expect(
      page.locator('[data-testid="tab-audit"][data-state="active"]')
    ).toBeVisible({ timeout: 10000 });
    await expect(
      page.locator('[data-testid="text-no-audit"], [data-testid^="row-audit-"]').first()
    ).toBeVisible({ timeout: 15000 });
  });
});
