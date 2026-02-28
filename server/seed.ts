import { db } from "./db";
import { users, borrowers, creditAccounts, creditInquiries, auditLogs } from "@shared/schema";
import { count } from "drizzle-orm";
import bcrypt from "bcryptjs";

export async function seedDatabase() {
  const [existing] = await db.select({ value: count() }).from(users);
  if (existing.value > 0) return;

  const hash = (pw: string) => bcrypt.hashSync(pw, 8);

  const [admin] = await db.insert(users).values([
    { username: "admin", password: hash("admin123"), fullName: "Tadesse Bekele", email: "tadesse@systemsinmotionlimited.com", role: "admin", status: "active", institution: "Systems In Motion Limited" },
    { username: "regulator1", password: hash("reg123"), fullName: "Almaz Haile", email: "almaz@systemsinmotionlimited.com", role: "regulator", status: "active", institution: "Systems In Motion Limited" },
    { username: "cbe_user", password: hash("cbe123"), fullName: "Yohannes Gebre", email: "yohannes@cbe.com.et", role: "lender", status: "active", institution: "Commercial Bank of Ethiopia" },
    { username: "dashen_user", password: hash("dashen123"), fullName: "Sara Mengistu", email: "sara@dashenbank.com.et", role: "lender", status: "active", institution: "Dashen Bank" },
    { username: "awash_user", password: hash("awash123"), fullName: "Kebede Worku", email: "kebede@awashbank.com", role: "lender", status: "active", institution: "Awash International Bank" },
  ]).returning();

  const createdBorrowers = await db.insert(borrowers).values([
    {
      type: "individual", firstName: "Abebe", lastName: "Tesfaye", nationalId: "ETH-ID-10001",
      tinNumber: "TIN-0001234", dateOfBirth: "1985-03-15", gender: "Male", phone: "+251911234567",
      email: "abebe.tesfaye@gmail.com", address: "Bole Sub-City, Woreda 03",
      city: "Addis Ababa", region: "Addis Ababa", employerName: "Ethiopian Airlines",
      occupation: "Senior Engineer", sector: "Aviation",
    },
    {
      type: "individual", firstName: "Meron", lastName: "Desta", nationalId: "ETH-ID-10002",
      tinNumber: "TIN-0001235", dateOfBirth: "1990-07-22", gender: "Female", phone: "+251922345678",
      email: "meron.desta@outlook.com", address: "Kirkos Sub-City, Woreda 08",
      city: "Addis Ababa", region: "Addis Ababa", employerName: "Ethio Telecom",
      occupation: "Marketing Manager", sector: "Telecommunications",
    },
    {
      type: "individual", firstName: "Solomon", lastName: "Kebede", nationalId: "ETH-ID-10003",
      tinNumber: "TIN-0001236", dateOfBirth: "1978-11-30", gender: "Male", phone: "+251933456789",
      email: "solomon.k@yahoo.com", address: "Arada Sub-City, Woreda 01",
      city: "Addis Ababa", region: "Addis Ababa", employerName: "Ministry of Finance",
      occupation: "Financial Analyst", sector: "Government",
    },
    {
      type: "corporate", companyName: "Habesha Breweries S.C.", nationalId: "ETH-BIZ-20001",
      tinNumber: "TIN-0005001", phone: "+251115572000", email: "info@habeshabreweries.com",
      address: "Debre Berhan Industrial Zone", city: "Debre Berhan", region: "Amhara",
      businessRegNumber: "BR-2009-ETH-0451", sector: "Manufacturing",
    },
    {
      type: "corporate", companyName: "Anbessa City Bus S.E.", nationalId: "ETH-BIZ-20002",
      tinNumber: "TIN-0005002", phone: "+251115518300", email: "anbessa@transport.gov.et",
      address: "Yeka Sub-City, Woreda 12", city: "Addis Ababa", region: "Addis Ababa",
      businessRegNumber: "BR-1998-ETH-0112", sector: "Transportation",
    },
  ]).returning();

  await db.insert(creditAccounts).values([
    {
      borrowerId: createdBorrowers[0].id, lenderInstitution: "Commercial Bank of Ethiopia",
      accountNumber: "CBE-LN-2024-001", accountType: "Personal Loan",
      originalAmount: "500000.00", currentBalance: "350000.00", currency: "ETB",
      interestRate: "12.50", disbursementDate: "2024-01-15", maturityDate: "2027-01-15",
      status: "current", daysInArrears: 0, collateralType: "Property",
      collateralValue: "1200000.00", lastPaymentDate: "2026-02-01", lastPaymentAmount: "18500.00",
    },
    {
      borrowerId: createdBorrowers[0].id, lenderInstitution: "Dashen Bank",
      accountNumber: "DB-LN-2023-089", accountType: "Vehicle Loan",
      originalAmount: "800000.00", currentBalance: "420000.00", currency: "ETB",
      interestRate: "14.00", disbursementDate: "2023-06-01", maturityDate: "2026-06-01",
      status: "current", daysInArrears: 0, lastPaymentDate: "2026-02-10", lastPaymentAmount: "32000.00",
    },
    {
      borrowerId: createdBorrowers[1].id, lenderInstitution: "Awash International Bank",
      accountNumber: "AIB-LN-2024-155", accountType: "Mortgage",
      originalAmount: "3000000.00", currentBalance: "2750000.00", currency: "ETB",
      interestRate: "11.00", disbursementDate: "2024-03-20", maturityDate: "2039-03-20",
      status: "current", daysInArrears: 0, collateralType: "Real Estate",
      collateralValue: "5000000.00", lastPaymentDate: "2026-02-15", lastPaymentAmount: "28000.00",
    },
    {
      borrowerId: createdBorrowers[2].id, lenderInstitution: "Commercial Bank of Ethiopia",
      accountNumber: "CBE-LN-2022-340", accountType: "Business Loan",
      originalAmount: "1500000.00", currentBalance: "890000.00", currency: "ETB",
      interestRate: "13.50", disbursementDate: "2022-09-01", maturityDate: "2025-09-01",
      status: "delinquent", daysInArrears: 45, lastPaymentDate: "2025-12-15", lastPaymentAmount: "42000.00",
    },
    {
      borrowerId: createdBorrowers[3].id, lenderInstitution: "Dashen Bank",
      accountNumber: "DB-LN-2023-200", accountType: "Corporate Loan",
      originalAmount: "25000000.00", currentBalance: "18500000.00", currency: "ETB",
      interestRate: "10.00", disbursementDate: "2023-01-10", maturityDate: "2028-01-10",
      status: "current", daysInArrears: 0, collateralType: "Equipment & Machinery",
      collateralValue: "35000000.00", lastPaymentDate: "2026-02-05", lastPaymentAmount: "520000.00",
    },
    {
      borrowerId: createdBorrowers[4].id, lenderInstitution: "Awash International Bank",
      accountNumber: "AIB-LN-2021-078", accountType: "Fleet Financing",
      originalAmount: "15000000.00", currentBalance: "3200000.00", currency: "USD",
      interestRate: "11.50", disbursementDate: "2021-04-01", maturityDate: "2026-04-01",
      status: "current", daysInArrears: 0, collateralType: "Vehicles",
      collateralValue: "20000000.00", lastPaymentDate: "2026-02-12", lastPaymentAmount: "380000.00",
    },
  ]);

  await db.insert(creditInquiries).values([
    { borrowerId: createdBorrowers[0].id, inquiredBy: admin.id, purpose: "new_credit", institution: "Commercial Bank of Ethiopia", consentProvided: true },
    { borrowerId: createdBorrowers[1].id, inquiredBy: admin.id, purpose: "review", institution: "Awash International Bank", consentProvided: true },
    { borrowerId: createdBorrowers[2].id, inquiredBy: admin.id, purpose: "regulatory", institution: "Systems In Motion Limited", consentProvided: true },
    { borrowerId: createdBorrowers[3].id, inquiredBy: admin.id, purpose: "portfolio_monitoring", institution: "Dashen Bank", consentProvided: true },
  ]);

  await db.insert(auditLogs).values([
    { userId: admin.id, action: "LOGIN", entity: "system", details: "Admin user logged in", ipAddress: "127.0.0.1" },
    { userId: admin.id, action: "SEARCH", entity: "borrower", details: "Searched for borrower: Abebe Tesfaye", ipAddress: "127.0.0.1" },
    { userId: admin.id, action: "VIEW", entity: "credit_report", entityId: createdBorrowers[0].id, details: "Viewed credit report", ipAddress: "127.0.0.1" },
    { userId: admin.id, action: "CREATE", entity: "borrower", entityId: createdBorrowers[3].id, details: "Registered corporate borrower: Habesha Breweries", ipAddress: "127.0.0.1" },
  ]);

  console.log("Database seeded successfully");
}
