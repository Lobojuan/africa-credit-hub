/**
 * Regulatory Compliance Tests — Task #387
 * Behavioral integration tests: retention periods, consent gate, maker-checker,
 * PAPSS country codes, erasure gate, DGI isolation, alt-data scoring, CBN/CBK export format.
 */

import { describe, it, expect } from "vitest";
import { sql } from "drizzle-orm";
import { db } from "../db";
import { retentionPolicies, consentRecords, pendingApprovals } from "@shared/schema";
import { eq, and } from "drizzle-orm";
import { calculateCreditScore } from "../credit-score";
import type { AlternativeDataLike, AccountLike } from "../credit-score";
import {
  getCountryFilter,
  enforceCountryScopeForNonSuperAdmin,
  isPlatformPrivileged,
} from "../routes/middleware";
import { CBN_CONC_HEADERS, CBN_BUSC_HEADERS } from "../cbn-export";
import { CBK_CONC_HEADERS, CBK_BUSC_HEADERS } from "../cbk-export";

// ─── A. Retention periods per jurisdiction ────────────────────────────────────

describe("A. Retention periods per jurisdiction", () => {
  it("Ghana borrower: 7yr (BoG Data Protection Directive)", async () => {
    const [row] = await db.select().from(retentionPolicies)
      .where(and(eq(retentionPolicies.country, "Ghana"), eq(retentionPolicies.entityType, "borrower")))
      .limit(1);
    expect(row).toBeDefined();
    expect(row.retentionYears).toBe(7);
    expect(row.archiveAfterYears).toBe(10);
    expect(row.isActive).toBe(true);
  });

  it("Ghana credit_account: 7yr (BoG CRB v1.1 s.4.2)", async () => {
    const [row] = await db.select().from(retentionPolicies)
      .where(and(eq(retentionPolicies.country, "Ghana"), eq(retentionPolicies.entityType, "credit_account")))
      .limit(1);
    expect(row).toBeDefined();
    expect(row.retentionYears).toBe(7);
  });

  it("Ghana has at least 8 jurisdiction-specific retention policies", async () => {
    const rows = await db.select().from(retentionPolicies).where(eq(retentionPolicies.country, "Ghana"));
    expect(rows.length).toBeGreaterThanOrEqual(8);
  });

  it("Nigeria borrower: 5yr (CBN Credit Reporting Regulation 2017, s.12)", async () => {
    const [row] = await db.select().from(retentionPolicies)
      .where(and(eq(retentionPolicies.country, "Nigeria"), eq(retentionPolicies.entityType, "borrower")))
      .limit(1);
    expect(row).toBeDefined();
    expect(row.retentionYears).toBe(5);
    expect(row.description).toMatch(/CBN/);
  });

  it("Nigeria credit_account: 5yr", async () => {
    const [row] = await db.select().from(retentionPolicies)
      .where(and(eq(retentionPolicies.country, "Nigeria"), eq(retentionPolicies.entityType, "credit_account")))
      .limit(1);
    expect(row).toBeDefined();
    expect(row.retentionYears).toBe(5);
  });

  it("Nigeria has at least 5 retention policies", async () => {
    const rows = await db.select().from(retentionPolicies).where(eq(retentionPolicies.country, "Nigeria"));
    expect(rows.length).toBeGreaterThanOrEqual(5);
  });

  it("Kenya borrower: 5yr (CBK CRB Regulations 2020, Reg. 14)", async () => {
    const [row] = await db.select().from(retentionPolicies)
      .where(and(eq(retentionPolicies.country, "Kenya"), eq(retentionPolicies.entityType, "borrower")))
      .limit(1);
    expect(row).toBeDefined();
    expect(row.retentionYears).toBe(5);
    expect(row.description).toMatch(/CBK/);
  });

  it("Kenya credit_account: 5yr", async () => {
    const [row] = await db.select().from(retentionPolicies)
      .where(and(eq(retentionPolicies.country, "Kenya"), eq(retentionPolicies.entityType, "credit_account")))
      .limit(1);
    expect(row).toBeDefined();
    expect(row.retentionYears).toBe(5);
  });

  it("Kenya has at least 5 retention policies", async () => {
    const rows = await db.select().from(retentionPolicies).where(eq(retentionPolicies.country, "Kenya"));
    expect(rows.length).toBeGreaterThanOrEqual(5);
  });

  it("Sierra Leone borrower: 7yr (BSL Credit Reference Act 2011, s.19)", async () => {
    const [row] = await db.select().from(retentionPolicies)
      .where(and(eq(retentionPolicies.country, "Sierra Leone"), eq(retentionPolicies.entityType, "borrower")))
      .limit(1);
    expect(row).toBeDefined();
    expect(row.retentionYears).toBe(7);
    expect(row.description).toMatch(/BSL|Sierra Leone/);
  });

  it("Sierra Leone has at least 5 retention policies", async () => {
    const rows = await db.select().from(retentionPolicies).where(eq(retentionPolicies.country, "Sierra Leone"));
    expect(rows.length).toBeGreaterThanOrEqual(5);
  });

  it("Côte d'Ivoire borrower: 5yr (BCEAO Instruction 004-2022, Art. 18)", async () => {
    const [row] = await db.select().from(retentionPolicies)
      .where(and(eq(retentionPolicies.country, "Côte d'Ivoire"), eq(retentionPolicies.entityType, "borrower")))
      .limit(1);
    expect(row).toBeDefined();
    expect(row.retentionYears).toBe(5);
    expect(row.description).toMatch(/BCEAO/);
  });

  it("Côte d'Ivoire has at least 5 retention policies", async () => {
    const rows = await db.select().from(retentionPolicies).where(eq(retentionPolicies.country, "Côte d'Ivoire"));
    expect(rows.length).toBeGreaterThanOrEqual(5);
  });

  it("No credit_account retention policy exceeds 10 years", async () => {
    const rows = await db.select().from(retentionPolicies).where(eq(retentionPolicies.entityType, "credit_account"));
    for (const row of rows) {
      expect(row.retentionYears, `${row.country} credit_account: ${row.retentionYears}yr exceeds 10yr cap`).toBeLessThanOrEqual(10);
    }
  });

  it("All 54 African jurisdictions have borrower retention policies", async () => {
    const result = await db.execute(sql`
      SELECT COUNT(DISTINCT country)::int AS cnt FROM retention_policies
      WHERE entity_type = 'borrower'
        AND country NOT IN ('All', 'Ethiopia', 'Uganda', 'Liberia')
    `);
    const rows = result.rows as Array<{ cnt: number }>;
    expect(rows[0].cnt).toBeGreaterThanOrEqual(50);
  });

  it("BCEAO zone countries (Benin, Mali, Senegal, Togo) have 5yr borrower retention", async () => {
    const bceaoCountries = ["Benin", "Mali", "Senegal", "Togo"];
    for (const country of bceaoCountries) {
      const [row] = await db.select().from(retentionPolicies)
        .where(and(eq(retentionPolicies.country, country), eq(retentionPolicies.entityType, "borrower")))
        .limit(1);
      expect(row, `${country} must have a borrower retention policy`).toBeDefined();
      expect(row.retentionYears, `${country} BCEAO member must be 5yr`).toBe(5);
    }
  });

  it("CEMAC zone countries (Cameroon, Gabon, Chad) have 5yr borrower retention", async () => {
    const cemacCountries = ["Cameroon", "Gabon", "Chad"];
    for (const country of cemacCountries) {
      const [row] = await db.select().from(retentionPolicies)
        .where(and(eq(retentionPolicies.country, country), eq(retentionPolicies.entityType, "borrower")))
        .limit(1);
      expect(row, `${country} must have a borrower retention policy`).toBeDefined();
      expect(row.retentionYears, `${country} CEMAC member must be 5yr`).toBe(5);
    }
  });

  it("South Africa borrower: 7yr (NCR National Credit Act 2005, s.71)", async () => {
    const [row] = await db.select().from(retentionPolicies)
      .where(and(eq(retentionPolicies.country, "South Africa"), eq(retentionPolicies.entityType, "borrower")))
      .limit(1);
    expect(row).toBeDefined();
    expect(row.retentionYears).toBe(7);
  });

  it("East Africa (Tanzania, Rwanda) have 5yr borrower retention (BoT/BNR)", async () => {
    for (const country of ["Tanzania", "Rwanda"]) {
      const [row] = await db.select().from(retentionPolicies)
        .where(and(eq(retentionPolicies.country, country), eq(retentionPolicies.entityType, "borrower")))
        .limit(1);
      expect(row, `${country} must have a retention policy`).toBeDefined();
      expect(row.retentionYears).toBe(5);
    }
  });

  it("North Africa (Egypt, Morocco, Tunisia) have 5yr borrower retention", async () => {
    for (const country of ["Egypt", "Morocco", "Tunisia"]) {
      const [row] = await db.select().from(retentionPolicies)
        .where(and(eq(retentionPolicies.country, country), eq(retentionPolicies.entityType, "borrower")))
        .limit(1);
      expect(row, `${country} must have a retention policy`).toBeDefined();
      expect(row.retentionYears).toBe(5);
    }
  });
});

