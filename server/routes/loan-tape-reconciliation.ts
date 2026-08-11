import type { Express, Request } from "express";
import { z } from "zod";
import { pool } from "../db";
import { reconcileLoanTape, validateMapping } from "../loan-tape-reconciliation";
import { GLOBAL_SCOPE, storage } from "../storage";
import {
  enforceDataSovereignty,
  getCountryFilter,
  getOrgScope,
  requireRole,
  requireWriteCountry,
  safeErrorMessage,
} from "./middleware";

const profileSchema = z.object({
  name: z.string().trim().min(3).max(120),
  bankName: z.string().trim().min(2).max(160),
  sourceSystem: z.string().trim().min(2).max(120),
  version: z.string().trim().min(1).max(40),
  fieldMappings: z.record(z.string().trim().min(1), z.string().trim().min(1)),
  validationRules: z.object({
    collateralValuationMaxAgeDays: z.coerce.number().int().min(1).max(3_650).optional(),
  }).strict().default({}),
});

const profileReviewSchema = z.object({
  decision: z.enum(["approved", "rejected"]),
  reviewNotes: z.string().trim().min(10).max(2_000),
});

const validationSchema = z.object({
  mappingProfileId: z.string().uuid(),
  reportingDate: z.string().date(),
  originalFilename: z.string().trim().min(1).max(255).refine((name) => name.toLowerCase().endsWith(".csv"), "A CSV filename is required"),
  csvData: z.string().min(10).max(4_500_000),
});

const resolutionSchema = z.object({
  status: z.enum(["resolved", "waived"]),
  resolutionNote: z.string().trim().min(10).max(2_000),
});

function scope(req: Request) {
  const organizationId = getOrgScope(req);
  const requestedCountry = getCountryFilter(req);
  const country = requestedCountry === GLOBAL_SCOPE ? undefined : requestedCountry;
  return { organizationId, country };
}

function requireScopedOrganization(req: Request) {
  const organizationId = getOrgScope(req);
  if (!organizationId) {
    throw new Error("Select an organization before managing a bank loan-tape mapping");
  }
  return organizationId;
}

