import { db } from "./db";
import { exchangeRates } from "@shared/schema";
import { sql } from "drizzle-orm";

const AFRICAN_CURRENCY_CODES = [
  "DZD", "AOA", "BWP", "BIF", "CVE", "XAF", "KMF", "CDF", "DJF", "EGP",
  "ERN", "ETB", "GMD", "GHS", "GNF", "KES", "LSL", "LRD", "LYD", "MGA",
  "MWK", "MRU", "MUR", "MAD", "MZN", "NAD", "NGN", "RWF", "STN", "SCR",
  "SLL", "SOS", "ZAR", "SSP", "SDG", "SZL", "TZS", "TND", "UGX", "XOF",
  "ZMW", "ZWL",
];

const EXTRA_CURRENCIES = ["EUR", "GBP"];

const ALL_TARGET_CURRENCIES = [...AFRICAN_CURRENCY_CODES, ...EXTRA_CURRENCIES];

const FETCH_INTERVAL_MS = 6 * 60 * 60 * 1000;

async function fetchAndUpdateRates(): Promise<{ updated: number; failed: number; errors: string[] }> {
  let updated = 0;
  let failed = 0;
  const errors: string[] = [];
  const today = new Date().toISOString().split("T")[0];

  try {
    const response = await fetch("https://open.er-api.com/v6/latest/USD");
    if (!response.ok) {
      throw new Error(`API returned ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    if (data.result !== "success" || !data.rates) {
      throw new Error(`API error: ${data["error-type"] || "Unknown error"}`);
    }

    const usdRates: Record<string, number> = data.rates;

    for (const currency of ALL_TARGET_CURRENCIES) {
      if (currency === "USD") continue;
      const rateValue = usdRates[currency];
      if (!rateValue) {
        errors.push(`No rate found for USD/${currency}`);
        failed++;
        continue;
      }

      try {
        const existing = await db.select().from(exchangeRates)
          .where(sql`${exchangeRates.baseCurrency} = 'USD' AND ${exchangeRates.targetCurrency} = ${currency} AND ${exchangeRates.source} = 'api'`)
          .limit(1);

        if (existing.length > 0) {
          await db.update(exchangeRates)
            .set({
              rate: rateValue.toFixed(6),
              effectiveDate: today,
            })
            .where(sql`${exchangeRates.id} = ${existing[0].id}`);
        } else {
          await db.insert(exchangeRates).values({
            baseCurrency: "USD",
            targetCurrency: currency,
            rate: rateValue.toFixed(6),
            effectiveDate: today,
            source: "api",
          });
        }

        const inverseRate = (1 / rateValue).toFixed(6);
        const existingInverse = await db.select().from(exchangeRates)
          .where(sql`${exchangeRates.baseCurrency} = ${currency} AND ${exchangeRates.targetCurrency} = 'USD' AND ${exchangeRates.source} = 'api'`)
          .limit(1);

        if (existingInverse.length > 0) {
          await db.update(exchangeRates)
            .set({
              rate: inverseRate,
              effectiveDate: today,
            })
            .where(sql`${exchangeRates.id} = ${existingInverse[0].id}`);
        } else {
          await db.insert(exchangeRates).values({
            baseCurrency: currency,
            targetCurrency: "USD",
            rate: inverseRate,
            effectiveDate: today,
            source: "api",
          });
        }

        updated++;
      } catch (dbErr: any) {
        errors.push(`DB error for ${currency}: ${dbErr.message}`);
        failed++;
      }
    }

    console.log(`[ExchangeRates] Updated ${updated} pairs, ${failed} failed at ${new Date().toISOString()}`);
  } catch (err: any) {
    console.error(`[ExchangeRates] Fetch failed: ${err.message}`);
    errors.push(`Fetch error: ${err.message}`);
  }

  return { updated, failed, errors };
}

export function startExchangeRateScheduler() {
  console.log(`[ExchangeRates] Scheduler started — fetches every ${FETCH_INTERVAL_MS / 3600000} hours`);

  setTimeout(() => {
    fetchAndUpdateRates().catch(console.error);
  }, 10000);

  setInterval(() => {
    fetchAndUpdateRates().catch(console.error);
  }, FETCH_INTERVAL_MS);
}

export { fetchAndUpdateRates };
