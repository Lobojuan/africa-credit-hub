import { eq } from "drizzle-orm";
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
  formatBslDate,
  formatBslAmount,
  generateBslFilename,
  mapInternalStatusToBsl,
  mapInternalAssetClassToBsl,
  mapDaysInArrearsToPaymentProfileBsl,
  type BslFileType,
} from "@shared/bsl-codes";

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

function getTodayBslDate(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}${mm}${dd}`;
}

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
  "DefPaymentStartDate", "NCRAID", "Surname", "Forename1", "Forename2",
  "DateOfBirth", "Gender", "NationalID", "PassportNumber", "Title",
  "MaritalStatus", "NumberOfDependants", "OwnerOrTenant",
  "Address1", "Address2", "Address3", "Address4", "PostalCode",
  "PreviousAddress1", "PreviousAddress2", "PreviousAddress3", "PreviousAddress4",
  "PreviousAddrPostalCode", "DateMovedCurrentRes",
  "HomeTelephone", "WorkTelephone", "MobileTelephone", "Email",
  "EmployerName", "EmploymentTypeCode", "EmployerAddress",
  "DateOfEmployment", "Nationality", "MonthlyIncome", "IncomeCurrency",
  "NASSITNumber", "NIN", "DriversLicence",
];

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
  "DefPaymentStartDate", "BusinessRegistrationNumber", "CompanyName",
  "TINNumber", "DateOfRegistration", "CommencementDate",
  "Address1", "Address2", "Address3", "Address4", "PostalCode",
  "Telephone", "Email", "SectorIndustryCode", "SubSectorCode",
  "BusinessTypeCode", "TurnoverAmount", "TurnoverCurrency",
];

const CONJ_HEADERS = [
  "CorrectionIndicator", "SRN", "CaseNumber", "Court", "CourtLocation",
  "CourtType", "CaseFilingDate", "JudgmentDate", "JudgmentType", "CaseType",
  "CaseReason", "Amount", "Currency",
  "NCRAID", "Surname", "Forename1", "Forename2",
  "DateOfBirth", "Gender", "NationalID", "PassportNumber",
  "Address1", "Address2", "Address3", "Address4",
  "Telephone", "Email",
];

const BUSJ_HEADERS = [
  "CorrectionIndicator", "SRN", "CaseNumber", "Court", "CourtLocation",
  "CourtType", "CaseFilingDate", "JudgmentDate", "JudgmentType", "CaseType",
  "CaseReason", "Amount", "Currency",
  "BusinessRegistrationNumber", "CompanyName", "TINNumber",
  "Address1", "Address2", "Address3", "Address4",
  "Telephone", "Email",
];

const COND_HEADERS = [
  "CorrectionIndicator", "SRN", "AccountNumber", "ChequeNumber",
  "DateAccountOpened", "DateIssued", "DateBounced", "ReasonReturnedCode",
  "Currency", "ChequeAmount",
  "NCRAID", "Surname", "Forename1", "Forename2",
  "DateOfBirth", "Gender", "NationalID", "PassportNumber",
  "Address1", "Address2", "Address3", "Address4",
  "Telephone", "Email",
];

const BUSD_HEADERS = [
  "CorrectionIndicator", "SRN", "AccountNumber", "ChequeNumber",
  "DateAccountOpened", "DateIssued", "DateBounced", "ReasonReturnedCode",
  "Currency", "ChequeAmount",
  "BusinessRegistrationNumber", "CompanyName", "TINNumber",
  "Address1", "Address2", "Address3", "Address4",
  "Telephone", "Email",
];

function buildCreditRow(
  correctionIndicator: string,
  srn: string,
  account: CreditAccount,
  borrower: Borrower,
  isConsumer: boolean
): string {
  const commonAccountFields = [
    safe(correctionIndicator),
    safe(srn),
    "",
    safe(account.accountNumber),
    safe(account.facilityTypeCode),
    safe(account.currency),
    formatBslDate(account.disbursementDate),
    safe(account.facilityTerm),
    safe(account.repaymentFrequency),
    formatBslAmount(account.disbursementAmount || account.originalAmount),
    formatBslAmount(account.scheduledInstallmentAmount),
    formatBslAmount(account.currentBalance),
    safe(account.currentBalanceIndicator || "D"),
    formatBslDate(account.arrearsStartDate),
    formatBslAmount(account.amountOverdue),
    formatBslAmount(account.amtOverdue1to30),
    formatBslAmount(account.amtOverdue31to60),
    formatBslAmount(account.amtOverdue61to90),
    formatBslAmount(account.amtOverdue91to120),
    formatBslAmount(account.amtOverdue121to150),
    formatBslAmount(account.amtOverdue151to180),
    formatBslAmount(account.amtOverdue181plus),
    safe(account.paymentHistoryProfile || mapDaysInArrearsToPaymentProfileBsl(account.daysInArrears || 0)),
    safe(account.bogAccountStatus || mapInternalStatusToBsl(account.status)),
    safe(account.bogAssetClassification || mapInternalAssetClassToBsl(account.assetClassification)),
    formatBslDate(account.lastPaymentDate),
    formatBslAmount(account.lastPaymentAmount),
    formatBslDate(account.maturityDate),
    formatBslDate(account.nextPaymentDate),
    safe(account.interestRate),
    safe(account.purposeOfFacility),
    safe(account.closureReason),
    account.status === "closed" ? formatBslDate(account.lastPaymentDate) : "",
    formatBslDate(account.dateRestructured),
    safe(account.reasonForRestructure),
    formatBslDate(account.writtenOffDate),
    formatBslAmount(account.writtenOffAmount),
    safe(account.reasonForWrittenOff),
    safe(account.legalFlag || "101"),
    safe(account.creditCollateralIndicator || "102"),
    safe(account.securityType),
    safe(account.natureOfCharge),
    formatBslAmount(account.securityValue),
    safe(account.collateralRegRefNum),
    safe(account.specialCommentsCode),
    safe(account.natureOfGuarantor || "103"),
    safe(account.jointOrSoleAccount || "S"),
    safe(account.noParticipantsInAccount || 1),
    formatBslDate(account.defPaymentStartDate),
  ];

  if (isConsumer) {
    return pipe(
      ...commonAccountFields,
      safe(borrower.ghanaCardNumber),
      safe(borrower.lastName),
      safe(borrower.firstName),
      safe(borrower.middleNames),
      formatBslDate(borrower.dateOfBirth),
      safe(borrower.gender),
      safe(borrower.nationalId),
      safe(borrower.passportNumber),
      safe(borrower.title),
      safe(borrower.maritalStatus),
      safe(borrower.numberOfDependants),
      safe(borrower.ownerOrTenant),
      safe(borrower.address),
      safe(borrower.city),
      safe(borrower.region),
      safe(borrower.country),
      safe(borrower.postalCode),
      safe(borrower.previousAddress1),
      safe(borrower.previousAddress2),
      safe(borrower.previousAddress3),
      safe(borrower.previousAddress4),
      safe(borrower.previousAddrPostalCode),
      formatBslDate(borrower.dateMovedCurrentRes),
      safe(borrower.homeTelephone),
      safe(borrower.workTelephone),
      safe(borrower.phone),
      safe(borrower.email),
      safe(borrower.employerName),
      safe(borrower.employmentTypeCode),
      safe(borrower.employerAddress),
      formatBslDate(borrower.dateOfEmployment),
      safe(borrower.nationality),
      formatBslAmount(borrower.monthlyIncome),
      safe(borrower.incomeCurrency),
      safe(borrower.ssnitNumber),
      safe(borrower.votersId),
      safe(borrower.driversLicense),
    );
  } else {
    return pipe(
      ...commonAccountFields,
      safe(borrower.businessRegNumber),
      safe(borrower.companyName),
      safe(borrower.tinNumber),
      formatBslDate(borrower.registrationDate),
      formatBslDate(borrower.commencementDate),
      safe(borrower.address),
      safe(borrower.city),
      safe(borrower.region),
      safe(borrower.country),
      safe(borrower.postalCode),
      safe(borrower.phone),
      safe(borrower.email),
      safe(borrower.sectorIndustryCode),
      safe(borrower.subSectorCode),
      safe(borrower.businessTypeCode),
      formatBslAmount(borrower.turnoverAmount),
      safe(borrower.turnoverCurrency),
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
  const commonFields = [
    safe(correctionIndicator),
    safe(srn),
    safe(judgment.caseNumber),
    safe(judgment.court),
    safe(judgment.courtLocation),
    safe(judgment.courtType),
    formatBslDate(judgment.caseFilingDate),
    formatBslDate(judgment.judgmentDate),
    safe(judgment.judgmentType),
    safe(judgment.bogCaseType),
    safe(judgment.caseReason),
    formatBslAmount(judgment.amount),
    safe(judgment.judgmentCurrency || judgment.currency),
  ];

  if (isConsumer) {
    return pipe(
      ...commonFields,
      safe(borrower.ghanaCardNumber),
      safe(borrower.lastName),
      safe(borrower.firstName),
      safe(borrower.middleNames),
      formatBslDate(borrower.dateOfBirth),
      safe(borrower.gender),
      safe(borrower.nationalId),
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
      ...commonFields,
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
  const commonFields = [
    safe(correctionIndicator),
    safe(srn),
    safe(cheque.accountNumber),
    safe(cheque.chequeNumber),
    formatBslDate(cheque.dateAccountOpened),
    formatBslDate(cheque.dateIssued),
    formatBslDate(cheque.dateBounced),
    safe(cheque.reasonReturnedCode),
    safe(cheque.currency),
    formatBslAmount(cheque.chequeAmount),
  ];

  if (isConsumer) {
    return pipe(
      ...commonFields,
      safe(borrower.ghanaCardNumber),
      safe(borrower.lastName),
      safe(borrower.firstName),
      safe(borrower.middleNames),
      formatBslDate(borrower.dateOfBirth),
      safe(borrower.gender),
      safe(borrower.nationalId),
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
      ...commonFields,
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

async function getBorrowerMap(organizationId?: string): Promise<Map<string, Borrower>> {
  let allBorrowers;
  if (organizationId) {
    allBorrowers = await db.select().from(borrowers).where(eq(borrowers.organizationId, organizationId));
  } else {
    allBorrowers = await db.select().from(borrowers);
  }
  const map = new Map<string, Borrower>();
  for (const b of allBorrowers) {
    map.set(b.id, b);
  }
  return map;
}

export async function generateBslCONC(
  reportingDate: string,
  sequenceNum: number = 1,
  correctionIndicator: string = "0",
  organizationId?: string
): Promise<{ content: string; filename: string }> {
  const borrowerMap = await getBorrowerMap(organizationId);
  const accounts = await db.select().from(creditAccounts);
  const srn = await getOrgSrn(organizationId);
  const fileCreatedDate = getTodayBslDate();

  const rows: string[] = [CONC_HEADERS.join("|")];

  for (const account of accounts) {
    const borrower = borrowerMap.get(account.borrowerId);
    if (!borrower || borrower.type !== "individual") continue;
    if (borrower.country !== "Sierra Leone") continue;
    rows.push(buildCreditRow(correctionIndicator, srn, account, borrower, true));
  }

  const filename = generateBslFilename(srn, reportingDate, fileCreatedDate, "CONC", sequenceNum);
  return { content: rows.join("\n"), filename };
}

export async function generateBslBUSC(
  reportingDate: string,
  sequenceNum: number = 1,
  correctionIndicator: string = "0",
  organizationId?: string
): Promise<{ content: string; filename: string }> {
  const borrowerMap = await getBorrowerMap(organizationId);
  const accounts = await db.select().from(creditAccounts);
  const srn = await getOrgSrn(organizationId);
  const fileCreatedDate = getTodayBslDate();

  const rows: string[] = [BUSC_HEADERS.join("|")];

  for (const account of accounts) {
    const borrower = borrowerMap.get(account.borrowerId);
    if (!borrower || borrower.type !== "corporate") continue;
    if (borrower.country !== "Sierra Leone") continue;
    rows.push(buildCreditRow(correctionIndicator, srn, account, borrower, false));
  }

  const filename = generateBslFilename(srn, reportingDate, fileCreatedDate, "BUSC", sequenceNum);
  return { content: rows.join("\n"), filename };
}

export async function generateBslCONJ(
  reportingDate: string,
  sequenceNum: number = 1,
  correctionIndicator: string = "0",
  organizationId?: string
): Promise<{ content: string; filename: string }> {
  const borrowerMap = await getBorrowerMap(organizationId);
  const judgments = await db.select().from(courtJudgments);
  const srn = await getOrgSrn(organizationId);
  const fileCreatedDate = getTodayBslDate();

  const rows: string[] = [CONJ_HEADERS.join("|")];

  for (const judgment of judgments) {
    const borrower = borrowerMap.get(judgment.borrowerId);
    if (!borrower || borrower.type !== "individual") continue;
    if (borrower.country !== "Sierra Leone") continue;
    rows.push(buildJudgmentRow(correctionIndicator, srn, judgment, borrower, true));
  }

  const filename = generateBslFilename(srn, reportingDate, fileCreatedDate, "CONJ", sequenceNum);
  return { content: rows.join("\n"), filename };
}

export async function generateBslBUSJ(
  reportingDate: string,
  sequenceNum: number = 1,
  correctionIndicator: string = "0",
  organizationId?: string
): Promise<{ content: string; filename: string }> {
  const borrowerMap = await getBorrowerMap(organizationId);
  const judgments = await db.select().from(courtJudgments);
  const srn = await getOrgSrn(organizationId);
  const fileCreatedDate = getTodayBslDate();

  const rows: string[] = [BUSJ_HEADERS.join("|")];

  for (const judgment of judgments) {
    const borrower = borrowerMap.get(judgment.borrowerId);
    if (!borrower || borrower.type !== "corporate") continue;
    if (borrower.country !== "Sierra Leone") continue;
    rows.push(buildJudgmentRow(correctionIndicator, srn, judgment, borrower, false));
  }

  const filename = generateBslFilename(srn, reportingDate, fileCreatedDate, "BUSJ", sequenceNum);
  return { content: rows.join("\n"), filename };
}

export async function generateBslCOND(
  reportingDate: string,
  sequenceNum: number = 1,
  correctionIndicator: string = "0",
  organizationId?: string
): Promise<{ content: string; filename: string }> {
  const borrowerMap = await getBorrowerMap(organizationId);
  const cheques = await db.select().from(dishonouredCheques);
  const srn = await getOrgSrn(organizationId);
  const fileCreatedDate = getTodayBslDate();

  const rows: string[] = [COND_HEADERS.join("|")];

  for (const cheque of cheques) {
    const borrower = borrowerMap.get(cheque.borrowerId);
    if (!borrower || borrower.type !== "individual") continue;
    if (borrower.country !== "Sierra Leone") continue;
    rows.push(buildChequeRow(correctionIndicator, srn, cheque, borrower, true));
  }

  const filename = generateBslFilename(srn, reportingDate, fileCreatedDate, "COND", sequenceNum);
  return { content: rows.join("\n"), filename };
}

export async function generateBslBUSD(
  reportingDate: string,
  sequenceNum: number = 1,
  correctionIndicator: string = "0",
  organizationId?: string
): Promise<{ content: string; filename: string }> {
  const borrowerMap = await getBorrowerMap(organizationId);
  const cheques = await db.select().from(dishonouredCheques);
  const srn = await getOrgSrn(organizationId);
  const fileCreatedDate = getTodayBslDate();

  const rows: string[] = [BUSD_HEADERS.join("|")];

  for (const cheque of cheques) {
    const borrower = borrowerMap.get(cheque.borrowerId);
    if (!borrower || borrower.type !== "corporate") continue;
    if (borrower.country !== "Sierra Leone") continue;
    rows.push(buildChequeRow(correctionIndicator, srn, cheque, borrower, false));
  }

  const filename = generateBslFilename(srn, reportingDate, fileCreatedDate, "BUSD", sequenceNum);
  return { content: rows.join("\n"), filename };
}

export const BSL_EXPORT_GENERATORS: Record<BslFileType, (reportingDate: string, sequenceNum?: number, correctionIndicator?: string, organizationId?: string) => Promise<{ content: string; filename: string }>> = {
  CONC: generateBslCONC,
  BUSC: generateBslBUSC,
  CONJ: generateBslCONJ,
  BUSJ: generateBslBUSJ,
  COND: generateBslCOND,
  BUSD: generateBslBUSD,
};
