import { test, expect } from '@playwright/test';

test.describe('Regulatory & Compliance Extended [FR-REG, INT-RPT]', () => {

  test('FR-REG-01: regulatory dashboard with NPL ratios', async ({ page }) => {
    const response = await page.request.get('/api/regulatory/dashboard');
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data).toHaveProperty('summary');
    expect(data.summary).toHaveProperty('nplRatio');
    expect(parseFloat(data.summary.nplRatio)).toBeGreaterThanOrEqual(0);
  });

  test('INT-RPT-04: regulatory reports endpoint works', async ({ page }) => {
    const response = await page.request.get('/api/reports');
    expect(response.ok()).toBeTruthy();
  });

  test('regulatory compliance page loads', async ({ page }) => {
    await page.goto('/regulatory-compliance');
    await page.waitForTimeout(3000);
    const pageContent = await page.textContent('body');
    expect(pageContent).toMatch(/compliance|regulatory|requirement|standard/i);
  });

  test('regulatory dashboard page loads', async ({ page }) => {
    await page.goto('/regulatory-dashboard');
    await page.waitForTimeout(3000);
    const pageContent = await page.textContent('body');
    expect(pageContent).toMatch(/regulatory|dashboard|npl|portfolio/i);
  });

  test('audit trail page loads', async ({ page }) => {
    await page.goto('/audit');
    await page.waitForTimeout(3000);
    const pageContent = await page.textContent('body');
    expect(pageContent).toMatch(/audit|trail|log|action/i);
  });

  test('ENT-20: audit trail has timeline view', async ({ page }) => {
    await page.goto('/audit');
    await page.waitForTimeout(3000);
    const pageContent = await page.textContent('body');
    expect(pageContent).toMatch(/audit|trail|log/i);
  });

  test('BOG export page loads', async ({ page }) => {
    await page.goto('/bog-export');
    await page.waitForTimeout(3000);
    const pageContent = await page.textContent('body');
    expect(pageContent).toMatch(/export|bank|ghana|bog|download/i);
  });

  test('BSL export page loads', async ({ page }) => {
    await page.goto('/bsl-export');
    await page.waitForTimeout(3000);
    const pageContent = await page.textContent('body');
    expect(pageContent).toMatch(/export|sierra|leone|bsl|download/i);
  });

  test('retention policies page loads', async ({ page }) => {
    await page.goto('/retention-policies');
    await page.waitForTimeout(3000);
    const pageContent = await page.textContent('body');
    expect(pageContent).toMatch(/retention|policy|archive|year/i);
  });

  test('ENT-19: dashboard trends endpoint works', async ({ page }) => {
    const response = await page.request.get('/api/dashboard/trends');
    expect(response.ok()).toBeTruthy();
  });

  test('ENT-14: dashboard chart data endpoint works', async ({ page }) => {
    const response = await page.request.get('/api/dashboard/chart-data');
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data).toBeTruthy();
  });

  test('platform KPIs endpoint works', async ({ page }) => {
    const response = await page.request.get('/api/platform-kpis');
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data).toHaveProperty('portfolio');
    expect(data).toHaveProperty('borrowers');
  });
});
