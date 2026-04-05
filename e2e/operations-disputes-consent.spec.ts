import { test, expect } from '@playwright/test';
import { postWithCSRF, patchWithCSRF } from './helpers/csrf';

interface DisputeRecord {
  id: string;
  borrowerId: string;
  creditAccountId: string;
  status: string;
  correctionType: string | null;
  slaDeadline: string | null;
  createdAt: string;
}

interface ConsentRecord {
  id: string;
  borrowerId: string;
  receiptNumber: string;
  status: string;
  grantedAt: string;
}

interface ApprovalItem {
  id: string;
  entityType: string;
  action: string;
  status: string;
  requestedBy: string;
}

interface BorrowerListResponse {
  data: Array<{ id: string }>;
}

test.describe('Operations: Disputes, Consent, Helpdesk [FR-CON, DQ-04, DQ-05]', () => {

  test('FR-CON-04: disputes list has correct record shape', async ({ page }) => {
    const response = await page.request.get('/api/disputes');
    expect(response.ok()).toBeTruthy();
    const disputes = await response.json() as DisputeRecord[];
    expect(Array.isArray(disputes)).toBeTruthy();
    if (disputes.length > 0) {
      expect(disputes[0]).toHaveProperty('id');
      expect(disputes[0]).toHaveProperty('status');
      expect(disputes[0]).toHaveProperty('borrowerId');
      expect(disputes[0]).toHaveProperty('creditAccountId');
    }
  });

  test('FR-CON-05: dispute with SLA deadline validates date', async ({ page }) => {
    const response = await page.request.get('/api/disputes');
    const disputes = await response.json() as DisputeRecord[];
    if (disputes.length === 0) { test.skip(); return; }
    const disputeWithSla = disputes.find((d) => d.slaDeadline !== null);
    if (disputeWithSla) {
      const slaDate = new Date(disputeWithSla.slaDeadline!);
      expect(slaDate.getTime()).toBeGreaterThan(0);
    }
  });

  test('DQ-05: non-financial dispute gets 5-day SLA deadline', async ({ page }) => {
    const borrowersRes = await page.request.get('/api/borrowers');
    const borrowersBody = await borrowersRes.json() as BorrowerListResponse;
    if (borrowersBody.data.length === 0) { test.skip(); return; }
    const borrowerId = borrowersBody.data[0].id;

    const accountsRes = await page.request.get('/api/credit-accounts');
    const accountsRaw = await accountsRes.json() as Array<{ id: string; borrowerId: string }>;
    const accounts = Array.isArray(accountsRaw) ? accountsRaw : [];
    const account = accounts.find((a) => a.borrowerId === borrowerId) || accounts[0];
    if (!account) { test.skip(); return; }

    const disputeRes = await postWithCSRF(page, '/api/disputes', {
      borrowerId,
      creditAccountId: account.id,
      correctionType: 'data_correction',
      description: 'E2E non-financial dispute ' + Date.now(),
      disputeType: 'incorrect_data',
      status: 'open'
    });
    expect(disputeRes.status()).toBe(201);
    const dispute = await disputeRes.json() as DisputeRecord;
    expect(dispute).toHaveProperty('id');
    expect(dispute.status).toBe('open');
    expect(dispute.slaDeadline).toBeTruthy();
    const sla = new Date(dispute.slaDeadline!);
    const created = new Date(dispute.createdAt);
    const daysDiff = (sla.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
    expect(Math.round(daysDiff)).toBe(5);
  });

  test('DQ-04: financial dispute gets 2-day SLA deadline', async ({ page }) => {
    const borrowersRes = await page.request.get('/api/borrowers');
    const borrowersBody = await borrowersRes.json() as BorrowerListResponse;
    if (borrowersBody.data.length === 0) { test.skip(); return; }
    const borrowerId = borrowersBody.data[0].id;

    const accountsRes = await page.request.get('/api/credit-accounts');
    const accountsRaw = await accountsRes.json() as Array<{ id: string; borrowerId: string }>;
    const accounts = Array.isArray(accountsRaw) ? accountsRaw : [];
    const account = accounts.find((a) => a.borrowerId === borrowerId) || accounts[0];
    if (!account) { test.skip(); return; }

    const disputeRes = await postWithCSRF(page, '/api/disputes', {
      borrowerId,
      creditAccountId: account.id,
      correctionType: 'financial',
      description: 'E2E financial dispute ' + Date.now(),
      disputeType: 'incorrect_balance',
      status: 'open'
    });
    expect(disputeRes.status()).toBe(201);
    const dispute = await disputeRes.json() as DisputeRecord;
    expect(dispute.slaDeadline).toBeTruthy();
    const sla = new Date(dispute.slaDeadline!);
    const created = new Date(dispute.createdAt);
    const daysDiff = (sla.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
    expect(Math.round(daysDiff)).toBe(2);
  });

  test('FR-CON-01: consent records returns array with receipt numbers', async ({ page }) => {
    const response = await page.request.get('/api/consent-records');
    expect(response.ok()).toBeTruthy();
    const records = await response.json() as ConsentRecord[];
    expect(Array.isArray(records)).toBeTruthy();
    if (records.length > 0) {
      expect(records[0]).toHaveProperty('receiptNumber');
      expect(records[0]).toHaveProperty('borrowerId');
      expect(records[0]).toHaveProperty('status');
    }
  });

  test('FR-CON-06: consent records have non-empty receipt numbers', async ({ page }) => {
    const response = await page.request.get('/api/consent-records');
    expect(response.ok()).toBeTruthy();
    const records = await response.json() as ConsentRecord[];
    if (records.length > 0) {
      const withReceipt = records.find((r) => r.receiptNumber);
      if (withReceipt) {
        expect(typeof withReceipt.receiptNumber).toBe('string');
        expect(withReceipt.receiptNumber.length).toBeGreaterThan(0);
      }
    }
  });

  test('FR-CON-02: helpdesk page renders service desk UI', async ({ page }) => {
    await page.goto('/helpdesk');
    await page.waitForLoadState('domcontentloaded');
    const pageContent = await page.textContent('body');
    expect(pageContent).toMatch(/helpdesk|service|inquiry|dispute|ticket/i);
  });

  test('FR-REG-03: pending approvals returns maker-checker items', async ({ page }) => {
    const response = await page.request.get('/api/pending-approvals');
    expect(response.ok()).toBeTruthy();
    const approvals = await response.json() as ApprovalItem[];
    expect(Array.isArray(approvals)).toBeTruthy();
    expect(approvals.length).toBeGreaterThan(0);
    expect(approvals[0]).toHaveProperty('entityType');
    expect(approvals[0]).toHaveProperty('action');
    expect(approvals[0]).toHaveProperty('requestedBy');
    expect(approvals[0].status).toBe('pending');
  });

  test('FR-REG-03: maker cannot approve own request (self-approval prevention)', async ({ page }) => {
    const response = await page.request.get('/api/pending-approvals');
    expect(response.ok()).toBeTruthy();
    const approvals = await response.json() as ApprovalItem[];
    const pendingByCurrentUser = approvals.find((a) => a.status === 'pending' && a.requestedBy);
    if (!pendingByCurrentUser) { test.skip(); return; }

    const approveRes = await patchWithCSRF(page, `/api/pending-approvals/${pendingByCurrentUser.id}`, {
      status: 'approved',
      reviewNotes: 'Self-approval attempt'
    });
    expect(approveRes.status()).toBe(403);
    const body = await approveRes.json() as { message: string };
    expect(body.message).toContain('Maker cannot be the Checker');
  });

  test('disputes page renders dispute table', async ({ page }) => {
    await page.goto('/disputes');
    await page.waitForLoadState('domcontentloaded');
    const pageContent = await page.textContent('body');
    expect(pageContent).toMatch(/dispute|correction|status/i);
  });

  test('consent page renders consent records', async ({ page }) => {
    await page.goto('/consent');
    await page.waitForLoadState('domcontentloaded');
    const pageContent = await page.textContent('body');
    expect(pageContent).toMatch(/consent|authorization|grant/i);
  });

  test('approvals page renders pending approvals', async ({ page }) => {
    await page.goto('/approvals');
    await page.waitForLoadState('domcontentloaded');
    const pageContent = await page.textContent('body');
    expect(pageContent).toMatch(/approval|pending|review/i);
  });

  test('helpdesk page renders', async ({ page }) => {
    await page.goto('/helpdesk');
    await page.waitForLoadState('domcontentloaded');
    const pageContent = await page.textContent('body');
    expect(pageContent).toMatch(/helpdesk|inquiry|service|ticket|dispute/i);
  });
});
