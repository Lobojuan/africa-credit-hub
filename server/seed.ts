import { db, pool } from "./db";
import { users, borrowers, creditAccounts, creditInquiries, auditLogs } from "@shared/schema";
import { count } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { isGhanaMode } from "./country-mode";

export async function seedDatabase() {
  const [existing] = await db.select({ value: count() }).from(users);
  if (existing.value > 0) return;

  const hash = (pw: string) => bcrypt.hashSync(pw, 8);

  const ghanaMode = isGhanaMode();

  const isProduction = process.env.NODE_ENV === "production" || process.env.PRODUCTION_MODE === "true";
  if (!process.env.SEED_ADMIN_PASSWORD && isProduction) {
    throw new Error("SEED_ADMIN_PASSWORD must be set in production before seeding");
  }
  const seedPassword = process.env.SEED_ADMIN_PASSWORD || "admin0987";
  if (!process.env.SEED_ADMIN_PASSWORD) {
    console.warn("[Seed] WARNING: SEED_ADMIN_PASSWORD not set — using insecure default. Set SEED_ADMIN_PASSWORD for production.");
  }

  const [admin] = await db.insert(users).values([
    { username: "admin", password: hash(seedPassword), fullName: process.env.PLATFORM_ADMIN_NAME || "Platform Admin", email: process.env.PLATFORM_SUPPORT_EMAIL || "support@africacredithub.com", role: "super_admin", status: "active", institution: process.env.PLATFORM_COMPANY_NAME || "Africa Credit Hub" },
    { username: "platform_admin", password: hash(seedPassword), fullName: process.env.PLATFORM_CTO_NAME || "Platform CTO", email: process.env.PLATFORM_CTO_EMAIL || "cto@africacredithub.com", role: "super_admin", status: "active", institution: process.env.PLATFORM_COMPANY_NAME || "Africa Credit Hub" },
  ]).returning();

  const coreBorrowers = ghanaMode ? [
    {
      type: "individual" as const, firstName: "Kwame", lastName: "Mensah", nationalId: "GHA-ID-10001",
      tinNumber: "TIN-GHA-0001234", dateOfBirth: "1985-03-15", gender: "Male", phone: "+233244123456",
      email: "kwame.mensah@gmail.com", address: "Osu, Oxford Street",
      city: "Accra", region: "Greater Accra", country: "Ghana", employerName: "GCB Bank",
      occupation: "Senior Engineer", sector: "Banking",
    },
    {
      type: "individual" as const, firstName: "Ama", lastName: "Boateng", nationalId: "GHA-ID-10002",
      tinNumber: "TIN-GHA-0001235", dateOfBirth: "1990-07-22", gender: "Female", phone: "+233501234567",
      email: "ama.boateng@outlook.com", address: "Adum, Prempeh II Street",
      city: "Kumasi", region: "Ashanti", country: "Ghana", employerName: "MTN Ghana",
      occupation: "Marketing Manager", sector: "Telecommunications",
    },
    {
      type: "individual" as const, firstName: "Kofi", lastName: "Asante", nationalId: "GHA-ID-10003",
      tinNumber: "TIN-GHA-0001236", dateOfBirth: "1978-11-30", gender: "Male", phone: "+233209876543",
      email: "kofi.asante@yahoo.com", address: "Ridge, Independence Avenue",
      city: "Accra", region: "Greater Accra", country: "Ghana", employerName: "Ministry of Finance",
      occupation: "Financial Analyst", sector: "Government",
    },
    {
      type: "corporate" as const, companyName: "Kumasi Breweries Ltd", nationalId: "GHA-BIZ-20001",
      tinNumber: "TIN-GHA-C-0005001", phone: "+233302654321", email: "info@kumasibreweries.com.gh",
      address: "Asokwa Industrial Area", city: "Kumasi", region: "Ashanti", country: "Ghana",
      businessRegNumber: "BR-GHA-2009-0451", sector: "Manufacturing",
    },
    {
      type: "corporate" as const, companyName: "Gold Coast Logistics Ltd", nationalId: "GHA-BIZ-20002",
      tinNumber: "TIN-GHA-C-0005002", phone: "+233302112233", email: "info@goldcoastlogistics.com.gh",
      address: "Tema Port Area, Community 1", city: "Tema", region: "Greater Accra", country: "Ghana",
      businessRegNumber: "BR-GHA-2015-0112", sector: "Transportation",
    },
  ] : [
    {
      type: "individual" as const, firstName: "Abebe", lastName: "Tesfaye", nationalId: "ETH-ID-10001",
      tinNumber: "TIN-0001234", dateOfBirth: "1985-03-15", gender: "Male", phone: "+251911234567",
      email: "abebe.tesfaye@gmail.com", address: "Bole Sub-City, Woreda 03",
      city: "Addis Ababa", region: "Addis Ababa", employerName: "Ethiopian Airlines",
      occupation: "Senior Engineer", sector: "Aviation",
    },
    {
      type: "individual" as const, firstName: "Meron", lastName: "Desta", nationalId: "ETH-ID-10002",
      tinNumber: "TIN-0001235", dateOfBirth: "1990-07-22", gender: "Female", phone: "+251922345678",
      email: "meron.desta@outlook.com", address: "Kirkos Sub-City, Woreda 08",
      city: "Addis Ababa", region: "Addis Ababa", employerName: "Ethio Telecom",
      occupation: "Marketing Manager", sector: "Telecommunications",
    },
    {
      type: "individual" as const, firstName: "Solomon", lastName: "Kebede", nationalId: "ETH-ID-10003",
      tinNumber: "TIN-0001236", dateOfBirth: "1978-11-30", gender: "Male", phone: "+251933456789",
      email: "solomon.k@yahoo.com", address: "Arada Sub-City, Woreda 01",
      city: "Addis Ababa", region: "Addis Ababa", employerName: "Ministry of Finance",
      occupation: "Financial Analyst", sector: "Government",
    },
    {
      type: "corporate" as const, companyName: "Habesha Breweries S.C.", nationalId: "ETH-BIZ-20001",
      tinNumber: "TIN-0005001", phone: "+251115572000", email: "info@habeshabreweries.com",
      address: "Debre Berhan Industrial Zone", city: "Debre Berhan", region: "Amhara",
      businessRegNumber: "BR-2009-ETH-0451", sector: "Manufacturing",
    },
    {
      type: "corporate" as const, companyName: "Anbessa City Bus S.E.", nationalId: "ETH-BIZ-20002",
      tinNumber: "TIN-0005002", phone: "+251115518300", email: "anbessa@transport.gov.et",
      address: "Yeka Sub-City, Woreda 12", city: "Addis Ababa", region: "Addis Ababa",
      businessRegNumber: "BR-1998-ETH-0112", sector: "Transportation",
    },
  ];

  const createdBorrowers = await db.insert(borrowers).values(coreBorrowers).returning();

  const coreAccounts = ghanaMode ? [
    {
      borrowerId: createdBorrowers[0].id, lenderInstitution: "GCB Bank",
      accountNumber: "GCB-LN-2024-001", accountType: "Personal Loan",
      originalAmount: "50000.00", currentBalance: "35000.00", currency: "GHS",
      interestRate: "24.50", disbursementDate: "2024-01-15", maturityDate: "2027-01-15",
      status: "current" as const, daysInArrears: 0, collateralType: "Property",
      collateralValue: "120000.00", lastPaymentDate: "2026-02-01", lastPaymentAmount: "1850.00",
    },
    {
      borrowerId: createdBorrowers[0].id, lenderInstitution: "Ecobank Ghana",
      accountNumber: "ECO-LN-2023-089", accountType: "Vehicle Loan",
      originalAmount: "80000.00", currentBalance: "42000.00", currency: "GHS",
      interestRate: "26.00", disbursementDate: "2023-06-01", maturityDate: "2026-06-01",
      status: "current" as const, daysInArrears: 0, lastPaymentDate: "2026-02-10", lastPaymentAmount: "3200.00",
    },
    {
      borrowerId: createdBorrowers[1].id, lenderInstitution: "Fidelity Bank Ghana",
      accountNumber: "FBG-LN-2024-155", accountType: "Mortgage",
      originalAmount: "300000.00", currentBalance: "275000.00", currency: "GHS",
      interestRate: "22.00", disbursementDate: "2024-03-20", maturityDate: "2039-03-20",
      status: "current" as const, daysInArrears: 0, collateralType: "Real Estate",
      collateralValue: "500000.00", lastPaymentDate: "2026-02-15", lastPaymentAmount: "2800.00",
    },
    {
      borrowerId: createdBorrowers[2].id, lenderInstitution: "GCB Bank",
      accountNumber: "GCB-LN-2022-340", accountType: "Business Loan",
      originalAmount: "150000.00", currentBalance: "89000.00", currency: "GHS",
      interestRate: "25.50", disbursementDate: "2022-09-01", maturityDate: "2025-09-01",
      status: "delinquent" as const, daysInArrears: 45, lastPaymentDate: "2025-12-15", lastPaymentAmount: "4200.00",
    },
    {
      borrowerId: createdBorrowers[3].id, lenderInstitution: "CalBank",
      accountNumber: "CAL-LN-2023-200", accountType: "Corporate Loan",
      originalAmount: "2500000.00", currentBalance: "1850000.00", currency: "GHS",
      interestRate: "22.00", disbursementDate: "2023-01-10", maturityDate: "2028-01-10",
      status: "current" as const, daysInArrears: 0, collateralType: "Equipment & Machinery",
      collateralValue: "3500000.00", lastPaymentDate: "2026-02-05", lastPaymentAmount: "52000.00",
    },
    {
      borrowerId: createdBorrowers[4].id, lenderInstitution: "Stanbic Bank Ghana",
      accountNumber: "STB-LN-2021-078", accountType: "Fleet Financing",
      originalAmount: "500000.00", currentBalance: "120000.00", currency: "USD",
      interestRate: "9.50", disbursementDate: "2021-04-01", maturityDate: "2026-04-01",
      status: "current" as const, daysInArrears: 0, collateralType: "Vehicles",
      collateralValue: "700000.00", lastPaymentDate: "2026-02-12", lastPaymentAmount: "15000.00",
    },
  ] : [
    {
      borrowerId: createdBorrowers[0].id, lenderInstitution: "Commercial Bank of Ethiopia",
      accountNumber: "CBE-LN-2024-001", accountType: "Personal Loan",
      originalAmount: "500000.00", currentBalance: "350000.00", currency: "ETB",
      interestRate: "12.50", disbursementDate: "2024-01-15", maturityDate: "2027-01-15",
      status: "current" as const, daysInArrears: 0, collateralType: "Property",
      collateralValue: "1200000.00", lastPaymentDate: "2026-02-01", lastPaymentAmount: "18500.00",
    },
    {
      borrowerId: createdBorrowers[0].id, lenderInstitution: "Dashen Bank",
      accountNumber: "DB-LN-2023-089", accountType: "Vehicle Loan",
      originalAmount: "800000.00", currentBalance: "420000.00", currency: "ETB",
      interestRate: "14.00", disbursementDate: "2023-06-01", maturityDate: "2026-06-01",
      status: "current" as const, daysInArrears: 0, lastPaymentDate: "2026-02-10", lastPaymentAmount: "32000.00",
    },
    {
      borrowerId: createdBorrowers[1].id, lenderInstitution: "Awash International Bank",
      accountNumber: "AIB-LN-2024-155", accountType: "Mortgage",
      originalAmount: "3000000.00", currentBalance: "2750000.00", currency: "ETB",
      interestRate: "11.00", disbursementDate: "2024-03-20", maturityDate: "2039-03-20",
      status: "current" as const, daysInArrears: 0, collateralType: "Real Estate",
      collateralValue: "5000000.00", lastPaymentDate: "2026-02-15", lastPaymentAmount: "28000.00",
    },
    {
      borrowerId: createdBorrowers[2].id, lenderInstitution: "Commercial Bank of Ethiopia",
      accountNumber: "CBE-LN-2022-340", accountType: "Business Loan",
      originalAmount: "1500000.00", currentBalance: "890000.00", currency: "ETB",
      interestRate: "13.50", disbursementDate: "2022-09-01", maturityDate: "2025-09-01",
      status: "delinquent" as const, daysInArrears: 45, lastPaymentDate: "2025-12-15", lastPaymentAmount: "42000.00",
    },
    {
      borrowerId: createdBorrowers[3].id, lenderInstitution: "Dashen Bank",
      accountNumber: "DB-LN-2023-200", accountType: "Corporate Loan",
      originalAmount: "25000000.00", currentBalance: "18500000.00", currency: "ETB",
      interestRate: "10.00", disbursementDate: "2023-01-10", maturityDate: "2028-01-10",
      status: "current" as const, daysInArrears: 0, collateralType: "Equipment & Machinery",
      collateralValue: "35000000.00", lastPaymentDate: "2026-02-05", lastPaymentAmount: "520000.00",
    },
    {
      borrowerId: createdBorrowers[4].id, lenderInstitution: "Awash International Bank",
      accountNumber: "AIB-LN-2021-078", accountType: "Fleet Financing",
      originalAmount: "15000000.00", currentBalance: "3200000.00", currency: "USD",
      interestRate: "11.50", disbursementDate: "2021-04-01", maturityDate: "2026-04-01",
      status: "current" as const, daysInArrears: 0, collateralType: "Vehicles",
      collateralValue: "20000000.00", lastPaymentDate: "2026-02-12", lastPaymentAmount: "380000.00",
    },
  ];

  await db.insert(creditAccounts).values(coreAccounts);

  const coreInstitution = ghanaMode ? "GCB Bank" : "Commercial Bank of Ethiopia";
  const coreInstitution2 = ghanaMode ? "Fidelity Bank Ghana" : "Awash International Bank";
  const coreInstitution3 = ghanaMode ? "CalBank" : "Dashen Bank";

  await db.insert(creditInquiries).values([
    { borrowerId: createdBorrowers[0].id, inquiredBy: admin.id, purpose: "new_credit", institution: coreInstitution, consentProvided: true },
    { borrowerId: createdBorrowers[1].id, inquiredBy: admin.id, purpose: "review", institution: coreInstitution2, consentProvided: true },
    { borrowerId: createdBorrowers[2].id, inquiredBy: admin.id, purpose: "regulatory", institution: process.env.PLATFORM_COMPANY_NAME || "Africa Credit Hub", consentProvided: true },
    { borrowerId: createdBorrowers[3].id, inquiredBy: admin.id, purpose: "portfolio_monitoring", institution: coreInstitution3, consentProvided: true },
  ]);

  await db.insert(auditLogs).values([
    { userId: admin.id, action: "LOGIN", entity: "system", details: "Admin user logged in", ipAddress: "127.0.0.1" },
    { userId: admin.id, action: "SEARCH", entity: "borrower", details: `Searched for borrower: ${coreBorrowers[0].firstName} ${coreBorrowers[0].lastName}`, ipAddress: "127.0.0.1" },
    { userId: admin.id, action: "VIEW", entity: "credit_report", entityId: createdBorrowers[0].id, details: "Viewed credit report", ipAddress: "127.0.0.1" },
    { userId: admin.id, action: "CREATE", entity: "borrower", entityId: createdBorrowers[3].id, details: `Registered corporate borrower: ${coreBorrowers[3].companyName}`, ipAddress: "127.0.0.1" },
  ]);

  await seedPricingTiers();

  console.log("Database seeded successfully");

  try {
    const { seedTestData } = await import("./seed-test-data");
    await seedTestData();
  } catch (e) {
    console.error("Test data seed error:", e);
  }

}

