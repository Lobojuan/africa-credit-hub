import { describe, expect, it } from "vitest";
import { renderTemplate } from "../services/loto-message-templates";
import { step, type UssdStepInput } from "../services/loto-ussd-state-machine";
import { normalisePhoneE164, adapterForMessaging, isDemoMode } from "../services/loto-messaging-adapter";

describe("Loto messaging templates (Task #286)", () => {
  it("renders winner_sms in EN and FR with all required vars", () => {
    const en = renderTemplate("winner_sms", "en", {
      amount: "100000", currency: "XOF", ticket: "ABC12345", drawNumber: "7",
    });
    expect(en.body).toContain("WON");
    expect(en.body).toContain("XOF 100000");
    expect(en.body.length).toBeLessThanOrEqual(160);

    const fr = renderTemplate("winner_sms", "fr", {
      amount: "100000", currency: "XOF", ticket: "ABC12345", drawNumber: "7",
    });
    expect(fr.body).toContain("GAGNÉ");
    expect(fr.body.length).toBeLessThanOrEqual(160);
  });

  it("throws when a required template var is missing", () => {
    expect(() => renderTemplate("winner_sms", "en", { amount: "1" })).toThrow(/missing required var/);
  });

  it("renders draw_reminder_sms and merchant_inactive_sms ≤160 chars", () => {
    const r = renderTemplate("draw_reminder_sms", "fr", {
      drawNumber: "12", tickets: "5", closesIn: "12h",
    });
    expect(r.body.length).toBeLessThanOrEqual(160);
    expect(r.body).toContain("STOP");

    const m = renderTemplate("merchant_inactive_sms", "en", {
      shop: "Boutique Test", days: "7",
    });
    expect(m.body.length).toBeLessThanOrEqual(160);
    expect(m.body).toContain("Boutique Test");
  });
});

describe("USSD state machine (Task #286)", () => {
  const baseRoot: UssdStepInput = { state: "root", context: {}, language: "en", input: "" };

  it("session-open returns root menu with 5 options", () => {
    const r = step(baseRoot);
    expect(r.state).toBe("root");
    expect(r.endSession).toBe(false);
    expect(r.displayText).toMatch(/1\..*2\..*3\..*4\..*5\./s);
    expect(r.displayText.length).toBeLessThanOrEqual(160);
  });

  it("choice 1 transitions to register_fc and prompts for code", () => {
    const r = step({ ...baseRoot, input: "1" });
    expect(r.state).toBe("register_fc");
    expect(r.endSession).toBe(false);
    expect(r.displayText.toLowerCase()).toContain("fiscal code");
  });

  it("register_fc rejects invalid input and reprompts", () => {
    const r = step({ state: "register_fc", context: {}, language: "en", input: "abc" });
    expect(r.state).toBe("register_fc");
    expect(r.displayText.toLowerCase()).toContain("invalid");
    expect(r.endSession).toBe(false);
  });

  it("register_fc accepts a 4-20 digit code, ends session, stores in context", () => {
    const r = step({ state: "register_fc", context: {}, language: "en", input: "12345678" });
    expect(r.state).toBe("register_fc_done");
    expect(r.context.fiscalCode).toBe("12345678");
    expect(r.endSession).toBe(true);
  });

  it("choice 3 returns next-draw text from context (FR)", () => {
    const r = step({
      state: "root", context: { nextDrawAt: "2026-05-01 20:00 UTC" },
      language: "fr", input: "3",
    });
    expect(r.endSession).toBe(true);
    expect(r.displayText).toContain("2026-05-01 20:00 UTC");
    expect(r.displayText.toLowerCase()).toContain("prochain");
  });

  it("invalid menu choice keeps the user on root with an error notice", () => {
    const r = step({ ...baseRoot, input: "9" });
    expect(r.state).toBe("root");
    expect(r.endSession).toBe(false);
    expect(r.displayText.toLowerCase()).toContain("invalid");
  });
});

describe("E.164 phone normalisation (Task #286)", () => {
  it("rejects empty / non-string inputs", () => {
    expect(normalisePhoneE164(null, "CI")).toBeNull();
    expect(normalisePhoneE164(undefined, "CI")).toBeNull();
    expect(normalisePhoneE164("", "CI")).toBeNull();
  });

  it("accepts already-E164 inputs and strips formatting", () => {
    expect(normalisePhoneE164("+225 07 12 34 56 78", "CI")).toBe("+22507123456 78".replace(/\s/g, ""));
    expect(normalisePhoneE164("+254-700-000-000", "KE")).toBe("+254700000000");
  });

  it("converts 00-prefixed international notation", () => {
    expect(normalisePhoneE164("00254700000000", "KE")).toBe("+254700000000");
  });

  it("applies country dial-code when no + is present and strips one trunk 0", () => {
    expect(normalisePhoneE164("0712345678", "CI")).toBe("+225712345678");
    expect(normalisePhoneE164("712345678", "CI")).toBe("+225712345678");
  });

  it("rejects unknown country codes when input has no +", () => {
    expect(normalisePhoneE164("712345678", "ZZ")).toBeNull();
  });

  it("rejects too-short and too-long digit runs", () => {
    expect(normalisePhoneE164("+1234567", "US")).toBeNull();         // 7 digits
    expect(normalisePhoneE164("+1234567890123456", "US")).toBeNull(); // 16 digits
  });
});

describe("Messaging adapter factory (Task #286)", () => {
  it("isDemoMode defaults true unless LOTO_MESSAGING_LIVE=true", () => {
    const prev = process.env.LOTO_MESSAGING_LIVE;
    delete process.env.LOTO_MESSAGING_LIVE;
    expect(isDemoMode()).toBe(true);
    process.env.LOTO_MESSAGING_LIVE = "true";
    expect(isDemoMode()).toBe(false);
    if (prev === undefined) delete process.env.LOTO_MESSAGING_LIVE;
    else process.env.LOTO_MESSAGING_LIVE = prev;
  });

  it("simulated adapter returns success+stub providerRef for SMS", async () => {
    const a = adapterForMessaging("simulated");
    const r = await a.sendSms({ to: "+225712345678", body: "hi", countryCode: "CI", templateKey: "winner_sms" });
    expect(r.success).toBe(true);
    expect(r.providerRef).toMatch(/^sim_/);
  });

  it("DEMO mode forces simulated adapter regardless of provider", async () => {
    const prev = process.env.LOTO_MESSAGING_LIVE;
    delete process.env.LOTO_MESSAGING_LIVE; // ensure demo
    const a = adapterForMessaging("twilio");
    expect(a.provider).toBe("simulated");
    if (prev !== undefined) process.env.LOTO_MESSAGING_LIVE = prev;
  });
});
