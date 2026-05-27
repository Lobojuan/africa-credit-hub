/**
 * Loto Fiscal Routes — Task #488
 *
 * Dedicated Express Router for all DGI fiscal-foundation endpoints.
 * Extracted from the monolithic routes.ts so these routes can be unit-tested
 * independently using supertest (same pattern as loto-admin.ts).
 *
 * Mounted at: /api/loto (in server/routes.ts)
 *
 * Routes:
 *   GET  /fiscal-config           — per-country fiscal authority config (country-scoped)
 *   PUT  /merchants/me/fiscal-id  — merchant NCC/TIN/RC submission + DGI verification
 *   POST /verify                  — consumer receipt verification (duplicate + age checks)
 *   POST /pos/issue               — POS/merchant-originated receipt (duplicate + age checks)
 *
 * Country isolation rules:
 *   - Authenticated users with a scoped country (session.userCountry) can only
 *     access data for that country. Platform-privileged accounts (platform_owner,
 *     super_admin) may access any country by passing countryCode explicitly.
 *   - All new DB queries include a WHERE country_code = $country clause.
 */

import { Router } from "express";
import { z } from "zod";
import { eq, and, gte, lt, desc, sql, inArray } from "drizzle-orm";
import { createHash } from "crypto";
import { db } from "../db";
import { lotoCountryFiscalConfig, lotoMerchants, lotoReceipts, lotoFraudFlags } from "@shared/schema";
import {
  requireAuth,
  resolveUserCountry,
  safeErrorMessage,
  isPlatformPrivileged,
} from "./middleware";
import { storage } from "../storage";

const router = Router();

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Strictly resolve and validate the countryCode for the current request.
 *
 * Access rules (strict data isolation between countries at every layer):
 *   1. Platform-privileged accounts (platform_owner, super_admin) may request
 *      any countryCode — they are never country-scoped.
 *   2. Users with a session.userCountry (country-scoped accounts) may ONLY
 *      access their own country. Any attempt to access another country is 403.
 *   3. Unscoped, non-privileged accounts MUST provide no countryCode (the
 *      auto-return path returns their session country when it is set), and
 *      they are BLOCKED from requesting arbitrary countries (400).
 *      Rationale: a non-privileged account with no country scope should not
 *      exist in production; returning 400 surfaces a misconfigured session
 *      rather than silently leaking cross-country data.
 *
 * Returns:
 *   { country: string }            — resolved country, access granted
 *   { error: string; status: 400|403 } — blocked, include in response
 */
function resolveAndValidateCountry(
  sessionCountry: string | undefined,
  requestedCountry: string | undefined,
  userRole: string | undefined,
): { country: string } | { error: string; status: 400 | 403 } {
  const privileged = isPlatformPrivileged(userRole ?? "");

  // No countryCode requested — resolve from session
  if (!requestedCountry) {
    if (sessionCountry) return { country: sessionCountry };
    // Privileged users must pass an explicit countryCode (no implicit "all")
    return {
      error: "countryCode query parameter is required (e.g. ?countryCode=CI)",
      status: 400,
    };
  }

  // Platform-privileged: can access any country
  if (privileged) {
    return { country: requestedCountry };
  }

  // Country-scoped user: must match session country exactly
  if (sessionCountry) {
    if (requestedCountry !== sessionCountry) {
      return {
        error: `Access denied: your account is scoped to ${sessionCountry} and cannot access ${requestedCountry} data.`,
        status: 403,
      };
    }
    return { country: requestedCountry };
  }

  // Non-privileged user with NO session country requesting an explicit country:
  // block to prevent cross-country data leakage from misconfigured sessions.
  return {
    error:
      "Country scope is required. Your session has no country scope and you do not have platform-level privileges. Contact your administrator.",
    status: 403,
  };
}

