import { eq, desc, like, or, sql, count } from "drizzle-orm";
import { db } from "./db";
import {
  users, borrowers, creditAccounts, creditInquiries, auditLogs, pendingApprovals, disputes, notifications,
  courtJudgments, consentRecords, paymentHistory, institutions, billingRecords, creditReportLogs,
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
} from "@shared/schema";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getUsers(): Promise<User[]>;
  updateUser(id: string, data: Partial<InsertUser>): Promise<User | undefined>;
  incrementFailedAttempts(userId: string): Promise<void>;
  resetFailedAttempts(userId: string): Promise<void>;
  lockUser(userId: string, until: Date): Promise<void>;
  updateLastLogin(userId: string): Promise<void>;

  getBorrower(id: string): Promise<Borrower | undefined>;
  getBorrowers(): Promise<Borrower[]>;
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

  getInstitutions(): Promise<Institution[]>;
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

  async getBorrowers(): Promise<Borrower[]> {
    return db.select().from(borrowers).orderBy(desc(borrowers.createdAt));
  }

  async searchBorrowers(query: string): Promise<Borrower[]> {
    const searchPattern = `%${query}%`;
    return db.select().from(borrowers).where(
      or(
        like(borrowers.firstName, searchPattern),
        like(borrowers.lastName, searchPattern),
        like(borrowers.companyName, searchPattern),
        like(borrowers.nationalId, searchPattern),
        like(borrowers.tinNumber, searchPattern),
        like(borrowers.phone, searchPattern),
        like(borrowers.email, searchPattern),
      )
    ).orderBy(desc(borrowers.createdAt));
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
    return db.select().from(creditAccounts).orderBy(desc(creditAccounts.createdAt));
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
    return db.select().from(creditInquiries).orderBy(desc(creditInquiries.createdAt));
  }

  async createCreditInquiry(inquiry: InsertCreditInquiry): Promise<CreditInquiry> {
    const [created] = await db.insert(creditInquiries).values(inquiry).returning();
    return created;
  }

  async getAuditLogs(): Promise<AuditLog[]> {
    return db.select().from(auditLogs).orderBy(desc(auditLogs.createdAt)).limit(200);
  }

  async createAuditLog(log: InsertAuditLog): Promise<AuditLog> {
    const [created] = await db.insert(auditLogs).values(log).returning();
    return created;
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
    return db.select().from(disputes).orderBy(desc(disputes.createdAt));
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
    return db.select().from(courtJudgments).orderBy(desc(courtJudgments.createdAt));
  }

  async createCourtJudgment(judgment: InsertCourtJudgment): Promise<CourtJudgment> {
    const [created] = await db.insert(courtJudgments).values(judgment).returning();
    return created;
  }

  async getConsentRecordsByBorrower(borrowerId: string): Promise<ConsentRecord[]> {
    return db.select().from(consentRecords).where(eq(consentRecords.borrowerId, borrowerId)).orderBy(desc(consentRecords.createdAt));
  }

  async getAllConsentRecords(): Promise<ConsentRecord[]> {
    return db.select().from(consentRecords).orderBy(desc(consentRecords.createdAt));
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

  async getInstitutions(): Promise<Institution[]> {
    return db.select().from(institutions).orderBy(desc(institutions.createdAt));
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
}

export const storage = new DatabaseStorage();
