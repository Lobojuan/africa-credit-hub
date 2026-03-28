import { db } from "./db";
import { telcoProfiles, momoTransactions, telcoCreditScores } from "@shared/schema";
import { sql } from "drizzle-orm";

const COUNTRIES = [
  { name: "Ghana", providers: ["mtn", "vodafone", "tigo"], prefix: "+233", currency: "GHS", population: 0.20 },
  { name: "Kenya", providers: ["safaricom", "airtel"], prefix: "+254", currency: "KES", population: 0.15 },
  { name: "Nigeria", providers: ["mtn", "glo", "airtel", "other"], prefix: "+234", currency: "NGN", population: 0.20 },
  { name: "Sierra Leone", providers: ["orange", "africell"], prefix: "+232", currency: "SLL", population: 0.05 },
  { name: "South Africa", providers: ["mtn", "vodafone", "other"], prefix: "+27", currency: "ZAR", population: 0.08 },
  { name: "Tanzania", providers: ["vodafone", "airtel", "tigo"], prefix: "+255", currency: "TZS", population: 0.08 },
  { name: "Uganda", providers: ["mtn", "airtel"], prefix: "+256", currency: "UGX", population: 0.08 },
  { name: "Rwanda", providers: ["mtn", "airtel"], prefix: "+250", currency: "RWF", population: 0.05 },
  { name: "Ethiopia", providers: ["other"], prefix: "+251", currency: "ETB", population: 0.08 },
  { name: "Egypt", providers: ["vodafone", "orange", "other"], prefix: "+20", currency: "EGP", population: 0.03 },
];

const KYC_LEVELS = ["none", "basic", "standard", "full"] as const;
const DEVICE_TYPES = ["Smartphone", "Feature Phone", "Basic Phone"];
const TX_TYPES = ["cash_in", "cash_out", "p2p_send", "p2p_receive", "bill_payment", "merchant_payment", "airtime_purchase", "savings_deposit", "savings_withdrawal", "loan_repayment"] as const;
const RISK_TIERS = ["very_low", "low", "medium", "high", "very_high"] as const;
const CATEGORIES = ["groceries", "transport", "utilities", "education", "health", "entertainment", "savings", "business", "rent", "other"];

function rand(min: number, max: number) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function pick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }
function genPhone(prefix: string) { return prefix + String(rand(100000000, 999999999)); }
function genDate(yearsBack: number) {
  const d = new Date();
  d.setDate(d.getDate() - rand(1, yearsBack * 365));
  return d;
}
function formatDate(d: Date) { return d.toISOString().split("T")[0]; }

const TOTAL_PROFILES = 50000;
const BATCH_SIZE = 500;

