# Matrice de Traçabilité SRS

## Système Central de Hub de Données Inter-Juridictionnel & Registre de Crédit v1.1

**Préparé pour :** Systems In Motion Limited  
**Version du Document :** 1.1  
**Date :** Mars 2026

---

## 1. Objectif

Ce document fait correspondre chaque exigence de la Spécification des Exigences Logicielles (SRS) à son état d'implémentation au sein du Système de Registre de Crédit. Il assure la traçabilité des exigences à travers l'implémentation jusqu'aux cas de test de Recette Utilisateur (UAT).

---

## 2. Légende de Traçabilité

| Statut | Description |
|--------|-------------|
| Implémenté | Entièrement implémenté et fonctionnel |
| Partiel | Partiellement implémenté avec des limitations notées |
| Non Implémenté | Pas encore implémenté |

---

## 3. Exigences de Collecte de Données (FR-COL)

| Réf. SRS | Description de l'Exigence | Statut | Module/Composant | Notes d'Implémentation | Cas de Test UAT |
|-----------|--------------------------|--------|-------------------|------------------------|-----------------|
| FR-COL-01 | Le système doit collecter les données démographiques de l'emprunteur (nom, date de naissance, genre, identifiant national, NIF, adresse, téléphone, courriel) | Implémenté | Gestion des Emprunteurs (table `borrowers`, `borrowers.tsx`) | Tous les champs démographiques sont capturés dans le formulaire d'enregistrement de l'emprunteur ; types individuel et entreprise pris en charge | TC-BOR-001 à TC-BOR-005 |
| FR-COL-02 | Le système doit collecter les données des comptes de crédit (type de compte, montants, dates, statut, garantie, arriérés) | Implémenté | Comptes de Crédit (table `credit_accounts`, `credit-accounts.tsx`) | Création complète de comptes de crédit avec tous les champs requis, y compris multi-devises, sans intérêt, période de grâce, suivi de restructuration | TC-CA-001 à TC-CA-005 |
| FR-COL-03 | Le système doit prendre en charge l'ingestion de données en masse (JSON/CSV) | Implémenté | Téléchargement par Lots (`batch-upload.tsx`, `/api/batch-upload/credit-accounts`) | Téléchargement de fichiers JSON et CSV avec validation par enregistrement et rapport d'erreurs | TC-BATCH-001 à TC-BATCH-004 |
| FR-COL-04 | Le système doit valider la qualité des données au point d'entrée | Implémenté | Routes Serveur (`routes.ts`), Schémas Zod (`schema.ts`) | Validation par schéma Zod sur toutes les opérations d'insertion ; contraintes au niveau des champs appliquées | TC-DQ-001, TC-DQ-002 |
| FR-COL-05 | Le système doit collecter les informations sur les jugements de tribunal et les privilèges | Implémenté | Jugements de Tribunal (table `court_judgments`, `borrower-detail.tsx`) | Jugements de tribunal avec numéro de dossier, tribunal, type (privilège/faillite/procès/civil/pénal), montant, date, statut | TC-CJ-001 à TC-CJ-003 |

---

## 4. Exigences de Rapport de Crédit (FR-CR)