/**
 * Core fiscal receipt guard — applied to both /verify and /pos/issue.
 *
 * Checks:
 *  1. receiptDate is present and parseable (400)
 *  2. Receipt is within the 12-month DGI eligibility window (422 RECEIPT_OUTSIDE_ELIGIBILITY_WINDOW)
 *  3. No existing receipt with the same country-scoped fiscal_code (409 RECEIPT_FISCAL_CODE_DUPLICATE)
 *
 * Returns null on success, or an object with { status, body } on failure.
 */
async function applyFiscalReceiptGuard(
  fiscalCode: string,
  receiptDateStr: string,
  countryCode: string,
): Promise<null | { status: number; body: Record<string, unknown> }> {
  // 1. Parse date
  const rDate = new Date(receiptDateStr);
  if (isNaN(rDate.getTime())) {
    return { status: 400, body: { message: "receiptDate is not a valid ISO 8601 date" } };
  }

  // 2. DGI Control #5 — 12-month eligibility window
  const { isReceiptWithinEligibilityWindow } = await import(
    "../services/loto-fiscal-adapter"
  );
  if (!isReceiptWithinEligibilityWindow(rDate, 12)) {
    return {
      status: 422,
      body: {
        message:
          "This receipt is older than 12 months and is no longer eligible for a lottery entry (DGI rule: invoice TVA eligibility window).",
        code: "RECEIPT_OUTSIDE_ELIGIBILITY_WINDOW",
        receiptDate: receiptDateStr,
      },
    };
  }

  // 3. Country-scoped duplicate check — stored key is "${countryCode}-MANUAL-${fiscalCode}"
  const storedKey = `${countryCode}-MANUAL-${fiscalCode}`;
  const [existing] = await db
    .select({ id: lotoReceipts.id })
    .from(lotoReceipts)
    .where(eq(lotoReceipts.fiscalCode, storedKey))
    .limit(1);

  if (existing) {
    return {
      status: 409,
      body: {
        message:
          "This fiscal code has already been used for a lottery entry in this country.",
        code: "RECEIPT_FISCAL_CODE_DUPLICATE",
        fiscalCode,
        countryCode,
      },
    };
  }

  return null;
}

// ── Schema ────────────────────────────────────────────────────────────────────

const verifyBodySchema = z.object({
  fiscalCode: z
    .string()
    .trim()
    .min(6)
    .max(32)
    .regex(/^[A-Za-z0-9_-]+$/, "fiscalCode must be alphanumeric"),
  receiptDate: z.string().datetime({ offset: true }),
});

const posIssueBodySchema = z.object({
  fiscalCode: z
    .string()
    .trim()
    .min(6)
    .max(32)
    .regex(/^[A-Za-z0-9_-]+$/, "fiscalCode must be alphanumeric"),
  receiptDate: z.string().datetime({ offset: true }),
  amount: z.union([z.string(), z.number()]).optional(),
  currency: z.string().min(3).max(3).optional(),
});

// ── GET /fiscal-config ────────────────────────────────────────────────────────

/**
 * Returns fiscal authority config for a specific country.
 * countryCode is REQUIRED — omitting it returns 400 to prevent cross-country
 * config leakage. Country-scoped users can only request their own country.
 */
router.get("/fiscal-config", requireAuth, async (req, res) => {
  try {
    const sessionCountry = await resolveUserCountry(req);
    const rawCC = (req.query.countryCode as string | undefined)?.toUpperCase() || undefined;

    // Strict country isolation: resolveAndValidateCountry enforces that
    // non-privileged users can only access their own scoped country and
    // unscoped non-privileged accounts cannot access any country's data.
    const resolved = resolveAndValidateCountry(sessionCountry, rawCC, req.session?.userRole);
    if ("error" in resolved) {
      return res.status(resolved.status).json({
        message: resolved.error,
        code: resolved.status === 400 ? "COUNTRY_CODE_REQUIRED" : "COUNTRY_ACCESS_DENIED",
      });
    }

    const [row] = await db
      .select()
      .from(lotoCountryFiscalConfig)
      .where(eq(lotoCountryFiscalConfig.countryCode, resolved.country))
      .limit(1);

    if (!row)
      return res
        .status(404)
        .json({ message: `No fiscal config for country: ${resolved.country}` });
    res.json(row);
  } catch (e) {
    res.status(500).json({ message: safeErrorMessage(e) });
  }
});

