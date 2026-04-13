import crypto from "crypto";
import { Readable } from "stream";
import { db } from "./db";
import { eq, sql, and, lt, inArray } from "drizzle-orm";
import {
  borrowers, creditAccounts, creditInquiries, disputes,
  paymentHistory, guarantors, courtJudgments, dishonouredCheques,
  auditLogs, retentionPolicies, consumerAccounts, alternativeData,
  creditReportLogs,
} from "@shared/schema";
import type {
  Borrower, CreditAccount, CreditInquiry, Dispute,
  PaymentHistory, Guarantor, RetentionPolicy, AuditLog,
  CourtJudgment, DishonouredCheque,
} from "@shared/schema";
import { decryptBorrowerPII } from "./encryption";

const EXPORT_ALGORITHM = "aes-256-cbc";

export interface ExportEncryptionResult {
  encryptedData: Buffer;
  oneTimeKey: string;
  iv: string;
  sha256Hash: string;
  originalSizeBytes: number;
}

export interface FullPortabilityExport {
  exportDate: string;
  exportVersion: string;
  compliance: string;
  organization: {
    id: string;
    name: string;
    country: string | null;
    tier: string | null;
  };
  statistics: {
    totalBorrowers: number;
    totalAccounts: number;
    totalInquiries: number;
    totalDisputes: number;
    totalPaymentRecords: number;
    totalGuarantors: number;
  };
  borrowers: PortabilityBorrower[];
}

export interface PortabilityBorrower {
  id: string;
  firstName: string | null;
  lastName: string | null;
  companyName: string | null;
  type: string | null;
  nationalId: string | null;
  dateOfBirth: string | null;
  country: string | null;
  gender: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  city: string | null;
  region: string | null;
  creditAccounts: CreditAccount[];
  paymentHistory: PaymentHistory[];
  guarantors: Guarantor[];
  inquiries: CreditInquiry[];
  disputes: Dispute[];
  courtJudgments: CourtJudgment[];
  dishonouredCheques: DishonouredCheque[];
  auditTrail: Array<{ action: string; entity: string; details: string | null; createdAt: Date | null }>;
}

export interface ExportAuditEntry {
  exportType: string;
  format: string;
  recordCount: number;
  fileSizeBytes: number;
  sha256Hash: string;
  encrypted: boolean;
  requestedBy: string;
  ipAddress: string;
  organizationId?: string;
  country?: string;
}

export function encryptExportData(plaintext: string): ExportEncryptionResult & { ciphertextHash: string } {
  const oneTimeKey = crypto.randomBytes(32).toString("hex");
  const iv = crypto.randomBytes(16);
  const keyBuffer = Buffer.from(oneTimeKey, "hex");

  const cipher = crypto.createCipheriv(EXPORT_ALGORITHM, keyBuffer, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);

  const sha256Hash = crypto.createHash("sha256").update(plaintext).digest("hex");
  const ciphertextHash = crypto.createHash("sha256").update(encrypted).digest("hex");

  return {
    encryptedData: encrypted,
    oneTimeKey,
    iv: iv.toString("hex"),
    sha256Hash,
    ciphertextHash,
    originalSizeBytes: Buffer.byteLength(plaintext, "utf8"),
  };
}

export function generateExportHashBuffer(data: Buffer): string {
  return crypto.createHash("sha256").update(data).digest("hex");
}

export function decryptExportData(encryptedData: Buffer, oneTimeKey: string, iv: string): string {
  const keyBuffer = Buffer.from(oneTimeKey, "hex");
  const ivBuffer = Buffer.from(iv, "hex");
  const decipher = crypto.createDecipheriv(EXPORT_ALGORITHM, keyBuffer, ivBuffer);
  return Buffer.concat([decipher.update(encryptedData), decipher.final()]).toString("utf8");
}

export function generateExportHash(data: string): string {
  return crypto.createHash("sha256").update(data).digest("hex");
}

export function verifyExportIntegrity(data: string, expectedHash: string): boolean {
  const actualHash = crypto.createHash("sha256").update(data).digest("hex");
  return actualHash === expectedHash;
}

