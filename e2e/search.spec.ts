import { test, expect } from '@playwright/test';

test.describe('Search Functionality', () => {
  test('credit search API works', async ({ page }) => {
    const response = await page.request.get('/api/credit-search?query=loan');
    expect(response.ok()).toBeTruthy();
  });

  test('cross-border search API works', async ({ page }) => {
    const response = await page.request.get('/api/cross-border/search?query=test');
    expect(response.ok()).toBeTruthy();
  });

  test('search pages load without errors', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    let response = await page.goto('/search');
    expect(response?.status()).toBeLessThan(400);
    await page.waitForTimeout(1000);

    response = await page.goto('/cross-border-search');
    expect(response?.status()).toBeLessThan(400);
    await page.waitForTimeout(1000);

    const criticalErrors = consoleErrors.filter(e =>
      !e.includes('favicon') && !e.includes('i18next') && !e.includes('React DevTools')
    );
    expect(criticalErrors).toHaveLength(0);
  });
});
