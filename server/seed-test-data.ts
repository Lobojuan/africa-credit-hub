import { db } from "./db";
import { borrowers, creditAccounts, courtJudgments, consentRecords, paymentHistory, institutions, billingRecords, disputes, users } from "@shared/schema";
import { count, like } from "drizzle-orm";

const ghanaFirstNamesMale = [
  "Kwame", "Kofi", "Kwesi", "Yaw", "Kojo", "Kwaku", "Nana", "Osei",
  "Agyeman", "Akwasi", "Baffour", "Bright", "Charles", "Daniel", "Emmanuel",
  "Frederick", "George", "Henry", "Isaac", "James", "Kennedy", "Livingstone",
  "Michael", "Nicholas", "Patrick", "Richmond", "Samuel", "Thomas", "Vincent",
  "William", "Albert", "Benjamin", "Collins", "Dennis", "Enoch", "Francis",
  "Godwin", "Hayford", "Joshua", "Kenneth", "Lawrence", "Maxwell", "Nathaniel",
  "Oscar", "Prosper", "Ransford", "Stephen", "Timothy", "Wisdom", "Yeboah",
];

const ghanaFirstNamesFemale = [
  "Ama", "Akua", "Abena", "Efua", "Adjoa", "Afia", "Adwoa", "Akosua",
  "Beatrice", "Comfort", "Dorcas", "Elizabeth", "Felicia", "Grace", "Hannah",
  "Irene", "Juliana", "Kate", "Linda", "Martha", "Naomi", "Olivia",
  "Patience", "Regina", "Susana", "Theresa", "Victoria", "Wilhelmina",
  "Yvonne", "Zainab", "Agnes", "Bridget", "Christina", "Doris", "Evelyn",
  "Florence", "Gifty", "Helena", "Janet", "Lydia", "Mary", "Nana Ama",
  "Priscilla", "Rebecca", "Stella", "Vida", "Augustina", "Cecilia",
];

const ghanaLastNames = [
  "Mensah", "Asante", "Boateng", "Osei", "Annan", "Agyeman", "Appiah",
  "Frimpong", "Darko", "Addai", "Owusu", "Acheampong", "Amoah", "Gyamfi",
  "Badu", "Oppong", "Sarpong", "Ansah", "Tetteh", "Quaye", "Nartey",
  "Adjei", "Lartey", "Ofori", "Bonsu", "Afful", "Addo", "Nkrumah",
  "Amponsah", "Danquah", "Twumasi", "Asamoah", "Opoku", "Adu", "Boadu",
  "Bempah", "Yeboah", "Koranteng", "Marfo", "Asiedu", "Antwi", "Boakye",
  "Donkor", "Duah", "Fosu", "Gyasi", "Kumah", "Nyarko", "Poku", "Takyi",
  "Amankwah", "Baah", "Brobbey", "Dankwa", "Essien", "Kusi",
];

const ghanaCompanies = [
  "Kumasi Breweries Ltd", "Accra Textiles Group", "Gold Coast Logistics",
  "Ashanti Agribusiness Co.", "Volta River Foods Ltd", "Cape Coast Fishing Co.",
  "Tema Steel Works Ltd", "Takoradi Timber Export Ltd", "Koforidua Plastics Ltd",
  "Sunyani Poultry Farms", "Ho Cocoa Processing Ltd", "Tamale Rice Mills Ltd",
  "Accra Digital Solutions", "Ghana Cement Works", "West Africa Mills Ltd",
  "Makola Market Enterprises", "Obuasi Mining Services", "Nsawam Cannery Ltd",
  "Achimota Retail Group", "Tema Harbour Services", "Kasoa Trading Co.",
  "Spintex Pharmaceuticals", "Madina Auto Parts Ltd", "Dansoman Bakeries",
  "East Legon Properties Ltd", "Techiman Agricultural Coop", "Bolgatanga Crafts Ltd",
  "Wa Shea Butter Exports", "Nkawkaw Transport Services", "Winneba Fisheries Ltd",
  "Tarkwa Mining Supplies", "Konongo Gold Processing", "Ejisu Furniture Works",
  "Osu Hospitality Group", "Airport City Ventures", "Cantonments Consulting",
  "Tema Free Zone Enterprises", "Sekondi Shipyard Services", "Aflao Border Trading Co.",
  "Paga Cross-Border Logistics",
];

