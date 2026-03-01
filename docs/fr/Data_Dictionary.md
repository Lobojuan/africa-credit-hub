# Dictionnaire de Données

## Système de Hub Central de Données Inter-Juridictionnel et Registre de Crédit v1.1

**Préparé pour :** Systems In Motion Limited  
**Version du Document :** 1.1  
**Date :** Mars 2026

---

## 1. Aperçu

Ce document fournit une documentation au niveau des champs pour les 15 tables de la base de données du Système de Registre de Crédit. La base de données utilise PostgreSQL avec Drizzle ORM pour la gestion du schéma.

**Améliorations Entreprise (v1.1) — Résumé de l'Impact sur le Schéma :**

| Amélioration | Modifications du Schéma |
|--------------|------------------------|
| ENT-01 (MFA) | Ajout des colonnes `mfa_secret` et `mfa_enabled` à la table `users` |
| ENT-02 (Correspondance Floue) | Aucune nouvelle table/colonne ; utilise l'extension PostgreSQL `pg_trgm` sur les colonnes existantes `borrowers.first_name`/`borrowers.last_name` |
| ENT-03 (Chatbot de Litiges) | Aucune nouvelle table/colonne ; utilise la table `disputes` existante pour les litiges déposés automatiquement |
| ENT-04 (OAuth 2.1) | Aucune nouvelle table/colonne ; les jetons JWT sont sans état et signés en mémoire en utilisant les `api_keys` existantes pour la validation |
| ENT-05 (Faible Bande Passante) | Aucune modification du schéma ; la compression et le fractionnement de code sont des optimisations au niveau applicatif |
| ENT-06 (Téléversement XBRL) | Aucune nouvelle table/colonne ; les enregistrements XBRL/XML sont analysés et insérés dans la table `credit_accounts` existante via le téléversement par lot |
| ENT-07 (Chaîne de Hachage) | Ajout des colonnes `previous_hash` et `current_hash` à la table `audit_logs` |

---

## 2. Types Énumérés

### 2.1 user_role
| Valeur | Description |
|--------|-------------|
| admin | Accès complet au système, gestion des utilisateurs, gestion des institutions, gestion des clés API |
| regulator | Accès aux journaux d'audit, facturation, approbations, analyses |
| lender | Saisie de données, gestion des emprunteurs, téléversement par lot |
| viewer | Accès en lecture seule aux emprunteurs, comptes, rapports |

### 2.2 user_status
| Valeur | Description |
|--------|-------------|
| active | L'utilisateur peut se connecter et accéder au système |
| suspended | L'utilisateur est temporairement interdit d'accès |
| deactivated | L'utilisateur est définitivement interdit d'accès |

### 2.3 borrower_type
| Valeur | Description |
|--------|-------------|
| individual | Emprunteur personne physique |
| corporate | Emprunteur personne morale |

### 2.4 account_status
| Valeur | Description |
|--------|-------------|
| current | Compte en règle avec paiements à jour |
| delinquent | Compte avec des paiements en retard |
| default | Compte en défaut (retard grave) |
| closed | Compte entièrement remboursé et clôturé |
| restructured | Compte qui a été restructuré |
| written_off | Compte passé en perte |

### 2.5 inquiry_purpose
| Valeur | Description |
|--------|-------------|
| new_credit | Demande de renseignements pour une nouvelle demande de crédit |
| review | Revue périodique du compte |
| collection | Demande de renseignements liée au recouvrement |
| regulatory | Examen réglementaire |
| portfolio_monitoring | Surveillance des risques du portefeuille |

### 2.6 approval_status
| Valeur | Description |
|--------|-------------|
| pending | En attente de révision |
| approved | Approuvé par le réviseur |
| rejected | Rejeté par le réviseur |

### 2.7 dispute_status
| Valeur | Description |
|--------|-------------|
| open | Litige nouvellement déposé |
| under_review | Litige en cours d'investigation |
| resolved | Litige résolu |
| rejected | Litige rejeté |

### 2.8 judgment_type
| Valeur | Description |
|--------|-------------|
| lien | Privilège légal sur un bien |
| bankruptcy | Dépôt de bilan |
| lawsuit | Procès en cours |
| civil_judgment | Jugement civil |
| criminal_conviction | Condamnation pénale |

### 2.9 judgment_status
| Valeur | Description |
|--------|-------------|
| active | Jugement actuellement en vigueur |
| resolved | Jugement résolu ou satisfait |
| appealed | Jugement en appel |

### 2.10 consent_status
| Valeur | Description |
|--------|-------------|
| active | Consentement actuellement actif |
| revoked | Consentement révoqué |

