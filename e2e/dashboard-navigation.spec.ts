import { test, expect } from '@playwright/test';

interface DashboardStats {
  totalBorrowers: number;
  totalAccounts: number;
}

test.describe('Dashboard & Navigation', () => {
  test('dashboard loads with content', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    const pageContent = await page.textContent('body');
    expect(pageContent).toBeTruthy();
    expect(pageContent!.length).toBeGreaterThan(100);
  });

  test('dashboard stats API returns correct shape', async ({ page }) => {
    const response = await page.request.get('/api/dashboard/stats');
    expect(response.ok()).toBeTruthy();
    const data = await response.json() as DashboardStats;
    expect(data).toHaveProperty('totalBorrowers');
    expect(data).toHaveProperty('totalAccounts');
    expect(typeof data.totalBorrowers).toBe('number');
    expect(data.totalBorrowers).toBeGreaterThan(0);
  });

  test('dashboard activity API returns data', async ({ page }) => {
    const response = await page.request.get('/api/dashboard/activity');
    expect(response.ok()).toBeTruthy();
  });

  test('key pages load without HTTP errors', async ({ page }) => {
    test.setTimeout(60000);

    const pages = [
      '/borrowers', '/reports', '/audit', '/users',
      '/disputes', '/institutions', '/billing',
      '/regulatory-dashboard', '/cross-border-agreements',
      '/telco-scoring', '/ai-command-center', '/command-center',
    ];

    const failures: string[] = [];

    for (const path of pages) {
      const response = await page.goto(path, { timeout: 8000 });
      if (!response || response.status() >= 400) {
        failures.push(`${path}: HTTP ${response?.status()}`);
      }
    }

    expect(failures).toHaveLength(0);
  });
});
