/**
 * CBK (Central Bank of Kenya) Export Generator
 * Reference: CBK Credit Reference Bureau Regulations 2020 / Banking Act Cap 488
 *
 * Kenya-specific fields:
 *  - National ID   (8-digit citizen ID) — maps to borrower.nationalId
 *  - KRA PIN       (Tax identification) — maps to borrower.tinNumber
 *  - Passport      (for non-citizens) — maps to borrower.passportNumber
 *  - Business Reg  (Certificate of Incorporation) — maps to borrower.businessRegNumber
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
  formatCbkDate,
  formatCbkAmount,
  generateCbkFilename,
  mapInternalStatusToCbk,
  mapInternalAssetClassToCbk,
  mapDaysInArrearsToPaymentProfileCbk,
  type CbkFileType,
} from "@shared/cbk-codes";

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

function getTodayCbkDate(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}${mm}${dd}`;
}

// ─── CBK Consumer Credit (CONC) ─────────────────────────────────────────────
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
  // Kenya-specific consumer identity fields
  "NationalID", "KRAPIN", "Surname", "Forename1", "Forename2",
  "DateOfBirth", "Gender", "PassportNumber", "Title",
  "MaritalStatus", "OwnerOrTenant",
  "Address1", "Address2", "Address3", "Address4", "PostalCode",
  "HomeTelephone", "WorkTelephone", "MobileTelephone", "Email",
  "EmployerName", "EmploymentTypeCode", "Nationality",
];

// ─── CBK Business Credit (BUSC) ─────────────────────────────────────────────
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
  // Kenya-specific corporate identity fields
  "BusinessRegNumber", "CompanyName", "KRAPIN", "DateOfRegistration",
  "Address1", "Address2", "Address3", "Address4", "PostalCode",
  "Telephone", "Email", "SectorCode",
];

// ─── CBK Consumer Judgment (CONJ) ────────────────────────────────────────────
const CONJ_HEADERS = [
  "CorrectionIndicator", "SRN", "CaseNumber", "Court", "CourtLocation",
  "CaseFilingDate", "JudgmentDate", "JudgmentType", "CaseType",
  "CaseReason", "Amount", "Currency",
  "NationalID", "KRAPIN", "Surname", "Forename1", "Forename2",
  "DateOfBirth", "Gender", "PassportNumber",
  "Address1", "Address2", "Address3", "Address4",
  "Telephone", "Email",
];

// ─── CBK Business Judgment (BUSJ) ────────────────────────────────────────────
const BUSJ_HEADERS = [
  "CorrectionIndicator", "SRN", "CaseNumber", "Court", "CourtLocation",
  "CaseFilingDate", "JudgmentDate", "JudgmentType", "CaseType",
  "CaseReason", "Amount", "Currency",
  "BusinessRegNumber", "CompanyName", "KRAPIN",
  "Address1", "Address2", "Address3", "Address4",
  "Telephone", "Email",
];

// ─── CBK Consumer Dishonoured Cheque (COND) ──────────────────────────────────
const COND_HEADERS = [
  "CorrectionIndicator", "SRN", "AccountNumber", "ChequeNumber",
  "DateAccountOpened", "DateIssued", "DateBounced", "ReasonReturnedCode",
  "Currency", "ChequeAmount",
  "NationalID", "KRAPIN", "Surname", "Forename1", "Forename2",
  "DateOfBirth", "Gender", "PassportNumber",
  "Address1", "Address2", "Address3", "Address4",
  "Telephone", "Email",
];

// ─── CBK Business Dishonoured Cheque (BUSD) ──────────────────────────────────
const BUSD_HEADERS = [
  "CorrectionIndicator", "SRN", "AccountNumber", "ChequeNumber",
  "DateAccountOpened", "DateIssued", "DateBounced", "ReasonReturnedCode",
  "Currency", "ChequeAmount",
  "BusinessRegNumber", "CompanyName", "KRAPIN",
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
    formatCbkDate(account.disbursementDate),
    safe(account.facilityTerm),
    safe(account.repaymentFrequency),
    formatCbkAmount(account.disbursementAmount || account.originalAmount),
    formatCbkAmount(account.scheduledInstallmentAmount),
    formatCbkAmount(account.currentBalance),
    safe(account.currentBalanceIndicator || "D"),
    formatCbkDate(account.arrearsStartDate),
    formatCbkAmount(account.amountOverdue),
    formatCbkAmount(account.amtOverdue1to30),
    formatCbkAmount(account.amtOverdue31to60),
    formatCbkAmount(account.amtOverdue61to90),
    formatCbkAmount(account.amtOverdue91to120),
    formatCbkAmount(account.amtOverdue121to150),
    formatCbkAmount(account.amtOverdue151to180),
    formatCbkAmount(account.amtOverdue181plus),
    safe(account.paymentHistoryProfile || mapDaysInArrearsToPaymentProfileCbk(account.daysInArrears || 0)),
    safe(mapInternalStatusToCbk(account.status)),
    safe(mapInternalAssetClassToCbk(account.assetClassification)),
    formatCbkDate(account.lastPaymentDate),
    formatCbkAmount(account.lastPaymentAmount),
    formatCbkDate(account.maturityDate),
    formatCbkDate(account.nextPaymentDate),
    safe(account.interestRate),
    safe(account.purposeOfFacility),
    safe(account.closureReason),
    account.status === "closed" ? formatCbkDate(account.lastPaymentDate) : "",
    formatCbkDate(account.dateRestructured),
    safe(account.reasonForRestructure),
    formatCbkDate(account.writtenOffDate),
    formatCbkAmount(account.writtenOffAmount),
    safe(account.reasonForWrittenOff),
    safe(account.legalFlag || "101"),
    safe(account.creditCollateralIndicator || "102"),
    safe(account.securityType),
    safe(account.natureOfCharge),
    formatCbkAmount(account.securityValue),
    safe(account.collateralRegRefNum),
    safe(account.specialCommentsCode),
    safe(account.natureOfGuarantor || "103"),
    safe(account.jointOrSoleAccount || "S"),
    safe(account.noParticipantsInAccount || 1),
    formatCbkDate(account.defPaymentStartDate),
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
      safe(borrower.nationalId),
      safe(borrower.tinNumber),
      safe(borrower.lastName),
      safe(borrower.firstName),
      safe(borrower.middleNames),
      formatCbkDate(borrower.dateOfBirth),
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
      formatCbkDate(borrower.registrationDate),
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
    formatCbkDate(judgment.caseFilingDate),
    formatCbkDate(judgment.judgmentDate),
    safe(judgment.judgmentType),
    safe(judgment.bogCaseType),
    safe(judgment.caseReason),
    formatCbkAmount(judgment.amount),
    safe(judgment.judgmentCurrency || judgment.currency),
  ];

  if (isConsumer) {
    return pipe(
      ...common,
      safe(borrower.nationalId),
      safe(borrower.tinNumber),
      safe(borrower.lastName),
      safe(borrower.firstName),
      safe(borrower.middleNames),
      formatCbkDate(borrower.dateOfBirth),
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
    formatCbkDate(cheque.dateAccountOpened),
    formatCbkDate(cheque.dateIssued),
    formatCbkDate(cheque.dateBounced),
    safe(cheque.reasonReturnedCode),
    safe(cheque.currency),
    formatCbkAmount(cheque.chequeAmount),
  ];

  if (isConsumer) {
    return pipe(
      ...common,
      safe(borrower.nationalId),
      safe(borrower.tinNumber),
      safe(borrower.lastName),
      safe(borrower.firstName),
      safe(borrower.middleNames),
      formatCbkDate(borrower.dateOfBirth),
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
  const today = getTodayCbkDate();

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
    filename: generateCbkFilename(srn, reportingDate, today, "CONC", sequenceNumber),
  };
}

async function generateBuscFile(
  reportingDate: string,
  sequenceNumber: number,
  correctionIndicator: string,
  organizationId?: string
): Promise<{ content: string; filename: string }> {
  const srn = await getOrgSrn(organizationId);
  const today = getTodayCbkDate();

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
    filename: generateCbkFilename(srn, reportingDate, today, "BUSC", sequenceNumber),
  };
}

async function generateConjFile(
  reportingDate: string,
  sequenceNumber: number,
  correctionIndicator: string,
  organizationId?: string
): Promise<{ content: string; filename: string }> {
  const srn = await getOrgSrn(organizationId);
  const today = getTodayCbkDate();

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
    filename: generateCbkFilename(srn, reportingDate, today, "CONJ", sequenceNumber),
  };
}

async function generateBusjFile(
  reportingDate: string,
  sequenceNumber: number,
  correctionIndicator: string,
  organizationId?: string
): Promise<{ content: string; filename: string }> {
  const srn = await getOrgSrn(organizationId);
  const today = getTodayCbkDate();

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
    filename: generateCbkFilename(srn, reportingDate, today, "BUSJ", sequenceNumber),
  };
}

async function generateCondFile(
  reportingDate: string,
  sequenceNumber: number,
  correctionIndicator: string,
  organizationId?: string
): Promise<{ content: string; filename: string }> {
  const srn = await getOrgSrn(organizationId);
  const today = getTodayCbkDate();

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
    filename: generateCbkFilename(srn, reportingDate, today, "COND", sequenceNumber),
  };
}

async function generateBusdFile(
  reportingDate: string,
  sequenceNumber: number,
  correctionIndicator: string,
  organizationId?: string
): Promise<{ content: string; filename: string }> {
  const srn = await getOrgSrn(organizationId);
  const today = getTodayCbkDate();

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
    filename: generateCbkFilename(srn, reportingDate, today, "BUSD", sequenceNumber),
  };
}

export const CBK_EXPORT_GENERATORS: Record<
  CbkFileType,
  (reportingDate: string, seq: number, ci: string, orgId?: string) => Promise<{ content: string; filename: string }>
> = {
  CONC: generateConcFile,
  BUSC: generateBuscFile,
  CONJ: generateConjFile,
  BUSJ: generateBusjFile,
  COND: generateCondFile,
  BUSD: generateBusdFile,
};

export { CONC_HEADERS as CBK_CONC_HEADERS, BUSC_HEADERS as CBK_BUSC_HEADERS };