### 2.11 payment_status
| Valeur | Description |
|--------|-------------|
| on_time | Paiement effectué dans les délais |
| late | Paiement effectué après la date d'échéance |
| missed | Paiement non effectué |
| partial | Paiement partiel effectué |

### 2.12 institution_status
| Valeur | Description |
|--------|-------------|
| pending | En attente d'approbation par l'administrateur |
| active | Approuvé et actif |
| suspended | Temporairement suspendu |

### 2.13 billing_status
| Valeur | Description |
|--------|-------------|
| pending | Facture en attente de paiement |
| paid | Facture payée |
| overdue | Facture en retard de paiement |

### 2.14 api_key_status
| Valeur | Description |
|--------|-------------|
| active | Clé API active et utilisable |
| revoked | Clé API révoquée |

---

## 3. Définitions des Tables

### 3.1 users

**Description :** Utilisateurs du système avec identifiants d'authentification, rôles et suivi des connexions.

| Nom du Champ | Type de Données | Contraintes | Description | Valeur Exemple |
|--------------|-----------------|-------------|-------------|----------------|
| id | varchar | PRIMARY KEY, DEFAULT gen_random_uuid() | Identifiant unique de l'utilisateur | `a1b2c3d4-e5f6-7890-abcd-ef1234567890` |
| username | text | NOT NULL, UNIQUE | Nom d'utilisateur de connexion | `admin` |
| password | text | NOT NULL | Mot de passe haché avec bcrypt | `$2a$10$...` |
| full_name | text | NOT NULL | Nom complet de l'utilisateur | `System Administrator` |
| email | text | NOT NULL | Adresse e-mail de l'utilisateur | `admin@sim.com` |
| role | user_role | NOT NULL, DEFAULT 'viewer' | Rôle de l'utilisateur pour le RBAC | `admin` |
| status | user_status | NOT NULL, DEFAULT 'active' | Statut du compte | `active` |
| institution | text | NULLABLE | Nom de l'institution associée | `National Bank of Ethiopia` |
| failed_login_attempts | integer | DEFAULT 0 | Compteur de tentatives de connexion échouées | `2` |
| locked_until | timestamp | NULLABLE | Date d'expiration du verrouillage du compte | `2026-02-28T10:30:00Z` |
| last_login | timestamp | NULLABLE | Horodatage de la dernière connexion réussie | `2026-02-28T09:00:00Z` |
| password_changed_at | timestamp | NULLABLE | Horodatage du dernier changement de mot de passe | `2026-02-28T00:00:00Z` |
| must_change_password | boolean | DEFAULT false | Forcer le changement de mot de passe à la prochaine connexion | `false` |
| mfa_secret | varchar | NULLABLE | Secret MFA TOTP (encodé en base32) ; renseigné lors de la configuration MFA (ENT-01) | `JBSWY3DPEHPK3PXP` |
| mfa_enabled | boolean | DEFAULT false | Indique si le MFA TOTP est activé pour l'utilisateur (ENT-01) | `false` |
| created_at | timestamp | DEFAULT NOW() | Horodatage de création de l'enregistrement | `2026-02-28T00:00:00Z` |

---

### 3.2 borrowers

**Description :** Enregistrements des emprunteurs individuels et corporatifs avec informations démographiques, professionnelles et PPE.

