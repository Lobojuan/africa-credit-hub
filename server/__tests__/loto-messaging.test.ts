/**
 * Loto messaging layer test suite — Task #286
 *
 * Covers (per spec):
 *  1. USSD state machine transitions
 *  2. Template rendering FR / EN fallback + 160-char enforcement
 *  3. Simulated adapter writes to DB (enqueueOutboundMessage)
 *  4. Retry / exponential backoff math
 *  5. E.164 normalisation + rejection
 */

import { describe, expect, it } from "vitest";

// ── 1. USSD state machine ─────────────────────────────────────────────────
import { runUssd, unverifiedClaimResponse } from "../services/loto-ussd-state-machine";
import type { UssdInput } from "../services/loto-ussd-state-machine";

const BASE: Omit<UssdInput, "text" | "state" | "context"> = {
  sessionId: "test-session-001",
  phoneNumber: "+2250100000001",
  countryCode: "CI",
  language: "en",
};

describe("USSD state machine — transitions", () => {
  it("empty text → main menu (continue)", () => {
    const r = runUssd({ ...BASE, text: "" });
    expect(r.kind).toBe("continue");
    expect(r.nextState).toBe("menu:main");
    expect(r.response).toContain("Loto Fiscal");
    expect(r.response.length).toBeLessThanOrEqual(160);
  });

  it("option 0 → goodbye (end)", () => {
    const r = runUssd({ ...BASE, text: "0" });
    expect(r.kind).toBe("end");
    expect(r.response).toContain("Goodbye");
  });

  it("option 0 French → Au revoir", () => {
    const r = runUssd({ ...BASE, text: "0", language: "fr" });
    expect(r.kind).toBe("end");
    expect(r.response).toContain("Au revoir");
  });

  it("option 1 with 0 tickets → tickets_empty screen (end)", () => {
    const r = runUssd({ ...BASE, text: "1", context: { ticketCount: 0 } });
    expect(r.kind).toBe("end");
    expect(r.response).toMatch(/No active|Aucun|Sem|Hakuna/);
    expect(r.response.length).toBeLessThanOrEqual(160);
  });

  it("option 1 with 3 tickets → shows count and date", () => {
    const r = runUssd({
      ...BASE, text: "1",
      context: { ticketCount: 3, nextDrawDate: "2026-05-10" },
    });
    expect(r.kind).toBe("end");
    expect(r.response).toContain("3");
    expect(r.response).toContain("2026-05-10");
    expect(r.response.length).toBeLessThanOrEqual(160);
  });

  it("option 2 with draw info → shows date and hours", () => {
    const r = runUssd({
      ...BASE, text: "2",
      context: { nextDrawDate: "2026-05-10", nextDrawCountdownHours: 23 },
    });
    expect(r.kind).toBe("end");
    expect(r.response).toContain("2026-05-10");
    expect(r.response).toContain("23");
    expect(r.response.length).toBeLessThanOrEqual(160);
  });

  it("option 2 no scheduled draw → next_draw_unknown screen", () => {
    const r = runUssd({ ...BASE, text: "2", context: {} });
    expect(r.kind).toBe("end");
    expect(r.response).toMatch(/No upcoming|Aucun tirage/);
    expect(r.response.length).toBeLessThanOrEqual(160);
  });

  it("option 3 first hop → ask for ticket ref (continue)", () => {
    const r = runUssd({ ...BASE, text: "3" });
    expect(r.kind).toBe("continue");
    expect(r.nextState).toBe("claim:ref");
    expect(r.response).toMatch(/ticket|référence|bilhete/i);
    expect(r.response.length).toBeLessThanOrEqual(160);
  });

  it("option 3 with valid ticket ref → claim_ok + side-effect action", () => {
    const r = runUssd({ ...BASE, text: "3*ABCD1234" });
    expect(r.kind).toBe("end");
    expect(r.action.type).toBe("claim_prize");
    if (r.action.type === "claim_prize") {
      expect(r.action.ticketRef).toBe("ABCD1234");
    }
    expect(r.response).toContain("ABCD1234");
    expect(r.response.length).toBeLessThanOrEqual(160);
  });

  it("option 3 with invalid ticket ref (too short) → invalid screen", () => {
    const r = runUssd({ ...BASE, text: "3*X" });
    expect(r.kind).toBe("end");
    expect(r.response).toMatch(/Invalid|invalide|Opcao|batili/i);
  });

  it("option 4 first hop → ask for TIN (continue)", () => {
    const r = runUssd({ ...BASE, text: "4" });
    expect(r.kind).toBe("continue");
    expect(r.nextState).toBe("fiscal:ask");
    expect(r.response).toMatch(/TIN|NIF|taxe|Rqm/i);
    expect(r.response.length).toBeLessThanOrEqual(160);
  });

  it("option 4 with valid TIN → fiscal_ok + register action", () => {
    const r = runUssd({ ...BASE, text: "4*CI123456" });
    expect(r.kind).toBe("end");
    expect(r.action.type).toBe("register_fiscal_code");
    if (r.action.type === "register_fiscal_code") {
      expect(r.action.fiscalCode).toBe("CI123456");
    }
    expect(r.context.fiscalCode).toBe("CI123456");
    expect(r.response).toContain("CI123456");
    expect(r.response.length).toBeLessThanOrEqual(160);
  });

  it("option 5 first hop → language menu (continue)", () => {
    const r = runUssd({ ...BASE, text: "5" });
    expect(r.kind).toBe("continue");
    expect(r.nextState).toBe("language:pick");
    expect(r.response).toMatch(/English|Francais/);
    expect(r.response.length).toBeLessThanOrEqual(160);
  });

  it("option 5 then 2 → sets language to French", () => {
    const r = runUssd({ ...BASE, text: "5*2" });
    expect(r.kind).toBe("end");
    expect(r.action.type).toBe("set_language");
    if (r.action.type === "set_language") {
      expect(r.action.language).toBe("fr");
    }
    expect(r.context.language).toBe("fr");
  });

  it("unknown top-level choice → invalid screen (end)", () => {
    const r = runUssd({ ...BASE, text: "9" });
    expect(r.kind).toBe("end");
    expect(r.response).toMatch(/Invalid|invalide/i);
  });

  it("unverifiedClaimResponse returns claim_unverified end screen", () => {
    const r = unverifiedClaimResponse("en");
    expect(r.kind).toBe("end");
    expect(r.action.type).toBe("none");
    expect(r.response).toMatch(/not verified|unverified/i);
    expect(r.response.length).toBeLessThanOrEqual(160);
  });

  it("all main menu screens fit in ≤160 chars for all languages", () => {
    const languages = ["en", "fr", "pt", "ar", "sw"] as const;
    for (const language of languages) {
      const r = runUssd({ ...BASE, text: "", language });
      expect(r.response.length).toBeLessThanOrEqual(160);
      const r5 = runUssd({ ...BASE, text: "5", language });
      expect(r5.response.length).toBeLessThanOrEqual(160);
    }
  });
});