// ── PUT /merchants/me/fiscal-id ───────────────────────────────────────────────

router.put("/merchants/me/fiscal-id", requireAuth, async (req, res) => {
  try {
    const userId = req.session?.userId;
    if (!userId) return res.status(401).json({ message: "unauthenticated" });

    const { fiscalId } = req.body ?? {};
    if (!fiscalId || typeof fiscalId !== "string") {
      return res.status(400).json({ message: "fiscalId is required" });
    }
    const normalized = fiscalId.trim().toUpperCase();

    const merchant = await storage.getLotoMerchantByUserId(userId);
    if (!merchant)
      return res
        .status(404)
        .json({ message: "No merchant profile found. Register a merchant first." });

    const [config] = await db
      .select()
      .from(lotoCountryFiscalConfig)
      .where(eq(lotoCountryFiscalConfig.countryCode, merchant.countryCode))
      .limit(1);

    if (config) {
      const { validateFiscalIdFormat } = await import("../services/loto-fiscal-adapter");
      const formatError = validateFiscalIdFormat(normalized, config.fiscalIdRegex, config.fiscalIdLabel);
      if (formatError) {
        return res.status(422).json({ message: formatError, code: "FISCAL_ID_FORMAT_INVALID" });
      }
    }

    const { getFiscalAdapter } = await import("../services/loto-fiscal-adapter");
    const adapter = getFiscalAdapter(config?.adapterKey ?? "simulated");
    const verifyResult = await adapter.verify({
      fiscalId: normalized,
      countryCode: merchant.countryCode,
      merchantName: merchant.shopName,
    });

    await db
      .update(lotoMerchants)
      .set({
        fiscalId: normalized,
        fiscalIdType: config?.fiscalIdLabel ?? null,
        fiscalIdVerified: verifyResult.verified,
      })
      .where(eq(lotoMerchants.id, merchant.id));

    await storage.createAuditLog({
      userId,
      action: "LOTO_FISCAL_ID_SUBMITTED",
      entity: "loto_merchant",
      entityId: merchant.id,
      details: JSON.stringify({
        fiscalId: normalized,
        type: config?.fiscalIdLabel,
        adapter: adapter.id,
        verified: verifyResult.verified,
        providerRef: verifyResult.providerRef,
      }),
      ipAddress: req.ip ?? null,
    });

    const updated = await storage.getLotoMerchantByUserId(userId);
    res.json({
      merchant: updated,
      verification: {
        verified: verifyResult.verified,
        message: verifyResult.message,
        providerRef: verifyResult.providerRef,
      },
    });
  } catch (e) {
    res.status(500).json({ message: safeErrorMessage(e) });
  }
});

// ── POST /verify ──────────────────────────────────────────────────────────────

/**
 * Consumer receipt submission. Applies the full DGI fiscal receipt guard:
 *   1. receiptDate is required (cannot bypass age check)
 *   2. Receipt must be within the 12-month eligibility window (422)
 *   3. (country, fiscalCode) must not already exist in loto_receipts (409)
 *
 * On success, records the receipt and returns the lottery ticket reference.
 */
