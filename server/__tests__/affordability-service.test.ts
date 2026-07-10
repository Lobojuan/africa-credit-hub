import { describe, it, expect } from "vitest";
import { classifyIncome, categoriseExpenses, type NormalisedTxn } from "../affordability-service";

function txn(daysAgo: number, amount: number, direction: "credit" | "debit", opts: Partial<NormalisedTxn> = {}): NormalisedTxn {
  const date = new Date(Date.now() - daysAgo * 86400000);
  return { date, amount, currency: "GHS", direction, counterparty: "EMPLOYER LTD", narration: "salary", ...opts };
}

describe("classifyIncome", () => {
  it("does not overstate income via the N/(N-1) span bug (A1)", () => {
    // 3 monthly salary credits: the gap between first and last is only 2 months,
    // but the real observation period (passed in as periodMonths) is 3 months.
    const txns: NormalisedTxn[] = [
      txn(60, 1000, "credit", { narration: "salary payment" }),
      txn(30, 1000, "credit", { narration: "salary payment" }),
      txn(0, 1000, "credit", { narration: "salary payment" }),
    ];
    const result = classifyIncome(txns, "GHS", 3);
    expect(result).toHaveLength(1);
    // 3000 total / 3 real months = 1000/mo, NOT 3000/2 = 1500/mo (the old N/(N-1) bug)
    expect(result[0].amountMonthly).toBe(1000);
  });

  it("excludes loan disbursements from income (A2)", () => {
    const txns: NormalisedTxn[] = [
      txn(60, 500, "credit", { counterparty: "QUICKLOAN APP", narration: "loan disbursement", category: "loan_disbursement" }),
      txn(30, 500, "credit", { counterparty: "QUICKLOAN APP", narration: "loan disbursement", category: "loan_disbursement" }),
      txn(0, 500, "credit", { counterparty: "QUICKLOAN APP", narration: "loan disbursement", category: "loan_disbursement" }),
    ];
    const result = classifyIncome(txns, "GHS", 3);
    expect(result).toHaveLength(0);
  });

  it("excludes savings withdrawals from income (A2)", () => {
    const txns: NormalisedTxn[] = [
      txn(60, 800, "credit", { counterparty: "MY SAVINGS", narration: "savings withdrawal", category: "savings_withdrawal" }),
      txn(0, 800, "credit", { counterparty: "MY SAVINGS", narration: "savings withdrawal", category: "savings_withdrawal" }),
    ];
    const result = classifyIncome(txns, "GHS", 2);
    expect(result).toHaveLength(0);
  });

  it("still counts genuine recurring income normally", () => {
    const txns: NormalisedTxn[] = [
      txn(60, 1000, "credit", { counterparty: "ACME CORP", narration: "salary" }),
      txn(30, 1000, "credit", { counterparty: "ACME CORP", narration: "salary" }),
      txn(0, 1000, "credit", { counterparty: "ACME CORP", narration: "salary" }),
    ];
    const result = classifyIncome(txns, "GHS", 3);
    expect(result).toHaveLength(1);
    expect(result[0].sourceType).toBe("salary");
  });
});

describe("categoriseExpenses", () => {
  it("uses the shared period (not its own debits-only span) so it matches income normalization (A1)", async () => {
    const txns: NormalisedTxn[] = [
      txn(60, 300, "debit", { counterparty: "LANDLORD", narration: "rent" }),
      txn(30, 300, "debit", { counterparty: "LANDLORD", narration: "rent" }),
      txn(0, 300, "debit", { counterparty: "LANDLORD", narration: "rent" }),
    ];
    const result = await categoriseExpenses(txns, "GHS", 3, false);
    const rent = result.find(e => e.category === "rent");
    expect(rent).toBeDefined();
    // 900 total / 3 real months = 300/mo, not 900/2 = 450/mo
    expect(rent!.amountMonthly).toBe(300);
  });
});
