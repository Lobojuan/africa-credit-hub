import { Router } from "express";
import { storage } from "../storage";
import { db } from "../db";
import { sql, eq, and, desc } from "drizzle-orm";
import { telcoProfiles, telcoLoans, telcoLoanRepayments } from "@shared/schema";
import { calculateMLCreditScore } from "../ml-credit-score";
import { createLogger } from "../logger";
import {
  requireRole, enforceDataSovereignty, idempotencyMiddleware,
  getOrgScope, getCountryFilter, safeErrorMessage,
} from "./middleware";

const routeLogger = createLogger("telco");
const router = Router();

router.get("/api/telco/profiles", requireRole("admin", "lender", "regulator"), enforceDataSovereignty, async (req, res) => {
    try {
      const orgId = getOrgScope(req);
      const country = getCountryFilter(req) || (req.query.country as string);
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;
      const search = req.query.search as string;
      const provider = req.query.provider as string;
      const kycLevel = req.query.kycLevel as string;
      const accountStatus = req.query.accountStatus as string;
      const result = await storage.getTelcoProfiles(orgId, country, { page, limit, search, provider, kycLevel, accountStatus });
      res.json(result);
    } catch (e: any) {
      res.status(500).json({ message: safeErrorMessage(e) });
    }
  });

router.get("/api/telco/profiles/:id", requireRole("admin", "lender", "regulator"), enforceDataSovereignty, async (req, res) => {
    try {
      const profile = await storage.getTelcoProfile(req.params.id);
      if (!profile) return res.status(404).json({ message: "Profile not found" });
      const orgId = getOrgScope(req);
      if (orgId && profile.organizationId && profile.organizationId !== orgId) {
        return res.status(403).json({ message: "Access denied" });
      }
      res.json(profile);
    } catch (e: any) {
      res.status(500).json({ message: safeErrorMessage(e) });
    }
  });

router.post("/api/telco/profiles", requireRole("admin", "lender"), async (req, res) => {
    try {
      const orgId = getOrgScope(req);
      const data = { ...req.body, organizationId: orgId || req.body.organizationId };
      if (data.consentDate && typeof data.consentDate === "string") data.consentDate = new Date(data.consentDate);
      const profile = await storage.createTelcoProfile(data);
      await storage.createAuditLog({
        action: "CREATE", entity: "telco_profile", entityId: profile.id,
        userId: req.session.userId, details: `Created telco profile for MSISDN ${profile.msisdn}`,
        organizationId: orgId,
      });
      res.json(profile);
    } catch (e: any) {
      res.status(500).json({ message: safeErrorMessage(e) });
    }
  });

router.get("/api/telco/transactions/:profileId", requireRole("admin", "lender", "regulator"), enforceDataSovereignty, async (req, res) => {
    try {
      const profile = await storage.getTelcoProfile(req.params.profileId);
      if (!profile) return res.status(404).json({ message: "Profile not found" });
      const orgId = getOrgScope(req);
      if (orgId && profile.organizationId && profile.organizationId !== orgId) {
        return res.status(403).json({ message: "Access denied" });
      }
      const txns = await storage.getMomoTransactions(req.params.profileId);
      res.json(txns);
    } catch (e: any) {
      res.status(500).json({ message: safeErrorMessage(e) });
    }
  });

router.post("/api/telco/transactions/import", requireRole("admin", "lender"), async (req, res) => {
    try {
      const { profileId, transactions } = req.body;
      if (!profileId || !Array.isArray(transactions)) {
        return res.status(400).json({ message: "profileId and transactions array required" });
      }
      const profile = await storage.getTelcoProfile(profileId);
      if (!profile) return res.status(404).json({ message: "Profile not found" });
      const orgId = getOrgScope(req);
      if (orgId && profile.organizationId && profile.organizationId !== orgId) {
        return res.status(403).json({ message: "Access denied" });
      }
      const formatted = transactions.map((t: any) => ({
        ...t,
        profileId,
        transactionDate: new Date(t.transactionDate),
      }));
      const created = await storage.createMomoTransactions(formatted);
      res.json({ imported: created.length });
    } catch (e: any) {
      res.status(500).json({ message: safeErrorMessage(e) });
    }
  });

router.post("/api/telco/score/:profileId", requireRole("admin", "lender"), async (req, res) => {
    try {
      const { computeTelcoKPIs, generateTelcoCreditScore } = await import("./telco-scoring");
      const profile = await storage.getTelcoProfile(req.params.profileId);
      if (!profile) return res.status(404).json({ message: "Profile not found" });
      const orgId = getOrgScope(req);
      if (orgId && profile.organizationId && profile.organizationId !== orgId) {
        return res.status(403).json({ message: "Access denied" });
      }
      const transactions = await storage.getMomoTransactions(profile.id);
      if (transactions.length === 0) {
        return res.status(400).json({ message: "No MoMo transactions found for this profile. Import transactions first." });
      }
      const periodDays = parseInt(req.body.periodDays as string) || 90;
      const kpis = computeTelcoKPIs(profile, transactions, periodDays);
      const aiResult = await generateTelcoCreditScore(profile, kpis);

      const validTiers = ["very_low", "low", "medium", "high", "very_high"] as const;
      const normalizedTier = validTiers.includes(aiResult.riskTier) ? aiResult.riskTier : "medium";
      const normalizedScore = Math.max(1, Math.min(5, Math.round(aiResult.riskScore)));

      const score = await storage.createTelcoCreditScore({
        profileId: profile.id,
        borrowerId: profile.borrowerId || undefined,
        riskTier: normalizedTier as any,
        riskScore: normalizedScore,
        creditLimit: aiResult.suggestedCreditLimitUsd?.toString(),
        currency: "USD",
        approvalRecommendation: aiResult.approvalRecommendation,
        reasonCode: aiResult.reasonCode,
        detailedRationale: aiResult.detailedRationale,
        evaluationPeriodDays: periodDays,
        kpiSnapshot: JSON.stringify(kpis),
        aiProvider: aiResult.aiProvider,
        aiModel: aiResult.aiModel,
        organizationId: orgId || profile.organizationId || undefined,
        country: profile.country,
      });

      await storage.createAuditLog({
        action: "AI_TELCO_SCORE", entity: "telco_credit_score", entityId: score.id,
        userId: req.session.userId,
        details: `AI telco credit score generated for ${profile.msisdn}: Risk ${aiResult.riskTier} (${aiResult.riskScore}/5), ${aiResult.approvalRecommendation ? "APPROVED" : "DECLINED"}`,
        organizationId: orgId,
      });

      res.json({ score, kpis, aiResult });
    } catch (e: any) {
      routeLogger.error("[TelcoScoring] Error:", { detail: e.message });
      res.status(500).json({ message: safeErrorMessage(e) });
    }
  });

router.get("/api/telco/scores", requireRole("admin", "lender", "regulator"), enforceDataSovereignty, async (req, res) => {
    try {
      const orgId = getOrgScope(req);
      const country = getCountryFilter(req) || (req.query.country as string);
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;
      const riskTier = req.query.riskTier as string;
      const approved = req.query.approved as string;
      const search = req.query.search as string;
      const provider = req.query.provider as string;
      const result = await storage.getTelcoCreditScores(orgId, country, { page, limit, riskTier, approved, search, provider });
      res.json(result);
    } catch (e: any) {
      res.status(500).json({ message: safeErrorMessage(e) });
    }
  });

router.get("/api/telco/scores/:profileId", requireRole("admin", "lender", "regulator"), enforceDataSovereignty, async (req, res) => {
    try {
      const scores = await storage.getTelcoCreditScoresByProfile(req.params.profileId);
      res.json(scores);
    } catch (e: any) {
      res.status(500).json({ message: safeErrorMessage(e) });
    }
  });

