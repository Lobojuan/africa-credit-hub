import { db } from "./db";
import { borrowers, creditAccounts, creditInquiries, courtJudgments, consentRecords, paymentHistory, institutions, billingRecords, disputes, users, dishonouredCheques, organizations, retentionPolicies, apiConfigurations } from "@shared/schema";
import { count, like, ne, isNull, eq } from "drizzle-orm";
import { mapInternalStatusToBog, mapInternalAssetClassToBog, mapDaysInArrearsToPaymentProfile } from "@shared/bog-codes";

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
  "Agriculture", "Agriculture", "Agriculture", "Agriculture", "Agriculture",
  "Agriculture", "Agriculture", "Agriculture", "Cocoa", "Cocoa",
  "Cocoa", "Cocoa", "Cocoa", "Cocoa", "Fishing", "Fishing",
  "Forestry", "Forestry",
  "Retail", "Retail", "Retail", "Retail", "Retail",
  "Hospitality", "Hospitality", "Food Processing", "Food Processing",
  "Transportation", "Transportation", "Transportation",
  "Banking", "Banking", "Insurance",
  "Mining", "Mining", "Mining",
  "Construction", "Construction",
  "Government", "Government", "Government",
  "Education", "Education",
  "Healthcare", "Healthcare",
  "Telecommunications", "Manufacturing", "Oil & Gas",
  "Technology", "Energy", "Real Estate", "Legal Services",
  "Textiles", "Media", "NGO",
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

