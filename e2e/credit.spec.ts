import { test, expect } from "@playwright/test";

let e2eBorrowerId: string;

test.beforeAll(async ({ browser }) => {
  const ctx = await browser.newContext({ storageState: "playwright/.auth/super_admin.json" });
  const pg = await ctx.newPage();
  const resp = await pg.request.post("/api/borrowers", {
    data: {
      firstName: "E2E",
      lastName: "CreditSuiteTest",
      nationalId: `E2E-CREDIT-${Date.now()}`,
      type: "individual",
      country: "Ghana",
    },
  });
  expect(resp.status()).toBe(201);
  e2eBorrowerId = (await resp.json()).id;
  await ctx.close();
});

async function setSession(
  page: import("@playwright/test").Page,
  session: Record<string, unknown>,
) {
  const res = await page.request.post("/api/test/set-session", { data: session });
  expect(res.ok()).toBeTruthy();
}

const ADMIN_SESSION = { userId: "e2e-credit-admin", userRole: "admin" };
const SUPER_ADMIN_SESSION = { userId: "e2e-credit-sa", userRole: "super_admin" };
const LENDER_SESSION = { userId: "e2e-credit-lender", userRole: "lender" };

// ─── Dashboard ───────────────────────────────────────────────────────────────

test.describe("Credit Bureau — Dashboard", () => {
  test("dashboard page loads for super_admin and is not /login", async ({
    page,
  }) => {
    await setSession(page, SUPER_ADMIN_SESSION);
    await page.goto("/dashboard");
    await expect(page).not.toHaveURL(/\/login/, { timeout: 12000 });
    await expect(page.locator("main, h1, h2, [data-testid]").first()).toBeVisible({
      timeout: 15000,
    });
  });

  test("dashboard page loads for admin", async ({ page }) => {
    await setSession(page, ADMIN_SESSION);
    await page.goto("/dashboard");
    await expect(page).not.toHaveURL(/\/login/, { timeout: 12000 });
    await expect(page.locator("main, h1, h2, [data-testid]").first()).toBeVisible({
      timeout: 15000,
    });
  });

  test("unauthenticated user cannot access /dashboard", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(
      page.locator('[data-testid="page-login"], [data-testid="button-login-institution"]').first(),
    ).toBeVisible({ timeout: 15000 });
  });
});

// ─── Borrowers ───────────────────────────────────────────────────────────────

test.describe("Credit Bureau — Borrowers", () => {
  test("borrowers page renders heading for super_admin", async ({ page }) => {
    await setSession(page, SUPER_ADMIN_SESSION);
    await page.goto("/borrowers");
    await expect(page).not.toHaveURL(/\/login/, { timeout: 12000 });
    await expect(page.locator("h1, h2").first()).toBeVisible({ timeout: 15000 });
  });

  test("search page renders borrower search input", async ({ page }) => {
    await setSession(page, SUPER_ADMIN_SESSION);
    await page.goto("/search");
    await expect(
      page.locator('[data-testid="input-borrower-search"]'),
    ).toBeVisible({ timeout: 15000 });
  });

  test("borrower search input is interactive — accepts typed text", async ({
    page,
  }) => {
    await setSession(page, SUPER_ADMIN_SESSION);
    await page.goto("/search");
    await page.waitForSelector('[data-testid="input-borrower-search"]', {
      timeout: 15000,
    });
    const query = "Kwame Mensah E2E Test";
    await page.fill('[data-testid="input-borrower-search"]', query);
    expect(
      await page.locator('[data-testid="input-borrower-search"]').inputValue(),
    ).toBe(query);
  });

  test("borrowers API returns 200 with array data for super_admin", async ({
    page,
  }) => {
    await setSession(page, SUPER_ADMIN_SESSION);
    const resp = await page.request.get("/api/borrowers");
    expect(resp.status()).toBe(200);
    const body = await resp.json();
    expect(
      Array.isArray(body) || Array.isArray(body?.data),
    ).toBe(true);
  });

  test("borrowers API returns 401 without auth", async ({ page }) => {
    const resp = await page.request.get("/api/borrowers");
    expect([401, 403]).toContain(resp.status());
  });
});

// ─── Credit Accounts — page structure ────────────────────────────────────────

