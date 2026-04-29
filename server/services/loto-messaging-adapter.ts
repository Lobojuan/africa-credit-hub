/**
 * Loto Messaging Adapter — single interface that the rest of the platform
 * uses to dispatch outbound SMS / USSD prompts. Real production carriers
 * (Africa's Talking, Twilio, MTN/Orange direct) plug in through this
 * interface; selection is driven by per-country config so the platform can
 * flip from the simulated default to a real provider by changing config —
 * never code.
 *
 * Hard rule (Task #286): in DEMO mode (anything other than
 * PRODUCTION_MODE=true) the SimulatedMessagingAdapter is ALWAYS used,
 * regardless of which provider is configured. The real adapter stubs only
 * execute their hosted-API call when PRODUCTION_MODE=true *and* the
 * relevant API credentials are present in the environment. Otherwise they
 * delegate to the simulated adapter so demos can exercise the full flow
 * (template render, persistence, retry) without ever calling a real carrier.
 */

import type { LotoOutboundMessage } from "@shared/schema";

export type MessagingAdapterId = "simulated" | "africas_talking" | "twilio";

export interface SmsSendInput {
  to: string;            // E.164
  body: string;          // <=160 chars
  countryCode: string;
  templateKey: string;
}

export interface SmsSendResult {
  status: "sent" | "failed";
  providerRef: string | null;
  error?: string;
}

export interface UssdSessionInput {
  sessionId: string;
  phoneNumber: string;
  text: string;          // raw input from aggregator (e.g. "1*2*5")
  countryCode: string;
  language?: string;
  /** Persisted state cursor from the prior hop. */
  state?: string;
  /** Persisted reducer context — typed by the reducer, opaque here. */
  context?: Record<string, unknown>;
}

/**
 * Output of the route's reducer wrapper. The adapter only reads `response`
 * and `terminate` for framing; `state`, `context`, and `action` are passed
 * back to the route so it can persist + execute side-effects without a
 * second reducer pass.
 */
export interface UssdSessionResult {
  response: string;
  /** True when the call should be terminated (END), false to keep open (CON). */
  terminate: boolean;
  /** Persisted state cursor; the server writes this to loto_ussd_sessions. */
  state: string;
  context: Record<string, unknown>;
  /** Side-effect descriptor; opaque to the adapter, executed by the route. */
  action?: { type: string; [k: string]: unknown };
}

export interface MessagingAdapter {
  id: MessagingAdapterId;
  sendSms(input: SmsSendInput): Promise<SmsSendResult>;
  /**
   * Drive a single USSD turn through the adapter. The state machine itself
   * lives in loto-ussd-state-machine.ts (a pure reducer); this method is the
   * adapter-level entrypoint that real carriers (Africa's Talking, Twilio
   * Programmable USSD, MTN, Orange) plug into so the route handler does not
   * branch on provider. The default implementation calls the supplied
   * `runReducer` callback and emits the carrier-framed response (CON/END for
   * Africa's Talking-style aggregators; TwiML for Twilio in production).
   *
   * The adapter is deliberately stateless — persistence of `nextState` /
   * `context` is the route handler's responsibility, NOT the adapter's.
   */
  sendUssdSession(
    input: UssdSessionInput,
    runReducer: (i: UssdSessionInput) => Promise<UssdSessionResult> | UssdSessionResult,
  ): Promise<{ formatted: string; result: UssdSessionResult }>;
}

/**
 * The DEMO-mode default. Writes the rendered SMS to console + persists to
 * loto_outbound_messages (handled by the caller in loto-notifications.ts);
 * never opens a network connection. This is what runs in any non-production
 * environment so seed data, e2e tests and screenshots all behave identically.
 */
export class SimulatedMessagingAdapter implements MessagingAdapter {
  id: MessagingAdapterId = "simulated";

