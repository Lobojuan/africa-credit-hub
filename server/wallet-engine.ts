import { db } from "./db";
import { wallets, walletTransactions } from "@shared/schema";
import { eq, sql } from "drizzle-orm";
import { pool } from "./db";

export async function getOrCreateWallet(organizationId: string, walletType: "platform" | "bureau" = "bureau"): Promise<{ id: string; balanceCents: number; currency: string }> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const { rows: [existing] } = await client.query(
      `SELECT id, balance_cents, currency FROM wallets WHERE organization_id = $1 LIMIT 1 FOR UPDATE`,
      [organizationId]
    );
    if (existing) {
      await client.query("COMMIT");
      return { id: existing.id, balanceCents: existing.balance_cents, currency: existing.currency };
    }
    const { rows: [created] } = await client.query(
      `INSERT INTO wallets (organization_id, wallet_type, balance_cents, currency, low_balance_threshold_cents)
       VALUES ($1, $2, 0, 'GHS', 50000) RETURNING id, balance_cents, currency`,
      [organizationId, walletType]
    );
    await client.query("COMMIT");
    return { id: created.id, balanceCents: created.balance_cents, currency: created.currency };
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
}

export async function getPlatformWallet(): Promise<{ id: string; balanceCents: number; currency: string }> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const { rows: [existing] } = await client.query(
      `SELECT id, balance_cents, currency FROM wallets WHERE wallet_type = 'platform' LIMIT 1 FOR UPDATE`
    );
    if (existing) {
      await client.query("COMMIT");
      return { id: existing.id, balanceCents: existing.balance_cents, currency: existing.currency };
    }
    const { rows: [created] } = await client.query(
      `INSERT INTO wallets (organization_id, wallet_type, balance_cents, currency, low_balance_threshold_cents)
       VALUES (NULL, 'platform', 0, 'GHS', 0)
       ON CONFLICT DO NOTHING RETURNING id, balance_cents, currency`
    );
    if (!created) {
      const { rows: [fallback] } = await client.query(
        `SELECT id, balance_cents, currency FROM wallets WHERE wallet_type = 'platform' LIMIT 1`
      );
      await client.query("COMMIT");
      return { id: fallback.id, balanceCents: fallback.balance_cents, currency: fallback.currency };
    }
    await client.query("COMMIT");
    return { id: created.id, balanceCents: created.balance_cents, currency: created.currency };
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
}

export interface WalletDeductionResult {
  success: boolean;
  bureauWalletId: string;
  platformWalletId: string;
  totalDeducted: number;
  platformFee: number;
  bureauBalance: number;
  platformBalance: number;
  insufficientFunds?: boolean;
}

