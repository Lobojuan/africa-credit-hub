/**
 * Regulatory compliance control endpoints — testable Express router.
 *
 * Exposes four endpoints used both by production (mounted in routes.ts)
 * and by the behavioral test suite (mounted in a minimal test harness):
 *
 *   PATCH /approvals/:id      — maker-checker guard + full approval persistence
 *   POST  /consent-gate-check — BoG consent gate (borrower-bound, IDOR-safe)
 *   GET   /export-preview/cbn/:fileType  — CBN pipe-delimited preview (JSON)
 *   GET   /export-preview/cbk/:fileType  — CBK pipe-delimited preview (JSON)
 */

import { Router } from "express";
import { z } from "zod";
import { requireAuth, requireRole, isPlatformPrivileged } from "./middleware";
import { storage } from "../storage";
import { CBN_EXPORT_GENERATORS } from "../cbn-export";
import { CBK_EXPORT_GENERATORS } from "../cbk-export";
import type { CbnFileType } from "../../shared/cbn-codes";
import type { CbkFileType } from "../../shared/cbk-codes";

const router = Router();

// ─── Maker-checker guard + approval persistence (PATCH /approvals/:id) ────────

const approvalUpdateSchema = z.object({
  status: z.enum(["approved", "rejected"]),
  reviewNotes: z.string().max(2000).optional(),
});

router.patch("/approvals/:id", requireAuth, requireRole("admin", "regulator"), async (req, res) => {
  try {
    const { status, reviewNotes } = approvalUpdateSchema.parse(req.body);
    const currentUserId = req.session?.userId;
    if (!currentUserId) return res.status(401).json({ message: "Not authenticated" });

    const approval = await storage.getPendingApproval(req.params.id as string);
    if (!approval) return res.status(404).json({ message: "Approval not found" });

    // Maker-checker: same user cannot be both sides of the workflow
    if (approval.requestedBy === currentUserId) {
      return res.status(403).json({ message: "Maker cannot be the Checker.", code: "SELF_APPROVAL_FORBIDDEN" });
    }

    // Org-scope: non-privileged reviewers may only act on their own org's approvals
    const reviewerOrgId = req.session?.organizationId;
    if (
      !isPlatformPrivileged(req.session?.userRole) &&
      reviewerOrgId &&
      approval.organizationId &&
      reviewerOrgId !== approval.organizationId
    ) {
      return res.status(403).json({
        message: "You cannot review approvals from a different organization",
        code: "ORG_SCOPE_VIOLATION",
      });
    }

    // Guard against re-reviewing an already-actioned approval
    if (approval.status !== "pending") {
      return res.status(400).json({ message: "This request has already been reviewed", code: "ALREADY_REVIEWED" });
    }

    // Persist the decision — this is the authoritative action handler
    const updated = await storage.updateApprovalStatus(approval.id, status, currentUserId, reviewNotes);

    res.json({
      guardPassed: true,
      approvalId: approval.id,
      status: updated?.status ?? status,
      reviewedBy: currentUserId,
    });
  } catch (e: any) {
    res.status(400).json({ message: e.message });
  }
});

// ─── BoG consent gate (POST /consent-gate-check) ─────────────────────────────
//
// Security requirement: consent record must be bound to the *specific borrower*
// being accessed (borrower-ID match). A valid consent for borrower A cannot
// authorise access to borrower B (IDOR / consent-replay defence).

const consentGateSchema = z.object({
  consentId: z.string().optional(),
  borrowerId: z.string(),
});

