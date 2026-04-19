import { test, expect } from '@playwright/test';
import { existsSync } from 'fs';
import { PDFParse } from 'pdf-parse';
import { postWithCSRF } from './helpers/csrf';

const REASON = 'E2E skip-trace test — delinquent loan workflow';

interface BorrowerListResponse {
  data: { id: string; firstName: string; lastName: string }[];
  total: number;
}

interface AuditLog {
  id: string;
  action: string;
  entity: string;
  entityId: string;
  details: string;
}

interface Assignment {
  id: string;
  borrowerId: string;
  status: string;
  priority: string;
}

interface Attempt {
  id: string;
  channel: string;
  outcome: string;
}

interface ContactEvent {
  id: string;
  contactType: string;
  value: string;
  source: string;
  firstSeen?: string;
  lastSeen?: string;
  occurrences: number;
}

let _cachedBorrowerId: string | undefined;
async function getFirstBorrowerId(page: import('@playwright/test').Page): Promise<string> {
  if (_cachedBorrowerId) return _cachedBorrowerId;
  const res = await page.request.get('/api/borrowers?page=1&limit=1');
  expect(res.ok()).toBeTruthy();
  const body = await res.json() as BorrowerListResponse;
  expect(body.data.length).toBeGreaterThan(0);
  _cachedBorrowerId = body.data[0].id;
  return _cachedBorrowerId;
}

async function getAuditLogs(page: import('@playwright/test').Page): Promise<AuditLog[]> {
  const res = await page.request.get('/api/audit-logs');
  if (!res.ok()) return [];
  return res.json() as Promise<AuditLog[]>;
}

async function findAuditEntry(page: import('@playwright/test').Page, action: string, entityId?: string): Promise<AuditLog | undefined> {
  const logs = await getAuditLogs(page);
  return logs.find(l => l.action === action && (!entityId || l.entityId === entityId));
}

async function assertNewAuditEntry(page: import('@playwright/test').Page, action: string, entityId: string, snapshot: AuditLog[]): Promise<void> {
  const after = await getAuditLogs(page);
  const existing = new Set(snapshot.map(l => l.id));
  const newEntry = after.find(l => l.action === action && l.entityId === entityId && !existing.has(l.id));
  expect(newEntry, `Expected a new ${action} audit entry for entity ${entityId}`).toBeTruthy();
}

