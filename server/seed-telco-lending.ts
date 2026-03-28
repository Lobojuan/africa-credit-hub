import { db } from "./db";
import { telcoLoans, telcoLoanRepayments, telcoConsentEvents, telcoProfiles } from "@shared/schema";
import { count } from "drizzle-orm";
import { randomUUID } from "crypto";

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
function genDate(daysBack: number): Date {
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
      const interestRateNum = rand(50, 350) / 10;
      const tenorDays = pick([7, 14, 30, 60, 90, 180, 365]);
      const createdAt = genDate(365);
      const disbursedAt = status === "pending_disbursement" ? null : new Date(createdAt.getTime() + rand(1, 3) * 86400000);
      const dueDate = new Date(createdAt.getTime() + tenorDays * 86400000);
      const totalRepayable = Math.round(amount * (1 + interestRateNum / 100));

      let amountRepaid = 0;
      if (status === "paid_off") amountRepaid = totalRepayable;
      else if (status === "active" || status === "repaying") amountRepaid = Math.round(totalRepayable * (rand(10, 80) / 100));
      else if (status === "defaulted") amountRepaid = Math.round(totalRepayable * (rand(0, 40) / 100));

      const outstanding = Math.max(0, totalRepayable - amountRepaid);
      const daysInArrears = (status === "defaulted" || status === "written_off") ? rand(30, 180) : 0;

      const loanId = randomUUID();
      loanBatch.push({
        id: loanId,
        profileId: profile.id,
        country: profile.country,
        loanAmount: String(amount),
        currency: cc.code,
        interestRate: String(interestRateNum.toFixed(2)),
        totalRepayable: String(totalRepayable),
        amountRepaid: String(amountRepaid),
        outstandingBalance: String(outstanding),
        status,
        disbursementStatus: status === "pending_disbursement" ? "pending" : "confirmed",
        disbursementChannel: "mobile_money",
        disbursedAt,
        tenorDays,
        dueDate,
        daysInArrears,
        repaymentFrequency: tenorDays <= 30 ? "lump_sum" : "weekly",
        createdAt,
      });

      if (amountRepaid > 0) {
        const numPayments = Math.max(1, rand(1, Math.min(5, Math.floor(tenorDays / 7))));
        let remaining = amountRepaid;
        for (let p = 0; p < numPayments && remaining > 0; p++) {
          const payAmt = p === numPayments - 1 ? remaining : Math.round(remaining / (numPayments - p));
          const payDate = new Date(createdAt.getTime() + rand(3, tenorDays) * 86400000);
          repaymentBatch.push({
            loanId,
            profileId: profile.id,
            amountDue: String(payAmt),
            amountPaid: String(payAmt),
            currency: cc.code,
            country: profile.country,
            paymentMethod: pick(["mobile_money", "bank_transfer", "agent", "auto_deduct"]),
            status: "paid",
            installmentNumber: p + 1,
            dueDate: payDate,
            paidAt: payDate,
            daysLate: rand(0, 5),
            createdAt: payDate,
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
        validUntil: action === "grant" ? new Date(cDate.getTime() + 365 * 86400000) : null,
        createdAt: cDate,
      });
    }
  }

  const BATCH = 100;
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
