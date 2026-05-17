/**
 * Playbook Index E2E Suite
 *
 * Route:  /sales/playbooks
 * Roles:  super_admin, platform_owner (required)
 *         All other roles → redirect to /dashboard
 */

import { test, expect } from "@playwright/test";

async function setSession(
  page: import("@playwright/test").Page,
  session: Record<string, unknown>,
) {
  const res = await page.request.post("/api/test/set-session", { data: session });
  expect(res.ok()).toBeTruthy();
}

const SUPER_ADMIN    = { userId: "e2e-pi-sa",     userRole: "super_admin" };
const PLATFORM_OWNER = { userId: "e2e-pi-po",     userRole: "platform_owner" };
const LENDER         = { userId: "e2e-pi-lender", userRole: "lender" };
const REGULATOR      = { userId: "e2e-pi-reg",    userRole: "regulator" };

// 7 markets (south-africa added)
const MARKETS = ["ghana", "nigeria", "kenya", "civ", "south-africa", "egypt", "ethiopia"] as const;

async function gotoIndex(
  page: import("@playwright/test").Page,
  session = SUPER_ADMIN,
) {
  await setSession(page, session);
  await page.goto("/sales/playbooks");
  await expect(page).not.toHaveURL(/\/login/, { timeout: 15000 });
}

// ── Access ────────────────────────────────────────────────────────────────────

test.describe("Playbook Index — page access", () => {
  test("super_admin can access /sales/playbooks", async ({ page }) => {
    await gotoIndex(page, SUPER_ADMIN);
    await expect(page).toHaveURL(/\/sales\/playbooks/, { timeout: 12000 });
    await expect(page.locator('[data-testid="heading-playbook-index"]')).toBeVisible({ timeout: 15000 });
  });

  test("platform_owner can access /sales/playbooks", async ({ page }) => {
    await gotoIndex(page, PLATFORM_OWNER);
    await expect(page).toHaveURL(/\/sales\/playbooks/, { timeout: 12000 });
    await expect(page.locator('[data-testid="heading-playbook-index"]')).toBeVisible({ timeout: 15000 });
  });

  test("unauthenticated visit redirects to login", async ({ page }) => {
    await page.goto("/sales/playbooks");
    await expect(
      page.locator('[data-testid="page-login"], [data-testid="button-login-institution"]').first(),
    ).toBeVisible({ timeout: 15000 });
  });
});

// ── RBAC ──────────────────────────────────────────────────────────────────────

test.describe("Playbook Index — RBAC", () => {
  for (const [role, session] of [
    ["lender",    LENDER],
    ["regulator", REGULATOR],
    ["admin",     { userId: "e2e-pi-admin", userRole: "admin" }],
  ] as const) {
    test(`${role} is redirected away from /sales/playbooks`, async ({ page }) => {
      await setSession(page, session);
      await page.goto("/sales/playbooks");
      await page.waitForTimeout(2500);
      expect(page.url()).not.toMatch(/\/sales\/playbooks/);
    });
  }
});

// ── Heading ───────────────────────────────────────────────────────────────────

test.describe("Playbook Index — heading", () => {
  test("heading is visible and contains 'Playbook'", async ({ page }) => {
    await gotoIndex(page);
    const heading = page.locator('[data-testid="heading-playbook-index"]');
    await expect(heading).toBeVisible({ timeout: 15000 });
    expect((await heading.textContent())?.toLowerCase()).toContain("playbook");
  });

  test("shows 7 markets available", async ({ page }) => {
    await gotoIndex(page);
    const bodyText = await page.locator("body").textContent();
    expect(bodyText).toMatch(/7\s+markets/i);
  });
});

// ── Cards ─────────────────────────────────────────────────────────────────────

test.describe("Playbook Index — market cards", () => {
  test("all 7 market cards are present", async ({ page }) => {
    await gotoIndex(page);
    await page.waitForSelector('[data-testid="card-playbook-ghana"]', { timeout: 15000 });
    expect(await page.locator('[data-testid^="card-playbook-"]').count()).toBe(MARKETS.length);
  });

  test("each card has a non-empty summary", async ({ page }) => {
    await gotoIndex(page);
    await page.waitForSelector('[data-testid="card-playbook-ghana"]', { timeout: 15000 });
    for (const market of MARKETS) {
      const text = await page.locator(`[data-testid="text-summary-${market}"]`).textContent();
      expect((text ?? "").trim().length).toBeGreaterThan(20);
    }
  });
});

// ── Download buttons ──────────────────────────────────────────────────────────

test.describe("Playbook Index — downloads", () => {
  test("all download buttons are enabled before clicking", async ({ page }) => {
    await gotoIndex(page);
    await page.waitForSelector('[data-testid="card-playbook-ghana"]', { timeout: 15000 });
    for (const market of MARKETS) {
      expect(await page.locator(`[data-testid="button-download-${market}"]`).isDisabled()).toBe(false);
    }
  });

  test("Ghana download triggers a .pdf file download", async ({ page }) => {
    await gotoIndex(page);
    await page.waitForSelector('[data-testid="button-download-ghana"]', { timeout: 15000 });
    const [download] = await Promise.all([
      page.waitForEvent("download", { timeout: 25000 }),
      page.click('[data-testid="button-download-ghana"]'),
    ]);
    expect(download.suggestedFilename()).toMatch(/ghana/i);
    expect(download.suggestedFilename()).toMatch(/\.pdf$/i);
  });
});

// ── View links ────────────────────────────────────────────────────────────────

test.describe("Playbook Index — view links", () => {
  for (const [market, expectedPath] of [
    ["ghana",        "/sales/ghana-playbook"],
    ["nigeria",      "/sales/nigeria-playbook"],
    ["kenya",        "/sales/kenya-playbook"],
    ["south-africa", "/sales/south-africa-playbook"],
  ] as const) {
    test(`${market} View link navigates to ${expectedPath}`, async ({ page }) => {
      await gotoIndex(page);
      await page.waitForSelector(`[data-testid="link-view-${market}"]`, { timeout: 15000 });
      await page.click(`[data-testid="link-view-${market}"]`);
      await expect(page).toHaveURL(new RegExp(expectedPath.replace("/", "\\/")), { timeout: 15000 });
    });
  }

  for (const market of ["egypt", "ethiopia"] as const) {
    test(`${market} View button is disabled (PDF-only market)`, async ({ page }) => {
      await gotoIndex(page);
      await page.waitForSelector(`[data-testid="link-view-${market}"]`, { timeout: 15000 });
      expect(await page.locator(`[data-testid="link-view-${market}"]`).isDisabled()).toBe(true);
    });
  }
});

// ── API access control ────────────────────────────────────────────────────────

test.describe("Playbook Index — API protection", () => {
  test("GET /api/sales/playbooks/ghana/pdf — super_admin gets non-500", async ({ page }) => {
    await setSession(page, SUPER_ADMIN);
    const resp = await page.request.get("/api/sales/playbooks/ghana/pdf");
    expect(resp.status()).not.toBe(401);
    expect(resp.status()).not.toBe(403);
    expect(resp.status()).not.toBe(500);
  });

  test("GET /api/sales/playbooks/ghana/pdf — unauthenticated gets 401/403", async ({ page }) => {
    const resp = await page.request.get("/api/sales/playbooks/ghana/pdf");
    expect([401, 403]).toContain(resp.status());
  });

  test("GET /api/sales/playbooks/ghana/pdf — lender gets 401/403", async ({ page }) => {
    await setSession(page, LENDER);
    const resp = await page.request.get("/api/sales/playbooks/ghana/pdf");
    expect([401, 403]).toContain(resp.status());
  });
});
