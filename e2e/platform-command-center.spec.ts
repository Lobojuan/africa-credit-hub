import { test, expect } from '@playwright/test';
import { postWithCSRF } from './helpers/csrf';

interface PlatformKPIs {
  portfolio: Record<string, unknown>;
  borrowers: Record<string, unknown>;
  operations: Record<string, unknown>;
}

interface PlatformAuditLogs {
  logs: Array<Record<string, unknown>>;
}

interface APIKeysResponse {
  keys: Array<Record<string, unknown>>;
}

interface DataQuality {
  overallCompleteness: number;
  borrowers: Record<string, unknown>;
}

interface CountrySetting {
  countryCode: string;
  countryName: string;
}

interface MaintenanceStatus {
  enabled: boolean;
}

test.describe('Platform Command Center [PCC]', () => {

  test('PCC-01: platform KPIs returns portfolio/borrowers/operations', async ({ page }) => {
    const response = await page.request.get('/api/platform-kpis');
    expect(response.ok()).toBeTruthy();
    const data = await response.json() as PlatformKPIs;
    expect(data).toHaveProperty('portfolio');
    expect(data).toHaveProperty('borrowers');
    expect(data).toHaveProperty('operations');
  });

  test('PCC-02: platform audit logs returns log entries', async ({ page }) => {
    const response = await page.request.get('/api/platform/audit-logs');
    expect(response.ok()).toBeTruthy();
    const data = await response.json() as PlatformAuditLogs;
    expect(data).toHaveProperty('logs');
    expect(Array.isArray(data.logs)).toBeTruthy();
  });

  test('PCC-03: API keys endpoint returns keys array', async ({ page }) => {
    const response = await page.request.get('/api/platform/api-keys');
    expect(response.ok()).toBeTruthy();
    const data = await response.json() as APIKeysResponse;
    expect(data).toHaveProperty('keys');
    expect(Array.isArray(data.keys)).toBeTruthy();
  });

  test('PCC-04: data quality has completeness metrics', async ({ page }) => {
    const response = await page.request.get('/api/platform/data-quality');
    expect(response.ok()).toBeTruthy();
    const data = await response.json() as DataQuality;
    expect(data).toHaveProperty('overallCompleteness');
    expect(data).toHaveProperty('borrowers');
    expect(typeof data.overallCompleteness).toBe('number');
  });

  test('PCC-05: platform billing endpoint works', async ({ page }) => {
    const response = await page.request.get('/api/platform/billing');
    expect(response.ok()).toBeTruthy();
  });

  test('PCC-06: retention policies returns array', async ({ page }) => {
    const response = await page.request.get('/api/platform/retention-policies');
    expect(response.ok()).toBeTruthy();
    const data = await response.json() as unknown[];
    expect(Array.isArray(data)).toBeTruthy();
  });

  test('PCC-07: activity feed returns array', async ({ page }) => {
    const response = await page.request.get('/api/platform/activity-feed');
    expect(response.ok()).toBeTruthy();
    const data = await response.json() as unknown[];
    expect(Array.isArray(data)).toBeTruthy();
  });

  test('PCC-10: country settings list has countryCode/countryName', async ({ page }) => {
    const response = await page.request.get('/api/platform/country-settings');
    expect(response.ok()).toBeTruthy();
    const data = await response.json() as CountrySetting[];
    expect(Array.isArray(data)).toBeTruthy();
    if (data.length > 0) {
      expect(data[0]).toHaveProperty('countryCode');
      expect(data[0]).toHaveProperty('countryName');
      expect(typeof data[0].countryCode).toBe('string');
    }
  });

  test('PCC-10: specific country settings returns data', async ({ page }) => {
    const response = await page.request.get('/api/platform/country-settings/GH');
    expect(response.ok()).toBeTruthy();
    const data = await response.json() as CountrySetting;
    expect(data.countryCode).toBe('GH');
  });

  test('maintenance mode status returns boolean', async ({ page }) => {
    const response = await page.request.get('/api/maintenance/status');
    expect(response.ok()).toBeTruthy();
    const data = await response.json() as MaintenanceStatus;
    expect(data).toHaveProperty('enabled');
    expect(typeof data.enabled).toBe('boolean');
  });

  test('maintenance mode toggle and restore', async ({ page }) => {
    const toggleOn = await postWithCSRF(page, '/api/maintenance/toggle', { enabled: true });
    expect(toggleOn.ok()).toBeTruthy();
    const statusOn = await page.request.get('/api/maintenance/status');
    const onData = await statusOn.json() as MaintenanceStatus;
    expect(onData.enabled).toBe(true);

    const toggleOff = await postWithCSRF(page, '/api/maintenance/toggle', { enabled: false });
    expect(toggleOff.ok()).toBeTruthy();
    const statusOff = await page.request.get('/api/maintenance/status');
    const offData = await statusOff.json() as MaintenanceStatus;
    expect(offData.enabled).toBe(false);
  });

  test('command center page loads', async ({ page }) => {
    await page.goto('/command-center');
    await page.waitForLoadState('domcontentloaded');
    const pageContent = await page.textContent('body');
    expect(pageContent).toMatch(/command|center|platform|jurisdiction|country/i);
  });

  test('platform metrics page loads', async ({ page }) => {
    await page.goto('/platform-metrics');
    await page.waitForLoadState('domcontentloaded');
    const pageContent = await page.textContent('body');
    expect(pageContent).toMatch(/metric|platform|usage|api/i);
  });
});