| Réf. SRS | Description de l'Exigence | Statut | Module/Composant | Notes d'Implémentation | Cas de Test UAT |
|-----------|--------------------------|--------|-------------------|------------------------|-----------------|
| FR-CR-01 | Le système doit générer des rapports de crédit avec un résumé de l'emprunteur | Implémenté | Rapport de Crédit (`credit-report.tsx`, `/api/borrowers/:id/credit-report`) | Rapport de crédit complet avec informations personnelles, résumé des comptes, analyse du score, historique de paiement | TC-CR-001, TC-CR-002 |
| FR-CR-02 | Le système doit calculer les scores de crédit (plage de 300 à 850) | Implémenté | Génération de Rapport de Crédit (`routes.ts`, `external-api.ts`) | Scoring algorithmique basé sur l'historique de paiement, les retards, les défauts, les passages en perte, les demandes de renseignements | TC-CR-003 |
| FR-CR-03 | Le système doit prendre en charge les vérifications de référence de crédit en masse | Implémenté | Recherche de Crédit (`credit-search.tsx`, `/api/credit-search/bulk`) | Recherche par lots multi-identifiants avec agrégation des résultats | TC-CS-003 |
| FR-CR-04 | Le système doit suivre les demandes de renseignements de crédit avec consentement | Implémenté | Demandes de Renseignements de Crédit (table `credit_inquiries`) | Journalisation des demandes avec objet, institution, indicateur de consentement | TC-CS-001, TC-CS-002 |
| FR-CR-05 | Le système doit prendre en charge plusieurs objets de demande de renseignements | Implémenté | Demandes de Renseignements de Crédit (`inquiryPurposeEnum`) | Prise en charge : new_credit, review, collection, regulatory, portfolio_monitoring | TC-CS-001 |
| FR-CR-06 | Le système doit attribuer des numéros de série uniques aux rapports de crédit | Implémenté | Journaux de Rapports de Crédit (table `credit_report_logs`, `/api/credit-reports/generate`) | Format : CR-{ANNEE}-{horodatage_base36} ; numéro de série unique par rapport | TC-CR-004 |
| FR-CR-07 | Le système doit inclure des codes de motif dans les rapports de crédit | Implémenté | Rapport de Crédit (`credit-report.tsx`, logique de scoring) | 10 codes de motif : DELINQUENT_ACCOUNTS, WRITTEN_OFF_ACCOUNTS, RESTRUCTURED_ACCOUNTS, HIGH_INQUIRY_VOLUME, HIGH_DEBT_LEVEL, COURT_JUDGMENTS_PRESENT, POLITICALLY_EXPOSED_PERSON, STRONG_REPAYMENT_HISTORY, EXCELLENT_PAYMENT_RECORD, THIN_FILE_LIMITED_HISTORY | TC-CR-005 |
| FR-CR-08 | Le système doit maintenir un historique de performance de paiement sur 12 périodes | Implémenté | Historique de Paiement (table `payment_history`, détail de l'emprunteur) | Grille de paiement sur 12 périodes avec suivi du statut (à_temps, en_retard, manqué, partiel) | TC-CR-006 |

---

## 5. Exigences de Consentement et de Litige (FR-CON)

| Réf. SRS | Description de l'Exigence | Statut | Module/Composant | Notes d'Implémentation | Cas de Test UAT |
|-----------|--------------------------|--------|-------------------|------------------------|-----------------|
| FR-CON-01 | Le système doit gérer le consentement des personnes concernées | Implémenté | Gestion du Consentement (table `consent_records`, `consent-management.tsx`) | Octroi/révocation du consentement avec type, objet, champs de bénéficiaire | TC-CON-001 |
| FR-CON-02 | Le système doit fournir un portail d'Unité de Service aux Demandes (service d'assistance) | Implémenté | Service d'Assistance (`helpdesk.tsx`) | Portail orienté consommateur pour le dépôt de litiges, la gestion du consentement, la recherche d'emprunteur | TC-HD-001 à TC-HD-004 |
| FR-CON-03 | Le système doit suivre le statut du consentement (actif/révoqué) | Implémenté | Enregistrements de Consentement (`consentStatusEnum`) | Statut actif/révoqué avec horodatage de révocation | TC-CON-002 |
| FR-CON-04 | Le système doit prendre en charge le dépôt et le suivi des litiges | Implémenté | Litiges (table `disputes`, `disputes.tsx`) | Cycle de vie complet du litige : ouvert, en_examen, résolu, rejeté | TC-DIS-001, TC-DIS-002 |
| FR-CON-05 | Le système doit catégoriser les litiges par type de correction | Implémenté | Litiges (champ `correctionType`) | Types de correction financière et non financière avec différents délais d'ANS | TC-DIS-003 |
| FR-CON-06 | Le système doit générer des numéros de reçu de consentement | Implémenté | Enregistrements de Consentement (champ `receiptNumber`) | Format : CR-{horodatage}-{aléatoire} ; reçu unique par octroi de consentement | TC-CON-003 |
| FR-CON-07 | Le système doit prendre en charge la révocation du consentement | Implémenté | Gestion du Consentement (`/api/consent-records/:id/revoke`) | Révocation avec enregistrement de l'horodatage | TC-CON-004 |
| FR-CON-08 | Le système doit permettre au service d'assistance de déposer des litiges au nom des consommateurs | Implémenté | Service d'Assistance (`helpdesk.tsx`) | Dépôt de litige depuis l'interface du service d'assistance avec contexte de l'emprunteur | TC-HD-003 |
| FR-CON-09 | Le système doit permettre au service d'assistance d'octroyer le consentement au nom des consommateurs | Implémenté | Service d'Assistance (`helpdesk.tsx`) | Octroi de consentement depuis l'interface du service d'assistance avec contexte de l'emprunteur | TC-HD-004 |

