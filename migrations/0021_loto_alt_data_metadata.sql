-- Migration: add metadata jsonb column to alternative_data
-- Used by the Loto Fiscal merchant credit pipeline to store displayLabel,
-- complianceBreakdown, vatTrend, and fraudRuleStatuses alongside the rawScore.
ALTER TABLE alternative_data ADD COLUMN IF NOT EXISTS metadata jsonb;
