import { db } from "./db";
import { borrowers, creditAccounts, courtJudgments, consentRecords, paymentHistory, institutions, billingRecords, disputes, users } from "@shared/schema";
import { count } from "drizzle-orm";

const ghanaFirstNames = ["Kwame", "Ama", "Kofi", "Akua", "Kwesi", "Abena", "Yaw", "Efua", "Kojo", "Adwoa", "Nana", "Afia", "Kwaku", "Adjoa"];
const ghanaLastNames = ["Mensah", "Asante", "Boateng", "Osei", "Annan", "Agyeman", "Appiah", "Frimpong", "Darko", "Addai", "Owusu", "Acheampong"];
const ethiopiaFirstNames = ["Tsegaye", "Birtukan", "Dereje", "Meseret", "Tadesse", "Hiwot", "Fikru", "Seble", "Berhanu", "Tigist", "Dawit", "Alem", "Getachew", "Mulu"];
const ethiopiaLastNames = ["Haile", "Alemu", "Wolde", "Tesfaye", "Gebremedhin", "Dagne", "Admasu", "Mulugeta", "Assefa", "Teshome", "Girma", "Mekonnen"];
const ugandaFirstNames = ["Ssemakula", "Nakato", "Mugisha", "Apio", "Okello", "Nalubega", "Byaruhanga", "Atim", "Mubiru", "Nambi", "Kagwa", "Akello"];
const ugandaLastNames = ["Nsamba", "Lubega", "Kato", "Tumusiime", "Otim", "Namutebi", "Ssentamu", "Babirye", "Mukasa", "Kabanda", "Nakabugo", "Wamala"];
const liberiaFirstNames = ["Emmanuel", "Comfort", "Joseph", "Lorpu", "Charles", "Mardea", "James", "Tenneh", "George", "Hawa", "Samuel", "Fatu"];
const liberiaLastNames = ["Johnson", "Weah", "Sirleaf", "Kollie", "Konneh", "Barkue", "Flomo", "Gaye", "Dennis", "Nimely", "Boakai", "Taylor"];

const ghanaCompanies = ["Kumasi Breweries Ltd", "Accra Textiles S.A.", "Gold Coast Logistics Ltd", "Ashanti Agribusiness Co.", "Volta River Foods Ltd", "Cape Coast Fishing Co."];
const ethiopiaCompanies = ["Addis Industrial Group S.C.", "Hawassa Agro-Processing PLC", "Dire Dawa Trading S.C.", "Blue Nile Cement PLC", "Bahir Dar Textiles S.C.", "Jimma Coffee Export PLC"];
const ugandaCompanies = ["Kampala Motors Ltd", "Jinja Steel Works Ltd", "Entebbe Aviation Services Ltd", "Mbarara Dairy Cooperative", "Gulu Agricultural Supplies Ltd", "Fort Portal Tourism Holdings"];
const liberiaCompanies = ["Monrovia Trade Hub Inc.", "Buchanan Timber Exports LLC", "Roberts International Logistics", "Harper Marine Services Co.", "Greenville Rubber Industries", "Kakata Palm Oil Processors"];

const sectors = ["Agriculture", "Manufacturing", "Services", "Construction", "Mining", "Technology", "Healthcare", "Education", "Transportation", "Finance", "Energy", "Retail", "Tourism", "Telecommunications"];
const occupations = ["Engineer", "Teacher", "Doctor", "Accountant", "Lawyer", "Trader", "Farmer", "Nurse", "Architect", "IT Specialist", "Civil Servant", "Banker", "Pharmacist", "Consultant"];
const accountTypes = ["Personal Loan", "Mortgage", "Vehicle Loan", "Business Loan", "Overdraft", "Credit Card", "Agricultural Loan", "Trade Finance", "Microfinance Loan", "Working Capital"];
const collateralTypes = ["Property", "Real Estate", "Vehicle", "Equipment & Machinery", "Inventory", "Accounts Receivable", "Land Title", "Government Securities", "Cash Deposit", null];
const genders = ["Male", "Female"];

