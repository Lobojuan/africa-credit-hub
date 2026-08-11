import { describe, expect, it } from "vitest";
import { applyObservedNplEvent, calculateNplExposureWaterfall } from "../npl-case-ledger";

describe("NPL case ledger", () => {
  it("opens a case and preserves exact two-decimal exposure arithmetic", () => {
    expect(applyObservedNplEvent({ currentExposure: "0.00", eventType: "case_opened", amount: "100000.10" })).toEqual({
      exposureBefore: "0.00", exposureAfter: "100000.10", amount: "100000.10",
    });
    expect(applyObservedNplEvent({ currentExposure: "100000.10", eventType: "cash_recovery_observed", amount: "0.01" }).exposureAfter).toBe("100000.09");
  });

  it("blocks a recovery that exceeds current exposure", () => {
    expect(() => applyObservedNplEvent({ currentExposure: "50.00", eventType: "legal_recovery_observed", amount: "50.01" })).toThrow(/cannot exceed/i);
  });

  it("prevents notes and workflow events from silently changing exposure", () => {
    expect(() => applyObservedNplEvent({ currentExposure: "50.00", eventType: "note", amount: "1.00" })).toThrow(/cannot change exposure/i);
    expect(applyObservedNplEvent({ currentExposure: "50.00", eventType: "workflow_stage_changed" }).exposureAfter).toBe("50.00");
  });

  it("reconciles opening, inflows and observed recoveries to closing exposure", () => {
    const result = calculateNplExposureWaterfall({
      openingExposure: "1000.00",
      closingExposure: "825.00",
      authoritativeCreditExposure: "825.00",
      events: [
        { eventType: "npl_inflow_observed", amount: "100.00" },
        { eventType: "cash_recovery_observed", amount: "250.00" },
        { eventType: "legal_recovery_observed", amount: "25.00" },
        { eventType: "note", amount: null },
      ],
    });
    expect(result).toMatchObject({ calculatedClosingExposure: "825.00", reconciliationDifference: "0.00", reconciled: true, authoritativeDifference: "0.00", authoritativeReconciled: true });
  });

  it("surfaces a projection mismatch instead of hiding it", () => {
    const result = calculateNplExposureWaterfall({ openingExposure: "100.00", closingExposure: "99.00", events: [] });
    expect(result.reconciled).toBe(false);
    expect(result.reconciliationDifference).toBe("-1.00");
  });
});
