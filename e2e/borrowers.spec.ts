import { test, expect } from '@playwright/test';
import { postWithCSRF } from './helpers/csrf';

interface Borrower {
  id: string;
  firstName: string;
  lastName: string;
  nationalId: string;
  type: string;
  country: string;
}

interface BorrowerListResponse {
  data: Borrower[];
  total: number;
}

interface ApprovalRecord {
  id: string;
  entityType: string;
  action: string;
  status: string;
}

test.describe('Borrower Management', () => {
  test('borrowers list API returns data with required fields', async ({ page }) => {
    const response = await page.request.get('/api/borrowers');
    expect(response.ok()).toBeTruthy();
    const body = await response.json() as BorrowerListResponse;
    const borrowers = body.data;
    expect(borrowers.length).toBeGreaterThan(0);
    expect(borrowers[0]).toHaveProperty('id');
    expect(borrowers[0]).toHaveProperty('firstName');
    expect(borrowers[0]).toHaveProperty('lastName');
    expect(borrowers[0]).toHaveProperty('nationalId');
    expect(borrowers[0]).toHaveProperty('type');
  });

  test('borrower detail API returns correct data', async ({ page }) => {
    const listResponse = await page.request.get('/api/borrowers');
    const listBody = await listResponse.json() as BorrowerListResponse;
    const borrowerId = listBody.data[0]?.id;
    expect(borrowerId).toBeTruthy();

    const detailResponse = await page.request.get(`/api/borrowers/${borrowerId}`);
    expect(detailResponse.ok()).toBeTruthy();
    const detail = await detailResponse.json() as Borrower;
    expect(detail.id).toBe(borrowerId);
    expect(detail).toHaveProperty('firstName');
    expect(detail).toHaveProperty('nationalId');
  });

  test('borrower search returns results', async ({ page }) => {
    const response = await page.request.get('/api/borrowers?search=a');
    expect(response.ok()).toBeTruthy();
  });

  test('borrower creation submits for maker-checker approval', async ({ page }) => {
    const uniqueId = `E2E-TEST-${Date.now()}`;
    const response = await postWithCSRF(page, '/api/borrowers', {
      type: 'individual',
      firstName: 'E2E Test',
      lastName: 'Borrower',
      nationalId: uniqueId,
      country: 'Ghana',
      phone: '+233200000000',
      email: 'e2e-test@example.com',
      gender: 'male',
      dateOfBirth: '1990-01-01',
    });
    expect(response.status()).toBe(201);
    const data = await response.json() as { approval: ApprovalRecord; message: string };
    expect(data.message).toContain('approval');
    expect(data.approval.entityType).toBe('borrower');
    expect(data.approval.action).toBe('CREATE');
    expect(data.approval.status).toBe('pending');
    expect(data.approval.id).toBeTruthy();
  });

  test('borrowers page renders borrower table', async ({ page }) => {
    await page.goto('/borrowers');
    await page.waitForLoadState('domcontentloaded');
    const pageContent = await page.textContent('body');
    expect(pageContent).toMatch(/borrower|name|account/i);
  });
});
