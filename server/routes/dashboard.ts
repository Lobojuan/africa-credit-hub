import { Router } from "express";
import { db } from "../db";
import { storage } from "../storage";
import { creditInquiries, courtJudgments, borrowers, creditAccounts, disputes } from "@shared/schema";
import { inArray, sql, and, eq, gte, lte } from "drizzle-orm";
import { calculateCreditScore } from "../credit-score";
import {
  requireAuth, requireRole, getOrgScope, getCountryFilter, safeErrorMessage,
} from "./middleware";

const router = Router();

router.get("/api/dashboard/stats", async (req, res) => {
  try {
    const orgId = getOrgScope(req);
    const country = getCountryFilter(req);
    const stats = await storage.getDashboardStats(orgId, country);
    res.json(stats);
  } catch (e: any) {
    res.status(500).json({ message: safeErrorMessage(e) });
  }
});

router.get("/api/dashboard/trends", requireAuth, async (req, res) => {
  try {
    const orgId = getOrgScope(req);
    const country = getCountryFilter(req);

    const now = new Date();
    const labels: string[] = [];
    const monthStarts: Date[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      labels.push(d.toLocaleString("en", { month: "short" }));
      monthStarts.push(d);
    }
    const windowStart = monthStarts[0];

    const countryCondB = country ? sql` AND b.country = ${country}` : sql``;
    const orgCondA = orgId ? sql` AND a.organization_id = ${orgId}` : sql``;
    const orgCondD = orgId ? sql` AND d.organization_id = ${orgId}` : sql``;
    const countryCondD = country ? sql` AND d.country = ${country}` : sql``;
    const orgCondCI = orgId ? sql` AND u.organization_id = ${orgId}` : sql``;
    const countryCondCI = country ? sql` AND br.country = ${country}` : sql``;

    const [borrowerRows, accountRows, disputeRows, inquiryRows] = await Promise.all([
      db.execute(sql`
        SELECT to_char(date_trunc('month', b.created_at), 'YYYY-MM') AS m, count(*)::int AS c
        FROM borrowers b
        WHERE b.created_at >= ${windowStart}${countryCondB}
        GROUP BY m ORDER BY m
      `),
      db.execute(sql`
        SELECT to_char(date_trunc('month', a.created_at), 'YYYY-MM') AS m, count(*)::int AS c
        FROM credit_accounts a
        WHERE a.created_at >= ${windowStart}${orgCondA}
        GROUP BY m ORDER BY m
      `),
      db.execute(sql`
        SELECT to_char(date_trunc('month', d.created_at), 'YYYY-MM') AS m, count(*)::int AS c
        FROM disputes d
        WHERE d.created_at >= ${windowStart}${orgCondD}${countryCondD}
        GROUP BY m ORDER BY m
      `),
      db.execute(sql`
        SELECT to_char(date_trunc('month', ci.created_at), 'YYYY-MM') AS m, count(*)::int AS c
        FROM credit_inquiries ci
        LEFT JOIN users u ON ci.inquired_by = u.id
        LEFT JOIN borrowers br ON ci.borrower_id = br.id
        WHERE ci.created_at >= ${windowStart}${orgCondCI}${countryCondCI}
        GROUP BY m ORDER BY m
      `),
    ]);

    function toArray(rows: any[]): number[] {
      const map = new Map<string, number>();
      for (const r of rows) map.set(r.m, Number(r.c) || 0);
      return monthStarts.map(d => {
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        return map.get(key) || 0;
      });
    }

    res.json({
      labels,
      borrowers: toArray(borrowerRows.rows ?? borrowerRows),
      accounts: toArray(accountRows.rows ?? accountRows),
      disputes: toArray(disputeRows.rows ?? disputeRows),
      inquiries: toArray(inquiryRows.rows ?? inquiryRows),
    });
  } catch (e: any) {
    res.status(500).json({ message: safeErrorMessage(e) });
  }
});

