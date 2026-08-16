/**
 * NPL Classification Engine
 * =========================
 *
 * Automatically classifies all credit_accounts into IFRS 9 stages and
 * NPL regulatory stages based on daysInArrears and accountStatus.
 *
 * Runs daily via scheduler. Records classifications, detects migrations,
 * and auto-triggers collection assignments for new NPLs.
 *
 * Ghana (BoG) mapping:
 *   0-29 DPD    → Performing   → IFRS 9 Stage 1
 *   30-59 DPD   → Watchlist    → IFRS 9 Stage 2
 *   60-89 DPD   → Substandard  → IFRS 9 Stage 2
 *   90-179 DPD  → Doubtful     → IFRS 9 Stage 3
 *   180+ DPD    → Loss         → IFRS 9 Stage 3
 *
 * Configurable per-country via npl_classification_policies table.
 */

import { pool } from "./db";
import { createLogger } from "./logger";

const engineLogger = createLogger("npl-classification");

export type NplClassificationPolicy = {
  country: string;
  watchlistThresholdDays: number;    // default: 30
  substandardThresholdDays: number;  // default: 60
  doubtfulThresholdDays: number;     // default: 90
  lossThresholdDays: number;         // default: 180
  sicrThresholdDays: number;         // IFRS 9 SICR: default 30
  defaultThresholdDays: number;      // IFRS 9 default: default 90
  provisionRates: {
    performing: number;   // e.g. 0.01 = 1%
    watchlist: number;    // e.g. 0.05 = 5%
    substandard: number;  // e.g. 0.20 = 20%
    doubtful: number;     // e.g. 0.50 = 50%
    loss: number;         // e.g. 1.00 = 100%
  };
};

export const GHANA_NPL_POLICY: NplClassificationPolicy = {
  country: "Ghana",
  watchlistThresholdDays: 30,
  substandardThresholdDays: 60,
  doubtfulThresholdDays: 90,
  lossThresholdDays: 180,
  sicrThresholdDays: 30,
  defaultThresholdDays: 90,
  provisionRates: {
    performing: 0.01,
    watchlist: 0.05,
    substandard: 0.20,
    doubtful: 0.50,
    loss: 1.00,
  },
};

export type ClassifiedAccount = {
  creditAccountId: string;
  borrowerId: string;
  organizationId: string | null;
  country: string;
  daysInArrears: number;
  currentBalance: number;
  accountStatus: string;
  assetClassification: string | null;
  ifrs9Stage: "stage_1" | "stage_2" | "stage_3";
  ifrs9Reasons: string[];
  nplStage: "performing" | "watchlist" | "substandard" | "doubtful" | "loss";
  nplReasons: string[];
  provisionAmount: number;
  provisionRate: number;
  collectionTriggered: boolean;
};

