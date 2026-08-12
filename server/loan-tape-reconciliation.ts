import crypto from "crypto";

export const REQUIRED_LOAN_TAPE_FIELDS = [
  "accountNumber",
  "currentBalance",
  "currency",
  "status",
  "daysInArrears",
  "reportingDate",
  "lenderInstitution",
] as const;

export const ALLOWED_LOAN_TAPE_FIELDS = new Set([
  ...REQUIRED_LOAN_TAPE_FIELDS,
  "amountOverdue", "nextPaymentDate", "restructureCount", "assetClassification", "ifrs9Stage",
  "collateralValue", "collateralValuationDate", "insuranceExpiry", "branchCode", "sectorCode",
  "relationshipManager", "creditOfficer", "interestInSuspense", "provisionAmount", "pd", "lgd", "ead",
]);

const ACCOUNT_STATUSES = new Set(["current", "delinquent", "default", "closed", "restructured", "written_off"]);

export type MappingRules = {
  collateralValuationMaxAgeDays?: number;
};

export type ReconciliationException = {
  sourceRowNumber: number;
  accountReference: string | null;
  rowFingerprint: string;
  exceptionType: string;
  severity: "warning" | "high" | "critical";
  fieldName: string | null;
  message: string;
};

export type ReconciliationResult = {
  totalRecords: number;
  cleanRecords: number;
  exceptionCount: number;
  criticalExceptionCount: number;
  status: "ready" | "blocked";
  sourceSha256: string;
  exceptions: ReconciliationException[];
};

export function parseLoanTapeCsv(csv: string): { headers: string[]; rows: string[][] } {
  if (!csv.trim()) throw new Error("Loan tape CSV is empty");
  const matrix: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  for (let index = 0; index < csv.length; index++) {
    const char = csv[index];
    if (char === '"') {
      if (quoted && csv[index + 1] === '"') {
        field += '"';
        index++;
      } else {
        quoted = !quoted;
      }
    } else if (char === "," && !quoted) {
      row.push(field.trim());
      field = "";
    } else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && csv[index + 1] === "\n") index++;
      row.push(field.trim());
      field = "";
      if (row.some((value) => value !== "")) matrix.push(row);
      row = [];
    } else {
      field += char;
    }
  }
  if (quoted) throw new Error("Loan tape CSV contains an unterminated quoted field");
  row.push(field.trim());
  if (row.some((value) => value !== "")) matrix.push(row);
  if (matrix.length < 2) throw new Error("Loan tape CSV must contain a header and at least one data row");
  const headers = matrix[0].map((header) => header.trim());
  if (headers.some((header) => !header)) throw new Error("Loan tape CSV contains an empty column header");
  if (new Set(headers).size !== headers.length) throw new Error("Loan tape CSV contains duplicate column headers");
  return { headers, rows: matrix.slice(1) };
}

export function validateMapping(fieldMappings: Record<string, string>) {
  const unknown = Object.keys(fieldMappings).filter((field) => !ALLOWED_LOAN_TAPE_FIELDS.has(field));
  if (unknown.length) throw new Error(`Unknown canonical field(s): ${unknown.join(", ")}`);
  const missing = REQUIRED_LOAN_TAPE_FIELDS.filter((field) => !fieldMappings[field]?.trim());
  if (missing.length) throw new Error(`Mapping is missing required field(s): ${missing.join(", ")}`);
  const duplicateSources = Object.values(fieldMappings).filter((source, index, values) => values.indexOf(source) !== index);
  if (duplicateSources.length) throw new Error(`A source column cannot map to multiple fields: ${[...new Set(duplicateSources)].join(", ")}`);
}

function parseNumber(value: string) {
  if (!value.trim()) return null;
  const normalized = value.replace(/,/g, "").trim();
  const result = Number(normalized);
  return Number.isFinite(result) ? result : Number.NaN;
}