| Nom du Champ | Type de Données | Contraintes | Description | Valeur Exemple |
|--------------|-----------------|-------------|-------------|----------------|
| id | varchar | PRIMARY KEY, DEFAULT gen_random_uuid() | Identifiant unique de l'emprunteur | `b2c3d4e5-f6a7-8901-bcde-f23456789012` |
| type | borrower_type | NOT NULL | Catégorie de l'emprunteur | `individual` |
| first_name | text | NULLABLE | Prénom (emprunteurs individuels) | `Abebe` |
| last_name | text | NULLABLE | Nom de famille (emprunteurs individuels) | `Bekele` |
| company_name | text | NULLABLE | Nom de l'entreprise (emprunteurs corporatifs) | `Ethio Telecom` |
| national_id | text | NOT NULL, UNIQUE | Numéro d'identification national | `ETH-1234567890` |
| tin_number | text | NULLABLE | Numéro d'Identification Fiscale | `TIN-9876543210` |
| date_of_birth | text | NULLABLE | Date de naissance (format AAAA-MM-JJ) | `1985-03-15` |
| gender | text | NULLABLE | Genre | `male` |
| phone | text | NULLABLE | Numéro de téléphone | `+251911234567` |
| email | text | NULLABLE | Adresse e-mail | `abebe@example.com` |
| address | text | NULLABLE | Adresse postale | `Bole Road, Addis Ababa` |
| city | text | NULLABLE | Ville | `Addis Ababa` |
| region | text | NULLABLE | Région/État | `Addis Ababa` |
| employer_name | text | NULLABLE | Employeur actuel | `Ethiopian Airlines` |
| occupation | text | NULLABLE | Profession/Titre du poste | `Engineer` |
| business_reg_number | text | NULLABLE | Numéro d'enregistrement commercial (corporatif) | `BR-2024-001` |
| sector | text | NULLABLE | Secteur d'activité (corporatif) | `Technology` |
| is_pep | boolean | DEFAULT false | Indicateur de Personne Politiquement Exposée | `false` |
| pep_details | text | NULLABLE | Détails/description PPE | `Former government minister` |
| related_borrower_id | varchar | NULLABLE | ID de l'emprunteur lié/associé | `c3d4e5f6-a7b8-9012-cdef-345678901234` |
| relationship_type | text | NULLABLE | Relation avec l'emprunteur lié | `spouse` |
| education_level | text | NULLABLE | Niveau d'éducation le plus élevé | `bachelors` |
| education_institution | text | NULLABLE | Nom de l'établissement d'enseignement | `Addis Ababa University` |
| employment_history | text | NULLABLE | Historique professionnel | `5 years at Ethiopian Airlines` |
| created_at | timestamp | DEFAULT NOW() | Horodatage de création de l'enregistrement | `2026-02-28T00:00:00Z` |
| updated_at | timestamp | DEFAULT NOW() | Horodatage de la dernière mise à jour | `2026-02-28T10:00:00Z` |

---

### 3.3 credit_accounts

**Description :** Enregistrements de prêts et de facilités de crédit avec support multi-devises, caractéristiques spéciales de prêt et suivi des restructurations.

| Nom du Champ | Type de Données | Contraintes | Description | Valeur Exemple |
|--------------|-----------------|-------------|-------------|----------------|
| id | varchar | PRIMARY KEY, DEFAULT gen_random_uuid() | Identifiant unique du compte | `d4e5f6a7-b8c9-0123-def0-456789012345` |
| borrower_id | varchar | NOT NULL, FK -> borrowers.id | Emprunteur associé | `b2c3d4e5-f6a7-8901-bcde-f23456789012` |
| lender_institution | text | NOT NULL | Nom de l'institution prêteuse | `Commercial Bank of Ethiopia` |
| account_number | text | NOT NULL | Numéro de compte/prêt | `ACC-2024-001234` |
| account_type | text | NOT NULL | Type de facilité de crédit | `term_loan` |
| original_amount | decimal(15,2) | NOT NULL | Montant initialement décaissé | `500000.00` |
| current_balance | decimal(15,2) | NOT NULL | Solde restant actuel | `350000.00` |
| currency | text | NOT NULL, DEFAULT 'ETB' | Code de devise | `ETB` |
| interest_rate | decimal(5,2) | NULLABLE | Taux d'intérêt annuel en pourcentage | `12.50` |
| disbursement_date | text | NULLABLE | Date de décaissement du prêt | `2024-01-15` |
| maturity_date | text | NULLABLE | Date d'échéance du prêt | `2029-01-15` |
| status | account_status | NOT NULL, DEFAULT 'current' | Statut du compte | `current` |
| days_in_arrears | integer | DEFAULT 0 | Nombre de jours d'arriérés | `0` |
| collateral_type | text | NULLABLE | Type de garantie mise en gage | `real_estate` |
| collateral_value | decimal(15,2) | NULLABLE | Valeur de la garantie | `750000.00` |
| last_payment_date | text | NULLABLE | Date du dernier paiement | `2026-02-28` |
| last_payment_amount | decimal(15,2) | NULLABLE | Montant du dernier paiement | `15000.00` |
| is_interest_free | boolean | DEFAULT false | Indicateur de prêt sans intérêt | `false` |
| grace_period_months | integer | NULLABLE | Période de grâce en mois | `6` |
| restructure_count | integer | DEFAULT 0 | Nombre de restructurations | `0` |
| written_off_date | text | NULLABLE | Date de passage en perte du compte | `null` |
| reinstated_date | text | NULLABLE | Date de rétablissement du compte | `null` |
| created_at | timestamp | DEFAULT NOW() | Horodatage de création de l'enregistrement | `2026-02-28T00:00:00Z` |
| updated_at | timestamp | DEFAULT NOW() | Horodatage de la dernière mise à jour | `2026-02-28T10:00:00Z` |

