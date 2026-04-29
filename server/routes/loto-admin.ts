/**
 * Loto Fiscal — DGI / tax-authority admin endpoints.
 *
 * All endpoints under /api/loto/admin/* are gated by:
 *   - requireAuth (session must be a real institution user, never a consumer)
 *   - requireRole("dgi_officer", "tax_authority_admin")  (super_admin is
 *     implicit in requireRole)
 *   - getCountryFilter / enforceCountryScopeForNonSuperAdmin so a CI officer
 *     never sees KE rows. Super admin can pass ?country=XX to switch view.
 *
 * Country isolation is enforced inside every query via WHERE
 * loto_merchants.country_code = $1; the helpers above only validate the
 * caller's right to ask for that country in the first place.
 */

import { Router } from "express";
import { z } from "zod";
import { and, eq, sql, desc, gte, inArray } from "drizzle-orm";
import { db } from "../db";
import {
  lotoMerchants,
  lotoReceipts,
  lotoFiscalDevices,
  lotoDraws,
  lotoDrawWinners,
  lotoPayouts,
  lotoFraudFlags,
  webhookSubscriptions,
  auditLogs,
  type LotoFraudFlag,
} from "@shared/schema";
import {
  requireAuth,
  requireRole,
  getCountryFilter,
  enforceCountryScopeForNonSuperAdmin,
  logCrossCountryAccess,
} from "./middleware";
import { storage } from "../storage";
import { runFraudScan, computeMerchantComplianceScore } from "../loto-fraud-rules";
import { deliverWebhook, WEBHOOK_EVENTS } from "../webhook-delivery";
import PDFDocument from "pdfkit";

const lotoAdminRouter = Router();

// All routes share the same gate.
const gate = [requireAuth, requireRole("dgi_officer", "tax_authority_admin")];

// ─── helpers ────────────────────────────────────────────────────────────
function csvSafe(val: unknown): string {
  const str = String(val ?? "");
  return /^[=+\-@\t\r]/.test(str) ? "'" + str : str;
}

function csvLine(cols: unknown[]): string {
  return cols
    .map((c) => {
      const s = csvSafe(c);
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    })
    .join(",");
}

function resolveCountry(req: any): string {
  const c = getCountryFilter(req);
  enforceCountryScopeForNonSuperAdmin(req, c, req.path);
  if (!c) {
    throw new Error("Country scope unresolved");
  }
  return c;
}

async function audit(req: any, action: string, entityId: string | undefined, details: string) {
  try {
    await storage.createAuditLog({
      userId: req.session?.userId || "system",
      action,
      entity: "loto_admin",
      entityId,
      details,
      ipAddress: req.ip,
    });
  } catch (err) {
    console.error(`[loto-admin] audit failed for ${action}`, err);
  }
}

// ─── Côte d'Ivoire 14 districts (heatmap) ───────────────────────────────
// City→district map. We keep it inline so the dashboard doesn't need a
// separate static asset shipped with the bundle. Sourced from the 2011
// CI administrative restructuring (Décret n° 2011-263). Cities not on the
// list bucket into `Lagunes` if they sit in/near Abidjan, otherwise the
// catch-all `Autres`.
const CI_DISTRICTS = [
  "Abidjan", "Yamoussoukro", "Bas-Sassandra", "Comoé", "Denguélé",
  "Gôh-Djiboua", "Lacs", "Lagunes", "Montagnes", "Sassandra-Marahoué",
  "Savanes", "Vallée du Bandama", "Woroba", "Zanzan",
] as const;

const CITY_TO_DISTRICT: Record<string, (typeof CI_DISTRICTS)[number]> = {
  abidjan: "Abidjan",
  yamoussoukro: "Yamoussoukro",
  "san-pedro": "Bas-Sassandra", "san pedro": "Bas-Sassandra", sanpedro: "Bas-Sassandra",
  abengourou: "Comoé", aboisso: "Comoé",
  odienne: "Denguélé", odienné: "Denguélé",
  divo: "Gôh-Djiboua", gagnoa: "Gôh-Djiboua",
  daoukro: "Lacs", dimbokro: "Lacs",
  dabou: "Lagunes", grand_bassam: "Lagunes", "grand-bassam": "Lagunes",
  man: "Montagnes", danane: "Montagnes",
  daloa: "Sassandra-Marahoué", issia: "Sassandra-Marahoué",
  korhogo: "Savanes", ferkessedougou: "Savanes",
  bouake: "Vallée du Bandama", bouaké: "Vallée du Bandama",
  seguela: "Woroba", séguéla: "Woroba",
  bondoukou: "Zanzan", bouna: "Zanzan",
};

