import { eq, desc, like, or, and, sql, count, ilike, inArray, gte, lt } from "drizzle-orm";
import crypto from "crypto";
import { db } from "./db";
import { sendPushToConsumerAccount } from "./push-notifications";
import { encryptBorrowerPII, decryptBorrowerPII, decryptBorrowerArray } from "./encryption";
import {
  users, borrowers, creditAccounts, creditInquiries, auditLogs, pendingApprovals, disputes, notifications,
  courtJudgments, consentRecords, paymentHistory, creditScoreHistory, consumerScoreHistory, institutions, billingRecords, creditReportLogs, apiKeys,
  exchangeRates, retentionPolicies, apiConfigurations, organizations, dishonouredCheques, borrowerAlerts,
  contactEvents, linkClusters, assetTraceRecords, collectionAssignments, collectionAttempts, collectionSlaSettings,
  type ContactEvent, type LinkCluster, type AssetTraceRecord,
  type CollectionAssignment, type InsertCollectionAssignment,
  type CollectionAttempt, type InsertCollectionAttempt,
  type CollectionSlaSettings, type InsertCollectionSlaSettings,
  guarantors, telcoProfiles, momoTransactions, telcoCreditScores,
  telcoDecisionRules, telcoDecisionLogs,
  telcoLoans, telcoLoanRepayments, telcoConsentEvents,
  type User, type InsertUser,
  type Organization, type InsertOrganization,
  type Borrower, type InsertBorrower,
  type TelcoProfile, type InsertTelcoProfile,
  type MomoTransaction, type InsertMomoTransaction,
  type TelcoCreditScore, type InsertTelcoCreditScore,
  type TelcoDecisionRule, type InsertTelcoDecisionRule,
  type TelcoDecisionLog, type InsertTelcoDecisionLog,
  type TelcoLoan, type InsertTelcoLoan,
  type TelcoLoanRepayment, type InsertTelcoLoanRepayment,
  type TelcoConsentEvent, type InsertTelcoConsentEvent,
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
  type DishonouredCheque, type InsertDishonouredCheque,
  type BorrowerAlert, type InsertBorrowerAlert,
  type Guarantor, type InsertGuarantor,
  identityVerifications, watchlistHits, fraudAlerts,
  type IdentityVerification, type InsertIdentityVerification,
  type WatchlistHit, type InsertWatchlistHit,
  type FraudAlert, type InsertFraudAlert,
  incomeSources, expenseCategorisations, affordabilityAssessments,
  type IncomeSource, type InsertIncomeSource,
  type ExpenseCategorisation, type InsertExpenseCategorisation,
  type AffordabilityAssessment, type InsertAffordabilityAssessment,
  linkedOpenBankingAccounts,
  type LinkedOpenBankingAccount, type InsertLinkedOpenBankingAccount,
  registryHealthConfig,
  type RegistryHealthConfig, type InsertRegistryHealthConfig,
  registryThresholdOverrides,
  type RegistryThresholdOverride,
  registryHealthEvents,
  type RegistryHealthEvent, type InsertRegistryHealthEvent,
  trainingAttempts,
  type TrainingAttempt, type InsertTrainingAttempt,
  loanApplications, loanRepaymentSchedules, collateralItems, collateralShareLog, collateralRejectionHistory, collateralAmendments, institutionBranding,
  registryCountryConfig, collateralAmendmentRequests,
  type LoanApplication, type InsertLoanApplication,
  type LoanRepaymentSchedule, type InsertLoanRepaymentSchedule,
  type CollateralItem, type InsertCollateralItem,
  type CollateralShareLog, type InsertCollateralShareLog,
  type CollateralRejectionHistory, type InsertCollateralRejectionHistory,
  type CollateralAmendment, type InsertCollateralAmendment,
  type InstitutionBranding, type InsertInstitutionBranding,
  type RegistryCountryConfig, type InsertRegistryCountryConfig,
  type CollateralAmendmentRequest, type InsertCollateralAmendmentRequest,
  lotoMerchants, lotoReceipts, crossProductConsents, alternativeData,
  type LotoMerchant, type LotoReceipt, type CrossProductConsent,
  type InsertLotoMerchant, type InsertLotoReceipt, type InsertCrossProductConsent,
  lotoCountryDrawConfig, lotoDraws, lotoDrawPrizeTiers, lotoDrawWinners, lotoPayouts,
  type LotoCountryDrawConfig, type InsertLotoCountryDrawConfig,
  type LotoDraw, type InsertLotoDraw,
  type LotoDrawPrizeTier, type InsertLotoDrawPrizeTier,
  type LotoDrawWinner, type LotoPayout,
  portfolioTriggerSubscriptions, portfolioTriggerEvents,
  consumerMonitoringPrefs, consumerMonitoringAlerts, consumerAccounts,
  type PortfolioTriggerSubscription, type InsertPortfolioTriggerSubscription,
  type PortfolioTriggerEvent, type InsertPortfolioTriggerEvent,
  type ConsumerMonitoringPrefs, type InsertConsumerMonitoringPrefs,
  type ConsumerMonitoringAlert, type InsertConsumerMonitoringAlert,
} from "@shared/schema";

export const GLOBAL_SCOPE = "__global__" as const;
export type CountryScope = string | string[] | typeof GLOBAL_SCOPE | undefined;

export function isGlobalScope(country: CountryScope): boolean {
  return country === GLOBAL_SCOPE;
}

export function requireCountryScope(country: CountryScope, methodName: string): void {
  if (country === GLOBAL_SCOPE) return;
  if (!country || (Array.isArray(country) && country.length === 0)) {
    throw new Error(`Country scope required for ${methodName}`);
  }
}

export function requireDataScope(organizationId: string | undefined, country: string | undefined, methodName: string): void {
  if (!organizationId && !country) {
    throw new Error(`Data scope required for ${methodName}. Pass organizationId or country to ensure data isolation.`);
  }
}

export interface IStorage {
  getOrganizations(country?: string): Promise<Organization[]>;
  getOrganization(id: string): Promise<Organization | undefined>;
  getOrganizationBySlug(slug: string): Promise<Organization | undefined>;
  createOrganization(org: InsertOrganization): Promise<Organization>;
  updateOrganization(id: string, data: Partial<InsertOrganization>): Promise<Organization | undefined>;
  deleteOrganization(id: string): Promise<boolean>;

  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getUsers(organizationId: string | undefined, country: string): Promise<User[]>;
  updateUser(id: string, data: Partial<InsertUser>): Promise<User | undefined>;
  deleteUser(id: string): Promise<boolean>;
  incrementFailedAttempts(userId: string): Promise<void>;
  resetFailedAttempts(userId: string): Promise<void>;
  lockUser(userId: string, until: Date): Promise<void>;
  updateLastLogin(userId: string): Promise<void>;

  getBorrower(id: string): Promise<Borrower | undefined>;
  getBorrowers(page?: number, limit?: number, organizationId?: string, country?: string | string[], recentDays?: number): Promise<{ data: Borrower[]; total: number }>;
  getAllBorrowersForExport(organizationId?: string, country?: string | string[]): Promise<Borrower[]>;
  getBorrowersByType(type: "individual" | "corporate", page?: number, limit?: number, organizationId?: string, country?: string | string[], recentDays?: number): Promise<{ data: Borrower[]; total: number }>;
  searchBorrowersByType(type: "individual" | "corporate", query: string, organizationId?: string, country?: string | string[]): Promise<Borrower[]>;
  searchBorrowers(query: string, organizationId?: string, country?: string | string[]): Promise<Borrower[]>;
  countBorrowersByNationalId(nationalId: string | null): Promise<number>;
  globalSearch(query: string, organizationId?: string, country?: string | string[]): Promise<{ borrowers: Borrower[]; institutions: Institution[]; creditAccounts: CreditAccount[]; telcoProfiles: TelcoProfile[] }>;
  createBorrower(borrower: InsertBorrower): Promise<Borrower>;
  updateBorrower(id: string, data: Partial<InsertBorrower>): Promise<Borrower | undefined>;

  getCreditAccount(id: string): Promise<CreditAccount | undefined>;
  getCreditAccountsByBorrower(borrowerId: string): Promise<CreditAccount[]>;
  getAllCreditAccounts(organizationId?: string, country?: string, limit?: number, offset?: number, recentDays?: number): Promise<CreditAccount[]>;
  createCreditAccount(account: InsertCreditAccount): Promise<CreditAccount>;
  updateCreditAccount(id: string, data: Partial<InsertCreditAccount>): Promise<CreditAccount | undefined>;

  getCreditInquiriesByBorrower(borrowerId: string): Promise<CreditInquiry[]>;
  getAllCreditInquiries(organizationId?: string, country?: string, limit?: number, offset?: number): Promise<CreditInquiry[]>;
  createCreditInquiry(inquiry: InsertCreditInquiry): Promise<CreditInquiry>;

  getAuditLogs(organizationId?: string, country?: string, limit?: number, offset?: number): Promise<AuditLog[]>;
  createAuditLog(log: InsertAuditLog): Promise<AuditLog>;
  getAuditStats(organizationId?: string, country?: string): Promise<{
    totalLogs: number; actionsToday: number; uniqueUsersToday: number; totalUniqueUsers: number;
    topActions: { action: string; count: number }[];
    topEntities: { entity: string; count: number }[];
    uniqueActions: string[];
    uniqueEntities: string[];
  }>;
  verifyAuditIntegrity(): Promise<{ valid: boolean; totalChecked: number; brokenAt?: string; brokenAtIndex?: number; reason?: string }>;
  repairAuditChain(): Promise<{ repairedCount: number; totalLogs: number }>;
  fuzzyMatchBorrowers(params: { firstName?: string; lastName?: string; nationalId?: string; companyName?: string; passportNumber?: string; tinNumber?: string }): Promise<Array<any>>;
  structuredSearch(params: {
    searchType: "consumer" | "business" | "telco";
    ghanaCardNumber?: string;
    firstName?: string;
    middleName?: string;
    lastName?: string;
    dateOfBirth?: string;
    mobileNumber?: string;
    gender?: string;
    email?: string;
    nationalId?: string;
    registrationNumber?: string;
    tinNumber?: string;
    companyName?: string;
    msisdn?: string;
    provider?: string;
    accountStatus?: string;
  }, organizationId?: string, country?: string): Promise<Borrower[] | TelcoProfile[]>;

  getPendingApprovals(organizationId: string | undefined, country: string, recentDays?: number): Promise<PendingApproval[]>;
  getPendingApproval(id: string): Promise<PendingApproval | undefined>;
  createPendingApproval(approval: InsertPendingApproval): Promise<PendingApproval>;
  updateApprovalStatus(id: string, status: string, reviewedBy: string, reviewNotes?: string): Promise<PendingApproval | undefined>;

  getDisputes(organizationId: string | undefined, country: string, recentDays?: number): Promise<Dispute[]>;
  getDisputesByBorrower(borrowerId: string): Promise<Dispute[]>;
  getDispute(id: string): Promise<Dispute | undefined>;
  createDispute(dispute: InsertDispute): Promise<Dispute>;
  updateDispute(id: string, data: Partial<{ status: string; resolution: string }>): Promise<Dispute | undefined>;

  getNotifications(userId: string, country: string): Promise<Notification[]>;
  getUnreadNotificationCount(userId: string, country: string): Promise<number>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationRead(id: string): Promise<void>;
  markAllNotificationsRead(userId: string): Promise<void>;
  updatePasswordChangedAt(userId: string): Promise<void>;
  getRelatedBorrowers(borrowerId: string): Promise<Borrower[]>;
  getUsersByRole(...roles: string[]): Promise<User[]>;

  getCourtJudgmentsByBorrower(borrowerId: string): Promise<CourtJudgment[]>;
  getAllCourtJudgments(organizationId: string | undefined, country: string, recentDays?: number): Promise<CourtJudgment[]>;
  createCourtJudgment(judgment: InsertCourtJudgment): Promise<CourtJudgment>;

  getConsentRecordsByBorrower(borrowerId: string): Promise<ConsentRecord[]>;
  getAllConsentRecords(organizationId: string | undefined, country: string): Promise<ConsentRecord[]>;
  getConsentRecord(id: string): Promise<ConsentRecord | undefined>;
  createConsentRecord(record: InsertConsentRecord): Promise<ConsentRecord>;
  revokeConsent(id: string): Promise<ConsentRecord | undefined>;

  getPaymentHistoryByAccount(creditAccountId: string): Promise<PaymentHistory[]>;
  createPaymentHistory(entry: InsertPaymentHistory): Promise<PaymentHistory>;

  getInstitutions(page?: number, limit?: number, organizationId?: string, country?: string): Promise<{ data: Institution[]; total: number }>; /* COUNTRY_SCOPED: country enforced at runtime via requireCountryScope */
  getInstitution(id: string): Promise<Institution | undefined>;
  createInstitution(inst: InsertInstitution): Promise<Institution>;
  updateInstitution(id: string, data: Partial<InsertInstitution>): Promise<Institution | undefined>;
  approveInstitution(id: string, approvedBy: string): Promise<Institution | undefined>;

  getBillingRecords(organizationId: string | undefined, country: string, recentDays?: number): Promise<BillingRecord[]>;
  getBillingRecord(id: string): Promise<BillingRecord | undefined>;
  getBillingRecordsByInstitution(institutionName: string, country: string): Promise<BillingRecord[]>;
  createBillingRecord(record: InsertBillingRecord): Promise<BillingRecord>;
  updateBillingRecordStatus(id: string, status: "pending" | "paid" | "overdue"): Promise<BillingRecord | undefined>;

  getCreditReportLogs(organizationId: string | undefined, country: string): Promise<CreditReportLog[]>;
  getCreditReportLogsByBorrower(borrowerId: string): Promise<CreditReportLog[]>;
  createCreditReportLog(log: InsertCreditReportLog): Promise<CreditReportLog>;

  getDashboardStats(organizationId: string | undefined, country: string): Promise<{
    totalBorrowers: number;
    totalAccounts: number;
    totalInquiries: number;
    totalOutstanding: string;
    outstandingByCurrency: { currency: string; total: string }[];
    delinquentAccounts: number;
    defaultAccounts: number;
    pendingApprovalCount: number;
    openDisputeCount: number;
  }>;
  getDashboardDetails(type: string, organizationId?: string, country?: string): Promise<Record<string, any>>;

  getApiKeysByInstitution(institutionId: string): Promise<ApiKey[]>;
  getAllApiKeys(): Promise<ApiKey[]>;
  getApiKeyByHash(keyHash: string): Promise<ApiKey | undefined>;
  createApiKey(key: InsertApiKey): Promise<ApiKey>;
  revokeApiKey(id: string): Promise<ApiKey | undefined>;
  updateApiKeyLastUsed(id: string): Promise<void>;
  getInstitutionByName(name: string): Promise<Institution | undefined>;

  /* GLOBAL: no country filter by design — exchange rates are system-wide */
  getExchangeRates(): Promise<ExchangeRate[]>;
  createExchangeRate(data: InsertExchangeRate): Promise<ExchangeRate>;
  updateExchangeRate(id: string, data: Partial<InsertExchangeRate>): Promise<ExchangeRate | undefined>;
  deleteExchangeRate(id: string): Promise<boolean>;
  convertCurrency(amount: number, fromCurrency: string, toCurrency: string): Promise<{ convertedAmount: number; rate: number } | null>;

  getRetentionPolicies(country: string): Promise<RetentionPolicy[]>;
  createRetentionPolicy(data: InsertRetentionPolicy): Promise<RetentionPolicy>;
  updateRetentionPolicy(id: string, data: Partial<InsertRetentionPolicy>): Promise<RetentionPolicy | undefined>;
  deleteRetentionPolicy(id: string): Promise<boolean>;

  getApiConfigurations(country: string): Promise<ApiConfiguration[]>;
  getApiConfiguration(id: string): Promise<ApiConfiguration | undefined>;
  createApiConfiguration(data: InsertApiConfiguration): Promise<ApiConfiguration>;
  updateApiConfiguration(id: string, data: Partial<InsertApiConfiguration>): Promise<ApiConfiguration | undefined>;
  deleteApiConfiguration(id: string): Promise<boolean>;

  getDishonouredChequesByBorrower(borrowerId: string): Promise<DishonouredCheque[]>;
  getAllDishonouredCheques(organizationId: string | undefined, country: string, recentDays?: number): Promise<DishonouredCheque[]>;
  createDishonouredCheque(cheque: InsertDishonouredCheque): Promise<DishonouredCheque>;

  getGuarantorsByAccount(creditAccountId: string): Promise<Guarantor[]>;
  createGuarantor(guarantor: InsertGuarantor): Promise<Guarantor>;
  getGuarantorsByBorrower(borrowerId: string, country: string): Promise<Guarantor[]>;

  getBorrowerAlerts(organizationId?: string, country?: string | string[], recentDays?: number): Promise<BorrowerAlert[]>;
  getBorrowerAlertsByBorrower(borrowerId: string): Promise<BorrowerAlert[]>;
  createBorrowerAlert(alert: InsertBorrowerAlert): Promise<BorrowerAlert>;

  getTelcoProfiles(organizationId?: string, country?: string, options?: { page?: number; limit?: number; search?: string; provider?: string; kycLevel?: string; accountStatus?: string }): Promise<{ data: TelcoProfile[]; total: number; page: number; totalPages: number }>;
  getTelcoProfile(id: string): Promise<TelcoProfile | undefined>;
  getTelcoProfileByMsisdn(msisdn: string): Promise<TelcoProfile | undefined>;
  createTelcoProfile(profile: InsertTelcoProfile): Promise<TelcoProfile>;
  getMomoTransactions(profileId: string): Promise<MomoTransaction[]>;
  createMomoTransactions(transactions: InsertMomoTransaction[]): Promise<MomoTransaction[]>;
  getTelcoCreditScores(organizationId?: string, country?: string, options?: { page?: number; limit?: number; riskTier?: string; approved?: string; search?: string; provider?: string }): Promise<{ data: TelcoCreditScore[]; total: number; page: number; totalPages: number }>;
  getTelcoCreditScoresByProfile(profileId: string): Promise<TelcoCreditScore[]>;
  createTelcoCreditScore(score: InsertTelcoCreditScore): Promise<TelcoCreditScore>;
  getTelcoDashboardStats(organizationId?: string, country?: string): Promise<{ totalProfiles: number; totalScores: number; avgRiskScore: number; approvalRate: number; tierBreakdown: Record<string, number> }>;
  getTelcoAnalyticsAggregates(organizationId?: string, country?: string): Promise<{
    countryBreakdown: Record<string, { profiles: number; scored: number; approved: number; totalVolume: number }>;
    monthlyVolume: { month: string; scored: number; approved: number; declined: number }[];
    providerBreakdown: Record<string, number>;
    totalScored: number; totalApproved: number; totalCreditExtended: number;
  }>;
  getAllTelcoProfileIds(organizationId?: string, country?: string, kycLevel?: string): Promise<string[]>;
  getDecisionRules(organizationId: string | undefined, country: string): Promise<TelcoDecisionRule[]>;
  getDecisionRule(id: string): Promise<TelcoDecisionRule | undefined>;
  getActiveDecisionRule(organizationId?: string, country?: string): Promise<TelcoDecisionRule | undefined>;
  createDecisionRule(rule: InsertTelcoDecisionRule): Promise<TelcoDecisionRule>;
  updateDecisionRule(id: string, updates: Partial<InsertTelcoDecisionRule>): Promise<TelcoDecisionRule>;
  getDecisionLogs(organizationId: string | undefined, country: string, limit?: number): Promise<TelcoDecisionLog[]>;
  createDecisionLog(log: InsertTelcoDecisionLog): Promise<TelcoDecisionLog>;

  getTelcoLoans(organizationId?: string, country?: string, options?: { page?: number; limit?: number; status?: string; profileId?: string; profileIds?: string[] }): Promise<{ data: TelcoLoan[]; total: number; page: number; totalPages: number }>;
  getTelcoLoan(id: string): Promise<TelcoLoan | undefined>;
  createTelcoLoan(loan: InsertTelcoLoan): Promise<TelcoLoan>;
  updateTelcoLoan(id: string, updates: Partial<InsertTelcoLoan>): Promise<TelcoLoan>;
  getTelcoLoansByProfile(profileId: string): Promise<TelcoLoan[]>;
  getTelcoLoanPortfolioStats(organizationId?: string, country?: string): Promise<{
    totalDisbursed: number; totalOutstanding: number; totalRepaid: number;
    activeLoans: number; defaultedLoans: number; paidOffLoans: number;
    defaultRate: number; collectionRate: number;
    par30: number; par60: number; par90: number;
    avgLoanSize: number; totalLoans: number;
  }>;

  getTelcoLoanRepayments(loanId: string): Promise<TelcoLoanRepayment[]>;
  createTelcoLoanRepayment(repayment: InsertTelcoLoanRepayment): Promise<TelcoLoanRepayment>;
  updateTelcoLoanRepayment(id: string, updates: Partial<InsertTelcoLoanRepayment>): Promise<TelcoLoanRepayment>;

  getTelcoConsentEvents(profileId: string): Promise<TelcoConsentEvent[]>;
  createTelcoConsentEvent(event: InsertTelcoConsentEvent): Promise<TelcoConsentEvent>;
  getTelcoConsentSummary(organizationId?: string, country?: string): Promise<{ total: number; active: number; revoked: number; byMethod: Record<string, number> }>;

  getCollectionSlaSettings(organizationId: string | undefined, country: string, segment?: string | null): Promise<CollectionSlaSettings | undefined>;
  getCollectionSlaSettingsById(id: string): Promise<CollectionSlaSettings | undefined>;
  listCollectionSlaSettings(organizationId: string | undefined, country: string): Promise<CollectionSlaSettings[]>;
  upsertCollectionSlaSettings(data: InsertCollectionSlaSettings): Promise<CollectionSlaSettings>;
  deleteCollectionSlaSettings(id: string): Promise<void>;
  getOverdueCollectionAssignments(thresholdDays: number, priority: string, organizationId?: string, country?: string, segment?: string | null): Promise<CollectionAssignment[]>;
  getOverdueCollectionAssignmentDetails(thresholds: Record<string, number>, organizationId?: string, country?: string): Promise<OverdueAssignmentDetail[]>;
  countActiveAssignmentsBySegment(organizationId: string | undefined, country: string): Promise<Record<string, number>>;

  getRegistryHealthConfig(): Promise<RegistryHealthConfig | undefined>;
  upsertRegistryHealthConfig(data: Partial<InsertRegistryHealthConfig>, updatedBy?: string): Promise<RegistryHealthConfig>;

  getAllRegistryThresholdOverrides(): Promise<RegistryThresholdOverride[]>;
  upsertRegistryThresholdOverride(provider: string, data: { criticalFail7d: number | null; criticalStreak30d: number | null }, updatedBy?: string): Promise<RegistryThresholdOverride>;
  deleteRegistryThresholdOverride(provider: string): Promise<void>;

  insertRegistryHealthEvent(event: InsertRegistryHealthEvent): Promise<RegistryHealthEvent>;
  getRegistryHealthEvents(provider: string, sinceDays?: number): Promise<RegistryHealthEvent[]>;
  getAllRegistryHealthEvents(sinceDays?: number): Promise<RegistryHealthEvent[]>;
  deleteOldRegistryHealthEvents(beforeDate: Date): Promise<number>;
  countOldRegistryHealthEvents(beforeDate: Date): Promise<number>;

  // ─── Affordability & Income Verification (Task #28) ───────────────────────
  getIncomeSourcesByBorrower(borrowerId: string): Promise<IncomeSource[]>;
  createIncomeSource(source: InsertIncomeSource): Promise<IncomeSource>;
  deleteIncomeSourcesByBorrower(borrowerId: string): Promise<void>;
  getExpenseCategorisationsByBorrower(borrowerId: string): Promise<ExpenseCategorisation[]>;
  createExpenseCategorisation(exp: InsertExpenseCategorisation): Promise<ExpenseCategorisation>;
  deleteExpenseCategorisationsByBorrower(borrowerId: string): Promise<void>;
  getAffordabilityAssessmentsByBorrower(borrowerId: string): Promise<AffordabilityAssessment[]>;
  getLatestAffordabilityAssessment(borrowerId: string): Promise<AffordabilityAssessment | undefined>;
  createAffordabilityAssessment(a: InsertAffordabilityAssessment): Promise<AffordabilityAssessment>;
  // Linked open-banking accounts
  getLinkedOpenBankingAccounts(borrowerId: string): Promise<LinkedOpenBankingAccount[]>;
  getActiveLinkedOpenBankingAccount(borrowerId: string, provider?: string): Promise<LinkedOpenBankingAccount | undefined>;
  createLinkedOpenBankingAccount(data: InsertLinkedOpenBankingAccount): Promise<LinkedOpenBankingAccount>;
  revokeLinkedOpenBankingAccount(id: string): Promise<void>;

  createTrainingAttempt(data: InsertTrainingAttempt): Promise<TrainingAttempt>;
  getUserTrainingAttempts(userId: string): Promise<TrainingAttempt[]>;
  getBestTrainingAttempts(userId: string): Promise<TrainingAttempt[]>;

  // Loan Origination
  getLoanApplications(organizationId?: string, status?: string): Promise<LoanApplication[]>;
  getLoanApplication(id: string): Promise<LoanApplication | undefined>;
  createLoanApplication(data: InsertLoanApplication): Promise<LoanApplication>;
  updateLoanApplication(id: string, data: Partial<InsertLoanApplication>): Promise<LoanApplication | undefined>;
  getRepaymentSchedule(loanApplicationId: string): Promise<LoanRepaymentSchedule[]>;
  createRepaymentSchedules(schedules: InsertLoanRepaymentSchedule[]): Promise<LoanRepaymentSchedule[]>;
  markInstallmentPaid(id: string, paidAmount: string): Promise<LoanRepaymentSchedule | undefined>;