export function classifyAccount(
  row: {
    id: string;
    borrower_id: string;
    organization_id: string | null;
    country: string;
    days_in_arrears: number | null;
    current_balance: string | number | null;
    status: string;
    asset_classification: string | null;
    bog_asset_classification: string | null;
  },
  policy: NplClassificationPolicy
): ClassifiedAccount {
  const dpd = Number(row.days_in_arrears || 0);
  const balance = Number(row.current_balance || 0);
  const status = String(row.status || "").toLowerCase().trim();
  const assetClass = String(row.bog_asset_classification || row.asset_classification || "").toLowerCase().trim();

  // ── NPL Stage determination ───────────────────────────────────────────────
  let nplStage: ClassifiedAccount["nplStage"] = "performing";
  const nplReasons: string[] = [];

  if (status === "written_off") {
    nplStage = "loss";
    nplReasons.push("Account status: written_off");
  } else if (dpd >= policy.lossThresholdDays || status === "default") {
    nplStage = "loss";
    nplReasons.push(dpd >= policy.lossThresholdDays ? `${dpd} DPD >= ${policy.lossThresholdDays} (loss threshold)` : "Account status: default");
  } else if (dpd >= policy.doubtfulThresholdDays) {
    nplStage = "doubtful";
    nplReasons.push(`${dpd} DPD >= ${policy.doubtfulThresholdDays} (doubtful threshold)`);
  } else if (dpd >= policy.substandardThresholdDays) {
    nplStage = "substandard";
    nplReasons.push(`${dpd} DPD >= ${policy.substandardThresholdDays} (substandard threshold)`);
  } else if (dpd >= policy.watchlistThresholdDays || status === "delinquent") {
    nplStage = "watchlist";
    nplReasons.push(dpd >= policy.watchlistThresholdDays ? `${dpd} DPD >= ${policy.watchlistThresholdDays} (watchlist threshold)` : "Account status: delinquent");
  }

  // Asset classification override (if manually set by bank)
  const assetClassMap: Record<string, ClassifiedAccount["nplStage"]> = {
    performing: "performing",
    watchlist: "watchlist",
    substandard: "substandard",
    "sub-standard": "substandard",
    doubtful: "doubtful",
    loss: "loss",
    npl: "substandard",
    "non-performing": "substandard",
  };
  if (assetClass && assetClassMap[assetClass] && assetClassMap[assetClass] !== nplStage) {
    nplStage = assetClassMap[assetClass];
    nplReasons.push(`Asset classification override: ${assetClass}`);
  }

  // ── IFRS 9 Stage determination ────────────────────────────────────────────
  let ifrs9Stage: ClassifiedAccount["ifrs9Stage"] = "stage_1";
  const ifrs9Reasons: string[] = [];

  const isCreditImpaired = status === "default" || status === "written_off" || dpd >= policy.defaultThresholdDays;
  const hasSicr = dpd >= policy.sicrThresholdDays || status === "delinquent";

  if (isCreditImpaired) {
    ifrs9Stage = "stage_3";
    ifrs9Reasons.push(isCreditImpaired ? `${dpd} DPD >= ${policy.defaultThresholdDays} (credit impaired)` : `Status: ${status}`);
  } else if (hasSicr) {
    ifrs9Stage = "stage_2";
    ifrs9Reasons.push(`${dpd} DPD >= ${policy.sicrThresholdDays} (significant increase in credit risk)`);
  } else {
    ifrs9Reasons.push("No significant increase in credit risk identified");
  }

  // ── Provision calculation ─────────────────────────────────────────────────
  const provisionRate = policy.provisionRates[nplStage];
  const provisionAmount = Math.round(balance * provisionRate * 100) / 100;

  // ── Collection trigger ────────────────────────────────────────────────────
  const collectionTriggered = nplStage !== "performing" && balance > 0;

  return {
    creditAccountId: row.id,
    borrowerId: row.borrower_id,
    organizationId: row.organization_id,
    country: row.country || "Ghana",
    daysInArrears: dpd,
    currentBalance: balance,
    accountStatus: status,
    assetClassification: row.bog_asset_classification || row.asset_classification,
    ifrs9Stage,
    ifrs9Reasons,
    nplStage,
    nplReasons,
    provisionAmount,
    provisionRate,
    collectionTriggered,
  };
}

/** Fetch all active credit accounts with their latest classification. */
export async function loadAccountsForClassification(country?: string): Promise<{
  accounts: Array<{
    id: string;
    borrower_id: string;
    organization_id: string | null;
    country: string;
    days_in_arrears: number | null;
    current_balance: string | number | null;
    status: string;
    asset_classification: string | null;
    bog_asset_classification: string | null;
  }>;
  latestClassifications: Map<string, {
    ifrs9_stage: string;
    npl_stage: string;
    classified_at: Date;
  }>;
}> {
  const accountResult = await pool.query(`
    SELECT a.id, a.borrower_id, COALESCE(a.organization_id, b.organization_id) AS organization_id,
      COALESCE(b.country, 'Ghana') AS country,
      COALESCE(a.days_in_arrears, 0) AS days_in_arrears,
      a.current_balance, a.status::text AS status,
      a.asset_classification, a.bog_asset_classification
    FROM credit_accounts a
    JOIN borrowers b ON b.id = a.borrower_id
    WHERE a.status NOT IN ('closed')
      AND ($1::text IS NULL OR b.country = $1)
  `, [country || null]);

  const classificationResult = await pool.query(`
    SELECT DISTINCT ON (credit_account_id)
      credit_account_id, ifrs9_stage, npl_stage, classified_at
    FROM credit_account_classifications
    ORDER BY credit_account_id, classified_at DESC
  `);

  const latestClassifications = new Map();
  for (const row of classificationResult.rows) {
    latestClassifications.set(row.credit_account_id, {
      ifrs9_stage: row.ifrs9_stage,
      npl_stage: row.npl_stage,
      classified_at: row.classified_at,
    });
  }

  return { accounts: accountResult.rows, latestClassifications };
}