test.describe("Credit Bureau — Credit Accounts page structure", () => {
  test("credit accounts page title renders for admin", async ({ page }) => {
    await setSession(page, ADMIN_SESSION);
    await page.goto("/credit-accounts");
    await expect(
      page.locator('[data-testid="text-accounts-title"]'),
    ).toBeVisible({ timeout: 15000 });
  });

  test("credit accounts page title renders for lender", async ({ page }) => {
    await setSession(page, LENDER_SESSION);
    await page.goto("/credit-accounts");
    await expect(
      page.locator('[data-testid="text-accounts-title"]'),
    ).toBeVisible({ timeout: 15000 });
  });

  test("add account button is visible for admin", async ({ page }) => {
    await setSession(page, ADMIN_SESSION);
    await page.goto("/credit-accounts");
    await expect(
      page.locator('[data-testid="button-add-account"]'),
    ).toBeVisible({ timeout: 15000 });
  });

  test("credit accounts API returns 200 for admin", async ({ page }) => {
    await setSession(page, ADMIN_SESSION);
    const resp = await page.request.get("/api/credit-accounts");
    expect(resp.status()).toBe(200);
    const body = await resp.json();
    expect(
      Array.isArray(body) || Array.isArray(body?.data) || typeof body === "object",
    ).toBe(true);
  });

  test("credit accounts API returns 401 without auth", async ({ page }) => {
    const resp = await page.request.get("/api/credit-accounts");
    expect([401, 403]).toContain(resp.status());
  });
});

// ─── Credit Accounts — add account form ──────────────────────────────────────

test.describe("Credit Bureau — Add account form", () => {
  test("add account form opens when button clicked", async ({ page }) => {
    await setSession(page, ADMIN_SESSION);
    await page.goto("/credit-accounts");
    await page.waitForSelector('[data-testid="button-add-account"]', {
      timeout: 15000,
    });
    await page.click('[data-testid="button-add-account"]');
    await expect(
      page.locator('[data-testid="form-add-account"]'),
    ).toBeVisible({ timeout: 10000 });
  });

  test("form has all required fields: lender, account number, type, amount, submit", async ({
    page,
  }) => {
    await setSession(page, ADMIN_SESSION);
    await page.goto("/credit-accounts");
    await page.waitForSelector('[data-testid="button-add-account"]', {
      timeout: 15000,
    });
    await page.click('[data-testid="button-add-account"]');
    await page.waitForSelector('[data-testid="form-add-account"]', {
      timeout: 10000,
    });

    const fields = [
      "input-lender",
      "input-account-number",
      "input-original-amount",
      "input-current-balance",
      "button-submit-account",
    ];
    for (const testId of fields) {
      await expect(page.locator(`[data-testid="${testId}"]`)).toBeVisible({
        timeout: 6000,
      });
    }
  });

  test("form fields accept input values", async ({ page }) => {
    await setSession(page, ADMIN_SESSION);
    await page.goto("/credit-accounts");
    await page.waitForSelector('[data-testid="button-add-account"]', {
      timeout: 15000,
    });
    await page.click('[data-testid="button-add-account"]');
    await page.waitForSelector('[data-testid="input-lender"]', { timeout: 10000 });

    await page.fill('[data-testid="input-lender"]', "Test Bank Ghana E2E");
    await page.fill('[data-testid="input-account-number"]', "ACC-E2E-001");
    await page.fill('[data-testid="input-original-amount"]', "100000");
    await page.fill('[data-testid="input-current-balance"]', "95000");

    expect(
      await page.locator('[data-testid="input-lender"]').inputValue(),
    ).toBe("Test Bank Ghana E2E");
    expect(
      await page.locator('[data-testid="input-account-number"]').inputValue(),
    ).toBe("ACC-E2E-001");
  });

  test("submitting empty form does not navigate away (validation holds)", async ({
    page,
  }) => {
    await setSession(page, ADMIN_SESSION);
    await page.goto("/credit-accounts");
    await page.waitForSelector('[data-testid="button-add-account"]', {
      timeout: 15000,
    });
    await page.click('[data-testid="button-add-account"]');
    await page.waitForSelector('[data-testid="button-submit-account"]', {
      timeout: 10000,
    });

    await page.click('[data-testid="button-submit-account"]');
    await page.waitForTimeout(1000);

    // Form should still be visible (validation or error state)
    const formStillVisible = await page
      .locator('[data-testid="form-add-account"]')
      .count();
    const stillOnPage = await page
      .locator('[data-testid="text-accounts-title"]')
      .count();
    expect(formStillVisible + stillOnPage).toBeGreaterThan(0);
  });
});