export async function streamPortabilityExport(
  organizationId: string,
  orgName: string,
  orgCountry: string | null,
  orgTier: string | null,
  res: import("express").Response,
  onProgress?: (processed: number, total: number) => void,
): Promise<{ totalRecords: number; sha256Hash: string }> {
  const hashStream = crypto.createHash("sha256");
  let totalRecords = 0;

  const write = (chunk: string) => {
    res.write(chunk);
    hashStream.update(chunk);
  };

  const allBorrowers = await db.select().from(borrowers)
    .where(eq(borrowers.organizationId, organizationId));
  const borrowerIds = allBorrowers.map(b => b.id);

  const header = JSON.stringify({
    exportDate: new Date().toISOString(),
    exportVersion: "3.0.0",
    compliance: "POPIA/NDPA/Ghana DPA/GDPR Article 20 — Right to Data Portability",
    organization: { id: organizationId, name: orgName, country: orgCountry, tier: orgTier },
  });
  write(header.slice(0, -1) + ',"borrowers":[');

  for (let idx = 0; idx < allBorrowers.length; idx++) {
    const b = allBorrowers[idx];
    const decrypted = decryptBorrowerPII(b as Record<string, unknown>);

    const [accts, inqs, disps, judgs, cheqs, audits] = await Promise.all([
      db.select().from(creditAccounts).where(eq(creditAccounts.borrowerId, b.id)),
      db.select().from(creditInquiries).where(eq(creditInquiries.borrowerId, b.id)),
      db.select().from(disputes).where(eq(disputes.borrowerId, b.id)),
      db.select().from(courtJudgments).where(eq(courtJudgments.borrowerId, b.id)),
      db.select().from(dishonouredCheques).where(eq(dishonouredCheques.borrowerId, b.id)),
      db.select().from(auditLogs).where(eq(auditLogs.entityId, b.id)),
    ]);

    const accountIds = accts.map(a => a.id);
    let payments: PaymentHistory[] = [];
    let guars: Guarantor[] = [];
    if (accountIds.length > 0) {
      [payments, guars] = await Promise.all([
        db.select().from(paymentHistory).where(inArray(paymentHistory.creditAccountId, accountIds)),
        db.select().from(guarantors).where(inArray(guarantors.creditAccountId, accountIds)),
      ]);
    }

    const borrowerObj: PortabilityBorrower = {
      id: b.id,
      firstName: decrypted.firstName || b.firstName,
      lastName: decrypted.lastName || b.lastName,
      companyName: b.companyName,
      type: b.type,
      nationalId: decrypted.nationalId || b.nationalId,
      dateOfBirth: decrypted.dateOfBirth || b.dateOfBirth,
      country: b.country,
      gender: b.gender,
      phone: b.phone,
      email: b.email,
      address: b.address,
      city: b.city,
      region: b.region,
      creditAccounts: accts,
      paymentHistory: payments,
      guarantors: guars,
      inquiries: inqs,
      disputes: disps,
      courtJudgments: judgs,
      dishonouredCheques: cheqs,
      auditTrail: audits.map(a => ({ action: a.action, entity: a.entity, details: a.details, createdAt: a.createdAt })),
    };

    if (idx > 0) write(",");
    write(JSON.stringify(borrowerObj));
    totalRecords += 1 + accts.length + payments.length + guars.length + inqs.length + disps.length + judgs.length + cheqs.length;

    if (onProgress) onProgress(idx + 1, allBorrowers.length);
  }

  write("]}");
  const sha256Hash = hashStream.digest("hex");
  return { totalRecords, sha256Hash };
}

