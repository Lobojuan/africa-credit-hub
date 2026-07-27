import { expect, test } from "@playwright/test";

test("Bank Control Centre gives an administrator the six operational control paths", async ({ page }) => {
  await page.context().clearCookies();
  const session = await page.request.post("/api/test/set-session", { data: { username: "admin" } });
  expect(session.ok()).toBeTruthy();

  await page.goto("/bank-control-center");
  await expect(page.getByTestId("bank-control-center")).toBeVisible();
  await expect(page.getByRole("heading", { name: "What needs your attention today?" })).toBeVisible();

  for (const control of ["fraud", "resolution", "npl", "compliance", "prudential", "board-risk"]) {
    await expect(page.getByTestId(`control-${control}`)).toBeVisible();
    await expect(page.getByTestId(`control-${control}-open`)).toBeVisible();
  }
  await expect(page.getByTestId("bank-control-guardrail")).toBeVisible();
});
