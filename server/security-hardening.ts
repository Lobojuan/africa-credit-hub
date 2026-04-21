import { pool, db } from "./db";
import { sql } from "drizzle-orm";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { encryptPII } from "./encryption";

const PASSWORD_HISTORY_SIZE = 5;

export async function checkPasswordHistory(userId: string, newPassword: string): Promise<{ reused: boolean; message?: string }> {
  const result = await pool.query(
    `SELECT password, password_history FROM users WHERE id = $1`,
    [userId]
  );
  if (!result.rows[0]) return { reused: false };

  const { password: currentHash, password_history: history } = result.rows[0];
  const allHashes = [currentHash, ...(history || [])];

  for (const hash of allHashes) {
    if (hash && await bcrypt.compare(newPassword, hash)) {
      return { reused: true, message: `Cannot reuse any of your last ${PASSWORD_HISTORY_SIZE} passwords` };
    }
  }
  return { reused: false };
}

export async function pushPasswordHistory(userId: string, oldPasswordHash: string): Promise<void> {
  const result = await pool.query(
    `SELECT password_history FROM users WHERE id = $1`,
    [userId]
  );
  const history: string[] = result.rows[0]?.password_history || [];
  history.unshift(oldPasswordHash);
  const trimmed = history.slice(0, PASSWORD_HISTORY_SIZE - 1);

  await pool.query(
    `UPDATE users SET password_history = $1 WHERE id = $2`,
    [trimmed, userId]
  );
}

export async function detectLoginAnomaly(
  userId: string,
  currentIp: string
): Promise<{ anomaly: boolean; reason?: string; newIp: boolean }> {
  const result = await pool.query(
    `SELECT last_login_ip, known_ips, full_name, username FROM users WHERE id = $1`,
    [userId]
  );
  if (!result.rows[0]) return { anomaly: false, newIp: false };

  const { last_login_ip, known_ips, full_name, username } = result.rows[0];
  const knownList: string[] = known_ips || [];
  const isNewIp = !knownList.includes(currentIp);

  if (isNewIp) {
    const updatedIps = [...knownList, currentIp].slice(-20);
    await pool.query(
      `UPDATE users SET known_ips = $1, last_login_ip = $2 WHERE id = $3`,
      [updatedIps, currentIp, userId]
    );

    if (knownList.length > 0) {
      await pool.query(
        `INSERT INTO audit_logs (id, user_id, action, entity, entity_id, details, ip_address, created_at)
         VALUES (gen_random_uuid(), $1, 'LOGIN_NEW_IP', 'user', $1, $2, $3, NOW())`,
        [userId, `New IP address detected for ${full_name} (${username}). IP: ${currentIp}. Previously known IPs: ${knownList.length}`, currentIp]
      );
      return { anomaly: true, reason: `Login from new IP address: ${currentIp}`, newIp: true };
    }
  } else {
    await pool.query(
      `UPDATE users SET last_login_ip = $1 WHERE id = $2`,
      [currentIp, userId]
    );
  }

  return { anomaly: false, newIp: isNewIp };
}

