import { expect, test } from "@playwright/test";

async function setSession(page: import("@playwright/test").Page) {
  await page.context().clearCookies();
  const response = await page.request.post("/api/test/set-session", { data: { username: "platform_admin" } });
  expect(response.ok()).toBeTruthy();
}

test.describe("Bank Control Centre pilot journey", () => {
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
