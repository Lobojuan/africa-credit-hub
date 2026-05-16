/**
 * Public Pages E2E Suite (unauthenticated)
 *
 * Verifies that publicly accessible pages and API endpoints return expected
 * responses without any session cookie.
 *
 * These tests run under the `unauthenticated` Playwright project.
 */

import { test, expect } from "@playwright/test";

// ─── Health check ─────────────────────────────────────────────────────────────

test.describe("Public API — health", () => {
  test("/api/health returns 200", async ({ page }) => {
    const resp = await page.request.get("/api/health");
    expect(resp.status()).toBe(200);
  });
});

// ─── Login page ───────────────────────────────────────────────────────────────

test.describe("Public pages — login", () => {
  test("login page renders at /", async ({ page }) => {
    await page.goto("/");
    await expect(
      page.locator('[data-testid="page-login"]'),
    ).toBeVisible({ timeout: 15000 });
  });

  test("login page has institution login button", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector('[data-testid="page-login"]', { timeout: 15000 });
    await expect(
      page.locator('[data-testid="button-login-institution"]'),
    ).toBeVisible({ timeout: 10000 });
  });

  test("login page has consumer login button", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector('[data-testid="page-login"]', { timeout: 15000 });
    await expect(
      page.locator('[data-testid="button-login-consumer"]'),
    ).toBeVisible({ timeout: 10000 });
  });

  test("login page title text is present", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector('[data-testid="page-login"]', { timeout: 15000 });
    await expect(
      page.locator('[data-testid="text-login-title"]'),
    ).toBeVisible({ timeout: 10000 });
  });

  test("institution login form renders after clicking institution button", async ({
    page,
  }) => {
    await page.goto("/");
    await page.waitForSelector('[data-testid="button-login-institution"]', {
      timeout: 15000,
    });
    await page.click('[data-testid="button-login-institution"]');
    await page.click('[data-testid="button-sign-in-institution"]');
    await expect(
      page.locator('[data-testid="form-login"]'),
    ).toBeVisible({ timeout: 10000 });
  });
});

// ─── Protected routes redirect unauthenticated users ─────────────────────────

test.describe("Public pages — unauthenticated redirect guard", () => {
  for (const path of [
    "/dashboard",
    "/borrowers",
    "/credit-accounts",
    "/reports",
    "/regulatory-dashboard",
    "/collateral-registry",
  ]) {
    test(`${path} redirects unauthenticated user`, async ({ page }) => {
      await page.goto(path);
      // Should end up at login (root or /login)
      await expect(
        page.locator('[data-testid="page-login"], [data-testid="button-login-institution"]').first(),
      ).toBeVisible({ timeout: 15000 });
    });
  }
});

// ─── Collateral public verify ─────────────────────────────────────────────────

test.describe("Public pages — collateral verify", () => {
  test("collateral verify page renders for known/unknown code", async ({
    page,
  }) => {
    await page.goto("/verify/TESTCODE123");
    // Should render something (not crash) — may show not found UI
    await expect(page.locator("body")).toBeVisible({ timeout: 15000 });
  });
});
