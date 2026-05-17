# Côte d'Ivoire Demo Playbook — Universal Credit Hub

**Audience:** Côte d'Ivoire financial-sector prospects, BCEAO supervisors, DGI/Loto Fiscal stakeholders, and investor stakeholders
**Date:** May 2026 | Version 1.0 | Confidential

---

## Opening Statement

> "La Côte d'Ivoire est la plus grande économie de la zone UEMOA — et le hub naturel de toute l'Afrique de l'Ouest francophone. Pourtant, les prêteurs opèrent encore avec des données emprunteurs fragmentées et cloisonnées. Universal Credit Hub change cela. Dans les 20 prochaines minutes, je vais vous montrer une plateforme opérationnelle qui consolide les informations de crédit dans toutes les institutions, génère des scores de risque IA explicables, respecte les exigences de la BCEAO et intègre nativement les données fiscales du Loto Fiscal ivoirien — prête à l'emploi. Let me show you why Côte d'Ivoire is UCH's flagship WAEMU market."

---

## Key Côte d'Ivoire Market Facts

| Metric | Value | UCH Relevance |
|---|---|---|
| GDP (2024) | USD 68 billion | Largest economy in the WAEMU / UEMOA zone |
| Population | 28 million+ | Fastest-growing credit market in francophone West Africa |
| Banked population | ~40% of adults | UCH alternative-data scoring covers the unbanked 60% |
| Mobile money users | 20 million+ | UCH ingests Orange Money and MTN MoMo CI transaction data |
| Registered banks and MFIs | 150+ institutions | Each is a UCH data provider and subscriber |
| Non-performing loan ratio | ~11% (banking sector, 2024) | UCH's risk engine directly targets NPL reduction |
| Data protection framework | Loi n°2013-450 relative à la protection des données à caractère personnel | UCH consent layer is pre-wired to this law's requirements |
| Credit & banking regulator | BCEAO (Banque Centrale des États de l'Afrique de l'Ouest) | UCH regulatory exports in BCEAO/UMOA-Titres formats |
| Fiscal authority | Direction Générale des Impôts (DGI) | UCH integrates Loto Fiscal fiscal data natively |
| Local currency | XOF — Franc CFA de l'Afrique de l'Ouest | UCH natively handles XOF alongside 40+ African currencies |

---

## Step-by-Step Demo Flow

### Step 1 — Platform Login & Workspace Overview

**What to do:** Navigate to the platform login page. Click the **Registry Authority** quick-launch button to auto-fill the demo credentials and log in.

**Talking points:**
- "The one-click demo login mirrors an SSO integration with your institution's Azure AD or Google Workspace."
- "The workspace chooser gives a Platform Owner access to all three products: Bureau de Crédit, Registre des Sûretés Mobilières, and Loto Fiscal — from a single login."
- "Le contrôle d'accès basé sur les rôles est appliqué à la fois dans l'interface et dans l'API — un prêteur ne voit jamais les données brutes des emprunteurs d'un autre prêteur."
- "The platform is fully localised in French — every page, every report, every error message. This matters for your team in Abidjan."

**Credential table:**

| Compte | Mot de passe | Rôle | Accès |
|---|---|---|---|
| demo_admin | TestPass2026! | Platform Owner | Les 3 workspaces |
| credit_admin | Credit26 | Admin Bureau de Crédit | Bureau de Crédit uniquement |
| johndoe | SecuredCreditor2026! | Créancier Garanti | Crédit + Sûretés |
| registry_admin | TestPass2026! | Autorité Registre | Bureau de Crédit |

---

### Step 2 — Tableau de Bord du Bureau de Crédit

**What to do:** After login, navigate to the main **Dashboard**. Point out the KPI strip and the interactive Africa map.

**Talking points:**
- "Ce tableau de bord se met à jour en temps réel — nombre total d'emprunteurs, encours de crédit, nouvelles demandes mensuelles, et score moyen de la plateforme."
- "La carte SVG interactive de l'Afrique affiche une couverture de 54 pays. Cliquez sur la Côte d'Ivoire pour descendre aux métriques par district — les 14 districts ivoiriens sont représentés."
- "All figures are SQL-aggregated on the server — no client-side approximations. BCEAO examiners can trust these numbers."
- "The 300–850 credit score scale is aligned to international standards — your risk analysts do not require retraining."

