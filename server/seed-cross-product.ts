/**
 * Seed demo data for the Cross-Product Bridge.
 * - 5 Ivorian merchants (3 linked to existing borrowers)
 * - 6 months of receipts each
 * - 2 merchants opted in to share with credit bureau
 * - A demo consumer with spending insights
 */

import { db } from "./db";
import { eq, and } from "drizzle-orm";
import {
  lotoMerchants, lotoReceipts, crossProductConsents, borrowers, users,
} from "@shared/schema";
import { syncMerchantReceiptsToAlternativeData, DEFAULT_CONSENT_DURATION_MONTHS } from "./cross-product-gateway";

const MERCHANT_SEEDS = [
  { shopName: "Boutique Akwaba", ownerName: "Aminata Koné",   city: "Abidjan",     category: "general",     vat: "CI-VAT-001", optIn: true  },
  { shopName: "Marché Treichville", ownerName: "Youssouf Bamba", city: "Abidjan",   category: "food",        vat: "CI-VAT-002", optIn: true  },
  { shopName: "Pharmacie du Plateau", ownerName: "Dr Aïcha Diallo", city: "Abidjan", category: "pharmacy",  vat: "CI-VAT-003", optIn: false },
  { shopName: "Tech Yopougon",     ownerName: "Mamadou Traoré", city: "Abidjan",    category: "electronics", vat: "CI-VAT-004", optIn: true  },
  { shopName: "Kiosque Cocody",    ownerName: "Salimata N'Goran", city: "Abidjan",  category: "general",     vat: "CI-VAT-005", optIn: false },
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

  // Try to find borrowers to link to (first three)
  const someBorrowers = await db.select().from(borrowers).limit(3);
  const someUsers = await db.select().from(users).limit(2);

  console.log(`[seed-cross-product] seeding ${MERCHANT_SEEDS.length} merchants…`);

  for (let i = 0; i < MERCHANT_SEEDS.length; i++) {
    const seed = MERCHANT_SEEDS[i];
    const linkedBorrower = someBorrowers[i] ?? null;
    const linkedUser = someUsers[i] ?? null;

    const [merchant] = await db.insert(lotoMerchants).values({
      borrowerId: linkedBorrower?.id ?? null,
      userId: linkedUser?.id ?? null,
      shopName: seed.shopName,
      ownerName: seed.ownerName,
      vatRegistrationNumber: seed.vat,
      countryCode: "CI",
      currency: "XOF",
      city: seed.city,
      category: seed.category,
      creditOptInActive: seed.optIn,
    }).returning();

    // 6 months of receipts. Volume varies per merchant for visual interest.
    const rng = seededRandom(i * 1000 + 17);
    const baseReceiptsPerMonth = [60, 45, 18, 30, 8][i] ?? 20;
    const baseAmount = [3500, 2200, 12000, 18000, 1500][i] ?? 4000;

    const now = new Date();
    let receiptCounter = 0;

    for (let monthOffset = 5; monthOffset >= 0; monthOffset--) {
      // Slight upward trend for first three merchants, declining for last two
      const trendMultiplier = i < 3 ? 1 + (5 - monthOffset) * 0.05 : 1 - (5 - monthOffset) * 0.07;
      const numReceipts = Math.max(2, Math.round(baseReceiptsPerMonth * trendMultiplier));
      for (let r = 0; r < numReceipts; r++) {
        const issuedAt = new Date(now.getFullYear(), now.getMonth() - monthOffset, 1 + Math.floor(rng() * 27), 8 + Math.floor(rng() * 12));
        const amount = Math.round(baseAmount * (0.5 + rng()));
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
          currency: "XOF",
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
        scopeNote: "Demo seed: merchant opted in to share VAT receipt history",
        expiresAt,
      });

      // Sync into alternative_data so credit scoring can use it
      try {
        await syncMerchantReceiptsToAlternativeData(merchant.id, { userId: undefined, ip: "seed" });
      } catch (e) {
        // ok if no borrower
      }
    }

    console.log(`[seed-cross-product]   ${seed.shopName}: ${receiptCounter} receipts, optIn=${seed.optIn}`);
  }

  console.log(`[seed-cross-product] done`);
}