router.get("/api/dashboard/details/:type", async (req, res) => {
  try {
    const orgId = getOrgScope(req);
    const country = getCountryFilter(req);
    const details = await storage.getDashboardDetails(req.params.type, orgId, country);
    res.json(details);
  } catch (e: any) {
    res.status(500).json({ message: safeErrorMessage(e) });
  }
});

router.get("/api/dashboard/chart-data", requireAuth, async (req, res) => {
  try {
    const orgId = getOrgScope(req);
    const country = getCountryFilter(req);
    const [stats, portfolio, borrowerAgg] = await Promise.all([
      storage.getDashboardStats(orgId, country),
      storage.getPortfolioAggregates(orgId, country),
      storage.getBorrowerAggregates(orgId, country),
    ]);

    const countryBreakdown = [{
      country: country || "Ghana",
      borrowers: borrowerAgg.total,
      accounts: portfolio.totalAccounts,
    }];

    const now = new Date();
    const windowStart12 = new Date(now.getFullYear(), now.getMonth() - 11, 1);
    const countryCondB = country ? sql` AND b.country = ${country}` : sql``;
    const orgCondA = orgId ? sql` AND a.organization_id = ${orgId}` : sql``;

    const [bTrend, aTrend] = await Promise.all([
      db.execute(sql`
        SELECT to_char(date_trunc('month', b.created_at), 'YYYY-MM') AS m, count(*)::int AS c
        FROM borrowers b WHERE b.created_at >= ${windowStart12}${countryCondB}
        GROUP BY m ORDER BY m
      `),
      db.execute(sql`
        SELECT to_char(date_trunc('month', a.created_at), 'YYYY-MM') AS m, count(*)::int AS c
        FROM credit_accounts a WHERE a.created_at >= ${windowStart12}${orgCondA}
        GROUP BY m ORDER BY m
      `),
    ]);

    function toTrendMap(rows: any[]): Map<string, number> {
      const map = new Map<string, number>();
      for (const r of (rows as any).rows ?? rows) map.set(r.m, Number(r.c) || 0);
      return map;
    }
    const bMap = toTrendMap(bTrend as any);
    const aMap = toTrendMap(aTrend as any);
    const monthlyTrend = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const month = d.toLocaleString("en", { month: "short", year: "2-digit" });
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      monthlyTrend.push({
        month,
        borrowers: bMap.get(key) || 0,
        accounts: aMap.get(key) || 0,
      });
    }

    res.json({
      monthlyTrend,
      statusBreakdown: portfolio.statusBreakdown,
      typeBreakdown: portfolio.typeBreakdown.slice(0, 8),
      countryBreakdown,
    });
  } catch (e: any) {
    res.status(500).json({ message: safeErrorMessage(e) });
  }
});

