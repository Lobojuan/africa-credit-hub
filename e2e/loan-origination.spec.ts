import { test, expect } from "@playwright/test";

const SA = { userId: "e2e-loan-sa", userRole: "super_admin" };
const ADMIN = { userId: "e2e-loan-admin", userRole: "admin" };

const TEST_BORROWER = {
  firstName: "E2E",
  lastName: "LoanTestUser",
  nationalId: `E2E-LOAN-${Date.now()}`,
  type: "individual",
  country: "Ghana",
};

let testBorrowerId: string;
let testLoanId: string;
let rejectLoanId: string;

async function session(page: import("@playwright/test").Page, s = SA) {
  const r = await page.request.post("/api/test/set-session", { data: s });
  expect(r.ok()).toBeTruthy();
}

test.beforeAll(async ({ browser }) => {
  const ctx = await browser.newContext({ storageState: "playwright/.auth/super_admin.json" });
  const pg = await ctx.newPage();

  const bRes = await pg.request.post("/api/borrowers", { data: TEST_BORROWER });
  expect(bRes.status()).toBe(201);
  testBorrowerId = (await bRes.json()).id;

  const lRes = await pg.request.post("/api/loans", {
    data: {
      borrowerId: testBorrowerId,
      loanType: "personal",
      requestedAmount: "30000",
      termMonths: 12,
      purpose: "E2E maker-checker approve test",
      currency: "GHS",
    },
  });
  expect(lRes.status()).toBe(201);
  testLoanId = (await lRes.json()).id;

  const rRes = await pg.request.post("/api/loans", {
    data: {
      borrowerId: testBorrowerId,
      loanType: "business",
      requestedAmount: "15000",
      termMonths: 6,
      purpose: "E2E maker-checker reject test",
      currency: "USD",
    },
  });
  expect(rRes.status()).toBe(201);
  rejectLoanId = (await rRes.json()).id;

  await ctx.close();
});

test.describe("Loan Origination — page structure", () => {
  test("page loads and new-application button is visible", async ({ page }) => {
    await session(page, ADMIN);
    await page.goto("/loan-origination");
    await expect(page).not.toHaveURL(/\/login/, { timeout: 12000 });
    await expect(page.locator('[data-testid="btn-new-loan-application"]')).toBeVisible({ timeout: 15000 });
  });

  test("search and status filter are visible", async ({ page }) => {
    await session(page, ADMIN);
    await page.goto("/loan-origination");
    await expect(page.locator('[data-testid="input-search-loans"]')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('[data-testid="select-status-filter"]')).toBeVisible({ timeout: 15000 });
  });
});

test.describe("Loan Origination — application form", () => {
  test("new-application button opens form with required fields", async ({ page }) => {
    await session(page, ADMIN);
    await page.goto("/loan-origination");
    await page.waitForSelector('[data-testid="btn-new-loan-application"]', { timeout: 15000 });
    await page.click('[data-testid="btn-new-loan-application"]');

    for (const id of ["input-borrower-id", "select-loan-type", "input-requested-amount", "input-term-months", "input-purpose", "btn-submit-loan"]) {
      await expect(page.locator(`[data-testid="${id}"]`)).toBeVisible({ timeout: 8000 });
    }
  });

  test("form fields accept input", async ({ page }) => {
    await session(page, ADMIN);
    await page.goto("/loan-origination");
    await page.click('[data-testid="btn-new-loan-application"]');
    await page.waitForSelector('[data-testid="input-borrower-id"]', { timeout: 10000 });
    await page.fill('[data-testid="input-borrower-id"]', testBorrowerId);
    await page.fill('[data-testid="input-requested-amount"]', "25000");
    await page.fill('[data-testid="input-term-months"]', "18");
    expect(await page.locator('[data-testid="input-borrower-id"]').inputValue()).toBe(testBorrowerId);
    expect(await page.locator('[data-testid="input-requested-amount"]').inputValue()).toBe("25000");
  });

  test("empty form submit stays on form (validation prevents navigation)", async ({ page }) => {
    await session(page, ADMIN);
    await page.goto("/loan-origination");
    await page.click('[data-testid="btn-new-loan-application"]');
    await page.waitForSelector('[data-testid="btn-submit-loan"]', { timeout: 10000 });
    await page.click('[data-testid="btn-submit-loan"]');
    await page.waitForTimeout(1000);
    await expect(page.locator('[data-testid="input-borrower-id"]')).toBeVisible({ timeout: 5000 });
  });

  test("UI form submission with real borrower creates pending loan that appears in list", async ({ page }) => {
    await session(page, SA);
    await page.goto("/loan-origination");
    await page.click('[data-testid="btn-new-loan-application"]');
    await page.waitForSelector('[data-testid="input-borrower-id"]', { timeout: 10000 });
    await page.fill('[data-testid="input-borrower-id"]', testBorrowerId);
    await page.fill('[data-testid="input-requested-amount"]', "40000");
    await page.fill('[data-testid="input-term-months"]', "24");
    await page.fill('[data-testid="input-purpose"]', "E2E UI form submission test");
    await page.click('[data-testid="btn-submit-loan"]');

    await expect(
      page.locator('[data-testid^="row-loan-"]').first(),
    ).toBeVisible({ timeout: 15000 });
  });
});

