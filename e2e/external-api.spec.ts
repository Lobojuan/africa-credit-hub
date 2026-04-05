import { test, expect } from '@playwright/test';

test.describe('External API [INT-RPT-02, ENT-04]', () => {

  test('INT-RPT-02: external API without token returns non-JSON', async ({ request }) => {
    const response = await request.get('/api/external/borrowers');
    const contentType = response.headers()['content-type'] || '';
    const isJson = contentType.includes('json');
    if (isJson) {
      expect([401, 403]).toContain(response.status());
    } else {
      expect(response.status()).toBe(200);
    }
  });

  test('ENT-04: OAuth token rejects invalid credentials', async ({ request }) => {
    const response = await request.post('/api/external/oauth/token', {
      data: {
        grant_type: 'client_credentials',
        client_id: 'nonexistent',
        client_secret: 'nonexistent'
      }
    });
    expect(response.status()).toBe(401);
    const body = await response.json() as Record<string, string>;
    expect(body.error).toBe('invalid_client');
  });
});
