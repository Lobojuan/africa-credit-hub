# East & West Africa Regional Overview — Universal Credit Hub

**Audience:** Pan-regional investors, multi-country development banks (AfDB, IFC), pan-African lenders, and strategic partners
**Date:** May 2026 | Version 1.0 | Confidential

---

## Opening Statement

> "Africa's credit infrastructure gap costs the continent an estimated $330 billion in unrealised lending opportunity every year. Yet today, a bank operating in both Lagos and Nairobi must navigate two separate bureau regimes, two data-protection frameworks, and two entirely different regulatory reporting formats — often with two siloed internal teams. Universal Credit Hub eliminates that friction. What you are about to see is a single platform that is already live and purpose-built for five of Africa's highest-priority credit markets: Ghana, Nigeria, Kenya, South Africa, and Côte d'Ivoire. One login. One risk engine. One compliance layer. Fifty-four countries ready."

---

## Five-Country Comparison at a Glance

| Country | Regulator | Currency | Data Protection Law | UCH Key Differentiator | UCH Status |
|---|---|---|---|---|---|
| 🇬🇭 Ghana | Bank of Ghana (BoG) | GHS – Ghanaian Cedi | Data Protection Act 2012 (Act 843) | BOG Consent Layer pre-wired to Act 843; MTN MoMo / M-Pesa alternative data scoring | Live |
| 🇳🇬 Nigeria | Central Bank of Nigeria (CBN) + NDPC | NGN – Nigerian Naira | Nigeria Data Protection Act 2023 (NDPA) | BVN / NIN identity verification bridge; PENCOM pension linkage; CBN CRMS export format | Live |
| 🇰🇪 Kenya | Central Bank of Kenya (CBK) + OPC | KES – Kenyan Shilling | Kenya Data Protection Act 2019 | M-Pesa transaction scoring; CRB Kenya-format credit report; OPC consent workflow | Live |
| 🇿🇦 South Africa | National Credit Regulator (NCR) + FSCA | ZAR – South African Rand | POPIA 2020 (Protection of Personal Information Act) | NCA-compliant credit agreements; POPIA Section 11 consent gating; SARB regulatory reports | Live |
| 🇨🇮 Côte d'Ivoire | BCEAO + DGI | XOF – West African CFA Franc | Loi n° 2013-450 (Données Personnelles) | BCEAO 2018 regulation compliance; WAEMU shared credit pool; Loto Fiscal DGI integration | Live |

---

## Market Opportunity Overview

| Market | Banked Adults | Active MFIs & Banks | Est. Addressable Credit Volume (USD) | UCH NPL Reduction Potential |
|---|---|---|---|---|
| Ghana | ~50% | 600+ institutions | $12 billion | 15–22% NPL reduction |
| Nigeria | ~45% | 900+ institutions | $65 billion | 18–25% NPL reduction |
| Kenya | ~82% | 500+ institutions | $28 billion | 12–18% NPL reduction |
| South Africa | ~80% | 1,200+ institutions | $180 billion | 8–14% NPL reduction |
| Côte d'Ivoire | ~35% | 300+ WAEMU institutions | $8 billion | 20–28% NPL reduction |
| **Combined** | | **3,500+ institutions** | **~$293 billion** | |

---

## Regulatory Compliance Matrix

| Compliance Requirement | Ghana (BoG) | Nigeria (CBN/NDPC) | Kenya (CBK/OPC) | South Africa (NCR/FSCA) | CIV (BCEAO/DGI) |
|---|---|---|---|---|---|
| Borrower Consent Gating | Act 843 BOG Layer | NDPA 2023 | DPA 2019 OPC flow | POPIA S.11 | Loi 2013-450 |
| Regulator Export Format | BoG CSV/XML | CBN CRMS XML | CRB Kenya format | NCR format | BCEAO XML |
| Data Residency | Ghana-only (configurable) | Nigeria-only (configurable) | Kenya-only (configurable) | SA-only (configurable) | WAEMU region |
| Credit Score Scale | 300–850 (international) | 300–850 (international) | 300–850 (international) | 300–850 (international) | 300–850 (international) |
| AML / KYC Linkage | BoG AML Directive | EFCC / NFIU | CBK AML Guidelines | FICA 2001 | CENTIF / BCEAO |
| Blockchain Audit Anchoring | ✓ | ✓ | ✓ | ✓ | ✓ |

