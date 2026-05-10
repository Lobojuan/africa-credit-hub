/**
 * Loto Draw Engine — provably-fair commit-reveal RNG.
 *
 * Algorithm (verifiable by anyone):
 *   1. At schedule time we generate a random 256-bit serverSeed and 128-bit
 *      serverNonce. We publish ONLY:
 *        commitmentHash = SHA-256(serverSeed ":" serverNonce ":" drawId
 *                                 ":" periodEnd-ISO ":" countryCode)
 *      Binding the commitment to drawId + periodEnd + countryCode means
 *      a published commitment can only ever apply to one specific draw —
 *      operators cannot retroactively shop a seed against a different draw.
 *   2. At draw time we snapshot the eligible receipts (deterministically
 *      sorted by id) and compute poolHash = SHA-256(receiptIds joined by '\n').
 *   3. We reveal serverSeed + serverNonce. For every eligible receipt we
 *      compute selectionHash = HMAC-SHA256(serverSeed ":" serverNonce,
 *                                          drawNumber ":" receiptId).
 *      Receipts are then sorted ascending by selectionHash; the top
 *      (sum of slotCounts) receipts win, allocated to tiers in published
 *      `position` order, top-tier first.
 *   4. Verifiers re-run steps 1, 2 and 3 with the published seed/nonce and
 *      eligible receipt list and confirm the resulting winner list matches.
 */

import { createHash, createHmac, randomBytes } from "crypto";
import { storage } from "../storage";
import type {
  InsertAuditLog,
  LotoDraw, LotoDrawPrizeTier, LotoDrawWinner, LotoReceipt,
} from "@shared/schema";
import { adapterFor } from "./loto-payout-adapter";
import { sendWinnerNotifications } from "./loto-notifications";

async function writeAudit(
  action: string,
  draw: { id: string; countryCode: string; drawNumber: number },
  details: Record<string, unknown>,
): Promise<void> {
  try {
    const log: InsertAuditLog = {
      action,
      entity: "loto_draw",
      entityId: draw.id,
      userId: null,
      details: JSON.stringify({ countryCode: draw.countryCode, drawNumber: draw.drawNumber, ...details }),
      ipAddress: null,
      organizationId: null,
    };
    await storage.createAuditLog(log);
  } catch {
    // Audit log failure must never abort a draw run.
  }
}

export interface Commitment {
  serverSeed: string;
  serverNonce: string;
  commitmentHash: string;
}

/**
 * Compute the commitment hash binding a (seed, nonce) pair to a specific
 * draw context. Exposed so the public verification page can recompute and
 * compare against the published value.
 */
export function computeCommitmentHash(input: {
  serverSeed: string;
  serverNonce: string;
  drawId: string;
  periodEndIso: string;
  countryCode: string;
}): string {
  return sha256Hex(
    `${input.serverSeed}:${input.serverNonce}:${input.drawId}:${input.periodEndIso}:${input.countryCode}`,
  );
}

/**
 * Generate a fresh seed/nonce pair. The commitmentHash is *not* computed
 * here because we don't yet know the drawId/periodEnd at this point —
 * callers compute it via computeCommitmentHash() once those are decided.
 */
export function generateCommitment(): { serverSeed: string; serverNonce: string } {
  return {
    serverSeed: randomBytes(32).toString("hex"),
    serverNonce: randomBytes(16).toString("hex"),
  };
}

export function sha256Hex(input: string): string {
  return createHash("sha256").update(input, "utf8").digest("hex");
}

export function hmacSha256Hex(key: string, message: string): string {
  return createHmac("sha256", key).update(message, "utf8").digest("hex");
}

export function computePoolHash(receiptIds: string[]): string {
  return sha256Hex(receiptIds.join("\n"));
}

export interface VerifyContext {
  drawNumber: number;
  serverSeed: string;
  serverNonce: string;
  eligibleReceiptIds: string[];
}

/**
 * Pure deterministic ranking. Given the seed/nonce/drawNumber and the sorted
 * eligible receipt id list, produce winners ordered by selection rank.
 * Same logic runs in the browser via SubtleCrypto for public verification.
 */
export function rankEligibleReceipts(ctx: VerifyContext): Array<{ receiptId: string; selectionHash: string }> {
  const seedKey = `${ctx.serverSeed}:${ctx.serverNonce}`;
  const ranked = ctx.eligibleReceiptIds
    .map((receiptId) => ({
      receiptId,
      selectionHash: hmacSha256Hex(seedKey, `${ctx.drawNumber}:${receiptId}`),
    }))
    .sort((a, b) => (a.selectionHash < b.selectionHash ? -1 : a.selectionHash > b.selectionHash ? 1 : 0));
  return ranked;
}

export interface RunDrawResult {
  draw: LotoDraw;
  winners: LotoDrawWinner[];
  tiers: LotoDrawPrizeTier[];
  alreadyRun: boolean;
}

/**
 * Idempotently run a scheduled draw. If the draw is already closed/verified
 * we simply return the persisted result — safe for the scheduler to retry.
 */
