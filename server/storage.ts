import { eq, desc, like, or, sql, count, ilike } from "drizzle-orm";
import crypto from "crypto";
import { db } from "./db";
import {
  users, borrowers, creditAccounts, creditInquiries, auditLogs, pendingApprovals, disputes, notifications,
  courtJudgments, consentRecords, paymentHistory, institutions, billingRecords, creditReportLogs, apiKeys,
  exchangeRates, retentionPolicies, apiConfigurations,
  type User, type InsertUser,
  type Borrower, type InsertBorrower,
  type CreditAccount, type InsertCreditAccount,
  type CreditInquiry, type InsertCreditInquiry,
  type AuditLog, type InsertAuditLog,
  type PendingApproval, type InsertPendingApproval,
  type Dispute, type InsertDispute,
  type Notification, type InsertNotification,
  type CourtJudgment, type InsertCourtJudgment,
  type ConsentRecord, type InsertConsentRecord,
  type PaymentHistory, type InsertPaymentHistory,
  type Institution, type InsertInstitution,
  type BillingRecord, type InsertBillingRecord,
  type CreditReportLog, type InsertCreditReportLog,
  type ApiKey, type InsertApiKey,
  type ExchangeRate, type InsertExchangeRate,
  type RetentionPolicy, type InsertRetentionPolicy,
  type ApiConfiguration, type InsertApiConfiguration,
} from "@shared/schema";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getUsers(): Promise<User[]>;
  updateUser(id: string, data: Partial<InsertUser>): Promise<User | undefined>;
  deleteUser(id: string): Promise<boolean>;
  incrementFailedAttempts(userId: string): Promise<void>;
  resetFailedAttempts(userId: string): Promise<void>;
  lockUser(userId: string, until: Date): Promise<void>;
  updateLastLogin(userId: string): Promise<void>;

  getBorrower(id: string): Promise<Borrower | undefined>;
  getBorrowers(page?: number, limit?: number): Promise<{ data: Borrower[]; total: number }>;
  searchBorrowers(query: string): Promise<Borrower[]>;
  createBorrower(borrower: InsertBorrower): Promise<Borrower>;
  updateBorrower(id: string, data: Partial<InsertBorrower>): Promise<Borrower | undefined>;

  getCreditAccount(id: string): Promise<CreditAccount | undefined>;
  getCreditAccountsByBorrower(borrowerId: string): Promise<CreditAccount[]>;
  getAllCreditAccounts(): Promise<CreditAccount[]>;
  createCreditAccount(account: InsertCreditAccount): Promise<CreditAccount>;
  updateCreditAccount(id: string, data: Partial<InsertCreditAccount>): Promise<CreditAccount | undefined>;

  getCreditInquiriesByBorrower(borrowerId: string): Promise<CreditInquiry[]>;
  getAllCreditInquiries(): Promise<CreditInquiry[]>;
  createCreditInquiry(inquiry: InsertCreditInquiry): Promise<CreditInquiry>;

  getAuditLogs(): Promise<AuditLog[]>;
  createAuditLog(log: InsertAuditLog): Promise<AuditLog>;
  verifyAuditIntegrity(): Promise<{ valid: boolean; totalChecked: number; brokenAt?: string }>;
  fuzzyMatchBorrowers(params: { firstName?: string; lastName?: string; nationalId?: string; companyName?: string }): Promise<Array<any>>;

  getPendingApprovals(): Promise<PendingApproval[]>;
  getPendingApproval(id: string): Promise<PendingApproval | undefined>;
  createPendingApproval(approval: InsertPendingApproval): Promise<PendingApproval>;
  updateApprovalStatus(id: string, status: string, reviewedBy: string, reviewNotes?: string): Promise<PendingApproval | undefined>;

  getDisputes(): Promise<Dispute[]>;
  getDispute(id: string): Promise<Dispute | undefined>;
  createDispute(dispute: InsertDispute): Promise<Dispute>;
  updateDispute(id: string, data: Partial<{ status: string; resolution: string }>): Promise<Dispute | undefined>;

  getNotifications(userId: string): Promise<Notification[]>;
  getUnreadNotificationCount(userId: string): Promise<number>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationRead(id: string): Promise<void>;
  markAllNotificationsRead(userId: string): Promise<void>;
  updatePasswordChangedAt(userId: string): Promise<void>;
  getRelatedBorrowers(borrowerId: string): Promise<Borrower[]>;
  getUsersByRole(...roles: string[]): Promise<User[]>;

  getCourtJudgmentsByBorrower(borrowerId: string): Promise<CourtJudgment[]>;
  getAllCourtJudgments(): Promise<CourtJudgment[]>;
  createCourtJudgment(judgment: InsertCourtJudgment): Promise<CourtJudgment>;

  getConsentRecordsByBorrower(borrowerId: string): Promise<ConsentRecord[]>;
  getAllConsentRecords(): Promise<ConsentRecord[]>;
  createConsentRecord(record: InsertConsentRecord): Promise<ConsentRecord>;
  revokeConsent(id: string): Promise<ConsentRecord | undefined>;

  getPaymentHistoryByAccount(creditAccountId: string): Promise<PaymentHistory[]>;
  createPaymentHistory(entry: InsertPaymentHistory): Promise<PaymentHistory>;

  getInstitutions(page?: number, limit?: number): Promise<{ data: Institution[]; total: number }>;
  getInstitution(id: string): Promise<Institution | undefined>;
  createInstitution(inst: InsertInstitution): Promise<Institution>;
  updateInstitution(id: string, data: Partial<InsertInstitution>): Promise<Institution | undefined>;
  approveInstitution(id: string, approvedBy: string): Promise<Institution | undefined>;

  getBillingRecords(): Promise<BillingRecord[]>;
  getBillingRecordsByInstitution(institutionName: string): Promise<BillingRecord[]>;
  createBillingRecord(record: InsertBillingRecord): Promise<BillingRecord>;

  getCreditReportLogs(): Promise<CreditReportLog[]>;
  getCreditReportLogsByBorrower(borrowerId: string): Promise<CreditReportLog[]>;
  createCreditReportLog(log: InsertCreditReportLog): Promise<CreditReportLog>;

  getDashboardStats(): Promise<{
    totalBorrowers: number;
    totalAccounts: number;
    totalInquiries: number;
    totalOutstanding: string;
    delinquentAccounts: number;
    defaultAccounts: number;
    pendingApprovalCount: number;
    openDisputeCount: number;
  }>;
  getDashboardDetails(type: string): Promise<Record<string, any>>;

  getApiKeysByInstitution(institutionId: string): Promise<ApiKey[]>;
  getAllApiKeys(): Promise<ApiKey[]>;
  getApiKeyByHash(keyHash: string): Promise<ApiKey | undefined>;
  createApiKey(key: InsertApiKey): Promise<ApiKey>;
  revokeApiKey(id: string): Promise<ApiKey | undefined>;
  updateApiKeyLastUsed(id: string): Promise<void>;
  getInstitutionByName(name: string): Promise<Institution | undefined>;

  getExchangeRates(): Promise<ExchangeRate[]>;
  createExchangeRate(data: InsertExchangeRate): Promise<ExchangeRate>;
  updateExchangeRate(id: string, data: Partial<InsertExchangeRate>): Promise<ExchangeRate | undefined>;
  deleteExchangeRate(id: string): Promise<boolean>;
  convertCurrency(amount: number, fromCurrency: string, toCurrency: string): Promise<{ convertedAmount: number; rate: number } | null>;

  getRetentionPolicies(): Promise<RetentionPolicy[]>;
  createRetentionPolicy(data: InsertRetentionPolicy): Promise<RetentionPolicy>;
  updateRetentionPolicy(id: string, data: Partial<InsertRetentionPolicy>): Promise<RetentionPolicy | undefined>;
  deleteRetentionPolicy(id: string): Promise<boolean>;

  getApiConfigurations(): Promise<ApiConfiguration[]>;
  getApiConfiguration(id: string): Promise<ApiConfiguration | undefined>;
  createApiConfiguration(data: InsertApiConfiguration): Promise<ApiConfiguration>;
  updateApiConfiguration(id: string, data: Partial<InsertApiConfiguration>): Promise<ApiConfiguration | undefined>;
  deleteApiConfiguration(id: string): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(user: InsertUser): Promise<User> {
    const [created] = await db.insert(users).values(user).returning();
    return created;
  }

  async getUsers(): Promise<User[]> {
    return db.select().from(users).orderBy(desc(users.createdAt));
  }

  async updateUser(id: string, data: Partial<InsertUser>): Promise<User | undefined> {
    const [updated] = await db.update(users).set(data).where(eq(users.id, id)).returning();
    return updated;
  }

  async deleteUser(id: string): Promise<boolean> {
    const [deleted] = await db.delete(users).where(eq(users.id, id)).returning();
    return !!deleted;
  }

  async incrementFailedAttempts(userId: string): Promise<void> {
    await db.update(users).set({
      failedLoginAttempts: sql`COALESCE(${users.failedLoginAttempts}, 0) + 1`,
    }).where(eq(users.id, userId));
  }

  async resetFailedAttempts(userId: string): Promise<void> {
    await db.update(users).set({ failedLoginAttempts: 0, lockedUntil: null }).where(eq(users.id, userId));
  }

  async lockUser(userId: string, until: Date): Promise<void> {
    await db.update(users).set({ lockedUntil: until }).where(eq(users.id, userId));
  }

  async updateLastLogin(userId: string): Promise<void> {
    await db.update(users).set({ lastLogin: new Date() }).where(eq(users.id, userId));
  }

  async getBorrower(id: string): Promise<Borrower | undefined> {
    const [borrower] = await db.select().from(borrowers).where(eq(borrowers.id, id));
    return borrower;
  }

  async getBorrowers(page: number = 1, limit: number = 50): Promise<{ data: Borrower[]; total: number }> {
    const safeLimit = Math.min(limit, 200);
    const offset = (page - 1) * safeLimit;
    const [totalResult] = await db.select({ value: count() }).from(borrowers);
    const data = await db.select().from(borrowers).orderBy(desc(borrowers.createdAt)).limit(safeLimit).offset(offset);
    return { data, total: totalResult.value };
  }

  async searchBorrowers(query: string): Promise<Borrower[]> {
    const searchPattern = `%${query}%`;
    return db.select().from(borrowers).where(
      or(
        ilike(borrowers.firstName, searchPattern),
        ilike(borrowers.lastName, searchPattern),
        ilike(borrowers.companyName, searchPattern),
        ilike(borrowers.nationalId, searchPattern),
        ilike(borrowers.tinNumber, searchPattern),
        ilike(borrowers.phone, searchPattern),
        ilike(borrowers.email, searchPattern),
        ilike(borrowers.city, searchPattern),
        ilike(borrowers.region, searchPattern),
        ilike(borrowers.address, searchPattern),
        ilike(borrowers.sector, searchPattern),
        ilike(borrowers.occupation, searchPattern),
        ilike(borrowers.employerName, searchPattern),
        ilike(borrowers.businessRegNumber, searchPattern),
        ilike(borrowers.country, searchPattern),
        ilike(borrowers.passportNumber, searchPattern),
      )
    ).orderBy(desc(borrowers.createdAt)).limit(200);
  }

  async createBorrower(borrower: InsertBorrower): Promise<Borrower> {
    const [created] = await db.insert(borrowers).values(borrower).returning();
    return created;
  }

  async updateBorrower(id: string, data: Partial<InsertBorrower>): Promise<Borrower | undefined> {
    const [updated] = await db.update(borrowers).set({ ...data, updatedAt: new Date() }).where(eq(borrowers.id, id)).returning();
    return updated;
  }

  async getCreditAccount(id: string): Promise<CreditAccount | undefined> {
    const [account] = await db.select().from(creditAccounts).where(eq(creditAccounts.id, id));
    return account;
  }

  async getCreditAccountsByBorrower(borrowerId: string): Promise<CreditAccount[]> {
    return db.select().from(creditAccounts).where(eq(creditAccounts.borrowerId, borrowerId)).orderBy(desc(creditAccounts.createdAt));
  }

  async getAllCreditAccounts(): Promise<CreditAccount[]> {
    return db.select().from(creditAccounts).orderBy(desc(creditAccounts.createdAt)).limit(200);
  }

  async createCreditAccount(account: InsertCreditAccount): Promise<CreditAccount> {
    const [created] = await db.insert(creditAccounts).values(account).returning();
    return created;
  }

  async updateCreditAccount(id: string, data: Partial<InsertCreditAccount>): Promise<CreditAccount | undefined> {
    const [updated] = await db.update(creditAccounts).set({ ...data, updatedAt: new Date() }).where(eq(creditAccounts.id, id)).returning();
    return updated;
  }

  async getCreditInquiriesByBorrower(borrowerId: string): Promise<CreditInquiry[]> {
    return db.select().from(creditInquiries).where(eq(creditInquiries.borrowerId, borrowerId)).orderBy(desc(creditInquiries.createdAt));
  }

  async getAllCreditInquiries(): Promise<CreditInquiry[]> {
    return db.select().from(creditInquiries).orderBy(desc(creditInquiries.createdAt)).limit(200);
  }

  async createCreditInquiry(inquiry: InsertCreditInquiry): Promise<CreditInquiry> {
    const [created] = await db.insert(creditInquiries).values(inquiry).returning();
    return created;
  }

  async getAuditLogs(): Promise<AuditLog[]> {
    return db.select().from(auditLogs).orderBy(desc(auditLogs.createdAt)).limit(200);
  }

  async createAuditLog(log: InsertAuditLog): Promise<AuditLog> {
    const [lastLog] = await db.select({ currentHash: auditLogs.currentHash })
      .from(auditLogs).orderBy(desc(auditLogs.createdAt)).limit(1);
    const previousHash = lastLog?.currentHash || "GENESIS";
    const timestamp = new Date().toISOString();
    const payload = `${previousHash}|${log.action}|${log.entity}|${log.details || ""}|${timestamp}`;
    const currentHash = crypto.createHash("sha256").update(payload).digest("hex");
    const [created] = await db.insert(auditLogs).values({
      ...log,
      previousHash,
      currentHash,
    }).returning();
    return created;
  }

  async verifyAuditIntegrity(): Promise<{ valid: boolean; totalChecked: number; brokenAt?: string }> {
    const allLogs = await db.select().from(auditLogs).orderBy(auditLogs.createdAt);
    let totalChecked = 0;
    for (let i = 0; i < allLogs.length; i++) {
      const log = allLogs[i];
      if (!log.currentHash) continue;
      totalChecked++;
      const expectedPrev = i === 0 ? "GENESIS" : (allLogs[i - 1].currentHash || "GENESIS");
      if (log.previousHash !== expectedPrev) {
        return { valid: false, totalChecked, brokenAt: log.id };
      }
    }
    return { valid: true, totalChecked };
  }

  async fuzzyMatchBorrowers(params: { firstName?: string; lastName?: string; nationalId?: string; companyName?: string }): Promise<Array<any>> {
    const conditions: any[] = [];
    if (params.firstName) {
      conditions.push(sql`similarity(${borrowers.firstName}, ${params.firstName}) > 0.2`);
      conditions.push(ilike(borrowers.firstName, `%${params.firstName}%`));
    }
    if (params.lastName) {
      conditions.push(sql`similarity(${borrowers.lastName}, ${params.lastName}) > 0.2`);
      conditions.push(ilike(borrowers.lastName, `%${params.lastName}%`));
    }
    if (params.nationalId) {
      conditions.push(sql`similarity(${borrowers.nationalId}, ${params.nationalId}) > 0.3`);
      conditions.push(ilike(borrowers.nationalId, `%${params.nationalId}%`));
    }
    if (params.companyName) {
      conditions.push(sql`similarity(COALESCE(${borrowers.companyName}, ''), ${params.companyName}) > 0.2`);
      conditions.push(ilike(borrowers.companyName, `%${params.companyName}%`));
    }
    if (conditions.length === 0) return [];
    const results = await db.select({
      id: borrowers.id,
      type: borrowers.type,
      firstName: borrowers.firstName,
      lastName: borrowers.lastName,
      companyName: borrowers.companyName,
      nationalId: borrowers.nationalId,
      phone: borrowers.phone,
      email: borrowers.email,
      similarity: sql<number>`GREATEST(
        ${params.firstName ? sql`similarity(COALESCE(${borrowers.firstName}, ''), ${params.firstName})` : sql`0`},
        ${params.lastName ? sql`similarity(COALESCE(${borrowers.lastName}, ''), ${params.lastName})` : sql`0`},
        ${params.nationalId ? sql`similarity(COALESCE(${borrowers.nationalId}, ''), ${params.nationalId})` : sql`0`},
        ${params.companyName ? sql`similarity(COALESCE(${borrowers.companyName}, ''), ${params.companyName})` : sql`0`}
      )`,
    }).from(borrowers).where(or(...conditions))
      .orderBy(sql`GREATEST(
        ${params.firstName ? sql`similarity(COALESCE(${borrowers.firstName}, ''), ${params.firstName})` : sql`0`},
        ${params.lastName ? sql`similarity(COALESCE(${borrowers.lastName}, ''), ${params.lastName})` : sql`0`},
        ${params.nationalId ? sql`similarity(COALESCE(${borrowers.nationalId}, ''), ${params.nationalId})` : sql`0`},
        ${params.companyName ? sql`similarity(COALESCE(${borrowers.companyName}, ''), ${params.companyName})` : sql`0`}
      ) DESC`).limit(20);
    return results;
  }

  async getPendingApprovals(): Promise<PendingApproval[]> {
    return db.select().from(pendingApprovals).orderBy(desc(pendingApprovals.createdAt));
  }

  async getPendingApproval(id: string): Promise<PendingApproval | undefined> {
    const [approval] = await db.select().from(pendingApprovals).where(eq(pendingApprovals.id, id));
    return approval;
  }

  async createPendingApproval(approval: InsertPendingApproval): Promise<PendingApproval> {
    const [created] = await db.insert(pendingApprovals).values(approval).returning();
    return created;
  }

  async updateApprovalStatus(id: string, status: string, reviewedBy: string, reviewNotes?: string): Promise<PendingApproval | undefined> {
    const [updated] = await db.update(pendingApprovals).set({
      status: status as any,
      reviewedBy,
      reviewNotes: reviewNotes || null,
      reviewedAt: new Date(),
    }).where(eq(pendingApprovals.id, id)).returning();
    return updated;
  }

  async getDisputes(): Promise<Dispute[]> {
    return db.select().from(disputes).orderBy(desc(disputes.createdAt)).limit(200);
  }

  async getDispute(id: string): Promise<Dispute | undefined> {
    const [dispute] = await db.select().from(disputes).where(eq(disputes.id, id));
    return dispute;
  }

  async createDispute(dispute: InsertDispute): Promise<Dispute> {
    const correctionType = dispute.correctionType || "non_financial";
    const slaDays = correctionType === "financial" ? 2 : 5;
    const slaDeadline = new Date();
    slaDeadline.setDate(slaDeadline.getDate() + slaDays);
    const [created] = await db.insert(disputes).values({
      ...dispute,
      correctionType,
      slaDeadline,
    }).returning();
    return created;
  }

  async updateDispute(id: string, data: Partial<{ status: string; resolution: string }>): Promise<Dispute | undefined> {
    const updateData: any = { ...data, updatedAt: new Date() };
    if (data.status === "resolved" || data.status === "rejected") {
      updateData.resolvedAt = new Date();
    }
    const [updated] = await db.update(disputes).set(updateData).where(eq(disputes.id, id)).returning();
    return updated;
  }

  async getNotifications(userId: string): Promise<Notification[]> {
    return db.select().from(notifications)
      .where(or(eq(notifications.userId, userId), sql`${notifications.userId} IS NULL`))
      .orderBy(desc(notifications.createdAt))
      .limit(50);
  }

  async getUnreadNotificationCount(userId: string): Promise<number> {
    const [result] = await db.select({ value: count() }).from(notifications)
      .where(
        sql`(${notifications.userId} = ${userId} OR ${notifications.userId} IS NULL) AND ${notifications.isRead} = false`
      );
    return result.value;
  }

  async createNotification(notification: InsertNotification): Promise<Notification> {
    const [created] = await db.insert(notifications).values(notification).returning();
    return created;
  }

  async markNotificationRead(id: string): Promise<void> {
    await db.update(notifications).set({ isRead: true }).where(eq(notifications.id, id));
  }

  async markAllNotificationsRead(userId: string): Promise<void> {
    await db.update(notifications).set({ isRead: true })
      .where(or(eq(notifications.userId, userId), sql`${notifications.userId} IS NULL`));
  }

  async updatePasswordChangedAt(userId: string): Promise<void> {
    await db.update(users).set({ passwordChangedAt: new Date(), mustChangePassword: false }).where(eq(users.id, userId));
  }

  async getRelatedBorrowers(borrowerId: string): Promise<Borrower[]> {
    const childLinks = await db.select().from(borrowers).where(eq(borrowers.relatedBorrowerId, borrowerId));
    const self = await this.getBorrower(borrowerId);
    if (self?.relatedBorrowerId) {
      const parent = await this.getBorrower(self.relatedBorrowerId);
      if (parent) {
        const alreadyIncluded = childLinks.some(b => b.id === parent.id);
        if (!alreadyIncluded) {
          childLinks.push(parent);
        }
      }
    }
    return childLinks;
  }

  async getUsersByRole(...roles: string[]): Promise<User[]> {
    if (roles.length === 0) return [];
    return db.select().from(users).where(
      sql`${users.role} IN (${sql.join(roles.map(r => sql`${r}`), sql`, `)})`
    );
  }

  async getCourtJudgmentsByBorrower(borrowerId: string): Promise<CourtJudgment[]> {
    return db.select().from(courtJudgments).where(eq(courtJudgments.borrowerId, borrowerId)).orderBy(desc(courtJudgments.createdAt));
  }

  async getAllCourtJudgments(): Promise<CourtJudgment[]> {
    return db.select().from(courtJudgments).orderBy(desc(courtJudgments.createdAt)).limit(200);
  }

  async createCourtJudgment(judgment: InsertCourtJudgment): Promise<CourtJudgment> {
    const [created] = await db.insert(courtJudgments).values(judgment).returning();
    return created;
  }

  async getConsentRecordsByBorrower(borrowerId: string): Promise<ConsentRecord[]> {
    return db.select().from(consentRecords).where(eq(consentRecords.borrowerId, borrowerId)).orderBy(desc(consentRecords.createdAt));
  }

  async getAllConsentRecords(): Promise<ConsentRecord[]> {
    return db.select().from(consentRecords).orderBy(desc(consentRecords.createdAt)).limit(200);
  }

  async createConsentRecord(record: InsertConsentRecord): Promise<ConsentRecord> {
    const [created] = await db.insert(consentRecords).values(record).returning();
    return created;
  }

  async revokeConsent(id: string): Promise<ConsentRecord | undefined> {
    const [updated] = await db.update(consentRecords).set({
      status: "revoked" as any,
      revokedAt: new Date(),
    }).where(eq(consentRecords.id, id)).returning();
    return updated;
  }

  async getPaymentHistoryByAccount(creditAccountId: string): Promise<PaymentHistory[]> {
    return db.select().from(paymentHistory)
      .where(eq(paymentHistory.creditAccountId, creditAccountId))
      .orderBy(desc(paymentHistory.period))
      .limit(12);
  }

  async createPaymentHistory(entry: InsertPaymentHistory): Promise<PaymentHistory> {
    const [created] = await db.insert(paymentHistory).values(entry).returning();
    return created;
  }

  async getInstitutions(page: number = 1, limit: number = 50): Promise<{ data: Institution[]; total: number }> {
    const safeLimit = Math.min(limit, 200);
    const offset = (page - 1) * safeLimit;
    const [totalResult] = await db.select({ value: count() }).from(institutions);
    const data = await db.select().from(institutions).orderBy(desc(institutions.createdAt)).limit(safeLimit).offset(offset);
    return { data, total: totalResult.value };
  }

  async getInstitution(id: string): Promise<Institution | undefined> {
    const [inst] = await db.select().from(institutions).where(eq(institutions.id, id));
    return inst;
  }

  async createInstitution(inst: InsertInstitution): Promise<Institution> {
    const [created] = await db.insert(institutions).values(inst).returning();
    return created;
  }

  async updateInstitution(id: string, data: Partial<InsertInstitution>): Promise<Institution | undefined> {
    const [updated] = await db.update(institutions).set(data).where(eq(institutions.id, id)).returning();
    return updated;
  }

  async approveInstitution(id: string, approvedBy: string): Promise<Institution | undefined> {
    const [updated] = await db.update(institutions).set({
      status: "active" as any,
      approvedBy,
      approvedAt: new Date(),
    }).where(eq(institutions.id, id)).returning();
    return updated;
  }

  async getBillingRecords(): Promise<BillingRecord[]> {
    return db.select().from(billingRecords).orderBy(desc(billingRecords.createdAt));
  }

  async getBillingRecordsByInstitution(institutionName: string): Promise<BillingRecord[]> {
    return db.select().from(billingRecords).where(eq(billingRecords.institutionName, institutionName)).orderBy(desc(billingRecords.createdAt));
  }

  async createBillingRecord(record: InsertBillingRecord): Promise<BillingRecord> {
    const [created] = await db.insert(billingRecords).values(record).returning();
    return created;
  }

  async getCreditReportLogs(): Promise<CreditReportLog[]> {
    return db.select().from(creditReportLogs).orderBy(desc(creditReportLogs.createdAt)).limit(200);
  }

  async getCreditReportLogsByBorrower(borrowerId: string): Promise<CreditReportLog[]> {
    return db.select().from(creditReportLogs).where(eq(creditReportLogs.borrowerId, borrowerId)).orderBy(desc(creditReportLogs.createdAt));
  }

  async createCreditReportLog(log: InsertCreditReportLog): Promise<CreditReportLog> {
    const [created] = await db.insert(creditReportLogs).values(log).returning();
    return created;
  }

  async getDashboardDetails(type: string) {
    switch (type) {
      case "borrowers": {
        const byCountry = await db.select({
          city: sql<string>`COALESCE(${borrowers.city}, 'Unknown')`,
          count: count(),
        }).from(borrowers).groupBy(sql`COALESCE(${borrowers.city}, 'Unknown')`).orderBy(desc(count())).limit(10);
        const byType = await db.select({
          type: borrowers.type,
          count: count(),
        }).from(borrowers).groupBy(borrowers.type);
        const [pepCount] = await db.select({ value: count() }).from(borrowers).where(eq(borrowers.isPep, true));
        const recent = await db.select().from(borrowers).orderBy(desc(borrowers.createdAt)).limit(10);
        return { byCity: byCountry, byType, pepCount: pepCount.value, recent };
      }
      case "accounts": {
        const byStatus = await db.select({
          status: creditAccounts.status,
          count: count(),
        }).from(creditAccounts).groupBy(creditAccounts.status);
        const byType = await db.select({
          type: creditAccounts.accountType,
          count: count(),
        }).from(creditAccounts).groupBy(creditAccounts.accountType).orderBy(desc(count())).limit(10);
        const byInstitution = await db.select({
          institution: creditAccounts.lenderInstitution,
          count: count(),
          total: sql<string>`COALESCE(SUM(${creditAccounts.currentBalance}::numeric), 0)::text`,
        }).from(creditAccounts).groupBy(creditAccounts.lenderInstitution).orderBy(desc(count())).limit(10);
        return { byStatus, byType, byInstitution };
      }
      case "outstanding": {
        const byCurrency = await db.select({
          currency: creditAccounts.currency,
          total: sql<string>`COALESCE(SUM(${creditAccounts.currentBalance}::numeric), 0)::text`,
          count: count(),
        }).from(creditAccounts).where(
          or(eq(creditAccounts.status, "current"), eq(creditAccounts.status, "delinquent"), eq(creditAccounts.status, "restructured"))
        ).groupBy(creditAccounts.currency).orderBy(desc(sql`SUM(${creditAccounts.currentBalance}::numeric)`));
        const byInstitution = await db.select({
          institution: creditAccounts.lenderInstitution,
          total: sql<string>`COALESCE(SUM(${creditAccounts.currentBalance}::numeric), 0)::text`,
          count: count(),
        }).from(creditAccounts).where(
          or(eq(creditAccounts.status, "current"), eq(creditAccounts.status, "delinquent"), eq(creditAccounts.status, "restructured"))
        ).groupBy(creditAccounts.lenderInstitution).orderBy(desc(sql`SUM(${creditAccounts.currentBalance}::numeric)`)).limit(10);
        return { byCurrency, byInstitution };
      }
      case "delinquent": {
        const accounts = await db.select().from(creditAccounts).where(eq(creditAccounts.status, "delinquent")).orderBy(desc(creditAccounts.daysInArrears)).limit(20);
        const byInstitution = await db.select({
          institution: creditAccounts.lenderInstitution,
          count: count(),
          totalOverdue: sql<string>`COALESCE(SUM(${creditAccounts.currentBalance}::numeric), 0)::text`,
        }).from(creditAccounts).where(eq(creditAccounts.status, "delinquent")).groupBy(creditAccounts.lenderInstitution).orderBy(desc(count())).limit(10);
        return { accounts, byInstitution };
      }
      case "defaults": {
        const accounts = await db.select().from(creditAccounts).where(eq(creditAccounts.status, "default")).orderBy(desc(creditAccounts.currentBalance)).limit(20);
        const byInstitution = await db.select({
          institution: creditAccounts.lenderInstitution,
          count: count(),
          totalDefaulted: sql<string>`COALESCE(SUM(${creditAccounts.currentBalance}::numeric), 0)::text`,
        }).from(creditAccounts).where(eq(creditAccounts.status, "default")).groupBy(creditAccounts.lenderInstitution).orderBy(desc(count())).limit(10);
        return { accounts, byInstitution };
      }
      case "inquiries": {
        const byPurpose = await db.select({
          purpose: creditInquiries.purpose,
          count: count(),
        }).from(creditInquiries).groupBy(creditInquiries.purpose);
        const byInstitution = await db.select({
          institution: creditInquiries.institution,
          count: count(),
        }).from(creditInquiries).groupBy(creditInquiries.institution).orderBy(desc(count())).limit(10);
        const recent = await db.select().from(creditInquiries).orderBy(desc(creditInquiries.createdAt)).limit(15);
        return { byPurpose, byInstitution, recent };
      }
      case "approvals": {
        const items = await db.select().from(pendingApprovals).where(eq(pendingApprovals.status, "pending")).orderBy(desc(pendingApprovals.createdAt)).limit(20);
        const byType = await db.select({
          type: pendingApprovals.entityType,
          count: count(),
        }).from(pendingApprovals).where(eq(pendingApprovals.status, "pending")).groupBy(pendingApprovals.entityType);
        return { items, byType };
      }
      case "disputes": {
        const items = await db.select().from(disputes).where(
          or(eq(disputes.status, "open"), eq(disputes.status, "under_review"))
        ).orderBy(desc(disputes.createdAt)).limit(20);
        const byType = await db.select({
          type: disputes.disputeType,
          count: count(),
        }).from(disputes).where(
          or(eq(disputes.status, "open"), eq(disputes.status, "under_review"))
        ).groupBy(disputes.disputeType);
        const [slaBreached] = await db.select({ value: count() }).from(disputes).where(
          sql`${disputes.status} IN ('open', 'under_review') AND ${disputes.slaDeadline} < NOW()`
        );
        return { items, byType, slaBreached: slaBreached.value };
      }
      default:
        return {};
    }
  }

  async getDashboardStats() {
    const [borrowerCount] = await db.select({ value: count() }).from(borrowers);
    const [accountCount] = await db.select({ value: count() }).from(creditAccounts);
    const [inquiryCount] = await db.select({ value: count() }).from(creditInquiries);
    const [outstanding] = await db.select({
      value: sql<string>`COALESCE(SUM(${creditAccounts.currentBalance}::numeric), 0)::text`
    }).from(creditAccounts).where(
      or(eq(creditAccounts.status, "current"), eq(creditAccounts.status, "delinquent"), eq(creditAccounts.status, "restructured"))
    );
    const [delinquent] = await db.select({ value: count() }).from(creditAccounts).where(eq(creditAccounts.status, "delinquent"));
    const [defaulted] = await db.select({ value: count() }).from(creditAccounts).where(eq(creditAccounts.status, "default"));
    const [pendingCount] = await db.select({ value: count() }).from(pendingApprovals).where(eq(pendingApprovals.status, "pending"));
    const [disputeCount] = await db.select({ value: count() }).from(disputes).where(
      or(eq(disputes.status, "open"), eq(disputes.status, "under_review"))
    );

    return {
      totalBorrowers: borrowerCount.value,
      totalAccounts: accountCount.value,
      totalInquiries: inquiryCount.value,
      totalOutstanding: outstanding.value || "0",
      delinquentAccounts: delinquent.value,
      defaultAccounts: defaulted.value,
      pendingApprovalCount: pendingCount.value,
      openDisputeCount: disputeCount.value,
    };
  }

  async getApiKeysByInstitution(institutionId: string): Promise<ApiKey[]> {
    return db.select().from(apiKeys).where(eq(apiKeys.institutionId, institutionId)).orderBy(desc(apiKeys.createdAt));
  }

  async getAllApiKeys(): Promise<ApiKey[]> {
    return db.select().from(apiKeys).orderBy(desc(apiKeys.createdAt));
  }

  async getApiKeyByHash(keyHash: string): Promise<ApiKey | undefined> {
    const [key] = await db.select().from(apiKeys).where(eq(apiKeys.keyHash, keyHash));
    return key;
  }

  async createApiKey(key: InsertApiKey): Promise<ApiKey> {
    const [created] = await db.insert(apiKeys).values(key).returning();
    return created;
  }

  async revokeApiKey(id: string): Promise<ApiKey | undefined> {
    const [revoked] = await db.update(apiKeys).set({ status: "revoked", revokedAt: new Date() }).where(eq(apiKeys.id, id)).returning();
    return revoked;
  }

  async updateApiKeyLastUsed(id: string): Promise<void> {
    await db.update(apiKeys).set({ lastUsedAt: new Date() }).where(eq(apiKeys.id, id));
  }

  async getInstitutionByName(name: string): Promise<Institution | undefined> {
    const [inst] = await db.select().from(institutions).where(eq(institutions.name, name));
    return inst;
  }

  async getExchangeRates(): Promise<ExchangeRate[]> {
    return db.select().from(exchangeRates).orderBy(desc(exchangeRates.createdAt));
  }

  async createExchangeRate(data: InsertExchangeRate): Promise<ExchangeRate> {
    const [created] = await db.insert(exchangeRates).values(data).returning();
    return created;
  }

  async updateExchangeRate(id: string, data: Partial<InsertExchangeRate>): Promise<ExchangeRate | undefined> {
    const [updated] = await db.update(exchangeRates).set(data).where(eq(exchangeRates.id, id)).returning();
    return updated;
  }

  async deleteExchangeRate(id: string): Promise<boolean> {
    const result = await db.delete(exchangeRates).where(eq(exchangeRates.id, id)).returning();
    return result.length > 0;
  }

  async convertCurrency(amount: number, fromCurrency: string, toCurrency: string): Promise<{ convertedAmount: number; rate: number } | null> {
    if (fromCurrency === toCurrency) return { convertedAmount: amount, rate: 1 };
    const [direct] = await db.select().from(exchangeRates)
      .where(sql`${exchangeRates.baseCurrency} = ${fromCurrency} AND ${exchangeRates.targetCurrency} = ${toCurrency}`)
      .orderBy(desc(exchangeRates.createdAt)).limit(1);
    if (direct) {
      const rate = parseFloat(direct.rate);
      return { convertedAmount: amount * rate, rate };
    }
    const [viaUsd1] = await db.select().from(exchangeRates)
      .where(sql`${exchangeRates.baseCurrency} = ${fromCurrency} AND ${exchangeRates.targetCurrency} = 'USD'`)
      .orderBy(desc(exchangeRates.createdAt)).limit(1);
    const [viaUsd2] = await db.select().from(exchangeRates)
      .where(sql`${exchangeRates.baseCurrency} = 'USD' AND ${exchangeRates.targetCurrency} = ${toCurrency}`)
      .orderBy(desc(exchangeRates.createdAt)).limit(1);
    if (viaUsd1 && viaUsd2) {
      const rate = parseFloat(viaUsd1.rate) * parseFloat(viaUsd2.rate);
      return { convertedAmount: amount * rate, rate };
    }
    return null;
  }

  async getRetentionPolicies(): Promise<RetentionPolicy[]> {
    return db.select().from(retentionPolicies).orderBy(retentionPolicies.country);
  }

  async createRetentionPolicy(data: InsertRetentionPolicy): Promise<RetentionPolicy> {
    const [created] = await db.insert(retentionPolicies).values(data).returning();
    return created;
  }

  async updateRetentionPolicy(id: string, data: Partial<InsertRetentionPolicy>): Promise<RetentionPolicy | undefined> {
    const [updated] = await db.update(retentionPolicies).set({ ...data, updatedAt: new Date() }).where(eq(retentionPolicies.id, id)).returning();
    return updated;
  }

  async deleteRetentionPolicy(id: string): Promise<boolean> {
    const result = await db.delete(retentionPolicies).where(eq(retentionPolicies.id, id)).returning();
    return result.length > 0;
  }

  async getApiConfigurations(): Promise<ApiConfiguration[]> {
    return db.select().from(apiConfigurations).orderBy(apiConfigurations.category, apiConfigurations.name);
  }

  async getApiConfiguration(id: string): Promise<ApiConfiguration | undefined> {
    const [config] = await db.select().from(apiConfigurations).where(eq(apiConfigurations.id, id));
    return config;
  }

  async createApiConfiguration(data: InsertApiConfiguration): Promise<ApiConfiguration> {
    const [created] = await db.insert(apiConfigurations).values(data).returning();
    return created;
  }

  async updateApiConfiguration(id: string, data: Partial<InsertApiConfiguration>): Promise<ApiConfiguration | undefined> {
    const [updated] = await db.update(apiConfigurations).set({ ...data, updatedAt: new Date() }).where(eq(apiConfigurations.id, id)).returning();
    return updated;
  }

  async deleteApiConfiguration(id: string): Promise<boolean> {
    const result = await db.delete(apiConfigurations).where(eq(apiConfigurations.id, id)).returning();
    return result.length > 0;
  }
}

export const storage = new DatabaseStorage();
