/**
 * Loto draw scheduler — picks up scheduled draws whose `scheduledFor` has
 * elapsed and runs them via the engine. Idempotent: runDraw() short-circuits
 * if the draw is already closed/verified, and persistLotoDrawResults uses a
 * conditional update so a concurrent worker can't double-run.
 */

import { storage } from "../storage";
import { runDraw } from "./loto-draw-engine";

const TICK_MS = 60_000;
let timer: NodeJS.Timeout | null = null;
let busy = false;

async function tick() {
  if (busy) return;
  busy = true;
  try {
    const due = await storage.listScheduledLotoDrawsDue(new Date());
    for (const draw of due) {
      try {
        // eslint-disable-next-line no-console
        console.info(`[loto-scheduler] running draw ${draw.id} (country=${draw.countryCode}, #${draw.drawNumber})`);
        const result = await runDraw(draw.id);
        // eslint-disable-next-line no-console
        console.info(`[loto-scheduler] completed draw ${draw.id}, winners=${result.winners.length}`);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error(`[loto-scheduler] failed to run draw ${draw.id}:`, err instanceof Error ? err.message : err);
      }
    }
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("[loto-scheduler] tick failed:", err instanceof Error ? err.message : err);
  } finally {
    busy = false;
  }
}

export function startLotoDrawScheduler() {
  if (timer) return;
  // Run shortly after boot, then on a 60s cadence.
  setTimeout(() => { tick().catch(() => {}); }, 5_000);
  timer = setInterval(() => { tick().catch(() => {}); }, TICK_MS);
  // eslint-disable-next-line no-console
  console.info("[loto-scheduler] started");
}

export function stopLotoDrawScheduler() {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
}
