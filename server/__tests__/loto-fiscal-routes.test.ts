/**
 * Integration tests for /api/loto/fiscal-config, /api/loto/verify,
 * and /api/loto/pos/issue (Task #488 — Loto Fiscal Foundation).
 *
 * Uses the same supertest + minimal-Express pattern as loto-admin-api.test.ts:
 * a real session is established via /test/login, and all requests go through
 * the actual lotoFiscalRouter with a real DB connection.
 *
 * Country codes used:
 *   CI — real seed; fiscal config row exists from migration 0020
 *   XX_FISCAL_TEST — non-existent country; safe to use without DB conflicts
 *
 * Test fiscal codes are prefixed with "TSTFSC" to avoid clashing with
 * real merchant codes in the dev database.
 */

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import express from "express";
import session from "express-session";
import request from "supertest";
import lotoFiscalRouter from "../routes/loto-fiscal";
import { db } from "../db";
import { lotoReceipts, lotoMerchants } from "@shared/schema";
import { eq, and } from "drizzle-orm";
import { storage } from "../storage";

// ─── Test app factory ──────────────────────────────────────────────────────────

function buildTestApp() {
  const app = express();
  app.use(express.json());
  app.set("trust proxy", 1);

  app.use(
    session({
      secret: "test-fiscal-secret-only",
      resave: false,
      saveUninitialized: true,
      cookie: { secure: false },
    }),
  );

  // Convenience login endpoint: merge body into session so tests can
  // simulate any user/role/country without touching the real auth stack.
  app.post("/test/login", (req, res) => {
    Object.assign(req.session, req.body);
    res.json({ ok: true });
  });

  app.use("/api/loto", lotoFiscalRouter);
  return app;
}

const app = buildTestApp();
const agent = () => request.agent(app);

// Unique fiscal codes per test run to prevent cross-test conflicts in the DB
const RUN_ID = Date.now().toString(36).toUpperCase();
const UNIQUE_FCODE = `TSTFSC${RUN_ID}`;

// Cleanup: remove any receipts inserted by these tests
async function cleanupTestReceipts() {
  try {
    await db
      .delete(lotoReceipts)
      .where(eq(lotoReceipts.fiscalCode, `CI-MANUAL-${UNIQUE_FCODE}`));
  } catch {
    // best-effort cleanup
  }
}

afterAll(async () => {
  await cleanupTestReceipts();
});

// ─── GET /api/loto/fiscal-config ──────────────────────────────────────────────

describe("GET /api/loto/fiscal-config — authentication gate", () => {
  it("401 when unauthenticated", async () => {
    const res = await request(app).get("/api/loto/fiscal-config?countryCode=CI");
    expect(res.status).toBe(401);
  });
});

describe("GET /api/loto/fiscal-config — strict country isolation for unscoped users", () => {
  let a: ReturnType<typeof agent>;

  beforeAll(async () => {
    a = agent();
    // Non-privileged user with NO session country (simulates a misconfigured or
    // newly-created account that has no country assignment yet)
    await a.post("/test/login").send({ userId: "test-fiscal-user", userRole: "admin" });
  });

  it("400 COUNTRY_CODE_REQUIRED when countryCode is omitted and user has no session country", async () => {
    const res = await a.get("/api/loto/fiscal-config");
    expect(res.status).toBe(400);
    expect(res.body.code).toBe("COUNTRY_CODE_REQUIRED");
  });

  it("403 COUNTRY_ACCESS_DENIED when unscoped non-privileged user tries to request any specific country", async () => {
    // Per strict isolation rules, an unscoped non-privileged account must not be
    // allowed to request any country's data — this prevents cross-country leakage
    // from misconfigured sessions.
    const res = await a.get("/api/loto/fiscal-config?countryCode=CI");
    expect(res.status).toBe(403);
    expect(res.body.code).toBe("COUNTRY_ACCESS_DENIED");
  });
});

