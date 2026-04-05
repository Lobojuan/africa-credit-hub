import { chromium, FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  const baseURL = config.projects[0].use.baseURL || 'http://localhost:5000';
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  let retries = 3;
  while (retries > 0) {
    const apiLogin = await page.request.post(`${baseURL}/api/auth/login`, {
      data: { username: 'admin', password: 'admin0987' }
    });
    if (apiLogin.ok()) {
      break;
    }
    if (apiLogin.status() === 429) {
      await page.waitForTimeout(5000);
      retries--;
      continue;
    }
    throw new Error(`Login failed with status ${apiLogin.status()}`);
  }

  await page.goto(baseURL);
  await page.waitForTimeout(2000);

  await context.storageState({ path: 'e2e/.auth/storage-state.json' });
  await browser.close();
}

export default globalSetup;
