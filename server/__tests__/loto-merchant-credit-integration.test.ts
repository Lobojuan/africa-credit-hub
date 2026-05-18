/**
 * Integration tests for the Loto merchant credit router
 * (server/routes/loto-merchant-credit.ts)
 *
 * Opt-in / opt-out endpoints:
 *   - POST /api/loto/merchants/me/credit-opt-in  (unified toggle: enable=true|false)
 *   - POST /api/loto/merchants/me/credit-opt-out (thin wrapper → enable=false)
 *   - POST /api/loto/merchant/credit-opt-in      (singular alias)
 *   - POST /api/loto/merchant/credit-opt-out     (singular alias)
 *
 * Breakdown endpoint:
 *   - GET /api/loto/merchants/:merchantId/credit-breakdown
 *
 * Lifecycle contract:
 *   Opt-in creates merchant_credit_profile + bureau_reputation_badge consents,
 *   runs compliance pipeline, and sets credit_opt_in_active = true.
 *   Opt-out revokes BOTH consent purposes, clears flag, then purges alt-data
 *   (privacy-first: access gate blocks immediately before purge completes).
 */

import { describe, it, expect, vi, beforeAll } from "vitest";
import express from "express";
import session from "express-session";
import request from "supertest";

// ─── Hoisted mock handles ─────────────────────────────────────────────────────
const {
  mockGetMerchant,
  mockGetConsents,
  mockDbSelect,
} = vi.hoisted(() => ({
  mockGetMerchant: vi.fn(),
  mockGetConsents: vi.fn(),
  mockDbSelect: vi.fn(),
}));

const {
  mockGetMerchantByUserId,
  mockUpdateLotoMerchantOptIn,
  mockCreateCrossProductConsent,
  mockRevokeCrossProductConsent,
  mockGetUser,
  mockBuildFiscalReceiptsAltData,
  mockPurgeFiscalReceiptsAltData,
} = vi.hoisted(() => ({
  mockGetMerchantByUserId: vi.fn(),
  mockUpdateLotoMerchantOptIn: vi.fn(),
  mockCreateCrossProductConsent: vi.fn(),
  mockRevokeCrossProductConsent: vi.fn(),
  mockGetUser: vi.fn(),
  mockBuildFiscalReceiptsAltData: vi.fn(),
  mockPurgeFiscalReceiptsAltData: vi.fn(),
}));

// Mock storage
vi.mock("../storage", () => ({
  storage: {
    getLotoMerchantById: mockGetMerchant,
    getLotoMerchantByUserId: mockGetMerchantByUserId,
    getCrossProductConsents: mockGetConsents,
    updateLotoMerchantOptIn: mockUpdateLotoMerchantOptIn,
    createCrossProductConsent: mockCreateCrossProductConsent,
    revokeCrossProductConsent: mockRevokeCrossProductConsent,
    getUser: mockGetUser,
  },
}));

// Mock db — all select chains return empty by default; individual tests override.
vi.mock("../db", () => ({
  db: { select: mockDbSelect },
}));

// Mock schema tables so drizzle column references don't fail
vi.mock("@shared/schema", () => ({
  lotoReceipts: {
    id: "r.id", vatAmount: "r.vat_amount", currency: "r.currency",
    issuedAt: "r.issued_at", category: "r.category", isDemo: "r.is_demo",
    merchantId: "r.merchant_id",
  },
  lotoFraudFlags: {
    id: "f.id", ruleCode: "f.rule_code", severity: "f.severity",
    summary: "f.summary", status: "f.status", receiptId: "f.receipt_id",
    merchantId: "f.merchant_id",
  },
  alternativeData: {
    borrowerId: "a.borrower_id", source: "a.source",
  },
  borrowers: {
    id: "b.id", email: "b.email", country: "b.country",
  },
}));

// Mock drizzle-orm helpers
vi.mock("drizzle-orm", () => ({
  eq: (a: unknown, b: unknown) => ({ type: "eq", a, b }),
  and: (...args: unknown[]) => ({ type: "and", args }),
}));

// Mock isPlatformPrivileged from middleware
vi.mock("../routes/middleware", () => ({
  isPlatformPrivileged: (role: string) =>
    role === "super_admin" || role === "platform_owner",
}));

// Mock loto-credit-pipeline (buildMerchantAltData, purgeMerchantAltData)
const {
  mockBuildMerchantAltData,
  mockPurgeMerchantAltData,
  MockPipelineCountryError,
} = vi.hoisted(() => {
  class MockPipelineCountryError extends Error {
    constructor(msg: string) { super(msg); this.name = "PipelineCountryError"; }
  }
  return {
    mockBuildMerchantAltData: vi.fn(),
    mockPurgeMerchantAltData: vi.fn(),
    MockPipelineCountryError,
  };
});

vi.mock("../loto-credit-pipeline", () => ({
  buildMerchantAltData: mockBuildMerchantAltData,
  purgeMerchantAltData: mockPurgeMerchantAltData,
  buildFiscalReceiptsAltData: mockBuildFiscalReceiptsAltData,
  purgeFiscalReceiptsAltData: mockPurgeFiscalReceiptsAltData,
  normaliseBorrowerCountry: (country: string) => {
    const map: Record<string, string> = {
      "côte d'ivoire": "CI", "cote d'ivoire": "CI", "ivory coast": "CI",
      "ghana": "GH", "nigeria": "NG",
    };
    return map[country?.toLowerCase()] ?? country?.trim().slice(0, 2).toUpperCase() ?? "";
  },
  PipelineCountryError: MockPipelineCountryError,
}));