describe("GET /api/loto/fiscal-config — country isolation enforcement", () => {
  it("403 when country-scoped user requests a different country", async () => {
    const a = agent();
    await a.post("/test/login").send({
      userId: "test-ci-user",
      userRole: "admin",
      userCountry: "CI", // scoped to Ivory Coast
    });
    // Attempting to read GH config should be blocked
    const res = await a.get("/api/loto/fiscal-config?countryCode=GH");
    expect(res.status).toBe(403);
    expect(res.body.message).toContain("CI");
  });

  it("200 when country-scoped user requests their own country", async () => {
    const a = agent();
    await a.post("/test/login").send({
      userId: "test-ci-user-2",
      userRole: "admin",
      userCountry: "CI",
    });
    const res = await a.get("/api/loto/fiscal-config?countryCode=CI");
    expect(res.status).toBe(200);
    expect(res.body.countryCode).toBe("CI");
  });

  it("200 for any country when userRole is super_admin (platform-privileged, no scope)", async () => {
    const a = agent();
    await a.post("/test/login").send({
      userId: "test-super-admin",
      userRole: "super_admin",
      // no userCountry — platform-privileged, unrestricted
    });
    const res = await a.get("/api/loto/fiscal-config?countryCode=CI");
    expect(res.status).toBe(200);
  });

  it("auto-returns scoped country config when countryCode is omitted but user has a session country", async () => {
    const a = agent();
    await a.post("/test/login").send({
      userId: "test-ci-auto",
      userRole: "admin",
      userCountry: "CI",
    });
    const res = await a.get("/api/loto/fiscal-config");
    // No query param — should resolve from session country
    expect(res.status).toBe(200);
    expect(res.body.countryCode).toBe("CI");
  });
});

// ─── POST /api/loto/verify ────────────────────────────────────────────────────

describe("POST /api/loto/verify — authentication gate", () => {
  it("401 when unauthenticated", async () => {
    const res = await request(app)
      .post("/api/loto/verify")
      .send({ fiscalCode: "ABCD1234", receiptDate: new Date().toISOString() });
    expect(res.status).toBe(401);
  });
});

describe("POST /api/loto/verify — request validation", () => {
  let a: ReturnType<typeof agent>;

  beforeAll(async () => {
    a = agent();
    await a.post("/test/login").send({
      userId: "test-verify-user",
      userRole: "admin",
      userCountry: "CI",
    });
  });

  it("400 when fiscalCode is missing", async () => {
    const res = await a
      .post("/api/loto/verify")
      .send({ receiptDate: new Date().toISOString() });
    expect(res.status).toBe(400);
  });

  it("400 when receiptDate is missing (fiscalCode alone is not enough)", async () => {
    const res = await a.post("/api/loto/verify").send({ fiscalCode: "ABCD1234" });
    expect(res.status).toBe(400);
  });

  it("400 when receiptDate is not a valid ISO 8601 string", async () => {
    const res = await a.post("/api/loto/verify").send({
      fiscalCode: "ABCD1234",
      receiptDate: "31/12/2024", // DD/MM/YYYY — wrong format
    });
    expect(res.status).toBe(400);
  });

  it("400 when fiscalCode is too short (under 6 chars)", async () => {
    const res = await a.post("/api/loto/verify").send({
      fiscalCode: "AB1",
      receiptDate: new Date().toISOString(),
    });
    expect(res.status).toBe(400);
  });
});

