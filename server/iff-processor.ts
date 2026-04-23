import { db } from "./db";
import { borrowers, creditAccounts, dishonouredCheques, courtJudgments, guarantors } from "@shared/schema";
import { eq, and, or } from "drizzle-orm";

function formatIffDate(val: any): string | null {
  if (!val) return null;
  const s = String(val);
  if (s.length === 8 && /^\d{8}$/.test(s)) {
    return `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}`;
  }
  return s;
}

function toStr(val: any): string | null {
  if (val === undefined || val === null || val === "") return null;
  return String(val).trim();
}

function toNum(val: any): string | null {
  if (val === undefined || val === null || val === "") return null;
  const n = Number(val);
  return isNaN(n) ? null : String(n);
}

function toInt(val: any): number | null {
  if (val === undefined || val === null || val === "") return null;
  const n = parseInt(String(val), 10);
  return isNaN(n) ? null : n;
}

function enrichError(err: any, row: Record<string, any>, rowIndex: number): { row: number; message: string; field?: string; value?: string; rowData?: Record<string, string> } {
  const msg = err.message || "Unknown error";
  let field: string | undefined;
  let value: string | undefined;
  let friendlyMsg = msg;

  const uniqueMatch = msg.match(/unique constraint "(\w+)"/i);
  if (uniqueMatch) {
    const constraint = uniqueMatch[1];
    if (constraint.includes("national_id")) { field = "NationalID/GhanaCardNo/NatIDNum"; value = String(row.GhanaCardNo || row.NatIDNum || row.NationalID || row.nationalId || ""); friendlyMsg = `Duplicate National ID "${value}" — record was matched and updated automatically.`; }
    else if (constraint.includes("account_number")) { field = "AccountNumber/AccountNum"; value = String(row.AccountNumber || row.AccountNum || row.AccountNo || ""); friendlyMsg = `Duplicate Account Number "${value}" — record was matched and updated automatically.`; }
    else if (constraint.includes("tin_number")) { field = "TIN/TINum"; value = String(row.TIN || row.TINum || row.TINNo || ""); friendlyMsg = `Duplicate TIN "${value}" — record was matched and updated automatically.`; }
    else if (constraint.includes("business_reg")) { field = "BusinessRegNo/BusRegNum"; value = String(row.RegNo || row.BusRegNum || row.BusinessRegNo || ""); friendlyMsg = `Duplicate Business Registration "${value}" — record was matched and updated automatically.`; }
    else { friendlyMsg = `Duplicate value violates constraint "${constraint}". Check for repeated data in this row.`; }
  }

  const notNullMatch = msg.match(/null value in column "(\w+)"/i) || msg.match(/violates not-null constraint.*"(\w+)"/i);
  if (notNullMatch) {
    field = notNullMatch[1];
    friendlyMsg = `Missing required field "${field}" — this column cannot be empty`;
  }

  const typeMatch = msg.match(/invalid input syntax for type (\w+): "(.+?)"/i);
  if (typeMatch) {
    field = typeMatch[1];
    value = typeMatch[2];
    friendlyMsg = `Invalid ${typeMatch[1]} value "${typeMatch[2]}" — check the format`;
  }

  const keyFields = [
    "SRN", "BorrowerName", "GhanaCardNo", "NationalID", "AccountNumber", "AccountNo",
    "CompanyName", "RegNo", "TIN",
    "BusinessName", "TradingName", "BusRegNum", "TINum", "CustomerID",
    "FirstName", "Surname", "MiddleNames", "NatIDNum", "AccountNum",
    "FacilityType", "SanctionedAmount", "OutstandingBalance", "DaysInArrears",
    "ChequeNum", "ChequeAmount", "DrawerName",
    "CaseNumber", "Plaintiff", "Defendant",
    "Data",
  ];
  const rowSummary: Record<string, string> = {};
  for (const k of keyFields) {
    if (row[k] !== undefined && row[k] !== null && row[k] !== "") rowSummary[k] = String(row[k]);
  }

  return { row: rowIndex, message: friendlyMsg, field, value, rowData: Object.keys(rowSummary).length > 0 ? rowSummary : undefined };
}

interface ProcessingResult {
  totalRecords: number;
  borrowersCreated: number;
  borrowersUpdated: number;
  accountsCreated: number;
  accountsUpdated: number;
  chequesCreated: number;
  chequesUpdated: number;
  judgmentsCreated: number;
  judgmentsUpdated: number;
  guarantorsCreated: number;
  guarantorsUpdated: number;
  errors: Array<{ row: number; message: string; field?: string; value?: string; rowData?: Record<string, string> }>;
}

