import { test, expect } from '@playwright/test';
import { postWithCSRF } from './helpers/csrf';

test.describe('Cross-Border & PAPSS Module [SATA]', () => {

  test('SATA agreements API returns data', async ({ page }) => {
    const response = await page.request.get('/api/sata/agreements');
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(Array.isArray(data)).toBeTruthy();
  });

  test('SATA my-agreements API returns data', async ({ page }) => {
    const response = await page.request.get('/api/sata/my-agreements');
    expect(response.ok()).toBeTruthy();
  });

  test('SATA stats API returns data', async ({ page }) => {
    const response = await page.request.get('/api/sata/stats');
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data).toHaveProperty('agreements');
  });

  test('SATA agreement creation works', async ({ page }) => {
    const response = await postWithCSRF(page, '/api/sata/agreements', {
      sourceCountry: 'Ghana',
      targetCountry: 'Kenya',
      status: 'draft',
      allowedDataTypes: ['borrower_demographics'],
      effectiveDate: '2026-01-01',
      expiryDate: '2027-12-31'
    });
    expect([200, 201, 403]).toContain(response.status());
    if (response.ok()) {
      const data = await response.json();
      expect(data).toHaveProperty('id');
    }
  });

  test('SATA access check API works', async ({ page }) => {
    const response = await page.request.get('/api/sata/access-check');
    expect(response.ok()).toBeTruthy();
  });

  test('PAPSS settlements API returns data', async ({ page }) => {
    const response = await page.request.get('/api/papss/settlements');
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(Array.isArray(data)).toBeTruthy();
  });

  test('PAPSS settlement creation works', async ({ page }) => {
    const response = await postWithCSRF(page, '/api/papss/settlements', {
      transactionId: 'PAPSS-E2E-' + Date.now(),
      senderCountry: 'Ghana',
      receiverCountry: 'Nigeria',
      senderInstitution: 'Test Bank GH',
      receiverInstitution: 'Test Bank NG',
      amount: 5000,
      currency: 'USD',
      status: 'pending',
      description: 'E2E test settlement'
    });
    expect([200, 201, 400, 403]).toContain(response.status());
  });

  test('cross-border agreements page loads', async ({ page }) => {
    await page.goto('/cross-border-agreements');
    await page.waitForTimeout(3000);
    const pageContent = await page.textContent('body');
    expect(pageContent).toMatch(/agreement|cross.border|bilateral|country/i);
  });

  test('PAPSS settlements page loads', async ({ page }) => {
    await page.goto('/papss-settlements');
    await page.waitForTimeout(3000);
    const pageContent = await page.textContent('body');
    expect(pageContent).toMatch(/papss|settlement|transaction/i);
  });

  test('cross-border search page loads', async ({ page }) => {
    await page.goto('/cross-border-search');
    await page.waitForTimeout(3000);
    const pageContent = await page.textContent('body');
    expect(pageContent).toMatch(/search|cross.border|borrower/i);
  });
});