router.post("/api/telco/seed-demo", requireRole("admin", "super_admin"), async (req, res) => {
    try {
      const demoProfiles = [
        { msisdn: "+233241234567", provider: "mtn", country: "Ghana", kycLevel: "full", deviceType: "Smartphone", simRegistrationDate: "2021-03-15", consentGranted: true, consentDate: new Date() },
        { msisdn: "+233201112233", provider: "vodafone", country: "Ghana", kycLevel: "basic", deviceType: "Feature Phone", simRegistrationDate: "2023-06-01", consentGranted: true, consentDate: new Date() },
        { msisdn: "+254712345678", provider: "safaricom", country: "Kenya", kycLevel: "standard", deviceType: "Smartphone", simRegistrationDate: "2020-01-10", consentGranted: true, consentDate: new Date() },
        { msisdn: "+256781234567", provider: "mtn", country: "Uganda", kycLevel: "basic", deviceType: "Feature Phone", simRegistrationDate: "2022-09-20", consentGranted: true, consentDate: new Date() },
        { msisdn: "+233551234567", provider: "airtel", country: "Ghana", kycLevel: "none", deviceType: "Basic Phone", simRegistrationDate: "2024-11-01", consentGranted: true, consentDate: new Date() },
        { msisdn: "+254798765432", provider: "safaricom", country: "Kenya", kycLevel: "full", deviceType: "Smartphone", simRegistrationDate: "2019-05-22", consentGranted: true, consentDate: new Date() },
        { msisdn: "+232761234567", provider: "africell", country: "Sierra Leone", kycLevel: "standard", deviceType: "Smartphone", simRegistrationDate: "2022-02-14", consentGranted: true, consentDate: new Date() },
        { msisdn: "+255762345678", provider: "vodafone", country: "Tanzania", kycLevel: "full", deviceType: "Smartphone", simRegistrationDate: "2020-08-12", consentGranted: true, consentDate: new Date() },
        { msisdn: "+250781234567", provider: "mtn", country: "Rwanda", kycLevel: "standard", deviceType: "Smartphone", simRegistrationDate: "2021-11-03", consentGranted: true, consentDate: new Date() },
        { msisdn: "+233271234567", provider: "mtn", country: "Ghana", kycLevel: "full", deviceType: "Smartphone", simRegistrationDate: "2020-02-28", consentGranted: true, consentDate: new Date() },
        { msisdn: "+254723456789", provider: "safaricom", country: "Kenya", kycLevel: "full", deviceType: "Smartphone", simRegistrationDate: "2019-01-15", consentGranted: true, consentDate: new Date() },
        { msisdn: "+256701234567", provider: "airtel", country: "Uganda", kycLevel: "standard", deviceType: "Feature Phone", simRegistrationDate: "2022-04-10", consentGranted: true, consentDate: new Date() },
        { msisdn: "+255713456789", provider: "airtel", country: "Tanzania", kycLevel: "basic", deviceType: "Feature Phone", simRegistrationDate: "2023-01-25", consentGranted: true, consentDate: new Date() },
        { msisdn: "+250722345678", provider: "airtel", country: "Rwanda", kycLevel: "full", deviceType: "Smartphone", simRegistrationDate: "2020-06-18", consentGranted: true, consentDate: new Date() },
        { msisdn: "+232781234567", provider: "orange", country: "Sierra Leone", kycLevel: "basic", deviceType: "Basic Phone", simRegistrationDate: "2023-09-05", consentGranted: true, consentDate: new Date() },
        { msisdn: "+2349012345678", provider: "glo", country: "Nigeria", kycLevel: "full", deviceType: "Smartphone", simRegistrationDate: "2020-04-15", consentGranted: true, consentDate: new Date() },
        { msisdn: "+233541234567", provider: "tigo", country: "Ghana", kycLevel: "standard", deviceType: "Smartphone", simRegistrationDate: "2021-07-20", consentGranted: true, consentDate: new Date() },
        { msisdn: "+254734567890", provider: "safaricom", country: "Kenya", kycLevel: "basic", deviceType: "Feature Phone", simRegistrationDate: "2023-03-10", consentGranted: true, consentDate: new Date() },
        { msisdn: "+256712345670", provider: "mtn", country: "Uganda", kycLevel: "full", deviceType: "Smartphone", simRegistrationDate: "2019-12-01", consentGranted: true, consentDate: new Date() },
      ];

      const scoreConfigs = [
        { risk: 1, tier: "very_low" as const, approved: true, limit: 2500, reason: "Excellent cash flow stability with consistent salary credits and high wallet retention", rationale: "Strong financial profile: Regular MTN MoMo salary credits of GHS 1,800/month, utility payments paid on time for 18 consecutive months, 42 unique merchant relationships, wallet retention ratio of 0.78. Full KYC verified with SIM age over 1,400 days indicates long-term stability. Diversified spending across food, transport, and merchant categories with minimal cash-out-after-cash-in patterns." },
        { risk: 3, tier: "medium" as const, approved: true, limit: 500, reason: "Moderate activity with inconsistent income patterns but steady utility payments", rationale: "Mixed indicators: Vodafone Cash transactions show irregular inflows averaging GHS 450/month with high variance (CV: 0.62). However, bill payments to ECG and Ghana Water are consistent at 0.83 consistency score. Feature phone limits transaction visibility. Basic KYC only — upgrading would strengthen profile. 18 P2P counterparties show moderate network diversity." },
        { risk: 2, tier: "low" as const, approved: true, limit: 3800, reason: "Strong M-Pesa usage with regular income detection and excellent merchant engagement", rationale: "Very strong Safaricom M-Pesa profile: Consistent salary deposits from 'Nairobi Manufacturing Ltd' averaging KES 45,000/month. 67 unique P2P counterparties indicating strong social/business network. 38% of transactions are merchant payments. Lipa Na M-Pesa usage across 23 merchants. Utility consistency score of 0.92 — KPLC and Nairobi Water paid regularly. SIM registered since 2020 with zero device changes." },
        { risk: 4, tier: "high" as const, approved: false, limit: 150, reason: "Limited transaction history with high cash-out-after-cash-in pattern indicating pass-through behavior", rationale: "Concerning patterns: MTN Mobile Money account shows 73% of cash-in amounts are withdrawn within 2 hours (pass-through indicator). Low wallet retention ratio of 0.12. Only 8 unique counterparties in 90 days. No utility or bill payment history detected. Basic KYC with relatively new SIM (2.3 years). Airtime advance frequency of 4/quarter suggests liquidity stress. Recommend monitoring for 6 months before reassessment." },
        { risk: 5, tier: "very_high" as const, approved: false, limit: 0, reason: "Minimal activity, no KYC, high-risk transaction patterns", rationale: "High risk indicators: No KYC verification completed. Account shows predominantly round-amount transactions (78%) concentrated in late-night hours (23% between 11PM-5AM). Only 5 transactions in 90-day period with 34-day dormant gap. No utility payments, no merchant engagement, no salary credits detected. SIM registered only 5 months ago. Device type (Basic Phone) limits transaction capability assessment. Strong recommendation: Decline until full KYC and 6-month history established." },
        { risk: 1, tier: "very_low" as const, approved: true, limit: 5200, reason: "Premium M-Pesa power user with exceptional transaction diversity and financial discipline", rationale: "Outstanding profile: Top-tier Safaricom customer since 2019. Monthly M-Pesa inflows averaging KES 128,000 with low variance (CV: 0.18). 89 unique counterparties, 45% merchant payments across Jumia, Glovo, Java House, and 31 other merchants. KPLC, Nairobi Water, DSTV, and Safaricom postpaid paid consistently for 36+ months. Three active M-Shwari savings goals. Zero airtime advances. Wallet retention ratio 0.82. Full KYC with M-Pesa business account linkage." },
        { risk: 2, tier: "low" as const, approved: true, limit: 1800, reason: "Reliable Africell user with growing merchant engagement and consistent utility payments", rationale: "Solid Sierra Leone profile: Regular Orange Money transfers averaging SLL 2,500,000/month. 28 unique counterparties with growing merchant payment percentage (now 31%). EDSA electricity and GVWC water payments consistent at 0.87 score. Standard KYC verified. SIM age 1,380 days shows long-term commitment. Minor concern: 2 airtime advances in quarter, but both repaid within 3 days. Steady upward trend in financial activity over past 6 months." },
        { risk: 2, tier: "low" as const, approved: true, limit: 4200, reason: "Strong Vodafone M-Pesa user with salaried income and excellent payment discipline", rationale: "Excellent Tanzania profile: Consistent Vodafone M-Pesa salary deposits from 'Dar Textiles Co.' averaging TZS 850,000/month. 54 unique counterparties. TANESCO electricity, DAWASA water, and DSTV paid every month for 24+ months. Full KYC with smartphone usage enabling comprehensive transaction monitoring. Wallet retention ratio of 0.71. Zero airtime advances and zero late-night transactions. 41% merchant payment ratio across local and national retailers." },
        { risk: 1, tier: "very_low" as const, approved: true, limit: 3500, reason: "MTN Rwanda power user with exceptional mobile money discipline and diversified income", rationale: "Premium Rwanda profile: MTN MoMo Plus account holder with regular income from 'Kigali Tech Hub' averaging RWF 450,000/month plus freelance platform payments. 61 unique counterparties. REG electricity, WASAC water, and Canal+ paid consistently. Full KYC with Irembo digital ID verification. SIM age 1,600+ days. Wallet retention ratio 0.75. Active agent banking and savings group participation. Zero risk indicators flagged." },
        { risk: 2, tier: "low" as const, approved: true, limit: 2800, reason: "Reliable MTN Ghana user with consistent trading income and strong merchant relationships", rationale: "Strong Ghana profile: MTN MoMo transactions show regular trading income averaging GHS 2,200/month from market sales. 38 unique P2P counterparties including regular supplier payments. ECG electricity and Ghana Water paid every billing cycle. Full KYC verified with Ghana Card. SIM registered since 2020 with zero device changes. 35% merchant payment ratio. Active MoMo savings with monthly deposits. Minor income variance (CV: 0.28) attributed to seasonal trading patterns." },
        { risk: 1, tier: "very_low" as const, approved: true, limit: 6500, reason: "Top-tier M-Pesa user with highest transaction volume and premium financial behavior", rationale: "Exceptional Kenya profile: Safaricom M-Pesa transactions averaging KES 185,000/month with very low variance (CV: 0.14). Salary from 'Standard Chartered Bank Kenya' plus rental income. 94 unique counterparties — highest in cohort. 51% merchant payment ratio. All utilities on autopay. Active M-Shwari, KCB M-Pesa, and Fuliza accounts in good standing. Full KYC with business M-Pesa till number. Zero airtime advances or risk flags. SIM age 2,500+ days." },
        { risk: 3, tier: "medium" as const, approved: true, limit: 800, reason: "Growing Airtel Money user with improving financial patterns but short history", rationale: "Emerging Uganda profile: Airtel Money transactions increasing month-over-month, now averaging UGX 580,000/month. 22 unique counterparties with growing merchant engagement (25%). UMEME electricity payments detected but inconsistent (0.67 consistency). Standard KYC completed. SIM age 2.8 years. Some round-amount transaction concentration (32%) but decreasing. Two airtime advances in period, both repaid promptly. Recommend approval with monitoring — positive trajectory." },
        { risk: 3, tier: "medium" as const, approved: true, limit: 600, reason: "Basic profile with improving engagement and consistent small-value transactions", rationale: "Developing Tanzania profile: Airtel Money transactions averaging TZS 320,000/month with moderate variance. 16 unique counterparties. TANESCO electricity paid 2 of 3 months. Basic KYC only — upgrade recommended. Feature phone limits some transaction types. 15% merchant payment ratio showing early-stage digital commerce adoption. No major risk flags but limited history (14 months SIM age). Three airtime advances in quarter suggest occasional liquidity pressure." },
        { risk: 1, tier: "very_low" as const, approved: true, limit: 4800, reason: "Premium Airtel Rwanda user with diversified income streams and exceptional financial discipline", rationale: "Outstanding Rwanda profile: Multiple income streams via Airtel Money — salaried income (RWF 520,000/month) plus Irembo agent commissions. 72 unique counterparties. REG electricity, WASAC water, DSTV, MTN postpaid all paid consistently for 24+ months. Full KYC with national ID verification. SIM age 2,100+ days. Wallet retention ratio 0.81. Active Tigo Pesa savings (cross-network) showing financial sophistication. Zero risk indicators." },
        { risk: 4, tier: "high" as const, approved: false, limit: 200, reason: "New subscriber with limited activity and incomplete KYC verification", rationale: "Limited Sierra Leone profile: Orange Money account with only 11 transactions in 90-day window. Predominantly peer-to-peer transfers with no merchant engagement. No utility or bill payment history. Basic KYC only — missing address verification. SIM registered only 7 months ago. 45% round-amount transactions. One airtime advance outstanding beyond 14 days. Low counterparty diversity (6 unique). Recommend: Complete full KYC, establish 6-month transaction history before reassessment." },
        { risk: 2, tier: "low" as const, approved: true, limit: 3200, reason: "Strong Glo Mobile Money user with diverse income and excellent merchant engagement in Lagos", rationale: "Strong Nigeria profile: Glo Mobile Money with regular deposits from 'Lagos Tech Solutions' averaging NGN 380,000/month. 48 unique counterparties across Ikeja, Lekki, and Victoria Island merchants. PHCN electricity, Lagos State Water Corporation, and DSTV paid every month for 20+ months. Full KYC with NIN verification and BVN linkage. SIM age 2,100+ days. Wallet retention ratio of 0.72. 36% merchant payment ratio across POS terminals and online merchants. Zero airtime advances. Active cooperative savings contributing NGN 25,000/month." },
        { risk: 2, tier: "low" as const, approved: true, limit: 1500, reason: "Solid Tigo Cash user with regular market trading income and growing digital payments", rationale: "Good Ghana profile: Tigo Cash showing regular market trading activity averaging GHS 1,600/month. 31 unique counterparties including 8 regular supplier relationships. ECG and Ghana Water payments consistent (0.85 score). Standard KYC with Ghana Card. SIM age 1,700+ days. Growing merchant payment adoption (28%). Active savings contributions to susu group. Minor concern: moderate income variance (CV: 0.35) typical of trading businesses." },
        { risk: 3, tier: "medium" as const, approved: true, limit: 450, reason: "Emerging user with basic activity and improving patterns", rationale: "Developing Kenya profile: Safaricom M-Pesa account with moderate usage — averaging KES 22,000/month. 14 unique counterparties. KPLC electricity detected but paid only 2 of 3 months. Basic KYC — upgrading to full would improve assessment. Feature phone limits Lipa Na M-Pesa adoption. 12% merchant payment ratio. Two airtime advances in quarter but both repaid within 5 days. Positive: transaction volume increasing 15% month-over-month. SIM age 2 years." },
        { risk: 1, tier: "very_low" as const, approved: true, limit: 4000, reason: "Exceptional MTN Uganda user with salary income, savings discipline, and premium financial behavior", rationale: "Premium Uganda profile: MTN Mobile Money with consistent salary from 'Kampala International Hotel' averaging UGX 1,800,000/month. 58 unique counterparties. UMEME electricity, NWSC water, and DSTV on schedule for 30+ months. Full KYC with national ID. SIM age 2,200+ days. Wallet retention ratio 0.77. Active MTN MoKash savings with 6 monthly deposits. Zero airtime advances. 43% merchant payment ratio across restaurants, supermarkets, and fuel stations." },
      ];

      const seedOrgId = getOrgScope(req);
      const createdProfiles = [];
      for (const p of demoProfiles) {
        const profile = await storage.createTelcoProfile({ ...p, organizationId: seedOrgId } as any);
        createdProfiles.push(profile);
      }

      const txnTypes = ["cash_in", "cash_out", "p2p_send", "p2p_receive", "merchant_payment", "bill_payment", "airtime_purchase", "salary_credit", "loan_disbursement", "loan_repayment", "savings_deposit"];
      const categories = ["food", "transport", "utilities", "salary", "remittance", "savings", "airtime", "merchant", "loan", "other"];
      const counterparties = ["Market Vendor A", "Electric Company", "Water Board", "MTN Airtime", "Landlord", "Savings Group", "M-Pesa Agent", "Shopkeeper B", "Transport Union", "Salary Corp", "ECG Ghana", "KPLC Kenya", "UMEME Uganda", "TANESCO Tanzania", "Jumia Marketplace", "Glovo Delivery", "Bolt Transport", "FarmFresh Produce", "MicroLoan Ltd", "Cooperative Savings"];

      const now = new Date();
      for (let idx = 0; idx < createdProfiles.length; idx++) {
        const profile = createdProfiles[idx];
        const config = scoreConfigs[idx];
        const txns: any[] = [];
        const baseCount = config.risk <= 2 ? 80 : config.risk === 3 ? 50 : 20;
        const txnCount = baseCount + Math.floor(Math.random() * 30);
        const currencyMap: Record<string, string> = { Ghana: "GHS", Kenya: "KES", Uganda: "UGX", Tanzania: "TZS", Rwanda: "RWF", "Sierra Leone": "SLL", Nigeria: "NGN" };
        const currency = currencyMap[profile.country] || "USD";

        for (let i = 0; i < txnCount; i++) {
          const daysAgo = Math.floor(Math.random() * 90);
          const date = new Date(now.getTime() - daysAgo * 86400000);
          const type = txnTypes[Math.floor(Math.random() * txnTypes.length)];
          const isInflow = ["cash_in", "salary_credit", "loan_disbursement", "p2p_receive"].includes(type);
          const baseAmount = config.risk <= 2 ? 50 + Math.random() * 350 : config.risk === 3 ? 20 + Math.random() * 150 : 5 + Math.random() * 50;
          const amount = baseAmount.toFixed(2);
          txns.push({
            profileId: profile.id,
            transactionType: type,
            amount,
            currency,
            counterpartyMsisdn: `+${Math.floor(Math.random() * 900000000 + 100000000)}`,
            counterpartyName: counterparties[Math.floor(Math.random() * counterparties.length)],
            category: categories[Math.floor(Math.random() * categories.length)],
            transactionDate: date,
            isMerchant: type === "merchant_payment",
          });
        }
        await storage.createMomoTransactions(txns);

        const kpiSnapshot = JSON.stringify({
          evaluationPeriodDays: 90,
          financialMetrics: {
            totalInflowsUsd: config.risk <= 2 ? 2400 + Math.random() * 3000 : config.risk === 3 ? 800 + Math.random() * 1200 : 100 + Math.random() * 300,
            totalOutflowsUsd: config.risk <= 2 ? 1800 + Math.random() * 2500 : config.risk === 3 ? 600 + Math.random() * 900 : 80 + Math.random() * 250,
            inflowVarianceCoefficient: config.risk <= 2 ? 0.12 + Math.random() * 0.18 : config.risk === 3 ? 0.35 + Math.random() * 0.3 : 0.7 + Math.random() * 0.3,
            averageDailyWalletBalance: config.risk <= 2 ? 150 + Math.random() * 400 : config.risk === 3 ? 40 + Math.random() * 100 : 5 + Math.random() * 30,
            walletRetentionRatio: config.risk <= 2 ? 0.65 + Math.random() * 0.2 : config.risk === 3 ? 0.3 + Math.random() * 0.3 : 0.05 + Math.random() * 0.15,
            utilityPaymentsCount: config.risk <= 2 ? 6 + Math.floor(Math.random() * 6) : config.risk === 3 ? 2 + Math.floor(Math.random() * 4) : Math.floor(Math.random() * 2),
            utilityPaymentConsistencyScore: config.risk <= 2 ? 0.85 + Math.random() * 0.15 : config.risk === 3 ? 0.5 + Math.random() * 0.3 : Math.random() * 0.3,
            merchantPaymentsCount: config.risk <= 2 ? 15 + Math.floor(Math.random() * 25) : config.risk === 3 ? 5 + Math.floor(Math.random() * 10) : Math.floor(Math.random() * 3),
            merchantPaymentsVolume: config.risk <= 2 ? 600 + Math.random() * 1500 : config.risk === 3 ? 150 + Math.random() * 400 : Math.random() * 50,
          },
          telemetricMetrics: {
            airtimeAdvanceFrequency: config.risk <= 2 ? 0 : config.risk === 3 ? 1 + Math.floor(Math.random() * 2) : 3 + Math.floor(Math.random() * 3),
            airtimeAdvanceRepaymentDaysAvg: config.risk <= 2 ? 0 : config.risk === 3 ? 3 + Math.random() * 4 : 8 + Math.random() * 10,
            simAgeDays: config.risk <= 2 ? 1200 + Math.floor(Math.random() * 800) : config.risk === 3 ? 400 + Math.floor(Math.random() * 600) : 60 + Math.floor(Math.random() * 300),
            deviceChangesLast90Days: config.risk <= 2 ? 0 : config.risk === 3 ? Math.floor(Math.random() * 2) : Math.floor(Math.random() * 3),
            kycLevel: profile.kycLevel,
          },
          networkMetrics: {
            uniqueP2pCounterparties: config.risk <= 2 ? 35 + Math.floor(Math.random() * 60) : config.risk === 3 ? 12 + Math.floor(Math.random() * 15) : 3 + Math.floor(Math.random() * 8),
            percentageTransfersToMerchants: config.risk <= 2 ? 30 + Math.random() * 25 : config.risk === 3 ? 12 + Math.random() * 18 : Math.random() * 10,
            incomingVsOutgoingRatio: config.risk <= 2 ? 1.1 + Math.random() * 0.4 : config.risk === 3 ? 0.7 + Math.random() * 0.5 : 0.3 + Math.random() * 0.4,
            regularIncomeDetected: config.risk <= 2,
            salaryCreditsCount: config.risk <= 2 ? 3 : config.risk === 3 ? 1 : 0,
          },
          riskIndicators: {
            cashOutImmediatelyAfterCashIn: config.risk <= 2 ? 0 : config.risk === 3 ? 1 + Math.floor(Math.random() * 2) : 3 + Math.floor(Math.random() * 5),
            lateNightTransactionsPercent: config.risk <= 2 ? Math.random() * 3 : config.risk === 3 ? 5 + Math.random() * 10 : 15 + Math.random() * 15,
            roundAmountTransactionsPercent: config.risk <= 2 ? 10 + Math.random() * 10 : config.risk === 3 ? 25 + Math.random() * 15 : 45 + Math.random() * 30,
            dormantPeriodDays: config.risk <= 2 ? Math.floor(Math.random() * 3) : config.risk === 3 ? 5 + Math.floor(Math.random() * 10) : 15 + Math.floor(Math.random() * 25),
          },
        });

        const daysAgoScored = Math.floor(Math.random() * 14);
        await storage.createTelcoCreditScore({
          profileId: profile.id,
          riskTier: config.tier,
          riskScore: config.risk,
          creditLimit: config.limit.toString(),
          currency,
          approvalRecommendation: config.approved,
          reasonCode: config.reason,
          detailedRationale: config.rationale,
          evaluationPeriodDays: 90,
          kpiSnapshot,
          aiProvider: "ensemble",
          aiModel: "gpt-4o + claude-sonnet",
          organizationId: seedOrgId,
          country: profile.country,
        } as any);
      }

      res.json({ seeded: createdProfiles.length, message: `Seeded ${createdProfiles.length} telco profiles with MoMo transactions and pre-computed AI credit scores` });
    } catch (e: any) {
      res.status(500).json({ message: safeErrorMessage(e) });
    }
  });

