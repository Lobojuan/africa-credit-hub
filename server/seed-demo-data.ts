/**
 * seed-demo-data.ts
 *
 * Seeds realistic Ghana-themed demo data for all pages that previously showed
 * blank tables:
 *   - Compliance Queue  (watchlist_hits + fraud_alerts)
 *   - Portfolio Triggers (portfolio_trigger_subscriptions + events)
 *   - Telco Scoring     (telco_profiles + telco_credit_scores)
 *   - Telco Lending     (telco_loans via seed-telco-lending after profiles exist)
 *   - Loan Origination  (loan_applications)
 *   - Collateral Registry amendment requests
 *   - PAPSS Settlements (top-up to ≥20 rows)
 *
 * All inserts are idempotent: each section checks its target count first.
 */

import { db } from "./db";
import {
  watchlistHits,
  fraudAlerts,
  portfolioTriggerSubscriptions,
  portfolioTriggerEvents,
  telcoProfiles,
  telcoCreditScores,
  loanApplications,
  collateralAmendmentRequests,
  papssSettlements,
  borrowers,
  organizations,
  users,
  collateralItems,
} from "@shared/schema";
import { count, eq } from "drizzle-orm";
import { randomUUID } from "crypto";

function rand(min: number, max: number) {
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
function daysFromNow(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers — look up existing FK targets
// ─────────────────────────────────────────────────────────────────────────────

async function getGhanaBorrowers() {
  return db
    .select({ id: borrowers.id, firstName: borrowers.firstName, lastName: borrowers.lastName, companyName: borrowers.companyName })
    .from(borrowers)
    .where(eq(borrowers.country, "Ghana"))
    .limit(20);
}

async function getOrgs() {
  return db.select({ id: organizations.id, slug: organizations.slug, type: organizations.type }).from(organizations).limit(10);
}

async function getSuperAdminUser() {
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
// 1. Watchlist Hits + Fraud Alerts (Compliance Queue)
// ─────────────────────────────────────────────────────────────────────────────

async function seedComplianceQueue() {
  const [{ value: hitCount }] = await db.select({ value: count() }).from(watchlistHits);
  const [{ value: alertCount }] = await db.select({ value: count() }).from(fraudAlerts);
  if (Number(hitCount) >= 8 && Number(alertCount) >= 4) {
    console.log(`[DemoSeed] Compliance queue already seeded (${hitCount} hits, ${alertCount} alerts), skipping.`);
    return;
  }

  const ghBorrowers = await getGhanaBorrowers();
  if (ghBorrowers.length === 0) {
    console.log("[DemoSeed] No Ghana borrowers found — skipping compliance seed.");
    return;
  }

  const orgs = await getOrgs();
  const bankOrg = orgs.find(o => o.type === "bank")?.id ?? null;

  const WATCHLIST_SOURCES = ["sanctions_un", "sanctions_ofac", "sanctions_eu", "pep", "adverse_media", "internal_block"] as const;
  const STATUSES = ["open", "investigating", "resolved", "false_positive", "escalated"] as const;
  const PROVIDERS = ["Refinitiv WorldCheck", "Accuity", "OFAC SDN List", "EU Consolidated List", "Internal Risk Team"];

  const hitRows: any[] = [];
  const targetBorrowers = ghBorrowers.slice(0, 10);

  const hitTemplates = [
    { source: "sanctions_un", provider: "UN Sanctions List", matchedName: "Kwame Asante", matchDetails: "Name match (85%) against UN consolidated sanctions list. Entity type: individual. Listed 2021-03-14.", score: "85.00" },
    { source: "sanctions_ofac", provider: "Refinitiv WorldCheck", matchedName: "Kofi Mensah Boateng", matchDetails: "Fuzzy name match (91%) — OFAC SDN List, designation: narcotics trafficking. DOB proximity match.", score: "91.50" },
    { source: "pep", provider: "Accuity PEP Database", matchedName: "Adjoa Asante-Antwi", matchDetails: "Politically exposed person — junior minister, Ministry of Finance, Ghana. Low-risk PEP tier 3.", score: "78.00" },
    { source: "adverse_media", provider: "Google News / LexisNexis", matchedName: "Samuel Agyei", matchDetails: "Adverse media hit: subject named in fraud investigation (Graphic Ghana, 2024-07). Case still open.", score: "72.50" },
    { source: "sanctions_eu", provider: "EU Consolidated List", matchedName: "Yaw Donkor", matchDetails: "Phonetic match (79%) against EU asset freeze list. Country of origin: Ghana. Requires manual review.", score: "79.00" },
    { source: "internal_block", provider: "Internal Risk Team", matchedName: "Gifty Osei Bonsu", matchDetails: "Internal block: previous fraud incident in 2023. Account was written off. Do not onboard.", score: "99.00" },
    { source: "sanctions_ofac", provider: "OFAC SDN List", matchedName: "Emmanuel Frimpong", matchDetails: "Possible match (68%) — entity listed for money laundering. Address proximity match only.", score: "68.00" },
    { source: "adverse_media", provider: "LexisNexis Risk", matchedName: "Felicia Asante", matchDetails: "Historical adverse media: subject linked to a cheque fraud scheme in 2022. Case closed, acquitted.", score: "60.00" },
    { source: "pep", provider: "Dow Jones Factiva", matchedName: "Livingstone Mensah", matchDetails: "Close associate of PEP — family member of former deputy minister. Enhanced due diligence required.", score: "55.00" },
    { source: "sanctions_un", provider: "UN Sanctions List", matchedName: "Martha Dankwa", matchDetails: "Name match (52%) — common Ghanaian name, likely false positive. Recommend verification.", score: "52.00" },
  ];

  for (let i = 0; i < Math.min(hitTemplates.length, targetBorrowers.length); i++) {
    const tmpl = hitTemplates[i];
    const borrower = targetBorrowers[i];
    const status = i < 3 ? "open" : i < 5 ? "investigating" : i < 7 ? "resolved" : pick(["false_positive", "escalated"]);
    hitRows.push({
      borrowerId: borrower.id,
      source: tmpl.source as any,
      provider: tmpl.provider,
      matchScore: tmpl.score,
      matchedName: tmpl.matchedName,
      matchDetails: tmpl.matchDetails,
      status: status as any,
      organizationId: bankOrg,
      createdAt: daysAgo(rand(1, 89)),
      resolvedAt: (status === "resolved" || status === "false_positive") ? daysAgo(rand(1, 10)) : null,
    });
  }

  if (hitRows.length > 0) {
    await db.insert(watchlistHits).values(hitRows);
    console.log(`[DemoSeed] Inserted ${hitRows.length} watchlist hits.`);
  }

  const FRAUD_RULE_CODES = [
    { code: "VELOCITY_001", description: "High-frequency loan applications across multiple institutions within 30 days" },
    { code: "IDENTITY_002", description: "ID document used by multiple different applicants" },
    { code: "ADDRESS_003", description: "Address linked to known fraud ring — 12+ applicants at same address" },
    { code: "COLLATERAL_004", description: "Collateral pledged simultaneously to multiple lenders" },
    { code: "SYNTHETIC_005", description: "Synthetic identity indicators — NIA ID number fails checksum validation" },
  ];
  const FRAUD_SEVERITIES = ["low", "medium", "high", "critical"] as const;
  const alertRows: any[] = [];

  for (let i = 0; i < 5 && i < targetBorrowers.length; i++) {
    const rule = FRAUD_RULE_CODES[i];
    const borrower = targetBorrowers[Math.min(i + 5, targetBorrowers.length - 1)];
    const severity = i === 0 ? "critical" : i === 1 ? "high" : i === 2 ? "medium" : "low";
    const status = i < 2 ? "open" : i === 2 ? "investigating" : i === 3 ? "resolved" : "false_positive";
    alertRows.push({
      borrowerId: borrower.id,
      ruleCode: rule.code,
      ruleDescription: rule.description,
      severity: severity as any,
      evidence: `Automated detection triggered at ${new Date(Date.now() - rand(1, 60) * 86400000).toISOString().slice(0, 10)}. ${rand(2, 12)} corroborating data points.`,
      relatedBorrowerIds: [],
      status: status as any,
      organizationId: bankOrg,
      createdAt: daysAgo(rand(1, 60)),
      resolvedAt: (status === "resolved" || status === "false_positive") ? daysAgo(rand(1, 5)) : null,
    });
  }

  if (alertRows.length > 0) {
    await db.insert(fraudAlerts).values(alertRows);
    console.log(`[DemoSeed] Inserted ${alertRows.length} fraud alerts.`);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. Portfolio Trigger Subscriptions + Events
// ─────────────────────────────────────────────────────────────────────────────

async function seedPortfolioTriggers() {
  const [{ value: subCount }] = await db.select({ value: count() }).from(portfolioTriggerSubscriptions);
  if (Number(subCount) >= 4) {
    console.log(`[DemoSeed] Portfolio triggers already seeded (${subCount} subscriptions), skipping.`);
    return;
  }

  const ghBorrowers = await getGhanaBorrowers();
  const orgs = await getOrgs();
  const adminUser = await getSuperAdminUser();

  if (ghBorrowers.length === 0 || orgs.length === 0) {
    console.log("[DemoSeed] Missing borrowers or orgs — skipping portfolio trigger seed.");
    return;
  }

  const bankOrgs = orgs.filter(o => o.type === "bank");
  const org1 = bankOrgs[0]?.id ?? orgs[0].id;
  const org2 = bankOrgs[1]?.id ?? orgs[0].id;
  const org3 = bankOrgs[2]?.id ?? orgs[0].id;

  const subscriptionTemplates = [
    { label: "Score Drop Monitor — Retail Portfolio", triggerTypes: ["score_drop", "new_judgment", "late_payment"], orgId: org1 },
    { label: "New Inquiry Tracker — SME Lending", triggerTypes: ["new_inquiry", "new_account"], orgId: org2 },
    { label: "Delinquency Alert — Housing Loans", triggerTypes: ["late_payment", "status_change", "new_judgment"], orgId: org1 },
    { label: "Full Surveillance — Top 50 Exposures", triggerTypes: ["score_drop", "new_inquiry", "new_account", "status_change", "new_judgment", "late_payment"], orgId: org3 },
    { label: "Account Opening Monitor", triggerTypes: ["new_account", "new_inquiry"], orgId: org2 },
  ];

  const subIds: string[] = [];

  for (let i = 0; i < subscriptionTemplates.length && i < ghBorrowers.length; i++) {
    const tmpl = subscriptionTemplates[i];
    const borrower = ghBorrowers[i];
    const [inserted] = await db
      .insert(portfolioTriggerSubscriptions)
      .values({
        organizationId: tmpl.orgId,
        borrowerId: borrower.id,
        triggerTypes: tmpl.triggerTypes,
        status: "active",
        label: tmpl.label,
        createdBy: adminUser?.id ?? null,
        createdAt: daysAgo(rand(30, 180)),
        updatedAt: daysAgo(rand(1, 29)),
      })
      .returning({ id: portfolioTriggerSubscriptions.id });
    subIds.push(inserted.id);
  }

  console.log(`[DemoSeed] Inserted ${subIds.length} portfolio trigger subscriptions.`);

  const EVENT_TYPES = ["score_drop", "new_inquiry", "new_account", "late_payment", "new_judgment", "status_change"];
  const eventRows: any[] = [];

  for (let s = 0; s < subIds.length; s++) {
    const subId = subIds[s];
    const borrower = ghBorrowers[s];
    const tmpl = subscriptionTemplates[s];
    const numEvents = rand(2, 5);

    for (let e = 0; e < numEvents; e++) {
      const eventType = pick(tmpl.triggerTypes as string[]);
      const firedAt = daysAgo(rand(1, 60));

      let eventData: Record<string, any> = {};
      if (eventType === "score_drop") {
        eventData = { previousScore: rand(550, 680), newScore: rand(400, 549), drop: rand(30, 130), reason: "Missed payment reported by GCB Bank" };
      } else if (eventType === "new_inquiry") {
        eventData = { inquiringOrg: pick(["GCB Bank", "Ecobank Ghana", "Fidelity Bank", "Zenith Bank"]), purpose: "loan_application", inquiryDate: firedAt.toISOString().slice(0, 10) };
      } else if (eventType === "new_account") {
        eventData = { accountType: pick(["personal_loan", "overdraft", "mortgage", "auto_loan"]), lender: pick(["Bank of Ghana", "GCB Bank", "Ecobank Ghana"]), limit: rand(5000, 100000), currency: "GHS" };
      } else if (eventType === "late_payment") {
        eventData = { daysLate: rand(1, 90), accountType: "personal_loan", creditor: pick(["GCB Bank", "Ecobank Ghana"]), amountOverdue: rand(500, 15000), currency: "GHS" };
      } else if (eventType === "new_judgment") {
        eventData = { court: pick(["Accra High Court", "Kumasi District Court"]), caseRef: `GH-${rand(1000, 9999)}-2024`, amount: rand(10000, 200000), currency: "GHS", judgmentDate: firedAt.toISOString().slice(0, 10) };
      } else {
        eventData = { from: pick(["active", "performing"]), to: pick(["non_performing", "watch_list", "substandard"]), changedBy: "System" };
      }

      eventRows.push({
        subscriptionId: subId,
        organizationId: tmpl.orgId,
        borrowerId: borrower.id,
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

// ─────────────────────────────────────────────────────────────────────────────
// 3. Telco Profiles + Credit Scores
// ─────────────────────────────────────────────────────────────────────────────

async function seedTelcoProfiles() {
  const [{ value: existing }] = await db.select({ value: count() }).from(telcoProfiles);
  if (Number(existing) >= 15) {
    console.log(`[DemoSeed] Telco profiles already seeded (${existing}), skipping.`);
    return;
  }

  const ghBorrowers = await getGhanaBorrowers();
  const orgs = await getOrgs();
  const simOrgId = orgs.find(o => o.slug === "sim")?.id ?? orgs[0]?.id ?? null;

  type TelcoProvider = "mtn" | "vodafone" | "airtel";
  const PROVIDERS: TelcoProvider[] = ["mtn", "vodafone", "airtel"];
  const KYC_LEVELS = ["basic", "standard", "full"] as const;
  const RISK_TIERS = ["very_low", "low", "medium", "high", "very_high"] as const;
  const DEVICE_TYPES = ["smartphone", "feature_phone", "tablet", "basic_phone"];

  // Real Ghanaian MSISDN prefixes: MTN +233 24/54, Vodafone +233 20/50, AirtelTigo +233 27/57
  const msnPrefixes: Record<TelcoProvider, string[]> = {
    mtn: ["+233 24", "+233 54"],
    vodafone: ["+233 20", "+233 50"],
    airtel: ["+233 27", "+233 57"],
  };

  const profiles: any[] = [];
  const scores: any[] = [];

  for (let i = 0; i < 20; i++) {
    const profileId = randomUUID();
    const provider = PROVIDERS[i % 3];
    const prefix = pick(msnPrefixes[provider]);
    const msisdn = `${prefix} ${rand(1000, 9999)} ${rand(1000, 9999)}`.replace(/ /g, "");
    const borrower = i < ghBorrowers.length ? ghBorrowers[i] : null;
    const kycLevel = pick(KYC_LEVELS);
    const simAgeDays = rand(30, 1460);
    const consentGranted = Math.random() > 0.25;
    const consentDate = consentGranted ? daysAgo(rand(10, 180)) : null;

    profiles.push({
      id: profileId,
      borrowerId: borrower?.id ?? null,
      msisdn,
      provider,
      country: "Ghana",
      simRegistrationDate: daysAgo(simAgeDays).toISOString().slice(0, 10),
      kycLevel,
      deviceType: pick(DEVICE_TYPES),
      deviceChanges90d: rand(0, 3),
      accountStatus: Math.random() > 0.1 ? "active" : "suspended",
      consentGranted,
      consentDate,
      organizationId: simOrgId,
    });

    const riskTierIdx = Math.min(Math.floor(rand(0, 4)), RISK_TIERS.length - 1);
    const riskTier = RISK_TIERS[riskTierIdx];
    const riskScore = riskTierIdx === 0 ? rand(720, 850) : riskTierIdx === 1 ? rand(640, 719) : riskTierIdx === 2 ? rand(540, 639) : riskTierIdx === 3 ? rand(420, 539) : rand(300, 419);
    const creditLimit = riskTierIdx <= 1 ? rand(500, 5000) : riskTierIdx === 2 ? rand(100, 499) : rand(50, 99);

    scores.push({
      profileId,
      borrowerId: borrower?.id ?? null,
      riskTier,
      riskScore,
      creditLimit: String(creditLimit),
      currency: "GHS",
      approvalRecommendation: riskTierIdx <= 2,
      reasonCode: riskTierIdx <= 2 ? "SCORE_WITHIN_BAND" : "SCORE_BELOW_THRESHOLD",
      detailedRationale: riskTierIdx <= 1
        ? "Strong mobile money activity, consistent recharge pattern, no dormancy, low device churn."
        : riskTierIdx === 2
        ? "Moderate MoMo activity. Occasional dormancy periods. Marginal approval."
        : "Insufficient mobile money activity. High dormancy. Score below minimum threshold.",
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
    });
  }

  await db.insert(telcoProfiles).values(profiles);
  console.log(`[DemoSeed] Inserted ${profiles.length} telco profiles.`);

  await db.insert(telcoCreditScores).values(scores);
  console.log(`[DemoSeed] Inserted ${scores.length} telco credit scores.`);
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. Loan Applications
// ─────────────────────────────────────────────────────────────────────────────

async function seedLoanApplications() {
  const [{ value: existing }] = await db.select({ value: count() }).from(loanApplications);
  if (Number(existing) >= 10) {
    console.log(`[DemoSeed] Loan applications already seeded (${existing}), skipping.`);
    return;
  }

  const ghBorrowers = await getGhanaBorrowers();
  const orgs = await getOrgs();
  const adminUser = await getSuperAdminUser();

  if (ghBorrowers.length === 0 || orgs.length === 0) {
    console.log("[DemoSeed] Missing borrowers or orgs — skipping loan application seed.");
    return;
  }

  const bankOrgs = orgs.filter(o => o.type === "bank");
  if (bankOrgs.length === 0) {
    console.log("[DemoSeed] No bank orgs — skipping loan applications.");
    return;
  }

  const LOAN_TYPES = ["personal_loan", "sme_loan", "mortgage", "auto_loan", "agricultural_loan", "trade_finance"];
  const PURPOSES = [
    "Working capital for trading business",
    "Purchase of 2024 Toyota Hilux",
    "Land acquisition in Tema Community 18",
    "Expansion of retail shop in Kumasi",
    "Agricultural input financing — maize season",
    "School fees and educational expenses",
    "Medical equipment for private clinic",
    "Purchase of industrial sewing machines",
    "Import financing — electronics consignment",
    "Home renovation and extension",
    "Poultry farming expansion",
    "Restaurant equipment and fit-out",
  ];
  const STATUSES = ["draft", "submitted", "under_review", "approved", "rejected", "disbursed"] as const;

  const apps: any[] = [];

  for (let i = 0; i < 12 && i < ghBorrowers.length; i++) {
    const borrower = ghBorrowers[i];
    const org = bankOrgs[i % bankOrgs.length];
    const status = STATUSES[Math.min(i, STATUSES.length - 1)];
    const requestedAmount = pick([15000, 25000, 50000, 75000, 100000, 200000, 350000, 500000]);
    const approvedAmount = (status === "approved" || status === "disbursed") ? Math.round(requestedAmount * (rand(75, 100) / 100)) : null;
    const termMonths = pick([6, 12, 18, 24, 36, 60]);
    const createdAt = daysAgo(rand(3, 90));
    const checkedAt = (status === "approved" || status === "rejected" || status === "disbursed") ? new Date(createdAt.getTime() + rand(1, 5) * 86400000) : null;
    const disbursedAt = status === "disbursed" ? new Date((checkedAt ?? createdAt).getTime() + rand(1, 3) * 86400000) : null;
    const appNum = `LA-GH-${new Date().getFullYear()}-${String(i + 1).padStart(4, "0")}`;

    apps.push({
      applicationNumber: appNum,
      borrowerId: borrower.id,
      organizationId: org.id,
      loanType: LOAN_TYPES[i % LOAN_TYPES.length],
      purpose: PURPOSES[i % PURPOSES.length],
      requestedAmount: String(requestedAmount),
      approvedAmount: approvedAmount ? String(approvedAmount) : null,
      currency: "GHS",
      termMonths,
      interestRate: String((rand(180, 320) / 10).toFixed(4)),
      repaymentFrequency: pick(["monthly", "quarterly", "bi-weekly"]),
      collateralType: pick(["vehicle", "real_estate", "equipment", "guarantor", null]),
      creditScoreAtApplication: rand(400, 780),
      status,
      makerUserId: adminUser?.id ?? null,
      checkerUserId: checkedAt ? adminUser?.id ?? null : null,
      checkerAction: status === "approved" ? "approved" : status === "rejected" ? "rejected" : null,
      checkerNotes: status === "rejected" ? "Debt-service coverage ratio below policy minimum of 1.25x." : status === "approved" ? "Application meets all credit policy criteria. Approved." : null,
      checkedAt,
      disbursedAt,
      disbursementReference: disbursedAt ? `DISBREF-${rand(100000, 999999)}` : null,
      notes: i === 1 ? "Referred by Bank of Ghana MSME programme." : i === 4 ? "Seasonal agricultural — request aligned with planting season." : null,
      createdAt,
      updatedAt: checkedAt ?? createdAt,
    });
  }

  await db.insert(loanApplications).values(apps);
  console.log(`[DemoSeed] Inserted ${apps.length} loan applications.`);
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. Collateral Amendment Requests
// ─────────────────────────────────────────────────────────────────────────────

async function seedCollateralAmendments() {
  const [{ value: existing }] = await db.select({ value: count() }).from(collateralAmendmentRequests);
  if (Number(existing) >= 6) {
    console.log(`[DemoSeed] Collateral amendments already seeded (${existing}), skipping.`);
    return;
  }

  const items = await getCollateralItems();
  const adminUser = await getSuperAdminUser();

  if (items.length === 0 || !adminUser) {
    console.log("[DemoSeed] No collateral items or admin user — skipping amendment seed.");
    return;
  }

  const PROPOSED_CHANGES = [
    '{"estimatedValue":"185000","valuationDate":"2025-04-15","valuationReport":"GV-2025-0441"}',
    '{"description":"2023 Nissan Navara Double Cab — registration number GR 3421-24 (previously GS 1122-22)"}',
    '{"location":"Plot 7, Block D, Ashaiman Industrial Zone, Greater Accra — corrected from Tema Free Zone"}',
    '{"expiryDate":"2028-12-31","extensionReason":"Borrower request — original 3-year term extended to 6 years per amended loan agreement"}',
    '{"collateralType":"real_estate","description":"3-bedroom residential property at House No. B42/7, Adenta, Accra. Title deed No. LVB-2024-09123"}',
    '{"estimatedValue":"42500","currency":"GHS","notes":"Depreciated value following insurance assessment after minor fire damage — fully repaired"}',
    '{"documentReference":"TDIR-2025-GH-0089","notes":"Title deed re-registered under new Land Title Registration Act — reference updated"}',
    '{"status":"released","releaseReason":"Loan fully repaid — collateral released per settlement agreement dated 2025-03-01"}',
  ];

  const AMENDMENT_REASONS = [
    "Updated independent valuation — market appreciation in Tema corridor",
    "Vehicle registration plate changed at DVLA — update required",
    "Address correction — original submission contained typographical error",
    "Extension agreed as part of loan restructuring",
    "Type correction — item was categorised as equipment, should be real estate",
    "Insurance-adjusted value post partial damage event",
    "Title deed reference updated following land reform re-registration",
    "Loan settled — collateral to be released from registry",
  ];

  const STATUSES = ["pending", "approved", "rejected"] as const;

  const rows: any[] = [];
  for (let i = 0; i < Math.min(8, items.length); i++) {
    const item = items[i];
    const status = i < 3 ? "pending" : i < 6 ? "approved" : "rejected";
    const createdAt = daysAgo(rand(5, 60));
    const reviewedAt = status !== "pending" ? new Date(createdAt.getTime() + rand(1, 7) * 86400000) : null;
    rows.push({
      collateralItemId: item.id,
      requestedBy: adminUser.id,
      lenderOrganizationId: item.lenderOrganizationId,
      proposedChanges: PROPOSED_CHANGES[i % PROPOSED_CHANGES.length],
      amendmentReason: AMENDMENT_REASONS[i % AMENDMENT_REASONS.length],
      status,
      reviewedBy: status !== "pending" ? adminUser.id : null,
      reviewNotes: status === "approved" ? "Amendment verified against supporting documentation. Approved." : status === "rejected" ? "Insufficient supporting documentation provided. Please resubmit with certified valuation report." : null,
      reviewedAt,
      createdAt,
      updatedAt: reviewedAt ?? createdAt,
    });
  }

  await db.insert(collateralAmendmentRequests).values(rows);
  console.log(`[DemoSeed] Inserted ${rows.length} collateral amendment requests.`);
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. PAPSS Settlements (top-up to ≥ 20)
// ─────────────────────────────────────────────────────────────────────────────

async function seedPapssSettlements() {
  const [{ value: existing }] = await db.select({ value: count() }).from(papssSettlements);
  if (Number(existing) >= 18) {
    console.log(`[DemoSeed] PAPSS settlements already seeded (${existing}), skipping.`);
    return;
  }

  const CORRIDORS = [
    { sender: "GCB Bank Ltd", senderCountry: "Ghana", receiver: "Société Générale CI", receiverCountry: "Côte d'Ivoire", senderCcy: "GHS", receiverCcy: "XOF", rate: "68.2400", purpose: "Trade finance — cocoa export proceeds" },
    { sender: "Ecobank Ghana", senderCountry: "Ghana", receiver: "Access Bank Nigeria", receiverCountry: "Nigeria", senderCcy: "GHS", receiverCcy: "NGN", rate: "47.1200", purpose: "Remittance — family support" },
    { sender: "Bank of Ghana", senderCountry: "Ghana", receiver: "Banque Centrale du Sénégal", receiverCountry: "Senegal", senderCcy: "GHS", receiverCcy: "XOF", rate: "62.8900", purpose: "Interbank regulatory settlement" },
    { sender: "Fidelity Bank Ghana", senderCountry: "Ghana", receiver: "UBA Côte d'Ivoire", receiverCountry: "Côte d'Ivoire", senderCcy: "GHS", receiverCcy: "XOF", rate: "68.1500", purpose: "SME supplier payment" },
    { sender: "Zenith Bank Ghana", senderCountry: "Ghana", receiver: "First Bank Nigeria", receiverCountry: "Nigeria", senderCcy: "GHS", receiverCcy: "NGN", rate: "47.3300", purpose: "Education fees — tertiary institution" },
    { sender: "Standard Chartered Ghana", senderCountry: "Ghana", receiver: "Attijari Bank Maroc", receiverCountry: "Morocco", senderCcy: "GHS", receiverCcy: "MAD", rate: "2.8400", purpose: "Import financing — leather goods" },
    { sender: "Société Générale CI", senderCountry: "Côte d'Ivoire", receiver: "GCB Bank Ltd", receiverCountry: "Ghana", senderCcy: "XOF", receiverCcy: "GHS", rate: "0.01465", purpose: "Reverse settlement — excess clearing balance" },
    { sender: "Access Bank Nigeria", senderCountry: "Nigeria", receiver: "Ecobank Ghana", receiverCountry: "Ghana", senderCcy: "NGN", receiverCcy: "GHS", rate: "0.02121", purpose: "Diaspora remittance" },
    { sender: "UBA Senegal", senderCountry: "Senegal", receiver: "Bank of Ghana", receiverCountry: "Ghana", senderCcy: "XOF", receiverCcy: "GHS", rate: "0.01590", purpose: "Cross-border investment settlement" },
    { sender: "Ecobank Ghana", senderCountry: "Ghana", receiver: "Ecobank Burkina Faso", receiverCountry: "Burkina Faso", senderCcy: "GHS", receiverCcy: "XOF", rate: "68.4200", purpose: "Intragroup liquidity transfer" },
    { sender: "National Investment Bank Ghana", senderCountry: "Ghana", receiver: "BNDE Sénégal", receiverCountry: "Senegal", senderCcy: "GHS", receiverCcy: "XOF", rate: "62.7300", purpose: "Infrastructure project drawdown" },
    { sender: "Agricultural Development Bank", senderCountry: "Ghana", receiver: "Banque Agricole Mali", receiverCountry: "Mali", senderCcy: "GHS", receiverCcy: "XOF", rate: "63.1100", purpose: "Shea butter export settlement" },
    { sender: "CalBank Ghana", senderCountry: "Ghana", receiver: "Guaranty Trust Bank Nigeria", receiverCountry: "Nigeria", senderCcy: "GHS", receiverCcy: "NGN", rate: "47.0800", purpose: "Consumer goods import payment" },
    { sender: "GCB Bank Ltd", senderCountry: "Ghana", receiver: "Rawbank DRC", receiverCountry: "DRC", senderCcy: "GHS", receiverCcy: "CDF", rate: "82.4500", purpose: "Mining equipment financing" },
    { sender: "Stanbic Bank Ghana", senderCountry: "Ghana", receiver: "Stanbic Bank Kenya", receiverCountry: "Kenya", senderCcy: "GHS", receiverCcy: "KES", rate: "9.7200", purpose: "Tech services invoice settlement" },
    { sender: "Ecobank Ghana", senderCountry: "Ghana", receiver: "Ecobank Rwanda", receiverCountry: "Rwanda", senderCcy: "GHS", receiverCcy: "RWF", rate: "77.6800", purpose: "Tourism services payment" },
    { sender: "Bank of Ghana", senderCountry: "Ghana", receiver: "Banque de France / BCEAO", receiverCountry: "Senegal", senderCcy: "GHS", receiverCcy: "XOF", rate: "63.0200", purpose: "Statutory reserve transfer" },
    { sender: "Fidelity Bank Ghana", senderCountry: "Ghana", receiver: "BNI Côte d'Ivoire", receiverCountry: "Côte d'Ivoire", senderCcy: "GHS", receiverCcy: "XOF", rate: "68.0900", purpose: "Pharmaceutical import settlement" },
  ];

  const STATUSES = ["completed", "completed", "completed", "pending", "failed"] as const;

  const rows: any[] = [];
  for (let i = 0; i < CORRIDORS.length; i++) {
    const c = CORRIDORS[i];
    const status = STATUSES[i % STATUSES.length];
    const senderAmount = rand(5000, 500000);
    const receiverAmount = Math.round(senderAmount * parseFloat(c.rate));
    const createdAt = daysAgo(rand(1, 120));
    const completedAt = status === "completed" ? new Date(createdAt.getTime() + rand(1, 4) * 3600000) : null;
    const seq = String(i + 1).padStart(6, "0");
    const iso20022Ref = `PAPSS${new Date().getFullYear()}${seq}GH${rand(10000, 99999)}`;
    rows.push({
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
      iso20022Reference: iso20022Ref,
      messageType: "pacs.008",
      status: status as any,
      purpose: c.purpose,
      completedAt,
      failureReason: status === "failed" ? "Receiver institution rejected: beneficiary account not found." : null,
      createdAt,
      updatedAt: completedAt ?? createdAt,
    });
  }

  await db.insert(papssSettlements).values(rows);
  console.log(`[DemoSeed] Inserted ${rows.length} PAPSS settlements.`);
}

// ─────────────────────────────────────────────────────────────────────────────
// Main entry point
// ─────────────────────────────────────────────────────────────────────────────

export async function seedDemoData() {
  console.log("[DemoSeed] Starting demo data seed…");
  try { await seedComplianceQueue(); } catch (e) { console.error("[DemoSeed] Compliance queue error:", e); }
  try { await seedPortfolioTriggers(); } catch (e) { console.error("[DemoSeed] Portfolio triggers error:", e); }
  try { await seedTelcoProfiles(); } catch (e) { console.error("[DemoSeed] Telco profiles error:", e); }
  try { await seedLoanApplications(); } catch (e) { console.error("[DemoSeed] Loan applications error:", e); }
  try { await seedCollateralAmendments(); } catch (e) { console.error("[DemoSeed] Collateral amendments error:", e); }
  try { await seedPapssSettlements(); } catch (e) { console.error("[DemoSeed] PAPSS settlements error:", e); }
  console.log("[DemoSeed] Demo data seed complete.");
}