---

### 3.4 credit_inquiries

**Description :** Enregistrements des vérifications de références de crédit effectuées sur les emprunteurs.

| Nom du Champ | Type de Données | Contraintes | Description | Valeur Exemple |
|--------------|-----------------|-------------|-------------|----------------|
| id | varchar | PRIMARY KEY, DEFAULT gen_random_uuid() | Identifiant unique de la demande | `e5f6a7b8-c9d0-1234-ef01-567890123456` |
| borrower_id | varchar | NOT NULL, FK -> borrowers.id | Emprunteur faisant l'objet de la demande | `b2c3d4e5-f6a7-8901-bcde-f23456789012` |
| inquired_by | varchar | NOT NULL, FK -> users.id | Utilisateur ayant effectué la demande | `a1b2c3d4-e5f6-7890-abcd-ef1234567890` |
| purpose | inquiry_purpose | NOT NULL | Objet de la demande de crédit | `new_credit` |
| institution | text | NOT NULL | Institution effectuant la demande | `Commercial Bank of Ethiopia` |
| consent_provided | boolean | NOT NULL, DEFAULT false | Indique si le consentement de l'emprunteur a été obtenu | `true` |
| created_at | timestamp | DEFAULT NOW() | Horodatage de la demande | `2026-02-28T09:30:00Z` |

---

### 3.5 audit_logs

**Description :** Journal d'activité immuable pour toutes les opérations du système avec suivi des adresses IP.

| Nom du Champ | Type de Données | Contraintes | Description | Valeur Exemple |
|--------------|-----------------|-------------|-------------|----------------|
| id | varchar | PRIMARY KEY, DEFAULT gen_random_uuid() | Identifiant unique de l'entrée de journal | `f6a7b8c9-d0e1-2345-f012-678901234567` |
| user_id | varchar | NULLABLE, FK -> users.id | Utilisateur ayant effectué l'action | `a1b2c3d4-e5f6-7890-abcd-ef1234567890` |
| action | text | NOT NULL | Type d'action effectuée | `LOGIN`, `CREATE`, `UPDATE`, `APPROVE` |
| entity | text | NOT NULL | Type d'entité affectée | `user`, `borrower`, `credit_account` |
| entity_id | varchar | NULLABLE | ID de l'entité affectée | `b2c3d4e5-f6a7-8901-bcde-f23456789012` |
| details | text | NULLABLE | Détails lisibles de l'action | `Created user: John Doe` |
| ip_address | text | NULLABLE | Adresse IP du client | `192.168.1.100` |
| previous_hash | text | NULLABLE | Hachage SHA-256 de l'entrée précédente du journal d'audit dans la chaîne de hachage (ENT-07) ; `"genesis"` pour la première entrée | `genesis` ou `a1b2c3d4...` |
| current_hash | text | NULLABLE | Hachage SHA-256 de cette entrée du journal d'audit calculé à partir de `previousHash` + `action` + `entity` + `details` + `timestamp` (ENT-07) | `e3b0c44298fc1c14...` |
| created_at | timestamp | DEFAULT NOW() | Horodatage de l'entrée de journal | `2026-02-28T09:30:00Z` |

---

### 3.6 pending_approvals

**Description :** File d'attente du flux de travail de contrôle à double validation (maker-checker) pour les approbations de modifications de données.

| Nom du Champ | Type de Données | Contraintes | Description | Valeur Exemple |
|--------------|-----------------|-------------|-------------|----------------|
| id | varchar | PRIMARY KEY, DEFAULT gen_random_uuid() | Identifiant unique de la demande d'approbation | `a7b8c9d0-e1f2-3456-0123-789012345678` |
| entity_type | text | NOT NULL | Type d'entité modifiée | `borrower`, `credit_account` |
| entity_id | varchar | NULLABLE | ID de l'entité existante (pour les mises à jour) | `b2c3d4e5-f6a7-8901-bcde-f23456789012` |
| action | text | NOT NULL | Type de modification demandée | `CREATE`, `UPDATE` |
| payload | text | NOT NULL | Données de modification sérialisées en JSON | `{"firstName":"Abebe","lastName":"Bekele",...}` |
| requested_by | varchar | NOT NULL, FK -> users.id | Utilisateur ayant soumis la demande | `a1b2c3d4-e5f6-7890-abcd-ef1234567890` |
| reviewed_by | varchar | NULLABLE, FK -> users.id | Utilisateur ayant révisé la demande | `c3d4e5f6-a7b8-9012-cdef-345678901234` |
| status | approval_status | NOT NULL, DEFAULT 'pending' | Statut actuel de l'approbation | `pending` |
| review_notes | text | NULLABLE | Notes/commentaires du réviseur | `Approved - verified documentation` |
| created_at | timestamp | DEFAULT NOW() | Horodatage de soumission de la demande | `2026-02-28T09:30:00Z` |
| reviewed_at | timestamp | NULLABLE | Horodatage de la révision | `2026-02-28T10:00:00Z` |

