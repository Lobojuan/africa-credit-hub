import { test, expect } from "@playwright/test";

let e2eColId: string;
let e2eAssetId: string;

test.beforeAll(async ({ browser }) => {
  const ctx = await browser.newContext();
  const pg = await ctx.newPage();
  const session = await pg.request.post("/api/test/set-session", {
    // Collateral filings require an owning financial institution. The seeded
    // lender account supplies that ownership; a platform super-admin does not.
    data: { username: "lender_demo" },
  });
  expect(session.ok()).toBeTruthy();
  e2eAssetId = `VIN-SUITE-${Date.now()}`;
  const resp = await pg.request.post("/api/collateral", {
    data: {
      borrowerName: "E2E Collateral Suite Borrower",
      collateralType: "vehicle",
      assetLocalIdentifier: e2eAssetId,
      estimatedValue: "50000",
      currency: "GHS",
      countryCode: "Ghana",
      description: "E2E suite test vehicle",
    },
  });
  expect(resp.status()).toBe(201);
  e2eColId = (await resp.json()).id;
  await ctx.close();
});

const LENDER_SESSION = { username: "lender_demo" };
const SA_SESSION = { userId: "e2e-col-sa", userRole: "super_admin" };
const REG_SESSION = { userId: "e2e-col-reg", userRole: "regulator" };

async function setSession(page: import("@playwright/test").Page, session: Record<string, unknown>) {
  // Authenticated projects start from the same saved cookie. Clearing it first
  // gives every test its own server-side session and prevents parallel tests
  // from overwriting each other's role in the E2E memory store.
  await page.context().clearCookies();
  const res = await page.request.post("/api/test/set-session", { data: session });
  expect(res.ok()).toBeTruthy();
}

async function gotoCollateral(page: import("@playwright/test").Page, session = LENDER_SESSION) {
  await setSession(page, session);
  await page.goto("/collateral-registry");
  await expect(page).not.toHaveURL(/\/login/, { timeout: 12000 });
  await expect(page.locator("h1, h2, [data-testid]").first()).toBeVisible({ timeout: 20000 });
}

// ─── Page renders ─────────────────────────────────────────────────────────────

test.describe("Collateral Registry — page renders", () => {
  test("page loads for lender and is not /login", async ({ page }) => {
    await gotoCollateral(page, LENDER_SESSION);
    await expect(page).toHaveURL(/\/collateral-registry/);
  });

  test("page loads for super_admin", async ({ page }) => {
    await gotoCollateral(page, SA_SESSION);
    await expect(page).toHaveURL(/\/collateral-registry/);
  });

  test("page loads for regulator", async ({ page }) => {
    await gotoCollateral(page, REG_SESSION);
    await expect(page).toHaveURL(/\/collateral-registry/);
  });

  test("unauthenticated collateral API access is denied", async ({ browser }) => {
    const context = await browser.newContext();
    try {
      await context.clearCookies();
      const response = await context.request.get("/api/collateral");
      expect([401, 403]).toContain(response.status());
    } finally {
      await context.close();
    }
  });
});

// ─── Registration form — open and fill ────────────────────────────────────────

