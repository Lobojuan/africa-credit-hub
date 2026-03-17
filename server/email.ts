import nodemailer from "nodemailer";
import { isGhanaMode } from "./country-mode";

let transporter: nodemailer.Transporter | null = null;
let emailConfigured = false;

const FROM_EMAIL = process.env.SMTP_FROM || "noreply@systemsinmotion.co.ke";
const FROM_NAME = isGhanaMode() ? "Ghana Credit Registry" : "Pan-African Credit Registry";

function initEmail() {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || "587");
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    console.log("[Email] SMTP not configured — set SMTP_HOST, SMTP_USER, SMTP_PASS to enable (stub mode)");
    return;
  }

  transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });

  transporter.verify((err) => {
    if (err) {
      console.error("[Email] SMTP connection failed:", err.message);
      emailConfigured = false;
      transporter = null;
    } else {
      emailConfigured = true;
      console.log("[Email] SMTP configured successfully via", host);
    }
  });
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
        <p style="color:rgba(255,255,255,.7);margin:4px 0 0;font-size:13px;">Carlson Capital & Systems In Motion Limited</p>
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

async function sendEmail(to: string, subject: string, htmlBody: string): Promise<boolean> {
  if (!emailConfigured || !transporter) {
    console.log(`[Email][Stub] Would send to ${to}: "${subject}"`);
    return false;
  }
  try {
    await transporter.sendMail({
      from: `"${FROM_NAME}" <${FROM_EMAIL}>`,
      to,
      subject,
      html: htmlBody,
    });
    console.log(`[Email] Sent to ${to}: "${subject}"`);
    return true;
  } catch (err: any) {
    console.error(`[Email] Failed to send to ${to}:`, err.message);
    return false;
  }
}

export async function sendWelcomeEmail(orgName: string, adminEmail: string, tier: string): Promise<boolean> {
  const tierInfo: Record<string, { name: string; users: number; price: string }> = {
    standard: { name: "Standard", users: 10, price: "$299/mo" },
    professional: { name: "Professional", users: 50, price: "$799/mo" },
    enterprise: { name: "Enterprise", users: 100, price: "$1,999/mo" },
  };
  const plan = tierInfo[tier] || tierInfo.standard;

  const body = `
    <p style="color:#333;font-size:14px;line-height:1.6;">Welcome to the Pan-African Credit Registry! Your organization <strong>${orgName}</strong> has been successfully registered.</p>
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
    <p style="color:#333;font-size:14px;line-height:1.6;">A billing event has occurred for <strong>${orgName}</strong>.</p>
    <div style="background:#f8f9fa;border-radius:8px;padding:16px 20px;margin:16px 0;border-left:4px solid ${statusColors[status] || "#64748b"};">
      <p style="margin:0 0 8px;font-size:13px;color:#555;"><strong>Service:</strong> ${serviceType}</p>
      <p style="margin:0 0 8px;font-size:13px;color:#555;"><strong>Amount:</strong> ${currency} ${amount.toLocaleString()}</p>
      <p style="margin:0;font-size:13px;color:#555;"><strong>Status:</strong> <span style="color:${statusColors[status] || "#64748b"};font-weight:600;">${status.toUpperCase()}</span></p>
    </div>
  `;
  return sendEmail(email, `Billing Update — ${orgName} (${currency} ${amount.toLocaleString()})`, createEmailHtml("Billing Notification", body));
}

export async function sendDisputeNotification(orgName: string, email: string, disputeId: number, borrowerName: string, disputeType: string): Promise<boolean> {
  const body = `
    <p style="color:#333;font-size:14px;line-height:1.6;">A new credit dispute has been filed for <strong>${orgName}</strong>.</p>
    <div style="background:#fef3cd;border-radius:8px;padding:16px 20px;margin:16px 0;border-left:4px solid #f59e0b;">
      <p style="margin:0 0 8px;font-size:13px;color:#555;"><strong>Dispute ID:</strong> #${disputeId}</p>
      <p style="margin:0 0 8px;font-size:13px;color:#555;"><strong>Borrower:</strong> ${borrowerName}</p>
      <p style="margin:0;font-size:13px;color:#555;"><strong>Type:</strong> ${disputeType}</p>
    </div>
    <p style="color:#333;font-size:14px;">Please review and respond to this dispute within 30 days as per regulatory requirements.</p>
    <a href="https://africacredithub.com" style="display:inline-block;background:#1a1a2e;color:#fff;padding:12px 28px;border-radius:6px;text-decoration:none;font-size:14px;margin-top:8px;">Review Dispute</a>
  `;
  return sendEmail(email, `New Dispute Filed — ${orgName} (#${disputeId})`, createEmailHtml("Dispute Alert", body));
}

export async function sendSubscriptionChangeEmail(orgName: string, email: string, oldTier: string, newTier: string): Promise<boolean> {
  const body = `
    <p style="color:#333;font-size:14px;line-height:1.6;">The subscription for <strong>${orgName}</strong> has been updated.</p>
    <div style="background:#f0fdf4;border-radius:8px;padding:16px 20px;margin:16px 0;border-left:4px solid #22c55e;">
      <p style="margin:0 0 8px;font-size:13px;color:#555;"><strong>Previous Plan:</strong> ${oldTier}</p>
      <p style="margin:0;font-size:13px;color:#555;"><strong>New Plan:</strong> ${newTier}</p>
    </div>
    <p style="color:#333;font-size:14px;">Your updated features and limits are now active.</p>
  `;
  return sendEmail(email, `Subscription Updated — ${orgName}`, createEmailHtml("Subscription Change", body));
}

export async function sendNewRegistrationAlert(orgName: string, orgType: string, country: string, contactEmail: string, adminName: string): Promise<boolean> {
  const NOTIFY_EMAIL = process.env.REGISTRATION_NOTIFY_EMAIL || "uffe.carlson@gmail.com";
  const body = `
    <p style="color:#333;font-size:14px;line-height:1.6;">A new organization has registered on the Pan-African Credit Registry.</p>
    <div style="background:#f0f7ff;border-radius:8px;padding:16px 20px;margin:16px 0;border-left:4px solid #3b82f6;">
      <p style="margin:0 0 8px;font-size:13px;color:#555;"><strong>Organization:</strong> ${orgName}</p>
      <p style="margin:0 0 8px;font-size:13px;color:#555;"><strong>Type:</strong> ${orgType}</p>
      <p style="margin:0 0 8px;font-size:13px;color:#555;"><strong>Country:</strong> ${country}</p>
      <p style="margin:0 0 8px;font-size:13px;color:#555;"><strong>Contact Email:</strong> ${contactEmail}</p>
      <p style="margin:0;font-size:13px;color:#555;"><strong>Admin Name:</strong> ${adminName}</p>
    </div>
    <p style="color:#333;font-size:14px;">Registered at: ${new Date().toLocaleString("en-US", { timeZone: "Africa/Accra", dateStyle: "full", timeStyle: "short" })}</p>
    <a href="https://africacredithub.com/api/auth/review-access/sim-gemini-review-2026-q8w3r" style="display:inline-block;background:#1a1a2e;color:#fff;padding:12px 28px;border-radius:6px;text-decoration:none;font-size:14px;margin-top:8px;">View Admin Dashboard</a>
  `;
  return sendEmail(NOTIFY_EMAIL, `New Registration: ${orgName} (${country})`, createEmailHtml("New Trial Registration", body));
}

export function isEmailConfigured(): boolean {
  return emailConfigured;
}