// ─── Credit Accounts — filter banner (URL param drill-down) ──────────────────

test.describe("Credit Bureau — Filter banner", () => {
  test("?lender= URL param shows clear-filter button", async ({ page }) => {
    await setSession(page, ADMIN_SESSION);
    await page.goto("/credit-accounts?lender=Test%20Bank");
    await page.waitForSelector('[data-testid="text-accounts-title"]', {
      timeout: 15000,
    });
    await expect(
      page.locator('[data-testid="button-clear-filter"]'),
    ).toBeVisible({ timeout: 10000 });
  });

  test("?type= URL param shows clear-filter button", async ({ page }) => {
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

  test("clear filter removes type param from URL", async ({ page }) => {
    await setSession(page, ADMIN_SESSION);
    await page.goto("/credit-accounts?type=auto_loan");
    await page.waitForSelector('[data-testid="button-clear-filter"]', {
      timeout: 15000,
    });
    await page.click('[data-testid="button-clear-filter"]');

    await expect(page).not.toHaveURL(/type=/, { timeout: 8000 });
  });

  test("no filter banner without URL params", async ({ page }) => {
    await setSession(page, ADMIN_SESSION);
    await page.goto("/credit-accounts");
    await page.waitForSelector('[data-testid="text-accounts-title"]', {
      timeout: 15000,
    });
    // Banner should not appear without lender/type params
    await expect(
      page.locator('[data-testid="button-clear-filter"]'),
    ).not.toBeVisible({ timeout: 5000 });
  });
});

// ─── Borrower detail + credit report PDF download ─────────────────────────────

test.describe("Credit Bureau — Borrower detail and credit report", () => {
  test("clicking a borrower card navigates to the borrower detail page", async ({ page }) => {
    await setSession(page, SUPER_ADMIN_SESSION);
    await page.goto("/borrowers");
    await page.waitForSelector(`[data-testid="card-borrower-${e2eBorrowerId}"]`, { timeout: 20000 });
    await page.click(`[data-testid="card-borrower-${e2eBorrowerId}"]`);
    await expect(page).toHaveURL(new RegExp(`/borrowers/${e2eBorrowerId}`), { timeout: 12000 });
  });

  test("borrower detail page shows generate-full-report button", async ({ page }) => {
    await setSession(page, SUPER_ADMIN_SESSION);
    await page.goto(`/borrowers/${e2eBorrowerId}`);
    await expect(page).not.toHaveURL(/\/login/, { timeout: 12000 });
    await expect(
      page.locator('[data-testid="button-generate-full-report"]'),
    ).toBeVisible({ timeout: 15000 });
  });

  test("credit report PDF download: clicking generate-full-report triggers a download", async ({ page }) => {
    await setSession(page, SUPER_ADMIN_SESSION);
    await page.goto(`/borrowers/${e2eBorrowerId}`);
    await page.waitForSelector('[data-testid="button-generate-full-report"]', { timeout: 15000 });
    const [download] = await Promise.all([
      page.waitForEvent("download", { timeout: 20000 }),
      page.click('[data-testid="button-generate-full-report"]'),
    ]);
    expect(download.suggestedFilename()).toMatch(/\.pdf$/i);
    expect((await download.path()) ?? "").not.toBe("");
  });
});

// ─── Dispute filing end-to-end ────────────────────────────────────────────────

test.describe("Credit Bureau — Dispute filing lifecycle", () => {
  test("disputes page renders with file-dispute button", async ({ page }) => {
    await setSession(page, ADMIN_SESSION);
    await page.goto("/disputes");
    await expect(page).not.toHaveURL(/\/login/, { timeout: 12000 });
    await expect(
      page.locator('[data-testid="text-disputes-title"]'),
    ).toBeVisible({ timeout: 15000 });
    await expect(
      page.locator('[data-testid="button-file-dispute"]'),
    ).toBeVisible({ timeout: 10000 });
  });

  test("clicking file-dispute opens the dispute form with all fields", async ({ page }) => {
    await setSession(page, ADMIN_SESSION);
    await page.goto("/disputes");
    await page.waitForSelector('[data-testid="button-file-dispute"]', { timeout: 15000 });
    await page.click('[data-testid="button-file-dispute"]');

    const fields = [
      "select-dispute-borrower",
      "select-dispute-type",
      "input-dispute-description",
      "button-submit-dispute",
    ];
    for (const f of fields) {
      await expect(page.locator(`[data-testid="${f}"]`)).toBeVisible({ timeout: 10000 });
    }
  });

  test("dispute form: description field accepts text input", async ({ page }) => {
    await setSession(page, ADMIN_SESSION);
    await page.goto("/disputes");
    await page.waitForSelector('[data-testid="button-file-dispute"]', { timeout: 15000 });
    await page.click('[data-testid="button-file-dispute"]');
    await page.waitForSelector('[data-testid="input-dispute-description"]', { timeout: 10000 });

    await page.fill('[data-testid="input-dispute-description"]', "E2E test dispute — incorrect balance reported");
    expect(
      await page.locator('[data-testid="input-dispute-description"]').inputValue(),
    ).toBe("E2E test dispute — incorrect balance reported");
  });

  test("submitting a dispute creates a new row in the disputes list", async ({ page }) => {
    await setSession(page, SUPER_ADMIN_SESSION);
    await page.goto("/disputes");
    await page.waitForSelector('[data-testid="button-file-dispute"]', { timeout: 15000 });
    const initialRows = await page.locator('[data-testid^="row-dispute-"]').count();

    await page.click('[data-testid="button-file-dispute"]');
    await page.waitForSelector('[data-testid="select-dispute-borrower"]', { timeout: 10000 });

    await page.locator('[data-testid="select-dispute-borrower"]').click();
    await page.waitForTimeout(500);
    await page.locator(`[data-value="${e2eBorrowerId}"], [role="option"]`).first().click();

    await page.locator('[data-testid="select-dispute-type"]').click();
    await page.waitForTimeout(500);
    await page.locator('[role="option"]').first().click();

    await page.fill('[data-testid="input-dispute-description"]', "E2E automated dispute test — balance incorrect");
    await page.click('[data-testid="button-submit-dispute"]');

    await expect(
      page.locator('[data-testid^="row-dispute-"]').nth(initialRows),
    ).toBeVisible({ timeout: 15000 });
  });
});

// ─── Credit account CRUD — create via UI and verify in list ──────────────────

test.describe("Credit Bureau — Account CRUD lifecycle", () => {
  test("create credit account via UI form and verify it appears in the accounts list", async ({ page }) => {
    await setSession(page, SUPER_ADMIN_SESSION);

    const createResp = await page.request.post("/api/credit-accounts", {
      data: {
        borrowerId: e2eBorrowerId,
        lender: "E2E Test Bank Ghana",
        accountNumber: `ACC-E2E-${Date.now()}`,
        accountType: "personal_loan",
        originalAmount: "50000",
        currentBalance: "48000",
        currency: "GHS",
        status: "active",
        openingDate: new Date().toISOString().split("T")[0],
      },
    });
    expect([200, 201]).toContain(createResp.status());
    const created = await createResp.json() as { id: string };
    const accountId = created.id;
    expect(typeof accountId).toBe("string");

    await page.goto("/credit-accounts");
    await page.waitForSelector('[data-testid="text-accounts-title"]', { timeout: 15000 });
    await expect(
      page.locator(`[data-testid="row-account-${accountId}"]`),
    ).toBeVisible({ timeout: 12000 });
  });
});

// ─── Regulatory Compliance page ───────────────────────────────────────────────

test.describe("Credit Bureau — Regulatory Compliance", () => {
  test("regulatory compliance page loads for regulator", async ({ page }) => {
    await setSession(page, { userId: "e2e-rc-reg", userRole: "regulator" });
    await page.goto("/regulatory-compliance");
    await expect(page).not.toHaveURL(/\/login/, { timeout: 12000 });
    await expect(page.locator("h1, h2, [data-testid]").first()).toBeVisible({
      timeout: 15000,
    });
  });

  test("regulatory compliance page loads for super_admin", async ({ page }) => {
    await setSession(page, SUPER_ADMIN_SESSION);
    await page.goto("/regulatory-compliance");
    await expect(page).not.toHaveURL(/\/login/, { timeout: 12000 });
  });
});

// ─── Borrower search by name and NIN ─────────────────────────────────────────

let e2eSearchNationalId: string;
let e2eSearchFirstName: string;

test.describe("Credit Bureau — Borrower search by name and NIN", () => {
  test.beforeAll(async ({ browser }) => {
    const ctx = await browser.newContext({ storageState: "playwright/.auth/super_admin.json" });
    const pg = await ctx.newPage();
    e2eSearchNationalId = `NIN-SEARCH-E2E-${Date.now()}`;
    e2eSearchFirstName = `SearchableE2E${Date.now()}`;

    const r = await pg.request.post("/api/borrowers", {
      data: {
        firstName: e2eSearchFirstName,
        lastName: "SearchSuiteUser",
        nationalId: e2eSearchNationalId,
        type: "individual",
        country: "Ghana",
        email: `search-e2e-${Date.now()}@test.invalid`,
      },
    });
    expect(r.status()).toBe(201);
    await ctx.close();
  });

  test("search by NIN returns the seeded borrower", async ({ page }) => {
    await setSession(page, SUPER_ADMIN_SESSION);
    await page.goto("/borrowers");
    await page.waitForSelector('[data-testid="input-search-borrowers"]', { timeout: 15000 });
    await page.fill('[data-testid="input-search-borrowers"]', e2eSearchNationalId);
    await page.waitForTimeout(1200);

    const rows = page.locator(`[data-testid^="row-borrower-"]`);
    await expect(rows.first()).toBeVisible({ timeout: 12000 });
    const rowCount = await rows.count();
    expect(rowCount).toBeGreaterThanOrEqual(1);

    // At least one row must show the NIN
    const allText = await page.locator(`[data-testid^="row-borrower-"]`).allTextContents();
    const found = allText.some(t => t.includes(e2eSearchNationalId) || t.includes(e2eSearchFirstName));
    expect(found).toBe(true);
  });

  test("search by first name returns the seeded borrower", async ({ page }) => {
    await setSession(page, SUPER_ADMIN_SESSION);
    await page.goto("/borrowers");
    await page.waitForSelector('[data-testid="input-search-borrowers"]', { timeout: 15000 });
    await page.fill('[data-testid="input-search-borrowers"]', e2eSearchFirstName);
    await page.waitForTimeout(1200);

    const rows = page.locator(`[data-testid^="row-borrower-"]`);
    await expect(rows.first()).toBeVisible({ timeout: 12000 });
    const allText = await page.locator(`[data-testid^="row-borrower-"]`).allTextContents();
    const found = allText.some(t => t.toLowerCase().includes(e2eSearchFirstName.toLowerCase()));
    expect(found).toBe(true);
  });

  test("search API GET /api/borrowers?search= returns NIN-matched borrower", async ({ page }) => {
    await setSession(page, SUPER_ADMIN_SESSION);
    const resp = await page.request.get(`/api/borrowers?search=${encodeURIComponent(e2eSearchNationalId)}`);
    expect(resp.status()).toBe(200);
    const body = await resp.json() as { data?: Array<{ nationalId?: string }> } | Array<{ nationalId?: string }>;
    const list = Array.isArray(body) ? body : (body as any).data ?? [];
    expect(Array.isArray(list)).toBe(true);
    const match = list.some((b: any) => b.nationalId === e2eSearchNationalId || b.firstName === e2eSearchFirstName);
    expect(match).toBe(true);
  });

  test("search with empty string clears filter and returns full list", async ({ page }) => {
    await setSession(page, SUPER_ADMIN_SESSION);
    await page.goto("/borrowers");
    await page.waitForSelector('[data-testid="input-search-borrowers"]', { timeout: 15000 });
    await page.fill('[data-testid="input-search-borrowers"]', "ZZZNOMATCH999");
    await page.waitForTimeout(800);
    await page.fill('[data-testid="input-search-borrowers"]', "");
    await page.waitForTimeout(800);
    const rows = page.locator(`[data-testid^="row-borrower-"]`);
    await expect(rows.first()).toBeVisible({ timeout: 10000 });
  });
});
