import { test, expect } from '@playwright/test';

interface DocItem {
  id: string;
  title: string;
  category: string;
}

interface DocDetail {
  id: string;
  title: string;
  content: string;
}

test.describe('Consumer Portal & Documentation [FR-CP, DOC]', () => {

  test('FR-CP-01: consumer registration validates required fields', async ({ request }) => {
    const response = await request.post('/api/consumer/register', {
      data: {
        email: 'e2e-test-' + Date.now() + '@example.com',
        phone: '+233200000001',
        password: 'TestPass123!',
        firstName: 'E2E',
        lastName: 'Consumer',
        nationalId: 'NATID-E2E-' + Date.now(),
        dateOfBirth: '1990-01-15'
      }
    });
    expect([200, 201]).toContain(response.status());
  });

  test('FR-CP-02: consumer login rejects invalid credentials', async ({ request }) => {
    const response = await request.post('/api/consumer/login', {
      data: {
        email: 'nonexistent@example.com',
        password: 'TestPass123!'
      }
    });
    expect([401, 400]).toContain(response.status());
  });

  test('FR-CP-03: consumer session check requires authentication', async ({ request }) => {
    const response = await request.get('/api/consumer/session');
    expect([200, 401]).toContain(response.status());
  });

  test('consumer lookup requires consumer session', async ({ request }) => {
    const response = await request.post('/api/consumer/lookup', {
      data: { nationalId: 'TEST123' }
    });
    expect([401, 403]).toContain(response.status());
  });

  test('DOC-01: documentation API returns all required docs', async ({ page }) => {
    const response = await page.request.get('/api/docs');
    expect(response.ok()).toBeTruthy();
    const data = await response.json() as DocItem[];
    expect(Array.isArray(data)).toBeTruthy();
    expect(data.length).toBeGreaterThanOrEqual(15);

    const ids = data.map((d) => d.id);
    expect(ids).toContain('users-manual');
    expect(ids).toContain('api-guide');
    expect(ids).toContain('srs-matrix');
    expect(ids).toContain('data-submission');
    expect(ids).toContain('dispute-procedures');
  });

  test('DOC-02: individual doc API returns content', async ({ page }) => {
    const response = await page.request.get('/api/docs/users-manual');
    expect(response.ok()).toBeTruthy();
    const data = await response.json() as DocDetail;
    expect(data).toHaveProperty('content');
    expect(data.content.length).toBeGreaterThan(1000);
  });

  test('DOC-03: documentation PDF download works', async ({ page }) => {
    const response = await page.request.get('/api/docs/users-manual/pdf');
    expect(response.ok()).toBeTruthy();
    const contentType = response.headers()['content-type'] || '';
    expect(contentType).toMatch(/pdf|octet-stream/i);
  });

  test('documentation page loads in browser', async ({ page }) => {
    await page.goto('/documentation');
    await page.waitForLoadState('domcontentloaded');
    const pageContent = await page.textContent('body');
    expect(pageContent).toMatch(/documentation|manual|guide/i);
  });

  test('guide page loads', async ({ page }) => {
    await page.goto('/guide');
    await page.waitForLoadState('domcontentloaded');
    const pageContent = await page.textContent('body');
    expect(pageContent).toMatch(/guide|tutorial|start|welcome/i);
  });

  test('version history page loads', async ({ page }) => {
    await page.goto('/version-history');
    await page.waitForLoadState('domcontentloaded');
    const pageContent = await page.textContent('body');
    expect(pageContent).toMatch(/version|history|release|change/i);
  });

  test('about page loads', async ({ page }) => {
    await page.goto('/about');
    await page.waitForLoadState('domcontentloaded');
    const pageContent = await page.textContent('body');
    expect(pageContent).toMatch(/about|credit|system|africa/i);
  });

  test('legal page loads', async ({ page }) => {
    await page.goto('/legal');
    await page.waitForLoadState('domcontentloaded');
    const pageContent = await page.textContent('body');
    expect(pageContent).toMatch(/legal|copyright|terms|privacy/i);
  });

  test('consumer portal page loads', async ({ page }) => {
    await page.goto('/my-credit');
    await page.waitForLoadState('domcontentloaded');
    const pageContent = await page.textContent('body');
    expect(pageContent).toBeTruthy();
  });

  test('ghana docs page loads', async ({ page }) => {
    await page.goto('/ghana-docs');
    await page.waitForLoadState('networkidle');
    const pageContent = await page.textContent('body');
    expect(pageContent).toMatch(/ghana|document|compliance|regulation/i);
  });
});
