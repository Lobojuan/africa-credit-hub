import { Router } from "express";
import { requireAuth, requireSuperAdmin, safeErrorMessage } from "./middleware";
import { storage } from "../storage";
import { db } from "../db";
import { eq, desc } from "drizzle-orm";
import { wallets, walletTransactions, organizations } from "@shared/schema";

const router = Router();

router.get("/api/platform/wallets", requireAuth, requireSuperAdmin, async (_req, res) => {
  try {
    const allWallets = await db.select({
      wallet: wallets,
      orgName: organizations.name,
    }).from(wallets).leftJoin(organizations, eq(wallets.organizationId, organizations.id)).orderBy(desc(wallets.updatedAt));
    res.json(allWallets.map(w => ({ ...w.wallet, orgName: w.orgName })));
  } catch (e: any) { res.status(500).json({ message: safeErrorMessage(e) }); }
});

router.get("/api/platform/wallets/:id/transactions", requireAuth, requireSuperAdmin, async (req, res) => {
  try {
    const id = req.params["id"] as string;
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 200);
    const txs = await db.select().from(walletTransactions).where(eq(walletTransactions.walletId, id)).orderBy(desc(walletTransactions.createdAt)).limit(limit);
    res.json(txs);
  } catch (e: any) { res.status(500).json({ message: safeErrorMessage(e) }); }
});

router.post("/api/platform/wallets/topup", requireAuth, requireSuperAdmin, async (req, res) => {
  try {
    const { walletId, amountCents, method, providerRef, description } = req.body;
    // Integer check + upper bound (1B GHS in pesewas) to prevent floating-point abuse and overflow
    if (!walletId || typeof amountCents !== "number" || !Number.isInteger(amountCents) || amountCents <= 0 || amountCents > 1_000_000_000_00) {
      return res.status(400).json({ message: "walletId and positive integer amountCents required (max 100,000,000,000)" });
    }
    const validMethods = ["mobile_money", "bank_transfer", "stripe", "manual"];
    if (!validMethods.includes(method)) {
      return res.status(400).json({ message: "method must be mobile_money, bank_transfer, stripe, or manual" });
    }

    const { topupWallet } = await import("../wallet-engine");
    const result = await topupWallet(walletId, amountCents, method, providerRef, description);

    const [wallet] = await db.select().from(wallets).where(eq(wallets.id, walletId));
    await storage.createAuditLog({ userId: req.session.userId!, action: "CREATE", entity: "wallet_topup", entityId: result.transactionId, details: `Topped up wallet ${walletId} with ${amountCents} pesewas via ${method}`, ipAddress: req.ip, organizationId: wallet?.organizationId || null });

    res.json(result);
  } catch (e: any) { res.status(500).json({ message: safeErrorMessage(e) }); }
});

router.post("/api/platform/wallets/withdraw", requireAuth, requireSuperAdmin, async (req, res) => {
  try {
    const { walletId, amountCents, description } = req.body;
    // Integer check + upper bound to prevent floating-point abuse and overflow
    if (!walletId || typeof amountCents !== "number" || !Number.isInteger(amountCents) || amountCents <= 0 || amountCents > 1_000_000_000_00) {
      return res.status(400).json({ message: "walletId and positive integer amountCents required (max 100,000,000,000)" });
    }

    const { withdrawFromWallet } = await import("../wallet-engine");
    const result = await withdrawFromWallet(walletId, amountCents, description);

    if (!result.success && result.insufficientFunds) {
      return res.status(400).json({ message: "Insufficient wallet balance", newBalance: result.newBalance });
    }

    await storage.createAuditLog({ userId: req.session.userId!, action: "CREATE", entity: "wallet_withdrawal", entityId: walletId, details: `Withdrew ${amountCents} pesewas from wallet ${walletId}`, ipAddress: req.ip, organizationId: null });

    res.json(result);
  } catch (e: any) { res.status(500).json({ message: safeErrorMessage(e) }); }
});

router.post("/api/platform/wallets/create", requireAuth, requireSuperAdmin, async (req, res) => {
  try {
    const { organizationId, walletType } = req.body;
    if (!walletType || !["platform", "bureau"].includes(walletType)) {
      return res.status(400).json({ message: "walletType must be 'platform' or 'bureau'" });
    }

    const { getOrCreateWallet, getPlatformWallet } = await import("../wallet-engine");
    let wallet;
    if (walletType === "platform") {
      wallet = await getPlatformWallet();
    } else {
      if (!organizationId) return res.status(400).json({ message: "organizationId required for bureau wallet" });
      wallet = await getOrCreateWallet(organizationId, "bureau");
    }
    res.json(wallet);
  } catch (e: any) { res.status(500).json({ message: safeErrorMessage(e) }); }
});

router.patch("/api/platform/wallets/:id/settings", requireAuth, requireSuperAdmin, async (req, res) => {
  try {
    const id = req.params["id"] as string;
    const { lowBalanceThresholdCents, autoTopupEnabled, autoTopupAmountCents } = req.body;
    const updates: any = { updatedAt: new Date() };
    if (lowBalanceThresholdCents !== undefined) {
      if (!Number.isInteger(lowBalanceThresholdCents) || lowBalanceThresholdCents < 0 || lowBalanceThresholdCents > 1_000_000_000_00) {
        return res.status(400).json({ message: "lowBalanceThresholdCents must be a non-negative integer (max 100,000,000,000)" });
      }
      updates.lowBalanceThresholdCents = lowBalanceThresholdCents;
    }
    if (autoTopupEnabled !== undefined) updates.autoTopupEnabled = autoTopupEnabled;
    if (autoTopupAmountCents !== undefined) {
      if (!Number.isInteger(autoTopupAmountCents) || autoTopupAmountCents < 0 || autoTopupAmountCents > 1_000_000_000_00) {
        return res.status(400).json({ message: "autoTopupAmountCents must be a non-negative integer (max 100,000,000,000)" });
      }
      updates.autoTopupAmountCents = autoTopupAmountCents;
    }
    const [updated] = await db.update(wallets).set(updates).where(eq(wallets.id, id)).returning();
    if (!updated) return res.status(404).json({ message: "Wallet not found" });
    res.json(updated);
  } catch (e: any) { res.status(500).json({ message: safeErrorMessage(e) }); }
});

export default router;
