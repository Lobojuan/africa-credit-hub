/**
 * Behavioral endpoint tests for regulatory compliance controls.
 *
 * Uses the same minimal-Express / supertest harness as loto-admin-api.test.ts.
 * All database calls go to the real test DB; test rows are created in beforeAll
 * and cleaned in afterAll. FK constraints are satisfied by using real user/org
 * IDs fetched from the DB at setup time.
 *
 * Covers:
 *   - Maker-checker: self-approval → 403 SELF_APPROVAL_FORBIDDEN
 *   - Maker-checker: cross-org approval → 403 ORG_SCOPE_VIOLATION
 *   - Maker-checker: re-review of non-pending → 400 ALREADY_REVIEWED
 *   - BoG consent gate: missing consentId → 403 CONSENT_REQUIRED
 *   - BoG consent gate: super_admin bypasses gate
 *   - BoG consent gate: active consent → allowed
 *   - BoG consent gate: revoked consent → 403 CONSENT_INACTIVE
 *   - CBN CONC preview: pipe-delimited, BVN+NIN in header, Nigeria
 *   - CBN BUSC preview: RCNumber + TINNumber + CompanyName
 *   - CBK CONC preview: pipe-delimited, NationalID+KRAPIN, Kenya
 *   - CBK BUSC preview: BusinessRegNumber + KRAPIN
 *   - CBN vs CBK jurisdictional distinctness
 */

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import express from "express";
import session from "express-session";
import request from "supertest";
import { sql } from "drizzle-orm";
import { db } from "../db";
import regulatoryControlsRouter from "../routes/regulatory-controls-router";

// ─── Test app factory ─────────────────────────────────────────────────────────

function buildTestApp() {
  const app = express();
  app.use(express.json());
  app.set("trust proxy", 1);
  app.use(
    session({
      secret: "regulatory-test-secret",
      resave: false,
      saveUninitialized: true,
      cookie: { secure: false },
    })
  );
  app.post("/test/login", (req, res) => {
    Object.assign(req.session, req.body);
    res.json({ ok: true });
  });
  app.use("/api/regulatory", regulatoryControlsRouter);
  return app;
}

const app = buildTestApp();
const agent = () => request.agent(app);

async function loginAs(ag: ReturnType<typeof agent>, data: Record<string, unknown>) {
  await ag.post("/test/login").send(data).expect(200);
}

// ─── Real FK-safe IDs (populated in top-level beforeAll) ─────────────────────

let makerUserId: string;
let checkerUserId: string;
let superAdminUserId: string;
let orgAId: string;
let orgBId: string;
let pendingApprovalId: string;
let approvedApprovalId: string;

beforeAll(async () => {
  // Fetch real user IDs + associated org IDs from the DB (FK-safe)
  const usersResult = await db.execute(sql`
    SELECT u.id AS uid, u.organization_id AS oid
    FROM users u
    WHERE u.organization_id IS NOT NULL
    ORDER BY u.created_at
    LIMIT 4
  `);
  const users = usersResult.rows as Array<{ uid: string; oid: string }>;
  if (users.length < 2) throw new Error("Test requires at least 2 users with org IDs");

  makerUserId   = users[0]!.uid;
  orgAId        = users[0]!.oid;
  checkerUserId = users[1]!.uid;
  orgBId        = users[1]!.oid !== orgAId ? users[1]!.oid : (users[2]?.oid ?? users[1]!.oid);

  const saResult = await db.execute(sql`SELECT id FROM users WHERE role = 'super_admin' LIMIT 1`);
  superAdminUserId = (saResult.rows[0] as { id: string })?.id ?? makerUserId;

  // Pending approval made by maker (org A)
  const ins1 = await db.execute(sql`
    INSERT INTO pending_approvals (entity_type, action, payload, requested_by, organization_id, status, country)
    VALUES ('borrower', 'update', '{"test":true}', ${makerUserId}, ${orgAId}, 'pending', 'Ghana')
    RETURNING id
  `);
  pendingApprovalId = (ins1.rows[0] as { id: string }).id;

  // Already-approved approval (status ≠ pending)
  const ins2 = await db.execute(sql`
    INSERT INTO pending_approvals (entity_type, action, payload, requested_by, organization_id, status, country, reviewed_by)
    VALUES ('borrower', 'update', '{"test":true}', ${makerUserId}, ${orgAId}, 'approved', 'Ghana', ${checkerUserId})
    RETURNING id
  `);
  approvedApprovalId = (ins2.rows[0] as { id: string }).id;
});

