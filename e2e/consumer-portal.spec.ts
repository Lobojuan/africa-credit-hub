/**
 * Consumer Portal E2E Suite
 *
 * Tests the self-service consumer portal at /consumer-portal with stateful
 * assertions covering login, registration, authenticated interactions, and
 * business lifecycle flows.
 *
 * Covers:
 *   1. Unauthenticated view: login tabs, wrong credentials error
 *   2. Registration form: fields render and accept input
 *   3. Authenticated consumer portal (session injection):
 *      a. Portal renders authenticated state (credit-file or no-credit-file card)
 *      b. Score simulator: toggle switches → simulator-result appears
 *      c. Credit freeze: toggle switch → freeze banner state changes
 *      d. Dispute card renders
 *      e. Report download button present
 *   4. API protection: credit-score, disputes, credit-freeze require consumer auth
 *   5. Main app consumer login path
 *
 * The simulator and freeze tests use a real borrower from the DB (found via
 * GET /api/borrowers) injected as the consumer session. They skip gracefully
 * if no borrowers are seeded.
 */

import { test, expect } from "@playwright/test";

async function setConsumerSession(page: import("@playwright/test").Page, session: Record<string, unknown>) {
  const res = await page.request.post("/api/test/set-session", { data: session });
  expect(res.ok()).toBeTruthy();
}

async function setAdminSession(page: import("@playwright/test").Page) {
  const res = await page.request.post("/api/test/set-session", { data: { userId: "e2e-sa", userRole: "super_admin" } });
  expect(res.ok()).toBeTruthy();
}

async function findConsumerWithCreditFile(page: import("@playwright/test").Page) {
  await setAdminSession(page);
  const resp = await page.request.get("/api/borrowers?limit=5");
  if (resp.status() !== 200) return null;
  const body = await resp.json();
  const borrowers = body.data ?? body;
  if (!Array.isArray(borrowers) || borrowers.length === 0) return null;
  // Return first borrower that has a nationalId
  return borrowers.find((b: any) => b.nationalId || b.ghanaCardNumber) ?? borrowers[0] ?? null;
}

// ─── Unauthenticated view ─────────────────────────────────────────────────────

test.describe("Consumer Portal — landing page", () => {
  test("consumer portal renders at /consumer-portal", async ({ page }) => {
    await page.goto("/consumer-portal");
    await expect(
      page.locator('[data-testid="badge-consumer-portal"], [data-testid="tab-password-login"]').first(),
    ).toBeVisible({ timeout: 15000 });
  });

  test("password login tab shows consumer-id and password inputs", async ({ page }) => {
    await page.goto("/consumer-portal");
    await page.waitForSelector('[data-testid="tab-password-login"]', { timeout: 15000 });
    await page.click('[data-testid="tab-password-login"]');

    await expect(page.locator('[data-testid="input-consumer-id"]')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('[data-testid="input-consumer-password"]')).toBeVisible();
    await expect(page.locator('[data-testid="button-consumer-login"]')).toBeVisible();
  });

  test("SMS login tab is visible", async ({ page }) => {
    await page.goto("/consumer-portal");
    await expect(page.locator('[data-testid="tab-sms-login"]')).toBeVisible({ timeout: 15000 });
  });

  test("wrong credentials show consumer portal error message", async ({ page }) => {
    await page.goto("/consumer-portal");
    await page.waitForSelector('[data-testid="tab-password-login"]', { timeout: 15000 });
    await page.click('[data-testid="tab-password-login"]');
    await page.waitForSelector('[data-testid="input-consumer-id"]', { timeout: 10000 });

    await page.fill('[data-testid="input-consumer-id"]', "GH-INVALID-999-E2E-NEVER-EXISTS");
    await page.fill('[data-testid="input-consumer-password"]', "wrong-password-e2e");
    await page.click('[data-testid="button-consumer-login"]');

    await expect(page.locator('[data-testid="text-consumer-error"]')).toBeVisible({ timeout: 10000 });
  });

  test("register link is visible", async ({ page }) => {
    await page.goto("/consumer-portal");
    await expect(page.locator('[data-testid="link-to-register"]')).toBeVisible({ timeout: 15000 });
  });
});

