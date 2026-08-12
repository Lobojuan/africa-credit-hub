-- RLS Enablement + Pilot Policies for UCH Bank Pilot
-- 1. Enables RLS on all 77 tables
-- 2. Creates helper functions for JWT org_id and service_role checks
-- 3. Blocks anon on ALL tables
-- 4. Org-scoped policies for critical financial tables
-- 5. Read-only for reference/config tables
-- 6. Restrictive (service_role only) for internal/system tables

CREATE OR REPLACE FUNCTION public.get_jwt_org_id()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT coalesce(
    nullif(current_setting('request.jwt.claims', true)::json->>'organization_id', ''),
    nullif(current_setting('request.jwt.claims', true)::json->>'org_id', ''),
    nullif(current_setting('request.jwt.claims', true)::json->>'organizationId', '')
  );
$$;

CREATE OR REPLACE FUNCTION public.is_service_role()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT current_user = 'service_role';
$$;

ALTER TABLE public.affordability_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alternative_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asset_trace_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.batch_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blockchain_anchors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.borrower_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collateral_amendment_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collateral_amendments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collateral_rejection_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collateral_share_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collection_sla_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consumer_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consumer_monitoring_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consumer_monitoring_prefs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consumer_push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consumer_score_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.country_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_account_classifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cross_product_consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.decision_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_categorisations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guarantors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.income_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.institution_branding ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.link_clusters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.linked_open_banking_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loan_repayment_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loto_consumer_messaging_prefs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loto_country_draw_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loto_country_fiscal_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loto_draw_prize_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loto_draw_winners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loto_draws ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loto_fiscal_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loto_fraud_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loto_outbound_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loto_payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loto_pending_issuances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loto_ussd_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.momo_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.npl_migrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.npl_portfolio_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.open_banking_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.papss_settlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payout_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payout_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pending_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_deployments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.playbook_downloads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.playbook_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.playbook_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portfolio_trigger_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portfolio_trigger_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pricing_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registry_country_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registry_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registry_health_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registry_health_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registry_threshold_overrides ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.retention_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settlement_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settlement_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.telco_consent_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.telco_decision_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.telco_loan_repayments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_metering ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webauthn_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_delivery_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.xds_bureau_queries ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE
  tbl text;
BEGIN
  FOR tbl IN
    SELECT relname FROM pg_class
    WHERE relkind = 'r' AND relnamespace = 'public'::regnamespace
      AND relrowsecurity = true
    ORDER BY relname
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS block_anon ON public.%I', tbl);
    EXECUTE format('CREATE POLICY block_anon ON public.%I FOR ALL TO anon USING (false)', tbl);
  END LOOP;
END $$;

DROP POLICY IF EXISTS org_scope_borrowers ON public.borrowers;
CREATE POLICY org_scope_borrowers ON public.borrowers
  FOR ALL TO authenticated USING (organization_id = public.get_jwt_org_id());

DROP POLICY IF EXISTS org_scope_credit_accounts ON public.credit_accounts;
CREATE POLICY org_scope_credit_accounts ON public.credit_accounts
  FOR ALL TO authenticated USING (organization_id = public.get_jwt_org_id());

DROP POLICY IF EXISTS org_scope_credit_account_classifications ON public.credit_account_classifications;
CREATE POLICY org_scope_credit_account_classifications ON public.credit_account_classifications
  FOR ALL TO authenticated USING (organization_id = public.get_jwt_org_id());

DROP POLICY IF EXISTS org_scope_npl_migrations ON public.npl_migrations;
CREATE POLICY org_scope_npl_migrations ON public.npl_migrations
  FOR ALL TO authenticated USING (organization_id = public.get_jwt_org_id());

DROP POLICY IF EXISTS org_scope_npl_portfolio_summaries ON public.npl_portfolio_summaries;
CREATE POLICY org_scope_npl_portfolio_summaries ON public.npl_portfolio_summaries
  FOR ALL TO authenticated USING (organization_id = public.get_jwt_org_id());

