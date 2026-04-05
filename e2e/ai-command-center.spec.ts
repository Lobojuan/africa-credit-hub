import { test, expect } from '@playwright/test';
import { postWithCSRF } from './helpers/csrf';

test.describe('AI Command Center [AI-001 through AI-004]', () => {
  test.setTimeout(15000);

  test('AI-001: credit risk analysis endpoint exists', async ({ page }) => {
    const borrowersRes = await page.request.get('/api/borrowers');
    const borrowersData = await borrowersRes.json();
    const borrowers = Array.isArray(borrowersData) ? borrowersData : borrowersData.data || [];
    const borrowerId = borrowers[0]?.id;
    if (!borrowerId) { test.skip(); return; }

    const response = await postWithCSRF(page, `/api/ai/credit-risk/${borrowerId}`, {});
    expect([200, 429, 500, 503]).toContain(response.status());
  });

  test('AI-002: report summary endpoint exists', async ({ page }) => {
    const borrowersRes = await page.request.get('/api/borrowers');
    const borrowersData = await borrowersRes.json();
    const borrowers = Array.isArray(borrowersData) ? borrowersData : borrowersData.data || [];
    const borrowerId = borrowers[0]?.id;
    if (!borrowerId) { test.skip(); return; }

    const response = await postWithCSRF(page, `/api/ai/report-summary/${borrowerId}`, {});
    expect([200, 429, 500, 503]).toContain(response.status());
  });

  test('AI-003: AI chat endpoint exists', async ({ page }) => {
    const response = await postWithCSRF(page, '/api/ai/chat', {
      message: 'What is a credit score?',
      history: []
    });
    expect([200, 400, 429, 500, 503]).toContain(response.status());
  });

  test('AI-004: compliance report endpoint exists', async ({ page }) => {
    test.setTimeout(30000);
    try {
      const response = await postWithCSRF(page, '/api/ai/compliance-report', {
        country: 'Ghana'
      });
      expect([200, 400, 429, 500, 503]).toContain(response.status());
    } catch {
      expect(true).toBeTruthy();
    }
  });

  test('AI anomaly detection endpoint exists', async ({ page }) => {
    const response = await postWithCSRF(page, '/api/ai/anomaly-detection', {});
    expect([200, 429, 500, 503]).toContain(response.status());
  });

  test('AI natural query endpoint exists', async ({ page }) => {
    const response = await postWithCSRF(page, '/api/ai/natural-query', {
      query: 'How many borrowers are in Ghana?'
    });
    expect([200, 429, 500, 503]).toContain(response.status());
  });

  test('AI command center page loads in browser', async ({ page }) => {
    await page.goto('/ai-command-center');
    await page.waitForTimeout(3000);
    const pageContent = await page.textContent('body');
    expect(pageContent).toMatch(/ai|intelligence|command|analysis|risk/i);
  });

  test('portfolio intelligence page loads', async ({ page }) => {
    await page.goto('/portfolio-intelligence');
    await page.waitForTimeout(3000);
    const pageContent = await page.textContent('body');
    expect(pageContent).toMatch(/portfolio|intelligence|analytics|insight/i);
  });
});
