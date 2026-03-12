import { test, expect } from '@playwright/test';

test.describe('Borrower Management', () => {
  test('borrowers list API returns data', async ({ page }) => {
    const response = await page.request.get('/api/borrowers');
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    const borrowers = Array.isArray(data) ? data : data.data || data.borrowers || [];
    expect(borrowers.length).toBeGreaterThan(0);
    expect(borrowers[0]).toHaveProperty('id');
    expect(borrowers[0]).toHaveProperty('firstName');
    expect(borrowers[0]).toHaveProperty('lastName');
  });

  test('borrower detail API returns correct data', async ({ page }) => {
    const listResponse = await page.request.get('/api/borrowers');
    const listData = await listResponse.json();
    const borrowers = Array.isArray(listData) ? listData : listData.data || listData.borrowers || [];
    const borrowerId = borrowers[0]?.id;
    expect(borrowerId).toBeTruthy();

    const detailResponse = await page.request.get(`/api/borrowers/${borrowerId}`);
    expect(detailResponse.ok()).toBeTruthy();
    const detail = await detailResponse.json();
    expect(detail.id).toBe(borrowerId);
    expect(detail).toHaveProperty('firstName');
    expect(detail).toHaveProperty('nationalId');
  });

  test('borrower search returns results', async ({ page }) => {
    const response = await page.request.get('/api/borrowers?search=a');
    expect(response.ok()).toBeTruthy();
  });

  test('borrower creation submits for approval', async ({ page }) => {
    const uniqueId = `E2E-TEST-${Date.now()}`;
    const response = await page.request.post('/api/borrowers', {
      data: {
        type: 'individual',
        firstName: 'E2E Test',
        lastName: 'Borrower',
        nationalId: uniqueId,
        country: 'Ghana',
        phone: '+233200000000',
        email: 'e2e-test@example.com',
        gender: 'male',
        dateOfBirth: '1990-01-01',
      },
    });
    expect(response.status()).toBe(201);
    const data = await response.json();
    expect(data).toHaveProperty('approval');
    expect(data).toHaveProperty('message');
    expect(data.message).toContain('approval');
    expect(data.approval).toHaveProperty('id');
    expect(data.approval.entityType).toBe('borrower');
    expect(data.approval.action).toBe('CREATE');
  });

  test('borrowers page loads in browser', async ({ page }) => {
    await page.goto('/borrowers');
    await page.waitForTimeout(3000);
    const pageContent = await page.textContent('body');
    expect(pageContent).toMatch(/borrower|name|account/i);
  });
});
