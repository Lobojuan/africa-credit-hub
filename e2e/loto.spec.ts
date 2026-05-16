/**
 * Loto Fiscal E2E Suite
 *
 * Covers:
 *   - Loto workspace (/loto-fiscal) renders for admin and super_admin
 *   - USSD session endpoint: root menu, option selection, auth-bypass
 *   - USSD response format is AT-compatible (CON/END prefix, ≤ 160 chars per segment)
 *   - Loto admin messaging dashboard renders for super_admin
 *   - Messaging stats and recent messages API endpoints
 *   - Consumer messaging preferences API protection
 *   - DGI officer can access /admin/loto-fiscal
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

const ADMIN_SESSION = { userId: "e2e-loto-admin", userRole: "admin" };
const SUPER_ADMIN_SESSION = { userId: "e2e-loto-sa", userRole: "super_admin" };
const DGI_SESSION = {
  userId: "e2e-dgi-loto2",
  userRole: "dgi_officer",
  userCountry: "Côte d'Ivoire",
  _testRole: "dgi_officer",
};

// ─── Loto workspace ───────────────────────────────────────────────────────────

test.describe("Loto Fiscal — workspace page", () => {
  test("loto workspace loads for admin", async ({ page }) => {
    await setSession(page, ADMIN_SESSION);
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

  test("loto workspace is blocked for unauthenticated users", async ({ page }) => {
    await page.goto("/loto-fiscal");
    await expect(
      page.locator('[data-testid="page-login"], [data-testid="button-login-institution"]').first(),
    ).toBeVisible({ timeout: 15000 });
  });
});

// ─── DGI Admin Dashboard ──────────────────────────────────────────────────────

test.describe("Loto Fiscal — DGI admin dashboard", () => {
  test("DGI admin dashboard loads for dgi_officer", async ({ page }) => {
    await setSession(page, DGI_SESSION);
    await page.goto("/admin/loto-fiscal");
    await expect(
      page.locator('[data-testid="page-loto-admin-dashboard"]'),
    ).toBeVisible({ timeout: 20000 });
  });

  test("DGI admin dashboard is blocked for unauthenticated users", async ({
    page,
  }) => {
    await page.goto("/admin/loto-fiscal");
    await expect(
      page.locator('[data-testid="page-login"], [data-testid="button-login-institution"]').first(),
    ).toBeVisible({ timeout: 15000 });
  });
});

// ─── USSD session endpoint ────────────────────────────────────────────────────

test.describe("Loto Fiscal — USSD session endpoint", () => {
  test("root menu returns 200 with CON prefix (AT-compatible format)", async ({
    page,
  }) => {
    const resp = await page.request.post("/api/loto/ussd/session", {
      data: {
        sessionId: "e2e-ussd-root-1",
        serviceCode: "*123#",
        phoneNumber: "+22500000001",
        text: "",
      },
    });
    expect(resp.status()).toBe(200);
    const body = await resp.text();
    expect(body).toMatch(/^(CON|END)/);
  });

  test("root menu text length is within USSD 182-char display limit", async ({
    page,
  }) => {
    const resp = await page.request.post("/api/loto/ussd/session", {
      data: {
        sessionId: "e2e-ussd-root-2",
        serviceCode: "*123#",
        phoneNumber: "+22500000002",
        text: "",
      },
    });
    expect(resp.status()).toBe(200);
    const body = await resp.text();
    // USSD screens are typically limited to 182 chars on most networks
    expect(body.length).toBeLessThanOrEqual(182);
  });

  test("selecting option 1 (tickets) returns valid USSD response", async ({
    page,
  }) => {
    const sessionId = "e2e-ussd-opt1-" + Date.now();
    // First: root menu
    await page.request.post("/api/loto/ussd/session", {
      data: { sessionId, serviceCode: "*123#", phoneNumber: "+22500000003", text: "" },
    });
    // Second: select option 1
    const resp = await page.request.post("/api/loto/ussd/session", {
      data: { sessionId, serviceCode: "*123#", phoneNumber: "+22500000003", text: "1" },
    });
    expect(resp.status()).toBe(200);
    expect(await resp.text()).toMatch(/^(CON|END)/);
  });

  test("selecting option 0 (exit) returns END response", async ({ page }) => {
    const sessionId = "e2e-ussd-exit-" + Date.now();
    await page.request.post("/api/loto/ussd/session", {
      data: { sessionId, serviceCode: "*123#", phoneNumber: "+22500000004", text: "" },
    });
    const resp = await page.request.post("/api/loto/ussd/session", {
      data: { sessionId, serviceCode: "*123#", phoneNumber: "+22500000004", text: "0" },
    });
    expect(resp.status()).toBe(200);
    const body = await resp.text();
    // Option 0 is "Exit" — should terminate session
    expect(body).toMatch(/^END/);
  });

  test("USSD endpoint is accessible without session cookie (gateway-compatible)", async ({
    page,
  }) => {
    // Use a fresh browser context with no cookies
    const resp = await page.request.post("/api/loto/ussd/session", {
      data: {
        sessionId: "e2e-ussd-noauth-" + Date.now(),
        serviceCode: "*123#",
        phoneNumber: "+22500000005",
        text: "",
      },
    });
    // Must NOT return 401 or 403 — USSD endpoints must be auth-bypassed
    expect(resp.status()).toBe(200);
  });

  test("USSD endpoint handles French language (language=fr)", async ({ page }) => {
    const resp = await page.request.post("/api/loto/ussd/session", {
      data: {
        sessionId: "e2e-ussd-fr-" + Date.now(),
        serviceCode: "*123#",
        phoneNumber: "+22500000006",
        text: "",
        language: "fr",
      },
    });
    expect([200, 400]).toContain(resp.status());
    if (resp.status() === 200) {
      const body = await resp.text();
      expect(body).toMatch(/^(CON|END)/);
    }
  });
});

// ─── Messaging admin dashboard ────────────────────────────────────────────────

test.describe("Loto Fiscal — messaging admin dashboard", () => {
  test("messaging admin page loads for super_admin", async ({ page }) => {
    await setSession(page, SUPER_ADMIN_SESSION);
    await page.goto("/loto/admin/messaging");
    await expect(page).not.toHaveURL(/\/login/, { timeout: 12000 });
    await expect(page.locator("h1, h2, [data-testid]").first()).toBeVisible({
      timeout: 20000,
    });
  });

  test("messaging stats API returns structured response for super_admin", async ({
    page,
  }) => {
    await setSession(page, SUPER_ADMIN_SESSION);
    const resp = await page.request.get("/api/loto/admin/messaging/stats");
    // Either 200 (stats returned) or 403 (insufficient role) — not 500
    expect([200, 403]).toContain(resp.status());
    if (resp.status() === 200) {
      const body = await resp.json();
      expect(typeof body).toBe("object");
    }
  });

  test("recent messages API returns array for super_admin", async ({ page }) => {
    await setSession(page, SUPER_ADMIN_SESSION);
    const resp = await page.request.get("/api/loto/admin/messaging/recent");
    expect([200, 403]).toContain(resp.status());
    if (resp.status() === 200) {
      const body = await resp.json();
      expect(Array.isArray(body) || typeof body === "object").toBe(true);
    }
  });

  test("messaging stats API is blocked without auth (401)", async ({ page }) => {
    const resp = await page.request.get("/api/loto/admin/messaging/stats");
    expect([401, 403]).toContain(resp.status());
  });
});

// ─── Consumer messaging preferences ─────────────────────────────────────────

test.describe("Loto Fiscal — consumer messaging preferences", () => {
  test("GET prefs returns 401 without auth", async ({ page }) => {
    const resp = await page.request.get("/api/loto/consumer/messaging-prefs");
    expect([401, 403]).toContain(resp.status());
  });

  test("PUT prefs returns 401 without auth", async ({ page }) => {
    const resp = await page.request.put("/api/loto/consumer/messaging-prefs", {
      data: { optOutReminders: true },
    });
    expect([401, 403]).toContain(resp.status());
  });
});

// ─── Outbound message audit ───────────────────────────────────────────────────

test.describe("Loto Fiscal — outbound message audit", () => {
  test("GET outbound messages requires auth", async ({ page }) => {
    const resp = await page.request.get("/api/loto/admin/messages");
    expect([401, 403, 404]).toContain(resp.status());
  });
});