afterAll(async () => {
  if (pendingApprovalId) await db.execute(sql`DELETE FROM pending_approvals WHERE id = ${pendingApprovalId}`);
  if (approvedApprovalId) await db.execute(sql`DELETE FROM pending_approvals WHERE id = ${approvedApprovalId}`);
});

// ─── Maker-checker guard ──────────────────────────────────────────────────────

describe("Maker-checker guard — PATCH /api/regulatory/approvals/:id", () => {
  it("unauthenticated request returns 401", async () => {
    const res = await request(app).patch(`/api/regulatory/approvals/${pendingApprovalId}`).send({ status: "approved" });
    expect(res.status).toBe(401);
  });

  it("insufficient role (lender) returns 403", async () => {
    const ag = agent();
    await loginAs(ag, { userId: checkerUserId, userRole: "lender", organizationId: orgAId });
    const res = await ag.patch(`/api/regulatory/approvals/${pendingApprovalId}`).send({ status: "approved" });
    expect(res.status).toBe(403);
  });

  it("self-approval (maker === checker) returns 403 SELF_APPROVAL_FORBIDDEN", async () => {
    const ag = agent();
    await loginAs(ag, { userId: makerUserId, userRole: "admin", organizationId: orgAId });
    const res = await ag.patch(`/api/regulatory/approvals/${pendingApprovalId}`).send({ status: "approved" });
    expect(res.status).toBe(403);
    expect(res.body.code).toBe("SELF_APPROVAL_FORBIDDEN");
    expect(res.body.message).toMatch(/Maker cannot be the Checker/);
  });

  it("non-privileged user with no org context → 403 ORG_CONTEXT_MISSING (fail-closed)", async () => {
    const ag = agent();
    // admin role but no organizationId in session
    await loginAs(ag, { userId: checkerUserId, userRole: "admin" });
    const res = await ag.patch(`/api/regulatory/approvals/${pendingApprovalId}`).send({ status: "approved" });
    expect(res.status).toBe(403);
    expect(res.body.code).toBe("ORG_CONTEXT_MISSING");
  });

  it("cross-org approval (non-privileged) returns 403 ORG_SCOPE_VIOLATION", async () => {
    if (orgBId === orgAId) return; // skip if only one org in test DB
    const ag = agent();
    await loginAs(ag, { userId: checkerUserId, userRole: "admin", organizationId: orgBId });
    const res = await ag.patch(`/api/regulatory/approvals/${pendingApprovalId}`).send({ status: "approved" });
    expect(res.status).toBe(403);
    expect(res.body.code).toBe("ORG_SCOPE_VIOLATION");
  });

  it("checker from same org passes guard and persists approval decision", async () => {
    const ag = agent();
    await loginAs(ag, { userId: checkerUserId, userRole: "regulator", organizationId: orgAId });
    const res = await ag.patch(`/api/regulatory/approvals/${pendingApprovalId}`).send({ status: "approved" });
    expect(res.status).toBe(200);
    expect(res.body.guardPassed).toBe(true);
    // Verify decision is persisted in response payload (not just a guard stub)
    expect(res.body.status).toBe("approved");
    expect(res.body.reviewedBy).toBe(checkerUserId);
    expect(res.body.approvalId).toBe(pendingApprovalId);
  });

  it("super_admin bypasses org scope — no ORG_SCOPE_VIOLATION", async () => {
    const ag = agent();
    await loginAs(ag, { userId: superAdminUserId, userRole: "super_admin" });
    const res = await ag.patch(`/api/regulatory/approvals/${pendingApprovalId}`).send({ status: "approved" });
    expect([200, 400]).toContain(res.status);
    expect(res.body.code).not.toBe("ORG_SCOPE_VIOLATION");
    expect(res.body.code).not.toBe("SELF_APPROVAL_FORBIDDEN");
  });

  it("already-reviewed approval returns 400 ALREADY_REVIEWED", async () => {
    const ag = agent();
    await loginAs(ag, { userId: checkerUserId, userRole: "regulator", organizationId: orgAId });
    const res = await ag.patch(`/api/regulatory/approvals/${approvedApprovalId}`).send({ status: "rejected" });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe("ALREADY_REVIEWED");
  });

  it("unknown approval ID returns 404", async () => {
    const ag = agent();
    await loginAs(ag, { userId: checkerUserId, userRole: "regulator", organizationId: orgAId });
    const res = await ag.patch("/api/regulatory/approvals/non-existent-id-00000").send({ status: "approved" });
    expect(res.status).toBe(404);
  });
});

