export const BOG_CREDIT_FACILITY_TYPE_CONSUMER: Record<string, string> = {
  "101": "Agriculture Facility",
  "102": "Auto Loan",
  "103": "Bank Guarantee",
  "104": "Bills Discounted",
  "106": "Credit Card",
  "107": "Education Loan",
  "108": "Hire Purchase",
  "109": "Housing Loan",
  "110": "Leasing",
  "111": "Letter of Credit",
  "112": "Loan against Bank Deposit",
  "113": "Loan against Employee Provident Fund",
  "114": "Loan against Life Insurance",
  "115": "Loan against Salary/Payroll Loan",
  "116": "Loan against Shares and Securities",
  "117": "Loan to Professional",
  "118": "Mortgage",
  "119": "Non-secured Loans",
  "120": "Other Secured Loans",
  "121": "Overdraft",
  "122": "Personal Loan",
  "123": "Pledge Loan",
  "124": "Property Loan",
  "125": "Government Loans",
  "126": "Term Loans",
  "127": "Travel Finance",
  "128": "Student Loan",
  "129": "Others",
};

export const BOG_CREDIT_FACILITY_TYPE_BUSINESS: Record<string, string> = {
  "101": "Agriculture Facility",
  "102": "Auto Loan",
  "103": "Bank Guarantee",
  "104": "Bills Discounted",
  "105": "Corporate Credit Card",
  "108": "Hire Purchase",
  "109": "Housing Loan",
  "110": "Leasing",
  "111": "Letter of Credit",
  "112": "Loan against Bank Deposit",
  "116": "Loan against Shares and Securities",
  "118": "Mortgage",
  "119": "Non-secured Loans",
  "120": "Other Secured Loans",
  "121": "Overdraft",
  "124": "Property Loan",
  "126": "Term Loans",
  "129": "Others",
};

export const BOG_REPAYMENT_FREQUENCY: Record<string, string> = {
  "10": "Weekly",
  "11": "Bi Monthly",
  "12": "Monthly",
  "13": "Quarterly",
  "14": "Tri Annually",
  "15": "Semi Annually",
  "16": "Annual",
  "17": "Variable",
  "18": "Bullet (One payment)",
  "19": "Demand (Revolving)",
  "20": "Unspecified",
  "21": "Balloon",
};

export const BOG_ASSET_CLASSIFICATION: Record<string, string> = {
  "A": "Current (1-30 days)",
  "B": "OLEM (31-90 days)",
  "C": "Substandard (91-180 days)",
  "D": "Doubtful (181-360 days)",
  "E": "Loss (Over 360 days)",
};

export const BOG_ACCOUNT_STATUS: Record<string, string> = {
  "A": "Open/Active",
  "B": "Approved, but not disbursed",
  "C": "Closed",
  "D": "Disputed",
  "E": "Terms Extended",
  "G": "Charge-off",
  "L": "Handed Over/Legal",
  "N": "Loan against Policy",
  "P": "Paid Up",
  "R": "Restructured/Rescheduled",
  "T": "Early Settlement",
  "W": "Written Off",
  "Z": "Deceased",
};

export const BOG_EMPLOYMENT_TYPE: Record<string, string> = {
  "101": "Salaried Individual",
  "102": "Unemployed",
  "103": "Student",
  "104": "Self Employed",
  "105": "Home Maker",
  "106": "Pensioner",
};

export const BOG_OWNER_TENANT: Record<string, string> = {
  "O": "Owner",
  "T": "Tenant",
  "F": "Family Owned",
};

export const BOG_MARITAL_STATUS: Record<string, string> = {
  "S": "Single",
  "W": "Widowed",
  "D": "Divorced",
  "M": "Married",
  "P": "Separated",
};

export const BOG_PURPOSE_OF_FACILITY: Record<string, string> = {
  "A": "Crisis Loan",
  "B": "Home Loans",
  "C": "Other Asset acquisition financing",
  "D": "Project Finance",
  "E": "Capital finance",
  "F": "Equipment and Machinery Finance",
  "G": "Working capital finance",
  "H": "Subscription finance",
  "J": "Finance for Trading in securities",
  "K": "Consolidation Loan",
  "L": "Other",
  "P": "Personal finance",
  "S": "Study Loan",
};