---

## 6. Exigences Réglementaires (FR-REG)

| Réf. SRS | Description de l'Exigence | Statut | Module/Composant | Notes d'Implémentation | Cas de Test UAT |
|-----------|--------------------------|--------|-------------------|------------------------|-----------------|
| FR-REG-01 | Le système doit fournir des analyses réglementaires (ratios de PNP, répartitions de portefeuille) | Implémenté | Rapports (`reports.tsx`, `/api/reports/regulatory`) | Ratios de PNP, répartitions de portefeuille par institution et type de prêt, suivi des violations d'ANS | TC-RPT-001, TC-RPT-002 |
| FR-REG-02 | Le système doit prendre en charge le rôle d'utilisateur régulateur avec accès approprié | Implémenté | RBAC (`userRoleEnum`, middleware de routes) | Rôle régulateur avec accès aux journaux d'audit, facturation, approbations, analyses | TC-AUTH-005 |
| FR-REG-03 | Le système doit appliquer le flux de travail de double validation pour les modifications de données | Implémenté | Approbations en Attente (table `pending_approvals`, `pending-approvals.tsx`) | Principe des quatre yeux : un utilisateur différent doit approuver ; auto-approbation empêchée côté serveur | TC-MC-001 à TC-MC-004 |

---

## 7. Exigences pour les Prêts Spéciaux (FR-SPEC)

| Réf. SRS | Description de l'Exigence | Statut | Module/Composant | Notes d'Implémentation | Cas de Test UAT |
|-----------|--------------------------|--------|-------------------|------------------------|-----------------|
| FR-SPEC-01 | Le système doit prendre en charge les produits de prêt sans intérêt | Implémenté | Comptes de Crédit (champ `isInterestFree`) | Indicateur booléen sur les comptes de crédit ; taux d'intérêt masqué lorsque sans intérêt | TC-CA-003 |
| FR-SPEC-02 | Le système doit prendre en charge le suivi des périodes de grâce | Implémenté | Comptes de Crédit (champ `gracePeriodMonths`) | Champ entier pour la période de grâce en mois | TC-CA-003 |
| FR-SPEC-03 | Le système doit suivre le nombre de restructurations de prêt | Implémenté | Comptes de Crédit (champ `restructureCount`) | Compteur entier pour le nombre de restructurations | TC-CA-004 |
| FR-SPEC-04 | Le système doit suivre la date de passage en perte | Implémenté | Comptes de Crédit (champ `writtenOffDate`) | Champ de date renseigné lorsque le statut du compte est passé en perte | TC-CA-004 |
| FR-SPEC-05 | Le système doit suivre la date de réhabilitation | Implémenté | Comptes de Crédit (champ `reinstatedDate`) | Champ de date pour les comptes réhabilités après passage en perte | TC-CA-004 |

---

## 8. Exigences Commerciales (FR-COMM)

| Réf. SRS | Description de l'Exigence | Statut | Module/Composant | Notes d'Implémentation | Cas de Test UAT |
|-----------|--------------------------|--------|-------------------|------------------------|-----------------|
| FR-COMM-01 | Le système doit prendre en charge la facturation et la gestion des frais | Implémenté | Facturation (table `billing_records`, `billing.tsx`) | Création de factures avec type de service, montant, devise, période | TC-BIL-001, TC-BIL-002 |
| FR-COMM-02 | Le système doit suivre le statut de paiement des factures | Implémenté | Enregistrements de Facturation (`billingStatusEnum`) | Suivi du statut : en attente, payé, en retard | TC-BIL-003 |
| FR-COMM-03 | Le système doit prendre en charge plusieurs types de services | Implémenté | Enregistrements de Facturation (champ `serviceType`) | Types de services : soumission de données, rapport de crédit, accès API, abonnement | TC-BIL-001 |
| FR-COMM-04 | Le système doit prendre en charge la facturation multi-devises | Implémenté | Enregistrements de Facturation (champ `currency`) | 17 devises prises en charge dans 4 juridictions | TC-BIL-001 |
| FR-COMM-05 | Le système doit générer des numéros de facture uniques | Implémenté | Facturation (champ `invoiceNumber`) | Numéros de facture uniques par enregistrement de facturation | TC-BIL-002 |

