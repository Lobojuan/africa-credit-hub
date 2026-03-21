import crypto from "crypto";
import { db } from "./db";
import { blockchainAnchors, auditLogs } from "@shared/schema";
import { desc, asc, eq, gte, lte } from "drizzle-orm";

function computeMerkleRoot(hashes: string[]): string {
  if (hashes.length === 0) return crypto.createHash("sha256").update("EMPTY").digest("hex");
  if (hashes.length === 1) return hashes[0];

  const nextLevel: string[] = [];
  for (let i = 0; i < hashes.length; i += 2) {
    const left = hashes[i];
    const right = i + 1 < hashes.length ? hashes[i + 1] : left;
    const combined = crypto.createHash("sha256").update(left + right).digest("hex");
    nextLevel.push(combined);
  }
  return computeMerkleRoot(nextLevel);
}

function simulateBlockchainTx(merkleRoot: string): { txHash: string; blockNumber: number } {
  const txHash = "0x" + crypto.createHash("sha256")
    .update(merkleRoot + Date.now().toString() + crypto.randomBytes(16).toString("hex"))
    .digest("hex");
  const blockNumber = 19000000 + Math.floor(Math.random() * 1000000);
  return { txHash, blockNumber };
}

export async function createAnchor(): Promise<{
  id: string;
  merkleRoot: string;
  auditLogCount: number;
  txHash: string;
  blockNumber: number;
} | null> {
  try {
    const [lastAnchor] = await db
      .select({ lastLogId: blockchainAnchors.lastLogId })
      .from(blockchainAnchors)
      .orderBy(desc(blockchainAnchors.anchoredAt))
      .limit(1);

    let auditRows: { id: string; currentHash: string | null }[];

    if (lastAnchor?.lastLogId) {
      const [refLog] = await db
        .select({ createdAt: auditLogs.createdAt })
        .from(auditLogs)
        .where(eq(auditLogs.id, lastAnchor.lastLogId))
        .limit(1);

      if (refLog?.createdAt) {
        auditRows = await db
          .select({ id: auditLogs.id, currentHash: auditLogs.currentHash })
          .from(auditLogs)
          .where(gte(auditLogs.createdAt, refLog.createdAt))
          .orderBy(asc(auditLogs.createdAt));
        auditRows = auditRows.filter((r) => r.id !== lastAnchor.lastLogId);
      } else {
        auditRows = await db
          .select({ id: auditLogs.id, currentHash: auditLogs.currentHash })
          .from(auditLogs)
          .orderBy(asc(auditLogs.createdAt));
      }
    } else {
      auditRows = await db
        .select({ id: auditLogs.id, currentHash: auditLogs.currentHash })
        .from(auditLogs)
        .orderBy(asc(auditLogs.createdAt));
    }

    if (auditRows.length === 0) return null;

    const hashes = auditRows.map((r) => r.currentHash).filter(Boolean) as string[];
    if (hashes.length === 0) return null;

    const merkleRoot = computeMerkleRoot(hashes);
    const { txHash, blockNumber } = simulateBlockchainTx(merkleRoot);

    const firstLogId = auditRows[0].id;
    const lastLogId = auditRows[auditRows.length - 1].id;

    const [anchor] = await db.insert(blockchainAnchors).values({
      merkleRoot,
      auditLogCount: auditRows.length,
      firstLogId,
      lastLogId,
      simulatedTxHash: txHash,
      simulatedBlockNumber: blockNumber,
      simulatedChain: "ethereum-sepolia",
      status: "anchored",
    }).returning();

    console.log(`[Blockchain] Anchored ${auditRows.length} audit logs — Merkle root: ${merkleRoot.substring(0, 16)}...`);

    return {
      id: anchor.id,
      merkleRoot,
      auditLogCount: auditRows.length,
      txHash,
      blockNumber,
    };
  } catch (e: any) {
    console.error("[Blockchain] Anchor creation failed:", e.message);
    return null;
  }
}

export async function verifyAuditAgainstAnchor(anchorId: string): Promise<{
  valid: boolean;
  anchorMerkleRoot: string;
  recomputedMerkleRoot: string;
  logCount: number;
}> {
  const [anchor] = await db
    .select()
    .from(blockchainAnchors)
    .where(eq(blockchainAnchors.id, anchorId))
    .limit(1);

  if (!anchor) throw new Error("Anchor not found");

  let hashes: string[];

  if (anchor.firstLogId && anchor.lastLogId) {
    const [firstLog] = await db
      .select({ createdAt: auditLogs.createdAt })
      .from(auditLogs)
      .where(eq(auditLogs.id, anchor.firstLogId))
      .limit(1);

    const [lastLog] = await db
      .select({ createdAt: auditLogs.createdAt })
      .from(auditLogs)
      .where(eq(auditLogs.id, anchor.lastLogId))
      .limit(1);

    if (firstLog?.createdAt && lastLog?.createdAt) {
      const rows = await db
        .select({ currentHash: auditLogs.currentHash })
        .from(auditLogs)
        .where(
          gte(auditLogs.createdAt, firstLog.createdAt) &&
          lte(auditLogs.createdAt, lastLog.createdAt)
        )
        .orderBy(asc(auditLogs.createdAt));
      hashes = rows.map((r) => r.currentHash).filter(Boolean) as string[];
    } else {
      hashes = [];
    }
  } else {
    const rows = await db
      .select({ currentHash: auditLogs.currentHash })
      .from(auditLogs)
      .orderBy(asc(auditLogs.createdAt))
      .limit(anchor.auditLogCount);
    hashes = rows.map((r) => r.currentHash).filter(Boolean) as string[];
  }

  const recomputedMerkleRoot = computeMerkleRoot(hashes);

  return {
    valid: recomputedMerkleRoot === anchor.merkleRoot,
    anchorMerkleRoot: anchor.merkleRoot,
    recomputedMerkleRoot,
    logCount: hashes.length,
  };
}

export async function getAnchors(limit = 20): Promise<any[]> {
  return db
    .select()
    .from(blockchainAnchors)
    .orderBy(desc(blockchainAnchors.anchoredAt))
    .limit(limit);
}

let anchorInterval: ReturnType<typeof setInterval> | null = null;

export function startAnchorScheduler(intervalHours = 6): void {
  createAnchor().catch(() => {});

  anchorInterval = setInterval(async () => {
    await createAnchor();
  }, intervalHours * 60 * 60 * 1000);

  console.log(`[Blockchain] Anchor scheduler started — runs every ${intervalHours} hours`);
}