  // Collateral Registry
  getCollateralItems(organizationId?: string, borrowerId?: string): Promise<(CollateralItem & { shareCount: number })[]>;
  getCollateralItem(id: string): Promise<CollateralItem | undefined>;
  getActiveResubmissionFor(originalId: string): Promise<CollateralItem | undefined>;
  createCollateralItem(data: InsertCollateralItem): Promise<CollateralItem>;
  updateCollateralItem(id: string, data: Partial<InsertCollateralItem>): Promise<CollateralItem | undefined>;
  // Pan-African Registry Authority methods
  getPendingCollateralItems(registryAuthorityId: string, countryCode?: string): Promise<CollateralItem[]>;
  getActiveLiensByCountry(countryCode: string): Promise<CollateralItem[]>;
  searchLiensByAssetId(assetIdentifier: string, countryCode: string): Promise<CollateralItem[]>;
  getSubmissionRankForAsset(id: string, panAfricanAssetId: string | null, assetLocalIdentifier: string | null, countryCode: string): Promise<number>;
  approveCollateralItem(id: string, approvedBy: string, certificateNumber: string, lienPriority: number): Promise<CollateralItem | undefined>;
  rejectCollateralItem(id: string, rejectionReason: string, rejectedBy?: string): Promise<CollateralItem | undefined>;
  getCollateralRejectionHistory(collateralItemId: string): Promise<CollateralRejectionHistory[]>;
  enforceCollateralItem(id: string): Promise<CollateralItem | undefined>;
  dischargeCollateralItem(id: string): Promise<CollateralItem | undefined>;
  createCollateralShareLog(data: InsertCollateralShareLog): Promise<CollateralShareLog>;
  getCollateralShareLog(collateralItemId: string): Promise<(CollateralShareLog & { senderName: string | null })[]>;
  createCollateralAmendment(data: InsertCollateralAmendment): Promise<CollateralAmendment>;
  getCollateralAmendments(collateralItemId: string): Promise<CollateralAmendment[]>;
  getCollateralRegulatoryReport(countryCode: string): Promise<{
    totalActive: number; totalValue: number;
    byInstitution: { orgId: string; orgName: string; count: number; value: number }[];
    byAssetType: { type: string; count: number; value: number }[];
    bySector: { sector: string; count: number; value: number }[];
  }>;
  // Registry Country Config
  getRegistryCountryConfigs(): Promise<RegistryCountryConfig[]>;
  getRegistryCountryConfig(countryCode: string): Promise<RegistryCountryConfig | undefined>;
  upsertRegistryCountryConfig(data: InsertRegistryCountryConfig): Promise<RegistryCountryConfig>;
  linkRegistryAuthorityToCountry(countryCode: string, orgId: string): Promise<void>;

  // Institution Branding
  getInstitutionBranding(organizationId: string): Promise<InstitutionBranding | undefined>;
  upsertInstitutionBranding(data: InsertInstitutionBranding): Promise<InstitutionBranding>;

  // Institution Analytics
  getUsageStats(organizationId: string, days: number): Promise<{ eventType: string; count: number; date: string }[]>;

  // Portfolio Trigger Alerts
  getPortfolioTriggerSubscriptions(organizationId: string): Promise<PortfolioTriggerSubscription[]>;
  getPortfolioTriggerSubscription(id: string): Promise<PortfolioTriggerSubscription | undefined>;
  getPortfolioTriggerSubscriptionByBorrower(organizationId: string, borrowerId: string): Promise<PortfolioTriggerSubscription | undefined>;
  createPortfolioTriggerSubscription(data: InsertPortfolioTriggerSubscription): Promise<PortfolioTriggerSubscription>;
  updatePortfolioTriggerSubscription(id: string, data: Partial<InsertPortfolioTriggerSubscription>): Promise<PortfolioTriggerSubscription | undefined>;
  deletePortfolioTriggerSubscription(id: string): Promise<boolean>;
  getPortfolioTriggerEvents(organizationId: string, limit?: number): Promise<PortfolioTriggerEvent[]>;
  createPortfolioTriggerEvent(data: InsertPortfolioTriggerEvent): Promise<PortfolioTriggerEvent>;
  acknowledgePortfolioTriggerEvent(id: string): Promise<PortfolioTriggerEvent | undefined>;
  firePortfolioTriggers(borrowerId: string, eventType: string, eventData: object): Promise<number>;
  getAccountTrends(creditAccountId: string): Promise<{ period: string; amountDue: string; amountPaid: string; status: string; daysLate: number }[]>;
  getBorrowerTrendSummary(borrowerId: string): Promise<{ scoreHistory: { score: number; createdAt: Date }[]; accountCount: number; activeDelinquencies: number; balanceTrend: string }>;
  recordConsumerScoreHistory(nationalId: string, borrowerId: string | null, score: number): Promise<void>;

  // Consumer Monitoring
  getConsumerMonitoringPrefs(consumerAccountId: string): Promise<ConsumerMonitoringPrefs | undefined>;
  upsertConsumerMonitoringPrefs(data: InsertConsumerMonitoringPrefs): Promise<ConsumerMonitoringPrefs>;
  getConsumerMonitoringAlerts(consumerAccountId: string, limit?: number): Promise<ConsumerMonitoringAlert[]>;
  createConsumerMonitoringAlert(data: InsertConsumerMonitoringAlert): Promise<ConsumerMonitoringAlert>;
  markConsumerMonitoringAlertRead(id: string, consumerAccountId: string): Promise<boolean>;
  markAllConsumerMonitoringAlertsRead(consumerAccountId: string): Promise<number>;
  fireConsumerMonitoringAlerts(borrowerId: string, alertType: string, title: string, message: string, details?: object): Promise<number>;

  // Collateral Amendment Requests
  createCollateralAmendmentRequest(data: InsertCollateralAmendmentRequest): Promise<CollateralAmendmentRequest>;
  getCollateralAmendmentRequests(countryCode?: string, lenderOrganizationId?: string): Promise<(CollateralAmendmentRequest & { registrationNumber?: string; collateralType?: string; lenderOrgName?: string; requesterName?: string })[]>;
  getCollateralAmendmentRequestsForItem(collateralItemId: string): Promise<CollateralAmendmentRequest[]>;
  approveCollateralAmendmentRequest(requestId: string, reviewedBy: string): Promise<CollateralAmendmentRequest | { error: "not_found" | "not_pending" | "invalid_data" | "collateral_not_approved" }>;
  rejectCollateralAmendmentRequest(requestId: string, reviewedBy: string, reviewNotes: string): Promise<CollateralAmendmentRequest | { error: "not_found" | "not_pending" }>;

  // ── Cross-Product Bridge ─────────────────────────────────────────────
  getLotoMerchantById(id: string): Promise<LotoMerchant | undefined>;
  getLotoMerchantByUserId(userId: string): Promise<LotoMerchant | undefined>;
  getLotoMerchantByBorrowerId(borrowerId: string): Promise<LotoMerchant | undefined>;
  createLotoMerchant(input: InsertLotoMerchant): Promise<LotoMerchant>;
  getLotoMerchantByShopNameAndCountry(shopName: string, countryCode: string): Promise<LotoMerchant | undefined>;
  countLotoReceiptsByConsumer(userId: string): Promise<number>;
  updateLotoMerchantOptIn(id: string, optIn: boolean): Promise<LotoMerchant | undefined>;
  listLotoMerchants(limit?: number): Promise<LotoMerchant[]>;
  listLotoReceiptsByMerchant(merchantId: string, limit?: number): Promise<LotoReceipt[]>;
  listLotoReceiptsByConsumer(userId: string, limit?: number): Promise<LotoReceipt[]>;
  createLotoReceipt(input: InsertLotoReceipt): Promise<LotoReceipt>;
  // ── Loto Draw Engine (Task #283) ─────────────────────────────────────
  getLotoCountryDrawConfig(countryCode: string): Promise<LotoCountryDrawConfig | undefined>;
  upsertLotoCountryDrawConfig(input: InsertLotoCountryDrawConfig): Promise<LotoCountryDrawConfig>;
  listLotoCountryDrawConfigs(): Promise<LotoCountryDrawConfig[]>;
  getLotoDraw(id: string): Promise<LotoDraw | undefined>;
  listLotoDraws(filter?: { countryCode?: string; limit?: number }): Promise<LotoDraw[]>;
  listScheduledLotoDrawsDue(now: Date): Promise<LotoDraw[]>;
  getNextLotoDrawNumber(countryCode: string): Promise<number>;
  createLotoDrawWithTiers(input: {
    draw: InsertLotoDraw & { serverSeed: string; serverNonce: string };
    tiers: Omit<InsertLotoDrawPrizeTier, "drawId">[];
  }): Promise<{ draw: LotoDraw; tiers: LotoDrawPrizeTier[] }>;
  listLotoDrawPrizeTiers(drawId: string): Promise<LotoDrawPrizeTier[]>;
  listLotoDrawWinners(drawId: string): Promise<LotoDrawWinner[]>;
  getEligibleReceiptsForDraw(countryCode: string, periodStart: Date, periodEnd: Date): Promise<LotoReceipt[]>;
  persistLotoDrawResults(input: {
    drawId: string;
    poolHash: string;
    eligibleTicketCount: number;
    eligibleReceiptIdsSnapshot: string[];
    totalPool: string;
    winners: Array<{
      drawId: string; receiptId: string; consumerUserId: string | null;
      tier: string; prizeAmount: string; currency: string;
      selectionRank: number; selectionHash: string;
    }>;
  }): Promise<{ draw: LotoDraw; winners: LotoDrawWinner[] }>;
  recordLotoPayout(input: {
    winnerId: string; provider: string; status: "pending" | "succeeded" | "failed" | "skipped";
    providerRef: string | null; lastError: string | null; amount: string; currency: string;
  }): Promise<LotoPayout>;
  listLotoPayoutsForDraw(drawId: string): Promise<LotoPayout[]>;
  getCrossProductConsents(filter: { userId?: string; borrowerId?: string; merchantId?: string }): Promise<CrossProductConsent[]>;
  getCrossProductConsentById(id: string): Promise<CrossProductConsent | undefined>;
  createCrossProductConsent(input: InsertCrossProductConsent): Promise<CrossProductConsent>;
  revokeCrossProductConsent(id: string, reason?: string): Promise<CrossProductConsent | undefined>;
  approveCrossProductConsent(id: string): Promise<CrossProductConsent | undefined>;
  denyPendingCrossProductConsent(id: string, reason?: string): Promise<CrossProductConsent | undefined>;
  getIncomingPendingConsents(filter: { userId?: string; merchantId?: string }): Promise<CrossProductConsent[]>;
  getCrossProductAuditEntries(limit?: number, filter?: { source?: string; target?: string; purpose?: string; since?: Date }): Promise<AuditLog[]>;
  getLatestCrossProductAuditTimestamp(): Promise<Date | null>;
  deleteAlternativeDataForBorrower(borrowerId: string, source: string): Promise<number>;
  getCrossProductImpactStats(): Promise<{
    merchantsRegistered: number;
    merchantsOptedIn: number;
    verifiedReceipts: number;
    verifiedTurnover: number;
    activeCrossProductConsents: number;
    bridgeAccessesLogged: number;
    bridgeAccessesAllowed: number;
    bridgeAccessesDenied: number;
    topDenialReasons: { reason: string; count: number }[];
  }>;
}

export interface OverdueAssignmentDetail {
  id: string;
  borrowerId: string;
  priority: string;
  status: string;
  assignedTo: string | null;
  agentName: string | null;
  agentEmail: string | null;
  lastAttemptAt: string | null;
  daysSinceContact: number;
  amountOutstanding: string | null;
  currency: string | null;
}

export class DatabaseStorage implements IStorage {
  async getOrganizations(country?: string): Promise<Organization[]> {
    if (country) {
      return db.select().from(organizations).where(eq(organizations.country, country)).orderBy(desc(organizations.createdAt));
    }
    return db.select().from(organizations).orderBy(desc(organizations.createdAt));
  }

  async getOrganization(id: string): Promise<Organization | undefined> {
    const [org] = await db.select().from(organizations).where(eq(organizations.id, id));
    return org;
  }

  async getOrganizationBySlug(slug: string): Promise<Organization | undefined> {
    const [org] = await db.select().from(organizations).where(eq(organizations.slug, slug));
    return org;
  }

  async createOrganization(org: InsertOrganization): Promise<Organization> {
    const [created] = await db.insert(organizations).values(org).returning();
    return created;
  }

  async updateOrganization(id: string, data: Partial<InsertOrganization>): Promise<Organization | undefined> {
    const [updated] = await db.update(organizations).set({ ...data, updatedAt: new Date() }).where(eq(organizations.id, id)).returning();
    return updated;
  }

  async deleteOrganization(id: string): Promise<boolean> {
    await db.delete(users).where(eq(users.organizationId, id));
    await db.delete(billingRecords).where(eq(billingRecords.organizationId, id));
    await db.delete(notifications).where(eq(notifications.organizationId, id));
    const unlinkTables = [
      "borrowers", "credit_accounts", "institutions", "audit_logs",
      "pending_approvals", "disputes", "court_judgments", "credit_report_logs"
    ];
    for (const table of unlinkTables) {
      await db.execute(sql`UPDATE ${sql.identifier(table)} SET organization_id = NULL WHERE organization_id = ${id}`);
    }
    const result = await db.delete(organizations).where(eq(organizations.id, id)).returning();
    return result.length > 0;
  }

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

  async getUsers(organizationId?: string, country?: string): Promise<User[]> {
    requireCountryScope(country, "getUsers");
    const filters: any[] = [];
    if (!isGlobalScope(country)) filters.push(this.countryOrgFilter(users, country!));
    if (organizationId) filters.push(eq(users.organizationId, organizationId));
    const where = filters.length > 0 ? and(...filters) : undefined;
    return db.select().from(users).where(where).orderBy(desc(users.createdAt));
  }

  async updateUser(id: string, data: Partial<InsertUser>): Promise<User | undefined> {
    const [updated] = await db.update(users).set(data).where(eq(users.id, id)).returning();
    return updated;
  }

  async deleteUser(id: string): Promise<boolean> {
    await db.update(auditLogs).set({ userId: null }).where(eq(auditLogs.userId, id));
    await db.update(notifications).set({ userId: null }).where(eq(notifications.userId, id));
    await db.update(exchangeRates).set({ createdBy: null }).where(eq(exchangeRates.createdBy, id));
    await db.update(pendingApprovals).set({ reviewedBy: null }).where(eq(pendingApprovals.reviewedBy, id));
    await db.execute(sql`UPDATE institutions SET approved_by = NULL WHERE approved_by = ${id}`);
    await db.delete(creditInquiries).where(eq(creditInquiries.inquiredBy, id));
    await db.delete(creditReportLogs).where(eq(creditReportLogs.requestedBy, id));
    await db.delete(disputes).where(eq(disputes.filedBy, id));
    await db.delete(pendingApprovals).where(eq(pendingApprovals.requestedBy, id));
    await db.delete(apiKeys).where(eq(apiKeys.createdBy, id));

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
    return borrower ? decryptBorrowerPII(borrower as Record<string, any>) as Borrower : undefined;
  }

  async getBorrowers(page: number = 1, limit: number = 50, organizationId?: string, country?: string | string[], recentDays?: number): Promise<{ data: Borrower[]; total: number }> {
    requireCountryScope(country, "getBorrowers");
    const safeLimit = Math.min(limit, 200);
    const offset = (page - 1) * safeLimit;
    const filters: any[] = [];
    if (organizationId) filters.push(eq(borrowers.organizationId, organizationId));
    const cc = this.buildCountryCondition(borrowers, country);
    if (cc) filters.push(cc);
    if (recentDays && recentDays > 0) {
      const cutoff = new Date(Date.now() - recentDays * 24 * 60 * 60 * 1000);
      filters.push(or(gte(borrowers.createdAt, cutoff), gte(borrowers.updatedAt, cutoff)));
    }
    const where = filters.length > 1 ? and(...filters) : filters[0];
    const [totalResult] = await db.select({ value: count() }).from(borrowers).where(where);
    const data = await db.select().from(borrowers).where(where).orderBy(desc(borrowers.createdAt)).limit(safeLimit).offset(offset);
    return { data: decryptBorrowerArray(data as Record<string, any>[]) as Borrower[], total: totalResult.value };
  }

  async getAllBorrowersForExport(organizationId?: string, country?: string | string[]): Promise<Borrower[]> {
    requireCountryScope(country, "getAllBorrowersForExport");
    const filters: any[] = [];
    if (organizationId) filters.push(eq(borrowers.organizationId, organizationId));
    const cc = this.buildCountryCondition(borrowers, country);
    if (cc) filters.push(cc);
    const where = filters.length > 1 ? and(...filters) : filters[0];
    const data = await db.select().from(borrowers).where(where).orderBy(desc(borrowers.createdAt));
    return decryptBorrowerArray(data as Record<string, any>[]) as Borrower[];
  }

  async getBorrowersByType(type: "individual" | "corporate", page: number = 1, limit: number = 50, organizationId?: string, country?: string | string[], recentDays?: number): Promise<{ data: Borrower[]; total: number }> {
    requireCountryScope(country, "getBorrowersByType");
    const safeLimit = Math.min(limit, 200);
    const offset = (page - 1) * safeLimit;
    const filters: any[] = [eq(borrowers.type, type)];
    if (organizationId) filters.push(eq(borrowers.organizationId, organizationId));
    const cc = this.buildCountryCondition(borrowers, country);
    if (cc) filters.push(cc);
    if (recentDays && recentDays > 0) {
      const cutoff = new Date(Date.now() - recentDays * 24 * 60 * 60 * 1000);
      filters.push(or(gte(borrowers.createdAt, cutoff), gte(borrowers.updatedAt, cutoff)));
    }
    const where = and(...filters);
    const [totalResult] = await db.select({ value: count() }).from(borrowers).where(where);
    const data = await db.select().from(borrowers).where(where).orderBy(desc(borrowers.createdAt)).limit(safeLimit).offset(offset);
    return { data: decryptBorrowerArray(data as Record<string, any>[]) as Borrower[], total: totalResult.value };
  }

  async searchBorrowersByType(type: "individual" | "corporate", query: string, organizationId?: string, country?: string | string[]): Promise<Borrower[]> {
    requireCountryScope(country, "searchBorrowersByType");
    const baseFilters: any[] = [eq(borrowers.type, type)];
    if (organizationId) baseFilters.push(eq(borrowers.organizationId, organizationId));
    const cc = this.buildCountryCondition(borrowers, country);
    if (cc) baseFilters.push(cc);

    if (!query) {
      const results = await db.select().from(borrowers)
        .where(and(...baseFilters))
        .orderBy(desc(borrowers.createdAt)).limit(200);
      return decryptBorrowerArray(results as Record<string, any>[]) as Borrower[];
    }

    const searchPattern = `%${query}%`;
    const searchCondition = or(
      ilike(borrowers.firstName, searchPattern),
      ilike(borrowers.lastName, searchPattern),
      ilike(borrowers.companyName, searchPattern),
      ilike(borrowers.nationalId, searchPattern),
      ilike(borrowers.tinNumber, searchPattern),
      ilike(borrowers.phone, searchPattern),
      ilike(borrowers.email, searchPattern),
      ilike(borrowers.city, searchPattern),
      ilike(borrowers.sector, searchPattern),
      ilike(borrowers.occupation, searchPattern),
      ilike(borrowers.employerName, searchPattern),
      ilike(borrowers.businessRegNumber, searchPattern),
    );

    const results = await db.select().from(borrowers)
      .where(and(...baseFilters, searchCondition))
      .orderBy(desc(borrowers.createdAt)).limit(200);
    return decryptBorrowerArray(results as Record<string, any>[]) as Borrower[];
  }

  async searchBorrowers(query: string, organizationId?: string, country?: string | string[]): Promise<Borrower[]> {
    requireCountryScope(country, "searchBorrowers");
    const baseFilters: any[] = [];
    if (organizationId) baseFilters.push(eq(borrowers.organizationId, organizationId));
    const cc = this.buildCountryCondition(borrowers, country);
    if (cc) baseFilters.push(cc);

    if (!query) {
      const where = baseFilters.length > 1 ? and(...baseFilters) : baseFilters[0];
      const results = await db.select().from(borrowers)
        .where(where)
        .orderBy(desc(borrowers.createdAt)).limit(200);
      return decryptBorrowerArray(results as Record<string, any>[]) as Borrower[];
    }

    const searchPattern = `%${query}%`;
    const searchCondition = or(
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
    );
    const filters = [searchCondition, ...baseFilters].filter(Boolean);
    const conditions = filters.length > 1 ? and(...filters) : filters[0];
    const results = await db.select().from(borrowers).where(conditions!).orderBy(desc(borrowers.createdAt)).limit(200);
    return decryptBorrowerArray(results as Record<string, any>[]) as Borrower[];
  }

  async countBorrowersByNationalId(nationalId: string | null): Promise<number> {
    if (!nationalId) return 0;
    const [result] = await db.select({ value: count() }).from(borrowers).where(eq(borrowers.nationalId, nationalId));
    return result.value;
  }

  private buildCountryCondition(table: any, country?: string | string[]) {
    if (!country) return undefined;
    if (Array.isArray(country)) {
      if (country.length === 0) return undefined;
      if (country.length === 1) return eq(table.country, country[0]);
      return inArray(table.country, country);
    }
    return eq(table.country, country);
  }

  private countryOrgFilter(table: any, country?: string | string[]) {
    if (!country) return undefined;
    if (Array.isArray(country)) {
      if (country.length === 0) return undefined;
      if (country.length === 1) return sql`${table.organizationId} IN (SELECT id FROM organizations WHERE country = ${country[0]})`;
      const clauses = country.map(c => sql`country = ${c}`);
      return sql`${table.organizationId} IN (SELECT id FROM organizations WHERE ${sql.join(clauses, sql` OR `)})`;
    }
    return sql`${table.organizationId} IN (SELECT id FROM organizations WHERE country = ${country})`;
  }

  async globalSearch(query: string, organizationId?: string, country?: string | string[]): Promise<{ borrowers: Borrower[]; institutions: Institution[]; creditAccounts: CreditAccount[]; telcoProfiles: TelcoProfile[] }> {
    requireCountryScope(country, "globalSearch");
    const orgBorrowerFilter = organizationId ? eq(borrowers.organizationId, organizationId) : undefined;
    const orgInstFilter = organizationId ? eq(institutions.organizationId, organizationId) : undefined;
    const orgAccFilter = organizationId ? eq(creditAccounts.organizationId, organizationId) : undefined;
    const orgTelcoFilter = organizationId ? eq(telcoProfiles.organizationId, organizationId) : undefined;
    const countryBorrowerFilter = this.buildCountryCondition(borrowers, country);
    const countryInstFilter = this.buildCountryCondition(institutions, country);
    const countryAccFilter = country ? this.countryOrgFilter(creditAccounts, country) : undefined;
    const countryTelcoFilter = this.buildCountryCondition(telcoProfiles, country);

    let borrowerResults: Borrower[] = [];
    let institutionResults: Institution[] = [];
    let creditAccountResults: CreditAccount[] = [];
    let telcoProfileResults: TelcoProfile[] = [];

    if (query) {
      const searchPattern = `%${query}%`;

      const borrowerSearch = or(
        ilike(borrowers.firstName, searchPattern),
        ilike(borrowers.lastName, searchPattern),
        ilike(borrowers.companyName, searchPattern),
        ilike(borrowers.nationalId, searchPattern),
        ilike(borrowers.tinNumber, searchPattern),
        ilike(borrowers.phone, searchPattern),
        ilike(borrowers.email, searchPattern),
        ilike(borrowers.city, searchPattern),
        ilike(borrowers.region, searchPattern),
        ilike(borrowers.country, searchPattern),
        ilike(borrowers.passportNumber, searchPattern),
      );
      const bFilters = [borrowerSearch, orgBorrowerFilter, countryBorrowerFilter].filter(Boolean);
      const bConditions = bFilters.length > 1 ? and(...bFilters) : bFilters[0];
      borrowerResults = await db.select().from(borrowers).where(bConditions!).orderBy(desc(borrowers.createdAt)).limit(50);

      const instSearch = or(
        ilike(institutions.name, searchPattern),
        ilike(institutions.type, searchPattern),
        ilike(institutions.country, searchPattern),
        ilike(institutions.registrationNumber, searchPattern),
        ilike(institutions.contactEmail, searchPattern),
      );
      const iFilters = [instSearch, orgInstFilter, countryInstFilter].filter(Boolean);
      const iConditions = iFilters.length > 1 ? and(...iFilters) : iFilters[0];
      institutionResults = await db.select().from(institutions).where(iConditions!).orderBy(institutions.name).limit(20);

      const accSearch = or(
        ilike(creditAccounts.lenderInstitution, searchPattern),
        ilike(creditAccounts.accountNumber, searchPattern),
        ilike(creditAccounts.accountType, searchPattern),
      );
      const accFilters = [accSearch, orgAccFilter, countryAccFilter].filter(Boolean);
      const accCond = accFilters.length > 1 ? and(...accFilters) : accFilters[0];
      creditAccountResults = await db.select().from(creditAccounts).where(accCond!).orderBy(desc(creditAccounts.createdAt)).limit(20);

      const telcoSearch = or(
        ilike(telcoProfiles.msisdn, searchPattern),
        sql`${telcoProfiles.provider}::text ILIKE ${searchPattern}`,
        ilike(telcoProfiles.country, searchPattern),
        ilike(telcoProfiles.deviceType, searchPattern),
        ilike(telcoProfiles.accountStatus, searchPattern),
      );
      const tFilters = [telcoSearch, orgTelcoFilter, countryTelcoFilter].filter(Boolean);
      const tConditions = tFilters.length > 1 ? and(...tFilters) : tFilters[0];
      telcoProfileResults = await db.select().from(telcoProfiles).where(tConditions!).orderBy(desc(telcoProfiles.createdAt)).limit(20);
    } else if (organizationId || country) {
      const bWhere = [orgBorrowerFilter, countryBorrowerFilter].filter(Boolean);
      borrowerResults = await db.select().from(borrowers).where(bWhere.length > 1 ? and(...bWhere) : bWhere[0]).orderBy(desc(borrowers.createdAt)).limit(50);
      const iWhere = [orgInstFilter, countryInstFilter].filter(Boolean);
      institutionResults = await db.select().from(institutions).where(iWhere.length > 1 ? and(...iWhere) : iWhere[0]).orderBy(institutions.name).limit(20);
      const aWhere = [orgAccFilter, countryAccFilter].filter(Boolean);
      creditAccountResults = await db.select().from(creditAccounts).where(aWhere.length > 1 ? and(...aWhere) : aWhere[0]).orderBy(desc(creditAccounts.createdAt)).limit(20);
      const tWhere = [orgTelcoFilter, countryTelcoFilter].filter(Boolean);
      if (tWhere.length > 0) {
        telcoProfileResults = await db.select().from(telcoProfiles).where(tWhere.length > 1 ? and(...tWhere) : tWhere[0]).orderBy(desc(telcoProfiles.createdAt)).limit(20);
      }
    }

    return { borrowers: decryptBorrowerArray(borrowerResults as Record<string, any>[]) as Borrower[], institutions: institutionResults, creditAccounts: creditAccountResults, telcoProfiles: telcoProfileResults };
  }

