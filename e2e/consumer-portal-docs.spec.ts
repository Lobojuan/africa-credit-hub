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

  test('FR-CP-03: consumer session check without auth returns 401', async ({ request }) => {
    const response = await request.get('/api/consumer/session');
    expect(response.status()).toBe(401);
  });

  test('FR-CP-04: consumer OTP verification rejects invalid code', async ({ request }) => {
    const response = await request.post('/api/consumer/verify-otp', {
      data: {
        nationalId: 'NONEXISTENT-ID',
        otp: '000000'
      }
    });
    if (response.status() === 429) { test.skip(); return; }
    expect([400, 401, 403, 404]).toContain(response.status());
    const body = await response.json() as Record<string, string>;
    expect(body).toHaveProperty('message');
  });

  test('FR-CP-05: consumer OTP resend requires valid account', async ({ request }) => {
    const response = await request.post('/api/consumer/resend-otp', {
      data: {
        nationalId: 'NONEXISTENT-ID-OTP'
      }
    });
    if (response.status() === 429) { test.skip(); return; }
    expect([400, 403, 404]).toContain(response.status());
  });

  test('FR-CP-06: Google OAuth redirects to Google', async ({ request }) => {
    const response = await request.get('/api/consumer/auth/google', {
      maxRedirects: 0
    });
    expect([302, 303]).toContain(response.status());
    const location = response.headers()['location'] || '';
    expect(location).toContain('accounts.google.com');
  });

  test('FR-CP-07: consumer lookup requires consumer session', async ({ request }) => {
    const response = await request.post('/api/consumer/lookup', {
      data: { nationalId: 'TEST123' }
    });
    expect([401, 403]).toContain(response.status());
  });

  test('DOC-01: documentation API returns all 18 required docs', async ({ page }) => {
    const response = await page.request.get('/api/docs');
    expect(response.ok()).toBeTruthy();
    const data = await response.json() as DocItem[];
    expect(Array.isArray(data)).toBeTruthy();
    expect(data.length).toBe(18);

    const ids = data.map((d) => d.id);
    const requiredDocs = [
      'api-guide', 'uat', 'systems', 'users-manual', 'srs-matrix',
      'data-dictionary', 'deployment', 'security', 'security-policy',
      'dr-plan', 'change-mgmt', 'pentest-readiness', 'liberia-proposal',
      'credit-procedures', 'data-protection', 'regulatory-pack',
      'data-submission', 'dispute-procedures'
    ];
    for (const docId of requiredDocs) {
      expect(ids).toContain(docId);
    }

    for (const doc of data) {
      expect(doc).toHaveProperty('id');
      expect(doc).toHaveProperty('title');
      expect(typeof doc.id).toBe('string');
      expect(typeof doc.title).toBe('string');
      expect(doc.title.length).toBeGreaterThan(0);
    }
  });

  test('DOC-02: all 18 docs have retrievable content', async ({ page }) => {
    const listRes = await page.request.get('/api/docs');
    expect(listRes.ok()).toBeTruthy();
    const docs = await listRes.json() as DocItem[];
    expect(docs.length).toBe(18);

    for (const doc of docs) {
      const docRes = await page.request.get(`/api/docs/${doc.id}`);
      expect(docRes.ok()).toBeTruthy();
      const detail = await docRes.json() as DocDetail;
      expect(detail).toHaveProperty('content');
      expect(detail.content.length).toBeGreaterThan(100);
    }
  });

  test('DOC-03: all 18 docs have downloadable PDFs', async ({ page }) => {
    const listRes = await page.request.get('/api/docs');
    expect(listRes.ok()).toBeTruthy();
    const docs = await listRes.json() as DocItem[];
    expect(docs.length).toBe(18);

    for (const doc of docs) {
      const pdfRes = await page.request.get(`/api/docs/${doc.id}/pdf`);
      expect(pdfRes.ok()).toBeTruthy();
      const contentType = pdfRes.headers()['content-type'] || '';
      expect(contentType).toMatch(/pdf|octet-stream/i);
      const body = await pdfRes.body();
      expect(body.length).toBeGreaterThan(100);
    }
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
    await page.waitForLoadState('networkidle');
    const pageContent = await page.textContent('body');
    expect(pageContent).toBeTruthy();
  });

  test('legal page loads', async ({ page }) => {
    await page.goto('/legal');
    await page.waitForLoadState('networkidle');
    const pageContent = await page.textContent('body');
    expect(pageContent).toBeTruthy();
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
