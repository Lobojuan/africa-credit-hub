/**
 * Tests for the Loto → Credit Score Bridge pipeline (Task #490).
 *
 * Covers:
 *   - Country isolation (PipelineCountryError for mismatches)
 *   - Aggregation: correct receipt count, VAT-based averageMonthlyAmount,
 *     onTimePayments / latePayments, provider naming, date range
 *   - Upsert pattern: delete-then-insert
 *   - purgeFiscalReceiptsAltData: returns correct deleted-row count
 *   - refreshAllFiscalReceiptsConsents: skip/error/process path coverage
 *   - Integration flow: grant → altdata created (vatAmount used) → revoke → purge
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Hoisted mock handles ─────────────────────────────────────────────────────
const { mockSelect, mockInsert, mockDelete } = vi.hoisted(() => ({
  mockSelect: vi.fn(),
  mockInsert: vi.fn(),
  mockDelete: vi.fn(),
}));

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
  lotoMerchants: { id: "loto_merchants.id", countryCode: "loto_merchants.country_code" },
  lotoReceipts: {
    id: "loto_receipts.id",
    merchantId: "loto_receipts.merchant_id",
    consumerUserId: "loto_receipts.consumer_user_id",
    amount: "loto_receipts.amount",
    vatAmount: "loto_receipts.vat_amount",
    currency: "loto_receipts.currency",
    issuedAt: "loto_receipts.issued_at",
    isDemo: "loto_receipts.is_demo",
  },
  crossProductConsents: {
    purpose: "cross_product_consents.purpose",
    status: "cross_product_consents.status",
    userId: "cross_product_consents.user_id",
    borrowerId: "cross_product_consents.borrower_id",
    expiresAt: "cross_product_consents.expires_at",
  },
  alternativeData: {
    borrowerId: "alternative_data.borrower_id",
    source: "alternative_data.source",
  },
  borrowers: { id: "borrowers.id", country: "borrowers.country" },
  users: { id: "users.id" },
}));

// ─── Mock drizzle-orm ─────────────────────────────────────────────────────────
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
  refreshAllFiscalReceiptsConsents,
  normaliseBorrowerCountry,
  PipelineCountryError,
} from "../loto-credit-pipeline";

// ─── Helper: wire up fluent Drizzle chain mocks ───────────────────────────────
function setupDbMocks(receipts: object[]) {
  const insertValues = vi.fn().mockResolvedValue([{}]);
  mockInsert.mockReturnValue({ values: insertValues });

  const deleteReturning = vi.fn().mockResolvedValue(
    receipts.map((_, i) => ({ id: `alt-${i}` })),
  );
  const deleteWhere = vi.fn().mockReturnValue({ returning: deleteReturning });
  mockDelete.mockReturnValue({ where: deleteWhere });

  let selectCallIdx = 0;
  mockSelect.mockImplementation(() => {
    const idx = selectCallIdx++;
    const rows = idx === 0 ? receipts : [];
    const where = vi.fn().mockResolvedValue(rows);
    const limit = vi.fn().mockResolvedValue(rows);
    const orderBy = vi.fn().mockReturnValue({ limit });
    const innerJoin = vi.fn().mockReturnValue({ where });
    const from = vi.fn().mockReturnValue({ innerJoin, where, orderBy });
    return { from };
  });

  return { insertValues, deleteReturning };
}

// ─── normaliseBorrowerCountry ─────────────────────────────────────────────────

describe("normaliseBorrowerCountry", () => {
  it("returns CI for 'Côte d\\'Ivoire'", () => {
    expect(normaliseBorrowerCountry("Côte d'Ivoire")).toBe("CI");
  });
  it("returns GH for 'Ghana'", () => {
    expect(normaliseBorrowerCountry("Ghana")).toBe("GH");
  });
  it("returns NG for 'Nigeria'", () => {
    expect(normaliseBorrowerCountry("Nigeria")).toBe("NG");
  });
  it("returns empty string for null", () => {
    expect(normaliseBorrowerCountry(null)).toBe("");
  });
  it("returns empty string for undefined", () => {
    expect(normaliseBorrowerCountry(undefined)).toBe("");
  });
  it("uses first 2 chars uppercased as fallback for unknown country", () => {
    expect(normaliseBorrowerCountry("Zimbabwe")).toBe("ZI");
  });
});

// ─── Country isolation ────────────────────────────────────────────────────────

describe("buildFiscalReceiptsAltData — country isolation", () => {
  beforeEach(() => vi.clearAllMocks());

  it("throws PipelineCountryError when borrower country mismatches countryCode (CI vs GH)", async () => {
    await expect(
      buildFiscalReceiptsAltData("user-1", "borrower-1", "GH", "Côte d'Ivoire"),
    ).rejects.toThrow(PipelineCountryError);
  });

  it("throws PipelineCountryError for null borrower country when countryCode is non-trivial", async () => {
    await expect(
      buildFiscalReceiptsAltData("user-1", "borrower-1", "NG", null),
    ).rejects.toThrow(PipelineCountryError);
  });

  it("allows matching CI country", async () => {
    setupDbMocks([]);
    await expect(
      buildFiscalReceiptsAltData("user-ci", "borrower-ci", "CI", "Côte d'Ivoire"),
    ).resolves.not.toThrow();
  });

  it("allows matching GH country", async () => {
    setupDbMocks([]);
    await expect(
      buildFiscalReceiptsAltData("user-gh", "borrower-gh", "GH", "Ghana"),
    ).resolves.not.toThrow();
  });

  it("blocks CI consumer reading GH data", async () => {
    await expect(
      buildFiscalReceiptsAltData("user-ci", "borrower-ci", "GH", "Côte d'Ivoire"),
    ).rejects.toThrow(PipelineCountryError);
  });

  it("blocks GH consumer reading CI data", async () => {
    await expect(
      buildFiscalReceiptsAltData("user-gh", "borrower-gh", "CI", "Ghana"),
    ).rejects.toThrow(PipelineCountryError);
  });
});

// ─── Aggregation ──────────────────────────────────────────────────────────────

describe("buildFiscalReceiptsAltData — aggregation", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns inserted: false with zero aggregate when no receipts found", async () => {
    setupDbMocks([]);
    const result = await buildFiscalReceiptsAltData("user-1", "borrower-1", "CI", "Côte d'Ivoire");
    expect(result.inserted).toBe(false);
    expect(result.aggregate.totalTransactions).toBe(0);
    expect(result.aggregate.onTimePayments).toBe(0);
    expect(result.aggregate.latePayments).toBe(0);
  });

  it("computes averageMonthlyAmount from vatAmount (not amount)", async () => {
    const receipts = [
      { id: "r1", amount: "1000", vatAmount: "180", currency: "XOF", issuedAt: new Date("2025-01-10T10:00:00Z") },
      { id: "r2", amount: "2000", vatAmount: "360", currency: "XOF", issuedAt: new Date("2025-01-20T10:00:00Z") },
      { id: "r3", amount: "3000", vatAmount: "540", currency: "XOF", issuedAt: new Date("2025-02-05T10:00:00Z") },
    ];
    const { insertValues } = setupDbMocks(receipts);

    const result = await buildFiscalReceiptsAltData("user-1", "borrower-1", "CI", "Côte d'Ivoire");

    expect(result.inserted).toBe(true);
    expect(result.aggregate.totalTransactions).toBe(3);

    // Month 1 (Jan): 180 + 360 = 540 VAT; Month 2 (Feb): 540 VAT; avg = (540+540)/2 = 540
    const avgMonthly = parseFloat(result.aggregate.averageMonthlyAmount);
    expect(avgMonthly).toBeCloseTo(540, 0);

    // Must NOT use amount (which would give (1000+2000+3000)/2 = 3000)
    expect(avgMonthly).not.toBeCloseTo(3000, 0);

    expect(result.aggregate.currency).toBe("XOF");
    expect(result.aggregate.provider).toBe("loto_fiscal_ci");
    expect(result.aggregate.countryCode).toBe("CI");

    expect(insertValues).toHaveBeenCalledOnce();
    const [inserted] = insertValues.mock.calls[0];
    expect(inserted.source).toBe("fiscal_receipts");
    expect(inserted.borrowerId).toBe("borrower-1");
    expect(inserted.status).toBe("active");
    expect(inserted.totalTransactions).toBe(3);
    expect(inserted.onTimePayments).toBe(3);
    expect(inserted.latePayments).toBe(0);
    expect(parseFloat(inserted.averageMonthlyAmount)).toBeCloseTo(540, 0);
  });

  it("uses upsert pattern: delete then insert", async () => {
    const receipts = [
      { id: "r1", amount: "500", vatAmount: "90", currency: "XOF", issuedAt: new Date("2025-03-01T00:00:00Z") },
    ];
    setupDbMocks(receipts);
    await buildFiscalReceiptsAltData("user-1", "borrower-1", "CI", "Côte d'Ivoire");
    expect(mockDelete).toHaveBeenCalledOnce();
    expect(mockInsert).toHaveBeenCalledOnce();
  });

  it("does not call insert or delete when no receipts (early return)", async () => {
    setupDbMocks([]);
    const result = await buildFiscalReceiptsAltData("user-1", "borrower-1", "CI", "Côte d'Ivoire");
    expect(result.inserted).toBe(false);
    expect(mockDelete).not.toHaveBeenCalled();
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it("sets provider based on countryCode (GH)", async () => {
    setupDbMocks([]);
    const result = await buildFiscalReceiptsAltData("user-1", "borrower-1", "GH", "Ghana");
    expect(result.aggregate.provider).toBe("loto_fiscal_gh");
  });

  it("sets dataStartDate and dataEndDate from first/last receipt dates", async () => {
    const receipts = [
      { id: "r1", amount: "100", vatAmount: "18", currency: "XOF", issuedAt: new Date("2024-06-01T00:00:00Z") },
      { id: "r2", amount: "200", vatAmount: "36", currency: "XOF", issuedAt: new Date("2025-01-15T00:00:00Z") },
    ];
    const { insertValues } = setupDbMocks(receipts);
    await buildFiscalReceiptsAltData("user-1", "borrower-1", "CI", "Côte d'Ivoire");
    const [inserted] = insertValues.mock.calls[0];
    expect(inserted.dataStartDate).toBeInstanceOf(Date);
    expect(inserted.dataEndDate).toBeInstanceOf(Date);
    expect(inserted.dataStartDate.getFullYear()).toBe(2024);
    expect(inserted.dataEndDate.getFullYear()).toBe(2025);
  });

  it("handles null vatAmount gracefully (treats as 0)", async () => {
    const receipts = [
      { id: "r1", amount: "1000", vatAmount: null, currency: "XOF", issuedAt: new Date("2025-05-01T00:00:00Z") },
    ];
    const { insertValues } = setupDbMocks(receipts);
    const result = await buildFiscalReceiptsAltData("user-1", "borrower-1", "CI", "Côte d'Ivoire");
    expect(result.inserted).toBe(true);
    expect(parseFloat(result.aggregate.averageMonthlyAmount)).toBe(0);
  });
});

// ─── Integration flow: grant → altdata → revoke → purge ──────────────────────

describe("Integration flow: grant → altdata created → revoke → purge", () => {
  beforeEach(() => vi.clearAllMocks());

  it("grant: calling buildFiscalReceiptsAltData inserts a record for a borrower with receipts", async () => {
    const receipts = [
      { id: "r1", amount: "500", vatAmount: "90", currency: "XOF", issuedAt: new Date("2025-04-01T00:00:00Z") },
      { id: "r2", amount: "700", vatAmount: "126", currency: "XOF", issuedAt: new Date("2025-04-15T00:00:00Z") },
    ];
    const { insertValues } = setupDbMocks(receipts);

    const result = await buildFiscalReceiptsAltData("user-grant-test", "borrower-grant-test", "CI", "Côte d'Ivoire");

    expect(result.inserted).toBe(true);
    expect(insertValues).toHaveBeenCalledOnce();
    const [row] = insertValues.mock.calls[0];
    expect(row.borrowerId).toBe("borrower-grant-test");
    expect(row.source).toBe("fiscal_receipts");
    expect(row.status).toBe("active");
    expect(row.totalTransactions).toBe(2);
    // VAT avg = (90+126)/1 month = 216
    expect(parseFloat(row.averageMonthlyAmount)).toBeCloseTo(216, 0);
  });

  it("revoke: calling purgeFiscalReceiptsAltData deletes the record for that borrower", async () => {
    const deleteReturning = vi.fn().mockResolvedValue([{ id: "alt-grant-test" }]);
    const deleteWhere = vi.fn().mockReturnValue({ returning: deleteReturning });
    mockDelete.mockReturnValue({ where: deleteWhere });

    const count = await purgeFiscalReceiptsAltData("borrower-grant-test");
    expect(count).toBe(1);
    expect(mockDelete).toHaveBeenCalledOnce();
  });

  it("after purge, altdata count is 0", async () => {
    const deleteReturning = vi.fn().mockResolvedValue([]);
    const deleteWhere = vi.fn().mockReturnValue({ returning: deleteReturning });
    mockDelete.mockReturnValue({ where: deleteWhere });

    const count = await purgeFiscalReceiptsAltData("borrower-already-purged");
    expect(count).toBe(0);
  });

  it("thin-file borrower: multiple months of receipts increases onTimePayments", async () => {
    const receipts = Array.from({ length: 6 }, (_, i) => ({
      id: `r${i}`,
      amount: "400",
      vatAmount: "72",
      currency: "XOF",
      issuedAt: new Date(`2025-0${i + 1}-10T00:00:00Z`),
    }));
    const { insertValues } = setupDbMocks(receipts);

    const result = await buildFiscalReceiptsAltData("user-thin", "borrower-thin", "CI", "Côte d'Ivoire");

    expect(result.inserted).toBe(true);
    expect(result.aggregate.onTimePayments).toBe(6);
    expect(result.aggregate.latePayments).toBe(0);
    expect(result.aggregate.totalTransactions).toBe(6);
    const [row] = insertValues.mock.calls[0];
    expect(row.onTimePayments).toBe(6);
  });
});

// ─── purgeFiscalReceiptsAltData ───────────────────────────────────────────────

describe("purgeFiscalReceiptsAltData", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns count of deleted rows", async () => {
    const deleteReturning = vi.fn().mockResolvedValue([{ id: "alt-1" }, { id: "alt-2" }]);
    const deleteWhere = vi.fn().mockReturnValue({ returning: deleteReturning });
    mockDelete.mockReturnValue({ where: deleteWhere });

    const count = await purgeFiscalReceiptsAltData("borrower-1");
    expect(count).toBe(2);
    expect(mockDelete).toHaveBeenCalledOnce();
  });

  it("returns 0 when no rows exist", async () => {
    const deleteReturning = vi.fn().mockResolvedValue([]);
    const deleteWhere = vi.fn().mockReturnValue({ returning: deleteReturning });
    mockDelete.mockReturnValue({ where: deleteWhere });

    const count = await purgeFiscalReceiptsAltData("borrower-999");
    expect(count).toBe(0);
  });
});

// ─── refreshAllFiscalReceiptsConsents ─────────────────────────────────────────

describe("refreshAllFiscalReceiptsConsents", () => {
  beforeEach(() => vi.clearAllMocks());

  it("skips consents missing userId", async () => {
    const consents = [{ id: "c1", userId: null, borrowerId: "b1", expiresAt: null }];
    mockSelect.mockReturnValue({
      from: vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue(consents) }),
    });

    const result = await refreshAllFiscalReceiptsConsents();
    expect(result.skipped).toBe(1);
    expect(result.processed).toBe(0);
    expect(result.errors).toBe(0);
  });

  it("skips consents missing borrowerId", async () => {
    const consents = [{ id: "c1", userId: "u1", borrowerId: null, expiresAt: null }];
    mockSelect.mockReturnValue({
      from: vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue(consents) }),
    });

    const result = await refreshAllFiscalReceiptsConsents();
    expect(result.skipped).toBe(1);
    expect(result.processed).toBe(0);
  });

  it("skips expired consents", async () => {
    const pastDate = new Date(Date.now() - 10000);
    const consents = [{ id: "c1", userId: "u1", borrowerId: "b1", expiresAt: pastDate }];
    mockSelect.mockReturnValue({
      from: vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue(consents) }),
    });

    const result = await refreshAllFiscalReceiptsConsents();
    expect(result.skipped).toBe(1);
    expect(result.processed).toBe(0);
  });

  it("counts errors when inner DB call throws", async () => {
    const futureDate = new Date(Date.now() + 86400000);
    const consents = [{ id: "c1", userId: "u1", borrowerId: "b1", expiresAt: futureDate }];
    let callIdx = 0;
    mockSelect.mockImplementation(() => {
      if (callIdx++ === 0) {
        return { from: vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue(consents) }) };
      }
      throw new Error("DB error");
    });

    const result = await refreshAllFiscalReceiptsConsents();
    expect(result.errors).toBe(1);
    expect(result.processed).toBe(0);
  });

  it("returns processed=0 for empty consent list", async () => {
    mockSelect.mockReturnValue({
      from: vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue([]) }),
    });
    const result = await refreshAllFiscalReceiptsConsents();
    expect(result.processed).toBe(0);
    expect(result.skipped).toBe(0);
    expect(result.errors).toBe(0);
  });
});