async function seedLargeTelco() {
  console.log(`\n=== Large-Scale Telco Data Seeding ===`);
  console.log(`Target: ${TOTAL_PROFILES.toLocaleString()} profiles across ${COUNTRIES.length} countries\n`);

  const existingCount = await db.execute(sql`SELECT COUNT(*)::int as c FROM telco_profiles`);
  const current = (existingCount.rows[0] as any).c;
  console.log(`Currently have ${current} profiles in DB.`);

  let totalProfiles = 0;
  let totalTransactions = 0;
  let totalScores = 0;

  for (const country of COUNTRIES) {
    const countryProfiles = Math.round(TOTAL_PROFILES * country.population);
    const existingForCountry = await db.execute(sql`SELECT COUNT(*)::int as c FROM telco_profiles WHERE country = ${country.name}`);
    const existingCnt = (existingForCountry.rows[0] as any).c;
    if (existingCnt >= countryProfiles * 0.9) {
      console.log(`\n[${country.name}] Already has ${existingCnt} profiles — skipping.`);
      continue;
    }
    console.log(`\n[${country.name}] Generating ${countryProfiles.toLocaleString()} profiles (existing: ${existingCnt})...`);

    for (let batch = 0; batch < countryProfiles; batch += BATCH_SIZE) {
      const batchEnd = Math.min(batch + BATCH_SIZE, countryProfiles);
      const profileBatch: any[] = [];
      const txBatch: any[] = [];
      const scoreBatch: any[] = [];

      for (let i = batch; i < batchEnd; i++) {
        const profileId = `tp-${country.name.toLowerCase().replace(/ /g, "")}-${String(i).padStart(6, "0")}`;
        const kycLevel = pick(KYC_LEVELS);
        const deviceType = pick(DEVICE_TYPES);
        const simDate = genDate(5);
        const provider = pick(country.providers);
        const isActive = Math.random() > 0.05;

        profileBatch.push({
          id: profileId,
          msisdn: genPhone(country.prefix),
          provider,
          country: country.name,
          simRegistrationDate: formatDate(simDate),
          kycLevel,
          deviceType,
          deviceChanges90d: rand(0, deviceType === "Smartphone" ? 3 : 1),
          accountStatus: isActive ? "active" : "dormant",
          consentGranted: Math.random() > 0.15,
          consentDate: Math.random() > 0.15 ? genDate(2) : null,
        });

        const txCount = rand(5, 30);
        for (let t = 0; t < txCount; t++) {
          const txType = pick(TX_TYPES);
          const isSend = ["cash_out", "p2p_send", "bill_payment", "merchant_payment", "airtime_purchase", "loan_repayment"].includes(txType);
          const baseAmount = txType === "bill_payment" ? rand(5, 200) :
                            txType === "merchant_payment" ? rand(1, 500) :
                            txType === "airtime_purchase" ? rand(1, 50) :
                            txType === "loan_repayment" ? rand(10, 300) :
                            txType === "savings_deposit" ? rand(5, 500) :
                            rand(5, 1000);
          const amount = (baseAmount + Math.random() * baseAmount * 0.5).toFixed(2);

          txBatch.push({
            id: `tx-${profileId}-${String(t).padStart(3, "0")}`,
            profileId,
            transactionType: txType,
            amount,
            currency: country.currency,
            counterpartyMsisdn: Math.random() > 0.3 ? genPhone(country.prefix) : null,
            counterpartyName: Math.random() > 0.5 ? `User-${rand(1000, 9999)}` : null,
            isMerchant: txType === "merchant_payment",
            category: pick(CATEGORIES),
            narration: `${txType.replace(/_/g, " ")} #${rand(10000, 99999)}`,
            balanceAfter: (rand(50, 5000) + Math.random() * 100).toFixed(2),
            transactionDate: genDate(1),
          });
        }

        if (Math.random() > 0.3) {
          const riskScore = rand(1, 5);
          const riskTier = RISK_TIERS[riskScore - 1];
          const creditMultiplier = country.currency === "NGN" ? 500 : country.currency === "KES" ? 150 : country.currency === "GHS" ? 12 : country.currency === "UGX" ? 4000 : country.currency === "TZS" ? 2500 : country.currency === "ZAR" ? 20 : country.currency === "RWF" ? 1200 : country.currency === "ETB" ? 60 : country.currency === "EGP" ? 50 : country.currency === "SLL" ? 22000 : 1;
          const baseCreditLimit = riskScore <= 2 ? rand(200, 1000) : riskScore === 3 ? rand(100, 500) : rand(50, 200);
          const creditLimit = (baseCreditLimit * creditMultiplier).toFixed(2);
          const isApproved = riskScore <= 3;

          const reasons = [
            "Strong MoMo transaction history with consistent patterns",
            "Regular utility payments demonstrate financial discipline",
            "High wallet retention ratio indicates savings behavior",
            "Diverse transaction network suggests stable income",
            "Consistent P2P activity with positive cash flow",
            "Limited transaction history — elevated risk profile",
            "High cash-out ratio suggests potential fund diversion",
            "Irregular transaction patterns indicate instability",
            "Low wallet retention with frequent large withdrawals",
            "Dormant periods detected — inconsistent usage",
          ];

          scoreBatch.push({
            id: `sc-${profileId}`,
            profileId,
            riskTier,
            riskScore,
            creditLimit,
            currency: country.currency,
            approvalRecommendation: isApproved,
            reasonCode: pick(reasons),
            detailedRationale: `${pick(reasons)}. ${pick(reasons)}. Evaluation based on ${txCount} transactions over 90-day period.`,
            evaluationPeriodDays: 90,
            kpiSnapshot: JSON.stringify({
              financialMetrics: {
                totalInflow: (rand(500, 20000) * creditMultiplier).toFixed(2),
                totalOutflow: (rand(300, 15000) * creditMultiplier).toFixed(2),
                avgMonthlyInflow: (rand(100, 5000) * creditMultiplier).toFixed(2),
                walletRetentionRatio: (Math.random() * 0.6 + 0.1).toFixed(3),
                utilityPaymentsCount: rand(0, 15),
                merchantPaymentsCount: rand(0, 30),
                p2pSendCount: rand(2, 50),
                p2pReceiveCount: rand(2, 40),
              },
              telemetricMetrics: {
                simAgeDays: rand(90, 1800),
                deviceChanges: rand(0, 3),
                uniqueCounterparties: rand(5, 80),
              },
              riskIndicators: {
                dormantPeriodDays: rand(0, 45),
                largeWithdrawalRatio: (Math.random() * 0.4).toFixed(3),
                nightActivityRatio: (Math.random() * 0.2).toFixed(3),
              },
            }),
            aiProvider: pick(["openai", "anthropic"]),
            aiModel: pick(["gpt-4o", "claude-3-opus"]),
            country: country.name,
          });
        }
      }

      try {
        if (profileBatch.length > 0) {
          await db.insert(telcoProfiles).values(profileBatch).onConflictDoNothing();
          totalProfiles += profileBatch.length;
        }

        for (let txi = 0; txi < txBatch.length; txi += 1000) {
          const chunk = txBatch.slice(txi, txi + 1000);
          await db.insert(momoTransactions).values(chunk).onConflictDoNothing();
          totalTransactions += chunk.length;
        }

        if (scoreBatch.length > 0) {
          await db.insert(telcoCreditScores).values(scoreBatch).onConflictDoNothing();
          totalScores += scoreBatch.length;
        }
      } catch (err: any) {
        console.error(`  Batch error: ${err.message?.substring(0, 100)}`);
      }

      if ((batch / BATCH_SIZE) % 5 === 0 || batchEnd === countryProfiles) {
        console.log(`  [${country.name}] ${batchEnd.toLocaleString()}/${countryProfiles.toLocaleString()} profiles inserted`);
      }
    }
  }

  console.log(`\n=== Seeding Complete ===`);
  console.log(`Profiles:     ${totalProfiles.toLocaleString()}`);
  console.log(`Transactions: ${totalTransactions.toLocaleString()}`);
  console.log(`Scores:       ${totalScores.toLocaleString()}`);
  console.log();
}

seedLargeTelco().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