---

### 3.7 disputes

**Description :** Enregistrements de litiges et réclamations avec suivi des SLA et catégorisation du type de correction.

| Nom du Champ | Type de Données | Contraintes | Description | Valeur Exemple |
|--------------|-----------------|-------------|-------------|----------------|
| id | varchar | PRIMARY KEY, DEFAULT gen_random_uuid() | Identifiant unique du litige | `b8c9d0e1-f2a3-4567-1234-890123456789` |
| borrower_id | varchar | NOT NULL, FK -> borrowers.id | Emprunteur déposant le litige | `b2c3d4e5-f6a7-8901-bcde-f23456789012` |
| credit_account_id | varchar | NULLABLE, FK -> credit_accounts.id | Compte de crédit concerné | `d4e5f6a7-b8c9-0123-def0-456789012345` |
| filed_by | varchar | NOT NULL, FK -> users.id | Utilisateur ayant déposé le litige | `a1b2c3d4-e5f6-7890-abcd-ef1234567890` |
| dispute_type | text | NOT NULL | Catégorie du litige | `incorrect_balance`, `wrong_status`, `identity_error` |
| description | text | NOT NULL | Description détaillée du litige | `Balance shows 500,000 ETB but should be 350,000 ETB` |
| status | dispute_status | NOT NULL, DEFAULT 'open' | Statut actuel du litige | `open` |
| resolution | text | NULLABLE | Description de la résolution | `Balance corrected to 350,000 ETB` |
| correction_type | text | NULLABLE | Correction financière ou non financière | `financial` |
| sla_deadline | timestamp | NULLABLE | Date limite SLA (2 jours financier, 5 jours non financier) | `2026-03-02T09:30:00Z` |
| created_at | timestamp | DEFAULT NOW() | Horodatage du dépôt du litige | `2026-02-28T09:30:00Z` |
| updated_at | timestamp | DEFAULT NOW() | Horodatage de la dernière mise à jour | `2026-02-28T10:00:00Z` |
| resolved_at | timestamp | NULLABLE | Horodatage de la résolution | `2026-02-28T14:00:00Z` |

---

### 3.8 notifications

**Description :** Système de notifications intégrées à l'application pour les demandes d'approbation, résultats et alertes système.

| Nom du Champ | Type de Données | Contraintes | Description | Valeur Exemple |
|--------------|-----------------|-------------|-------------|----------------|
| id | varchar | PRIMARY KEY, DEFAULT gen_random_uuid() | Identifiant unique de la notification | `c9d0e1f2-a3b4-5678-2345-901234567890` |
| user_id | varchar | NULLABLE, FK -> users.id | Utilisateur cible (null = diffusion) | `a1b2c3d4-e5f6-7890-abcd-ef1234567890` |
| type | text | NOT NULL | Catégorie de notification | `approval_pending`, `approval_result`, `dispute_filed` |
| title | text | NOT NULL | Titre de la notification | `New approval pending` |
| message | text | NOT NULL | Corps de la notification | `New borrower registration requires your review` |
| is_read | boolean | DEFAULT false | Indicateur de lecture | `false` |
| link | text | NULLABLE | Lien de navigation | `/approvals` |
| created_at | timestamp | DEFAULT NOW() | Horodatage de la notification | `2026-02-28T09:30:00Z` |

---

### 3.9 court_judgments

**Description :** Jugements judiciaires, faillites et privilèges associés aux emprunteurs (FR-COL-05).

