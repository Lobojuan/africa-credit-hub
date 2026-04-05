import { test, expect } from '@playwright/test';

test.describe('Error Handling', () => {
  test('unknown frontend route loads without crashing', async ({ page }) => {
    await page.goto('/');
    const usernameInput = page.locator('input[type="text"], input[name="username"], input[placeholder*="user" i]').first();
    const passwordInput = page.locator('input[type="password"]').first();
    await usernameInput.waitFor({ timeout: 15000 });
    await usernameInput.fill('admin');
    await passwordInput.fill('admin0987');
    await page.locator('button[type="submit"]').first().click();
    await page.waitForLoadState('domcontentloaded');

    const response = await page.goto('/nonexistent-page-xyz');
    expect(response?.status()).toBeLessThan(500);
    await page.waitForTimeout(2000);
    const pageContent = await page.textContent('body');
    expect(pageContent).toBeTruthy();
    expect(pageContent!.length).toBeGreaterThan(50);
  });

  test('unauthenticated API access returns 401', async ({ request }) => {
    const endpoints = [
      '/api/borrowers',
      '/api/credit-accounts',
      '/api/dashboard/stats',
      '/api/users',
      '/api/disputes',
      '/api/audit-logs',
    ];

    for (const endpoint of endpoints) {
      const response = await request.get(endpoint);
      expect(response.status()).toBe(401);
    }
  });

  test('auth/me returns 401 when not authenticated', async ({ request }) => {
    const response = await request.get('/api/auth/me');
    expect(response.status()).toBe(401);
    const data = await response.json();
    expect(data).toHaveProperty('message');
  });

  test('login with empty body returns 400', async ({ request }) => {
    const response = await request.post('/api/auth/login', { data: {} });
    expect(response.status()).toBe(400);
  });
});
