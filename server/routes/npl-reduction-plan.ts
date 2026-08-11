import crypto from "crypto";
import type { Express, Request } from "express";
import { z } from "zod";
import { pool } from "../db";
import { calculateNplReductionMetrics } from "../npl-reduction-plan";
import { GLOBAL_SCOPE, storage } from "../storage";
import {
  enforceDataSovereignty,
  getCountryFilter,
  getOrgScope,
  requireRole,
  requireWriteCountry,
  safeErrorMessage,
} from "./middleware";

const milestoneSchema = z.object({
  date: z.string().date(),
  targetNplRatio: z.coerce.number().min(0).max(100),
  actions: z.string().trim().min(10).max(2_000),
});

const reductionPlanSchema = z.object({
  title: z.string().trim().min(5).max(200),
  targetDate: z.string().date(),
  targetNplRatio: z.coerce.number().min(0).max(10),
  executiveOwner: z.string().trim().min(2).max(200),
  boardEvidenceReference: z.string().trim().min(3).max(500),
  strategySummary: z.string().trim().min(20).max(5_000),
  milestones: z.array(milestoneSchema).min(2).max(24),
}).superRefine((plan, ctx) => {
  const ordered = [...plan.milestones].sort((a, b) => a.date.localeCompare(b.date));
  if (ordered.some((milestone, index) => milestone.date !== plan.milestones[index]?.date)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Milestones must be ordered by date", path: ["milestones"] });
  }
  if (ordered.some((milestone, index) => index > 0 && milestone.targetNplRatio > ordered[index - 1].targetNplRatio)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Milestone NPL targets must not increase", path: ["milestones"] });
  }
  const finalMilestone = ordered.at(-1);
  if (!finalMilestone || finalMilestone.date !== plan.targetDate || finalMilestone.targetNplRatio !== plan.targetNplRatio) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "The final milestone must match the plan target date and ratio", path: ["milestones"] });
  }
});

type ReductionPlanPayload = z.infer<typeof reductionPlanSchema> & {
  country: string;
  schemaVersion: 1;
  baselineSnapshot: ReturnType<typeof calculateNplReductionMetrics>;
  submittedAt: string;
};

function parseReductionPlan(payload: string): ReductionPlanPayload | null {
  try {
    const parsed = JSON.parse(payload);
    const plan = reductionPlanSchema.parse(parsed);
    return { ...parsed, ...plan } as ReductionPlanPayload;
  } catch {
    return null;
  }
}

async function getPortfolioMetrics(req: Request, targetNplRatio: number) {
  const orgId = getOrgScope(req) || null;
  const requestedCountry = getCountryFilter(req);
  const country = requestedCountry === GLOBAL_SCOPE ? null : requestedCountry || null;
  const result = await pool.query(`
    WITH scoped_accounts AS (
      SELECT c.id, GREATEST(COALESCE(c.current_balance, 0), 0) AS exposure, c.currency,
        COALESCE(c.days_in_arrears, 0) AS days_in_arrears,
        COALESCE(c.status::text, 'current') AS status,
        LOWER(COALESCE(c.bog_asset_classification, c.asset_classification, '')) AS classification
      FROM credit_accounts c
      INNER JOIN borrowers b ON b.id = c.borrower_id
      WHERE ($1::text IS NULL OR COALESCE(c.organization_id, b.organization_id) = $1)
        AND ($2::text IS NULL OR b.country = $2)
    ), npl_classified AS (
      SELECT *,
        (status <> 'written_off' AND (
          days_in_arrears >= 90 OR status = 'default'
          OR classification IN ('substandard', 'sub-standard', 'doubtful', 'loss', 'npl', 'non-performing')
        )) AS is_npl
      FROM scoped_accounts
    ), classified AS (
      SELECT *,
        (NOT is_npl AND status <> 'written_off' AND (days_in_arrears BETWEEN 30 AND 89 OR status = 'delinquent')) AS is_watchlist
      FROM npl_classified
    )
    SELECT
      COALESCE(SUM(exposure) FILTER (WHERE status <> 'written_off'), 0)::text AS gross_loan_exposure,
      COALESCE(SUM(exposure) FILTER (WHERE is_npl), 0)::text AS gross_npl_exposure,
      COALESCE(SUM(exposure) FILTER (WHERE is_watchlist), 0)::text AS watchlist_exposure,
      COALESCE(SUM(exposure) FILTER (WHERE is_npl AND EXISTS (
        SELECT 1 FROM collection_assignments ca
        WHERE ca.credit_account_id = classified.id
          AND ca.status IN ('open', 'in_progress', 'promised')
      )), 0)::text AS assigned_npl_exposure,
      COUNT(DISTINCT currency)::int AS currency_count,
      MAX(currency) AS reporting_currency,
      COUNT(*) FILTER (WHERE is_npl)::int AS npl_facilities,
      COUNT(*) FILTER (WHERE is_watchlist)::int AS watchlist_facilities
    FROM classified
  `, [orgId, country]);
  const row = result.rows[0] || {};
  const currencyCount = Number(row.currency_count || 0);
  const metrics = currencyCount <= 1 ? calculateNplReductionMetrics({
    grossLoanExposure: Number(row.gross_loan_exposure || 0),
    grossNplExposure: Number(row.gross_npl_exposure || 0),
    watchlistExposure: Number(row.watchlist_exposure || 0),
    assignedNplExposure: Number(row.assigned_npl_exposure || 0),
    targetNplRatio,
  }) : null;
  return {
    country,
    reportingCurrency: row.reporting_currency || null,
    currencyCount,
    portfolioReadyForPlan: currencyCount <= 1 && Boolean(metrics?.grossLoanExposure),
    blockingReason: currencyCount > 1
      ? "Multiple currencies are present. Reconcile every exposure to the bank's approved reporting currency before calculating a consolidated NPL ratio."
      : null,
    nplFacilities: Number(row.npl_facilities || 0),
    watchlistFacilities: Number(row.watchlist_facilities || 0),
    metrics,
  };
}