const ghanaEmployers = [
  "GCB Bank", "Ecobank Ghana", "Fidelity Bank Ghana", "CalBank", "Stanbic Bank Ghana",
  "MTN Ghana", "Vodafone Ghana", "AirtelTigo", "Scancom (MTN)", "Ghana Telecom",
  "AngloGold Ashanti", "Newmont Ghana", "Gold Fields Ghana", "Ghana Cocoa Board",
  "Unilever Ghana", "Nestlé Ghana", "Guinness Ghana Breweries", "Fan Milk Ghana",
  "Ghana Revenue Authority", "Bank of Ghana", "Securities and Exchange Commission",
  "Ministry of Finance", "Ghana Health Service", "Ghana Education Service",
  "University of Ghana", "KNUST", "University of Cape Coast", "Ghana Police Service",
  "Ghana Armed Forces", "Ghana Water Company", "Electricity Company of Ghana",
  "Tullow Oil Ghana", "GNPC", "Tema Oil Refinery", "Volta River Authority",
  "Ghana Ports and Harbours Authority", "Cocoa Processing Company",
  "Ghana National Petroleum Corporation", "Social Security and National Insurance Trust",
  "National Communications Authority", "Ghana Investment Promotion Centre",
  "State Insurance Company", "SIC Insurance", "Enterprise Insurance", "Star Assurance",
  "Melcom Group", "Shoprite Ghana", "Maxmart", "Palace Mall",
];

const ghanaOccupations = [
  "Accountant", "Bank Teller", "Branch Manager", "Business Analyst", "Civil Engineer",
  "Cocoa Farmer", "Credit Officer", "Doctor", "Electrician", "Entrepreneur",
  "Financial Analyst", "Fisherman", "Government Official", "HR Manager", "IT Specialist",
  "Journalist", "Lawyer", "Lecturer", "Marketing Manager", "Mechanic",
  "Mining Engineer", "Nurse", "Pharmacist", "Plumber", "Police Officer",
  "Quantity Surveyor", "Real Estate Agent", "School Teacher", "Software Developer",
  "Surgeon", "Taxi Driver", "Trader", "University Professor", "Veterinarian",
  "Welder", "Agricultural Officer", "Architect", "Auditor", "Banker",
  "Carpenter", "Customs Officer", "Dietitian", "Estate Manager", "Factory Worker",
  "Geologist", "Insurance Agent", "Laboratory Technician", "Midwife", "Optometrist",
];

const ghanaSectors = [
  "Banking", "Mining", "Agriculture", "Telecommunications", "Manufacturing",
  "Oil & Gas", "Construction", "Education", "Healthcare", "Government",
  "Insurance", "Transportation", "Hospitality", "Retail", "Technology",
  "Fishing", "Forestry", "Energy", "Real Estate", "Legal Services",
  "Cocoa", "Textiles", "Food Processing", "Media", "NGO",
];

const ghanaStreets = [
  "Oxford Street, Osu", "Kwame Nkrumah Avenue", "Independence Avenue",
  "Liberation Road", "Ring Road Central", "Castle Road", "Cantonments Road",
  "Spintex Road", "Tema Motorway", "Graphic Road", "Kojo Thompson Road",
  "Barnes Road", "Farrar Avenue", "Switchback Lane", "George Walker Bush Highway",
  "Tetteh Quarshie Interchange", "Achimota Road", "Madina Road", "Haatso Road",
  "Nungua Highway", "Sakumono Road", "Lashibi Road", "Dawhenya Road",
  "Adum Road", "Harper Road", "Stadium Road", "Lake Road", "Roman Ridge Road",
  "Airport Bypass", "Mango Tree Avenue",
];