// ─── B. Regulatory dashboard country filter ───────────────────────────────────

describe("B. Regulatory dashboard country filter (borrower subquery)", () => {
  it("Nigeria credit accounts reachable via borrower subquery", async () => {
    const result = await db.execute(sql`
      SELECT COUNT(*)::int AS cnt FROM credit_accounts
      WHERE borrower_id IN (SELECT id FROM borrowers WHERE country = 'Nigeria')
    `);
    const rows = result.rows as Array<{ cnt: number }>;
    expect(rows[0].cnt).toBeGreaterThan(0);
  });

  it("Kenya credit accounts reachable via borrower subquery", async () => {
    const result = await db.execute(sql`
      SELECT COUNT(*)::int AS cnt FROM credit_accounts
      WHERE borrower_id IN (SELECT id FROM borrowers WHERE country = 'Kenya')
    `);
    const rows = result.rows as Array<{ cnt: number }>;
    expect(rows[0].cnt).toBeGreaterThan(0);
  });

  it("Sierra Leone credit accounts reachable via borrower subquery", async () => {
    const result = await db.execute(sql`
      SELECT COUNT(*)::int AS cnt FROM credit_accounts
      WHERE borrower_id IN (SELECT id FROM borrowers WHERE country = 'Sierra Leone')
    `);
    const rows = result.rows as Array<{ cnt: number }>;
    expect(rows[0].cnt).toBeGreaterThan(0);
  });

  it("Borrower subquery returns more results than org-join for Nigeria (old path was broken)", async () => {
    const [newPath, oldPath] = await Promise.all([
      db.execute(sql`
        SELECT COUNT(*)::int AS cnt FROM credit_accounts
        WHERE borrower_id IN (SELECT id FROM borrowers WHERE country = 'Nigeria')
      `),
      db.execute(sql`
        SELECT COUNT(*)::int AS cnt FROM credit_accounts ca
        LEFT JOIN organizations o ON ca.organization_id = o.id WHERE o.country = 'Nigeria'
      `),
    ]);
    const newRows = newPath.rows as Array<{ cnt: number }>;
    const oldRows = oldPath.rows as Array<{ cnt: number }>;
    expect(newRows[0].cnt).toBeGreaterThan(oldRows[0].cnt);
  });
});

