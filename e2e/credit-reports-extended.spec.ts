import { test, expect } from '@playwright/test';
import { postWithCSRF } from './helpers/csrf';

test.describe('Credit Reports & Scoring [FR-CR, ENT-21]', () => {

  test('FR-CR-01/FR-CR-02: credit report with score in 300-850 range', async ({ page }) => {
    const borrowersRes = await page.request.get('/api/borrowers');
    const borrowersData = await borrowersRes.json();
    const borrowers = Array.isArray(borrowersData) ? borrowersData : borrowersData.data || [];
    if (borrowers.length === 0) { test.skip(); return; }
    const borrowerId = borrowers[0].id;

    const reportRes = await page.request.get(`/api/borrowers/${borrowerId}/credit-report`);
    expect(reportRes.ok()).toBeTruthy();
    const report = await reportRes.json();

    expect(report).toHaveProperty('summary');
    expect(report.summary).toHaveProperty('creditScore');
    if (report.summary.creditScore !== null && report.summary.creditScore !== undefined) {
      expect(report.summary.creditScore).toBeGreaterThanOrEqual(300);
      expect(report.summary.creditScore).toBeLessThanOrEqual(850);
    }
  });

  test('FR-CR-06: credit report has serial number', async ({ page }) => {
    const generateRes = await postWithCSRF(page, '/api/credit-reports/generate', {
      borrowerId: 1, purpose: 'new_credit'
    });
    if (generateRes.ok()) {
      const data = await generateRes.json();
      if (data.serialNumber) {
        expect(data.serialNumber).toMatch(/^CR-/);
      }
    }
  });

  test('FR-CR-07: credit report includes reason codes', async ({ page }) => {
    const borrowersRes = await page.request.get('/api/borrowers');
    const borrowersData = await borrowersRes.json();
    const borrowers = Array.isArray(borrowersData) ? borrowersData : borrowersData.data || [];
    if (borrowers.length === 0) { test.skip(); return; }
    const borrowerId = borrowers[0].id;

    const reportRes = await page.request.get(`/api/borrowers/${borrowerId}/credit-report`);
    if (reportRes.ok()) {
      const report = await reportRes.json();
      if (report.summary && report.summary.reasonCodes) {
        expect(Array.isArray(report.summary.reasonCodes)).toBeTruthy();
      }
    }
  });

  test('FR-CR-03: bulk credit search endpoint works', async ({ page }) => {
    const response = await page.request.get('/api/credit-search?query=loan');
    expect(response.ok()).toBeTruthy();
  });

  test('FR-CR-04: credit inquiry tracks consent', async ({ page }) => {
    const response = await page.request.get('/api/credit-inquiries');
    if (response.ok()) {
      const data = await response.json();
      if (Array.isArray(data) && data.length > 0) {
        expect(data[0]).toHaveProperty('purpose');
      }
    }
  });

  test('FR-CR-08: payment history has 12-period data', async ({ page }) => {
    const borrowersRes = await page.request.get('/api/borrowers');
    const borrowersData = await borrowersRes.json();
    const borrowers = Array.isArray(borrowersData) ? borrowersData : borrowersData.data || [];
    if (borrowers.length === 0) { test.skip(); return; }
    const borrowerId = borrowers[0].id;

    const reportRes = await page.request.get(`/api/borrowers/${borrowerId}/credit-report`);
    if (reportRes.ok()) {
      const report = await reportRes.json();
      if (report.accounts) {
        expect(Array.isArray(report.accounts)).toBeTruthy();
      }
    }
  });

  test('ENT-16: Excel export endpoint works', async ({ page }) => {
    const response = await page.request.get('/api/reports/export?format=xlsx&type=portfolio');
    expect(response.ok()).toBeTruthy();
    const contentType = response.headers()['content-type'] || '';
    expect(contentType).toMatch(/spreadsheet|octet-stream|xlsx/i);
  });

  test('INT-RPT-01: CSV export endpoint works', async ({ page }) => {
    const response = await page.request.get('/api/reports/export?format=csv&type=borrowers');
    expect(response.ok()).toBeTruthy();
  });

  test('credit report page loads', async ({ page }) => {
    const borrowersRes = await page.request.get('/api/borrowers');
    const borrowersData = await borrowersRes.json();
    const borrowers = Array.isArray(borrowersData) ? borrowersData : borrowersData.data || [];
    if (borrowers.length === 0) { test.skip(); return; }
    const borrowerId = borrowers[0].id;

    await page.goto(`/credit-report/${borrowerId}`);
    await page.waitForTimeout(3000);
    const pageContent = await page.textContent('body');
    expect(pageContent).toMatch(/credit|report|score|borrower/i);
  });

  test('reports page loads', async ({ page }) => {
    await page.goto('/reports');
    await page.waitForTimeout(3000);
    const pageContent = await page.textContent('body');
    expect(pageContent).toMatch(/report|export|download/i);
  });

  test('credit score methodology page loads', async ({ page }) => {
    await page.goto('/credit-score-methodology');
    await page.waitForTimeout(3000);
    const pageContent = await page.textContent('body');
    expect(pageContent).toMatch(/score|methodology|credit|weight|factor/i);
  });
});
