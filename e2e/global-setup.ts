import { chromium, FullConfig } from '@playwright/test';

const ADMIN_PASSWORD = process.env.TEST_ADMIN_PASSWORD || 'admin0987';
const CHECKER_USERNAME = 'e2e_checker_test';
const CHECKER_PASSWORD = 'checker0987';

async function loginWithRetry(
  page: import('@playwright/test').Page,
  baseURL: string,
  username: string,
  password: string,
  maxRetries = 5,
): Promise<boolean> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const res = await page.request.post(`${baseURL}/api/auth/login`, {
      data: { username, password },
    });
    if (res.ok()) return true;
    if (res.status() === 429) {
      const backoff = attempt * 3000;
      console.log(`Login rate-limited (429), retrying in ${backoff}ms (attempt ${attempt}/${maxRetries})`);
      await page.waitForTimeout(backoff);
      continue;
    }
    if (res.status() === 401) {
      return false; // bad credentials – user may not exist yet
    }
    throw new Error(`Login failed with status ${res.status()}`);
  }
  return false;
}

async function globalSetup(config: FullConfig) {
  const baseURL = config.projects[0].use.baseURL || 'http://localhost:5000';
  const browser = await chromium.launch();

  // ── Admin session ────────────────────────────────────────────────────────
  const adminCtx = await browser.newContext();
  const adminPage = await adminCtx.newPage();
  const adminOk = await loginWithRetry(adminPage, baseURL, 'admin', ADMIN_PASSWORD);
  if (!adminOk) {
    await browser.close();
    throw new Error('Global setup failed: could not authenticate admin user');
  }
  await adminPage.goto(baseURL);
  await adminPage.waitForLoadState('domcontentloaded');
  await adminCtx.storageState({ path: 'e2e/.auth/storage-state.json' });

  // ── Checker / maker user session ─────────────────────────────────────────
  // Create the checker user if it doesn't exist; 409/400 (duplicate) is acceptable.
  const csrfRes = await adminPage.request.get(`${baseURL}/api/auth/csrf-token`);
  const { token: csrf } = await csrfRes.json() as { token: string };
  // Create checker user; acceptable outcomes: 201 (created), 400/409 (duplicate).
  // Other statuses (e.g. 403 from a stale CSRF on retry) are logged but not fatal —
  // the login below is the real gate. Log the status for CI failure triage.
  const createUserRes = await adminPage.request.post(`${baseURL}/api/users`, {
    data: {
      username: CHECKER_USERNAME,
      password: CHECKER_PASSWORD,
      role: 'admin',
      fullName: 'E2E Checker',
      email: 'e2echecker@e2e.test',
      status: 'active',
    },
    headers: { 'x-csrf-token': csrf },
  });
  console.log(`[global-setup] Create checker user: HTTP ${createUserRes.status()}`);

  const checkerCtx = await browser.newContext();
  const checkerPage = await checkerCtx.newPage();
  const checkerOk = await loginWithRetry(checkerPage, baseURL, CHECKER_USERNAME, CHECKER_PASSWORD);
  if (!checkerOk) {
    await browser.close();
    throw new Error(
      `Global setup failed: could not authenticate checker user "${CHECKER_USERNAME}". ` +
      'Ensure the user was created successfully and credentials are correct.'
    );
  }
  await checkerCtx.storageState({ path: 'e2e/.auth/checker-state.json' });

  await browser.close();
}

export default globalSetup;
