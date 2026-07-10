import { describe, it, expect } from "vitest";
import { calculateCreditScore } from "../credit-score";

describe("calculateCreditScore", () => {
  it("returns 600 for thin file (no accounts)", () => {
    const result = calculateCreditScore([], 0);
    expect(result.score).toBe(600);
    expect(result.reasonCodes).toContain("THIN_FILE_LIMITED_HISTORY");
  });

  it("does not boost thin-file score from zero-transaction alt-data sources (F2)", () => {
    const altData = [
      { source: "mobile_money", totalTransactions: 0, onTimePayments: 0, latePayments: 0, status: "active" },
      { source: "utility", totalTransactions: 0, onTimePayments: 0, latePayments: 0, status: "active" },
    ];
    const result = calculateCreditScore([], 0, [], false, altData);
    expect(result.score).toBe(600);
  });

  it("returns high score for all current accounts, no inquiries", () => {
    const accounts = [
      { status: "current", currentBalance: "5000" },
      { status: "current", currentBalance: "10000" },
      { status: "current", currentBalance: "3000" },
    ];
    const result = calculateCreditScore(accounts, 0);
    expect(result.score).toBe(800);
    expect(result.reasonCodes).toContain("EXCELLENT_PAYMENT_RECORD");
    expect(result.reasonCodes).toContain("STRONG_REPAYMENT_HISTORY");
  });

  it("penalizes delinquent accounts", () => {
    const accounts = [
      { status: "current", currentBalance: "5000" },
      { status: "delinquent", currentBalance: "20000" },
    ];
    const result = calculateCreditScore(accounts, 0);
    expect(result.score).toBeLessThan(750);
    expect(result.reasonCodes).toContain("DELINQUENT_ACCOUNTS");
  });

  it("penalizes written-off accounts heavily", () => {
    const accounts = [
      { status: "current", currentBalance: "5000" },
      { status: "written_off", currentBalance: "50000" },
    ];
    const result = calculateCreditScore(accounts, 0);
    const allCurrent = calculateCreditScore(
      [{ status: "current", currentBalance: "5000" }, { status: "current", currentBalance: "50000" }],
      0
    );
    expect(result.score).toBeLessThan(allCurrent.score);
    expect(result.reasonCodes).toContain("WRITTEN_OFF_ACCOUNTS");
  });

  it("penalizes restructured accounts", () => {
    const accounts = [
      { status: "current", currentBalance: "5000" },
      { status: "restructured", currentBalance: "10000" },
    ];
    const result = calculateCreditScore(accounts, 0);
    expect(result.reasonCodes).toContain("RESTRUCTURED_ACCOUNTS");
  });

  it("penalizes court judgments", () => {
    const accounts = [{ status: "current", currentBalance: "5000" }];
    const judgments = [{ status: "active" }, { status: "active" }];
    const result = calculateCreditScore(accounts, 0, judgments);
    expect(result.reasonCodes).toContain("ACTIVE_COURT_JUDGMENTS");
    expect(result.score).toBeLessThan(800);
  });

  it("penalizes high inquiry volume", () => {
    const accounts = [{ status: "current", currentBalance: "5000" }];
    const lowInquiry = calculateCreditScore(accounts, 1);
    const highInquiry = calculateCreditScore(accounts, 15);
    expect(highInquiry.score).toBeLessThan(lowInquiry.score);
    expect(highInquiry.reasonCodes).toContain("HIGH_INQUIRY_VOLUME");
  });

  it("caps inquiry penalty at 20 inquiries", () => {
    const accounts = [{ status: "current", currentBalance: "5000" }];
    const at20 = calculateCreditScore(accounts, 20);
    const at30 = calculateCreditScore(accounts, 30);
    expect(at20.score).toBe(at30.score);
  });

  it("flags high debt level", () => {
    const accounts = [{ status: "current", currentBalance: "2000000" }];
    const result = calculateCreditScore(accounts, 0);
    expect(result.reasonCodes).toContain("HIGH_DEBT_LEVEL");
  });

  it("flags PEP status", () => {
    const accounts = [{ status: "current", currentBalance: "5000" }];
    const result = calculateCreditScore(accounts, 0, [], true);
    expect(result.reasonCodes).toContain("POLITICALLY_EXPOSED_PERSON");
  });

  it("boosts score with alternative data", () => {
    const accounts = [{ status: "current", currentBalance: "5000" }];
    const altData = [
      { source: "mobile_money", totalTransactions: 50, onTimePayments: 48, latePayments: 2, status: "active" },
    ];
    const withAlt = calculateCreditScore(accounts, 0, [], false, altData);
    const withoutAlt = calculateCreditScore(accounts, 0, [], false, []);
    expect(withAlt.score).toBeGreaterThan(withoutAlt.score);
  });

  it("flags strong alternative data", () => {
    const accounts = [{ status: "current", currentBalance: "5000" }];
    const altData = [
      { source: "mobile_money", totalTransactions: 50, onTimePayments: 48, latePayments: 2, status: "active" },
    ];
    const result = calculateCreditScore(accounts, 0, [], false, altData);
    expect(result.reasonCodes).toContain("STRONG_ALTERNATIVE_DATA");
  });

  it("ignores alt-data sources with a fabricated single-transaction history (F2)", () => {
    const accounts = [{ status: "current", currentBalance: "5000" }];
    const altData = [
      { source: "mobile_money", totalTransactions: 1, onTimePayments: 1, latePayments: 0, status: "active" },
      { source: "utility", totalTransactions: 1, onTimePayments: 1, latePayments: 0, status: "active" },
      { source: "rent", totalTransactions: 1, onTimePayments: 1, latePayments: 0, status: "active" },
    ];
    const withThinAlt = calculateCreditScore(accounts, 0, [], false, altData);
    const withoutAlt = calculateCreditScore(accounts, 0, [], false, []);
    expect(withThinAlt.score).toBe(withoutAlt.score);
    expect(withThinAlt.factors.some(f => f.name === "Alternative Data")).toBe(false);
  });

  it("ignores inactive alternative data", () => {
    const accounts = [{ status: "current", currentBalance: "5000" }];
    const altData = [
      { source: "mobile_money", totalTransactions: 50, onTimePayments: 48, latePayments: 2, status: "inactive" },
    ];
    const withInactive = calculateCreditScore(accounts, 0, [], false, altData);
    const withoutAlt = calculateCreditScore(accounts, 0, [], false, []);
    expect(withInactive.score).toBe(withoutAlt.score);
  });

  it("penalizes high utilization ratio", () => {
    const accounts = [
      { status: "current", currentBalance: "80000", creditLimit: "100000" },
      { status: "current", currentBalance: "45000", creditLimit: "50000" },
    ];
    const result = calculateCreditScore(accounts, 0);
    const utilizationFactor = result.factors.find(f => f.name === "Utilization Ratio");
    expect(utilizationFactor).toBeDefined();
    expect(utilizationFactor!.impact).toBeLessThan(0);
    expect(utilizationFactor!.direction).toBe("negative");
    expect(result.reasonCodes).toContain("HIGH_UTILIZATION");
  });

  it("rewards low utilization ratio", () => {
    const accounts = [
      { status: "current", currentBalance: "5000", creditLimit: "100000" },
      { status: "current", currentBalance: "2000", creditLimit: "50000" },
    ];
    const result = calculateCreditScore(accounts, 0);
    const utilizationFactor = result.factors.find(f => f.name === "Utilization Ratio");
    expect(utilizationFactor).toBeDefined();
    expect(utilizationFactor!.impact).toBe(0);
    expect(utilizationFactor!.direction).toBe("positive");
    expect(result.reasonCodes).toContain("LOW_UTILIZATION");
  });

  it("handles accounts without credit limits gracefully", () => {
    const accounts = [
      { status: "current", currentBalance: "5000" },
      { status: "current", currentBalance: "10000" },
    ];
    const result = calculateCreditScore(accounts, 0);
    const utilizationFactor = result.factors.find(f => f.name === "Utilization Ratio");
    expect(utilizationFactor).toBeDefined();
    expect(utilizationFactor!.impact).toBe(0);
    expect(utilizationFactor!.direction).toBe("neutral");
  });

  // F1 regression: real DB rows have NO creditLimit column. Utilization must
  // still compute for revolving facilities by falling back to originalAmount,
  // otherwise the 15%-weight factor is dead code for every production borrower.
  it("computes utilization for revolving accounts from originalAmount when creditLimit is absent", () => {
    const accounts = [
      { status: "current", accountType: "credit_card", originalAmount: "100000", currentBalance: "90000" },
      { status: "current", accountType: "commercial_bank_overdraft", originalAmount: "50000", currentBalance: "48000" },
    ];
    const result = calculateCreditScore(accounts, 0);
    const utilizationFactor = result.factors.find(f => f.name === "Utilization Ratio");
    expect(utilizationFactor).toBeDefined();
    expect(utilizationFactor!.impact).toBeLessThan(0); // ~92% utilization must penalize
    expect(utilizationFactor!.direction).toBe("negative");
    expect(result.reasonCodes).toContain("HIGH_UTILIZATION");
  });

  // Term loans are drawn in full and paid down — utilization does not apply,
  // so they must NOT be forced to 0% and must NOT emit a utilization signal.
  it("excludes term loans (no creditLimit) from utilization", () => {
    const accounts = [
      { status: "current", accountType: "personal_loan", originalAmount: "100000", currentBalance: "60000" },
      { status: "current", accountType: "mortgage", originalAmount: "500000", currentBalance: "400000" },
    ];
    const result = calculateCreditScore(accounts, 0);
    const utilizationFactor = result.factors.find(f => f.name === "Utilization Ratio");
    expect(utilizationFactor).toBeDefined();
    expect(utilizationFactor!.impact).toBe(0);
    expect(utilizationFactor!.direction).toBe("neutral");
    expect(result.reasonCodes).not.toContain("HIGH_UTILIZATION");
  });

  it("clamps score between 300 and 850", () => {
    const badAccounts = Array.from({ length: 10 }, () => ({ status: "written_off", currentBalance: "100000" }));
    const judgments = Array.from({ length: 5 }, () => ({ status: "active" }));
    const result = calculateCreditScore(badAccounts, 20, judgments);
    expect(result.score).toBeGreaterThanOrEqual(300);
    expect(result.score).toBeLessThanOrEqual(850);
  });

  it("factors are sorted by absolute impact descending", () => {
    const accounts = [
      { status: "current", currentBalance: "5000" },
      { status: "delinquent", currentBalance: "20000" },
    ];
    const result = calculateCreditScore(accounts, 5, [{ status: "active" }]);
    for (let i = 1; i < result.factors.length; i++) {
      expect(Math.abs(result.factors[i - 1].impact)).toBeGreaterThanOrEqual(Math.abs(result.factors[i].impact));
    }
  });
});