// ─── Test helpers ─────────────────────────────────────────────────────────────

/** Chain: .from().where() → rows and .from().where().limit(1) → rows */
function makeSelectChain(rows: object[]) {
  const limit = vi.fn().mockResolvedValue(rows);
  const where = vi.fn().mockReturnValue({
    limit,
    then: (res: Function, rej: Function) => Promise.resolve(rows).then(res as any, rej as any),
  });
  const from = vi.fn().mockReturnValue({ where });
  return { from };
}

/** Set up db.select to return receipts, then flags, then altData on successive calls */
function setupDbChains(
  receipts: object[],
  flags: object[],
  altData: object[],
) {
  let idx = 0;
  mockDbSelect.mockImplementation(() => {
    const i = idx++;
    const rows = i === 0 ? receipts : i === 1 ? flags : altData;
    return makeSelectChain(rows);
  });
}

const CI_MERCHANT = {
  id: "m1",
  shopName: "Abidjan Market",
  countryCode: "CI",
  currency: "XOF",
  creditOptInActive: true,
  borrowerId: "b1",
  userId: "u-owner",
};

const ACTIVE_CONSENT = {
  purpose: "merchant_credit_profile",
  status: "active",
  merchantId: "m1",
};

// ─── App factory ──────────────────────────────────────────────────────────────

async function buildApp() {
  // Dynamic import so that mocks are in place before the module is evaluated.
  const { default: router } = await import("../routes/loto-merchant-credit");
  const app = express();
  app.use(express.json());
  app.use(
    session({
      secret: "test-secret",
      resave: false,
      saveUninitialized: true,
      cookie: { secure: false },
    }),
  );
  // Login helper that stamps the session
  app.post("/test/login", (req, res) => {
    Object.assign(req.session, req.body);
    res.json({ ok: true });
  });
  // Mount the router — note: routes.ts adds requireAuth before this router;
  // in tests we replicate it via the session stamp so we can test 401 too.
  app.use("/api/loto", router);
  return app;
}

// ─── Tests ────────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/loto/merchants/me/credit-opt-in
// POST /api/loto/merchants/me/credit-opt-out
// ─────────────────────────────────────────────────────────────────────────────

describe("POST /api/loto/merchants/me/credit-opt-in — integration", () => {
  let app: express.Express;

  beforeAll(async () => {
    app = await buildApp();
  });

  beforeEach(() => {
    mockGetMerchantByUserId.mockReset();
    mockUpdateLotoMerchantOptIn.mockReset();
    mockCreateCrossProductConsent.mockReset();
    mockBuildMerchantAltData.mockReset();
  });

  it("returns 401 when unauthenticated", async () => {
    const res = await request(app).post("/api/loto/merchants/me/credit-opt-in");
    expect(res.status).toBe(401);
  });

  it("returns 404 when no merchant found for user", async () => {
    mockGetMerchantByUserId.mockResolvedValue(null);
    const agent = request.agent(app);
    await agent.post("/test/login").send({ userId: "u-no-merchant", userRole: "lender" });
    const res = await agent.post("/api/loto/merchants/me/credit-opt-in");
    expect(res.status).toBe(404);
    expect(res.body.message).toBe("merchant_not_found");
  });

  it("persists opt-in flag + creates BOTH consents + inserts alt-data when merchant has a linked borrower", async () => {
    mockGetMerchantByUserId.mockResolvedValue(CI_MERCHANT);
    mockUpdateLotoMerchantOptIn.mockResolvedValue({ ...CI_MERCHANT, creditOptInActive: true });
    // First call returns the merchant_credit_profile consent (consentId surfaced in response)
    mockCreateCrossProductConsent
      .mockResolvedValueOnce({ id: "consent-1", status: "active" })
      .mockResolvedValueOnce({ id: "consent-badge-1", status: "active" });
    mockBuildMerchantAltData.mockResolvedValue({ inserted: true, aggregate: { borrowerId: "b1" } });

    const agent = request.agent(app);
    await agent.post("/test/login").send({ userId: "u-owner", userRole: "lender" });
    const res = await agent.post("/api/loto/merchants/me/credit-opt-in");

    expect(res.status).toBe(200);
    expect(res.body.optInActive).toBe(true);
    expect(res.body.altDataInserted).toBe(true);
    expect(res.body.consentId).toBe("consent-1");

    // Flag persisted
    expect(mockUpdateLotoMerchantOptIn).toHaveBeenCalledWith("m1", true);
    // BOTH consent purposes created in a single opt-in
    expect(mockCreateCrossProductConsent).toHaveBeenCalledTimes(2);
    expect(mockCreateCrossProductConsent).toHaveBeenCalledWith(
      expect.objectContaining({
        merchantId: "m1",
        purpose: "merchant_credit_profile",
        sourceProduct: "loto",
        targetProduct: "credit",
        status: "active",
      }),
    );
    expect(mockCreateCrossProductConsent).toHaveBeenCalledWith(
      expect.objectContaining({
        merchantId: "m1",
        purpose: "bureau_reputation_badge",
        sourceProduct: "loto",
        targetProduct: "credit",
        status: "active",
      }),
    );
    expect(mockBuildMerchantAltData).toHaveBeenCalledWith("m1", "CI");
  });

  it("creates BOTH consents even when buildMerchantAltData throws PipelineCountryError (no borrower link)", async () => {
    mockGetMerchantByUserId.mockResolvedValue({ ...CI_MERCHANT, borrowerId: null });
    mockUpdateLotoMerchantOptIn.mockResolvedValue({ ...CI_MERCHANT, borrowerId: null, creditOptInActive: true });
    mockCreateCrossProductConsent
      .mockResolvedValueOnce({ id: "consent-2", status: "active" })
      .mockResolvedValueOnce({ id: "consent-badge-2", status: "active" });
    mockBuildMerchantAltData.mockRejectedValue(new MockPipelineCountryError("no borrower"));

    const agent = request.agent(app);
    await agent.post("/test/login").send({ userId: "u-owner", userRole: "lender" });
    const res = await agent.post("/api/loto/merchants/me/credit-opt-in");

    // Opt-in still succeeds — borrower can be linked later via nightly refresh
    expect(res.status).toBe(200);
    expect(res.body.optInActive).toBe(true);
    expect(res.body.altDataInserted).toBe(false);
    expect(res.body.consentId).toBe("consent-2");
    // Flag and BOTH consents were still persisted
    expect(mockUpdateLotoMerchantOptIn).toHaveBeenCalledWith("m1", true);
    expect(mockCreateCrossProductConsent).toHaveBeenCalledTimes(2);
  });

  it("returns 500 on unexpected pipeline errors (non-PipelineCountryError)", async () => {
    mockGetMerchantByUserId.mockResolvedValue(CI_MERCHANT);
    mockUpdateLotoMerchantOptIn.mockResolvedValue(CI_MERCHANT);
    mockCreateCrossProductConsent.mockResolvedValue({ id: "consent-3", status: "active" });
    mockBuildMerchantAltData.mockRejectedValue(new Error("db connection failed"));

    const agent = request.agent(app);
    await agent.post("/test/login").send({ userId: "u-owner", userRole: "lender" });
    const res = await agent.post("/api/loto/merchants/me/credit-opt-in");
    expect(res.status).toBe(500);
  });
});

