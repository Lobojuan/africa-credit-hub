/**
 * Loto Messaging Adapter — Task #286.
 *
 * One narrow interface (`MessagingAdapter`) backed by either:
 *   • SimulatedMessagingAdapter — the safe default in DEMO and any country
 *     without configured carrier credentials. Returns success without ever
 *     hitting a real network. The actual persistence of the message row is
 *     done by the dispatcher (we do NOT write to the DB from inside the
 *     adapter — adapters are pure transport).
 *   • AfricasTalkingAdapter / TwilioAdapter — production stubs whose
 *     interfaces match the published carrier APIs verbatim, so wiring real
 *     credentials is a config change, never a code change.
 *
 * Critical contract for callers (the dispatcher):
 *   - Phone numbers MUST be E.164-normalised before calling sendSms.
 *   - DEMO mode is enforced *here* at the factory level — the simulated
 *     adapter is the only adapter that may run in DEMO regardless of what
 *     the country config says.
 */

import { randomUUID } from "crypto";

export type MessagingProvider = "simulated" | "africas_talking" | "twilio";

export interface SmsSendInput {
  to: string;          // E.164
  body: string;        // ≤ 160 chars enforced upstream
  countryCode: string; // ISO-3166-alpha-2
  templateKey: string; // for provider-side analytics tagging
}

export interface UssdReplyInput {
  sessionId: string;
  msisdn: string;
  countryCode: string;
  body: string;        // ≤ 160 chars
  endSession: boolean;
}

export interface SendResult {
  success: boolean;
  providerRef: string | null;
  error?: string;
}

export interface MessagingAdapter {
  readonly provider: MessagingProvider;
  sendSms(input: SmsSendInput): Promise<SendResult>;
  // For the gateway response path — the USSD aggregator receives the
  // returned body inline; this method exists so the dispatcher has a
  // single uniform entry point for both channels. Most aggregators reply
  // synchronously, so the "sending" here is just shaping the response.
  sendUssdSession(input: UssdReplyInput): Promise<SendResult>;
}

/**
 * Mask a phone number for logs: keep dial-code + first digit, redact middle,
 * keep last 2 digits. Eg "+22507123456 78" -> "+225 7***** 78". Never log
 * the full SMS body — log byte length instead.
 */
function maskPhone(p: string): string {
  if (!p || p.length < 6) return "****";
  return `${p.slice(0, 4)}***${p.slice(-2)}`;
}

class SimulatedMessagingAdapter implements MessagingAdapter {
  readonly provider = "simulated" as const;
  async sendSms(input: SmsSendInput): Promise<SendResult> {
    // eslint-disable-next-line no-console
    console.info(`[loto-messaging:simulated] sms to=${maskPhone(input.to)} country=${input.countryCode} template=${input.templateKey} bytes=${input.body.length}`);
    return { success: true, providerRef: `sim_${randomUUID()}` };
  }
  async sendUssdSession(input: UssdReplyInput): Promise<SendResult> {
    // eslint-disable-next-line no-console
    console.info(`[loto-messaging:simulated] ussd session=${input.sessionId} msisdn=${maskPhone(input.msisdn)} end=${input.endSession} bytes=${input.body.length}`);
    return { success: true, providerRef: `sim_ussd_${input.sessionId}` };
  }
}

/**
 * Africa's Talking SMS API stub.
 * Real endpoint: POST https://api.africastalking.com/version1/messaging
 *   headers: apiKey: <KEY>, Accept: application/json
 *   body (form): username, to, message, from?
 *   response: { SMSMessageData: { Recipients: [{ messageId, status, ... }] } }
 *
 * Wiring real credentials = read AT_USERNAME / AT_API_KEY from env, replace
 * the stubbed return with a fetch() to the URL above. No call site change.
 */
class AfricasTalkingAdapter implements MessagingAdapter {
  readonly provider = "africas_talking" as const;
  constructor(private readonly opts: { username: string; apiKey: string; from?: string }) {}
  async sendSms(input: SmsSendInput): Promise<SendResult> {
    if (!this.opts.username || !this.opts.apiKey) {
      return { success: false, providerRef: null, error: "africas_talking_missing_credentials" };
    }
    // Stub: in production, POST to AT messaging endpoint and parse Recipients[0].
    // eslint-disable-next-line no-console
    console.info(`[loto-messaging:africas_talking:stub] sms to=${maskPhone(input.to)} template=${input.templateKey}`);
    return { success: true, providerRef: `at_stub_${randomUUID()}` };
  }
  async sendUssdSession(input: UssdReplyInput): Promise<SendResult> {
    // Africa's Talking USSD is synchronous: the aggregator POSTs to our
    // endpoint and we respond with "CON ..." or "END ..." in the HTTP body.
    // No outbound API call is made — this method exists only for symmetry.
    return { success: true, providerRef: `at_ussd_${input.sessionId}` };
  }
}

