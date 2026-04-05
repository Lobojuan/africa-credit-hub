import { test, expect } from '@playwright/test';

test.describe('Consumer Portal & Documentation', () => {

  test('consumer registration endpoint exists', async ({ request }) => {
    const response = await request.post('/api/consumer/register', {
      data: {
        email: 'e2e-test-' + Date.now() + '@example.com',
        phone: '+233200000001',
        password: 'TestPass123!',
        firstName: 'E2E',
        lastName: 'Consumer'
      }
    });
    expect([200, 201, 400, 429]).toContain(response.status());
  });

  test('consumer login endpoint exists', async ({ request }) => {
    const response = await request.post('/api/consumer/login', {
      data: {
        email: 'nonexistent@example.com',
        password: 'TestPass123!'
      }
    });
    expect([200, 400, 401, 429]).toContain(response.status());
  });

  test('consumer session check endpoint exists', async ({ request }) => {
    const response = await request.get('/api/consumer/session');
    expect([200, 401]).toContain(response.status());
  });

  test('consumer lookup endpoint exists', async ({ request }) => {
    const response = await request.post('/api/consumer/lookup', {
      data: { nationalId: 'TEST123' }
    });
    expect([200, 400, 401, 403, 404, 429]).toContain(response.status());
  });

  test('documentation API returns all docs', async ({ page }) => {
    const response = await page.request.get('/api/docs');
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(Array.isArray(data)).toBeTruthy();
    expect(data.length).toBeGreaterThanOrEqual(15);

    const ids = data.map((d: any) => d.id);
    expect(ids).toContain('users-manual');
    expect(ids).toContain('api-guide');
    expect(ids).toContain('srs-matrix');
    expect(ids).toContain('data-submission');
    expect(ids).toContain('dispute-procedures');
  });

  test('documentation individual doc API works', async ({ page }) => {
    const response = await page.request.get('/api/docs/users-manual');
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data).toHaveProperty('content');
    expect(data.content.length).toBeGreaterThan(1000);
  });

  test('documentation PDF download works', async ({ page }) => {
    const response = await page.request.get('/api/docs/users-manual/pdf');
    expect(response.ok()).toBeTruthy();
    const contentType = response.headers()['content-type'] || '';
    expect(contentType).toMatch(/pdf|octet-stream/i);
  });

  test('documentation page loads in browser', async ({ page }) => {
    await page.goto('/documentation');
    await page.waitForTimeout(3000);
    const pageContent = await page.textContent('body');
    expect(pageContent).toMatch(/documentation|manual|guide/i);
  });

  test('guide page loads', async ({ page }) => {
    await page.goto('/guide');
    await page.waitForTimeout(3000);
    const pageContent = await page.textContent('body');
    expect(pageContent).toMatch(/guide|tutorial|start|welcome/i);
  });

  test('version history page loads', async ({ page }) => {
    await page.goto('/version-history');
    await page.waitForTimeout(3000);
    const pageContent = await page.textContent('body');
    expect(pageContent).toMatch(/version|history|release|change/i);
  });

  test('about page loads', async ({ page }) => {
    await page.goto('/about');
    await page.waitForTimeout(3000);
    const pageContent = await page.textContent('body');
    expect(pageContent).toMatch(/about|credit|system|africa/i);
  });

  test('legal page loads', async ({ page }) => {
    await page.goto('/legal');
    await page.waitForTimeout(3000);
    const pageContent = await page.textContent('body');
    expect(pageContent).toMatch(/legal|copyright|terms|privacy/i);
  });

  test('consumer portal page loads', async ({ page }) => {
    await page.goto('/my-credit');
    await page.waitForTimeout(3000);
    const pageContent = await page.textContent('body');
    expect(pageContent).toBeTruthy();
  });

  test('ghana docs page loads', async ({ page }) => {
    await page.goto('/ghana-docs');
    await page.waitForTimeout(3000);
    const pageContent = await page.textContent('body');
    expect(pageContent).toMatch(/ghana|document|compliance|regulation/i);
  });
});