  async createBorrower(borrower: InsertBorrower): Promise<Borrower> {
    const encrypted = encryptBorrowerPII(borrower as Record<string, any>);
    const [created] = await db.insert(borrowers).values(encrypted as InsertBorrower).returning();
    const decrypted = decryptBorrowerPII(created as Record<string, any>) as Borrower;
    // Capture trace contact events (non-blocking on failure)
    try {
      const { captureBorrowerContactEvents } = await import("./trace-engine");
      await captureBorrowerContactEvents(decrypted.id, decrypted as any, "borrower_create", {
        organizationId: decrypted.organizationId, country: decrypted.country,
        sourceRef: `borrower:${decrypted.id}`,
      });
    } catch (e: any) {
      console.error("[trace] capture on create failed:", e.message);
    }
    return decrypted;
  }

  async updateBorrower(id: string, data: Partial<InsertBorrower>): Promise<Borrower | undefined> {
    const encrypted = encryptBorrowerPII(data as Record<string, any>);
    const [updated] = await db.update(borrowers).set({ ...encrypted, updatedAt: new Date() }).where(eq(borrowers.id, id)).returning();
    if (!updated) return undefined;
    const decrypted = decryptBorrowerPII(updated as Record<string, any>) as Borrower;
    try {
      const { captureBorrowerContactEvents } = await import("./trace-engine");
      // Diff semantics: only capture fields that were actually present in this
      // update payload (so unrelated edits don't refresh recency on stable
      // contact data points).
      const submittedKeys = new Set(Object.keys(data || {}));
      const submittedSubset: Record<string, unknown> = {};
      for (const k of submittedKeys) submittedSubset[k] = (decrypted as Record<string, unknown>)[k];
      await captureBorrowerContactEvents(decrypted.id, submittedSubset, "borrower_update", {
        organizationId: decrypted.organizationId, country: decrypted.country,
        sourceRef: `borrower:${decrypted.id}`,
      });
    } catch (e) {
      const err = e as Error;
      console.error("[trace] capture on update failed:", err.message);
    }
    return decrypted;
  }

  // ─── Tracing & Skip-Tracing (Task #29) ───────────────────────────────────
  async getContactEventsByBorrower(borrowerId: string): Promise<ContactEvent[]> {
    return db.select().from(contactEvents)
      .where(eq(contactEvents.borrowerId, borrowerId))
      .orderBy(desc(contactEvents.lastSeen));
  }

  async getLinkClustersForBorrower(borrowerId: string, country?: string): Promise<LinkCluster[]> {
    const filters: any[] = [sql`${borrowerId} = ANY(${linkClusters.memberBorrowerIds})`];
    if (country) filters.push(eq(linkClusters.country, country));
    const where = filters.length > 1 ? and(...filters) : filters[0];
    return db.select().from(linkClusters).where(where).orderBy(desc(linkClusters.memberCount)).limit(100);
  }

  async getAssetTracesByBorrower(borrowerId: string): Promise<AssetTraceRecord[]> {
    return db.select().from(assetTraceRecords)
      .where(eq(assetTraceRecords.borrowerId, borrowerId))
      .orderBy(desc(assetTraceRecords.createdAt));
  }

  async getCollectionAssignments(opts: { organizationId?: string; country?: string; assignedTo?: string; status?: string; segment?: string } = {}): Promise<CollectionAssignment[]> {
    const filters: any[] = [];
    if (opts.organizationId) filters.push(eq(collectionAssignments.organizationId, opts.organizationId));
    if (opts.country) filters.push(eq(collectionAssignments.country, opts.country));
    if (opts.assignedTo) filters.push(eq(collectionAssignments.assignedTo, opts.assignedTo));
    if (opts.status) filters.push(eq(collectionAssignments.status, opts.status as any));
    if (opts.segment) filters.push(eq(collectionAssignments.segment, opts.segment));
    const where = filters.length > 1 ? and(...filters) : filters[0];
    return db.select().from(collectionAssignments).where(where).orderBy(desc(collectionAssignments.createdAt)).limit(500);
  }

  async getCollectionAssignment(id: string): Promise<CollectionAssignment | undefined> {
    const [r] = await db.select().from(collectionAssignments).where(eq(collectionAssignments.id, id));
    return r;
  }

  async createCollectionAssignment(data: InsertCollectionAssignment): Promise<CollectionAssignment> {
    const [created] = await db.insert(collectionAssignments).values(data).returning();
    return created;
  }

  async updateCollectionAssignment(id: string, data: Partial<InsertCollectionAssignment>): Promise<CollectionAssignment | undefined> {
    const [r] = await db.update(collectionAssignments).set({ ...data, updatedAt: new Date() }).where(eq(collectionAssignments.id, id)).returning();
    return r;
  }

  async getCollectionAttempts(assignmentId: string): Promise<CollectionAttempt[]> {
    return db.select().from(collectionAttempts).where(eq(collectionAttempts.assignmentId, assignmentId)).orderBy(desc(collectionAttempts.attemptedAt));
  }

  async createCollectionAttempt(data: InsertCollectionAttempt): Promise<CollectionAttempt> {
    const [created] = await db.insert(collectionAttempts).values(data).returning();
    return created;
  }

  async getCollectionSlaSettings(organizationId: string | undefined, country: string, segment?: string | null): Promise<CollectionSlaSettings | undefined> {
    const segmentVal = segment || null;
    if (organizationId && segmentVal) {
      const [r] = await db.select().from(collectionSlaSettings)
        .where(and(eq(collectionSlaSettings.organizationId, organizationId), eq(collectionSlaSettings.country, country), eq(collectionSlaSettings.segment, segmentVal)));
      if (r) return r;
    }
    if (organizationId) {
      const [r] = await db.select().from(collectionSlaSettings)
        .where(and(eq(collectionSlaSettings.organizationId, organizationId), eq(collectionSlaSettings.country, country), sql`segment IS NULL`));
      if (r) return r;
    }
    if (segmentVal) {
      const [r] = await db.select().from(collectionSlaSettings)
        .where(and(sql`organization_id IS NULL`, eq(collectionSlaSettings.country, country), eq(collectionSlaSettings.segment, segmentVal)));
      if (r) return r;
    }
    const [r] = await db.select().from(collectionSlaSettings)
      .where(and(sql`organization_id IS NULL`, eq(collectionSlaSettings.country, country), sql`segment IS NULL`));
    return r;
  }

  async listCollectionSlaSettings(organizationId: string | undefined, country: string): Promise<CollectionSlaSettings[]> {
    if (organizationId) {
      const orgRows = await db.select().from(collectionSlaSettings)
        .where(and(eq(collectionSlaSettings.organizationId, organizationId), eq(collectionSlaSettings.country, country)));
      if (orgRows.length > 0) return orgRows;
    }
    const globalRows = await db.select().from(collectionSlaSettings)
      .where(and(sql`organization_id IS NULL`, eq(collectionSlaSettings.country, country)));
    return globalRows;
  }