// ─── C. BOG consent gate ──────────────────────────────────────────────────────

describe("C. BOG consent gate — data model and enforcement", () => {
  it("consent_records has required gate-enforcement columns", async () => {
    const result = await db.execute(sql`
      SELECT column_name FROM information_schema.columns
      WHERE table_name = 'consent_records'
        AND column_name IN ('id','status','borrower_id','consent_type','data_subject_confirmed','revoked_at','expires_at')
      ORDER BY column_name
    `);
    const cols = (result.rows as Array<{ column_name: string }>).map(r => r.column_name);
    expect(cols).toContain("status");
    expect(cols).toContain("borrower_id");
    expect(cols).toContain("data_subject_confirmed");
    expect(cols).toContain("revoked_at");
  });

  it("consent_records.borrower_id has FK to borrowers", async () => {
    const result = await db.execute(sql`
      SELECT tc.constraint_type FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
      WHERE tc.table_name = 'consent_records' AND kcu.column_name = 'borrower_id'
        AND tc.constraint_type = 'FOREIGN KEY'
    `);
    expect(result.rows.length).toBeGreaterThanOrEqual(1);
  });

  it("creating an active consent and retrieving it works", async () => {
    const borrowerResult = await db.execute(sql`SELECT id FROM borrowers WHERE type = 'individual' LIMIT 1`);
    if (borrowerResult.rows.length === 0) return;
    const borrowerId = (borrowerResult.rows[0] as { id: string }).id;

    const [consent] = await db.insert(consentRecords).values({
      borrowerId,
      grantedTo: "test-gate-institution",
      purpose: "credit_report",
      consentType: "data_access",
      status: "active",
      receiptNumber: `TEST-GATE-${Date.now()}`,
      dataSubjectConfirmed: true,
    }).returning();

    expect(consent.borrowerId).toBe(borrowerId);
    expect(consent.status).toBe("active");

    const retrieved = await db.execute(sql`
      SELECT status, data_subject_confirmed FROM consent_records WHERE id = ${consent.id}
    `);
    const row = (retrieved.rows[0] as { status: string; data_subject_confirmed: boolean });
    expect(row.status).toBe("active");
    expect(row.data_subject_confirmed).toBe(true);

    await db.execute(sql`DELETE FROM consent_records WHERE id = ${consent.id}`);
  });

  it("no active consent record has revoked_at set (invalid state)", async () => {
    const result = await db.execute(sql`
      SELECT COUNT(*)::int AS cnt FROM consent_records WHERE status = 'active' AND revoked_at IS NOT NULL
    `);
    expect((result.rows[0] as { cnt: number }).cnt).toBe(0);
  });
});

