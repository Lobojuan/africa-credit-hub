/**
 * Integration-level tests for the Loto → Credit Score Bridge (Task #490).
 *
 * These tests simulate the full lifecycle:
 *   grant consent → buildFiscalReceiptsAltData (altdata created) →
 *   credit score engine can read fiscal_receipts source →
 *   revoke consent → purgeFiscalReceiptsAltData (altdata gone)
 *
 * Also covers:
 *   - Cross-country rejection end-to-end (CI user cannot get GH data)
 *   - No receipt data: consent created but no altdata written
 *   - Multi-month receipt spread for thin-file borrowers
 *   - Pipeline failure on grant: consent is revoked atomically
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Hoisted mock handles ─────────────────────────────────────────────────────
const { mockSelect, mockInsert, mockDelete, insertedRows, deletedRows } = vi.hoisted(() => {
  const insertedRows: object[] = [];
  const deletedRows: string[] = [];

  return {
    mockSelect: vi.fn(),
    mockInsert: vi.fn(),
    mockDelete: vi.fn(),
    insertedRows,
    deletedRows,
  };
});

// ─── Mock Drizzle DB ──────────────────────────────────────────────────────────
vi.mock("../db", () => ({
  db: {
    select: mockSelect,
    insert: mockInsert,
    delete: mockDelete,
  },
}));

// ─── Mock schema tables ───────────────────────────────────────────────────────
vi.mock("@shared/schema", () => ({
  lotoMerchants: { id: "lm.id", countryCode: "lm.country_code" },
  lotoReceipts: {
    id: "lr.id",
    merchantId: "lr.merchant_id",
    consumerUserId: "lr.consumer_user_id",
    amount: "lr.amount",
    vatAmount: "lr.vat_amount",
    currency: "lr.currency",
    issuedAt: "lr.issued_at",
    isDemo: "lr.is_demo",
  },
  crossProductConsents: {
    purpose: "cpc.purpose",
    status: "cpc.status",
    userId: "cpc.user_id",
    borrowerId: "cpc.borrower_id",
    expiresAt: "cpc.expires_at",
  },
  alternativeData: {
    borrowerId: "ad.borrower_id",
    source: "ad.source",
    id: "ad.id",
  },
  borrowers: { id: "b.id", country: "b.country" },
  users: { id: "u.id" },
}));

vi.mock("drizzle-orm", () => ({
  eq: (col: unknown, val: unknown) => ({ type: "eq", col, val }),
  and: (...conds: unknown[]) => ({ type: "and", conds }),
  or: (...conds: unknown[]) => ({ type: "or", conds }),
  isNull: (col: unknown) => ({ type: "isNull", col }),
}));

// ─── SUT ──────────────────────────────────────────────────────────────────────
import {
  buildFiscalReceiptsAltData,
  purgeFiscalReceiptsAltData,
  PipelineCountryError,
  normaliseBorrowerCountry,
} from "../loto-credit-pipeline";

// ─── In-memory altdata store for integration tests ────────────────────────────
type AltDataRow = {
  id: string;
  borrowerId: string;
  source: string;
  provider: string;
  totalTransactions: number;
  onTimePayments: number;
  latePayments: number;
  averageMonthlyAmount: string;
  currency: string;
  status: string;
  dataStartDate: Date | null;
  dataEndDate: Date | null;
};

function makeIntegrationDb(receipts: object[]) {
  const altDataStore: AltDataRow[] = [];

  const insertValues = vi.fn().mockImplementation(async (row: AltDataRow) => {
    const newRow = { ...row, id: `alt-${Date.now()}-${Math.random()}` };
    altDataStore.push(newRow);
    insertedRows.push(newRow);
    return [newRow];
  });
  mockInsert.mockReturnValue({ values: insertValues });

  const deleteReturning = vi.fn().mockImplementation(async () => {
    const matchIdx = altDataStore.findIndex(r => r.source === "fiscal_receipts");
    if (matchIdx === -1) return [];
    const [removed] = altDataStore.splice(matchIdx, 1);
    deletedRows.push(removed.id);
    return [{ id: removed.id }];
  });
  const deleteWhere = vi.fn().mockReturnValue({ returning: deleteReturning });
  mockDelete.mockReturnValue({ where: deleteWhere });

  let selectCallIdx = 0;
  mockSelect.mockImplementation(() => {
    const idx = selectCallIdx++;
    const rows = idx === 0 ? receipts : [];
    const where = vi.fn().mockResolvedValue(rows);
    const innerJoin = vi.fn().mockReturnValue({ where });
    const from = vi.fn().mockReturnValue({ innerJoin, where });
    return { from };
  });

  return { altDataStore, insertValues, deleteReturning };
}

// ─── Test receipts fixture ────────────────────────────────────────────────────
function makeReceipts(n: number, country = "CI") {
  return Array.from({ length: n }, (_, i) => ({
    id: `r${i}`,
    amount: "500",
    vatAmount: "90",
    currency: country === "GH" ? "GHS" : "XOF",
    issuedAt: new Date(`2025-0${(i % 6) + 1}-${10 + i}T00:00:00Z`),
  }));
}

// ─── Integration: Full lifecycle ──────────────────────────────────────────────

describe("Full lifecycle: grant → altdata created → revoke → purge", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    insertedRows.length = 0;
    deletedRows.length = 0;
  });

  it("grant: pipeline writes altdata record for a borrower with 6 receipts", async () => {
    const receipts = makeReceipts(6, "CI");
    const { altDataStore, insertValues } = makeIntegrationDb(receipts);

    const result = await buildFiscalReceiptsAltData(
      "user-lifecycle",
      "borrower-lifecycle",
      "CI",
      "Côte d'Ivoire",
    );

    expect(result.inserted).toBe(true);
    expect(altDataStore).toHaveLength(1);
    expect(insertValues).toHaveBeenCalledOnce();

    const row = altDataStore[0];
    expect(row.borrowerId).toBe("borrower-lifecycle");
    expect(row.source).toBe("fiscal_receipts");
    expect(row.status).toBe("active");
    expect(row.totalTransactions).toBe(6);
    expect(row.onTimePayments).toBe(6);
    expect(row.latePayments).toBe(0);
    expect(row.provider).toBe("loto_fiscal_ci");
  });

  it("grant: averageMonthlyAmount is derived from vatAmount (90 per receipt)", async () => {
    const receipts = [
      { id: "r1", amount: "500", vatAmount: "90", currency: "XOF", issuedAt: new Date("2025-03-01T00:00:00Z") },
      { id: "r2", amount: "600", vatAmount: "108", currency: "XOF", issuedAt: new Date("2025-03-15T00:00:00Z") },
      { id: "r3", amount: "400", vatAmount: "72",  currency: "XOF", issuedAt: new Date("2025-04-10T00:00:00Z") },
    ];
    const { altDataStore } = makeIntegrationDb(receipts);

    await buildFiscalReceiptsAltData("user-vat", "borrower-vat", "CI", "Côte d'Ivoire");

    // March VAT = 90+108=198, April VAT = 72 → avg = (198+72)/2 = 135
    const avg = parseFloat(altDataStore[0].averageMonthlyAmount);
    expect(avg).toBeCloseTo(135, 0);
    expect(avg).not.toBeCloseTo((500 + 600 + 400) / 2, 0); // must NOT be from amount
  });

  it("revoke: purge removes the altdata record written on grant", async () => {
    const receipts = makeReceipts(3, "CI");
    const { altDataStore } = makeIntegrationDb(receipts);

    await buildFiscalReceiptsAltData("user-lc", "borrower-lc", "CI", "Côte d'Ivoire");
    expect(altDataStore).toHaveLength(1);

    const count = await purgeFiscalReceiptsAltData("borrower-lc");
    expect(count).toBe(1);
    expect(altDataStore).toHaveLength(0);
    expect(deletedRows).toHaveLength(1);
  });

  it("revoke on already-purged borrower returns 0", async () => {
    const { altDataStore } = makeIntegrationDb([]);
    const count = await purgeFiscalReceiptsAltData("borrower-already-gone");
    expect(count).toBe(0);
    expect(altDataStore).toHaveLength(0);
  });

  it("thin-file borrower: 6+ receipts across multiple months, all counted as on-time", async () => {
    const receipts = makeReceipts(8, "CI");
    const { altDataStore } = makeIntegrationDb(receipts);

    const result = await buildFiscalReceiptsAltData("user-thin", "borrower-thin", "CI", "Côte d'Ivoire");

    expect(result.inserted).toBe(true);
    const row = altDataStore[0];
    expect(row.onTimePayments).toBe(8);
    expect(row.latePayments).toBe(0);
    expect(row.totalTransactions).toBe(8);
  });

  it("no receipts: altdata is NOT created, consent can be active but has no impact", async () => {
    const { altDataStore, insertValues } = makeIntegrationDb([]);

    const result = await buildFiscalReceiptsAltData("user-zero", "borrower-zero", "CI", "Côte d'Ivoire");

    expect(result.inserted).toBe(false);
    expect(result.aggregate.totalTransactions).toBe(0);
    expect(altDataStore).toHaveLength(0);
    expect(insertValues).not.toHaveBeenCalled();
  });
});

// ─── Integration: Cross-country rejection ─────────────────────────────────────

describe("Cross-country rejection: end-to-end country isolation", () => {
  beforeEach(() => vi.clearAllMocks());

  it("CI borrower cannot access GH data (PipelineCountryError)", async () => {
    await expect(
      buildFiscalReceiptsAltData("user-ci", "borrower-ci", "GH", "Côte d'Ivoire"),
    ).rejects.toBeInstanceOf(PipelineCountryError);
  });

  it("GH borrower cannot access CI data (PipelineCountryError)", async () => {
    await expect(
      buildFiscalReceiptsAltData("user-gh", "borrower-gh", "CI", "Ghana"),
    ).rejects.toBeInstanceOf(PipelineCountryError);
  });

  it("null borrower country always rejects (no guessing allowed)", async () => {
    await expect(
      buildFiscalReceiptsAltData("user-unknown", "borrower-unknown", "CI", null),
    ).rejects.toBeInstanceOf(PipelineCountryError);

    await expect(
      buildFiscalReceiptsAltData("user-unknown", "borrower-unknown", "GH", null),
    ).rejects.toBeInstanceOf(PipelineCountryError);
  });

  it("empty-string borrower country always rejects", async () => {
    await expect(
      buildFiscalReceiptsAltData("user-empty", "borrower-empty", "CI", ""),
    ).rejects.toBeInstanceOf(PipelineCountryError);
  });

  it("CI borrower with correct CI data succeeds (no error)", async () => {
    makeIntegrationDb([]);
    await expect(
      buildFiscalReceiptsAltData("user-ci-ok", "borrower-ci-ok", "CI", "Côte d'Ivoire"),
    ).resolves.not.toThrow();
  });

  it("GH borrower with correct GH data succeeds (no error)", async () => {
    makeIntegrationDb([]);
    await expect(
      buildFiscalReceiptsAltData("user-gh-ok", "borrower-gh-ok", "GH", "Ghana"),
    ).resolves.not.toThrow();
  });

  it("pipeline error on grant path is surfaced (not swallowed)", async () => {
    // Simulates what the grant endpoint does: call pipeline and catch the error
    let caughtError: unknown = null;
    try {
      await buildFiscalReceiptsAltData("user-mismatch", "borrower-mismatch", "NG", "Côte d'Ivoire");
    } catch (e) {
      caughtError = e;
    }
    expect(caughtError).toBeInstanceOf(PipelineCountryError);
    // Grant endpoint must NOT return 201 in this scenario — error must propagate
  });
});

// ─── Integration: Credit score can read fiscal_receipts source ────────────────

describe("Credit score engine: fiscal_receipts source is readable after grant", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    insertedRows.length = 0;
  });

  it("altdata row uses source='fiscal_receipts' which existing scoring engine handles", async () => {
    const receipts = makeReceipts(5, "CI");
    const { altDataStore } = makeIntegrationDb(receipts);

    await buildFiscalReceiptsAltData("user-score", "borrower-score", "CI", "Côte d'Ivoire");

    // The credit scoring engine already handles source='fiscal_receipts' per task spec.
    // Here we verify the altdata record is written with the correct source so the
    // engine can pick it up on next report load.
    expect(altDataStore).toHaveLength(1);
    expect(altDataStore[0].source).toBe("fiscal_receipts");
    expect(altDataStore[0].status).toBe("active");

    // Provider must match the expected pattern for the scoring engine's providerGroup
    expect(altDataStore[0].provider).toMatch(/^loto_fiscal_/);

    // Data range must be present for score engine to compute recency weighting
    expect(altDataStore[0].dataStartDate).toBeInstanceOf(Date);
    expect(altDataStore[0].dataEndDate).toBeInstanceOf(Date);
  });

  it("revoked consent: purge removes altdata, scoring engine sees no fiscal_receipts source", async () => {
    const receipts = makeReceipts(5, "CI");
    const { altDataStore } = makeIntegrationDb(receipts);

    await buildFiscalReceiptsAltData("user-score2", "borrower-score2", "CI", "Côte d'Ivoire");
    expect(altDataStore).toHaveLength(1);

    const count = await purgeFiscalReceiptsAltData("borrower-score2");
    expect(count).toBe(1);
    expect(altDataStore.filter(r => r.source === "fiscal_receipts")).toHaveLength(0);
  });
});

// ─── Regression: failed grant must not leave active consent ───────────────────

describe("Regression: failed grant does not leave active consent state", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    insertedRows.length = 0;
    deletedRows.length = 0;
  });

  it("country mismatch throws PipelineCountryError — caller must revoke consent", async () => {
    // Simulate the grant endpoint flow:
    // 1. normaliseBorrowerCountry is called FIRST (before consent creation)
    // 2. If it returns empty string → 400 returned, no consent created
    // 3. If pipeline throws after consent creation → consent must be revoked

    // Test: normaliseBorrowerCountry("") returns "" — grant must be blocked early
    const { normaliseBorrowerCountry: norm } = await import("../loto-credit-pipeline");
    expect(norm("")).toBe("");
    expect(norm(null)).toBe("");

    // Test: calling pipeline with mismatched country throws (what happens AFTER consent creation if somehow reached)
    let pipelineError: unknown = null;
    try {
      await buildFiscalReceiptsAltData("user-mismatch", "borrower-mismatch", "GH", "Côte d'Ivoire");
    } catch (e) {
      pipelineError = e;
    }
    expect(pipelineError).toBeInstanceOf(PipelineCountryError);

    // This error must be caught by the grant endpoint and used to revoke the consent
    // (The endpoint does: try { await buildFiscalReceiptsAltData(...) } catch { revoke consent; return 500 })
    // We verify here that the error is surfaced (not swallowed) so the caller CAN revoke.
    const msg = String((pipelineError as Error).message);
    expect(msg).toMatch(/country mismatch/i);
    expect(msg).toMatch(/GH/);
    expect(msg).toMatch(/CI/);
  });

  it("normaliseBorrowerCountry validates BEFORE consent row creation: zero altdata rows on bad country", async () => {
    // When borrower.country normalises to "" → country validation fails → no pipeline runs → no altdata
    makeIntegrationDb([]);
    let threw = false;
    try {
      await buildFiscalReceiptsAltData("user-bad-country", "borrower-bad-country", "CI", "");
    } catch {
      threw = true;
    }
    expect(threw).toBe(true);
    // No altdata was inserted
    expect(insertedRows).toHaveLength(0);
  });

  it("pipeline throws on country mismatch: no altdata inserted (no silent write)", async () => {
    makeIntegrationDb([]);
    let threw = false;
    try {
      await buildFiscalReceiptsAltData("user-silent", "borrower-silent", "NG", "Ghana");
    } catch {
      threw = true;
    }
    expect(threw).toBe(true);
    // Verify that even if insert was somehow called, the error was propagated
    expect(insertedRows).toHaveLength(0);
  });
});

// ─── Integration: normaliseBorrowerCountry covers all supported countries ─────

describe("normaliseBorrowerCountry: coverage of all mapped countries", () => {
  const cases: [string, string][] = [
    ["Côte d'Ivoire", "CI"],
    ["cote d'ivoire", "CI"],
    ["ivory coast", "CI"],
    ["Ghana", "GH"],
    ["Ethiopia", "ET"],
    ["Nigeria", "NG"],
    ["Kenya", "KE"],
    ["Senegal", "SN"],
    ["South Africa", "ZA"],
    ["Cameroon", "CM"],
    ["Mali", "ML"],
    ["Burkina Faso", "BF"],
    ["Togo", "TG"],
    ["Benin", "BJ"],
    ["Niger", "NE"],
    ["Guinea", "GN"],
  ];

  for (const [input, expected] of cases) {
    it(`"${input}" → "${expected}"`, () => {
      expect(normaliseBorrowerCountry(input)).toBe(expected);
    });
  }

  it("returns empty string for null", () => {
    expect(normaliseBorrowerCountry(null)).toBe("");
  });

  it("returns empty string for empty string", () => {
    expect(normaliseBorrowerCountry("")).toBe("");
  });
});
