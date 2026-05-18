/**
 * API tests for /api/loto/merchant/fiscal-account and
 *              /api/loto/merchant/receipts/:id/flag
 *
 * Task #489 — Merchant Compliance Dashboard (Compte Fournisseur TVA)
 *
 * Uses vi.mock to control storage responses precisely so every country-isolation
 * and auth assertion is deterministic — no real DB data is required.
 *
 * Covers:
 *   - 401 when unauthenticated
 *   - 404 when authenticated but no merchant profile found
 *   - 403 when a non-admin requests another merchant by ID
 *   - 403 when country-scoped admin has no sessionCountry (self-access path)
 *   - 403 when country-scoped admin's sessionCountry mismatches merchant country (self-access)
 *   - 403 when country-scoped admin has no sessionCountry (admin ?merchantId= path)
 *   - 403 cross-country: DGI-CI officer querying NG merchant by ID
 *   - 404 when admin queries a nonexistent merchant by ID
 *   - flag endpoint: 401 unauthenticated, 404 no merchant, 403 no country scope
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import express from "express";
import session from "express-session";
import request from "supertest";

// ─── Mock storage BEFORE importing the router ─────────────────────────────────
// We must mock the module path exactly as imported by loto-fiscal.ts.
vi.mock("../storage", () => ({
  storage: {
    getLotoMerchantByUserId: vi.fn(),
    getLotoMerchantById: vi.fn(),
    createLotoFraudFlag: vi.fn(),
    getLotoAuditLogs: vi.fn().mockResolvedValue([]),
    createLotoAuditLog: vi.fn().mockResolvedValue({}),
  },
}));

// Mock DB queries (db.*) used for KPI/ledger data inside the route.
// We redirect these to empty sets so the route can reach the 200 path without
// failing — though most tests exit before DB KPI queries run.
vi.mock("../db", () => ({
  db: {
    select: vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          orderBy: vi.fn().mockResolvedValue([]),
          limit: vi.fn().mockResolvedValue([]),
          then: vi.fn(),
        }),
        orderBy: vi.fn().mockResolvedValue([]),
        limit: vi.fn().mockResolvedValue([]),
        groupBy: vi.fn().mockReturnValue({
          orderBy: vi.fn().mockResolvedValue([]),
        }),
      }),
    }),
    insert: vi.fn().mockReturnValue({
      values: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([{ id: "flag-001" }]),
      }),
    }),
  },
}));

// Mock webhook delivery so it doesn't attempt real HTTP calls.
vi.mock("../routes/loto-admin", () => ({}));

// Import after mocks are in place.
import { storage } from "../storage";
import lotoFiscalRouter from "../routes/loto-fiscal";

// ─── Typed mock helpers ───────────────────────────────────────────────────────

const mockStorage = storage as {
  getLotoMerchantByUserId: ReturnType<typeof vi.fn>;
  getLotoMerchantById: ReturnType<typeof vi.fn>;
  createLotoFraudFlag: ReturnType<typeof vi.fn>;
};

function makeMerchant(overrides: Partial<{ id: string; userId: string; countryCode: string }> = {}) {
  return {
    id: overrides.id ?? "merchant-ci-001",
    userId: overrides.userId ?? "user-ci",
    shopName: "Test Shop CI",
    ownerName: "Test Owner",
    countryCode: overrides.countryCode ?? "CI",
    currency: "XOF",
    city: "Abidjan",
    category: "retail",
    registeredAt: new Date(),
    vatRegistrationNumber: "VAT-001",
    creditOptInActive: false,
    fiscalId: "NCC-0001",
    fiscalIdType: "NCC",
    fiscalIdVerified: true,
    borrowerId: null,
  };
}

// ─── Test app factory ─────────────────────────────────────────────────────────

function buildTestApp() {
  const app = express();
  app.use(express.json());
  app.set("trust proxy", 1);
  app.use(
    session({
      secret: "test-secret-only",
      resave: false,
      saveUninitialized: true,
      cookie: { secure: false },
    })
  );
  app.post("/test/login", (req, res) => {
    Object.assign(req.session, req.body);
    res.json({ ok: true });
  });
  app.use("/api/loto", lotoFiscalRouter);
  return app;
}

const app = buildTestApp();
const agent = () => request.agent(app);

async function loginAs(ag: ReturnType<typeof agent>, sessionData: Record<string, unknown>) {
  await ag.post("/test/login").send(sessionData).expect(200);
}

// ─── Session fixtures ──────────────────────────────────────────────────────────

const PLATFORM_OWNER = { userId: "user-owner", userRole: "platform_owner" };
const DGI_OFFICER_CI = { userId: "user-dgi-ci", userRole: "dgi_officer", userCountry: "CI" };
const DGI_OFFICER_NG = { userId: "user-dgi-ng", userRole: "dgi_officer", userCountry: "NG" };
const DGI_NO_COUNTRY = { userId: "user-dgi-none", userRole: "dgi_officer" };  // no userCountry
const REGULAR_USER = { userId: "user-lender", userRole: "lender", userCountry: "CI" };

const CI_MERCHANT = makeMerchant({ id: "merchant-ci-001", userId: "user-ci-merchant", countryCode: "CI" });
const NG_MERCHANT = makeMerchant({ id: "merchant-ng-001", userId: "user-ng-merchant", countryCode: "NG" });

// Reset mocks before each test for isolation.
beforeEach(() => {
  vi.clearAllMocks();
  mockStorage.getLotoMerchantByUserId.mockResolvedValue(undefined);
  mockStorage.getLotoMerchantById.mockResolvedValue(undefined);
  mockStorage.createLotoFraudFlag.mockResolvedValue({ id: "flag-001" });
});

// ─── 401 — unauthenticated ────────────────────────────────────────────────────

describe("401 — unauthenticated access", () => {
  it("GET /merchant/fiscal-account returns 401 with no session", async () => {
    const res = await request(app).get("/api/loto/merchant/fiscal-account");
    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty("message");
  });

  it("POST /merchant/receipts/:id/flag returns 401 with no session", async () => {
    const res = await request(app)
      .post("/api/loto/merchant/receipts/some-id/flag")
      .send({ reason: "test" });
    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty("message");
  });
});

// ─── 404 — no merchant profile ────────────────────────────────────────────────

describe("404 — authenticated user has no merchant profile", () => {
  it("GET /merchant/fiscal-account returns 404 when storage returns undefined", async () => {
    const ag = agent();
    await loginAs(ag, PLATFORM_OWNER);
    // storage returns undefined by default (beforeEach)
    const res = await ag.get("/api/loto/merchant/fiscal-account");
    expect(res.status).toBe(404);
    expect(typeof res.body.message).toBe("string");
  });

  it("POST /merchant/receipts/:id/flag returns 404 when no merchant", async () => {
    const ag = agent();
    await loginAs(ag, PLATFORM_OWNER);
    const res = await ag.post("/api/loto/merchant/receipts/some-id/flag").send({});
    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty("message");
  });
});

// ─── 403 — self-access: country scope enforcement ─────────────────────────────

describe("403 — self-access path: country-scope enforcement", () => {
  it("returns 403 when non-privileged user has a CI merchant but NO sessionCountry", async () => {
    const ag = agent();
    // User is a DGI officer but session has no userCountry.
    await loginAs(ag, DGI_NO_COUNTRY);
    // Merchant exists for this userId.
    mockStorage.getLotoMerchantByUserId.mockResolvedValue(CI_MERCHANT);

    const res = await ag.get("/api/loto/merchant/fiscal-account");
    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/country scope/i);
  });

  it("returns 403 when sessionCountry (NG) mismatches merchant country (CI) on self-access", async () => {
    const ag = agent();
    // User is scoped to Nigeria but owns a CI-registered merchant.
    await loginAs(ag, DGI_OFFICER_NG);
    mockStorage.getLotoMerchantByUserId.mockResolvedValue(CI_MERCHANT);

    const res = await ag.get("/api/loto/merchant/fiscal-account");
    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/CI/);
    expect(res.body.message).toMatch(/NG/);
  });

  it("platform_owner self-access is NOT blocked (no country scope required)", async () => {
    const ag = agent();
    await loginAs(ag, PLATFORM_OWNER);
    // storage returns undefined → route hits 404 (no merchant). The key check: it
    // should never reach the country-scope guard (which would return 403) for a
    // platform_owner. 404 is the expected terminal for a user without a merchant.
    const res = await ag.get("/api/loto/merchant/fiscal-account");
    expect(res.status).toBe(404);
    // Absolutely must not be 403 — that would mean the country guard fired incorrectly.
    expect(res.status).not.toBe(403);
  });
});

// ─── 403 — admin ?merchantId= path: country-scope enforcement ────────────────

describe("403 — ?merchantId= admin path: country-scope enforcement", () => {
  it("returns 403 when non-privileged admin has no sessionCountry", async () => {
    const ag = agent();
    await loginAs(ag, DGI_NO_COUNTRY);
    mockStorage.getLotoMerchantById.mockResolvedValue(CI_MERCHANT);

    const res = await ag.get("/api/loto/merchant/fiscal-account?merchantId=merchant-ci-001");
    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/country scope/i);
  });

  it("returns 403 when DGI-CI officer queries an NG merchant by ID", async () => {
    const ag = agent();
    await loginAs(ag, DGI_OFFICER_CI);
    mockStorage.getLotoMerchantById.mockResolvedValue(NG_MERCHANT);

    const res = await ag.get("/api/loto/merchant/fiscal-account?merchantId=merchant-ng-001");
    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/NG/);
    expect(res.body.message).toMatch(/CI/);
  });

  it("returns 403 when regular lender (non-admin role) queries another merchant by ID", async () => {
    const ag = agent();
    await loginAs(ag, REGULAR_USER);
    mockStorage.getLotoMerchantById.mockResolvedValue(CI_MERCHANT);

    const res = await ag.get("/api/loto/merchant/fiscal-account?merchantId=merchant-ci-001");
    expect(res.status).toBe(403);
  });

  it("returns 404 when admin queries a nonexistent merchant (storage returns undefined)", async () => {
    const ag = agent();
    await loginAs(ag, PLATFORM_OWNER);
    // getLotoMerchantById returns undefined by default.
    const res = await ag.get("/api/loto/merchant/fiscal-account?merchantId=00000000-dead-beef-cafe-000000000000");
    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty("message");
  });
});

// ─── Flag endpoint — country-scope enforcement ────────────────────────────────

describe("POST /merchant/receipts/:id/flag — country-scope enforcement", () => {
  it("returns 403 when non-privileged user has a merchant but no sessionCountry", async () => {
    const ag = agent();
    await loginAs(ag, DGI_NO_COUNTRY);
    mockStorage.getLotoMerchantByUserId.mockResolvedValue(CI_MERCHANT);

    const res = await ag.post("/api/loto/merchant/receipts/receipt-abc/flag").send({
      reason: "VAT discrepancy",
    });
    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/country scope/i);
  });

  it("returns 403 when sessionCountry mismatches merchant country on flag path", async () => {
    const ag = agent();
    await loginAs(ag, DGI_OFFICER_NG);
    mockStorage.getLotoMerchantByUserId.mockResolvedValue(CI_MERCHANT);

    const res = await ag.post("/api/loto/merchant/receipts/receipt-abc/flag").send({});
    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/CI/);
  });
});
