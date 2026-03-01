import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, decimal, boolean, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const userRoleEnum = pgEnum("user_role", ["admin", "regulator", "lender", "viewer"]);
export const userStatusEnum = pgEnum("user_status", ["active", "suspended", "deactivated"]);
export const borrowerTypeEnum = pgEnum("borrower_type", ["individual", "corporate"]);
export const accountStatusEnum = pgEnum("account_status", ["current", "delinquent", "default", "closed", "restructured", "written_off"]);
export const inquiryPurposeEnum = pgEnum("inquiry_purpose", ["new_credit", "review", "collection", "regulatory", "portfolio_monitoring"]);
export const approvalStatusEnum = pgEnum("approval_status", ["pending", "approved", "rejected"]);
export const disputeStatusEnum = pgEnum("dispute_status", ["open", "under_review", "resolved", "rejected"]);
export const judgmentTypeEnum = pgEnum("judgment_type", ["lien", "bankruptcy", "lawsuit", "civil_judgment", "criminal_conviction"]);
export const judgmentStatusEnum = pgEnum("judgment_status", ["active", "resolved", "appealed"]);
export const consentStatusEnum = pgEnum("consent_status", ["active", "revoked"]);
export const paymentStatusEnum = pgEnum("payment_status", ["on_time", "late", "missed", "partial"]);
export const institutionStatusEnum = pgEnum("institution_status", ["pending", "active", "suspended"]);
export const billingStatusEnum = pgEnum("billing_status", ["pending", "paid", "overdue"]);

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
  passwordChangedAt: timestamp("password_changed_at"),
  mustChangePassword: boolean("must_change_password").default(false),
  mfaSecret: text("mfa_secret"),
  mfaEnabled: boolean("mfa_enabled").default(false),
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
  country: text("country"),
  city: text("city"),
  region: text("region"),
  employerName: text("employer_name"),
  occupation: text("occupation"),
  businessRegNumber: text("business_reg_number"),
  sector: text("sector"),
  passportNumber: text("passport_number"),
  photoUrl: text("photo_url"),
  idDocumentUrl: text("id_document_url"),
  isPep: boolean("is_pep").default(false),
  pepDetails: text("pep_details"),
  relatedBorrowerId: varchar("related_borrower_id"),
  relationshipType: text("relationship_type"),
  educationLevel: text("education_level"),
  educationInstitution: text("education_institution"),
  employmentHistory: text("employment_history"),
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
  isInterestFree: boolean("is_interest_free").default(false),
  gracePeriodMonths: integer("grace_period_months"),
  restructureCount: integer("restructure_count").default(0),
  writtenOffDate: text("written_off_date"),
  reinstatedDate: text("reinstated_date"),
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
  previousHash: text("previous_hash"),
  currentHash: text("current_hash"),
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
  correctionType: text("correction_type"),
  slaDeadline: timestamp("sla_deadline"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  resolvedAt: timestamp("resolved_at"),
});

