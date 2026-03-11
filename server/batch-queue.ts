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
      for (let chunkStart = 0; chunkStart < updates.length; chunkStart += CHUNK_SIZE) {
        const chunk = updates.slice(chunkStart, chunkStart + CHUNK_SIZE);
        const client = await pool.connect();
        try {
          await client.query("BEGIN");
          for (let i = 0; i < chunk.length; i++) {
            const globalIdx = chunkStart + i;
            const { id, fields } = chunk[i];
            if (!id || !fields || Object.keys(fields).length === 0) {
              job.errorCount++;
              job.errors.push({ index: globalIdx, message: "Missing id or fields" });
              job.processedRecords++;
              continue;
            }
            const setClauses: string[] = [];
            const vals: any[] = [];
            let pIdx = 1;
            for (const [key, val] of Object.entries(fields)) {
              const snakeKey = key.replace(/[A-Z]/g, (m) => `_${m.toLowerCase()}`);
              setClauses.push(`${snakeKey} = $${pIdx++}`);
              vals.push(val);
            }
            setClauses.push(`updated_at = NOW()`);
            vals.push(id);
            await client.query(
              `UPDATE borrowers SET ${setClauses.join(", ")} WHERE id = $${pIdx}`,
              vals
            );
            job.successCount++;
            job.processedRecords++;
          }
          await client.query("COMMIT");
        } catch (err: any) {
          await client.query("ROLLBACK");
          for (let i = 0; i < chunk.length; i++) {
            if (chunkStart + i >= job.processedRecords) {
              job.errorCount++;
              job.errors.push({ index: chunkStart + i, message: err.message });
              job.processedRecords++;
            }
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
