/**
 * seed-demo-data.ts
 *
 * Seeds realistic Ghana-themed demo data for all pages that previously showed
 * blank tables:
 *   - Compliance Queue  (watchlist_hits + fraud_alerts)
 *   - Portfolio Triggers (portfolio_trigger_subscriptions + events)
 *   - Telco Scoring     (telco_profiles + telco_credit_scores)
 *   - Telco Lending     (~15 focused demo telco_loans with repayments)
 *   - Loan Origination  (loan_applications)
 *   - Collateral Registry amendment requests
 *   - PAPSS Settlements (~20 cross-border settlement records)
 *
 * Idempotency: every section skips completely if its target table already
 * contains any rows (strict no-op). Re-running on a non-empty database is safe.
 */

import { db } from "./db";
import {
  watchlistHits,
  fraudAlerts,
  portfolioTriggerSubscriptions,
  portfolioTriggerEvents,
  telcoProfiles,
  telcoCreditScores,
  telcoLoans,
  telcoLoanRepayments,
  loanApplications,
  collateralAmendmentRequests,
  papssSettlements,
  borrowers,
  organizations,
  users,
  collateralItems,
} from "@shared/schema";
import { count, eq } from "drizzle-orm";
import type { PgTable } from "drizzle-orm/pg-core";
import { randomUUID } from "crypto";

// ─────────────────────────────────────────────────────────────────────────────
// Utility helpers
// ─────────────────────────────────────────────────────────────────────────────

function rand(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}
function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}
async function tableCount(table: PgTable): Promise<number> {
  const [row] = await db.select({ value: count() }).from(table);
  return Number(row?.value ?? 0);
}

// ─────────────────────────────────────────────────────────────────────────────
// FK lookup helpers
// ─────────────────────────────────────────────────────────────────────────────

async function getGhanaBorrowers() {
  return db
    .select({ id: borrowers.id })
    .from(borrowers)
    .where(eq(borrowers.country, "Ghana"))
    .limit(20);
}

async function getOrgs() {
  return db.select({ id: organizations.id, slug: organizations.slug, type: organizations.type }).from(organizations).limit(10);
}

async function getFirstSuperAdmin() {
  const rows = await db
    .select({ id: users.id, organizationId: users.organizationId })
    .from(users)
    .where(eq(users.role, "super_admin"))
    .limit(1);
  return rows[0] ?? null;
}

