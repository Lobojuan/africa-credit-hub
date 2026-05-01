import { Router } from "express";
import bcrypt from "bcryptjs";
import { storage, GLOBAL_SCOPE } from "../storage";
import { insertUserSchema } from "@shared/schema";
import {
  requireRole, stripPassword, getOrgScope, getCountryFilter,
  logCrossCountryAccess, enforceCountryScopeForNonSuperAdmin,
  isPlatformPrivileged, safeErrorMessage,
} from "./middleware";

const router = Router();

// ── Role-level helpers ───────────────────────────────────────────────────────

/** True only for the top-of-hierarchy account type. */
const isPlatformOwner = (role: string | undefined) => role === "platform_owner";

/**
 * Visibility tiers for GET /api/users:
 *   platform_owner  → sees EVERYONE (all roles, all orgs)
 *   super_admin     → sees only admin and below (NOT other super_admin, NOT platform_owner)
 *   everyone else   → sees only admin and below (same exclusion set)
 */
function filterByVisibility(users: any[], callerRole: string | undefined) {
  if (isPlatformOwner(callerRole)) return users;
  // super_admin and below can only see non-privileged accounts
  return users.filter(u => u.role !== "super_admin" && u.role !== "platform_owner");
}

// ── GET /api/users ───────────────────────────────────────────────────────────

router.get("/api/users", requireRole("admin", "super_admin"), async (req, res) => {
  try {
    const orgId = getOrgScope(req);
    const country = getCountryFilter(req);
    enforceCountryScopeForNonSuperAdmin(req, country, "/api/users");
    await logCrossCountryAccess(req, country, "/api/users");
    const scope = country ?? (isPlatformPrivileged(req.session?.userRole) ? GLOBAL_SCOPE : undefined);
    const allUsers = await storage.getUsers(orgId, scope);
    res.json(filterByVisibility(allUsers, req.session?.userRole).map(stripPassword));
  } catch (e: any) {
    res.status(500).json({ message: safeErrorMessage(e) });
  }
});

// ── POST /api/users ──────────────────────────────────────────────────────────

router.post("/api/users", requireRole("admin", "super_admin"), async (req, res) => {
  try {
    const callerRole = req.session?.userRole;
    const orgId = isPlatformPrivileged(callerRole)
      ? (req.body.organizationId || getOrgScope(req))
      : getOrgScope(req);

    // Only platform_owner may create platform_owner or super_admin accounts.
    const targetRole = req.body.role as string | undefined;
    if (targetRole === "platform_owner" && !isPlatformOwner(callerRole)) {
      return res.status(403).json({ message: "Only the Platform Owner may create another Platform Owner account" });
    }
    if (targetRole === "super_admin" && !isPlatformOwner(callerRole)) {
      return res.status(403).json({ message: "Only the Platform Owner may create Super Admin accounts" });
    }

    const parsed = insertUserSchema.parse({ ...req.body, organizationId: orgId });
    const hashedPassword = await bcrypt.hash(parsed.password, 12);
    const user = await storage.createUser({ ...parsed, password: hashedPassword });
    await storage.createAuditLog({
      action: "CREATE", entity: "user", entityId: user.id, userId: req.session?.userId,
      details: `Created user: ${user.fullName}`,
      ipAddress: req.ip || null,
    });
    res.status(201).json(stripPassword(user));
  } catch (e: any) {
    res.status(400).json({ message: e.message });
  }
});

// ── PATCH /api/users/:id ─────────────────────────────────────────────────────

router.patch("/api/users/:id", requireRole("admin", "super_admin"), async (req, res) => {
  try {
    const callerRole = req.session?.userRole;

    if (req.params.id as string === req.session?.userId && req.body.role) {
      return res.status(400).json({ message: "Cannot change your own role" });
    }

    const targetUser = await storage.getUser(req.params.id as string);
    if (!targetUser) return res.status(404).json({ message: "User not found" });

    // platform_owner accounts can only be modified by another platform_owner.
    if (targetUser.role === "platform_owner" && !isPlatformOwner(callerRole)) {
      return res.status(403).json({ message: "Only the Platform Owner may modify Platform Owner accounts" });
    }

    // super_admin accounts can only be modified by platform_owner.
    if (targetUser.role === "super_admin" && !isPlatformOwner(callerRole)) {
      return res.status(403).json({ message: "Only the Platform Owner may modify Super Admin accounts" });
    }

    // Non-privileged callers are org-scoped.
    if (!isPlatformPrivileged(callerRole)) {
      if (targetUser.organizationId !== req.session?.organizationId) {
        return res.status(403).json({ message: "Cannot modify users outside your organization" });
      }
    }

    const data = { ...req.body };

    // Only platform_owner can assign platform_owner role.
    if (data.role === "platform_owner" && !isPlatformOwner(callerRole)) {
      return res.status(403).json({ message: "Cannot assign the Platform Owner role" });
    }

    // Non-privileged callers cannot change role, org, or status.
    if (!isPlatformPrivileged(callerRole)) {
      delete data.role;
      delete data.organizationId;
      delete data.status;
    }

    if (data.password) {
      const { checkPasswordHistory, pushPasswordHistory } = await import("../security-hardening");
      const historyCheck = await checkPasswordHistory(req.params.id as string, data.password);
      if (historyCheck.reused) {
        return res.status(400).json({ message: historyCheck.message });
      }
      const oldHash = targetUser.password;
      data.password = await bcrypt.hash(data.password, 12);
      if (oldHash) {
        await pushPasswordHistory(req.params.id as string, oldHash);
      }
    }

    const user = await storage.updateUser(req.params.id as string, data);
    if (!user) return res.status(404).json({ message: "User not found" });
    await storage.createAuditLog({
      action: "UPDATE", entity: "user", entityId: user.id, userId: req.session?.userId,
      details: `Updated user ${user.id.toString().slice(0, 8)}...${data.password ? " (password changed)" : ""}`,
      ipAddress: req.ip || null,
    });
    res.json(stripPassword(user));
  } catch (e: any) {
    res.status(400).json({ message: e.message });
  }
});

// ── DELETE /api/users/:id ────────────────────────────────────────────────────

router.delete("/api/users/:id", requireRole("admin", "super_admin"), async (req, res) => {
  try {
    const callerRole = req.session?.userRole;

    if (req.params.id as string === req.session?.userId) {
      return res.status(400).json({ message: "Cannot delete your own account" });
    }

    const targetUser = await storage.getUser(req.params.id as string);
    if (!targetUser) return res.status(404).json({ message: "User not found" });

    // platform_owner accounts can never be deleted by anyone.
    if (targetUser.role === "platform_owner") {
      return res.status(403).json({ message: "Platform Owner accounts cannot be deleted" });
    }

    // super_admin accounts can only be deleted by platform_owner.
    if (targetUser.role === "super_admin" && !isPlatformOwner(callerRole)) {
      return res.status(403).json({ message: "Only the Platform Owner may delete Super Admin accounts" });
    }

    const deleted = await storage.deleteUser(req.params.id as string);
    if (!deleted) return res.status(404).json({ message: "User not found" });
    await storage.createAuditLog({
      action: "DELETE", entity: "user", entityId: req.params.id as string, userId: req.session?.userId,
      details: `Deleted user ID: ${req.params.id as string}`,
      ipAddress: req.ip || null,
    });
    res.json({ message: "User deleted" });
  } catch (e: any) {
    res.status(400).json({ message: e.message });
  }
});

export default router;