export async function buildFullPortabilityExport(
  organizationId: string,
  orgName: string,
  orgCountry: string | null,
  orgTier: string | null
): Promise<FullPortabilityExport> {
  const allBorrowers = await db.select().from(borrowers)
    .where(eq(borrowers.organizationId, organizationId));

  const borrowerIds = allBorrowers.map(b => b.id);

  if (borrowerIds.length === 0) {
    return {
      exportDate: new Date().toISOString(),
      exportVersion: "3.0.0",
      compliance: "POPIA/NDPA/Ghana DPA/GDPR Article 20 — Right to Data Portability",
      organization: { id: organizationId, name: orgName, country: orgCountry, tier: orgTier },
      statistics: { totalBorrowers: 0, totalAccounts: 0, totalInquiries: 0, totalDisputes: 0, totalPaymentRecords: 0, totalGuarantors: 0 },
      borrowers: [],
    };
  }

  const batchSize = 500;
  const allAccounts: CreditAccount[] = [];
  const allInquiries: CreditInquiry[] = [];
  const allDisputes: Dispute[] = [];
  const allJudgments: CourtJudgment[] = [];
  const allCheques: DishonouredCheque[] = [];
  const allAuditEntries: AuditLog[] = [];

  for (let i = 0; i < borrowerIds.length; i += batchSize) {
    const batch = borrowerIds.slice(i, i + batchSize);
    const [accts, inqs, disps, judgs, cheqs, audits] = await Promise.all([
      db.select().from(creditAccounts).where(inArray(creditAccounts.borrowerId, batch)),
      db.select().from(creditInquiries).where(inArray(creditInquiries.borrowerId, batch)),
      db.select().from(disputes).where(inArray(disputes.borrowerId, batch)),
      db.select().from(courtJudgments).where(inArray(courtJudgments.borrowerId, batch)),
      db.select().from(dishonouredCheques).where(inArray(dishonouredCheques.borrowerId, batch)),
      db.select().from(auditLogs).where(inArray(auditLogs.entityId, batch)),
    ]);
    allAccounts.push(...accts);
    allInquiries.push(...inqs);
    allDisputes.push(...disps);
    allJudgments.push(...judgs);
    allCheques.push(...cheqs);
    allAuditEntries.push(...audits);
  }

  const accountIds = allAccounts.map(a => a.id);
  let allPayments: PaymentHistory[] = [];
  let allGuarantors: Guarantor[] = [];

  if (accountIds.length > 0) {
    for (let i = 0; i < accountIds.length; i += batchSize) {
      const batch = accountIds.slice(i, i + batchSize);
      const [payments, guars] = await Promise.all([
        db.select().from(paymentHistory).where(inArray(paymentHistory.creditAccountId, batch)),
        db.select().from(guarantors).where(inArray(guarantors.creditAccountId, batch)),
      ]);
      allPayments.push(...payments);
      allGuarantors.push(...guars);
    }
  }

  const accountsByBorrower = new Map<string, CreditAccount[]>();
  for (const a of allAccounts) { (accountsByBorrower.get(a.borrowerId) || (accountsByBorrower.set(a.borrowerId, []), accountsByBorrower.get(a.borrowerId)!)).push(a); }
  const inquiriesByBorrower = new Map<string, CreditInquiry[]>();
  for (const i of allInquiries) { (inquiriesByBorrower.get(i.borrowerId) || (inquiriesByBorrower.set(i.borrowerId, []), inquiriesByBorrower.get(i.borrowerId)!)).push(i); }
  const disputesByBorrower = new Map<string, Dispute[]>();
  for (const d of allDisputes) { (disputesByBorrower.get(d.borrowerId) || (disputesByBorrower.set(d.borrowerId, []), disputesByBorrower.get(d.borrowerId)!)).push(d); }
  const judgmentsByBorrower = new Map<string, CourtJudgment[]>();
  for (const j of allJudgments) { (judgmentsByBorrower.get(j.borrowerId) || (judgmentsByBorrower.set(j.borrowerId, []), judgmentsByBorrower.get(j.borrowerId)!)).push(j); }
  const chequesByBorrower = new Map<string, DishonouredCheque[]>();
  for (const c of allCheques) { (chequesByBorrower.get(c.borrowerId) || (chequesByBorrower.set(c.borrowerId, []), chequesByBorrower.get(c.borrowerId)!)).push(c); }
  const auditsByBorrower = new Map<string, AuditLog[]>();
  for (const a of allAuditEntries) { if (a.entityId) { (auditsByBorrower.get(a.entityId) || (auditsByBorrower.set(a.entityId, []), auditsByBorrower.get(a.entityId)!)).push(a); } }

  const paymentsByAccount = new Map<string, PaymentHistory[]>();
  for (const p of allPayments) { (paymentsByAccount.get(p.creditAccountId) || (paymentsByAccount.set(p.creditAccountId, []), paymentsByAccount.get(p.creditAccountId)!)).push(p); }
  const guarantorsByAccount = new Map<string, Guarantor[]>();
  for (const g of allGuarantors) { (guarantorsByAccount.get(g.creditAccountId) || (guarantorsByAccount.set(g.creditAccountId, []), guarantorsByAccount.get(g.creditAccountId)!)).push(g); }

  const exportBorrowers: PortabilityBorrower[] = allBorrowers.map(b => {
    const decrypted = decryptBorrowerPII(b as Record<string, unknown>);
    const bAccounts = accountsByBorrower.get(b.id) || [];
    const bPayments: PaymentHistory[] = [];
    const bGuarantors: Guarantor[] = [];
    for (const acct of bAccounts) {
      bPayments.push(...(paymentsByAccount.get(acct.id) || []));
      bGuarantors.push(...(guarantorsByAccount.get(acct.id) || []));
    }

    return {
      id: b.id,
      firstName: decrypted.firstName || b.firstName,
      lastName: decrypted.lastName || b.lastName,
      companyName: b.companyName,
      type: b.type,
      nationalId: decrypted.nationalId || b.nationalId,
      dateOfBirth: decrypted.dateOfBirth || b.dateOfBirth,
      country: b.country,
      gender: b.gender,
      phone: b.phone,
      email: b.email,
      address: b.address,
      city: b.city,
      region: b.region,
      creditAccounts: bAccounts,
      paymentHistory: bPayments,
      guarantors: bGuarantors,
      inquiries: inquiriesByBorrower.get(b.id) || [],
      disputes: disputesByBorrower.get(b.id) || [],
      courtJudgments: judgmentsByBorrower.get(b.id) || [],
      dishonouredCheques: chequesByBorrower.get(b.id) || [],
      auditTrail: (auditsByBorrower.get(b.id) || []).map(a => ({
        action: a.action, entity: a.entity, details: a.details, createdAt: a.createdAt,
      })),
    };
  });

  return {
    exportDate: new Date().toISOString(),
    exportVersion: "3.0.0",
    compliance: "POPIA/NDPA/Ghana DPA/GDPR Article 20 — Right to Data Portability",
    organization: { id: organizationId, name: orgName, country: orgCountry, tier: orgTier },
    statistics: {
      totalBorrowers: allBorrowers.length,
      totalAccounts: allAccounts.length,
      totalInquiries: allInquiries.length,
      totalDisputes: allDisputes.length,
      totalPaymentRecords: allPayments.length,
      totalGuarantors: allGuarantors.length,
    },
    borrowers: exportBorrowers,
  };
}