async function seedPricingTiers() {
  const { rows } = await pool.query("SELECT count(*)::int AS c FROM pricing_tiers");
  if (rows[0].c > 0) return;

  const tiers: { name: string; eventType: string; minVolume: number; maxVolume: number | null; unitPriceCents: number; currency: string; country: string }[] = [
    { name: "Credit Report - Standard", eventType: "credit_report_pull", minVolume: 0, maxVolume: 100, unitPriceCents: 250, currency: "USD", country: "Global" },
    { name: "Credit Report - Volume", eventType: "credit_report_pull", minVolume: 101, maxVolume: 1000, unitPriceCents: 200, currency: "USD", country: "Global" },
    { name: "Credit Report - Enterprise", eventType: "credit_report_pull", minVolume: 1001, maxVolume: null, unitPriceCents: 150, currency: "USD", country: "Global" },
    { name: "API Call - Standard", eventType: "api_call", minVolume: 0, maxVolume: null, unitPriceCents: 100, currency: "USD", country: "Global" },
    { name: "Batch Upload - Standard", eventType: "batch_upload", minVolume: 0, maxVolume: 500, unitPriceCents: 50, currency: "USD", country: "Global" },
    { name: "Batch Upload - Volume", eventType: "batch_upload", minVolume: 501, maxVolume: 5000, unitPriceCents: 35, currency: "USD", country: "Global" },
    { name: "Batch Upload - Enterprise", eventType: "batch_upload", minVolume: 5001, maxVolume: null, unitPriceCents: 25, currency: "USD", country: "Global" },
    { name: "Dispute Filing - Standard", eventType: "dispute_filing", minVolume: 0, maxVolume: null, unitPriceCents: 500, currency: "USD", country: "Global" },
    { name: "Data Export - Standard", eventType: "data_export", minVolume: 0, maxVolume: null, unitPriceCents: 100, currency: "USD", country: "Global" },
    { name: "Cross Border Query - Standard", eventType: "cross_border_query", minVolume: 0, maxVolume: null, unitPriceCents: 150, currency: "USD", country: "Global" },

    { name: "Credit Report - Standard", eventType: "credit_report_pull", minVolume: 0, maxVolume: 100, unitPriceCents: 3294, currency: "GHS", country: "Ghana" },
    { name: "Credit Report - Volume", eventType: "credit_report_pull", minVolume: 101, maxVolume: 1000, unitPriceCents: 2635, currency: "GHS", country: "Ghana" },
    { name: "Credit Report - Enterprise", eventType: "credit_report_pull", minVolume: 1001, maxVolume: null, unitPriceCents: 1976, currency: "GHS", country: "Ghana" },
    { name: "API Call - Standard", eventType: "api_call", minVolume: 0, maxVolume: null, unitPriceCents: 1318, currency: "GHS", country: "Ghana" },
    { name: "Batch Upload - Standard", eventType: "batch_upload", minVolume: 0, maxVolume: 500, unitPriceCents: 659, currency: "GHS", country: "Ghana" },
    { name: "Batch Upload - Volume", eventType: "batch_upload", minVolume: 501, maxVolume: 5000, unitPriceCents: 461, currency: "GHS", country: "Ghana" },
    { name: "Batch Upload - Enterprise", eventType: "batch_upload", minVolume: 5001, maxVolume: null, unitPriceCents: 329, currency: "GHS", country: "Ghana" },
    { name: "Dispute Filing - Standard", eventType: "dispute_filing", minVolume: 0, maxVolume: null, unitPriceCents: 6588, currency: "GHS", country: "Ghana" },
    { name: "Data Export - Standard", eventType: "data_export", minVolume: 0, maxVolume: null, unitPriceCents: 1318, currency: "GHS", country: "Ghana" },
    { name: "Cross Border Query - Standard", eventType: "cross_border_query", minVolume: 0, maxVolume: null, unitPriceCents: 1976, currency: "GHS", country: "Ghana" },

    { name: "Telco Credit Score - Standard", eventType: "telco_credit_score", minVolume: 0, maxVolume: 5000, unitPriceCents: 50, currency: "USD", country: "Global" },
    { name: "Telco Credit Score - Volume", eventType: "telco_credit_score", minVolume: 5001, maxVolume: 50000, unitPriceCents: 25, currency: "USD", country: "Global" },
    { name: "Telco Credit Score - Enterprise", eventType: "telco_credit_score", minVolume: 50001, maxVolume: null, unitPriceCents: 12, currency: "USD", country: "Global" },
    { name: "Telco Decision Engine - Standard", eventType: "telco_decision", minVolume: 0, maxVolume: 5000, unitPriceCents: 30, currency: "USD", country: "Global" },
    { name: "Telco Decision Engine - Volume", eventType: "telco_decision", minVolume: 5001, maxVolume: 50000, unitPriceCents: 15, currency: "USD", country: "Global" },
    { name: "Telco Decision Engine - Enterprise", eventType: "telco_decision", minVolume: 50001, maxVolume: null, unitPriceCents: 8, currency: "USD", country: "Global" },
    { name: "MoMo Data Import - Standard", eventType: "telco_data_import", minVolume: 0, maxVolume: 10000, unitPriceCents: 5, currency: "USD", country: "Global" },
    { name: "MoMo Data Import - Volume", eventType: "telco_data_import", minVolume: 10001, maxVolume: 100000, unitPriceCents: 3, currency: "USD", country: "Global" },
    { name: "MoMo Data Import - Enterprise", eventType: "telco_data_import", minVolume: 100001, maxVolume: null, unitPriceCents: 1, currency: "USD", country: "Global" },
    { name: "Consent Management - Standard", eventType: "telco_consent", minVolume: 0, maxVolume: 10000, unitPriceCents: 2, currency: "USD", country: "Global" },
    { name: "Consent Management - Volume", eventType: "telco_consent", minVolume: 10001, maxVolume: null, unitPriceCents: 1, currency: "USD", country: "Global" },
    { name: "Loan Disbursement - Standard", eventType: "telco_loan_disbursement", minVolume: 0, maxVolume: 5000, unitPriceCents: 25, currency: "USD", country: "Global" },
    { name: "Loan Disbursement - Volume", eventType: "telco_loan_disbursement", minVolume: 5001, maxVolume: 50000, unitPriceCents: 15, currency: "USD", country: "Global" },
    { name: "Loan Disbursement - Enterprise", eventType: "telco_loan_disbursement", minVolume: 50001, maxVolume: null, unitPriceCents: 8, currency: "USD", country: "Global" },
  ];

  for (const t of tiers) {
    await pool.query(
      "INSERT INTO pricing_tiers (name, event_type, min_volume, max_volume, unit_price_cents, currency, country, is_active) VALUES ($1,$2,$3,$4,$5,$6,$7,true)",
      [t.name, t.eventType, t.minVolume, t.maxVolume, t.unitPriceCents, t.currency, t.country]
    );
  }
  console.log(`[Seed] Inserted ${tiers.length} default pricing tiers`);
}

if (process.argv[1] && (process.argv[1].endsWith("seed.ts") || process.argv[1].endsWith("seed.js"))) {
  seedDatabase()
    .then(() => { console.log("Seed complete"); process.exit(0); })
    .catch((e) => { console.error("Seed failed:", e); process.exit(1); });
}