describe("POST /api/loto/merchants/me/credit-opt-out — integration", () => {
  let app: express.Express;

  beforeAll(async () => {
    app = await buildApp();
  });

  beforeEach(() => {
    mockPurgeMerchantAltData.mockReset();
    mockGetMerchantByUserId.mockReset();
    mockUpdateLotoMerchantOptIn.mockReset();
    mockRevokeCrossProductConsent.mockReset();
    mockGetConsents.mockReset();
  });

  it("returns 401 when unauthenticated", async () => {
    const res = await request(app).post("/api/loto/merchants/me/credit-opt-out");
    expect(res.status).toBe(401);
  });

  it("revokes BOTH active consents + clears opt-in flag + purges alt-data and returns optInActive=false", async () => {
    mockGetMerchantByUserId.mockResolvedValue(CI_MERCHANT);
    // Both consent purposes present (as created by opt-in)
    mockGetConsents.mockResolvedValue([
      { id: "consent-99",    purpose: "merchant_credit_profile", status: "active" },
      { id: "consent-badge", purpose: "bureau_reputation_badge", status: "active" },
    ]);
    mockRevokeCrossProductConsent.mockResolvedValue({ status: "revoked" });
    mockUpdateLotoMerchantOptIn.mockResolvedValue({ ...CI_MERCHANT, creditOptInActive: false });
    mockPurgeMerchantAltData.mockResolvedValue(2);

    const agent = request.agent(app);
    await agent.post("/test/login").send({ userId: "u-owner", userRole: "lender" });
    const res = await agent.post("/api/loto/merchants/me/credit-opt-out");

    expect(res.status).toBe(200);
    expect(res.body.optInActive).toBe(false);
    expect(res.body.altDataPurged).toBe(2);
    // Both purposes revoked
    expect(res.body.consentsRevoked).toBe(2);

    // Consents revoked BEFORE opt-in flag cleared (access gate blocked immediately)
    expect(mockRevokeCrossProductConsent).toHaveBeenCalledTimes(2);
    expect(mockRevokeCrossProductConsent).toHaveBeenCalledWith("consent-99", "merchant_opted_out");
    expect(mockRevokeCrossProductConsent).toHaveBeenCalledWith("consent-badge", "merchant_opted_out");
    expect(mockUpdateLotoMerchantOptIn).toHaveBeenCalledWith("m1", false);
    expect(mockPurgeMerchantAltData).toHaveBeenCalledWith("b1");
  });

  it("skips purgeMerchantAltData and returns altDataPurged=0 when merchant has no borrowerId", async () => {
    mockGetMerchantByUserId.mockResolvedValue({ ...CI_MERCHANT, borrowerId: null });
    mockGetConsents.mockResolvedValue([]);
    mockUpdateLotoMerchantOptIn.mockResolvedValue({ ...CI_MERCHANT, borrowerId: null, creditOptInActive: false });

    const agent = request.agent(app);
    await agent.post("/test/login").send({ userId: "u-owner", userRole: "lender" });
    const res = await agent.post("/api/loto/merchants/me/credit-opt-out");

    expect(res.status).toBe(200);
    expect(res.body.altDataPurged).toBe(0);
    expect(res.body.consentsRevoked).toBe(0);
    // purge not called when no borrower link
    expect(mockPurgeMerchantAltData).not.toHaveBeenCalled();
  });

  it("full opt-in → opt-out lifecycle: non-opted lender blocked, opted lender allowed, post-opt-out lender blocked", async () => {
    // PHASE 1: lender blocked before opt-in
    mockGetMerchant.mockResolvedValue({ ...CI_MERCHANT, userId: "u-owner" });
    mockGetConsents.mockResolvedValue([]);
    setupDbChains([], [], []);
    const agent = request.agent(app);
    await agent.post("/test/login").send({ userId: "u-lender", userRole: "lender" });
    const preOptIn = await agent.get("/api/loto/merchants/m1/credit-breakdown");
    expect(preOptIn.status).toBe(403);
    expect(preOptIn.body.message).toBe("no_active_merchant_consent");

    // PHASE 2: merchant opts in → BOTH consents created + flag set + alt_data inserted
    mockGetMerchantByUserId.mockResolvedValue(CI_MERCHANT);
    mockUpdateLotoMerchantOptIn.mockResolvedValue({ ...CI_MERCHANT, creditOptInActive: true });
    mockCreateCrossProductConsent
      .mockResolvedValueOnce({ id: "consent-lc1", status: "active" })
      .mockResolvedValueOnce({ id: "consent-badge-lc1", status: "active" });
    mockBuildMerchantAltData.mockResolvedValue({ inserted: true, aggregate: {} });
    const ownerAgent = request.agent(app);
    await ownerAgent.post("/test/login").send({ userId: "u-owner", userRole: "lender" });
    const optInRes = await ownerAgent.post("/api/loto/merchants/me/credit-opt-in");
    expect(optInRes.status).toBe(200);
    expect(optInRes.body.altDataInserted).toBe(true);
    expect(optInRes.body.consentId).toBe("consent-lc1");

    // Simulate active consent now present → lender can see breakdown
    mockGetConsents.mockResolvedValue([ACTIVE_CONSENT]);
    const altRow = { id: "alt-1", source: "merchant", borrowerId: "b1", rawScore: 65, provider: "Loto Fiscal Compliance" };
    setupDbChains([], [], [altRow]);
    const postOptIn = await agent.get("/api/loto/merchants/m1/credit-breakdown");
    expect(postOptIn.status).toBe(200);
    expect(postOptIn.body.creditScoreContribution.persisted).toBe(true);
    expect(postOptIn.body.creditScoreContribution.source).toBe("Loto Fiscal Compliance");
    expect(postOptIn.body.altDataRecord).not.toBeNull();

    // PHASE 3: merchant opts out → BOTH consents revoked + flag cleared + alt_data purged → lender blocked
    mockGetMerchantByUserId.mockResolvedValue(CI_MERCHANT);
    mockGetConsents.mockResolvedValue([
      { id: "consent-lc1",      purpose: "merchant_credit_profile", status: "active" },
      { id: "consent-badge-lc1", purpose: "bureau_reputation_badge", status: "active" },
    ]);
    mockRevokeCrossProductConsent.mockResolvedValue({ status: "revoked" });
    mockUpdateLotoMerchantOptIn.mockResolvedValue({ ...CI_MERCHANT, creditOptInActive: false });
    mockPurgeMerchantAltData.mockResolvedValue(1);
    const optOutRes = await ownerAgent.post("/api/loto/merchants/me/credit-opt-out");
    expect(optOutRes.status).toBe(200);
    expect(optOutRes.body.altDataPurged).toBe(1);
    expect(optOutRes.body.consentsRevoked).toBe(2);

    // Access gate now sees revoked consent → 403
    mockGetConsents.mockResolvedValue([{ ...ACTIVE_CONSENT, status: "revoked" }]);
    setupDbChains([], [], []);
    const postOptOut = await agent.get("/api/loto/merchants/m1/credit-breakdown");
    expect(postOptOut.status).toBe(403);
    expect(postOptOut.body.message).toBe("no_active_merchant_consent");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Unified toggle: POST /merchants/me/credit-opt-in with { enable: false }
// Singular aliases: POST /merchant/credit-opt-in and /merchant/credit-opt-out
// ─────────────────────────────────────────────────────────────────────────────

describe("Unified toggle (enable: false) + singular aliases — integration", () => {
  let app: express.Express;

  beforeAll(async () => {
    app = await buildApp();
  });

  beforeEach(() => {
    mockPurgeMerchantAltData.mockReset();
    mockGetMerchantByUserId.mockReset();
    mockUpdateLotoMerchantOptIn.mockReset();
    mockRevokeCrossProductConsent.mockReset();
    mockGetConsents.mockReset();
    mockCreateCrossProductConsent.mockReset();
    mockBuildMerchantAltData.mockReset();
  });

  it("POST /merchants/me/credit-opt-in with { enable: false } triggers opt-out path", async () => {
    mockGetMerchantByUserId.mockResolvedValue(CI_MERCHANT);
    mockGetConsents.mockResolvedValue([
      { id: "consent-t1", purpose: "merchant_credit_profile", status: "active" },
      { id: "consent-t2", purpose: "bureau_reputation_badge", status: "active" },
    ]);
    mockRevokeCrossProductConsent.mockResolvedValue({ status: "revoked" });
    mockUpdateLotoMerchantOptIn.mockResolvedValue({ ...CI_MERCHANT, creditOptInActive: false });
    mockPurgeMerchantAltData.mockResolvedValue(1);

    const agent = request.agent(app);
    await agent.post("/test/login").send({ userId: "u-owner", userRole: "lender" });
    const res = await agent.post("/api/loto/merchants/me/credit-opt-in").send({ enable: false });

    expect(res.status).toBe(200);
    expect(res.body.optInActive).toBe(false);
    expect(res.body.consentsRevoked).toBe(2);
    expect(res.body.altDataPurged).toBe(1);
    // Pipeline NOT called on opt-out
    expect(mockBuildMerchantAltData).not.toHaveBeenCalled();
    // Consent creation NOT called on opt-out
    expect(mockCreateCrossProductConsent).not.toHaveBeenCalled();
  });

  it("POST /merchant/credit-opt-in (singular alias) triggers opt-in path and returns consentId", async () => {
    mockGetMerchantByUserId.mockResolvedValue(CI_MERCHANT);
    mockUpdateLotoMerchantOptIn.mockResolvedValue({ ...CI_MERCHANT, creditOptInActive: true });
    mockCreateCrossProductConsent
      .mockResolvedValueOnce({ id: "consent-s1", status: "active" })
      .mockResolvedValueOnce({ id: "consent-s2", status: "active" });
    mockBuildMerchantAltData.mockResolvedValue({ inserted: true, aggregate: {} });

    const agent = request.agent(app);
    await agent.post("/test/login").send({ userId: "u-owner", userRole: "lender" });
    const res = await agent.post("/api/loto/merchant/credit-opt-in");

    expect(res.status).toBe(200);
    expect(res.body.optInActive).toBe(true);
    expect(res.body.consentId).toBe("consent-s1");
    expect(mockCreateCrossProductConsent).toHaveBeenCalledTimes(2);
  });

  it("POST /merchant/credit-opt-out (singular alias) triggers opt-out path", async () => {
    mockGetMerchantByUserId.mockResolvedValue(CI_MERCHANT);
    mockGetConsents.mockResolvedValue([
      { id: "consent-so1", purpose: "merchant_credit_profile", status: "active" },
    ]);
    mockRevokeCrossProductConsent.mockResolvedValue({ status: "revoked" });
    mockUpdateLotoMerchantOptIn.mockResolvedValue({ ...CI_MERCHANT, creditOptInActive: false });
    mockPurgeMerchantAltData.mockResolvedValue(1);

    const agent = request.agent(app);
    await agent.post("/test/login").send({ userId: "u-owner", userRole: "lender" });
    const res = await agent.post("/api/loto/merchant/credit-opt-out");

    expect(res.status).toBe(200);
    expect(res.body.optInActive).toBe(false);
    expect(res.body.consentsRevoked).toBe(1);
    expect(res.body.altDataPurged).toBe(1);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/loto/merchants/:merchantId/credit-breakdown
// ─────────────────────────────────────────────────────────────────────────────

describe("GET /api/loto/merchants/:merchantId/credit-breakdown — integration", () => {
  let app: express.Express;

  beforeAll(async () => {
    app = await buildApp();
  });

  // helper: log in, then GET the breakdown
  async function getBreakdown(userId: string, userRole: string, merchantId = "m1") {
    const agent = request.agent(app);
    await agent.post("/test/login").send({ userId, userRole });
    return agent.get(`/api/loto/merchants/${merchantId}/credit-breakdown`);
  }

  // ── 1. Unauthenticated ──────────────────────────────────────────────────────
  it("returns 401 when no userId in session", async () => {
    mockGetMerchant.mockResolvedValue(CI_MERCHANT);
    setupDbChains([], [], []);
    const res = await request(app).get("/api/loto/merchants/m1/credit-breakdown");
    expect(res.status).toBe(401);
  });

  // ── 2. Merchant not found ───────────────────────────────────────────────────
  it("returns 404 when merchant does not exist", async () => {
    mockGetMerchant.mockResolvedValue(null);
    setupDbChains([], [], []);
    const res = await getBreakdown("u-lender", "lender", "m-not-found");
    expect(res.status).toBe(404);
    expect(res.body.message).toBe("merchant_not_found");
  });

  // ── 3. Owner always allowed (no consent needed) ─────────────────────────────
  it("returns 200 for the merchant owner without any consent record", async () => {
    mockGetMerchant.mockResolvedValue(CI_MERCHANT);
    mockGetConsents.mockResolvedValue([]);
    setupDbChains([], [], []);
    const res = await getBreakdown("u-owner", "lender");
    expect(res.status).toBe(200);
    expect(res.body.merchant.id).toBe("m1");
  });

  // ── 4. super_admin always allowed ──────────────────────────────────────────
  it("returns 200 for super_admin without any consent record", async () => {
    mockGetMerchant.mockResolvedValue(CI_MERCHANT);
    mockGetConsents.mockResolvedValue([]);
    setupDbChains([], [], []);
    const res = await getBreakdown("u-admin", "super_admin");
    expect(res.status).toBe(200);
  });

  // ── 5. Lender blocked when no consent ──────────────────────────────────────
  it("returns 403 no_active_merchant_consent for lender when merchant has not opted in", async () => {
    mockGetMerchant.mockResolvedValue({ ...CI_MERCHANT, userId: "u-someone-else" });
    mockGetConsents.mockResolvedValue([]);  // no active consent
    setupDbChains([], [], []);
    const res = await getBreakdown("u-lender", "lender");
    expect(res.status).toBe(403);
    expect(res.body.message).toBe("no_active_merchant_consent");
  });

  // ── 6. Lender allowed when merchant has opted in (active consent) ───────────
  it("returns 200 for lender when merchant has active merchant_credit_profile consent", async () => {
    mockGetMerchant.mockResolvedValue({ ...CI_MERCHANT, userId: "u-someone-else" });
    mockGetConsents.mockResolvedValue([ACTIVE_CONSENT]);
    setupDbChains([], [], []);
    const res = await getBreakdown("u-lender", "lender");
    expect(res.status).toBe(200);
  });

  // ── 7. Viewer role blocked (not lender/regulator/admin) ────────────────────
  it("returns 403 access_denied for viewer role (not lender, regulator, or admin)", async () => {
    mockGetMerchant.mockResolvedValue({ ...CI_MERCHANT, userId: "u-someone-else" });
    mockGetConsents.mockResolvedValue([ACTIVE_CONSENT]);
    setupDbChains([], [], []);
    const res = await getBreakdown("u-viewer", "viewer");
    expect(res.status).toBe(403);
    expect(res.body.message).toBe("access_denied");
  });

  // ── 8. Opt-in state: creditScoreContribution.persisted = true ──────────────
  it("returns persisted=true and correct source label when alt_data record exists (post opt-in)", async () => {
    mockGetMerchant.mockResolvedValue(CI_MERCHANT);
    const altDataRow = { id: "alt-1", source: "merchant", borrowerId: "b1", rawScore: 72 };
    setupDbChains(
      [{ id: "r1", vatAmount: "1000", currency: "XOF", issuedAt: new Date(), category: "food" }],
      [],
      [altDataRow],
    );
    const res = await getBreakdown("u-owner", "lender");
    expect(res.status).toBe(200);
    const { creditScoreContribution } = res.body;
    expect(creditScoreContribution.source).toBe("Loto Fiscal Compliance");
    expect(creditScoreContribution.persisted).toBe(true);
    expect(creditScoreContribution.rawScore).toBe(72);
    // 72/90 * 30 = 24
    expect(creditScoreContribution.altDataBonus).toBe(24);
    expect(creditScoreContribution.altDataBonus).toBeGreaterThanOrEqual(0);
    expect(creditScoreContribution.altDataBonus).toBeLessThanOrEqual(30);
    expect(creditScoreContribution.description).toMatch(/max \+30 pts/);
  });

  // ── 9. Opt-out state: persisted = false, bonus derived from live compliance ─
  it("returns persisted=false when no alt_data record (post opt-out / never opted)", async () => {
    mockGetMerchant.mockResolvedValue(CI_MERCHANT);
    setupDbChains([], [], []);  // no altData row
    const res = await getBreakdown("u-owner", "lender");
    expect(res.status).toBe(200);
    expect(res.body.creditScoreContribution.persisted).toBe(false);
    expect(res.body.creditScoreContribution.altDataBonus).toBeGreaterThanOrEqual(0);
    expect(res.body.creditScoreContribution.altDataBonus).toBeLessThanOrEqual(30);
  });

  // ── 10. vatTrend always has exactly 6 months ────────────────────────────────
  it("vatTrend always has 6 entries regardless of receipt density", async () => {
    mockGetMerchant.mockResolvedValue(CI_MERCHANT);
    setupDbChains([], [], []);
    const res = await getBreakdown("u-owner", "lender");
    expect(res.status).toBe(200);
    expect(res.body.vatTrend).toHaveLength(6);
    expect(res.body.vatTrend[0]).toHaveProperty("month");
    expect(res.body.vatTrend[0]).toHaveProperty("vat");
  });

  // ── 11. On-time ratio: multiple flags on same receipt = ONE late payment ────
  it("counts one receipt flagged twice as exactly 1 late payment (on-time ratio clamped to [0,1])", async () => {
    mockGetMerchant.mockResolvedValue(CI_MERCHANT);
    const now = new Date();
    const receipts = [
      { id: "r1", vatAmount: "500", currency: "XOF", issuedAt: now, category: "food" },
      { id: "r2", vatAmount: "500", currency: "XOF", issuedAt: now, category: "food" },
    ];
    // Two open flags pointing at the same receipt "r1" — should count as 1 late payment
    const flags = [
      { id: "f1", ruleCode: "DUPLICATE_FISCAL_CODE", status: "open", receiptId: "r1" },
      { id: "f2", ruleCode: "GHOST_MERCHANT", status: "open", receiptId: "r1" },
    ];
    setupDbChains(receipts, flags, []);
    const res = await getBreakdown("u-owner", "lender");
    expect(res.status).toBe(200);
    // 1 of 2 receipts flagged → onTimeRatio = 50%
    expect(res.body.creditScoreContribution.onTimeRatio).toBe(50);
  });

  // ── 12. Full lifecycle: opt-in → visibility → opt-out → exclusion ──────────
  it("full lifecycle: opt-in inserts alt_data, breakdown sees it; opt-out removes it, breakdown shows persisted=false", async () => {
    // PHASE 1: opt-in — lender cannot see breakdown yet (no consent)
    mockGetMerchant.mockResolvedValue({ ...CI_MERCHANT, userId: "u-owner" });
    mockGetConsents.mockResolvedValue([]);
    setupDbChains([], [], []);
    const preOptIn = await getBreakdown("u-lender", "lender");
    expect(preOptIn.status).toBe(403);
    expect(preOptIn.body.message).toBe("no_active_merchant_consent");

    // PHASE 2: merchant opts in → active consent created (simulated by mock)
    mockGetConsents.mockResolvedValue([ACTIVE_CONSENT]);
    const altRow = { id: "alt-1", source: "merchant", borrowerId: "b1", rawScore: 65 };
    setupDbChains(
      [{ id: "r1", vatAmount: "2000", currency: "XOF", issuedAt: new Date(), category: "food" }],
      [],
      [altRow],
    );
    const postOptIn = await getBreakdown("u-lender", "lender");
    expect(postOptIn.status).toBe(200);
    expect(postOptIn.body.creditScoreContribution.persisted).toBe(true);
    expect(postOptIn.body.altDataRecord).not.toBeNull();
    expect(postOptIn.body.altDataRecord.source).toBe("merchant");

    // PHASE 3: merchant opts out → consent revoked + alt_data purged
    mockGetConsents.mockResolvedValue([{ ...ACTIVE_CONSENT, status: "revoked" }]);
    setupDbChains([], [], []);  // altDataRecord gone
    const postOptOut = await getBreakdown("u-lender", "lender");
    expect(postOptOut.status).toBe(403);  // consent revoked → lender blocked again
    expect(postOptOut.body.message).toBe("no_active_merchant_consent");

    // PHASE 4: owner can still see breakdown but persisted=false (data was purged)
    setupDbChains([], [], []);
    const ownerView = await getBreakdown("u-owner", "lender");
    expect(ownerView.status).toBe(200);
    expect(ownerView.body.creditScoreContribution.persisted).toBe(false);
    expect(ownerView.body.altDataRecord).toBeNull();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Consumer credit bridge
// POST /api/loto/consumers/me/credit-opt-in  (unified toggle)
// POST /api/loto/consumers/me/credit-opt-out (thin wrapper)
// ─────────────────────────────────────────────────────────────────────────────

/** Build a db.select() chain that resolves .from().where().limit(1) → [row] */
function makeBorrowerSelectChain(row: object | null) {
  const limit = vi.fn().mockResolvedValue(row ? [row] : []);
  const where = vi.fn().mockReturnValue({ limit });
  const from = vi.fn().mockReturnValue({ where });
  return { from };
}

const CI_BORROWER = {
  id: "borrow-1",
  email: "consumer@example.com",
  country: "Côte d'Ivoire",
};

describe("POST /api/loto/consumers/me/credit-opt-in — integration", () => {
  let app: express.Express;

  beforeAll(async () => {
    app = await buildApp();
  });

  beforeEach(() => {
    mockGetUser.mockReset();
    mockGetConsents.mockReset();
    mockCreateCrossProductConsent.mockReset();
    mockRevokeCrossProductConsent.mockReset();
    mockBuildFiscalReceiptsAltData.mockReset();
    mockPurgeFiscalReceiptsAltData.mockReset();
    // db.select is used for the borrower lookup inside handleConsumerOptIn
    mockDbSelect.mockReset();
  });

  it("returns 401 when unauthenticated", async () => {
    const res = await request(app).post("/api/loto/consumers/me/credit-opt-in");
    expect(res.status).toBe(401);
  });

  it("returns 404 when no borrower is linked to the session user", async () => {
    mockGetUser.mockResolvedValue({ id: "u-c1", email: "consumer@example.com" });
    // db.select returns no borrower row
    mockDbSelect.mockReturnValue(makeBorrowerSelectChain(null));

    const agent = request.agent(app);
    await agent.post("/test/login").send({ userId: "u-c1", userRole: "viewer" });
    const res = await agent.post("/api/loto/consumers/me/credit-opt-in");
    expect(res.status).toBe(404);
    expect(res.body.message).toBe("no_linked_borrower");
  });

  it("creates BOTH consents + calls pipeline when borrower is linked", async () => {
    mockGetUser.mockResolvedValue({ id: "u-c2", email: "consumer@example.com" });
    mockDbSelect.mockReturnValue(makeBorrowerSelectChain(CI_BORROWER));
    mockCreateCrossProductConsent
      .mockResolvedValueOnce({ id: "fc-1", status: "active" })
      .mockResolvedValueOnce({ id: "sc-1", status: "active" });
    mockBuildFiscalReceiptsAltData.mockResolvedValue({ inserted: true, aggregate: {} });

    const agent = request.agent(app);
    await agent.post("/test/login").send({ userId: "u-c2", userRole: "viewer" });
    const res = await agent.post("/api/loto/consumers/me/credit-opt-in");

    expect(res.status).toBe(200);
    expect(res.body.optInActive).toBe(true);
    expect(res.body.altDataInserted).toBe(true);
    expect(res.body.borrowerId).toBe("borrow-1");

    // Both consent purposes created
    expect(mockCreateCrossProductConsent).toHaveBeenCalledTimes(2);
    expect(mockCreateCrossProductConsent).toHaveBeenCalledWith(
      expect.objectContaining({ purpose: "fiscal_receipts_credit", sourceProduct: "loto", targetProduct: "credit" }),
    );
    expect(mockCreateCrossProductConsent).toHaveBeenCalledWith(
      expect.objectContaining({ purpose: "consumer_spending_credit", sourceProduct: "loto", targetProduct: "credit" }),
    );
    // Pipeline called with correct args
    expect(mockBuildFiscalReceiptsAltData).toHaveBeenCalledWith(
      "u-c2", "borrow-1", "CI", "Côte d'Ivoire",
    );
  });

  it("opt-in succeeds (altDataInserted=false) when PipelineCountryError thrown (no receipts in country)", async () => {
    mockGetUser.mockResolvedValue({ id: "u-c3", email: "consumer@example.com" });
    mockDbSelect.mockReturnValue(makeBorrowerSelectChain(CI_BORROWER));
    mockCreateCrossProductConsent
      .mockResolvedValueOnce({ id: "fc-2", status: "active" })
      .mockResolvedValueOnce({ id: "sc-2", status: "active" });
    mockBuildFiscalReceiptsAltData.mockRejectedValue(new MockPipelineCountryError("no receipts"));

    const agent = request.agent(app);
    await agent.post("/test/login").send({ userId: "u-c3", userRole: "viewer" });
    const res = await agent.post("/api/loto/consumers/me/credit-opt-in");

    expect(res.status).toBe(200);
    expect(res.body.optInActive).toBe(true);
    expect(res.body.altDataInserted).toBe(false);
    expect(mockCreateCrossProductConsent).toHaveBeenCalledTimes(2);
  });

  it("opt-out with { enable: false } revokes BOTH consent purposes + purges alt-data", async () => {
    mockGetUser.mockResolvedValue({ id: "u-c4", email: "consumer@example.com" });
    mockDbSelect.mockReturnValue(makeBorrowerSelectChain(CI_BORROWER));
    mockGetConsents.mockResolvedValue([
      { id: "fc-99", purpose: "fiscal_receipts_credit", status: "active" },
      { id: "sc-99", purpose: "consumer_spending_credit", status: "active" },
    ]);
    mockRevokeCrossProductConsent.mockResolvedValue({ status: "revoked" });
    mockPurgeFiscalReceiptsAltData.mockResolvedValue(1);

    const agent = request.agent(app);
    await agent.post("/test/login").send({ userId: "u-c4", userRole: "viewer" });
    const res = await agent.post("/api/loto/consumers/me/credit-opt-in").send({ enable: false });

    expect(res.status).toBe(200);
    expect(res.body.optInActive).toBe(false);
    expect(res.body.consentsRevoked).toBe(2);
    expect(res.body.altDataPurged).toBe(1);
    expect(mockRevokeCrossProductConsent).toHaveBeenCalledTimes(2);
    expect(mockPurgeFiscalReceiptsAltData).toHaveBeenCalledWith("borrow-1");
    // Pipeline NOT called on opt-out
    expect(mockBuildFiscalReceiptsAltData).not.toHaveBeenCalled();
  });

  it("POST /consumers/me/credit-opt-out (thin wrapper) triggers opt-out path", async () => {
    mockGetUser.mockResolvedValue({ id: "u-c5", email: "consumer@example.com" });
    mockDbSelect.mockReturnValue(makeBorrowerSelectChain(CI_BORROWER));
    mockGetConsents.mockResolvedValue([
      { id: "fc-100", purpose: "fiscal_receipts_credit", status: "active" },
    ]);
    mockRevokeCrossProductConsent.mockResolvedValue({ status: "revoked" });
    mockPurgeFiscalReceiptsAltData.mockResolvedValue(1);

    const agent = request.agent(app);
    await agent.post("/test/login").send({ userId: "u-c5", userRole: "viewer" });
    const res = await agent.post("/api/loto/consumers/me/credit-opt-out");

    expect(res.status).toBe(200);
    expect(res.body.optInActive).toBe(false);
    expect(res.body.consentsRevoked).toBe(1);
    expect(res.body.altDataPurged).toBe(1);
  });
});
