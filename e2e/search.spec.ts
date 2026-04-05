import { test, expect } from '@playwright/test';

test.describe('Search Functionality', () => {
  test('credit search API works', async ({ page }) => {
    const response = await page.request.get('/api/credit-search?query=loan');
    expect(response.ok()).toBeTruthy();
  });

  test('cross-border search API works', async ({ page }) => {
    const response = await page.request.get('/api/cross-border/search?query=test');
    expect(response.ok()).toBeTruthy();
  });

  test('search page loads', async ({ page }) => {
    const response = await page.goto('/search');
    expect(response?.status()).toBeLessThan(400);
  });

  test('cross-border search page loads', async ({ page }) => {
    const response = await page.goto('/cross-border-search');
    expect(response?.status()).toBeLessThan(400);
  });
});