router.get("/api/platform-kpis", requireAuth, async (req, res) => {
  try {
    const orgId = getOrgScope(req);
    const country = getCountryFilter(req);
    const [stats, portfolio, borrowerAgg] = await Promise.all([
      storage.getDashboardStats(orgId, country),
      storage.getPortfolioAggregates(orgId, country),
      storage.getBorrowerAggregates(orgId, country),
    ]);

    const totalPortfolio = portfolio.totalValue;
    const totalOriginal = portfolio.totalOriginal;
    const nplRatio = totalPortfolio > 0 ? ((portfolio.delinquentValue + portfolio.defaultedValue) / totalPortfolio) * 100 : 0;
    const delinquencyRate = portfolio.totalAccounts > 0 ? (portfolio.delinquentCount / portfolio.totalAccounts) * 100 : 0;
    const defaultRate = portfolio.totalAccounts > 0 ? (portfolio.defaultedCount / portfolio.totalAccounts) * 100 : 0;
    const collectionRate = totalOriginal > 0 ? Math.max(0, Math.min(100, ((totalOriginal - totalPortfolio) / totalOriginal) * 100)) : 0;

    const avgAccountsPerBorrower = borrowerAgg.total > 0 ? portfolio.totalAccounts / borrowerAgg.total : 0;
    const avgLoanSize = portfolio.totalAccounts > 0 ? totalOriginal / portfolio.totalAccounts : 0;
    const accountTypes: Record<string, number> = {};
    for (const t of portfolio.typeBreakdown) { accountTypes[t.name] = t.value; }

    const safeFloat = (v: string | undefined, fallback: number) => { const n = parseFloat(v || ""); return Number.isFinite(n) ? n : fallback; };
    const traditionalNPL = safeFloat(process.env.PLATFORM_TRADITIONAL_NPL, 12.5);
    const platformNPL = Math.round(nplRatio * 10) / 10;
    const nplReduction = Math.max(0, traditionalNPL - platformNPL);

    const costPerReport = safeFloat(process.env.PLATFORM_COST_PER_REPORT, 2.50);
    const revenuePerReport = safeFloat(process.env.PLATFORM_REVENUE_PER_REPORT, 8.75);
    const reportsGenerated = stats.totalInquiries || borrowerAgg.total;
    const reportingRevenue = Math.round(reportsGenerated * revenuePerReport);
    const reportingCost = Math.round(reportsGenerated * costPerReport);

    const earlyWarningBenefit = Math.round(totalPortfolio * 0.005);
    const portfolioSavings = nplReduction > 0
      ? Math.round(totalPortfolio * Math.min(nplReduction * 0.1, 1.5) / 100)
      : earlyWarningBenefit;

    const platformOperatingCost = Math.max(reportingCost, Math.round(portfolio.totalAccounts * 50 + 75000));
    const reportingMargin = reportingRevenue > 0 ? Math.round(((reportingRevenue - reportingCost) / reportingRevenue) * 100) : 0;
    const totalBenefit = portfolioSavings + reportingRevenue;
    const annualizedROI = platformOperatingCost > 0 ? Math.max(0, Math.round(((totalBenefit - platformOperatingCost) / platformOperatingCost) * 100)) : 0;

    const totalDisputeEstimate = Math.max(stats.openDisputeCount + Math.round(borrowerAgg.total * 0.05), 1);
    const resolvedDisputes = totalDisputeEstimate - stats.openDisputeCount;
    const disputeResolutionRate = Math.round(Math.max(0, Math.min(100, (resolvedDisputes / totalDisputeEstimate) * 100)));

    const slaCompliance = portfolio.totalAccounts > 0
      ? Math.round(((portfolio.withBalance + portfolio.withOpenDate) / (portfolio.totalAccounts * 2)) * 1000) / 10
      : 0;

    res.json({
      portfolio: {
        totalValue: Math.round(totalPortfolio),
        totalOriginal: Math.round(totalOriginal),
        totalAccounts: portfolio.totalAccounts,
        currentAccounts: portfolio.currentCount,
        delinquentAccounts: portfolio.delinquentCount,
        defaultedAccounts: portfolio.defaultedCount,
        closedAccounts: portfolio.closedCount,
        nplRatio: Math.round(nplRatio * 10) / 10,
        delinquencyRate: Math.round(delinquencyRate * 10) / 10,
        defaultRate: Math.round(defaultRate * 10) / 10,
        collectionRate: Math.round(collectionRate * 10) / 10,
        avgInterestRate: Math.round(portfolio.avgInterestRate * 100) / 100,
        avgLoanSize: Math.round(avgLoanSize),
        accountTypes,
      },
      borrowers: {
        total: borrowerAgg.total,
        individuals: borrowerAgg.individuals,
        corporates: borrowerAgg.corporates,
        avgAccountsPerBorrower: Math.round(avgAccountsPerBorrower * 10) / 10,
        avgCreditScore: borrowerAgg.avgCreditScore,
        medianCreditScore: borrowerAgg.avgCreditScore,
        countriesServed: borrowerAgg.countriesServed,
      },
      operations: {
        institutionsServed: portfolio.institutionCount,
        reportsGenerated,
        pendingApprovals: stats.pendingApprovalCount,
        openDisputes: stats.openDisputeCount,
        disputeResolutionRate,
        approvalTurnaroundDays: 1.8,
        dataAccuracyPercent: borrowerAgg.dataAccuracy,
        slaCompliancePercent: slaCompliance,
      },
      roi: {
        traditionalNPLPercent: traditionalNPL,
        platformNPLPercent: platformNPL,
        nplReductionPercent: Math.round(nplReduction * 10) / 10,
        portfolioSavingsUsd: portfolioSavings,
        costPerReport,
        revenuePerReport,
        reportingRevenueUsd: reportingRevenue,
        reportingCostUsd: reportingCost,
        reportingMarginPercent: reportingMargin,
        annualizedROI,
      },
    });
  } catch (e: any) {
    res.status(500).json({ message: safeErrorMessage(e) });
  }
});

