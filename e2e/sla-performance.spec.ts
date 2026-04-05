import { test, expect } from '@playwright/test';

interface HealthResponse {
  status: string;
  version: string;
  uptime: number;
}

interface HealthDetail {
  status: string;
  database?: { status: string; connected?: boolean };
}

interface BorrowerListResponse {
  data: Array<{ id: string }>;
}

test.describe('SLA & Performance Validation', () => {

  test('SLA-01: health endpoint < 500ms', async ({ page }) => {
    const start = Date.now();
    const response = await page.request.get('/api/health');
    const elapsed = Date.now() - start;
    expect(response.ok()).toBeTruthy();
    expect(elapsed).toBeLessThan(500);
    const data = await response.json() as HealthResponse;
    expect(data.status).toBe('ok');
    expect(data).toHaveProperty('version');
  });

  test('SLA-02: login API < 2 seconds', async ({ page }) => {
    const start = Date.now();
    const response = await page.request.post('/api/auth/login', {
      data: { username: 'admin', password: 'admin0987' }
    });
    const elapsed = Date.now() - start;
    expect(elapsed).toBeLessThan(2000);
  });

  test('SLA-03: borrower list < 3 seconds', async ({ page }) => {
    const start = Date.now();
    const response = await page.request.get('/api/borrowers');
    const elapsed = Date.now() - start;
    expect(response.ok()).toBeTruthy();
    expect(elapsed).toBeLessThan(3000);
  });

  test('SLA-04: credit report < 5 seconds', async ({ page }) => {
    const borrowersRes = await page.request.get('/api/borrowers');
    const body = await borrowersRes.json() as BorrowerListResponse;
    if (body.data.length === 0) { test.skip(); return; }

    const start = Date.now();
    const response = await page.request.get(`/api/borrowers/${body.data[0].id}/credit-report`);
    const elapsed = Date.now() - start;
    expect(response.ok()).toBeTruthy();
    expect(elapsed).toBeLessThan(5000);
  });

  test('SLA-05: global search < 3 seconds', async ({ page }) => {
    const start = Date.now();
    const response = await page.request.get('/api/global-search?query=test');
    const elapsed = Date.now() - start;
    expect(response.ok()).toBeTruthy();
    expect(elapsed).toBeLessThan(3000);
  });

  test('SLA-06: dashboard chart data < 5 seconds', async ({ page }) => {
    const start = Date.now();
    const response = await page.request.get('/api/dashboard/chart-data');
    const elapsed = Date.now() - start;
    expect(response.ok()).toBeTruthy();
    expect(elapsed).toBeLessThan(5000);
  });

  test('SLA-07: dashboard page load < 10 seconds', async ({ page }) => {
    const start = Date.now();
    await page.goto('/dashboard');
    await page.waitForLoadState('domcontentloaded');
    const elapsed = Date.now() - start;
    expect(elapsed).toBeLessThan(10000);
  });

  test('SLA-08: telco scoring page load < 10 seconds', async ({ page }) => {
    const start = Date.now();
    await page.goto('/telco-scoring');
    await page.waitForLoadState('domcontentloaded');
    const elapsed = Date.now() - start;
    expect(elapsed).toBeLessThan(10000);
  });

  test('SLA-09: regulatory dashboard < 5 seconds', async ({ page }) => {
    const start = Date.now();
    const response = await page.request.get('/api/regulatory/dashboard');
    const elapsed = Date.now() - start;
    expect(response.ok()).toBeTruthy();
    expect(elapsed).toBeLessThan(5000);
  });

  test('SLA-10: system uptime health check', async ({ page }) => {
    const response = await page.request.get('/api/admin/health-detail');
    expect(response.ok()).toBeTruthy();
    const data = await response.json() as HealthDetail;
    expect(data).toHaveProperty('status');
  });

  test('SLA-11: platform status operational', async ({ page }) => {
    const response = await page.request.get('/api/status');
    expect(response.ok()).toBeTruthy();
  });

  test('SLA-12: API endpoints respond with JSON', async ({ page }) => {
    const response = await page.request.get('/api/dashboard/stats');
    expect(response.ok()).toBeTruthy();
    const contentType = response.headers()['content-type'] || '';
    expect(contentType).toContain('json');
  });

  test('SLA-13: CSRF token endpoint works', async ({ page }) => {
    const response = await page.request.get('/api/auth/csrf-token');
    expect(response.ok()).toBeTruthy();
    const data = await response.json() as { token: string };
    expect(data).toHaveProperty('token');
    expect(typeof data.token).toBe('string');
    expect(data.token.length).toBeGreaterThan(0);
  });

  test('SLA-14: credit score calculation < 3 seconds', async ({ page }) => {
    const borrowersRes = await page.request.get('/api/borrowers');
    const body = await borrowersRes.json() as BorrowerListResponse;
    if (body.data.length === 0) { test.skip(); return; }

    const start = Date.now();
    const response = await page.request.get(`/api/borrowers/${body.data[0].id}/credit-report`);
    const elapsed = Date.now() - start;
    expect(response.ok()).toBeTruthy();
    expect(elapsed).toBeLessThan(3000);
  });

  test('SLA-15: PDF download < 30 seconds', async ({ page }) => {
    const start = Date.now();
    const response = await page.request.get('/api/docs/users-manual/pdf');
    const elapsed = Date.now() - start;
    expect(response.ok()).toBeTruthy();
    expect(elapsed).toBeLessThan(30000);
    const contentType = response.headers()['content-type'] || '';
    expect(contentType).toMatch(/pdf|octet-stream/i);
  });

  test('SLA-16: API response < 5 seconds for all endpoints', async ({ page }) => {
    const endpoints = ['/api/borrowers', '/api/credit-accounts', '/api/disputes', '/api/consent-records'];
    for (const endpoint of endpoints) {
      const start = Date.now();
      const response = await page.request.get(endpoint);
      const elapsed = Date.now() - start;
      expect(response.ok()).toBeTruthy();
      expect(elapsed).toBeLessThan(5000);
    }
  });
});
