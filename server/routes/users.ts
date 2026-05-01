import { Router } from "express";
import bcrypt from "bcryptjs";
import { storage, GLOBAL_SCOPE } from "../storage";
import { insertUserSchema } from "@shared/schema";
import {
  requireRole, stripPassword, getOrgScope, getCountryFilter,
  logCrossCountryAccess, enforceCountryScopeForNonSuperAdmin, safeErrorMessage,
} from "./middleware";

const router = Router();

router.get("/api/users", requireRole("admin", "super_admin"), async (req, res) => {
  try {
    const orgId = getOrgScope(req);
    const country = getCountryFilter(req);
    enforceCountryScopeForNonSuperAdmin(req, country, "/api/users");
    await logCrossCountryAccess(req, country, "/api/users");
    const scope = country ?? (req.session?.userRole === "super_admin" ? GLOBAL_SCOPE : undefined);
    const allUsers = await storage.getUsers(orgId, scope);
    // Non-super_admin callers must never see super_admin accounts — they have
    // no legitimate reason to view or interact with platform-owner profiles.
    const visible = req.session?.userRole === "super_admin"
      ? allUsers
      : allUsers.filter(u => u.role !== "super_admin");
    res.json(visible.map(stripPassword));
  } catch (e: any) {
    res.status(500).json({ message: safeErrorMessage(e) });
  }
});

router.post("/api/users", requireRole("admin", "super_admin"), async (req, res) => {
  try {
    const orgId = req.session?.userRole === "super_admin" ? (req.body.organizationId || getOrgScope(req)) : getOrgScope(req);
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

router.patch("/api/users/:id", requireRole("admin", "super_admin"), async (req, res) => {
  try {
    if (req.params.id as string === req.session?.userId && req.body.role) {
      return res.status(400).json({ message: "Cannot change your own role" });
    }

    const targetUser = await storage.getUser(req.params.id as string);
    if (!targetUser) return res.status(404).json({ message: "User not found" });

    // Only platform administrators (super_admin) may modify other super_admin
    // accounts. A regular admin must never be able to alter a platform owner's
    // credentials, even if they share the same organization.
    if (req.session?.userRole !== "super_admin" && targetUser.role === "super_admin") {
      return res.status(403).json({ message: "Cannot modify platform administrator accounts" });
    }

    if (req.session?.userRole !== "super_admin") {
      if (targetUser.organizationId !== req.session?.organizationId) {
        return res.status(403).json({ message: "Cannot modify users outside your organization" });
      }
    }

    const data = { ...req.body };
    if (req.session?.userRole !== "super_admin") {
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
      details: `Updated user ${user.id.toString().slice(0,8)}...${data.password ? " (password changed by admin, history check passed)" : ""}`,
      ipAddress: req.ip || null,
    });
    res.json(stripPassword(user));
  } catch (e: any) {
    res.status(400).json({ message: e.message });
  }
});

router.delete("/api/users/:id", requireRole("admin", "super_admin"), async (req, res) => {
  try {
    if (req.params.id as string === req.session?.userId) {
      return res.status(400).json({ message: "Cannot delete your own account" });
    }
    const targetUser = await storage.getUser(req.params.id as string);
    if (!targetUser) return res.status(404).json({ message: "User not found" });
    // super_admin accounts may never be deleted — not even by another super_admin —
    // to prevent accidental or malicious removal of platform owner credentials.
    if (targetUser.role === "super_admin") {
      return res.status(403).json({ message: "Platform administrator accounts cannot be deleted" });
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
