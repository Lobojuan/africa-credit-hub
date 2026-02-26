import { eq, desc, like, or, sql, count } from "drizzle-orm";
import { db } from "./db";
import {
  users, borrowers, creditAccounts, creditInquiries, auditLogs,
  type User, type InsertUser,
  type Borrower, type InsertBorrower,
  type CreditAccount, type InsertCreditAccount,
  type CreditInquiry, type InsertCreditInquiry,
  type AuditLog, type InsertAuditLog,
} from "@shared/schema";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getUsers(): Promise<User[]>;
  updateUser(id: string, data: Partial<InsertUser>): Promise<User | undefined>;

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

  getDashboardStats(): Promise<{
    totalBorrowers: number;
    totalAccounts: number;
    totalInquiries: number;
    totalOutstanding: string;
    delinquentAccounts: number;
    defaultAccounts: number;
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

    return {
      totalBorrowers: borrowerCount.value,
      totalAccounts: accountCount.value,
      totalInquiries: inquiryCount.value,
      totalOutstanding: outstanding.value || "0",
      delinquentAccounts: delinquent.value,
      defaultAccounts: defaulted.value,
    };
  }
}

export const storage = new DatabaseStorage();