export const BOG_CLOSURE_REASON: Record<string, string> = {
  "A": "By Credit Grantor without prejudice to the Subject",
  "B": "Balance Transfer",
  "C": "Death",
  "D": "End of Credit Facility Tenure",
  "E": "Merger of Credit Facility",
  "F": "Early Settlement by Subject",
  "G": "By Court Order",
  "H": "Lost Cards/Compromised Cards",
  "J": "Bankruptcy",
  "K": "Restructured/Rescheduled",
};

export const BOG_REASON_WRITTEN_OFF: Record<string, string> = {
  "A": "Part Settlement",
  "B": "Death",
  "C": "Unable to locate",
  "D": "Government Concession",
  "E": "Bankruptcy",
  "F": "Other",
};

export const BOG_REASON_RESTRUCTURE: Record<string, string> = {
  "T": "Request for top ups",
  "E": "Irregular repayments",
  "L": "Loss of job",
  "D": "Business down turn",
  "F": "Force majeure",
  "C": "Other",
};

export const BOG_SECURITY_TYPE: Record<string, string> = {
  "A": "Land",
  "B": "Shares",
  "C": "Government Bonds/Securities",
  "D": "Building",
  "E": "Cash/Fixed Deposit",
  "F": "Bank Guarantee",
  "G": "Salary Assignment",
  "H": "Terminal Benefits Assignment",
  "J": "Bullions",
  "K": "General Plant & Machinery",
  "L": "Vehicles",
  "M": "Corporate Guarantee",
  "N": "Individual Guarantee",
  "P": "Government Guarantee",
  "Q": "Others",
};

export const BOG_BUSINESS_TYPE: Record<string, string> = {
  "A": "Sole Proprietorship",
  "B": "Limited Partnership",
  "C": "Company Limited By Shares",
  "D": "Company Limited By Guarantee",
  "E": "Unlimited Company",
  "F": "Cooperative",
  "G": "Foreign/External Company",
  "H": "Consultancy Firms/Professional Bodies",
  "J": "Social Organization",
  "K": "International Organizations",
  "L": "NGO",
};

export const BOG_SECTOR_INDUSTRY: Record<string, string> = {
  "10": "Agriculture, Forestry & Fishing",
  "20": "Mining & Quarrying",
  "30": "Manufacturing",
  "40": "Construction",
  "50": "Electricity, Gas & Water",
  "60": "Commerce & Finance",
  "70": "Transport, Storage and Communication",
  "80": "Services",
};

export const BOG_SUB_SECTOR: Record<string, string> = {
  "101": "Cocoa Production",
  "102": "Livestock Breeding",
  "103": "Poultry Farming",
  "104": "Other Agriculture",
  "105": "Forestry",
  "106": "Logging",
  "107": "Fishing",
  "201": "Bauxite",
  "202": "Diamonds",
  "203": "Gold",
  "204": "Manganese",
  "205": "Quarrying",
  "206": "Other Mining Activity",
  "301": "Food, Drink & Tobacco",
  "302": "Textiles, Clothing & Footwear",
  "303": "Sawmilling & Wood Processing",
  "304": "Paper pulp & Paper products",
  "305": "Chemicals and Fertilizers",
  "306": "Iron and Steel",
  "307": "Boat/Ship Building and repairs",
  "308": "Manufacturing of Motor Vehicles",
  "309": "Other Unclassified",
  "401": "Construction & Works",
  "402": "Building Construction",
  "501": "Electric light & Power",
  "502": "Gas Manufacture & Distribution",
  "503": "Water Supply",
  "601": "Motor Vehicle Import & Declaration",
  "602": "Machinery & Heavy equipment",
  "603": "Other Import Items",
  "604": "Cocoa Exports",
  "605": "Timber Export",
  "606": "Other Export Items",
  "607": "Hire Purchase Company",
  "608": "Insurance Company",
  "609": "Building bodies and Corporations",
  "701": "Railway transport",
  "702": "Road transport",
  "703": "Ocean and Other Water transport",
  "704": "Air transport",
  "705": "Storage and warehousing",
  "706": "Communications",
  "801": "Printing, Publishing and Allied Products",
  "802": "Business Services",
  "803": "Recreation Services",
  "804": "Personal Services",
  "805": "Salary Credit",
  "806": "Other Services including Government Services",
};