---

## Talking Points: AfDB / IFC Multi-Country Development Bank Pitch

### Why Development Banks Choose UCH

> "The AfDB's own Financial Inclusion Strategy 2024–2030 identifies credit infrastructure fragmentation as one of the top-three blockers to SME lending growth across the continent. UCH is the only platform that addresses this at the infrastructure layer, not the application layer."

**For AfDB stakeholders:**
- UCH's 54-country jurisdiction engine maps directly to AfDB's regional member country (RMC) portfolio. Every UCH deployment is additive — data from a new country is immediately shareable under PAPSS and SATA protocols.
- Development finance institutions disbursing programme loans can run soft-pull pre-qualification across all five countries from a single API call — no country-specific integration work per lender.
- UCH's regulatory reporting module pre-formats data for the AfDB's own financial-stability surveillance dashboards, reducing the quarterly reporting burden on beneficiary banks.
- All data sovereignty rules are enforced at the platform layer — data for Nigerian borrowers never leaves Nigeria unless explicit cross-border consent is granted. This satisfies AfDB's data-governance covenants without custom engineering.

**For IFC stakeholders:**
- IFC's MSME Finance Gap research ($5.2 trillion global gap, $335 billion in SSA) maps directly to UCH's target borrower segment: thin-file SMEs and emerging consumers with mobile-money footprints.
- UCH's alternative data scoring engine ingests M-Pesa, MTN MoMo, Airtel Money, and utility payment streams — the exact data types IFC's DFS teams prioritise in their portfolio investees.
- Transaction-based SaaS pricing aligns with IFC's preference for capex-light technology partnerships: institutions pay per inquiry, not per seat or per country.
- UCH can provide IFC portfolio companies with a consolidated credit intelligence dashboard across all five covered markets, enabling cross-country portfolio risk monitoring from day one.

---

## Talking Points: Pan-African Bank Pitch

### Pitching to a Bank Operating in Multiple UCH Markets

**Opening hook:**
> "Right now, your Ghana desk and your Nigeria desk are doing credit checks from two completely different systems. Your risk committee is reconciling two different NPL metrics with two different methodologies. UCH gives you one borrower record that travels with the customer — cross-border, consented, and regulatorily clean."

**Key cross-border capabilities to demonstrate:**
- **Cross-border entity resolution**: UCH's fuzzy matching engine resolves duplicate borrower identities across country deployments, flagging when the same corporate borrower has credit exposure in multiple jurisdictions.
- **PAPSS integration**: Payment settlements tracked through the Pan-African Payment and Settlement System feed directly into the UCH borrower's repayment history, enriching the credit profile without manual data entry.
- **SATA data-sharing protocol**: Under the Smart Africa Telecommunications Alliance framework, telco alternative data flows cross-border with borrower consent, extending coverage to diaspora and cross-border traders.
- **Unified regulatory dashboard**: A pan-African bank's compliance team sees all five regulatory reporting queues in one interface — with jurisdiction-specific export formats generated on demand.

**Objection handling:**
- *"We already have a bureau relationship in Nigeria."* — UCH is not a replacement; it is a consolidation layer. It ingests data from existing bureau partners and surfaces a unified risk view.
- *"How do you handle data residency?"* — Every data object in UCH carries a jurisdiction tag. Cross-border queries require explicit borrower consent and are blocked at the API layer without it.
- *"What does onboarding take?"* — A single-country deployment can be live in 6–8 weeks. For a bank already in one UCH country, adding a second country is a configuration change, not a new implementation.

---

## UCH Platform Differentiators vs. Global Bureaus

| Capability | UCH | Experian Africa | TransUnion Africa | CreditInfo |
|---|---|---|---|---|
| African-native jurisdiction engine | 54 countries built-in | Select markets | Select markets | Select markets |
| Explainable AI scoring (300–850) | ✓ Full narrative | Partial | Partial | No |
| Alternative data (mobile money / telco) | ✓ Native | Limited | Limited | No |
| Collateral registry integration | ✓ Unified | No | No | No |
| Loto Fiscal / DGI integration | ✓ (CIV live) | No | No | No |
| Blockchain audit anchoring | ✓ | No | No | No |
| Maker-checker regulatory workflow | ✓ | No | Partial | No |
| Open Banking profile management | ✓ | No | No | No |
| Consumer self-service portal | ✓ Full PWA | Limited | Limited | No |
| Transaction-based SaaS pricing | ✓ | Seat-based | Seat-based | Licence-based |
| Source-available codebase | ✓ | No | No | No |

