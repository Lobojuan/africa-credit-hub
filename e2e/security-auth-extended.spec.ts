import { test, expect } from '@playwright/test';

interface UserRecord {
  id: number;
  username: string;
  fullName: string;
  role: string;
  email: string;
}

interface AuditLogEntry {
  id: number;
  action: string;
  userId: number | null;
  ipAddress: string;
  timestamp: string;
}

interface AuditVerification {
  verified: boolean;
  totalLogs: number;
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

interface MFASetupResponse {
  secret: string;
  uri: string;
}

test.describe('Security & Authentication [NFR-SEC]', () => {

  test('NFR-SEC-04: repeated failed logins return 401', async ({ request }) => {
    for (let i = 0; i < 3; i++) {
      const res = await request.post('/api/auth/login', {
        data: { username: 'lockout_test_user', password: `wrong${i}` }
      });
      expect(res.status()).toBe(401);
    }
  });

  test('NFR-SEC-03: weak passwords are rejected', async ({ request }) => {
    const loginRes = await request.post('/api/auth/login', {
      data: { username: 'admin', password: 'admin0987' }
    });
    if (loginRes.status() === 429) { test.skip(); return; }
    expect(loginRes.ok()).toBeTruthy();

    const csrfRes = await request.get('/api/auth/csrf-token');
    const csrfData = await csrfRes.json() as { token: string };
    const csrfToken = csrfData.token;

    const weakPasswords = ['short', '12345678', 'alllowercase1!', 'ALLUPPERCASE1!', 'NoSpecialChar1'];
    for (const weak of weakPasswords) {
      const res = await request.post('/api/auth/change-password', {
        data: { currentPassword: 'admin0987', newPassword: weak },
        headers: { 'x-csrf-token': csrfToken }
      });
      expect(res.ok()).toBeFalsy();
    }
  });

  test('NFR-SEC-01: non-admin role cannot access admin endpoints', async ({ request }) => {
    const loginRes = await request.post('/api/auth/login', {
      data: { username: 'dashen_user', password: 'dashen123' }
    });
    if (!loginRes.ok()) { test.skip(); return; }

    const adminEndpoints = ['/api/users', '/api/organizations'];
    for (const endpoint of adminEndpoints) {
      const res = await request.get(endpoint);
      expect([401, 403]).toContain(res.status());
    }
  });

  test('NFR-SEC-02: user API never exposes password fields', async ({ request }) => {
    const loginRes = await request.post('/api/auth/login', {
      data: { username: 'admin', password: 'admin0987' }
    });
    if (loginRes.status() === 429) { test.skip(); return; }
    expect(loginRes.ok()).toBeTruthy();

    const usersRes = await request.get('/api/users');
    expect(usersRes.ok()).toBeTruthy();
    const users = await usersRes.json() as UserRecord[];
    for (const user of users.slice(0, 5)) {
      expect(user).not.toHaveProperty('password');
      expect(user).not.toHaveProperty('passwordHash');
    }
  });

  test('NFR-SEC-05: audit log captures LOGIN action', async ({ request }) => {
    const loginRes = await request.post('/api/auth/login', {
      data: { username: 'admin', password: 'admin0987' }
    });
    if (loginRes.status() === 429) { test.skip(); return; }
    expect(loginRes.ok()).toBeTruthy();

    const auditRes = await request.get('/api/audit-logs');
    expect(auditRes.ok()).toBeTruthy();
    const logs = await auditRes.json() as AuditLogEntry[];
    expect(logs.length).toBeGreaterThan(0);
    const loginLog = logs.find((entry) => entry.action === 'LOGIN');
    expect(loginLog).toBeTruthy();
  });

  test('NFR-SEC-06: audit logs contain IP address', async ({ request }) => {
    const loginRes = await request.post('/api/auth/login', {
      data: { username: 'admin', password: 'admin0987' }
    });
    if (loginRes.status() === 429) { test.skip(); return; }
    expect(loginRes.ok()).toBeTruthy();

    const auditRes = await request.get('/api/audit-logs');
    const logs = await auditRes.json() as AuditLogEntry[];
    expect(logs[0]).toHaveProperty('ipAddress');
    expect(typeof logs[0].ipAddress).toBe('string');
  });

  test('NFR-SEC-09: session returns user with security fields', async ({ request }) => {
    const loginRes = await request.post('/api/auth/login', {
      data: { username: 'admin', password: 'admin0987' }
    });
    if (loginRes.status() === 429) { test.skip(); return; }
    expect(loginRes.ok()).toBeTruthy();

    const loginData = await loginRes.json() as LoginResponse;
    expect(loginData).toHaveProperty('mfaEnabled');
    expect(loginData).toHaveProperty('passwordExpired');
    expect(loginData).toHaveProperty('passwordChangedAt');
    expect(loginData).toHaveProperty('mustChangePassword');
    expect(typeof loginData.mfaEnabled).toBe('boolean');
  });

  test('ENT-07: audit log integrity verification', async ({ request }) => {
    const loginRes = await request.post('/api/auth/login', {
      data: { username: 'admin', password: 'admin0987' }
    });
    if (loginRes.status() === 429) { test.skip(); return; }
    expect(loginRes.ok()).toBeTruthy();

    const verifyRes = await request.get('/api/audit/verify-integrity');
    expect(verifyRes.ok()).toBeTruthy();
    const data = await verifyRes.json() as AuditVerification;
    expect(data).toHaveProperty('verified');
    expect(data.verified).toBe(true);
  });

  test('MFA setup returns TOTP secret and URI', async ({ request }) => {
    const loginRes = await request.post('/api/auth/login', {
      data: { username: 'admin', password: 'admin0987' }
    });
    if (loginRes.status() === 429) { test.skip(); return; }
    expect(loginRes.ok()).toBeTruthy();

    const csrfRes = await request.get('/api/auth/csrf-token');
    const csrfData = await csrfRes.json() as { token: string };

    const setupRes = await request.post('/api/auth/mfa/setup', {
      headers: { 'x-csrf-token': csrfData.token }
    });
    expect(setupRes.ok()).toBeTruthy();
    const setup = await setupRes.json() as MFASetupResponse;
    expect(setup).toHaveProperty('secret');
    expect(setup).toHaveProperty('uri');
    expect(setup.uri).toContain('otpauth://totp/');
    expect(setup.secret.length).toBeGreaterThanOrEqual(16);
  });

  test('MFA verify rejects invalid code', async ({ request }) => {
    const loginRes = await request.post('/api/auth/login', {
      data: { username: 'admin', password: 'admin0987' }
    });
    if (loginRes.status() === 429) { test.skip(); return; }

    const csrfRes = await request.get('/api/auth/csrf-token');
    const csrfData = await csrfRes.json() as { token: string };

    const verifyRes = await request.post('/api/auth/mfa/verify', {
      data: { code: '000000' },
      headers: { 'x-csrf-token': csrfData.token }
    });
    expect(verifyRes.status()).toBe(400);
  });

  test('MFA disable works with correct password', async ({ request }) => {
    const loginRes = await request.post('/api/auth/login', {
      data: { username: 'admin', password: 'admin0987' }
    });
    if (loginRes.status() === 429) { test.skip(); return; }

    const csrfRes = await request.get('/api/auth/csrf-token');
    const csrfData = await csrfRes.json() as { token: string };

    const disableRes = await request.post('/api/auth/mfa/disable', {
      data: { password: 'admin0987' },
      headers: { 'x-csrf-token': csrfData.token }
    });
    expect(disableRes.ok()).toBeTruthy();
  });

  test('login response exposes password expiry fields', async ({ request }) => {
    const loginRes = await request.post('/api/auth/login', {
      data: { username: 'admin', password: 'admin0987' }
    });
    if (loginRes.status() === 429) { test.skip(); return; }
    expect(loginRes.ok()).toBeTruthy();

    const data = await loginRes.json() as LoginResponse;
    expect(typeof data.passwordExpired).toBe('boolean');
    expect(typeof data.mustChangePassword).toBe('boolean');
    if (data.passwordChangedAt) {
      const changedDate = new Date(data.passwordChangedAt);
      expect(changedDate.getTime()).toBeGreaterThan(0);
    }
  });
});
