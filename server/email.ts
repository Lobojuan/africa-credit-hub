import nodemailer from "nodemailer";
import { isGhanaMode } from "./country-mode";

function redactEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!domain) return '[invalid]';
  return `${local.slice(0, 2)}***@${domain}`;
}

function esc(str: string | undefined | null): string {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

let transporter: nodemailer.Transporter | null = null;
let emailConfigured = false;
let emailProvider: "smtp" | "sendgrid" | "stub" = "stub";

const FROM_EMAIL = process.env.SMTP_FROM || process.env.PLATFORM_SUPPORT_EMAIL || "support@africacredithub.com";
const FROM_NAME = isGhanaMode() ? "Ghana Credit Registry" : "Pan-African Credit Registry";

async function sendViaSendGrid(to: string, subject: string, htmlBody: string): Promise<boolean> {
  const apiKey = process.env.SENDGRID_API_KEY;
  if (!apiKey) return false;
  try {
    const resp = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: to }] }],
        from: { email: FROM_EMAIL, name: FROM_NAME },
        subject,
        content: [{ type: "text/html", value: htmlBody }],
      }),
    });
    if (resp.ok || resp.status === 202) {
      console.log(`[Email][SendGrid] Sent to ${redactEmail(to)}`);
      return true;
    }
    console.error(`[Email][SendGrid] Failed ${resp.status}`);
    return false;
  } catch (err: any) {
    console.error(`[Email][SendGrid] Error:`, err.message);
    return false;
  }
}

let hasSendGrid = false;
let hasSmtp = false;

function initEmail() {
  if (process.env.SENDGRID_API_KEY) {
    hasSendGrid = true;
    emailProvider = "sendgrid";
    emailConfigured = true;
    console.log("[Email] SendGrid configured (API key found)");
  }

  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || "587");
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (host && user && pass) {
    hasSmtp = true;
    if (!hasSendGrid) emailProvider = "smtp";
    transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });

    transporter.verify((err) => {
      if (err) {
        console.error("[Email] SMTP connection failed:", err.message);
        transporter = null;
        hasSmtp = false;
      } else {
        emailConfigured = true;
        console.log(`[Email] SMTP configured via ${host} (rate limit: ~500/day for Gmail)`);
      }
    });
  }

  if (!hasSendGrid && !hasSmtp) {
    console.log("[Email] No email provider configured — set SENDGRID_API_KEY or SMTP_HOST/SMTP_USER/SMTP_PASS (stub mode)");
  }
}

initEmail();

function createEmailHtml(title: string, bodyHtml: string): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f5f7;font-family:Arial,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:40px 20px;">
    <div style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.08);">
      <div style="background:linear-gradient(135deg,#1a1a2e 0%,#16213e 100%);padding:28px 32px;">
        <h1 style="color:#fff;margin:0;font-size:20px;font-weight:600;">Pan-African Credit Registry</h1>
        <p style="color:rgba(255,255,255,.7);margin:4px 0 0;font-size:13px;">${process.env.PLATFORM_COMPANY_NAME || "Africa Credit Hub"}</p>
      </div>
      <div style="padding:32px;">
        <h2 style="color:#1a1a2e;margin:0 0 16px;font-size:18px;">${title}</h2>
        ${bodyHtml}
      </div>
      <div style="background:#f8f9fa;padding:20px 32px;border-top:1px solid #eee;">
        <p style="color:#888;font-size:11px;margin:0;">This is an automated message from the Pan-African Credit Registry Platform. Do not reply to this email.</p>
      </div>
    </div>
  </div>