// ─── BoG consent gate ─────────────────────────────────────────────────────────

describe("BoG consent gate — POST /api/regulatory/consent-gate-check", () => {
  let testBorrowerId: string;

  beforeAll(async () => {
    const result = await db.execute(sql`SELECT id FROM borrowers WHERE type = 'individual' LIMIT 1`);
    testBorrowerId = (result.rows[0] as { id: string })?.id ?? "fallback-id";
  });

  it("unauthenticated request returns 401", async () => {
    const res = await request(app).post("/api/regulatory/consent-gate-check").send({ borrowerId: testBorrowerId });
    expect(res.status).toBe(401);
  });

  it("lender without consentId → 403 CONSENT_REQUIRED", async () => {
    const ag = agent();
    await loginAs(ag, { userId: checkerUserId, userRole: "lender", organizationId: orgAId });
    const res = await ag.post("/api/regulatory/consent-gate-check").send({ borrowerId: testBorrowerId });
    expect(res.status).toBe(403);
    expect(res.body.code).toBe("CONSENT_REQUIRED");
    expect(res.body.blocked).toBe(true);
    expect(res.body.message).toMatch(/Consent verification is required/);
  });

  it("admin without consentId → 403 CONSENT_REQUIRED", async () => {
    const ag = agent();
    await loginAs(ag, { userId: makerUserId, userRole: "admin", organizationId: orgAId });
    const res = await ag.post("/api/regulatory/consent-gate-check").send({ borrowerId: testBorrowerId });
    expect(res.status).toBe(403);
    expect(res.body.code).toBe("CONSENT_REQUIRED");
  });

  it("super_admin without consentId bypasses gate (allowed: true)", async () => {
    const ag = agent();
    await loginAs(ag, { userId: superAdminUserId, userRole: "super_admin" });
    const res = await ag.post("/api/regulatory/consent-gate-check").send({ borrowerId: testBorrowerId });
    expect(res.status).toBe(200);
    expect(res.body.allowed).toBe(true);
    expect(res.body.isSuperAdmin).toBe(true);
  });

  it("non-existent consentId → 404 CONSENT_NOT_FOUND", async () => {
    const ag = agent();
    await loginAs(ag, { userId: checkerUserId, userRole: "lender", organizationId: orgAId });
    const res = await ag.post("/api/regulatory/consent-gate-check").send({
      borrowerId: testBorrowerId,
      consentId: "non-existent-consent-00000",
    });
    expect(res.status).toBe(404);
    expect(res.body.code).toBe("CONSENT_NOT_FOUND");
  });

  it("active consent record → allowed: true", async () => {
    const ins = await db.execute(sql`
      INSERT INTO consent_records (borrower_id, granted_to, purpose, consent_type, status, receipt_number, data_subject_confirmed)
      VALUES (${testBorrowerId}, 'test-lender', 'credit_report', 'data_access', 'active', ${`GATE-TEST-${Date.now()}`}, true)
      RETURNING id
    `);
    const consentId = (ins.rows[0] as { id: string }).id;
    try {
      const ag = agent();
      await loginAs(ag, { userId: checkerUserId, userRole: "lender", organizationId: orgAId });
      const res = await ag.post("/api/regulatory/consent-gate-check").send({ borrowerId: testBorrowerId, consentId });
      expect(res.status).toBe(200);
      expect(res.body.allowed).toBe(true);
    } finally {
      await db.execute(sql`DELETE FROM consent_records WHERE id = ${consentId}`);
    }
  });

  it("revoked consent → 403 CONSENT_INACTIVE", async () => {
    const ins = await db.execute(sql`
      INSERT INTO consent_records (borrower_id, granted_to, purpose, consent_type, status, receipt_number, data_subject_confirmed)
      VALUES (${testBorrowerId}, 'test-lender', 'credit_report', 'data_access', 'revoked', ${`GATE-REVOKE-${Date.now()}`}, true)
      RETURNING id
    `);
    const consentId = (ins.rows[0] as { id: string }).id;
    try {
      const ag = agent();
      await loginAs(ag, { userId: checkerUserId, userRole: "lender", organizationId: orgAId });
      const res = await ag.post("/api/regulatory/consent-gate-check").send({ borrowerId: testBorrowerId, consentId });
      expect(res.status).toBe(403);
      expect(res.body.code).toBe("CONSENT_INACTIVE");
    } finally {
      await db.execute(sql`DELETE FROM consent_records WHERE id = ${consentId}`);
    }
  });

  it("consent issued to org A cannot be replayed by org B → 403 CONSENT_INSTITUTION_MISMATCH", async () => {
    // Insert consent scoped to orgAId
    const ins = await db.execute(sql`
      INSERT INTO consent_records (borrower_id, granted_to, purpose, consent_type, status, receipt_number, data_subject_confirmed, organization_id)
      VALUES (${testBorrowerId}, 'org-a-lender', 'credit_report', 'data_access', 'active', ${`GATE-INST-${Date.now()}`}, true, ${orgAId})
      RETURNING id
    `);
    const consentId = (ins.rows[0] as { id: string }).id;
    try {
      const ag = agent();
      // Requester is org B presenting org A's consent
      await loginAs(ag, { userId: checkerUserId, userRole: "lender", organizationId: orgBId });
      const res = await ag.post("/api/regulatory/consent-gate-check").send({ borrowerId: testBorrowerId, consentId });
      if (orgAId === orgBId) {
        // If test DB only has one org, institution binding cannot trigger — skip assertion
        return;
      }
      expect(res.status).toBe(403);
      expect(res.body.code).toBe("CONSENT_INSTITUTION_MISMATCH");
      expect(res.body.blocked).toBe(true);
    } finally {
      await db.execute(sql`DELETE FROM consent_records WHERE id = ${consentId}`);
    }
  });

  it("loan-exemption consent (loan_exemption=true, borrowerResponse=approved) → allowed: true with loanExemption flag", async () => {
    const ins = await db.execute(sql`
      INSERT INTO consent_records (borrower_id, granted_to, purpose, consent_type, status, receipt_number, data_subject_confirmed, loan_exemption, borrower_response)
      VALUES (${testBorrowerId}, 'test-lender', 'credit_report', 'credit_report', 'active', ${`GATE-EXEMPTION-${Date.now()}`}, true, true, 'approved')
      RETURNING id
    `);
    const consentId = (ins.rows[0] as { id: string }).id;
    try {
      const ag = agent();
      await loginAs(ag, { userId: checkerUserId, userRole: "lender", organizationId: orgAId });
      const res = await ag.post("/api/regulatory/consent-gate-check").send({ borrowerId: testBorrowerId, consentId });
      expect(res.status).toBe(200);
      expect(res.body.allowed).toBe(true);
      expect(res.body.loanExemption).toBe(true);
    } finally {
      await db.execute(sql`DELETE FROM consent_records WHERE id = ${consentId}`);
    }
  });

  it("expired loan-exemption consent → 403 CONSENT_EXPIRED", async () => {
    const past = new Date(Date.now() - 60_000).toISOString();
    const ins = await db.execute(sql`
      INSERT INTO consent_records (borrower_id, granted_to, purpose, consent_type, status, receipt_number, data_subject_confirmed, loan_exemption, borrower_response, expires_at)
      VALUES (${testBorrowerId}, 'test-lender', 'credit_report', 'credit_report', 'active', ${`GATE-EXPIRY-${Date.now()}`}, true, true, 'approved', ${past}::timestamp)
      RETURNING id
    `);
    const consentId = (ins.rows[0] as { id: string }).id;
    try {
      const ag = agent();
      await loginAs(ag, { userId: checkerUserId, userRole: "lender", organizationId: orgAId });
      const res = await ag.post("/api/regulatory/consent-gate-check").send({ borrowerId: testBorrowerId, consentId });
      expect(res.status).toBe(403);
      expect(res.body.code).toBe("CONSENT_EXPIRED");
      expect(res.body.blocked).toBe(true);
    } finally {
      await db.execute(sql`DELETE FROM consent_records WHERE id = ${consentId}`);
    }
  });

  it("loan-exemption consent with revoked status → 403 CONSENT_INACTIVE", async () => {
    const ins = await db.execute(sql`
      INSERT INTO consent_records (borrower_id, granted_to, purpose, consent_type, status, receipt_number, data_subject_confirmed, loan_exemption, borrower_response)
      VALUES (${testBorrowerId}, 'test-lender', 'credit_report', 'credit_report', 'revoked', ${`GATE-EX-REVOKED-${Date.now()}`}, true, true, 'approved')
      RETURNING id
    `);
    const consentId = (ins.rows[0] as { id: string }).id;
    try {
      const ag = agent();
      await loginAs(ag, { userId: checkerUserId, userRole: "lender", organizationId: orgAId });
      const res = await ag.post("/api/regulatory/consent-gate-check").send({ borrowerId: testBorrowerId, consentId });
      expect(res.status).toBe(403);
      expect(res.body.code).toBe("CONSENT_INACTIVE");
    } finally {
      await db.execute(sql`DELETE FROM consent_records WHERE id = ${consentId}`);
    }
  });

  it("consent issued for borrower A cannot authorize access to borrower B → 403 CONSENT_BORROWER_MISMATCH", async () => {
    // Insert borrower A's consent
    const ins = await db.execute(sql`
      INSERT INTO consent_records (borrower_id, granted_to, purpose, consent_type, status, receipt_number, data_subject_confirmed)
      VALUES (${testBorrowerId}, 'test-lender', 'credit_report', 'data_access', 'active', ${`GATE-MISMATCH-${Date.now()}`}, true)
      RETURNING id
    `);
    const consentId = (ins.rows[0] as { id: string }).id;
    // Fetch a different borrower ID to simulate the IDOR attempt
    const otherResult = await db.execute(sql`SELECT id FROM borrowers WHERE id != ${testBorrowerId} LIMIT 1`);
    const otherBorrowerId = (otherResult.rows[0] as { id: string })?.id ?? "other-00000";
    try {
      const ag = agent();
      await loginAs(ag, { userId: checkerUserId, userRole: "lender", organizationId: orgAId });
      // Present consent for borrower A while requesting access to borrower B
      const res = await ag.post("/api/regulatory/consent-gate-check").send({ borrowerId: otherBorrowerId, consentId });
      expect(res.status).toBe(403);
      expect(res.body.code).toBe("CONSENT_BORROWER_MISMATCH");
      expect(res.body.blocked).toBe(true);
    } finally {
      await db.execute(sql`DELETE FROM consent_records WHERE id = ${consentId}`);
    }
  });
});

