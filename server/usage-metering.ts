import { db } from "./db";
import { usageMetering, pricingTiers, organizations } from "@shared/schema";
import { eq, and, gte, lte, sql, isNull } from "drizzle-orm";
import { processTransactionFee } from "./wallet-engine";

type MeterableEvent = "credit_report_pull" | "api_call" | "batch_upload" | "cross_border_query" | "dispute_filing" | "data_export";

interface MeterEventOptions {
  organizationId?: string | null;
  eventType: MeterableEvent;
  quantity?: number;
  country?: string | null;
  metadata?: string;
}

async function getOrgPlatformFeePercent(organizationId: string): Promise<number> {
  const [org] = await db.select({ platformFeePercent: organizations.platformFeePercent }).from(organizations).where(eq(organizations.id, organizationId)).limit(1);
  return org?.platformFeePercent ?? 20;
}

async function getUnitPrice(eventType: MeterableEvent, country: string | null, orgCurrentVolume: number): Promise<{ unitPriceCents: number; currency: string }> {
  const countryFilter = country || "Global";

  const tiers = await db
    .select()
    .from(pricingTiers)
    .where(
      and(
        eq(pricingTiers.eventType, eventType),
        eq(pricingTiers.isActive, true),
        eq(pricingTiers.country, countryFilter)
      )
    )
    .orderBy(pricingTiers.minVolume);

  if (tiers.length === 0) {
    const globalTiers = await db
      .select()
      .from(pricingTiers)
      .where(
        and(
          eq(pricingTiers.eventType, eventType),
          eq(pricingTiers.isActive, true),
          eq(pricingTiers.country, "Global")
        )
      )
      .orderBy(pricingTiers.minVolume);

    if (globalTiers.length === 0) {
      return { unitPriceCents: 0, currency: "USD" };
    }

    for (const tier of globalTiers) {
      const maxVol = tier.maxVolume ?? Number.MAX_SAFE_INTEGER;
      if (orgCurrentVolume >= tier.minVolume && orgCurrentVolume <= maxVol) {
        return { unitPriceCents: tier.unitPriceCents, currency: tier.currency };
      }
    }
    const lastTier = globalTiers[globalTiers.length - 1];
    return { unitPriceCents: lastTier.unitPriceCents, currency: lastTier.currency };
  }

  for (const tier of tiers) {
    const maxVol = tier.maxVolume ?? Number.MAX_SAFE_INTEGER;
    if (orgCurrentVolume >= tier.minVolume && orgCurrentVolume <= maxVol) {
      return { unitPriceCents: tier.unitPriceCents, currency: tier.currency };
    }
  }

  const lastTier = tiers[tiers.length - 1];
  return { unitPriceCents: lastTier.unitPriceCents, currency: lastTier.currency };
}

async function getOrgVolume(organizationId: string, eventType: MeterableEvent): Promise<number> {
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const [result] = await db
    .select({ total: sql<number>`COALESCE(sum(${usageMetering.quantity}), 0)` })
    .from(usageMetering)
    .where(
      and(
        eq(usageMetering.organizationId, organizationId),
        eq(usageMetering.eventType, eventType),
        gte(usageMetering.createdAt, startOfMonth)
      )
    );

  return Number(result?.total || 0);
}

export async function recordUsageEvent(options: MeterEventOptions): Promise<void> {
  try {
    const { organizationId, eventType, quantity = 1, country, metadata } = options;

    let currentVolume = 0;
    if (organizationId) {
      currentVolume = await getOrgVolume(organizationId, eventType);
    }

    const { unitPriceCents, currency } = await getUnitPrice(eventType, country || null, currentVolume);
    const totalCents = unitPriceCents * quantity;

    let platformFeeCents = 0;
    let bureauRevenueCents = totalCents;
    if (organizationId) {
      const feePercent = await getOrgPlatformFeePercent(organizationId);
      platformFeeCents = Math.round(totalCents * feePercent / 100);
      bureauRevenueCents = totalCents - platformFeeCents;
    }

    let walletDeducted = false;
    if (organizationId && totalCents > 0) {
      try {
        const result = await processTransactionFee(
          organizationId,
          totalCents,
          platformFeeCents,
          `${eventType} x${quantity}`,
          undefined,
          eventType,
        );
        walletDeducted = result.success;
        if (!result.success && result.insufficientFunds) {
          console.warn(`[UsageMetering] Insufficient wallet balance for org ${organizationId}, event ${eventType}. Recording as unbilled.`);
        }
      } catch (walletErr: any) {
        console.warn(`[UsageMetering] Wallet deduction skipped: ${walletErr.message}`);
      }
    }

    await db.insert(usageMetering).values({
      organizationId: organizationId || null,
      eventType,
      quantity,
      unitPriceCents,
      totalCents,
      platformFeeCents,
      bureauRevenueCents,
      currency,
      country: country || null,
      metadata: metadata || null,
      billed: walletDeducted,
    });
  } catch (err: any) {
    console.error("[UsageMetering] Failed to record event:", err.message);
  }
}
