import { test, expect } from '@playwright/test';
import { postWithCSRF } from './helpers/csrf';

interface SATAAgreement {
  id: string;
  sourceCountry: string;
  targetCountry: string;
  status: string;
}

interface SATAStats {
  agreements: {
    total: number;
    active: number;
  };
}

interface PAPSSSettlement {
  id: string;
  transactionId: string;
  status: string;
}

test.describe('Cross-Border & PAPSS [SATA, PAPSS]', () => {

  test('SATA-01: agreements API returns array', async ({ page }) => {
    const response = await page.request.get('/api/sata/agreements');
    expect(response.ok()).toBeTruthy();
    const data = await response.json() as SATAAgreement[];
    expect(Array.isArray(data)).toBeTruthy();
  });

  test('SATA my-agreements returns data', async ({ page }) => {
    const response = await page.request.get('/api/sata/my-agreements');
    expect(response.ok()).toBeTruthy();
  });

  test('SATA-02: stats API returns agreement counts', async ({ page }) => {
    const response = await page.request.get('/api/sata/stats');
    expect(response.ok()).toBeTruthy();
    const data = await response.json() as SATAStats;
    expect(data).toHaveProperty('agreements');
    expect(data.agreements).toHaveProperty('total');
    expect(typeof data.agreements.total).toBe('number');
  });

  test('SATA-03: agreement creation returns new record', async ({ page }) => {
    const response = await postWithCSRF(page, '/api/sata/agreements', {
      sourceCountry: 'Ghana',
      targetCountry: 'Kenya',
      status: 'draft',
      allowedDataTypes: ['borrower_demographics'],
      effectiveDate: '2026-01-01',
      expiryDate: '2027-12-31'
    });
    expect([200, 201]).toContain(response.status());
    const data = await response.json() as SATAAgreement;
    expect(data).toHaveProperty('id');
    expect(data.sourceCountry).toBe('Ghana');
  });

  test('SATA access check API works', async ({ page }) => {
    const response = await page.request.get('/api/sata/access-check');
    expect(response.ok()).toBeTruthy();
  });

  test('PAPSS-01: settlements API returns array', async ({ page }) => {
    const response = await page.request.get('/api/papss/settlements');
    expect(response.ok()).toBeTruthy();
    const data = await response.json() as PAPSSSettlement[];
    expect(Array.isArray(data)).toBeTruthy();
  });

  test('PAPSS-02: settlement creation returns record', async ({ page }) => {
    const response = await postWithCSRF(page, '/api/papss/settlements', {
      transactionId: 'PAPSS-E2E-' + Date.now(),
      senderCountry: 'Ghana',
      receiverCountry: 'Nigeria',
      senderInstitution: 'Test Bank GH',
      receiverInstitution: 'Test Bank NG',
      senderAmount: '5000',
      senderCurrency: 'GHS',
      receiverAmount: '4800',
      receiverCurrency: 'NGN',
      exchangeRate: '1.04',
      iso20022Reference: 'ISO-E2E-' + Date.now(),
      status: 'pending',
      description: 'E2E test settlement'
    });
    expect([200, 201]).toContain(response.status());
  });

  test('cross-border agreements page loads', async ({ page }) => {
    await page.goto('/cross-border-agreements');
    await page.waitForLoadState('domcontentloaded');
    const pageContent = await page.textContent('body');
    expect(pageContent).toMatch(/agreement|cross.border|bilateral|country/i);
  });

  test('PAPSS settlements page loads', async ({ page }) => {
    await page.goto('/papss-settlements');
    await page.waitForLoadState('domcontentloaded');
    const pageContent = await page.textContent('body');
    expect(pageContent).toMatch(/papss|settlement|transaction/i);
  });

  test('cross-border search page loads', async ({ page }) => {
    await page.goto('/cross-border-search');
    await page.waitForLoadState('domcontentloaded');
    const pageContent = await page.textContent('body');
    expect(pageContent).toMatch(/search|cross.border|borrower/i);
  });
});
