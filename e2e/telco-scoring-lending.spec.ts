import { test, expect } from '@playwright/test';
import { postWithCSRF } from './helpers/csrf';

interface TelcoProfile {
  id: string;
  msisdn: string;
  provider: string;
  country: string;
}

test.describe('Telco Scoring & Lending Module', () => {

  test('FR-TEL-01: telco profiles API returns array', async ({ page }) => {
    const response = await page.request.get('/api/telco/profiles');
    expect(response.ok()).toBeTruthy();
    const data = await response.json() as { data: TelcoProfile[] } | TelcoProfile[];
    const profiles = Array.isArray(data) ? data : (data as { data: TelcoProfile[] }).data || [];
    expect(Array.isArray(profiles)).toBeTruthy();
  });

  test('FR-TEL-01: telco profile creation succeeds', async ({ page }) => {
    const response = await postWithCSRF(page, '/api/telco/profiles', {
      msisdn: '+233' + Date.now().toString().slice(-9),
      provider: 'mtn',
      fullName: 'E2E Telco Test',
      nationalId: 'TELCO-E2E-' + Date.now(),
      kycLevel: 'full',
      country: 'Ghana'
    });
    expect([200, 201]).toContain(response.status());
    const data = await response.json() as TelcoProfile;
    expect(data).toHaveProperty('id');
    expect(data).toHaveProperty('msisdn');
  });

  test('FR-TEL-02: telco scores API returns data', async ({ page }) => {
    const response = await page.request.get('/api/telco/scores');
    expect(response.ok()).toBeTruthy();
  });

  test('FR-TEL-03: telco decision rules API returns array', async ({ page }) => {
    const response = await page.request.get('/api/telco/decision-rules');
    expect(response.ok()).toBeTruthy();
    const data = await response.json() as unknown[];
    expect(Array.isArray(data)).toBeTruthy();
  });

  test('FR-TEL-03: telco decision logs API returns data', async ({ page }) => {
    const response = await page.request.get('/api/telco/decision-logs');
    expect(response.ok()).toBeTruthy();
  });

  test('FR-TEL-04: telco loans API returns data', async ({ page }) => {
    const response = await page.request.get('/api/telco/loans');
    expect(response.ok()).toBeTruthy();
  });

  test('FR-TEL-04: telco loans portfolio API returns data', async ({ page }) => {
    const response = await page.request.get('/api/telco/loans/portfolio');
    expect(response.ok()).toBeTruthy();
  });

  test('ENT-13: telco analytics API returns data', async ({ page }) => {
    const response = await page.request.get('/api/telco/analytics');
    expect(response.ok()).toBeTruthy();
  });

  test('telco dashboard API returns data', async ({ page }) => {
    const response = await page.request.get('/api/telco/dashboard');
    expect(response.ok()).toBeTruthy();
  });

  test('telco operations dashboard API returns data', async ({ page }) => {
    const response = await page.request.get('/api/telco/operations-dashboard');
    expect(response.ok()).toBeTruthy();
  });

  test('telco consent summary API returns data', async ({ page }) => {
    const response = await page.request.get('/api/telco/consent-summary');
    expect(response.ok()).toBeTruthy();
  });

  test('telco scoring page renders scoring dashboard', async ({ page }) => {
    await page.goto('/telco-scoring');
    await page.waitForLoadState('domcontentloaded');
    const pageContent = await page.textContent('body');
    expect(pageContent).toMatch(/telco|scoring|mobile|profile/i);
  });

  test('telco lending page renders lending dashboard', async ({ page }) => {
    await page.goto('/telco-lending');
    await page.waitForLoadState('domcontentloaded');
    const pageContent = await page.textContent('body');
    expect(pageContent).toMatch(/lending|loan|telco|disburs/i);
  });

  test('FR-TEL-03: telco decision rule creation succeeds', async ({ page }) => {
    const response = await postWithCSRF(page, '/api/telco/decision-rules', {
      name: 'E2E Test Rule ' + Date.now(),
      description: 'Automated test rule',
      minScore: 500,
      maxScore: 850,
      action: 'approve',
      maxLoanAmount: 10000,
      interestRate: 15,
      tenureDays: 30,
      isActive: false
    });
    expect([200, 201]).toContain(response.status());
  });
});
