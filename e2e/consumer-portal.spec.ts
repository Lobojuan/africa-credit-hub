/**
 * Consumer Portal E2E Suite
 *
 * Tests the consumer self-service portal which uses a separate auth flow
 * (/consumer-portal, not the main app auth).
 *
 * Covers:
 *   - Login page chooser renders consumer portal option
 *   - Consumer login form renders on selection
 *   - National ID + password form fields present
 *   - Wrong credentials show error
 *   - Consumer portal page accessible after session injection
 *
 * Note: consumer auth uses consumerId/consumerNationalId in session,
 * not userId/userRole.
 */

import { test, expect } from "@playwright/test";

// ─── Login page consumer path ────────────────────────────────────────────────

test.describe("Consumer Portal — login page flow", () => {
  test("consumer login button appears on home page", async ({ page }) => {
    await page.goto("/");
    await expect(
      page.locator('[data-testid="page-login"]'),
    ).toBeVisible({ timeout: 15000 });
    await expect(
      page.locator('[data-testid="button-login-consumer"]'),
    ).toBeVisible({ timeout: 10000 });
  });

  test("clicking consumer login shows consumer login form", async ({ page }) => {
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

  test("consumer login form has national ID and password inputs", async ({
    page,
  }) => {
    await page.goto("/");
    await page.waitForSelector('[data-testid="button-login-consumer"]', {
      timeout: 15000,
    });
    await page.click('[data-testid="button-login-consumer"]');
    await page.click('[data-testid="button-check-my-credit"]');
    await page.waitForSelector('[data-testid="form-consumer-login"]', {
      timeout: 10000,
    });

    await expect(
      page.locator('[data-testid="input-consumer-national-id"]'),
    ).toBeVisible({ timeout: 8000 });
    await expect(
      page.locator('[data-testid="input-consumer-password"]'),
    ).toBeVisible({ timeout: 8000 });
    await expect(
      page.locator('[data-testid="button-consumer-login-submit"]'),
    ).toBeVisible({ timeout: 8000 });
  });

  test("wrong consumer credentials show error", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector('[data-testid="button-login-consumer"]', {
      timeout: 15000,
    });
    await page.click('[data-testid="button-login-consumer"]');
    await page.click('[data-testid="button-check-my-credit"]');
    await page.waitForSelector('[data-testid="form-consumer-login"]', {
      timeout: 10000,
    });

    await page.fill('[data-testid="input-consumer-national-id"]', "GH-INVALID-999");
    await page.fill('[data-testid="input-consumer-password"]', "wrong-pw-xyz");
    await page.click('[data-testid="button-consumer-login-submit"]');

    await expect(
      page.locator('[data-testid="text-consumer-login-error"]'),
    ).toBeVisible({ timeout: 10000 });
  });
});

// ─── Consumer portal page ─────────────────────────────────────────────────────

test.describe("Consumer Portal — authenticated page", () => {
  test("consumer portal page renders after session injection", async ({
    page,
  }) => {
    const res = await page.request.post("/api/test/set-session", {
      data: {
        consumerId: "e2e-consumer-001",
        consumerNationalId: "GH-E2E-001",
      },
    });
    expect(res.ok()).toBeTruthy();

    await page.goto("/consumer-portal");
    await expect(page).not.toHaveURL(/\/login/, { timeout: 12000 });
    await expect(page.locator("h1, h2, [data-testid]").first()).toBeVisible({
      timeout: 20000,
    });
  });
});

// ─── Consumer registration link ───────────────────────────────────────────────

test.describe("Consumer Portal — registration", () => {
  test("register link is present on consumer login page", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector('[data-testid="button-login-consumer"]', {
      timeout: 15000,
    });
    await page.click('[data-testid="button-login-consumer"]');

    await expect(
      page.locator('[data-testid="link-consumer-register"]'),
    ).toBeVisible({ timeout: 10000 });
  });
});

// ─── Consumer portal API ──────────────────────────────────────────────────────

test.describe("Consumer Portal — API protection", () => {
  test("consumer credit score endpoint requires consumer auth", async ({
    page,
  }) => {
    const resp = await page.request.get("/api/consumer/credit-score");
    expect([401, 403]).toContain(resp.status());
  });

  test("consumer disputes endpoint requires consumer auth", async ({ page }) => {
    const resp = await page.request.get("/api/consumer/disputes");
    expect([401, 403]).toContain(resp.status());
  });
});