DROP POLICY IF EXISTS org_scope_collection_assignments ON public.collection_assignments;
CREATE POLICY org_scope_collection_assignments ON public.collection_assignments
  FOR ALL TO authenticated USING (organization_id = public.get_jwt_org_id());

DROP POLICY IF EXISTS org_scope_loan_applications ON public.loan_applications;
CREATE POLICY org_scope_loan_applications ON public.loan_applications
  FOR ALL TO authenticated USING (organization_id = public.get_jwt_org_id());

DROP POLICY IF EXISTS org_scope_guarantors ON public.guarantors;
CREATE POLICY org_scope_guarantors ON public.guarantors
  FOR ALL TO authenticated USING (organization_id = public.get_jwt_org_id());

DROP POLICY IF EXISTS org_scope_disputes ON public.disputes;
CREATE POLICY org_scope_disputes ON public.disputes
  FOR ALL TO authenticated USING (organization_id = public.get_jwt_org_id());

DROP POLICY IF EXISTS org_scope_dishonoured_cheques ON public.dishonoured_cheques;
CREATE POLICY org_scope_dishonoured_cheques ON public.dishonoured_cheques
  FOR ALL TO authenticated USING (organization_id = public.get_jwt_org_id());

DROP POLICY IF EXISTS org_scope_court_judgments ON public.court_judgments;
CREATE POLICY org_scope_court_judgments ON public.court_judgments
  FOR ALL TO authenticated USING (organization_id = public.get_jwt_org_id());

DROP POLICY IF EXISTS org_scope_collateral_items ON public.collateral_items;
CREATE POLICY org_scope_collateral_items ON public.collateral_items
  FOR ALL TO authenticated USING (borrower_id IN (
    SELECT id FROM public.borrowers WHERE organization_id = public.get_jwt_org_id()
  ));

DROP POLICY IF EXISTS org_scope_credit_inquiries ON public.credit_inquiries;
CREATE POLICY org_scope_credit_inquiries ON public.credit_inquiries
  FOR ALL TO authenticated USING (borrower_id IN (
    SELECT id FROM public.borrowers WHERE organization_id = public.get_jwt_org_id()
  ));

DROP POLICY IF EXISTS org_scope_payment_history ON public.payment_history;
CREATE POLICY org_scope_payment_history ON public.payment_history
  FOR ALL TO authenticated USING (credit_account_id IN (
    SELECT id FROM public.credit_accounts WHERE organization_id = public.get_jwt_org_id()
  ));

DROP POLICY IF EXISTS org_scope_collection_attempts ON public.collection_attempts;
CREATE POLICY org_scope_collection_attempts ON public.collection_attempts
  FOR ALL TO authenticated USING (id IN (
    SELECT id FROM public.collection_assignments WHERE organization_id = public.get_jwt_org_id()
  ));

DROP POLICY IF EXISTS read_only_country_settings ON public.country_settings;
CREATE POLICY read_only_country_settings ON public.country_settings
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS read_only_registry_country_config ON public.registry_country_config;
CREATE POLICY read_only_registry_country_config ON public.registry_country_config
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS read_only_retention_policies ON public.retention_policies;
CREATE POLICY read_only_retention_policies ON public.retention_policies
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS read_only_pricing_tiers ON public.pricing_tiers;
CREATE POLICY read_only_pricing_tiers ON public.pricing_tiers
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS read_only_collection_sla_settings ON public.collection_sla_settings;
CREATE POLICY read_only_collection_sla_settings ON public.collection_sla_settings
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS service_only_batch_jobs ON public.batch_jobs;
CREATE POLICY service_only_batch_jobs ON public.batch_jobs
  FOR ALL TO authenticated USING (public.is_service_role());

DROP POLICY IF EXISTS service_only_notifications ON public.notifications;
CREATE POLICY service_only_notifications ON public.notifications
  FOR ALL TO authenticated USING (public.is_service_role());

DROP POLICY IF EXISTS service_only_webhook_subscriptions ON public.webhook_subscriptions;
CREATE POLICY service_only_webhook_subscriptions ON public.webhook_subscriptions
  FOR ALL TO authenticated USING (public.is_service_role());