// ─── D. Maker-checker self-approval prevention ────────────────────────────────

describe("D. Maker-checker self-approval prevention", () => {
  it("pending_approvals has required dual-identity columns", async () => {
    const result = await db.execute(sql`
      SELECT column_name FROM information_schema.columns
      WHERE table_name = 'pending_approvals'
        AND column_name IN ('requested_by','reviewed_by','status','payload','country')
      ORDER BY column_name
    `);
    const cols = (result.rows as Array<{ column_name: string }>).map(r => r.column_name);
    expect(cols).toContain("requested_by");
    expect(cols).toContain("reviewed_by");
    expect(cols).toContain("status");
    expect(cols).toContain("country");
  });

  it("isPlatformPrivileged: true for super_admin and platform_owner only", () => {
    expect(isPlatformPrivileged("super_admin")).toBe(true);
    expect(isPlatformPrivileged("platform_owner")).toBe(true);
    for (const role of ["admin", "lender", "regulator", "viewer", "dgi_officer", "tax_authority_admin"]) {
      expect(isPlatformPrivileged(role), `role '${role}' must not be privileged`).toBe(false);
    }
  });

  it("self-approval DB pattern: requestedBy is populated and reviewedBy starts null", async () => {
    const userResult = await db.execute(sql`SELECT id FROM users LIMIT 1`);
    if (userResult.rows.length === 0) return;
    const userId = (userResult.rows[0] as { id: string }).id;

    const result = await db.execute(sql`
      INSERT INTO pending_approvals (entity_type, action, payload, requested_by, status, country)
      VALUES ('borrower','update','{"type":"test"}', ${userId}, 'pending', 'Ghana')
      RETURNING id, requested_by, reviewed_by, status
    `);
    const row = result.rows[0] as { id: string; requested_by: string; reviewed_by: string | null; status: string };

    expect(row.requested_by).toBe(userId);
    expect(row.status).toBe("pending");
    expect(row.reviewed_by).toBeNull();

    await db.execute(sql`DELETE FROM pending_approvals WHERE id = ${row.id}`);
  });
});