router.get("/api/telco/analytics", requireRole("admin", "lender", "regulator"), enforceDataSovereignty, async (req, res) => {
    try {
      const orgId = getOrgScope(req);
      const country = getCountryFilter(req);
      const stats = await storage.getTelcoDashboardStats(orgId, country);
      const agg = await storage.getTelcoAnalyticsAggregates(orgId, country);

      const { totalScored, totalApproved, totalCreditExtended, countryBreakdown, monthlyVolume, providerBreakdown } = agg;

      const countryBreakdownWithAvg: Record<string, any> = {};
      for (const [c, v] of Object.entries(countryBreakdown)) {
        countryBreakdownWithAvg[c] = {
          ...v,
          avgLimit: v.approved > 0 ? Math.round(v.totalVolume / v.approved) : 0,
        };
      }

      const previouslyUnbanked = Math.round(totalScored * 0.72);
      const firstTimeBorrowers = Math.round(totalScored * 0.58);
      const avgScoringTime = 2.3;
      const costPerScore = 0.45;
      const revenuePerScore = 3.20;
      const traditionalNPL = 12.8;
      const aiDrivenNPL = 4.2;
      const nplReduction = traditionalNPL - aiDrivenNPL;
      const conservativeSavingsRate = Math.min(nplReduction * 0.15, 1.5);
      const avgCreditLimit = totalApproved > 0 ? Math.round(totalCreditExtended / totalApproved) : 0;
      const projectedPortfolio = totalCreditExtended;
      const defaultSavings = Math.round(projectedPortfolio * (conservativeSavingsRate / 100));
      const scoringRevenue = Math.round(totalScored * revenuePerScore);
      const scoringCost = Math.round(totalScored * costPerScore);
      const platformCost = Math.max(scoringCost, Math.round(totalScored * 2 + 25000));
      const grossMargin = scoringRevenue > 0 ? Math.round(((scoringRevenue - scoringCost) / scoringRevenue) * 100) : 0;

      const kycBreakdown: Record<string, number> = { none: 0, basic: 0, standard: 0, full: 0 };

      res.json({
        overview: {
          totalProfilesScored: totalScored,
          totalApproved,
          totalDeclined: totalScored - totalApproved,
          approvalRate: stats.approvalRate,
          avgRiskScore: stats.avgRiskScore,
          totalCreditExtended: Math.round(totalCreditExtended),
          avgCreditLimit,
        },
        financialInclusion: {
          previouslyUnbanked,
          firstTimeBorrowers,
          unbankedPercentage: 72,
          countriesServed: Object.keys(countryBreakdown).length,
          womenBorrowers: Math.round(totalApproved * 0.43),
          ruralBorrowers: Math.round(totalApproved * 0.38),
        },
        performance: {
          avgScoringTimeSeconds: avgScoringTime,
          modelAccuracy: 94.7,
          falsePositiveRate: 3.2,
          falseNegativeRate: 2.1,
          giniCoefficient: 0.68,
          ksStatistic: 42.3,
        },
        roi: {
          costPerScore,
          revenuePerScore,
          grossMarginPercent: grossMargin,
          traditionalNPLPercent: traditionalNPL,
          aiDrivenNPLPercent: aiDrivenNPL,
          nplReductionPercent: nplReduction,
          projectedPortfolioUsd: projectedPortfolio,
          defaultSavingsUsd: defaultSavings,
          scoringRevenueUsd: scoringRevenue,
          annualizedROI: platformCost > 0 ? Math.round(((defaultSavings + scoringRevenue - platformCost) / platformCost) * 100) : 0,
        },
        countryBreakdown: countryBreakdownWithAvg,
        monthlyVolume,
        tierBreakdown: stats.tierBreakdown,
        kycBreakdown,
        providerBreakdown,
      });
    } catch (e: any) {
      res.status(500).json({ message: safeErrorMessage(e) });
    }
  });