export function registerLoanTapeReconciliationRoutes(app: Express) {
  app.get("/api/loan-tape-reconciliation/profiles", requireRole("admin", "super_admin", "lender", "regulator"), enforceDataSovereignty, async (req, res) => {
    try {
      const { organizationId, country } = scope(req);
      const result = await pool.query(`
        SELECT id, organization_id AS "organizationId", country, name, bank_name AS "bankName",
          source_system AS "sourceSystem", version, field_mappings AS "fieldMappings",
          validation_rules AS "validationRules", status, created_by AS "createdBy",
          reviewed_by AS "reviewedBy", review_notes AS "reviewNotes", reviewed_at AS "reviewedAt",
          created_at AS "createdAt", updated_at AS "updatedAt"
        FROM bank_mapping_profiles
        WHERE ($1::text IS NULL OR organization_id = $1)
          AND ($2::text IS NULL OR country = $2)
        ORDER BY created_at DESC
        LIMIT 100
      `, [organizationId || null, country || null]);
      res.json(result.rows);
    } catch (error: any) {
      res.status(500).json({ message: safeErrorMessage(error) });
    }
  });

  app.post("/api/loan-tape-reconciliation/profiles", requireRole("admin", "super_admin", "lender"), enforceDataSovereignty, async (req, res) => {
    try {
      const payload = profileSchema.parse(req.body);
      validateMapping(payload.fieldMappings);
      const organizationId = requireScopedOrganization(req);
      const requestedCountry = getCountryFilter(req);
      const country = requireWriteCountry(requestedCountry === GLOBAL_SCOPE ? "Ghana" : requestedCountry, "createLoanTapeMappingProfile");
      const userId = req.session?.userId;
      if (!userId) return res.status(401).json({ message: "Not authenticated" });
      const result = await pool.query(`
        INSERT INTO bank_mapping_profiles
          (organization_id, country, name, bank_name, source_system, version, field_mappings, validation_rules, created_by)
        VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8::jsonb, $9)
        RETURNING id, status, created_at AS "createdAt"
      `, [organizationId, country, payload.name, payload.bankName, payload.sourceSystem, payload.version,
        JSON.stringify(payload.fieldMappings), JSON.stringify(payload.validationRules), userId]);
      await storage.createAuditLog({
        action: "CREATE_LOAN_TAPE_MAPPING_PROFILE",
        entity: "bank_mapping_profile",
        entityId: result.rows[0].id,
        userId,
        organizationId,
        details: `Created pending ${payload.bankName} mapping profile ${payload.name} version ${payload.version} for independent review`,
        ipAddress: req.ip || null,
      });
      res.status(201).json(result.rows[0]);
    } catch (error: any) {
      const status = error?.code === "23505" ? 409 : 400;
      res.status(status).json({ message: status === 409 ? "That mapping profile version already exists" : safeErrorMessage(error, 400) });
    }
  });

  app.patch("/api/loan-tape-reconciliation/profiles/:id/review", requireRole("admin", "super_admin", "regulator"), enforceDataSovereignty, async (req, res) => {
    try {
      const payload = profileReviewSchema.parse(req.body);
      const reviewerId = req.session?.userId;
      if (!reviewerId) return res.status(401).json({ message: "Not authenticated" });
      const { organizationId, country } = scope(req);
      const existing = await pool.query(`
        SELECT id, created_by AS "createdBy", status, organization_id AS "organizationId", country
        FROM bank_mapping_profiles
        WHERE id = $1 AND ($2::text IS NULL OR organization_id = $2) AND ($3::text IS NULL OR country = $3)
      `, [req.params.id, organizationId || null, country || null]);
      const profile = existing.rows[0];
      if (!profile) return res.status(404).json({ message: "Mapping profile not found in the authorised scope" });
      if (profile.status !== "pending") return res.status(409).json({ message: "Only pending mapping profiles can be reviewed" });
      if (profile.createdBy === reviewerId) return res.status(409).json({ message: "Maker-checker control requires a different user to review this mapping" });
      const updated = await pool.query(`
        UPDATE bank_mapping_profiles
        SET status = $2, reviewed_by = $3, review_notes = $4, reviewed_at = now(), updated_at = now()
        WHERE id = $1
        RETURNING id, status, reviewed_at AS "reviewedAt"
      `, [profile.id, payload.decision, reviewerId, payload.reviewNotes]);
      await storage.createAuditLog({
        action: `${payload.decision.toUpperCase()}_LOAN_TAPE_MAPPING_PROFILE`,
        entity: "bank_mapping_profile",
        entityId: profile.id,
        userId: reviewerId,
        organizationId: profile.organizationId,
        details: `${payload.decision} mapping profile after independent review: ${payload.reviewNotes}`,
        ipAddress: req.ip || null,
      });
      res.json(updated.rows[0]);
    } catch (error: any) {
      res.status(400).json({ message: safeErrorMessage(error, 400) });
    }
  });

  app.post("/api/loan-tape-reconciliation/validate", requireRole("admin", "super_admin", "lender"), enforceDataSovereignty, async (req, res) => {
    const client = await pool.connect();
    try {
      const payload = validationSchema.parse(req.body);
      const organizationId = requireScopedOrganization(req);
      const requestedCountry = getCountryFilter(req);
      const country = requireWriteCountry(requestedCountry === GLOBAL_SCOPE ? "Ghana" : requestedCountry, "validateLoanTape");
      const userId = req.session?.userId;
      if (!userId) return res.status(401).json({ message: "Not authenticated" });
      const profileResult = await client.query(`
        SELECT id, field_mappings AS "fieldMappings", validation_rules AS "validationRules", status
        FROM bank_mapping_profiles
        WHERE id = $1 AND organization_id = $2 AND country = $3
      `, [payload.mappingProfileId, organizationId, country]);
      const profile = profileResult.rows[0];
      if (!profile) return res.status(404).json({ message: "Mapping profile not found in the authorised scope" });
      if (profile.status !== "approved") return res.status(409).json({ message: "The mapping profile must pass independent approval before it can validate a loan tape" });
      const result = reconcileLoanTape({
        csv: payload.csvData,
        fieldMappings: profile.fieldMappings,
        reportingDate: payload.reportingDate,
        rules: profile.validationRules,
      });
      await client.query("BEGIN");
      const created = await client.query(`
        INSERT INTO loan_tape_imports
          (mapping_profile_id, organization_id, country, reporting_date, original_filename, source_sha256,
           status, total_records, clean_records, exception_count, critical_exception_count, submitted_by, completed_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, now())
        RETURNING id, status, total_records AS "totalRecords", clean_records AS "cleanRecords",
          exception_count AS "exceptionCount", critical_exception_count AS "criticalExceptionCount",
          source_sha256 AS "sourceSha256", created_at AS "createdAt"
      `, [profile.id, organizationId, country, payload.reportingDate, payload.originalFilename, result.sourceSha256,
        result.status, result.totalRecords, result.cleanRecords, result.exceptionCount, result.criticalExceptionCount, userId]);
      const importId = created.rows[0].id;
      for (const item of result.exceptions) {
        await client.query(`
          INSERT INTO loan_tape_reconciliation_exceptions
            (import_id, source_row_number, account_reference, row_fingerprint, exception_type, severity, field_name, message)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `, [importId, item.sourceRowNumber, item.accountReference, item.rowFingerprint, item.exceptionType, item.severity, item.fieldName, item.message]);
      }
      await client.query("COMMIT");
      await storage.createAuditLog({
        action: "VALIDATE_LOAN_TAPE",
        entity: "loan_tape_import",
        entityId: importId,
        userId,
        organizationId,
        details: `Validated ${payload.originalFilename}; SHA-256 ${result.sourceSha256}; ${result.totalRecords} rows; ${result.exceptionCount} exceptions; result ${result.status}. Raw source rows were not retained.`,
        ipAddress: req.ip || null,
      });
      res.status(201).json({ ...created.rows[0], rawRowsRetained: false });
    } catch (error: any) {
      await client.query("ROLLBACK").catch(() => {});
      res.status(400).json({ message: safeErrorMessage(error, 400) });
    } finally {
      client.release();
    }
  });

  app.get("/api/loan-tape-reconciliation/imports", requireRole("admin", "super_admin", "lender", "regulator"), enforceDataSovereignty, async (req, res) => {
    try {
      const { organizationId, country } = scope(req);
      const result = await pool.query(`
        SELECT i.id, i.country, i.reporting_date AS "reportingDate", i.original_filename AS "originalFilename",
          i.source_sha256 AS "sourceSha256", i.status, i.total_records AS "totalRecords",
          i.clean_records AS "cleanRecords", i.exception_count AS "exceptionCount",
          i.critical_exception_count AS "criticalExceptionCount", i.created_at AS "createdAt",
          p.name AS "mappingProfileName", p.version AS "mappingProfileVersion", p.bank_name AS "bankName"
        FROM loan_tape_imports i
        JOIN bank_mapping_profiles p ON p.id = i.mapping_profile_id
        WHERE ($1::text IS NULL OR i.organization_id = $1) AND ($2::text IS NULL OR i.country = $2)
        ORDER BY i.created_at DESC
        LIMIT 50
      `, [organizationId || null, country || null]);
      res.json(result.rows);
    } catch (error: any) {
      res.status(500).json({ message: safeErrorMessage(error) });
    }
  });

  app.get("/api/loan-tape-reconciliation/imports/:id/exceptions", requireRole("admin", "super_admin", "lender", "regulator"), enforceDataSovereignty, async (req, res) => {
    try {
      const { organizationId, country } = scope(req);
      const result = await pool.query(`
        SELECT e.id, e.source_row_number AS "sourceRowNumber", e.account_reference AS "accountReference",
          e.row_fingerprint AS "rowFingerprint", e.exception_type AS "exceptionType", e.severity,
          e.field_name AS "fieldName", e.message, e.status, e.resolution_note AS "resolutionNote",
          e.resolved_by AS "resolvedBy", e.resolved_at AS "resolvedAt", e.created_at AS "createdAt"
        FROM loan_tape_reconciliation_exceptions e
        JOIN loan_tape_imports i ON i.id = e.import_id
        WHERE e.import_id = $1 AND ($2::text IS NULL OR i.organization_id = $2) AND ($3::text IS NULL OR i.country = $3)
        ORDER BY CASE e.severity WHEN 'critical' THEN 1 WHEN 'high' THEN 2 ELSE 3 END, e.source_row_number
        LIMIT 2_000
      `, [req.params.id, organizationId || null, country || null]);
      res.json(result.rows);
    } catch (error: any) {
      res.status(500).json({ message: safeErrorMessage(error) });
    }
  });

  app.patch("/api/loan-tape-reconciliation/exceptions/:id", requireRole("admin", "super_admin", "lender", "regulator"), enforceDataSovereignty, async (req, res) => {
    try {
      const payload = resolutionSchema.parse(req.body);
      const userId = req.session?.userId;
      if (!userId) return res.status(401).json({ message: "Not authenticated" });
      if (payload.status === "waived" && !["admin", "super_admin"].includes(req.session?.userRole || "")) {
        return res.status(403).json({ message: "Only an authorised administrator may waive a reconciliation exception" });
      }
      const { organizationId, country } = scope(req);
      const result = await pool.query(`
        UPDATE loan_tape_reconciliation_exceptions e
        SET status = $2, resolution_note = $3, resolved_by = $4, resolved_at = now()
        FROM loan_tape_imports i
        WHERE e.id = $1 AND i.id = e.import_id
          AND ($5::text IS NULL OR i.organization_id = $5) AND ($6::text IS NULL OR i.country = $6)
          AND e.status = 'open'
        RETURNING e.id, e.import_id AS "importId", e.status, i.organization_id AS "organizationId", e.resolved_at AS "resolvedAt"
      `, [req.params.id, payload.status, payload.resolutionNote, userId, organizationId || null, country || null]);
      const exception = result.rows[0];
      if (!exception) return res.status(404).json({ message: "Open reconciliation exception not found in the authorised scope" });
      await storage.createAuditLog({
        action: `${payload.status.toUpperCase()}_LOAN_TAPE_EXCEPTION`,
        entity: "loan_tape_reconciliation_exception",
        entityId: exception.id,
        userId,
        organizationId: exception.organizationId,
        details: `${payload.status} exception with governed note: ${payload.resolutionNote}`,
        ipAddress: req.ip || null,
      });
      res.json(exception);
    } catch (error: any) {
      res.status(400).json({ message: safeErrorMessage(error, 400) });
    }
  });
}
