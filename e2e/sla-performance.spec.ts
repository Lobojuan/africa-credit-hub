import { test, expect } from '@playwright/test';

test.describe('SLA & Performance Validation', () => {

  test('SLA: health endpoint responds quickly', async ({ page }) => {
    const start = Date.now();
    const response = await page.request.get('/api/health');
    const elapsed = Date.now() - start;
    expect(response.ok()).toBeTruthy();
    expect(elapsed).toBeLessThan(5000);
    const data = await response.json();
    expect(data).toHaveProperty('status');
    expect(data.status).toBe('ok');
  });

  test('SLA: dashboard stats API responds within 5 seconds', async ({ page }) => {
    const start = Date.now();
    const response = await page.request.get('/api/dashboard/stats');
    const elapsed = Date.now() - start;
    expect(response.ok()).toBeTruthy();
    expect(elapsed).toBeLessThan(5000);
  });

  test('SLA: borrowers list API responds within 5 seconds', async ({ page }) => {
    const start = Date.now();
    const response = await page.request.get('/api/borrowers');
    const elapsed = Date.now() - start;
    expect(response.ok()).toBeTruthy();
    expect(elapsed).toBeLessThan(5000);
  });

  test('SLA: credit accounts API responds within 5 seconds', async ({ page }) => {
    const start = Date.now();
    const response = await page.request.get('/api/credit-accounts');
    const elapsed = Date.now() - start;
    expect(response.ok()).toBeTruthy();
    expect(elapsed).toBeLessThan(5000);
  });

  test('SLA: credit search API responds within 5 seconds', async ({ page }) => {
    const start = Date.now();
    const response = await page.request.get('/api/credit-search?query=loan');
    const elapsed = Date.now() - start;
    expect(response.ok()).toBeTruthy();
    expect(elapsed).toBeLessThan(5000);
  });

  test('SLA: credit report generation under 10 seconds', async ({ page }) => {
    const borrowersRes = await page.request.get('/api/borrowers');
    const borrowersData = await borrowersRes.json();
    const borrowers = Array.isArray(borrowersData) ? borrowersData : borrowersData.data || [];
    if (borrowers.length === 0) { test.skip(); return; }
    const borrowerId = borrowers[0].id;

    const start = Date.now();
    const response = await page.request.get(`/api/borrowers/${borrowerId}/credit-report`);
    const elapsed = Date.now() - start;
    expect(response.ok()).toBeTruthy();
    expect(elapsed).toBeLessThan(10000);
  });

  test('SLA: disputes API responds within 5 seconds', async ({ page }) => {
    const start = Date.now();
    const response = await page.request.get('/api/disputes');
    const elapsed = Date.now() - start;
    expect(response.ok()).toBeTruthy();
    expect(elapsed).toBeLessThan(5000);
  });

  test('SLA: audit logs API responds within 5 seconds', async ({ page }) => {
    const start = Date.now();
    const response = await page.request.get('/api/audit-logs');
    const elapsed = Date.now() - start;
    expect(response.ok()).toBeTruthy();
    expect(elapsed).toBeLessThan(5000);
  });

  test('SLA: regulatory dashboard responds within 5 seconds', async ({ page }) => {
    const start = Date.now();
    const response = await page.request.get('/api/regulatory/dashboard');
    const elapsed = Date.now() - start;
    expect(response.ok()).toBeTruthy();
    expect(elapsed).toBeLessThan(5000);
  });

  test('SLA: dashboard page loads within 10 seconds', async ({ page }) => {
    const start = Date.now();
    await page.goto('/dashboard');
    await page.waitForLoadState('domcontentloaded');
    const elapsed = Date.now() - start;
    expect(elapsed).toBeLessThan(10000);
  });

  test('SLA: telco scoring page loads within 10 seconds', async ({ page }) => {
    const start = Date.now();
    await page.goto('/telco-scoring');
    await page.waitForLoadState('domcontentloaded');
    const elapsed = Date.now() - start;
    expect(elapsed).toBeLessThan(10000);
  });

  test('system uptime check — health detail', async ({ page }) => {
    const response = await page.request.get('/api/admin/health-detail');
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data).toHaveProperty('status');
    if (data.database) {
      const dbOk = data.database.status === 'ok' || data.database.connected === true;
      expect(dbOk).toBeTruthy();
    }
  });

  test('platform status returns operational', async ({ page }) => {
    const response = await page.request.get('/api/status');
    expect(response.ok()).toBeTruthy();
  });
});
