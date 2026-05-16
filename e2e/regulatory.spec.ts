import { test, expect } from "@playwright/test";

async function setSession(
  page: import("@playwright/test").Page,
  session: Record<string, unknown>,
) {
  const res = await page.request.post("/api/test/set-session", { data: session });
  expect(res.ok()).toBeTruthy();
}

const REGULATOR_SESSION = { userId: "e2e-reg-dash", userRole: "regulator" };
const PLATFORM_OWNER_SESSION = { userId: "e2e-po-dash", userRole: "platform_owner" };

async function gotoRegDashboard(
  page: import("@playwright/test").Page,
  session = REGULATOR_SESSION,
) {
  await setSession(page, session);
  await page.goto("/regulatory-dashboard");
  await page.waitForSelector('[data-testid="text-reg-dashboard-title"]', {
    timeout: 20000,
  });
}

// ─── KPI strip ────────────────────────────────────────────────────────────────

test.describe("Regulatory Dashboard — KPI strip", () => {
  test("all 6 KPI stat cards are visible", async ({ page }) => {
    await gotoRegDashboard(page);
    const kpis = [
      "stat-total-borrowers",
      "stat-total-accounts",
      "stat-total-institutions",
      "stat-total-exposure",
      "stat-npl-ratio",
      "stat-data-quality",
    ];
    for (const id of kpis) {
      await expect(page.locator(`[data-testid="${id}"]`)).toBeVisible({
        timeout: 10000,
      });
    }
  });

  test("KPI stat card values contain non-empty text", async ({ page }) => {
    await gotoRegDashboard(page);
    for (const id of ["stat-total-borrowers", "stat-total-accounts", "stat-total-institutions"]) {
      const text = await page.locator(`[data-testid="${id}"]`).textContent();
      expect(text?.trim().length).toBeGreaterThan(0);
    }
  });

  test("KPI exposure and NPL values contain formatted number or percentage", async ({
    page,
  }) => {
    await gotoRegDashboard(page);
    const nplText = await page.locator('[data-testid="stat-npl-ratio"]').textContent();
    const expText = await page.locator('[data-testid="stat-total-exposure"]').textContent();
    expect(nplText).toMatch(/\d/); // contains a digit
    expect(expText).toMatch(/\d/);
  });

  test("platform_owner can view regulatory dashboard", async ({ page }) => {
    await gotoRegDashboard(page, PLATFORM_OWNER_SESSION);
    for (const id of ["stat-total-borrowers", "stat-total-accounts"]) {
      await expect(page.locator(`[data-testid="${id}"]`)).toBeVisible({
        timeout: 10000,
      });
    }
  });

  test("regulatory dashboard is blocked for unauthenticated users", async ({
    page,
  }) => {
    await page.goto("/regulatory-dashboard");
    await expect(
      page.locator('[data-testid="page-login"], [data-testid="button-login-institution"]').first(),
    ).toBeVisible({ timeout: 15000 });
  });
});

// ─── Portfolio status chart ───────────────────────────────────────────────────

test.describe("Regulatory Dashboard — Portfolio status chart", () => {
  test("portfolio status pie chart container is visible", async ({ page }) => {
    await gotoRegDashboard(page);
    await expect(
      page.locator('[data-testid="chart-portfolio-status"]'),
    ).toBeVisible({ timeout: 12000 });
  });

  test("portfolio status chart contains SVG elements (recharts rendered)", async ({
    page,
  }) => {
    await gotoRegDashboard(page);
    await page.waitForSelector('[data-testid="chart-portfolio-status"] svg', {
      timeout: 12000,
    });
    const svgCount = await page
      .locator('[data-testid="chart-portfolio-status"] svg')
      .count();
    expect(svgCount).toBeGreaterThan(0);
  });
});

// ─── Data quality panel ───────────────────────────────────────────────────────

test.describe("Regulatory Dashboard — Data quality panel", () => {
  test("data quality panel renders", async ({ page }) => {
    await gotoRegDashboard(page);
    await expect(
      page.locator('[data-testid="panel-data-quality"]'),
    ).toBeVisible({ timeout: 12000 });
  });

  test("all 3 coverage quality bars render", async ({ page }) => {
    await gotoRegDashboard(page);
    for (const id of ["quality-national-id", "quality-phone", "quality-email"]) {
      await expect(page.locator(`[data-testid="${id}"]`)).toBeVisible({
        timeout: 10000,
      });
    }
  });

  test("coverage bars contain percentage labels", async ({ page }) => {
    await gotoRegDashboard(page);
    for (const id of ["quality-national-id", "quality-phone", "quality-email"]) {
      const text = await page.locator(`[data-testid="${id}"]`).textContent();
      expect(text).toMatch(/%/);
    }
  });

  test("data quality badge renders with label", async ({ page }) => {
    await gotoRegDashboard(page);
    const badge = page.locator('[data-testid="badge-data-quality"]');
    await expect(badge).toBeVisible({ timeout: 10000 });
    const text = await badge.textContent();
    expect(["Good", "Fair", "Poor"].some(v => text?.includes(v))).toBe(true);
  });
});

// ─── Sector NPL heatmap ────────────────────────────────────────────────────────