DROP POLICY IF EXISTS service_only_webhook_delivery_logs ON public.webhook_delivery_logs;
CREATE POLICY service_only_webhook_delivery_logs ON public.webhook_delivery_logs
  FOR ALL TO authenticated USING (public.is_service_role());

DROP POLICY IF EXISTS service_only_platform_deployments ON public.platform_deployments;
CREATE POLICY service_only_platform_deployments ON public.platform_deployments
  FOR ALL TO authenticated USING (public.is_service_role());

DROP POLICY IF EXISTS service_only_usage_metering ON public.usage_metering;
CREATE POLICY service_only_usage_metering ON public.usage_metering
  FOR ALL TO authenticated USING (public.is_service_role());

DROP POLICY IF EXISTS service_only_asset_trace_records ON public.asset_trace_records;
CREATE POLICY service_only_asset_trace_records ON public.asset_trace_records
  FOR ALL TO authenticated USING (public.is_service_role());

DROP POLICY IF EXISTS service_only_api_configurations ON public.api_configurations;
CREATE POLICY service_only_api_configurations ON public.api_configurations
  FOR ALL TO authenticated USING (public.is_service_role());

DROP POLICY IF EXISTS service_only_decision_rules ON public.decision_rules;
CREATE POLICY service_only_decision_rules ON public.decision_rules
  FOR ALL TO authenticated USING (public.is_service_role());

DROP POLICY IF EXISTS service_only_telco_decision_rules ON public.telco_decision_rules;
CREATE POLICY service_only_telco_decision_rules ON public.telco_decision_rules
  FOR ALL TO authenticated USING (public.is_service_role());

DROP POLICY IF EXISTS service_only_alternative_data ON public.alternative_data;
CREATE POLICY service_only_alternative_data ON public.alternative_data
  FOR ALL TO authenticated USING (public.is_service_role());

DROP POLICY IF EXISTS org_scope_telco_loans ON public.telco_loans;
CREATE POLICY org_scope_telco_loans ON public.telco_loans
  FOR ALL TO authenticated USING (organization_id = public.get_jwt_org_id());

DROP POLICY IF EXISTS org_scope_telco_profiles ON public.telco_profiles;
CREATE POLICY org_scope_telco_profiles ON public.telco_profiles
  FOR ALL TO authenticated USING (organization_id = public.get_jwt_org_id());

DROP POLICY IF EXISTS org_scope_wallets ON public.wallets;
CREATE POLICY org_scope_wallets ON public.wallets
  FOR ALL TO authenticated USING (organization_id = public.get_jwt_org_id());

DROP POLICY IF EXISTS org_scope_xds_bureau_queries ON public.xds_bureau_queries;
CREATE POLICY org_scope_xds_bureau_queries ON public.xds_bureau_queries
  FOR ALL TO authenticated USING (organization_id = public.get_jwt_org_id());

DROP POLICY IF EXISTS restrictive_affordability_assessments ON public.affordability_assessments;
CREATE POLICY restrictive_affordability_assessments ON public.affordability_assessments
  FOR ALL TO authenticated USING (public.is_service_role());

DROP POLICY IF EXISTS restrictive_borrower_alerts ON public.borrower_alerts;
CREATE POLICY restrictive_borrower_alerts ON public.borrower_alerts
  FOR ALL TO authenticated USING (public.is_service_role());

DROP POLICY IF EXISTS restrictive_collateral_amendments ON public.collateral_amendments;
CREATE POLICY restrictive_collateral_amendments ON public.collateral_amendments
  FOR ALL TO authenticated USING (public.is_service_role());

DROP POLICY IF EXISTS restrictive_collateral_amendment_requests ON public.collateral_amendment_requests;
CREATE POLICY restrictive_collateral_amendment_requests ON public.collateral_amendment_requests
  FOR ALL TO authenticated USING (public.is_service_role());

DROP POLICY IF EXISTS restrictive_collateral_rejection_history ON public.collateral_rejection_history;
CREATE POLICY restrictive_collateral_rejection_history ON public.collateral_rejection_history
  FOR ALL TO authenticated USING (public.is_service_role());