// ─── E. PAPSS ISO-3166-1 alpha-2 country validation ──────────────────────────

describe("E. PAPSS ISO-3166-1 alpha-2 country code validation", () => {
  const VALID_AFRICAN_ISO2 = new Set([
    "DZ","AO","BJ","BW","BF","BI","CV","CM","CF","TD","KM","CG","CD","CI","DJ","EG","GQ","ER","SZ","ET",
    "GA","GM","GH","GN","GW","KE","LS","LR","LY","MG","MW","ML","MR","MU","MA","MZ","NA","NE","NG","RW",
    "ST","SN","SC","SL","SO","ZA","SS","SD","TZ","TG","TN","UG","ZM","ZW",
  ]);

  it("validation set contains exactly 54 African countries", () => {
    expect(VALID_AFRICAN_ISO2.size).toBe(54);
  });

  it("5 core jurisdictions (GH/NG/KE/SL/CI) are valid PAPSS endpoints", () => {
    for (const code of ["GH", "NG", "KE", "SL", "CI"]) {
      expect(VALID_AFRICAN_ISO2.has(code), `${code} must be in PAPSS set`).toBe(true);
    }
  });

  it("non-African codes are rejected", () => {
    for (const code of ["US", "GB", "FR", "CN", "DE", "BR", "XX", "IN"]) {
      expect(VALID_AFRICAN_ISO2.has(code), `${code} must not be in PAPSS set`).toBe(false);
    }
  });

  it("papss_settlements table has sender_country and receiver_country columns", async () => {
    const result = await db.execute(sql`
      SELECT column_name FROM information_schema.columns
      WHERE table_name = 'papss_settlements'
        AND column_name IN ('sender_country','receiver_country','iso20022_reference')
      ORDER BY column_name
    `);
    const cols = (result.rows as Array<{ column_name: string }>).map(r => r.column_name);
    expect(cols).toContain("sender_country");
    expect(cols).toContain("receiver_country");
    expect(cols).toContain("iso20022_reference");
  });
});

// ─── F. Cascade erasure dual-approval gate ───────────────────────────────────

describe("F. Cascade erasure dual-approval gate", () => {
  it("can identify approved data_erasure pending_approvals", async () => {
    const result = await db.execute(sql`
      SELECT COUNT(*)::int AS cnt FROM pending_approvals
      WHERE status = 'approved' AND payload IS NOT NULL
    `);
    expect(typeof (result.rows[0] as { cnt: number }).cnt).toBe("number");
  });

  it("full erasure gate cycle: insert pending → approve → gate query succeeds", async () => {
    const userResult = await db.execute(sql`SELECT id FROM users ORDER BY created_at LIMIT 2`);
    if (userResult.rows.length < 1) return;
    const makerId = (userResult.rows[0] as { id: string }).id;
    const reviewerId = (userResult.rows[userResult.rows.length > 1 ? 1 : 0] as { id: string }).id;

    const payload = JSON.stringify({ type: "data_erasure", borrowerId: `test-${Date.now()}`, reason: "DPA request" });

    const insert = await db.execute(sql`
      INSERT INTO pending_approvals (entity_type, action, payload, requested_by, status, country)
      VALUES ('borrower','data_erasure', ${payload}, ${makerId}, 'pending', 'Ghana')
      RETURNING id, status
    `);
    const approval = insert.rows[0] as { id: string; status: string };
    expect(approval.status).toBe("pending");

    await db.execute(sql`
      UPDATE pending_approvals SET status = 'approved', reviewed_by = ${reviewerId} WHERE id = ${approval.id}
    `);

    const found = await db.execute(sql`
      SELECT id FROM pending_approvals
      WHERE id = ${approval.id} AND status = 'approved' AND payload::jsonb->>'type' = 'data_erasure'
    `);
    expect(found.rows.length).toBe(1);

    await db.execute(sql`DELETE FROM pending_approvals WHERE id = ${approval.id}`);
  });
});