export function registerNplReductionPlanRoutes(app: Express) {
  app.get("/api/npl-reduction-plan", requireRole("admin", "super_admin", "lender", "regulator"), enforceDataSovereignty, async (req, res) => {
    try {
      const approvals = (await storage.getPendingApprovals(getOrgScope(req), getCountryFilter(req)))
        .filter((approval) => approval.entityType === "npl_reduction_plan" && approval.action === "SUBMIT_NPL_REDUCTION_PLAN")
        .map((approval) => ({ approval, plan: parseReductionPlan(approval.payload) }))
        .filter((item): item is typeof item & { plan: ReductionPlanPayload } => Boolean(item.plan));
      const active = approvals.filter(({ approval }) => approval.status === "approved")
        .sort((a, b) => String(b.approval.reviewedAt || b.approval.createdAt).localeCompare(String(a.approval.reviewedAt || a.approval.createdAt)))[0] || null;
      const targetNplRatio = active?.plan.targetNplRatio ?? 10;
      const portfolio = await getPortfolioMetrics(req, targetNplRatio);
      res.json({
        generatedAt: new Date().toISOString(),
        methodology: "Gross NPL exposure divided by gross loan exposure in the authorised UCH scope; written-off balances are excluded. Bank reconciliation remains required.",
        ...portfolio,
        active: active && { approvalId: active.approval.id, approvedAt: active.approval.reviewedAt, plan: active.plan },
        pending: approvals.filter(({ approval }) => approval.status === "pending").map(({ approval, plan }) => ({ approvalId: approval.id, createdAt: approval.createdAt, plan })),
      });
    } catch (error: any) {
      res.status(500).json({ message: safeErrorMessage(error) });
    }
  });

  app.post("/api/npl-reduction-plan", requireRole("admin", "super_admin", "lender"), enforceDataSovereignty, async (req, res) => {
    try {
      const plan = reductionPlanSchema.parse(req.body);
      const requestedCountry = getCountryFilter(req);
      const country = requireWriteCountry(requestedCountry === GLOBAL_SCOPE ? "Ghana" : requestedCountry, "submitNplReductionPlan");
      if (country === "Ghana" && plan.targetDate > "2026-12-31") {
        return res.status(400).json({ message: "The Ghana plan target date cannot be later than the 31 December 2026 regulatory deadline" });
      }
      const requesterId = req.session?.userId;
      if (!requesterId) return res.status(401).json({ message: "Not authenticated" });
      const { metrics } = await getPortfolioMetrics(req, plan.targetNplRatio);
      if (!metrics || metrics.grossLoanExposure <= 0) {
        return res.status(409).json({ message: "Load and reconcile an approved loan tape before submitting an NPL reduction plan" });
      }
      const payload: ReductionPlanPayload = {
        ...plan,
        country,
        schemaVersion: 1,
        baselineSnapshot: metrics,
        submittedAt: new Date().toISOString(),
      };
      const approval = await storage.createPendingApproval({
        entityType: "npl_reduction_plan",
        entityId: crypto.randomUUID(),
        action: "SUBMIT_NPL_REDUCTION_PLAN",
        payload: JSON.stringify(payload),
        requestedBy: requesterId,
        organizationId: getOrgScope(req) || null,
        country,
      });
      await storage.createAuditLog({
        action: "SUBMIT_NPL_REDUCTION_PLAN",
        entity: "npl_reduction_plan",
        entityId: approval.id,
        userId: requesterId,
        organizationId: getOrgScope(req),
        details: `Submitted ${plan.title} with ${plan.milestones.length} milestones and a ${plan.targetNplRatio}% target for independent review`,
        ipAddress: req.ip || null,
      });
      res.status(201).json({ approvalId: approval.id, status: approval.status, baselineSnapshot: metrics });
    } catch (error: any) {
      res.status(400).json({ message: safeErrorMessage(error, 400) });
    }
  });
}