---

## 9. Exigences des Fournisseurs de Données (FR-DP)

| Réf. SRS | Description de l'Exigence | Statut | Module/Composant | Notes d'Implémentation | Cas de Test UAT |
|-----------|--------------------------|--------|-------------------|------------------------|-----------------|
| FR-DP-01 | Le système doit prendre en charge l'enregistrement des institutions avec un flux d'approbation | Implémenté | Institutions (table `institutions`, `institutions.tsx`) | Auto-enregistrement avec approbation par l'administrateur ; types : banque, IMF, service public, télécom, prêteur numérique, SACCO | TC-INST-001, TC-INST-002 |
| FR-DP-02 | Le système doit configurer la fréquence de soumission des institutions | Implémenté | Institutions (champ `submissionFrequency`) | Configurable : mensuel (par défaut) | TC-INST-003 |
| FR-DP-03 | Le système doit suivre le statut des institutions | Implémenté | Institutions (`institutionStatusEnum`) | Statut : en attente, actif, suspendu | TC-INST-002 |
| FR-DP-04 | Le système doit exiger l'approbation de l'administrateur pour l'activation des institutions | Implémenté | Institutions (`/api/institutions/:id/approve`) | Point de terminaison d'approbation réservé à l'administrateur avec suivi de l'approbateur et de l'horodatage | TC-INST-002 |

---

## 10. Exigences d'Intégration et de Reporting (INT-RPT)

| Réf. SRS | Description de l'Exigence | Statut | Module/Composant | Notes d'Implémentation | Cas de Test UAT |
|-----------|--------------------------|--------|-------------------|------------------------|-----------------|
| INT-RPT-01 | Le système doit prendre en charge l'exportation de données au format CSV | Implémenté | Rapports (`/api/reports/export?format=csv`) | Exportation CSV des données de portefeuille et d'emprunteur | TC-RPT-003 |
| INT-RPT-02 | Le système doit fournir une API REST externe pour la soumission de données | Implémenté | API Externe (`external-api.ts`) | API REST complète avec authentification par X-API-Key ; emprunteurs, comptes de crédit, historique de paiement, jugements de tribunal | TC-API-001 à TC-API-005 |
| INT-RPT-03 | Le système doit prendre en charge la soumission par lots via l'API | Implémenté | API Externe (`external-api.ts`) | Soumission par lots basée sur des tableaux pour les emprunteurs, comptes de crédit, historique de paiement | TC-API-004 |
| INT-RPT-04 | Le système doit fournir des rapports d'analyses réglementaires | Implémenté | Rapports (`/api/reports/regulatory`, `reports.tsx`) | Ratios de PNP, analyses de portefeuille, suivi des violations d'ANS | TC-RPT-002 |

---

## 11. Exigences de Qualité des Données (DQ)

| Réf. SRS | Description de l'Exigence | Statut | Module/Composant | Notes d'Implémentation | Cas de Test UAT |
|-----------|--------------------------|--------|-------------------|------------------------|-----------------|
| DQ-01 | Le système doit valider les données au point d'entrée | Implémenté | Schémas Zod (`schema.ts`), Routes (`routes.ts`) | Validation basée sur les schémas sur tous les points de terminaison API en utilisant drizzle-zod | TC-DQ-001 |
| DQ-02 | Le système doit appliquer des identifiants uniques (identifiant national, NIF) | Implémenté | Contraintes de Base de Données (`borrowers.nationalId` unique) | Contrainte d'unicité sur nationalId ; application au niveau de la base de données | TC-DQ-002 |
| DQ-03 | Le système doit fournir des rapports d'erreurs de qualité des données | Implémenté | Téléchargement par Lots (`batch-upload.tsx`) | Erreurs de validation par enregistrement avec détail au niveau des champs | TC-BATCH-003 |
| DQ-04 | Le système doit appliquer un ANS de 2 jours ouvrables pour les litiges financiers | Implémenté | Litiges (`createDispute` dans `storage.ts`) | Calcul automatique du délai d'ANS : 2 jours pour le type de correction financière | TC-DIS-003 |
| DQ-05 | Le système doit appliquer un ANS de 5 jours ouvrables pour les litiges non financiers | Implémenté | Litiges (`createDispute` dans `storage.ts`) | Calcul automatique du délai d'ANS : 5 jours pour le type de correction non financière | TC-DIS-003 |