export const BOG_PAYMENT_HISTORY_PROFILE: Record<string, string> = {
  "0": "Current (1-30 days)",
  "1": "31-60 days past due",
  "2": "61-90 days past due",
  "3": "91-120 days past due",
  "4": "121-180 days past due",
  "5": "180+ days past due",
};

export const BOG_CASE_TYPE: Record<string, string> = {
  "A": "Civil",
  "B": "Criminal",
  "C": "Commercial",
  "D": "Family",
  "E": "Labour",
};

export const BOG_CASE_REASON: Record<string, string> = {
  "F": "Fraud",
  "R": "Debt Recovery",
  "O": "Other",
};

export const BOG_CHEQUE_RETURN_REASON: Record<string, string> = {
  "11": "Insufficient Funds",
  "12": "Fraud",
};

export const BOG_SPECIAL_COMMENTS: Record<string, string> = {
  "101": "Paid by Co maker",
  "102": "Loan assumed by another party",
  "103": "Account closed at credit grantor's request",
  "104": "Accounts transferred to another lender",
  "105": "Adjustment pending",
  "106": "Paying under a partial payment agreement",
  "107": "Purchased by another lender",
  "108": "Payroll deduction",
  "109": "Credit Line suspended",
  "110": "Account closed due to refinance",
  "111": "Account closed due to Transfer",
  "112": "Account paid in full for less than the full balance",
  "113": "First payment never received",
  "114": "Account paid from collateral",
  "115": "Principal deferred/Interest payment only",
};

export const BOG_LEGAL_FLAG: Record<string, string> = {
  "101": "No",
  "102": "Yes",
};

export const BOG_NATURE_OF_GUARANTOR: Record<string, string> = {
  "101": "Individual",
  "102": "Commercial Entity",
  "103": "No Guarantor",
};

export const BOG_NATURE_OF_CHARGE: Record<string, string> = {
  "A": "Fixed",
  "B": "Float",
};

export const BOG_OTHER_ID_TYPE: Record<string, string> = {
  "STAFF": "Staff ID",
  "STUD": "Student ID",
  "SERV": "Service ID",
  "NHIS": "National Health Insurance ID",
};

export const BOG_PROOF_OF_ADDRESS: Record<string, string> = {
  "WAT": "Water Bill",
  "ELE": "Electricity Bill",
};

export const BOG_COLLATERAL_INDICATOR: Record<string, string> = {
  "101": "Yes",
  "102": "No",
};

export const BOG_FILE_IDENTIFIERS = {
  CONC: "Consumer Credit",
  BUSC: "Business Credit",
  CONJ: "Consumer Judgment",
  BUSJ: "Business Judgment",
  COND: "Consumer Dishonoured Cheque",
  BUSD: "Business Dishonoured Cheque",
} as const;

export type BogFileType = keyof typeof BOG_FILE_IDENTIFIERS;

export function mapInternalStatusToBog(status: string): string {
  const mapping: Record<string, string> = {
    "current": "A",
    "delinquent": "A",
    "default": "L",
    "closed": "C",
    "restructured": "R",
    "written_off": "W",
  };
  return mapping[status] || "A";
}

export function mapInternalAssetClassToBog(classification: string | null | undefined): string {
  if (!classification) return "A";
  const mapping: Record<string, string> = {
    "Pass": "A",
    "OLEM": "B",
    "Substandard": "C",
    "Doubtful": "D",
    "Loss": "E",
  };
  return mapping[classification] || "A";
}

export function mapDaysInArrearsToPaymentProfile(days: number): string {
  if (days <= 30) return "0";
  if (days <= 60) return "1";
  if (days <= 90) return "2";
  if (days <= 120) return "3";
  if (days <= 180) return "4";
  return "5";
}

export function formatBogDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "";
  return dateStr.replace(/-/g, "").substring(0, 8);
}

export function formatBogAmount(amount: string | number | null | undefined): string {
  if (amount === null || amount === undefined || amount === "") return "0";
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  if (isNaN(num)) return "0";
  return Math.round(num).toString();
}

export function generateBogFilename(
  srn: string,
  reportingDate: string,
  fileCreatedDate: string,
  fileId: BogFileType,
  sequenceNum: number
): string {
  return `${srn}-${reportingDate}-${fileCreatedDate}-1.1-${fileId}-${sequenceNum}.csv`;
}
