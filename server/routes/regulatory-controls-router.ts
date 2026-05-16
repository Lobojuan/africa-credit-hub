/**
 * Regulatory compliance control endpoints — testable Express router.
 *
 *   PATCH /approvals/:id      — maker-checker guard + full approval persistence
 *   POST  /consent-gate-check — BoG consent gate (borrower-bound + institution-bound)
 *   GET   /export-preview/cbn/:fileType  — CBN pipe-delimited preview (JSON)
 *   GET   /export-preview/cbk/:fileType  — CBK pipe-delimited preview (JSON)
 *
 * Security invariants:
 *   - Maker-checker: fails-closed for non-privileged users when org context is absent.
 *   - Consent gate: validates borrower binding, institution binding, status, expiry,
 *     and loan-origination exemption (Ghana Data Protection Act §12(3)).
 *   - No `as any` casts in security-sensitive paths; ConsentRecord type covers all fields.
 */

import { Router } from "express";
import { z } from "zod";
import { requireAuth, requireRole, isPlatformPrivileged } from "./middleware";
import { storage } from "../storage";
import { CBN_EXPORT_GENERATORS } from "../cbn-export";
import { CBK_EXPORT_GENERATORS } from "../cbk-export";
import type { ConsentRecord } from "../../shared/schema";
import type { CbnFileType } from "../../shared/cbn-codes";
import type { CbkFileType } from "../../shared/cbk-codes";
import { buildExportPreviewResponse } from "../utils/export-preview";

const router = Router();

// ─── Maker-checker guard + approval persistence ────────────────────────────────

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

    // Org-scope: fail-closed for non-privileged users.
    //   • Missing org context → deny (prevents bypass via absent session field).
    //   • Org mismatch → deny.
    //   • Privileged roles (super_admin / platform_owner) → unrestricted.
    if (!isPlatformPrivileged(req.session?.userRole)) {
      const reviewerOrgId = req.session?.organizationId;
      if (!reviewerOrgId) {
        return res.status(403).json({
          message: "Organisation context is required to review approvals",
          code: "ORG_CONTEXT_MISSING",
        });
      }
      if (approval.organizationId && reviewerOrgId !== approval.organizationId) {
        return res.status(403).json({
          message: "You cannot review approvals from a different organization",
          code: "ORG_SCOPE_VIOLATION",
        });
      }
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

// ─── BoG consent gate ─────────────────────────────────────────────────────────
//
// Enforces the Ghana Data Protection Act consent requirements before allowing
// access to a borrower's credit report. Three allowed paths:
//   1. Privileged role (super_admin / platform_owner) — full bypass.
//   2. Loan-origination exemption — loanExemption=true, borrowerResponse='approved',
//      active, not expired, borrower-bound, institution-bound.
//   3. Standard borrower-approved consent — active, not expired, borrower-bound,
//      institution-bound.
//
// Institution binding (consent-replay defence): a consent granted by institution A
// cannot be presented by institution B to access the same borrower's data.

const consentGateSchema = z.object({
  consentId: z.string().optional(),
  borrowerId: z.string(),
});

router.post("/consent-gate-check", requireAuth, async (req, res) => {
  try {
    const { consentId, borrowerId } = consentGateSchema.parse(req.body);
    const isSuperAdmin = isPlatformPrivileged(req.session?.userRole);

    // Path 1: Privileged actors bypass the gate (audit trail maintained by caller)
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

    const consent: ConsentRecord | undefined = await storage.getConsentRecord(consentId);
    if (!consent) {
      return res.status(404).json({ message: "Consent record not found", code: "CONSENT_NOT_FOUND" });
    }

    // Borrower binding: consent for borrower A cannot authorise access to borrower B
    if (consent.borrowerId !== borrowerId) {
      return res.status(403).json({
        message: "Consent record does not match the requested borrower",
        code: "CONSENT_BORROWER_MISMATCH",
        blocked: true,
      });
    }

    // Institution binding — fail-closed for institution-scoped consents.
    // When consent.organizationId is set, the record is scoped to that institution.
    // A non-privileged requester missing org context is denied rather than allowed
    // through (prevents consent-replay via absent session field).
    const requesterOrgId = req.session?.organizationId;
    if (consent.organizationId) {
      if (!requesterOrgId) {
        return res.status(403).json({
          message: "Organisation context is required to access this institution-bound consent",
          code: "CONSENT_ORG_CONTEXT_MISSING",
          blocked: true,
        });
      }
      if (consent.organizationId !== requesterOrgId) {
        return res.status(403).json({
          message: "Consent was not issued to your institution",
          code: "CONSENT_INSTITUTION_MISMATCH",
          blocked: true,
        });
      }
    }

    // Expiry applies equally to all consent types
    if (consent.expiresAt && new Date(consent.expiresAt) < new Date()) {
      return res.status(403).json({ message: "Consent has expired", code: "CONSENT_EXPIRED", blocked: true });
    }

    // Path 2: Loan-origination exemption (Ghana Data Protection Act §12(3)).
    // ALL three invariants must hold — consentType alone is not sufficient and
    // must not be treated as an exemption trigger by itself (prevents a lender
    // from self-creating a 'loan_exemption' type record to bypass the gate):
    //   • consentType === 'loan_exemption' — canonical type written by server
    //   • loanExemption === true            — boolean flag set by server path only
    //   • borrowerResponse === 'approved'   — approval marker set by server path only
    // Path 2: Loan-origination exemption (Ghana Data Protection Act §12(3)).
    // ALL three invariants must hold simultaneously. consentType alone is not a
    // sufficient trigger — loanExemption=true and borrowerResponse='approved' must
    // also be present (both are server-controlled fields set only via the
    // /api/bog/consent endpoint). A 'loan_exemption' record missing any marker is
    // explicitly rejected before the standard path so it cannot fall through.
    const isLoanExemption =
      consent.consentType === "loan_exemption" &&
      consent.loanExemption === true &&
      consent.borrowerResponse === "approved";

    if (consent.consentType === "loan_exemption" && !isLoanExemption) {
      return res.status(403).json({
        message: "Loan-exemption consent lacks required server-controlled approval markers",
        code: "CONSENT_INACTIVE",
        blocked: true,
      });
    }

    if (isLoanExemption) {
      if (consent.status !== "active") {
        return res.status(403).json({
          message: "Loan-exemption consent is no longer active",
          code: "CONSENT_INACTIVE",
          blocked: true,
        });
      }
      return res.json({ allowed: true, isSuperAdmin: false, loanExemption: true, borrowerId, consentId });
    }

    // Path 3: Standard borrower-approved consent
    if (consent.status !== "active") {
      return res.status(403).json({ message: "Consent is not active", code: "CONSENT_INACTIVE", blocked: true });
    }

    res.json({ allowed: true, isSuperAdmin: false, loanExemption: false, borrowerId, consentId });
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
    const { content, filename } = await CBN_EXPORT_GENERATORS[fileType](reportingDate, 1, "0", req.session?.organizationId);
    res.json(buildExportPreviewResponse(content, filename, "CBN", "Nigeria", fileType));
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
    const { content, filename } = await CBK_EXPORT_GENERATORS[fileType](reportingDate, 1, "0", req.session?.organizationId);
    res.json(buildExportPreviewResponse(content, filename, "CBK", "Kenya", fileType));
  } catch (e: any) {
    res.status(500).json({ message: e.message });
  }
});

export default router;
