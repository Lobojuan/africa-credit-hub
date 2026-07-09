# Universal Credit Hub GTM Intelligence Spec

## Goal

Create a CRM/GTM module for selling Universal Credit Hub into the credit scoring, lending, fintech, banking, risk, collections, telco, regulator, and financial-data markets.

This is not a Salesforce clone on day one. The wedge is verified, compliant, AI-assisted outbound for credit-market sales.

## MVP Scope

- Companies/accounts
- Contacts and decision makers
- Lead import
- Email and phone verification status
- Lead source and provenance
- Campaigns and sequences
- AI-generated email drafts
- Human approval before first send
- Reply, bounce, unsubscribe, and suppression tracking
- Call prep notes
- Human call notes and follow-up actions
- Audit log of AI prompts, drafts, approvals, sends, and activities
- Local memory and Graphify support for future Codex sessions

## Out Of Scope For MVP

- Fully autonomous AI cold calls
- Autodialers
- Autonomous first-email sending
- Broad Salesforce replacement
- Marketplace integrations
- Multi-tenant CRM billing
- Direct mutation of UCH regulated credit records

## Suggested Data Model

- `gtm_companies`
- `gtm_contacts`
- `gtm_lead_sources`
- `gtm_contact_verifications`
- `gtm_campaigns`
- `gtm_sequences`
- `gtm_outreach_messages`
- `gtm_suppression_list`
- `gtm_activities`
- `gtm_call_notes`
- `gtm_ai_prompt_logs`

## Integration Boundary

UCH core remains the regulated source of truth for:

- Borrowers
- Credit accounts
- Credit inquiries
- Consent
- Institutions
- Collections
- Regulatory exports
- Audit/security logs

GTM Intelligence may reference core entities by ID, but should avoid copying regulated borrower PII. Writeback should be narrow:

- Create internal notifications.
- Attach GTM metadata to a prospect or institution.
- Log non-regulatory sales activity.

## UI Direction

The UI should be clean, dense, and operator-focused:

- CRM dashboard
- Leads table
- Company profile
- Contact profile
- Campaign builder
- Email review queue
- Call prep workspace
- Activity timeline
- Compliance/suppression center

Avoid marketing-style hero pages inside the app. This is a daily sales operations tool.

## Verification Before Release

- Typecheck
- Route/API smoke tests
- Campaign state-machine tests
- Suppression/unsubscribe tests
- Email render tests
- Permission checks
- Browser review of key CRM screens
- Local LLM review for copy/compliance only as advisory