test.describe('Borrower Trace Section', () => {
  test('permissible-purpose gate renders and can be unlocked', async ({ page }) => {
    const borrowerId = await getFirstBorrowerId(page);
    await page.goto(`/borrowers/${borrowerId}`);
    await page.waitForLoadState('domcontentloaded');

    const gate = page.locator('[data-testid="section-trace-gate"]');
    await expect(gate).toBeVisible({ timeout: 10000 });

    await page.locator('[data-testid="input-trace-access-reason"]').fill(REASON);
    await page.locator('[data-testid="button-trace-access-confirm"]').click();

    await expect(page.locator('[data-testid="section-trace-history"]')).toBeVisible({ timeout: 8000 });
    await expect(page.locator('[data-testid="section-trace-links"]')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('[data-testid="section-asset-traces"]')).toBeVisible({ timeout: 5000 });
  });

  test('TRACE_HISTORY_VIEW audit entry written after opening trace section via API', async ({ page }) => {
    const borrowerId = await getFirstBorrowerId(page);

    const snapshot = await getAuditLogs(page);
    const res = await page.request.get(
      `/api/trace/borrower/${borrowerId}/history?reason=${encodeURIComponent(REASON)}`
    );
    expect(res.ok()).toBeTruthy();
    const events = await res.json() as unknown[];
    expect(Array.isArray(events)).toBeTruthy();

    await assertNewAuditEntry(page, 'TRACE_HISTORY_VIEW', borrowerId, snapshot);
  });

  test('TRACE_LINKS_VIEW audit entry written after fetching linked borrowers', async ({ page }) => {
    const borrowerId = await getFirstBorrowerId(page);

    const snapshot = await getAuditLogs(page);
    const res = await page.request.get(
      `/api/trace/borrower/${borrowerId}/links?reason=${encodeURIComponent(REASON)}`
    );
    expect(res.ok()).toBeTruthy();

    await assertNewAuditEntry(page, 'TRACE_LINKS_VIEW', borrowerId, snapshot);
  });

  test('asset trace stub run returns a record and writes TRACE_ASSET_LOOKUP audit entry', async ({ page }) => {
    const borrowerId = await getFirstBorrowerId(page);

    const snapshot = await getAuditLogs(page);
    const res = await postWithCSRF(page, `/api/trace/borrower/${borrowerId}/assets`, {
      provider: 'ghana_dvla',
      reference: 'GR-1234-E2E',
      reason: REASON,
    });
    expect(res.ok()).toBeTruthy();
    const record = await res.json() as { id: string; status: string; provider: string };
    expect(record.id).toBeTruthy();
    expect(record.provider).toBe('ghana_dvla');

    await assertNewAuditEntry(page, 'TRACE_ASSET_LOOKUP', borrowerId, snapshot);
  });

  test('TRACE_ASSET_LIST audit entry written when listing asset traces', async ({ page }) => {
    const borrowerId = await getFirstBorrowerId(page);

    const snapshot = await getAuditLogs(page);
    const res = await page.request.get(
      `/api/trace/borrower/${borrowerId}/assets?reason=${encodeURIComponent(REASON)}`
    );
    expect(res.ok()).toBeTruthy();

    await assertNewAuditEntry(page, 'TRACE_ASSET_LIST', borrowerId, snapshot);
  });

  test('skip-trace PDF download writes TRACE_SKIP_TRACE_PDF audit entry', async ({ page }) => {
    const borrowerId = await getFirstBorrowerId(page);

    const snapshot = await getAuditLogs(page);
    const res = await postWithCSRF(page, `/api/trace/borrower/${borrowerId}/skip-trace-pdf`, {
      reason: REASON,
    });
    expect(res.ok()).toBeTruthy();
    const contentType = res.headers()['content-type'];
    expect(contentType).toContain('application/pdf');

    await assertNewAuditEntry(page, 'TRACE_SKIP_TRACE_PDF', borrowerId, snapshot);
  });

  test('skip-trace PDF UI button generates report', async ({ page }) => {
    const borrowerId = await getFirstBorrowerId(page);
    await page.goto(`/borrowers/${borrowerId}`);
    await page.waitForLoadState('domcontentloaded');

    await page.locator('[data-testid="input-trace-access-reason"]').fill(REASON);
    await page.locator('[data-testid="button-trace-access-confirm"]').click();
    await expect(page.locator('[data-testid="section-trace-history"]')).toBeVisible({ timeout: 8000 });

    await page.locator('[data-testid="button-open-skip-trace"]').click();
    await expect(page.locator('[data-testid="input-skip-trace-reason"]')).toBeVisible({ timeout: 5000 });

    await page.locator('[data-testid="input-skip-trace-reason"]').fill(REASON);

    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.locator('[data-testid="button-generate-skip-trace"]').click(),
    ]);
    expect(download.suggestedFilename()).toContain('skip-trace');
  });

  test('asset trace UI run trace button works', async ({ page }) => {
    const borrowerId = await getFirstBorrowerId(page);
    await page.goto(`/borrowers/${borrowerId}`);
    await page.waitForLoadState('domcontentloaded');

    await page.locator('[data-testid="input-trace-access-reason"]').fill(REASON);
    await page.locator('[data-testid="button-trace-access-confirm"]').click();
    await expect(page.locator('[data-testid="section-asset-traces"]')).toBeVisible({ timeout: 8000 });

    const [assetRes] = await Promise.all([
      page.waitForResponse(r => r.url().includes('/api/trace/') && r.url().includes('/assets') && r.request().method() === 'POST', { timeout: 10000 }),
      (async () => {
        await page.locator('[data-testid="input-asset-reference"]').fill('GR-E2E-UI-5678');
        await page.locator('[data-testid="button-run-asset-trace"]').click();
      })(),
    ]);
    expect(assetRes.ok()).toBeTruthy();
  });

  test('borrower edit → contact event captured after approval (source="borrower_update")', async ({ page, browser }) => {
    // maker = e2e_checker_test (admin), checker = admin (super_admin) via page.request
    const checkerStateFile = 'e2e/.auth/checker-state.json';
    if (!existsSync(checkerStateFile)) {
      throw new Error(
        'checker-state.json is missing — global setup must have failed to authenticate the checker user. ' +
        'Run global-setup again or ensure the e2e_checker_test user exists with password "checker0987".'
      );
    }

    const borrowerId = await getFirstBorrowerId(page);
    const auditSnapshot = await getAuditLogs(page);

    const makerCtx = await browser.newContext({ storageState: checkerStateFile });
    const makerPage = await makerCtx.newPage();

    const makerCsrfBody = await makerPage.request.get('/api/auth/csrf-token')
      .then(r => r.json() as Promise<{ token: string }>);
    const makerCsrf = makerCsrfBody.token;

    const newPhone = `+23320100${Date.now().toString().slice(-4)}`;
    const patchRes = await makerPage.request.patch(`/api/borrowers/${borrowerId}`, {
      data: { phone: newPhone },
      headers: { 'x-csrf-token': makerCsrf },
    });
    expect(patchRes.ok()).toBeTruthy();

    // Read body before closing context — closing disposes the response object
    const patchBody = await patchRes.json() as {
      approval: { id: string; action: string; entityType: string; status: string };
      message: string;
    };
    await makerCtx.close();

    expect(patchBody.message).toContain('approval');
    expect(patchBody.approval.entityType).toBe('borrower');
    expect(patchBody.approval.action).toBe('UPDATE');
    expect(patchBody.approval.status).toBe('pending');
    const approvalId = patchBody.approval.id;

    const adminCsrf = await page.request.get('/api/auth/csrf-token')
      .then(r => r.json() as Promise<{ token: string }>).then(d => d.token);

    const approveRes = await page.request.patch(`/api/pending-approvals/${approvalId}`, {
      data: { status: 'approved', reviewNotes: 'E2E test approval' },
      headers: { 'x-csrf-token': adminCsrf },
    });
    expect(approveRes.ok()).toBeTruthy();

    const historyRes = await page.request.get(
      `/api/trace/borrower/${borrowerId}/history?reason=${encodeURIComponent(REASON)}`
    );
    expect(historyRes.ok()).toBeTruthy();
    const events = await historyRes.json() as ContactEvent[];

    const updateEvent = events.find(ev =>
      ev.source === 'borrower_update' && ev.value === newPhone
    );
    expect(updateEvent).toBeTruthy();

    await assertNewAuditEntry(page, 'SUBMIT_APPROVAL', borrowerId, auditSnapshot);
    await assertNewAuditEntry(page, 'APPROVE', approvalId, auditSnapshot);
  });

  test('sandbox badge is visible for asset trace returned by sandbox provider', async ({ page }) => {
    const borrowerId = await getFirstBorrowerId(page);

    // ghana_dvla is configured to use the in-process registry sandbox, so
    // rawResponse.source will equal "sandbox" and the badge should render.
    const res = await postWithCSRF(page, `/api/trace/borrower/${borrowerId}/assets`, {
      provider: 'ghana_dvla',
      reference: 'GR-SANDBOX-BADGE-01',
      reason: REASON,
    });
    expect(res.ok()).toBeTruthy();
    const record = await res.json() as { id: string; provider: string };
    expect(record.id).toBeTruthy();

    await page.goto(`/borrowers/${borrowerId}`);
    await page.waitForLoadState('domcontentloaded');

    await page.locator('[data-testid="input-trace-access-reason"]').fill(REASON);
    await page.locator('[data-testid="button-trace-access-confirm"]').click();
    await expect(page.locator('[data-testid="section-asset-traces"]')).toBeVisible({ timeout: 8000 });

    // Assert the sandbox badge is present specifically on the newly created row
    const sandboxRow = page.locator(`[data-testid="row-asset-${record.id}"]`);
    await expect(sandboxRow).toBeVisible({ timeout: 8000 });
    await expect(sandboxRow.locator('[data-testid^="badge-sandbox-"]')).toBeVisible({ timeout: 5000 });
  });

  test('skip-trace PDF footnote contains sandbox disclaimer when sandbox asset trace exists', async ({ page }) => {
    const borrowerId = await getFirstBorrowerId(page);

    // Create a sandbox asset trace so the PDF generator sees sandbox data
    const traceRes = await postWithCSRF(page, `/api/trace/borrower/${borrowerId}/assets`, {
      provider: 'ghana_dvla',
      reference: 'GR-SANDBOX-PDF-FOOTNOTE-01',
      reason: REASON,
    });
    expect(traceRes.ok()).toBeTruthy();
    const traceRecord = await traceRes.json() as { id: string; provider: string };
    expect(traceRecord.id).toBeTruthy();

    // Download the skip-trace PDF
    const pdfRes = await postWithCSRF(page, `/api/trace/borrower/${borrowerId}/skip-trace-pdf`, {
      reason: REASON,
    });
    expect(pdfRes.ok()).toBeTruthy();
    expect(pdfRes.headers()['content-type']).toContain('application/pdf');

    // Verify the sandbox disclaimer footnote is present in the PDF text content.
    // pdfkit compresses content streams, so we parse the PDF with pdf-parse to
    // extract the rendered text before searching for the disclaimer.
    const pdfBytes = await pdfRes.body();
    const parser = new PDFParse({ data: new Uint8Array(pdfBytes) });
    const result = await parser.getText();
    const pdfText = result.text;
    // The footnote in server/skip-trace-pdf.ts reads:
    // "* Rows marked SANDBOX contain synthetic data generated by the registry
    //  test environment and must not be relied upon as evidence of asset ownership."
    // Two shorter stable tokens are used instead of the full phrase so that minor
    // PDF extraction whitespace or line-wrap changes don't cause false failures.
    // Together they uniquely identify the footnote block (neither string appears in
    // the header, warning banner, section banner, or source column).
    expect(pdfText, 'PDF must contain "Rows marked SANDBOX" footnote anchor').toContain('Rows marked SANDBOX');
    expect(pdfText, 'PDF must contain "registry test environment" footnote phrase').toContain('registry test environment');
  });

  test('sandbox badge is absent for asset trace returned by stub-only provider', async ({ page }) => {
    const borrowerId = await getFirstBorrowerId(page);

    // liberia_motor has no live integration and no sandbox env vars — it always
    // falls back to the plain stubVehicle helper which does NOT set
    // rawResponse.source = "sandbox", so the badge should never appear.
    const res = await postWithCSRF(page, `/api/trace/borrower/${borrowerId}/assets`, {
      provider: 'liberia_motor',
      reference: 'LR-STUB-BADGE-01',
      reason: REASON,
    });
    expect(res.ok()).toBeTruthy();
    const record = await res.json() as { id: string; provider: string };
    expect(record.id).toBeTruthy();

    await page.goto(`/borrowers/${borrowerId}`);
    await page.waitForLoadState('domcontentloaded');

    await page.locator('[data-testid="input-trace-access-reason"]').fill(REASON);
    await page.locator('[data-testid="button-trace-access-confirm"]').click();
    await expect(page.locator('[data-testid="section-asset-traces"]')).toBeVisible({ timeout: 8000 });

    // Wait for the liberia_motor row to appear, then confirm it has no sandbox badge
    const row = page.locator(`[data-testid="row-asset-${record.id}"]`);
    await expect(row).toBeVisible({ timeout: 8000 });
    await expect(row.locator('[data-testid^="badge-sandbox-"]')).toHaveCount(0);
  });
});

