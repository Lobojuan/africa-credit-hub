import { db } from "./db";
import { borrowers, creditAccounts, courtJudgments, dishonouredCheques, organizations, institutions, consentRecords, paymentHistory } from "@shared/schema";
import { count, eq, sql } from "drizzle-orm";
import { mapInternalStatusToBsl, mapInternalAssetClassToBsl, mapDaysInArrearsToPaymentProfileBsl } from "@shared/bsl-codes";

const slFirstNamesMale = [
  "Mohamed", "Ibrahim", "Alhaji", "Abu", "Alpha", "Brima", "Daniel", "Emmanuel",
  "Francis", "Hassan", "Joseph", "Karim", "Lansana", "Musa", "Osman", "Patrick",
  "Samuel", "Thomas", "Victor", "Yusuf", "Abdul", "Abubakar", "Amara", "Bockarie",
  "Dauda", "Foday", "Gibril", "Idrissa", "Komba", "Momoh", "Sheku", "Sulaiman",
  "Tamba", "Umaru", "Wusu", "Alimamy", "Bai", "Chernor", "Sorie", "Santigie",
  "Alie", "Bobson", "Christian", "David", "Edward", "George", "John", "Peter",
];

const slFirstNamesFemale = [
  "Fatmata", "Aminata", "Isata", "Mariama", "Hawa", "Kadiatu", "Adama", "Bintu",
  "Comfort", "Dorcas", "Finda", "Gbessay", "Jenneh", "Kumba", "Lucy", "Marie",
  "Nancy", "Ramatu", "Salamatu", "Tenneh", "Yeabu", "Zainab", "Agnes", "Betty",
  "Catherine", "Diana", "Elizabeth", "Florence", "Grace", "Hannah", "Juliana",
  "Margaret", "Patricia", "Rose", "Sarah", "Victoria", "Watta", "Yei", "Umu",
  "Sia", "Memuna", "Marai", "Khadija", "Aissatou", "Mabinty", "Rugiatu",
];

const slLastNames = [
  "Bangura", "Kamara", "Sesay", "Koroma", "Conteh", "Kanu", "Turay", "Mansaray",
  "Jalloh", "Kabba", "Kargbo", "Tarawally", "Dumbuya", "Fofanah", "Kallon",
  "Bah", "Sawaneh", "Yillah", "Sillah", "Gbla", "Bai", "Sheriff", "Kabba",
  "Massaquoi", "Cole", "Williams", "Thomas", "Johnson", "Roberts", "Campbell",
  "Koroma", "Lebbie", "Marah", "Sannoh", "Sankoh", "Lahai", "Moriba", "Lamin",
  "Kabbah", "Margai", "Stevens", "Momoh", "Bio", "Jusu", "Ndomahina",
];

const slCompanies = [
  "Freetown Maritime Services Ltd", "Bo Agribusiness Holdings", "Kenema Mining Corp",
  "Makeni Trading Company", "Koidu Diamond Exports", "Lunsar Iron Works Ltd",
  "Bonthe Fishing Co Ltd", "Port Loko Rice Mills", "Kailahun Cocoa Processing",
  "Kambia Cross-Border Trading", "Moyamba Palm Oil Ltd", "Pujehun Timber Exports",
  "Tonkolili Resources Ltd", "Kono Minerals Ltd", "Bombali Agricultural Coop",
  "Western Area Logistics Ltd", "Freetown Digital Solutions", "Sierra Cement Works",
  "Lumley Beach Hotels Ltd", "Hill Station Properties", "Aberdeen Retail Group",
  "Salone Pharmaceuticals Ltd", "Waterloo Industrial Estate", "Mile 91 Transport Co",
  "Kabala Highlands Coffee Ltd",
];

const slEmployers = [
  "Bank of Sierra Leone", "Sierra Leone Commercial Bank", "Rokel Commercial Bank",
  "Union Trust Bank", "Guaranty Trust Bank SL", "Zenith Bank SL", "Access Bank SL",
  "EcoBank Sierra Leone", "Standard Chartered SL", "United Bank for Africa SL",
  "SierraTel", "Africell SL", "Orange SL", "QCell SL",
  "Sierra Rutile Ltd", "Koidu Holdings", "Marampa Mines",
  "National Revenue Authority", "Ministry of Finance", "Ministry of Education",
  "Freetown City Council", "Sierra Leone Police", "Republic of Sierra Leone Armed Forces",
  "University of Sierra Leone", "Njala University", "Eastern Polytechnic",
  "Sierra Leone Ports Authority", "Sierra Leone Road Safety Authority",
  "National Social Security and Insurance Trust (NASSIT)",
  "Anti-Corruption Commission", "Audit Service Sierra Leone",
  "Sierra Leone Water Company (GVWC)", "EDSA (Electricity Distribution)",
];