export async function buildConsumerDataExport(borrowerId: string): Promise<Record<string, any>> {
  const [borrower] = await db.select().from(borrowers).where(eq(borrowers.id, borrowerId)).limit(1);
  if (!borrower) throw new Error("Borrower not found");

  const decrypted = decryptBorrowerPII(borrower as Record<string, unknown>);
  const accounts = await db.select().from(creditAccounts).where(eq(creditAccounts.borrowerId, borrowerId));
  const accountIds = accounts.map(a => a.id);

  let payments: PaymentHistory[] = [];
  let guars: Guarantor[] = [];
  if (accountIds.length > 0) {
    [payments, guars] = await Promise.all([
      db.select().from(paymentHistory).where(inArray(paymentHistory.creditAccountId, accountIds)),
      db.select().from(guarantors).where(inArray(guarantors.creditAccountId, accountIds)),
    ]);
  }

  const [inquiries, borrowerDisputes, judgments, cheques] = await Promise.all([
    db.select().from(creditInquiries).where(eq(creditInquiries.borrowerId, borrowerId)),
    db.select().from(disputes).where(eq(disputes.borrowerId, borrowerId)),
    db.select().from(courtJudgments).where(eq(courtJudgments.borrowerId, borrowerId)),
    db.select().from(dishonouredCheques).where(eq(dishonouredCheques.borrowerId, borrowerId)),
  ]);

  let altData: any[] = [];
  try {
    altData = await db.select().from(alternativeData).where(sql`borrower_id::text = ${borrowerId}`);
  } catch (e: any) {
    console.warn("[Export] Alternative data query failed for borrower", borrowerId, e.message);
  }

  let reportLogs: Array<{ institution: string; purpose: string; serialNumber: string; createdAt: Date | null }> = [];
  try {
    reportLogs = await db.select({
      institution: creditReportLogs.institution,
      purpose: creditReportLogs.purpose,
      serialNumber: creditReportLogs.serialNumber,
      createdAt: creditReportLogs.createdAt,
    }).from(creditReportLogs).where(eq(creditReportLogs.borrowerId, borrowerId));
  } catch (e: any) {
    console.warn("[Export] Credit report logs query failed for borrower", borrowerId, e.message);
  }

  return {
    exportDate: new Date().toISOString(),
    exportVersion: "3.0.0",
    compliance: "POPIA/NDPA/Ghana DPA/GDPR Article 20 — Right to Data Portability",
    dataSubject: {
      firstName: decrypted.firstName || borrower.firstName,
      lastName: decrypted.lastName || borrower.lastName,
      nationalId: decrypted.nationalId || borrower.nationalId,
      dateOfBirth: decrypted.dateOfBirth || borrower.dateOfBirth,
      type: borrower.type,
      country: borrower.country,
      gender: borrower.gender,
      phone: borrower.phone,
      email: borrower.email,
      address: borrower.address,
      city: borrower.city,
      region: borrower.region,
    },
    creditAccounts: accounts.map(a => ({
      accountNumber: a.accountNumber,
      accountType: a.accountType,
      lenderInstitution: a.lenderInstitution,
      originalAmount: a.originalAmount,
      currentBalance: a.currentBalance,
      currency: a.currency,
      status: a.status,
      disbursementDate: a.disbursementDate,
      maturityDate: a.maturityDate,
      daysInArrears: a.daysInArrears,
      interestRate: a.interestRate,
    })),
    paymentHistory: payments.map(p => ({
      accountId: p.creditAccountId,
      period: p.period,
      amountDue: p.amountDue,
      amountPaid: p.amountPaid,
      status: p.status,
      daysLate: p.daysLate,
      createdAt: p.createdAt,
    })),
    guarantors: guars.map(g => ({
      guarantorNumber: g.guarantorNumber,
      natureOfGuarantor: g.natureOfGuarantor,
      companyName: g.companyName,
      surname: g.surname,
      firstName: g.firstName,
      nationalId: g.nationalId,
      gender: g.gender,
    })),
    inquiries: inquiries.map(i => ({
      institution: i.institution,
      purpose: i.purpose,
      date: i.createdAt,
    })),
    disputes: borrowerDisputes.map(d => ({
      disputeType: d.disputeType,
      status: d.status,
      description: d.description,
      resolution: d.resolution,
      country: d.country,
      filedAt: d.createdAt,
      resolvedAt: d.resolvedAt,
    })),
    courtJudgments: judgments.map(j => ({
      caseNumber: j.caseNumber,
      court: j.court,
      judgmentDate: j.judgmentDate,
      amount: j.amount,
      currency: j.currency,
    })),
    dishonouredCheques: cheques.map(c => ({
      chequeNumber: c.chequeNumber,
      amount: c.chequeAmount,
      currency: c.currency,
      dateBounced: c.dateBounced,
    })),
    alternativeData: altData.map(a => ({
      dataType: a.dataType,
      provider: a.provider,
      score: a.score,
    })),
    creditReportHistory: reportLogs.map(r => ({
      institution: r.institution,
      purpose: r.purpose,
      serialNumber: r.serialNumber,
      date: r.createdAt,
    })),
    statistics: {
      totalAccounts: accounts.length,
      totalPayments: payments.length,
      totalInquiries: inquiries.length,
      totalDisputes: borrowerDisputes.length,
      totalCreditReports: reportLogs.length,
    },
  };
}