router.post("/verify", requireAuth, async (req, res) => {
  try {
    const userId = req.session?.userId;
    if (!userId) return res.status(401).json({ message: "unauthenticated" });

    const parsed = verifyBodySchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      return res.status(400).json({
        message: "Invalid request body",
        errors: parsed.error.flatten(),
      });
    }

    const { fiscalCode, receiptDate } = parsed.data;
    const upperCode = fiscalCode.toUpperCase();

    // Resolve country from session (required for receipt submission)
    const countryCode = await resolveUserCountry(req);
    if (!countryCode) {
      return res.status(400).json({
        message: "Country scope required. Switch to a specific country before submitting a receipt.",
      });
    }

    // Apply fiscal guard (age + duplicate checks)
    const guardError = await applyFiscalReceiptGuard(upperCode, receiptDate, countryCode);
    if (guardError) return res.status(guardError.status).json(guardError.body);

    // All checks passed — record the receipt
    const storedKey = `${countryCode}-MANUAL-${upperCode}`;
    const ticketNumber = Math.floor(Math.random() * 1_000_000)
      .toString()
      .padStart(6, "0");

    // Resolve or create a demo merchant for this country.
    // Derive currency from the country's fiscal config so each country uses
    // its correct currency (XOF for CI, GHS for GH, NGN for NG, etc.) rather
    // than a hardcoded default.
    const DEMO_TAG = "__loto_verify_consumer__";
    let merchant = await storage.getLotoMerchantByShopNameAndCountry(DEMO_TAG, countryCode);
    if (!merchant) {
      // Look up the country's fiscal config for the correct currency symbol.
      const [fiscalCfg] = await db
        .select({ currencySymbol: lotoCountryFiscalConfig.currencySymbol })
        .from(lotoCountryFiscalConfig)
        .where(eq(lotoCountryFiscalConfig.countryCode, countryCode))
        .limit(1);
      const currency = fiscalCfg?.currencySymbol ?? "XOF"; // XOF is the CI/West-Africa default
      merchant = await storage.createLotoMerchant({
        shopName: DEMO_TAG,
        ownerName: "Loto Fiscal Consumer Verify",
        vatRegistrationNumber: `${countryCode}-VERIFY-CONSUMER`,
        countryCode,
        currency,
        city: null,
        category: "consumer",
        creditOptInActive: false,
      });
    }

    const receipt = await storage.createLotoReceipt({
      merchantId: merchant.id,
      consumerUserId: userId,
      fiscalCode: storedKey,
      ticketNumber,
      amount: "0.00",
      vatAmount: "0.00",
      currency: merchant.currency,
      category: "consumer_verify",
      itemCount: 1,
      issuedAt: new Date(receiptDate),
    });

    res.json({
      ok: true,
      receipt,
      ticketNumber,
      countryCode,
      fiscalCode: upperCode,
    });
  } catch (e) {
    res.status(500).json({ message: safeErrorMessage(e) });
  }
});

// ── POST /pos/issue ───────────────────────────────────────────────────────────

/**
 * POS / merchant-originated receipt issuance. Applies the same DGI fiscal guard
 * as /verify. This is the entry point for receipts generated by physical POS
 * devices at merchant locations (future: Sunmi/Telpo POS integration).
 *
 * Same controls:
 *   1. receiptDate required
 *   2. 12-month eligibility window (422)
 *   3. Country-scoped duplicate (409)
 */
router.post("/pos/issue", requireAuth, async (req, res) => {
  try {
    const userId = req.session?.userId;
    if (!userId) return res.status(401).json({ message: "unauthenticated" });

    const parsed = posIssueBodySchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      return res.status(400).json({
        message: "Invalid request body",
        errors: parsed.error.flatten(),
      });
    }

    const { fiscalCode, receiptDate, amount, currency } = parsed.data;
    const upperCode = fiscalCode.toUpperCase();

    const countryCode = await resolveUserCountry(req);
    if (!countryCode) {
      return res.status(400).json({
        message: "Country scope required. Switch to a specific country before issuing a POS receipt.",
      });
    }

    // Apply fiscal guard (age + duplicate checks)
    const guardError = await applyFiscalReceiptGuard(upperCode, receiptDate, countryCode);
    if (guardError) return res.status(guardError.status).json(guardError.body);

    // Resolve merchant from the authenticated user (must be a registered merchant)
    const merchant = await storage.getLotoMerchantByUserId(userId);
    if (!merchant) {
      return res.status(404).json({
        message: "No merchant profile found. Only registered merchants can issue POS receipts.",
      });
    }
    if (merchant.countryCode !== countryCode) {
      return res.status(403).json({
        message: `Merchant is registered in ${merchant.countryCode} but the session scope is ${countryCode}.`,
      });
    }

    const storedKey = `${countryCode}-MANUAL-${upperCode}`;
    const ticketNumber = Math.floor(Math.random() * 1_000_000)
      .toString()
      .padStart(6, "0");
    const resolvedCurrency = currency ?? merchant.currency;
    const resolvedAmount = amount != null ? String(amount) : "0.00";
    const vatAmount = (parseFloat(resolvedAmount) * 0.18).toFixed(2);

    const receipt = await storage.createLotoReceipt({
      merchantId: merchant.id,
      consumerUserId: userId,
      fiscalCode: storedKey,
      ticketNumber,
      amount: resolvedAmount,
      vatAmount,
      currency: resolvedCurrency,
      category: "pos",
      itemCount: 1,
      issuedAt: new Date(receiptDate),
    });

    res.json({
      ok: true,
      receipt,
      ticketNumber,
      countryCode,
      fiscalCode: upperCode,
      merchantId: merchant.id,
    });
  } catch (e) {
    res.status(500).json({ message: safeErrorMessage(e) });
  }
});