test.describe('Find Connections', () => {
  test('API requires a permissible-purpose reason', async ({ page }) => {
    const res = await postWithCSRF(page, '/api/trace/find-connections', {
      value: '+233200000000',
    });
    expect(res.status()).toBe(400);
  });

  test('API search returns matches and writes TRACE_FIND_CONNECTIONS audit entry', async ({ page }) => {
    const snapshot = await getAuditLogs(page);
    const res = await postWithCSRF(page, '/api/trace/find-connections', {
      type: 'phone',
      value: '+233201234567',
      reason: REASON,
    });
    expect(res.ok()).toBeTruthy();
    const body = await res.json() as { matches: unknown[]; clusters: unknown[] };
    expect(body).toHaveProperty('matches');
    expect(body).toHaveProperty('clusters');
    expect(Array.isArray(body.matches)).toBeTruthy();

    const after = await getAuditLogs(page);
    const existing = new Set(snapshot.map(l => l.id));
    const newEntry = after.find(l => l.action === 'TRACE_FIND_CONNECTIONS' && !existing.has(l.id));
    expect(newEntry, 'Expected a new TRACE_FIND_CONNECTIONS audit entry').toBeTruthy();
    expect(newEntry?.entity).toBe('trace');
  });

  test('Find Connections UI page loads and search button is disabled without inputs', async ({ page }) => {
    await page.goto('/find-connections');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('h1')).toContainText('Find Connections', { timeout: 10000 });

    const searchBtn = page.locator('[data-testid="button-trace-search"]');
    await expect(searchBtn).toBeVisible({ timeout: 5000 });
    await expect(searchBtn).toBeDisabled();
  });

  test('Find Connections UI search executes and shows results panel', async ({ page }) => {
    await page.goto('/find-connections');
    await page.waitForLoadState('domcontentloaded');

    await page.locator('[data-testid="input-trace-value"]').fill('+23320');
    await page.locator('[data-testid="input-trace-reason"]').fill(REASON);

    const searchBtn = page.locator('[data-testid="button-trace-search"]');
    await expect(searchBtn).toBeEnabled({ timeout: 5000 });
    await searchBtn.click();

    await expect(
      page.locator('text=Matched Borrowers').or(page.locator('text=No borrowers found')).first()
    ).toBeVisible({ timeout: 10000 });
  });

  test('Find Connections UI search network request succeeds', async ({ page }) => {
    await page.goto('/find-connections');
    await page.waitForLoadState('domcontentloaded');

    await page.locator('[data-testid="input-trace-value"]').fill('+233201234567');
    await page.locator('[data-testid="input-trace-reason"]').fill(REASON);

    const [searchRes] = await Promise.all([
      page.waitForResponse(r => r.url().includes('/api/trace/find-connections'), { timeout: 10000 }),
      page.locator('[data-testid="button-trace-search"]').click(),
    ]);
    expect(searchRes.ok()).toBeTruthy();
    const body = await searchRes.json() as { matches: unknown[]; clusters: unknown[] };
    expect(body).toHaveProperty('matches');
    expect(body).toHaveProperty('clusters');
  });
});

