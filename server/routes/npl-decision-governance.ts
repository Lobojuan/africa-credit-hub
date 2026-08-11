import type { Express, Request } from "express";
import type { PoolClient } from "pg";
import { z } from "zod";
import { pool } from "../db";
import { NPL_DECISION_TYPES, normalizeNplDecisionAmount, nplDecisionEventType } from "../npl-decision-governance";
import { GLOBAL_SCOPE, storage } from "../storage";
import { enforceDataSovereignty, getCountryFilter, getOrgScope, requireRole, safeErrorMessage } from "./middleware";

const proposalSchema = z.object({
  decisionType: z.enum(NPL_DECISION_TYPES),
  proposedAmount: z.union([z.string(), z.number()]).optional(),
  effectiveDate: z.string().date(),
  rationale: z.string().trim().min(20).max(4_000),
  policyReference: z.string().trim().min(3).max(500),
  evidenceReference: z.string().trim().min(3).max(500),
});

const reviewSchema = z.object({
  decision: z.enum(["approved", "rejected"]),
  reviewNotes: z.string().trim().min(10).max(2_000),
});

const executionSchema = z.object({
  executionDate: z.string().date(),
  executionEvidenceReference: z.string().trim().min(3).max(500),
  executionNotes: z.string().trim().min(10).max(2_000),
});

