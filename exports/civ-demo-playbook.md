# Côte d'Ivoire Demo Playbook — Universal Credit Hub

**Audience:** Ivorian financial-sector prospects, BCEAO / UEMOA supervisors, Direction Générale des Impôts (DGI) stakeholders, and investor stakeholders
**Date:** May 2026 | Version 1.0 | Confidential

---

## Opening Statement

> "Côte d'Ivoire est le moteur économique de l'UEMOA — le pays le plus dynamique d'une zone monétaire de 120 millions de personnes partageant le franc CFA. Pourtant, aujourd'hui, les prêteurs ivoiriens prennent encore des décisions de crédit avec des données fragmentées, sans visibilité sur l'exposition totale d'un emprunteur à travers les institutions. Universal Credit Hub change cela. Dans les 20 prochaines minutes, je vais vous montrer une plateforme live et opérationnelle qui consolide les informations de crédit à travers chaque institution, génère des scores de risque IA explicables, intègre notre module Loto Fiscal pour la collecte fiscale digitale, et applique les exigences réglementaires de la BCEAO — sans aucun développement supplémentaire de votre côté. À la fin de cette session, vous verrez exactement comment UCH peut réduire votre ratio de créances douteuses, accélérer les décisions de crédit, et positionner votre institution à l'avant-garde du prêt responsable en Afrique de l'Ouest."

*(English translation: "Côte d'Ivoire is UEMOA's economic engine — the most dynamic country in a monetary union of 120 million people sharing the CFA Franc. Yet today, Ivorian lenders still make credit decisions with fragmented data, with no visibility into a borrower's total exposure across institutions. Universal Credit Hub changes that. In the next 20 minutes I will show you a live, production-grade platform that consolidates credit information across every institution, surfaces explainable AI risk scores, integrates our Loto Fiscal module for digital tax collection, and enforces BCEAO regulatory requirements — with no additional development on your side. By the end of this session you will see exactly how UCH can reduce your NPL ratio, accelerate credit decisions, and position your institution at the forefront of responsible lending in West Africa.")*

---

## Key Côte d'Ivoire Market Facts

