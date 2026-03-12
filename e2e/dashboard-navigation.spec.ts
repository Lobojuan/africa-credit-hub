import { test, expect } from '@playwright/test';

test.describe('Dashboard & Navigation', () => {
  test('dashboard loads with content', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(3000);
    const pageContent = await page.textContent('body');
    expect(pageContent).toBeTruthy();
    expect(pageContent!.length).toBeGreaterThan(100);
  });

  test('dashboard stats API returns correct shape', async ({ page }) => {
    const response = await page.request.get('/api/dashboard/stats');
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
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
    test.setTimeout(90000);

    const pages = [
      '/borrowers', '/credit-accounts', '/search', '/reports', '/audit',
      '/users', '/approvals', '/disputes', '/institutions', '/consent',
      '/billing', '/helpdesk', '/api-keys', '/api-docs', '/help',
      '/exchange-rates', '/organizations', '/about', '/version-history',
      '/regulatory-dashboard', '/regulatory-compliance', '/portfolio-intelligence',
      '/cross-border-search', '/cross-border-agreements', '/borrower-alerts',
      '/retention-policies', '/bog-export', '/bsl-export', '/ghana-docs',
      '/guide', '/documentation', '/credit-score-methodology', '/papss-settlements',
      '/api-admin',
    ];

    const failures: string[] = [];

    for (const path of pages) {
      try {
        const response = await page.goto(path, { timeout: 8000 });
        if (!response || response.status() >= 400) {
          failures.push(`${path}: HTTP ${response?.status()}`);
        }
      } catch (e) {
        const message = e instanceof Error ? e.message.slice(0, 100) : String(e);
        failures.push(`${path}: ${message}`);
      }
    }

    if (failures.length > 0) {
      console.log('Page load failures:', failures);
    }
    expect(failures).toHaveLength(0);
  });
});