---

### Step 3 — Recherche d'Emprunteur et Rapport de Crédit

**What to do:** Go to **Search**. Search for a sample borrower by CNI (Carte Nationale d'Identité) or name. Open the credit report.

**Talking points:**
- "UCH résout les emprunteurs par CNI, passeport, et numéro de contribuable DGI simultanément — une seule requête retourne un profil complet."
- "La correspondance floue d'entités signifie qu'un nom mal orthographié ou un format d'identifiant différent renvoie quand même au bon dossier."
- "The credit report shows a 300–850 score with a full explainable AI breakdown — in French, which your credit officers can act on directly."
- "Notez la bannière de consentement. La loi n°2013-450 exige que l'emprunteur donne son consentement avant que son profil complet soit divulgué. Ce flux de consentement est intégré nativement."

---

### Step 4 — Insights IA et Narrative de Risque

**What to do:** On the open credit report, scroll to the **AI Insights** section. Show the dual-AI risk narrative.

**Talking points:**
- "UCH exécute deux modèles d'IA indépendants — Claude (Anthropic) et GPT-4o (OpenAI) — et synthétise leurs résultats en un seul narratif de risque. Cela élimine les biais d'un seul modèle."
- "Le narratif explique le score en français clair. Vos agents de crédit à Abidjan comprennent directement la justification du risque."
- "Every factor, its weight, and its direction are visible — this meets the BCEAO's emerging AI transparency requirements for credit institutions."
- "Orange Money and MTN MoMo CI transaction regularity are factored in — giving a score to borrowers who have no formal bank history."

---

### Step 5 — Loto Fiscal Integration (Côte d'Ivoire-Specific)

**What to do:** Switch workspace to **Loto Fiscal**. Show the DGI government admin dashboard, draw management, and merchant compliance scorecard.

**Talking points:**
- "This is a feature unique to the Côte d'Ivoire deployment. UCH integrates the Loto Fiscal system — the DGI's receipt-lottery mechanism for VAT compliance — directly into the platform."
- "Le tableau de bord DGI affiche en temps réel les recettes fiscales, la TVA collectée, les tirages, et les paiements de gains — par district et par commerçant."
- "The merchant compliance scorecard uses a five-rule fraud engine to score every participating merchant from 0 to 100. A compliance officer can identify a suspicious merchant in seconds."
- "The regional heatmap covers all 14 districts of Côte d'Ivoire — showing fiscal receipt density and VAT uplift attribution by geography."
- "Winner notifications, T-24h draw reminders, and prize-claim instructions are sent automatically via SMS in French — or English, Portuguese, Arabic, or Swahili for regional participants."

---

### Step 6 — Registre des Sûretés Mobilières

**What to do:** Switch workspace to **Collateral Registry**. Show a registered pledge and the priority ranking screen.

**Talking points:**
- "L'Acte Uniforme OHADA portant organisation des sûretés (2010, révisé 2022) régit les sûretés mobilières dans les 17 États membres — UCH est le registre numérique qui met cela en pratique."
- "Un créancier peut effectuer une recherche de gage par numéro de série, numéro de registre du commerce, ou CNI — en moins de 2 secondes."
- "La priorité est automatique — le premier enregistrement l'emporte. Pas d'adjudication manuelle, pas d'appels au greffe."
- "Les certificats portent un lien de vérification par QR code — utile pour les notaires, les avocats, et les huissiers de justice."

---

### Step 7 — Portail Consommateur

**What to do:** Log out and navigate to the **Consumer Portal**. Show the credit score lookup, dispute filing, and credit freeze toggle.

**Talking points:**
- "Les emprunteurs peuvent consulter leur score, voir qui a accédé à leurs données, et déposer des réclamations — sans appeler votre centre d'appels."
- "Le toggle de gel de crédit bloque toute nouvelle consultation — les emprunteurs gardent le contrôle de leurs données conformément à la loi n°2013-450."
- "Pre-qualification offers show the borrower which lenders they are likely to qualify with, at what rate — driving demand back into your institution."
- "The portal is fully mobile-optimised — 90% of Ivorian consumers will access it via smartphone."

---

## Closing Statement

> "Ce que vous avez vu aujourd'hui n'est pas un prototype — c'est une plateforme de niveau production gérant des données réelles à grande échelle. UCH est déjà conçu pour les exigences de la BCEAO, la loi sur la protection des données personnelles n°2013-450, l'intégration native du Loto Fiscal DGI, la zone OHADA pour les sûretés mobilières, et le règlement transfrontalier PAPSS. Pour la Côte d'Ivoire, UCH n'est pas seulement un bureau de crédit — c'est une infrastructure fiscale et financière unifiée. L'intégration de votre institution prend quatre étapes : accord de partage de données, provisionnement des identifiants API, chargement des données historiques, et mise en production. Notre équipe peut vous mettre en service dans les 30 jours. Quelles questions avez-vous?"

---

## Tough Questions & Suggested Responses

| Question | Suggested Response |
|---|---|
| "Comment gérez-vous le consentement sous la loi n°2013-450?" | "Every data access is tied to a granular consent record. The consent layer is pre-wired to the ARTCI's enforcement requirements. Every grant, use, and revocation is timestamped in our blockchain-anchored audit log and exportable for ARTCI reporting." |
| "How does UCH interface with the BCEAO's centralised credit risk database (Centrale des Risques)?" | "UCH can export in the BCEAO Centrale des Risques XML schema format. We also ingest the monthly CR feed to cross-validate our records — institutions that submit to the Centrale can be reconciled automatically." |
| "What about OHADA legal alignment for collateral?" | "The Collateral Registry is designed around the Acte Uniforme OHADA on secured transactions. Priority rules, registration forms, and certificate formats follow OHADA standards across all 17 member states — not just Côte d'Ivoire." |
| "Can the platform support our Loto Fiscal pilot?" | "Yes — the Loto Fiscal module is already live. It includes draw management, merchant compliance scoring, DGI regulatory reporting, SMS winner notifications in 5 languages, and a USSD interface compatible with Africa's Talking gateways." |
| "What about data sovereignty?" | "UCH supports private-cloud deployment within Côte d'Ivoire — on-premises in your own data centre in Abidjan, or on a regional cloud node within the WAEMU zone. Data never leaves Ivorian jurisdiction unless you explicitly enable cross-border sharing." |
| "How long does onboarding take?" | "30 days: accord de partage de données (semaine 1), identifiants API et tests sandbox (semaine 2), chargement des données historiques (semaine 3), UAT et mise en production (semaine 4)." |
| "What does it cost?" | "Transaction-based pricing — you pay per inquiry. Founding data partners in the WAEMU zone receive a 40% discount on inquiry fees for 24 months in exchange for historical data contribution." |
| "What if a borrower disputes our data?" | "The dispute workflow is built in. A borrower raises a dispute via the consumer portal in French; your compliance team receives a task with a 30-day SLA countdown; resolution is logged and the credit report updated automatically." |

---

## Night Before Checklist

- [ ] Confirm demo environment is accessible at the platform URL
- [ ] Verify demo_admin and registry_admin credentials work (TestPass2026!)
- [ ] Switch the platform language to French before the presentation
- [ ] Check that the Africa map loads and Côte d'Ivoire is highlighted with district detail
- [ ] Run a sample CNI-linked borrower search — confirm the credit report generates with French AI insights
- [ ] Navigate to Loto Fiscal — confirm DGI dashboard, regional heatmap, and merchant scorecard load
- [ ] Test the Collateral Registry lien search with a sample RCCM number
- [ ] Download a sample PDF credit report — confirm French branding and AI narrative appear
- [ ] Open the Consumer Portal in an incognito window — confirm French UI and mobile layout
- [ ] Have the BCEAO regulatory export page ready to navigate to quickly
- [ ] Charge your laptop. Have an Orange CI hotspot as backup internet.
- [ ] Bring printed one-page tear-sheet for each attendee (UCH overview + contact details en français)
- [ ] Set your alarm. Presentation is at 10:00 AM GMT. Arrive 20 minutes early to set up the screen share.

---

*Ce document est confidentiel et destiné uniquement au destinataire nommé. © 2026 Universal Credit Hub Ltd. Tous droits réservés.*
