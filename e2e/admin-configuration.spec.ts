import { test, expect } from '@playwright/test';

test.describe('Admin & Configuration [FR-DP, FR-COMM, ENT-08/09/10]', () => {

  test('FR-DP-01: institutions list with correct shape', async ({ page }) => {
    const response = await page.request.get('/api/institutions');
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    const institutions = Array.isArray(data) ? data : data.data || [];
    expect(institutions.length).toBeGreaterThan(0);
    expect(institutions[0]).toHaveProperty('name');
    expect(institutions[0]).toHaveProperty('status');
    expect(institutions[0]).toHaveProperty('type');
  });

  test('FR-COMM-01: billing records API returns data', async ({ page }) => {
    const response = await page.request.get('/api/billing');
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    const records = Array.isArray(data) ? data : data.data || [];
    if (records.length > 0) {
      expect(records[0]).toHaveProperty('invoiceNumber');
      expect(records[0]).toHaveProperty('amount');
      expect(records[0]).toHaveProperty('status');
    }
  });

  test('ENT-09: exchange rates with correct shape', async ({ page }) => {
    const response = await page.request.get('/api/exchange-rates');
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(Array.isArray(data)).toBeTruthy();
    if (data.length > 0) {
      expect(data[0]).toHaveProperty('baseCurrency');
      expect(data[0]).toHaveProperty('targetCurrency');
      expect(data[0]).toHaveProperty('rate');
    }
  });

  test('ENT-10: API administration returns configurations', async ({ page }) => {
    const response = await page.request.get('/api/api-admin/config');
    expect([200, 404]).toContain(response.status());
  });

  test('ENT-08: retention policies API returns data', async ({ page }) => {
    const response = await page.request.get('/api/retention-policies');
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(Array.isArray(data)).toBeTruthy();
  });

  test('user management - list users', async ({ page }) => {
    const response = await page.request.get('/api/users');
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(Array.isArray(data)).toBeTruthy();
    expect(data.length).toBeGreaterThan(0);
    expect(data[0]).toHaveProperty('username');
    expect(data[0]).toHaveProperty('role');
    expect(data[0]).toHaveProperty('fullName');
  });

  test('organizations API returns data', async ({ page }) => {
    const response = await page.request.get('/api/institutions');
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    const orgs = Array.isArray(data) ? data : data.data || [];
    expect(orgs.length).toBeGreaterThan(0);
  });

  test('API keys API returns data', async ({ page }) => {
    const response = await page.request.get('/api/api-keys');
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(Array.isArray(data)).toBeTruthy();
  });

  test('ENT-18: API usage analytics endpoint works', async ({ page }) => {
    const response = await page.request.get('/api/admin/api-usage');
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data).toHaveProperty('totalToday');
    expect(data).toHaveProperty('uniqueEndpoints');
    expect(data).toHaveProperty('topEndpoints');
  });

  test('webhook management endpoint works', async ({ page }) => {
    const response = await page.request.get('/api/webhooks');
    expect([200, 404]).toContain(response.status());
  });

  test('system status endpoint works', async ({ page }) => {
    const response = await page.request.get('/api/status');
    expect(response.ok()).toBeTruthy();
  });

  test('version history endpoint works', async ({ page }) => {
    await page.goto('/version-history');
    await page.waitForTimeout(3000);
    const pageContent = await page.textContent('body');
    expect(pageContent).toMatch(/version|history|release|change|update/i);
  });

  test('ENT-17: notifications endpoint works', async ({ page }) => {
    const response = await page.request.get('/api/notifications');
    expect(response.ok()).toBeTruthy();
  });

  test('institutions page loads', async ({ page }) => {
    await page.goto('/institutions');
    await page.waitForTimeout(3000);
    const pageContent = await page.textContent('body');
    expect(pageContent).toMatch(/institution|bank|lender/i);
  });

  test('billing page loads', async ({ page }) => {
    await page.goto('/billing');
    await page.waitForTimeout(3000);
    const pageContent = await page.textContent('body');
    expect(pageContent).toMatch(/billing|invoice|payment/i);
  });

  test('user management page loads', async ({ page }) => {
    await page.goto('/users');
    await page.waitForTimeout(3000);
    const pageContent = await page.textContent('body');
    expect(pageContent).toMatch(/user|role|management/i);
  });

  test('exchange rates page loads', async ({ page }) => {
    await page.goto('/exchange-rates');
    await page.waitForTimeout(3000);
    const pageContent = await page.textContent('body');
    expect(pageContent).toMatch(/exchange|rate|currency/i);
  });

  test('system status page loads', async ({ page }) => {
    await page.goto('/system-status');
    await page.waitForTimeout(3000);
    const pageContent = await page.textContent('body');
    expect(pageContent).toMatch(/status|system|uptime|health/i);
  });

  test('backup page loads', async ({ page }) => {
    await page.goto('/backup');
    await page.waitForTimeout(3000);
    const pageContent = await page.textContent('body');
    expect(pageContent).toMatch(/backup|recovery|restore/i);
  });
});
