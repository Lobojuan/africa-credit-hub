import { test, expect } from '@playwright/test';

test.describe('Compliance & Operations', () => {
  test('disputes API returns data', async ({ page }) => {
    const response = await page.request.get('/api/disputes');
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(Array.isArray(data)).toBeTruthy();
  });

  test('approvals API returns data', async ({ page }) => {
    const response = await page.request.get('/api/approvals');
    expect(response.ok()).toBeTruthy();
  });

  test('audit trail API returns logs', async ({ page }) => {
    const response = await page.request.get('/api/audit-logs');
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(Array.isArray(data)).toBeTruthy();
    expect(data.length).toBeGreaterThan(0);
    expect(data[0]).toHaveProperty('action');
  });

  test('consent management API returns data', async ({ page }) => {
    const response = await page.request.get('/api/consent');
    expect(response.ok()).toBeTruthy();
  });
});
