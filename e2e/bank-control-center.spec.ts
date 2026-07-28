import { expect, test } from "@playwright/test";

test.describe("Bank Control Centre pilot journey", () => {
  test("guides a staff user from a bank outcome to the three-step pilot path", async ({ page }) => {
    await page.goto("/bank-control-center");

    await expect(page.getByTestId("bank-control-center")).toBeVisible();
    await expect(page.getByRole("heading", { name: "What needs your attention today?" })).toBeVisible();
    await expect(page.getByTestId("control-npl")).toBeVisible();
    await expect(page.getByTestId("control-compliance")).toBeVisible();

    await page.getByTestId("button-start-bank-pilot").click();
    await expect(page).toHaveURL(/\/bank-pilot-readiness$/);
    await expect(page.getByTestId("bank-pilot-readiness")).toBeVisible();
    await expect(page.getByTestId("pilot-step-1")).toContainText("Load the pilot loan tape");
    await expect(page.getByTestId("pilot-step-2")).toContainText("Run controlled risk and consent decisions");
    await expect(page.getByTestId("pilot-step-3")).toContainText("Prove the control works");

    await page.getByTestId("button-pilot-step-2").click();
    await expect(page).toHaveURL(/\/npl-early-warning$/);
    await expect(page.getByTestId("npl-early-warning-desk")).toBeVisible();
    await expect(page.getByTestId("npl-pilot-data-quality")).toBeVisible();
    await expect(page.getByTestId("npl-pilot-control-strip")).toBeVisible();

    await page.goto("/consent");
    await expect(page.getByTestId("consent-evidence-gate")).toBeVisible();
    await expect(page.getByTestId("button-request-customer-consent")).toBeVisible();
    await page.getByTestId("button-open-forgery-review").click();
    await expect(page).toHaveURL(/\/forgery-review$/);
    await expect(page.getByTestId("forgery-review-desk")).toBeVisible();
  });
});
