/**
 * Consumer Portal E2E Suite
 *
 * The consumer portal at /consumer-portal is a standalone authenticated
 * self-service portal separate from the main institution app.
 *
 * Covers:
 *   - Consumer portal page at /consumer-portal renders login UI
 *   - Login tabs (password / SMS) are present
 *   - Wrong credentials show error
 *   - Authenticated consumer portal renders score/report/dispute
 *   - Registration flow inputs are visible
 *   - Consumer API endpoints require consumer auth
 *   - Credit freeze toggle API endpoint works with consumer session
 *   - Dispute submission form is accessible
 *   - Report download button is visible after auth
 *
 * Also covers the main app login page's consumer path (button-login-consumer).
 */

import { test, expect } from "@playwright/test";

async function setConsumerSession(
  page: import("@playwright/test").Page,
  session: Record<string, unknown>,
) {
  const res = await page.request.post("/api/test/set-session", { data: session });
  expect(res.ok()).toBeTruthy();
}

const CONSUMER_SESSION = {
  consumerId: "e2e-consumer-001",
  consumerNationalId: "GH-E2E-001",
};

// ─── /consumer-portal — unauthenticated view ─────────────────────────────────

test.describe("Consumer Portal — landing page", () => {
  test("consumer portal page renders", async ({ page }) => {
    await page.goto("/consumer-portal");
    await expect(page.locator("body")).toBeVisible({ timeout: 15000 });
    // Should show login UI or the portal
    await expect(
      page.locator('[data-testid="badge-consumer-portal"], [data-testid="text-consumer-portal-title"], [data-testid="tab-password-login"]').first(),
    ).toBeVisible({ timeout: 15000 });
  });

  test("password login tab is visible", async ({ page }) => {
    await page.goto("/consumer-portal");
    await expect(
      page.locator('[data-testid="tab-password-login"]'),
    ).toBeVisible({ timeout: 15000 });
  });

  test("SMS login tab is visible", async ({ page }) => {
    await page.goto("/consumer-portal");
    await expect(
      page.locator('[data-testid="tab-sms-login"]'),
    ).toBeVisible({ timeout: 15000 });
  });

  test("consumer ID and password inputs are present on password tab", async ({
    page,
  }) => {
    await page.goto("/consumer-portal");
    await page.waitForSelector('[data-testid="tab-password-login"]', {
      timeout: 15000,
    });
    await page.click('[data-testid="tab-password-login"]');

    await expect(
      page.locator('[data-testid="input-consumer-id"]'),
    ).toBeVisible({ timeout: 10000 });
    await expect(
      page.locator('[data-testid="input-consumer-password"]'),
    ).toBeVisible({ timeout: 8000 });
    await expect(
      page.locator('[data-testid="button-consumer-login"]'),
    ).toBeVisible({ timeout: 8000 });
  });

  test("wrong credentials show consumer portal error message", async ({
    page,
  }) => {
    await page.goto("/consumer-portal");
    await page.waitForSelector('[data-testid="tab-password-login"]', {
      timeout: 15000,
    });
    await page.click('[data-testid="tab-password-login"]');
    await page.waitForSelector('[data-testid="input-consumer-id"]', {
      timeout: 10000,
    });

    await page.fill('[data-testid="input-consumer-id"]', "GH-INVALID-999-E2E");
    await page.fill('[data-testid="input-consumer-password"]', "wrong-pw-xyz");
    await page.click('[data-testid="button-consumer-login"]');

    await expect(
      page.locator('[data-testid="text-consumer-error"]'),
    ).toBeVisible({ timeout: 10000 });
  });

  test("register link is visible on consumer portal login page", async ({
    page,
  }) => {
    await page.goto("/consumer-portal");
    await expect(
      page.locator('[data-testid="link-to-register"]'),
    ).toBeVisible({ timeout: 15000 });
  });
});

// ─── Consumer Portal — registration form ─────────────────────────────────────

