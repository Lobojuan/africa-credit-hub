import { pool } from "./db";
import { insertCreditAccountSchema } from "@shared/schema";

interface BatchJob {
  id: string;
  type: "borrower_update" | "account_update" | "account_create";
  status: "queued" | "processing" | "completed" | "failed";
  totalRecords: number;
  processedRecords: number;
  successCount: number;
  errorCount: number;
  errors: Array<{ index: number; message: string }>;
  createdAt: Date;
  completedAt: Date | null;
  userId: string | null;
}

const jobStore = new Map<string, BatchJob>();

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

async function processChunkedInserts(
  job: BatchJob,
  records: any[],
  tableName: string,
  columns: string[],
  validateFn?: (record: any, index: number) => any
): Promise<void> {
  job.status = "processing";

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
        job.errorCount++;
        job.errors.push({ index: globalIndex, message: err.message || "Validation failed" });
        job.processedRecords++;
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

      job.successCount += validRows.length;
      job.processedRecords += validRows.length;
    } catch (err: any) {
      await client.query("ROLLBACK");
      for (const idx of validIndices) {
        job.errorCount++;
        job.errors.push({ index: idx, message: err.message || "Batch insert failed" });
        job.processedRecords++;
      }
    } finally {
      client.release();
    }
  }

  job.status = job.errorCount > 0 && job.successCount === 0 ? "failed" : "completed";
  job.completedAt = new Date();
}

export async function enqueueBatchAccountCreate(
  records: any[],
  userId: string | null
): Promise<string> {
  const jobId = generateJobId();
  const job: BatchJob = {
    id: jobId,
    type: "account_create",
    status: "queued",
    totalRecords: records.length,
    processedRecords: 0,
    successCount: 0,
    errorCount: 0,
    errors: [],
    createdAt: new Date(),
    completedAt: null,
    userId,
  };
  jobStore.set(jobId, job);

  (async () => {
    await waitForSlot();
    try {
      const columns = [
        "borrowerId", "lenderInstitution", "accountNumber", "accountType",
        "originalAmount", "currentBalance", "currency", "interestRate",
        "disbursementDate", "maturityDate", "status", "daysInArrears",
      ];
      await processChunkedInserts(
        job,
        records,
        "credit_accounts",
        columns,
        (record) => insertCreditAccountSchema.parse(record)
      );
    } catch (err: any) {
      job.status = "failed";
      job.completedAt = new Date();
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
  const job: BatchJob = {
    id: jobId,
    type: "borrower_update",
    status: "queued",
    totalRecords: updates.length,
    processedRecords: 0,
    successCount: 0,
    errorCount: 0,
    errors: [],
    createdAt: new Date(),
    completedAt: null,
    userId,
  };
  jobStore.set(jobId, job);

  (async () => {
    await waitForSlot();
    try {
      job.status = "processing";
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
            job.errorCount++;
            job.errors.push({ index: globalIdx, message: "Missing id or fields" });
            job.processedRecords++;
            continue;
          }
          const filtered: Record<string, any> = {};
          for (const [key, val] of Object.entries(fields)) {
            if (ALLOWED_BORROWER_FIELDS.has(key)) filtered[key] = val;
          }
          if (Object.keys(filtered).length === 0) {
            job.errorCount++;
            job.errors.push({ index: globalIdx, message: "No valid fields to update" });
            job.processedRecords++;
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

          const sql = `UPDATE borrowers SET ${setClauses.join(", ")} WHERE id IN (${idPlaceholders})`;
          const result = await client.query(sql, allValues);
          await client.query("COMMIT");

          job.successCount += result.rowCount || validUpdates.length;
          job.processedRecords += validUpdates.length;
        } catch (err: any) {
          await client.query("ROLLBACK");
          for (const upd of validUpdates) {
            job.errorCount++;
            job.errors.push({ index: upd.globalIdx, message: err.message || "Batch update failed" });
            job.processedRecords++;
          }
        } finally {
          client.release();
        }
      }
      job.status = job.errorCount > 0 && job.successCount === 0 ? "failed" : "completed";
      job.completedAt = new Date();
    } catch (err: any) {
      job.status = "failed";
      job.completedAt = new Date();
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
  const job: BatchJob = {
    id: jobId,
    type: "account_update",
    status: "queued",
    totalRecords: updates.length,
    processedRecords: 0,
    successCount: 0,
    errorCount: 0,
    errors: [],
    createdAt: new Date(),
    completedAt: null,
    userId,
  };
  jobStore.set(jobId, job);

  (async () => {
    await waitForSlot();
    try {
      job.status = "processing";
      const ALLOWED_FIELDS = new Set([
        "status", "currentBalance", "daysInArrears", "interestRate",
        "maturityDate", "currency", "originalAmount", "accountType",
        "lenderInstitution", "collateralType", "collateralValue",
      ]);

      for (let chunkStart = 0; chunkStart < updates.length; chunkStart += CHUNK_SIZE) {
        const chunk = updates.slice(chunkStart, chunkStart + CHUNK_SIZE);
        const validUpdates: Array<{ globalIdx: number; id: string; fields: Record<string, any> }> = [];

        for (let i = 0; i < chunk.length; i++) {
          const globalIdx = chunkStart + i;
          const { id, fields } = chunk[i];
          if (!id || !fields || Object.keys(fields).length === 0) {
            job.errorCount++;
            job.errors.push({ index: globalIdx, message: "Missing id or fields" });
            job.processedRecords++;
            continue;
          }
          const filtered: Record<string, any> = {};
          for (const [key, val] of Object.entries(fields)) {
            if (ALLOWED_FIELDS.has(key)) filtered[key] = val;
          }
          if (Object.keys(filtered).length === 0) {
            job.errorCount++;
            job.errors.push({ index: globalIdx, message: "No valid fields to update" });
            job.processedRecords++;
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

          const sql = `UPDATE credit_accounts SET ${setClauses.join(", ")} WHERE id IN (${idPlaceholders})`;
          const result = await client.query(sql, allValues);
          await client.query("COMMIT");

          job.successCount += result.rowCount || validUpdates.length;
          job.processedRecords += validUpdates.length;
        } catch (err: any) {
          await client.query("ROLLBACK");
          for (const upd of validUpdates) {
            job.errorCount++;
            job.errors.push({ index: upd.globalIdx, message: err.message || "Batch update failed" });
            job.processedRecords++;
          }
        } finally {
          client.release();
        }
      }
      job.status = job.errorCount > 0 && job.successCount === 0 ? "failed" : "completed";
      job.completedAt = new Date();
    } catch (err: any) {
      job.status = "failed";
      job.completedAt = new Date();
    } finally {
      releaseSlot();
    }
  })();

  return jobId;
}

export function getJobStatus(jobId: string): BatchJob | null {
  return jobStore.get(jobId) || null;
}

export function getQueueStats() {
  let queued = 0, processing = 0, completed = 0, failed = 0;
  for (const job of jobStore.values()) {
    switch (job.status) {
      case "queued": queued++; break;
      case "processing": processing++; break;
      case "completed": completed++; break;
      case "failed": failed++; break;
    }
  }
  return { queued, processing, completed, failed, activeJobs, pendingInQueue: pendingQueue.length };
}

setInterval(() => {
  const cutoff = Date.now() - 24 * 60 * 60 * 1000;
  for (const [id, job] of jobStore.entries()) {
    if (job.completedAt && job.completedAt.getTime() < cutoff) {
      jobStore.delete(id);
    }
  }
}, 60 * 60 * 1000);
