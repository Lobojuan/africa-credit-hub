import { test, expect } from '@playwright/test';

test.describe('Supporting Endpoints', () => {
  test('exchange rates API returns data', async ({ page }) => {
    const response = await page.request.get('/api/exchange-rates');
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(Array.isArray(data)).toBeTruthy();
    expect(data.length).toBeGreaterThan(0);
    expect(data[0]).toHaveProperty('baseCurrency');
    expect(data[0]).toHaveProperty('rate');
  });

  test('organizations API returns data', async ({ page }) => {
    const response = await page.request.get('/api/organizations');
    expect(response.ok()).toBeTruthy();
  });

  test('API keys endpoint works', async ({ page }) => {
    const response = await page.request.get('/api/api-keys');
    expect(response.ok()).toBeTruthy();
  });

  test('version history returns data', async ({ page }) => {
    const response = await page.request.get('/api/version-history');
    expect(response.ok()).toBeTruthy();
  });

  test('institutions returns data with correct shape', async ({ page }) => {
    const response = await page.request.get('/api/institutions');
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    const institutions = Array.isArray(data) ? data : data.data || [];
    expect(institutions.length).toBeGreaterThan(0);
    expect(institutions[0]).toHaveProperty('name');
  });

  test('retention policies returns data', async ({ page }) => {
    const response = await page.request.get('/api/retention-policies');
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(Array.isArray(data)).toBeTruthy();
  });
});