const ghanaCities = [
  "Accra", "Kumasi", "Tamale", "Takoradi", "Cape Coast", "Sunyani",
  "Ho", "Koforidua", "Tema", "Obuasi", "Tarkwa", "Nkawkaw",
  "Winneba", "Kasoa", "Madina", "Techiman", "Bolgatanga", "Wa",
  "Sekondi", "Aflao", "Nsawam", "Konongo", "Ejisu", "Bekwai",
  "Ashaiman", "Akim Oda", "Hohoe", "Keta", "Prestea", "Dunkwa",
];

const ghanaRegions = [
  "Greater Accra", "Ashanti", "Northern", "Western", "Central",
  "Bono", "Volta", "Eastern", "Upper East", "Upper West",
  "Western North", "Ahafo", "Bono East", "Savannah", "North East", "Oti",
];

const ghanaBanks = [
  "GCB Bank", "Ecobank Ghana", "Fidelity Bank Ghana", "CalBank", "Stanbic Bank Ghana",
  "Access Bank Ghana", "Absa Bank Ghana", "Standard Chartered Ghana", "Zenith Bank Ghana",
  "Republic Bank Ghana", "Prudential Bank", "Agricultural Development Bank",
  "National Investment Bank", "Universal Merchant Bank", "First National Bank Ghana",
  "Consolidated Bank Ghana", "FBNBank Ghana", "Société Générale Ghana",
  "First Atlantic Bank", "Bank of Africa Ghana", "OmniBSIC Bank", "ARB Apex Bank",
];

const ghanaCourts = [
  "High Court of Accra", "Circuit Court Kumasi", "Supreme Court of Ghana",
  "Commercial Division Accra", "High Court Kumasi", "Circuit Court Cape Coast",
  "District Court Tamale", "High Court Takoradi", "Circuit Court Tema",
  "High Court Ho", "District Court Koforidua", "Circuit Court Sunyani",
  "High Court Bolgatanga", "Financial and Economic Division Accra",
  "Labour Court Accra", "Land Court Kumasi",
];

const ghanaEducation = [
  "University of Ghana", "KNUST", "University of Cape Coast",
  "University of Education Winneba", "Ghana Institute of Management and Public Administration",
  "Ashesi University", "Central University", "Methodist University",
  "Presbyterian University College", "Wisconsin International University",
  "Academic City University College", "Pentecost University",
  "Regent University College", "Valley View University",
  "Accra Technical University", "Kumasi Technical University", "Takoradi Technical University",
  "Ghana Communication Technology University",
];

function pick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }
function randInt(min: number, max: number): number { return Math.floor(Math.random() * (max - min + 1)) + min; }
function randDec(min: number, max: number): string { return (min + Math.random() * (max - min)).toFixed(2); }
function pastDate(maxYears: number): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() - randInt(0, maxYears));
  d.setMonth(randInt(0, 11));
  d.setDate(randInt(1, 28));
  return d.toISOString().split("T")[0];
}
function futureDate(maxYears: number): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() + randInt(1, maxYears));
  d.setMonth(randInt(0, 11));
  d.setDate(randInt(1, 28));
  return d.toISOString().split("T")[0];
}
function padId(n: number): string { return String(n).padStart(5, "0"); }

function generateGhanaCardNumber(): string {
  const prefix = "GHA";
  const digits = `${randInt(100000000, 999999999)}`;
  const check = randInt(0, 9);
  return `${prefix}-${digits}-${check}`;
}

function generateVotersId(): string {
  return `${randInt(1000000, 9999999)}${String.fromCharCode(65 + randInt(0, 25))}`;
}

function generateSSNIT(): string {
  return `${String.fromCharCode(65 + randInt(0, 25))}${String.fromCharCode(65 + randInt(0, 25))}${randInt(100000, 999999)}`;
}

function generateDriversLicense(): string {
  return `DL-${randInt(10000000, 99999999)}`;
}

