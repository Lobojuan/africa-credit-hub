const AT_API_URL = "https://api.africastalking.com/version1/messaging";
const AT_SANDBOX_URL = "https://api.sandbox.africastalking.com/version1/messaging";

let smsConfigured = false;
let smsProvider: "africastalking" | "twilio" | "stub" = "stub";

const AT_USERNAME = process.env.AT_USERNAME || "";
const AT_API_KEY = process.env.AT_API_KEY || "";
const AT_SENDER_ID = process.env.AT_SENDER_ID || "";
const AT_SANDBOX = process.env.AT_SANDBOX === "true";

const TWILIO_SID = process.env.TWILIO_ACCOUNT_SID || "";
const TWILIO_AUTH = process.env.TWILIO_AUTH_TOKEN || "";
const TWILIO_FROM = process.env.TWILIO_PHONE_NUMBER || "";

if (TWILIO_SID && TWILIO_AUTH && TWILIO_FROM) {
  smsConfigured = true;
  smsProvider = "twilio";
  console.log(`[SMS] Twilio configured (SID: ${TWILIO_SID.slice(0, 6)}...)`);
} else if (AT_USERNAME && AT_API_KEY) {
  smsConfigured = true;
  smsProvider = "africastalking";
  console.log(`[SMS] Africa's Talking configured (username: ${AT_USERNAME}, sandbox: ${AT_SANDBOX})`);
} else {
  console.log("[SMS] No SMS provider configured — set TWILIO_ACCOUNT_SID/TWILIO_AUTH_TOKEN/TWILIO_PHONE_NUMBER or AT_USERNAME/AT_API_KEY");
}

async function sendViaTwilio(to: string, message: string): Promise<boolean> {
  try {
    const url = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_SID}/Messages.json`;
    const auth = Buffer.from(`${TWILIO_SID}:${TWILIO_AUTH}`).toString("base64");

    const params = new URLSearchParams();
    params.append("To", to);
    params.append("From", TWILIO_FROM);
    params.append("Body", message);

    const resp = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });

    const data = await resp.json();

    if (resp.ok && (data.status === "queued" || data.status === "sent" || data.status === "accepted")) {
      console.log(`[SMS][Twilio] Sent to ${to.replace(/(.{4}).+(.{4})/, "$1****$2")} (SID: ${data.sid?.slice(0, 10)}...)`);
      return true;
    }

    console.error(`[SMS][Twilio] Failed for ${to.replace(/(.{4}).+(.{4})/, "$1****$2")}: ${data.message || data.status || resp.status}`);
    return false;
  } catch (err: any) {
    console.error(`[SMS][Twilio] Error:`, err.message);
    return false;
  }
}

async function sendViaAT(to: string, message: string): Promise<boolean> {
  try {
    const url = AT_SANDBOX ? AT_SANDBOX_URL : AT_API_URL;
    const params = new URLSearchParams();
    params.append("username", AT_USERNAME);
    params.append("to", to);
    params.append("message", message);
    if (AT_SENDER_ID && !AT_SANDBOX) {
      params.append("from", AT_SENDER_ID);
    }

    const resp = await fetch(url, {
      method: "POST",
      headers: {
        "apiKey": AT_API_KEY,
        "Content-Type": "application/x-www-form-urlencoded",
        "Accept": "application/json",
      },
      body: params.toString(),
    });

    const data = await resp.json();

    if (data?.SMSMessageData?.Recipients) {
      const recipients = data.SMSMessageData.Recipients;
      const sent = recipients.filter((r: any) => r.statusCode === 101 || r.status === "Success");
      if (sent.length > 0) {
        console.log(`[SMS][AT] Sent to ${to.replace(/(.{4}).+(.{4})/, "$1****$2")}`);
        return true;
      }
      console.error(`[SMS][AT] Failed for ${to.replace(/(.{4}).+(.{4})/, "$1****$2")}:`, JSON.stringify(recipients));
      return false;
    }

    console.error(`[SMS][AT] Unexpected response:`, JSON.stringify(data).substring(0, 200));
    return false;
  } catch (err: any) {
    console.error(`[SMS][AT] Error:`, err.message);
    return false;
  }
}

export async function sendSms(to: string, message: string): Promise<boolean> {
  if (!smsConfigured) {
    console.log(`[SMS][Stub] Would send to ${to.replace(/(.{4}).+(.{4})/, "$1****$2")}: "${message.substring(0, 50)}..."`);
    return false;
  }

  if (smsProvider === "twilio") {
    const ok = await sendViaTwilio(to, message);
    if (ok) return true;
    if (AT_USERNAME && AT_API_KEY) {
      console.log("[SMS] Twilio failed, falling back to Africa's Talking...");
      return sendViaAT(to, message);
    }
    return false;
  }

  if (smsProvider === "africastalking") {
    const ok = await sendViaAT(to, message);
    if (ok) return true;
    if (TWILIO_SID && TWILIO_AUTH && TWILIO_FROM) {
      console.log("[SMS] Africa's Talking failed, falling back to Twilio...");
      return sendViaTwilio(to, message);
    }
    return false;
  }

  return false;
}

export async function sendOtpSms(phone: string, otp: string): Promise<boolean> {
  const message = `Your Africa Credit Hub verification code is: ${otp}\n\nThis code expires in 10 minutes. Do not share it with anyone.\n\n- Africa Credit Hub`;
  return sendSms(phone, message);
}

export function isSmsConfigured(): boolean {
  return smsConfigured;
}