| Nom du Champ | Type de Données | Contraintes | Description | Valeur Exemple |
|--------------|-----------------|-------------|-------------|----------------|
| id | varchar | PRIMARY KEY, DEFAULT gen_random_uuid() | Identifiant unique du jugement | `d0e1f2a3-b4c5-6789-3456-012345678901` |
| borrower_id | varchar | NOT NULL, FK -> borrowers.id | Emprunteur associé | `b2c3d4e5-f6a7-8901-bcde-f23456789012` |
| case_number | text | NOT NULL | Numéro de référence de l'affaire judiciaire | `CASE-2024-5678` |
| court | text | NOT NULL | Nom du tribunal | `Federal High Court, Addis Ababa` |
| judgment_type | judgment_type | NOT NULL | Type de jugement | `civil_judgment` |
| amount | decimal(15,2) | NULLABLE | Montant du jugement | `1000000.00` |
| currency | text | DEFAULT 'ETB' | Devise du montant du jugement | `ETB` |
| judgment_date | text | NOT NULL | Date de prononcé du jugement | `2024-06-15` |
| status | judgment_status | NOT NULL, DEFAULT 'active' | Statut actuel du jugement | `active` |
| description | text | NULLABLE | Détails du jugement | `Civil judgment for unpaid commercial loan` |
| created_at | timestamp | DEFAULT NOW() | Horodatage de création de l'enregistrement | `2026-02-28T09:30:00Z` |

---

### 3.10 consent_records

**Description :** Gestion du consentement des personnes concernées avec numéros de reçu (FR-CON-06/07).

| Nom du Champ | Type de Données | Contraintes | Description | Valeur Exemple |
|--------------|-----------------|-------------|-------------|----------------|
| id | varchar | PRIMARY KEY, DEFAULT gen_random_uuid() | Identifiant unique de l'enregistrement de consentement | `e1f2a3b4-c5d6-7890-4567-123456789012` |
| borrower_id | varchar | NOT NULL, FK -> borrowers.id | Emprunteur accordant le consentement | `b2c3d4e5-f6a7-8901-bcde-f23456789012` |
| granted_to | text | NOT NULL | Entité recevant le consentement | `Commercial Bank of Ethiopia` |
| purpose | text | NOT NULL | Objet du consentement | `credit_check`, `data_sharing` |
| consent_type | text | NOT NULL | Type de consentement | `one_time`, `recurring` |
| status | consent_status | NOT NULL, DEFAULT 'active' | Statut actuel du consentement | `active` |
| granted_at | timestamp | DEFAULT NOW() | Horodatage d'octroi du consentement | `2026-02-28T09:30:00Z` |
| revoked_at | timestamp | NULLABLE | Horodatage de révocation du consentement | `null` |
| receipt_number | text | NOT NULL | Numéro de reçu unique du consentement | `CR-1705312200000-abc123` |
| created_at | timestamp | DEFAULT NOW() | Horodatage de création de l'enregistrement | `2026-02-28T09:30:00Z` |

---

### 3.11 payment_history

**Description :** Historique de performance de paiement sur 12 périodes par compte de crédit (FR-CR-08).

| Nom du Champ | Type de Données | Contraintes | Description | Valeur Exemple |
|--------------|-----------------|-------------|-------------|----------------|
| id | varchar | PRIMARY KEY, DEFAULT gen_random_uuid() | Identifiant unique de l'enregistrement de paiement | `f2a3b4c5-d6e7-8901-5678-234567890123` |
| credit_account_id | varchar | NOT NULL, FK -> credit_accounts.id | Compte de crédit associé | `d4e5f6a7-b8c9-0123-def0-456789012345` |
| period | text | NOT NULL | Période de paiement (format AAAA-MM) | `2026-02` |
| amount_due | decimal(15,2) | NOT NULL | Montant dû pour la période | `15000.00` |
| amount_paid | decimal(15,2) | NOT NULL | Montant effectivement payé | `15000.00` |
| status | payment_status | NOT NULL, DEFAULT 'on_time' | Statut du paiement pour la période | `on_time` |
| days_late | integer | DEFAULT 0 | Nombre de jours de retard du paiement | `0` |
| created_at | timestamp | DEFAULT NOW() | Horodatage de création de l'enregistrement | `2026-02-28T09:30:00Z` |

---

### 3.12 institutions

**Description :** Inscription des institutions fournisseuses de données avec flux d'approbation (FR-DP-01/04).

