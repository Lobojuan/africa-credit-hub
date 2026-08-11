import { describe, expect, it } from "vitest";
import { parseLoanTapeCsv, reconcileLoanTape, validateMapping } from "../loan-tape-reconciliation";

const requiredMapping = {
  accountNumber: "facility_id",
  currentBalance: "balance",
  currency: "ccy",
  status: "account_status",
  daysInArrears: "dpd",
  reportingDate: "as_of_date",
  lenderInstitution: "bank",
};

const header = "facility_id,balance,ccy,account_status,dpd,as_of_date,bank";

describe("loan-tape reconciliation", () => {
  it("accepts a clean bank extract without retaining raw rows", () => {
    const result = reconcileLoanTape({
      csv: `${header}\nOMNI-000123,450000,GHS,current,0,2026-08-31,OmniBSIC`,
      fieldMappings: requiredMapping,
      reportingDate: "2026-08-31",
    });

    expect(result).toMatchObject({ status: "ready", totalRecords: 1, cleanRecords: 1, exceptionCount: 0 });
    expect(result.sourceSha256).toMatch(/^[a-f0-9]{64}$/);
    expect(result).not.toHaveProperty("rows");
  });

  it("parses quoted commas and line breaks deterministically", () => {
    const parsed = parseLoanTapeCsv('facility_id,bank\n"OMNI,001","Omni\nBSIC"');
    expect(parsed.headers).toEqual(["facility_id", "bank"]);
    expect(parsed.rows).toEqual([["OMNI,001", "Omni\nBSIC"]]);
  });

  it("rejects incomplete and ambiguous mapping profiles", () => {
    expect(() => validateMapping({ accountNumber: "id" })).toThrow(/missing required/i);
    expect(() => validateMapping({ ...requiredMapping, currentBalance: "facility_id" })).toThrow(/cannot map to multiple/i);
    expect(() => validateMapping({ ...requiredMapping, secretScore: "score" })).toThrow(/unknown canonical/i);
  });

  it("blocks duplicate accounts and never exposes the full account reference", () => {
    const result = reconcileLoanTape({
      csv: `${header}\nOMNI-000123,450000,GHS,current,0,2026-08-31,OmniBSIC\nOMNI-000123,450000,GHS,current,0,2026-08-31,OmniBSIC`,
      fieldMappings: requiredMapping,
      reportingDate: "2026-08-31",
    });
    const duplicate = result.exceptions.find((item) => item.exceptionType === "duplicate_account");
    expect(result.status).toBe("blocked");
    expect(duplicate?.accountReference).toBe("***0123");
    expect(JSON.stringify(duplicate)).not.toContain("OMNI-000123");
  });

  it("flags bank classification and imported IFRS staging mismatches without assigning a stage", () => {
    const csv = `${header},ifrs_stage\nOMNI-000999,900000,GHS,current,112,2026-08-31,OmniBSIC,2`;
    const result = reconcileLoanTape({
      csv,
      fieldMappings: { ...requiredMapping, ifrs9Stage: "ifrs_stage" },
      reportingDate: "2026-08-31",
    });
    expect(result.status).toBe("blocked");
    expect(result.exceptions.map((item) => item.exceptionType)).toEqual(expect.arrayContaining(["classification_mismatch", "staging_mismatch"]));
    expect(result).not.toHaveProperty("assignedIfrs9Stage");
  });

  it("applies collateral age only when the bank approved a rule", () => {
    const csv = `${header},valuation_date\nOMNI-000456,100000,GHS,current,0,2026-08-31,OmniBSIC,2025-01-01`;
    const fieldMappings = { ...requiredMapping, collateralValuationDate: "valuation_date" };
    expect(reconcileLoanTape({ csv, fieldMappings, reportingDate: "2026-08-31" }).status).toBe("ready");
    const governed = reconcileLoanTape({ csv, fieldMappings, reportingDate: "2026-08-31", rules: { collateralValuationMaxAgeDays: 365 } });
    expect(governed.exceptions.some((item) => item.exceptionType === "stale_collateral_valuation")).toBe(true);
  });
});