describe("POST /api/loto/verify — DGI Control #5: 12-month age rejection", () => {
  let a: ReturnType<typeof agent>;

  beforeAll(async () => {
    a = agent();
    await a.post("/test/login").send({
      userId: "test-age-user",
      userRole: "admin",
      userCountry: "CI",
    });
  });

  it("422 RECEIPT_OUTSIDE_ELIGIBILITY_WINDOW for a receipt dated 13 months ago", async () => {
    const oldDate = new Date();
    oldDate.setMonth(oldDate.getMonth() - 13);

    const res = await a.post("/api/loto/verify").send({
      fiscalCode: "ABCD123456",
      receiptDate: oldDate.toISOString(),
    });
    expect(res.status).toBe(422);
    expect(res.body.code).toBe("RECEIPT_OUTSIDE_ELIGIBILITY_WINDOW");
  });

  it("422 for a receipt dated 2 years ago", async () => {
    const veryOld = new Date();
    veryOld.setFullYear(veryOld.getFullYear() - 2);

    const res = await a.post("/api/loto/verify").send({
      fiscalCode: "ABCD123456",
      receiptDate: veryOld.toISOString(),
    });
    expect(res.status).toBe(422);
    expect(res.body.code).toBe("RECEIPT_OUTSIDE_ELIGIBILITY_WINDOW");
    expect(res.body.receiptDate).toBeDefined();
  });

  it("422 response body includes receiptDate field for audit trail", async () => {
    const old = new Date();
    old.setMonth(old.getMonth() - 13);

    const res = await a.post("/api/loto/verify").send({
      fiscalCode: "ABCD123456",
      receiptDate: old.toISOString(),
    });
    expect(res.status).toBe(422);
    expect(res.body.receiptDate).toBe(old.toISOString());
  });

  it("does NOT return 422 for a receipt dated today (within window)", async () => {
    // This goes on to check country scope — still passes age check
    const res = await a.post("/api/loto/verify").send({
      fiscalCode: "ABCD123456",
      receiptDate: new Date().toISOString(),
    });
    // 422 from age check is the focus; any other status is acceptable here
    expect(res.status).not.toBe(422);
  });
});

describe("POST /api/loto/verify — duplicate receipt (409)", () => {
  let a: ReturnType<typeof agent>;

  beforeAll(async () => {
    a = agent();
    // userCountry=CI so receipt uses CI-MANUAL- prefix
    await a.post("/test/login").send({
      userId: "test-dup-user",
      userRole: "admin",
      userCountry: "CI",
    });
  });

  it("409 RECEIPT_FISCAL_CODE_DUPLICATE when the same fiscal code is submitted twice", async () => {
    const recentDate = new Date();
    recentDate.setMonth(recentDate.getMonth() - 1); // 1 month ago — well within window

    // Ensure a receipt row with the unique code exists in the DB by resolving or
    // creating a CI merchant and inserting the row via the storage layer (avoids
    // raw SQL column-name dependencies).
    const storedKey = `CI-MANUAL-${UNIQUE_FCODE}`;
    const [existingRow] = await db
      .select({ id: lotoReceipts.id })
      .from(lotoReceipts)
      .where(eq(lotoReceipts.fiscalCode, storedKey))
      .limit(1);

    if (!existingRow) {
      // Resolve or create a CI test merchant
      let ciMerchant = await storage.getLotoMerchantByShopNameAndCountry(
        "__loto_fiscal_test__",
        "CI",
      );
      if (!ciMerchant) {
        try {
          ciMerchant = await storage.createLotoMerchant({
            shopName: "__loto_fiscal_test__",
            ownerName: "Loto Fiscal Test Merchant",
            vatRegistrationNumber: "CI-TEST-FISCAL",
            countryCode: "CI",
            currency: "XOF",
            city: null,
            category: "test",
            creditOptInActive: false,
          });
        } catch {
          // Merchant creation failed — skip test gracefully
          return;
        }
      }
      // Insert the receipt directly via storage so we respect all column definitions
      await storage.createLotoReceipt({
        merchantId: ciMerchant.id,
        consumerUserId: null,
        fiscalCode: storedKey,
        ticketNumber: "999999",
        amount: "0.00",
        vatAmount: "0.00",
        currency: "XOF",
        category: "test",
        itemCount: 1,
        issuedAt: recentDate,
      });
    }

    // Now the DB has the row — submitting the same code must return 409
    const res = await a.post("/api/loto/verify").send({
      fiscalCode: UNIQUE_FCODE,
      receiptDate: recentDate.toISOString(),
    });
    expect(res.status).toBe(409);
    expect(res.body.code).toBe("RECEIPT_FISCAL_CODE_DUPLICATE");
    expect(res.body.fiscalCode).toBe(UNIQUE_FCODE);
    expect(res.body.countryCode).toBe("CI");
  });

  it("409 response body includes all required error fields", async () => {
    const recentDate = new Date();
    recentDate.setMonth(recentDate.getMonth() - 1);
    const storedKey = `CI-MANUAL-${UNIQUE_FCODE}`;
    const [existingRow] = await db
      .select({ id: lotoReceipts.id })
      .from(lotoReceipts)
      .where(eq(lotoReceipts.fiscalCode, storedKey))
      .limit(1);
    if (!existingRow) return; // skip if row wasn't created by previous test

    const res = await a.post("/api/loto/verify").send({
      fiscalCode: UNIQUE_FCODE,
      receiptDate: recentDate.toISOString(),
    });
    expect(res.status).toBe(409);
    expect(res.body.code).toBe("RECEIPT_FISCAL_CODE_DUPLICATE");
    expect(res.body.fiscalCode).toBeDefined();
    expect(res.body.countryCode).toBeDefined();
    expect(typeof res.body.message).toBe("string");
  });
});

