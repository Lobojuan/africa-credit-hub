/**
 * Regulatory compliance control endpoints — testable Express router.
 *
 * Exposes three thin endpoints used both by production (mounted in routes.ts)
 * and by the behavioral test suite (mounted in a minimal test harness):
 *
 *   PATCH /approvals/:id      — maker-checker guard for pending approvals
 *   POST  /consent-gate-check — BoG consent gate validation
 *   GET   /export-preview/cbn/:fileType  — CBN pipe-delimited preview (JSON)
 *   GET   /export-preview/cbk/:fileType  — CBK pipe-delimited preview (JSON)
 *
 * These routes deliberately exclude side-effects (no borrower creation, no
 * webhooks) so they remain hermetic in tests. The full production PATCH handler
 * in routes.ts continues to own the downstream effects; this router only owns
 * the guard phase.
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

// ─── Maker-checker guard (PATCH /approvals/:id) ───────────────────────────────

const approvalUpdateSchema = z.object({
  status: z.enum(["approved", "rejected"]),
  reviewNotes: z.string().max(2000).optional(),
});

router.patch("/approvals/:id", requireAuth, requireRole("admin", "regulator"), async (req, res) => {
  try {
    const { status } = approvalUpdateSchema.parse(req.body);
    const currentUserId = req.session?.userId;
    if (!currentUserId) return res.status(401).json({ message: "Not authenticated" });

    const approval = await storage.getPendingApproval(req.params.id as string);
    if (!approval) return res.status(404).json({ message: "Approval not found" });

    if (approval.requestedBy === currentUserId) {
      return res.status(403).json({ message: "Maker cannot be the Checker.", code: "SELF_APPROVAL_FORBIDDEN" });
    }

    const reviewerOrgId = req.session?.organizationId;
    if (
      !isPlatformPrivileged(req.session?.userRole) &&
      reviewerOrgId &&
      approval.organizationId &&
      reviewerOrgId !== approval.organizationId
    ) {
      return res.status(403).json({ message: "You cannot review approvals from a different organization", code: "ORG_SCOPE_VIOLATION" });
    }

    if (approval.status !== "pending") {
      return res.status(400).json({ message: "This request has already been reviewed", code: "ALREADY_REVIEWED" });
    }

    res.json({ guardPassed: true, approvalId: approval.id, requestedStatus: status });
  } catch (e: any) {
    res.status(400).json({ message: e.message });
  }
});

// ─── BoG consent gate (POST /consent-gate-check) ─────────────────────────────

const consentGateSchema = z.object({
  consentId: z.string().optional(),
  borrowerId: z.string(),
});

router.post("/consent-gate-check", requireAuth, async (req, res) => {
  try {
    const { consentId, borrowerId } = consentGateSchema.parse(req.body);
    const isSuperAdmin = isPlatformPrivileged(req.session?.userRole);

    if (!isSuperAdmin && !consentId) {
      return res.status(403).json({
        message: "Consent verification is required before generating a credit report. Please complete the consent capture step.",
        code: "CONSENT_REQUIRED",
        blocked: true,
      });
    }

    if (!isSuperAdmin && consentId) {
      const consent = await storage.getConsentRecord(consentId);
      if (!consent) return res.status(404).json({ message: "Consent record not found", code: "CONSENT_NOT_FOUND" });
      if (consent.status !== "active") {
        return res.status(403).json({ message: "Consent is not active", code: "CONSENT_INACTIVE", blocked: true });
      }
      if (consent.expiresAt && new Date(consent.expiresAt) < new Date()) {
        return res.status(403).json({ message: "Consent has expired", code: "CONSENT_EXPIRED", blocked: true });
      }
    }

    res.json({ allowed: true, isSuperAdmin, borrowerId });
  } catch (e: any) {
    res.status(400).json({ message: e.message });
  }
});

// ─── CBN/CBK export preview (GET /export-preview/cbn/:fileType) ───────────────

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
