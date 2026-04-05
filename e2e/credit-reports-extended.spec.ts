import { test, expect } from '@playwright/test';
import { postWithCSRF } from './helpers/csrf';

interface BorrowerListResponse {
  data: Array<{ id: string }>;
}

interface CreditReportSummary {
  totalAccounts: number;
  activeAccounts: number;
  creditScore: number;
  reasonCodes: string[];
  scoreFactors: string[];
}

interface CreditReport {
  borrower: Record<string, unknown>;
  accounts: unknown[];
  inquiries: unknown[];
  summary: CreditReportSummary;
}

test.describe('Credit Reports & Scoring [FR-CR, ENT-21]', () => {

  test('FR-CR-01/FR-CR-02: credit report score in 300-850 range', async ({ page }) => {
    const borrowersRes = await page.request.get('/api/borrowers');
    const body = await borrowersRes.json() as BorrowerListResponse;
    if (body.data.length === 0) { test.skip(); return; }
    const borrowerId = body.data[0].id;

    const reportRes = await page.request.get(`/api/borrowers/${borrowerId}/credit-report`);
    expect(reportRes.ok()).toBeTruthy();
    const report = await reportRes.json() as CreditReport;

    expect(report).toHaveProperty('summary');
    expect(report.summary).toHaveProperty('creditScore');
    expect(report.summary.creditScore).toBeGreaterThanOrEqual(300);
    expect(report.summary.creditScore).toBeLessThanOrEqual(850);
  });

  test('FR-CR-06: credit report generation returns serial number', async ({ page }) => {
    const borrowersRes = await page.request.get('/api/borrowers');
    const body = await borrowersRes.json() as BorrowerListResponse;
    if (body.data.length === 0) { test.skip(); return; }

    const generateRes = await postWithCSRF(page, '/api/credit-reports/generate', {
      borrowerId: body.data[0].id, purpose: 'new_credit'
    });
    expect(generateRes.ok()).toBeTruthy();
    const data = await generateRes.json() as Record<string, unknown>;
    expect(data).toHaveProperty('serialNumber');
    expect(String(data.serialNumber)).toMatch(/^CR-/);
  });

  test('FR-CR-07: credit report includes reason codes array', async ({ page }) => {
    const borrowersRes = await page.request.get('/api/borrowers');
    const body = await borrowersRes.json() as BorrowerListResponse;
    if (body.data.length === 0) { test.skip(); return; }
    const borrowerId = body.data[0].id;

    const reportRes = await page.request.get(`/api/borrowers/${borrowerId}/credit-report`);
    expect(reportRes.ok()).toBeTruthy();
    const report = await reportRes.json() as CreditReport;
    expect(report.summary).toHaveProperty('reasonCodes');
    expect(Array.isArray(report.summary.reasonCodes)).toBeTruthy();
  });

  test('FR-CR-03: bulk credit search returns results', async ({ page }) => {
    const response = await postWithCSRF(page, '/api/credit-search/bulk', {
      identifiers: ['test', 'loan']
    });
    expect(response.ok()).toBeTruthy();
    const data = await response.json() as Record<string, unknown>;
    expect(data).toHaveProperty('results');
  });

  test('FR-CR-04: credit inquiry tracks consent purpose', async ({ page }) => {
    const response = await page.request.get('/api/credit-inquiries');
    expect(response.ok()).toBeTruthy();
    const data = await response.json() as Array<{ purpose: string }>;
    expect(Array.isArray(data)).toBeTruthy();
    if (data.length > 0) {
      expect(data[0]).toHaveProperty('purpose');
      expect(typeof data[0].purpose).toBe('string');
    }
  });

  test('FR-CR-08: credit report includes accounts array', async ({ page }) => {
    const borrowersRes = await page.request.get('/api/borrowers');
    const body = await borrowersRes.json() as BorrowerListResponse;
    if (body.data.length === 0) { test.skip(); return; }
    const borrowerId = body.data[0].id;

    const reportRes = await page.request.get(`/api/borrowers/${borrowerId}/credit-report`);
    expect(reportRes.ok()).toBeTruthy();
    const report = await reportRes.json() as CreditReport;
    expect(Array.isArray(report.accounts)).toBeTruthy();
  });

  test('ENT-16: Excel export returns spreadsheet content type', async ({ page }) => {
    const response = await page.request.get('/api/reports/export?format=xlsx&type=portfolio');
    expect(response.ok()).toBeTruthy();
    const contentType = response.headers()['content-type'] || '';
    expect(contentType).toMatch(/spreadsheet|octet-stream|xlsx/i);
  });

  test('INT-RPT-01: CSV export returns data', async ({ page }) => {
    const response = await page.request.get('/api/reports/export?format=csv&type=borrowers');
    expect(response.ok()).toBeTruthy();
  });

  test('credit report page renders report data', async ({ page }) => {
    const borrowersRes = await page.request.get('/api/borrowers');
    const body = await borrowersRes.json() as BorrowerListResponse;
    if (body.data.length === 0) { test.skip(); return; }
    const borrowerId = body.data[0].id;

    await page.goto(`/credit-report/${borrowerId}`);
    await page.waitForLoadState('domcontentloaded');
    const pageContent = await page.textContent('body');
    expect(pageContent).toMatch(/credit|report|score|borrower/i);
  });

  test('reports page renders export options', async ({ page }) => {
    await page.goto('/reports');
    await page.waitForLoadState('domcontentloaded');
    const pageContent = await page.textContent('body');
    expect(pageContent).toMatch(/report|export|download/i);
  });

  test('credit score methodology page renders', async ({ page }) => {
    await page.goto('/credit-score-methodology');
    await page.waitForLoadState('domcontentloaded');
    const pageContent = await page.textContent('body');
    expect(pageContent).toMatch(/score|methodology|credit|weight|factor/i);
  });
});
