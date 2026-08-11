import type { Express, Request } from "express";
import { z } from "zod";
import { pool } from "../db";
import { applyObservedNplEvent, calculateNplExposureWaterfall, NPL_CASE_STAGES, NPL_EVENT_TYPES } from "../npl-case-ledger";
import type { NplCaseStage, NplEventType } from "../npl-case-ledger";
import { GLOBAL_SCOPE, storage } from "../storage";
import { enforceDataSovereignty, getCountryFilter, getOrgScope, requireRole, safeErrorMessage } from "./middleware";

const openCaseSchema = z.object({
  creditAccountId: z.string().trim().min(1).max(100),
  openedDate: z.string().date().optional(),
  evidenceReference: z.string().trim().min(3).max(500),
  notes: z.string().trim().min(10).max(2_000),
});

const eventSchema = z.object({
  eventType: z.enum(NPL_EVENT_TYPES),
  eventDate: z.string().date(),
  amount: z.union([z.string(), z.number()]).optional(),
  stageAfter: z.enum(NPL_CASE_STAGES).optional(),
  evidenceReference: z.string().trim().max(500).optional(),
  notes: z.string().trim().min(10).max(2_000),
});

function requestScope(req: Request) {
  const organizationId = getOrgScope(req);
  const requestedCountry = getCountryFilter(req);
  return { organizationId, country: requestedCountry === GLOBAL_SCOPE ? undefined : requestedCountry };
}

function assertNotFuture(value: string, field: string) {
  if (value > new Date().toISOString().slice(0, 10)) throw new Error(`${field} cannot be in the future`);
}

function isAtRiskAccount(row: any) {
  const classification = String(row.assetClassification || "").toLowerCase();
  return Number(row.daysInArrears || 0) >= 30
    || ["delinquent", "default", "restructured", "written_off"].includes(String(row.accountStatus || ""))
    || ["substandard", "sub-standard", "doubtful", "loss", "npl", "non-performing"].includes(classification);
}

function initialStage(row: any): NplCaseStage {
  const classification = String(row.assetClassification || "").toLowerCase();
  return Number(row.daysInArrears || 0) >= 90 || ["default", "written_off"].includes(String(row.accountStatus || ""))
    || ["substandard", "sub-standard", "doubtful", "loss", "npl", "non-performing"].includes(classification)
    ? "npl" : "watchlist";
}

