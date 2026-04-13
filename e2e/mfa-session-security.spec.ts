import { test, expect } from '@playwright/test';

const ADMIN_PASSWORD = process.env.TEST_ADMIN_PASSWORD || 'admin0987';

interface MFASetupResponse {
  secret: string;
  uri: string;
}

interface LoginResponse {
  id: string;
  username: string;
  role: string;
  mfaEnabled: boolean;
  passwordExpired: boolean;
  passwordChangedAt: string | null;
  mustChangePassword: boolean;
}

interface AuditVerification {
  verified?: boolean;
  valid?: boolean;
  totalLogs?: number;
  totalChecked?: number;
}

test.describe('MFA & Session Security [ENT-01, NFR-SEC-09/10]', () => {

  test('ENT-01: MFA setup returns TOTP secret and otpauth URI', async ({ page }) => {
    const csrfRes = await page.request.get('/api/auth/csrf-token');
    const csrfData = await csrfRes.json() as { token: string };

    const setupRes = await page.request.post('/api/auth/mfa/setup', {
      headers: { 'x-csrf-token': csrfData.token }
    });
    expect(setupRes.ok()).toBeTruthy();
    const setup = await setupRes.json() as MFASetupResponse;
    expect(setup).toHaveProperty('secret');
    expect(setup).toHaveProperty('uri');
    expect(setup.uri).toContain('otpauth://totp/');
    expect(setup.secret.length).toBeGreaterThanOrEqual(16);
  });

  test('ENT-01: MFA verify rejects invalid TOTP code with 400', async ({ page }) => {
    const csrfRes = await page.request.get('/api/auth/csrf-token');
    const csrfData = await csrfRes.json() as { token: string };

    const verifyRes = await page.request.post('/api/auth/mfa/verify', {
      data: { code: '000000' },
      headers: { 'x-csrf-token': csrfData.token }
    });
    expect(verifyRes.status()).toBe(400);
    const body = await verifyRes.json() as { message: string };
    expect(body.message).toContain('Invalid');
  });

  test('ENT-01: MFA disable works with correct password', async ({ page }) => {
    const csrfRes = await page.request.get('/api/auth/csrf-token');
    const csrfData = await csrfRes.json() as { token: string };

    const disableRes = await page.request.post('/api/auth/mfa/disable', {
      data: { password: ADMIN_PASSWORD },
      headers: { 'x-csrf-token': csrfData.token }
    });
    expect(disableRes.ok()).toBeTruthy();
  });

  test('NFR-SEC-09: session user has security fields', async ({ page }) => {
    const loginRes = await page.request.post('/api/auth/login', {
      data: { username: 'admin', password: ADMIN_PASSWORD }
    });
    expect(loginRes.ok()).toBeTruthy();
    const data = await loginRes.json() as LoginResponse;
    expect(data).toHaveProperty('mfaEnabled');
    expect(data).toHaveProperty('passwordExpired');
    expect(data).toHaveProperty('passwordChangedAt');
    expect(data).toHaveProperty('mustChangePassword');
    expect(typeof data.mfaEnabled).toBe('boolean');
    expect(typeof data.passwordExpired).toBe('boolean');
    expect(typeof data.mustChangePassword).toBe('boolean');
  });

  test('NFR-SEC-10: login response has password expiry data', async ({ page }) => {
    const loginRes = await page.request.post('/api/auth/login', {
      data: { username: 'admin', password: ADMIN_PASSWORD }
    });
    expect(loginRes.ok()).toBeTruthy();
    const data = await loginRes.json() as LoginResponse;
    expect(typeof data.passwordExpired).toBe('boolean');
    if (data.passwordChangedAt) {
      const changedDate = new Date(data.passwordChangedAt);
      expect(changedDate.getTime()).toBeGreaterThan(0);
    }
  });

  test('ENT-07: audit log integrity verification', async ({ page }) => {
    const verifyRes = await page.request.get('/api/audit/verify-integrity');
    expect(verifyRes.ok()).toBeTruthy();
    const data = await verifyRes.json() as AuditVerification;
    const isValid = data.verified ?? data.valid;
    expect(typeof isValid).toBe('boolean');
    const totalChecked = data.totalLogs ?? data.totalChecked ?? 0;
    expect(totalChecked).toBeGreaterThan(0);
  });
});