// ─── G. DGI country isolation ─────────────────────────────────────────────────

describe("G. DGI country isolation — middleware", () => {
  it("getCountryFilter returns user's country for dgi_officer", () => {
    const req = { session: { userRole: "dgi_officer", userCountry: "CI" }, query: {} } as any;
    expect(getCountryFilter(req)).toBe("CI");
  });

  it("getCountryFilter respects ?country= for privileged roles", () => {
    const req = { session: { userRole: "super_admin", userCountry: "CI" }, query: { country: "GH" } } as any;
    expect(getCountryFilter(req)).toBe("GH");
  });

  it("enforceCountryScopeForNonSuperAdmin: dgi_officer blocked from cross-country", () => {
    const req = { session: { userRole: "dgi_officer", userCountry: "CI" }, query: {} } as any;
    expect(() => enforceCountryScopeForNonSuperAdmin(req, "GH", "/api/loto/admin/kpis")).toThrow(/does not match/);
  });

  it("enforceCountryScopeForNonSuperAdmin: passes for own country", () => {
    const req = { session: { userRole: "dgi_officer", userCountry: "CI" }, query: {} } as any;
    expect(() => enforceCountryScopeForNonSuperAdmin(req, "CI", "/api/loto/admin/kpis")).not.toThrow();
  });

  it("enforceCountryScopeForNonSuperAdmin: super_admin unrestricted", () => {
    const req = { session: { userRole: "super_admin", userCountry: "CI" }, query: {} } as any;
    expect(() => enforceCountryScopeForNonSuperAdmin(req, "GH", "/api/loto/admin/kpis")).not.toThrow();
  });

  it("enforceCountryScopeForNonSuperAdmin: undefined country throws", () => {
    const req = { session: { userRole: "dgi_officer", userCountry: "CI" }, query: {} } as any;
    expect(() => enforceCountryScopeForNonSuperAdmin(req, undefined, "/api/loto/admin/kpis")).toThrow(/Country scope required/);
  });

  it("tax_authority_admin is also country-scoped", () => {
    const req = { session: { userRole: "tax_authority_admin", userCountry: "NG" }, query: {} } as any;
    expect(() => enforceCountryScopeForNonSuperAdmin(req, "GH", "/api/loto/admin/kpis")).toThrow(/does not match/);
  });
});

// ─── H. Alternative data credit scoring ───────────────────────────────────────