async function getCollateralItems() {
  return db
    .select({ id: collateralItems.id, lenderOrganizationId: collateralItems.lenderOrganizationId })
    .from(collateralItems)
    .limit(10);
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. Watchlist Hits + Fraud Alerts  (Compliance Queue)
// ─────────────────────────────────────────────────────────────────────────────

async function seedComplianceQueue() {
  const hitCount = await tableCount(watchlistHits);
  const alertCount = await tableCount(fraudAlerts);
  // Per-table idempotency: each table seeded independently so a partial-data
  // state (one table filled, the other empty) is back-filled on next restart.
  const needHits = hitCount === 0;
  const needAlerts = alertCount === 0;
  if (!needHits && !needAlerts) {
    console.log(`[DemoSeed] Compliance queue already seeded (${hitCount} hits, ${alertCount} alerts) — skipping.`);
    return;
  }

  const ghBorrowers = await getGhanaBorrowers();
  if (ghBorrowers.length === 0) {
    console.log("[DemoSeed] No Ghana borrowers found — skipping compliance seed.");
    return;
  }

  const orgs = await getOrgs();
  const bankOrgId = orgs.find(o => o.type === "bank")?.id ?? null;

  type WatchlistSource = "sanctions_un" | "sanctions_ofac" | "sanctions_eu" | "pep" | "adverse_media" | "internal_block";
  type ReviewStatus = "open" | "investigating" | "resolved" | "false_positive" | "escalated";

  interface HitTemplate {
    source: WatchlistSource;
    provider: string;
    matchedName: string;
    matchDetails: string;
    score: string;
    status: ReviewStatus;
  }

  const hitTemplates: HitTemplate[] = [
    { source: "sanctions_un",    provider: "UN Sanctions List",        matchedName: "Kwame Asante",        matchDetails: "Name match (85%) against UN consolidated sanctions list. Entity type: individual. Listed 2021-03-14.",                       score: "85.00", status: "open" },
    { source: "sanctions_ofac",  provider: "Refinitiv WorldCheck",     matchedName: "Kofi Mensah Boateng", matchDetails: "Fuzzy name match (91%) — OFAC SDN List, designation: narcotics trafficking. DOB proximity match.",                          score: "91.50", status: "open" },
    { source: "pep",             provider: "Accuity PEP Database",     matchedName: "Adjoa Asante-Antwi",  matchDetails: "Politically exposed person — junior minister, Ministry of Finance, Ghana. Low-risk PEP tier 3.",                            score: "78.00", status: "investigating" },
    { source: "adverse_media",   provider: "Google News / LexisNexis", matchedName: "Samuel Agyei",        matchDetails: "Adverse media hit: subject named in fraud investigation (Graphic Ghana, 2024-07). Case still open.",                        score: "72.50", status: "investigating" },
    { source: "sanctions_eu",    provider: "EU Consolidated List",     matchedName: "Yaw Donkor",          matchDetails: "Phonetic match (79%) against EU asset freeze list. Country of origin: Ghana. Requires manual review.",                      score: "79.00", status: "escalated" },
    { source: "internal_block",  provider: "Internal Risk Team",       matchedName: "Gifty Osei Bonsu",    matchDetails: "Internal block: previous fraud incident in 2023. Account was written off. Do not onboard.",                                  score: "99.00", status: "open" },
    { source: "sanctions_ofac",  provider: "OFAC SDN List",            matchedName: "Emmanuel Frimpong",   matchDetails: "Possible match (68%) — entity listed for money laundering. Address proximity match only.",                                  score: "68.00", status: "resolved" },
    { source: "adverse_media",   provider: "LexisNexis Risk",          matchedName: "Felicia Asante",      matchDetails: "Historical adverse media: subject linked to cheque fraud scheme in 2022. Case closed, acquitted.",                          score: "60.00", status: "false_positive" },
    { source: "pep",             provider: "Dow Jones Factiva",        matchedName: "Livingstone Mensah",  matchDetails: "Close associate of PEP — family member of former deputy minister. Enhanced due diligence required.",                        score: "55.00", status: "resolved" },
    { source: "sanctions_un",    provider: "UN Sanctions List",        matchedName: "Martha Dankwa",       matchDetails: "Name match (52%) — common Ghanaian name, likely false positive. Recommend verification.",                                   score: "52.00", status: "false_positive" },
  ];

  if (needHits) {
    // Cycle borrower IDs modulo so we always produce 10 rows regardless of
    // how many Ghana borrowers are in the environment.
    const hitRows = hitTemplates.map((tmpl, i) => ({
      borrowerId: ghBorrowers[i % ghBorrowers.length].id,
      source: tmpl.source,
      provider: tmpl.provider,
      matchScore: tmpl.score,
      matchedName: tmpl.matchedName,
      matchDetails: tmpl.matchDetails,
      status: tmpl.status,
      organizationId: bankOrgId,
      createdAt: daysAgo(rand(1, 89)),
      resolvedAt: (tmpl.status === "resolved" || tmpl.status === "false_positive") ? daysAgo(rand(1, 10)) : null,
    }));
    await db.insert(watchlistHits).values(hitRows);
    console.log(`[DemoSeed] Inserted ${hitRows.length} watchlist hits.`);
  }

  type FraudSeverity = "low" | "medium" | "high" | "critical";

  interface AlertTemplate {
    ruleCode: string;
    description: string;
    severity: FraudSeverity;
    status: ReviewStatus;
  }

  const alertTemplates: AlertTemplate[] = [
    { ruleCode: "VELOCITY_001", description: "High-frequency loan applications across multiple institutions within 30 days",          severity: "critical", status: "open" },
    { ruleCode: "IDENTITY_002", description: "ID document used by multiple different applicants",                                    severity: "high",     status: "open" },
    { ruleCode: "ADDRESS_003",  description: "Address linked to known fraud ring — 12+ applicants at same address",                  severity: "medium",   status: "investigating" },
    { ruleCode: "COLLATERAL_004", description: "Collateral pledged simultaneously to multiple lenders",                              severity: "high",     status: "resolved" },
    { ruleCode: "SYNTHETIC_005", description: "Synthetic identity indicators — NIA ID number fails checksum validation",             severity: "low",      status: "false_positive" },
  ];

  if (needAlerts) {
    const alertRows = alertTemplates.map((tmpl, i) => ({
      borrowerId: ghBorrowers[i % ghBorrowers.length].id,
      ruleCode: tmpl.ruleCode,
      ruleDescription: tmpl.description,
      severity: tmpl.severity,
      evidence: `Automated detection at ${daysAgo(rand(1, 60)).toISOString().slice(0, 10)}. ${rand(2, 12)} corroborating data points.`,
      relatedBorrowerIds: [] as string[],
      status: tmpl.status,
      organizationId: bankOrgId,
      createdAt: daysAgo(rand(1, 60)),
      resolvedAt: (tmpl.status === "resolved" || tmpl.status === "false_positive") ? daysAgo(rand(1, 5)) : null,
    }));
    await db.insert(fraudAlerts).values(alertRows);
    console.log(`[DemoSeed] Inserted ${alertRows.length} fraud alerts.`);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. Portfolio Trigger Subscriptions + Events
// ─────────────────────────────────────────────────────────────────────────────

async function seedPortfolioTriggers() {
  const subCount = await tableCount(portfolioTriggerSubscriptions);
  const evtCount = await tableCount(portfolioTriggerEvents);
  const needSubs = subCount === 0;
  const needEvents = evtCount === 0;

  if (!needSubs && !needEvents) {
    console.log(`[DemoSeed] Portfolio triggers already seeded (${subCount} subs, ${evtCount} events) — skipping.`);
    return;
  }

  const ghBorrowers = await getGhanaBorrowers();
  const orgs = await getOrgs();
  const adminUser = await getFirstSuperAdmin();

  if (ghBorrowers.length === 0 || orgs.length === 0) {
    console.log("[DemoSeed] Missing borrowers or orgs — skipping portfolio trigger seed.");
    return;
  }

  const bankOrgs = orgs.filter(o => o.type === "bank");
  const orgIds = [
    bankOrgs[0]?.id ?? orgs[0].id,
    bankOrgs[1]?.id ?? orgs[0].id,
    bankOrgs[2]?.id ?? orgs[0].id,
  ];

  const subscriptionDefs = [
    { label: "Score Drop Monitor — Retail Portfolio",     triggerTypes: ["score_drop", "new_judgment", "late_payment"],                                          orgId: orgIds[0] },
    { label: "New Inquiry Tracker — SME Lending",         triggerTypes: ["new_inquiry", "new_account"],                                                          orgId: orgIds[1] },
    { label: "Delinquency Alert — Housing Loans",         triggerTypes: ["late_payment", "status_change", "new_judgment"],                                       orgId: orgIds[0] },
    { label: "Full Surveillance — Top 50 Exposures",      triggerTypes: ["score_drop", "new_inquiry", "new_account", "status_change", "new_judgment", "late_payment"], orgId: orgIds[2] },
    { label: "Account Opening Monitor",                   triggerTypes: ["new_account", "new_inquiry"],                                                          orgId: orgIds[1] },
  ];

  let subIds: string[] = [];

  if (needSubs) {
    for (let i = 0; i < subscriptionDefs.length && i < ghBorrowers.length; i++) {
      const def = subscriptionDefs[i];
      const [inserted] = await db
        .insert(portfolioTriggerSubscriptions)
        .values({
          organizationId: def.orgId,
          borrowerId: ghBorrowers[i].id,
          triggerTypes: def.triggerTypes,
          status: "active",
          label: def.label,
          createdBy: adminUser?.id ?? null,
          createdAt: daysAgo(rand(30, 180)),
          updatedAt: daysAgo(rand(1, 29)),
        })
        .returning({ id: portfolioTriggerSubscriptions.id });
      subIds.push(inserted.id);
    }
    console.log(`[DemoSeed] Inserted ${subIds.length} portfolio trigger subscriptions.`);
  } else {
    // Subscriptions already exist — load their IDs for event generation below
    const existing = await db
      .select({ id: portfolioTriggerSubscriptions.id })
      .from(portfolioTriggerSubscriptions)
      .limit(subscriptionDefs.length);
    subIds = existing.map(r => r.id);
    console.log(`[DemoSeed] Portfolio trigger subscriptions already seeded (${subCount}) — loading IDs for event back-fill.`);
  }

  if (needEvents && subIds.length > 0) {
    const eventRows: Array<{
      subscriptionId: string;
      organizationId: string;
      borrowerId: string;
      eventType: string;
      eventData: Record<string, unknown>;
      notifiedVia: string[];
      webhookStatus: string | null;
      firedAt: Date;
    }> = [];

    for (let s = 0; s < subIds.length; s++) {
      const def = subscriptionDefs[s % subscriptionDefs.length];
      const borrowerId = ghBorrowers[s % ghBorrowers.length].id;
      const numEvents = rand(2, 4);

      for (let e = 0; e < numEvents; e++) {
        const eventType = pick(def.triggerTypes as string[]);
        const firedAt = daysAgo(rand(1, 60));

        let eventData: Record<string, unknown>;
        if (eventType === "score_drop") {
          const prev = rand(550, 680);
          const next = rand(400, prev - 20);
          eventData = { previousScore: prev, newScore: next, drop: prev - next, reason: "Missed payment reported" };
        } else if (eventType === "new_inquiry") {
          eventData = { inquiringOrg: pick(["GCB Bank", "Ecobank Ghana", "Fidelity Bank", "Zenith Bank"]), purpose: "loan_application", inquiryDate: firedAt.toISOString().slice(0, 10) };
        } else if (eventType === "new_account") {
          eventData = { accountType: pick(["personal_loan", "overdraft", "mortgage", "auto_loan"]), lender: pick(["Bank of Ghana", "GCB Bank", "Ecobank Ghana"]), limit: rand(5000, 100000), currency: "GHS" };
        } else if (eventType === "late_payment") {
          eventData = { daysLate: rand(1, 90), accountType: "personal_loan", creditor: pick(["GCB Bank", "Ecobank Ghana"]), amountOverdue: rand(500, 15000), currency: "GHS" };
        } else if (eventType === "new_judgment") {
          eventData = { court: pick(["Accra High Court", "Kumasi District Court"]), caseRef: `GH-${rand(1000, 9999)}-2024`, amount: rand(10000, 200000), currency: "GHS" };
        } else {
          eventData = { from: pick(["active", "performing"]), to: pick(["non_performing", "watch_list"]), changedBy: "System" };
        }

        eventRows.push({
          subscriptionId: subIds[s],
          organizationId: def.orgId,
          borrowerId,
          eventType,
          eventData,
          notifiedVia: ["email", "in_app"],
          webhookStatus: Math.random() > 0.3 ? "delivered" : null,
          firedAt,
        });
      }
    }

    if (eventRows.length > 0) {
      await db.insert(portfolioTriggerEvents).values(eventRows);
      console.log(`[DemoSeed] Inserted ${eventRows.length} portfolio trigger events.`);
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. Telco Profiles + Credit Scores
// ─────────────────────────────────────────────────────────────────────────────

async function seedTelcoProfiles(): Promise<string[]> {
  const profileCount = await tableCount(telcoProfiles);
  const scoreCount = await tableCount(telcoCreditScores);
  const needProfiles = profileCount === 0;
  const needScores = scoreCount === 0;

  if (!needProfiles && !needScores) {
    console.log(`[DemoSeed] Telco profiles already seeded (${profileCount} profiles, ${scoreCount} scores) — skipping.`);
    const rows = await db.select({ id: telcoProfiles.id }).from(telcoProfiles).limit(20);
    return rows.map(r => r.id);
  }

  const ghBorrowers = await getGhanaBorrowers();
  const orgs = await getOrgs();
  const simOrgId = orgs.find(o => o.slug === "sim")?.id ?? orgs[0]?.id ?? null;

  type TelcoProvider = "mtn" | "vodafone" | "airtel";
  type KycLevel = "none" | "basic" | "standard" | "full";
  type RiskTier = "very_low" | "low" | "medium" | "high" | "very_high";

  const PROVIDERS: TelcoProvider[] = ["mtn", "vodafone", "airtel"];
  const KYC_LEVELS: KycLevel[] = ["basic", "standard", "full"];
  const RISK_TIERS: RiskTier[] = ["very_low", "low", "medium", "high", "very_high"];
  const DEVICE_TYPES = ["smartphone", "feature_phone", "tablet", "basic_phone"] as const;

  // Real Ghanaian MSISDN prefixes — AirtelTigo includes +23326/+23356 (old Tigo)
  // and +23327/+23357 (old Airtel), combined after the 2017 merger.
  const msnPrefixes: Record<TelcoProvider, string[]> = {
    mtn:      ["+23324", "+23354"],
    vodafone: ["+23320", "+23350"],
    airtel:   ["+23326", "+23327", "+23356", "+23357"],
  };

  // Step 1: Build and insert profiles (if needed), then resolve the IDs to use
  // for credit score generation regardless of which path was taken.
  let allProfileIds: string[];

  if (needProfiles) {
    const profileRows: Array<{
      id: string;
      borrowerId: string | null;
      msisdn: string;
      provider: TelcoProvider;
      country: string;
      simRegistrationDate: string;
      kycLevel: KycLevel;
      deviceType: string;
      deviceChanges90d: number;
      accountStatus: string;
      consentGranted: boolean;
      consentDate: Date | null;
      organizationId: string | null;
    }> = [];

    for (let i = 0; i < 20; i++) {
      const profileId = randomUUID();
      const provider = PROVIDERS[i % 3];
      const prefix = pick(msnPrefixes[provider]);
      const msisdn = `${prefix}${String(rand(10000000, 99999999))}`;
      const borrowerId = i < ghBorrowers.length ? ghBorrowers[i].id : null;
      const kycLevel = pick(KYC_LEVELS);
      const consentGranted = Math.random() > 0.25;
      const consentDate = consentGranted ? daysAgo(rand(10, 180)) : null;

      profileRows.push({
        id: profileId,
        borrowerId,
        msisdn,
        provider,
        country: "Ghana",
        simRegistrationDate: daysAgo(rand(30, 1460)).toISOString().slice(0, 10),
        kycLevel,
        deviceType: pick(DEVICE_TYPES),
        deviceChanges90d: rand(0, 3),
        accountStatus: Math.random() > 0.1 ? "active" : "suspended",
        consentGranted,
        consentDate,
        organizationId: simOrgId,
      });
    }

    await db.insert(telcoProfiles).values(profileRows);
    console.log(`[DemoSeed] Inserted ${profileRows.length} telco profiles.`);
    allProfileIds = profileRows.map(p => p.id);
  } else {
    // Profiles exist — load their IDs so we can back-fill missing credit scores
    const rows = await db.select({ id: telcoProfiles.id }).from(telcoProfiles).limit(20);
    allProfileIds = rows.map(r => r.id);
    console.log(`[DemoSeed] Telco profiles already seeded (${profileCount}) — loading IDs for score back-fill.`);
  }

  // Step 2: Build and insert credit scores (if needed)
  if (needScores && allProfileIds.length > 0) {
    const scoreRows = allProfileIds.map((profileId, i) => {
      const borrowerId = i < ghBorrowers.length ? ghBorrowers[i].id : null;
      const riskTierIdx = Math.min(Math.floor(rand(0, 4)), 4);
      const riskTier = RISK_TIERS[riskTierIdx];
      const riskScore =
        riskTierIdx === 0 ? rand(720, 850) :
        riskTierIdx === 1 ? rand(640, 719) :
        riskTierIdx === 2 ? rand(540, 639) :
        riskTierIdx === 3 ? rand(420, 539) :
        rand(300, 419);
      const creditLimit = riskTierIdx <= 1 ? rand(500, 5000) : riskTierIdx === 2 ? rand(100, 499) : rand(50, 99);
      return {
        profileId,
        borrowerId,
        riskTier,
        riskScore,
        creditLimit: String(creditLimit),
        currency: "GHS",
        approvalRecommendation: riskTierIdx <= 2,
        reasonCode: riskTierIdx <= 2 ? "SCORE_WITHIN_BAND" : "SCORE_BELOW_THRESHOLD",
        detailedRationale:
          riskTierIdx <= 1 ? "Strong mobile money activity, consistent recharge pattern, no dormancy, low device churn." :
          riskTierIdx === 2 ? "Moderate MoMo activity. Occasional dormancy periods. Marginal approval." :
          "Insufficient mobile money activity. High dormancy. Score below minimum threshold.",
        evaluationPeriodDays: 90,
        kpiSnapshot: JSON.stringify({
          avgArpu: rand(5, 80),
          rechargeFrequency: rand(3, 30),
          momoTxCount: rand(2, 150),
          dormancyDays: riskTierIdx >= 3 ? rand(20, 45) : rand(0, 10),
          walletRetentionPct: rand(20, 95),
          utilityPayments: rand(0, 8),
        }),
        country: "Ghana",
        organizationId: simOrgId,
      };
    });

    await db.insert(telcoCreditScores).values(scoreRows);
    console.log(`[DemoSeed] Inserted ${scoreRows.length} telco credit scores.`);
  }

  return allProfileIds;
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. Telco Demo Loans (~15 focused micro-loans with repayment history)
// ─────────────────────────────────────────────────────────────────────────────

async function seedTelcoDemoLoans(profileIds: string[]) {
  const existing = await tableCount(telcoLoans);
  if (existing > 0) {
    console.log(`[DemoSeed] Telco loans already seeded (${existing}) — skipping.`);
    return;
  }

  if (profileIds.length === 0) {
    console.log("[DemoSeed] No profile IDs — skipping telco loan seed.");
    return;
  }

  const orgs = await getOrgs();
  const simOrgId = orgs.find(o => o.slug === "sim")?.id ?? null;

  type LoanStatus = "pending_disbursement" | "disbursed" | "active" | "repaying" | "paid_off" | "defaulted";
  type DisbursementStatus = "pending" | "processing" | "confirmed" | "failed";
  type RepaymentStatus = "scheduled" | "paid" | "partial" | "missed" | "overdue";

  interface LoanScenario {
    status: LoanStatus;
    disbursementStatus: DisbursementStatus;
    amount: number;
    tenorDays: number;
    interestRate: number;
    daysAgoCreated: number;
  }

  const SCENARIOS: LoanScenario[] = [
    { status: "paid_off",            disbursementStatus: "confirmed", amount: 250,  tenorDays: 7,  interestRate: 5.00, daysAgoCreated: 60 },
    { status: "paid_off",            disbursementStatus: "confirmed", amount: 500,  tenorDays: 14, interestRate: 4.50, daysAgoCreated: 45 },
    { status: "paid_off",            disbursementStatus: "confirmed", amount: 150,  tenorDays: 7,  interestRate: 5.00, daysAgoCreated: 90 },
    { status: "active",              disbursementStatus: "confirmed", amount: 400,  tenorDays: 30, interestRate: 8.00, daysAgoCreated: 10 },
    { status: "active",              disbursementStatus: "confirmed", amount: 1200, tenorDays: 30, interestRate: 7.50, daysAgoCreated: 15 },
    { status: "repaying",            disbursementStatus: "confirmed", amount: 800,  tenorDays: 60, interestRate: 9.00, daysAgoCreated: 40 },
    { status: "repaying",            disbursementStatus: "confirmed", amount: 600,  tenorDays: 30, interestRate: 8.50, daysAgoCreated: 20 },
    { status: "disbursed",           disbursementStatus: "confirmed", amount: 300,  tenorDays: 14, interestRate: 5.00, daysAgoCreated: 5  },
    { status: "disbursed",           disbursementStatus: "confirmed", amount: 750,  tenorDays: 30, interestRate: 7.00, daysAgoCreated: 3  },
    { status: "pending_disbursement",disbursementStatus: "pending",   amount: 500,  tenorDays: 30, interestRate: 7.00, daysAgoCreated: 1  },
    { status: "defaulted",           disbursementStatus: "confirmed", amount: 900,  tenorDays: 30, interestRate: 9.00, daysAgoCreated: 120 },
    { status: "defaulted",           disbursementStatus: "confirmed", amount: 200,  tenorDays: 14, interestRate: 5.00, daysAgoCreated: 75 },
    { status: "active",              disbursementStatus: "confirmed", amount: 450,  tenorDays: 30, interestRate: 8.00, daysAgoCreated: 8  },
    { status: "paid_off",            disbursementStatus: "confirmed", amount: 100,  tenorDays: 7,  interestRate: 5.00, daysAgoCreated: 30 },
    { status: "repaying",            disbursementStatus: "confirmed", amount: 650,  tenorDays: 60, interestRate: 9.00, daysAgoCreated: 25 },
  ];

  const loanRows: Array<{
    id: string;
    profileId: string;
    loanAmount: string;
    currency: string;
    interestRate: string;
    fees: string;
    totalRepayable: string;
    amountRepaid: string;
    outstandingBalance: string;
    status: LoanStatus;
    disbursementStatus: DisbursementStatus;
    disbursementChannel: string;
    disbursedAt: Date | null;
    tenorDays: number;
    dueDate: Date | null;
    daysInArrears: number;
    repaymentFrequency: string;
    country: string;
    organizationId: string | null;
    createdAt: Date;
  }> = [];

  const repaymentRows: Array<{
    loanId: string;
    profileId: string;
    amountDue: string;
    amountPaid: string;
    currency: string;
    country: string;
    paymentMethod: string;
    status: RepaymentStatus;
    installmentNumber: number;
    dueDate: Date;
    paidAt: Date | null;
    daysLate: number;
    createdAt: Date;
  }> = [];

  for (let i = 0; i < SCENARIOS.length; i++) {
    const s = SCENARIOS[i];
    const profileId = profileIds[i % profileIds.length];
    const loanId = randomUUID();
    const createdAt = daysAgo(s.daysAgoCreated);
    const totalRepayable = Math.round(s.amount * (1 + s.interestRate / 100));
    const disbursedAt = s.status !== "pending_disbursement" ? new Date(createdAt.getTime() + 86400000) : null;
    const dueDate = disbursedAt ? new Date(disbursedAt.getTime() + s.tenorDays * 86400000) : null;

    let amountRepaid = 0;
    if (s.status === "paid_off") amountRepaid = totalRepayable;
    else if (s.status === "repaying") amountRepaid = Math.round(totalRepayable * (rand(30, 70) / 100));
    else if (s.status === "defaulted") amountRepaid = Math.round(totalRepayable * (rand(0, 30) / 100));

    const outstanding = Math.max(0, totalRepayable - amountRepaid);
    const daysInArrears = s.status === "defaulted" ? rand(30, 90) : 0;

    loanRows.push({
      id: loanId,
      profileId,
      loanAmount: String(s.amount),
      currency: "GHS",
      interestRate: String(s.interestRate.toFixed(2)),
      fees: "0",
      totalRepayable: String(totalRepayable),
      amountRepaid: String(amountRepaid),
      outstandingBalance: String(outstanding),
      status: s.status,
      disbursementStatus: s.disbursementStatus,
      disbursementChannel: "mobile_money",
      disbursedAt,
      tenorDays: s.tenorDays,
      dueDate,
      daysInArrears,
      repaymentFrequency: "lump_sum",
      country: "Ghana",
      organizationId: simOrgId,
      createdAt,
    });

    if (amountRepaid > 0 && disbursedAt) {
      const numPayments = s.status === "paid_off" ? 1 : rand(1, 2);
      let remaining = amountRepaid;
      for (let p = 0; p < numPayments && remaining > 0; p++) {
        const payAmt = p === numPayments - 1 ? remaining : Math.round(remaining * 0.6);
        const payDate = new Date(disbursedAt.getTime() + rand(2, Math.max(3, s.tenorDays - 2)) * 86400000);
        repaymentRows.push({
          loanId,
          profileId,
          amountDue: String(payAmt),
          amountPaid: String(payAmt),
          currency: "GHS",
          country: "Ghana",
          paymentMethod: pick(["mobile_money", "bank_transfer", "agent", "auto_deduct"] as const),
          status: "paid",
          installmentNumber: p + 1,
          dueDate: payDate,
          paidAt: payDate,
          daysLate: rand(0, 3),
          createdAt: payDate,
        });
        remaining -= payAmt;
      }
    }
  }

  await db.insert(telcoLoans).values(loanRows);
  console.log(`[DemoSeed] Inserted ${loanRows.length} telco demo loans.`);

  if (repaymentRows.length > 0) {
    await db.insert(telcoLoanRepayments).values(repaymentRows);
    console.log(`[DemoSeed] Inserted ${repaymentRows.length} telco loan repayments.`);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. Loan Applications
// ─────────────────────────────────────────────────────────────────────────────

async function seedLoanApplications() {
  const existing = await tableCount(loanApplications);
  if (existing > 0) {
    console.log(`[DemoSeed] Loan applications already seeded (${existing}) — skipping.`);
    return;
  }

  const ghBorrowers = await getGhanaBorrowers();
  const orgs = await getOrgs();
  const adminUser = await getFirstSuperAdmin();

  if (ghBorrowers.length === 0 || orgs.length === 0) {
    console.log("[DemoSeed] Missing borrowers or orgs — skipping loan application seed.");
    return;
  }

  const bankOrgs = orgs.filter(o => o.type === "bank");
  if (bankOrgs.length === 0) {
    console.log("[DemoSeed] No bank orgs — skipping loan applications.");
    return;
  }

  type LoanStatus = "draft" | "submitted" | "under_review" | "approved" | "rejected" | "disbursed";

  interface AppDef {
    loanType: string;
    purpose: string;
    requestedAmount: number;
    termMonths: number;
    status: LoanStatus;
    collateralType: string | null;
    notes: string | null;
  }

  const APP_DEFS: AppDef[] = [
    { loanType: "personal_loan",     purpose: "Working capital for trading business",                  requestedAmount: 15000,  termMonths: 12, status: "draft",        collateralType: "guarantor",  notes: null },
    { loanType: "sme_loan",          purpose: "Expansion of retail shop in Kumasi",                    requestedAmount: 50000,  termMonths: 24, status: "submitted",    collateralType: "equipment",  notes: "Referred by Bank of Ghana MSME programme." },
    { loanType: "auto_loan",         purpose: "Purchase of 2024 Toyota Hilux",                         requestedAmount: 200000, termMonths: 36, status: "under_review", collateralType: "vehicle",    notes: null },
    { loanType: "mortgage",          purpose: "Land acquisition in Tema Community 18",                 requestedAmount: 350000, termMonths: 60, status: "approved",     collateralType: "real_estate",notes: null },
    { loanType: "agricultural_loan", purpose: "Agricultural input financing — maize season",           requestedAmount: 25000,  termMonths: 6,  status: "approved",     collateralType: null,         notes: "Seasonal agricultural — request aligned with planting season." },
    { loanType: "personal_loan",     purpose: "School fees and educational expenses",                  requestedAmount: 8000,   termMonths: 12, status: "rejected",     collateralType: "guarantor",  notes: null },
    { loanType: "sme_loan",          purpose: "Purchase of industrial sewing machines",                requestedAmount: 75000,  termMonths: 18, status: "disbursed",    collateralType: "equipment",  notes: null },
    { loanType: "trade_finance",     purpose: "Import financing — electronics consignment",            requestedAmount: 500000, termMonths: 6,  status: "under_review", collateralType: "receivables",notes: null },
    { loanType: "personal_loan",     purpose: "Home renovation and extension",                         requestedAmount: 30000,  termMonths: 24, status: "submitted",    collateralType: null,         notes: null },
    { loanType: "sme_loan",          purpose: "Poultry farming expansion",                             requestedAmount: 45000,  termMonths: 18, status: "approved",     collateralType: "equipment",  notes: null },
    { loanType: "personal_loan",     purpose: "Medical equipment for private clinic",                  requestedAmount: 120000, termMonths: 36, status: "disbursed",    collateralType: "equipment",  notes: null },
    { loanType: "agricultural_loan", purpose: "Restaurant equipment and fit-out",                      requestedAmount: 60000,  termMonths: 24, status: "rejected",     collateralType: null,         notes: null },
  ];

  const appRows = APP_DEFS.map((def, i) => {
    const org = bankOrgs[i % bankOrgs.length];
    const borrower = ghBorrowers[i % ghBorrowers.length];
    const approvedAmount = (def.status === "approved" || def.status === "disbursed")
      ? Math.round(def.requestedAmount * (rand(80, 100) / 100))
      : null;
    const createdAt = daysAgo(rand(5, 90));
    const checkedAt = (def.status === "approved" || def.status === "rejected" || def.status === "disbursed")
      ? new Date(createdAt.getTime() + rand(2, 7) * 86400000)
      : null;
    const disbursedAt = def.status === "disbursed"
      ? new Date((checkedAt ?? createdAt).getTime() + rand(1, 3) * 86400000)
      : null;

    return {
      applicationNumber: `LA-GH-2026-${String(i + 1).padStart(4, "0")}`,
      borrowerId: borrower.id,
      organizationId: org.id,
      loanType: def.loanType,
      purpose: def.purpose,
      requestedAmount: String(def.requestedAmount),
      approvedAmount: approvedAmount !== null ? String(approvedAmount) : null,
      currency: "GHS",
      termMonths: def.termMonths,
      interestRate: String((rand(180, 320) / 10).toFixed(4)),
      repaymentFrequency: "monthly",
      collateralType: def.collateralType,
      creditScoreAtApplication: rand(420, 780),
      status: def.status,
      makerUserId: adminUser?.id ?? null,
      checkerUserId: checkedAt ? adminUser?.id ?? null : null,
      checkerAction: def.status === "approved" ? "approved" : def.status === "rejected" ? "rejected" : null,
      checkerNotes: def.status === "rejected"
        ? "Debt-service coverage ratio below policy minimum of 1.25x."
        : def.status === "approved" ? "Application meets all credit policy criteria. Approved." : null,
      checkedAt,
      disbursedAt,
      disbursementReference: disbursedAt ? `DISBREF-${rand(100000, 999999)}` : null,
      notes: def.notes,
      createdAt,
      updatedAt: checkedAt ?? createdAt,
    };
  });

  await db.insert(loanApplications).values(appRows);
  console.log(`[DemoSeed] Inserted ${appRows.length} loan applications.`);
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. Collateral Amendment Requests
// ─────────────────────────────────────────────────────────────────────────────

async function seedCollateralAmendments() {
  const existing = await tableCount(collateralAmendmentRequests);
  if (existing > 0) {
    console.log(`[DemoSeed] Collateral amendments already seeded (${existing}) — skipping.`);
    return;
  }

  const items = await getCollateralItems();
  const adminUser = await getFirstSuperAdmin();

  if (items.length === 0 || !adminUser) {
    console.log("[DemoSeed] No collateral items or admin user — skipping amendment seed.");
    return;
  }

  type AmendmentStatus = "pending" | "approved" | "rejected";

  interface AmendmentDef {
    proposedChanges: string;
    amendmentReason: string;
    status: AmendmentStatus;
  }

  const AMENDMENT_DEFS: AmendmentDef[] = [
    { proposedChanges: '{"estimatedValue":"185000","valuationDate":"2025-04-15","valuationReport":"GV-2025-0441"}',                                              amendmentReason: "Updated independent valuation — market appreciation in Tema corridor",                                status: "pending" },
    { proposedChanges: '{"description":"2023 Nissan Navara Double Cab — registration number GR 3421-24 (previously GS 1122-22)"}',                              amendmentReason: "Vehicle registration plate changed at DVLA — update required",                                        status: "pending" },
    { proposedChanges: '{"location":"Plot 7, Block D, Ashaiman Industrial Zone, Greater Accra — corrected from Tema Free Zone"}',                               amendmentReason: "Address correction — original submission contained typographical error",                               status: "pending" },
    { proposedChanges: '{"expiryDate":"2028-12-31","extensionReason":"Borrower request — original 3-year term extended to 6 years per amended loan agreement"}', amendmentReason: "Extension agreed as part of loan restructuring",                                                        status: "approved" },
    { proposedChanges: '{"collateralType":"real_estate","description":"3-bedroom residential property at House No. B42/7, Adenta, Accra. Title deed No. LVB-2024-09123"}', amendmentReason: "Type correction — item categorised as equipment, should be real estate",                           status: "approved" },
    { proposedChanges: '{"estimatedValue":"42500","currency":"GHS","notes":"Depreciated value following insurance assessment after minor fire damage — fully repaired"}', amendmentReason: "Insurance-adjusted value post partial damage event",                                                status: "approved" },
    { proposedChanges: '{"documentReference":"TDIR-2025-GH-0089","notes":"Title deed re-registered under Land Title Registration Act — reference updated"}',    amendmentReason: "Title deed reference updated following land reform re-registration",                                   status: "rejected" },
    { proposedChanges: '{"status":"released","releaseReason":"Loan fully repaid — collateral released per settlement agreement dated 2025-03-01"}',            amendmentReason: "Loan settled — collateral to be released from registry",                                                status: "rejected" },
  ];

  const rows = AMENDMENT_DEFS.slice(0, items.length).map((def, i) => {
    const item = items[i];
    const createdAt = daysAgo(rand(5, 60));
    const reviewedAt = def.status !== "pending" ? new Date(createdAt.getTime() + rand(1, 7) * 86400000) : null;
    return {
      collateralItemId: item.id,
      requestedBy: adminUser.id,
      lenderOrganizationId: item.lenderOrganizationId,
      proposedChanges: def.proposedChanges,
      amendmentReason: def.amendmentReason,
      status: def.status,
      reviewedBy: def.status !== "pending" ? adminUser.id : null,
      reviewNotes: def.status === "approved"
        ? "Amendment verified against supporting documentation. Approved."
        : def.status === "rejected"
        ? "Insufficient supporting documentation. Please resubmit with certified valuation report."
        : null,
      reviewedAt,
      createdAt,
      updatedAt: reviewedAt ?? createdAt,
    };
  });

  await db.insert(collateralAmendmentRequests).values(rows);
  console.log(`[DemoSeed] Inserted ${rows.length} collateral amendment requests.`);
}

// ─────────────────────────────────────────────────────────────────────────────
// 7. PAPSS Settlements (~20 cross-border records)
// ─────────────────────────────────────────────────────────────────────────────

async function seedPapssSettlements() {
  const existing = await tableCount(papssSettlements);
  if (existing > 0) {
    console.log(`[DemoSeed] PAPSS settlements already seeded (${existing}) — skipping.`);
    return;
  }

  type SettlementStatus = "pending" | "completed" | "failed" | "reversed";

  interface Corridor {
    sender: string;
    senderCountry: string;
    receiver: string;
    receiverCountry: string;
    senderCcy: string;
    receiverCcy: string;
    rate: string;
    purpose: string;
    status: SettlementStatus;
  }

  // Corridors scoped to Ghana + immediate ECOWAS neighbors:
  // GH ↔ CI (Côte d'Ivoire), GH ↔ NG (Nigeria), GH ↔ SN (Senegal)
  // plus CI ↔ SN (BCEAO-zone intra-regional), with all four status values represented.
  const CORRIDORS: Corridor[] = [
    // GH → CI (7 rows)
    { sender: "GCB Bank Ltd",                 senderCountry: "Ghana",         receiver: "Société Générale CI",       receiverCountry: "Côte d'Ivoire", senderCcy: "GHS", receiverCcy: "XOF", rate: "68.2400", purpose: "Trade finance — cocoa export proceeds",              status: "completed" },
    { sender: "Fidelity Bank Ghana",          senderCountry: "Ghana",         receiver: "UBA Côte d'Ivoire",         receiverCountry: "Côte d'Ivoire", senderCcy: "GHS", receiverCcy: "XOF", rate: "68.1500", purpose: "SME supplier payment — textiles",                    status: "completed" },
    { sender: "Stanbic Bank Ghana",           senderCountry: "Ghana",         receiver: "Ecobank CI",                receiverCountry: "Côte d'Ivoire", senderCcy: "GHS", receiverCcy: "XOF", rate: "68.0900", purpose: "Agricultural commodity export settlement",           status: "completed" },
    { sender: "CalBank Ghana",                senderCountry: "Ghana",         receiver: "BNI Côte d'Ivoire",         receiverCountry: "Côte d'Ivoire", senderCcy: "GHS", receiverCcy: "XOF", rate: "68.3100", purpose: "Pharmaceutical import settlement",                   status: "pending"   },
    { sender: "National Investment Bank",     senderCountry: "Ghana",         receiver: "Société Générale CI",       receiverCountry: "Côte d'Ivoire", senderCcy: "GHS", receiverCcy: "XOF", rate: "68.2200", purpose: "Infrastructure project drawdown",                    status: "failed"    },
    // CI → GH (3 rows)
    { sender: "Société Générale CI",          senderCountry: "Côte d'Ivoire", receiver: "GCB Bank Ltd",              receiverCountry: "Ghana",          senderCcy: "XOF", receiverCcy: "GHS", rate: "0.01465", purpose: "Reverse settlement — excess clearing balance",       status: "completed" },
    { sender: "Ecobank CI",                   senderCountry: "Côte d'Ivoire", receiver: "Ecobank Ghana",             receiverCountry: "Ghana",          senderCcy: "XOF", receiverCcy: "GHS", rate: "0.01462", purpose: "Intragroup liquidity rebalancing",                   status: "reversed"  },
    { sender: "UBA Côte d'Ivoire",            senderCountry: "Côte d'Ivoire", receiver: "Fidelity Bank Ghana",       receiverCountry: "Ghana",          senderCcy: "XOF", receiverCcy: "GHS", rate: "0.01468", purpose: "Trade receivables settlement",                       status: "completed" },
    // GH → NG (4 rows)
    { sender: "Ecobank Ghana",                senderCountry: "Ghana",         receiver: "Access Bank Nigeria",        receiverCountry: "Nigeria",        senderCcy: "GHS", receiverCcy: "NGN", rate: "47.1200", purpose: "Remittance — family support",                        status: "completed" },
    { sender: "Zenith Bank Ghana",            senderCountry: "Ghana",         receiver: "First Bank Nigeria",         receiverCountry: "Nigeria",        senderCcy: "GHS", receiverCcy: "NGN", rate: "47.3300", purpose: "Education fees — tertiary institution",              status: "completed" },
    { sender: "CalBank Ghana",                senderCountry: "Ghana",         receiver: "Guaranty Trust Bank Nigeria",receiverCountry: "Nigeria",        senderCcy: "GHS", receiverCcy: "NGN", rate: "47.0800", purpose: "Consumer goods import payment",                      status: "pending"   },
    { sender: "Stanbic Bank Ghana",           senderCountry: "Ghana",         receiver: "UBA Nigeria",                receiverCountry: "Nigeria",        senderCcy: "GHS", receiverCcy: "NGN", rate: "47.2500", purpose: "Oil & gas services invoice",                        status: "failed"    },
    // NG → GH (2 rows)
    { sender: "Access Bank Nigeria",          senderCountry: "Nigeria",       receiver: "Ecobank Ghana",              receiverCountry: "Ghana",          senderCcy: "NGN", receiverCcy: "GHS", rate: "0.02121", purpose: "Diaspora remittance",                                status: "completed" },
    { sender: "First Bank Nigeria",           senderCountry: "Nigeria",       receiver: "GCB Bank Ltd",               receiverCountry: "Ghana",          senderCcy: "NGN", receiverCcy: "GHS", rate: "0.02118", purpose: "Trade corridor reverse settlement",                  status: "completed" },
    // GH → SN (4 rows)
    { sender: "Bank of Ghana",                senderCountry: "Ghana",         receiver: "Banque Centrale du Sénégal", receiverCountry: "Senegal",        senderCcy: "GHS", receiverCcy: "XOF", rate: "62.8900", purpose: "Interbank regulatory settlement",                    status: "completed" },
    { sender: "National Investment Bank",     senderCountry: "Ghana",         receiver: "BNDE Sénégal",               receiverCountry: "Senegal",        senderCcy: "GHS", receiverCcy: "XOF", rate: "62.7300", purpose: "Shea butter export settlement",                      status: "completed" },
    { sender: "GCB Bank Ltd",                 senderCountry: "Ghana",         receiver: "Diamond Bank Sénégal",       receiverCountry: "Senegal",        senderCcy: "GHS", receiverCcy: "XOF", rate: "62.9500", purpose: "Telecoms equipment import",                          status: "completed" },
    { sender: "Fidelity Bank Ghana",          senderCountry: "Ghana",         receiver: "BCEAO",                      receiverCountry: "Senegal",        senderCcy: "GHS", receiverCcy: "XOF", rate: "63.0200", purpose: "Statutory reserve transfer",                         status: "pending"   },
    // SN → GH (1 row)
    { sender: "UBA Sénégal",                  senderCountry: "Senegal",       receiver: "Bank of Ghana",              receiverCountry: "Ghana",          senderCcy: "XOF", receiverCcy: "GHS", rate: "0.01590", purpose: "Cross-border investment settlement",                 status: "completed" },
    // CI → SN intra-BCEAO (1 row)
    { sender: "Société Générale CI",          senderCountry: "Côte d'Ivoire", receiver: "BCEAO",                      receiverCountry: "Senegal",        senderCcy: "XOF", receiverCcy: "XOF", rate: "1.0000",  purpose: "BCEAO intra-zone clearing settlement",               status: "reversed"  },
  ];

  const rows = CORRIDORS.map((c, i) => {
    const senderAmount = rand(5000, 500000);
    const receiverAmount = Math.round(senderAmount * parseFloat(c.rate));
    const createdAt = daysAgo(rand(1, 120));
    const completedAt = c.status === "completed" ? new Date(createdAt.getTime() + rand(1, 4) * 3600000) : null;
    const seq = String(i + 1).padStart(6, "0");
    return {
      senderInstitution: c.sender,
      senderCountry: c.senderCountry,
      receiverInstitution: c.receiver,
      receiverCountry: c.receiverCountry,
      senderAmount: String(senderAmount),
      senderCurrency: c.senderCcy,
      receiverAmount: String(receiverAmount),
      receiverCurrency: c.receiverCcy,
      exchangeRate: c.rate,
      exchangeRateSource: "PAPSS",
      iso20022Reference: `PAPSS2026${seq}GH${rand(10000, 99999)}`,
      messageType: "pacs.008",
      status: c.status,
      purpose: c.purpose,
      completedAt,
      failureReason: c.status === "failed" ? "Receiver institution rejected: beneficiary account not found." : null,
      createdAt,
      updatedAt: completedAt ?? createdAt,
    };
  });

  await db.insert(papssSettlements).values(rows);
  console.log(`[DemoSeed] Inserted ${rows.length} PAPSS settlements.`);
}

// ─────────────────────────────────────────────────────────────────────────────
// Main entry point
// ─────────────────────────────────────────────────────────────────────────────

export async function seedDemoData() {
  console.log("[DemoSeed] Starting demo data seed…");
  try { await seedComplianceQueue(); }     catch (e) { console.error("[DemoSeed] Compliance queue error:", e); }
  try { await seedPortfolioTriggers(); }   catch (e) { console.error("[DemoSeed] Portfolio triggers error:", e); }
  let profileIds: string[] = [];
  try { profileIds = await seedTelcoProfiles(); } catch (e) { console.error("[DemoSeed] Telco profiles error:", e); }
  try { await seedTelcoDemoLoans(profileIds); }    catch (e) { console.error("[DemoSeed] Telco demo loans error:", e); }
  try { await seedLoanApplications(); }    catch (e) { console.error("[DemoSeed] Loan applications error:", e); }
  try { await seedCollateralAmendments(); }catch (e) { console.error("[DemoSeed] Collateral amendments error:", e); }
  try { await seedPapssSettlements(); }    catch (e) { console.error("[DemoSeed] PAPSS settlements error:", e); }
  console.log("[DemoSeed] Demo data seed complete.");
}