// ── GET /merchant/fiscal-account ─────────────────────────────────────────────
// Returns KPI strip, 6-month VAT trend, compliance score, and paginated
// receipt ledger for the authenticated merchant (or any merchant if admin).

router.get("/merchant/fiscal-account", requireAuth, async (req, res) => {
  try {
    const userId = req.session?.userId;
    if (!userId) return res.status(401).json({ message: "unauthenticated" });

    const role = req.session?.userRole as string | undefined;
    const sessionCountry = req.session?.userCountry as string | undefined;
    const adminMerchantId = req.query.merchantId as string | undefined;

    let merchant;
    if (adminMerchantId) {
      if (!isPlatformPrivileged(role) && role !== "admin" && role !== "dgi_officer" && role !== "tax_authority_admin") {
        return res.status(403).json({ message: "Insufficient privileges to view another merchant's fiscal account" });
      }
      merchant = await storage.getLotoMerchantById(adminMerchantId);
      if (!merchant) return res.status(404).json({ message: "No merchant profile found" });
      // Country isolation: non-privileged admins MUST have an explicit session country scope.
      // If they lack one, we deny rather than accidentally allow cross-country access.
      if (!isPlatformPrivileged(role)) {
        if (!sessionCountry) {
          return res.status(403).json({
            message: "Country scope required. Your session has no country scope — contact your administrator.",
          });
        }
        if (merchant.countryCode !== sessionCountry) {
          return res.status(403).json({
            message: `Access denied: merchant is registered in ${merchant.countryCode} but your session is scoped to ${sessionCountry}.`,
          });
        }
      }
    } else {
      // Self-access path: merchant is resolved by the caller's own userId.
      // Country-scoped accounts (non-platform-privileged) must still have a
      // sessionCountry, and it must match the merchant's registered country.
      // This prevents a mis-configured account from accessing data outside its
      // jurisdiction even when querying its own profile.
      merchant = await storage.getLotoMerchantByUserId(userId);
      if (merchant && !isPlatformPrivileged(role)) {
        if (!sessionCountry) {
          return res.status(403).json({
            message: "Country scope required. Your session has no country scope — contact your administrator.",
          });
        }
        if (merchant.countryCode !== sessionCountry) {
          return res.status(403).json({
            message: `Access denied: merchant is registered in ${merchant.countryCode} but your session is scoped to ${sessionCountry}.`,
          });
        }
      }
    }

    if (!merchant) return res.status(404).json({ message: "No merchant profile found" });

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    // Annual KPIs + last receipt date
    const [kpiRow] = await db.select({
      receiptsYear: sql<number>`count(*)::int`,
      receiptsMonth: sql<number>`count(*) filter (where ${lotoReceipts.issuedAt} >= ${startOfMonth})::int`,
      vatYear: sql<string>`coalesce(sum(${lotoReceipts.vatAmount}), 0)::text`,
      vatMonth: sql<string>`coalesce(sum(${lotoReceipts.vatAmount}) filter (where ${lotoReceipts.issuedAt} >= ${startOfMonth}), 0)::text`,
      lastIssuedAt: sql<string | null>`max(${lotoReceipts.issuedAt})`,
    }).from(lotoReceipts)
      .where(and(eq(lotoReceipts.merchantId, merchant.id), gte(lotoReceipts.issuedAt, startOfYear)));

    // Previous month count for MoM delta
    const [prevMonthRow] = await db.select({ count: sql<number>`count(*)::int` })
      .from(lotoReceipts)
      .where(and(
        eq(lotoReceipts.merchantId, merchant.id),
        gte(lotoReceipts.issuedAt, prevMonthStart),
        lt(lotoReceipts.issuedAt, startOfMonth),
      ));

    // Receipts last 30 days + category diversity
    const [r30dRow] = await db.select({
      count: sql<number>`count(*)::int`,
      categories: sql<number>`count(distinct ${lotoReceipts.category})::int`,
    }).from(lotoReceipts)
      .where(and(eq(lotoReceipts.merchantId, merchant.id), gte(lotoReceipts.issuedAt, thirtyDaysAgo)));

    // Open fraud flags
    const [flagsRow] = await db.select({ count: sql<number>`count(*)::int` })
      .from(lotoFraudFlags)
      .where(and(eq(lotoFraudFlags.merchantId, merchant.id), eq(lotoFraudFlags.status, "open")));

    // 6-month monthly trend
    const trendRows = await db.select({
      month: sql<string>`to_char(${lotoReceipts.issuedAt}, 'YYYY-MM')`,
      receipts: sql<number>`count(*)::int`,
      vat: sql<string>`coalesce(sum(${lotoReceipts.vatAmount}), 0)::text`,
      turnover: sql<string>`coalesce(sum(${lotoReceipts.amount}), 0)::text`,
    }).from(lotoReceipts)
      .where(and(eq(lotoReceipts.merchantId, merchant.id), gte(lotoReceipts.issuedAt, sixMonthsAgo)))
      .groupBy(sql`to_char(${lotoReceipts.issuedAt}, 'YYYY-MM')`)
      .orderBy(sql`to_char(${lotoReceipts.issuedAt}, 'YYYY-MM')`);

    // Compliance score
    const thisMonthCount = kpiRow?.receiptsMonth ?? 0;
    const prevMonthCount = prevMonthRow?.count ?? 0;
    const momDelta = prevMonthCount === 0 ? 0 : ((thisMonthCount - prevMonthCount) / prevMonthCount) * 100;
    const lastIssuedAt = kpiRow?.lastIssuedAt;
    const daysSinceLast = lastIssuedAt
      ? Math.floor((now.getTime() - new Date(lastIssuedAt).getTime()) / 86400000)
      : 999;

    const { computeMerchantComplianceScore } = await import("../loto-fraud-rules");
    const { score: complianceScore, breakdown: complianceBreakdown } = computeMerchantComplianceScore({
      daysSinceLastReceipt: daysSinceLast,
      receiptsLast30Days: r30dRow?.count ?? 0,
      monthOverMonthDeltaPct: momDelta,
      categoryDiversity: r30dRow?.categories ?? 0,
      openFraudFlags: flagsRow?.count ?? 0,
    });

    // Paginated ledger
    const page = Math.max(1, parseInt(String(req.query.page ?? "1")));
    const limit = Math.min(50, Math.max(1, parseInt(String(req.query.limit ?? "20"))));
    const offset = (page - 1) * limit;

    const [totalRow] = await db.select({ total: sql<number>`count(*)::int` })
      .from(lotoReceipts)
      .where(eq(lotoReceipts.merchantId, merchant.id));

    const ledgerRows = await db.select()
      .from(lotoReceipts)
      .where(eq(lotoReceipts.merchantId, merchant.id))
      .orderBy(desc(lotoReceipts.issuedAt))
      .limit(limit)
      .offset(offset);

    // Fetch fraud flags for these receipt IDs
    const receiptIds = ledgerRows.map((r) => r.id);
    const flagsByReceiptId: Record<string, { id: string; ruleCode: string; status: string; summary: string }> = {};
    if (receiptIds.length > 0) {
      const flags = await db.select({
        id: lotoFraudFlags.id,
        receiptId: lotoFraudFlags.receiptId,
        ruleCode: lotoFraudFlags.ruleCode,
        status: lotoFraudFlags.status,
        summary: lotoFraudFlags.summary,
      }).from(lotoFraudFlags)
        .where(inArray(lotoFraudFlags.receiptId, receiptIds))
        .limit(receiptIds.length * 5);
      for (const f of flags) {
        if (f.receiptId && !flagsByReceiptId[f.receiptId]) flagsByReceiptId[f.receiptId] = f;
      }
    }

    // 12-month DGI eligibility window — same threshold used in applyFiscalReceiptGuard
    const twelveMonthsAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());

    const ledgerItems = ledgerRows.map((r) => {
      const flag = flagsByReceiptId[r.id];
      // Four distinct receipt outcome states (priority order):
      //   "demo"    — generated in demo/test mode; excluded from draws and VAT reporting
      //   "expired" — issued > 12 months ago (outside DGI eligibility window); no longer ticket-eligible
      //   "flagged" — open fraud flag exists (system-detected or merchant dispute)
      //   "valid"   — accepted, ticket-eligible
      const status: "demo" | "expired" | "flagged" | "valid" =
        r.isDemo ? "demo" :
        new Date(r.issuedAt) < twelveMonthsAgo ? "expired" :
        flag ? "flagged" :
        "valid";
      const rejectionReason =
        r.isDemo
          ? "Demo receipt — excluded from lottery draws and VAT reporting"
          : new Date(r.issuedAt) < twelveMonthsAgo
          ? "Receipt older than 12 months — outside DGI lottery eligibility window"
          : flag
          ? flag.summary
          : null;
      return {
        id: r.id,
        fiscalCode: r.fiscalCode,
        ticketNumber: r.ticketNumber,
        amount: r.amount,
        vatAmount: r.vatAmount,
        currency: r.currency,
        issuedAt: r.issuedAt,
        category: r.category,
        isDemo: r.isDemo,
        status,
        flagId: flag?.id ?? null,
        flagRuleCode: flag?.ruleCode ?? null,
        flagStatus: flag?.status ?? null,
        rejectionReason,
      };
    });

    // Fetch country fiscal config for currencySymbol + fiscalIdLabel
    const [fiscalConfig] = await db.select({
      currencySymbol: lotoCountryFiscalConfig.currencySymbol,
      fiscalIdLabel: lotoCountryFiscalConfig.fiscalIdLabel,
      authorityName: lotoCountryFiscalConfig.authorityName,
    }).from(lotoCountryFiscalConfig)
      .where(eq(lotoCountryFiscalConfig.countryCode, merchant.countryCode))
      .limit(1);

    res.json({
      merchant,
      fiscalConfig: fiscalConfig ?? null,
      kpis: {
        receiptsThisMonth: kpiRow?.receiptsMonth ?? 0,
        receiptsThisYear: kpiRow?.receiptsYear ?? 0,
        vatThisMonth: parseFloat(kpiRow?.vatMonth ?? "0"),
        vatThisYear: parseFloat(kpiRow?.vatYear ?? "0"),
        currency: fiscalConfig?.currencySymbol ?? merchant.currency,
        complianceScore,
        complianceBreakdown,
      },
      monthlyTrend: trendRows.map((r) => ({
        month: r.month,
        receipts: r.receipts,
        vat: parseFloat(r.vat),
        turnover: parseFloat(r.turnover),
      })),
      ledger: {
        items: ledgerItems,
        total: totalRow?.total ?? 0,
        page,
        limit,
      },
    });
  } catch (e) {
    res.status(500).json({ message: safeErrorMessage(e) });
  }
});