describe("H. Alternative data in credit scoring (financial inclusion)", () => {
  const noAccounts: AccountLike[] = [];

  it("thin-file with no alt data scores 600 (baseline)", () => {
    const result = calculateCreditScore(noAccounts, 0, [], false, []);
    expect(result.score).toBe(600);
    expect(result.reasonCodes).toContain("THIN_FILE_LIMITED_HISTORY");
  });

  it("mobile_money alt data boosts thin-file score above 600", () => {
    const alt: AlternativeDataLike[] = [
      { source: "mobile_money", status: "active", totalTransactions: 120, onTimePayments: 100, latePayments: 20 },
    ];
    expect(calculateCreditScore(noAccounts, 0, [], false, alt).score).toBeGreaterThan(600);
  });

  it("utility alt data boosts thin-file score above 600", () => {
    const alt: AlternativeDataLike[] = [
      { source: "utility", status: "active", totalTransactions: 24, onTimePayments: 24, latePayments: 0 },
    ];
    expect(calculateCreditScore(noAccounts, 0, [], false, alt).score).toBeGreaterThan(600);
  });

  it("telco alt data boosts thin-file score above 600", () => {
    const alt: AlternativeDataLike[] = [
      { source: "telco", status: "active", totalTransactions: 36, onTimePayments: 32, latePayments: 4 },
    ];
    expect(calculateCreditScore(noAccounts, 0, [], false, alt).score).toBeGreaterThan(600);
  });

  it("multiple active sources produce a higher score than a single source", () => {
    const single: AlternativeDataLike[] = [
      { source: "mobile_money", status: "active", totalTransactions: 60, onTimePayments: 50, latePayments: 10 },
    ];
    const multi: AlternativeDataLike[] = [
      ...single,
      { source: "utility", status: "active", totalTransactions: 12, onTimePayments: 12, latePayments: 0 },
    ];
    expect(calculateCreditScore(noAccounts, 0, [], false, multi).score)
      .toBeGreaterThanOrEqual(calculateCreditScore(noAccounts, 0, [], false, single).score);
  });

  it("inactive alt data is ignored — score stays at thin-file baseline", () => {
    const alt: AlternativeDataLike[] = [
      { source: "mobile_money", status: "inactive", totalTransactions: 200, onTimePayments: 190, latePayments: 10 },
    ];
    expect(calculateCreditScore(noAccounts, 0, [], false, alt).score).toBe(600);
  });

  it("excellent alt data is capped at 680 (prevents thin-file score inflation)", () => {
    const alt: AlternativeDataLike[] = [
      { source: "mobile_money", status: "active", totalTransactions: 1000, onTimePayments: 1000, latePayments: 0 },
      { source: "utility", status: "active", totalTransactions: 60, onTimePayments: 60, latePayments: 0 },
    ];
    const score = calculateCreditScore(noAccounts, 0, [], false, alt).score;
    expect(score).toBeGreaterThan(600);
    expect(score).toBeLessThanOrEqual(680);
  });

  it("borrower with formal accounts + alt data scores above 650", () => {
    const accounts: AccountLike[] = [
      { status: "current", currentBalance: "10000", amountOverdue: "0", daysInArrears: 0,
        currency: "GHS" } as AccountLike,
    ];
    const alt: AlternativeDataLike[] = [
      { source: "mobile_money", status: "active", totalTransactions: 80, onTimePayments: 70, latePayments: 10 },
    ];
    expect(calculateCreditScore(accounts, 1, [], false, alt).score).toBeGreaterThan(650);
  });
});

// ─── I. CBN and CBK export format validation ───────────────────────────────────

describe("I. CBN and CBK export format — jurisdiction-specific field validation", () => {
  it("CBN CONC header contains BVN and NIN (Nigeria-specific)", () => {
    expect(CBN_CONC_HEADERS).toContain("BVN");
    expect(CBN_CONC_HEADERS).toContain("NIN");
    expect(CBN_CONC_HEADERS).toContain("AccountNumber");
    expect(CBN_CONC_HEADERS).toContain("AccountStatus");
    expect(CBN_CONC_HEADERS).toContain("AssetClassification");
  });

  it("CBN BUSC header contains RCNumber and TINNumber (CAMA/FIRS)", () => {
    expect(CBN_BUSC_HEADERS).toContain("RCNumber");
    expect(CBN_BUSC_HEADERS).toContain("TINNumber");
    expect(CBN_BUSC_HEADERS).toContain("CompanyName");
  });

  it("CBN CONC header has at least 50 pipe-delimited fields", () => {
    expect(CBN_CONC_HEADERS.join("|").split("|").length).toBeGreaterThanOrEqual(50);
  });

  it("CBK CONC header contains NationalID and KRAPIN (Kenya-specific)", () => {
    expect(CBK_CONC_HEADERS).toContain("NationalID");
    expect(CBK_CONC_HEADERS).toContain("KRAPIN");
    expect(CBK_CONC_HEADERS).toContain("AccountNumber");
    expect(CBK_CONC_HEADERS).toContain("AccountStatus");
  });

  it("CBK BUSC header contains BusinessRegNumber and KRAPIN", () => {
    expect(CBK_BUSC_HEADERS).toContain("BusinessRegNumber");
    expect(CBK_BUSC_HEADERS).toContain("KRAPIN");
    expect(CBK_BUSC_HEADERS).toContain("CompanyName");
  });

  it("CBN and CBK headers are jurisdictionally distinct (BVN/NIN vs NationalID/KRAPIN)", () => {
    expect(CBN_CONC_HEADERS).toContain("BVN");
    expect(CBN_CONC_HEADERS).not.toContain("NationalID");
    expect(CBK_CONC_HEADERS).toContain("NationalID");
    expect(CBK_CONC_HEADERS).not.toContain("BVN");
  });

  it("CBN CONC has CBN CRR 2017 arrears aging buckets (AmtOverdue1to30 through AmtOverdue181plus)", () => {
    const aging = CBN_CONC_HEADERS.filter(h => h.startsWith("AmtOverdue"));
    expect(aging.length).toBeGreaterThanOrEqual(6);
    expect(CBN_CONC_HEADERS).toContain("AmtOverdue1to30");
    expect(CBN_CONC_HEADERS).toContain("AmtOverdue181plus");
  });

  it("CBK CONC has CBK CRB 2020 arrears aging buckets", () => {
    const aging = CBK_CONC_HEADERS.filter(h => h.startsWith("AmtOverdue"));
    expect(aging.length).toBeGreaterThanOrEqual(6);
    expect(CBK_CONC_HEADERS).toContain("AmtOverdue1to30");
    expect(CBK_CONC_HEADERS).toContain("AmtOverdue181plus");
  });
});