export async function cascadeDeleteBorrower(borrowerId: string): Promise<{
  deletedAccounts: number;
  deletedPayments: number;
  deletedGuarantors: number;
  deletedInquiries: number;
  deletedDisputes: number;
  deletedJudgments: number;
  deletedCheques: number;
  deletedAlerts: number;
  deletedConsent: number;
  deletedReportLogs: number;
  deletedConsumerAccounts: number;
  deletedBorrower: boolean;
}> {
  const accounts = await db.select({ id: creditAccounts.id }).from(creditAccounts).where(eq(creditAccounts.borrowerId, borrowerId));
  const accountIds = accounts.map(a => a.id);

  let deletedPayments = 0;
  let deletedGuarantors = 0;

  if (accountIds.length > 0) {
    const payResult = await db.delete(paymentHistory).where(inArray(paymentHistory.creditAccountId, accountIds)).returning({ id: paymentHistory.id });
    deletedPayments = payResult.length;
    const guarResult = await db.delete(guarantors).where(inArray(guarantors.creditAccountId, accountIds)).returning({ id: guarantors.id });
    deletedGuarantors = guarResult.length;
  }

  const acctResult = await db.delete(creditAccounts).where(eq(creditAccounts.borrowerId, borrowerId)).returning({ id: creditAccounts.id });
  const inqResult = await db.delete(creditInquiries).where(eq(creditInquiries.borrowerId, borrowerId)).returning({ id: creditInquiries.id });
  const dispResult = await db.delete(disputes).where(eq(disputes.borrowerId, borrowerId)).returning({ id: disputes.id });
  const judgResult = await db.delete(courtJudgments).where(eq(courtJudgments.borrowerId, borrowerId)).returning({ id: courtJudgments.id });
  const cheqResult = await db.delete(dishonouredCheques).where(eq(dishonouredCheques.borrowerId, borrowerId)).returning({ id: dishonouredCheques.id });

  let deletedAlerts = 0;
  let deletedConsent = 0;
  let deletedReportLogs = 0;
  let deletedConsumerAccounts = 0;

  try { const r = await db.execute(sql`DELETE FROM borrower_alerts WHERE borrower_id = ${borrowerId}`); deletedAlerts = (r as any).rowCount || 0; } catch (e: any) { console.warn("[Erasure] borrower_alerts cleanup:", e.message); }
  try { const r = await db.execute(sql`DELETE FROM consent_records WHERE borrower_id = ${borrowerId}`); deletedConsent = (r as any).rowCount || 0; } catch (e: any) { console.warn("[Erasure] consent_records cleanup:", e.message); }
  try { const r = await db.execute(sql`DELETE FROM credit_report_logs WHERE borrower_id = ${borrowerId}`); deletedReportLogs = (r as any).rowCount || 0; } catch (e: any) { console.warn("[Erasure] credit_report_logs cleanup:", e.message); }

  const [bor] = await db.select().from(borrowers).where(eq(borrowers.id, borrowerId)).limit(1);
  if (bor?.nationalId) {
    try {
      const r = await db.delete(consumerAccounts).where(eq(consumerAccounts.nationalId, bor.nationalId)).returning({ id: consumerAccounts.id });
      deletedConsumerAccounts = r.length;
    } catch (e: any) { console.warn("[Erasure] consumer_accounts cleanup:", e.message); }
  }

  await db.delete(borrowers).where(eq(borrowers.id, borrowerId));

  return {
    deletedAccounts: acctResult.length,
    deletedPayments,
    deletedGuarantors,
    deletedInquiries: inqResult.length,
    deletedDisputes: dispResult.length,
    deletedJudgments: judgResult.length,
    deletedCheques: cheqResult.length,
    deletedAlerts,
    deletedConsent,
    deletedReportLogs,
    deletedConsumerAccounts,
    deletedBorrower: true,
  };
}

