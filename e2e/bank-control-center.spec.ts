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