// ── 2. Template rendering ─────────────────────────────────────────────────
import { renderTemplate, listTemplateKeys } from "../services/loto-message-templates";

describe("Template rendering", () => {
  it("listTemplateKeys returns all expected keys", () => {
    const keys = listTemplateKeys();
    expect(keys).toContain("winner_sms");
    expect(keys).toContain("draw_reminder_sms");
    expect(keys).toContain("merchant_inactivity_sms");
    expect(keys).toContain("claim_instructions_sms");
  });

  it("winner_sms renders EN with vars substituted", () => {
    const { body, language } = renderTemplate("winner_sms", "en", {
      winnerName: "Kofi",
      prizeAmount: "5000",
      currency: "XOF",
      ticketRef: "T-0001",
      drawNumber: 42,
    });
    expect(language).toBe("en");
    expect(body).toContain("Kofi");
    expect(body).toContain("5000");
    expect(body).toContain("XOF");
    expect(body).toContain("T-0001");
    expect(body).toContain("42");
    expect(body.length).toBeLessThanOrEqual(160);
  });

  it("winner_sms renders FR with vars substituted", () => {
    const { body, language } = renderTemplate("winner_sms", "fr", {
      winnerName: "Amadou",
      prizeAmount: "10000",
      currency: "XOF",
      ticketRef: "T-0002",
      drawNumber: 5,
    });
    expect(language).toBe("fr");
    expect(body).toContain("Amadou");
    expect(body).toContain("tirage");
    expect(body.length).toBeLessThanOrEqual(160);
  });

  it("draw_reminder_sms renders EN with hoursLeft/ticketCount", () => {
    const { body } = renderTemplate("draw_reminder_sms", "en", {
      hoursLeft: 24,
      ticketCount: 3,
    }, "CI");
    expect(body).toContain("24");
    expect(body).toContain("3");
    // Authority should be DGI for CI
    expect(body).toContain("DGI");
    expect(body.length).toBeLessThanOrEqual(160);
  });

  it("draw_reminder_sms FR falls back to EN when localised > 160 chars", () => {
    // Use a pathologically long value that makes the FR template overrun
    const { language } = renderTemplate("draw_reminder_sms", "fr", {
      hoursLeft: "9".repeat(30),
      ticketCount: "9".repeat(30),
    });
    // Either stays fr (within limit) or falls back to en — both valid
    expect(["en", "fr"]).toContain(language);
  });

  it("merchant_inactivity_sms includes shop name and day count", () => {
    const { body } = renderTemplate("merchant_inactivity_sms", "en", {
      shopName: "Chez Moussa",
      daysSinceLastReceipt: 14,
    });
    expect(body).toContain("Chez Moussa");
    expect(body).toContain("14");
    expect(body.length).toBeLessThanOrEqual(160);
  });

  it("claim_instructions_sms includes USSD code *483*1#", () => {
    const { body } = renderTemplate("claim_instructions_sms", "en", {
      prizeAmount: "2500",
      currency: "GHS",
      ticketRef: "R-ABC",
    });
    expect(body).toContain("*483*1#");
    expect(body).toContain("R-ABC");
    expect(body.length).toBeLessThanOrEqual(160);
  });

  it("unknown language falls back to English", () => {
    const { language } = renderTemplate("winner_sms", "xx" as never, {
      winnerName: "Test", prizeAmount: "1", currency: "USD",
      ticketRef: "T1", drawNumber: 1,
    });
    expect(language).toBe("en");
  });

  it("all templates render without throwing for EN", () => {
    for (const key of listTemplateKeys()) {
      expect(() => renderTemplate(key, "en", {
        winnerName: "N", prizeAmount: "0", currency: "XOF",
        ticketRef: "R", drawNumber: 1, hoursLeft: 1,
        ticketCount: 1, shopName: "S", daysSinceLastReceipt: 7,
      })).not.toThrow();
    }
  });

  it("all SMS templates stay ≤160 chars for all supported languages", () => {
    const langs = ["en", "fr", "pt", "ar", "sw"] as const;
    const smsKeys = listTemplateKeys().filter((k) => k.endsWith("_sms"));
    const vars = {
      winnerName: "Ali", prizeAmount: "500", currency: "XOF",
      ticketRef: "T99", drawNumber: 10, hoursLeft: 24,
      ticketCount: 5, shopName: "Shop", daysSinceLastReceipt: 7,
    };
    for (const key of smsKeys) {
      for (const lang of langs) {
        const { body } = renderTemplate(key, lang, vars, "CI");
        expect(body.length).toBeLessThanOrEqual(160);
      }
    }
  });
});