// ── POST /merchant/receipts/:id/flag ─────────────────────────────────────────
// Allows a merchant to flag one of their receipts as discrepant. Creates a
// MERCHANT_DISPUTE fraud flag and fires the merchant.flagged webhook.

router.post("/merchant/receipts/:id/flag", requireAuth, async (req, res) => {
  try {
    const userId = req.session?.userId;
    if (!userId) return res.status(401).json({ message: "unauthenticated" });

    const receiptId = String(req.params.id);
    const { reason } = req.body ?? {};

    const role = req.session?.userRole as string | undefined;
    const sessionCountry = req.session?.userCountry as string | undefined;

    const merchant = await storage.getLotoMerchantByUserId(userId);
    if (!merchant) return res.status(404).json({ message: "No merchant profile found" });

    // Country-scope enforcement — mirrors the GET endpoint's self-access path.
    if (!isPlatformPrivileged(role)) {
      if (!sessionCountry) {
        return res.status(403).json({
          message: "Country scope required. Your session has no country scope — contact your administrator.",
        });
      }
      if (merchant.countryCode !== sessionCountry) {
        return res.status(403).json({
          message: `Access denied: merchant is registered in ${merchant.countryCode} but your session is scoped to ${sessionCountry}.`,
        });
      }
    }

    const [receipt] = await db.select().from(lotoReceipts)
      .where(and(eq(lotoReceipts.id, receiptId), eq(lotoReceipts.merchantId, merchant.id)))
      .limit(1);

    if (!receipt) {
      return res.status(404).json({ message: "Receipt not found or does not belong to your merchant account" });
    }

    const signature = createHash("sha256").update(`merchant_dispute|${receiptId}`).digest("hex").substring(0, 40);

    const [existing] = await db.select({ id: lotoFraudFlags.id })
      .from(lotoFraudFlags)
      .where(and(
        eq(lotoFraudFlags.countryCode, merchant.countryCode),
        eq(lotoFraudFlags.ruleCode, "MERCHANT_DISPUTE"),
        eq(lotoFraudFlags.signature, signature),
      )).limit(1);

    if (existing) {
      return res.status(409).json({ message: "This receipt has already been flagged for review", flagId: existing.id });
    }

    const [flag] = await db.insert(lotoFraudFlags).values({
      countryCode: merchant.countryCode,
      ruleCode: "MERCHANT_DISPUTE",
      severity: "low",
      merchantId: merchant.id,
      receiptId: receipt.id,
      summary: `Merchant ${merchant.shopName} reported receipt ${receipt.fiscalCode} as discrepant${reason ? `: ${reason}` : ""}`,
      signature,
      status: "open",
      evidence: {
        source: "merchant_dispute",
        reportedBy: userId,
        reason: reason ?? null,
        receiptAmount: receipt.amount,
        receiptVat: receipt.vatAmount,
        receiptFiscalCode: receipt.fiscalCode,
      },
    }).returning();

    try {
      const { deliverWebhook } = await import("../webhook-delivery");
      deliverWebhook("merchant.flagged", {
        flagId: flag.id,
        merchantId: merchant.id,
        shopName: merchant.shopName,
        countryCode: merchant.countryCode,
        ruleCode: "MERCHANT_DISPUTE",
        receiptId: receipt.id,
        severity: "low",
        reportedBy: userId,
      });
    } catch (_webhookErr) {
      // Webhook delivery failure must not block the API response
    }

    await storage.createAuditLog({
      userId,
      action: "LOTO_RECEIPT_FLAGGED",
      entity: "loto_receipt",
      entityId: receipt.id,
      details: JSON.stringify({ flagId: flag.id, reason: reason ?? null, merchantId: merchant.id }),
    });

    res.json({ ok: true, flag });
  } catch (e) {
    res.status(500).json({ message: safeErrorMessage(e) });
  }
});

export default router;