DROP POLICY IF EXISTS restrictive_collateral_share_log ON public.collateral_share_log;
CREATE POLICY restrictive_collateral_share_log ON public.collateral_share_log
  FOR ALL TO authenticated USING (public.is_service_role());

DROP POLICY IF EXISTS restrictive_contact_events ON public.contact_events;
CREATE POLICY restrictive_contact_events ON public.contact_events
  FOR ALL TO authenticated USING (public.is_service_role());

DROP POLICY IF EXISTS restrictive_cross_product_consents ON public.cross_product_consents;
CREATE POLICY restrictive_cross_product_consents ON public.cross_product_consents
  FOR ALL TO authenticated USING (public.is_service_role());

DROP POLICY IF EXISTS restrictive_expense_categorisations ON public.expense_categorisations;
CREATE POLICY restrictive_expense_categorisations ON public.expense_categorisations
  FOR ALL TO authenticated USING (public.is_service_role());

DROP POLICY IF EXISTS restrictive_income_sources ON public.income_sources;
CREATE POLICY restrictive_income_sources ON public.income_sources
  FOR ALL TO authenticated USING (public.is_service_role());

DROP POLICY IF EXISTS restrictive_institution_branding ON public.institution_branding;
CREATE POLICY restrictive_institution_branding ON public.institution_branding
  FOR ALL TO authenticated USING (public.is_service_role());

DROP POLICY IF EXISTS restrictive_link_clusters ON public.link_clusters;
CREATE POLICY restrictive_link_clusters ON public.link_clusters
  FOR ALL TO authenticated USING (public.is_service_role());

DROP POLICY IF EXISTS restrictive_linked_open_banking_accounts ON public.linked_open_banking_accounts;
CREATE POLICY restrictive_linked_open_banking_accounts ON public.linked_open_banking_accounts
  FOR ALL TO authenticated USING (public.is_service_role());

DROP POLICY IF EXISTS restrictive_loan_repayment_schedules ON public.loan_repayment_schedules;
CREATE POLICY restrictive_loan_repayment_schedules ON public.loan_repayment_schedules
  FOR ALL TO authenticated USING (public.is_service_role());

DROP POLICY IF EXISTS restrictive_open_banking_profiles ON public.open_banking_profiles;
CREATE POLICY restrictive_open_banking_profiles ON public.open_banking_profiles
  FOR ALL TO authenticated USING (public.is_service_role());

DROP POLICY IF EXISTS restrictive_papss_settlements ON public.papss_settlements;
CREATE POLICY restrictive_papss_settlements ON public.papss_settlements
  FOR ALL TO authenticated USING (public.is_service_role());

DROP POLICY IF EXISTS restrictive_payout_batches ON public.payout_batches;
CREATE POLICY restrictive_payout_batches ON public.payout_batches
  FOR ALL TO authenticated USING (public.is_service_role());

DROP POLICY IF EXISTS restrictive_payout_items ON public.payout_items;
CREATE POLICY restrictive_payout_items ON public.payout_items
  FOR ALL TO authenticated USING (public.is_service_role());

DROP POLICY IF EXISTS restrictive_pending_approvals ON public.pending_approvals;
CREATE POLICY restrictive_pending_approvals ON public.pending_approvals
  FOR ALL TO authenticated USING (public.is_service_role());

DROP POLICY IF EXISTS restrictive_playbook_downloads ON public.playbook_downloads;
CREATE POLICY restrictive_playbook_downloads ON public.playbook_downloads
  FOR ALL TO authenticated USING (public.is_service_role());

DROP POLICY IF EXISTS restrictive_playbook_pages ON public.playbook_pages;
CREATE POLICY restrictive_playbook_pages ON public.playbook_pages
  FOR ALL TO authenticated USING (public.is_service_role());

DROP POLICY IF EXISTS restrictive_playbook_versions ON public.playbook_versions;
CREATE POLICY restrictive_playbook_versions ON public.playbook_versions
  FOR ALL TO authenticated USING (public.is_service_role());

