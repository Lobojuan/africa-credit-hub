import { test, expect } from '@playwright/test';

test.describe('Platform Command Center [PCC-01 through PCC-10]', () => {

  test('PCC-01: platform KPIs endpoint returns jurisdiction overview', async ({ page }) => {
    const response = await page.request.get('/api/platform-kpis');
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data).toHaveProperty('portfolio');
    expect(data).toHaveProperty('borrowers');
    expect(data).toHaveProperty('operations');
  });

  test('PCC-02: platform audit logs endpoint works', async ({ page }) => {
    const response = await page.request.get('/api/platform/audit-logs');
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data).toHaveProperty('logs');
    expect(Array.isArray(data.logs)).toBeTruthy();
  });

  test('PCC-03: platform API keys endpoint works', async ({ page }) => {
    const response = await page.request.get('/api/platform/api-keys');
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data).toHaveProperty('keys');
    expect(Array.isArray(data.keys)).toBeTruthy();
  });

  test('PCC-04: platform data quality endpoint works', async ({ page }) => {
    const response = await page.request.get('/api/platform/data-quality');
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data).toHaveProperty('overallCompleteness');
    expect(data).toHaveProperty('borrowers');
  });

  test('PCC-05: platform billing endpoint works', async ({ page }) => {
    const response = await page.request.get('/api/platform/billing');
    expect(response.ok()).toBeTruthy();
  });

  test('PCC-06: platform retention policies endpoint works', async ({ page }) => {
    const response = await page.request.get('/api/platform/retention-policies');
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(Array.isArray(data)).toBeTruthy();
  });

  test('PCC-07: platform activity feed endpoint works', async ({ page }) => {
    const response = await page.request.get('/api/platform/activity-feed');
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(Array.isArray(data)).toBeTruthy();
  });

  test('PCC-10: country settings endpoint works', async ({ page }) => {
    const response = await page.request.get('/api/platform/country-settings');
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(Array.isArray(data)).toBeTruthy();
    if (data.length > 0) {
      expect(data[0]).toHaveProperty('countryCode');
      expect(data[0]).toHaveProperty('countryName');
    }
  });

  test('PCC-10: specific country settings endpoint works', async ({ page }) => {
    const response = await page.request.get('/api/platform/country-settings/GH');
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data).toHaveProperty('countryCode');
  });

  test('command center page loads in browser', async ({ page }) => {
    await page.goto('/command-center');
    await page.waitForTimeout(3000);
    const pageContent = await page.textContent('body');
    expect(pageContent).toMatch(/command|center|platform|jurisdiction|country/i);
  });

  test('maintenance mode status endpoint works', async ({ page }) => {
    const response = await page.request.get('/api/maintenance/status');
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data).toHaveProperty('enabled');
    expect(typeof data.enabled).toBe('boolean');
  });

  test('platform metrics page loads', async ({ page }) => {
    await page.goto('/platform-metrics');
    await page.waitForTimeout(3000);
    const pageContent = await page.textContent('body');
    expect(pageContent).toMatch(/metric|platform|usage|api/i);
  });
});