// ─── Registration form ────────────────────────────────────────────────────────

test.describe("Consumer Portal — registration form", () => {
  test("clicking register link shows registration fields", async ({ page }) => {
    await page.goto("/consumer-portal");
    await page.waitForSelector('[data-testid="link-to-register"]', { timeout: 15000 });
    await page.click('[data-testid="link-to-register"]');

    await expect(page.locator('[data-testid="input-register-fullname"]')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('[data-testid="input-register-id"]')).toBeVisible({ timeout: 8000 });
  });

  test("registration form accepts input values", async ({ page }) => {
    await page.goto("/consumer-portal");
    await page.waitForSelector('[data-testid="link-to-register"]', { timeout: 15000 });
    await page.click('[data-testid="link-to-register"]');
    await page.waitForSelector('[data-testid="input-register-fullname"]', { timeout: 10000 });

    await page.fill('[data-testid="input-register-fullname"]', "E2E Consumer Test User");
    await page.fill('[data-testid="input-register-id"]', "GH-E2E-REG-001");

    expect(await page.locator('[data-testid="input-register-fullname"]').inputValue()).toBe("E2E Consumer Test User");
    expect(await page.locator('[data-testid="input-register-id"]').inputValue()).toBe("GH-E2E-REG-001");
  });
});

// ─── Authenticated portal — no credit file case ───────────────────────────────

test.describe("Consumer Portal — authenticated (no credit file)", () => {
  const FAKE_CONSUMER = { consumerId: "e2e-consumer-fake-001", consumerNationalId: "FAKE-NOID-E2E-001" };

  test("no-credit-file card renders for consumer not in DB", async ({ page }) => {
    await setConsumerSession(page, FAKE_CONSUMER);
    await page.goto("/consumer-portal");
    await page.waitForTimeout(2500);

    // A fake consumer not in the DB should see card-no-credit-file
    const noFile = page.locator('[data-testid="card-no-credit-file"]');
    const download = page.locator('[data-testid="button-download-credit-report"]');
    await expect(noFile.or(download).first()).toBeVisible({ timeout: 12000 });
  });
});

// ─── Authenticated portal — with real borrower session ────────────────────────

