/**
 * Seed demo data for the Cross-Product Bridge — pan-African.
 * - 10 merchants across 7 African countries (CI, NG, KE, GH, SN, RW, ZA)
 *   demonstrating that Loto Fiscal / Verified Receipts works continent-wide.
 * - 6 months of receipts each, in each country's own currency.
 * - Roughly half the merchants opted in to share with the credit bureau.
 * - A demo consumer with spending insights (linked to Ivorian merchants for
 *   continuity with existing demo flows).
 */

import { db } from "./db";
import { eq, and, isNull, gte, sql } from "drizzle-orm";
import {
  lotoMerchants, lotoReceipts, crossProductConsents, borrowers, users,
  collateralItems, creditInquiries,
} from "@shared/schema";
import { getTaxAuthorityProfile } from "@shared/tax-authority";
import { syncMerchantReceiptsToAlternativeData, DEFAULT_CONSENT_DURATION_MONTHS } from "./cross-product-gateway";
import { isGhanaMode } from "./country-mode";

interface MerchantSeed {
  countryCode: string;        // ISO-2 — currency + tax authority derived
  shopName: string;
  ownerName: string;
  city: string;
  category: string;
  vat: string;                // Local VAT registration number (display only)
  optIn: boolean;
  baseReceiptsPerMonth: number;
  baseAmount: number;         // Average receipt value in local currency
  trendUp: boolean;           // True for growing, false for declining
}

const MERCHANT_SEEDS: MerchantSeed[] = [
  // ── Côte d'Ivoire — original Loto Fiscal home ────────────────────────────
  { countryCode: "CI", shopName: "Boutique Akwaba",         ownerName: "Aminata Koné",       city: "Abidjan",     category: "general",     vat: "CI-VAT-001", optIn: true,  baseReceiptsPerMonth: 60, baseAmount: 3500,    trendUp: true  },
  { countryCode: "CI", shopName: "Marché Treichville",      ownerName: "Youssouf Bamba",     city: "Abidjan",     category: "food",        vat: "CI-VAT-002", optIn: true,  baseReceiptsPerMonth: 45, baseAmount: 2200,    trendUp: true  },
  { countryCode: "CI", shopName: "Pharmacie du Plateau",    ownerName: "Dr Aïcha Diallo",    city: "Abidjan",     category: "pharmacy",    vat: "CI-VAT-003", optIn: false, baseReceiptsPerMonth: 18, baseAmount: 12000,   trendUp: true  },

  // ── Nigeria — FIRS / Verified Receipts ───────────────────────────────────
  { countryCode: "NG", shopName: "Lagos Mama Put",          ownerName: "Ngozi Okeke",        city: "Lagos",       category: "food",        vat: "NG-VAT-101", optIn: true,  baseReceiptsPerMonth: 80, baseAmount: 4500,    trendUp: true  },
  { countryCode: "NG", shopName: "Abuja Tech Stop",         ownerName: "Tunde Adebayo",      city: "Abuja",       category: "electronics", vat: "NG-VAT-102", optIn: false, baseReceiptsPerMonth: 22, baseAmount: 95000,   trendUp: true  },

  // ── Kenya — KRA / eTIMS ─────────────────────────────────────────────────
  { countryCode: "KE", shopName: "Westlands Duka",          ownerName: "Wanjiru Mwangi",     city: "Nairobi",     category: "general",     vat: "KE-VAT-201", optIn: true,  baseReceiptsPerMonth: 55, baseAmount: 850,     trendUp: true  },

  // ── Ghana — GRA / E-VAT ─────────────────────────────────────────────────
  { countryCode: "GH", shopName: "Osu Market Stall",        ownerName: "Kwame Asante",       city: "Accra",       category: "food",        vat: "GH-VAT-301", optIn: true,  baseReceiptsPerMonth: 40, baseAmount: 38,      trendUp: true  },

  // ── Senegal — DGID / Loto Fiscal ────────────────────────────────────────
  { countryCode: "SN", shopName: "Boutique Plateau Dakar",  ownerName: "Fatou Ndiaye",       city: "Dakar",       category: "general",     vat: "SN-VAT-401", optIn: false, baseReceiptsPerMonth: 30, baseAmount: 4200,    trendUp: false },

  // ── Rwanda — RRA / EBM ──────────────────────────────────────────────────
  { countryCode: "RW", shopName: "Kigali Heights Shop",     ownerName: "Jean-Paul Mugisha",  city: "Kigali",      category: "general",     vat: "RW-VAT-501", optIn: true,  baseReceiptsPerMonth: 50, baseAmount: 2800,    trendUp: true  },

  // ── South Africa — SARS / e-Invoicing ───────────────────────────────────
  { countryCode: "ZA", shopName: "Sandton Spaza",           ownerName: "Thandi Mokoena",     city: "Johannesburg",category: "general",     vat: "ZA-VAT-601", optIn: false, baseReceiptsPerMonth: 35, baseAmount: 220,     trendUp: true  },
];