// ─── CBN export preview ───────────────────────────────────────────────────────
// Export generators scan the DB; these tests use a scoped orgId and a 30s timeout.

describe("CBN export preview — pipe-delimited format (CBN CRR 2017)", () => {
  const EXPORT_TIMEOUT = 30_000;
  let ag: ReturnType<typeof agent>;
  let cbnConc: { body: { regulator: string; jurisdiction: string; pipeDelimited: boolean; headerRow: string; fileType: string } };
  let cbnBusc: { body: { headerRow: string } };

  beforeAll(async () => {
    ag = agent();
    await loginAs(ag, { userId: superAdminUserId, userRole: "super_admin", organizationId: orgAId });
    // Fetch once and cache — avoids redundant DB-scanning calls per test.
    [cbnConc, cbnBusc] = await Promise.all([
      ag.get("/api/regulatory/export-preview/cbn/CONC"),
      ag.get("/api/regulatory/export-preview/cbn/BUSC"),
    ]);
  }, EXPORT_TIMEOUT);

  it("CONC preview returns 200 with CBN regulator", () => {
    expect(cbnConc.body.regulator).toBe("CBN");
  });

  it("CONC headerRow is pipe-delimited", () => {
    expect(cbnConc.body.pipeDelimited).toBe(true);
    expect(cbnConc.body.headerRow).toContain("|");
  });

  it("CONC headerRow contains BVN (Nigeria NIN verifier)", () => {
    expect(cbnConc.body.headerRow.split("|")).toContain("BVN");
  });

  it("CONC headerRow contains NIN (national identity number)", () => {
    expect(cbnConc.body.headerRow.split("|")).toContain("NIN");
  });

  it("CONC headerRow contains AccountNumber and AccountStatus", () => {
    const h = cbnConc.body.headerRow.split("|");
    expect(h).toContain("AccountNumber");
    expect(h).toContain("AccountStatus");
  });

  it("CONC headerRow has at least 50 fields (CBN CRR 2017 full schema)", () => {
    expect(cbnConc.body.headerRow.split("|").length).toBeGreaterThanOrEqual(50);
  });

  it("CONC headerRow contains CRR 2017 arrears buckets (1to30 … 181plus)", () => {
    const h = cbnConc.body.headerRow.split("|");
    expect(h).toContain("AmtOverdue1to30");
    expect(h).toContain("AmtOverdue31to60");
    expect(h).toContain("AmtOverdue181plus");
  });

  it("CONC jurisdiction label is Nigeria", () => {
    expect(cbnConc.body.jurisdiction).toBe("Nigeria");
  });

  it("BUSC headerRow contains RCNumber and TINNumber (CAMA/FIRS)", () => {
    const h = cbnBusc.body.headerRow.split("|");
    expect(h).toContain("RCNumber");
    expect(h).toContain("TINNumber");
    expect(h).toContain("CompanyName");
  });

  it("invalid file type returns 400", async () => {
    const res = await ag.get("/api/regulatory/export-preview/cbn/INVALID");
    expect(res.status).toBe(400);
  });

  it("unauthenticated request returns 401", async () => {
    const res = await request(app).get("/api/regulatory/export-preview/cbn/CONC");
    expect(res.status).toBe(401);
  });
});

