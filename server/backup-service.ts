import { execSync, exec } from "child_process";
import * as fs from "fs";
import * as path from "path";
import { pool } from "./db";

const BACKUP_DIR = path.resolve(process.cwd(), "backups");
const MAX_BACKUPS = 30;
const BACKUP_INTERVAL_MS = 24 * 60 * 60 * 1000;

function safeBackupPath(filename: string): string {
  const resolved = path.resolve(BACKUP_DIR, filename);
  if (!resolved.startsWith(BACKUP_DIR + path.sep)) throw new Error("Invalid backup path");
  return resolved;
}

export interface BackupRecord {
  id: string;
  filename: string;
  type: "full" | "schema" | "data";
  sizeMB: number;
  status: "completed" | "failed" | "in_progress";
  createdAt: string;
  createdBy: string;
  tables: number;
  rows: number;
  durationMs: number;
  notes?: string;
}

let schedulerTimer: ReturnType<typeof setInterval> | null = null;
let lastAutoBackup: Date | null = null;

function ensureBackupDir() {
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }
}

function getBackupMetaPath(): string {
  return path.join(BACKUP_DIR, "backup-manifest.json");
}

function loadManifest(): BackupRecord[] {
  const metaPath = getBackupMetaPath();
  if (!fs.existsSync(metaPath)) return [];
  try {
    return JSON.parse(fs.readFileSync(metaPath, "utf-8"));
  } catch {
    return [];
  }
}

function saveManifest(records: BackupRecord[]) {
  fs.writeFileSync(getBackupMetaPath(), JSON.stringify(records, null, 2));
}