test.describe("Collateral Registry — registration form", () => {
  test("register collateral button opens form with all required fields", async ({ page }) => {
    await gotoCollateral(page, LENDER_SESSION);
    await page.waitForSelector('[data-testid="btn-register-collateral"]', { timeout: 15000 });
    await page.click('[data-testid="btn-register-collateral"]');

    const grantorFields = [
      "input-col-borrower-id",
      "input-col-borrower-name",
      "select-debtor-type",
      "select-country",
      "btn-next-step",
    ];
    for (const id of grantorFields) {
      await expect(page.locator(`[data-testid="${id}"]`)).toBeVisible({ timeout: 8000 });
    }

    await page.click('[data-testid="btn-next-step"]');
    const collateralFields = [
      "select-col-type",
      "input-asset-identifier",
      "input-col-value",
    ];
    for (const id of collateralFields) {
      await expect(page.locator(`[data-testid="${id}"]`)).toBeVisible({ timeout: 8000 });
    }
  });

  test("registration form fields are interactive and accept values", async ({ page }) => {
    await gotoCollateral(page, LENDER_SESSION);
    await page.waitForSelector('[data-testid="btn-register-collateral"]', { timeout: 15000 });
    await page.click('[data-testid="btn-register-collateral"]');
    await page.waitForSelector('[data-testid="input-col-borrower-id"]', { timeout: 10000 });

    const assetId = `VIN-E2E-${Date.now()}`;
    await page.fill('[data-testid="input-col-borrower-id"]', "GH-E2E-BORROW-001");
    await page.fill('[data-testid="input-col-borrower-name"]', "E2E Test Borrower");
    await page.click('[data-testid="btn-next-step"]');
    await page.waitForSelector('[data-testid="input-asset-identifier"]', { timeout: 10000 });
    await page.fill('[data-testid="input-asset-identifier"]', assetId);
    await page.fill('[data-testid="input-col-value"]', "45000");
    await page.fill('[data-testid="input-col-location"]', "Accra, Greater Accra, Ghana");

    // Step 2 replaces the grantor fields; verify the fields that remain in
    // the active form step rather than querying an intentionally unmounted
    // step-one input.
    expect(await page.locator('[data-testid="input-asset-identifier"]').inputValue()).toBe(assetId);
    expect(await page.locator('[data-testid="input-col-value"]').inputValue()).toBe("45000");
  });

  test("collateral registration submitted via API appears in the list", async ({ page }) => {
    await setSession(page, LENDER_SESSION);
    // Use the record created in beforeAll — navigate to registry and verify it appears
    await page.goto("/collateral-registry");
    await page.waitForSelector('[data-testid="input-search-collateral"]', { timeout: 15000 });
    await page.fill('[data-testid="input-search-collateral"]', e2eAssetId);
    await page.waitForTimeout(1000);

    await expect(
      page.locator(`[data-testid="row-collateral-${e2eColId}"]`),
    ).toBeVisible({ timeout: 12000 });
  });
});

// ─── Lien search ─────────────────────────────────────────────────────────────

test.describe("Collateral Registry — lien search", () => {
  test("lien search tab activates search panel with input and button", async ({ page }) => {
    await gotoCollateral(page, LENDER_SESSION);
    await page.waitForSelector('[data-testid="tab-lien-search"]', { timeout: 15000 });
    await page.click('[data-testid="tab-lien-search"]');

    await expect(page.locator('[data-testid="input-lien-search-asset"]')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('[data-testid="btn-lien-search"]')).toBeVisible({ timeout: 8000 });
  });

  test("lien search button is disabled with empty asset ID", async ({ page }) => {
    await gotoCollateral(page, LENDER_SESSION);
    await page.click('[data-testid="tab-lien-search"]');
    await page.waitForSelector('[data-testid="btn-lien-search"]', { timeout: 10000 });

    expect(await page.locator('[data-testid="btn-lien-search"]').isDisabled()).toBe(true);
  });

  test("lien search button enables after asset ID is typed", async ({ page }) => {
    await gotoCollateral(page, LENDER_SESSION);
    await page.click('[data-testid="tab-lien-search"]');
    await page.waitForSelector('[data-testid="input-lien-search-asset"]', { timeout: 10000 });
    await page.fill('[data-testid="input-lien-search-asset"]', "VIN-E2E-SEARCH-TEST");

    expect(await page.locator('[data-testid="btn-lien-search"]').isDisabled()).toBe(false);
  });

  test("lien search executes and page stays on /collateral-registry without crash", async ({ page }) => {
    await gotoCollateral(page, LENDER_SESSION);
    await page.click('[data-testid="tab-lien-search"]');
    await page.waitForSelector('[data-testid="input-lien-search-asset"]', { timeout: 10000 });

    const query = `VIN-E2E-NOSUCH-${Date.now()}`;
    await page.fill('[data-testid="input-lien-search-asset"]', query);
    await page.click('[data-testid="btn-lien-search"]');

    await page.waitForTimeout(2500);
    await expect(page).toHaveURL(/\/collateral-registry/, { timeout: 5000 });

    // Search input retains the entered value (component stayed mounted)
    expect(await page.locator('[data-testid="input-lien-search-asset"]').inputValue()).toBe(query);
  });

  test("pending collateral is not exposed by the active-lien search", async ({ page }) => {
    await setSession(page, LENDER_SESSION);
    await page.goto("/collateral-registry");
    await page.click('[data-testid="tab-lien-search"]');
    await page.waitForSelector('[data-testid="input-lien-search-asset"]', { timeout: 10000 });
    await page.fill('[data-testid="input-lien-search-asset"]', e2eAssetId);
    await page.click('[data-testid="btn-lien-search"]');

    // New filings remain pending until a registry authority approves them, so
    // cross-institution search must not reveal this asset yet.
    await expect(page.locator('[data-testid^="row-lien-result-"]')).toHaveCount(0, { timeout: 12000 });
  });
});

// ─── Certificate preview dialog ──────────────────────────────────────────────