export async function scanRetentionPolicies(countryFilter?: string): Promise<{
  policiesEvaluated: number;
  recordsFlagged: number;
  recordsArchived: number;
  details: Array<{
    country: string;
    entityType: string;
    retentionYears: number;
    recordsAffected: number;
    action: string;
  }>;
}> {
  const conditions = [eq(retentionPolicies.isActive, true)];
  if (countryFilter) {
    conditions.push(eq(retentionPolicies.country, countryFilter));
  }
  const policies = await db.select().from(retentionPolicies).where(and(...conditions));

  let totalFlagged = 0;
  let totalArchived = 0;
  const details: Array<{ country: string; entityType: string; retentionYears: number; recordsAffected: number; action: string }> = [];

  for (const policy of policies) {
    const cutoffDate = new Date();
    cutoffDate.setFullYear(cutoffDate.getFullYear() - policy.retentionYears);

    let recordsAffected = 0;
    const action = policy.archiveAfterYears ? "archive" : "flag";

    try {
      if (policy.entityType === "credit_account" || policy.entityType === "credit_accounts") {
        const result = await db.execute(sql`
          SELECT COUNT(*) as count FROM credit_accounts ca
          JOIN borrowers b ON ca.borrower_id = b.id
          WHERE b.country = ${policy.country}
          AND ca.status IN ('closed', 'written_off', 'settled')
          AND ca.updated_at < ${cutoffDate}
        `);
        recordsAffected = parseInt((result.rows[0] as any)?.count || "0");
      } else if (policy.entityType === "borrower" || policy.entityType === "borrowers") {
        const result = await db.execute(sql`
          SELECT COUNT(*) as count FROM borrowers b
          WHERE b.country = ${policy.country}
          AND b.updated_at < ${cutoffDate}
          AND NOT EXISTS (SELECT 1 FROM credit_accounts ca WHERE ca.borrower_id = b.id AND ca.status IN ('active', 'current', 'delinquent'))
        `);
        recordsAffected = parseInt((result.rows[0] as any)?.count || "0");
      } else if (policy.entityType === "inquiry" || policy.entityType === "credit_inquiries") {
        const result = await db.execute(sql`
          SELECT COUNT(*) as count FROM credit_inquiries ci
          JOIN borrowers b ON ci.borrower_id = b.id
          WHERE b.country = ${policy.country}
          AND ci.created_at < ${cutoffDate}
        `);
        recordsAffected = parseInt((result.rows[0] as any)?.count || "0");
      } else if (policy.entityType === "audit_log" || policy.entityType === "audit_logs") {
        const result = await db.execute(sql`
          SELECT COUNT(*) as count FROM audit_logs
          WHERE created_at < ${cutoffDate}
        `);
        recordsAffected = parseInt((result.rows[0] as any)?.count || "0");
      } else if (policy.entityType === "dispute" || policy.entityType === "disputes") {
        const result = await db.execute(sql`
          SELECT COUNT(*) as count FROM disputes d
          WHERE d.country = ${policy.country}
          AND d.status IN ('resolved', 'closed', 'rejected')
          AND d.updated_at < ${cutoffDate}
        `);
        recordsAffected = parseInt((result.rows[0] as any)?.count || "0");
      } else if (policy.entityType === "consent_record" || policy.entityType === "consent_records") {
        const result = await db.execute(sql`
          SELECT COUNT(*) as count FROM consent_records cr
          JOIN borrowers b ON cr.borrower_id = b.id
          WHERE b.country = ${policy.country}
          AND cr.created_at < ${cutoffDate}
        `);
        recordsAffected = parseInt((result.rows[0] as any)?.count || "0");
      } else if (policy.entityType === "court_judgment" || policy.entityType === "court_judgments") {
        const result = await db.execute(sql`
          SELECT COUNT(*) as count FROM court_judgments cj
          JOIN borrowers b ON cj.borrower_id = b.id
          WHERE b.country = ${policy.country}
          AND cj.created_at < ${cutoffDate}
        `);
        recordsAffected = parseInt((result.rows[0] as any)?.count || "0");
      } else if (policy.entityType === "payment_history") {
        const result = await db.execute(sql`
          SELECT COUNT(*) as count FROM payment_history ph
          JOIN credit_accounts ca ON ph.credit_account_id = ca.id
          JOIN borrowers b ON ca.borrower_id = b.id
          WHERE b.country = ${policy.country}
          AND ph.created_at < ${cutoffDate}
        `);
        recordsAffected = parseInt((result.rows[0] as any)?.count || "0");
      }
    } catch (e: any) {
      console.warn(`[Retention] Policy scan failed for ${policy.entityType} in ${policy.country}:`, e.message);
    }

    if (recordsAffected > 0) {
      if (action === "archive") {
        totalArchived += recordsAffected;
      } else {
        totalFlagged += recordsAffected;
      }
    }

    details.push({
      country: policy.country,
      entityType: policy.entityType,
      retentionYears: policy.retentionYears,
      recordsAffected,
      action,
    });
  }

  return {
    policiesEvaluated: policies.length,
    recordsFlagged: totalFlagged,
    recordsArchived: totalArchived,
    details,
  };
}
