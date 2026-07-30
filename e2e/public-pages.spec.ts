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
  test("/api/health confirms both application and database readiness", async ({ page }) => {
    const resp = await page.request.get("/api/health");
    expect(resp.status()).toBe(200);
    await expect(resp.json()).resolves.toMatchObject({
      status: "healthy",
      checks: { database: { status: "ok" } },
    });
  });
});

// ─── Login page ───────────────────────────────────────────────────────────────

test.describe("Public pages — login", () => {
  // "/" is the public marketing/investor landing page (CreditLandingPage, App.tsx),
  // not the login page — the login chooser lives at /login. This block predates that
  // landing page and was never updated after it shipped.
  test("login page renders at /login", async ({ page }) => {
    await page.goto("/login");
    await expect(
      page.locator('[data-testid="page-login"]'),
    ).toBeVisible({ timeout: 15000 });
  });

  test("isolated HTTP test server does not upgrade local assets to HTTPS", async ({ page }) => {
    const response = await page.goto("/login");
    expect(response).not.toBeNull();
    expect(response!.headers()["content-security-policy"] || "")
      .not.toContain("upgrade-insecure-requests");
  });

  test("login page has institution login button", async ({ page }) => {
    await page.goto("/login");
    await page.waitForSelector('[data-testid="page-login"]', { timeout: 15000 });
    await expect(
      page.locator('[data-testid="button-login-institution"]'),
    ).toBeVisible({ timeout: 10000 });
  });

  test("login page has consumer login button", async ({ page }) => {
    await page.goto("/login");
    await page.waitForSelector('[data-testid="page-login"]', { timeout: 15000 });
    await expect(
      page.locator('[data-testid="button-login-consumer"]'),
    ).toBeVisible({ timeout: 10000 });
  });

  test("login page title text is present", async ({ page }) => {
    await page.goto("/login");
    await page.waitForSelector('[data-testid="page-login"]', { timeout: 15000 });
    await expect(
      page.locator('[data-testid="text-login-title"]'),
    ).toBeVisible({ timeout: 10000 });
  });

  test("institution login form renders after clicking institution button", async ({
    page,
  }) => {
    await page.goto("/login");
    await page.waitForSelector('[data-testid="button-login-institution"]', {
      timeout: 15000,
    });
    // The primary institution CTA switches straight to the login form.
    await page.click('[data-testid="button-login-institution"]');
    await expect(
      page.locator('[data-testid="form-login"]'),
    ).toBeVisible({ timeout: 10000 });
  });

  test("direct institution login link opens the staff form", async ({ page }) => {
    await page.goto("/login?mode=institution");
    await expect(page.locator('[data-testid="form-login"]')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('[data-testid="input-username"]')).toBeVisible();
  });
});

test.describe("Public pages — Demo Board", () => {
  test("landing page leads unauthenticated visitors to the Demo Board", async ({ page }) => {
    await page.goto("/");
    await page.getByTestId("cta-explore-demo").click();
    await expect(page).toHaveURL(/\/demo$/);
    await expect(page.getByTestId("public-demo-board")).toBeVisible();
  });

  test("shows a safe, no-registration synthetic bank demo and virtual report", async ({ page }) => {
    await page.goto("/demo");

    await expect(page.getByTestId("public-demo-board")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Choose the banking problem. See the controlled fix." })).toBeVisible();
    await expect(page.getByText("No real customer data")).toBeVisible();
    await expect(page.getByTestId("demo-scenario-whole")).toBeVisible();
    await expect(page.getByTestId("whole-bank-workstreams")).toContainText("NPL & IFRS 9");
    await expect(page.getByTestId("demo-scenario-credit")).toBeVisible();
    await expect(page.getByTestId("demo-workspace-simulator")).toBeVisible();
    await expect(page.getByTestId("demo-live-simulation")).toContainText("UCH Executive Live Simulation");
    await page.getByTestId("button-toggle-live-simulation").click();
    await expect(page.getByTestId("button-toggle-live-simulation")).toContainText("Resume");
    await page.getByTestId("demo-workspace-npl").click();
    await expect(page.getByTestId("demo-workspace-simulator")).toContainText("NPL Early Warning Desk");
    await page.getByRole("button", { name: "Assign" }).first().click();
    await expect(page.getByTestId("demo-simulated-action")).toContainText("simulated");
    await page.getByTestId("demo-workspace-collateral").click();
    await expect(page.getByTestId("demo-workspace-simulator")).toContainText("Collateral & consent controls");
    await page.getByTestId("demo-workspace-evidence").click();
    await expect(page.getByTestId("demo-workspace-simulator")).toContainText("Management evidence pack");

    await page.getByTestId("demo-scenario-operations").click();
    await expect(page.getByTestId("demo-scenario-workspace")).toContainText("Resolve fraud and failed transactions");
    await page.getByTestId("button-open-virtual-report").click();
    await expect(page.getByTestId("virtual-management-report")).toBeVisible();
    await expect(page.getByTestId("virtual-management-report")).toContainText("fictional data");
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