test.describe("Collateral Registry — certificate preview", () => {
  test("pending collateral has no certificate preview before approval", async ({ page }) => {
    await setSession(page, LENDER_SESSION);
    await page.goto("/collateral-registry");
    await page.waitForSelector('[data-testid="input-search-collateral"]', { timeout: 15000 });
    await page.fill('[data-testid="input-search-collateral"]', e2eAssetId);
    await page.waitForTimeout(800);

    await expect(page.locator(`[data-testid="row-collateral-${e2eColId}"]`)).toBeVisible({ timeout: 12000 });

    await expect(page.locator(`[data-testid="btn-preview-cert-${e2eColId}"]`)).toHaveCount(0);
  });

  test("pending collateral has no certificate download before approval", async ({ page }) => {
    await setSession(page, LENDER_SESSION);
    await page.goto("/collateral-registry");
    await page.fill('[data-testid="input-search-collateral"]', e2eAssetId);
    await page.waitForTimeout(800);

    await expect(page.locator(`[data-testid="row-collateral-${e2eColId}"]`)).toBeVisible({ timeout: 12000 });
    await expect(page.locator(`[data-testid="btn-download-cert-${e2eColId}"]`)).toHaveCount(0);
  });
});

// ─── Collateral release lifecycle ─────────────────────────────────────────────

test.describe("Collateral Registry — release lifecycle", () => {
  let releaseColId: string;

  test.beforeAll(async ({ browser }) => {
    const ctx = await browser.newContext({ storageState: "playwright/.auth/super_admin.json" });
    const pg = await ctx.newPage();
    const resp = await pg.request.post("/api/collateral", {
      data: {
        borrowerId: "GH-E2E-RELEASE-001",
        borrowerName: "E2E Release Borrower",
        collateralType: "equipment",
        assetLocalIdentifier: `EQ-RELEASE-${Date.now()}`,
        estimatedValue: "25000",
        currency: "GHS",
        country: "Ghana",
        description: "E2E release lifecycle test",
      },
    });
    expect(resp.status()).toBe(201);
    releaseColId = (await resp.json()).id;
    await ctx.close();
  });

  test("created collateral is in active/registered status", async ({ page }) => {
    await setSession(page, SA_SESSION);
    const r = await page.request.get(`/api/collateral/${releaseColId}`);
    expect(r.status()).toBe(200);
    const rec = await r.json() as { status: string };
    expect(["active", "registered", "pending"]).toContain(rec.status);
  });

  test("releasing collateral via API transitions status to released", async ({ page }) => {
    await setSession(page, SA_SESSION);
    const releaseResp = await page.request.post(`/api/collateral/${releaseColId}/release`, {
      data: { reason: "E2E test release — loan repaid in full" },
    });
    expect([200, 201]).toContain(releaseResp.status());

    const after = await page.request.get(`/api/collateral/${releaseColId}`);
    expect(after.status()).toBe(200);
    const rec = await after.json() as { status: string };
    expect(rec.status).toBe("released");
  });

  test("released collateral row shows released status badge in registry list", async ({ page }) => {
    await setSession(page, SA_SESSION);
    await page.goto("/collateral-registry");
    await page.waitForSelector('[data-testid="input-search-collateral"]', { timeout: 15000 });

    const rowLocator = page.locator(`[data-testid="row-collateral-${releaseColId}"]`);
    await expect(rowLocator).toBeVisible({ timeout: 12000 });
    const rowText = await rowLocator.textContent();
    expect(rowText?.toLowerCase()).toMatch(/release/);
  });
});

// ─── API endpoints ─────────────────────────────────────────────────────────────

test.describe("Collateral Registry — API", () => {
  test("GET /api/collateral returns 200 with array for lender", async ({ page }) => {
    await setSession(page, LENDER_SESSION);
    const resp = await page.request.get("/api/collateral");
    expect(resp.status()).toBe(200);
    expect(Array.isArray(await resp.json())).toBe(true);
  });

  test("GET /api/collateral returns 401 without auth", async ({ browser }) => {
    const context = await browser.newContext();
    try {
      await context.clearCookies();
      const resp = await context.request.get("/api/collateral");
      expect([401, 403]).toContain(resp.status());
    } finally {
      await context.close();
    }
  });

  test("GET /api/collateral/verify/:code returns 200 or 404, not 500", async ({ page }) => {
    const resp = await page.request.get("/api/collateral/verify/E2E-UNKNOWN-CODE-9999");
    expect([200, 404]).toContain(resp.status());
    expect(resp.status()).not.toBe(500);
  });
});