export async function processTransactionFee(
  organizationId: string,
  totalCents: number,
  platformFeeCents: number,
  description: string,
  referenceId?: string,
  referenceType?: string,
): Promise<WalletDeductionResult> {
  // Validate totalCents: must be a positive integer within safe bounds to prevent overflow/abuse
  if (!Number.isInteger(totalCents) || totalCents <= 0 || totalCents > 1_000_000_000_00) {
    throw new Error("Invalid totalCents value");
  }
  // Prevent ledger imbalance: platform fee must be a non-negative integer not exceeding total
  if (!Number.isInteger(platformFeeCents) || platformFeeCents < 0 || platformFeeCents > totalCents) {
    throw new Error(`Invalid platformFeeCents ${platformFeeCents}: must be between 0 and totalCents ${totalCents}`);
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const { rows: [bureauRow] } = await client.query(
      `SELECT id, balance_cents FROM wallets WHERE organization_id = $1 FOR UPDATE`,
      [organizationId]
    );
    if (!bureauRow) {
      const created = await getOrCreateWallet(organizationId, "bureau");
      await client.query("ROLLBACK");
      return {
        success: false,
        bureauWalletId: created.id,
        platformWalletId: "",
        totalDeducted: 0,
        platformFee: platformFeeCents,
        bureauBalance: 0,
        platformBalance: 0,
        insufficientFunds: true,
      };
    }

    const { rows: [platformRow] } = await client.query(
      `SELECT id, balance_cents FROM wallets WHERE wallet_type = 'platform' FOR UPDATE`
    );
    if (!platformRow) {
      await client.query("ROLLBACK");
      const pw = await getPlatformWallet();
      return {
        success: false,
        bureauWalletId: bureauRow.id,
        platformWalletId: pw.id,
        totalDeducted: 0,
        platformFee: platformFeeCents,
        bureauBalance: bureauRow.balance_cents,
        platformBalance: 0,
        insufficientFunds: true,
      };
    }

    if (bureauRow.balance_cents < totalCents) {
      await client.query("ROLLBACK");
      return {
        success: false,
        bureauWalletId: bureauRow.id,
        platformWalletId: platformRow.id,
        totalDeducted: 0,
        platformFee: platformFeeCents,
        bureauBalance: bureauRow.balance_cents,
        platformBalance: platformRow.balance_cents,
        insufficientFunds: true,
      };
    }

    const newBureauBalance = bureauRow.balance_cents - totalCents;
    const newPlatformBalance = platformRow.balance_cents + platformFeeCents;

    await client.query(
      `UPDATE wallets SET balance_cents = $1, updated_at = NOW() WHERE id = $2`,
      [newBureauBalance, bureauRow.id]
    );

    await client.query(
      `UPDATE wallets SET balance_cents = $1, updated_at = NOW() WHERE id = $2`,
      [newPlatformBalance, platformRow.id]
    );

    await client.query(
      `INSERT INTO wallet_transactions (wallet_id, tx_type, amount_cents, balance_after_cents, currency, status, description, reference_id, reference_type, counterparty_wallet_id)
       VALUES ($1, 'transaction_fee', $2, $3, 'GHS', 'completed', $4, $5, $6, $7)`,
      [bureauRow.id, -totalCents, newBureauBalance, description, referenceId || null, referenceType || null, platformRow.id]
    );

    await client.query(
      `INSERT INTO wallet_transactions (wallet_id, tx_type, amount_cents, balance_after_cents, currency, status, description, reference_id, reference_type, counterparty_wallet_id)
       VALUES ($1, 'platform_fee', $2, $3, 'GHS', 'completed', $4, $5, $6, $7)`,
      [platformRow.id, platformFeeCents, newPlatformBalance, `Platform fee: ${description}`, referenceId || null, referenceType || null, bureauRow.id]
    );

    await client.query("COMMIT");

    return {
      success: true,
      bureauWalletId: bureauRow.id,
      platformWalletId: platformRow.id,
      totalDeducted: totalCents,
      platformFee: platformFeeCents,
      bureauBalance: newBureauBalance,
      platformBalance: newPlatformBalance,
    };
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
}

export async function topupWallet(
  walletId: string,
  amountCents: number,
  method: "mobile_money" | "bank_transfer" | "stripe" | "manual",
  providerRef?: string,
  description?: string,
): Promise<{ success: boolean; newBalance: number; transactionId: string }> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const { rows: [wallet] } = await client.query(
      `SELECT id, balance_cents, currency FROM wallets WHERE id = $1 FOR UPDATE`,
      [walletId]
    );
    if (!wallet) {
      await client.query("ROLLBACK");
      throw new Error("Wallet not found");
    }

    const newBalance = wallet.balance_cents + amountCents;

    await client.query(
      `UPDATE wallets SET balance_cents = $1, last_topup_at = NOW(), updated_at = NOW() WHERE id = $2`,
      [newBalance, walletId]
    );

    const { rows: [tx] } = await client.query(
      `INSERT INTO wallet_transactions (wallet_id, tx_type, amount_cents, balance_after_cents, currency, status, description, topup_method, topup_provider_ref)
       VALUES ($1, 'topup', $2, $3, $4, 'completed', $5, $6, $7) RETURNING id`,
      [walletId, amountCents, newBalance, wallet.currency, description || `Top-up via ${method}`, method, providerRef || null]
    );

    await client.query("COMMIT");
    return { success: true, newBalance, transactionId: tx.id };
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
}

export async function withdrawFromWallet(
  walletId: string,
  amountCents: number,
  description?: string,
  referenceId?: string,
): Promise<{ success: boolean; newBalance: number; insufficientFunds?: boolean }> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const { rows: [wallet] } = await client.query(
      `SELECT id, balance_cents, currency FROM wallets WHERE id = $1 FOR UPDATE`,
      [walletId]
    );
    if (!wallet) {
      await client.query("ROLLBACK");
      throw new Error("Wallet not found");
    }

    if (wallet.balance_cents < amountCents) {
      await client.query("ROLLBACK");
      return { success: false, newBalance: wallet.balance_cents, insufficientFunds: true };
    }

    const newBalance = wallet.balance_cents - amountCents;

    await client.query(
      `UPDATE wallets SET balance_cents = $1, updated_at = NOW() WHERE id = $2`,
      [newBalance, walletId]
    );

    await client.query(
      `INSERT INTO wallet_transactions (wallet_id, tx_type, amount_cents, balance_after_cents, currency, status, description, reference_id, reference_type)
       VALUES ($1, 'withdrawal', $2, $3, $4, 'completed', $5, $6, 'withdrawal')`,
      [walletId, -amountCents, newBalance, wallet.currency, description || "Withdrawal to bank/MoMo", referenceId || null]
    );

    await client.query("COMMIT");
    return { success: true, newBalance };
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
}

export async function getWalletBalance(organizationId: string): Promise<{ balanceCents: number; currency: string; isLow: boolean } | null> {
  const { rows: [wallet] } = await pool.query(
    `SELECT balance_cents, currency, low_balance_threshold_cents FROM wallets WHERE organization_id = $1 LIMIT 1`,
    [organizationId]
  );
  if (!wallet) return null;
  return {
    balanceCents: wallet.balance_cents,
    currency: wallet.currency,
    isLow: wallet.balance_cents < wallet.low_balance_threshold_cents,
  };
}
