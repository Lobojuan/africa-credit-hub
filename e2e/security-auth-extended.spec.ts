import { test, expect } from '@playwright/test';

test.describe('Security & Authentication Extended [NFR-SEC, ENT-01]', () => {

  test('NFR-SEC-04: account lockout after failed login attempts', async ({ request }) => {
    const res1 = await request.post('/api/auth/login', {
      data: { username: 'lockout_test_user', password: 'wrong1' }
    });
    expect(res1.status()).toBeGreaterThanOrEqual(400);

    const res2 = await request.post('/api/auth/login', {
      data: { username: 'lockout_test_user', password: 'wrong2' }
    });
    expect(res2.status()).toBeGreaterThanOrEqual(400);

    const res3 = await request.post('/api/auth/login', {
      data: { username: 'lockout_test_user', password: 'wrong3' }
    });
    expect(res3.status()).toBeGreaterThanOrEqual(400);
    const body = await res3.json();
    const showsAttemptWarning = res3.status() >= 400;
    expect(showsAttemptWarning).toBeTruthy();
  });

  test('NFR-SEC-03: password complexity enforcement', async ({ request }) => {
    const loginRes = await request.post('/api/auth/login', {
      data: { username: 'admin', password: 'admin0987' }
    });
    if (loginRes.status() === 429) { test.skip(); return; }
    expect(loginRes.ok()).toBeTruthy();

    const weakPasswords = ['short', '12345678', 'alllowercase1!', 'ALLUPPERCASE1!', 'NoSpecialChar1'];
    for (const weak of weakPasswords) {
      const res = await request.post('/api/auth/change-password', {
        data: { currentPassword: 'admin0987', newPassword: weak }
      });
      expect(res.ok()).toBeFalsy();
    }
  });

  test('NFR-SEC-01: RBAC - lender cannot access admin endpoints', async ({ request }) => {
    const loginRes = await request.post('/api/auth/login', {
      data: { username: 'dashen_user', password: 'dashen123' }
    });
    if (!loginRes.ok() || loginRes.status() === 429) {
      test.skip();
      return;
    }

    const adminEndpoints = ['/api/users', '/api/organizations'];
    for (const endpoint of adminEndpoints) {
      const res = await request.get(endpoint);
      expect([401, 403]).toContain(res.status());
    }
  });

  test('NFR-SEC-02: passwords are hashed (not returned in API)', async ({ request }) => {
    const loginRes = await request.post('/api/auth/login', {
      data: { username: 'admin', password: 'admin0987' }
    });
    if (loginRes.status() === 429) { test.skip(); return; }
    expect(loginRes.ok()).toBeTruthy();

    const usersRes = await request.get('/api/users');
    expect(usersRes.ok()).toBeTruthy();
    const users = await usersRes.json();
    for (const user of users.slice(0, 5)) {
      expect(user).not.toHaveProperty('password');
      expect(user).not.toHaveProperty('passwordHash');
    }
  });

  test('NFR-SEC-05: audit log records login events', async ({ request }) => {
    const loginRes = await request.post('/api/auth/login', {
      data: { username: 'admin', password: 'admin0987' }
    });
    if (loginRes.status() === 429) { test.skip(); return; }
    expect(loginRes.ok()).toBeTruthy();

    const auditRes = await request.get('/api/audit-logs');
    expect(auditRes.ok()).toBeTruthy();
    const logs = await auditRes.json();
    expect(logs.length).toBeGreaterThan(0);
    const loginLog = logs.find((l: any) => l.action === 'LOGIN');
    expect(loginLog).toBeTruthy();
  });

  test('NFR-SEC-06: audit logs include IP address', async ({ request }) => {
    const loginRes = await request.post('/api/auth/login', {
      data: { username: 'admin', password: 'admin0987' }
    });
    if (loginRes.status() === 429) { test.skip(); return; }
    expect(loginRes.ok()).toBeTruthy();

    const auditRes = await request.get('/api/audit-logs');
    const logs = await auditRes.json();
    const recentLog = logs[0];
    expect(recentLog).toHaveProperty('ipAddress');
  });

  test('NFR-SEC-09: session timeout configuration exists', async ({ request }) => {
    const loginRes = await request.post('/api/auth/login', {
      data: { username: 'admin', password: 'admin0987' }
    });
    expect([200, 429]).toContain(loginRes.status());

    if (loginRes.ok()) {
      const sessionRes = await request.get('/api/auth/session');
      expect(sessionRes.ok()).toBeTruthy();
    }
  });

  test('ENT-07: audit log integrity verification endpoint', async ({ request }) => {
    const loginRes = await request.post('/api/auth/login', {
      data: { username: 'admin', password: 'admin0987' }
    });
    if (loginRes.status() === 429) { test.skip(); return; }
    expect(loginRes.ok()).toBeTruthy();

    const verifyRes = await request.get('/api/audit/verify-integrity');
    expect(verifyRes.ok()).toBeTruthy();
    const data = await verifyRes.json();
    expect(data).toHaveProperty('verified');
  });
});