function generateId(): string {
  return `bk_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

async function getTableStats(): Promise<{ tables: number; rows: number }> {
  try {
    const result = await pool.query(`
      SELECT schemaname, relname, n_live_tup
      FROM pg_stat_user_tables
      WHERE schemaname = 'public'
      ORDER BY n_live_tup DESC
    `);
    const tables = result.rows.length;
    const rows = result.rows.reduce((sum: number, r: any) => sum + parseInt(r.n_live_tup || "0"), 0);
    return { tables, rows };
  } catch {
    return { tables: 0, rows: 0 };
  }
}

export async function createBackup(
  type: "full" | "schema" | "data" = "full",
  createdBy: string = "system",
  notes?: string
): Promise<BackupRecord> {
  ensureBackupDir();

  const id = generateId();
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const filename = `cdh_${type}_${timestamp}.sql.gz`;
  const filepath = safeBackupPath(filename);
  const startTime = Date.now();

  const record: BackupRecord = {
    id,
    filename,
    type,
    sizeMB: 0,
    status: "in_progress",
    createdAt: new Date().toISOString(),
    createdBy,
    tables: 0,
    rows: 0,
    durationMs: 0,
    notes,
  };

  const manifest = loadManifest();
  manifest.push(record);
  saveManifest(manifest);

  try {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) throw new Error("DATABASE_URL not configured");

    let pgDumpArgs = "";
    if (type === "schema") {
      pgDumpArgs = "--schema-only";
    } else if (type === "data") {
      pgDumpArgs = "--data-only";
    }

    execSync(
      `pg_dump "${databaseUrl}" ${pgDumpArgs} --no-owner --no-privileges --clean --if-exists | gzip > "${filepath}"`,
      { timeout: 120000, maxBuffer: 200 * 1024 * 1024 }
    );

    const stats = fs.statSync(filepath);
    const tableStats = await getTableStats();

    record.sizeMB = parseFloat((stats.size / (1024 * 1024)).toFixed(2));
    record.status = "completed";
    record.tables = tableStats.tables;
    record.rows = tableStats.rows;
    record.durationMs = Date.now() - startTime;

    const idx = manifest.findIndex((r) => r.id === id);
    if (idx >= 0) manifest[idx] = record;
    saveManifest(manifest);

    await logBackupAudit(createdBy, "BACKUP_CREATED", `${type} backup: ${filename} (${record.sizeMB}MB, ${record.tables} tables, ${record.rows} rows)`);

    await uploadToS3IfConfigured(filepath, filename);

    pruneOldBackups();

    return record;
  } catch (err: any) {
    record.status = "failed";
    record.durationMs = Date.now() - startTime;
    record.notes = (record.notes || "") + ` Error: ${err.message}`;
    const idx = manifest.findIndex((r) => r.id === id);
    if (idx >= 0) manifest[idx] = record;
    saveManifest(manifest);

    if (fs.existsSync(filepath)) {
      fs.unlinkSync(filepath);
    }

    await logBackupAudit(createdBy, "BACKUP_FAILED", `${type} backup failed: ${err.message}`);
    throw err;
  }
}

export async function restoreBackup(backupId: string, restoredBy: string): Promise<{ success: boolean; message: string }> {
  const manifest = loadManifest();
  const record = manifest.find((r) => r.id === backupId);
  if (!record) throw new Error("Backup not found");
  if (record.status !== "completed") throw new Error("Cannot restore from incomplete backup");
  if (record.type === "schema") throw new Error("Cannot restore from schema-only backup — use a full or data backup");

  const filepath = safeBackupPath(record.filename);
  if (!fs.existsSync(filepath)) throw new Error("Backup file missing from disk");

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error("DATABASE_URL not configured");

  try {
    execSync(
      `gunzip -c "${filepath}" | psql "${databaseUrl}" 2>&1`,
      { timeout: 300000, maxBuffer: 200 * 1024 * 1024 }
    );

    await logBackupAudit(restoredBy, "BACKUP_RESTORED", `Restored from ${record.filename} (${record.type}, ${record.sizeMB}MB)`);

    return { success: true, message: `Successfully restored from ${record.filename}` };
  } catch (err: any) {
    await logBackupAudit(restoredBy, "RESTORE_FAILED", `Failed to restore ${record.filename}: ${err.message}`);
    throw new Error(`Restore failed: ${err.message}`);
  }
}

export function listBackups(): BackupRecord[] {
  const manifest = loadManifest();
  return manifest
    .filter((r) => {
      if (r.status === "completed") {
        try {
          const filepath = safeBackupPath(r.filename);
          return fs.existsSync(filepath);
        } catch { return false; }
      }
      return true;
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function getBackupFilePath(backupId: string): string | null {
  const manifest = loadManifest();
  const record = manifest.find((r) => r.id === backupId);
  if (!record || record.status !== "completed") return null;
  const filepath = safeBackupPath(record.filename);
  return fs.existsSync(filepath) ? filepath : null;
}

export function deleteBackup(backupId: string): boolean {
  const manifest = loadManifest();
  const idx = manifest.findIndex((r) => r.id === backupId);
  if (idx < 0) return false;

  const record = manifest[idx];
  const filepath = safeBackupPath(record.filename);
  if (fs.existsSync(filepath)) {
    fs.unlinkSync(filepath);
  }

  manifest.splice(idx, 1);
  saveManifest(manifest);
  return true;
}

function pruneOldBackups() {
  const manifest = loadManifest();
  const completed = manifest
    .filter((r) => r.status === "completed" && r.createdBy === "system")
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  if (completed.length > MAX_BACKUPS) {
    const toRemove = completed.slice(MAX_BACKUPS);
    for (const record of toRemove) {
      try {
        const filepath = safeBackupPath(record.filename);
        if (fs.existsSync(filepath)) fs.unlinkSync(filepath);
      } catch {}
      const idx = manifest.findIndex((r) => r.id === record.id);
      if (idx >= 0) manifest.splice(idx, 1);
    }
    saveManifest(manifest);
  }
}

async function uploadToS3IfConfigured(filepath: string, filename: string): Promise<void> {
  const bucket = process.env.BACKUP_S3_BUCKET;
  const accessKey = process.env.AWS_ACCESS_KEY_ID;
  const secretKey = process.env.AWS_SECRET_ACCESS_KEY;

  if (!bucket || !accessKey || !secretKey) {
    console.log(`[Backup] S3 not configured — backup saved locally only`);
    return;
  }

  try {
    const { S3Client, PutObjectCommand } = await import("@aws-sdk/client-s3");
    const client = new S3Client({
      region: process.env.BACKUP_S3_REGION || "us-east-1",
      credentials: { accessKeyId: accessKey, secretAccessKey: secretKey },
    });
    const body = fs.readFileSync(filepath);
    await client.send(new PutObjectCommand({
      Bucket: bucket,
      Key: `backups/${filename}`,
      Body: body,
      ContentType: "application/gzip",
    }));
    console.log(`[Backup] Uploaded to S3: s3://${bucket}/backups/${filename}`);
  } catch (err: any) {
    console.error(`[Backup] S3 upload failed (local copy preserved): ${err.message}`);
  }
}

async function logBackupAudit(userId: string, action: string, details: string) {
  try {
    await pool.query(
      `INSERT INTO audit_logs (id, user_id, action, entity, details, ip_address, created_at)
       VALUES (gen_random_uuid(), $1, $2, 'backup', $3, '127.0.0.1', NOW())`,
      [userId, action, details]
    );
  } catch {}
}