const slOccupations = [
  "Accountant", "Bank Teller", "Branch Manager", "Civil Servant", "Diamond Dealer",
  "Doctor", "Driver", "Electrician", "Engineer", "Farmer", "Fisherman",
  "Government Official", "IT Specialist", "Journalist", "Lawyer", "Lecturer",
  "Market Trader", "Mechanic", "Mining Engineer", "Nurse", "Pharmacist",
  "Police Officer", "Quantity Surveyor", "School Teacher", "Software Developer",
  "Surgeon", "Taxi Driver", "Telecommunication Engineer", "University Professor",
  "Artisanal Miner", "Customs Officer", "Hotel Manager", "NGO Worker",
];

const slStreets = [
  "Siaka Stevens Street", "Wilberforce Street", "Kissy Road", "Lumley Beach Road",
  "Hill Station Road", "Aberdeen Road", "Pademba Road", "Rawdon Street",
  "Lightfoot Boston Street", "Garrison Street", "Circular Road", "Spur Road",
  "Main Motor Road", "Regent Road", "Leicester Road", "Tower Hill",
  "Charlotte Street", "Howe Street", "Percival Street", "Westmoreland Street",
  "Fort Street", "Guard Street", "East Street", "Fourah Bay Road",
  "Campbell Street", "Sanders Street", "Walpole Street", "Bathurst Street",
];

const slCities = [
  "Freetown", "Freetown", "Freetown", "Freetown", "Freetown", "Freetown",
  "Freetown", "Freetown", "Freetown", "Freetown", "Freetown", "Freetown",
  "Freetown", "Freetown", "Freetown",
  "Bo", "Bo", "Bo", "Bo", "Bo",
  "Kenema", "Kenema", "Kenema", "Kenema",
  "Makeni", "Makeni", "Makeni",
  "Koidu", "Koidu",
  "Lunsar", "Port Loko", "Bonthe", "Kabala", "Kailahun",
  "Kambia", "Moyamba", "Waterloo", "Mile 91", "Magburaka",
];

const slRegions = [
  "Western Area Urban", "Western Area Rural", "Northern", "Southern", "Eastern", "North West",
];

const slBanks = [
  "Sierra Leone Commercial Bank", "Rokel Commercial Bank", "Union Trust Bank",
  "Guaranty Trust Bank SL",
];

