import { chromium, FullConfig } from '@playwright/test';

const ADMIN_PASSWORD = process.env.TEST_ADMIN_PASSWORD || 'admin0987';

async function globalSetup(config: FullConfig) {
  const baseURL = config.projects[0].use.baseURL || 'http://localhost:5000';
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  let authenticated = false;
  const maxRetries = 5;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const apiLogin = await page.request.post(`${baseURL}/api/auth/login`, {
      data: { username: 'admin', password: ADMIN_PASSWORD }
    });
    if (apiLogin.ok()) {
      authenticated = true;
      break;
    }
    if (apiLogin.status() === 429) {
      const backoff = attempt * 3000;
      console.log(`Login rate-limited (429), retrying in ${backoff}ms (attempt ${attempt}/${maxRetries})`);
      await page.waitForTimeout(backoff);
      continue;
    }
    throw new Error(`Login failed with status ${apiLogin.status()}`);
  }

  if (!authenticated) {
    await browser.close();
    throw new Error(`Global setup failed: could not authenticate after ${maxRetries} attempts due to rate limiting`);
  }

  await page.goto(baseURL);
  await page.waitForLoadState('domcontentloaded');

  await context.storageState({ path: 'e2e/.auth/storage-state.json' });
  await browser.close();
}

export default globalSetup;