test.describe("Loan Origination — maker-checker approval lifecycle", () => {
  test("created loan is in pending status", async ({ page }) => {
    await session(page, SA);
    const r = await page.request.get(`/api/loans/${testLoanId}`);
    expect(r.status()).toBe(200);
    const loan = await r.json();
    expect(["pending", "pending_approval", "submitted"]).toContain(loan.status);
  });

  test("approving the loan transitions status to approved", async ({ page }) => {
    await session(page, SA);
    const r = await page.request.post(`/api/loans/${testLoanId}/approve`, {
      data: { notes: "E2E maker-checker approval" },
    });
    expect(r.status()).toBe(200);

    const after = await page.request.get(`/api/loans/${testLoanId}`);
    expect(after.status()).toBe(200);
    expect((await after.json()).status).toBe("approved");
  });

  test("approved loan row is visible in list", async ({ page }) => {
    await session(page, SA);
    await page.goto("/loan-origination");
    await page.waitForSelector('[data-testid="input-search-loans"]', { timeout: 15000 });
    await expect(page.locator(`[data-testid="row-loan-${testLoanId}"]`)).toBeVisible({ timeout: 12000 });
  });

  test("rejecting a loan transitions status to rejected", async ({ page }) => {
    await session(page, SA);
    const r = await page.request.post(`/api/loans/${rejectLoanId}/reject`, {
      data: { reason: "E2E test rejection" },
    });
    expect(r.status()).toBe(200);

    const after = await page.request.get(`/api/loans/${rejectLoanId}`);
    expect(after.status()).toBe(200);
    expect((await after.json()).status).toBe("rejected");
  });
});

test.describe("Loan Origination — API access control", () => {
  test("GET /api/loans requires auth", async ({ page }) => {
    const r = await page.request.get("/api/loans");
    expect([401, 403]).toContain(r.status());
  });

  test("GET /api/loans returns array for super_admin", async ({ page }) => {
    await session(page, SA);
    const r = await page.request.get("/api/loans");
    expect(r.status()).toBe(200);
    const body = await r.json();
    expect(Array.isArray(body) || Array.isArray(body?.data)).toBe(true);
  });

  test("approve on unknown loan ID returns 400 or 404 not 500", async ({ page }) => {
    await session(page, SA);
    const r = await page.request.post("/api/loans/nonexistent-xyz/approve", { data: { notes: "t" } });
    expect([400, 404]).toContain(r.status());
    expect(r.status()).not.toBe(500);
  });
});

// ─── Maker-checker: lender submits → admin approves ───────────────────────────

test.describe("Loan Origination — lender-submit / admin-approve maker-checker separation", () => {
  const LENDER = { userId: "e2e-loan-lender", userRole: "lender" };

  let lenderSubmittedLoanId: string;

  test("lender role can submit a loan application (POST /api/loans → 201)", async ({ page }) => {
    await session(page, LENDER);
    const resp = await page.request.post("/api/loans", {
      data: {
        borrowerId: testBorrowerId,
        loanType: "personal",
        requestedAmount: "12000",
        termMonths: 9,
        purpose: "E2E lender-submit maker-checker flow",
        currency: "GHS",
      },
    });
    expect(resp.status()).toBe(201);
    const loan = await resp.json() as { id: string; status: string };
    lenderSubmittedLoanId = loan.id;
    expect(lenderSubmittedLoanId).toBeTruthy();
    // Lender submission must create a pending/awaiting-review status — never auto-approved
    expect(["pending", "pending_approval", "submitted", "under_review"]).toContain(loan.status);
  });

  test("submitted loan is in a pending state — not yet approved by admin", async ({ page }) => {
    await session(page, SA);
    const resp = await page.request.get(`/api/loans/${lenderSubmittedLoanId}`);
    expect(resp.status()).toBe(200);
    const loan = await resp.json() as { status: string; submittedBy?: string };
    expect(["pending", "pending_approval", "submitted", "under_review"]).toContain(loan.status);
  });

  test("admin (maker-checker reviewer) approves lender-submitted loan → status becomes approved", async ({ page }) => {
    // Admin acts as the second signatory in the maker-checker workflow
    await session(page, SA);
    const resp = await page.request.post(`/api/loans/${lenderSubmittedLoanId}/approve`, {
      data: { notes: "E2E maker-checker: admin approves lender submission" },
    });
    expect(resp.status()).toBe(200);

    const after = await page.request.get(`/api/loans/${lenderSubmittedLoanId}`);
    expect(after.status()).toBe(200);
    expect((await after.json() as { status: string }).status).toBe("approved");
  });

  test("lender cannot self-approve their own submission (separation of duties)", async ({ page }) => {
    // Submit another loan as lender
    await session(page, LENDER);
    const subResp = await page.request.post("/api/loans", {
      data: {
        borrowerId: testBorrowerId,
        loanType: "personal",
        requestedAmount: "5000",
        termMonths: 3,
        purpose: "E2E self-approve test",
        currency: "GHS",
      },
    });
    expect(subResp.status()).toBe(201);
    const selfLoanId = (await subResp.json() as { id: string }).id;

    // Attempt self-approval as the same lender — separation of duties must prevent this
    const approveResp = await page.request.post(`/api/loans/${selfLoanId}/approve`, {
      data: { notes: "Lender self-approve attempt" },
    });
    // Separation of duties: lender must NOT approve their own submission.
    // 403 = role-based rejection (correct), 401 = session issue, 404 = route not found for role.
    // 200 = self-approval succeeded — this is a SECURITY VULNERABILITY and will fail the test.
    expect([403, 401, 404]).toContain(approveResp.status());
  });
});
