import crypto from "crypto";
import { pool } from "./db";
import { blockchainAnchors } from "@shared/schema";
import { db } from "./db";

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
    const lastAnchorResult = await pool.query(
      `SELECT last_log_id FROM blockchain_anchors ORDER BY anchored_at DESC LIMIT 1`
    );

    let query: string;
    let params: any[];

    if (lastAnchorResult.rows.length > 0 && lastAnchorResult.rows[0].last_log_id) {
      const lastLogId = lastAnchorResult.rows[0].last_log_id;
      query = `SELECT id, current_hash FROM audit_logs WHERE created_at > (SELECT created_at FROM audit_logs WHERE id = $1) ORDER BY created_at ASC`;
      params = [lastLogId];
    } else {
      query = `SELECT id, current_hash FROM audit_logs ORDER BY created_at ASC`;
      params = [];
    }

    const auditResult = await pool.query(query, params);

    if (auditResult.rows.length === 0) return null;

    const hashes = auditResult.rows.map((r: any) => r.current_hash).filter(Boolean);
    if (hashes.length === 0) return null;

    const merkleRoot = computeMerkleRoot(hashes);
    const { txHash, blockNumber } = simulateBlockchainTx(merkleRoot);

    const firstLogId = auditResult.rows[0].id;
    const lastLogId = auditResult.rows[auditResult.rows.length - 1].id;

    const [anchor] = await db.insert(blockchainAnchors).values({
      merkleRoot,
      auditLogCount: auditResult.rows.length,
      firstLogId,
      lastLogId,
      simulatedTxHash: txHash,
      simulatedBlockNumber: blockNumber,
      simulatedChain: "ethereum-sepolia",
      status: "anchored",
    }).returning();

    console.log(`[Blockchain] Anchored ${auditResult.rows.length} audit logs — Merkle root: ${merkleRoot.substring(0, 16)}...`);

    return {
      id: anchor.id,
      merkleRoot,
      auditLogCount: auditResult.rows.length,
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
  const anchorResult = await pool.query(
    `SELECT * FROM blockchain_anchors WHERE id = $1`,
    [anchorId]
  );

  if (anchorResult.rows.length === 0) throw new Error("Anchor not found");

  const anchor = anchorResult.rows[0];

  let query: string;
  let params: any[];

  if (anchor.first_log_id && anchor.last_log_id) {
    query = `SELECT current_hash FROM audit_logs 
             WHERE created_at >= (SELECT created_at FROM audit_logs WHERE id = $1) 
             AND created_at <= (SELECT created_at FROM audit_logs WHERE id = $2) 
             ORDER BY created_at ASC`;
    params = [anchor.first_log_id, anchor.last_log_id];
  } else {
    query = `SELECT current_hash FROM audit_logs ORDER BY created_at ASC LIMIT $1`;
    params = [anchor.audit_log_count];
  }

  const logsResult = await pool.query(query, params);
  const hashes = logsResult.rows.map((r: any) => r.current_hash).filter(Boolean);
  const recomputedMerkleRoot = computeMerkleRoot(hashes);

  return {
    valid: recomputedMerkleRoot === anchor.merkle_root,
    anchorMerkleRoot: anchor.merkle_root,
    recomputedMerkleRoot,
    logCount: hashes.length,
  };
}

export async function getAnchors(limit = 20): Promise<any[]> {
  const result = await pool.query(
    `SELECT * FROM blockchain_anchors ORDER BY anchored_at DESC LIMIT $1`,
    [limit]
  );
  return result.rows;
}

let anchorInterval: ReturnType<typeof setInterval> | null = null;

export function startAnchorScheduler(intervalHours = 6): void {
  createAnchor().catch(() => {});

  anchorInterval = setInterval(async () => {
    await createAnchor();
  }, intervalHours * 60 * 60 * 1000);

  console.log(`[Blockchain] Anchor scheduler started — runs every ${intervalHours} hours`);
}