router.post("/consent-gate-check", requireAuth, async (req, res) => {
  try {
    const { consentId, borrowerId } = consentGateSchema.parse(req.body);
    const isSuperAdmin = isPlatformPrivileged(req.session?.userRole);

    // Privileged actors bypass the gate (audit trail maintained by caller)
    if (isSuperAdmin) {
      return res.json({ allowed: true, isSuperAdmin: true, borrowerId });
    }

    // All other roles must supply a consentId
    if (!consentId) {
      return res.status(403).json({
        message: "Consent verification is required before generating a credit report. Please complete the consent capture step.",
        code: "CONSENT_REQUIRED",
        blocked: true,
      });
    }

    const consent = await storage.getConsentRecord(consentId);
    if (!consent) {
      return res.status(404).json({ message: "Consent record not found", code: "CONSENT_NOT_FOUND" });
    }

    // IDOR / consent-replay defence: the consent must be bound to the exact
    // borrower being accessed. A consent granted for borrower A cannot be
    // used to access borrower B's record.
    if (consent.borrowerId !== borrowerId) {
      return res.status(403).json({
        message: "Consent record does not match the requested borrower",
        code: "CONSENT_BORROWER_MISMATCH",
        blocked: true,
      });
    }

    if (consent.status !== "active") {
      return res.status(403).json({ message: "Consent is not active", code: "CONSENT_INACTIVE", blocked: true });
    }

    if (consent.expiresAt && new Date(consent.expiresAt) < new Date()) {
      return res.status(403).json({ message: "Consent has expired", code: "CONSENT_EXPIRED", blocked: true });
    }

    res.json({ allowed: true, isSuperAdmin: false, borrowerId, consentId });
  } catch (e: any) {
    res.status(400).json({ message: e.message });
  }
});

// ─── CBN/CBK export preview ───────────────────────────────────────────────────

const CBN_FILE_TYPES: CbnFileType[] = ["CONC", "BUSC", "CONJ", "BUSJ", "COND", "BUSD"];
const CBK_FILE_TYPES: CbkFileType[] = ["CONC", "BUSC", "CONJ", "BUSJ", "COND", "BUSD"];

router.get("/export-preview/cbn/:fileType", requireAuth, requireRole("admin", "regulator", "super_admin"), async (req, res) => {
  try {
    const fileType = (req.params["fileType"] as string).toUpperCase() as CbnFileType;
    if (!CBN_FILE_TYPES.includes(fileType)) {
      return res.status(400).json({ message: `Invalid CBN file type: ${fileType}` });
    }
    const reportingDate = new Date().toISOString().split("T")[0]!.replace(/-/g, "");
    const generator = CBN_EXPORT_GENERATORS[fileType];
    const { content, filename } = await generator(reportingDate, 1, "0", req.session?.organizationId);
    const lines = content.split("\n");
    res.json({
      regulator: "CBN",
      jurisdiction: "Nigeria",
      fileType,
      filename,
      headerRow: lines[0],
      sampleRows: lines.slice(1, 4),
      totalDataRows: lines.filter(l => l.trim() && l !== lines[0]).length,
      pipeDelimited: (lines[0] ?? "").includes("|"),
    });
  } catch (e: any) {
    res.status(500).json({ message: e.message });
  }
});

router.get("/export-preview/cbk/:fileType", requireAuth, requireRole("admin", "regulator", "super_admin"), async (req, res) => {
  try {
    const fileType = (req.params["fileType"] as string).toUpperCase() as CbkFileType;
    if (!CBK_FILE_TYPES.includes(fileType)) {
      return res.status(400).json({ message: `Invalid CBK file type: ${fileType}` });
    }
    const reportingDate = new Date().toISOString().split("T")[0]!.replace(/-/g, "");
    const generator = CBK_EXPORT_GENERATORS[fileType];
    const { content, filename } = await generator(reportingDate, 1, "0", req.session?.organizationId);
    const lines = content.split("\n");
    res.json({
      regulator: "CBK",
      jurisdiction: "Kenya",
      fileType,
      filename,
      headerRow: lines[0],
      sampleRows: lines.slice(1, 4),
      totalDataRows: lines.filter(l => l.trim() && l !== lines[0]).length,
      pipeDelimited: (lines[0] ?? "").includes("|"),
    });
  } catch (e: any) {
    res.status(500).json({ message: e.message });
  }
});

export default router;