function seededRandom(seed: number) {
  let s = seed;
  return () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
}

export async function seedCrossProductDemoData() {
  await seedLotoMerchantDemoData();
  await seedSecuredCreditorSnapshotDemoData();
}

async function seedLotoMerchantDemoData() {
  // Skip if already seeded
  const existing = await db.select().from(lotoMerchants).limit(1);
  if (existing.length > 0) {
    console.log("[seed-cross-product] loto merchants already seeded, skipping");
    return;
  }

  // Try to find borrowers and users to link to (first three of each).
  const someBorrowers = await db.select().from(borrowers).limit(3);
  const someUsers = await db.select().from(users).limit(2);

  console.log(`[seed-cross-product] seeding ${MERCHANT_SEEDS.length} pan-African merchants…`);

  for (let i = 0; i < MERCHANT_SEEDS.length; i++) {
    const seed = MERCHANT_SEEDS[i];
    const profile = getTaxAuthorityProfile(seed.countryCode);
    const linkedBorrower = someBorrowers[i] ?? null;
    const linkedUser = someUsers[i] ?? null;

    const [merchant] = await db.insert(lotoMerchants).values({
      borrowerId: linkedBorrower?.id ?? null,
      userId: linkedUser?.id ?? null,
      shopName: seed.shopName,
      ownerName: seed.ownerName,
      vatRegistrationNumber: seed.vat,
      countryCode: profile.countryCode,
      currency: profile.currency,
      city: seed.city,
      category: seed.category,
      creditOptInActive: seed.optIn,
    }).returning();

    // 6 months of receipts per merchant. Volume varies for visual interest.
    const rng = seededRandom(i * 1000 + 17);
    const now = new Date();
    let receiptCounter = 0;

    for (let monthOffset = 5; monthOffset >= 0; monthOffset--) {
      const trendMultiplier = seed.trendUp
        ? 1 + (5 - monthOffset) * 0.05
        : 1 - (5 - monthOffset) * 0.07;
      const numReceipts = Math.max(2, Math.round(seed.baseReceiptsPerMonth * trendMultiplier));

      for (let r = 0; r < numReceipts; r++) {
        const issuedAt = new Date(now.getFullYear(), now.getMonth() - monthOffset, 1 + Math.floor(rng() * 27), 8 + Math.floor(rng() * 12));
        const amount = Math.round(seed.baseAmount * (0.5 + rng()));
        const vat = Math.round(amount * 0.18);
        const ticketNum = `${seed.vat}-${String(monthOffset).padStart(2, "0")}-${String(receiptCounter).padStart(4, "0")}`;
        receiptCounter++;
        await db.insert(lotoReceipts).values({
          merchantId: merchant.id,
          consumerUserId: linkedUser && rng() > 0.6 ? linkedUser.id : null,
          fiscalCode: `FC-${merchant.id.slice(0, 6)}-${ticketNum}`,
          ticketNumber: ticketNum,
          amount: String(amount),
          vatAmount: String(vat),
          currency: profile.currency,
          category: seed.category,
          itemCount: 1 + Math.floor(rng() * 5),
          issuedAt,
        });
      }
    }

    if (seed.optIn) {
      const expiresAt = new Date();
      expiresAt.setMonth(expiresAt.getMonth() + DEFAULT_CONSENT_DURATION_MONTHS);
      await db.insert(crossProductConsents).values({
        userId: linkedUser?.id ?? null,
        borrowerId: linkedBorrower?.id ?? null,
        merchantId: merchant.id,
        sourceProduct: "loto",
        targetProduct: "credit",
        purpose: "merchant_credit_profile",
        scopeNote: `Demo seed: ${profile.countryCode} merchant opted in to share VAT receipt history with lenders`,
        expiresAt,
      });

      // Sync into alternative_data so credit scoring can use it.
      try {
        await syncMerchantReceiptsToAlternativeData(merchant.id, { userId: undefined, ip: "seed" });
      } catch {
        // ok if no borrower linked
      }
    }

    console.log(`[seed-cross-product]   [${profile.countryCode}] ${seed.shopName}: ${receiptCounter} receipts in ${profile.currency}, optIn=${seed.optIn}, badge="${profile.taxAuthority} ${profile.productLabel}"`);
  }

  console.log(`[seed-cross-product] done — ${MERCHANT_SEEDS.length} merchants across ${new Set(MERCHANT_SEEDS.map(m => m.countryCode)).size} African countries`);
}

