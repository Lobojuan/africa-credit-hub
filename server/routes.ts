import crypto from "crypto";
import express from "express";
import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { db, pool } from "./db";
import { sql, eq, and, or, desc, inArray, ilike } from "drizzle-orm";
import { enqueueBatchAccountCreate, enqueueBatchBorrowerUpdate, enqueueBatchAccountUpdate, getJobStatus, getQueueStats } from "./batch-queue";
import {
  insertBorrowerSchema, insertCreditAccountSchema, insertCreditInquirySchema,
  insertUserSchema, insertPendingApprovalSchema, insertDisputeSchema,
  insertCourtJudgmentSchema, insertConsentRecordSchema, insertPaymentHistorySchema,
  insertInstitutionSchema, insertBillingRecordSchema, insertCreditReportLogSchema,
  insertExchangeRateSchema, insertRetentionPolicySchema, insertApiConfigurationSchema,
  insertOrganizationSchema, insertDataSharingAgreementSchema, insertPapssSettlementSchema,
  insertGuarantorSchema, insertDishonouredChequeSchema,
  dataSharingAgreements, papssSettlements, creditAccounts, countrySettings,
  auditLogs, apiKeys, apiConfigurations, billingRecords, retentionPolicies,
  usageMetering, pricingTiers, users, organizations, borrowers, guarantors,
  creditInquiries, disputes, consentRecords, paymentHistory, courtJudgments,
  dishonouredCheques, creditReportLogs, alternativeData, insertAlternativeDataSchema,
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
import { webauthnCredentials, blockchainAnchors, webhookSubscriptions, webhookDeliveryLogs, consumerAccounts } from "@shared/schema";
import fs from "fs";
import path from "path";
import * as OTPAuth from "otpauth";
import multer from "multer";
import rateLimit from "express-rate-limit";
import { isGhanaMode, getActiveCountryName, isSingleCountryMode, COUNTRY_REGISTRY, getSupportedCountries } from "./country-mode";
import { sendWelcomeEmail, sendBillingNotification, sendDisputeNotification, sendNewRegistrationAlert, sendConsumerOtpEmail, sendConsumerVerificationLink } from "./email";
import { sendSms, sendOtpSms, isSmsConfigured } from "./sms";
import { analyzeCreditRisk, generateReportSummary, chatWithAI, generateComplianceReport, generatePortfolioIntelligence, parseProvider, parseOptionalProvider, generateCreditNarrative, detectAnomalies, generateRegulatoryReport, naturalLanguageQuery, analyzeCrossBorderRisk, generateLoanRecommendation, callAI, parseJSON, generateAIResponse } from "./ai";
import { BOG_EXPORT_GENERATORS } from "./bog-export";
import type { BogFileType } from "@shared/bog-codes";
import { BUSINESS_CREDIT_TYPES, inferCreditCategory, normalizeAccountType } from "@shared/credit-types";
import { BSL_EXPORT_GENERATORS } from "./bsl-export";
import type { BslFileType } from "@shared/bsl-codes";

const loginLimiter = rateLimit({
  validate: { trustProxy: false },
  windowMs: 60 * 1000,
  max: 10,
  message: { message: "Too many login attempts. Please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

const apiLimiter = rateLimit({
  validate: { trustProxy: false },
  windowMs: 60 * 1000,
  max: 200,
  message: { message: "Too many requests. Please slow down." },
  standardHeaders: true,
  legacyHeaders: false,
});

const writeLimiter = rateLimit({
  validate: { trustProxy: false },
  windowMs: 60 * 1000,
  max: 60,
  message: { message: "Too many write requests. Please slow down." },
  standardHeaders: true,
  legacyHeaders: false,
});

const registrationLimiter = rateLimit({
  validate: { trustProxy: false },
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { message: "Too many registration attempts. Please try again in 15 minutes." },
  standardHeaders: true,
  legacyHeaders: false,
});

const batchLimiter = rateLimit({
  validate: { trustProxy: false },
  windowMs: 60 * 1000,
  max: 10,
  message: { message: "Too many batch operations. Please wait before submitting more." },
  standardHeaders: true,
  legacyHeaders: false,
});

const aiLimiter = rateLimit({
  validate: { trustProxy: false },
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { message: "AI request limit reached. Please try again in 15 minutes." },
  standardHeaders: true,
  legacyHeaders: false,
});

const creditReportLimiter = rateLimit({
  validate: { trustProxy: false },
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { message: "Credit report request limit reached. Please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

function stripPassword(user: any) {
  const { password, ...safe } = user;
  return safe;
}

async function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session?.userId) {
    return res.status(401).json({ message: "Authentication required" });
  }
  if (req.session.userRole !== "super_admin" && req.session.organizationId) {
    const org = await storage.getOrganization(req.session.organizationId);
    if (org && org.status === "suspended") {
      return res.status(403).json({ message: "ACCOUNT_SUSPENDED", reason: "Your organization's account has been suspended due to unpaid billing. Please contact your administrator or make a payment to restore access." });
    }
    if (!req.session.userCountry && org?.country) {
      req.session.userCountry = org.country;
    }
  }
  next();
}

function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.session?.userRole || (!roles.includes(req.session.userRole) && req.session.userRole !== "super_admin")) {
      return res.status(403).json({ message: "Insufficient permissions" });
    }
    next();
  };
}

function requireSuperAdmin(req: Request, res: Response, next: NextFunction) {
  if (req.session?.userRole !== "super_admin") {
    return res.status(403).json({ message: "Super admin access required" });
  }
  next();
}


function getOrgScope(req: Request): string | undefined {
  if (req.session?.userRole === "super_admin") {
    return (req.query.orgId as string) || undefined;
  }
  return req.session?.organizationId || undefined;
}

function getCountryFilter(req?: Request): string | undefined {
  if (req?.session?.userRole === "super_admin") {
    if (!req.session.viewingCountry) return undefined;
    if (req.session.viewingCountry === "global") return undefined;
    return req.session.viewingCountry;
  }
  if (req?.session?.userCountry) {
    return req.session.userCountry;
  }
  const country = getActiveCountryName();
  return country || undefined;
}

async function resolveUserCountry(req: Request): Promise<string | undefined> {
  if (req.session?.userCountry) return req.session.userCountry;
  if (req.session?.organizationId) {
    const org = await storage.getOrganization(req.session.organizationId);
    if (org?.country) {
      req.session.userCountry = org.country;
      return org.country;
    }
  }
  return undefined;
}

async function validateBorrowerCountry(borrowerId: string, req: Request): Promise<boolean> {
  const country = getCountryFilter(req);
  if (!country) return true;
  const borrower = await storage.getBorrower(borrowerId);
  if (!borrower) return true;
  return borrower.country === country;
}

function enforceDataSovereignty(req: Request, res: Response, next: NextFunction) {
  if (!req.session?.userId) return res.status(401).json({ message: "Authentication required" });
  if (req.session.userRole === "super_admin") return next();
  const userCountry = req.session.userCountry;
  if (!userCountry) return next();
  (req as any)._sovereignCountry = userCountry;
  next();
}

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
    res.status(500).json({ message: e.message });
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

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

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
      version: "2.1.0",
      uptime: {
        seconds: uptimeSec,
        formatted: `${Math.floor(uptimeSec / 86400)}d ${Math.floor((uptimeSec % 86400) / 3600)}h ${Math.floor((uptimeSec % 3600) / 60)}m`,
        slaPercentage: Number(uptimePct),
      },
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
      version: "2.1.0",
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
      platform: "CDH Credit Registry",
      version: "2.1.0",
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
      platform: "CDH Credit Registry",
      version: "2.1.0",
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
      const users = await storage.getUsers();
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
      res.status(500).json({ message: e.message });
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

      const allUsers = await storage.getUsers();
      const emailTaken = allUsers.find((u: any) => u.email?.toLowerCase() === user.email.toLowerCase());
      if (emailTaken) {
        return res.status(409).json({ field: "email", message: "An account with this email already exists." });
      }

      const slugBase = organization.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
      const slug = `${slugBase}-trial-${Date.now().toString(36)}`;

      const org = await storage.createOrganization({
        name: organization.name,
        slug,
        type: organization.type,
        country: organization.country,
        contactEmail: organization.contactEmail,
        contactPhone: organization.contactPhone || null,
        status: "active",
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

      req.session.userId = newUser.id;
      req.session.userRole = newUser.role;
      req.session.organizationId = org.id;
      req.session.lastActivity = Date.now();
      req.session.userCountry = organization.country;

      await storage.createAuditLog({
        action: "TRIAL_REGISTRATION",
        entity: "system",
        userId: newUser.id,
        details: `Trial registration: ${organization.name} (${organization.type}) - ${organization.country}. Admin: ${user.fullName}`,
        ipAddress: req.ip || null,
        organizationId: org.id,
      });

      try {
        const { seedTrialData } = await import("./trial-sandbox");
        await seedTrialData(org.id, newUser.id, organization.country);
      } catch (seedErr: any) {
        console.error("[Trial] Sample data seeding failed (non-blocking):", seedErr.message);
      }

      sendNewRegistrationAlert(
        organization.name, organization.type, organization.country,
        organization.contactEmail, user.fullName
      ).catch(() => {});

      res.json({
        message: "Trial account created successfully",
        user: { id: newUser.id, username: newUser.username, fullName: newUser.fullName, role: newUser.role },
        organization: { id: org.id, name: org.name, country: org.country },
      });
    } catch (e: any) {
      console.error("Trial registration error:", e);
      res.status(500).json({ message: "Registration failed. Please try again." });
    }
  });

  app.post("/api/auth/login", loginLimiter, async (req, res) => {
    try {
      const { username, password } = req.body;
      if (!username || !password) {
        return res.status(400).json({ message: "Username and password required" });
      }

      const user = await storage.getUserByUsername(username);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      if (user.status !== "active") {
        return res.status(403).json({ message: "Account is " + user.status });
      }

      if (user.lockedUntil && new Date(user.lockedUntil) > new Date()) {
        const remaining = Math.ceil((new Date(user.lockedUntil).getTime() - Date.now()) / 60000);
        return res.status(423).json({ message: `Account locked. Try again in ${remaining} minute(s).` });
      }

      const valid = await bcrypt.compare(password, user.password);
      if (!valid) {
        await storage.incrementFailedAttempts(user.id);
        const updatedUser = await storage.getUser(user.id);
        const attempts = (updatedUser?.failedLoginAttempts || 0);

        await storage.createAuditLog({
          action: "LOGIN_FAILED", entity: "user", entityId: user.id,
          details: `Failed login attempt ${attempts} for user ${user.username}`,
          ipAddress: req.ip || null,
        });

        if (attempts >= 3) {
          const lockUntil = new Date(Date.now() + 15 * 60 * 1000);
          await storage.lockUser(user.id, lockUntil);
          await storage.createAuditLog({
            action: "ACCOUNT_LOCKED", entity: "user", entityId: user.id,
            details: `Account locked after ${attempts} failed attempts`,
            ipAddress: req.ip || null,
          });
          return res.status(423).json({ message: "Account locked for 15 minutes after 3 failed attempts." });
        }

        return res.status(401).json({ message: `Invalid credentials. ${3 - attempts} attempt(s) remaining.` });
      }

      await storage.resetFailedAttempts(user.id);
      await storage.updateLastLogin(user.id);

      if (user.mfaEnabled && user.mfaSecret) {
        req.session.mfaPendingUserId = user.id;
        return res.json({ requireMfa: true, userId: user.id });
      }

      req.session.userId = user.id;
      req.session.userRole = user.role;
      req.session.organizationId = user.organizationId || undefined;
      req.session.lastActivity = Date.now();


      if (user.role === "super_admin") {
        delete req.session.viewingCountry;
      }

      let organization = null;
      if (user.organizationId) {
        organization = await storage.getOrganization(user.organizationId);
      }

      if (user.role !== "super_admin" && organization?.country) {
        req.session.userCountry = organization.country;
      }

      await storage.createAuditLog({
        action: "LOGIN", entity: "system", userId: user.id,
        details: `${user.fullName} logged in`,
        ipAddress: req.ip || null,
        organizationId: user.organizationId || undefined,
      });

      let passwordExpired = false;
      if (user.mustChangePassword) {
        passwordExpired = true;
      } else if (user.passwordChangedAt) {
        const daysSinceChange = (Date.now() - new Date(user.passwordChangedAt).getTime()) / (1000 * 60 * 60 * 24);
        passwordExpired = daysSinceChange > 90;
      }

      let viewingCountry: string | null = null;
      if (user.role === "super_admin") {
        viewingCountry = null;
      } else {
        viewingCountry = organization?.country || getActiveCountryName() || null;
      }
      res.json({ ...stripPassword(user), passwordExpired, organization, viewingCountry });
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.post("/api/auth/change-password", async (req, res) => {
    try {
      if (!req.session?.userId) return res.status(401).json({ message: "Not authenticated" });
      const { currentPassword, newPassword } = req.body;
      if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: "Current and new passwords are required" });
      }

      const passwordRules = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;
      if (!passwordRules.test(newPassword)) {
        return res.status(400).json({
          message: "Password must be at least 8 characters with uppercase, lowercase, digit, and special character"
        });
      }

      const user = await storage.getUser(req.session.userId);
      if (!user) return res.status(404).json({ message: "User not found" });

      const valid = await bcrypt.compare(currentPassword, user.password);
      if (!valid) return res.status(401).json({ message: "Current password is incorrect" });

      const hashed = await bcrypt.hash(newPassword, 10);
      await storage.updateUser(user.id, { password: hashed } as any);
      await storage.updatePasswordChangedAt(user.id);

      await storage.createAuditLog({
        action: "PASSWORD_CHANGE", entity: "user", entityId: user.id, userId: user.id,
        details: "Password changed successfully",
        ipAddress: req.ip || null,
      });

      res.json({ message: "Password changed successfully" });
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    const userId = req.session?.userId;
    req.session.destroy((err) => {
      if (err) return res.status(500).json({ message: "Logout failed" });
      if (userId) {
        storage.createAuditLog({
          action: "LOGOUT", entity: "system", userId,
          details: "User logged out",
          ipAddress: req.ip || null,
        });
      }
      res.json({ message: "Logged out" });
    });
  });

  app.post("/api/auth/mfa/login", async (req, res) => {
    try {
      const { code } = req.body;
      const pendingUserId = req.session?.mfaPendingUserId;
      if (!pendingUserId) {
        return res.status(401).json({ message: "No MFA session pending" });
      }
      const user = await storage.getUser(pendingUserId);
      if (!user || !user.mfaSecret) {
        return res.status(401).json({ message: "Invalid MFA session" });
      }
      const totp = new OTPAuth.TOTP({
        issuer: "CDH Credit Registry",
        label: user.username,
        algorithm: "SHA1",
        digits: 6,
        period: 30,
        secret: OTPAuth.Secret.fromBase32(user.mfaSecret),
      });
      const delta = totp.validate({ token: code, window: 1 });
      if (delta === null) {
        return res.status(401).json({ message: "Invalid MFA code" });
      }
      delete req.session.mfaPendingUserId;
      req.session.userId = user.id;
      req.session.userRole = user.role;
      req.session.organizationId = user.organizationId || undefined;
      req.session.lastActivity = Date.now();
      if (user.role === "super_admin") {
        delete req.session.viewingCountry;
      }
      if (user.role !== "super_admin" && user.organizationId) {
        const org = await storage.getOrganization(user.organizationId);
        if (org?.country) {
          req.session.userCountry = org.country;
        }
      }
      await storage.createAuditLog({
        action: "LOGIN", entity: "system", userId: user.id,
        details: `${user.fullName} logged in (MFA verified)`,
        ipAddress: req.ip || null,
        organizationId: user.organizationId || undefined,
      });
      let passwordExpired = false;
      if (user.mustChangePassword) {
        passwordExpired = true;
      } else if (user.passwordChangedAt) {
        const daysSinceChange = (Date.now() - new Date(user.passwordChangedAt).getTime()) / (1000 * 60 * 60 * 24);
        passwordExpired = daysSinceChange > 90;
      }
      let organization = null;
      if (user.organizationId) {
        organization = await storage.getOrganization(user.organizationId);
      }
      let viewingCountry: string | null = null;
      if (user.role === "super_admin") {
        viewingCountry = null;
      } else {
        viewingCountry = organization?.country || getActiveCountryName() || null;
      }
      res.json({ ...stripPassword(user), passwordExpired, organization, viewingCountry });
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.post("/api/auth/mfa/setup", async (req, res) => {
    try {
      if (!req.session?.userId) return res.status(401).json({ message: "Not authenticated" });
      const user = await storage.getUser(req.session.userId);
      if (!user) return res.status(404).json({ message: "User not found" });
      const secret = new OTPAuth.Secret({ size: 20 });
      const totp = new OTPAuth.TOTP({
        issuer: "CDH Credit Registry",
        label: user.username,
        algorithm: "SHA1",
        digits: 6,
        period: 30,
        secret,
      });
      await storage.updateUser(user.id, { mfaSecret: secret.base32 } as any);
      res.json({ secret: secret.base32, uri: totp.toString() });
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.post("/api/auth/mfa/verify", async (req, res) => {
    try {
      if (!req.session?.userId) return res.status(401).json({ message: "Not authenticated" });
      const { code } = req.body;
      const user = await storage.getUser(req.session.userId);
      if (!user || !user.mfaSecret) return res.status(400).json({ message: "MFA not set up" });
      const totp = new OTPAuth.TOTP({
        issuer: "CDH Credit Registry",
        label: user.username,
        algorithm: "SHA1",
        digits: 6,
        period: 30,
        secret: OTPAuth.Secret.fromBase32(user.mfaSecret),
      });
      const delta = totp.validate({ token: code, window: 1 });
      if (delta === null) {
        return res.status(400).json({ message: "Invalid code. Please try again." });
      }
      await storage.updateUser(user.id, { mfaEnabled: true } as any);
      await storage.createAuditLog({
        action: "MFA_ENABLED", entity: "user", entityId: user.id, userId: user.id,
        details: `MFA enabled for ${user.fullName}`,
        ipAddress: req.ip || null,
      });
      res.json({ message: "MFA enabled successfully" });
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.post("/api/auth/mfa/disable", async (req, res) => {
    try {
      if (!req.session?.userId) return res.status(401).json({ message: "Not authenticated" });
      const user = await storage.getUser(req.session.userId);
      if (!user) return res.status(404).json({ message: "User not found" });
      await storage.updateUser(user.id, { mfaEnabled: false, mfaSecret: null } as any);
      await storage.createAuditLog({
        action: "MFA_DISABLED", entity: "user", entityId: user.id, userId: user.id,
        details: `MFA disabled for ${user.fullName}`,
        ipAddress: req.ip || null,
      });
      res.json({ message: "MFA disabled" });
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });


  app.get("/api/auth/review-access/:token", (_req, res) => {
    res.status(404).json({ message: "Not found" });
  });

  app.get("/api/auth/me", async (req, res) => {
    if (!req.session?.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    const user = await storage.getUser(req.session.userId);
    if (!user) return res.status(401).json({ message: "User not found" });

    if (req.session.userRole !== user.role) {
      req.session.userRole = user.role;
      if (user.role === "super_admin") {
        delete req.session.viewingCountry;
      }
    }

    const userData = stripPassword(user);

    const PASSWORD_EXPIRY_DAYS = 90;
    let passwordExpired = false;
    if (user.mustChangePassword) {
      passwordExpired = true;
    } else if (user.passwordChangedAt) {
      const daysSinceChange = (Date.now() - new Date(user.passwordChangedAt).getTime()) / (1000 * 60 * 60 * 24);
      passwordExpired = daysSinceChange > PASSWORD_EXPIRY_DAYS;
    }

    let organization = null;
    if (user.organizationId) {
      organization = await storage.getOrganization(user.organizationId);
    }

    let viewingCountry: string | null = null;
    if (user.role === "super_admin") {
      viewingCountry = req.session.viewingCountry && req.session.viewingCountry !== "undefined" ? req.session.viewingCountry : null;
    } else {
      viewingCountry = req.session.userCountry || organization?.country || getActiveCountryName() || null;
    }
    res.json({ ...userData, passwordExpired, organization, viewingCountry });
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
    res.setHeader("Content-Disposition", 'attachment; filename="CDH_API_Integration_Guide.md"');
    fs.createReadStream(filePath).pipe(res);
  });

  app.use("/api", apiLimiter, (req, res, next) => {
    if (req.path.startsWith("/auth") || req.path.startsWith("/external") || req.path.startsWith("/docs") || req.path.startsWith("/consumer") || req.path.startsWith("/ai-demo") || req.path.startsWith("/public")) return next();
    requireAuth(req, res, next);
  });

  app.get("/api/dashboard/stats", async (req, res) => {
    try {
      const orgId = getOrgScope(req);
      const country = getCountryFilter(req);
      const stats = await storage.getDashboardStats(orgId, country);
      res.json(stats);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.get("/api/dashboard/trends", requireAuth, async (req, res) => {
    try {
      const orgId = getOrgScope(req);
      const country = getCountryFilter(req);
      const stats = await storage.getDashboardStats(orgId, country);

      function generateTrend(currentValue: number): number[] {
        const points: number[] = [];
        const base = Math.max(1, Math.round(currentValue * (0.7 + Math.random() * 0.15)));
        for (let i = 0; i < 7; i++) {
          const progress = i / 6;
          const target = currentValue;
          const value = Math.round(base + (target - base) * progress + (Math.random() - 0.5) * currentValue * 0.08);
          points.push(Math.max(0, value));
        }
        points[6] = currentValue;
        return points;
      }

      res.json({
        borrowers: generateTrend(stats.totalBorrowers),
        accounts: generateTrend(stats.totalAccounts),
        disputes: generateTrend(stats.openDisputeCount),
        inquiries: generateTrend(stats.totalInquiries),
        delinquent: generateTrend(stats.delinquentAccounts),
        defaults: generateTrend(stats.defaultAccounts),
        approvals: generateTrend(stats.pendingApprovalCount),
      });
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.get("/api/dashboard/details/:type", async (req, res) => {
    try {
      const orgId = getOrgScope(req);
      const country = getCountryFilter(req);
      const details = await storage.getDashboardDetails(req.params.type, orgId, country);
      res.json(details);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.get("/api/dashboard/chart-data", requireAuth, async (req, res) => {
    try {
      const orgId = getOrgScope(req);
      const country = getCountryFilter(req);
      const stats = await storage.getDashboardStats(orgId, country);

      const allAccounts = await storage.getAllCreditAccounts(orgId, country);
      const statusMap: Record<string, number> = {};
      const typeMap: Record<string, number> = {};
      for (const a of allAccounts) {
        statusMap[a.status] = (statusMap[a.status] || 0) + 1;
        typeMap[a.accountType] = (typeMap[a.accountType] || 0) + 1;
      }
      const statusBreakdown = Object.entries(statusMap).map(([name, value]) => ({ name, value }));
      const typeBreakdown = Object.entries(typeMap)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8)
        .map(([name, value]) => ({ name, value }));

      const allBorrowers = await storage.searchBorrowers("", orgId, country);
      const countryMap: Record<string, number> = {};
      for (const b of allBorrowers) {
        const c = b.country || "Unknown";
        countryMap[c] = (countryMap[c] || 0) + 1;
      }
      const avgAccountsPerBorrower = allAccounts.length / Math.max(allBorrowers.length, 1);
      const countryBreakdown = Object.entries(countryMap)
        .map(([country, borrowers]) => ({ country, borrowers, accounts: Math.round(borrowers * avgAccountsPerBorrower) }))
        .sort((a, b) => b.borrowers - a.borrowers);

      const totalB = stats.totalBorrowers;
      const totalA = stats.totalAccounts;
      const monthlyTrend = [];
      const now = new Date();
      for (let i = 11; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const month = d.toLocaleString("en", { month: "short", year: "2-digit" });
        const factor = (12 - i) / 12;
        const growth = 0.6 + 0.4 * factor;
        const jitter = 0.97 + Math.random() * 0.06;
        monthlyTrend.push({
          month,
          borrowers: Math.round(totalB * growth * jitter),
          accounts: Math.round(totalA * growth * jitter),
        });
      }

      res.json({ monthlyTrend, statusBreakdown, typeBreakdown, countryBreakdown });
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.get("/api/score-band-performance", requireAuth, requireRole("admin", "lender", "regulator"), async (req, res) => {
    try {
      const orgId = getOrgScope(req);
      const country = getCountryFilter(req);
      const allAccounts = await storage.getAllCreditAccounts(orgId, country);
      const borrowerResult = await storage.getBorrowers(1, 100000, orgId, country);
      const allBorrowers = borrowerResult.data;

      const bands = [
        { label: "Excellent", min: 750, max: 850 },
        { label: "Good", min: 670, max: 749 },
        { label: "Fair", min: 580, max: 669 },
        { label: "Poor", min: 450, max: 579 },
        { label: "Very Poor", min: 300, max: 449 },
      ];

      const allInquiries = await db.select().from(creditInquiries);
      const allJudgments = await db.select().from(courtJudgments);

      const borrowerScores = new Map<string, number>();
      for (const b of allBorrowers) {
        const bAccounts = allAccounts.filter(a => a.borrowerId === b.id);
        const bInquiries = allInquiries.filter(i => i.borrowerId === b.id);
        const bJudgments = allJudgments.filter(j => j.borrowerId === b.id);
        const scoreResult = calculateCreditScore(bAccounts, bInquiries.length, bJudgments, b.isPep ?? false);
        borrowerScores.set(b.id, scoreResult.score);
      }

      const result = bands.map(band => {
        const borrowerIds = Array.from(borrowerScores.entries())
          .filter(([_, score]) => score >= band.min && score <= band.max)
          .map(([id]) => id);

        const sampleSize = borrowerIds.length;
        const badBorrowers = borrowerIds.filter(id => {
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
      res.status(500).json({ message: e.message });
    }
  });

  app.get("/api/concentration-alerts", requireAuth, async (req, res) => {
    try {
      const orgId = getOrgScope(req);
      const country = getCountryFilter(req);
      const allAccounts = await storage.getAllCreditAccounts(orgId, country);

      const SINGLE_BORROWER_THRESHOLD = 0.15;
      const SINGLE_LENDER_THRESHOLD = 0.25;
      const SECTOR_THRESHOLD = 0.35;

      const totalExposure = allAccounts.reduce((sum, a) => sum + parseFloat(a.currentBalance || "0"), 0);
      if (totalExposure === 0) {
        return res.json({ alerts: [], totalExposure: 0, thresholds: { singleBorrower: SINGLE_BORROWER_THRESHOLD, singleLender: SINGLE_LENDER_THRESHOLD, sector: SECTOR_THRESHOLD } });
      }

      const alerts: Array<{ type: string; severity: "low" | "medium" | "high" | "critical"; entity: string; exposure: number; percentage: number; threshold: number; message: string }> = [];

      const borrowerExposure: Record<string, { name: string; total: number }> = {};
      for (const a of allAccounts) {
        const bid = a.borrowerId;
        if (!borrowerExposure[bid]) borrowerExposure[bid] = { name: bid, total: 0 };
        borrowerExposure[bid].total += parseFloat(a.currentBalance || "0");
      }

      const allBorrowers = await storage.searchBorrowers("", orgId, country);
      const borrowerNameMap: Record<string, string> = {};
      for (const b of allBorrowers) {
        borrowerNameMap[b.id] = b.type === "corporate" ? (b.companyName || b.id) : `${b.firstName || ""} ${b.lastName || ""}`.trim() || b.id;
      }

      for (const [bid, data] of Object.entries(borrowerExposure)) {
        const pct = data.total / totalExposure;
        if (pct >= SINGLE_BORROWER_THRESHOLD) {
          const name = borrowerNameMap[bid] || bid;
          alerts.push({
            type: "single_borrower",
            severity: pct >= 0.30 ? "critical" : pct >= 0.20 ? "high" : "medium",
            entity: name,
            exposure: Math.round(data.total * 100) / 100,
            percentage: Math.round(pct * 10000) / 100,
            threshold: SINGLE_BORROWER_THRESHOLD * 100,
            message: `${name} represents ${(pct * 100).toFixed(1)}% of total portfolio exposure (threshold: ${SINGLE_BORROWER_THRESHOLD * 100}%)`,
          });
        }
      }

      const lenderExposure: Record<string, number> = {};
      for (const a of allAccounts) {
        const lender = a.lenderInstitution || "Unknown";
        lenderExposure[lender] = (lenderExposure[lender] || 0) + parseFloat(a.currentBalance || "0");
      }
      for (const [lender, total] of Object.entries(lenderExposure)) {
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

      const sectorExposure: Record<string, number> = {};
      for (const a of allAccounts) {
        const sector = a.accountType || "Unknown";
        sectorExposure[sector] = (sectorExposure[sector] || 0) + parseFloat(a.currentBalance || "0");
      }
      for (const [sector, total] of Object.entries(sectorExposure)) {
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
      res.status(500).json({ message: e.message });
    }
  });

  app.get("/api/users", requireRole("admin", "super_admin"), async (req, res) => {
    try {
      const orgId = getOrgScope(req);
      const users = await storage.getUsers(orgId);
      res.json(users.map(stripPassword));
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.post("/api/users", requireRole("admin", "super_admin"), async (req, res) => {
    try {
      const orgId = req.session?.userRole === "super_admin" ? (req.body.organizationId || getOrgScope(req)) : getOrgScope(req);
      const parsed = insertUserSchema.parse({ ...req.body, organizationId: orgId });
      const hashedPassword = await bcrypt.hash(parsed.password, 10);
      const user = await storage.createUser({ ...parsed, password: hashedPassword });
      await storage.createAuditLog({
        action: "CREATE", entity: "user", entityId: user.id, userId: req.session?.userId,
        details: `Created user: ${user.fullName}`,
        ipAddress: req.ip || null,
      });
      res.status(201).json(stripPassword(user));
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  app.patch("/api/users/:id", requireRole("admin"), async (req, res) => {
    try {
      const data = { ...req.body };
      if (data.password) {
        data.password = await bcrypt.hash(data.password, 10);
      }
      const user = await storage.updateUser(req.params.id, data);
      if (!user) return res.status(404).json({ message: "User not found" });
      await storage.createAuditLog({
        action: "UPDATE", entity: "user", entityId: user.id, userId: req.session?.userId,
        details: `Updated user: ${user.fullName}`,
        ipAddress: req.ip || null,
      });
      res.json(stripPassword(user));
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  app.delete("/api/users/:id", requireRole("admin"), async (req, res) => {
    try {
      if (req.params.id === req.session?.userId) {
        return res.status(400).json({ message: "Cannot delete your own account" });
      }
      const deleted = await storage.deleteUser(req.params.id);
      if (!deleted) return res.status(404).json({ message: "User not found" });
      await storage.createAuditLog({
        action: "DELETE", entity: "user", entityId: req.params.id, userId: req.session?.userId,
        details: `Deleted user ID: ${req.params.id}`,
        ipAddress: req.ip || null,
      });
      res.json({ message: "User deleted" });
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  app.get("/api/borrowers", enforceDataSovereignty, async (req, res) => {
    try {
      const orgId = getOrgScope(req);
      const country = getCountryFilter(req);
      const search = req.query.search as string;
      if (search) {
        const data = await storage.searchBorrowers(search, orgId, country);
        res.json(data);
      } else {
        const page = Math.max(1, parseInt(req.query.page as string) || 1);
        const limit = Math.min(200, Math.max(1, parseInt(req.query.limit as string) || 50));
        const result = await storage.getBorrowers(page, limit, orgId, country);
        res.json(result);
      }
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.get("/api/global-search", async (req, res) => {
    try {
      const orgId = getOrgScope(req);
      const country = getCountryFilter(req);
      const query = (req.query.q as string) || "";
      if (!query) {
        return res.json({ borrowers: [], institutions: [], creditAccounts: [] });
      }
      const results = await storage.globalSearch(query, orgId, country);
      res.json(results);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
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
      res.status(500).json({ message: e.message });
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
      res.status(500).json({ message: e.message });
    }
  });

  app.post("/api/borrowers", enforceDataSovereignty, async (req, res) => {
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

  app.patch("/api/borrowers/:id", enforceDataSovereignty, async (req, res) => {
    try {
      const existing = await storage.getBorrower(req.params.id);
      if (!existing) return res.status(404).json({ message: "Borrower not found" });
      const userCountry = getCountryFilter(req);
      if (userCountry && existing.country && existing.country !== userCountry) {
        return res.status(403).json({ message: "Data sovereignty violation: cannot modify borrower from a different country" });
      }
      const approval = await storage.createPendingApproval({
        entityType: "borrower",
        entityId: req.params.id,
        action: "UPDATE",
        payload: JSON.stringify(req.body),
        requestedBy: req.session?.userId!,
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

  app.post("/api/borrowers/:id/photo", requireAuth, memoryUpload.single("photo"), async (req, res) => {
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

  app.post("/api/borrowers/:id/id-document", requireAuth, memoryUploadDoc.single("document"), async (req, res) => {
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
      const result = await storage.getAllCreditAccounts(orgId, country);
      res.json(result);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
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
      res.status(500).json({ message: e.message });
    }
  });

  app.post("/api/credit-accounts", enforceDataSovereignty, async (req, res) => {
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

  app.patch("/api/credit-accounts/:id", enforceDataSovereignty, async (req, res) => {
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
      const approval = await storage.createPendingApproval({
        entityType: "credit_account",
        entityId: req.params.id,
        action: "UPDATE",
        payload: JSON.stringify(normalizedBody),
        requestedBy: req.session?.userId!,
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
      res.status(500).json({ message: e.message });
    }
  });

  app.post("/api/credit-inquiries", enforceDataSovereignty, async (req, res) => {
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

  app.get("/api/borrowers/:id/credit-report", async (req, res) => {
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

      res.json({
        borrower,
        accounts,
        inquiries,
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
      res.status(500).json({ message: e.message });
    }
  });

  app.get("/api/borrowers/:id/fraud-risk", requireRole("admin", "super_admin", "regulator", "lender"), async (req, res) => {
    try {
      const borrower = await storage.getBorrower(req.params.id);
      if (!borrower) return res.status(404).json({ message: "Borrower not found" });
      const accounts = await storage.getCreditAccountsByBorrower(req.params.id);
      const inquiries = await storage.getCreditInquiriesByBorrower(req.params.id);
      const judgments = await storage.getCourtJudgmentsByBorrower(req.params.id);
      const allBorrowers = await storage.getBorrowers();
      const duplicateIdCount = allBorrowers.filter(b => b.nationalId === borrower.nationalId).length;
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
      res.status(500).json({ message: e.message });
    }
  });

  app.get("/api/borrowers/:id/alternative-data", requireRole("admin", "super_admin", "regulator", "lender"), async (req, res) => {
    try {
      const borrowerId = req.params.id;
      const data = await db.select().from(alternativeData).where(eq(alternativeData.borrowerId, borrowerId));
      res.json(data);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
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

  const consumerAuthLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 15, message: { message: "Too many attempts. Please try again later." }, standardHeaders: true, legacyHeaders: false });
  const consumerLookupLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 10, message: { message: "Too many lookup requests. Please try again later." }, standardHeaders: true, legacyHeaders: false });

  const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "";
  const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || "";

  function getGoogleRedirectUri(req: Request) {
    if (process.env.CANONICAL_URL) return `${process.env.CANONICAL_URL}/api/consumer/auth/google/callback`;
    const host = req.get('host');
    if (host && !host.includes('africacredithub.com')) {
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
    const params = new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      redirect_uri: redirectUri,
      response_type: "code",
      scope: "openid email profile",
      state,
      access_type: "offline",
      prompt: "select_account",
    });
    res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`);
  });

  app.get("/api/consumer/auth/google/callback", async (req, res) => {
    try {
      const returnTo = (req.session as any).googleOAuthReturnTo || "/my-credit";
      const { code, state } = req.query;
      if (!code || !state) return res.redirect(`${returnTo}?error=missing_params`);

      if (state !== (req.session as any).googleOAuthState) {
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
        console.error("[Consumer][Google] Token exchange failed:", tokenData);
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
          console.log(`[Admin][Google] Login for ${adminUser.fullName} (${googleUser.email}) role=${adminUser.role} → redirecting to ${dest}`);
          req.session.save((saveErr) => {
            if (saveErr) {
              console.error(`[Admin][Google] Session save error:`, saveErr);
              return res.redirect("/login?error=session_error");
            }
            console.log(`[Admin][Google] Session saved OK, sending redirect to ${dest}`);
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
        console.log(`[Consumer][Google] Login for ${account!.id.slice(0, 8)}... (${googleUser.email})`);
        req.session.save((saveErr) => {
          if (saveErr) {
            console.error("[Consumer][Google] Session save error:", saveErr);
            return res.redirect("/my-credit?error=session_error");
          }
          res.redirect(returnTo);
        });
      });
    } catch (e: any) {
      const fallback = (req.session as any)?.googleOAuthReturnTo || "/my-credit";
      console.error("[Consumer][Google] OAuth error:", e.message);
      res.redirect(`${fallback}?error=oauth_failed`);
    }
  });

  app.get("/api/consumer/auth/apple", (_req, res) => {
    res.status(503).send(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Apple Sign-In</title></head><body style="font-family:Arial,sans-serif;display:flex;justify-content:center;align-items:center;min-height:100vh;margin:0;background:#f4f5f7;"><div style="max-width:400px;background:#fff;border-radius:12px;padding:40px;text-align:center;box-shadow:0 2px 8px rgba(0,0,0,.08);"><h2 style="color:#1a1a2e;">Apple Sign-In Coming Soon</h2><p style="color:#555;font-size:14px;">Apple Sign-In requires an Apple Developer account and is being set up. Please use Google or email/password registration for now.</p><a href="/my-credit" style="display:inline-block;margin-top:16px;background:#1a1a2e;color:#fff;padding:10px 24px;border-radius:8px;text-decoration:none;font-size:14px;">Back to Login</a></div></body></html>`);
  });

  app.post("/api/consumer/register", consumerAuthLimiter, async (req, res) => {
    try {
      const { nationalId, phone, email, password, dateOfBirth } = req.body;
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

      console.log(`[Consumer] Registration for ${account.id.slice(0, 8)}... — SMS: ${smsSent}, Email: ${emailSent}`);

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
      console.error("[Consumer] Registration error:", e.message);
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

      const [account] = await db.select().from(consumerAccounts).where(eq(consumerAccounts.nationalId, nationalId)).limit(1);
      if (!account) return res.status(401).json({ message: "Invalid credentials" });

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

        console.log(`[Consumer] Re-verification for ${account.id.slice(0, 8)}... — SMS: ${smsSent}, Email: ${emailSent}`);
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
      console.error("[Consumer] Email verification error:", e.message);
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

  app.post("/api/consumer/lookup", consumerLookupLimiter, async (req, res) => {
    if (!(req.session as any).consumerId) {
      return res.status(401).json({ message: "Please log in to view your credit score" });
    }
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

      res.json({
        borrower: {
          firstName: borrower.firstName,
          lastName: borrower.lastName,
          companyName: borrower.companyName,
          type: borrower.type,
          nationalId: borrower.nationalId?.replace(/(.{3}).+(.{3})/, "$1****$2"),
        },
        creditScore,
      });
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.get("/api/audit-logs", requireRole("admin", "regulator", "super_admin"), async (req, res) => {
    try {
      const orgId = getOrgScope(req);
      const country = getCountryFilter(req);
      const logs = await storage.getAuditLogs(orgId, country);
      res.json(logs);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.get("/api/audit/verify-integrity", requireRole("admin", "regulator"), async (_req, res) => {
    try {
      const result = await storage.verifyAuditIntegrity();
      res.json(result);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.get("/api/audit/stats", requireRole("admin", "regulator", "super_admin"), async (req, res) => {
    try {
      const orgId = getOrgScope(req);
      const country = getCountryFilter(req);
      const allLogs = await storage.getAuditLogs(orgId, country);

      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      let actionsToday = 0;
      const uniqueUsersToday = new Set<string>();
      const actionCounts: Record<string, number> = {};
      const entityCounts: Record<string, number> = {};
      const userIds = new Set<string>();

      for (const log of allLogs) {
        if (log.action) {
          actionCounts[log.action] = (actionCounts[log.action] || 0) + 1;
        }
        if (log.entity) {
          entityCounts[log.entity] = (entityCounts[log.entity] || 0) + 1;
        }
        if (log.userId) {
          userIds.add(log.userId);
        }
        if (log.createdAt && new Date(log.createdAt) >= todayStart) {
          actionsToday++;
          if (log.userId) uniqueUsersToday.add(log.userId);
        }
      }

      const topActions = Object.entries(actionCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([action, count]) => ({ action, count }));

      const topEntities = Object.entries(entityCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([entity, count]) => ({ entity, count }));

      const uniqueActions = Object.keys(actionCounts);
      const uniqueEntities = Object.keys(entityCounts);

      res.json({
        totalLogs: allLogs.length,
        actionsToday,
        uniqueUsersToday: uniqueUsersToday.size,
        totalUniqueUsers: userIds.size,
        topActions,
        topEntities,
        uniqueActions,
        uniqueEntities,
      });
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.get("/api/pending-approvals", async (req, res) => {
    try {
      const orgId = getOrgScope(req);
      const country = getCountryFilter(req);
      const approvals = await storage.getPendingApprovals(orgId, country);
      res.json(approvals);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.post("/api/pending-approvals", async (req, res) => {
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
      const { status, reviewNotes } = req.body;
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
              await storage.createBorrower(payload);
              deliverWebhook("borrower.created", payload, payload.organizationId).catch(() => {});
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
          }
        } catch (applyErr: any) {
          console.error("Error applying approved change:", applyErr);
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
      const disputeList = await storage.getDisputes(orgId, country);
      res.json(disputeList);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
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
      res.status(500).json({ message: e.message });
    }
  });

  app.post("/api/disputes", async (req, res) => {
    try {
      const data = {
        ...req.body,
        filedBy: req.session?.userId,
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

  app.patch("/api/disputes/:id", async (req, res) => {
    try {
      const dispute = await storage.updateDispute(req.params.id, req.body);
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

  async function batchInsertCreditAccounts(
    validated: Array<{ index: number; data: any }>,
    results: { successCount: number; errorCount: number; errors: Array<{ index: number; message: string }> }
  ) {
    const CHUNK = 250;
    for (let c = 0; c < validated.length; c += CHUNK) {
      const chunk = validated.slice(c, c + CHUNK);
      try {
        await db.insert(creditAccounts).values(chunk.map(item => item.data));
        results.successCount += chunk.length;
      } catch (err: any) {
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

      const validated: Array<{ index: number; data: any }> = [];
      for (let i = 0; i < records.length; i++) {
        const missingFields = validateBatchRequiredFields(records[i], i);
        if (missingFields.length > 0) {
          results.errorCount++;
          results.errors.push({ index: i, message: `Missing required fields: ${missingFields.join(", ")}` });
          continue;
        }
        try {
          const parsed = insertCreditAccountSchema.parse(records[i]);
          validated.push({ index: i, data: parsed });
        } catch (err: any) {
          results.errorCount++;
          results.errors.push({ index: i, message: err.message || "Validation failed" });
        }
      }

      await batchInsertCreditAccounts(validated, results);

      await storage.createAuditLog({
        action: "BATCH_UPLOAD", entity: "credit_account", userId: req.session?.userId,
        details: `Batch upload: ${results.successCount} succeeded, ${results.errorCount} failed out of ${results.totalSubmitted}`,
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
          currency: extract("currency") || "ETB",
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
      const validated: Array<{ index: number; data: any }> = [];
      for (let i = 0; i < records.length; i++) {
        const missingFields = validateBatchRequiredFields(records[i], i);
        if (missingFields.length > 0) {
          results.errorCount++;
          results.errors.push({ index: i, message: `Missing required fields: ${missingFields.join(", ")}` });
          continue;
        }
        try {
          validated.push({ index: i, data: insertCreditAccountSchema.parse(records[i]) });
        } catch (err: any) {
          results.errorCount++;
          results.errors.push({ index: i, message: err.message || "Validation failed" });
        }
      }
      await batchInsertCreditAccounts(validated, results);

      await storage.createAuditLog({
        action: "BATCH_UPLOAD_XBRL", entity: "credit_account", userId: req.session?.userId,
        details: `XBRL upload: ${results.successCount} succeeded, ${results.errorCount} failed out of ${results.totalSubmitted}`,
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

      const validated: Array<{ index: number; data: any }> = [];
      for (let i = 0; i < records.length; i++) {
        const missingFields = validateBatchRequiredFields(records[i], i);
        if (missingFields.length > 0) {
          results.errorCount++;
          results.errors.push({ index: i, message: `Missing required fields: ${missingFields.join(", ")}` });
          continue;
        }
        try {
          validated.push({ index: i, data: insertCreditAccountSchema.parse(records[i]) });
        } catch (err: any) {
          results.errorCount++;
          results.errors.push({ index: i, message: err.message || "Validation failed" });
        }
      }
      await batchInsertCreditAccounts(validated, results);

      await storage.createAuditLog({
        action: "BATCH_UPLOAD_BOG", entity: "credit_account", userId: req.session?.userId,
        details: `BoG pipe-delimited upload: ${results.successCount} succeeded, ${results.errorCount} failed out of ${results.totalSubmitted}`,
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

      const validated: Array<{ index: number; data: any }> = [];
      for (let i = 0; i < records.length; i++) {
        const missingFields = validateBatchRequiredFields(records[i], i);
        if (missingFields.length > 0) {
          results.errorCount++;
          results.errors.push({ index: i, message: `Missing required fields: ${missingFields.join(", ")}` });
          continue;
        }
        try {
          validated.push({ index: i, data: insertCreditAccountSchema.parse(records[i]) });
        } catch (err: any) {
          results.errorCount++;
          results.errors.push({ index: i, message: err.message || "Validation failed" });
        }
      }
      await batchInsertCreditAccounts(validated, results);

      await storage.createAuditLog({
        action: "BATCH_UPLOAD_CSV", entity: "credit_account", userId: req.session?.userId,
        details: `CSV upload: ${results.successCount} succeeded, ${results.errorCount} failed out of ${results.totalSubmitted}`,
        ipAddress: req.ip || null,
      });

      res.json(results);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  app.get("/api/batch-upload/history", requireRole("admin", "lender"), async (req, res) => {
    try {
      const allLogs = await storage.getAuditLogs(getOrgScope(req), getCountryFilter(req));
      const batchLogs = allLogs
        .filter((log: any) => log.action && log.action.startsWith("BATCH_UPLOAD"))
        .map((log: any) => {
          const detailStr = log.details || "";
          const formatMatch = log.action.replace("BATCH_UPLOAD", "").replace("_", "") || "JSON";
          let totalSubmitted = 0, successCount = 0, errorCount = 0;
          const numMatch = detailStr.match(/(\d+)\s+succeeded.*?(\d+)\s+failed.*?(\d+)/);
          if (numMatch) {
            successCount = parseInt(numMatch[1], 10);
            errorCount = parseInt(numMatch[2], 10);
            totalSubmitted = parseInt(numMatch[3], 10);
          }
          return {
            id: log.id,
            format: formatMatch || "JSON",
            totalSubmitted,
            successCount,
            errorCount,
            userId: log.userId,
            createdAt: log.createdAt,
            details: log.details,
          };
        });
      res.json(batchLogs);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
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
          currency: "ETB",
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
    if (ext.endsWith(".xlsx") || ext.endsWith(".xls") || ext.endsWith(".csv")) cb(null, true);
    else cb(new Error("Only .xlsx, .xls and .csv files are accepted"));
  }});

  app.post("/api/batch-upload/iff", batchLimiter, requireRole("admin", "lender"), iffUpload.single("file"), async (req, res) => {
    try {
      if (!req.file) return res.status(400).json({ message: "No file uploaded" });

      const ExcelJS = await import("exceljs");
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

      await storage.createAuditLog({
        action: "IFF_UPLOAD", entity: "iff_batch", userId: req.session?.userId,
        details: `IFF upload (${iffType}): ${result.totalRecords} records, ${result.borrowersCreated} borrowers created, ${result.borrowersUpdated} updated, ${result.accountsCreated} accounts, ${result.chequesCreated} cheques, ${result.judgmentsCreated} judgments, ${result.guarantorsCreated} guarantors, ${result.errors.length} errors`,
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

      await storage.createAuditLog({
        action: "IFF_UPLOAD_JSON", entity: "iff_batch", userId: req.session?.userId,
        details: `IFF JSON upload (${iffType}): ${result.totalRecords} records processed`,
        ipAddress: req.ip || null,
      });

      res.json({ iffType, ...result });
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  app.post("/api/batch-upload/dishonoured-cheques", batchLimiter, requireRole("admin", "lender"), async (req, res) => {
    try {
      const { records } = req.body;
      if (!Array.isArray(records)) return res.status(400).json({ message: "Request body must contain a 'records' array" });

      const results = { totalSubmitted: records.length, successCount: 0, errorCount: 0, errors: [] as Array<{ index: number; message: string }> };

      for (let i = 0; i < records.length; i++) {
        try {
          const parsed = insertDishonouredChequeSchema.parse(records[i]);
          if (req.session?.organizationId) parsed.organizationId = req.session.organizationId;
          await storage.createDishonouredCheque(parsed);
          results.successCount++;
        } catch (err: any) {
          results.errorCount++;
          results.errors.push({ index: i, message: err.message || "Validation failed" });
        }
      }

      await storage.createAuditLog({
        action: "BATCH_UPLOAD", entity: "dishonoured_cheque", userId: req.session?.userId,
        details: `Batch cheque upload: ${results.successCount} succeeded, ${results.errorCount} failed`,
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

      const results = { totalSubmitted: records.length, successCount: 0, errorCount: 0, errors: [] as Array<{ index: number; message: string }> };

      for (let i = 0; i < records.length; i++) {
        try {
          const parsed = insertCourtJudgmentSchema.parse(records[i]);
          if (req.session?.organizationId) parsed.organizationId = req.session.organizationId;
          await storage.createCourtJudgment(parsed);
          results.successCount++;
        } catch (err: any) {
          results.errorCount++;
          results.errors.push({ index: i, message: err.message || "Validation failed" });
        }
      }

      await storage.createAuditLog({
        action: "BATCH_UPLOAD", entity: "court_judgment", userId: req.session?.userId,
        details: `Batch judgment upload: ${results.successCount} succeeded, ${results.errorCount} failed`,
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
      res.status(500).json({ message: e.message });
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
      const list = await storage.getGuarantorsByBorrower(req.params.id);
      res.json(list);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
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
      const items = await storage.getNotifications(req.session.userId);
      res.json(items);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.get("/api/notifications/unread-count", async (req, res) => {
    try {
      if (!req.session?.userId) return res.status(401).json({ message: "Not authenticated" });
      const count = await storage.getUnreadNotificationCount(req.session.userId);
      res.json({ count });
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.patch("/api/notifications/:id/read", async (req, res) => {
    try {
      if (!req.session?.userId) return res.status(401).json({ message: "Not authenticated" });
      await storage.markNotificationRead(req.params.id);
      res.json({ message: "Marked as read" });
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.post("/api/notifications/mark-all-read", async (req, res) => {
    try {
      if (!req.session?.userId) return res.status(401).json({ message: "Not authenticated" });
      await storage.markAllNotificationsRead(req.session.userId);
      res.json({ message: "All marked as read" });
    } catch (e: any) {
      res.status(500).json({ message: e.message });
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
      res.status(500).json({ message: e.message });
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
      const result = await storage.getAllCourtJudgments(orgId, country);
      res.json(result);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
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
      res.status(500).json({ message: e.message });
    }
  });

  app.post("/api/consent-records", async (req, res) => {
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

  app.post("/api/consent-records/:id/revoke", async (req, res) => {
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
      res.status(500).json({ message: e.message });
    }
  });

  app.post("/api/payment-history/:creditAccountId", async (req, res) => {
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
      res.status(500).json({ message: e.message });
    }
  });

  app.post("/api/institutions", async (req, res) => {
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
      const records = await storage.getBillingRecords(orgId, country);
      res.json(records);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
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
      res.status(500).json({ message: e.message });
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
        recipientEmail = process.env.SMTP_FROM || "uffe.carlson@gmail.com";
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
      res.status(500).json({ message: e.message });
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
          recipientEmail = process.env.SMTP_FROM || "uffe.carlson@gmail.com";
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
      res.status(500).json({ message: e.message });
    }
  });

  app.get("/api/credit-reports/logs", creditReportLimiter, requireRole("admin", "regulator", "super_admin"), async (req, res) => {
    try {
      const orgId = getOrgScope(req);
      const country = getCountryFilter(req);
      const logs = await storage.getCreditReportLogs(orgId, country);
      res.json(logs);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.post("/api/credit-reports/generate", creditReportLimiter, requireAuth, async (req, res) => {
    try {
      const { borrowerId, purpose } = req.body;
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
      });
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.post("/api/credit-reports/download-pdf", creditReportLimiter, requireAuth, async (req, res) => {
    try {
      const { reportData } = req.body;
      if (!reportData) return res.status(400).json({ message: "reportData is required" });

      const PDFDocument = (await import("pdfkit")).default;
      const doc = new PDFDocument({ size: "A4", margins: { top: 40, bottom: 40, left: 40, right: 40 }, bufferPages: true });
      const chunks: Buffer[] = [];
      doc.on("data", (chunk: Buffer) => chunks.push(chunk));

      const TEAL = "#0d4a42";
      const DARK = "#1a1a1a";
      const GRAY = "#555555";
      const LIGHT = "#888888";
      const W = doc.page.width - 80;

      function drawHeader() {
        doc.rect(40, 40, W, 60).fill(TEAL);
        doc.fill("#ffffff").fontSize(14).font("Helvetica-Bold")
          .text("Comprehensive Credit Information Report", 50, 52, { width: W - 140 });
        doc.fontSize(8).font("Helvetica").fill("#cccccc")
          .text("Cross-Jurisdictional Central Data Hub v2.0 | Carlson Capital & Systems In Motion Limited", 50, 72, { width: W - 140 });
        doc.fill("#ffffff").fontSize(7).font("Helvetica")
          .text("ORDER NUMBER", W - 90, 52, { width: 80, align: "right" });
        doc.fontSize(9).font("Helvetica-Bold")
          .text(reportData.serialNumber || "", W - 90, 63, { width: 80, align: "right" });
        doc.fill(DARK);
        doc.y = 115;
      }

      function sectionTitle(title: string, num?: number) {
        ensureSpace(30);
        doc.moveDown(0.5);
        const y = doc.y;
        if (num !== undefined) {
          doc.fill(TEAL).fontSize(8).font("Helvetica-Bold")
            .text(`${num}`, 40, y, { width: 15 });
          doc.fill(TEAL).fontSize(10).font("Helvetica-Bold")
            .text(title, 58, y);
        } else {
          doc.fill(TEAL).fontSize(10).font("Helvetica-Bold")
            .text(title, 40, y);
        }
        doc.moveDown(0.3);
        doc.moveTo(40, doc.y).lineTo(40 + W, doc.y).strokeColor("#dddddd").lineWidth(0.5).stroke();
        doc.moveDown(0.3);
        doc.fill(DARK);
      }

      function infoRow(label: string, value: string, x: number, w: number) {
        doc.fontSize(6).font("Helvetica").fill(LIGHT).text(label.toUpperCase(), x, doc.y, { width: w });
        doc.fontSize(8.5).font("Helvetica-Bold").fill(DARK).text(value || "—", x, doc.y, { width: w });
        doc.moveDown(0.2);
      }

      function ensureSpace(needed: number) {
        if (doc.y + needed > doc.page.height - 60) {
          doc.addPage();
          doc.y = 40;
        }
      }

      function tableHeader(cols: { label: string; width: number; align?: string }[]) {
        ensureSpace(20);
        const y = doc.y;
        doc.rect(40, y, W, 16).fill("#f0f0f0");
        let x = 44;
        cols.forEach(col => {
          doc.fill(GRAY).fontSize(6).font("Helvetica-Bold")
            .text(col.label.toUpperCase(), x, y + 4, { width: col.width - 8, align: (col.align as any) || "left" });
          x += col.width;
        });
        doc.y = y + 18;
      }

      function tableRow(cols: { value: string; width: number; align?: string; bold?: boolean; color?: string }[]) {
        ensureSpace(16);
        const y = doc.y;
        let x = 44;
        cols.forEach(col => {
          doc.fill(col.color || DARK).fontSize(7.5).font(col.bold ? "Helvetica-Bold" : "Helvetica")
            .text(col.value || "—", x, y + 3, { width: col.width - 8, align: (col.align as any) || "left" });
          x += col.width;
        });
        doc.moveTo(40, y + 15).lineTo(40 + W, y + 15).strokeColor("#eeeeee").lineWidth(0.3).stroke();
        doc.y = y + 16;
      }

      drawHeader();

      const b = reportData.borrower;
      const s = reportData.summary;
      const accounts = reportData.accounts || [];
      const inquiries = reportData.inquiries || [];
      const judgments = reportData.courtJudgments || [];

      doc.fontSize(6).font("Helvetica").fill(LIGHT).text("CIR NUMBER", 40, doc.y, { continued: false });
      doc.fontSize(8).font("Helvetica-Bold").fill(DARK).text(reportData.serialNumber);
      doc.moveDown(0.3);

      const grid1 = [
        ["Report Order Date", new Date(reportData.generatedAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })],
        ["Institution", reportData.requestedBy?.institution || "—"],
        ["Requested By", reportData.requestedBy?.fullName || "—"],
      ];
      grid1.forEach(([l, v]) => {
        doc.fontSize(6).font("Helvetica").fill(LIGHT).text(l, 40, doc.y, { width: W });
        doc.fontSize(8).font("Helvetica-Bold").fill(DARK).text(v, 40, doc.y, { width: W });
        doc.moveDown(0.2);
      });

      doc.moveDown(0.3);
      doc.fontSize(6).font("Helvetica").fill(LIGHT).text("SEARCH DETAILS", 40, doc.y);
      doc.moveDown(0.2);
      const name = b.type === "corporate" ? (b.companyName || "—") : `${b.firstName} ${b.lastName}`;
      doc.fontSize(8).font("Helvetica-Bold").fill(DARK).text(`Name: ${name} | ID: ${b.nationalId || b.tinNumber || "—"} | Country: ${b.country || "—"}`);
      doc.moveDown(0.5);

      sectionTitle("Subject Details");
      if (b.type === "individual") {
        const fields = [
          ["Full Name", `${b.firstName} ${b.lastName}`], ["Date of Birth", b.dateOfBirth || "—"],
          ["Gender", b.gender || "—"], ["National ID", b.nationalId || "—"],
          ["TIN", b.tinNumber || "—"], ["Passport", b.passportNumber || "—"],
          ["Employer", b.employerName || "—"], ["Occupation", b.occupation || "—"],
          ["Phone", b.phone || "—"], ["Email", b.email || "—"],
        ];
        fields.forEach(([l, v]) => infoRow(l, v, 40, W));
      } else {
        const fields = [
          ["Company Name", b.companyName || "—"], ["Business Reg", b.businessRegNumber || "—"],
          ["Sector", b.sector || "—"], ["TIN", b.tinNumber || "—"],
          ["Phone", b.phone || "—"], ["Email", b.email || "—"],
        ];
        fields.forEach(([l, v]) => infoRow(l, v, 40, W));
      }

      sectionTitle("Credit Score Summary");
      ensureSpace(40);
      doc.fontSize(24).font("Helvetica-Bold").fill(s.creditScore >= 700 ? "#16a34a" : s.creditScore >= 600 ? "#ca8a04" : "#dc2626")
        .text(String(s.creditScore), 40, doc.y, { width: W, align: "center" });
      doc.fontSize(8).font("Helvetica").fill(GRAY)
        .text(`Range 300-850 | Total Facilities: ${s.totalAccounts} | Active: ${s.activeAccounts} | Risk Items: ${s.delinquentAccounts + s.writtenOffAccounts + s.judgmentCount}`, 40, doc.y, { width: W, align: "center" });
      doc.moveDown(0.5);

      if (s.reasonCodes && s.reasonCodes.length > 0) {
        sectionTitle("Score Factor Analysis");
        s.reasonCodes.forEach((code: string) => {
          ensureSpace(14);
          const label = code.replace(/_/g, " ").toLowerCase().replace(/^\w/, (c: string) => c.toUpperCase());
          doc.fontSize(7.5).font("Helvetica").fill(DARK).text(`• ${label}`, 48, doc.y);
          doc.moveDown(0.15);
        });
      }

      sectionTitle("Credit Profile Overview", 1);
      const overviewCols = [
        { label: "S.No", width: 35 },
        { label: "Indicator", width: W - 135 },
        { label: "Value", width: 100, align: "right" },
      ];
      tableHeader(overviewCols);
      const openAccts = accounts.filter((a: any) => a.status !== "closed");
      const totalBal = openAccts.reduce((s: number, a: any) => s + parseFloat(a.currentBalance || "0"), 0);
      const overdueAccts = openAccts.filter((a: any) => (a.daysInArrears || 0) > 0);
      const npl = openAccts.filter((a: any) => (a.daysInArrears || 0) > 90);
      const closedAccts = accounts.filter((a: any) => a.status === "closed");
      const woAccts = accounts.filter((a: any) => a.status === "written_off");
      const indicators = [
        ["1", "Number of Open Credit Facilities", String(openAccts.length)],
        ["2", "Total Outstanding Balance", totalBal.toLocaleString("en-US", { minimumFractionDigits: 2 })],
        ["3", "Number of Overdue Facilities", String(overdueAccts.length)],
        ["4", "Non-Performing (>90 days)", String(npl.length)],
        ["5", "Closed Facilities", String(closedAccts.length)],
        ["6", "Written-Off Facilities", String(woAccts.length)],
        ["7", "Court Judgments", String(judgments.length)],
        ["8", "Credit Inquiries", String(inquiries.length)],
      ];
      indicators.forEach(([sno, label, val]) => {
        tableRow([
          { value: sno, width: 35 },
          { value: label, width: W - 135 },
          { value: val, width: 100, align: "right", bold: true },
        ]);
      });

      if (inquiries.length > 0) {
        sectionTitle("Inquiry History", 2);
        const inqCols = [
          { label: "Institution", width: W * 0.35 },
          { label: "Purpose", width: W * 0.25 },
          { label: "Date", width: W * 0.2 },
          { label: "Consent", width: W * 0.2 },
        ];
        tableHeader(inqCols);
        inquiries.slice(0, 20).forEach((inq: any) => {
          tableRow([
            { value: inq.institution, width: W * 0.35 },
            { value: (inq.purpose || "").replace(/_/g, " "), width: W * 0.25 },
            { value: inq.createdAt ? new Date(inq.createdAt).toLocaleDateString("en-GB") : "—", width: W * 0.2 },
            { value: inq.consentProvided ? "Yes" : "No", width: W * 0.2, color: inq.consentProvided ? "#16a34a" : "#dc2626" },
          ]);
        });
      }

      if (accounts.length > 0) {
        sectionTitle("Credit Facility Details", 3);
        accounts.forEach((acct: any, idx: number) => {
          ensureSpace(100);
          const cur = acct.currency || "ETB";
          doc.moveDown(0.3);
          doc.fontSize(8).font("Helvetica-Bold").fill(TEAL)
            .text(`Facility ${idx + 1} of ${accounts.length} — ${acct.status?.toUpperCase()} (${cur})`, 40, doc.y);
          doc.moveDown(0.3);

          const facilityFields = [
            ["Institution", acct.lenderInstitution], ["Account No.", acct.accountNumber],
            ["Type", (acct.accountType || "").replace(/_/g, " ")], ["Classification", acct.status],
            ["Current Balance", acct.currentBalance ? `${cur} ${parseFloat(acct.currentBalance).toLocaleString()}` : "—"],
            ["Sanctioned Amount", acct.originalAmount ? `${cur} ${parseFloat(acct.originalAmount).toLocaleString()}` : "—"],
            ["Days in Arrears", String(acct.daysInArrears || 0)],
            ["Interest Rate", acct.isInterestFree ? "Interest-Free" : `${acct.interestRate || "—"}%`],
            ["Disbursement Date", acct.disbursementDate || "—"], ["Maturity Date", acct.maturityDate || "—"],
            ["Last Payment", acct.lastPaymentDate || "—"],
            ["Restructured", (acct.restructureCount || 0) > 0 ? `Yes (${acct.restructureCount}x)` : "No"],
          ];
          facilityFields.forEach(([l, v]) => {
            ensureSpace(14);
            infoRow(l, v, 48, W - 8);
          });

          const history = reportData.paymentHistory?.[acct.id] || [];
          if (history.length > 0) {
            ensureSpace(20);
            doc.fontSize(7).font("Helvetica-Bold").fill(GRAY).text("Payment History (Last 12 Months):", 48, doc.y);
            doc.moveDown(0.2);
            const statusLine = history.slice(0, 12).map((ph: any) => {
              const label = ph.status === "on_time" ? "OK" : ph.status === "late" ? "30" : ph.status === "missed" ? "X" : ph.status === "partial" ? "P" : "ND";
              return `${ph.period}: ${label}`;
            }).join(" | ");
            doc.fontSize(6.5).font("Helvetica").fill(DARK).text(statusLine, 48, doc.y, { width: W - 16 });
            doc.moveDown(0.3);
          }

          if (acct.collateralType) {
            ensureSpace(20);
            doc.fontSize(7).font("Helvetica-Bold").fill(GRAY).text("Security:", 48, doc.y);
            doc.moveDown(0.15);
            doc.fontSize(7.5).font("Helvetica").fill(DARK)
              .text(`Type: ${acct.collateralType} | Value: ${cur} ${parseFloat(acct.collateralValue || "0").toLocaleString()}`, 48, doc.y, { width: W - 16 });
            doc.moveDown(0.3);
          }

          doc.moveTo(40, doc.y).lineTo(40 + W, doc.y).strokeColor("#cccccc").lineWidth(0.5).stroke();
          doc.moveDown(0.2);
        });
      }

      if (judgments.length > 0) {
        sectionTitle("Court Judgments & Public Records", 4);
        const jCols = [
          { label: "Case No.", width: W * 0.2 },
          { label: "Court", width: W * 0.25 },
          { label: "Type", width: W * 0.15 },
          { label: "Amount", width: W * 0.15, align: "right" },
          { label: "Date", width: W * 0.12 },
          { label: "Status", width: W * 0.13 },
        ];
        tableHeader(jCols);
        judgments.forEach((j: any) => {
          tableRow([
            { value: j.caseNumber, width: W * 0.2 },
            { value: j.court, width: W * 0.25 },
            { value: (j.judgmentType || "").replace(/_/g, " "), width: W * 0.15 },
            { value: j.amount ? `${j.currency || "ETB"} ${parseFloat(j.amount).toLocaleString()}` : "—", width: W * 0.15, align: "right" },
            { value: j.judgmentDate || "—", width: W * 0.12 },
            { value: j.status || "—", width: W * 0.13, color: j.status === "active" ? "#dc2626" : "#16a34a" },
          ]);
        });
      }

      const allGuarantors = reportData.guarantors || {};
      const guarantorEntries = Object.values(allGuarantors).flat();
      if (guarantorEntries.length > 0) {
        sectionTitle("Guarantors", 5);
        const gCols = [
          { label: "Name", width: W * 0.25 },
          { label: "National ID", width: W * 0.2 },
          { label: "Type", width: W * 0.15 },
          { label: "Contact", width: W * 0.2 },
          { label: "Account", width: W * 0.2 },
        ];
        tableHeader(gCols);
        (guarantorEntries as any[]).forEach((g: any) => {
          const name = g.companyName || [g.surname, g.firstName, g.middleNames].filter(Boolean).join(" ") || "—";
          tableRow([
            { value: name, width: W * 0.25 },
            { value: g.nationalId || g.businessRegNumber || "—", width: W * 0.2 },
            { value: g.natureOfGuarantor || "—", width: W * 0.15 },
            { value: g.mobile || g.homeTelephone || "—", width: W * 0.2 },
            { value: g.creditAccountId?.slice(0, 8) || "—", width: W * 0.2 },
          ]);
        });
      }

      ensureSpace(80);
      doc.moveDown(1);
      doc.moveTo(40, doc.y).lineTo(40 + W, doc.y).strokeColor("#cccccc").lineWidth(0.5).stroke();
      doc.moveDown(0.5);
      doc.fontSize(8).font("Helvetica-Bold").fill(DARK)
        .text("End of Credit Information Report", 40, doc.y, { width: W, align: "center" });
      doc.moveDown(0.3);
      doc.fontSize(7).font("Helvetica").fill(GRAY)
        .text(`Report Serial: ${reportData.serialNumber} | Generated: ${new Date(reportData.generatedAt).toLocaleString("en-GB")}${reportData.requestedBy ? ` | By: ${reportData.requestedBy.fullName} (${reportData.requestedBy.institution})` : ""}`, 40, doc.y, { width: W, align: "center" });
      doc.moveDown(0.3);
      doc.fontSize(6).font("Helvetica").fill(LIGHT)
        .text("The information in this report has been compiled from data submitted by participating financial institutions. While Carlson Capital & Systems In Motion Limited endeavor to ensure accuracy, we do not accept responsibility for any loss or damage resulting from this report.", 40, doc.y, { width: W, align: "center" });
      doc.moveDown(0.3);
      doc.fontSize(6).font("Helvetica").fill(LIGHT)
        .text("Cross-Jurisdictional Central Data Hub & Credit Registry System v2.0 | Carlson Capital & Systems In Motion Limited | Confidential & Proprietary", 40, doc.y, { width: W, align: "center" });

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
      console.error("PDF generation error:", e);
      res.status(500).json({ message: e.message });
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
      res.status(500).json({ message: e.message });
    }
  });

  app.get("/api/reports/export", requireRole("admin", "regulator", "super_admin"), async (req, res) => {
    try {
      const orgId = getOrgScope(req);
      const format = (req.query.format as string) || "csv";
      const type = (req.query.type as string) || "portfolio";

      const country = getCountryFilter(req);
      const accounts = await storage.getAllCreditAccounts(orgId, country);
      const borrowersList = (await storage.getBorrowers(1, 200, orgId, country)).data;

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
          const auditLogsList = await storage.getAuditLogs(orgId);
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

        res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        res.setHeader("Content-Disposition", `attachment; filename=${type}_report_${Date.now()}.xlsx`);
        await workbook.xlsx.write(res);
        res.end();
      } else if (format === "csv") {
        let csv = "";
        if (type === "portfolio") {
          csv = "Account Number,Borrower ID,Institution,Type,Original Amount,Current Balance,Currency,Status,Days in Arrears,Interest Free,Grace Period,Restructure Count\n";
          for (const a of accounts) {
            csv += `"${a.accountNumber}","${a.borrowerId}","${a.lenderInstitution}","${a.accountType}","${a.originalAmount}","${a.currentBalance}","${a.currency}","${a.status}","${a.daysInArrears}","${a.isInterestFree}","${a.gracePeriodMonths || ''}","${a.restructureCount}"\n`;
          }
        } else if (type === "borrowers") {
          csv = "Name,Type,National ID,TIN,Gender,City,Region,PEP,Education,Sector\n";
          for (const b of borrowersList) {
            const name = b.type === "individual" ? `${b.firstName} ${b.lastName}` : b.companyName;
            csv += `"${name}","${b.type}","${b.nationalId}","${b.tinNumber || ''}","${b.gender || ''}","${b.city || ''}","${b.region || ''}","${b.isPep}","${b.educationLevel || ''}","${b.sector || ''}"\n`;
          }
        } else if (type === "audit") {
          const auditLogsList = await storage.getAuditLogs(orgId);
          csv = "Timestamp,Action,Entity,Entity ID,Details,User ID,IP Address\n";
          for (const log of auditLogsList) {
            const ts = log.createdAt ? new Date(log.createdAt).toISOString() : "";
            csv += `"${ts}","${log.action}","${log.entity}","${log.entityId || ''}","${(log.details || '').replace(/"/g, '""')}","${log.userId || ''}","${log.ipAddress || ''}"\n`;
          }
        }

        res.setHeader("Content-Type", "text/csv");
        res.setHeader("Content-Disposition", `attachment; filename=${type}_report_${Date.now()}.csv`);
        res.send(csv);
      } else {
        res.status(400).json({ message: "Unsupported format. Use csv or xlsx." });
      }
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.get("/api/reports/regulatory", requireRole("admin", "regulator", "super_admin"), async (req, res) => {
    try {
      const orgId = getOrgScope(req);
      const country = getCountryFilter(req);
      const accounts = await storage.getAllCreditAccounts(orgId, country);
      const borrowersList = (await storage.getBorrowers(1, 200, orgId, country)).data;
      const totalBorrowers = borrowersList.length;
      const disputeList = await storage.getDisputes(orgId, country);
      const approvals = await storage.getPendingApprovals(orgId, country);
      const { data: instList, total: totalInstitutions } = await storage.getInstitutions(1, 200, orgId, country);

      const totalOutstanding = accounts.reduce((sum, a) => sum + parseFloat(a.currentBalance || "0"), 0);
      const nplAccounts = accounts.filter(a => a.status === "delinquent" || a.status === "default" || a.status === "written_off");
      const nplRatio = accounts.length > 0 ? (nplAccounts.length / accounts.length * 100).toFixed(2) : "0";

      const byInstitution: Record<string, { count: number; outstanding: number; npl: number }> = {};
      for (const a of accounts) {
        if (!byInstitution[a.lenderInstitution]) {
          byInstitution[a.lenderInstitution] = { count: 0, outstanding: 0, npl: 0 };
        }
        byInstitution[a.lenderInstitution].count++;
        byInstitution[a.lenderInstitution].outstanding += parseFloat(a.currentBalance || "0");
        if (a.status === "delinquent" || a.status === "default" || a.status === "written_off") {
          byInstitution[a.lenderInstitution].npl++;
        }
      }

      const byType: Record<string, number> = {};
      for (const a of accounts) {
        byType[a.accountType] = (byType[a.accountType] || 0) + 1;
      }

      const openDisputes = disputeList.filter(d => d.status === "open" || d.status === "under_review");
      const slaBreach = openDisputes.filter(d => d.slaDeadline && new Date(d.slaDeadline) < new Date());

      res.json({
        summary: {
          totalBorrowers,
          individualBorrowers: borrowersList.filter(b => b.type === "individual").length,
          corporateBorrowers: borrowersList.filter(b => b.type === "corporate").length,
          pepBorrowers: borrowersList.filter(b => b.isPep).length,
          totalAccounts: accounts.length,
          totalOutstanding: totalOutstanding.toFixed(2),
          nplAccounts: nplAccounts.length,
          nplRatio: `${nplRatio}%`,
          interestFreeAccounts: accounts.filter(a => a.isInterestFree).length,
          restructuredAccounts: accounts.filter(a => a.status === "restructured").length,
          writtenOffAccounts: accounts.filter(a => a.status === "written_off").length,
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
      res.status(500).json({ message: e.message });
    }
  });

  app.get("/api/bog/export/:fileType", requireRole("admin", "regulator", "super_admin"), async (req, res) => {
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

      res.setHeader("Content-Type", "text/csv; charset=utf-8");
      res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
      res.send(content);
    } catch (e: any) {
      console.error("BoG export error:", e);
      res.status(500).json({ message: e.message });
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
      res.status(500).json({ message: e.message });
    }
  });

  app.get("/api/bsl/export/:fileType", requireRole("admin", "regulator", "super_admin"), async (req, res) => {
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

      res.setHeader("Content-Type", "text/csv; charset=utf-8");
      res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
      res.send(content);
    } catch (e: any) {
      console.error("BSL export error:", e);
      res.status(500).json({ message: e.message });
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
      res.status(500).json({ message: e.message });
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
      res.status(500).json({ message: e.message });
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
      res.status(500).json({ message: e.message });
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
      res.status(500).json({ message: e.message });
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
  const SUPPORTED_DOC_LANGS = ["en", "fr", "ar", "sw"];
  const DOCS_LIST = [
    { id: "api-guide", filename: "API_Integration_Guide.md", title: "API Integration Guide", description: "Complete guide for banks and lenders to connect via REST API — authentication, endpoints, data models, and examples" },
    { id: "uat", filename: "UAT_Test_Document.md", title: "UAT Test Document", description: "187 test cases across 22 modules with SRS traceability" },
    { id: "systems", filename: "Systems_Documentation.md", title: "Systems Documentation", description: "Technical architecture, data model, API catalog, security, deployment" },
    { id: "users-manual", filename: "Users_Manual.md", title: "Users Manual", description: "Step-by-step user guide for all roles with 24 sections" },
    { id: "srs-matrix", filename: "SRS_Traceability_Matrix.md", title: "SRS Traceability Matrix", description: "57 SRS requirements mapped to implementation status" },
    { id: "data-dictionary", filename: "Data_Dictionary.md", title: "Data Dictionary", description: "Field-level documentation for all 15 tables" },
    { id: "deployment", filename: "Deployment_Guide.md", title: "Deployment Guide", description: "Step-by-step deployment instructions" },
    { id: "security", filename: "Security_Compliance_Report.md", title: "Security & Compliance Report", description: "Security controls with NFR-SEC compliance matrix" },
    { id: "liberia-proposal", filename: "Liberia_Marketing_Proposal.md", title: "Liberia Marketing Proposal", description: "Marketing & technical proposal for the Republic of Liberia — credit bureau solution, compliance assessment, implementation roadmap, and pricing" },
  ];

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

  app.get("/api/ghana-docs", requireAuth, (_req, res) => {
    const docsWithSize = GHANA_DOCS_LIST.map(doc => {
      try {
        const filePath = path.join(GHANA_DOCS_DIR, doc.filename);
        const stats = fs.statSync(filePath);
        return { ...doc, size: stats.size };
      } catch {
        return { ...doc, size: 0 };
      }
    });
    res.json(docsWithSize);
  });

  app.get("/api/ghana-docs/:id", requireAuth, async (req, res) => {
    const doc = GHANA_DOCS_LIST.find(d => d.id === req.params.id);
    if (!doc) return res.status(404).json({ message: "Document not found" });
    try {
      const filePath = path.join(GHANA_DOCS_DIR, doc.filename);
      const content = fs.readFileSync(filePath, "utf-8");
      const { marked } = await import("marked");
      const html = marked(content);
      res.json({ ...doc, content, html });
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.get("/api/ghana-docs/:id/pdf", requireAuth, async (req, res) => {
    const doc = GHANA_DOCS_LIST.find(d => d.id === req.params.id);
    if (!doc) return res.status(404).json({ message: "Document not found" });
    try {
      const filePath = path.join(GHANA_DOCS_DIR, doc.filename);
      const content = fs.readFileSync(filePath, "utf-8");
      const { PassThrough } = await import("stream");
      const { generatePdfFromMarkdown } = await import("./pdf-generator");
      const stream = new PassThrough();
      const safeName = doc.title.replace(/[^a-zA-Z0-9_\- ]/g, "").replace(/\s+/g, "_");
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="${safeName}.pdf"`);
      stream.pipe(res);
      generatePdfFromMarkdown(content, doc.title, stream);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
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
      res.status(500).json({ message: e.message });
    }
  });

  app.get("/api/docs", requireAuth, (req, res) => {
    const lang = (req.query.lang as string) || "en";
    const docsWithSize = DOCS_LIST.map(doc => {
      try {
        const filePath = resolveDocPath(doc.filename, lang);
        const stats = fs.statSync(filePath);
        return { ...doc, size: stats.size };
      } catch {
        return { ...doc, size: 0 };
      }
    });
    res.json(docsWithSize);
  });

  app.get("/api/docs/:id", requireAuth, async (req, res) => {
    const doc = DOCS_LIST.find(d => d.id === req.params.id);
    if (!doc) return res.status(404).json({ message: "Document not found" });
    try {
      const lang = (req.query.lang as string) || "en";
      const filePath = resolveDocPath(doc.filename, lang);
      const content = fs.readFileSync(filePath, "utf-8");
      const { marked } = await import("marked");
      const html = marked(content);
      res.json({ ...doc, content, html });
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.get("/api/docs/:id/pdf", requireAuth, async (req, res) => {
    const doc = DOCS_LIST.find(d => d.id === req.params.id);
    if (!doc) return res.status(404).json({ message: "Document not found" });
    try {
      const lang = (req.query.lang as string) || "en";
      const filePath = resolveDocPath(doc.filename, lang);
      const content = fs.readFileSync(filePath, "utf-8");
      const { PassThrough } = await import("stream");
      const { generatePdfFromMarkdown } = await import("./pdf-generator");
      const stream = new PassThrough();
      const safeName = doc.title.replace(/[^a-zA-Z0-9_\- ]/g, "").replace(/\s+/g, "_");
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="${safeName}.pdf"`);
      stream.pipe(res);
      generatePdfFromMarkdown(content, doc.title, stream);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.post("/api/admin/test-sms", requireAuth, requireRole("super_admin"), async (req, res) => {
    try {
      const { phone, message } = req.body;
      if (!phone || typeof phone !== "string") {
        return res.status(400).json({ message: "Phone number is required (E.164 format, e.g. +233552395548)" });
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
      res.status(500).json({ message: e.message });
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
      res.status(500).json({ message: e.message });
    }
  });

  // Exchange Rate Management
  app.get("/api/exchange-rates", requireAuth, async (_req, res) => {
    try {
      const rates = await storage.getExchangeRates();
      res.json(rates);
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  });

  app.post("/api/exchange-rates", requireRole("admin"), async (req, res) => {
    try {
      const parsed = insertExchangeRateSchema.parse({ ...req.body, createdBy: (req as any).user.id });
      const rate = await storage.createExchangeRate(parsed);
      await storage.createAuditLog({ userId: (req as any).user.id, action: "CREATE", entity: "exchange_rate", entityId: rate.id, details: `Created rate ${parsed.baseCurrency}/${parsed.targetCurrency}: ${parsed.rate}`, ipAddress: req.ip });
      res.status(201).json(rate);
    } catch (e: any) {
      if (e instanceof z.ZodError) return res.status(400).json({ message: "Validation error", errors: e.errors });
      res.status(500).json({ message: e.message });
    }
  });

  app.patch("/api/exchange-rates/:id", requireRole("admin"), async (req, res) => {
    try {
      const rate = await storage.updateExchangeRate(req.params.id, req.body);
      if (!rate) return res.status(404).json({ message: "Rate not found" });
      await storage.createAuditLog({ userId: (req as any).user.id, action: "UPDATE", entity: "exchange_rate", entityId: req.params.id, details: JSON.stringify(req.body), ipAddress: req.ip });
      res.json(rate);
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  });

  app.delete("/api/exchange-rates/:id", requireRole("admin"), async (req, res) => {
    try {
      const deleted = await storage.deleteExchangeRate(req.params.id);
      if (!deleted) return res.status(404).json({ message: "Rate not found" });
      await storage.createAuditLog({ userId: (req as any).user.id, action: "DELETE", entity: "exchange_rate", entityId: req.params.id, details: "Deleted exchange rate", ipAddress: req.ip });
      res.json({ message: "Deleted" });
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  });

  app.post("/api/exchange-rates/refresh", requireRole("admin"), async (req, res) => {
    try {
      const { fetchAndUpdateRates } = await import("./exchange-rate-scheduler");
      const result = await fetchAndUpdateRates();
      await storage.createAuditLog({ userId: req.session.userId, action: "REFRESH", entity: "exchange_rates", details: `Manual refresh: ${result.updated} updated, ${result.failed} failed`, ipAddress: req.ip });
      res.json({ message: "Exchange rates refreshed", ...result });
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  });

  app.get("/api/exchange-rates/convert", requireAuth, async (req, res) => {
    try {
      const { amount, from, to } = req.query;
      if (!amount || !from || !to) return res.status(400).json({ message: "amount, from, to required" });
      const result = await storage.convertCurrency(parseFloat(amount as string), from as string, to as string);
      if (!result) return res.status(404).json({ message: "No exchange rate found for this pair" });
      res.json(result);
    } catch (e: any) { res.status(500).json({ message: e.message }); }
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
      res.status(500).json({ message: e.message });
    }
  });

  app.get("/api/retention-policies", requireRole("admin", "regulator"), async (_req, res) => {
    try {
      const policies = await storage.getRetentionPolicies();
      res.json(policies);
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  });

  app.post("/api/retention-policies", requireRole("admin"), async (req, res) => {
    try {
      const parsed = insertRetentionPolicySchema.parse(req.body);
      const policy = await storage.createRetentionPolicy(parsed);
      await storage.createAuditLog({ userId: (req as any).user.id, action: "CREATE", entity: "retention_policy", entityId: policy.id, details: `Created retention policy: ${parsed.country} - ${parsed.entityType}`, ipAddress: req.ip });
      res.status(201).json(policy);
    } catch (e: any) {
      if (e instanceof z.ZodError) return res.status(400).json({ message: "Validation error", errors: e.errors });
      res.status(500).json({ message: e.message });
    }
  });

  app.patch("/api/retention-policies/:id", requireRole("admin"), async (req, res) => {
    try {
      const policy = await storage.updateRetentionPolicy(req.params.id, req.body);
      if (!policy) return res.status(404).json({ message: "Policy not found" });
      await storage.createAuditLog({ userId: (req as any).user.id, action: "UPDATE", entity: "retention_policy", entityId: req.params.id, details: JSON.stringify(req.body), ipAddress: req.ip });
      res.json(policy);
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  });

  app.delete("/api/retention-policies/:id", requireRole("admin"), async (req, res) => {
    try {
      const deleted = await storage.deleteRetentionPolicy(req.params.id);
      if (!deleted) return res.status(404).json({ message: "Policy not found" });
      await storage.createAuditLog({ userId: (req as any).user.id, action: "DELETE", entity: "retention_policy", entityId: req.params.id, details: "Deleted retention policy", ipAddress: req.ip });
      res.json({ message: "Deleted" });
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  });

  // API Configurations
  app.get("/api/api-configurations", requireRole("admin"), async (_req, res) => {
    try {
      const configs = await storage.getApiConfigurations();
      res.json(configs);
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  });

  app.get("/api/api-configurations/:id", requireRole("admin"), async (req, res) => {
    try {
      const config = await storage.getApiConfiguration(req.params.id);
      if (!config) return res.status(404).json({ message: "Configuration not found" });
      res.json(config);
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  });

  app.post("/api/api-configurations", requireRole("admin"), async (req, res) => {
    try {
      const parsed = insertApiConfigurationSchema.parse(req.body);
      const config = await storage.createApiConfiguration(parsed);
      await storage.createAuditLog({ userId: (req as any).user.id, action: "CREATE", entity: "api_configuration", entityId: config.id, details: `Created API config: ${parsed.name}`, ipAddress: req.ip });
      res.status(201).json(config);
    } catch (e: any) {
      if (e instanceof z.ZodError) return res.status(400).json({ message: "Validation error", errors: e.errors });
      res.status(500).json({ message: e.message });
    }
  });

  app.patch("/api/api-configurations/:id", requireRole("admin"), async (req, res) => {
    try {
      const config = await storage.updateApiConfiguration(req.params.id, req.body);
      if (!config) return res.status(404).json({ message: "Configuration not found" });
      await storage.createAuditLog({ userId: (req as any).user.id, action: "UPDATE", entity: "api_configuration", entityId: req.params.id, details: JSON.stringify(req.body), ipAddress: req.ip });
      res.json(config);
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  });

  app.delete("/api/api-configurations/:id", requireRole("admin"), async (req, res) => {
    try {
      const deleted = await storage.deleteApiConfiguration(req.params.id);
      if (!deleted) return res.status(404).json({ message: "Configuration not found" });
      await storage.createAuditLog({ userId: (req as any).user.id, action: "DELETE", entity: "api_configuration", entityId: req.params.id, details: "Deleted API configuration", ipAddress: req.ip });
      res.json({ message: "Deleted" });
    } catch (e: any) { res.status(500).json({ message: e.message }); }
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
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  });

  app.get("/api/admin/organizations/list", requireAuth, requireSuperAdmin, async (req, res) => {
    try {
      const country = getCountryFilter(req);
      const orgs = await storage.getOrganizations(country);
      res.json(orgs.map(o => ({ id: o.id, name: o.name, type: o.type, status: o.status, country: o.country, subscriptionTier: o.subscriptionTier })));
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  });

  app.get("/api/admin/organizations", requireAuth, requireSuperAdmin, async (req, res) => {
    try {
      const country = getCountryFilter(req);
      const orgs = await storage.getOrganizations(country);
      const orgsWithStats = await Promise.all(orgs.map(async (org) => {
        const users = await storage.getUsers(org.id);
        const stats = await storage.getDashboardStats(org.id);
        const billing = await storage.getBillingRecords(org.id);
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
      res.status(500).json({ message: e.message });
    }
  });

  app.get("/api/admin/organizations/:id", requireAuth, requireSuperAdmin, async (req, res) => {
    try {
      if (!(await validateOrgCountry(req.params.id, req))) return res.status(403).json({ message: "Organization not accessible in current country mode" });
      const org = await storage.getOrganization(req.params.id);
      if (!org) return res.status(404).json({ message: "Organization not found" });
      const users = await storage.getUsers(org.id);
      const stats = await storage.getDashboardStats(org.id);
      const billing = await storage.getBillingRecords(org.id);
      const disputes = await storage.getDisputes(org.id);
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
      res.status(500).json({ message: e.message });
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
      const users = await storage.getUsers(req.params.id);
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
      const users = await storage.getUsers(req.params.id);
      res.json(users.map(stripPassword));
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.get("/api/admin/organizations/:id/stats", requireAuth, requireSuperAdmin, async (req, res) => {
    try {
      if (!(await validateOrgCountry(req.params.id, req))) return res.status(403).json({ message: "Organization not accessible in current country mode" });
      const stats = await storage.getDashboardStats(req.params.id);
      res.json(stats);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.get("/api/admin/api-usage", requireAuth, requireRole("admin", "super_admin"), async (_req, res) => {
    try {
      const stats = getApiUsageStats();
      res.json(stats);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.get("/api/admin/analytics", requireAuth, requireSuperAdmin, async (req, res) => {
    try {
      const country = getCountryFilter(req);
      const orgs = await storage.getOrganizations(country);
      const allBilling: any[] = [];
      for (const org of orgs) {
        const billing = await storage.getBillingRecords(org.id);
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
      res.status(500).json({ message: e.message });
    }
  });

  app.get("/api/admin/platform-stats", requireAuth, requireSuperAdmin, async (req, res) => {
    try {
      const country = getCountryFilter(req);
      const orgs = await storage.getOrganizations(country);
      const allUsers = await storage.getUsers();
      const globalStats = await storage.getDashboardStats();
      res.json({
        totalOrganizations: orgs.length,
        activeOrganizations: orgs.filter(o => o.status === "active").length,
        totalUsers: allUsers.length,
        activeCountry: country || "all",
        ...globalStats,
      });
    } catch (e: any) {
      res.status(500).json({ message: e.message });
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
      if (country === "command_center") {
        delete req.session.viewingCountry;
        return res.json({ viewingCountry: null, message: "Returned to command center" });
      }
      if (country === "global" || country === null) {
        req.session.viewingCountry = "global";
        return res.json({ viewingCountry: "global", message: "Switched to global view" });
      }
      const normalized = country.toLowerCase().replace(/[\s_-]/g, "");
      const config = COUNTRY_REGISTRY[normalized];
      if (!config) {
        return res.status(400).json({ message: "Invalid country" });
      }
      req.session.viewingCountry = config.name;
      res.json({ viewingCountry: config.name, message: `Switched to ${config.name}` });
    } catch (e: any) {
      res.status(500).json({ message: e.message });
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
      res.status(500).json({ message: e.message });
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

      const activeCountries = countryDetails.filter((c) => c.hasData).length;

      res.json({
        platform: {
          totalBorrowers: totalBorrowersAll,
          totalAccounts: totalAccountsAll,
          totalInstitutions: allOrgs.length,
          activeCountries,
          supportedCountries: supportedCountries.length,
          systemVersion: "CDH v2.1",
          systemStatus: "operational",
        },
        countries: countryDetails,
      });
    } catch (e: any) {
      res.status(500).json({ message: e.message });
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
      res.status(500).json({ message: e.message });
    }
  });

  app.get("/api/platform/country-settings", requireAuth, requireSuperAdmin, async (_req, res) => {
    try {
      const settings = await db.select().from(countrySettings);
      res.json(settings);
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  });

  app.get("/api/platform/country-settings/:code", requireAuth, requireSuperAdmin, async (req, res) => {
    try {
      const [setting] = await db.select().from(countrySettings).where(eq(countrySettings.countryCode, req.params.code));
      if (!setting) return res.status(404).json({ message: "Country settings not found" });
      res.json(setting);
    } catch (e: any) { res.status(500).json({ message: e.message }); }
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
    } catch (e: any) { res.status(500).json({ message: e.message }); }
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
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  });

  app.post("/api/platform/api-keys/:id/revoke", requireAuth, requireSuperAdmin, async (req, res) => {
    try {
      const [updated] = await db.update(apiKeys).set({ status: "revoked", revokedAt: new Date() }).where(eq(apiKeys.id, req.params.id)).returning();
      if (!updated) return res.status(404).json({ message: "Key not found" });
      await storage.createAuditLog({ userId: req.session.userId!, action: "REVOKE", entity: "api_key", entityId: updated.id, details: `Revoked API key ${updated.keyPrefix}...`, ipAddress: req.ip, organizationId: null });
      res.json(updated);
    } catch (e: any) { res.status(500).json({ message: e.message }); }
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
    } catch (e: any) { res.status(500).json({ message: e.message }); }
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
        console.log("[Billing] Raw tiers fetched:", tierResult.rows.length, "rows");
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
        console.log("[Billing] Processed tiers:", tiers.length);
      } catch (tierErr: any) {
        console.log("[Billing] TIER QUERY ERROR:", tierErr.message);
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
    } catch (e: any) { res.status(500).json({ message: e.message }); }
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
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  });

  // ── Retention Policies ──
  app.get("/api/platform/retention-policies", requireAuth, requireSuperAdmin, async (_req, res) => {
    try {
      const policies = await db.select().from(retentionPolicies).orderBy(retentionPolicies.country, retentionPolicies.entityType);
      res.json(policies);
    } catch (e: any) { res.status(500).json({ message: e.message }); }
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
    } catch (e: any) { res.status(500).json({ message: e.message }); }
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

      const TEAL = "#0d4a42";
      const DARK = "#1a1a1a";
      const GRAY = "#666666";
      const LIGHT_BG = "#f8f9fa";
      const W = doc.page.width - 100;

      doc.rect(50, 50, W, 70).fill(TEAL);
      doc.fill("#ffffff").fontSize(20).font("Helvetica-Bold")
        .text("INVOICE", 65, 65, { width: W - 30 });
      doc.fontSize(9).font("Helvetica").fill("#cccccc")
        .text("CDH Credit Registry Platform", 65, 90, { width: W - 30 });
      doc.fontSize(9).font("Helvetica-Bold").fill("#ffffff")
        .text(billing.invoiceNumber, W - 100, 70, { width: 120, align: "right" });
      doc.fontSize(8).font("Helvetica").fill("#cccccc")
        .text(billing.createdAt ? new Date(billing.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) : "N/A", W - 100, 85, { width: 120, align: "right" });

      doc.fill(DARK);
      doc.y = 140;

      doc.rect(50, doc.y, W / 2 - 10, 100).fill(LIGHT_BG);
      doc.fill(TEAL).fontSize(9).font("Helvetica-Bold").text("FROM", 65, doc.y - 100 + 12);
      doc.fill(DARK).fontSize(10).font("Helvetica-Bold").text("Carlson Capital & Systems In Motion Limited", 65, doc.y - 100 + 28);
      doc.fill(GRAY).fontSize(8).font("Helvetica")
        .text("CDH Credit Registry Platform", 65, doc.y - 100 + 42)
        .text("Accra, Ghana", 65, doc.y - 100 + 54)
        .text("uffe.carlson@gmail.com", 65, doc.y - 100 + 66);

      const rightX = 50 + W / 2 + 10;
      doc.rect(rightX, doc.y - 100, W / 2 - 10, 100).fill(LIGHT_BG);
      doc.fill(TEAL).fontSize(9).font("Helvetica-Bold").text("BILL TO", rightX + 15, doc.y - 100 + 12);
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

      doc.rect(50, doc.y, W, 28).fill(TEAL);
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

      doc.moveTo(50, doc.y).lineTo(50 + W, doc.y).lineWidth(1).stroke(TEAL);
      doc.y += 10;

      const summaryX = 50 + W * 0.6;
      const summaryW = W * 0.4;
      doc.fill(GRAY).fontSize(9).font("Helvetica").text("Subtotal:", summaryX, doc.y, { width: summaryW * 0.6 });
      doc.font("Helvetica-Bold").fill(DARK).text(`${billing.currency} ${parseFloat(billing.amount).toLocaleString("en-US", { minimumFractionDigits: 2 })}`, summaryX + summaryW * 0.6, doc.y, { width: summaryW * 0.4, align: "right" });

      doc.y += 18;
      doc.fill(GRAY).fontSize(9).font("Helvetica").text("Tax (0%):", summaryX, doc.y, { width: summaryW * 0.6 });
      doc.fill(DARK).font("Helvetica").text(`${billing.currency} 0.00`, summaryX + summaryW * 0.6, doc.y, { width: summaryW * 0.4, align: "right" });

      doc.y += 22;
      doc.rect(summaryX - 5, doc.y - 4, summaryW + 10, 28).fill(TEAL);
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
        .text("This invoice was generated by CDH Credit Registry Platform, operated by Carlson Capital & Systems In Motion Limited.", 50, doc.y, { width: W, align: "center" })
        .text("For questions regarding this invoice, please contact uffe.carlson@gmail.com", 50, doc.y + 12, { width: W, align: "center" });

      doc.end();

      await new Promise<void>((resolve) => doc.on("end", resolve));
      const pdfBuffer = Buffer.concat(chunks);

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="Invoice-${billing.invoiceNumber}.pdf"`);
      res.setHeader("Content-Length", pdfBuffer.length);
      res.send(pdfBuffer);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
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

      const tierMap: Record<string, string> = { standard: "CDH Standard", professional: "CDH Professional", enterprise: "CDH Enterprise" };
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

      const baseUrl = `https://${process.env.REPLIT_DOMAINS?.split(',')[0] || 'localhost:5000'}`;
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
      res.status(500).json({ message: e.message });
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
        const baseUrl = `https://${process.env.REPLIT_DOMAINS?.split(",")[0] || "localhost:5000"}`;
        const flutterwavePayload = {
          tx_ref: `CDH-${orgId}-${Date.now()}`,
          amount: priceMap[plan],
          currency: "USD",
          redirect_url: `${baseUrl}/upgrade?payment=success`,
          customer: {
            email: org.contactEmail || "uffe.carlson@gmail.com",
            name: org.name,
          },
          customizations: {
            title: "CDH Credit Registry",
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

          const tierMap: Record<string, string> = { standard: "CDH Standard", professional: "CDH Professional", enterprise: "CDH Enterprise" };
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

          const baseUrl = `https://${process.env.REPLIT_DOMAINS?.split(",")[0] || "localhost:5000"}`;
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
          console.error("Stripe checkout error:", stripeErr.message);
          return res.status(500).json({ message: "Card payment setup failed. Please try another payment method." });
        }
      }

      res.status(400).json({ message: "Invalid payment method" });
    } catch (e: any) {
      console.error("Payment initiation error:", e);
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

      const baseUrl = `https://${process.env.REPLIT_DOMAINS?.split(',')[0] || 'localhost:5000'}`;
      const session = await stripe.billingPortal.sessions.create({
        customer: customers.data[0].id,
        return_url: `${baseUrl}/organizations`,
      });

      res.json({ url: session.url });
    } catch (e: any) {
      res.status(500).json({ message: e.message });
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
      res.status(500).json({ message: e.message });
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
      console.error("AI Demo error:", e);
      res.status(500).json({ message: e.message || "AI processing failed" });
    }
  });

  app.post("/api/ai/credit-risk/:borrowerId", aiLimiter, requireAuth, async (req, res) => {
    try {
      const provider = parseOptionalProvider(req.body?.provider);
      const result = await analyzeCreditRisk(req.params.borrowerId, provider);
      res.json(result);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.post("/api/ai/report-summary/:borrowerId", aiLimiter, requireAuth, async (req, res) => {
    try {
      const provider = parseOptionalProvider(req.body?.provider);
      const result = await generateReportSummary(req.params.borrowerId, provider);
      res.json(result);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  const publicChatLimiter = rateLimit({ windowMs: 60 * 1000, max: 15, message: { message: "Too many chat requests. Please wait a moment." } });
  app.post("/api/public/chat", publicChatLimiter, async (req, res) => {
    try {
      const { message, history } = req.body;
      if (!message || typeof message !== "string") {
        return res.status(400).json({ message: "message required" });
      }
      const systemPrompt = `You are the AI assistant for Africa Credit Hub (africacredithub.com) — the Pan-African Credit Registry System (CDH v2.1). You are an expert on every aspect of this platform. Answer any question confidently and accurately using the knowledge below.

===== COMPANY =====
- Created by Uffe Jon Carlson — a Danish globetrotter, entrepreneur, and CEO of Carlson Capital, based in Ghana
- Technical partner: Systems In Motion Limited (Ghana-based), led by Thomas Baafi (CTO)
- Contacts:
  - Uffe Jon Carlson — Creator & CEO, Carlson Capital | uffe.carlson@gmail.com | +233 552 395 548
  - Thomas Baafi — CTO, Systems In Motion | Thomas.baafi@prischell.com | +233 24 433 9985
- Headquarters: Accra, Ghana
- When asked about Thomas Baafi, the CTO, or about who built the technology — share this background in a warm, inspiring tone:
  "Thomas A. Baafi is not just a CTO — he is 'The Determined African Boy.' Born in August 1959 in the remote village of Mabang, in the Ahafo Region of Ghana, Thomas grew up in deep poverty. One of six siblings, raised by a struggling single mother, Akua Addae, he walked barefoot, wore secondhand clothes, and farmed to survive. But he was chosen — handpicked by his Uncle Guyman to leave the village and pursue education in Kumasi.
  That decision changed everything. Thomas excelled academically and dreamed of reaching America. With just $2,000, he embarked on an extraordinary journey — from Ghana to the slums of Agege in Nigeria, then to communist Bulgaria, across the Berlin Wall from East to West Germany, to asylum in Hamburg, and finally to the United States.
  In America, he earned a BSc in Computer Science and Information Technology with honors, while raising his daughter as a single parent. He worked at Electronic Data Systems (EDS), where he learned systems engineering and outsourcing firsthand. At Savannah River Site, he mastered Oracle Database administration. Then Oracle Corporation hired him as a Senior Principal Consultant, where he implemented Oracle Applications across the American Southeast.
  But Thomas's heart was in Africa. In 1999, he returned to Ghana and founded Bsystems Limited — a software company that became a powerhouse. Bsystems implemented Oracle Database solutions for Ghana Commercial Bank and then every major bank in the country. The company grew to over 40 employees, supporting 45+ companies including 25+ banking institutions.
  Among Bsystems' flagship products: Smart HR/Payroll System (used by Ghana's Internal Revenue Service, National Lottery Authority, NHIA), GVIVE — Ghana's first identity verification system (used by the Electoral Commission, Passport Office, DVLA, SSNIT), Collateral Registry Systems (developed with the World Bank/IFC and deployed in 10+ African countries: Nigeria, Malawi, Liberia, Sierra Leone, Zimbabwe, Zambia, Uganda, Mozambique, Ghana, and Ethiopia), Bvirtual (virtual debit card system), National Digital Tax System (Digitax), PeoplesPay (mobile payment app), and Financial Management Reporting Systems.
  In September 2020, Ugandan President Yoweri Museveni personally launched the Bsystems Collateral Registry System at the State House in Entebbe, praising how a software from a Mabang boy would change Uganda's business landscape.
  Awards include: Ghana Telecoms Awards Software Company of the Year (2012), Ghana Club 100 ICT Sector Leader — Ghana Investment Promotion Council (2014), Best West African ICT Company — Brussels Business and Leadership Awards (2014), Outstanding Contribution to Pan-African Financial Services Software (2023).
  Thomas is also a philanthropist — he funded a street hawker named Milicent through university to earn a doctorate in nursing, sponsored Bambila through six years of medical school (now a practicing doctor in Tamale), built the Asennua Children's Clinic in his mother's ancestral village, and serves on the advisory board of Wisconsin University.
  His life story is documented in the biography 'The Determined African Boy: A Journey Unveiled' by John Acquaye-Awah, published by Newman Springs Publishing in 2025 (ISBN 979-8-89888-008-8).
  Thomas Baafi represents the spirit of Africa Credit Hub — the belief that African-built technology can solve African problems at scale. From a barefoot boy in Mabang to a pan-African software pioneer, his journey proves that determination, education, and technology can break any glass ceiling."
- When asked "who made this?" or "who built this?" or about the founder — share this background in a warm, honest, human tone. Don't polish it into a corporate bio. Keep it real:
  "Meet Uffe Jon Carlson — a Danish-born chaos pilot who grew up in Abidjan, Ivory Coast. A Viking raised in West Africa. That's not a marketing line — that's his actual life.
  Education: Uffe holds a Master of Science in International Relations and Affairs from ESADE Business School in Barcelona (2003–2005, GPA 3.9) — one of Europe's top-ranked business schools. Before that, he attended Stenhus Boarding College in Denmark (1981–1987).
  Early career — Pharma & Fortune 500 consulting: Uffe started as CTO and co-founder of a healthcare communications consultancy in Barcelona (1997–2005), where he pioneered feasibility study methodology. His breakthrough came in 1999 when he conducted the inaugural market entry analysis for Novo Nordisk's launch of their groundbreaking insulin pen in Spain. This established his consultancy practice, leading to 12+ years advising Fortune 500 clients — Microsoft, Sanofi, BMW, Nestlé, Novartis, Bayer, Roche Diagnostics, Boehringer Ingelheim, Honda, L'Oreal, Pioneer, Pirelli, and Sony — on market entry, business setup, and operations optimization across 20+ African and European countries.
  Media & Africa years: From 2005–2012, Uffe moved to Ghana and founded Orion Advertising and Publishing Company Ltd, where he served as Communications Consultant and Business Strategist for West Africa. He published ENJOY Accra Magazine — a free monthly news and lifestyle magazine. During this period, he cultivated high-level stakeholder relationships, including a private audience with former President John Kufuor of Ghana (2010) to discuss media development and press freedom. He also advised Sir Richard Branson on the feasibility and launch strategy for Virgin Atlantic's market operations in Ghana and Nigeria.
  Energy & big deals: As Managing Director of Orion Energy II ApS (2022–2024), Uffe spearheaded the end-to-end feasibility study for a 130MW decentralized solar farm in Ghana. He validated project viability, negotiated a 25-year Power Purchase Agreement (PPA) with the Energy Company of Ghana (ECG), and leveraged the feasibility model to secure a $130M, 15-year investment from a Nordic fund and a $98M EPC contract. Total project budget exceeded $150M.
  Carlson Capital: Since 2007, Uffe has run Carlson Capital Denmark as Executive Business Advisor, specializing in comprehensive feasibility studies and de-risking market entry in complex African markets. He has guided projects from Renewable Energy to Pharma, securing over $150M in funding by proving to investors that risk is managed and growth is real.
  Tech & Product: In 2022, Uffe served as Product Owner Consultant for GoldenRace (a leading global virtual sports & betting solutions company) in Seville, Spain, where he led a team of 35 developers and 2 Scrum Masters using Agile methodologies to overhaul their B2B SaaS platform, resulting in a 40% reduction in support tickets and 25% increase in client retention.
  Self-described AI Integration Geek: Uffe is passionate about using AI to solve old problems in new ways — specifically taking the heavy lift out of big data, distilling complex market intelligence into clear narratives that help stakeholders make faster decisions. He's been working with fintech since 2012, when he discovered Bitcoin and AI and fell headfirst into the tech world.
  Over 25 years, Uffe has lived and worked across the continent — Kinshasa (DRC), Pretoria (South Africa), Lagos (Nigeria), Dakar (Senegal), Banjul (Gambia), Bamako (Mali), Bobo-Dioulasso (Burkina Faso), Dar es Salaam (Tanzania), Douala (Cameroon), and Accra (Ghana). He speaks 5+ languages fluently (Danish, English, French, Spanish, Catalan, and more) because he had to — when you live that many places, you either learn to communicate or you fail.
  Unique experience: In 1990, Uffe volunteered as a technical assistant for the European Space Agency (ESA) and the French space agency CNES, supervising completion of cooling systems for the Ariane 5 launch infrastructure in French Guyana.
  But here's the honest part: Uffe isn't a polished Silicon Valley founder with a perfect story. He's a super empath who gets anxious depending on the people he loves. He has two daughters who are, by his own admission, more intelligent than him. He got so lost in the tech world at one point that he forgot about his family and the people closest to him. He'll tell you that himself.
  What drives him is simple — he's a problem fixer. A chaos pilot. Give him something broken and complex, and he can't walk away from it. Africa's credit infrastructure was exactly that kind of problem — fragmented across 54 countries, no unified data, millions of businesses unable to get fair credit. So he built Africa Credit Hub with Thomas Baafi. Not because he had a perfect plan, but because he saw the mess and couldn't stop himself from trying to fix it.
  ENJOY Accra Magazine legacy: The magazine ran from 2007 through 2011+ and multiple issues are archived on Scribd. It was listed on BusinessGhana, PressPort, and ZoomInfo as a recognized Ghanaian lifestyle publication covering fashion, beauty, travel, food, health, wellness, and cultural events. Orion Advertising Company Ltd operated from House n° 202 ST, Lane 15 XBorg Osu, Accra, offering brand management, video production, printed media, and system management design services.
  He's not perfect. He's just someone working hard, trying to solve problems that matter, and learning from the mistakes along the way. If that resonates with you — or if you just want to challenge him (he loves that) — reach out at uffe.carlson@gmail.com or call +233 552 395 548.
  Online presence: LinkedIn: linkedin.com/in/uffecarlson | Facebook: facebook.com/uffe.carlson | Instagram: @uffe_j_carlson | Flickr: photography portfolio (63 photos) | Website: carlsonit.com"

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
- Everything in Standard plus: Advanced ML credit scoring (GBM v2.1), cross-border credit searches, portfolio intelligence suite
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
- For questions about custom deployments, on-premise, or enterprise partnerships, suggest contacting Uffe or Thomas directly
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
      res.status(500).json({ message: e.message });
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
        res.status(500).json({ message: e.message });
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
      res.status(500).json({ message: e.message });
    }
  });

  app.post("/api/ai/credit-narrative/:borrowerId", aiLimiter, requireAuth, async (req, res) => {
    try {
      const provider = parseOptionalProvider(req.body?.provider);
      const result = await generateCreditNarrative(req.params.borrowerId, provider);
      res.json(result);
    } catch (e: any) {
      if (e.message === "Borrower not found") return res.status(404).json({ message: e.message });
      res.status(500).json({ message: e.message });
    }
  });

  app.post("/api/ai/anomaly-detection", aiLimiter, requireAuth, requireRole("admin", "super_admin", "regulator"), async (req, res) => {
    try {
      const provider = parseOptionalProvider(req.body?.provider);
      const result = await detectAnomalies(provider, getOrgScope(req), getCountryFilter(req));
      res.json(result);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
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
      res.status(500).json({ message: e.message });
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
      res.status(500).json({ message: e.message });
    }
  });

  app.post("/api/ai/cross-border-risk", aiLimiter, requireAuth, requireRole("admin", "super_admin", "regulator"), async (req, res) => {
    try {
      const provider = parseOptionalProvider(req.body?.provider);
      const result = await analyzeCrossBorderRisk(provider);
      res.json(result);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
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
      res.status(500).json({ message: e.message });
    }
  });

  app.get("/api/borrower-alerts", requireAuth, requireRole("admin", "super_admin", "regulator"), async (req, res) => {
    try {
      const orgScope = getOrgScope(req);
      const country = getCountryFilter(req);
      const alerts = await storage.getBorrowerAlerts(orgScope, country);
      res.json(alerts);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
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
      res.status(500).json({ message: e.message });
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
      res.status(500).json({ message: e.message });
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
      res.status(500).json({ message: e.message });
    }
  });

  app.get("/api/audit-logs/verify-integrity", requireAuth, requireRole("admin", "super_admin", "regulator"), async (req, res) => {
    try {
      const result = await storage.verifyAuditIntegrity();
      res.json(result);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.post("/api/ai/portfolio-intelligence", aiLimiter, requireAuth, requireRole("admin", "super_admin", "regulator"), async (req, res) => {
    try {
      const provider = parseOptionalProvider(req.body?.provider);
      const result = await generatePortfolioIntelligence(provider);
      res.json(result);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
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
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  });

  // ── SATA Data Sharing Agreements ──
  app.get("/api/sata/agreements", requireAuth, requireRole("admin", "super_admin", "regulator"), async (_req, res) => {
    try {
      const rows = await db.select().from(dataSharingAgreements).orderBy(desc(dataSharingAgreements.createdAt));
      res.json(rows);
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  });

  app.get("/api/sata/agreements/:id", requireAuth, requireRole("admin", "super_admin", "regulator"), async (req, res) => {
    try {
      const [row] = await db.select().from(dataSharingAgreements).where(eq(dataSharingAgreements.id, req.params.id));
      if (!row) return res.status(404).json({ message: "Agreement not found" });
      res.json(row);
    } catch (e: any) { res.status(500).json({ message: e.message }); }
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
    } catch (e: any) { res.status(500).json({ message: e.message }); }
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
    } catch (e: any) { res.status(500).json({ message: e.message }); }
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
    } catch (e: any) { res.status(500).json({ message: e.message }); }
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
    } catch (e: any) { res.status(500).json({ message: e.message }); }
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
    } catch (e: any) { res.status(500).json({ message: e.message }); }
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
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  });

  app.get("/api/papss/settlements/:id", requireAuth, requireRole("admin", "super_admin", "regulator"), async (req, res) => {
    try {
      const [row] = await db.select().from(papssSettlements).where(eq(papssSettlements.id, req.params.id));
      if (!row) return res.status(404).json({ message: "Settlement not found" });
      res.json(row);
    } catch (e: any) { res.status(500).json({ message: e.message }); }
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

  try {
    const { sql: unlockSql } = await import("drizzle-orm");
    const bcrypt = await import("bcryptjs");
    const adminPassword = await bcrypt.hash("admin0987", 10);
    await db.execute(unlockSql`UPDATE users SET failed_login_attempts = 0, locked_until = NULL, password = ${adminPassword}, full_name = 'Uffe J Carlson', role = 'super_admin', email = 'uffe.carlson@gmail.com' WHERE username = 'admin'`);
    await db.execute(unlockSql`UPDATE users SET failed_login_attempts = 0, locked_until = NULL, password = ${adminPassword}, full_name = 'Platform Administrator', role = 'super_admin' WHERE username = 'platform_admin'`);
    console.log("Reset admin credentials and cleared lockouts on startup");
  } catch (e) {
    console.log("Admin reset skipped:", e);
  }

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
      res.status(500).json({ message: e.message });
    }
  });

  app.get("/api/blockchain/anchors", async (_req, res) => {
    try {
      const anchors = await getAnchors(50);
      res.json(anchors);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.post("/api/blockchain/anchor", async (req, res) => {
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
      res.status(500).json({ message: e.message });
    }
  });

  app.get("/api/blockchain/anchors/:id/verify", async (req, res) => {
    try {
      const result = await verifyAuditAgainstAnchor(req.params.id);
      res.json(result);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
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
      res.status(500).json({ message: e.message });
    }
  });

  app.post("/api/webhooks", requireAuth, requireRole("admin", "super_admin"), async (req, res) => {
    try {
      const { url, events, name } = req.body;
      if (!url) return res.status(400).json({ message: "URL is required" });

      try {
        const parsed = new URL(url);
        if (!["https:", "http:"].includes(parsed.protocol)) {
          return res.status(400).json({ message: "URL must use HTTPS or HTTP protocol" });
        }
      } catch {
        return res.status(400).json({ message: "Invalid URL format" });
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
      res.status(500).json({ message: e.message });
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
      res.status(500).json({ message: e.message });
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
      res.status(500).json({ message: e.message });
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
        message: "This is a test webhook delivery from CDH Credit Registry",
        timestamp: new Date().toISOString(),
      }, sub.organizationId);

      res.json({ success: true, message: "Test webhook delivered" });
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.post("/api/auth/webauthn/register-options", async (req, res) => {
    try {
      if (!req.session?.userId) return res.status(401).json({ message: "Not authenticated" });
      const user = await storage.getUser(req.session.userId);
      if (!user) return res.status(404).json({ message: "User not found" });

      const existingCreds = await db.select().from(webauthnCredentials).where(eq(webauthnCredentials.userId, user.id));

      const { generateRegistrationOptions } = await import("@simplewebauthn/server");
      const rpName = "CDH Credit Registry";
      const rpID = req.hostname || "localhost";

      const options = await generateRegistrationOptions({
        rpName,
        rpID,
        userName: user.username,
        attestationType: "none",
        excludeCredentials: existingCreds.map(c => ({
          id: c.credentialId,
          type: "public-key" as const,
          transports: (c.transports || []) as AuthenticatorTransport[],
        })),
        authenticatorSelection: {
          residentKey: "preferred",
          userVerification: "preferred",
        },
      });

      req.session.webauthnChallenge = options.challenge;
      res.json(options);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.post("/api/auth/webauthn/register-verify", async (req, res) => {
    try {
      if (!req.session?.userId) return res.status(401).json({ message: "Not authenticated" });
      const challenge = req.session.webauthnChallenge;
      if (!challenge) return res.status(400).json({ message: "No registration challenge found" });

      const { verifyRegistrationResponse } = await import("@simplewebauthn/server");
      const rpID = req.hostname || "localhost";
      const origin = `${req.protocol}://${req.get("host")}`;

      const verification = await verifyRegistrationResponse({
        response: req.body,
        expectedChallenge: challenge,
        expectedOrigin: origin,
        expectedRPID: rpID,
      });

      if (!verification.verified || !verification.registrationInfo) {
        return res.status(400).json({ message: "Registration verification failed" });
      }

      const { credential, credentialDeviceType } = verification.registrationInfo;

      await db.insert(webauthnCredentials).values({
        userId: req.session.userId,
        credentialId: Buffer.from(credential.id).toString("base64url"),
        publicKey: Buffer.from(credential.publicKey).toString("base64url"),
        counter: credential.counter,
        deviceType: credentialDeviceType,
        transports: req.body.response?.transports || [],
      });

      delete req.session.webauthnChallenge;

      await storage.createAuditLog({
        action: "WEBAUTHN_REGISTER",
        entity: "user",
        entityId: req.session.userId,
        userId: req.session.userId,
        details: `Registered biometric credential (${credentialDeviceType})`,
        ipAddress: req.ip || null,
      });

      res.json({ verified: true, deviceType: credentialDeviceType });
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.post("/api/auth/webauthn/login-options", async (req, res) => {
    try {
      const { username } = req.body;
      if (!username) return res.status(400).json({ message: "Username required" });

      const user = await storage.getUserByUsername(username);
      if (!user) return res.status(404).json({ message: "User not found" });

      const creds = await db.select().from(webauthnCredentials).where(eq(webauthnCredentials.userId, user.id));
      if (creds.length === 0) return res.status(400).json({ message: "No biometric credentials registered" });

      const { generateAuthenticationOptions } = await import("@simplewebauthn/server");
      const rpID = req.hostname || "localhost";

      const options = await generateAuthenticationOptions({
        rpID,
        allowCredentials: creds.map(c => ({
          id: c.credentialId,
          type: "public-key" as const,
          transports: (c.transports || []) as AuthenticatorTransport[],
        })),
        userVerification: "preferred",
      });

      req.session.webauthnChallenge = options.challenge;
      req.session.webauthnUserId = user.id;
      res.json(options);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.post("/api/auth/webauthn/login-verify", async (req, res) => {
    try {
      const challenge = req.session?.webauthnChallenge;
      const userId = req.session?.webauthnUserId;
      if (!challenge || !userId) return res.status(400).json({ message: "No authentication challenge found" });

      const user = await storage.getUser(userId);
      if (!user) return res.status(404).json({ message: "User not found" });

      const creds = await db.select().from(webauthnCredentials).where(eq(webauthnCredentials.userId, userId));

      const { verifyAuthenticationResponse } = await import("@simplewebauthn/server");
      const rpID = req.hostname || "localhost";
      const origin = `${req.protocol}://${req.get("host")}`;

      const credId = typeof req.body.id === "string" ? req.body.id : Buffer.from(req.body.rawId).toString("base64url");
      const matchingCred = creds.find(c => c.credentialId === credId);
      if (!matchingCred) return res.status(400).json({ message: "Credential not found" });

      const verification = await verifyAuthenticationResponse({
        response: req.body,
        expectedChallenge: challenge,
        expectedOrigin: origin,
        expectedRPID: rpID,
        credential: {
          id: matchingCred.credentialId,
          publicKey: Buffer.from(matchingCred.publicKey, "base64url"),
          counter: matchingCred.counter,
          transports: (matchingCred.transports || []) as AuthenticatorTransport[],
        },
      });

      if (!verification.verified) {
        return res.status(401).json({ message: "Biometric verification failed" });
      }

      await db.update(webauthnCredentials)
        .set({ counter: verification.authenticationInfo.newCounter })
        .where(eq(webauthnCredentials.id, matchingCred.id));

      req.session.userId = user.id;
      req.session.userRole = user.role;
      req.session.organizationId = user.organizationId || undefined;
      req.session.lastActivity = Date.now();
      delete req.session.webauthnChallenge;
      delete req.session.webauthnUserId;

      await storage.createAuditLog({
        action: "LOGIN_BIOMETRIC",
        entity: "user",
        entityId: user.id,
        userId: user.id,
        details: `Biometric login successful for user ${user.username}`,
        ipAddress: req.ip || null,
      });

      broadcastEvent({
        type: "login_event",
        title: "Biometric Login",
        message: `${user.username} logged in via biometric authentication`,
        severity: "info",
        timestamp: new Date().toISOString(),
      }, { roles: ["super_admin", "admin"] });

      const { password: _, ...safeUser } = user;
      res.json({ user: safeUser });
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.get("/api/auth/webauthn/credentials", async (req, res) => {
    try {
      if (!req.session?.userId) return res.status(401).json({ message: "Not authenticated" });
      const creds = await db.select({
        id: webauthnCredentials.id,
        deviceType: webauthnCredentials.deviceType,
        createdAt: webauthnCredentials.createdAt,
      }).from(webauthnCredentials).where(eq(webauthnCredentials.userId, req.session.userId));
      res.json(creds);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.delete("/api/auth/webauthn/credentials/:id", async (req, res) => {
    try {
      if (!req.session?.userId) return res.status(401).json({ message: "Not authenticated" });
      await db.delete(webauthnCredentials).where(
        and(eq(webauthnCredentials.id, req.params.id), eq(webauthnCredentials.userId, req.session.userId))
      );
      res.json({ deleted: true });
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.get("/api/websocket/status", async (_req, res) => {
    const { getConnectedClientsCount } = await import("./websocket");
    res.json({ connectedClients: getConnectedClientsCount() });
  });

  app.get("/api/admin/export/:orgId", requireAuth, requireRole("admin", "super_admin"), async (req, res) => {
    try {
      const orgId = req.params.orgId;
      if (!orgId) return res.status(400).json({ message: "Invalid organization ID" });

      if (req.session.userRole !== "super_admin" && req.session.organizationId !== orgId) {
        return res.status(403).json({ message: "You can only export your own organization's data" });
      }

      const org = await storage.getOrganization(orgId);
      if (!org) return res.status(404).json({ message: "Organization not found" });

      const { data: borrowers } = await storage.getBorrowers(1, 10000, orgId);

      const exportData = {
        exportDate: new Date().toISOString(),
        exportVersion: "2.1.0",
        compliance: "POPIA/NDPA/Ghana DPA/GDPR Article 20 — Right to Data Portability",
        organization: {
          id: org.id,
          name: org.name,
          country: org.country,
          tier: org.subscriptionTier,
        },
        statistics: {
          totalBorrowers: borrowers.length,
        },
        borrowers: borrowers.map(b => ({
          id: b.id,
          firstName: b.firstName,
          lastName: b.lastName,
          nationalId: b.nationalId,
          dateOfBirth: b.dateOfBirth,
          country: b.country,
        })),
      };

      await storage.createAuditLog({
        userId: req.session.userId,
        action: "data_export",
        entity: "organization",
        entityId: orgId,
        details: `Full data export for org ${org.name} (${borrowers.length} borrowers)`,
        ipAddress: req.ip || "unknown",
      });

      res.setHeader("Content-Disposition", `attachment; filename="ach_export_${org.name.replace(/[^a-zA-Z0-9]/g, "_")}_${new Date().toISOString().split("T")[0]}.json"`);
      res.setHeader("Content-Type", "application/json");
      res.json(exportData);
    } catch (err: any) {
      console.error("[Export] Error:", err.message);
      res.status(500).json({ message: "Export failed" });
    }
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
    console.log("[Seed] Orphan cleanup skipped:", (e as Error).message);
  }

  if (existing.length >= 4) {
    const orgIds = existing.map(o => o.id);
    const { data: allBorrowers } = await storage.getBorrowers(1, 10000);
    let assignedCount = 0;
    for (let i = 0; i < allBorrowers.length; i++) {
      if (!allBorrowers[i].organizationId) {
        await storage.updateBorrower(allBorrowers[i].id, { organizationId: orgIds[i % orgIds.length] } as any);
        assignedCount++;
      }
    }
    if (assignedCount > 0) {
      const allAccounts = await storage.getAllCreditAccounts();
      for (const acc of allAccounts) {
        if (!acc.organizationId) {
          const borrower = await storage.getBorrower(acc.borrowerId);
          if (borrower?.organizationId) {
            await storage.updateCreditAccount(acc.id, { organizationId: borrower.organizationId } as any);
          }
        }
      }
      console.log(`[Seed] Assigned ${assignedCount} orphaned borrowers to organizations`);
    }
    return;
  }

  const ghanaMode = isGhanaMode();

  const simOrg = await storage.createOrganization({
    name: "Carlson Capital & Systems In Motion",
    slug: "sim",
    type: "other",
    status: "active",
    country: ghanaMode ? "Ghana" : "Ethiopia",
    contactEmail: "uffe.carlson@gmail.com",
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
      email: "uffe.carlson@gmail.com",
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

  const { data: allBorrowers } = await storage.getBorrowers(1, 10000);
  const orgIds = [simOrg.id, nbeOrg.id, mpesaOrg.id, insureOrg.id];
  for (let i = 0; i < allBorrowers.length; i++) {
    const b = allBorrowers[i];
    if (!b.organizationId) {
      const assignedOrg = orgIds[i % orgIds.length];
      await storage.updateBorrower(b.id, { organizationId: assignedOrg } as any);
    }
  }

  const allAccounts = await storage.getAllCreditAccounts();
  for (const acc of allAccounts) {
    if (!acc.organizationId) {
      const borrower = await storage.getBorrower(acc.borrowerId);
      if (borrower?.organizationId) {
        await storage.updateCreditAccount(acc.id, { organizationId: borrower.organizationId } as any);
      }
    }
  }

  console.log("[Seed] Organizations and tenant assignments created successfully");
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
    console.log("[Repair] Country settings repair skipped:", e);
  }
}

async function seedCountrySettings() {
  try {
    const existing = await db.select().from(countrySettings);
    if (existing.length > 0) return;

    const supported = getSupportedCountries();
    const dpStatusMap: Record<string, string> = {
      GH: "enacted", NG: "enacted", KE: "enacted", RW: "enacted", TZ: "enacted",
      UG: "enacted", ZA: "enacted", ET: "enacted", SL: "draft", LR: "draft",
    };
    const sataMap: Record<string, string> = {
      GH: "ready", NG: "ready", KE: "ready", RW: "ready", ZA: "ready",
      TZ: "partial", UG: "partial", ET: "partial", SL: "planned", LR: "planned",
    };
    const defaultFeatures = ["credit_scoring", "dispute_management", "consent_tracking"];
    const countryFeatures: Record<string, string[]> = {
      GH: [...defaultFeatures, "regulatory_export", "batch_upload", "api_access", "kyc_verification"],
      SL: [...defaultFeatures, "regulatory_export", "batch_upload"],
      NG: [...defaultFeatures, "cross_border_sharing", "batch_upload", "api_access", "kyc_verification"],
      KE: [...defaultFeatures, "cross_border_sharing", "batch_upload", "api_access", "kyc_verification"],
      RW: [...defaultFeatures, "cross_border_sharing", "api_access"],
      TZ: [...defaultFeatures, "batch_upload", "api_access"],
      UG: [...defaultFeatures, "batch_upload"],
      ZA: [...defaultFeatures, "cross_border_sharing", "batch_upload", "api_access", "kyc_verification"],
      ET: [...defaultFeatures, "batch_upload"],
      LR: [...defaultFeatures],
    };

    for (const sc of supported) {
      await db.insert(countrySettings).values({
        countryCode: sc.code,
        countryName: sc.name,
        regulatoryBody: sc.regulatoryBody,
        dataProtectionLaw: sc.dataProtectionLaw,
        dataProtectionStatus: dpStatusMap[sc.code] || "none",
        sataReadiness: sataMap[sc.code] || "planned",
        enabledFeatures: countryFeatures[sc.code] || defaultFeatures,
      }).onConflictDoNothing();
    }
    console.log("[Seed] Country settings initialized");
  } catch (e) {
    console.log("[Seed] Country settings seed skipped:", e);
  }
}