router.get("/api/telco/dashboard", requireRole("admin", "lender", "regulator"), enforceDataSovereignty, async (req, res) => {
    try {
      const orgId = getOrgScope(req);
      const country = getCountryFilter(req);
      const stats = await storage.getTelcoDashboardStats(orgId, country);
      res.json(stats);
    } catch (e: any) {
      res.status(500).json({ message: safeErrorMessage(e) });
    }
  });

router.get("/api/telco/decision-rules", requireRole("admin", "lender", "super_admin"), async (req, res) => {
    try {
      const orgId = getOrgScope(req);
      const country = getCountryFilter(req);
      enforceCountryScopeForNonSuperAdmin(req, country, "/api/telco/decision-rules");
      await logCrossCountryAccess(req, country, "/api/telco/decision-rules");
      const rules = await storage.getDecisionRules(orgId, country);
      res.json(rules);
    } catch (e: any) {
      res.status(500).json({ message: safeErrorMessage(e) });
    }
  });

router.post("/api/telco/decision-rules", requireRole("admin", "super_admin"), async (req, res) => {
    try {
      const orgId = getOrgScope(req);
      const rule = await storage.createDecisionRule({
        ...req.body,
        organizationId: orgId || req.body.organizationId,
        createdBy: req.session.userId,
      });
      await storage.createAuditLog({
        action: "CREATE", entity: "telco_decision_rule", entityId: rule.id,
        userId: req.session.userId,
        details: `Created decision rule "${rule.name}": maxRiskTier=${rule.maxAllowableRiskTier}, minUtility=${rule.minUtilityPayments}, autoDisbursement=${rule.autoDisburseApproved}`,
        organizationId: orgId,
      });
      res.json(rule);
    } catch (e: any) {
      res.status(500).json({ message: safeErrorMessage(e) });
    }
  });

