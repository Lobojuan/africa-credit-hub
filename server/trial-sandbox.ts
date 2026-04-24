import { db } from "./db";
import { borrowers, creditAccounts, disputes, auditLogs } from "@shared/schema";

const TRIAL_BORROWERS = [
  { firstName: "Amara", lastName: "Diallo", dateOfBirth: "1988-04-12", gender: "female", type: "individual" as const, country: "Senegal", phone: "+221771000001", email: "amara.diallo@example.com", occupation: "Business Owner", sector: "Retail", maritalStatus: "married" },
  { firstName: "Chinedu", lastName: "Okafor", dateOfBirth: "1982-09-03", gender: "male", type: "individual" as const, country: "Nigeria", phone: "+2348012000001", email: "chinedu.okafor@example.com", occupation: "Software Engineer", sector: "Technology", maritalStatus: "single" },
  { firstName: "Fatima", lastName: "Mwangi", dateOfBirth: "1991-01-18", gender: "female", type: "individual" as const, country: "Kenya", phone: "+254712000001", email: "fatima.mwangi@example.com", occupation: "Teacher", sector: "Education", maritalStatus: "married" },
  { firstName: "Thabo", lastName: "Mokoena", dateOfBirth: "1975-11-25", gender: "male", type: "individual" as const, country: "South Africa", phone: "+27612000001", email: "thabo.mokoena@example.com", occupation: "Mining Supervisor", sector: "Mining", maritalStatus: "married" },
  { firstName: "Aisha", lastName: "Hassan", dateOfBirth: "1993-06-07", gender: "female", type: "individual" as const, country: "Tanzania", phone: "+255712000001", email: "aisha.hassan@example.com", occupation: "Nurse", sector: "Healthcare" },
  { firstName: "Kweku", lastName: "Appiah", dateOfBirth: "1986-03-20", gender: "male", type: "individual" as const, country: "Ghana", phone: "+233201000010", email: "kweku.appiah@example.com", occupation: "Accountant", sector: "Finance", maritalStatus: "single" },
  { firstName: "Blessing", lastName: "Banda", dateOfBirth: "1990-08-14", gender: "female", type: "individual" as const, country: "Zambia", phone: "+260971000001", email: "blessing.banda@example.com", occupation: "Farmer", sector: "Agriculture" },
  { companyName: "Savanna Microfinance Ltd", type: "corporate" as const, country: "Ghana", phone: "+233302000001", email: "info@savannamfi.example.com", sector: "Financial Services", businessRegNumber: "BRN-GH-2024-001" },
  { companyName: "Nairobi Trading Corp", type: "corporate" as const, country: "Kenya", phone: "+254202000001", email: "info@nairobicorp.example.com", sector: "Import/Export", businessRegNumber: "BRN-KE-2023-042" },
  { firstName: "Moussa", lastName: "Traoré", dateOfBirth: "1980-12-01", gender: "male", type: "individual" as const, country: "Mali", phone: "+22370000001", email: "moussa.traore@example.com", occupation: "Merchant", sector: "Trade" },
];

const ACCOUNT_CONFIGS = [
  { accountType: "personal_loan", currency: "XOF", institution: "Banque Atlantique", original: 5000000, balance: 3200000, status: "current" as const, rate: "12.5", days: 0 },
  { accountType: "business_loan", currency: "NGN", institution: "First Bank Nigeria", original: 15000000, balance: 8500000, status: "current" as const, rate: "18.0", days: 0 },
  { accountType: "mortgage", currency: "KES", institution: "Equity Bank", original: 8000000, balance: 6200000, status: "current" as const, rate: "14.0", days: 0 },
  { accountType: "auto_loan", currency: "ZAR", institution: "Standard Bank", original: 350000, balance: 180000, status: "delinquent" as const, rate: "11.5", days: 45 },
  { accountType: "personal_loan", currency: "TZS", institution: "CRDB Bank", original: 3000000, balance: 1800000, status: "current" as const, rate: "16.0", days: 0 },
  { accountType: "credit_card", currency: "GHS", institution: "GCB Bank", original: 25000, balance: 8500, status: "current" as const, rate: "22.0", days: 0 },
  { accountType: "agriculture_loan", currency: "ZMW", institution: "Zanaco Bank", original: 120000, balance: 95000, status: "current" as const, rate: "15.0", days: 0 },
  { accountType: "business_loan", currency: "GHS", institution: "Fidelity Bank Ghana", original: 500000, balance: 320000, status: "current" as const, rate: "19.0", days: 0 },
  { accountType: "trade_finance", currency: "KES", institution: "KCB Bank", original: 12000000, balance: 4500000, status: "restructured" as const, rate: "13.0", days: 0 },
  { accountType: "personal_loan", currency: "XOF", institution: "Bank of Africa", original: 2000000, balance: 1600000, status: "current" as const, rate: "14.5", days: 0 },
  { accountType: "mortgage", currency: "NGN", institution: "Access Bank", original: 45000000, balance: 38000000, status: "current" as const, rate: "16.5", days: 0 },
  { accountType: "business_loan", currency: "ZAR", institution: "Nedbank", original: 1200000, balance: 0, status: "closed" as const, rate: "10.0", days: 0 },
  { accountType: "personal_loan", currency: "KES", institution: "M-Pesa Savings", original: 50000, balance: 22000, status: "delinquent" as const, rate: "20.0", days: 30 },
  { accountType: "credit_card", currency: "GHS", institution: "Ecobank", original: 15000, balance: 12500, status: "current" as const, rate: "24.0", days: 0 },
];

