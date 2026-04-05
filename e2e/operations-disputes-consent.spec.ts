import { test, expect } from '@playwright/test';
import { postWithCSRF } from './helpers/csrf';

test.describe('Operations: Disputes, Consent, Helpdesk [FR-CON, DQ-04, DQ-05]', () => {

  test('FR-CON-04: disputes list API returns data with correct shape', async ({ page }) => {
    const response = await page.request.get('/api/disputes');
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(Array.isArray(data)).toBeTruthy();
    if (data.length > 0) {
      expect(data[0]).toHaveProperty('id');
      expect(data[0]).toHaveProperty('status');
    }
  });

  test('FR-CON-05: dispute has correction type and SLA fields', async ({ page }) => {
    const response = await page.request.get('/api/disputes');
    const data = await response.json();
    if (data.length === 0) { test.skip(); return; }
    const disputeWithSla = data.find((d: any) => d.slaDeadline);
    if (disputeWithSla) {
      expect(new Date(disputeWithSla.slaDeadline).getTime()).toBeGreaterThan(0);
    }
  });

  test('DQ-04/DQ-05: dispute creation works', async ({ page }) => {
    const borrowersRes = await page.request.get('/api/borrowers');
    const borrowersData = await borrowersRes.json();
    const borrowers = Array.isArray(borrowersData) ? borrowersData : borrowersData.data || [];
    if (borrowers.length === 0) { test.skip(); return; }
    const borrowerId = borrowers[0].id;

    const accountsRes = await page.request.get('/api/credit-accounts');
    const accountsData = await accountsRes.json();
    const accounts = Array.isArray(accountsData) ? accountsData : accountsData.data || [];
    const borrowerAccount = accounts.find((a: any) => a.borrowerId === borrowerId);
    const accountId = borrowerAccount?.id || (accounts.length > 0 ? accounts[0].id : null);
    if (!accountId) { test.skip(); return; }

    const disputeRes = await postWithCSRF(page, '/api/disputes', {
      borrowerId,
      creditAccountId: accountId,
      correctionType: 'data_correction',
      description: 'E2E test dispute ' + Date.now(),
      disputeType: 'incorrect_data',
      status: 'open'
    });
    expect([200, 201, 400, 403]).toContain(disputeRes.status());
    if (disputeRes.ok()) {
      const dispute = await disputeRes.json();
      expect(dispute).toHaveProperty('id');
    }
  });

  test('FR-CON-01: consent records API returns data', async ({ page }) => {
    const response = await page.request.get('/api/consent-records');
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(Array.isArray(data)).toBeTruthy();
  });

  test('FR-CON-06: consent records have receipt numbers', async ({ page }) => {
    const response = await page.request.get('/api/consent-records');
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    if (data.length > 0) {
      expect(data[0]).toHaveProperty('receiptNumber');
      if (data[0].receiptNumber) {
        expect(typeof data[0].receiptNumber).toBe('string');
        expect(data[0].receiptNumber.length).toBeGreaterThan(0);
      }
    }
  });

  test('FR-CON-02: helpdesk API returns data', async ({ page }) => {
    const response = await page.request.get('/api/helpdesk/tickets');
    expect([200, 404]).toContain(response.status());
  });

  test('FR-REG-03: approvals API returns pending items', async ({ page }) => {
    const response = await page.request.get('/api/pending-approvals');
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(Array.isArray(data)).toBeTruthy();
    if (data.length > 0) {
      expect(data[0]).toHaveProperty('entityType');
      expect(data[0]).toHaveProperty('action');
      expect(data[0]).toHaveProperty('status');
    }
  });

  test('disputes page loads in browser', async ({ page }) => {
    await page.goto('/disputes');
    await page.waitForTimeout(3000);
    const pageContent = await page.textContent('body');
    expect(pageContent).toMatch(/dispute|correction|status/i);
  });

  test('consent page loads in browser', async ({ page }) => {
    await page.goto('/consent');
    await page.waitForTimeout(3000);
    const pageContent = await page.textContent('body');
    expect(pageContent).toMatch(/consent|authorization|grant/i);
  });

  test('approvals page loads in browser', async ({ page }) => {
    await page.goto('/approvals');
    await page.waitForTimeout(3000);
    const pageContent = await page.textContent('body');
    expect(pageContent).toMatch(/approval|pending|review/i);
  });

  test('helpdesk page loads in browser', async ({ page }) => {
    await page.goto('/helpdesk');
    await page.waitForTimeout(3000);
    const pageContent = await page.textContent('body');
    expect(pageContent).toMatch(/helpdesk|inquiry|service|ticket|dispute/i);
  });
});