export const notifications = pgTable("notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  type: text("type").notNull(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  isRead: boolean("is_read").default(false),
  link: text("link"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const courtJudgments = pgTable("court_judgments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  borrowerId: varchar("borrower_id").notNull().references(() => borrowers.id),
  caseNumber: text("case_number").notNull(),
  court: text("court").notNull(),
  judgmentType: judgmentTypeEnum("judgment_type").notNull(),
  amount: decimal("amount", { precision: 15, scale: 2 }),
  currency: text("currency").default("ETB"),
  judgmentDate: text("judgment_date").notNull(),
  status: judgmentStatusEnum("status").notNull().default("active"),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const consentRecords = pgTable("consent_records", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  borrowerId: varchar("borrower_id").notNull().references(() => borrowers.id),
  grantedTo: text("granted_to").notNull(),
  purpose: text("purpose").notNull(),
  consentType: text("consent_type").notNull(),
  status: consentStatusEnum("status").notNull().default("active"),
  grantedAt: timestamp("granted_at").defaultNow(),
  revokedAt: timestamp("revoked_at"),
  receiptNumber: text("receipt_number").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const paymentHistory = pgTable("payment_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  creditAccountId: varchar("credit_account_id").notNull().references(() => creditAccounts.id),
  period: text("period").notNull(),
  amountDue: decimal("amount_due", { precision: 15, scale: 2 }).notNull(),
  amountPaid: decimal("amount_paid", { precision: 15, scale: 2 }).notNull(),
  status: paymentStatusEnum("status").notNull().default("on_time"),
  daysLate: integer("days_late").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const institutions = pgTable("institutions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  type: text("type").notNull(),
  registrationNumber: text("registration_number"),
  country: text("country").notNull().default("Ethiopia"),
  contactEmail: text("contact_email"),
  contactPhone: text("contact_phone"),
  address: text("address"),
  status: institutionStatusEnum("status").notNull().default("pending"),
  submissionFrequency: text("submission_frequency").default("monthly"),
  approvedBy: varchar("approved_by").references(() => users.id),
  approvedAt: timestamp("approved_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const billingRecords = pgTable("billing_records", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  institutionName: text("institution_name").notNull(),
  serviceType: text("service_type").notNull(),
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  currency: text("currency").notNull().default("ETB"),
  status: billingStatusEnum("status").notNull().default("pending"),
  invoiceNumber: text("invoice_number").notNull(),
  periodStart: text("period_start"),
  periodEnd: text("period_end"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const creditReportLogs = pgTable("credit_report_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  borrowerId: varchar("borrower_id").notNull().references(() => borrowers.id),
  requestedBy: varchar("requested_by").notNull().references(() => users.id),
  institution: text("institution").notNull(),
  purpose: text("purpose").notNull(),
  serialNumber: text("serial_number").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const exchangeRates = pgTable("exchange_rates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  baseCurrency: text("base_currency").notNull(),
  targetCurrency: text("target_currency").notNull(),
  rate: decimal("rate", { precision: 15, scale: 6 }).notNull(),
  effectiveDate: text("effective_date").notNull(),
  source: text("source").notNull().default("manual"),
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const retentionPolicies = pgTable("retention_policies", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  country: text("country").notNull(),
  entityType: text("entity_type").notNull(),
  retentionYears: integer("retention_years").notNull(),
  archiveAfterYears: integer("archive_after_years"),
  description: text("description"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const apiConfigurations = pgTable("api_configurations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  category: text("category").notNull(),
  baseUrl: text("base_url").notNull(),
  apiKeyHeaderName: text("api_key_header_name").default("X-API-Key"),
  authType: text("auth_type").notNull().default("none"),
  country: text("country"),
  isActive: boolean("is_active").default(true),
  description: text("description"),
  lastTestedAt: timestamp("last_tested_at"),
  lastTestStatus: text("last_test_status"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const apiKeyStatusEnum = pgEnum("api_key_status", ["active", "revoked"]);

export const apiKeys = pgTable("api_keys", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  institutionId: varchar("institution_id").notNull().references(() => institutions.id),
  keyHash: text("key_hash").notNull(),
  keyPrefix: text("key_prefix").notNull(),
  label: text("label").notNull(),
  status: apiKeyStatusEnum("status").notNull().default("active"),
  permissions: text("permissions").notNull().default("submit"),
  lastUsedAt: timestamp("last_used_at"),
  createdBy: varchar("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  revokedAt: timestamp("revoked_at"),
});

export const insertApiKeySchema = createInsertSchema(apiKeys).omit({ id: true, createdAt: true, lastUsedAt: true, revokedAt: true });

export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true, lastLogin: true, failedLoginAttempts: true, lockedUntil: true, passwordChangedAt: true, mustChangePassword: true, mfaSecret: true, mfaEnabled: true });
export const insertBorrowerSchema = createInsertSchema(borrowers).omit({ id: true, createdAt: true, updatedAt: true });
export const insertCreditAccountSchema = createInsertSchema(creditAccounts).omit({ id: true, createdAt: true, updatedAt: true });
export const insertCreditInquirySchema = createInsertSchema(creditInquiries).omit({ id: true, createdAt: true });
export const insertAuditLogSchema = createInsertSchema(auditLogs).omit({ id: true, createdAt: true });
export const insertPendingApprovalSchema = createInsertSchema(pendingApprovals).omit({ id: true, createdAt: true, reviewedAt: true, reviewedBy: true, status: true });
export const insertDisputeSchema = createInsertSchema(disputes).omit({ id: true, createdAt: true, updatedAt: true, resolvedAt: true, resolution: true, status: true });
export const insertNotificationSchema = createInsertSchema(notifications).omit({ id: true, createdAt: true, isRead: true });
export const insertCourtJudgmentSchema = createInsertSchema(courtJudgments).omit({ id: true, createdAt: true });
export const insertConsentRecordSchema = createInsertSchema(consentRecords).omit({ id: true, createdAt: true, revokedAt: true });
export const insertPaymentHistorySchema = createInsertSchema(paymentHistory).omit({ id: true, createdAt: true });
export const insertInstitutionSchema = createInsertSchema(institutions).omit({ id: true, createdAt: true, approvedBy: true, approvedAt: true });
export const insertBillingRecordSchema = createInsertSchema(billingRecords).omit({ id: true, createdAt: true });
export const insertCreditReportLogSchema = createInsertSchema(creditReportLogs).omit({ id: true, createdAt: true });
export const insertExchangeRateSchema = createInsertSchema(exchangeRates).omit({ id: true, createdAt: true });
export const insertRetentionPolicySchema = createInsertSchema(retentionPolicies).omit({ id: true, createdAt: true, updatedAt: true });
export const insertApiConfigurationSchema = createInsertSchema(apiConfigurations).omit({ id: true, createdAt: true, updatedAt: true, lastTestedAt: true, lastTestStatus: true });

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
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type Notification = typeof notifications.$inferSelect;
export type InsertCourtJudgment = z.infer<typeof insertCourtJudgmentSchema>;
export type CourtJudgment = typeof courtJudgments.$inferSelect;
export type InsertConsentRecord = z.infer<typeof insertConsentRecordSchema>;
export type ConsentRecord = typeof consentRecords.$inferSelect;
export type InsertPaymentHistory = z.infer<typeof insertPaymentHistorySchema>;
export type PaymentHistory = typeof paymentHistory.$inferSelect;
export type InsertInstitution = z.infer<typeof insertInstitutionSchema>;
export type Institution = typeof institutions.$inferSelect;
export type InsertBillingRecord = z.infer<typeof insertBillingRecordSchema>;
export type BillingRecord = typeof billingRecords.$inferSelect;
export type InsertCreditReportLog = z.infer<typeof insertCreditReportLogSchema>;
export type CreditReportLog = typeof creditReportLogs.$inferSelect;
export type InsertApiKey = z.infer<typeof insertApiKeySchema>;
export type ApiKey = typeof apiKeys.$inferSelect;
export type InsertExchangeRate = z.infer<typeof insertExchangeRateSchema>;
export type ExchangeRate = typeof exchangeRates.$inferSelect;
export type InsertRetentionPolicy = z.infer<typeof insertRetentionPolicySchema>;
export type RetentionPolicy = typeof retentionPolicies.$inferSelect;
export type InsertApiConfiguration = z.infer<typeof insertApiConfigurationSchema>;
export type ApiConfiguration = typeof apiConfigurations.$inferSelect;
