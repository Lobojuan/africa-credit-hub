# UCH Requirements Traceability Register

## Purpose

This register turns the LLM Group research and bank-specific forensic material into build requirements for Universal Credit Hub (UCH). It is the product contract for Ghana pilots first, then country packs for other African markets.

Each item is marked:

- **Live** - usable in UCH today.
- **Partial** - underlying capability exists, but the bank workflow or production integration is incomplete.
- **Planned** - required before the relevant bank pilot can be called complete.

## Source documents

| Source | What UCH must respect |
|---|---|
| *Ten Problems Worth Solving* | The Ghana sector priorities: NPLs, document forgery, insider and electronic fraud, failed transactions, operational cost, CAR/liquidity, private-credit scoring, regulatory overload, and local-language service. |
| *Banking on Intelligence* business plan | Sell measurable operational outcomes, not generic AI; start with a fixed-scope pilot and prove results on bank data. |
| *Bank Meeting Playbook* | Human sign-off, explainability, Act 843 data-residency choices, a local operating team, and examiner evidence packs are non-negotiable. |
| First Atlantic Bank forensic walkthrough | NPL early warning, consent/evidence controls, prudential reporting, wilful-defaulter evidence, funding concentration, and impairment monitoring. |
| UBA Ghana forensic walkthrough | Failed-transaction resolution, real-time electronic fraud controls, customer-record quality, incident escalation, and resolution-first customer service. |

## Product principles - mandatory for every module

1. **Human decision owner.** Models recommend and prioritise; authorised bank staff approve credit, customer, fraud, and regulatory actions.
2. **Evidence by default.** Every meaningful decision retains source data, actor, timestamp, rationale, and immutable audit history.
3. **Tenant and country isolation.** A bank sees only its own scoped data; country rules and data-residency deployment choices remain explicit.
4. **Integration before replacement.** UCH works over read-only core-banking extracts, APIs, and controlled batch files. It does not require a bank to replace its core system.
5. **Measurable pilots.** Each pilot defines a baseline, target, owner, and acceptance test before it starts.
6. **Simple operator experience.** Staff start on Today, see role-relevant work, and open specialised workflows intentionally.

## Requirements map

| ID | Bank problem and required outcome | UCH status | Existing UCH coverage | Remaining build / acceptance measure |
|---|---|---|---|---|
| R-01 | Flag deteriorating facilities before they become NPLs. | **Partial** | Credit scoring, ML/default-risk endpoints, Portfolio Intelligence, Collections, and the NPL Early Warning Desk. | Backtest on a pilot bank's historical loan book; target: flag at least 70% of eventual NPLs 90+ days early; add workout/recovery-probability ranking. |
| R-02 | Prove consent before an instruction, tender, exchange, restructuring, or data pull executes. | **Partial** | Consent records, consent requests, maker-checker, audit chain, data sharing controls. | Build the Consent & Evidence Gate: action-specific consent templates, OTP/e-sign capture, expiry/revocation checks, and exportable court/examiner evidence pack. Target: zero in-scope action without valid consent. |
| R-03 | Detect forged documents, manipulated instructions, and identity mismatch. | **Partial** | Identity-verification records, fraud alerts, Ghana Card/API configuration, audit evidence hashes. | Build the Forgery Review Desk: document intake, OCR/signature/seal/metadata checks, confidence thresholds, manual review, and case escalation. Target: every failed or low-confidence file has an owned review outcome. |
| R-04 | Detect insider fraud and dual-control exceptions. | **Partial** | Maker-checker controls, audit trails, fraud-alert data model, role-based access. | Add behavioural analytics for overrides, dormant-account reactivation, teller/cash exceptions, staff rotation and investigation workflow. Target: high-risk exceptions are alerted and acknowledged within the bank SLA. |
| R-05 | Stop electronic, mobile-money, USSD, SIM-swap, agent, and account-takeover fraud quickly. | **Partial** | Fraud scoring, telco/alternative-data modules, alerts, audit logging. | Add real-time transaction-ingestion contract, rules/model scoring, hold/release controls, network/mule detection, and <60-second alert latency measurement. |
| R-06 | Resolve failed transfers, double debits, cash-dispense errors, and complaints in minutes rather than days. | **Partial** | Helpdesk/disputes, notifications, SMS/USSD rails, maker-checker, audit history. | Build the Complaint Resolution Engine: transaction evidence lookup, deterministic reversal eligibility, SLA clock, customer updates, human exception queue, English/Twi support. Target: at least 60% of pilot-scope cases auto-resolved. |
| R-07 | Monitor CAR, liquidity, deposit concentration, impairment, and regulatory breaches before they become sanctions. | **Partial** | Regulatory dashboards, reporting exports, Portfolio Intelligence, platform metrics, and the maker-checker Funding & Prudential Radar. | Connect approved finance/core feeds, add runoff/scenario alerts and a monthly recovery-report workflow. Target: no missed in-scope filing deadline or pre-breach alert. |
| R-08 | Expand safe SME/private credit despite thin files and fragmented data. | **Partial** | Alternative/telco data, open-banking profiles, decision engine, credit scoring. | Package an SME Credit Decision pilot with explainable scorecards, consented data connectors, policy rules, and manual credit-officer approval. |
| R-09 | Reduce regulatory reporting workload and produce examiner-ready evidence. | **Partial** | BoG/CBN/CBK/BSL export modules, audit trail, data-quality controls, regulatory compliance views, and the maker-checker RegTech Evidence Pack filing calendar. | Add directive-to-control mapping, automated escalations, validated evidence attachment/retention, wilful-defaulter workflow, and bank-approved regulator integrations. Target: zero late or materially incorrect pilot filings. |
| R-10 | Provide local, resolution-first customer support without a misleading chatbot. | **Partial** | AI Command Center, Helpdesk, SMS/USSD foundations, and consumer-authenticated English transaction-status updates. | Build narrow account-freeze and complaint-status journeys, retrieval-lock answers to approved bank content, require human handoff for exceptions, and add bank-approved Twi content. Measure resolution and CSAT, not deflection. |

## Current delivery order

1. **Foundation and security - complete for the current build:** role-based Today page, workspace navigation, MFA onboarding, passkey support, reset/invite flow, tenant/country scope, audit controls.
2. **NPL Early Warning Desk - live first slice:** live arrears queue with direct Collections handoff. Next: historical backtesting and workout ranking.
3. **Forgery Review Desk - now building:** joins document/identity verification, consent evidence, fraud alerts, review status, and audit evidence.
4. **Complaint Resolution Engine - next:** a focused failed-transaction flow before any broad customer chatbot.
5. **Real-time Fraud Monitor and Prudential Radar - integration phase:** requires each pilot bank's approved transaction/core-banking data contract.
6. **RegTech Evidence Pack and country-pack rollout:** Ghana first, then regulator/country specific implementation packs.

## Pilot acceptance checklist

Before any bank pilot is marked successful, UCH must show:

- named bank owner, process owner, and security owner;
- documented data sources and data-processing basis;
- role and approval policy configured;
- baseline and measurable success target;
- audit/evidence export verified by the bank;
- exception, outage, and human-handoff path tested;
- data retention, deletion, and backup/restore approach agreed;
- no unapproved production action taken automatically.