async function findOrCreateBorrower(
  type: "individual" | "corporate",
  identifiers: { nationalId?: string; businessRegNumber?: string; tinNumber?: string; votersId?: string; passportNumber?: string },
  data: any,
  organizationId?: string
): Promise<{ id: string; created: boolean }> {
  const conditions: any[] = [];
  if (identifiers.nationalId) conditions.push(eq(borrowers.nationalId, identifiers.nationalId));
  if (identifiers.businessRegNumber) conditions.push(eq(borrowers.businessRegNumber, identifiers.businessRegNumber));
  if (identifiers.tinNumber) conditions.push(eq(borrowers.tinNumber, identifiers.tinNumber));
  if (identifiers.votersId) conditions.push(eq(borrowers.votersId, identifiers.votersId));
  if (identifiers.passportNumber) conditions.push(eq(borrowers.passportNumber, identifiers.passportNumber));

  if (conditions.length > 0) {
    const existing = await db.select().from(borrowers)
      .where(conditions.length > 1 ? or(...conditions) : conditions[0])
      .limit(1);
    if (existing.length > 0) {
      await db.update(borrowers).set({ ...data, updatedAt: new Date() }).where(eq(borrowers.id, existing[0].id));
      return { id: existing[0].id, created: false };
    }
  }

  const primaryId = identifiers.nationalId || identifiers.businessRegNumber || identifiers.tinNumber || `IFF-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const [created] = await db.insert(borrowers).values({
    ...data,
    type,
    nationalId: primaryId,
    organizationId: organizationId || null,
  }).returning();
  return { id: created.id, created: true };
}

async function upsertCreditAccount(
  accountData: any,
  borrowerId: string
): Promise<{ id: string; created: boolean }> {
  const accountNumber = accountData.accountNumber;
  if (accountNumber) {
    const existing = await db.select().from(creditAccounts)
      .where(and(eq(creditAccounts.accountNumber, accountNumber), eq(creditAccounts.borrowerId, borrowerId)))
      .limit(1);
    if (existing.length > 0) {
      await db.update(creditAccounts).set({ ...accountData, updatedAt: new Date() }).where(eq(creditAccounts.id, existing[0].id));
      return { id: existing[0].id, created: false };
    }
  }
  const [created] = await db.insert(creditAccounts).values(accountData).returning();
  return { id: created.id, created: true };
}

async function upsertDishonouredCheque(
  chequeData: any,
  borrowerId: string
): Promise<boolean> {
  const chequeNumber = chequeData.chequeNumber;
  if (chequeNumber) {
    const existing = await db.select().from(dishonouredCheques)
      .where(and(eq(dishonouredCheques.chequeNumber, chequeNumber), eq(dishonouredCheques.borrowerId, borrowerId)))
      .limit(1);
    if (existing.length > 0) {
      const { id: _id, ...updateData } = chequeData;
      await db.update(dishonouredCheques).set(updateData).where(eq(dishonouredCheques.id, existing[0].id));
      return false;
    }
  }
  await db.insert(dishonouredCheques).values(chequeData);
  return true;
}

async function upsertCourtJudgment(
  judgmentData: any,
  borrowerId: string
): Promise<boolean> {
  const caseNumber = judgmentData.caseNumber;
  if (caseNumber) {
    const existing = await db.select().from(courtJudgments)
      .where(and(eq(courtJudgments.caseNumber, caseNumber), eq(courtJudgments.borrowerId, borrowerId)))
      .limit(1);
    if (existing.length > 0) {
      const { id: _id, ...updateData } = judgmentData;
      await db.update(courtJudgments).set(updateData).where(eq(courtJudgments.id, existing[0].id));
      return false;
    }
  }
  await db.insert(courtJudgments).values(judgmentData);
  return true;
}

async function upsertGuarantor(gData: any): Promise<boolean> {
  const existing = await db.select().from(guarantors)
    .where(and(
      eq(guarantors.creditAccountId, gData.creditAccountId),
      eq(guarantors.guarantorNumber, gData.guarantorNumber)
    ))
    .limit(1);
  if (existing.length > 0) {
    await db.update(guarantors).set({ ...gData }).where(eq(guarantors.id, existing[0].id));
    return false;
  }
  await db.insert(guarantors).values(gData);
  return true;
}

function mapBusinessBorrowerFields(row: Record<string, any>): any {
  return {
    companyName: toStr(row.BusinessName),
    tradingName: toStr(row.TradingName),
    businessRegNumber: toStr(row.BusRegNum),
    previousRegNumber: toStr(row.PrevRegNum),
    tinNumber: toStr(row.TINum),
    sectorIndustryCode: toStr(row.SectorIndCode),
    subSectorCode: toStr(row.SubSecIndCode),
    businessTypeCode: toStr(row.BusType),
    registrationDate: formatIffDate(row.RegistrationDate),
    commencementDate: formatIffDate(row.CommencementDate),
    previousBusinessName: toStr(row.PrevBusName),
    turnoverCurrency: toStr(row.TurnoverCurrency),
    turnoverAmount: toNum(row.TurnoverAmount),
    proofOfAddressType: toStr(row.ProofOfAddType),
    proofOfAddressNumber: toStr(row.ProofOfAddNum),
    address: [toStr(row.CurLocAdd1), toStr(row.CurLocAdd2), toStr(row.CurLocAdd3), toStr(row.CurLocAdd4)].filter(Boolean).join(", ") || null,
    postalAddress1: toStr(row.PostAddrLine1),
    postalAddress2: toStr(row.PostAddrLine2),
    postalAddress3: toStr(row.PostAddrLine3),
    postalAddress4: toStr(row.PostAddrLine4),
    postalCode: toStr(row.PostalAddPostCode) || toStr(row.CurLocAddrPostalCode),
    website: toStr(row.WebsiteAdd),
    email: toStr(row.EmailAddress),
    phone: toStr(row.OfficeTel1),
    officeTelephone2: toStr(row.OfficeTel2),
    officeFaxNumber: toStr(row.OfficeFaxNum),
    branchCode: toStr(row.BranchCode),
    customerId: toStr(row.CustomerID),
    country: "Ghana",
  };
}

function normaliseNationality(val: string | null): string {
  if (!val) return "Ghana";
  const code = val.trim().toUpperCase();
  const map: Record<string, string> = {
    "GH": "Ghana", "GHA": "Ghana",
    "NG": "Nigeria", "NGA": "Nigeria",
    "KE": "Kenya", "KEN": "Kenya",
    "ZA": "South Africa", "ZAF": "South Africa",
    "RW": "Rwanda", "RWA": "Rwanda",
    "TZ": "Tanzania", "TZA": "Tanzania",
    "UG": "Uganda", "UGA": "Uganda",
    "ET": "Ethiopia", "ETH": "Ethiopia",
    "MA": "Morocco", "MAR": "Morocco",
    "SN": "Senegal", "SEN": "Senegal",
    "CI": "Côte d'Ivoire", "CIV": "Côte d'Ivoire",
    "CM": "Cameroon", "CMR": "Cameroon",
    "SL": "Sierra Leone", "SLE": "Sierra Leone",
    "LR": "Liberia", "LBR": "Liberia",
    "GHANAIAN": "Ghana", "NIGERIAN": "Nigeria",
    "KENYAN": "Kenya", "RWANDAN": "Rwanda",
  };
  return map[code] || val;
}

function mapConsumerBorrowerFields(row: Record<string, any>): any {
  return {
    firstName: toStr(row.FirstName),
    lastName: toStr(row.Surname),
    middleNames: toStr(row.MiddleNames),
    nationalId: toStr(row.NatIDNum),
    votersId: toStr(row.VotersIDNum),
    driversLicense: toStr(row.DriverLicNum),
    passportNumber: toStr(row.PassportNum),
    ssnitNumber: toStr(row.SSNum),
    ezwichNumber: toStr(row.EzwichNum),
    otherIdType: toStr(row.OtherID),
    otherIdNumber: toStr(row.OtherIDNum),
    tinNumber: toStr(row.TINum),
    gender: toStr(row.Gender),
    maritalStatus: toStr(row.MaritalStatus),
    nationality: toStr(row.Nationality),
    dateOfBirth: formatIffDate(row.DOB),
    title: toStr(row.Title),
    previousName: toStr(row.PrevName),
    alias: toStr(row.Alias),
    proofOfAddressType: toStr(row.ProofOfAddType),
    proofOfAddressNumber: toStr(row.ProofOfAddNum),
    address: [toStr(row.CurResAddr1), toStr(row.CurResAddr2), toStr(row.CurResAddr3), toStr(row.CurResAddr4)].filter(Boolean).join(", ") || null,
    postalCode: toStr(row.CurResAddrPostalCode),
    dateMovedCurrentRes: formatIffDate(row.DateMovedCurrRes),
    previousAddress1: toStr(row.PrevResAddr1),
    previousAddress2: toStr(row.PrevResAddr2),
    previousAddress3: toStr(row.PrevResAddr3),
    previousAddress4: toStr(row.PrevResAddr4),
    previousAddrPostalCode: toStr(row.PrevResAddrPostalCode),
    ownerOrTenant: toStr(row.OwnerOrTenant),
    postalAddress1: toStr(row.PostAddrLine1),
    postalAddress2: toStr(row.PostAddrLine2),
    postalAddress3: toStr(row.PostAddrLine3),
    postalAddress4: toStr(row.PostAddrLine4),
    email: toStr(row.EmailAddress),
    homeTelephone: toStr(row.HomeTel),
    phone: toStr(row.MobileTel1),
    mobileTelephone2: toStr(row.MobileTel2),
    workTelephone: toStr(row.WorkTel),
    numberOfDependants: toInt(row.NumOfDependants),
    employmentTypeCode: toStr(row.EmpType),
    employerPayrollNum: toStr(row.EmpPayrollNum),
    paypoint: toStr(row.Paypoint),
    employerName: toStr(row.EmpName),
    employerAddress: [toStr(row.EmpAddr1), toStr(row.EmpAddr2), toStr(row.EmpAddr3), toStr(row.EmpAddr4)].filter(Boolean).join(", ") || null,
    employerPostalCode: toStr(row.EmpAddrPostalCode),
    dateOfEmployment: formatIffDate(row.DateOfEmp),
    occupation: toStr(row.Occupation),
    incomeCurrency: toStr(row.IncomeCurrency),
    monthlyIncome: toNum(row.Income),
    branchCode: toStr(row.BranchCode),
    customerId: toStr(row.CustomerID),
    country: normaliseNationality(toStr(row.Nationality)),
  };
}

function mapCreditAccountFields(row: Record<string, any>, borrowerId: string, lenderInstitution: string): any {
  const facilityMap: Record<string, string> = {
    "101": "Overdraft", "102": "Term Loan", "103": "Mortgage", "104": "Credit Card",
    "105": "Personal Loan", "106": "Auto Loan", "107": "Student Loan", "108": "Agricultural Loan",
    "109": "Trade Finance", "110": "Microfinance Loan", "111": "Lease", "112": "Guarantee",
    "113": "Letter of Credit", "114": "Salary Advance", "115": "Group Loan",
    "116": "SME Loan", "117": "Bridge Loan", "118": "Construction Loan", "119": "Revolving Credit",
    "120": "Staff Loan",
  };

  const statusMap: Record<string, string> = {
    "A": "current", "B": "delinquent", "C": "default", "D": "closed",
    "E": "restructured", "F": "written_off", "W": "written_off",
  };

  const facilityCode = toStr(row.CreditFacilityType);
  const statusCode = toStr(row.FacilityStatusCode);

  return {
    borrowerId,
    lenderInstitution,
    accountNumber: toStr(row.FacilityAccNum) || `IFF-${Date.now()}`,
    accountType: facilityMap[facilityCode || ""] || facilityCode || "Other",
    originalAmount: toNum(row.FacilityAmount) || "0",
    currentBalance: toNum(row.CurBal) || "0",
    currency: toStr(row.AmountCurrency) || "GHS",
    disbursementDate: formatIffDate(row.DisbursementDate),
    disbursementAmount: toNum(row.DisbursementAmt),
    maturityDate: formatIffDate(row.MaturityDate),
    scheduledInstallmentAmount: toNum(row.SchdInstalAmount),
    repaymentFrequency: toStr(row.RepaymentFreq),
    lastPaymentAmount: toNum(row.LastPaymentAmount),
    lastPaymentDate: formatIffDate(row.LastPaymentDate),
    nextPaymentDate: formatIffDate(row.NextPaymentDate),
    currentBalanceIndicator: toStr(row.CurBalIndicator),
    assetClassification: toStr(row.AssetClassification),
    amountOverdue: toNum(row.AmountInArrears),
    arrearsStartDate: formatIffDate(row.ArrearsStartDate),
    daysInArrears: toInt(row.NDIA) || 0,
    paymentHistoryProfile: toStr(row.PaymentHistoryProfile),
    amtOverdue1to30: toNum(row.AmtOverdue1to30days),
    amtOverdue31to60: toNum(row.AmtOverdue31to60days),
    amtOverdue61to90: toNum(row.AmtOverdue61to90days),
    amtOverdue91to120: toNum(row.AmtOverdue91to120days),
    amtOverdue121to150: toNum(row.AmtOverdue121to150days),
    amtOverdue151to180: toNum(row.AmtOverdue151to180days),
    amtOverdue181plus: toNum(row.AmtOverdue181orMore),
    legalFlag: toStr(row.LegalFlag),
    status: statusMap[statusCode || ""] || "current",
    bogAccountStatus: statusCode || null,
    facilityStatusDate: formatIffDate(row.FacilityStatusDate),
    closedDate: formatIffDate(row.ClosedDate),
    closureReason: toStr(row.ClosureReason),
    writtenOffAmount: toNum(row.WrittenOffAmt),
    reasonForWrittenOff: toStr(row.ReasonForWrittenOff),
    dateRestructured: formatIffDate(row.DateRestructured),
    reasonForRestructure: toStr(row.ReasonForRestructure),
    creditCollateralIndicator: toStr(row.CreditCollateralInd),
    securityType: toStr(row.SecurityType),
    natureOfCharge: toStr(row.NatureOfCharge),
    securityValue: toNum(row.SecurityValue),
    collateralRegRefNum: toStr(row.CollRegRefNum),
    specialCommentsCode: toStr(row.SpecialCommentsCode),
    natureOfGuarantor: toStr(row.NatureOfGuarantor) || toStr(row.NatureOfGuarantor1),
    facilityTypeCode: facilityCode,
    purposeOfFacility: toStr(row.PurposeOfFacility),
    facilityTerm: toInt(row.FacilityTerm),
    defPaymentStartDate: formatIffDate(row.DefPaymentStartDate),
    jointOrSoleAccount: toStr(row.JointOrSoleAcc),
    noParticipantsInAccount: toInt(row.NoParticipantsInAcc),
    correctionIndicator: toInt(row.CorrectionIndicator) || 0,
  };
}

function extractGuarantors(row: Record<string, any>, creditAccountId: string, organizationId?: string): any[] {
  const result: any[] = [];
  for (let i = 1; i <= 4; i++) {
    const suffix = i === 1 ? "1" : String(i);
    const prefix = `G${i}`;
    const natureKey = `NatureOfGuarantor${suffix}`;
    const nature = toStr(row[natureKey]) || toStr(row.NatureOfGuarantor);
    const surname = toStr(row[`${prefix}Surname`]);
    const firstName = toStr(row[`${prefix}FirstName`]);
    const companyName = toStr(row[`NameOfComGuarantor${suffix}`]) || toStr(row.NameOfComGuarantor);
    const busReg = toStr(row[`BusRegOfGuarantor${suffix}`]) || toStr(row.BusRegOfGuarantor);

    if (!surname && !firstName && !companyName && !nature) continue;

    result.push({
      creditAccountId,
      guarantorNumber: i,
      natureOfGuarantor: nature,
      companyName,
      businessRegNumber: busReg,
      surname,
      firstName,
      middleNames: toStr(row[`${prefix}MiddleNames`]),
      nationalId: toStr(row[`${prefix}NatID`]),
      votersId: toStr(row[`${prefix}VotID`]),
      driversLicense: toStr(row[`${prefix}DrivLic`]),
      passportNumber: toStr(row[`${prefix}PassNum`]),
      ssnitNumber: toStr(row[`${prefix}SSN`]),
      gender: toStr(row[`${prefix}Gender`]),
      dateOfBirth: formatIffDate(row[`${prefix}DOB`]),
      address1: toStr(row[`${prefix}Add1`]),
      address2: toStr(row[`${prefix}Add2`]),
      address3: toStr(row[`${prefix}Add3`]),
      homeTelephone: toStr(row[`${prefix}HomeTel`]),
      workTelephone: toStr(row[`${prefix}WorkTel`]),
      mobile: toStr(row[`${prefix}Mobile`]),
      organizationId: organizationId || null,
    });
  }
  return result;
}

export async function processBusinessCreditIFF(
  rows: Record<string, any>[],
  lenderInstitution: string,
  organizationId?: string
): Promise<ProcessingResult> {
  const result: ProcessingResult = {
    totalRecords: rows.length, borrowersCreated: 0, borrowersUpdated: 0,
    accountsCreated: 0, accountsUpdated: 0, chequesCreated: 0, chequesUpdated: 0,
    judgmentsCreated: 0, judgmentsUpdated: 0, guarantorsCreated: 0, guarantorsUpdated: 0, errors: [],
  };

  for (let i = 0; i < rows.length; i++) {
    try {
      const row = rows[i];
      if (toStr(row.Data) !== "D") continue;

      const borrowerData = mapBusinessBorrowerFields(row);
      const { id: borrowerId, created } = await findOrCreateBorrower(
        "corporate",
        { businessRegNumber: borrowerData.businessRegNumber, tinNumber: borrowerData.tinNumber },
        borrowerData,
        organizationId
      );
      if (created) result.borrowersCreated++; else result.borrowersUpdated++;

      const accountData = mapCreditAccountFields(row, borrowerId, lenderInstitution);
      accountData.organizationId = organizationId || null;

      const acctResult = await upsertCreditAccount(accountData, borrowerId);
      if (acctResult.created) result.accountsCreated++; else result.accountsUpdated++;

      const gList = extractGuarantors(row, acctResult.id, organizationId);
      for (const g of gList) {
        const gCreated = await upsertGuarantor(g);
        if (gCreated) result.guarantorsCreated++; else result.guarantorsUpdated++;
      }
    } catch (err: any) {
      result.errors.push(enrichError(err, rows[i], i + 1));
    }
  }
  return result;
}

export async function processConsumerCreditIFF(
  rows: Record<string, any>[],
  lenderInstitution: string,
  organizationId?: string
): Promise<ProcessingResult> {
  const result: ProcessingResult = {
    totalRecords: rows.length, borrowersCreated: 0, borrowersUpdated: 0,
    accountsCreated: 0, accountsUpdated: 0, chequesCreated: 0, chequesUpdated: 0,
    judgmentsCreated: 0, judgmentsUpdated: 0, guarantorsCreated: 0, guarantorsUpdated: 0, errors: [],
  };

  for (let i = 0; i < rows.length; i++) {
    try {
      const row = rows[i];
      if (toStr(row.Data) !== "D") continue;

      const borrowerData = mapConsumerBorrowerFields(row);
      const { id: borrowerId, created } = await findOrCreateBorrower(
        "individual",
        { nationalId: borrowerData.nationalId, votersId: borrowerData.votersId, passportNumber: borrowerData.passportNumber },
        borrowerData,
        organizationId
      );
      if (created) result.borrowersCreated++; else result.borrowersUpdated++;

      const accountData = mapCreditAccountFields(row, borrowerId, lenderInstitution);
      accountData.organizationId = organizationId || null;

      const acctResult = await upsertCreditAccount(accountData, borrowerId);
      if (acctResult.created) result.accountsCreated++; else result.accountsUpdated++;

      const gList = extractGuarantors(row, acctResult.id, organizationId);
      for (const g of gList) {
        const gCreated = await upsertGuarantor(g);
        if (gCreated) result.guarantorsCreated++; else result.guarantorsUpdated++;
      }
    } catch (err: any) {
      result.errors.push(enrichError(err, rows[i], i + 1));
    }
  }
  return result;
}

export async function processBusinessDishonouredChequesIFF(
  rows: Record<string, any>[],
  lenderInstitution: string,
  organizationId?: string
): Promise<ProcessingResult> {
  const result: ProcessingResult = {
    totalRecords: rows.length, borrowersCreated: 0, borrowersUpdated: 0,
    accountsCreated: 0, accountsUpdated: 0, chequesCreated: 0, chequesUpdated: 0,
    judgmentsCreated: 0, judgmentsUpdated: 0, guarantorsCreated: 0, guarantorsUpdated: 0, errors: [],
  };

  for (let i = 0; i < rows.length; i++) {
    try {
      const row = rows[i];
      if (toStr(row.Data) !== "D") continue;

      const borrowerData = mapBusinessBorrowerFields(row);
      const { id: borrowerId, created } = await findOrCreateBorrower(
        "corporate",
        { businessRegNumber: borrowerData.businessRegNumber, tinNumber: borrowerData.tinNumber },
        borrowerData,
        organizationId
      );
      if (created) result.borrowersCreated++; else result.borrowersUpdated++;

      const chequeData = {
        borrowerId,
        accountNumber: toStr(row.FacilityAccNum) || "",
        chequeNumber: toStr(row.ChequeNumber) || "",
        dateAccountOpened: formatIffDate(row.AccountOpened),
        dateIssued: formatIffDate(row.DateIssued) || "",
        dateBounced: formatIffDate(row.DateBounced) || "",
        reasonReturnedCode: toStr(row.ReasonReturned) || "",
        currency: toStr(row.Currency) || "GHS",
        chequeAmount: toNum(row.ChequeAmount) || "0",
        organizationId: organizationId || null,
      };
      const chequeCreated = await upsertDishonouredCheque(chequeData, borrowerId);
      if (chequeCreated) result.chequesCreated++; else result.chequesUpdated++;
    } catch (err: any) {
      result.errors.push(enrichError(err, rows[i], i + 1));
    }
  }
  return result;
}

export async function processConsumerDishonouredChequesIFF(
  rows: Record<string, any>[],
  lenderInstitution: string,
  organizationId?: string
): Promise<ProcessingResult> {
  const result: ProcessingResult = {
    totalRecords: rows.length, borrowersCreated: 0, borrowersUpdated: 0,
    accountsCreated: 0, accountsUpdated: 0, chequesCreated: 0, chequesUpdated: 0,
    judgmentsCreated: 0, judgmentsUpdated: 0, guarantorsCreated: 0, guarantorsUpdated: 0, errors: [],
  };

  for (let i = 0; i < rows.length; i++) {
    try {
      const row = rows[i];
      if (toStr(row.Data) !== "D") continue;

      const borrowerData = mapConsumerBorrowerFields(row);
      const { id: borrowerId, created } = await findOrCreateBorrower(
        "individual",
        { nationalId: borrowerData.nationalId, votersId: borrowerData.votersId, passportNumber: borrowerData.passportNumber },
        borrowerData,
        organizationId
      );
      if (created) result.borrowersCreated++; else result.borrowersUpdated++;

      const chequeData = {
        borrowerId,
        accountNumber: toStr(row.FacilityAccNum) || "",
        chequeNumber: toStr(row.ChequeNumber) || "",
        dateAccountOpened: formatIffDate(row.AccountOpened),
        dateIssued: formatIffDate(row.DateIssued) || "",
        dateBounced: formatIffDate(row.DateBounced) || "",
        reasonReturnedCode: toStr(row.ReasonReturned) || "",
        currency: toStr(row.Currency) || "GHS",
        chequeAmount: toNum(row.ChequeAmount) || "0",
        organizationId: organizationId || null,
      };
      const chequeCreated = await upsertDishonouredCheque(chequeData, borrowerId);
      if (chequeCreated) result.chequesCreated++; else result.chequesUpdated++;
    } catch (err: any) {
      result.errors.push(enrichError(err, rows[i], i + 1));
    }
  }
  return result;
}

export async function processBusinessJudgmentIFF(
  rows: Record<string, any>[],
  lenderInstitution: string,
  organizationId?: string
): Promise<ProcessingResult> {
  const result: ProcessingResult = {
    totalRecords: rows.length, borrowersCreated: 0, borrowersUpdated: 0,
    accountsCreated: 0, accountsUpdated: 0, chequesCreated: 0, chequesUpdated: 0,
    judgmentsCreated: 0, judgmentsUpdated: 0, guarantorsCreated: 0, guarantorsUpdated: 0, errors: [],
  };

  for (let i = 0; i < rows.length; i++) {
    try {
      const row = rows[i];
      if (toStr(row.Data) !== "D") continue;

      const borrowerData = mapBusinessBorrowerFields(row);
      const { id: borrowerId, created } = await findOrCreateBorrower(
        "corporate",
        { businessRegNumber: borrowerData.businessRegNumber, tinNumber: borrowerData.tinNumber },
        borrowerData,
        organizationId
      );
      if (created) result.borrowersCreated++; else result.borrowersUpdated++;

      const caseTypeMap: Record<string, string> = { "M": "civil_judgment", "S": "lawsuit", "A": "lien", "B": "bankruptcy" };
      const caseType = toStr(row.CaseType);

      const judgmentData = {
        borrowerId,
        caseNumber: toStr(row.CaseNumber) || "",
        court: toStr(row.CourtName) || "",
        courtLocation: toStr(row.CourtLocation),
        courtType: toStr(row.CourtType),
        judgmentType: caseTypeMap[caseType || ""] || "civil_judgment",
        amount: toNum(row.Amount),
        currency: toStr(row.Currency) || "GHS",
        judgmentDate: formatIffDate(row.FilingDate) || new Date().toISOString().split("T")[0],
        status: "active",
        caseFilingDate: formatIffDate(row.FilingDate),
        bogCaseType: caseType,
        caseReason: toStr(row.CaseReason),
        judgmentCurrency: toStr(row.Currency),
        organizationId: organizationId || null,
      };
      const judgmentCreated = await upsertCourtJudgment(judgmentData, borrowerId);
      if (judgmentCreated) result.judgmentsCreated++; else result.judgmentsUpdated++;
    } catch (err: any) {
      result.errors.push(enrichError(err, rows[i], i + 1));
    }
  }
  return result;
}

export async function processConsumerJudgmentIFF(
  rows: Record<string, any>[],
  lenderInstitution: string,
  organizationId?: string
): Promise<ProcessingResult> {
  const result: ProcessingResult = {
    totalRecords: rows.length, borrowersCreated: 0, borrowersUpdated: 0,
    accountsCreated: 0, accountsUpdated: 0, chequesCreated: 0, chequesUpdated: 0,
    judgmentsCreated: 0, judgmentsUpdated: 0, guarantorsCreated: 0, guarantorsUpdated: 0, errors: [],
  };

  for (let i = 0; i < rows.length; i++) {
    try {
      const row = rows[i];
      if (toStr(row.Data) !== "D") continue;

      const borrowerData = mapConsumerBorrowerFields(row);
      const { id: borrowerId, created } = await findOrCreateBorrower(
        "individual",
        { nationalId: borrowerData.nationalId, votersId: borrowerData.votersId, passportNumber: borrowerData.passportNumber },
        borrowerData,
        organizationId
      );
      if (created) result.borrowersCreated++; else result.borrowersUpdated++;

      const caseTypeMap: Record<string, string> = { "M": "civil_judgment", "S": "lawsuit", "A": "lien", "B": "bankruptcy" };
      const caseType = toStr(row.CaseType);

      const judgmentData = {
        borrowerId,
        caseNumber: toStr(row.CaseNumber) || "",
        court: toStr(row.CourtName) || "",
        courtLocation: toStr(row.CourtLocation),
        courtType: toStr(row.CourtType),
        judgmentType: caseTypeMap[caseType || ""] || "civil_judgment",
        amount: toNum(row.Amount),
        currency: toStr(row.Currency) || "GHS",
        judgmentDate: formatIffDate(row.FilingDate) || new Date().toISOString().split("T")[0],
        status: "active",
        caseFilingDate: formatIffDate(row.FilingDate),
        bogCaseType: caseType,
        caseReason: toStr(row.CaseReason),
        judgmentCurrency: toStr(row.Currency),
        organizationId: organizationId || null,
      };
      const judgmentCreated = await upsertCourtJudgment(judgmentData, borrowerId);
      if (judgmentCreated) result.judgmentsCreated++; else result.judgmentsUpdated++;
    } catch (err: any) {
      result.errors.push(enrichError(err, rows[i], i + 1));
    }
  }
  return result;
}

export type IFFType = "BUSINESS_CREDIT" | "BUSINESS_DISHONOURED_CHEQUES" | "BUSINESS_JUDGEMENT" | "CONSUMER_CREDIT" | "CONSUMER_DISHONOURED_CHEQUE" | "CONSUMER_JUDGEMENT";

export function detectIFFType(headers: string[]): IFFType | null {
  const h = new Set(headers.map(s => s?.trim()));
  const hasBusFields = h.has("BusRegNum") || h.has("BusinessName");
  const hasConsumerFields = h.has("NatIDNum") || h.has("Surname");
  const hasCreditFields = h.has("CreditFacilityType") || h.has("FacilityAmount");
  const hasChequeFields = h.has("ChequeNumber") || h.has("DateBounced");
  const hasJudgmentFields = h.has("CourtName") || h.has("CaseNumber");

  if (hasBusFields && hasCreditFields) return "BUSINESS_CREDIT";
  if (hasBusFields && hasChequeFields) return "BUSINESS_DISHONOURED_CHEQUES";
  if (hasBusFields && hasJudgmentFields) return "BUSINESS_JUDGEMENT";
  if (hasConsumerFields && hasCreditFields) return "CONSUMER_CREDIT";
  if (hasConsumerFields && hasChequeFields) return "CONSUMER_DISHONOURED_CHEQUE";
  if (hasConsumerFields && hasJudgmentFields) return "CONSUMER_JUDGEMENT";
  return null;
}

export async function processIFFData(
  iffType: IFFType,
  rows: Record<string, any>[],
  lenderInstitution: string,
  organizationId?: string
): Promise<ProcessingResult> {
  switch (iffType) {
    case "BUSINESS_CREDIT": return processBusinessCreditIFF(rows, lenderInstitution, organizationId);
    case "CONSUMER_CREDIT": return processConsumerCreditIFF(rows, lenderInstitution, organizationId);
    case "BUSINESS_DISHONOURED_CHEQUES": return processBusinessDishonouredChequesIFF(rows, lenderInstitution, organizationId);
    case "CONSUMER_DISHONOURED_CHEQUE": return processConsumerDishonouredChequesIFF(rows, lenderInstitution, organizationId);
    case "BUSINESS_JUDGEMENT": return processBusinessJudgmentIFF(rows, lenderInstitution, organizationId);
    case "CONSUMER_JUDGEMENT": return processConsumerJudgmentIFF(rows, lenderInstitution, organizationId);
  }
}