function requestScope(req: Request) {
  const organizationId = getOrgScope(req);
  const requestedCountry = getCountryFilter(req);
  return { organizationId, country: requestedCountry === GLOBAL_SCOPE ? undefined : requestedCountry };
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function assertEffectiveDate(value: string) {
  const current = today();
  const max = new Date(`${current}T00:00:00Z`);
  max.setUTCDate(max.getUTCDate() + 366);
  if (value < current) throw new Error("The proposed effective date cannot be in the past");
  if (value > max.toISOString().slice(0, 10)) throw new Error("The proposed effective date cannot be more than 12 months ahead");
}

async function loadCaseForUpdate(client: PoolClient, caseId: string, organizationId?: string, country?: string) {
  const result = await client.query(`
    SELECT c.id, c.credit_account_id AS "creditAccountId", c.current_exposure AS "currentExposure",
      c.currency, c.stage, c.status, c.organization_id AS "organizationId", c.country,
      a.account_number AS "accountNumber",
      COALESCE(b.company_name, CONCAT_WS(' ', b.first_name, b.last_name)) AS "borrowerName"
    FROM npl_cases c
    JOIN credit_accounts a ON a.id = c.credit_account_id
    JOIN borrowers b ON b.id = c.borrower_id
    WHERE c.id = $1 AND ($2::text IS NULL OR c.organization_id = $2)
      AND ($3::text IS NULL OR c.country = $3)
    FOR UPDATE OF c
  `, [caseId, organizationId || null, country || null]);
  return result.rows[0];
}

async function appendDecisionEvent(client: PoolClient, input: {
  nplCase: any;
  eventType: ReturnType<typeof nplDecisionEventType>;
  evidenceReference: string;
  notes: string;
  userId: string;
}) {
  const latest = await client.query(`SELECT COALESCE(MAX(sequence), 0)::int AS sequence FROM npl_case_events WHERE case_id = $1`, [input.nplCase.id]);
  const sequence = Number(latest.rows[0]?.sequence || 0) + 1;
  await client.query(`
    INSERT INTO npl_case_events
      (case_id, sequence, event_type, event_date, amount, exposure_before, exposure_after,
       stage_before, stage_after, evidence_reference, notes, created_by)
    VALUES ($1, $2, $3, $4, NULL, $5, $5, $6, $6, $7, $8, $9)
  `, [input.nplCase.id, sequence, input.eventType, today(), input.nplCase.currentExposure,
    input.nplCase.stage, input.evidenceReference, input.notes, input.userId]);
  await client.query(`UPDATE npl_cases SET updated_at = now() WHERE id = $1`, [input.nplCase.id]);
  return sequence;
}

export function registerNplDecisionGovernanceRoutes(app: Express) {
  app.get("/api/npl-cases/:id/decisions", requireRole("admin", "super_admin", "lender", "regulator"), enforceDataSovereignty, async (req, res) => {
    try {
      const { organizationId, country } = requestScope(req);
      const caseResult = await pool.query(`
        SELECT c.id, c.credit_account_id AS "creditAccountId", c.current_exposure AS "currentExposure",
          c.currency, c.stage, c.status, a.account_number AS "accountNumber",
          COALESCE(b.company_name, CONCAT_WS(' ', b.first_name, b.last_name)) AS "borrowerName"
        FROM npl_cases c JOIN credit_accounts a ON a.id=c.credit_account_id JOIN borrowers b ON b.id=c.borrower_id
        WHERE c.id=$1 AND ($2::text IS NULL OR c.organization_id=$2) AND ($3::text IS NULL OR c.country=$3)
      `, [req.params.id, organizationId || null, country || null]);
      if (!caseResult.rows[0]) return res.status(404).json({ message: "NPL case not found in the authorised scope" });
      const decisions = await pool.query(`
        SELECT d.id, d.case_id AS "caseId", d.decision_type AS "decisionType", d.status,
          d.proposed_amount AS "proposedAmount", d.effective_date AS "effectiveDate", d.rationale,
          d.policy_reference AS "policyReference", d.evidence_reference AS "evidenceReference",
          d.requested_by AS "requestedBy", maker.full_name AS "requestedByName", d.reviewed_by AS "reviewedBy",
          checker.full_name AS "reviewedByName", d.review_notes AS "reviewNotes", d.reviewed_at AS "reviewedAt",
          d.execution_evidence_reference AS "executionEvidenceReference", d.execution_notes AS "executionNotes",
          d.executed_by AS "executedBy", executor.full_name AS "executedByName", d.executed_at AS "executedAt",
          d.created_at AS "createdAt", d.updated_at AS "updatedAt"
        FROM npl_decision_proposals d
        LEFT JOIN users maker ON maker.id=d.requested_by
        LEFT JOIN users checker ON checker.id=d.reviewed_by
        LEFT JOIN users executor ON executor.id=d.executed_by
        WHERE d.case_id=$1 AND ($2::text IS NULL OR d.organization_id=$2) AND ($3::text IS NULL OR d.country=$3)
        ORDER BY d.created_at DESC
      `, [req.params.id, organizationId || null, country || null]);
      res.json({ case: caseResult.rows[0], decisions: decisions.rows, boundary: "Approval authorises a bank action; it does not post to the credit account, IFRS 9 engine, provision or general ledger." });
    } catch (error: any) {
      res.status(500).json({ message: safeErrorMessage(error) });
    }
  });

  app.post("/api/npl-cases/:id/decisions", requireRole("admin", "super_admin", "lender"), enforceDataSovereignty, async (req, res) => {
    const client = await pool.connect();
    try {
      const input = proposalSchema.parse(req.body);
      assertEffectiveDate(input.effectiveDate);
      const userId = req.session?.userId;
      if (!userId) return res.status(401).json({ message: "Not authenticated" });
      const { organizationId, country } = requestScope(req);
      await client.query("BEGIN");
      const nplCase = await loadCaseForUpdate(client, String(req.params.id), organizationId, country);
      if (!nplCase) { await client.query("ROLLBACK"); return res.status(404).json({ message: "NPL case not found in the authorised scope" }); }
      if (nplCase.status !== "open") throw new Error("Only an open NPL case can receive a remediation proposal");
      const proposedAmount = normalizeNplDecisionAmount({ decisionType: input.decisionType, proposedAmount: input.proposedAmount, currentExposure: nplCase.currentExposure });
      const created = await client.query(`
        INSERT INTO npl_decision_proposals
          (case_id, decision_type, proposed_amount, effective_date, rationale, policy_reference,
           evidence_reference, requested_by, organization_id, country)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
        RETURNING id, case_id AS "caseId", decision_type AS "decisionType", status,
          proposed_amount AS "proposedAmount", effective_date AS "effectiveDate", created_at AS "createdAt"
      `, [nplCase.id, input.decisionType, proposedAmount, input.effectiveDate, input.rationale,
        input.policyReference, input.evidenceReference, userId, nplCase.organizationId || null, nplCase.country]);
      const proposal = created.rows[0];
      const amountText = proposedAmount ? `; proposed ${nplCase.currency} ${proposedAmount}` : "";
      await appendDecisionEvent(client, {
        nplCase, eventType: nplDecisionEventType("submitted"), evidenceReference: input.evidenceReference,
        notes: `Submitted ${input.decisionType} proposal ${proposal.id}${amountText}; effective ${input.effectiveDate}; policy ${input.policyReference}. ${input.rationale}`,
        userId,
      });
      await client.query("COMMIT");
      await storage.createAuditLog({ action: "SUBMIT_NPL_DECISION", entity: "npl_decision_proposal", entityId: proposal.id, userId,
        organizationId: nplCase.organizationId || undefined, details: `Submitted ${input.decisionType} for case ${nplCase.id}; independent approval required`, ipAddress: req.ip || null });
      res.status(201).json(proposal);
    } catch (error: any) {
      await client.query("ROLLBACK").catch(() => {});
      const duplicate = error?.code === "23505";
      res.status(duplicate ? 409 : 400).json({ message: duplicate ? "A pending proposal of this type already exists for the case" : safeErrorMessage(error, 400) });
    } finally { client.release(); }
  });

  app.post("/api/npl-decisions/:id/review", requireRole("admin", "super_admin", "regulator"), enforceDataSovereignty, async (req, res) => {
    const client = await pool.connect();
    try {
      const input = reviewSchema.parse(req.body);
      const userId = req.session?.userId;
      if (!userId) return res.status(401).json({ message: "Not authenticated" });
      const { organizationId, country } = requestScope(req);
      await client.query("BEGIN");
      const proposalResult = await client.query(`
        SELECT d.*, d.case_id AS "caseId", d.decision_type AS "decisionType", d.requested_by AS "requestedBy",
          d.evidence_reference AS "evidenceReference"
        FROM npl_decision_proposals d JOIN npl_cases c ON c.id=d.case_id
        WHERE d.id=$1 AND ($2::text IS NULL OR d.organization_id=$2) AND ($3::text IS NULL OR d.country=$3)
        FOR UPDATE OF d
      `, [req.params.id, organizationId || null, country || null]);
      const proposal = proposalResult.rows[0];
      if (!proposal) { await client.query("ROLLBACK"); return res.status(404).json({ message: "NPL decision proposal not found in the authorised scope" }); }
      if (proposal.requestedBy === userId) { await client.query("ROLLBACK"); return res.status(403).json({ message: "Maker cannot be the checker for an NPL decision" }); }
      if (proposal.status !== "pending") throw new Error("This NPL decision proposal has already been reviewed");
      const nplCase = await loadCaseForUpdate(client, proposal.caseId, organizationId, country);
      if (!nplCase) throw new Error("The linked NPL case is no longer available in this scope");
      await client.query(`UPDATE npl_decision_proposals SET status=$2, reviewed_by=$3, review_notes=$4, reviewed_at=now(), updated_at=now() WHERE id=$1`,
        [proposal.id, input.decision, userId, input.reviewNotes]);
      await appendDecisionEvent(client, {
        nplCase, eventType: nplDecisionEventType(input.decision), evidenceReference: proposal.evidenceReference,
        notes: `${input.decision === "approved" ? "Approved" : "Rejected"} ${proposal.decisionType} proposal ${proposal.id}. Checker rationale: ${input.reviewNotes}`,
        userId,
      });
      await client.query("COMMIT");
      await storage.createAuditLog({ action: input.decision === "approved" ? "APPROVE_NPL_DECISION" : "REJECT_NPL_DECISION",
        entity: "npl_decision_proposal", entityId: proposal.id, userId, organizationId: nplCase.organizationId || undefined,
        details: `${input.decision} ${proposal.decisionType}; no credit-account or accounting entry was posted`, ipAddress: req.ip || null });
      res.json({ id: proposal.id, status: input.decision, reviewedBy: userId, postingPermitted: false });
    } catch (error: any) {
      await client.query("ROLLBACK").catch(() => {});
      res.status(400).json({ message: safeErrorMessage(error, 400) });
    } finally { client.release(); }
  });

  app.post("/api/npl-decisions/:id/execution", requireRole("admin", "super_admin", "lender"), enforceDataSovereignty, async (req, res) => {
    const client = await pool.connect();
    try {
      const input = executionSchema.parse(req.body);
      if (input.executionDate > today()) throw new Error("Execution evidence cannot be dated in the future");
      const userId = req.session?.userId;
      if (!userId) return res.status(401).json({ message: "Not authenticated" });
      const { organizationId, country } = requestScope(req);
      await client.query("BEGIN");
      const proposalResult = await client.query(`
        SELECT d.*, d.case_id AS "caseId", d.decision_type AS "decisionType", d.reviewed_at AS "reviewedAt",
          d.reviewed_by AS "reviewedBy"
        FROM npl_decision_proposals d
        WHERE d.id=$1 AND ($2::text IS NULL OR d.organization_id=$2) AND ($3::text IS NULL OR d.country=$3)
        FOR UPDATE
      `, [req.params.id, organizationId || null, country || null]);
      const proposal = proposalResult.rows[0];
      if (!proposal) { await client.query("ROLLBACK"); return res.status(404).json({ message: "NPL decision proposal not found in the authorised scope" }); }
      if (proposal.status !== "approved") throw new Error("Only an approved NPL decision can receive execution evidence");
      if (proposal.reviewedBy === userId) throw new Error("The checker cannot record execution of their own approval");
      const reviewedDate = proposal.reviewedAt ? new Date(proposal.reviewedAt).toISOString().slice(0, 10) : null;
      if (reviewedDate && input.executionDate < reviewedDate) throw new Error("Execution evidence cannot pre-date the independent approval");
      const nplCase = await loadCaseForUpdate(client, proposal.caseId, organizationId, country);
      if (!nplCase) throw new Error("The linked NPL case is no longer available in this scope");
      await client.query(`UPDATE npl_decision_proposals SET status='execution_recorded', execution_evidence_reference=$2,
        execution_notes=$3, executed_by=$4, executed_at=$5::date, updated_at=now() WHERE id=$1`,
        [proposal.id, input.executionEvidenceReference, input.executionNotes, userId, input.executionDate]);
      await appendDecisionEvent(client, {
        nplCase, eventType: nplDecisionEventType("execution_recorded"), evidenceReference: input.executionEvidenceReference,
        notes: `Recorded bank execution evidence for approved ${proposal.decisionType} proposal ${proposal.id}. ${input.executionNotes} Credit-account and accounting reconciliation remain required.`,
        userId,
      });
      await client.query("COMMIT");
      await storage.createAuditLog({ action: "RECORD_NPL_DECISION_EXECUTION", entity: "npl_decision_proposal", entityId: proposal.id,
        userId, organizationId: nplCase.organizationId || undefined,
        details: `Recorded execution evidence for ${proposal.decisionType}; authoritative account reconciliation still required`, ipAddress: req.ip || null });
      res.json({ id: proposal.id, status: "execution_recorded", executionDate: input.executionDate, reconciliationRequired: true });
    } catch (error: any) {
      await client.query("ROLLBACK").catch(() => {});
      res.status(400).json({ message: safeErrorMessage(error, 400) });
    } finally { client.release(); }
  });
}