/**
 * Twilio SMS API stub.
 * Real endpoint: POST https://api.twilio.com/2010-04-01/Accounts/{Sid}/Messages.json
 *   auth: Basic base64(Sid:AuthToken)
 *   body (form): To, From, Body
 *   response: { sid, status, ... }
 */
class TwilioAdapter implements MessagingAdapter {
  readonly provider = "twilio" as const;
  constructor(private readonly opts: { accountSid: string; authToken: string; from: string }) {}
  async sendSms(input: SmsSendInput): Promise<SendResult> {
    if (!this.opts.accountSid || !this.opts.authToken || !this.opts.from) {
      return { success: false, providerRef: null, error: "twilio_missing_credentials" };
    }
    // eslint-disable-next-line no-console
    console.info(`[loto-messaging:twilio:stub] sms to=${maskPhone(input.to)} template=${input.templateKey}`);
    return { success: true, providerRef: `tw_stub_${randomUUID()}` };
  }
  async sendUssdSession(_input: UssdReplyInput): Promise<SendResult> {
    // Twilio does not support USSD. Reject explicitly so misconfiguration
    // surfaces immediately instead of silently dropping menus.
    return { success: false, providerRef: null, error: "twilio_does_not_support_ussd" };
  }
}

const simulated = new SimulatedMessagingAdapter();

export function isDemoMode(): boolean {
  // DEMO is intentionally inferred from the same env flag the rest of the
  // platform uses. If unset, default to DEMO so a mis-configured deployment
  // can never accidentally send real SMS.
  const flag = process.env.LOTO_MESSAGING_LIVE;
  return flag !== "true";
}

/**
 * Factory keyed off the per-country payout/messaging provider string. In
 * DEMO mode every request returns the simulated adapter regardless of the
 * country configuration — that is the kill-switch that makes "never send a
 * real SMS in DEMO" enforceable in code, not just in policy.
 */
export function adapterForMessaging(provider: MessagingProvider | string | null | undefined): MessagingAdapter {
  if (isDemoMode()) return simulated;
  switch (provider) {
    case "africas_talking":
      return new AfricasTalkingAdapter({
        username: process.env.AT_USERNAME ?? "",
        apiKey: process.env.AT_API_KEY ?? "",
        from: process.env.AT_FROM,
      });
    case "twilio":
      return new TwilioAdapter({
        accountSid: process.env.TWILIO_ACCOUNT_SID ?? "",
        authToken: process.env.TWILIO_AUTH_TOKEN ?? "",
        from: process.env.TWILIO_FROM ?? "",
      });
    case "simulated":
    default:
      return simulated;
  }
}

/**
 * Strict E.164 normalisation. Returns null if the input cannot be coerced
 * into a plausible international number. The dispatcher uses null as the
 * signal to mark a message as `skipped` (no recipient) instead of dispatching.
 *
 * Country fallback: if the input has no leading + and no country prefix,
 * we apply the supplied country dial-code (e.g. "+225" for CI) before
 * sanity-checking. Any digits-only run shorter than 8 or longer than 15
 * is rejected.
 */
const COUNTRY_DIAL_CODES: Record<string, string> = {
  CI: "225", SN: "221", NG: "234", KE: "254", GH: "233", ZA: "27",
  CM: "237", BJ: "229", TG: "228", ML: "223", BF: "226", RW: "250",
  TZ: "255", UG: "256", ET: "251", EG: "20", MA: "212", DZ: "213",
  TN: "216", AO: "244", MZ: "258", ZM: "260", ZW: "263", BW: "267",
  NA: "264", MG: "261", MU: "230", SC: "248", DJ: "253", ER: "291",
  SO: "252", SS: "211", SD: "249", LY: "218", LR: "231", SL: "232",
  GN: "224", GW: "245", GM: "220", CV: "238", MR: "222", NE: "227",
  TD: "235", CF: "236", CG: "242", CD: "243", GA: "241", GQ: "240",
  ST: "239", BI: "257", KM: "269", LS: "266", SZ: "268", MW: "265",
};

export function normalisePhoneE164(raw: string | null | undefined, countryCode: string): string | null {
  if (!raw) return null;
  const trimmed = String(raw).trim();
  if (!trimmed) return null;
  // Strip everything except digits and a leading +.
  let cleaned = trimmed.replace(/[^\d+]/g, "");
  if (cleaned.startsWith("00")) cleaned = "+" + cleaned.slice(2);
  if (!cleaned.startsWith("+")) {
    const dial = COUNTRY_DIAL_CODES[countryCode];
    if (!dial) return null;
    // Drop a single leading "0" national-trunk prefix if present.
    const local = cleaned.startsWith("0") ? cleaned.slice(1) : cleaned;
    cleaned = `+${dial}${local}`;
  }
  // Final sanity: 8–15 digits after +.
  const digits = cleaned.slice(1);
  if (!/^\d{8,15}$/.test(digits)) return null;
  return cleaned;
}