| Nom du Champ | Type de Données | Contraintes | Description | Valeur Exemple |
|--------------|-----------------|-------------|-------------|----------------|
| id | varchar | PRIMARY KEY, DEFAULT gen_random_uuid() | Identifiant unique de l'institution | `a3b4c5d6-e7f8-9012-6789-345678901234` |
| name | text | NOT NULL | Nom de l'institution | `Commercial Bank of Ethiopia` |
| type | text | NOT NULL | Type d'institution | `bank`, `mfi`, `utility`, `telecom`, `digital_lender`, `sacco` |
| registration_number | text | NULLABLE | Numéro d'enregistrement officiel | `REG-2024-001` |
| country | text | NOT NULL, DEFAULT 'Ethiopia' | Pays d'opération | `Ethiopia` |
| contact_email | text | NULLABLE | Adresse e-mail de contact | `info@cbe.com.et` |
| contact_phone | text | NULLABLE | Numéro de téléphone de contact | `+251111234567` |
| address | text | NULLABLE | Adresse physique | `Churchill Avenue, Addis Ababa` |
| status | institution_status | NOT NULL, DEFAULT 'pending' | Statut d'inscription | `active` |
| submission_frequency | text | DEFAULT 'monthly' | Fréquence de soumission des données | `monthly` |
| approved_by | varchar | NULLABLE, FK -> users.id | Administrateur ayant approuvé | `a1b2c3d4-e5f6-7890-abcd-ef1234567890` |
| approved_at | timestamp | NULLABLE | Horodatage de l'approbation | `2026-02-28T10:00:00Z` |
| created_at | timestamp | DEFAULT NOW() | Horodatage de l'inscription | `2026-02-28T00:00:00Z` |

---

### 3.13 billing_records

**Description :** Gestion de la facturation et des frais pour les institutions (FR-COMM-01/05).

| Nom du Champ | Type de Données | Contraintes | Description | Valeur Exemple |
|--------------|-----------------|-------------|-------------|----------------|
| id | varchar | PRIMARY KEY, DEFAULT gen_random_uuid() | Identifiant unique de l'enregistrement de facturation | `b4c5d6e7-f8a9-0123-7890-456789012345` |
| institution_name | text | NOT NULL | Nom de l'institution facturée | `Commercial Bank of Ethiopia` |
| service_type | text | NOT NULL | Type de service facturé | `data_submission`, `credit_report`, `api_access`, `subscription` |
| amount | decimal(15,2) | NOT NULL | Montant de la facture | `50000.00` |
| currency | text | NOT NULL, DEFAULT 'ETB' | Devise de la facture | `ETB` |
| status | billing_status | NOT NULL, DEFAULT 'pending' | Statut de paiement | `pending` |
| invoice_number | text | NOT NULL | Numéro de facture unique | `INV-2025-001234` |
| period_start | text | NULLABLE | Date de début de la période de facturation | `2026-02-28` |
| period_end | text | NULLABLE | Date de fin de la période de facturation | `2026-02-28` |
| created_at | timestamp | DEFAULT NOW() | Horodatage de création de la facture | `2026-02-28T09:30:00Z` |

---

### 3.14 credit_report_logs

**Description :** Journaux de génération de rapports de crédit avec numéros de série uniques (FR-CR-06).

| Nom du Champ | Type de Données | Contraintes | Description | Valeur Exemple |
|--------------|-----------------|-------------|-------------|----------------|
| id | varchar | PRIMARY KEY, DEFAULT gen_random_uuid() | Identifiant unique du journal | `c5d6e7f8-a9b0-1234-8901-567890123456` |
| borrower_id | varchar | NOT NULL, FK -> borrowers.id | Emprunteur pour lequel le rapport a été généré | `b2c3d4e5-f6a7-8901-bcde-f23456789012` |
| requested_by | varchar | NOT NULL, FK -> users.id | Utilisateur ayant demandé le rapport | `a1b2c3d4-e5f6-7890-abcd-ef1234567890` |
| institution | text | NOT NULL | Institution demandeuse | `Commercial Bank of Ethiopia` |
| purpose | text | NOT NULL | Objet de la génération du rapport | `new_credit` |
| serial_number | text | NOT NULL, UNIQUE | Numéro de série unique du rapport | `CR-2025-M1A2B3C4` |
| created_at | timestamp | DEFAULT NOW() | Horodatage de génération du rapport | `2026-02-28T09:30:00Z` |

---

### 3.15 api_keys

**Description :** Gestion des clés API externes avec hachage SHA-256, niveaux de permissions et association aux institutions.