export async function seedTestData() {
  const MIN_BORROWERS = 75;
  const TARGET_INDIVIDUALS = 55;
  const TARGET_CORPORATES = 25;

  const [check] = await db.select({ value: count() }).from(borrowers).where(like(borrowers.nationalId, "GHA%"));
  if (Number(check.value) >= MIN_BORROWERS) {
    console.log(`Ghana has ${check.value} borrowers (>=${MIN_BORROWERS}), skipping`);
    return;
  }

  const [adminUser] = await db.select().from(users).limit(1);
  if (!adminUser) {
    console.log("No users found — run main seed first");
    return;
  }

  console.log("Seeding comprehensive Ghana borrower and lending data...");

  let idCounter = 200000 + Math.floor(Math.random() * 50000);
  const usedNationalIds = new Set<string>();
  const usedCompanies = new Set<string>();
  const borrowerValues: any[] = [];

  const maritalStatuses = ["Single", "Married", "Divorced", "Widowed"];
  const proofTypes = ["Utility Bill", "Bank Statement", "Rent Agreement", "Property Tax Receipt", "DVLA Document"];
  const educationLevels = ["SHS/WASSCE", "HND", "Bachelor's Degree", "Master's Degree", "PhD", "Professional Certificate", "Diploma", "NVTI Certificate"];
  const pepTitles = ["Member of Parliament", "District Chief Executive", "Regional Minister", "Board Member — Bank of Ghana", "Director — COCOBOD", "SSNIT Board Member", "GRA Commissioner"];

  for (let i = 0; i < TARGET_INDIVIDUALS; i++) {
    idCounter++;
    const isMale = Math.random() < 0.5;
    const fn = isMale ? pick(ghanaFirstNamesMale) : pick(ghanaFirstNamesFemale);
    const ln = pick(ghanaLastNames);
    const cityIdx = i % ghanaCities.length;
    const regionIdx = i % ghanaRegions.length;
    const nationalId = `GHA-ID-${padId(idCounter)}`;
    if (usedNationalIds.has(nationalId)) continue;
    usedNationalIds.add(nationalId);

    const hasGhanaCard = Math.random() < 0.85;
    const hasVotersId = Math.random() < 0.6;
    const hasSSNIT = Math.random() < 0.7;
    const hasDriversLicense = Math.random() < 0.35;
    const hasPassport = Math.random() < 0.2;
    const hasMobileMoney = Math.random() < 0.75;
    const isPep = Math.random() < 0.06;
    const edLevel = pick(educationLevels);

    borrowerValues.push({
      type: "individual" as const,
      firstName: fn,
      lastName: ln,
      nationalId,
      tinNumber: `TIN-GHA-${padId(idCounter)}`,
      dateOfBirth: pastDate(40),
      gender: isMale ? "Male" : "Female",
      phone: `+233${pick(["20", "24", "25", "26", "27", "50", "54", "55", "56", "57"])}${randInt(1000000, 9999999)}`,
      email: `${fn.toLowerCase().replace(/[^a-z]/g, "")}.${ln.toLowerCase().replace(/[^a-z]/g, "")}${randInt(1, 99)}@${pick(["gmail.com", "yahoo.com", "outlook.com", "hotmail.com"])}`,
      address: `${randInt(1, 300)} ${pick(ghanaStreets)}, ${ghanaCities[cityIdx]}`,
      country: "Ghana",
      city: ghanaCities[cityIdx],
      region: ghanaRegions[regionIdx],
      employerName: pick(ghanaEmployers),
      occupation: pick(ghanaOccupations),
      sector: pick(ghanaSectors),
      ghanaCardNumber: hasGhanaCard ? generateGhanaCardNumber() : null,
      votersId: hasVotersId ? generateVotersId() : null,
      ssnitNumber: hasSSNIT ? generateSSNIT() : null,
      driversLicense: hasDriversLicense ? generateDriversLicense() : null,
      passportNumber: hasPassport ? `GH${randInt(100000, 999999)}` : null,
      mobileMoneyNumber: hasMobileMoney ? `+233${pick(["24", "25", "26", "27", "54", "55", "56", "57"])}${randInt(1000000, 9999999)}` : null,
      maritalStatus: pick(maritalStatuses),
      proofOfAddressType: pick(proofTypes),
      proofOfAddressNumber: `POA-${randInt(100000, 999999)}`,
      educationLevel: edLevel,
      educationInstitution: edLevel !== "SHS/WASSCE" && edLevel !== "NVTI Certificate" ? pick(ghanaEducation) : null,
      isPep,
      pepDetails: isPep ? `${pick(pepTitles)} - Ghana` : null,
    });
  }

  for (let i = 0; i < TARGET_CORPORATES; i++) {
    let companyName = pick(ghanaCompanies);
    let attempts = 0;
    while (usedCompanies.has(companyName) && attempts < 10) {
      companyName = `${companyName} (${pick(ghanaCities)})`;
      attempts++;
    }
    usedCompanies.add(companyName);
    idCounter++;
    const cityIdx = i % ghanaCities.length;
    const regionIdx = i % ghanaRegions.length;
    const nationalId = `GHA-BIZ-${padId(idCounter)}`;
    if (usedNationalIds.has(nationalId)) continue;
    usedNationalIds.add(nationalId);

    borrowerValues.push({
      type: "corporate" as const,
      companyName,
      nationalId,
      tinNumber: `TIN-GHA-C-${padId(idCounter)}`,
      phone: `+233${pick(["30", "31", "32"])}${randInt(2000000, 9999999)}`,
      email: `info@${companyName.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 20)}.com.gh`,
      address: `${pick(["Industrial Area", "Business District", "Commercial Zone", "Free Zones Enclave", "Light Industrial Area"])}, Plot ${randInt(1, 500)}, ${ghanaCities[cityIdx]}`,
      country: "Ghana",
      city: ghanaCities[cityIdx],
      region: ghanaRegions[regionIdx],
      businessRegNumber: `BN-${randInt(2005, 2024)}-${padId(randInt(1, 99999))}`,
      sector: pick(ghanaSectors),
      isPep: false,
    });
  }

  const createdBorrowers = await db.insert(borrowers).values(borrowerValues).returning();
  console.log(`  Created ${createdBorrowers.length} Ghana borrowers (${TARGET_INDIVIDUALS} individuals, ${TARGET_CORPORATES} corporates)`);

  const accountTypes = [
    "Personal Loan", "Mortgage", "Auto Loan", "Business Loan", "Overdraft",
    "Credit Card", "Microfinance Loan", "Agricultural Loan", "Trade Finance",
    "Student Loan", "Salary Advance", "SME Loan", "Asset Finance", "Working Capital",
  ];
  const collateralTypes = [
    "Landed Property", "Vehicle", "Fixed Deposit", "Government Securities",
    "Inventory", "Machinery", "Cocoa Warehouse Receipt", "Accounts Receivable",
    "Personal Guarantee", "Corporate Guarantee", "Life Insurance Policy",
  ];
  const facilityPurposes = [
    "Home Purchase", "Vehicle Acquisition", "Business Expansion", "Working Capital",
    "Cocoa Season Financing", "Education Fees", "Medical Expenses", "Inventory Purchase",
    "Equipment Acquisition", "Farm Development", "Construction", "Import Financing",
    "Export Pre-Financing", "Salary Support", "Debt Consolidation",
  ];
  const repaymentFreqs = ["Monthly", "Quarterly", "Bi-Weekly", "Weekly", "Bullet"];
  const assetClassifications = ["Pass", "OLEM", "Substandard", "Doubtful", "Loss"];
  const statuses: Array<"current" | "delinquent" | "default" | "closed" | "restructured" | "written_off"> = [
    "current", "current", "current", "current", "current",
    "delinquent", "delinquent", "default", "closed", "closed",
    "restructured", "written_off",
  ];

  const accountValues: any[] = [];
  for (const b of createdBorrowers) {
    const numAccounts = b.type === "corporate" ? randInt(2, 5) : randInt(1, 4);
    for (let a = 0; a < numAccounts; a++) {
      const status = pick(statuses);
      const isCorporate = b.type === "corporate";
      const amountMultiplier = isCorporate ? randInt(100, 2000) : randInt(2, 80);
      const original = (amountMultiplier * 1000).toString() + ".00";
      const balRatio = status === "closed" ? 0 : Math.random() * 0.85 + 0.1;
      const current = (amountMultiplier * 1000 * balRatio).toFixed(2);
      const acctType = pick(accountTypes);
      const daysArrears = status === "delinquent" ? randInt(30, 180) : status === "default" ? randInt(181, 720) : 0;
      const classification = daysArrears === 0 ? "Pass" : daysArrears <= 90 ? "OLEM" : daysArrears <= 180 ? "Substandard" : daysArrears <= 360 ? "Doubtful" : "Loss";

      accountValues.push({
        borrowerId: b.id,
        lenderInstitution: pick(ghanaBanks),
        accountNumber: `GHA-${pick(["LN", "OD", "CC", "ML", "TF", "MG", "AL", "SL"])}-${randInt(2019, 2025)}-${padId(randInt(1, 99999))}`,
        accountType: acctType,
        originalAmount: original,
        currentBalance: current,
        currency: Math.random() < 0.88 ? "GHS" : pick(["USD", "EUR", "GBP"]),
        interestRate: acctType === "Credit Card" ? randDec(24, 36) : acctType === "Mortgage" ? randDec(18, 28) : randDec(20, 35),
        disbursementDate: pastDate(5),
        maturityDate: futureDate(7),
        status,
        daysInArrears: daysArrears,
        collateralType: Math.random() < 0.7 ? pick(collateralTypes) : null,
        collateralValue: Math.random() > 0.3 ? (amountMultiplier * 1000 * (1.1 + Math.random() * 0.5)).toFixed(2) : null,
        lastPaymentDate: status !== "written_off" ? pastDate(1) : null,
        lastPaymentAmount: status !== "written_off" ? (amountMultiplier * 100 * (0.3 + Math.random())).toFixed(2) : null,
        restructureCount: status === "restructured" ? randInt(1, 3) : 0,
        writtenOffDate: status === "written_off" ? pastDate(1) : null,
        facilityTypeCode: `FT-${randInt(100, 999)}`,
        purposeOfFacility: pick(facilityPurposes),
        repaymentFrequency: pick(repaymentFreqs),
        assetClassification: classification,
        amountOverdue: daysArrears > 0 ? (amountMultiplier * 100 * Math.random()).toFixed(2) : "0.00",
      });
    }
  }

  const BATCH_SIZE = 200;
  for (let i = 0; i < accountValues.length; i += BATCH_SIZE) {
    await db.insert(creditAccounts).values(accountValues.slice(i, i + BATCH_SIZE));
  }
  console.log(`  Created ${accountValues.length} credit accounts`);

  const allAccounts = await db.select().from(creditAccounts);
  const borrowerIds = new Set(createdBorrowers.map(b => b.id));
  const newAccounts = allAccounts.filter(a => borrowerIds.has(a.borrowerId));
  const paymentValues: any[] = [];
  const paymentStatuses: Array<"on_time" | "late" | "missed" | "partial"> = ["on_time", "on_time", "on_time", "on_time", "on_time", "late", "missed", "partial"];

  for (const acc of newAccounts) {
    const numPayments = randInt(3, 12);
    for (let p = 0; p < numPayments; p++) {
      if (paymentValues.length > 4000) break;
      const d = new Date();
      d.setMonth(d.getMonth() - p - 1);
      const period = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const amountDue = randDec(200, 80000);
      const pStatus = pick(paymentStatuses);
      const paidRatio = pStatus === "on_time" ? 1 : pStatus === "partial" ? 0.3 + Math.random() * 0.6 : pStatus === "missed" ? 0 : 1;
      paymentValues.push({
        creditAccountId: acc.id,
        period,
        amountDue,
        amountPaid: (parseFloat(amountDue) * paidRatio).toFixed(2),
        status: pStatus,
        daysLate: pStatus === "late" ? randInt(1, 60) : pStatus === "missed" ? randInt(30, 120) : 0,
      });
    }
  }
  for (let i = 0; i < paymentValues.length; i += BATCH_SIZE) {
    await db.insert(paymentHistory).values(paymentValues.slice(i, i + BATCH_SIZE));
  }
  console.log(`  Created ${paymentValues.length} payment history records`);

  const disputeTypes = ["incorrect_balance", "wrong_account_status", "identity_theft", "duplicate_entry", "incorrect_personal_info", "unauthorized_inquiry"];
  const disputeStatuses: Array<"open" | "under_review" | "resolved" | "rejected"> = ["open", "open", "under_review", "under_review", "resolved", "rejected"];
  const disputeValues: any[] = [];
  const disputeSample = createdBorrowers.sort(() => Math.random() - 0.5).slice(0, 8);

  for (const b of disputeSample) {
    const status = pick(disputeStatuses);
    const now = new Date();
    const slaDeadline = new Date(now);
    slaDeadline.setDate(slaDeadline.getDate() + randInt(-5, 25));
    disputeValues.push({
      borrowerId: b.id,
      filedBy: adminUser.id,
      disputeType: pick(disputeTypes),
      description: pick([
        "The balance shown on my GCB Bank account does not match my records",
        "This account at Ecobank was closed in 2024 but still shows as active",
        "I did not open this account at Fidelity Bank — possible identity theft",
        "Duplicate entry from Stanbic Bank and CalBank for the same facility",
        "My Ghana Card number and personal details are recorded incorrectly",
        "I did not authorize this credit inquiry by the listed institution",
        "Payment made via Mobile Money was not reflected on my credit report",
        "Loan was fully repaid but outstanding balance still shows on report",
      ]),
      status,
      resolution: status === "resolved" ? pick([
        "Balance corrected per borrower bank statement from GCB",
        "Account status updated to closed as verified with Ecobank",
        "Duplicate entry removed after verification with both institutions",
        "Personal details updated per Ghana Card verification",
      ]) : null,
      slaDeadline,
    });
  }
  if (disputeValues.length > 0) {
    await db.insert(disputes).values(disputeValues);
    console.log(`  Created ${disputeValues.length} disputes`);
  }

  const judgmentTypes: Array<"lien" | "bankruptcy" | "lawsuit" | "civil_judgment" | "criminal_conviction"> = ["lien", "lawsuit", "civil_judgment", "civil_judgment", "bankruptcy"];
  const judgmentStatuses: Array<"active" | "resolved" | "appealed"> = ["active", "active", "resolved", "appealed"];
  const judgmentValues: any[] = [];
  const judgmentSample = createdBorrowers.sort(() => Math.random() - 0.5).slice(0, 5);

  for (const b of judgmentSample) {
    judgmentValues.push({
      borrowerId: b.id,
      caseNumber: `GH-${randInt(2020, 2025)}-CV-${padId(randInt(1, 9999))}`,
      court: pick(ghanaCourts),
      judgmentType: pick(judgmentTypes),
      amount: randDec(5000, 800000),
      currency: "GHS",
      judgmentDate: pastDate(3),
      status: pick(judgmentStatuses),
      description: pick([
        "Default on commercial loan — GCB Bank recovery action",
        "Breach of supply contract — Tema Industrial Zone",
        "Lien placed on property at East Legon for unpaid mortgage",
        "Bankruptcy filing — voluntary dissolution of trading company",
        "Default on agricultural loan — cocoa season financing",
        "Non-payment of equipment lease — CalBank leasing facility",
      ]),
    });
  }
  if (judgmentValues.length > 0) {
    await db.insert(courtJudgments).values(judgmentValues);
    console.log(`  Created ${judgmentValues.length} court judgments`);
  }

  const consentValues: any[] = [];
  let receiptCounter = 90000 + randInt(0, 10000);
  const consentSample = createdBorrowers.sort(() => Math.random() - 0.5).slice(0, 20);
  for (const b of consentSample) {
    receiptCounter++;
    consentValues.push({
      borrowerId: b.id,
      grantedTo: pick(ghanaBanks),
      purpose: pick(["Credit Report Access", "Data Sharing", "Portfolio Monitoring", "Collection Activities", "New Credit Application", "Mortgage Assessment", "Salary Advance Review"]),
      consentType: pick(["explicit", "implied", "blanket"]),
      status: Math.random() < 0.85 ? "active" as const : "revoked" as const,
      receiptNumber: `CR-GHA-${receiptCounter}`,
    });
  }
  if (consentValues.length > 0) {
    await db.insert(consentRecords).values(consentValues);
    console.log(`  Created ${consentValues.length} consent records`);
  }

  const institutionTypes = ["Commercial Bank", "Savings and Loans", "Microfinance Institution", "Rural Bank", "Development Bank", "Finance House", "Insurance Company", "Credit Union"];
  const additionalBanks = ghanaBanks.filter(b => !["GCB Bank", "Ecobank Ghana", "Fidelity Bank Ghana", "CalBank", "Stanbic Bank Ghana"].includes(b));
  const instValues: any[] = [];
  const existingInst = await db.select().from(institutions);
  const existingNames = new Set(existingInst.map(i => i.name));

  for (const bank of additionalBanks) {
    if (existingNames.has(bank)) continue;
    instValues.push({
      name: bank,
      type: pick(institutionTypes),
      registrationNumber: `REG-GHA-${padId(randInt(1000, 9999))}`,
      country: "Ghana",
      contactEmail: `compliance@${bank.toLowerCase().replace(/[^a-z0-9]/g, "")}.com.gh`,
      contactPhone: `+233${pick(["30", "31", "32"])}${randInt(2000000, 9999999)}`,
      address: `${pick(ghanaCities)}, ${pick(ghanaRegions)}`,
      status: pick(["active", "active", "active", "pending"] as Array<"active" | "pending">),
      submissionFrequency: pick(["monthly", "quarterly", "weekly"]),
    });
  }
  if (instValues.length > 0) {
    await db.insert(institutions).values(instValues);
    console.log(`  Created ${instValues.length} additional Ghana institutions`);
  }

  const billingValues: any[] = [];
  const serviceTypes = ["Credit Report", "Bulk Data Submission", "API Access", "Dispute Resolution", "Annual Subscription", "Portfolio Monitoring"];
  const billingStatuses: Array<"pending" | "paid" | "overdue"> = ["paid", "paid", "paid", "paid", "pending", "overdue"];
  let invoiceCounter = 30000 + randInt(0, 5000);
  const allInstitutions = await db.select().from(institutions);

  for (const inst of allInstitutions.slice(0, 15)) {
    for (let m = 0; m < 6; m++) {
      invoiceCounter++;
      const d = new Date();
      d.setMonth(d.getMonth() - m);
      const periodStart = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
      const endMonth = new Date(d);
      endMonth.setMonth(endMonth.getMonth() + 1);
      endMonth.setDate(0);
      const periodEnd = endMonth.toISOString().split("T")[0];
      billingValues.push({
        institutionName: inst.name,
        serviceType: pick(serviceTypes),
        amount: randDec(500, 35000),
        currency: "GHS",
        status: pick(billingStatuses),
        invoiceNumber: `INV-GHA-${invoiceCounter}`,
        periodStart,
        periodEnd,
      });
    }
  }
  if (billingValues.length > 0) {
    for (let i = 0; i < billingValues.length; i += BATCH_SIZE) {
      await db.insert(billingRecords).values(billingValues.slice(i, i + BATCH_SIZE));
    }
    console.log(`  Created ${billingValues.length} billing records`);
  }

  console.log("Ghana seed data complete!");
}