export async function runDraw(drawId: string): Promise<RunDrawResult> {
  const existing = await storage.getLotoDraw(drawId);
  if (!existing) throw new Error(`Draw not found: ${drawId}`);

  if (existing.status === "closed" || existing.status === "verified") {
    const winners = await storage.listLotoDrawWinners(drawId);
    const tiers = await storage.listLotoDrawPrizeTiers(drawId);
    return { draw: existing, winners, tiers, alreadyRun: true };
  }

  if (!existing.serverSeed || !existing.serverNonce) {
    // Internal error — draws are always created with seed/nonce stored alongside the commitment.
    throw new Error(`Draw ${drawId} has no stored seed/nonce; cannot run.`);
  }

  // Verify the commitment is consistent with the stored seed before reveal.
  const recomputedCommitment = computeCommitmentHash({
    serverSeed: existing.serverSeed,
    serverNonce: existing.serverNonce,
    drawId: existing.id,
    periodEndIso: existing.periodEnd.toISOString(),
    countryCode: existing.countryCode,
  });
  if (recomputedCommitment !== existing.commitmentHash) {
    throw new Error(`Draw ${drawId} commitment hash mismatch — refusing to run.`);
  }

  const tiers = await storage.listLotoDrawPrizeTiers(drawId);
  if (tiers.length === 0) throw new Error(`Draw ${drawId} has no prize tiers configured.`);

  const eligible = await storage.getEligibleReceiptsForDraw(
    existing.countryCode, existing.periodStart, existing.periodEnd,
  );
  const sortedEligible: LotoReceipt[] = [...eligible].sort((a, b) => (a.id < b.id ? -1 : 1));
  const eligibleIds = sortedEligible.map((r) => r.id);
  const poolHash = computePoolHash(eligibleIds);

  const totalSlots = tiers.reduce((s, t) => s + t.slotCount, 0);
  const totalPool = tiers.reduce((s, t) => s + Number(t.prizeAmount) * t.slotCount, 0);

  const ranking = rankEligibleReceipts({
    drawNumber: existing.drawNumber,
    serverSeed: existing.serverSeed,
    serverNonce: existing.serverNonce,
    eligibleReceiptIds: eligibleIds,
  });

  // Allocate winners to tiers in `position` order, top tier first.
  const tiersByPosition = [...tiers].sort((a, b) => a.position - b.position);
  const winnersToInsert: Array<{
    drawId: string; receiptId: string; consumerUserId: string | null;
    tier: string; prizeAmount: string; currency: string;
    selectionRank: number; selectionHash: string;
  }> = [];

  let cursor = 0;
  let rank = 1;
  for (const tier of tiersByPosition) {
    for (let slot = 0; slot < tier.slotCount; slot++) {
      if (cursor >= ranking.length) break;
      const pick = ranking[cursor];
      const receipt = sortedEligible.find((r) => r.id === pick.receiptId)!;
      winnersToInsert.push({
        drawId: existing.id,
        receiptId: pick.receiptId,
        consumerUserId: receipt.consumerUserId ?? null,
        tier: tier.tier,
        prizeAmount: String(tier.prizeAmount),
        currency: tier.currency,
        selectionRank: rank++,
        selectionHash: pick.selectionHash,
      });
      cursor++;
    }
  }

  // Atomic persistence — flips status to "closed" with the reveal in the same txn.
  // The eligibleReceiptIdsSnapshot is the canonical immutable pool list used
  // for all future verification; we never re-derive eligibility live.
  const persisted = await storage.persistLotoDrawResults({
    drawId,
    poolHash,
    eligibleTicketCount: eligibleIds.length,
    eligibleReceiptIdsSnapshot: eligibleIds,
    totalPool: String(totalPool),
    winners: winnersToInsert,
  });

  // Tamper-evident audit trail (Task #283 transparency requirement).
  // Per-winner pick rows are written FIRST so that, even if the summary
  // event fails to persist, every individual selection is independently
  // attested in the audit log.
  for (const winner of persisted.winners) {
    await writeAudit("loto_winner_picked", existing, {
      winnerId: winner.id,
      receiptId: winner.receiptId,
      tier: winner.tier,
      selectionRank: winner.selectionRank,
      selectionHash: winner.selectionHash,
      prizeAmount: winner.prizeAmount,
      currency: winner.currency,
    });
  }
  await writeAudit("loto_draw_completed", existing, {
    eligibleTicketCount: eligibleIds.length,
    totalPool,
    winners: persisted.winners.length,
    poolHash,
    commitmentHash: existing.commitmentHash,
  });

  // Fire-and-forget payout dispatch — adapter is plug-and-play.
  const config = await storage.getLotoCountryDrawConfig(existing.countryCode);
  const provider = config?.payoutProvider ?? "simulated";
  const adapter = adapterFor(provider);
  for (const winner of persisted.winners) {
    let payoutStatus = "failed";
    let providerRef: string | null = null;
    try {
      const result = await adapter.disburse({
        winnerId: winner.id,
        amount: winner.prizeAmount,
        currency: winner.currency,
        countryCode: existing.countryCode,
        consumerUserId: winner.consumerUserId,
      });
      payoutStatus = result.status;
      providerRef = result.providerRef;
      await storage.recordLotoPayout({
        winnerId: winner.id,
        provider,
        status: result.status,
        providerRef: result.providerRef,
        lastError: result.error ?? null,
        amount: winner.prizeAmount,
        currency: winner.currency,
      });
    } catch (err) {
      await storage.recordLotoPayout({
        winnerId: winner.id,
        provider,
        status: "failed",
        providerRef: null,
        lastError: err instanceof Error ? err.message : String(err),
        amount: winner.prizeAmount,
        currency: winner.currency,
      });
    }
    await writeAudit("loto_payout_dispatched", existing, {
      winnerId: winner.id,
      tier: winner.tier,
      amount: winner.prizeAmount,
      currency: winner.currency,
      provider,
      status: payoutStatus,
      providerRef,
    });
  }

  // Notify winners — runs AFTER payout dispatch so the SMS body can refer
  // to the prize. Audit-log separation: winner SMS is recorded in
  // loto_outbound_messages with purpose='winner_notification', distinct from
  // the 'loto_payout_dispatched' / future 'loto_prize_claimed' audit entries
  // (Task #286 mandate). Failures inside notifications never break the draw.
  try {
    await sendWinnerNotifications({ draw: persisted.draw, winners: persisted.winners });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("[loto-draw-engine] winner notifications failed (non-fatal):", err);
  }

  return { draw: persisted.draw, winners: persisted.winners, tiers, alreadyRun: false };
}

