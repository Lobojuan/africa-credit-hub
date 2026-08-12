/**
 * NPL Portfolio API Routes
 * ========================
 *
 * Provides:
 *   GET /api/npl/portfolio-summary       → Real-time NPL ratio, coverage, stage breakdown
 *   GET /api/npl/migration-matrix        → Flow rates between stages (last 30/90 days)
 *   GET /api/npl/provision-summary       → ECL by IFRS 9 stage
 *   GET /api/npl/classifications/:id     → Classification history for a credit account
 *   POST /api/npl/classify-now           → Trigger manual classification run
 *
 * All endpoints enforce org/country scope and require appropriate roles.
 */

import type { Express, Request } from "express";
import { pool } from "../db";
import { GLOBAL_SCOPE, storage } from "../storage";
import { enforceDataSovereignty, getCountryFilter, getOrgScope, requireRole, safeErrorMessage } from "./middleware";
import { runNplClassification, generatePortfolioSummary } from "../npl-classification-engine";

function requestScope(req: Request) {
  const organizationId = getOrgScope(req);
  const requestedCountry = getCountryFilter(req);
  return { organizationId, country: requestedCountry === GLOBAL_SCOPE ? undefined : requestedCountry };
}

export function registerNplPortfolioRoutes(app: Express) {
  // ── Portfolio Summary ─────────────────────────────────────────────────────
  app.get("/api/npl/portfolio-summary", requireRole("admin", "super_admin", "lender", "regulator"), enforceDataSovereignty, async (req, res) => {
    try {
      const { organizationId, country } = requestScope(req);
      const summaryDate = typeof req.query.date === "string" ? req.query.date : new Date().toISOString().slice(0, 10);

      // Ensure summary exists
      await generatePortfolioSummary(summaryDate, country || "Ghana", organizationId);

      const result = await pool.query(`
        SELECT
          summary_date AS "summaryDate",
          gross_loan_exposure AS "grossLoanExposure",
          npl_exposure AS "nplExposure",
          watchlist_exposure AS "watchlistExposure",
          substandard_exposure AS "substandardExposure",
          doubtful_exposure AS "doubtfulExposure",
          loss_exposure AS "lossExposure",
          total_facilities AS "totalFacilities",
          npl_facilities AS "nplFacilities",
          watchlist_facilities AS "watchlistFacilities",
          npl_ratio AS "nplRatio",
          watchlist_ratio AS "watchlistRatio",
          coverage_ratio AS "coverageRatio",
          provision_ratio AS "provisionRatio",
          stage_1_exposure AS "stage1Exposure",
          stage_2_exposure AS "stage2Exposure",
          stage_3_exposure AS "stage3Exposure",
          stage_1_provision AS "stage1Provision",
          stage_2_provision AS "stage2Provision",
          stage_3_provision AS "stage3Provision",
          inflows_stage_1_to_2 AS "inflowsStage1To2",
          inflows_stage_2_to_3 AS "inflowsStage2To3",
          cures_stage_3_to_2 AS "curesStage3To2",
          cures_stage_2_to_1 AS "curesStage2To1",
          write_offs AS "writeOffs",
          npl_assigned_to_collection AS "nplAssignedToCollection",
          npl_not_assigned AS "nplNotAssigned",
          generated_at AS "generatedAt"
        FROM npl_portfolio_summaries
        WHERE summary_date = $1 AND ($2::text IS NULL OR organization_id = $2) AND country = $3
        ORDER BY generated_at DESC LIMIT 1
      `, [summaryDate, organizationId || null, country || "Ghana"]);

      if (!result.rows[0]) {
        return res.status(404).json({ message: "No portfolio summary available for the requested date and scope" });
      }

      res.json({
        generatedAt: new Date().toISOString(),
        ...result.rows[0],
        methodology: "Gross NPL exposure / gross loan exposure. Written-off balances excluded. Provisions based on BoG-standard rates. Independent bank reconciliation required before posting.",
      });
    } catch (error: unknown) {
      res.status(500).json({ message: safeErrorMessage(error) });
    }
  });

  // ── Migration Matrix ──────────────────────────────────────────────────────
  app.get("/api/npl/migration-matrix", requireRole("admin", "super_super", "lender", "regulator"), enforceDataSovereignty, async (req, res) => {
    try {
      const { organizationId, country } = requestScope(req);
      const days = Math.min(365, Math.max(7, Number(req.query.days) || 90));

      const result = await pool.query(`
        SELECT
          from_npl_stage AS "from",
          to_npl_stage AS "to",
          COUNT(*)::int AS "count",
          COALESCE(SUM(balance_at_migration), 0)::text AS "exposure",
          ROUND(AVG(days_in_arrears_after), 1)::float AS "avgDpdAfter"
        FROM npl_migrations
        WHERE migrated_at >= NOW() - INTERVAL '1 day' * $3
          AND ($1::text IS NULL OR organization_id = $1)
          AND country = $2
        GROUP BY from_npl_stage, to_npl_stage
        ORDER BY from_npl_stage, to_npl_stage
      `, [organizationId || null, country || "Ghana", days]);

      // Build matrix view
      const stages = ["performing", "watchlist", "substandard", "doubtful", "loss"];
      const matrix = Object.fromEntries(stages.map((from) => [
        from,
        Object.fromEntries(stages.map((to) => {
          const cell = result.rows.find((r: { from: string; to: string; count: number; exposure: string; avgDpdAfter: number }) => r.from === from && r.to === to);
          return [to, cell || { count: 0, exposure: "0.00", avgDpdAfter: 0 }];
        })),
      ]));

      // Also compute flow rates
      const flowRates = await pool.query(`
        WITH stage_counts AS (
          SELECT from_npl_stage, COUNT(*)::float AS total
          FROM npl_migrations
          WHERE migrated_at >= NOW() - INTERVAL '1 day' * $3
            AND ($1::text IS NULL OR organization_id = $1)
            AND country = $2
          GROUP BY from_npl_stage
        )
        SELECT
          m.from_npl_stage AS "from",
          m.to_npl_stage AS "to",
          ROUND(COUNT(*)::numeric / NULLIF(MAX(sc.total), 0), 4)::float AS "flowRate"
        FROM npl_migrations m
        JOIN stage_counts sc ON sc.from_npl_stage = m.from_npl_stage
        WHERE m.migrated_at >= NOW() - INTERVAL '1 day' * $3
          AND ($1::text IS NULL OR m.organization_id = $1)
          AND m.country = $2
        GROUP BY m.from_npl_stage, m.to_npl_stage
        ORDER BY m.from_npl_stage, m.to_npl_stage
      `, [organizationId || null, country || "Ghana", days]);

      res.json({
        periodDays: days,
        generatedAt: new Date().toISOString(),
        matrix,
        flowRates: flowRates.rows,
        methodology: "Migration counts and flow rates based on observed automated classifications. A loan appears in the matrix each time its NPL stage changes.",
      });
    } catch (error: unknown) {
      res.status(500).json({ message: safeErrorMessage(error) });
    }
  });

  // ── Provision Summary ─────────────────────────────────────────────────────
  app.get("/api/npl/provision-summary", requireRole("admin", "super_admin", "lender", "regulator"), enforceDataSovereignty, async (req, res) => {
    try {
      const { organizationId, country } = requestScope(req);
      const summaryDate = typeof req.query.date === "string" ? req.query.date : new Date().toISOString().slice(0, 10);

      const result = await pool.query(`
        SELECT
          summary_date AS "summaryDate",
          stage_1_exposure AS "stage1Exposure",
          stage_1_provision AS "stage1Provision",
          CASE WHEN stage_1_exposure > 0 THEN ROUND(stage_1_provision / stage_1_exposure, 4) ELSE 0 END AS "stage1Rate",
          stage_2_exposure AS "stage2Exposure",
          stage_2_provision AS "stage2Provision",
          CASE WHEN stage_2_exposure > 0 THEN ROUND(stage_2_provision / stage_2_exposure, 4) ELSE 0 END AS "stage2Rate",
          stage_3_exposure AS "stage3Exposure",
          stage_3_provision AS "stage3Provision",
          CASE WHEN stage_3_exposure > 0 THEN ROUND(stage_3_provision / stage_3_exposure, 4) ELSE 0 END AS "stage3Rate",
          gross_loan_exposure AS "grossLoanExposure",
          (stage_1_provision + stage_2_provision + stage_3_provision) AS "totalProvision",
          CASE WHEN gross_loan_exposure > 0 THEN ROUND((stage_1_provision + stage_2_provision + stage_3_provision) / gross_loan_exposure, 4) ELSE 0 END AS "blendedProvisionRate"
        FROM npl_portfolio_summaries
        WHERE summary_date = $1 AND ($2::text IS NULL OR organization_id = $2) AND country = $3
        ORDER BY generated_at DESC LIMIT 1
      `, [summaryDate, organizationId || null, country || "Ghana"]);

      if (!result.rows[0]) {
        return res.status(404).json({ message: "No provision summary available" });
      }

      res.json({
        generatedAt: new Date().toISOString(),
        ...result.rows[0],
        disclaimer: "Draft provision calculated from automated classifications using standard rates. Bank-approved IFRS 9 policy and independent review required before GL posting.",
      });
    } catch (error: unknown) {
      res.status(500).json({ message: safeErrorMessage(error) });
    }
  });

  // ── Classification History for a single account ───────────────────────────
  app.get("/api/npl/classifications/:creditAccountId", requireRole("admin", "super_admin", "lender", "regulator"), enforceDataSovereignty, async (req, res) => {
    try {
      const { organizationId, country } = requestScope(req);
      const result = await pool.query(`
        SELECT
          c.id, c.credit_account_id AS "creditAccountId", c.days_in_arrears AS "daysInArrears",
          c.current_balance AS "currentBalance", c.account_status AS "accountStatus",
          c.ifrs9_stage AS "ifrs9Stage", c.ifrs9_reasons AS "ifrs9Reasons",
          c.npl_stage AS "nplStage", c.npl_reasons AS "nplReasons",
          c.provision_amount AS "provisionAmount", c.provision_rate AS "provisionRate",
          c.collection_triggered AS "collectionTriggered", c.classified_at AS "classifiedAt",
          c.classified_by AS "classifiedBy"
        FROM credit_account_classifications c
        JOIN credit_accounts a ON a.id = c.credit_account_id
        JOIN borrowers b ON b.id = c.borrower_id
        WHERE c.credit_account_id = $1
          AND ($2::text IS NULL OR COALESCE(a.organization_id, b.organization_id) = $2)
          AND ($3::text IS NULL OR b.country = $3)
        ORDER BY c.classified_at DESC
        LIMIT 100
      `, [req.params.creditAccountId, organizationId || null, country || null]);

      res.json(result.rows);
    } catch (error: unknown) {
      res.status(500).json({ message: safeErrorMessage(error) });
    }
  });

  // ── Trigger manual classification ─────────────────────────────────────────
  app.post("/api/npl/classify-now", requireRole("admin", "super_admin", "lender"), enforceDataSovereignty, async (req, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) return res.status(401).json({ message: "Not authenticated" });

      const country = typeof req.query.country === "string" ? req.query.country : "Ghana";
      const start = Date.now();

      const result = await runNplClassification({ country, autoTriggerCollection: true });
      const summaryDate = new Date().toISOString().slice(0, 10);
      await generatePortfolioSummary(summaryDate, country);

      await storage.createAuditLog({
        action: "TRIGGER_NPL_CLASSIFICATION",
        entity: "npl_classification",
        entityId: "batch",
        userId,
        details: `Manual classification run for ${country}: ${result.classificationsInserted} classifications, ${result.migrationsInserted} migrations, ${result.collectionsTriggered} auto-collections`,
        ipAddress: req.ip || null,
      });

      res.json({
        triggeredBy: userId,
        durationMs: Date.now() - start,
        ...result,
      });
    } catch (error: unknown) {
      res.status(500).json({ message: safeErrorMessage(error) });
    }
  });
}
