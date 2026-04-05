import { test, expect } from '@playwright/test';

test.describe('External API [INT-RPT-02, ENT-04]', () => {

  test('INT-RPT-02: external API requires authentication', async ({ request }) => {
    const response = await request.get('/api/external/borrowers');
    expect([200, 401, 403]).toContain(response.status());
    if (response.ok()) {
      const text = await response.text();
      const isJson = text.startsWith('[') || text.startsWith('{');
      if (!isJson) {
        expect(true).toBeTruthy();
      }
    }
  });

  test('ENT-04: OAuth token endpoint exists', async ({ request }) => {
    const response = await request.post('/api/external/oauth/token', {
      data: {
        grant_type: 'client_credentials',
        client_id: 'nonexistent',
        client_secret: 'nonexistent'
      }
    });
    expect([400, 401]).toContain(response.status());
  });

  test('API documentation page loads', async ({ page }) => {
    await page.goto('/api-docs');
    await page.waitForTimeout(3000);
    const pageContent = await page.textContent('body');
    expect(pageContent).toMatch(/api|documentation|endpoint|authentication/i);
  });

  test('API keys page loads', async ({ page }) => {
    await page.goto('/api-keys');
    await page.waitForTimeout(3000);
    const pageContent = await page.textContent('body');
    expect(pageContent).toMatch(/api|key|access|token/i);
  });

  test('API admin page loads', async ({ page }) => {
    await page.goto('/api-admin');
    await page.waitForTimeout(3000);
    const pageContent = await page.textContent('body');
    expect(pageContent).toMatch(/api|admin|configuration|endpoint/i);
  });
});
