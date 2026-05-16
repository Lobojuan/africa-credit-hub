/**
 * Loto Fiscal E2E Suite
 *
 * Covers:
 *   - Loto workspace (/loto-fiscal) renders for loto_admin / dgi_officer
 *   - USSD session endpoint responds to valid AT-style POST
 *   - Messaging admin page renders for privileged roles
 *   - Outbound message stats API endpoint responds
 *
 * Uses /api/test/set-session for role injection.
 */

import { test, expect } from "@playwright/test";

async function setSession(
  page: import("@playwright/test").Page,
  session: Record<string, unknown>,
) {
  const res = await page.request.post("/api/test/set-session", { data: session });
  expect(res.ok()).toBeTruthy();
}

const LOTO_ADMIN_SESSION = { userId: "e2e-loto-1", userRole: "admin" };
const SUPER_ADMIN_SESSION = { userId: "e2e-sa-loto", userRole: "super_admin" };
const DGI_SESSION = {
  userId: "e2e-dgi-loto",
  userRole: "dgi_officer",
  userCountry: "Côte d'Ivoire",
  _testRole: "dgi_officer",
};

// ─── Loto Workspace ───────────────────────────────────────────────────────────

test.describe("Loto Fiscal — workspace", () => {
  test("loto workspace page loads for admin", async ({ page }) => {
    await setSession(page, LOTO_ADMIN_SESSION);
    await page.goto("/loto-fiscal");
    await expect(page).not.toHaveURL(/\/login/, { timeout: 12000 });
    await expect(page.locator("h1, h2, [data-testid]").first()).toBeVisible({
      timeout: 20000,
    });
  });

  test("loto workspace loads for super_admin", async ({ page }) => {
    await setSession(page, SUPER_ADMIN_SESSION);
    await page.goto("/loto-fiscal");
    await expect(page).not.toHaveURL(/\/login/, { timeout: 12000 });
    await expect(page.locator("h1, h2, [data-testid]").first()).toBeVisible({
      timeout: 20000,
    });
  });
});

// ─── DGI Admin Dashboard (covered in depth by loto-admin-dashboard.spec.ts) ──

test.describe("Loto Fiscal — DGI admin access", () => {
  test("DGI admin dashboard loads for dgi_officer", async ({ page }) => {
    await setSession(page, DGI_SESSION);
    await page.goto("/admin/loto-fiscal");
    await expect(
      page.locator('[data-testid="page-loto-admin-dashboard"]'),
    ).toBeVisible({ timeout: 20000 });
  });
});

// ─── USSD endpoint ────────────────────────────────────────────────────────────

test.describe("Loto Fiscal — USSD session endpoint", () => {
  test("USSD endpoint returns valid response for root menu", async ({ page }) => {
    const resp = await page.request.post("/api/loto/ussd/session", {
      data: {
        sessionId: "e2e-ussd-001",
        serviceCode: "*123#",
        phoneNumber: "+22500000001",
        text: "",
      },
    });
    // 200 OK with CON or END response body
    expect(resp.status()).toBe(200);
    const body = await resp.text();
    expect(body.length).toBeGreaterThan(0);
    // Africa's Talking format: CON <menu> or END <message>
    expect(body).toMatch(/^(CON|END)/);
  });

  test("USSD endpoint handles option selection", async ({ page }) => {
    // First call to initialize session
    await page.request.post("/api/loto/ussd/session", {
      data: {
        sessionId: "e2e-ussd-002",
        serviceCode: "*123#",
        phoneNumber: "+22500000002",
        text: "",
      },
    });

    // Second call selecting first option
    const resp = await page.request.post("/api/loto/ussd/session", {
      data: {
        sessionId: "e2e-ussd-002",
        serviceCode: "*123#",
        phoneNumber: "+22500000002",
        text: "1",
      },
    });
    expect(resp.status()).toBe(200);
    const body = await resp.text();
    expect(body).toMatch(/^(CON|END)/);
  });

  test("USSD endpoint is accessible without auth (gateway-compatible)", async ({
    page,
  }) => {
    // USSD endpoints should be publicly accessible (AT gateway doesn't send session cookies)
    const resp = await page.request.post("/api/loto/ussd/session", {
      data: {
        sessionId: "e2e-ussd-public",
        serviceCode: "*123#",
        phoneNumber: "+22500000003",
        text: "",
      },
    });
    // Should not return 401/403
    expect([200, 400, 422]).toContain(resp.status());
  });
});

// ─── Messaging admin ──────────────────────────────────────────────────────────

test.describe("Loto Fiscal — messaging admin", () => {
  test("messaging admin page loads for super_admin", async ({ page }) => {
    await setSession(page, SUPER_ADMIN_SESSION);
    await page.goto("/loto/admin/messaging");
    await expect(page).not.toHaveURL(/\/login/, { timeout: 12000 });
    await expect(page.locator("h1, h2, [data-testid]").first()).toBeVisible({
      timeout: 20000,
    });
  });

  test("messaging stats API returns structured data", async ({ page }) => {
    await setSession(page, SUPER_ADMIN_SESSION);
    const resp = await page.request.get("/api/loto/admin/messaging/stats");
    expect([200, 403]).toContain(resp.status());
    if (resp.status() === 200) {
      const body = await resp.json();
      expect(typeof body).toBe("object");
    }
  });

  test("recent messages API endpoint responds", async ({ page }) => {
    await setSession(page, SUPER_ADMIN_SESSION);
    const resp = await page.request.get("/api/loto/admin/messaging/recent");
    expect([200, 403]).toContain(resp.status());
    if (resp.status() === 200) {
      const body = await resp.json();
      expect(Array.isArray(body) || typeof body === "object").toBe(true);
    }
  });
});

// ─── Consumer messaging preferences ─────────────────────────────────────────

test.describe("Loto Fiscal — consumer messaging preferences API", () => {
  test("GET messaging prefs returns 401 when unauthenticated", async ({
    page,
  }) => {
    const resp = await page.request.get("/api/loto/consumer/messaging-prefs");
    expect([401, 403]).toContain(resp.status());
  });
});
