import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, decimal, boolean, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const userRoleEnum = pgEnum("user_role", ["admin", "regulator", "lender", "viewer"]);
export const userStatusEnum = pgEnum("user_status", ["active", "suspended", "deactivated"]);
export const borrowerTypeEnum = pgEnum("borrower_type", ["individual", "corporate"]);
export const accountStatusEnum = pgEnum("account_status", ["current", "delinquent", "default", "closed", "restructured"]);
export const inquiryPurposeEnum = pgEnum("inquiry_purpose", ["new_credit", "review", "collection", "regulatory", "portfolio_monitoring"]);
export const approvalStatusEnum = pgEnum("approval_status", ["pending", "approved", "rejected"]);
export const disputeStatusEnum = pgEnum("dispute_status", ["open", "under_review", "resolved", "rejected"]);

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  fullName: text("full_name").notNull(),
  email: text("email").notNull(),
  role: userRoleEnum("role").notNull().default("viewer"),
  status: userStatusEnum("status").notNull().default("active"),
  institution: text("institution"),
  failedLoginAttempts: integer("failed_login_attempts").default(0),
  lockedUntil: timestamp("locked_until"),
  lastLogin: timestamp("last_login"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const borrowers = pgTable("borrowers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  type: borrowerTypeEnum("type").notNull(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  companyName: text("company_name"),
  nationalId: text("national_id").notNull().unique(),
  tinNumber: text("tin_number"),
  dateOfBirth: text("date_of_birth"),
  gender: text("gender"),
  phone: text("phone"),
  email: text("email"),
  address: text("address"),
  city: text("city"),
  region: text("region"),
  employerName: text("employer_name"),
  occupation: text("occupation"),
  businessRegNumber: text("business_reg_number"),
  sector: text("sector"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const creditAccounts = pgTable("credit_accounts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  borrowerId: varchar("borrower_id").notNull().references(() => borrowers.id),
  lenderInstitution: text("lender_institution").notNull(),
  accountNumber: text("account_number").notNull(),
  accountType: text("account_type").notNull(),
  originalAmount: decimal("original_amount", { precision: 15, scale: 2 }).notNull(),
  currentBalance: decimal("current_balance", { precision: 15, scale: 2 }).notNull(),
  currency: text("currency").notNull().default("ETB"),
  interestRate: decimal("interest_rate", { precision: 5, scale: 2 }),
  disbursementDate: text("disbursement_date"),
  maturityDate: text("maturity_date"),
  status: accountStatusEnum("status").notNull().default("current"),
  daysInArrears: integer("days_in_arrears").default(0),
  collateralType: text("collateral_type"),
  collateralValue: decimal("collateral_value", { precision: 15, scale: 2 }),
  lastPaymentDate: text("last_payment_date"),
  lastPaymentAmount: decimal("last_payment_amount", { precision: 15, scale: 2 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const creditInquiries = pgTable("credit_inquiries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  borrowerId: varchar("borrower_id").notNull().references(() => borrowers.id),
  inquiredBy: varchar("inquired_by").notNull().references(() => users.id),
  purpose: inquiryPurposeEnum("purpose").notNull(),
  institution: text("institution").notNull(),
  consentProvided: boolean("consent_provided").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const auditLogs = pgTable("audit_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  action: text("action").notNull(),
  entity: text("entity").notNull(),
  entityId: varchar("entity_id"),
  details: text("details"),
  ipAddress: text("ip_address"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const pendingApprovals = pgTable("pending_approvals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  entityType: text("entity_type").notNull(),
  entityId: varchar("entity_id"),
  action: text("action").notNull(),
  payload: text("payload").notNull(),
  requestedBy: varchar("requested_by").notNull().references(() => users.id),
  reviewedBy: varchar("reviewed_by").references(() => users.id),
  status: approvalStatusEnum("status").notNull().default("pending"),
  reviewNotes: text("review_notes"),
  createdAt: timestamp("created_at").defaultNow(),
  reviewedAt: timestamp("reviewed_at"),
});

export const disputes = pgTable("disputes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  borrowerId: varchar("borrower_id").notNull().references(() => borrowers.id),
  creditAccountId: varchar("credit_account_id").references(() => creditAccounts.id),
  filedBy: varchar("filed_by").notNull().references(() => users.id),
  disputeType: text("dispute_type").notNull(),
  description: text("description").notNull(),
  status: disputeStatusEnum("status").notNull().default("open"),
  resolution: text("resolution"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  resolvedAt: timestamp("resolved_at"),
});

export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true, lastLogin: true, failedLoginAttempts: true, lockedUntil: true });
export const insertBorrowerSchema = createInsertSchema(borrowers).omit({ id: true, createdAt: true, updatedAt: true });
export const insertCreditAccountSchema = createInsertSchema(creditAccounts).omit({ id: true, createdAt: true, updatedAt: true });
export const insertCreditInquirySchema = createInsertSchema(creditInquiries).omit({ id: true, createdAt: true });
export const insertAuditLogSchema = createInsertSchema(auditLogs).omit({ id: true, createdAt: true });
export const insertPendingApprovalSchema = createInsertSchema(pendingApprovals).omit({ id: true, createdAt: true, reviewedAt: true, reviewedBy: true, status: true });
export const insertDisputeSchema = createInsertSchema(disputes).omit({ id: true, createdAt: true, updatedAt: true, resolvedAt: true, resolution: true, status: true });

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertBorrower = z.infer<typeof insertBorrowerSchema>;
export type Borrower = typeof borrowers.$inferSelect;
export type InsertCreditAccount = z.infer<typeof insertCreditAccountSchema>;
export type CreditAccount = typeof creditAccounts.$inferSelect;
export type InsertCreditInquiry = z.infer<typeof insertCreditInquirySchema>;
export type CreditInquiry = typeof creditInquiries.$inferSelect;
export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;
export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertPendingApproval = z.infer<typeof insertPendingApprovalSchema>;
export type PendingApproval = typeof pendingApprovals.$inferSelect;
export type InsertDispute = z.infer<typeof insertDisputeSchema>;
export type Dispute = typeof disputes.$inferSelect;