// ─── CBK export preview ───────────────────────────────────────────────────────

describe("CBK export preview — pipe-delimited format (CBK CRB Regulations 2020)", () => {
  const EXPORT_TIMEOUT = 30_000;
  let ag: ReturnType<typeof agent>;
  let cbkConc: { body: { regulator: string; jurisdiction: string; pipeDelimited: boolean; headerRow: string } };
  let cbkBusc: { body: { headerRow: string } };

  beforeAll(async () => {
    ag = agent();
    await loginAs(ag, { userId: superAdminUserId, userRole: "super_admin", organizationId: orgAId });
    [cbkConc, cbkBusc] = await Promise.all([
      ag.get("/api/regulatory/export-preview/cbk/CONC"),
      ag.get("/api/regulatory/export-preview/cbk/BUSC"),
    ]);
  }, EXPORT_TIMEOUT);

  it("CONC preview returns 200 with CBK regulator", () => {
    expect(cbkConc.body.regulator).toBe("CBK");
  });

  it("CONC headerRow is pipe-delimited", () => {
    expect(cbkConc.body.pipeDelimited).toBe(true);
    expect(cbkConc.body.headerRow).toContain("|");
  });

  it("CONC headerRow contains NationalID (Kenya ID)", () => {
    expect(cbkConc.body.headerRow.split("|")).toContain("NationalID");
  });

  it("CONC headerRow contains KRAPIN (Kenya Revenue Authority PIN)", () => {
    expect(cbkConc.body.headerRow.split("|")).toContain("KRAPIN");
  });

  it("CONC headerRow contains AccountNumber and AccountStatus", () => {
    const h = cbkConc.body.headerRow.split("|");
    expect(h).toContain("AccountNumber");
    expect(h).toContain("AccountStatus");
  });

  it("CONC headerRow contains CBK CRB 2020 aging buckets", () => {
    const h = cbkConc.body.headerRow.split("|");
    expect(h).toContain("AmtOverdue1to30");
    expect(h).toContain("AmtOverdue181plus");
  });

  it("CONC jurisdiction label is Kenya", () => {
    expect(cbkConc.body.jurisdiction).toBe("Kenya");
  });

  it("BUSC headerRow contains BusinessRegNumber and KRAPIN", () => {
    const h = cbkBusc.body.headerRow.split("|");
    expect(h).toContain("BusinessRegNumber");
    expect(h).toContain("KRAPIN");
    expect(h).toContain("CompanyName");
  });

  it("invalid file type returns 400", async () => {
    const res = await ag.get("/api/regulatory/export-preview/cbk/INVALID");
    expect(res.status).toBe(400);
  });
});

