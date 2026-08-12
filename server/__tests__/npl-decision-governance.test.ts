import { describe, expect, it } from "vitest";
import { normalizeNplDecisionAmount, nplDecisionEventType } from "../npl-decision-governance";
import { applyObservedNplEvent } from "../npl-case-ledger";

describe("NPL decision governance", () => {
  it("requires and normalizes a write-off amount within current exposure", () => {
    expect(normalizeNplDecisionAmount({ decisionType: "write_off", proposedAmount: "1250.5", currentExposure: "2000.00" })).toBe("1250.50");
    expect(() => normalizeNplDecisionAmount({ decisionType: "write_off", currentExposure: "2000.00" })).toThrow(/required/i);
    expect(() => normalizeNplDecisionAmount({ decisionType: "write_off", proposedAmount: "2000.01", currentExposure: "2000.00" })).toThrow(/cannot exceed/i);
  });

  it("prevents cure or re-age proposals from silently changing exposure", () => {
    expect(normalizeNplDecisionAmount({ decisionType: "cure_reage", currentExposure: "900.00" })).toBeNull();
    expect(() => normalizeNplDecisionAmount({ decisionType: "cure_reage", proposedAmount: "1.00", currentExposure: "900.00" })).toThrow(/cannot alter exposure/i);
  });

  it("allows a restructure proposal to identify an affected amount without posting it", () => {
    expect(normalizeNplDecisionAmount({ decisionType: "restructure", proposedAmount: "500.00", currentExposure: "900.00" })).toBe("500.00");
    expect(applyObservedNplEvent({ currentExposure: "900.00", eventType: nplDecisionEventType("approved") })).toMatchObject({ exposureBefore: "900.00", exposureAfter: "900.00" });
  });

  it("maps each controlled lifecycle state to an immutable event type", () => {
    expect(["submitted", "approved", "rejected", "execution_recorded"].map((status) => nplDecisionEventType(status as "submitted"))).toEqual([
      "decision_submitted", "decision_approved", "decision_rejected", "decision_execution_recorded",
    ]);
  });
});
