type LogLevel = "debug" | "info" | "warn" | "error" | "fatal";

const LOG_LEVELS: Record<LogLevel, number> = { debug: 10, info: 20, warn: 30, error: 40, fatal: 50 };

const minLevel = (process.env.LOG_LEVEL as LogLevel) || "info";

interface LogEntry {
  level: LogLevel;
  source: string;
  message: string;
  ts: string;
  [key: string]: unknown;
}

function shouldLog(level: LogLevel): boolean {
  return LOG_LEVELS[level] >= LOG_LEVELS[minLevel];
}

function emit(entry: LogEntry) {
  const out = JSON.stringify(entry);
  if (LOG_LEVELS[entry.level] >= LOG_LEVELS.error) {
    console.error(out);
  } else if (entry.level === "warn") {
    console.warn(out);
  } else {
    console.log(out);
  }
}

export function createLogger(source: string) {
  const log = (level: LogLevel, message: string, extra?: Record<string, unknown>) => {
    if (!shouldLog(level)) return;
    emit({ level, source, message, ts: new Date().toISOString(), ...extra });
  };

  return {
    debug: (msg: string, extra?: Record<string, unknown>) => log("debug", msg, extra),
    info: (msg: string, extra?: Record<string, unknown>) => log("info", msg, extra),
    warn: (msg: string, extra?: Record<string, unknown>) => log("warn", msg, extra),
    error: (msg: string, extra?: Record<string, unknown>) => log("error", msg, extra),
    fatal: (msg: string, extra?: Record<string, unknown>) => log("fatal", msg, extra),
    child: (childSource: string) => createLogger(`${source}.${childSource}`),
  };
}

export const logger = createLogger("app");
