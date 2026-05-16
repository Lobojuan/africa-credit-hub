/**
 * CBN (Central Bank of Nigeria) Export Generator
 * Reference: CBN Credit Reporting Act 2017 / Credit Reporting Regulation 2017, Section 12
 *
 * Nigeria-specific fields:
 *  - BVN  (Bank Verification Number) — 11-digit biometric ID; maps to borrower.bvn
 *  - NIN  (National Identification Number) — 11-digit NIMC; maps to borrower.nin
 *  - RC   (CAMA company registration number) — maps to borrower.businessRegNumber
 *  - TIN  (FIRS tax identification) — maps to borrower.tinNumber
 */

import { and, eq } from "drizzle-orm";
import { db } from "./db";
import {
  borrowers,
  creditAccounts,
  courtJudgments,
  dishonouredCheques,
  organizations,
} from "@shared/schema";
import type { Borrower, CreditAccount, CourtJudgment, DishonouredCheque } from "@shared/schema";
import {
  formatCbnDate,
  formatCbnAmount,
  generateCbnFilename,
  mapInternalStatusToCbn,
  mapInternalAssetClassToCbn,
  mapDaysInArrearsToPaymentProfileCbn,
  type CbnFileType,
} from "@shared/cbn-codes";

function pipe(...fields: string[]): string {
  return fields.join("|");
}

function safe(val: string | number | null | undefined): string {
  if (val === null || val === undefined) return "";
  return String(val);
}

async function getOrgSrn(organizationId?: string): Promise<string> {
  if (!organizationId) return "UNKNOWN";
  const [org] = await db.select().from(organizations).where(eq(organizations.id, organizationId));
  return org?.slug?.toUpperCase() || org?.name?.substring(0, 10)?.toUpperCase() || "UNKNOWN";
}