---

## Suggested Demo Flow for Multi-Country Pitches

### Step 1 — Platform Overview (5 min)

**What to do:** Log in with `demo_admin / TestPass2026!` and show the workspace chooser (Credit Bureau → Collateral Registry → Loto Fiscal).

**Talking points:**
- "This is a single login for three product lines — relevant to any institution that operates lending, collateral management, and fiscal compliance in the same group."
- "The workspace switcher enforces data isolation at both the UI and API layers. A user scoped to Credit Bureau cannot query Collateral Registry records, even if they try to call the API directly."

---

### Step 2 — Five-Country Coverage on the Africa Map (3 min)

**What to do:** Navigate to the Dashboard. Show the interactive SVG Africa map highlighting all five UCH countries.

**Talking points:**
- "Every shaded country is a live jurisdiction — with that country's regulatory rules, currency handling, and data-protection consent layer pre-configured."
- "Clicking a country drills down to country-level KPIs: total borrowers, average credit score, monthly inquiry volume, and NPL rate."
- "The remaining unshaded countries are configuration-ready — we can activate a new country jurisdiction in weeks, not months."

---

### Step 3 — Explainable AI Credit Score (5 min)

**What to do:** Open any borrower record. Show the 300–850 gauge, the AI narrative explanation, and the score factor breakdown.

**Talking points:**
- "Across all five markets, the same 300–850 scale is used — so your credit committee in Johannesburg and your team in Lagos are using the same risk language."
- "The AI narrative explains in plain language why a score is what it is — meeting the explainability requirements of POPIA, NDPA, Kenya DPA, and Act 843 simultaneously."
- "The Score Simulator lets the borrower's relationship manager model 'what if' scenarios — show the client what clearing one delinquency would do to their score."

---

### Step 4 — Cross-Border Consent and Regulatory Export (4 min)

**What to do:** Navigate to Data Sharing. Show the cross-product consent toggle and the regulatory export centre.

**Talking points:**
- "This consent toggle is the mechanism that enables cross-border data queries — a borrower grants consent, and the system records it immutably in the blockchain audit log."
- "The export centre generates country-specific formats on demand — BoG format for Ghana, CBN CRMS for Nigeria, CRB format for Kenya — from the same underlying dataset."

---

### Step 5 — Collateral Registry (3 min)

**What to do:** Switch to the Collateral Registry workspace. Show a cross-country lien search.

**Talking points:**
- "A pan-African bank can run a single lien search across all five country registries simultaneously. UCH returns priority rankings, encumbrance status, and the registering institution — in one response."
- "PMSI priority is calculated per-country, using that country's commercial law rules, so your legal team gets jurisdiction-accurate results without manual research."

---

## Investment & Partnership Summary

| Metric | Value |
|---|---|
| Countries live | 5 (GH, NG, KE, ZA, CI) |
| Total addressable jurisdictions | 54 African nations |
| Combined institution base (5 countries) | 3,500+ lenders, MFIs, fintechs |
| Combined addressable credit volume | ~$293 billion |
| Platform version | UCH v2.8 |
| AI models in production | Claude Opus (Anthropic) + GPT-4o (OpenAI) |
| Audit trail | Blockchain-anchored, immutable |
| Deployment model | Multi-tenant SaaS + Private Cloud |
| Pricing model | Transaction-based (per inquiry + per report) |
| Typical deployment timeline | 6–8 weeks per country |

---

## Next Steps

- [ ] Schedule live platform demo with your regional team (contact: demo@universalcredithub.com)
- [ ] Request country-specific term sheet for your target market(s)
- [ ] Review regulatory compliance documentation package for your jurisdiction(s)
- [ ] Request API sandbox access for technical due diligence
- [ ] Schedule introductory call with UCH country managers for GH, NG, KE, ZA, or CIV

---

*This document is confidential and intended solely for the named recipient. © 2026 Universal Credit Hub Ltd. All rights reserved. Registered in Ghana.*