export interface VerificationReport {
  drawId: string;
  status: "match" | "mismatch" | "pending_reveal";
  commitmentValid: boolean;
  commitmentRecomputed: string | null;
  poolHashValid: boolean;
  poolHashRecomputed: string | null;
  expectedWinners: Array<{ receiptId: string; selectionHash: string; selectionRank: number }>;
  publishedWinners: Array<{ receiptId: string; selectionHash: string; selectionRank: number }>;
  eligibleTicketCount: number;
}

/** Server-side re-run for the verification page's "verify on server" button. */
export async function verifyDraw(drawId: string): Promise<VerificationReport> {
  const draw = await storage.getLotoDraw(drawId);
  if (!draw) throw new Error(`Draw not found: ${drawId}`);

  if (!draw.serverSeed || !draw.serverNonce || draw.status === "scheduled" || draw.status === "open") {
    return {
      drawId,
      status: "pending_reveal",
      commitmentValid: false,
      commitmentRecomputed: null,
      poolHashValid: false,
      poolHashRecomputed: null,
      expectedWinners: [],
      publishedWinners: [],
      eligibleTicketCount: draw.eligibleTicketCount,
    };
  }

  const commitmentRecomputed = computeCommitmentHash({
    serverSeed: draw.serverSeed,
    serverNonce: draw.serverNonce,
    drawId: draw.id,
    periodEndIso: draw.periodEnd.toISOString(),
    countryCode: draw.countryCode,
  });
  const commitmentValid = commitmentRecomputed === draw.commitmentHash;

  // Replay against the immutable snapshot captured at draw-close (Task #283
  // immutability requirement). Falling back to a live re-query is only done
  // for legacy draws closed before the snapshot column existed.
  const eligibleIds = draw.eligibleReceiptIdsSnapshot
    ?? (await storage.getEligibleReceiptsForDraw(
      draw.countryCode, draw.periodStart, draw.periodEnd,
    )).map((r) => r.id).sort();
  const poolHashRecomputed = computePoolHash(eligibleIds);
  const poolHashValid = poolHashRecomputed === draw.poolHash;

  const tiers = await storage.listLotoDrawPrizeTiers(drawId);
  const totalSlots = tiers.reduce((s, t) => s + t.slotCount, 0);

  const ranking = rankEligibleReceipts({
    drawNumber: draw.drawNumber,
    serverSeed: draw.serverSeed,
    serverNonce: draw.serverNonce,
    eligibleReceiptIds: eligibleIds,
  });
  const expectedWinners = ranking.slice(0, totalSlots).map((r, idx) => ({
    receiptId: r.receiptId,
    selectionHash: r.selectionHash,
    selectionRank: idx + 1,
  }));

  const publishedRows = await storage.listLotoDrawWinners(drawId);
  const publishedWinners = publishedRows
    .sort((a, b) => a.selectionRank - b.selectionRank)
    .map((w) => ({ receiptId: w.receiptId, selectionHash: w.selectionHash, selectionRank: w.selectionRank }));

  const winnersMatch =
    expectedWinners.length === publishedWinners.length &&
    expectedWinners.every((e, i) =>
      publishedWinners[i] &&
      e.receiptId === publishedWinners[i].receiptId &&
      e.selectionHash === publishedWinners[i].selectionHash);

  return {
    drawId,
    status: commitmentValid && poolHashValid && winnersMatch ? "match" : "mismatch",
    commitmentValid,
    commitmentRecomputed,
    poolHashValid,
    poolHashRecomputed,
    expectedWinners,
    publishedWinners,
    eligibleTicketCount: draw.eligibleTicketCount,
  };
}