export function registerNplCaseLedgerRoutes(app: Express) {
  app.get("/api/npl-cases", requireRole("admin", "super_admin", "lender", "regulator"), enforceDataSovereignty, async (req, res) => {
    try {
      const { organizationId, country } = requestScope(req);
      const creditAccountId = typeof req.query.creditAccountId === "string" ? req.query.creditAccountId : null;
      const result = await pool.query(`
        SELECT c.id, c.credit_account_id AS "creditAccountId", c.borrower_id AS "borrowerId",
          c.collection_assignment_id AS "collectionAssignmentId", c.stage, c.status,
          c.baseline_exposure AS "baselineExposure", c.current_exposure AS "currentExposure", c.currency,
          c.owner_id AS "ownerId", u.full_name AS "ownerName", c.organization_id AS "organizationId", c.country,
          c.opened_at AS "openedAt", c.updated_at AS "updatedAt", a.account_number AS "accountNumber",
          COALESCE(b.company_name, CONCAT_WS(' ', b.first_name, b.last_name)) AS "borrowerName",
          COALESCE(ev.event_count, 0)::int AS "eventCount", ev.last_event_date AS "lastEventDate"
        FROM npl_cases c
        JOIN credit_accounts a ON a.id = c.credit_account_id
        JOIN borrowers b ON b.id = c.borrower_id
        LEFT JOIN users u ON u.id = c.owner_id
        LEFT JOIN LATERAL (
          SELECT COUNT(*) AS event_count, MAX(event_date) AS last_event_date FROM npl_case_events WHERE case_id = c.id
        ) ev ON true
        WHERE ($1::text IS NULL OR c.organization_id = $1) AND ($2::text IS NULL OR c.country = $2)
          AND ($3::text IS NULL OR c.credit_account_id = $3)
        ORDER BY c.current_exposure DESC, c.updated_at DESC
        LIMIT 500
      `, [organizationId || null, country || null, creditAccountId]);
      res.json(result.rows);
    } catch (error: any) {
      res.status(500).json({ message: safeErrorMessage(error) });
    }
  });

  app.post("/api/npl-cases", requireRole("admin", "super_admin", "lender"), enforceDataSovereignty, async (req, res) => {
    const client = await pool.connect();
    try {
      const input = openCaseSchema.parse(req.body);
      const userId = req.session?.userId;
      if (!userId) return res.status(401).json({ message: "Not authenticated" });
      const openedDate = input.openedDate || new Date().toISOString().slice(0, 10);
      assertNotFuture(openedDate, "openedDate");
      const { organizationId, country } = requestScope(req);
      const accountResult = await client.query(`
        SELECT a.id, a.borrower_id AS "borrowerId", a.current_balance AS "currentBalance", a.currency,
          a.status::text AS "accountStatus", COALESCE(a.days_in_arrears, 0) AS "daysInArrears",
          COALESCE(a.bog_asset_classification, a.asset_classification, '') AS "assetClassification",
          COALESCE(a.organization_id, b.organization_id) AS "organizationId", b.country,
          ca.id AS "collectionAssignmentId", ca.assigned_to AS "assignedTo"
        FROM credit_accounts a
        JOIN borrowers b ON b.id = a.borrower_id
        LEFT JOIN LATERAL (
          SELECT id, assigned_to FROM collection_assignments
          WHERE credit_account_id = a.id AND status IN ('open', 'in_progress', 'promised')
          ORDER BY created_at DESC LIMIT 1
        ) ca ON true
        WHERE a.id = $1 AND ($2::text IS NULL OR COALESCE(a.organization_id, b.organization_id) = $2)
          AND ($3::text IS NULL OR b.country = $3)
      `, [input.creditAccountId, organizationId || null, country || null]);
      const account = accountResult.rows[0];
      if (!account) return res.status(404).json({ message: "Credit account not found in the authorised scope" });
      if (!account.country) return res.status(409).json({ message: "The borrower country must be reconciled before opening an NPL case" });
      if (!account.currency) return res.status(409).json({ message: "The account currency must be reconciled before opening an NPL case" });
      if (!isAtRiskAccount(account)) return res.status(409).json({ message: "This facility does not currently meet the controlled watchlist or NPL entry criteria" });
      const baselineExposure = Number(account.currentBalance || 0) < 0 ? "0.00" : String(account.currentBalance || "0.00");
      if (Number(baselineExposure) <= 0) return res.status(409).json({ message: "A positive reconciled exposure is required before opening an NPL case" });
      const stage = initialStage(account);
      const opening = applyObservedNplEvent({ currentExposure: "0.00", eventType: "case_opened", amount: baselineExposure });
      await client.query("BEGIN");
      const created = await client.query(`
        INSERT INTO npl_cases
          (credit_account_id, borrower_id, collection_assignment_id, stage, status, baseline_exposure,
           current_exposure, currency, owner_id, organization_id, country, created_by, opened_at)
        VALUES ($1, $2, $3, $4, 'open', $5, $5, $6, $7, $8, $9, $10, $11::date)
        RETURNING id, credit_account_id AS "creditAccountId", stage, status, baseline_exposure AS "baselineExposure",
          current_exposure AS "currentExposure", currency, collection_assignment_id AS "collectionAssignmentId", opened_at AS "openedAt"
      `, [account.id, account.borrowerId, account.collectionAssignmentId, stage, opening.exposureAfter, account.currency,
        account.assignedTo || null, account.organizationId || null, account.country, userId, openedDate]);
      const nplCase = created.rows[0];
      await client.query(`
        INSERT INTO npl_case_events
          (case_id, sequence, event_type, event_date, amount, exposure_before, exposure_after,
           stage_before, stage_after, evidence_reference, notes, created_by)
        VALUES ($1, 1, 'case_opened', $2, $3, '0.00', $3, $4, $4, $5, $6, $7)
      `, [nplCase.id, openedDate, opening.amount, stage, input.evidenceReference, input.notes, userId]);
      await client.query("COMMIT");
      await storage.createAuditLog({
        action: "OPEN_NPL_CASE", entity: "npl_case", entityId: nplCase.id, userId,
        organizationId: account.organizationId || undefined,
        details: `Opened ${stage} case for credit account ${account.id}; exposure ${account.currency} ${opening.exposureAfter}; evidence ${input.evidenceReference}`,
        ipAddress: req.ip || null,
      });
      res.status(201).json(nplCase);
    } catch (error: any) {
      await client.query("ROLLBACK").catch(() => {});
      const status = error?.code === "23505" ? 409 : 400;
      res.status(status).json({ message: status === 409 ? "An NPL case already exists for this credit account" : safeErrorMessage(error, 400) });
    } finally {
      client.release();
    }
  });

  app.get("/api/npl-cases/:id/events", requireRole("admin", "super_admin", "lender", "regulator"), enforceDataSovereignty, async (req, res) => {
    try {
      const { organizationId, country } = requestScope(req);
      const result = await pool.query(`
        SELECT e.id, e.sequence, e.event_type AS "eventType", e.event_date AS "eventDate", e.amount,
          e.exposure_before AS "exposureBefore", e.exposure_after AS "exposureAfter",
          e.stage_before AS "stageBefore", e.stage_after AS "stageAfter", e.evidence_reference AS "evidenceReference",
          e.notes, e.created_by AS "createdBy", u.full_name AS "createdByName", e.created_at AS "createdAt"
        FROM npl_case_events e JOIN npl_cases c ON c.id = e.case_id LEFT JOIN users u ON u.id = e.created_by
        WHERE e.case_id = $1 AND ($2::text IS NULL OR c.organization_id = $2) AND ($3::text IS NULL OR c.country = $3)
        ORDER BY e.sequence DESC LIMIT 1_000
      `, [req.params.id, organizationId || null, country || null]);
      res.json(result.rows);
    } catch (error: any) {
      res.status(500).json({ message: safeErrorMessage(error) });
    }
  });

  app.post("/api/npl-cases/:id/events", requireRole("admin", "super_admin", "lender"), enforceDataSovereignty, async (req, res) => {
    const client = await pool.connect();
    try {
      const input = eventSchema.parse(req.body);
      if (input.eventType === "case_opened") return res.status(400).json({ message: "case_opened is generated only by the controlled case-opening workflow" });
      assertNotFuture(input.eventDate, "eventDate");
      const financial = ["npl_inflow_observed", "cash_recovery_observed", "legal_recovery_observed"].includes(input.eventType);
      if ((financial || input.eventType === "collection_activity_linked") && !input.evidenceReference?.trim()) {
        return res.status(400).json({ message: "An evidence reference is required for financial and linked collection events" });
      }
      if (input.eventType === "workflow_stage_changed" && !input.stageAfter) {
        return res.status(400).json({ message: "stageAfter is required for a workflow stage change" });
      }
      const userId = req.session?.userId;
      if (!userId) return res.status(401).json({ message: "Not authenticated" });
      const { organizationId, country } = requestScope(req);
      await client.query("BEGIN");
      const caseResult = await client.query(`
        SELECT id, current_exposure AS "currentExposure", currency, stage, status,
          organization_id AS "organizationId", country, credit_account_id AS "creditAccountId"
        FROM npl_cases WHERE id = $1 AND ($2::text IS NULL OR organization_id = $2)
          AND ($3::text IS NULL OR country = $3) FOR UPDATE
      `, [req.params.id, organizationId || null, country || null]);
      const nplCase = caseResult.rows[0];
      if (!nplCase) {
        await client.query("ROLLBACK");
        return res.status(404).json({ message: "NPL case not found in the authorised scope" });
      }
      const lastEvent = await client.query(`SELECT sequence, event_date AS "eventDate" FROM npl_case_events WHERE case_id = $1 ORDER BY sequence DESC LIMIT 1`, [nplCase.id]);
      if (lastEvent.rows[0]?.eventDate && input.eventDate < lastEvent.rows[0].eventDate) {
        throw new Error("Events cannot be backdated before the latest immutable case event");
      }
      if (input.eventType === "collection_activity_linked") {
        const linked = await client.query(`SELECT id FROM collection_assignments WHERE id = $1 AND credit_account_id = $2`, [input.evidenceReference, nplCase.creditAccountId]);
        if (!linked.rows[0]) throw new Error("The referenced collection assignment does not belong to this credit account");
      }
      const movement = applyObservedNplEvent({ currentExposure: nplCase.currentExposure, eventType: input.eventType as NplEventType, amount: input.amount });
      let stageAfter = (input.stageAfter || nplCase.stage) as NplCaseStage;
      let status = nplCase.status;
      if (input.eventType === "workflow_stage_changed" && stageAfter === "resolved" && movement.exposureAfter !== "0.00") {
        throw new Error("A positive-exposure case cannot be moved to the resolved workflow stage");
      }
      if (input.eventType === "npl_inflow_observed") { stageAfter = "npl"; status = "open"; }
      if (movement.exposureAfter === "0.00") { stageAfter = "resolved"; status = "resolved"; }
      else if (input.eventType === "legal_recovery_observed" && !input.stageAfter) stageAfter = "legal";
      const sequence = Number(lastEvent.rows[0]?.sequence || 0) + 1;
      const created = await client.query(`
        INSERT INTO npl_case_events
          (case_id, sequence, event_type, event_date, amount, exposure_before, exposure_after,
           stage_before, stage_after, evidence_reference, notes, created_by)
        VALUES ($1, $2, $3, $4, NULLIF($5, '0.00')::numeric, $6, $7, $8, $9, $10, $11, $12)
        RETURNING id, sequence, event_type AS "eventType", event_date AS "eventDate", amount,
          exposure_before AS "exposureBefore", exposure_after AS "exposureAfter", stage_after AS "stageAfter", created_at AS "createdAt"
      `, [nplCase.id, sequence, input.eventType, input.eventDate, movement.amount, movement.exposureBefore,
        movement.exposureAfter, nplCase.stage, stageAfter, input.evidenceReference || null, input.notes, userId]);
      await client.query(`UPDATE npl_cases SET current_exposure = $2, stage = $3, status = $4, updated_at = now() WHERE id = $1`, [nplCase.id, movement.exposureAfter, stageAfter, status]);
      await client.query("COMMIT");
      await storage.createAuditLog({
        action: "APPEND_NPL_CASE_EVENT", entity: "npl_case", entityId: nplCase.id, userId,
        organizationId: nplCase.organizationId || undefined,
        details: `Appended immutable ${input.eventType} sequence ${sequence}; exposure ${nplCase.currency} ${movement.exposureBefore} -> ${movement.exposureAfter}`,
        ipAddress: req.ip || null,
      });
      res.status(201).json(created.rows[0]);
    } catch (error: any) {
      await client.query("ROLLBACK").catch(() => {});
      res.status(400).json({ message: safeErrorMessage(error, 400) });
    } finally {
      client.release();
    }
  });

  app.get("/api/npl-cases/waterfall/summary", requireRole("admin", "super_admin", "lender", "regulator"), enforceDataSovereignty, async (req, res) => {
    try {
      const today = new Date().toISOString().slice(0, 10);
      const defaultStart = `${today.slice(0, 7)}-01`;
      const period = z.object({ start: z.string().date().default(defaultStart), end: z.string().date().default(today) }).parse(req.query);
      if (period.start > period.end) return res.status(400).json({ message: "Waterfall start must not be after end" });
      const days = (Date.parse(`${period.end}T00:00:00Z`) - Date.parse(`${period.start}T00:00:00Z`)) / 86_400_000;
      if (days > 731) return res.status(400).json({ message: "Waterfall period cannot exceed 24 months" });
      const { organizationId, country } = requestScope(req);
      const currencies = await pool.query(`SELECT DISTINCT currency FROM npl_cases WHERE ($1::text IS NULL OR organization_id = $1) AND ($2::text IS NULL OR country = $2) ORDER BY currency`, [organizationId || null, country || null]);
      const series = [];
      for (const { currency } of currencies.rows) {
        const [opening, closing, authoritative, events] = await Promise.all([
          pool.query(`SELECT COALESCE(SUM(exposure_after), 0)::text AS value FROM (SELECT DISTINCT ON (e.case_id) e.case_id, e.exposure_after FROM npl_case_events e JOIN npl_cases c ON c.id=e.case_id WHERE e.event_date < $1 AND c.currency=$2 AND ($3::text IS NULL OR c.organization_id=$3) AND ($4::text IS NULL OR c.country=$4) ORDER BY e.case_id, e.sequence DESC) x`, [period.start, currency, organizationId || null, country || null]),
          pool.query(`SELECT COALESCE(SUM(exposure_after), 0)::text AS value FROM (SELECT DISTINCT ON (e.case_id) e.case_id, e.exposure_after FROM npl_case_events e JOIN npl_cases c ON c.id=e.case_id WHERE e.event_date <= $1 AND c.currency=$2 AND ($3::text IS NULL OR c.organization_id=$3) AND ($4::text IS NULL OR c.country=$4) ORDER BY e.case_id, e.sequence DESC) x`, [period.end, currency, organizationId || null, country || null]),
          pool.query(`SELECT COALESCE(SUM(GREATEST(COALESCE(a.current_balance, 0), 0)), 0)::text AS value FROM npl_cases c JOIN credit_accounts a ON a.id=c.credit_account_id WHERE c.currency=$1 AND ($2::text IS NULL OR c.organization_id=$2) AND ($3::text IS NULL OR c.country=$3)`, [currency, organizationId || null, country || null]),
          pool.query(`SELECT e.event_type AS "eventType", e.amount::text FROM npl_case_events e JOIN npl_cases c ON c.id=e.case_id WHERE e.event_date BETWEEN $1 AND $2 AND c.currency=$3 AND ($4::text IS NULL OR c.organization_id=$4) AND ($5::text IS NULL OR c.country=$5) ORDER BY e.event_date, e.sequence`, [period.start, period.end, currency, organizationId || null, country || null]),
        ]);
        series.push({ currency, ...calculateNplExposureWaterfall({ openingExposure: opening.rows[0].value, closingExposure: closing.rows[0].value, authoritativeCreditExposure: authoritative.rows[0].value, events: events.rows }) });
      }
      res.json({ generatedAt: new Date().toISOString(), period, consolidated: series.length <= 1, series, methodology: "Append-only observed case events by currency. Currencies are never combined without an approved conversion control." });
    } catch (error: any) {
      res.status(400).json({ message: safeErrorMessage(error, 400) });
    }
  });
}