| Nom du Champ | Type de Données | Contraintes | Description | Valeur Exemple |
|--------------|-----------------|-------------|-------------|----------------|
| id | varchar | PRIMARY KEY, DEFAULT gen_random_uuid() | Identifiant unique de l'enregistrement de clé API | `d6e7f8a9-b0c1-2345-9012-678901234567` |
| institution_id | varchar | NOT NULL, FK -> institutions.id | Institution associée | `a3b4c5d6-e7f8-9012-6789-345678901234` |
| key_hash | text | NOT NULL | Hachage SHA-256 de la clé API complète | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| key_prefix | text | NOT NULL | Préfixe visible de la clé pour identification | `sim_a1b2c3d4` |
| label | text | NOT NULL | Libellé lisible de la clé | `Production API Key` |
| status | api_key_status | NOT NULL, DEFAULT 'active' | Statut de la clé | `active` |
| permissions | text | NOT NULL, DEFAULT 'submit' | Niveau de permission | `submit`, `read`, `full` |
| last_used_at | timestamp | NULLABLE | Horodatage du dernier appel API | `2026-02-28T14:30:00Z` |
| created_by | varchar | NOT NULL, FK -> users.id | Administrateur ayant créé la clé | `a1b2c3d4-e5f6-7890-abcd-ef1234567890` |
| created_at | timestamp | DEFAULT NOW() | Horodatage de création de la clé | `2026-02-28T09:30:00Z` |
| revoked_at | timestamp | NULLABLE | Horodatage de révocation de la clé | `null` |

---

## 4. Diagramme de Relations (Basé sur le Texte)

```
users
  |
  +--< credit_inquiries (inquired_by -> users.id)
  +--< pending_approvals (requested_by -> users.id)
  +--< pending_approvals (reviewed_by -> users.id)
  +--< disputes (filed_by -> users.id)
  +--< notifications (user_id -> users.id)
  +--< audit_logs (user_id -> users.id)
  +--< credit_report_logs (requested_by -> users.id)
  +--< api_keys (created_by -> users.id)
  +--< institutions (approved_by -> users.id)

borrowers
  |
  +--< credit_accounts (borrower_id -> borrowers.id)
  +--< credit_inquiries (borrower_id -> borrowers.id)
  +--< disputes (borrower_id -> borrowers.id)
  +--< court_judgments (borrower_id -> borrowers.id)
  +--< consent_records (borrower_id -> borrowers.id)
  +--< credit_report_logs (borrower_id -> borrowers.id)
  +--  borrowers (related_borrower_id -> borrowers.id) [auto-référentiel]

credit_accounts
  |
  +--< payment_history (credit_account_id -> credit_accounts.id)
  +--< disputes (credit_account_id -> credit_accounts.id)

institutions
  |
  +--< api_keys (institution_id -> institutions.id)
```

**Légende :**
- `+--<` = Relation Un-à-Plusieurs (parent vers enfant)
- `+--` = Référence optionnelle (auto-référentielle ou FK nullable)

---

## 5. Devises Supportées

| Code | Nom de la Devise | Juridictions |
|------|------------------|--------------|
| ETB | Birr Éthiopien | Éthiopie |
| GHS | Cédi Ghanéen | Ghana |
| UGX | Shilling Ougandais | Ouganda |
| LRD | Dollar Libérien | Libéria |
| USD | Dollar Américain | Toutes |
| EUR | Euro | Toutes |
| GBP | Livre Sterling | Toutes |
| KES | Shilling Kényan | Régional |
| NGN | Naira Nigérian | Régional |
| ZAR | Rand Sud-Africain | Régional |
| TZS | Shilling Tanzanien | Régional |
| RWF | Franc Rwandais | Régional |
| XOF | Franc CFA Ouest-Africain | Régional |
| XAF | Franc CFA d'Afrique Centrale | Régional |
| EGP | Livre Égyptienne | Régional |
| MAD | Dirham Marocain | Régional |
| BWP | Pula du Botswana | Régional |

---

## 6. Résumé des Index

| Table | Colonnes Indexées | Type d'Index |
|-------|-------------------|--------------|
| users | id (PK), username (UNIQUE) | B-tree |
| borrowers | id (PK), national_id (UNIQUE) | B-tree |
| credit_accounts | id (PK), borrower_id (FK) | B-tree |
| credit_inquiries | id (PK), borrower_id (FK), inquired_by (FK) | B-tree |
| audit_logs | id (PK), user_id (FK) | B-tree |
| pending_approvals | id (PK), requested_by (FK), reviewed_by (FK) | B-tree |
| disputes | id (PK), borrower_id (FK), credit_account_id (FK), filed_by (FK) | B-tree |
| notifications | id (PK), user_id (FK) | B-tree |
| court_judgments | id (PK), borrower_id (FK) | B-tree |
| consent_records | id (PK), borrower_id (FK) | B-tree |
| payment_history | id (PK), credit_account_id (FK) | B-tree |
| institutions | id (PK), approved_by (FK) | B-tree |
| billing_records | id (PK) | B-tree |
| credit_report_logs | id (PK), borrower_id (FK), requested_by (FK), serial_number (UNIQUE) | B-tree |
| api_keys | id (PK), institution_id (FK), created_by (FK) | B-tree |