const countryConfig: Record<string, { currency: string; idPrefix: string; cities: string[]; regions: string[]; banks: string[]; phones: string }> = {
  Ghana: {
    currency: "GHS", idPrefix: "GHA", cities: ["Accra", "Kumasi", "Tamale", "Takoradi", "Cape Coast", "Sunyani", "Ho", "Koforidua"],
    regions: ["Greater Accra", "Ashanti", "Northern", "Western", "Central", "Bono", "Volta", "Eastern"],
    banks: ["GCB Bank", "Ecobank Ghana", "Fidelity Bank Ghana", "CalBank", "Stanbic Bank Ghana"], phones: "+233"
  },
  Ethiopia: {
    currency: "ETB", idPrefix: "ETH", cities: ["Addis Ababa", "Dire Dawa", "Hawassa", "Bahir Dar", "Jimma", "Mekelle", "Adama", "Gondar"],
    regions: ["Addis Ababa", "Oromia", "Amhara", "SNNPR", "Tigray", "Dire Dawa", "Sidama", "Harari"],
    banks: ["Commercial Bank of Ethiopia", "Dashen Bank", "Awash International Bank", "Bank of Abyssinia", "Nib International Bank"], phones: "+251"
  },
  Uganda: {
    currency: "UGX", idPrefix: "UGA", cities: ["Kampala", "Jinja", "Gulu", "Mbarara", "Entebbe", "Fort Portal", "Lira", "Mbale"],
    regions: ["Central", "Eastern", "Northern", "Western", "Kampala", "Wakiso", "Mukono", "Jinja"],
    banks: ["Stanbic Bank Uganda", "DFCU Bank", "Centenary Bank", "Bank of Uganda", "Equity Bank Uganda"], phones: "+256"
  },
  Liberia: {
    currency: "LRD", idPrefix: "LBR", cities: ["Monrovia", "Buchanan", "Gbarnga", "Kakata", "Harper", "Greenville", "Voinjama", "Robertsport"],
    regions: ["Montserrado", "Grand Bassa", "Bong", "Margibi", "Maryland", "Sinoe", "Lofa", "Grand Cape Mount"],
    banks: ["LBDI", "Ecobank Liberia", "GT Bank Liberia", "Access Bank Liberia", "United Bank for Africa Liberia"], phones: "+231"
  },
};

function pick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }
function randInt(min: number, max: number): number { return Math.floor(Math.random() * (max - min + 1)) + min; }
function randDec(min: number, max: number): string { return (Math.random() * (max - min) + min).toFixed(2); }
function pastDate(yearsBack: number): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() - randInt(0, yearsBack));
  d.setMonth(randInt(0, 11));
  d.setDate(randInt(1, 28));
  return d.toISOString().split("T")[0];
}
function futureDate(yearsAhead: number): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() + randInt(1, yearsAhead));
  d.setMonth(randInt(0, 11));
  d.setDate(randInt(1, 28));
  return d.toISOString().split("T")[0];
}
function padId(n: number): string { return String(n).padStart(5, "0"); }

const countryFirstNames: Record<string, string[]> = { Ghana: ghanaFirstNames, Ethiopia: ethiopiaFirstNames, Uganda: ugandaFirstNames, Liberia: liberiaFirstNames };
const countryLastNames: Record<string, string[]> = { Ghana: ghanaLastNames, Ethiopia: ethiopiaLastNames, Uganda: ugandaLastNames, Liberia: liberiaLastNames };
const countryCompanies: Record<string, string[]> = { Ghana: ghanaCompanies, Ethiopia: ethiopiaCompanies, Uganda: ugandaCompanies, Liberia: liberiaCompanies };