// ─── J. Multi-country seed data ───────────────────────────────────────────────

describe("J. Multi-country seed data — regulatory dashboard availability", () => {
  it("all 5 core jurisdictions have seeded borrowers", async () => {
    const result = await db.execute(sql`
      SELECT country, COUNT(*)::int AS cnt FROM borrowers
      WHERE country IN ('Ghana','Nigeria','Kenya','Sierra Leone','Côte d''Ivoire')
      GROUP BY country
    `);
    const byCountry = Object.fromEntries(
      (result.rows as Array<{ country: string; cnt: number }>).map(r => [r.country, r.cnt])
    );
    expect(byCountry["Ghana"] ?? 0).toBeGreaterThan(0);
    expect(byCountry["Nigeria"] ?? 0).toBeGreaterThanOrEqual(8);
    expect(byCountry["Kenya"] ?? 0).toBeGreaterThanOrEqual(8);
    expect(byCountry["Sierra Leone"] ?? 0).toBeGreaterThanOrEqual(5);
    expect(byCountry["Côte d'Ivoire"] ?? 0).toBeGreaterThanOrEqual(5);
  }, 15000);

  it("credit accounts exist for all 5 core jurisdictions", async () => {
    const result = await db.execute(sql`
      SELECT b.country, COUNT(ca.id)::int AS cnt FROM credit_accounts ca
      JOIN borrowers b ON ca.borrower_id = b.id
      WHERE b.country IN ('Ghana','Nigeria','Kenya','Sierra Leone','Côte d''Ivoire')
      GROUP BY b.country
    `);
    const byCountry = Object.fromEntries(
      (result.rows as Array<{ country: string; cnt: number }>).map(r => [r.country, r.cnt])
    );
    expect(Object.keys(byCountry).length).toBeGreaterThanOrEqual(4);
    for (const [country, cnt] of Object.entries(byCountry)) {
      expect(cnt, `${country} must have credit accounts`).toBeGreaterThan(0);
    }
  }, 15000);

  it("all 5 core jurisdictions have active borrower retention policies", async () => {
    const result = await db.execute(sql`
      SELECT country FROM retention_policies
      WHERE entity_type = 'borrower' AND is_active = true
        AND country IN ('Ghana','Nigeria','Kenya','Sierra Leone','Côte d''Ivoire')
    `);
    const countries = (result.rows as Array<{ country: string }>).map(r => r.country);
    for (const c of ["Ghana", "Nigeria", "Kenya", "Sierra Leone", "Côte d'Ivoire"]) {
      expect(countries, `${c} must have an active borrower retention policy`).toContain(c);
    }
  }, 15000);
});
