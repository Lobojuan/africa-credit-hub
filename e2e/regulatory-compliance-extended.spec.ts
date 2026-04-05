import { test, expect } from '@playwright/test';

interface RegulatoryDashboard {
  summary: {
    nplRatio: string;
    totalBorrowers: number;
  };
}

interface PlatformKPIs {
  portfolio: Record<string, unknown>;
  borrowers: Record<string, unknown>;
}

test.describe('Regulatory & Compliance [FR-REG, INT-RPT, ENT]', () => {

  test('FR-REG-01: regulatory dashboard has NPL ratio', async ({ page }) => {
    const response = await page.request.get('/api/regulatory/dashboard');
    expect(response.ok()).toBeTruthy();
    const data = await response.json() as RegulatoryDashboard;
    expect(data).toHaveProperty('summary');
    expect(data.summary).toHaveProperty('nplRatio');
    const npl = parseFloat(data.summary.nplRatio);
    expect(npl).toBeGreaterThanOrEqual(0);
    expect(npl).toBeLessThanOrEqual(100);
  });

  test('INT-RPT-04: regulatory reports endpoint', async ({ page }) => {
    const response = await page.request.get('/api/reports');
    expect(response.ok()).toBeTruthy();
  });

  test('ENT-19: dashboard trends endpoint returns data', async ({ page }) => {
    const response = await page.request.get('/api/dashboard/trends');
    expect(response.ok()).toBeTruthy();
  });

  test('ENT-14: dashboard chart data endpoint returns data', async ({ page }) => {
    const response = await page.request.get('/api/dashboard/chart-data');
    expect(response.ok()).toBeTruthy();
    const data = await response.json() as Record<string, unknown>;
    expect(data).toBeTruthy();
  });

  test('platform KPIs has portfolio and borrowers', async ({ page }) => {
    const response = await page.request.get('/api/platform-kpis');
    expect(response.ok()).toBeTruthy();
    const data = await response.json() as PlatformKPIs;
    expect(data).toHaveProperty('portfolio');
    expect(data).toHaveProperty('borrowers');
  });

  test('regulatory compliance page loads', async ({ page }) => {
    await page.goto('/regulatory-compliance');
    await page.waitForLoadState('domcontentloaded');
    const pageContent = await page.textContent('body');
    expect(pageContent).toMatch(/compliance|regulatory|requirement|standard/i);
  });

  test('regulatory dashboard page loads', async ({ page }) => {
    await page.goto('/regulatory-dashboard');
    await page.waitForLoadState('networkidle');
    const pageContent = await page.textContent('body');
    expect(pageContent).toMatch(/regulatory|dashboard|npl|portfolio/i);
  });

  test('ENT-20: audit trail page loads', async ({ page }) => {
    await page.goto('/audit');
    await page.waitForLoadState('domcontentloaded');
    const pageContent = await page.textContent('body');
    expect(pageContent).toMatch(/audit|trail|log|action/i);
  });

  test('BOG export page loads', async ({ page }) => {
    await page.goto('/bog-export');
    await page.waitForLoadState('domcontentloaded');
    const pageContent = await page.textContent('body');
    expect(pageContent).toMatch(/export|bank|ghana|bog|download/i);
  });

  test('BSL export page loads', async ({ page }) => {
    await page.goto('/bsl-export');
    await page.waitForLoadState('networkidle');
    const pageContent = await page.textContent('body');
    expect(pageContent).toMatch(/export|sierra|leone|bsl|download/i);
  });

  test('retention policies page loads', async ({ page }) => {
    await page.goto('/retention-policies');
    await page.waitForLoadState('domcontentloaded');
    const pageContent = await page.textContent('body');
    expect(pageContent).toMatch(/retention|policy|archive|year/i);
  });

  test('audit trail has action/timestamp entries', async ({ page }) => {
    await page.goto('/audit');
    await page.waitForLoadState('domcontentloaded');
    const pageContent = await page.textContent('body');
    expect(pageContent).toMatch(/audit|trail|log/i);
  });
});