export function getBackupStatus(): {
  schedulerRunning: boolean;
  lastAutoBackup: string | null;
  nextAutoBackup: string | null;
  totalBackups: number;
  totalSizeMB: number;
  backupDir: string;
} {
  const manifest = loadManifest();
  const completed = manifest.filter((r) => r.status === "completed");
  const totalSizeMB = completed.reduce((sum, r) => sum + r.sizeMB, 0);

  let nextAutoBackup: string | null = null;
  if (schedulerTimer && lastAutoBackup) {
    nextAutoBackup = new Date(lastAutoBackup.getTime() + BACKUP_INTERVAL_MS).toISOString();
  }

  return {
    schedulerRunning: schedulerTimer !== null,
    lastAutoBackup: lastAutoBackup?.toISOString() || null,
    nextAutoBackup,
    totalBackups: completed.length,
    totalSizeMB: parseFloat(totalSizeMB.toFixed(2)),
    backupDir: BACKUP_DIR,
  };
}

export async function verifyBackupIntegrity(backupId?: string): Promise<{ valid: boolean; message: string; details?: Record<string, any> }> {
  const manifest = loadManifest();
  const record = backupId
    ? manifest.find(r => r.id === backupId)
    : manifest.filter(r => r.status === "completed" && r.type === "full").sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];

  if (!record) {
    return { valid: false, message: "No completed backup found to verify" };
  }

  try {
    const filepath = safeBackupPath(record.filename);
    if (!fs.existsSync(filepath)) {
      return { valid: false, message: `Backup file missing: ${record.filename}` };
    }

    const stats = fs.statSync(filepath);
    if (stats.size < 100) {
      return { valid: false, message: `Backup file suspiciously small (${stats.size} bytes): ${record.filename}` };
    }

    const output = execSync(
      `gunzip -c "${filepath}" | head -100`,
      { timeout: 30000, maxBuffer: 10 * 1024 * 1024 }
    ).toString();

    const hasSqlContent = output.includes("PostgreSQL") || output.includes("CREATE") || output.includes("INSERT") || output.includes("SET") || output.includes("SELECT");
    if (!hasSqlContent) {
      return { valid: false, message: `Backup does not appear to contain valid SQL: ${record.filename}` };
    }

    const lineCount = execSync(
      `gunzip -c "${filepath}" | wc -l`,
      { timeout: 60000, maxBuffer: 10 * 1024 * 1024 }
    ).toString().trim();

    const details = {
      filename: record.filename,
      sizeMB: record.sizeMB,
      tables: record.tables,
      rows: record.rows,
      sqlLines: parseInt(lineCount) || 0,
      createdAt: record.createdAt,
      ageHours: Math.round((Date.now() - new Date(record.createdAt).getTime()) / 3600000),
    };

    await logBackupAudit("system", "BACKUP_VERIFIED", `Integrity check passed: ${record.filename} (${details.sqlLines} SQL lines, ${record.sizeMB}MB)`);

    return { valid: true, message: `Backup verified: ${record.filename}`, details };
  } catch (err: any) {
    return { valid: false, message: `Backup verification failed: ${err.message}` };
  }
}

export function startBackupScheduler() {
  if (schedulerTimer) return;

  console.log("[Backup] Scheduler started — daily automated backups enabled");

  schedulerTimer = setInterval(async () => {
    try {
      console.log("[Backup] Running scheduled backup...");
      const result = await createBackup("full", "system", "Scheduled daily backup");
      lastAutoBackup = new Date();
      console.log(`[Backup] Scheduled backup completed: ${result.filename} (${result.sizeMB}MB)`);

      const integrity = await verifyBackupIntegrity(result.id);
      if (!integrity.valid) {
        console.error(`[Backup] INTEGRITY CHECK FAILED: ${integrity.message}`);
      } else {
        console.log(`[Backup] Integrity verified: ${integrity.details?.sqlLines} SQL lines`);
      }
    } catch (err: any) {
      console.error(`[Backup] Scheduled backup failed: ${err.message}`);
    }
  }, BACKUP_INTERVAL_MS);

  setTimeout(async () => {
    const backups = listBackups();
    const recentFull = backups.find(
      (b) => b.type === "full" && b.status === "completed" &&
      Date.now() - new Date(b.createdAt).getTime() < BACKUP_INTERVAL_MS
    );
    if (!recentFull) {
      try {
        console.log("[Backup] No recent backup found — creating initial backup...");
        const result = await createBackup("full", "system", "Initial startup backup");
        lastAutoBackup = new Date();
        console.log(`[Backup] Initial backup completed: ${result.filename} (${result.sizeMB}MB)`);
      } catch (err: any) {
        console.error(`[Backup] Initial backup failed: ${err.message}`);
      }
    } else {
      lastAutoBackup = new Date(recentFull.createdAt);
      console.log(`[Backup] Recent backup exists (${recentFull.filename}), skipping initial backup`);
    }
  }, 10000);
}

export function stopBackupScheduler() {
  if (schedulerTimer) {
    clearInterval(schedulerTimer);
    schedulerTimer = null;
    console.log("[Backup] Scheduler stopped");
  }
}