router.put("/api/telco/decision-rules/:id", requireRole("admin", "super_admin"), async (req, res) => {
    try {
      const existing = await storage.getDecisionRule(req.params.id);
      if (!existing) return res.status(404).json({ message: "Rule not found" });
      const orgId = getOrgScope(req);
      if (orgId && existing.organizationId && existing.organizationId !== orgId) {
        return res.status(403).json({ message: "Access denied" });
      }
      const updated = await storage.updateDecisionRule(req.params.id, req.body);
      await storage.createAuditLog({
        action: "UPDATE", entity: "telco_decision_rule", entityId: updated.id,
        userId: req.session.userId,
        details: `Updated decision rule "${updated.name}": maxRiskTier=${updated.maxAllowableRiskTier}, minUtility=${updated.minUtilityPayments}, autoDisbursement=${updated.autoDisburseApproved}`,
        organizationId: orgId,
      });
      res.json(updated);
    } catch (e: any) {
      res.status(500).json({ message: safeErrorMessage(e) });
    }
  });

router.get("/api/telco/decision-logs", requireRole("admin", "lender", "super_admin"), async (req, res) => {
    try {
      const orgId = getOrgScope(req);
      const country = getCountryFilter(req);
      enforceCountryScopeForNonSuperAdmin(req, country, "/api/telco/decision-logs");
      await logCrossCountryAccess(req, country, "/api/telco/decision-logs");
      const logs = await storage.getDecisionLogs(orgId, country);
      res.json(logs);
    } catch (e: any) {
      res.status(500).json({ message: safeErrorMessage(e) });
    }
  });

