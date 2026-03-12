import { chromium, FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  const baseURL = config.projects[0].use.baseURL || 'http://localhost:5000';
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  await page.goto(baseURL);
  const usernameInput = page.locator('input[type="text"], input[name="username"], input[placeholder*="user" i]').first();
  const passwordInput = page.locator('input[type="password"]').first();
  await usernameInput.waitFor({ timeout: 15000 });
  await usernameInput.fill('admin');
  await passwordInput.fill('admin0987');
  await page.locator('button[type="submit"]').first().click();
  await page.waitForTimeout(3000);

  await context.storageState({ path: 'e2e/.auth/storage-state.json' });
  await browser.close();
}

export default globalSetup;