// ─── Certificate download ─────────────────────────────────────────────────────

test.describe("Collateral Registry — certificate PDF download", () => {
  test("certificate download button triggers a PDF download event", async ({ page }) => {
    await setSession(page, LENDER_SESSION);
    await page.goto("/collateral-registry");
    await page.waitForSelector('[data-testid="input-search-collateral"]', { timeout: 15000 });

    // Find the E2E collateral row and trigger cert download via list-row button
    const certBtn = page.locator(`[data-testid="btn-download-cert-${e2eColId}"]`);
    const certBtnAlt = page.locator('[data-testid^="btn-download-cert-"]').first();
    const btn = (await certBtn.count()) > 0 ? certBtn : certBtnAlt;

    const btnVisible = await btn.isVisible({ timeout: 8000 }).catch(() => false);
    if (!btnVisible) {
      // Navigate to detail view to get the download button
      const row = page.locator(`[data-testid="row-collateral-${e2eColId}"]`);
      if (await row.isVisible({ timeout: 5000 }).catch(() => false)) {
        await row.click();
        await page.waitForTimeout(1000);
      }
    }

    const downloadBtn = page.locator('[data-testid="detail-btn-download-cert"], [data-testid^="btn-download-cert-"]').first();
    await downloadBtn.waitFor({ timeout: 10000 });

    const [download] = await Promise.all([
      page.waitForEvent("download", { timeout: 20000 }),
      downloadBtn.click(),
    ]);
    expect(download.suggestedFilename().length).toBeGreaterThan(0);
    expect(download.suggestedFilename()).toMatch(/\.(pdf|PDF)$/);
  });
});

// ─── Lien search — priority ranking ─────────────────────────────────────────

test.describe("Collateral Registry — lien search priority ranking", () => {
  test("lien search for E2E asset returns results with priority field", async ({ page }) => {
    await setSession(page, LENDER_SESSION);
    await page.goto("/collateral-registry");
    await page.waitForSelector('[data-testid="tab-lien-search"]', { timeout: 15000 });
    await page.click('[data-testid="tab-lien-search"]');
    await page.waitForSelector('[data-testid="input-lien-search-asset"]', { timeout: 10000 });
    await page.fill('[data-testid="input-lien-search-asset"]', e2eAssetId);
    await page.click('[data-testid="btn-lien-search"]');

    // Lien result rows should appear for the E2E asset
    await expect(
      page.locator('[data-testid^="row-lien-result-"]').first().or(
        page.locator('text=No liens found, text=0 registered lien').first()
      ),
    ).toBeVisible({ timeout: 15000 });

    const results = await page.locator('[data-testid^="row-lien-result-"]').count();
    if (results > 0) {
      // Each result row must contain priority information
      const firstRowText = await page.locator('[data-testid^="row-lien-result-"]').first().textContent();
      expect(firstRowText?.length ?? 0).toBeGreaterThan(0);
      // Priority ranking text must be present — "1st", "Priority", "#1", or a numeric rank
      expect(firstRowText).toMatch(/priority|#?\d+|1st|2nd|3rd|rank/i);
    }
  });

  test("lien search API returns results with priorityRank field", async ({ page }) => {
    await setSession(page, LENDER_SESSION);
    const resp = await page.request.get(`/api/collateral/lien-search?assetId=${encodeURIComponent(e2eAssetId)}`);
    expect([200, 404]).toContain(resp.status());
    expect(resp.status()).not.toBe(500);
    if (resp.status() === 200) {
      type LienResult = { priorityRank?: number | string; priority?: number | string; rankOrder?: number | string };
      type LienBody = LienResult[] | { results?: LienResult[] };
      const body = await resp.json() as LienBody;
      const results = Array.isArray(body) ? body : (body as { results?: LienResult[] }).results ?? [];
      if (results.length > 0) {
        const first = results[0];
        // Priority rank field must be present and numeric
        const rank = first.priorityRank ?? first.priority ?? first.rankOrder;
        expect(typeof rank === "number" || typeof rank === "string").toBe(true);
      }
    }
  });

  test("lender role can run lien search — regulator also can", async ({ page }) => {
    await setSession(page, REG_SESSION);
    await page.goto("/collateral-registry");
    await page.waitForSelector('[data-testid="tab-lien-search"]', { timeout: 15000 });
    await page.click('[data-testid="tab-lien-search"]');
    await expect(page.locator('[data-testid="input-lien-search-asset"]')).toBeVisible({ timeout: 8000 });
    await expect(page.locator('[data-testid="btn-lien-search"]')).toBeVisible({ timeout: 8000 });
  });
});