/** Run the full classification engine for a country. */
export async function runNplClassification(options: {
  country?: string;
  policy?: NplClassificationPolicy;
  autoTriggerCollection?: boolean;
} = {}) {
  const policy = options.policy || GHANA_NPL_POLICY;
  const country = options.country || policy.country;
  const autoTriggerCollection = options.autoTriggerCollection !== false;

  engineLogger.info(`Starting NPL classification run for ${country}`);
  const startTime = Date.now();

  const { accounts, latestClassifications } = await loadAccountsForClassification(country);
  engineLogger.info(`Loaded ${accounts.length} active accounts`);

  const classifications: ClassifiedAccount[] = [];
  const migrations: Array<{
    account: ClassifiedAccount;
    fromIfrs9: string;
    fromNpl: string;
  }> = [];

  for (const accountRow of accounts) {
    const classified = classifyAccount(accountRow, policy);
    classifications.push(classified);

    const previous = latestClassifications.get(classified.creditAccountId);
    if (previous) {
      if (previous.ifrs9_stage !== classified.ifrs9Stage || previous.npl_stage !== classified.nplStage) {
        migrations.push({
          account: classified,
          fromIfrs9: previous.ifrs9_stage,
          fromNpl: previous.npl_stage,
        });
      }
    } else {
      // First classification ever — if not performing, it's a migration from "new"
      if (classified.nplStage !== "performing") {
        migrations.push({
          account: classified,
          fromIfrs9: "stage_1",
          fromNpl: "performing",
        });
      }
    }
  }

  // Persist classifications
  const client = await pool.connect();
  let insertedClassifications = 0;
  let insertedMigrations = 0;
  let triggeredCollections = 0;

  try {
    await client.query("BEGIN");

    for (const c of classifications) {
      const alreadyToday = await client.query(
        `SELECT 1 FROM credit_account_classifications WHERE credit_account_id = $1 AND DATE(classified_at) = CURRENT_DATE LIMIT 1`,
        [c.creditAccountId]
      );
      if (alreadyToday.rows.length > 0) continue;

      await client.query(`
        INSERT INTO credit_account_classifications
          (credit_account_id, borrower_id, organization_id, country, days_in_arrears, current_balance,
           account_status, asset_classification, ifrs9_stage, ifrs9_reasons, npl_stage, npl_reasons,
           provision_amount, provision_rate, collection_triggered)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      `, [
        c.creditAccountId, c.borrowerId, c.organizationId, c.country, c.daysInArrears, c.currentBalance,
        c.accountStatus, c.assetClassification, c.ifrs9Stage, JSON.stringify(c.ifrs9Reasons), c.nplStage, JSON.stringify(c.nplReasons),
        c.provisionAmount, c.provisionRate, c.collectionTriggered,
      ]);
      insertedClassifications++;
    }

    // Persist migrations
    for (const m of migrations) {
      const alreadyToday = await client.query(
        `SELECT 1 FROM npl_migrations WHERE credit_account_id = $1 AND DATE(migrated_at) = CURRENT_DATE LIMIT 1`,
        [m.account.creditAccountId]
      );
      if (alreadyToday.rows.length > 0) continue;

      let collectionAssignmentId: string | null = null;

      // Auto-trigger collection for new NPLs
      if (autoTriggerCollection && m.account.collectionTriggered && m.fromNpl === "performing") {
        const existing = await client.query(
          `SELECT id FROM collection_assignments WHERE credit_account_id = $1 AND status IN ('open', 'in_progress', 'promised') LIMIT 1`,
          [m.account.creditAccountId]
        );
        if (!existing.rows[0]) {
          const assigneeResult = await client.query(`
            WITH assignee AS (
              SELECT id FROM users
              WHERE role = 'lender' AND status = 'active' AND organization_id = $3
              ORDER BY created_at
              LIMIT 1
            )
            INSERT INTO collection_assignments
              (borrower_id, credit_account_id, assigned_to, organization_id, status, priority, created_by)
            SELECT $1, $2, assignee.id, $3, 'open', 'high', assignee.id
            FROM assignee
            RETURNING id
          `, [m.account.borrowerId, m.account.creditAccountId, m.account.organizationId]);
          collectionAssignmentId = assigneeResult.rows[0]?.id || null;
          if (collectionAssignmentId) triggeredCollections++;
        }
      }

      if (collectionAssignmentId) {
        await client.query(
          `UPDATE credit_account_classifications
           SET collection_triggered = true, collection_assignment_id = $2
           WHERE credit_account_id = $1 AND DATE(classified_at) = CURRENT_DATE`,
          [m.account.creditAccountId, collectionAssignmentId],
        );
      }

      await client.query(`
        INSERT INTO npl_migrations
          (credit_account_id, borrower_id, organization_id, country,
           from_ifrs9_stage, to_ifrs9_stage, from_npl_stage, to_npl_stage,
           balance_at_migration, provision_before, provision_after,
           days_in_arrears_before, days_in_arrears_after,
           triggered_collection, collection_assignment_id)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      `, [
        m.account.creditAccountId, m.account.borrowerId, m.account.organizationId, m.account.country,
        m.fromIfrs9, m.account.ifrs9Stage, m.fromNpl, m.account.nplStage,
        m.account.currentBalance, 0, m.account.provisionAmount,
        0, m.account.daysInArrears,
        !!collectionAssignmentId, collectionAssignmentId,
      ]);
      insertedMigrations++;
    }

    await client.query("COMMIT");
  } catch (e) {
    await client.query("ROLLBACK").catch(() => {});
    engineLogger.error("Classification run failed", { error: String(e) });
    throw e;
  } finally {
    client.release();
  }

  const duration = Date.now() - startTime;
  engineLogger.info(
    `Classification run complete: ${insertedClassifications} classifications, ${insertedMigrations} migrations, ${triggeredCollections} auto-collections in ${duration}ms`
  );

  return {
    totalAccounts: accounts.length,
    classificationsInserted: insertedClassifications,
    migrationsInserted: insertedMigrations,
    collectionsTriggered: triggeredCollections,
    stageBreakdown: {
      performing: classifications.filter((c) => c.nplStage === "performing").length,
      watchlist: classifications.filter((c) => c.nplStage === "watchlist").length,
      substandard: classifications.filter((c) => c.nplStage === "substandard").length,
      doubtful: classifications.filter((c) => c.nplStage === "doubtful").length,
      loss: classifications.filter((c) => c.nplStage === "loss").length,
    },
    durationMs: duration,
  };
}