DROP POLICY IF EXISTS restrictive_portfolio_trigger_events ON public.portfolio_trigger_events;
CREATE POLICY restrictive_portfolio_trigger_events ON public.portfolio_trigger_events
  FOR ALL TO authenticated USING (public.is_service_role());

DROP POLICY IF EXISTS restrictive_portfolio_trigger_subscriptions ON public.portfolio_trigger_subscriptions;
CREATE POLICY restrictive_portfolio_trigger_subscriptions ON public.portfolio_trigger_subscriptions
  FOR ALL TO authenticated USING (public.is_service_role());

DROP POLICY IF EXISTS restrictive_settlement_accounts ON public.settlement_accounts;
CREATE POLICY restrictive_settlement_accounts ON public.settlement_accounts
  FOR ALL TO authenticated USING (public.is_service_role());

DROP POLICY IF EXISTS restrictive_settlement_schedules ON public.settlement_schedules;
CREATE POLICY restrictive_settlement_schedules ON public.settlement_schedules
  FOR ALL TO authenticated USING (public.is_service_role());

DROP POLICY IF EXISTS restrictive_telco_consent_events ON public.telco_consent_events;
CREATE POLICY restrictive_telco_consent_events ON public.telco_consent_events
  FOR ALL TO authenticated USING (public.is_service_role());

DROP POLICY IF EXISTS restrictive_telco_loan_repayments ON public.telco_loan_repayments;
CREATE POLICY restrictive_telco_loan_repayments ON public.telco_loan_repayments
  FOR ALL TO authenticated USING (public.is_service_role());

DROP POLICY IF EXISTS restrictive_training_attempts ON public.training_attempts;
CREATE POLICY restrictive_training_attempts ON public.training_attempts
  FOR ALL TO authenticated USING (public.is_service_role());

DROP POLICY IF EXISTS restrictive_webauthn_credentials ON public.webauthn_credentials;
CREATE POLICY restrictive_webauthn_credentials ON public.webauthn_credentials
  FOR ALL TO authenticated USING (public.is_service_role());

DROP POLICY IF EXISTS restrictive_loto_consumer_messaging_prefs ON public.loto_consumer_messaging_prefs;
CREATE POLICY restrictive_loto_consumer_messaging_prefs ON public.loto_consumer_messaging_prefs
  FOR ALL TO authenticated USING (public.is_service_role());

DROP POLICY IF EXISTS restrictive_loto_country_draw_config ON public.loto_country_draw_config;
CREATE POLICY restrictive_loto_country_draw_config ON public.loto_country_draw_config
  FOR ALL TO authenticated USING (public.is_service_role());

DROP POLICY IF EXISTS restrictive_loto_country_fiscal_config ON public.loto_country_fiscal_config;
CREATE POLICY restrictive_loto_country_fiscal_config ON public.loto_country_fiscal_config
  FOR ALL TO authenticated USING (public.is_service_role());

DROP POLICY IF EXISTS restrictive_loto_draw_prize_tiers ON public.loto_draw_prize_tiers;
CREATE POLICY restrictive_loto_draw_prize_tiers ON public.loto_draw_prize_tiers
  FOR ALL TO authenticated USING (public.is_service_role());

DROP POLICY IF EXISTS restrictive_loto_draw_winners ON public.loto_draw_winners;
CREATE POLICY restrictive_loto_draw_winners ON public.loto_draw_winners
  FOR ALL TO authenticated USING (public.is_service_role());

DROP POLICY IF EXISTS restrictive_loto_draws ON public.loto_draws;
CREATE POLICY restrictive_loto_draws ON public.loto_draws
  FOR ALL TO authenticated USING (public.is_service_role());

DROP POLICY IF EXISTS restrictive_loto_fiscal_devices ON public.loto_fiscal_devices;
CREATE POLICY restrictive_loto_fiscal_devices ON public.loto_fiscal_devices
  FOR ALL TO authenticated USING (public.is_service_role());

DROP POLICY IF EXISTS restrictive_loto_fraud_flags ON public.loto_fraud_flags;
CREATE POLICY restrictive_loto_fraud_flags ON public.loto_fraud_flags
  FOR ALL TO authenticated USING (public.is_service_role());