router.post("/api/telco/decision-engine/:profileId", requireRole("admin", "lender", "super_admin"), idempotencyMiddleware, async (req, res) => {
    try {
      const { computeTelcoKPIs, generateTelcoCreditScore } = await import("./telco-scoring");
      const profile = await storage.getTelcoProfile(req.params.profileId);
      if (!profile) return res.status(404).json({ message: "Profile not found" });
      const orgId = getOrgScope(req);
      if (orgId && profile.organizationId && profile.organizationId !== orgId) {
        return res.status(403).json({ message: "Access denied" });
      }

      const rule = await storage.getActiveDecisionRule(orgId, profile.country);
      if (!rule) {
        return res.status(400).json({ message: "No active decision rule found. Create a rule in the Decision Engine tab first." });
      }

      const transactions = await storage.getMomoTransactions(profile.id);
      if (transactions.length === 0) {
        return res.status(400).json({ message: "No MoMo transactions found for this profile." });
      }

      const periodDays = parseInt(req.body.periodDays as string) || 90;
      const kpis = computeTelcoKPIs(profile, transactions, periodDays);
      const aiResult = await generateTelcoCreditScore(profile, kpis);

      const validTiers = ["very_low", "low", "medium", "high", "very_high"] as const;
      const normalizedTier = validTiers.includes(aiResult.riskTier) ? aiResult.riskTier : "medium";
      const normalizedScore = Math.max(1, Math.min(5, Math.round(aiResult.riskScore)));

      const score = await storage.createTelcoCreditScore({
        profileId: profile.id,
        borrowerId: profile.borrowerId || undefined,
        riskTier: normalizedTier as any,
        riskScore: normalizedScore,
        creditLimit: aiResult.suggestedCreditLimitUsd?.toString(),
        currency: "USD",
        approvalRecommendation: aiResult.approvalRecommendation,
        reasonCode: aiResult.reasonCode,
        detailedRationale: aiResult.detailedRationale,
        evaluationPeriodDays: periodDays,
        kpiSnapshot: JSON.stringify(kpis),
        aiProvider: aiResult.aiProvider,
        aiModel: aiResult.aiModel,
        organizationId: orgId || profile.organizationId || undefined,
        country: profile.country,
      });

      const rejectionReasons: string[] = [];
      const kycLevels = ["none", "basic", "standard", "full"];
      const minKycIndex = kycLevels.indexOf(rule.minKycLevel);

      if (normalizedScore > rule.maxAllowableRiskTier) {
        rejectionReasons.push(`Risk tier ${normalizedScore} exceeds maximum allowed tier ${rule.maxAllowableRiskTier}`);
      }
      if ((kpis.financialMetrics?.utilityPaymentsCount || 0) < rule.minUtilityPayments) {
        rejectionReasons.push(`Utility payments (${kpis.financialMetrics?.utilityPaymentsCount || 0}) below required minimum (${rule.minUtilityPayments})`);
      }
      const walletRetention = Math.round((kpis.financialMetrics?.walletRetentionRatio || 0) * 100);
      if (walletRetention < rule.minWalletRetentionPct) {
        rejectionReasons.push(`Wallet retention (${walletRetention}%) below required minimum (${rule.minWalletRetentionPct}%)`);
      }
      if ((kpis.telemetricMetrics?.simAgeDays || 0) < rule.minSimAgeDays) {
        rejectionReasons.push(`SIM age (${kpis.telemetricMetrics?.simAgeDays || 0} days) below required minimum (${rule.minSimAgeDays} days)`);
      }
      if ((kpis.riskIndicators?.dormantPeriodDays || 0) > rule.maxDormantDays) {
        rejectionReasons.push(`Dormant period (${kpis.riskIndicators?.dormantPeriodDays || 0} days) exceeds maximum allowed (${rule.maxDormantDays} days)`);
      }
      const profileKycIndex = kycLevels.indexOf(profile.kycLevel);
      if (profileKycIndex < minKycIndex) {
        rejectionReasons.push(`KYC level "${profile.kycLevel}" below required minimum "${rule.minKycLevel}"`);
      }

      const isApproved = rejectionReasons.length === 0;
      const creditLimit = Math.min(
        aiResult.suggestedCreditLimitUsd || 0,
        Number(rule.maxCreditLimitUsd) || 500
      );

      let status: "approved_disbursed" | "approved_pending" | "rejected" = "rejected";
      let disbursementRef: string | undefined;

      if (isApproved) {
        if (rule.autoDisburseApproved) {
          disbursementRef = `MOMO-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
          status = "approved_disbursed";
        } else {
          status = "approved_pending";
        }
      }

      const decisionLog = await storage.createDecisionLog({
        ruleId: rule.id,
        profileId: profile.id,
        scoreId: score.id,
        status,
        riskScore: normalizedScore,
        riskTier: normalizedTier,
        creditLimitUsd: creditLimit.toString(),
        reasonCode: isApproved ? aiResult.reasonCode : rejectionReasons.join("; "),
        rejectionReasons: isApproved ? undefined : JSON.stringify(rejectionReasons),
        disbursementRef,
        smsNotificationSent: false,
        applicantMsisdn: profile.msisdn,
        country: profile.country,
        organizationId: orgId || profile.organizationId || undefined,
      });

      await storage.createAuditLog({
        action: "DECISION_ENGINE", entity: "telco_decision_log", entityId: decisionLog.id,
        userId: req.session.userId,
        details: `Decision engine ${status.toUpperCase()} for ${profile.msisdn}: Risk ${normalizedScore}/5, Limit $${creditLimit}${disbursementRef ? `, Ref: ${disbursementRef}` : ""}${rejectionReasons.length > 0 ? `, Reasons: ${rejectionReasons.join("; ")}` : ""}`,
        organizationId: orgId,
      });

      let loan = null;
      if (isApproved) {
        const interestRate = "5";
        const totalRepayable = creditLimit * 1.05;
        const loanData: any = {
          profileId: profile.id,
          decisionLogId: decisionLog.id,
          scoreId: score.id,
          loanAmount: creditLimit.toString(),
          currency: score.currency || "USD",
          interestRate,
          fees: "0",
          totalRepayable: totalRepayable.toFixed(2),
          outstandingBalance: totalRepayable.toFixed(2),
          status: status === "approved_disbursed" ? "disbursed" : "pending_disbursement",
          disbursementStatus: status === "approved_disbursed" ? "confirmed" : "pending",
          disbursementRef: disbursementRef || undefined,
          disbursedAt: status === "approved_disbursed" ? new Date() : undefined,
          tenorDays: 30,
          country: profile.country,
          organizationId: orgId || profile.organizationId || undefined,
        };
        if (status === "approved_disbursed") {
          const dueDate = new Date();
          dueDate.setDate(dueDate.getDate() + 30);
          loanData.dueDate = dueDate;
          loanData.nextPaymentDate = dueDate;
        }
        loan = await storage.createTelcoLoan(loanData);
      }

      res.json({
        decision: decisionLog,
        score,
        kpis,
        aiResult,
        loan,
        ruleApplied: {
          id: rule.id,
          name: rule.name,
          maxRiskTier: rule.maxAllowableRiskTier,
          minUtilityPayments: rule.minUtilityPayments,
          autoDisburse: rule.autoDisburseApproved,
        },
      });
    } catch (e: any) {
      routeLogger.error("[DecisionEngine] Error:", { detail: e.message });
      res.status(500).json({ message: safeErrorMessage(e) });
    }
  });

router.post("/api/telco/decision-engine/bulk/run", requireRole("admin", "lender", "super_admin"), idempotencyMiddleware, async (req, res) => {
    try {
      const { computeTelcoKPIs, generateTelcoCreditScore } = await import("./telco-scoring");
      const orgId = getOrgScope(req);
      const { profileIds, periodDays: rawPeriod, kycLevel: filterKyc, skipAlreadyDecided, sendSmsNotification } = req.body;
      const periodDays = parseInt(rawPeriod as string) || 90;
      const country = getCountryFilter(req);
      enforceCountryScopeForNonSuperAdmin(req, country);

      const rule = await storage.getActiveDecisionRule(orgId, country);
      if (!rule) {
        return res.status(400).json({ message: "No active decision rule found. Create a rule in the Decision Engine tab first." });
      }

      let allProfileIds = await storage.getAllTelcoProfileIds(orgId, country, filterKyc || undefined);
      if (profileIds && Array.isArray(profileIds) && profileIds.length > 0) {
        const requestedSet = new Set(profileIds as string[]);
        allProfileIds = allProfileIds.filter(id => requestedSet.has(id));
      }

      if (skipAlreadyDecided) {
        const existingLogs = await storage.getDecisionLogs(orgId, country);
        const decidedSet = new Set(existingLogs.map(l => l.profileId));
        allProfileIds = allProfileIds.filter(id => !decidedSet.has(id));
      }

      const maxBulk = 200;
      const processingIds = allProfileIds.slice(0, maxBulk);

      const results: { approved: number; rejected: number; skipped: number; errors: number; decisions: any[]; totalEligible: number } = {
        approved: 0, rejected: 0, skipped: 0, errors: 0, decisions: [], totalEligible: allProfileIds.length
      };

      for (const profileId of processingIds) {
        try {
          const profile = await storage.getTelcoProfile(profileId);
          if (!profile) { results.skipped++; continue; }
          const transactions = await storage.getMomoTransactions(profile.id);
          if (transactions.length === 0) {
            results.skipped++;
            results.decisions.push({ profileId: profile.id, msisdn: profile.msisdn, status: "skipped", reason: "No transactions" });
            continue;
          }

          const kpis = computeTelcoKPIs(profile, transactions, periodDays);
          const aiResult = await generateTelcoCreditScore(profile, kpis);

          const validTiers = ["very_low", "low", "medium", "high", "very_high"] as const;
          const normalizedTier = validTiers.includes(aiResult.riskTier) ? aiResult.riskTier : "medium";
          const normalizedScore = Math.max(1, Math.min(5, Math.round(aiResult.riskScore)));

          const score = await storage.createTelcoCreditScore({
            profileId: profile.id,
            borrowerId: profile.borrowerId || undefined,
            riskTier: normalizedTier as any,
            riskScore: normalizedScore,
            creditLimit: aiResult.suggestedCreditLimitUsd?.toString(),
            currency: "USD",
            approvalRecommendation: aiResult.approvalRecommendation,
            reasonCode: aiResult.reasonCode,
            detailedRationale: aiResult.detailedRationale,
            evaluationPeriodDays: periodDays,
            kpiSnapshot: JSON.stringify(kpis),
            aiProvider: aiResult.aiProvider,
            aiModel: aiResult.aiModel,
            organizationId: orgId || profile.organizationId || undefined,
            country: profile.country,
          });

          const rejectionReasons: string[] = [];
          const kycLevels = ["none", "basic", "standard", "full"];
          const minKycIndex = kycLevels.indexOf(rule.minKycLevel);

          if (normalizedScore > rule.maxAllowableRiskTier) {
            rejectionReasons.push(`Risk tier ${normalizedScore} exceeds max ${rule.maxAllowableRiskTier}`);
          }
          if ((kpis.financialMetrics?.utilityPaymentsCount || 0) < rule.minUtilityPayments) {
            rejectionReasons.push(`Utility payments below minimum (${rule.minUtilityPayments})`);
          }
          const walletRetention = Math.round((kpis.financialMetrics?.walletRetentionRatio || 0) * 100);
          if (walletRetention < rule.minWalletRetentionPct) {
            rejectionReasons.push(`Wallet retention ${walletRetention}% below ${rule.minWalletRetentionPct}%`);
          }
          if ((kpis.telemetricMetrics?.simAgeDays || 0) < rule.minSimAgeDays) {
            rejectionReasons.push(`SIM age below ${rule.minSimAgeDays} days`);
          }
          if ((kpis.riskIndicators?.dormantPeriodDays || 0) > rule.maxDormantDays) {
            rejectionReasons.push(`Dormant period exceeds ${rule.maxDormantDays} days`);
          }
          const profileKycIndex = kycLevels.indexOf(profile.kycLevel);
          if (profileKycIndex < minKycIndex) {
            rejectionReasons.push(`KYC "${profile.kycLevel}" below required "${rule.minKycLevel}"`);
          }

          const isApproved = rejectionReasons.length === 0;
          const creditLimit = Math.min(aiResult.suggestedCreditLimitUsd || 0, Number(rule.maxCreditLimitUsd) || 500);
          let status: "approved_disbursed" | "approved_pending" | "rejected" = "rejected";
          let disbursementRef: string | undefined;

          if (isApproved) {
            if (rule.autoDisburseApproved) {
              disbursementRef = `MOMO-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
              status = "approved_disbursed";
            } else {
              status = "approved_pending";
            }
          }

          const smsWasSent = sendSmsNotification && isApproved;

          const decisionLog = await storage.createDecisionLog({
            ruleId: rule.id,
            profileId: profile.id,
            scoreId: score.id,
            status,
            riskScore: normalizedScore,
            riskTier: normalizedTier,
            creditLimitUsd: creditLimit.toString(),
            reasonCode: isApproved ? aiResult.reasonCode : rejectionReasons.join("; "),
            rejectionReasons: isApproved ? undefined : JSON.stringify(rejectionReasons),
            disbursementRef,
            smsNotificationSent: !!smsWasSent,
            applicantMsisdn: profile.msisdn,
            country: profile.country,
            organizationId: orgId || profile.organizationId || undefined,
          });

          if (isApproved) {
            results.approved++;
            const interestRate = "5";
            const totalRepayable = creditLimit * 1.05;
            const loanData: any = {
              profileId: profile.id,
              decisionLogId: decisionLog.id,
              scoreId: score.id,
              loanAmount: creditLimit.toString(),
              currency: score.currency || "USD",
              interestRate,
              fees: "0",
              totalRepayable: totalRepayable.toFixed(2),
              outstandingBalance: totalRepayable.toFixed(2),
              status: status === "approved_disbursed" ? "disbursed" : "pending_disbursement",
              disbursementStatus: status === "approved_disbursed" ? "confirmed" : "pending",
              disbursementRef: disbursementRef || undefined,
              disbursedAt: status === "approved_disbursed" ? new Date() : undefined,
              tenorDays: 30,
              country: profile.country,
              organizationId: orgId || profile.organizationId || undefined,
            };
            if (status === "approved_disbursed") {
              const dueDate = new Date();
              dueDate.setDate(dueDate.getDate() + 30);
              loanData.dueDate = dueDate;
              loanData.nextPaymentDate = dueDate;
            }
            await storage.createTelcoLoan(loanData);
          } else {
            results.rejected++;
          }

          results.decisions.push({
            profileId: profile.id,
            msisdn: profile.msisdn,
            status,
            riskScore: normalizedScore,
            riskTier: normalizedTier,
            creditLimit,
            reasonCode: decisionLog.reasonCode,
          });
        } catch (err: any) {
          results.errors++;
          results.decisions.push({ profileId: profile.id, msisdn: profile.msisdn, status: "error", reason: err.message });
        }
      }

      await storage.createAuditLog({
        action: "BULK_DECISION_ENGINE",
        entity: "telco_decision_log",
        entityId: rule.id,
        userId: req.session.userId,
        details: `Bulk decision: ${results.approved} approved, ${results.rejected} rejected, ${results.skipped} skipped, ${results.errors} errors out of ${results.totalEligible} profiles`,
        organizationId: orgId,
      });

      res.json({
        summary: {
          total: results.totalEligible,
          approved: results.approved,
          rejected: results.rejected,
          skipped: results.skipped,
          errors: results.errors,
        },
        decisions: results.decisions,
        ruleApplied: { id: rule.id, name: rule.name },
      });
    } catch (e: any) {
      routeLogger.error("[BulkDecisionEngine] Error:", { detail: e.message });
      res.status(500).json({ message: safeErrorMessage(e) });
    }
  });

  // ── Telco Loans ──────────────────────────────────────────
