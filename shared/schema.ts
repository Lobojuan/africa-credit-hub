import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, decimal, boolean, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const userRoleEnum = pgEnum("user_role", ["super_admin", "admin", "regulator", "lender", "viewer"]);
export const userStatusEnum = pgEnum("user_status", ["active", "suspended", "deactivated"]);
export const organizationTypeEnum = pgEnum("organization_type", ["bank", "microfinance", "insurance", "telecom", "fintech", "utility", "government", "regulator", "real_estate", "investment", "other"]);
export const organizationStatusEnum = pgEnum("organization_status", ["active", "suspended", "pending", "deactivated"]);
export const borrowerTypeEnum = pgEnum("borrower_type", ["individual", "corporate"]);

export const organizations = pgTable("organizations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  type: organizationTypeEnum("type").notNull().default("other"),
  status: organizationStatusEnum("status").notNull().default("pending"),
  country: text("country"),
  contactEmail: text("contact_email"),
  contactPhone: text("contact_phone"),
  address: text("address"),
  logoUrl: text("logo_url"),
  website: text("website"),
  subscriptionTier: text("subscription_tier").notNull().default("standard"),
  maxUsers: integer("max_users").default(10),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});
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

export const userDivisionEnum = pgEnum("user_division", ["retail", "corporate", "telco"]);

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  fullName: text("full_name").notNull(),
  email: text("email").notNull(),
  role: userRoleEnum("role").notNull().default("viewer"),
  division: userDivisionEnum("division"),
  status: userStatusEnum("status").notNull().default("active"),
  institution: text("institution"),
  organizationId: varchar("organization_id").references(() => organizations.id),
  failedLoginAttempts: integer("failed_login_attempts").default(0),
  lockedUntil: timestamp("locked_until"),
  lastLogin: timestamp("last_login"),
  passwordChangedAt: timestamp("password_changed_at"),
  mustChangePassword: boolean("must_change_password").default(false),
  passwordHistory: text("password_history").array().default([]),
  lastLoginIp: text("last_login_ip"),
  knownIps: text("known_ips").array().default([]),
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
  votersId: text("voters_id"),
  ssnitNumber: text("ssnit_number"),
  driversLicense: text("drivers_license"),
  ghanaCardNumber: text("ghana_card_number"),
  maritalStatus: text("marital_status"),
  proofOfAddressType: text("proof_of_address_type"),
  proofOfAddressNumber: text("proof_of_address_number"),
  mobileMoneyNumber: text("mobile_money_number"),
  photoUrl: text("photo_url"),
  idDocumentUrl: text("id_document_url"),
  isPep: boolean("is_pep").default(false),
  pepDetails: text("pep_details"),
  relatedBorrowerId: varchar("related_borrower_id"),
  relationshipType: text("relationship_type"),
  educationLevel: text("education_level"),
  educationInstitution: text("education_institution"),
  employmentHistory: text("employment_history"),
  ezwichNumber: text("ezwich_number"),
  ownerOrTenant: text("owner_or_tenant"),
  employmentTypeCode: text("employment_type_code"),
  nationality: text("nationality"),
  middleNames: text("middle_names"),
  previousName: text("previous_name"),
  alias: text("alias"),
  title: text("title"),
  postalAddress1: text("postal_address_1"),
  postalAddress2: text("postal_address_2"),
  postalAddress3: text("postal_address_3"),
  postalAddress4: text("postal_address_4"),
  postalCode: text("postal_code"),
  previousAddress1: text("previous_address_1"),
  previousAddress2: text("previous_address_2"),
  previousAddress3: text("previous_address_3"),
  previousAddress4: text("previous_address_4"),
  previousAddrPostalCode: text("previous_addr_postal_code"),
  dateMovedCurrentRes: text("date_moved_current_res"),
  homeTelephone: text("home_telephone"),
  workTelephone: text("work_telephone"),
  numberOfDependants: integer("number_of_dependants"),
  incomeCurrency: text("income_currency"),
  monthlyIncome: decimal("monthly_income", { precision: 15, scale: 2 }),
  dateOfEmployment: text("date_of_employment"),
  employerAddress: text("employer_address"),
  turnoverAmount: decimal("turnover_amount", { precision: 15, scale: 2 }),
  turnoverCurrency: text("turnover_currency"),
  sectorIndustryCode: text("sector_industry_code"),
  subSectorCode: text("sub_sector_code"),
  businessTypeCode: text("business_type_code"),
  registrationDate: text("registration_date"),
  commencementDate: text("commencement_date"),
  tradingName: text("trading_name"),
  previousBusinessName: text("previous_business_name"),
  previousRegNumber: text("previous_reg_number"),
  website: text("website"),
  officeTelephone2: text("office_telephone_2"),
  officeFaxNumber: text("office_fax_number"),
  mobileTelephone2: text("mobile_telephone_2"),
  employerPayrollNum: text("employer_payroll_num"),
  paypoint: text("paypoint"),
  employerPostalCode: text("employer_postal_code"),
  otherIdType: text("other_id_type"),
  otherIdNumber: text("other_id_number"),
  branchCode: text("branch_code"),
  customerId: text("customer_id"),
  organizationId: varchar("organization_id").references(() => organizations.id),
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
  facilityTypeCode: text("facility_type_code"),
  purposeOfFacility: text("purpose_of_facility"),
  repaymentFrequency: text("repayment_frequency"),
  assetClassification: text("asset_classification"),
  amountOverdue: decimal("amount_overdue", { precision: 15, scale: 2 }),
  writtenOffAmount: decimal("written_off_amount", { precision: 15, scale: 2 }),
  currentBalanceIndicator: text("current_balance_indicator"),
  arrearsStartDate: text("arrears_start_date"),
  disbursementAmount: decimal("disbursement_amount", { precision: 15, scale: 2 }),
  scheduledInstallmentAmount: decimal("scheduled_installment_amount", { precision: 15, scale: 2 }),
  facilityTerm: integer("facility_term"),
  paymentHistoryProfile: text("payment_history_profile"),
  legalFlag: text("legal_flag"),
  amtOverdue1to30: decimal("amt_overdue_1_to_30", { precision: 15, scale: 2 }),
  amtOverdue31to60: decimal("amt_overdue_31_to_60", { precision: 15, scale: 2 }),
  amtOverdue61to90: decimal("amt_overdue_61_to_90", { precision: 15, scale: 2 }),
  amtOverdue91to120: decimal("amt_overdue_91_to_120", { precision: 15, scale: 2 }),
  amtOverdue121to150: decimal("amt_overdue_121_to_150", { precision: 15, scale: 2 }),
  amtOverdue151to180: decimal("amt_overdue_151_to_180", { precision: 15, scale: 2 }),
  amtOverdue181plus: decimal("amt_overdue_181_plus", { precision: 15, scale: 2 }),
  nextPaymentDate: text("next_payment_date"),
  closureReason: text("closure_reason"),
  dateRestructured: text("date_restructured"),
  reasonForRestructure: text("reason_for_restructure"),
  reasonForWrittenOff: text("reason_for_written_off"),
  creditCollateralIndicator: text("credit_collateral_indicator"),
  securityType: text("security_type"),
  natureOfCharge: text("nature_of_charge"),
  securityValue: decimal("security_value", { precision: 15, scale: 2 }),
  collateralRegRefNum: text("collateral_reg_ref_num"),
  specialCommentsCode: text("special_comments_code"),
  natureOfGuarantor: text("nature_of_guarantor"),
  bogAccountStatus: text("bog_account_status"),
  jointOrSoleAccount: text("joint_or_sole_account"),
  noParticipantsInAccount: integer("no_participants_in_account"),
  defPaymentStartDate: text("def_payment_start_date"),
  bogAssetClassification: text("bog_asset_classification"),
  facilityStatusDate: text("facility_status_date"),
  closedDate: text("closed_date"),
  reportingDate: text("reporting_date"),
  creditCategory: text("credit_category"),
  correctionIndicator: integer("correction_indicator").default(0),
  organizationId: varchar("organization_id").references(() => organizations.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const guarantors = pgTable("guarantors", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  creditAccountId: varchar("credit_account_id").notNull().references(() => creditAccounts.id),
  guarantorNumber: integer("guarantor_number").notNull().default(1),
  natureOfGuarantor: text("nature_of_guarantor"),
  companyName: text("company_name"),
  businessRegNumber: text("business_reg_number"),
  surname: text("surname"),
  firstName: text("first_name"),
  middleNames: text("middle_names"),
  nationalId: text("national_id"),
  votersId: text("voters_id"),
  driversLicense: text("drivers_license"),
  passportNumber: text("passport_number"),
  ssnitNumber: text("ssnit_number"),
  gender: text("gender"),
  dateOfBirth: text("date_of_birth"),
  address1: text("address_1"),
  address2: text("address_2"),
  address3: text("address_3"),
  homeTelephone: text("home_telephone"),
  workTelephone: text("work_telephone"),
  mobile: text("mobile"),
  organizationId: varchar("organization_id").references(() => organizations.id),
  createdAt: timestamp("created_at").defaultNow(),
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
  organizationId: varchar("organization_id").references(() => organizations.id),
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
  organizationId: varchar("organization_id").references(() => organizations.id),
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
  organizationId: varchar("organization_id").references(() => organizations.id),
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
  courtLocation: text("court_location"),
  courtType: text("court_type"),
  caseFilingDate: text("case_filing_date"),
  bogCaseType: text("bog_case_type"),
  caseReason: text("case_reason"),
  judgmentCurrency: text("judgment_currency"),
  organizationId: varchar("organization_id").references(() => organizations.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const dishonouredCheques = pgTable("dishonoured_cheques", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  borrowerId: varchar("borrower_id").notNull().references(() => borrowers.id),
  accountNumber: text("account_number").notNull(),
  chequeNumber: text("cheque_number").notNull(),
  dateAccountOpened: text("date_account_opened"),
  dateIssued: text("date_issued").notNull(),
  dateBounced: text("date_bounced").notNull(),
  reasonReturnedCode: text("reason_returned_code").notNull(),
  currency: text("currency").notNull().default("GHS"),
  chequeAmount: decimal("cheque_amount", { precision: 15, scale: 2 }).notNull(),
  organizationId: varchar("organization_id").references(() => organizations.id),
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
  organizationId: varchar("organization_id").references(() => organizations.id),
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
  organizationId: varchar("organization_id").references(() => organizations.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const creditReportLogs = pgTable("credit_report_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  borrowerId: varchar("borrower_id").notNull().references(() => borrowers.id),
  requestedBy: varchar("requested_by").notNull().references(() => users.id),
  institution: text("institution").notNull(),
  purpose: text("purpose").notNull(),
  serialNumber: text("serial_number").notNull().unique(),
  organizationId: varchar("organization_id").references(() => organizations.id),
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

export const alertTypeEnum = pgEnum("alert_type", ["credit_inquiry", "report_accessed", "dispute_update", "score_change", "data_updated"]);
export const alertStatusEnum = pgEnum("alert_status", ["pending", "sent", "failed", "disabled"]);

export const borrowerAlerts = pgTable("borrower_alerts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  borrowerId: varchar("borrower_id").notNull().references(() => borrowers.id),
  alertType: alertTypeEnum("alert_type").notNull(),
  message: text("message").notNull(),
  recipientPhone: text("recipient_phone"),
  recipientEmail: text("recipient_email"),
  accessedBy: text("accessed_by"),
  institution: text("institution"),
  purpose: text("purpose"),
  status: alertStatusEnum("status").notNull().default("pending"),
  organizationId: varchar("organization_id").references(() => organizations.id),
  createdAt: timestamp("created_at").defaultNow(),
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

export const agreementStatusEnum = pgEnum("agreement_status", ["draft", "active", "suspended", "expired"]);
export const settlementStatusEnum = pgEnum("settlement_status", ["pending", "completed", "failed", "reversed"]);

export const dataSharingAgreements = pgTable("data_sharing_agreements", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sourceCountry: text("source_country").notNull(),
  targetCountry: text("target_country").notNull(),
  allowedDataTypes: text("allowed_data_types").array().notNull(),
  status: agreementStatusEnum("status").notNull().default("draft"),
  effectiveDate: text("effective_date"),
  expiryDate: text("expiry_date"),
  legalBasis: text("legal_basis"),
  description: text("description"),
  regionalBloc: text("regional_bloc"),
  createdBy: varchar("created_by").references(() => users.id),
  approvedBy: varchar("approved_by").references(() => users.id),
  suspendedReason: text("suspended_reason"),
  sourceInstitutions: text("source_institutions").array().default(sql`ARRAY[]::TEXT[]`),
  targetInstitutions: text("target_institutions").array().default(sql`ARRAY[]::TEXT[]`),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const papssSettlements = pgTable("papss_settlements", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  senderInstitution: text("sender_institution").notNull(),
  senderCountry: text("sender_country").notNull(),
  receiverInstitution: text("receiver_institution").notNull(),
  receiverCountry: text("receiver_country").notNull(),
  senderAmount: decimal("sender_amount", { precision: 15, scale: 2 }).notNull(),
  senderCurrency: text("sender_currency").notNull(),
  receiverAmount: decimal("receiver_amount", { precision: 15, scale: 2 }).notNull(),
  receiverCurrency: text("receiver_currency").notNull(),
  exchangeRate: decimal("exchange_rate", { precision: 15, scale: 6 }).notNull(),
  exchangeRateSource: text("exchange_rate_source").default("PAPSS"),
  iso20022Reference: text("iso20022_reference").notNull(),
  messageType: text("message_type").default("pacs.008"),
  status: settlementStatusEnum("status").notNull().default("pending"),
  purpose: text("purpose"),
  agreementId: varchar("agreement_id").references(() => dataSharingAgreements.id),
  initiatedBy: varchar("initiated_by").references(() => users.id),
  completedAt: timestamp("completed_at"),
  failureReason: text("failure_reason"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertDataSharingAgreementSchema = createInsertSchema(dataSharingAgreements).omit({ id: true, createdAt: true, updatedAt: true });
export const insertPapssSettlementSchema = createInsertSchema(papssSettlements).omit({ id: true, createdAt: true, updatedAt: true, completedAt: true });

export const insertBorrowerAlertSchema = createInsertSchema(borrowerAlerts).omit({ id: true, createdAt: true });
export const insertOrganizationSchema = createInsertSchema(organizations).omit({ id: true, createdAt: true, updatedAt: true });
export const insertApiKeySchema = createInsertSchema(apiKeys).omit({ id: true, createdAt: true, lastUsedAt: true, revokedAt: true });

export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true, lastLogin: true, failedLoginAttempts: true, lockedUntil: true, passwordChangedAt: true, mustChangePassword: true, passwordHistory: true, lastLoginIp: true, knownIps: true, mfaSecret: true, mfaEnabled: true });
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
export const insertDishonouredChequeSchema = createInsertSchema(dishonouredCheques).omit({ id: true, createdAt: true });
export const insertGuarantorSchema = createInsertSchema(guarantors).omit({ id: true, createdAt: true });

export type InsertOrganization = z.infer<typeof insertOrganizationSchema>;
export type Organization = typeof organizations.$inferSelect;
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
export type InsertDishonouredCheque = z.infer<typeof insertDishonouredChequeSchema>;
export type DishonouredCheque = typeof dishonouredCheques.$inferSelect;
export type InsertGuarantor = z.infer<typeof insertGuarantorSchema>;
export type Guarantor = typeof guarantors.$inferSelect;
export type InsertBorrowerAlert = z.infer<typeof insertBorrowerAlertSchema>;
export type BorrowerAlert = typeof borrowerAlerts.$inferSelect;
export type InsertDataSharingAgreement = z.infer<typeof insertDataSharingAgreementSchema>;
export type DataSharingAgreement = typeof dataSharingAgreements.$inferSelect;
export type InsertPapssSettlement = z.infer<typeof insertPapssSettlementSchema>;
export type PapssSettlement = typeof papssSettlements.$inferSelect;

export const usageMeteringEventEnum = pgEnum("usage_metering_event", ["credit_report_pull", "api_call", "batch_upload", "cross_border_query", "dispute_filing", "data_export", "telco_credit_score", "telco_decision", "telco_data_import", "telco_consent", "telco_loan_disbursement"]);

export const usageMetering = pgTable("usage_metering", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  organizationId: varchar("organization_id").references(() => organizations.id),
  eventType: usageMeteringEventEnum("event_type").notNull(),
  quantity: integer("quantity").notNull().default(1),
  unitPriceCents: integer("unit_price_cents").notNull(),
  totalCents: integer("total_cents").notNull(),
  currency: text("currency").notNull().default("USD"),
  country: text("country"),
  metadata: text("metadata"),
  billed: boolean("billed").default(false),
  billingRecordId: varchar("billing_record_id").references(() => billingRecords.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUsageMeteringSchema = createInsertSchema(usageMetering).omit({ id: true, createdAt: true });
export type InsertUsageMetering = z.infer<typeof insertUsageMeteringSchema>;
export type UsageMetering = typeof usageMetering.$inferSelect;

export const pricingTiers = pgTable("pricing_tiers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  eventType: usageMeteringEventEnum("event_type").notNull(),
  minVolume: integer("min_volume").notNull().default(0),
  maxVolume: integer("max_volume"),
  unitPriceCents: integer("unit_price_cents").notNull(),
  currency: text("currency").notNull().default("USD"),
  country: text("country").notNull().default("Global"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertPricingTierSchema = createInsertSchema(pricingTiers).omit({ id: true, createdAt: true });
export type InsertPricingTier = z.infer<typeof insertPricingTierSchema>;
export type PricingTier = typeof pricingTiers.$inferSelect;

export const alternativeDataSourceEnum = pgEnum("alternative_data_source", ["mobile_money", "utility", "telco", "rent", "insurance", "merchant"]);
export const alternativeDataStatusEnum = pgEnum("alternative_data_status", ["active", "expired", "revoked"]);

export const alternativeData = pgTable("alternative_data", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  borrowerId: text("borrower_id").notNull(),
  source: alternativeDataSourceEnum("source").notNull(),
  provider: text("provider").notNull(),
  status: alternativeDataStatusEnum("status").notNull().default("active"),
  totalTransactions: integer("total_transactions").default(0),
  onTimePayments: integer("on_time_payments").default(0),
  latePayments: integer("late_payments").default(0),
  averageMonthlyAmount: decimal("average_monthly_amount", { precision: 15, scale: 2 }),
  currency: text("currency").notNull().default("GHS"),
  dataStartDate: timestamp("data_start_date"),
  dataEndDate: timestamp("data_end_date"),
  consentDate: timestamp("consent_date"),
  rawScore: integer("raw_score"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertAlternativeDataSchema = createInsertSchema(alternativeData).omit({ id: true, createdAt: true });
export type InsertAlternativeData = z.infer<typeof insertAlternativeDataSchema>;
export type AlternativeData = typeof alternativeData.$inferSelect;

export const telcoProviderEnum = pgEnum("telco_provider", ["mtn", "vodafone", "airtel", "safaricom", "orange", "glo", "tigo", "africell", "econet", "other"]);
export const telcoKycLevelEnum = pgEnum("telco_kyc_level", ["none", "basic", "standard", "full"]);
export const momoTransactionTypeEnum = pgEnum("momo_transaction_type", ["p2p_send", "p2p_receive", "merchant_payment", "bill_payment", "airtime_purchase", "airtime_advance", "cash_in", "cash_out", "salary_credit", "loan_disbursement", "loan_repayment", "savings_deposit", "savings_withdrawal", "international_transfer", "other"]);
export const telcoRiskTierEnum = pgEnum("telco_risk_tier", ["very_low", "low", "medium", "high", "very_high"]);

export const telcoProfiles = pgTable("telco_profiles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  borrowerId: varchar("borrower_id").references(() => borrowers.id),
  msisdn: text("msisdn").notNull(),
  provider: telcoProviderEnum("provider").notNull(),
  country: text("country").notNull(),
  simRegistrationDate: text("sim_registration_date"),
  kycLevel: telcoKycLevelEnum("kyc_level").notNull().default("basic"),
  deviceType: text("device_type"),
  deviceChanges90d: integer("device_changes_90d").default(0),
  accountStatus: text("account_status").notNull().default("active"),
  consentGranted: boolean("consent_granted").default(false),
  consentDate: timestamp("consent_date"),
  organizationId: varchar("organization_id").references(() => organizations.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertTelcoProfileSchema = createInsertSchema(telcoProfiles).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertTelcoProfile = z.infer<typeof insertTelcoProfileSchema>;
export type TelcoProfile = typeof telcoProfiles.$inferSelect;

export const momoTransactions = pgTable("momo_transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  profileId: varchar("profile_id").notNull().references(() => telcoProfiles.id),
  transactionType: momoTransactionTypeEnum("transaction_type").notNull(),
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  currency: text("currency").notNull().default("GHS"),
  counterpartyMsisdn: text("counterparty_msisdn"),
  counterpartyName: text("counterparty_name"),
  isMerchant: boolean("is_merchant").default(false),
  category: text("category"),
  narration: text("narration"),
  balanceAfter: decimal("balance_after", { precision: 15, scale: 2 }),
  transactionDate: timestamp("transaction_date").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertMomoTransactionSchema = createInsertSchema(momoTransactions).omit({ id: true, createdAt: true });
export type InsertMomoTransaction = z.infer<typeof insertMomoTransactionSchema>;
export type MomoTransaction = typeof momoTransactions.$inferSelect;

export const telcoCreditScores = pgTable("telco_credit_scores", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  profileId: varchar("profile_id").notNull().references(() => telcoProfiles.id),
  borrowerId: varchar("borrower_id").references(() => borrowers.id),
  riskTier: telcoRiskTierEnum("risk_tier").notNull(),
  riskScore: integer("risk_score").notNull(),
  creditLimit: decimal("credit_limit", { precision: 15, scale: 2 }),
  currency: text("currency").notNull().default("GHS"),
  approvalRecommendation: boolean("approval_recommendation").default(false),
  reasonCode: text("reason_code"),
  detailedRationale: text("detailed_rationale"),
  evaluationPeriodDays: integer("evaluation_period_days").notNull().default(90),
  kpiSnapshot: text("kpi_snapshot"),
  aiProvider: text("ai_provider"),
  aiModel: text("ai_model"),
  organizationId: varchar("organization_id").references(() => organizations.id),
  country: text("country"),
  scoredAt: timestamp("scored_at").defaultNow(),
});

export const insertTelcoCreditScoreSchema = createInsertSchema(telcoCreditScores).omit({ id: true, scoredAt: true });
export type InsertTelcoCreditScore = z.infer<typeof insertTelcoCreditScoreSchema>;
export type TelcoCreditScore = typeof telcoCreditScores.$inferSelect;

export const webauthnCredentials = pgTable("webauthn_credentials", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  credentialId: text("credential_id").notNull().unique(),
  publicKey: text("public_key").notNull(),
  counter: integer("counter").notNull().default(0),
  deviceType: text("device_type"),
  transports: text("transports").array().default(sql`ARRAY[]::TEXT[]`),
  createdAt: timestamp("created_at").defaultNow(),
});
export const insertWebauthnCredentialSchema = createInsertSchema(webauthnCredentials).omit({ id: true, createdAt: true });
export type InsertWebauthnCredential = z.infer<typeof insertWebauthnCredentialSchema>;
export type WebauthnCredential = typeof webauthnCredentials.$inferSelect;

export const blockchainAnchors = pgTable("blockchain_anchors", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  merkleRoot: text("merkle_root").notNull(),
  auditLogCount: integer("audit_log_count").notNull(),
  firstLogId: varchar("first_log_id"),
  lastLogId: varchar("last_log_id"),
  simulatedTxHash: text("simulated_tx_hash").notNull(),
  simulatedBlockNumber: integer("simulated_block_number"),
  simulatedChain: text("simulated_chain").notNull().default("ethereum-sepolia"),
  status: text("status").notNull().default("anchored"),
  anchoredAt: timestamp("anchored_at").defaultNow(),
});
export const insertBlockchainAnchorSchema = createInsertSchema(blockchainAnchors).omit({ id: true, anchoredAt: true });
export type InsertBlockchainAnchor = z.infer<typeof insertBlockchainAnchorSchema>;
export type BlockchainAnchor = typeof blockchainAnchors.$inferSelect;

export const countrySettings = pgTable("country_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  countryCode: text("country_code").notNull().unique(),
  countryName: text("country_name").notNull(),
  regulatoryBody: text("regulatory_body"),
  dataProtectionLaw: text("data_protection_law"),
  dataProtectionStatus: text("data_protection_status").notNull().default("none"),
  sataReadiness: text("sata_readiness").notNull().default("planned"),
  enabledFeatures: text("enabled_features").array().default(sql`ARRAY[]::TEXT[]`),
  updatedAt: timestamp("updated_at").defaultNow(),
});
export const insertCountrySettingsSchema = createInsertSchema(countrySettings).omit({ id: true, updatedAt: true });
export type InsertCountrySettings = z.infer<typeof insertCountrySettingsSchema>;
export type CountrySettings = typeof countrySettings.$inferSelect;

export const webhookSubscriptions = pgTable("webhook_subscriptions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  organizationId: varchar("organization_id").notNull(),
  url: text("url").notNull(),
  secret: text("secret").notNull(),
  events: text("events").array().default(sql`ARRAY[]::TEXT[]`),
  status: text("status").notNull().default("active"),
  description: text("description"),
  failureCount: integer("failure_count").default(0),
  lastDeliveryAt: timestamp("last_delivery_at"),
  lastDeliveryStatus: text("last_delivery_status"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});
export const insertWebhookSubscriptionSchema = createInsertSchema(webhookSubscriptions).omit({ id: true, failureCount: true, lastDeliveryAt: true, lastDeliveryStatus: true, createdAt: true, updatedAt: true });
export type InsertWebhookSubscription = z.infer<typeof insertWebhookSubscriptionSchema>;
export type WebhookSubscription = typeof webhookSubscriptions.$inferSelect;

export const webhookDeliveryLogs = pgTable("webhook_delivery_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  subscriptionId: varchar("subscription_id").notNull(),
  event: text("event").notNull(),
  payload: text("payload"),
  responseStatus: integer("response_status"),
  responseBody: text("response_body"),
  success: boolean("success").default(false),
  attemptNumber: integer("attempt_number").default(1),
  deliveredAt: timestamp("delivered_at").defaultNow(),
});
export type WebhookDeliveryLog = typeof webhookDeliveryLogs.$inferSelect;

export const telcoDecisionStatusEnum = pgEnum("telco_decision_status", ["approved_disbursed", "approved_pending", "rejected", "error"]);

export const telcoDecisionRules = pgTable("telco_decision_rules", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  organizationId: varchar("organization_id").references(() => organizations.id),
  country: text("country"),
  maxAllowableRiskTier: integer("max_allowable_risk_tier").notNull().default(3),
  minUtilityPayments: integer("min_utility_payments").notNull().default(2),
  minWalletRetentionPct: integer("min_wallet_retention_pct").notNull().default(20),
  minSimAgeDays: integer("min_sim_age_days").notNull().default(90),
  maxDormantDays: integer("max_dormant_days").notNull().default(30),
  minKycLevel: text("min_kyc_level").notNull().default("basic"),
  maxCreditLimitUsd: decimal("max_credit_limit_usd", { precision: 15, scale: 2 }).notNull().default("500"),
  autoDisburseApproved: boolean("auto_disburse_approved").notNull().default(false),
  isActive: boolean("is_active").notNull().default(true),
  createdBy: varchar("created_by"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertTelcoDecisionRuleSchema = createInsertSchema(telcoDecisionRules).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertTelcoDecisionRule = z.infer<typeof insertTelcoDecisionRuleSchema>;
export type TelcoDecisionRule = typeof telcoDecisionRules.$inferSelect;

export const telcoDecisionLogs = pgTable("telco_decision_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  ruleId: varchar("rule_id").notNull().references(() => telcoDecisionRules.id),
  profileId: varchar("profile_id").notNull().references(() => telcoProfiles.id),
  scoreId: varchar("score_id").references(() => telcoCreditScores.id),
  status: telcoDecisionStatusEnum("status").notNull(),
  riskScore: integer("risk_score").notNull(),
  riskTier: text("risk_tier").notNull(),
  creditLimitUsd: decimal("credit_limit_usd", { precision: 15, scale: 2 }),
  reasonCode: text("reason_code"),
  rejectionReasons: text("rejection_reasons"),
  disbursementRef: text("disbursement_ref"),
  smsNotificationSent: boolean("sms_notification_sent").default(false),
  applicantMsisdn: text("applicant_msisdn"),
  country: text("country"),
  organizationId: varchar("organization_id").references(() => organizations.id),
  decidedAt: timestamp("decided_at").defaultNow(),
});

export const insertTelcoDecisionLogSchema = createInsertSchema(telcoDecisionLogs).omit({ id: true, decidedAt: true });
export type InsertTelcoDecisionLog = z.infer<typeof insertTelcoDecisionLogSchema>;
export type TelcoDecisionLog = typeof telcoDecisionLogs.$inferSelect;

export const telcoLoanStatusEnum = pgEnum("telco_loan_status", [
  "pending_disbursement", "disbursed", "active", "repaying",
  "paid_off", "defaulted", "written_off", "restructured"
]);

export const telcoDisbursementStatusEnum = pgEnum("telco_disbursement_status", [
  "pending", "processing", "confirmed", "failed", "reversed"
]);

export const telcoRepaymentStatusEnum = pgEnum("telco_repayment_status", [
  "scheduled", "paid", "partial", "missed", "overdue", "waived"
]);

export const telcoConsentMethodEnum = pgEnum("telco_consent_method", [
  "ussd", "sms", "app", "web_portal", "agent", "ivr"
]);

export const telcoLoans = pgTable("telco_loans", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  profileId: varchar("profile_id").notNull().references(() => telcoProfiles.id),
  decisionLogId: varchar("decision_log_id").references(() => telcoDecisionLogs.id),
  scoreId: varchar("score_id").references(() => telcoCreditScores.id),
  loanAmount: decimal("loan_amount", { precision: 15, scale: 2 }).notNull(),
  currency: text("currency").notNull().default("GHS"),
  interestRate: decimal("interest_rate", { precision: 5, scale: 2 }).notNull().default("0"),
  fees: decimal("fees", { precision: 15, scale: 2 }).default("0"),
  totalRepayable: decimal("total_repayable", { precision: 15, scale: 2 }).notNull(),
  amountRepaid: decimal("amount_repaid", { precision: 15, scale: 2 }).default("0"),
  outstandingBalance: decimal("outstanding_balance", { precision: 15, scale: 2 }).notNull(),
  status: telcoLoanStatusEnum("status").notNull().default("pending_disbursement"),
  disbursementStatus: telcoDisbursementStatusEnum("disbursement_status").notNull().default("pending"),
  disbursementRef: text("disbursement_ref"),
  disbursementChannel: text("disbursement_channel").default("mobile_money"),
  disbursedAt: timestamp("disbursed_at"),
  tenorDays: integer("tenor_days").notNull().default(30),
  dueDate: timestamp("due_date"),
  daysInArrears: integer("days_in_arrears").default(0),
  repaymentFrequency: text("repayment_frequency").default("lump_sum"),
  installmentCount: integer("installment_count").default(1),
  nextPaymentDate: timestamp("next_payment_date"),
  lastPaymentDate: timestamp("last_payment_date"),
  closedAt: timestamp("closed_at"),
  closureReason: text("closure_reason"),
  country: text("country"),
  organizationId: varchar("organization_id").references(() => organizations.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertTelcoLoanSchema = createInsertSchema(telcoLoans).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertTelcoLoan = z.infer<typeof insertTelcoLoanSchema>;
export type TelcoLoan = typeof telcoLoans.$inferSelect;

export const telcoLoanRepayments = pgTable("telco_loan_repayments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  loanId: varchar("loan_id").notNull().references(() => telcoLoans.id),
  profileId: varchar("profile_id").notNull().references(() => telcoProfiles.id),
  installmentNumber: integer("installment_number").default(1),
  amountDue: decimal("amount_due", { precision: 15, scale: 2 }).notNull(),
  amountPaid: decimal("amount_paid", { precision: 15, scale: 2 }).default("0"),
  status: telcoRepaymentStatusEnum("status").notNull().default("scheduled"),
  paymentMethod: text("payment_method").default("mobile_money"),
  paymentRef: text("payment_ref"),
  dueDate: timestamp("due_date").notNull(),
  paidAt: timestamp("paid_at"),
  daysLate: integer("days_late").default(0),
  currency: text("currency").notNull().default("GHS"),
  country: text("country"),
  organizationId: varchar("organization_id").references(() => organizations.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertTelcoLoanRepaymentSchema = createInsertSchema(telcoLoanRepayments).omit({ id: true, createdAt: true });
export type InsertTelcoLoanRepayment = z.infer<typeof insertTelcoLoanRepaymentSchema>;
export type TelcoLoanRepayment = typeof telcoLoanRepayments.$inferSelect;

export const telcoConsentEvents = pgTable("telco_consent_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  profileId: varchar("profile_id").notNull().references(() => telcoProfiles.id),
  action: text("action").notNull(),
  method: telcoConsentMethodEnum("method").notNull().default("web_portal"),
  purpose: text("purpose").notNull().default("credit_scoring"),
  dataScope: text("data_scope").default("momo_transactions,sim_data,kyc_data"),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  consentReceiptId: text("consent_receipt_id"),
  validUntil: timestamp("valid_until"),
  revokedAt: timestamp("revoked_at"),
  country: text("country"),
  organizationId: varchar("organization_id").references(() => organizations.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertTelcoConsentEventSchema = createInsertSchema(telcoConsentEvents).omit({ id: true, createdAt: true });
export type InsertTelcoConsentEvent = z.infer<typeof insertTelcoConsentEventSchema>;
export type TelcoConsentEvent = typeof telcoConsentEvents.$inferSelect;

export const consumerAccounts = pgTable("consumer_accounts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  nationalId: text("national_id").notNull().unique(),
  phone: text("phone"),
  email: text("email"),
  passwordHash: text("password_hash"),
  dateOfBirth: text("date_of_birth"),
  fullName: text("full_name"),
  googleId: text("google_id").unique(),
  appleId: text("apple_id").unique(),
  authProvider: text("auth_provider").default("local"),
  profilePicture: text("profile_picture"),
  verified: boolean("verified").default(false),
  otpCode: text("otp_code"),
  otpExpiresAt: timestamp("otp_expires_at"),
  emailToken: text("email_token"),
  emailTokenExpiresAt: timestamp("email_token_expires_at"),
  verificationMethod: text("verification_method").default("sms"),
  failedAttempts: integer("failed_attempts").default(0),
  lockedUntil: timestamp("locked_until"),
  lastLogin: timestamp("last_login"),
  createdAt: timestamp("created_at").defaultNow(),
});
export const insertConsumerAccountSchema = createInsertSchema(consumerAccounts).omit({ id: true, createdAt: true, lastLogin: true, failedAttempts: true, lockedUntil: true, otpCode: true, otpExpiresAt: true, verified: true, emailToken: true, emailTokenExpiresAt: true, verificationMethod: true });
export type InsertConsumerAccount = z.infer<typeof insertConsumerAccountSchema>;
export type ConsumerAccount = typeof consumerAccounts.$inferSelect;