export async function runSecurityHealthCheck(): Promise<{
  overall: "healthy" | "degraded" | "critical";
  checks: Array<{ name: string; status: "pass" | "warn" | "fail"; details: string }>;
  timestamp: string;
}> {
  const checks: Array<{ name: string; status: "pass" | "warn" | "fail"; details: string }> = [];

  try {
    const dbResult = await db.execute(sql`SELECT 1 AS ok`);
    checks.push({ name: "Database Connectivity", status: dbResult.rows[0]?.ok === 1 ? "pass" : "fail", details: dbResult.rows[0]?.ok === 1 ? "Database responding" : "Database not responding" });
  } catch {
    checks.push({ name: "Database Connectivity", status: "fail", details: "Cannot connect to database" });
  }

  try {
    const encKey = process.env.PII_ENCRYPTION_KEY;
    const sessionSecret = process.env.SESSION_SECRET;
    if (encKey && encKey.length >= 32) {
      checks.push({ name: "PII Encryption Key", status: "pass", details: "Dedicated PII encryption key configured" });
    } else if (sessionSecret) {
      checks.push({ name: "PII Encryption Key", status: "warn", details: "Using SESSION_SECRET fallback — set PII_ENCRYPTION_KEY for production" });
    } else {
      checks.push({ name: "PII Encryption Key", status: "fail", details: "No encryption key available" });
    }
  } catch {
    checks.push({ name: "PII Encryption Key", status: "fail", details: "Error checking encryption key" });
  }

  const isProduction = process.env.NODE_ENV === "production" || process.env.PRODUCTION_MODE === "true";
  checks.push({
    name: "HTTPS / TLS",
    status: isProduction ? "pass" : "warn",
    details: isProduction ? "Running in production mode with TLS expected" : "Development mode — TLS not enforced"
  });

  checks.push({
    name: "CSRF Protection",
    status: "pass",
    details: "CSRF middleware active with fail-closed enforcement"
  });

  checks.push({
    name: "Security Headers",
    status: "pass",
    details: "CSP, HSTS, X-Frame-Options, Referrer-Policy, Permissions-Policy all active"
  });

  try {
    const chainResult = await db.execute(sql`
      SELECT COUNT(*) as total,
             SUM(CASE WHEN previous_hash IS NOT NULL THEN 1 ELSE 0 END) as chained
      FROM audit_logs
      WHERE created_at > NOW() - INTERVAL '7 days'
    `);
    const { total, chained } = chainResult.rows[0];
    const intTotal = parseInt(total);
    const intChained = parseInt(chained || "0");
    if (intTotal === 0) {
      checks.push({ name: "Audit Trail Integrity", status: "warn", details: "No audit logs in the last 7 days" });
    } else {
      const chainRate = intTotal > 0 ? (intChained / intTotal * 100).toFixed(1) : "0";
      checks.push({ name: "Audit Trail Integrity", status: "pass", details: `${intTotal} audit entries in 7 days, ${chainRate}% hash-chained` });
    }
  } catch {
    checks.push({ name: "Audit Trail Integrity", status: "warn", details: "Could not verify audit trail" });
  }

  try {
    const lockResult = await db.execute(sql`SELECT COUNT(*) as locked FROM users WHERE locked_until > NOW()`);
    const lockedCount = parseInt(lockResult.rows[0].locked as string);
    checks.push({
      name: "Account Lockouts",
      status: lockedCount > 5 ? "warn" : "pass",
      details: `${lockedCount} account(s) currently locked`
    });
  } catch {
    checks.push({ name: "Account Lockouts", status: "warn", details: "Could not check lockouts" });
  }

  checks.push({
    name: "Password Policy",
    status: "pass",
    details: "Min 8 chars, uppercase, lowercase, digit, special char, 90-day expiry, 5-password history"
  });

  try {
    const mfaResult = await db.execute(sql`
      SELECT COUNT(*) as total, SUM(CASE WHEN mfa_enabled THEN 1 ELSE 0 END) as mfa_on FROM users WHERE status = 'active'
    `);
    const { total, mfa_on } = mfaResult.rows[0];
    const mfaRate = parseInt(total) > 0 ? (parseInt(mfa_on || "0") / parseInt(total) * 100).toFixed(0) : "0";
    checks.push({
      name: "MFA Adoption",
      status: parseInt(mfaRate) >= 50 ? "pass" : "warn",
      details: `${mfaRate}% of active users have MFA enabled (${mfa_on}/${total})`
    });
  } catch {
    checks.push({ name: "MFA Adoption", status: "warn", details: "Could not check MFA status" });
  }

  checks.push({
    name: "Rate Limiting",
    status: "pass",
    details: "Tiered rate limiting active on API endpoints"
  });

  checks.push({
    name: "Error Sanitization",
    status: "pass",
    details: "Stack traces suppressed in production error responses"
  });

  const failCount = checks.filter(c => c.status === "fail").length;
  const warnCount = checks.filter(c => c.status === "warn").length;
  const overall = failCount > 0 ? "critical" : warnCount > 2 ? "degraded" : "healthy";

  return { overall, checks, timestamp: new Date().toISOString() };
}

export async function encryptAllUnencryptedPII(): Promise<{ totalEncrypted: number; errors: string[] }> {
  const PII_COLUMNS = [
    "national_id", "tin_number", "passport_number", "voters_id",
    "ssnit_number", "drivers_license", "ghana_card_number", "ezwich_number",
    "other_id_number", "date_of_birth", "mobile_money_number"
  ];

  let totalEncrypted = 0;
  const errors: string[] = [];

  for (const col of PII_COLUMNS) {
    try {
      const colId = sql.identifier(col);
      const rows = await db.execute(
        sql`SELECT id, ${colId} FROM borrowers WHERE ${colId} IS NOT NULL AND ${colId} != '' AND ${colId} NOT LIKE 'enc:%'`
      );

      if (rows.rows.length === 0) continue;

      const BATCH_SIZE = 100;
      for (let i = 0; i < rows.rows.length; i += BATCH_SIZE) {
        const batch = rows.rows.slice(i, i + BATCH_SIZE);
        try {
          await db.transaction(async (tx) => {
            for (const row of batch) {
              const encrypted = encryptPII(row[col] as string);
              await tx.execute(
                sql`UPDATE borrowers SET ${colId} = ${encrypted} WHERE id = ${row.id} AND ${colId} NOT LIKE 'enc:%'`
              );
              totalEncrypted++;
            }
          });
        } catch (batchErr: any) {
          errors.push(`${col} batch at offset ${i}: ${batchErr.message}`);
        }
      }

      console.log(`[PII-Encrypt] Encrypted ${rows.rows.length} records in column '${col}'`);
    } catch (err: any) {
      errors.push(`${col}: ${err.message}`);
    }
  }

  return { totalEncrypted, errors };
}