export async function seedTestData() {
  const [existingBorrowers] = await db.select({ value: count() }).from(borrowers);
  if (existingBorrowers.value > 20) {
    console.log(`Already have ${existingBorrowers.value} borrowers, skipping test data seed`);
    return;
  }

  const [adminUser] = await db.select().from(users).limit(1);
  if (!adminUser) {
    console.log("No users found — run main seed first");
    return;
  }

  console.log("Seeding ~100 test borrowers with credit accounts, disputes, judgments, consent, payments, institutions, and billing...");

  const countries = ["Ghana", "Ethiopia", "Uganda", "Liberia"];
  const allBorrowerValues: any[] = [];
  let idCounter = 30000;
  const usedCompanies = new Set<string>();

  for (const country of countries) {
    const cfg = countryConfig[country];
    const firstNames = countryFirstNames[country];
    const lastNames = countryLastNames[country];
    const companies = countryCompanies[country];

    for (let i = 0; i < 18; i++) {
      const cityIdx = i % cfg.cities.length;
      const gender = pick(genders);
      const fn = pick(firstNames);
      const ln = pick(lastNames);
      idCounter++;
      allBorrowerValues.push({
        type: "individual" as const,
        firstName: fn,
        lastName: ln,
        nationalId: `${cfg.idPrefix}-ID-${padId(idCounter)}`,
        tinNumber: `TIN-${cfg.idPrefix}-${padId(idCounter)}`,
        dateOfBirth: pastDate(40),
        gender,
        phone: `${cfg.phones}${randInt(700000000, 999999999)}`,
        email: `${fn.toLowerCase()}.${ln.toLowerCase()}${randInt(1, 99)}@mail.com`,
        address: `${randInt(1, 200)} ${pick(["Main St", "Market Rd", "Independence Ave", "Liberation Blvd", "Commerce Lane", "Unity Drive"])}`,
        city: cfg.cities[cityIdx],
        region: cfg.regions[cityIdx],
        employerName: `${pick(["National", "Regional", "City", "Central", "Metro"])} ${pick(["Bank", "Hospital", "School", "Office", "Corp"])}`,
        occupation: pick(occupations),
        sector: pick(sectors),
        isPep: Math.random() < 0.08,
        pepDetails: Math.random() < 0.08 ? `${pick(["Member of Parliament", "Senior Government Official", "Central Bank Board", "State Enterprise Director"])} - ${country}` : null,
      });
    }

    for (let i = 0; i < 7; i++) {
      let companyName = pick(companies);
      while (usedCompanies.has(companyName)) {
        companyName = `${companyName} (${pick(["North", "South", "East", "West"])})`;
      }
      usedCompanies.add(companyName);
      const cityIdx = i % cfg.cities.length;
      idCounter++;
      allBorrowerValues.push({
        type: "corporate" as const,
        companyName,
        nationalId: `${cfg.idPrefix}-BIZ-${padId(idCounter)}`,
        tinNumber: `TIN-${cfg.idPrefix}-C-${padId(idCounter)}`,
        phone: `${cfg.phones}${randInt(200000000, 599999999)}`,
        email: `info@${companyName.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 15)}.com`,
        address: `${pick(["Industrial Zone", "Business District", "Commercial Area", "Free Trade Zone"])}, Plot ${randInt(1, 500)}`,
        city: cfg.cities[cityIdx],
        region: cfg.regions[cityIdx],
        businessRegNumber: `BR-${cfg.idPrefix}-${randInt(2005, 2024)}-${padId(randInt(1, 9999))}`,
        sector: pick(sectors),
        isPep: false,
      });
    }
  }

  const createdBorrowers = await db.insert(borrowers).values(allBorrowerValues).returning();
  console.log(`  Created ${createdBorrowers.length} borrowers`);

  const allAccountValues: any[] = [];
  const statuses: Array<"current" | "delinquent" | "default" | "closed" | "restructured" | "written_off"> = ["current", "current", "current", "current", "delinquent", "default", "closed", "restructured", "written_off"];

  for (const b of createdBorrowers) {
    const numAccounts = randInt(1, 3);
    const country = countries.find(c => b.nationalId.startsWith(countryConfig[c].idPrefix)) || "Ethiopia";
    const cfg = countryConfig[country];

    for (let a = 0; a < numAccounts; a++) {
      const status = pick(statuses);
      const isCorporate = b.type === "corporate";
      const amountMultiplier = isCorporate ? randInt(50, 500) : randInt(1, 50);
      const original = (amountMultiplier * 10000).toString() + ".00";
      const balRatio = status === "closed" ? 0 : Math.random() * 0.8 + 0.1;
      const current = (amountMultiplier * 10000 * balRatio).toFixed(2);
      const useForeignCurrency = Math.random() < 0.15;
      const currency = useForeignCurrency ? pick(["USD", "EUR", "GBP"]) : cfg.currency;
      const disbDate = pastDate(5);
      const matDate = futureDate(5);

      allAccountValues.push({
        borrowerId: b.id,
        lenderInstitution: pick(cfg.banks),
        accountNumber: `${cfg.idPrefix.slice(0, 3)}-${pick(["LN", "OD", "CC", "ML", "TF"])}-${randInt(2020, 2025)}-${padId(randInt(1, 9999))}`,
        accountType: pick(accountTypes),
        originalAmount: original,
        currentBalance: current,
        currency,
        interestRate: randDec(5, 22),
        disbursementDate: disbDate,
        maturityDate: matDate,
        status,
        daysInArrears: status === "delinquent" ? randInt(30, 180) : status === "default" ? randInt(181, 720) : 0,
        collateralType: pick(collateralTypes),
        collateralValue: Math.random() > 0.3 ? (amountMultiplier * 10000 * (1 + Math.random())).toFixed(2) : null,
        lastPaymentDate: status !== "written_off" ? pastDate(1) : null,
        lastPaymentAmount: status !== "written_off" ? (amountMultiplier * 100 * (0.5 + Math.random())).toFixed(2) : null,
        restructureCount: status === "restructured" ? randInt(1, 3) : 0,
        writtenOffDate: status === "written_off" ? pastDate(1) : null,
      });
    }
  }

  const createdAccounts = await db.insert(creditAccounts).values(allAccountValues).returning();
  console.log(`  Created ${createdAccounts.length} credit accounts`);

  const paymentValues: any[] = [];
  const paymentStatuses: Array<"on_time" | "late" | "missed" | "partial"> = ["on_time", "on_time", "on_time", "on_time", "late", "missed", "partial"];
  for (const acc of createdAccounts.slice(0, 80)) {
    const numPayments = randInt(3, 8);
    for (let p = 0; p < numPayments; p++) {
      const d = new Date();
      d.setMonth(d.getMonth() - p - 1);
      const period = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const amountDue = randDec(500, 50000);
      const pStatus = pick(paymentStatuses);
      const paidRatio = pStatus === "on_time" ? 1 : pStatus === "partial" ? 0.4 + Math.random() * 0.5 : pStatus === "missed" ? 0 : 1;
      paymentValues.push({
        creditAccountId: acc.id,
        period,
        amountDue,
        amountPaid: (parseFloat(amountDue) * paidRatio).toFixed(2),
        status: pStatus,
        daysLate: pStatus === "late" ? randInt(1, 60) : pStatus === "missed" ? randInt(30, 90) : 0,
      });
    }
  }
  if (paymentValues.length > 0) {
    await db.insert(paymentHistory).values(paymentValues);
    console.log(`  Created ${paymentValues.length} payment history records`);
  }

  const disputeStatuses: Array<"open" | "under_review" | "resolved" | "rejected"> = ["open", "open", "under_review", "resolved", "rejected"];
  const disputeTypes = ["incorrect_balance", "wrong_account_status", "identity_theft", "duplicate_entry", "incorrect_personal_info", "unauthorized_inquiry"];
  const disputeValues: any[] = [];
  for (let d = 0; d < 25; d++) {
    const b = pick(createdBorrowers);
    const accts = createdAccounts.filter(a => a.borrowerId === b.id);
    const status = pick(disputeStatuses);
    const now = new Date();
    const slaDeadline = new Date(now);
    slaDeadline.setDate(slaDeadline.getDate() + randInt(-5, 25));
    disputeValues.push({
      borrowerId: b.id,
      creditAccountId: accts.length > 0 ? pick(accts).id : null,
      filedBy: adminUser.id,
      disputeType: pick(disputeTypes),
      description: pick([
        "The balance shown does not match my bank statement records",
        "This account was closed but still shows as active",
        "I did not open this account — possible identity theft",
        "This appears to be a duplicate entry from another institution",
        "My personal information including name and address is incorrect",
        "I did not authorize this credit inquiry",
        "Payment history shows missed payments that were actually made on time",
        "The collateral value is significantly understated",
        "Account was restructured but status was not updated",
        "Interest rate shown is different from what was agreed",
      ]),
      status,
      resolution: status === "resolved" ? pick(["Corrected as per borrower evidence", "Verified and updated in system", "Removed duplicate entry", "Updated account status"]) : null,
      slaDeadline,
    });
  }
  await db.insert(disputes).values(disputeValues);
  console.log(`  Created ${disputeValues.length} disputes`);

  const judgmentTypes: Array<"lien" | "bankruptcy" | "lawsuit" | "civil_judgment" | "criminal_conviction"> = ["lien", "bankruptcy", "lawsuit", "civil_judgment", "criminal_conviction"];
  const judgmentStatuses: Array<"active" | "resolved" | "appealed"> = ["active", "active", "resolved", "appealed"];
  const judgmentValues: any[] = [];
  const courts: Record<string, string[]> = {
    Ghana: ["High Court of Accra", "Circuit Court Kumasi", "Supreme Court of Ghana", "Commercial Division Accra"],
    Ethiopia: ["Federal High Court Addis Ababa", "Oromia Regional Court", "Federal Supreme Court", "Commercial Bench Addis Ababa"],
    Uganda: ["High Court of Kampala", "Chief Magistrates Court Jinja", "Supreme Court of Uganda", "Commercial Court Kampala"],
    Liberia: ["Circuit Court Montserrado", "Supreme Court of Liberia", "Commercial Court Monrovia", "Debt Court Monrovia"],
  };
  for (let j = 0; j < 15; j++) {
    const b = pick(createdBorrowers);
    const country = countries.find(c => b.nationalId.startsWith(countryConfig[c].idPrefix)) || "Ethiopia";
    const cfg = countryConfig[country];
    judgmentValues.push({
      borrowerId: b.id,
      caseNumber: `${country.slice(0, 2).toUpperCase()}-${randInt(2020, 2025)}-CV-${padId(randInt(1, 9999))}`,
      court: pick(courts[country]),
      judgmentType: pick(judgmentTypes),
      amount: randDec(5000, 500000),
      currency: cfg.currency,
      judgmentDate: pastDate(3),
      status: pick(judgmentStatuses),
      description: pick([
        "Failure to repay commercial loan",
        "Breach of contract — supply agreement",
        "Lien placed on commercial property",
        "Bankruptcy filing — voluntary",
        "Default on mortgage obligation",
        "Tax lien — unpaid corporate taxes",
        "Civil judgment — unpaid invoices",
      ]),
    });
  }
  await db.insert(courtJudgments).values(judgmentValues);
  console.log(`  Created ${judgmentValues.length} court judgments`);

  const consentValues: any[] = [];
  let receiptCounter = 50000;
  for (const b of createdBorrowers.slice(0, 60)) {
    const country = countries.find(c => b.nationalId.startsWith(countryConfig[c].idPrefix)) || "Ethiopia";
    const cfg = countryConfig[country];
    receiptCounter++;
    consentValues.push({
      borrowerId: b.id,
      grantedTo: pick(cfg.banks),
      purpose: pick(["Credit Report Access", "Data Sharing", "Portfolio Monitoring", "Collection Activities", "New Credit Application"]),
      consentType: pick(["explicit", "implied", "blanket"]),
      status: Math.random() < 0.85 ? "active" as const : "revoked" as const,
      receiptNumber: `CR-${cfg.idPrefix}-${receiptCounter}`,
    });
  }
  await db.insert(consentRecords).values(consentValues);
  console.log(`  Created ${consentValues.length} consent records`);

  const institutionTypes = ["Commercial Bank", "Microfinance Institution", "Development Bank", "Savings & Credit Cooperative", "Insurance Company"];
  const instValues: any[] = [];
  const instStatuses: Array<"pending" | "active" | "suspended"> = ["active", "active", "active", "pending", "suspended"];
  for (const country of countries) {
    const cfg = countryConfig[country];
    for (const bank of cfg.banks) {
      instValues.push({
        name: bank,
        type: pick(institutionTypes),
        registrationNumber: `REG-${cfg.idPrefix}-${padId(randInt(1000, 9999))}`,
        country,
        contactEmail: `compliance@${bank.toLowerCase().replace(/[^a-z0-9]/g, "")}.com`,
        contactPhone: `${cfg.phones}${randInt(100000000, 999999999)}`,
        address: `${pick(cfg.cities)}, ${pick(cfg.regions)}`,
        status: pick(instStatuses),
        submissionFrequency: pick(["monthly", "quarterly", "weekly"]),
      });
    }
  }
  await db.insert(institutions).values(instValues);
  console.log(`  Created ${instValues.length} institutions`);

  const billingValues: any[] = [];
  const serviceTypes = ["Credit Report", "Bulk Data Submission", "API Access", "Dispute Resolution", "Annual Subscription"];
  const billingStatuses: Array<"pending" | "paid" | "overdue"> = ["paid", "paid", "paid", "pending", "overdue"];
  let invoiceCounter = 10000;
  for (const country of countries) {
    const cfg = countryConfig[country];
    for (const bank of cfg.banks) {
      for (let m = 0; m < 3; m++) {
        invoiceCounter++;
        const d = new Date();
        d.setMonth(d.getMonth() - m);
        const periodStart = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
        const endMonth = new Date(d);
        endMonth.setMonth(endMonth.getMonth() + 1);
        endMonth.setDate(0);
        const periodEnd = endMonth.toISOString().split("T")[0];
        billingValues.push({
          institutionName: bank,
          serviceType: pick(serviceTypes),
          amount: randDec(500, 25000),
          currency: cfg.currency,
          status: pick(billingStatuses),
          invoiceNumber: `INV-${cfg.idPrefix}-${invoiceCounter}`,
          periodStart,
          periodEnd,
        });
      }
    }
  }
  await db.insert(billingRecords).values(billingValues);
  console.log(`  Created ${billingValues.length} billing records`);

  console.log("Test data seeding complete!");
  console.log(`  Summary: ${createdBorrowers.length} borrowers, ${createdAccounts.length} credit accounts, ${paymentValues.length} payments, ${disputeValues.length} disputes, ${judgmentValues.length} judgments, ${consentValues.length} consents, ${instValues.length} institutions, ${billingValues.length} billing records`);
}
