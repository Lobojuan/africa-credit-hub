import { test, expect } from '@playwright/test';

const ADMIN_PASSWORD = process.env.TEST_ADMIN_PASSWORD || process.env.SEED_ADMIN_PASSWORD || 'admin0987';

test.describe('Authentication Flow', () => {
  test('unauthenticated user sees login page', async ({ page }) => {
    await page.goto('/login');
    // Portal chooser is shown first — click the institution/business portal
    await page.locator('[data-testid="button-login-institution"]').click();
    await expect(page.locator('input[type="text"], input[name="username"], input[placeholder*="user" i]').first()).toBeVisible({ timeout: 15000 });
  });

  test('login with invalid credentials shows error', async ({ page }) => {
    await page.goto('/login');
    await page.locator('[data-testid="button-login-institution"]').click();
    const usernameInput = page.locator('input[type="text"], input[name="username"], input[placeholder*="user" i]').first();
    const passwordInput = page.locator('input[type="password"]').first();
    await usernameInput.waitFor({ timeout: 15000 });
    await usernameInput.fill('admin');
    await passwordInput.fill('wrongpassword');
    await page.locator('button[type="submit"]').first().click();
    await expect(page.locator('text=/invalid|error|incorrect|attempt/i').first()).toBeVisible({ timeout: 10000 });
  });

  test('login with valid credentials redirects to dashboard', async ({ page }) => {
    await page.goto('/login');
    await page.locator('[data-testid="button-login-institution"]').click();
    const usernameInput = page.locator('input[type="text"], input[name="username"], input[placeholder*="user" i]').first();
    const passwordInput = page.locator('input[type="password"]').first();
    await usernameInput.waitFor({ timeout: 15000 });
    await usernameInput.fill('admin');
    await passwordInput.fill(ADMIN_PASSWORD);
    await page.locator('button[type="submit"]').first().click();
    await expect(page.locator('text=/dashboard|overview|welcome|borrower/i').first()).toBeVisible({ timeout: 15000 });
  });

  test('auth/me API returns user data when authenticated', async ({ request }) => {
    const loginResponse = await request.post('/api/auth/login', {
      data: { username: 'admin', password: ADMIN_PASSWORD }
    });
    expect(loginResponse.ok()).toBeTruthy();
    const loginData = await loginResponse.json();
    expect(loginData.fullName).toBeTruthy();
    expect(loginData.role).toBe('super_admin');

    const meResponse = await request.get('/api/auth/me');
    expect(meResponse.ok()).toBeTruthy();
    const meData = await meResponse.json();
    expect(meData.username).toBe('admin');
  });

  test('logout clears session', async ({ request }) => {
    const loginResponse = await request.post('/api/auth/login', {
      data: { username: 'admin', password: ADMIN_PASSWORD }
    });
    expect(loginResponse.ok()).toBeTruthy();

    const csrfRes = await request.get('/api/auth/csrf-token');
    const { token: csrfToken } = await csrfRes.json() as { token: string };
    const logoutResponse = await request.post('/api/auth/logout', {
      headers: { 'x-csrf-token': csrfToken }
    });
    expect(logoutResponse.ok()).toBeTruthy();

    const meResponse = await request.get('/api/auth/me');
    expect(meResponse.status()).toBe(401);
  });
});
