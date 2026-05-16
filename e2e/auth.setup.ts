/**
 * Playwright global auth state setup.
 *
 * Runs as a dependency project before any authenticated spec project.
 * Saves two role sessions to disk so authenticated test projects can reuse
 * the cookie/storage state without repeating the login handshake on every
 * test file.
 *
 * Roles saved:
 *   - super_admin  → playwright/.auth/super_admin.json
 *   - lender       → playwright/.auth/lender.json
 *
 * Individual tests that need a different role can still call
 * /api/test/set-session to override the session for that test only.
 */

import { test as setup, expect } from "@playwright/test";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SA_FILE = path.join(__dirname, "../playwright/.auth/super_admin.json");
const LENDER_FILE = path.join(__dirname, "../playwright/.auth/lender.json");

setup("save super_admin session state", async ({ page }) => {
  const res = await page.request.post("/api/test/set-session", {
    data: { userId: "e2e-global-sa", userRole: "super_admin" },
  });
  expect(res.ok()).toBeTruthy();
  // Navigate to a guarded page to materialise the session cookie
  await page.goto("/dashboard");
  await expect(page).not.toHaveURL(/\/login/, { timeout: 15000 });
  await page.context().storageState({ path: SA_FILE });
});

setup("save lender session state", async ({ page }) => {
  const res = await page.request.post("/api/test/set-session", {
    data: { userId: "e2e-global-lender", userRole: "lender" },
  });
  expect(res.ok()).toBeTruthy();
  await page.goto("/dashboard");
  await expect(page).not.toHaveURL(/\/login/, { timeout: 15000 });
  await page.context().storageState({ path: LENDER_FILE });
});
