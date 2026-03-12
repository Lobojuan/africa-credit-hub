import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  testMatch: '**/*.spec.ts',
  fullyParallel: false,
  retries: 0,
  timeout: 60000,
  workers: 1,
  globalSetup: './e2e/global-setup.ts',
  projects: [
    {
      name: 'unauthenticated',
      testMatch: ['auth.spec.ts', 'error-handling.spec.ts'],
      use: {
        baseURL: 'http://localhost:5000',
        headless: true,
        screenshot: 'only-on-failure',
        trace: 'retain-on-failure',
      },
    },
    {
      name: 'authenticated',
      testMatch: ['dashboard-navigation.spec.ts', 'borrowers.spec.ts', 'credit-accounts.spec.ts', 'search.spec.ts', 'super-admin.spec.ts', 'compliance.spec.ts', 'reports-regulatory.spec.ts', 'supporting-pages.spec.ts'],
      use: {
        baseURL: 'http://localhost:5000',
        headless: true,
        screenshot: 'only-on-failure',
        trace: 'retain-on-failure',
        storageState: 'e2e/.auth/storage-state.json',
      },
    },
  ],
  reporter: [['list'], ['html', { open: 'never', outputFolder: 'e2e/report' }]],
  outputDir: 'e2e/test-results-artifacts',
});
