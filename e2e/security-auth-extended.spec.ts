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


test.describe('Security & Authentication [NFR-SEC]', () => {

  test('NFR-SEC-04: account lockout after 3 failed attempts returns 423', async ({ request }) => {
    const lockoutUser = 'lockout_e2e_' + Date.now();
    const loginRes = await request.post('/api/auth/login', {
      data: { username: 'admin', password: 'admin0987' }
    });
    if (loginRes.status() === 429) { test.skip(); return; }

    const csrfRes = await request.get('/api/auth/csrf-token');
    const csrfData = await csrfRes.json() as { token: string };

    const createRes = await request.post('/api/users', {
      data: {
        username: lockoutUser,
        password: 'TestLockout123!',
        fullName: 'Lockout Test',
        email: `${lockoutUser}@test.com`,
        role: 'admin',
        division: 'Testing',
        institution: 'Test',
        status: 'active'
      },
      headers: { 'x-csrf-token': csrfData.token }
    });
    if (!createRes.ok()) { test.skip(); return; }

    const results: number[] = [];
    for (let i = 0; i < 4; i++) {
      const res = await request.post('/api/auth/login', {
        data: { username: lockoutUser, password: 'wrongpassword' }
      });
      results.push(res.status());
    }
    expect(results.slice(0, 3).every((s) => s === 401)).toBeTruthy();
    expect(results[3]).toBe(423);
  });

  test('NFR-SEC-04: invalid credentials return 401', async ({ request }) => {
    const res = await request.post('/api/auth/login', {
      data: { username: 'nonexistent_user_test', password: 'wrong' }
    });
    expect(res.status()).toBe(401);
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

  test('RBAC-UNAUTH: unauthenticated requests denied for all protected endpoints', async ({ request }) => {
    const protectedEndpoints = [
      '/api/borrowers',
      '/api/credit-accounts',
      '/api/disputes',
      '/api/audit-logs',
      '/api/dashboard/stats',
      '/api/pending-approvals',
      '/api/users',
      '/api/organizations'
    ];
    for (const endpoint of protectedEndpoints) {
      const response = await request.get(endpoint);
      expect([401, 403]).toContain(response.status());
    }
  });

});
