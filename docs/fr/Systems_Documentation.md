# Système de Hub Central de Données Inter-Juridictionnel et Registre de Crédit v1.1 — Documentation Système

**Préparé pour :** Systems In Motion Limited  
**Version du Document :** 1.2  
**Date :** Mars 2026  
**Classification :** Confidentiel

---

## Table des Matières

1. [Résumé Exécutif](#1-résumé-exécutif)
2. [Architecture du Système](#2-architecture-du-système)
3. [Pile Technologique](#3-pile-technologique)
4. [Modèle de Données](#4-modèle-de-données)
5. [Catalogue des Points d'Accès API](#5-catalogue-des-points-daccès-api)
6. [Architecture de Sécurité](#6-architecture-de-sécurité)
7. [Architecture de Déploiement](#7-architecture-de-déploiement)
8. [Points d'Intégration](#8-points-dintégration)
9. [Diagrammes de Flux de Données](#9-diagrammes-de-flux-de-données)
10. [Gestion des Erreurs](#10-gestion-des-erreurs)
11. [Performance](#11-performance)
12. [Surveillance et Journalisation](#12-surveillance-et-journalisation)

---

## 1. Résumé Exécutif

### 1.1 Objectif du Système

Le Système de Hub Central de Données Inter-Juridictionnel et Registre de Crédit est une plateforme web développée par Systems In Motion Limited pour la gestion des informations de crédit, des dossiers d'emprunteurs et de l'évaluation du risque de crédit à travers les banques commerciales, les institutions de microfinance et autres prestataires de services financiers. Le système permet la collecte centralisée, le partage et le reporting des données de crédit pour soutenir des décisions de prêt éclairées et la supervision réglementaire.

### 1.2 Juridictions Couvertes

Le système est conçu pour un déploiement panafricain couvrant quatre juridictions :

- **Ghana** — Cadre réglementaire de la Banque du Ghana
- **Éthiopie** — Cadre réglementaire de la Banque Nationale d'Éthiopie
- **Ouganda** — Cadre réglementaire de la Banque d'Ouganda
- **Libéria** — Cadre réglementaire de la Banque Centrale du Libéria

### 1.3 Capacités Clés

- **Gestion des Emprunteurs** — Enregistrement des emprunteurs individuels et corporatifs avec signalement PEP, suivi de l'éducation/emploi et liaison des parties liées (7 types incluant beneficial_owner)
- **Gestion des Comptes de Crédit** — Suivi des prêts multi-devises avec prise en charge des prêts sans intérêt, périodes de grâce, restructuration et gestion des radiations
- **Notation de Crédit** — Notation algorithmique (plage 300–850) avec codes de justification
- **Rapports de Crédit** — Rapports de crédit complets imprimables avec numéros de série, historique de paiement, jugements de tribunal et enregistrements de consentement
- **Flux de Travail Maker-Checker** — Principe des quatre yeux pour l'approbation des modifications de données avec prévention de l'auto-approbation
- **Gestion des Litiges** — Résolution des litiges suivie par SLA (2 jours financier, 5 jours non-financier)
- **Jugements de Tribunal** — Suivi des privilèges, faillites, poursuites et jugements civils/pénaux
- **Gestion du Consentement** — Consentement du sujet des données avec numéros de reçu et révocation
- **Gestion des Institutions** — Enregistrement des fournisseurs de données avec flux d'approbation
- **Facturation** — Gestion des factures et suivi des frais pour les fournisseurs de données
- **Téléversement par Lots** — Ingestion en masse de données JSON/CSV avec validation par enregistrement
- **API REST Externe** — Accès programmatique pour les institutions avec authentification par clé API
- **Analyses Réglementaires** — Ratios NPL, ventilations de portefeuille, suivi des violations SLA, exportation CSV
- **Internationalisation** — Prise en charge complète des langues anglaise, française et portugaise
- **Multi-Devises** — 18 devises panafricaines prises en charge
- **Piste d'Audit** — Journalisation complète des activités avec suivi des adresses IP et chaîne de hachage SHA-256 inviolable
- **Authentification Multi-Facteurs** — AMF basée sur TOTP via la bibliothèque otpauth
- **Correspondance Floue d'Entités** — Similarité par trigrammes PostgreSQL pg_trgm pour la détection des emprunteurs en double
- **Chatbot de Litiges** — Assistant de chat guidé en plusieurs étapes pour le dépôt de litiges
- **OAuth 2.1** — Authentification par jeton Bearer (octroi client_credentials) pour l'API externe
- **Optimisation Faible Bande Passante** — Compression gzip et découpage de code React.lazy
- **Téléversement XBRL** — Prise en charge du format de fichier XBRL/XML pour les téléversements par lots

---

## 2. Architecture du Système

### 2.1 Architecture de Haut Niveau

Le système suit une architecture monolithique moderne full-stack avec une séparation claire entre le frontend (SPA), le backend (API REST) et les couches de base de données. Tous les composants sont déployés comme une seule unité applicative.

```
┌─────────────────────────────────────────────────────────┐
│                     Navigateur Client                     │
│  ┌───────────────────────────────────────────────────┐   │
│  │          React SPA (Vite + TypeScript)             │   │
│  │  ┌──────────┐  ┌──────────┐  ┌───────────────┐   │   │
│  │  │  wouter   │  │ TanStack │  │  react-i18next │   │   │
│  │  │ (routage) │  │  Query   │  │   (EN / FR / PT)    │   │   │
│  │  └──────────┘  └──────────┘  └───────────────┘   │   │
│  │  ┌──────────────────────────────────────────────┐ │   │
│  │  │        shadcn/ui + Tailwind CSS              │ │   │
│  │  └──────────────────────────────────────────────┘ │   │
│  └───────────────────────────────────────────────────┘   │
└──────────────────────────┬──────────────────────────────┘
                           │ HTTP (JSON)
┌──────────────────────────▼──────────────────────────────┐
│                  Serveur Express.js                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │
│  │  Auth Session │  │   Routes API │  │  API Externe │   │
│  │  (memorystore)│  │   Internes   │  │     (v1)     │   │
│  └──────────────┘  └──────────────┘  └──────────────┘   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │
│  │   Validation  │  │   RBAC       │  │  Journal     │   │
│  │   Zod        │  │  Middleware   │  │  d'Audit     │   │
│  └──────────────┘  └──────────────┘  └──────────────┘   │
│  ┌─────────────────────────────────────────────────────┐ │
│  │              Interface de Stockage (IStorage)        │ │
│  └─────────────────────────────────────────────────────┘ │
└──────────────────────────┬──────────────────────────────┘
                           │ SQL (pilote pg)
┌──────────────────────────▼──────────────────────────────┐
│              Base de Données PostgreSQL (Neon)            │
│  ┌─────────────────────────────────────────────────────┐ │
│  │               Drizzle ORM (18 tables)               │ │
│  └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

### 2.2 Architecture Frontend

- **Framework :** React avec TypeScript
- **Outil de Build :** Vite avec HMR (Remplacement de Module à Chaud) en développement
- **Stylisation :** Tailwind CSS avec la bibliothèque de composants shadcn/ui
- **Routage :** wouter — routage côté client léger
- **Gestion d'État :** TanStack Query v5 pour la gestion d'état serveur avec mise en cache et invalidation
- **Internationalisation :** react-i18next avec i18next-browser-languagedetector pour EN/FR/PT/PT
- **Thème :** Mode sombre/clair avec propriétés personnalisées CSS et basculement par classe Tailwind
- **Police :** Inter (Google Fonts)
- **Système de Design :** Palette vert sarcelle chaud + accent doré (culturellement adapté pour le Ghana/Ouganda/Éthiopie)

### 2.3 Architecture Backend

- **Environnement d'exécution :** Node.js avec TypeScript
- **Framework :** Serveur API REST Express.js
- **Authentification :** Authentification basée sur les sessions avec express-session et memorystore
- **Hachage de Mot de Passe :** bcryptjs avec 10 tours de sel
- **Validation :** Schémas Zod dérivés des définitions de tables Drizzle via drizzle-zod
- **Patron de Stockage :** Couche de stockage basée sur une interface (`IStorage`) avec implémentation `DatabaseStorage`

### 2.4 Architecture de Base de Données

- **Moteur :** PostgreSQL (hébergé sur Neon)
- **ORM :** Drizzle ORM avec drizzle-zod pour la génération de validation à partir du schéma
- **Pilote :** pg (node-postgres) avec pool de connexions
- **Gestion des Schémas :** drizzle-kit pour le push de schéma (développement), SQL direct pour les migrations de production
- **Pool de Connexions :** Limité à 2 connexions pour l'efficacité des ressources, délai d'inactivité de 30 secondes

### 2.5 Architecture d'Authentification

- **Méthode :** Hachage de mot de passe bcryptjs avec 10 tours de sel
- **Stockage de Session :** memorystore (pas PostgreSQL) pour réduire la pression mémoire
- **Configuration de Session :**
  - Durée de vie maximale de session de 8 heures (maxAge du cookie)
  - Délai d'inactivité de 15 minutes avec destruction automatique de session (NFR-SEC-09)
  - Cookies HTTP-only, SameSite=Lax
- **Verrouillage :** 3 tentatives de connexion échouées déclenche un verrouillage de compte de 15 minutes

### 2.6 Internationalisation

- **Bibliothèque :** react-i18next + i18next-browser-languagedetector
- **Langues :** Anglais (en), Français (fr), Portugais (pt)
- **Source de Traduction :** Ressources JSON intégrées dans `client/src/lib/i18n.ts`
- **Détection :** Détection automatique de la langue du navigateur avec persistance localStorage ; sélecteur manuel disponible sur la page de connexion et l'en-tête principal

### 2.7 Routage

- **Côté Client :** wouter — routeur React léger avec `<Switch>`, `<Route>`, `<Link>`, et hook `useLocation`
- **Côté Serveur :** Routeur Express.js avec chaîne de middlewares (validation de session, RBAC, validation)

---

## 3. Pile Technologique

| Couche | Technologie | Version | Objectif |
|--------|------------|---------|----------|
| **Framework Frontend** | React | 18.x | Framework de composants UI |
| **Langage** | TypeScript | 5.x | JavaScript typé |
| **Outil de Build** | Vite | 5.x | Build frontend et serveur de développement HMR |
| **Framework CSS** | Tailwind CSS | 3.x | CSS utilitaire |
| **Bibliothèque de Composants** | shadcn/ui | Dernière | Composants UI accessibles pré-construits |
| **Routage Client** | wouter | 3.x | Routeur React léger |
| **État Serveur** | TanStack Query | 5.x | Récupération de données, mise en cache, synchronisation |
| **Formulaires** | react-hook-form | 7.x | Gestion d'état des formulaires |
| **Validation de Formulaires** | @hookform/resolvers/zod | Dernière | Validation de formulaires basée sur Zod |
| **Icônes** | lucide-react | Dernière | Bibliothèque d'icônes |
| **i18n** | react-i18next | Dernière | Internationalisation |
| **Framework Serveur** | Express.js | 4.x | Serveur HTTP et routage API |
| **Base de Données** | PostgreSQL | 16.x | Base de données relationnelle (hébergée Neon) |
| **ORM** | Drizzle ORM | Dernière | Constructeur de requêtes SQL typé |
| **Validation de Schéma** | Zod + drizzle-zod | Dernière | Validation à l'exécution depuis le schéma BD |
| **Hachage de Mot de Passe** | bcryptjs | 2.x | Hachage sécurisé des mots de passe |
| **Gestion de Session** | express-session | 1.x | Gestion de session côté serveur |
| **Stockage de Session** | memorystore | 1.x | Stockage de session en mémoire |
| **Pilote BD** | pg (node-postgres) | 8.x | Pilote client PostgreSQL |
| **Bundler Serveur** | esbuild | Dernière | Bundling TypeScript côté serveur |
| **Outillage de Schéma** | drizzle-kit | Dernière | Gestion de schéma de base de données |

---

## 4. Modèle de Données

Le système utilise 18 tables PostgreSQL avec Drizzle ORM pour un accès typé. Toutes les clés primaires sont des chaînes UUID v4 générées via `gen_random_uuid()`.

### 4.1 Table : `users`

Utilisateurs du système avec contrôle d'accès basé sur les rôles, suivi de connexion et application de la politique de mot de passe.

| Colonne | Type | Contraintes | Description |
|---------|------|-------------|-------------|
| `id` | varchar | CP, défaut `gen_random_uuid()` | Identifiant unique de l'utilisateur |
| `username` | text | NOT NULL, UNIQUE | Nom d'utilisateur de connexion |
| `password` | text | NOT NULL | Mot de passe haché bcrypt |
| `full_name` | text | NOT NULL | Nom d'affichage |
| `email` | text | NOT NULL | Adresse e-mail |
| `role` | enum `user_role` | NOT NULL, défaut `'viewer'` | Un de : `admin`, `regulator`, `lender`, `viewer` |
| `status` | enum `user_status` | NOT NULL, défaut `'active'` | Un de : `active`, `suspended`, `deactivated` |
| `institution` | text | nullable | Nom de l'institution associée |
| `failed_login_attempts` | integer | défaut `0` | Nombre de tentatives de connexion échouées consécutives |
| `locked_until` | timestamp | nullable | Date d'expiration du verrouillage de compte |
| `last_login` | timestamp | nullable | Horodatage de la dernière connexion réussie |
| `password_changed_at` | timestamp | nullable | Horodatage du dernier changement de mot de passe (expiration 90 jours) |
| `must_change_password` | boolean | défaut `false` | Forcer le changement de mot de passe à la prochaine connexion |
| `mfa_secret` | varchar | nullable | Secret TOTP AMF (encodé base32) pour application d'authentification (ENT-01) |
| `mfa_enabled` | boolean | défaut `false` | Indique si l'AMF TOTP est activée pour l'utilisateur (ENT-01) |
| `created_at` | timestamp | défaut `now()` | Horodatage de création de l'enregistrement |

### 4.2 Table : `borrowers`

Enregistrements des emprunteurs individuels et corporatifs avec données d'identification, démographiques et d'emploi.

| Colonne | Type | Contraintes | Description |
|---------|------|-------------|-------------|
| `id` | varchar | CP, défaut `gen_random_uuid()` | Identifiant unique de l'emprunteur |
| `type` | enum `borrower_type` | NOT NULL | Un de : `individual`, `corporate` |
| `first_name` | text | nullable | Prénom de l'individu |
| `last_name` | text | nullable | Nom de famille de l'individu |
| `company_name` | text | nullable | Nom de l'entité corporative |
| `national_id` | text | NOT NULL, UNIQUE | Numéro d'identification nationale |
| `tin_number` | text | nullable | Numéro d'Identification Fiscale |
| `date_of_birth` | text | nullable | Date de naissance (chaîne ISO) |
| `gender` | text | nullable | Genre |
| `phone` | text | nullable | Numéro de téléphone |
| `email` | text | nullable | Adresse e-mail |
| `address` | text | nullable | Adresse physique |
| `city` | text | nullable | Ville |
| `region` | text | nullable | Région/état |
| `employer_name` | text | nullable | Employeur actuel |
| `occupation` | text | nullable | Profession/titre du poste |
| `business_reg_number` | text | nullable | Numéro d'enregistrement commercial (corporatif) |
| `sector` | text | nullable | Secteur d'activité |
| `is_pep` | boolean | défaut `false` | Indicateur de Personne Politiquement Exposée |
| `pep_details` | text | nullable | Détails/description PEP |
| `related_borrower_id` | varchar | nullable | CE vers `borrowers.id` (partie liée) |
| `relationship_type` | text | nullable | Type de relation (spouse, guarantor, director, shareholder, beneficial_owner, subsidiary, parent_company) |
| `education_level` | text | nullable | Niveau d'éducation le plus élevé |
| `education_institution` | text | nullable | Établissement d'enseignement |
| `employment_history` | text | nullable | Historique d'emploi (JSON ou texte) |
| `created_at` | timestamp | défaut `now()` | Horodatage de création de l'enregistrement |
| `updated_at` | timestamp | défaut `now()` | Horodatage de la dernière mise à jour |

### 4.3 Table : `credit_accounts`

Enregistrements de prêts et de facilités de crédit avec prise en charge multi-devises et caractéristiques spéciales de prêt.

| Colonne | Type | Contraintes | Description |
|---------|------|-------------|-------------|
| `id` | varchar | CP, défaut `gen_random_uuid()` | Identifiant unique du compte |
| `borrower_id` | varchar | NOT NULL, CE → `borrowers.id` | Emprunteur associé |
| `lender_institution` | text | NOT NULL | Nom de l'institution prêteuse |
| `account_number` | text | NOT NULL | Numéro de compte/prêt |
| `account_type` | text | NOT NULL | Type de prêt (term_loan, overdraft, mortgage, etc.) |
| `original_amount` | decimal(15,2) | NOT NULL | Montant original du prêt |
| `current_balance` | decimal(15,2) | NOT NULL | Solde impayé actuel |
| `currency` | text | NOT NULL, défaut `'ETB'` | Code de devise (18 prises en charge) |
| `interest_rate` | decimal(5,2) | nullable | Taux d'intérêt annuel |
| `disbursement_date` | text | nullable | Date de décaissement du prêt |
| `maturity_date` | text | nullable | Date d'échéance du prêt |
| `status` | enum `account_status` | NOT NULL, défaut `'current'` | Un de : `current`, `delinquent`, `default`, `closed`, `restructured`, `written_off` |
| `days_in_arrears` | integer | défaut `0` | Jours de retard |
| `collateral_type` | text | nullable | Description du type de garantie |
| `collateral_value` | decimal(15,2) | nullable | Valeur de la garantie |
| `last_payment_date` | text | nullable | Date du dernier paiement |
| `last_payment_amount` | decimal(15,2) | nullable | Montant du dernier paiement |
| `is_interest_free` | boolean | défaut `false` | Indicateur de prêt sans intérêt (islamique/charia) (FR-SPEC-03) |
| `grace_period_months` | integer | nullable | Période de grâce en mois (FR-SPEC-04) |
| `restructure_count` | integer | défaut `0` | Nombre de restructurations (FR-SPEC-05) |
| `written_off_date` | text | nullable | Date de radiation du compte |
| `reinstated_date` | text | nullable | Date de réintégration du compte |
| `created_at` | timestamp | défaut `now()` | Horodatage de création de l'enregistrement |
| `updated_at` | timestamp | défaut `now()` | Horodatage de la dernière mise à jour |

### 4.4 Table : `credit_inquiries`

Enregistrements de recherches et de demandes de crédit avec suivi du consentement.

| Colonne | Type | Contraintes | Description |
|---------|------|-------------|-------------|
| `id` | varchar | CP, défaut `gen_random_uuid()` | Identifiant unique de la demande |
| `borrower_id` | varchar | NOT NULL, CE → `borrowers.id` | Emprunteur interrogé |
| `inquired_by` | varchar | NOT NULL, CE → `users.id` | Utilisateur ayant effectué la demande |
| `purpose` | enum `inquiry_purpose` | NOT NULL | Un de : `new_credit`, `review`, `collection`, `regulatory`, `portfolio_monitoring` |
| `institution` | text | NOT NULL | Nom de l'institution demandeuse |
| `consent_provided` | boolean | NOT NULL, défaut `false` | Indique si le consentement de l'emprunteur a été obtenu |
| `created_at` | timestamp | défaut `now()` | Horodatage de la demande |

### 4.5 Table : `audit_logs`

Journalisation immuable des activités avec suivi des adresses IP pour la sécurité et la conformité.

| Colonne | Type | Contraintes | Description |
|---------|------|-------------|-------------|
| `id` | varchar | CP, défaut `gen_random_uuid()` | Identifiant unique de l'entrée de journal |
| `user_id` | varchar | nullable, CE → `users.id` | Utilisateur ayant effectué l'action |
| `action` | text | NOT NULL | Type d'action (LOGIN, CREATE, UPDATE, APPROVE, etc.) |
| `entity` | text | NOT NULL | Type d'entité affectée (user, borrower, credit_account, etc.) |
| `entity_id` | varchar | nullable | Identifiant spécifique de l'entité |
| `details` | text | nullable | Description lisible par l'humain |
| `ip_address` | text | nullable | Adresse IP du client |
| `previous_hash` | text | nullable | Hachage SHA-256 de l'entrée précédente dans la chaîne de hachage ; `"genesis"` pour la première entrée (ENT-07) |
| `current_hash` | text | nullable | Hachage SHA-256 de cette entrée calculé à partir de previousHash + action + entity + details + timestamp (ENT-07) |
| `created_at` | timestamp | défaut `now()` | Horodatage de l'entrée de journal |

### 4.6 Table : `pending_approvals`

Enregistrements du flux de travail maker-checker pour l'approbation des modifications de données.

| Colonne | Type | Contraintes | Description |
|---------|------|-------------|-------------|
| `id` | varchar | CP, défaut `gen_random_uuid()` | Identifiant unique de l'approbation |
| `entity_type` | text | NOT NULL | Type d'entité (borrower, credit_account) |
| `entity_id` | varchar | nullable | ID de l'entité existante (pour les mises à jour) |
| `action` | text | NOT NULL | Type d'action (CREATE, UPDATE) |
| `payload` | text | NOT NULL | Données de modification sérialisées en JSON |
| `requested_by` | varchar | NOT NULL, CE → `users.id` | Utilisateur ayant soumis la modification |
| `reviewed_by` | varchar | nullable, CE → `users.id` | Utilisateur ayant examiné la modification |
| `status` | enum `approval_status` | NOT NULL, défaut `'pending'` | Un de : `pending`, `approved`, `rejected` |
| `review_notes` | text | nullable | Commentaires du réviseur |
| `created_at` | timestamp | défaut `now()` | Horodatage de la soumission |
| `reviewed_at` | timestamp | nullable | Horodatage de la révision |

### 4.7 Table : `disputes`

Gestion des litiges/réclamations avec suivi des délais SLA.

| Colonne | Type | Contraintes | Description |
|---------|------|-------------|-------------|
| `id` | varchar | CP, défaut `gen_random_uuid()` | Identifiant unique du litige |
| `borrower_id` | varchar | NOT NULL, CE → `borrowers.id` | Emprunteur concerné |
| `credit_account_id` | varchar | nullable, CE → `credit_accounts.id` | Compte de crédit associé |
| `filed_by` | varchar | NOT NULL, CE → `users.id` | Utilisateur ayant déposé le litige |
| `dispute_type` | text | NOT NULL | Type de litige |
| `description` | text | NOT NULL | Description du litige |
| `status` | enum `dispute_status` | NOT NULL, défaut `'open'` | Un de : `open`, `under_review`, `resolved`, `rejected` |
| `resolution` | text | nullable | Description de la résolution |
| `correction_type` | text | nullable | Un de : `financial`, `non_financial` |
| `sla_deadline` | timestamp | nullable | Date limite SLA (2 jours financier, 5 jours non-financier) |
| `created_at` | timestamp | défaut `now()` | Horodatage du dépôt |
| `updated_at` | timestamp | défaut `now()` | Horodatage de la dernière mise à jour |
| `resolved_at` | timestamp | nullable | Horodatage de la résolution |

### 4.8 Table : `notifications`

Système de notifications intégrées à l'application pour les approbations, litiges et alertes système.

| Colonne | Type | Contraintes | Description |
|---------|------|-------------|-------------|
| `id` | varchar | CP, défaut `gen_random_uuid()` | Identifiant unique de la notification |
| `user_id` | varchar | nullable, CE → `users.id` | Utilisateur cible (null = diffusion) |
| `type` | text | NOT NULL | Type de notification (approval_pending, approval_result, dispute_update, system) |
| `title` | text | NOT NULL | Titre de la notification |
| `message` | text | NOT NULL | Corps de la notification |
| `is_read` | boolean | défaut `false` | Statut de lecture |
| `link` | text | nullable | Lien de navigation |
| `created_at` | timestamp | défaut `now()` | Horodatage de la notification |

### 4.9 Table : `court_judgments`

Jugements de tribunal, faillites et privilèges associés aux emprunteurs (FR-COL-05).

| Colonne | Type | Contraintes | Description |
|---------|------|-------------|-------------|
| `id` | varchar | CP, défaut `gen_random_uuid()` | Identifiant unique du jugement |
| `borrower_id` | varchar | NOT NULL, CE → `borrowers.id` | Emprunteur associé |
| `case_number` | text | NOT NULL | Numéro d'affaire du tribunal |
| `court` | text | NOT NULL | Nom du tribunal |
| `judgment_type` | enum `judgment_type` | NOT NULL | Un de : `lien`, `bankruptcy`, `lawsuit`, `civil_judgment`, `criminal_conviction` |
| `amount` | decimal(15,2) | nullable | Montant du jugement |
| `currency` | text | défaut `'ETB'` | Code de devise |
| `judgment_date` | text | NOT NULL | Date du jugement |
| `status` | enum `judgment_status` | NOT NULL, défaut `'active'` | Un de : `active`, `resolved`, `appealed` |
| `description` | text | nullable | Détails du jugement |
| `created_at` | timestamp | défaut `now()` | Horodatage de création de l'enregistrement |

### 4.10 Table : `consent_records`

Gestion du consentement des sujets de données avec numéros de reçu (FR-CON-06/07).

| Colonne | Type | Contraintes | Description |
|---------|------|-------------|-------------|
| `id` | varchar | CP, défaut `gen_random_uuid()` | Identifiant unique du consentement |
| `borrower_id` | varchar | NOT NULL, CE → `borrowers.id` | Emprunteur consentant |
| `granted_to` | text | NOT NULL | Entité à laquelle le consentement est accordé |
| `purpose` | text | NOT NULL | Objectif du consentement |
| `consent_type` | text | NOT NULL | Type de consentement |
| `status` | enum `consent_status` | NOT NULL, défaut `'active'` | Un de : `active`, `revoked` |
| `granted_at` | timestamp | défaut `now()` | Horodatage de l'octroi du consentement |
| `revoked_at` | timestamp | nullable | Horodatage de la révocation |
| `receipt_number` | text | NOT NULL | Reçu de consentement (format : `CR-{timestamp}-{random}`) |
| `created_at` | timestamp | défaut `now()` | Horodatage de création de l'enregistrement |

### 4.11 Table : `payment_history`

Historique de performance de paiement sur 12 périodes par compte de crédit (FR-CR-08).

| Colonne | Type | Contraintes | Description |
|---------|------|-------------|-------------|
| `id` | varchar | CP, défaut `gen_random_uuid()` | Identifiant unique de l'entrée |
| `credit_account_id` | varchar | NOT NULL, CE → `credit_accounts.id` | Compte de crédit associé |
| `period` | text | NOT NULL | Période de paiement (ex. : "2024-01") |
| `amount_due` | decimal(15,2) | NOT NULL | Montant dû pour la période |
| `amount_paid` | decimal(15,2) | NOT NULL | Montant effectivement payé |
| `status` | enum `payment_status` | NOT NULL, défaut `'on_time'` | Un de : `on_time`, `late`, `missed`, `partial` |
| `days_late` | integer | défaut `0` | Jours de retard du paiement |
| `created_at` | timestamp | défaut `now()` | Horodatage de création de l'enregistrement |

### 4.12 Table : `institutions`

Enregistrement et flux d'approbation des institutions fournisseuses de données (FR-DP-01/04).

| Colonne | Type | Contraintes | Description |
|---------|------|-------------|-------------|
| `id` | varchar | CP, défaut `gen_random_uuid()` | Identifiant unique de l'institution |
| `name` | text | NOT NULL | Nom de l'institution |
| `type` | text | NOT NULL | Un de : `bank`, `mfi`, `utility`, `telecom`, `digital_lender`, `sacco` |
| `registration_number` | text | nullable | Numéro d'enregistrement officiel |
| `country` | text | NOT NULL, défaut `'Ethiopia'` | Pays d'opération |
| `contact_email` | text | nullable | E-mail de contact principal |
| `contact_phone` | text | nullable | Téléphone de contact principal |
| `address` | text | nullable | Adresse physique |
| `status` | enum `institution_status` | NOT NULL, défaut `'pending'` | Un de : `pending`, `active`, `suspended` |
| `submission_frequency` | text | défaut `'monthly'` | Fréquence de soumission des données |
| `approved_by` | varchar | nullable, CE → `users.id` | Utilisateur administrateur approbateur |
| `approved_at` | timestamp | nullable | Horodatage de l'approbation |
| `created_at` | timestamp | défaut `now()` | Horodatage de l'enregistrement |

### 4.13 Table : `billing_records`

Facturation et gestion des frais pour les institutions fournisseuses de données (FR-COMM-01/05).

| Colonne | Type | Contraintes | Description |
|---------|------|-------------|-------------|
| `id` | varchar | CP, défaut `gen_random_uuid()` | Identifiant unique de l'enregistrement de facturation |
| `institution_name` | text | NOT NULL | Nom de l'institution facturée |
| `service_type` | text | NOT NULL | Un de : `data_submission`, `credit_report`, `api_access`, `subscription` |
| `amount` | decimal(15,2) | NOT NULL | Montant de la facture |
| `currency` | text | NOT NULL, défaut `'ETB'` | Code de devise |
| `status` | enum `billing_status` | NOT NULL, défaut `'pending'` | Un de : `pending`, `paid`, `overdue` |
| `invoice_number` | text | NOT NULL | Numéro de référence de la facture |
| `period_start` | text | nullable | Date de début de la période de facturation |
| `period_end` | text | nullable | Date de fin de la période de facturation |
| `created_at` | timestamp | défaut `now()` | Horodatage de création de l'enregistrement |

### 4.14 Table : `credit_report_logs`

Piste d'audit de génération des rapports de crédit avec numéros de série uniques (FR-CR-06).

| Colonne | Type | Contraintes | Description |
|---------|------|-------------|-------------|
| `id` | varchar | CP, défaut `gen_random_uuid()` | Identifiant unique du journal |
| `borrower_id` | varchar | NOT NULL, CE → `borrowers.id` | Emprunteur sujet |
| `requested_by` | varchar | NOT NULL, CE → `users.id` | Utilisateur demandeur |
| `institution` | text | NOT NULL | Institution demandeuse |
| `purpose` | text | NOT NULL | Objectif du rapport |
| `serial_number` | text | NOT NULL, UNIQUE | Numéro de série du rapport (format : `CR-{ANNÉE}-{horodatage_base36}`) |
| `created_at` | timestamp | défaut `now()` | Horodatage de la génération |

### 4.15 Table : `api_keys`

Gestion des clés API externes avec hachage SHA-256 et niveaux de permissions.

| Colonne | Type | Contraintes | Description |
|---------|------|-------------|-------------|
| `id` | varchar | CP, défaut `gen_random_uuid()` | Identifiant unique de la clé |
| `institution_id` | varchar | NOT NULL, CE → `institutions.id` | Institution associée |
| `key_hash` | text | NOT NULL | Hachage SHA-256 de la clé API complète |
| `key_prefix` | text | NOT NULL | 12 premiers caractères de la clé (pour l'affichage) |
| `label` | text | NOT NULL | Libellé lisible par l'humain |
| `status` | enum `api_key_status` | NOT NULL, défaut `'active'` | Un de : `active`, `revoked` |
| `permissions` | text | NOT NULL, défaut `'submit'` | Un de : `submit`, `read`, `full` |
| `last_used_at` | timestamp | nullable | Horodatage de la dernière utilisation |
| `created_by` | varchar | NOT NULL, CE → `users.id` | Administrateur ayant créé la clé |
| `created_at` | timestamp | défaut `now()` | Horodatage de création de la clé |
| `revoked_at` | timestamp | nullable | Horodatage de la révocation |

### 4.16 Table : `exchange_rates`

  Enregistrements des taux de change pour la conversion multi-devises avec routage de taux croisés via USD.

  | Colonne | Type | Contraintes | Description |
  |---------|------|-------------|-------------|
  | `id` | varchar | CP, défaut `gen_random_uuid()` | Identifiant unique du taux |
  | `base_currency` | text | NOT NULL | Code de la devise de base |
  | `target_currency` | text | NOT NULL | Code de la devise cible |
  | `rate` | decimal(15,6) | NOT NULL | Valeur du taux de change |
  | `effective_date` | text | NOT NULL | Date d'entrée en vigueur du taux |
  | `source` | text | NOT NULL, défaut `'manual'` | Source du taux (manual, api, etc.) |
  | `created_by` | varchar | nullable, CE → `users.id` | Administrateur ayant saisi le taux |
  | `created_at` | timestamp | défaut `now()` | Horodatage de création de l'enregistrement |

  ### 4.17 Table : `retention_policies`

  Configuration des politiques de rétention des données par pays pour la conformité réglementaire.

  | Colonne | Type | Contraintes | Description |
  |---------|------|-------------|-------------|
  | `id` | varchar | CP, défaut `gen_random_uuid()` | Identifiant unique de la politique |
  | `country` | text | NOT NULL | Nom du pays |
  | `entity_type` | text | NOT NULL | Type d'entité soumis à la rétention |
  | `retention_years` | integer | NOT NULL | Nombre d'années de conservation des données |
  | `archive_after_years` | integer | nullable | Années après lesquelles archiver |
  | `description` | text | nullable | Description de la politique |
  | `is_active` | boolean | défaut `true` | Indique si la politique est active |
  | `created_at` | timestamp | défaut `now()` | Horodatage de création de l'enregistrement |
  | `updated_at` | timestamp | défaut `now()` | Horodatage de la dernière mise à jour |

  ### 4.18 Table : `api_configurations`

  Gestion centralisée de la configuration des API externes par pays.

  | Colonne | Type | Contraintes | Description |
  |---------|------|-------------|-------------|
  | `id` | varchar | CP, défaut `gen_random_uuid()` | Identifiant unique de la configuration |
  | `name` | text | NOT NULL | Nom de la configuration API |
  | `category` | text | NOT NULL | Catégorie de l'API (weather, judicial, payment_gateway, exchange_rate) |
  | `base_url` | text | NOT NULL | URL de base de l'API |
  | `api_key_header_name` | text | défaut `'X-API-Key'` | Nom de l'en-tête pour l'authentification par clé API |
  | `auth_type` | text | NOT NULL, défaut `'none'` | Type d'authentification (none, api_key, bearer, basic) |
  | `country` | text | nullable | Pays auquel cette configuration s'applique |
  | `is_active` | boolean | défaut `true` | Indique si la configuration est active |
  | `description` | text | nullable | Description de la configuration |
  | `last_tested_at` | timestamp | nullable | Horodatage du dernier test de connexion |
  | `last_test_status` | text | nullable | Résultat du dernier test de connexion |
  | `created_at` | timestamp | défaut `now()` | Horodatage de création de l'enregistrement |
  | `updated_at` | timestamp | défaut `now()` | Horodatage de la dernière mise à jour |

  ### 4.19 Types d'Énumération

| Nom de l'Enum | Valeurs |
|---------------|---------|
| `user_role` | `admin`, `regulator`, `lender`, `viewer` |
| `user_status` | `active`, `suspended`, `deactivated` |
| `borrower_type` | `individual`, `corporate` |
| `account_status` | `current`, `delinquent`, `default`, `closed`, `restructured`, `written_off` |
| `inquiry_purpose` | `new_credit`, `review`, `collection`, `regulatory`, `portfolio_monitoring` |
| `approval_status` | `pending`, `approved`, `rejected` |
| `dispute_status` | `open`, `under_review`, `resolved`, `rejected` |
| `judgment_type` | `lien`, `bankruptcy`, `lawsuit`, `civil_judgment`, `criminal_conviction` |
| `judgment_status` | `active`, `resolved`, `appealed` |
| `consent_status` | `active`, `revoked` |
| `payment_status` | `on_time`, `late`, `missed`, `partial` |
| `institution_status` | `pending`, `active`, `suspended` |
| `billing_status` | `pending`, `paid`, `overdue` |
| `api_key_status` | `active`, `revoked` |

### 4.20 Relations entre Entités

```
users ──────────────┐
  │                 │
  ├─→ credit_inquiries.inquired_by
  ├─→ pending_approvals.requested_by / reviewed_by
  ├─→ disputes.filed_by
  ├─→ notifications.user_id
  ├─→ credit_report_logs.requested_by
  ├─→ institutions.approved_by
  └─→ api_keys.created_by

borrowers ──────────┐
  │                 │
  ├─→ credit_accounts.borrower_id
  ├─→ credit_inquiries.borrower_id
  ├─→ disputes.borrower_id
  ├─→ court_judgments.borrower_id
  ├─→ consent_records.borrower_id
  ├─→ credit_report_logs.borrower_id
  └─→ borrowers.related_borrower_id (auto-référence)

credit_accounts ────┐
  │                 │
  ├─→ disputes.credit_account_id
  └─→ payment_history.credit_account_id

institutions ───────┐
  │                 │
  └─→ api_keys.institution_id

users ──────────────┐
  │                 │
  └─→ exchange_rates.created_by
```

---

## 5. Catalogue des Points d'Accès API

### 5.1 Points d'Accès d'Authentification (Sans Authentification Requise)

| Méthode | Chemin | Description | Corps de la Requête | Réponse |
|---------|--------|-------------|---------------------|---------|
| `POST` | `/api/auth/login` | Connexion utilisateur | `{ username, password }` | Objet utilisateur + indicateur `passwordExpired` |
| `POST` | `/api/auth/logout` | Déconnexion utilisateur | — | `{ message }` |
| `GET` | `/api/auth/me` | Obtenir l'utilisateur actuel | — | Objet utilisateur + indicateur `passwordExpired` |
| `POST` | `/api/auth/change-password` | Changer le mot de passe | `{ currentPassword, newPassword }` | `{ message }` |
| `POST` | `/api/auth/mfa/setup` | Générer le secret TOTP pour la configuration AMF (ENT-01) | — | `{ secret, uri }` |
| `POST` | `/api/auth/mfa/verify` | Vérifier le code TOTP et activer l'AMF (ENT-01) | `{ code }` | `{ message }` |
| `POST` | `/api/auth/mfa/disable` | Désactiver l'AMF pour l'utilisateur authentifié (ENT-01) | — | `{ message }` |
| `POST` | `/api/auth/mfa/login` | Compléter la connexion AMF avec le code TOTP (ENT-01) | `{ userId, code }` | Objet utilisateur |

### 5.2 Vérification de Santé (Sans Authentification Requise)

| Méthode | Chemin | Description | Réponse |
|---------|--------|-------------|---------|
| `GET` | `/api/health` | Vérification de santé du système | `{ status: "ok" }` |

### 5.3 Points d'Accès du Tableau de Bord (Authentifié)

| Méthode | Chemin | Rôle | Description |
|---------|--------|------|-------------|
| `GET` | `/api/dashboard/stats` | Tous | Statistiques du tableau de bord (8 cartes de statistiques) |
| `GET` | `/api/dashboard/details/:type` | Tous | Détails approfondis (type : borrowers, accounts, outstanding, delinquent, defaults, inquiries, pending, disputes) |

### 5.4 Points d'Accès de Gestion des Utilisateurs (Admin Uniquement)

| Méthode | Chemin | Description | Corps de la Requête |
|---------|--------|-------------|---------------------|
| `GET` | `/api/users` | Lister tous les utilisateurs | — |
| `POST` | `/api/users` | Créer un utilisateur | Schéma InsertUser |
| `PATCH` | `/api/users/:id` | Mettre à jour un utilisateur | Champs utilisateur partiels |

### 5.5 Points d'Accès des Emprunteurs (Authentifié)

| Méthode | Chemin | Description | Notes |
|---------|--------|-------------|-------|
| `GET` | `/api/borrowers` | Lister les emprunteurs | Prend en charge `?search=`, `?page=`, `?limit=` (pagination côté serveur) |
| `GET` | `/api/borrowers/:id` | Obtenir le détail d'un emprunteur | — |
| `POST` | `/api/borrowers` | Enregistrer un emprunteur | Crée une approbation en attente (maker-checker) |
| `PATCH` | `/api/borrowers/:id` | Mettre à jour un emprunteur | Crée une approbation en attente (maker-checker) |
| `GET` | `/api/borrowers/:id/related` | Obtenir les emprunteurs liés | Retourne les relations parents et enfants |
| `GET` | `/api/borrowers/:id/credit-report` | Rapport de crédit ancien | Rapport basique sans numéro de série |
| `GET` | `/api/borrowers/fuzzy-match` | Correspondance floue d'entités (ENT-02) | Paramètre : `?name=<terme_recherche>` ; retourne les doublons potentiels avec scores de similarité |

### 5.6 Points d'Accès des Comptes de Crédit (Authentifié)

| Méthode | Chemin | Description | Notes |
|---------|--------|-------------|-------|
| `GET` | `/api/credit-accounts` | Lister les comptes | Prend en charge le filtre `?borrowerId=` |
| `GET` | `/api/credit-accounts/:id` | Obtenir le détail d'un compte | — |
| `POST` | `/api/credit-accounts` | Créer un compte | Crée une approbation en attente (maker-checker) |
| `PATCH` | `/api/credit-accounts/:id` | Mettre à jour un compte | Crée une approbation en attente (maker-checker) |

### 5.7 Points d'Accès des Demandes de Crédit (Authentifié)

| Méthode | Chemin | Description |
|---------|--------|-------------|
| `GET` | `/api/credit-inquiries` | Lister les demandes (prend en charge `?borrowerId=`) |
| `POST` | `/api/credit-inquiries` | Créer une demande |

### 5.8 Points d'Accès des Rapports de Crédit et Recherche (Authentifié)

| Méthode | Chemin | Description | Notes |
|---------|--------|-------------|-------|
| `POST` | `/api/credit-reports/generate` | Générer un rapport de crédit | Retourne le rapport complet avec numéro de série, score, codes de justification, historique de paiement |
| `GET` | `/api/credit-reports/logs` | Journaux de génération de rapports | Admin/Régulateur uniquement |
| `POST` | `/api/credit-search/bulk` | Recherche de crédit en masse | Corps : `{ identifiers: string[] }` |

### 5.9 Points d'Accès Maker-Checker (Authentifié)

| Méthode | Chemin | Rôle | Description |
|---------|--------|------|-------------|
| `GET` | `/api/pending-approvals` | Tous | Lister toutes les approbations en attente |
| `POST` | `/api/pending-approvals` | Tous | Soumettre pour approbation |
| `PATCH` | `/api/pending-approvals/:id` | Admin, Régulateur | Approuver ou rejeter (auto-approbation empêchée) |

### 5.10 Points d'Accès des Litiges (Authentifié)

| Méthode | Chemin | Description |
|---------|--------|-------------|
| `GET` | `/api/disputes` | Lister les litiges |
| `GET` | `/api/disputes/:id` | Obtenir le détail d'un litige |
| `POST` | `/api/disputes` | Déposer un litige (définit automatiquement la date limite SLA) |
| `PATCH` | `/api/disputes/:id` | Mettre à jour le statut/la résolution du litige |

### 5.11 Points d'Accès des Notifications (Authentifié)

| Méthode | Chemin | Description |
|---------|--------|-------------|
| `GET` | `/api/notifications` | Obtenir les notifications de l'utilisateur |
| `GET` | `/api/notifications/unread-count` | Obtenir le nombre de non-lues |
| `PATCH` | `/api/notifications/:id/read` | Marquer une notification comme lue |
| `POST` | `/api/notifications/mark-all-read` | Marquer toutes comme lues |

### 5.12 Points d'Accès des Jugements de Tribunal (Authentifié)

| Méthode | Chemin | Rôle | Description |
|---------|--------|------|-------------|
| `GET` | `/api/court-judgments` | Tous | Lister les jugements (prend en charge `?borrowerId=`) |
| `POST` | `/api/court-judgments` | Admin, Régulateur | Créer un jugement |

### 5.13 Points d'Accès des Enregistrements de Consentement (Authentifié)

| Méthode | Chemin | Description |
|---------|--------|-------------|
| `GET` | `/api/consent-records` | Lister les enregistrements (prend en charge `?borrowerId=`) |
| `POST` | `/api/consent-records` | Accorder un consentement (génère automatiquement le numéro de reçu) |
| `POST` | `/api/consent-records/:id/revoke` | Révoquer un consentement |

### 5.14 Points d'Accès de l'Historique de Paiement (Authentifié)

| Méthode | Chemin | Description |
|---------|--------|-------------|
| `GET` | `/api/payment-history/:creditAccountId` | Obtenir l'historique de paiement (max 12 périodes) |
| `POST` | `/api/payment-history/:creditAccountId` | Ajouter une entrée d'historique de paiement |

### 5.15 Points d'Accès des Institutions (Authentifié)

| Méthode | Chemin | Rôle | Description |
|---------|--------|------|-------------|
| `GET` | `/api/institutions` | Tous | Lister les institutions (paginé) |
| `POST` | `/api/institutions` | Tous | Enregistrer une institution |
| `PATCH` | `/api/institutions/:id` | Admin | Mettre à jour une institution |
| `POST` | `/api/institutions/:id/approve` | Admin | Approuver une institution |

### 5.16 Points d'Accès de Facturation

| Méthode | Chemin | Rôle | Description |
|---------|--------|------|-------------|
| `GET` | `/api/billing` | Admin, Régulateur | Lister les enregistrements de facturation |
| `POST` | `/api/billing` | Admin | Créer un enregistrement de facturation |

### 5.17 Points d'Accès de Téléversement par Lots

| Méthode | Chemin | Rôle | Description |
|---------|--------|------|-------------|
| `POST` | `/api/batch-upload/credit-accounts` | Admin, Prêteur | Téléversement en masse de comptes de crédit |

### 5.18 Points d'Accès du Journal d'Audit

| Méthode | Chemin | Rôle | Description |
|---------|--------|------|-------------|
| `GET` | `/api/audit-logs` | Admin, Régulateur | Lister les entrées du journal d'audit (200 plus récentes) |
| `GET` | `/api/audit/verify-integrity` | Admin, Régulateur | Vérifier l'intégrité de la chaîne de hachage du journal d'audit (ENT-07) |

### 5.19 Points d'Accès des Rapports et Exportation

| Méthode | Chemin | Rôle | Description |
|---------|--------|------|-------------|
| `GET` | `/api/reports/export` | Admin, Régulateur | Exportation CSV (`?format=csv&type=portfolio\|borrowers`) |
| `GET` | `/api/reports/regulatory` | Admin, Régulateur | Analyses réglementaires (NPL, ventilation de portefeuille, SLA) |

### 5.20 Points d'Accès de Gestion des Clés API (Admin Uniquement)

| Méthode | Chemin | Description |
|---------|--------|-------------|
| `GET` | `/api/api-keys` | Lister toutes les clés API avec les noms d'institutions |
| `POST` | `/api/api-keys` | Générer une nouvelle clé API |
| `POST` | `/api/api-keys/:id/revoke` | Révoquer une clé API |

### 5.21 Point d'Accès du Jeton OAuth 2.1 (ENT-04)

| Méthode | Chemin | Description | Corps de la Requête | Réponse |
|---------|--------|-------------|---------------------|---------|
| `POST` | `/api/external/oauth/token` | Échanger une clé API contre un jeton Bearer | `{ grant_type: "client_credentials", client_id, client_secret }` | `{ access_token, token_type: "Bearer", expires_in: 3600 }` |

### 5.22 Points d'Accès de l'API Externe (Authentification X-API-Key ou Jeton Bearer)

| Méthode | Chemin | Permission | Description |
|---------|--------|-----------|-------------|
| `GET` | `/api/external/v1/health` | Aucune | Vérification de santé (sans authentification requise) |
| `POST` | `/api/external/v1/borrowers` | submit | Créer emprunteur(s) — objet unique ou tableau par lots |
| `GET` | `/api/external/v1/borrowers/search` | read | Rechercher des emprunteurs (`?nationalId=`, `?name=`, `?q=`) |
| `GET` | `/api/external/v1/borrowers/:id/credit-report` | read | Rapport de crédit complet avec score |
| `POST` | `/api/external/v1/credit-accounts` | submit | Soumettre compte(s) de crédit — unique ou par lots |
| `GET` | `/api/external/v1/credit-accounts/:borrowerId` | read | Obtenir les comptes par emprunteur |
| `POST` | `/api/external/v1/payment-history` | submit | Soumettre des enregistrements d'historique de paiement — unique ou par lots |
| `POST` | `/api/external/v1/court-judgments` | submit | Soumettre un jugement de tribunal |

**Format de Réponse de l'API Externe :**
```json
{
  "success": true,
  "message": "Description",
  "data": { ... },
  "timestamp": "2026-02-28T00:00:00.000Z"
}
```

**Format d'Erreur de l'API Externe :**
```json
{
  "success": false,
  "error": "Description de l'erreur",
  "details": "...",
  "timestamp": "2026-02-28T00:00:00.000Z"
}
```

### 5.23 Points d'Accès des Taux de Change (Admin Uniquement)

  | Méthode | Chemin | Description | Notes |
  |---------|--------|-------------|-------|
  | `GET` | `/api/exchange-rates` | Lister tous les taux de change | Retourne tous les enregistrements de taux |
  | `POST` | `/api/exchange-rates` | Créer un taux de change | Corps : schéma InsertExchangeRate |
  | `PATCH` | `/api/exchange-rates/:id` | Mettre à jour un taux de change | Champs de taux partiels |
  | `DELETE` | `/api/exchange-rates/:id` | Supprimer un taux de change | Suppression définitive |
  | `POST` | `/api/exchange-rates/convert` | Convertir entre devises | Corps : `{ from, to, amount }` ; utilise le routage de taux croisés via USD |

  ### 5.24 Points d'Accès des Politiques de Rétention (Admin Uniquement)

  | Méthode | Chemin | Description | Notes |
  |---------|--------|-------------|-------|
  | `GET` | `/api/retention-policies` | Lister toutes les politiques de rétention | Retourne les politiques par pays |
  | `POST` | `/api/retention-policies` | Créer une politique de rétention | Corps : schéma InsertRetentionPolicy |
  | `PATCH` | `/api/retention-policies/:id` | Mettre à jour une politique de rétention | Champs de politique partiels |
  | `DELETE` | `/api/retention-policies/:id` | Supprimer une politique de rétention | Suppression définitive |
  | `POST` | `/api/retention-policies/enforce` | Déclencher l'application de la rétention | Déclenche manuellement le moteur d'application de la rétention ; retourne les résultats journalisés dans l'audit |

  ### 5.25 Points d'Accès de Configuration API (Admin Uniquement)

  | Méthode | Chemin | Description | Notes |
  |---------|--------|-------------|-------|
  | `GET` | `/api/api-configurations` | Lister toutes les configurations API | Retourne les configurations API par pays |
  | `POST` | `/api/api-configurations` | Créer une configuration API | Corps : schéma InsertApiConfiguration |
  | `PATCH` | `/api/api-configurations/:id` | Mettre à jour une configuration API | Champs de configuration partiels |
  | `DELETE` | `/api/api-configurations/:id` | Supprimer une configuration API | Suppression définitive |
  | `POST` | `/api/api-configurations/:id/test` | Tester la connexion API | Teste la connectivité vers le point d'accès configuré ; protection SSRF appliquée |

  ---

## 6. Architecture de Sécurité

### 6.1 Contrôle d'Accès Basé sur les Rôles (RBAC)

Le système applique quatre rôles utilisateur avec la matrice d'accès suivante :

| Fonctionnalité | Admin | Régulateur | Prêteur | Lecteur |
|----------------|-------|------------|---------|---------|
| Gestion des Utilisateurs | Complet | Aucun | Aucun | Aucun |
| Gestion des Institutions | Complet | Aucun | Aucun | Aucun |
| Gestion des Clés API | Complet | Aucun | Aucun | Aucun |
| Facturation | Complet | Lecture | Aucun | Aucun |
| Journaux d'Audit | Complet | Lecture | Aucun | Aucun |
| Approuver/Rejeter les Modifications | Oui | Oui | Aucun | Aucun |
| Jugements de Tribunal (création) | Oui | Oui | Aucun | Aucun |
| Téléversement par Lots | Oui | Aucun | Oui | Aucun |
| Rapports/Exportation | Oui | Oui | Aucun | Aucun |
| Emprunteurs/Comptes | Complet | Complet | Complet | Lecture |
| Litiges | Complet | Complet | Complet | Complet |
| Gestion du Consentement | Complet | Complet | Complet | Complet |
| Tableau de Bord | Complet | Complet | Complet | Complet |
| Centre d'Aide | Complet | Complet | Complet | Complet |

Le RBAC est appliqué côté serveur via la fonction middleware `requireRole()` qui vérifie `req.session.userRole` par rapport aux rôles autorisés.

### 6.2 Gestion des Sessions

| Paramètre | Valeur | Référence SRS |
|-----------|--------|---------------|
| Délai d'Inactivité | 15 minutes | NFR-SEC-09 |
| Session Maximale | 8 heures | maxAge du Cookie |
| Stockage | memorystore | En mémoire, non persisté |
| Indicateurs du Cookie | httpOnly=true, sameSite=lax, secure=false | — |
| Intervalle de Nettoyage | 24 heures | checkPeriod de memorystore |

Le délai d'inactivité est appliqué par un middleware côté serveur qui compare `req.session.lastActivity` avec l'heure actuelle. Les sessions expirées reçoivent le code HTTP 440.

### 6.3 Politique de Mot de Passe

| Règle | Exigence |
|-------|----------|
| Longueur Minimale | 8 caractères |
| Complexité | Au moins 1 majuscule, 1 minuscule, 1 chiffre, 1 caractère spécial |
| Expiration | 90 jours depuis le dernier changement |
| Hachage | bcrypt avec 10 tours de sel |
| Changement Forcé | Indicateur `mustChangePassword` sur l'enregistrement utilisateur |
| Regex de Validation | `/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/` |

### 6.4 Verrouillage de Connexion

| Paramètre | Valeur |
|-----------|--------|
| Tentatives Max | 3 tentatives de connexion échouées consécutives |
| Durée de Verrouillage | 15 minutes |
| Réinitialisation | La connexion réussie remet le compteur à 0 |
| Suivi | Colonnes `failed_login_attempts` et `locked_until` sur la table users |

### 6.5 Authentification par Clé API

Les points d'accès de l'API externe utilisent l'authentification par clé API via l'en-tête HTTP `X-API-Key` :

1. Le client envoie la clé API complète dans l'en-tête `X-API-Key`
2. Le serveur calcule le hachage SHA-256 de la clé fournie
3. Le serveur recherche le hachage dans la table `api_keys`
4. Le serveur vérifie que le statut de la clé est `active` et que le statut de l'institution est `active`
5. Le serveur vérifie le niveau de permission (`submit`, `read`, ou `full`) par rapport aux exigences du point d'accès
6. L'horodatage `last_used_at` est mis à jour de manière asynchrone

**Génération de Clé :**
- Format : `sim_{8_chars_hex}_{48_chars_hex}` (préfixe + secret)
- La clé complète n'est affichée qu'une seule fois à la création
- Seuls le hachage SHA-256 et le préfixe sont stockés dans la base de données

### 6.6 Journalisation d'Audit

Toutes les actions significatives sont enregistrées dans la table `audit_logs` avec :
- **ID Utilisateur** de l'acteur
- **Type d'Action** (LOGIN, CREATE, UPDATE, APPROVE, REJECT, FILE_DISPUTE, GRANT_CONSENT, REVOKE_CONSENT, BATCH_UPLOAD, BULK_SEARCH, GENERATE_REPORT, API_SUBMIT, API_BATCH_SUBMIT, API_CREDIT_REPORT, LOGIN_FAILED, ACCOUNT_LOCKED, PASSWORD_CHANGE, LOGOUT)
- **Type et ID d'Entité**
- **Adresse IP** (via `req.ip` avec trust proxy activé)
- **Détails** — description lisible par l'humain
- **Horodatage** — généré automatiquement

### 6.7 Flux de Travail Maker-Checker

Le principe des quatre yeux est appliqué pour les modifications des emprunteurs et des comptes de crédit :

1. Tout utilisateur authentifié peut soumettre une modification (CREATE ou UPDATE)
2. La modification est stockée dans `pending_approvals` avec le statut `pending`
3. Seuls les utilisateurs avec le rôle `admin` ou `regulator` peuvent approuver/rejeter
4. **Prévention de l'auto-approbation :** Le serveur rejette l'approbation si `requestedBy === currentUserId` (HTTP 403)
5. Lors de l'approbation, la charge utile de la modification est automatiquement appliquée à l'entité cible
6. Des notifications sont envoyées aux utilisateurs concernés à chaque étape

---

## 7. Architecture de Déploiement

### 7.1 Environnement Replit

L'application est conçue pour un déploiement sur Replit avec une configuration d'auto-dimensionnement :

```
Commande de Build : npm run build
Commande d'Exécution : node ./dist/index.cjs
```

### 7.2 Processus de Build

Le processus de build comprend deux étapes :

1. **Build Serveur (esbuild) :**
   - Point d'entrée : `server/index.ts`
   - Sortie : `dist/index.cjs` (bundle CommonJS)
   - Plateforme : Node.js
   - Packages externes : Exclus du bundle (résolus depuis node_modules)

2. **Build Frontend (Vite) :**
   - Point d'entrée : `client/index.html`
   - Sortie : `dist/public/` (ressources statiques)
   - Inclut : Optimisation des ressources, découpage de code, minification

### 7.3 Service en Production

En production (`NODE_ENV=production`), le module `server/static.ts` sert les ressources frontend construites depuis `dist/public/`. Il gère les contextes ESM (`__dirname`) et CJS (`import.meta.url`) pour la résolution des chemins.

En développement (`NODE_ENV=development`), le serveur de développement Vite est utilisé avec le support HMR via `server/vite.ts`.

### 7.4 Variables d'Environnement

| Variable | Requise | Défaut | Description |
|----------|---------|--------|-------------|
| `DATABASE_URL` | Oui | — | Chaîne de connexion PostgreSQL |
| `SESSION_SECRET` | Recommandée | `credit-registry-dev-secret` | Secret de chiffrement de session |
| `PORT` | Non | `5000` | Port du serveur HTTP |
| `NODE_ENV` | Non | `development` | Mode d'environnement (`production` ou `development`) |

### 7.5 Vérifications de Santé

- **Interne :** `GET /api/health` → `{ status: "ok" }`
- **Externe :** `GET /api/external/v1/health` → `{ status: "ok", version: "1.1", service: "Systems In Motion Credit Registry API" }`

---

## 8. Points d'Intégration

### 8.1 API REST Externe

Le système expose une API REST à `/api/external/v1/*` pour que les institutions interagissent de manière programmatique avec le registre :

**Authentification :** Clé API via l'en-tête HTTP `X-API-Key` avec hachage SHA-256.

**Niveaux de Permission :**
| Niveau | Capacités |
|--------|-----------|
| `submit` | Créer des emprunteurs, comptes de crédit, historique de paiement, jugements de tribunal |
| `read` | Rechercher des emprunteurs, récupérer des rapports de crédit, consulter les comptes de crédit |
| `full` | Toutes les capacités submit + read |

**Soumission par Lots :** Les points d'accès acceptant les données POST prennent en charge à la fois les objets uniques et les tableaux. Les soumissions par lots retournent des résultats par enregistrement avec les détails des erreurs pour les enregistrements échoués.

**Enveloppe de Réponse :** Toutes les réponses de l'API externe suivent un format d'enveloppe cohérent avec les champs `success`, `message`, `data` et `timestamp`.

### 8.2 Téléversement de Fichiers par Lots

La fonctionnalité interne de téléversement par lots (`POST /api/batch-upload/credit-accounts`) accepte des tableaux JSON d'enregistrements de comptes de crédit :

**Entrée Prise en Charge :**
```json
{
  "records": [
    {
      "borrowerId": "...",
      "lenderInstitution": "...",
      "accountNumber": "...",
      "accountType": "...",
      "originalAmount": "...",
      "currentBalance": "...",
      "currency": "ETB",
      "status": "current"
    }
  ]
}
```

**Validation :** Chaque enregistrement est validé indépendamment par rapport au `insertCreditAccountSchema` (Zod). Les enregistrements valides sont insérés ; les enregistrements invalides sont collectés avec les détails des erreurs.

**Réponse :**
```json
{
  "totalSubmitted": 100,
  "successCount": 95,
  "errorCount": 5,
  "errors": [
    { "index": 3, "message": "Champ obligatoire 'accountNumber' manquant" }
  ]
}
```

### 8.3 Exportation CSV

Le module de reporting prend en charge l'exportation CSV pour les données de portefeuille et d'emprunteurs :

- `GET /api/reports/export?format=csv&type=portfolio` — Données du portefeuille de comptes de crédit
- `GET /api/reports/export?format=csv&type=borrowers` — Données démographiques des emprunteurs

Les fichiers sont générés à la volée avec les en-têtes `Content-Type: text/csv` et `Content-Disposition` appropriés.

---

## 9. Diagrammes de Flux de Données

### 9.1 Flux de Connexion Utilisateur

```
Client                          Serveur                         Base de Données
  │                               │                               │
  │  POST /api/auth/login         │                               │
  │  { username, password }       │                               │
  │──────────────────────────────→│                               │
  │                               │  SELECT * FROM users          │
  │                               │  WHERE username = ?           │
  │                               │──────────────────────────────→│
  │                               │              enreg. utilisateur│
  │                               │←──────────────────────────────│
  │                               │                               │
  │                               │  Vérif. : status === 'active' │
  │                               │  Vérif. : non verrouillé      │
  │                               │  bcrypt.compare(password)     │
  │                               │                               │
  │                               │  [Si valide] :                │
  │                               │  Réinit. tentatives échouées  │
  │                               │  Mise à jour last_login       │
  │                               │  Définir session (userId,rôle)│
  │                               │  Créer journal audit (LOGIN)  │
  │                               │──────────────────────────────→│
  │                               │                               │
  │  200 { user, passwordExpired }│                               │
  │←──────────────────────────────│                               │
  │                               │                               │
  │                               │  [Si invalide (tentative < 3)]:│
  │                               │  Incrémenter failed_attempts  │
  │                               │  Créer journal audit (ÉCHEC)  │
  │  401 "Identifiants invalides"│                               │
  │←──────────────────────────────│                               │
  │                               │                               │
  │                               │  [Si 3e échec] :              │
  │                               │  Verrouiller compte 15 min    │
  │                               │  Créer journal audit (VERROU.)│
  │  423 "Compte verrouillé"     │                               │
  │←──────────────────────────────│                               │
```

### 9.2 Enregistrement d'Emprunteur avec Maker-Checker

```
Utilisateur Prêteur              Serveur                         Base de Données
  │                               │                               │
  │  POST /api/borrowers          │                               │
  │  { type, firstName, ... }     │                               │
  │──────────────────────────────→│                               │
  │                               │  Valider avec schéma Zod      │
  │                               │  INSERT pending_approvals     │
  │                               │  (status = 'pending')         │
  │                               │──────────────────────────────→│
  │                               │                               │
  │                               │  Créer journal d'audit        │
  │                               │  Notifier admin/régulateur    │
  │                               │──────────────────────────────→│
  │                               │                               │
  │  201 { approval, message }    │                               │
  │←──────────────────────────────│                               │

Admin/Régulateur                 Serveur                         Base de Données
  │                               │                               │
  │  PATCH /api/pending-approvals/:id                             │
  │  { status: "approved" }       │                               │
  │──────────────────────────────→│                               │
  │                               │  Vérif. : requestedBy !== moi │
  │                               │  Vérif. : status === 'pending'│
  │                               │                               │
  │                               │  Mettre à jour statut approbat│
  │                               │──────────────────────────────→│
  │                               │                               │
  │                               │  [Si approuvé] :              │
  │                               │  Parser JSON de la charge     │
  │                               │  INSERT INTO borrowers        │
  │                               │──────────────────────────────→│
  │                               │                               │
  │                               │  Créer journal audit (APPROUV)│
  │                               │  Notifier le demandeur        │
  │                               │──────────────────────────────→│
  │                               │                               │
  │  200 { approbation mise à jr }│                               │
  │←──────────────────────────────│                               │
```

### 9.3 Génération de Rapport de Crédit

```
Utilisateur                      Serveur                         Base de Données
  │                               │                               │
  │  POST /api/credit-reports/generate                            │
  │  { borrowerId, purpose }      │                               │
  │──────────────────────────────→│                               │
  │                               │  Obtenir emprunteur           │
  │                               │  Obtenir comptes de crédit    │
  │                               │  Obtenir demandes de crédit   │
  │                               │  Obtenir jugements tribunal   │
  │                               │  Obtenir enreg. consentement  │
  │                               │  Obtenir historique paiement  │
  │                               │──────────────────────────────→│
  │                               │              toutes les donnée│
  │                               │←──────────────────────────────│
  │                               │                               │
  │                               │  Générer numéro de série      │
  │                               │  (CR-{ANNÉE}-{base36})        │
  │                               │                               │
  │                               │  Calculer score de crédit     │
  │                               │  (algorithme 300-850)         │
  │                               │  Générer codes de justif.     │
  │                               │                               │
  │                               │  INSERT credit_report_logs    │
  │                               │  INSERT audit_logs            │
  │                               │──────────────────────────────→│
  │                               │                               │
  │  200 { serialNumber, score,   │                               │
  │    reasonCodes, accounts,     │                               │
  │    judgments, consents, ... }  │                               │
  │←──────────────────────────────│                               │
```

### 9.4 Flux de Soumission de l'API Externe

```
Institution                      Serveur                         Base de Données
  │                               │                               │
  │  POST /api/external/v1/borrowers                              │
  │  X-API-Key: sim_xxxx_yyyy     │                               │
  │  [{ ... }, { ... }]           │                               │
  │──────────────────────────────→│                               │
  │                               │  Hacher la clé en SHA-256     │
  │                               │  Rechercher api_keys par hash │
  │                               │──────────────────────────────→│
  │                               │                      api_key  │
  │                               │←──────────────────────────────│
  │                               │                               │
  │                               │  Vérif. : statut clé = active │
  │                               │  Vérif. : institution active  │
  │                               │  Vérif. : permission = submit │
  │                               │                               │
  │                               │  Pour chaque enregistrement : │
  │                               │    Valider avec Zod           │
  │                               │    INSERT borrowers           │
  │                               │──────────────────────────────→│
  │                               │                               │
  │                               │  Mettre à jour last_used_at   │
  │                               │  Créer journal d'audit        │
  │                               │──────────────────────────────→│
  │                               │                               │
  │  200 { success: true,         │                               │
  │    submitted: N, failed: M,   │                               │
  │    results: [...],            │                               │
  │    errors: [...] }            │                               │
  │←──────────────────────────────│                               │
```

### 9.5 Cycle de Vie du Litige

```
Diagramme d'États :

  ┌──────┐    Dépôt     ┌──────────────┐
  │ Aucun│──────────────→│    OUVERT     │
  └──────┘               └──────┬───────┘
                                │
                         Examen │
                                │
                         ┌──────▼───────┐
                         │ EN_EXAMEN    │
                         └──────┬───────┘
                                │
                    ┌───────────┼───────────┐
                    │                       │
              Résoudre│                Rejeter │
                    │                       │
             ┌──────▼──┐           ┌───────▼───┐
             │ RÉSOLU   │           │  REJETÉ   │
             └─────────┘           └───────────┘

Délais SLA :
  - Corrections financières : 2 jours ouvrables à compter du dépôt
  - Corrections non-financières : 5 jours ouvrables à compter du dépôt
  - Le délai SLA est calculé au moment de la création en fonction du correctionType
```

---

## 10. Gestion des Erreurs

### 10.1 Validation Zod

Tous les corps de requête entrants sont validés à l'aide de schémas Zod dérivés des définitions de tables Drizzle via `drizzle-zod` :

- `insertBorrowerSchema` — Création/mise à jour d'emprunteur
- `insertCreditAccountSchema` — Création/mise à jour de compte de crédit
- `insertCreditInquirySchema` — Création de demande de crédit
- `insertUserSchema` — Création d'utilisateur
- `insertPendingApprovalSchema` — Soumission d'approbation
- `insertDisputeSchema` — Dépôt de litige
- `insertCourtJudgmentSchema` — Création de jugement de tribunal
- `insertConsentRecordSchema` — Création de consentement
- `insertPaymentHistorySchema` — Entrée d'historique de paiement
- `insertInstitutionSchema` — Enregistrement d'institution
- `insertBillingRecordSchema` — Création d'enregistrement de facturation
- `insertCreditReportLogSchema` — Création de journal de rapport de crédit
- `insertApiKeySchema` — Création de clé API

Les échecs de validation retournent HTTP 400 avec le message d'erreur Zod.

### 10.2 Middleware d'Erreur

Le middleware d'erreur Express (`server/index.ts`) capture les erreurs non gérées :

```typescript
app.use((err, _req, res, next) => {
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  if (res.headersSent) return next(err);
  return res.status(status).json({ message });
});
```

### 10.3 Dégradation Gracieuse

- Le signal **SIGHUP** est ignoré pour empêcher l'arrêt déclenché par le flux de travail
- Le signal **SIGPIPE** est ignoré pour gérer les scénarios de pipe cassé
- Les **exceptions non capturées** et les **rejets non gérés** sont journalisés mais ne plantent pas le processus
- Les **échecs de création de notification** sont capturés silencieusement (non-critique)
- Les **erreurs d'application maker-checker** sont journalisées mais ne font pas échouer la mise à jour de l'approbation

### 10.4 Codes de Statut HTTP

| Code | Utilisation |
|------|-------------|
| 200 | Réponse réussie |
| 201 | Ressource créée |
| 400 | Erreur de validation / Requête incorrecte |
| 401 | Authentification requise / Identifiants invalides |
| 403 | Permissions insuffisantes / Auto-approbation empêchée |
| 404 | Ressource non trouvée |
| 423 | Compte verrouillé |
| 440 | Session expirée (délai d'inactivité) |
| 500 | Erreur interne du serveur |

---

## 11. Performance

### 11.1 Pool de Connexions

Le pool de connexions PostgreSQL est configuré pour l'efficacité des ressources :

```typescript
const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  max: 2,
  idleTimeoutMillis: 30000,
});
```

- **Connexions max :** 2 (adapté pour un déploiement mono-instance)
- **Délai d'inactivité :** 30 secondes

### 11.2 Pagination Côté Serveur

Les tables à fort volume implémentent la pagination côté serveur :

- **Emprunteurs :** `GET /api/borrowers?page=1&limit=50` (max 200 par page)
- **Institutions :** `GET /api/institutions?page=1&limit=50` (max 200 par page)

Format de réponse :
```json
{
  "data": [...],
  "total": 100005
}
```

### 11.3 Limites de Requête

Les points d'accès non-paginés appliquent des limites de requête pour prévenir les problèmes de mémoire :

| Entité | Limite Par Défaut |
|--------|-------------------|
| Comptes de Crédit | 200 enregistrements |
| Demandes de Crédit | 200 enregistrements |
| Journaux d'Audit | 200 enregistrements |
| Jugements de Tribunal | 200 enregistrements |
| Enregistrements de Consentement | 200 enregistrements |
| Journaux de Rapport de Crédit | 200 enregistrements |
| Résultats de Recherche | 200 enregistrements |
| Notifications | 50 enregistrements |
| Historique de Paiement | 12 enregistrements (par compte) |

### 11.4 Volumes de Données d'Amorçage

Le système est amorcé avec des volumes de données représentatifs de la production :

| Entité | Nombre |
|--------|--------|
| Emprunteurs | 100 005 |
| Institutions | 100 020 |
| Comptes de Crédit | 166 673 |
| Historique de Paiement | 120 000 |
| Demandes de Crédit | 25 004 |
| Enregistrements de Consentement | 15 000 |
| Journaux d'Audit | 5 063 |
| Litiges | 3 000 |
| Jugements de Tribunal | 2 000 |
| Enregistrements de Facturation | 120 |
| Utilisateurs Système | 6 |

---

## 12. Surveillance et Journalisation

### 12.1 Piste d'Audit

Toutes les actions significatives du système sont enregistrées dans la table `audit_logs`. La piste d'audit est immuable (insertion uniquement) et capture :

- **Identification de l'acteur** — ID utilisateur de la personne/système effectuant l'action
- **Classification de l'action** — Chaînes de type d'action standardisées
- **Suivi d'entité** — Type et ID de l'entité affectée
- **Suivi IP** — Adresse IP du client (via Express trust proxy)
- **Horodatages** — Heure de création générée automatiquement
- **Détails** — Description lisible par l'humain de l'action

**Types d'Action :**
`LOGIN`, `LOGIN_FAILED`, `ACCOUNT_LOCKED`, `LOGOUT`, `PASSWORD_CHANGE`, `CREATE`, `UPDATE`, `SUBMIT_APPROVAL`, `APPROVE`, `REJECT`, `FILE_DISPUTE`, `UPDATE_DISPUTE`, `GRANT_CONSENT`, `REVOKE_CONSENT`, `VIEW`, `GENERATE_REPORT`, `BATCH_UPLOAD`, `BULK_SEARCH`, `API_SUBMIT`, `API_BATCH_SUBMIT`, `API_CREDIT_REPORT`

### 12.2 Journalisation des Requêtes API

Toutes les requêtes `/api/*` sont journalisées dans la console avec :

- Méthode HTTP et chemin
- Code de statut de la réponse
- Temps de réponse en millisecondes
- Corps de la réponse tronqué (200 premiers caractères)

Format : `{heure} [express] {MÉTHODE} {chemin} {statut} en {durée}ms :: {aperçu_réponse}`

### 12.3 Journalisation Console

La fonction `log()` dans `server/index.ts` fournit une sortie console horodatée :

```
1:30:45 PM [express] POST /api/auth/login 200 in 45ms :: {"id":"...","username":"admin",...}
```

Les conditions d'erreur sont journalisées via `console.error()` pour :
- Les exceptions non capturées
- Les rejets de promesse non gérés
- Les erreurs internes du serveur
- Les erreurs de base de données d'amorçage
- Les erreurs d'application maker-checker

---

## 13. Améliorations Entreprise (v1.1)

### 13.1 Authentification Multi-Facteurs TOTP (ENT-01)

**Objectif :** Ajouter un second facteur d'authentification utilisant les mots de passe à usage unique basés sur le temps (TOTP) compatibles avec les applications d'authentification (Google Authenticator, Authy, etc.).

**Architecture :**
- **Bibliothèque :** `otpauth` pour la génération et la validation TOTP
- **Schéma :** Colonnes `mfaSecret` (varchar, nullable) et `mfaEnabled` (boolean, défaut false) sur la table `users`
- **Points d'Accès :** `POST /api/auth/mfa/setup`, `POST /api/auth/mfa/verify`, `POST /api/auth/mfa/disable`, `POST /api/auth/mfa/login`
- **Frontend :** Composant `mfa-setup.tsx` avec affichage de l'URI QR code et saisie de vérification
- **i18n :** Traductions complètes EN/FR/PT sous les clés `mfa.*` et `login.mfa*`

**Flux :**
1. L'utilisateur active l'AMF via la boîte de dialogue de configuration → le serveur génère le secret TOTP → le client affiche l'URI `otpauth://`
2. L'utilisateur scanne le QR code avec l'application d'authentification → saisit le code à 6 chiffres → le serveur vérifie et définit `mfaEnabled = true`
3. Lors des connexions suivantes, `POST /api/auth/login` retourne `{ requireMfa: true }` → le client affiche la saisie du code → `POST /api/auth/mfa/login` complète l'authentification

### 13.2 Correspondance Floue d'Entités (ENT-02)

**Objectif :** Détecter les emprunteurs potentiellement en double lors de l'enregistrement en utilisant la correspondance par similarité de trigrammes.

**Architecture :**
- **Extension :** `pg_trgm` activée via `CREATE EXTENSION IF NOT EXISTS pg_trgm` à l'initialisation du pool dans `server/db.ts`
- **Méthode de Stockage :** `fuzzyMatchBorrowers(name: string)` dans `IStorage` / `DatabaseStorage`
- **Point d'Accès :** `GET /api/borrowers/fuzzy-match?name=<requête>`
- **Algorithme :** Similarité par trigrammes PostgreSQL avec seuil ≥ 0.3 combiné avec un repli ILIKE
- **Frontend :** Bannière d'avertissement affichée sur le formulaire d'enregistrement d'emprunteur lorsque des doublons potentiels sont trouvés

### 13.3 Chatbot de Litiges (ENT-03)

**Objectif :** Assistant guidé de type chat qui accompagne les utilisateurs à travers le processus de dépôt de litige étape par étape.

**Architecture :**
- **Composant :** `client/src/components/dispute-chatbot.tsx`
- **Intégration :** Intégré dans la page du centre d'aide (`helpdesk.tsx`)
- **Étapes du Flux :** Sélection du type de problème → Recherche d'emprunteur → Sélection du compte → Saisie de la description → Confirmation → Soumission automatique
- **i18n :** Traductions complètes EN/FR/PT sous les clés `chatbot.*` (askBorrower, searching, confirmSummary, cancelled, startNew)
- **Types de Litiges :** Utilise les clés i18n `disputes.types.*` pour les noms de types localisés

### 13.4 Authentification par Jeton Bearer OAuth 2.1 (ENT-04)

**Objectif :** Fournir l'échange de jetons par identifiants client OAuth 2.1 comme alternative à l'authentification X-API-Key pour l'API externe.

**Architecture :**
- **Bibliothèque :** `jsonwebtoken` pour la signature et la vérification JWT
- **Point d'Accès :** `POST /api/external/oauth/token`
- **Type d'Octroi :** `client_credentials`
- **Format du Jeton :** JWT signé avec HS256 utilisant SESSION_SECRET
- **Charge Utile du Jeton :** `{ institutionId, permissions, apiKeyId }`
- **Expiration du Jeton :** 3600 secondes (1 heure)
- **Double Authentification :** L'en-tête `X-API-Key` et `Authorization: Bearer <token>` sont tous deux acceptés sur tous les points d'accès de l'API externe
- **Frontend :** Section de documentation OAuth sur la page de documentation API avec exemple de code

### 13.5 Optimisations Faible Bande Passante (ENT-05)

**Objectif :** Réduire la consommation de bande passante et améliorer les temps de chargement pour les utilisateurs sur des réseaux limités.

**Architecture :**
- **Compression Serveur :** Package npm `compression` appliqué comme middleware Express dans `server/index.ts` ; encodage gzip pour toutes les réponses HTTP
- **Découpage de Code :** Tous les composants de page de route enveloppés avec `React.lazy()` dans `client/src/App.tsx` (sauf Dashboard, Login et NotFound qui sont chargés immédiatement)
- **Repli Suspense :** Composant spinner `LazyFallback` défini dans `App.tsx` affiché pendant le chargement des composants en lazy-loading

### 13.6 Prise en Charge du Téléversement XBRL (ENT-06)

**Objectif :** Étendre le téléversement par lots pour accepter le format de fichier XBRL/XML en plus de JSON et CSV.

**Architecture :**
- **Serveur :** Logique d'analyse XBRL/XML dans le point d'accès `POST /api/batch-upload/credit-accounts`
- **Frontend :** Interface à onglets utilisant le composant shadcn `Tabs` (onglet JSON/CSV avec `data-testid="tab-json"` et onglet XBRL avec `data-testid="tab-xbrl"`)
- **Format d'Exemple :** Structure XML XBRL d'exemple affichée dans l'onglet XBRL (`data-testid="text-xbrl-sample"`)
- **i18n :** Traductions EN/FR/PT sous les clés `batchUpload.xbrl*`

### 13.7 Chaîne de Hachage Inviolable du Journal d'Audit (ENT-07)

**Objectif :** Fournir une preuve cryptographique de l'intégrité du journal d'audit grâce à une chaîne de hachage SHA-256.

**Architecture :**
- **Schéma :** Colonnes `previousHash` (text, nullable) et `currentHash` (text, nullable) sur la table `audit_logs`
- **Calcul du Hachage :** SHA-256 de `previousHash + action + entity + details + timestamp` en utilisant le module `crypto` de Node.js
- **Genèse :** La première entrée utilise `previousHash = "genesis"`
- **Méthode de Stockage :** `verifyAuditIntegrity()` dans `IStorage` / `DatabaseStorage` — récupère toutes les entrées ordonnées par `created_at ASC`, recalcule les hachages et valide la chaîne
- **Point d'Accès :** `GET /api/audit/verify-integrity` — retourne `{ valid, totalEntries, checkedEntries, brokenAt }`
- **Frontend :** Badge d'intégrité (`data-testid="badge-integrity-status"`) et bouton de vérification (`data-testid="button-verify-integrity"`) sur la page de piste d'audit
- **i18n :** Traductions EN/FR/PT sous les clés `audit.integrityValid`, `audit.integrityBroken`, `audit.verify`, `audit.hashChain`


  ### 13.8 Gestion des Taux de Change (ENT-08)

  **Objectif :** Fournir la prise en charge de 18 devises avec conversion par taux croisés via routage USD, opérations CRUD d'administration et un widget de conversion de devises.

  **Architecture :**
  - **Schéma :** Table `exchange_rates` avec `base_currency`, `target_currency`, `rate` (decimal 15,6), `effective_date`, `source`, `created_by`
  - **Routage par Taux Croisés :** Lorsqu'un taux direct n'est pas disponible, le système convertit via USD comme intermédiaire (ex. : GHS → USD → ETB)
  - **Points d'Accès :** `GET /api/exchange-rates`, `POST /api/exchange-rates`, `PATCH /api/exchange-rates/:id`, `DELETE /api/exchange-rates/:id`, `POST /api/exchange-rates/convert`
  - **Frontend :** Page `exchange-rates.tsx` avec interface CRUD d'administration et widget de conversion de devises prenant en charge les 18 devises panafricaines
  - **Devises :** GHS, ETB, UGX, LRD, NGN, KES, ZAR, EGP, MAD, TZS, RWF, XOF, XAF, MZN, AOA, BWP, ZMW, USD

  ### 13.9 Module d'Administration API (ENT-09)

  **Objectif :** Gestion centralisée de la configuration des API externes (météo, judiciaire, passerelle de paiement, taux de change) par pays avec test de connexion et protection SSRF.

  **Architecture :**
  - **Schéma :** Table `api_configurations` avec `name`, `category`, `base_url`, `api_key_header_name`, `auth_type`, `country`, `is_active`, `last_tested_at`, `last_test_status`
  - **Catégories :** weather, judicial, payment_gateway, exchange_rate
  - **Types d'Authentification :** none, api_key, bearer, basic
  - **Points d'Accès :** `GET /api/api-configurations`, `POST /api/api-configurations`, `PATCH /api/api-configurations/:id`, `DELETE /api/api-configurations/:id`, `POST /api/api-configurations/:id/test`
  - **Protection SSRF :** Le test de connexion valide les URLs contre les plages de réseau internes/privées avant d'effectuer les requêtes sortantes
  - **Frontend :** Page `api-admin.tsx` avec gestion de la configuration API par pays et interface de test de connexion

  ### 13.10 Moteur d'Application de la Rétention (ENT-10)

  **Objectif :** Application automatisée et manuelle de la rétention des données avec politiques par pays, résultats journalisés dans l'audit et SQL paramétré pour une exécution sécurisée.

  **Architecture :**
  - **Schéma :** Table `retention_policies` avec `country`, `entity_type`, `retention_years`, `archive_after_years`, `is_active`
  - **Planificateur :** Application automatisée à intervalle de 24 heures via `server/retention-enforcement.ts`
  - **Déclenchement Manuel :** Point d'accès `POST /api/retention-policies/enforce` pour l'exécution à la demande
  - **Politiques par Pays :**
    - Ghana : rétention de 10 ans
    - Libéria : rétention de 7 ans
    - Éthiopie : rétention de 7 ans
    - Ouganda : rétention de 7 ans
  - **Points d'Accès :** `GET /api/retention-policies`, `POST /api/retention-policies`, `PATCH /api/retention-policies/:id`, `DELETE /api/retention-policies/:id`, `POST /api/retention-policies/enforce`
  - **Sécurité :** Toutes les requêtes de base de données utilisent du SQL paramétré pour prévenir les injections ; les résultats de l'application sont journalisés dans l'audit
  - **Frontend :** Page `retention-policies.tsx` avec CRUD des politiques et déclenchement manuel de l'application

  ### 13.11 Résolution d'Entités Transfrontalière (ENT-11)

  **Objectif :** Identification améliorée des emprunteurs transfrontaliers utilisant les numéros de passeport, des types de relation étendus et la correspondance floue sur plusieurs champs d'identité.

  **Architecture :**
  - **Champ Passeport :** Colonne `passport_number` (text, nullable) sur la table `borrowers` pour l'identification inter-juridictionnelle
  - **Types de Relation :** 7 types pris en charge — `spouse`, `guarantor`, `director`, `shareholder`, `beneficial_owner`, `subsidiary`, `parent_company`
  - **Correspondance Floue :** Similarité par trigrammes PostgreSQL `pg_trgm` étendue pour correspondre sur le numéro de passeport, le NIF et les champs de nom
  - **Point d'Accès :** `GET /api/borrowers/fuzzy-match?name=<requête>` — retourne les doublons potentiels avec scores de similarité sur tous les champs d'identité

  ### 13.12 Prise en Charge de la Langue Portugaise (ENT-12)

  **Objectif :** Localisation complète en portugais (pt) pour toutes les interfaces système, étendant les traductions existantes en anglais/français.

  **Architecture :**
  - **Fichier de Traduction :** `client/src/lib/i18n-pt.ts` — ressource de traduction PT complète couvrant toutes les chaînes de l'interface
  - **Intégration :** Enregistré comme ressource de langue `pt` dans la configuration i18next de `client/src/lib/i18n.ts`
  - **Sélecteur de Langue :** Sélecteur de langue manuel disponible sur la page de connexion et l'en-tête principal de l'application (`client/src/components/language-switcher.tsx`)
  - **Couverture :** Toute la navigation, les formulaires, les messages d'erreur, les libellés du tableau de bord et les clés spécifiques aux fonctionnalités (AMF, chatbot, téléversement par lots, litiges, etc.)
  
---

*Fin de la Documentation Système*

*Document préparé par Systems In Motion Limited*  
*Système de Hub Central de Données Inter-Juridictionnel et Registre de Crédit v1.1*
