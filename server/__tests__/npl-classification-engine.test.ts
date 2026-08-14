import { describe, expect, it } from "vitest";
import { classifyAccount, GHANA_NPL_POLICY } from "../npl-classification-engine";

describe("NPL classifyAccount", () => {
  const baseAccount = {
    id: "acc-test",
    borrower_id: "bor-test",
    organization_id: null,
    country: "Ghana",
    days_in_arrears: 0,
    current_balance: 100000,
    status: "current",
    asset_classification: null,
    bog_asset_classification: null,
  };

  it("classifies a performing account as Stage 1 / Performing with 1% provision", () => {
    const result = classifyAccount(baseAccount, GHANA_NPL_POLICY);
    expect(result.nplStage).toBe("performing");
    expect(result.ifrs9Stage).toBe("stage_1");
    expect(result.provisionRate).toBe(0.01);
    expect(result.provisionAmount).toBe(1000);
    expect(result.collectionTriggered).toBe(false);
    expect(result.ifrs9Reasons[0]).toMatch(/No significant increase/);
  });

  it("classifies 35 DPD delinquent as Watchlist / Stage 2 with 5% provision", () => {
    const result = classifyAccount(
      { ...baseAccount, days_in_arrears: 35, status: "delinquent" },
      GHANA_NPL_POLICY
    );
    expect(result.nplStage).toBe("watchlist");
    expect(result.ifrs9Stage).toBe("stage_2");
    expect(result.provisionRate).toBe(0.05);
    expect(result.provisionAmount).toBe(5000);
    expect(result.collectionTriggered).toBe(true);
  });

  it("classifies 65 DPD as Substandard / Stage 2 with 20% provision", () => {
    const result = classifyAccount(
      { ...baseAccount, days_in_arrears: 65, status: "delinquent" },
      GHANA_NPL_POLICY
    );
    expect(result.nplStage).toBe("substandard");
    expect(result.ifrs9Stage).toBe("stage_2");
    expect(result.provisionRate).toBe(0.20);
    expect(result.provisionAmount).toBe(20000);
    expect(result.collectionTriggered).toBe(true);
  });

  it("classifies 95 DPD default as Loss / Stage 3 with 100% provision", () => {
    const result = classifyAccount(
      { ...baseAccount, days_in_arrears: 95, status: "default" },
      GHANA_NPL_POLICY
    );
    expect(result.nplStage).toBe("loss");
    expect(result.ifrs9Stage).toBe("stage_3");
    expect(result.provisionRate).toBe(1.00);
    expect(result.provisionAmount).toBe(100000);
    expect(result.collectionTriggered).toBe(true);
  });

  it("classifies written_off as Loss / Stage 3 regardless of DPD", () => {
    const result = classifyAccount(
      { ...baseAccount, days_in_arrears: 0, status: "written_off" },
      GHANA_NPL_POLICY
    );
    expect(result.nplStage).toBe("loss");
    expect(result.ifrs9Stage).toBe("stage_3");
    expect(result.provisionRate).toBe(1.00);
    expect(result.provisionAmount).toBe(100000);
  });

  it("classifies 185 DPD as Loss / Stage 3 via DPD threshold", () => {
    const result = classifyAccount(
      { ...baseAccount, days_in_arrears: 185, status: "delinquent" },
      GHANA_NPL_POLICY
    );
    expect(result.nplStage).toBe("loss");
    expect(result.ifrs9Stage).toBe("stage_3");
    expect(result.nplReasons[0]).toMatch(/180/);
  });

  it("applies asset classification override when set", () => {
    const result = classifyAccount(
      { ...baseAccount, days_in_arrears: 0, status: "current", bog_asset_classification: "substandard" },
      GHANA_NPL_POLICY
    );
    expect(result.nplStage).toBe("substandard");
    expect(result.nplReasons.some((r) => r.includes("override"))).toBe(true);
  });

  it("does not trigger collection for zero balance accounts", () => {
    const result = classifyAccount(
      { ...baseAccount, days_in_arrears: 95, status: "default", current_balance: 0 },
      GHANA_NPL_POLICY
    );
    expect(result.collectionTriggered).toBe(false);
  });

  it("returns correct borrower and account IDs", () => {
    const result = classifyAccount(
      { ...baseAccount, id: "acc-123", borrower_id: "bor-456" },
      GHANA_NPL_POLICY
    );
    expect(result.creditAccountId).toBe("acc-123");
    expect(result.borrowerId).toBe("bor-456");
  });

  it("defaults country to Ghana when missing", () => {
    const result = classifyAccount(
      { ...baseAccount, country: "" },
      GHANA_NPL_POLICY
    );
    expect(result.country).toBe("Ghana");
  });
});

describe("NPL provision edge cases", () => {
  it("rounds provision to 2 decimal places", () => {
    const result = classifyAccount(
      {
        id: "acc-1", borrower_id: "bor-1", organization_id: null,
        country: "Ghana", days_in_arrears: 35, status: "delinquent",
        current_balance: 33333.33, asset_classification: null, bog_asset_classification: null,
      },
      GHANA_NPL_POLICY
    );
    expect(result.provisionRate).toBe(0.05);
    expect(result.provisionAmount).toBe(1666.67);
  });

  it("handles null days_in_arrears as 0", () => {
    const result = classifyAccount(
      {
        id: "acc-1", borrower_id: "bor-1", organization_id: null,
        country: "Ghana", days_in_arrears: null as any, status: "current",
        current_balance: 50000, asset_classification: null, bog_asset_classification: null,
      },
      GHANA_NPL_POLICY
    );
    expect(result.nplStage).toBe("performing");
    expect(result.ifrs9Stage).toBe("stage_1");
  });

  it("handles null current_balance as 0 provision", () => {
    const result = classifyAccount(
      {
        id: "acc-1", borrower_id: "bor-1", organization_id: null,
        country: "Ghana", days_in_arrears: 0, status: "current",
        current_balance: null as any, asset_classification: null, bog_asset_classification: null,
      },
      GHANA_NPL_POLICY
    );
    expect(result.provisionAmount).toBe(0);
  });
});