test.describe("Regulatory Dashboard — Sector NPL heatmap", () => {
  test("sector NPL chart container renders", async ({ page }) => {
    await gotoRegDashboard(page);
    await expect(
      page.locator('[data-testid="chart-sector-npl"]'),
    ).toBeVisible({ timeout: 12000 });
  });

  test("sector NPL detail table renders", async ({ page }) => {
    await gotoRegDashboard(page);
    await expect(
      page.locator('[data-testid="table-sector-npl"]'),
    ).toBeVisible({ timeout: 12000 });
  });
});

// ─── Institution compliance table ─────────────────────────────────────────────

test.describe("Regulatory Dashboard — Institution compliance table", () => {
  test("institution compliance table container renders", async ({ page }) => {
    await gotoRegDashboard(page);
    await expect(
      page.locator('[data-testid="table-institution-compliance"]'),
    ).toBeVisible({ timeout: 12000 });
  });

  test("compliance table has at least one row or displays no-data message", async ({
    page,
  }) => {
    await gotoRegDashboard(page);
    await page.waitForSelector('[data-testid="table-institution-compliance"]', {
      timeout: 12000,
    });
    const rows = await page.locator('[data-testid^="row-institution-"]').count();
    const noData = await page.locator('text=No institution data').count();
    expect(rows + noData).toBeGreaterThan(0);
  });
});

// ─── NPL exposure summary ─────────────────────────────────────────────────────

test.describe("Regulatory Dashboard — NPL exposure summary", () => {
  test("NPL summary panel renders", async ({ page }) => {
    await gotoRegDashboard(page);
    await expect(
      page.locator('[data-testid="panel-npl-summary"]'),
    ).toBeVisible({ timeout: 12000 });
  });

  test("total exposure value is present and contains a number", async ({
    page,
  }) => {
    await gotoRegDashboard(page);
    const text = await page
      .locator('[data-testid="text-total-exposure"]')
      .textContent();
    expect(text).toMatch(/\d/);
  });

  test("NPL exposure value is present and contains a number", async ({
    page,
  }) => {
    await gotoRegDashboard(page);
    const text = await page
      .locator('[data-testid="text-npl-exposure"]')
      .textContent();
    expect(text).toMatch(/\d/);
  });

  test("delinquent count renders as a parseable integer string", async ({ page }) => {
    await gotoRegDashboard(page);
    const text = await page
      .locator('[data-testid="text-delinquent-count"]')
      .textContent();
    // Must be present and parseable as a whole number — not just blank or "—"
    expect(text?.trim()).toMatch(/^\d+$/);
  });

  test("default count renders as a parseable integer string", async ({ page }) => {
    await gotoRegDashboard(page);
    const text = await page
      .locator('[data-testid="text-default-count"]')
      .textContent();
    expect(text?.trim()).toMatch(/^\d+$/);
  });

  test("written-off count renders as a parseable integer string", async ({ page }) => {
    await gotoRegDashboard(page);
    const text = await page
      .locator('[data-testid="text-written-off-count"]')
      .textContent();
    expect(text?.trim()).toMatch(/^\d+$/);
  });

  test("total exposure contains a formatted currency amount with digits", async ({ page }) => {
    await gotoRegDashboard(page);
    const text = await page
      .locator('[data-testid="text-total-exposure"]')
      .textContent();
    // Must contain at least one digit — not a dash placeholder
    expect(text).toMatch(/\d/);
    expect(text?.trim()).not.toBe("—");
  });

  test("NPL summary panel shows real numeric data — not all placeholder dashes", async ({ page }) => {
    await gotoRegDashboard(page);
    await page.waitForSelector('[data-testid="panel-npl-summary"]', { timeout: 12000 });
    // Collect all four key KPI texts
    const delinquent = await page.locator('[data-testid="text-delinquent-count"]').textContent();
    const defaulted = await page.locator('[data-testid="text-default-count"]').textContent();
    const writtenOff = await page.locator('[data-testid="text-written-off-count"]').textContent();
    // At minimum, all three must be numeric strings (not error state or blank)
    for (const val of [delinquent, defaulted, writtenOff]) {
      expect(val?.trim()).toMatch(/^\d+$/);
    }
  });
});

// ─── Regulatory API ───────────────────────────────────────────────────────────

test.describe("Regulatory Dashboard — API", () => {
  test("GET /api/regulatory/dashboard returns 200 with correct structure for regulator", async ({
    page,
  }) => {
    await setSession(page, REGULATOR_SESSION);
    const resp = await page.request.get("/api/regulatory/dashboard");
    expect(resp.status()).toBe(200);
    const body = await resp.json();
    // Verify required fields
    expect(body).toHaveProperty("summary");
    expect(body).toHaveProperty("dataQuality");
    expect(body).toHaveProperty("sectorNpl");
    expect(body).toHaveProperty("institutionCompliance");
    expect(typeof body.summary.totalBorrowers).toBe("number");
    expect(typeof body.summary.nplRatio).toBe("string");
    expect(typeof body.dataQuality.overallScore).toBe("string");
  });

  test("GET /api/regulatory/dashboard returns 401 without auth", async ({
    page,
  }) => {
    const resp = await page.request.get("/api/regulatory/dashboard");
    expect([401, 403]).toContain(resp.status());
  });
});
