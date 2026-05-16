import { test, expect } from "@playwright/test";

const SA = { userId: "e2e-batch-sa", userRole: "super_admin" };

async function session(page: import("@playwright/test").Page, s = SA) {
  const r = await page.request.post("/api/test/set-session", { data: s });
  expect(r.ok()).toBeTruthy();
}

async function gotoBatch(page: import("@playwright/test").Page) {
  await session(page);
  await page.goto("/batch-upload");
  await expect(page).not.toHaveURL(/\/login/, { timeout: 15000 });
}

test.describe("Batch Upload — page structure", () => {
  test("page loads XBRL/XML tab and BoG tab", async ({ page }) => {
    await gotoBatch(page);
    await expect(page.locator('[data-testid="tab-xbrl"]')).toBeVisible({ timeout: 12000 });
    await expect(page.locator('[data-testid="tab-bog"]')).toBeVisible({ timeout: 12000 });
  });

  test("XBRL tab has sample button, textarea, and submit button", async ({ page }) => {
    await gotoBatch(page);
    await page.click('[data-testid="tab-xbrl"]');
    await expect(page.locator('[data-testid="button-use-xbrl-sample"]')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('[data-testid="input-batch-xbrl"]')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('[data-testid="button-submit-xbrl"]')).toBeVisible({ timeout: 10000 });
  });

  test("BoG tab has sample button, textarea, and submit button", async ({ page }) => {
    await gotoBatch(page);
    await page.click('[data-testid="tab-bog"]');
    await expect(page.locator('[data-testid="button-use-bog-sample"]')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('[data-testid="input-batch-bog"]')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('[data-testid="button-submit-bog"]')).toBeVisible({ timeout: 10000 });
  });
});

test.describe("Batch Upload — XBRL sample fill and validation", () => {
  test("use-xbrl-sample populates the XBRL textarea with content", async ({ page }) => {
    await gotoBatch(page);
    await page.click('[data-testid="tab-xbrl"]');
    await page.waitForSelector('[data-testid="button-use-xbrl-sample"]', { timeout: 10000 });
    await page.click('[data-testid="button-use-xbrl-sample"]');

    const content = await page.locator('[data-testid="input-batch-xbrl"]').inputValue();
    expect(content.length).toBeGreaterThan(50);
    expect(content.trim()).toMatch(/</);
  });

  test("submitting XBRL sample produces a validation result — success alert or errors section", async ({ page }) => {
    await gotoBatch(page);
    await page.click('[data-testid="tab-xbrl"]');
    await page.waitForSelector('[data-testid="button-use-xbrl-sample"]', { timeout: 10000 });
    await page.click('[data-testid="button-use-xbrl-sample"]');
    await page.click('[data-testid="button-submit-xbrl"]');

    await expect(
      page.locator('[data-testid="upload-errors-section"], [role="alert"], .text-green-600, .text-emerald-600').first(),
    ).toBeVisible({ timeout: 20000 });
  });

  test("submitting invalid XML shows upload-errors-section", async ({ page }) => {
    await gotoBatch(page);
    await page.click('[data-testid="tab-xbrl"]');
    await page.waitForSelector('[data-testid="input-batch-xbrl"]', { timeout: 10000 });
    await page.fill('[data-testid="input-batch-xbrl"]', "<broken>not valid xbrl</oops>");
    await page.click('[data-testid="button-submit-xbrl"]');

    await expect(
      page.locator('[data-testid="upload-errors-section"], [role="alert"]').first(),
    ).toBeVisible({ timeout: 20000 });
  });
});

test.describe("Batch Upload — BoG format sample fill and validation", () => {
  test("use-bog-sample populates the BoG textarea with content", async ({ page }) => {
    await gotoBatch(page);
    await page.click('[data-testid="tab-bog"]');
    await page.waitForSelector('[data-testid="button-use-bog-sample"]', { timeout: 10000 });
    await page.click('[data-testid="button-use-bog-sample"]');

    const content = await page.locator('[data-testid="input-batch-bog"]').inputValue();
    expect(content.length).toBeGreaterThan(20);
  });

  test("submitting BoG sample produces a validation result", async ({ page }) => {
    await gotoBatch(page);
    await page.click('[data-testid="tab-bog"]');
    await page.waitForSelector('[data-testid="button-use-bog-sample"]', { timeout: 10000 });
    await page.click('[data-testid="button-use-bog-sample"]');
    await page.click('[data-testid="button-submit-bog"]');

    await expect(
      page.locator('[data-testid="upload-errors-section"], [role="alert"], .text-green-600, .text-emerald-600').first(),
    ).toBeVisible({ timeout: 20000 });
  });
});

test.describe("Batch Upload — API protection", () => {
  test("POST /api/batch-upload returns 401 without auth", async ({ page }) => {
    const r = await page.request.post("/api/batch-upload", { data: { format: "xbrl", payload: "" } });
    expect([401, 403]).toContain(r.status());
  });
});