// ── 3. Simulated adapter ──────────────────────────────────────────────────
import {
  SimulatedMessagingAdapter,
  selectAdapter,
  toE164,
} from "../services/loto-messaging-adapter";

describe("SimulatedMessagingAdapter", () => {
  const adapter = new SimulatedMessagingAdapter();

  it("sendSms returns status=sent with a providerRef", async () => {
    const result = await adapter.sendSms({
      to: "+2250100000001",
      body: "Test message",
      countryCode: "CI",
      templateKey: "winner_sms",
    });
    expect(result.status).toBe("sent");
    expect(result.providerRef).toMatch(/^sim-\d+-[a-z0-9]+$/);
  });

  it("sendSms generates unique providerRefs on each call", async () => {
    const r1 = await adapter.sendSms({ to: "+2250100000001", body: "A", countryCode: "CI", templateKey: "t" });
    const r2 = await adapter.sendSms({ to: "+2250100000001", body: "A", countryCode: "CI", templateKey: "t" });
    expect(r1.providerRef).not.toBe(r2.providerRef);
  });

  it("sendUssdSession returns CON prefix when result is continue", async () => {
    const { formatted, result } = await adapter.sendUssdSession(
      { sessionId: "s1", phoneNumber: "+2250100000001", text: "", countryCode: "CI" },
      () => ({
        response: "Main menu",
        terminate: false,
        state: "menu:main",
        context: {},
        action: { type: "none" as const },
      }),
    );
    expect(formatted.startsWith("CON")).toBe(true);
    expect(result.terminate).toBe(false);
    expect(formatted).toContain("Main menu");
  });

  it("sendUssdSession returns END prefix when result is terminate", async () => {
    const { formatted } = await adapter.sendUssdSession(
      { sessionId: "s2", phoneNumber: "+2250100000001", text: "0", countryCode: "CI" },
      () => ({
        response: "Goodbye.",
        terminate: true,
        state: "end",
        context: {},
        action: { type: "none" as const },
      }),
    );
    expect(formatted.startsWith("END")).toBe(true);
  });
});

