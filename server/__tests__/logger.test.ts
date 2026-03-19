import { describe, it, expect, vi, beforeEach } from "vitest";
import { createLogger } from "../logger";

describe("createLogger", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("creates a logger with the given source", () => {
    const spy = vi.spyOn(console, "log").mockImplementation(() => {});
    const log = createLogger("test-source");
    log.info("hello");
    expect(spy).toHaveBeenCalledOnce();
    const parsed = JSON.parse(spy.mock.calls[0][0] as string);
    expect(parsed.source).toBe("test-source");
    expect(parsed.level).toBe("info");
    expect(parsed.message).toBe("hello");
    expect(parsed.ts).toBeDefined();
  });

  it("includes extra fields", () => {
    const spy = vi.spyOn(console, "log").mockImplementation(() => {});
    const log = createLogger("test");
    log.info("msg", { userId: 42, action: "login" });
    const parsed = JSON.parse(spy.mock.calls[0][0] as string);
    expect(parsed.userId).toBe(42);
    expect(parsed.action).toBe("login");
  });

  it("uses console.error for error level", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const log = createLogger("test");
    log.error("bad");
    expect(spy).toHaveBeenCalledOnce();
  });

  it("uses console.warn for warn level", () => {
    const spy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const log = createLogger("test");
    log.warn("careful");
    expect(spy).toHaveBeenCalledOnce();
  });

  it("creates child loggers with dotted source", () => {
    const spy = vi.spyOn(console, "log").mockImplementation(() => {});
    const parent = createLogger("app");
    const child = parent.child("db");
    child.info("connected");
    const parsed = JSON.parse(spy.mock.calls[0][0] as string);
    expect(parsed.source).toBe("app.db");
  });
});
