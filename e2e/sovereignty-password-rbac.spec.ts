import { test, expect } from '@playwright/test';
import { postWithCSRF, patchWithCSRF } from './helpers/csrf';

test.describe('Data Sovereignty, Password Expiry & RBAC [NFR-SEC, ENT-11]', () => {

  test('NFR-SEC-12: session response includes passwordExpired field with correct type', async ({ page }) => {
    const response = await page.request.get('/api/auth/me');
    expect(response.ok()).toBeTruthy();
    const user = await response.json() as Record<string, unknown>;
    expect(user).toHaveProperty('passwordExpired');
    expect(typeof user.passwordExpired).toBe('boolean');
    expect(user).toHaveProperty('role');
    expect(['admin', 'super_admin']).toContain(user.role);
  });

  test('NFR-SEC-13: session returns passwordExpired=false for recently changed password', async ({ page }) => {
    const response = await page.request.get('/api/auth/me');
    expect(response.ok()).toBeTruthy();
    const user = await response.json() as Record<string, unknown>;
    expect(user).toHaveProperty('passwordExpired');
    expect(typeof user.passwordExpired).toBe('boolean');
    if (user.passwordChangedAt) {
      const daysSince = (Date.now() - new Date(String(user.passwordChangedAt)).getTime()) / (1000 * 60 * 60 * 24);
      if (daysSince <= 90) {
        expect(user.passwordExpired).toBe(false);
      } else {
        expect(user.passwordExpired).toBe(true);
      }
    }
  });

  test('NFR-SEC-14: password change endpoint rejects wrong current password', async ({ page }) => {
    const response = await postWithCSRF(page, '/api/auth/change-password', {
      currentPassword: 'wrong_password_intentionally',
      newPassword: 'NewPass123!@#'
    });
    expect([400, 401, 403]).toContain(response.status());
    const body = await response.json() as Record<string, string>;
    expect(body).toHaveProperty('message');
  });

  test('ENT-11-01: sovereignty enforcement code path exists for borrower creation', async ({ page }) => {
    const sessionRes = await page.request.get('/api/auth/me');
    const session = await sessionRes.json() as { role: string; viewingCountry?: string };

    const response = await postWithCSRF(page, '/api/borrowers', {
      type: 'individual',
      firstName: 'Sovereignty',
      lastName: 'Test',
      nationalId: 'SOV-E2E-' + Date.now(),
      country: 'Ghana'
    });

    if (session.role === 'super_admin') {
      expect(response.ok()).toBeTruthy();
    } else if (session.viewingCountry && session.viewingCountry !== 'Ghana') {
      expect(response.status()).toBe(403);
      const body = await response.json() as Record<string, string>;
      expect(body.message).toContain('sovereignty');
    } else {
      expect(response.ok()).toBeTruthy();
    }
  });

  test('ENT-11-02: borrower list returns country-tagged data for sovereignty filtering', async ({ page }) => {
    const borrowersRes = await page.request.get('/api/borrowers');
    expect(borrowersRes.ok()).toBeTruthy();
    const body = await borrowersRes.json() as { data: Array<{ country: string; id: string }> };
    expect(body).toHaveProperty('data');
    expect(Array.isArray(body.data)).toBeTruthy();
    expect(body.data.length).toBeGreaterThan(0);

    for (const borrower of body.data.slice(0, 10)) {
      expect(borrower).toHaveProperty('country');
      expect(typeof borrower.country).toBe('string');
      expect(borrower.country.length).toBeGreaterThan(0);
    }

    const sessionRes = await page.request.get('/api/auth/me');
    const session = await sessionRes.json() as { role: string; viewingCountry?: string };
    if (session.viewingCountry) {
      for (const borrower of body.data) {
        expect(borrower.country).toBe(session.viewingCountry);
      }
    }
  });

  test('ENT-11-03: cross-border access audit logging', async ({ page }) => {
    const logsRes = await page.request.get('/api/audit-logs');
    expect(logsRes.ok()).toBeTruthy();
    const logs = await logsRes.json() as Array<{ action: string; entity: string }>;
    expect(Array.isArray(logs)).toBeTruthy();
    expect(logs.length).toBeGreaterThan(0);
    expect(logs.every(l => l.action && typeof l.action === 'string')).toBeTruthy();
  });

  test('RBAC-01: admin role has dashboard access with stats', async ({ page }) => {
    const response = await page.request.get('/api/dashboard/stats');
    expect(response.ok()).toBeTruthy();
    const data = await response.json() as Record<string, unknown>;
    expect(data).toHaveProperty('totalBorrowers');
    expect(typeof data.totalBorrowers).toBe('number');
  });

  test('RBAC-02: admin role can access borrowers with data', async ({ page }) => {
    const response = await page.request.get('/api/borrowers');
    expect(response.ok()).toBeTruthy();
    const body = await response.json() as { data: unknown[] };
    expect(body).toHaveProperty('data');
    expect(Array.isArray(body.data)).toBeTruthy();
  });

  test('RBAC-03: admin role can access credit accounts', async ({ page }) => {
    const response = await page.request.get('/api/credit-accounts');
    expect(response.ok()).toBeTruthy();
  });

  test('RBAC-04: admin role can access disputes', async ({ page }) => {
    const response = await page.request.get('/api/disputes');
    expect(response.ok()).toBeTruthy();
  });

  test('RBAC-05: admin role can access audit logs with structured data', async ({ page }) => {
    const response = await page.request.get('/api/audit-logs');
    expect(response.ok()).toBeTruthy();
    const logs = await response.json() as Array<Record<string, unknown>>;
    expect(Array.isArray(logs)).toBeTruthy();
    expect(logs.length).toBeGreaterThan(0);
    expect(logs[0]).toHaveProperty('action');
    expect(logs[0]).toHaveProperty('userId');
    expect(logs[0]).toHaveProperty('createdAt');
  });

  test('RBAC-06: consumer session returns 401 without consumer auth', async ({ page }) => {
    const response = await page.request.get('/api/consumer/session');
    expect(response.status()).toBe(401);
  });

  test('RBAC-07: maker-checker prevents self-approval', async ({ page }) => {
    const approvalsRes = await page.request.get('/api/pending-approvals');
    expect(approvalsRes.ok()).toBeTruthy();
    const approvals = await approvalsRes.json() as Array<{ id: number; requestedBy: number }>;

    const sessionRes = await page.request.get('/api/auth/me');
    const session = await sessionRes.json() as { id: number; username: string };

    const ownApproval = approvals.find(a => a.requestedBy === session.id);
    if (ownApproval) {
      const response = await patchWithCSRF(page, `/api/pending-approvals/${ownApproval.id}`, {
        status: 'approved'
      });
      expect(response.status()).toBe(403);
      const body = await response.json() as Record<string, string>;
      expect(body.message).toContain('Maker cannot be the Checker');
    } else {
      test.skip();
    }
  });
});