test.describe('Collections Workflow', () => {
  test('collections list API returns an array', async ({ page }) => {
    const res = await page.request.get('/api/collections/assignments');
    expect(res.ok()).toBeTruthy();
    const data = await res.json() as Assignment[];
    expect(Array.isArray(data)).toBeTruthy();
  });

  test('create assignment via API writes TRACE_COLLECTION_OPEN audit entry', async ({ page }) => {
    const borrowerId = await getFirstBorrowerId(page);

    const snapshot = await getAuditLogs(page);
    const res = await postWithCSRF(page, '/api/collections/assignments', {
      borrowerId,
      priority: 'medium',
      amountOutstanding: '5000',
      currency: 'GHS',
      notes: 'E2E test assignment',
    });
    expect(res.ok()).toBeTruthy();
    const assignment = await res.json() as Assignment;
    expect(assignment.id).toBeTruthy();
    expect(assignment.status).toBe('open');
    expect(assignment.borrowerId).toBe(borrowerId);

    await assertNewAuditEntry(page, 'TRACE_COLLECTION_OPEN', assignment.id, snapshot);
  });

  test('status auto-transitions: open → in_progress on first contact attempt', async ({ page }) => {
    const borrowerId = await getFirstBorrowerId(page);

    const createRes = await postWithCSRF(page, '/api/collections/assignments', {
      borrowerId,
      priority: 'low',
      notes: 'E2E status transition test',
    });
    expect(createRes.ok()).toBeTruthy();
    const assignment = await createRes.json() as Assignment;
    expect(assignment.status).toBe('open');

    const snapshot = await getAuditLogs(page);
    const attemptRes = await postWithCSRF(page, `/api/collections/assignments/${assignment.id}/attempts`, {
      channel: 'phone',
      outcome: 'contacted',
      notes: 'Spoke to borrower',
    });
    expect(attemptRes.ok()).toBeTruthy();

    const updatedRes = await page.request.get('/api/collections/assignments');
    const list = await updatedRes.json() as Assignment[];
    const updated = list.find(a => a.id === assignment.id);
    expect(updated?.status).toBe('in_progress');

    await assertNewAuditEntry(page, 'TRACE_COLLECTION_ATTEMPT', assignment.id, snapshot);
  });

  test('status auto-transitions: → promised on promise_to_pay outcome', async ({ page }) => {
    const borrowerId = await getFirstBorrowerId(page);

    const createRes = await postWithCSRF(page, '/api/collections/assignments', {
      borrowerId,
      priority: 'high',
      notes: 'E2E promise-to-pay test',
    });
    expect(createRes.ok()).toBeTruthy();
    const assignment = await createRes.json() as Assignment;

    const attemptRes = await postWithCSRF(page, `/api/collections/assignments/${assignment.id}/attempts`, {
      channel: 'phone',
      outcome: 'promise_to_pay',
      promisedAmount: '2500',
      promisedDate: '2026-05-01',
      notes: 'Borrower promised to pay by end of month',
    });
    expect(attemptRes.ok()).toBeTruthy();

    const updatedRes = await page.request.get('/api/collections/assignments');
    const list = await updatedRes.json() as Assignment[];
    const updated = list.find(a => a.id === assignment.id);
    expect(updated?.status).toBe('promised');
  });

  test('status auto-transitions: → resolved on paid outcome', async ({ page }) => {
    const borrowerId = await getFirstBorrowerId(page);

    const createRes = await postWithCSRF(page, '/api/collections/assignments', {
      borrowerId,
      priority: 'urgent',
      notes: 'E2E paid outcome test',
    });
    expect(createRes.ok()).toBeTruthy();
    const assignment = await createRes.json() as Assignment;

    const attemptRes = await postWithCSRF(page, `/api/collections/assignments/${assignment.id}/attempts`, {
      channel: 'email',
      outcome: 'paid',
      notes: 'Confirmed payment received',
    });
    expect(attemptRes.ok()).toBeTruthy();

    const updatedRes = await page.request.get('/api/collections/assignments');
    const list = await updatedRes.json() as Assignment[];
    const updated = list.find(a => a.id === assignment.id);
    expect(updated?.status).toBe('resolved');
  });

  test('end-to-end status chain: open → in_progress → promised → resolved on single assignment', async ({ page }) => {
    const borrowerId = await getFirstBorrowerId(page);

    const createRes = await postWithCSRF(page, '/api/collections/assignments', {
      borrowerId,
      priority: 'high',
      notes: 'E2E full status chain test',
    });
    expect(createRes.ok()).toBeTruthy();
    const assignment = await createRes.json() as Assignment;
    expect(assignment.status).toBe('open');
    const id = assignment.id;

    const getStatus = async (): Promise<string> => {
      const r = await page.request.get('/api/collections/assignments');
      const list = await r.json() as Assignment[];
      return list.find(a => a.id === id)?.status ?? '';
    };

    const att1 = await postWithCSRF(page, `/api/collections/assignments/${id}/attempts`, {
      channel: 'phone',
      outcome: 'contacted',
      notes: 'First contact made',
    });
    expect(att1.ok()).toBeTruthy();
    expect(await getStatus()).toBe('in_progress');

    const att2 = await postWithCSRF(page, `/api/collections/assignments/${id}/attempts`, {
      channel: 'phone',
      outcome: 'promise_to_pay',
      promisedAmount: '3500',
      promisedDate: '2026-06-01',
      notes: 'Borrower committed to pay',
    });
    expect(att2.ok()).toBeTruthy();
    expect(await getStatus()).toBe('promised');

    const att3 = await postWithCSRF(page, `/api/collections/assignments/${id}/attempts`, {
      channel: 'email',
      outcome: 'paid',
      notes: 'Payment received and confirmed',
    });
    expect(att3.ok()).toBeTruthy();
    expect(await getStatus()).toBe('resolved');

    const auditLogsRes = await page.request.get('/api/audit-logs');
    const allLogs = await auditLogsRes.json() as AuditLog[];
    const attemptLogs = allLogs.filter(l => l.action === 'TRACE_COLLECTION_ATTEMPT' && l.entityId === id);
    expect(attemptLogs.length).toBeGreaterThanOrEqual(3);

    const attemptsRes = await page.request.get(`/api/collections/assignments/${id}/attempts`);
    const attempts = await attemptsRes.json() as Attempt[];
    expect(attempts.length).toBeGreaterThanOrEqual(3);
    expect(attempts.some(a => a.outcome === 'contacted')).toBeTruthy();
    expect(attempts.some(a => a.outcome === 'promise_to_pay')).toBeTruthy();
    expect(attempts.some(a => a.outcome === 'paid')).toBeTruthy();
  });

  test('attempts list API returns logged attempts for an assignment', async ({ page }) => {
    const borrowerId = await getFirstBorrowerId(page);

    const createRes = await postWithCSRF(page, '/api/collections/assignments', {
      borrowerId,
      priority: 'medium',
      notes: 'E2E attempts list test',
    });
    const assignment = await createRes.json() as Assignment;

    await postWithCSRF(page, `/api/collections/assignments/${assignment.id}/attempts`, {
      channel: 'sms',
      outcome: 'left_message',
      notes: 'Left voicemail',
    });
    await postWithCSRF(page, `/api/collections/assignments/${assignment.id}/attempts`, {
      channel: 'phone',
      outcome: 'no_answer',
    });

    const attemptsRes = await page.request.get(`/api/collections/assignments/${assignment.id}/attempts`);
    expect(attemptsRes.ok()).toBeTruthy();
    const attempts = await attemptsRes.json() as Attempt[];
    expect(attempts.length).toBeGreaterThanOrEqual(2);
    expect(attempts.some(a => a.outcome === 'left_message')).toBeTruthy();
    expect(attempts.some(a => a.outcome === 'no_answer')).toBeTruthy();
  });

  test('Collections page renders and New Assignment button opens dialog', async ({ page }) => {
    await page.goto('/collections');
    await page.waitForLoadState('domcontentloaded');

    await expect(page.locator('h1')).toContainText('Collections', { timeout: 10000 });

    const newBtn = page.locator('[data-testid="button-new-collection"]');
    await expect(newBtn).toBeVisible({ timeout: 5000 });
    await newBtn.click();

    await expect(page.locator('text=New Collection Assignment')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('[data-testid="input-borrower-id"]')).toBeVisible({ timeout: 5000 });
  });

  test('Collections UI creates assignment through form', async ({ page }) => {
    const borrowerId = await getFirstBorrowerId(page);

    await page.goto('/collections');
    await page.waitForLoadState('domcontentloaded');

    await page.locator('[data-testid="button-new-collection"]').click();
    await expect(page.locator('[data-testid="input-borrower-id"]')).toBeVisible({ timeout: 5000 });

    await page.locator('[data-testid="input-borrower-id"]').fill(borrowerId);

    const [createRes] = await Promise.all([
      page.waitForResponse(r => r.url().includes('/api/collections/assignments') && r.request().method() === 'POST', { timeout: 10000 }),
      page.locator('[data-testid="button-create-assignment"]').click(),
    ]);
    expect(createRes.ok()).toBeTruthy();
    const assignment = await createRes.json() as Assignment;
    expect(assignment.id).toBeTruthy();
    expect(assignment.borrowerId).toBe(borrowerId);
  });

  test('Collections UI log attempt dialog opens and saves', async ({ page }) => {
    const borrowerId = await getFirstBorrowerId(page);

    const createRes = await postWithCSRF(page, '/api/collections/assignments', {
      borrowerId,
      priority: 'medium',
      notes: 'E2E UI log attempt test',
    });
    const assignment = await createRes.json() as Assignment;

    await page.goto('/collections');
    await page.waitForLoadState('domcontentloaded');

    await page.waitForSelector(`[data-testid="button-attempt-${assignment.id}"]`, { timeout: 10000 });
    await page.locator(`[data-testid="button-attempt-${assignment.id}"]`).click();
    await expect(page.locator('text=Log Contact Attempt')).toBeVisible({ timeout: 5000 });

    const [attemptRes] = await Promise.all([
      page.waitForResponse(r => r.url().includes('/api/collections/assignments') && r.url().includes('/attempts') && r.request().method() === 'POST', { timeout: 10000 }),
      page.locator('[data-testid="button-save-attempt"]').click(),
    ]);
    expect(attemptRes.ok()).toBeTruthy();
  });

  test('Collections status filter tabs work', async ({ page }) => {
    await page.goto('/collections');
    await page.waitForLoadState('domcontentloaded');

    await expect(page.locator('h1')).toContainText('Collections', { timeout: 10000 });

    await page.locator('[role="tab"]', { hasText: 'Open' }).click();
    await expect(
      page.locator('table').or(page.locator('text=No collection assignments'))
    ).toBeVisible({ timeout: 8000 });

    await page.locator('[role="tab"]', { hasText: 'Resolved' }).click();
    await expect(
      page.locator('table').or(page.locator('text=No collection assignments'))
    ).toBeVisible({ timeout: 8000 });
  });
});
