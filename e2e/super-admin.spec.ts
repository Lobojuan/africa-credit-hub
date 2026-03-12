import { test, expect } from '@playwright/test';

test.describe('Super Admin Pages', () => {
  test('platform stats API returns correct data shape', async ({ page }) => {
    const response = await page.request.get('/api/admin/platform-stats');
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data).toHaveProperty('totalBorrowers');
    expect(data).toHaveProperty('totalAccounts');
    expect(typeof data.totalBorrowers).toBe('number');
    expect(data.totalBorrowers).toBeGreaterThan(0);
  });

  test('user management API returns users', async ({ page }) => {
    const response = await page.request.get('/api/users');
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(Array.isArray(data)).toBeTruthy();
    expect(data.length).toBeGreaterThan(0);
    expect(data[0]).toHaveProperty('username');
    expect(data[0]).toHaveProperty('role');
    const admin = data.find((u: Record<string, unknown>) => u.username === 'admin');
    expect(admin).toBeTruthy();
    expect(admin.fullName).toBe('Uffe J Carlson');
  });

  test('country settings API returns data', async ({ page }) => {
    const response = await page.request.get('/api/country-settings');
    expect(response.ok()).toBeTruthy();
  });
});