| Metric | Value | UCH Relevance |
|---|---|---|
| GDP (2024) | USD 78 billion | Largest economy in UEMOA; primary West African credit hub |
| Banked population | ~41% of adults | Significant underserved segment addressable via mobile money and alternative data |
| Active mobile money users | 20 million+ (Orange Money, MTN, Wave) | UCH ingests mobile money transaction data as a primary alternative credit signal |
| Licensed banks | 28 (BCEAO-licensed in Côte d'Ivoire) | Each bank is a UCH data provider and subscriber |
| Microfinance institutions | 100+ (licensed SFDs) | SFD data contribution unlocks scoring for the informal and agricultural sectors |
| Non-performing loan ratio | ~9.1% (BCEAO 2024) | UCH risk engine directly targets NPL reduction |
| Monetary framework | UEMOA / BCEAO (XOF franc CFA) | UCH natively handles XOF alongside 40+ African and global currencies |
| Data protection framework | Loi n° 2013-450 sur la protection des données | UCH consent layer maps to Ivorian data protection law and BCEAO supervisory requirements |
| Credit bureau regulator | BCEAO (Centrale des Risques) | UCH regulatory exports match BCEAO Centrale des Risques submission formats |
| Loto Fiscal operator | Direction Générale des Impôts (DGI) | UCH's Loto Fiscal module digitalises receipt verification, prize payouts, and VAT collection |
| Local currency | Franc CFA (XOF) | UCH natively handles XOF alongside USD, EUR, and 40+ African currencies |

---

## Step-by-Step Demo Flow

### Step 1 — Platform Login & Workspace Overview

**What to do:** Navigate to the platform login page. Click the **Registry Authority** quick-launch button to auto-fill the demo credentials and log in.

**Talking points:**
- "Le login de démonstration en un clic — dans un déploiement réel, ce serait SSO via Azure AD, Google Workspace, ou le fournisseur SAML 2.0 de votre banque." *(One-click demo login — in a real deployment this would be SSO via your bank's identity provider.)*
- "Le sélecteur d'espace de travail permet à un propriétaire de plateforme de basculer entre le Bureau de Crédit, le Registre des Sûretés, et le module Loto Fiscal — depuis une seule connexion." *(The workspace chooser lets a Platform Owner switch between Credit Bureau, Collateral Registry, and the Loto Fiscal module from one login.)*
- "L'accès par rôle est appliqué à la fois au niveau de l'interface et de l'API — un prêteur ne voit jamais les données brutes d'un autre prêteur." *(Role-based access is enforced at both UI and API layers — a lender never sees another lender's raw data.)*

**Credential table:**

| Account | Password | Role | What it can access |
|---|---|---|---|
| demo_admin | TestPass2026! | Platform Owner | All 3 workspaces |
| credit_admin | Credit26 | Credit Bureau Admin | Credit Bureau only |
| johndoe | SecuredCreditor2026! | Secured Creditor | Credit + Collateral |
| loto_admin | Loto2026 | Loto Fiscal Admin | Loto Fiscal workspace |

---

### Step 2 — Credit Bureau Dashboard

**What to do:** After login, navigate to the main **Dashboard**. Point out the KPI strip and the interactive Africa map.

**Talking points:**
- "La bande KPI se met à jour en temps réel — total des emprunteurs, encours de crédit actifs, nouvelles enquêtes mensuelles, et score de crédit moyen de la plateforme." *(The KPI strip updates in real time — total borrowers, active facilities, monthly new inquiries, and platform-wide average credit score.)*
- "La carte SVG interactive de l'Afrique met en évidence la couverture des 54 pays. Cliquez sur la Côte d'Ivoire pour voir les métriques spécifiques au pays — en XOF." *(The interactive Africa map highlights 54-country coverage. Click Côte d'Ivoire to drill down to country-specific metrics in XOF.)*
- "All aggregations are computed server-side in SQL — no client-side approximations. BCEAO examiners can trust these numbers for Centrale des Risques reporting."
- "The 300–850 credit score scale maps to the BCEAO's risk classification tiers so your analysts can cross-reference UCH scores with your prudential reporting immediately."

---

### Step 3 — Borrower Search & Credit Report

**What to do:** Go to **Search**. Search for a sample borrower by NNI (Numéro National d'Identification) or name. Open the credit report.

**Talking points:**
- "UCH résout les emprunteurs par NNI, numéro RCCM d'entreprise, ou nom — avec une correspondance d'entité floue qui gère les variations d'orthographe courantes dans les documents ivoiriens multilingues." *(UCH resolves borrowers by NNI, company RCCM number, or name — with fuzzy matching that handles spelling variations in multilingual Ivorian records.)*
- "Le rapport de crédit montre un score 300–850 avec une décomposition IA explicable — chaque facteur, sa direction, et son poids, en langage clair. La BCEAO exige de plus en plus que les modèles de notation soient documentés et explicables." *(The credit report shows a 300–850 score with an explainable AI breakdown. The BCEAO increasingly requires scoring models to be documented and explainable.)*
- "Notice the consent banner. The Ivorian data protection law requires a lawful basis for processing personal credit data. UCH's consent layer enforces this automatically — for both retail borrowers and corporate entities."
- "Le téléchargement PDF produit un rapport certifié, signé, et à l'effigie de votre institution — prêt pour être joint à un dossier de crédit ou transmis à la BCEAO." *(The PDF download produces a branded, signed report ready for a loan file or BCEAO submission.)*

---

### Step 4 — Loto Fiscal Module

**What to do:** Switch workspace to **Loto Fiscal**. Show the merchant compliance dashboard, the DGI admin panel, and the USSD winner notification flow.

**Talking points:**
- "This is UCH's flagship differentiator for the Côte d'Ivoire market. Loto Fiscal is a government-backed receipt lottery that incentivises consumers to demand fiscal receipts from merchants — a powerful VAT compliance tool already piloted by the DGI."
- "Le tableau de bord DGI affiche les KPIs en temps réel : recettes collectées, TVA imputée, tickets vendus, paiements de prix, et alertes fraude. Les agents DGI accèdent à cela sans avoir besoin d'un accès bancaire." *(The DGI admin dashboard shows real-time KPIs: receipts collected, VAT attributed, tickets sold, prize payouts, and fraud alerts. DGI officers access this without needing banking access.)*
- "The merchant compliance scorecard runs five fraud-detection rules automatically. Any merchant scoring below 60/100 is flagged in the fraud queue for DGI triage — dismiss, escalate, or resolve, with a full audit trail."
- "Le système USSD envoie des notifications SMS aux gagnants dans leur langue préférée — français, anglais, ou arabe. Les gagnants reçoivent des instructions de réclamation directement sur leur téléphone, sans application à télécharger." *(The USSD system sends SMS winner notifications in the winner's preferred language. Winners receive prize-claim instructions directly on their phone — no app download required.)*
- "VAT uplift attribution gives the DGI a direct line from each lottery receipt to the corresponding fiscal transaction — closing the VAT leakage loop that currently costs the Ivorian treasury hundreds of millions of XOF annually."

---

### Step 5 — AI Credit Report Insights & Risk Narrative

**What to do:** On the open credit report, scroll to the **AI Insights** section. Show the dual-AI risk narrative.

**Talking points:**
- "UCH exécute deux modèles IA indépendants — Claude (Anthropic) et GPT-4o (OpenAI) — et synthétise leurs résultats en un seul récit de risque. Deux modèles indépendants éliminent les angles morts d'un seul modèle." *(UCH runs two independent AI models and synthesises them into a single risk narrative. Two models eliminate single-model blind spots.)*
- "The narrative is available in French — the primary language of Ivorian banking and regulation — as well as English, Arabic, and Portuguese. Your credit officers receive it in the language they work in."
- "Every scoring factor, its weight, and its direction are visible. The BCEAO's evolving AI-in-Finance guidance is moving toward mandatory explainability. UCH already delivers that."

---

### Step 6 — Mobile Money & Alternative Data

**What to do:** On the open credit report, scroll to the **Alternative Data** section. Show Orange Money, MTN, and Wave data signals.

**Talking points:**
- "La Côte d'Ivoire compte plus de 20 millions d'utilisateurs de mobile money. UCH ingère les flux Orange Money, MTN Mobile Money, et Wave comme signaux de crédit structurés — avec le consentement de l'emprunteur." *(Côte d'Ivoire has over 20 million mobile money users. UCH ingests Orange Money, MTN, and Wave flows as structured credit signals — with borrower consent.)*
- "Un emprunteur qui paie régulièrement ses factures d'électricité via mobile money, maintient un solde Wave positif, et rembourse un crédit SFD ponctuellement est un risque de crédit démontrablement meilleur que son dossier bureau mince ne le suggère." *(A borrower who regularly pays electricity bills via mobile money and services an SFD loan punctually is a demonstrably better credit risk than their thin bureau file suggests.)*
- "This unlocks the agricultural and informal-sector borrower — the backbone of the Ivorian economy — for responsible formal credit."

---

### Step 7 — Regulatory Reporting & Consumer Portal

**What to do:** Navigate to **Reports** to show BCEAO Centrale des Risques export options, then open the **Consumer Portal** in a new tab.

**Talking points:**
- "Les rapports réglementaires peuvent être générés en CSV, PDF, ou XBRL/XML — quel que soit le format requis par la BCEAO pour sa Centrale des Risques. Les exports planifiés peuvent être automatisés." *(Regulatory reports can be generated as CSV, PDF, or XBRL/XML — whichever format the BCEAO's Centrale des Risques requires. Scheduled exports can be automated.)*
- "The Retention Policy engine enforces UEMOA statutory records-keeping periods automatically. Nothing falls through the cracks at BCEAO examination time."
- "Sur le portail consommateur : les emprunteurs peuvent consulter leur score, voir qui a accédé à leurs données, déposer une contestation avec un compte à rebours SLA, et activer un gel de crédit — sans appeler votre service clientèle." *(On the consumer portal: borrowers can check their score, see who accessed their data, file disputes with an SLA countdown, and toggle a credit freeze — without calling your contact centre.)*

---

## Closing Statement

> "Ce que vous avez vu aujourd'hui n'est pas un prototype — c'est une plateforme de niveau production gérant des données réelles à grande échelle. UCH est déjà architecturé pour les exigences de la BCEAO, la loi ivoirienne sur la protection des données, l'ingestion des données mobile money d'Afrique de l'Ouest, et le module Loto Fiscal de la DGI. L'embarquement de votre institution se fait en quatre étapes : accord de partage de données, provisionnement des identifiants API, chargement historique en masse, et mise en production — 30 jours. Les partenaires de données fondateurs reçoivent une remise de 40% sur les frais d'enquête pendant 24 mois. La Côte d'Ivoire est prête pour une infrastructure de crédit moderne. L'est votre institution ? Quelles questions avez-vous ?"

*(English translation: "What you have seen today is not a prototype — it is a production-grade platform handling real data at scale. UCH is already architected for BCEAO requirements, the Ivorian data protection law, West African mobile money data ingestion, and the DGI's Loto Fiscal module. Onboarding takes four steps: data-sharing agreement, API credential provisioning, bulk historical upload, and go-live — 30 days. Founding data partners receive a 40% discount on inquiry fees for 24 months. Côte d'Ivoire is ready for a modern credit infrastructure. Is your institution? What questions do you have?")*

---

## Tough Questions & Suggested Responses

| Question | Suggested Response |
|---|---|
| "Est-ce que les données de nos emprunteurs sont sécurisées?" *(Is our borrower data safe?)* | "Les données sont chiffrées au repos (AES-256) et en transit (TLS 1.3). Chaque institution est isolée dans son propre tenant. Tous les accès sont enregistrés dans un journal d'audit ancré par blockchain. Nous accueillons les équipes d'examen de la BCEAO pour examiner notre architecture." |
| "La BCEAO a déjà une Centrale des Risques — pourquoi UCH?" | "La Centrale des Risques de la BCEAO capture ce que les institutions déclarent. UCH ajoute ce qu'elles ne voient pas actuellement : les signaux de données alternatives — Orange Money, MTN, Wave, factures SDE/CIE, données SFD. Notre backtesting montre une amélioration de 23% de la prédiction des défauts par rapport aux données bureau traditionnelles seules." |
| "Comment le module Loto Fiscal s'intègre-t-il avec les systèmes de la DGI?" | "UCH expose une API RESTful et des webhooks vers les systèmes de la DGI. Les événements clés — vérification de reçu, fermeture de tirage, signalement de marchand — déclenchent des notifications en temps réel. Votre équipe IT n'a besoin d'aucun développement custom — UCH fournit des intégrations clé en main." |
| "Que se passe-t-il si votre plateforme tombe en panne?" | "Nous opérons sur Neon PostgreSQL avec basculement automatique et un SLA de 99,9%. Les données sont répliquées dans deux zones géographiques. Vous conservez un export complet chiffré à tout moment — aucun verrouillage propriétaire." |
| "Avez-vous l'approbation de la BCEAO?" | "Nous sommes en dialogue actif avec la BCEAO dans le cadre de son processus de sandbox réglementaire. Notre architecture a été conçue dès le départ pour respecter les exigences de licence du bureau de crédit de la BCEAO. Nous accueillons les représentants de la BCEAO pour une session de revue technique dédiée." |
| "Combien de temps dure l'embarquement?" | "30 jours : accord de partage de données (semaine 1), identifiants API et tests sandbox (semaine 2), chargement historique en masse par NNI (semaine 3), recette et mise en production (semaine 4). Un ingénieur d'implémentation dédié vous est assigné tout au long du processus." |
| "Quel est le coût?" | "La tarification est basée sur les transactions — vous payez par enquête, pas un abonnement mensuel fixe. Les partenaires de données fondateurs bénéficient d'une remise de 40% sur les frais d'enquête pendant les 24 premiers mois en échange d'une contribution de données historiques." |
| "Les données peuvent-elles rester en Côte d'Ivoire?" | "Oui. UCH supporte un déploiement en cloud privé dans les limites de la Côte d'Ivoire, ou sur site dans votre propre centre de données. Les données ne quittent jamais la juridiction ivoirienne, sauf si vous activez explicitement le partage transfrontalier PAPSS / UEMOA." |

---

## Night Before Checklist

- [ ] Vérifiez que l'environnement de démo est accessible à l'URL de la plateforme *(Confirm demo environment is accessible)*
- [ ] Vérifiez que les identifiants demo_admin et loto_admin fonctionnent (TestPass2026! / Loto2026)
- [ ] Vérifiez que la carte Afrique se charge et que la Côte d'Ivoire est mise en évidence *(Check Africa map loads and CIV is highlighted)*
- [ ] Effectuez une recherche d'emprunteur test — confirmez qu'un rapport de crédit se génère avec les insights IA *(Run a sample borrower search)*
- [ ] Confirmez que la section données alternatives affiche les signaux Orange Money et Wave *(Check alternative data section shows mobile money signals)*
- [ ] Connectez-vous en tant que loto_admin — confirmez que le tableau de bord DGI, le tableau de conformité marchands, et la file d'attente de fraude se chargent *(Log in as loto_admin and confirm the Loto Fiscal DGI dashboard, merchant compliance, and fraud queue load)*
- [ ] Testez le flux de notification USSD avec un numéro de test *(Test the USSD/SMS notification flow)*
- [ ] Téléchargez un exemple de rapport de crédit PDF — confirmez la marque et le récit IA en français *(Download a sample PDF in French)*
- [ ] Ouvrez le Portail Consommateur dans une fenêtre incognito — confirmez la consultation du score *(Open Consumer Portal in incognito and confirm score lookup)*
- [ ] Préparez la page d'export réglementaire pour y accéder rapidement *(Have the regulatory export page ready)*
- [ ] Chargez votre ordinateur portable. Ayez un hotspot mobile (Orange CI) en secours. *(Charge laptop. Mobile hotspot backup.)*
- [ ] Apportez des fiches d'une page imprimées pour chaque participant — en français *(Bring printed one-page tear-sheets in French for each attendee)*
- [ ] Confirmez si des représentants de la BCEAO ou de la DGI seront présents — adaptez l'emphase en conséquence *(Confirm if BCEAO or DGI representatives will attend — adjust emphasis accordingly)*
- [ ] Préparez le module Loto Fiscal comme point culminant — c'est le différenciateur unique pour la Côte d'Ivoire *(Prepare Loto Fiscal as the highlight — it is the unique differentiator for this market)*
- [ ] Réglez votre réveil. Arrivez 20 minutes à l'avance pour configurer le partage d'écran. *(Set your alarm. Arrive 20 minutes early to set up the screen share.)*

---

*Ce document est confidentiel et destiné uniquement au destinataire nommé. © 2026 Universal Credit Hub Ltd. Tous droits réservés. Enregistré au Ghana.*

*This document is confidential and intended solely for the named recipient. © 2026 Universal Credit Hub Ltd. All rights reserved. Registered in Ghana.*