/** Generate or refresh the portfolio summary for a given date. */
export async function generatePortfolioSummary(summaryDate: string, country: string, organizationId?: string) {
  const result = await pool.query(`
    WITH latest_classifications AS (
      SELECT DISTINCT ON (credit_account_id) *
      FROM credit_account_classifications
      WHERE DATE(classified_at) = $1::date
        AND ($2::text IS NULL OR organization_id = $2)
        AND country = $3
      ORDER BY credit_account_id, classified_at DESC
    ),
    account_exposures AS (
      SELECT
        COALESCE(SUM(current_balance) FILTER (WHERE account_status <> 'written_off'), 0) AS gross_loan_exposure,
        COALESCE(SUM(current_balance) FILTER (WHERE npl_stage IN ('substandard', 'doubtful', 'loss')), 0) AS npl_exposure,
        COALESCE(SUM(current_balance) FILTER (WHERE npl_stage = 'watchlist'), 0) AS watchlist_exposure,
        COALESCE(SUM(current_balance) FILTER (WHERE npl_stage = 'substandard'), 0) AS substandard_exposure,
        COALESCE(SUM(current_balance) FILTER (WHERE npl_stage = 'doubtful'), 0) AS doubtful_exposure,
        COALESCE(SUM(current_balance) FILTER (WHERE npl_stage = 'loss'), 0) AS loss_exposure,
        COUNT(*) FILTER (WHERE account_status <> 'written_off')::int AS total_facilities,
        COUNT(*) FILTER (WHERE npl_stage IN ('substandard', 'doubtful', 'loss'))::int AS npl_facilities,
        COUNT(*) FILTER (WHERE npl_stage = 'watchlist')::int AS watchlist_facilities,
        COALESCE(SUM(provision_amount), 0) AS total_provisions,
        COALESCE(SUM(current_balance) FILTER (WHERE ifrs9_stage = 'stage_1'), 0) AS stage_1_exposure,
        COALESCE(SUM(current_balance) FILTER (WHERE ifrs9_stage = 'stage_2'), 0) AS stage_2_exposure,
        COALESCE(SUM(current_balance) FILTER (WHERE ifrs9_stage = 'stage_3'), 0) AS stage_3_exposure,
        COALESCE(SUM(provision_amount) FILTER (WHERE ifrs9_stage = 'stage_1'), 0) AS stage_1_provision,
        COALESCE(SUM(provision_amount) FILTER (WHERE ifrs9_stage = 'stage_2'), 0) AS stage_2_provision,
        COALESCE(SUM(provision_amount) FILTER (WHERE ifrs9_stage = 'stage_3'), 0) AS stage_3_provision
      FROM latest_classifications
    ),
    migration_flows AS (
      SELECT
        COUNT(*) FILTER (WHERE from_ifrs9_stage = 'stage_1' AND to_ifrs9_stage = 'stage_2')::int AS inflows_1_to_2,
        COUNT(*) FILTER (WHERE from_ifrs9_stage = 'stage_2' AND to_ifrs9_stage = 'stage_3')::int AS inflows_2_to_3,
        COUNT(*) FILTER (WHERE from_ifrs9_stage = 'stage_3' AND to_ifrs9_stage = 'stage_2')::int AS cures_3_to_2,
        COUNT(*) FILTER (WHERE from_ifrs9_stage = 'stage_2' AND to_ifrs9_stage = 'stage_1')::int AS cures_2_to_1,
        COUNT(*) FILTER (WHERE to_npl_stage = 'loss' AND from_npl_stage <> 'loss')::int AS write_offs
      FROM npl_migrations
      WHERE DATE(migrated_at) = $1::date
        AND ($2::text IS NULL OR organization_id = $2)
        AND country = $3
    ),
    collection_status AS (
      SELECT
        COUNT(*) FILTER (WHERE collection_assignment_id IS NOT NULL)::int AS assigned,
        COUNT(*) FILTER (WHERE collection_assignment_id IS NULL AND npl_stage IN ('substandard', 'doubtful', 'loss'))::int AS not_assigned
      FROM latest_classifications
    )
    SELECT
      ae.*,
      mf.*,
      cs.*,
      CASE WHEN ae.gross_loan_exposure > 0 THEN ae.npl_exposure / ae.gross_loan_exposure ELSE 0 END AS npl_ratio,
      CASE WHEN ae.gross_loan_exposure > 0 THEN ae.watchlist_exposure / ae.gross_loan_exposure ELSE 0 END AS watchlist_ratio,
      CASE WHEN ae.npl_exposure > 0 THEN ae.total_provisions / ae.npl_exposure ELSE 0 END AS coverage_ratio,
      CASE WHEN ae.gross_loan_exposure > 0 THEN ae.total_provisions / ae.gross_loan_exposure ELSE 0 END AS provision_ratio
    FROM account_exposures ae, migration_flows mf, collection_status cs
  `, [summaryDate, organizationId || null, country]);

  const row = result.rows[0];
  if (!row || Number(row.gross_loan_exposure) === 0) return null;

  // PostgreSQL treats NULL organization IDs as distinct in ordinary unique
  // constraints. Replace the exact daily scope explicitly so global regulator
  // summaries remain idempotent across restarts as well as bank-scoped runs.
  await pool.query(
    `DELETE FROM npl_portfolio_summaries
     WHERE organization_id IS NOT DISTINCT FROM $1 AND country = $2 AND summary_date = $3`,
    [organizationId || null, country, summaryDate],
  );

  await pool.query(`
    INSERT INTO npl_portfolio_summaries
      (organization_id, country, summary_date, gross_loan_exposure, npl_exposure, watchlist_exposure,
       substandard_exposure, doubtful_exposure, loss_exposure, total_facilities, npl_facilities,
       watchlist_facilities, npl_ratio, watchlist_ratio, coverage_ratio, provision_ratio,
       stage_1_exposure, stage_2_exposure, stage_3_exposure, stage_1_provision, stage_2_provision,
       stage_3_provision, inflows_stage_1_to_2, inflows_stage_2_to_3, cures_stage_3_to_2,
       cures_stage_2_to_1, write_offs, npl_assigned_to_collection, npl_not_assigned)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28,$29)
  `, [
    organizationId || null, country, summaryDate,
    row.gross_loan_exposure, row.npl_exposure, row.watchlist_exposure,
    row.substandard_exposure, row.doubtful_exposure, row.loss_exposure,
    row.total_facilities, row.npl_facilities, row.watchlist_facilities,
    row.npl_ratio, row.watchlist_ratio, row.coverage_ratio, row.provision_ratio,
    row.stage_1_exposure, row.stage_2_exposure, row.stage_3_exposure,
    row.stage_1_provision, row.stage_2_provision, row.stage_3_provision,
    row.inflows_1_to_2, row.inflows_2_to_3, row.cures_3_to_2, row.cures_2_to_1,
    row.write_offs, row.assigned, row.not_assigned,
  ]);

  return row;
}

/** Start the daily classification scheduler. Returns a handle with stop(). */
export function startNplClassificationScheduler(intervalHours = 24) {
  engineLogger.info(`NPL classification scheduler starting (every ${intervalHours}h)`);

  async function tick() {
    try {
      await runNplClassification();
      const today = new Date().toISOString().slice(0, 10);
      await generatePortfolioSummary(today, "Ghana");
    } catch (e) {
      engineLogger.error("Scheduled NPL classification failed", { error: String(e) });
    }
  }

  // Run immediately on startup
  tick();

  // Then on interval
  const intervalId = setInterval(tick, intervalHours * 60 * 60 * 1000);

  return {
    stop: () => {
      clearInterval(intervalId);
      engineLogger.info("NPL classification scheduler stopped");
    },
  };
}