</body>
</html>`;
}

async function sendViaSmtp(to: string, subject: string, htmlBody: string): Promise<boolean> {
  if (!transporter) return false;
  try {
    await transporter.sendMail({
      from: `"${FROM_NAME}" <${FROM_EMAIL}>`,
      to,
      subject,
      html: htmlBody,
    });
    console.log(`[Email][SMTP] Sent to ${redactEmail(to)}`);
    return true;
  } catch (err: any) {
    console.error(`[Email][SMTP] Send failed:`, err.message);
    return false;
  }
}

const RETRY_DELAYS = [0, 2000, 8000];
const MAX_EMAILS_PER_MINUTE = 30;
let emailsSentThisMinute = 0;
let minuteResetTimer: ReturnType<typeof setInterval> | null = null;

if (!minuteResetTimer) {
  minuteResetTimer = setInterval(() => { emailsSentThisMinute = 0; }, 60000);
}

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function attemptSend(to: string, subject: string, htmlBody: string): Promise<boolean> {
  if (emailProvider === "sendgrid") {
    const ok = await sendViaSendGrid(to, subject, htmlBody);
    if (ok) return true;
    if (hasSmtp) {
      console.log(`[Email] SendGrid failed, falling back to SMTP...`);
      return sendViaSmtp(to, subject, htmlBody);
    }
    return false;
  }

  const ok = await sendViaSmtp(to, subject, htmlBody);
  if (ok) return true;
  if (hasSendGrid) {
    console.log(`[Email] SMTP failed, falling back to SendGrid...`);
    return sendViaSendGrid(to, subject, htmlBody);
  }
  return false;
}

async function sendEmail(to: string, subject: string, htmlBody: string): Promise<boolean> {
  if (!emailConfigured) {
    console.log(`[Email][Stub] Would send to ${redactEmail(to)}`);
    return false;
  }

  if (emailsSentThisMinute >= MAX_EMAILS_PER_MINUTE) {
    console.warn(`[Email] Rate limit reached (${MAX_EMAILS_PER_MINUTE}/min) — deferring send to ${redactEmail(to)}`);
    return false;
  }

  for (let attempt = 0; attempt < RETRY_DELAYS.length; attempt++) {
    if (attempt > 0) {
      console.log(`[Email] Retry ${attempt}/${RETRY_DELAYS.length - 1} for ${redactEmail(to)} (waiting ${RETRY_DELAYS[attempt]}ms)...`);
      await sleep(RETRY_DELAYS[attempt]);
    }
    try {
      const ok = await attemptSend(to, subject, htmlBody);
      if (ok) {
        emailsSentThisMinute++;
        return true;
      }
    } catch (err: any) {
      console.error(`[Email] Attempt ${attempt + 1} error:`, err.message);
    }
  }

  console.error(`[Email] All ${RETRY_DELAYS.length} attempts failed for ${redactEmail(to)} — subject: "${subject.substring(0, 60)}"`);
  return false;
}

export async function sendWelcomeEmail(orgName: string, adminEmail: string, tier: string): Promise<boolean> {
  const tierInfo: Record<string, { name: string; users: number; price: string }> = {
    standard: { name: "Standard", users: 10, price: "$299/mo" },
    professional: { name: "Professional", users: 50, price: "$799/mo" },
    enterprise: { name: "Enterprise", users: 100, price: "$1,999/mo" },
  };
  const plan = tierInfo[tier] || tierInfo.standard;

  const body = `
    <p style="color:#333;font-size:14px;line-height:1.6;">Welcome to the Pan-African Credit Registry! Your organization <strong>${esc(orgName)}</strong> has been successfully registered.</p>
    <div style="background:#f0f7ff;border-radius:8px;padding:16px 20px;margin:16px 0;">
      <p style="margin:0 0 8px;font-size:13px;color:#555;"><strong>Subscription Plan:</strong> ${plan.name} (${plan.price})</p>
      <p style="margin:0 0 8px;font-size:13px;color:#555;"><strong>Max Users:</strong> ${plan.users}</p>
      <p style="margin:0;font-size:13px;color:#555;"><strong>Coverage:</strong> All 54 African countries</p>
    </div>
    <p style="color:#333;font-size:14px;">You can now start submitting credit data, running inquiries, and generating reports across all supported jurisdictions.</p>
    <a href="https://africacredithub.com" style="display:inline-block;background:#1a1a2e;color:#fff;padding:12px 28px;border-radius:6px;text-decoration:none;font-size:14px;margin-top:8px;">Access Your Dashboard</a>
  `;
  return sendEmail(adminEmail, `Welcome to Pan-African Credit Registry — ${orgName}`, createEmailHtml("Welcome Aboard!", body));
}

export async function sendBillingNotification(orgName: string, email: string, amount: number, currency: string, serviceType: string, status: string): Promise<boolean> {
  const statusColors: Record<string, string> = {
    paid: "#22c55e",
    pending: "#f59e0b",
    overdue: "#ef4444",
    cancelled: "#94a3b8",
  };
  const body = `
    <p style="color:#333;font-size:14px;line-height:1.6;">A billing event has occurred for <strong>${esc(orgName)}</strong>.</p>
    <div style="background:#f8f9fa;border-radius:8px;padding:16px 20px;margin:16px 0;border-left:4px solid ${statusColors[status] || "#64748b"};">
      <p style="margin:0 0 8px;font-size:13px;color:#555;"><strong>Service:</strong> ${esc(serviceType)}</p>
      <p style="margin:0 0 8px;font-size:13px;color:#555;"><strong>Amount:</strong> ${currency} ${amount.toLocaleString()}</p>
      <p style="margin:0;font-size:13px;color:#555;"><strong>Status:</strong> <span style="color:${statusColors[status] || "#64748b"};font-weight:600;">${status.toUpperCase()}</span></p>
    </div>
  `;
  return sendEmail(email, `Billing Update — ${orgName} (${currency} ${amount.toLocaleString()})`, createEmailHtml("Billing Notification", body));
}

export async function sendDisputeNotification(orgName: string, email: string, disputeId: number, borrowerName: string, disputeType: string): Promise<boolean> {
  const body = `
    <p style="color:#333;font-size:14px;line-height:1.6;">A new credit dispute has been filed for <strong>${esc(orgName)}</strong>.</p>
    <div style="background:#fef3cd;border-radius:8px;padding:16px 20px;margin:16px 0;border-left:4px solid #f59e0b;">
      <p style="margin:0 0 8px;font-size:13px;color:#555;"><strong>Dispute ID:</strong> #${disputeId}</p>
      <p style="margin:0 0 8px;font-size:13px;color:#555;"><strong>Borrower:</strong> ${esc(borrowerName)}</p>
      <p style="margin:0;font-size:13px;color:#555;"><strong>Type:</strong> ${esc(disputeType)}</p>
    </div>
    <p style="color:#333;font-size:14px;">Please review and respond to this dispute within 30 days as per regulatory requirements.</p>
    <a href="https://africacredithub.com" style="display:inline-block;background:#1a1a2e;color:#fff;padding:12px 28px;border-radius:6px;text-decoration:none;font-size:14px;margin-top:8px;">Review Dispute</a>
  `;
  return sendEmail(email, `New Dispute Filed — ${orgName} (#${disputeId})`, createEmailHtml("Dispute Alert", body));
}