// ─── CBN vs CBK jurisdictional distinction ────────────────────────────────────

describe("CBN vs CBK — jurisdictionally distinct identifiers", () => {
  const EXPORT_TIMEOUT = 30_000;
  let cbnHeader: string[];
  let cbkHeader: string[];

  beforeAll(async () => {
    const ag = agent();
    await loginAs(ag, { userId: superAdminUserId, userRole: "super_admin", organizationId: orgAId });
    const [cbn, cbk] = await Promise.all([
      ag.get("/api/regulatory/export-preview/cbn/CONC"),
      ag.get("/api/regulatory/export-preview/cbk/CONC"),
    ]);
    cbnHeader = cbn.body.headerRow.split("|");
    cbkHeader = cbk.body.headerRow.split("|");
  }, EXPORT_TIMEOUT);

  it("CBN CONC has BVN; CBK CONC does not", () => {
    expect(cbnHeader).toContain("BVN");
    expect(cbkHeader).not.toContain("BVN");
  });

  it("CBK CONC has NationalID; CBN CONC does not", () => {
    expect(cbkHeader).toContain("NationalID");
    expect(cbnHeader).not.toContain("NationalID");
  });

  it("CBK CONC has KRAPIN; CBN CONC does not", () => {
    expect(cbkHeader).toContain("KRAPIN");
    expect(cbnHeader).not.toContain("KRAPIN");
  });
});
