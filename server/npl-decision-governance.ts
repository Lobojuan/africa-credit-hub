export const NPL_DECISION_TYPES = ["restructure", "cure_reage", "write_off"] as const;
export type NplDecisionType = typeof NPL_DECISION_TYPES[number];

export const NPL_DECISION_STATUSES = ["pending", "approved", "rejected", "execution_recorded"] as const;
export type NplDecisionStatus = typeof NPL_DECISION_STATUSES[number];

function toMinor(value: string | number): bigint {
  const normalized = String(value).trim();
  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) throw new Error("Decision amounts must be positive and use no more than two decimal places");
  const [whole, fraction = ""] = normalized.split(".");
  return BigInt(whole) * 100n + BigInt(fraction.padEnd(2, "0"));
}

function fromMinor(value: bigint) {
  return `${value / 100n}.${String(value % 100n).padStart(2, "0")}`;
}

export function normalizeNplDecisionAmount(input: {
  decisionType: NplDecisionType;
  proposedAmount?: string | number | null;
  currentExposure: string | number;
}) {
  const exposure = toMinor(input.currentExposure);
  const supplied = input.proposedAmount !== undefined && input.proposedAmount !== null && input.proposedAmount !== "";
  if (input.decisionType === "cure_reage") {
    if (supplied) throw new Error("A cure/re-age proposal cannot alter exposure; record observed account changes after bank execution");
    return null;
  }
  if (input.decisionType === "write_off" && !supplied) throw new Error("A proposed write-off amount is required");
  if (!supplied) return null;
  const amount = toMinor(input.proposedAmount as string | number);
  if (amount <= 0n) throw new Error("The proposed amount must be positive");
  if (amount > exposure) throw new Error("The proposed amount cannot exceed current case exposure");
  return fromMinor(amount);
}

export function nplDecisionEventType(status: "submitted" | "approved" | "rejected" | "execution_recorded") {
  return `decision_${status}` as const;
}