export async function sendSubscriptionChangeEmail(orgName: string, email: string, oldTier: string, newTier: string): Promise<boolean> {
  const body = `
    <p style="color:#333;font-size:14px;line-height:1.6;">The subscription for <strong>${esc(orgName)}</strong> has been updated.</p>
    <div style="background:#f0fdf4;border-radius:8px;padding:16px 20px;margin:16px 0;border-left:4px solid #22c55e;">
      <p style="margin:0 0 8px;font-size:13px;color:#555;"><strong>Previous Plan:</strong> ${esc(oldTier)}</p>
      <p style="margin:0;font-size:13px;color:#555;"><strong>New Plan:</strong> ${esc(newTier)}</p>
    </div>
    <p style="color:#333;font-size:14px;">Your updated features and limits are now active.</p>
  `;
  return sendEmail(email, `Subscription Updated — ${orgName}`, createEmailHtml("Subscription Change", body));
}

export async function sendNewRegistrationAlert(orgName: string, orgType: string, country: string, contactEmail: string, adminName: string): Promise<boolean> {
  const NOTIFY_EMAIL = process.env.REGISTRATION_NOTIFY_EMAIL || process.env.PLATFORM_SUPPORT_EMAIL || "support@africacredithub.com";
  const body = `
    <p style="color:#333;font-size:14px;line-height:1.6;">A new organization has registered on the Pan-African Credit Registry.</p>
    <div style="background:#f0f7ff;border-radius:8px;padding:16px 20px;margin:16px 0;border-left:4px solid #3b82f6;">
      <p style="margin:0 0 8px;font-size:13px;color:#555;"><strong>Organization:</strong> ${esc(orgName)}</p>
      <p style="margin:0 0 8px;font-size:13px;color:#555;"><strong>Type:</strong> ${esc(orgType)}</p>
      <p style="margin:0 0 8px;font-size:13px;color:#555;"><strong>Country:</strong> ${esc(country)}</p>
      <p style="margin:0 0 8px;font-size:13px;color:#555;"><strong>Contact Email:</strong> ${esc(contactEmail)}</p>
      <p style="margin:0;font-size:13px;color:#555;"><strong>Admin Name:</strong> ${esc(adminName)}</p>
    </div>
    <p style="color:#333;font-size:14px;">Registered at: ${new Date().toLocaleString("en-US", { timeZone: "Africa/Accra", dateStyle: "full", timeStyle: "short" })}</p>
    <a href="${process.env.CANONICAL_URL || 'https://africacredithub.com'}/command-center" style="display:inline-block;background:#1a1a2e;color:#fff;padding:12px 28px;border-radius:6px;text-decoration:none;font-size:14px;margin-top:8px;">Open Command Center</a>
  `;
  return sendEmail(NOTIFY_EMAIL, `New Registration: ${orgName} (${country})`, createEmailHtml("New Trial Registration", body));
}

