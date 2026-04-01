import { pool } from "./db";
import { db } from "./db";
import { insertCreditAccountSchema, batchJobs } from "@shared/schema";
import { eq, sql } from "drizzle-orm";

const CHUNK_SIZE = 250;
const MAX_CONCURRENT_JOBS = 3;
let activeJobs = 0;
const pendingQueue: Array<() => void> = [];

function generateJobId(): string {
  return `job_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

async function waitForSlot(): Promise<void> {
  if (activeJobs < MAX_CONCURRENT_JOBS) {
    activeJobs++;
    return;
  }
  return new Promise((resolve) => {
    pendingQueue.push(() => {
      activeJobs++;
      resolve();
    });
  });
}

function releaseSlot(): void {
  activeJobs--;
  if (pendingQueue.length > 0) {
    const next = pendingQueue.shift()!;
    next();
  }
}

async function createJobInDb(
  jobId: string,
  type: "borrower_update" | "account_update" | "account_create",
  totalRecords: number,
  userId: string | null,
  organizationId: string | null = null,
): Promise<void> {
  await db.insert(batchJobs).values({
    id: jobId,
    type,
    status: "queued",
    totalRecords,
    processedRecords: 0,
    successCount: 0,
    errorCount: 0,
    errors: [],
    userId,
    organizationId,
  });
}

async function updateJobInDb(
  jobId: string,
  updates: {
    status?: string;
    processedRecords?: number;
    successCount?: number;
    errorCount?: number;
    errors?: Array<{ index: number; message: string }>;
    completedAt?: Date;
  },
): Promise<void> {
  const setFields: Record<string, any> = {};
  if (updates.status !== undefined) setFields.status = updates.status;
  if (updates.processedRecords !== undefined) setFields.processedRecords = updates.processedRecords;
  if (updates.successCount !== undefined) setFields.successCount = updates.successCount;
  if (updates.errorCount !== undefined) setFields.errorCount = updates.errorCount;
  if (updates.errors !== undefined) setFields.errors = updates.errors;
  if (updates.completedAt !== undefined) setFields.completedAt = updates.completedAt;

  if (Object.keys(setFields).length > 0) {
    await db.update(batchJobs).set(setFields).where(eq(batchJobs.id, jobId));
  }
}

interface JobProgress {
  processedRecords: number;
  successCount: number;
  errorCount: number;
  errors: Array<{ index: number; message: string }>;
}

async function processChunkedInserts(
  jobId: string,
  progress: JobProgress,
  records: any[],
  tableName: string,
  columns: string[],
  validateFn?: (record: any, index: number) => any
): Promise<void> {
  await updateJobInDb(jobId, { status: "processing" });

  for (let chunkStart = 0; chunkStart < records.length; chunkStart += CHUNK_SIZE) {
    const chunk = records.slice(chunkStart, chunkStart + CHUNK_SIZE);
    const validRows: any[] = [];
    const validIndices: number[] = [];

    for (let i = 0; i < chunk.length; i++) {
      const globalIndex = chunkStart + i;
      try {
        const validated = validateFn ? validateFn(chunk[i], globalIndex) : chunk[i];
        validRows.push(validated);
        validIndices.push(globalIndex);
      } catch (err: any) {
        progress.errorCount++;
        progress.errors.push({ index: globalIndex, message: err.message || "Validation failed" });
        progress.processedRecords++;
      }
    }

    if (validRows.length === 0) continue;

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const placeholders: string[] = [];
      const values: any[] = [];
      let paramIdx = 1;

      for (const row of validRows) {
        const rowPlaceholders: string[] = [];
        for (const col of columns) {
          const snakeCol = col.replace(/[A-Z]/g, (m) => `_${m.toLowerCase()}`);
          let val = row[col] ?? row[snakeCol] ?? null;
          rowPlaceholders.push(`$${paramIdx++}`);
          values.push(val);
        }
        placeholders.push(`(${rowPlaceholders.join(", ")})`);
      }

      const snakeColumns = columns.map(c => c.replace(/[A-Z]/g, (m) => `_${m.toLowerCase()}`));
      const query = `INSERT INTO ${tableName} (${snakeColumns.join(", ")}) VALUES ${placeholders.join(", ")} ON CONFLICT DO NOTHING`;
      await client.query(query, values);
      await client.query("COMMIT");

      progress.successCount += validRows.length;
      progress.processedRecords += validRows.length;
    } catch (err: any) {
      await client.query("ROLLBACK");
      for (const idx of validIndices) {
        progress.errorCount++;
        progress.errors.push({ index: idx, message: err.message || "Batch insert failed" });
        progress.processedRecords++;
      }
    } finally {
      client.release();
    }

    await updateJobInDb(jobId, {
      processedRecords: progress.processedRecords,
      successCount: progress.successCount,
      errorCount: progress.errorCount,
      errors: progress.errors.slice(-100),
    });
  }

  const finalStatus = progress.errorCount > 0 && progress.successCount === 0 ? "failed" : "completed";
  await updateJobInDb(jobId, {
    status: finalStatus,
    processedRecords: progress.processedRecords,
    successCount: progress.successCount,
    errorCount: progress.errorCount,
    errors: progress.errors.slice(-100),
    completedAt: new Date(),
  });
}

export async function enqueueBatchAccountCreate(
  records: any[],
  userId: string | null
): Promise<string> {
  const jobId = generateJobId();
  await createJobInDb(jobId, "account_create", records.length, userId);

  const progress: JobProgress = { processedRecords: 0, successCount: 0, errorCount: 0, errors: [] };

  (async () => {
    await waitForSlot();
    try {
      const columns = [
        "borrowerId", "lenderInstitution", "accountNumber", "accountType",
        "originalAmount", "currentBalance", "currency", "interestRate",
        "disbursementDate", "maturityDate", "status", "daysInArrears",
        "reportingDate", "creditCategory",
      ];
      await processChunkedInserts(
        jobId,
        progress,
        records,
        "credit_accounts",
        columns,
        (record) => insertCreditAccountSchema.parse(record)
      );
    } catch (err: any) {
      await updateJobInDb(jobId, { status: "failed", completedAt: new Date() });
    } finally {
      releaseSlot();
    }
  })();

  return jobId;
}

export async function enqueueBatchBorrowerUpdate(
  updates: Array<{ id: string; fields: Record<string, any> }>,
  userId: string | null
): Promise<string> {
  const jobId = generateJobId();
  await createJobInDb(jobId, "borrower_update", updates.length, userId);

  const progress: JobProgress = { processedRecords: 0, successCount: 0, errorCount: 0, errors: [] };

  (async () => {
    await waitForSlot();
    try {
      await updateJobInDb(jobId, { status: "processing" });
      const ALLOWED_BORROWER_FIELDS = new Set([
        "firstName", "lastName", "middleName", "dateOfBirth", "gender",
        "nationalId", "phone", "email", "address", "employerName",
        "monthlyIncome", "status",
      ]);

      for (let chunkStart = 0; chunkStart < updates.length; chunkStart += CHUNK_SIZE) {
        const chunk = updates.slice(chunkStart, chunkStart + CHUNK_SIZE);
        const validUpdates: Array<{ globalIdx: number; id: string; fields: Record<string, any> }> = [];

        for (let i = 0; i < chunk.length; i++) {
          const globalIdx = chunkStart + i;
          const { id, fields } = chunk[i];
          if (!id || !fields || Object.keys(fields).length === 0) {
            progress.errorCount++;
            progress.errors.push({ index: globalIdx, message: "Missing id or fields" });
            progress.processedRecords++;
            continue;
          }
          const filtered: Record<string, any> = {};
          for (const [key, val] of Object.entries(fields)) {
            if (ALLOWED_BORROWER_FIELDS.has(key)) filtered[key] = val;
          }
          if (Object.keys(filtered).length === 0) {
            progress.errorCount++;
            progress.errors.push({ index: globalIdx, message: "No valid fields to update" });
            progress.processedRecords++;
            continue;
          }
          validUpdates.push({ globalIdx, id, fields: filtered });
        }

        if (validUpdates.length === 0) continue;

        const client = await pool.connect();
        try {
          await client.query("BEGIN");

          const fieldNames = [...new Set(validUpdates.flatMap(u => Object.keys(u.fields)))];
          const ids = validUpdates.map(u => u.id);

          const setClauses: string[] = [];
          const allValues: any[] = [];
          let paramIdx = 1;

          for (const field of fieldNames) {
            const snakeField = field.replace(/[A-Z]/g, (m) => `_${m.toLowerCase()}`);
            const caseParts: string[] = [];
            for (const upd of validUpdates) {
              if (field in upd.fields) {
                caseParts.push(`WHEN id = $${paramIdx++} THEN $${paramIdx++}`);
                allValues.push(upd.id, upd.fields[field]);
              }
            }
            if (caseParts.length > 0) {
              setClauses.push(`${snakeField} = CASE ${caseParts.join(" ")} ELSE ${snakeField} END`);
            }
          }

          setClauses.push(`updated_at = NOW()`);

          const idPlaceholders = ids.map(() => `$${paramIdx++}`).join(", ");
          allValues.push(...ids);

          const sqlStr = `UPDATE borrowers SET ${setClauses.join(", ")} WHERE id IN (${idPlaceholders})`;
          const result = await client.query(sqlStr, allValues);
          await client.query("COMMIT");

          progress.successCount += result.rowCount || validUpdates.length;
          progress.processedRecords += validUpdates.length;
        } catch (err: any) {
          await client.query("ROLLBACK");
          for (const upd of validUpdates) {
            progress.errorCount++;
            progress.errors.push({ index: upd.globalIdx, message: err.message || "Batch update failed" });
            progress.processedRecords++;
          }
        } finally {
          client.release();
        }

        await updateJobInDb(jobId, {
          processedRecords: progress.processedRecords,
          successCount: progress.successCount,
          errorCount: progress.errorCount,
          errors: progress.errors.slice(-100),
        });
      }

      const finalStatus = progress.errorCount > 0 && progress.successCount === 0 ? "failed" : "completed";
      await updateJobInDb(jobId, { status: finalStatus, completedAt: new Date() });
    } catch (err: any) {
      await updateJobInDb(jobId, { status: "failed", completedAt: new Date() });
    } finally {
      releaseSlot();
    }
  })();

  return jobId;
}

export async function enqueueBatchAccountUpdate(
  updates: Array<{ id: string; fields: Record<string, any> }>,
  userId: string | null
): Promise<string> {
  const jobId = generateJobId();
  await createJobInDb(jobId, "account_update", updates.length, userId);

  const progress: JobProgress = { processedRecords: 0, successCount: 0, errorCount: 0, errors: [] };

  (async () => {
    await waitForSlot();
    try {
      await updateJobInDb(jobId, { status: "processing" });
      const ALLOWED_FIELDS = new Set([
        "status", "currentBalance", "daysInArrears", "interestRate",
        "maturityDate", "currency", "originalAmount", "accountType",
        "lenderInstitution", "collateralType", "collateralValue",
        "creditCategory",
      ]);

      for (let chunkStart = 0; chunkStart < updates.length; chunkStart += CHUNK_SIZE) {
        const chunk = updates.slice(chunkStart, chunkStart + CHUNK_SIZE);
        const validUpdates: Array<{ globalIdx: number; id: string; fields: Record<string, any> }> = [];

        for (let i = 0; i < chunk.length; i++) {
          const globalIdx = chunkStart + i;
          const { id, fields } = chunk[i];
          if (!id || !fields || Object.keys(fields).length === 0) {
            progress.errorCount++;
            progress.errors.push({ index: globalIdx, message: "Missing id or fields" });
            progress.processedRecords++;
            continue;
          }
          const filtered: Record<string, any> = {};
          for (const [key, val] of Object.entries(fields)) {
            if (ALLOWED_FIELDS.has(key)) filtered[key] = val;
          }
          if (Object.keys(filtered).length === 0) {
            progress.errorCount++;
            progress.errors.push({ index: globalIdx, message: "No valid fields to update" });
            progress.processedRecords++;
            continue;
          }
          validUpdates.push({ globalIdx, id, fields: filtered });
        }

        if (validUpdates.length === 0) continue;

        const client = await pool.connect();
        try {
          await client.query("BEGIN");

          const fieldNames = [...new Set(validUpdates.flatMap(u => Object.keys(u.fields)))];
          const ids = validUpdates.map(u => u.id);

          const setClauses: string[] = [];
          const allValues: any[] = [];
          let paramIdx = 1;

          for (const field of fieldNames) {
            const snakeField = field.replace(/[A-Z]/g, (m) => `_${m.toLowerCase()}`);
            const caseParts: string[] = [];
            for (const upd of validUpdates) {
              if (field in upd.fields) {
                caseParts.push(`WHEN id = $${paramIdx++} THEN $${paramIdx++}`);
                allValues.push(upd.id, upd.fields[field]);
              }
            }
            if (caseParts.length > 0) {
              setClauses.push(`${snakeField} = CASE ${caseParts.join(" ")} ELSE ${snakeField} END`);
            }
          }

          setClauses.push(`updated_at = NOW()`);

          const idPlaceholders = ids.map(() => `$${paramIdx++}`).join(", ");
          allValues.push(...ids);

          const sqlStr = `UPDATE credit_accounts SET ${setClauses.join(", ")} WHERE id IN (${idPlaceholders})`;
          const result = await client.query(sqlStr, allValues);
          await client.query("COMMIT");

          progress.successCount += result.rowCount || validUpdates.length;
          progress.processedRecords += validUpdates.length;
        } catch (err: any) {
          await client.query("ROLLBACK");
          for (const upd of validUpdates) {
            progress.errorCount++;
            progress.errors.push({ index: upd.globalIdx, message: err.message || "Batch update failed" });
            progress.processedRecords++;
          }
        } finally {
          client.release();
        }

        await updateJobInDb(jobId, {
          processedRecords: progress.processedRecords,
          successCount: progress.successCount,
          errorCount: progress.errorCount,
          errors: progress.errors.slice(-100),
        });
      }

      const finalStatus = progress.errorCount > 0 && progress.successCount === 0 ? "failed" : "completed";
      await updateJobInDb(jobId, { status: finalStatus, completedAt: new Date() });
    } catch (err: any) {
      await updateJobInDb(jobId, { status: "failed", completedAt: new Date() });
    } finally {
      releaseSlot();
    }
  })();

  return jobId;
}

export async function getJobStatus(jobId: string) {
  const rows = await db.select().from(batchJobs).where(eq(batchJobs.id, jobId)).limit(1);
  return rows[0] || null;
}

export function getQueueStats() {
  return {
    activeJobs,
    pendingInQueue: pendingQueue.length,
  };
}