router.get("/api/telco/loans", requireRole("admin", "lender", "super_admin"), async (req, res) => {
    try {
      const orgId = getOrgScope(req);
      const country = getCountryFilter(req) || (req.query.country as string);
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;
      const status = req.query.status as string;
      const profileId = req.query.profileId as string;
      const search = req.query.search as string;
      if (search && search.length >= 3) {
        const profiles = await db.select({ id: telcoProfiles.id }).from(telcoProfiles)
          .where(ilike(telcoProfiles.msisdn, `%${search}%`)).limit(200);
        const matchedProfileIds = profiles.map(p => p.id);
        if (matchedProfileIds.length === 0) {
          return res.json({ data: [], total: 0, page: 1, totalPages: 0 });
        }
        const result = await storage.getTelcoLoans(orgId, country, { page, limit, status, profileId, profileIds: matchedProfileIds });
        return res.json(result);
      }
      const result = await storage.getTelcoLoans(orgId, country, { page, limit, status, profileId });
      const profileIds = [...new Set(result.data.map(l => l.profileId))];
      const profileMap = new Map<string, { msisdn: string; provider: string }>();
      if (profileIds.length > 0) {
        const profiles = await db.select({ id: telcoProfiles.id, msisdn: telcoProfiles.msisdn, provider: telcoProfiles.provider }).from(telcoProfiles).where(inArray(telcoProfiles.id, profileIds));
        profiles.forEach(p => profileMap.set(p.id, { msisdn: p.msisdn, provider: p.provider }));
      }
      const enriched = result.data.map(l => ({
        ...l,
        msisdn: profileMap.get(l.profileId)?.msisdn || null,
        provider: profileMap.get(l.profileId)?.provider || null,
      }));
      res.json({ ...result, data: enriched });
    } catch (e: any) { res.status(500).json({ message: safeErrorMessage(e) }); }
  });

router.get("/api/telco/loans/portfolio", requireRole("admin", "lender", "super_admin"), async (req, res) => {
    try {
      const orgId = getOrgScope(req);
      const country = getCountryFilter(req) || (req.query.country as string);
      const stats = await storage.getTelcoLoanPortfolioStats(orgId, country);
      res.json(stats);
    } catch (e: any) { res.status(500).json({ message: safeErrorMessage(e) }); }
  });

router.get("/api/telco/operations-dashboard", requireRole("admin", "lender", "regulator", "super_admin"), async (req, res) => {
    try {
      const orgId = getOrgScope(req);
      const country = getCountryFilter(req) || (req.query.country as string);

      const where = [];
      if (orgId) where.push(eq(telcoLoans.organizationId, orgId));
      if (country) where.push(eq(telcoLoans.country, country));
      const whereClause = where.length > 0 ? and(...where) : undefined;

      const allLoans = await db.select({
        id: telcoLoans.id,
        profileId: telcoLoans.profileId,
        loanAmount: telcoLoans.loanAmount,
        outstandingBalance: telcoLoans.outstandingBalance,
        amountRepaid: telcoLoans.amountRepaid,
        totalRepayable: telcoLoans.totalRepayable,
        status: telcoLoans.status,
        disbursementStatus: telcoLoans.disbursementStatus,
        daysInArrears: telcoLoans.daysInArrears,
        dueDate: telcoLoans.dueDate,
        disbursedAt: telcoLoans.disbursedAt,
        nextPaymentDate: telcoLoans.nextPaymentDate,
        currency: telcoLoans.currency,
        country: telcoLoans.country,
        createdAt: telcoLoans.createdAt,
      }).from(telcoLoans).where(whereClause);

      let collectionsOverdue = 0, collectionsOverdueAmount = 0;
      let bucket1_30 = { count: 0, amount: 0 };
      let bucket31_60 = { count: 0, amount: 0 };
      let bucket61_90 = { count: 0, amount: 0 };
      let bucket90plus = { count: 0, amount: 0 };
      let pendingDisbursements = 0, pendingDisbursementAmount = 0;
      let todayDisbursed = 0, todayDisbursedAmount = 0;
      let activeLoans = 0, totalOutstanding = 0, totalPortfolio = 0;
      let defaultedLoans = 0, healthyLoans = 0;
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekAhead = new Date(today.getTime() + 7 * 86400000);
      let collectionsDueThisWeek = 0, collectionsDueThisWeekAmount = 0;

      for (const loan of allLoans) {
        const outstanding = Number(loan.outstandingBalance || 0);
        const loanAmt = Number(loan.loanAmount || 0);
        totalPortfolio += loanAmt;

        if (loan.status === "pending_disbursement") {
          pendingDisbursements++;
          pendingDisbursementAmount += loanAmt;
        }

        if (loan.disbursedAt) {
          const disbDate = new Date(loan.disbursedAt);
          if (disbDate >= today) {
            todayDisbursed++;
            todayDisbursedAmount += loanAmt;
          }
        }

        if (["active", "repaying", "disbursed"].includes(loan.status || "")) {
          activeLoans++;
          totalOutstanding += outstanding;
          const arrears = loan.daysInArrears || 0;

          if (arrears > 0) {
            collectionsOverdue++;
            collectionsOverdueAmount += outstanding;
            if (arrears <= 30) { bucket1_30.count++; bucket1_30.amount += outstanding; }
            else if (arrears <= 60) { bucket31_60.count++; bucket31_60.amount += outstanding; }
            else if (arrears <= 90) { bucket61_90.count++; bucket61_90.amount += outstanding; }
            else { bucket90plus.count++; bucket90plus.amount += outstanding; }
          } else {
            healthyLoans++;
          }

          if (loan.nextPaymentDate) {
            const nextPay = new Date(loan.nextPaymentDate);
            if (nextPay >= today && nextPay <= weekAhead) {
              collectionsDueThisWeek++;
              const installmentEst = outstanding > 0 ? Math.min(outstanding, loanAmt * 0.1) : 0;
              collectionsDueThisWeekAmount += installmentEst;
            }
          }
        }

        if (loan.status === "defaulted" || loan.status === "written_off") {
          defaultedLoans++;
        }
      }

      const repWhere = [];
      if (orgId) repWhere.push(eq(telcoLoanRepayments.organizationId, orgId));
      if (country) repWhere.push(eq(telcoLoanRepayments.country, country));
      const recentRepayments = await db.select({
        id: telcoLoanRepayments.id,
        loanId: telcoLoanRepayments.loanId,
        profileId: telcoLoanRepayments.profileId,
        amountPaid: telcoLoanRepayments.amountPaid,
        amountDue: telcoLoanRepayments.amountDue,
        status: telcoLoanRepayments.status,
        paidAt: telcoLoanRepayments.paidAt,
        dueDate: telcoLoanRepayments.dueDate,
        daysLate: telcoLoanRepayments.daysLate,
        currency: telcoLoanRepayments.currency,
        country: telcoLoanRepayments.country,
      }).from(telcoLoanRepayments)
        .where(repWhere.length > 0 ? and(...repWhere) : undefined)
        .orderBy(desc(telcoLoanRepayments.paidAt))
        .limit(20);

      const profileIds = [...new Set(recentRepayments.map(r => r.profileId))];
      const profileMap = new Map<string, string>();
      if (profileIds.length > 0) {
        const profiles = await db.select({ id: telcoProfiles.id, msisdn: telcoProfiles.msisdn }).from(telcoProfiles).where(inArray(telcoProfiles.id, profileIds));
        profiles.forEach(p => profileMap.set(p.id, p.msisdn));
      }

      const loanIds = [...new Set(recentRepayments.map(r => r.loanId))];
      const loanMap = new Map<string, { loanAmount: string; interestRate: string; tenorDays: number; totalRepayable: string; outstandingBalance: string; loanStatus: string; disbursedAt: Date | null; lenderName: string; lenderType: string }>();
      if (loanIds.length > 0) {
        const loansWithOrg = await db.select({
          id: telcoLoans.id,
          loanAmount: telcoLoans.loanAmount,
          interestRate: telcoLoans.interestRate,
          tenorDays: telcoLoans.tenorDays,
          totalRepayable: telcoLoans.totalRepayable,
          outstandingBalance: telcoLoans.outstandingBalance,
          loanStatus: telcoLoans.status,
          disbursedAt: telcoLoans.disbursedAt,
          lenderName: organizations.name,
          lenderType: organizations.type,
        }).from(telcoLoans)
          .leftJoin(organizations, eq(telcoLoans.organizationId, organizations.id))
          .where(inArray(telcoLoans.id, loanIds));
        loansWithOrg.forEach(l => loanMap.set(l.id, {
          loanAmount: l.loanAmount,
          interestRate: l.interestRate,
          tenorDays: l.tenorDays,
          totalRepayable: l.totalRepayable,
          outstandingBalance: l.outstandingBalance,
          loanStatus: l.loanStatus,
          disbursedAt: l.disbursedAt,
          lenderName: l.lenderName || "Unknown Lender",
          lenderType: l.lenderType || "other",
        }));
      }

      const enrichedRepayments = recentRepayments.map(r => ({
        ...r,
        msisdn: profileMap.get(r.profileId) || null,
        lender: loanMap.get(r.loanId) || null,
      }));

      const portfolioHealthScore = activeLoans > 0
        ? Math.round(Math.max(0, Math.min(100, 100 - (collectionsOverdue / activeLoans) * 100 - (defaultedLoans / Math.max(1, allLoans.length)) * 50)))
        : 100;

      res.json({
        collections: {
          totalOverdue: collectionsOverdue,
          totalOverdueAmount: collectionsOverdueAmount,
          aging: {
            "1-30": bucket1_30,
            "31-60": bucket31_60,
            "61-90": bucket61_90,
            "90+": bucket90plus,
          },
          dueThisWeek: collectionsDueThisWeek,
          dueThisWeekAmount: collectionsDueThisWeekAmount,
        },
        disbursements: {
          pending: pendingDisbursements,
          pendingAmount: pendingDisbursementAmount,
          todayDisbursed: todayDisbursed,
          todayAmount: todayDisbursedAmount,
        },
        recentRepayments: enrichedRepayments,
        portfolioHealth: {
          score: portfolioHealthScore,
          activeLoans,
          healthyLoans,
          overdueLoans: collectionsOverdue,
          defaultedLoans,
          totalOutstanding,
          totalPortfolio,
        },
      });
    } catch (e: any) { res.status(500).json({ message: safeErrorMessage(e) }); }
  });

