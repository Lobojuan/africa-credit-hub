import { Router } from "express";
import bcrypt from "bcryptjs";
import { storage } from "../storage";
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
    const users = await storage.getUsers(orgId, country);
    res.json(users.map(stripPassword));
  } catch (e: any) {
    res.status(500).json({ message: safeErrorMessage(e) });
  }
});

router.post("/api/users", requireRole("admin", "super_admin"), async (req, res) => {
  try {
    const orgId = req.session?.userRole === "super_admin" ? (req.body.organizationId || getOrgScope(req)) : getOrgScope(req);
    const parsed = insertUserSchema.parse({ ...req.body, organizationId: orgId });
    const hashedPassword = await bcrypt.hash(parsed.password, 10);
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

router.patch("/api/users/:id", requireRole("admin"), async (req, res) => {
  try {
    const data = { ...req.body };
    if (data.password) {
      const { checkPasswordHistory, pushPasswordHistory } = await import("../security-hardening");
      const historyCheck = await checkPasswordHistory(req.params.id, data.password);
      if (historyCheck.reused) {
        return res.status(400).json({ message: historyCheck.message });
      }
      const existingUser = await storage.getUser(req.params.id);
      const oldHash = existingUser?.password;
      data.password = await bcrypt.hash(data.password, 10);
      if (oldHash) {
        await pushPasswordHistory(req.params.id, oldHash);
      }
    }
    const user = await storage.updateUser(req.params.id, data);
    if (!user) return res.status(404).json({ message: "User not found" });
    await storage.createAuditLog({
      action: "UPDATE", entity: "user", entityId: user.id, userId: req.session?.userId,
      details: `Updated user: ${user.fullName}${data.password ? " (password changed by admin, history check passed)" : ""}`,
      ipAddress: req.ip || null,
    });
    res.json(stripPassword(user));
  } catch (e: any) {
    res.status(400).json({ message: e.message });
  }
});

router.delete("/api/users/:id", requireRole("admin"), async (req, res) => {
  try {
    if (req.params.id === req.session?.userId) {
      return res.status(400).json({ message: "Cannot delete your own account" });
    }
    const deleted = await storage.deleteUser(req.params.id);
    if (!deleted) return res.status(404).json({ message: "User not found" });
    await storage.createAuditLog({
      action: "DELETE", entity: "user", entityId: req.params.id, userId: req.session?.userId,
      details: `Deleted user ID: ${req.params.id}`,
      ipAddress: req.ip || null,
    });
    res.json({ message: "User deleted" });
  } catch (e: any) {
    res.status(400).json({ message: e.message });
  }
});

export default router;
