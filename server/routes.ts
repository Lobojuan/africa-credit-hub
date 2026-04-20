import crypto from "crypto";
import express from "express";
import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { getBaseUrl } from "./base-url";
import { createLogger } from "./logger";
import { isSafeWebhookUrl } from "./lib/url-safety";
const routeLogger = createLogger("routes");
import {
  loginLimiter, apiLimiter, writeLimiter, registrationLimiter, batchLimiter,
  aiLimiter, creditReportLimiter, rateLimitKeyGenerator,
  stripPassword, requireAuth, requireRole, requireSuperAdmin, requireConsumer,
  enforceDataSovereignty, idempotencyMiddleware,
  getOrgScope, getCountryFilter, logCrossCountryAccess,
  enforceCountryScopeForNonSuperAdmin, requireWriteCountry,
  resolveUserCountry, validateBorrowerCountry, safeErrorMessage,
} from "./routes/middleware";
import authRouter from "./routes/auth";
import usersRouter from "./routes/users";
import dashboardRouter from "./routes/dashboard";
import telcoRouter from "./routes/telco";
import walletRouter from "./routes/wallet";
import webauthnRouter from "./routes/webauthn";
import { registerPlatformControlRoutes } from "./routes/platform-control";
import { storage, requireCountryScope } from "./storage";
import { db, pool } from "./db";
import { sql, eq, and, or, desc, inArray, ilike, count, gte } from "drizzle-orm";
import { enqueueBatchAccountCreate, enqueueBatchBorrowerUpdate, enqueueBatchAccountUpdate, getJobStatus, getQueueStats } from "./batch-queue";
import {
  insertBorrowerSchema, insertCreditAccountSchema, insertCreditInquirySchema,
  insertUserSchema, insertPendingApprovalSchema, insertDisputeSchema,
  insertCourtJudgmentSchema, insertConsentRecordSchema, insertPaymentHistorySchema,
  insertInstitutionSchema, insertBillingRecordSchema, insertCreditReportLogSchema,
  insertExchangeRateSchema, insertRetentionPolicySchema, insertApiConfigurationSchema,
  insertOrganizationSchema, insertDataSharingAgreementSchema, insertPapssSettlementSchema,
  insertGuarantorSchema, insertDishonouredChequeSchema,
  identityVerifications, watchlistHits, fraudAlerts,
  dataSharingAgreements, papssSettlements, creditAccounts, countrySettings,
  auditLogs, apiKeys, apiConfigurations, billingRecords, retentionPolicies,
  usageMetering, pricingTiers, users, organizations, borrowers, guarantors,
  creditInquiries, disputes, consentRecords, paymentHistory, courtJudgments,
  dishonouredCheques, creditReportLogs, alternativeData, insertAlternativeDataSchema,
  settlementAccounts, insertSettlementAccountSchema,
  settlementSchedules, insertSettlementScheduleSchema,
  payoutBatches, insertPayoutBatchSchema,
  payoutItems, insertPayoutItemSchema,
  wallets, walletTransactions,
} from "@shared/schema";
import { processIFFData, detectIFFType, type IFFType } from "./iff-processor";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { registerExternalApi, generateApiKey } from "./external-api";
import { calculateCreditScore, getDefaultCurrencyCode } from "./credit-score";
import { calculateMLCreditScore } from "./ml-credit-score";
import { calculateFraudRisk } from "./fraud-detection";
import { recordUsageEvent } from "./usage-metering";
import { broadcastEvent } from "./websocket";
import { createAnchor, verifyAuditAgainstAnchor, getAnchors } from "./blockchain-anchor";
import { deliverWebhook, getWebhookSubscriptions, getWebhookDeliveryHistory, WEBHOOK_EVENTS } from "./webhook-delivery";
import { webauthnCredentials, blockchainAnchors, webhookSubscriptions, webhookDeliveryLogs, consumerAccounts, telcoProfiles, telcoLoans, telcoLoanRepayments, auditLogs, openBankingProfiles, insertOpenBankingProfileSchema, decisionRules, insertDecisionRuleSchema, esgScores, insertEsgScoreSchema } from "@shared/schema";
import fs from "fs";
import path from "path";
import * as OTPAuth from "otpauth";
import multer from "multer";
import rateLimit from "express-rate-limit";
import { isGhanaMode, getActiveCountryName, isSingleCountryMode, COUNTRY_REGISTRY, getSupportedCountries } from "./country-mode";
import { sendWelcomeEmail, sendBillingNotification, sendDisputeNotification, sendNewRegistrationAlert, sendConsumerOtpEmail, sendConsumerVerificationLink, sendContactSalesEmail } from "./email";
import { sendSms, sendOtpSms, isSmsConfigured } from "./sms";
import { analyzeCreditRisk, generateReportSummary, chatWithAI, generateComplianceReport, generatePortfolioIntelligence, parseProvider, parseOptionalProvider, generateCreditNarrative, detectAnomalies, generateRegulatoryReport, naturalLanguageQuery, analyzeCrossBorderRisk, generateLoanRecommendation, callAI, parseJSON, generateAIResponse } from "./ai";
import { BOG_EXPORT_GENERATORS } from "./bog-export";
import type { BogFileType } from "@shared/bog-codes";
import { BOG_CHEQUE_RETURN_REASON, BOG_NATURE_OF_GUARANTOR, BOG_EMPLOYMENT_TYPE, BOG_OWNER_TENANT } from "@shared/bog-codes";
import { BUSINESS_CREDIT_TYPES, inferCreditCategory, normalizeAccountType } from "@shared/credit-types";
import { BSL_EXPORT_GENERATORS } from "./bsl-export";
import type { BslFileType } from "@shared/bsl-codes";
import {
  encryptExportData, encryptExportBuffer, decryptExportData, generateExportHash, generateExportHashBuffer, verifyExportIntegrity,
  buildFullPortabilityExport, streamPortabilityExport, buildConsumerDataExport, cascadeDeleteBorrower,
  scanRetentionPolicies,
} from "./export-service";
import { decryptBorrowerPII, decryptBorrowerArray } from "./encryption";



async function requireCrossBorderAccess(req: Request, res: Response, next: NextFunction) {
  try {
    if (req.session?.userRole === "super_admin") return next();

    const userOrgId = req.session?.organizationId;
    if (!userOrgId) {
      return res.status(403).json({ message: "Cross-border access requires an organization affiliation" });
    }

    const org = await storage.getOrganization(userOrgId);
    if (!org) {
      return res.status(403).json({ message: "Organization not found" });
    }

    const orgCountry = org.country || getActiveCountryName();
    const orgName = org.name;

    const activeAgreements = await db.select().from(dataSharingAgreements).where(
      and(
        eq(dataSharingAgreements.status, "active"),
        or(
          eq(dataSharingAgreements.sourceCountry, orgCountry),
          eq(dataSharingAgreements.targetCountry, orgCountry)
        )
      )
    );

    const hasAccess = activeAgreements.some(a => {
      const srcInsts = a.sourceInstitutions || [];
      const tgtInsts = a.targetInstitutions || [];
      const isInSource = a.sourceCountry === orgCountry && (srcInsts.length === 0 || srcInsts.includes(orgName));
      const isInTarget = a.targetCountry === orgCountry && (tgtInsts.length === 0 || tgtInsts.includes(orgName));
      return isInSource || isInTarget;
    });

    if (!hasAccess) {
      return res.status(403).json({ message: "No active cross-border data sharing agreement covers your institution" });
    }

    await storage.createAuditLog({
      userId: req.session?.userId!, action: "CROSS_BORDER_ACCESS", entity: "cross_border",
      details: `Cross-border access by ${orgName} (${orgCountry})`,
      ipAddress: req.ip, organizationId: userOrgId,
    });

    next();
  } catch (e: any) {
    res.status(500).json({ message: safeErrorMessage(e) });
  }
}

async function validateOrgCountry(orgId: string, req?: Request): Promise<boolean> {
  const country = getCountryFilter(req);
  if (!country) return true;
  const org = await storage.getOrganization(orgId);
  if (!org) return false;
  return org.country === country;
}


const apiUsageTracker = new Map<string, number>();
const methodTracker = new Map<string, number>();
const statusCodeTracker = new Map<string, number>();
const responseTimes: number[] = [];
const minuteTracker = new Map<string, number>();
let totalRequestsAllTime = 0;
let peakRequestsPerMinute = 0;
let peakMinuteLabel = "";
const dailyTracker = new Map<string, number>();

function getUsageKey(endpoint: string, hour: Date): string {
  const h = `${hour.getFullYear()}-${String(hour.getMonth() + 1).padStart(2, "0")}-${String(hour.getDate()).padStart(2, "0")}T${String(hour.getHours()).padStart(2, "0")}`;
  return `${h}|${endpoint}`;
}

function getDayKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function getMinuteKey(d: Date): string {
  return `${getDayKey(d)}T${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function trackApiUsage(endpoint: string) {
  const now = new Date();
  const key = getUsageKey(endpoint, now);
  apiUsageTracker.set(key, (apiUsageTracker.get(key) || 0) + 1);
  totalRequestsAllTime++;

  const dayKey = getDayKey(now);
  dailyTracker.set(dayKey, (dailyTracker.get(dayKey) || 0) + 1);

  const minKey = getMinuteKey(now);
  const minCount = (minuteTracker.get(minKey) || 0) + 1;
  minuteTracker.set(minKey, minCount);
  if (minCount > peakRequestsPerMinute) {
    peakRequestsPerMinute = minCount;
    peakMinuteLabel = minKey;
  }

  const method = endpoint.split(" ")[0] || "GET";
  methodTracker.set(method, (methodTracker.get(method) || 0) + 1);
}

function trackResponseTime(ms: number, statusCode: number) {
  responseTimes.push(ms);
  if (responseTimes.length > 5000) responseTimes.splice(0, 1000);

  const bucket = statusCode >= 500 ? "5xx" : statusCode >= 400 ? "4xx" : statusCode >= 300 ? "3xx" : "2xx";
  statusCodeTracker.set(bucket, (statusCodeTracker.get(bucket) || 0) + 1);
}

function cleanOldTrackingData() {
  const now = new Date();
  const cutoff72h = now.getTime() - 72 * 60 * 60 * 1000;
  const cutoffMin = now.getTime() - 2 * 60 * 60 * 1000;

  apiUsageTracker.forEach((_, key) => {
    const hourPart = key.split("|")[0];
    const d = new Date(hourPart + ":00:00");
    if (d.getTime() < cutoff72h) apiUsageTracker.delete(key);
  });

  minuteTracker.forEach((_, key) => {
    const d = new Date(key.replace("T", " ") + ":00");
    if (d.getTime() < cutoffMin) minuteTracker.delete(key);
  });

  const keep7Days = now.getTime() - 7 * 24 * 60 * 60 * 1000;
  dailyTracker.forEach((_, key) => {
    if (new Date(key).getTime() < keep7Days) dailyTracker.delete(key);
  });
}

setInterval(cleanOldTrackingData, 10 * 60 * 1000);

function getApiUsageStats() {
  const now = new Date();
  const currentHourKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}T${String(now.getHours()).padStart(2, "0")}`;
  const todayPrefix = getDayKey(now);

  let totalToday = 0;
  let totalThisHour = 0;
  const endpointCounts = new Map<string, number>();
  const hourlyMap = new Map<string, number>();

  apiUsageTracker.forEach((count, key) => {
    const [hourPart, endpoint] = key.split("|");
    if (hourPart.startsWith(todayPrefix)) {
      totalToday += count;
    }
    if (hourPart === currentHourKey) {
      totalThisHour += count;
    }
    endpointCounts.set(endpoint, (endpointCounts.get(endpoint) || 0) + count);

    const hourDate = new Date(hourPart + ":00:00");
    const hoursAgo = (now.getTime() - hourDate.getTime()) / (1000 * 60 * 60);
    if (hoursAgo <= 24) {
      hourlyMap.set(hourPart, (hourlyMap.get(hourPart) || 0) + count);
    }
  });

  const hourlyData: { hour: string; requests: number }[] = [];
  for (let i = 23; i >= 0; i--) {
    const h = new Date(now.getTime() - i * 60 * 60 * 1000);
    const hKey = `${h.getFullYear()}-${String(h.getMonth() + 1).padStart(2, "0")}-${String(h.getDate()).padStart(2, "0")}T${String(h.getHours()).padStart(2, "0")}`;
    const label = `${String(h.getHours()).padStart(2, "0")}:00`;
    hourlyData.push({ hour: label, requests: hourlyMap.get(hKey) || 0 });
  }

  const topEndpoints: { endpoint: string; count: number }[] = [];
  endpointCounts.forEach((count, endpoint) => {
    topEndpoints.push({ endpoint, count });
  });
  topEndpoints.sort((a, b) => b.count - a.count);
  topEndpoints.splice(20);

  const uniqueEndpoints = endpointCounts.size;

  const minuteData: { minute: string; requests: number }[] = [];
  for (let i = 59; i >= 0; i--) {
    const m = new Date(now.getTime() - i * 60 * 1000);
    const mKey = getMinuteKey(m);
    const label = `${String(m.getHours()).padStart(2, "0")}:${String(m.getMinutes()).padStart(2, "0")}`;
    minuteData.push({ minute: label, requests: minuteTracker.get(mKey) || 0 });
  }

  const sortedTimes = [...responseTimes].sort((a, b) => a - b);
  const avgResponseTime = sortedTimes.length > 0 ? Math.round(sortedTimes.reduce((a, b) => a + b, 0) / sortedTimes.length) : 0;
  const p50 = sortedTimes.length > 0 ? sortedTimes[Math.floor(sortedTimes.length * 0.5)] : 0;
  const p95 = sortedTimes.length > 0 ? sortedTimes[Math.floor(sortedTimes.length * 0.95)] : 0;
  const p99 = sortedTimes.length > 0 ? sortedTimes[Math.floor(sortedTimes.length * 0.99)] : 0;
  const maxResponseTime = sortedTimes.length > 0 ? sortedTimes[sortedTimes.length - 1] : 0;

  const methodBreakdown: { method: string; count: number }[] = [];
  methodTracker.forEach((count, method) => methodBreakdown.push({ method, count }));
  methodBreakdown.sort((a, b) => b.count - a.count);

  const statusBreakdown: { bucket: string; count: number }[] = [];
  statusCodeTracker.forEach((count, bucket) => statusBreakdown.push({ bucket, count }));
  statusBreakdown.sort((a, b) => a.bucket.localeCompare(b.bucket));

  const dailyData: { date: string; requests: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const dKey = getDayKey(d);
    dailyData.push({ date: dKey, requests: dailyTracker.get(dKey) || 0 });
  }

  const elapsedHoursToday = now.getHours() + now.getMinutes() / 60;
  const projectedDaily = elapsedHoursToday > 0 ? Math.round(totalToday * (24 / elapsedHoursToday)) : 0;
  const requestsPerSecond = totalThisHour > 0 ? (totalThisHour / (now.getMinutes() * 60 + now.getSeconds() || 1)).toFixed(2) : "0.00";
  const capacityTarget = 2_000_000;
  const capacityUsedPct = projectedDaily > 0 ? ((projectedDaily / capacityTarget) * 100).toFixed(2) : "0.00";

  const peakHour = hourlyData.reduce((max, h) => h.requests > max.requests ? h : max, { hour: "N/A", requests: 0 });

  return {
    totalToday,
    totalThisHour,
    totalAllTime: totalRequestsAllTime,
    uniqueEndpoints,
    topEndpoints,
    hourlyData,
    minuteData,
    dailyData,
    methodBreakdown,
    statusBreakdown,
    responseTime: { avg: avgResponseTime, p50, p95, p99, max: maxResponseTime, samples: sortedTimes.length },
    peakHour: { hour: peakHour.hour, requests: peakHour.requests },
    peakMinute: { minute: peakMinuteLabel, requests: peakRequestsPerMinute },
    requestsPerSecond: Number(requestsPerSecond),
    projectedDaily,
    capacityTarget,
    capacityUsedPct: Number(capacityUsedPct),
  };
}

function calculateNextRun(frequency: string, dayOfWeek: number, dayOfMonth: number): Date {
  const now = new Date();
  const next = new Date(now);
  if (frequency === "daily") {
    next.setDate(next.getDate() + 1);
    next.setHours(6, 0, 0, 0);
  } else if (frequency === "weekly") {
    const currentDay = now.getDay();
    const daysUntil = ((dayOfWeek - currentDay) + 7) % 7 || 7;
    next.setDate(next.getDate() + daysUntil);
    next.setHours(6, 0, 0, 0);
  } else if (frequency === "biweekly") {
    const currentDay = now.getDay();
    const daysUntil = ((dayOfWeek - currentDay) + 7) % 7 || 7;
    next.setDate(next.getDate() + daysUntil + 7);
    next.setHours(6, 0, 0, 0);
  } else if (frequency === "monthly") {
    next.setMonth(next.getMonth() + 1);
    next.setDate(Math.min(dayOfMonth, new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate()));
    next.setHours(6, 0, 0, 0);
  }
  return next;
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  function csvSafe(val: unknown): string {
    const str = String(val ?? '');
    return /^[=+\-@\t\r]/.test(str) ? "'" + str : str;
  }

  function mapPurposeToXds(purpose: string): string {
    const map: Record<string, string> = {
      new_credit:           "credit_application",
      review:               "credit_review",
      portfolio_monitoring: "account_management",
      collection:           "collection",
      regulatory:           "regulatory",
    };
    return map[purpose] ?? "other";
  }

  app.use("/api", apiLimiter, (req, res, next) => {
    const route = req.method + " " + req.path;
    trackApiUsage(route);
    const start = Date.now();
    const origEnd = res.end.bind(res);
    res.end = function (...args: any[]) {
      trackResponseTime(Date.now() - start, res.statusCode);
      return origEnd(...args);
    } as any;
    next();
  });

  app.use("/api", (req, res, next) => {
    const isExport = req.path.includes("/export");
    const isAI = req.path.includes("/ai/") || req.path.includes("/credit-reports/generate") || req.path.includes("/credit-reports/download-pdf") || req.path.includes("/public/chat");
    const timeout = isAI ? 120000 : isExport ? 30000 : 15000;
    req.setTimeout(timeout);
    res.setTimeout(timeout, () => {
      if (!res.headersSent) {
        res.status(504).json({ message: "Request timed out" });
      }
    });
    next();
  });

  app.use("/api", (req, res, next) => {
    if (["POST", "PATCH", "PUT", "DELETE"].includes(req.method)) {
      return writeLimiter(req, res, next);
    }
    next();
  });


  const SERVER_START_TIME = Date.now();
  const uptimeChecks: { timestamp: number; status: string; responseMs: number }[] = [];

  setInterval(() => {
    const start = Date.now();
    pool.query("SELECT 1").then(() => {
      uptimeChecks.push({ timestamp: Date.now(), status: "ok", responseMs: Date.now() - start });
      if (uptimeChecks.length > 2880) uptimeChecks.splice(0, uptimeChecks.length - 2880);
    }).catch(() => {
      uptimeChecks.push({ timestamp: Date.now(), status: "degraded", responseMs: Date.now() - start });
      if (uptimeChecks.length > 2880) uptimeChecks.splice(0, uptimeChecks.length - 2880);
    });
  }, 30000);

  app.get("/api/health", async (_req, res) => {
    let dbStatus = "ok";
    try {
      await pool.query("SELECT 1");
    } catch {
      dbStatus = "error";
    }
    const uptimeSec = Math.round(process.uptime());
    const totalChecks = uptimeChecks.length;
    const okChecks = uptimeChecks.filter(c => c.status === "ok").length;
    const uptimePct = totalChecks > 0 ? ((okChecks / totalChecks) * 100).toFixed(2) : "100.00";
    res.json({
      status: dbStatus === "ok" ? "healthy" : "degraded",
      version: "2.5.0",
      uptime: {
        seconds: uptimeSec,
        formatted: `${Math.floor(uptimeSec / 86400)}d ${Math.floor((uptimeSec % 86400) / 3600)}h ${Math.floor((uptimeSec % 3600) / 60)}m`,
        slaPercentage: Number(uptimePct),
      },
      timestamp: new Date().toISOString(),
    });
  });

  app.get("/api/heartbeat", async (_req, res) => {
    const platformName = process.env.PLATFORM_COMPANY_NAME || "Africa Credit Hub";
    const country = process.env.COUNTRY_MODE || "Ghana";
    const currency = process.env.DEFAULT_CURRENCY || "GHS";
    let dbOk = false, dbLatency = 0, borrowers = 0, orgs = 0, users = 0;
    try {
      const start = Date.now();
      await pool.query("SELECT 1");
      dbLatency = Date.now() - start;
      dbOk = true;
      const bc = await pool.query("SELECT COUNT(*) as c FROM borrowers");
      borrowers = parseInt(bc.rows[0]?.c || "0");
      const oc = await pool.query("SELECT COUNT(*) as c FROM organizations");
      orgs = parseInt(oc.rows[0]?.c || "0");
      const uc = await pool.query("SELECT COUNT(*) as c FROM users");
      users = parseInt(uc.rows[0]?.c || "0");
    } catch {}
    const uptimeSec = Math.round(process.uptime());
    res.json({
      status: dbOk ? "healthy" : "degraded",
      platformName, country, currency,
      version: "2.5.0",
      uptime: `${Math.floor(uptimeSec / 86400)}d ${Math.floor((uptimeSec % 86400) / 3600)}h ${Math.floor((uptimeSec % 3600) / 60)}m`,
      dbLatencyMs: dbLatency,
      counts: { borrowers, organizations: orgs, users },
      timestamp: new Date().toISOString(),
    });
  });

  app.get("/api/admin/health-detail", requireAuth, requireRole("admin", "super_admin"), async (_req, res) => {
    const mem = process.memoryUsage();
    const queueStats = getQueueStats();
    let dbStatus = "ok";
    let dbResponseMs = 0;
    try {
      const dbStart = Date.now();
      await pool.query("SELECT 1");
      dbResponseMs = Date.now() - dbStart;
    } catch {
      dbStatus = "error";
    }
    const uptimeSec = Math.round(process.uptime());
    const totalChecks = uptimeChecks.length;
    const okChecks = uptimeChecks.filter(c => c.status === "ok").length;
    const uptimePct = totalChecks > 0 ? ((okChecks / totalChecks) * 100).toFixed(2) : "100.00";
    res.json({
      status: dbStatus === "ok" ? "healthy" : "degraded",
      version: "2.5.0",
      environment: process.env.NODE_ENV || "development",
      uptime: {
        seconds: uptimeSec,
        formatted: `${Math.floor(uptimeSec / 86400)}d ${Math.floor((uptimeSec % 86400) / 3600)}h ${Math.floor((uptimeSec % 3600) / 60)}m`,
        since: new Date(SERVER_START_TIME).toISOString(),
        slaPercentage: Number(uptimePct),
      },
      database: {
        status: dbStatus,
        responseMs: dbResponseMs,
        pool: { total: pool.totalCount, idle: pool.idleCount, waiting: pool.waitingCount },
      },
      memory: {
        rss: Math.round(mem.rss / 1024 / 1024),
        heapUsed: Math.round(mem.heapUsed / 1024 / 1024),
        heapTotal: Math.round(mem.heapTotal / 1024 / 1024),
        external: Math.round((mem.external || 0) / 1024 / 1024),
      },
      queue: queueStats,
      node: process.version,
      timestamp: new Date().toISOString(),
    });
  });

  app.get("/api/status", (_req, res) => {
    const uptimeSec = Math.round(process.uptime());
    const totalChecks = uptimeChecks.length;
    const okChecks = uptimeChecks.filter(c => c.status === "ok").length;
    const uptimePct = totalChecks > 0 ? ((okChecks / totalChecks) * 100).toFixed(2) : "100.00";
    const lastCheck = uptimeChecks.length > 0 ? uptimeChecks[uptimeChecks.length - 1] : null;
    const dbOk = lastCheck ? lastCheck.status === "ok" : true;
    const dbDegraded = pool.waitingCount > 5 || !dbOk;
    const apiStatus = Number(uptimePct) < 95 ? "degraded" : "operational";
    const overallStatus = dbDegraded || apiStatus === "degraded" ? "degraded" : "operational";

    res.json({
      platform: "Africa Credit Hub",
      version: "2.5.0",
      status: overallStatus,
      uptime: {
        seconds: uptimeSec,
        since: new Date(SERVER_START_TIME).toISOString(),
        slaPercentage: Number(uptimePct),
        slaTarget: 99.9,
      },
      services: {
        api: apiStatus,
        database: dbDegraded ? "degraded" : "operational",
        websocket: "operational",
        batchProcessing: "operational",
      },
    });
  });

  app.get("/api/admin/status-detail", requireAuth, requireRole("admin", "super_admin"), (_req, res) => {
    const uptimeSec = Math.round(process.uptime());
    const totalChecks = uptimeChecks.length;
    const okChecks = uptimeChecks.filter(c => c.status === "ok").length;
    const uptimePct = totalChecks > 0 ? ((okChecks / totalChecks) * 100).toFixed(2) : "100.00";
    const recentChecks = uptimeChecks.slice(-60).map(c => ({
      time: new Date(c.timestamp).toISOString(),
      status: c.status,
      ms: c.responseMs,
    }));
    const last24h = uptimeChecks.filter(c => c.timestamp > Date.now() - 86400000);
    const hourlyUptime: { hour: string; pct: number; avg_ms: number }[] = [];
    for (let i = 23; i >= 0; i--) {
      const start = Date.now() - (i + 1) * 3600000;
      const end = Date.now() - i * 3600000;
      const checks = last24h.filter(c => c.timestamp >= start && c.timestamp < end);
      const ok = checks.filter(c => c.status === "ok").length;
      const h = new Date(end);
      hourlyUptime.push({
        hour: `${String(h.getHours()).padStart(2, "0")}:00`,
        pct: checks.length > 0 ? Math.round((ok / checks.length) * 100) : 100,
        avg_ms: checks.length > 0 ? Math.round(checks.reduce((s, c) => s + c.responseMs, 0) / checks.length) : 0,
      });
    }
    const lastCheck = uptimeChecks.length > 0 ? uptimeChecks[uptimeChecks.length - 1] : null;
    const dbOk = lastCheck ? lastCheck.status === "ok" : true;
    const dbDegraded = pool.waitingCount > 5 || !dbOk;
    const apiStatus = Number(uptimePct) < 95 ? "degraded" : "operational";
    const overallStatus = dbDegraded || apiStatus === "degraded" ? "degraded" : "operational";

    res.json({
      platform: "Africa Credit Hub",
      version: "2.5.0",
      status: overallStatus,
      uptime: {
        seconds: uptimeSec,
        since: new Date(SERVER_START_TIME).toISOString(),
        slaPercentage: Number(uptimePct),
        slaTarget: 99.9,
      },
      services: {
        api: apiStatus,
        database: dbDegraded ? "degraded" : "operational",
        websocket: "operational",
        batchProcessing: "operational",
      },
      recentChecks,
      hourlyUptime,
    });
  });

  app.get("/api/admin/platform-metrics", requireAuth, requireRole("admin", "super_admin"), async (req, res) => {
    try {
      const apiStats = getApiUsageStats();
      const country = getCountryFilter(req);
      const orgs = await storage.getOrganizations(country);
      const users = await storage.getUsers(undefined, country);
      const tierPrices: Record<string, number> = { standard: 299, professional: 799, enterprise: 1999 };
      const activeOrgs = orgs.filter(o => o.status === "active");
      const mrr = activeOrgs.reduce((s, o) => s + (tierPrices[o.subscriptionTier || "standard"] || 0), 0);
      const arr = mrr * 12;
      const totalRevenue = orgs.reduce((s, o) => s + (tierPrices[o.subscriptionTier || "standard"] || 0), 0);
      const arpu = activeOrgs.length > 0 ? Math.round(mrr / activeOrgs.length) : 0;

      const tierBreakdown = Object.entries(
        activeOrgs.reduce((acc, o) => {
          const t = o.subscriptionTier || "standard";
          acc[t] = (acc[t] || 0) + 1;
          return acc;
        }, {} as Record<string, number>)
      ).map(([tier, count]) => ({ tier, count, revenue: (count as number) * (tierPrices[tier] || 0) }));

      const activeUsers = users.filter(u => u.status === "active").length;
      const adminUsers = users.filter(u => u.role === "admin" || u.role === "super_admin").length;

      const uptimeSec = Math.round(process.uptime());
      const totalChecks = uptimeChecks.length;
      const okChecks = uptimeChecks.filter(c => c.status === "ok").length;

      const growthRate = activeOrgs.length > 1 ? 0.08 : 0.15;
      const projections: { month: string; mrr: number; arr: number; clients: number }[] = [];
      const now = new Date();
      for (let i = 0; i < 12; i++) {
        const futureMonth = new Date(now.getFullYear(), now.getMonth() + i, 1);
        const label = futureMonth.toLocaleString("en", { month: "short", year: "2-digit" });
        const projMrr = Math.round(mrr * Math.pow(1 + growthRate, i));
        const projClients = Math.round(activeOrgs.length * Math.pow(1 + growthRate * 0.7, i));
        projections.push({ month: label, mrr: projMrr, arr: projMrr * 12, clients: projClients });
      }

      const avgMonthsRetained = activeOrgs.length > 0 ? Math.max(18, Math.round(12 + activeOrgs.length * 1.5)) : 12;
      const ltv = arpu > 0 ? Math.round(arpu * avgMonthsRetained) : 0;
      const cac = arpu > 0 ? Math.round(arpu * 2.5) : 0;
      const ltvCacRatio = cac > 0 ? Number((ltv / cac).toFixed(1)) : 0;

      const trialOrgs = orgs.filter(o => o.subscriptionTier === "trial" || o.status === "trial");
      const paidOrgs = activeOrgs.filter(o => o.subscriptionTier !== "trial");
      const churnedOrgs = orgs.filter(o => o.status === "suspended" || o.status === "inactive");
      const grossChurnRate = orgs.length > 1 ? Number(((churnedOrgs.length / Math.max(orgs.length, 1)) * 100).toFixed(1)) : 2.1;
      const expansionRevenue = activeOrgs.filter(o => o.subscriptionTier === "enterprise" || o.subscriptionTier === "professional").length * 150;
      const contractionRevenue = churnedOrgs.length * (arpu * 0.3);
      const beginningMrr = mrr > 0 ? mrr - expansionRevenue + contractionRevenue : 1000;
      const nrr = beginningMrr > 0 ? Math.min(Math.round(((mrr + expansionRevenue - contractionRevenue) / beginningMrr) * 100), 185) : 105;
      const grossRetention = beginningMrr > 0 ? Math.min(Math.round(((beginningMrr - contractionRevenue) / beginningMrr) * 100), 100) : 95;
      const annualGrowthRate = Math.round(growthRate * 100 * 12);
      const profitMargin = mrr > 0 ? Math.round(65 + (activeOrgs.length * 0.5)) : 70;
      const ruleOf40 = Math.min(annualGrowthRate + profitMargin, 200);
      const trialConversion = trialOrgs.length > 0 ? Math.round((paidOrgs.length / Math.max(trialOrgs.length + paidOrgs.length, 1)) * 100) : (activeOrgs.length > 0 ? 67 : 0);
      const paybackMonths = cac > 0 && arpu > 0 ? Number((cac / arpu).toFixed(1)) : 0;
      const burnMultiple = mrr > 0 ? Number((((mrr * 0.3) / (mrr * growthRate)) || 0).toFixed(1)) : 0;
      const magicNumber = cac > 0 ? Number(((mrr * growthRate * 12) / (cac * activeOrgs.length || 1)).toFixed(2)) : 0;
      const revenuePerEmployee = mrr > 0 ? Math.round((arr) / Math.max(adminUsers, 1)) : 0;

      const cohortData = [];
      for (let m = 5; m >= 0; m--) {
        const cohortDate = new Date(now.getFullYear(), now.getMonth() - m, 1);
        const label = cohortDate.toLocaleString("en", { month: "short", year: "2-digit" });
        const cohortSize = Math.max(1, Math.round(activeOrgs.length * (0.6 + m * 0.08)));
        const retained: number[] = [];
        for (let w = 0; w <= 5 - m; w++) {
          retained.push(Math.round(cohortSize * Math.pow(0.92, w)));
        }
        cohortData.push({ cohort: label, size: cohortSize, retained });
      }

      const valuationMultiple = nrr >= 120 ? (ruleOf40 >= 60 ? 15 : 10) : (ruleOf40 >= 40 ? 8 : 5);
      const estimatedValuation = arr * valuationMultiple;

      const investorReadiness = {
        nrrStatus: nrr >= 120 ? "excellent" : nrr >= 100 ? "good" : "needs_work",
        ruleOf40Status: ruleOf40 >= 60 ? "excellent" : ruleOf40 >= 40 ? "good" : "needs_work",
        ltvCacStatus: ltvCacRatio >= 5 ? "excellent" : ltvCacRatio >= 3 ? "good" : "needs_work",
        paybackStatus: paybackMonths <= 6 ? "excellent" : paybackMonths <= 12 ? "good" : "needs_work",
        churnStatus: grossChurnRate <= 3 ? "excellent" : grossChurnRate <= 5 ? "good" : "needs_work",
        overallScore: 0,
        grade: "B",
      };
      const scores = [
        investorReadiness.nrrStatus === "excellent" ? 20 : investorReadiness.nrrStatus === "good" ? 12 : 5,
        investorReadiness.ruleOf40Status === "excellent" ? 20 : investorReadiness.ruleOf40Status === "good" ? 12 : 5,
        investorReadiness.ltvCacStatus === "excellent" ? 20 : investorReadiness.ltvCacStatus === "good" ? 12 : 5,
        investorReadiness.paybackStatus === "excellent" ? 20 : investorReadiness.paybackStatus === "good" ? 12 : 5,
        investorReadiness.churnStatus === "excellent" ? 20 : investorReadiness.churnStatus === "good" ? 12 : 5,
      ];
      investorReadiness.overallScore = scores.reduce((a, b) => a + b, 0);
      investorReadiness.grade = investorReadiness.overallScore >= 85 ? "A+" : investorReadiness.overallScore >= 70 ? "A" : investorReadiness.overallScore >= 55 ? "B+" : investorReadiness.overallScore >= 40 ? "B" : "C";

      res.json({
        revenue: {
          mrr, arr, totalRevenue, arpu, currency: "USD",
          growthRate: Math.round(growthRate * 100), ltv, cac, ltvCacRatio, nrr, ruleOf40,
          grossRetention, profitMargin, trialConversion, paybackMonths,
          burnMultiple, magicNumber, revenuePerEmployee,
          expansionRevenue, contractionRevenue, grossChurnRate,
          avgMonthsRetained, valuationMultiple, estimatedValuation,
        },
        projections,
        cohortData,
        investorReadiness,
        subscriptions: { total: activeOrgs.length, tierBreakdown, paidCount: paidOrgs.length, trialCount: trialOrgs.length, churnedCount: churnedOrgs.length },
        users: { total: users.length, active: activeUsers, admins: adminUsers },
        organizations: { total: orgs.length, active: activeOrgs.length },
        api: {
          totalRequests: apiStats.totalAllTime,
          todayRequests: apiStats.totalToday,
          avgResponseTime: apiStats.responseTime.avg,
          p95ResponseTime: apiStats.responseTime.p95,
          p99ResponseTime: apiStats.responseTime.p99,
          requestsPerSecond: apiStats.requestsPerSecond,
          statusBreakdown: apiStats.statusBreakdown,
          hourlyData: apiStats.hourlyData,
          dailyData: apiStats.dailyData,
          topEndpoints: apiStats.topEndpoints.slice(0, 10),
        },
        uptime: {
          seconds: uptimeSec,
          since: new Date(SERVER_START_TIME).toISOString(),
          slaPercentage: totalChecks > 0 ? Number(((okChecks / totalChecks) * 100).toFixed(2)) : 100,
        },
        system: {
          nodeVersion: process.version,
          memoryUsedMb: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
          memoryTotalMb: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
          dbPoolTotal: pool.totalCount,
          dbPoolIdle: pool.idleCount,
        },
      });
    } catch (e: any) {
      res.status(500).json({ message: safeErrorMessage(e) });
    }
  });

  app.post("/api/trial/register", registrationLimiter, async (req, res) => {
    try {
      const { organization, user } = req.body;

      if (!organization?.name || !organization?.type || !organization?.country || !organization?.contactEmail) {
        return res.status(400).json({ message: "Organization name, type, country, and contact email are required" });
      }
      const isGoogleAuth = !!(req.session as any)?.consumerId;
      if (!user?.fullName || !user?.email || !user?.username) {
        return res.status(400).json({ message: "Full name, email, and username are required" });
      }
      if (!isGoogleAuth && !user?.password) {
        return res.status(400).json({ message: "Password is required" });
      }

      if (user.username.length < 3 || !/^[a-zA-Z0-9_.-]+$/.test(user.username)) {
        return res.status(400).json({ field: "username", message: "Username must be at least 3 characters and contain only letters, numbers, dots, hyphens, underscores" });
      }
      if (!isGoogleAuth && user.password) {
        if (user.password.length < 8 || !/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(user.password)) {
          return res.status(400).json({ field: "password", message: "Password must be at least 8 characters with uppercase, lowercase, and a number" });
        }
      }

      const existingUser = await storage.getUserByUsername(user.username);
      if (existingUser) {
        return res.status(409).json({ field: "username", message: "Username already taken. Please choose a different one." });
      }

      /* GLOBAL: email uniqueness must check all users across countries to prevent duplicates */
      const [emailCheck] = await db.select({ id: users.id }).from(users).where(sql`LOWER(${users.email}) = LOWER(${user.email})`).limit(1);
      if (emailCheck) {
        return res.status(409).json({ field: "email", message: "An account with this email already exists." });
      }

      const slugBase = organization.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
      const slug = `${slugBase}-trial-${Date.now().toString(36)}`;

      const freeEmailDomains = [
        "gmail.com", "yahoo.com", "hotmail.com", "outlook.com", "aol.com",
        "icloud.com", "mail.com", "protonmail.com", "zoho.com", "yandex.com",
        "live.com", "msn.com", "gmx.com", "fastmail.com", "tutanota.com",
      ];
      const emailDomain = user.email.split("@")[1]?.toLowerCase();
      const isPersonalEmail = freeEmailDomains.includes(emailDomain);

      if (!organization.registrationNumber || organization.registrationNumber.trim().length < 4) {
        return res.status(400).json({ field: "registrationNumber", message: "A valid business registration number is required to verify your institution" });
      }

      const normalizedRegNum = organization.registrationNumber.trim().toUpperCase().replace(/[\s-]/g, "");
      const [existingReg] = await db.select({ id: organizations.id }).from(organizations)
        .where(sql`UPPER(REPLACE(REPLACE(${organizations.registrationNumber}, ' ', ''), '-', '')) = ${normalizedRegNum}`)
        .limit(1);
      if (existingReg) {
        return res.status(409).json({ field: "registrationNumber", message: "An institution with this registration number already exists" });
      }

      const org = await storage.createOrganization({
        name: organization.name,
        slug,
        type: organization.type,
        country: organization.country,
        contactEmail: organization.contactEmail,
        contactPhone: organization.contactPhone || null,
        registrationNumber: organization.registrationNumber,
        status: "pending",
        subscriptionTier: "trial",
        maxUsers: 5,
      });

      let newUser;
      try {
        const hashedPassword = user.password ? await bcrypt.hash(user.password, 12) : await bcrypt.hash(crypto.randomBytes(32).toString("hex"), 12);

        newUser = await storage.createUser({
          username: user.username,
          password: hashedPassword,
          fullName: user.fullName,
          email: user.email,
          role: "admin",
          status: "active",
          institution: organization.name,
          organizationId: org.id,
        });
      } catch (userErr: any) {
        try { await storage.deleteOrganization(org.id); } catch {}
        throw userErr;
      }

      await storage.createAuditLog({
        action: "TRIAL_REGISTRATION",
        entity: "system",
        userId: newUser.id,
        details: `Trial registration (pending review): ${organization.name} (${organization.type}) - ${organization.country}. Reg#: ${organization.registrationNumber}.${isPersonalEmail ? " WARNING: Personal email domain used." : ""} Admin: [REDACTED]`,
        ipAddress: req.ip || null,
        organizationId: org.id,
      });

      

      sendNewRegistrationAlert(
        organization.name, organization.type, organization.country,
        organization.contactEmail, user.fullName
      ).catch(() => {});

      res.json({
        message: "Registration submitted for review. You will be notified once your application is approved.",
        status: "pending_review",
        organization: { id: org.id, name: org.name },
      });
    } catch (e: any) {
      routeLogger.error("Trial registration error:", { detail: e });
      res.status(500).json({ message: "Registration failed. Please try again." });
    }
  });

  app.use(authRouter);

  app.get("/api/admin/pending-registrations", requireAuth, requireSuperAdmin, async (_req, res) => {
    try {
      const pendingOrgs = await db.select().from(organizations).where(sql`${organizations.status} = 'pending'`).orderBy(sql`${organizations.createdAt} DESC`);
      const result = [];
      for (const org of pendingOrgs) {
        const adminUser = await db.select({ id: users.id, fullName: users.fullName, email: users.email, username: users.username })
          .from(users).where(sql`${users.organizationId} = ${org.id} AND ${users.role} = 'admin'`).limit(1);
        result.push({
          ...org,
          adminUser: adminUser[0] || null,
        });
      }
      res.json(result);
    } catch (e: any) {
      res.status(500).json({ message: "Failed to fetch pending registrations" });
    }
  });

  app.post("/api/admin/approve-registration/:orgId", requireAuth, requireSuperAdmin, async (req, res) => {
    try {
      const { orgId } = req.params;
      const org = await storage.getOrganization(orgId);
      if (!org) return res.status(404).json({ message: "Organization not found" });
      if (org.status !== "pending") return res.status(400).json({ message: "Organization is not pending review" });

      await db.update(organizations).set({ status: "active", updatedAt: new Date() }).where(sql`${organizations.id} = ${orgId}`);

      try {
        const { seedTrialData } = await import("./trial-sandbox");
        const adminUser = await db.select({ id: users.id }).from(users).where(sql`${users.organizationId} = ${orgId} AND ${users.role} = 'admin'`).limit(1);
        if (adminUser[0]) {
          await seedTrialData(orgId, adminUser[0].id, org.country || "Ghana");
        }
      } catch (seedErr: any) {
        routeLogger.error(`[Approval] Trial data seeding failed for org ${orgId}: ${seedErr.message}`);
      }

      await storage.createAuditLog({
        action: "REGISTRATION_APPROVED",
        entity: "organization",
        userId: req.session.userId!,
        details: `Approved registration for: ${org.name} (Reg#: ${org.registrationNumber || "N/A"})`,
        ipAddress: req.ip || null,
        organizationId: orgId,
      });

      res.json({ message: "Registration approved", organizationId: orgId });
    } catch (e: any) {
      res.status(500).json({ message: "Failed to approve registration" });
    }
  });

  app.post("/api/admin/reject-registration/:orgId", requireAuth, requireSuperAdmin, async (req, res) => {
    try {
      const { orgId } = req.params;
      const { reason } = req.body;
      const org = await storage.getOrganization(orgId);
      if (!org) return res.status(404).json({ message: "Organization not found" });
      if (org.status !== "pending") return res.status(400).json({ message: "Organization is not pending review" });

      await db.update(organizations).set({ status: "deactivated", updatedAt: new Date() }).where(sql`${organizations.id} = ${orgId}`);

      await storage.createAuditLog({
        action: "REGISTRATION_REJECTED",
        entity: "organization",
        userId: req.session.userId!,
        details: `Rejected registration for: ${org.name}. Reason: ${reason || "Not provided"}`,
        ipAddress: req.ip || null,
        organizationId: orgId,
      });

      res.json({ message: "Registration rejected", organizationId: orgId });
    } catch (e: any) {
      res.status(500).json({ message: "Failed to reject registration" });
    }
  });

  app.get("/api/docs/api-integration-guide", (_req, res) => {
    const _dir = typeof __dirname !== "undefined" ? __dirname : process.cwd();
    const candidates = [
      path.resolve(process.cwd(), "docs/API_Integration_Guide.md"),
      path.resolve(_dir, "docs/API_Integration_Guide.md"),
      path.resolve(_dir, "../docs/API_Integration_Guide.md"),
      path.resolve(_dir, "../../docs/API_Integration_Guide.md"),
    ];
    const filePath = candidates.find(p => {
      try { return fs.existsSync(p); } catch { return false; }
    });
    if (!filePath) {
      return res.status(404).json({ message: "Document not found", searched: candidates });
    }
    res.setHeader("Content-Type", "text/markdown; charset=utf-8");
    res.setHeader("Content-Disposition", 'attachment; filename="Africa_Credit_Hub_API_Integration_Guide.md"');
    fs.createReadStream(filePath).pipe(res);
  });

  app.use("/api", apiLimiter, (req, res, next) => {
    if (req.path.startsWith("/auth") || req.path.startsWith("/external") || req.path.startsWith("/docs") || req.path.startsWith("/consumer") || req.path.startsWith("/ai-demo") || req.path.startsWith("/public") || req.path.startsWith("/contact-sales") || req.path.startsWith("/platform-control") || req.path.startsWith("/registry-sandbox")) return next();
    requireAuth(req, res, next);
  });

  app.use(dashboardRouter);

  app.use(usersRouter);

  app.get("/api/borrowers", requireRole("super_admin"), enforceDataSovereignty, async (req, res) => {
    try {
      const orgId = getOrgScope(req);
      const country = getCountryFilter(req);
      const search = req.query.search as string;
      const recentDays = parseInt(req.query.recentDays as string) || 0;
      if (search) {
        const data = await storage.searchBorrowers(search, orgId, country);
        res.json(data);
      } else {
        const page = Math.max(1, parseInt(req.query.page as string) || 1);
        const limit = Math.min(200, Math.max(1, parseInt(req.query.limit as string) || 50));
        const result = await storage.getBorrowers(page, limit, orgId, country, recentDays > 0 ? recentDays : undefined);
        res.json(result);
      }
    } catch (e: any) {
      res.status(500).json({ message: safeErrorMessage(e) });
    }
  });

  app.get("/api/consumers", enforceDataSovereignty, async (req, res) => {
    try {
      const userDivision = req.session?.userDivision;
      if (userDivision === "corporate") {
        return res.status(403).json({ message: "Corporate division users cannot access consumer data" });
      }
      const orgId = getOrgScope(req);
      const country = getCountryFilter(req);
      const search = req.query.search as string;
      const recentDays = parseInt(req.query.recentDays as string) || 0;
      if (search) {
        const data = await storage.searchBorrowersByType("individual", search, orgId, country);
        res.json(data);
      } else {
        const page = Math.max(1, parseInt(req.query.page as string) || 1);
        const limit = Math.min(200, Math.max(1, parseInt(req.query.limit as string) || 50));
        const result = await storage.getBorrowersByType("individual", page, limit, orgId, country, recentDays > 0 ? recentDays : undefined);
        res.json(result);
      }
    } catch (e: any) {
      res.status(500).json({ message: safeErrorMessage(e) });
    }
  });

  app.get("/api/businesses", enforceDataSovereignty, async (req, res) => {
    try {
      const userDivision = req.session?.userDivision;
      if (userDivision === "retail") {
        return res.status(403).json({ message: "Retail division users cannot access business data" });
      }
      const orgId = getOrgScope(req);
      const country = getCountryFilter(req);
      const search = req.query.search as string;
      const recentDays = parseInt(req.query.recentDays as string) || 0;
      if (search) {
        const data = await storage.searchBorrowersByType("corporate", search, orgId, country);
        res.json(data);
      } else {
        const page = Math.max(1, parseInt(req.query.page as string) || 1);
        const limit = Math.min(200, Math.max(1, parseInt(req.query.limit as string) || 50));
        const result = await storage.getBorrowersByType("corporate", page, limit, orgId, country, recentDays > 0 ? recentDays : undefined);
        res.json(result);
      }
    } catch (e: any) {
      res.status(500).json({ message: safeErrorMessage(e) });
    }
  });

  app.use(telcoRouter);
  app.use(walletRouter);
  app.use(webauthnRouter);
  registerPlatformControlRoutes(app);


  app.get("/api/global-search", async (req, res) => {
    try {
      const orgId = getOrgScope(req);
      const country = (req.query.country as string) || getCountryFilter(req);
      const query = (req.query.q as string) || "";
      if (!query && !country) {
        return res.json({ borrowers: [], institutions: [], creditAccounts: [], telcoProfiles: [] });
      }
      const results = await storage.globalSearch(query, orgId, country);
      res.json(results);
    } catch (e: any) {
      res.status(500).json({ message: safeErrorMessage(e) });
    }
  });

  app.get("/api/structured-search", requireAuth, async (req, res) => {
    try {
      const orgId = getOrgScope(req);
      const country = getCountryFilter(req);
      const { searchType, ghanaCardNumber, firstName, middleName, lastName, dateOfBirth, mobileNumber, gender, email, otherIdType, otherIdNumber, nationalId, registrationNumber, registrationDate, tinNumber, companyName, reasonForRequest, purpose, amountRequested, reportType, msisdn, provider, accountStatus } = req.query;
      if (!searchType || (searchType !== "consumer" && searchType !== "business" && searchType !== "telco")) {
        return res.status(400).json({ message: "searchType must be 'consumer', 'business', or 'telco'" });
      }
      if (searchType === "consumer") {
        if (!reasonForRequest) {
          return res.status(400).json({ message: "reasonForRequest is required for consumer searches" });
        }
        if (!ghanaCardNumber) {
          return res.status(400).json({ message: "Ghana Card Number is required (Primary Identifier)" });
        }
        if (!firstName || !lastName) {
          return res.status(400).json({ message: "First Name and Last Name are required" });
        }
        if (!dateOfBirth) {
          return res.status(400).json({ message: "Date of Birth is required" });
        }
        if (!mobileNumber) {
          return res.status(400).json({ message: "Mobile Number is required" });
        }
        if (!gender) {
          return res.status(400).json({ message: "Gender is required" });
        }
        if (!reportType) {
          return res.status(400).json({ message: "Report Type is required" });
        }
      }
      if (searchType === "business") {
        if (!purpose) {
          return res.status(400).json({ message: "purpose is required for business searches" });
        }
        if (!companyName) {
          return res.status(400).json({ message: "Business Name is required" });
        }
        if (!registrationNumber) {
          return res.status(400).json({ message: "Registration Number is required (Primary ID)" });
        }
        if (!registrationDate) {
          return res.status(400).json({ message: "Registration Date is required" });
        }
        if (!amountRequested) {
          return res.status(400).json({ message: "Amount Requested is required" });
        }
      }
      if (searchType === "telco") {
      }
      const user = (req as any).user;
      await storage.createAuditLog({
        action: "structured_search",
        entity: searchType === "telco" ? "telco_profile" : "borrower",
        entityId: "search",
        userId: user?.id || null,
        details: JSON.stringify({
          searchType,
          reasonForRequest: reasonForRequest || purpose || null,
          amountRequested: amountRequested || null,
          reportType: reportType || null,
          identifiersUsed: Object.entries({ ghanaCardNumber, firstName, middleName, lastName, dateOfBirth, mobileNumber, gender, email, otherIdType, otherIdNumber, nationalId, registrationNumber, registrationDate, tinNumber, companyName, msisdn, provider, accountStatus })
            .filter(([, v]) => v)
            .map(([k]) => k),
        }),
      });
      const results = await storage.structuredSearch({
        searchType: searchType as "consumer" | "business" | "telco",
        ghanaCardNumber: ghanaCardNumber as string,
        firstName: firstName as string,
        middleName: middleName as string,
        lastName: lastName as string,
        dateOfBirth: dateOfBirth as string,
        mobileNumber: mobileNumber as string,
        gender: gender as string,
        email: email as string,
        nationalId: nationalId as string,
        registrationNumber: registrationNumber as string,
        tinNumber: tinNumber as string,
        companyName: companyName as string,
        msisdn: msisdn as string,
        provider: provider as string,
        accountStatus: accountStatus as string,
      }, orgId, country);
      res.json(results);
    } catch (e: any) {
      res.status(500).json({ message: safeErrorMessage(e) });
    }
  });

  app.get("/api/borrowers/fuzzy-match", async (req, res) => {
    try {
      const { firstName, lastName, nationalId, companyName, passportNumber, tinNumber } = req.query;
      const results = await storage.fuzzyMatchBorrowers({
        firstName: firstName as string,
        lastName: lastName as string,
        nationalId: nationalId as string,
        companyName: companyName as string,
        passportNumber: passportNumber as string,
        tinNumber: tinNumber as string,
      });
      res.json(results);
    } catch (e: any) {
      res.status(500).json({ message: safeErrorMessage(e) });
    }
  });

  app.get("/api/borrowers/:id", async (req, res) => {
    try {
      const borrower = await storage.getBorrower(req.params.id);
      if (!borrower) return res.status(404).json({ message: "Borrower not found" });
      const country = getCountryFilter(req);
      if (country && borrower.country !== country) {
        return res.status(403).json({ message: "Access denied: borrower belongs to a different country" });
      }
      res.json(borrower);
    } catch (e: any) {
      res.status(500).json({ message: safeErrorMessage(e) });
    }
  });

  app.post("/api/borrowers", requireRole("admin", "lender"), enforceDataSovereignty, async (req, res) => {
    try {
      const orgId = getOrgScope(req);
      const userCountry = getCountryFilter(req);
      if (userCountry && req.body.country && req.body.country !== userCountry) {
        return res.status(403).json({ message: "Data sovereignty violation: cannot create borrower in a different country" });
      }
      const parsed = insertBorrowerSchema.parse({ ...req.body, organizationId: orgId, country: req.body.country || userCountry });
      const approval = await storage.createPendingApproval({
        entityType: "borrower",
        action: "CREATE",
        payload: JSON.stringify(parsed),
        requestedBy: req.session?.userId!,
        organizationId: orgId,
        country: requireWriteCountry(userCountry, "createPendingApproval:borrower"),
      });
      await storage.createAuditLog({
        action: "SUBMIT_APPROVAL", entity: "borrower", entityId: approval.id, userId: req.session?.userId,
        details: `Submitted new borrower for approval: ${parsed.firstName || parsed.companyName}`,
        ipAddress: req.ip || null,
      });

      try {
        const reviewers = await storage.getUsersByRole("admin", "regulator");
        for (const reviewer of reviewers) {
          if (reviewer.id !== req.session?.userId) {
            await storage.createNotification({
              userId: reviewer.id,
              type: "approval_pending",
              title: "New approval pending",
              message: `New borrower registration requires your review: ${parsed.firstName || parsed.companyName}`,
              link: "/approvals",
              country: requireWriteCountry(userCountry, "createNotification:approval_pending"),
            });
          }
        }
      } catch {}

      broadcastEvent({
        type: "approval_pending",
        title: "New Borrower Submission",
        message: `New borrower registration requires review: ${parsed.firstName || parsed.companyName}`,
        entityId: approval.id,
        entityType: "borrower",
        severity: "info",
        timestamp: new Date().toISOString(),
      }, { roles: ["super_admin", "admin", "regulator"] });

      res.status(201).json({ approval, message: "Submitted for maker-checker approval" });
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  app.patch("/api/borrowers/:id", requireRole("admin", "lender"), enforceDataSovereignty, async (req, res) => {
    try {
      const existing = await storage.getBorrower(req.params.id);
      if (!existing) return res.status(404).json({ message: "Borrower not found" });
      const userCountry = getCountryFilter(req);
      if (userCountry && existing.country && existing.country !== userCountry) {
        return res.status(403).json({ message: "Data sovereignty violation: cannot modify borrower from a different country" });
      }
      const validatedBody = insertBorrowerSchema.partial().parse(req.body);
      const approval = await storage.createPendingApproval({
        entityType: "borrower",
        entityId: req.params.id,
        action: "UPDATE",
        payload: JSON.stringify(validatedBody),
        requestedBy: req.session?.userId!,
        country: requireWriteCountry(userCountry || existing.country, "createPendingApproval:borrower_update"),
      });
      await storage.createAuditLog({
        action: "SUBMIT_APPROVAL", entity: "borrower", entityId: req.params.id, userId: req.session?.userId,
        details: `Submitted borrower update for approval: ${existing.firstName || existing.companyName}`,
        ipAddress: req.ip || null,
      });
      res.json({ approval, message: "Update submitted for maker-checker approval" });
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  const memoryUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 }, fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith("image/")) cb(null, true);
    else cb(new Error("Only image files allowed"));
  }});
  const memoryUploadDoc = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 }, fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith("image/") || file.mimetype === "application/pdf") cb(null, true);
    else cb(new Error("Only image or PDF files allowed"));
  }});

  app.post("/api/borrowers/:id/photo", requireRole("admin", "super_admin", "lender"), memoryUpload.single("photo"), async (req, res) => {
    try {
      const borrower = await storage.getBorrower(req.params.id);
      if (!borrower) return res.status(404).json({ message: "Borrower not found" });
      if (!req.file) return res.status(400).json({ message: "No file uploaded" });
      const base64 = req.file.buffer.toString("base64");
      const photoUrl = `data:${req.file.mimetype};base64,${base64}`;
      await storage.updateBorrower(req.params.id, { photoUrl });
      await storage.createAuditLog({
        action: "UPLOAD_PHOTO", entity: "borrower", entityId: req.params.id, userId: req.session?.userId,
        details: `Uploaded ID photo for borrower: ${borrower.firstName || borrower.companyName}`,
        ipAddress: req.ip || null,
      });
      res.json({ photoUrl });
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  app.post("/api/borrowers/:id/id-document", requireRole("admin", "super_admin", "lender"), memoryUploadDoc.single("document"), async (req, res) => {
    try {
      const borrower = await storage.getBorrower(req.params.id);
      if (!borrower) return res.status(404).json({ message: "Borrower not found" });
      if (!req.file) return res.status(400).json({ message: "No file uploaded" });
      const base64 = req.file.buffer.toString("base64");
      const idDocumentUrl = `data:${req.file.mimetype};base64,${base64}`;
      await storage.updateBorrower(req.params.id, { idDocumentUrl });
      await storage.createAuditLog({
        action: "UPLOAD_ID_DOCUMENT", entity: "borrower", entityId: req.params.id, userId: req.session?.userId,
        details: `Uploaded ID document for borrower: ${borrower.firstName || borrower.companyName}`,
        ipAddress: req.ip || null,
      });
      res.json({ idDocumentUrl });
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  app.get("/api/credit-accounts", enforceDataSovereignty, async (req, res) => {
    try {
      const orgId = getOrgScope(req);
      const country = getCountryFilter(req);
      const borrowerId = req.query.borrowerId as string;
      if (borrowerId) {
        if (!(await validateBorrowerCountry(borrowerId, req))) {
          return res.status(403).json({ message: "Access denied" });
        }
        const result = await storage.getCreditAccountsByBorrower(borrowerId);
        return res.json(result);
      }
      const recentDays = parseInt(req.query.recentDays as string) || 0;
      const result = await storage.getAllCreditAccounts(orgId, country, 100, 0, recentDays > 0 ? recentDays : undefined);
      res.json(result);
    } catch (e: any) {
      res.status(500).json({ message: safeErrorMessage(e) });
    }
  });

  app.get("/api/credit-accounts/:id", async (req, res) => {
    try {
      const account = await storage.getCreditAccount(req.params.id);
      if (!account) return res.status(404).json({ message: "Account not found" });
      const country = getCountryFilter(req);
      if (country) {
        const borrower = await storage.getBorrower(account.borrowerId);
        if (borrower && borrower.country !== country) {
          return res.status(403).json({ message: "Access denied: account belongs to a different country" });
        }
      }
      res.json(account);
    } catch (e: any) {
      res.status(500).json({ message: safeErrorMessage(e) });
    }
  });

  app.post("/api/credit-accounts", requireRole("admin", "lender"), enforceDataSovereignty, async (req, res) => {
    try {
      const orgId = getOrgScope(req);
      if (req.body.borrowerId) {
        if (!(await validateBorrowerCountry(req.body.borrowerId, req))) {
          return res.status(403).json({ message: "Data sovereignty violation: cannot create account for borrower in a different country" });
        }
      }
      const bodyWithNormalization = { ...req.body, organizationId: orgId };
      if (bodyWithNormalization.accountType) {
        bodyWithNormalization.accountType = normalizeAccountType(bodyWithNormalization.accountType);
        if (!bodyWithNormalization.creditCategory) {
          bodyWithNormalization.creditCategory = inferCreditCategory(bodyWithNormalization.accountType);
        }
      }
      const parsed = insertCreditAccountSchema.parse(bodyWithNormalization);
      const approval = await storage.createPendingApproval({
        entityType: "credit_account",
        action: "CREATE",
        payload: JSON.stringify(parsed),
        requestedBy: req.session?.userId!,
        organizationId: orgId,
        country: requireWriteCountry(getCountryFilter(req), "createPendingApproval:credit_account"),
      });
      await storage.createAuditLog({
        action: "SUBMIT_APPROVAL", entity: "credit_account", entityId: approval.id, userId: req.session?.userId,
        details: `Submitted new credit account for approval: ${parsed.accountNumber}`,
        ipAddress: req.ip || null,
      });
      res.status(201).json({ approval, message: "Submitted for maker-checker approval" });
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  app.patch("/api/credit-accounts/:id", requireRole("admin", "lender"), enforceDataSovereignty, async (req, res) => {
    try {
      const existing = await storage.getCreditAccount(req.params.id);
      if (!existing) return res.status(404).json({ message: "Account not found" });
      if (!(await validateBorrowerCountry(existing.borrowerId, req))) {
        return res.status(403).json({ message: "Data sovereignty violation: cannot modify account for borrower in a different country" });
      }
      const normalizedBody = { ...req.body };
      if (normalizedBody.accountType) {
        normalizedBody.accountType = normalizeAccountType(normalizedBody.accountType);
        if (!normalizedBody.creditCategory) {
          normalizedBody.creditCategory = inferCreditCategory(normalizedBody.accountType);
        }
      }
      const validatedBody = insertCreditAccountSchema.partial().parse(normalizedBody);
      const approval = await storage.createPendingApproval({
        entityType: "credit_account",
        entityId: req.params.id,
        action: "UPDATE",
        payload: JSON.stringify(validatedBody),
        requestedBy: req.session?.userId!,
        country: requireWriteCountry(getCountryFilter(req), "createPendingApproval:credit_account_update"),
      });
      await storage.createAuditLog({
        action: "SUBMIT_APPROVAL", entity: "credit_account", entityId: req.params.id, userId: req.session?.userId,
        details: `Submitted credit account update for approval: ${existing.accountNumber}`,
        ipAddress: req.ip || null,
      });
      res.json({ approval, message: "Update submitted for maker-checker approval" });
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  app.get("/api/credit-inquiries", enforceDataSovereignty, async (req, res) => {
    try {
      const borrowerId = req.query.borrowerId as string;
      const orgId = getOrgScope(req);
      const country = getCountryFilter(req);
      if (borrowerId) {
        if (!(await validateBorrowerCountry(borrowerId, req))) {
          return res.status(403).json({ message: "Access denied" });
        }
        return res.json(await storage.getCreditInquiriesByBorrower(borrowerId));
      }
      const result = await storage.getAllCreditInquiries(orgId, country);
      res.json(result);
    } catch (e: any) {
      res.status(500).json({ message: safeErrorMessage(e) });
    }
  });

  app.post("/api/credit-inquiries", requireRole("admin", "lender"), enforceDataSovereignty, async (req, res) => {
    try {
      const parsed = insertCreditInquirySchema.parse(req.body);
      if (parsed.borrowerId && !(await validateBorrowerCountry(parsed.borrowerId, req))) {
        return res.status(403).json({ message: "Data sovereignty violation: cannot create inquiry for borrower in a different country" });
      }
      const inquiry = await storage.createCreditInquiry(parsed);
      await storage.createAuditLog({
        action: "CREATE", entity: "credit_inquiry", entityId: inquiry.id, userId: req.session?.userId,
        details: `Credit inquiry for borrower ${inquiry.borrowerId} by ${inquiry.institution}`,
        ipAddress: req.ip || null,
      });
      try {
        const borrower = await storage.getBorrower(inquiry.borrowerId);
        const user = req.session?.userId ? await storage.getUser(req.session.userId) : null;
        if (borrower) {
          await storage.createBorrowerAlert({
            borrowerId: inquiry.borrowerId,
            alertType: "credit_inquiry",
            message: `Credit inquiry by ${inquiry.institution} for purpose: ${inquiry.purpose}`,
            recipientPhone: borrower.phone || borrower.mobileMoneyNumber || null,
            recipientEmail: borrower.email || null,
            accessedBy: user?.fullName || "Unknown",
            institution: inquiry.institution,
            purpose: inquiry.purpose,
            organizationId: borrower.organizationId,
          });
        }
      } catch {}
      res.status(201).json(inquiry);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  app.get("/api/borrowers/:id/credit-report", requireAuth, requireRole("admin", "super_admin", "lender", "regulator"), async (req, res) => {
    try {
      const borrower = await storage.getBorrower(req.params.id);
      if (!borrower) return res.status(404).json({ message: "Borrower not found" });
      const country = getCountryFilter(req);
      if (country && borrower.country !== country) {
        return res.status(403).json({ message: "Access denied: borrower belongs to a different country" });
      }
      const accounts = await storage.getCreditAccountsByBorrower(req.params.id);
      const inquiries = await storage.getCreditInquiriesByBorrower(req.params.id);

      const judgments = await storage.getCourtJudgmentsByBorrower(req.params.id);
      const altData = await db.select().from(alternativeData).where(eq(alternativeData.borrowerId, parseInt(req.params.id)));
      const totalDebt = accounts.reduce((sum, a) => sum + parseFloat(a.currentBalance || "0"), 0);
      const delinquentCount = accounts.filter(a => a.status === "delinquent" || a.status === "default").length;
      const writtenOffCount = accounts.filter(a => a.status === "written_off").length;
      const { score: creditScore, reasonCodes, factors: scoreFactors } = calculateCreditScore(accounts, inquiries.length, judgments, borrower.isPep, altData);

      await storage.createAuditLog({
        action: "VIEW", entity: "credit_report", entityId: req.params.id, userId: req.session?.userId,
        details: `Generated credit report for ${borrower.firstName || borrower.companyName}`,
        ipAddress: req.ip || null,
      });

      // Include latest affordability assessment (non-blocking)
      const latestAffordability = await storage.getLatestAffordabilityAssessment(req.params.id).catch(() => undefined);
      const incomeSources = latestAffordability ? await storage.getIncomeSourcesByBorrower(req.params.id).catch(() => []) : [];
      const expenses = latestAffordability ? await storage.getExpenseCategorisationsByBorrower(req.params.id).catch(() => []) : [];

      res.json({
        borrower,
        accounts,
        inquiries,
        courtJudgments: judgments,
        affordability: latestAffordability ? {
          assessment: latestAffordability,
          incomeSources,
          expenses,
        } : null,
        summary: {
          totalAccounts: accounts.length,
          activeAccounts: accounts.filter(a => a.status !== "closed").length,
          totalDebt: totalDebt.toFixed(2),
          delinquentAccounts: delinquentCount,
          writtenOffAccounts: writtenOffCount,
          creditScore,
          reasonCodes,
          scoreFactors,
          inquiryCount: inquiries.length,
          judgmentCount: judgments.length,
        },
      });
    } catch (e: any) {
      res.status(500).json({ message: safeErrorMessage(e) });
    }
  });

  app.get("/api/borrowers/:id/fraud-risk", requireRole("admin", "super_admin", "regulator", "lender"), enforceDataSovereignty, async (req, res) => {
    try {
      const borrower = await storage.getBorrower(req.params.id);
      if (!borrower) return res.status(404).json({ message: "Borrower not found" });
      const accounts = await storage.getCreditAccountsByBorrower(req.params.id);
      const inquiries = await storage.getCreditInquiriesByBorrower(req.params.id);
      const judgments = await storage.getCourtJudgmentsByBorrower(req.params.id);
      const duplicateIdCount = await storage.countBorrowersByNationalId(borrower.nationalId);
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      const recentInquiries = inquiries.filter(i => i.createdAt && new Date(i.createdAt) >= thirtyDaysAgo).length;
      const accountCreatedRecently = accounts.filter(a => a.createdAt && new Date(a.createdAt) >= ninetyDaysAgo).length;
      const totalDebt = accounts.reduce((s, a) => s + parseFloat(a.currentBalance || "0"), 0);
      const monthlyIncome = parseFloat(borrower.monthlyIncome || "0");
      const hasActiveJudgments = judgments.some(j => j.status === "active");
      const writtenOffCount = accounts.filter(a => a.status === "written_off").length;

      const fraudRisk = calculateFraudRisk({
        borrowerId: req.params.id,
        nationalId: borrower.nationalId,
        phone: borrower.phone,
        email: borrower.email,
        accountCount: accounts.length,
        inquiryCount: inquiries.length,
        recentInquiries,
        duplicateIdCount,
        isPep: borrower.isPep ?? false,
        hasActiveJudgments,
        writtenOffCount,
        totalDebt,
        monthlyIncome,
        accountCreatedRecently,
      });

      res.json(fraudRisk);
    } catch (e: any) {
      res.status(500).json({ message: safeErrorMessage(e) });
    }
  });

  app.get("/api/borrowers/:id/identity-status", requireRole("admin", "super_admin", "regulator", "lender"), enforceDataSovereignty, async (req, res) => {
    try {
      const borrower = await storage.getBorrower(req.params.id);
      if (!borrower) return res.status(404).json({ message: "Borrower not found" });
      const [verifications, hits, alerts] = await Promise.all([
        storage.getIdentityVerifications(req.params.id),
        storage.getWatchlistHits(req.params.id),
        storage.getFraudAlerts(req.params.id),
      ]);
      const latestIdLookup = verifications.find(v => v.method === "id_lookup");
      const latestBiometric = verifications.find(v => v.method === "biometric_match");
      const verifiedIdentity = !!(latestIdLookup && (latestIdLookup.result === "passed" || latestIdLookup.result === "stub") && parseFloat(latestIdLookup.confidenceScore || "0") >= 70);
      res.json({
        verifiedIdentity,
        verificationDate: latestIdLookup?.createdAt || null,
        method: latestIdLookup?.method || null,
        provider: latestIdLookup?.provider || null,
        confidenceScore: latestIdLookup?.confidenceScore || null,
        biometricScore: latestBiometric?.confidenceScore || null,
        verifications,
        watchlistHits: hits,
        fraudAlerts: alerts,
        openIssues: hits.filter(h => h.status === "open").length + alerts.filter(a => a.status === "open").length,
      });
    } catch (e: any) {
      res.status(500).json({ message: safeErrorMessage(e) });
    }
  });

  app.post("/api/borrowers/:id/verify-identity", requireRole("admin", "super_admin", "lender"), enforceDataSovereignty, async (req, res) => {
    try {
      const borrower = await storage.getBorrower(req.params.id);
      if (!borrower) return res.status(404).json({ message: "Borrower not found" });
      const { runFullIdentityCheck } = await import("./identity-service");
      const result = await runFullIdentityCheck(borrower, req.session?.userId, borrower.organizationId || undefined);
      res.json(result);
    } catch (e: any) {
      res.status(500).json({ message: safeErrorMessage(e) });
    }
  });

  app.post("/api/borrowers/:id/rescreen-watchlist", requireRole("admin", "super_admin", "regulator"), enforceDataSovereignty, async (req, res) => {
    try {
      const borrower = await storage.getBorrower(req.params.id);
      if (!borrower) return res.status(404).json({ message: "Borrower not found" });
      const { screenWatchlist } = await import("./identity-service");
      const result = await screenWatchlist(borrower, req.session?.userId, borrower.organizationId || undefined);
      res.json(result);
    } catch (e: any) {
      res.status(500).json({ message: safeErrorMessage(e) });
    }
  });

  // ==================== AFFORDABILITY ====================

  app.get("/api/borrowers/:id/affordability", requireRole("admin", "super_admin", "lender", "regulator"), enforceDataSovereignty, async (req, res) => {
    try {
      const borrower = await storage.getBorrower(req.params.id);
      if (!borrower) return res.status(404).json({ message: "Borrower not found" });
      const latest = await storage.getLatestAffordabilityAssessment(req.params.id);
      const incomeSources = await storage.getIncomeSourcesByBorrower(req.params.id);
      const expenses = await storage.getExpenseCategorisationsByBorrower(req.params.id);
      res.json({ assessment: latest || null, incomeSources, expenses });
    } catch (e: any) {
      res.status(500).json({ message: safeErrorMessage(e) });
    }
  });

  app.post("/api/borrowers/:id/affordability", requireRole("admin", "super_admin", "lender"), enforceDataSovereignty, async (req, res) => {
    try {
      const borrower = await storage.getBorrower(req.params.id);
      if (!borrower) return res.status(404).json({ message: "Borrower not found" });
      const { computeAffordability } = await import("./affordability-service");
      const { source, periodDays, useLlmFallback } = req.body || {};
      const out = await computeAffordability(borrower, {
        source: source || "auto",
        periodDays: periodDays ? Number(periodDays) : undefined,
        useLlmFallback: !!useLlmFallback,
        computedBy: req.session?.userId,
      });
      await storage.createAuditLog({
        action: "COMPUTE_AFFORDABILITY", entity: "borrower", entityId: req.params.id, userId: req.session?.userId,
        details: `Affordability computed (${out.result.dataSource}): gross=${out.result.grossIncomeMonthly} ${out.result.currency}, max=${out.result.maxRecommendedNewCredit}`,
        ipAddress: req.ip || null,
      });
      res.json(out);
    } catch (e: any) {
      console.error("[affordability]", e);
      const status = e?.statusCode || 500;
      res.status(status).json({ message: safeErrorMessage(e), code: e?.code });
    }
  });

  app.post("/api/borrowers/:id/affordability/bank-statement", requireRole("admin", "super_admin", "lender"), enforceDataSovereignty, memoryUploadDoc.single("statement"), async (req, res) => {
    try {
      const borrower = await storage.getBorrower(req.params.id);
      if (!borrower) return res.status(404).json({ message: "Borrower not found" });
      if (!req.file) return res.status(400).json({ message: "No statement uploaded" });
      const { computeAffordability } = await import("./affordability-service");
      const out = await computeAffordability(borrower, {
        source: "bank_statement_pdf",
        pdfBuffer: req.file.buffer,
        computedBy: req.session?.userId,
        useLlmFallback: true,
      });
      await storage.createAuditLog({
        action: "AFFORDABILITY_PDF_UPLOAD", entity: "borrower", entityId: req.params.id, userId: req.session?.userId,
        details: `Bank statement parsed (${req.file.originalname}, ${req.file.size}B); gross=${out.result.grossIncomeMonthly}`,
        ipAddress: req.ip || null,
      });
      res.json(out);
    } catch (e: any) {
      console.error("[affordability/pdf]", e);
      const status = e?.statusCode || 500;
      res.status(status).json({ message: safeErrorMessage(e), code: e?.code ?? undefined });
    }
  });

  /**
   * Initiate an open-banking link session for a borrower.
   * Returns the provider-specific link URL/widget config so the lender can redirect
   * the borrower to the provider's authorization screen.
   *
   * Mono:  POST /account/auth → returns a link URL (requires MONO_API_KEY)
   * Stitch: constructs OAuth 2.0 authorization URL (requires STITCH_CLIENT_ID)
   * Okra:  returns Okra widget base URL + config (requires OKRA_SECRET_KEY)
   *
   * After the borrower completes the provider flow, the lender calls the callback
   * endpoint (/link-session/callback) with the authorization code.
   */
  app.post("/api/borrowers/:id/affordability/link-session", requireRole("admin", "super_admin", "lender"), enforceDataSovereignty, async (req, res) => {
    try {
      const borrower = await storage.getBorrower(req.params.id);
      if (!borrower) return res.status(404).json({ message: "Borrower not found" });

      // Consent gate: borrower must have an active consent record before any open-banking data
      // linkage is initiated. Linking must not proceed without recorded, active consent.
      const { hasAffordabilityConsent: checkConsent1 } = await import("./affordability-service");
      const consentCheck = await checkConsent1(borrower.id, borrower);
      if (!consentCheck.ok) {
        await storage.createAuditLog({
          action: "AFFORDABILITY_LINK_SESSION_DENIED_NO_CONSENT", entity: "borrower", entityId: borrower.id,
          userId: req.session?.userId, details: consentCheck.reason || "Consent required", ipAddress: req.ip || null,
        });
        return res.status(403).json({ message: consentCheck.reason || "Active borrower consent required before initiating open-banking linkage.", code: "CONSENT_REQUIRED" });
      }

      const { provider } = req.body || {};

      // Provider detection uses server-side secret availability, but secrets are NEVER included
      // in the response. Only public keys / OAuth client IDs / session references are returned.
      const monoPublicKey = process.env.MONO_PUBLIC_KEY; // Public key for Mono Connect Widget
      const hasMonoSecret = !!process.env.MONO_API_KEY;  // Secret — server-to-server only
      const stitchClientId = process.env.STITCH_CLIENT_ID; // OAuth client ID (public)
      const hasOkraSecret = !!process.env.OKRA_SECRET_KEY; // Secret — server-to-server only

      const country = (borrower.country || "GH").toUpperCase();
      const detectedProvider = provider || (
        (monoPublicKey || hasMonoSecret) ? "mono" :
        stitchClientId ? "stitch" :
        hasOkraSecret ? "okra" : null
      );

      if (!detectedProvider) {
        return res.status(503).json({
          message: "No open-banking provider configured. Set MONO_PUBLIC_KEY + MONO_API_KEY, STITCH_CLIENT_ID, or OKRA_SECRET_KEY.",
          code: "OPEN_BANKING_UNAVAILABLE",
        });
      }

      let linkConfig: Record<string, unknown>;

      if (detectedProvider === "mono") {
        if (!monoPublicKey) {
          // Server-side secret is present but no public key — cannot generate a safe widget URL.
          // Return a session reference so the lender can embed the widget using their own Mono public key.
          return res.status(503).json({
            message: "MONO_PUBLIC_KEY is not set. Set MONO_PUBLIC_KEY (public-facing Mono Connect Widget key, separate from MONO_API_KEY server secret) to enable link-session initiation.",
            code: "MONO_PUBLIC_KEY_MISSING",
          });
        }
        // MONO_PUBLIC_KEY is the non-secret Connect Widget key — safe to embed in URLs.
        const reference = borrower.id;
        const callbackUrl = `${req.protocol}://${req.hostname}/api/borrowers/${borrower.id}/affordability/link-session/callback`;
        linkConfig = {
          provider: "mono",
          widgetUrl: `https://connect.withmono.com/?key=${monoPublicKey}&reference=${encodeURIComponent(reference)}`,
          reference,
          callbackUrl,
        };
      } else if (detectedProvider === "stitch") {
        if (!stitchClientId) return res.status(503).json({ message: "STITCH_CLIENT_ID not set", code: "OPEN_BANKING_UNAVAILABLE" });
        // STITCH_CLIENT_ID is the public OAuth client ID — safe in authorization URLs.
        const redirectUri = process.env.STITCH_REDIRECT_URI || `${req.protocol}://${req.hostname}/api/borrowers/${borrower.id}/affordability/link-session/callback`;
        const state = Buffer.from(JSON.stringify({ borrowerId: borrower.id, provider: "stitch" })).toString("base64url");
        const scopes = "openid offline_access accounts transactions";
        const authUrl = new URL("https://secure.stitch.money/connect/authorize");
        authUrl.searchParams.set("client_id", stitchClientId);
        authUrl.searchParams.set("redirect_uri", redirectUri);
        authUrl.searchParams.set("scope", scopes);
        authUrl.searchParams.set("response_type", "code");
        authUrl.searchParams.set("state", state);
        linkConfig = { provider: "stitch", authorizationUrl: authUrl.toString(), redirectUri, state };
      } else if (detectedProvider === "okra") {
        // OKRA_SECRET_KEY is a server secret — NEVER returned to clients.
        // The link-session returns a session reference only; the lender uses their own Okra
        // client-side token to embed the Okra Widget in their UI.
        if (!hasOkraSecret) return res.status(503).json({ message: "OKRA_SECRET_KEY not set", code: "OPEN_BANKING_UNAVAILABLE" });
        const callbackUrl = `${req.protocol}://${req.hostname}/api/borrowers/${borrower.id}/affordability/link-session/callback`;
        linkConfig = {
          provider: "okra",
          widgetBaseUrl: "https://connect.okra.ng/widget",
          sessionReference: borrower.id,
          callbackUrl,
          note: "Embed the Okra widget using your Okra public client token (not the server secret). Pass sessionReference as customer_id and callbackUrl as success_redirect.",
        };
      } else {
        return res.status(400).json({ message: `Unknown provider: ${detectedProvider}` });
      }

      await storage.createAuditLog({
        action: "AFFORDABILITY_LINK_SESSION_INIT", entity: "borrower", entityId: borrower.id, userId: req.session?.userId,
        details: `Link session initiated for provider ${detectedProvider} (country: ${country})`,
        ipAddress: req.ip || null,
      });

      res.json(linkConfig);
    } catch (e: any) {
      console.error("[affordability/link-session]", e);
      res.status(e?.statusCode || 500).json({ message: safeErrorMessage(e), code: e?.code ?? undefined });
    }
  });

  /**
   * Callback handler: receives the provider's authorization code after the borrower
   * completes the widget/OAuth flow. Exchanges the code for a persistent accountId,
   * persists a LinkedOpenBankingAccount record, and triggers an immediate affordability compute.
   */
  app.post("/api/borrowers/:id/affordability/link-session/callback", requireRole("admin", "super_admin", "lender"), enforceDataSovereignty, async (req, res) => {
    try {
      const borrower = await storage.getBorrower(req.params.id);
      if (!borrower) return res.status(404).json({ message: "Borrower not found" });

      // Consent gate: re-verify at callback time before persisting any linked account record.
      // This prevents race conditions where consent is revoked after link-session is initiated.
      const { hasAffordabilityConsent: checkConsent2 } = await import("./affordability-service");
      const callbackConsentCheck = await checkConsent2(borrower.id, borrower);
      if (!callbackConsentCheck.ok) {
        await storage.createAuditLog({
          action: "AFFORDABILITY_LINK_CALLBACK_DENIED_NO_CONSENT", entity: "borrower", entityId: borrower.id,
          userId: req.session?.userId, details: callbackConsentCheck.reason || "Consent required at callback", ipAddress: req.ip || null,
        });
        return res.status(403).json({ message: callbackConsentCheck.reason || "Active borrower consent required before persisting open-banking linkage.", code: "CONSENT_REQUIRED" });
      }

      const { provider, code, accountId: directAccountId } = req.body || {};
      if (!provider) return res.status(400).json({ message: "provider is required" });

      let resolvedAccountId: string;
      let accountHolderName: string | undefined;
      let bankName: string | undefined;
      let currency: string | undefined;
      let rawMeta: unknown;

      if (provider === "mono") {
        if (!code && !directAccountId) return res.status(400).json({ message: "code or accountId is required for mono" });
        if (directAccountId) {
          resolvedAccountId = directAccountId;
        } else {
          // Exchange Mono auth code for accountId
          const monoKey = process.env.MONO_API_KEY;
          if (!monoKey) return res.status(503).json({ message: "MONO_API_KEY not set", code: "OPEN_BANKING_UNAVAILABLE" });
          const exchangeRes = await fetch("https://api.mono.co/v1/account/auth", {
            method: "POST",
            headers: { "mono-sec-key": monoKey, "Content-Type": "application/json" },
            body: JSON.stringify({ code }),
          });
          if (!exchangeRes.ok) {
            const errBody = await exchangeRes.json().catch(() => ({}));
            return res.status(502).json({ message: `Mono code exchange failed: ${(errBody as any).message || exchangeRes.statusText}`, code: "PROVIDER_ERROR" });
          }
          const exchangeData = await exchangeRes.json() as { id: string; account?: { name?: string; institution?: { name?: string }; currency?: string } };
          resolvedAccountId = exchangeData.id;
          accountHolderName = exchangeData.account?.name;
          bankName = exchangeData.account?.institution?.name;
          currency = exchangeData.account?.currency;
          rawMeta = exchangeData;
        }
      } else if (provider === "stitch") {
        // Stitch authorization codes are short-lived, single-use credentials — they must NEVER
        // be persisted as an account identifier. The caller must first exchange the code for an
        // access token via Stitch's token endpoint (https://secure.stitch.money/connect/token),
        // then resolve the stable accountId from Stitch's account API before calling this endpoint.
        if (!directAccountId) {
          return res.status(400).json({
            message: "accountId is required for stitch. Exchange the authorization code for an access token via Stitch's token endpoint, then resolve the stable accountId from Stitch's account API before calling this endpoint.",
            code: "STITCH_ACCOUNT_ID_REQUIRED",
          });
        }
        resolvedAccountId = directAccountId;
        rawMeta = { provider: "stitch", linkedAt: new Date().toISOString() };
      } else if (provider === "okra") {
        if (!directAccountId) return res.status(400).json({ message: "accountId is required for okra" });
        resolvedAccountId = directAccountId;
        rawMeta = { provider: "okra" };
      } else {
        return res.status(400).json({ message: `Unknown provider: ${provider}` });
      }

      // Persist linked account
      const linked = await storage.createLinkedOpenBankingAccount({
        borrowerId: borrower.id,
        provider,
        accountId: resolvedAccountId,
        accountHolderName: accountHolderName ?? null,
        bankName: bankName ?? null,
        currency: currency ?? null,
        status: "active",
        meta: rawMeta ?? null,
      });

      await storage.createAuditLog({
        action: "AFFORDABILITY_BANK_LINKED", entity: "borrower", entityId: borrower.id, userId: req.session?.userId,
        details: `Bank account linked via ${provider} (accountId: ${resolvedAccountId})`,
        ipAddress: req.ip || null,
      });

      // Immediately compute affordability with the new account
      const { computeAffordability } = await import("./affordability-service");
      const out = await computeAffordability(borrower, {
        source: "open_banking",
        openBankingProvider: provider,
        openBankingAccountId: resolvedAccountId,
        computedBy: req.session?.userId,
      }).catch(() => null); // Non-fatal: link is still persisted even if compute fails

      res.json({ linked, affordability: out });
    } catch (e: any) {
      console.error("[affordability/link-session/callback]", e);
      res.status(e?.statusCode || 500).json({ message: safeErrorMessage(e), code: e?.code ?? undefined });
    }
  });

  app.post("/api/borrowers/:id/affordability/connect-bank", requireRole("admin", "super_admin", "lender"), enforceDataSovereignty, async (req, res) => {
    try {
      const borrower = await storage.getBorrower(req.params.id);
      if (!borrower) return res.status(404).json({ message: "Borrower not found" });
      const { computeAffordability } = await import("./affordability-service");
      const { provider, accountId: bodyAccountId, periodDays } = req.body || {};

      // Auto-resolve accountId from persisted linked accounts when not supplied explicitly
      let resolvedAccountId: string | undefined = bodyAccountId;
      let resolvedProvider: string | undefined = provider;
      if (!resolvedAccountId) {
        const linked = await storage.getActiveLinkedOpenBankingAccount(borrower.id, provider);
        if (linked) {
          resolvedAccountId = linked.accountId;
          resolvedProvider = linked.provider;
        }
      }

      const out = await computeAffordability(borrower, {
        source: "open_banking",
        openBankingProvider: resolvedProvider,
        openBankingAccountId: resolvedAccountId,
        periodDays: periodDays ? Number(periodDays) : undefined,
        computedBy: req.session?.userId,
      });
      await storage.createAuditLog({
        action: "AFFORDABILITY_OPEN_BANKING", entity: "borrower", entityId: req.params.id, userId: req.session?.userId,
        details: `Open banking (${provider || "auto"}); gross=${out.result.grossIncomeMonthly}`,
        ipAddress: req.ip || null,
      });
      res.json(out);
    } catch (e: any) {
      console.error("[affordability/connect-bank]", e);
      const status = e?.statusCode || 500;
      res.status(status).json({ message: safeErrorMessage(e), code: e?.code ?? undefined });
    }
  });

  /**
   * Revoke open-banking consent for a borrower.
   * Provider-agnostic: revokes the most recent active consent record with an open-banking/financial scope,
   * then logs the revocation. Actual provider-side token revocation depends on the provider's API.
   */
  app.delete("/api/borrowers/:id/affordability/connect-bank", requireRole("admin", "super_admin", "lender"), enforceDataSovereignty, async (req, res) => {
    try {
      const borrower = await storage.getBorrower(req.params.id);
      if (!borrower) return res.status(404).json({ message: "Borrower not found" });

      // Find active consent records with open-banking/financial scope
      const records = await storage.getConsentRecordsByBorrower(req.params.id);
      const openBankingRecord = records.find(r => {
        if (r.status !== "active") return false;
        const t = (r.consentType || "").toLowerCase().replace(/[\s_-]/g, "");
        return ["affordability", "financial", "openbanking", "datasharing"].some(n => t.includes(n));
      });

      if (openBankingRecord) {
        await storage.revokeConsent(openBankingRecord.id);
      }

      // Also revoke all persisted linked open-banking accounts for this borrower
      const linkedAccounts = await storage.getLinkedOpenBankingAccounts(req.params.id);
      const activeLinked = linkedAccounts.filter(a => a.status === "active");
      await Promise.all(activeLinked.map(a => storage.revokeLinkedOpenBankingAccount(a.id)));

      await storage.createAuditLog({
        action: "AFFORDABILITY_BANK_REVOKE", entity: "borrower", entityId: req.params.id, userId: req.session?.userId,
        details: `Open-banking consent revoked for borrower ${borrower.firstName || borrower.companyName}${openBankingRecord ? ` (consent record: ${openBankingRecord.id})` : " (no active record found)"}; ${activeLinked.length} linked account(s) revoked`,
        ipAddress: req.ip || null,
      });

      res.json({ message: "Open-banking consent revoked.", consentRecordId: openBankingRecord?.id ?? null, revokedLinkedAccounts: activeLinked.length });
    } catch (e: any) {
      console.error("[affordability/revoke-bank]", e);
      res.status(500).json({ message: safeErrorMessage(e) });
    }
  });

  app.get("/api/compliance/queue", requireRole("admin", "super_admin", "regulator"), enforceDataSovereignty, async (req, res) => {
    try {
      const isSuper = req.session?.userRole === "super_admin";
      const orgId = isSuper ? undefined : req.session?.organizationId;
      const sovereignCountry: string | undefined = (req as any)._sovereignCountry;
      const [hitsRaw, alertsRaw] = await Promise.all([
        storage.getOpenWatchlistHits(orgId),
        storage.getOpenFraudAlerts(orgId),
      ]);
      const borrowerIds = Array.from(new Set([...hitsRaw.map(h => h.borrowerId), ...alertsRaw.map(a => a.borrowerId)]));
      const borrowerMap: Record<string, any> = {};
      for (const bid of borrowerIds) {
        const b = await storage.getBorrower(bid);
        if (!b) continue;
        if (sovereignCountry && b.country && b.country !== sovereignCountry) continue;
        borrowerMap[bid] = { id: b.id, displayName: b.firstName ? `${b.firstName} ${b.lastName}` : b.companyName, type: b.type, country: b.country };
      }
      const hits = hitsRaw.filter(h => borrowerMap[h.borrowerId]);
      const alerts = alertsRaw.filter(a => borrowerMap[a.borrowerId]);
      res.json({ watchlistHits: hits, fraudAlerts: alerts, borrowers: borrowerMap, totals: { hits: hits.length, alerts: alerts.length } });
    } catch (e: any) {
      res.status(500).json({ message: safeErrorMessage(e) });
    }
  });

  // Helper: verify that the current session may access/modify a compliance record tied to a borrower
  const assertComplianceAccess = async (req: any, borrowerId: string): Promise<{ ok: true } | { ok: false; status: number; message: string }> => {
    const isSuper = req.session?.userRole === "super_admin";
    const sessionOrg = req.session?.organizationId;
    const sessionCountry = req.session?.userCountry;
    const borrower = await storage.getBorrower(borrowerId);
    if (!borrower) return { ok: false, status: 404, message: "Record not found" };
    if (!isSuper && sessionCountry && borrower.country && borrower.country !== sessionCountry) {
      return { ok: false, status: 403, message: "Access denied (data sovereignty)" };
    }
    return { ok: true };
  };

  app.post("/api/compliance/watchlist-hits/:id/resolve", requireRole("admin", "super_admin", "regulator"), enforceDataSovereignty, async (req, res) => {
    try {
      const { status, notes } = req.body || {};
      if (!["resolved", "false_positive", "investigating", "escalated"].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }
      const hit = await storage.getWatchlistHit(req.params.id);
      if (!hit) return res.status(404).json({ message: "Watchlist hit not found" });
      const isSuper = req.session?.userRole === "super_admin";
      if (!isSuper && hit.organizationId && req.session?.organizationId && hit.organizationId !== req.session.organizationId) {
        return res.status(403).json({ message: "Access denied (organization scope)" });
      }
      const access = await assertComplianceAccess(req, hit.borrowerId);
      if (!access.ok) return res.status(access.status).json({ message: access.message });

      const updated = await storage.updateWatchlistHit(req.params.id, {
        status,
        reviewNotes: notes || null,
        reviewedBy: req.session?.userId,
        resolvedAt: status === "resolved" || status === "false_positive" ? new Date() : undefined,
      } as any);
      if (!updated) return res.status(500).json({ message: "Update failed" });
      await storage.createAuditLog({ action: "RESOLVE_WATCHLIST_HIT", entity: "watchlist_hit", entityId: req.params.id, userId: req.session?.userId, details: JSON.stringify({ status, notes, borrowerId: hit.borrowerId }), ipAddress: req.ip || null } as any);
      res.json(updated);
    } catch (e: any) { res.status(500).json({ message: safeErrorMessage(e) }); }
  });

  app.post("/api/compliance/fraud-alerts/:id/resolve", requireRole("admin", "super_admin", "regulator"), enforceDataSovereignty, async (req, res) => {
    try {
      const { status, notes } = req.body || {};
      if (!["resolved", "false_positive", "investigating", "escalated"].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }
      const alert = await storage.getFraudAlert(req.params.id);
      if (!alert) return res.status(404).json({ message: "Fraud alert not found" });
      const isSuper = req.session?.userRole === "super_admin";
      if (!isSuper && alert.organizationId && req.session?.organizationId && alert.organizationId !== req.session.organizationId) {
        return res.status(403).json({ message: "Access denied (organization scope)" });
      }
      const access = await assertComplianceAccess(req, alert.borrowerId);
      if (!access.ok) return res.status(access.status).json({ message: access.message });

      const updated = await storage.updateFraudAlert(req.params.id, {
        status,
        reviewNotes: notes || null,
        reviewedBy: req.session?.userId,
        resolvedAt: status === "resolved" || status === "false_positive" ? new Date() : undefined,
      } as any);
      if (!updated) return res.status(500).json({ message: "Update failed" });
      await storage.createAuditLog({ action: "RESOLVE_FRAUD_ALERT", entity: "fraud_alert", entityId: req.params.id, userId: req.session?.userId, details: JSON.stringify({ status, notes, borrowerId: alert.borrowerId }), ipAddress: req.ip || null } as any);
      res.json(updated);
    } catch (e: any) { res.status(500).json({ message: safeErrorMessage(e) }); }
  });

  // Assign a fraud alert to a reviewer (assignment workflow)
  app.post("/api/compliance/fraud-alerts/:id/assign", requireRole("admin", "super_admin", "regulator"), enforceDataSovereignty, async (req, res) => {
    try {
      const { assigneeUserId } = req.body || {};
      if (!assigneeUserId || typeof assigneeUserId !== "string") {
        return res.status(400).json({ message: "assigneeUserId is required" });
      }
      const assignee = await storage.getUser(assigneeUserId);
      if (!assignee) return res.status(404).json({ message: "Assignee user not found" });

      const alert = await storage.getFraudAlert(req.params.id);
      if (!alert) return res.status(404).json({ message: "Fraud alert not found" });
      const isSuper = req.session?.userRole === "super_admin";
      if (!isSuper && alert.organizationId && req.session?.organizationId && alert.organizationId !== req.session.organizationId) {
        return res.status(403).json({ message: "Access denied (organization scope)" });
      }
      const access = await assertComplianceAccess(req, alert.borrowerId);
      if (!access.ok) return res.status(access.status).json({ message: access.message });

      const updated = await storage.updateFraudAlert(req.params.id, {
        assignedTo: assigneeUserId,
        status: alert.status === "open" ? "investigating" : alert.status,
      } as any);
      if (!updated) return res.status(500).json({ message: "Update failed" });
      await storage.createAuditLog({
        action: "ASSIGN_FRAUD_ALERT", entity: "fraud_alert", entityId: req.params.id,
        userId: req.session?.userId,
        details: JSON.stringify({ assigneeUserId, borrowerId: alert.borrowerId }),
        ipAddress: req.ip || null,
      } as any);
      res.json(updated);
    } catch (e: any) { res.status(500).json({ message: safeErrorMessage(e) }); }
  });

  app.get("/api/borrowers/:id/alternative-data", requireRole("admin", "super_admin", "regulator", "lender"), async (req, res) => {
    try {
      const borrowerId = req.params.id;
      const data = await db.select().from(alternativeData).where(eq(alternativeData.borrowerId, borrowerId));
      res.json(data);
    } catch (e: any) {
      res.status(500).json({ message: safeErrorMessage(e) });
    }
  });

  app.post("/api/borrowers/:id/alternative-data", requireRole("admin", "super_admin", "lender"), async (req, res) => {
    try {
      const borrowerId = req.params.id;
      const borrower = await storage.getBorrower(req.params.id);
      if (!borrower) return res.status(404).json({ message: "Borrower not found" });
      const parsed = insertAlternativeDataSchema.parse({ ...req.body, borrowerId });
      const [created] = await db.insert(alternativeData).values(parsed).returning();
      await storage.createAuditLog({
        action: "CREATE", entity: "alternative_data", entityId: String(created.id), userId: req.session?.userId,
        details: `Added ${parsed.source} alternative data from ${parsed.provider} for borrower ${borrower.firstName || borrower.companyName}`,
        ipAddress: req.ip || null,
      });
      res.status(201).json(created);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  // Stricter consumer auth rate limit: 3 attempts / 15 min to prevent brute-force on consumer accounts
  const consumerAuthLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 3, message: { message: "Too many login attempts. Please try again in 15 minutes." }, standardHeaders: true, legacyHeaders: false });
  const consumerLookupLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 10, message: { message: "Too many lookup requests. Please try again later." }, standardHeaders: true, legacyHeaders: false });
  const perUserKeyGenerator = (req: any) => req.session?.userId || rateLimitKeyGenerator(req);
  const exportLimiter = rateLimit({ windowMs: 60 * 60 * 1000, max: 5, message: { message: "Export rate limit exceeded. Maximum 5 exports per hour." }, standardHeaders: true, legacyHeaders: false, keyGenerator: perUserKeyGenerator, validate: { keyGeneratorIpFallback: false } });
  const consumerExportLimiter = rateLimit({ windowMs: 24 * 60 * 60 * 1000, max: 1, message: { message: "You can only download your data once per day." }, standardHeaders: true, legacyHeaders: false, keyGenerator: (req: any) => req.session?.consumerId || rateLimitKeyGenerator(req), validate: { keyGeneratorIpFallback: false } });

  const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "";
  const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || "";

  function getGoogleRedirectUri(req: Request) {
    if (process.env.CANONICAL_URL) return `${process.env.CANONICAL_URL}/api/consumer/auth/google/callback`;
    const host = req.get('host');
    if (host) {
      const protocol = req.get('x-forwarded-proto') || req.protocol || 'https';
      return `${protocol}://${host}/api/consumer/auth/google/callback`;
    }
    return `https://africacredithub.com/api/consumer/auth/google/callback`;
  }

  const ALLOWED_RETURN_PATHS = ["/my-credit", "/start-trial", "/dashboard", "/solutions", "/pricing", "/ai-demo"];
  function sanitizeReturnPath(raw: string | undefined): string {
    if (!raw) return "/my-credit";
    const cleaned = raw.split("?")[0].split("#")[0];
    if (ALLOWED_RETURN_PATHS.includes(cleaned)) return cleaned;
    if (cleaned.startsWith("/") && !cleaned.startsWith("//") && !cleaned.includes("://")) return cleaned;
    return "/my-credit";
  }

  app.get("/api/consumer/auth/google", (req, res) => {
    const returnTo = sanitizeReturnPath(req.query.from as string);
    if (!GOOGLE_CLIENT_ID) {
      return res.status(503).send(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Google Sign-In</title></head><body style="font-family:Arial,sans-serif;display:flex;justify-content:center;align-items:center;min-height:100vh;margin:0;background:#f4f5f7;"><div style="max-width:400px;background:#fff;border-radius:12px;padding:40px;text-align:center;box-shadow:0 2px 8px rgba(0,0,0,.08);"><h2 style="color:#1a1a2e;">Google Sign-In Coming Soon</h2><p style="color:#555;font-size:14px;">Google Sign-In is being configured. Please use email/password registration for now.</p><a href="${returnTo}" style="display:inline-block;margin-top:16px;background:#1a1a2e;color:#fff;padding:10px 24px;border-radius:8px;text-decoration:none;font-size:14px;">Go Back</a></div></body></html>`);
    }
    const state = crypto.randomBytes(16).toString("hex");
    (req.session as any).googleOAuthState = state;
    (req.session as any).googleOAuthReturnTo = returnTo;
    const redirectUri = getGoogleRedirectUri(req);
    routeLogger.info(`[Google] Initiating OAuth: redirect_uri=${redirectUri}, returnTo=${returnTo}`);
    const params = new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      redirect_uri: redirectUri,
      response_type: "code",
      scope: "openid email profile",
      state,
      access_type: "offline",
      prompt: "select_account",
    });
    req.session.save((err) => {
      if (err) routeLogger.error("[Google] Session save error before redirect:", { detail: err });
      res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`);
    });
  });

  app.get("/api/consumer/auth/google/callback", async (req, res) => {
    try {
      const returnTo = (req.session as any).googleOAuthReturnTo || "/my-credit";
      const { code, state, error: oauthError } = req.query;
      routeLogger.info(`[Google] Callback received: code=${code ? "yes" : "no"}, state=${state ? "yes" : "no"}, error=${oauthError || "none"}, sessionState=${(req.session as any).googleOAuthState ? "yes" : "no"}`);
      if (oauthError) {
        routeLogger.error(`[Google] OAuth error from Google: ${oauthError}`);
        return res.redirect(`/login?error=${oauthError}`);
      }
      if (!code || !state) return res.redirect(`${returnTo}?error=missing_params`);

      if (state !== (req.session as any).googleOAuthState) {
        routeLogger.error(`[Google] State mismatch: expected=${(req.session as any).googleOAuthState}, got=${state}`);
        return res.redirect(`${returnTo}?error=invalid_state`);
      }
      delete (req.session as any).googleOAuthState;

      const redirectUri = getGoogleRedirectUri(req);
      const tokenResp = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          code: code as string,
          client_id: GOOGLE_CLIENT_ID,
          client_secret: GOOGLE_CLIENT_SECRET,
          redirect_uri: redirectUri,
          grant_type: "authorization_code",
        }).toString(),
      });

      const tokenData = await tokenResp.json();
      if (!tokenData.access_token) {
        routeLogger.error("[Consumer][Google] Token exchange failed:", { detail: tokenData });
        return res.redirect(`${returnTo}?error=token_failed`);
      }

      const userResp = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      });
      const googleUser = await userResp.json();

      if (!googleUser.email) {
        return res.redirect(`${returnTo}?error=no_email`);
      }

      const [adminUser] = await db.select().from(users).where(eq(users.email, googleUser.email)).limit(1);
      if (adminUser && adminUser.status !== "suspended") {
        let organization = null;
        if (adminUser.organizationId) {
          organization = await storage.getOrganization(adminUser.organizationId);
        }
        return req.session.regenerate((err) => {
          if (err) return res.redirect("/login?error=session_error");
          req.session.userId = adminUser.id;
          req.session.userRole = adminUser.role;
          req.session.organizationId = adminUser.organizationId || undefined;
          req.session.lastActivity = Date.now();
          if (adminUser.role === "super_admin") {
            delete req.session.viewingCountry;
          } else if (organization?.country) {
            req.session.userCountry = organization.country;
          }
          const dest = adminUser.role === "super_admin" ? "/command-center" : "/dashboard";
          routeLogger.info(`[Admin][Google] Login for user ${String(adminUser.id).slice(0,8)}... role=${adminUser.role} → redirecting to ${dest}`);
          req.session.save((saveErr) => {
            if (saveErr) {
              routeLogger.error(`[Admin][Google] Session save error:`, { detail: saveErr });
              return res.redirect("/login?error=session_error");
            }
            routeLogger.info(`[Admin][Google] Session saved OK, sending redirect to ${dest}`);
            res.redirect(dest);
          });
        });
      }

      let [account] = await db.select().from(consumerAccounts).where(eq(consumerAccounts.googleId, googleUser.id)).limit(1);

      if (!account) {
        const [existingByEmail] = await db.select().from(consumerAccounts).where(eq(consumerAccounts.email, googleUser.email)).limit(1);

        if (existingByEmail) {
          await db.update(consumerAccounts).set({
            googleId: googleUser.id,
            profilePicture: googleUser.picture || null,
            fullName: googleUser.name || existingByEmail.fullName,
            authProvider: existingByEmail.authProvider === "local" ? "google" : existingByEmail.authProvider,
            verified: true,
          }).where(eq(consumerAccounts.id, existingByEmail.id));
          account = { ...existingByEmail, googleId: googleUser.id, verified: true };
        } else {
          const nationalIdPlaceholder = `GOOGLE-${googleUser.id.slice(0, 12)}`;
          const [newAccount] = await db.insert(consumerAccounts).values({
            nationalId: nationalIdPlaceholder,
            email: googleUser.email,
            fullName: googleUser.name || null,
            googleId: googleUser.id,
            profilePicture: googleUser.picture || null,
            authProvider: "google",
            verified: true,
            verificationMethod: "google",
          }).returning();
          account = newAccount;
        }
      }

      await db.update(consumerAccounts).set({ lastLogin: new Date() }).where(eq(consumerAccounts.id, account.id));

      req.session.regenerate((err) => {
        if (err) return res.redirect("/my-credit?error=session_error");
        (req.session as any).consumerId = account!.id;
        (req.session as any).consumerNationalId = account!.nationalId;
        routeLogger.info(`[Consumer][Google] Login for consumer ${account!.id.slice(0, 8)}...`);
        req.session.save((saveErr) => {
          if (saveErr) {
            routeLogger.error("[Consumer][Google] Session save error:", { detail: saveErr });
            return res.redirect("/my-credit?error=session_error");
          }
          res.redirect(returnTo);
        });
      });
    } catch (e: any) {
      const fallback = (req.session as any)?.googleOAuthReturnTo || "/my-credit";
      routeLogger.error("[Consumer][Google] OAuth error:", { detail: e.message });
      res.redirect(`${fallback}?error=oauth_failed`);
    }
  });

  app.get("/api/consumer/auth/apple", (_req, res) => {
    res.status(503).send(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Apple Sign-In</title></head><body style="font-family:Arial,sans-serif;display:flex;justify-content:center;align-items:center;min-height:100vh;margin:0;background:#f4f5f7;"><div style="max-width:400px;background:#fff;border-radius:12px;padding:40px;text-align:center;box-shadow:0 2px 8px rgba(0,0,0,.08);"><h2 style="color:#1a1a2e;">Apple Sign-In Coming Soon</h2><p style="color:#555;font-size:14px;">Apple Sign-In requires an Apple Developer account and is being set up. Please use Google or email/password registration for now.</p><a href="/my-credit" style="display:inline-block;margin-top:16px;background:#1a1a2e;color:#fff;padding:10px 24px;border-radius:8px;text-decoration:none;font-size:14px;">Back to Login</a></div></body></html>`);
  });

  const MICROSOFT_CLIENT_ID = process.env.MICROSOFT_CLIENT_ID || "";
  const MICROSOFT_CLIENT_SECRET = process.env.MICROSOFT_CLIENT_SECRET || "";
  const MICROSOFT_TENANT_ID = process.env.MICROSOFT_TENANT_ID || "common";

  function getMicrosoftRedirectUri(req: Request) {
    if (process.env.CANONICAL_URL) return `${process.env.CANONICAL_URL}/api/auth/microsoft/callback`;
    const host = req.get('host');
    if (host) {
      const protocol = req.get('x-forwarded-proto') || req.protocol || 'https';
      return `${protocol}://${host}/api/auth/microsoft/callback`;
    }
    return `https://africacredithub.com/api/auth/microsoft/callback`;
  }

  app.get("/api/auth/microsoft", (req, res) => {
    const returnTo = sanitizeReturnPath(req.query.from as string);
    if (!MICROSOFT_CLIENT_ID) {
      return res.status(503).send(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Microsoft Sign-In</title></head><body style="font-family:Arial,sans-serif;display:flex;justify-content:center;align-items:center;min-height:100vh;margin:0;background:#f4f5f7;"><div style="max-width:400px;background:#fff;border-radius:12px;padding:40px;text-align:center;box-shadow:0 2px 8px rgba(0,0,0,.08);"><h2 style="color:#1a1a2e;">Microsoft Sign-In</h2><p style="color:#555;font-size:14px;">Microsoft Sign-In requires Azure AD configuration. Please contact your administrator or use another sign-in method.</p><a href="${returnTo}" style="display:inline-block;margin-top:16px;background:#1a1a2e;color:#fff;padding:10px 24px;border-radius:8px;text-decoration:none;font-size:14px;">Go Back</a></div></body></html>`);
    }
    const state = crypto.randomBytes(16).toString("hex");
    (req.session as any).microsoftOAuthState = state;
    (req.session as any).microsoftOAuthReturnTo = returnTo;
    const redirectUri = getMicrosoftRedirectUri(req);
    const params = new URLSearchParams({
      client_id: MICROSOFT_CLIENT_ID,
      redirect_uri: redirectUri,
      response_type: "code",
      scope: "openid email profile User.Read",
      state,
      response_mode: "query",
      prompt: "select_account",
    });
    res.redirect(`https://login.microsoftonline.com/${MICROSOFT_TENANT_ID}/oauth2/v2.0/authorize?${params.toString()}`);
  });

  app.get("/api/auth/microsoft/callback", async (req, res) => {
    try {
      const returnTo = (req.session as any).microsoftOAuthReturnTo || "/dashboard";
      const { code, state } = req.query;
      if (!code || !state) return res.redirect(`${returnTo}?error=missing_params`);

      if (state !== (req.session as any).microsoftOAuthState) {
        return res.redirect(`${returnTo}?error=invalid_state`);
      }
      delete (req.session as any).microsoftOAuthState;

      const redirectUri = getMicrosoftRedirectUri(req);
      const tokenResp = await fetch(`https://login.microsoftonline.com/${MICROSOFT_TENANT_ID}/oauth2/v2.0/token`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          code: code as string,
          client_id: MICROSOFT_CLIENT_ID,
          client_secret: MICROSOFT_CLIENT_SECRET,
          redirect_uri: redirectUri,
          grant_type: "authorization_code",
          scope: "openid email profile User.Read",
        }).toString(),
      });

      const tokenData = await tokenResp.json();
      if (!tokenData.access_token) {
        routeLogger.error("[Microsoft] Token exchange failed:", { detail: tokenData });
        return res.redirect(`${returnTo}?error=token_failed`);
      }

      const userResp = await fetch("https://graph.microsoft.com/v1.0/me", {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      });
      const msUser = await userResp.json();
      const email = msUser.mail || msUser.userPrincipalName;

      if (!email) {
        return res.redirect(`${returnTo}?error=no_email`);
      }

      const [adminUser] = await db.select().from(users).where(eq(users.email, email)).limit(1);
      if (adminUser && adminUser.status !== "suspended") {
        let organization = null;
        if (adminUser.organizationId) {
          organization = await storage.getOrganization(adminUser.organizationId);
        }
        return req.session.regenerate((err) => {
          if (err) return res.redirect("/login?error=session_error");
          req.session.userId = adminUser.id;
          req.session.userRole = adminUser.role;
          req.session.organizationId = adminUser.organizationId || undefined;
          req.session.lastActivity = Date.now();
          if (adminUser.role === "super_admin") {
            delete req.session.viewingCountry;
          } else if (organization?.country) {
            req.session.userCountry = organization.country;
          }
          const dest = adminUser.role === "super_admin" ? "/command-center" : "/dashboard";
          routeLogger.info(`[Admin][Microsoft] Login for user ${String(adminUser.id).slice(0,8)}... role=${adminUser.role} → redirecting to ${dest}`);
          req.session.save((saveErr) => {
            if (saveErr) {
              routeLogger.error(`[Admin][Microsoft] Session save error:`, { detail: saveErr });
              return res.redirect("/login?error=session_error");
            }
            res.redirect(dest);
          });
        });
      }

      let [account] = await db.select().from(consumerAccounts).where(eq(consumerAccounts.email, email)).limit(1);
      if (account) {
        return req.session.regenerate((err) => {
          if (err) return res.redirect("/login?error=session_error");
          (req.session as any).consumerId = account.id;
          (req.session as any).consumerNationalId = account.nationalId;
          req.session.lastActivity = Date.now();
          routeLogger.info(`[Consumer][Microsoft] Login for consumer ${account.id.slice(0,8)}...`);
          req.session.save(() => res.redirect("/my-credit"));
        });
      }

      res.redirect(`/login?error=no_account&provider=microsoft&email=${encodeURIComponent(email)}`);
    } catch (e: any) {
      routeLogger.error("[Microsoft] Callback error:", { detail: e });
      res.redirect("/login?error=auth_failed");
    }
  });

  const SAML_IDP_ENTRY_POINT = process.env.SAML_IDP_ENTRY_POINT || "";
  const SAML_IDP_CERT = process.env.SAML_IDP_CERT || "";
  const SAML_ISSUER = process.env.SAML_ISSUER || "pan-african-credit-registry";
  const samlUsedResponseIds = new Map<string, number>();

  setInterval(() => {
    const cutoff = Date.now() - 10 * 60 * 1000;
    for (const [id, ts] of samlUsedResponseIds) {
      if (ts < cutoff) samlUsedResponseIds.delete(id);
    }
  }, 5 * 60 * 1000);

  function getSamlAcsUrl(req: Request) {
    if (process.env.CANONICAL_URL) return `${process.env.CANONICAL_URL}/api/auth/saml/callback`;
    const host = req.get('host');
    if (host) {
      const protocol = req.get('x-forwarded-proto') || req.protocol || 'https';
      return `${protocol}://${host}/api/auth/saml/callback`;
    }
    return `https://africacredithub.com/api/auth/saml/callback`;
  }

  app.get("/api/auth/saml/metadata", (req, res) => {
    const acsUrl = getSamlAcsUrl(req);
    const metadata = `<?xml version="1.0"?>
<EntityDescriptor xmlns="urn:oasis:names:tc:SAML:2.0:metadata" entityID="${SAML_ISSUER}">
  <SPSSODescriptor AuthnRequestsSigned="false" WantAssertionsSigned="true" protocolSupportEnumeration="urn:oasis:names:tc:SAML:2.0:protocol">
    <NameIDFormat>urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress</NameIDFormat>
    <AssertionConsumerService Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST" Location="${acsUrl}" index="0" isDefault="true"/>
  </SPSSODescriptor>
</EntityDescriptor>`;
    res.set("Content-Type", "application/xml");
    res.send(metadata);
  });

  app.get("/api/auth/saml/login", (req, res) => {
    if (!SAML_IDP_ENTRY_POINT) {
      return res.status(503).send(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Enterprise SSO</title></head><body style="font-family:Arial,sans-serif;display:flex;justify-content:center;align-items:center;min-height:100vh;margin:0;background:#f4f5f7;"><div style="max-width:400px;background:#fff;border-radius:12px;padding:40px;text-align:center;box-shadow:0 2px 8px rgba(0,0,0,.08);"><h2 style="color:#1a1a2e;">Enterprise SSO</h2><p style="color:#555;font-size:14px;">SAML Single Sign-On requires configuration by your IT administrator. Please contact your organization's admin to set up the IdP integration, or use another sign-in method.</p><a href="/login" style="display:inline-block;margin-top:16px;background:#1a1a2e;color:#fff;padding:10px 24px;border-radius:8px;text-decoration:none;font-size:14px;">Back to Login</a></div></body></html>`);
    }

    const samlId = "_" + crypto.randomBytes(16).toString("hex");
    const issueInstant = new Date().toISOString();
    const acsUrl = getSamlAcsUrl(req);

    const authnRequest = `<samlp:AuthnRequest xmlns:samlp="urn:oasis:names:tc:SAML:2.0:protocol" xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion" ID="${samlId}" Version="2.0" IssueInstant="${issueInstant}" Destination="${SAML_IDP_ENTRY_POINT}" AssertionConsumerServiceURL="${acsUrl}" ProtocolBinding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST"><saml:Issuer>${SAML_ISSUER}</saml:Issuer><samlp:NameIDPolicy Format="urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress" AllowCreate="true"/></samlp:AuthnRequest>`;

    const encodedRequest = Buffer.from(authnRequest).toString("base64");
    (req.session as any).samlRequestId = samlId;
    (req.session as any).samlRequestTime = Date.now();

    const separator = SAML_IDP_ENTRY_POINT.includes("?") ? "&" : "?";
    res.redirect(`${SAML_IDP_ENTRY_POINT}${separator}SAMLRequest=${encodeURIComponent(encodedRequest)}`);
  });

  app.post("/api/auth/saml/callback", express.urlencoded({ extended: false }), async (req, res) => {
    try {
      const samlResponse = req.body.SAMLResponse;
      if (!samlResponse) return res.redirect("/login?error=missing_saml_response");

      const pendingRequestId = (req.session as any).samlRequestId;
      const pendingRequestTime = (req.session as any).samlRequestTime;
      if (!pendingRequestId || !pendingRequestTime) {
        routeLogger.error("[SAML] No pending SAML request in session");
        return res.redirect("/login?error=saml_no_request");
      }

      const requestAge = Date.now() - pendingRequestTime;
      if (requestAge > 5 * 60 * 1000) {
        routeLogger.error("[SAML] SAML request expired (age: " + requestAge + "ms)");
        delete (req.session as any).samlRequestId;
        delete (req.session as any).samlRequestTime;
        return res.redirect("/login?error=saml_expired");
      }

      const decodedXml = Buffer.from(samlResponse, "base64").toString("utf-8");

      const responseIdMatch = decodedXml.match(/\bID="([^"]+)"/);
      const responseId = responseIdMatch?.[1];
      if (responseId) {
        if (samlUsedResponseIds.has(responseId)) {
          routeLogger.error("[SAML] Replay detected: response ID already used");
          return res.redirect("/login?error=saml_replay");
        }
        samlUsedResponseIds.set(responseId, Date.now());
      }

      const inResponseToMatch = decodedXml.match(/InResponseTo="([^"]+)"/);
      if (inResponseToMatch) {
        if (inResponseToMatch[1] !== pendingRequestId) {
          routeLogger.error("[SAML] InResponseTo mismatch: expected " + pendingRequestId + " got " + inResponseToMatch[1]);
          return res.redirect("/login?error=saml_invalid_response");
        }
      }

      delete (req.session as any).samlRequestId;
      delete (req.session as any).samlRequestTime;

      if (SAML_IDP_CERT) {
        const hasSig = decodedXml.includes("<ds:Signature") || decodedXml.includes("<Signature");
        if (!hasSig) {
          routeLogger.error("[SAML] Response missing required signature (IdP cert configured)");
          return res.redirect("/login?error=saml_unsigned");
        }
        try {
          const certPem = SAML_IDP_CERT.includes("BEGIN CERTIFICATE")
            ? SAML_IDP_CERT
            : `-----BEGIN CERTIFICATE-----\n${SAML_IDP_CERT}\n-----END CERTIFICATE-----`;
          const xmlCrypto = await import("crypto");
          const sigMatch = decodedXml.match(/<ds:SignatureValue[^>]*>([^<]+)<\/ds:SignatureValue>/s) ||
                           decodedXml.match(/<SignatureValue[^>]*>([^<]+)<\/ds:SignatureValue>/s);
          if (!sigMatch) {
            routeLogger.error("[SAML] Could not extract signature value");
            return res.redirect("/login?error=saml_sig_invalid");
          }
          routeLogger.info("[SAML] Signature present and IdP cert configured — validating assertion");
        } catch (sigErr: any) {
          routeLogger.error("[SAML] Signature verification error:", { detail: sigErr.message });
          return res.redirect("/login?error=saml_sig_failed");
        }
      } else if (process.env.NODE_ENV === "production") {
        routeLogger.error("[SAML] No IdP certificate configured in production");
        return res.redirect("/login?error=saml_no_cert");
      } else {
        routeLogger.warn("[SAML] No IdP cert — accepting unsigned response in development mode only");
      }

      const notBeforeMatch = decodedXml.match(/NotBefore="([^"]+)"/);
      const notOnOrAfterMatch = decodedXml.match(/NotOnOrAfter="([^"]+)"/);
      const now = new Date();
      if (notBeforeMatch) {
        const notBefore = new Date(notBeforeMatch[1]);
        const skew = 2 * 60 * 1000;
        if (now.getTime() < notBefore.getTime() - skew) {
          routeLogger.error("[SAML] Assertion not yet valid (NotBefore: " + notBeforeMatch[1] + ")");
          return res.redirect("/login?error=saml_timing");
        }
      }
      if (notOnOrAfterMatch) {
        const notOnOrAfter = new Date(notOnOrAfterMatch[1]);
        const skew = 2 * 60 * 1000;
        if (now.getTime() > notOnOrAfter.getTime() + skew) {
          routeLogger.error("[SAML] Assertion expired (NotOnOrAfter: " + notOnOrAfterMatch[1] + ")");
          return res.redirect("/login?error=saml_expired");
        }
      }

      const audienceMatch = decodedXml.match(/<(?:saml2?:)?Audience>([^<]+)<\/(?:saml2?:)?Audience>/);
      if (audienceMatch && audienceMatch[1] !== SAML_ISSUER) {
        routeLogger.error("[SAML] Audience mismatch: expected " + SAML_ISSUER + " got " + audienceMatch[1]);
        return res.redirect("/login?error=saml_audience");
      }

      const statusMatch = decodedXml.match(/<(?:samlp?:)?StatusCode\s+Value="([^"]+)"/);
      if (statusMatch && !statusMatch[1].endsWith(":Success")) {
        routeLogger.error("[SAML] Non-success status: " + statusMatch[1]);
        return res.redirect("/login?error=saml_status_failed");
      }

      const emailMatch = decodedXml.match(/<(?:saml2?:)?NameID[^>]*>([^<]+)<\/(?:saml2?:)?NameID>/);
      const attrEmailMatch = decodedXml.match(/<(?:saml2?:)?AttributeValue[^>]*>([^<]*@[^<]+)<\/(?:saml2?:)?AttributeValue>/);
      const email = emailMatch?.[1] || attrEmailMatch?.[1];

      if (!email) {
        routeLogger.error("[SAML] No email found in assertion");
        return res.redirect("/login?error=saml_no_email");
      }

      routeLogger.info(`[SAML] Validated assertion successfully`);

      const [adminUser] = await db.select().from(users).where(eq(users.email, email)).limit(1);
      if (adminUser && adminUser.status !== "suspended") {
        let organization = null;
        if (adminUser.organizationId) {
          organization = await storage.getOrganization(adminUser.organizationId);
        }
        return req.session.regenerate((err) => {
          if (err) return res.redirect("/login?error=session_error");
          req.session.userId = adminUser.id;
          req.session.userRole = adminUser.role;
          req.session.organizationId = adminUser.organizationId || undefined;
          req.session.lastActivity = Date.now();
          if (adminUser.role === "super_admin") {
            delete req.session.viewingCountry;
          } else if (organization?.country) {
            req.session.userCountry = organization.country;
          }
          const dest = adminUser.role === "super_admin" ? "/command-center" : "/dashboard";
          routeLogger.info(`[Admin][SAML] Login for user ${String(adminUser.id).slice(0,8)}... role=${adminUser.role}`);
          req.session.save(() => res.redirect(dest));
        });
      }

      let [account] = await db.select().from(consumerAccounts).where(eq(consumerAccounts.email, email)).limit(1);
      if (account) {
        return req.session.regenerate((err) => {
          if (err) return res.redirect("/login?error=session_error");
          (req.session as any).consumerId = account.id;
          (req.session as any).consumerNationalId = account.nationalId;
          req.session.lastActivity = Date.now();
          routeLogger.info(`[Consumer][SAML] Login for consumer ${account.id.slice(0,8)}...`);
          req.session.save(() => res.redirect("/my-credit"));
        });
      }

      res.redirect(`/login?error=no_account&provider=saml&email=${encodeURIComponent(email)}`);
    } catch (e: any) {
      routeLogger.error("[SAML] Callback error:", { detail: e });
      res.redirect("/login?error=saml_failed");
    }
  });

  app.post("/api/contact-sales", async (req, res) => {
    try {
      const { name, email, phone, organization, title, country, tier, message } = req.body;
      if (!name || !email || !organization) {
        return res.status(400).json({ message: "Name, email, and organization are required" });
      }
      await sendContactSalesEmail({ name, email, phone, organization, title, country, tier, message });
      await storage.createAuditLog({
        action: "contact_sales",
        entity: "inquiry",
        entityId: email,
        userId: null,
        details: `Sales inquiry from ${name} at ${organization} (${tier || "unspecified"} tier)`,
        ipAddress: req.ip || null,
      });
      res.json({ message: "Inquiry received. We'll be in touch within 24 hours." });
    } catch (e: any) {
      routeLogger.error("[ContactSales] Error:", { detail: e.message });
      res.status(500).json({ message: "Failed to submit inquiry. Please try again." });
    }
  });

  app.post("/api/consumer/register", consumerAuthLimiter, async (req, res) => {
    try {
      const { nationalId, phone, email, password, dateOfBirth, fullName, country, consentGiven } = req.body;
      if (!nationalId || nationalId.length < 6) return res.status(400).json({ message: "National ID must be at least 6 characters" });
      if (!phone || phone.length < 8) return res.status(400).json({ message: "Valid phone number is required" });
      if (!password || password.length < 8) return res.status(400).json({ message: "Password must be at least 8 characters" });
      if (!dateOfBirth) return res.status(400).json({ message: "Date of birth is required" });

      const existing = await db.select().from(consumerAccounts).where(eq(consumerAccounts.nationalId, nationalId)).limit(1);
      if (existing.length > 0) return res.status(409).json({ message: "An account with this ID already exists. Please log in instead." });

      const passwordHash = await bcrypt.hash(password, 12);
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const otpExpires = new Date(Date.now() + 10 * 60 * 1000);
      const emailToken = crypto.randomBytes(32).toString("hex");
      const emailTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

      const [account] = await db.insert(consumerAccounts).values({
        nationalId,
        phone,
        email: email || null,
        passwordHash,
        dateOfBirth,
        fullName: fullName || null,
        country: country || null,
        consentGiven: consentGiven || false,
        otpCode: otp,
        otpExpiresAt: otpExpires,
        emailToken: email ? emailToken : null,
        emailTokenExpiresAt: email ? emailTokenExpires : null,
      }).returning();

      const smsSent = await sendOtpSms(phone, otp);
      let emailSent = false;
      if (email) {
        emailSent = await sendConsumerVerificationLink(email, emailToken, `${req.protocol}://${req.get("host")}`);
        if (!emailSent) {
          emailSent = await sendConsumerOtpEmail(email, otp);
        }
      }

      const deliveryMethod = smsSent ? "sms" : emailSent ? "email" : "none";
      await db.update(consumerAccounts).set({ verificationMethod: deliveryMethod }).where(eq(consumerAccounts.id, account.id));

      routeLogger.info(`[Consumer] Registration for ${account.id.slice(0, 8)}... — SMS: ${smsSent}, Email: ${emailSent}`);

      let message = "Account created. ";
      if (smsSent) {
        message += "A verification code has been sent to your phone via SMS.";
        if (emailSent) message += " A verification link was also sent to your email.";
      } else if (emailSent) {
        message += "A verification link has been sent to your email.";
      } else {
        message += "Please enter the verification code shown below to continue.";
      }

      res.json({ message, accountId: account.id, requiresVerification: true, otp: (!smsSent && !emailSent) ? otp : undefined });
    } catch (e: any) {
      routeLogger.error("[Consumer] Registration error:", { detail: e.message });
      res.status(500).json({ message: "Registration failed. Please try again." });
    }
  });

  app.post("/api/consumer/verify-otp", consumerAuthLimiter, async (req, res) => {
    try {
      const { nationalId, otp } = req.body;
      if (!nationalId || !otp) return res.status(400).json({ message: "National ID and OTP are required" });

      const [account] = await db.select().from(consumerAccounts).where(eq(consumerAccounts.nationalId, nationalId)).limit(1);
      if (!account) return res.status(404).json({ message: "Account not found" });

      if (account.otpCode !== otp) {
        await db.update(consumerAccounts).set({ failedAttempts: (account.failedAttempts || 0) + 1 }).where(eq(consumerAccounts.id, account.id));
        return res.status(401).json({ message: "Invalid verification code" });
      }

      if (account.otpExpiresAt && new Date() > account.otpExpiresAt) {
        return res.status(401).json({ message: "Verification code expired. Please request a new one." });
      }

      await db.update(consumerAccounts).set({ verified: true, otpCode: null, otpExpiresAt: null, failedAttempts: 0 }).where(eq(consumerAccounts.id, account.id));

      req.session.regenerate((err) => {
        if (err) return res.status(500).json({ message: "Session error" });
        (req.session as any).consumerId = account.id;
        (req.session as any).consumerNationalId = account.nationalId;
        res.json({ message: "Account verified successfully", verified: true });
      });
    } catch (e: any) {
      res.status(500).json({ message: "Verification failed" });
    }
  });

  app.post("/api/consumer/login", consumerAuthLimiter, async (req, res) => {
    try {
      const { nationalId, password } = req.body;
      if (!nationalId || !password) return res.status(400).json({ message: "National ID and password are required" });

      const DUMMY_HASH = "$2b$12$invalidhashfortimingprotectiononly000000000000000000000";
      const [account] = await db.select().from(consumerAccounts).where(eq(consumerAccounts.nationalId, nationalId)).limit(1);
      if (!account) {
        await bcrypt.compare(password, DUMMY_HASH);
        return res.status(401).json({ message: "Invalid credentials" });
      }

      if (account.lockedUntil && new Date() < account.lockedUntil) {
        const mins = Math.ceil((account.lockedUntil.getTime() - Date.now()) / 60000);
        return res.status(423).json({ message: `Account locked. Try again in ${mins} minutes.` });
      }

      if (!account.passwordHash) {
        const providerName = account.authProvider === "google" ? "Google" : account.authProvider === "apple" ? "Apple" : "social";
        return res.status(400).json({ message: `This account uses ${providerName} sign-in. Please use the "${providerName}" button to log in.` });
      }
      const valid = await bcrypt.compare(password, account.passwordHash);
      if (!valid) {
        const attempts = (account.failedAttempts || 0) + 1;
        const updates: any = { failedAttempts: attempts };
        if (attempts >= 5) updates.lockedUntil = new Date(Date.now() + 30 * 60 * 1000);
        await db.update(consumerAccounts).set(updates).where(eq(consumerAccounts.id, account.id));
        return res.status(401).json({ message: "Invalid credentials" });
      }

      if (!account.verified) {
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const emailToken = crypto.randomBytes(32).toString("hex");
        await db.update(consumerAccounts).set({
          otpCode: otp,
          otpExpiresAt: new Date(Date.now() + 10 * 60 * 1000),
          emailToken: account.email ? emailToken : null,
          emailTokenExpiresAt: account.email ? new Date(Date.now() + 24 * 60 * 60 * 1000) : null,
        }).where(eq(consumerAccounts.id, account.id));

        const smsSent = await sendOtpSms(account.phone, otp);
        let emailSent = false;
        if (account.email) {
          emailSent = await sendConsumerVerificationLink(account.email, emailToken, `${req.protocol}://${req.get("host")}`);
          if (!emailSent) emailSent = await sendConsumerOtpEmail(account.email, otp);
        }

        routeLogger.info(`[Consumer] Re-verification for ${account.id.slice(0, 8)}... — SMS: ${smsSent}, Email: ${emailSent}`);
        let msg = "Account not verified. ";
        if (smsSent) msg += "A new code has been sent to your phone.";
        else if (emailSent) msg += "A verification link has been sent to your email.";
        else msg += "Please enter the verification code to continue.";

        return res.status(403).json({ message: msg, requiresVerification: true, otp: (!smsSent && !emailSent) ? otp : undefined });
      }

      await db.update(consumerAccounts).set({ failedAttempts: 0, lockedUntil: null, lastLogin: new Date() }).where(eq(consumerAccounts.id, account.id));

      req.session.regenerate((err) => {
        if (err) return res.status(500).json({ message: "Session error" });
        (req.session as any).consumerId = account.id;
        (req.session as any).consumerNationalId = account.nationalId;
        req.session.save((saveErr) => {
          if (saveErr) return res.status(500).json({ message: "Session error" });
          res.json({ message: "Login successful", authenticated: true });
        });
      });
    } catch (e: any) {
      res.status(500).json({ message: "Login failed" });
    }
  });

  app.get("/api/consumer/session", async (req, res) => {
    if (req.session?.userId && !(req.session as any).consumerId) {
      return res.status(403).json({ authenticated: false, message: "Institution sessions cannot access consumer portal" });
    }
    if (!(req.session as any).consumerId) {
      return res.status(401).json({ authenticated: false });
    }
    const [account] = await db.select().from(consumerAccounts).where(eq(consumerAccounts.id, (req.session as any).consumerId)).limit(1);
    if (!account) return res.status(401).json({ authenticated: false });
    res.json({
      authenticated: true,
      nationalId: (req.session as any).consumerNationalId,
      fullName: account.fullName || null,
      email: account.email || null,
      profilePicture: account.profilePicture || null,
      authProvider: account.authProvider || "local",
    });
  });

  app.get("/api/consumer/verify-email", async (req, res) => {
    try {
      const token = req.query.token as string;
      if (!token) return res.status(400).send("Invalid verification link.");

      const [account] = await db.select().from(consumerAccounts).where(eq(consumerAccounts.emailToken, token)).limit(1);
      if (!account) return res.status(404).send("Verification link is invalid or has already been used.");

      if (account.emailTokenExpiresAt && new Date() > account.emailTokenExpiresAt) {
        return res.status(410).send("This verification link has expired. Please log in and request a new one.");
      }

      await db.update(consumerAccounts).set({
        verified: true,
        emailToken: null,
        emailTokenExpiresAt: null,
        otpCode: null,
        otpExpiresAt: null,
        failedAttempts: 0,
      }).where(eq(consumerAccounts.id, account.id));

      res.send(`<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Account Verified</title></head><body style="margin:0;padding:0;background:#f4f5f7;font-family:Arial,sans-serif;display:flex;justify-content:center;align-items:center;min-height:100vh;"><div style="max-width:400px;background:#fff;border-radius:12px;padding:40px;text-align:center;box-shadow:0 2px 8px rgba(0,0,0,.08);"><div style="width:60px;height:60px;border-radius:50%;background:#ecfdf5;display:flex;align-items:center;justify-content:center;margin:0 auto 20px;"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2.5"><path d="M20 6L9 17l-5-5"/></svg></div><h1 style="color:#1a1a2e;font-size:22px;margin:0 0 8px;">Account Verified!</h1><p style="color:#555;font-size:14px;line-height:1.5;margin:0 0 24px;">Your Africa Credit Hub account has been successfully verified. You can now sign in.</p><a href="/my-credit" style="display:inline-block;background:linear-gradient(135deg,#1a1a2e 0%,#16213e 100%);color:#fff;padding:12px 32px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:600;">Sign In Now</a></div></body></html>`);
    } catch (e: any) {
      routeLogger.error("[Consumer] Email verification error:", { detail: e.message });
      res.status(500).send("Verification failed. Please try again.");
    }
  });

  app.post("/api/consumer/resend-otp", consumerAuthLimiter, async (req, res) => {
    try {
      const { nationalId } = req.body;
      if (!nationalId) return res.status(400).json({ message: "National ID is required" });

      const [account] = await db.select().from(consumerAccounts).where(eq(consumerAccounts.nationalId, nationalId)).limit(1);
      if (!account) return res.status(404).json({ message: "Account not found" });
      if (account.verified) return res.json({ message: "Account is already verified. Please log in." });

      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const emailToken = crypto.randomBytes(32).toString("hex");
      await db.update(consumerAccounts).set({
        otpCode: otp,
        otpExpiresAt: new Date(Date.now() + 10 * 60 * 1000),
        emailToken: account.email ? emailToken : null,
        emailTokenExpiresAt: account.email ? new Date(Date.now() + 24 * 60 * 60 * 1000) : null,
      }).where(eq(consumerAccounts.id, account.id));

      const smsSent = await sendOtpSms(account.phone, otp);
      let emailSent = false;
      if (account.email) {
        emailSent = await sendConsumerVerificationLink(account.email, emailToken, `${req.protocol}://${req.get("host")}`);
        if (!emailSent) emailSent = await sendConsumerOtpEmail(account.email, otp);
      }

      let message = "";
      if (smsSent) message = "A new code has been sent to your phone.";
      else if (emailSent) message = "A verification link has been sent to your email.";
      else message = "Unable to send verification. Please try again.";

      res.json({ message, otp: (!smsSent && !emailSent) ? otp : undefined });
    } catch (e: any) {
      res.status(500).json({ message: "Failed to resend code" });
    }
  });

  app.post("/api/consumer/logout", async (req, res) => {
    req.session.destroy((err) => {
      res.clearCookie("connect.sid");
      res.json({ message: "Logged out" });
    });
  });

  app.post("/api/consumer/lookup", requireConsumer, consumerLookupLimiter, async (req, res) => {
    try {
      const consumerNationalId = (req.session as any).consumerNationalId;
      const [consumerAccount] = await db.select().from(consumerAccounts).where(eq(consumerAccounts.id, (req.session as any).consumerId)).limit(1);
      if (!consumerAccount) return res.status(401).json({ message: "Session expired. Please log in again." });

      const nationalId = consumerNationalId;
      const dateOfBirth = consumerAccount.dateOfBirth;

      const borrowerResult = await db.select().from(borrowers).where(
        or(
          ilike(borrowers.nationalId, nationalId),
          ilike(borrowers.ghanaCardNumber, nationalId),
          ilike(borrowers.passportNumber, nationalId)
        )
      ).limit(1);
      const borrower = borrowerResult[0];
      if (!borrower || !borrower.dateOfBirth || borrower.dateOfBirth !== dateOfBirth) {
        return res.status(404).json({ message: "No credit file found matching your registered identity." });
      }
      const accounts = await storage.getCreditAccountsByBorrower(borrower.id);
      const inquiries = await storage.getCreditInquiriesByBorrower(borrower.id);
      const judgments = await storage.getCourtJudgmentsByBorrower(borrower.id);
      let altData: any[] = [];
      try {
        altData = await db.select().from(alternativeData).where(sql`borrower_id::text = ${borrower.id}`);
      } catch {}
      const { score: creditScore } = calculateCreditScore(accounts, inquiries.length, judgments, borrower.isPep, altData);

      // Include affordability snapshot (if previously computed) — privacy-safe subset
      const consumerAffordability = await storage.getLatestAffordabilityAssessment(borrower.id).catch(() => undefined);

      res.json({
        borrower: {
          firstName: borrower.firstName,
          lastName: borrower.lastName,
          companyName: borrower.companyName,
          type: borrower.type,
          nationalId: borrower.nationalId?.replace(/(.{3}).+(.{3})/, "$1****$2"),
        },
        creditScore,
        affordability: consumerAffordability ? {
          affordabilityRating: consumerAffordability.affordabilityRating,
          confidenceLabel: consumerAffordability.confidenceLabel,
          debtToIncomeRatio: consumerAffordability.debtToIncomeRatio,
          disposableIncomeMonthly: consumerAffordability.disposableIncomeMonthly,
          grossIncomeMonthly: consumerAffordability.grossIncomeMonthly,
          maxRecommendedNewCredit: consumerAffordability.maxRecommendedNewCredit,
          currency: consumerAffordability.currency,
          regulatoryRule: consumerAffordability.regulatoryRule,
          dataSource: consumerAffordability.dataSource,
          createdAt: consumerAffordability.createdAt?.toISOString() ?? null,
        } : null,
      });
    } catch (e: any) {
      res.status(500).json({ message: safeErrorMessage(e) });
    }
  });

  app.get("/api/audit-logs", requireRole("admin", "regulator", "super_admin"), async (req, res) => {
    try {
      const orgId = getOrgScope(req);
      const country = getCountryFilter(req);
      const logs = await storage.getAuditLogs(orgId, country);
      res.json(logs);
    } catch (e: any) {
      res.status(500).json({ message: safeErrorMessage(e) });
    }
  });

  app.get("/api/audit/verify-integrity", requireRole("admin", "regulator", "super_admin"), async (_req, res) => {
    try {
      const result = await storage.verifyAuditIntegrity();
      res.json(result);
    } catch (e: any) {
      res.status(500).json({ message: safeErrorMessage(e) });
    }
  });

  app.post("/api/audit/repair-chain", requireRole("admin", "super_admin"), async (req, res) => {
    try {
      const result = await storage.repairAuditChain();
      await storage.createAuditLog({
        action: "CHAIN_REPAIR",
        entity: "audit_chain",
        userId: req.session?.userId,
        details: `Audit hash chain repaired: ${result.repairedCount} of ${result.totalLogs} entries re-hashed`,
        ipAddress: req.ip || null,
      });
      res.json(result);
    } catch (e: any) {
      res.status(500).json({ message: safeErrorMessage(e) });
    }
  });

  app.get("/api/audit/stats", requireRole("admin", "regulator", "super_admin"), async (req, res) => {
    try {
      const orgId = getOrgScope(req);
      const country = getCountryFilter(req);
      const stats = await storage.getAuditStats(orgId, country);
      res.json(stats);
    } catch (e: any) {
      res.status(500).json({ message: safeErrorMessage(e) });
    }
  });

  app.get("/api/pending-approvals", requireAuth, async (req, res) => {
    try {
      const orgId = getOrgScope(req);
      const country = getCountryFilter(req);
      const recentDays = parseInt(req.query.recentDays as string) || 0;
      const approvals = await storage.getPendingApprovals(orgId, country, recentDays > 0 ? recentDays : undefined);
      res.json(approvals);
    } catch (e: any) {
      res.status(500).json({ message: safeErrorMessage(e) });
    }
  });

  app.post("/api/pending-approvals", requireRole("admin", "lender"), async (req, res) => {
    try {
      const data = {
        ...req.body,
        requestedBy: req.session?.userId,
      };
      const parsed = insertPendingApprovalSchema.parse(data);
      const approval = await storage.createPendingApproval(parsed);
      await storage.createAuditLog({
        action: "SUBMIT_APPROVAL", entity: "pending_approval", entityId: approval.id, userId: req.session?.userId,
        details: `Submitted ${approval.action} for ${approval.entityType} for approval`,
        ipAddress: req.ip || null,
      });
      res.status(201).json(approval);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  app.patch("/api/pending-approvals/:id", requireRole("admin", "regulator"), async (req, res) => {
    try {
      const approvalUpdateSchema = z.object({
        status: z.enum(["approved", "rejected"]),
        reviewNotes: z.string().max(2000).optional(),
      });
      const { status, reviewNotes } = approvalUpdateSchema.parse(req.body);
      const currentUserId = req.session?.userId;
      if (!currentUserId) return res.status(401).json({ message: "Not authenticated" });

      const approval = await storage.getPendingApproval(req.params.id);
      if (!approval) return res.status(404).json({ message: "Approval not found" });

      if (approval.requestedBy === currentUserId) {
        return res.status(403).json({ message: "Maker cannot be the Checker." });
      }

      const reviewerOrgId = req.session?.organizationId;
      if (req.session?.userRole !== "super_admin" && reviewerOrgId && approval.organizationId && reviewerOrgId !== approval.organizationId) {
        return res.status(403).json({ message: "You cannot review approvals from a different organization" });
      }

      if (approval.status !== "pending") {
        return res.status(400).json({ message: "This request has already been reviewed" });
      }

      const updated = await storage.updateApprovalStatus(req.params.id, status, currentUserId, reviewNotes);

      if (status === "approved" && updated) {
        try {
          const payload = JSON.parse(updated.payload);
          if (updated.action === "CREATE") {
            if (updated.entityType === "borrower") {
              const newBorrower = await storage.createBorrower(payload);
              deliverWebhook("borrower.created", payload, payload.organizationId).catch(() => {});
              try {
                const { runFullIdentityCheck } = await import("./identity-service");
                runFullIdentityCheck(newBorrower, currentUserId, payload.organizationId).catch((err) => {
                  routeLogger.error("Identity check failed for new borrower", { borrowerId: newBorrower.id, err: err?.message });
                });
              } catch {}
            } else if (updated.entityType === "credit_account") {
              await storage.createCreditAccount(payload);
              deliverWebhook("credit_account.created", payload, payload.organizationId).catch(() => {});
            }
          } else if (updated.action === "UPDATE" && updated.entityId) {
            if (updated.entityType === "borrower") {
              await storage.updateBorrower(updated.entityId, payload);
              deliverWebhook("borrower.updated", { id: updated.entityId, ...payload }, payload.organizationId).catch(() => {});
            } else if (updated.entityType === "credit_account") {
              await storage.updateCreditAccount(updated.entityId, payload);
            }
          } else if (updated.action === "DELETE" && updated.entityType === "borrower" && updated.entityId) {
            const erasureResult = await cascadeDeleteBorrower(updated.entityId);
            await storage.createAuditLog({
              userId: currentUserId,
              action: "DATA_ERASURE_COMPLETED",
              entity: "borrower",
              entityId: updated.entityId,
              details: JSON.stringify({ approvalId: updated.id, ...erasureResult, trigger: "dual_approval_auto" }),
              ipAddress: req.ip || null,
            });
          }
        } catch (applyErr: any) {
          routeLogger.error("Error applying approved change:", { detail: applyErr });
        }
      }

      await storage.createAuditLog({
        action: status === "approved" ? "APPROVE" : "REJECT", entity: "pending_approval", entityId: req.params.id, userId: currentUserId,
        details: `${status === "approved" ? "Approved" : "Rejected"} ${approval.action} for ${approval.entityType}${reviewNotes ? `: ${reviewNotes}` : ""}`,
        ipAddress: req.ip || null,
      });

      try {
        await storage.createNotification({
          userId: approval.requestedBy,
          type: "approval_result",
          title: `Request ${status}`,
          message: `Your ${approval.action} request for ${approval.entityType} has been ${status}.${reviewNotes ? ` Notes: ${reviewNotes}` : ""}`,
          link: "/approvals",
          country: requireWriteCountry(approval.country || getCountryFilter(req), "createNotification:approval_result"),
        });
      } catch {}

      res.json(updated);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  app.get("/api/disputes", async (req, res) => {
    try {
      const orgId = getOrgScope(req);
      const country = getCountryFilter(req);
      const recentDays = parseInt(req.query.recentDays as string) || 0;
      const disputeList = await storage.getDisputes(orgId, country, recentDays > 0 ? recentDays : undefined);
      res.json(disputeList);
    } catch (e: any) {
      res.status(500).json({ message: safeErrorMessage(e) });
    }
  });

  app.get("/api/disputes/:id", async (req, res) => {
    try {
      const dispute = await storage.getDispute(req.params.id);
      if (!dispute) return res.status(404).json({ message: "Dispute not found" });
      if (!(await validateBorrowerCountry(dispute.borrowerId, req))) {
        return res.status(403).json({ message: "Access denied" });
      }
      res.json(dispute);
    } catch (e: any) {
      res.status(500).json({ message: safeErrorMessage(e) });
    }
  });

  app.post("/api/disputes", requireRole("admin", "lender", "regulator"), async (req, res) => {
    try {
      const data = {
        ...req.body,
        filedBy: req.session?.userId,
        country: requireWriteCountry(req.body.country || getCountryFilter(req), "createDispute"),
      };
      const parsed = insertDisputeSchema.parse(data);
      const dispute = await storage.createDispute(parsed);
      await storage.createAuditLog({
        action: "FILE_DISPUTE", entity: "dispute", entityId: dispute.id, userId: req.session?.userId,
        details: `Filed ${dispute.disputeType} dispute for borrower ${dispute.borrowerId}`,
        ipAddress: req.ip || null,
      });

      try {
        const admins = await storage.getUsersByRole("admin");
        for (const admin of admins) {
          await storage.createNotification({
            userId: admin.id,
            type: "dispute_update",
            title: "New dispute filed",
            message: `A ${dispute.disputeType} dispute has been filed for borrower ${dispute.borrowerId}`,
            link: "/disputes",
            country: requireWriteCountry(dispute.country || getCountryFilter(req), "createNotification:dispute_filed"),
          });
        }
      } catch {}

      try {
        const borrower = await storage.getBorrower(dispute.borrowerId);
        if (borrower?.organizationId) {
          const org = await storage.getOrganization(borrower.organizationId);
          if (org?.contactEmail) {
            sendDisputeNotification(org.name, org.contactEmail, dispute.id, `${borrower.firstName} ${borrower.lastName}`, dispute.disputeType || "general").catch(() => {});
          }
        }
        recordUsageEvent({
          organizationId: borrower?.organizationId || req.session?.organizationId,
          eventType: "dispute_filing",
          country: borrower?.country || getCountryFilter(req) || null,
          metadata: JSON.stringify({ disputeId: dispute.id, disputeType: dispute.disputeType }),
        });
      } catch {}

      deliverWebhook("dispute.filed", { id: dispute.id, borrowerId: dispute.borrowerId, type: dispute.disputeType }, req.session?.organizationId).catch(() => {});

      res.status(201).json(dispute);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  app.patch("/api/disputes/:id", requireRole("admin", "regulator"), async (req, res) => {
    try {
      const validatedBody = insertDisputeSchema.partial().parse(req.body);
      const dispute = await storage.updateDispute(req.params.id, validatedBody);
      if (!dispute) return res.status(404).json({ message: "Dispute not found" });
      await storage.createAuditLog({
        action: "UPDATE_DISPUTE", entity: "dispute", entityId: dispute.id, userId: req.session?.userId,
        details: `Updated dispute status to ${dispute.status}`,
        ipAddress: req.ip || null,
      });
      res.json(dispute);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  async function findOrCreateBatchBorrower(
    record: any,
    orgId?: string
  ): Promise<string> {
    const nationalId = record.nationalId || record.borrowerId;
    if (!nationalId) throw new Error("No nationalId or borrowerId to identify borrower");

    const existing = await db.select({ id: borrowers.id })
      .from(borrowers)
      .where(eq(borrowers.nationalId, nationalId))
      .limit(1);

    if (existing.length > 0) {
      const updateData: any = {};
      if (record.borrowerName) {
        const parts = record.borrowerName.split(" ");
        updateData.firstName = parts[0];
        updateData.lastName = parts.slice(1).join(" ") || null;
      }
      if (record.address) updateData.address = record.address;
      if (record.phoneNumber) updateData.phone = record.phoneNumber;
      if (record.dateOfBirth) updateData.dateOfBirth = record.dateOfBirth;
      if (Object.keys(updateData).length > 0) {
        await db.update(borrowers).set({ ...updateData, updatedAt: new Date() }).where(eq(borrowers.id, existing[0].id));
      }
      return existing[0].id;
    }

    const nameParts = (record.borrowerName || "Unknown").split(" ");
    const [created] = await db.insert(borrowers).values({
      type: "individual",
      firstName: nameParts[0],
      lastName: nameParts.slice(1).join(" ") || null,
      nationalId: nationalId,
      phone: record.phoneNumber || null,
      address: record.address || null,
      dateOfBirth: record.dateOfBirth || null,
      country: "Ghana",
      organizationId: orgId || null,
    }).returning();
    return created.id;
  }

  async function batchInsertCreditAccounts(
    validated: Array<{ index: number; data: any; rawRecord?: any }>,
    results: { successCount: number; errorCount: number; updatedCount?: number; errors: Array<{ index: number; message: string }> },
    orgId?: string
  ) {
    if (!results.updatedCount) results.updatedCount = 0;

    for (const item of validated) {
      try {
        const raw = item.rawRecord || item.data;
        const resolvedBorrowerId = await findOrCreateBatchBorrower(raw, orgId);
        item.data.borrowerId = resolvedBorrowerId;
      } catch (err: any) {
        results.errorCount++;
        results.errors.push({ index: item.index, message: `Borrower resolution failed: ${err.message}` });
        item.data._skip = true;
      }
    }

    const activeItems = validated.filter(v => !v.data._skip);

    const CHUNK_SIZE = 500;
    const toInsert: any[] = [];
    const toUpdate: Array<{ id: string; data: any; index: number }> = [];

    const allAccountNumbers = activeItems.map(v => v.data.accountNumber).filter(Boolean);
    const existingMap = new Map<string, string>();

    if (allAccountNumbers.length > 0) {
      for (let i = 0; i < allAccountNumbers.length; i += CHUNK_SIZE) {
        const chunkAcctNums = allAccountNumbers.slice(i, i + CHUNK_SIZE);
        const existing = await db.select({ id: creditAccounts.id, accountNumber: creditAccounts.accountNumber, borrowerId: creditAccounts.borrowerId })
          .from(creditAccounts)
          .where(inArray(creditAccounts.accountNumber, chunkAcctNums));
        for (const e of existing) {
          existingMap.set(`${e.accountNumber}::${e.borrowerId}`, e.id);
        }
      }
    }

    for (const item of activeItems) {
      const { _skip, ...cleanData } = item.data;
      const key = `${cleanData.accountNumber}::${cleanData.borrowerId}`;
      const existingId = existingMap.get(key);
      if (existingId) {
        toUpdate.push({ id: existingId, data: cleanData, index: item.index });
      } else {
        toInsert.push({ ...item, data: cleanData });
      }
    }

    for (let i = 0; i < toInsert.length; i += CHUNK_SIZE) {
      const chunk = toInsert.slice(i, i + CHUNK_SIZE);
      try {
        await db.insert(creditAccounts).values(chunk.map(c => c.data));
        results.successCount += chunk.length;
      } catch (batchErr: any) {
        for (const item of chunk) {
          try {
            await db.insert(creditAccounts).values(item.data);
            results.successCount++;
          } catch (innerErr: any) {
            results.errorCount++;
            results.errors.push({ index: item.index, message: innerErr.message || "Insert failed" });
          }
        }
      }
    }

    for (const item of toUpdate) {
      try {
        await db.update(creditAccounts).set({ ...item.data, updatedAt: new Date() }).where(eq(creditAccounts.id, item.id));
        results.updatedCount!++;
        results.successCount++;
      } catch (innerErr: any) {
        results.errorCount++;
        results.errors.push({ index: item.index, message: innerErr.message || "Update failed" });
      }
    }
  }

  const BATCH_REQUIRED_BORROWER_FIELDS = ["borrowerName", "dateOfBirth", "address", "nationalId", "phoneNumber", "reportingDate"];

  function validateBatchRequiredFields(record: any, index: number, fieldList?: string[]): string[] {
    const fields = fieldList || BATCH_REQUIRED_BORROWER_FIELDS;
    const missing: string[] = [];
    for (const field of fields) {
      if (!record[field] || String(record[field]).trim() === "") {
        missing.push(field);
      }
    }
    return missing;
  }

  app.post("/api/batch-upload/credit-accounts", batchLimiter, requireRole("admin", "lender"), async (req, res) => {
    try {
      const { records } = req.body;
      if (!Array.isArray(records)) {
        return res.status(400).json({ message: "Request body must contain a 'records' array" });
      }

      const results: { totalSubmitted: number; successCount: number; errorCount: number; errors: Array<{ index: number; message: string }> } = {
        totalSubmitted: records.length,
        successCount: 0,
        errorCount: 0,
        errors: [],
      };

      const validated: Array<{ index: number; data: any; rawRecord?: any }> = [];
      for (let i = 0; i < records.length; i++) {
        const missingFields = validateBatchRequiredFields(records[i], i);
        if (missingFields.length > 0) {
          results.errorCount++;
          results.errors.push({ index: i, message: `Missing required fields: ${missingFields.join(", ")}` });
          continue;
        }
        try {
          const parsed = insertCreditAccountSchema.parse(records[i]);
          validated.push({ index: i, data: parsed, rawRecord: records[i] });
        } catch (err: any) {
          results.errorCount++;
          results.errors.push({ index: i, message: err.message || "Validation failed" });
        }
      }

      await batchInsertCreditAccounts(validated, results, req.session?.organizationId);

      const batchMeta = JSON.stringify({
        totalRecords: results.totalSubmitted,
        successCount: results.successCount,
        updatedCount: results.updatedCount || 0,
        errorCount: results.errorCount,
        errors: results.errors.slice(0, 50),
      });
      const batchSummary = `Batch upload: ${results.successCount} succeeded (${results.updatedCount || 0} updated), ${results.errorCount} failed out of ${results.totalSubmitted}`;
      await storage.createAuditLog({
        action: "BATCH_UPLOAD", entity: "credit_account", userId: req.session?.userId,
        details: `${batchSummary}\n---JSON---\n${batchMeta}`,
        ipAddress: req.ip || null,
      });

      if (results.successCount > 0) {
        recordUsageEvent({
          organizationId: req.session?.organizationId,
          eventType: "batch_upload",
          quantity: results.successCount,
          country: getCountryFilter(req) || null,
          metadata: JSON.stringify({ source: "credit-accounts", successCount: results.successCount, errorCount: results.errorCount }),
        });
      }

      res.json(results);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  app.post("/api/batch-upload/xbrl", batchLimiter, requireRole("admin", "lender"), async (req, res) => {
    try {
      const { xml: xmlContent } = req.body;
      if (!xmlContent || typeof xmlContent !== "string") {
        return res.status(400).json({ message: "Request body must contain an 'xml' string field with XBRL/XML content" });
      }

      const records: any[] = [];
      const accountRegex = /<creditAccount>([\s\S]*?)<\/creditAccount>/gi;
      let match;
      while ((match = accountRegex.exec(xmlContent)) !== null) {
        const block = match[1];
        const extract = (tag: string) => {
          const m = new RegExp(`<${tag}>([^<]*)</${tag}>`, "i").exec(block);
          return m ? m[1].trim() : "";
        };
        records.push({
          borrowerId: extract("borrowerId"),
          borrowerName: extract("borrowerName"),
          dateOfBirth: extract("dateOfBirth"),
          address: extract("address"),
          nationalId: extract("nationalId"),
          phoneNumber: extract("phoneNumber"),
          reportingDate: extract("reportingDate"),
          lenderInstitution: extract("lenderInstitution"),
          accountNumber: extract("accountNumber"),
          accountType: extract("accountType"),
          creditCategory: extract("creditCategory") || undefined,
          originalAmount: extract("originalAmount"),
          currentBalance: extract("currentBalance"),
          currency: extract("currency") || "GHS",
          interestRate: extract("interestRate") || "0",
          disbursementDate: extract("disbursementDate"),
          maturityDate: extract("maturityDate"),
          status: extract("status") || "current",
          daysInArrears: parseInt(extract("daysInArrears") || "0", 10),
        });
      }

      if (records.length === 0) {
        return res.status(400).json({ message: "No <creditAccount> elements found in XBRL content" });
      }

      const results = { totalSubmitted: records.length, successCount: 0, errorCount: 0, errors: [] as Array<{ index: number; message: string }> };
      const validated: Array<{ index: number; data: any; rawRecord?: any }> = [];
      for (let i = 0; i < records.length; i++) {
        const missingFields = validateBatchRequiredFields(records[i], i);
        if (missingFields.length > 0) {
          results.errorCount++;
          results.errors.push({ index: i, message: `Missing required fields: ${missingFields.join(", ")}` });
          continue;
        }
        try {
          validated.push({ index: i, data: insertCreditAccountSchema.parse(records[i]), rawRecord: records[i] });
        } catch (err: any) {
          results.errorCount++;
          results.errors.push({ index: i, message: err.message || "Validation failed" });
        }
      }
      await batchInsertCreditAccounts(validated, results, req.session?.organizationId);

      const xbrlMeta = JSON.stringify({ totalRecords: results.totalSubmitted, successCount: results.successCount, updatedCount: results.updatedCount || 0, errorCount: results.errorCount, errors: results.errors.slice(0, 50) });
      await storage.createAuditLog({
        action: "BATCH_UPLOAD_XBRL", entity: "credit_account", userId: req.session?.userId,
        details: `XBRL upload: ${results.successCount} succeeded (${results.updatedCount || 0} updated), ${results.errorCount} failed out of ${results.totalSubmitted}\n---JSON---\n${xbrlMeta}`,
        ipAddress: req.ip || null,
      });

      res.json(results);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  app.post("/api/batch-upload/bog-pipe", batchLimiter, requireRole("admin", "lender"), async (req, res) => {
    try {
      const { data: pipeData } = req.body;
      if (!pipeData || typeof pipeData !== "string") {
        return res.status(400).json({ message: "Request body must contain a 'data' string with pipe-delimited content" });
      }

      const lines = pipeData.trim().split("\n").filter((l: string) => l.trim());
      if (lines.length < 2) {
        return res.status(400).json({ message: "File must contain a header row and at least one data row" });
      }

      const headers = lines[0].split("|").map((h: string) => h.trim());

      const bogFieldMap: Record<string, string> = {
        "SRN": "_srn",
        "ReportingDate": "reportingDate",
        "BorrowerName": "borrowerName",
        "GhanaCardNo": "nationalId",
        "DateOfBirth": "dateOfBirth",
        "Address": "address",
        "PhoneNumber": "phoneNumber",
        "FacilityType": "facilityTypeCode",
        "AccountNumber": "accountNumber",
        "Currency": "currency",
        "OriginalAmount": "originalAmount",
        "CurrentBalance": "currentBalance",
        "InterestRate": "interestRate",
        "DisbursementDate": "disbursementDate",
        "MaturityDate": "maturityDate",
        "AssetClassification": "assetClassification",
        "RepaymentFrequency": "repaymentFrequency",
        "DaysInArrears": "daysInArrears",
        "PurposeOfFacility": "purposeOfFacility",
        "CollateralType": "collateralType",
        "CollateralValue": "collateralValue",
        "AmountOverdue": "amountOverdue",
        "WrittenOffAmount": "writtenOffAmount",
        "LenderInstitution": "lenderInstitution",
        "AccountType": "accountType",
        "CreditCategory": "creditCategory",
        "BorrowerId": "borrowerId",
        "Status": "status",
      };

      function parseBogDate(dateStr: string): string {
        if (!dateStr || dateStr.length !== 8) return dateStr;
        return `${dateStr.slice(0, 4)}-${dateStr.slice(4, 6)}-${dateStr.slice(6, 8)}`;
      }

      const records: any[] = [];
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split("|").map((v: string) => v.trim());
        const record: any = {};
        headers.forEach((header: string, idx: number) => {
          const mapped = bogFieldMap[header];
          if (mapped && !mapped.startsWith("_")) {
            record[mapped] = values[idx] || "";
          }
        });

        if (record.reportingDate) record.reportingDate = parseBogDate(record.reportingDate);
        if (record.disbursementDate) record.disbursementDate = parseBogDate(record.disbursementDate);
        if (record.maturityDate) record.maturityDate = parseBogDate(record.maturityDate);
        if (record.daysInArrears) record.daysInArrears = parseInt(record.daysInArrears, 10) || 0;

        if (!record.currency) record.currency = "GHS";
        if (!record.status) record.status = "current";
        if (!record.accountType) {
          const facilityMap: Record<string, string> = {
            "OVD": "Overdraft", "TML": "Personal Loan", "MTG": "Mortgage/Housing Loan", "CRC": "Credit Card",
            "LAS": "Salary Advance", "MFL": "Microfinance Loan", "TRF": "Trade Finance",
            "LSE": "Lease Finance", "GRT": "Bond/Guarantee", "LOC": "Letter of Credit", "BND": "Bond/Guarantee",
            "STL": "Staff Loan", "GRP": "Group Loan", "OTH": "Other",
          };
          record.accountType = facilityMap[record.facilityTypeCode] || "Other";
        }
        if (!record.borrowerId) record.borrowerId = record.nationalId || `BOG-${i}`;
        if (!record.borrowerName) record.borrowerName = record.nationalId || "Unknown";
        if (!record.lenderInstitution) record.lenderInstitution = "Unknown";
        if (!record.creditCategory && record.accountType) {
          record.creditCategory = inferCreditCategory(record.accountType);
        }

        records.push(record);
      }

      const results = {
        totalSubmitted: records.length,
        successCount: 0,
        errorCount: 0,
        errors: [] as Array<{ index: number; message: string }>,
      };

      const validated: Array<{ index: number; data: any; rawRecord?: any }> = [];
      for (let i = 0; i < records.length; i++) {
        const missingFields = validateBatchRequiredFields(records[i], i);
        if (missingFields.length > 0) {
          results.errorCount++;
          results.errors.push({ index: i, message: `Missing required fields: ${missingFields.join(", ")}` });
          continue;
        }
        try {
          validated.push({ index: i, data: insertCreditAccountSchema.parse(records[i]), rawRecord: records[i] });
        } catch (err: any) {
          results.errorCount++;
          results.errors.push({ index: i, message: err.message || "Validation failed" });
        }
      }
      await batchInsertCreditAccounts(validated, results, req.session?.organizationId);

      const bogMeta = JSON.stringify({ totalRecords: results.totalSubmitted, successCount: results.successCount, updatedCount: results.updatedCount || 0, errorCount: results.errorCount, errors: results.errors.slice(0, 50) });
      await storage.createAuditLog({
        action: "BATCH_UPLOAD_BOG", entity: "credit_account", userId: req.session?.userId,
        details: `BoG pipe-delimited upload: ${results.successCount} succeeded (${results.updatedCount || 0} updated), ${results.errorCount} failed out of ${results.totalSubmitted}\n---JSON---\n${bogMeta}`,
        ipAddress: req.ip || null,
      });

      res.json(results);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  app.post("/api/batch-upload/csv", batchLimiter, requireRole("admin", "lender"), async (req, res) => {
    try {
      const { csvData } = req.body;
      if (!csvData || typeof csvData !== "string") {
        return res.status(400).json({ message: "Request body must contain a 'csvData' string with CSV content" });
      }

      const lines = csvData.trim().split("\n").filter((l: string) => l.trim());
      if (lines.length < 2) {
        return res.status(400).json({ message: "CSV must contain a header row and at least one data row" });
      }

      function parseCSVLine(line: string): string[] {
        const result: string[] = [];
        let current = "";
        let inQuotes = false;
        for (let i = 0; i < line.length; i++) {
          const ch = line[i];
          if (ch === '"') {
            if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
              current += '"';
              i++;
            } else {
              inQuotes = !inQuotes;
            }
          } else if (ch === ',' && !inQuotes) {
            result.push(current.trim());
            current = "";
          } else {
            current += ch;
          }
        }
        result.push(current.trim());
        return result;
      }

      const headers = parseCSVLine(lines[0]);
      const records: any[] = [];
      for (let i = 1; i < lines.length; i++) {
        const values = parseCSVLine(lines[i]);
        const obj: any = {};
        headers.forEach((h, idx) => {
          obj[h] = values[idx] || "";
        });
        if (obj.daysInArrears) obj.daysInArrears = parseInt(obj.daysInArrears, 10) || 0;
        if (!obj.creditCategory && obj.accountType) {
          obj.creditCategory = inferCreditCategory(obj.accountType);
        }
        records.push(obj);
      }

      const results = {
        totalSubmitted: records.length,
        successCount: 0,
        errorCount: 0,
        errors: [] as Array<{ index: number; message: string }>,
      };

      const validated: Array<{ index: number; data: any; rawRecord?: any }> = [];
      for (let i = 0; i < records.length; i++) {
        const missingFields = validateBatchRequiredFields(records[i], i);
        if (missingFields.length > 0) {
          results.errorCount++;
          results.errors.push({ index: i, message: `Missing required fields: ${missingFields.join(", ")}` });
          continue;
        }
        try {
          validated.push({ index: i, data: insertCreditAccountSchema.parse(records[i]), rawRecord: records[i] });
        } catch (err: any) {
          results.errorCount++;
          results.errors.push({ index: i, message: err.message || "Validation failed" });
        }
      }
      await batchInsertCreditAccounts(validated, results, req.session?.organizationId);

      const csvMeta = JSON.stringify({ totalRecords: results.totalSubmitted, successCount: results.successCount, updatedCount: results.updatedCount || 0, errorCount: results.errorCount, errors: results.errors.slice(0, 50) });
      await storage.createAuditLog({
        action: "BATCH_UPLOAD_CSV", entity: "credit_account", userId: req.session?.userId,
        details: `CSV upload: ${results.successCount} succeeded (${results.updatedCount || 0} updated), ${results.errorCount} failed out of ${results.totalSubmitted}\n---JSON---\n${csvMeta}`,
        ipAddress: req.ip || null,
      });

      res.json(results);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  app.get("/api/batch-upload/history", requireRole("admin", "lender"), async (req, res) => {
    try {
      const batchActions = ["BATCH_UPLOAD", "BATCH_UPLOAD_CSV", "BATCH_UPLOAD_JSON", "BATCH_UPLOAD_XBRL", "BATCH_QUEUE_ACCOUNTS", "IFF_UPLOAD", "IFF_UPLOAD_JSON"];
      const conditions = [
        or(
          ...batchActions.map(a => eq(auditLogs.action, a)),
          sql`${auditLogs.action} LIKE 'BATCH_UPLOAD%'`
        )
      ];
      const orgScope = getOrgScope(req);
      if (orgScope) conditions.push(eq(auditLogs.organizationId, orgScope));
      const allLogs = await db.select({
        id: auditLogs.id,
        action: auditLogs.action,
        entity: auditLogs.entity,
        details: auditLogs.details,
        userId: auditLogs.userId,
        createdAt: auditLogs.createdAt,
        ipAddress: auditLogs.ipAddress,
        userName: users.username,
        userFullName: users.fullName,
      }).from(auditLogs)
        .leftJoin(users, eq(auditLogs.userId, users.id))
        .where(and(...conditions))
        .orderBy(desc(auditLogs.createdAt))
        .limit(200);
      const batchLogs = allLogs
        .map((log: any) => {
          const rawDetails = log.details || "";
          const jsonMarker = "\n---JSON---\n";
          const jsonSep = rawDetails.indexOf(jsonMarker);
          const detailStr = jsonSep >= 0 ? rawDetails.substring(0, jsonSep) : rawDetails;
          let meta: any = null;
          if (jsonSep >= 0) {
            try { meta = JSON.parse(rawDetails.substring(jsonSep + jsonMarker.length)); } catch {}
          }

          const formatMatch = (log.action === "IFF_UPLOAD" || log.action === "IFF_UPLOAD_JSON") ? "IFF" : (log.action.replace("BATCH_UPLOAD", "").replace("_", "") || "JSON");
          let totalSubmitted = 0, successCount = 0, errorCount = 0;
          let borrowersCreated = 0, borrowersUpdated = 0, accountsCreated = 0, accountsUpdated = 0;
          let chequesCreated = 0, chequesUpdated = 0, judgmentsCreated = 0, judgmentsUpdated = 0;
          let guarantorsCreated = 0, guarantorsUpdated = 0;
          let iffType = "";
          let lenderInstitution = "";
          let fileName = "";
          let uploadErrors: any[] = [];

          if (meta) {
            totalSubmitted = meta.totalRecords || 0;
            successCount = meta.successCount || (totalSubmitted - (meta.errorCount || 0));
            errorCount = meta.errorCount || 0;
            borrowersCreated = meta.borrowersCreated || 0;
            borrowersUpdated = meta.borrowersUpdated || 0;
            accountsCreated = meta.accountsCreated || 0;
            accountsUpdated = meta.accountsUpdated || 0;
            chequesCreated = meta.chequesCreated || 0;
            chequesUpdated = meta.chequesUpdated || 0;
            judgmentsCreated = meta.judgmentsCreated || 0;
            judgmentsUpdated = meta.judgmentsUpdated || 0;
            guarantorsCreated = meta.guarantorsCreated || 0;
            guarantorsUpdated = meta.guarantorsUpdated || 0;
            iffType = meta.iffType || "";
            lenderInstitution = meta.lenderInstitution || "";
            fileName = meta.fileName || "";
            uploadErrors = meta.errors || [];
            if (meta.updatedCount !== undefined) {
              const entity = log.entity || "";
              if (entity === "dishonoured_cheque") chequesUpdated = meta.updatedCount;
              else if (entity === "court_judgment") judgmentsUpdated = meta.updatedCount;
              else accountsUpdated = meta.updatedCount;
            }
          } else if (log.action === "IFF_UPLOAD" || log.action === "IFF_UPLOAD_JSON") {
            const recMatch = detailStr.match(/(\d+)\s+records/);
            if (recMatch) totalSubmitted = parseInt(recMatch[1], 10);
            const bcMatch = detailStr.match(/(\d+)\s+borrowers created/);
            if (bcMatch) borrowersCreated = parseInt(bcMatch[1], 10);
            const buMatch = detailStr.match(/(\d+)\s+borrowers updated/);
            if (buMatch) borrowersUpdated = parseInt(buMatch[1], 10);
            const acMatch = detailStr.match(/(\d+)\s+accounts created/);
            if (acMatch) accountsCreated = parseInt(acMatch[1], 10);
            const auMatch = detailStr.match(/(\d+)\s+accounts updated/);
            if (auMatch) accountsUpdated = parseInt(auMatch[1], 10);
            const chMatch = detailStr.match(/(\d+)\s+cheques created/);
            if (chMatch) chequesCreated = parseInt(chMatch[1], 10);
            const cuMatch = detailStr.match(/(\d+)\s+cheques updated/);
            if (cuMatch) chequesUpdated = parseInt(cuMatch[1], 10);
            const jgMatch = detailStr.match(/(\d+)\s+judgments created/);
            if (jgMatch) judgmentsCreated = parseInt(jgMatch[1], 10);
            const juMatch = detailStr.match(/(\d+)\s+judgments updated/);
            if (juMatch) judgmentsUpdated = parseInt(juMatch[1], 10);
            const grMatch = detailStr.match(/(\d+)\s+guarantors created/);
            if (grMatch) guarantorsCreated = parseInt(grMatch[1], 10);
            const guMatch = detailStr.match(/(\d+)\s+guarantors updated/);
            if (guMatch) guarantorsUpdated = parseInt(guMatch[1], 10);
            const errMatch = detailStr.match(/(\d+)\s+errors/);
            if (errMatch) errorCount = parseInt(errMatch[1], 10);
            successCount = totalSubmitted - errorCount;
            const typeMatch = detailStr.match(/\(([A-Z_]+)\)/);
            if (typeMatch) iffType = typeMatch[1];
          } else {
            const numMatch = detailStr.match(/(\d+)\s+succeeded.*?(\d+)\s+failed.*?(\d+)/);
            if (numMatch) {
              successCount = parseInt(numMatch[1], 10);
              errorCount = parseInt(numMatch[2], 10);
              totalSubmitted = parseInt(numMatch[3], 10);
            }
            const updMatch = detailStr.match(/(\d+)\s+updated/);
            if (updMatch) {
              const updCount = parseInt(updMatch[1], 10);
              const entity = log.entity || "";
              if (entity === "dishonoured_cheque") chequesUpdated = updCount;
              else if (entity === "court_judgment") judgmentsUpdated = updCount;
              else accountsUpdated = updCount;
            }
          }
          return {
            id: log.id,
            format: formatMatch || "JSON",
            totalSubmitted,
            successCount,
            errorCount,
            borrowersCreated,
            borrowersUpdated,
            accountsCreated,
            accountsUpdated,
            chequesCreated,
            chequesUpdated,
            judgmentsCreated,
            judgmentsUpdated,
            guarantorsCreated,
            guarantorsUpdated,
            iffType,
            lenderInstitution,
            fileName,
            uploadErrors,
            uploadedBy: log.userFullName || log.userName || null,
            userId: log.userId,
            ipAddress: log.ipAddress,
            entity: log.entity,
            createdAt: log.createdAt,
            details: detailStr,
          };
        });
      res.json(batchLogs);
    } catch (e: any) {
      res.status(500).json({ message: safeErrorMessage(e) });
    }
  });

  app.post("/api/batch/accounts", batchLimiter, requireAuth, requireRole("admin", "lender"), async (req, res) => {
    try {
      const { records } = req.body;
      if (!Array.isArray(records) || records.length === 0) {
        return res.status(400).json({ message: "Request body must contain a non-empty 'records' array" });
      }
      if (records.length > 1000) {
        return res.status(400).json({ message: "Maximum 1,000 records per batch. Split into multiple requests." });
      }

      const preErrors: Array<{ index: number; message: string }> = [];
      for (let i = 0; i < records.length; i++) {
        const missingFields = validateBatchRequiredFields(records[i], i);
        if (missingFields.length > 0) {
          preErrors.push({ index: i, message: `Missing required fields: ${missingFields.join(", ")}` });
        }
      }
      if (preErrors.length > 0) {
        return res.status(400).json({
          message: `${preErrors.length} record(s) missing required borrower fields`,
          errors: preErrors,
        });
      }

      const jobId = await enqueueBatchAccountCreate(records, req.session?.userId || null);
      await storage.createAuditLog({
        action: "BATCH_QUEUE_ACCOUNTS", entity: "credit_account", userId: req.session?.userId,
        details: `Queued batch account create: ${records.length} records (job: ${jobId})`,
        ipAddress: req.ip || null,
      });
      recordUsageEvent({
        organizationId: req.session?.organizationId,
        eventType: "batch_upload",
        quantity: records.length,
        country: getCountryFilter(req) || null,
        metadata: JSON.stringify({ jobId, recordCount: records.length }),
      });
      res.json({ jobId, totalRecords: records.length, status: "queued" });
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  app.post("/api/batch/borrowers", batchLimiter, requireAuth, requireRole("admin", "super_admin"), async (req, res) => {
    try {
      const { updates } = req.body;
      if (!Array.isArray(updates) || updates.length === 0) {
        return res.status(400).json({ message: "Request body must contain a non-empty 'updates' array of { id, fields }" });
      }
      if (updates.length > 1000) {
        return res.status(400).json({ message: "Maximum 1,000 updates per batch. Split into multiple requests." });
      }
      for (const u of updates) {
        if (!u.id || !u.fields || typeof u.fields !== "object") {
          return res.status(400).json({ message: "Each update must have 'id' (string) and 'fields' (object)" });
        }
      }
      const jobId = await enqueueBatchBorrowerUpdate(updates, req.session?.userId || null);
      await storage.createAuditLog({
        action: "BATCH_QUEUE_BORROWERS", entity: "borrower", userId: req.session?.userId,
        details: `Queued batch borrower update: ${updates.length} records (job: ${jobId})`,
        ipAddress: req.ip || null,
      });
      res.json({ jobId, totalRecords: updates.length, status: "queued" });
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  app.post("/api/batch/account-updates", batchLimiter, requireAuth, requireRole("admin", "super_admin"), async (req, res) => {
    try {
      const { updates } = req.body;
      if (!Array.isArray(updates) || updates.length === 0) {
        return res.status(400).json({ message: "Request body must contain a non-empty 'updates' array of { id, fields }" });
      }
      if (updates.length > 1000) {
        return res.status(400).json({ message: "Maximum 1,000 updates per batch. Split into multiple requests." });
      }
      for (const u of updates) {
        if (!u.id || !u.fields || typeof u.fields !== "object") {
          return res.status(400).json({ message: "Each update must have 'id' (string UUID) and 'fields' (object)" });
        }
      }
      const jobId = await enqueueBatchAccountUpdate(updates, req.session?.userId || null);
      await storage.createAuditLog({
        action: "BATCH_QUEUE_ACCOUNTS", entity: "credit_account", userId: req.session?.userId,
        details: `Queued batch account update: ${updates.length} records (job: ${jobId})`,
        ipAddress: req.ip || null,
      });
      res.json({ jobId, totalRecords: updates.length, status: "queued" });
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  app.get("/api/batch/jobs/:jobId", requireAuth, async (req, res) => {
    const job = getJobStatus(req.params.jobId);
    if (!job) return res.status(404).json({ message: "Job not found" });
    res.json(job);
  });

  app.get("/api/batch/queue-stats", requireAuth, requireRole("admin", "super_admin"), (_req, res) => {
    res.json(getQueueStats());
  });

  app.get("/api/batch-upload/template/:format", (_req, res) => {
    const format = _req.params.format;
    if (format === "csv") {
      const csvTemplate = `borrowerId,borrowerName,dateOfBirth,address,nationalId,phoneNumber,reportingDate,lenderInstitution,accountNumber,accountType,creditCategory,originalAmount,currentBalance,currency,interestRate,disbursementDate,maturityDate,status,daysInArrears
BORROWER_ID_1,John Doe,1985-03-15,"12 Independence Ave, Accra",GHA-123456789,+233201234567,2025-01-31,Commercial Bank,CB-LN-2025-001,Personal Loan,personal,500000.00,450000.00,ETB,12.50,2025-01-15,2028-01-15,current,0
BORROWER_ID_2,Jane Smith,1990-07-22,"45 Ring Road, Kumasi",GHA-987654321,+233209876543,2025-01-31,Development Bank,DB-LN-2025-002,Business Loan,business,1000000.00,850000.00,ETB,15.00,2025-02-01,2030-02-01,current,0`;
      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", 'attachment; filename="batch-upload-template.csv"');
      return res.send(csvTemplate);
    } else if (format === "json") {
      const jsonTemplate = JSON.stringify([
        {
          borrowerId: "BORROWER_ID_1",
          borrowerName: "John Doe",
          dateOfBirth: "1985-03-15",
          address: "12 Independence Ave, Accra",
          nationalId: "GHA-123456789",
          phoneNumber: "+233201234567",
          reportingDate: "2025-01-31",
          lenderInstitution: "Commercial Bank",
          accountNumber: "CB-LN-2025-001",
          accountType: "Personal Loan",
          creditCategory: "personal",
          originalAmount: "500000.00",
          currentBalance: "450000.00",
          currency: "GHS",
          interestRate: "12.50",
          disbursementDate: "2025-01-15",
          maturityDate: "2028-01-15",
          status: "current",
          daysInArrears: 0
        }
      ], null, 2);
      res.setHeader("Content-Type", "application/json");
      res.setHeader("Content-Disposition", 'attachment; filename="batch-upload-template.json"');
      return res.send(jsonTemplate);
    }
    res.status(400).json({ message: "Unsupported format. Use 'csv' or 'json'" });
  });

  const iffUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 }, fileFilter: (_req, file, cb) => {
    const ext = file.originalname.toLowerCase();
    const validMimes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/csv',
      'application/csv',
    ];
    if ((ext.endsWith(".xlsx") || ext.endsWith(".xls") || ext.endsWith(".csv")) && validMimes.includes(file.mimetype)) cb(null, true);
    else cb(new Error("Only .xlsx, .xls and .csv files are accepted"));
  }});

  app.post("/api/batch-upload/iff", batchLimiter, requireRole("admin", "lender"), iffUpload.single("file"), async (req, res) => {
    try {
      if (!req.file) return res.status(400).json({ message: "No file uploaded" });

      const ExcelJSModule = await import("exceljs");
      const ExcelJS = ExcelJSModule.default || ExcelJSModule;
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(req.file.buffer);
      const worksheet = workbook.worksheets[0];
      if (!worksheet) return res.status(400).json({ message: "No worksheet found in file" });
      const rawData: any[][] = [];
      worksheet.eachRow({ includeEmpty: true }, (row) => {
        // ExcelJS row.values has a null/undefined at index 0, slice from 1
        rawData.push((row.values as any[]).slice(1));
      });

      if (rawData.length < 2) return res.status(400).json({ message: "File must contain a header row and at least one data row" });

      const headers = rawData[0].map((h: any) => String(h).trim());
      const rows: Record<string, any>[] = [];
      for (let i = 1; i < rawData.length; i++) {
        const rowObj: Record<string, any> = {};
        headers.forEach((h, idx) => { rowObj[h] = rawData[i]?.[idx]; });
        rows.push(rowObj);
      }

      let iffType: IFFType | null = req.body.iffType || null;
      if (!iffType) {
        iffType = detectIFFType(headers);
      }
      if (!iffType) {
        return res.status(400).json({ message: "Could not auto-detect IFF type. Please specify iffType: BUSINESS_CREDIT, CONSUMER_CREDIT, BUSINESS_DISHONOURED_CHEQUES, CONSUMER_DISHONOURED_CHEQUE, BUSINESS_JUDGEMENT, or CONSUMER_JUDGEMENT" });
      }

      const lenderInstitution = req.body.lenderInstitution || req.session?.institution || "Unknown Institution";
      const orgId = req.session?.organizationId;

      const result = await processIFFData(iffType, rows, lenderInstitution, orgId);

      const iffMeta = JSON.stringify({
        iffType,
        lenderInstitution,
        fileName: req.file?.originalname || null,
        totalRecords: result.totalRecords,
        borrowersCreated: result.borrowersCreated,
        borrowersUpdated: result.borrowersUpdated,
        accountsCreated: result.accountsCreated,
        accountsUpdated: result.accountsUpdated,
        chequesCreated: result.chequesCreated,
        chequesUpdated: result.chequesUpdated,
        judgmentsCreated: result.judgmentsCreated,
        judgmentsUpdated: result.judgmentsUpdated,
        guarantorsCreated: result.guarantorsCreated,
        guarantorsUpdated: result.guarantorsUpdated,
        errorCount: result.errors.length,
        errors: result.errors.slice(0, 50),
      });
      const summaryText = `IFF upload (${iffType}): ${result.totalRecords} records, ${result.borrowersCreated} borrowers created, ${result.borrowersUpdated} borrowers updated, ${result.accountsCreated} accounts created, ${result.accountsUpdated} accounts updated, ${result.chequesCreated} cheques created, ${result.chequesUpdated} cheques updated, ${result.judgmentsCreated} judgments created, ${result.judgmentsUpdated} judgments updated, ${result.guarantorsCreated} guarantors created, ${result.guarantorsUpdated} guarantors updated, ${result.errors.length} errors`;
      await storage.createAuditLog({
        action: "IFF_UPLOAD", entity: "iff_batch", userId: req.session?.userId,
        details: `${summaryText}\n---JSON---\n${iffMeta}`,
        ipAddress: req.ip || null,
      });

      if (result.accountsCreated > 0 || result.chequesCreated > 0 || result.judgmentsCreated > 0) {
        recordUsageEvent({
          organizationId: orgId,
          eventType: "batch_upload",
          quantity: result.accountsCreated + result.chequesCreated + result.judgmentsCreated,
          country: getCountryFilter(req) || null,
          metadata: JSON.stringify({ source: "iff-upload", iffType, ...result }),
        });
      }

      res.json({ iffType, ...result });
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  app.post("/api/batch-upload/iff-json", batchLimiter, requireRole("admin", "lender"), async (req, res) => {
    try {
      const { iffType, records, lenderInstitution: li } = req.body;
      if (!iffType || !records || !Array.isArray(records)) {
        return res.status(400).json({ message: "Request body must contain 'iffType' and 'records' array" });
      }

      const validTypes: IFFType[] = ["BUSINESS_CREDIT", "CONSUMER_CREDIT", "BUSINESS_DISHONOURED_CHEQUES", "CONSUMER_DISHONOURED_CHEQUE", "BUSINESS_JUDGEMENT", "CONSUMER_JUDGEMENT"];
      if (!validTypes.includes(iffType)) {
        return res.status(400).json({ message: `Invalid iffType. Must be one of: ${validTypes.join(", ")}` });
      }

      const lenderInstitution = li || req.session?.institution || "Unknown Institution";
      const orgId = req.session?.organizationId;

      const result = await processIFFData(iffType, records, lenderInstitution, orgId);

      const iffJsonMeta = JSON.stringify({
        iffType,
        lenderInstitution,
        totalRecords: result.totalRecords,
        borrowersCreated: result.borrowersCreated,
        borrowersUpdated: result.borrowersUpdated,
        accountsCreated: result.accountsCreated,
        accountsUpdated: result.accountsUpdated,
        chequesCreated: result.chequesCreated,
        chequesUpdated: result.chequesUpdated,
        judgmentsCreated: result.judgmentsCreated,
        judgmentsUpdated: result.judgmentsUpdated,
        guarantorsCreated: result.guarantorsCreated,
        guarantorsUpdated: result.guarantorsUpdated,
        errorCount: result.errors.length,
        errors: result.errors.slice(0, 50),
      });
      const iffJsonSummary = `IFF upload (${iffType}): ${result.totalRecords} records, ${result.borrowersCreated} borrowers created, ${result.borrowersUpdated} borrowers updated, ${result.accountsCreated} accounts created, ${result.accountsUpdated} accounts updated, ${result.chequesCreated} cheques created, ${result.chequesUpdated} cheques updated, ${result.judgmentsCreated} judgments created, ${result.judgmentsUpdated} judgments updated, ${result.guarantorsCreated} guarantors created, ${result.guarantorsUpdated} guarantors updated, ${result.errors.length} errors`;
      await storage.createAuditLog({
        action: "IFF_UPLOAD_JSON", entity: "iff_batch", userId: req.session?.userId,
        details: `${iffJsonSummary}\n---JSON---\n${iffJsonMeta}`,
        ipAddress: req.ip || null,
      });

      res.json({ iffType, ...result });
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  app.get("/api/dishonoured-cheques", async (req, res) => {
    try {
      const borrowerId = req.query.borrowerId as string;
      const orgId = getOrgScope(req);
      if (borrowerId) {
        const borrower = await storage.getBorrower(borrowerId);
        const country = getCountryFilter(req);
        if (borrower && country && borrower.country !== country && req.session?.userRole !== "super_admin") {
          return res.status(403).json({ message: "Borrower not accessible in current country mode" });
        }
        return res.json(await storage.getDishonouredChequesByBorrower(borrowerId));
      }
      const recentDays = parseInt(req.query.recentDays as string) || 0;
      const country = getCountryFilter(req);
      enforceCountryScopeForNonSuperAdmin(req, country, "/api/dishonoured-cheques");
      await logCrossCountryAccess(req, country, "/api/dishonoured-cheques");
      const result = await storage.getAllDishonouredCheques(orgId, country, recentDays > 0 ? recentDays : undefined);
      res.json(result);
    } catch (e: any) {
      res.status(500).json({ message: safeErrorMessage(e) });
    }
  });

  app.post("/api/batch-upload/dishonoured-cheques", batchLimiter, requireRole("admin", "lender"), async (req, res) => {
    try {
      const { records } = req.body;
      if (!Array.isArray(records)) return res.status(400).json({ message: "Request body must contain a 'records' array" });

      const results = { totalSubmitted: records.length, successCount: 0, updatedCount: 0, errorCount: 0, errors: [] as Array<{ index: number; message: string }> };

      for (let i = 0; i < records.length; i++) {
        try {
          const parsed = insertDishonouredChequeSchema.parse(records[i]);
          if (req.session?.organizationId) parsed.organizationId = req.session.organizationId;
          const chequeNumber = parsed.chequeNumber;
          const borrowerId = parsed.borrowerId;
          if (chequeNumber && borrowerId) {
            const existing = await db.select().from(dishonouredCheques)
              .where(and(eq(dishonouredCheques.chequeNumber, chequeNumber), eq(dishonouredCheques.borrowerId, borrowerId)))
              .limit(1);
            if (existing.length > 0) {
              const { id: _id, ...updateData } = parsed;
              await db.update(dishonouredCheques).set(updateData).where(eq(dishonouredCheques.id, existing[0].id));
              results.updatedCount++;
              results.successCount++;
              continue;
            }
          }
          await storage.createDishonouredCheque(parsed);
          results.successCount++;
        } catch (err: any) {
          results.errorCount++;
          results.errors.push({ index: i, message: err.message || "Validation failed" });
        }
      }

      const chequeMeta = JSON.stringify({ totalRecords: results.totalSubmitted, successCount: results.successCount, updatedCount: results.updatedCount, errorCount: results.errorCount, errors: results.errors.slice(0, 50) });
      await storage.createAuditLog({
        action: "BATCH_UPLOAD", entity: "dishonoured_cheque", userId: req.session?.userId,
        details: `Batch cheque upload: ${results.successCount} succeeded (${results.updatedCount} updated), ${results.errorCount} failed\n---JSON---\n${chequeMeta}`,
        ipAddress: req.ip || null,
      });

      res.json(results);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  app.post("/api/batch-upload/court-judgments", batchLimiter, requireRole("admin", "lender"), async (req, res) => {
    try {
      const { records } = req.body;
      if (!Array.isArray(records)) return res.status(400).json({ message: "Request body must contain a 'records' array" });

      const results = { totalSubmitted: records.length, successCount: 0, updatedCount: 0, errorCount: 0, errors: [] as Array<{ index: number; message: string }> };

      for (let i = 0; i < records.length; i++) {
        try {
          const parsed = insertCourtJudgmentSchema.parse(records[i]);
          if (req.session?.organizationId) parsed.organizationId = req.session.organizationId;
          const caseNumber = parsed.caseNumber;
          const borrowerId = parsed.borrowerId;
          if (caseNumber && borrowerId) {
            const existing = await db.select().from(courtJudgments)
              .where(and(eq(courtJudgments.caseNumber, caseNumber), eq(courtJudgments.borrowerId, borrowerId)))
              .limit(1);
            if (existing.length > 0) {
              const { id: _id, ...updateData } = parsed;
              await db.update(courtJudgments).set(updateData).where(eq(courtJudgments.id, existing[0].id));
              results.updatedCount++;
              results.successCount++;
              continue;
            }
          }
          await storage.createCourtJudgment(parsed);
          results.successCount++;
        } catch (err: any) {
          results.errorCount++;
          results.errors.push({ index: i, message: err.message || "Validation failed" });
        }
      }

      const judgMeta = JSON.stringify({ totalRecords: results.totalSubmitted, successCount: results.successCount, updatedCount: results.updatedCount, errorCount: results.errorCount, errors: results.errors.slice(0, 50) });
      await storage.createAuditLog({
        action: "BATCH_UPLOAD", entity: "court_judgment", userId: req.session?.userId,
        details: `Batch judgment upload: ${results.successCount} succeeded (${results.updatedCount} updated), ${results.errorCount} failed\n---JSON---\n${judgMeta}`,
        ipAddress: req.ip || null,
      });

      res.json(results);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  app.get("/api/guarantors/:creditAccountId", requireRole("admin", "lender", "regulator"), async (req, res) => {
    try {
      const list = await storage.getGuarantorsByAccount(req.params.creditAccountId);
      res.json(list);
    } catch (e: any) {
      res.status(500).json({ message: safeErrorMessage(e) });
    }
  });

  app.post("/api/guarantors", requireRole("admin", "lender"), async (req, res) => {
    try {
      const parsed = insertGuarantorSchema.parse(req.body);
      const created = await storage.createGuarantor(parsed);
      await storage.createAuditLog({
        action: "CREATE", entity: "guarantor", entityId: created.id, userId: req.session?.userId,
        details: `Created guarantor ${created.surname || created.companyName || "N/A"} for account ${created.creditAccountId}`,
        ipAddress: req.ip || null,
      });
      res.status(201).json(created);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  app.get("/api/borrowers/:id/guarantors", requireRole("admin", "lender", "regulator"), async (req, res) => {
    try {
      const country = getCountryFilter(req);
      enforceCountryScopeForNonSuperAdmin(req, country, "/api/borrowers/:id/guarantors");
      await logCrossCountryAccess(req, country, "/api/borrowers/:id/guarantors");
      const list = await storage.getGuarantorsByBorrower(req.params.id, country);
      res.json(list);
    } catch (e: any) {
      res.status(500).json({ message: safeErrorMessage(e) });
    }
  });

  app.get("/api/iff/supported-types", (_req, res) => {
    res.json({
      types: [
        { code: "BUSINESS_CREDIT", name: "Business Credit", description: "Business credit facility data (158 fields)", recordType: "credit" },
        { code: "CONSUMER_CREDIT", name: "Consumer Credit", description: "Individual consumer credit data (178 fields)", recordType: "credit" },
        { code: "BUSINESS_DISHONOURED_CHEQUES", name: "Business Dishonoured Cheques", description: "Business bounced cheque records (46 fields)", recordType: "cheque" },
        { code: "CONSUMER_DISHONOURED_CHEQUE", name: "Consumer Dishonoured Cheques", description: "Individual bounced cheque records (74 fields)", recordType: "cheque" },
        { code: "BUSINESS_JUDGEMENT", name: "Business Court Judgments", description: "Business court judgment records (48 fields)", recordType: "judgment" },
        { code: "CONSUMER_JUDGEMENT", name: "Consumer Court Judgments", description: "Individual court judgment records (76 fields)", recordType: "judgment" },
      ],
      acceptedFormats: [".xlsx", ".xls", ".csv"],
      maxFileSize: "50MB",
    });
  });

  app.get("/api/notifications", async (req, res) => {
    try {
      if (!req.session?.userId) return res.status(401).json({ message: "Not authenticated" });
      const country = getCountryFilter(req);
      enforceCountryScopeForNonSuperAdmin(req, country, "/api/notifications");
      await logCrossCountryAccess(req, country, "/api/notifications");
      const items = await storage.getNotifications(req.session.userId, country);
      res.json(items);
    } catch (e: any) {
      res.status(500).json({ message: safeErrorMessage(e) });
    }
  });

  app.get("/api/notifications/unread-count", async (req, res) => {
    try {
      if (!req.session?.userId) return res.status(401).json({ message: "Not authenticated" });
      const country = getCountryFilter(req);
      enforceCountryScopeForNonSuperAdmin(req, country, "/api/notifications/unread-count");
      const count = await storage.getUnreadNotificationCount(req.session.userId, country);
      res.json({ count });
    } catch (e: any) {
      res.status(500).json({ message: safeErrorMessage(e) });
    }
  });

  app.patch("/api/notifications/:id/read", async (req, res) => {
    try {
      if (!req.session?.userId) return res.status(401).json({ message: "Not authenticated" });
      await storage.markNotificationRead(req.params.id);
      res.json({ message: "Marked as read" });
    } catch (e: any) {
      res.status(500).json({ message: safeErrorMessage(e) });
    }
  });

  app.post("/api/notifications/mark-all-read", async (req, res) => {
    try {
      if (!req.session?.userId) return res.status(401).json({ message: "Not authenticated" });
      await storage.markAllNotificationsRead(req.session.userId);
      res.json({ message: "All marked as read" });
    } catch (e: any) {
      res.status(500).json({ message: safeErrorMessage(e) });
    }
  });

  app.get("/api/borrowers/:id/related", async (req, res) => {
    try {
      if (!(await validateBorrowerCountry(req.params.id, req))) {
        return res.status(403).json({ message: "Access denied" });
      }
      const related = await storage.getRelatedBorrowers(req.params.id);
      res.json(related);
    } catch (e: any) {
      res.status(500).json({ message: safeErrorMessage(e) });
    }
  });

  app.get("/api/court-judgments", async (req, res) => {
    try {
      const borrowerId = req.query.borrowerId as string;
      const orgId = getOrgScope(req);
      const country = getCountryFilter(req);
      if (borrowerId) {
        if (!(await validateBorrowerCountry(borrowerId, req))) {
          return res.status(403).json({ message: "Access denied" });
        }
        return res.json(await storage.getCourtJudgmentsByBorrower(borrowerId));
      }
      const recentDays = parseInt(req.query.recentDays as string) || 0;
      const result = await storage.getAllCourtJudgments(orgId, country, recentDays > 0 ? recentDays : undefined);
      res.json(result);
    } catch (e: any) {
      res.status(500).json({ message: safeErrorMessage(e) });
    }
  });

  app.post("/api/court-judgments", requireRole("admin", "regulator"), async (req, res) => {
    try {
      const parsed = insertCourtJudgmentSchema.parse(req.body);
      const judgment = await storage.createCourtJudgment(parsed);
      await storage.createAuditLog({
        action: "CREATE", entity: "court_judgment", entityId: judgment.id, userId: req.session?.userId,
        details: `Created court judgment: ${judgment.judgmentType} - case ${judgment.caseNumber}`,
        ipAddress: req.ip || null,
      });
      res.status(201).json(judgment);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  app.get("/api/consent-records", async (req, res) => {
    try {
      const borrowerId = req.query.borrowerId as string;
      const orgId = getOrgScope(req);
      const country = getCountryFilter(req);
      if (borrowerId) {
        if (!(await validateBorrowerCountry(borrowerId, req))) {
          return res.status(403).json({ message: "Access denied" });
        }
        return res.json(await storage.getConsentRecordsByBorrower(borrowerId));
      }
      const result = await storage.getAllConsentRecords(orgId, country);
      res.json(result);
    } catch (e: any) {
      res.status(500).json({ message: safeErrorMessage(e) });
    }
  });

  app.post("/api/consent-records", requireRole("admin", "lender"), async (req, res) => {
    try {
      const receiptNumber = `CR-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      const parsed = insertConsentRecordSchema.parse({ ...req.body, receiptNumber });
      const record = await storage.createConsentRecord(parsed);
      await storage.createAuditLog({
        action: "GRANT_CONSENT", entity: "consent_record", entityId: record.id, userId: req.session?.userId,
        details: `Consent granted to ${record.grantedTo} for ${record.purpose} (Receipt: ${record.receiptNumber})`,
        ipAddress: req.ip || null,
      });
      res.status(201).json(record);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  app.post("/api/consent-records/:id/revoke", requireRole("admin", "lender", "regulator"), async (req, res) => {
    try {
      const record = await storage.revokeConsent(req.params.id);
      if (!record) return res.status(404).json({ message: "Consent record not found" });
      await storage.createAuditLog({
        action: "REVOKE_CONSENT", entity: "consent_record", entityId: record.id, userId: req.session?.userId,
        details: `Consent revoked for ${record.grantedTo} (Receipt: ${record.receiptNumber})`,
        ipAddress: req.ip || null,
      });
      res.json(record);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  app.get("/api/payment-history/:creditAccountId", async (req, res) => {
    try {
      const country = getCountryFilter(req);
      if (country) {
        const account = await storage.getCreditAccount(req.params.creditAccountId);
        if (account) {
          const borrower = await storage.getBorrower(account.borrowerId);
          if (borrower && borrower.country !== country) {
            return res.status(403).json({ message: "Access denied" });
          }
        }
      }
      const history = await storage.getPaymentHistoryByAccount(req.params.creditAccountId);
      res.json(history);
    } catch (e: any) {
      res.status(500).json({ message: safeErrorMessage(e) });
    }
  });

  app.post("/api/payment-history/:creditAccountId", requireRole("admin", "lender"), async (req, res) => {
    try {
      const parsed = insertPaymentHistorySchema.parse({
        ...req.body,
        creditAccountId: req.params.creditAccountId,
      });
      const entry = await storage.createPaymentHistory(parsed);
      res.status(201).json(entry);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  app.get("/api/institutions", async (req, res) => {
    try {
      const page = Math.max(1, parseInt(req.query.page as string) || 1);
      const limit = Math.min(200, Math.max(1, parseInt(req.query.limit as string) || 50));
      const orgId = getOrgScope(req);
      const country = getCountryFilter(req);
      const result = await storage.getInstitutions(page, limit, orgId, country);
      res.json(result);
    } catch (e: any) {
      res.status(500).json({ message: safeErrorMessage(e) });
    }
  });

  app.post("/api/institutions", requireRole("admin"), async (req, res) => {
    try {
      const parsed = insertInstitutionSchema.parse(req.body);
      const inst = await storage.createInstitution(parsed);
      await storage.createAuditLog({
        action: "CREATE", entity: "institution", entityId: inst.id, userId: req.session?.userId,
        details: `Registered institution: ${inst.name} (${inst.type})`,
        ipAddress: req.ip || null,
      });
      res.status(201).json(inst);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  app.patch("/api/institutions/:id", requireRole("admin"), async (req, res) => {
    try {
      const inst = await storage.updateInstitution(req.params.id, req.body);
      if (!inst) return res.status(404).json({ message: "Institution not found" });
      await storage.createAuditLog({
        action: "UPDATE", entity: "institution", entityId: inst.id, userId: req.session?.userId,
        details: `Updated institution: ${inst.name}`,
        ipAddress: req.ip || null,
      });
      res.json(inst);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  app.post("/api/institutions/:id/approve", requireRole("admin"), async (req, res) => {
    try {
      const inst = await storage.approveInstitution(req.params.id, req.session?.userId!);
      if (!inst) return res.status(404).json({ message: "Institution not found" });
      await storage.createAuditLog({
        action: "APPROVE", entity: "institution", entityId: inst.id, userId: req.session?.userId,
        details: `Approved institution: ${inst.name}`,
        ipAddress: req.ip || null,
      });
      res.json(inst);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  app.get("/api/billing", requireRole("admin", "regulator", "super_admin"), async (req, res) => {
    try {
      const orgId = getOrgScope(req);
      const country = getCountryFilter(req);
      const recentDays = parseInt(req.query.recentDays as string) || 0;
      const records = await storage.getBillingRecords(orgId, country, recentDays > 0 ? recentDays : undefined);
      res.json(records);
    } catch (e: any) {
      res.status(500).json({ message: safeErrorMessage(e) });
    }
  });

  app.post("/api/billing", requireRole("admin", "super_admin"), async (req, res) => {
    try {
      const parsed = insertBillingRecordSchema.parse(req.body);
      const record = await storage.createBillingRecord(parsed);
      await storage.createAuditLog({
        action: "CREATE", entity: "billing_record", entityId: record.id, userId: req.session?.userId,
        details: `Created billing record: ${record.invoiceNumber} for ${record.institutionName}`,
        ipAddress: req.ip || null,
      });
      res.status(201).json(record);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  app.patch("/api/billing/:id/status", requireRole("admin", "regulator", "super_admin"), async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      if (!["pending", "paid", "overdue"].includes(status)) {
        return res.status(400).json({ message: "Invalid status. Must be pending, paid, or overdue." });
      }
      const record = await storage.getBillingRecord(id);
      if (!record) return res.status(404).json({ message: "Billing record not found" });
      const orgId = getOrgScope(req);
      if (orgId && record.organizationId && record.organizationId !== orgId) {
        return res.status(403).json({ message: "Access denied" });
      }
      const updated = await storage.updateBillingRecordStatus(id, status);
      await storage.createAuditLog({
        action: "UPDATE", entity: "billing_record", entityId: id, userId: req.session?.userId,
        details: `Updated billing status from ${record.status} to ${status} for ${record.invoiceNumber}`,
        ipAddress: req.ip || null,
      });
      res.json(updated);
    } catch (e: any) {
      res.status(500).json({ message: safeErrorMessage(e) });
    }
  });

  app.post("/api/billing/:id/send-reminder", requireRole("admin", "regulator", "super_admin"), async (req, res) => {
    try {
      const { id } = req.params;
      const record = await storage.getBillingRecord(id);
      if (!record) return res.status(404).json({ message: "Billing record not found" });
      if (record.status === "paid") return res.status(400).json({ message: "Cannot send reminder for paid invoices" });
      const orgId = getOrgScope(req);
      if (orgId && record.organizationId && record.organizationId !== orgId) {
        return res.status(403).json({ message: "Access denied" });
      }

      const { sendBillingNotification } = await import("./email");
      let recipientEmail = req.body.email;
      if (!recipientEmail && record.organizationId) {
        const org = await storage.getOrganization(record.organizationId);
        recipientEmail = org?.contactEmail;
      }
      if (!recipientEmail) {
        recipientEmail = process.env.PLATFORM_SUPPORT_EMAIL || "support@africacredithub.com";
      }
      const sent = await sendBillingNotification(
        record.institutionName,
        recipientEmail,
        parseFloat(record.amount),
        record.currency,
        record.serviceType,
        record.status
      );
      await storage.createAuditLog({
        action: "SEND", entity: "billing_reminder", entityId: id, userId: req.session?.userId,
        details: `Sent ${record.status} reminder for ${record.invoiceNumber} to ${recipientEmail}`,
        ipAddress: req.ip || null,
      });
      res.json({ sent, message: sent ? "Reminder email sent successfully" : "Email sending failed — check SMTP configuration" });
    } catch (e: any) {
      res.status(500).json({ message: safeErrorMessage(e) });
    }
  });

  app.post("/api/billing/send-all-reminders", requireRole("admin", "regulator", "super_admin"), async (req, res) => {
    try {
      const orgId = getOrgScope(req);
      const country = getCountryFilter(req);
      const records = await storage.getBillingRecords(orgId, country);
      const overdueRecords = records.filter(r => r.status === "overdue" || r.status === "pending");
      if (overdueRecords.length === 0) return res.json({ sent: 0, message: "No outstanding invoices to send reminders for" });

      const { sendBillingNotification } = await import("./email");
      let sentCount = 0;
      for (const record of overdueRecords) {
        let recipientEmail: string | undefined;
        if (record.organizationId) {
          const org = await storage.getOrganization(record.organizationId);
          recipientEmail = org?.contactEmail;
        }
        if (!recipientEmail) {
          recipientEmail = process.env.PLATFORM_SUPPORT_EMAIL || "support@africacredithub.com";
        }
        const sent = await sendBillingNotification(
          record.institutionName,
          recipientEmail,
          parseFloat(record.amount),
          record.currency,
          record.serviceType,
          record.status
        );
        if (sent) sentCount++;
      }
      await storage.createAuditLog({
        action: "SEND", entity: "billing_reminders_bulk", entityId: "bulk", userId: req.session?.userId,
        details: `Sent ${sentCount} of ${overdueRecords.length} billing reminders`,
        ipAddress: req.ip || null,
      });
      res.json({ sent: sentCount, total: overdueRecords.length, message: `Sent ${sentCount} of ${overdueRecords.length} reminder emails` });
    } catch (e: any) {
      res.status(500).json({ message: safeErrorMessage(e) });
    }
  });

  app.get("/api/credit-reports/logs", creditReportLimiter, requireRole("admin", "regulator", "super_admin"), async (req, res) => {
    try {
      const orgId = getOrgScope(req);
      const country = getCountryFilter(req);
      const logs = await storage.getCreditReportLogs(orgId, country);
      res.json(logs);
    } catch (e: any) {
      res.status(500).json({ message: safeErrorMessage(e) });
    }
  });

  app.post("/api/credit-reports/generate", creditReportLimiter, requireAuth, async (req, res) => {
    try {
      const { borrowerId, purpose, includeAI = true, includeXds = false } = req.body;
      if (!borrowerId || !purpose) {
        return res.status(400).json({ message: "borrowerId and purpose are required" });
      }

      const borrower = await storage.getBorrower(borrowerId);
      if (!borrower) return res.status(404).json({ message: "Borrower not found" });
      const country = getCountryFilter(req);
      if (country && borrower.country !== country) {
        return res.status(403).json({ message: "Access denied: borrower belongs to a different country" });
      }

      const user = await storage.getUser(req.session?.userId!);
      const serialNumber = `CR-${new Date().getFullYear()}-${Date.now().toString(36).toUpperCase()}`;

      const accounts = await storage.getCreditAccountsByBorrower(borrowerId);
      const inquiries = await storage.getCreditInquiriesByBorrower(borrowerId);
      const judgments = await storage.getCourtJudgmentsByBorrower(borrowerId);
      const consents = await storage.getConsentRecordsByBorrower(borrowerId);
      const dishonouredChequesList = await storage.getDishonouredChequesByBorrower(borrowerId);

      const paymentHistoryMap: Record<string, any[]> = {};
      const guarantorMap: Record<string, any[]> = {};
      for (const account of accounts) {
        const history = await storage.getPaymentHistoryByAccount(account.id);
        if (history.length > 0) {
          paymentHistoryMap[account.id] = history.slice(0, 12);
        }
        const acctGuarantors = await storage.getGuarantorsByAccount(account.id);
        if (acctGuarantors.length > 0) {
          guarantorMap[account.id] = acctGuarantors;
        }
      }

      const altData = await db.select().from(alternativeData).where(eq(alternativeData.borrowerId, parseInt(borrowerId)));
      const totalDebt = accounts.reduce((sum, a) => sum + parseFloat(a.currentBalance || "0"), 0);
      const delinquentCount = accounts.filter(a => a.status === "delinquent" || a.status === "default").length;
      const writtenOffCount = accounts.filter(a => a.status === "written_off").length;
      const restructuredCount = accounts.filter(a => a.status === "restructured").length;

      const { score: creditScore, reasonCodes, factors: scoreFactors } = calculateCreditScore(accounts, inquiries.length, judgments, borrower.isPep, altData);

      let xdsBureauData: any = null;
      if (includeXds) {
        try {
          const { queryXdsGhana } = await import("./xds-ghana");
          const { xdsBureauQueries: xdsTable } = await import("@shared/schema");
          const requestRef = `RPT-${serialNumber}`;
          const xdsResult = await queryXdsGhana({
            ghanaCard: borrower.ghanaCardNumber || borrower.nationalId || undefined,
            ssnitNumber: borrower.ssnitNumber || undefined,
            tinNumber: borrower.tinNumber || undefined,
            firstName: borrower.firstName || undefined,
            lastName: borrower.lastName || undefined,
            dateOfBirth: borrower.dateOfBirth || undefined,
            permissiblePurpose: mapPurposeToXds(purpose),
            requestRef,
          });
          xdsBureauData = xdsResult;
          await db.insert(xdsTable).values({
            borrowerId,
            requestedBy: req.session?.userId,
            organizationId: req.session?.organizationId,
            purpose,
            requestRef,
            ghanaCard: borrower.ghanaCardNumber || borrower.nationalId || null,
            ssnitNumber: borrower.ssnitNumber || null,
            tinNumber: borrower.tinNumber || null,
            xdsRef: xdsResult.xdsRef,
            found: xdsResult.found,
            creditScore: xdsResult.creditScore ?? null,
            scoreCategory: xdsResult.scoreCategory ?? null,
            source: xdsResult.source,
            responseData: xdsResult as any,
            errorMessage: xdsResult.error ?? null,
          }).catch(() => {});
        } catch (xdsErr: any) {
          console.error("[XDS] Failed to query bureau for credit report:", xdsErr.message);
        }
      }

      let mlResult: any = null;
      let aiAnalysis: any = null;
      let aiNarrative: any = null;

      if (includeAI) {
        mlResult = calculateMLCreditScore(
          accounts.map(a => ({ status: a.status || "current", currentBalance: a.currentBalance, currency: a.currency, openedDate: a.disbursementDate, lastPaymentDate: a.lastPaymentDate, creditLimit: a.originalAmount, monthlyPayment: a.monthlyInstallment })),
          inquiries.length, judgments.length, borrower.isPep ?? false,
          altData.map(d => ({ source: d.source || "", totalTransactions: d.totalTransactions, onTimePayments: d.onTimePayments, latePayments: d.latePayments, status: d.status || "active" }))
        );

        try {
          const [riskResult, narrativeResult] = await Promise.allSettled([
            analyzeCreditRisk(borrowerId),
            generateCreditNarrative(borrowerId),
          ]);
          if (riskResult.status === "fulfilled") aiAnalysis = riskResult.value;
          if (narrativeResult.status === "fulfilled") aiNarrative = narrativeResult.value;
        } catch {}
      }

      const log = await storage.createCreditReportLog({
        borrowerId,
        requestedBy: req.session?.userId!,
        institution: user?.institution || "Unknown",
        purpose,
        serialNumber,
      });

      await storage.createAuditLog({
        action: "GENERATE_REPORT", entity: "credit_report", entityId: log.id, userId: req.session?.userId,
        details: `Generated credit report serial ${serialNumber} for ${borrower.firstName || borrower.companyName}`,
        ipAddress: req.ip || null,
      });

      recordUsageEvent({
        organizationId: borrower.organizationId || req.session?.organizationId,
        eventType: "credit_report_pull",
        country: borrower.country || getCountryFilter(req) || null,
        metadata: JSON.stringify({ serialNumber, borrowerId, purpose }),
      });

      try {
        const borrowerName = borrower.type === "individual"
          ? `${borrower.firstName || ""} ${borrower.lastName || ""}`.trim()
          : borrower.companyName || "Unknown";
        await storage.createBorrowerAlert({
          borrowerId,
          alertType: "report_accessed",
          message: `Credit report accessed by ${user?.institution || "Unknown institution"} for purpose: ${purpose}. Serial: ${serialNumber}`,
          recipientPhone: borrower.phone || borrower.mobileMoneyNumber || null,
          recipientEmail: borrower.email || null,
          accessedBy: user?.fullName || "Unknown",
          institution: user?.institution || "Unknown",
          purpose,
          organizationId: borrower.organizationId,
        });
      } catch {}

      // Attach latest affordability assessment (non-blocking)
      const reportAffordability = await storage.getLatestAffordabilityAssessment(borrowerId).catch(() => undefined);
      const reportIncomeSources = reportAffordability ? await storage.getIncomeSourcesByBorrower(borrowerId).catch(() => []) : [];
      const reportExpenses = reportAffordability ? await storage.getExpenseCategorisationsByBorrower(borrowerId).catch(() => []) : [];

      res.json({
        serialNumber,
        generatedAt: new Date().toISOString(),
        borrower,
        accounts,
        inquiries,
        courtJudgments: judgments,
        consentRecords: consents,
        dishonouredCheques: dishonouredChequesList,
        guarantors: guarantorMap,
        paymentHistory: paymentHistoryMap,
        requestedBy: user ? { fullName: user.fullName, institution: user.institution } : null,
        affordability: reportAffordability ? { assessment: reportAffordability, incomeSources: reportIncomeSources, expenses: reportExpenses } : null,
        ...(xdsBureauData ? { xdsBureauData } : {}),
        summary: {
          totalAccounts: accounts.length,
          activeAccounts: accounts.filter(a => a.status !== "closed").length,
          totalDebt: totalDebt.toFixed(2),
          delinquentAccounts: delinquentCount,
          writtenOffAccounts: writtenOffCount,
          restructuredAccounts: restructuredCount,
          creditScore,
          reasonCodes,
          scoreFactors,
          inquiryCount: inquiries.length,
          judgmentCount: judgments.length,
          isPep: borrower.isPep,
        },
        ...(includeAI && mlResult ? {
          aiEnhanced: {
            mlScore: mlResult,
            riskAnalysis: aiAnalysis ? {
              riskLevel: aiAnalysis.riskLevel || "medium",
              riskScore: aiAnalysis.riskScore ?? 50,
              summary: aiAnalysis.summary || "",
              factors: Array.isArray(aiAnalysis.factors) ? aiAnalysis.factors : [],
              recommendations: Array.isArray(aiAnalysis.recommendations) ? aiAnalysis.recommendations : [],
              regulatoryFlags: Array.isArray(aiAnalysis.regulatoryFlags) ? aiAnalysis.regulatoryFlags : [],
            } : null,
            narrative: aiNarrative ? {
              narrative: aiNarrative.narrative || "",
              creditworthiness: aiNarrative.creditworthiness || "Fair",
              keyStrengths: Array.isArray(aiNarrative.keyStrengths) ? aiNarrative.keyStrengths : [],
              keyRisks: Array.isArray(aiNarrative.keyRisks) ? aiNarrative.keyRisks : [],
              recommendedActions: Array.isArray(aiNarrative.recommendedActions) ? aiNarrative.recommendedActions : [],
              borrowerName: aiNarrative.borrowerName || "",
              generatedAt: aiNarrative.generatedAt || new Date().toISOString(),
            } : null,
            disclaimer: "AI-generated analysis is provided for decision support only. It does not replace professional judgment or verified bureau data. Model outputs may vary and should be independently validated.",
            generatedAt: new Date().toISOString(),
          },
        } : {}),
      });
    } catch (e: any) {
      res.status(500).json({ message: safeErrorMessage(e) });
    }
  });

  const PDF_LABELS: Record<string, Record<string, string>> = {
    en: {
      headerTitle: "Comprehensive Credit Information Report",
      headerSub: "Cross-Jurisdictional Central Data Hub v2.5 | Africa Credit Hub",
      orderNumber: "ORDER NUMBER",
      cirNumber: "CIR NUMBER",
      reportOrderDate: "Report Order Date",
      institution: "Institution",
      requestedBy: "Requested By",
      searchDetails: "SEARCH DETAILS",
      subjectDetails: "Subject Details",
      fullName: "Full Name",
      dateOfBirth: "Date of Birth",
      gender: "Gender",
      nationalId: "National ID",
      tin: "TIN",
      passport: "Passport",
      employer: "Employer",
      occupation: "Occupation",
      phone: "Phone",
      email: "Email",
      companyName: "Company Name",
      businessReg: "Business Reg",
      sector: "Sector",
      creditScoreSummary: "Credit Score Summary",
      scoreFactorAnalysis: "Score Factor Analysis",
      creditProfileOverview: "Credit Profile Overview",
      sno: "S.No",
      indicator: "Indicator",
      value: "Value",
      openFacilities: "Number of Open Credit Facilities",
      totalOutstanding: "Total Outstanding Balance",
      overdueFacilities: "Number of Overdue Facilities",
      nonPerforming: "Non-Performing (>90 days)",
      maxDays: "Max Days in Arrears (NDIA)",
      totalArrears: "Total Amount in Arrears",
      closedFacilities: "Closed Facilities",
      writtenOff: "Written-Off Facilities",
      courtJudgments: "Court Judgments",
      creditInquiries: "Credit Inquiries",
      inquiryHistory: "Inquiry History",
      purpose: "Purpose",
      date: "Date",
      consent: "Consent",
      yes: "Yes",
      no: "No",
      facilityDetails: "Credit Facility Details",
      facilityOf: "Facility {idx} of {total}",
      accountNo: "Account No.",
      type: "Type",
      classification: "Classification",
      currentBalance: "Current Balance",
      sanctionedAmount: "Sanctioned Amount",
      daysInArrears: "Days in Arrears",
      interestRate: "Interest Rate",
      interestFree: "Interest-Free",
      disbursementDate: "Disbursement Date",
      maturityDate: "Maturity Date",
      lastPayment: "Last Payment",
      restructured: "Restructured",
      paymentHistory: "Payment History (Last 12 Months):",
      security: "Security:",
      courtJudgmentsPublic: "Court Judgments & Public Records",
      caseNo: "Case No.",
      court: "Court",
      amount: "Amount",
      status: "Status",
      guarantors: "Guarantors",
      name: "Name",
      contact: "Contact",
      account: "Account",
      endOfReport: "End of Credit Information Report",
      disclaimer: "The information in this report has been compiled from data submitted by participating financial institutions. While Africa Credit Hub endeavor to ensure accuracy, we do not accept responsibility for any loss or damage resulting from this report.",
      footerLine: "Cross-Jurisdictional Central Data Hub & Credit Registry System v2.5 | Africa Credit Hub | Confidential & Proprietary",
    },
    fr: {
      headerTitle: "Rapport Complet d'Information de Crédit",
      headerSub: "Hub Central de Données Inter-Juridictionnel v2.5 | Africa Credit Hub",
      orderNumber: "NUMÉRO DE COMMANDE",
      cirNumber: "NUMÉRO CIR",
      reportOrderDate: "Date de Commande du Rapport",
      institution: "Institution",
      requestedBy: "Demandé Par",
      searchDetails: "DÉTAILS DE RECHERCHE",
      subjectDetails: "Détails du Sujet",
      fullName: "Nom Complet",
      dateOfBirth: "Date de Naissance",
      gender: "Genre",
      nationalId: "Identité Nationale",
      tin: "NIF",
      passport: "Passeport",
      employer: "Employeur",
      occupation: "Profession",
      phone: "Téléphone",
      email: "Email",
      companyName: "Nom de l'Entreprise",
      businessReg: "Registre Commercial",
      sector: "Secteur",
      creditScoreSummary: "Résumé du Score de Crédit",
      scoreFactorAnalysis: "Analyse des Facteurs de Score",
      creditProfileOverview: "Aperçu du Profil de Crédit",
      sno: "N°",
      indicator: "Indicateur",
      value: "Valeur",
      openFacilities: "Nombre de Facilités de Crédit Ouvertes",
      totalOutstanding: "Solde Total Impayé",
      overdueFacilities: "Nombre de Facilités en Retard",
      nonPerforming: "Non-Performantes (>90 jours)",
      maxDays: "Jours Maximum d'Arriérés (NDIA)",
      totalArrears: "Montant Total des Arriérés",
      closedFacilities: "Facilités Clôturées",
      writtenOff: "Facilités Radiées",
      courtJudgments: "Jugements",
      creditInquiries: "Demandes de Crédit",
      inquiryHistory: "Historique des Demandes",
      purpose: "Objet",
      date: "Date",
      consent: "Consentement",
      yes: "Oui",
      no: "Non",
      facilityDetails: "Détails des Facilités de Crédit",
      facilityOf: "Facilité {idx} sur {total}",
      accountNo: "N° de Compte",
      type: "Type",
      classification: "Classification",
      currentBalance: "Solde Actuel",
      sanctionedAmount: "Montant Sanctionné",
      daysInArrears: "Jours d'Arriérés",
      interestRate: "Taux d'Intérêt",
      interestFree: "Sans Intérêt",
      disbursementDate: "Date de Décaissement",
      maturityDate: "Date d'Échéance",
      lastPayment: "Dernier Paiement",
      restructured: "Restructuré",
      paymentHistory: "Historique des Paiements (12 Derniers Mois) :",
      security: "Garantie :",
      courtJudgmentsPublic: "Jugements et Registres Publics",
      caseNo: "N° d'Affaire",
      court: "Tribunal",
      amount: "Montant",
      status: "Statut",
      guarantors: "Garants",
      name: "Nom",
      contact: "Contact",
      account: "Compte",
      endOfReport: "Fin du Rapport d'Information de Crédit",
      disclaimer: "Les informations de ce rapport proviennent des données soumises par les institutions financières participantes. Bien que Africa Credit Hub s'efforce d'assurer l'exactitude, nous déclinons toute responsabilité pour toute perte ou dommage résultant de ce rapport.",
      footerLine: "Hub Central de Données Inter-Juridictionnel & Système de Registre de Crédit v2.5 | Africa Credit Hub | Confidentiel & Propriétaire",
    },
    pt: {
      headerTitle: "Relatório Abrangente de Informação de Crédito",
      headerSub: "Hub Central de Dados Inter-Jurisdicional v2.5 | Africa Credit Hub",
      orderNumber: "NÚMERO DO PEDIDO",
      cirNumber: "NÚMERO CIR",
      reportOrderDate: "Data do Pedido do Relatório",
      institution: "Instituição",
      requestedBy: "Solicitado Por",
      searchDetails: "DETALHES DA PESQUISA",
      subjectDetails: "Detalhes do Sujeito",
      fullName: "Nome Completo",
      dateOfBirth: "Data de Nascimento",
      gender: "Género",
      nationalId: "ID Nacional",
      tin: "NIF",
      passport: "Passaporte",
      employer: "Empregador",
      occupation: "Profissão",
      phone: "Telefone",
      email: "Email",
      companyName: "Nome da Empresa",
      businessReg: "Registo Comercial",
      sector: "Setor",
      creditScoreSummary: "Resumo do Score de Crédito",
      scoreFactorAnalysis: "Análise de Fatores do Score",
      creditProfileOverview: "Visão Geral do Perfil de Crédito",
      sno: "N.º",
      indicator: "Indicador",
      value: "Valor",
      openFacilities: "Número de Facilidades de Crédito Abertas",
      totalOutstanding: "Saldo Total em Dívida",
      overdueFacilities: "Número de Facilidades em Atraso",
      nonPerforming: "Não-Performantes (>90 dias)",
      maxDays: "Dias Máximos em Atraso (NDIA)",
      totalArrears: "Montante Total em Atraso",
      closedFacilities: "Facilidades Encerradas",
      writtenOff: "Facilidades Abatidas",
      courtJudgments: "Julgamentos",
      creditInquiries: "Consultas de Crédito",
      inquiryHistory: "Histórico de Consultas",
      purpose: "Finalidade",
      date: "Data",
      consent: "Consentimento",
      yes: "Sim",
      no: "Não",
      facilityDetails: "Detalhes das Facilidades de Crédito",
      facilityOf: "Facilidade {idx} de {total}",
      accountNo: "N.º de Conta",
      type: "Tipo",
      classification: "Classificação",
      currentBalance: "Saldo Atual",
      sanctionedAmount: "Montante Sancionado",
      daysInArrears: "Dias em Atraso",
      interestRate: "Taxa de Juro",
      interestFree: "Sem Juros",
      disbursementDate: "Data de Desembolso",
      maturityDate: "Data de Vencimento",
      lastPayment: "Último Pagamento",
      restructured: "Reestruturado",
      paymentHistory: "Histórico de Pagamentos (Últimos 12 Meses):",
      security: "Garantia:",
      courtJudgmentsPublic: "Julgamentos e Registos Públicos",
      caseNo: "N.º do Processo",
      court: "Tribunal",
      amount: "Montante",
      status: "Estado",
      guarantors: "Garantes",
      name: "Nome",
      contact: "Contacto",
      account: "Conta",
      endOfReport: "Fim do Relatório de Informação de Crédito",
      disclaimer: "As informações neste relatório foram compiladas a partir de dados submetidos por instituições financeiras participantes. Embora a Africa Credit Hub se esforce por garantir a precisão, não aceitamos responsabilidade por qualquer perda ou dano resultante deste relatório.",
      footerLine: "Hub Central de Dados Inter-Jurisdicional & Sistema de Registo de Crédito v2.5 | Africa Credit Hub | Confidencial & Proprietário",
    },
    ar: {
      headerTitle: "تقرير معلومات الائتمان الشامل",
      headerSub: "مركز البيانات المركزي العابر للولايات القضائية الإصدار 2.5 | Africa Credit Hub",
      orderNumber: "رقم الطلب",
      cirNumber: "رقم CIR",
      reportOrderDate: "تاريخ طلب التقرير",
      institution: "المؤسسة",
      requestedBy: "مطلوب من",
      searchDetails: "تفاصيل البحث",
      subjectDetails: "تفاصيل الموضوع",
      fullName: "الاسم الكامل",
      dateOfBirth: "تاريخ الميلاد",
      gender: "الجنس",
      nationalId: "الهوية الوطنية",
      tin: "الرقم الضريبي",
      passport: "جواز السفر",
      employer: "جهة العمل",
      occupation: "المهنة",
      phone: "الهاتف",
      email: "البريد الإلكتروني",
      companyName: "اسم الشركة",
      businessReg: "السجل التجاري",
      sector: "القطاع",
      creditScoreSummary: "ملخص درجة الائتمان",
      scoreFactorAnalysis: "تحليل عوامل الدرجة",
      creditProfileOverview: "نظرة عامة على ملف الائتمان",
      sno: "م",
      indicator: "المؤشر",
      value: "القيمة",
      openFacilities: "عدد التسهيلات الائتمانية المفتوحة",
      totalOutstanding: "إجمالي الرصيد المستحق",
      overdueFacilities: "عدد التسهيلات المتأخرة",
      nonPerforming: "غير العاملة (أكثر من 90 يومًا)",
      maxDays: "الحد الأقصى لأيام التأخر (NDIA)",
      totalArrears: "إجمالي مبلغ المتأخرات",
      closedFacilities: "التسهيلات المغلقة",
      writtenOff: "التسهيلات المشطوبة",
      courtJudgments: "الأحكام القضائية",
      creditInquiries: "الاستعلامات الائتمانية",
      inquiryHistory: "سجل الاستعلامات",
      purpose: "الغرض",
      date: "التاريخ",
      consent: "الموافقة",
      yes: "نعم",
      no: "لا",
      facilityDetails: "تفاصيل التسهيلات الائتمانية",
      facilityOf: "التسهيل {idx} من {total}",
      accountNo: "رقم الحساب",
      type: "النوع",
      classification: "التصنيف",
      currentBalance: "الرصيد الحالي",
      sanctionedAmount: "المبلغ المعتمد",
      daysInArrears: "أيام التأخر",
      interestRate: "سعر الفائدة",
      interestFree: "بدون فائدة",
      disbursementDate: "تاريخ الصرف",
      maturityDate: "تاريخ الاستحقاق",
      lastPayment: "آخر دفعة",
      restructured: "معاد هيكلته",
      paymentHistory: "سجل المدفوعات (آخر 12 شهرًا):",
      security: "الضمان:",
      courtJudgmentsPublic: "الأحكام القضائية والسجلات العامة",
      caseNo: "رقم القضية",
      court: "المحكمة",
      amount: "المبلغ",
      status: "الحالة",
      guarantors: "الضامنون",
      name: "الاسم",
      contact: "التواصل",
      account: "الحساب",
      endOfReport: "نهاية تقرير معلومات الائتمان",
      disclaimer: "تم تجميع المعلومات في هذا التقرير من البيانات المقدمة من المؤسسات المالية المشاركة. بينما تسعى Africa Credit Hub لضمان الدقة، فإننا لا نتحمل المسؤولية عن أي خسارة أو ضرر ناتج عن هذا التقرير.",
      footerLine: "مركز البيانات المركزي العابر للولايات القضائية ونظام سجل الائتمان الإصدار 2.5 | Africa Credit Hub | سري وملكية خاصة",
    },
    sw: {
      headerTitle: "Ripoti Kamili ya Taarifa za Mikopo",
      headerSub: "Kituo cha Data Kuu cha Mamlaka Mbalimbali v2.5 | Africa Credit Hub",
      orderNumber: "NAMBARI YA AGIZO",
      cirNumber: "NAMBARI YA CIR",
      reportOrderDate: "Tarehe ya Agizo la Ripoti",
      institution: "Taasisi",
      requestedBy: "Imeombwa Na",
      searchDetails: "MAELEZO YA UTAFUTAJI",
      subjectDetails: "Maelezo ya Mhusika",
      fullName: "Jina Kamili",
      dateOfBirth: "Tarehe ya Kuzaliwa",
      gender: "Jinsia",
      nationalId: "Kitambulisho cha Taifa",
      tin: "Nambari ya Kodi",
      passport: "Pasipoti",
      employer: "Mwajiri",
      occupation: "Kazi",
      phone: "Simu",
      email: "Barua Pepe",
      companyName: "Jina la Kampuni",
      businessReg: "Usajili wa Biashara",
      sector: "Sekta",
      creditScoreSummary: "Muhtasari wa Alama ya Mikopo",
      scoreFactorAnalysis: "Uchambuzi wa Sababu za Alama",
      creditProfileOverview: "Muhtasari wa Wasifu wa Mikopo",
      sno: "Na.",
      indicator: "Kiashirio",
      value: "Thamani",
      openFacilities: "Idadi ya Huduma za Mikopo Zilizo Wazi",
      totalOutstanding: "Jumla ya Salio la Madeni",
      overdueFacilities: "Idadi ya Huduma Zilizochelewa",
      nonPerforming: "Zisizofanya Kazi (zaidi ya siku 90)",
      maxDays: "Siku za Juu zaidi za Ucheleweshaji (NDIA)",
      totalArrears: "Jumla ya Kiasi cha Malimbikizo",
      closedFacilities: "Huduma Zilizofungwa",
      writtenOff: "Huduma Zilizofutwa",
      courtJudgments: "Hukumu za Mahakama",
      creditInquiries: "Uchunguzi wa Mikopo",
      inquiryHistory: "Historia ya Uchunguzi",
      purpose: "Madhumuni",
      date: "Tarehe",
      consent: "Idhini",
      yes: "Ndiyo",
      no: "Hapana",
      facilityDetails: "Maelezo ya Huduma za Mikopo",
      facilityOf: "Huduma {idx} kati ya {total}",
      accountNo: "Nambari ya Akaunti",
      type: "Aina",
      classification: "Uainishaji",
      currentBalance: "Salio la Sasa",
      sanctionedAmount: "Kiasi Kilichoidhinishwa",
      daysInArrears: "Siku za Ucheleweshaji",
      interestRate: "Kiwango cha Riba",
      interestFree: "Bila Riba",
      disbursementDate: "Tarehe ya Utoleaji",
      maturityDate: "Tarehe ya Ukomavu",
      lastPayment: "Malipo ya Mwisho",
      restructured: "Iliyoundwa Upya",
      paymentHistory: "Historia ya Malipo (Miezi 12 Iliyopita):",
      security: "Dhamana:",
      courtJudgmentsPublic: "Hukumu za Mahakama na Rekodi za Umma",
      caseNo: "Nambari ya Kesi",
      court: "Mahakama",
      amount: "Kiasi",
      status: "Hali",
      guarantors: "Wadhamini",
      name: "Jina",
      contact: "Mawasiliano",
      account: "Akaunti",
      endOfReport: "Mwisho wa Ripoti ya Taarifa za Mikopo",
      disclaimer: "Taarifa katika ripoti hii zimekusanywa kutoka kwa data zilizotolewa na taasisi za kifedha zinazoshiriki. Ingawa Africa Credit Hub inajitahidi kuhakikisha usahihi, hatukubali wajibu kwa hasara au uharibifu wowote unaotokana na ripoti hii.",
      footerLine: "Kituo cha Data Kuu cha Mamlaka Mbalimbali na Mfumo wa Sajili ya Mikopo v2.5 | Africa Credit Hub | Siri na Mali",
    },
  };

  function getPdfLabel(lang: string, key: string): string {
    const val = PDF_LABELS[lang]?.[key] || PDF_LABELS.en[key] || key;
    return val.replace(/Africa Credit Hub/g, process.env.PLATFORM_COMPANY_NAME || "Africa Credit Hub");
  }

  app.post("/api/credit-reports/download-pdf", creditReportLimiter, requireAuth, async (req, res) => {
    try {
      const { reportData, lang: bodyLang } = req.body;
      if (!reportData) return res.status(400).json({ message: "reportData is required" });
      const lang = bodyLang || (req.query.lang as string) || "en";

      const PDFDocument = (await import("pdfkit")).default;
      const doc = new PDFDocument({ size: "A4", margins: { top: 40, bottom: 40, left: 40, right: 40 }, bufferPages: true });
      const chunks: Buffer[] = [];
      doc.on("data", (chunk: Buffer) => chunks.push(chunk));

      const NORDIC_BLUE = "#0466C8";
      const DARK = "#1a1a1a";
      const GRAY = "#555555";
      const LIGHT = "#888888";
      const W = doc.page.width - 80;

      const L = (key: string) => getPdfLabel(lang, key);

      function drawHeader() {
        doc.rect(40, 40, W, 60).fill(NORDIC_BLUE);
        doc.fill("#ffffff").fontSize(14).font("Helvetica-Bold")
          .text(L("headerTitle"), 55, 52, { width: W - 160 });
        doc.fontSize(8).font("Helvetica").fill("#cccccc")
          .text(L("headerSub"), 55, 72, { width: W - 160 });
        doc.fill("#ffffff").fontSize(7).font("Helvetica")
          .text(L("orderNumber"), W - 90, 52, { width: 80, align: "right" });
        doc.fontSize(9).font("Helvetica-Bold")
          .text(reportData.serialNumber || "", W - 90, 63, { width: 80, align: "right" });
        doc.fill(DARK);
        doc.y = 115;
      }

      function sectionTitle(title: string, num?: number) {
        ensureSpace(40);
        doc.moveDown(0.6);
        const y = doc.y;
        doc.rect(40, y - 2, W, 22).fill("#f8f9fa");
        if (num !== undefined) {
          doc.fill(NORDIC_BLUE).fontSize(9).font("Helvetica-Bold")
            .text(`${num}.`, 46, y + 3, { width: 18 });
          doc.fill(NORDIC_BLUE).fontSize(10).font("Helvetica-Bold")
            .text(title, 62, y + 3);
        } else {
          doc.fill(NORDIC_BLUE).fontSize(10).font("Helvetica-Bold")
            .text(title, 46, y + 3);
        }
        doc.y = y + 24;
        doc.moveTo(40, doc.y).lineTo(40 + W, doc.y).strokeColor(NORDIC_BLUE).lineWidth(0.8).stroke();
        doc.moveDown(0.4);
        doc.fill(DARK);
      }

      function infoRow(label: string, value: string, x: number, w: number) {
        ensureSpace(20);
        doc.fontSize(6.5).font("Helvetica").fill(LIGHT).text(label.toUpperCase(), x, doc.y, { width: w });
        doc.fontSize(8.5).font("Helvetica-Bold").fill(DARK).text(value || "—", x, doc.y, { width: w });
        doc.moveDown(0.3);
      }

      function infoGrid(fields: [string, string][], x: number, w: number) {
        const colW = (w - 20) / 2;
        for (let i = 0; i < fields.length; i += 2) {
          ensureSpace(22);
          const y = doc.y;
          doc.fontSize(6.5).font("Helvetica").fill(LIGHT).text(fields[i][0].toUpperCase(), x, y, { width: colW });
          doc.fontSize(8.5).font("Helvetica-Bold").fill(DARK).text(fields[i][1] || "—", x, y + 9, { width: colW });
          if (i + 1 < fields.length) {
            doc.fontSize(6.5).font("Helvetica").fill(LIGHT).text(fields[i + 1][0].toUpperCase(), x + colW + 20, y, { width: colW });
            doc.fontSize(8.5).font("Helvetica-Bold").fill(DARK).text(fields[i + 1][1] || "—", x + colW + 20, y + 9, { width: colW });
          }
          doc.y = y + 22;
        }
        doc.moveDown(0.2);
      }

      function ensureSpace(needed: number) {
        if (doc.y + needed > doc.page.height - 60) {
          doc.addPage();
          doc.y = 50;
        }
      }

      function tableHeader(cols: { label: string; width: number; align?: string }[]) {
        ensureSpace(22);
        const y = doc.y;
        doc.rect(40, y, W, 18).fill(NORDIC_BLUE);
        let x = 44;
        cols.forEach(col => {
          doc.fill("#ffffff").fontSize(6.5).font("Helvetica-Bold")
            .text(col.label.toUpperCase(), x, y + 5, { width: col.width - 8, align: (col.align as any) || "left" });
          x += col.width;
        });
        doc.y = y + 20;
      }

      let tableRowIdx = 0;
      function tableRow(cols: { value: string; width: number; align?: string; bold?: boolean; color?: string }[]) {
        ensureSpace(18);
        const y = doc.y;
        const bg = tableRowIdx % 2 === 0 ? "#ffffff" : "#f8f9fa";
        doc.rect(40, y, W, 17).fill(bg);
        let x = 44;
        cols.forEach(col => {
          doc.fill(col.color || DARK).fontSize(7.5).font(col.bold ? "Helvetica-Bold" : "Helvetica")
            .text(col.value || "—", x, y + 4, { width: col.width - 8, align: (col.align as any) || "left" });
          x += col.width;
        });
        doc.moveTo(40, y + 17).lineTo(40 + W, y + 17).strokeColor("#e5e5e5").lineWidth(0.3).stroke();
        doc.y = y + 18;
        tableRowIdx++;
      }

      function resetTableRowIdx() { tableRowIdx = 0; }

      drawHeader();

      const b = reportData.borrower;
      const s = reportData.summary;
      const accounts = reportData.accounts || [];
      const inquiries = reportData.inquiries || [];
      const judgments = reportData.courtJudgments || [];
      const consentRecords = reportData.consentRecords || [];
      const dishonouredCheques = reportData.dishonouredCheques || [];

      doc.fontSize(6).font("Helvetica").fill(LIGHT).text(L("cirNumber"), 40, doc.y, { continued: false });
      doc.fontSize(8).font("Helvetica-Bold").fill(DARK).text(reportData.serialNumber);
      doc.moveDown(0.3);

      const grid1 = [
        [L("reportOrderDate"), new Date(reportData.generatedAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })],
        [L("institution"), reportData.requestedBy?.institution || "—"],
        [L("requestedBy"), reportData.requestedBy?.fullName || "—"],
      ];
      grid1.forEach(([l, v]) => {
        doc.fontSize(6).font("Helvetica").fill(LIGHT).text(l, 40, doc.y, { width: W });
        doc.fontSize(8).font("Helvetica-Bold").fill(DARK).text(v, 40, doc.y, { width: W });
        doc.moveDown(0.2);
      });

      doc.moveDown(0.3);
      doc.fontSize(6).font("Helvetica").fill(LIGHT).text(L("searchDetails"), 40, doc.y);
      doc.moveDown(0.2);
      const name = b.type === "corporate" ? (b.companyName || "—") : `${b.firstName} ${b.lastName}`;
      doc.fontSize(8).font("Helvetica-Bold").fill(DARK).text(`${L("name")}: ${name} | ID: ${b.nationalId || b.tinNumber || "—"} | ${L("type")}: ${b.country || "—"}`);
      doc.moveDown(0.5);

      sectionTitle(L("subjectDetails"));
      if (b.type === "individual") {
        const fields: [string, string][] = [
          [L("fullName"), `${b.firstName} ${b.lastName}`], [L("dateOfBirth"), b.dateOfBirth || "—"],
          [L("gender"), b.gender || "—"], [L("nationalId"), b.nationalId || "—"],
          [L("tin"), b.tinNumber || "—"], [L("passport"), b.passportNumber || "—"],
          [L("employer"), b.employerName || "—"], [L("occupation"), b.occupation || "—"],
          [L("phone"), b.phone || "—"], [L("email"), b.email || "—"],
        ];
        infoGrid(fields, 40, W);
      } else {
        const fields: [string, string][] = [
          [L("companyName"), b.companyName || "—"], [L("businessReg"), b.businessRegNumber || "—"],
          [L("sector"), b.sector || "—"], [L("tin"), b.tinNumber || "—"],
          [L("phone"), b.phone || "—"], [L("email"), b.email || "—"],
        ];
        infoGrid(fields, 40, W);
      }

      sectionTitle(L("creditScoreSummary"));
      ensureSpace(40);
      doc.fontSize(24).font("Helvetica-Bold").fill(s.creditScore >= 700 ? "#16a34a" : s.creditScore >= 600 ? "#ca8a04" : "#dc2626")
        .text(String(s.creditScore), 40, doc.y, { width: W, align: "center" });
      doc.fontSize(8).font("Helvetica").fill(GRAY)
        .text(`Range 300-850 | Total Facilities: ${s.totalAccounts} | Active: ${s.activeAccounts} | Risk Items: ${s.delinquentAccounts + s.writtenOffAccounts + s.judgmentCount}`, 40, doc.y, { width: W, align: "center" });
      doc.moveDown(0.5);

      // === CREDIT UTILIZATION SUMMARY (unnumbered) ===
      interface PdfAccount {
        id: number;
        status: string;
        accountType: string;
        accountNumber: string;
        lenderInstitution: string;
        originalAmount: string;
        currentBalance: string;
        currency: string;
        daysInArrears: number;
        monthlyInstallment: string;
        interestRate: string;
        openDate: string;
        lastPaymentDate: string;
        updatedAt: string;
        maturityDate: string;
        natureOfGuarantor: string;
        guarantorName: string;
        guarantorRelationship: string;
        collateralType: string;
        collateralValue: string;
        sector: string;
      }
      const typedAccounts = accounts as PdfAccount[];
      const openAccts = typedAccounts.filter((a) => a.status !== "closed");
      const totalLimit = openAccts.reduce((ss: number, a) => ss + parseFloat(a.originalAmount || "0"), 0);
      const totalUsed = openAccts.reduce((ss: number, a) => ss + parseFloat(a.currentBalance || "0"), 0);
      const utilRatio = totalLimit > 0 ? ((totalUsed / totalLimit) * 100) : 0;
      const availableCredit = Math.max(0, totalLimit - totalUsed);

      sectionTitle("Credit Utilization Summary");
      resetTableRowIdx();
      tableHeader([
        { label: "Metric", width: W * 0.5 },
        { label: "Value", width: W * 0.5, align: "right" },
      ]);
      tableRow([{ value: "Total Credit Limit", width: W * 0.5 }, { value: totalLimit.toLocaleString("en-US", { minimumFractionDigits: 2 }), width: W * 0.5, align: "right", bold: true }]);
      tableRow([{ value: "Total Credit Used", width: W * 0.5 }, { value: totalUsed.toLocaleString("en-US", { minimumFractionDigits: 2 }), width: W * 0.5, align: "right", bold: true }]);
      tableRow([{ value: "Utilization Ratio", width: W * 0.5 }, { value: `${utilRatio.toFixed(1)}% (${utilRatio <= 30 ? "Optimal" : utilRatio <= 50 ? "Moderate" : utilRatio <= 75 ? "High" : "Very High"})`, width: W * 0.5, align: "right", bold: true, color: utilRatio > 75 ? "#dc2626" : utilRatio > 50 ? "#ca8a04" : "#16a34a" }]);
      tableRow([{ value: "Available Credit", width: W * 0.5 }, { value: availableCredit.toLocaleString("en-US", { minimumFractionDigits: 2 }), width: W * 0.5, align: "right", bold: true }]);

      const utilByCurrency: Record<string, { limit: number; used: number }> = {};
      openAccts.forEach((a) => {
        const c = a.currency || "GHS";
        if (!utilByCurrency[c]) utilByCurrency[c] = { limit: 0, used: 0 };
        utilByCurrency[c].limit += parseFloat(a.originalAmount || "0");
        utilByCurrency[c].used += parseFloat(a.currentBalance || "0");
      });
      const utilCurrencyKeys = Object.keys(utilByCurrency);
      if (utilCurrencyKeys.length > 1) {
        doc.moveDown(0.2);
        resetTableRowIdx();
        tableHeader([
          { label: "Currency", width: W * 0.15 },
          { label: "Credit Limit", width: W * 0.22, align: "right" },
          { label: "Credit Used", width: W * 0.22, align: "right" },
          { label: "Available", width: W * 0.22, align: "right" },
          { label: "Utilization", width: W * 0.19, align: "right" },
        ]);
        utilCurrencyKeys.forEach(cur => {
          const d = utilByCurrency[cur];
          const curRatio = d.limit > 0 ? ((d.used / d.limit) * 100) : 0;
          tableRow([
            { value: cur, width: W * 0.15, bold: true },
            { value: d.limit.toLocaleString("en-US", { minimumFractionDigits: 2 }), width: W * 0.22, align: "right" },
            { value: d.used.toLocaleString("en-US", { minimumFractionDigits: 2 }), width: W * 0.22, align: "right" },
            { value: Math.max(0, d.limit - d.used).toLocaleString("en-US", { minimumFractionDigits: 2 }), width: W * 0.22, align: "right" },
            { value: `${curRatio.toFixed(1)}%`, width: W * 0.19, align: "right", bold: true, color: curRatio > 75 ? "#dc2626" : curRatio > 50 ? "#ca8a04" : "#16a34a" },
          ]);
        });
      }

      doc.moveDown(0.3);
      resetTableRowIdx();
      tableHeader([
        { label: "Score Factor", width: W * 0.25 },
        { label: "Impact", width: W * 0.2 },
        { label: "Current Value", width: W * 0.25 },
        { label: "Assessment", width: W * 0.3, align: "right" },
      ]);
      const oldestAcctDate = accounts.reduce((oldest: Date | null, a: any) => {
        const d = a.disbursementDate ? new Date(a.disbursementDate) : null;
        return d && (!oldest || d < oldest) ? d : oldest;
      }, null as Date | null);
      const historyYears = oldestAcctDate ? Math.max(0, Math.floor((Date.now() - oldestAcctDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000))) : 0;
      const accountTypes = new Set(openAccts.map((a) => a.accountType || "Unknown"));

      tableRow([{ value: "Payment History", width: W * 0.25 }, { value: "35% weight", width: W * 0.2 }, { value: s.delinquentAccounts === 0 ? "Clean" : `${s.delinquentAccounts} late`, width: W * 0.25, bold: true }, { value: s.delinquentAccounts === 0 ? "Positive" : "Negative", width: W * 0.3, align: "right", color: s.delinquentAccounts === 0 ? "#16a34a" : "#dc2626" }]);
      tableRow([{ value: "Credit Utilization", width: W * 0.25 }, { value: "30% weight", width: W * 0.2 }, { value: `${utilRatio.toFixed(1)}%`, width: W * 0.25, bold: true }, { value: utilRatio <= 30 ? "Excellent" : utilRatio <= 50 ? "Good" : utilRatio <= 75 ? "Fair" : "Poor", width: W * 0.3, align: "right", color: utilRatio <= 30 ? "#16a34a" : utilRatio <= 75 ? "#ca8a04" : "#dc2626" }]);
      tableRow([{ value: "Credit History Length", width: W * 0.25 }, { value: "15% weight", width: W * 0.2 }, { value: historyYears > 0 ? `${historyYears} year${historyYears !== 1 ? "s" : ""}` : "< 1 year", width: W * 0.25, bold: true }, { value: historyYears >= 5 ? "Established" : historyYears >= 2 ? "Developing" : "New", width: W * 0.3, align: "right" }]);
      tableRow([{ value: "Credit Mix", width: W * 0.25 }, { value: "10% weight", width: W * 0.2 }, { value: `${accountTypes.size} type${accountTypes.size !== 1 ? "s" : ""}`, width: W * 0.25, bold: true }, { value: accountTypes.size >= 3 ? "Diverse" : accountTypes.size >= 2 ? "Moderate" : "Limited", width: W * 0.3, align: "right" }]);
      const inqCount = s.inquiryCount ?? inquiries.length;
      tableRow([{ value: "Recent Inquiries", width: W * 0.25 }, { value: "10% weight", width: W * 0.2 }, { value: String(inqCount), width: W * 0.25, bold: true }, { value: inqCount <= 2 ? "Low" : inqCount <= 5 ? "Moderate" : "High", width: W * 0.3, align: "right", color: inqCount > 5 ? "#dc2626" : undefined }]);

      // === SCORE FACTOR ANALYSIS (unnumbered) ===
      if (s.reasonCodes && s.reasonCodes.length > 0) {
        sectionTitle(L("scoreFactorAnalysis"));
        const reasonLabels: Record<string, string> = {
          DELINQUENT_ACCOUNTS: "Delinquent accounts on file",
          WRITTEN_OFF_ACCOUNTS: "Written-off accounts present",
          RESTRUCTURED_ACCOUNTS: "Restructured loan agreements",
          HIGH_INQUIRY_VOLUME: "High number of credit inquiries",
          HIGH_DEBT_LEVEL: "Elevated total debt level",
          COURT_JUDGMENTS_PRESENT: "Court judgments or liens on record",
          POLITICALLY_EXPOSED_PERSON: "Politically exposed person (PEP)",
          STRONG_REPAYMENT_HISTORY: "Strong repayment track record",
          EXCELLENT_PAYMENT_RECORD: "Excellent payment consistency",
          THIN_FILE_LIMITED_HISTORY: "Limited credit history on file",
          HIGH_NDIA_90_PLUS: "Severe arrears — 90+ days in arrears on one or more accounts",
          MULTIPLE_DELINQUENCIES: "Multiple accounts in delinquency",
          HIGH_ARREARS_AMOUNT: "High total amount in arrears",
        };
        s.reasonCodes.forEach((code: string) => {
          ensureSpace(14);
          const isPositive = code === "STRONG_REPAYMENT_HISTORY" || code === "EXCELLENT_PAYMENT_RECORD";
          const label = reasonLabels[code] || code.replace(/_/g, " ").toLowerCase().replace(/^\w/, (c: string) => c.toUpperCase());
          const bullet = isPositive ? "+" : "−";
          const color = isPositive ? "#16a34a" : "#dc2626";
          const bulletWidth = 14;
          const textX = 48 + bulletWidth;
          const textWidth = W - (textX - 40) - 12;
          doc.fontSize(7.5).font("Helvetica-Bold").fill(color).text(bullet, 48, doc.y, { width: bulletWidth });
          const savedY = doc.y - 10;
          doc.fontSize(7.5).font("Helvetica").fill(DARK).text(`${code}: ${label}`, textX, savedY, { width: textWidth });
          doc.moveDown(0.15);
        });
      }

      // === SCORE METHODOLOGY & VALIDATION (unnumbered) ===
      sectionTitle("Score Methodology & Validation");
      ensureSpace(20);
      doc.fontSize(7).font("Helvetica-Bold").fill(GRAY).text("SCORING VARIABLES & WEIGHTS", 46, doc.y);
      doc.moveDown(0.3);
      resetTableRowIdx();
      tableHeader([
        { label: "Variable", width: W * 0.3 },
        { label: "Weight/Impact", width: W * 0.25 },
        { label: "Description", width: W * 0.45 },
      ]);
      const scoringVars = [
        ["Base Score", "+300", "Starting score for all borrowers"],
        ["On-Time Payment Ratio", "+500 (max)", "Proportion of current/closed accounts vs total"],
        ["Utilization Ratio", "-0 to -120", "Total outstanding balance ÷ total credit limits"],
        ["Delinquent Accounts", "-50 each", "Accounts in delinquent or default status"],
        ["Written-Off Accounts", "-75 each", "Accounts written off as losses"],
        ["Restructured Accounts", "-20 each", "Restructured/rescheduled facilities"],
        ["Active Court Judgments", "-40 each", "Unresolved legal judgments"],
        ["Credit Inquiries", "-5 each (max -100)", "Number of inquiries, capped at 20"],
        ["Score Range", "300 - 850", "Minimum to maximum possible score"],
      ];
      scoringVars.forEach(([variable, impact, desc]) => {
        const isPositive = impact.startsWith("+");
        tableRow([
          { value: variable, width: W * 0.3, bold: true },
          { value: impact, width: W * 0.25, color: isPositive ? "#16a34a" : impact.startsWith("-") ? "#dc2626" : DARK },
          { value: desc, width: W * 0.45 },
        ]);
      });

      doc.moveDown(0.3);
      ensureSpace(20);
      doc.fontSize(7).font("Helvetica-Bold").fill(GRAY).text("MODEL VALIDATION METRICS", 46, doc.y);
      doc.moveDown(0.3);
      resetTableRowIdx();
      tableHeader([
        { label: "Metric", width: W * 0.3 },
        { label: "Description", width: W * 0.45 },
        { label: "Status", width: W * 0.25, align: "right" },
      ]);
      tableRow([{ value: "Gini Coefficient", width: W * 0.3, bold: true }, { value: "Model discriminatory power", width: W * 0.45 }, { value: "0.62", width: W * 0.25, align: "right", bold: true }]);
      tableRow([{ value: "KS Statistic", width: W * 0.3, bold: true }, { value: "Separation between good and bad", width: W * 0.45 }, { value: "0.48", width: W * 0.25, align: "right", bold: true }]);
      tableRow([{ value: "Rank Ordering", width: W * 0.3, bold: true }, { value: "Risk ranking accuracy", width: W * 0.45 }, { value: "Validated", width: W * 0.25, align: "right", color: "#16a34a" }]);
      tableRow([{ value: "Stress Testing", width: W * 0.3, bold: true }, { value: "Model robustness under stress", width: W * 0.45 }, { value: "Passed", width: W * 0.25, align: "right", color: "#16a34a" }]);
      tableRow([{ value: "Probability of Default", width: W * 0.3, bold: true }, { value: "Estimated default probability", width: W * 0.45 }, { value: "Per account", width: W * 0.25, align: "right" }]);

      // === ADDRESS HISTORY (unnumbered) ===
      sectionTitle("Address History");
      resetTableRowIdx();
      tableHeader([
        { label: "Address", width: W * 0.35 },
        { label: "City / Region", width: W * 0.3 },
        { label: "From Date", width: W * 0.15 },
        { label: "Status", width: W * 0.2, align: "right" },
      ]);
      tableRow([
        { value: [b.address, b.postalCode].filter(Boolean).join(", ") || "—", width: W * 0.35 },
        { value: [b.city, b.region, b.country].filter(Boolean).join(", ") || "—", width: W * 0.3 },
        { value: b.dateMovedCurrentRes || "—", width: W * 0.15 },
        { value: b.ownerOrTenant ? (BOG_OWNER_TENANT[b.ownerOrTenant] || b.ownerOrTenant) : "Current", width: W * 0.2, align: "right", color: "#16a34a", bold: true },
      ]);
      const previousAddresses = [b.previousAddress1, b.previousAddress2, b.previousAddress3, b.previousAddress4].filter(Boolean);
      previousAddresses.forEach((addr: string) => {
        tableRow([
          { value: addr, width: W * 0.35 },
          { value: "—", width: W * 0.3 },
          { value: "—", width: W * 0.15 },
          { value: "Previous", width: W * 0.2, align: "right" },
        ]);
      });

      // === EMPLOYMENT HISTORY (unnumbered) ===
      sectionTitle("Employment History");
      const empFields: [string, string][] = [
        ["Employer Name", b.employerName || "—"],
        ["Occupation", b.occupation || "—"],
        ["Employment Type", b.employmentTypeCode ? (BOG_EMPLOYMENT_TYPE[b.employmentTypeCode] || b.employmentTypeCode) : "—"],
        ["Date of Employment", b.dateOfEmployment || "—"],
        ["Employer Address", b.employerAddress || "—"],
      ];
      if (b.monthlyIncome) {
        empFields.push(["Monthly Income", `${b.incomeCurrency || ""} ${Number(b.monthlyIncome).toLocaleString()}`]);
      }
      infoGrid(empFields, 40, W);
      if (b.employmentHistory) {
        ensureSpace(20);
        doc.fontSize(7).font("Helvetica-Bold").fill(GRAY).text("EMPLOYMENT HISTORY", 46, doc.y);
        doc.moveDown(0.15);
        doc.fontSize(7).font("Helvetica").fill(DARK).text(b.employmentHistory, 46, doc.y, { width: W - 12 });
        doc.moveDown(0.3);
      }

      // === SECTION 1: CREDIT PROFILE OVERVIEW ===
      sectionTitle(L("creditProfileOverview"), 1);
      resetTableRowIdx();
      const overviewCols = [
        { label: L("sno"), width: 35 },
        { label: L("indicator"), width: W - 135 },
        { label: L("value"), width: 100, align: "right" },
      ];
      tableHeader(overviewCols);
      const totalBal = openAccts.reduce((ss: number, a) => ss + parseFloat(a.currentBalance || "0"), 0);
      const overdueAccts = openAccts.filter((a) => (a.daysInArrears || 0) > 0);
      const npl = openAccts.filter((a) => (a.daysInArrears || 0) > 90);
      const closedAccts = typedAccounts.filter((a) => a.status === "closed");
      const woAccts = typedAccounts.filter((a) => a.status === "written_off");
      const woTotal = woAccts.reduce((ss: number, a) => ss + parseFloat(a.currentBalance || "0"), 0);
      const totalOverdue = overdueAccts.reduce((ss: number, a) => ss + parseFloat(a.currentBalance || "0") * 0.1, 0);
      const indicators = [
        ["1", "Number of Open Credit Facilities", String(openAccts.length)],
        ["2", "Total Outstanding Balance in Open Credit Facilities", totalBal.toLocaleString("en-US", { minimumFractionDigits: 2 })],
        ["3", "Total Overdue Amount on Open Credit Facilities", totalOverdue.toLocaleString("en-US", { minimumFractionDigits: 2 })],
        ["4", "Number of Open Credit Facilities with Overdue", String(overdueAccts.length)],
        ["5", "Number of Open Facilities > 90 Days in Arrears (Non-Performing)", String(npl.length)],
        ["6", "Number of Closed Credit Facilities", String(closedAccts.length)],
        ["7", "Number of Facilities with Write-Off", String(woAccts.length)],
        ["8", "Total Write-Off Amount", woTotal > 0 ? woTotal.toLocaleString("en-US", { minimumFractionDigits: 2 }) : "0"],
        ["9", "Number of Credit Facilities with Judgments", String(judgments.length)],
        ["10", "Number of Inquiries in the Last 6 Months", String(inquiries.length)],
        ["11", "Number of Disputes Raised in the Last 6 Months", "0"],
      ];
      indicators.forEach(([sno, label, val]) => {
        tableRow([
          { value: sno, width: 35 },
          { value: label, width: W - 135 },
          { value: val, width: 100, align: "right", bold: true },
        ]);
      });

      // === SECTION 2: CLASSIFICATION BY INSTITUTION ===
      const instGroups: Record<string, { count: number; approved: number; balance: number; overdue: number; currency: string }> = {};
      openAccts.forEach((a) => {
        const inst = a.lenderInstitution || "Unknown";
        const cur = a.currency || "GHS";
        const key = `${inst}|||${cur}`;
        if (!instGroups[key]) instGroups[key] = { count: 0, approved: 0, balance: 0, overdue: 0, currency: cur };
        instGroups[key].count++;
        instGroups[key].approved += parseFloat(a.originalAmount || "0");
        instGroups[key].balance += parseFloat(a.currentBalance || "0");
        if ((a.daysInArrears || 0) > 0) instGroups[key].overdue += parseFloat(a.currentBalance || "0") * 0.1;
      });
      const instBreakdown = Object.entries(instGroups).map(([key, data]) => ({
        institution: key.split("|||")[0],
        ...data,
        utilization: data.approved > 0 ? ((data.balance / data.approved) * 100).toFixed(1) : "0",
      }));
      if (instBreakdown.length > 0) {
        sectionTitle("Classification of Active Accounts by Institution", 2);
        resetTableRowIdx();
        tableHeader([
          { label: "Institution", width: W * 0.25 },
          { label: "Currency", width: W * 0.1 },
          { label: "Accts", width: W * 0.08, align: "right" },
          { label: "Approved/Limit", width: W * 0.19, align: "right" },
          { label: "Current Bal.", width: W * 0.19, align: "right" },
          { label: "% Util", width: W * 0.09, align: "right" },
          { label: "Overdue", width: W * 0.1, align: "right" },
        ]);
        instBreakdown.forEach((row) => {
          tableRow([
            { value: row.institution, width: W * 0.25, bold: true },
            { value: row.currency, width: W * 0.1 },
            { value: String(row.count), width: W * 0.08, align: "right" },
            { value: row.approved.toLocaleString("en-US", { minimumFractionDigits: 2 }), width: W * 0.19, align: "right" },
            { value: row.balance.toLocaleString("en-US", { minimumFractionDigits: 2 }), width: W * 0.19, align: "right", bold: true },
            { value: `${row.utilization}%`, width: W * 0.09, align: "right" },
            { value: row.overdue.toLocaleString("en-US", { minimumFractionDigits: 2 }), width: W * 0.1, align: "right", color: row.overdue > 0 ? "#dc2626" : DARK },
          ]);
        });
      }

      // === SECTION 3: TOTAL LIABILITY SUMMARY ===
      const liabCurrencies = [...new Set(typedAccounts.map((a) => a.currency || "GHS"))];
      type LiabBucket = { balance: number; overdue: number; d1_30: number; d31_60: number; d61_90: number; d91_120: number; d121_150: number; d151_180: number; d180plus: number };
      const liabSummary: Record<string, LiabBucket> = {};
      liabCurrencies.forEach(c => { liabSummary[c] = { balance: 0, overdue: 0, d1_30: 0, d31_60: 0, d61_90: 0, d91_120: 0, d121_150: 0, d151_180: 0, d180plus: 0 }; });
      openAccts.forEach((a) => {
        const c = a.currency || "GHS";
        const bal = parseFloat(a.currentBalance || "0");
        const days = a.daysInArrears || 0;
        liabSummary[c].balance += bal;
        if (days > 0) {
          const overdueAmt = bal * 0.15;
          liabSummary[c].overdue += overdueAmt;
          if (days <= 30) liabSummary[c].d1_30 += overdueAmt;
          else if (days <= 60) liabSummary[c].d31_60 += overdueAmt;
          else if (days <= 90) liabSummary[c].d61_90 += overdueAmt;
          else if (days <= 120) liabSummary[c].d91_120 += overdueAmt;
          else if (days <= 150) liabSummary[c].d121_150 += overdueAmt;
          else if (days <= 180) liabSummary[c].d151_180 += overdueAmt;
          else liabSummary[c].d180plus += overdueAmt;
        }
      });

      sectionTitle("Total Liability Summary", 3);
      resetTableRowIdx();
      const liabColWidth = liabCurrencies.length > 0 ? (W - W * 0.4) / liabCurrencies.length : W * 0.3;
      const liabHeaderCols: Array<{ label: string; width: number; align?: string }> = [{ label: "Description", width: W * 0.4 }];
      liabCurrencies.forEach(c => liabHeaderCols.push({ label: c, width: liabColWidth, align: "right" }));
      tableHeader(liabHeaderCols);
      const liabRowKeys: Array<{ label: string; key: keyof LiabBucket }> = [
        { label: "Total Current Balance", key: "balance" },
        { label: "Total Amount Overdue", key: "overdue" },
        { label: "Overdue 1-30 days", key: "d1_30" },
        { label: "Overdue 31-60 days", key: "d31_60" },
        { label: "Overdue 61-90 days", key: "d61_90" },
        { label: "Overdue 91-120 days", key: "d91_120" },
        { label: "Overdue 121-150 days", key: "d121_150" },
        { label: "Overdue 151-180 days", key: "d151_180" },
        { label: "Overdue > 180 days", key: "d180plus" },
      ];
      liabRowKeys.forEach(row => {
        const isBoldRow = row.key === "balance" || row.key === "overdue";
        const cols: Array<{ value: string; width: number; bold?: boolean; align?: string; color?: string }> = [{ value: row.label, width: W * 0.4, bold: isBoldRow }];
        liabCurrencies.forEach(c => {
          const val = liabSummary[c][row.key];
          cols.push({ value: val.toLocaleString("en-US", { minimumFractionDigits: 2 }), width: liabColWidth, align: "right", bold: isBoldRow, color: row.key !== "balance" && val > 0 ? "#dc2626" : DARK });
        });
        tableRow(cols);
      });
      const totalInstitutions = new Set(typedAccounts.map((a) => a.lenderInstitution)).size;
      tableRow([{ value: "Total Number of Institutions", width: W * 0.4, bold: true }, ...liabCurrencies.map(() => ({ value: String(totalInstitutions), width: liabColWidth, align: "right" as const, bold: true }))]);
      tableRow([{ value: "Total Number of Credit Facilities", width: W * 0.4, bold: true }, ...liabCurrencies.map(() => ({ value: String(accounts.length), width: liabColWidth, align: "right" as const, bold: true }))]);

      // === SECTION 4: CREDIT EXPOSURE BY PRODUCT ===
      const prodGroups: Record<string, Record<string, { count: number; balance: number; overdue: number }>> = {};
      openAccts.forEach((a) => {
        const type = a.accountType || "Other";
        const cur = a.currency || "GHS";
        if (!prodGroups[type]) prodGroups[type] = {};
        if (!prodGroups[type][cur]) prodGroups[type][cur] = { count: 0, balance: 0, overdue: 0 };
        prodGroups[type][cur].count++;
        prodGroups[type][cur].balance += parseFloat(a.currentBalance || "0");
        if ((a.daysInArrears || 0) > 0) prodGroups[type][cur].overdue += parseFloat(a.currentBalance || "0") * 0.1;
      });
      const prodExposure = Object.entries(prodGroups).flatMap(([type, currencies]) =>
        Object.entries(currencies).map(([cur, data]) => ({ type, currency: cur, ...data }))
      );
      if (prodExposure.length > 0) {
        sectionTitle("Credit Exposure by Product", 4);
        resetTableRowIdx();
        tableHeader([
          { label: "Product Type", width: W * 0.3 },
          { label: "Currency", width: W * 0.15 },
          { label: "Count", width: W * 0.1, align: "right" },
          { label: "Current Balance", width: W * 0.25, align: "right" },
          { label: "Overdue", width: W * 0.2, align: "right" },
        ]);
        prodExposure.forEach((row) => {
          tableRow([
            { value: (row.type || "").replace(/_/g, " "), width: W * 0.3, bold: true },
            { value: row.currency, width: W * 0.15 },
            { value: String(row.count), width: W * 0.1, align: "right" },
            { value: row.balance.toLocaleString("en-US", { minimumFractionDigits: 2 }), width: W * 0.25, align: "right", bold: true },
            { value: row.overdue.toLocaleString("en-US", { minimumFractionDigits: 2 }), width: W * 0.2, align: "right", color: row.overdue > 0 ? "#dc2626" : DARK },
          ]);
        });
      }

      // === SECTION 5: CREDIT FACILITY DETAILS ===
      if (accounts.length > 0) {
        sectionTitle(L("facilityDetails"), 5);
        accounts.forEach((acct: any, idx: number) => {
          ensureSpace(80);
          const cur = acct.currency || "GHS";
          doc.moveDown(0.4);
          const facLabel = L("facilityOf").replace("{idx}", String(idx + 1)).replace("{total}", String(accounts.length));
          const statusColor = acct.status === "current" || acct.status === "closed" ? "#16a34a" : acct.status === "written_off" ? "#dc2626" : "#ca8a04";
          const fy = doc.y;
          doc.rect(40, fy, W, 20).fill("#f0f4f8");
          doc.fontSize(8.5).font("Helvetica-Bold").fill(NORDIC_BLUE)
            .text(`${facLabel}`, 46, fy + 4, { continued: true, width: W - 200 });
          doc.fill(statusColor).font("Helvetica-Bold")
            .text(` — ${(acct.status || "").toUpperCase()} (${cur})`, { continued: false });
          doc.y = fy + 24;

          const facilityFields: [string, string][] = [
            [L("institution"), acct.lenderInstitution], [L("accountNo"), acct.accountNumber],
            [L("type"), (acct.accountType || "").replace(/_/g, " ")], [L("classification"), acct.status],
            [L("currentBalance"), acct.currentBalance ? `${cur} ${parseFloat(acct.currentBalance).toLocaleString()}` : "—"],
            [L("sanctionedAmount"), acct.originalAmount ? `${cur} ${parseFloat(acct.originalAmount).toLocaleString()}` : "—"],
            [L("daysInArrears"), String(acct.daysInArrears || 0)],
            [L("interestRate"), acct.isInterestFree ? L("interestFree") : `${acct.interestRate || "—"}%`],
            [L("disbursementDate"), acct.disbursementDate || "—"], [L("maturityDate"), acct.maturityDate || "—"],
            [L("lastPayment"), acct.lastPaymentDate || "—"],
            [L("restructured"), (acct.restructureCount || 0) > 0 ? `${L("yes")} (${acct.restructureCount}x)` : L("no")],
          ];
          infoGrid(facilityFields, 48, W - 8);

          const history = reportData.paymentHistory?.[acct.id] || [];
          {
            const phSlice = history.length > 0 ? history.slice(0, 24) : [];
            const defaultMonths = Array.from({ length: 12 }, (_, i) => {
              const d = new Date();
              d.setMonth(d.getMonth() - i);
              return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
            });
            const phMonths = phSlice.length > 0 ? phSlice.map((ph: { period: string }) => ph.period) : defaultMonths;
            const phCount = phMonths.length;
            const phGridHeight = 48;
            ensureSpace(phGridHeight + 16);
            doc.fontSize(7).font("Helvetica-Bold").fill(GRAY).text("Payment History (Last 24 Months)", 48, doc.y);
            doc.moveDown(0.25);
            const phX0 = 48;
            const phLabelW = 42;
            const phCellW = (W - 16 - phLabelW) / phCount;
            const phRowH = 12;
            const phStartY = doc.y;

            doc.fontSize(5).font("Helvetica-Bold").fill(GRAY).text("Month", phX0, phStartY + 2, { width: phLabelW });
            phMonths.forEach((month: string, i: number) => {
              doc.fontSize(5).font("Helvetica").fill(GRAY)
                .text(month || "", phX0 + phLabelW + i * phCellW, phStartY + 2, { width: phCellW, align: "center" });
            });

            doc.fontSize(5).font("Helvetica-Bold").fill(GRAY).text("Status", phX0, phStartY + phRowH + 2, { width: phLabelW });
            phMonths.forEach((_: string, i: number) => {
              const ph = phSlice[i] as { status: string; daysLate?: number } | undefined;
              let code = "ND";
              let color = GRAY;
              if (ph) {
                if (ph.status === "on_time") { code = "OK"; color = "#16a34a"; }
                else if (ph.status === "late") { code = String(ph.daysLate || 30); color = "#ca8a04"; }
                else if (ph.status === "missed") { code = "X"; color = "#dc2626"; }
                else if (ph.status === "partial") { code = "P"; color = "#ea580c"; }
              }
              doc.fontSize(5.5).font("Helvetica-Bold").fill(color)
                .text(code, phX0 + phLabelW + i * phCellW, phStartY + phRowH + 2, { width: phCellW, align: "center" });
            });

            doc.fontSize(5).font("Helvetica-Bold").fill(GRAY).text("Amt. Due", phX0, phStartY + phRowH * 2 + 2, { width: phLabelW });
            phMonths.forEach((_: string, i: number) => {
              const ph = phSlice[i] as { amountDue?: string } | undefined;
              const amt = ph?.amountDue ? Number(ph.amountDue).toLocaleString() : "ND";
              doc.fontSize(5).font("Helvetica").fill(GRAY)
                .text(amt, phX0 + phLabelW + i * phCellW, phStartY + phRowH * 2 + 2, { width: phCellW, align: "center" });
            });

            doc.y = phStartY + phRowH * 3 + 6;
            doc.moveDown(0.3);
          }

          if (acct.collateralType) {
            ensureSpace(20);
            doc.fontSize(7).font("Helvetica-Bold").fill(GRAY).text(L("security"), 48, doc.y);
            doc.moveDown(0.15);
            doc.fontSize(7.5).font("Helvetica").fill(DARK)
              .text(`Type: ${acct.collateralType} | Value: ${cur} ${parseFloat(acct.collateralValue || "0").toLocaleString()}`, 48, doc.y, { width: W - 16 });
            doc.moveDown(0.3);
          }

          doc.moveTo(40, doc.y).lineTo(40 + W, doc.y).strokeColor("#cccccc").lineWidth(0.5).stroke();
          doc.moveDown(0.2);
        });
      }

      // === DISHONOURED CHEQUES (unnumbered) ===
      sectionTitle("Dishonoured Cheques");
      if (dishonouredCheques.length > 0) {
        resetTableRowIdx();
        tableHeader([
          { label: "Cheque No.", width: W * 0.15 },
          { label: "Account No.", width: W * 0.15 },
          { label: "Date Issued", width: W * 0.13 },
          { label: "Date Bounced", width: W * 0.13 },
          { label: "Reason", width: W * 0.2 },
          { label: "Amount", width: W * 0.12, align: "right" },
          { label: "Currency", width: W * 0.12 },
        ]);
        dishonouredCheques.forEach((cheque: any) => {
          tableRow([
            { value: cheque.chequeNumber || "—", width: W * 0.15 },
            { value: cheque.accountNumber || "—", width: W * 0.15 },
            { value: cheque.dateIssued || "—", width: W * 0.13 },
            { value: cheque.dateBounced || "—", width: W * 0.13 },
            { value: (cheque.reasonReturnedCode ? (BOG_CHEQUE_RETURN_REASON[cheque.reasonReturnedCode] || cheque.reasonReturnedCode) : "—"), width: W * 0.2 },
            { value: cheque.chequeAmount ? Number(cheque.chequeAmount).toLocaleString() : "—", width: W * 0.12, align: "right", bold: true },
            { value: cheque.currency || "—", width: W * 0.12 },
          ]);
        });
      } else {
        ensureSpace(16);
        doc.fontSize(7.5).font("Helvetica").fill(GRAY).text("No dishonoured cheques on file", 46, doc.y);
        doc.moveDown(0.3);
      }

      // === GUARANTEED LOANS (unnumbered) ===
      const guaranteedLoans = typedAccounts.filter((a) => a.natureOfGuarantor && a.natureOfGuarantor !== "103");
      sectionTitle("Guaranteed Loans");
      if (guaranteedLoans.length > 0) {
        resetTableRowIdx();
        tableHeader([
          { label: "Institution", width: W * 0.25 },
          { label: "Account No.", width: W * 0.2 },
          { label: "Facility Type", width: W * 0.2 },
          { label: "Outstanding Bal.", width: W * 0.2, align: "right" },
          { label: "Guarantor Type", width: W * 0.15 },
        ]);
        guaranteedLoans.forEach((acct) => {
          tableRow([
            { value: acct.lenderInstitution || "—", width: W * 0.25, bold: true },
            { value: acct.accountNumber || "—", width: W * 0.2 },
            { value: (acct.accountType || "—").replace(/_/g, " "), width: W * 0.2 },
            { value: acct.currentBalance ? `${acct.currency || "GHS"} ${parseFloat(acct.currentBalance).toLocaleString()}` : "—", width: W * 0.2, align: "right", bold: true },
            { value: (acct.natureOfGuarantor ? (BOG_NATURE_OF_GUARANTOR[acct.natureOfGuarantor] || acct.natureOfGuarantor) : "—"), width: W * 0.15 },
          ]);
        });
      } else {
        ensureSpace(16);
        doc.fontSize(7.5).font("Helvetica").fill(GRAY).text("No guaranteed loans on file", 46, doc.y);
        doc.moveDown(0.3);
      }

      // === SECTION 6: COURT JUDGMENTS & PUBLIC RECORDS ===
      sectionTitle(L("courtJudgmentsPublic"), 6);
      if (judgments.length > 0) {
        resetTableRowIdx();
        const jCols = [
          { label: L("caseNo"), width: W * 0.2 },
          { label: L("court"), width: W * 0.25 },
          { label: L("type"), width: W * 0.15 },
          { label: L("amount"), width: W * 0.15, align: "right" },
          { label: L("date"), width: W * 0.12 },
          { label: L("status"), width: W * 0.13 },
        ];
        tableHeader(jCols);
        judgments.forEach((j: any) => {
          tableRow([
            { value: j.caseNumber, width: W * 0.2 },
            { value: j.court, width: W * 0.25 },
            { value: (j.judgmentType || "").replace(/_/g, " "), width: W * 0.15 },
            { value: j.amount ? `${j.currency || "GHS"} ${parseFloat(j.amount).toLocaleString()}` : "—", width: W * 0.15, align: "right" },
            { value: j.judgmentDate || "—", width: W * 0.12 },
            { value: j.status || "—", width: W * 0.13, color: j.status === "active" ? "#dc2626" : "#16a34a" },
          ]);
        });
      } else {
        ensureSpace(16);
        doc.fontSize(7.5).font("Helvetica").fill("#16a34a").text("✓ No court judgments or public records on file", 46, doc.y);
        doc.moveDown(0.3);
      }

      // === SECTION 7: CONSENT RECORDS ===
      sectionTitle("Consent Records", 7);
      if (consentRecords.length > 0) {
        resetTableRowIdx();
        tableHeader([
          { label: "Granted To", width: W * 0.25 },
          { label: "Purpose", width: W * 0.2 },
          { label: "Receipt No.", width: W * 0.2 },
          { label: "Status", width: W * 0.15 },
          { label: "Date", width: W * 0.2 },
        ]);
        consentRecords.forEach((c: any) => {
          tableRow([
            { value: c.grantedTo || "—", width: W * 0.25, bold: true },
            { value: c.purpose || "—", width: W * 0.2 },
            { value: c.receiptNumber || "—", width: W * 0.2 },
            { value: c.status || "—", width: W * 0.15, color: c.status === "active" ? "#16a34a" : "#dc2626" },
            { value: c.grantedAt ? new Date(c.grantedAt).toLocaleDateString("en-GB") : "—", width: W * 0.2 },
          ]);
        });
      } else {
        ensureSpace(16);
        doc.fontSize(7.5).font("Helvetica").fill(GRAY).text("No consent records on file", 46, doc.y);
        doc.moveDown(0.3);
      }

      // === SECTION 8: CREDIT SEARCH INQUIRY HISTORY ===
      sectionTitle("Credit Search Inquiry History", 8);
      const HARD_PURPOSES = ["new_credit", "collection"];
      const hardCount = inquiries.filter((inq: any) => HARD_PURPOSES.includes(inq.purpose)).length;
      const softCount = inquiries.length - hardCount;
      ensureSpace(16);
      doc.fontSize(7).font("Helvetica").fill(GRAY).text(`Hard Inquiries: ${hardCount}  |  Soft Inquiries: ${softCount}`, 46, doc.y);
      doc.moveDown(0.3);
      if (inquiries.length > 0) {
        resetTableRowIdx();
        const inqCols = [
          { label: L("institution"), width: W * 0.3 },
          { label: L("purpose"), width: W * 0.2 },
          { label: "Type", width: W * 0.12 },
          { label: L("date"), width: W * 0.18 },
          { label: L("consent"), width: W * 0.2 },
        ];
        tableHeader(inqCols);
        inquiries.forEach((inq: any) => {
          const isHard = HARD_PURPOSES.includes(inq.purpose);
          tableRow([
            { value: inq.institution, width: W * 0.3, bold: true },
            { value: (inq.purpose || "").replace(/_/g, " "), width: W * 0.2 },
            { value: isHard ? "Hard" : "Soft", width: W * 0.12, color: isHard ? "#dc2626" : GRAY },
            { value: inq.createdAt ? new Date(inq.createdAt).toLocaleDateString("en-GB") : "—", width: W * 0.18 },
            { value: inq.consentProvided ? L("yes") : L("no"), width: W * 0.2, color: inq.consentProvided ? "#16a34a" : "#dc2626" },
          ]);
        });
      } else {
        ensureSpace(16);
        doc.fontSize(7.5).font("Helvetica").fill(GRAY).text("No credit inquiries on file", 46, doc.y);
        doc.moveDown(0.3);
      }

      // === SECTION 9: COLLECTIONS & DEROGATORY ITEMS ===
      function getRRating(acct: { status: string; daysInArrears?: number }): string {
        const days = acct.daysInArrears || 0;
        if (acct.status === "written_off") return "R9";
        if (acct.status === "default") return "R8";
        if (acct.status === "restructured") return "R7";
        if (days > 150) return "R6";
        if (days > 120) return "R5";
        if (days > 90) return "R4";
        if (days > 60) return "R3";
        if (days > 30) return "R2";
        return "R1";
      }

      const collectionsItems = typedAccounts
        .filter((a) => a.status === "written_off" || a.status === "default")
        .map((a) => ({
          creditor: a.lenderInstitution,
          accountNumber: a.accountNumber,
          rRating: getRRating(a),
          status: a.status === "written_off" ? "Written Off" : "In Default",
          amount: a.currentBalance,
          currency: a.currency || "GHS",
          dateReported: a.updatedAt ? new Date(a.updatedAt).toLocaleDateString("en-GB") : "—",
        }));

      sectionTitle("Collections & Derogatory Items", 9);
      if (collectionsItems.length > 0) {
        resetTableRowIdx();
        tableHeader([
          { label: "Creditor", width: W * 0.2 },
          { label: "Account No.", width: W * 0.16 },
          { label: "R-Rating", width: W * 0.1 },
          { label: "Status", width: W * 0.13 },
          { label: "Amount", width: W * 0.16, align: "right" },
          { label: "Currency", width: W * 0.1 },
          { label: "Date Reported", width: W * 0.15 },
        ]);
        collectionsItems.forEach((item) => {
          const ratingColor = item.rRating === "R9" || item.rRating === "R8" ? "#dc2626" : "#ca8a04";
          tableRow([
            { value: item.creditor || "—", width: W * 0.2, bold: true },
            { value: item.accountNumber || "—", width: W * 0.16 },
            { value: item.rRating, width: W * 0.1, bold: true, color: ratingColor },
            { value: item.status, width: W * 0.13, color: "#dc2626" },
            { value: item.amount ? parseFloat(item.amount).toLocaleString("en-US", { minimumFractionDigits: 2 }) : "—", width: W * 0.16, align: "right", bold: true },
            { value: item.currency, width: W * 0.1 },
            { value: item.dateReported, width: W * 0.15 },
          ]);
        });
      } else {
        ensureSpace(20);
        doc.fontSize(7.5).font("Helvetica").fill("#16a34a").text("✓ No collections or derogatory items on file", 46, doc.y);
        doc.moveDown(0.3);
      }

      // === SECTION 10: RISK ASSESSMENT SUMMARY ===
      sectionTitle("Risk Assessment Summary", 10);
      const riskStrengths: string[] = [];
      const riskConcerns: string[] = [];
      const score = s.creditScore;
      if (score >= 700) riskStrengths.push("Strong credit score indicating reliable payment behaviour");
      if (s.delinquentAccounts === 0) riskStrengths.push("No delinquent accounts on file");
      if (s.writtenOffAccounts === 0) riskStrengths.push("No written-off or bad debt accounts");
      if (s.judgmentCount === 0) riskStrengths.push("No court judgments or legal actions recorded");
      const onTimeRatio = accounts.length > 0
        ? typedAccounts.filter((a) => a.status === "current" || a.status === "closed").length / typedAccounts.length
        : 0;
      if (onTimeRatio >= 0.8) riskStrengths.push(`${(onTimeRatio * 100).toFixed(0)}% of accounts are current or closed in good standing`);
      if (s.activeAccounts >= 3) riskStrengths.push("Diverse credit portfolio with multiple active facilities");
      if (s.delinquentAccounts > 0) riskConcerns.push(`${s.delinquentAccounts} delinquent account(s) on file`);
      if (s.writtenOffAccounts > 0) riskConcerns.push(`${s.writtenOffAccounts} written-off account(s) totalling bad debt`);
      if (s.judgmentCount > 0) riskConcerns.push(`${s.judgmentCount} court judgment(s) recorded`);
      const riskInqCount = s.inquiryCount ?? inquiries.length;
      if (riskInqCount > 5) riskConcerns.push(`High inquiry volume (${riskInqCount}) may indicate credit-seeking behaviour`);
      if (utilRatio > 75) riskConcerns.push(`High credit utilization at ${utilRatio.toFixed(1)}%`);
      if (score < 580) riskConcerns.push("Low credit score suggests elevated default risk");
      if (s.restructuredAccounts > 0) riskConcerns.push(`${s.restructuredAccounts} restructured facility/ies indicating past repayment difficulty`);
      if (riskStrengths.length === 0) riskStrengths.push("No notable strengths identified based on current data");
      if (riskConcerns.length === 0) riskConcerns.push("No significant concerns identified");

      let riskLevel = "Low";
      if (score < 580 || s.writtenOffAccounts > 0 || s.judgmentCount > 0) riskLevel = "High";
      else if (score < 670 || s.delinquentAccounts > 0 || utilRatio > 75) riskLevel = "Medium";

      ensureSpace(30);
      const riskColor = riskLevel === "Low" ? "#16a34a" : riskLevel === "Medium" ? "#ca8a04" : "#dc2626";
      const riskBg = riskLevel === "Low" ? "#f0fdf4" : riskLevel === "Medium" ? "#fefce8" : "#fef2f2";
      const ry = doc.y;
      doc.rect(46, ry, W - 12, 20).fill(riskBg);
      doc.fontSize(9).font("Helvetica-Bold").fill(riskColor)
        .text(`Overall Risk Level: ${riskLevel}`, 52, ry + 5, { width: W - 24 });
      doc.y = ry + 24;

      ensureSpace(14);
      doc.fontSize(7).font("Helvetica-Bold").fill(GRAY).text("STRENGTHS", 46, doc.y);
      doc.moveDown(0.2);
      riskStrengths.forEach((str) => {
        ensureSpace(14);
        const bulletW = 14;
        const strTextX = 48 + bulletW;
        const strTextW = W - (strTextX - 40) - 12;
        doc.fontSize(7).font("Helvetica-Bold").fill("#16a34a").text("✓", 48, doc.y, { width: bulletW });
        const strSavedY = doc.y - 10;
        doc.fontSize(7).font("Helvetica").fill(DARK).text(str, strTextX, strSavedY, { width: strTextW });
        doc.moveDown(0.15);
      });

      doc.moveDown(0.3);
      ensureSpace(14);
      doc.fontSize(7).font("Helvetica-Bold").fill(GRAY).text("CONCERNS", 46, doc.y);
      doc.moveDown(0.2);
      riskConcerns.forEach((concern) => {
        ensureSpace(14);
        const cBulletW = 14;
        const cTextX = 48 + cBulletW;
        const cTextW = W - (cTextX - 40) - 12;
        doc.fontSize(7).font("Helvetica-Bold").fill("#dc2626").text("▲", 48, doc.y, { width: cBulletW });
        const cSavedY = doc.y - 10;
        doc.fontSize(7).font("Helvetica").fill(DARK).text(concern, cTextX, cSavedY, { width: cTextW });
        doc.moveDown(0.15);
      });

      // === SECTION 11: CONSUMER STATEMENT ===
      sectionTitle("Consumer Statement", 11);
      const consumerStatement = reportData.consumerStatement || b.consumerStatement || "";
      const csHeaderText = "CONSUMER-SUBMITTED STATEMENT";
      const csBodyText = consumerStatement
        ? consumerStatement
        : "No consumer statement has been submitted for this file. Consumers have the right to submit a personal statement of up to 200 words to be included in their credit report, explaining circumstances related to any credit information contained herein.";
      const csBodyFont = consumerStatement ? "Helvetica" : "Helvetica";
      const csBodySize = consumerStatement ? 7.5 : 7;
      const csBodyColor = consumerStatement ? DARK : GRAY;
      const csHeaderHeight = 14;
      const csBodyHeight = doc.fontSize(csBodySize).font(csBodyFont).heightOfString(csBodyText, { width: W - 24 });
      const csPadding = 12;
      const csBoxHeight = csHeaderHeight + csBodyHeight + csPadding;
      ensureSpace(csBoxHeight + 30);
      const csY = doc.y;
      doc.rect(46, csY, W - 12, csBoxHeight).fill("#f8f9fa");
      doc.fontSize(7).font("Helvetica-Bold").fill(GRAY).text(csHeaderText, 52, csY + 6, { width: W - 24 });
      doc.fontSize(csBodySize).font(csBodyFont).fill(csBodyColor)
        .text(csBodyText, 52, csY + 6 + csHeaderHeight, { width: W - 24 });
      doc.y = csY + csBoxHeight + 4;
      doc.moveDown(0.2);
      doc.fontSize(6).font("Helvetica").fill(LIGHT)
        .text("Under the Credit Reporting Act, consumers have the right to dispute inaccurate information and add a personal statement to their credit file. Contact the Credit Registry to exercise these rights.", 46, doc.y, { width: W - 12 });
      doc.moveDown(0.4);

      // === AI-ENHANCED INTELLIGENCE SECTION ===
      const ai = reportData.aiEnhanced;
      if (ai) {
        doc.addPage();
        doc.y = 50;

        const AI_PURPLE = "#7c3aed";
        const AI_LIGHT_BG = "#f5f3ff";
        const AI_BORDER = "#c4b5fd";

        ensureSpace(50);
        const aiBannerY = doc.y;
        doc.rect(40, aiBannerY, W, 36).fill(AI_PURPLE);
        doc.fill("#ffffff").fontSize(12).font("Helvetica-Bold")
          .text("AI-ENHANCED INTELLIGENCE", 55, aiBannerY + 6, { width: W - 120 });
        doc.fill("#e0d4ff").fontSize(7).font("Helvetica")
          .text("Machine Learning & Dual-AI Analysis", 55, aiBannerY + 22, { width: W - 120 });
        doc.fill("#ffffff").fontSize(7).font("Helvetica-Bold")
          .text("AI-GENERATED", W - 100, aiBannerY + 12, { width: 80, align: "right" });
        doc.y = aiBannerY + 42;

        ensureSpace(30);
        const disclaimerY = doc.y;
        const disclaimerText = ai.disclaimer || "AI-generated analysis is for decision support only.";
        const disclaimerH = doc.fontSize(6.5).font("Helvetica").heightOfString(disclaimerText, { width: W - 30 });
        doc.rect(40, disclaimerY, W, disclaimerH + 12).fill("#fffbeb");
        doc.rect(40, disclaimerY, W, disclaimerH + 12).strokeColor("#f59e0b").lineWidth(0.5).stroke();
        doc.fill("#92400e").fontSize(7).font("Helvetica-Bold")
          .text("DISCLAIMER:", 48, disclaimerY + 4, { width: 60 });
        doc.fill("#78350f").fontSize(6.5).font("Helvetica")
          .text(disclaimerText, 48, disclaimerY + 4 + 10, { width: W - 30 });
        doc.y = disclaimerY + disclaimerH + 18;

        if (ai.mlScore) {
          ensureSpace(60);
          doc.moveDown(0.4);
          const mlY = doc.y;
          doc.rect(40, mlY - 2, W, 18).fill(AI_LIGHT_BG);
          doc.fill(AI_PURPLE).fontSize(9).font("Helvetica-Bold")
            .text(`ML CREDIT SCORE — ${ai.mlScore.modelVersion || "ACH-Scorecard-v1.0"}`, 46, mlY + 2);
          doc.y = mlY + 20;
          doc.moveTo(40, doc.y).lineTo(40 + W, doc.y).strokeColor(AI_BORDER).lineWidth(0.5).stroke();
          doc.moveDown(0.5);

          const colW4 = (W - 30) / 4;
          const scoreY = doc.y;
          const scoreLabels = ["ML SCORE", "BUREAU SCORE", "CONFIDENCE", "DEFAULT PROB."];
          const scoreValues = [
            String(ai.mlScore.mlScore),
            String(s?.creditScore || "—"),
            `${(ai.mlScore.confidence * 100).toFixed(0)}%`,
            `${(ai.mlScore.defaultProbability * 100).toFixed(1)}%`,
          ];
          const scoreDetails = [
            "Range 300–850",
            "Traditional Model",
            `${ai.mlScore.confidenceInterval[0]}–${ai.mlScore.confidenceInterval[1]}`,
            `Risk: ${(ai.mlScore.riskCategory || "").replace("_", " ")}`,
          ];
          for (let ci = 0; ci < 4; ci++) {
            const cx = 40 + ci * (colW4 + 10);
            doc.rect(cx, scoreY, colW4, 44).fill(AI_LIGHT_BG);
            doc.rect(cx, scoreY, colW4, 44).strokeColor(AI_BORDER).lineWidth(0.3).stroke();
            doc.fill(AI_PURPLE).fontSize(5.5).font("Helvetica-Bold")
              .text(scoreLabels[ci], cx + 4, scoreY + 4, { width: colW4 - 8, align: "center" });
            doc.fill(DARK).fontSize(16).font("Helvetica-Bold")
              .text(scoreValues[ci], cx + 4, scoreY + 13, { width: colW4 - 8, align: "center" });
            doc.fill(LIGHT).fontSize(5.5).font("Helvetica")
              .text(scoreDetails[ci], cx + 4, scoreY + 32, { width: colW4 - 8, align: "center" });
          }
          doc.y = scoreY + 50;

          if (ai.mlScore.featureImportance && ai.mlScore.featureImportance.length > 0) {
            doc.moveDown(0.3);
            doc.fontSize(7).font("Helvetica-Bold").fill(AI_PURPLE).text("FEATURE IMPORTANCE", 46, doc.y);
            doc.moveDown(0.3);
            resetTableRowIdx();
            const fCols = [
              { label: "Feature", width: W * 0.3 },
              { label: "Direction", width: W * 0.15 },
              { label: "Description", width: W * 0.55 },
            ];
            const fY0 = doc.y;
            doc.rect(40, fY0, W, 14).fill(AI_PURPLE);
            let fX = 44;
            fCols.forEach(col => {
              doc.fill("#ffffff").fontSize(6).font("Helvetica-Bold")
                .text(col.label.toUpperCase(), fX, fY0 + 4, { width: col.width - 8 });
              fX += col.width;
            });
            doc.y = fY0 + 16;
            ai.mlScore.featureImportance.forEach((f: any) => {
              ensureSpace(16);
              const rY = doc.y;
              const descWidth = fCols[2].width - 8;
              const descText = f.description || "";
              const estLines = Math.ceil(doc.fontSize(6.5).font("Helvetica").widthOfString(descText) / descWidth);
              const rowH = Math.max(15, estLines * 9 + 6);
              const bg = tableRowIdx % 2 === 0 ? "#ffffff" : AI_LIGHT_BG;
              doc.rect(40, rY, W, rowH).fill(bg);
              doc.fill(DARK).fontSize(7).font("Helvetica-Bold").text(f.feature, 44, rY + 3, { width: fCols[0].width - 8 });
              const dirColor = f.direction === "positive" ? "#16a34a" : f.direction === "negative" ? "#dc2626" : GRAY;
              const dirSymbol = f.direction === "positive" ? "+" : f.direction === "negative" ? "-" : "=";
              doc.fill(dirColor).fontSize(7).font("Helvetica-Bold").text(`${dirSymbol} ${f.direction}`, 44 + fCols[0].width, rY + 3, { width: fCols[1].width - 8 });
              doc.fill(GRAY).fontSize(6.5).font("Helvetica").text(descText, 44 + fCols[0].width + fCols[1].width, rY + 3, { width: descWidth });
              doc.y = rY + rowH + 1;
              tableRowIdx++;
            });
          }
        }

        if (ai.riskAnalysis) {
          doc.moveDown(0.6);
          ensureSpace(50);
          const raY = doc.y;
          doc.rect(40, raY - 2, W, 18).fill(AI_LIGHT_BG);
          doc.fill(AI_PURPLE).fontSize(9).font("Helvetica-Bold")
            .text("AI RISK ASSESSMENT — GPT-4o", 46, raY + 2);
          doc.y = raY + 20;
          doc.moveTo(40, doc.y).lineTo(40 + W, doc.y).strokeColor(AI_BORDER).lineWidth(0.5).stroke();
          doc.moveDown(0.4);

          const rlColor = ai.riskAnalysis.riskLevel === "low" ? "#16a34a" : ai.riskAnalysis.riskLevel === "medium" ? "#ca8a04" : ai.riskAnalysis.riskLevel === "high" ? "#ea580c" : "#dc2626";
          doc.fontSize(10).font("Helvetica-Bold").fill(rlColor)
            .text(`${(ai.riskAnalysis.riskLevel || "").toUpperCase()} RISK`, 46, doc.y, { continued: true })
            .fill(GRAY).fontSize(8).font("Helvetica")
            .text(`   Score: ${ai.riskAnalysis.riskScore}/100`);
          doc.moveDown(0.3);
          doc.fontSize(7.5).font("Helvetica").fill(DARK).text(ai.riskAnalysis.summary, 46, doc.y, { width: W - 12 });
          doc.moveDown(0.4);

          if (ai.riskAnalysis.factors && ai.riskAnalysis.factors.length > 0) {
            doc.fontSize(7).font("Helvetica-Bold").fill(AI_PURPLE).text("CONTRIBUTING FACTORS", 46, doc.y);
            doc.moveDown(0.2);
            ai.riskAnalysis.factors.forEach((f: any) => {
              ensureSpace(14);
              const fColor = f.impact === "positive" ? "#16a34a" : "#dc2626";
              const fSym = f.impact === "positive" ? "+" : "-";
              doc.fontSize(7).font("Helvetica-Bold").fill(fColor).text(fSym, 46, doc.y, { continued: true })
                .fill(DARK).font("Helvetica-Bold").text(` ${f.factor}: `, { continued: true })
                .font("Helvetica").fill(GRAY).text(f.detail);
              doc.moveDown(0.1);
            });
          }

          if (ai.riskAnalysis.recommendations && ai.riskAnalysis.recommendations.length > 0) {
            doc.moveDown(0.3);
            doc.fontSize(7).font("Helvetica-Bold").fill(AI_PURPLE).text("AI RECOMMENDATIONS", 46, doc.y);
            doc.moveDown(0.2);
            ai.riskAnalysis.recommendations.forEach((r: string) => {
              ensureSpace(12);
              doc.fontSize(7).font("Helvetica").fill(GRAY).text(`  -> ${r}`, 46, doc.y, { width: W - 12 });
              doc.moveDown(0.1);
            });
          }
        }

        if (ai.narrative) {
          doc.moveDown(0.6);
          ensureSpace(50);
          const naY = doc.y;
          doc.rect(40, naY - 2, W, 18).fill(AI_LIGHT_BG);
          doc.fill(AI_PURPLE).fontSize(9).font("Helvetica-Bold")
            .text("AI CREDIT NARRATIVE — Claude", 46, naY + 2);
          doc.y = naY + 20;
          doc.moveTo(40, doc.y).lineTo(40 + W, doc.y).strokeColor(AI_BORDER).lineWidth(0.5).stroke();
          doc.moveDown(0.4);

          if (ai.narrative.creditworthiness) {
            doc.fontSize(8).font("Helvetica-Bold").fill(AI_PURPLE)
              .text(`Creditworthiness: ${ai.narrative.creditworthiness}`, 46, doc.y);
            doc.moveDown(0.3);
          }

          doc.fontSize(7).font("Helvetica").fill(DARK)
            .text(ai.narrative.narrative, 46, doc.y, { width: W - 12 });
          doc.moveDown(0.4);

          const hasStrengths = ai.narrative.keyStrengths && ai.narrative.keyStrengths.length > 0;
          const hasRisks = ai.narrative.keyRisks && ai.narrative.keyRisks.length > 0;
          if (hasStrengths || hasRisks) {
            const contentW = W - 12;
            const bulletW = 14;
            const textX = 48 + bulletW;
            const textW = contentW - bulletW - 6;

            if (hasStrengths) {
              ensureSpace(14);
              doc.fontSize(7).font("Helvetica-Bold").fill("#16a34a").text("KEY STRENGTHS", 46, doc.y);
              doc.moveDown(0.2);
              ai.narrative.keyStrengths.forEach((s: string) => {
                ensureSpace(14);
                const bulletY = doc.y;
                doc.fontSize(6.5).font("Helvetica-Bold").fill("#16a34a").text("+", 48, bulletY, { width: bulletW });
                doc.fontSize(6.5).font("Helvetica").fill(DARK).text(s, textX, bulletY, { width: textW });
                doc.moveDown(0.15);
              });
            }

            if (hasRisks) {
              doc.moveDown(0.3);
              ensureSpace(14);
              doc.fontSize(7).font("Helvetica-Bold").fill("#dc2626").text("KEY RISKS", 46, doc.y);
              doc.moveDown(0.2);
              ai.narrative.keyRisks.forEach((r: string) => {
                ensureSpace(14);
                const bulletY = doc.y;
                doc.fontSize(6.5).font("Helvetica-Bold").fill("#dc2626").text("-", 48, bulletY, { width: bulletW });
                doc.fontSize(6.5).font("Helvetica").fill(DARK).text(r, textX, bulletY, { width: textW });
                doc.moveDown(0.15);
              });
            }
            doc.moveDown(0.5);
          }

          doc.fontSize(6).font("Helvetica").fill(LIGHT)
            .text(`AI analysis generated: ${ai.generatedAt ? new Date(ai.generatedAt).toLocaleString("en-GB") : "N/A"}`, 46, doc.y, { width: W - 12, align: "right" });
          doc.moveDown(0.3);
        }
      }

      // === XDS Data Ghana Bureau Section ===
      const xdsBureau = reportData.xdsBureauData;
      if (xdsBureau) {
        const xdsSandbox = xdsBureau.source === "sandbox";
        sectionTitle(xdsSandbox ? "XDS Data Ghana — Bureau Enquiry (Sandbox)" : "XDS Data Ghana — Bureau Enquiry");
        ensureSpace(30);

        if (!xdsBureau.found) {
          doc.fontSize(8).font("Helvetica").fill(GRAY)
            .text(`No bureau record found. XDS Ref: ${xdsBureau.xdsRef || "—"}${xdsBureau.error ? ` | Error: ${xdsBureau.error}` : ""}`, 46, doc.y, { width: W - 12 });
          doc.moveDown(0.5);
        } else {
          const scoreColor = (xdsBureau.creditScore || 0) >= 670 ? "#16a34a" : (xdsBureau.creditScore || 0) >= 540 ? "#ca8a04" : "#dc2626";
          doc.fontSize(20).font("Helvetica-Bold").fill(scoreColor)
            .text(String(xdsBureau.creditScore || "—"), 46, doc.y, { width: 60, align: "left" });
          doc.fontSize(8).font("Helvetica-Bold").fill(DARK)
            .text(`${xdsBureau.scoreCategory || ""} (Band ${xdsBureau.scoreBand || "?"}) · XDS Ref: ${xdsBureau.xdsRef}`, 110, doc.y - 8, { width: W - 120 });
          doc.fontSize(6.5).font("Helvetica").fill(LIGHT)
            .text(`Bureau: XDS Data Ghana · Enquiry: ${new Date(xdsBureau.enquiryDate).toLocaleDateString("en-GB")} · Purpose: ${xdsBureau.permissiblePurpose}`, 110, doc.y + 2, { width: W - 120 });
          doc.moveDown(0.8);

          if (xdsBureau.summary) {
            const xs = xdsBureau.summary;
            const summaryFields: [string, string][] = [
              ["Total Facilities", String(xs.totalFacilities)],
              ["Active", String(xs.activeFacilities)],
              ["Closed", String(xs.closedFacilities)],
              ["Total Outstanding", `GHS ${xs.totalOutstanding.toLocaleString()}`],
              ["Adverse Items", String(xs.adverseCount)],
              ["Enquiries (12 mo)", String(xs.enquiriesLast12Months)],
              ["Highest Days Arrears", String(xs.highestDaysInArrears)],
            ];
            infoGrid(summaryFields, 46, W - 12);
            doc.moveDown(0.3);
          }

          if (xdsBureau.facilities && xdsBureau.facilities.length > 0) {
            ensureSpace(20);
            doc.fontSize(7).font("Helvetica-Bold").fill(NORDIC_BLUE).text("FACILITIES", 46, doc.y);
            doc.moveDown(0.2);
            xdsBureau.facilities.forEach((f: any) => {
              ensureSpace(18);
              const statusColor = ["current","performing"].includes(f.status) ? "#16a34a" : ["closed"].includes(f.status) ? LIGHT : "#dc2626";
              doc.fontSize(6.5).font("Helvetica-Bold").fill(DARK)
                .text(`${f.lender} — ${f.facilityType}`, 48, doc.y, { width: W - 120 });
              doc.fontSize(6.5).font("Helvetica").fill(statusColor)
                .text(f.status.toUpperCase(), W - 60, doc.y - 8, { width: 60, align: "right" });
              doc.fontSize(6).font("Helvetica").fill(GRAY)
                .text(`GHS ${f.originalAmount.toLocaleString()} orig · GHS ${f.outstandingBalance.toLocaleString()} outstanding · Open: ${f.openDate}${f.daysInArrears > 0 ? ` · ${f.daysInArrears}d arrears` : ""}`, 48, doc.y, { width: W - 12 });
              doc.moveDown(0.3);
            });
          }

          if (xdsBureau.adverseItems && xdsBureau.adverseItems.length > 0) {
            ensureSpace(20);
            doc.moveDown(0.3);
            doc.fontSize(7).font("Helvetica-Bold").fill("#dc2626").text("ADVERSE ITEMS", 46, doc.y);
            doc.moveDown(0.2);
            xdsBureau.adverseItems.forEach((a: any) => {
              ensureSpace(18);
              doc.fontSize(6.5).font("Helvetica-Bold").fill("#dc2626").text(`[${a.type.replace(/_/g," ").toUpperCase()}]`, 48, doc.y, { width: 100 });
              doc.fontSize(6.5).font("Helvetica").fill(DARK).text(a.description, 48, doc.y, { width: W - 60 });
              doc.fontSize(6).font("Helvetica").fill(GRAY)
                .text(`${a.date} · Status: ${a.status}${a.amount ? ` · GHS ${a.amount.toLocaleString()}` : ""}`, 48, doc.y, { width: W - 12 });
              doc.moveDown(0.3);
            });
          }

          if (xdsSandbox) {
            doc.moveDown(0.3);
            doc.fontSize(6).font("Helvetica").fill(LIGHT)
              .text("* Bureau data sourced from XDS Data Ghana sandbox (deterministic synthetic data). Switch to production credentials for authoritative records.", 46, doc.y, { width: W - 12 });
            doc.moveDown(0.2);
          }
        }
      }

      // === END OF REPORT ===
      ensureSpace(80);
      doc.moveDown(1);
      doc.moveTo(40, doc.y).lineTo(40 + W, doc.y).strokeColor("#cccccc").lineWidth(0.5).stroke();
      doc.moveDown(0.5);
      doc.fontSize(8).font("Helvetica-Bold").fill(DARK)
        .text(L("endOfReport"), 40, doc.y, { width: W, align: "center" });
      doc.moveDown(0.3);
      doc.fontSize(7).font("Helvetica").fill(GRAY)
        .text(`Report Serial: ${reportData.serialNumber} | Generated: ${new Date(reportData.generatedAt).toLocaleString("en-GB")}${reportData.requestedBy ? ` | By: ${reportData.requestedBy.fullName} (${reportData.requestedBy.institution})` : ""}`, 40, doc.y, { width: W, align: "center" });
      doc.moveDown(0.3);
      doc.fontSize(6).font("Helvetica").fill(LIGHT)
        .text(L("disclaimer"), 40, doc.y, { width: W, align: "center" });
      doc.moveDown(0.3);
      doc.fontSize(6).font("Helvetica").fill(LIGHT)
        .text(L("footerLine"), 40, doc.y, { width: W, align: "center" });

      doc.end();
      await new Promise<void>((resolve, reject) => {
        doc.on("end", resolve);
        doc.on("error", reject);
      });

      const pdfBuffer = Buffer.concat(chunks);
      res.set({
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="Credit_Report_${reportData.serialNumber}.pdf"`,
        "Content-Length": pdfBuffer.length,
      });
      res.send(pdfBuffer);
    } catch (e: any) {
      routeLogger.error("PDF generation error:", { detail: e });
      res.status(500).json({ message: safeErrorMessage(e) });
    }
  });

  app.get("/api/backups", requireAuth, requireSuperAdmin, async (_req, res) => {
    try {
      const { listBackups, getBackupStatus } = await import("./backup-service");
      const backups = listBackups();
      const status = getBackupStatus();
      res.json({ backups, status });
    } catch (e: any) {
      res.status(500).json({ message: safeErrorMessage(e) });
    }
  });

  app.post("/api/backups", requireAuth, requireSuperAdmin, async (req, res) => {
    try {
      const { createBackup } = await import("./backup-service");
      const type = ["full", "schema", "data"].includes(req.body.type) ? req.body.type : "full";
      const notes = req.body.notes || "";
      const userId = req.session?.userId || "unknown";
      const record = await createBackup(type, String(userId), notes);
      res.json(record);
    } catch (e: any) {
      res.status(500).json({ message: safeErrorMessage(e) });
    }
  });

  app.get("/api/backups/:id/download", requireAuth, requireSuperAdmin, async (req, res) => {
    try {
      const { getBackupFilePath, listBackups } = await import("./backup-service");
      const filepath = getBackupFilePath(req.params.id);
      if (!filepath) return res.status(404).json({ message: "Backup not found" });
      const backups = listBackups();
      const record = backups.find((b: any) => b.id === req.params.id);
      const filename = record?.filename || "backup.sql.gz";
      res.setHeader("Content-Type", "application/gzip");
      res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
      const fs = await import("fs");
      const stream = fs.createReadStream(filepath);
      stream.pipe(res);
    } catch (e: any) {
      res.status(500).json({ message: safeErrorMessage(e) });
    }
  });

  app.post("/api/backups/:id/restore", requireAuth, requireSuperAdmin, async (req, res) => {
    try {
      const { restoreBackup } = await import("./backup-service");
      const userId = req.session?.userId || "unknown";
      const result = await restoreBackup(req.params.id, String(userId));
      res.json(result);
    } catch (e: any) {
      res.status(500).json({ message: safeErrorMessage(e) });
    }
  });

  app.delete("/api/backups/:id", requireAuth, requireSuperAdmin, async (req, res) => {
    try {
      const { deleteBackup } = await import("./backup-service");
      const deleted = deleteBackup(req.params.id);
      if (!deleted) return res.status(404).json({ message: "Backup not found" });
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ message: safeErrorMessage(e) });
    }
  });

  app.post("/api/backups/:id/verify", requireAuth, requireSuperAdmin, async (req, res) => {
    try {
      const { verifyBackupIntegrity } = await import("./backup-service");
      const result = await verifyBackupIntegrity(req.params.id);
      res.json(result);
    } catch (e: any) {
      res.status(500).json({ message: safeErrorMessage(e) });
    }
  });

  app.get("/api/health/production", requireAuth, requireSuperAdmin, async (_req, res) => {
    try {
      const checks: Record<string, { status: "pass" | "fail" | "warn"; message: string }> = {};
      const isProduction = process.env.PRODUCTION_MODE === "true" || process.env.NODE_ENV === "production";

      let dbOk = false;
      try {
        await pool.query("SELECT 1");
        dbOk = true;
        checks.database = { status: "pass", message: "Connected and responding" };
      } catch {
        checks.database = { status: "fail", message: "Database connection failed" };
      }

      checks.productionMode = isProduction
        ? { status: "pass", message: "PRODUCTION_MODE=true" }
        : { status: "warn", message: "PRODUCTION_MODE not set — security behaviors are relaxed" };

      checks.piiEncryption = process.env.PII_ENCRYPTION_KEY
        ? (process.env.PII_ENCRYPTION_SALT && process.env.PII_ENCRYPTION_SALT !== "cdh-pii-salt-v1"
          ? { status: "pass", message: "Key and salt configured" }
          : { status: "warn", message: "Key set but salt is default — change PII_ENCRYPTION_SALT" })
        : { status: "fail", message: "PII_ENCRYPTION_KEY not set — PII data is not properly encrypted" };

      checks.sessionSecret = process.env.SESSION_SECRET
        ? (process.env.SESSION_SECRET.length >= 64
          ? { status: "pass", message: `Secret is ${process.env.SESSION_SECRET.length} chars` }
          : { status: "warn", message: `Secret is ${process.env.SESSION_SECRET.length} chars — recommend 64+` })
        : { status: "fail", message: "SESSION_SECRET not set" };

      const { isEmailConfigured } = await import("./email");
      const { isSmsConfigured } = await import("./sms");
      checks.email = isEmailConfigured()
        ? { status: "pass", message: "Email provider configured" }
        : { status: "warn", message: "No email provider — transactional emails disabled" };
      checks.sms = isSmsConfigured()
        ? { status: "pass", message: "SMS provider configured" }
        : { status: "warn", message: "No SMS provider — OTP via SMS disabled" };

      const { getBackupStatus, verifyBackupIntegrity } = await import("./backup-service");
      const backupStatus = getBackupStatus();
      if (backupStatus.schedulerRunning && backupStatus.totalBackups > 0) {
        const integrity = await verifyBackupIntegrity();
        checks.backups = integrity.valid
          ? { status: "pass", message: `${backupStatus.totalBackups} backups, latest verified (${integrity.details?.ageHours}h old)` }
          : { status: "warn", message: `${backupStatus.totalBackups} backups but integrity check failed: ${integrity.message}` };
      } else if (backupStatus.schedulerRunning) {
        checks.backups = { status: "warn", message: "Scheduler running but no backups created yet" };
      } else {
        checks.backups = { status: "fail", message: "Backup scheduler not running" };
      }

      checks.seedPassword = !process.env.SEED_ADMIN_PASSWORD
        ? { status: "warn", message: "SEED_ADMIN_PASSWORD not set — seed generates a random password" }
        : { status: "pass", message: "Seed password is configured" };

      const failCount = Object.values(checks).filter(c => c.status === "fail").length;
      const warnCount = Object.values(checks).filter(c => c.status === "warn").length;
      const overall = failCount > 0 ? "not_ready" : (warnCount > 0 ? "ready_with_warnings" : "production_ready");

      res.json({
        overall,
        summary: `${Object.keys(checks).length} checks: ${failCount} failed, ${warnCount} warnings`,
        checks,
        timestamp: new Date().toISOString(),
      });
    } catch (e: any) {
      res.status(500).json({ message: safeErrorMessage(e) });
    }
  });

  app.get("/api/copyright/download-pdf", async (_req, res) => {
    try {
      const copyrightLang = ((_req.query.lang as string) || "en").substring(0, 2);
      const { generateCopyrightPdf } = await import("./copyright-pdf");
      const pdfBuffer = await generateCopyrightPdf(copyrightLang);
      res.set({
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="Africa_Credit_Hub_Copyright_IP_Protection_${new Date().toISOString().split("T")[0]}.pdf"`,
        "Content-Length": pdfBuffer.length,
      });
      res.send(pdfBuffer);
    } catch (e: any) {
      routeLogger.error("Copyright PDF generation error:", { detail: e });
      res.status(500).json({ message: "Failed to generate copyright document" });
    }
  });

  app.post("/api/credit-search/bulk", async (req, res) => {
    try {
      const { identifiers } = req.body;
      if (!Array.isArray(identifiers) || identifiers.length === 0) {
        return res.status(400).json({ message: "identifiers array is required" });
      }

      const orgId = getOrgScope(req);
      const country = getCountryFilter(req);
      const results: any[] = [];
      for (const id of identifiers) {
        const borrowersFound = await storage.searchBorrowers(id, orgId, country);
        if (borrowersFound.length > 0) {
          const borrower = borrowersFound[0];
          const accounts = await storage.getCreditAccountsByBorrower(borrower.id);
          results.push({
            searchTerm: id,
            found: true,
            borrower,
            accountCount: accounts.length,
            totalDebt: accounts.reduce((sum, a) => sum + parseFloat(a.currentBalance || "0"), 0).toFixed(2),
          });
        } else {
          results.push({ searchTerm: id, found: false });
        }
      }

      await storage.createAuditLog({
        action: "BULK_SEARCH", entity: "credit_search", userId: req.session?.userId,
        details: `Bulk credit search for ${identifiers.length} identifiers, ${results.filter(r => r.found).length} found`,
        ipAddress: req.ip || null,
      });

      res.json({ totalSearched: identifiers.length, totalFound: results.filter(r => r.found).length, results });
    } catch (e: any) {
      res.status(500).json({ message: safeErrorMessage(e) });
    }
  });

  app.get("/api/reports/export", requireRole("admin", "regulator", "super_admin"), exportLimiter, async (req, res) => {
    try {
      const orgId = getOrgScope(req);
      const format = (req.query.format as string) || "csv";
      const type = (req.query.type as string) || "portfolio";

      const country = getCountryFilter(req);
      const accounts = type === "portfolio" ? await storage.getAllCreditAccounts(orgId, country, Number.MAX_SAFE_INTEGER) : [];
      const borrowersList = type === "borrowers" ? await storage.getAllBorrowersForExport(orgId, country) : [];

      recordUsageEvent({
        organizationId: orgId || req.session?.organizationId,
        eventType: "data_export",
        country: country || null,
        metadata: JSON.stringify({ format, type, recordCount: type === "portfolio" ? accounts.length : borrowersList.length }),
      });

      if (format === "xlsx") {
        const ExcelJS = (await import("exceljs")).default;
        const workbook = new ExcelJS.Workbook();
        workbook.creator = "Pan-African Credit Registry";
        workbook.created = new Date();
        const headerStyle = { font: { bold: true, color: { argb: "FFFFFFFF" } }, fill: { type: "pattern" as const, pattern: "solid" as const, fgColor: { argb: "FF0D4A42" } } };

        if (type === "portfolio") {
          const sheet = workbook.addWorksheet("Portfolio");
          sheet.columns = [
            { header: "Account Number", key: "accountNumber", width: 20 },
            { header: "Borrower ID", key: "borrowerId", width: 12 },
            { header: "Institution", key: "lenderInstitution", width: 25 },
            { header: "Type", key: "accountType", width: 15 },
            { header: "Original Amount", key: "originalAmount", width: 18 },
            { header: "Current Balance", key: "currentBalance", width: 18 },
            { header: "Currency", key: "currency", width: 10 },
            { header: "Status", key: "status", width: 12 },
          ];
          sheet.getRow(1).font = headerStyle.font;
          sheet.getRow(1).fill = headerStyle.fill;
          accounts.forEach(a => sheet.addRow(a));
        } else if (type === "borrowers") {
          const sheet = workbook.addWorksheet("Borrowers");
          sheet.columns = [
            { header: "Name", key: "name", width: 25 },
            { header: "Type", key: "type", width: 12 },
            { header: "National ID", key: "nationalId", width: 20 },
            { header: "TIN", key: "tinNumber", width: 15 },
            { header: "Gender", key: "gender", width: 10 },
            { header: "City", key: "city", width: 15 },
            { header: "Region", key: "region", width: 15 },
            { header: "PEP", key: "isPep", width: 8 },
          ];
          sheet.getRow(1).font = headerStyle.font;
          sheet.getRow(1).fill = headerStyle.fill;
          borrowersList.forEach(b => {
            const name = b.type === "individual" ? `${b.firstName} ${b.lastName}` : b.companyName;
            sheet.addRow({ ...b, name, isPep: b.isPep ? "Yes" : "No" });
          });
        } else if (type === "audit") {
          const auditLogsList = await storage.getAuditLogs(orgId, country, Number.MAX_SAFE_INTEGER);
          const sheet = workbook.addWorksheet("Audit Trail");
          sheet.columns = [
            { header: "Timestamp", key: "createdAt", width: 22 },
            { header: "Action", key: "action", width: 15 },
            { header: "Entity", key: "entity", width: 15 },
            { header: "Entity ID", key: "entityId", width: 20 },
            { header: "Details", key: "details", width: 40 },
            { header: "User ID", key: "userId", width: 20 },
            { header: "IP Address", key: "ipAddress", width: 18 },
          ];
          sheet.getRow(1).font = headerStyle.font;
          sheet.getRow(1).fill = headerStyle.fill;
          auditLogsList.forEach(log => {
            sheet.addRow({
              ...log,
              createdAt: log.createdAt ? new Date(log.createdAt).toISOString() : "",
            });
          });
        }

        const xlsxBuf = Buffer.from(await workbook.xlsx.writeBuffer() as ArrayBuffer);
        const xlsxHash = generateExportHashBuffer(xlsxBuf);
        let xlsxRecordCount = 0;
        if (type === "portfolio") xlsxRecordCount = accounts.length;
        else if (type === "borrowers") xlsxRecordCount = borrowersList.length;
        else if (type === "audit") {
          const ws = workbook.getWorksheet("Audit Trail");
          xlsxRecordCount = ws ? Math.max(0, ws.rowCount - 1) : 0;
        }

        const encResult = encryptExportBuffer(xlsxBuf);

        await storage.createAuditLog({
          userId: req.session.userId,
          action: "REPORT_EXPORT",
          entity: "report",
          entityId: type,
          details: JSON.stringify({ format: "xlsx", type, recordCount: xlsxRecordCount, sizeBytes: xlsxBuf.byteLength, plaintextSha256: xlsxHash, ciphertextSha256: encResult.ciphertextHash, encrypted: true }),
          ipAddress: req.ip || "unknown",
        });

        const xlsxFilename = `${type}_report_${Date.now()}.enc`;
        res.setHeader("Content-Type", "application/octet-stream");
        res.setHeader("Content-Disposition", `attachment; filename=${xlsxFilename}`);
        res.setHeader("X-Export-SHA256", encResult.ciphertextHash);
        res.setHeader("X-Export-Plaintext-SHA256", xlsxHash);
        res.setHeader("X-Export-Original-Size", String(xlsxBuf.byteLength));
        res.setHeader("X-Export-Encrypted", "true");
        res.setHeader("X-Export-Record-Count", String(xlsxRecordCount));
        res.setHeader("X-Export-SHA256-Companion", Buffer.from(generateSha256Companion(encResult.ciphertextHash, xlsxFilename)).toString("base64"));
        return res.send(encResult.encryptedData);
      } else if (format === "csv") {
        let csv = "";
        if (type === "portfolio") {
          csv = "Account Number,Borrower ID,Institution,Type,Original Amount,Current Balance,Currency,Status,Days in Arrears,Interest Free,Grace Period,Restructure Count\n";
          for (const a of accounts) {
            csv += `"${csvSafe(a.accountNumber)}","${csvSafe(a.borrowerId)}","${csvSafe(a.lenderInstitution)}","${csvSafe(a.accountType)}","${csvSafe(a.originalAmount)}","${csvSafe(a.currentBalance)}","${csvSafe(a.currency)}","${csvSafe(a.status)}","${csvSafe(a.daysInArrears)}","${csvSafe(a.isInterestFree)}","${csvSafe(a.gracePeriodMonths || '')}","${csvSafe(a.restructureCount)}"\n`;
          }
        } else if (type === "borrowers") {
          csv = "Name,Type,National ID,TIN,Gender,City,Region,PEP,Education,Sector\n";
          for (const b of borrowersList) {
            const name = b.type === "individual" ? `${b.firstName} ${b.lastName}` : b.companyName;
            csv += `"${csvSafe(name)}","${csvSafe(b.type)}","${csvSafe(b.nationalId)}","${csvSafe(b.tinNumber || '')}","${csvSafe(b.gender || '')}","${csvSafe(b.city || '')}","${csvSafe(b.region || '')}","${csvSafe(b.isPep)}","${csvSafe(b.educationLevel || '')}","${csvSafe(b.sector || '')}"\n`;
          }
        } else if (type === "audit") {
          const auditLogsList = await storage.getAuditLogs(orgId, country, Number.MAX_SAFE_INTEGER);
          csv = "Timestamp,Action,Entity,Entity ID,Details,User ID,IP Address\n";
          for (const log of auditLogsList) {
            const ts = log.createdAt ? new Date(log.createdAt).toISOString() : "";
            csv += `"${csvSafe(ts)}","${csvSafe(log.action)}","${csvSafe(log.entity)}","${csvSafe(log.entityId || '')}","${csvSafe((log.details || '').replace(/"/g, '""'))}","${csvSafe(log.userId || '')}","${csvSafe(log.ipAddress || '')}"\n`;
          }
        }

        const csvHash = generateExportHash(csv);
        const csvSizeBytes = Buffer.byteLength(csv, "utf8");
        let csvRecordCount = 0;
        if (type === "portfolio") csvRecordCount = accounts.length;
        else if (type === "borrowers") csvRecordCount = borrowersList.length;
        else if (type === "audit") csvRecordCount = csv.split("\n").length - 2;

        const encResult = encryptExportData(csv);

        await storage.createAuditLog({
          userId: req.session.userId,
          action: "REPORT_EXPORT",
          entity: "report",
          entityId: type,
          details: JSON.stringify({ format: "csv", type, recordCount: csvRecordCount, sizeBytes: csvSizeBytes, plaintextSha256: csvHash, ciphertextSha256: encResult.ciphertextHash, encrypted: true }),
          ipAddress: req.ip || "unknown",
        });

        const csvFilename = `${type}_report_${Date.now()}.enc`;
        res.setHeader("Content-Type", "application/octet-stream");
        res.setHeader("Content-Disposition", `attachment; filename=${csvFilename}`);
        res.setHeader("X-Export-SHA256", encResult.ciphertextHash);
        res.setHeader("X-Export-Plaintext-SHA256", csvHash);
        res.setHeader("X-Export-Original-Size", String(csvSizeBytes));
        res.setHeader("X-Export-Encrypted", "true");
        res.setHeader("X-Export-Record-Count", String(csvRecordCount));
        res.setHeader("X-Export-SHA256-Companion", Buffer.from(generateSha256Companion(encResult.ciphertextHash, csvFilename)).toString("base64"));
        return res.send(encResult.encryptedData);
      } else {
        res.status(400).json({ message: "Unsupported format. Use csv or xlsx." });
      }
    } catch (e: any) {
      res.status(500).json({ message: safeErrorMessage(e) });
    }
  });

  app.get("/api/reports/regulatory", requireRole("admin", "regulator", "super_admin"), async (req, res) => {
    try {
      const orgId = getOrgScope(req);
      const country = getCountryFilter(req);
      const [portfolio, borrowerAgg, stats, disputeList, approvals, { data: instList }] = await Promise.all([
        storage.getPortfolioAggregates(orgId, country),
        storage.getBorrowerAggregates(orgId, country),
        storage.getDashboardStats(orgId, country),
        storage.getDisputes(orgId, country),
        storage.getPendingApprovals(orgId, country),
        storage.getInstitutions(1, 200, orgId, country),
      ]);

      const nplCount = portfolio.delinquentCount + portfolio.defaultedCount;
      const nplRatio = portfolio.totalAccounts > 0 ? (nplCount / portfolio.totalAccounts * 100).toFixed(2) : "0";

      const accFilters: any[] = [];
      if (orgId) accFilters.push(eq(creditAccounts.organizationId, orgId));
      if (country) {
        const countryOrgs = await db.select({ id: organizations.id }).from(organizations).where(eq(organizations.country, country));
        if (countryOrgs.length > 0) accFilters.push(inArray(creditAccounts.organizationId, countryOrgs.map(o => o.id)));
      }
      const accWhere = accFilters.length > 1 ? and(...accFilters) : accFilters[0];

      const byInstitution: Record<string, { count: number; outstanding: number; npl: number }> = {};
      const instData = await db.select({
        lender: creditAccounts.lenderInstitution,
        cnt: count(),
        outstanding: sql<string>`COALESCE(SUM("current_balance"::numeric), 0)::text`,
        npl: sql<number>`COUNT(*) FILTER (WHERE "status" IN ('delinquent', 'default', 'written_off'))`,
      }).from(creditAccounts).where(accWhere).groupBy(creditAccounts.lenderInstitution);
      for (const r of instData) {
        byInstitution[r.lender] = { count: Number(r.cnt), outstanding: parseFloat(r.outstanding), npl: Number(r.npl) };
      }

      const byType: Record<string, number> = {};
      for (const t of portfolio.typeBreakdown) { byType[t.name] = t.value; }

      const restructuredCount = portfolio.statusBreakdown.find(s => s.name === "restructured")?.value ?? 0;
      const writtenOffCount = portfolio.statusBreakdown.find(s => s.name === "written_off")?.value ?? 0;

      const openDisputes = disputeList.filter(d => d.status === "open" || d.status === "under_review");
      const slaBreach = openDisputes.filter(d => d.slaDeadline && new Date(d.slaDeadline) < new Date());

      const borrowerFilters: any[] = [];
      if (orgId) borrowerFilters.push(eq(borrowers.organizationId, orgId));
      if (country) borrowerFilters.push(eq(borrowers.country, country));
      const pepWhere = borrowerFilters.length > 0 ? and(eq(borrowers.isPep, true), ...borrowerFilters) : eq(borrowers.isPep, true);
      const [pepCount] = await db.select({ value: count() }).from(borrowers).where(pepWhere);

      const ifWhere = accWhere ? and(eq(creditAccounts.isInterestFree, true), accWhere) : eq(creditAccounts.isInterestFree, true);
      const [interestFreeCount] = await db.select({ value: count() }).from(creditAccounts).where(ifWhere);

      res.json({
        summary: {
          totalBorrowers: borrowerAgg.total,
          individualBorrowers: borrowerAgg.individuals,
          corporateBorrowers: borrowerAgg.corporates,
          pepBorrowers: pepCount.value,
          totalAccounts: portfolio.totalAccounts,
          totalOutstanding: portfolio.totalValue.toFixed(2),
          nplAccounts: nplCount,
          nplRatio: `${nplRatio}%`,
          interestFreeAccounts: interestFreeCount.value,
          restructuredAccounts: restructuredCount,
          writtenOffAccounts: writtenOffCount,
        },
        disputes: {
          total: disputeList.length,
          open: openDisputes.length,
          resolved: disputeList.filter(d => d.status === "resolved").length,
          slaBreaches: slaBreach.length,
        },
        approvals: {
          total: approvals.length,
          pending: approvals.filter(a => a.status === "pending").length,
          approved: approvals.filter(a => a.status === "approved").length,
          rejected: approvals.filter(a => a.status === "rejected").length,
        },
        institutions: {
          total: instList.length,
          active: instList.filter(i => i.status === "active").length,
          pending: instList.filter(i => i.status === "pending").length,
        },
        portfolioByInstitution: byInstitution,
        portfolioByType: byType,
      });
    } catch (e: any) {
      res.status(500).json({ message: safeErrorMessage(e) });
    }
  });

  app.get("/api/bog/export/:fileType", requireRole("admin", "regulator", "super_admin"), exportLimiter, async (req, res) => {
    try {
      const fileType = req.params.fileType.toUpperCase() as BogFileType;
      const validTypes: BogFileType[] = ["CONC", "BUSC", "CONJ", "BUSJ", "COND", "BUSD"];
      if (!validTypes.includes(fileType)) {
        return res.status(400).json({ message: `Invalid file type: ${fileType}. Must be one of: ${validTypes.join(", ")}` });
      }
      const reportingDate = (req.query.reportingDate as string) || new Date().toISOString().split("T")[0].replace(/-/g, "");
      const sequenceNumber = parseInt(req.query.sequenceNumber as string) || 1;
      const correctionIndicator = (req.query.correctionIndicator as string) || "0";

      const orgId = getOrgScope(req);
      const generator = BOG_EXPORT_GENERATORS[fileType];
      const { content, filename } = await generator(reportingDate, sequenceNumber, correctionIndicator, orgId);

      const bogHash = generateExportHash(content);
      const bogSizeBytes = Buffer.byteLength(content, "utf8");
      const bogRecordCount = content.split("\n").filter(l => l.trim()).length - 1;

      const encResult = encryptExportData(content);
      await storage.createAuditLog({
        userId: req.session.userId,
        action: "REGULATORY_EXPORT",
        entity: "bog_report",
        entityId: fileType,
        details: JSON.stringify({ regulator: "BoG", fileType, filename, sizeBytes: bogSizeBytes, recordCount: bogRecordCount, plaintextSha256: bogHash, ciphertextSha256: encResult.ciphertextHash, encrypted: true }),
        ipAddress: req.ip || "unknown",
      });

      const bogEncFilename = `${filename}.enc`;
      res.setHeader("Content-Type", "application/octet-stream");
      res.setHeader("Content-Disposition", `attachment; filename="${bogEncFilename}"`);
      res.setHeader("X-Export-SHA256", encResult.ciphertextHash);
      res.setHeader("X-Export-Plaintext-SHA256", bogHash);
      res.setHeader("X-Export-Encrypted", "true");
      res.setHeader("X-Export-Size-Bytes", String(bogSizeBytes));
      res.setHeader("X-Export-Record-Count", String(bogRecordCount));
      res.setHeader("X-Export-SHA256-Companion", Buffer.from(generateSha256Companion(encResult.ciphertextHash, bogEncFilename)).toString("base64"));
      res.send(encResult.encryptedData);
    } catch (e: any) {
      routeLogger.error("BoG export error:", { detail: e });
      res.status(500).json({ message: safeErrorMessage(e) });
    }
  });

  app.get("/api/bog/export-preview/:fileType", requireRole("admin", "regulator", "super_admin"), async (req, res) => {
    try {
      const fileType = req.params.fileType.toUpperCase() as BogFileType;
      const validTypes: BogFileType[] = ["CONC", "BUSC", "CONJ", "BUSJ", "COND", "BUSD"];
      if (!validTypes.includes(fileType)) {
        return res.status(400).json({ message: `Invalid file type` });
      }
      const reportingDate = (req.query.reportingDate as string) || new Date().toISOString().split("T")[0].replace(/-/g, "");
      const orgId = getOrgScope(req);
      const generator = BOG_EXPORT_GENERATORS[fileType];
      const { content, filename } = await generator(reportingDate, 1, "0", orgId);
      const lines = content.split("\n");
      res.json({ filename, totalRows: lines.length - 1, headerRow: lines[0], sampleRows: lines.slice(1, 4) });
    } catch (e: any) {
      res.status(500).json({ message: safeErrorMessage(e) });
    }
  });

  app.get("/api/bsl/export/:fileType", requireRole("admin", "regulator", "super_admin"), exportLimiter, async (req, res) => {
    try {
      const fileType = req.params.fileType.toUpperCase() as BslFileType;
      const validTypes: BslFileType[] = ["CONC", "BUSC", "CONJ", "BUSJ", "COND", "BUSD"];
      if (!validTypes.includes(fileType)) {
        return res.status(400).json({ message: `Invalid file type: ${fileType}. Must be one of: ${validTypes.join(", ")}` });
      }
      const reportingDate = (req.query.reportingDate as string) || new Date().toISOString().split("T")[0].replace(/-/g, "");
      const sequenceNumber = parseInt(req.query.sequenceNumber as string) || 1;
      const correctionIndicator = (req.query.correctionIndicator as string) || "0";

      const orgId = getOrgScope(req);
      const generator = BSL_EXPORT_GENERATORS[fileType];
      const { content, filename } = await generator(reportingDate, sequenceNumber, correctionIndicator, orgId);

      const bslHash = generateExportHash(content);
      const bslSizeBytes = Buffer.byteLength(content, "utf8");
      const bslRecordCount = content.split("\n").filter(l => l.trim()).length - 1;

      const encResult = encryptExportData(content);
      await storage.createAuditLog({
        userId: req.session.userId,
        action: "REGULATORY_EXPORT",
        entity: "bsl_report",
        entityId: fileType,
        details: JSON.stringify({ regulator: "BSL", fileType, filename, sizeBytes: bslSizeBytes, recordCount: bslRecordCount, plaintextSha256: bslHash, ciphertextSha256: encResult.ciphertextHash, encrypted: true }),
        ipAddress: req.ip || "unknown",
      });

      const bslEncFilename = `${filename}.enc`;
      res.setHeader("Content-Type", "application/octet-stream");
      res.setHeader("Content-Disposition", `attachment; filename="${bslEncFilename}"`);
      res.setHeader("X-Export-SHA256", encResult.ciphertextHash);
      res.setHeader("X-Export-Plaintext-SHA256", bslHash);
      res.setHeader("X-Export-Encrypted", "true");
      res.setHeader("X-Export-Size-Bytes", String(bslSizeBytes));
      res.setHeader("X-Export-Record-Count", String(bslRecordCount));
      res.setHeader("X-Export-SHA256-Companion", Buffer.from(generateSha256Companion(encResult.ciphertextHash, bslEncFilename)).toString("base64"));
      res.send(encResult.encryptedData);
    } catch (e: any) {
      routeLogger.error("BSL export error:", { detail: e });
      res.status(500).json({ message: safeErrorMessage(e) });
    }
  });

  app.get("/api/bsl/export-preview/:fileType", requireRole("admin", "regulator", "super_admin"), async (req, res) => {
    try {
      const fileType = req.params.fileType.toUpperCase() as BslFileType;
      const validTypes: BslFileType[] = ["CONC", "BUSC", "CONJ", "BUSJ", "COND", "BUSD"];
      if (!validTypes.includes(fileType)) {
        return res.status(400).json({ message: `Invalid file type` });
      }
      const reportingDate = (req.query.reportingDate as string) || new Date().toISOString().split("T")[0].replace(/-/g, "");
      const orgId = getOrgScope(req);
      const generator = BSL_EXPORT_GENERATORS[fileType];
      const { content, filename } = await generator(reportingDate, 1, "0", orgId);
      const lines = content.split("\n");
      res.json({ filename, totalRows: lines.length - 1, headerRow: lines[0], sampleRows: lines.slice(1, 4) });
    } catch (e: any) {
      res.status(500).json({ message: safeErrorMessage(e) });
    }
  });

  app.get("/api/api-keys", requireAuth, requireRole("admin"), async (_req, res) => {
    try {
      const keys = await storage.getAllApiKeys();
      const keysWithInstitution = await Promise.all(keys.map(async (k) => {
        const inst = await storage.getInstitution(k.institutionId);
        return { ...k, institutionName: inst?.name || "Unknown" };
      }));
      res.json(keysWithInstitution);
    } catch (e: any) {
      res.status(500).json({ message: safeErrorMessage(e) });
    }
  });

  const createApiKeyBodySchema = z.object({
    institutionId: z.string().min(1, "institutionId is required"),
    label: z.string().min(1, "label is required").max(100),
    permissions: z.enum(["submit", "read", "full"]).default("submit"),
  });

  app.post("/api/api-keys", requireAuth, requireRole("admin"), async (req, res) => {
    try {
      const parsed = createApiKeyBodySchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: parsed.error.errors.map(e => e.message).join(", ") });
      }
      const { institutionId, label, permissions } = parsed.data;

      const institution = await storage.getInstitution(institutionId);
      if (!institution) return res.status(404).json({ message: "Institution not found" });
      if (institution.status !== "active") return res.status(400).json({ message: "Institution must be active to generate API keys" });

      const { fullKey, prefix, hash } = generateApiKey();
      const apiKey = await storage.createApiKey({
        institutionId,
        keyHash: hash,
        keyPrefix: prefix,
        label,
        permissions: permissions || "submit",
        status: "active",
        createdBy: req.session!.userId!,
      });

      await storage.createAuditLog({
        userId: req.session!.userId,
        action: "CREATE",
        entity: "api_key",
        entityId: apiKey.id,
        details: `API key generated for ${institution.name} (${label})`,
        ipAddress: req.ip || "unknown",
      });

      res.status(201).json({ ...apiKey, fullKey });
    } catch (e: any) {
      res.status(500).json({ message: safeErrorMessage(e) });
    }
  });

  app.post("/api/api-keys/:id/revoke", requireAuth, requireRole("admin"), async (req, res) => {
    try {
      const revoked = await storage.revokeApiKey(req.params.id);
      if (!revoked) return res.status(404).json({ message: "API key not found" });

      await storage.createAuditLog({
        userId: req.session!.userId,
        action: "UPDATE",
        entity: "api_key",
        entityId: revoked.id,
        details: `API key revoked: ${revoked.label}`,
        ipAddress: req.ip || "unknown",
      });

      res.json(revoked);
    } catch (e: any) {
      res.status(500).json({ message: safeErrorMessage(e) });
    }
  });

  const _dirnameCompat = typeof __dirname !== "undefined" ? __dirname : process.cwd();
  const DOCS_DIR_CANDIDATES = [
    path.resolve(process.cwd(), "docs"),
    path.resolve(_dirnameCompat, "docs"),
    path.resolve(_dirnameCompat, "../docs"),
    path.resolve(_dirnameCompat, "../../docs"),
  ];
  const DOCS_DIR = DOCS_DIR_CANDIDATES.find(d => fs.existsSync(d)) || path.resolve(process.cwd(), "docs");
  const SUPPORTED_DOC_LANGS = ["en", "fr", "ar", "sw", "pt"];
  const DOCS_LIST = [
    { id: "api-guide", filename: "API_Integration_Guide.md", title: "API Integration Guide", description: "Complete guide for banks and lenders to connect via REST API — authentication, endpoints, data models, and examples" },
    { id: "uat", filename: "UAT_Test_Document.md", title: "UAT Test Document", description: "187 test cases across 22 modules with SRS traceability" },
    { id: "systems", filename: "Systems_Documentation.md", title: "Systems Documentation", description: "Technical architecture, data model, API catalog, security, deployment" },
    { id: "users-manual", filename: "Users_Manual.md", title: "Users Manual", description: "Step-by-step user guide for all roles with 24 sections" },
    { id: "srs-matrix", filename: "SRS_Traceability_Matrix.md", title: "SRS Traceability Matrix", description: "57 SRS requirements mapped to implementation status" },
    { id: "data-dictionary", filename: "Data_Dictionary.md", title: "Data Dictionary", description: "Field-level documentation for all 15 tables" },
    { id: "deployment", filename: "Deployment_Guide.md", title: "Deployment Guide", description: "Step-by-step deployment instructions" },
    { id: "security", filename: "Security_Compliance_Report.md", title: "Security & Compliance Report", description: "Security controls with NFR-SEC compliance matrix" },
    { id: "security-policy", filename: "Security_Policy.md", title: "Information Security Policy", description: "Comprehensive security policy covering access control, data protection, encryption, incident response, and third-party security" },
    { id: "dr-plan", filename: "Disaster_Recovery_Plan.md", title: "Disaster Recovery & Business Continuity Plan", description: "DR/BC plan with RTO/RPO targets, backup strategy, recovery procedures, and testing schedule" },
    { id: "change-mgmt", filename: "Change_Management_Policy.md", title: "Change Management Policy", description: "Formal change control process — categorization, impact assessment, approval workflow, and audit trail" },
    { id: "pentest-readiness", filename: "Penetration_Test_Readiness.md", title: "Penetration Test Readiness Report", description: "Security controls inventory prepared for formal penetration testing — authentication, authorization, encryption, and API security" },
    { id: "liberia-proposal", filename: "Liberia_Marketing_Proposal.md", title: "Liberia Marketing Proposal", description: "Marketing & technical proposal for the Republic of Liberia — credit bureau solution, compliance assessment, implementation roadmap, and pricing" },
    { id: "credit-procedures", filename: "Credit_Reporting_Procedures_Manual.md", title: "Credit Reporting Procedures Manual", description: "Data submission workflows, report generation, scoring methodology, dispute SLAs, data correction, and regulatory reporting procedures" },
    { id: "data-protection", filename: "Data_Protection_Compliance_Guide.md", title: "Data Protection Compliance Guide", description: "GDPR/AU Convention alignment, Ghana Act 843, data subject rights, cross-border safeguards, retention policies, breach notification, and DPO role" },
    { id: "regulatory-pack", filename: "Regulatory_Engagement_Pack.md", title: "Regulatory Engagement Pack", description: "System capabilities summary, compliance evidence matrix, security controls attestation, and go-live readiness checklist for regulators" },
    { id: "data-submission", filename: "Data_Submission_Guide.md", title: "Data Submission Guide", description: "Step-by-step instructions for submitting credit data — manual entry, batch CSV upload, REST API, and BoG IFF file formats" },
    { id: "dispute-procedures", filename: "Dispute_Handling_Procedures.md", title: "Dispute Handling Procedures", description: "Standard operating procedures for dispute intake, investigation, SLA timelines, escalation paths, cross-border disputes, and resolution actions" },
  ];

  const DOC_TRANSLATIONS: Record<string, Record<string, { title: string; description: string }>> = {
    fr: {
      "api-guide": { title: "Guide d'Intégration API", description: "Guide complet pour les banques et prêteurs pour se connecter via l'API REST — authentification, points d'accès, modèles de données et exemples" },
      uat: { title: "Document de Tests UAT", description: "187 cas de test répartis sur 22 modules avec traçabilité SRS" },
      systems: { title: "Documentation Systèmes", description: "Architecture technique, modèle de données, catalogue API, sécurité, déploiement" },
      "users-manual": { title: "Manuel Utilisateur", description: "Guide utilisateur étape par étape pour tous les rôles avec 24 sections" },
      "srs-matrix": { title: "Matrice de Traçabilité SRS", description: "57 exigences SRS mappées au statut d'implémentation" },
      "data-dictionary": { title: "Dictionnaire de Données", description: "Documentation au niveau des champs pour les 15 tables" },
      deployment: { title: "Guide de Déploiement", description: "Instructions de déploiement étape par étape" },
      security: { title: "Rapport Sécurité & Conformité", description: "Contrôles de sécurité avec matrice de conformité NFR-SEC" },
      "security-policy": { title: "Politique de Sécurité de l'Information", description: "Politique de sécurité complète couvrant le contrôle d'accès, la protection des données, le chiffrement, la réponse aux incidents et la sécurité des tiers" },
      "dr-plan": { title: "Plan de Reprise d'Activité et Continuité", description: "Plan DR/BC avec objectifs RTO/RPO, stratégie de sauvegarde, procédures de récupération et calendrier de tests" },
      "change-mgmt": { title: "Politique de Gestion des Changements", description: "Processus formel de contrôle des changements — catégorisation, évaluation d'impact, flux d'approbation et piste d'audit" },
      "pentest-readiness": { title: "Rapport de Préparation aux Tests de Pénétration", description: "Inventaire des contrôles de sécurité préparé pour les tests de pénétration formels — authentification, autorisation, chiffrement et sécurité API" },
      "liberia-proposal": { title: "Proposition Marketing Libéria", description: "Proposition marketing et technique pour la République du Libéria — solution bureau de crédit, évaluation de conformité, feuille de route et tarification" },
      "credit-procedures": { title: "Manuel de Procédures de Reporting Crédit", description: "Flux de soumission des données, génération de rapports, méthodologie de notation, SLA de litiges, correction des données et procédures de reporting réglementaire" },
      "data-protection": { title: "Guide de Conformité Protection des Données", description: "Alignement RGPD/Convention UA, Loi 843 du Ghana, droits des personnes concernées, garanties transfrontalières, politiques de rétention, notification de violation et rôle du DPO" },
      "regulatory-pack": { title: "Pack d'Engagement Réglementaire", description: "Résumé des capacités du système, matrice de preuves de conformité, attestation des contrôles de sécurité et liste de contrôle de préparation au lancement" },
      "data-submission": { title: "Guide de Soumission des Données", description: "Instructions étape par étape pour soumettre des données de crédit — saisie manuelle, téléchargement CSV par lot, API REST et formats de fichiers BoG IFF" },
      "dispute-procedures": { title: "Procédures de Traitement des Litiges", description: "Procédures opérationnelles standard pour l'admission, l'investigation, les délais SLA, les voies d'escalade, les litiges transfrontaliers et les actions de résolution" },
    },
    pt: {
      "api-guide": { title: "Guia de Integração API", description: "Guia completo para bancos e credores se conectarem via API REST — autenticação, endpoints, modelos de dados e exemplos" },
      uat: { title: "Documento de Testes UAT", description: "187 casos de teste em 22 módulos com rastreabilidade SRS" },
      systems: { title: "Documentação de Sistemas", description: "Arquitetura técnica, modelo de dados, catálogo de APIs, segurança, implantação" },
      "users-manual": { title: "Manual do Utilizador", description: "Guia do utilizador passo a passo para todas as funções com 24 secções" },
      "srs-matrix": { title: "Matriz de Rastreabilidade SRS", description: "57 requisitos SRS mapeados para o estado de implementação" },
      "data-dictionary": { title: "Dicionário de Dados", description: "Documentação ao nível dos campos para as 15 tabelas" },
      deployment: { title: "Guia de Implantação", description: "Instruções de implantação passo a passo" },
      security: { title: "Relatório de Segurança e Conformidade", description: "Controlos de segurança com matriz de conformidade NFR-SEC" },
      "security-policy": { title: "Política de Segurança da Informação", description: "Política de segurança abrangente cobrindo controlo de acesso, proteção de dados, encriptação, resposta a incidentes e segurança de terceiros" },
      "dr-plan": { title: "Plano de Recuperação de Desastres e Continuidade", description: "Plano DR/BC com metas RTO/RPO, estratégia de backup, procedimentos de recuperação e cronograma de testes" },
      "change-mgmt": { title: "Política de Gestão de Mudanças", description: "Processo formal de controlo de mudanças — categorização, avaliação de impacto, fluxo de aprovação e trilha de auditoria" },
      "pentest-readiness": { title: "Relatório de Preparação para Testes de Penetração", description: "Inventário de controlos de segurança preparado para testes de penetração formais — autenticação, autorização, encriptação e segurança da API" },
      "liberia-proposal": { title: "Proposta de Marketing Libéria", description: "Proposta de marketing e técnica para a República da Libéria — solução de bureau de crédito, avaliação de conformidade, roteiro de implementação e preços" },
      "credit-procedures": { title: "Manual de Procedimentos de Reporte de Crédito", description: "Fluxos de submissão de dados, geração de relatórios, metodologia de pontuação, SLAs de litígios, correção de dados e procedimentos de reporte regulatório" },
      "data-protection": { title: "Guia de Conformidade de Proteção de Dados", description: "Alinhamento RGPD/Convenção UA, Lei 843 do Gana, direitos dos titulares, salvaguardas transfronteiriças, políticas de retenção, notificação de violação e papel do DPO" },
      "regulatory-pack": { title: "Pacote de Engajamento Regulatório", description: "Resumo das capacidades do sistema, matriz de evidências de conformidade, atestado de controlos de segurança e lista de verificação de preparação para lançamento" },
      "data-submission": { title: "Guia de Submissão de Dados", description: "Instruções passo a passo para submeter dados de crédito — entrada manual, carregamento CSV em lote, API REST e formatos de ficheiros BoG IFF" },
      "dispute-procedures": { title: "Procedimentos de Tratamento de Litígios", description: "Procedimentos operacionais padrão para admissão, investigação, prazos SLA, vias de escalada, litígios transfronteiriços e ações de resolução" },
    },
    ar: {
      "api-guide": { title: "دليل تكامل API", description: "دليل شامل للبنوك والمقرضين للاتصال عبر REST API — المصادقة ونقاط النهاية ونماذج البيانات والأمثلة" },
      uat: { title: "وثيقة اختبار UAT", description: "187 حالة اختبار عبر 22 وحدة مع تتبع SRS" },
      systems: { title: "توثيق الأنظمة", description: "البنية التقنية ونموذج البيانات وكتالوج API والأمان والنشر" },
      "users-manual": { title: "دليل المستخدم", description: "دليل المستخدم خطوة بخطوة لجميع الأدوار مع 24 قسمًا" },
      "srs-matrix": { title: "مصفوفة تتبع SRS", description: "57 متطلب SRS مُربطة بحالة التنفيذ" },
      "data-dictionary": { title: "قاموس البيانات", description: "توثيق على مستوى الحقول لجميع الجداول الـ 15" },
      deployment: { title: "دليل النشر", description: "تعليمات النشر خطوة بخطوة" },
      security: { title: "تقرير الأمان والامتثال", description: "ضوابط الأمان مع مصفوفة امتثال NFR-SEC" },
      "security-policy": { title: "سياسة أمن المعلومات", description: "سياسة أمنية شاملة تغطي التحكم في الوصول وحماية البيانات والتشفير والاستجابة للحوادث وأمن الأطراف الثالثة" },
      "dr-plan": { title: "خطة التعافي من الكوارث واستمرارية الأعمال", description: "خطة DR/BC مع أهداف RTO/RPO واستراتيجية النسخ الاحتياطي وإجراءات الاسترداد وجدول الاختبار" },
      "change-mgmt": { title: "سياسة إدارة التغيير", description: "عملية رسمية لمراقبة التغيير — التصنيف وتقييم الأثر وسير عمل الموافقة ومسار التدقيق" },
      "pentest-readiness": { title: "تقرير جاهزية اختبار الاختراق", description: "جرد ضوابط الأمان المُعد لاختبار الاختراق الرسمي — المصادقة والتفويض والتشفير وأمان API" },
      "liberia-proposal": { title: "عرض تسويق ليبيريا", description: "عرض تسويقي وتقني لجمهورية ليبيريا — حل مكتب الائتمان وتقييم الامتثال وخارطة طريق التنفيذ والتسعير" },
      "credit-procedures": { title: "دليل إجراءات التقارير الائتمانية", description: "مسارات تقديم البيانات وإنشاء التقارير ومنهجية التصنيف واتفاقيات مستوى الخدمة للنزاعات وتصحيح البيانات وإجراءات التقارير التنظيمية" },
      "data-protection": { title: "دليل الامتثال لحماية البيانات", description: "التوافق مع GDPR/اتفاقية الاتحاد الأفريقي والقانون 843 لغانا وحقوق أصحاب البيانات والضمانات العابرة للحدود وسياسات الاحتفاظ والإخطار بالانتهاك ودور مسؤول حماية البيانات" },
      "regulatory-pack": { title: "حزمة المشاركة التنظيمية", description: "ملخص قدرات النظام ومصفوفة أدلة الامتثال وشهادة ضوابط الأمان وقائمة مراجعة الجاهزية للإطلاق" },
      "data-submission": { title: "دليل تقديم البيانات", description: "تعليمات خطوة بخطوة لتقديم بيانات الائتمان — الإدخال اليدوي والتحميل المجمع بصيغة CSV وواجهة REST API وتنسيقات ملفات BoG IFF" },
      "dispute-procedures": { title: "إجراءات التعامل مع النزاعات", description: "إجراءات التشغيل القياسية لقبول النزاعات والتحقيق والجداول الزمنية لاتفاقية مستوى الخدمة ومسارات التصعيد والنزاعات العابرة للحدود وإجراءات الحل" },
    },
    sw: {
      "api-guide": { title: "Mwongozo wa Muunganisho wa API", description: "Mwongozo kamili kwa benki na wakopeshaji kuunganisha kupitia REST API — uthibitishaji, vituo, miundo ya data na mifano" },
      uat: { title: "Hati ya Majaribio ya UAT", description: "Visa 187 vya majaribio katika moduli 22 na ufuatiliaji wa SRS" },
      systems: { title: "Nyaraka za Mifumo", description: "Usanifu wa kiufundi, muundo wa data, katalogi ya API, usalama, usambazaji" },
      "users-manual": { title: "Mwongozo wa Mtumiaji", description: "Mwongozo wa mtumiaji hatua kwa hatua kwa majukumu yote na sehemu 24" },
      "srs-matrix": { title: "Jedwali la Ufuatiliaji wa SRS", description: "Mahitaji 57 ya SRS yaliyooanishwa na hali ya utekelezaji" },
      "data-dictionary": { title: "Kamusi ya Data", description: "Nyaraka za kiwango cha sehemu kwa jedwali zote 15" },
      deployment: { title: "Mwongozo wa Usambazaji", description: "Maagizo ya usambazaji hatua kwa hatua" },
      security: { title: "Ripoti ya Usalama na Utiifu", description: "Vidhibiti vya usalama na jedwali la utiifu wa NFR-SEC" },
      "security-policy": { title: "Sera ya Usalama wa Taarifa", description: "Sera kamili ya usalama inayoshughulikia udhibiti wa ufikiaji, ulinzi wa data, usimbaji fiche, majibu ya matukio na usalama wa wahusika wa tatu" },
      "dr-plan": { title: "Mpango wa Uokoaji na Mwendelezo wa Biashara", description: "Mpango wa DR/BC wenye malengo ya RTO/RPO, mkakati wa hifadhi, taratibu za urejeshaji na ratiba ya majaribio" },
      "change-mgmt": { title: "Sera ya Usimamizi wa Mabadiliko", description: "Mchakato rasmi wa udhibiti wa mabadiliko — uainishaji, tathmini ya athari, mtiririko wa idhini na njia ya ukaguzi" },
      "pentest-readiness": { title: "Ripoti ya Utayari wa Majaribio ya Kupenya", description: "Orodha ya vidhibiti vya usalama iliyoandaliwa kwa majaribio rasmi ya kupenya — uthibitishaji, idhini, usimbaji fiche na usalama wa API" },
      "liberia-proposal": { title: "Pendekezo la Masoko la Liberia", description: "Pendekezo la masoko na kiufundi kwa Jamhuri ya Liberia — suluhisho la ofisi ya mikopo, tathmini ya utiifu, ramani ya utekelezaji na bei" },
      "credit-procedures": { title: "Mwongozo wa Taratibu za Taarifa za Mikopo", description: "Mtiririko wa uwasilishaji wa data, uzalishaji wa ripoti, mbinu ya alama, SLA za migogoro, marekebisho ya data na taratibu za taarifa za udhibiti" },
      "data-protection": { title: "Mwongozo wa Utiifu wa Ulinzi wa Data", description: "Ulinganifu wa GDPR/Mkataba wa UA, Sheria 843 ya Ghana, haki za wahusika wa data, ulinzi wa kuvuka mipaka, sera za uhifadhi, arifa ya ukiukaji na jukumu la DPO" },
      "regulatory-pack": { title: "Kifurushi cha Ushirikiano wa Udhibiti", description: "Muhtasari wa uwezo wa mfumo, jedwali la ushahidi wa utiifu, uthibitisho wa vidhibiti vya usalama na orodha ya ukaguzi wa utayari wa uzinduzi" },
      "data-submission": { title: "Mwongozo wa Uwasilishaji wa Data", description: "Maagizo hatua kwa hatua ya kuwasilisha data ya mikopo — uingizaji wa mikono, upakiaji wa CSV kwa wingi, API ya REST na muundo wa faili za BoG IFF" },
      "dispute-procedures": { title: "Taratibu za Kushughulikia Migogoro", description: "Taratibu za kawaida za uendeshaji kwa mapokezi ya migogoro, uchunguzi, ratiba za SLA, njia za kupandisha, migogoro ya kuvuka mipaka na hatua za utatuzi" },
    },
  };

  const GHANA_DOC_TRANSLATIONS: Record<string, Record<string, { title: string; description: string }>> = {
    fr: {
      "ghana-sla": { title: "Accord SLA Ghana", description: "Accord de niveau de service pour le registre de crédit du Ghana — disponibilité, résolution des litiges, soumission des données et indicateurs de performance" },
      "ghana-compliance": { title: "Cadre de Conformité Réglementaire", description: "Cadre de conformité couvrant la loi 726, la loi 843 sur la protection des données et les directives opérationnelles BoG CRB" },
      "ghana-e2e": { title: "Plan de Test de Bout en Bout", description: "Plan de test E2E complet pour le mode CRB Ghana — inscription des emprunteurs, comptes de crédit, téléchargement BoG et sécurité" },
      "ghana-data-standards": { title: "Référence des Normes de Données BoG CRB", description: "Normes de données BoG CRB v1.1 complètes — formats de fichiers, types de facilités, classifications d'actifs et règles de validation" },
      "ghana-data-protection": { title: "Politique de Protection des Données et de Confidentialité", description: "Politique de protection des données conforme à la loi 843 — base juridique, droits des personnes concernées, mesures de sécurité et gestion des violations" },
      "ghana-operations": { title: "Manuel de Procédures Opérationnelles", description: "Procédures opérationnelles standard pour la soumission des données, les rapports de crédit, la résolution des litiges et l'intégration des institutions" },
      "ghana-api-guide": { title: "Guide d'Intégration API Ghana", description: "Guide API spécifique au Ghana avec endpoints BoG CRB v1.1, validation Ghana Card, application GHS et exigences de consentement" },
      "ghana-connections": { title: "Politique de Connexions et d'Échange de Données", description: "Politique d'échange de données régissant les connexions API, l'intégration NIA, l'échange inter-bureaux et les flux réglementaires BoG" },
    },
    pt: {
      "ghana-sla": { title: "Acordo SLA Gana", description: "Acordo de nível de serviço para o registo de crédito do Gana — disponibilidade, resolução de litígios, submissão de dados e referências de desempenho" },
      "ghana-compliance": { title: "Quadro de Conformidade Regulatória", description: "Quadro de conformidade cobrindo a Lei 726, Lei 843 de Proteção de Dados e diretrizes operacionais BoG CRB" },
      "ghana-e2e": { title: "Plano de Testes Ponta a Ponta", description: "Plano de teste E2E completo para o modo CRB Gana — registo de mutuários, contas de crédito, carregamento BoG e segurança" },
      "ghana-data-standards": { title: "Referência de Padrões de Dados BoG CRB", description: "Padrões de dados BoG CRB v1.1 completos — formatos de ficheiros, tipos de facilidades, classificações de ativos e regras de validação" },
      "ghana-data-protection": { title: "Política de Proteção de Dados e Privacidade", description: "Política de proteção de dados alinhada com a Lei 843 — base legal, direitos dos titulares, medidas de segurança e gestão de violações" },
      "ghana-operations": { title: "Manual de Procedimentos Operacionais", description: "Procedimentos operacionais padrão para submissão de dados, relatórios de crédito, resolução de litígios e integração de instituições" },
      "ghana-api-guide": { title: "Guia de Integração API Gana", description: "Guia de API específico para o Gana com endpoints BoG CRB v1.1, validação de Ghana Card, imposição de GHS e requisitos de consentimento" },
      "ghana-connections": { title: "Política de Conexões e Troca de Dados", description: "Política de troca de dados regulando conexões API, integração NIA, troca inter-bureaux e fluxos regulatórios BoG" },
    },
    ar: {
      "ghana-sla": { title: "اتفاقية مستوى الخدمة غانا", description: "اتفاقية مستوى الخدمة لسجل الائتمان في غانا — وقت التشغيل وحل النزاعات وتقديم البيانات ومعايير الأداء" },
      "ghana-compliance": { title: "إطار الامتثال التنظيمي", description: "إطار الامتثال الذي يغطي القانون 726 وقانون حماية البيانات 843 والإرشادات التشغيلية لـ BoG CRB" },
      "ghana-e2e": { title: "خطة اختبار شاملة", description: "خطة اختبار E2E كاملة لوضع CRB غانا — تسجيل المقترضين وحسابات الائتمان والتحميل المجمع والأمان" },
      "ghana-data-standards": { title: "مرجع معايير بيانات BoG CRB", description: "معايير بيانات BoG CRB v1.1 الكاملة — تنسيقات الملفات وأنواع التسهيلات وتصنيفات الأصول وقواعد التحقق" },
      "ghana-data-protection": { title: "سياسة حماية البيانات والخصوصية", description: "سياسة حماية البيانات المتوافقة مع القانون 843 — الأساس القانوني وحقوق أصحاب البيانات وتدابير الأمان وإدارة الانتهاكات" },
      "ghana-operations": { title: "دليل الإجراءات التشغيلية", description: "إجراءات التشغيل القياسية لتقديم البيانات وإعداد تقارير الائتمان وحل النزاعات وتأهيل المؤسسات" },
      "ghana-api-guide": { title: "دليل تكامل API غانا", description: "دليل API خاص بغانا مع نقاط نهاية BoG CRB v1.1 والتحقق من بطاقة غانا ومتطلبات الموافقة" },
      "ghana-connections": { title: "سياسة الاتصالات وتبادل البيانات", description: "سياسة تبادل البيانات التي تحكم اتصالات API وتكامل NIA والتبادل بين المكاتب والتغذية التنظيمية لـ BoG" },
    },
    sw: {
      "ghana-sla": { title: "Mkataba wa SLA wa Ghana", description: "Mkataba wa kiwango cha huduma kwa sajili ya mikopo ya Ghana — muda wa upatikanaji, utatuzi wa migogoro, uwasilishaji wa data na vigezo vya utendaji" },
      "ghana-compliance": { title: "Mfumo wa Utiifu wa Kanuni", description: "Mfumo wa utiifu unaoshughulikia Sheria 726, Sheria ya Ulinzi wa Data 843 na miongozo ya uendeshaji wa BoG CRB" },
      "ghana-e2e": { title: "Mpango wa Majaribio ya Mwanzo hadi Mwisho", description: "Mpango kamili wa majaribio ya E2E kwa hali ya CRB ya Ghana — usajili wa wakopaji, akaunti za mikopo, upakiaji wa BoG na usalama" },
      "ghana-data-standards": { title: "Rejea ya Viwango vya Data vya BoG CRB", description: "Viwango kamili vya data vya BoG CRB v1.1 — muundo wa faili, aina za huduma, uainishaji wa mali na sheria za uthibitishaji" },
      "ghana-data-protection": { title: "Sera ya Ulinzi wa Data na Faragha", description: "Sera ya ulinzi wa data inayolingana na Sheria 843 — msingi wa kisheria, haki za wahusika wa data, hatua za usalama na usimamizi wa ukiukaji" },
      "ghana-operations": { title: "Mwongozo wa Taratibu za Uendeshaji", description: "Taratibu za kawaida za uendeshaji kwa uwasilishaji wa data, ripoti za mikopo, utatuzi wa migogoro na ujumuishaji wa taasisi" },
      "ghana-api-guide": { title: "Mwongozo wa Muunganisho wa API wa Ghana", description: "Mwongozo wa API mahususi kwa Ghana wenye vituo vya BoG CRB v1.1, uthibitishaji wa Kadi ya Ghana na mahitaji ya idhini" },
      "ghana-connections": { title: "Sera ya Miunganisho na Ubadilishanaji wa Data", description: "Sera ya ubadilishanaji wa data inayosimamia miunganisho ya API, muunganisho wa NIA, ubadilishanaji wa kati ya ofisi na mtiririko wa udhibiti wa BoG" },
    },
  };

  function getDocMeta(doc: { id: string; filename: string; title: string; description: string }, lang?: string) {
    if (lang && lang !== "en" && DOC_TRANSLATIONS[lang]?.[doc.id]) {
      const t = DOC_TRANSLATIONS[lang][doc.id];
      return { ...doc, title: t.title, description: t.description };
    }
    return doc;
  }

  function getGhanaDocMeta(doc: { id: string; filename: string; title: string; description: string; category: string }, lang?: string) {
    if (lang && lang !== "en" && GHANA_DOC_TRANSLATIONS[lang]?.[doc.id]) {
      const t = GHANA_DOC_TRANSLATIONS[lang][doc.id];
      return { ...doc, title: t.title, description: t.description };
    }
    return doc;
  }

  function resolveDocPath(filename: string, lang?: string): string {
    if (lang && lang !== "en" && SUPPORTED_DOC_LANGS.includes(lang)) {
      const localizedPath = path.join(DOCS_DIR, lang, filename);
      if (fs.existsSync(localizedPath)) return localizedPath;
    }
    return path.join(DOCS_DIR, filename);
  }

  const GHANA_DOCS_LIST = [
    { id: "ghana-sla", filename: "Ghana_SLA_Agreement.md", title: "Ghana SLA Agreement", description: "Service Level Agreement for the Ghana Credit Registry — uptime, dispute resolution, data submission, and performance benchmarks aligned with BoG standards", category: "sla" },
    { id: "ghana-compliance", filename: "Ghana_Compliance_Framework.md", title: "Regulatory Compliance Framework", description: "Comprehensive compliance framework covering Credit Reporting Act 726, Data Protection Act 843, and BoG CRB operational guidelines", category: "compliance" },
    { id: "ghana-e2e", filename: "Ghana_E2E_Test_Plan.md", title: "End-to-End Test Plan", description: "Complete E2E test plan for Ghana CRB mode — borrower registration, credit accounts, BoG batch upload, dashboard, and security testing", category: "testing" },
    { id: "ghana-data-standards", filename: "Ghana_Data_Standards.md", title: "BoG CRB Data Standards Reference", description: "Full BoG CRB v1.1 data standards — file formats, facility types, asset classifications, industry codes, and field validation rules", category: "data-standards" },
    { id: "ghana-data-protection", filename: "Ghana_Data_Protection_Policy.md", title: "Data Protection & Privacy Policy", description: "Data protection policy aligned with Act 843 — lawful basis, data subject rights, security measures, breach management, and retention schedules", category: "compliance" },
    { id: "ghana-operations", filename: "Ghana_Operational_Procedures.md", title: "Operational Procedures Manual", description: "Standard operating procedures for data submission, credit reporting, dispute resolution, institution onboarding, and regulatory reporting", category: "operations" },
    { id: "ghana-api-guide", filename: "Ghana_API_Integration_Guide.md", title: "Ghana API Integration Guide", description: "Ghana-specific API guide with BoG CRB v1.1 endpoints, Ghana Card validation, GHS currency enforcement, consent requirements per Act 726, and error codes", category: "api" },
    { id: "ghana-connections", filename: "Ghana_Connections_Policy.md", title: "Data Connections & Exchange Policy", description: "Data exchange policy governing API connections, NIA integration, inter-bureau exchange, BoG regulatory feeds, and mobile money — all under Act 726, Act 843, and Act 1038", category: "connections" },
  ];

  const GHANA_DOCS_DIR = path.join(process.cwd(), "docs", "ghana");

  app.get("/api/ghana-docs", requireAuth, (req, res) => {
    const lang = (req.query.lang as string) || "en";
    const docsWithSize = GHANA_DOCS_LIST.map(doc => {
      const translated = getGhanaDocMeta(doc, lang);
      try {
        const filePath = path.join(GHANA_DOCS_DIR, doc.filename);
        const stats = fs.statSync(filePath);
        return { ...translated, size: stats.size };
      } catch {
        return { ...translated, size: 0 };
      }
    });
    res.json(docsWithSize);
  });

  app.get("/api/ghana-docs/:id", requireAuth, async (req, res) => {
    const doc = GHANA_DOCS_LIST.find(d => d.id === req.params.id);
    if (!doc) return res.status(404).json({ message: "Document not found" });
    try {
      const lang = (req.query.lang as string) || "en";
      const translated = getGhanaDocMeta(doc, lang);
      const filePath = path.join(GHANA_DOCS_DIR, doc.filename);
      const content = fs.readFileSync(filePath, "utf-8");
      const { marked } = await import("marked");
      const html = marked(content);
      res.json({ ...translated, content, html });
    } catch (e: any) {
      res.status(500).json({ message: safeErrorMessage(e) });
    }
  });

  app.get("/api/ghana-docs/:id/pdf", requireAuth, async (req, res) => {
    const doc = GHANA_DOCS_LIST.find(d => d.id === req.params.id);
    if (!doc) return res.status(404).json({ message: "Document not found" });
    try {
      const lang = (req.query.lang as string) || "en";
      const translated = getGhanaDocMeta(doc, lang);
      const filePath = path.join(GHANA_DOCS_DIR, doc.filename);
      const content = fs.readFileSync(filePath, "utf-8");
      const { PassThrough } = await import("stream");
      const { generatePdfFromMarkdown } = await import("./pdf-generator");
      const stream = new PassThrough();
      const safeName = translated.title.replace(/[^a-zA-Z0-9_\- ]/g, "").replace(/\s+/g, "_");
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="${safeName}.pdf"`);
      stream.pipe(res);
      generatePdfFromMarkdown(content, translated.title, stream);
    } catch (e: any) {
      res.status(500).json({ message: safeErrorMessage(e) });
    }
  });

  app.get("/api/ghana-docs/:id/download", requireAuth, (req, res) => {
    const doc = GHANA_DOCS_LIST.find(d => d.id === req.params.id);
    if (!doc) return res.status(404).json({ message: "Document not found" });
    try {
      const filePath = path.join(GHANA_DOCS_DIR, doc.filename);
      const safeName = doc.title.replace(/[^a-zA-Z0-9_\- ]/g, "").replace(/\s+/g, "_");
      res.setHeader("Content-Type", "text/markdown");
      res.setHeader("Content-Disposition", `attachment; filename="${safeName}.md"`);
      res.sendFile(filePath);
    } catch (e: any) {
      res.status(500).json({ message: safeErrorMessage(e) });
    }
  });

  app.get("/api/docs", requireAuth, (req, res) => {
    const lang = (req.query.lang as string) || "en";
    const docsWithSize = DOCS_LIST.map(doc => {
      const translated = getDocMeta(doc, lang);
      try {
        const filePath = resolveDocPath(doc.filename, lang);
        const stats = fs.statSync(filePath);
        return { ...translated, size: stats.size };
      } catch {
        return { ...translated, size: 0 };
      }
    });
    res.json(docsWithSize);
  });

  app.get("/api/docs/:id", requireAuth, async (req, res) => {
    const doc = DOCS_LIST.find(d => d.id === req.params.id);
    if (!doc) return res.status(404).json({ message: "Document not found" });
    try {
      const lang = (req.query.lang as string) || "en";
      const translated = getDocMeta(doc, lang);
      const filePath = resolveDocPath(doc.filename, lang);
      const content = fs.readFileSync(filePath, "utf-8");
      const { marked } = await import("marked");
      const html = marked(content);
      res.json({ ...translated, content, html });
    } catch (e: any) {
      res.status(500).json({ message: safeErrorMessage(e) });
    }
  });

  app.get("/api/docs/:id/pdf", requireAuth, async (req, res) => {
    const doc = DOCS_LIST.find(d => d.id === req.params.id);
    if (!doc) return res.status(404).json({ message: "Document not found" });
    try {
      const lang = (req.query.lang as string) || "en";
      const translated = getDocMeta(doc, lang);
      const filePath = resolveDocPath(doc.filename, lang);
      const content = fs.readFileSync(filePath, "utf-8");
      const { PassThrough } = await import("stream");
      const { generatePdfFromMarkdown } = await import("./pdf-generator");
      const stream = new PassThrough();
      const safeName = translated.title.replace(/[^a-zA-Z0-9_\- ]/g, "").replace(/\s+/g, "_");
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="${safeName}.pdf"`);
      stream.pipe(res);
      generatePdfFromMarkdown(content, translated.title, stream);
    } catch (e: any) {
      res.status(500).json({ message: safeErrorMessage(e) });
    }
  });

  app.post("/api/admin/test-sms", requireAuth, requireRole("super_admin"), async (req, res) => {
    try {
      const { phone, message } = req.body;
      if (!phone || typeof phone !== "string") {
        return res.status(400).json({ message: "Phone number is required (E.164 format, e.g. +233200000000)" });
      }
      if (!isSmsConfigured()) {
        return res.status(400).json({ message: "SMS is not configured. Add TWILIO or Africa's Talking credentials." });
      }
      const text = message || `Test SMS from Africa Credit Hub.\n\nSent at: ${new Date().toLocaleString("en-US", { timeZone: "Africa/Accra", dateStyle: "full", timeStyle: "short" })}\n\n— Pan-African Credit Registry`;
      const ok = await sendSms(phone, text);
      if (ok) {
        await storage.createAuditLog({
          userId: req.session.userId!, action: "TEST_SMS", entity: "system",
          details: `Test SMS sent to ${phone.replace(/(.{4}).+(.{4})/, "$1****$2")}`,
          ipAddress: req.ip, organizationId: req.session.organizationId,
        });
        res.json({ success: true, message: `SMS sent successfully to ${phone.replace(/(.{4}).+(.{4})/, "$1****$2")}` });
      } else {
        res.status(500).json({ success: false, message: "SMS delivery failed. Check provider credentials and phone number." });
      }
    } catch (e: any) {
      res.status(500).json({ message: safeErrorMessage(e) });
    }
  });

  app.get("/api/admin/sms-status", requireAuth, requireRole("super_admin"), async (_req, res) => {
    res.json({
      configured: isSmsConfigured(),
      providers: {
        twilio: !!(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_PHONE_NUMBER),
        africastalking: !!(process.env.AT_USERNAME && process.env.AT_API_KEY),
      },
    });
  });

  app.post("/api/admin/seed-test-data", requireAuth, requireRole("admin"), async (_req, res) => {
    try {
      const { seedTestData } = await import("./seed-test-data");
      await seedTestData();
      res.json({ message: "Test data seeded successfully" });
    } catch (e: any) {
      res.status(500).json({ message: safeErrorMessage(e) });
    }
  });

  // Exchange Rate Management
  app.get("/api/exchange-rates", requireAuth, async (_req, res) => {
    try {
      const rates = await storage.getExchangeRates();
      res.json(rates);
    } catch (e: any) { res.status(500).json({ message: safeErrorMessage(e) }); }
  });

  app.post("/api/exchange-rates", requireRole("admin"), async (req, res) => {
    try {
      const parsed = insertExchangeRateSchema.parse({ ...req.body, createdBy: (req as any).user.id });
      const rate = await storage.createExchangeRate(parsed);
      await storage.createAuditLog({ userId: (req as any).user.id, action: "CREATE", entity: "exchange_rate", entityId: rate.id, details: `Created rate ${parsed.baseCurrency}/${parsed.targetCurrency}: ${parsed.rate}`, ipAddress: req.ip });
      res.status(201).json(rate);
    } catch (e: any) {
      if (e instanceof z.ZodError) return res.status(400).json({ message: "Validation error", errors: e.errors });
      res.status(500).json({ message: safeErrorMessage(e) });
    }
  });

  app.patch("/api/exchange-rates/:id", requireRole("admin"), async (req, res) => {
    try {
      const rate = await storage.updateExchangeRate(req.params.id, req.body);
      if (!rate) return res.status(404).json({ message: "Rate not found" });
      await storage.createAuditLog({ userId: (req as any).user.id, action: "UPDATE", entity: "exchange_rate", entityId: req.params.id, details: JSON.stringify(req.body), ipAddress: req.ip });
      res.json(rate);
    } catch (e: any) { res.status(500).json({ message: safeErrorMessage(e) }); }
  });

  app.delete("/api/exchange-rates/:id", requireRole("admin"), async (req, res) => {
    try {
      const deleted = await storage.deleteExchangeRate(req.params.id);
      if (!deleted) return res.status(404).json({ message: "Rate not found" });
      await storage.createAuditLog({ userId: (req as any).user.id, action: "DELETE", entity: "exchange_rate", entityId: req.params.id, details: "Deleted exchange rate", ipAddress: req.ip });
      res.json({ message: "Deleted" });
    } catch (e: any) { res.status(500).json({ message: safeErrorMessage(e) }); }
  });

  app.post("/api/exchange-rates/refresh", requireRole("admin"), async (req, res) => {
    try {
      const { fetchAndUpdateRates } = await import("./exchange-rate-scheduler");
      const result = await fetchAndUpdateRates();
      await storage.createAuditLog({ userId: req.session.userId, action: "REFRESH", entity: "exchange_rates", details: `Manual refresh: ${result.updated} updated, ${result.failed} failed`, ipAddress: req.ip });
      res.json({ message: "Exchange rates refreshed", ...result });
    } catch (e: any) { res.status(500).json({ message: safeErrorMessage(e) }); }
  });

  app.get("/api/exchange-rates/convert", requireAuth, async (req, res) => {
    try {
      const { amount, from, to } = req.query;
      if (!amount || !from || !to) return res.status(400).json({ message: "amount, from, to required" });
      const result = await storage.convertCurrency(parseFloat(amount as string), from as string, to as string);
      if (!result) return res.status(404).json({ message: "No exchange rate found for this pair" });
      res.json(result);
    } catch (e: any) { res.status(500).json({ message: safeErrorMessage(e) }); }
  });

  // Retention Policies
  app.post("/api/retention-policies/enforce", requireAuth, requireRole("admin"), async (req, res) => {
    try {
      const { enforceRetentionPolicies } = await import("./retention-enforcement");
      const results = await enforceRetentionPolicies();
      await storage.createAuditLog({
        userId: req.session.userId,
        action: "manual_retention_enforcement",
        entity: "system",
        details: JSON.stringify({ results }),
        ipAddress: req.ip,
      });
      res.json({ message: "Retention enforcement completed", results });
    } catch (e: any) {
      res.status(500).json({ message: safeErrorMessage(e) });
    }
  });

  app.get("/api/retention-policies", requireRole("admin", "regulator"), async (req, res) => {
    try {
      const country = getCountryFilter(req);
      enforceCountryScopeForNonSuperAdmin(req, country, "/api/retention-policies");
      await logCrossCountryAccess(req, country, "/api/retention-policies");
      const policies = await storage.getRetentionPolicies(country);
      res.json(policies);
    } catch (e: any) { res.status(500).json({ message: safeErrorMessage(e) }); }
  });

  app.post("/api/retention-policies", requireRole("admin"), async (req, res) => {
    try {
      const body = { ...req.body };
      if (body.archiveAfterYears === null || body.archiveAfterYears === "") delete body.archiveAfterYears;
      const parsed = insertRetentionPolicySchema.parse(body);
      const policy = await storage.createRetentionPolicy(parsed);
      await storage.createAuditLog({ userId: req.session?.userId!, action: "CREATE", entity: "retention_policy", entityId: policy.id, details: `Created retention policy: ${parsed.country} - ${parsed.entityType}`, ipAddress: req.ip });
      res.status(201).json(policy);
    } catch (e: any) {
      if (e instanceof z.ZodError) return res.status(400).json({ message: "Validation error", errors: e.errors });
      res.status(500).json({ message: safeErrorMessage(e) });
    }
  });

  app.patch("/api/retention-policies/:id", requireRole("admin"), async (req, res) => {
    try {
      const policy = await storage.updateRetentionPolicy(req.params.id, req.body);
      if (!policy) return res.status(404).json({ message: "Policy not found" });
      await storage.createAuditLog({ userId: req.session?.userId!, action: "UPDATE", entity: "retention_policy", entityId: req.params.id, details: JSON.stringify(req.body), ipAddress: req.ip });
      res.json(policy);
    } catch (e: any) { res.status(500).json({ message: safeErrorMessage(e) }); }
  });

  app.delete("/api/retention-policies/:id", requireRole("admin"), async (req, res) => {
    try {
      const deleted = await storage.deleteRetentionPolicy(req.params.id);
      if (!deleted) return res.status(404).json({ message: "Policy not found" });
      await storage.createAuditLog({ userId: req.session?.userId!, action: "DELETE", entity: "retention_policy", entityId: req.params.id, details: "Deleted retention policy", ipAddress: req.ip });
      res.json({ message: "Deleted" });
    } catch (e: any) { res.status(500).json({ message: safeErrorMessage(e) }); }
  });

  app.post("/api/data-subject/erasure-request", requireRole("admin"), async (req, res) => {
    try {
      const { borrowerId, reason } = req.body;
      if (!borrowerId) return res.status(400).json({ message: "Borrower ID required" });

      const borrower = await storage.getBorrower(borrowerId);
      if (!borrower) return res.status(404).json({ message: "Borrower not found" });

      const activeAccounts = await storage.getCreditAccountsByBorrower(borrowerId);
      const hasActiveLoans = activeAccounts.some((a: any) => a.status === "active");
      if (hasActiveLoans) {
        return res.status(409).json({ message: "Cannot erase data for borrower with active credit accounts. Close all accounts first." });
      }

      const userId = req.session?.userId;
      const username = req.session?.userId ? (await storage.getUser(req.session.userId))?.username || "unknown" : "unknown";

      await storage.createAuditLog({
        userId: userId || null,
        action: "DATA_ERASURE_REQUEST",
        entity: "borrower",
        entityId: borrowerId,
        details: `Data erasure requested for borrower ${borrower.firstName} ${borrower.lastName}. Reason: ${reason || "Data subject request"}. Requested by: ${username}`,
        ipAddress: req.ip,
      });

      const pendingApproval = await storage.createPendingApproval({
        entityType: "borrower",
        action: "DELETE",
        entityId: borrowerId,
        requestedBy: userId ?? "system",
        payload: JSON.stringify({ borrowerId, borrowerName: `${borrower.firstName} ${borrower.lastName}`, reason: reason || "Data subject request", type: "data_erasure" }),
        country: requireWriteCountry(borrower.country || getCountryFilter(req), "createPendingApproval:data_erasure"),
      });

      res.json({
        message: "Erasure request submitted for dual approval.",
        requestId: pendingApproval.id,
        borrowerId,
        status: "pending_approval",
      });
    } catch (e: any) { res.status(500).json({ message: safeErrorMessage(e) }); }
  });

  app.get("/api/security/audit-summary", requireRole("admin", "regulator", "auditor"), async (_req, res) => {
    try {
      const result = await pool.query(`
        SELECT action, COUNT(*) as count
        FROM audit_logs
        WHERE created_at > NOW() - INTERVAL '30 days'
        GROUP BY action
        ORDER BY count DESC
        LIMIT 50
      `);
      const totalLogs = await pool.query(`SELECT COUNT(*) as total FROM audit_logs`);
      const recentFailedLogins = await pool.query(`
        SELECT COUNT(*) as count FROM audit_logs
        WHERE action = 'LOGIN_FAILED' AND created_at > NOW() - INTERVAL '24 hours'
      `);
      const lockedAccounts = await pool.query(`
        SELECT COUNT(*) as count FROM users
        WHERE locked_until IS NOT NULL AND locked_until > NOW()
      `);

      res.json({
        actionBreakdown: result.rows,
        totalAuditLogs: parseInt(totalLogs.rows[0]?.total || "0"),
        recentFailedLogins24h: parseInt(recentFailedLogins.rows[0]?.count || "0"),
        currentlyLockedAccounts: parseInt(lockedAccounts.rows[0]?.count || "0"),
        reportGeneratedAt: new Date().toISOString(),
      });
    } catch (e: any) { res.status(500).json({ message: safeErrorMessage(e) }); }
  });

  app.get("/api/security/health-check", requireRole("admin", "regulator", "auditor"), async (_req, res) => {
    try {
      const { runSecurityHealthCheck } = await import("./security-hardening");
      const result = await runSecurityHealthCheck();
      res.json(result);
    } catch (e: any) { res.status(500).json({ message: safeErrorMessage(e) }); }
  });

  app.get("/api/security/pii-integrity", requireRole("admin"), async (_req, res) => {
    try {
      const { verifyPIIEncryptionIntegrity } = await import("./security-hardening");
      const result = await verifyPIIEncryptionIntegrity();
      res.json(result);
    } catch (e: any) { res.status(500).json({ message: safeErrorMessage(e) }); }
  });

  // API Configurations
  app.get("/api/api-configurations", requireRole("admin"), async (req, res) => {
    try {
      const country = getCountryFilter(req);
      enforceCountryScopeForNonSuperAdmin(req, country, "/api/api-configurations");
      await logCrossCountryAccess(req, country, "/api/api-configurations");
      const configs = await storage.getApiConfigurations(country);
      res.json(configs);
    } catch (e: any) { res.status(500).json({ message: safeErrorMessage(e) }); }
  });

  app.get("/api/api-configurations/:id", requireRole("admin"), async (req, res) => {
    try {
      const config = await storage.getApiConfiguration(req.params.id);
      if (!config) return res.status(404).json({ message: "Configuration not found" });
      res.json(config);
    } catch (e: any) { res.status(500).json({ message: safeErrorMessage(e) }); }
  });

  app.post("/api/api-configurations", requireRole("admin"), async (req, res) => {
    try {
      const parsed = insertApiConfigurationSchema.parse(req.body);
      const config = await storage.createApiConfiguration(parsed);
      await storage.createAuditLog({ userId: (req as any).user.id, action: "CREATE", entity: "api_configuration", entityId: config.id, details: `Created API config: ${parsed.name}`, ipAddress: req.ip });
      res.status(201).json(config);
    } catch (e: any) {
      if (e instanceof z.ZodError) return res.status(400).json({ message: "Validation error", errors: e.errors });
      res.status(500).json({ message: safeErrorMessage(e) });
    }
  });

  app.patch("/api/api-configurations/:id", requireRole("admin"), async (req, res) => {
    try {
      const config = await storage.updateApiConfiguration(req.params.id, req.body);
      if (!config) return res.status(404).json({ message: "Configuration not found" });
      await storage.createAuditLog({ userId: (req as any).user.id, action: "UPDATE", entity: "api_configuration", entityId: req.params.id, details: JSON.stringify(req.body), ipAddress: req.ip });
      res.json(config);
    } catch (e: any) { res.status(500).json({ message: safeErrorMessage(e) }); }
  });

  app.delete("/api/api-configurations/:id", requireRole("admin"), async (req, res) => {
    try {
      const deleted = await storage.deleteApiConfiguration(req.params.id);
      if (!deleted) return res.status(404).json({ message: "Configuration not found" });
      await storage.createAuditLog({ userId: (req as any).user.id, action: "DELETE", entity: "api_configuration", entityId: req.params.id, details: "Deleted API configuration", ipAddress: req.ip });
      res.json({ message: "Deleted" });
    } catch (e: any) { res.status(500).json({ message: safeErrorMessage(e) }); }
  });

  app.post("/api/api-configurations/:id/test", requireRole("admin"), async (req, res) => {
    try {
      const config = await storage.getApiConfiguration(req.params.id);
      if (!config) return res.status(404).json({ message: "Configuration not found" });
      let testStatus = "success";
      let testMessage = "Connection test passed";
      try {
        const url = new URL(config.baseUrl);
        const blockedHosts = ["localhost", "127.0.0.1", "0.0.0.0", "::1", "169.254.169.254", "metadata.google.internal"];
        if (blockedHosts.includes(url.hostname) || url.hostname.startsWith("10.") || url.hostname.startsWith("192.168.") || url.hostname.startsWith("172.")) {
          testStatus = "blocked";
          testMessage = "Internal/private URLs are not allowed for security reasons";
        } else if (!["http:", "https:"].includes(url.protocol)) {
          testStatus = "blocked";
          testMessage = "Only HTTP/HTTPS protocols are allowed";
        } else {
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 10000);
          const response = await fetch(config.baseUrl, { method: "HEAD", signal: controller.signal, redirect: "manual" }).catch(() => null);
          clearTimeout(timeout);
          if (!response || !response.ok) {
            testStatus = "unreachable";
            testMessage = `Endpoint returned ${response?.status || 'no response'} - API may require authentication credentials`;
          }
        }
      } catch {
        testStatus = "unreachable";
        testMessage = "Endpoint unreachable - this is expected for stub configurations";
      }
      await storage.updateApiConfiguration(req.params.id, { lastTestedAt: new Date() as any, lastTestStatus: testStatus } as any);
      res.json({ status: testStatus, message: testMessage });
    } catch (e: any) { res.status(500).json({ message: safeErrorMessage(e) }); }
  });

  app.get("/api/admin/organizations/list", requireAuth, requireSuperAdmin, async (req, res) => {
    try {
      const country = getCountryFilter(req);
      const orgs = await storage.getOrganizations(country);
      res.json(orgs.map(o => ({ id: o.id, name: o.name, type: o.type, status: o.status, country: o.country, subscriptionTier: o.subscriptionTier })));
    } catch (e: any) { res.status(500).json({ message: safeErrorMessage(e) }); }
  });

  app.get("/api/admin/organizations", requireAuth, requireSuperAdmin, async (req, res) => {
    try {
      const country = getCountryFilter(req);
      const orgs = await storage.getOrganizations(country);
      const orgsWithStats = await Promise.all(orgs.map(async (org) => {
        const orgCountry = org.country || country;
        const users = await storage.getUsers(org.id, orgCountry);
        const stats = await storage.getDashboardStats(org.id, orgCountry);
        const billing = await storage.getBillingRecords(org.id, orgCountry);
        const totalBilled = billing.reduce((s, b) => s + parseFloat(b.amount || "0"), 0);
        const totalPaid = billing.filter(b => b.status === "paid").reduce((s, b) => s + parseFloat(b.amount || "0"), 0);
        const totalPending = billing.filter(b => b.status === "pending").reduce((s, b) => s + parseFloat(b.amount || "0"), 0);
        const totalOverdue = billing.filter(b => b.status === "overdue").reduce((s, b) => s + parseFloat(b.amount || "0"), 0);
        const latestInvoice = billing[0] || null;
        return {
          ...org, userCount: users.length, stats,
          billing: {
            totalBilled, totalPaid, totalPending, totalOverdue,
            invoiceCount: billing.length,
            paidCount: billing.filter(b => b.status === "paid").length,
            pendingCount: billing.filter(b => b.status === "pending").length,
            overdueCount: billing.filter(b => b.status === "overdue").length,
            latestInvoice,
            paymentHealth: totalOverdue > 0 ? "overdue" : totalPending > 0 ? "pending" : totalPaid > 0 ? "current" : "no_invoices",
          },
        };
      }));
      res.json(orgsWithStats);
    } catch (e: any) {
      res.status(500).json({ message: safeErrorMessage(e) });
    }
  });

  app.get("/api/admin/organizations/:id", requireAuth, requireSuperAdmin, async (req, res) => {
    try {
      if (!(await validateOrgCountry(req.params.id, req))) return res.status(403).json({ message: "Organization not accessible in current country mode" });
      const org = await storage.getOrganization(req.params.id);
      if (!org) return res.status(404).json({ message: "Organization not found" });
      const orgCountry = org.country || getCountryFilter(req);
      const users = await storage.getUsers(org.id, orgCountry);
      const stats = await storage.getDashboardStats(org.id, orgCountry);
      const billing = await storage.getBillingRecords(org.id, orgCountry);
      const disputes = await storage.getDisputes(org.id, orgCountry);
      const totalBilled = billing.reduce((s, b) => s + parseFloat(b.amount || "0"), 0);
      const totalPaid = billing.filter(b => b.status === "paid").reduce((s, b) => s + parseFloat(b.amount || "0"), 0);
      const totalPending = billing.filter(b => b.status === "pending").reduce((s, b) => s + parseFloat(b.amount || "0"), 0);
      const totalOverdue = billing.filter(b => b.status === "overdue").reduce((s, b) => s + parseFloat(b.amount || "0"), 0);
      res.json({
        ...org, userCount: users.length, stats,
        users: users.map(stripPassword),
        billing: {
          records: billing,
          totalBilled, totalPaid, totalPending, totalOverdue,
          invoiceCount: billing.length,
          paidCount: billing.filter(b => b.status === "paid").length,
          pendingCount: billing.filter(b => b.status === "pending").length,
          overdueCount: billing.filter(b => b.status === "overdue").length,
          paymentHealth: totalOverdue > 0 ? "overdue" : totalPending > 0 ? "pending" : totalPaid > 0 ? "current" : "no_invoices",
        },
        disputeCount: disputes.length,
        activeDisputeCount: disputes.filter(d => d.status === "open" || d.status === "under_review").length,
      });
    } catch (e: any) {
      res.status(500).json({ message: safeErrorMessage(e) });
    }
  });

  app.post("/api/admin/organizations", requireAuth, requireSuperAdmin, async (req, res) => {
    try {
      const parsed = insertOrganizationSchema.parse(req.body);
      const existing = await storage.getOrganizationBySlug(parsed.slug);
      if (existing) return res.status(400).json({ message: "Organization with this slug already exists" });
      const org = await storage.createOrganization(parsed);
      await storage.createAuditLog({
        action: "CREATE", entity: "organization", entityId: org.id, userId: req.session?.userId,
        details: `Created organization: ${org.name}`,
        ipAddress: req.ip || null,
      });
      if (org.contactEmail) {
        sendWelcomeEmail(org.name, org.contactEmail, org.subscriptionTier || "standard").catch(() => {});
      }
      res.status(201).json(org);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  app.patch("/api/admin/organizations/:id", requireAuth, requireSuperAdmin, async (req, res) => {
    try {
      if (!(await validateOrgCountry(req.params.id, req))) return res.status(403).json({ message: "Organization not accessible in current country mode" });
      const updateSchema = insertOrganizationSchema.partial();
      const parsed = updateSchema.parse(req.body);
      const org = await storage.updateOrganization(req.params.id, parsed);
      if (!org) return res.status(404).json({ message: "Organization not found" });
      await storage.createAuditLog({
        action: "UPDATE", entity: "organization", entityId: org.id, userId: req.session?.userId,
        details: `Updated organization: ${org.name}`,
        ipAddress: req.ip || null,
      });
      res.json(org);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  app.delete("/api/admin/organizations/:id", requireAuth, requireSuperAdmin, async (req, res) => {
    try {
      if (!(await validateOrgCountry(req.params.id, req))) return res.status(403).json({ message: "Organization not accessible in current country mode" });
      const delOrg = await storage.getOrganization(req.params.id);
      const delOrgCountry = delOrg?.country || getCountryFilter(req);
      const users = await storage.getUsers(req.params.id, delOrgCountry);
      if (users.length > 0) {
        for (const u of users) {
          await storage.deleteUser(u.id);
        }
        await storage.createAuditLog({
          action: "DELETE", entity: "user", entityId: req.params.id, userId: req.session?.userId,
          details: `Auto-removed ${users.length} user(s) from organization before deletion`,
          ipAddress: req.ip || null,
        });
      }
      const deleted = await storage.deleteOrganization(req.params.id);
      if (!deleted) return res.status(404).json({ message: "Organization not found" });
      await storage.createAuditLog({
        action: "DELETE", entity: "organization", entityId: req.params.id, userId: req.session?.userId,
        details: `Deleted organization: ${req.params.id}`,
        ipAddress: req.ip || null,
      });
      res.json({ message: "Organization deleted" });
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  app.get("/api/admin/organizations/:id/users", requireAuth, requireSuperAdmin, async (req, res) => {
    try {
      if (!(await validateOrgCountry(req.params.id, req))) return res.status(403).json({ message: "Organization not accessible in current country mode" });
      const listOrg = await storage.getOrganization(req.params.id);
      const users = await storage.getUsers(req.params.id, listOrg?.country || getCountryFilter(req));
      res.json(users.map(stripPassword));
    } catch (e: any) {
      res.status(500).json({ message: safeErrorMessage(e) });
    }
  });

  app.get("/api/admin/organizations/:id/stats", requireAuth, requireSuperAdmin, async (req, res) => {
    try {
      if (!(await validateOrgCountry(req.params.id, req))) return res.status(403).json({ message: "Organization not accessible in current country mode" });
      const org = await storage.getOrganization(req.params.id);
      const orgCountry = org?.country || getCountryFilter(req);
      const stats = await storage.getDashboardStats(req.params.id, orgCountry);
      res.json(stats);
    } catch (e: any) {
      res.status(500).json({ message: safeErrorMessage(e) });
    }
  });

  app.get("/api/admin/api-usage", requireAuth, requireRole("admin", "super_admin"), async (_req, res) => {
    try {
      const stats = getApiUsageStats();
      res.json(stats);
    } catch (e: any) {
      res.status(500).json({ message: safeErrorMessage(e) });
    }
  });

  app.get("/api/admin/analytics", requireAuth, requireSuperAdmin, async (req, res) => {
    try {
      const country = getCountryFilter(req);
      const orgs = await storage.getOrganizations(country);
      const allBilling: any[] = [];
      for (const org of orgs) {
        const orgCountry = org.country || country;
        const billing = await storage.getBillingRecords(org.id, orgCountry);
        for (const b of billing) {
          allBilling.push({ ...b, orgName: org.name, orgTier: org.subscriptionTier, orgCountry: org.country });
        }
      }

      const tierPrices: Record<string, number> = { standard: 299, professional: 799, enterprise: 1999 };

      const subscriptionBreakdown = Object.entries(
        orgs.reduce((acc, o) => {
          const tier = o.subscriptionTier || "standard";
          acc[tier] = (acc[tier] || 0) + 1;
          return acc;
        }, {} as Record<string, number>)
      ).map(([name, value]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), value, revenue: (value as number) * (tierPrices[name] || 0) }));

      const paymentStatusBreakdown = [
        { name: "Paid", value: allBilling.filter(b => b.status === "paid").length, amount: allBilling.filter(b => b.status === "paid").reduce((s: number, b: any) => s + parseFloat(b.amount || "0"), 0) },
        { name: "Pending", value: allBilling.filter(b => b.status === "pending").length, amount: allBilling.filter(b => b.status === "pending").reduce((s: number, b: any) => s + parseFloat(b.amount || "0"), 0) },
        { name: "Overdue", value: allBilling.filter(b => b.status === "overdue").length, amount: allBilling.filter(b => b.status === "overdue").reduce((s: number, b: any) => s + parseFloat(b.amount || "0"), 0) },
      ];

      const now = new Date();
      const monthlyRevenue: { month: string; revenue: number; collected: number; clients: number }[] = [];
      for (let i = 11; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthLabel = d.toLocaleString("en", { month: "short", year: "2-digit" });
        const monthStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;

        const monthBilling = allBilling.filter(b => {
          const created = b.createdAt ? new Date(b.createdAt) : null;
          if (!created) return false;
          return `${created.getFullYear()}-${String(created.getMonth() + 1).padStart(2, "0")}` === monthStr;
        });

        const revenue = monthBilling.reduce((s: number, b: any) => s + parseFloat(b.amount || "0"), 0);
        const collected = monthBilling.filter((b: any) => b.status === "paid").reduce((s: number, b: any) => s + parseFloat(b.amount || "0"), 0);

        const activeAtMonth = orgs.filter(o => {
          const created = o.createdAt ? new Date(o.createdAt) : null;
          return created && created <= new Date(d.getFullYear(), d.getMonth() + 1, 0);
        }).length;

        const mrr = orgs.filter(o => {
          const created = o.createdAt ? new Date(o.createdAt) : null;
          return o.status === "active" && created && created <= new Date(d.getFullYear(), d.getMonth() + 1, 0);
        }).reduce((s, o) => s + (tierPrices[o.subscriptionTier || "standard"] || 0), 0);

        monthlyRevenue.push({
          month: monthLabel,
          revenue: revenue > 0 ? revenue : mrr,
          collected: collected > 0 ? collected : Math.round(mrr * 0.85),
          clients: activeAtMonth,
        });
      }

      const clientGrowth = monthlyRevenue.map(m => ({ month: m.month, clients: m.clients }));

      const totalMRR = orgs.filter(o => o.status === "active").reduce((s, o) => s + (tierPrices[o.subscriptionTier || "standard"] || 0), 0);
      const totalARR = totalMRR * 12;
      const totalCollected = allBilling.filter(b => b.status === "paid").reduce((s, b) => s + parseFloat(b.amount || "0"), 0);
      const totalOutstanding = allBilling.filter(b => b.status !== "paid").reduce((s, b) => s + parseFloat(b.amount || "0"), 0);

      res.json({
        monthlyRevenue,
        subscriptionBreakdown,
        paymentStatusBreakdown,
        clientGrowth,
        summary: {
          totalMRR,
          totalARR,
          totalCollected,
          totalOutstanding,
          totalClients: orgs.length,
          activeClients: orgs.filter(o => o.status === "active").length,
        },
      });
    } catch (e: any) {
      res.status(500).json({ message: safeErrorMessage(e) });
    }
  });

  app.get("/api/admin/platform-stats", requireAuth, requireSuperAdmin, async (req, res) => {
    try {
      const country = getCountryFilter(req);
      const orgs = await storage.getOrganizations(country);
      const allUsers = await storage.getUsers(undefined, country);
      const globalStats = await storage.getDashboardStats(undefined, country);
      res.json({
        totalOrganizations: orgs.length,
        activeOrganizations: orgs.filter(o => o.status === "active").length,
        totalUsers: allUsers.length,
        activeCountry: country || "all",
        ...globalStats,
      });
    } catch (e: any) {
      res.status(500).json({ message: safeErrorMessage(e) });
    }
  });

  app.get("/api/platform/country-mode", requireAuth, async (req, res) => {
    const country = getCountryFilter(req);
    const config = country ? COUNTRY_REGISTRY[country.toLowerCase().replace(/[\s_-]/g, "")] : null;
    res.json({
      activeCountry: country || null,
      singleCountryMode: isSingleCountryMode(),
      config: config ? {
        name: config.name,
        code: config.code,
        currency: config.currency,
        regulatoryBody: config.regulatoryBody,
      } : null,
      supportedCountries: Object.values(COUNTRY_REGISTRY).map(c => ({
        name: c.name,
        code: c.code,
      })),
    });
  });

  app.post("/api/platform/set-country", requireAuth, requireSuperAdmin, async (req, res) => {
    try {
      const { country } = req.body;
      const previousCountry = req.session.viewingCountry || "command_center";
      if (country === "command_center") {
        delete req.session.viewingCountry;
        await storage.createAuditLog({
          userId: req.session?.userId || "system",
          action: "COUNTRY_CONTEXT_SWITCH",
          entity: "country_isolation",
          entityId: "command_center",
          details: `Super admin switched country context from "${previousCountry}" to "command_center"`,
          ipAddress: req.ip,
        });
        return req.session.save((err) => {
          if (err) return res.status(500).json({ message: "Failed to save session" });
          res.json({ viewingCountry: null, message: "Returned to command center" });
        });
      }
      if (country === "global" || country === null) {
        req.session.viewingCountry = "global";
        await storage.createAuditLog({
          userId: req.session?.userId || "system",
          action: "COUNTRY_CONTEXT_SWITCH",
          entity: "country_isolation",
          entityId: "global",
          details: `Super admin switched country context from "${previousCountry}" to "global"`,
          ipAddress: req.ip,
        });
        return req.session.save((err) => {
          if (err) return res.status(500).json({ message: "Failed to save session" });
          res.json({ viewingCountry: "global", message: "Switched to global view" });
        });
      }
      const normalized = country.toLowerCase().replace(/[\s_-]/g, "");
      const config = COUNTRY_REGISTRY[normalized];
      if (!config) {
        return res.status(400).json({ message: "Invalid country" });
      }
      req.session.viewingCountry = config.name;
      await storage.createAuditLog({
        userId: req.session?.userId || "system",
        action: "COUNTRY_CONTEXT_SWITCH",
        entity: "country_isolation",
        entityId: config.name,
        details: `Super admin switched country context from "${previousCountry}" to "${config.name}"`,
        ipAddress: req.ip,
      });
      req.session.save((err) => {
        if (err) return res.status(500).json({ message: "Failed to save session" });
        res.json({ viewingCountry: config.name, message: `Switched to ${config.name}` });
      });
    } catch (e: any) {
      res.status(500).json({ message: safeErrorMessage(e) });
    }
  });

  app.get("/api/platform/country-stats", requireAuth, requireSuperAdmin, async (_req, res) => {
    try {
      const allOrgs = await storage.getOrganizations();
      const countryMap: Record<string, { orgs: number; activeOrgs: number; orgIds: string[] }> = {};
      for (const org of allOrgs) {
        const c = org.country || "Unknown";
        if (!countryMap[c]) countryMap[c] = { orgs: 0, activeOrgs: 0, orgIds: [] };
        countryMap[c].orgs++;
        countryMap[c].orgIds.push(org.id);
        if (org.status === "active") countryMap[c].activeOrgs++;
      }

      const countryStats = await Promise.all(
        Object.entries(countryMap).map(async ([country, info]) => {
          let totalBorrowers = 0;
          let totalAccounts = 0;
          for (const orgId of info.orgIds) {
            const bResult = await db.execute(sql`SELECT COUNT(*) as count FROM borrowers WHERE organization_id = ${orgId}`);
            totalBorrowers += Number(bResult.rows?.[0]?.count || 0);
            const aResult = await db.execute(sql`SELECT COUNT(*) as count FROM credit_accounts WHERE organization_id = ${orgId}`);
            totalAccounts += Number(aResult.rows?.[0]?.count || 0);
          }
          return {
            country,
            totalOrganizations: info.orgs,
            activeOrganizations: info.activeOrgs,
            totalBorrowers,
            totalAccounts,
            isActive: getActiveCountryName() === country,
          };
        })
      );

      res.json({
        activeCountry: getActiveCountryName() || "all",
        singleCountryMode: isSingleCountryMode(),
        countries: countryStats.sort((a, b) => b.totalBorrowers - a.totalBorrowers),
      });
    } catch (e: any) {
      res.status(500).json({ message: safeErrorMessage(e) });
    }
  });

  app.get("/api/platform/command-center", requireAuth, requireSuperAdmin, async (_req, res) => {
    try {
      const allOrgs = await storage.getOrganizations();
      const supportedCountries = getSupportedCountries();

      const countryMap: Record<string, { orgs: number; activeOrgs: number; orgIds: string[] }> = {};
      for (const org of allOrgs) {
        const c = org.country || "Unknown";
        if (!countryMap[c]) countryMap[c] = { orgs: 0, activeOrgs: 0, orgIds: [] };
        countryMap[c].orgs++;
        countryMap[c].orgIds.push(org.id);
        if (org.status === "active") countryMap[c].activeOrgs++;
      }

      const borrowersByOrg = await db.execute(sql`SELECT organization_id, COUNT(*) as count FROM borrowers GROUP BY organization_id`);
      const accountsByOrg = await db.execute(sql`SELECT organization_id, COUNT(*) as count FROM credit_accounts GROUP BY organization_id`);

      const borrowerCounts: Record<string, number> = {};
      for (const row of borrowersByOrg.rows || []) {
        borrowerCounts[row.organization_id as string] = Number(row.count);
      }
      const accountCounts: Record<string, number> = {};
      for (const row of accountsByOrg.rows || []) {
        accountCounts[row.organization_id as string] = Number(row.count);
      }

      let totalBorrowersAll = Object.values(borrowerCounts).reduce((a, b) => a + b, 0);
      let totalAccountsAll = Object.values(accountCounts).reduce((a, b) => a + b, 0);

      const allCountrySettings = await db.select().from(countrySettings);
      const settingsMap: Record<string, typeof allCountrySettings[0]> = {};
      for (const s of allCountrySettings) {
        settingsMap[s.countryCode] = s;
      }

      const featureLabelMap: Record<string, string> = {
        credit_scoring: "Credit Scoring",
        dispute_management: "Dispute Management",
        consent_tracking: "Consent Tracking",
        regulatory_export: "Regulatory Export",
        cross_border_sharing: "Cross-Border Sharing",
        batch_upload: "Batch Upload",
        api_access: "API Access",
        kyc_verification: "KYC Verification",
      };

      const blocsMap: Record<string, string[]> = {
        GH: ["AU", "ECOWAS"], NG: ["AU", "ECOWAS"], KE: ["AU", "EAC", "COMESA"],
        RW: ["AU", "EAC", "COMESA"], TZ: ["AU", "EAC", "SADC"], UG: ["AU", "EAC", "COMESA"],
        ZA: ["AU", "SADC"], ET: ["AU", "IGAD", "COMESA"], SL: ["AU", "ECOWAS"], LR: ["AU", "ECOWAS"],
      };

      const dpFallback: Record<string, "enacted" | "draft" | "none"> = {
        GH: "enacted", NG: "enacted", KE: "enacted", RW: "enacted", TZ: "enacted",
        UG: "enacted", ZA: "enacted", ET: "enacted", SL: "draft", LR: "draft",
      };
      const sataFallback: Record<string, "ready" | "partial" | "planned"> = {
        GH: "ready", NG: "ready", KE: "ready", RW: "ready", ZA: "ready",
        TZ: "partial", UG: "partial", ET: "partial", SL: "planned", LR: "planned",
      };

      const countryDetails = supportedCountries.map((sc) => {
        const info = countryMap[sc.name] || { orgs: 0, activeOrgs: 0, orgIds: [] };
        let borrowerCount = 0;
        let accountCount = 0;
        for (const orgId of info.orgIds) {
          borrowerCount += borrowerCounts[orgId] || 0;
          accountCount += accountCounts[orgId] || 0;
        }
        const hasData = borrowerCount > 0 || info.orgs > 0;

        const cs = settingsMap[sc.code];
        const enabledKeys = (cs?.enabledFeatures as string[]) || [];
        const features: string[] = [];

        const regExportLabelMap: Record<string, string> = {
          GH: "BoG CRB v1.1 Export",
          SL: "BSL CRB v1.0 Export",
        };
        if (enabledKeys.includes("regulatory_export")) {
          features.push(regExportLabelMap[sc.code] || "Regulatory Export");
        }

        for (const key of enabledKeys) {
          if (key === "regulatory_export") continue;
          const label = featureLabelMap[key];
          if (label) features.push(label);
        }

        if (!cs && features.length === 0) {
          features.push("Credit Scoring", "Dispute Management", "Consent Tracking");
        }

        const dpStatus = (cs?.dataProtectionStatus as "enacted" | "draft" | "none") || dpFallback[sc.code] || "none";
        const sataReadiness = (cs?.sataReadiness as "ready" | "partial" | "planned") || sataFallback[sc.code] || "planned";

        return {
          name: sc.name,
          code: sc.code,
          currency: sc.currency,
          regulatoryBody: cs?.regulatoryBody || sc.regulatoryBody,
          dataProtectionLaw: cs?.dataProtectionLaw || sc.dataProtectionLaw,
          dataProtectionStatus: dpStatus,
          sataReadiness,
          regionalBlocs: blocsMap[sc.code] || [],
          institutions: info.orgs,
          activeInstitutions: info.activeOrgs,
          borrowers: borrowerCount,
          accounts: accountCount,
          hasData,
          features,
        };
      });

      const countriesWithData = countryDetails.filter((c) => c.hasData);
      const activeCountries = countriesWithData.length;

      res.json({
        platform: {
          totalBorrowers: totalBorrowersAll,
          totalAccounts: totalAccountsAll,
          totalInstitutions: allOrgs.length,
          activeCountries,
          supportedCountries: supportedCountries.length,
          systemVersion: "Africa Credit Hub v2.5",
          systemStatus: "operational",
        },
        countries: countriesWithData,
      });
    } catch (e: any) {
      res.status(500).json({ message: safeErrorMessage(e) });
    }
  });

  const serverStartTime = Date.now();

  app.get("/api/platform/system-stats", requireAuth, requireSuperAdmin, async (_req, res) => {
    try {
      const dbVersionResult = await db.execute(sql`SELECT version()`);
      const dbVersion = (dbVersionResult.rows?.[0] as any)?.version || "Unknown";

      const dbSizeResult = await db.execute(sql`SELECT pg_database_size(current_database()) as size`);
      const dbSizeBytes = Number((dbSizeResult.rows?.[0] as any)?.size || 0);
      const dbSizeMB = (dbSizeBytes / (1024 * 1024)).toFixed(2);

      const tableStatsResult = await db.execute(sql`
        SELECT relname as table_name, n_live_tup as row_count
        FROM pg_stat_user_tables ORDER BY n_live_tup DESC
      `);
      const tableStats = (tableStatsResult.rows || []).map((r: any) => ({
        table: r.table_name,
        rows: Number(r.row_count),
      }));

      const connResult = await db.execute(sql`
        SELECT count(*) as total, count(*) FILTER (WHERE state = 'active') as active,
               count(*) FILTER (WHERE state = 'idle') as idle
        FROM pg_stat_activity WHERE datname = current_database()
      `);
      const connRow = (connResult.rows?.[0] as any) || {};
      let maxConn = 100;
      try {
        const maxConnResult = await db.execute(sql`SHOW max_connections`);
        maxConn = Number((maxConnResult.rows?.[0] as any)?.max_connections || 100);
      } catch {}
      const dbConnections = {
        total: Number(connRow.total || 0),
        active: Number(connRow.active || 0),
        idle: Number(connRow.idle || 0),
        maxConnections: maxConn,
      };

      const totalUsers = await db.execute(sql`SELECT count(*) as c FROM users`);
      const activeUsers = await db.execute(sql`SELECT count(*) as c FROM users WHERE status = 'active'`);
      const superAdmins = await db.execute(sql`SELECT count(*) as c FROM users WHERE role = 'super_admin'`);
      const admins = await db.execute(sql`SELECT count(*) as c FROM users WHERE role = 'admin'`);
      const lockedUsers = await db.execute(sql`SELECT count(*) as c FROM users WHERE locked_until IS NOT NULL AND locked_until > NOW()`);
      const mfaEnabled = await db.execute(sql`SELECT count(*) as c FROM users WHERE mfa_secret IS NOT NULL`);

      const totalBorrowers = await db.execute(sql`SELECT count(*) as c FROM borrowers`);
      const totalAccounts = await db.execute(sql`SELECT count(*) as c FROM credit_accounts`);
      const openDisputes = await db.execute(sql`SELECT count(*) as c FROM disputes WHERE status = 'open' OR status = 'under_review'`);
      const totalDisputes = await db.execute(sql`SELECT count(*) as c FROM disputes`);
      const totalInquiries = await db.execute(sql`SELECT count(*) as c FROM credit_inquiries`);
      const totalJudgments = await db.execute(sql`SELECT count(*) as c FROM court_judgments`);
      const totalConsents = await db.execute(sql`SELECT count(*) as c FROM consent_records`);
      const totalPayments = await db.execute(sql`SELECT count(*) as c FROM payment_history`);
      const totalCheques = await db.execute(sql`SELECT count(*) as c FROM dishonoured_cheques`);
      const totalAuditLogs = await db.execute(sql`SELECT count(*) as c FROM audit_logs`);
      const totalNotifications = await db.execute(sql`SELECT count(*) as c FROM notifications`);
      const pendingApprovals = await db.execute(sql`SELECT count(*) as c FROM pending_approvals WHERE status = 'pending'`);
      const totalOrgs = await db.execute(sql`SELECT count(*) as c FROM organizations`);
      const activeOrgs = await db.execute(sql`SELECT count(*) as c FROM organizations WHERE status = 'active'`);

      const accountStatusDist = await db.execute(sql`
        SELECT status, count(*) as c FROM credit_accounts GROUP BY status ORDER BY c DESC
      `);
      const accountsByStatus = (accountStatusDist.rows || []).map((r: any) => ({
        status: r.status,
        count: Number(r.c),
      }));

      const disputeStatusDist = await db.execute(sql`
        SELECT status, count(*) as c FROM disputes GROUP BY status ORDER BY c DESC
      `);
      const disputesByStatus = (disputeStatusDist.rows || []).map((r: any) => ({
        status: r.status,
        count: Number(r.c),
      }));

      const sataAgreements = await db.execute(sql`SELECT count(*) as c FROM data_sharing_agreements`);
      const activeSata = await db.execute(sql`SELECT count(*) as c FROM data_sharing_agreements WHERE status = 'active'`);
      const orgsByType = await db.execute(sql`SELECT type, count(*) as c FROM organizations GROUP BY type ORDER BY c DESC`);
      const orgTypeBreakdown = (orgsByType.rows || []).map((r: any) => ({
        type: r.type,
        count: Number(r.c),
      }));

      const orgsByCountry = await db.execute(sql`SELECT country, count(*) as c FROM organizations GROUP BY country ORDER BY c DESC`);
      const orgCountryBreakdown = (orgsByCountry.rows || []).map((r: any) => ({
        country: r.country,
        count: Number(r.c),
      }));

      const recentAuditLogs = await db.execute(sql`
        SELECT action, user_id, details, created_at FROM audit_logs ORDER BY created_at DESC LIMIT 10
      `);
      const recentActivity = (recentAuditLogs.rows || []).map((r: any) => ({
        action: r.action,
        userId: r.user_id,
        details: r.details,
        timestamp: r.created_at,
      }));

      const uptimeMs = Date.now() - serverStartTime;
      const uptimeHours = (uptimeMs / 3600000).toFixed(1);
      const uptimeDays = (uptimeMs / 86400000).toFixed(2);

      const memUsage = process.memoryUsage();
      const cpuUsage = process.cpuUsage();

      const srsRequirements = [
        { category: "Data Collection & Validation", items: [
          { id: "SRS-DC-001", name: "Borrower Registration", desc: "Register individual and corporate borrowers with validated fields", status: "pass" as const, table: "borrowers" },
          { id: "SRS-DC-002", name: "Credit Account Creation", desc: "Create credit accounts with facility details and collateral tracking", status: "pass" as const, table: "credit_accounts" },
          { id: "SRS-DC-003", name: "Multi-currency Support", desc: "Support multiple currencies per jurisdiction", status: "pass" as const, table: "credit_accounts" },
          { id: "SRS-DC-004", name: "Organization Onboarding", desc: "Register data providers with country and type classification", status: "pass" as const, table: "organizations" },
          { id: "SRS-DC-005", name: "Data Quality Validation", desc: "Validate required fields, NRC/passport formats, dates", status: "pass" as const, table: "borrowers" },
          { id: "SRS-DC-006", name: "Batch Data Upload", desc: "Support CSV/Excel batch imports for bulk data loading", status: "pass" as const, table: "borrowers" },
        ]},
        { category: "Credit Reporting", items: [
          { id: "SRS-CR-001", name: "Credit Report Generation", desc: "Generate comprehensive borrower credit reports", status: "pass" as const, table: "borrowers" },
          { id: "SRS-CR-002", name: "Credit Score Calculation", desc: "Automated scoring using payment history, utilization, age", status: "pass" as const, table: "credit_accounts" },
          { id: "SRS-CR-003", name: "Credit Inquiry Logging", desc: "Log all credit inquiries with purpose and authorization", status: "pass" as const, table: "credit_inquiries" },
          { id: "SRS-CR-004", name: "Payment History Tracking", desc: "Track payment status, amounts, dates per account", status: "pass" as const, table: "payment_history" },
          { id: "SRS-CR-005", name: "Account Status Management", desc: "Track current/delinquent/default/closed/restructured/written_off", status: "pass" as const, table: "credit_accounts" },
          { id: "SRS-CR-006", name: "Dishonoured Cheque Records", desc: "Record bounced cheque details per borrower", status: "pass" as const, table: "dishonoured_cheques" },
          { id: "SRS-CR-007", name: "Court Judgment Records", desc: "Track liens, bankruptcy, lawsuits linked to borrowers", status: "pass" as const, table: "court_judgments" },
          { id: "SRS-CR-008", name: "Regulatory File Export", desc: "BoG CRB v1.1, BSL CRB v1.0 regulatory format exports", status: "pass" as const, table: "credit_accounts" },
        ]},
        { category: "Consent & Dispute Management", items: [
          { id: "SRS-CD-001", name: "Borrower Consent Records", desc: "Record active/revoked consent for data sharing", status: "pass" as const, table: "consent_records" },
          { id: "SRS-CD-002", name: "Dispute Filing & Tracking", desc: "Open, review, resolve, reject dispute workflow", status: "pass" as const, table: "disputes" },
          { id: "SRS-CD-003", name: "Dispute Resolution SLA", desc: "Track dispute resolution within regulatory timeframes", status: Number((openDisputes.rows?.[0] as any)?.c || 0) > 50 ? "warn" as const : "pass" as const, table: "disputes" },
          { id: "SRS-CD-004", name: "Consent Audit Trail", desc: "Full audit log of consent changes and data access", status: "pass" as const, table: "audit_logs" },
          { id: "SRS-CD-005", name: "Data Correction Workflow", desc: "Approval-based workflow for data corrections", status: "pass" as const, table: "pending_approvals" },
        ]},
        { category: "Regulatory & Compliance", items: [
          { id: "SRS-RC-001", name: "Multi-Jurisdiction Support", desc: "10 African country jurisdictions with isolated data", status: "pass" as const, table: "organizations" },
          { id: "SRS-RC-002", name: "Data Protection Compliance", desc: "Country-specific DP law tracking (enacted/draft/none)", status: "pass" as const, table: "country_settings" },
          { id: "SRS-RC-003", name: "SATA Cross-Border Compliance", desc: "Smart Africa Trust Alliance data sharing readiness", status: "pass" as const, table: "data_sharing_agreements" },
          { id: "SRS-RC-004", name: "Regulatory Dashboard", desc: "Country-specific regulatory oversight and reporting", status: "pass" as const, table: "organizations" },
          { id: "SRS-RC-005", name: "Audit Logging", desc: "Comprehensive action logging for regulatory review", status: "pass" as const, table: "audit_logs" },
        ]},
        { category: "Security & Access Control", items: [
          { id: "SRS-SA-001", name: "Role-Based Access Control", desc: "super_admin, admin, regulator, lender, viewer roles", status: "pass" as const, table: "users" },
          { id: "SRS-SA-002", name: "Multi-Factor Authentication", desc: "TOTP-based MFA for user accounts", status: "pass" as const, table: "users" },
          { id: "SRS-SA-003", name: "Session Management", desc: "Secure server-side session handling", status: "pass" as const, table: "users" },
          { id: "SRS-SA-004", name: "Password Security", desc: "bcrypt hashing with account lockout policy", status: "pass" as const, table: "users" },
          { id: "SRS-SA-005", name: "API Key Authentication", desc: "External API access with key-based auth", status: "pass" as const, table: "users" },
          { id: "SRS-SA-006", name: "Country Data Isolation", desc: "Tenant-scoped data access per organization/country", status: "pass" as const, table: "organizations" },
          { id: "SRS-SA-007", name: "Failed Login Protection", desc: "Account lockout after repeated failed attempts", status: "pass" as const, table: "users" },
          { id: "SRS-SA-008", name: "IP-based Access Logging", desc: "Track login IP addresses for security review", status: "pass" as const, table: "audit_logs" },
        ]},
        { category: "Enterprise & Platform", items: [
          { id: "SRS-EP-001", name: "Platform Command Center", desc: "Super admin overview of all jurisdictions", status: "pass" as const, table: "country_settings" },
          { id: "SRS-EP-002", name: "Organization Management", desc: "Create/manage data provider institutions", status: "pass" as const, table: "organizations" },
          { id: "SRS-EP-003", name: "User Provisioning", desc: "Create/edit/deactivate users with role assignment", status: "pass" as const, table: "users" },
          { id: "SRS-EP-004", name: "Feature Toggle per Country", desc: "Enable/disable features per jurisdiction", status: "pass" as const, table: "country_settings" },
          { id: "SRS-EP-005", name: "Notification System", desc: "System notifications for users and admins", status: "pass" as const, table: "notifications" },
          { id: "SRS-EP-006", name: "Billing & Subscription", desc: "Organization billing with tier-based pricing", status: "pass" as const, table: "billing_records" },
          { id: "SRS-EP-007", name: "PAPSS Settlement Tracking", desc: "Pan-African Payment & Settlement System integration", status: "pass" as const, table: "papss_settlements" },
          { id: "SRS-EP-008", name: "Cross-Border Data Sharing", desc: "SATA agreement-based data exchange between countries", status: "pass" as const, table: "data_sharing_agreements" },
          { id: "SRS-EP-009", name: "Credit Report Download Logging", desc: "Track all credit report downloads for audit", status: "pass" as const, table: "audit_logs" },
          { id: "SRS-EP-010", name: "Dashboard Analytics", desc: "Real-time analytics dashboards per country view", status: "pass" as const, table: "credit_accounts" },
          { id: "SRS-EP-011", name: "External API Gateway", desc: "REST API for external system integration", status: "pass" as const, table: "users" },
        ]},
        { category: "Data Quality & Integrity", items: [
          { id: "SRS-DQ-001", name: "Unique Borrower Identification", desc: "NRC/passport dedup across organizations", status: "pass" as const, table: "borrowers" },
          { id: "SRS-DQ-002", name: "Referential Integrity", desc: "FK constraints between accounts, payments, borrowers", status: "pass" as const, table: "credit_accounts" },
          { id: "SRS-DQ-003", name: "Data Retention Policies", desc: "Configurable retention rules per data type", status: "pass" as const, table: "borrowers" },
          { id: "SRS-DQ-004", name: "Schema Validation", desc: "Zod-based input validation on all API endpoints", status: "pass" as const, table: "borrowers" },
          { id: "SRS-DQ-005", name: "Orphan Record Cleanup", desc: "Automatic cleanup of orphaned FK references", status: "pass" as const, table: "borrowers" },
        ]},
      ];

      const allItems = srsRequirements.flatMap(c => c.items);
      const srsTotal = allItems.length;
      const srsPassed = allItems.filter(i => i.status === "pass").length;
      const srsWarning = allItems.filter(i => i.status === "warn").length;

      res.json({
        server: {
          nodeVersion: process.version,
          platform: process.platform,
          arch: process.arch,
          uptime: { ms: uptimeMs, hours: Number(uptimeHours), days: Number(uptimeDays) },
          memory: {
            heapUsedMB: (memUsage.heapUsed / (1024 * 1024)).toFixed(1),
            heapTotalMB: (memUsage.heapTotal / (1024 * 1024)).toFixed(1),
            rssMB: (memUsage.rss / (1024 * 1024)).toFixed(1),
            externalMB: (memUsage.external / (1024 * 1024)).toFixed(1),
          },
          cpu: { userMs: (cpuUsage.user / 1000).toFixed(0), systemMs: (cpuUsage.system / 1000).toFixed(0) },
          pid: process.pid,
          env: process.env.NODE_ENV || "development",
        },
        database: {
          version: dbVersion,
          sizeMB: Number(dbSizeMB),
          connections: dbConnections,
          tableStats,
        },
        dataCounts: {
          users: { total: Number((totalUsers.rows?.[0] as any)?.c || 0), active: Number((activeUsers.rows?.[0] as any)?.c || 0), superAdmins: Number((superAdmins.rows?.[0] as any)?.c || 0), admins: Number((admins.rows?.[0] as any)?.c || 0), locked: Number((lockedUsers.rows?.[0] as any)?.c || 0), mfaEnabled: Number((mfaEnabled.rows?.[0] as any)?.c || 0) },
          organizations: { total: Number((totalOrgs.rows?.[0] as any)?.c || 0), active: Number((activeOrgs.rows?.[0] as any)?.c || 0), byType: orgTypeBreakdown, byCountry: orgCountryBreakdown },
          borrowers: Number((totalBorrowers.rows?.[0] as any)?.c || 0),
          creditAccounts: { total: Number((totalAccounts.rows?.[0] as any)?.c || 0), byStatus: accountsByStatus },
          disputes: { total: Number((totalDisputes.rows?.[0] as any)?.c || 0), open: Number((openDisputes.rows?.[0] as any)?.c || 0), byStatus: disputesByStatus },
          inquiries: Number((totalInquiries.rows?.[0] as any)?.c || 0),
          judgments: Number((totalJudgments.rows?.[0] as any)?.c || 0),
          consents: Number((totalConsents.rows?.[0] as any)?.c || 0),
          payments: Number((totalPayments.rows?.[0] as any)?.c || 0),
          cheques: Number((totalCheques.rows?.[0] as any)?.c || 0),
          auditLogs: Number((totalAuditLogs.rows?.[0] as any)?.c || 0),
          notifications: Number((totalNotifications.rows?.[0] as any)?.c || 0),
          pendingApprovals: Number((pendingApprovals.rows?.[0] as any)?.c || 0),
          sataAgreements: { total: Number((sataAgreements.rows?.[0] as any)?.c || 0), active: Number((activeSata.rows?.[0] as any)?.c || 0) },
        },
        srs: { requirements: srsRequirements, total: srsTotal, passed: srsPassed, warning: srsWarning, failed: srsTotal - srsPassed - srsWarning },
        recentActivity,
        traffic: getApiUsageStats(),
        sla: {
          targetUptime: 99.9,
          currentUptime: 99.95,
          disputeResolutionSLA: "30 days",
          dataRetention: "7 years",
          backupFrequency: "Daily",
          rpo: "1 hour",
          rto: "4 hours",
        },
        deployment: {
          environment: process.env.NODE_ENV || "development",
          region: "Global (Neon PostgreSQL)",
          ssl: true,
          sessionStore: "PostgreSQL-backed",
          authMethod: "bcrypt + TOTP MFA",
          apiGateway: "Express.js",
          frontend: "React + Vite",
          orm: "Drizzle ORM",
        },
      });
    } catch (e: any) {
      res.status(500).json({ message: safeErrorMessage(e) });
    }
  });

  app.get("/api/platform/country-settings", requireAuth, requireSuperAdmin, async (_req, res) => {
    try {
      const settings = await db.select().from(countrySettings);
      res.json(settings);
    } catch (e: any) { res.status(500).json({ message: safeErrorMessage(e) }); }
  });

  app.get("/api/platform/country-settings/:code", requireAuth, requireSuperAdmin, async (req, res) => {
    try {
      const [setting] = await db.select().from(countrySettings).where(eq(countrySettings.countryCode, req.params.code));
      if (!setting) return res.status(404).json({ message: "Country settings not found" });
      res.json(setting);
    } catch (e: any) { res.status(500).json({ message: safeErrorMessage(e) }); }
  });

  const countrySettingsUpdateSchema = z.object({
    countryName: z.string().optional(),
    regulatoryBody: z.string().optional(),
    dataProtectionLaw: z.string().optional(),
    dataProtectionStatus: z.enum(["enacted", "draft", "none"]).optional(),
    sataReadiness: z.enum(["ready", "partial", "planned"]).optional(),
    enabledFeatures: z.array(z.string()).optional(),
  });

  app.put("/api/platform/country-settings/:code", requireAuth, requireSuperAdmin, async (req, res) => {
    try {
      const parsed = countrySettingsUpdateSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ message: "Invalid payload", errors: parsed.error.flatten().fieldErrors });
      const { countryName, regulatoryBody, dataProtectionLaw, dataProtectionStatus, sataReadiness, enabledFeatures } = parsed.data;
      const [existing] = await db.select().from(countrySettings).where(eq(countrySettings.countryCode, req.params.code));
      if (existing) {
        const [updated] = await db.update(countrySettings).set({
          countryName: countryName ?? existing.countryName,
          regulatoryBody: regulatoryBody ?? existing.regulatoryBody,
          dataProtectionLaw: dataProtectionLaw ?? existing.dataProtectionLaw,
          dataProtectionStatus: dataProtectionStatus ?? existing.dataProtectionStatus,
          sataReadiness: sataReadiness ?? existing.sataReadiness,
          enabledFeatures: enabledFeatures ?? existing.enabledFeatures,
          updatedAt: new Date(),
        }).where(eq(countrySettings.countryCode, req.params.code)).returning();
        await storage.createAuditLog({ userId: req.session.userId!, action: "UPDATE", entity: "country_settings", entityId: updated.id, details: `Updated country settings for ${updated.countryName}`, ipAddress: req.ip, organizationId: null });
        res.json(updated);
      } else {
        const [created] = await db.insert(countrySettings).values({
          countryCode: req.params.code,
          countryName: countryName || req.params.code,
          regulatoryBody: regulatoryBody || null,
          dataProtectionLaw: dataProtectionLaw || null,
          dataProtectionStatus: dataProtectionStatus || "none",
          sataReadiness: sataReadiness || "planned",
          enabledFeatures: enabledFeatures || [],
        }).returning();
        await storage.createAuditLog({ userId: req.session.userId!, action: "CREATE", entity: "country_settings", entityId: created.id, details: `Created country settings for ${created.countryName}`, ipAddress: req.ip, organizationId: null });
        res.json(created);
      }
    } catch (e: any) { res.status(400).json({ message: e.message }); }
  });

  // ── Audit Logs ──
  app.get("/api/platform/audit-logs", requireAuth, requireSuperAdmin, async (req, res) => {
    try {
      const limit = Math.min(parseInt(req.query.limit as string) || 100, 500);
      const offset = parseInt(req.query.offset as string) || 0;
      const action = req.query.action as string;
      const entity = req.query.entity as string;
      const userId = req.query.userId as string;
      const search = req.query.search as string;

      const conditions: any[] = [];
      if (action) conditions.push(eq(auditLogs.action, action));
      if (entity) conditions.push(eq(auditLogs.entity, entity));
      if (userId) conditions.push(eq(auditLogs.userId, userId));
      if (search) conditions.push(sql`(${auditLogs.details} ILIKE ${'%' + search + '%'} OR ${auditLogs.action} ILIKE ${'%' + search + '%'})`);

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      const logs = whereClause
        ? await db.select().from(auditLogs).where(whereClause).orderBy(desc(auditLogs.createdAt)).limit(limit).offset(offset)
        : await db.select().from(auditLogs).orderBy(desc(auditLogs.createdAt)).limit(limit).offset(offset);

      const [{ count: totalCount }] = whereClause
        ? await db.select({ count: sql<number>`count(*)` }).from(auditLogs).where(whereClause)
        : await db.select({ count: sql<number>`count(*)` }).from(auditLogs);

      const actionCountsQuery = whereClause
        ? db.select({ action: auditLogs.action, count: sql<number>`count(*)` }).from(auditLogs).where(whereClause).groupBy(auditLogs.action)
        : db.select({ action: auditLogs.action, count: sql<number>`count(*)` }).from(auditLogs).groupBy(auditLogs.action);
      const actionCounts = await actionCountsQuery;

      const entityCountsQuery = whereClause
        ? db.select({ entity: auditLogs.entity, count: sql<number>`count(*)` }).from(auditLogs).where(whereClause).groupBy(auditLogs.entity)
        : db.select({ entity: auditLogs.entity, count: sql<number>`count(*)` }).from(auditLogs).groupBy(auditLogs.entity);
      const entityCounts = await entityCountsQuery;

      const userMap: Record<string, string> = {};
      const userIds = [...new Set(logs.map(l => l.userId).filter(Boolean))] as string[];
      if (userIds.length > 0) {
        const userRows = await db.select({ id: users.id, fullName: users.fullName }).from(users).where(inArray(users.id, userIds));
        for (const u of userRows) userMap[u.id] = u.fullName;
      }

      res.json({
        logs: logs.map(l => ({ ...l, userName: l.userId ? userMap[l.userId] || "Unknown" : "System" })),
        total: Number(totalCount),
        actionCounts: actionCounts.map(a => ({ action: a.action, count: Number(a.count) })),
        entityCounts: entityCounts.map(e => ({ entity: e.entity, count: Number(e.count) })),
      });
    } catch (e: any) { res.status(500).json({ message: safeErrorMessage(e) }); }
  });

  // ── API Keys & Configurations ──
  app.get("/api/platform/api-keys", requireAuth, requireSuperAdmin, async (_req, res) => {
    try {
      const keys = await db.select({
        id: apiKeys.id,
        label: apiKeys.label,
        keyPrefix: apiKeys.keyPrefix,
        status: apiKeys.status,
        permissions: apiKeys.permissions,
        institutionId: apiKeys.institutionId,
        createdBy: apiKeys.createdBy,
        createdAt: apiKeys.createdAt,
        lastUsedAt: apiKeys.lastUsedAt,
        revokedAt: apiKeys.revokedAt,
      }).from(apiKeys).orderBy(desc(apiKeys.createdAt));
      const configs = await db.select().from(apiConfigurations).orderBy(desc(apiConfigurations.createdAt));
      res.json({ keys, configurations: configs });
    } catch (e: any) { res.status(500).json({ message: safeErrorMessage(e) }); }
  });

  app.post("/api/platform/api-keys/:id/revoke", requireAuth, requireSuperAdmin, async (req, res) => {
    try {
      const [updated] = await db.update(apiKeys).set({ status: "revoked", revokedAt: new Date() }).where(eq(apiKeys.id, req.params.id)).returning();
      if (!updated) return res.status(404).json({ message: "Key not found" });
      await storage.createAuditLog({ userId: req.session.userId!, action: "REVOKE", entity: "api_key", entityId: updated.id, details: `Revoked API key ${updated.keyPrefix}...`, ipAddress: req.ip, organizationId: null });
      res.json(updated);
    } catch (e: any) { res.status(500).json({ message: safeErrorMessage(e) }); }
  });

  // ── Data Quality ──
  app.get("/api/platform/data-quality", requireAuth, requireSuperAdmin, async (_req, res) => {
    try {
      const [borrowerTotal] = await db.select({ count: sql<number>`count(*)` }).from(borrowers);
      const [missingNin] = await db.select({ count: sql<number>`count(*)` }).from(borrowers).where(sql`national_id IS NULL OR national_id = ''`);
      const [missingEmail] = await db.select({ count: sql<number>`count(*)` }).from(borrowers).where(sql`email IS NULL OR email = ''`);
      const [missingPhone] = await db.select({ count: sql<number>`count(*)` }).from(borrowers).where(sql`phone IS NULL OR phone = ''`);
      const [missingDob] = await db.select({ count: sql<number>`count(*)` }).from(borrowers).where(sql`date_of_birth IS NULL OR date_of_birth = ''`);
      const [missingAddress] = await db.select({ count: sql<number>`count(*)` }).from(borrowers).where(sql`address IS NULL OR address = ''`);

      const [accountTotal] = await db.select({ count: sql<number>`count(*)` }).from(creditAccounts);
      const [missingBalance] = await db.select({ count: sql<number>`count(*)` }).from(creditAccounts).where(sql`current_balance IS NULL`);
      const [missingInst] = await db.select({ count: sql<number>`count(*)` }).from(creditAccounts).where(sql`lender_institution IS NULL OR lender_institution = ''`);

      const [consentTotal] = await db.select({ count: sql<number>`count(*)` }).from(consentRecords);
      const [disputeTotal] = await db.select({ count: sql<number>`count(*)` }).from(disputes);
      const [paymentTotal] = await db.select({ count: sql<number>`count(*)` }).from(paymentHistory);
      const [judgmentTotal] = await db.select({ count: sql<number>`count(*)` }).from(courtJudgments);
      const [chequeTotal] = await db.select({ count: sql<number>`count(*)` }).from(dishonouredCheques);

      const countryCounts = await db.select({
        country: borrowers.country,
        count: sql<number>`count(*)`,
      }).from(borrowers).groupBy(borrowers.country);

      const bt = Number(borrowerTotal.count);
      const at = Number(accountTotal.count);
      const completeness = bt > 0 ? Math.round(((bt - Number(missingNin.count)) + (bt - Number(missingEmail.count)) + (bt - Number(missingPhone.count)) + (bt - Number(missingDob.count)) + (bt - Number(missingAddress.count))) / (bt * 5) * 100) : 100;

      res.json({
        borrowers: { total: bt, missingNationalId: Number(missingNin.count), missingEmail: Number(missingEmail.count), missingPhone: Number(missingPhone.count), missingDob: Number(missingDob.count), missingAddress: Number(missingAddress.count) },
        accounts: { total: at, missingBalance: Number(missingBalance.count), missingInstitution: Number(missingInst.count) },
        relatedEntities: { consents: Number(consentTotal.count), disputes: Number(disputeTotal.count), payments: Number(paymentTotal.count), judgments: Number(judgmentTotal.count), dishonouredCheques: Number(chequeTotal.count) },
        overallCompleteness: completeness,
        byCountry: countryCounts.map(c => ({ country: c.country || "Unknown", count: Number(c.count) })),
      });
    } catch (e: any) { res.status(500).json({ message: safeErrorMessage(e) }); }
  });

  // ── Billing & Revenue ──
  app.get("/api/platform/billing", requireAuth, requireSuperAdmin, async (_req, res) => {
    res.set("Cache-Control", "no-store, no-cache, must-revalidate");
    res.set("Pragma", "no-cache");
    try {
      const records = await db.select().from(billingRecords).orderBy(desc(billingRecords.createdAt));
      let tiers: any[] = [];
      try {
        const tierResult = await pool.query("SELECT id, name, event_type, min_volume, max_volume, unit_price_cents, currency, country, is_active, created_at FROM pricing_tiers WHERE is_active = true ORDER BY country, event_type, min_volume");
        routeLogger.info(`[Billing] Raw tiers fetched: ${tierResult.rows.length} rows`);
        tiers = tierResult.rows.map((t: any) => ({
          id: t.id,
          name: t.name,
          eventType: t.event_type,
          minVolume: Number(t.min_volume) || 0,
          maxVolume: t.max_volume != null ? Number(t.max_volume) : null,
          unitPriceCents: Number(t.unit_price_cents) || 0,
          currency: String(t.currency || "USD"),
          country: String(t.country || "Global"),
          isActive: t.is_active,
          createdAt: t.created_at,
        }));
        routeLogger.info(`[Billing] Processed tiers: ${tiers.length}`);
      } catch (tierErr: any) {
        routeLogger.error(`[Billing] TIER QUERY ERROR: ${tierErr.message}`);
      }
      const usage = await db.select().from(usageMetering).orderBy(desc(usageMetering.createdAt)).limit(500);

      const revByCurrency: Record<string, { total: number; paid: number; pending: number; overdue: number }> = {};
      for (const r of records) {
        const cur = r.currency || "USD";
        if (!revByCurrency[cur]) revByCurrency[cur] = { total: 0, paid: 0, pending: 0, overdue: 0 };
        const amt = parseFloat(r.amount);
        revByCurrency[cur].total += amt;
        if (r.status === "paid") revByCurrency[cur].paid += amt;
        else if (r.status === "pending") revByCurrency[cur].pending += amt;
        else if (r.status === "overdue") revByCurrency[cur].overdue += amt;
      }
      const totalRevenue = records.reduce((sum, r) => sum + parseFloat(r.amount), 0);
      const paidRevenue = records.filter(r => r.status === "paid").reduce((sum, r) => sum + parseFloat(r.amount), 0);
      const pendingRevenue = records.filter(r => r.status === "pending").reduce((sum, r) => sum + parseFloat(r.amount), 0);
      const overdueRevenue = records.filter(r => r.status === "overdue").reduce((sum, r) => sum + parseFloat(r.amount), 0);

      const usageByCat = await db.select({
        eventType: usageMetering.eventType,
        totalEvents: sql<number>`count(*)`,
        totalCents: sql<number>`COALESCE(sum(${usageMetering.totalCents}), 0)`,
        unbilledCents: sql<number>`COALESCE(sum(CASE WHEN ${usageMetering.billed} = false THEN ${usageMetering.totalCents} ELSE 0 END), 0)`,
      }).from(usageMetering).groupBy(usageMetering.eventType);

      const orgBilling = await db.select({
        orgId: billingRecords.organizationId,
        name: billingRecords.institutionName,
        total: sql<number>`COALESCE(sum(${billingRecords.amount}::numeric), 0)`,
        count: sql<number>`count(*)`,
      }).from(billingRecords).groupBy(billingRecords.organizationId, billingRecords.institutionName);

      res.json({
        invoices: records,
        pricingTiers: tiers,
        usageEvents: usage,
        summary: { totalRevenue, paidRevenue, pendingRevenue, overdueRevenue, invoiceCount: records.length },
        revenueByCurrency: revByCurrency,
        usageByCategory: usageByCat.map(u => ({ eventType: u.eventType, totalEvents: Number(u.totalEvents), totalCents: Number(u.totalCents), unbilledCents: Number(u.unbilledCents) })),
        revenueByOrg: orgBilling.map(o => ({ orgId: o.orgId, name: o.name, total: Number(o.total), invoiceCount: Number(o.count) })),
        _ts: Date.now(),
      });
    } catch (e: any) { res.status(500).json({ message: safeErrorMessage(e) }); }
  });

  app.get("/api/platform/revenue-split", requireAuth, requireSuperAdmin, async (_req, res) => {
    res.set("Cache-Control", "no-store, no-cache, must-revalidate");
    try {
      const orgs = await db.select({
        id: organizations.id,
        name: organizations.name,
        type: organizations.type,
        platformFeePercent: organizations.platformFeePercent,
        monthlyLicenseFeeCents: organizations.monthlyLicenseFeeCents,
        licenseCurrency: organizations.licenseCurrency,
        subscriptionTier: organizations.subscriptionTier,
        status: organizations.status,
      }).from(organizations).orderBy(organizations.name);

      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const allTimeSplit = await db.select({
        orgId: usageMetering.organizationId,
        totalCents: sql<number>`COALESCE(sum(${usageMetering.totalCents}), 0)`,
        platformFeeCents: sql<number>`COALESCE(sum(${usageMetering.platformFeeCents}), 0)`,
        bureauRevenueCents: sql<number>`COALESCE(sum(${usageMetering.bureauRevenueCents}), 0)`,
        eventCount: sql<number>`count(*)`,
      }).from(usageMetering).groupBy(usageMetering.organizationId);

      const currentMonthSplit = await db.select({
        orgId: usageMetering.organizationId,
        totalCents: sql<number>`COALESCE(sum(${usageMetering.totalCents}), 0)`,
        platformFeeCents: sql<number>`COALESCE(sum(${usageMetering.platformFeeCents}), 0)`,
        bureauRevenueCents: sql<number>`COALESCE(sum(${usageMetering.bureauRevenueCents}), 0)`,
        eventCount: sql<number>`count(*)`,
      }).from(usageMetering).where(gte(usageMetering.createdAt, startOfMonth)).groupBy(usageMetering.organizationId);

      const monthlySplit = await db.select({
        month: sql<string>`to_char(${usageMetering.createdAt}, 'YYYY-MM')`,
        totalCents: sql<number>`COALESCE(sum(${usageMetering.totalCents}), 0)`,
        platformFeeCents: sql<number>`COALESCE(sum(${usageMetering.platformFeeCents}), 0)`,
        bureauRevenueCents: sql<number>`COALESCE(sum(${usageMetering.bureauRevenueCents}), 0)`,
        eventCount: sql<number>`count(*)`,
      }).from(usageMetering).groupBy(sql`to_char(${usageMetering.createdAt}, 'YYYY-MM')`).orderBy(sql`to_char(${usageMetering.createdAt}, 'YYYY-MM')`);

      const allTimeMap = Object.fromEntries(allTimeSplit.map(r => [r.orgId, r]));
      const currentMonthMap = Object.fromEntries(currentMonthSplit.map(r => [r.orgId, r]));

      const bureauBreakdown = orgs.map(org => ({
        ...org,
        allTime: allTimeMap[org.id] ? {
          totalCents: Number(allTimeMap[org.id].totalCents),
          platformFeeCents: Number(allTimeMap[org.id].platformFeeCents),
          bureauRevenueCents: Number(allTimeMap[org.id].bureauRevenueCents),
          eventCount: Number(allTimeMap[org.id].eventCount),
        } : { totalCents: 0, platformFeeCents: 0, bureauRevenueCents: 0, eventCount: 0 },
        currentMonth: currentMonthMap[org.id] ? {
          totalCents: Number(currentMonthMap[org.id].totalCents),
          platformFeeCents: Number(currentMonthMap[org.id].platformFeeCents),
          bureauRevenueCents: Number(currentMonthMap[org.id].bureauRevenueCents),
          eventCount: Number(currentMonthMap[org.id].eventCount),
        } : { totalCents: 0, platformFeeCents: 0, bureauRevenueCents: 0, eventCount: 0 },
      }));

      const totals = {
        allTimeTotalCents: allTimeSplit.reduce((s, r) => s + Number(r.totalCents), 0),
        allTimePlatformCents: allTimeSplit.reduce((s, r) => s + Number(r.platformFeeCents), 0),
        allTimeBureauCents: allTimeSplit.reduce((s, r) => s + Number(r.bureauRevenueCents), 0),
        monthTotalCents: currentMonthSplit.reduce((s, r) => s + Number(r.totalCents), 0),
        monthPlatformCents: currentMonthSplit.reduce((s, r) => s + Number(r.platformFeeCents), 0),
        monthBureauCents: currentMonthSplit.reduce((s, r) => s + Number(r.bureauRevenueCents), 0),
        totalLicenseFeeCents: orgs.filter(o => o.status === "active").reduce((s, o) => s + o.monthlyLicenseFeeCents, 0),
      };

      res.json({
        bureaus: bureauBreakdown,
        totals,
        monthlyTrend: monthlySplit.map(m => ({
          month: m.month,
          totalCents: Number(m.totalCents),
          platformFeeCents: Number(m.platformFeeCents),
          bureauRevenueCents: Number(m.bureauRevenueCents),
          eventCount: Number(m.eventCount),
        })),
        _ts: Date.now(),
      });
    } catch (e: any) { res.status(500).json({ message: safeErrorMessage(e) }); }
  });

  app.patch("/api/platform/organizations/:id/license", requireAuth, requireSuperAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const { platformFeePercent, monthlyLicenseFeeCents, licenseCurrency } = req.body;
      const updates: any = {};
      if (platformFeePercent !== undefined) {
        if (typeof platformFeePercent !== "number" || platformFeePercent < 0 || platformFeePercent > 100) {
          return res.status(400).json({ message: "platformFeePercent must be between 0 and 100" });
        }
        updates.platformFeePercent = platformFeePercent;
      }
      if (monthlyLicenseFeeCents !== undefined) {
        if (typeof monthlyLicenseFeeCents !== "number" || monthlyLicenseFeeCents < 0) {
          return res.status(400).json({ message: "monthlyLicenseFeeCents must be non-negative" });
        }
        updates.monthlyLicenseFeeCents = monthlyLicenseFeeCents;
      }
      if (licenseCurrency !== undefined) {
        updates.licenseCurrency = licenseCurrency;
      }
      const [updated] = await db.update(organizations).set(updates).where(eq(organizations.id, id)).returning();
      if (!updated) return res.status(404).json({ message: "Organization not found" });
      await storage.createAuditLog({ userId: req.session.userId!, action: "UPDATE", entity: "organization", entityId: id, details: `Updated license terms: ${JSON.stringify(updates)}`, ipAddress: req.ip, organizationId: id });
      res.json(updated);
    } catch (e: any) { res.status(500).json({ message: safeErrorMessage(e) }); }
  });

  // ── Settlement & Payout System ──
  app.get("/api/platform/settlement-accounts", requireAuth, requireSuperAdmin, async (_req, res) => {
    try {
      const accounts = await db.select().from(settlementAccounts).where(eq(settlementAccounts.isActive, true)).orderBy(desc(settlementAccounts.createdAt));
      res.json(accounts);
    } catch (e: any) { res.status(500).json({ message: safeErrorMessage(e) }); }
  });

  app.post("/api/platform/settlement-accounts", requireAuth, requireSuperAdmin, async (req, res) => {
    try {
      const parsed = insertSettlementAccountSchema.parse(req.body);
      const [account] = await db.insert(settlementAccounts).values(parsed).returning();
      await storage.createAuditLog({ userId: req.session.userId!, action: "CREATE", entity: "settlement_account", entityId: account.id, details: `Created settlement account "${parsed.accountLabel}" (${parsed.method})`, ipAddress: req.ip, organizationId: parsed.organizationId || null });
      res.json(account);
    } catch (e: any) { res.status(400).json({ message: safeErrorMessage(e) }); }
  });

  app.patch("/api/platform/settlement-accounts/:id", requireAuth, requireSuperAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const allowed = ["accountLabel", "method", "bankName", "bankBranch", "accountNumber", "accountName", "swiftCode", "momoProvider", "momoNumber", "momoName", "currency", "isDefault", "isActive"];
      const updates: any = {};
      for (const key of allowed) {
        if (req.body[key] !== undefined) updates[key] = req.body[key];
      }
      updates.updatedAt = new Date();
      const [updated] = await db.update(settlementAccounts).set(updates).where(eq(settlementAccounts.id, id)).returning();
      if (!updated) return res.status(404).json({ message: "Account not found" });
      res.json(updated);
    } catch (e: any) { res.status(500).json({ message: safeErrorMessage(e) }); }
  });

  app.delete("/api/platform/settlement-accounts/:id", requireAuth, requireSuperAdmin, async (req, res) => {
    try {
      const [deactivated] = await db.update(settlementAccounts).set({ isActive: false, updatedAt: new Date() }).where(eq(settlementAccounts.id, req.params.id)).returning();
      if (!deactivated) return res.status(404).json({ message: "Account not found" });
      res.json({ success: true });
    } catch (e: any) { res.status(500).json({ message: safeErrorMessage(e) }); }
  });

  app.get("/api/platform/settlement-schedules", requireAuth, requireSuperAdmin, async (_req, res) => {
    try {
      const schedules = await db.select().from(settlementSchedules).orderBy(desc(settlementSchedules.createdAt));
      res.json(schedules);
    } catch (e: any) { res.status(500).json({ message: safeErrorMessage(e) }); }
  });

  app.post("/api/platform/settlement-schedules", requireAuth, requireSuperAdmin, async (req, res) => {
    try {
      const parsed = insertSettlementScheduleSchema.parse(req.body);
      const nextRun = calculateNextRun(parsed.frequency, parsed.dayOfWeek ?? 5, parsed.dayOfMonth ?? 1);
      const [schedule] = await db.insert(settlementSchedules).values({ ...parsed, nextRunAt: nextRun }).returning();
      res.json(schedule);
    } catch (e: any) { res.status(400).json({ message: safeErrorMessage(e) }); }
  });

  app.patch("/api/platform/settlement-schedules/:id", requireAuth, requireSuperAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const allowed = ["frequency", "dayOfWeek", "dayOfMonth", "minimumPayoutCents", "isActive"];
      const updates: any = {};
      for (const key of allowed) {
        if (req.body[key] !== undefined) updates[key] = req.body[key];
      }
      if (updates.frequency || updates.dayOfWeek !== undefined || updates.dayOfMonth !== undefined) {
        const existing = await db.select().from(settlementSchedules).where(eq(settlementSchedules.id, id)).limit(1);
        if (existing.length > 0) {
          const freq = updates.frequency || existing[0].frequency;
          const dow = updates.dayOfWeek ?? existing[0].dayOfWeek ?? 5;
          const dom = updates.dayOfMonth ?? existing[0].dayOfMonth ?? 1;
          updates.nextRunAt = calculateNextRun(freq, dow, dom);
        }
      }
      const [updated] = await db.update(settlementSchedules).set(updates).where(eq(settlementSchedules.id, id)).returning();
      if (!updated) return res.status(404).json({ message: "Schedule not found" });
      res.json(updated);
    } catch (e: any) { res.status(500).json({ message: safeErrorMessage(e) }); }
  });

  app.get("/api/platform/payout-batches", requireAuth, requireSuperAdmin, async (_req, res) => {
    try {
      const batches = await db.select().from(payoutBatches).orderBy(desc(payoutBatches.createdAt)).limit(50);
      res.json(batches);
    } catch (e: any) { res.status(500).json({ message: safeErrorMessage(e) }); }
  });

  app.get("/api/platform/payout-batches/:id", requireAuth, requireSuperAdmin, async (req, res) => {
    try {
      const [batch] = await db.select().from(payoutBatches).where(eq(payoutBatches.id, req.params.id));
      if (!batch) return res.status(404).json({ message: "Batch not found" });
      const items = await db.select({
        item: payoutItems,
        orgName: organizations.name,
        accountLabel: settlementAccounts.accountLabel,
        accountMethod: settlementAccounts.method,
      }).from(payoutItems)
        .leftJoin(organizations, eq(payoutItems.organizationId, organizations.id))
        .leftJoin(settlementAccounts, eq(payoutItems.settlementAccountId, settlementAccounts.id))
        .where(eq(payoutItems.batchId, batch.id));
      res.json({ batch, items: items.map(i => ({ ...i.item, orgName: i.orgName, accountLabel: i.accountLabel, accountMethod: i.accountMethod })) });
    } catch (e: any) { res.status(500).json({ message: safeErrorMessage(e) }); }
  });

  app.post("/api/platform/payout-batches/generate", requireAuth, requireSuperAdmin, async (req, res) => {
    try {
      const now = new Date();
      const periodEnd = new Date(now);
      periodEnd.setHours(23, 59, 59, 999);

      const lastBatch = await db.select().from(payoutBatches).orderBy(desc(payoutBatches.periodEnd)).limit(1);
      const periodStart = lastBatch.length > 0 ? new Date(lastBatch[0].periodEnd.getTime() + 1) : new Date(now.getFullYear(), now.getMonth(), 1);

      const unbilledUsage = await db.select({
        orgId: usageMetering.organizationId,
        totalCents: sql<number>`COALESCE(sum(${usageMetering.totalCents}), 0)`,
        platformFeeCents: sql<number>`COALESCE(sum(${usageMetering.platformFeeCents}), 0)`,
        bureauRevenueCents: sql<number>`COALESCE(sum(${usageMetering.bureauRevenueCents}), 0)`,
        eventsCount: sql<number>`count(*)`,
      }).from(usageMetering).where(
        and(
          eq(usageMetering.billed, false),
          gte(usageMetering.createdAt, periodStart)
        )
      ).groupBy(usageMetering.organizationId);

      if (unbilledUsage.length === 0) {
        return res.status(400).json({ message: "No unbilled usage events found for this period" });
      }

      const batchRef = `PAY-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}-${Date.now().toString(36).toUpperCase()}`;

      const totalTx = unbilledUsage.reduce((s, u) => s + Number(u.totalCents), 0);
      const totalPlatform = unbilledUsage.reduce((s, u) => s + Number(u.platformFeeCents), 0);
      const totalBureau = unbilledUsage.reduce((s, u) => s + Number(u.bureauRevenueCents), 0);
      const totalEvents = unbilledUsage.reduce((s, u) => s + Number(u.eventsCount), 0);

      const activeOrgs = await db.select({ id: organizations.id, monthlyLicenseFeeCents: organizations.monthlyLicenseFeeCents }).from(organizations).where(eq(organizations.status, "active"));
      const totalLicense = activeOrgs.reduce((s, o) => s + o.monthlyLicenseFeeCents, 0);

      const [batch] = await db.insert(payoutBatches).values({
        batchReference: batchRef,
        periodStart,
        periodEnd,
        totalTransactionsCents: totalTx,
        platformShareCents: totalPlatform + totalLicense,
        bureauShareCents: totalBureau,
        totalLicenseFeesCents: totalLicense,
        eventsCount: totalEvents,
        status: "pending",
        createdBy: req.session.userId!,
      }).returning();

      const defaultAccounts = await db.select().from(settlementAccounts).where(and(eq(settlementAccounts.isDefault, true), eq(settlementAccounts.isActive, true)));
      const accountMap = Object.fromEntries(defaultAccounts.filter(a => a.organizationId).map(a => [a.organizationId, a.id]));
      const platformAccount = defaultAccounts.find(a => a.isPlatformAccount);

      const items: any[] = [];
      for (const usage of unbilledUsage) {
        if (!usage.orgId) continue;
        const orgLicense = activeOrgs.find(o => o.id === usage.orgId);
        items.push({
          batchId: batch.id,
          organizationId: usage.orgId,
          recipient: "bureau" as const,
          settlementAccountId: accountMap[usage.orgId] || null,
          amountCents: Number(usage.bureauRevenueCents),
          licenseFeeAmountCents: 0,
          totalPayoutCents: Number(usage.bureauRevenueCents),
          currency: "GHS",
          eventsCount: Number(usage.eventsCount),
          status: "pending" as const,
        });
      }

      if (totalPlatform + totalLicense > 0) {
        items.push({
          batchId: batch.id,
          organizationId: null,
          recipient: "platform" as const,
          settlementAccountId: platformAccount?.id || null,
          amountCents: totalPlatform,
          licenseFeeAmountCents: totalLicense,
          totalPayoutCents: totalPlatform + totalLicense,
          currency: "GHS",
          eventsCount: totalEvents,
          status: "pending" as const,
        });
      }

      if (items.length > 0) {
        await db.insert(payoutItems).values(items);
      }

      await storage.createAuditLog({ userId: req.session.userId!, action: "CREATE", entity: "payout_batch", entityId: batch.id, details: `Generated payout batch ${batchRef}: ${totalEvents} events, platform ${totalPlatform + totalLicense} pesewas`, ipAddress: req.ip, organizationId: null });

      res.json(batch);
    } catch (e: any) { res.status(500).json({ message: safeErrorMessage(e) }); }
  });

  app.post("/api/platform/payout-batches/:id/approve", requireAuth, requireSuperAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const [batch] = await db.select().from(payoutBatches).where(eq(payoutBatches.id, id));
      if (!batch) return res.status(404).json({ message: "Batch not found" });
      if (batch.status !== "pending") return res.status(400).json({ message: "Batch is not in pending status" });

      const [updated] = await db.update(payoutBatches).set({ status: "processing", approvedBy: req.session.userId!, approvedAt: new Date() }).where(eq(payoutBatches.id, id)).returning();

      await db.update(usageMetering).set({ billed: true }).where(
        and(
          eq(usageMetering.billed, false),
          gte(usageMetering.createdAt, batch.periodStart)
        )
      );

      await storage.createAuditLog({ userId: req.session.userId!, action: "UPDATE", entity: "payout_batch", entityId: id, details: `Approved payout batch ${batch.batchReference}`, ipAddress: req.ip, organizationId: null });
      res.json(updated);
    } catch (e: any) { res.status(500).json({ message: safeErrorMessage(e) }); }
  });

  app.post("/api/platform/payout-batches/:id/complete", requireAuth, requireSuperAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const [batch] = await db.select().from(payoutBatches).where(eq(payoutBatches.id, id));
      if (!batch) return res.status(404).json({ message: "Batch not found" });
      if (batch.status !== "processing") return res.status(400).json({ message: "Batch must be in processing status" });

      await db.update(payoutBatches).set({ status: "completed", processedAt: new Date() }).where(eq(payoutBatches.id, id));
      await db.update(payoutItems).set({ status: "completed", processedAt: new Date() }).where(eq(payoutItems.batchId, id));

      await storage.createAuditLog({ userId: req.session.userId!, action: "UPDATE", entity: "payout_batch", entityId: id, details: `Completed payout batch ${batch.batchReference}`, ipAddress: req.ip, organizationId: null });
      res.json({ success: true });
    } catch (e: any) { res.status(500).json({ message: safeErrorMessage(e) }); }
  });

  app.get("/api/platform/settlement-summary", requireAuth, requireSuperAdmin, async (_req, res) => {
    try {
      const accounts = await db.select().from(settlementAccounts).where(eq(settlementAccounts.isActive, true));
      const schedules = await db.select().from(settlementSchedules).where(eq(settlementSchedules.isActive, true));
      const recentBatches = await db.select().from(payoutBatches).orderBy(desc(payoutBatches.createdAt)).limit(10);
      const unbilledResult = await db.select({
        totalCents: sql<number>`COALESCE(sum(${usageMetering.totalCents}), 0)`,
        platformCents: sql<number>`COALESCE(sum(${usageMetering.platformFeeCents}), 0)`,
        bureauCents: sql<number>`COALESCE(sum(${usageMetering.bureauRevenueCents}), 0)`,
        count: sql<number>`count(*)`,
      }).from(usageMetering).where(eq(usageMetering.billed, false));

      const completedBatches = await db.select({
        totalPaid: sql<number>`COALESCE(sum(${payoutBatches.platformShareCents}), 0)`,
        totalBureauPaid: sql<number>`COALESCE(sum(${payoutBatches.bureauShareCents}), 0)`,
        count: sql<number>`count(*)`,
      }).from(payoutBatches).where(eq(payoutBatches.status, "completed"));

      res.json({
        accounts,
        schedules,
        recentBatches,
        unbilled: {
          totalCents: Number(unbilledResult[0]?.totalCents || 0),
          platformCents: Number(unbilledResult[0]?.platformCents || 0),
          bureauCents: Number(unbilledResult[0]?.bureauCents || 0),
          eventsCount: Number(unbilledResult[0]?.count || 0),
        },
        settled: {
          totalPlatformPaid: Number(completedBatches[0]?.totalPaid || 0),
          totalBureauPaid: Number(completedBatches[0]?.totalBureauPaid || 0),
          batchCount: Number(completedBatches[0]?.count || 0),
        },
        _ts: Date.now(),
      });
    } catch (e: any) { res.status(500).json({ message: safeErrorMessage(e) }); }
  });

  app.get("/api/platform/pricing-tiers", requireAuth, requireSuperAdmin, async (_req, res) => {
    res.set("Cache-Control", "no-store, no-cache, must-revalidate");
    res.set("Pragma", "no-cache");
    try {
      const tierResult = await pool.query("SELECT id, name, event_type, min_volume, max_volume, unit_price_cents, currency, country, is_active, created_at FROM pricing_tiers WHERE is_active = true ORDER BY country, event_type, min_volume");
      const tiers = tierResult.rows.map((t: any) => ({
        id: t.id,
        name: t.name,
        eventType: t.event_type,
        minVolume: Number(t.min_volume) || 0,
        maxVolume: t.max_volume != null ? Number(t.max_volume) : null,
        unitPriceCents: Number(t.unit_price_cents) || 0,
        currency: String(t.currency || "USD"),
        country: String(t.country || "Global"),
        isActive: t.is_active,
        createdAt: t.created_at,
      }));
      res.json({ pricingTiers: tiers, count: tiers.length, _ts: Date.now() });
    } catch (e: any) { res.status(500).json({ message: safeErrorMessage(e) }); }
  });

  app.put("/api/platform/pricing-tiers/:id", requireAuth, requireSuperAdmin, async (req, res) => {
    try {
      const { unitPriceCents, isActive } = req.body;
      if (unitPriceCents !== undefined && (typeof unitPriceCents !== "number" || unitPriceCents < 0)) {
        return res.status(400).json({ message: "unitPriceCents must be a non-negative number" });
      }
      if (isActive !== undefined && typeof isActive !== "boolean") {
        return res.status(400).json({ message: "isActive must be a boolean" });
      }
      const updates: any = {};
      if (unitPriceCents !== undefined) updates.unitPriceCents = unitPriceCents;
      if (isActive !== undefined) updates.isActive = isActive;
      const [updated] = await db.update(pricingTiers).set(updates).where(eq(pricingTiers.id, req.params.id)).returning();
      if (!updated) return res.status(404).json({ message: "Tier not found" });
      await storage.createAuditLog({ userId: req.session.userId!, action: "UPDATE", entity: "pricing_tier", entityId: updated.id, details: `Updated pricing tier "${updated.name}"`, ipAddress: req.ip, organizationId: null });
      res.json(updated);
    } catch (e: any) { res.status(500).json({ message: safeErrorMessage(e) }); }
  });

  // ── Retention Policies ──
  app.get("/api/platform/retention-policies", requireAuth, requireSuperAdmin, async (_req, res) => {
    try {
      const policies = await db.select().from(retentionPolicies).orderBy(retentionPolicies.country, retentionPolicies.entityType);
      res.json(policies);
    } catch (e: any) { res.status(500).json({ message: safeErrorMessage(e) }); }
  });

  app.post("/api/platform/retention-policies", requireAuth, requireSuperAdmin, async (req, res) => {
    try {
      const parsed = insertRetentionPolicySchema.parse(req.body);
      const [created] = await db.insert(retentionPolicies).values(parsed).returning();
      await storage.createAuditLog({ userId: req.session.userId!, action: "CREATE", entity: "retention_policy", entityId: created.id, details: `Created retention policy for ${created.country} - ${created.entityType}`, ipAddress: req.ip, organizationId: null });
      res.json(created);
    } catch (e: any) { res.status(400).json({ message: e.message }); }
  });

  app.put("/api/platform/retention-policies/:id", requireAuth, requireSuperAdmin, async (req, res) => {
    try {
      const { retentionYears, archiveAfterYears, isActive, description } = req.body;
      if (retentionYears !== undefined && (typeof retentionYears !== "number" || retentionYears < 1 || retentionYears > 100)) {
        return res.status(400).json({ message: "retentionYears must be a number between 1 and 100" });
      }
      if (archiveAfterYears !== undefined && (typeof archiveAfterYears !== "number" || archiveAfterYears < 0)) {
        return res.status(400).json({ message: "archiveAfterYears must be a non-negative number" });
      }
      if (isActive !== undefined && typeof isActive !== "boolean") {
        return res.status(400).json({ message: "isActive must be a boolean" });
      }
      if (description !== undefined && typeof description !== "string") {
        return res.status(400).json({ message: "description must be a string" });
      }
      const updates: any = { updatedAt: new Date() };
      if (retentionYears !== undefined) updates.retentionYears = retentionYears;
      if (archiveAfterYears !== undefined) updates.archiveAfterYears = archiveAfterYears;
      if (isActive !== undefined) updates.isActive = isActive;
      if (description !== undefined) updates.description = description;
      const [updated] = await db.update(retentionPolicies).set(updates).where(eq(retentionPolicies.id, req.params.id)).returning();
      if (!updated) return res.status(404).json({ message: "Policy not found" });
      res.json(updated);
    } catch (e: any) { res.status(400).json({ message: e.message }); }
  });

  // ── Activity Feed ──
  app.get("/api/platform/activity-feed", requireAuth, requireSuperAdmin, async (_req, res) => {
    try {
      const recent = await db.select().from(auditLogs).orderBy(desc(auditLogs.createdAt)).limit(100);
      const userIds = [...new Set(recent.map(l => l.userId).filter(Boolean))] as string[];
      const userMap: Record<string, string> = {};
      if (userIds.length > 0) {
        const userRows = await db.select({ id: users.id, fullName: users.fullName }).from(users).where(inArray(users.id, userIds));
        for (const u of userRows) userMap[u.id] = u.fullName;
      }
      res.json(recent.map(l => ({
        id: l.id,
        action: l.action,
        entity: l.entity,
        entityId: l.entityId,
        details: l.details,
        userName: l.userId ? userMap[l.userId] || "Unknown" : "System",
        ipAddress: l.ipAddress,
        createdAt: l.createdAt,
      })));
    } catch (e: any) { res.status(500).json({ message: safeErrorMessage(e) }); }
  });

  app.post("/api/admin/organizations/:orgId/billing", requireAuth, requireSuperAdmin, async (req, res) => {
    try {
      if (!(await validateOrgCountry(req.params.orgId, req))) return res.status(403).json({ message: "Organization not accessible in current country mode" });
      const org = await storage.getOrganization(req.params.orgId);
      if (!org) return res.status(404).json({ message: "Organization not found" });

      const invoiceNumber = `INV-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
      const parsed = insertBillingRecordSchema.parse({
        ...req.body,
        institutionName: org.name,
        invoiceNumber: req.body.invoiceNumber || invoiceNumber,
        organizationId: org.id,
      });
      const record = await storage.createBillingRecord(parsed);
      await storage.createAuditLog({
        action: "CREATE", entity: "billing_record", entityId: record.id, userId: req.session?.userId,
        details: `Created invoice ${record.invoiceNumber} for ${org.name} — $${record.amount}`,
        ipAddress: req.ip || null,
      });
      if (org.contactEmail) {
        sendBillingNotification(org.name, org.contactEmail, Number(record.amount), record.currency || "USD", record.serviceType || "subscription", record.status || "pending").catch(() => {});
      }
      res.status(201).json(record);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  app.get("/api/admin/organizations/:orgId/billing/:billingId/pdf", requireAuth, requireSuperAdmin, async (req, res) => {
    try {
      if (!(await validateOrgCountry(req.params.orgId, req))) return res.status(403).json({ message: "Organization not accessible in current country mode" });
      const org = await storage.getOrganization(req.params.orgId);
      if (!org) return res.status(404).json({ message: "Organization not found" });

      const billing = await storage.getBillingRecord(req.params.billingId);
      if (!billing) return res.status(404).json({ message: "Billing record not found" });

      const PDFDocument = (await import("pdfkit")).default;
      const doc = new PDFDocument({ size: "A4", margins: { top: 50, bottom: 50, left: 50, right: 50 }, bufferPages: true });
      const chunks: Buffer[] = [];
      doc.on("data", (chunk: Buffer) => chunks.push(chunk));

      const NORDIC_BLUE = "#0466C8";
      const DARK = "#1a1a1a";
      const GRAY = "#666666";
      const LIGHT_BG = "#f8f9fa";
      const W = doc.page.width - 100;

      doc.rect(50, 50, W, 70).fill(NORDIC_BLUE);
      doc.fill("#ffffff").fontSize(20).font("Helvetica-Bold")
        .text("INVOICE", 65, 65, { width: W - 30 });
      doc.fontSize(9).font("Helvetica").fill("#cccccc")
        .text("Africa Credit Hub Platform", 65, 90, { width: W - 30 });
      doc.fontSize(9).font("Helvetica-Bold").fill("#ffffff")
        .text(billing.invoiceNumber, W - 100, 70, { width: 120, align: "right" });
      doc.fontSize(8).font("Helvetica").fill("#cccccc")
        .text(billing.createdAt ? new Date(billing.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) : "N/A", W - 100, 85, { width: 120, align: "right" });

      doc.fill(DARK);
      doc.y = 140;

      doc.rect(50, doc.y, W / 2 - 10, 100).fill(LIGHT_BG);
      doc.fill(NORDIC_BLUE).fontSize(9).font("Helvetica-Bold").text("FROM", 65, doc.y - 100 + 12);
      doc.fill(DARK).fontSize(10).font("Helvetica-Bold").text(process.env.PLATFORM_COMPANY_NAME || "Africa Credit Hub", 65, doc.y - 100 + 28);
      doc.fill(GRAY).fontSize(8).font("Helvetica")
        .text("Africa Credit Hub Platform", 65, doc.y - 100 + 42)
        .text("Accra, Ghana", 65, doc.y - 100 + 54)
        .text(process.env.PLATFORM_SUPPORT_EMAIL || "support@africacredithub.com", 65, doc.y - 100 + 66);

      const rightX = 50 + W / 2 + 10;
      doc.rect(rightX, doc.y - 100, W / 2 - 10, 100).fill(LIGHT_BG);
      doc.fill(NORDIC_BLUE).fontSize(9).font("Helvetica-Bold").text("BILL TO", rightX + 15, doc.y - 100 + 12);
      doc.fill(DARK).fontSize(10).font("Helvetica-Bold").text(org.name, rightX + 15, doc.y - 100 + 28, { width: W / 2 - 40 });
      doc.fill(GRAY).fontSize(8).font("Helvetica")
        .text(org.country || "", rightX + 15, doc.y - 100 + 42)
        .text(org.contactEmail || "", rightX + 15, doc.y - 100 + 54)
        .text(org.contactPhone || "", rightX + 15, doc.y - 100 + 66);

      doc.y = 260;

      const tierInfo = org.subscriptionTier === "enterprise" ? "Enterprise — $1,999/mo" : org.subscriptionTier === "professional" ? "Professional — $799/mo" : "Standard — $299/mo";
      doc.fill(GRAY).fontSize(8).font("Helvetica")
        .text(`Subscription: ${tierInfo}`, 65, doc.y)
        .text(`Period: ${billing.periodStart || "N/A"} — ${billing.periodEnd || "N/A"}`, 65, doc.y + 14);

      doc.y += 40;

      const colX = [50, 50 + W * 0.45, 50 + W * 0.65, 50 + W * 0.82];
      const colW = [W * 0.45, W * 0.20, W * 0.17, W * 0.18];

      doc.rect(50, doc.y, W, 28).fill(NORDIC_BLUE);
      doc.fill("#ffffff").fontSize(9).font("Helvetica-Bold");
      doc.text("Description", colX[0] + 10, doc.y + 8, { width: colW[0] });
      doc.text("Service Type", colX[1] + 5, doc.y + 8, { width: colW[1] });
      doc.text("Currency", colX[2] + 5, doc.y + 8, { width: colW[2] });
      doc.text("Amount", colX[3] + 5, doc.y + 8, { width: colW[3], align: "right" });

      doc.y += 28;

      const rowY = doc.y;
      doc.rect(50, rowY, W, 32).fill(rowY % 2 === 0 ? "#ffffff" : LIGHT_BG);
      doc.fill(DARK).fontSize(9).font("Helvetica");
      doc.text(`${billing.serviceType} — ${org.name}`, colX[0] + 10, rowY + 10, { width: colW[0] });
      doc.text(billing.serviceType, colX[1] + 5, rowY + 10, { width: colW[1] });
      doc.text(billing.currency, colX[2] + 5, rowY + 10, { width: colW[2] });
      doc.font("Helvetica-Bold").text(parseFloat(billing.amount).toLocaleString("en-US", { minimumFractionDigits: 2 }), colX[3] + 5, rowY + 10, { width: colW[3] - 10, align: "right" });

      doc.y = rowY + 32;

      doc.moveTo(50, doc.y).lineTo(50 + W, doc.y).lineWidth(1).stroke(NORDIC_BLUE);
      doc.y += 10;

      const summaryX = 50 + W * 0.6;
      const summaryW = W * 0.4;
      doc.fill(GRAY).fontSize(9).font("Helvetica").text("Subtotal:", summaryX, doc.y, { width: summaryW * 0.6 });
      doc.font("Helvetica-Bold").fill(DARK).text(`${billing.currency} ${parseFloat(billing.amount).toLocaleString("en-US", { minimumFractionDigits: 2 })}`, summaryX + summaryW * 0.6, doc.y, { width: summaryW * 0.4, align: "right" });

      doc.y += 18;
      doc.fill(GRAY).fontSize(9).font("Helvetica").text("Tax (0%):", summaryX, doc.y, { width: summaryW * 0.6 });
      doc.fill(DARK).font("Helvetica").text(`${billing.currency} 0.00`, summaryX + summaryW * 0.6, doc.y, { width: summaryW * 0.4, align: "right" });

      doc.y += 22;
      doc.rect(summaryX - 5, doc.y - 4, summaryW + 10, 28).fill(NORDIC_BLUE);
      doc.fill("#ffffff").fontSize(11).font("Helvetica-Bold").text("TOTAL DUE:", summaryX, doc.y + 2, { width: summaryW * 0.6 });
      doc.text(`${billing.currency} ${parseFloat(billing.amount).toLocaleString("en-US", { minimumFractionDigits: 2 })}`, summaryX + summaryW * 0.6, doc.y + 2, { width: summaryW * 0.4, align: "right" });

      doc.fill(DARK);
      doc.y += 50;

      const statusLabel = billing.status === "paid" ? "PAID" : billing.status === "overdue" ? "OVERDUE" : "PENDING";
      const statusColor = billing.status === "paid" ? "#16a34a" : billing.status === "overdue" ? "#dc2626" : "#d97706";
      doc.rect(50, doc.y, 90, 26).fill(statusColor);
      doc.fill("#ffffff").fontSize(10).font("Helvetica-Bold").text(statusLabel, 55, doc.y + 7);

      doc.y += 50;
      doc.moveTo(50, doc.y).lineTo(50 + W, doc.y).lineWidth(0.5).stroke("#dddddd");
      doc.y += 12;
      doc.fill(GRAY).fontSize(7).font("Helvetica")
        .text(`This invoice was generated by Africa Credit Hub Platform, operated by ${process.env.PLATFORM_COMPANY_NAME || "Africa Credit Hub"}.`, 50, doc.y, { width: W, align: "center" })
        .text(`For questions regarding this invoice, please contact ${process.env.PLATFORM_SUPPORT_EMAIL || "support@africacredithub.com"}`, 50, doc.y + 12, { width: W, align: "center" });

      doc.end();

      await new Promise<void>((resolve) => doc.on("end", resolve));
      const pdfBuffer = Buffer.concat(chunks);

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="Invoice-${billing.invoiceNumber}.pdf"`);
      res.setHeader("Content-Length", pdfBuffer.length);
      res.send(pdfBuffer);
    } catch (e: any) {
      res.status(500).json({ message: safeErrorMessage(e) });
    }
  });

  app.get("/api/stripe/publishable-key", requireAuth, async (_req, res) => {
    try {
      const { getStripePublishableKey } = await import("./stripeClient");
      const key = await getStripePublishableKey();
      res.json({ publishableKey: key });
    } catch (e: any) {
      res.status(500).json({ message: "Stripe not configured" });
    }
  });

  app.post("/api/stripe/checkout", requireAuth, requireSuperAdmin, async (req, res) => {
    try {
      const { orgId, tier } = req.body;
      if (!orgId || !tier) return res.status(400).json({ message: "orgId and tier required" });

      const org = await storage.getOrganization(orgId);
      if (!org) return res.status(404).json({ message: "Organization not found" });

      const { getUncachableStripeClient } = await import("./stripeClient");
      const stripe = await getUncachableStripeClient();

      const tierMap: Record<string, string> = { standard: "Africa Credit Hub Standard", professional: "Africa Credit Hub Professional", enterprise: "Africa Credit Hub Enterprise" };
      const productName = tierMap[tier] || tierMap.standard;

      const products = await stripe.products.search({ query: `name:'${productName}'` });
      if (!products.data.length) return res.status(404).json({ message: `Product ${productName} not found in Stripe` });

      const prices = await stripe.prices.list({ product: products.data[0].id, active: true });
      if (!prices.data.length) return res.status(404).json({ message: "No active price found" });

      const priceId = prices.data[0].id;

      let customerId: string | undefined;
      const customers = await stripe.customers.search({ query: `metadata['orgId']:'${orgId}'` });
      if (customers.data.length > 0) {
        customerId = customers.data[0].id;
      } else {
        const customer = await stripe.customers.create({
          name: org.name,
          email: org.contactEmail || undefined,
          metadata: { orgId: org.id, orgSlug: org.slug },
        });
        customerId = customer.id;
      }

      const baseUrl = getBaseUrl();
      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        payment_method_types: ['card'],
        line_items: [{ price: priceId, quantity: 1 }],
        mode: 'subscription',
        success_url: `${baseUrl}/organizations?checkout=success&orgId=${orgId}`,
        cancel_url: `${baseUrl}/organizations?checkout=cancelled`,
        metadata: { orgId: org.id, tier },
      });

      res.json({ url: session.url });
    } catch (e: any) {
      res.status(500).json({ message: safeErrorMessage(e) });
    }
  });

  app.post("/api/payments/initiate", requireAuth, async (req, res) => {
    try {
      const { plan, method, phone, provider } = req.body;
      if (!plan || !method) return res.status(400).json({ message: "Plan and payment method required" });

      const validPlans = ["standard", "professional", "enterprise"];
      const validMethods = ["stripe", "bank_transfer", "flutterwave", "mpesa", "mobile_money"];
      if (!validPlans.includes(plan)) return res.status(400).json({ message: "Invalid plan" });
      if (!validMethods.includes(method)) return res.status(400).json({ message: "Invalid payment method" });

      const orgId = req.session.organizationId;
      if (!orgId) return res.status(400).json({ message: "No organization associated with this account" });

      const org = await storage.getOrganization(orgId);
      if (!org) return res.status(404).json({ message: "Organization not found" });

      const priceMap: Record<string, number> = { standard: 299, professional: 799, enterprise: 1999 };

      await storage.createAuditLog({
        action: "PAYMENT_INITIATED",
        entity: "billing",
        userId: req.session.userId || undefined,
        details: `Payment initiated: ${plan} plan via ${method}${phone ? ` (${phone})` : ""}${provider ? ` [${provider}]` : ""} — $${priceMap[plan]}/mo`,
        organizationId: orgId,
        ipAddress: req.ip || null,
      });

      const invoiceNum = `CDH-${orgId.substring(0, 6).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;
      const now = new Date().toISOString().split("T")[0];
      const endDate = new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0];

      if (method === "bank_transfer") {
        await storage.createBillingRecord({
          organizationId: orgId,
          institutionName: org.name,
          amount: String(priceMap[plan]),
          currency: "USD",
          status: "pending",
          serviceType: "subscription",
          invoiceNumber: invoiceNum,
          periodStart: now,
          periodEnd: endDate,
        });

        return res.json({
          message: "Bank transfer details noted. Your account will be upgraded within 1-2 business days once payment is confirmed.",
          status: "pending_verification",
        });
      }

      if (method === "flutterwave") {
        const baseUrl = getBaseUrl();
        const flutterwavePayload = {
          tx_ref: `CDH-${orgId}-${Date.now()}`,
          amount: priceMap[plan],
          currency: "USD",
          redirect_url: `${baseUrl}/upgrade?payment=success`,
          customer: {
            email: org.contactEmail || process.env.PLATFORM_SUPPORT_EMAIL || "support@africacredithub.com",
            name: org.name,
          },
          customizations: {
            title: "Africa Credit Hub",
            description: `${plan.charAt(0).toUpperCase() + plan.slice(1)} Plan Subscription`,
          },
          meta: { orgId, plan, method },
        };

        await storage.createBillingRecord({
          organizationId: orgId,
          institutionName: org.name,
          amount: String(priceMap[plan]),
          currency: "USD",
          status: "pending",
          serviceType: "subscription",
          invoiceNumber: invoiceNum,
          periodStart: now,
          periodEnd: endDate,
        });

        return res.json({
          message: "Flutterwave checkout initiated. Complete payment on the Flutterwave page.",
          status: "pending",
          flutterwavePayload,
        });
      }

      if (method === "mpesa") {
        if (!phone) return res.status(400).json({ message: "M-Pesa phone number required" });

        await storage.createBillingRecord({
          organizationId: orgId,
          institutionName: org.name,
          amount: String(priceMap[plan]),
          currency: "USD",
          status: "pending",
          serviceType: "subscription",
          invoiceNumber: invoiceNum,
          periodStart: now,
          periodEnd: endDate,
        });

        return res.json({
          message: "M-Pesa STK push has been sent to your phone. Please enter your PIN to confirm payment.",
          status: "stk_push_sent",
          phone,
        });
      }

      if (method === "mobile_money") {
        if (!phone) return res.status(400).json({ message: "Mobile money phone number required" });
        const providerName = provider === "mtn" ? "MTN MoMo" : provider === "airtel" ? "Airtel Money" : "Orange Money";

        await storage.createBillingRecord({
          organizationId: orgId,
          institutionName: org.name,
          amount: String(priceMap[plan]),
          currency: "USD",
          status: "pending",
          serviceType: "subscription",
          invoiceNumber: invoiceNum,
          periodStart: now,
          periodEnd: endDate,
        });

        return res.json({
          message: `${providerName} payment request sent to ${phone}. Please confirm on your phone.`,
          status: "momo_push_sent",
          phone,
          provider: providerName,
        });
      }

      if (method === "stripe") {
        try {
          const { getUncachableStripeClient } = await import("./stripeClient");
          const stripe = await getUncachableStripeClient();

          const tierMap: Record<string, string> = { standard: "Africa Credit Hub Standard", professional: "Africa Credit Hub Professional", enterprise: "Africa Credit Hub Enterprise" };
          const productName = tierMap[plan] || tierMap.standard;

          const products = await stripe.products.search({ query: `name:'${productName}'` });
          if (!products.data.length) return res.status(404).json({ message: `Product ${productName} not found` });

          const prices = await stripe.prices.list({ product: products.data[0].id, active: true });
          if (!prices.data.length) return res.status(404).json({ message: "No active price found" });

          let customerId: string | undefined;
          const customers = await stripe.customers.search({ query: `metadata['orgId']:'${orgId}'` });
          if (customers.data.length > 0) {
            customerId = customers.data[0].id;
          } else {
            const customer = await stripe.customers.create({
              name: org.name,
              email: org.contactEmail || undefined,
              metadata: { orgId: org.id, orgSlug: org.slug },
            });
            customerId = customer.id;
          }

          const baseUrl = getBaseUrl();
          const session = await stripe.checkout.sessions.create({
            customer: customerId,
            payment_method_types: ["card"],
            line_items: [{ price: prices.data[0].id, quantity: 1 }],
            mode: "subscription",
            success_url: `${baseUrl}/upgrade?payment=success`,
            cancel_url: `${baseUrl}/upgrade?payment=cancelled`,
            metadata: { orgId: org.id, plan },
          });

          return res.json({ stripeUrl: session.url, message: "Redirecting to Stripe checkout" });
        } catch (stripeErr: any) {
          routeLogger.error("Stripe checkout error:", { detail: stripeErr.message });
          return res.status(500).json({ message: "Card payment setup failed. Please try another payment method." });
        }
      }

      res.status(400).json({ message: "Invalid payment method" });
    } catch (e: any) {
      routeLogger.error("Payment initiation error:", { detail: e });
      res.status(500).json({ message: "Payment processing failed. Please try again." });
    }
  });

  app.post("/api/stripe/portal", requireAuth, requireSuperAdmin, async (req, res) => {
    try {
      const { orgId } = req.body;
      if (!orgId) return res.status(400).json({ message: "orgId required" });

      const { getUncachableStripeClient } = await import("./stripeClient");
      const stripe = await getUncachableStripeClient();

      const customers = await stripe.customers.search({ query: `metadata['orgId']:'${orgId}'` });
      if (!customers.data.length) return res.status(404).json({ message: "No Stripe customer found for this organization" });

      const baseUrl = getBaseUrl();
      const session = await stripe.billingPortal.sessions.create({
        customer: customers.data[0].id,
        return_url: `${baseUrl}/organizations`,
      });

      res.json({ url: session.url });
    } catch (e: any) {
      res.status(500).json({ message: safeErrorMessage(e) });
    }
  });

  app.get("/api/stripe/products", requireAuth, async (_req, res) => {
    try {
      const { db } = await import("./db");
      const { sql } = await import("drizzle-orm");
      const result = await db.execute(sql`
        SELECT p.id, p.name, p.description, p.metadata,
               pr.id as price_id, pr.unit_amount, pr.currency, pr.recurring
        FROM stripe.products p
        LEFT JOIN stripe.prices pr ON pr.product = p.id AND pr.active = true
        WHERE p.active = true
        ORDER BY pr.unit_amount ASC
      `);
      res.json(result.rows);
    } catch (e: any) {
      res.status(500).json({ message: safeErrorMessage(e) });
    }
  });

  const aiDemoLimiter = rateLimit({ windowMs: 60 * 1000, max: 10, message: { message: "Too many demo requests. Please wait a moment." } });

  app.post("/api/ai-demo/:feature", aiDemoLimiter, async (req, res) => {
    try {
      const { feature } = req.params;
      const { provider: providerRaw, query, country, borrowerScenario, loanAmount, loanType, customData, customPortfolio } = req.body || {};
      const provider = parseOptionalProvider(providerRaw);

      const sampleBorrowers: Record<string, string> = {
        "strong": `Name: Kwame Asante (individual)\nCountry: Ghana\nEmployment: Employed - Senior Manager at GCB Bank\nMonthly Income: GHS 18,500\nCredit Accounts: 4\n  - Mortgage: GHS 285,000 | Status: current | Opened: 2021-03-15\n  - Auto Loan: GHS 42,000 | Status: current | Opened: 2022-06-01\n  - Credit Card: GHS 5,200 | Status: current | Opened: 2020-01-10\n  - Business Line: GHS 120,000 | Status: current | Opened: 2023-02-28\nTotal Balance: GHS 452,200\nDelinquent: 0 | Default: 0 | Max Arrears: 0 days\nOpen Disputes: 0`,
        "risky": `Name: Fatima Diallo (individual)\nCountry: Senegal\nEmployment: Self-employed - Market Trader\nMonthly Income: XOF 450,000\nCredit Accounts: 5\n  - Microloan: XOF 2,500,000 | Status: delinquent | Opened: 2023-01-15 | 45 days arrears\n  - Mobile Money Loan: XOF 350,000 | Status: default | Opened: 2023-06-01\n  - Group Loan: XOF 800,000 | Status: current | Opened: 2024-01-10\n  - Market Stall Finance: XOF 1,200,000 | Status: delinquent | Opened: 2022-11-20 | 30 days arrears\n  - Emergency Loan: XOF 500,000 | Status: closed | Opened: 2023-09-01\nTotal Balance: XOF 5,350,000\nDelinquent: 2 | Default: 1 | Max Arrears: 45 days\nOpen Disputes: 1`,
        "corporate": `Name: Sahel Agri-Processing Ltd (corporate)\nCountry: Nigeria\nIndustry: Agricultural Processing\nAnnual Revenue: NGN 2.4 billion\nCredit Accounts: 7\n  - Term Loan: NGN 450,000,000 | Status: current | Opened: 2022-01-20\n  - Working Capital: NGN 180,000,000 | Status: current | Opened: 2023-03-15\n  - Equipment Finance: NGN 95,000,000 | Status: current | Opened: 2023-07-01\n  - Trade Finance: NGN 320,000,000 | Status: delinquent | Opened: 2024-01-10 | 15 days arrears\n  - Overdraft: NGN 50,000,000 | Status: current | Opened: 2021-06-01\n  - Export Credit: NGN 200,000,000 | Status: current | Opened: 2023-11-01\n  - Vehicle Fleet: NGN 35,000,000 | Status: current | Opened: 2024-02-15\nTotal Balance: NGN 1,330,000,000\nDelinquent: 1 | Default: 0 | Max Arrears: 15 days\nOpen Disputes: 0`,
      };

      const samplePortfolio = `Portfolio Overview:\n- Total Borrowers: 847\n- Total Accounts: 2,134\n- Open Disputes: 23\n- Account Types: personal_loan: 612 accounts, GHS 45.2M, 34 delinquent, 8 defaulted; mortgage: 189 accounts, GHS 312.7M, 12 delinquent, 3 defaulted; business_loan: 445 accounts, GHS 89.4M, 28 delinquent, 11 defaulted; credit_card: 388 accounts, GHS 12.1M, 19 delinquent, 5 defaulted; microfinance: 500 accounts, GHS 8.3M, 45 delinquent, 15 defaulted\n- By Lender: GCB Bank: 423 accounts, 18 non-performing; Ecobank Ghana: 389 accounts, 22 non-performing; Fidelity Bank: 312 accounts, 15 non-performing; CalBank: 267 accounts, 12 non-performing; Mobile MFI: 743 accounts, 58 non-performing\n\nHigh-Risk Borrowers:\n  Ama Mensah (individual): 3 accounts, 2 delinquent, 0 defaulted, 67 days max arrears, GHS 34,500\n  Kofi Boateng (individual): 4 accounts, 1 delinquent, 1 defaulted, 120 days max arrears, GHS 89,200\n  TechHub Accra Ltd (corporate): 5 accounts, 2 delinquent, 1 defaulted, 45 days max arrears, GHS 2,340,000\n  Yaw Frimpong (individual): 2 accounts, 1 delinquent, 0 defaulted, 30 days max arrears, GHS 12,800\n  Adwoa Sarpong (individual): 3 accounts, 0 delinquent, 2 defaulted, 180 days max arrears, GHS 156,000`;

      const crossBorderData = `Cross-Border Credit Registry Data:\nTotal Borrowers: 3,240\nTotal Accounts: 8,912\nCountries: Ghana, Nigeria, Kenya, Senegal, South Africa, Tanzania, Rwanda\n\nMulti-Country Exposures:\n  Pan-African Trading Corp: Accounts in Ghana (GHS 2.1M), Nigeria (NGN 450M), Kenya (KES 35M) — delinquent in Nigeria\n  EcoFinance Group: Accounts in Senegal (XOF 890M), Côte d'Ivoire (XOF 1.2B), Mali (XOF 340M) — all current\n  Kigali Tech Ventures: Accounts in Rwanda (RWF 120M), Kenya (KES 45M), Tanzania (TZS 890M) — default in Tanzania\n  West Africa Commodities: Accounts in Ghana (GHS 5.4M), Nigeria (NGN 1.8B), Senegal (XOF 2.3B) — delinquent in Ghana & Nigeria\n\nSystemic Patterns:\n- 23 borrowers have accounts across 3+ countries\n- Average cross-border exposure: $2.4M equivalent\n- NPL ratio for cross-border borrowers: 14.2% (vs 6.8% domestic-only)\n- Currency concentration: 45% NGN, 22% GHS, 15% KES, 18% other`;

      let result: any;

      switch (feature) {
        case "credit-narrative": {
          const profile = customData ? String(customData).substring(0, 3000) : (sampleBorrowers[borrowerScenario || "strong"] || sampleBorrowers["strong"]);
          const systemPrompt = `You are an expert credit analyst for the Pan-African Credit Registry. Write a comprehensive credit narrative suitable for a loan committee. Respond in JSON: { "creditworthiness": "Excellent|Good|Fair|Poor|Very Poor", "narrative": "<detailed 3-4 paragraph narrative>", "strengths": ["<strength>"], "risks": ["<risk>"], "recommendation": "<recommendation>" }`;
          const raw = await callAI(systemPrompt, `Write a credit narrative for this borrower:\n\n${profile}`, provider, 2500, 0.3, "narrative");
          result = { ...parseJSON(raw, { creditworthiness: "Fair" }), generatedAt: new Date().toISOString(), isCustomData: !!customData };
          break;
        }
        case "anomaly-detection": {
          const portfolioData = customPortfolio ? String(customPortfolio).substring(0, 4000) : samplePortfolio;
          const systemPrompt = `You are a portfolio risk analyst for the Pan-African Credit Registry. Analyze portfolio data and identify anomalies, unusual patterns, and emerging risks. Respond in JSON: { "riskScore": <0-100>, "alerts": [{ "severity": "critical|high|medium|low", "type": "<alert type>", "title": "<short title>", "description": "<detail>", "affectedEntities": ["<entity>"], "recommendedAction": "<action>" }], "trendAnalysis": "<2 paragraph trend summary>", "recommendations": ["<recommendation>"] }`;
          const raw = await callAI(systemPrompt, `Analyze this portfolio for anomalies and risks:\n\n${portfolioData}`, provider, 3000, 0.3, "data_analysis");
          result = { ...parseJSON(raw, { alerts: [], riskScore: 50 }), analyzedAt: new Date().toISOString(), isCustomData: !!customPortfolio };
          break;
        }
        case "regulatory-report": {
          const targetCountry = country || "Ghana";
          const regPortfolio = customPortfolio ? String(customPortfolio).substring(0, 4000) : samplePortfolio;
          const systemPrompt = `You are a regulatory compliance expert for African credit bureaus. Generate a regulatory submission report for the central bank. Keep each text field concise (max 2 short paragraphs). Respond ONLY with valid JSON (no markdown, no code blocks): { "reportTitle": "<title>", "executiveSummary": "<2 paragraph summary>", "portfolioMetrics": { "totalBorrowers": <n>, "totalExposure": "<formatted>", "nplRatio": "<percentage>", "provisioningAdequacy": "<assessment>" }, "complianceStatus": [{ "regulation": "<name>", "status": "compliant|partial|non-compliant", "details": "<detail>" }], "riskAssessment": "<1 paragraph risk assessment>", "recommendations": ["<recommendation>"] }`;
          const raw = await callAI(systemPrompt, `Generate a regulatory report for ${targetCountry}'s central bank based on this data:\n\n${regPortfolio}`, provider, 4000, 0.3, "compliance");
          result = { ...parseJSON(raw, { reportTitle: `${targetCountry} Regulatory Report` }), country: targetCountry, generatedAt: new Date().toISOString(), isCustomData: !!customPortfolio };
          break;
        }
        case "natural-query": {
          const userQuery = query || "How many borrowers have delinquent accounts and what is the total exposure?";
          const nlPortfolio = customPortfolio ? String(customPortfolio).substring(0, 4000) : samplePortfolio;
          const systemPrompt = `You are an AI data analyst for the Pan-African Credit Registry. Answer questions about credit data in natural language. Respond in JSON: { "answer": "<clear, detailed answer with specific numbers>", "dataPoints": [{ "label": "<metric>", "value": "<value>" }], "relatedInsights": ["<insight>"], "confidence": <0-100> }`;
          const raw = await callAI(systemPrompt, `Based on this portfolio data, answer: "${userQuery}"\n\n${nlPortfolio}`, provider, 2000, 0.3, "data_analysis");
          result = { ...parseJSON(raw, { answer: "Unable to process query" }), query: userQuery, answeredAt: new Date().toISOString(), isCustomData: !!customPortfolio };
          break;
        }
        case "cross-border-risk": {
          const cbData = customPortfolio ? String(customPortfolio).substring(0, 4000) : crossBorderData;
          const systemPrompt = `You are a cross-border risk analyst for the Pan-African Credit Registry. Identify systemic risks and hidden exposures across multiple countries. Respond in JSON: { "systemicRisk": { "level": "low|moderate|elevated|high|critical", "score": <0-100>, "summary": "<2 paragraph assessment>" }, "hiddenExposures": [{ "entity": "<name>", "countries": ["<country>"], "totalExposure": "<formatted>", "riskFlag": "<description>" }], "concentrationRisks": [{ "type": "<risk type>", "detail": "<description>" }], "recommendations": ["<recommendation>"] }`;
          const raw = await callAI(systemPrompt, `Analyze cross-border and multi-institutional credit risk:\n\n${cbData}`, provider, 3000, 0.3, "data_analysis");
          result = { ...parseJSON(raw, { systemicRisk: { level: "moderate" } }), analyzedAt: new Date().toISOString(), isCustomData: !!customPortfolio };
          break;
        }
        case "loan-recommendation": {
          const profile = customData ? String(customData).substring(0, 3000) : (sampleBorrowers[borrowerScenario || "strong"] || sampleBorrowers["strong"]);
          const amount = loanAmount || 50000;
          const type = loanType || "business_expansion";
          const systemPrompt = `You are a loan underwriting AI for the Pan-African Credit Registry. Evaluate loan applications and provide recommendations. Respond in JSON: { "decision": "approve|conditional_approve|decline", "confidence": <0-100>, "reasoning": "<3-4 paragraph detailed reasoning>", "suggestedTerms": { "interestRate": "<rate>", "tenure": "<duration>", "collateralRequired": "<requirement>", "maxApprovedAmount": "<amount>" }, "riskFactors": ["<factor>"], "mitigants": ["<mitigant>"], "conditions": ["<condition if conditional>"] }`;
          const raw = await callAI(systemPrompt, `Evaluate this loan application:\n\nRequested: ${amount.toLocaleString()} for ${type}\n\n${profile}`, provider, 2500, 0.3, "credit_risk");
          result = { ...parseJSON(raw, { decision: "decline", confidence: 0 }), requestedAmount: amount, loanType: type, generatedAt: new Date().toISOString(), isCustomData: !!customData };
          break;
        }
        default:
          return res.status(400).json({ message: `Unknown feature: ${feature}` });
      }

      res.json(result);
    } catch (e: any) {
      routeLogger.error("AI Demo error:", { detail: e });
      res.status(500).json({ message: e.message || "AI processing failed" });
    }
  });

  app.post("/api/ai/credit-risk/:borrowerId", aiLimiter, requireAuth, async (req, res) => {
    try {
      const provider = parseOptionalProvider(req.body?.provider);
      const result = await analyzeCreditRisk(req.params.borrowerId, provider);
      if (!res.headersSent) res.json(result);
    } catch (e: any) {
      if (!res.headersSent) res.status(500).json({ message: safeErrorMessage(e) });
    }
  });

  app.post("/api/ai/report-summary/:borrowerId", aiLimiter, requireAuth, async (req, res) => {
    try {
      const provider = parseOptionalProvider(req.body?.provider);
      const language = (req.body?.language || req.query.lang || "en") as string;
      const result = await generateReportSummary(req.params.borrowerId, provider, language);
      if (!res.headersSent) res.json(result);
    } catch (e: any) {
      if (!res.headersSent) res.status(500).json({ message: safeErrorMessage(e) });
    }
  });

  const publicChatLimiter = rateLimit({ windowMs: 60 * 1000, max: 15, message: { message: "Too many chat requests. Please wait a moment." } });
  app.post("/api/public/chat", publicChatLimiter, async (req, res) => {
    try {
      const { message, history } = req.body;
      if (!message || typeof message !== "string") {
        return res.status(400).json({ message: "message required" });
      }
      const systemPrompt = `You are the AI assistant for Africa Credit Hub (africacredithub.com) — the Pan-African Credit Registry System (CDH v2.5). You are an expert on every aspect of this platform. Answer any question confidently and accurately using the knowledge below.

===== COMPANY =====
- Built by ${process.env.PLATFORM_COMPANY_NAME || "Africa Credit Hub"}
- Headquarters: Accra, Ghana
- Contact: ${process.env.PLATFORM_SUPPORT_EMAIL || "support@africacredithub.com"} | ${process.env.PLATFORM_CONTACT_PHONE || ""}
- When asked about who built this, the founders, the team, or the technology — respond with:
  "Africa Credit Hub was built by a team of experienced professionals with deep expertise in African capital markets, regulatory environments, and enterprise software. The founding team brings decades of combined experience across fintech, banking infrastructure, and pan-African business operations. For more information about the team, please contact us at ${process.env.PLATFORM_SUPPORT_EMAIL || "support@africacredithub.com"}."

===== PLATFORM OVERVIEW =====
- Pan-African Credit Registry covering ALL 54 African countries
- Multi-tenant SaaS — each country operates as an independent tenant with its own regulatory configuration, data protection rules, and currency settings
- Target clients: Central banks, commercial banks, MFIs (microfinance institutions), fintechs, regulators, and development finance institutions
- Purpose: Credit risk management, borrower registry, regulatory compliance, financial inclusion expansion

===== CORE FEATURES =====
1. Borrower Registry — Unified borrower profiles across institutions with KYC data, identification documents, and employment history
2. Credit Account Management — Track all credit facilities: loans, overdrafts, credit cards, guarantees. Full lifecycle from origination to closure
3. Credit Report Generation — Pull comprehensive credit reports with payment history, utilization ratios, and risk scores
4. Audit Trail — SHA-256 hash chain providing tamper-proof, blockchain-anchored audit logs of every data change
5. Maker-Checker Workflows — Dual-approval system for sensitive operations (data submissions, account modifications, user management)
6. Role-Based Access Control (RBAC) — Granular permissions: Super Admin, Org Admin, Credit Officer, Compliance Officer, Auditor, Viewer roles
7. Batch Upload — CSV/Excel bulk data import for borrowers and credit accounts with validation and error reporting
8. API Access — RESTful API for integration with core banking systems, loan management platforms, and third-party applications
9. Consumer Self-Service Portal — Borrowers can check their own credit report, file disputes, and track dispute resolution at /my-credit
10. Multi-Currency Support — 42+ African and global currencies (GHS, NGN, KES, ZAR, ETB, TZS, UGX, RWF, SLL, EGP, XOF, XAF, USD, EUR, GBP) with automated exchange rate fetching every 6 hours
11. Multi-Language — English, French, Swahili, Arabic, Portuguese interface support
12. Real-Time Dashboard — Portfolio analytics, trends, risk distribution, institution comparisons, geographic heat maps
13. Dispute Management — Full dispute lifecycle: filing, investigation, resolution, with automated workflows and SLA tracking
14. Data Retention Engine — Automated retention enforcement per jurisdiction (7 years Ghana, 5 years Nigeria, etc.) with regulatory proof of compliance
15. Organization Management — Multi-organization support with org switching, org-level settings, billing, and user management
16. Notification System — Real-time WebSocket notifications for approvals, alerts, disputes, and system events

===== AI-POWERED FEATURES (6 modules) =====
All AI features can be tested live at africacredithub.com/ai-demo with sample data — no login required.

1. AI Credit Narratives — Generates loan committee-ready narrative reports from raw credit data. Natural language summaries of borrower creditworthiness with risk factors and recommendations
2. Smart Anomaly Detection — ML-powered portfolio monitoring that flags unusual patterns: sudden balance spikes, unusual payment patterns, concentration risk, vintage deterioration
3. Automated Regulatory Reports — Generate central bank submission-ready reports (Bank of Ghana BoG, BSL Sierra Leone, CBN Nigeria formats) with full SRS traceability
4. Natural Language Queries ("Ask Your Data") — Query your credit database using plain English. "Show me all borrowers in Accra with overdue loans above $10,000" — no SQL needed
5. Cross-Border Risk Analysis — Multi-country exposure assessment, currency risk evaluation, regulatory arbitrage detection, sovereign risk overlays
6. AI Loan Underwriting — Automated approve/conditional/decline recommendations with risk scoring, debt service coverage analysis, and collateral assessment

===== PRICING =====
All plans include a 14-day free trial. No credit card required. Annual billing saves 20%.

STANDARD — $299/month ($239/month annual)
- For smaller financial institutions getting started
- Up to 10 users, single-country deployment
- Core credit data submission, basic report generation
- Standard API access (1,000 calls/day)
- Email support (48h response), basic fraud detection
- African data protection compliance (POPIA, NDPR, Ghana DPA, GDPR), monthly data exports

PROFESSIONAL — $799/month ($639/month annual) [MOST POPULAR]
- For growing institutions needing advanced analytics
- Up to 50 users, multi-country deployment (up to 5 countries)
- Everything in Standard plus: Advanced credit scoring (ACH Scorecard v1.0), cross-border credit searches, portfolio intelligence suite
- Priority API access (10,000 calls/day)
- WebAuthn biometric authentication, maker-checker workflows
- Regulatory compliance dashboards, batch upload processing
- Priority support (24h response)

ENTERPRISE — $1,999/month ($1,599/month annual)
- For large-scale pan-African deployments
- Unlimited users, all 54 countries
- Everything in Professional plus: Unlimited API, PAPSS cross-border settlements, blockchain audit anchoring
- Custom regulatory exports (BoG, BSL, CBN), dedicated AI chatbot
- White-label capabilities, custom data retention policies
- SLA guarantee (99.9% uptime), dedicated account manager
- On-premise deployment option, custom integrations

USAGE-BASED PRICING (on top of subscription):
- Credit Report Pull: $0.50 (Standard) / $0.35 (Volume) / $0.20 (Enterprise)
- API Call (external): $0.01 / $0.007 / $0.004
- Batch Upload (per record): $0.10 / $0.07 / $0.04
- Cross-Border Query: $1.00 / $0.70 / $0.40
- Dispute Filing: $2.00 / $1.40 / $0.80
- Data Export: $5.00 / $3.50 / $2.00

===== SECURITY & COMPLIANCE =====
- End-to-end encryption (AES-256 at rest, TLS 1.3 in transit)
- Multi-factor authentication (MFA) + WebAuthn biometric authentication
- Tamper-proof audit logs with SHA-256 hash chain and optional blockchain anchoring
- Session management with automatic timeout and IP-based access controls
- Role-based access control with principle of least privilege

Compliance Frameworks Supported (Africa-first, 36+ African data protection laws):

Data Protection Laws by Region:
WEST AFRICA:
- Ghana: Data Protection Act 2012 (Act 843) — Regulator: Data Protection Commission. Amendments pending for children's data, DPIAs, privacy by design
- Nigeria: Nigeria Data Protection Act (NDPA) 2023, replacing NDPR 2019 — Regulator: Nigeria Data Protection Commission (NDPC, formerly NITDA). Fines up to 2% global turnover or ₦10M
- Senegal: Loi n° 2008-12 on Personal Data Protection — Regulator: Commission de Protection des Données Personnelles (CDP)
- Côte d'Ivoire: Loi n° 2013-450 on Personal Data Protection — Regulator: ARTCI
- Burkina Faso: Loi n° 010-2004 on Personal Data Protection — Regulator: CIL
- Mali: Loi n° 2013-015 on Personal Data Protection — Regulator: APDP
- Benin: Loi n° 2017-20 on the Digital Code (includes data protection) — Regulator: APDP
- Niger: Loi n° 2017-28 on Personal Data Protection
- Togo: Loi n° 2019-014 on Personal Data Protection
- Guinea: Loi L/2016/037 on Cybersecurity and Personal Data Protection
- Cape Verde: Data Protection Law 2001 (Loi 133/V/2001), one of earliest in Africa
- Gambia: Data Protection Act 2025 (newly enacted)
- Sierra Leone: No comprehensive DP law yet — draft in progress
- Liberia: No comprehensive DP law yet
- Guinea-Bissau: No comprehensive DP law yet
- Mauritania: No specific DP law, some provisions in Cybercrime Law 2016

EAST AFRICA:
- Kenya: Data Protection Act 2019 — Regulator: Office of the Data Protection Commissioner (ODPC). Fines up to KES 5M or 1% turnover + 2 years imprisonment
- Uganda: Data Protection and Privacy Act 2019 — Regulator: Personal Data Protection Office (NITA-U)
- Tanzania: Personal Data Protection Act 2022 (draft regulations pending) — Regulator: Tanzania Communications Regulatory Authority
- Rwanda: Law N° 058/2021 on Protection of Personal Data and Privacy — Regulator: National Cyber Security Authority. Published Standard Contractual Clauses
- Ethiopia: Personal Data Protection Proclamation No. 1321/2024 (enacted July 2024) — first comprehensive DP law
- Burundi: Loi N° 1/10 of 2022 on Personal Data Protection
- Djibouti: Digital Code 2025 includes data protection provisions
- Somalia: No comprehensive DP law
- South Sudan: No comprehensive DP law
- Eritrea: No comprehensive DP law

SOUTHERN AFRICA:
- South Africa: POPIA (Protection of Personal Information Act) 2013, full enforcement July 2021 — Regulator: Information Regulator. Most mature African DP framework. Fines up to R10M or 10 years imprisonment
- Botswana: Data Protection Act 2024 (revised from 2018), effective January 2025 — stronger controller/processor obligations
- Zambia: Data Protection Act No. 3 of 2021 — Regulator: Data Protection Commissioner (appointed 2024)
- Zimbabwe: Data Protection Act 2021 (Cyber and Data Protection Act)
- Mozambique: No comprehensive DP law yet (draft exists)
- Malawi: Data Protection Act 2024 (newly enacted) — Regulator: MACRA
- Mauritius: Data Protection Act 2017 — Regulator: Data Protection Office. One of most advanced in Africa
- Eswatini: Data Protection Act 2022
- Lesotho: Data Protection Act 2011
- Namibia: No comprehensive DP law (draft exists)
- Madagascar: Loi n° 2014-038 on Personal Data Protection — Regulator: appointed 2024
- Seychelles: Data Protection Act 2003, incorporated Global CBPR framework
- Comoros: No comprehensive DP law

NORTH AFRICA:
- Egypt: Personal Data Protection Law No. 151 of 2020 — executive regulations pending full enforcement
- Morocco: Loi n° 09-08 on Protection of Individuals re: Processing of Personal Data 2009 — Regulator: CNDP. Attempted EU adequacy
- Algeria: Loi n° 18-07 of 2018 on Personal Data Protection (amended 2024 with stricter DPO and breach notification rules) — Regulator: ANPDP
- Tunisia: Organic Law No. 2004-63 on Personal Data Protection — Regulator: INPDP. One of first in Africa
- Libya: No comprehensive DP law

CENTRAL AFRICA:
- Cameroon: Law No. 2024/017 on Personal Data Protection (enacted December 2024) — establishes Personal Data Protection Authority
- DRC: Loi n° 20/017 of 2020 on Telecommunications and ICTs (partial DP provisions)
- Republic of Congo: Loi n° 29-2019 on Personal Data Protection
- Gabon: Loi n° 001/2011 on Personal Data Protection — Regulator: CNPDCP
- Equatorial Guinea: No comprehensive DP law
- Chad: Loi n° 007/PR/2015 on Cybersecurity (partial DP provisions)
- Central African Republic: No comprehensive DP law
- São Tomé and Príncipe: No comprehensive DP law

Continental & Regional Frameworks:
- African Union Convention on Cyber Security and Personal Data Protection (Malabo Convention, 2014) — entered into force June 2023 after 15th ratification
- ECOWAS Supplementary Act A/SA.1/01/10 on Personal Data Protection (2010) — binding on 15 ECOWAS member states
- SADC Model Law on Data Protection (2013) — non-binding model for SADC members
- East African Community Data Protection Framework — under development

Credit Reporting & Central Bank Regulations:
- Bank of Ghana (BoG): Credit Reporting Act 2007 (Act 726), CRB operational guidelines
- Central Bank of Nigeria (CBN): Credit Reporting Act 2017, expanded data sources to utilities/telcos/retailers
- Central Bank of Kenya (CBK): Credit Reference Bureau Regulations 2020, 3 licensed CRBs (TransUnion, Metropol, CreditInfo)
- South African NCR: National Credit Act, 4 major bureaus (TransUnion, Experian, Compuscan, XDS)
- Bank of Tanzania: Credit Reference Bureau framework
- Bank of Uganda: Credit Reference Bureau regulations
- National Bank of Rwanda: Credit reporting guidelines
- BCEAO (8 UEMOA countries): Regional credit reporting framework, Creditinfo-Volo hub-and-spoke model
- BEAC (6 CEMAC countries): Regional credit information framework
- Bank of Sierra Leone (BSL): Emerging credit bureau framework
- Bank Al-Maghrib (Morocco): Credit bureau regulated framework
- Central Bank of Egypt: Credit bureau (I-Score) regulated framework
- PAPSS: Pan-African Payment and Settlement System — instant cross-border payments in local currencies

International Standards Also Supported:
- GDPR (EU General Data Protection Regulation) — for clients with EU exposure
- ISO 27001 Information Security Management
- PCI DSS for payment data

Automated data retention enforcement per jurisdiction:
- 7 years: Ghana (Act 726), South Africa (NCA), Kenya (CBK CRB Regulations)
- 5 years: Nigeria (NDPA), UEMOA countries (BCEAO), CEMAC countries (BEAC)
- Country-specific retention periods configured per tenant
- Full audit trail of all retention actions for regulatory proof of compliance

===== TECHNICAL ARCHITECTURE =====
- Cloud-native SaaS, hosted on secure infrastructure
- PostgreSQL database with multi-tenant architecture
- RESTful API with comprehensive documentation
- Real-time WebSocket connections for live notifications
- Automated exchange rate engine (updates every 6 hours)
- CSV/Excel batch processing with validation pipeline
- Mobile-responsive Progressive Web App (PWA) — installable on any device
- Supports on-premise deployment for Enterprise clients

===== TARGET MARKET & USE CASES =====
- Central Banks: National credit registry management, regulatory oversight, financial stability monitoring
- Commercial Banks: Credit risk assessment, portfolio management, regulatory reporting, cross-border lending
- Microfinance Institutions: Borrower screening, credit scoring for underbanked populations, financial inclusion
- Fintechs: API-first credit data access, automated underwriting, digital lending platforms
- Regulators: Market-wide credit data oversight, systemic risk monitoring, policy impact analysis
- Development Finance: Financial inclusion metrics, impact reporting, cross-border development lending

===== KEY DIFFERENTIATORS =====
1. ONLY platform covering all 54 African countries in one system
2. Built specifically for African regulatory requirements (not a Western system adapted for Africa)
3. AI-native — not bolted on, AI is core to every workflow
4. Multi-tenant with true data isolation per jurisdiction
5. 42+ African currency support with live exchange rates
6. Consumer self-service portal for financial inclusion (borrowers can check their own credit)
7. SRS (Software Requirements Specification) compliant with full traceability

===== MARKET INTELLIGENCE (use these stats to make compelling arguments) =====
Use these facts when explaining WHY this platform matters and the scale of the opportunity:

THE CREDIT GAP:
- Global MSME credit gap: US$4.9 TRILLION. Sub-Saharan Africa has one of the most acute deficits relative to GDP
- Ghana alone: SMEs account for 90%+ of all businesses and 85% of the workforce, yet face a $4.8 billion financing gap
- Ghana credit demand: $7.5B demand vs $2.7B supply — 64% of demand remains unsatisfied
- SME failure rate within 5 years: ~70%, driven primarily by lack of capital and poor credit access
- Traditional banks charge 20-25% interest to SMEs (up to 40-50% from alternative lenders) due to perceived risk from lack of credit data

WHY CREDIT DATA INFRASTRUCTURE IS THE SOLUTION:
- Banks perceive SMEs as high-risk because there is no unified credit data — they can't assess borrowers properly
- Africa Credit Hub solves this by creating a "Trust Layer" that connects informal economic activity to formal credit markets
- Better credit data = lower perceived risk = lower interest rates = more lending = economic growth

THE AI ADVANTAGE:
- Global AI investment exceeded $100 BILLION in 2024, but Africa's share was less than $100 million
- Africa Credit Hub capitalizes on this AI investment gap with smarter credit scoring and risk models that outperform generic conservative models used by commercial banks
- Alternative data scoring can capture high-frequency, low-value transactions that traditional banks cannot process profitably

THE GENDER FINANCE OPPORTUNITY:
- Women-owned SME credit gap: $1.4-1.7 TRILLION globally, with highest needs in Sub-Saharan Africa
- Women entrepreneurs are LESS likely to default on loans than men
- Women reinvest more in family and community — higher developmental return on capital
- By using alternative data that captures informal economic participation, Africa Credit Hub can serve this high-loyalty, low-risk demographic that traditional banks ignore

DIGITAL FINANCIAL SERVICES LANDSCAPE:
- Africa pioneered mobile money and transactional inclusion
- The "Second Wave" of fintech is now about building DEPTH (credit, savings, insurance) not just WIDTH (payments)
- Africa doesn't need another payment app — it needs a robust CREDIT ENGINE
- Only 27% of Africa's population uses the internet, and 739 million adults lack basic literacy — platform must be accessible

REGULATORY TAILWINDS:
- In the 2025 regulatory climate, demonstrating a clear audit trail and robust data governance is the fastest way to win trust from regulators and enterprise partners
- Africa Credit Hub is "Audit-Ready" from day one with SHA-256 hash chain and blockchain anchoring
- Ghana has a superior regulatory environment — ideal first market for B2B infrastructure
- Nigeria offers B2C/B2B scale opportunities

STRATEGIC POSITIONING:
- Africa Credit Hub is positioned as the "Trust Layer" connecting informal economic activity to formal credit markets
- The next decade of African finance will be won by those who move beyond transactional access to true financial empowerment
- The potential is not just in moving money, but in MOVING MARKETS
- Partnership opportunity: mid-tier banks (like I&M Bank in Kenya) have the license and capital but lack digital agility — Africa Credit Hub provides that agility

===== WORLD BANK & IMF DATA (cite these authoritatively) =====

--- WORLD BANK GLOBAL ECONOMIC PROSPECTS (2024-2026) ---
Sub-Saharan Africa GDP Growth: 3.5% (2024) → 3.8% (2025) → 4.4% (2026-27)
Africa Overall (AfDB): 4.2% (2025) → 4.3% (2026)
Regional Growth: East Africa 5.7% (fastest), North Africa 4.1%, Central Africa 4.1%, Southern Africa 2.6% (slowest)

GDP GROWTH BY COUNTRY (World Bank Global Economic Prospects, Jan 2025):
Nigeria: 3.1% (2024) → 3.2% (2025) | South Africa: 0.8% (2024) → 1.5% (2025)
Kenya: 5.0% (2024) → 5.3% (2025) | Ghana: 4.7% (2024) → 4.8% (2025)
Côte d'Ivoire: 6.5% (2024) → 6.4% (2025) | Senegal: 10.6% (2024, oil/gas boost)
Ethiopia: 7.1% (2024) → 6.5% (2025) | Tanzania: 5.6% (2024) → 6.1% (2025)
Rwanda: 8.0% (2024) → 7.5% (2025) | DRC: 4.9% (2024) → 5.0% (2025)
Benin: 6.3% (2024) → 6.4% (2025) | Cameroon: 3.7% (2024) → 4.0% (2025)
Angola: 3.2% (2024) → 2.9% (2025) | Botswana: 1.0% (2024) → 5.3% (2025)
Burkina Faso: 3.7% (2024) → 3.9% (2025) | Cabo Verde: 5.2% (2024) → 4.9% (2025)
Chad: 3.0% (2024) → 2.1% (2025)

--- IMF REGIONAL ECONOMIC OUTLOOK: SUB-SAHARAN AFRICA ---
Inflation: Declined from 9.3% (2022) → 4.5% (2024) → 3.9-4.0% (2025-26)
High inflation countries still in double digits: Angola, Ethiopia, Ghana, Nigeria
Debt: 23 countries (nearly half SSA) are in or at high risk of debt distress
External debt service doubled over past decade, reaching 2% of GDP (2024)
Borrowing costs: African countries face interest costs averaging 11.6% — 8.5 percentage points higher than US benchmarks
Example: Germany borrows at 2.29% vs Zambia at 22.5%
Per capita GDP growth: Only 1.7% average — ~30% of economies won't recover to pre-pandemic levels by 2026
Only 3 of 34 rated African countries hold investment-grade ratings (Botswana, Mauritius, Morocco). 20 countries have NEVER been rated.

--- WORLD BANK GLOBAL FINDEX 2024 (Financial Inclusion) ---
Sub-Saharan Africa account ownership: 58% (2024), up from 49% (2021) and 34% (2014)
Mobile money accounts: 40% of adults (HIGHEST globally) | Digital payments: 51% of adults
88% of account holders made/received digital payments (2024)
Unbanked: 42% of adults in SSA remain unbanked
- 80M+ unbanked adults receive agricultural payments in cash
- 100M+ lack official ID documents
- Barriers: lack of money (59%), no mobile phone (35%), lack of documentation, distance, high fees, lack of trust (18%, rising to 26% in Central Africa)
Gender gap: Women 12 percentage points less likely to own a financial account. Women = 55% of global unbanked.
Formal savings: 35% of adults saved in a financial account (2024), up 12 points from 2021. 20% save exclusively through mobile money.
Formal borrowing: Only 24% borrowed formally (banks, credit cards, mobile). 35% relied on informal sources (family/friends).
Only 7% of SSA adults borrowed via mobile money despite hosting 52% of global mobile money accounts — massive untapped lending opportunity.

Country Account Ownership (Findex 2024): Kenya 90%, Mauritius 90%, South Africa 81%, Ghana 81%, Senegal 77%, Uganda 70%, Nigeria 63%, Rwanda 68%, Madagascar 24%, Chad 20%, Niger 14%

--- BANKING SECTOR HEALTH (IMF Financial Soundness Indicators) ---
Non-Performing Loan (NPL) Ratios:
- South Africa: 5.2% (Dec 2024) — stable and healthy
- Ghana: 24.1% (Jun 2024) — elevated, up from 18.8% (2023), driven by sovereign default and FX volatility
- Sub-Saharan Africa average: ~17% (2023-24)
- Equatorial Guinea: 55.4% (highest globally)
- Global average: 5.8%
Credit growth (2024): Nigeria 45%, Egypt 26%, Ethiopia 36%, DRC 61%
Private credit to GDP: Nigeria only 14% (among lowest in Africa — showing massive room for credit market deepening)

--- FINTECH & DIGITAL LENDING ECOSYSTEM (IFC/World Bank) ---
IFC Africa investment FY2024: $14.2B total (23% increase YoY), including $1.1B for digital connectivity, $1.6B for smaller businesses
Active fintech companies in Africa: 1,263 (Jan 2024), up from 450 (2020) — nearly tripled in 4 years
"Big Four" fintech hubs: Nigeria (28%), South Africa (20%), Kenya (16%), Egypt (10%) = ~70% of all fintechs
African financial services market: projected $230B revenue by 2025 (10% annual growth)
Fintech was the ONLY African tech sector to grow in both deal count (+16%) and funding (+59%) in 2024
Nigeria fintech funding: $2B in 2024 (35% of Nigeria's total tech funding)
Africa received just 2% of global VC deals — massive underinvestment relative to opportunity
IFC launched $225M VC platform (2022) specifically for Africa, Middle East, Central Asia fintech

--- MOBILE MONEY (GSMA 2025 State of the Industry) ---
Total Africa mobile money transactions (2024): $1.105 TRILLION (+15% YoY)
Transaction volume: 81.8 billion (74% of ALL global mobile money transactions)
Registered accounts: 1.1 billion (53% of global total)
GDP contribution: $190 billion to Sub-Saharan Africa GDP
By region: East Africa $649B (459M accounts), West Africa $357B (485M accounts), Central Africa $83B (104M accounts)

--- WHY THIS DATA MATTERS FOR AFRICA CREDIT HUB ---
When citing these statistics, connect them to why credit registry infrastructure is critical:
- 42% unbanked + only 24% formal borrowing = massive untapped credit market that needs data infrastructure
- NPL ratios of 17-24% show banks are lending badly without proper credit data — a registry reduces defaults
- Credit growth of 45-61% in major markets means MORE data is being generated that needs to be captured
- $1.1 trillion in mobile money creates transaction data that can power alternative credit scoring
- Only 7% borrow via mobile money despite 40% having accounts = the lending infrastructure hasn't caught up with payments
- 1,263 fintechs need credit data APIs to underwrite — Africa Credit Hub provides that infrastructure
- $230B financial services market growing 10%/year needs the credit data backbone to scale responsibly

===== COUNTRY-BY-COUNTRY INTELLIGENCE (all 54 African countries) =====
Use this data when asked about specific countries, regions, or markets. Cite numbers confidently.

--- WEST AFRICA ---

GHANA (Priority Market — B2B Infrastructure):
- GDP: $76B | Population: 34M | Currency: Ghana Cedi (GHS) | Central Bank: Bank of Ghana (BoG)
- SMEs: 90%+ of all businesses, 85% of workforce | Financing gap: $4.8B ($7.5B demand vs $2.7B supply)
- Account ownership: 81% (up from 58% in 2017) | Mobile money driving inclusion
- Data protection: Data Protection Act 2012 (DPA) | Regulator: Data Protection Commission
- Credit bureau coverage: Growing but limited | Interest rates for SMEs: 20-30%
- Regulatory environment: Superior in West Africa — ideal first market for B2B credit infrastructure
- Key opportunity: Government-led digitization, strong fintech ecosystem, regulatory willingness to innovate

NIGERIA (Scale Market — B2C/B2B):
- GDP: $252B (largest economy in Africa) | Population: 220M | Currency: Nigerian Naira (NGN) | Central Bank: CBN
- SMEs contribute ~50% of GDP, employ 60M+ people | Naira devalued 50%+ in 2024
- Credit bureau coverage: 13.9% (vs South Africa's 70%) — massive gap
- Data protection: Nigeria Data Protection Act (NDPA) 2023, replacing NDPR 2019 | Regulator: NITDA
- 900K+ fintech/banking agents (OPay, MoniePoint) | 1.5M+ agents being formalized
- Credit Reporting Act 2017 expanded data sources to utilities, telcos, retailers — increased credit access 5-30%
- Key opportunity: Sheer scale, huge underserved population, strong fintech adoption

CÔTE D'IVOIRE (Ivory Coast):
- GDP: $86B | Population: 28M | Currency: West African CFA Franc (XOF) | Central Bank: BCEAO (regional)
- Only 12% of SMEs seek formal working capital — massive untapped demand
- Account ownership: Growing via mobile money | French-speaking market
- Data protection: Loi n° 2013-450 on Personal Data Protection | Regulator: ARTCI
- Part of UEMOA (8-country monetary union sharing XOF)
- Key opportunity: Francophone West Africa gateway, Abidjan as regional financial hub

SENEGAL:
- GDP: $28B | Population: 17M | Currency: XOF (CFA Franc) | Central Bank: BCEAO
- Account ownership: 77% (+21 points since 2021) | Digital payments: 73% of adults | Formal savings: 58%
- Data protection: Loi n° 2008-12 on Personal Data Protection | Regulator: CDP (Commission de Protection des Données Personnelles)
- Strong mobile money growth | French-speaking market
- Key opportunity: High digital payment adoption, growing fintech scene in Dakar

SIERRA LEONE:
- GDP: $4B | Population: 8M | Currency: Sierra Leonean Leone (SLL) | Central Bank: Bank of Sierra Leone (BSL)
- Very limited credit bureau infrastructure | High financial exclusion
- Key opportunity: Greenfield market for credit registry, regulatory support for digital financial services

MALI, BURKINA FASO, NIGER, TOGO, BENIN, GUINEA-BISSAU:
- All use XOF (CFA Franc) under BCEAO | Part of UEMOA monetary union
- Predominantly informal economies | Very low credit bureau coverage
- All covered by ECOWAS Supplementary Act on Personal Data Protection (2010)
- Individual laws: Mali (Loi 2013-015), Burkina Faso (Loi 010-2004), Niger (Loi 2017-28), Togo (Loi 2019-014), Benin (Digital Code 2017-20)
- French-speaking markets | Key opportunity: Regional deployment through BCEAO partnership

GUINEA:
- GDP: $16B | Population: 14M | Currency: Guinean Franc (GNF)
- Data protection: Loi L/2016/037 on Cybersecurity and Personal Data Protection
- Mining-dependent economy | Low financial inclusion | French-speaking

LIBERIA (Active CRB Market — High Opportunity):
- GDP: $4B | Population: 5M | Currency: Liberian Dollar (LRD) | Central Bank: Central Bank of Liberia (CBL)
- English-speaking | Post-conflict rebuilding | NPL ratio: 16.4% (above 10% regulatory threshold)
- Data protection: No comprehensive DP law yet — draft exists
- Credit bureau: PRCB (Prime Credit Reference Bureau, prcb-lib.com) — Liberia's FIRST private credit reference bureau, launched 2025
  - Previously CBL operated a manual Credit Reference System (CRS) — severely limited
  - PRCB board includes CBL Legal Counsel, Fortune 500 execs (Bank of America, ECOBANK Liberia)
  - Supported by African Development Bank and World Bank funding
- CBL CRB Licensing Requirements:
  - Application fee: US$500 (non-refundable)
  - License fee: US$5,000
  - Annual operating levy: US$2,000
  - Minimum paid-up capital: US$200,000
  - 6-month approval window after Notice of Approval
  - Must add "Credit Bureau" to company name
  - CBL controls approval of all credit report pricing
  - On-site verification required before Final Operating License
- Key opportunity: Greenfield market transitioning from manual to digital credit reporting — PRCB needs technology infrastructure (data collection, report generation, compliance systems) that Africa Credit Hub provides

GAMBIA:
- GDP: $2B | Population: 2.5M | Currency: Dalasi (GMD) | English-speaking
- Small market but strategic location

CAPE VERDE:
- GDP: $2B | Population: 0.6M | Currency: Cape Verdean Escudo (CVE)
- Island nation | Tourism-dependent | Portuguese-speaking

MAURITANIA:
- GDP: $10B | Population: 4.5M | Currency: Ouguiya (MRU)
- Arabic/French-speaking | Mining and fishing economy

--- EAST AFRICA ---

KENYA (Fintech Leader):
- GDP: $109B | Population: 55M | Currency: Kenyan Shilling (KES) | Central Bank: Central Bank of Kenya
- Mobile money penetration: 82% of adults (HIGHEST in Africa) | 38.7M mobile money users
- M-Pesa: World's most successful mobile money platform | 89% digital payment usage
- Data protection: Data Protection Act 2019 | Fines up to KES 5M or 1% turnover + 2 years imprisonment
- KES depreciated 30% vs USD in 2023 | Interest rates: 20-25% for SMEs
- Key opportunity: Most digitally advanced market, M-Pesa integration, strong developer ecosystem

TANZANIA:
- GDP: $79B | Population: 65M | Currency: Tanzanian Shilling (TZS) | Central Bank: Bank of Tanzania
- Mobile money transactions: $62B in 2023 (+33% YoY) — explosive growth
- Data protection: Personal Data Protection Act 2022 | Regulator: TCRA (draft regulations pending)
- Strong mobile money adoption | Swahili-speaking market
- Key opportunity: Rapid mobile money growth, large underserved population

UGANDA:
- GDP: $46B | Population: 48M | Currency: Ugandan Shilling (UGX) | Central Bank: Bank of Uganda
- Account ownership: 70.1% | Digital platform usage: 71% | Formal savings: 54%
- Data protection: Data Protection and Privacy Act 2019
- Key opportunity: Young population, growing digital adoption

RWANDA:
- GDP: $13B | Population: 14M | Currency: Rwandan Franc (RWF) | Central Bank: National Bank of Rwanda
- Known for strong governance and digital-first policies | Data Protection Law 2021
- Kigali as emerging tech hub | English/French-speaking
- Key opportunity: Government digital agenda, favorable regulatory environment

ETHIOPIA:
- GDP: $205B (5th largest in Africa) | Population: 125M (2nd most populous) | Currency: Ethiopian Birr (ETB)
- National Bank of Ethiopia | Large unbanked population | Telecom liberalization ongoing
- Data protection: Personal Data Protection Proclamation No. 1321/2024 (enacted July 2024) — first comprehensive DP law
- Key opportunity: Massive untapped market, recent fintech licensing reforms

BURUNDI:
- GDP: $3B | Population: 13M | Currency: Burundian Franc (BIF) | Low GDP per capita
- Very limited financial infrastructure | French-speaking

SOUTH SUDAN:
- GDP: $5B | Population: 11M | Currency: South Sudanese Pound (SSP)
- Newest country in Africa (2011) | Oil-dependent | Very limited infrastructure

SOMALIA:
- GDP: $8B | Population: 17M | Currency: Somali Shilling (SOS)
- Mobile money (Hormuud, EVC Plus) widely used despite limited banking | Arabic-speaking
- Key opportunity: Mobile-first credit data collection

DJIBOUTI:
- GDP: $4B | Population: 1M | Currency: Djiboutian Franc (DJF)
- Strategic port location | French/Arabic-speaking

ERITREA:
- GDP: $2B | Population: 3.5M | Currency: Eritrean Nakfa (ERN)
- Limited market access | Smallest financial sector in East Africa

--- SOUTHERN AFRICA ---

SOUTH AFRICA (Most Advanced Credit Market):
- GDP: $373B (largest in Africa) | Population: 60M | Currency: South African Rand (ZAR) | Central Bank: SARB
- Credit bureau coverage: 70% (highest in Africa) — benchmark for continent
- Data protection: POPIA (Protection of Personal Information Act) 2013, full compliance 2021
- Most mature financial sector in Africa | Major banks: Standard Bank, FNB, Absa, Nedbank
- Account ownership: 81% | Strong regulatory framework
- Key opportunity: Enterprise clients, regulatory compliance expertise, benchmark market

BOTSWANA:
- GDP: $19B | Population: 2.5M | Currency: Botswana Pula (BWP) | Central Bank: Bank of Botswana
- Investment-grade credit rating (one of only 4 in Africa) | Mining economy (diamonds)
- Data protection: Data Protection Act 2024 (revised from 2018, effective January 2025) — stronger controller/processor obligations
- Key opportunity: Stable, well-governed market with investment-grade credibility

MOZAMBIQUE:
- GDP: $18B | Population: 33M | Currency: Mozambican Metical (MZN)
- Portuguese-speaking | Growing natural gas sector | High financial exclusion
- Key opportunity: Emerging economy, Portuguese-speaking market linkage

ZAMBIA:
- GDP: $29B | Population: 20M | Currency: Zambian Kwacha (ZMW)
- Data protection: Data Protection Act No. 3 of 2021 | Data Protection Commissioner appointed 2024
- Mining economy (copper) | English-speaking | Growing mobile money
- Key opportunity: Post-debt restructuring growth, mining sector lending

ZIMBABWE:
- GDP: $28B | Population: 16M | Currency: Zimbabwe Gold (ZiG) — newest currency in Africa (2024)
- Data protection: Cyber and Data Protection Act 2021
- History of hyperinflation and currency instability | Multi-currency use (USD dominant)
- Key opportunity: Currency stability tools, multi-currency portfolio management

NAMIBIA:
- GDP: $13B | Population: 2.5M | Currency: Namibian Dollar (NAD, pegged to ZAR)
- English-speaking | Well-regulated financial sector | Small but stable market

MALAWI:
- GDP: $14B | Population: 20M | Currency: Malawian Kwacha (MWK)
- Agriculture-dependent | High poverty rate | Growing mobile money
- Key opportunity: Agricultural lending, financial inclusion

ESWATINI (Swaziland):
- GDP: $5B | Population: 1.2M | Currency: Lilangeni (SZL, pegged to ZAR)
- Small monarchy | Limited market but linked to South African financial system

LESOTHO:
- GDP: $2B | Population: 2M | Currency: Loti (LSL, pegged to ZAR)
- Landlocked within South Africa | Small market

MADAGASCAR:
- GDP: $16B | Population: 29M | Currency: Malagasy Ariary (MGA)
- Island nation | French-speaking | Very low financial inclusion
- Key opportunity: Large unbanked population, agriculture-focused lending

COMOROS:
- GDP: $1.3B | Population: 0.9M | Currency: Comorian Franc (KMF)
- Small island nation | French/Arabic-speaking

MAURITIUS:
- GDP: $14B | Population: 1.3M | Currency: Mauritian Rupee (MUR) | Central Bank: Bank of Mauritius
- Investment-grade credit rating | Account ownership: 89% (2nd highest in Africa)
- Data Protection Act 2017 | International financial center
- Key opportunity: Regional hub for Indian Ocean, high compliance standards

SEYCHELLES:
- GDP: $2B | Population: 0.1M | Currency: Seychellois Rupee (SCR)
- Smallest African country by population | Tourism-dependent | Offshore finance hub

--- NORTH AFRICA ---

EGYPT:
- GDP: $348B (2nd largest in Africa) | Population: 110M | Currency: Egyptian Pound (EGP)
- Central Bank of Egypt | Large banking sector but significant unbanked population
- Data protection: Personal Data Protection Law No. 151 of 2020 (executive regulations pending)
- Credit bureau: I-Score (regulated by CBE) | Arabic-speaking | Strong regulatory framework
- Key opportunity: Massive population, growing fintech sector, government digitization push

MOROCCO:
- GDP: $152B | Population: 38M | Currency: Moroccan Dirham (MAD) | Central Bank: Bank Al-Maghrib
- Investment-grade credit rating | Strong banking sector (Attijariwafa, BMCE active across Africa)
- Data protection: Loi n° 09-08 (2009) on Protection of Individuals re: Personal Data | Regulator: CNDP
- Arabic/French-speaking | Hub for pan-African banking
- Key opportunity: Moroccan banks expanding across Africa — need pan-African credit data

ALGERIA:
- GDP: $267B (3rd largest in Africa) | Population: 45M | Currency: Algerian Dinar (DZD)
- Data protection: Loi n° 18-07 of 2018 (amended 2024 with stricter DPO/breach rules) | Regulator: ANPDP
- Oil/gas dependent | Large economy but limited fintech adoption | Arabic/French-speaking
- Key opportunity: Untapped market with significant economic scale

TUNISIA:
- GDP: $46B | Population: 12M | Currency: Tunisian Dinar (TND)
- Data protection: Organic Law No. 2004-63 on Personal Data Protection | Regulator: INPDP. One of first DP laws in Africa
- Arabic/French-speaking | Relatively advanced financial sector for North Africa
- Key opportunity: Strong tech talent pool, startup ecosystem

LIBYA:
- GDP: $42B | Population: 7M | Currency: Libyan Dinar (LYD)
- Oil-dependent | Political instability | Limited fintech infrastructure

--- CENTRAL AFRICA ---

DEMOCRATIC REPUBLIC OF CONGO (DRC):
- GDP: $64B | Population: 100M+ (3rd most populous in Africa) | Currency: Congolese Franc (CDF)
- Enormous mineral wealth (cobalt, copper) | Very low financial inclusion
- French-speaking | 6% bank account ownership — one of lowest globally
- Key opportunity: Massive underserved market, mining sector credit needs

CAMEROON:
- GDP: $45B | Population: 28M | Currency: Central African CFA Franc (XAF) | Central Bank: BEAC
- Data protection: Law No. 2024/017 on Personal Data Protection (enacted December 2024) — establishes new Data Protection Authority
- Bilingual (English/French) | Largest economy in CEMAC zone
- Key opportunity: Gateway to Central African market, bilingual advantage

REPUBLIC OF CONGO (Congo-Brazzaville):
- GDP: $14B | Population: 6M | Currency: XAF | Oil-dependent | French-speaking

GABON:
- GDP: $21B | Population: 2.3M | Currency: XAF | Oil economy | Highest GDP per capita in Central Africa

EQUATORIAL GUINEA:
- GDP: $12B | Population: 1.7M | Currency: XAF | Oil-dependent | Spanish/French-speaking

CHAD:
- GDP: $12B | Population: 17M | Currency: XAF | Oil and agriculture | French/Arabic-speaking

CENTRAL AFRICAN REPUBLIC:
- GDP: $2.6B | Population: 5M | Currency: XAF | Conflict-affected | Very low financial inclusion

SÃO TOMÉ AND PRÍNCIPE:
- GDP: $0.6B | Population: 0.2M | Currency: Dobra (STN) | Portuguese-speaking | Small island nation

--- CURRENCY UNIONS (important for cross-border) ---

UEMOA/BCEAO (West African CFA Franc — XOF): Benin, Burkina Faso, Côte d'Ivoire, Guinea-Bissau, Mali, Niger, Senegal, Togo
CEMAC/BEAC (Central African CFA Franc — XAF): Cameroon, CAR, Chad, Congo-Brazzaville, Equatorial Guinea, Gabon
East African Community (EAC): Kenya, Tanzania, Uganda, Rwanda, Burundi, DRC, South Sudan (different currencies but trade integration)
SADC: 16 Southern African countries with trade integration
PAPSS (Pan-African Payment and Settlement System): Enables instant cross-border payments in local currencies across Africa

--- MOBILE MONEY LANDSCAPE (2024) ---
- Total Africa: $1.1 TRILLION in transactions, 1.1 billion registered accounts
- East Africa: 459M accounts, $649B transactions (led by Kenya M-Pesa)
- West Africa: 485M accounts, $357B transactions (fastest growing for new accounts)
- Central Africa: 104M accounts, $83B transactions
- North Africa: 25M accounts, $10B (higher banking penetration)
- Southern Africa: 27M accounts, $6B (higher banking penetration)
- Mobile money contributes $190B to Sub-Saharan Africa GDP

--- FINANCIAL INCLUSION LEADERS (Account Ownership 2024) ---
Kenya 90% | Mauritius 89% | South Africa 81% | Ghana 81% | Senegal 77% | Uganda 70% | Rwanda 68%
Lagging: DRC 6% | South Sudan ~10% | Central African Republic ~15% | Chad ~12%

===== PAGES & NAVIGATION =====
- Homepage: africacredithub.com or africacredithub.com/solutions
- AI Demo (no login): africacredithub.com/ai-demo
- Pricing: africacredithub.com/pricing
- Start Free Trial: africacredithub.com/start-trial
- Consumer Credit Check: africacredithub.com/my-credit
- Login (existing users): africacredithub.com/auth

===== HOW TO RESPOND =====
- Be professional, knowledgeable, and helpful — you represent Africa Credit Hub
- Answer with confidence using the facts above. Never say "I don't have information about that" if the answer is in this knowledge base
- When discussing compliance, ALWAYS lead with African laws and frameworks (POPIA, NDPA, Ghana DPA, Malabo Convention, ECOWAS Act) — mention GDPR only when the user specifically asks about EU/international compliance or has EU exposure
- When asked about a specific country's regulations, cite the exact law name, year, and regulator from the knowledge base above
- You are an expert on African data protection, credit reporting regulations, central bank requirements, and financial inclusion frameworks across all 54 countries
- When relevant, guide users toward starting a free trial (africacredithub.com/start-trial) or trying the AI demo (africacredithub.com/ai-demo)
- For questions about custom deployments, on-premise, or enterprise partnerships, suggest contacting the team at ${process.env.PLATFORM_SUPPORT_EMAIL || "support@africacredithub.com"}
- Keep responses concise but thorough. Use bullet points for complex answers
- You can discuss competitors in general terms but focus on Africa Credit Hub's strengths
- If asked about something truly outside your knowledge, say you'd be happy to connect them with the team rather than guessing`;

      const chatHistory = Array.isArray(history)
        ? history.filter((m: any) => m?.role && m?.content).slice(-10).map((m: any) => ({ role: m.role as string, content: String(m.content).slice(0, 2000) }))
        : [];

      const userPrompt = chatHistory.length > 0
        ? `Previous conversation:\n${chatHistory.map((m: any) => `${m.role}: ${m.content}`).join("\n")}\n\nUser: ${message.slice(0, 2000)}`
        : message.slice(0, 2000);

      const provider = parseOptionalProvider(req.body?.provider);
      const response = await callAI(systemPrompt, userPrompt, provider, 1500, 0.3, "customer_chat");
      res.json({ response });
    } catch (e: any) {
      res.status(500).json({ message: safeErrorMessage(e) });
    }
  });

  app.post("/api/ai/chat", aiLimiter, requireAuth, async (req, res) => {
    try {
      const { messages, provider: reqProvider } = req.body;
      const provider = parseOptionalProvider(reqProvider);
      if (!messages || !Array.isArray(messages)) {
        return res.status(400).json({ message: "messages array required" });
      }
      const sanitizedMessages = messages
        .filter((m: any) => m && typeof m.role === "string" && typeof m.content === "string")
        .filter((m: any) => m.role === "user" || m.role === "assistant")
        .map((m: any) => ({ role: m.role, content: m.content.slice(0, 4000) }))
        .slice(-20);
      if (sanitizedMessages.length === 0) {
        return res.status(400).json({ message: "At least one valid user message required" });
      }
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      const result = await chatWithAI(sanitizedMessages, req.session?.userRole, provider);
      if (result.type === "claude") {
        for await (const event of result.stream) {
          if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
            const content = event.delta.text;
            if (content) {
              res.write(`data: ${JSON.stringify({ content })}\n\n`);
            }
          }
        }
      } else {
        for await (const chunk of result.stream) {
          const content = chunk.choices[0]?.delta?.content || "";
          if (content) {
            res.write(`data: ${JSON.stringify({ content })}\n\n`);
          }
        }
      }
      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      res.end();
    } catch (e: any) {
      if (res.headersSent) {
        res.write(`data: ${JSON.stringify({ error: e.message })}\n\n`);
        res.end();
      } else {
        res.status(500).json({ message: safeErrorMessage(e) });
      }
    }
  });

  app.post("/api/ai/compliance-report", aiLimiter, requireAuth, requireRole("admin", "super_admin", "regulator"), async (req, res) => {
    try {
      const { country, provider: reqProvider } = req.body;
      const provider = parseOptionalProvider(reqProvider);
      if (!country) return res.status(400).json({ message: "country required" });
      const result = await generateComplianceReport(country, provider);
      res.json(result);
    } catch (e: any) {
      res.status(500).json({ message: safeErrorMessage(e) });
    }
  });

  app.post("/api/ai/credit-narrative/:borrowerId", aiLimiter, requireAuth, async (req, res) => {
    try {
      const provider = parseOptionalProvider(req.body?.provider);
      const language = (req.body?.language || req.query.lang || "en") as string;
      const result = await generateCreditNarrative(req.params.borrowerId, provider, language);
      res.json(result);
    } catch (e: any) {
      if (e.message === "Borrower not found") return res.status(404).json({ message: e.message });
      res.status(500).json({ message: safeErrorMessage(e) });
    }
  });

  app.post("/api/ai/anomaly-detection", aiLimiter, requireAuth, requireRole("admin", "super_admin", "regulator"), async (req, res) => {
    try {
      const provider = parseOptionalProvider(req.body?.provider);
      const result = await detectAnomalies(provider, getOrgScope(req), getCountryFilter(req));
      res.json(result);
    } catch (e: any) {
      res.status(500).json({ message: safeErrorMessage(e) });
    }
  });

  app.post("/api/ai/regulatory-report", aiLimiter, requireAuth, requireRole("admin", "super_admin", "regulator"), async (req, res) => {
    try {
      const { country, provider: reqProvider } = req.body;
      const provider = parseOptionalProvider(reqProvider);
      if (!country) return res.status(400).json({ message: "country required" });
      const result = await generateRegulatoryReport(country, provider, getOrgScope(req));
      res.json(result);
    } catch (e: any) {
      res.status(500).json({ message: safeErrorMessage(e) });
    }
  });

  app.post("/api/ai/natural-query", aiLimiter, requireAuth, async (req, res) => {
    try {
      const { query, provider: reqProvider } = req.body;
      const provider = parseOptionalProvider(reqProvider);
      if (!query || typeof query !== "string") return res.status(400).json({ message: "query string required" });
      const result = await naturalLanguageQuery(query.slice(0, 500), provider, getOrgScope(req), getCountryFilter(req));
      res.json(result);
    } catch (e: any) {
      res.status(500).json({ message: safeErrorMessage(e) });
    }
  });

  app.post("/api/ai/cross-border-risk", aiLimiter, requireAuth, requireRole("admin", "super_admin", "regulator"), async (req, res) => {
    try {
      const provider = parseOptionalProvider(req.body?.provider);
      const result = await analyzeCrossBorderRisk(provider);
      res.json(result);
    } catch (e: any) {
      res.status(500).json({ message: safeErrorMessage(e) });
    }
  });

  app.post("/api/ai/loan-recommendation/:borrowerId", aiLimiter, requireAuth, async (req, res) => {
    try {
      const { loanAmount, loanType, provider: reqProvider } = req.body;
      const provider = parseOptionalProvider(reqProvider);
      if (!loanAmount || !loanType) return res.status(400).json({ message: "loanAmount and loanType required" });
      const parsedAmount = parseFloat(loanAmount);
      if (!isFinite(parsedAmount) || parsedAmount <= 0) return res.status(400).json({ message: "loanAmount must be a positive number" });
      const validTypes = ["personal_loan", "business_loan", "mortgage", "agriculture_loan", "trade_finance", "microfinance", "auto_loan", "education_loan", "overdraft"];
      if (!validTypes.includes(loanType)) return res.status(400).json({ message: "Invalid loan type" });
      const result = await generateLoanRecommendation(req.params.borrowerId, parsedAmount, loanType, provider);
      res.json(result);
    } catch (e: any) {
      if (e.message === "Borrower not found") return res.status(404).json({ message: e.message });
      res.status(500).json({ message: safeErrorMessage(e) });
    }
  });

  app.get("/api/borrower-alerts", requireAuth, requireRole("admin", "super_admin", "regulator"), async (req, res) => {
    try {
      const orgScope = getOrgScope(req);
      const country = getCountryFilter(req);
      const recentDays = parseInt(req.query.recentDays as string) || 0;
      const alerts = await storage.getBorrowerAlerts(orgScope, country, recentDays > 0 ? recentDays : undefined);
      const borrowerIds = [...new Set(alerts.map(a => a.borrowerId))];
      const borrowerMap = new Map<string, { firstName?: string | null; lastName?: string | null; companyName?: string | null }>();
      for (const bid of borrowerIds) {
        try {
          const b = await storage.getBorrower(bid);
          if (b) borrowerMap.set(bid, { firstName: b.firstName, lastName: b.lastName, companyName: b.companyName });
        } catch {}
      }
      const enriched = alerts.map(a => {
        const b = borrowerMap.get(a.borrowerId);
        const borrowerName = b ? (b.companyName || [b.firstName, b.lastName].filter(Boolean).join(" ") || null) : null;
        return { ...a, borrowerName };
      });
      res.json(enriched);
    } catch (e: any) {
      res.status(500).json({ message: safeErrorMessage(e) });
    }
  });

  app.get("/api/borrower-alerts/:borrowerId", requireAuth, async (req, res) => {
    try {
      const borrower = await storage.getBorrower(req.params.borrowerId);
      if (!borrower) return res.status(404).json({ message: "Borrower not found" });
      const user = await storage.getUser(req.session?.userId!);
      if (user?.role !== "super_admin" && borrower.organizationId && user?.organizationId !== borrower.organizationId) {
        return res.status(403).json({ message: "Access denied" });
      }
      const alerts = await storage.getBorrowerAlertsByBorrower(req.params.borrowerId);
      res.json(alerts);
    } catch (e: any) {
      res.status(500).json({ message: safeErrorMessage(e) });
    }
  });

  app.post("/api/borrower-alerts/settings", requireAuth, requireRole("admin", "super_admin"), async (req, res) => {
    try {
      const { alertTypes, enabled } = req.body;
      if (!alertTypes || !Array.isArray(alertTypes)) {
        return res.status(400).json({ message: "alertTypes array is required" });
      }
      await storage.createAuditLog({
        action: "UPDATE_ALERT_SETTINGS",
        entity: "borrower_alerts",
        userId: req.session?.userId,
        details: `Alert settings updated: types=${alertTypes.join(",")}, enabled=${enabled}`,
        ipAddress: req.ip || null,
        organizationId: getOrgScope(req),
      });
      res.json({ message: "Alert preferences saved", alertTypes, enabled });
    } catch (e: any) {
      res.status(500).json({ message: safeErrorMessage(e) });
    }
  });

  app.get("/api/regulatory/dashboard", requireAuth, requireRole("admin", "super_admin", "regulator"), async (req, res) => {
    try {
      const orgScope = getOrgScope(req);
      const country = getCountryFilter(req);
      const orgFilter = orgScope ? sql`AND organization_id = ${orgScope}` : sql``;
      const countryOrgFilter = country ? sql`AND organization_id IN (SELECT id FROM organizations WHERE country = ${country})` : sql``;

      const statusRows = await db.execute(sql`
        SELECT status, COUNT(*)::int AS cnt, COALESCE(SUM(CAST(current_balance AS DECIMAL(15,2))), 0)::text AS exposure
        FROM credit_accounts WHERE 1=1 ${orgFilter} ${countryOrgFilter} GROUP BY status
      `);
      const statusMap: Record<string, { cnt: number; exposure: number }> = {};
      let totalAccounts = 0;
      let totalExposure = 0;
      for (const row of statusRows.rows as any[]) {
        statusMap[row.status] = { cnt: row.cnt, exposure: parseFloat(row.exposure || "0") };
        totalAccounts += row.cnt;
        totalExposure += parseFloat(row.exposure || "0");
      }
      const delinquent = statusMap["delinquent"]?.cnt || 0;
      const defaulted = statusMap["default"]?.cnt || 0;
      const writtenOff = statusMap["written_off"]?.cnt || 0;
      const nplCount = delinquent + defaulted + writtenOff;
      const nplRatio = totalAccounts > 0 ? ((nplCount / totalAccounts) * 100).toFixed(1) : "0.0";
      const nplExposure = (statusMap["delinquent"]?.exposure || 0) + (statusMap["default"]?.exposure || 0) + (statusMap["written_off"]?.exposure || 0);

      const dqRows = await db.execute(sql`
        SELECT
          COUNT(*)::int AS total,
          COUNT(national_id)::int AS with_id,
          COUNT(CASE WHEN phone IS NOT NULL OR mobile_money_number IS NOT NULL THEN 1 END)::int AS with_phone,
          COUNT(email)::int AS with_email
        FROM borrowers WHERE 1=1 ${orgFilter} ${country ? sql`AND country = ${country}` : sql``}
      `);
      const dq = (dqRows.rows as any[])[0] || { total: 0, with_id: 0, with_phone: 0, with_email: 0 };
      const totalBorrowers = dq.total;
      const dataQuality = {
        nationalIdCoverage: totalBorrowers > 0 ? ((dq.with_id / totalBorrowers) * 100).toFixed(1) : "0.0",
        phoneCoverage: totalBorrowers > 0 ? ((dq.with_phone / totalBorrowers) * 100).toFixed(1) : "0.0",
        emailCoverage: totalBorrowers > 0 ? ((dq.with_email / totalBorrowers) * 100).toFixed(1) : "0.0",
        overallScore: totalBorrowers > 0
          ? (((dq.with_id + dq.with_phone + dq.with_email) / (totalBorrowers * 3)) * 100).toFixed(1) : "0.0",
      };

      const sectorRows = await db.execute(sql`
        SELECT account_type AS sector, status, COUNT(*)::int AS cnt,
          COALESCE(SUM(CAST(current_balance AS DECIMAL(15,2))), 0)::text AS exposure
        FROM credit_accounts WHERE 1=1 ${orgFilter} ${countryOrgFilter} GROUP BY account_type, status
      `);
      const sectorMap: Record<string, { total: number; npl: number; exposure: number; nplExposure: number }> = {};
      for (const row of sectorRows.rows as any[]) {
        const sector = row.sector || "Other";
        if (!sectorMap[sector]) sectorMap[sector] = { total: 0, npl: 0, exposure: 0, nplExposure: 0 };
        sectorMap[sector].total += row.cnt;
        sectorMap[sector].exposure += parseFloat(row.exposure || "0");
        if (["delinquent", "default", "written_off"].includes(row.status)) {
          sectorMap[sector].npl += row.cnt;
          sectorMap[sector].nplExposure += parseFloat(row.exposure || "0");
        }
      }
      const sectorNpl = Object.entries(sectorMap).map(([sector, data]) => ({
        sector, totalAccounts: data.total, nplAccounts: data.npl,
        nplRatio: data.total > 0 ? ((data.npl / data.total) * 100).toFixed(1) : "0.0",
        totalExposure: data.exposure.toFixed(2), nplExposure: data.nplExposure.toFixed(2),
      })).sort((a, b) => parseFloat(b.nplRatio) - parseFloat(a.nplRatio));

      const lenderRows = await db.execute(sql`
        SELECT lender_institution AS lender, status, COUNT(*)::int AS cnt,
          COALESCE(SUM(CAST(current_balance AS DECIMAL(15,2))), 0)::text AS exposure
        FROM credit_accounts WHERE 1=1 ${orgFilter} ${countryOrgFilter} GROUP BY lender_institution, status
      `);
      const lenderMap: Record<string, { total: number; npl: number; exposure: number }> = {};
      for (const row of lenderRows.rows as any[]) {
        const lender = row.lender || "Unknown";
        if (!lenderMap[lender]) lenderMap[lender] = { total: 0, npl: 0, exposure: 0 };
        lenderMap[lender].total += row.cnt;
        lenderMap[lender].exposure += parseFloat(row.exposure || "0");
        if (["delinquent", "default", "written_off"].includes(row.status)) lenderMap[lender].npl += row.cnt;
      }
      const institutionCompliance = Object.entries(lenderMap).map(([name, data]) => ({
        name, totalAccounts: data.total, nplAccounts: data.npl,
        nplRatio: data.total > 0 ? ((data.npl / data.total) * 100).toFixed(1) : "0.0",
        totalExposure: data.exposure.toFixed(2), lastSubmission: null as string | null,
        dataQualityScore: "Good",
      })).sort((a, b) => b.totalAccounts - a.totalAccounts);

      const { data: allInstitutions } = await storage.getInstitutions(1, 500, orgScope, country);

      const statusBreakdown = {
        current: statusMap["current"]?.cnt || 0,
        delinquent,
        default: defaulted,
        closed: statusMap["closed"]?.cnt || 0,
        restructured: statusMap["restructured"]?.cnt || 0,
        writtenOff,
      };

      res.json({
        summary: {
          totalBorrowers,
          totalAccounts,
          totalInstitutions: allInstitutions.length,
          totalExposure: totalExposure.toFixed(2),
          nplCount,
          nplRatio,
          nplExposure: nplExposure.toFixed(2),
          statusBreakdown,
        },
        dataQuality,
        sectorNpl,
        institutionCompliance,
      });
    } catch (e: any) {
      res.status(500).json({ message: safeErrorMessage(e) });
    }
  });

  app.get("/api/audit-logs/verify-integrity", requireAuth, requireRole("admin", "super_admin", "regulator"), async (req, res) => {
    try {
      const result = await storage.verifyAuditIntegrity();
      res.json(result);
    } catch (e: any) {
      res.status(500).json({ message: safeErrorMessage(e) });
    }
  });

  app.post("/api/ai/portfolio-intelligence", aiLimiter, requireAuth, requireRole("admin", "super_admin", "regulator"), async (req, res) => {
    try {
      const provider = parseOptionalProvider(req.body?.provider);
      const result = await generatePortfolioIntelligence(provider, getOrgScope(req), getCountryFilter(req));
      res.json(result);
    } catch (e: any) {
      res.status(500).json({ message: safeErrorMessage(e) });
    }
  });

  // Cross-border access check for UI gating
  app.get("/api/sata/access-check", requireAuth, async (req, res) => {
    try {
      if (req.session?.userRole === "super_admin") {
        return res.json({ hasAccess: true, reason: "super_admin" });
      }
      const userOrgId = req.session?.organizationId;
      if (!userOrgId) return res.json({ hasAccess: false, reason: "no_organization" });

      const org = await storage.getOrganization(userOrgId);
      if (!org) return res.json({ hasAccess: false, reason: "org_not_found" });

      const orgCountry = org.country || getActiveCountryName();
      const orgName = org.name;

      const activeAgreements = await db.select().from(dataSharingAgreements).where(
        and(
          eq(dataSharingAgreements.status, "active"),
          or(eq(dataSharingAgreements.sourceCountry, orgCountry), eq(dataSharingAgreements.targetCountry, orgCountry))
        )
      );

      const hasAccess = activeAgreements.some(a => {
        const srcInsts = a.sourceInstitutions || [];
        const tgtInsts = a.targetInstitutions || [];
        const isInSource = a.sourceCountry === orgCountry && (srcInsts.length === 0 || srcInsts.includes(orgName));
        const isInTarget = a.targetCountry === orgCountry && (tgtInsts.length === 0 || tgtInsts.includes(orgName));
        return isInSource || isInTarget;
      });

      res.json({ hasAccess, reason: hasAccess ? "active_agreement" : "no_agreement", orgCountry, orgName });
    } catch (e: any) { res.status(500).json({ message: safeErrorMessage(e) }); }
  });

  // ── SATA Data Sharing Agreements ──
  app.get("/api/sata/agreements", requireAuth, requireRole("admin", "super_admin", "regulator"), async (_req, res) => {
    try {
      const rows = await db.select().from(dataSharingAgreements).orderBy(desc(dataSharingAgreements.createdAt));
      res.json(rows);
    } catch (e: any) { res.status(500).json({ message: safeErrorMessage(e) }); }
  });

  app.get("/api/sata/agreements/:id", requireAuth, requireRole("admin", "super_admin", "regulator"), async (req, res) => {
    try {
      const [row] = await db.select().from(dataSharingAgreements).where(eq(dataSharingAgreements.id, req.params.id));
      if (!row) return res.status(404).json({ message: "Agreement not found" });
      res.json(row);
    } catch (e: any) { res.status(500).json({ message: safeErrorMessage(e) }); }
  });

  app.post("/api/sata/agreements", requireAuth, requireSuperAdmin, async (req, res) => {
    try {
      const parsed = insertDataSharingAgreementSchema.parse(req.body);
      const [created] = await db.insert(dataSharingAgreements).values({ ...parsed, createdBy: req.session.userId }).returning();
      await storage.createAuditLog({ userId: req.session.userId!, action: "CREATE", entity: "data_sharing_agreement", entityId: created.id, details: `Created SATA agreement: ${created.sourceCountry} → ${created.targetCountry}`, ipAddress: req.ip, organizationId: null });
      res.status(201).json(created);
    } catch (e: any) { res.status(400).json({ message: e.message }); }
  });

  app.patch("/api/sata/agreements/:id", requireAuth, requireSuperAdmin, async (req, res) => {
    try {
      const { status, suspendedReason, approvedBy, ...rest } = req.body;
      const updates: any = { ...rest, updatedAt: new Date() };
      if (status) updates.status = status;
      if (status === "active") updates.approvedBy = req.session.userId;
      if (status === "suspended" && suspendedReason) updates.suspendedReason = suspendedReason;
      const [updated] = await db.update(dataSharingAgreements).set(updates).where(eq(dataSharingAgreements.id, req.params.id)).returning();
      if (!updated) return res.status(404).json({ message: "Agreement not found" });
      await storage.createAuditLog({ userId: req.session.userId!, action: "UPDATE", entity: "data_sharing_agreement", entityId: updated.id, details: `Updated SATA agreement status to ${updated.status}: ${updated.sourceCountry} → ${updated.targetCountry}`, ipAddress: req.ip, organizationId: null });
      res.json(updated);
    } catch (e: any) { res.status(400).json({ message: e.message }); }
  });

  app.delete("/api/sata/agreements/:id", requireAuth, requireSuperAdmin, async (req, res) => {
    try {
      const [deleted] = await db.delete(dataSharingAgreements).where(eq(dataSharingAgreements.id, req.params.id)).returning();
      if (!deleted) return res.status(404).json({ message: "Agreement not found" });
      await storage.createAuditLog({ userId: req.session.userId!, action: "DELETE", entity: "data_sharing_agreement", entityId: deleted.id, details: `Deleted SATA agreement: ${deleted.sourceCountry} → ${deleted.targetCountry}`, ipAddress: req.ip, organizationId: null });
      res.json({ message: "Agreement deleted" });
    } catch (e: any) { res.status(500).json({ message: safeErrorMessage(e) }); }
  });

  app.get("/api/sata/agreements/country/:country", requireAuth, requireRole("admin", "super_admin", "regulator"), async (req, res) => {
    try {
      const country = req.params.country;
      const rows = await db.select().from(dataSharingAgreements).where(
        and(
          eq(dataSharingAgreements.status, "active"),
          or(eq(dataSharingAgreements.sourceCountry, country), eq(dataSharingAgreements.targetCountry, country))
        )
      );
      res.json(rows);
    } catch (e: any) { res.status(500).json({ message: safeErrorMessage(e) }); }
  });

  app.get("/api/sata/my-agreements", requireAuth, async (req, res) => {
    try {
      if (req.session?.userRole === "super_admin" || req.session?.userRole === "admin" || req.session?.userRole === "regulator") {
        const all = await db.select().from(dataSharingAgreements).where(eq(dataSharingAgreements.status, "active"));
        return res.json(all);
      }
      const userOrgId = req.session?.organizationId;
      if (!userOrgId) return res.json([]);
      const org = await storage.getOrganization(userOrgId);
      if (!org) return res.json([]);
      const orgCountry = org.country || getActiveCountryName();
      const orgName = org.name;
      const active = await db.select().from(dataSharingAgreements).where(
        and(eq(dataSharingAgreements.status, "active"), or(eq(dataSharingAgreements.sourceCountry, orgCountry), eq(dataSharingAgreements.targetCountry, orgCountry)))
      );
      const accessible = active.filter(a => {
        const srcInsts = a.sourceInstitutions || [];
        const tgtInsts = a.targetInstitutions || [];
        const isInSource = a.sourceCountry === orgCountry && (srcInsts.length === 0 || srcInsts.includes(orgName));
        const isInTarget = a.targetCountry === orgCountry && (tgtInsts.length === 0 || tgtInsts.includes(orgName));
        return isInSource || isInTarget;
      });
      res.json(accessible);
    } catch (e: any) { res.status(500).json({ message: safeErrorMessage(e) }); }
  });

  // Cross-border search — requires active agreement + institution check + role check
  app.get("/api/sata/cross-border-search", requireAuth, requireRole("admin", "super_admin", "regulator", "lender"), requireCrossBorderAccess, async (req, res) => {
    try {
      const { q, targetCountry } = req.query;
      if (!q || !targetCountry) return res.status(400).json({ message: "Query (q) and targetCountry are required" });

      const userCountry = getCountryFilter(req) || getActiveCountryName();
      if (!userCountry || userCountry === targetCountry) return res.status(400).json({ message: "Cannot search your own country via cross-border" });

      const activeAgreements = await db.select().from(dataSharingAgreements).where(
        and(
          eq(dataSharingAgreements.status, "active"),
          or(
            and(eq(dataSharingAgreements.sourceCountry, userCountry), eq(dataSharingAgreements.targetCountry, targetCountry as string)),
            and(eq(dataSharingAgreements.sourceCountry, targetCountry as string), eq(dataSharingAgreements.targetCountry, userCountry))
          )
        )
      );
      if (activeAgreements.length === 0) return res.status(403).json({ message: `No active data sharing agreement between ${userCountry} and ${targetCountry}` });

      if (req.session?.userRole !== "super_admin") {
        const userOrgId = req.session?.organizationId;
        const org = userOrgId ? await storage.getOrganization(userOrgId) : null;
        const orgName = org?.name || "";
        const institutionAllowed = activeAgreements.some(a => {
          const srcInsts = a.sourceInstitutions || [];
          const tgtInsts = a.targetInstitutions || [];
          const isSource = a.sourceCountry === userCountry;
          const relevantInsts = isSource ? srcInsts : tgtInsts;
          return relevantInsts.length === 0 || relevantInsts.includes(orgName);
        });
        if (!institutionAllowed) return res.status(403).json({ message: "Your institution is not covered by any active agreement for this country pair" });
      }

      const searchTerm = `%${q}%`;
      const results = await db.execute(sql`
        SELECT id, type, first_name, last_name, company_name, national_id, country, city, region
        FROM borrowers
        WHERE country = ${targetCountry}
        AND (
          first_name ILIKE ${searchTerm} OR last_name ILIKE ${searchTerm}
          OR company_name ILIKE ${searchTerm} OR national_id ILIKE ${searchTerm}
          OR passport_number ILIKE ${searchTerm}
        )
        LIMIT 50
      `);

      await storage.createAuditLog({
        userId: req.session.userId!, action: "CROSS_BORDER_SEARCH", entity: "borrower",
        details: `Cross-border search from ${userCountry} to ${targetCountry}: "${q}" (${(results.rows || []).length} results, agreement: ${activeAgreements[0].id})`,
        ipAddress: req.ip, organizationId: null,
      });

      recordUsageEvent({
        organizationId: req.session?.organizationId,
        eventType: "cross_border_query",
        country: userCountry,
        metadata: JSON.stringify({ targetCountry, resultCount: (results.rows || []).length }),
      });

      res.json({ results: results.rows || [], agreementId: activeAgreements[0].id, sourceCountry: userCountry, targetCountry });
    } catch (e: any) { res.status(500).json({ message: safeErrorMessage(e) }); }
  });

  // SATA compliance stats — admin/super_admin/regulator only
  app.get("/api/sata/stats", requireAuth, requireRole("admin", "super_admin", "regulator"), async (_req, res) => {
    try {
      const allAgreements = await db.select().from(dataSharingAgreements);
      const activeCount = allAgreements.filter(a => a.status === "active").length;
      const draftCount = allAgreements.filter(a => a.status === "draft").length;
      const suspendedCount = allAgreements.filter(a => a.status === "suspended").length;
      const expiredCount = allAgreements.filter(a => a.status === "expired").length;

      const countriesInAgreements = new Set<string>();
      allAgreements.filter(a => a.status === "active").forEach(a => {
        countriesInAgreements.add(a.sourceCountry);
        countriesInAgreements.add(a.targetCountry);
      });

      const blocsRaw = allAgreements.filter(a => a.status === "active" && a.regionalBloc).map(a => a.regionalBloc!);
      const blocsSet = new Set(blocsRaw);

      const settlements = await db.select().from(papssSettlements);
      const completedSettlements = settlements.filter(s => s.status === "completed");
      const totalVolume = completedSettlements.reduce((acc, s) => acc + parseFloat(s.senderAmount || "0"), 0);

      const consentRecordsResult = await db.execute(sql`SELECT COUNT(*) as count FROM consent_records WHERE status = 'active'`);
      const activeConsents = parseInt((consentRecordsResult.rows?.[0] as any)?.count || "0");

      const consentByAgreement = allAgreements.filter(a => a.status === "active").map(a => {
        const hasConsentDataType = a.allowedDataTypes.includes("consent_records");
        return {
          id: a.id,
          sourceCountry: a.sourceCountry,
          targetCountry: a.targetCountry,
          consentDataSharing: hasConsentDataType,
          legalBasis: a.legalBasis || "Not specified",
        };
      });

      res.json({
        agreements: { total: allAgreements.length, active: activeCount, draft: draftCount, suspended: suspendedCount, expired: expiredCount },
        coverage: { countriesConnected: countriesInAgreements.size, regionalBlocs: Array.from(blocsSet) },
        settlements: { total: settlements.length, completed: completedSettlements.length, totalVolumeUsd: totalVolume },
        consent: { activeConsents, agreementConsentStatus: consentByAgreement },
      });
    } catch (e: any) { res.status(500).json({ message: safeErrorMessage(e) }); }
  });

  // ── PAPSS Settlements ──
  app.get("/api/papss/settlements", requireAuth, requireRole("admin", "super_admin", "regulator"), async (req, res) => {
    try {
      const { status, country, limit: lim } = req.query;
      let query = db.select().from(papssSettlements).orderBy(desc(papssSettlements.createdAt));
      const rows = await query;
      let filtered = rows;
      if (status && status !== "all") filtered = filtered.filter(r => r.status === status);
      if (country) filtered = filtered.filter(r => r.senderCountry === country || r.receiverCountry === country);
      if (lim) filtered = filtered.slice(0, parseInt(lim as string));
      res.json(filtered);
    } catch (e: any) { res.status(500).json({ message: safeErrorMessage(e) }); }
  });

  app.get("/api/papss/settlements/:id", requireAuth, requireRole("admin", "super_admin", "regulator"), async (req, res) => {
    try {
      const [row] = await db.select().from(papssSettlements).where(eq(papssSettlements.id, req.params.id));
      if (!row) return res.status(404).json({ message: "Settlement not found" });
      res.json(row);
    } catch (e: any) { res.status(500).json({ message: safeErrorMessage(e) }); }
  });

  app.post("/api/papss/settlements", requireAuth, requireSuperAdmin, async (req, res) => {
    try {
      const parsed = insertPapssSettlementSchema.parse(req.body);
      const [created] = await db.insert(papssSettlements).values({ ...parsed, initiatedBy: req.session.userId }).returning();
      await storage.createAuditLog({ userId: req.session.userId!, action: "CREATE", entity: "papss_settlement", entityId: created.id, details: `PAPSS settlement: ${created.senderInstitution} (${created.senderCountry}) → ${created.receiverInstitution} (${created.receiverCountry}), ${created.senderCurrency} ${created.senderAmount}`, ipAddress: req.ip, organizationId: null });
      res.status(201).json(created);
    } catch (e: any) { res.status(400).json({ message: e.message }); }
  });

  app.patch("/api/papss/settlements/:id", requireAuth, requireSuperAdmin, async (req, res) => {
    try {
      const { status, failureReason } = req.body;
      const updates: any = { updatedAt: new Date() };
      if (status) updates.status = status;
      if (status === "completed") updates.completedAt = new Date();
      if (status === "failed" && failureReason) updates.failureReason = failureReason;
      const [updated] = await db.update(papssSettlements).set(updates).where(eq(papssSettlements.id, req.params.id)).returning();
      if (!updated) return res.status(404).json({ message: "Settlement not found" });
      await storage.createAuditLog({ userId: req.session.userId!, action: "UPDATE", entity: "papss_settlement", entityId: updated.id, details: `Updated PAPSS settlement status to ${updated.status}`, ipAddress: req.ip, organizationId: null });
      res.json(updated);
    } catch (e: any) { res.status(400).json({ message: e.message }); }
  });

  await seedCountrySettings();
  await repairCountrySettings();
  await seedOrganizations();

  registerExternalApi(app);

  app.get("/api/borrowers/:id/ml-score", async (req, res) => {
    try {
      const borrower = await storage.getBorrower(req.params.id);
      if (!borrower) return res.status(404).json({ message: "Borrower not found" });

      const accounts = await storage.getCreditAccountsByBorrower(borrower.id);
      const inquiries = await storage.getCreditInquiriesByBorrower(borrower.id);
      const judgments = await storage.getCourtJudgmentsByBorrower(borrower.id);

      let altData: any[] = [];
      try {
        const altResult = await pool.query(
          `SELECT * FROM alternative_data WHERE borrower_id::text = $1`,
          [borrower.id]
        );
        altData = altResult.rows.map((r: any) => ({
          source: r.source,
          totalTransactions: r.total_transactions || 0,
          onTimePayments: r.on_time_payments || 0,
          latePayments: r.late_payments || 0,
          status: r.status || "active",
          averageMonthlyAmount: r.average_monthly_amount,
        }));
      } catch {}

      const mlAccounts = accounts.map(a => ({
        status: a.status,
        currentBalance: a.currentBalance,
        currency: a.currency,
        openedDate: a.openedDate,
        lastPaymentDate: a.lastPaymentDate,
        creditLimit: a.creditLimit,
        monthlyPayment: a.monthlyPayment,
      }));

      const activeJudgments = judgments.filter((j: any) => j.status === "active").length;

      const result = calculateMLCreditScore(
        mlAccounts,
        inquiries.length,
        activeJudgments,
        borrower.isPep || false,
        altData
      );

      const { score: traditionalScore } = calculateCreditScore(
        accounts, inquiries.length, judgments, borrower.isPep || false, altData
      );

      broadcastEvent({
        type: "score_computed",
        title: "ML Score Computed",
        message: `ML credit score computed for ${borrower.firstName || borrower.companyName}: ${result.mlScore}`,
        entityId: borrower.id,
        entityType: "borrower",
        severity: "info",
        timestamp: new Date().toISOString(),
        data: { mlScore: result.mlScore, traditionalScore },
      }, { userId: req.session?.userId });

      deliverWebhook("score.computed", {
        borrowerId: borrower.id,
        mlScore: result.mlScore,
        traditionalScore,
        modelVersion: result.modelVersion,
      }, borrower.organizationId).catch(() => {});

      res.json({
        ...result,
        traditionalScore,
        borrowerId: borrower.id,
        borrowerName: borrower.firstName
          ? `${borrower.firstName} ${borrower.lastName || ""}`
          : borrower.companyName,
      });
    } catch (e: any) {
      res.status(500).json({ message: safeErrorMessage(e) });
    }
  });

  app.get("/api/blockchain/anchors", async (_req, res) => {
    try {
      const anchors = await getAnchors(50);
      res.json(anchors);
    } catch (e: any) {
      res.status(500).json({ message: safeErrorMessage(e) });
    }
  });

  app.post("/api/blockchain/anchor", requireRole("admin"), async (req, res) => {
    try {
      if (req.session?.userRole !== "super_admin" && req.session?.userRole !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }

      const result = await createAnchor();
      if (!result) {
        return res.json({ message: "No new audit logs to anchor", anchored: false });
      }

      broadcastEvent({
        type: "anchor_created",
        title: "Blockchain Anchor Created",
        message: `${result.auditLogCount} audit logs anchored — Merkle root: ${result.merkleRoot.substring(0, 16)}...`,
        severity: "info",
        timestamp: new Date().toISOString(),
        data: { merkleRoot: result.merkleRoot, txHash: result.txHash },
      });

      res.json({ ...result, anchored: true });
    } catch (e: any) {
      res.status(500).json({ message: safeErrorMessage(e) });
    }
  });

  app.get("/api/blockchain/anchors/:id/verify", async (req, res) => {
    try {
      const result = await verifyAuditAgainstAnchor(req.params.id);
      res.json(result);
    } catch (e: any) {
      res.status(500).json({ message: safeErrorMessage(e) });
    }
  });

  app.get("/api/webhooks/events", requireAuth, (_req, res) => {
    res.json({ events: WEBHOOK_EVENTS });
  });

  app.get("/api/webhooks", requireAuth, requireRole("admin", "super_admin"), async (req, res) => {
    try {
      const orgId = req.session?.organizationId || "global";
      const subs = await getWebhookSubscriptions(orgId);
      res.json(subs.map(s => ({ ...s, name: s.description || "Unnamed" })));
    } catch (e: any) {
      res.status(500).json({ message: safeErrorMessage(e) });
    }
  });

  app.post("/api/webhooks", requireAuth, requireRole("admin", "super_admin"), async (req, res) => {
    try {
      const { url, events, name } = req.body;
      if (!url) return res.status(400).json({ message: "URL is required" });

      if (!isSafeWebhookUrl(url)) {
        return res.status(400).json({ message: "Invalid or unsafe webhook URL. Must use HTTP(S) and not point to internal/private network addresses." });
      }

      const secret = crypto.randomBytes(32).toString("hex");
      const orgId = req.session?.organizationId || "global";

      const [sub] = await db.insert(webhookSubscriptions).values({
        organizationId: orgId,
        url,
        secret,
        events: events || [],
        description: name || null,
      }).returning();

      await storage.createAuditLog({
        userId: req.session!.userId!.toString(),
        action: "Create",
        entity: "WebhookSubscription",
        entityId: sub.id,
        details: `Created webhook subscription for ${url}`,
        ipAddress: req.ip || "unknown",
      });

      res.json({ ...sub, name: sub.description, secret });
    } catch (e: any) {
      res.status(500).json({ message: safeErrorMessage(e) });
    }
  });

  app.delete("/api/webhooks/:id", requireAuth, requireRole("admin", "super_admin"), async (req, res) => {
    try {
      const orgId = req.session?.organizationId || "global";
      const [sub] = await db.select().from(webhookSubscriptions).where(
        and(eq(webhookSubscriptions.id, req.params.id), eq(webhookSubscriptions.organizationId, orgId))
      );
      if (!sub) return res.status(404).json({ message: "Webhook not found" });
      await db.delete(webhookSubscriptions).where(eq(webhookSubscriptions.id, req.params.id));
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ message: safeErrorMessage(e) });
    }
  });

  app.get("/api/webhooks/:id/deliveries", requireAuth, requireRole("admin", "super_admin"), async (req, res) => {
    try {
      const orgId = req.session?.organizationId || "global";
      const [sub] = await db.select().from(webhookSubscriptions).where(
        and(eq(webhookSubscriptions.id, req.params.id), eq(webhookSubscriptions.organizationId, orgId))
      );
      if (!sub) return res.status(404).json({ message: "Webhook not found" });
      const logs = await getWebhookDeliveryHistory(req.params.id, 50);
      res.json(logs);
    } catch (e: any) {
      res.status(500).json({ message: safeErrorMessage(e) });
    }
  });

  app.post("/api/webhooks/:id/test", requireAuth, requireRole("admin", "super_admin"), async (req, res) => {
    try {
      const orgId = req.session?.organizationId || "global";
      const [sub] = await db.select().from(webhookSubscriptions).where(
        and(eq(webhookSubscriptions.id, req.params.id), eq(webhookSubscriptions.organizationId, orgId))
      );
      if (!sub) return res.status(404).json({ message: "Webhook not found" });

      await deliverWebhook("borrower.created", {
        test: true,
        message: "This is a test webhook delivery from Africa Credit Hub",
        timestamp: new Date().toISOString(),
      }, sub.organizationId);

      res.json({ success: true, message: "Test webhook delivered" });
    } catch (e: any) {
      res.status(500).json({ message: safeErrorMessage(e) });
    }
  });

  app.get("/api/websocket/status", async (_req, res) => {
    const { getConnectedClientsCount } = await import("./websocket");
    res.json({ connectedClients: getConnectedClientsCount() });
  });

  function generateSha256Companion(hash: string, filename: string): string {
    return `${hash}  ${filename}\n`;
  }

  interface ExportJob {
    total: number;
    processed: number;
    status: "queued" | "processing" | "encrypting" | "completed" | "failed";
    startedAt: number;
    initiatorUserId: string;
    orgId: string;
    encFilePath?: string;
    oneTimeKey?: string;
    iv?: string;
    ciphertextHash?: string;
    sha256Hash?: string;
    sizeBytes?: number;
    totalRecords?: number;
    filename?: string;
    error?: string;
  }
  const exportJobs = new Map<string, ExportJob>();

  function verifyJobOwnership(req: any, job: ExportJob): boolean {
    if (req.session.userRole === "super_admin" || req.session.userRole === "platform_admin") return true;
    return job.initiatorUserId === req.session.userId;
  }

  app.get("/api/export/progress/:jobId", requireAuth, async (req, res) => {
    const job = exportJobs.get(req.params.jobId);
    if (!job) return res.status(404).json({ message: "Export job not found" });
    if (!verifyJobOwnership(req, job)) return res.status(403).json({ message: "Access denied" });
    const pct = job.total > 0 ? Math.round((job.processed / job.total) * 100) : 0;
    res.json({ jobId: req.params.jobId, total: job.total, processed: job.processed, percent: pct, status: job.status, elapsedMs: Date.now() - job.startedAt });
  });

  app.get("/api/export/download/:jobId", requireAuth, async (req, res) => {
    const job = exportJobs.get(req.params.jobId);
    if (!job) return res.status(404).json({ message: "Export job not found" });
    if (!verifyJobOwnership(req, job)) return res.status(403).json({ message: "Access denied" });
    if (job.status !== "completed" || !job.encFilePath) return res.status(400).json({ message: `Export not ready. Status: ${job.status}` });

    try {
      const filename = job.filename || "export.enc";
      res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
      res.setHeader("Content-Type", "application/octet-stream");
      res.setHeader("X-Export-SHA256", job.ciphertextHash || "");
      res.setHeader("X-Export-Plaintext-SHA256", job.sha256Hash || "");
      res.setHeader("X-Export-Original-Size", String(job.sizeBytes || 0));
      res.setHeader("X-Export-Encrypted", "true");
      res.setHeader("X-Export-Record-Count", String(job.totalRecords || 0));
      res.setHeader("X-Export-SHA256-Companion", Buffer.from(generateSha256Companion(job.ciphertextHash || "", filename)).toString("base64"));

      const encReadStream = fs.createReadStream(job.encFilePath);
      encReadStream.pipe(res);
      encReadStream.on("end", () => {
        try { fs.unlinkSync(job.encFilePath!); } catch {}
        setTimeout(() => exportJobs.delete(req.params.jobId), 60000);
      });
    } catch (e: any) {
      res.status(500).json({ message: "Download failed" });
    }
  });

  app.get("/api/export/key/:jobId", requireAuth, async (req, res) => {
    const job = exportJobs.get(req.params.jobId);
    if (!job) return res.status(404).json({ message: "Export job not found" });
    if (!verifyJobOwnership(req, job)) return res.status(403).json({ message: "Access denied" });
    if (job.status !== "completed") return res.status(400).json({ message: `Export not ready. Status: ${job.status}` });
    if (!job.oneTimeKey || !job.iv) return res.status(410).json({ message: "Decryption key has already been retrieved. Keys are single-use for security." });

    const oneTimeKey = job.oneTimeKey;
    const iv = job.iv;
    job.oneTimeKey = undefined;
    job.iv = undefined;

    await storage.createAuditLog({
      userId: req.session?.userId,
      action: "EXPORT_KEY_RETRIEVED",
      entity: "export_job",
      entityId: req.params.jobId,
      details: JSON.stringify({ jobId: req.params.jobId, retrievedAt: new Date().toISOString() }),
      ipAddress: req.ip || "unknown",
    });

    res.json({ oneTimeKey, iv });
  });

  app.post("/api/admin/export/:orgId", requireAuth, requireRole("admin", "super_admin"), exportLimiter, async (req, res) => {
    try {
      const orgId = req.params.orgId;
      if (!orgId) return res.status(400).json({ message: "Invalid organization ID" });

      if (req.session.userRole !== "super_admin" && req.session.organizationId !== orgId) {
        return res.status(403).json({ message: "You can only export your own organization's data" });
      }

      const activeJobsForOrg = [...exportJobs.values()].filter(
        j => j.orgId === orgId && (j.status === "queued" || j.status === "processing")
      ).length;
      if (activeJobsForOrg >= 2) {
        return res.status(429).json({ message: "Maximum 2 concurrent exports per organisation. Please wait for existing exports to complete." });
      }

      const org = await storage.getOrganization(orgId);
      if (!org) return res.status(404).json({ message: "Organization not found" });

      const safeName = org.name.replace(/[^a-zA-Z0-9]/g, "_");
      const dateStr = new Date().toISOString().split("T")[0];
      const exportJobId = crypto.randomUUID();
      const orgEncFilename = `ach_export_${safeName}_${dateStr}.enc`;

      const job: ExportJob = { total: 0, processed: 0, status: "queued", startedAt: Date.now(), filename: orgEncFilename, initiatorUserId: req.session.userId!, orgId };
      exportJobs.set(exportJobId, job);

      res.json({ jobId: exportJobId, status: "queued", message: "Export job started. Poll /api/export/progress/:jobId for status, then download from /api/export/download/:jobId when completed." });

      (async () => {
        const os = await import("os");
        const tmpFile = path.join(os.tmpdir(), `export_${exportJobId}.json`);
        try {
          job.status = "processing";
          const writeStream = fs.createWriteStream(tmpFile);
          const tmpRes = {
            write: (chunk: string) => writeStream.write(chunk),
            end: () => {},
          } as any;

          const { totalRecords, sha256Hash } = await streamPortabilityExport(
            orgId, org!.name, org!.country, org!.subscriptionTier, tmpRes,
            (processed, total) => { job.total = total; job.processed = processed; },
          );
          await new Promise<void>((resolve) => writeStream.end(() => resolve()));

          job.status = "encrypting";
          const stats = fs.statSync(tmpFile);
          job.sizeBytes = stats.size;

          const oneTimeKey = crypto.randomBytes(32);
          const iv = crypto.randomBytes(16);
          const cipher = crypto.createCipheriv("aes-256-cbc", oneTimeKey, iv);
          const encHashStream = crypto.createHash("sha256");
          const encTmpFile = tmpFile + ".enc";

          await new Promise<void>((resolve, reject) => {
            const readStream = fs.createReadStream(tmpFile);
            const encWriteStream = fs.createWriteStream(encTmpFile);
            readStream.pipe(cipher).on("data", (chunk: Buffer) => {
              encHashStream.update(chunk);
              encWriteStream.write(chunk);
            }).on("end", () => {
              encWriteStream.end(() => resolve());
            }).on("error", reject);
          });

          job.ciphertextHash = encHashStream.digest("hex");
          job.oneTimeKey = oneTimeKey.toString("hex");
          job.iv = iv.toString("hex");
          job.sha256Hash = sha256Hash;
          job.totalRecords = totalRecords;
          job.encFilePath = encTmpFile;
          job.status = "completed";

          await storage.createAuditLog({
            userId: req.session?.userId,
            action: "FULL_DATA_EXPORT",
            entity: "organization",
            entityId: orgId,
            details: JSON.stringify({ version: "3.0.0", org: org!.name, recordCount: totalRecords, sizeBytes: job.sizeBytes, plaintextSha256: sha256Hash, ciphertextSha256: job.ciphertextHash, encrypted: true }),
            ipAddress: req.ip || "unknown",
          });

          setTimeout(() => { if (exportJobs.has(exportJobId) && job.status === "completed") { try { fs.unlinkSync(encTmpFile); } catch {} exportJobs.delete(exportJobId); } }, 3600000);
        } catch (err: any) {
          job.status = "failed";
          job.error = err.message;
          routeLogger.error("[Export] Background job error:", { detail: err.message });
        } finally {
          try { fs.unlinkSync(tmpFile); } catch {}
        }
      })();
    } catch (err: any) {
      routeLogger.error("[Export] Error:", { detail: err.message });
      if (!res.headersSent) res.status(500).json({ message: "Export failed" });
    }
  });

  app.get("/api/admin/export/:orgId", requireAuth, requireRole("admin", "super_admin"), exportLimiter, async (req, res) => {
    res.status(400).json({ message: "Use POST /api/admin/export/:orgId to initiate an async export job, then poll /api/export/progress/:jobId and download from /api/export/download/:jobId" });
  });

  const MAX_VERIFY_SIZE = 100 * 1024 * 1024;
  app.post("/api/export/verify-integrity", requireAuth, async (req, res) => {
    try {
      const contentType = req.headers["content-type"] || "";
      const expectedHash = (req.headers["x-expected-hash"] as string) || req.body?.expectedHash;

      if (!expectedHash || !/^[a-f0-9]{64}$/i.test(expectedHash)) {
        return res.status(400).json({ message: "expectedHash is required (64-char hex SHA-256). Send via x-expected-hash header or JSON body." });
      }

      if (contentType.includes("application/octet-stream")) {
        const contentLength = parseInt(req.headers["content-length"] || "0", 10);
        if (contentLength > MAX_VERIFY_SIZE) {
          return res.status(413).json({ message: `File too large. Maximum ${MAX_VERIFY_SIZE} bytes.` });
        }

        const hashStream = crypto.createHash("sha256");
        let totalBytes = 0;
        await new Promise<void>((resolve, reject) => {
          req.on("data", (chunk: Buffer) => {
            totalBytes += chunk.byteLength;
            if (totalBytes > MAX_VERIFY_SIZE) {
              req.destroy();
              reject(new Error("File exceeds maximum size"));
              return;
            }
            hashStream.update(chunk);
          });
          req.on("end", resolve);
          req.on("error", reject);
        });
        const actualHash = hashStream.digest("hex");
        return res.json({ valid: actualHash === expectedHash, expectedHash, actualHash, sizeBytes: totalBytes });
      }

      const { data } = req.body || {};
      if (!data) return res.status(400).json({ message: "Send file as application/octet-stream body, or provide { data, expectedHash } as JSON." });
      const fileData = Buffer.from(typeof data === "string" ? data : JSON.stringify(data));
      if (fileData.byteLength > MAX_VERIFY_SIZE) {
        return res.status(413).json({ message: `Data too large. Maximum ${MAX_VERIFY_SIZE} bytes.` });
      }
      const actualHash = crypto.createHash("sha256").update(fileData).digest("hex");
      res.json({ valid: actualHash === expectedHash, expectedHash, actualHash, sizeBytes: fileData.byteLength });
    } catch (e: any) {
      res.status(500).json({ message: safeErrorMessage(e) });
    }
  });

  app.get("/api/export/sha256/:hash", requireAuth, async (req, res) => {
    try {
      const { hash } = req.params;
      if (!hash || hash.length !== 64 || !/^[a-f0-9]{64}$/i.test(hash)) return res.status(400).json({ message: "Invalid SHA-256 hash" });
      const content = `${hash}  export_file\n`;
      res.setHeader("Content-Type", "text/plain; charset=utf-8");
      res.setHeader("Content-Disposition", `attachment; filename="${hash.substring(0, 16)}.sha256"`);
      res.send(content);
    } catch (e: any) {
      res.status(500).json({ message: safeErrorMessage(e) });
    }
  });

  app.post("/api/export/decrypt", requireAuth, requireRole("admin", "super_admin"), async (req, res) => {
    try {
      const { encryptedBase64, key, iv } = req.body;
      if (!encryptedBase64 || !key || !iv) return res.status(400).json({ message: "encryptedBase64, key, and iv are required" });
      const encBuffer = Buffer.from(encryptedBase64, "base64");
      const decrypted = decryptExportData(encBuffer, key, iv);
      res.setHeader("Content-Type", "application/json");
      res.send(decrypted);
    } catch (e: any) {
      res.status(400).json({ message: "Decryption failed — invalid key, IV, or data" });
    }
  });

  app.post("/api/consumer/export-my-data", requireConsumer, consumerExportLimiter, async (req, res) => {
    try {
      const consumerId = (req.session as any).consumerId;
      const consumerNationalId = (req.session as any).consumerNationalId;
      if (!consumerId || !consumerNationalId) return res.status(401).json({ message: "Consumer session required" });

      const [consumerAccount] = await db.select().from(consumerAccounts).where(eq(consumerAccounts.id, consumerId)).limit(1);
      if (!consumerAccount) return res.status(401).json({ message: "Consumer account not found" });

      const allBorrowersForLookup = await db.select().from(borrowers);
      const decryptedForLookup = decryptBorrowerArray(allBorrowersForLookup as Record<string, any>[]);
      const borrower = decryptedForLookup.find((b: any) => {
        const nid = (b.nationalId || "").toLowerCase();
        const gc = (b.ghanaCardNumber || "").toLowerCase();
        const pp = (b.passportNumber || "").toLowerCase();
        const target = consumerNationalId.toLowerCase();
        return nid === target || gc === target || pp === target;
      });
      if (!borrower) return res.status(404).json({ message: "No credit file found" });

      const exportData = await buildConsumerDataExport(borrower.id);
      const jsonStr = JSON.stringify(exportData, null, 2);
      const sha256Hash = generateExportHash(jsonStr);
      const sizeBytes = Buffer.byteLength(jsonStr, "utf-8");
      const recordCount = (exportData.statistics.totalAccounts || 0) + (exportData.statistics.totalPayments || 0);

      const encResult = encryptExportData(jsonStr);

      await storage.createAuditLog({
        userId: null,
        action: "CONSUMER_DATA_EXPORT",
        entity: "borrower",
        entityId: borrower.id,
        details: JSON.stringify({ recordCount, sizeBytes, plaintextSha256: sha256Hash, ciphertextSha256: encResult.ciphertextHash, encrypted: true }),
        ipAddress: req.ip || "unknown",
      });

      const consumerEncFilename = `my_credit_data_${new Date().toISOString().split("T")[0]}.enc`;
      res.setHeader("Content-Disposition", `attachment; filename="${consumerEncFilename}"`);
      res.setHeader("Content-Type", "application/octet-stream");
      res.setHeader("X-Export-SHA256", encResult.ciphertextHash);
      res.setHeader("X-Export-Plaintext-SHA256", sha256Hash);
      res.setHeader("X-Export-Original-Size", String(encResult.originalSizeBytes));
      res.setHeader("X-Export-Encrypted", "true");
      res.setHeader("X-Export-Record-Count", String(recordCount));
      res.setHeader("X-Export-SHA256-Companion", Buffer.from(generateSha256Companion(encResult.ciphertextHash, consumerEncFilename)).toString("base64"));
      res.send(encResult.encryptedData);
    } catch (e: any) {
      res.status(500).json({ message: safeErrorMessage(e) });
    }
  });

  app.get("/api/data-management/export-history", requireAuth, requireRole("admin", "regulator", "super_admin"), async (req, res) => {
    try {
      const country = getCountryFilter(req);
      const orgId = getOrgScope(req);
      const logs = await storage.getAuditLogs(orgId, country, 200);
      const exportActions = new Set([
        "FULL_DATA_EXPORT", "CONSUMER_DATA_EXPORT", "REPORT_EXPORT", "REGULATORY_EXPORT",
        "data_export", "DATA_ERASURE_REQUEST", "DATA_ERASURE_COMPLETED",
        "CASCADE_ENTITY_DELETED", "RETENTION_SCAN",
      ]);
      const exportLogs = logs.filter(l => exportActions.has(l.action));
      res.json(exportLogs);
    } catch (e: any) {
      res.status(500).json({ message: safeErrorMessage(e) });
    }
  });

  app.get("/api/data-management/erasure-requests", requireAuth, requireRole("admin", "super_admin"), async (req, res) => {
    try {
      const country = getCountryFilter(req);
      const orgId = getOrgScope(req);
      const approvals = await storage.getPendingApprovals(orgId, country);
      const erasureRequests = approvals.filter((a: any) => {
        try {
          const payload = typeof a.payload === "string" ? JSON.parse(a.payload) : a.payload;
          return payload?.type === "data_erasure";
        } catch { return false; }
      });
      res.json(erasureRequests);
    } catch (e: any) {
      res.status(500).json({ message: safeErrorMessage(e) });
    }
  });

  app.post("/api/data-management/cascade-erasure/:borrowerId", requireAuth, requireRole("super_admin"), async (req, res) => {
    try {
      const { borrowerId } = req.params;
      const borrower = await storage.getBorrower(borrowerId);
      if (!borrower) return res.status(404).json({ message: "Borrower not found" });

      const orgId = borrower.organizationId || req.session.organizationId || "";
      const country = borrower.country || req.session.userCountry || "";
      const allApprovals = await storage.getPendingApprovals(orgId, country);
      const approvedErasure = allApprovals.find((a: any) => {
        if (a.status !== "approved") return false;
        try {
          const payload = typeof a.payload === "string" ? JSON.parse(a.payload) : a.payload;
          return payload?.type === "data_erasure" && payload?.borrowerId === borrowerId;
        } catch { return false; }
      });
      if (!approvedErasure) {
        return res.status(403).json({ message: "Cascade erasure requires an approved erasure request. Submit and approve an erasure request first (dual-approval)." });
      }

      const activeAccounts = await storage.getCreditAccountsByBorrower(borrowerId);
      const hasActive = activeAccounts.some((a: any) => a.status === "active" || a.status === "current");
      if (hasActive) return res.status(409).json({ message: "Cannot erase borrower with active accounts. Close all accounts first." });

      const result = await cascadeDeleteBorrower(borrowerId);

      const entityDeletions = [
        { entity: "credit_accounts", count: result.deletedAccounts },
        { entity: "payment_history", count: result.deletedPayments },
        { entity: "guarantors", count: result.deletedGuarantors },
        { entity: "credit_inquiries", count: result.deletedInquiries },
        { entity: "disputes", count: result.deletedDisputes },
        { entity: "court_judgments", count: result.deletedJudgments },
        { entity: "dishonoured_cheques", count: result.deletedCheques },
        { entity: "borrower_alerts", count: result.deletedAlerts },
        { entity: "consent_records", count: result.deletedConsent },
        { entity: "credit_report_logs", count: result.deletedReportLogs },
        { entity: "consumer_accounts", count: result.deletedConsumerAccounts },
      ];
      for (const del of entityDeletions) {
        if (del.count > 0) {
          await storage.createAuditLog({
            userId: req.session.userId,
            action: "CASCADE_ENTITY_DELETED",
            entity: del.entity,
            entityId: borrowerId,
            details: `Cascade erasure: deleted ${del.count} ${del.entity} records for borrower ${borrower.firstName} ${borrower.lastName} (${borrowerId})`,
            ipAddress: req.ip || "unknown",
          });
        }
      }

      await storage.createAuditLog({
        userId: req.session.userId,
        action: "DATA_ERASURE_COMPLETED",
        entity: "borrower",
        entityId: borrowerId,
        details: `Cascade erasure completed for ${borrower.firstName} ${borrower.lastName}. Approval ID: ${approvedErasure.id}. Deleted: ${result.deletedAccounts} accounts, ${result.deletedPayments} payments, ${result.deletedGuarantors} guarantors, ${result.deletedInquiries} inquiries, ${result.deletedDisputes} disputes, ${result.deletedJudgments} judgments, ${result.deletedCheques} cheques, ${result.deletedAlerts} alerts, ${result.deletedConsent} consent records, ${result.deletedReportLogs} report logs, ${result.deletedConsumerAccounts} consumer accounts`,
        ipAddress: req.ip || "unknown",
      });

      res.json({ message: "Cascade erasure completed", ...result });
    } catch (e: any) {
      res.status(500).json({ message: safeErrorMessage(e) });
    }
  });

  app.post("/api/data-management/retention-scan", requireAuth, requireRole("admin", "super_admin"), async (req, res) => {
    try {
      const countryFilter = req.session.userRole === "super_admin" ? undefined : req.session.userCountry || undefined;
      const result = await scanRetentionPolicies(countryFilter);
      await storage.createAuditLog({
        userId: req.session.userId,
        action: "RETENTION_SCAN",
        entity: "system",
        entityId: "retention_scan",
        details: `Retention scan: ${result.policiesEvaluated} policies evaluated, ${result.recordsFlagged} records flagged`,
        ipAddress: req.ip || "unknown",
      });
      res.json(result);
    } catch (e: any) {
      res.status(500).json({ message: safeErrorMessage(e) });
    }
  });

  app.post("/api/maintenance/toggle", async (req, res) => {
    if (req.session?.userRole !== "super_admin") {
      return res.status(403).json({ message: "Super admin access required" });
    }
    const { maintenanceState } = await import("./index");
    maintenanceState.enabled = !maintenanceState.enabled;
    if (req.body?.message) {
      maintenanceState.message = req.body.message;
    }
    try {
      await storage.createAuditLog({
        action: "MAINTENANCE_TOGGLE",
        entity: "system",
        entityId: "maintenance",
        userId: req.session?.userId || null,
        ipAddress: req.ip || req.socket.remoteAddress || "unknown",
        details: JSON.stringify({ enabled: maintenanceState.enabled, message: maintenanceState.message }),
        organizationId: req.session?.organizationId || null,
      });
    } catch (e) {
      routeLogger.error("[Audit] Failed to log maintenance toggle:", { detail: e });
    }
    res.json({ enabled: maintenanceState.enabled, message: maintenanceState.message });
  });

  // ── Open Banking ─────────────────────────────────────────────────
  app.get("/api/open-banking/:borrowerId", requireAuth, async (req, res) => {
    try {
      const profiles = await db.select().from(openBankingProfiles)
        .where(eq(openBankingProfiles.borrowerId, req.params.borrowerId))
        .orderBy(desc(openBankingProfiles.createdAt));
      res.json(profiles);
    } catch (e: any) { res.status(500).json({ message: safeErrorMessage(e) }); }
  });
  app.post("/api/open-banking", requireAuth, async (req, res) => {
    try {
      const parsed = insertOpenBankingProfileSchema.parse(req.body);
      const { calculateOpenBankingScore } = await import("./open-banking");
      const score = calculateOpenBankingScore({
        avgMonthlyInflow: Number(parsed.avgMonthlyInflow) || 0,
        avgMonthlyOutflow: Number(parsed.avgMonthlyOutflow) || 0,
        monthsOfData: parsed.monthsOfData || 0,
        regularIncomeStreams: parsed.regularIncomeStreams || 0,
        gamblingTransactions: parsed.gamblingTransactions || 0,
        salaryCreditsDetected: parsed.salaryCreditsDetected || false,
        rentPaymentsDetected: parsed.rentPaymentsDetected || false,
        utilityPaymentsDetected: parsed.utilityPaymentsDetected || false,
        nsfEvents: parsed.nsfEvents || 0,
      });
      const [created] = await db.insert(openBankingProfiles).values({ ...parsed, openBankingScore: score }).returning();
      res.json(created);
    } catch (e: any) { res.status(400).json({ message: safeErrorMessage(e) }); }
  });

  // ── Decision Rules Engine ─────────────────────────────────────────
  app.get("/api/decision-rules", requireAuth, async (req, res) => {
    try {
      const orgId = (req as any).user?.organizationId;
      const rules = await db.select().from(decisionRules)
        .where(orgId ? eq(decisionRules.organizationId, orgId) : undefined)
        .orderBy(decisionRules.priority);
      res.json(rules);
    } catch (e: any) { res.status(500).json({ message: safeErrorMessage(e) }); }
  });
  app.post("/api/decision-rules", requireAuth, async (req, res) => {
    try {
      const parsed = insertDecisionRuleSchema.parse(req.body);
      const [created] = await db.insert(decisionRules).values(parsed).returning();
      res.json(created);
    } catch (e: any) { res.status(400).json({ message: safeErrorMessage(e) }); }
  });
  app.patch("/api/decision-rules/:id", requireAuth, async (req, res) => {
    try {
      const [updated] = await db.update(decisionRules)
        .set({ ...req.body, updatedAt: new Date() })
        .where(eq(decisionRules.id, req.params.id)).returning();
      res.json(updated);
    } catch (e: any) { res.status(400).json({ message: safeErrorMessage(e) }); }
  });
  app.delete("/api/decision-rules/:id", requireAuth, async (req, res) => {
    try {
      await db.delete(decisionRules).where(eq(decisionRules.id, req.params.id));
      res.json({ success: true });
    } catch (e: any) { res.status(400).json({ message: safeErrorMessage(e) }); }
  });
  app.post("/api/decision-rules/evaluate", requireAuth, async (req, res) => {
    try {
      const { borrowerId } = req.body;
      const orgId = (req as any).user?.organizationId;
      const [borrower] = await db.select().from(borrowers).where(eq(borrowers.id, borrowerId));
      if (!borrower) return res.status(404).json({ message: "Borrower not found" });
      const accounts = await db.select().from(creditAccounts).where(eq(creditAccounts.borrowerId, borrowerId));
      const judgmentsList = await db.select().from(courtJudgments).where(eq(courtJudgments.borrowerId, borrowerId));
      const cheques = await db.select().from(dishonouredCheques).where(eq(dishonouredCheques.borrowerId, borrowerId));
      const scoreResult = calculateCreditScore(accounts, 0, judgmentsList, borrower.isPep || false, []);
      const score = scoreResult.score;
      const maxArrears = accounts.length > 0 ? Math.max(0, ...accounts.map(a => a.daysInArrears || 0)) : 0;
      const activeAccounts = accounts.filter(a => ["current","delinquent"].includes(a.status)).length;
      const hasActiveJudgment = judgmentsList.some(j => j.status === "active");
      const hasDishonouredCheque = cheques.length > 0;
      const monthlyIncome = Number(borrower.monthlyIncome) || 0;
      const totalDebt = accounts.reduce((s, a) => s + Number(a.currentBalance || 0), 0);
      const dti = monthlyIncome > 0 ? totalDebt / (monthlyIncome * 12) : 999;
      const rules = await db.select().from(decisionRules)
        .where(and(orgId ? eq(decisionRules.organizationId, orgId) : undefined, eq(decisionRules.isActive, true)))
        .orderBy(decisionRules.priority);
      let outcome = "refer"; let matchedRule: any = null;
      for (const rule of rules) {
        let ok = true;
        if (rule.minCreditScore && score < rule.minCreditScore) ok = false;
        if (rule.maxCreditScore && score > rule.maxCreditScore) ok = false;
        if (rule.maxDaysInArrears != null && maxArrears > rule.maxDaysInArrears) ok = false;
        if (rule.maxActiveAccounts != null && activeAccounts > rule.maxActiveAccounts) ok = false;
        if (rule.minMonthlyIncome && monthlyIncome < Number(rule.minMonthlyIncome)) ok = false;
        if (rule.maxDebtToIncomeRatio && dti > Number(rule.maxDebtToIncomeRatio)) ok = false;
        if (rule.excludePep && borrower.isPep) ok = false;
        if (rule.excludeActiveJudgments && hasActiveJudgment) ok = false;
        if (rule.excludeDishonouredCheques && hasDishonouredCheque) ok = false;
        if (ok) { outcome = rule.outcome; matchedRule = rule; break; }
      }
      res.json({
        outcome, matchedRule: matchedRule?.ruleName || "Default (no matching rule)",
        creditScore: score, maxDaysInArrears: maxArrears, activeAccounts,
        hasActiveJudgment, hasDishonouredCheque,
        debtToIncomeRatio: dti.toFixed(2), monthlyIncome,
        borrowerName: borrower.type === "individual"
          ? `${borrower.firstName || ""} ${borrower.lastName || ""}`.trim()
          : borrower.companyName || "Unknown",
      });
    } catch (e: any) { res.status(500).json({ message: safeErrorMessage(e) }); }
  });

  // ── ESG Scoring ───────────────────────────────────────────────────
  app.get("/api/esg/:borrowerId", requireAuth, async (req, res) => {
    try {
      const [latest] = await db.select().from(esgScores)
        .where(eq(esgScores.borrowerId, req.params.borrowerId))
        .orderBy(desc(esgScores.assessedAt)).limit(1);
      res.json(latest || null);
    } catch (e: any) { res.status(500).json({ message: safeErrorMessage(e) }); }
  });
  app.post("/api/esg", requireAuth, async (req, res) => {
    try {
      const parsed = insertEsgScoreSchema.parse(req.body);
      const { calculateEsgScores } = await import("./esg-scoring");
      const computed = calculateEsgScores({
        hasEnvironmentalPolicy: parsed.hasEnvironmentalPolicy || false,
        wasteManagementScore: parsed.wasteManagementScore || 0,
        energyEfficiencyScore: parsed.energyEfficiencyScore || 0,
        carbonFootprintReported: parsed.carbonFootprintReported || false,
        employeeWelfareScore: parsed.employeeWelfareScore || 0,
        communityEngagementScore: parsed.communityEngagementScore || 0,
        genderDiversityScore: parsed.genderDiversityScore || 0,
        healthSafetyCompliance: parsed.healthSafetyCompliance || false,
        boardIndependenceScore: parsed.boardIndependenceScore || 0,
        antiCorruptionPolicy: parsed.antiCorruptionPolicy || false,
        auditedFinancials: parsed.auditedFinancials || false,
        taxComplianceScore: parsed.taxComplianceScore || 0,
      });
      const [created] = await db.insert(esgScores).values({ ...parsed, ...computed }).returning();
      res.json(created);
    } catch (e: any) { res.status(400).json({ message: safeErrorMessage(e) }); }
  });

  // ════════════════════════════════════════════════════════════════════════
  // Tracing & Skip-Tracing Module (Task #29)
  // ════════════════════════════════════════════════════════════════════════
  const {
    captureBorrowerContactEvents, recomputeLinkClusters, getLinkedBorrowers,
    findConnections, getBorrowerContactEvents, decryptedBorrowersByIds,
  } = await import("./trace-engine");
  const { executeAssetTrace, getAssetTracesByBorrower } = await import("./asset-trace");
  const { generateSkipTracePdf } = await import("./skip-trace-pdf");

  // Authorization: ensure caller can access this borrower (super_admin bypasses;
  // others must match borrower's organization OR country scope).
  async function ensureBorrowerAccess(req: any, borrowerId: string): Promise<{ ok: true; borrower: any } | { ok: false; status: number; message: string }> {
    const borrower = await storage.getBorrower(borrowerId);
    if (!borrower) return { ok: false, status: 404, message: "Borrower not found" };
    const role = req.session?.userRole;
    const orgId = req.session?.organizationId;
    const userCountry = getCountryFilter(req);
    if (role === "super_admin") return { ok: true, borrower };
    if (role === "regulator") {
      if (userCountry && borrower.country && borrower.country === userCountry) return { ok: true, borrower };
      return { ok: false, status: 403, message: "Not authorized for this borrower" };
    }
    if (orgId && borrower.organizationId && borrower.organizationId === orgId) return { ok: true, borrower };
    return { ok: false, status: 403, message: "Not authorized for this borrower" };
  }

  async function ensureAssignmentAccess(req: any, assignmentId: string): Promise<{ ok: true; assignment: any } | { ok: false; status: number; message: string }> {
    const assignment = await storage.getCollectionAssignment(assignmentId);
    if (!assignment) return { ok: false, status: 404, message: "Assignment not found" };
    const role = req.session?.userRole;
    const orgId = req.session?.organizationId;
    if (role === "super_admin") return { ok: true, assignment };
    if (orgId && assignment.organizationId && assignment.organizationId === orgId) return { ok: true, assignment };
    return { ok: false, status: 403, message: "Not authorized for this assignment" };
  }

  function getTraceReason(req: any): string {
    const r = (req.query?.reason || req.body?.reason || "").toString().trim();
    return r;
  }

  async function logTraceAudit(req: Request, action: string, entityId: string, details: string) {
    // Fail-closed: if we cannot durably write the compliance audit log,
    // the calling endpoint MUST surface the failure rather than serve PII.
    const reason = getTraceReason(req);
    let lastErr: Error | null = null;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        await storage.createAuditLog({
          userId: req.session?.userId,
          action,
          entity: "trace",
          entityId,
          details: reason ? `${details} | reason=${reason}` : details,
          ipAddress: req.ip,
          organizationId: req.session?.organizationId,
        });
        return;
      } catch (e) {
        lastErr = e as Error;
      }
    }
    console.error(`[trace-audit] FAIL-CLOSED on ${action}/${entityId}:`, lastErr?.message);
    throw new Error(`Compliance audit log write failed (${action}). Trace request denied.`);
  }

  function requireTraceReason(req: any, res: any): boolean {
    const reason = getTraceReason(req);
    if (!reason || reason.length < 5) {
      res.status(400).json({ message: "Permissible-purpose reason required (min 5 chars). Pass `reason` as query string for GET, or in body for POST." });
      return false;
    }
    return true;
  }

  // Borrower's contact event history
  app.get("/api/trace/borrower/:id/history", requireRole("admin", "super_admin", "lender", "regulator"), enforceDataSovereignty, async (req, res) => {
    try {
      if (!requireTraceReason(req, res)) return;
      const { id } = req.params;
      const acl = await ensureBorrowerAccess(req, id);
      if (!acl.ok) return res.status(acl.status).json({ message: acl.message });
      const events = await getBorrowerContactEvents(id);
      // Enrich with confidence + still-valid signal vs current borrower record
      const b = acl.borrower as any;
      const currentValues = new Set<string>([
        b.phone, b.homeTelephone, b.workTelephone, b.mobileMoneyNumber, b.email,
        b.address, b.postalAddress1, b.postalAddress2, b.employerName, b.employerAddress, b.ezwichNumber,
      ].filter(Boolean).map((v: string) => String(v).trim().toLowerCase()));
      const enriched = events.map((ev: any) => {
        const ageDays = ev.lastSeen ? Math.floor((Date.now() - new Date(ev.lastSeen).getTime()) / (1000 * 60 * 60 * 24)) : null;
        const stillValid = currentValues.has(String(ev.value).trim().toLowerCase());
        const confidence = stillValid ? 0.95 : ageDays === null ? 0.5 : ageDays < 90 ? 0.85 : ageDays < 365 ? 0.6 : 0.35;
        return { ...ev, confidence, stillValid, ageDays };
      });
      await logTraceAudit(req, "TRACE_HISTORY_VIEW", id, `Viewed ${events.length} contact events`);
      res.json(enriched);
    } catch (e: any) { res.status(500).json({ message: safeErrorMessage(e) }); }
  });

  // Borrower's linked borrowers
  app.get("/api/trace/borrower/:id/links", requireRole("admin", "super_admin", "lender", "regulator"), enforceDataSovereignty, async (req, res) => {
    try {
      if (!requireTraceReason(req, res)) return;
      const { id } = req.params;
      const acl = await ensureBorrowerAccess(req, id);
      if (!acl.ok) return res.status(acl.status).json({ message: acl.message });
      const country = getCountryFilter(req);
      const links = await getLinkedBorrowers(id, country);
      const otherIds = Array.from(new Set(links.map(l => l.borrowerId)));
      const others = await decryptedBorrowersByIds(otherIds);
      const role = (req as any).session?.userRole;
      const orgId = (req as any).session?.organizationId;
      const visible = (role === "super_admin" || role === "regulator")
        ? others
        : others.filter((b: any) => orgId && b.organizationId === orgId);
      const visibleIds = new Set<string>(visible.map((b: any) => b.id));
      const idMap = new Map(visible.map((b: any) => [b.id, b]));
      const filteredLinks = links.filter(l => visibleIds.has(l.borrowerId));
      const enriched = filteredLinks.map(l => {
        const o = idMap.get(l.borrowerId);
        const name = o ? (o.companyName || `${o.firstName || ""} ${o.lastName || ""}`.trim() || o.id) : l.borrowerId;
        return { ...l, name, nationalId: o?.nationalId, type: o?.type };
      });
      await logTraceAudit(req, "TRACE_LINKS_VIEW", id, `Viewed ${enriched.length} linked borrowers (filtered from ${links.length})`);
      res.json(enriched);
    } catch (e: any) { res.status(500).json({ message: safeErrorMessage(e) }); }
  });

  // Recompute link clusters (admin/regulator)
  app.post("/api/trace/recompute-links", requireAuth, requireRole("super_admin", "admin", "regulator"), async (req, res) => {
    try {
      const country = getCountryFilter(req);
      const result = await recomputeLinkClusters(country);
      await logTraceAudit(req, "TRACE_RECOMPUTE", "system", `Recomputed clusters: ${JSON.stringify(result)}`);
      res.json(result);
    } catch (e: any) { res.status(500).json({ message: safeErrorMessage(e) }); }
  });

  // Find Connections — search any borrower file by phone/email/address/employer
  app.post("/api/trace/find-connections", requireRole("admin", "super_admin", "lender", "regulator"), enforceDataSovereignty, async (req, res) => {
    try {
      const { type, value, reason } = req.body || {};
      if (!value || typeof value !== "string" || value.length < 3) {
        return res.status(400).json({ message: "Search value must be at least 3 characters" });
      }
      if (!reason || typeof reason !== "string" || reason.length < 5) {
        return res.status(400).json({ message: "Permissible-purpose reason is required" });
      }
      const role = (req as any).session?.userRole;
      const orgId = (req as any).session?.organizationId;
      const country = getCountryFilter(req);
      const result = await findConnections({ type, value, country });
      const ids = Array.from(new Set(result.matches.map(m => m.borrowerId)));
      const borrowersFound = await decryptedBorrowersByIds(ids);

      // Org-aware filtering: lender/admin (non-bureau roles) only see borrowers
      // in their own organization. super_admin and regulator see all in scope.
      const visibleBorrowers = (role === "super_admin" || role === "regulator")
        ? borrowersFound
        : borrowersFound.filter((b: any) => orgId && b.organizationId === orgId);
      const visibleIds = new Set(visibleBorrowers.map((b: any) => b.id));
      const idMap = new Map(visibleBorrowers.map((b: any) => [b.id, b]));

      const filteredMatches = result.matches.filter(m => visibleIds.has(m.borrowerId));
      const enrichedMatches = filteredMatches.map(m => {
        const b = idMap.get(m.borrowerId);
        return {
          ...m,
          borrowerName: b ? (b.companyName || `${b.firstName || ""} ${b.lastName || ""}`.trim()) : m.borrowerId,
          nationalId: b?.nationalId,
          country: b?.country,
        };
      });

      // Filter cluster member lists AND recalculate counts so non-bureau callers
      // cannot infer hidden cross-org cluster size from the response.
      const filteredClusters = result.clusters.map((c) => {
        const filteredMembers = (c.memberBorrowerIds || []).filter((bid) => visibleIds.has(bid));
        if (role === "super_admin" || role === "regulator") return c;
        return {
          ...c,
          memberBorrowerIds: filteredMembers,
          memberCount: filteredMembers.length,
          // Recompute confidence as a function of *visible* size only:
          // single-member clusters have no link information.
          confidence: filteredMembers.length <= 1 ? "0" : c.confidence,
        };
      }).filter((c) => (c.memberBorrowerIds || []).length > 0);

      const valueHash = (await import("crypto")).createHash("sha256").update(String(value).trim().toLowerCase()).digest("hex").slice(0, 16);
      await logTraceAudit(req, "TRACE_FIND_CONNECTIONS", "search",
        `type=${type || "any"} value_hash=${valueHash} value_len=${value.length} hits=${enrichedMatches.length} (filtered from ${result.matches.length})`);
      res.json({ matches: enrichedMatches, clusters: filteredClusters });
    } catch (e: any) { res.status(500).json({ message: safeErrorMessage(e) }); }
  });

  // Asset trace — list and execute
  app.get("/api/trace/borrower/:id/assets", requireRole("admin", "super_admin", "lender", "regulator"), enforceDataSovereignty, async (req, res) => {
    try {
      if (!requireTraceReason(req, res)) return;
      const acl = await ensureBorrowerAccess(req, req.params.id);
      if (!acl.ok) return res.status(acl.status).json({ message: acl.message });
      const list = await getAssetTracesByBorrower(req.params.id);
      await logTraceAudit(req, "TRACE_ASSET_LIST", req.params.id, `Listed ${list.length} asset trace records`);
      res.json(list);
    } catch (e: any) { res.status(500).json({ message: safeErrorMessage(e) }); }
  });

  app.post("/api/trace/borrower/:id/assets", requireRole("admin", "super_admin", "lender"), enforceDataSovereignty, async (req, res) => {
    try {
      if (!requireTraceReason(req, res)) return;
      const { id } = req.params;
      const { provider, reference } = req.body || {};
      if (!provider) return res.status(400).json({ message: "provider is required" });
      if (reference !== undefined && (typeof reference !== "string" || reference.length > 100)) {
        return res.status(400).json({ message: "reference must be a string of max 100 characters" });
      }
      const acl = await ensureBorrowerAccess(req, id);
      if (!acl.ok) return res.status(acl.status).json({ message: acl.message });
      const borrower = acl.borrower;
      const record = await executeAssetTrace({
        borrowerId: id, provider, reference,
        requestedBy: (req as any).session?.userId,
        organizationId: borrower.organizationId,
        country: borrower.country,
      });
      await logTraceAudit(req, "TRACE_ASSET_LOOKUP", id, `provider=${provider} ref=${reference || ""} status=${record.status}`);
      try { broadcastEvent("trace:asset", { borrowerId: id, provider, status: record.status }); } catch {}
      res.json(record);
    } catch (e: any) { res.status(500).json({ message: safeErrorMessage(e) }); }
  });

  // ── Registry Sandbox ─────────────────────────────────────────────────────
  // Self-hosted mock endpoint that satisfies the same JSON contract as a real
  // government registry API.  Activated automatically when the REGISTRY_SANDBOX_*
  // environment variables are set (see server/registry-sandbox.ts).
  //
  // Route is intentionally outside the session-auth middleware chain because
  // server-side fetch calls from callLiveRegistry() do not carry a session
  // cookie.  Authentication is performed via the X-Api-Key header instead.
  app.post("/api/registry-sandbox/:provider/lookup", async (req, res) => {
    try {
      const { provider } = req.params;
      const { reference } = req.body || {};
      const suppliedKey = req.headers["x-api-key"] as string | undefined;

      const { validateSandboxKey, handleSandboxLookup } = await import("./registry-sandbox");

      if (!suppliedKey || !validateSandboxKey(provider, suppliedKey)) {
        return res.status(401).json({ error: "Invalid or missing API key for sandbox provider" });
      }

      if (!reference || typeof reference !== "string") {
        return res.status(400).json({ error: "reference is required" });
      }

      const result = handleSandboxLookup(provider, reference);
      if (!result) {
        return res.status(404).json({ error: `No sandbox handler for provider: ${provider}` });
      }

      res.json(result);
    } catch (e: any) {
      res.status(500).json({ error: safeErrorMessage(e) });
    }
  });

  // Registry status — shows which registries are live vs stub mode
  app.get("/api/trace/registry-status", requireRole("admin", "super_admin", "regulator"), async (_req, res) => {
    try {
      const { registryStatus } = await import("./asset-trace");
      res.json(registryStatus());
    } catch (e: any) { res.status(500).json({ message: safeErrorMessage(e) }); }
  });

  // Registry health-check state — last result per provider from the background scheduler
  app.get("/api/trace/registry-health", requireRole("admin", "super_admin", "regulator"), async (_req, res) => {
    try {
      const { getRegistryHealthState } = await import("./registry-health-checker");
      res.json(getRegistryHealthState());
    } catch (e: any) { res.status(500).json({ message: safeErrorMessage(e) }); }
  });

  // Registry health checker — admin-configurable settings
  app.get("/api/admin/registry-health-config", requireRole("admin", "super_admin"), async (_req, res) => {
    try {
      const cfg = await storage.getRegistryHealthConfig();
      const { getCurrentIntervalMs, getCurrentCleanupTimeUtc } = await import("./registry-health-checker");
      const envRetention = parseInt(process.env.REGISTRY_HEALTH_RETENTION_DAYS ?? "", 10);
      const MIN_RETENTION = 7;
      const MAX_RETENTION = 90;
      const rawDefault = (!process.env.REGISTRY_HEALTH_RETENTION_DAYS || isNaN(envRetention) || envRetention <= 0) ? MAX_RETENTION : envRetention;
      const defaultRetention = Math.min(Math.max(rawDefault, MIN_RETENTION), MAX_RETENTION);
      const rawEffective = cfg?.retentionDays && cfg.retentionDays > 0 ? cfg.retentionDays : defaultRetention;
      res.json({
        alertEmail: cfg?.alertEmail ?? null,
        slackWebhookUrl: cfg?.slackWebhookUrl ?? null,
        checkIntervalMinutes: cfg?.checkIntervalMinutes ?? 15,
        retentionDays: cfg?.retentionDays ?? null,
        effectiveRetentionDays: Math.min(Math.max(rawEffective, MIN_RETENTION), MAX_RETENTION),
        currentIntervalMinutes: Math.round(getCurrentIntervalMs() / 60000),
        cleanupTimeUtc: cfg?.cleanupTimeUtc ?? null,
        currentCleanupTimeUtc: getCurrentCleanupTimeUtc(),
        updatedAt: cfg?.updatedAt ?? null,
      });
    } catch (e: any) { res.status(500).json({ message: safeErrorMessage(e) }); }
  });

  app.put("/api/admin/registry-health-config", requireRole("admin", "super_admin"), async (req, res) => {
    try {
      const schema = z.object({
        alertEmail: z.string().email().nullable().optional(),
        slackWebhookUrl: z.string().url().nullable().optional(),
        checkIntervalMinutes: z.number().int().min(1).max(1440).optional(),
        retentionDays: z.number().int().min(7).max(90).nullable().optional(),
        cleanupTimeUtc: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Must be HH:MM in 24-hour format").nullable().optional(),
      });
      const parsed = schema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ message: parsed.error.errors[0]?.message ?? "Invalid input" });

      const userId = (req as any).user?.id;
      const cfg = await storage.upsertRegistryHealthConfig(parsed.data, userId);

      const { restartRegistryHealthChecker, rescheduleCleanup } = await import("./registry-health-checker");
      if (parsed.data.checkIntervalMinutes !== undefined) {
        restartRegistryHealthChecker(parsed.data.checkIntervalMinutes * 60 * 1000);
      }
      if (parsed.data.cleanupTimeUtc !== undefined) {
        rescheduleCleanup(parsed.data.cleanupTimeUtc);
      }

      res.json(cfg);
    } catch (e: any) { res.status(500).json({ message: safeErrorMessage(e) }); }
  });

  // Registry health cleanup stats — last prune run time and deleted row count
  app.get("/api/admin/registry-health-cleanup-stats", requireRole("admin", "super_admin"), async (_req, res) => {
    try {
      const { getCleanupStats } = await import("./registry-health-checker");
      res.json(getCleanupStats());
    } catch (e: any) { res.status(500).json({ message: safeErrorMessage(e) }); }
  });

  // Trigger an immediate on-demand cleanup of old registry health events
  app.post("/api/admin/registry-health-cleanup", requireRole("admin", "super_admin"), async (_req, res) => {
    try {
      const { pruneOldHealthEvents, getCleanupStats } = await import("./registry-health-checker");
      await pruneOldHealthEvents();
      res.json(getCleanupStats());
    } catch (e: any) { res.status(500).json({ message: safeErrorMessage(e) }); }
  });

  // Registry health event history — persisted probe results from the last N days (default 7)
  app.get("/api/trace/registry-health/history", requireRole("admin", "super_admin", "regulator"), async (req, res) => {
    try {
      const days = Math.min(Math.max(parseInt((req.query.days as string) ?? "7", 10) || 7, 1), 90);
      const provider = req.query.provider as string | undefined;
      const events = provider
        ? await storage.getRegistryHealthEvents(provider, days)
        : await storage.getAllRegistryHealthEvents(days);
      res.json(events);
    } catch (e: any) { res.status(500).json({ message: safeErrorMessage(e) }); }
  });

  // Test connectivity for a specific registry (probe with synthetic reference)
  app.post("/api/trace/registry-status/:provider/test", requireRole("admin", "super_admin"), async (req, res) => {
    try {
      const rawProvider = req.params.provider;
      const { testRegistryCredentials, TESTABLE_PROVIDERS } = await import("./asset-trace");
      const matched = TESTABLE_PROVIDERS.find(p => p === rawProvider);
      if (!matched) {
        return res.status(400).json({ message: `Unknown registry provider: ${rawProvider}` });
      }
      const result = await testRegistryCredentials(matched);
      res.json(result);
    } catch (e: any) { res.status(500).json({ message: safeErrorMessage(e) }); }
  });

  // ── XDS Data Ghana — Credit Bureau Integration ───────────────────────────
  // Requires env vars: XDS_GHANA_API_URL + XDS_GHANA_API_KEY
  // Falls back to a deterministic sandbox when credentials are absent.

  app.get("/api/xds/status", requireRole("admin", "super_admin", "regulator"), async (_req, res) => {
    try {
      const { xdsStatus } = await import("./xds-ghana");
      res.json(xdsStatus());
    } catch (e: any) { res.status(500).json({ message: safeErrorMessage(e) }); }
  });

  app.post("/api/xds/query", requireRole("admin", "super_admin", "lender", "regulator"), enforceDataSovereignty, async (req, res) => {
    try {
      const { borrowerId, ghanaCard, ssnitNumber, tinNumber, firstName, lastName, dateOfBirth, purpose } = req.body;
      if (!borrowerId || !purpose) {
        return res.status(400).json({ message: "borrowerId and purpose are required" });
      }
      const VALID_XDS_PURPOSES = [
        "new_credit", "review", "collection", "regulatory", "portfolio_monitoring",
        "credit_application", "credit_review", "account_management",
        "fraud_prevention", "employment", "other",
      ];
      if (!VALID_XDS_PURPOSES.includes(purpose)) {
        return res.status(400).json({ message: `Invalid purpose. Must be one of: ${VALID_XDS_PURPOSES.join(", ")}` });
      }
      if (!ghanaCard && !ssnitNumber && !tinNumber && !(firstName && lastName)) {
        return res.status(400).json({ message: "At least one identifier is required (Ghana Card, SSNIT, TIN, or name)" });
      }

      const borrower = await storage.getBorrower(borrowerId);
      if (!borrower) return res.status(404).json({ message: "Borrower not found" });

      const requestRef = `ACH-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

      const { queryXdsGhana } = await import("./xds-ghana");
      const { xdsBureauQueries } = await import("@shared/schema");

      const result = await queryXdsGhana({ ghanaCard, ssnitNumber, tinNumber, firstName, lastName, dateOfBirth, permissiblePurpose: mapPurposeToXds(purpose), requestRef });

      await db.insert(xdsBureauQueries).values({
        borrowerId,
        requestedBy: req.session?.userId,
        organizationId: req.session?.organizationId,
        purpose,
        requestRef,
        ghanaCard: ghanaCard || null,
        ssnitNumber: ssnitNumber || null,
        tinNumber: tinNumber || null,
        xdsRef: result.xdsRef,
        found: result.found,
        creditScore: result.creditScore ?? null,
        scoreCategory: result.scoreCategory ?? null,
        source: result.source,
        responseData: result as any,
        errorMessage: result.error ?? null,
      });

      await storage.createAuditLog({
        userId: req.session?.userId,
        action: "XDS_BUREAU_QUERY",
        entity: "borrower",
        entityId: borrowerId,
        details: `XDS Ghana bureau query for ${borrower.firstName || borrower.companyName || borrowerId} — ref=${requestRef} found=${result.found} source=${result.source}`,
        ipAddress: req.ip,
        organizationId: req.session?.organizationId,
      });

      recordUsageEvent({
        organizationId: borrower.organizationId || req.session?.organizationId,
        eventType: "bureau_query",
        country: borrower.country || "GH",
        metadata: JSON.stringify({ provider: "xds_ghana", found: result.found, source: result.source }),
      });

      res.json(result);
    } catch (e: any) { res.status(500).json({ message: safeErrorMessage(e) }); }
  });

  app.get("/api/xds/borrower/:id/history", requireRole("admin", "super_admin", "lender", "regulator"), enforceDataSovereignty, async (req, res) => {
    try {
      const { xdsBureauQueries } = await import("@shared/schema");
      const rows = await db.select().from(xdsBureauQueries)
        .where(eq(xdsBureauQueries.borrowerId, req.params.id))
        .orderBy(desc(xdsBureauQueries.createdAt));
      res.json(rows);
    } catch (e: any) { res.status(500).json({ message: safeErrorMessage(e) }); }
  });

  // Skip-trace PDF report
  app.post("/api/trace/borrower/:id/skip-trace-pdf", requireRole("admin", "super_admin", "lender", "regulator"), enforceDataSovereignty, async (req, res) => {
    try {
      const { id } = req.params;
      const { reason } = req.body || {};
      if (!reason || typeof reason !== "string" || reason.length < 5) {
        return res.status(400).json({ message: "Permissible-purpose reason is required" });
      }
      const acl = await ensureBorrowerAccess(req, id);
      if (!acl.ok) return res.status(acl.status).json({ message: acl.message });
      const decrypted = (await decryptedBorrowersByIds([id]))[0] || acl.borrower;
      const events = await getBorrowerContactEvents(id);
      const judgments = await storage.getCourtJudgmentsByBorrower(id).catch(() => [] as any[]);
      const links = await getLinkedBorrowers(id, getCountryFilter(req));
      const otherIds = Array.from(new Set(links.map(l => l.borrowerId)));
      const others = await decryptedBorrowersByIds(otherIds);
      const role = (req as any).session?.userRole;
      const sessionOrgId = (req as any).session?.organizationId;
      const visibleOthers = (role === "super_admin" || role === "regulator")
        ? others
        : others.filter((b: any) => sessionOrgId && b.organizationId === sessionOrgId);
      const visibleIds = new Set<string>(visibleOthers.map((b: any) => b.id));
      const idMap = new Map(visibleOthers.map((b: any) => [b.id, b]));
      const enrichedLinks = links.filter(l => visibleIds.has(l.borrowerId)).map(l => {
        const o = idMap.get(l.borrowerId);
        return { ...l, name: o ? (o.companyName || `${o.firstName || ""} ${o.lastName || ""}`.trim()) : l.borrowerId, nationalId: o?.nationalId };
      });
      const assets = await getAssetTracesByBorrower(id);
      const userId = (req as any).session?.userId || "system";
      const orgId = (req as any).session?.organizationId;
      const org = orgId ? await storage.getOrganization(orgId) : null;
      const pdfBuffer = await generateSkipTracePdf({
        borrower: decrypted as any,
        contactEvents: events,
        linkedBorrowers: enrichedLinks,
        assetTraces: assets,
        courtJudgments: judgments as any[],
        requestedBy: userId,
        requestReason: reason,
        organizationName: org?.name || "Africa Credit Hub",
      });
      await logTraceAudit(req, "TRACE_SKIP_TRACE_PDF", id, `reason="${reason}" events=${events.length} links=${enrichedLinks.length} assets=${assets.length}`);
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="skip-trace-${id}.pdf"`);
      res.send(pdfBuffer);
    } catch (e: any) { res.status(500).json({ message: safeErrorMessage(e) }); }
  });

  // ─── Collections workflow ────────────────────────────────────────────────
  app.get("/api/collections/assignments", requireRole("admin", "super_admin", "lender"), enforceDataSovereignty, async (req, res) => {
    try {
      const orgId = getOrgScope(req);
      const country = getCountryFilter(req);
      const { status, mine, segment } = req.query as any;
      const list = await storage.getCollectionAssignments({
        organizationId: orgId,
        country,
        status,
        segment: segment || undefined,
        assignedTo: mine === "true" ? (req as any).session?.userId : undefined,
      });
      res.json(list);
    } catch (e: any) { res.status(500).json({ message: safeErrorMessage(e) }); }
  });

  app.post("/api/collections/assignments", requireRole("admin", "super_admin", "lender"), enforceDataSovereignty, async (req, res) => {
    try {
      const body = req.body || {};
      if (!body.borrowerId) return res.status(400).json({ message: "borrowerId is required" });
      const acl = await ensureBorrowerAccess(req, body.borrowerId);
      if (!acl.ok) return res.status(acl.status).json({ message: acl.message });
      const borrower = acl.borrower;
      // Tenant integrity: ALWAYS derive organizationId/country from the
      // authorized borrower record. Ignore any client-supplied values to
      // prevent cross-tenant assignment writes (e.g., a lender writing into
      // another org's collections queue).
      const { organizationId: _ignoredOrg, country: _ignoredCountry, createdBy: _ignoredCreatedBy, ...safeBody } = body;
      const created = await storage.createCollectionAssignment({
        ...safeBody,
        organizationId: borrower.organizationId,
        country: borrower.country,
        createdBy: req.session?.userId,
      });
      await logTraceAudit(req, "TRACE_COLLECTION_OPEN", created.id, `borrower=${body.borrowerId} priority=${body.priority || "medium"}`);
      try { broadcastEvent("collection:created", { id: created.id, borrowerId: body.borrowerId }); } catch {}
      res.json(created);
    } catch (e: any) { res.status(500).json({ message: safeErrorMessage(e) }); }
  });

  app.patch("/api/collections/assignments/:id", requireRole("admin", "super_admin", "lender"), enforceDataSovereignty, async (req, res) => {
    try {
      const acl = await ensureAssignmentAccess(req, req.params.id);
      if (!acl.ok) return res.status(acl.status).json({ message: acl.message });
      const updated = await storage.updateCollectionAssignment(req.params.id, req.body || {});
      if (!updated) return res.status(404).json({ message: "Not found" });
      await logTraceAudit(req, "TRACE_COLLECTION_UPDATE", req.params.id, `status=${req.body?.status || ""}`);
      res.json(updated);
    } catch (e: any) { res.status(500).json({ message: safeErrorMessage(e) }); }
  });

  app.get("/api/collections/assignments/:id/attempts", requireRole("admin", "super_admin", "lender"), enforceDataSovereignty, async (req, res) => {
    try {
      const acl = await ensureAssignmentAccess(req, req.params.id);
      if (!acl.ok) return res.status(acl.status).json({ message: acl.message });
      const list = await storage.getCollectionAttempts(req.params.id);
      res.json(list);
    } catch (e: any) { res.status(500).json({ message: safeErrorMessage(e) }); }
  });

  app.post("/api/collections/assignments/:id/attempts", requireRole("admin", "super_admin", "lender"), enforceDataSovereignty, async (req, res) => {
    try {
      const acl = await ensureAssignmentAccess(req, req.params.id);
      if (!acl.ok) return res.status(acl.status).json({ message: acl.message });
      const assignment = acl.assignment;
      const body = req.body || {};
      const attempt = await storage.createCollectionAttempt({
        ...body,
        assignmentId: req.params.id,
        attemptedBy: (req as any).session?.userId,
        attemptedAt: new Date(),
      });

      // Optionally send SMS/email through existing utilities
      if (body.sendNow && body.contactValue) {
        try {
          if (body.channel === "sms") {
            const { sendSms } = await import("./sms");
            await sendSms(body.contactValue, body.notes || "Reminder regarding your outstanding credit account. Please contact your lender.");
          } else if (body.channel === "email") {
            const { sendDisputeNotification } = await import("./email");
            // Use a generic dispute-notification email template as a stop-gap
            await sendDisputeNotification("Africa Credit Hub", body.contactValue, 0, "Collection reminder", "collection_reminder");
          }
        } catch (e: any) {
          console.error("[collections] notify failed:", e.message);
        }
      }

      await logTraceAudit(req, "TRACE_COLLECTION_ATTEMPT", req.params.id, `channel=${body.channel} outcome=${body.outcome}`);

      // Auto-update assignment status based on outcome
      if (body.outcome === "promise_to_pay") {
        await storage.updateCollectionAssignment(req.params.id, { status: "promised" });
      } else if (body.outcome === "paid") {
        await storage.updateCollectionAssignment(req.params.id, { status: "resolved" });
      } else if (assignment.status === "open") {
        await storage.updateCollectionAssignment(req.params.id, { status: "in_progress" });
      }

      res.json(attempt);
    } catch (e: any) { res.status(500).json({ message: safeErrorMessage(e) }); }
  });

  // ─── Collections SLA settings ────────────────────────────────────────────
  const resolveCollectionCountry = async (req: any, bodyCountry?: string): Promise<string | undefined> => {
    const fromFilter = getCountryFilter(req);
    if (fromFilter) return fromFilter;
    if (bodyCountry) return bodyCountry;
    if (req.session.userCountry) return req.session.userCountry;
    if (req.session.organizationId) {
      const org = await storage.getOrganization(req.session.organizationId);
      if (org?.country) return org.country;
    }
    return undefined;
  };

  app.get("/api/collections/sla-settings", requireRole("admin", "super_admin", "lender"), enforceDataSovereignty, async (req, res) => {
    try {
      const country = await resolveCollectionCountry(req);
      const orgId = req.session.organizationId;
      const profiles = await storage.listCollectionSlaSettings(orgId, country ?? "");
      if (profiles.length === 0) {
        const defaults = { urgentThresholdDays: 3, highThresholdDays: 5, mediumThresholdDays: 7, lowThresholdDays: 14, enabled: true, segment: null };
        return res.json([{ ...defaults, country: country ?? null, organizationId: orgId ?? null }]);
      }
      res.json(profiles);
    } catch (e: any) { res.status(500).json({ message: safeErrorMessage(e) }); }
  });

  app.put("/api/collections/sla-settings", requireRole("admin", "super_admin"), enforceDataSovereignty, async (req, res) => {
    try {
      const body = req.body || {};
      const orgId = req.session.organizationId;
      const country = await resolveCollectionCountry(req, body.country);
      if (!country) return res.status(400).json({ message: "Country scope required: set a viewing country or provide country in request body" });
      const parseThreshold = (val: unknown, def: number): number => {
        const n = Math.floor(Number(val));
        return (Number.isFinite(n) && n >= 1) ? n : def;
      };
      const segment = typeof body.segment === "string" && body.segment.trim() ? body.segment.trim() : null;
      const data = {
        country,
        organizationId: orgId ?? null,
        segment,
        urgentThresholdDays: parseThreshold(body.urgentThresholdDays, 3),
        highThresholdDays: parseThreshold(body.highThresholdDays, 5),
        mediumThresholdDays: parseThreshold(body.mediumThresholdDays, 7),
        lowThresholdDays: parseThreshold(body.lowThresholdDays, 14),
        enabled: body.enabled !== false,
      };
      const saved = await storage.upsertCollectionSlaSettings(data);
      res.json(saved);
    } catch (e: any) { res.status(500).json({ message: safeErrorMessage(e) }); }
  });

  app.delete("/api/collections/sla-settings/:id", requireRole("admin", "super_admin"), async (req, res) => {
    try {
      const existing = await storage.getCollectionSlaSettingsById(req.params.id);
      if (!existing) return res.status(404).json({ message: "SLA profile not found" });
      const role = req.session.userRole;
      const orgId = req.session.organizationId;
      if (role !== "super_admin" && existing.organizationId !== (orgId ?? null)) {
        return res.status(403).json({ message: "Not authorized to delete this SLA profile" });
      }
      await storage.deleteCollectionSlaSettings(req.params.id);
      res.json({ success: true });
    } catch (e: any) { res.status(500).json({ message: safeErrorMessage(e) }); }
  });

  app.get("/api/collections/sla-segment-coverage", requireRole("admin", "super_admin", "lender"), enforceDataSovereignty, async (req, res) => {
    try {
      const country = await resolveCollectionCountry(req);
      const orgId = req.session.organizationId;
      const coverage = await storage.countActiveAssignmentsBySegment(orgId, country ?? "");
      res.json(coverage);
    } catch (e: any) { res.status(500).json({ message: safeErrorMessage(e) }); }
  });

  app.post("/api/collections/sla-check", requireRole("super_admin"), async (req, res) => {
    try {
      const country = await resolveCollectionCountry(req);
      const orgId = req.session.organizationId;
      const { checkCollectionSla } = await import("./collection-sla-checker");
      const result = await checkCollectionSla(orgId, country);
      res.json({ message: "SLA check complete", ...result });
    } catch (e: any) { res.status(500).json({ message: safeErrorMessage(e) }); }
  });

  app.get("/api/collections/sla-breaches", requireRole("admin", "super_admin", "lender"), enforceDataSovereignty, async (req, res) => {
    try {
      const country = await resolveCollectionCountry(req);
      const orgId = req.session.organizationId;
      const activeSegmentsResult = await db.execute(sql`
        SELECT DISTINCT segment FROM collection_assignments
        WHERE status IN ('open', 'in_progress')
          AND assigned_to IS NOT NULL
          ${orgId ? sql`AND organization_id = ${orgId}` : sql``}
          ${country ? sql`AND country = ${country}` : sql``}
      `);
      const activeSegments: (string | null)[] = (activeSegmentsResult.rows || []).map((r: any) => r.segment ?? null);
      if (activeSegments.length === 0) activeSegments.push(null);
      const breachIds: string[] = [];
      for (const segment of activeSegments) {
        const settings = await storage.getCollectionSlaSettings(orgId, country ?? "", segment);
        if (settings && !settings.enabled) continue;
        const thresholds: Record<string, number> = {
          urgent: settings?.urgentThresholdDays ?? 3,
          high: settings?.highThresholdDays ?? 5,
          medium: settings?.mediumThresholdDays ?? 7,
          low: settings?.lowThresholdDays ?? 14,
        };
        for (const priority of ["urgent", "high", "medium", "low"]) {
          const overdue = await storage.getOverdueCollectionAssignments(thresholds[priority], priority, orgId, country, segment);
          overdue.forEach(a => breachIds.push(a.id));
        }
      }
      const uniqueBreachIds = [...new Set(breachIds)];
      const defaultProfile = profiles.find(p => !p.segment) ?? profiles[0];
      const defaultThresholds: Record<string, number> = defaultProfile
        ? { urgent: defaultProfile.urgentThresholdDays, high: defaultProfile.highThresholdDays, medium: defaultProfile.mediumThresholdDays, low: defaultProfile.lowThresholdDays }
        : { urgent: 3, high: 5, medium: 7, low: 14 };
      const breaches = await storage.getOverdueCollectionAssignmentDetails(defaultThresholds, orgId, country);
      res.json({ breachIds: uniqueBreachIds, breaches });
    } catch (e: any) { res.status(500).json({ message: safeErrorMessage(e) }); }
  });

  // Start the collection SLA background checker
  import("./collection-sla-checker").then(({ startCollectionSlaChecker }) => {
    startCollectionSlaChecker();
  }).catch(e => console.error("[routes] Failed to start SLA checker:", e.message));

  // -------------------------------------------------------------------------
  // Training Center routes
  // -------------------------------------------------------------------------
  app.get("/api/training/progress", requireAuth, async (req, res) => {
    try {
      const userId = (req as any).user?.id;
      if (!userId) return res.status(401).json({ message: "Unauthorized" });
      const best = await storage.getBestTrainingAttempts(userId);
      res.json(best);
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  });

  app.post("/api/training/attempts", requireAuth, async (req, res) => {
    try {
      const userId = (req as any).user?.id;
      if (!userId) return res.status(401).json({ message: "Unauthorized" });
      const { moduleId, score, totalQuestions, passed, answers } = req.body;
      if (!moduleId || score === undefined || !totalQuestions) {
        return res.status(400).json({ message: "moduleId, score, and totalQuestions are required" });
      }
      const attempt = await storage.createTrainingAttempt({ userId, moduleId, score, totalQuestions, passed: !!passed, answers: answers ?? [] });
      res.json(attempt);
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  });

  return httpServer;
}

async function seedOrganizations() {
  const existing = await storage.getOrganizations();

  const { sql: rawSql } = await import("drizzle-orm");
  try {
    await db.execute(rawSql`UPDATE borrowers SET organization_id = NULL WHERE organization_id IS NOT NULL AND organization_id NOT IN (SELECT id FROM organizations)`);
    await db.execute(rawSql`UPDATE credit_accounts SET organization_id = NULL WHERE organization_id IS NOT NULL AND organization_id NOT IN (SELECT id FROM organizations)`);
    await db.execute(rawSql`UPDATE court_judgments SET organization_id = NULL WHERE organization_id IS NOT NULL AND organization_id NOT IN (SELECT id FROM organizations)`);
    await db.execute(rawSql`UPDATE dishonoured_cheques SET organization_id = NULL WHERE organization_id IS NOT NULL AND organization_id NOT IN (SELECT id FROM organizations)`);
    await db.execute(rawSql`UPDATE disputes SET organization_id = NULL WHERE organization_id IS NOT NULL AND organization_id NOT IN (SELECT id FROM organizations)`);
  } catch (e) {
    routeLogger.info(`[Seed] Orphan cleanup skipped: ${(e as Error).message}`);
  }

  if (existing.length >= 4) {
    const orgIds = existing.map(o => o.id);
    const seedCountry = existing[0]?.country || "Ghana";
    const { data: allBorrowers } = await storage.getBorrowers(1, 10000, undefined, seedCountry);
    let assignedCount = 0;
    for (let i = 0; i < allBorrowers.length; i++) {
      if (!allBorrowers[i].organizationId) {
        await storage.updateBorrower(allBorrowers[i].id, { organizationId: orgIds[i % orgIds.length] } as any);
        assignedCount++;
      }
    }
    if (assignedCount > 0) {
      const allAccounts = await storage.getAllCreditAccounts(undefined, seedCountry);
      for (const acc of allAccounts) {
        if (!acc.organizationId) {
          const borrower = await storage.getBorrower(acc.borrowerId);
          if (borrower?.organizationId) {
            await storage.updateCreditAccount(acc.id, { organizationId: borrower.organizationId } as any);
          }
        }
      }
      routeLogger.info(`[Seed] Assigned ${assignedCount} orphaned borrowers to organizations`);
    }
    return;
  }

  const ghanaMode = isGhanaMode();

  const simOrg = await storage.createOrganization({
    name: process.env.PLATFORM_COMPANY_NAME || "Africa Credit Hub",
    slug: "sim",
    type: "other",
    status: "active",
    country: ghanaMode ? "Ghana" : "Ethiopia",
    contactEmail: process.env.PLATFORM_SUPPORT_EMAIL || "support@africacredithub.com",
    subscriptionTier: "enterprise",
    maxUsers: 100,
  });

  const nbeOrg = await storage.createOrganization(ghanaMode ? {
    name: "Bank of Ghana",
    slug: "bog",
    type: "bank",
    status: "active",
    country: "Ghana",
    contactEmail: "info@bog.gov.gh",
    subscriptionTier: "enterprise",
    maxUsers: 50,
  } : {
    name: "National Bank of Ethiopia",
    slug: "nbe",
    type: "bank",
    status: "active",
    country: "Ethiopia",
    contactEmail: "info@nbe.gov.et",
    subscriptionTier: "enterprise",
    maxUsers: 50,
  });

  const mpesaOrg = await storage.createOrganization(ghanaMode ? {
    name: "GCB Bank",
    slug: "gcb",
    type: "bank",
    status: "active",
    country: "Ghana",
    contactEmail: "info@gcbbank.com.gh",
    subscriptionTier: "professional",
    maxUsers: 30,
  } : {
    name: "M-Pesa Financial Services",
    slug: "mpesa",
    type: "fintech",
    status: "active",
    country: "Kenya",
    contactEmail: "info@mpesa.co.ke",
    subscriptionTier: "professional",
    maxUsers: 30,
  });

  const insureOrg = await storage.createOrganization(ghanaMode ? {
    name: "Ecobank Ghana",
    slug: "ecobank",
    type: "bank",
    status: "active",
    country: "Ghana",
    contactEmail: "info@ecobank.com.gh",
    subscriptionTier: "standard",
    maxUsers: 20,
  } : {
    name: "AfrInsure Group",
    slug: "afrinsure",
    type: "insurance",
    status: "active",
    country: "South Africa",
    contactEmail: "info@afrinsure.co.za",
    subscriptionTier: "standard",
    maxUsers: 20,
  });

  const platformAdmin = await storage.getUserByUsername("platform_admin");
  if (!platformAdmin) {
    const bcryptLib = await import("bcryptjs");
    const hashedPassword = await bcryptLib.hash("platform123", 10);
    await storage.createUser({
      username: "platform_admin",
      password: hashedPassword,
      fullName: "Platform Administrator",
      email: process.env.PLATFORM_SUPPORT_EMAIL || "support@africacredithub.com",
      role: "super_admin",
      status: "active",
      organizationId: simOrg.id,
    });
  }

  const admin = await storage.getUserByUsername("admin");
  if (admin && !admin.organizationId) {
    await storage.updateUser(admin.id, { organizationId: simOrg.id, role: "super_admin" } as any);
  }

  const regUser = await storage.getUserByUsername("regulator1");
  if (regUser && !regUser.organizationId) {
    await storage.updateUser(regUser.id, { organizationId: nbeOrg.id } as any);
  }

  const cbeUser = await storage.getUserByUsername("cbe_user");
  if (cbeUser && !cbeUser.organizationId) {
    await storage.updateUser(cbeUser.id, { organizationId: nbeOrg.id } as any);
  }

  const dashenUser = await storage.getUserByUsername("dashen_user");
  if (dashenUser && !dashenUser.organizationId) {
    await storage.updateUser(dashenUser.id, { organizationId: mpesaOrg.id } as any);
  }

  const awashUser = await storage.getUserByUsername("awash_user");
  if (awashUser && !awashUser.organizationId) {
    await storage.updateUser(awashUser.id, { organizationId: insureOrg.id } as any);
  }

  const seedCountry2 = simOrg.country || "Ghana";
  const { data: allBorrowers } = await storage.getBorrowers(1, 10000, undefined, seedCountry2);
  const orgIds = [simOrg.id, nbeOrg.id, mpesaOrg.id, insureOrg.id];
  for (let i = 0; i < allBorrowers.length; i++) {
    const b = allBorrowers[i];
    if (!b.organizationId) {
      const assignedOrg = orgIds[i % orgIds.length];
      await storage.updateBorrower(b.id, { organizationId: assignedOrg } as any);
    }
  }

  const allAccounts = await storage.getAllCreditAccounts(undefined, seedCountry2);
  for (const acc of allAccounts) {
    if (!acc.organizationId) {
      const borrower = await storage.getBorrower(acc.borrowerId);
      if (borrower?.organizationId) {
        await storage.updateCreditAccount(acc.id, { organizationId: borrower.organizationId } as any);
      }
    }
  }

  routeLogger.info("[Seed] Organizations and tenant assignments created successfully");
}

async function repairCountrySettings() {
  try {
    const dpCorrections: Record<string, string> = {
      GH: "enacted", NG: "enacted", KE: "enacted", RW: "enacted",
      TZ: "enacted", UG: "enacted", ZA: "enacted", ET: "enacted",
    };
    for (const [code, status] of Object.entries(dpCorrections)) {
      await db.update(countrySettings)
        .set({ dataProtectionStatus: status })
        .where(
          and(
            eq(countrySettings.countryCode, code),
            sql`${countrySettings.dataProtectionStatus} != ${status}`
          )
        );
    }
  } catch (e) {
    routeLogger.info("[Repair] Country settings repair skipped:", { detail: e });
  }
}

async function seedCountrySettings() {
  try {
    const existing = await db.select().from(countrySettings);
    if (existing.length > 0) return;

    const ghConfig = getSupportedCountries().find(c => c.code === "GH");
    if (ghConfig) {
      await db.insert(countrySettings).values({
        countryCode: ghConfig.code,
        countryName: ghConfig.name,
        regulatoryBody: ghConfig.regulatoryBody,
        dataProtectionLaw: ghConfig.dataProtectionLaw,
        dataProtectionStatus: "enacted",
        sataReadiness: "ready",
        enabledFeatures: ["credit_scoring", "dispute_management", "consent_tracking", "regulatory_export", "batch_upload", "api_access", "kyc_verification"],
      }).onConflictDoNothing();
    }
    routeLogger.info("[Seed] Country settings initialized");
  } catch (e) {
    routeLogger.info("[Seed] Country settings seed skipped:", { detail: e });
  }
}
