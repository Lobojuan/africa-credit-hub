import { Page } from '@playwright/test';

let cachedToken: string | null = null;

export async function getCSRFToken(page: Page): Promise<string> {
  if (cachedToken) return cachedToken;
  const response = await page.request.get('/api/auth/csrf-token');
  const data = await response.json();
  cachedToken = data.token;
  return cachedToken!;
}

export async function postWithCSRF(page: Page, url: string, body: any) {
  const token = await getCSRFToken(page);
  return page.request.post(url, {
    data: body,
    headers: { 'x-csrf-token': token }
  });
}

export async function putWithCSRF(page: Page, url: string, body: any) {
  const token = await getCSRFToken(page);
  return page.request.put(url, {
    data: body,
    headers: { 'x-csrf-token': token }
  });
}

export async function deleteWithCSRF(page: Page, url: string) {
  const token = await getCSRFToken(page);
  return page.request.delete(url, {
    headers: { 'x-csrf-token': token }
  });
}
