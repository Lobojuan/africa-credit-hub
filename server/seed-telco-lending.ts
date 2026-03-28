import { db } from "./db";
import { telcoLoans, telcoLoanRepayments, telcoConsentEvents, telcoProfiles } from "@shared/schema";
import { sql, count } from "drizzle-orm";

const LOAN_STATUSES = ["pending_disbursement", "disbursed", "active", "repaying", "paid_off", "defaulted", "written_off", "restructured"] as const;
const CONSENT_METHODS = ["ussd", "sms", "app", "web_portal", "agent", "ivr"] as const;
const CONSENT_PURPOSES = ["credit_scoring", "data_sharing", "marketing", "loan_processing", "debt_collection"] as const;

const COUNTRY_CURRENCIES: Record<string, { code: string; avg: number; max: number }> = {
  "Ghana": { code: "GHS", avg: 2000, max: 15000 },
  "Kenya": { code: "KES", avg: 8000, max: 50000 },
  "Nigeria": { code: "NGN", avg: 50000, max: 500000 },
  "Sierra Leone": { code: "SLL", avg: 3000000, max: 20000000 },
  "South Africa": { code: "ZAR", avg: 5000, max: 50000 },
  "Tanzania": { code: "TZS", avg: 200000, max: 2000000 },
  "Uganda": { code: "UGX", avg: 500000, max: 5000000 },
  "Rwanda": { code: "RWF", avg: 100000, max: 1000000 },
  "Ethiopia": { code: "ETB", avg: 15000, max: 100000 },
  "Egypt": { code: "EGP", avg: 5000, max: 50000 },
};

function rand(min: number, max: number) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function pick<T>(arr: readonly T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }
function genDate(daysBack: number) {
  const d = new Date();
  d.setDate(d.getDate() - rand(1, daysBack));
  return d;
}

export async function seedTelcoLending() {
  const [existing] = await db.select({ value: count() }).from(telcoLoans);
  if (existing.value > 0) {
    console.log(`[TelcoLending] Already have ${existing.value} loans, skipping seed.`);
    return;
  }

  const profiles = await db.select({
    id: telcoProfiles.id,
    country: telcoProfiles.country,
    msisdn: telcoProfiles.msisdn,
    provider: telcoProfiles.provider,
  }).from(telcoProfiles);

  if (profiles.length === 0) {
    console.log("[TelcoLending] No telco profiles found, skipping loan seed.");
    return;
  }

  console.log(`[TelcoLending] Seeding loans for ${profiles.length} profiles...`);

  const LOANS_PER_PROFILE = 10;
  const loanBatch: any[] = [];
  const repaymentBatch: any[] = [];
  const consentBatch: any[] = [];

  for (const profile of profiles) {
    const cc = COUNTRY_CURRENCIES[profile.country] || { code: "USD", avg: 500, max: 5000 };
    const loanCount = rand(Math.max(1, LOANS_PER_PROFILE - 5), LOANS_PER_PROFILE + 5);

    for (let i = 0; i < loanCount; i++) {
      const status = pick(LOAN_STATUSES);
      const amount = rand(Math.round(cc.avg * 0.2), cc.max);
      const interestRate = (rand(50, 350) / 10).toFixed(1);
      const termDays = pick([7, 14, 30, 60, 90, 180, 365]);
      const createdAt = genDate(365);
      const disbursedAt = ["pending_disbursement"].includes(status) ? null : new Date(createdAt.getTime() + rand(1, 3) * 86400000);
      const dueDate = new Date(createdAt.getTime() + termDays * 86400000);

      let repaidAmount = 0;
      if (status === "paid_off") repaidAmount = amount;
      else if (["active", "repaying"].includes(status)) repaidAmount = Math.round(amount * (rand(10, 80) / 100));
      else if (status === "defaulted") repaidAmount = Math.round(amount * (rand(0, 40) / 100));

      const loanId = crypto.randomUUID();
      loanBatch.push({
        id: loanId,
        profileId: profile.id,
        country: profile.country,
        loanAmount: String(amount),
        currency: cc.code,
        interestRate: String(interestRate),
        termDays,
        status,
        disbursedAt: disbursedAt?.toISOString(),
        dueDate: dueDate.toISOString().split("T")[0],
        repaidAmount: String(repaidAmount),
        outstandingBalance: String(Math.max(0, amount - repaidAmount)),
        createdAt: createdAt.toISOString(),
      });

      if (repaidAmount > 0) {
        const numPayments = rand(1, Math.min(5, termDays / 7));
        let remaining = repaidAmount;
        for (let p = 0; p < numPayments && remaining > 0; p++) {
          const payAmt = p === numPayments - 1 ? remaining : Math.round(remaining / (numPayments - p));
          const payDate = new Date(createdAt.getTime() + rand(3, termDays) * 86400000);
          repaymentBatch.push({
            loanId,
            amount: String(payAmt),
            currency: cc.code,
            method: pick(["mobile_money", "bank_transfer", "agent", "auto_deduct"]),
            status: "completed",
            paidAt: payDate.toISOString(),
            createdAt: payDate.toISOString(),
          });
          remaining -= payAmt;
        }
      }
    }

    const consentCount = rand(1, 3);
    for (let c = 0; c < consentCount; c++) {
      const action = Math.random() > 0.25 ? "grant" : "revoke";
      const cDate = genDate(300);
      consentBatch.push({
        profileId: profile.id,
        country: profile.country,
        action,
        purpose: pick(CONSENT_PURPOSES),
        method: pick(CONSENT_METHODS),
        ipAddress: `${rand(10, 200)}.${rand(0, 255)}.${rand(0, 255)}.${rand(1, 254)}`,
        expiresAt: action === "grant" ? new Date(cDate.getTime() + 365 * 86400000).toISOString() : null,
        createdAt: cDate.toISOString(),
      });
    }
  }

  const BATCH = 200;
  for (let i = 0; i < loanBatch.length; i += BATCH) {
    await db.insert(telcoLoans).values(loanBatch.slice(i, i + BATCH));
  }
  console.log(`[TelcoLending] Inserted ${loanBatch.length} loans`);

  for (let i = 0; i < repaymentBatch.length; i += BATCH) {
    await db.insert(telcoLoanRepayments).values(repaymentBatch.slice(i, i + BATCH));
  }
  console.log(`[TelcoLending] Inserted ${repaymentBatch.length} repayments`);

  for (let i = 0; i < consentBatch.length; i += BATCH) {
    await db.insert(telcoConsentEvents).values(consentBatch.slice(i, i + BATCH));
  }
  console.log(`[TelcoLending] Inserted ${consentBatch.length} consent events`);

  console.log(`[TelcoLending] Seed complete!`);
}