function dateIsValid(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00Z`));
}

function maskAccount(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.length <= 4 ? `***${trimmed}` : `***${trimmed.slice(-4)}`;
}

export function reconcileLoanTape(input: {
  csv: string;
  fieldMappings: Record<string, string>;
  reportingDate: string;
  rules?: MappingRules;
}): ReconciliationResult {
  validateMapping(input.fieldMappings);
  if (!dateIsValid(input.reportingDate)) throw new Error("reportingDate must be a valid ISO date");
  const { headers, rows } = parseLoanTapeCsv(input.csv);
  if (rows.length > 50_000) throw new Error("A reconciliation run cannot exceed 50,000 rows");
  const missingColumns = Object.values(input.fieldMappings).filter((source) => !headers.includes(source));
  if (missingColumns.length) throw new Error(`CSV is missing mapped source column(s): ${[...new Set(missingColumns)].join(", ")}`);
  const headerIndex = new Map(headers.map((header, index) => [header, index]));
  const sourceSha256 = crypto.createHash("sha256").update(input.csv).digest("hex");
  const exceptions: ReconciliationException[] = [];
  const accountRows = new Map<string, number>();
  const affectedRows = new Set<number>();

  const add = (rowNumber: number, rowFingerprint: string, accountReference: string | null, exceptionType: string, severity: ReconciliationException["severity"], fieldName: string | null, message: string) => {
    exceptions.push({ sourceRowNumber: rowNumber, rowFingerprint, accountReference, exceptionType, severity, fieldName, message });
    affectedRows.add(rowNumber);
  };

  rows.forEach((row, rowIndex) => {
    const sourceRowNumber = rowIndex + 2;
    const value = (canonical: string) => {
      const sourceColumn = input.fieldMappings[canonical];
      if (!sourceColumn) return "";
      const position = headerIndex.get(sourceColumn);
      return position === undefined ? "" : row[position]?.trim() || "";
    };
    const accountNumber = value("accountNumber");
    const accountReference = maskAccount(accountNumber);
    const rowFingerprint = crypto.createHash("sha256").update(`${sourceSha256}:${sourceRowNumber}:${accountNumber}`).digest("hex");
    REQUIRED_LOAN_TAPE_FIELDS.forEach((fieldName) => {
      if (!value(fieldName)) add(sourceRowNumber, rowFingerprint, accountReference, "missing_required_field", "critical", fieldName, `Required mapped field ${fieldName} is empty`);
    });

    if (accountNumber) {
      const previousRow = accountRows.get(accountNumber);
      if (previousRow) add(sourceRowNumber, rowFingerprint, accountReference, "duplicate_account", "critical", "accountNumber", `Account reference duplicates source row ${previousRow}`);
      else accountRows.set(accountNumber, sourceRowNumber);
    }

    const balance = parseNumber(value("currentBalance"));
    if (Number.isNaN(balance) || (balance !== null && balance < 0)) add(sourceRowNumber, rowFingerprint, accountReference, "invalid_number", "critical", "currentBalance", "Current balance must be a non-negative number");
    const dpd = parseNumber(value("daysInArrears"));
    if (Number.isNaN(dpd) || (dpd !== null && (!Number.isInteger(dpd) || dpd < 0))) add(sourceRowNumber, rowFingerprint, accountReference, "invalid_dpd", "critical", "daysInArrears", "Days in arrears must be a non-negative whole number");
    const status = value("status").toLowerCase();
    if (status && !ACCOUNT_STATUSES.has(status)) add(sourceRowNumber, rowFingerprint, accountReference, "invalid_status", "critical", "status", "Account status is not in the approved UCH mapping set");
    if (value("reportingDate") && value("reportingDate") !== input.reportingDate) add(sourceRowNumber, rowFingerprint, accountReference, "reporting_date_mismatch", "critical", "reportingDate", "Row reporting date does not match the controlled import date");
    if (dpd !== null && !Number.isNaN(dpd) && dpd >= 90 && status && !["default", "written_off"].includes(status)) add(sourceRowNumber, rowFingerprint, accountReference, "classification_mismatch", "high", "status", "Facility is 90+ DPD but is not mapped as default or written off; bank policy review is required");
    const ifrs9Stage = value("ifrs9Stage").replace(/stage[_\s-]*/i, "");
    if (ifrs9Stage && !["1", "2", "3"].includes(ifrs9Stage)) add(sourceRowNumber, rowFingerprint, accountReference, "invalid_ifrs9_stage", "high", "ifrs9Stage", "Imported IFRS 9 stage must be 1, 2 or 3");
    if (dpd !== null && !Number.isNaN(dpd) && dpd >= 90 && ifrs9Stage && ifrs9Stage !== "3") add(sourceRowNumber, rowFingerprint, accountReference, "staging_mismatch", "high", "ifrs9Stage", "Facility is 90+ DPD but imported staging is not Stage 3; independent policy review is required");
    const amountOverdue = parseNumber(value("amountOverdue"));
    if (amountOverdue !== null && balance !== null && !Number.isNaN(amountOverdue) && !Number.isNaN(balance) && amountOverdue > balance) add(sourceRowNumber, rowFingerprint, accountReference, "arrears_balance_mismatch", "high", "amountOverdue", "Amount overdue exceeds current balance");
    const insuranceExpiry = value("insuranceExpiry");
    if (insuranceExpiry && dateIsValid(insuranceExpiry) && insuranceExpiry < input.reportingDate) add(sourceRowNumber, rowFingerprint, accountReference, "expired_collateral_insurance", "high", "insuranceExpiry", "Collateral insurance expired before the reporting date");
    const valuationDate = value("collateralValuationDate");
    const maxAgeDays = input.rules?.collateralValuationMaxAgeDays;
    if (valuationDate && maxAgeDays && dateIsValid(valuationDate)) {
      const ageDays = Math.floor((Date.parse(`${input.reportingDate}T00:00:00Z`) - Date.parse(`${valuationDate}T00:00:00Z`)) / 86_400_000);
      if (ageDays > maxAgeDays) add(sourceRowNumber, rowFingerprint, accountReference, "stale_collateral_valuation", "high", "collateralValuationDate", "Collateral valuation exceeds the bank-approved maximum age");
    }
  });

  const criticalExceptionCount = exceptions.filter((item) => item.severity === "critical").length;
  return {
    totalRecords: rows.length,
    cleanRecords: rows.length - affectedRows.size,
    exceptionCount: exceptions.length,
    criticalExceptionCount,
    status: exceptions.some((item) => item.severity === "critical" || item.severity === "high") ? "blocked" : "ready",
    sourceSha256,
    exceptions,
  };
}
