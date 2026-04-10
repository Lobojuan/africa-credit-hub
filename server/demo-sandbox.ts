import { db } from "./db";
import { organizations, users, borrowers, creditAccounts } from "@shared/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

const DEMO_ORG_SLUG = "demo-sandbox";
const DEMO_USERNAME = "demo-viewer";

export async function ensureDemoSandbox(): Promise<{ userId: string; organizationId: string }> {
  let org = await db.select().from(organizations).where(eq(organizations.slug, DEMO_ORG_SLUG)).then(r => r[0]);

  if (!org) {
    [org] = await db.insert(organizations).values({
      name: "Demo Financial Services",
      slug: DEMO_ORG_SLUG,
      type: "bank",
      status: "active",
      country: "Ghana",
      contactEmail: "demo@example.com",
      subscriptionTier: "enterprise",
      maxUsers: 5,
    }).returning();

    const sampleBorrowers = [
      { firstName: "Kwame", lastName: "Mensah", dateOfBirth: "1985-03-15", nationalId: "GHA-DEMO-001", gender: "male", type: "individual" as const, country: "Ghana", organizationId: org.id, status: "active" as const, email: "kwame.demo@example.com", phone: "+233201000001" },
      { firstName: "Ama", lastName: "Osei", dateOfBirth: "1990-07-22", nationalId: "GHA-DEMO-002", gender: "female", type: "individual" as const, country: "Ghana", organizationId: org.id, status: "active" as const, email: "ama.demo@example.com", phone: "+233201000002" },
      { firstName: "Kofi", lastName: "Asante", dateOfBirth: "1978-11-08", nationalId: "GHA-DEMO-003", gender: "male", type: "individual" as const, country: "Ghana", organizationId: org.id, status: "active" as const, email: "kofi.demo@example.com", phone: "+233201000003" },
      { companyName: "Accra Trading Ltd", type: "corporate" as const, country: "Ghana", organizationId: org.id, status: "active" as const, email: "info@accra-trading-demo.com", phone: "+233301000001", nationalId: "GHA-DEMO-CORP-001" },
      { firstName: "Abena", lastName: "Boateng", dateOfBirth: "1995-01-30", nationalId: "GHA-DEMO-004", gender: "female", type: "individual" as const, country: "Ghana", organizationId: org.id, status: "active" as const, email: "abena.demo@example.com", phone: "+233201000004" },
    ];

    const createdBorrowers = [];
    for (const b of sampleBorrowers) {
      const [created] = await db.insert(borrowers).values(b).returning();
      createdBorrowers.push(created);
    }

    const accountTypes = ["personal_loan", "mortgage", "credit_card", "business_loan", "auto_loan"];
    const statuses: Array<"current" | "closed" | "delinquent"> = ["current", "current", "current", "closed", "current"];
    for (let i = 0; i < createdBorrowers.length; i++) {
      await db.insert(creditAccounts).values({
        borrowerId: createdBorrowers[i].id,
        institutionName: "Demo Bank Ghana",
        accountType: accountTypes[i] as any,
        accountNumber: `DEMO-${1000 + i}`,
        currency: "GHS",
        creditLimit: String(Math.floor(Math.random() * 50000) + 10000),
        currentBalance: String(Math.floor(Math.random() * 30000) + 1000),
        monthlyPayment: String(Math.floor(Math.random() * 2000) + 200),
        status: statuses[i],
        openedDate: new Date(2023, Math.floor(Math.random() * 12), 1).toISOString().split("T")[0],
        country: "Ghana",
        organizationId: org.id,
      });
    }

    console.log(`[Demo Sandbox] Created demo organization "${org.name}" with ${sampleBorrowers.length} borrowers and accounts`);
  }

  let demoUser = await db.select().from(users).where(eq(users.username, DEMO_USERNAME)).then(r => r[0]);

  if (!demoUser) {
    const hashedPw = await bcrypt.hash("demo-readonly-2026", 12);
    [demoUser] = await db.insert(users).values({
      username: DEMO_USERNAME,
      password: hashedPw,
      email: "demo-viewer@example.com",
      fullName: "Demo Viewer",
      firstName: "Demo",
      lastName: "Viewer",
      role: "admin",
      status: "active",
      organizationId: org.id,
      country: "Ghana",
    }).returning();
    console.log(`[Demo Sandbox] Created demo user "${DEMO_USERNAME}"`);
  }

  if (demoUser.organizationId !== org.id) {
    await db.update(users).set({ organizationId: org.id }).where(eq(users.id, demoUser.id));
    demoUser.organizationId = org.id;
  }

  return { userId: demoUser.id, organizationId: org.id };
}