---

## 12. Exigences Non Fonctionnelles de Sécurité (NFR-SEC)

| Réf. SRS | Description de l'Exigence | Statut | Module/Composant | Notes d'Implémentation | Cas de Test UAT |
|-----------|--------------------------|--------|-------------------|------------------------|-----------------|
| NFR-SEC-01 | Le système doit implémenter un contrôle d'accès basé sur les rôles (4 rôles) | Implémenté | RBAC (`userRoleEnum`, middleware `requireRole`) | 4 rôles : administrateur, régulateur, prêteur, observateur ; application côté serveur sur toutes les routes protégées | TC-AUTH-005, TC-AUTH-006 |
| NFR-SEC-02 | Le système doit hacher les mots de passe en utilisant bcrypt | Implémenté | Authentification (`bcryptjs` dans `routes.ts`) | bcrypt avec 10 tours de salage ; hachage du mot de passe à la création et au changement | TC-AUTH-001 |
| NFR-SEC-03 | Le système doit appliquer la complexité des mots de passe (8+ caractères, majuscule, minuscule, chiffre, caractère spécial) | Implémenté | Changement de Mot de Passe (`/api/auth/change-password`) | Validation par expression régulière : `/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/` | TC-AUTH-007 |
| NFR-SEC-04 | Le système doit verrouiller les comptes après 3 tentatives de connexion échouées | Implémenté | Connexion (`/api/auth/login`) | Seuil de 3 tentatives ; période de verrouillage de 15 minutes ; réinitialisation du compteur en cas de connexion réussie | TC-AUTH-002, TC-AUTH-003 |
| NFR-SEC-05 | Le système doit maintenir des journaux d'audit complets | Implémenté | Journalisation d'Audit (table `audit_logs`, `audit-trail.tsx`) | Toutes les opérations CRUD journalisées avec identifiant utilisateur, action, entité, détails, adresse IP, horodatage | TC-AUDIT-001, TC-AUDIT-002 |
| NFR-SEC-06 | Le système doit suivre les adresses IP dans les journaux d'audit | Implémenté | Journalisation d'Audit (champ `ipAddress`) | IP capturée depuis `req.ip` sur toutes les opérations auditées | TC-AUDIT-003 |
| NFR-SEC-07 | Le système doit appliquer le principe de double validation (principe des quatre yeux) | Implémenté | Approbations en Attente (vérification d'auto-approbation dans `routes.ts`) | Application côté serveur : `requestedBy !== reviewedBy` ; erreur 403 en cas de tentative d'auto-approbation | TC-MC-004 |
| NFR-SEC-08 | Le système doit appliquer l'expiration du mot de passe à 90 jours | Implémenté | Connexion/Auth (`passwordChangedAt`, `mustChangePassword`) | Vérification de l'âge du mot de passe à la connexion ; dialogue de changement forcé lorsqu'expiré | TC-AUTH-008 |
| NFR-SEC-09 | Le système doit appliquer un délai d'expiration de session inactive de 15 minutes | Implémenté | Middleware de Session (`server/index.ts`) | `IDLE_TIMEOUT_MS = 15 * 60 * 1000` ; destruction automatique de la session ; code de statut 440 retourné | TC-AUTH-004 |

---

## 13. Exigences d'Améliorations d'Entreprise (ENT)

| Réf. SRS | Description de l'Exigence | Statut | Module/Composant | Notes d'Implémentation | Cas de Test UAT |
|-----------|--------------------------|--------|-------------------|------------------------|-----------------|
| ENT-01 | Le système doit prendre en charge l'Authentification Multi-Facteurs (AMF) basée sur TOTP | Implémenté | AMF (`mfaSecret`, `mfaEnabled` sur `users` ; `mfa-setup.tsx` ; `/api/auth/mfa/*`) | TOTP via la bibliothèque `otpauth` ; la configuration retourne l'URI QR ; points de terminaison de vérification/désactivation/connexion ; la connexion retourne l'indicateur `requireMfa` lorsque activé ; i18n EN+FR | TC-ENT-001 à TC-ENT-005 |
| ENT-02 | Le système doit effectuer une correspondance floue des entités pour détecter les emprunteurs potentiellement en double | Implémenté | Correspondance Floue (extension `pg_trgm` ; `fuzzyMatchBorrowers` dans `storage.ts` ; `/api/borrowers/fuzzy-match`) | Similarité par trigrammes PostgreSQL via `pg_trgm` ; seuil ≥ 0.3 ; avertissement de doublon affiché dans le formulaire d'enregistrement de l'emprunteur | TC-ENT-006, TC-ENT-007 |
| ENT-03 | Le système doit fournir un assistant chatbot guidé pour le dépôt de litiges | Implémenté | Chatbot de Litiges (`dispute-chatbot.tsx` ; `helpdesk.tsx`) | Flux guidé multi-étapes : type de problème → recherche d'emprunteur → sélection de compte → description → soumission automatique ; i18n EN+FR | TC-ENT-008 à TC-ENT-010 |
| ENT-04 | Le système doit prendre en charge l'authentification par jeton porteur OAuth 2.1 pour l'API externe | Implémenté | OAuth 2.1 (`/api/external/oauth/token` ; `external-api.ts` ; `api-docs.tsx`) | Octroi d'identifiants client ; jetons porteurs JWT en complément de X-API-Key ; bibliothèque `jsonwebtoken` ; documenté dans la page de documentation de l'API | TC-ENT-011 à TC-ENT-013 |
| ENT-05 | Le système doit implémenter des optimisations pour faible bande passante (compression, découpage du code) | Implémenté | Performance (middleware `compression` dans `server/index.ts` ; `React.lazy` dans `App.tsx`) | Compression gzip pour toutes les réponses HTTP ; composants de route chargés dynamiquement avec spinner de repli `Suspense` | TC-ENT-014, TC-ENT-015 |
| ENT-06 | Le système doit prendre en charge le format de fichier XBRL/XML pour les téléchargements de données par lots | Implémenté | Téléchargement XBRL (onglet XBRL dans `batch-upload.tsx` ; `/api/batch-upload/credit-accounts`) | Analyse XBRL/XML dans le point de terminaison de téléchargement par lots ; interface à onglets (JSON/CSV et XBRL) ; format d'exemple fourni | TC-ENT-016, TC-ENT-017 |
| ENT-07 | Le système doit implémenter des journaux d'audit inviolables avec chaîne de hachage SHA-256 | Implémenté | Intégrité de l'Audit (`previousHash`, `currentHash` sur `audit_logs` ; `verifyAuditIntegrity` dans `storage.ts` ; `/api/audit/verify-integrity` ; `audit-trail.tsx`) | Chaque entrée de journal hachée avec SHA-256 liée à l'entrée précédente ; point de terminaison de vérification d'intégrité ; badge visuel sur la page de piste d'audit | TC-ENT-018 à TC-ENT-020 |

---

## 14. Résumé

| Catégorie | Total des Exigences | Implémentées | Partielles | Non Implémentées |
|-----------|---------------------|--------------|------------|------------------|
| FR-COL (Collecte de Données) | 5 | 5 | 0 | 0 |
| FR-CR (Rapport de Crédit) | 8 | 8 | 0 | 0 |
| FR-CON (Consentement et Litiges) | 9 | 9 | 0 | 0 |
| FR-REG (Réglementaire) | 3 | 3 | 0 | 0 |
| FR-SPEC (Prêts Spéciaux) | 5 | 5 | 0 | 0 |
| FR-COMM (Commercial) | 5 | 5 | 0 | 0 |
| FR-DP (Fournisseurs de Données) | 4 | 4 | 0 | 0 |
| INT-RPT (Intégration et Reporting) | 4 | 4 | 0 | 0 |
| DQ (Qualité des Données) | 5 | 5 | 0 | 0 |
| NFR-SEC (Sécurité) | 9 | 9 | 0 | 0 |
| ENT (Améliorations d'Entreprise) | 7 | 7 | 0 | 0 |
| **Total** | **64** | **64** | **0** | **0** |

---

## 14. Approbation

| Rôle | Nom | Signature | Date |
|------|-----|-----------|------|
| Chef de Projet | | | |
| Responsable Technique | | | |
| Responsable AQ | | | |
| Représentant du Client | | | |
