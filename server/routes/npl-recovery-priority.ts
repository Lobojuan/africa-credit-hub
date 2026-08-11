/**
 * NPL Recovery Priority Ranking Engine — API routes
 *
 * POST /api/npl-cases/:id/priority          recalculate & store priority
 * GET  /api/npl-priority-queue              paginated priority-sorted queue
 * GET  /api/npl-cases/:id/priority/history  audit trail for one case
 */

import type { Express } from "express";
import { db } from "../db";
import { nplCases, nplCasePriorityEvents, users } from "../../shared/schema";
import {
  calculateRecoveryPriorityScore,
  type RecoveryPriorityBand,
} from "../npl-recovery-priority";
import {
  enforceDataSovereignty,
  requireRole,
  getOrgScope,
  getCountryFilter,
} from "./middleware";
import { eq, desc, and, inArray, sql } from "drizzle-orm";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Convert a decimal string (e.g. "12345.67") to BigInt minor units. */
function decimalToMinor(value: string): bigint {
  const trimmed = (value ?? "0").trim();
  const dotIdx = trimmed.indexOf(".");
  if (dotIdx === -1) {
    return BigInt(trimmed) * 100n;
  }
  const intPart = trimmed.slice(0, dotIdx);
  const fracPart = trimmed.slice(dotIdx + 1).padEnd(2, "0").slice(0, 2);
  if (!/^\d+$/.test(fracPart)) {
    throw new Error(`Invalid decimal value: ${value}`);
  }
  return BigInt(intPart) * 100n + BigInt(fracPart);
}

// ---------------------------------------------------------------------------
// Route registration
// ---------------------------------------------------------------------------

