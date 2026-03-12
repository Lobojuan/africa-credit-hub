import { test, expect } from '@playwright/test';

test.describe('Reports & Regulatory', () => {
  test('reports API returns data', async ({ page }) => {
    const response = await page.request.get('/api/reports');
    expect(response.ok()).toBeTruthy();
  });

  test('regulatory dashboard returns summary data', async ({ page }) => {
    const response = await page.request.get('/api/regulatory/dashboard');
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data).toHaveProperty('summary');
    expect(data.summary).toHaveProperty('totalBorrowers');
    expect(data.summary).toHaveProperty('totalAccounts');
    expect(data.summary).toHaveProperty('nplRatio');
  });

  test('regulatory compliance returns data', async ({ page }) => {
    const response = await page.request.get('/api/regulatory/compliance');
    expect(response.ok()).toBeTruthy();
  });
});