const slCourts = [
  "High Court of Sierra Leone, Freetown", "Magistrate Court Freetown",
  "Commercial Division Freetown", "High Court Bo", "Magistrate Court Kenema",
  "High Court Makeni", "District Court Koidu", "High Court Bonthe",
  "Labour Court Freetown", "Customary Court Freetown",
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

function generateNCRAId(): string {
  const year = randInt(1960, 2005);
  const digits = String(randInt(100000, 999999));
  return `NCRA-${year}-${digits}`;
}

function generateNIN(): string {
  const digits = String(randInt(1000000000, 9999999999));
  return `NIN${digits}`;
}

function generateNASSITNumber(): string {
  return `NASSIT-${randInt(10000, 99999)}-${randInt(100, 999)}`;
}

const facilityTypeCodes = ["101", "102", "107", "109", "115", "118", "119", "121", "122", "126", "129", "130"];
const repaymentCodes = ["10", "12", "13", "15", "16", "18"];
const purposeCodes = ["A", "B", "C", "E", "F", "G", "L", "P", "S", "M"];
const assetClassifications = ["A", "A", "A", "A", "A", "A", "B", "C", "D", "E"];
const accountStatuses: Array<"current" | "delinquent" | "default" | "closed" | "restructured" | "written_off"> = [
  "current", "current", "current", "current", "current", "current", "current",
  "delinquent", "delinquent", "default", "closed", "restructured", "written_off",
];
const maritalStatuses = ["S", "M", "M", "M", "D", "W"];
const employmentTypes = ["101", "101", "101", "104", "104", "102", "103", "106"];
const securityTypes = ["A", "D", "E", "G", "L", "Q", "R"];
const sectorCodes = ["10", "20", "30", "40", "60", "70", "80"];
const businessTypes = ["A", "B", "C", "D", "F", "G"];

export async function seedSierraLeoneData() {
  const [existing] = await db.select({ count: count() }).from(borrowers).where(eq(borrowers.country, "Sierra Leone"));
  if (existing.count >= 50) {
    console.log(`Sierra Leone data already seeded (${existing.count} borrowers). Skipping.`);
    return;
  }

  console.log("Seeding Sierra Leone data...");

  const slOrgs = [
    { name: "Bank of Sierra Leone", slug: "bsl-regulator", type: "regulator" as const, country: "Sierra Leone", contactEmail: "info@bsl.gov.sl", status: "active" as const, subscriptionTier: "enterprise" },
    { name: "Sierra Leone Commercial Bank", slug: "slcb", type: "bank" as const, country: "Sierra Leone", contactEmail: "info@slcb.sl", status: "active" as const, subscriptionTier: "professional" },
    { name: "Rokel Commercial Bank", slug: "rokel-bank", type: "bank" as const, country: "Sierra Leone", contactEmail: "info@rokelbank.sl", status: "active" as const, subscriptionTier: "professional" },
    { name: "Union Trust Bank", slug: "utb-sl", type: "bank" as const, country: "Sierra Leone", contactEmail: "info@utb.sl", status: "active" as const, subscriptionTier: "standard" },
  ];

  const orgIds: string[] = [];
  for (const org of slOrgs) {
    const [inserted] = await db.insert(organizations).values(org).onConflictDoNothing().returning({ id: organizations.id });
    if (inserted) {
      orgIds.push(inserted.id);
    } else {
      const [found] = await db.select({ id: organizations.id }).from(organizations).where(eq(organizations.slug, org.slug));
      if (found) {
        orgIds.push(found.id);
        await db.execute(sql`UPDATE organizations SET country = 'Sierra Leone' WHERE id = ${found.id} AND country != 'Sierra Leone'`);
      }
    }
  }

  for (let i = 0; i < slOrgs.length; i++) {
    await db.insert(institutions).values({
      name: slOrgs[i].name,
      type: slOrgs[i].type,
      registrationNumber: `BSL-${String(i).padStart(4, "0")}`,
      country: "Sierra Leone",
      contactEmail: slOrgs[i].contactEmail,
      status: "active",
      submissionFrequency: i === 0 ? "quarterly" : "monthly",
      organizationId: orgIds[i],
    }).onConflictDoNothing();
  }

  const borrowerIds: string[] = [];
  const individualBorrowerIds: string[] = [];
  const corporateBorrowerIds: string[] = [];
  const numIndividuals = 55;
  const numCorporates = 15;

  for (let i = 0; i < numIndividuals; i++) {
    const isFemale = Math.random() > 0.52;
    const firstName = isFemale ? pick(slFirstNamesFemale) : pick(slFirstNamesMale);
    const lastName = pick(slLastNames);
    const city = pick(slCities);
    const region = pick(slRegions);
    const orgId = pick(orgIds.slice(1));
    const ncraId = generateNCRAId();
    const nin = generateNIN();

    const [b] = await db.insert(borrowers).values({
      type: "individual",
      firstName,
      lastName,
      nationalId: ncraId,
      ghanaCardNumber: ncraId,
      tinNumber: `TIN-SL-${randInt(100000, 999999)}`,
      dateOfBirth: pastDate(50),
      gender: isFemale ? "Female" : "Male",
      phone: `+232-${randInt(70, 99)}-${randInt(100000, 999999)}`,
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${pick(["gmail.com", "yahoo.com", "outlook.com", "saloneemail.sl"])}`,
      address: `${randInt(1, 200)} ${pick(slStreets)}`,
      country: "Sierra Leone",
      city,
      region,
      employerName: pick(slEmployers),
      occupation: pick(slOccupations),
      maritalStatus: pick(maritalStatuses),
      employmentTypeCode: pick(employmentTypes),
      nationality: "Sierra Leonean",
      monthlyIncome: randDec(500, 15000),
      incomeCurrency: "SLE",
      votersId: nin,
      ssnitNumber: generateNASSITNumber(),
      driversLicense: Math.random() > 0.6 ? `DL-SL-${randInt(10000, 99999)}` : null,
      passportNumber: Math.random() > 0.7 ? `SL${String.fromCharCode(65 + randInt(0, 25))}${randInt(100000, 999999)}` : null,
      numberOfDependants: randInt(0, 8),
      ownerOrTenant: pick(["O", "T", "F"]),
      organizationId: orgId,
      middleNames: Math.random() > 0.5 ? pick(isFemale ? slFirstNamesFemale : slFirstNamesMale) : null,
      title: isFemale ? pick(["Mrs", "Ms", "Miss"]) : pick(["Mr", "Alhaji"]),
      postalCode: "",
      homeTelephone: Math.random() > 0.5 ? `+232-22-${randInt(200000, 299999)}` : null,
      workTelephone: Math.random() > 0.6 ? `+232-22-${randInt(300000, 399999)}` : null,
      dateOfEmployment: pastDate(15),
      employerAddress: `${pick(slStreets)}, ${city}`,
      sector: pick(["Agriculture", "Mining", "Services", "Trade", "Government", "Banking", "Fishing"]),
      proofOfAddressType: pick(["WAT", "ELE", "BNK", "TEN"]),
    }).returning({ id: borrowers.id });

    borrowerIds.push(b.id);
    individualBorrowerIds.push(b.id);
  }

  for (let i = 0; i < numCorporates; i++) {
    const companyName = slCompanies[i % slCompanies.length];
    const city = pick(slCities);
    const orgId = pick(orgIds.slice(1));

    const [b] = await db.insert(borrowers).values({
      type: "corporate",
      companyName,
      nationalId: `SL-BRN-${String(i + 1).padStart(6, "0")}`,
      tinNumber: `TIN-SL-C-${randInt(100000, 999999)}`,
      phone: `+232-${randInt(22, 33)}-${randInt(200000, 999999)}`,
      email: `info@${companyName.toLowerCase().replace(/[\s&.,']+/g, "").substring(0, 12)}.sl`,
      address: `${randInt(1, 100)} ${pick(slStreets)}`,
      country: "Sierra Leone",
      city,
      region: pick(slRegions),
      businessRegNumber: `OARG-${randInt(1000, 9999)}-${randInt(2015, 2025)}`,
      businessTypeCode: pick(businessTypes),
      sectorIndustryCode: pick(sectorCodes),
      subSectorCode: pick(["101", "201", "301", "401", "601", "801"]),
      turnoverAmount: randDec(50000, 5000000),
      turnoverCurrency: "SLE",
      registrationDate: pastDate(15),
      commencementDate: pastDate(12),
      organizationId: orgId,
    }).returning({ id: borrowers.id });

    borrowerIds.push(b.id);
    corporateBorrowerIds.push(b.id);
  }

  const allAccountBorrowerIds = [...individualBorrowerIds, ...corporateBorrowerIds];
  const creditAccountIds: string[] = [];
  const targetAccounts = 120;

  for (let i = 0; i < targetAccounts; i++) {
    const bId = pick(allAccountBorrowerIds);
    const isIndividual = individualBorrowerIds.includes(bId);
    const status = pick(accountStatuses);
    const daysInArrears = status === "current" ? 0 : status === "delinquent" ? randInt(1, 90) : status === "default" ? randInt(91, 360) : 0;
    const originalAmount = randDec(500, 500000);
    const currentBalance = status === "closed" ? "0" : randDec(0, parseFloat(originalAmount));
    const interestRate = randDec(8, 35);
    const disbDate = pastDate(5);
    const matDate = futureDate(5);
    const orgId = pick(orgIds.slice(1));
    const lenderName = pick(slBanks);
    const facilityCode = isIndividual
      ? pick(facilityTypeCodes)
      : pick(["101", "103", "110", "111", "121", "126", "199"]);

    const [acc] = await db.insert(creditAccounts).values({
      borrowerId: bId,
      lenderInstitution: lenderName,
      accountNumber: `SL-${String(i + 1).padStart(8, "0")}`,
      accountType: isIndividual ? "personal_loan" : "business_loan",
      originalAmount,
      currentBalance,
      currency: "SLE",
      interestRate,
      disbursementDate: disbDate,
      maturityDate: status === "closed" ? pastDate(1) : matDate,
      status,
      daysInArrears,
      facilityTypeCode: facilityCode,
      purposeOfFacility: pick(purposeCodes),
      repaymentFrequency: pick(repaymentCodes),
      assetClassification: pick(assetClassifications),
      amountOverdue: daysInArrears > 0 ? randDec(100, 50000) : "0",
      disbursementAmount: originalAmount,
      scheduledInstallmentAmount: randDec(50, parseFloat(originalAmount) / 12),
      facilityTerm: randInt(6, 60),
      paymentHistoryProfile: mapDaysInArrearsToPaymentProfileBsl(daysInArrears),
      bogAccountStatus: mapInternalStatusToBsl(status),
      bogAssetClassification: mapInternalAssetClassToBsl(pick(assetClassifications)),
      lastPaymentDate: status !== "closed" ? pastDate(1) : null,
      lastPaymentAmount: status !== "closed" ? randDec(50, 5000) : null,
      currentBalanceIndicator: "D",
      legalFlag: "101",
      creditCollateralIndicator: Math.random() > 0.4 ? "101" : "102",
      securityType: Math.random() > 0.4 ? pick(securityTypes) : null,
      jointOrSoleAccount: "S",
      noParticipantsInAccount: 1,
      closureReason: status === "closed" ? pick(["D", "F"]) : null,
      writtenOffDate: status === "written_off" ? pastDate(2) : null,
      writtenOffAmount: status === "written_off" ? currentBalance : null,
      organizationId: orgId,
    }).returning({ id: creditAccounts.id });

    creditAccountIds.push(acc.id);

    if (Math.random() > 0.5) {
      const numPayments = randInt(1, 6);
      for (let p = 0; p < numPayments; p++) {
        const pDate = new Date();
        pDate.setMonth(pDate.getMonth() - p);
        const period = `${pDate.getFullYear()}-${String(pDate.getMonth() + 1).padStart(2, "0")}`;
        const amountDue = randDec(50, 5000);
        const payStatus = daysInArrears > 30 && p === 0 ? "late" as const : "on_time" as const;
        await db.insert(paymentHistory).values({
          creditAccountId: acc.id,
          period,
          amountDue,
          amountPaid: payStatus === "on_time" ? amountDue : randDec(0, parseFloat(amountDue)),
          status: payStatus,
          daysLate: payStatus === "late" ? randInt(1, 90) : 0,
        });
      }
    }
  }

  const numJudgments = 8;
  for (let i = 0; i < numJudgments; i++) {
    const isConsumer = Math.random() > 0.3;
    const bId = isConsumer ? pick(individualBorrowerIds) : pick(corporateBorrowerIds);
    const orgId = pick(orgIds.slice(1));

    await db.insert(courtJudgments).values({
      borrowerId: bId,
      caseNumber: `SL-HC-${randInt(2020, 2026)}/${randInt(100, 999)}`,
      court: pick(slCourts),
      judgmentType: pick(["civil_judgment", "lien", "bankruptcy"]),
      amount: randDec(5000, 500000),
      currency: "SLE",
      judgmentDate: pastDate(3),
      status: pick(["active", "resolved"]),
      description: `Judgment for debt recovery - ${pick(slBanks)}`,
      courtLocation: pick(["Freetown", "Bo", "Kenema", "Makeni"]),
      courtType: pick(["High Court", "Magistrate Court", "Commercial Court"]),
      caseFilingDate: pastDate(4),
      bogCaseType: pick(["A", "C"]),
      caseReason: pick(["R", "F", "O"]),
      judgmentCurrency: "SLE",
      organizationId: orgId,
    });
  }

  const numCheques = 6;
  for (let i = 0; i < numCheques; i++) {
    const isConsumer = Math.random() > 0.3;
    const bId = isConsumer ? pick(individualBorrowerIds) : pick(corporateBorrowerIds);
    const orgId = pick(orgIds.slice(1));

    await db.insert(dishonouredCheques).values({
      borrowerId: bId,
      accountNumber: `SL-CHQ-${randInt(10000, 99999)}`,
      chequeNumber: `${randInt(100000, 999999)}`,
      dateAccountOpened: pastDate(5),
      dateIssued: pastDate(1),
      dateBounced: pastDate(1),
      reasonReturnedCode: pick(["11", "12", "13", "14"]),
      currency: "SLE",
      chequeAmount: randDec(500, 100000),
      organizationId: orgId,
    });
  }

  for (let i = 0; i < 20; i++) {
    const bId = pick(individualBorrowerIds);
    await db.insert(consentRecords).values({
      borrowerId: bId,
      grantedTo: pick(slBanks),
      purpose: pick(["Credit Assessment", "Account Review", "New Facility"]),
      consentType: "credit_check",
      status: "active",
      receiptNumber: `SL-CON-${randInt(10000, 99999)}`,
    });
  }

  console.log(`Sierra Leone seed complete: ${numIndividuals} individuals, ${numCorporates} corporates, ${targetAccounts} accounts, ${numJudgments} judgments, ${numCheques} cheques`);
}