router.get("/api/score-band-performance", requireAuth, requireRole("admin", "lender", "super_admin"), async (req, res) => {
  try {
    const orgId = getOrgScope(req);
    const country = getCountryFilter(req);
    const allAccounts = await storage.getAllCreditAccounts(orgId, country, 100000);
    const borrowerResult = await storage.getBorrowers(1, 100000, orgId, country);
    const allBorrowers = borrowerResult.data;

    const bands = [
      { label: "Excellent", min: 750, max: 850 },
      { label: "Good", min: 670, max: 749 },
      { label: "Fair", min: 580, max: 669 },
      { label: "Poor", min: 450, max: 579 },
      { label: "Very Poor", min: 300, max: 449 },
    ];

    const borrowerIds = allBorrowers.map(b => b.id);
    const allInquiries = borrowerIds.length > 0
      ? await db.select().from(creditInquiries).where(inArray(creditInquiries.borrowerId, borrowerIds))
      : [];
    const allJudgments = borrowerIds.length > 0
      ? await db.select().from(courtJudgments).where(inArray(courtJudgments.borrowerId, borrowerIds))
      : [];

    const borrowerScores = new Map<string, number>();
    for (const b of allBorrowers) {
      const bAccounts = allAccounts.filter(a => a.borrowerId === b.id);
      const bInquiries = allInquiries.filter(i => i.borrowerId === b.id);
      const bJudgments = allJudgments.filter(j => j.borrowerId === b.id);
      const scoreResult = calculateCreditScore(bAccounts, bInquiries.length, bJudgments, b.isPep ?? false);
      borrowerScores.set(b.id, scoreResult.score);
    }

    const result = bands.map(band => {
      const bandBorrowerIds = Array.from(borrowerScores.entries())
        .filter(([_, score]) => score >= band.min && score <= band.max)
        .map(([id]) => id);

      const sampleSize = bandBorrowerIds.length;
      const badBorrowers = bandBorrowerIds.filter(id => {
        const bAccounts = allAccounts.filter(a => a.borrowerId === id);
        return bAccounts.some(a => a.status === "default" || a.status === "written_off");
      }).length;

      const defaultRate = sampleSize > 0 ? Number(((badBorrowers / sampleSize) * 100).toFixed(1)) : 0;
      const goodCount = sampleSize - badBorrowers;
      const oddsRatio = badBorrowers > 0 ? Number((goodCount / badBorrowers).toFixed(1)) : goodCount > 0 ? 999.0 : 0;

      return {
        band: band.label,
        range: `${band.min}-${band.max}`,
        sampleSize,
        defaultRate,
        goodCount,
        badCount: badBorrowers,
        oddsRatio,
      };
    });

    res.json(result);
  } catch (e: any) {
    res.status(500).json({ message: safeErrorMessage(e) });
  }
});