const ghanaCitiesUnique = [
  "Accra", "Kumasi", "Tamale", "Takoradi", "Cape Coast", "Sunyani",
  "Ho", "Koforidua", "Tema", "Obuasi", "Tarkwa", "Nkawkaw",
  "Winneba", "Kasoa", "Madina", "Techiman", "Bolgatanga", "Wa",
  "Sekondi", "Aflao", "Nsawam", "Konongo", "Ejisu", "Bekwai",
  "Ashaiman", "Akim Oda", "Hohoe", "Keta", "Prestea", "Dunkwa",
];
const ghanaCities = [
  "Accra", "Accra", "Accra", "Accra", "Accra", "Accra", "Accra", "Accra", "Accra", "Accra",
  "Accra", "Accra", "Accra", "Accra", "Accra",
  "Tema", "Tema", "Tema", "Tema", "Tema", "Tema", "Tema",
  "Madina", "Madina", "Madina", "Kasoa", "Kasoa", "Kasoa",
  "Ashaiman", "Ashaiman",
  "Kumasi", "Kumasi", "Kumasi", "Kumasi", "Kumasi", "Kumasi", "Kumasi", "Kumasi",
  "Ejisu", "Obuasi",
  "Tamale", "Tamale", "Tamale",
  "Takoradi", "Takoradi", "Sekondi",
  "Cape Coast", "Cape Coast", "Winneba",
  "Sunyani", "Techiman",
  "Koforidua", "Nsawam", "Akim Oda",
  "Ho", "Hohoe",
  "Bolgatanga", "Wa",
  "Tarkwa", "Nkawkaw", "Konongo", "Bekwai", "Aflao", "Keta", "Prestea", "Dunkwa",
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

function distributeOverdue(total: number, daysInArrears: number): number[] {
  const buckets = [0, 0, 0, 0, 0, 0, 0];
  if (total <= 0 || daysInArrears <= 0) return buckets;
  const activeBuckets = Math.min(Math.ceil(daysInArrears / 30), 7);
  let remaining = total;
  for (let i = 0; i < activeBuckets; i++) {
    const share = i < activeBuckets - 1 ? remaining * (0.2 + Math.random() * 0.3) : remaining;
    buckets[i] = Math.round(share * 100) / 100;
    remaining -= buckets[i];
  }
  return buckets;
}

export async function seedTestData() {
  const MIN_BORROWERS = 75;
  const TARGET_INDIVIDUALS = 72;
  const TARGET_CORPORATES = 13;

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
  const bogTitles = ["Mr", "Mrs", "Ms", "Dr", "Prof", "Chief", "Nana", "Rev"];
  const bogOwnerTenant = ["O", "O", "O", "O", "O", "T", "T", "T", "F"];
  const bogEmploymentTypes = ["101", "101", "101", "101", "101", "104", "104", "106", "103", "102"];
  const bogNationalities = ["GHA", "GHA", "GHA", "GHA", "GHA", "GHA", "GHA", "GHA", "GHA", "GHA", "GHA", "GHA", "GHA", "GHA", "GHA", "GHA", "GHA", "GHA", "GHA", "NGA", "TGO", "CIV", "BFA"];
  const bogBusinessTypes = ["A", "A", "A", "C", "C", "C", "B", "D", "F", "G", "H", "L"];
  const bogSectorIndustry = ["10", "10", "10", "20", "30", "30", "40", "50", "60", "60", "60", "70", "80", "80"];
  const bogSubSectors: Record<string, string[]> = {
    "10": ["101", "102", "103", "104", "105", "107"],
    "20": ["203", "205", "206"],
    "30": ["301", "302", "303", "305", "309"],
    "40": ["401", "402"],
    "50": ["501", "503"],
    "60": ["601", "603", "604", "607", "608"],
    "70": ["702", "703", "706"],
    "80": ["801", "802", "804", "805", "806"],
  };

  const cityToRegion: Record<string, string> = {
    "Accra": "Greater Accra", "Tema": "Greater Accra", "Madina": "Greater Accra",
    "Kasoa": "Central", "Ashaiman": "Greater Accra",
    "Kumasi": "Ashanti", "Ejisu": "Ashanti", "Obuasi": "Ashanti", "Bekwai": "Ashanti", "Konongo": "Ashanti",
    "Tamale": "Northern", "Cape Coast": "Central", "Winneba": "Central",
    "Takoradi": "Western", "Sekondi": "Western", "Tarkwa": "Western", "Prestea": "Western",
    "Sunyani": "Bono", "Techiman": "Bono East",
    "Ho": "Volta", "Hohoe": "Volta", "Keta": "Volta", "Aflao": "Volta",
    "Koforidua": "Eastern", "Nsawam": "Eastern", "Akim Oda": "Eastern", "Nkawkaw": "Eastern",
    "Bolgatanga": "Upper East", "Wa": "Upper West", "Dunkwa": "Central",
  };

  for (let i = 0; i < TARGET_INDIVIDUALS; i++) {
    idCounter++;
    const isMale = Math.random() < 0.5;
    const fn = isMale ? pick(ghanaFirstNamesMale) : pick(ghanaFirstNamesFemale);
    const ln = pick(ghanaLastNames);
    const city = pick(ghanaCities);
    const region = cityToRegion[city] || pick(ghanaRegions);
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

    const middleName = Math.random() < 0.6 ? (isMale ? pick(ghanaFirstNamesMale) : pick(ghanaFirstNamesFemale)) : null;
    const empType = pick(bogEmploymentTypes);
    const monthlyInc = empType === "102" ? 0 : randInt(800, 25000);

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
      address: `${randInt(1, 300)} ${pick(ghanaStreets)}, ${city}`,
      country: "Ghana",
      city,
      region,
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
      middleNames: middleName,
      title: isMale ? pick(["Mr", "Mr", "Mr", "Dr", "Prof", "Chief", "Nana"]) : pick(["Mrs", "Ms", "Ms", "Dr", "Prof"]),
      nationality: pick(bogNationalities),
      ownerOrTenant: pick(bogOwnerTenant),
      employmentTypeCode: empType,
      ezwichNumber: Math.random() < 0.4 ? `EZW${randInt(1000000000, 9999999999)}` : null,
      numberOfDependants: randInt(0, 6),
      monthlyIncome: monthlyInc.toFixed(2),
      incomeCurrency: "GHS",
      homeTelephone: Math.random() < 0.3 ? `+233${pick(["30", "31", "32"])}${randInt(2000000, 9999999)}` : null,
      workTelephone: Math.random() < 0.4 ? `+233${pick(["30", "31", "32"])}${randInt(2000000, 9999999)}` : null,
      dateOfEmployment: empType === "101" || empType === "104" ? pastDate(10) : null,
      employerAddress: empType === "101" ? `${pick(ghanaStreets)}, ${pick(ghanaCitiesUnique)}` : null,
    });
  }

  for (let i = 0; i < TARGET_CORPORATES; i++) {
    let companyName = pick(ghanaCompanies);
    let attempts = 0;
    while (usedCompanies.has(companyName) && attempts < 10) {
      companyName = `${companyName} (${pick(ghanaCitiesUnique)})`;
      attempts++;
    }
    usedCompanies.add(companyName);
    idCounter++;
    const city = pick(ghanaCities);
    const region = cityToRegion[city] || pick(ghanaRegions);
    const nationalId = `GHA-BIZ-${padId(idCounter)}`;
    if (usedNationalIds.has(nationalId)) continue;
    usedNationalIds.add(nationalId);

    const sectorCode = pick(bogSectorIndustry);
    const subSectors = bogSubSectors[sectorCode] || ["309"];
    borrowerValues.push({
      type: "corporate" as const,
      companyName,
      nationalId,
      tinNumber: `TIN-GHA-C-${padId(idCounter)}`,
      phone: `+233${pick(["30", "31", "32"])}${randInt(2000000, 9999999)}`,
      email: `info@${companyName.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 20)}.com.gh`,
      address: `${pick(["Industrial Area", "Business District", "Commercial Zone", "Free Zones Enclave", "Light Industrial Area"])}, Plot ${randInt(1, 500)}, ${city}`,
      country: "Ghana",
      city,
      region,
      businessRegNumber: `BN-${randInt(2005, 2024)}-${padId(randInt(1, 99999))}`,
      sector: pick(ghanaSectors),
      isPep: false,
      sectorIndustryCode: sectorCode,
      subSectorCode: pick(subSectors),
      businessTypeCode: pick(bogBusinessTypes),
      turnoverAmount: (randInt(50, 5000) * 1000).toFixed(2),
      turnoverCurrency: "GHS",
      registrationDate: pastDate(15),
      commencementDate: pastDate(12),
    });
  }

  const createdBorrowers = await db.insert(borrowers).values(borrowerValues).returning();
  console.log(`  Created ${createdBorrowers.length} Ghana borrowers (${TARGET_INDIVIDUALS} individuals, ${TARGET_CORPORATES} corporates)`);

  const lendingOrgs = await db.select({ id: organizations.id })
    .from(organizations)
    .where(ne(organizations.name, "Bank of Ghana"));
  if (lendingOrgs.length > 0) {
    for (let i = 0; i < createdBorrowers.length; i++) {
      const orgId = lendingOrgs[i % lendingOrgs.length].id;
      await db.update(borrowers).set({ organizationId: orgId }).where(eq(borrowers.id, createdBorrowers[i].id));
      createdBorrowers[i] = { ...createdBorrowers[i], organizationId: orgId };
    }
    console.log(`  Assigned borrowers across ${lendingOrgs.length} organizations`);
  }

  const individualAccountTypes = [
    "Personal Loan", "Personal Loan", "Personal Loan", "Personal Loan",
    "Salary Advance", "Salary Advance", "Salary Advance",
    "Microfinance Loan", "Microfinance Loan", "Microfinance Loan",
    "Mortgage", "Mortgage",
    "Auto Loan", "Auto Loan",
    "Credit Card",
    "Student Loan", "Student Loan",
    "Agricultural Loan", "Agricultural Loan", "Agricultural Loan",
    "Overdraft",
  ];
  const corporateAccountTypes = [
    "Business Loan", "Business Loan", "Business Loan",
    "SME Loan", "SME Loan", "SME Loan",
    "Working Capital", "Working Capital",
    "Trade Finance", "Trade Finance",
    "Agricultural Loan", "Agricultural Loan",
    "Asset Finance", "Overdraft",
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
  const repaymentFreqs = ["Monthly", "Monthly", "Monthly", "Monthly", "Quarterly", "Bi-Weekly", "Weekly", "Bullet"];
  const statuses: Array<"current" | "delinquent" | "default" | "closed" | "restructured" | "written_off"> = [
    "current", "current", "current", "current", "current", "current", "current", "current", "current", "current",
    "current", "current",
    "delinquent", "delinquent",
    "default",
    "closed", "closed", "closed",
    "restructured",
    "written_off",
  ];

  function loanAmount(acctType: string, isCorporate: boolean): number {
    if (isCorporate) {
      if (acctType === "Trade Finance") return randInt(200, 2500) * 1000;
      if (acctType === "Working Capital") return randInt(80, 1200) * 1000;
      if (acctType === "Business Loan" || acctType === "SME Loan") return randInt(50, 800) * 1000;
      if (acctType === "Agricultural Loan") return randInt(30, 600) * 1000;
      return randInt(50, 500) * 1000;
    }
    if (acctType === "Mortgage") return randInt(180, 1500) * 1000;
    if (acctType === "Auto Loan") return randInt(25, 120) * 1000;
    if (acctType === "Personal Loan") return randInt(5, 150) * 1000;
    if (acctType === "Salary Advance") return randInt(2, 30) * 1000;
    if (acctType === "Microfinance Loan") return randInt(1, 25) * 1000;
    if (acctType === "Student Loan") return randInt(3, 40) * 1000;
    if (acctType === "Agricultural Loan") return randInt(5, 80) * 1000;
    if (acctType === "Credit Card") return randInt(2, 20) * 1000;
    if (acctType === "Overdraft") return randInt(2, 50) * 1000;
    return randInt(5, 100) * 1000;
  }

  function interestRate(acctType: string): string {
    if (acctType === "Credit Card") return randDec(28, 38);
    if (acctType === "Mortgage") return randDec(18, 26);
    if (acctType === "Microfinance Loan") return randDec(28, 36);
    if (acctType === "Salary Advance") return randDec(20, 30);
    if (acctType === "Agricultural Loan") return randDec(18, 25);
    if (acctType === "Student Loan") return randDec(18, 23);
    if (acctType === "Auto Loan") return randDec(22, 32);
    if (acctType === "Overdraft") return randDec(24, 34);
    return randDec(22, 35);
  }

  const accountValues: any[] = [];
  for (const b of createdBorrowers) {
    const isCorporate = b.type === "corporate";
    const numAccounts = isCorporate ? randInt(2, 4) : randInt(1, 3);
    for (let a = 0; a < numAccounts; a++) {
      const status = pick(statuses);
      const acctType = isCorporate ? pick(corporateAccountTypes) : pick(individualAccountTypes);
      const origAmount = loanAmount(acctType, isCorporate);
      const original = origAmount.toFixed(2);
      const balRatio = status === "closed" ? 0 : Math.random() * 0.85 + 0.1;
      const current = (origAmount * balRatio).toFixed(2);
      const daysArrears = status === "delinquent" ? randInt(30, 180) : status === "default" ? randInt(181, 720) : 0;
      const classification = daysArrears === 0 ? "Pass" : daysArrears <= 90 ? "OLEM" : daysArrears <= 180 ? "Substandard" : daysArrears <= 360 ? "Doubtful" : "Loss";

      const totalOverdue = daysArrears > 0 ? origAmount * 0.1 * Math.random() : 0;
      const hasCollateral = Math.random() < 0.7;
      const collType = hasCollateral ? pick(collateralTypes) : null;
      const termMonths = acctType === "Overdraft" ? 12 : acctType === "Mortgage" ? randInt(120, 360) : randInt(6, 72);
      const facilityCode = isCorporate
        ? pick(["101", "103", "110", "118", "121", "126", "129"])
        : pick(["102", "106", "107", "109", "115", "118", "121", "122", "128"]);
      const repayCode = pick(["10", "12", "12", "12", "13", "16", "18"]);
      const purposeCode = pick(["A", "B", "C", "D", "E", "F", "G", "K", "L", "P", "S"]);
      const securityTypeMap: Record<string, string> = {
        "Landed Property": "A", "Vehicle": "L", "Fixed Deposit": "E",
        "Government Securities": "C", "Inventory": "Q", "Machinery": "K",
        "Cocoa Warehouse Receipt": "Q", "Accounts Receivable": "Q",
        "Personal Guarantee": "N", "Corporate Guarantee": "M", "Life Insurance Policy": "Q",
      };
      const overdueArr = distributeOverdue(totalOverdue, daysArrears);

      accountValues.push({
        borrowerId: b.id,
        organizationId: b.organizationId,
        lenderInstitution: pick(ghanaBanks),
        accountNumber: `GHA-${pick(["LN", "OD", "CC", "ML", "TF", "MG", "AL", "SL"])}-${randInt(2019, 2025)}-${padId(randInt(1, 99999))}`,
        accountType: acctType,
        originalAmount: original,
        currentBalance: current,
        currency: Math.random() < 0.97 ? "GHS" : pick(["USD", "EUR", "GBP"]),
        interestRate: interestRate(acctType),
        disbursementDate: pastDate(5),
        maturityDate: futureDate(7),
        status,
        daysInArrears: daysArrears,
        collateralType: collType,
        collateralValue: hasCollateral ? (origAmount * (1.1 + Math.random() * 0.5)).toFixed(2) : null,
        lastPaymentDate: status !== "written_off" ? pastDate(1) : null,
        lastPaymentAmount: status !== "written_off" ? (origAmount * 0.05 * (0.3 + Math.random())).toFixed(2) : null,
        restructureCount: status === "restructured" ? randInt(1, 3) : 0,
        writtenOffDate: status === "written_off" ? pastDate(1) : null,
        facilityTypeCode: facilityCode,
        purposeOfFacility: purposeCode,
        repaymentFrequency: repayCode,
        assetClassification: classification,
        amountOverdue: totalOverdue.toFixed(2),
        currentBalanceIndicator: parseFloat(current) >= 0 ? "D" : "C",
        facilityTerm: termMonths,
        scheduledInstallmentAmount: (origAmount / termMonths).toFixed(2),
        disbursementAmount: original,
        paymentHistoryProfile: mapDaysInArrearsToPaymentProfile(daysArrears),
        bogAccountStatus: mapInternalStatusToBog(status),
        bogAssetClassification: mapInternalAssetClassToBog(classification),
        legalFlag: daysArrears > 180 && Math.random() < 0.3 ? "102" : "101",
        amtOverdue1to30: overdueArr[0].toFixed(2),
        amtOverdue31to60: overdueArr[1].toFixed(2),
        amtOverdue61to90: overdueArr[2].toFixed(2),
        amtOverdue91to120: overdueArr[3].toFixed(2),
        amtOverdue121to150: overdueArr[4].toFixed(2),
        amtOverdue151to180: overdueArr[5].toFixed(2),
        amtOverdue181plus: overdueArr[6].toFixed(2),
        creditCollateralIndicator: hasCollateral ? "101" : "102",
        securityType: collType ? (securityTypeMap[collType] || "Q") : null,
        natureOfCharge: hasCollateral ? pick(["A", "B"]) : null,
        securityValue: hasCollateral ? (origAmount * (1.1 + Math.random() * 0.5)).toFixed(2) : null,
        jointOrSoleAccount: Math.random() < 0.9 ? "S" : "J",
        noParticipantsInAccount: 1,
        arrearsStartDate: daysArrears > 0 ? pastDate(1) : null,
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
  const paymentStatuses: Array<"on_time" | "late" | "missed" | "partial"> = ["on_time", "on_time", "on_time", "on_time", "on_time", "on_time", "on_time", "on_time", "on_time", "on_time", "on_time", "on_time", "late", "late", "missed", "partial"];

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

  const inquiryPurposes: Array<"new_credit" | "review" | "collection" | "regulatory" | "portfolio_monitoring"> = ["new_credit", "new_credit", "new_credit", "review", "review", "collection", "regulatory", "portfolio_monitoring"];
  const inquiryInstitutions = [
    "GCB Bank", "Fidelity Bank Ghana", "Ecobank Ghana", "CalBank", "Stanbic Bank Ghana",
    "Republic Bank Ghana", "Société Générale Ghana", "Agricultural Development Bank",
    "National Investment Bank", "FBNBank Ghana", "First National Bank Ghana",
    "OmniBSIC Bank", "Bank of Africa Ghana"
  ];
  const inquiryValues: any[] = [];
  const inquirySample = createdBorrowers.sort(() => Math.random() - 0.5).slice(0, Math.min(40, createdBorrowers.length));
  for (const b of inquirySample) {
    const numInquiries = randInt(1, 3);
    for (let q = 0; q < numInquiries; q++) {
      inquiryValues.push({
        borrowerId: b.id,
        inquiredBy: adminUser.id,
        purpose: pick(inquiryPurposes),
        institution: pick(inquiryInstitutions),
        consentProvided: Math.random() > 0.05,
      });
    }
  }
  for (let i = 0; i < inquiryValues.length; i += BATCH_SIZE) {
    await db.insert(creditInquiries).values(inquiryValues.slice(i, i + BATCH_SIZE));
  }
  console.log(`  Created ${inquiryValues.length} credit inquiries`);

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
      organizationId: b.organizationId,
      country: "GH",
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
      organizationId: b.organizationId,
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
      courtLocation: pick(ghanaCitiesUnique),
      courtType: pick(["High Court", "Circuit Court", "District Court", "Commercial Court"]),
      caseFilingDate: pastDate(4),
      bogCaseType: pick(["A", "B", "C", "E"]),
      caseReason: pick(["F", "R", "R", "R", "O"]),
      judgmentCurrency: "GHS",
    });
  }
  if (judgmentValues.length > 0) {
    await db.insert(courtJudgments).values(judgmentValues);
    console.log(`  Created ${judgmentValues.length} court judgments`);
  }

  const chequeSample = createdBorrowers.sort(() => Math.random() - 0.5).slice(0, 6);
  const chequeValues: any[] = [];
  for (const b of chequeSample) {
    chequeValues.push({
      borrowerId: b.id,
      organizationId: b.organizationId,
      accountNumber: `GHA-CHQ-${randInt(2020, 2025)}-${padId(randInt(1, 99999))}`,
      chequeNumber: `${randInt(100000, 999999)}`,
      dateAccountOpened: pastDate(5),
      dateIssued: pastDate(1),
      dateBounced: pastDate(0),
      reasonReturnedCode: pick(["11", "11", "11", "12"]),
      currency: "GHS",
      chequeAmount: randDec(500, 50000),
    });
  }
  if (chequeValues.length > 0) {
    await db.insert(dishonouredCheques).values(chequeValues);
    console.log(`  Created ${chequeValues.length} dishonoured cheques`);
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

  const [rpCheck] = await db.select({ value: count() }).from(retentionPolicies).where(eq(retentionPolicies.country, "Ghana"));
  if (Number(rpCheck.value) < 8) {
    await db.delete(retentionPolicies).where(eq(retentionPolicies.country, "Ghana"));
    await db.insert(retentionPolicies).values([
      { country: "Ghana", entityType: "borrower", retentionYears: 7, archiveAfterYears: 10, description: "Borrower personal data retained for 7 years per Bank of Ghana Data Protection Directive. Archived after 10 years.", isActive: true },
      { country: "Ghana", entityType: "credit_account", retentionYears: 7, archiveAfterYears: 10, description: "Credit account records retained for 7 years from account closure per BoG CRB v1.1 Section 4.2.", isActive: true },
      { country: "Ghana", entityType: "court_judgment", retentionYears: 10, archiveAfterYears: 15, description: "Court judgment records retained for 10 years per Ghana Courts Act, 1993 (Act 459). Archived after 15 years.", isActive: true },
      { country: "Ghana", entityType: "dispute", retentionYears: 5, archiveAfterYears: 8, description: "Dispute records retained for 5 years from resolution per Data Protection Act, 2012 (Act 843).", isActive: true },
      { country: "Ghana", entityType: "audit_log", retentionYears: 10, archiveAfterYears: 15, description: "Audit trail logs retained for 10 years per BoG Cybersecurity Directive for Financial Institutions.", isActive: true },
      { country: "Ghana", entityType: "consent_record", retentionYears: 7, archiveAfterYears: 10, description: "Borrower consent records retained for 7 years per Data Protection Act, 2012 (Act 843) Section 17.", isActive: true },
      { country: "Ghana", entityType: "credit_inquiry", retentionYears: 3, archiveAfterYears: 5, description: "Credit inquiry logs retained for 3 years per BoG CRB v1.1 reporting requirements.", isActive: true },
      { country: "Ghana", entityType: "dishonoured_cheque", retentionYears: 7, archiveAfterYears: 10, description: "Dishonoured cheque records retained for 7 years per Bills of Exchange Act, 1961 (Act 55).", isActive: true },
    ]);
    console.log("  Created 8 Ghana retention policies");
  }

  // ── Nigeria retention policies (CBN Credit Reporting Regulation 2017 — 5-year retention) ──
  const [rpNgCheck] = await db.select({ value: count() }).from(retentionPolicies).where(eq(retentionPolicies.country, "Nigeria"));
  if (Number(rpNgCheck.value) < 6) {
    await db.delete(retentionPolicies).where(eq(retentionPolicies.country, "Nigeria"));
    await db.insert(retentionPolicies).values([
      { country: "Nigeria", entityType: "borrower", retentionYears: 5, archiveAfterYears: 7, description: "Borrower data retained 5 years per CBN Credit Reporting Regulation 2017, Section 12.", isActive: true },
      { country: "Nigeria", entityType: "credit_account", retentionYears: 5, archiveAfterYears: 7, description: "Credit account records retained 5 years from closure per CBN CRR 2017, Section 12.", isActive: true },
      { country: "Nigeria", entityType: "court_judgment", retentionYears: 7, archiveAfterYears: 10, description: "Court judgment records retained 7 years per Sheriffs and Civil Process Act (Cap S6 LFN 2004).", isActive: true },
      { country: "Nigeria", entityType: "dispute", retentionYears: 5, archiveAfterYears: 7, description: "Dispute records retained 5 years per Nigeria Data Protection Act 2023 (NDPA).", isActive: true },
      { country: "Nigeria", entityType: "audit_log", retentionYears: 7, archiveAfterYears: 10, description: "Audit trail logs retained 7 years per CBN Cybersecurity Framework 2022.", isActive: true },
      { country: "Nigeria", entityType: "credit_inquiry", retentionYears: 2, archiveAfterYears: 5, description: "Credit inquiry logs retained 2 years per CBN CRR 2017, Section 12(3).", isActive: true },
    ]);
    console.log("  Created 6 Nigeria retention policies");
  }

  // ── Kenya retention policies (CBK CRB Regulations 2020 — 5-year retention) ──
  const [rpKeCheck] = await db.select({ value: count() }).from(retentionPolicies).where(eq(retentionPolicies.country, "Kenya"));
  if (Number(rpKeCheck.value) < 6) {
    await db.delete(retentionPolicies).where(eq(retentionPolicies.country, "Kenya"));
    await db.insert(retentionPolicies).values([
      { country: "Kenya", entityType: "borrower", retentionYears: 5, archiveAfterYears: 7, description: "Borrower data retained 5 years per CBK Credit Reference Bureau Regulations 2020, Regulation 14.", isActive: true },
      { country: "Kenya", entityType: "credit_account", retentionYears: 5, archiveAfterYears: 7, description: "Credit account records retained 5 years from closure per CBK CRB Regulations 2020.", isActive: true },
      { country: "Kenya", entityType: "court_judgment", retentionYears: 7, archiveAfterYears: 10, description: "Court judgment records retained 7 years per Civil Procedure Act (Cap 21 Laws of Kenya).", isActive: true },
      { country: "Kenya", entityType: "dispute", retentionYears: 5, archiveAfterYears: 7, description: "Dispute records retained 5 years per Kenya Data Protection Act 2019.", isActive: true },
      { country: "Kenya", entityType: "audit_log", retentionYears: 7, archiveAfterYears: 10, description: "Audit trail logs retained 7 years per CBK Prudential Guidelines on IT Risk Management.", isActive: true },
      { country: "Kenya", entityType: "credit_inquiry", retentionYears: 2, archiveAfterYears: 5, description: "Credit inquiry logs retained 2 years per CBK CRB Regulations 2020, Regulation 14(2).", isActive: true },
    ]);
    console.log("  Created 6 Kenya retention policies");
  }

  // ── Sierra Leone retention policies (BSL Credit Reference Act 2011 — 7-year retention) ──
  const [rpSlCheck] = await db.select({ value: count() }).from(retentionPolicies).where(eq(retentionPolicies.country, "Sierra Leone"));
  if (Number(rpSlCheck.value) < 5) {
    await db.delete(retentionPolicies).where(eq(retentionPolicies.country, "Sierra Leone"));
    await db.insert(retentionPolicies).values([
      { country: "Sierra Leone", entityType: "borrower", retentionYears: 7, archiveAfterYears: 10, description: "Borrower data retained 7 years per Bank of Sierra Leone Credit Reference Act 2011, Section 19.", isActive: true },
      { country: "Sierra Leone", entityType: "credit_account", retentionYears: 7, archiveAfterYears: 10, description: "Credit account records retained 7 years per BSL Credit Reference Act 2011.", isActive: true },
      { country: "Sierra Leone", entityType: "court_judgment", retentionYears: 10, archiveAfterYears: 15, description: "Court judgment records retained 10 years per Sierra Leone Courts Act.", isActive: true },
      { country: "Sierra Leone", entityType: "dispute", retentionYears: 5, archiveAfterYears: 8, description: "Dispute records retained 5 years per BSL Consumer Protection Guidelines.", isActive: true },
      { country: "Sierra Leone", entityType: "audit_log", retentionYears: 7, archiveAfterYears: 10, description: "Audit trail retained 7 years per BSL Financial Institutions (Anti-Money Laundering) Guidelines.", isActive: true },
    ]);
    console.log("  Created 5 Sierra Leone retention policies");
  }

  // ── Côte d'Ivoire retention policies (BCEAO Instruction 004-2022 — 5-year retention) ──
  const [rpCiCheck] = await db.select({ value: count() }).from(retentionPolicies).where(eq(retentionPolicies.country, "Côte d'Ivoire"));
  if (Number(rpCiCheck.value) < 5) {
    await db.delete(retentionPolicies).where(eq(retentionPolicies.country, "Côte d'Ivoire"));
    await db.insert(retentionPolicies).values([
      { country: "Côte d'Ivoire", entityType: "borrower", retentionYears: 5, archiveAfterYears: 7, description: "Données emprunteur conservées 5 ans selon l'Instruction BCEAO 004-2022 relative aux bureaux d'information sur le crédit.", isActive: true },
      { country: "Côte d'Ivoire", entityType: "credit_account", retentionYears: 5, archiveAfterYears: 7, description: "Dossiers de crédit conservés 5 ans à compter de la clôture per BCEAO Instruction 004-2022, Article 18.", isActive: true },
      { country: "Côte d'Ivoire", entityType: "court_judgment", retentionYears: 7, archiveAfterYears: 10, description: "Jugements judiciaires conservés 7 ans per Code de Procédure Civile OHADA.", isActive: true },
      { country: "Côte d'Ivoire", entityType: "dispute", retentionYears: 5, archiveAfterYears: 7, description: "Dossiers de litiges conservés 5 ans per Loi ivoirienne sur la protection des données personnelles 2013.", isActive: true },
      { country: "Côte d'Ivoire", entityType: "audit_log", retentionYears: 5, archiveAfterYears: 7, description: "Journaux d'audit conservés 5 ans per Directive BCEAO sur la cybersécurité des institutions financières.", isActive: true },
    ]);
    console.log("  Created 5 Côte d'Ivoire retention policies");
  }

  // ── Multi-country seed: Nigeria borrowers + credit accounts (CBN jurisdiction) ──
  const [ngBorrowerCheck] = await db.select({ value: count() }).from(borrowers).where(eq(borrowers.country, "Nigeria"));
  if (Number(ngBorrowerCheck.value) < 8) {
    const ngBanks = ["Access Bank Nigeria", "Zenith Bank Nigeria", "GTBank", "First Bank Nigeria", "UBA Nigeria", "Stanbic IBTC", "FCMB", "Sterling Bank"];
    const ngFirstNames = ["Emeka", "Chidi", "Babatunde", "Adaeze", "Ngozi", "Ifeanyi", "Olumide", "Chisom", "Tunde", "Amaka", "Uche", "Seun", "Dele", "Funmi"];
    const ngLastNames = ["Okafor", "Nwosu", "Adeyemi", "Chukwu", "Eze", "Okonkwo", "Adeleke", "Igwe", "Adesanya", "Nwachukwu", "Bello", "Abubakar", "Musa", "Ibrahim"];
    const ngCompanies = ["Lagos Cement Works Ltd", "Abuja Agro Processing Co.", "Kano Textiles Group", "Port Harcourt Oil Services Ltd", "Ibadan Foodstuffs Ltd", "Kaduna Steel Industries"];
    const ngAcctStatuses: Array<"current"|"delinquent"|"default"|"closed"|"restructured"|"written_off"> = ["current","current","current","current","delinquent","default","closed","restructured"];
    const ngNgBorrowers = [];
    for (let i = 0; i < 12; i++) {
      const isCorp = i >= 9;
      const firstName = isCorp ? "" : pick(ngFirstNames);
      const lastName = isCorp ? "" : pick(ngLastNames);
      const companyName = isCorp ? pick(ngCompanies) : undefined;
      const [b] = await db.insert(borrowers).values({
        firstName: isCorp ? null : firstName,
        lastName: isCorp ? null : lastName,
        companyName: isCorp ? companyName : null,
        type: isCorp ? "corporate" : "individual",
        nationalId: `NG${randInt(10000000, 99999999)}`,
        dateOfBirth: isCorp ? null : pastDate(40),
        country: "Nigeria",
        city: pick(["Lagos", "Abuja", "Kano", "Ibadan", "Port Harcourt", "Kaduna", "Benin City"]),
        address: `${randInt(1, 200)} ${pick(["Broad Street", "Marina", "Victoria Island", "Maitama", "Wuse II", "Ikoyi Road", "Eko Road"])}`,
        phone: `+2348${randInt(10000000, 99999999)}`,
        email: isCorp ? `info@${companyName?.toLowerCase().replace(/\s+/g, "").slice(0, 12)}.ng` : `${firstName.toLowerCase()}.${lastName.toLowerCase()}@email.ng`,
        sector: pick(["Banking", "Oil & Gas", "Agriculture", "Manufacturing", "Trade", "Services"]),
      }).returning();
      ngNgBorrowers.push(b);
    }
    for (const b of ngNgBorrowers) {
      const numAccts = randInt(1, 3);
      for (let a = 0; a < numAccts; a++) {
        const origAmt = randInt(500000, 50000000);
        const status = pick(ngAcctStatuses);
        const currentBal = status === "closed" ? 0 : randInt(0, origAmt);
        await db.insert(creditAccounts).values({
          borrowerId: b.id,
          lenderInstitution: pick(ngBanks),
          accountNumber: `NG${randInt(1000000000, 9999999999)}`,
          accountType: pick(["Personal Loan", "Business Loan", "Trade Finance", "Overdraft", "Mortgage", "SME Loan"]),
          originalAmount: String(origAmt),
          currentBalance: String(currentBal),
          currency: "NGN",
          status,
          daysInArrears: status === "current" || status === "closed" ? 0 : randInt(15, 180),
          disbursementDate: pastDate(5),
          maturityDate: futureDate(3),
          reportingDate: new Date().toISOString().split("T")[0],
        }).onConflictDoNothing();
      }
    }
    console.log("  Created 12 Nigeria borrowers with accounts");
  }

  // ── Multi-country seed: Kenya borrowers + credit accounts (CBK jurisdiction) ──
  const [keBorrowerCheck] = await db.select({ value: count() }).from(borrowers).where(eq(borrowers.country, "Kenya"));
  if (Number(keBorrowerCheck.value) < 8) {
    const keBanks = ["KCB Bank Kenya", "Equity Bank Kenya", "Cooperative Bank", "NCBA Bank Kenya", "Absa Bank Kenya", "Standard Chartered Kenya", "DTB Kenya", "I&M Bank Kenya"];
    const keFirstNames = ["Wanjiku", "Kamau", "Otieno", "Achieng", "Mwangi", "Njoki", "Odhiambo", "Wanjiru", "Kipchoge", "Chebet", "Mutua", "Muthoni"];
    const keLastNames = ["Kariuki", "Odhiambo", "Waweru", "Onyango", "Mwangi", "Auma", "Kiplagat", "Ndungu", "Gitau", "Mugo", "Nyambura", "Kiptoo"];
    const keCompanies = ["Nairobi Tea Brokers Ltd", "Mombasa Freight Services", "Kisumu Agribusiness Ltd", "Nakuru Dairy Coop", "Eldoret Grain Millers Ltd"];
    const keStatuses: Array<"current"|"delinquent"|"default"|"closed"|"restructured"|"written_off"> = ["current","current","current","current","current","delinquent","closed","restructured"];
    const keBorrowersCreated = [];
    for (let i = 0; i < 10; i++) {
      const isCorp = i >= 8;
      const firstName = isCorp ? "" : pick(keFirstNames);
      const lastName = isCorp ? "" : pick(keLastNames);
      const companyName = isCorp ? pick(keCompanies) : undefined;
      const [b] = await db.insert(borrowers).values({
        firstName: isCorp ? null : firstName,
        lastName: isCorp ? null : lastName,
        companyName: isCorp ? companyName : null,
        type: isCorp ? "corporate" : "individual",
        nationalId: `KE${randInt(10000000, 99999999)}`,
        dateOfBirth: isCorp ? null : pastDate(35),
        country: "Kenya",
        city: pick(["Nairobi", "Mombasa", "Kisumu", "Nakuru", "Eldoret", "Thika", "Malindi"]),
        address: `${randInt(1, 100)} ${pick(["Kenyatta Avenue", "Moi Avenue", "Tom Mboya Street", "Haile Selassie Avenue", "Oginga Odinga Road"])}`,
        phone: `+2547${randInt(10000000, 99999999)}`,
        email: isCorp ? `contact@${companyName?.toLowerCase().replace(/\s+/g, "").slice(0, 12)}.co.ke` : `${firstName.toLowerCase()}.${lastName.toLowerCase()}@email.co.ke`,
        sector: pick(["Banking", "Agriculture", "Tourism", "Technology", "Manufacturing", "Retail"]),
      }).returning();
      keBorrowersCreated.push(b);
    }
    for (const b of keBorrowersCreated) {
      const numAccts = randInt(1, 3);
      for (let a = 0; a < numAccts; a++) {
        const origAmt = randInt(50000, 5000000);
        const status = pick(keStatuses);
        const currentBal = status === "closed" ? 0 : randInt(0, origAmt);
        await db.insert(creditAccounts).values({
          borrowerId: b.id,
          lenderInstitution: pick(keBanks),
          accountNumber: `KE${randInt(1000000000, 9999999999)}`,
          accountType: pick(["Personal Loan", "Business Loan", "Agricultural Loan", "Mortgage", "Overdraft", "SME Loan"]),
          originalAmount: String(origAmt),
          currentBalance: String(currentBal),
          currency: "KES",
          status,
          daysInArrears: status === "current" || status === "closed" ? 0 : randInt(10, 120),
          disbursementDate: pastDate(4),
          maturityDate: futureDate(3),
          reportingDate: new Date().toISOString().split("T")[0],
        }).onConflictDoNothing();
      }
    }
    console.log("  Created 10 Kenya borrowers with accounts");
  }

  // ── Multi-country seed: Sierra Leone borrowers + credit accounts (BSL jurisdiction) ──
  const [slBorrowerCheck] = await db.select({ value: count() }).from(borrowers).where(eq(borrowers.country, "Sierra Leone"));
  if (Number(slBorrowerCheck.value) < 5) {
    const slBanks = ["Rokel Commercial Bank", "Sierra Leone Commercial Bank", "United Bank for Africa SL", "Guaranty Trust Bank SL", "Access Bank SL"];
    const slFirstNames = ["Aminata", "Mohamed", "Fatmata", "Ibrahim", "Isatu", "Foday", "Mariama", "Alimamy", "Hawa", "Sorie"];
    const slLastNames = ["Kamara", "Conteh", "Bangura", "Sesay", "Koroma", "Turay", "Mansaray", "Fofanah", "Kargbo", "Bah"];
    const slStatuses: Array<"current"|"delinquent"|"default"|"closed"|"restructured"> = ["current","current","current","delinquent","closed"];
    const slBorrowersCreated = [];
    for (let i = 0; i < 8; i++) {
      const isCorp = i >= 7;
      const firstName = isCorp ? "" : pick(slFirstNames);
      const lastName = isCorp ? "" : pick(slLastNames);
      const [b] = await db.insert(borrowers).values({
        firstName: isCorp ? null : firstName,
        lastName: isCorp ? null : lastName,
        companyName: isCorp ? "Freetown Trading & Exports Ltd" : null,
        type: isCorp ? "corporate" : "individual",
        nationalId: `SL${randInt(1000000, 9999999)}`,
        dateOfBirth: isCorp ? null : pastDate(30),
        country: "Sierra Leone",
        city: pick(["Freetown", "Bo", "Kenema", "Makeni", "Koidu"]),
        address: `${randInt(1, 50)} ${pick(["Siaka Stevens Street", "Lumley Beach Road", "Wilkinson Road", "Aberdeen Road"])}`,
        phone: `+23276${randInt(100000, 999999)}`,
        email: `${firstName.toLowerCase() || "info"}.${lastName.toLowerCase() || "ftradingsl"}@email.sl`,
        sector: pick(["Mining", "Agriculture", "Trade", "Services", "Fisheries"]),
      }).returning();
      slBorrowersCreated.push(b);
    }
    for (const b of slBorrowersCreated) {
      const origAmt = randInt(5000000, 200000000);
      const status = pick(slStatuses);
      await db.insert(creditAccounts).values({
        borrowerId: b.id,
        lenderInstitution: pick(slBanks),
        accountNumber: `SL${randInt(100000000, 999999999)}`,
        accountType: pick(["Personal Loan", "Business Loan", "Agricultural Loan", "Microfinance Loan"]),
        originalAmount: String(origAmt),
        currentBalance: String(status === "closed" ? 0 : randInt(0, origAmt)),
        currency: "SLL",
        status,
        daysInArrears: status === "current" || status === "closed" ? 0 : randInt(15, 90),
        disbursementDate: pastDate(3),
        maturityDate: futureDate(2),
        reportingDate: new Date().toISOString().split("T")[0],
      }).onConflictDoNothing();
    }
    console.log("  Created 8 Sierra Leone borrowers with accounts");
  }

  // ── Multi-country seed: Côte d'Ivoire borrowers + credit accounts (BCEAO/CI jurisdiction) ──
  const [ciBorrowerCheck] = await db.select({ value: count() }).from(borrowers).where(eq(borrowers.country, "Côte d'Ivoire"));
  if (Number(ciBorrowerCheck.value) < 5) {
    const ciBanks = ["Société Générale Côte d'Ivoire", "NSIA Banque CI", "Ecobank Côte d'Ivoire", "Banque Atlantique CI", "Bridge Bank Group", "Coris Bank CI"];
    const ciFirstNames = ["Kouassi", "Aya", "Koffi", "Adjoua", "Yao", "Akissi", "Konan", "Affoue", "Brou", "Amenan"];
    const ciLastNames = ["Kouadio", "Bamba", "Traoré", "Koné", "Coulibaly", "Diallo", "Touré", "Ouattara", "Gbagbo", "Soro"];
    const ciStatuses: Array<"current"|"delinquent"|"default"|"closed"|"restructured"> = ["current","current","current","current","delinquent"];
    const ciBorrowersCreated = [];
    for (let i = 0; i < 8; i++) {
      const isCorp = i >= 6;
      const firstName = isCorp ? "" : pick(ciFirstNames);
      const lastName = isCorp ? "" : pick(ciLastNames);
      const companyName = isCorp ? (i === 6 ? "Abidjan Cacao Exportateurs SARL" : "Groupe Industriel Ivoirien SA") : undefined;
      const [b] = await db.insert(borrowers).values({
        firstName: isCorp ? null : firstName,
        lastName: isCorp ? null : lastName,
        companyName: isCorp ? companyName : null,
        type: isCorp ? "corporate" : "individual",
        nationalId: `CI${randInt(1000000, 9999999)}`,
        dateOfBirth: isCorp ? null : pastDate(35),
        country: "Côte d'Ivoire",
        city: pick(["Abidjan", "Bouaké", "Daloa", "Yamoussoukro", "San-Pédro", "Korhogo"]),
        address: `${randInt(1, 100)} ${pick(["Boulevard de la République", "Avenue Houphouët-Boigny", "Rue du Commerce", "Avenue Chardy"])}`,
        phone: `+2250${pick(["7","5","1"])}${randInt(1000000, 9999999)}`,
        email: isCorp ? `contact@${companyName?.toLowerCase().replace(/[\s']/g, "").slice(0, 12)}.ci` : `${firstName.toLowerCase()}.${lastName.toLowerCase()}@email.ci`,
        sector: pick(["Cocoa", "Agriculture", "Trade", "Manufacturing", "Services", "Finance"]),
      }).returning();
      ciBorrowersCreated.push(b);
    }
    for (const b of ciBorrowersCreated) {
      const numAccts = randInt(1, 2);
      for (let a = 0; a < numAccts; a++) {
        const origAmt = randInt(1000000, 100000000);
        const status = pick(ciStatuses);
        await db.insert(creditAccounts).values({
          borrowerId: b.id,
          lenderInstitution: pick(ciBanks),
          accountNumber: `CI${randInt(100000000, 999999999)}`,
          accountType: pick(["Personal Loan", "Business Loan", "Trade Finance", "Agricultural Loan", "Microfinance Loan"]),
          originalAmount: String(origAmt),
          currentBalance: String(status === "closed" ? 0 : randInt(0, origAmt)),
          currency: "XOF",
          status,
          daysInArrears: status === "current" || status === "closed" ? 0 : randInt(10, 90),
          disbursementDate: pastDate(4),
          maturityDate: futureDate(3),
          reportingDate: new Date().toISOString().split("T")[0],
        }).onConflictDoNothing();
      }
    }
    console.log("  Created 8 Côte d'Ivoire borrowers with accounts");
  }

  const [acCheck] = await db.select({ value: count() }).from(apiConfigurations).where(eq(apiConfigurations.country, "Ghana"));
  if (Number(acCheck.value) < 5) {
    await db.delete(apiConfigurations).where(eq(apiConfigurations.country, "Ghana"));
    await db.insert(apiConfigurations).values([
      { name: "Bank of Ghana CRB Reporting", category: "regulatory", baseUrl: "https://api.bog.gov.gh/crb/v1.1", apiKeyHeaderName: "X-BoG-API-Key", authType: "api_key", country: "Ghana", isActive: true, description: "Bank of Ghana Credit Reference Bureau regulatory reporting API for submitting CONC, BUSC, CONJ, BUSJ, COND, BUSD files." },
      { name: "Ghana Revenue Authority", category: "tax", baseUrl: "https://api.gra.gov.gh/taxpayer/v2", apiKeyHeaderName: "Authorization", authType: "bearer", country: "Ghana", isActive: true, description: "GRA Taxpayer Identification Number verification service for borrower KYC compliance." },
      { name: "National Identification Authority", category: "identity", baseUrl: "https://api.nia.gov.gh/ghanacard/v1", apiKeyHeaderName: "X-NIA-Key", authType: "api_key", country: "Ghana", isActive: true, description: "Ghana Card identity verification and biometric validation API for borrower registration." },
      { name: "SSNIT Verification", category: "social_security", baseUrl: "https://api.ssnit.org.gh/verify/v1", apiKeyHeaderName: "Authorization", authType: "bearer", country: "Ghana", isActive: false, description: "Social Security and National Insurance Trust member verification service (integration pending)." },
      { name: "Open Exchange Rates", category: "exchange_rates", baseUrl: "https://open.er-api.com/v6", apiKeyHeaderName: "X-API-Key", authType: "none", country: "Ghana", isActive: true, description: "Live exchange rate feed for GHS/USD/EUR/GBP currency conversion in credit account valuations." },
    ]);
    console.log("  Created 5 API configurations");
  }

  console.log("Ghana seed data complete!");
}