export function registerNplRecoveryPriorityRoutes(app: Express): void {
  /**
   * POST /api/npl-cases/:id/priority
   *
   * Recalculates the recovery priority score for a single NPL case and
   * appends an immutable audit event.
   *
   * Required role: credit_officer or above
   */
  app.post(
    "/api/npl-cases/:id/priority",
    enforceDataSovereignty,
    requireRole("credit_officer", "risk_manager", "admin", "super_admin"),
    async (req, res) => {
      try {
        const id = req.params.id as string;
        const orgScope = getOrgScope(req);
        const countryFilter = getCountryFilter(req);

        if (!req.session.userId) {
          res.status(401).json({ error: "Not authenticated" });
          return;
        }
        const userId = req.session.userId as string;

        await db.transaction(async (tx) => {
          // Build WHERE conditions
          const conditions = [
            eq(nplCases.id, id),
            ...(orgScope ? [eq(nplCases.organisationId, orgScope)] : []),
            ...(countryFilter ? [eq(nplCases.countryCode, countryFilter)] : []),
          ];

          const [nplCase] = await tx
            .select()
            .from(nplCases)
            .where(and(...conditions))
            .limit(1);

          if (!nplCase) {
            res.status(404).json({ error: "NPL case not found" });
            return;
          }

          // Resolve inputs — body overrides take precedence over stored data
          const outstandingPrincipalMinor = decimalToMinor(
            nplCase.outstandingPrincipal ?? "0",
          );

          const rawCollateralValue =
            req.body.collateralValueMinor != null
              ? String(req.body.collateralValueMinor)
              : (nplCase.collateralValue ?? "0");
          const collateralValueMinor = decimalToMinor(rawCollateralValue);

          const collateralValuationAgeDays =
            req.body.collateralValuationAgeDays != null
              ? Number(req.body.collateralValuationAgeDays)
              : (nplCase.collateralValuationAgeDays ?? 0);

          const daysSinceLastPayment = nplCase.daysSinceLastPayment ?? 0;
          const priorRestructureCount = nplCase.restructureCount ?? 0;
          const bogClassification = (nplCase.bogClassification ?? "OLEM") as
            | "OLEM"
            | "SUBSTANDARD"
            | "DOUBTFUL"
            | "LOSS";
          const hasLegalFlag = nplCase.hasLegalFlag ?? false;

          const result = calculateRecoveryPriorityScore({
            daysSinceLastPayment,
            outstandingPrincipalMinor,
            collateralValueMinor,
            collateralValuationAgeDays,
            priorRestructureCount,
            bogClassification,
            hasLegalFlag,
          });

          // Update the case with latest score
          await tx
            .update(nplCases)
            .set({
              recoveryPriorityScore: result.score,
              recoveryPriorityBand: result.band,
              recoveryPriorityCalculatedAt: new Date(),
              updatedAt: new Date(),
            })
            .where(eq(nplCases.id, id));

          // Append immutable audit event
          await tx.insert(nplCasePriorityEvents).values({
            caseId: id,
            score: result.score,
            band: result.band,
            factorBreakdown: result.factorBreakdown,
            calculatedBy: userId,
            calculatedAt: new Date(),
          });

          res.json({
            caseId: id,
            score: result.score,
            band: result.band,
            factorBreakdown: result.factorBreakdown,
          });
        });
      } catch (err) {
        console.error("[npl-priority] POST /:id/priority error:", err);
        res.status(500).json({ error: "Failed to calculate priority score" });
      }
    },
  );

  /**
   * GET /api/npl-priority-queue
   *
   * Returns NPL cases sorted by priority band (legal-track first, then by
   * descending score within each band).
   */
  app.get(
    "/api/npl-priority-queue",
    enforceDataSovereignty,
    requireRole("credit_officer", "risk_manager", "admin", "super_admin"),
    async (req, res) => {
      try {
        const orgScope = getOrgScope(req);
        const countryFilter = getCountryFilter(req);
        const band = req.query.band as RecoveryPriorityBand | undefined;
        const limit = Math.min(Number(req.query.limit ?? 50), 200);
        const offset = Number(req.query.offset ?? 0);

        const BAND_ORDER = sql<number>`
          CASE recovery_priority_band
            WHEN 'legal-track' THEN 0
            WHEN 'high'        THEN 1
            WHEN 'medium'      THEN 2
            WHEN 'low'         THEN 3
            ELSE                    4
          END
        `;

        const conditions = [
          ...(orgScope ? [eq(nplCases.organisationId, orgScope)] : []),
          ...(countryFilter ? [eq(nplCases.countryCode, countryFilter)] : []),
          ...(band ? [eq(nplCases.recoveryPriorityBand, band)] : []),
        ];

        const rows = await db
          .select({
            id: nplCases.id,
            borrowerName: nplCases.borrowerName,
            outstandingPrincipal: nplCases.outstandingPrincipal,
            recoveryPriorityScore: nplCases.recoveryPriorityScore,
            recoveryPriorityBand: nplCases.recoveryPriorityBand,
            recoveryPriorityCalculatedAt: nplCases.recoveryPriorityCalculatedAt,
            bogClassification: nplCases.bogClassification,
            hasLegalFlag: nplCases.hasLegalFlag,
            countryCode: nplCases.countryCode,
          })
          .from(nplCases)
          .where(conditions.length ? and(...conditions) : undefined)
          .orderBy(BAND_ORDER, desc(nplCases.recoveryPriorityScore))
          .limit(limit)
          .offset(offset);

        res.json({
          items: rows,
          limit,
          offset,
        });
      } catch (err) {
        console.error("[npl-priority] GET /priority-queue error:", err);
        res.status(500).json({ error: "Failed to fetch priority queue" });
      }
    },
  );

  /**
   * GET /api/npl-cases/:id/priority/history
   *
   * Returns the append-only audit trail of priority recalculations
   * for a single NPL case (newest first).
   */
  app.get(
    "/api/npl-cases/:id/priority/history",
    enforceDataSovereignty,
    requireRole("credit_officer", "risk_manager", "admin", "super_admin"),
    async (req, res) => {
      try {
        const id = req.params.id as string;
        const orgScope = getOrgScope(req);
        const countryFilter = getCountryFilter(req);
        const limit = Math.min(Number(req.query.limit ?? 20), 100);
        const offset = Number(req.query.offset ?? 0);

        // Verify the case exists and is in scope
        const caseConditions = [
          eq(nplCases.id, id),
          ...(orgScope ? [eq(nplCases.organisationId, orgScope)] : []),
          ...(countryFilter ? [eq(nplCases.countryCode, countryFilter)] : []),
        ];

        const [nplCase] = await db
          .select({ id: nplCases.id })
          .from(nplCases)
          .where(and(...caseConditions))
          .limit(1);

        if (!nplCase) {
          res.status(404).json({ error: "NPL case not found" });
          return;
        }

        const events = await db
          .select({
            id: nplCasePriorityEvents.id,
            score: nplCasePriorityEvents.score,
            band: nplCasePriorityEvents.band,
            factorBreakdown: nplCasePriorityEvents.factorBreakdown,
            calculatedAt: nplCasePriorityEvents.calculatedAt,
            calculatedBy: {
              id: users.id,
              fullName: users.fullName,
              email: users.email,
            },
          })
          .from(nplCasePriorityEvents)
          .innerJoin(users, eq(nplCasePriorityEvents.calculatedBy, users.id))
          .where(eq(nplCasePriorityEvents.caseId, id))
          .orderBy(desc(nplCasePriorityEvents.calculatedAt))
          .limit(limit)
          .offset(offset);

        res.json({ caseId: id, events, limit, offset });
      } catch (err) {
        console.error("[npl-priority] GET /:id/priority/history error:", err);
        res.status(500).json({ error: "Failed to fetch priority history" });
      }
    },
  );
}