export async function seedTrialData(organizationId: string, userId: string, country: string): Promise<void> {
  try {
    const createdBorrowers = [];
    for (let i = 0; i < TRIAL_BORROWERS.length; i++) {
      const b = TRIAL_BORROWERS[i];
      const nationalIdSuffix = `${organizationId.substring(0, 6)}-${String(i + 1).padStart(3, "0")}`;
      const [created] = await (db.insert(borrowers) as any).values({
        ...b,
        nationalId: `TRIAL-${nationalIdSuffix}`,
        organizationId,
        status: "active" as any,
      }).returning();
      createdBorrowers.push(created);
    }

    const createdAccounts = [];
    for (let i = 0; i < ACCOUNT_CONFIGS.length && i < createdBorrowers.length + 4; i++) {
      const borrowerIndex = i < createdBorrowers.length ? i : i - createdBorrowers.length;
      const cfg = ACCOUNT_CONFIGS[i];
      const openedDate = new Date(2023, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1);
      const maturityDate = new Date(openedDate);
      maturityDate.setFullYear(maturityDate.getFullYear() + Math.floor(Math.random() * 4) + 1);

      const [account] = await db.insert(creditAccounts).values({
        borrowerId: createdBorrowers[borrowerIndex].id,
        lenderInstitution: cfg.institution,
        accountNumber: `TRIAL-${organizationId.substring(0, 4)}-${String(i + 1).padStart(4, "0")}`,
        accountType: cfg.accountType,
        originalAmount: String(cfg.original),
        currentBalance: String(cfg.balance),
        currency: cfg.currency,
        interestRate: cfg.rate,
        status: cfg.status,
        daysInArrears: cfg.days,
        disbursementDate: openedDate.toISOString().split("T")[0],
        maturityDate: maturityDate.toISOString().split("T")[0],
        lastPaymentDate: cfg.status !== "closed" ? new Date(Date.now() - Math.random() * 30 * 86400000).toISOString().split("T")[0] : undefined,
        lastPaymentAmount: cfg.status !== "closed" ? String(Math.floor(cfg.original * 0.03)) : undefined,
        organizationId,
      }).returning();
      createdAccounts.push(account);
    }

    const delinquentAccount = createdAccounts.find(a => a.status === "delinquent");
    if (delinquentAccount) {
      await db.insert(disputes).values({
        borrowerId: delinquentAccount.borrowerId,
        creditAccountId: delinquentAccount.id,
        filedBy: userId,
        disputeType: "incorrect_balance",
        description: "The reported balance does not match our internal records. Requesting verification of the outstanding amount.",
        status: "open",
        slaDeadline: new Date(Date.now() + 14 * 86400000),
        organizationId,
        country: "GH",
      });

      await db.insert(disputes).values({
        borrowerId: createdBorrowers[0].id,
        filedBy: userId,
        disputeType: "identity_error",
        description: "Borrower's name is misspelled in the credit report. Correct spelling has been provided.",
        status: "resolved",
        resolution: "Name corrected in the system after verification with original documentation.",
        correctionType: "data_correction",
        organizationId,
        country: "GH",
        resolvedAt: new Date(Date.now() - 7 * 86400000),
      });
    }

    const auditActions = [
      { action: "BORROWER_CREATED", entity: "borrower", details: `Added 10 sample borrowers across multiple African jurisdictions` },
      { action: "CREDIT_ACCOUNT_CREATED", entity: "credit_account", details: `Created ${createdAccounts.length} credit accounts with diverse account types and currencies` },
      { action: "TRIAL_ACTIVATED", entity: "system", details: `Trial environment activated for ${country}. All 16 modules available for exploration.` },
      { action: "DISPUTE_FILED", entity: "dispute", details: `Sample dispute filed for balance verification` },
    ];

    for (const log of auditActions) {
      await db.insert(auditLogs).values({
        ...log,
        userId,
        organizationId,
        ipAddress: "system",
      });
    }

    console.log(`[Trial Sandbox] Seeded ${createdBorrowers.length} borrowers, ${createdAccounts.length} accounts for org ${organizationId}`);
  } catch (error: any) {
    console.error(`[Trial Sandbox] Seeding error:`, error.message);
  }
}
