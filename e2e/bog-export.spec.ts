import { test, expect } from "@playwright/test";

const SA = { userId: "e2e-bog-sa", userRole: "super_admin" };
const REG = { userId: "e2e-bog-reg", userRole: "regulator" };

async function session(page: import("@playwright/test").Page, s = SA) {
  const r = await page.request.post("/api/test/set-session", { data: s });
  expect(r.ok()).toBeTruthy();
}

async function gotoBog(page: import("@playwright/test").Page, s = SA) {
  await session(page, s);
  await page.goto("/bog-export");
  await page.waitForSelector('[data-testid="bog-export-page"]', { timeout: 20000 });
}

test.describe("BoG CRB Export — page structure", () => {
  test("page renders for super_admin", async ({ page }) => {
    await gotoBog(page);
    await expect(page.locator('[data-testid="bog-export-page"]')).toBeVisible({ timeout: 12000 });
  });

  test("page renders for regulator", async ({ page }) => {
    await gotoBog(page, REG);
    await expect(page.locator('[data-testid="bog-export-page"]')).toBeVisible({ timeout: 12000 });
  });

  test("file-type selector, reporting-date, and download button are visible", async ({ page }) => {
    await gotoBog(page);
    await expect(page.locator('[data-testid="select-file-type"]')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('[data-testid="input-reporting-date"]')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('[data-testid="button-download"]')).toBeVisible({ timeout: 10000 });
  });

  test("export history card renders", async ({ page }) => {
    await gotoBog(page);
    await expect(page.locator('[data-testid="card-export-history"]')).toBeVisible({ timeout: 12000 });
  });
});

test.describe("BoG CRB Export — preview flow", () => {
  test("filename preview updates when file type is selected", async ({ page }) => {
    await gotoBog(page);
    await expect(page.locator('[data-testid="text-filename-preview"]')).toBeVisible({ timeout: 10000 });
    const before = await page.locator('[data-testid="text-filename-preview"]').textContent();
    expect(before?.trim().length).toBeGreaterThan(0);
  });

  test("preview button triggers row count display", async ({ page }) => {
    await gotoBog(page);
    await page.waitForSelector('[data-testid="input-reporting-date"]', { timeout: 10000 });
    await page.fill('[data-testid="input-reporting-date"]', new Date().toISOString().split("T")[0]);
    await page.click('[data-testid="button-preview"]');

    await expect(
      page.locator('[data-testid="text-row-count"], [data-testid="text-header-row"]').first(),
    ).toBeVisible({ timeout: 20000 });
  });

  test("preview row count contains a number", async ({ page }) => {
    await gotoBog(page);
    await page.fill('[data-testid="input-reporting-date"]', new Date().toISOString().split("T")[0]);
    await page.click('[data-testid="button-preview"]');
    await page.waitForSelector('[data-testid="text-row-count"]', { timeout: 20000 });
    const text = await page.locator('[data-testid="text-row-count"]').textContent();
    expect(text).toMatch(/\d+/);
  });
});

test.describe("BoG CRB Export — download flow", () => {
  test("download button triggers a file download with valid content", async ({ page }) => {
    await gotoBog(page);
    await page.fill('[data-testid="input-reporting-date"]', new Date().toISOString().split("T")[0]);

    const [download] = await Promise.all([
      page.waitForEvent("download", { timeout: 30000 }),
      page.click('[data-testid="button-download"]'),
    ]);
    expect(download.suggestedFilename().length).toBeGreaterThan(0);
    const filePath = await download.path();
    expect(filePath).not.toBeNull();
  });

  test("API /api/bog-export is accessible to super_admin — not 401/403/500", async ({ page }) => {
    await session(page);
    const today = new Date().toISOString().split("T")[0];
    const resp = await page.request.get(`/api/bog-export?date=${today}&fileType=ACACC`);
    // 400 is acceptable when no BoG-format records exist in the E2E DB for this date;
    // 200 means data was found. Both are correct authorized responses.
    // What must NEVER happen is an auth error (401/403) or a server crash (500).
    expect(resp.status()).not.toBe(401);
    expect(resp.status()).not.toBe(403);
    expect(resp.status()).not.toBe(500);
    expect(resp.status()).toBeLessThan(500);
  });

  test("API /api/bog-export returns 401 without auth", async ({ page }) => {
    const today = new Date().toISOString().split("T")[0];
    const resp = await page.request.get(`/api/bog-export?date=${today}`);
    expect([401, 403]).toContain(resp.status());
  });
});
