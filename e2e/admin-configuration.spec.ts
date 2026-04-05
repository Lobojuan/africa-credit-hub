import { test, expect } from '@playwright/test';

interface Institution {
  id: number;
  name: string;
  type: string;
  status: string;
}

interface BillingRecord {
  invoiceNumber: string;
  amount: number;
  status: string;
}

interface ExchangeRate {
  baseCurrency: string;
  targetCurrency: string;
  rate: number;
}

interface UserRecord {
  id: number;
  username: string;
  fullName: string;
  role: string;
}

interface APIUsageData {
  totalToday: number;
  uniqueEndpoints: number;
  topEndpoints: unknown[];
}

test.describe('Admin & Configuration [FR-DP, FR-COMM, ENT]', () => {

  test('FR-DP-01: institutions list with name/type/status', async ({ page }) => {
    const response = await page.request.get('/api/institutions');
    expect(response.ok()).toBeTruthy();
    const raw = await response.json() as Institution[] | { data: Institution[] };
    const institutions = Array.isArray(raw) ? raw : raw.data;
    expect(institutions.length).toBeGreaterThan(0);
    expect(institutions[0]).toHaveProperty('name');
    expect(institutions[0]).toHaveProperty('status');
    expect(institutions[0]).toHaveProperty('type');
  });

  test('FR-COMM-01: billing records with invoiceNumber/amount/status', async ({ page }) => {
    const response = await page.request.get('/api/billing');
    expect(response.ok()).toBeTruthy();
    const raw = await response.json() as BillingRecord[] | { data: BillingRecord[] };
    const records = Array.isArray(raw) ? raw : raw.data;
    if (records.length > 0) {
      expect(records[0]).toHaveProperty('invoiceNumber');
      expect(records[0]).toHaveProperty('amount');
      expect(records[0]).toHaveProperty('status');
    }
  });

  test('ENT-09: exchange rates with baseCurrency/targetCurrency/rate', async ({ page }) => {
    const response = await page.request.get('/api/exchange-rates');
    expect(response.ok()).toBeTruthy();
    const data = await response.json() as ExchangeRate[];
    expect(Array.isArray(data)).toBeTruthy();
    if (data.length > 0) {
      expect(data[0]).toHaveProperty('baseCurrency');
      expect(data[0]).toHaveProperty('targetCurrency');
      expect(data[0]).toHaveProperty('rate');
      expect(data[0].rate).toBeTruthy();
    }
  });

  test('ENT-10: API configurations endpoint returns integrations', async ({ page }) => {
    const response = await page.request.get('/api/api-configurations');
    expect(response.ok()).toBeTruthy();
    const data = await response.json() as Array<{ id: string; name: string; category: string; isActive: boolean }>;
    expect(Array.isArray(data)).toBeTruthy();
    expect(data.length).toBeGreaterThan(0);
    expect(data[0]).toHaveProperty('name');
    expect(data[0]).toHaveProperty('category');
    expect(typeof data[0].isActive).toBe('boolean');
  });

  test('ENT-08: retention policies returns array', async ({ page }) => {
    const response = await page.request.get('/api/retention-policies');
    expect(response.ok()).toBeTruthy();
    const data = await response.json() as unknown[];
    expect(Array.isArray(data)).toBeTruthy();
  });

  test('user management returns users with required fields', async ({ page }) => {
    const response = await page.request.get('/api/users');
    expect(response.ok()).toBeTruthy();
    const data = await response.json() as UserRecord[];
    expect(Array.isArray(data)).toBeTruthy();
    expect(data.length).toBeGreaterThan(0);
    expect(data[0]).toHaveProperty('username');
    expect(data[0]).toHaveProperty('role');
    expect(data[0]).toHaveProperty('fullName');
  });

  test('organizations API returns data', async ({ page }) => {
    const response = await page.request.get('/api/institutions');
    expect(response.ok()).toBeTruthy();
    const raw = await response.json() as Institution[] | { data: Institution[] };
    const orgs = Array.isArray(raw) ? raw : raw.data;
    expect(orgs.length).toBeGreaterThan(0);
  });

  test('API keys returns array', async ({ page }) => {
    const response = await page.request.get('/api/api-keys');
    expect(response.ok()).toBeTruthy();
    const data = await response.json() as unknown[];
    expect(Array.isArray(data)).toBeTruthy();
  });

  test('ENT-18: API usage analytics has required fields', async ({ page }) => {
    const response = await page.request.get('/api/admin/api-usage');
    expect(response.ok()).toBeTruthy();
    const data = await response.json() as APIUsageData;
    expect(data).toHaveProperty('totalToday');
    expect(data).toHaveProperty('uniqueEndpoints');
    expect(data).toHaveProperty('topEndpoints');
    expect(typeof data.totalToday).toBe('number');
  });

  test('webhook management endpoint returns webhooks array', async ({ page }) => {
    const response = await page.request.get('/api/webhooks');
    expect(response.ok()).toBeTruthy();
    const data = await response.json() as Array<{ id: string; url: string; status: string; events: string[] }>;
    expect(Array.isArray(data)).toBeTruthy();
    if (data.length > 0) {
      expect(data[0]).toHaveProperty('url');
      expect(data[0]).toHaveProperty('status');
      expect(data[0]).toHaveProperty('events');
    }
  });

  test('system status endpoint', async ({ page }) => {
    const response = await page.request.get('/api/status');
    expect(response.ok()).toBeTruthy();
  });

  test('ENT-17: notifications endpoint', async ({ page }) => {
    const response = await page.request.get('/api/notifications');
    expect(response.ok()).toBeTruthy();
  });

  test('institutions page loads', async ({ page }) => {
    await page.goto('/institutions');
    await page.waitForLoadState('domcontentloaded');
    const pageContent = await page.textContent('body');
    expect(pageContent).toMatch(/institution|bank|lender/i);
  });

  test('billing page loads', async ({ page }) => {
    await page.goto('/billing');
    await page.waitForLoadState('domcontentloaded');
    const pageContent = await page.textContent('body');
    expect(pageContent).toMatch(/billing|invoice|payment/i);
  });

  test('user management page loads', async ({ page }) => {
    await page.goto('/users');
    await page.waitForLoadState('domcontentloaded');
    const pageContent = await page.textContent('body');
    expect(pageContent).toMatch(/user|role|management/i);
  });

  test('exchange rates page loads', async ({ page }) => {
    await page.goto('/exchange-rates');
    await page.waitForLoadState('domcontentloaded');
    const pageContent = await page.textContent('body');
    expect(pageContent).toMatch(/exchange|rate|currency/i);
  });

  test('system status page loads', async ({ page }) => {
    await page.goto('/system-status');
    await page.waitForLoadState('domcontentloaded');
    const pageContent = await page.textContent('body');
    expect(pageContent).toMatch(/status|system|uptime|health/i);
  });

  test('backup page loads', async ({ page }) => {
    await page.goto('/backup');
    await page.waitForLoadState('domcontentloaded');
    const pageContent = await page.textContent('body');
    expect(pageContent).toMatch(/backup|recovery|restore/i);
  });

  test('version history page loads', async ({ page }) => {
    await page.goto('/version-history');
    await page.waitForLoadState('domcontentloaded');
    const pageContent = await page.textContent('body');
    expect(pageContent).toMatch(/version|history|release|change|update/i);
  });
});
