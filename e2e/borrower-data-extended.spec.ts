import { test, expect } from '@playwright/test';
import { postWithCSRF } from './helpers/csrf';

interface BorrowerListResponse {
  data: Array<Record<string, unknown>>;
  total: number;
}

interface CreditAccountListResponse {
  data: Array<Record<string, unknown>>;
}

test.describe('Borrower & Credit Data Extended [FR-COL, FR-SPEC]', () => {

  test('FR-COL-01: borrower has all demographic fields', async ({ page }) => {
    const res = await page.request.get('/api/borrowers');
    const body = await res.json() as BorrowerListResponse;
    expect(body.data.length).toBeGreaterThan(0);
    const borrower = body.data[0];
    expect(borrower).toHaveProperty('firstName');
    expect(borrower).toHaveProperty('lastName');
    expect(borrower).toHaveProperty('nationalId');
    expect(borrower).toHaveProperty('type');
  });

  test('FR-COL-01: corporate borrower creation via maker-checker', async ({ page }) => {
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
    expect(response.status()).toBe(201);
    const data = await response.json() as Record<string, unknown>;
    expect(data).toHaveProperty('approval');
    expect(data).toHaveProperty('message');
  });

  test('FR-COL-02: credit account has all required fields', async ({ page }) => {
    const response = await page.request.get('/api/credit-accounts');
    const body = await response.json() as Record<string, unknown>[] | CreditAccountListResponse;
    const accounts = Array.isArray(body) ? body : body.data;
    expect(accounts.length).toBeGreaterThan(0);
    const account = accounts[0];
    expect(account).toHaveProperty('accountType');
    expect(account).toHaveProperty('borrowerId');
    expect(account).toHaveProperty('currency');
    expect(account).toHaveProperty('status');
  });

  test('FR-SPEC-01: interest-free loan field exists in schema', async ({ page }) => {
    const response = await page.request.get('/api/credit-accounts');
    const body = await response.json() as Record<string, unknown>[] | CreditAccountListResponse;
    const accounts = Array.isArray(body) ? body : body.data;
    if (accounts.length === 0) { test.skip(); return; }
    const account = accounts[0];
    expect(account).toHaveProperty('isInterestFree');
  });

  test('FR-COL-05: court judgments endpoint returns array', async ({ page }) => {
    const response = await page.request.get('/api/court-judgments');
    expect(response.ok()).toBeTruthy();
    const data = await response.json() as unknown[];
    expect(Array.isArray(data)).toBeTruthy();
  });

  test('FR-COL-04: data validation rejects invalid borrower data', async ({ page }) => {
    const response = await postWithCSRF(page, '/api/borrowers', {
      type: 'individual',
      firstName: '',
      lastName: '',
    });
    expect(response.ok()).toBeFalsy();
  });

  test('ENT-02: fuzzy matching endpoint returns array', async ({ page }) => {
    const response = await page.request.get('/api/borrowers/fuzzy-match?name=John');
    expect(response.ok()).toBeTruthy();
    const data = await response.json() as unknown[];
    expect(Array.isArray(data)).toBeTruthy();
  });

  test('FR-COL-08: global search returns borrowers', async ({ page }) => {
    const response = await page.request.get('/api/global-search?query=test');
    expect(response.ok()).toBeTruthy();
    const data = await response.json() as Record<string, unknown>;
    expect(data).toHaveProperty('borrowers');
  });

  test('consumers page renders consumer list', async ({ page }) => {
    await page.goto('/consumers');
    await page.waitForLoadState('domcontentloaded');
    const pageContent = await page.textContent('body');
    expect(pageContent).toMatch(/consumer|individual|borrower/i);
  });

  test('businesses page renders company list', async ({ page }) => {
    await page.goto('/businesses');
    await page.waitForLoadState('domcontentloaded');
    const pageContent = await page.textContent('body');
    expect(pageContent).toMatch(/business|corporate|company/i);
  });

  test('borrower detail page shows borrower data', async ({ page }) => {
    const res = await page.request.get('/api/borrowers');
    const body = await res.json() as BorrowerListResponse;
    if (body.data.length === 0) { test.skip(); return; }
    const borrowerId = body.data[0].id;

    await page.goto(`/borrowers/${borrowerId}`);
    await page.waitForLoadState('domcontentloaded');
    const pageContent = await page.textContent('body');
    expect(pageContent).toMatch(/borrower|credit|account|detail/i);
  });

  test('batch upload page renders upload form', async ({ page }) => {
    await page.goto('/batch-upload');
    await page.waitForLoadState('domcontentloaded');
    const pageContent = await page.textContent('body');
    expect(pageContent).toMatch(/batch|upload|import|csv/i);
  });

  test('borrower alerts page renders alerts', async ({ page }) => {
    await page.goto('/borrower-alerts');
    await page.waitForLoadState('domcontentloaded');
    const pageContent = await page.textContent('body');
    expect(pageContent).toMatch(/alert|notification|borrower/i);
  });
});
