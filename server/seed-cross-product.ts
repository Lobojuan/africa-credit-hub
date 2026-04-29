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
import {
  lotoMerchants, lotoReceipts, crossProductConsents, borrowers, users,
} from "@shared/schema";
import { getTaxAuthorityProfile } from "@shared/tax-authority";
import { syncMerchantReceiptsToAlternativeData, DEFAULT_CONSENT_DURATION_MONTHS } from "./cross-product-gateway";

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
  // Skip if already seeded
  const existing = await db.select().from(lotoMerchants).limit(1);
  if (existing.length > 0) {
    console.log("[seed-cross-product] already seeded, skipping");
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