function getTodayCbnDate(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}${mm}${dd}`;
}

// ─── CBN Consumer Credit (CONC) ─────────────────────────────────────────────
const CONC_HEADERS = [
  "CorrectionIndicator", "SRN", "BranchCode", "AccountNumber", "FacilityTypeCode",
  "CurrencyCode", "DateAccountOpened", "TermOfFacility", "RepaymentFrequencyCode",
  "DisbursementAmount", "ScheduledInstallmentAmount", "CurrentBalance",
  "CurrentBalanceIndicator", "ArrearsStartDate", "AmountOverdue",
  "AmtOverdue1to30", "AmtOverdue31to60", "AmtOverdue61to90", "AmtOverdue91to120",
  "AmtOverdue121to150", "AmtOverdue151to180", "AmtOverdue181plus",
  "PaymentHistoryProfile", "AccountStatus", "AssetClassification",
  "DateOfLastPayment", "LastPaymentAmount", "MaturityDate", "NextPaymentDate",
  "InterestRate", "PurposeOfFacility", "ClosureReason", "DateClosed",
  "DateRestructured", "ReasonForRestructure", "WrittenOffDate", "WrittenOffAmount",
  "ReasonForWrittenOff", "LegalFlag", "CreditCollateralIndicator", "SecurityType",
  "NatureOfCharge", "SecurityValue", "CollateralRegRefNum", "SpecialCommentsCode",
  "NatureOfGuarantor", "JointOrSoleAccount", "NoParticipantsInAccount",
  "DefPaymentStartDate",
  // Nigeria-specific consumer identity fields (BVN + NIN replace BoG's GhanaCardPIN/NationalID)
  "BVN", "NIN", "Surname", "Forename1", "Forename2",
  "DateOfBirth", "Gender", "PassportNumber", "Title",
  "MaritalStatus", "OwnerOrTenant",
  "Address1", "Address2", "Address3", "Address4", "PostalCode",
  "HomeTelephone", "WorkTelephone", "MobileTelephone", "Email",
  "EmployerName", "EmploymentTypeCode", "Nationality",
];

// ─── CBN Business Credit (BUSC) ─────────────────────────────────────────────
const BUSC_HEADERS = [
  "CorrectionIndicator", "SRN", "BranchCode", "AccountNumber", "FacilityTypeCode",
  "CurrencyCode", "DateAccountOpened", "TermOfFacility", "RepaymentFrequencyCode",
  "DisbursementAmount", "ScheduledInstallmentAmount", "CurrentBalance",
  "CurrentBalanceIndicator", "ArrearsStartDate", "AmountOverdue",
  "AmtOverdue1to30", "AmtOverdue31to60", "AmtOverdue61to90", "AmtOverdue91to120",
  "AmtOverdue121to150", "AmtOverdue151to180", "AmtOverdue181plus",
  "PaymentHistoryProfile", "AccountStatus", "AssetClassification",
  "DateOfLastPayment", "LastPaymentAmount", "MaturityDate", "NextPaymentDate",
  "InterestRate", "PurposeOfFacility", "ClosureReason", "DateClosed",
  "DateRestructured", "ReasonForRestructure", "WrittenOffDate", "WrittenOffAmount",
  "ReasonForWrittenOff", "LegalFlag", "CreditCollateralIndicator", "SecurityType",
  "NatureOfCharge", "SecurityValue", "CollateralRegRefNum", "SpecialCommentsCode",
  "NatureOfGuarantor", "JointOrSoleAccount", "NoParticipantsInAccount",
  "DefPaymentStartDate",
  // Nigeria-specific corporate identity fields
  "RCNumber", "CompanyName", "TINNumber", "DateOfRegistration",
  "Address1", "Address2", "Address3", "Address4", "PostalCode",
  "Telephone", "Email", "SectorCode",
];

// ─── CBN Consumer Judgment (CONJ) ────────────────────────────────────────────
const CONJ_HEADERS = [
  "CorrectionIndicator", "SRN", "CaseNumber", "Court", "CourtLocation",
  "CaseFilingDate", "JudgmentDate", "JudgmentType", "CaseType",
  "CaseReason", "Amount", "Currency",
  "BVN", "NIN", "Surname", "Forename1", "Forename2",
  "DateOfBirth", "Gender", "PassportNumber",
  "Address1", "Address2", "Address3", "Address4",
  "Telephone", "Email",
];

// ─── CBN Business Judgment (BUSJ) ────────────────────────────────────────────
const BUSJ_HEADERS = [
  "CorrectionIndicator", "SRN", "CaseNumber", "Court", "CourtLocation",
  "CaseFilingDate", "JudgmentDate", "JudgmentType", "CaseType",
  "CaseReason", "Amount", "Currency",
  "RCNumber", "CompanyName", "TINNumber",
  "Address1", "Address2", "Address3", "Address4",
  "Telephone", "Email",
];

// ─── CBN Consumer Dishonoured Cheque (COND) ──────────────────────────────────
const COND_HEADERS = [
  "CorrectionIndicator", "SRN", "AccountNumber", "ChequeNumber",
  "DateAccountOpened", "DateIssued", "DateBounced", "ReasonReturnedCode",
  "Currency", "ChequeAmount",
  "BVN", "NIN", "Surname", "Forename1", "Forename2",
  "DateOfBirth", "Gender", "PassportNumber",
  "Address1", "Address2", "Address3", "Address4",
  "Telephone", "Email",
];

// ─── CBN Business Dishonoured Cheque (BUSD) ──────────────────────────────────
const BUSD_HEADERS = [
  "CorrectionIndicator", "SRN", "AccountNumber", "ChequeNumber",
  "DateAccountOpened", "DateIssued", "DateBounced", "ReasonReturnedCode",
  "Currency", "ChequeAmount",
  "RCNumber", "CompanyName", "TINNumber",
  "Address1", "Address2", "Address3", "Address4",
  "Telephone", "Email",
];

function buildCommonAccountFields(
  correctionIndicator: string,
  srn: string,
  account: CreditAccount
): string[] {
  return [
    safe(correctionIndicator),
    safe(srn),
    "",
    safe(account.accountNumber),
    safe(account.facilityTypeCode),
    safe(account.currency),
    formatCbnDate(account.disbursementDate),
    safe(account.facilityTerm),
    safe(account.repaymentFrequency),
    formatCbnAmount(account.disbursementAmount || account.originalAmount),
    formatCbnAmount(account.scheduledInstallmentAmount),
    formatCbnAmount(account.currentBalance),
    safe(account.currentBalanceIndicator || "D"),
    formatCbnDate(account.arrearsStartDate),
    formatCbnAmount(account.amountOverdue),
    formatCbnAmount(account.amtOverdue1to30),
    formatCbnAmount(account.amtOverdue31to60),
    formatCbnAmount(account.amtOverdue61to90),
    formatCbnAmount(account.amtOverdue91to120),
    formatCbnAmount(account.amtOverdue121to150),
    formatCbnAmount(account.amtOverdue151to180),
    formatCbnAmount(account.amtOverdue181plus),
    safe(account.paymentHistoryProfile || mapDaysInArrearsToPaymentProfileCbn(account.daysInArrears || 0)),
    safe(mapInternalStatusToCbn(account.status)),
    safe(mapInternalAssetClassToCbn(account.assetClassification)),
    formatCbnDate(account.lastPaymentDate),
    formatCbnAmount(account.lastPaymentAmount),
    formatCbnDate(account.maturityDate),
    formatCbnDate(account.nextPaymentDate),
    safe(account.interestRate),
    safe(account.purposeOfFacility),
    safe(account.closureReason),
    account.status === "closed" ? formatCbnDate(account.lastPaymentDate) : "",
    formatCbnDate(account.dateRestructured),
    safe(account.reasonForRestructure),
    formatCbnDate(account.writtenOffDate),
    formatCbnAmount(account.writtenOffAmount),
    safe(account.reasonForWrittenOff),
    safe(account.legalFlag || "101"),
    safe(account.creditCollateralIndicator || "102"),
    safe(account.securityType),
    safe(account.natureOfCharge),
    formatCbnAmount(account.securityValue),
    safe(account.collateralRegRefNum),
    safe(account.specialCommentsCode),
    safe(account.natureOfGuarantor || "103"),
    safe(account.jointOrSoleAccount || "S"),
    safe(account.noParticipantsInAccount || 1),
    formatCbnDate(account.defPaymentStartDate),
  ];
}

function buildCreditRow(
  correctionIndicator: string,
  srn: string,
  account: CreditAccount,
  borrower: Borrower,
  isConsumer: boolean
): string {
  const common = buildCommonAccountFields(correctionIndicator, srn, account);

  if (isConsumer) {
    return pipe(
      ...common,
      safe(borrower.bvn),
      safe(borrower.nin),
      safe(borrower.lastName),
      safe(borrower.firstName),
      safe(borrower.middleNames),
      formatCbnDate(borrower.dateOfBirth),
      safe(borrower.gender),
      safe(borrower.passportNumber),
      safe(borrower.title),
      safe(borrower.maritalStatus),
      safe(borrower.ownerOrTenant),
      safe(borrower.address),
      safe(borrower.city),
      safe(borrower.region),
      safe(borrower.country),
      safe(borrower.postalCode),
      safe(borrower.homeTelephone),
      safe(borrower.workTelephone),
      safe(borrower.phone),
      safe(borrower.email),
      safe(borrower.employerName),
      safe(borrower.employmentTypeCode),
      safe(borrower.nationality),
    );
  } else {
    return pipe(
      ...common,
      safe(borrower.businessRegNumber),
      safe(borrower.companyName),
      safe(borrower.tinNumber),
      formatCbnDate(borrower.registrationDate),
      safe(borrower.address),
      safe(borrower.city),
      safe(borrower.region),
      safe(borrower.country),
      safe(borrower.postalCode),
      safe(borrower.phone),
      safe(borrower.email),
      safe(borrower.sector),
    );
  }
}

function buildJudgmentRow(
  correctionIndicator: string,
  srn: string,
  judgment: CourtJudgment,
  borrower: Borrower,
  isConsumer: boolean
): string {
  const common = [
    safe(correctionIndicator),
    safe(srn),
    safe(judgment.caseNumber),
    safe(judgment.court),
    safe(judgment.courtLocation),
    formatCbnDate(judgment.caseFilingDate),
    formatCbnDate(judgment.judgmentDate),
    safe(judgment.judgmentType),
    safe(judgment.bogCaseType),
    safe(judgment.caseReason),
    formatCbnAmount(judgment.amount),
    safe(judgment.judgmentCurrency || judgment.currency),
  ];

  if (isConsumer) {
    return pipe(
      ...common,
      safe(borrower.bvn),
      safe(borrower.nin),
      safe(borrower.lastName),
      safe(borrower.firstName),
      safe(borrower.middleNames),
      formatCbnDate(borrower.dateOfBirth),
      safe(borrower.gender),
      safe(borrower.passportNumber),
      safe(borrower.address),
      safe(borrower.city),
      safe(borrower.region),
      safe(borrower.country),
      safe(borrower.phone),
      safe(borrower.email),
    );
  } else {
    return pipe(
      ...common,
      safe(borrower.businessRegNumber),
      safe(borrower.companyName),
      safe(borrower.tinNumber),
      safe(borrower.address),
      safe(borrower.city),
      safe(borrower.region),
      safe(borrower.country),
      safe(borrower.phone),
      safe(borrower.email),
    );
  }
}

function buildChequeRow(
  correctionIndicator: string,
  srn: string,
  cheque: DishonouredCheque,
  borrower: Borrower,
  isConsumer: boolean
): string {
  const common = [
    safe(correctionIndicator),
    safe(srn),
    safe(cheque.accountNumber),
    safe(cheque.chequeNumber),
    formatCbnDate(cheque.dateAccountOpened),
    formatCbnDate(cheque.dateIssued),
    formatCbnDate(cheque.dateBounced),
    safe(cheque.reasonReturnedCode),
    safe(cheque.currency),
    formatCbnAmount(cheque.chequeAmount),
  ];

  if (isConsumer) {
    return pipe(
      ...common,
      safe(borrower.bvn),
      safe(borrower.nin),
      safe(borrower.lastName),
      safe(borrower.firstName),
      safe(borrower.middleNames),
      formatCbnDate(borrower.dateOfBirth),
      safe(borrower.gender),
      safe(borrower.passportNumber),
      safe(borrower.address),
      safe(borrower.city),
      safe(borrower.region),
      safe(borrower.country),
      safe(borrower.phone),
      safe(borrower.email),
    );
  } else {
    return pipe(
      ...common,
      safe(borrower.businessRegNumber),
      safe(borrower.companyName),
      safe(borrower.tinNumber),
      safe(borrower.address),
      safe(borrower.city),
      safe(borrower.region),
      safe(borrower.country),
      safe(borrower.phone),
      safe(borrower.email),
    );
  }
}

// ─── Generator functions ─────────────────────────────────────────────────────

async function generateConcFile(
  reportingDate: string,
  sequenceNumber: number,
  correctionIndicator: string,
  organizationId?: string
): Promise<{ content: string; filename: string }> {
  const srn = await getOrgSrn(organizationId);
  const today = getTodayCbnDate();

  const whereClause = organizationId
    ? and(eq(creditAccounts.organizationId, organizationId), eq(borrowers.type, "individual"))
    : eq(borrowers.type, "individual");

  const rows = await db
    .select()
    .from(creditAccounts)
    .innerJoin(borrowers, eq(creditAccounts.borrowerId, borrowers.id))
    .where(whereClause);

  const lines = [
    CONC_HEADERS.join("|"),
    ...rows.map(r => buildCreditRow(correctionIndicator, srn, r.credit_accounts, r.borrowers, true)),
  ];

  return {
    content: lines.join("\n"),
    filename: generateCbnFilename(srn, reportingDate, today, "CONC", sequenceNumber),
  };
}

async function generateBuscFile(
  reportingDate: string,
  sequenceNumber: number,
  correctionIndicator: string,
  organizationId?: string
): Promise<{ content: string; filename: string }> {
  const srn = await getOrgSrn(organizationId);
  const today = getTodayCbnDate();

  const whereClause = organizationId
    ? and(eq(creditAccounts.organizationId, organizationId), eq(borrowers.type, "corporate"))
    : eq(borrowers.type, "corporate");

  const rows = await db
    .select()
    .from(creditAccounts)
    .innerJoin(borrowers, eq(creditAccounts.borrowerId, borrowers.id))
    .where(whereClause);

  const lines = [
    BUSC_HEADERS.join("|"),
    ...rows.map(r => buildCreditRow(correctionIndicator, srn, r.credit_accounts, r.borrowers, false)),
  ];

  return {
    content: lines.join("\n"),
    filename: generateCbnFilename(srn, reportingDate, today, "BUSC", sequenceNumber),
  };
}

async function generateConjFile(
  reportingDate: string,
  sequenceNumber: number,
  correctionIndicator: string,
  organizationId?: string
): Promise<{ content: string; filename: string }> {
  const srn = await getOrgSrn(organizationId);
  const today = getTodayCbnDate();

  const rows = await db
    .select()
    .from(courtJudgments)
    .innerJoin(borrowers, eq(courtJudgments.borrowerId, borrowers.id))
    .where(eq(borrowers.type, "individual"));

  const lines = [
    CONJ_HEADERS.join("|"),
    ...rows.map(r => buildJudgmentRow(correctionIndicator, srn, r.court_judgments, r.borrowers, true)),
  ];

  return {
    content: lines.join("\n"),
    filename: generateCbnFilename(srn, reportingDate, today, "CONJ", sequenceNumber),
  };
}

async function generateBusjFile(
  reportingDate: string,
  sequenceNumber: number,
  correctionIndicator: string,
  organizationId?: string
): Promise<{ content: string; filename: string }> {
  const srn = await getOrgSrn(organizationId);
  const today = getTodayCbnDate();

  const rows = await db
    .select()
    .from(courtJudgments)
    .innerJoin(borrowers, eq(courtJudgments.borrowerId, borrowers.id))
    .where(eq(borrowers.type, "corporate"));

  const lines = [
    BUSJ_HEADERS.join("|"),
    ...rows.map(r => buildJudgmentRow(correctionIndicator, srn, r.court_judgments, r.borrowers, false)),
  ];

  return {
    content: lines.join("\n"),
    filename: generateCbnFilename(srn, reportingDate, today, "BUSJ", sequenceNumber),
  };
}

async function generateCondFile(
  reportingDate: string,
  sequenceNumber: number,
  correctionIndicator: string,
  organizationId?: string
): Promise<{ content: string; filename: string }> {
  const srn = await getOrgSrn(organizationId);
  const today = getTodayCbnDate();

  const rows = await db
    .select()
    .from(dishonouredCheques)
    .innerJoin(borrowers, eq(dishonouredCheques.borrowerId, borrowers.id))
    .where(eq(borrowers.type, "individual"));

  const lines = [
    COND_HEADERS.join("|"),
    ...rows.map(r => buildChequeRow(correctionIndicator, srn, r.dishonoured_cheques, r.borrowers, true)),
  ];

  return {
    content: lines.join("\n"),
    filename: generateCbnFilename(srn, reportingDate, today, "COND", sequenceNumber),
  };
}

async function generateBusdFile(
  reportingDate: string,
  sequenceNumber: number,
  correctionIndicator: string,
  organizationId?: string
): Promise<{ content: string; filename: string }> {
  const srn = await getOrgSrn(organizationId);
  const today = getTodayCbnDate();

  const rows = await db
    .select()
    .from(dishonouredCheques)
    .innerJoin(borrowers, eq(dishonouredCheques.borrowerId, borrowers.id))
    .where(eq(borrowers.type, "corporate"));

  const lines = [
    BUSD_HEADERS.join("|"),
    ...rows.map(r => buildChequeRow(correctionIndicator, srn, r.dishonoured_cheques, r.borrowers, false)),
  ];

  return {
    content: lines.join("\n"),
    filename: generateCbnFilename(srn, reportingDate, today, "BUSD", sequenceNumber),
  };
}

export const CBN_EXPORT_GENERATORS: Record<
  CbnFileType,
  (reportingDate: string, seq: number, ci: string, orgId?: string) => Promise<{ content: string; filename: string }>
> = {
  CONC: generateConcFile,
  BUSC: generateBuscFile,
  CONJ: generateConjFile,
  BUSJ: generateBusjFile,
  COND: generateCondFile,
  BUSD: generateBusdFile,
};

export { CONC_HEADERS as CBN_CONC_HEADERS, BUSC_HEADERS as CBN_BUSC_HEADERS };
