import { expect, test } from "@playwright/test";

async function setSession(page: import("@playwright/test").Page) {
  await page.context().clearCookies();
  const response = await page.request.post("/api/test/set-session", { data: { username: "platform_admin" } });
  expect(response.ok()).toBeTruthy();
}

test.describe("Bank Control Centre pilot journey", () => {
  test("governs a bank mapping and persists masked reconciliation exceptions", async ({ page }) => {
    await page.context().clearCookies();
    let session = await page.request.post("/api/test/set-session", { data: { username: "platform_admin" } });
    expect(session.ok()).toBeTruthy();
    const organizationsResponse = await page.request.get("/api/admin/organizations/list");
    expect(organizationsResponse.status()).toBe(200);
    const organizations = await organizationsResponse.json() as Array<{ id: string; country: string }>;
    const organization = organizations.find((item) => item.country === "Ghana") || organizations[0];
    expect(organization).toBeTruthy();
    const scopeQuery = `orgId=${encodeURIComponent(organization!.id)}&country=${encodeURIComponent(organization!.country)}`;
    const suffix = Date.now().toString();
    const fieldMappings = {
      accountNumber: "facility_id", currentBalance: "balance", currency: "ccy", status: "account_status",
      daysInArrears: "dpd", reportingDate: "as_of_date", lenderInstitution: "bank", ifrs9Stage: "ifrs_stage",
    };
    const created = await page.request.post(`/api/loan-tape-reconciliation/profiles?${scopeQuery}`, {
      data: { name: `E2E controlled mapping ${suffix}`, bankName: "E2E Ghana Bank", sourceSystem: "Synthetic core", version: suffix, fieldMappings, validationRules: {} },
    });
    expect(created.status(), await created.text()).toBe(201);
    const createdBody = await created.json() as { id: string };
    session = await page.request.post("/api/test/set-session", { data: { username: "admin" } });
    expect(session.ok()).toBeTruthy();
    const reviewed = await page.request.patch(`/api/loan-tape-reconciliation/profiles/${createdBody.id}/review?${scopeQuery}`, {
      data: { decision: "approved", reviewNotes: "E2E independent checker confirmed the controlled synthetic source mapping." },
    });
    expect(reviewed.status(), await reviewed.text()).toBe(200);

    session = await page.request.post("/api/test/set-session", { data: { username: "platform_admin" } });
    expect(session.ok()).toBeTruthy();
    const validation = await page.request.post(`/api/loan-tape-reconciliation/validate?${scopeQuery}`, {
      data: {
        mappingProfileId: createdBody.id,
        reportingDate: "2026-08-31",
        originalFilename: "e2e-controlled-loan-tape.csv",
        csvData: "facility_id,balance,ccy,account_status,dpd,as_of_date,bank,ifrs_stage\nE2E-SECRET-9876,100000,GHS,current,112,2026-08-31,E2E Ghana Bank,2",
      },
    });
    expect(validation.status(), await validation.text()).toBe(201);
    const run = await validation.json() as { id: string; status: string; rawRowsRetained: boolean; exceptionCount: number };
    expect(run).toMatchObject({ status: "blocked", rawRowsRetained: false });
    expect(run.exceptionCount).toBeGreaterThan(0);
    const exceptionResponse = await page.request.get(`/api/loan-tape-reconciliation/imports/${run.id}/exceptions?${scopeQuery}`);
    expect(exceptionResponse.status()).toBe(200);
    const exceptionText = await exceptionResponse.text();
    expect(exceptionText).toContain("***9876");
    expect(exceptionText).not.toContain("E2E-SECRET-9876");
  });

  test("opens the controlled bank risk diagnostic and keeps its data boundary visible", async ({ page }) => {
    await setSession(page);
    await page.goto("/bank-control-center");

    await page.getByTestId("button-start-bank-diagnostic").click();
    await expect(page).toHaveURL(/\/bank-risk-diagnostic$/);
    await expect(page.getByTestId("bank-risk-diagnostic")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Find the risk. Prove the gap. Fix what matters." })).toBeVisible();
    await expect(page.getByTestId("diagnostic-safety-boundary")).toContainText("unrestricted server access");
    await expect(page.getByTestId("diagnostic-selected-count")).toContainText("3 selected");

    await page.getByTestId("button-toggle-diagnostic-operations").click();
    await expect(page.getByTestId("diagnostic-selected-count")).toContainText("4 selected");
    await page.getByTestId("diagnostic-step-intake").click();
    await page.getByTestId("button-diagnostic-data-intake").click();
    await expect(page).toHaveURL(/\/batch-upload$/);
  });

  test("guides a staff user from a bank outcome to the three-step pilot path", async ({ page }) => {
    await setSession(page);
    await page.goto("/bank-control-center");

    await expect(page.getByTestId("bank-control-center")).toBeVisible();
    await expect(page.getByRole("heading", { name: "What needs your attention today?" })).toBeVisible();
    await expect(page.getByTestId("control-npl")).toBeVisible();
    await expect(page.getByTestId("control-compliance")).toBeVisible();
    await page.getByTestId("button-open-integration-readiness").click();
    await expect(page).toHaveURL(/\/bank-integration-readiness$/);
    await expect(page.getByTestId("bank-integration-readiness")).toBeVisible();
    await expect(page.getByTestId("integration-core-banking")).toContainText("Bank contract required");

    await page.goto("/bank-control-center");

    await page.getByTestId("button-start-bank-pilot").click();
    await expect(page).toHaveURL(/\/bank-pilot-readiness$/);
    await expect(page.getByTestId("bank-pilot-readiness")).toBeVisible();
    await expect(page.getByTestId("pilot-step-1")).toContainText("Load the pilot loan tape");
    await expect(page.getByTestId("pilot-step-2")).toContainText("Run controlled risk and consent decisions");
    await expect(page.getByTestId("pilot-step-3")).toContainText("Govern provision and evidence");

    await page.getByTestId("button-pilot-step-2").click();
    await expect(page).toHaveURL(/\/npl-early-warning$/);
    await expect(page.getByTestId("npl-early-warning-desk")).toBeVisible();
    await expect(page.getByTestId("npl-pilot-data-quality")).toBeVisible();
    await expect(page.getByTestId("npl-pilot-control-strip")).toBeVisible();
    await expect(page.getByTestId("npl-reduction-plan")).toBeVisible();
    await expect(page.getByTestId("npl-macro-risk-overlay")).toBeVisible();
    const nplPlan = await page.request.get("/api/npl-reduction-plan");
    expect(nplPlan.status()).toBe(200);
    const nplPlanBody = await nplPlan.json();
    expect(nplPlanBody).toHaveProperty("methodology");
    expect(nplPlanBody).toHaveProperty("portfolioReadyForPlan");
    const caseLedgerLink = page.locator('[data-testid^="open-npl-case-"]').first();
    await expect(caseLedgerLink).toBeVisible();
    await caseLedgerLink.click();
    await expect(page).toHaveURL(/\/npl-case-ledger\?creditAccountId=/);
    await expect(page.getByTestId("npl-case-ledger-page")).toBeVisible();
    await expect(page.getByTestId("npl-ledger-safety-boundary")).toContainText("Append-only evidence");
    if (await page.getByTestId("open-npl-case-form").isVisible().catch(() => false)) {
      await page.getByLabel("Opening evidence reference").fill(`E2E-CASE-${Date.now()}`);
      await page.getByLabel("Opening rationale").fill("E2E controlled at-risk facility case opening evidence.");
      await page.getByTestId("open-npl-case").click();
    }
    await expect(page.getByTestId("append-npl-event-form")).toBeVisible();
    await page.getByLabel("Evidence note").fill("E2E append-only chronology verification note.");
    await page.getByTestId("append-npl-event").click();
    await expect(page.getByTestId("npl-event-timeline")).toContainText("E2E append-only chronology verification note.");
    await page.getByTestId("open-npl-decision-governance").click();
    await expect(page).toHaveURL(/\/npl-decision-governance\?caseId=/);
    const governedCaseId = new URL(page.url()).searchParams.get("caseId");
    expect(governedCaseId).toBeTruthy();
    await expect(page.getByTestId("npl-decision-safety-boundary")).toContainText("No silent accounting");
    await page.getByLabel("Proposed effective date").fill(new Date().toISOString().slice(0, 10));
    await page.getByLabel("Policy / committee mandate").fill("E2E-CREDIT-COMMITTEE-POLICY");
    await page.getByLabel("Source evidence reference").fill(`E2E-DECISION-${Date.now()}`);
    await page.getByLabel("Rationale").fill("E2E controlled restructure proposal requiring an independent authorised checker before bank execution.");
    await page.getByTestId("submit-npl-decision").click();
    const decisionRegister = page.getByTestId("npl-decision-register");
    await expect(decisionRegister).toContainText("Awaiting a different authorised checker");
    const decisionResponse = await page.request.get(`/api/npl-cases/${governedCaseId}/decisions`);
    expect(decisionResponse.status()).toBe(200);
    const decisionBody = await decisionResponse.json() as { decisions: Array<{ id: string; status: string }> };
    const proposal = decisionBody.decisions[0];
    expect(proposal.status).toBe("pending");
    const selfReview = await page.request.post(`/api/npl-decisions/${proposal.id}/review`, { data: { decision: "approved", reviewNotes: "Maker attempted to approve the same controlled proposal." } });
    expect(selfReview.status()).toBe(403);

    let checkerSession = await page.request.post("/api/test/set-session", { data: { username: "admin" } });
    expect(checkerSession.ok()).toBeTruthy();
    await page.reload();
    await page.getByLabel(`Review notes ${proposal.id}`).fill("Independent checker confirmed policy authority, evidence and affordability safeguards.");
    await page.getByTestId(`approve-npl-decision-${proposal.id}`).click();
    await expect(page.getByTestId(`npl-decision-${proposal.id}`)).toContainText("approved");
    const checkerExecution = await page.request.post(`/api/npl-decisions/${proposal.id}/execution`, { data: { executionDate: new Date().toISOString().slice(0, 10), executionEvidenceReference: "E2E-CHECKER-EXECUTION", executionNotes: "Checker attempted to execute the same approval and must be blocked." } });
    expect(checkerExecution.status()).toBe(400);

    checkerSession = await page.request.post("/api/test/set-session", { data: { username: "platform_admin" } });
    expect(checkerSession.ok()).toBeTruthy();
    await page.reload();
    await page.getByLabel(`Execution evidence ${proposal.id}`).fill("E2E-CORE-EXECUTION-REF");
    await page.getByLabel(`Execution notes ${proposal.id}`).fill("Bank-side restructure execution was evidenced; authoritative account reconciliation remains outstanding.");
    await page.getByTestId(`execute-npl-decision-${proposal.id}`).click();
    await expect(page.getByTestId(`npl-decision-${proposal.id}`)).toContainText("execution recorded");
    const decisionEvents = await page.request.get(`/api/npl-cases/${governedCaseId}/events`);
    expect(decisionEvents.status()).toBe(200);
    const decisionEventBody = await decisionEvents.json() as Array<{ eventType: string }>;
    expect(decisionEventBody.map((item) => item.eventType)).toEqual(expect.arrayContaining(["decision_submitted", "decision_approved", "decision_execution_recorded"]));

    const waterfall = await page.request.get("/api/npl-cases/waterfall/summary");
    expect(waterfall.status()).toBe(200);
    const waterfallBody = await waterfall.json();
    expect(waterfallBody).toHaveProperty("consolidated");
    expect(Array.isArray(waterfallBody.series)).toBe(true);
    expect(waterfallBody.series[0]).toHaveProperty("authoritativeDifference");

    await page.goto("/npl-early-warning");
    await page.getByTestId("open-loan-tape-reconciliation").click();
    await expect(page).toHaveURL(/\/loan-tape-reconciliation$/);
    await expect(page.getByTestId("loan-tape-reconciliation-page")).toBeVisible();
    await expect(page.getByTestId("mapping-profile-form")).toBeVisible();
    await expect(page.getByTestId("loan-tape-validation-form")).toContainText("never writes to credit accounts");
    const mappingProfiles = await page.request.get("/api/loan-tape-reconciliation/profiles");
    expect(mappingProfiles.status()).toBe(200);
    const reconciliationRuns = await page.request.get("/api/loan-tape-reconciliation/imports");
    expect(reconciliationRuns.status()).toBe(200);

    await page.goto("/npl-early-warning");
    const macroRisk = await page.request.get("/api/npl-early-warning/macro-risk");
    expect(macroRisk.status()).toBe(200);
    const macroRiskBody = await macroRisk.json();
    expect(macroRiskBody.country).toBe("Ghana");
    expect(macroRiskBody.profile?.dataStatus).toBe("bank_configuration_required");
    expect(Array.isArray(macroRiskBody.sectorExposure)).toBe(true);

    await page.goto("/consent");
    await expect(page.getByTestId("consent-evidence-gate")).toBeVisible();
    await expect(page.getByTestId("button-request-customer-consent")).toBeVisible();
    await page.getByTestId("button-open-forgery-review").click();
    await expect(page).toHaveURL(/\/forgery-review$/);
    await expect(page.getByTestId("forgery-review-desk")).toBeVisible();
  });
});