export async function sendConsumerOtpEmail(email: string, otp: string): Promise<boolean> {
  const body = `
    <p style="color:#333;font-size:14px;line-height:1.6;">Your verification code for Africa Credit Hub is:</p>
    <div style="background:#f0f7ff;border-radius:12px;padding:24px;margin:20px 0;text-align:center;">
      <span style="font-size:36px;font-weight:700;letter-spacing:8px;color:#1a1a2e;font-family:monospace;">${otp}</span>
    </div>
    <p style="color:#333;font-size:14px;line-height:1.6;">This code expires in <strong>10 minutes</strong>. Do not share it with anyone.</p>
    <p style="color:#888;font-size:12px;margin-top:20px;">If you did not request this code, please ignore this email.</p>
  `;
  return sendEmail(email, "Your Verification Code — Africa Credit Hub", createEmailHtml("Verify Your Account", body));
}

export async function sendConsumerVerificationLink(email: string, token: string, baseUrl: string): Promise<boolean> {
  const verifyUrl = `${baseUrl}/api/consumer/verify-email?token=${encodeURIComponent(token)}`;
  const body = `
    <p style="color:#333;font-size:14px;line-height:1.6;">Click the button below to verify your Africa Credit Hub account:</p>
    <div style="text-align:center;margin:28px 0;">
      <a href="${verifyUrl}" style="display:inline-block;background:linear-gradient(135deg,#1a1a2e 0%,#16213e 100%);color:#fff;padding:14px 36px;border-radius:8px;text-decoration:none;font-size:15px;font-weight:600;">Verify My Account</a>
    </div>
    <p style="color:#555;font-size:13px;line-height:1.5;">Or copy and paste this link into your browser:</p>
    <p style="color:#3b82f6;font-size:12px;word-break:break-all;">${verifyUrl}</p>
    <p style="color:#888;font-size:12px;margin-top:20px;">This link expires in <strong>24 hours</strong>. If you did not create this account, please ignore this email.</p>
  `;
  return sendEmail(email, "Verify Your Account — Africa Credit Hub", createEmailHtml("Email Verification", body));
}

export async function sendContactSalesEmail(data: { name: string; email: string; phone?: string; organization: string; title?: string; country?: string; tier?: string; message?: string }): Promise<boolean> {
  const adminEmail = process.env.ADMIN_EMAIL || process.env.PLATFORM_SUPPORT_EMAIL || "support@africacredithub.com";
  const tierLabel = data.tier === "commercial" ? "Commercial" : data.tier === "sovereign" ? "Sovereign" : data.tier || "Not specified";
  const body = `
    <h2 style="color:#0d9488;">New Enterprise Inquiry</h2>
    <table style="width:100%;border-collapse:collapse;margin:16px 0;">
      <tr><td style="padding:8px 12px;border-bottom:1px solid #eee;font-weight:600;width:140px;">Name</td><td style="padding:8px 12px;border-bottom:1px solid #eee;">${esc(data.name)}</td></tr>
      <tr><td style="padding:8px 12px;border-bottom:1px solid #eee;font-weight:600;">Email</td><td style="padding:8px 12px;border-bottom:1px solid #eee;"><a href="mailto:${esc(data.email)}">${esc(data.email)}</a></td></tr>
      ${data.phone ? `<tr><td style="padding:8px 12px;border-bottom:1px solid #eee;font-weight:600;">Phone</td><td style="padding:8px 12px;border-bottom:1px solid #eee;">${esc(data.phone)}</td></tr>` : ""}
      <tr><td style="padding:8px 12px;border-bottom:1px solid #eee;font-weight:600;">Organization</td><td style="padding:8px 12px;border-bottom:1px solid #eee;">${esc(data.organization)}</td></tr>
      ${data.title ? `<tr><td style="padding:8px 12px;border-bottom:1px solid #eee;font-weight:600;">Job Title</td><td style="padding:8px 12px;border-bottom:1px solid #eee;">${esc(data.title)}</td></tr>` : ""}
      ${data.country ? `<tr><td style="padding:8px 12px;border-bottom:1px solid #eee;font-weight:600;">Country</td><td style="padding:8px 12px;border-bottom:1px solid #eee;">${esc(data.country)}</td></tr>` : ""}
      <tr><td style="padding:8px 12px;border-bottom:1px solid #eee;font-weight:600;">Interested In</td><td style="padding:8px 12px;border-bottom:1px solid #eee;">${esc(tierLabel)}</td></tr>
    </table>
    ${data.message ? `<h3 style="margin-top:20px;">Message</h3><p style="background:#f8f9fa;padding:16px;border-radius:8px;white-space:pre-wrap;">${esc(data.message)}</p>` : ""}
    <p style="color:#888;font-size:12px;margin-top:24px;">This inquiry was submitted via the CDH Contact Sales page.</p>
  `;
  return sendEmail(adminEmail, `[CDH Sales Inquiry] ${data.organization} — ${tierLabel}`, createEmailHtml("New Sales Inquiry", body));
}

export function isEmailConfigured(): boolean {
  return emailConfigured;
}