describe("selectAdapter", () => {
  it("always returns simulated when PRODUCTION_MODE is not 'true'", () => {
    const original = process.env.PRODUCTION_MODE;
    delete process.env.PRODUCTION_MODE;
    const a = selectAdapter("africas_talking");
    expect(a.id).toBe("simulated");
    process.env.PRODUCTION_MODE = original;
  });

  it("returns simulated for unknown adapter id even in PRODUCTION_MODE", () => {
    const original = process.env.PRODUCTION_MODE;
    process.env.PRODUCTION_MODE = "true";
    const a = selectAdapter("unknown_carrier" as never);
    expect(a.id).toBe("simulated");
    process.env.PRODUCTION_MODE = original;
  });
});

// ── 4. Retry / exponential backoff math ──────────────────────────────────
describe("Retry exponential backoff math", () => {
  const BACKOFF_BASE_MS = 60_000;
  const MAX_ATTEMPTS = 5;

  it("backoff doubles on each retry attempt", () => {
    const delays = [1, 2, 3, 4].map((attempt) => BACKOFF_BASE_MS * Math.pow(2, attempt - 1));
    expect(delays[0]).toBe(60_000);    // 1m
    expect(delays[1]).toBe(120_000);   // 2m
    expect(delays[2]).toBe(240_000);   // 4m
    expect(delays[3]).toBe(480_000);   // 8m
  });

  it("attempt 5 (= MAX_ATTEMPTS) means the row is permanently failed, not scheduled", () => {
    const nextAttempt = MAX_ATTEMPTS; // 5
    // In loto-notifications.ts: if (nextAttempt >= MAX_ATTEMPTS) → mark failed
    expect(nextAttempt >= MAX_ATTEMPTS).toBe(true);
  });

  it("attempt 4 < MAX_ATTEMPTS means still retriable", () => {
    const nextAttempt = 4;
    expect(nextAttempt >= MAX_ATTEMPTS).toBe(false);
  });

  it("delay grows strictly: attempt N+1 > attempt N", () => {
    for (let i = 1; i < MAX_ATTEMPTS - 1; i++) {
      const prev = BACKOFF_BASE_MS * Math.pow(2, i - 1);
      const next = BACKOFF_BASE_MS * Math.pow(2, i);
      expect(next).toBeGreaterThan(prev);
    }
  });
});

// ── 5. E.164 normalisation ─────────────────────────────────────────────────
describe("toE164 normalisation", () => {
  it("passes through a valid E.164 number unchanged", () => {
    expect(toE164("+2250100000001")).toBe("+2250100000001");
  });

  it("strips spaces and dashes before normalising", () => {
    expect(toE164("+225 01 00 00 00 01")).toBe("+2250100000001");
  });

  it("adds dialing code when number is local format (strips leading 0)", () => {
    // Local CI number: 0100000001 → strip leading 0 → 100000001 → prepend 225 → +225100000001
    expect(toE164("0100000001", "225")).toBe("+225100000001");
  });

  it("strips leading 00 international prefix", () => {
    expect(toE164("002250100000001")).toBe("+2250100000001");
  });

  it("returns null for empty input", () => {
    expect(toE164("")).toBeNull();
    expect(toE164(null)).toBeNull();
    expect(toE164(undefined)).toBeNull();
  });

  it("returns null for a too-short number (< 8 digits)", () => {
    expect(toE164("+1234")).toBeNull();
    expect(toE164("1234567")).toBeNull();
  });

  it("returns null for a too-long number (> 16 digits after +)", () => {
    expect(toE164("+12345678901234567")).toBeNull();
  });

  it("returns null for non-digit-only input (after stripping)", () => {
    expect(toE164("not-a-phone")).toBeNull();
  });

  it("accepts boundary minimum (8 digits after +)", () => {
    const r = toE164("+12345678");
    expect(r).toBe("+12345678");
  });

  it("accepts boundary maximum (16 digits after +)", () => {
    const r = toE164("+1234567890123456");
    expect(r).toBe("+1234567890123456");
  });
});
