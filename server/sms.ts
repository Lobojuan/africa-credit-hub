const AT_API_URL = "https://api.africastalking.com/version1/messaging";
const AT_SANDBOX_URL = "https://api.sandbox.africastalking.com/version1/messaging";

let smsConfigured = false;
let smsProvider: "africastalking" | "stub" = "stub";

const AT_USERNAME = process.env.AT_USERNAME || "";
const AT_API_KEY = process.env.AT_API_KEY || "";
const AT_SENDER_ID = process.env.AT_SENDER_ID || "";
const AT_SANDBOX = process.env.AT_SANDBOX === "true";

if (AT_USERNAME && AT_API_KEY) {
  smsConfigured = true;
  smsProvider = "africastalking";
  console.log(`[SMS] Africa's Talking configured (username: ${AT_USERNAME}, sandbox: ${AT_SANDBOX})`);
} else {
  console.log("[SMS] No SMS provider configured — set AT_USERNAME and AT_API_KEY for Africa's Talking");
}

export async function sendSms(to: string, message: string): Promise<boolean> {
  if (!smsConfigured) {
    console.log(`[SMS][Stub] Would send to ${to}: "${message.substring(0, 50)}..."`);
    return false;
  }

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

export async function sendOtpSms(phone: string, otp: string): Promise<boolean> {
  const message = `Your Africa Credit Hub verification code is: ${otp}\n\nThis code expires in 10 minutes. Do not share it with anyone.\n\n- Africa Credit Hub`;
  return sendSms(phone, message);
}

export function isSmsConfigured(): boolean {
  return smsConfigured;
}