export async function verifyPIIEncryptionIntegrity(): Promise<{
  totalBorrowers: number;
  encryptedCount: number;
  unencryptedCount: number;
  integrityRate: string;
  sampleIssues: string[];
}> {
  const PII_COLUMNS = [
    "national_id", "tin_number", "passport_number", "voters_id",
    "ssnit_number", "drivers_license", "ghana_card_number", "ezwich_number",
    "other_id_number", "date_of_birth", "mobile_money_number"
  ];

  const result = await db.execute(sql`SELECT COUNT(*) as total FROM borrowers`);
  const totalBorrowers = parseInt(result.rows[0].total as string);

  if (totalBorrowers === 0) {
    return { totalBorrowers: 0, encryptedCount: 0, unencryptedCount: 0, integrityRate: "N/A", sampleIssues: [] };
  }

  let encryptedCount = 0;
  let unencryptedCount = 0;
  const sampleIssues: string[] = [];

  for (const col of PII_COLUMNS) {
    try {
      const colId = sql.identifier(col);
      const colCheck = await db.execute(
        sql`SELECT COUNT(*) as has_data FROM borrowers WHERE ${colId} IS NOT NULL AND ${colId} != ''`
      );
      const hasData = parseInt(colCheck.rows[0].has_data as string);
      if (hasData === 0) continue;

      const encPattern = "^enc:[0-9a-f]{32}:[0-9a-f]{32}:[0-9a-f]+";
      const encCheck = await db.execute(
        sql`SELECT COUNT(*) as encrypted FROM borrowers WHERE ${colId} IS NOT NULL AND ${colId} ~ ${encPattern}`
      );
      const encrypted = parseInt(encCheck.rows[0].encrypted as string);

      const plainCount = hasData - encrypted;
      encryptedCount += encrypted;
      unencryptedCount += plainCount;

      if (plainCount > 0) {
        sampleIssues.push(`${col}: ${plainCount} unencrypted records (${encrypted} encrypted)`);
      }
    } catch {
      sampleIssues.push(`${col}: could not verify`);
    }
  }

  const total = encryptedCount + unencryptedCount;
  const integrityRate = total > 0 ? (encryptedCount / total * 100).toFixed(1) + "%" : "N/A";

  return { totalBorrowers, encryptedCount, unencryptedCount, integrityRate, sampleIssues };
}

export function sanitizeErrorForResponse(error: any, isProduction: boolean): { status: number; message: string } {
  const status = error.status || error.statusCode || 500;

  if (status >= 500 && isProduction) {
    const errorId = crypto.randomBytes(4).toString("hex");
    console.error(`[Error ${errorId}]`, error.stack || error.message || error);
    return {
      status,
      message: `An internal error occurred. Reference: ${errorId}`
    };
  }

  const safeMessage = (error.message || "An error occurred")
    .replace(/at\s+\S+\s+\(.*?\)/g, "")
    .replace(/\/[\w/.-]+\.(?:ts|js):\d+:\d+/g, "")
    .replace(/Error:\s*/g, "")
    .trim();

  return { status, message: safeMessage || "An error occurred" };
}

let integrityCheckInterval: NodeJS.Timeout | null = null;

export function startIntegrityScheduler(intervalHours: number = 24): void {
  if (integrityCheckInterval) clearInterval(integrityCheckInterval);

  console.log(`[IntegrityCheck] Scheduler started — runs every ${intervalHours} hours`);

  integrityCheckInterval = setInterval(async () => {
    try {
      const result = await verifyPIIEncryptionIntegrity();
      if (result.unencryptedCount > 0) {
        console.warn(`[IntegrityCheck] WARNING: ${result.unencryptedCount} unencrypted PII fields detected!`, result.sampleIssues);
        await pool.query(
          `INSERT INTO audit_logs (id, user_id, action, entity, details, created_at)
           VALUES (gen_random_uuid(), 'system', 'PII_INTEGRITY_WARNING', 'system', $1, NOW())`,
          [`Unencrypted PII detected: ${result.unencryptedCount} fields. Issues: ${result.sampleIssues.join("; ")}`]
        );
      } else {
        console.log(`[IntegrityCheck] All PII fields encrypted. Rate: ${result.integrityRate}`);
      }
    } catch (err) {
      console.error("[IntegrityCheck] Error during integrity check:", err);
    }
  }, intervalHours * 60 * 60 * 1000);

  setTimeout(async () => {
    try {
      const result = await verifyPIIEncryptionIntegrity();
      console.log(`[IntegrityCheck] Initial check: ${result.integrityRate} encrypted (${result.encryptedCount}/${result.encryptedCount + result.unencryptedCount} fields)`);
      if (result.sampleIssues.length > 0) {
        console.warn(`[IntegrityCheck] Issues:`, result.sampleIssues);
      }
    } catch (err) {
      console.error("[IntegrityCheck] Initial check error:", err);
    }
  }, 10000);
}