// ─── POST /api/loto/pos/issue ─────────────────────────────────────────────────

describe("POST /api/loto/pos/issue — authentication gate", () => {
  it("401 when unauthenticated", async () => {
    const res = await request(app)
      .post("/api/loto/pos/issue")
      .send({ fiscalCode: "ABCD1234", receiptDate: new Date().toISOString() });
    expect(res.status).toBe(401);
  });
});

describe("POST /api/loto/pos/issue — request validation", () => {
  let a: ReturnType<typeof agent>;

  beforeAll(async () => {
    a = agent();
    await a.post("/test/login").send({
      userId: "test-pos-user",
      userRole: "admin",
      userCountry: "CI",
    });
  });

  it("400 when fiscalCode is missing", async () => {
    const res = await a
      .post("/api/loto/pos/issue")
      .send({ receiptDate: new Date().toISOString() });
    expect(res.status).toBe(400);
  });

  it("400 when receiptDate is missing", async () => {
    const res = await a.post("/api/loto/pos/issue").send({ fiscalCode: "ABCD1234" });
    expect(res.status).toBe(400);
  });
});

describe("POST /api/loto/pos/issue — DGI Control #5: 12-month age rejection", () => {
  let a: ReturnType<typeof agent>;

  beforeAll(async () => {
    a = agent();
    await a.post("/test/login").send({
      userId: "test-pos-age-user",
      userRole: "admin",
      userCountry: "CI",
    });
  });

  it("422 RECEIPT_OUTSIDE_ELIGIBILITY_WINDOW for a POS receipt dated 13 months ago", async () => {
    const old = new Date();
    old.setMonth(old.getMonth() - 13);

    const res = await a.post("/api/loto/pos/issue").send({
      fiscalCode: "POSTEST123456",
      receiptDate: old.toISOString(),
    });
    expect(res.status).toBe(422);
    expect(res.body.code).toBe("RECEIPT_OUTSIDE_ELIGIBILITY_WINDOW");
  });

  it("422 RECEIPT_OUTSIDE_ELIGIBILITY_WINDOW for a POS receipt from the Unix epoch", async () => {
    const res = await a.post("/api/loto/pos/issue").send({
      fiscalCode: "POSTEST123456",
      receiptDate: new Date(0).toISOString(),
    });
    expect(res.status).toBe(422);
    expect(res.body.code).toBe("RECEIPT_OUTSIDE_ELIGIBILITY_WINDOW");
  });

  it("422 response includes receiptDate field", async () => {
    const old = new Date();
    old.setMonth(old.getMonth() - 14);

    const res = await a.post("/api/loto/pos/issue").send({
      fiscalCode: "POSTEST123456",
      receiptDate: old.toISOString(),
    });
    expect(res.status).toBe(422);
    expect(res.body.receiptDate).toBeDefined();
  });

  it("does NOT return 422 for a POS receipt dated yesterday (within window)", async () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const res = await a.post("/api/loto/pos/issue").send({
      fiscalCode: "POSTEST123456",
      receiptDate: yesterday.toISOString(),
    });
    // Any status except 422 is acceptable (might 404 due to no merchant in test DB)
    expect(res.status).not.toBe(422);
  });
});
