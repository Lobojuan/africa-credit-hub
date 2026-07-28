import { expect, test } from "@playwright/test";

test.describe("Transaction resolution controls", () => {
  test("prevents a case from bypassing verification and core handoff", async ({ page }) => {
    await page.goto("/transaction-resolution");
    await expect(page.getByTestId("transaction-resolution-desk")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Transaction Resolution Desk" })).toBeVisible();

    const borrowers = await page.request.get("/api/borrowers?country=Ghana&limit=1");
    expect(borrowers.ok()).toBeTruthy();
    const borrowerBody = await borrowers.json() as { data?: Array<{ id: string }> };
    const borrowerId = borrowerBody.data?.[0]?.id;
    expect(borrowerId).toBeTruthy();

    const opened = await page.request.post("/api/transaction-resolution-cases", {
      data: {
        borrowerId,
        transactionReference: `E2E-RESOLUTION-${Date.now()}`,
        caseType: "failed_transfer",
        channel: "mobile",
        amount: 25,
        currency: "GHS",
        customerMessage: "E2E workflow control check",
      },
    });
    expect(opened.status()).toBe(201);
    const created = await opened.json() as { id: string };

    const skipped = await page.request.patch(`/api/transaction-resolution-cases/${created.id}`, {
      data: { status: "confirmed_resolved", resolutionNotes: "Core reference not applicable" },
    });
    expect(skipped.status()).toBe(409);

    for (const status of ["verifying", "ready_for_core_handoff", "confirmed_resolved"]) {
      const updated = await page.request.patch(`/api/transaction-resolution-cases/${created.id}`, {
        data: { status, resolutionNotes: `E2E controlled step: ${status}` },
      });
      expect(updated.status(), await updated.text()).toBe(200);
    }
  });
});