DROP POLICY IF EXISTS restrictive_loto_outbound_messages ON public.loto_outbound_messages;
CREATE POLICY restrictive_loto_outbound_messages ON public.loto_outbound_messages
  FOR ALL TO authenticated USING (public.is_service_role());

DROP POLICY IF EXISTS restrictive_loto_payouts ON public.loto_payouts;
CREATE POLICY restrictive_loto_payouts ON public.loto_payouts
  FOR ALL TO authenticated USING (public.is_service_role());

DROP POLICY IF EXISTS restrictive_loto_pending_issuances ON public.loto_pending_issuances;
CREATE POLICY restrictive_loto_pending_issuances ON public.loto_pending_issuances
  FOR ALL TO authenticated USING (public.is_service_role());

DROP POLICY IF EXISTS restrictive_loto_ussd_sessions ON public.loto_ussd_sessions;
CREATE POLICY restrictive_loto_ussd_sessions ON public.loto_ussd_sessions
  FOR ALL TO authenticated USING (public.is_service_role());

DROP POLICY IF EXISTS read_only_registry_credentials ON public.registry_credentials;
CREATE POLICY read_only_registry_credentials ON public.registry_credentials
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS read_only_registry_health_config ON public.registry_health_config;
CREATE POLICY read_only_registry_health_config ON public.registry_health_config
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS read_only_registry_health_events ON public.registry_health_events;
CREATE POLICY read_only_registry_health_events ON public.registry_health_events
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS read_only_registry_threshold_overrides ON public.registry_threshold_overrides;
CREATE POLICY read_only_registry_threshold_overrides ON public.registry_threshold_overrides
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS restrictive_blockchain_anchors ON public.blockchain_anchors;
CREATE POLICY restrictive_blockchain_anchors ON public.blockchain_anchors
  FOR ALL TO authenticated USING (public.is_service_role());

DROP POLICY IF EXISTS restrictive_billing_records ON public.billing_records;
CREATE POLICY restrictive_billing_records ON public.billing_records
  FOR ALL TO authenticated USING (public.is_service_role());

-- Consumer tables: no organization_id, restrict to service_role for pilot
DROP POLICY IF EXISTS restrictive_consumer_accounts ON public.consumer_accounts;
CREATE POLICY restrictive_consumer_accounts ON public.consumer_accounts
  FOR ALL TO authenticated USING (public.is_service_role());

DROP POLICY IF EXISTS restrictive_consumer_monitoring_alerts ON public.consumer_monitoring_alerts;
CREATE POLICY restrictive_consumer_monitoring_alerts ON public.consumer_monitoring_alerts
  FOR ALL TO authenticated USING (public.is_service_role());

DROP POLICY IF EXISTS restrictive_consumer_monitoring_prefs ON public.consumer_monitoring_prefs;
CREATE POLICY restrictive_consumer_monitoring_prefs ON public.consumer_monitoring_prefs
  FOR ALL TO authenticated USING (public.is_service_role());

DROP POLICY IF EXISTS restrictive_consumer_push_subscriptions ON public.consumer_push_subscriptions;
CREATE POLICY restrictive_consumer_push_subscriptions ON public.consumer_push_subscriptions
  FOR ALL TO authenticated USING (public.is_service_role());

DROP POLICY IF EXISTS restrictive_consumer_score_history ON public.consumer_score_history;
CREATE POLICY restrictive_consumer_score_history ON public.consumer_score_history
  FOR ALL TO authenticated USING (public.is_service_role());

DROP POLICY IF EXISTS restrictive_momo_transactions ON public.momo_transactions;
CREATE POLICY restrictive_momo_transactions ON public.momo_transactions
  FOR ALL TO authenticated USING (public.is_service_role());

DROP POLICY IF EXISTS restrictive_wallet_transactions ON public.wallet_transactions;
CREATE POLICY restrictive_wallet_transactions ON public.wallet_transactions
  FOR ALL TO authenticated USING (public.is_service_role());