  async upsertCollectionSlaSettings(data: InsertCollectionSlaSettings): Promise<CollectionSlaSettings> {
    const existing = await this.getCollectionSlaSettings(data.organizationId ?? undefined, data.country, data.segment);
    if (existing && existing.segment === (data.segment ?? null)) {
      const [updated] = await db.update(collectionSlaSettings)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(collectionSlaSettings.id, existing.id))
        .returning();
      return updated;
    }
    const [created] = await db.insert(collectionSlaSettings).values(data).returning();
    return created;
  }

  async getCollectionSlaSettingsById(id: string): Promise<CollectionSlaSettings | undefined> {
    const [row] = await db.select().from(collectionSlaSettings).where(eq(collectionSlaSettings.id, id));
    return row;
  }

  async deleteCollectionSlaSettings(id: string): Promise<void> {
    await db.delete(collectionSlaSettings).where(eq(collectionSlaSettings.id, id));
  }

  async countActiveAssignmentsBySegment(organizationId: string | undefined, country: string): Promise<Record<string, number>> {
    const rows = await db.execute(sql`
      SELECT segment, COUNT(*)::int AS cnt
      FROM collection_assignments
      WHERE status != 'closed'
        ${organizationId ? sql`AND organization_id = ${organizationId}` : sql`AND organization_id IS NULL`}
        AND country = ${country}
        AND segment IS NOT NULL
      GROUP BY segment
    `);
    const result: Record<string, number> = {};
    for (const row of rows.rows as { segment: string; cnt: number }[]) {
      result[row.segment] = row.cnt;
    }
    return result;
  }

  async getOverdueCollectionAssignments(thresholdDays: number, priority: string, organizationId?: string, country?: string, segment?: string | null): Promise<CollectionAssignment[]> {
    const cutoff = new Date(Date.now() - thresholdDays * 24 * 60 * 60 * 1000);
    const segmentClause = segment != null
      ? sql`AND ca.segment = ${segment}`
      : sql`AND ca.segment IS NULL`;
    const result = await db.execute(sql`
      SELECT ca.*
      FROM collection_assignments ca
      WHERE ca.status IN ('open', 'in_progress')
        AND ca.priority = ${priority}
        ${organizationId ? sql`AND ca.organization_id = ${organizationId}` : sql``}
        ${country ? sql`AND ca.country = ${country}` : sql``}
        ${segmentClause}
        AND ca.assigned_to IS NOT NULL
        AND (
          NOT EXISTS (
            SELECT 1 FROM collection_attempts att WHERE att.assignment_id = ca.id
          )
          OR (
            SELECT MAX(att.attempted_at) FROM collection_attempts att WHERE att.assignment_id = ca.id
          ) < ${cutoff}
        )
    `);
    return (result.rows || []) as unknown as CollectionAssignment[];
  }

  async getOverdueCollectionAssignmentDetails(thresholds: Record<string, number>, organizationId?: string, country?: string): Promise<OverdueAssignmentDetail[]> {
    const now = Date.now();
    const results: OverdueAssignmentDetail[] = [];
    interface BreachRow {
      id: string;
      borrower_id: string;
      priority: string;
      status: string;
      assigned_to: string | null;
      amount_outstanding: string | null;
      currency: string | null;
      created_at: string | null;
      agent_name: string | null;
      agent_email: string | null;
      last_attempt_at: string | null;
    }

    for (const [priority, thresholdDays] of Object.entries(thresholds)) {
      const cutoff = new Date(now - thresholdDays * 24 * 60 * 60 * 1000);
      const rows = await db.execute(sql`
        SELECT
          ca.id,
          ca.borrower_id,
          ca.priority,
          ca.status,
          ca.assigned_to,
          ca.amount_outstanding,
          ca.currency,
          ca.created_at,
          u.full_name AS agent_name,
          u.email AS agent_email,
          (
            SELECT MAX(att.attempted_at)
            FROM collection_attempts att
            WHERE att.assignment_id = ca.id
          ) AS last_attempt_at
        FROM collection_assignments ca
        LEFT JOIN users u ON u.id = ca.assigned_to
        WHERE ca.status IN ('open', 'in_progress')
          AND ca.priority = ${priority}
          ${organizationId ? sql`AND ca.organization_id = ${organizationId}` : sql``}
          ${country ? sql`AND ca.country = ${country}` : sql``}
          AND ca.assigned_to IS NOT NULL
          AND (
            NOT EXISTS (
              SELECT 1 FROM collection_attempts att WHERE att.assignment_id = ca.id
            )
            OR (
              SELECT MAX(att.attempted_at) FROM collection_attempts att WHERE att.assignment_id = ca.id
            ) < ${cutoff}
          )
        ORDER BY ca.priority DESC, last_attempt_at ASC NULLS FIRST
      `);
      for (const row of (rows.rows || []) as unknown as BreachRow[]) {
        const lastAttemptAt = row.last_attempt_at ? new Date(row.last_attempt_at) : null;
        const fallbackDate = row.created_at ? new Date(row.created_at) : new Date(now);
        const daysSinceContact = lastAttemptAt
          ? Math.floor((now - lastAttemptAt.getTime()) / (24 * 60 * 60 * 1000))
          : Math.floor((now - fallbackDate.getTime()) / (24 * 60 * 60 * 1000));
        results.push({
          id: row.id,
          borrowerId: row.borrower_id,
          priority: row.priority,
          status: row.status,
          assignedTo: row.assigned_to ?? null,
          agentName: row.agent_name ?? null,
          agentEmail: row.agent_email ?? null,
          lastAttemptAt: lastAttemptAt ? lastAttemptAt.toISOString() : null,
          daysSinceContact,
          amountOutstanding: row.amount_outstanding ?? null,
          currency: row.currency ?? null,
        });
      }
    }
    const priorityOrder: Record<string, number> = { urgent: 0, high: 1, medium: 2, low: 3 };
    results.sort((a, b) => (priorityOrder[a.priority] ?? 9) - (priorityOrder[b.priority] ?? 9) || b.daysSinceContact - a.daysSinceContact);
    return results;
  }

  // ──────────────────────────────────────────────────────────────────────────

  async getCreditAccount(id: string): Promise<CreditAccount | undefined> {
    const [account] = await db.select().from(creditAccounts).where(eq(creditAccounts.id, id));
    return account;
  }

  async getCreditAccountsByBorrower(borrowerId: string): Promise<CreditAccount[]> {
    return db.select().from(creditAccounts).where(eq(creditAccounts.borrowerId, borrowerId)).orderBy(desc(creditAccounts.createdAt));
  }

  async getAllCreditAccounts(organizationId?: string, country?: string, limit = 100, offset = 0, recentDays?: number): Promise<CreditAccount[]> {
    requireCountryScope(country, "getAllCreditAccounts");
    const filters: any[] = [];
    if (organizationId) filters.push(eq(creditAccounts.organizationId, organizationId));
    if (country) filters.push(this.countryOrgFilter(creditAccounts, country));
    if (recentDays && recentDays > 0) {
      const cutoff = new Date(Date.now() - recentDays * 24 * 60 * 60 * 1000);
      filters.push(or(gte(creditAccounts.createdAt, cutoff), gte(creditAccounts.updatedAt, cutoff)));
    }
    const where = filters.length > 1 ? and(...filters) : filters[0];
    return db.select().from(creditAccounts).where(where).orderBy(desc(creditAccounts.createdAt)).limit(limit).offset(offset);
  }

  async createCreditAccount(account: InsertCreditAccount): Promise<CreditAccount> {
    const [created] = await db.insert(creditAccounts).values(account).returning();
    // Refresh borrower contact-event last-seen on every account open
    try {
      const b = await this.getBorrower(created.borrowerId);
      if (b) {
        const { captureBorrowerContactEvents } = await import("./trace-engine");
        // Only pass the new credit-account row's own fields, not the borrower
        // record — opening an account does not constitute a fresh observation
        // of the borrower's existing contact data.
        await captureBorrowerContactEvents(created.borrowerId, created as Record<string, unknown>, "credit_account_create",
          { organizationId: b.organizationId, country: b.country, sourceRef: `credit_account:${created.id}` });
      }
    } catch (e) {
      const err = e as Error;
      console.error("[trace] account-create capture failed:", err.message);
    }
    return created;
  }

  async updateCreditAccount(id: string, data: Partial<InsertCreditAccount>): Promise<CreditAccount | undefined> {
    const [updated] = await db.update(creditAccounts).set({ ...data, updatedAt: new Date() }).where(eq(creditAccounts.id, id)).returning();
    if (updated) {
      try {
        const b = await this.getBorrower(updated.borrowerId);
        if (b) {
          const { captureBorrowerContactEvents } = await import("./trace-engine");
          // Diff semantics: only pass the credit-account fields explicitly
          // changed in this update, projected from the updated row.
          const submittedKeys = Object.keys(data || {});
          const submittedSubset: Record<string, unknown> = {};
          for (const k of submittedKeys) submittedSubset[k] = (updated as Record<string, unknown>)[k];
          await captureBorrowerContactEvents(updated.borrowerId, submittedSubset, "credit_account_update",
            { organizationId: b.organizationId, country: b.country, sourceRef: `credit_account:${updated.id}` });
        }
      } catch (e) {
        const err = e as Error;
        console.error("[trace] account-update capture failed:", err.message);
      }
    }
    return updated;
  }

  async getCreditInquiriesByBorrower(borrowerId: string): Promise<CreditInquiry[]> {
    return db.select().from(creditInquiries).where(eq(creditInquiries.borrowerId, borrowerId)).orderBy(desc(creditInquiries.createdAt));
  }

  async getAllCreditInquiries(organizationId?: string, country?: string, limit = 100, offset = 0): Promise<CreditInquiry[]> {
    requireCountryScope(country, "getAllCreditInquiries");
    const filters: any[] = [];
    if (organizationId) filters.push(sql`${creditInquiries.borrowerId} IN (SELECT id FROM borrowers WHERE organization_id = ${organizationId})`);
    if (country) filters.push(sql`${creditInquiries.borrowerId} IN (SELECT id FROM borrowers WHERE country = ${country})`);
    const where = filters.length > 1 ? and(...filters) : filters[0];
    return db.select().from(creditInquiries).where(where).orderBy(desc(creditInquiries.createdAt)).limit(limit).offset(offset);
  }

  async createCreditInquiry(inquiry: InsertCreditInquiry): Promise<CreditInquiry> {
    const [created] = await db.insert(creditInquiries).values(inquiry).returning();
    return created;
  }

  async getAuditLogs(organizationId?: string, country?: string, limit = 100, offset = 0): Promise<AuditLog[]> {
    requireCountryScope(country, "getAuditLogs");
    const filters: any[] = [];
    if (organizationId) filters.push(eq(auditLogs.organizationId, organizationId));
    if (country) filters.push(this.countryOrgFilter(auditLogs, country));
    const where = filters.length > 1 ? and(...filters) : filters[0];
    return db.select().from(auditLogs).where(where).orderBy(desc(auditLogs.createdAt)).limit(limit).offset(offset);
  }

  async createAuditLog(log: InsertAuditLog): Promise<AuditLog> {
    const [lastLog] = await db.select({ currentHash: auditLogs.currentHash })
      .from(auditLogs).orderBy(desc(auditLogs.createdAt)).limit(1);
    const previousHash = lastLog?.currentHash || "GENESIS";
    const now = new Date();
    const timestamp = now.toISOString();
    const payload = `${previousHash}|${timestamp}|${log.action}|${log.userId || "SYSTEM"}|${log.entityId || "NONE"}|${log.entity}|${log.details || ""}`;
    const currentHash = crypto.createHash("sha256").update(payload).digest("hex");
    const [created] = await db.insert(auditLogs).values({
      ...log,
      previousHash,
      currentHash,
      createdAt: now,
    }).returning();
    return created;
  }

  async getAuditStats(organizationId?: string, country?: string) {
    const filters: any[] = [];
    if (organizationId) filters.push(eq(auditLogs.organizationId, organizationId));
    if (country) filters.push(this.countryOrgFilter(auditLogs, country));
    const where = filters.length > 1 ? and(...filters) : filters[0];

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [totalsResult, todayResult, topActionsResult, topEntitiesResult, uniqueActionsResult, uniqueEntitiesResult, uniqueUsersResult] = await Promise.all([
      db.select({ totalLogs: count() }).from(auditLogs).where(where),
      db.select({
        actionsToday: count(),
        uniqueUsersToday: sql<number>`COUNT(DISTINCT "user_id")`,
      }).from(auditLogs).where(where ? and(where, gte(auditLogs.createdAt, todayStart)) : gte(auditLogs.createdAt, todayStart)),
      db.select({
        action: auditLogs.action,
        count: count(),
      }).from(auditLogs).where(where).groupBy(auditLogs.action).orderBy(desc(count())).limit(5),
      db.select({
        entity: auditLogs.entity,
        count: count(),
      }).from(auditLogs).where(where).groupBy(auditLogs.entity).orderBy(desc(count())).limit(5),
      db.selectDistinct({ action: auditLogs.action }).from(auditLogs).where(where),
      db.selectDistinct({ entity: auditLogs.entity }).from(auditLogs).where(where),
      db.select({ count: sql<number>`COUNT(DISTINCT "user_id")` }).from(auditLogs).where(where),
    ]);

    return {
      totalLogs: Number(totalsResult[0]?.totalLogs ?? 0),
      actionsToday: Number(todayResult[0]?.actionsToday ?? 0),
      uniqueUsersToday: Number(todayResult[0]?.uniqueUsersToday ?? 0),
      totalUniqueUsers: Number(uniqueUsersResult[0]?.count ?? 0),
      topActions: topActionsResult.map(r => ({ action: r.action, count: Number(r.count) })),
      topEntities: topEntitiesResult.map(r => ({ entity: r.entity, count: Number(r.count) })),
      uniqueActions: uniqueActionsResult.map(r => r.action),
      uniqueEntities: uniqueEntitiesResult.map(r => r.entity),
    };
  }

  private _integrityCache: { result: any; timestamp: number } | null = null;
  private static INTEGRITY_CACHE_TTL = 60_000;

  invalidateIntegrityCache() {
    this._integrityCache = null;
  }

  async verifyAuditIntegrity(): Promise<{ valid: boolean; totalChecked: number; brokenAt?: string; brokenAtIndex?: number; reason?: string }> {
    if (this._integrityCache && (Date.now() - this._integrityCache.timestamp) < DatabaseStorage.INTEGRITY_CACHE_TTL) {
      return this._integrityCache.result;
    }
    const allLogs = await db.select({
      id: auditLogs.id,
      createdAt: auditLogs.createdAt,
      action: auditLogs.action,
      userId: auditLogs.userId,
      entityId: auditLogs.entityId,
      entity: auditLogs.entity,
      details: auditLogs.details,
      previousHash: auditLogs.previousHash,
      currentHash: auditLogs.currentHash,
    }).from(auditLogs).orderBy(auditLogs.createdAt, auditLogs.id);
    const hashedLogs = allLogs.filter(l => l.currentHash && l.previousHash);
    let totalChecked = 0;
    for (let i = 0; i < hashedLogs.length; i++) {
      const log = hashedLogs[i];
      totalChecked++;
      const expectedPrev = i === 0 ? (log.previousHash === "GENESIS" ? "GENESIS" : (hashedLogs[i - 1]?.currentHash || "GENESIS")) : (hashedLogs[i - 1].currentHash || "GENESIS");
      if (log.previousHash !== expectedPrev && log.previousHash !== "GENESIS") {
        return { valid: false, totalChecked, brokenAt: log.id, brokenAtIndex: i, reason: "Chain link mismatch — a log entry's previous-hash doesn't match the prior entry. This typically happens after system maintenance, data migrations, or timestamp redistribution." };
      }
      const timestamp = log.createdAt ? log.createdAt.toISOString() : "";
      const expectedPayload = `${log.previousHash}|${timestamp}|${log.action}|${log.userId || "SYSTEM"}|${log.entityId || "NONE"}|${log.entity}|${log.details || ""}`;
      const expectedHash = crypto.createHash("sha256").update(expectedPayload).digest("hex");
      if (log.currentHash !== expectedHash) {
        const broken = { valid: false, totalChecked, brokenAt: log.id, brokenAtIndex: i, reason: "Hash mismatch — a log entry's content was modified after it was originally recorded. This typically happens after system updates that enriched log data (e.g. adding upload metadata) or timestamp redistribution during development." };
        this._integrityCache = { result: broken, timestamp: Date.now() };
        return broken;
      }
    }
    const valid = { valid: true, totalChecked };
    this._integrityCache = { result: valid, timestamp: Date.now() };
    return valid;
  }

  async repairAuditChain(): Promise<{ repairedCount: number; totalLogs: number }> {
    const allLogs = await db.select().from(auditLogs).orderBy(auditLogs.createdAt, auditLogs.id);
    let previousHash = "GENESIS";
    let repairedCount = 0;
    for (const log of allLogs) {
      const timestamp = log.createdAt ? log.createdAt.toISOString() : "";
      const payload = `${previousHash}|${timestamp}|${log.action}|${log.userId || "SYSTEM"}|${log.entityId || "NONE"}|${log.entity}|${log.details || ""}`;
      const newHash = crypto.createHash("sha256").update(payload).digest("hex");
      if (log.previousHash !== previousHash || log.currentHash !== newHash) {
        await db.update(auditLogs).set({ previousHash, currentHash: newHash }).where(eq(auditLogs.id, log.id));
        repairedCount++;
      }
      previousHash = newHash;
    }
    this.invalidateIntegrityCache();
    return { repairedCount, totalLogs: allLogs.length };
  }

  async fuzzyMatchBorrowers(params: { firstName?: string; lastName?: string; nationalId?: string; companyName?: string; passportNumber?: string; tinNumber?: string }): Promise<Array<any>> {
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
    if (params.passportNumber) {
      conditions.push(sql`similarity(COALESCE(${borrowers.passportNumber}, ''), ${params.passportNumber}) > 0.3`);
      conditions.push(ilike(borrowers.passportNumber, `%${params.passportNumber}%`));
    }
    if (params.tinNumber) {
      conditions.push(sql`similarity(COALESCE(${borrowers.tinNumber}, ''), ${params.tinNumber}) > 0.3`);
      conditions.push(ilike(borrowers.tinNumber, `%${params.tinNumber}%`));
    }
    if (conditions.length === 0) return [];
    const results = await db.select({
      id: borrowers.id,
      type: borrowers.type,
      firstName: borrowers.firstName,
      lastName: borrowers.lastName,
      companyName: borrowers.companyName,
      nationalId: borrowers.nationalId,
      passportNumber: borrowers.passportNumber,
      tinNumber: borrowers.tinNumber,
      phone: borrowers.phone,
      email: borrowers.email,
      similarity: sql<number>`GREATEST(
        ${params.firstName ? sql`similarity(COALESCE(${borrowers.firstName}, ''), ${params.firstName})` : sql`0`},
        ${params.lastName ? sql`similarity(COALESCE(${borrowers.lastName}, ''), ${params.lastName})` : sql`0`},
        ${params.nationalId ? sql`similarity(COALESCE(${borrowers.nationalId}, ''), ${params.nationalId})` : sql`0`},
        ${params.companyName ? sql`similarity(COALESCE(${borrowers.companyName}, ''), ${params.companyName})` : sql`0`},
        ${params.passportNumber ? sql`similarity(COALESCE(${borrowers.passportNumber}, ''), ${params.passportNumber})` : sql`0`},
        ${params.tinNumber ? sql`similarity(COALESCE(${borrowers.tinNumber}, ''), ${params.tinNumber})` : sql`0`}
      )`,
    }).from(borrowers).where(or(...conditions))
      .orderBy(sql`GREATEST(
        ${params.firstName ? sql`similarity(COALESCE(${borrowers.firstName}, ''), ${params.firstName})` : sql`0`},
        ${params.lastName ? sql`similarity(COALESCE(${borrowers.lastName}, ''), ${params.lastName})` : sql`0`},
        ${params.nationalId ? sql`similarity(COALESCE(${borrowers.nationalId}, ''), ${params.nationalId})` : sql`0`},
        ${params.companyName ? sql`similarity(COALESCE(${borrowers.companyName}, ''), ${params.companyName})` : sql`0`},
        ${params.passportNumber ? sql`similarity(COALESCE(${borrowers.passportNumber}, ''), ${params.passportNumber})` : sql`0`},
        ${params.tinNumber ? sql`similarity(COALESCE(${borrowers.tinNumber}, ''), ${params.tinNumber})` : sql`0`}
      ) DESC`).limit(20);
    return results;
  }

  async structuredSearch(params: {
    searchType: "consumer" | "business" | "telco";
    ghanaCardNumber?: string;
    firstName?: string;
    middleName?: string;
    lastName?: string;
    dateOfBirth?: string;
    mobileNumber?: string;
    gender?: string;
    email?: string;
    nationalId?: string;
    registrationNumber?: string;
    tinNumber?: string;
    companyName?: string;
    msisdn?: string;
    provider?: string;
    accountStatus?: string;
  }, organizationId?: string, country?: string): Promise<Borrower[] | TelcoProfile[]> {
    requireCountryScope(country, "structuredSearch");
    if (params.searchType === "telco") {
      const conditions: any[] = [];
      if (organizationId) conditions.push(eq(telcoProfiles.organizationId, organizationId));
      if (country) conditions.push(eq(telcoProfiles.country, country));
      if (params.msisdn) conditions.push(ilike(telcoProfiles.msisdn, `%${params.msisdn}%`));
      if (params.provider) conditions.push(eq(telcoProfiles.provider, params.provider as any));
      if (params.accountStatus) conditions.push(eq(telcoProfiles.accountStatus, params.accountStatus));

      if (conditions.length === 0) {
        return db.select().from(telcoProfiles).orderBy(desc(telcoProfiles.createdAt)).limit(50);
      }
      return db.select().from(telcoProfiles)
        .where(conditions.length > 1 ? and(...conditions) : conditions[0])
        .orderBy(desc(telcoProfiles.createdAt))
        .limit(50);
    }

    const conditions: any[] = [];
    const typeFilter = params.searchType === "consumer" ? "individual" : "corporate";
    conditions.push(eq(borrowers.type, typeFilter));

    if (organizationId) conditions.push(eq(borrowers.organizationId, organizationId));
    if (country) conditions.push(eq(borrowers.country, country));

    // NOTE: ghanaCardNumber, nationalId, and dateOfBirth are PII-encrypted at rest.
    // They cannot be searched with SQL ILIKE. These are post-decryption filtered below.

    if (params.firstName) {
      conditions.push(ilike(borrowers.firstName, `%${params.firstName}%`));
    }
    if (params.lastName) {
      conditions.push(ilike(borrowers.lastName, `%${params.lastName}%`));
    }
    if (params.mobileNumber) {
      const cleanMobile = params.mobileNumber.replace(/[\s\-\(\)]/g, '');
      const digits = cleanMobile.replace(/^\+/, '');
      conditions.push(
        or(
          ilike(borrowers.phone, `%${cleanMobile}%`),
          ilike(borrowers.phone, `%${digits}%`)
        )
      );
    }
    if (params.gender) {
      const g = params.gender.toLowerCase().trim();
      const abbrev = g.charAt(0);
      conditions.push(
        or(
          ilike(borrowers.gender, `${g}%`),
          ilike(borrowers.gender, abbrev)
        )
      );
    }
    if (params.email) {
      conditions.push(ilike(borrowers.email, `%${params.email}%`));
    }
    if (params.registrationNumber) {
      conditions.push(ilike(borrowers.businessRegNumber, `%${params.registrationNumber}%`));
    }
    if (params.tinNumber) {
      conditions.push(ilike(borrowers.tinNumber, `%${params.tinNumber}%`));
    }
    if (params.companyName) {
      conditions.push(ilike(borrowers.companyName, `%${params.companyName}%`));
    }

    const rawResults = await db.select().from(borrowers)
      .where(and(...conditions))
      .orderBy(desc(borrowers.createdAt))
      .limit(200);

    // Decrypt PII fields before post-filtering on encrypted identifiers
    const decrypted = decryptBorrowerArray(rawResults as Record<string, any>[]) as Borrower[];

    // Post-decrypt filter: ghanaCardNumber / nationalId (both columns, case-insensitive)
    let filtered = decrypted;
    if (params.ghanaCardNumber) {
      const needle = params.ghanaCardNumber.toLowerCase();
      filtered = filtered.filter(b =>
        (b.ghanaCardNumber && b.ghanaCardNumber.toLowerCase().includes(needle)) ||
        (b.nationalId && b.nationalId.toLowerCase().includes(needle))
      );
    } else if (params.nationalId) {
      const needle = params.nationalId.toLowerCase();
      filtered = filtered.filter(b =>
        b.nationalId && b.nationalId.toLowerCase().includes(needle)
      );
    }

    // Post-decrypt filter: dateOfBirth (exact match)
    if (params.dateOfBirth) {
      filtered = filtered.filter(b => b.dateOfBirth === params.dateOfBirth);
    }

    return filtered.slice(0, 50);
  }

  async getPendingApprovals(organizationId?: string, country?: string, recentDays?: number): Promise<PendingApproval[]> {
    requireCountryScope(country, "getPendingApprovals");
    const filters: any[] = [];
    if (organizationId) filters.push(eq(pendingApprovals.organizationId, organizationId));
    if (country) filters.push(eq(pendingApprovals.country, country));
    if (recentDays && recentDays > 0) {
      const cutoff = new Date(Date.now() - recentDays * 24 * 60 * 60 * 1000);
      filters.push(gte(pendingApprovals.createdAt, cutoff));
    }
    const where = filters.length > 1 ? and(...filters) : filters[0];
    return db.select().from(pendingApprovals).where(where).orderBy(desc(pendingApprovals.createdAt));
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

  async getDisputes(organizationId?: string, country?: string, recentDays?: number): Promise<Dispute[]> {
    requireCountryScope(country, "getDisputes");
    const filters: any[] = [];
    if (organizationId) filters.push(eq(disputes.organizationId, organizationId));
    if (country) filters.push(eq(disputes.country, country));
    if (recentDays && recentDays > 0) {
      const cutoff = new Date(Date.now() - recentDays * 24 * 60 * 60 * 1000);
      filters.push(or(gte(disputes.createdAt, cutoff), gte(disputes.updatedAt, cutoff)));
    }
    const where = filters.length > 1 ? and(...filters) : filters[0];
    return db.select().from(disputes).where(where).orderBy(desc(disputes.createdAt)).limit(200);
  }

  async getDisputesByBorrower(borrowerId: string): Promise<Dispute[]> {
    return db.select().from(disputes).where(eq(disputes.borrowerId, borrowerId)).orderBy(desc(disputes.createdAt));
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

  async getNotifications(userId: string, country?: string): Promise<Notification[]> {
    requireCountryScope(country, "getNotifications");
    const conds: any[] = [
      or(eq(notifications.userId, userId), sql`${notifications.userId} IS NULL`),
    ];
    if (!isGlobalScope(country)) conds.push(eq(notifications.country, country!));
    return db.select().from(notifications)
      .where(and(...conds))
      .orderBy(desc(notifications.createdAt))
      .limit(50);
  }

  async getUnreadNotificationCount(userId: string, country?: string): Promise<number> {
    requireCountryScope(country, "getUnreadNotificationCount");
    const conds: any[] = [
      sql`(${notifications.userId} = ${userId} OR ${notifications.userId} IS NULL) AND ${notifications.isRead} = false`,
    ];
    if (!isGlobalScope(country)) conds.push(eq(notifications.country, country!));
    const [result] = await db.select({ value: count() }).from(notifications).where(and(...conds));
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

  async getAllCourtJudgments(organizationId?: string, country?: string, recentDays?: number): Promise<CourtJudgment[]> {
    requireCountryScope(country, "getAllCourtJudgments");
    const filters: any[] = [];
    if (organizationId) filters.push(eq(courtJudgments.organizationId, organizationId));
    if (country) filters.push(this.countryOrgFilter(courtJudgments, country));
    if (recentDays && recentDays > 0) {
      const cutoff = new Date(Date.now() - recentDays * 24 * 60 * 60 * 1000);
      filters.push(gte(courtJudgments.createdAt, cutoff));
    }
    const where = filters.length > 1 ? and(...filters) : filters[0];
    return db.select().from(courtJudgments).where(where).orderBy(desc(courtJudgments.createdAt)).limit(200);
  }

  async createCourtJudgment(judgment: InsertCourtJudgment): Promise<CourtJudgment> {
    const [created] = await db.insert(courtJudgments).values(judgment).returning();
    return created;
  }

  async getConsentRecordsByBorrower(borrowerId: string): Promise<ConsentRecord[]> {
    return db.select().from(consentRecords).where(eq(consentRecords.borrowerId, borrowerId)).orderBy(desc(consentRecords.createdAt));
  }

  async getAllConsentRecords(organizationId?: string, country?: string): Promise<ConsentRecord[]> {
    requireCountryScope(country, "getAllConsentRecords");
    const filters: any[] = [];
    if (organizationId) filters.push(sql`${consentRecords.borrowerId} IN (SELECT id FROM borrowers WHERE organization_id = ${organizationId})`);
    if (country) filters.push(sql`${consentRecords.borrowerId} IN (SELECT id FROM borrowers WHERE country = ${country})`);
    const where = filters.length > 1 ? and(...filters) : filters[0];
    return db.select().from(consentRecords).where(where).orderBy(desc(consentRecords.createdAt)).limit(200);
  }

  async getConsentRecord(id: string): Promise<ConsentRecord | undefined> {
    const [record] = await db.select().from(consentRecords).where(eq(consentRecords.id, id));
    return record;
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

  async getInstitutions(page: number = 1, limit: number = 50, organizationId?: string, country?: string): Promise<{ data: Institution[]; total: number }> {
    requireCountryScope(country, "getInstitutions");
    const safeLimit = Math.min(limit, 200);
    const offset = (page - 1) * safeLimit;
    const filters: any[] = [];
    if (organizationId) filters.push(eq(institutions.organizationId, organizationId));
    if (country) filters.push(this.countryOrgFilter(institutions, country));
    const whereClause = filters.length > 1 ? and(...filters) : filters[0];
    const [totalResult] = await db.select({ value: count() }).from(institutions).where(whereClause);
    const data = await db.select().from(institutions).where(whereClause).orderBy(desc(institutions.createdAt)).limit(safeLimit).offset(offset);
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

  async getBillingRecords(organizationId?: string, country?: string, recentDays?: number): Promise<BillingRecord[]> {
    requireCountryScope(country, "getBillingRecords");
    const filters: any[] = [];
    if (organizationId) filters.push(eq(billingRecords.organizationId, organizationId));
    if (country) filters.push(this.countryOrgFilter(billingRecords, country));
    if (recentDays && recentDays > 0) {
      const cutoff = new Date(Date.now() - recentDays * 24 * 60 * 60 * 1000);
      filters.push(gte(billingRecords.createdAt, cutoff));
    }
    const where = filters.length > 1 ? and(...filters) : filters[0];
    return db.select().from(billingRecords).where(where).orderBy(desc(billingRecords.createdAt));
  }

  async getBillingRecord(id: string): Promise<BillingRecord | undefined> {
    const [record] = await db.select().from(billingRecords).where(eq(billingRecords.id, id));
    return record;
  }

  async getBillingRecordsByInstitution(institutionName: string, country?: string): Promise<BillingRecord[]> {
    requireCountryScope(country, "getBillingRecordsByInstitution");
    const filters: any[] = [eq(billingRecords.institutionName, institutionName)];
    filters.push(this.countryOrgFilter(billingRecords, country!));
    const where = and(...filters);
    return db.select().from(billingRecords).where(where).orderBy(desc(billingRecords.createdAt));
  }

  async createBillingRecord(record: InsertBillingRecord): Promise<BillingRecord> {
    const [created] = await db.insert(billingRecords).values(record).returning();
    return created;
  }

  async updateBillingRecordStatus(id: string, status: "pending" | "paid" | "overdue"): Promise<BillingRecord | undefined> {
    const [updated] = await db.update(billingRecords).set({ status }).where(eq(billingRecords.id, id)).returning();
    return updated;
  }

  async getCreditReportLogs(organizationId?: string, country?: string): Promise<CreditReportLog[]> {
    requireCountryScope(country, "getCreditReportLogs");
    const filters: any[] = [];
    if (organizationId) filters.push(eq(creditReportLogs.organizationId, organizationId));
    if (country) filters.push(this.countryOrgFilter(creditReportLogs, country));
    const where = filters.length > 1 ? and(...filters) : filters[0];
    return db.select().from(creditReportLogs).where(where).orderBy(desc(creditReportLogs.createdAt)).limit(200);
  }

  async getCreditReportLogsByBorrower(borrowerId: string): Promise<CreditReportLog[]> {
    return db.select().from(creditReportLogs).where(eq(creditReportLogs.borrowerId, borrowerId)).orderBy(desc(creditReportLogs.createdAt));
  }

  async createCreditReportLog(log: InsertCreditReportLog): Promise<CreditReportLog> {
    const [created] = await db.insert(creditReportLogs).values(log).returning();
    return created;
  }

  async getDashboardDetails(type: string, organizationId?: string, country?: string) {
    requireCountryScope(country, "getDashboardDetails");
    const borrowerFilters: any[] = [];
    if (organizationId) borrowerFilters.push(eq(borrowers.organizationId, organizationId));
    if (country) borrowerFilters.push(eq(borrowers.country, country));
    const borrowerFilter = borrowerFilters.length > 1 ? and(...borrowerFilters) : borrowerFilters[0];

    const accFilters: any[] = [];
    if (organizationId) accFilters.push(eq(creditAccounts.organizationId, organizationId));
    if (country) accFilters.push(this.countryOrgFilter(creditAccounts, country));
    const accFilter = accFilters.length > 1 ? and(...accFilters) : accFilters[0];

    const approvalFilters: any[] = [];
    if (organizationId) approvalFilters.push(eq(pendingApprovals.organizationId, organizationId));
    if (country) approvalFilters.push(eq(pendingApprovals.country, country));
    const orgApprovalFilter = approvalFilters.length > 1 ? and(...approvalFilters) : approvalFilters[0];

    const dispFilters: any[] = [];
    if (organizationId) dispFilters.push(eq(disputes.organizationId, organizationId));
    if (country) dispFilters.push(eq(disputes.country, country));
    const dispFilter = dispFilters.length > 1 ? and(...dispFilters) : dispFilters[0];

    const inqFilters: any[] = [];
    if (organizationId) inqFilters.push(sql`${creditInquiries.borrowerId} IN (SELECT id FROM borrowers WHERE organization_id = ${organizationId})`);
    if (country) inqFilters.push(sql`${creditInquiries.borrowerId} IN (SELECT id FROM borrowers WHERE country = ${country})`);
    const inqFilter = inqFilters.length > 1 ? and(...inqFilters) : inqFilters[0];

    switch (type) {
      case "borrowers": {
        const byCity = await db.select({
          city: sql<string>`COALESCE(${borrowers.city}, 'Unknown')`,
          count: count(),
        }).from(borrowers).where(borrowerFilter).groupBy(sql`COALESCE(${borrowers.city}, 'Unknown')`).orderBy(desc(count())).limit(10);
        const byType = await db.select({
          type: borrowers.type,
          count: count(),
        }).from(borrowers).where(borrowerFilter).groupBy(borrowers.type);
        const pepFilter = borrowerFilter ? and(borrowerFilter, eq(borrowers.isPep, true)) : eq(borrowers.isPep, true);
        const [pepCount] = await db.select({ value: count() }).from(borrowers).where(pepFilter);
        const recent = await db.select().from(borrowers).where(borrowerFilter).orderBy(desc(borrowers.createdAt)).limit(10);
        return { byCity, byType, pepCount: pepCount.value, recent };
      }
      case "accounts": {
        const byStatus = await db.select({
          status: creditAccounts.status,
          count: count(),
        }).from(creditAccounts).where(accFilter).groupBy(creditAccounts.status);
        const byType = await db.select({
          type: creditAccounts.accountType,
          count: count(),
        }).from(creditAccounts).where(accFilter).groupBy(creditAccounts.accountType).orderBy(desc(count())).limit(10);
        const byInstitution = await db.select({
          institution: creditAccounts.lenderInstitution,
          count: count(),
          total: sql<string>`COALESCE(SUM(${creditAccounts.currentBalance}::numeric), 0)::text`,
        }).from(creditAccounts).where(accFilter).groupBy(creditAccounts.lenderInstitution).orderBy(desc(count())).limit(10);
        return { byStatus, byType, byInstitution };
      }
      case "outstanding": {
        const outStatusFilter = or(eq(creditAccounts.status, "current"), eq(creditAccounts.status, "delinquent"), eq(creditAccounts.status, "restructured"));
        const outstandingFilter = accFilter ? and(outStatusFilter, accFilter) : outStatusFilter;
        const byCurrency = await db.select({
          currency: creditAccounts.currency,
          total: sql<string>`COALESCE(SUM(${creditAccounts.currentBalance}::numeric), 0)::text`,
          count: count(),
        }).from(creditAccounts).where(outstandingFilter).groupBy(creditAccounts.currency).orderBy(desc(sql`SUM(${creditAccounts.currentBalance}::numeric)`));
        const byInstitution = await db.select({
          institution: creditAccounts.lenderInstitution,
          total: sql<string>`COALESCE(SUM(${creditAccounts.currentBalance}::numeric), 0)::text`,
          count: count(),
        }).from(creditAccounts).where(outstandingFilter).groupBy(creditAccounts.lenderInstitution).orderBy(desc(sql`SUM(${creditAccounts.currentBalance}::numeric)`)).limit(10);
        return { byCurrency, byInstitution };
      }
      case "delinquent": {
        const delFilter = accFilter ? and(eq(creditAccounts.status, "delinquent"), accFilter) : eq(creditAccounts.status, "delinquent");
        const accounts = await db.select().from(creditAccounts).where(delFilter).orderBy(desc(creditAccounts.daysInArrears)).limit(20);
        const byInstitution = await db.select({
          institution: creditAccounts.lenderInstitution,
          count: count(),
          totalOverdue: sql<string>`COALESCE(SUM(${creditAccounts.currentBalance}::numeric), 0)::text`,
        }).from(creditAccounts).where(delFilter).groupBy(creditAccounts.lenderInstitution).orderBy(desc(count())).limit(10);
        return { accounts, byInstitution };
      }
      case "defaults": {
        const defFilter = accFilter ? and(eq(creditAccounts.status, "default"), accFilter) : eq(creditAccounts.status, "default");
        const accounts = await db.select().from(creditAccounts).where(defFilter).orderBy(desc(creditAccounts.currentBalance)).limit(20);
        const byInstitution = await db.select({
          institution: creditAccounts.lenderInstitution,
          count: count(),
          totalDefaulted: sql<string>`COALESCE(SUM(${creditAccounts.currentBalance}::numeric), 0)::text`,
        }).from(creditAccounts).where(defFilter).groupBy(creditAccounts.lenderInstitution).orderBy(desc(count())).limit(10);
        return { accounts, byInstitution };
      }
      case "inquiries": {
        const byPurpose = await db.select({
          purpose: creditInquiries.purpose,
          count: count(),
        }).from(creditInquiries).where(inqFilter).groupBy(creditInquiries.purpose);
        const byInstitution = await db.select({
          institution: creditInquiries.institution,
          count: count(),
        }).from(creditInquiries).where(inqFilter).groupBy(creditInquiries.institution).orderBy(desc(count())).limit(10);
        const recent = await db.select().from(creditInquiries).where(inqFilter).orderBy(desc(creditInquiries.createdAt)).limit(15);
        return { byPurpose, byInstitution, recent };
      }
      case "approvals": {
        const appFilter = orgApprovalFilter ? and(eq(pendingApprovals.status, "pending"), orgApprovalFilter) : eq(pendingApprovals.status, "pending");
        const items = await db.select().from(pendingApprovals).where(appFilter).orderBy(desc(pendingApprovals.createdAt)).limit(20);
        const byType = await db.select({
          type: pendingApprovals.entityType,
          count: count(),
        }).from(pendingApprovals).where(appFilter).groupBy(pendingApprovals.entityType);
        return { items, byType };
      }
      case "disputes": {
        const openStatus = or(eq(disputes.status, "open"), eq(disputes.status, "under_review"));
        const openDispFilter = dispFilter ? and(openStatus, dispFilter) : openStatus;
        const items = await db.select().from(disputes).where(openDispFilter).orderBy(desc(disputes.createdAt)).limit(20);
        const byType = await db.select({
          type: disputes.disputeType,
          count: count(),
        }).from(disputes).where(openDispFilter).groupBy(disputes.disputeType);
        const slaBase = sql`status IN ('open', 'under_review') AND sla_deadline < NOW()`;
        const slaFilter = dispFilter ? and(slaBase, dispFilter) : slaBase;
        const [slaBreached] = await db.select({ value: count() }).from(disputes).where(slaFilter);
        return { items, byType, slaBreached: slaBreached.value };
      }
      default:
        return {};
    }
  }

  async getDashboardStats(organizationId?: string, country?: string) {
    requireCountryScope(country, "getDashboardStats");
    const scopedCountry = isGlobalScope(country) ? undefined : (country as string | undefined);
    const borrowerFilters: any[] = [];
    if (organizationId) borrowerFilters.push(eq(borrowers.organizationId, organizationId));
    if (scopedCountry) borrowerFilters.push(eq(borrowers.country, scopedCountry));
    const borrowerFilter = borrowerFilters.length > 1 ? and(...borrowerFilters) : borrowerFilters[0];

    const accFilters: any[] = [];
    if (organizationId) accFilters.push(eq(creditAccounts.organizationId, organizationId));
    if (scopedCountry) accFilters.push(this.countryOrgFilter(creditAccounts, scopedCountry));
    const accFilter = accFilters.length > 1 ? and(...accFilters) : accFilters[0];

    const approvalFilters: any[] = [];
    if (organizationId) approvalFilters.push(eq(pendingApprovals.organizationId, organizationId));
    if (scopedCountry) approvalFilters.push(eq(pendingApprovals.country, scopedCountry));
    const orgApprovalFilter = approvalFilters.length > 1 ? and(...approvalFilters) : approvalFilters[0];

    const dispFilters: any[] = [];
    if (organizationId) dispFilters.push(eq(disputes.organizationId, organizationId));
    if (scopedCountry) dispFilters.push(eq(disputes.country, scopedCountry));
    const orgDisputeFilter = dispFilters.length > 1 ? and(...dispFilters) : dispFilters[0];

    const inqFilters: any[] = [];
    if (organizationId) inqFilters.push(sql`${creditInquiries.borrowerId} IN (SELECT id FROM borrowers WHERE organization_id = ${organizationId})`);
    if (scopedCountry) inqFilters.push(sql`${creditInquiries.borrowerId} IN (SELECT id FROM borrowers WHERE country = ${scopedCountry})`);
    const inqFilter = inqFilters.length > 1 ? and(...inqFilters) : inqFilters[0];

    const outstandingStatusFilter = or(eq(creditAccounts.status, "current"), eq(creditAccounts.status, "delinquent"), eq(creditAccounts.status, "restructured"));
    const outstandingFilter = accFilter ? and(outstandingStatusFilter, accFilter) : outstandingStatusFilter;
    const delFilter = accFilter ? and(eq(creditAccounts.status, "delinquent"), accFilter) : eq(creditAccounts.status, "delinquent");
    const defFilter = accFilter ? and(eq(creditAccounts.status, "default"), accFilter) : eq(creditAccounts.status, "default");
    const pendFilter = orgApprovalFilter ? and(eq(pendingApprovals.status, "pending"), orgApprovalFilter) : eq(pendingApprovals.status, "pending");
    const openDisputeStatus = or(eq(disputes.status, "open"), eq(disputes.status, "under_review"));
    const disputeFilter = orgDisputeFilter ? and(openDisputeStatus, orgDisputeFilter) : openDisputeStatus;

    const [
      [borrowerCount],
      [accountCount],
      [inquiryCount],
      [outstanding],
      outstandingByCurrency,
      [delinquent],
      [defaulted],
      [pendingCount],
      [disputeCount],
    ] = await Promise.all([
      db.select({ value: count() }).from(borrowers).where(borrowerFilter),
      db.select({ value: count() }).from(creditAccounts).where(accFilter),
      db.select({ value: count() }).from(creditInquiries).where(inqFilter),
      db.select({ value: sql<string>`COALESCE(SUM(${creditAccounts.currentBalance}::numeric), 0)::text` }).from(creditAccounts).where(outstandingFilter),
      db.select({ currency: creditAccounts.currency, total: sql<string>`COALESCE(SUM(${creditAccounts.currentBalance}::numeric), 0)::text` }).from(creditAccounts).where(outstandingFilter).groupBy(creditAccounts.currency),
      db.select({ value: count() }).from(creditAccounts).where(delFilter),
      db.select({ value: count() }).from(creditAccounts).where(defFilter),
      db.select({ value: count() }).from(pendingApprovals).where(pendFilter),
      db.select({ value: count() }).from(disputes).where(disputeFilter),
    ]);

    return {
      totalBorrowers: borrowerCount.value,
      totalAccounts: accountCount.value,
      totalInquiries: inquiryCount.value,
      totalOutstanding: outstanding.value || "0",
      outstandingByCurrency,
      delinquentAccounts: delinquent.value,
      defaultAccounts: defaulted.value,
      pendingApprovalCount: pendingCount.value,
      openDisputeCount: disputeCount.value,
    };
  }

  async getPortfolioAggregates(organizationId?: string, country?: string) {
    const filters: any[] = [];
    if (organizationId) filters.push(eq(creditAccounts.organizationId, organizationId));
    if (country) filters.push(this.countryOrgFilter(creditAccounts, country));
    const where = filters.length > 1 ? and(...filters) : filters[0];

    const [[totals], statusBreakdown, typeBreakdown, institutionCount] = await Promise.all([
      db.select({
        totalAccounts: count(),
        totalValue: sql<string>`COALESCE(SUM("current_balance"::numeric), 0)::text`,
        totalOriginal: sql<string>`COALESCE(SUM("original_amount"::numeric), 0)::text`,
        avgInterestRate: sql<string>`COALESCE(AVG("interest_rate"::numeric), 0)::text`,
        currentCount: sql<number>`COUNT(*) FILTER (WHERE "status" = 'current')`,
        delinquentCount: sql<number>`COUNT(*) FILTER (WHERE "status" = 'delinquent')`,
        defaultedCount: sql<number>`COUNT(*) FILTER (WHERE "status" = 'default')`,
        closedCount: sql<number>`COUNT(*) FILTER (WHERE "status" = 'closed')`,
        delinquentValue: sql<string>`COALESCE(SUM(CASE WHEN "status" = 'delinquent' THEN "current_balance"::numeric ELSE 0 END), 0)::text`,
        defaultedValue: sql<string>`COALESCE(SUM(CASE WHEN "status" = 'default' THEN "current_balance"::numeric ELSE 0 END), 0)::text`,
        withBalance: sql<number>`COUNT(*) FILTER (WHERE "current_balance" IS NOT NULL AND "current_balance"::numeric >= 0)`,
        withOpenDate: sql<number>`COUNT(*) FILTER (WHERE "disbursement_date" IS NOT NULL)`,
      }).from(creditAccounts).where(where),
      db.select({ status: creditAccounts.status, count: count() }).from(creditAccounts).where(where).groupBy(creditAccounts.status),
      db.select({ accountType: creditAccounts.accountType, count: count() }).from(creditAccounts).where(where).groupBy(creditAccounts.accountType).orderBy(desc(count())).limit(20),
      db.select({ count: sql<number>`COUNT(DISTINCT "lender_institution")` }).from(creditAccounts).where(where),
    ]);

    return {
      totalAccounts: Number(totals.totalAccounts),
      totalValue: parseFloat(totals.totalValue),
      totalOriginal: parseFloat(totals.totalOriginal),
      avgInterestRate: parseFloat(totals.avgInterestRate),
      currentCount: Number(totals.currentCount),
      delinquentCount: Number(totals.delinquentCount),
      defaultedCount: Number(totals.defaultedCount),
      closedCount: Number(totals.closedCount),
      delinquentValue: parseFloat(totals.delinquentValue),
      defaultedValue: parseFloat(totals.defaultedValue),
      withBalance: Number(totals.withBalance),
      withOpenDate: Number(totals.withOpenDate),
      institutionCount: Number(institutionCount[0]?.count ?? 0),
      statusBreakdown: statusBreakdown.map(r => ({ name: r.status, value: Number(r.count) })),
      typeBreakdown: typeBreakdown.map(r => ({ name: r.accountType, value: Number(r.count) })),
    };
  }

  async getBorrowerAggregates(organizationId?: string, country?: string) {
    const filters: any[] = [];
    if (organizationId) filters.push(eq(borrowers.organizationId, organizationId));
    if (country) filters.push(eq(borrowers.country, country));
    const where = filters.length > 1 ? and(...filters) : filters[0];

    const [totals] = await db.select({
      total: count(),
      individuals: sql<number>`COUNT(*) FILTER (WHERE "type" = 'individual')`,
      corporates: sql<number>`COUNT(*) FILTER (WHERE "type" = 'corporate')`,
      countriesServed: sql<number>`COUNT(DISTINCT "country")`,
      withName: sql<number>`COUNT(*) FILTER (WHERE ("first_name" IS NOT NULL AND "first_name" != '') OR ("company_name" IS NOT NULL AND "company_name" != ''))`,
      withNationalId: sql<number>`COUNT(*) FILTER (WHERE "national_id" IS NOT NULL AND "national_id" != '')`,
      withDob: sql<number>`COUNT(*) FILTER (WHERE "date_of_birth" IS NOT NULL AND "date_of_birth" != '')`,
      withGender: sql<number>`COUNT(*) FILTER (WHERE "gender" IS NOT NULL AND "gender" != '')`,
      withLocation: sql<number>`COUNT(*) FILTER (WHERE ("city" IS NOT NULL AND "city" != '') OR ("region" IS NOT NULL AND "region" != ''))`,
      withContact: sql<number>`COUNT(*) FILTER (WHERE ("phone" IS NOT NULL AND "phone" != '') OR ("email" IS NOT NULL AND "email" != ''))`,
      avgCreditScore: sql<string>`COALESCE(0)::text`,
    }).from(borrowers).where(where);

    const totalCount = Number(totals.total);
    const filledFields = Number(totals.withName) + Number(totals.withNationalId) + Number(totals.withDob) +
      Number(totals.withGender) + Number(totals.withLocation) + Number(totals.withContact);
    const totalFields = totalCount * 6;
    const dataAccuracy = totalFields > 0 ? Math.round((filledFields / totalFields) * 1000) / 10 : 0;

    return {
      total: totalCount,
      individuals: Number(totals.individuals),
      corporates: Number(totals.corporates),
      countriesServed: Number(totals.countriesServed),
      avgCreditScore: Math.round(parseFloat(totals.avgCreditScore)),
      dataAccuracy,
    };
  }

  async getConcentrationData(organizationId?: string, country?: string) {
    const filters: any[] = [];
    if (organizationId) filters.push(eq(creditAccounts.organizationId, organizationId));
    if (country) filters.push(this.countryOrgFilter(creditAccounts, country));
    const where = filters.length > 1 ? and(...filters) : filters[0];

    const [totalRow] = await db.select({
      total: sql<string>`COALESCE(SUM(${creditAccounts.currentBalance}::numeric), 0)::text`,
    }).from(creditAccounts).where(where);
    const totalExposure = parseFloat(totalRow.total);

    const borrowerExposure = await db.select({
      borrowerId: creditAccounts.borrowerId,
      total: sql<string>`SUM(${creditAccounts.currentBalance}::numeric)::text`,
    }).from(creditAccounts).where(where).groupBy(creditAccounts.borrowerId).orderBy(desc(sql`SUM(${creditAccounts.currentBalance}::numeric)`)).limit(20);

    const lenderExposure = await db.select({
      lender: creditAccounts.lenderInstitution,
      total: sql<string>`SUM(${creditAccounts.currentBalance}::numeric)::text`,
    }).from(creditAccounts).where(where).groupBy(creditAccounts.lenderInstitution).orderBy(desc(sql`SUM(${creditAccounts.currentBalance}::numeric)`)).limit(20);

    const sectorExposure = await db.select({
      sector: creditAccounts.accountType,
      total: sql<string>`SUM(${creditAccounts.currentBalance}::numeric)::text`,
    }).from(creditAccounts).where(where).groupBy(creditAccounts.accountType).orderBy(desc(sql`SUM(${creditAccounts.currentBalance}::numeric)`)).limit(20);

    return {
      totalExposure,
      borrowerExposure: borrowerExposure.map(r => ({ borrowerId: r.borrowerId, total: parseFloat(r.total) })),
      lenderExposure: lenderExposure.map(r => ({ lender: r.lender, total: parseFloat(r.total) })),
      sectorExposure: sectorExposure.map(r => ({ sector: r.sector, total: parseFloat(r.total) })),
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

  /* GLOBAL: no country filter by design — exchange rates are system-wide */
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

  async getRetentionPolicies(country?: string): Promise<RetentionPolicy[]> {
    requireCountryScope(country, "getRetentionPolicies");
    if (country) {
      return db.select().from(retentionPolicies).where(eq(retentionPolicies.country, country)).orderBy(retentionPolicies.country);
    }
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

  async getApiConfigurations(country?: string): Promise<ApiConfiguration[]> {
    requireCountryScope(country, "getApiConfigurations");
    return db.select().from(apiConfigurations).where(
      eq(apiConfigurations.country, country!)
    ).orderBy(apiConfigurations.category, apiConfigurations.name);
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

  async getDishonouredChequesByBorrower(borrowerId: string): Promise<DishonouredCheque[]> {
    return db.select().from(dishonouredCheques).where(eq(dishonouredCheques.borrowerId, borrowerId)).orderBy(desc(dishonouredCheques.createdAt));
  }

  async getAllDishonouredCheques(organizationId?: string, country?: string, recentDays?: number): Promise<DishonouredCheque[]> {
    requireCountryScope(country, "getAllDishonouredCheques");
    const filters: any[] = [this.countryOrgFilter(dishonouredCheques, country!)];
    if (organizationId) filters.push(eq(dishonouredCheques.organizationId, organizationId));
    if (recentDays && recentDays > 0) {
      const cutoff = new Date(Date.now() - recentDays * 24 * 60 * 60 * 1000);
      filters.push(gte(dishonouredCheques.createdAt, cutoff));
    }
    const where = filters.length > 1 ? and(...filters) : filters[0];
    return db.select().from(dishonouredCheques).where(where).orderBy(desc(dishonouredCheques.createdAt)).limit(200);
  }

  async createDishonouredCheque(cheque: InsertDishonouredCheque): Promise<DishonouredCheque> {
    const [created] = await db.insert(dishonouredCheques).values(cheque).returning();
    return created;
  }

  async getGuarantorsByAccount(creditAccountId: string): Promise<Guarantor[]> {
    return db.select().from(guarantors).where(eq(guarantors.creditAccountId, creditAccountId)).orderBy(guarantors.guarantorNumber);
  }

  async createGuarantor(guarantor: InsertGuarantor): Promise<Guarantor> {
    const [created] = await db.insert(guarantors).values(guarantor).returning();
    return created;
  }

  async getGuarantorsByBorrower(borrowerId: string, country?: string): Promise<Guarantor[]> {
    requireCountryScope(country, "getGuarantorsByBorrower");
    const accFilters: any[] = [eq(creditAccounts.borrowerId, borrowerId)];
    accFilters.push(this.countryOrgFilter(creditAccounts, country!));
    const accWhere = accFilters.length > 1 ? and(...accFilters) : accFilters[0];
    const accounts = await db.select({ id: creditAccounts.id }).from(creditAccounts).where(accWhere);
    if (accounts.length === 0) return [];
    const accountIds = accounts.map(a => a.id);
    return db.select().from(guarantors).where(inArray(guarantors.creditAccountId, accountIds)).orderBy(guarantors.guarantorNumber);
  }

  async getBorrowerAlerts(organizationId?: string, country?: string | string[], recentDays?: number): Promise<BorrowerAlert[]> {
    requireCountryScope(country, "getBorrowerAlerts");
    const filters: any[] = [];
    if (organizationId) filters.push(eq(borrowerAlerts.organizationId, organizationId));
    if (country) filters.push(this.countryOrgFilter(borrowerAlerts, country));
    if (recentDays && recentDays > 0) {
      const cutoff = new Date(Date.now() - recentDays * 24 * 60 * 60 * 1000);
      filters.push(gte(borrowerAlerts.createdAt, cutoff));
    }
    const where = filters.length > 1 ? and(...filters) : filters[0];
    return db.select().from(borrowerAlerts).where(where).orderBy(desc(borrowerAlerts.createdAt)).limit(500);
  }

  async getBorrowerAlertsByBorrower(borrowerId: string): Promise<BorrowerAlert[]> {
    return db.select().from(borrowerAlerts).where(eq(borrowerAlerts.borrowerId, borrowerId)).orderBy(desc(borrowerAlerts.createdAt)).limit(100);
  }

  async createBorrowerAlert(alert: InsertBorrowerAlert): Promise<BorrowerAlert> {
    const [created] = await db.insert(borrowerAlerts).values(alert).returning();
    return created;
  }

  async createIdentityVerification(v: InsertIdentityVerification): Promise<IdentityVerification> {
    const [created] = await db.insert(identityVerifications).values(v).returning();
    return created;
  }
  async getIdentityVerifications(borrowerId: string): Promise<IdentityVerification[]> {
    return db.select().from(identityVerifications).where(eq(identityVerifications.borrowerId, borrowerId)).orderBy(desc(identityVerifications.createdAt));
  }
  async createWatchlistHit(h: InsertWatchlistHit): Promise<WatchlistHit> {
    const [created] = await db.insert(watchlistHits).values(h).returning();
    return created;
  }
  async getWatchlistHits(borrowerId: string): Promise<WatchlistHit[]> {
    return db.select().from(watchlistHits).where(eq(watchlistHits.borrowerId, borrowerId)).orderBy(desc(watchlistHits.createdAt));
  }
  async getOpenWatchlistHits(organizationId?: string): Promise<WatchlistHit[]> {
    const filters: any[] = [eq(watchlistHits.status, "open")];
    if (organizationId) filters.push(eq(watchlistHits.organizationId, organizationId));
    return db.select().from(watchlistHits).where(and(...filters)).orderBy(desc(watchlistHits.createdAt)).limit(500);
  }
  async getWatchlistHit(id: string): Promise<WatchlistHit | undefined> {
    const [row] = await db.select().from(watchlistHits).where(eq(watchlistHits.id, id)).limit(1);
    return row;
  }
  async updateWatchlistHit(id: string, data: Partial<InsertWatchlistHit> & { resolvedAt?: Date }): Promise<WatchlistHit | undefined> {
    const [u] = await db.update(watchlistHits).set(data).where(eq(watchlistHits.id, id)).returning();
    return u;
  }
  async createFraudAlert(a: InsertFraudAlert): Promise<FraudAlert> {
    const [created] = await db.insert(fraudAlerts).values(a).returning();
    return created;
  }
  async getFraudAlerts(borrowerId: string): Promise<FraudAlert[]> {
    return db.select().from(fraudAlerts).where(eq(fraudAlerts.borrowerId, borrowerId)).orderBy(desc(fraudAlerts.createdAt));
  }
  async getOpenFraudAlerts(organizationId?: string): Promise<FraudAlert[]> {
    const filters: any[] = [eq(fraudAlerts.status, "open")];
    if (organizationId) filters.push(eq(fraudAlerts.organizationId, organizationId));
    return db.select().from(fraudAlerts).where(and(...filters)).orderBy(desc(fraudAlerts.createdAt)).limit(500);
  }
  async getFraudAlert(id: string): Promise<FraudAlert | undefined> {
    const [row] = await db.select().from(fraudAlerts).where(eq(fraudAlerts.id, id)).limit(1);
    return row;
  }
  async updateFraudAlert(id: string, data: Partial<InsertFraudAlert> & { resolvedAt?: Date }): Promise<FraudAlert | undefined> {
    const [u] = await db.update(fraudAlerts).set(data).where(eq(fraudAlerts.id, id)).returning();
    return u;
  }
  async findBorrowersByNationalId(nationalId: string, excludeId?: string): Promise<Borrower[]> {
    const encrypted = encryptBorrowerPII({ nationalId } as any).nationalId;
    const filters: any[] = [or(eq(borrowers.nationalId, nationalId), eq(borrowers.nationalId, encrypted))];
    if (excludeId) filters.push(sql`${borrowers.id} != ${excludeId}`);
    const rows = await db.select().from(borrowers).where(and(...filters)).limit(20);
    return decryptBorrowerArray(rows as Record<string, any>[]) as Borrower[];
  }
  async getRecentInquiriesForBorrower(borrowerId: string, days: number): Promise<CreditInquiry[]> {
    const cutoff = new Date(Date.now() - days * 24 * 3600 * 1000);
    return db.select().from(creditInquiries).where(and(eq(creditInquiries.borrowerId, borrowerId), gte(creditInquiries.createdAt, cutoff)));
  }

  async getTelcoProfiles(organizationId?: string, country?: string, options?: { page?: number; limit?: number; search?: string; provider?: string; kycLevel?: string; accountStatus?: string }): Promise<{ data: TelcoProfile[]; total: number; page: number; totalPages: number }> {
    requireCountryScope(country, "getTelcoProfiles");
    const page = options?.page || 1;
    const limit = Math.min(options?.limit || 50, 200);
    const offset = (page - 1) * limit;
    const filters: any[] = [];
    if (organizationId) filters.push(eq(telcoProfiles.organizationId, organizationId));
    if (country) filters.push(eq(telcoProfiles.country, country));
    if (options?.search) filters.push(ilike(telcoProfiles.msisdn, `%${options.search}%`));
    if (options?.provider) filters.push(eq(telcoProfiles.provider, options.provider as any));
    if (options?.kycLevel) filters.push(eq(telcoProfiles.kycLevel, options.kycLevel as any));
    if (options?.accountStatus) filters.push(eq(telcoProfiles.accountStatus, options.accountStatus as any));
    const where = filters.length > 1 ? and(...filters) : filters[0];
    const [totalResult] = await db.select({ value: count() }).from(telcoProfiles).where(where);
    const total = totalResult.value;
    const data = await db.select().from(telcoProfiles).where(where).orderBy(desc(telcoProfiles.createdAt)).limit(limit).offset(offset);
    return { data, total, page, totalPages: Math.ceil(total / limit) };
  }

  async getTelcoProfile(id: string): Promise<TelcoProfile | undefined> {
    const [profile] = await db.select().from(telcoProfiles).where(eq(telcoProfiles.id, id));
    return profile;
  }

  async getTelcoProfileByMsisdn(msisdn: string): Promise<TelcoProfile | undefined> {
    const [profile] = await db.select().from(telcoProfiles).where(eq(telcoProfiles.msisdn, msisdn));
    return profile;
  }

  async createTelcoProfile(profile: InsertTelcoProfile): Promise<TelcoProfile> {
    const [created] = await db.insert(telcoProfiles).values(profile).returning();
    return created;
  }

  async getMomoTransactions(profileId: string): Promise<MomoTransaction[]> {
    return db.select().from(momoTransactions).where(eq(momoTransactions.profileId, profileId)).orderBy(desc(momoTransactions.transactionDate)).limit(2000);
  }

  async createMomoTransactions(transactions: InsertMomoTransaction[]): Promise<MomoTransaction[]> {
    if (transactions.length === 0) return [];
    return db.insert(momoTransactions).values(transactions).returning();
  }

  async getTelcoCreditScores(organizationId?: string, country?: string, options?: { page?: number; limit?: number; riskTier?: string; approved?: string; search?: string; provider?: string }): Promise<{ data: TelcoCreditScore[]; total: number; page: number; totalPages: number }> {
    requireCountryScope(country, "getTelcoCreditScores");
    const page = options?.page || 1;
    const limit = Math.min(options?.limit || 50, 200);
    const offset = (page - 1) * limit;
    const needsJoin = !!(options?.search || options?.provider);
    const filters: any[] = [];
    if (organizationId) filters.push(eq(telcoCreditScores.organizationId, organizationId));
    if (country) filters.push(eq(telcoCreditScores.country, country));
    if (options?.riskTier) filters.push(eq(telcoCreditScores.riskTier, options.riskTier as any));
    if (options?.approved === "true") filters.push(eq(telcoCreditScores.approvalRecommendation, true));
    if (options?.approved === "false") filters.push(eq(telcoCreditScores.approvalRecommendation, false));
    if (options?.search) filters.push(ilike(telcoProfiles.msisdn, `%${options.search}%`));
    if (options?.provider) filters.push(eq(telcoProfiles.provider, options.provider as any));
    const where = filters.length > 1 ? and(...filters) : filters[0];
    if (needsJoin) {
      const baseQuery = db.select({ value: count() }).from(telcoCreditScores).innerJoin(telcoProfiles, eq(telcoCreditScores.profileId, telcoProfiles.id));
      const [totalResult] = await baseQuery.where(where);
      const total = totalResult.value;
      const data = await db.select({ score: telcoCreditScores }).from(telcoCreditScores).innerJoin(telcoProfiles, eq(telcoCreditScores.profileId, telcoProfiles.id)).where(where).orderBy(desc(telcoCreditScores.scoredAt)).limit(limit).offset(offset);
      return { data: data.map(r => r.score), total, page, totalPages: Math.ceil(total / limit) };
    }
    const [totalResult] = await db.select({ value: count() }).from(telcoCreditScores).where(where);
    const total = totalResult.value;
    const data = await db.select().from(telcoCreditScores).where(where).orderBy(desc(telcoCreditScores.scoredAt)).limit(limit).offset(offset);
    return { data, total, page, totalPages: Math.ceil(total / limit) };
  }

  async getTelcoCreditScoresByProfile(profileId: string): Promise<TelcoCreditScore[]> {
    return db.select().from(telcoCreditScores).where(eq(telcoCreditScores.profileId, profileId)).orderBy(desc(telcoCreditScores.scoredAt)).limit(50);
  }

  async createTelcoCreditScore(score: InsertTelcoCreditScore): Promise<TelcoCreditScore> {
    const [created] = await db.insert(telcoCreditScores).values(score).returning();
    return created;
  }

  async getTelcoDashboardStats(organizationId?: string, country?: string): Promise<{ totalProfiles: number; totalScores: number; avgRiskScore: number; approvalRate: number; tierBreakdown: Record<string, number> }> {
    requireCountryScope(country, "getTelcoDashboardStats");
    const profileFilters: any[] = [];
    if (organizationId) profileFilters.push(eq(telcoProfiles.organizationId, organizationId));
    if (country) profileFilters.push(eq(telcoProfiles.country, country));
    const profileWhere = profileFilters.length > 1 ? and(...profileFilters) : profileFilters[0];

    const [profileCount] = await db.select({ value: count() }).from(telcoProfiles).where(profileWhere);

    const scoreFilters: any[] = [];
    if (organizationId) scoreFilters.push(eq(telcoCreditScores.organizationId, organizationId));
    if (country) scoreFilters.push(eq(telcoCreditScores.country, country));
    const scoreWhere = scoreFilters.length > 1 ? and(...scoreFilters) : scoreFilters[0];

    const [scoreAgg] = await db.select({
      totalScores: count(),
      avgRisk: sql<number>`COALESCE(AVG(risk_score), 0)`,
      approved: sql<number>`COUNT(*) FILTER (WHERE approval_recommendation = true)`,
    }).from(telcoCreditScores).where(scoreWhere);

    const totalScores = scoreAgg.totalScores;
    const avgRisk = Number(scoreAgg.avgRisk);
    const approvalRate = totalScores > 0 ? (Number(scoreAgg.approved) / totalScores) * 100 : 0;

    const tierRows = await db.select({
      tier: telcoCreditScores.riskTier,
      cnt: count(),
    }).from(telcoCreditScores).where(scoreWhere).groupBy(telcoCreditScores.riskTier);

    const tierBreakdown: Record<string, number> = { very_low: 0, low: 0, medium: 0, high: 0, very_high: 0 };
    tierRows.forEach(r => { tierBreakdown[r.tier] = r.cnt; });

    return {
      totalProfiles: profileCount.value,
      totalScores,
      avgRiskScore: Math.round(avgRisk * 10) / 10,
      approvalRate: Math.round(approvalRate * 10) / 10,
      tierBreakdown,
    };
  }

  async getTelcoAnalyticsAggregates(organizationId?: string, country?: string) {
    requireCountryScope(country, "getTelcoAnalyticsAggregates");
    const profileFilters: any[] = [];
    if (organizationId) profileFilters.push(eq(telcoProfiles.organizationId, organizationId));
    if (country) profileFilters.push(eq(telcoProfiles.country, country));
    const profileWhere = profileFilters.length > 1 ? and(...profileFilters) : profileFilters[0];

    const scoreFilters: any[] = [];
    if (organizationId) scoreFilters.push(eq(telcoCreditScores.organizationId, organizationId));
    if (country) scoreFilters.push(eq(telcoCreditScores.country, country));
    const scoreWhere = scoreFilters.length > 1 ? and(...scoreFilters) : scoreFilters[0];

    const profilesByCountry = await db.select({
      country: telcoProfiles.country,
      cnt: count(),
    }).from(telcoProfiles).where(profileWhere).groupBy(telcoProfiles.country);

    const scoresByCountry = await db.select({
      country: telcoCreditScores.country,
      scored: count(),
      approved: sql<number>`COUNT(*) FILTER (WHERE approval_recommendation = true)`,
      totalVolume: sql<number>`COALESCE(SUM(CAST(credit_limit AS numeric)), 0)`,
    }).from(telcoCreditScores).where(scoreWhere).groupBy(telcoCreditScores.country);

    const monthlyRows = await db.select({
      month: sql<string>`to_char(scored_at, 'Mon YY')`,
      scored: count(),
      approved: sql<number>`COUNT(*) FILTER (WHERE approval_recommendation = true)`,
      declined: sql<number>`COUNT(*) FILTER (WHERE approval_recommendation = false)`,
    }).from(telcoCreditScores).where(scoreWhere).groupBy(sql`to_char(scored_at, 'Mon YY')`).orderBy(sql`MIN(scored_at)`);

    const providerRows = await db.select({
      provider: telcoCreditScores.aiProvider,
      cnt: count(),
    }).from(telcoCreditScores).where(scoreWhere).groupBy(telcoCreditScores.aiProvider);

    const [totals] = await db.select({
      totalScored: count(),
      totalApproved: sql<number>`COUNT(*) FILTER (WHERE approval_recommendation = true)`,
      totalCreditExtended: sql<number>`COALESCE(SUM(CAST(credit_limit AS numeric)), 0)`,
    }).from(telcoCreditScores).where(scoreWhere);

    const countryBreakdown: Record<string, { profiles: number; scored: number; approved: number; totalVolume: number }> = {};
    for (const r of profilesByCountry) {
      countryBreakdown[r.country ?? ""] = { profiles: r.cnt, scored: 0, approved: 0, totalVolume: 0 };
    }
    for (const r of scoresByCountry) {
      if (!countryBreakdown[r.country ?? ""]) countryBreakdown[r.country ?? ""] = { profiles: 0, scored: 0, approved: 0, totalVolume: 0 };
      countryBreakdown[r.country ?? ""].scored = r.scored;
      countryBreakdown[r.country ?? ""].approved = Number(r.approved);
      countryBreakdown[r.country ?? ""].totalVolume = Number(r.totalVolume);
    }

    const providerBreakdown: Record<string, number> = {};
    for (const r of providerRows) {
      providerBreakdown[r.provider || "unknown"] = r.cnt;
    }

    return {
      countryBreakdown,
      monthlyVolume: monthlyRows.map(r => ({ month: r.month, scored: r.scored, approved: Number(r.approved), declined: Number(r.declined) })),
      providerBreakdown,
      totalScored: totals.totalScored,
      totalApproved: Number(totals.totalApproved),
      totalCreditExtended: Number(totals.totalCreditExtended),
    };
  }

  async getAllTelcoProfileIds(organizationId?: string, country?: string, kycLevel?: string): Promise<string[]> {
    requireCountryScope(country, "getAllTelcoProfileIds");
    const filters: any[] = [];
    if (organizationId) filters.push(eq(telcoProfiles.organizationId, organizationId));
    if (country) filters.push(eq(telcoProfiles.country, country));
    if (kycLevel) filters.push(eq(telcoProfiles.kycLevel, kycLevel as any));
    const where = filters.length > 1 ? and(...filters) : filters[0];
    const rows = await db.select({ id: telcoProfiles.id }).from(telcoProfiles).where(where);
    return rows.map(r => r.id);
  }

  async getDecisionRules(organizationId?: string, country?: string): Promise<TelcoDecisionRule[]> {
    requireCountryScope(country, "getDecisionRules");
    const filters: any[] = [eq(telcoDecisionRules.country, country!)];
    if (organizationId) filters.push(eq(telcoDecisionRules.organizationId, organizationId));
    const where = and(...filters);
    return db.select().from(telcoDecisionRules).where(where).orderBy(desc(telcoDecisionRules.createdAt));
  }

  async getDecisionRule(id: string): Promise<TelcoDecisionRule | undefined> {
    const [rule] = await db.select().from(telcoDecisionRules).where(eq(telcoDecisionRules.id, id));
    return rule;
  }

  async getActiveDecisionRule(organizationId?: string, country?: string): Promise<TelcoDecisionRule | undefined> {
    requireCountryScope(country, "getActiveDecisionRule");
    const filters: any[] = [eq(telcoDecisionRules.isActive, true)];
    if (organizationId) {
      filters.push(or(eq(telcoDecisionRules.organizationId, organizationId), sql`${telcoDecisionRules.organizationId} IS NULL`));
    }
    if (country) {
      filters.push(or(eq(telcoDecisionRules.country, country), sql`${telcoDecisionRules.country} IS NULL`));
    }
    const [rule] = await db.select().from(telcoDecisionRules).where(and(...filters)).orderBy(desc(telcoDecisionRules.updatedAt)).limit(1);
    return rule;
  }

  async createDecisionRule(rule: InsertTelcoDecisionRule): Promise<TelcoDecisionRule> {
    const [created] = await db.insert(telcoDecisionRules).values(rule).returning();
    return created;
  }

  async updateDecisionRule(id: string, updates: Partial<InsertTelcoDecisionRule>): Promise<TelcoDecisionRule> {
    const [updated] = await db.update(telcoDecisionRules).set({ ...updates, updatedAt: new Date() }).where(eq(telcoDecisionRules.id, id)).returning();
    return updated;
  }

  async getDecisionLogs(organizationId?: string, country?: string, limit = 100): Promise<TelcoDecisionLog[]> {
    requireCountryScope(country, "getDecisionLogs");
    const filters: any[] = [eq(telcoDecisionLogs.country, country!)];
    if (organizationId) filters.push(eq(telcoDecisionLogs.organizationId, organizationId));
    const where = and(...filters);
    return db.select().from(telcoDecisionLogs).where(where).orderBy(desc(telcoDecisionLogs.decidedAt)).limit(limit);
  }

  async createDecisionLog(log: InsertTelcoDecisionLog): Promise<TelcoDecisionLog> {
    const [created] = await db.insert(telcoDecisionLogs).values(log).returning();
    return created;
  }

  async getTelcoLoans(organizationId?: string, country?: string, options?: { page?: number; limit?: number; status?: string; profileId?: string; profileIds?: string[] }): Promise<{ data: TelcoLoan[]; total: number; page: number; totalPages: number }> {
    requireCountryScope(country, "getTelcoLoans");
    const page = options?.page || 1;
    const limit = Math.min(options?.limit || 50, 200);
    const offset = (page - 1) * limit;
    const filters: any[] = [];
    if (organizationId) filters.push(eq(telcoLoans.organizationId, organizationId));
    if (country) filters.push(eq(telcoLoans.country, country));
    if (options?.status) filters.push(eq(telcoLoans.status, options.status as any));
    if (options?.profileId) filters.push(eq(telcoLoans.profileId, options.profileId));
    if (options?.profileIds && options.profileIds.length > 0) filters.push(inArray(telcoLoans.profileId, options.profileIds));
    const where = filters.length > 1 ? and(...filters) : filters[0];
    const [totalResult] = await db.select({ value: count() }).from(telcoLoans).where(where);
    const total = totalResult.value;
    const data = await db.select().from(telcoLoans).where(where).orderBy(desc(telcoLoans.createdAt)).limit(limit).offset(offset);
    return { data, total, page, totalPages: Math.ceil(total / limit) };
  }

  async getTelcoLoan(id: string): Promise<TelcoLoan | undefined> {
    const [loan] = await db.select().from(telcoLoans).where(eq(telcoLoans.id, id));
    return loan;
  }

  async createTelcoLoan(loan: InsertTelcoLoan): Promise<TelcoLoan> {
    const [created] = await db.insert(telcoLoans).values(loan).returning();
    return created;
  }

  async updateTelcoLoan(id: string, updates: Partial<InsertTelcoLoan>): Promise<TelcoLoan> {
    const [updated] = await db.update(telcoLoans).set({ ...updates, updatedAt: new Date() }).where(eq(telcoLoans.id, id)).returning();
    return updated;
  }

  async getTelcoLoansByProfile(profileId: string): Promise<TelcoLoan[]> {
    return db.select().from(telcoLoans).where(eq(telcoLoans.profileId, profileId)).orderBy(desc(telcoLoans.createdAt));
  }

  async getTelcoLoanPortfolioStats(organizationId?: string, country?: string): Promise<{
    totalDisbursed: number; totalOutstanding: number; totalRepaid: number;
    activeLoans: number; defaultedLoans: number; paidOffLoans: number;
    defaultRate: number; collectionRate: number;
    par30: number; par60: number; par90: number;
    avgLoanSize: number; totalLoans: number;
  }> {
    requireCountryScope(country, "getTelcoLoanPortfolioStats");
    const filters: any[] = [];
    if (organizationId) filters.push(eq(telcoLoans.organizationId, organizationId));
    if (country) filters.push(eq(telcoLoans.country, country));
    const where = filters.length > 1 ? and(...filters) : filters[0];

    const rows = await db.select({
      status: telcoLoans.status,
      loanAmount: telcoLoans.loanAmount,
      outstandingBalance: telcoLoans.outstandingBalance,
      amountRepaid: telcoLoans.amountRepaid,
      daysInArrears: telcoLoans.daysInArrears,
    }).from(telcoLoans).where(where);

    let totalDisbursed = 0, totalOutstanding = 0, totalRepaid = 0;
    let activeLoans = 0, defaultedLoans = 0, paidOffLoans = 0;
    let par30Count = 0, par60Count = 0, par90Count = 0;
    let activeOrRepaying = 0;

    for (const r of rows) {
      const amt = Number(r.loanAmount || 0);
      totalDisbursed += amt;
      totalOutstanding += Number(r.outstandingBalance || 0);
      totalRepaid += Number(r.amountRepaid || 0);
      const arrears = r.daysInArrears || 0;

      if (r.status === "active" || r.status === "repaying" || r.status === "disbursed") {
        activeLoans++;
        activeOrRepaying++;
        if (arrears >= 30) par30Count++;
        if (arrears >= 60) par60Count++;
        if (arrears >= 90) par90Count++;
      }
      if (r.status === "defaulted" || r.status === "written_off") defaultedLoans++;
      if (r.status === "paid_off") paidOffLoans++;
    }

    const totalLoans = rows.length;
    const closedLoans = defaultedLoans + paidOffLoans;

    return {
      totalDisbursed, totalOutstanding, totalRepaid,
      activeLoans, defaultedLoans, paidOffLoans,
      defaultRate: closedLoans > 0 ? Math.round((defaultedLoans / closedLoans) * 10000) / 100 : 0,
      collectionRate: totalDisbursed > 0 ? Math.round((totalRepaid / totalDisbursed) * 10000) / 100 : 0,
      par30: activeOrRepaying > 0 ? Math.round((par30Count / activeOrRepaying) * 10000) / 100 : 0,
      par60: activeOrRepaying > 0 ? Math.round((par60Count / activeOrRepaying) * 10000) / 100 : 0,
      par90: activeOrRepaying > 0 ? Math.round((par90Count / activeOrRepaying) * 10000) / 100 : 0,
      avgLoanSize: totalLoans > 0 ? Math.round(totalDisbursed / totalLoans) : 0,
      totalLoans,
    };
  }

  async getTelcoLoanRepayments(loanId: string): Promise<TelcoLoanRepayment[]> {
    return db.select().from(telcoLoanRepayments).where(eq(telcoLoanRepayments.loanId, loanId)).orderBy(desc(telcoLoanRepayments.dueDate));
  }

  async createTelcoLoanRepayment(repayment: InsertTelcoLoanRepayment): Promise<TelcoLoanRepayment> {
    const [created] = await db.insert(telcoLoanRepayments).values(repayment).returning();
    return created;
  }

  async updateTelcoLoanRepayment(id: string, updates: Partial<InsertTelcoLoanRepayment>): Promise<TelcoLoanRepayment> {
    const [updated] = await db.update(telcoLoanRepayments).set(updates).where(eq(telcoLoanRepayments.id, id)).returning();
    return updated;
  }

  async getTelcoConsentEvents(profileId: string): Promise<TelcoConsentEvent[]> {
    return db.select().from(telcoConsentEvents).where(eq(telcoConsentEvents.profileId, profileId)).orderBy(desc(telcoConsentEvents.createdAt));
  }

  async createTelcoConsentEvent(event: InsertTelcoConsentEvent): Promise<TelcoConsentEvent> {
    const [created] = await db.insert(telcoConsentEvents).values(event).returning();
    return created;
  }

  async getTelcoConsentSummary(organizationId?: string, country?: string): Promise<{ total: number; active: number; revoked: number; byMethod: Record<string, number> }> {
    requireCountryScope(country, "getTelcoConsentSummary");
    const filters: any[] = [];
    if (organizationId) filters.push(eq(telcoConsentEvents.organizationId, organizationId));
    if (country) filters.push(eq(telcoConsentEvents.country, country));
    const where = filters.length > 1 ? and(...filters) : filters[0];
    const rows = await db.select({ action: telcoConsentEvents.action, method: telcoConsentEvents.method }).from(telcoConsentEvents).where(where);
    let active = 0, revoked = 0;
    const byMethod: Record<string, number> = {};
    for (const r of rows) {
      if (r.action === "grant") active++;
      if (r.action === "revoke") revoked++;
      byMethod[r.method] = (byMethod[r.method] || 0) + 1;
    }
    return { total: rows.length, active, revoked, byMethod };
  }

  async getIncomeSourcesByBorrower(borrowerId: string): Promise<IncomeSource[]> {
    return await db.select().from(incomeSources).where(eq(incomeSources.borrowerId, borrowerId)).orderBy(desc(incomeSources.createdAt));
  }
  async createIncomeSource(source: InsertIncomeSource): Promise<IncomeSource> {
    const [created] = await db.insert(incomeSources).values(source).returning();
    return created;
  }
  async deleteIncomeSourcesByBorrower(borrowerId: string): Promise<void> {
    await db.delete(incomeSources).where(eq(incomeSources.borrowerId, borrowerId));
  }
  async getExpenseCategorisationsByBorrower(borrowerId: string): Promise<ExpenseCategorisation[]> {
    return await db.select().from(expenseCategorisations).where(eq(expenseCategorisations.borrowerId, borrowerId)).orderBy(desc(expenseCategorisations.createdAt));
  }
  async createExpenseCategorisation(exp: InsertExpenseCategorisation): Promise<ExpenseCategorisation> {
    const [created] = await db.insert(expenseCategorisations).values(exp).returning();
    return created;
  }
  async deleteExpenseCategorisationsByBorrower(borrowerId: string): Promise<void> {
    await db.delete(expenseCategorisations).where(eq(expenseCategorisations.borrowerId, borrowerId));
  }
  async getAffordabilityAssessmentsByBorrower(borrowerId: string): Promise<AffordabilityAssessment[]> {
    return await db.select().from(affordabilityAssessments).where(eq(affordabilityAssessments.borrowerId, borrowerId)).orderBy(desc(affordabilityAssessments.createdAt));
  }
  async getLatestAffordabilityAssessment(borrowerId: string): Promise<AffordabilityAssessment | undefined> {
    const [row] = await db.select().from(affordabilityAssessments).where(eq(affordabilityAssessments.borrowerId, borrowerId)).orderBy(desc(affordabilityAssessments.createdAt)).limit(1);
    return row;
  }
  async createAffordabilityAssessment(a: InsertAffordabilityAssessment): Promise<AffordabilityAssessment> {
    const [created] = await db.insert(affordabilityAssessments).values(a).returning();
    return created;
  }

  async getLinkedOpenBankingAccounts(borrowerId: string): Promise<LinkedOpenBankingAccount[]> {
    return await db.select().from(linkedOpenBankingAccounts).where(eq(linkedOpenBankingAccounts.borrowerId, borrowerId)).orderBy(desc(linkedOpenBankingAccounts.linkedAt));
  }
  async getActiveLinkedOpenBankingAccount(borrowerId: string, provider?: string): Promise<LinkedOpenBankingAccount | undefined> {
    const conditions = [eq(linkedOpenBankingAccounts.borrowerId, borrowerId), eq(linkedOpenBankingAccounts.status, "active")];
    if (provider) conditions.push(eq(linkedOpenBankingAccounts.provider, provider));
    const [row] = await db.select().from(linkedOpenBankingAccounts).where(and(...conditions)).orderBy(desc(linkedOpenBankingAccounts.linkedAt)).limit(1);
    return row;
  }
  async createLinkedOpenBankingAccount(data: InsertLinkedOpenBankingAccount): Promise<LinkedOpenBankingAccount> {
    const [created] = await db.insert(linkedOpenBankingAccounts).values(data).returning();
    return created;
  }
  async revokeLinkedOpenBankingAccount(id: string): Promise<void> {
    await db.update(linkedOpenBankingAccounts).set({ status: "revoked", revokedAt: new Date() }).where(eq(linkedOpenBankingAccounts.id, id));
  }

  async getRegistryHealthConfig(): Promise<RegistryHealthConfig | undefined> {
    const [row] = await db.select().from(registryHealthConfig).where(eq(registryHealthConfig.id, "default")).limit(1);
    return row;
  }

  async upsertRegistryHealthConfig(data: Partial<InsertRegistryHealthConfig>, updatedBy?: string): Promise<RegistryHealthConfig> {
    const insertValues: typeof registryHealthConfig.$inferInsert = {
      id: "default",
      alertEmail: data.alertEmail ?? null,
      slackWebhookUrl: data.slackWebhookUrl ?? null,
      checkIntervalMinutes: data.checkIntervalMinutes ?? 15,
      retentionDays: data.retentionDays ?? null,
      cleanupTimeUtc: data.cleanupTimeUtc ?? null,
      criticalFail7d: data.criticalFail7d ?? 5,
      criticalStreak30d: data.criticalStreak30d ?? 5,
      updatedAt: new Date(),
      updatedBy: updatedBy ?? null,
    };
    const updateSet: Partial<typeof registryHealthConfig.$inferInsert> = {
      updatedAt: new Date(),
      updatedBy: updatedBy ?? null,
    };
    if (data.alertEmail !== undefined) updateSet.alertEmail = data.alertEmail;
    if (data.slackWebhookUrl !== undefined) updateSet.slackWebhookUrl = data.slackWebhookUrl;
    if (data.checkIntervalMinutes !== undefined) updateSet.checkIntervalMinutes = data.checkIntervalMinutes;
    if (data.retentionDays !== undefined) updateSet.retentionDays = data.retentionDays;
    if (data.cleanupTimeUtc !== undefined) updateSet.cleanupTimeUtc = data.cleanupTimeUtc;
    if (data.criticalFail7d !== undefined) updateSet.criticalFail7d = data.criticalFail7d;
    if (data.criticalStreak30d !== undefined) updateSet.criticalStreak30d = data.criticalStreak30d;
    const [row] = await db
      .insert(registryHealthConfig)
      .values(insertValues)
      .onConflictDoUpdate({
        target: registryHealthConfig.id,
        set: updateSet,
      })
      .returning();
    return row;
  }

  async getAllRegistryThresholdOverrides(): Promise<RegistryThresholdOverride[]> {
    return await db.select().from(registryThresholdOverrides).orderBy(registryThresholdOverrides.provider);
  }

  async upsertRegistryThresholdOverride(provider: string, data: { criticalFail7d: number | null; criticalStreak30d: number | null }, updatedBy?: string): Promise<RegistryThresholdOverride> {
    const [row] = await db
      .insert(registryThresholdOverrides)
      .values({
        provider,
        criticalFail7d: data.criticalFail7d ?? null,
        criticalStreak30d: data.criticalStreak30d ?? null,
        updatedAt: new Date(),
        updatedBy: updatedBy ?? null,
      })
      .onConflictDoUpdate({
        target: registryThresholdOverrides.provider,
        set: {
          criticalFail7d: data.criticalFail7d ?? null,
          criticalStreak30d: data.criticalStreak30d ?? null,
          updatedAt: new Date(),
          updatedBy: updatedBy ?? null,
        },
      })
      .returning();
    return row;
  }

  async deleteRegistryThresholdOverride(provider: string): Promise<void> {
    await db.delete(registryThresholdOverrides).where(eq(registryThresholdOverrides.provider, provider));
  }

  async insertRegistryHealthEvent(event: InsertRegistryHealthEvent): Promise<RegistryHealthEvent> {
    const [created] = await db.insert(registryHealthEvents).values(event).returning();
    return created;
  }

  async getRegistryHealthEvents(provider: string, sinceDays = 7): Promise<RegistryHealthEvent[]> {
    const since = new Date(Date.now() - sinceDays * 24 * 60 * 60 * 1000);
    return await db
      .select()
      .from(registryHealthEvents)
      .where(and(eq(registryHealthEvents.provider, provider), gte(registryHealthEvents.checkedAt, since)))
      .orderBy(desc(registryHealthEvents.checkedAt));
  }

  async getAllRegistryHealthEvents(sinceDays = 7): Promise<RegistryHealthEvent[]> {
    const since = new Date(Date.now() - sinceDays * 24 * 60 * 60 * 1000);
    return await db
      .select()
      .from(registryHealthEvents)
      .where(gte(registryHealthEvents.checkedAt, since))
      .orderBy(desc(registryHealthEvents.checkedAt));
  }

  async deleteOldRegistryHealthEvents(beforeDate: Date): Promise<number> {
    const result = await db
      .delete(registryHealthEvents)
      .where(lt(registryHealthEvents.checkedAt, beforeDate));
    return result.rowCount ?? 0;
  }

  async countOldRegistryHealthEvents(beforeDate: Date): Promise<number> {
    const [row] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(registryHealthEvents)
      .where(lt(registryHealthEvents.checkedAt, beforeDate));
    return row?.count ?? 0;
  }

  async createTrainingAttempt(data: InsertTrainingAttempt): Promise<TrainingAttempt> {
    const [created] = await db.insert(trainingAttempts).values(data).returning();
    return created;
  }

  async getUserTrainingAttempts(userId: string): Promise<TrainingAttempt[]> {
    return await db
      .select()
      .from(trainingAttempts)
      .where(eq(trainingAttempts.userId, userId))
      .orderBy(desc(trainingAttempts.completedAt));
  }

  async getBestTrainingAttempts(userId: string): Promise<TrainingAttempt[]> {
    const all = await this.getUserTrainingAttempts(userId);
    const best = new Map<string, TrainingAttempt>();
    for (const attempt of all) {
      const existing = best.get(attempt.moduleId);
      if (!existing || attempt.score > existing.score) {
        best.set(attempt.moduleId, attempt);
      }
    }
    return Array.from(best.values());
  }

  // -------------------------------------------------------------------------
  // Loan Origination
  // -------------------------------------------------------------------------

  async getLoanApplications(organizationId?: string, status?: string): Promise<LoanApplication[]> {
    const conditions: any[] = [];
    if (organizationId) conditions.push(eq(loanApplications.organizationId, organizationId));
    if (status) conditions.push(eq(loanApplications.status, status as any));
    return await db
      .select()
      .from(loanApplications)
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(desc(loanApplications.createdAt));
  }

  async getLoanApplication(id: string): Promise<LoanApplication | undefined> {
    const [row] = await db.select().from(loanApplications).where(eq(loanApplications.id, id));
    return row;
  }

  async createLoanApplication(data: InsertLoanApplication): Promise<LoanApplication> {
    const [created] = await db.insert(loanApplications).values(data).returning();
    return created;
  }

  async updateLoanApplication(id: string, data: Partial<InsertLoanApplication>): Promise<LoanApplication | undefined> {
    const [updated] = await db
      .update(loanApplications)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(loanApplications.id, id))
      .returning();
    return updated;
  }

  async getRepaymentSchedule(loanApplicationId: string): Promise<LoanRepaymentSchedule[]> {
    return await db
      .select()
      .from(loanRepaymentSchedules)
      .where(eq(loanRepaymentSchedules.loanApplicationId, loanApplicationId))
      .orderBy(loanRepaymentSchedules.installmentNumber);
  }

  async createRepaymentSchedules(schedules: InsertLoanRepaymentSchedule[]): Promise<LoanRepaymentSchedule[]> {
    return await db.insert(loanRepaymentSchedules).values(schedules).returning();
  }

  async markInstallmentPaid(id: string, paidAmount: string): Promise<LoanRepaymentSchedule | undefined> {
    const [updated] = await db
      .update(loanRepaymentSchedules)
      .set({ paidAmount, paidAt: new Date(), status: "paid" })
      .where(eq(loanRepaymentSchedules.id, id))
      .returning();
    return updated;
  }

  // -------------------------------------------------------------------------
  // Collateral Registry
  // -------------------------------------------------------------------------

  async getCollateralItems(organizationId?: string, borrowerId?: string): Promise<(CollateralItem & { shareCount: number })[]> {
    const conditions: any[] = [];
    if (organizationId) conditions.push(eq(collateralItems.lenderOrganizationId, organizationId));
    if (borrowerId) conditions.push(eq(collateralItems.borrowerId, borrowerId));
    const items = await db
      .select()
      .from(collateralItems)
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(desc(collateralItems.createdAt));
    if (items.length === 0) return [];
    const ids = items.map(i => i.id);
    const shareCounts = await db
      .select({ collateralItemId: collateralShareLog.collateralItemId, cnt: count() })
      .from(collateralShareLog)
      .where(inArray(collateralShareLog.collateralItemId, ids))
      .groupBy(collateralShareLog.collateralItemId);
    const countMap = new Map(shareCounts.map(r => [r.collateralItemId, r.cnt]));
    return items.map(item => ({ ...item, shareCount: countMap.get(item.id) ?? 0 }));
  }

  async getCollateralItem(id: string): Promise<CollateralItem | undefined> {
    const [row] = await db.select().from(collateralItems).where(eq(collateralItems.id, id));
    return row;
  }

  async getActiveResubmissionFor(originalId: string): Promise<CollateralItem | undefined> {
    const [row] = await db.select().from(collateralItems)
      .where(and(
        eq(collateralItems.resubmittedFromId, originalId),
        sql`${collateralItems.approvalStatus} != 'rejected'`
      ));
    return row;
  }

  async createCollateralItem(data: InsertCollateralItem): Promise<CollateralItem> {
    const [created] = await db.insert(collateralItems).values(data).returning();
    return created;
  }

  async updateCollateralItem(id: string, data: Partial<InsertCollateralItem>): Promise<CollateralItem | undefined> {
    const [updated] = await db
      .update(collateralItems)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(collateralItems.id, id))
      .returning();
    return updated;
  }

  // Pan-African Registry Authority methods
  async getPendingCollateralItems(registryAuthorityId: string, countryCode?: string): Promise<CollateralItem[]> {
    // Match items assigned to this RA, OR items in the same country with no RA assigned yet
    const byRaId = eq(collateralItems.registryAuthorityId, registryAuthorityId);
    const conditions = countryCode
      ? or(byRaId, and(eq(collateralItems.countryCode, countryCode), sql`${collateralItems.registryAuthorityId} IS NULL`))
      : byRaId;
    return await db.select().from(collateralItems)
      .where(and(conditions, eq(collateralItems.approvalStatus, "pending")))
      .orderBy(collateralItems.createdAt);
  }

  async getActiveLiensByCountry(countryCode: string): Promise<CollateralItem[]> {
    // All active liens in this country regardless of which RA org is on the record.
    // Country-scoping is enforced by the route (RA can only query their own country).
    // Filtering by registryAuthorityId would hide items approved before RA provisioning.
    return await db.select().from(collateralItems)
      .where(and(
        eq(collateralItems.approvalStatus, "approved"),
        eq(collateralItems.status, "active"),
        eq(collateralItems.countryCode, countryCode)
      ))
      .orderBy(collateralItems.lienPriority, desc(collateralItems.approvalDate));
  }

  async searchLiensByAssetId(assetIdentifier: string, countryCode: string): Promise<CollateralItem[]> {
    // Case-insensitive exact match using lower() — no wildcards (ilike would permit % and _ injection)
    // Must be approved AND status=active (excludes discharged liens from results)
    const normalizedId = assetIdentifier.toLowerCase();
    return await db.select().from(collateralItems)
      .where(and(
        eq(collateralItems.approvalStatus, "approved"),
        eq(collateralItems.status, "active"),
        eq(collateralItems.countryCode, countryCode),
        or(
          sql`lower(${collateralItems.assetLocalIdentifier}) = ${normalizedId}`,
          sql`lower(${collateralItems.panAfricanAssetId}) = ${normalizedId}`
        )
      ))
      .orderBy(collateralItems.lienPriority);
  }

  // Returns the 1-based submission rank of item `id` among all items filed for the same asset,
  // ordered by createdAt (first-to-file wins, PPSR style). Uses panAfricanAssetId exact match
  // when available, falls back to assetLocalIdentifier exact match.
  async getSubmissionRankForAsset(id: string, panAfricanAssetId: string | null, assetLocalIdentifier: string | null, countryCode: string): Promise<number> {
    // Priority implements the PPSR first-to-file rule:
    // The chronological position of this filing among all non-rejected sibling filings
    // (pending + approved) determines its priority rank.
    // Rejected filings are excluded so they never consume a priority slot.
    // Because rank is based on submission timestamp (not approval timestamp), two concurrent
    // approvals will each land at their correct position in the filing queue without collision.
    const searchKey = panAfricanAssetId || assetLocalIdentifier;
    if (!searchKey) return 1;
    const paId = panAfricanAssetId?.toLowerCase() || null;
    const alId = assetLocalIdentifier?.toLowerCase() || null;
    const siblings = await db
      .select({ id: collateralItems.id, createdAt: collateralItems.createdAt })
      .from(collateralItems)
      .where(and(
        eq(collateralItems.countryCode, countryCode),
        sql`${collateralItems.approvalStatus} != 'rejected'`,
        or(
          paId ? sql`lower(${collateralItems.panAfricanAssetId}) = ${paId}` : sql`false`,
          alId ? sql`lower(${collateralItems.assetLocalIdentifier}) = ${alId}` : sql`false`
        )
      ))
      .orderBy(collateralItems.createdAt);
    const idx = siblings.findIndex(s => s.id === id);
    // Position 0-based → 1-based priority; fallback to next slot if not found
    return idx >= 0 ? idx + 1 : siblings.length + 1;
  }

  async approveCollateralItem(id: string, approvedBy: string, certificateNumber: string, lienPriority: number): Promise<CollateralItem | undefined> {
    const today = new Date().toISOString().split("T")[0];
    const [updated] = await db.update(collateralItems)
      .set({
        approvalStatus: "approved",
        approvedBy,
        approvalDate: today,
        certificateNumber,
        lienPriority,
        status: "active",
        updatedAt: new Date(),
      })
      .where(eq(collateralItems.id, id))
      .returning();
    return updated;
  }

  async rejectCollateralItem(id: string, rejectionReason: string, rejectedBy?: string): Promise<CollateralItem | undefined> {
    const [updated] = await db.update(collateralItems)
      .set({ approvalStatus: "rejected", rejectionReason, updatedAt: new Date() })
      .where(eq(collateralItems.id, id))
      .returning();
    if (updated) {
      await db.insert(collateralRejectionHistory).values({
        collateralItemId: id,
        reason: rejectionReason,
        rejectedBy: rejectedBy ?? null,
      });
    }
    return updated;
  }

  async getCollateralRejectionHistory(collateralItemId: string): Promise<CollateralRejectionHistory[]> {
    return db.select()
      .from(collateralRejectionHistory)
      .where(eq(collateralRejectionHistory.collateralItemId, collateralItemId))
      .orderBy(desc(collateralRejectionHistory.rejectedAt));
  }

  async enforceCollateralItem(id: string): Promise<CollateralItem | undefined> {
    // Only set enforcementStatus — do NOT change status to "defaulted".
    // Encumbrances must remain visible (status='active') during enforcement proceedings
    // to preserve anti-double-pledging protection until the lien is formally discharged.
    const [updated] = await db.update(collateralItems)
      .set({ enforcementStatus: "in_enforcement", updatedAt: new Date() })
      .where(eq(collateralItems.id, id))
      .returning();
    return updated;
  }

  async dischargeCollateralItem(id: string): Promise<CollateralItem | undefined> {
    const today = new Date().toISOString().split("T")[0];
    const [updated] = await db.update(collateralItems)
      .set({ status: "released", dischargeDate: today, updatedAt: new Date() })
      .where(eq(collateralItems.id, id))
      .returning();
    return updated;
  }

  async createCollateralShareLog(data: InsertCollateralShareLog): Promise<CollateralShareLog> {
    const [row] = await db.insert(collateralShareLog).values(data).returning();
    return row;
  }

  async getCollateralShareLog(collateralItemId: string): Promise<(CollateralShareLog & { senderName: string | null })[]> {
    const rows = await db
      .select({
        id: collateralShareLog.id,
        collateralItemId: collateralShareLog.collateralItemId,
        channel: collateralShareLog.channel,
        maskedRecipient: collateralShareLog.maskedRecipient,
        sentBy: collateralShareLog.sentBy,
        sentAt: collateralShareLog.sentAt,
        senderName: users.fullName,
      })
      .from(collateralShareLog)
      .leftJoin(users, eq(collateralShareLog.sentBy, users.id))
      .where(eq(collateralShareLog.collateralItemId, collateralItemId))
      .orderBy(desc(collateralShareLog.sentAt));
    return rows;
  }

  async createCollateralAmendment(data: InsertCollateralAmendment): Promise<CollateralAmendment> {
    const [row] = await db.insert(collateralAmendments).values(data).returning();
    return row;
  }

  async getCollateralAmendments(collateralItemId: string): Promise<CollateralAmendment[]> {
    return await db
      .select()
      .from(collateralAmendments)
      .where(eq(collateralAmendments.collateralItemId, collateralItemId))
      .orderBy(desc(collateralAmendments.amendedAt));
  }

  async getCollateralRegulatoryReport(countryCode: string): Promise<{
    totalActive: number; totalValue: number;
    byInstitution: { orgId: string; orgName: string; count: number; value: number }[];
    byAssetType: { type: string; count: number; value: number }[];
    bySector: { sector: string; count: number; value: number }[];
  }> {
    const items = await db.select().from(collateralItems)
      .where(and(
        eq(collateralItems.approvalStatus, "approved"),
        eq(collateralItems.countryCode, countryCode),
        eq(collateralItems.status, "active"),
      ));

    const allOrgs = await db.select().from(organizations);
    const orgMap = new Map(allOrgs.map(o => [o.id, o.name]));

    const totalActive = items.length;
    const totalValue = items.reduce((s, i) => s + Number(i.estimatedValue || 0), 0);

    const byInstitutionMap = new Map<string, { count: number; value: number }>();
    for (const item of items) {
      const orgId = item.lenderOrganizationId;
      const cur = byInstitutionMap.get(orgId) || { count: 0, value: 0 };
      cur.count++;
      cur.value += Number(item.estimatedValue || 0);
      byInstitutionMap.set(orgId, cur);
    }
    const byInstitution = [...byInstitutionMap.entries()].map(([orgId, d]) => ({
      orgId, orgName: orgMap.get(orgId) || orgId, ...d
    }));

    const byAssetTypeMap = new Map<string, { count: number; value: number }>();
    for (const item of items) {
      const type = item.collateralType;
      const cur = byAssetTypeMap.get(type) || { count: 0, value: 0 };
      cur.count++;
      cur.value += Number(item.estimatedValue || 0);
      byAssetTypeMap.set(type, cur);
    }
    const byAssetType = [...byAssetTypeMap.entries()].map(([type, d]) => ({ type, ...d }));

    // Map collateral types to economic sectors for regulatory sector exposure reporting
    const COLLATERAL_SECTOR: Record<string, string> = {
      vehicle: "Transport & Mobility",
      real_estate: "Real Estate & Construction",
      equipment: "Manufacturing & Industry",
      inventory: "Trade & Commerce",
      shares: "Financial Services",
      agricultural: "Agriculture & Agribusiness",
      livestock: "Agriculture & Agribusiness",
      intellectual_property: "Technology & IP",
    };
    const bySectorMap = new Map<string, { count: number; value: number }>();
    for (const item of items) {
      const sector = COLLATERAL_SECTOR[item.collateralType] || "Other / General";
      const cur = bySectorMap.get(sector) || { count: 0, value: 0 };
      cur.count++;
      cur.value += Number(item.estimatedValue || 0);
      bySectorMap.set(sector, cur);
    }
    const bySector = [...bySectorMap.entries()].map(([sector, d]) => ({ sector, ...d }));

    return { totalActive, totalValue, byInstitution, byAssetType, bySector };
  }

  // Registry Country Config
  async getRegistryCountryConfigs(): Promise<RegistryCountryConfig[]> {
    return await db.select().from(registryCountryConfig).orderBy(registryCountryConfig.countryName);
  }

  async getRegistryCountryConfig(countryCode: string): Promise<RegistryCountryConfig | undefined> {
    const [row] = await db.select().from(registryCountryConfig)
      .where(eq(registryCountryConfig.countryCode, countryCode));
    return row;
  }

  async upsertRegistryCountryConfig(data: InsertRegistryCountryConfig): Promise<RegistryCountryConfig> {
    const [row] = await db.insert(registryCountryConfig)
      .values(data)
      .onConflictDoUpdate({ target: registryCountryConfig.countryCode, set: data })
      .returning();
    return row;
  }

  async linkRegistryAuthorityToCountry(countryCode: string, orgId: string): Promise<void> {
    await db.update(registryCountryConfig)
      .set({ registryAuthorityOrgId: orgId, isLive: true })
      .where(eq(registryCountryConfig.countryCode, countryCode));
  }

  // -------------------------------------------------------------------------
  // Institution Branding
  // -------------------------------------------------------------------------

  async getInstitutionBranding(organizationId: string): Promise<InstitutionBranding | undefined> {
    const [row] = await db
      .select()
      .from(institutionBranding)
      .where(eq(institutionBranding.organizationId, organizationId));
    return row;
  }

  async upsertInstitutionBranding(data: InsertInstitutionBranding): Promise<InstitutionBranding> {
    const [upserted] = await db
      .insert(institutionBranding)
      .values(data)
      .onConflictDoUpdate({ target: institutionBranding.organizationId, set: { ...data, updatedAt: new Date() } })
      .returning();
    return upserted;
  }

  // -------------------------------------------------------------------------
  // Institution Analytics (usage_metering driven)
  // -------------------------------------------------------------------------

  async getUsageStats(organizationId: string, days: number): Promise<{ eventType: string; count: number; date: string }[]> {
    const rows = await db.execute(sql`
      SELECT
        event_type AS "eventType",
        DATE(recorded_at) AS date,
        COUNT(*)::int AS count
      FROM usage_metering
      WHERE organization_id = ${organizationId}
        AND recorded_at >= NOW() - INTERVAL '${sql.raw(String(days))} days'
      GROUP BY event_type, DATE(recorded_at)
      ORDER BY date DESC, count DESC
    `);
    return (rows as any).rows ?? [];
  }

  // -------------------------------------------------------------------------
  // Portfolio Trigger Alerts
  // -------------------------------------------------------------------------

  async getPortfolioTriggerSubscriptions(organizationId: string): Promise<PortfolioTriggerSubscription[]> {
    return db.select().from(portfolioTriggerSubscriptions)
      .where(eq(portfolioTriggerSubscriptions.organizationId, organizationId))
      .orderBy(desc(portfolioTriggerSubscriptions.createdAt));
  }

  async getPortfolioTriggerSubscription(id: string): Promise<PortfolioTriggerSubscription | undefined> {
    const [row] = await db.select().from(portfolioTriggerSubscriptions).where(eq(portfolioTriggerSubscriptions.id, id));
    return row;
  }

  async getPortfolioTriggerSubscriptionByBorrower(organizationId: string, borrowerId: string): Promise<PortfolioTriggerSubscription | undefined> {
    const [row] = await db.select().from(portfolioTriggerSubscriptions).where(
      and(eq(portfolioTriggerSubscriptions.organizationId, organizationId), eq(portfolioTriggerSubscriptions.borrowerId, borrowerId))
    );
    return row;
  }

  async createPortfolioTriggerSubscription(data: InsertPortfolioTriggerSubscription): Promise<PortfolioTriggerSubscription> {
    const [created] = await db.insert(portfolioTriggerSubscriptions).values(data).returning();
    return created;
  }

  async updatePortfolioTriggerSubscription(id: string, data: Partial<InsertPortfolioTriggerSubscription>): Promise<PortfolioTriggerSubscription | undefined> {
    const [updated] = await db.update(portfolioTriggerSubscriptions)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(portfolioTriggerSubscriptions.id, id))
      .returning();
    return updated;
  }

  async deletePortfolioTriggerSubscription(id: string): Promise<boolean> {
    const result = await db.delete(portfolioTriggerSubscriptions).where(eq(portfolioTriggerSubscriptions.id, id));
    return (result as any).rowCount > 0;
  }

  async getPortfolioTriggerEvents(organizationId: string, limit = 50): Promise<PortfolioTriggerEvent[]> {
    return db.select().from(portfolioTriggerEvents)
      .where(eq(portfolioTriggerEvents.organizationId, organizationId))
      .orderBy(desc(portfolioTriggerEvents.firedAt))
      .limit(limit);
  }

  async createPortfolioTriggerEvent(data: InsertPortfolioTriggerEvent): Promise<PortfolioTriggerEvent> {
    const [created] = await db.insert(portfolioTriggerEvents).values(data).returning();
    return created;
  }

  async acknowledgePortfolioTriggerEvent(id: string): Promise<PortfolioTriggerEvent | undefined> {
    const [updated] = await db.update(portfolioTriggerEvents)
      .set({ acknowledgedAt: new Date() })
      .where(eq(portfolioTriggerEvents.id, id))
      .returning();
    return updated;
  }

  async firePortfolioTriggers(borrowerId: string, eventType: string, eventData: object): Promise<number> {
    const subs = await db.select().from(portfolioTriggerSubscriptions)
      .where(and(eq(portfolioTriggerSubscriptions.borrowerId, borrowerId), eq(portfolioTriggerSubscriptions.status, "active")));
    let count = 0;
    for (const sub of subs) {
      const types = sub.triggerTypes as string[];
      if (types.includes(eventType)) {
        await db.insert(portfolioTriggerEvents).values({
          subscriptionId: sub.id,
          organizationId: sub.organizationId,
          borrowerId,
          eventType,
          eventData,
          notifiedVia: ["in_app"],
        });
        count++;
      }
    }
    return count;
  }

  async getAccountTrends(creditAccountId: string): Promise<{ period: string; amountDue: string; amountPaid: string; status: string; daysLate: number }[]> {
    const rows = await db.select({
      period: paymentHistory.period,
      amountDue: paymentHistory.amountDue,
      amountPaid: paymentHistory.amountPaid,
      status: paymentHistory.status,
      daysLate: paymentHistory.daysLate,
    }).from(paymentHistory)
      .where(eq(paymentHistory.creditAccountId, creditAccountId))
      .orderBy(desc(paymentHistory.period))
      .limit(24);
    return rows.map(r => ({ ...r, daysLate: r.daysLate ?? 0 }));
  }

  async getBorrowerTrendSummary(borrowerId: string): Promise<{ scoreHistory: { score: number; createdAt: Date }[]; accountCount: number; activeDelinquencies: number; balanceTrend: string }> {
    const [scoreRows, accounts] = await Promise.all([
      db.select({ score: creditScoreHistory.score, createdAt: creditScoreHistory.createdAt })
        .from(creditScoreHistory)
        .where(eq(creditScoreHistory.borrowerId, borrowerId))
        .orderBy(desc(creditScoreHistory.createdAt))
        .limit(24),
      db.select().from(creditAccounts).where(eq(creditAccounts.borrowerId, borrowerId)),
    ]);
    const delinquent = accounts.filter(a => a.status === "delinquent" || a.status === "default").length;
    let balanceTrend = "stable";
    if (scoreRows.length >= 3) {
      const recent = scoreRows[0].score;
      const older = scoreRows[Math.min(2, scoreRows.length - 1)].score;
      if (recent > older + 10) balanceTrend = "improving";
      else if (recent < older - 10) balanceTrend = "deteriorating";
    }
    return { scoreHistory: scoreRows.map(r => ({ score: r.score, createdAt: r.createdAt! })), accountCount: accounts.length, activeDelinquencies: delinquent, balanceTrend };
  }

  async recordConsumerScoreHistory(nationalId: string, borrowerId: string | null, score: number): Promise<void> {
    if (!nationalId) return;
    const [latest] = await db
      .select({ score: consumerScoreHistory.score })
      .from(consumerScoreHistory)
      .where(eq(consumerScoreHistory.nationalId, nationalId))
      .orderBy(desc(consumerScoreHistory.recordedAt))
      .limit(1);
    if (latest && latest.score === score) return;
    await db.insert(consumerScoreHistory).values({ nationalId, borrowerId: borrowerId ?? null, score });
    if (borrowerId && latest) {
      this.fireConsumerMonitoringAlerts(
        borrowerId,
        "score_change",
        "Credit Score Changed",
        `Your credit score changed from ${latest.score} to ${score}.`,
        { previousScore: latest.score, newScore: score },
      ).catch(err => console.warn("[Score Push]", err));
    }
  }

  // -------------------------------------------------------------------------
  // Consumer Credit Monitoring
  // -------------------------------------------------------------------------

  async getConsumerMonitoringPrefs(consumerAccountId: string): Promise<ConsumerMonitoringPrefs | undefined> {
    const [row] = await db.select().from(consumerMonitoringPrefs).where(eq(consumerMonitoringPrefs.consumerAccountId, consumerAccountId));
    return row;
  }

  async upsertConsumerMonitoringPrefs(data: InsertConsumerMonitoringPrefs): Promise<ConsumerMonitoringPrefs> {
    const [upserted] = await db.insert(consumerMonitoringPrefs).values(data)
      .onConflictDoUpdate({ target: consumerMonitoringPrefs.consumerAccountId, set: { ...data, updatedAt: new Date() } })
      .returning();
    return upserted;
  }

  async getConsumerMonitoringAlerts(consumerAccountId: string, limit = 50): Promise<ConsumerMonitoringAlert[]> {
    return db.select().from(consumerMonitoringAlerts)
      .where(eq(consumerMonitoringAlerts.consumerAccountId, consumerAccountId))
      .orderBy(desc(consumerMonitoringAlerts.sentAt))
      .limit(limit);
  }

  async createConsumerMonitoringAlert(data: InsertConsumerMonitoringAlert): Promise<ConsumerMonitoringAlert> {
    const [created] = await db.insert(consumerMonitoringAlerts).values(data).returning();
    sendPushToConsumerAccount(data.consumerAccountId, data.title, data.message).catch(() => {});
    return created;
  }

  async markConsumerMonitoringAlertRead(id: string, consumerAccountId: string): Promise<boolean> {
    const result = await db.update(consumerMonitoringAlerts)
      .set({ isRead: true, readAt: new Date() })
      .where(and(eq(consumerMonitoringAlerts.id, id), eq(consumerMonitoringAlerts.consumerAccountId, consumerAccountId)));
    return (result as any).rowCount > 0;
  }

  async markAllConsumerMonitoringAlertsRead(consumerAccountId: string): Promise<number> {
    const result = await db.update(consumerMonitoringAlerts)
      .set({ isRead: true, readAt: new Date() })
      .where(and(eq(consumerMonitoringAlerts.consumerAccountId, consumerAccountId), eq(consumerMonitoringAlerts.isRead, false)));
    return (result as any).rowCount ?? 0;
  }

  async fireConsumerMonitoringAlerts(borrowerId: string, alertType: string, title: string, message: string, details?: object): Promise<number> {
    const prefs = await db.select().from(consumerMonitoringPrefs)
      .where(and(eq(consumerMonitoringPrefs.borrowerId, borrowerId), eq(consumerMonitoringPrefs.isActive, true)));
    let fired = 0;
    for (const pref of prefs) {
      const shouldFire =
        (alertType === "score_change" && pref.alertScoreChange) ||
        (alertType === "new_inquiry" && pref.alertNewInquiry) ||
        (alertType === "new_account" && pref.alertNewAccount) ||
        (alertType === "dispute_update" && pref.alertDisputeUpdate) ||
        (alertType === "late_payment" && pref.alertLatePayment) ||
        (alertType === "new_judgment" && pref.alertNewJudgment);
      if (shouldFire) {
        await db.insert(consumerMonitoringAlerts).values({
          consumerAccountId: pref.consumerAccountId,
          borrowerId,
          alertType,
          title,
          message,
          details: details ?? null,
          sentViaSms: false,
          sentViaEmail: false,
        });
        sendPushToConsumerAccount(pref.consumerAccountId, title, message).catch(() => {});
        fired++;
      }
    }
    return fired;
  }

  async createCollateralAmendmentRequest(data: InsertCollateralAmendmentRequest): Promise<CollateralAmendmentRequest> {
    const [row] = await db.insert(collateralAmendmentRequests).values(data).returning();
    return row;
  }

  async getCollateralAmendmentRequests(countryCode?: string, lenderOrganizationId?: string): Promise<(CollateralAmendmentRequest & { registrationNumber?: string; collateralType?: string; lenderOrgName?: string; requesterName?: string })[]> {
    const rows = await db
      .select({
        id: collateralAmendmentRequests.id,
        collateralItemId: collateralAmendmentRequests.collateralItemId,
        requestedBy: collateralAmendmentRequests.requestedBy,
        lenderOrganizationId: collateralAmendmentRequests.lenderOrganizationId,
        proposedChanges: collateralAmendmentRequests.proposedChanges,
        amendmentReason: collateralAmendmentRequests.amendmentReason,
        status: collateralAmendmentRequests.status,
        reviewedBy: collateralAmendmentRequests.reviewedBy,
        reviewNotes: collateralAmendmentRequests.reviewNotes,
        reviewedAt: collateralAmendmentRequests.reviewedAt,
        createdAt: collateralAmendmentRequests.createdAt,
        updatedAt: collateralAmendmentRequests.updatedAt,
        registrationNumber: collateralItems.registrationNumber,
        collateralType: collateralItems.collateralType,
        itemCountryCode: collateralItems.countryCode,
        lenderOrgName: organizations.name,
        requesterName: users.fullName,
      })
      .from(collateralAmendmentRequests)
      .leftJoin(collateralItems, eq(collateralAmendmentRequests.collateralItemId, collateralItems.id))
      .leftJoin(organizations, eq(collateralAmendmentRequests.lenderOrganizationId, organizations.id))
      .leftJoin(users, eq(collateralAmendmentRequests.requestedBy, users.id))
      .where(
        and(
          lenderOrganizationId ? eq(collateralAmendmentRequests.lenderOrganizationId, lenderOrganizationId) : undefined,
          countryCode ? eq(collateralItems.countryCode, countryCode) : undefined,
        )
      )
      .orderBy(desc(collateralAmendmentRequests.createdAt));
    return rows.map(({ itemCountryCode: _cc, ...rest }) => ({
      ...rest,
      registrationNumber: rest.registrationNumber ?? undefined,
      collateralType: rest.collateralType ?? undefined,
      lenderOrgName: rest.lenderOrgName ?? undefined,
      requesterName: rest.requesterName ?? undefined,
    }));
  }

  async getCollateralAmendmentRequestsForItem(collateralItemId: string): Promise<CollateralAmendmentRequest[]> {
    return db.select()
      .from(collateralAmendmentRequests)
      .where(eq(collateralAmendmentRequests.collateralItemId, collateralItemId))
      .orderBy(desc(collateralAmendmentRequests.createdAt));
  }

  async approveCollateralAmendmentRequest(requestId: string, reviewedBy: string): Promise<CollateralAmendmentRequest | { error: "not_found" | "not_pending" | "invalid_data" | "collateral_not_approved" }> {
    const [req] = await db.select().from(collateralAmendmentRequests).where(eq(collateralAmendmentRequests.id, requestId));
    if (!req) return { error: "not_found" };
    if (req.status !== "pending") return { error: "not_pending" };
    let proposed: Record<string, unknown>;
    try {
      proposed = JSON.parse(req.proposedChanges) as Record<string, unknown>;
    } catch {
      return { error: "invalid_data" };
    }
    const ALLOWED_FIELDS: readonly string[] = [
      "borrowerName", "borrowerId", "collateralType", "collateralClass", "description",
      "estimatedValue", "currency", "documentReference", "grantorNationalId",
      "assetLocalIdentifier", "panAfricanAssetId", "securityInterestType",
      "financingDuration", "expiryDate", "registrationDate", "debtorType",
      "isPmsi", "location", "notes", "legalRegime",
      "vehicleChassis", "vehicleMake", "vehicleModel", "yearOfManufacture",
      "engineNumber", "chassisNumber", "titleDeedNumber", "plotNumber",
      "landRegistryRef", "surfaceAreaSqm", "serialNumber", "equipmentMake",
      "equipmentModel", "purchaseDate", "assetDescription",
      "grantorBusinessRegistryNumber", "grantorIdNumber",
    ];
    const safeChanges = Object.fromEntries(
      Object.entries(proposed).filter(([k, v]) => ALLOWED_FIELDS.includes(k) && v !== undefined)
    ) as Partial<typeof collateralItems.$inferInsert>;
    let updated: typeof collateralAmendmentRequests.$inferSelect | undefined;
    try {
      updated = await db.transaction(async (tx) => {
        const [claimed] = await tx.update(collateralAmendmentRequests)
          .set({ status: "approved", reviewedBy, reviewedAt: new Date(), updatedAt: new Date() })
          .where(and(eq(collateralAmendmentRequests.id, requestId), eq(collateralAmendmentRequests.status, "pending")))
          .returning();
        if (!claimed) return undefined;
        const [collateralUpdated] = await tx.update(collateralItems)
          .set({ ...safeChanges, updatedAt: new Date() })
          .where(and(eq(collateralItems.id, req.collateralItemId), eq(collateralItems.approvalStatus, "approved")))
          .returning({ id: collateralItems.id });
        if (!collateralUpdated) throw new Error("COLLATERAL_NOT_APPROVED");
        return claimed;
      });
    } catch (e: unknown) {
      if (e instanceof Error && e.message === "COLLATERAL_NOT_APPROVED") {
        return { error: "collateral_not_approved" };
      }
      throw e;
    }
    if (!updated) return { error: "not_pending" };
    return updated;
  }

  async rejectCollateralAmendmentRequest(requestId: string, reviewedBy: string, reviewNotes: string): Promise<CollateralAmendmentRequest | { error: "not_found" | "not_pending" }> {
    const [req] = await db.select().from(collateralAmendmentRequests).where(eq(collateralAmendmentRequests.id, requestId));
    if (!req) return { error: "not_found" };
    if (req.status !== "pending") return { error: "not_pending" };
    const [updated] = await db.update(collateralAmendmentRequests)
      .set({ status: "rejected", reviewedBy, reviewNotes, reviewedAt: new Date(), updatedAt: new Date() })
      .where(and(eq(collateralAmendmentRequests.id, requestId), eq(collateralAmendmentRequests.status, "pending")))
      .returning();
    return updated;
  }

  // ── Cross-Product Bridge ──────────────────────────────────────────────
  async getLotoMerchantById(id: string): Promise<LotoMerchant | undefined> {
    const [row] = await db.select().from(lotoMerchants).where(eq(lotoMerchants.id, id));
    return row;
  }
  async getLotoMerchantByUserId(userId: string): Promise<LotoMerchant | undefined> {
    const [row] = await db.select().from(lotoMerchants).where(eq(lotoMerchants.userId, userId));
    return row;
  }
  async getLotoMerchantByBorrowerId(borrowerId: string): Promise<LotoMerchant | undefined> {
    const [row] = await db.select().from(lotoMerchants).where(eq(lotoMerchants.borrowerId, borrowerId));
    return row;
  }
  async createLotoMerchant(input: InsertLotoMerchant): Promise<LotoMerchant> {
    const [row] = await db.insert(lotoMerchants).values(input).returning();
    return row;
  }
  async updateLotoMerchantOptIn(id: string, optIn: boolean): Promise<LotoMerchant | undefined> {
    const [row] = await db.update(lotoMerchants).set({ creditOptInActive: optIn }).where(eq(lotoMerchants.id, id)).returning();
    return row;
  }
  async listLotoMerchants(limit = 50): Promise<LotoMerchant[]> {
    return db.select().from(lotoMerchants).orderBy(desc(lotoMerchants.registeredAt)).limit(limit);
  }
  async getLotoMerchantByShopNameAndCountry(shopName: string, countryCode: string): Promise<LotoMerchant | undefined> {
    const [row] = await db.select().from(lotoMerchants)
      .where(and(eq(lotoMerchants.shopName, shopName), eq(lotoMerchants.countryCode, countryCode)))
      .limit(1);
    return row;
  }
  async countLotoReceiptsByConsumer(userId: string): Promise<number> {
    const [row] = await db.select({ n: sql<number>`count(*)::int` }).from(lotoReceipts)
      .where(eq(lotoReceipts.consumerUserId, userId));
    return row?.n ?? 0;
  }
  async listLotoReceiptsByMerchant(merchantId: string, limit = 200): Promise<LotoReceipt[]> {
    return db.select().from(lotoReceipts).where(eq(lotoReceipts.merchantId, merchantId)).orderBy(desc(lotoReceipts.issuedAt)).limit(limit);
  }
  async listLotoReceiptsByConsumer(userId: string, limit = 200): Promise<LotoReceipt[]> {
    return db.select().from(lotoReceipts).where(eq(lotoReceipts.consumerUserId, userId)).orderBy(desc(lotoReceipts.issuedAt)).limit(limit);
  }
  async createLotoReceipt(input: InsertLotoReceipt): Promise<LotoReceipt> {
    const [row] = await db.insert(lotoReceipts).values(input).returning();
    return row;
  }
  // ── Loto Draw Engine (Task #283) ──────────────────────────────────────
  async getLotoCountryDrawConfig(countryCode: string): Promise<LotoCountryDrawConfig | undefined> {
    const [row] = await db.select().from(lotoCountryDrawConfig).where(eq(lotoCountryDrawConfig.countryCode, countryCode));
    return row;
  }
  async upsertLotoCountryDrawConfig(input: InsertLotoCountryDrawConfig): Promise<LotoCountryDrawConfig> {
    const existing = await this.getLotoCountryDrawConfig(input.countryCode);
    if (existing) {
      const [row] = await db.update(lotoCountryDrawConfig)
        .set({ ...input, updatedAt: new Date() })
        .where(eq(lotoCountryDrawConfig.id, existing.id))
        .returning();
      return row;
    }
    const [row] = await db.insert(lotoCountryDrawConfig).values(input).returning();
    return row;
  }
  async listLotoCountryDrawConfigs(): Promise<LotoCountryDrawConfig[]> {
    return db.select().from(lotoCountryDrawConfig).orderBy(lotoCountryDrawConfig.countryCode);
  }
  async getLotoDraw(id: string): Promise<LotoDraw | undefined> {
    const [row] = await db.select().from(lotoDraws).where(eq(lotoDraws.id, id));
    return row;
  }
  async listLotoDraws(filter: { countryCode?: string; limit?: number } = {}): Promise<LotoDraw[]> {
    const limit = filter.limit ?? 25;
    if (filter.countryCode) {
      return db.select().from(lotoDraws).where(eq(lotoDraws.countryCode, filter.countryCode))
        .orderBy(desc(lotoDraws.drawNumber)).limit(limit);
    }
    return db.select().from(lotoDraws).orderBy(desc(lotoDraws.scheduledFor)).limit(limit);
  }
  async listScheduledLotoDrawsDue(now: Date): Promise<LotoDraw[]> {
    return db.select().from(lotoDraws)
      .where(and(eq(lotoDraws.status, "scheduled"), sql`${lotoDraws.scheduledFor} <= ${now}`))
      .orderBy(lotoDraws.scheduledFor)
      .limit(25);
  }
  async getNextLotoDrawNumber(countryCode: string): Promise<number> {
    const [row] = await db.select({ n: sql<number>`coalesce(max(${lotoDraws.drawNumber}), 0)::int` })
      .from(lotoDraws).where(eq(lotoDraws.countryCode, countryCode));
    return (row?.n ?? 0) + 1;
  }
  async createLotoDrawWithTiers(input: {
    draw: InsertLotoDraw & { serverSeed: string; serverNonce: string };
    tiers: Omit<InsertLotoDrawPrizeTier, "drawId">[];
  }): Promise<{ draw: LotoDraw; tiers: LotoDrawPrizeTier[] }> {
    return db.transaction(async (tx) => {
      const [draw] = await tx.insert(lotoDraws).values(input.draw).returning();
      if (input.tiers.length === 0) {
        return { draw, tiers: [] as LotoDrawPrizeTier[] };
      }
      const tierRows = await tx.insert(lotoDrawPrizeTiers)
        .values(input.tiers.map((t) => ({ ...t, drawId: draw.id })))
        .returning();
      return { draw, tiers: tierRows };
    });
  }
  async listLotoDrawPrizeTiers(drawId: string): Promise<LotoDrawPrizeTier[]> {
    return db.select().from(lotoDrawPrizeTiers).where(eq(lotoDrawPrizeTiers.drawId, drawId))
      .orderBy(lotoDrawPrizeTiers.position);
  }
  async listLotoDrawWinners(drawId: string): Promise<LotoDrawWinner[]> {
    return db.select().from(lotoDrawWinners).where(eq(lotoDrawWinners.drawId, drawId))
      .orderBy(lotoDrawWinners.selectionRank);
  }
  async getEligibleReceiptsForDraw(countryCode: string, periodStart: Date, periodEnd: Date): Promise<LotoReceipt[]> {
    // Deterministic order is part of the provably-fair contract: pool hash
    // and selection ranking must be reproducible regardless of who calls
    // this method, so always sort by primary key in the storage layer.
    //
    // Eligibility rules (Task #283):
    //   1. Receipt issued by an active merchant in the target country.
    //   2. Receipt issued within [periodStart, periodEnd).
    //   3. Receipt has been claimed by a registered consumer (consumerUserId
    //      IS NOT NULL) — prevents merchants from auto-winning on unclaimed
    //      paper receipts.
    //   4. That consumer's user account is `active` — banned/locked users
    //      cannot win.
    return db.select().from(lotoReceipts)
      .innerJoin(lotoMerchants, eq(lotoReceipts.merchantId, lotoMerchants.id))
      .innerJoin(users, eq(lotoReceipts.consumerUserId, users.id))
      .where(and(
        eq(lotoMerchants.countryCode, countryCode),
        sql`${lotoReceipts.issuedAt} >= ${periodStart}`,
        sql`${lotoReceipts.issuedAt} < ${periodEnd}`,
        sql`${lotoReceipts.consumerUserId} IS NOT NULL`,
        eq(users.status, "active"),
        // Phone-verified consumer requirement (Task #283): the consumer must
        // have completed phone-OTP verification — prevents fake-account
        // farming and matches the published eligibility contract.
        sql`${users.phoneVerifiedAt} IS NOT NULL`,
      ))
      .orderBy(lotoReceipts.id)
      .then((rows: { loto_receipts: LotoReceipt }[]) => rows.map((r) => r.loto_receipts));
  }
  async persistLotoDrawResults(input: {
    drawId: string;
    poolHash: string;
    eligibleTicketCount: number;
    eligibleReceiptIdsSnapshot: string[];
    totalPool: string;
    winners: Array<{
      drawId: string; receiptId: string; consumerUserId: string | null;
      tier: string; prizeAmount: string; currency: string;
      selectionRank: number; selectionHash: string;
    }>;
  }): Promise<{ draw: LotoDraw; winners: LotoDrawWinner[] }> {
    return db.transaction(async (tx) => {
      // Idempotent guard: only flip "scheduled" → "closed" with reveal data.
      // The eligibleReceiptIdsSnapshot column is the immutable canonical
      // pool list — verifiers replay against it forever, even if user/receipt
      // records mutate later (Task #283 transparency requirement).
      const [draw] = await tx.update(lotoDraws)
        .set({
          status: "closed",
          poolHash: input.poolHash,
          eligibleTicketCount: input.eligibleTicketCount,
          eligibleReceiptIdsSnapshot: input.eligibleReceiptIdsSnapshot,
          totalPool: input.totalPool,
          drawnAt: new Date(),
        })
        .where(and(eq(lotoDraws.id, input.drawId), sql`${lotoDraws.status} <> 'closed'`, sql`${lotoDraws.status} <> 'verified'`))
        .returning();
      if (!draw) {
        const [existing] = await tx.select().from(lotoDraws).where(eq(lotoDraws.id, input.drawId));
        const existingWinners = await tx.select().from(lotoDrawWinners).where(eq(lotoDrawWinners.drawId, input.drawId));
        return { draw: existing!, winners: existingWinners };
      }
      let winnerRows: LotoDrawWinner[] = [];
      if (input.winners.length > 0) {
        winnerRows = await tx.insert(lotoDrawWinners).values(input.winners).returning();
      }
      return { draw, winners: winnerRows };
    });
  }
  async recordLotoPayout(input: {
    winnerId: string; provider: string; status: "pending" | "succeeded" | "failed" | "skipped";
    providerRef: string | null; lastError: string | null; amount: string; currency: string;
  }): Promise<LotoPayout> {
    return db.transaction(async (tx) => {
      const [payout] = await tx.insert(lotoPayouts).values({
        winnerId: input.winnerId,
        provider: input.provider,
        status: input.status,
        providerRef: input.providerRef,
        lastError: input.lastError,
        amount: input.amount,
        currency: input.currency,
        attemptCount: 1,
        completedAt: input.status === "succeeded" || input.status === "skipped" ? new Date() : null,
      }).returning();
      await tx.update(lotoDrawWinners)
        .set({ payoutStatus: input.status })
        .where(eq(lotoDrawWinners.id, input.winnerId));
      return payout;
    });
  }
  async listLotoPayoutsForDraw(drawId: string): Promise<LotoPayout[]> {
    return db.select({
      id: lotoPayouts.id, winnerId: lotoPayouts.winnerId, provider: lotoPayouts.provider,
      attemptCount: lotoPayouts.attemptCount, status: lotoPayouts.status,
      providerRef: lotoPayouts.providerRef, lastError: lotoPayouts.lastError,
      amount: lotoPayouts.amount, currency: lotoPayouts.currency,
      createdAt: lotoPayouts.createdAt, completedAt: lotoPayouts.completedAt,
    }).from(lotoPayouts)
      .innerJoin(lotoDrawWinners, eq(lotoPayouts.winnerId, lotoDrawWinners.id))
      .where(eq(lotoDrawWinners.drawId, drawId));
  }
  async getCrossProductConsents(filter: { userId?: string; borrowerId?: string; merchantId?: string }): Promise<CrossProductConsent[]> {
    const ors = [];
    if (filter.userId) ors.push(eq(crossProductConsents.userId, filter.userId));
    if (filter.borrowerId) ors.push(eq(crossProductConsents.borrowerId, filter.borrowerId));
    if (filter.merchantId) ors.push(eq(crossProductConsents.merchantId, filter.merchantId));
    if (ors.length === 0) return [];
    return db.select().from(crossProductConsents).where(or(...ors)).orderBy(desc(crossProductConsents.grantedAt));
  }
  async getCrossProductConsentById(id: string): Promise<CrossProductConsent | undefined> {
    const [row] = await db.select().from(crossProductConsents).where(eq(crossProductConsents.id, id));
    return row;
  }
  async createCrossProductConsent(input: InsertCrossProductConsent): Promise<CrossProductConsent> {
    const [row] = await db.insert(crossProductConsents).values(input).returning();
    return row;
  }
  async revokeCrossProductConsent(id: string, reason?: string): Promise<CrossProductConsent | undefined> {
    const [row] = await db.update(crossProductConsents)
      .set({ status: "revoked", revokedAt: new Date(), revokedReason: reason ?? null })
      .where(eq(crossProductConsents.id, id))
      .returning();
    return row;
  }
  async denyPendingCrossProductConsent(id: string, reason?: string): Promise<CrossProductConsent | undefined> {
    const [row] = await db.update(crossProductConsents)
      .set({ status: "revoked", revokedAt: new Date(), revokedReason: reason ?? "denied_by_owner" })
      .where(and(eq(crossProductConsents.id, id), eq(crossProductConsents.status, "pending")))
      .returning();
    return row;
  }
  async approveCrossProductConsent(id: string): Promise<CrossProductConsent | undefined> {
    const [row] = await db.update(crossProductConsents)
      .set({ status: "active", grantedAt: new Date() })
      .where(and(eq(crossProductConsents.id, id), eq(crossProductConsents.status, "pending")))
      .returning();
    return row;
  }
  async getIncomingPendingConsents(filter: { userId?: string; merchantId?: string }): Promise<CrossProductConsent[]> {
    const ors: any[] = [];
    if (filter.userId) ors.push(eq(crossProductConsents.userId, filter.userId));
    if (filter.merchantId) ors.push(eq(crossProductConsents.merchantId, filter.merchantId));
    if (ors.length === 0) return [];
    return db.select().from(crossProductConsents)
      .where(and(eq(crossProductConsents.status, "pending"), or(...ors)))
      .orderBy(desc(crossProductConsents.createdAt));
  }
  async getCrossProductAuditEntries(limit = 100, filter?: { source?: string; target?: string; purpose?: string; since?: Date }): Promise<AuditLog[]> {
    const conditions = [eq(auditLogs.action, "cross_product_access")];
    if (filter?.since) {
      conditions.push(sql`${auditLogs.createdAt} >= ${filter.since}`);
    }
    const rows = await db.select().from(auditLogs)
      .where(and(...conditions))
      .orderBy(desc(auditLogs.createdAt))
      .limit(limit);
    if (!filter || (!filter.source && !filter.target && !filter.purpose)) return rows;
    return rows.filter((r) => {
      try {
        const d = JSON.parse(r.details ?? "{}");
        if (filter.source && d.sourceProduct !== filter.source) return false;
        if (filter.target && d.targetProduct !== filter.target) return false;
        if (filter.purpose && d.purpose !== filter.purpose) return false;
        return true;
      } catch { return false; }
    });
  }
  async getLatestCrossProductAuditTimestamp(): Promise<Date | null> {
    const [row] = await db.select({ createdAt: auditLogs.createdAt })
      .from(auditLogs)
      .where(eq(auditLogs.action, "cross_product_access"))
      .orderBy(desc(auditLogs.createdAt))
      .limit(1);
    return row?.createdAt ?? null;
  }
  async deleteAlternativeDataForBorrower(borrowerId: string, source: string): Promise<number> {
    const result = await db.delete(alternativeData).where(
      and(
        eq(alternativeData.borrowerId, borrowerId),
        sql`${alternativeData.source} = ${source}`,
      )
    ).returning({ id: alternativeData.id });
    return result.length;
  }
  async getCrossProductImpactStats() {
    const merchants = await db.select().from(lotoMerchants).limit(500);
    const merchantsOptedIn = merchants.filter((m) => m.creditOptInActive).length;
    const [receiptStat] = await db.select({
      c: sql<number>`count(*)::int`,
      s: sql<string>`coalesce(sum(amount),0)::text`,
    }).from(lotoReceipts);
    const [consentStat] = await db.select({ c: sql<number>`count(*)::int` })
      .from(crossProductConsents).where(eq(crossProductConsents.status, "active"));
    // Aggregate cross_product_access bridge metrics in a single SQL pass so the
    // unauthenticated /api/public/financial-inclusion-impact endpoint stays fast
    // as audit_logs grows. The inner CASE guards against malformed JSON in
    // `details` (a bare `details::jsonb` would hard-fail the whole query on a
    // single legacy/garbage row); CASE is the one PG construct guaranteed to
    // short-circuit, so the cast only runs when pg_input_is_valid passes. Rows
    // whose details aren't valid JSON or don't carry an outcome are silently
    // skipped — they count toward total `bridgeAccessesLogged` but neither
    // allowed nor denied, matching the previous JS behavior.
    const outcomeAgg = await db.execute(sql`
      SELECT
        COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE outcome = 'ok')::int AS allowed,
        COUNT(*) FILTER (WHERE outcome = 'denied')::int AS denied
      FROM (
        SELECT CASE WHEN pg_input_is_valid(details, 'jsonb')
                    THEN (details::jsonb)->>'outcome' END AS outcome
        FROM audit_logs
        WHERE action = 'cross_product_access'
      ) sub
    `);
    const outcomeRow = (outcomeAgg.rows[0] ?? {}) as { total?: number; allowed?: number; denied?: number };
    const totalLogged = outcomeRow.total ?? 0;
    const allowed = outcomeRow.allowed ?? 0;
    const denied = outcomeRow.denied ?? 0;

    // Top denial reasons — also computed in SQL with the same JSON-validity
    // guard so a malformed row can't crash the aggregation.
    const reasonAgg = await db.execute(sql`
      SELECT reason, COUNT(*)::int AS c
      FROM (
        SELECT
          CASE WHEN pg_input_is_valid(details, 'jsonb')
               THEN (details::jsonb)->>'outcome' END AS outcome,
          CASE WHEN pg_input_is_valid(details, 'jsonb')
               THEN (details::jsonb)->>'reason' END AS reason
        FROM audit_logs
        WHERE action = 'cross_product_access'
      ) sub
      WHERE outcome = 'denied' AND reason IS NOT NULL AND length(reason) > 0
      GROUP BY reason
      ORDER BY c DESC
      LIMIT 3
    `);
    const topDenialReasons = (reasonAgg.rows as { reason: string; c: number }[])
      .map((r) => ({ reason: r.reason, count: r.c }));

    return {
      merchantsRegistered: merchants.length,
      merchantsOptedIn,
      verifiedReceipts: receiptStat?.c ?? 0,
      verifiedTurnover: parseFloat(receiptStat?.s ?? "0"),
      activeCrossProductConsents: consentStat?.c ?? 0,
      bridgeAccessesLogged: totalLogged,
      bridgeAccessesAllowed: allowed,
      bridgeAccessesDenied: denied,
      topDenialReasons,
    };
  }
}

export const storage = new DatabaseStorage();
