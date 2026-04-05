import { test, expect } from '@playwright/test';
import { postWithCSRF } from './helpers/csrf';

interface BorrowerListResponse {
  data: Array<{ id: string }>;
}

interface CreditRiskAnalysis {
  analysis: string;
}

interface ChatResponse {
  response: string;
}

test.describe('AI Command Center [AI-001 through AI-004]', () => {
  test.setTimeout(15000);

  test('AI-001: credit risk analysis endpoint accepts request', async ({ page }) => {
    const borrowersRes = await page.request.get('/api/borrowers');
    const borrowersBody = await borrowersRes.json() as BorrowerListResponse;
    const borrowerId = borrowersBody.data?.[0]?.id;
    if (!borrowerId) { test.skip(); return; }

    const response = await postWithCSRF(page, `/api/ai/credit-risk/${borrowerId}`, {});
    if (response.status() === 429) { test.skip(); return; }
    if (response.status() === 503) { test.skip(); return; }
    expect(response.ok()).toBeTruthy();
    const data = await response.json() as CreditRiskAnalysis;
    expect(data).toHaveProperty('analysis');
    expect(typeof data.analysis).toBe('string');
    expect(data.analysis.length).toBeGreaterThan(0);
  });

  test('AI-002: report summary endpoint accepts request', async ({ page }) => {
    const borrowersRes = await page.request.get('/api/borrowers');
    const borrowersBody = await borrowersRes.json() as BorrowerListResponse;
    const borrowerId = borrowersBody.data?.[0]?.id;
    if (!borrowerId) { test.skip(); return; }

    const response = await postWithCSRF(page, `/api/ai/report-summary/${borrowerId}`, {});
    if (response.status() === 429) { test.skip(); return; }
    if (response.status() === 503) { test.skip(); return; }
    expect(response.ok()).toBeTruthy();
  });

  test('AI-003: AI chat endpoint processes messages', async ({ page }) => {
    const response = await postWithCSRF(page, '/api/ai/chat', {
      message: 'What is a credit score?',
      history: []
    });
    if (response.status() === 429) { test.skip(); return; }
    if (response.status() === 503) { test.skip(); return; }
    expect(response.ok()).toBeTruthy();
    const data = await response.json() as ChatResponse;
    expect(data).toHaveProperty('response');
    expect(typeof data.response).toBe('string');
    expect(data.response.length).toBeGreaterThan(0);
  });

  test('AI-004: compliance report endpoint accepts country', async ({ page }) => {
    test.setTimeout(30000);
    const response = await postWithCSRF(page, '/api/ai/compliance-report', {
      country: 'Ghana'
    });
    if (response.status() === 429) { test.skip(); return; }
    if (response.status() === 503) { test.skip(); return; }
    expect(response.ok()).toBeTruthy();
  });

  test('AI anomaly detection endpoint accepts request', async ({ page }) => {
    const response = await postWithCSRF(page, '/api/ai/anomaly-detection', {});
    if (response.status() === 429) { test.skip(); return; }
    if (response.status() === 503) { test.skip(); return; }
    expect(response.ok()).toBeTruthy();
  });

  test('AI natural query endpoint processes queries', async ({ page }) => {
    const response = await postWithCSRF(page, '/api/ai/natural-query', {
      query: 'How many borrowers are in Ghana?'
    });
    if (response.status() === 429) { test.skip(); return; }
    if (response.status() === 503) { test.skip(); return; }
    expect(response.ok()).toBeTruthy();
  });

  test('AI command center page loads', async ({ page }) => {
    await page.goto('/ai-command-center');
    await page.waitForLoadState('domcontentloaded');
    const pageContent = await page.textContent('body');
    expect(pageContent).toMatch(/ai|intelligence|command|analysis|risk/i);
  });

  test('portfolio intelligence page loads', async ({ page }) => {
    await page.goto('/portfolio-intelligence');
    await page.waitForLoadState('domcontentloaded');
    const pageContent = await page.textContent('body');
    expect(pageContent).toMatch(/portfolio|intelligence|analytics|insight/i);
  });
});
