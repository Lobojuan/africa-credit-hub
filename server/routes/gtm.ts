import { Router } from "express";
import { count, desc, eq } from "drizzle-orm";
import { db } from "../db";
import {
  gtmActivities,
  gtmCampaigns,
  gtmCompanies,
  gtmContacts,
  gtmOutreachMessages,
  gtmSuppressionList,
  insertGtmCompanySchema,
  insertGtmContactSchema,
  insertGtmCampaignSchema,
  insertGtmActivitySchema,
} from "@shared/schema";
import { requireRole, safeErrorMessage } from "./middleware";

const router = Router();

const requireGtmAccess = requireRole("admin", "super_admin");

function asLimit(value: unknown, fallback = 25): number {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(1, Math.min(parsed, 100));
}

async function tableCount(table: any): Promise<number> {
  const [row] = await db.select({ value: count() }).from(table);
  return Number(row?.value ?? 0);
}

router.get("/api/gtm/summary", requireGtmAccess, async (_req, res) => {
  try {
    const [
      companies,
      contacts,
      campaigns,
      messages,
      suppressions,
      activities,
      draftMessages,
      approvedMessages,
      sentMessages,
    ] = await Promise.all([
      tableCount(gtmCompanies),
      tableCount(gtmContacts),
      tableCount(gtmCampaigns),
      tableCount(gtmOutreachMessages),
      tableCount(gtmSuppressionList),
      tableCount(gtmActivities),
      db.select({ value: count() }).from(gtmOutreachMessages).where(eq(gtmOutreachMessages.status, "draft")),
      db.select({ value: count() }).from(gtmOutreachMessages).where(eq(gtmOutreachMessages.status, "approved")),
      db.select({ value: count() }).from(gtmOutreachMessages).where(eq(gtmOutreachMessages.status, "sent")),
    ]);

    res.json({
      companies,
      contacts,
      campaigns,
      messages,
      suppressions,
      activities,
      messageStatus: {
        draft: Number(draftMessages[0]?.value ?? 0),
        approved: Number(approvedMessages[0]?.value ?? 0),
        sent: Number(sentMessages[0]?.value ?? 0),
      },
      safety: {
        firstEmailRequiresApproval: true,
        autonomousAiCallingEnabled: false,
        suppressionRequiredBeforeSend: true,
      },
    });
  } catch (e: any) {
    res.status(500).json({ message: safeErrorMessage(e) });
  }
});

router.get("/api/gtm/companies", requireGtmAccess, async (req, res) => {
  try {
    const limit = asLimit(req.query.limit);
    const companies = await db
      .select()
      .from(gtmCompanies)
      .orderBy(desc(gtmCompanies.updatedAt), desc(gtmCompanies.createdAt))
      .limit(limit);
    res.json(companies);
  } catch (e: any) {
    res.status(500).json({ message: safeErrorMessage(e) });
  }
});

router.post("/api/gtm/companies", requireGtmAccess, async (req, res) => {
  try {
    const parsed = insertGtmCompanySchema.parse({
      ...req.body,
      createdBy: req.session?.userId ?? null,
      updatedBy: req.session?.userId ?? null,
      ownerUserId: req.body.ownerUserId || req.session?.userId || null,
    });
    const [company] = await db.insert(gtmCompanies).values(parsed).returning();
    await db.insert(gtmActivities).values({
      type: "status_change",
      companyId: company.id,
      title: "Company created",
      body: `Added ${company.name} to GTM Intelligence.`,
      createdBy: req.session?.userId ?? null,
    });
    res.status(201).json(company);
  } catch (e: any) {
    res.status(400).json({ message: safeErrorMessage(e) });
  }
});

router.get("/api/gtm/contacts", requireGtmAccess, async (req, res) => {
  try {
    const limit = asLimit(req.query.limit);
    const contacts = await db
      .select()
      .from(gtmContacts)
      .orderBy(desc(gtmContacts.updatedAt), desc(gtmContacts.createdAt))
      .limit(limit);
    res.json(contacts);
  } catch (e: any) {
    res.status(500).json({ message: safeErrorMessage(e) });
  }
});

router.post("/api/gtm/contacts", requireGtmAccess, async (req, res) => {
  try {
    const parsed = insertGtmContactSchema.parse({
      ...req.body,
      createdBy: req.session?.userId ?? null,
      updatedBy: req.session?.userId ?? null,
      ownerUserId: req.body.ownerUserId || req.session?.userId || null,
    });
    const [contact] = await db.insert(gtmContacts).values(parsed).returning();
    await db.insert(gtmActivities).values({
      type: "status_change",
      companyId: contact.companyId,
      contactId: contact.id,
      title: "Contact created",
      body: `Added ${contact.fullName} to GTM Intelligence.`,
      createdBy: req.session?.userId ?? null,
    });
    res.status(201).json(contact);
  } catch (e: any) {
    res.status(400).json({ message: safeErrorMessage(e) });
  }
});

router.get("/api/gtm/campaigns", requireGtmAccess, async (req, res) => {
  try {
    const limit = asLimit(req.query.limit);
    const campaigns = await db
      .select()
      .from(gtmCampaigns)
      .orderBy(desc(gtmCampaigns.updatedAt), desc(gtmCampaigns.createdAt))
      .limit(limit);
    res.json(campaigns);
  } catch (e: any) {
    res.status(500).json({ message: safeErrorMessage(e) });
  }
});

router.post("/api/gtm/campaigns", requireGtmAccess, async (req, res) => {
  try {
    const parsed = insertGtmCampaignSchema.parse({
      ...req.body,
      createdBy: req.session?.userId ?? null,
      updatedBy: req.session?.userId ?? null,
      ownerUserId: req.body.ownerUserId || req.session?.userId || null,
    });
    const [campaign] = await db.insert(gtmCampaigns).values(parsed).returning();
    await db.insert(gtmActivities).values({
      type: "status_change",
      campaignId: campaign.id,
      title: "Campaign created",
      body: `Created campaign ${campaign.name}.`,
      createdBy: req.session?.userId ?? null,
    });
    res.status(201).json(campaign);
  } catch (e: any) {
    res.status(400).json({ message: safeErrorMessage(e) });
  }
});

router.get("/api/gtm/activities", requireGtmAccess, async (req, res) => {
  try {
    const limit = asLimit(req.query.limit, 50);
    const activities = await db
      .select()
      .from(gtmActivities)
      .orderBy(desc(gtmActivities.createdAt))
      .limit(limit);
    res.json(activities);
  } catch (e: any) {
    res.status(500).json({ message: safeErrorMessage(e) });
  }
});

router.post("/api/gtm/activities", requireGtmAccess, async (req, res) => {
  try {
    const parsed = insertGtmActivitySchema.parse({
      ...req.body,
      createdBy: req.session?.userId ?? null,
    });
    const [activity] = await db.insert(gtmActivities).values(parsed).returning();
    res.status(201).json(activity);
  } catch (e: any) {
    res.status(400).json({ message: safeErrorMessage(e) });
  }
});

export default router;
