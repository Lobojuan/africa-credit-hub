import { db } from "./db";
import { sql } from "drizzle-orm";
import { storage } from "./storage";
import { broadcastEvent } from "./websocket";

const DEFAULT_THRESHOLDS: Record<string, number> = {
  urgent: 3,
  high: 5,
  medium: 7,
  low: 14,
};

const PRIORITIES = ["urgent", "high", "medium", "low"] as const;

interface OrgCountry {
  organizationId: string | undefined;
  country: string;
}

async function getActiveOrgCountries(): Promise<OrgCountry[]> {
  const result = await db.execute(sql`
    SELECT DISTINCT organization_id, country
    FROM collection_assignments
    WHERE status IN ('open', 'in_progress')
      AND assigned_to IS NOT NULL
      AND country IS NOT NULL
  `);
  return (result.rows || []).map((r: any) => ({
    organizationId: r.organization_id ?? undefined,
    country: r.country as string,
  }));
}

async function getUserEmail(userId: string): Promise<string | undefined> {
  const result = await db.execute(sql`SELECT email FROM users WHERE id = ${userId} LIMIT 1`);
  return (result.rows?.[0] as any)?.email;
}

export async function checkCollectionSla(scopeOrgId?: string, scopeCountry?: string): Promise<{ breaches: number; errors: number }> {
  let breaches = 0;
  let errors = 0;

  try {
    let orgCountries = await getActiveOrgCountries();
    if (scopeOrgId) {
      orgCountries = orgCountries.filter(oc => oc.organizationId === scopeOrgId || !oc.organizationId);
    }
    if (scopeCountry) {
      orgCountries = orgCountries.filter(oc => oc.country === scopeCountry);
    }

    for (const { organizationId, country } of orgCountries) {
      try {
        const settings = await storage.getCollectionSlaSettings(organizationId, country);

        if (settings && !settings.enabled) continue;

        const thresholds: Record<string, number> = {
          urgent: settings?.urgentThresholdDays ?? DEFAULT_THRESHOLDS.urgent,
          high: settings?.highThresholdDays ?? DEFAULT_THRESHOLDS.high,
          medium: settings?.mediumThresholdDays ?? DEFAULT_THRESHOLDS.medium,
          low: settings?.lowThresholdDays ?? DEFAULT_THRESHOLDS.low,
        };

        for (const priority of PRIORITIES) {
          const days = thresholds[priority];
          const overdueAssignments = await storage.getOverdueCollectionAssignments(days, priority, organizationId, country);

          for (const assignment of overdueAssignments) {
            try {
              if (!assignment.assignedTo) continue;

              const alreadyNotified = await db.execute(sql`
                SELECT id FROM notifications
                WHERE user_id = ${assignment.assignedTo}
                  AND type = 'collection_sla_breach'
                  AND link = ${`/collections?assignment=${assignment.id}`}
                  AND created_at > NOW() - INTERVAL '24 hours'
                LIMIT 1
              `);

              if ((alreadyNotified.rows?.length || 0) > 0) continue;

              const title = `SLA Breach: ${priority.charAt(0).toUpperCase() + priority.slice(1)} Priority Case`;
              const message = `A ${priority}-priority collection case has not been contacted in ${days}+ days. Please take action.`;

              await storage.createNotification({
                userId: assignment.assignedTo,
                type: "collection_sla_breach",
                title,
                message,
                link: `/collections?assignment=${assignment.id}`,
                organizationId: assignment.organizationId ?? undefined,
                country,
              });

              broadcastEvent(
                {
                  type: "collection_sla_breach",
                  title,
                  message,
                  entityId: assignment.id,
                  entityType: "collection_assignment",
                  severity: priority === "urgent" || priority === "high" ? "critical" : "warning",
                  timestamp: new Date().toISOString(),
                  data: { assignmentId: assignment.id, priority, thresholdDays: days },
                },
                { userId: assignment.assignedTo }
              );

              breaches++;
            } catch (e: any) {
              console.error(`[SLA] Error notifying for assignment ${assignment.id}:`, e.message);
              errors++;
            }
          }
        }
      } catch (e: any) {
        console.error(`[SLA] Error processing org=${organizationId} country=${country}:`, e.message);
        errors++;
      }
    }
  } catch (e: any) {
    console.error("[SLA] Fatal error during SLA check:", e.message);
    errors++;
  }

  if (breaches > 0 || errors > 0) {
    console.log(`[SLA] Check complete: ${breaches} breaches notified, ${errors} errors`);
  }

  return { breaches, errors };
}

let slaCronInterval: ReturnType<typeof setInterval> | null = null;

export function startCollectionSlaChecker(intervalMs = 60 * 60 * 1000): void {
  if (slaCronInterval) return;

  console.log(`[SLA] Starting collection SLA checker (interval: ${intervalMs / 1000}s)`);

  checkCollectionSla().catch(e => console.error("[SLA] Initial check failed:", e.message));

  slaCronInterval = setInterval(() => {
    checkCollectionSla().catch(e => console.error("[SLA] Periodic check failed:", e.message));
  }, intervalMs);
}

export function stopCollectionSlaChecker(): void {
  if (slaCronInterval) {
    clearInterval(slaCronInterval);
    slaCronInterval = null;
    console.log("[SLA] Collection SLA checker stopped");
  }
}