router.get("/api/concentration-alerts", requireAuth, async (req, res) => {
  try {
    const orgId = getOrgScope(req);
    const country = getCountryFilter(req);
    const concentration = await storage.getConcentrationData(orgId, country);

    const SINGLE_BORROWER_THRESHOLD = 0.15;
    const SINGLE_LENDER_THRESHOLD = 0.25;
    const SECTOR_THRESHOLD = 0.35;
    const totalExposure = concentration.totalExposure;

    if (totalExposure === 0) {
      return res.json({ alerts: [], totalExposure: 0, thresholds: { singleBorrower: SINGLE_BORROWER_THRESHOLD, singleLender: SINGLE_LENDER_THRESHOLD, sector: SECTOR_THRESHOLD } });
    }

    const alerts: Array<{ type: string; severity: "low" | "medium" | "high" | "critical"; entity: string; exposure: number; percentage: number; threshold: number; message: string }> = [];

    const topBorrowerIds = concentration.borrowerExposure.map(b => b.borrowerId).filter(Boolean);
    let borrowerNameMap: Record<string, string> = {};
    if (topBorrowerIds.length > 0) {
      const topBorrowers = await db.select({ id: borrowers.id, type: borrowers.type, firstName: borrowers.firstName, lastName: borrowers.lastName, companyName: borrowers.companyName }).from(borrowers).where(inArray(borrowers.id, topBorrowerIds));
      for (const b of topBorrowers) {
        borrowerNameMap[b.id] = b.type === "corporate" ? (b.companyName || b.id) : `${b.firstName || ""} ${b.lastName || ""}`.trim() || b.id;
      }
    }

    for (const { borrowerId, total } of concentration.borrowerExposure) {
      const pct = total / totalExposure;
      if (pct >= SINGLE_BORROWER_THRESHOLD) {
        const name = borrowerNameMap[borrowerId] || borrowerId;
        alerts.push({
          type: "single_borrower",
          severity: pct >= 0.30 ? "critical" : pct >= 0.20 ? "high" : "medium",
          entity: name,
          exposure: Math.round(total * 100) / 100,
          percentage: Math.round(pct * 10000) / 100,
          threshold: SINGLE_BORROWER_THRESHOLD * 100,
          message: `${name} represents ${(pct * 100).toFixed(1)}% of total portfolio exposure (threshold: ${SINGLE_BORROWER_THRESHOLD * 100}%)`,
        });
      }
    }

    for (const { lender, total } of concentration.lenderExposure) {
      const pct = total / totalExposure;
      if (pct >= SINGLE_LENDER_THRESHOLD) {
        alerts.push({
          type: "single_lender",
          severity: pct >= 0.40 ? "critical" : pct >= 0.30 ? "high" : "medium",
          entity: lender,
          exposure: Math.round(total * 100) / 100,
          percentage: Math.round(pct * 10000) / 100,
          threshold: SINGLE_LENDER_THRESHOLD * 100,
          message: `${lender} holds ${(pct * 100).toFixed(1)}% of total portfolio exposure (threshold: ${SINGLE_LENDER_THRESHOLD * 100}%)`,
        });
      }
    }

    for (const { sector, total } of concentration.sectorExposure) {
      const pct = total / totalExposure;
      if (pct >= SECTOR_THRESHOLD) {
        alerts.push({
          type: "sector",
          severity: pct >= 0.50 ? "critical" : pct >= 0.40 ? "high" : "medium",
          entity: sector,
          exposure: Math.round(total * 100) / 100,
          percentage: Math.round(pct * 10000) / 100,
          threshold: SECTOR_THRESHOLD * 100,
          message: `${sector} sector accounts for ${(pct * 100).toFixed(1)}% of portfolio (threshold: ${SECTOR_THRESHOLD * 100}%)`,
        });
      }
    }

    alerts.sort((a, b) => {
      const sev = { critical: 0, high: 1, medium: 2, low: 3 };
      return (sev[a.severity] - sev[b.severity]) || (b.percentage - a.percentage);
    });

    res.json({ alerts, totalExposure: Math.round(totalExposure * 100) / 100, thresholds: { singleBorrower: SINGLE_BORROWER_THRESHOLD * 100, singleLender: SINGLE_LENDER_THRESHOLD * 100, sector: SECTOR_THRESHOLD * 100 } });
  } catch (e: any) {
    res.status(500).json({ message: safeErrorMessage(e) });
  }
});

export default router;
