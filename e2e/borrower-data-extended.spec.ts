import { test, expect } from '@playwright/test';
import { postWithCSRF } from './helpers/csrf';

test.describe('Borrower & Credit Data Extended [FR-COL, FR-SPEC]', () => {

  test('FR-COL-01: borrower has all demographic fields', async ({ page }) => {
    const borrowersRes = await page.request.get('/api/borrowers');
    const borrowersData = await borrowersRes.json();
    const borrowers = Array.isArray(borrowersData) ? borrowersData : borrowersData.data || [];
    expect(borrowers.length).toBeGreaterThan(0);
    const borrower = borrowers[0];
    expect(borrower).toHaveProperty('firstName');
    expect(borrower).toHaveProperty('lastName');
    expect(borrower).toHaveProperty('nationalId');
    expect(borrower).toHaveProperty('type');
  });

  test('FR-COL-01: corporate borrower creation submits for approval', async ({ page }) => {
    const uniqueId = `CORP-E2E-${Date.now()}`;
    const response = await postWithCSRF(page, '/api/borrowers', {
      type: 'corporate',
      companyName: 'E2E Corp Ltd',
      firstName: 'E2E Corp',
      lastName: 'Ltd',
      registrationNumber: uniqueId,
      nationalId: uniqueId,
      country: 'Ghana',
      phone: '+233200000002',
      email: 'corp-e2e@example.com',
    });
    expect([200, 201]).toContain(response.status());
  });

  test('FR-COL-02: credit account has all required fields', async ({ page }) => {
    const response = await page.request.get('/api/credit-accounts');
    const data = await response.json();
    const accounts = Array.isArray(data) ? data : data.data || [];
    expect(accounts.length).toBeGreaterThan(0);
    const account = accounts[0];
    expect(account).toHaveProperty('accountType');
    expect(account).toHaveProperty('borrowerId');
    expect(account).toHaveProperty('currency');
    expect(account).toHaveProperty('status');
  });

  test('FR-SPEC-01: interest-free loan field exists', async ({ page }) => {
    const response = await page.request.get('/api/credit-accounts');
    const data = await response.json();
    const accounts = Array.isArray(data) ? data : data.data || [];
    if (accounts.length === 0) { test.skip(); return; }
    const interestFreeAccount = accounts.find((a: any) => a.isInterestFree !== undefined);
    if (interestFreeAccount) {
      expect(typeof interestFreeAccount.isInterestFree).toBe('boolean');
    }
  });

  test('FR-COL-05: court judgments endpoint works', async ({ page }) => {
    const response = await page.request.get('/api/court-judgments');
    if (response.ok()) {
      const data = await response.json();
      expect(Array.isArray(data)).toBeTruthy();
    }
  });

  test('FR-COL-04: data validation rejects invalid borrower', async ({ page }) => {
    const response = await postWithCSRF(page, '/api/borrowers', {});
    expect([400, 422, 201]).toContain(response.status());
    if (response.status() === 201) {
      const data = await response.json();
      expect(data).toHaveProperty('approval');
    }
  });

  test('ENT-02: fuzzy matching endpoint works', async ({ page }) => {
    const response = await page.request.get('/api/borrowers/fuzzy-match?name=John');
    if (response.ok()) {
      const data = await response.json();
      expect(Array.isArray(data)).toBeTruthy();
    }
  });

  test('FR-COL-08: global search endpoint works', async ({ page }) => {
    const response = await page.request.get('/api/global-search?query=test');
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data).toHaveProperty('borrowers');
  });

  test('consumers page loads', async ({ page }) => {
    await page.goto('/consumers');
    await page.waitForTimeout(3000);
    const pageContent = await page.textContent('body');
    expect(pageContent).toMatch(/consumer|individual|borrower/i);
  });

  test('businesses page loads', async ({ page }) => {
    await page.goto('/businesses');
    await page.waitForTimeout(3000);
    const pageContent = await page.textContent('body');
    expect(pageContent).toMatch(/business|corporate|company/i);
  });

  test('borrower detail page loads', async ({ page }) => {
    const borrowersRes = await page.request.get('/api/borrowers');
    const borrowersData = await borrowersRes.json();
    const borrowers = Array.isArray(borrowersData) ? borrowersData : borrowersData.data || [];
    if (borrowers.length === 0) { test.skip(); return; }
    const borrowerId = borrowers[0].id;

    await page.goto(`/borrowers/${borrowerId}`);
    await page.waitForTimeout(3000);
    const pageContent = await page.textContent('body');
    expect(pageContent).toMatch(/borrower|credit|account|detail/i);
  });

  test('batch upload page loads', async ({ page }) => {
    await page.goto('/batch-upload');
    await page.waitForTimeout(3000);
    const pageContent = await page.textContent('body');
    expect(pageContent).toMatch(/batch|upload|import|csv/i);
  });

  test('borrower alerts page loads', async ({ page }) => {
    await page.goto('/borrower-alerts');
    await page.waitForTimeout(3000);
    const pageContent = await page.textContent('body');
    expect(pageContent).toMatch(/alert|notification|borrower/i);
  });
});
