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
    await expect(page.getByTestId("landing-video-panel")).toBeVisible();
    await expect(page.getByTestId("video-platform-demo")).not.toHaveAttribute("src", /.+/);
    await expect(page.getByTestId("button-play-landing-video")).toHaveAccessibleName("Play Universal Credit Hub introduction video");
    await page.getByTestId("button-play-landing-video").click();
    await expect(page.getByTestId("video-platform-demo")).toHaveAttribute("src", "/marketing/platform-demo.mp4");
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
    await page.getByTestId("button-start-banker-shift").click();
    await expect(page.getByTestId("banker-shift")).toContainText("First governed work item");
    await page.getByTestId("button-open-first-work-item").click();
    await expect(page.getByTestId("banker-shift-journey")).toContainText("Specialist review");
    await expect(page.getByTestId("demo-workspace-simulator")).toContainText("NPL Early Warning Desk");
    await expect(page.getByTestId("demo-live-simulation")).toContainText("UCH Executive Live Simulation");
    await page.getByTestId("button-toggle-live-simulation").click();
    await expect(page.getByTestId("button-toggle-live-simulation")).toContainText("Resume");
    await page.getByTestId("demo-workspace-npl").click();
    await expect(page.getByTestId("demo-workspace-simulator")).toContainText("NPL Early Warning Desk");
    await page.getByTestId("input-npl-dpd").fill("96");
    await page.getByTestId("button-run-npl-review").click();
    await expect(page.getByTestId("npl-review-result")).toContainText("Stage 3 candidate");
    await page.getByRole("button", { name: "Assign" }).first().click();
    await expect(page.getByTestId("demo-simulated-action")).toContainText("simulated");
    await page.getByTestId("demo-workspace-credit").click();
    await page.getByTestId("input-credit-requested").fill("300000");
    await page.getByTestId("button-run-credit-review").click();
    await expect(page.getByTestId("credit-review-result")).toBeVisible();
    await page.getByTestId("demo-workspace-collateral").click();
    await expect(page.getByTestId("demo-workspace-simulator")).toContainText("Collateral & consent controls");
    await page.getByTestId("demo-workspace-evidence").click();
    await expect(page.getByTestId("demo-workspace-simulator")).toContainText("Management evidence pack");

    await page.getByTestId("demo-scenario-operations").click();
    await expect(page.getByTestId("selected-scenario-detail")).toContainText("Now showing: Fraud & resolution");
    await expect(page.getByTestId("demo-scenario-workspace")).toContainText("Resolve fraud and failed transactions");
    await expect(page.getByTestId("demo-workspace-simulator")).toContainText("Transaction resolution queue");
    await page.getByTestId("button-open-virtual-report").click();
    await expect(page.getByTestId("virtual-management-report")).toBeVisible();
    await expect(page.getByTestId("virtual-management-report")).toContainText("fictional data");
  });
});

test.describe("Public marketing navigation", () => {
  test("product cards open their intended public workspaces and preserve a Home return", async ({ page }) => {
    await page.goto("/collateral");
    await expect(page.getByTestId("text-breadcrumb-current")).toContainText("Collateral Registry");
    await expect(page.getByTestId("link-breadcrumb-home")).toBeVisible();

    await page.goto("/loto");
    await expect(page.getByTestId("text-breadcrumb-current")).toContainText("Loto Fiscal");
    await expect(page.getByTestId("button-back-home")).toBeVisible();
  });

  test("public collateral verification has a usable entry point and returns to UCH", async ({ page }) => {
    await page.goto("/verify");
    await expect(page.getByTestId("form-certificate-lookup")).toBeVisible();
    await page.getByTestId("input-certificate-code").fill("TESTCODE123");
    await page.getByTestId("button-verify-certificate").click();
    await expect(page).toHaveURL(/\/verify\/TESTCODE123$/);
    await expect(page.getByTestId("link-back-home")).toBeVisible();
    await expect(page.getByTestId("link-verify-another")).toBeVisible();
  });

  for (const path of [
    "/collateral", "/loto", "/financial-inclusion", "/press", "/for-lenders",
    "/for-regulators", "/forensics", "/ai-demo", "/demo", "/contact-sales",
    "/security", "/terms", "/privacy", "/market-validation", "/start-trial",
    "/signup", "/score-guide", "/api-docs", "/partner-docs", "/portal",
    "/consumer/register", "/my-credit", "/consumer-portal", "/verify",
  ]) {
    test(`${path} retains a visible route back to the public home page`, async ({ page }) => {
      await page.goto(path);
      await expect(page.locator('a[href="/"]').first()).toBeVisible({ timeout: 15000 });
    });
  }

  test("landing avoids an unauthenticated session request and keeps core landmarks accessible", async ({ page }) => {
    const authResponses: number[] = [];
    page.on("response", (response) => {
      if (new URL(response.url()).pathname === "/api/auth/me") {
        authResponses.push(response.status());
      }
    });

    await page.goto("/");
    await expect(page.locator("main")).toBeVisible();
    await expect(page.getByTestId("button-public-chatbot")).toHaveAccessibleName("Open Universal Credit Hub assistant");
    await page.waitForTimeout(300);
    expect(authResponses).toEqual([]);
  });

  test("landing has the fourth bank-diagnostic pillar", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByTestId("card-product-forensics")).toContainText("Bank Diagnostic");
    await page.getByTestId("button-learn-forensics").click();
    await expect(page).toHaveURL(/\/forensics$/);
    await expect(page.getByTestId("public-forensics-page")).toBeVisible();
    await expect(page.getByTestId("button-request-diagnostic")).toBeVisible();
  });

  test("public navigation and contact form expose accessible controls", async ({ page }) => {
    await page.goto("/forensics");
    await expect(page.getByTestId("link-public-home")).toHaveAccessibleName("Universal Credit Hub");
    await expect(page.getByTestId("button-public-signin")).toHaveAccessibleName("Sign in");

    await page.goto("/contact-sales");
    await expect(page.locator("main")).toBeVisible();
    await expect(page.getByTestId("select-contact-tier")).toHaveAccessibleName("I'm interested in");
  });

  for (const path of ["/financial-inclusion", "/security", "/market-validation"]) {
    test(`${path} has a full public route back to UCH`, async ({ page }) => {
      await page.goto(path);
      await expect(page.getByTestId("link-public-home")).toBeVisible();
      await expect(page.getByTestId("link-public-demo")).toBeVisible();
      await expect(page.getByTestId("button-public-signin")).toBeVisible();
    });
  }

  test("pricing redirects to contact sales with a visible Home return", async ({ page }) => {
    await page.goto("/pricing");
    await expect(page).toHaveURL(/\/contact-sales$/);
    await expect(page.getByTestId("link-back-home")).toBeVisible();
  });

  for (const path of ["/score-guide", "/portal", "/start-trial"]) {
    test(`${path} has a compact return to UCH`, async ({ page }) => {
      await page.goto(path);
      await expect(page.getByTestId("link-public-home")).toBeVisible();
      await expect(page.getByTestId("button-public-signin")).toBeVisible();
    });
  }
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