function cityToDistrict(city: string | null | undefined): string {
  if (!city) return "Autres";
  const k = city.trim().toLowerCase().replace(/\s+/g, "");
  return CITY_TO_DISTRICT[k] ?? CITY_TO_DISTRICT[city.trim().toLowerCase()] ?? "Autres";
}

// ─── 1. KPI strip ───────────────────────────────────────────────────────
lotoAdminRouter.get("/kpi", ...gate, async (req, res) => {
  try {
    const country = resolveCountry(req);
    await logCrossCountryAccess(req, country, "/api/loto/admin/kpi");

    const since24h = new Date(Date.now() - 86400000);
    const since30d = new Date(Date.now() - 30 * 86400000);

    const [vatRow] = await db
      .select({
        totalVat: sql<string>`COALESCE(SUM(${lotoReceipts.vatAmount}), 0)`,
        totalAmount: sql<string>`COALESCE(SUM(${lotoReceipts.amount}), 0)`,
        receipts: sql<number>`COUNT(*)::int`,
      })
      .from(lotoReceipts)
      .innerJoin(lotoMerchants, eq(lotoReceipts.merchantId, lotoMerchants.id))
      .where(and(eq(lotoMerchants.countryCode, country), gte(lotoReceipts.issuedAt, since30d)));

    const [receiptsTodayRow] = await db
      .select({ c: sql<number>`COUNT(*)::int` })
      .from(lotoReceipts)
      .innerJoin(lotoMerchants, eq(lotoReceipts.merchantId, lotoMerchants.id))
      .where(and(eq(lotoMerchants.countryCode, country), gte(lotoReceipts.issuedAt, since24h)));

    const [merchantRow] = await db
      .select({ c: sql<number>`COUNT(*)::int` })
      .from(lotoMerchants)
      .where(eq(lotoMerchants.countryCode, country));

    const [activeDeviceRow] = await db
      .select({ c: sql<number>`COUNT(*)::int` })
      .from(lotoFiscalDevices)
      .where(and(eq(lotoFiscalDevices.countryCode, country), eq(lotoFiscalDevices.status, "active")));

    // Prize pool = sum of pending/upcoming draw prize tiers via lotoDraws
    // total prize_pool when stored, fallback to 0.
    const draws = await db
      .select()
      .from(lotoDraws)
      .where(and(eq(lotoDraws.countryCode, country), eq(lotoDraws.status, "scheduled")));
    const prizePool = draws.reduce((s, d) => s + parseFloat(String(d.totalPool ?? "0")), 0);

    const [openFlagsRow] = await db
      .select({ c: sql<number>`COUNT(*)::int` })
      .from(lotoFraudFlags)
      .where(and(eq(lotoFraudFlags.countryCode, country), eq(lotoFraudFlags.status, "open")));

    res.json({
      countryCode: country,
      vatCollected30d: parseFloat(vatRow?.totalVat ?? "0"),
      turnover30d: parseFloat(vatRow?.totalAmount ?? "0"),
      receipts30d: vatRow?.receipts ?? 0,
      receipts24h: receiptsTodayRow?.c ?? 0,
      merchantsRegistered: merchantRow?.c ?? 0,
      devicesActive: activeDeviceRow?.c ?? 0,
      prizePoolScheduled: prizePool,
      openFraudFlags: openFlagsRow?.c ?? 0,
      generatedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error("[loto-admin] kpi failed", err);
    res.status(500).json({ message: (err as Error).message });
  }
});

// ─── 2. Regional heatmap ────────────────────────────────────────────────
lotoAdminRouter.get("/heatmap", ...gate, async (req, res) => {
  try {
    const country = resolveCountry(req);
    const since30d = new Date(Date.now() - 30 * 86400000);
    const rows = await db
      .select({
        city: lotoMerchants.city,
        merchantId: lotoMerchants.id,
        amount: lotoReceipts.amount,
        vat: lotoReceipts.vatAmount,
        receiptId: lotoReceipts.id,
      })
      .from(lotoMerchants)
      .leftJoin(
        lotoReceipts,
        and(eq(lotoReceipts.merchantId, lotoMerchants.id), gte(lotoReceipts.issuedAt, since30d)),
      )
      .where(eq(lotoMerchants.countryCode, country));

    const buckets: Record<string, { merchants: Set<string>; receipts: number; turnover: number; vat: number }> = {};
    for (const d of CI_DISTRICTS) buckets[d] = { merchants: new Set(), receipts: 0, turnover: 0, vat: 0 };
    buckets["Autres"] = { merchants: new Set(), receipts: 0, turnover: 0, vat: 0 };

    for (const r of rows) {
      const district = cityToDistrict(r.city);
      const b = buckets[district] ?? buckets["Autres"];
      b.merchants.add(r.merchantId);
      if (r.receiptId) {
        b.receipts++;
        b.turnover += parseFloat(String(r.amount ?? "0"));
        b.vat += parseFloat(String(r.vat ?? "0"));
      }
    }

    const districts = Object.entries(buckets).map(([name, v]) => ({
      district: name,
      merchants: v.merchants.size,
      receipts: v.receipts,
      turnover: v.turnover,
      vat: v.vat,
    }));

    res.json({ countryCode: country, windowDays: 30, districts });
  } catch (err) {
    console.error("[loto-admin] heatmap failed", err);
    res.status(500).json({ message: (err as Error).message });
  }
});

// ─── 3. Merchant compliance scorecard ───────────────────────────────────
lotoAdminRouter.get("/compliance-scorecard", ...gate, async (req, res) => {
  try {
    const country = resolveCountry(req);
    const limit = Math.min(parseInt(String(req.query.limit ?? "50")), 200);

    const merchants = await db
      .select()
      .from(lotoMerchants)
      .where(eq(lotoMerchants.countryCode, country))
      .limit(limit);

    if (merchants.length === 0) {
      return res.json({ countryCode: country, merchants: [] });
    }

    const ids = merchants.map((m) => m.id);
    const since60d = new Date(Date.now() - 60 * 86400000);
    const since30d = new Date(Date.now() - 30 * 86400000);
    const since60to30 = new Date(Date.now() - 60 * 86400000);

    const recentReceipts = await db
      .select({
        merchantId: lotoReceipts.merchantId,
        issuedAt: lotoReceipts.issuedAt,
        category: lotoReceipts.category,
        amount: lotoReceipts.amount,
      })
      .from(lotoReceipts)
      .where(and(inArray(lotoReceipts.merchantId, ids), gte(lotoReceipts.issuedAt, since60d)));

    const flags = await db
      .select({ merchantId: lotoFraudFlags.merchantId, status: lotoFraudFlags.status })
      .from(lotoFraudFlags)
      .where(and(eq(lotoFraudFlags.countryCode, country), eq(lotoFraudFlags.status, "open")));

    const flagByMerchant = new Map<string, number>();
    for (const f of flags) {
      if (!f.merchantId) continue;
      flagByMerchant.set(f.merchantId, (flagByMerchant.get(f.merchantId) ?? 0) + 1);
    }

    const out = merchants.map((m) => {
      const own = recentReceipts.filter((r) => r.merchantId === m.id);
      const last30 = own.filter((r) => +r.issuedAt >= +since30d);
      const prev30 = own.filter((r) => +r.issuedAt < +since30d && +r.issuedAt >= +since60to30);
      const lastReceiptAt = own.length ? own.reduce((acc, r) => Math.max(acc, +r.issuedAt), 0) : null;
      const daysSinceLast = lastReceiptAt ? Math.floor((Date.now() - lastReceiptAt) / 86400000) : 999;
      const cur30Total = last30.reduce((s, r) => s + parseFloat(String(r.amount)), 0);
      const prev30Total = prev30.reduce((s, r) => s + parseFloat(String(r.amount)), 0);
      const momPct = prev30Total > 0 ? ((cur30Total - prev30Total) / prev30Total) * 100 : 0;
      const cats = new Set(own.map((r) => (r.category ?? "uncategorized").toLowerCase()));
      const { score, breakdown } = computeMerchantComplianceScore({
        daysSinceLastReceipt: daysSinceLast,
        receiptsLast30Days: last30.length,
        monthOverMonthDeltaPct: momPct,
        categoryDiversity: cats.size,
        openFraudFlags: flagByMerchant.get(m.id) ?? 0,
      });
      return {
        merchantId: m.id,
        shopName: m.shopName,
        city: m.city,
        district: cityToDistrict(m.city),
        category: m.category,
        score,
        breakdown,
        receiptsLast30Days: last30.length,
        turnoverLast30Days: cur30Total,
        momPct: Number(momPct.toFixed(2)),
        openFlags: flagByMerchant.get(m.id) ?? 0,
        lastReceiptAt: lastReceiptAt ? new Date(lastReceiptAt).toISOString() : null,
      };
    });

    out.sort((a, b) => a.score - b.score);
    res.json({ countryCode: country, merchants: out });
  } catch (err) {
    console.error("[loto-admin] compliance failed", err);
    res.status(500).json({ message: (err as Error).message });
  }
});

// ─── 4. Fraud queue + triage actions ────────────────────────────────────
lotoAdminRouter.get("/fraud-flags", ...gate, async (req, res) => {
  try {
    const country = resolveCountry(req);
    const status = (req.query.status as string) || "open";
    const validStatuses = ["open", "dismissed", "escalated", "resolved"];
    const useStatus = validStatuses.includes(status) ? status : "open";

    const flags = await db
      .select()
      .from(lotoFraudFlags)
      .where(and(eq(lotoFraudFlags.countryCode, country), eq(lotoFraudFlags.status, useStatus as any)))
      .orderBy(desc(lotoFraudFlags.detectedAt))
      .limit(200);

    res.json({ countryCode: country, status: useStatus, flags });
  } catch (err) {
    console.error("[loto-admin] fraud-flags failed", err);
    res.status(500).json({ message: (err as Error).message });
  }
});

lotoAdminRouter.post("/fraud-flags/scan", ...gate, async (req, res) => {
  try {
    const country = resolveCountry(req);
    const result = await runFraudScan({ countryCode: country });
    await audit(req, "LOTO_FRAUD_SCAN", undefined, `Scanned ${country}: ${result.detectionsFound} detections, ${result.flagsUpserted} upserted`);
    res.json(result);
  } catch (err) {
    console.error("[loto-admin] scan failed", err);
    res.status(500).json({ message: (err as Error).message });
  }
});

const triageBody = z.object({
  action: z.enum(["dismiss", "escalate", "resolve"]),
  note: z.string().max(2000).optional(),
});

lotoAdminRouter.post("/fraud-flags/:id/triage", ...gate, async (req, res) => {
  try {
    const country = resolveCountry(req);
    const parsed = triageBody.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Invalid body", errors: parsed.error.errors });

    const [existing] = await db.select().from(lotoFraudFlags).where(eq(lotoFraudFlags.id, req.params.id));
    if (!existing) return res.status(404).json({ message: "Flag not found" });
    if (existing.countryCode !== country) {
      return res.status(403).json({ message: "Cross-country triage forbidden" });
    }

    const newStatus =
      parsed.data.action === "dismiss" ? "dismissed" :
      parsed.data.action === "escalate" ? "escalated" : "resolved";

    const [updated] = await db
      .update(lotoFraudFlags)
      .set({
        status: newStatus,
        triageNote: parsed.data.note,
        triagedBy: req.session!.userId!,
        triagedAt: new Date(),
      })
      .where(eq(lotoFraudFlags.id, req.params.id))
      .returning();

    await audit(req, `LOTO_FRAUD_${newStatus.toUpperCase()}`, updated.id, `Flag ${updated.ruleCode}/${updated.signature} -> ${newStatus}`);

    // Webhook notification when escalated.
    if (newStatus === "escalated" && updated.merchantId) {
      const merchant = await storage.getLotoMerchantById(updated.merchantId);
      deliverWebhook(
        "merchant.flagged",
        {
          merchantId: updated.merchantId,
          shopName: merchant?.shopName,
          countryCode: updated.countryCode,
          ruleCode: updated.ruleCode,
          severity: updated.severity,
          summary: updated.summary,
          flagId: updated.id,
        },
      ).catch((e) => console.error("[loto-admin] webhook deliver failed", e));
    }

    res.json(updated);
  } catch (err) {
    console.error("[loto-admin] triage failed", err);
    res.status(500).json({ message: (err as Error).message });
  }
});

// ─── 5. VAT uplift attribution ──────────────────────────────────────────
// Compares VAT collected in months where the loto lottery was active vs
// the same merchant's pre-rollout baseline. The pilot threshold uses the
// merchant.registeredAt date as t=0 (rollout) and the 90 days before vs
// after. Attribution = post30 - pre30 normalised by pre30.
lotoAdminRouter.get("/vat-uplift", ...gate, async (req, res) => {
  try {
    const country = resolveCountry(req);

    const rows = await db
      .select({
        month: sql<string>`to_char(${lotoReceipts.issuedAt}, 'YYYY-MM')`,
        receipts: sql<number>`COUNT(*)::int`,
        vat: sql<string>`COALESCE(SUM(${lotoReceipts.vatAmount}), 0)`,
        turnover: sql<string>`COALESCE(SUM(${lotoReceipts.amount}), 0)`,
      })
      .from(lotoReceipts)
      .innerJoin(lotoMerchants, eq(lotoReceipts.merchantId, lotoMerchants.id))
      .where(eq(lotoMerchants.countryCode, country))
      .groupBy(sql`to_char(${lotoReceipts.issuedAt}, 'YYYY-MM')`)
      .orderBy(sql`to_char(${lotoReceipts.issuedAt}, 'YYYY-MM')`);

    const series = rows.map((r) => ({
      month: r.month,
      receipts: r.receipts,
      vat: parseFloat(r.vat),
      turnover: parseFloat(r.turnover),
    }));

    const last3 = series.slice(-3);
    const baseline3 = series.slice(-6, -3);
    const sumVat = (a: typeof series) => a.reduce((s, x) => s + x.vat, 0);
    const recentVat = sumVat(last3);
    const baselineVat = sumVat(baseline3);
    const upliftPct = baselineVat > 0 ? ((recentVat - baselineVat) / baselineVat) * 100 : null;

    res.json({
      countryCode: country,
      monthly: series,
      summary: {
        recent3MonthsVat: recentVat,
        baseline3MonthsVat: baselineVat,
        upliftPct: upliftPct !== null ? Number(upliftPct.toFixed(2)) : null,
        attributable: upliftPct !== null ? Number((recentVat - baselineVat).toFixed(2)) : null,
      },
    });
  } catch (err) {
    console.error("[loto-admin] vat-uplift failed", err);
    res.status(500).json({ message: (err as Error).message });
  }
});

// ─── 6. CSV / PDF exports ───────────────────────────────────────────────
lotoAdminRouter.get("/export.csv", ...gate, async (req, res) => {
  try {
    const country = resolveCountry(req);
    const view = String(req.query.view ?? "kpi");
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename=loto-${view}-${country}-${Date.now()}.csv`);

    if (view === "compliance") {
      const merchants = await db.select().from(lotoMerchants).where(eq(lotoMerchants.countryCode, country)).limit(500);
      const ids = merchants.map((m) => m.id);
      const since60d = new Date(Date.now() - 60 * 86400000);
      const since30d = new Date(Date.now() - 30 * 86400000);
      const recentReceipts = ids.length
        ? await db
            .select()
            .from(lotoReceipts)
            .where(and(inArray(lotoReceipts.merchantId, ids), gte(lotoReceipts.issuedAt, since60d)))
        : [];
      const flags = await db
        .select()
        .from(lotoFraudFlags)
        .where(and(eq(lotoFraudFlags.countryCode, country), eq(lotoFraudFlags.status, "open")));
      const flagByMerchant = new Map<string, number>();
      for (const f of flags) if (f.merchantId) flagByMerchant.set(f.merchantId, (flagByMerchant.get(f.merchantId) ?? 0) + 1);

      res.write(csvLine(["merchant_id", "shop_name", "city", "district", "category", "score", "receipts_30d", "turnover_30d", "open_flags", "last_receipt_at"]) + "\n");
      for (const m of merchants) {
        const own = recentReceipts.filter((r) => r.merchantId === m.id);
        const last30 = own.filter((r) => +r.issuedAt >= +since30d);
        const lastReceiptAt = own.length ? own.reduce((acc, r) => Math.max(acc, +r.issuedAt), 0) : null;
        const daysSinceLast = lastReceiptAt ? Math.floor((Date.now() - lastReceiptAt) / 86400000) : 999;
        const prev30 = own.filter((r) => +r.issuedAt < +since30d);
        const cur30Total = last30.reduce((s, r) => s + parseFloat(String(r.amount)), 0);
        const prev30Total = prev30.reduce((s, r) => s + parseFloat(String(r.amount)), 0);
        const momPct = prev30Total > 0 ? ((cur30Total - prev30Total) / prev30Total) * 100 : 0;
        const cats = new Set(own.map((r) => (r.category ?? "uncategorized").toLowerCase()));
        const { score } = computeMerchantComplianceScore({
          daysSinceLastReceipt: daysSinceLast, receiptsLast30Days: last30.length,
          monthOverMonthDeltaPct: momPct, categoryDiversity: cats.size,
          openFraudFlags: flagByMerchant.get(m.id) ?? 0,
        });
        res.write(csvLine([m.id, m.shopName, m.city ?? "", cityToDistrict(m.city), m.category ?? "", score, last30.length, cur30Total.toFixed(2), flagByMerchant.get(m.id) ?? 0, lastReceiptAt ? new Date(lastReceiptAt).toISOString() : ""]) + "\n");
      }
      return res.end();
    }

    if (view === "fraud") {
      const flags = await db
        .select()
        .from(lotoFraudFlags)
        .where(eq(lotoFraudFlags.countryCode, country))
        .orderBy(desc(lotoFraudFlags.detectedAt))
        .limit(2000);
      res.write(csvLine(["id", "rule_code", "severity", "status", "merchant_id", "summary", "detected_at", "triaged_at", "triaged_by"]) + "\n");
      for (const f of flags) {
        res.write(csvLine([f.id, f.ruleCode, f.severity, f.status, f.merchantId ?? "", f.summary, f.detectedAt.toISOString(), f.triagedAt?.toISOString() ?? "", f.triagedBy ?? ""]) + "\n");
      }
      return res.end();
    }

    if (view === "heatmap") {
      const since30d = new Date(Date.now() - 30 * 86400000);
      const rows = await db
        .select({
          city: lotoMerchants.city,
          merchantId: lotoMerchants.id,
          amount: lotoReceipts.amount,
          vat: lotoReceipts.vatAmount,
          receiptId: lotoReceipts.id,
        })
        .from(lotoMerchants)
        .leftJoin(lotoReceipts, and(eq(lotoReceipts.merchantId, lotoMerchants.id), gte(lotoReceipts.issuedAt, since30d)))
        .where(eq(lotoMerchants.countryCode, country));
      const buckets: Record<string, { m: Set<string>; r: number; t: number; v: number }> = {};
      for (const r of rows) {
        const d = cityToDistrict(r.city);
        if (!buckets[d]) buckets[d] = { m: new Set(), r: 0, t: 0, v: 0 };
        buckets[d].m.add(r.merchantId);
        if (r.receiptId) {
          buckets[d].r++; buckets[d].t += parseFloat(String(r.amount ?? "0")); buckets[d].v += parseFloat(String(r.vat ?? "0"));
        }
      }
      res.write(csvLine(["district", "merchants", "receipts_30d", "turnover_30d", "vat_30d"]) + "\n");
      for (const [d, v] of Object.entries(buckets)) {
        res.write(csvLine([d, v.m.size, v.r, v.t.toFixed(2), v.v.toFixed(2)]) + "\n");
      }
      return res.end();
    }

    // default kpi
    const since30d = new Date(Date.now() - 30 * 86400000);
    const [vatRow] = await db
      .select({ totalVat: sql<string>`COALESCE(SUM(${lotoReceipts.vatAmount}), 0)`, totalAmount: sql<string>`COALESCE(SUM(${lotoReceipts.amount}), 0)`, c: sql<number>`COUNT(*)::int` })
      .from(lotoReceipts)
      .innerJoin(lotoMerchants, eq(lotoReceipts.merchantId, lotoMerchants.id))
      .where(and(eq(lotoMerchants.countryCode, country), gte(lotoReceipts.issuedAt, since30d)));
    res.write(csvLine(["country_code", "vat_30d", "turnover_30d", "receipts_30d"]) + "\n");
    res.write(csvLine([country, parseFloat(vatRow?.totalVat ?? "0").toFixed(2), parseFloat(vatRow?.totalAmount ?? "0").toFixed(2), vatRow?.c ?? 0]) + "\n");
    res.end();
  } catch (err) {
    console.error("[loto-admin] csv export failed", err);
    res.status(500).json({ message: (err as Error).message });
  }
});

lotoAdminRouter.get("/export.pdf", ...gate, async (req, res) => {
  try {
    const country = resolveCountry(req);
    const view = String(req.query.view ?? "kpi");

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=loto-${view}-${country}-${Date.now()}.pdf`);

    const doc = new PDFDocument({ size: "A4", margin: 50 });
    doc.pipe(res);

    doc.fontSize(18).text(`Loto Fiscal — DGI Report (${view.toUpperCase()})`, { align: "center" });
    doc.moveDown(0.5);
    doc.fontSize(11).fillColor("#555").text(`Country: ${country}    Generated: ${new Date().toISOString()}`, { align: "center" });
    doc.fillColor("black").moveDown();

    if (view === "fraud") {
      const flags = await db
        .select()
        .from(lotoFraudFlags)
        .where(eq(lotoFraudFlags.countryCode, country))
        .orderBy(desc(lotoFraudFlags.detectedAt))
        .limit(50);
      doc.fontSize(13).text(`Open & recent fraud flags (showing ${flags.length})`);
      doc.moveDown(0.5).fontSize(9);
      for (const f of flags) {
        doc.text(`[${f.severity.toUpperCase()}] ${f.ruleCode} — ${f.status}`);
        doc.text(`  ${f.summary}`);
        doc.text(`  detected ${f.detectedAt.toISOString()} ${f.triagedAt ? "  triaged " + f.triagedAt.toISOString() : ""}`);
        doc.moveDown(0.3);
        if (doc.y > 750) { doc.addPage(); }
      }
    } else if (view === "compliance") {
      const merchants = await db.select().from(lotoMerchants).where(eq(lotoMerchants.countryCode, country)).limit(40);
      doc.fontSize(13).text(`Top ${merchants.length} merchants — compliance snapshot`);
      doc.moveDown(0.5).fontSize(9);
      for (const m of merchants) {
        doc.text(`${m.shopName}  (${m.city ?? "—"} / ${cityToDistrict(m.city)})`);
        doc.text(`  category: ${m.category ?? "—"}    registered: ${m.registeredAt?.toISOString() ?? "—"}`);
        doc.moveDown(0.3);
        if (doc.y > 750) { doc.addPage(); }
      }
    } else {
      const since30d = new Date(Date.now() - 30 * 86400000);
      const [vatRow] = await db
        .select({ vat: sql<string>`COALESCE(SUM(${lotoReceipts.vatAmount}), 0)`, amt: sql<string>`COALESCE(SUM(${lotoReceipts.amount}), 0)`, c: sql<number>`COUNT(*)::int` })
        .from(lotoReceipts)
        .innerJoin(lotoMerchants, eq(lotoReceipts.merchantId, lotoMerchants.id))
        .where(and(eq(lotoMerchants.countryCode, country), gte(lotoReceipts.issuedAt, since30d)));
      const [merchantCount] = await db.select({ c: sql<number>`COUNT(*)::int` }).from(lotoMerchants).where(eq(lotoMerchants.countryCode, country));
      doc.fontSize(13).text("Last 30 days").moveDown(0.5);
      doc.fontSize(11);
      doc.text(`Merchants registered: ${merchantCount?.c ?? 0}`);
      doc.text(`Receipts verified:    ${vatRow?.c ?? 0}`);
      doc.text(`Turnover (TTC):       ${parseFloat(vatRow?.amt ?? "0").toFixed(2)}`);
      doc.text(`VAT collected:        ${parseFloat(vatRow?.vat ?? "0").toFixed(2)}`);
    }

    doc.end();
  } catch (err) {
    console.error("[loto-admin] pdf export failed", err);
    if (!res.headersSent) res.status(500).json({ message: (err as Error).message });
  }
});

// ─── 7. Webhook outbox config ───────────────────────────────────────────
const LOTO_EVENTS = ["merchant.flagged", "receipt.verified", "draw.closed"] as const;

lotoAdminRouter.get("/webhooks", ...gate, async (req, res) => {
  try {
    const orgId = req.session?.organizationId;
    const subs = orgId
      ? await db.select().from(webhookSubscriptions).where(eq(webhookSubscriptions.organizationId, orgId))
      : await db.select().from(webhookSubscriptions);
    const lotoSubs = subs.filter((s) => (s.events ?? []).some((e) => (LOTO_EVENTS as readonly string[]).includes(e)));
    res.json({ availableEvents: LOTO_EVENTS, allWebhookEvents: WEBHOOK_EVENTS, subscriptions: lotoSubs });
  } catch (err) {
    console.error("[loto-admin] webhooks list failed", err);
    res.status(500).json({ message: (err as Error).message });
  }
});

const webhookBody = z.object({
  url: z.string().url(),
  events: z.array(z.enum(LOTO_EVENTS)).min(1),
  secret: z.string().min(8).optional(),
  description: z.string().max(200).optional(),
});

lotoAdminRouter.post("/webhooks", ...gate, async (req, res) => {
  try {
    const orgId = req.session?.organizationId;
    if (!orgId) return res.status(400).json({ message: "Webhook subscriptions require an organization context" });
    const parsed = webhookBody.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Invalid body", errors: parsed.error.errors });

    const [created] = await db.insert(webhookSubscriptions).values({
      organizationId: orgId,
      url: parsed.data.url,
      events: parsed.data.events,
      secret: parsed.data.secret ?? "",
      description: parsed.data.description,
      status: "active",
    }).returning();
    await audit(req, "LOTO_WEBHOOK_SUBSCRIBED", created.id, `Subscribed ${parsed.data.events.join(",")} → ${parsed.data.url}`);
    res.status(201).json(created);
  } catch (err) {
    console.error("[loto-admin] webhook create failed", err);
    res.status(500).json({ message: (err as Error).message });
  }
});

lotoAdminRouter.delete("/webhooks/:id", ...gate, async (req, res) => {
  try {
    const orgId = req.session?.organizationId;
    const where = orgId
      ? and(eq(webhookSubscriptions.id, req.params.id), eq(webhookSubscriptions.organizationId, orgId))
      : eq(webhookSubscriptions.id, req.params.id);
    const [deleted] = await db.delete(webhookSubscriptions).where(where).returning();
    if (!deleted) return res.status(404).json({ message: "Subscription not found" });
    await audit(req, "LOTO_WEBHOOK_REMOVED", deleted.id, `Removed ${deleted.url}`);
    res.json({ ok: true });
  } catch (err) {
    console.error("[loto-admin] webhook delete failed", err);
    res.status(500).json({ message: (err as Error).message });
  }
});

// ─── 8. Loto-scoped audit log ───────────────────────────────────────────
lotoAdminRouter.get("/audit", ...gate, async (req, res) => {
  try {
    resolveCountry(req); // validation only — audit_logs is global, but we
                         // restrict to loto-prefixed entities/actions below.
    const limit = Math.min(parseInt(String(req.query.limit ?? "100")), 500);
    const rows = await db
      .select()
      .from(auditLogs)
      .where(
        sql`${auditLogs.entity} LIKE 'loto%' OR ${auditLogs.action} LIKE 'LOTO_%' OR ${auditLogs.action} LIKE 'loto_%'`,
      )
      .orderBy(desc(auditLogs.createdAt))
      .limit(limit);
    res.json({ entries: rows });
  } catch (err) {
    console.error("[loto-admin] audit failed", err);
    res.status(500).json({ message: (err as Error).message });
  }
});

export default lotoAdminRouter;
