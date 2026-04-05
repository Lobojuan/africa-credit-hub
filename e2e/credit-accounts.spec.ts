import { test, expect } from '@playwright/test';

test.describe('Credit Accounts', () => {
  test('credit accounts API returns data', async ({ page }) => {
    const response = await page.request.get('/api/credit-accounts');
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    const accounts = Array.isArray(data) ? data : data.data || [];
    expect(accounts.length).toBeGreaterThan(0);
    expect(accounts[0]).toHaveProperty('id');
    expect(accounts[0]).toHaveProperty('accountType');
    expect(accounts[0]).toHaveProperty('borrowerId');
  });

  test('credit accounts page loads in browser', async ({ page }) => {
    await page.goto('/credit-accounts');
    await page.waitForLoadState('domcontentloaded');
    const pageContent = await page.textContent('body');
    expect(pageContent).toMatch(/account|credit|loan|type/i);
  });
});
