import { db } from "./db";
import { sql } from "drizzle-orm";

export async function migrateCrifFeatures() {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS open_banking_profiles (
      id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
      borrower_id VARCHAR NOT NULL REFERENCES borrowers(id),
      organization_id VARCHAR REFERENCES organizations(id),
      data_source TEXT NOT NULL,
      account_number TEXT,
      currency TEXT DEFAULT 'GHS',
      avg_monthly_inflow DECIMAL(15,2),
      avg_monthly_outflow DECIMAL(15,2),
      months_of_data INTEGER,
      regular_income_streams INTEGER DEFAULT 0,
      gambling_transactions INTEGER DEFAULT 0,
      salary_credits_detected BOOLEAN DEFAULT false,
      rent_payments_detected BOOLEAN DEFAULT false,
      utility_payments_detected BOOLEAN DEFAULT false,
      nsf_events INTEGER DEFAULT 0,
      open_banking_score INTEGER,
      raw_summary JSONB,
      consent_reference TEXT,
      data_as_of TIMESTAMP,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS decision_rules (
      id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
      organization_id VARCHAR REFERENCES organizations(id),
      rule_name TEXT NOT NULL,
      description TEXT,
      is_active BOOLEAN DEFAULT true,
      min_credit_score INTEGER,
      max_credit_score INTEGER,
      max_days_in_arrears INTEGER,
      max_active_accounts INTEGER,
      min_monthly_income DECIMAL(15,2),
      max_debt_to_income_ratio DECIMAL(5,2),
      exclude_pep BOOLEAN DEFAULT true,
      exclude_active_judgments BOOLEAN DEFAULT true,
      exclude_dishonoured_cheques BOOLEAN DEFAULT false,
      outcome TEXT NOT NULL DEFAULT 'refer',
      priority INTEGER DEFAULT 1,
      created_by VARCHAR REFERENCES users(id),
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS esg_scores (
      id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
      borrower_id VARCHAR NOT NULL REFERENCES borrowers(id),
      organization_id VARCHAR REFERENCES organizations(id),
      has_environmental_policy BOOLEAN DEFAULT false,
      waste_management_score INTEGER DEFAULT 0,
      energy_efficiency_score INTEGER DEFAULT 0,
      carbon_footprint_reported BOOLEAN DEFAULT false,
      employee_welfare_score INTEGER DEFAULT 0,
      community_engagement_score INTEGER DEFAULT 0,
      gender_diversity_score INTEGER DEFAULT 0,
      health_safety_compliance BOOLEAN DEFAULT false,
      board_independence_score INTEGER DEFAULT 0,
      anti_corruption_policy BOOLEAN DEFAULT false,
      audited_financials BOOLEAN DEFAULT false,
      tax_compliance_score INTEGER DEFAULT 0,
      environmental_score INTEGER,
      social_score INTEGER,
      governance_score INTEGER,
      total_esg_score INTEGER,
      esg_rating TEXT,
      assessed_by VARCHAR REFERENCES users(id),
      assessed_at TIMESTAMP DEFAULT NOW(),
      notes TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    );

    ALTER TABLE consumer_accounts ADD COLUMN IF NOT EXISTS full_name TEXT;
    ALTER TABLE consumer_accounts ADD COLUMN IF NOT EXISTS country TEXT;
    ALTER TABLE consumer_accounts ADD COLUMN IF NOT EXISTS consent_given BOOLEAN DEFAULT false;

    CREATE TABLE IF NOT EXISTS consumer_push_subscriptions (
      id SERIAL PRIMARY KEY,
      consumer_account_id VARCHAR NOT NULL REFERENCES consumer_accounts(id) ON DELETE CASCADE,
      endpoint TEXT NOT NULL UNIQUE,
      keys JSONB NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_consumer_push_subs_account ON consumer_push_subscriptions(consumer_account_id);
  `);
  console.log("[CRIF] All new feature tables created successfully");
}