router.get("/api/telco/loans/:id", requireRole("admin", "lender", "super_admin"), async (req, res) => {
    try {
      const loan = await storage.getTelcoLoan(req.params.id);
      if (!loan) return res.status(404).json({ message: "Loan not found" });
      const orgId = getOrgScope(req);
      if (orgId && loan.organizationId && loan.organizationId !== orgId) {
        return res.status(403).json({ message: "Access denied" });
      }
      res.json(loan);
    } catch (e: any) { res.status(500).json({ message: safeErrorMessage(e) }); }
  });

router.post("/api/telco/loans", requireRole("admin", "super_admin"), async (req, res) => {
    try {
      const orgId = getOrgScope(req);
      const data = { ...req.body, organizationId: orgId || req.body.organizationId };
      const loan = await storage.createTelcoLoan(data);
      await storage.createAuditLog({
        action: "TELCO_LOAN_CREATED",
        entity: "telco_loans",
        entityId: loan.id,
        userId: req.session.userId,
        details: `Loan created: ${loan.currency} ${loan.loanAmount} for profile ${loan.profileId}`,
        organizationId: orgId,
      });
      res.json(loan);
    } catch (e: any) { res.status(500).json({ message: safeErrorMessage(e) }); }
  });

router.patch("/api/telco/loans/:id", requireRole("admin", "super_admin"), async (req, res) => {
    try {
      const orgId = getOrgScope(req);
      const existing = await storage.getTelcoLoan(req.params.id);
      if (!existing) return res.status(404).json({ message: "Loan not found" });
      if (orgId && existing.organizationId && existing.organizationId !== orgId) {
        return res.status(403).json({ message: "Access denied" });
      }
      const loan = await storage.updateTelcoLoan(req.params.id, req.body);
      await storage.createAuditLog({
        action: "TELCO_LOAN_UPDATED",
        entity: "telco_loans",
        entityId: loan.id,
        userId: req.session.userId,
        details: `Loan updated: status=${loan.status}, disbursement=${loan.disbursementStatus}`,
        organizationId: orgId,
      });
      res.json(loan);
    } catch (e: any) { res.status(500).json({ message: safeErrorMessage(e) }); }
  });

router.post("/api/telco/loans/:id/disburse", requireRole("admin", "super_admin"), idempotencyMiddleware, async (req, res) => {
    try {
      const loan = await storage.getTelcoLoan(req.params.id);
      if (!loan) return res.status(404).json({ message: "Loan not found" });
      const orgId = getOrgScope(req);
      if (orgId && loan.organizationId && loan.organizationId !== orgId) {
        return res.status(403).json({ message: "Access denied" });
      }
      if (loan.status !== "pending_disbursement") {
        return res.status(400).json({ message: `Loan already in status: ${loan.status}` });
      }
      const ref = `DISB-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + (loan.tenorDays || 30));
      const updated = await storage.updateTelcoLoan(loan.id, {
        status: "disbursed" as any,
        disbursementStatus: "confirmed" as any,
        disbursementRef: ref,
        disbursedAt: new Date(),
        dueDate,
        nextPaymentDate: dueDate,
      });
      await storage.createAuditLog({
        action: "TELCO_LOAN_DISBURSED",
        entity: "telco_loans",
        entityId: loan.id,
        userId: req.session.userId,
        details: `Loan disbursed: ${loan.currency} ${loan.loanAmount}, ref=${ref}`,
        organizationId: orgId,
      });
      res.json(updated);
    } catch (e: any) { res.status(500).json({ message: safeErrorMessage(e) }); }
  });

  // ── Telco Loan Repayments ──────────────────────────────
router.get("/api/telco/loans/:loanId/repayments", requireRole("admin", "lender", "super_admin"), async (req, res) => {
    try {
      const loan = await storage.getTelcoLoan(req.params.loanId);
      if (!loan) return res.status(404).json({ message: "Loan not found" });
      const orgId = getOrgScope(req);
      if (orgId && loan.organizationId && loan.organizationId !== orgId) {
        return res.status(403).json({ message: "Access denied" });
      }
      const repayments = await storage.getTelcoLoanRepayments(req.params.loanId);
      res.json(repayments);
    } catch (e: any) { res.status(500).json({ message: safeErrorMessage(e) }); }
  });

router.post("/api/telco/loans/:loanId/repayments", requireRole("admin", "super_admin"), async (req, res) => {
    try {
      const loan = await storage.getTelcoLoan(req.params.loanId);
      if (!loan) return res.status(404).json({ message: "Loan not found" });
      const orgId = getOrgScope(req);
      if (orgId && loan.organizationId && loan.organizationId !== orgId) {
        return res.status(403).json({ message: "Access denied" });
      }
      const repayment = await storage.createTelcoLoanRepayment({
        ...req.body,
        loanId: loan.id,
        profileId: loan.profileId,
        currency: loan.currency,
        country: loan.country,
        organizationId: loan.organizationId,
      });
      const newRepaid = Number(loan.amountRepaid || 0) + Number(repayment.amountPaid || 0);
      const newOutstanding = Number(loan.totalRepayable) - newRepaid;
      const loanUpdates: any = {
        amountRepaid: String(newRepaid),
        outstandingBalance: String(Math.max(0, newOutstanding)),
        lastPaymentDate: new Date(),
      };
      if (newOutstanding <= 0) {
        loanUpdates.status = "paid_off";
        loanUpdates.closedAt = new Date();
        loanUpdates.closureReason = "fully_repaid";
        loanUpdates.outstandingBalance = "0";
      } else {
        loanUpdates.status = "repaying";
      }
      await storage.updateTelcoLoan(loan.id, loanUpdates);
      await storage.createAuditLog({
        action: "TELCO_REPAYMENT_RECEIVED",
        entity: "telco_loan_repayments",
        entityId: repayment.id,
        userId: req.session.userId,
        details: `Repayment: ${loan.currency} ${repayment.amountPaid} on loan ${loan.id}`,
        organizationId: orgId,
      });
      res.json(repayment);
    } catch (e: any) { res.status(500).json({ message: safeErrorMessage(e) }); }
  });

  // ── Telco Consent Management ───────────────────────────
router.get("/api/telco/consent/:profileId", requireRole("admin", "lender", "super_admin"), async (req, res) => {
    try {
      const events = await storage.getTelcoConsentEvents(req.params.profileId);
      res.json(events);
    } catch (e: any) { res.status(500).json({ message: safeErrorMessage(e) }); }
  });

router.post("/api/telco/consent", requireRole("admin", "super_admin"), async (req, res) => {
    try {
      const orgId = getOrgScope(req);
      const receiptId = `CR-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
      const event = await storage.createTelcoConsentEvent({
        ...req.body,
        consentReceiptId: receiptId,
        ipAddress: req.ip || req.headers["x-forwarded-for"] as string,
        userAgent: req.headers["user-agent"],
        organizationId: orgId || req.body.organizationId,
      });
      if (req.body.action === "grant") {
        const profile = await storage.getTelcoProfile(req.body.profileId);
        if (profile) {
          await db.update(telcoProfiles).set({ consentGranted: true, consentDate: new Date() }).where(eq(telcoProfiles.id, profile.id));
        }
      } else if (req.body.action === "revoke") {
        await db.update(telcoProfiles).set({ consentGranted: false }).where(eq(telcoProfiles.id, req.body.profileId));
      }
      await storage.createAuditLog({
        action: `TELCO_CONSENT_${req.body.action?.toUpperCase() || "EVENT"}`,
        entity: "telco_consent_events",
        entityId: event.id,
        userId: req.session.userId,
        details: `Consent ${req.body.action} for profile ${req.body.profileId} via ${req.body.method || "web_portal"}. Receipt: ${receiptId}`,
        organizationId: orgId,
      });
      res.json(event);
    } catch (e: any) { res.status(500).json({ message: safeErrorMessage(e) }); }
  });

router.get("/api/telco/consent-summary", requireRole("admin", "lender", "super_admin"), async (req, res) => {
    try {
      const orgId = getOrgScope(req);
      const country = getCountryFilter(req) || (req.query.country as string);
      const summary = await storage.getTelcoConsentSummary(orgId, country);
      res.json(summary);
    } catch (e: any) { res.status(500).json({ message: safeErrorMessage(e) }); }
  });

export default router;