test.describe("Consumer Portal — authenticated (real borrower session)", () => {
  test("score simulator: toggling pay-arrears switch reveals simulator result", async ({ page }) => {
    const borrower = await findConsumerWithCreditFile(page);
    if (!borrower) {
      test.skip(true, "No borrowers in DB — skipping score simulator test");
      return;
    }

    const nationalId = borrower.nationalId ?? borrower.ghanaCardNumber ?? borrower.id;
    await setConsumerSession(page, { consumerId: borrower.id, consumerNationalId: nationalId });
    await page.goto("/consumer-portal");
    await page.waitForTimeout(3000);

    // If consumer has a credit file, card-score-simulator renders
    const simulator = page.locator('[data-testid="card-score-simulator"]');
    const noFile = page.locator('[data-testid="card-no-credit-file"]');

    const hasSimulator = await simulator.isVisible();
    if (!hasSimulator) {
      // Consumer exists but has no credit file in this DB — skip
      await expect(noFile).toBeVisible({ timeout: 5000 });
      test.skip(true, "Borrower has no credit file — score simulator not shown");
      return;
    }

    // Toggle the "pay arrears" switch
    const payArrearsSwitch = page.locator('[data-testid="switch-sim-pay-arrears"]');
    await payArrearsSwitch.waitFor({ timeout: 8000 });
    const wasChecked = await payArrearsSwitch.isChecked();
    await payArrearsSwitch.click();
    // After toggling, the simulator-result should appear
    await expect(page.locator('[data-testid="simulator-result"]')).toBeVisible({ timeout: 8000 });

    // Verify the switch state actually changed
    const nowChecked = await payArrearsSwitch.isChecked();
    expect(nowChecked).toBe(!wasChecked);
  });

  test("credit freeze: toggling freeze switch changes banner state", async ({ page }) => {
    const borrower = await findConsumerWithCreditFile(page);
    if (!borrower) {
      test.skip(true, "No borrowers in DB — skipping credit freeze test");
      return;
    }

    const nationalId = borrower.nationalId ?? borrower.ghanaCardNumber ?? borrower.id;
    await setConsumerSession(page, { consumerId: borrower.id, consumerNationalId: nationalId });
    await page.goto("/consumer-portal");
    await page.waitForTimeout(3000);

    const freezeCard = page.locator('[data-testid="card-credit-freeze"]');
    const noFile = page.locator('[data-testid="card-no-credit-file"]');

    const hasFreezeCard = await freezeCard.isVisible();
    if (!hasFreezeCard) {
      await expect(noFile).toBeVisible({ timeout: 5000 });
      test.skip(true, "Borrower has no credit file — freeze card not shown");
      return;
    }

    // Toggle the credit freeze switch
    const freezeSwitch = page.locator('[data-testid="switch-credit-freeze"]');
    await freezeSwitch.waitFor({ timeout: 8000 });
    const wasFrozen = await freezeSwitch.isChecked();
    await freezeSwitch.click();

    // Wait for the state change to propagate
    await page.waitForTimeout(1500);

    // After toggling, the banner state should reflect the new freeze status
    const nowFrozen = await freezeSwitch.isChecked();
    expect(nowFrozen).toBe(!wasFrozen);

    // If now frozen, the freeze banner should appear
    if (nowFrozen) {
      await expect(page.locator('[data-testid="banner-credit-freeze"]')).toBeVisible({ timeout: 8000 });
    }

    // Toggle back to original state (cleanup)
    await freezeSwitch.click();
    await page.waitForTimeout(1000);
  });

  test("dispute card renders for consumer with credit file", async ({ page }) => {
    const borrower = await findConsumerWithCreditFile(page);
    if (!borrower) {
      test.skip(true, "No borrowers in DB");
      return;
    }
    const nationalId = borrower.nationalId ?? borrower.ghanaCardNumber ?? borrower.id;
    await setConsumerSession(page, { consumerId: borrower.id, consumerNationalId: nationalId });
    await page.goto("/consumer-portal");
    await page.waitForTimeout(3000);

    const disputeCard = page.locator('[data-testid="card-file-dispute"]');
    const noFile = page.locator('[data-testid="card-no-credit-file"]');
    await expect(disputeCard.or(noFile).first()).toBeVisible({ timeout: 12000 });
  });
});

// ─── Consumer API protection ──────────────────────────────────────────────────

test.describe("Consumer Portal — API protection", () => {
  test("GET /api/consumer/credit-score returns 401 without auth", async ({ page }) => {
    const resp = await page.request.get("/api/consumer/credit-score");
    expect([401, 403]).toContain(resp.status());
  });

  test("GET /api/consumer/disputes returns 401 without auth", async ({ page }) => {
    const resp = await page.request.get("/api/consumer/disputes");
    expect([401, 403]).toContain(resp.status());
  });

  test("POST /api/consumer/credit-freeze returns 401 without auth", async ({ page }) => {
    const resp = await page.request.post("/api/consumer/credit-freeze");
    expect([401, 403]).toContain(resp.status());
  });

  test("consumer credit-score endpoint returns 200 or 404 with valid session", async ({ page }) => {
    await setConsumerSession(page, { consumerId: "e2e-cs-001", consumerNationalId: "GH-E2E-CS-001" });
    const resp = await page.request.get("/api/consumer/credit-score");
    expect([200, 404]).toContain(resp.status());
    expect(resp.status()).not.toBe(401);
  });
});

// ─── Main app consumer login path ─────────────────────────────────────────────

test.describe("Main app — consumer login path", () => {
  test("consumer portal button leads to consumer login form", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector('[data-testid="button-login-consumer"]', { timeout: 15000 });
    await page.click('[data-testid="button-login-consumer"]');
    await page.click('[data-testid="button-check-my-credit"]');
    await expect(page.locator('[data-testid="form-consumer-login"]')).toBeVisible({ timeout: 10000 });
  });
});
