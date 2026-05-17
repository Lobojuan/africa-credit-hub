import { spawn } from "child_process";
import path from "path";
import { createLogger } from "./logger";

const logger = createLogger("tearsheet-scheduler");

const MARKETS = ["ghana", "nigeria", "kenya", "civ", "southafrica"];
const DEFAULT_INTERVAL_HOURS = 168;

export interface TearsheetSchedulerStatus {
  enabled: boolean;
  intervalHours: number;
  lastRunAt: string | null;
  lastRunStatus: "success" | "failure" | "running" | null;
  lastRunDurationMs: number | null;
  lastRunLog: string[];
  nextRunAt: string | null;
  marketsGenerated: string[];
}

const state: TearsheetSchedulerStatus = {
  enabled: false,
  intervalHours: DEFAULT_INTERVAL_HOURS,
  lastRunAt: null,
  lastRunStatus: null,
  lastRunDurationMs: null,
  lastRunLog: [],
  nextRunAt: null,
  marketsGenerated: [],
};

let intervalHandle: ReturnType<typeof setInterval> | null = null;
let runInProgress = false;

export async function runTearsheetGeneration(markets?: string[]): Promise<{ ok: boolean; log: string[] }> {
  if (runInProgress) {
    return { ok: false, log: ["Another generation is already in progress — skipped."] };
  }

  runInProgress = true;
  state.lastRunStatus = "running";
  const startMs = Date.now();
  const log: string[] = [];

  const marketList = markets && markets.length > 0 ? markets : MARKETS;
  const args = marketList.length === MARKETS.length ? [] : marketList;
  const scriptPath = path.resolve(process.cwd(), "scripts/generate-tearsheet-pdf.cjs");

  log.push(`[${new Date().toISOString()}] Starting tear-sheet generation for: ${marketList.join(", ")}`);
  logger.info("Tear-sheet generation started", { markets: marketList });

  return new Promise((resolve) => {
    const proc = spawn(process.execPath, [scriptPath, ...args], {
      env: {
        ...process.env,
        UCH_API_BASE_URL: "http://localhost:" + (process.env.PORT || "5000"),
      },
      cwd: process.cwd(),
    });

    proc.stdout.on("data", (chunk: Buffer) => {
      const lines = chunk.toString().split("\n").filter(Boolean);
      lines.forEach((l) => {
        log.push(l);
        logger.info("[tearsheet-gen] " + l);
      });
    });

    proc.stderr.on("data", (chunk: Buffer) => {
      const lines = chunk.toString().split("\n").filter(Boolean);
      lines.forEach((l) => {
        log.push("[stderr] " + l);
        logger.warn("[tearsheet-gen] " + l);
      });
    });

    proc.on("close", (code) => {
      const durationMs = Date.now() - startMs;
      const ok = code === 0;
      const ts = new Date().toISOString();

      log.push(`[${ts}] Process exited with code ${code} (${(durationMs / 1000).toFixed(1)}s)`);

      state.lastRunAt = ts;
      state.lastRunStatus = ok ? "success" : "failure";
      state.lastRunDurationMs = durationMs;
      state.lastRunLog = log.slice(-100);
      state.marketsGenerated = ok ? marketList : state.marketsGenerated;

      runInProgress = false;

      if (ok) {
        logger.info("Tear-sheet generation completed", { markets: marketList, durationMs });
      } else {
        logger.warn("Tear-sheet generation failed", { code, durationMs });
      }

      resolve({ ok, log });
    });

    proc.on("error", (err) => {
      const ts = new Date().toISOString();
      log.push(`[${ts}] Failed to start process: ${err.message}`);
      state.lastRunAt = ts;
      state.lastRunStatus = "failure";
      state.lastRunDurationMs = Date.now() - startMs;
      state.lastRunLog = log.slice(-100);
      runInProgress = false;
      logger.error("Tear-sheet process error", { error: err.message });
      resolve({ ok: false, log });
    });
  });
}

export function getTearsheetSchedulerStatus(): TearsheetSchedulerStatus {
  return { ...state };
}

export function startTearsheetScheduler(intervalHours = DEFAULT_INTERVAL_HOURS) {
  const parsed = Number(intervalHours);
  const hours = Number.isFinite(parsed) && parsed >= 1 ? Math.floor(parsed) : DEFAULT_INTERVAL_HOURS;
  const intervalMs = hours * 60 * 60 * 1000;

  state.intervalHours = hours;
  state.enabled = true;
  state.nextRunAt = new Date(Date.now() + intervalMs).toISOString();

  logger.info(`Tear-sheet scheduler started — regenerates every ${hours}h`);
  console.log(`[TearsheetScheduler] Started — PDFs regenerate every ${hours} hours`);

  if (intervalHandle) clearInterval(intervalHandle);

  intervalHandle = setInterval(async () => {
    state.nextRunAt = new Date(Date.now() + intervalMs).toISOString();
    logger.info("Tear-sheet scheduled run triggered");
    const result = await runTearsheetGeneration();
    if (!result.ok) {
      logger.warn("Scheduled tear-sheet run failed", { log: result.log.slice(-5) });
    }
  }, intervalMs);
}