  async sendSms(input: SmsSendInput): Promise<SmsSendResult> {
    // eslint-disable-next-line no-console
    console.info(
      `[loto-sms:simulated] → ${input.to} [${input.countryCode}/${input.templateKey}] ${input.body}`,
    );
    return {
      status: "sent",
      providerRef: `sim-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    };
  }

  async sendUssdSession(
    input: UssdSessionInput,
    runReducer: (i: UssdSessionInput) => Promise<UssdSessionResult> | UssdSessionResult,
  ): Promise<{ formatted: string; result: UssdSessionResult }> {
    const result = await runReducer(input);
    const formatted = `${result.terminate ? "END" : "CON"} ${result.response}`;
    // eslint-disable-next-line no-console
    console.info(
      `[loto-ussd:simulated] ${input.sessionId} ${input.phoneNumber} text=${JSON.stringify(input.text)} → ${formatted.replace(/\n/g, " | ")}`,
    );
    return { formatted, result };
  }
}

/**
 * Africa's Talking adapter STUB.
 *
 * Documented against Africa's Talking SMS API:
 *   POST https://api.africastalking.com/version1/messaging
 *   Headers: ApiKey, Accept: application/json
 *   Body: form-urlencoded { username, to, message, from? }
 *   Response: { SMSMessageData: { Recipients: [ { messageId, status, ... } ] } }
 *
 * In demo (PRODUCTION_MODE !== "true") OR when AT_API_KEY/AT_USERNAME are
 * absent, this adapter falls back to the simulated path so the rest of the
 * pipeline still works end-to-end. Real production keys drop in by setting
 * PRODUCTION_MODE=true plus the two env vars; no code changes required.
 */
export class AfricasTalkingAdapter implements MessagingAdapter {
  id: MessagingAdapterId = "africas_talking";
  private fallback = new SimulatedMessagingAdapter();

  private isLive(): boolean {
    return (
      process.env.PRODUCTION_MODE === "true" &&
      !!process.env.AT_API_KEY &&
      !!process.env.AT_USERNAME
    );
  }

  async sendSms(input: SmsSendInput): Promise<SmsSendResult> {
    if (!this.isLive()) {
      return this.fallback.sendSms(input);
    }
    try {
      // Real-world call shape — kept inline so adding the live HTTP request
      // when production keys land is a single uncommented block.
      const params = new URLSearchParams({
        username: process.env.AT_USERNAME!,
        to: input.to,
        message: input.body,
        ...(process.env.AT_FROM ? { from: process.env.AT_FROM } : {}),
      });
      const r = await fetch("https://api.africastalking.com/version1/messaging", {
        method: "POST",
        headers: {
          "ApiKey": process.env.AT_API_KEY!,
          "Accept": "application/json",
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: params.toString(),
      });
      if (!r.ok) {
        const txt = await r.text();
        return { status: "failed", providerRef: null, error: `at_http_${r.status}:${txt.slice(0, 200)}` };
      }
      const j = (await r.json()) as { SMSMessageData?: { Recipients?: Array<{ messageId?: string; status?: string }> } };
      const rec = j?.SMSMessageData?.Recipients?.[0];
      if (rec?.status && rec.status !== "Success") {
        return { status: "failed", providerRef: rec.messageId ?? null, error: `at_status_${rec.status}` };
      }
      return { status: "sent", providerRef: rec?.messageId ?? null };
    } catch (err) {
      return { status: "failed", providerRef: null, error: (err as Error).message };
    }
  }

  /**
   * Africa's Talking USSD callback contract: the aggregator POSTs the
   * cumulative `text` and expects a plain text body prefixed with "CON" to
   * keep the call open or "END" to terminate. The adapter is a thin framing
   * layer on top of the pure reducer; it does not call any HTTP endpoint.
   */
  async sendUssdSession(
    input: UssdSessionInput,
    runReducer: (i: UssdSessionInput) => Promise<UssdSessionResult> | UssdSessionResult,
  ): Promise<{ formatted: string; result: UssdSessionResult }> {
    const result = await runReducer(input);
    return { formatted: `${result.terminate ? "END" : "CON"} ${result.response}`, result };
  }
}

/**
 * Twilio adapter STUB.
 *
 * Documented against Twilio's SMS REST API:
 *   POST https://api.twilio.com/2010-04-01/Accounts/{Sid}/Messages.json
 *   Auth: HTTP Basic (Sid, AuthToken)
 *   Body: form-urlencoded { To, From|MessagingServiceSid, Body }
 *   Response: { sid, status, error_code? }
 *
 * Same demo-fallback rules as AfricasTalkingAdapter: only hits the wire when
 * PRODUCTION_MODE=true and Twilio creds are set.
 */
export class TwilioAdapter implements MessagingAdapter {
  id: MessagingAdapterId = "twilio";
  private fallback = new SimulatedMessagingAdapter();

  private isLive(): boolean {
    return (
      process.env.PRODUCTION_MODE === "true" &&
      !!process.env.TWILIO_ACCOUNT_SID &&
      !!process.env.TWILIO_AUTH_TOKEN &&
      (!!process.env.TWILIO_FROM || !!process.env.TWILIO_MESSAGING_SERVICE_SID)
    );
  }

  async sendSms(input: SmsSendInput): Promise<SmsSendResult> {
    if (!this.isLive()) {
      return this.fallback.sendSms(input);
    }
    try {
      const sid = process.env.TWILIO_ACCOUNT_SID!;
      const token = process.env.TWILIO_AUTH_TOKEN!;
      const params = new URLSearchParams({
        To: input.to,
        Body: input.body,
        ...(process.env.TWILIO_MESSAGING_SERVICE_SID
          ? { MessagingServiceSid: process.env.TWILIO_MESSAGING_SERVICE_SID }
          : { From: process.env.TWILIO_FROM! }),
      });
      const auth = Buffer.from(`${sid}:${token}`).toString("base64");
      const r = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
        method: "POST",
        headers: {
          "Authorization": `Basic ${auth}`,
          "Accept": "application/json",
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: params.toString(),
      });
      if (!r.ok) {
        const txt = await r.text();
        return { status: "failed", providerRef: null, error: `twilio_http_${r.status}:${txt.slice(0, 200)}` };
      }
      const j = (await r.json()) as { sid?: string; status?: string; error_code?: string };
      if (j.error_code) {
        return { status: "failed", providerRef: j.sid ?? null, error: `twilio_${j.error_code}` };
      }
      return { status: "sent", providerRef: j.sid ?? null };
    } catch (err) {
      return { status: "failed", providerRef: null, error: (err as Error).message };
    }
  }

  /**
   * Twilio Programmable USSD (early-access) wraps the response in TwiML;
   * the route handler is intentionally provider-agnostic so we keep the same
   * "CON ... / END ..." plain-text contract here. A real production wire-up
   * would replace the formatter with TwiML emission.
   */
  async sendUssdSession(
    input: UssdSessionInput,
    runReducer: (i: UssdSessionInput) => Promise<UssdSessionResult> | UssdSessionResult,
  ): Promise<{ formatted: string; result: UssdSessionResult }> {
    const result = await runReducer(input);
    return { formatted: `${result.terminate ? "END" : "CON"} ${result.response}`, result };
  }
}

const SIMULATED = new SimulatedMessagingAdapter();
const AT = new AfricasTalkingAdapter();
const TW = new TwilioAdapter();

/**
 * Per-country adapter selection. Reads the per-country adapter id from the
 * caller — typically passed in by loto-notifications.ts after consulting
 * shared/tax-authority.ts and any per-country override row. In DEMO mode
 * we ALWAYS return the simulated adapter so no real SMS can be sent.
 */
export function selectAdapter(adapterId: MessagingAdapterId | string | undefined | null): MessagingAdapter {
  if (process.env.PRODUCTION_MODE !== "true") return SIMULATED;
  switch (adapterId) {
    case "africas_talking": return AT;
    case "twilio": return TW;
    case "simulated":
    default: return SIMULATED;
  }
}

/**
 * Strict E.164 normaliser. We never dispatch an SMS for a phone that can't
 * be normalised — a malformed recipient is logged and the row marked failed.
 *
 * Rules:
 *   * If the input starts with "+" and is 8-16 chars of digits afterwards,
 *     accept as-is.
 *   * Otherwise strip non-digits and (a) drop a leading "00" prefix, then
 *     (b) require the country dialing code to be passed in so we can
 *     prefix it. We deliberately do NOT carry a hard-coded country->dial
 *     map here — that lives in shared/tax-authority adjacent config; the
 *     caller passes the dial code in.
 */
export function toE164(raw: string | null | undefined, dialingCode?: string): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (/^\+\d{8,16}$/.test(trimmed)) return trimmed;
  let digits = trimmed.replace(/\D/g, "");
  if (digits.startsWith("00")) digits = digits.slice(2);
  if (!digits) return null;
  if (dialingCode) {
    const cc = dialingCode.replace(/\D/g, "");
    if (cc && !digits.startsWith(cc)) digits = cc + digits.replace(/^0+/, "");
  }
  if (digits.length < 8 || digits.length > 16) return null;
  return `+${digits}`;
}