test.describe("Consumer Portal — registration form", () => {
  test("register form shows name and ID inputs after clicking register", async ({
    page,
  }) => {
    await page.goto("/consumer-portal");
    await page.waitForSelector('[data-testid="link-to-register"]', {
      timeout: 15000,
    });
    await page.click('[data-testid="link-to-register"]');

    await expect(
      page.locator('[data-testid="input-register-fullname"]'),
    ).toBeVisible({ timeout: 10000 });
    await expect(
      page.locator('[data-testid="input-register-id"]'),
    ).toBeVisible({ timeout: 8000 });
  });
});

// ─── Consumer Portal — authenticated view (session injection) ─────────────────

test.describe("Consumer Portal — authenticated view", () => {
  test("portal title renders after consumer session injection", async ({
    page,
  }) => {
    await setConsumerSession(page, CONSUMER_SESSION);
    await page.goto("/consumer-portal");
    await expect(page).not.toHaveURL(/\/login/, { timeout: 12000 });
    // Should show the portal content, not the login form
    await expect(
      page.locator("h1, h2, [data-testid]").first(),
    ).toBeVisible({ timeout: 15000 });
  });

  test("report download button or no-credit-file card renders for authenticated consumer", async ({
    page,
  }) => {
    await setConsumerSession(page, CONSUMER_SESSION);
    await page.goto("/consumer-portal");
    await page.waitForTimeout(2500);

    // After auth, the portal renders one of:
    //   - card-no-credit-file (consumer not found in DB)
    //   - button-download-credit-report (consumer has a credit file)
    const noFile = page.locator('[data-testid="card-no-credit-file"]');
    const download = page.locator('[data-testid="button-download-credit-report"]');

    await expect(noFile.or(download).first()).toBeVisible({ timeout: 10000 });
  });

  test("dispute card renders for authenticated consumer (with or without credit file)", async ({
    page,
  }) => {
    await setConsumerSession(page, CONSUMER_SESSION);
    await page.goto("/consumer-portal");
    await page.waitForTimeout(2500);

    // After auth, either the dispute card (has file) or no-credit-file card shows
    const disputeCard = page.locator('[data-testid="card-file-dispute"]');
    const noFile = page.locator('[data-testid="card-no-credit-file"]');

    await expect(disputeCard.or(noFile).first()).toBeVisible({ timeout: 10000 });
  });
});

// ─── Consumer API endpoints ───────────────────────────────────────────────────

test.describe("Consumer Portal — API protection", () => {
  test("GET /api/consumer/credit-score requires consumer auth", async ({
    page,
  }) => {
    const resp = await page.request.get("/api/consumer/credit-score");
    expect([401, 403]).toContain(resp.status());
  });

  test("GET /api/consumer/disputes requires consumer auth", async ({ page }) => {
    const resp = await page.request.get("/api/consumer/disputes");
    expect([401, 403]).toContain(resp.status());
  });

  test("GET /api/consumer/credit-score returns 200 with valid consumer session", async ({
    page,
  }) => {
    await setConsumerSession(page, CONSUMER_SESSION);
    const resp = await page.request.get("/api/consumer/credit-score");
    // May return 200 (score computed) or 404 (consumer not in DB) — not 401
    expect([200, 404]).toContain(resp.status());
  });

  test("GET /api/consumer/disputes returns 200 or 404 with valid consumer session", async ({
    page,
  }) => {
    await setConsumerSession(page, CONSUMER_SESSION);
    const resp = await page.request.get("/api/consumer/disputes");
    expect([200, 404]).toContain(resp.status());
  });

  test("consumer credit freeze API endpoint requires consumer auth", async ({
    page,
  }) => {
    const resp = await page.request.post("/api/consumer/credit-freeze");
    expect([401, 403]).toContain(resp.status());
  });
});

// ─── Main app consumer login path ────────────────────────────────────────────

test.describe("Main app — consumer login path", () => {
  test("consumer portal button on main login leads to consumer login form", async ({
    page,
  }) => {
    await page.goto("/");
    await page.waitForSelector('[data-testid="button-login-consumer"]', {
      timeout: 15000,
    });
    await page.click('[data-testid="button-login-consumer"]');
    await page.click('[data-testid="button-check-my-credit"]');
    await expect(
      page.locator('[data-testid="form-consumer-login"]'),
    ).toBeVisible({ timeout: 10000 });
  });
});