/**
 * Idempotently ensure the Secured Creditor demo (johndoe @ Demo Bank Ltd) has
 * a borrower in the registry that satisfies all three preconditions for the
 * "click an inquiry → open bureau profile" flow:
 *   (a) the borrower owns at least one approved Ghana collateral item,
 *   (b) an active `crossProductConsents` row exists with
 *       sourceProduct=credit / targetProduct=collateral /
 *       purpose=collateral_credit_view (i.e. credit data may be surfaced to
 *       the collateral product),
 *   (c) the borrower has at least three credit_inquiries within the 90-day
 *       window the snapshot panel queries.
 *
 * Without this, the borrower-credit-snapshot panel renders either "no
 * borrower linked" or "no consent" for every collateral row in the demo and
 * the click-through UI never appears.
 */
async function seedSecuredCreditorSnapshotDemoData() {
  if (!isGhanaMode()) return;

  // 1) Find a Ghana borrower to use as the demo subject. Prefer Kwame Mensah
  //    from the core seed (createdBorrowers[0]); otherwise fall back to any
  //    individual Ghana borrower.
  const [preferredBorrower] = await db
    .select()
    .from(borrowers)
    .where(and(eq(borrowers.firstName, "Kwame"), eq(borrowers.lastName, "Mensah")))
    .limit(1);

  let demoBorrower = preferredBorrower;
  if (!demoBorrower) {
    const [fallback] = await db
      .select()
      .from(borrowers)
      .where(eq(borrowers.country, "Ghana"))
      .limit(1);
    demoBorrower = fallback;
  }
  if (!demoBorrower) {
    console.log("[seed-cross-product] no Ghana borrower found, skipping secured-creditor snapshot seed");
    return;
  }

  // 2) Resolve the secured-creditor demo user's organization so we can make
  //    sure the linked collateral item is owned by their org (otherwise it
  //    won't appear in their /collateral-registry list, which filters by
  //    lenderOrganizationId).
  const [securedCreditorUser] = await db
    .select()
    .from(users)
    .where(eq(users.username, "johndoe"))
    .limit(1);
  const securedCreditorOrgId = securedCreditorUser?.organizationId ?? null;

  // 3) Make sure at least one approved Ghana collateral item is linked to
  //    this borrower AND owned by the secured-creditor demo org.
  //    seedCollateralDemoData (in routes.ts) seeds items by borrowerName
  //    only; pick the one whose name matches if present, else grab the
  //    first approved Ghana item without a borrowerId and attach.
  const borrowerDisplayName = demoBorrower.firstName && demoBorrower.lastName
    ? `${demoBorrower.firstName} ${demoBorrower.lastName}`
    : demoBorrower.companyName ?? "";

  const linkedRows = await db
    .select()
    .from(collateralItems)
    .where(eq(collateralItems.borrowerId, demoBorrower.id))
    .limit(5);

  // If none of the existing linked rows is owned by the secured creditor's
  // org, we need to (re)assign one so the demo list shows it.
  const ownedByDemo = securedCreditorOrgId
    ? linkedRows.find(r => r.lenderOrganizationId === securedCreditorOrgId)
    : linkedRows[0];

  if (!ownedByDemo) {
    let target: { id: string } | undefined;
    if (borrowerDisplayName) {
      const [byName] = await db
        .select({ id: collateralItems.id })
        .from(collateralItems)
        .where(and(
          eq(collateralItems.borrowerName, borrowerDisplayName),
          eq(collateralItems.countryCode, "GH"),
          eq(collateralItems.approvalStatus, "approved"),
          isNull(collateralItems.borrowerId),
        ))
        .limit(1);
      target = byName;
    }
    if (!target) {
      const [anyApproved] = await db
        .select({ id: collateralItems.id })
        .from(collateralItems)
        .where(and(
          eq(collateralItems.countryCode, "GH"),
          eq(collateralItems.approvalStatus, "approved"),
          isNull(collateralItems.borrowerId),
        ))
        .limit(1);
      target = anyApproved;
    }
    if (!target && linkedRows.length > 0) {
      // Last resort: reuse a row already linked to this borrower (just
      // reassign its lenderOrganizationId to the demo org).
      target = { id: linkedRows[0].id };
    }
    if (!target) {
      console.log("[seed-cross-product] no Ghana collateral item available to link, skipping secured-creditor snapshot seed");
      return;
    }
    const updates: Record<string, unknown> = {
      borrowerId: demoBorrower.id,
      borrowerName: borrowerDisplayName || demoBorrower.companyName || null,
    };
    if (securedCreditorOrgId) updates.lenderOrganizationId = securedCreditorOrgId;
    await db
      .update(collateralItems)
      .set(updates)
      .where(eq(collateralItems.id, target.id));
    console.log(`[seed-cross-product] linked collateral item ${target.id} to borrower ${demoBorrower.id} (${borrowerDisplayName}), lender org ${securedCreditorOrgId ?? "<unchanged>"}`);
  }

  // 3) Ensure an active credit→collateral consent exists for this borrower.
  //    Convention: sourceProduct = data origin (credit), targetProduct =
  //    data consumer (collateral).
  const [existingConsent] = await db
    .select()
    .from(crossProductConsents)
    .where(and(
      eq(crossProductConsents.borrowerId, demoBorrower.id),
      eq(crossProductConsents.sourceProduct, "credit"),
      eq(crossProductConsents.targetProduct, "collateral"),
      eq(crossProductConsents.purpose, "collateral_credit_view"),
      eq(crossProductConsents.status, "active"),
    ))
    .limit(1);

  if (!existingConsent || (existingConsent.expiresAt && existingConsent.expiresAt < new Date())) {
    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + DEFAULT_CONSENT_DURATION_MONTHS);
    await db.insert(crossProductConsents).values({
      borrowerId: demoBorrower.id,
      sourceProduct: "credit",
      targetProduct: "collateral",
      purpose: "collateral_credit_view",
      status: "active",
      scopeNote: "Demo seed: borrower allows secured creditors to view recent credit inquiries from collateral panel",
      expiresAt,
      grantedByIp: "seed",
    });
    console.log(`[seed-cross-product] inserted collateral_credit_view consent for borrower ${demoBorrower.id}`);
  }

  // 4) Ensure at least 3 recent (within 90 days) credit inquiries exist.
  //    The snapshot panel only shows inquiries from the last 90 days.
  const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
  const recentInquiriesCount = await db
    .select({ cnt: sql<number>`count(*)::int` })
    .from(creditInquiries)
    .where(and(
      eq(creditInquiries.borrowerId, demoBorrower.id),
      gte(creditInquiries.createdAt, ninetyDaysAgo),
    ));
  const haveCount = recentInquiriesCount[0]?.cnt ?? 0;

  if (haveCount < 3) {
    const [inquirer] = await db.select().from(users).limit(1);
    if (!inquirer) {
      console.log("[seed-cross-product] no users available to attribute inquiries to");
      return;
    }
    const dayMs = 24 * 60 * 60 * 1000;
    const seedRows: Array<{ days: number; institution: string; purpose: "new_credit" | "review" | "portfolio_monitoring" }> = [
      { days: 5,  institution: "Ecobank Ghana",       purpose: "new_credit" },
      { days: 18, institution: "Fidelity Bank Ghana", purpose: "new_credit" },
      { days: 45, institution: "CalBank",             purpose: "review" },
    ];
    const toInsert = seedRows.slice(0, Math.max(0, 3 - haveCount));
    for (const r of toInsert) {
      await db.insert(creditInquiries).values({
        borrowerId: demoBorrower.id,
        inquiredBy: inquirer.id,
        purpose: r.purpose,
        institution: r.institution,
        consentProvided: true,
        isSoftPull: true,
        createdAt: new Date(Date.now() - r.days * dayMs),
      });
    }
    console.log(`[seed-cross-product] inserted ${toInsert.length} recent credit inquiries for borrower ${demoBorrower.id}`);
  }

  console.log(`[seed-cross-product] secured-creditor snapshot demo ready (borrower=${demoBorrower.id})`);
}
