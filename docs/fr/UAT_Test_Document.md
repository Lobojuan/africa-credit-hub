# Document de Tests d'Acceptation Utilisateur (UAT)

## Système de Hub Central de Données Inter-Juridictionnel & Registre de Crédit v1.2

**Préparé pour :** Systems In Motion Limited  
**Version du Document :** 1.2  
**Date :** Mars 2026  
**Classification :** Confidentiel

---

## Table des Matières

1. [Configuration de l'Environnement de Test](#1-configuration-de-lenvironnement-de-test)
2. [Module d'Authentification](#2-module-dauthentification)
3. [Module Tableau de Bord](#3-module-tableau-de-bord)
4. [Module de Gestion des Emprunteurs](#4-module-de-gestion-des-emprunteurs)
5. [Module des Comptes de Crédit](#5-module-des-comptes-de-crédit)
6. [Module de Recherche de Crédit](#6-module-de-recherche-de-crédit)
7. [Module des Rapports de Crédit](#7-module-des-rapports-de-crédit)
8. [Module de Workflow Maker-Checker](#8-module-de-workflow-maker-checker)
9. [Module de Gestion des Litiges](#9-module-de-gestion-des-litiges)
10. [Module des Jugements Judiciaires](#10-module-des-jugements-judiciaires)
11. [Module de Gestion du Consentement](#11-module-de-gestion-du-consentement)
12. [Module de Gestion des Institutions](#12-module-de-gestion-des-institutions)
13. [Module de Facturation](#13-module-de-facturation)
14. [Module d'Assistance](#14-module-dassistance)
15. [Module de Téléchargement par Lots](#15-module-de-téléchargement-par-lots)
16. [Module de Piste d'Audit](#16-module-de-piste-daudit)
17. [Module de Gestion des Utilisateurs](#17-module-de-gestion-des-utilisateurs)
18. [Module des Clés API](#18-module-des-clés-api)
19. [Module API Externe](#19-module-api-externe)
20. [Module Rapports & Export](#20-module-rapports--export)
21. [Module de Notifications](#21-module-de-notifications)
22. [Module d'Internationalisation (i18n)](#22-module-dinternationalisation-i18n)
23. [Module de Thème](#23-module-de-thème)
24. [Approbation Finale](#24-approbation-finale)
25. [Module d'Authentification Multi-Facteurs (ENT-01)](#25-module-dauthentification-multi-facteurs-ent-01)
26. [Module de Correspondance Floue d'Entités (ENT-02)](#26-module-de-correspondance-floue-dentités-ent-02)
27. [Module du Chatbot de Litiges (ENT-03)](#27-module-du-chatbot-de-litiges-ent-03)
28. [Module OAuth 2.1 (ENT-04)](#28-module-oauth-21-ent-04)
29. [Module d'Optimisations Faible Bande Passante (ENT-05)](#29-module-doptimisations-faible-bande-passante-ent-05)
30. [Module de Téléchargement XBRL (ENT-06)](#30-module-de-téléchargement-xbrl-ent-06)
31. [Module de Journaux d'Audit Inviolables (ENT-07)](#31-module-de-journaux-daudit-inviolables-ent-07)
32. [Module de Gestion des Taux de Change](#32-module-de-gestion-des-taux-de-change)
33. [Module d'Administration des API](#33-module-dadministration-des-api)
34. [Module de Politiques de Rétention des Données](#34-module-de-politiques-de-rétention-des-données)
35. [Module de Recherche Globale](#35-module-de-recherche-globale)
36. [Module de Photos d'Identité et Téléversement de Documents](#36-module-de-photos-didentité-et-téléversement-de-documents)
37. [Module d'Environnement de Démonstration](#37-module-denvironnement-de-démonstration)
38. [Module de Sélecteur de Langue sur la Page de Connexion](#38-module-de-sélecteur-de-langue-sur-la-page-de-connexion)

---

## 1. Configuration de l'Environnement de Test

### 1.1 Informations Système

| Élément | Détail |
|---------|--------|
| Application | Système de Hub Central de Données Inter-Juridictionnel & Registre de Crédit v1.2 |
| Base de Données | PostgreSQL avec 21 tables |
| Rôles Utilisateur | Admin, Régulateur, Prêteur, Observateur |
| Devises Supportées | Plus de 42 devises africaines plus USD, EUR, GBP |
| Améliorations Entreprise | MFA, Correspondance Floue, Chatbot de Litiges, OAuth 2.1, Faible Bande Passante, Téléchargement XBRL, Audit Inviolable, Gestion des Taux de Change, Administration API, Politiques de Rétention des Données, Recherche Globale, Photos d'Identité et Documents, Environnement de Démonstration |
| Juridictions | Les 54 pays africains |
| Langues | Anglais, Français, Portugais |
| Données de Test | 102 000+ emprunteurs, 172 000+ comptes de crédit, 120 000 enregistrements d'historique de paiement, 3 218 litiges, 2 147 jugements de tribunal |

### 1.2 Identifiants de Test

| Nom d'utilisateur | Mot de passe | Rôle | Institution |
|--------------------|--------------|------|-------------|
| admin | admin123 | Admin | NBE |
| regulator1 | reg123 | Régulateur | NBE |
| cbe_user | cbe123 | Prêteur | CBE |
| dashen_user | dashen123 | Prêteur | Dashen |
| awash_user | awash123 | Prêteur | Awash |

### 1.3 Matrice d'Accès par Rôle

| Fonctionnalité | Admin | Régulateur | Prêteur | Observateur |
|----------------|-------|------------|---------|-------------|
| Gestion des Utilisateurs | Oui | Non | Non | Non |
| Gestion des Institutions | Oui | Non | Non | Non |
| Gestion des Clés API | Oui | Non | Non | Non |
| Facturation | Oui | Oui | Non | Non |
| Piste d'Audit | Oui | Oui | Non | Non |
| Approuver/Rejeter les Modifications | Oui | Oui | Non | Non |
| Jugements Judiciaires (création) | Oui | Oui | Non | Non |
| Téléchargement par Lots | Oui | Non | Oui | Non |
| Emprunteurs/Comptes | Oui | Oui | Oui | Oui |
| Litiges | Oui | Oui | Oui | Oui |
| Consentement | Oui | Oui | Oui | Oui |
| Tableau de Bord/Rapports | Oui | Oui | Oui | Oui |
| Assistance | Oui | Oui | Oui | Oui |

### 1.4 Prérequis de l'Environnement de Test

- Application déployée et accessible via navigateur
- Base de données PostgreSQL alimentée avec les données de test
- Tous les comptes utilisateurs de test actifs et non verrouillés
- Connectivité réseau vers l'URL de l'application
- Navigateur moderne (Chrome, Firefox, Edge ou Safari)

---

## 2. Module d'Authentification

| ID-CT | Module | Nom du Cas de Test | Pré-conditions | Étapes de Test | Résultat Attendu | Réussi/Échoué | Référence SRS |
|-------|--------|-------------------|----------------|----------------|------------------|---------------|---------------|
| TC-AUTH-001 | Authentification | Connexion réussie avec des identifiants valides | L'application est accessible, le compte utilisateur est actif | 1. Accéder à la page de connexion. 2. Saisir le nom d'utilisateur : `admin`. 3. Saisir le mot de passe : `admin123`. 4. Cliquer sur le bouton « Connexion ». | L'utilisateur est authentifié et redirigé vers la page du Tableau de Bord. La session est établie. | | NFR-SEC-01 |
| TC-AUTH-002 | Authentification | Échec de connexion avec un mot de passe invalide | L'application est accessible, le compte admin est actif | 1. Accéder à la page de connexion. 2. Saisir le nom d'utilisateur : `admin`. 3. Saisir le mot de passe : `wrongpassword`. 4. Cliquer sur « Connexion ». | Message d'erreur affiché : « Identifiants invalides. 2 tentative(s) restante(s). » La connexion échoue. | | NFR-SEC-01 |
| TC-AUTH-003 | Authentification | Échec de connexion avec un nom d'utilisateur inexistant | L'application est accessible | 1. Accéder à la page de connexion. 2. Saisir le nom d'utilisateur : `nonexistent_user`. 3. Saisir le mot de passe : `any_pass`. 4. Cliquer sur « Connexion ». | Message d'erreur affiché : « Identifiants invalides. » La connexion échoue. | | NFR-SEC-01 |
| TC-AUTH-004 | Authentification | Verrouillage du compte après 3 tentatives échouées | Le compte admin est actif, aucune tentative échouée préalable | 1. Accéder à la page de connexion. 2. Saisir le nom d'utilisateur : `admin`, mauvais mot de passe. Cliquer sur « Connexion ». 3. Répéter l'étape 2 deux fois de plus (3 échecs au total). | Après le 3e échec, message : « Compte verrouillé pendant 15 minutes après 3 tentatives échouées. » Le compte est verrouillé. | | NFR-SEC-03 |
| TC-AUTH-005 | Authentification | Tentative de connexion sur un compte verrouillé | Le compte admin est verrouillé (depuis TC-AUTH-004) | 1. Accéder à la page de connexion. 2. Saisir le nom d'utilisateur : `admin`, mot de passe correct : `admin123`. 3. Cliquer sur « Connexion ». | Message d'erreur affiché : « Compte verrouillé. Réessayez dans X minute(s). » Connexion refusée. | | NFR-SEC-03 |
| TC-AUTH-006 | Authentification | Connexion avec un compte suspendu | Le statut d'un compte utilisateur est défini sur « suspendu » | 1. Accéder à la page de connexion. 2. Saisir les identifiants de l'utilisateur suspendu. 3. Cliquer sur « Connexion ». | Message d'erreur : « Le compte est suspendu. » Connexion refusée. | | NFR-SEC-02 |
| TC-AUTH-007 | Authentification | Connexion avec un compte désactivé | Le statut d'un compte utilisateur est défini sur « désactivé » | 1. Accéder à la page de connexion. 2. Saisir les identifiants de l'utilisateur désactivé. 3. Cliquer sur « Connexion ». | Message d'erreur : « Le compte est désactivé. » Connexion refusée. | | NFR-SEC-02 |
| TC-AUTH-008 | Authentification | Application de la politique de mot de passe - trop court | L'utilisateur est sur la boîte de dialogue de changement de mot de passe | 1. Se connecter. 2. Ouvrir la boîte de dialogue de changement de mot de passe. 3. Saisir le mot de passe actuel. 4. Saisir le nouveau mot de passe : `Abc1!` (trop court). 5. Cliquer sur « Changer le mot de passe ». | Message d'erreur : « Le mot de passe doit contenir au moins 8 caractères avec une majuscule, une minuscule, un chiffre et un caractère spécial. » | | NFR-SEC-04 |
| TC-AUTH-009 | Authentification | Application de la politique de mot de passe - majuscule manquante | L'utilisateur est sur la boîte de dialogue de changement de mot de passe | 1. Saisir le mot de passe actuel. 2. Saisir le nouveau mot de passe : `abcdefg1!` (pas de majuscule). 3. Cliquer sur « Changer le mot de passe ». | Message d'erreur concernant les exigences de complexité du mot de passe. | | NFR-SEC-04 |
| TC-AUTH-010 | Authentification | Application de la politique de mot de passe - caractère spécial manquant | L'utilisateur est sur la boîte de dialogue de changement de mot de passe | 1. Saisir le mot de passe actuel. 2. Saisir le nouveau mot de passe : `Abcdefg1` (pas de caractère spécial). 3. Cliquer sur « Changer le mot de passe ». | Message d'erreur concernant les exigences de complexité du mot de passe. | | NFR-SEC-04 |
| TC-AUTH-011 | Authentification | Changement de mot de passe réussi | L'utilisateur est connecté | 1. Ouvrir la boîte de dialogue de changement de mot de passe. 2. Saisir le mot de passe actuel correctement. 3. Saisir un nouveau mot de passe répondant à toutes les exigences (ex. : `NewPass1!`). 4. Cliquer sur « Changer le mot de passe ». | Message de succès. Le mot de passe est mis à jour. Entrée dans le journal d'audit créée pour PASSWORD_CHANGE. | | NFR-SEC-04 |
| TC-AUTH-012 | Authentification | Expiration de la session après 15 minutes d'inactivité | L'utilisateur est connecté | 1. Se connecter avec succès. 2. Ne pas interagir avec l'application pendant plus de 15 minutes. 3. Tenter une action quelconque (ex. : naviguer vers une page). | L'utilisateur est automatiquement déconnecté. Redirigé vers la page de connexion. | | NFR-SEC-09 |
| TC-AUTH-013 | Authentification | Déconnexion réussie | L'utilisateur est connecté | 1. Cliquer sur le bouton/lien de déconnexion. | La session utilisateur est détruite. Redirigé vers la page de connexion. Entrée dans le journal d'audit pour LOGOUT créée. | | NFR-SEC-01 |
| TC-AUTH-014 | Authentification | Notification d'expiration du mot de passe (politique de 90 jours) | L'utilisateur a un mot de passe datant de plus de 90 jours (passwordChangedAt > 90 jours) | 1. Se connecter avec l'utilisateur concerné. | La connexion réussit. Le drapeau passwordExpired est retourné comme vrai. Une invite de changement de mot de passe est affichée. | | NFR-SEC-04 |
| TC-AUTH-015 | Authentification | Obligation de changer le mot de passe à la première connexion | Le compte utilisateur a mustChangePassword = true | 1. Se connecter avec l'utilisateur concerné. | La connexion réussit mais le drapeau passwordExpired est vrai. L'utilisateur est invité à changer son mot de passe. | | NFR-SEC-04 |
| TC-AUTH-016 | Authentification | Validation des identifiants manquants | L'application est accessible | 1. Accéder à la page de connexion. 2. Laisser les champs nom d'utilisateur et mot de passe vides. 3. Cliquer sur « Connexion ». | Message d'erreur : « Le nom d'utilisateur et le mot de passe sont requis. » | | NFR-SEC-01 |

---

## 3. Module Tableau de Bord

| ID-CT | Module | Nom du Cas de Test | Pré-conditions | Étapes de Test | Résultat Attendu | Réussi/Échoué | Référence SRS |
|-------|--------|-------------------|----------------|----------------|------------------|---------------|---------------|
| TC-DASH-001 | Tableau de Bord | Affichage de 8 cartes statistiques sur le tableau de bord | L'utilisateur est connecté | 1. Naviguer vers le Tableau de Bord (`/`). 2. Observer les cartes statistiques affichées. | 8 cartes statistiques visibles : Total Emprunteurs, Comptes de Crédit, Encours, Impayés, Défauts, Consultations, Approbations en Attente, Litiges Ouverts. Chacune affiche une valeur numérique. | | FR-REG-01 |
| TC-DASH-002 | Tableau de Bord | Carte statistique - Détail Total Emprunteurs | L'utilisateur est connecté, sur le Tableau de Bord | 1. Cliquer sur la carte statistique « Total Emprunteurs ». | Un tiroir/panneau de détail s'ouvre affichant une liste d'emprunteurs. | | FR-REG-01 |
| TC-DASH-003 | Tableau de Bord | Carte statistique - Détail Comptes de Crédit | L'utilisateur est connecté, sur le Tableau de Bord | 1. Cliquer sur la carte statistique « Comptes de Crédit ». | Un tiroir/panneau de détail s'ouvre affichant les données des comptes de crédit. | | FR-REG-01 |
| TC-DASH-004 | Tableau de Bord | Carte statistique - Détail Encours | L'utilisateur est connecté, sur le Tableau de Bord | 1. Cliquer sur la carte statistique « Encours ». | Un tiroir/panneau de détail s'ouvre affichant les données des soldes impayés. | | FR-REG-01 |
| TC-DASH-005 | Tableau de Bord | Carte statistique - Détail Impayés | L'utilisateur est connecté, sur le Tableau de Bord | 1. Cliquer sur la carte statistique « Impayés ». | Un tiroir/panneau de détail s'ouvre affichant les comptes en souffrance. | | FR-REG-02 |
| TC-DASH-006 | Tableau de Bord | Carte statistique - Détail Défauts | L'utilisateur est connecté, sur le Tableau de Bord | 1. Cliquer sur la carte statistique « Défauts ». | Un tiroir/panneau de détail s'ouvre affichant les comptes en défaut. | | FR-REG-02 |
| TC-DASH-007 | Tableau de Bord | Carte statistique - Détail Consultations | L'utilisateur est connecté, sur le Tableau de Bord | 1. Cliquer sur la carte statistique « Consultations ». | Un tiroir/panneau de détail s'ouvre affichant les consultations de crédit récentes. | | FR-CR-01 |
| TC-DASH-008 | Tableau de Bord | Carte statistique - Détail Approbations en Attente | L'utilisateur est connecté, sur le Tableau de Bord | 1. Cliquer sur la carte statistique « Approbations en Attente ». | Un tiroir/panneau de détail s'ouvre affichant les éléments en attente d'approbation. | | FR-COL-01 |
| TC-DASH-009 | Tableau de Bord | Carte statistique - Détail Litiges Ouverts | L'utilisateur est connecté, sur le Tableau de Bord | 1. Cliquer sur la carte statistique « Litiges Ouverts ». | Un tiroir/panneau de détail s'ouvre affichant les litiges ouverts. | | FR-CON-04 |
| TC-DASH-010 | Tableau de Bord | Les éléments du tiroir de détail naviguent vers les pages de détail | L'utilisateur est connecté, le tiroir de détail est ouvert | 1. Cliquer sur un élément emprunteur dans le tiroir de détail Total Emprunteurs. | Navigation vers la page de détail de l'emprunteur (`/borrowers/:id`). | | FR-COL-01 |
| TC-DASH-011 | Tableau de Bord | Section d'activité récente | L'utilisateur est connecté, sur le Tableau de Bord | 1. Observer la section d'activité récente sur le Tableau de Bord. | L'activité récente du système est affichée avec les horodatages et descriptions. | | FR-REG-01 |

---

## 4. Module de Gestion des Emprunteurs

| ID-CT | Module | Nom du Cas de Test | Pré-conditions | Étapes de Test | Résultat Attendu | Réussi/Échoué | Référence SRS |
|-------|--------|-------------------|----------------|----------------|------------------|---------------|---------------|
| TC-BOR-001 | Gestion des Emprunteurs | Enregistrer un emprunteur individuel | L'utilisateur est connecté avec les permissions de création | 1. Naviguer vers la page Emprunteurs (`/borrowers`). 2. Cliquer sur « Ajouter un Emprunteur » ou équivalent. 3. Sélectionner le type : Individuel. 4. Remplir : Prénom, Nom, Numéro d'Identité Nationale, Date de Naissance, Genre, Téléphone, Email, Adresse, Ville, Région, Numéro d'Identification Fiscale. 5. Soumettre. | L'enregistrement de l'emprunteur est soumis pour approbation maker-checker. Message de succès affiché. Entrée dans le journal d'audit créée. | | FR-COL-01 |
| TC-BOR-002 | Gestion des Emprunteurs | Enregistrer un emprunteur entreprise | L'utilisateur est connecté avec les permissions de création | 1. Naviguer vers la page Emprunteurs. 2. Cliquer sur « Ajouter un Emprunteur ». 3. Sélectionner le type : Entreprise. 4. Remplir : Nom de l'Entreprise, Numéro d'Immatriculation, Numéro d'Identité Nationale, Secteur, Email de Contact, Téléphone de Contact, Adresse, Numéro d'Identification Fiscale. 5. Soumettre. | L'enregistrement de l'emprunteur entreprise est soumis pour approbation maker-checker. Message de succès affiché. | | FR-COL-01 |
| TC-BOR-003 | Gestion des Emprunteurs | Rechercher des emprunteurs par nom | L'utilisateur est connecté, des données d'emprunteurs existent | 1. Naviguer vers la page Emprunteurs. 2. Saisir un nom d'emprunteur dans le champ de recherche. 3. Appuyer sur Entrée ou cliquer sur Rechercher. | Les emprunteurs correspondants sont affichés dans le tableau des résultats. | | FR-COL-02 |
| TC-BOR-004 | Gestion des Emprunteurs | Rechercher des emprunteurs par Numéro d'Identité Nationale | L'utilisateur est connecté, des données d'emprunteurs existent | 1. Naviguer vers la page Emprunteurs. 2. Saisir un Numéro d'Identité Nationale dans le champ de recherche. 3. Rechercher. | Le(s) emprunteur(s) correspondant(s) affiché(s). | | FR-COL-02 |
| TC-BOR-005 | Gestion des Emprunteurs | Signalement PEP sur un emprunteur | L'utilisateur est connecté avec les permissions de création | 1. Naviguer vers le formulaire d'Ajout d'Emprunteur. 2. Remplir les champs requis. 3. Activer le drapeau « Personne Politiquement Exposée » (PEP). 4. Saisir les détails PEP. 5. Soumettre. | L'emprunteur est soumis avec isPep = true et pepDetails renseigné. Indicateur PEP visible sur la fiche de l'emprunteur. | | FR-COL-03 |
| TC-BOR-006 | Gestion des Emprunteurs | Consulter la page de détail d'un emprunteur | L'utilisateur est connecté, l'emprunteur existe | 1. Naviguer vers la page Emprunteurs. 2. Cliquer sur une ligne d'emprunteur pour accéder au détail. | La page de détail de l'emprunteur (`/borrowers/:id`) se charge avec toutes les informations : données personnelles/entreprise, comptes de crédit, consultations, jugements judiciaires, enregistrements de consentement. | | FR-COL-01 |
| TC-BOR-007 | Gestion des Emprunteurs | Liaison des parties liées | L'utilisateur est connecté avec les permissions de création | 1. Naviguer vers le formulaire d'Ajout d'Emprunteur. 2. Remplir les champs requis. 3. Définir l'ID de l'Emprunteur Lié et le Type de Relation (l'un des 7 types : Conjoint, Garant, Directeur, Actionnaire, Bénéficiaire Effectif, Filiale, Société Mère). 4. Soumettre. | Emprunteur créé avec relatedBorrowerId et relationshipType renseignés. Les parties liées sont visibles dans le détail de l'emprunteur. Les 7 types de relation sont disponibles dans le menu déroulant. | | FR-COL-04 |
| TC-BOR-008 | Gestion des Emprunteurs | La mise à jour d'un emprunteur déclenche le maker-checker | L'utilisateur est connecté | 1. Naviguer vers la page de détail de l'emprunteur. 2. Modifier un champ (ex. : numéro de téléphone). 3. Soumettre la mise à jour. | La mise à jour est soumise pour approbation maker-checker (enregistrement pending_approvals créé avec action : UPDATE). L'utilisateur voit un message de confirmation. | | FR-COL-01 |
| TC-BOR-009 | Gestion des Emprunteurs | Prévention des doublons de Numéro d'Identité Nationale | L'utilisateur est connecté | 1. Naviguer vers Ajouter un Emprunteur. 2. Saisir un Numéro d'Identité Nationale déjà existant dans le système. 3. Soumettre. | Message d'erreur indiquant un doublon de Numéro d'Identité Nationale. Enregistrement rejeté. | | FR-COL-01 |
| TC-BOR-010 | Gestion des Emprunteurs | Pagination sur la liste des emprunteurs | L'utilisateur est connecté, de nombreux emprunteurs existent | 1. Naviguer vers la page Emprunteurs. 2. Observer les contrôles de pagination. 3. Naviguer vers la page 2. | La page charge le lot suivant d'emprunteurs. Les contrôles de pagination affichent les bons numéros de page. | | FR-COL-02 |
| TC-BOR-011 | Gestion des Emprunteurs | Champs d'éducation et d'emploi | L'utilisateur est connecté | 1. Naviguer vers Ajouter un Emprunteur. 2. Remplir Niveau d'Éducation, Établissement d'Enseignement, Historique d'Emploi. 3. Soumettre. | Emprunteur soumis avec les données d'éducation et d'emploi préservées. | | FR-COL-01 |
| TC-BOR-012 | Gestion des Emprunteurs | Consulter les emprunteurs liés | L'utilisateur est connecté, l'emprunteur a des parties liées | 1. Naviguer vers la page de détail de l'emprunteur ayant un relatedBorrowerId défini. 2. Observer la section des parties liées. | Les emprunteurs liés sont affichés avec leur type de relation. | | FR-COL-04 |

---

## 5. Module des Comptes de Crédit

| ID-CT | Module | Nom du Cas de Test | Pré-conditions | Étapes de Test | Résultat Attendu | Réussi/Échoué | Référence SRS |
|-------|--------|-------------------|----------------|----------------|------------------|---------------|---------------|
| TC-CA-001 | Comptes de Crédit | Créer un compte de crédit | L'utilisateur est connecté, l'emprunteur existe | 1. Naviguer vers la page Comptes de Crédit (`/credit-accounts`). 2. Cliquer sur « Ajouter un Compte de Crédit ». 3. Remplir : ID Emprunteur, Institution Prêteuse, Numéro de Compte, Type de Compte, Montant Original, Solde Actuel, Devise, Taux d'Intérêt, Date de Décaissement, Date d'Échéance. 4. Soumettre. | La création du compte de crédit est soumise pour approbation maker-checker. Message de succès. | | FR-CR-01 |
| TC-CA-002 | Comptes de Crédit | Support multi-devises (ETB) | L'utilisateur est connecté | 1. Créer un compte de crédit. 2. Sélectionner la devise : ETB. 3. Soumettre. | Compte créé avec devise = ETB. Les montants sont affichés au format Birr éthiopien. | | FR-CR-02 |
| TC-CA-003 | Comptes de Crédit | Support multi-devises (GHS) | L'utilisateur est connecté | 1. Créer un compte de crédit. 2. Sélectionner la devise : GHS. 3. Soumettre. | Compte créé avec devise = GHS. Les montants sont affichés au format Cedi ghanéen. | | FR-CR-02 |
| TC-CA-004 | Comptes de Crédit | Support multi-devises (UGX) | L'utilisateur est connecté | 1. Créer un compte de crédit. 2. Sélectionner la devise : UGX. 3. Soumettre. | Compte créé avec devise = UGX. Les montants sont affichés au format Shilling ougandais. | | FR-CR-02 |
| TC-CA-005 | Comptes de Crédit | Support multi-devises (LRD) | L'utilisateur est connecté | 1. Créer un compte de crédit. 2. Sélectionner la devise : LRD. 3. Soumettre. | Compte créé avec devise = LRD. Les montants sont affichés au format Dollar libérien. | | FR-CR-02 |
| TC-CA-006 | Comptes de Crédit | Indicateur de prêt sans intérêt | L'utilisateur est connecté | 1. Créer un compte de crédit. 2. Activer « Sans Intérêt ». 3. Soumettre. | Compte créé avec isInterestFree = true. Le champ de taux d'intérêt peut être désactivé/masqué. | | FR-SPEC-03 |
| TC-CA-007 | Comptes de Crédit | Configuration du délai de grâce | L'utilisateur est connecté | 1. Créer un compte de crédit. 2. Définir les Mois de Délai de Grâce à 6. 3. Soumettre. | Compte créé avec gracePeriodMonths = 6. | | FR-SPEC-04 |
| TC-CA-008 | Comptes de Crédit | Suivi du nombre de restructurations | L'utilisateur est connecté | 1. Créer un compte de crédit. 2. Définir le Nombre de Restructurations à 2. 3. Soumettre. | Compte créé avec restructureCount = 2. | | FR-SPEC-05 |
| TC-CA-009 | Comptes de Crédit | Valeurs de statut du compte | L'utilisateur est connecté, des comptes avec différents statuts existent | 1. Naviguer vers la page Comptes de Crédit. 2. Observer les comptes avec différents statuts. | Les statuts sont correctement affichés : en cours, en souffrance, en défaut, fermé, restructuré, passé en perte. Chaque statut est visuellement distinguable. | | FR-CR-01 |
| TC-CA-010 | Comptes de Crédit | Consulter l'historique des paiements (grille de 12 périodes) | L'utilisateur est connecté, un compte de crédit avec historique de paiement existe | 1. Naviguer vers la page de détail de l'emprunteur. 2. Consulter un compte de crédit. 3. Développer l'historique des paiements. | La grille d'historique des paiements sur 12 périodes est affichée montrant la période, le montant dû, le montant payé, le statut (à_temps/en_retard/manqué/partiel) et les jours de retard. | | FR-CR-08 |
| TC-CA-011 | Comptes de Crédit | Informations sur les garanties | L'utilisateur est connecté | 1. Créer un compte de crédit. 2. Définir le Type de Garantie (ex. : « Propriété ») et la Valeur de la Garantie. 3. Soumettre. | Compte créé avec le type et la valeur de la garantie enregistrés. | | FR-CR-01 |
| TC-CA-012 | Comptes de Crédit | Suivi de la date de passage en perte | L'utilisateur est connecté | 1. Créer un compte de crédit avec statut = written_off. 2. Définir la Date de Passage en Perte. 3. Soumettre. | Compte créé avec writtenOffDate renseigné. | | FR-CR-01 |
| TC-CA-013 | Comptes de Crédit | Suivi de la date de réintégration | L'utilisateur est connecté | 1. Créer un compte de crédit. 2. Définir la Date de Réintégration. 3. Soumettre. | Compte créé avec reinstatedDate renseigné. | | FR-CR-01 |
| TC-CA-014 | Comptes de Crédit | La mise à jour du compte de crédit déclenche le maker-checker | L'utilisateur est connecté, un compte de crédit existe | 1. Naviguer vers un compte de crédit. 2. Modifier un champ. 3. Soumettre la mise à jour. | La mise à jour est soumise pour approbation maker-checker. | | FR-COL-01 |
| TC-CA-015 | Comptes de Crédit | Filtrer les comptes par emprunteur | L'utilisateur est connecté, l'emprunteur a des comptes de crédit | 1. Naviguer vers les Comptes de Crédit avec le filtre borrowerId. | Seuls les comptes de crédit de l'emprunteur spécifié sont affichés. | | FR-CR-01 |

---

## 6. Module de Recherche de Crédit

| ID-CT | Module | Nom du Cas de Test | Pré-conditions | Étapes de Test | Résultat Attendu | Réussi/Échoué | Référence SRS |
|-------|--------|-------------------|----------------|----------------|------------------|---------------|---------------|
| TC-CS-001 | Recherche de Crédit | Recherche de crédit pour un emprunteur unique | L'utilisateur est connecté, l'emprunteur existe | 1. Naviguer vers la page Recherche de Crédit (`/search`). 2. Saisir un identifiant d'emprunteur (Numéro d'Identité Nationale ou nom). 3. Sélectionner l'objet de la consultation (ex. : « new_credit »). 4. Cocher le consentement fourni. 5. Cliquer sur « Rechercher ». | Consultation de crédit créée. Les résultats de recherche sont affichés avec les informations de l'emprunteur et le résumé du crédit. Entrée dans le journal d'audit créée. | | FR-CR-01 |
| TC-CS-002 | Recherche de Crédit | Recherche de crédit en masse (identifiants multiples) | L'utilisateur est connecté, plusieurs emprunteurs existent | 1. Naviguer vers la page Recherche de Crédit. 2. Utiliser la fonctionnalité de recherche en masse. 3. Saisir plusieurs identifiants d'emprunteurs. 4. Soumettre. | Recherche de crédit en masse effectuée. Résultats retournés pour tous les emprunteurs correspondants. | | FR-CR-03 |
| TC-CS-003 | Recherche de Crédit | Recherche de crédit sans résultat | L'utilisateur est connecté | 1. Naviguer vers la page Recherche de Crédit. 2. Saisir un identifiant d'emprunteur inexistant. 3. Rechercher. | Message approprié « Aucun résultat trouvé » affiché. | | FR-CR-01 |
| TC-CS-004 | Recherche de Crédit | Suivi du consentement lors de la consultation | L'utilisateur est connecté | 1. Effectuer une recherche de crédit. 2. Marquer le consentement comme fourni. 3. Soumettre. | Enregistrement de consultation de crédit créé avec consentProvided = true. | | FR-CON-01 |
| TC-CS-005 | Recherche de Crédit | Naviguer vers le rapport de crédit depuis les résultats de recherche | L'utilisateur est connecté, la recherche est terminée avec des résultats | 1. Effectuer une recherche de crédit. 2. Cliquer sur un résultat pour consulter le rapport de crédit. | Navigation vers la page du rapport de crédit (`/credit-report/:borrowerId`). | | FR-CR-06 |

---

## 7. Module des Rapports de Crédit

| ID-CT | Module | Nom du Cas de Test | Pré-conditions | Étapes de Test | Résultat Attendu | Réussi/Échoué | Référence SRS |
|-------|--------|-------------------|----------------|----------------|------------------|---------------|---------------|
| TC-RPT-001 | Rapports de Crédit | Générer un rapport de crédit | L'utilisateur est connecté, un emprunteur avec des comptes existe | 1. Naviguer vers la page Rapport de Crédit (`/credit-report/:borrowerId`). 2. Sélectionner l'objet. 3. Générer le rapport. | Rapport de crédit généré avec : informations de l'emprunteur, comptes de crédit, score de crédit (300-850), codes de motif, numéro de série (CR-{ANNÉE}-{ID}), historique des consultations. | | FR-CR-06 |
| TC-RPT-002 | Rapports de Crédit | Calcul du score de crédit (plage 300-850) | L'emprunteur a des statuts de comptes mixtes | 1. Générer un rapport de crédit pour un emprunteur ayant des comptes en souffrance et en cours. | Le score de crédit est dans la plage 300-850. Le score reflète la santé des comptes (les comptes en souffrance réduisent le score). | | FR-CR-06 |
| TC-RPT-003 | Rapports de Crédit | Codes de motif sur le rapport de crédit | L'emprunteur a des comptes en souffrance | 1. Générer un rapport de crédit pour un emprunteur ayant des comptes en souffrance. | Le code de motif « DELINQUENT_ACCOUNTS » apparaît dans le rapport. | | FR-CR-06 |
| TC-RPT-004 | Rapports de Crédit | Codes de motif - comptes passés en perte | L'emprunteur a des comptes passés en perte | 1. Générer un rapport de crédit. | Le code de motif « WRITTEN_OFF_ACCOUNTS » apparaît. | | FR-CR-06 |
| TC-RPT-005 | Rapports de Crédit | Codes de motif - comptes restructurés | L'emprunteur a des comptes restructurés | 1. Générer un rapport de crédit. | Le code de motif « RESTRUCTURED_ACCOUNTS » apparaît. | | FR-CR-06 |
| TC-RPT-006 | Rapports de Crédit | Codes de motif - volume élevé de consultations | L'emprunteur a de nombreuses consultations récentes | 1. Générer un rapport de crédit. | Le code de motif « HIGH_INQUIRY_VOLUME » apparaît. | | FR-CR-06 |
| TC-RPT-007 | Rapports de Crédit | Codes de motif - jugements judiciaires présents | L'emprunteur a des jugements judiciaires actifs | 1. Générer un rapport de crédit. | Le code de motif « COURT_JUDGMENTS_PRESENT » apparaît. | | FR-CR-06 |
| TC-RPT-008 | Rapports de Crédit | Codes de motif - excellent historique de paiement | L'emprunteur a tous ses comptes en cours | 1. Générer un rapport de crédit pour un emprunteur dont tous les comptes ont le statut « en cours ». | Le code de motif « EXCELLENT_PAYMENT_RECORD » ou « STRONG_REPAYMENT_HISTORY » apparaît. Score de crédit élevé. | | FR-CR-06 |
| TC-RPT-009 | Rapports de Crédit | Génération du numéro de série | L'utilisateur génère un rapport de crédit | 1. Générer un rapport de crédit. 2. Noter le numéro de série. | Le numéro de série suit le format : CR-{ANNÉE}-{ID_UNIQUE}. Le numéro de série est unique. Entrée créée dans la table credit_report_logs. | | FR-CR-06 |
| TC-RPT-010 | Rapports de Crédit | Imprimer le rapport de crédit | Le rapport de crédit est affiché | 1. Générer un rapport de crédit. 2. Cliquer sur le bouton « Imprimer ». | La boîte de dialogue d'impression du navigateur s'ouvre. Le rapport est formaté pour l'impression avec en-tête, informations de l'emprunteur, comptes, score, numéro de série et clause de non-responsabilité en pied de page. | | FR-CR-06 |
| TC-RPT-011 | Rapports de Crédit | Le rapport de crédit inclut l'historique des paiements | L'emprunteur a des comptes avec un historique de paiement | 1. Générer un rapport de crédit. | La section de l'historique de performance de paiement est affichée dans le rapport. | | FR-CR-08 |
| TC-RPT-012 | Rapports de Crédit | Le rapport de crédit inclut les jugements judiciaires | L'emprunteur a des jugements judiciaires | 1. Générer un rapport de crédit. | La section des jugements judiciaires est affichée avec les détails des affaires. | | FR-COL-05 |
| TC-RPT-013 | Rapports de Crédit | Le rapport de crédit inclut les enregistrements de consentement | L'emprunteur a des enregistrements de consentement | 1. Générer un rapport de crédit. | La section des enregistrements de consentement est affichée dans le rapport. | | FR-CON-06 |
| TC-RPT-014 | Rapports de Crédit | Suivi du journal des rapports de crédit | L'utilisateur génère un rapport de crédit | 1. Générer un rapport de crédit. 2. Naviguer vers les journaux des rapports de crédit. | L'entrée existe dans credit_report_logs avec borrowerId, requestedBy, institution, purpose, serialNumber et timestamp. | | FR-CR-06 |

---

## 8. Module de Workflow Maker-Checker

| ID-CT | Module | Nom du Cas de Test | Pré-conditions | Étapes de Test | Résultat Attendu | Réussi/Échoué | Référence SRS |
|-------|--------|-------------------|----------------|----------------|------------------|---------------|---------------|
| TC-MC-001 | Maker-Checker | Soumettre un emprunteur pour approbation | L'utilisateur est connecté (rôle Prêteur) | 1. Naviguer vers Emprunteurs. 2. Soumettre un nouvel emprunteur. | Enregistrement d'approbation en attente créé avec status = « pending », entityType = « borrower », action = « CREATE ». Notifications envoyées aux utilisateurs admin/régulateur. | | FR-COL-01 |
| TC-MC-002 | Maker-Checker | Consulter les approbations en attente | L'utilisateur est connecté (Admin/Régulateur) | 1. Naviguer vers la page Approbations en Attente (`/approvals`). | Liste des demandes d'approbation en attente affichée avec le type d'entité, l'action, le demandeur et la date de soumission. | | FR-COL-01 |
| TC-MC-003 | Maker-Checker | Approuver une demande en attente | Admin/Régulateur connecté, une approbation en attente existe d'un utilisateur différent | 1. Naviguer vers Approbations en Attente. 2. Sélectionner une demande en attente. 3. Cliquer sur « Approuver ». 4. Optionnellement ajouter des notes de révision. 5. Confirmer. | Le statut d'approbation passe à « approved ». L'entité sous-jacente (emprunteur/compte de crédit) est créée/mise à jour. Notification envoyée au demandeur. Entrée dans le journal d'audit créée. | | FR-COL-01 |
| TC-MC-004 | Maker-Checker | Rejeter une demande en attente | Admin/Régulateur connecté, une approbation en attente existe d'un utilisateur différent | 1. Naviguer vers Approbations en Attente. 2. Sélectionner une demande en attente. 3. Cliquer sur « Rejeter ». 4. Ajouter des notes de rejet. 5. Confirmer. | Le statut d'approbation passe à « rejected ». L'entité sous-jacente n'est PAS créée/mise à jour. Notification envoyée au demandeur avec le motif du rejet. Entrée dans le journal d'audit créée. | | FR-COL-01 |
| TC-MC-005 | Maker-Checker | Prévention de l'auto-approbation | Admin connecté, l'approbation en attente a été soumise par le même admin | 1. Naviguer vers Approbations en Attente. 2. Tenter d'approuver sa propre demande. | Message d'erreur : « Maker-checker : Vous ne pouvez pas approuver votre propre demande. Un autre utilisateur autorisé doit effectuer la révision. » Approbation bloquée. | | FR-COL-01 |
| TC-MC-006 | Maker-Checker | Gestion des demandes déjà examinées | Admin connecté, l'approbation a déjà été traitée | 1. Naviguer vers Approbations en Attente. 2. Tenter d'approuver/rejeter une demande déjà examinée. | Message d'erreur : « Cette demande a déjà été examinée. » | | FR-COL-01 |
| TC-MC-007 | Maker-Checker | Rôle insuffisant pour l'approbation | Utilisateur Prêteur connecté | 1. Tenter d'approuver une demande en attente via l'API. | 403 Interdit : « Permissions insuffisantes. » | | FR-COL-01 |
| TC-MC-008 | Maker-Checker | La soumission d'un compte de crédit déclenche l'approbation | L'utilisateur est connecté | 1. Soumettre un nouveau compte de crédit. | Approbation en attente créée avec entityType = « credit_account ». | | FR-COL-01 |

---

## 9. Module de Gestion des Litiges

| ID-CT | Module | Nom du Cas de Test | Pré-conditions | Étapes de Test | Résultat Attendu | Réussi/Échoué | Référence SRS |
|-------|--------|-------------------|----------------|----------------|------------------|---------------|---------------|
| TC-DIS-001 | Litiges | Déposer un litige financier | L'utilisateur est connecté, l'emprunteur et le compte de crédit existent | 1. Naviguer vers la page Litiges (`/disputes`). 2. Cliquer sur « Déposer un Litige ». 3. Sélectionner l'emprunteur. 4. Sélectionner le compte de crédit. 5. Définir le type de litige (ex. : « incorrect_balance »). 6. Saisir la description. 7. Définir le type de correction : « financial ». 8. Soumettre. | Litige créé avec statut = « open ». Délai SLA défini à 2 jours ouvrables à partir de la création. Entrée dans le journal d'audit. Notification envoyée à l'admin. | | FR-CON-04, DQ-04 |
| TC-DIS-002 | Litiges | Déposer un litige non financier | L'utilisateur est connecté, l'emprunteur existe | 1. Naviguer vers Litiges. 2. Déposer un litige avec le type de correction : « non_financial ». 3. Soumettre. | Litige créé. Délai SLA défini à 5 jours ouvrables à partir de la création. | | FR-CON-04, DQ-05 |
| TC-DIS-003 | Litiges | Suivi SLA - financier (2 jours) | Un litige financier existe | 1. Consulter le litige. 2. Vérifier le champ du délai SLA. | Le délai SLA est de 2 jours ouvrables à partir de la date de création du litige. Indicateur visuel si le délai approche/est dépassé. | | DQ-04 |
| TC-DIS-004 | Litiges | Suivi SLA - non financier (5 jours) | Un litige non financier existe | 1. Consulter le litige. 2. Vérifier le champ du délai SLA. | Le délai SLA est de 5 jours ouvrables à partir de la date de création du litige. | | DQ-05 |
| TC-DIS-005 | Litiges | Résoudre un litige | Admin/Régulateur connecté, un litige ouvert existe | 1. Naviguer vers Litiges. 2. Sélectionner un litige ouvert. 3. Cliquer sur « Résoudre ». 4. Saisir le texte de résolution. 5. Soumettre. | Le statut du litige passe à « resolved ». Le texte de résolution est enregistré. L'horodatage resolvedAt est enregistré. Entrée dans le journal d'audit. | | FR-CON-04 |
| TC-DIS-006 | Litiges | Consulter l'historique des litiges | L'utilisateur est connecté | 1. Naviguer vers la page Litiges. 2. Consulter la liste de tous les litiges. | Tous les litiges sont listés avec : emprunteur, type de litige, statut, type de correction, délai SLA, date de création. | | FR-CON-04 |
| TC-DIS-007 | Litiges | Progression du statut du litige | Un litige existe | 1. Vérifier que le litige démarre à « open ». 2. Mettre à jour vers « under_review ». 3. Résoudre le litige. | Transitions de statut : open -> under_review -> resolved (ou rejected). | | FR-CON-04 |
| TC-DIS-008 | Litiges | Consulter les détails d'un litige individuel | Un litige existe | 1. Cliquer sur une ligne de litige. | La boîte de dialogue de détail du litige s'ouvre affichant tous les champs : emprunteur, compte, type, description, statut, type de correction, délai SLA, résolution, horodatages. | | FR-CON-04 |

---

## 10. Module des Jugements Judiciaires

| ID-CT | Module | Nom du Cas de Test | Pré-conditions | Étapes de Test | Résultat Attendu | Réussi/Échoué | Référence SRS |
|-------|--------|-------------------|----------------|----------------|------------------|---------------|---------------|
| TC-CJ-001 | Jugements Judiciaires | Créer un jugement de privilège | Admin/Régulateur connecté, l'emprunteur existe | 1. Naviguer vers le détail de l'emprunteur ou la section Jugements Judiciaires. 2. Cliquer sur « Ajouter un Jugement Judiciaire ». 3. Remplir : ID Emprunteur, Numéro de Dossier, Nom du Tribunal, Type de Jugement : « lien », Montant, Devise, Date du Jugement, Description. 4. Soumettre. | Jugement judiciaire créé avec type = « lien », statut = « active ». Entrée dans le journal d'audit créée. | | FR-COL-05 |
| TC-CJ-002 | Jugements Judiciaires | Créer un jugement de faillite | Admin/Régulateur connecté | 1. Ajouter un jugement judiciaire avec type : « bankruptcy ». | Jugement judiciaire créé avec type = « bankruptcy ». | | FR-COL-05 |
| TC-CJ-003 | Jugements Judiciaires | Créer un jugement de poursuite | Admin/Régulateur connecté | 1. Ajouter un jugement judiciaire avec type : « lawsuit ». | Jugement judiciaire créé avec type = « lawsuit ». | | FR-COL-05 |
| TC-CJ-004 | Jugements Judiciaires | Créer un jugement civil | Admin/Régulateur connecté | 1. Ajouter un jugement judiciaire avec type : « civil_judgment ». | Jugement judiciaire créé. | | FR-COL-05 |
| TC-CJ-005 | Jugements Judiciaires | Créer une condamnation pénale | Admin/Régulateur connecté | 1. Ajouter un jugement judiciaire avec type : « criminal_conviction ». | Jugement judiciaire créé. | | FR-COL-05 |
| TC-CJ-006 | Jugements Judiciaires | Suivi du statut du jugement | Un jugement judiciaire existe | 1. Consulter le jugement. 2. Vérifier les options de statut. | Le statut peut être : active, resolved ou appealed. | | FR-COL-05 |
| TC-CJ-007 | Jugements Judiciaires | Consulter les jugements par emprunteur | L'emprunteur a des jugements judiciaires | 1. Naviguer vers la page de détail de l'emprunteur. 2. Consulter la section des jugements judiciaires. | Tous les jugements judiciaires de l'emprunteur sont affichés avec le numéro de dossier, le tribunal, le type, le montant, la devise, la date, le statut et la description. | | FR-COL-05 |
| TC-CJ-008 | Jugements Judiciaires | Filtrer les jugements par ID d'emprunteur | Des jugements judiciaires existent | 1. Interroger l'API des jugements judiciaires avec le filtre ?borrowerId. | Seuls les jugements de l'emprunteur spécifié sont retournés. | | FR-COL-05 |

---

## 11. Module de Gestion du Consentement

| ID-CT | Module | Nom du Cas de Test | Pré-conditions | Étapes de Test | Résultat Attendu | Réussi/Échoué | Référence SRS |
|-------|--------|-------------------|----------------|----------------|------------------|---------------|---------------|
| TC-CON-001 | Gestion du Consentement | Accorder le consentement | L'utilisateur est connecté, l'emprunteur existe | 1. Naviguer vers la page Gestion du Consentement (`/consent`). 2. Cliquer sur « Accorder le Consentement ». 3. Sélectionner l'emprunteur. 4. Saisir l'institution « Accordé À ». 5. Sélectionner l'objet. 6. Sélectionner le type de consentement. 7. Soumettre. | Enregistrement de consentement créé avec statut = « active ». Numéro de reçu généré au format CR-{horodatage}-{aléatoire}. | | FR-CON-06 |
| TC-CON-002 | Gestion du Consentement | Génération du numéro de reçu | Enregistrement de consentement créé | 1. Créer un enregistrement de consentement. 2. Noter le numéro de reçu. | Le numéro de reçu est unique et suit le format CR-{horodatage}-{aléatoire}. | | FR-CON-07 |
| TC-CON-003 | Gestion du Consentement | Révoquer le consentement | Un enregistrement de consentement actif existe | 1. Naviguer vers Gestion du Consentement. 2. Trouver le consentement actif. 3. Cliquer sur « Révoquer ». | Le statut du consentement passe à « revoked ». L'horodatage revokedAt est défini. Entrée dans le journal d'audit créée. | | FR-CON-06 |
| TC-CON-004 | Gestion du Consentement | Consulter les enregistrements de consentement | Des enregistrements de consentement existent | 1. Naviguer vers la page Gestion du Consentement. | Tous les enregistrements de consentement sont affichés avec : emprunteur, accordé à, objet, type de consentement, statut, numéro de reçu, date d'accord, date de révocation. | | FR-CON-06 |
| TC-CON-005 | Gestion du Consentement | Filtrer le consentement par emprunteur | L'emprunteur a des enregistrements de consentement | 1. Interroger les enregistrements de consentement avec le filtre ?borrowerId. | Seuls les enregistrements de consentement de l'emprunteur spécifié sont retournés. | | FR-CON-06 |
| TC-CON-006 | Gestion du Consentement | Consulter le consentement sur le détail de l'emprunteur | L'emprunteur a des enregistrements de consentement | 1. Naviguer vers la page de détail de l'emprunteur. 2. Consulter la section consentement. | Les enregistrements de consentement de l'emprunteur sont affichés. | | FR-CON-06 |
| TC-CON-007 | Gestion du Consentement | Prévention des doublons de consentement actif | Un consentement actif existe pour le même emprunteur + accordéÀ + objet | 1. Tenter de créer un consentement en doublon. | Le système gère de manière appropriée (empêche ou autorise les multiples). | | FR-CON-08 |
| TC-CON-008 | Gestion du Consentement | Naviguer du consentement vers l'emprunteur | Un enregistrement de consentement est affiché dans le tableau | 1. Cliquer sur une ligne d'enregistrement de consentement. | Navigation vers la page de détail de l'emprunteur associé. | | FR-CON-09 |

---

## 12. Module de Gestion des Institutions

| ID-CT | Module | Nom du Cas de Test | Pré-conditions | Étapes de Test | Résultat Attendu | Réussi/Échoué | Référence SRS |
|-------|--------|-------------------|----------------|----------------|------------------|---------------|---------------|
| TC-INST-001 | Institutions | Enregistrer une institution bancaire | Admin connecté | 1. Naviguer vers la page Institutions (`/institutions`). 2. Cliquer sur « Ajouter une Institution ». 3. Remplir : Nom, Type : « bank », Numéro d'Immatriculation, Pays, Email de Contact, Téléphone de Contact, Adresse. 4. Soumettre. | Institution créée avec statut = « pending ». | | FR-DP-01 |
| TC-INST-002 | Institutions | Enregistrer une institution de microfinance | Admin connecté | 1. Ajouter une institution avec type : « mfi ». | Institution créée. | | FR-DP-01 |
| TC-INST-003 | Institutions | Enregistrer une institution de services publics | Admin connecté | 1. Ajouter une institution avec type : « utility ». | Institution créée. | | FR-DP-01 |
| TC-INST-004 | Institutions | Enregistrer une institution de télécommunications | Admin connecté | 1. Ajouter une institution avec type : « telecom ». | Institution créée. | | FR-DP-01 |
| TC-INST-005 | Institutions | Enregistrer un prêteur numérique | Admin connecté | 1. Ajouter une institution avec type : « digital_lender ». | Institution créée. | | FR-DP-01 |
| TC-INST-006 | Institutions | Enregistrer une SACCO | Admin connecté | 1. Ajouter une institution avec type : « sacco ». | Institution créée. | | FR-DP-01 |
| TC-INST-007 | Institutions | Approuver une institution | Admin connecté, une institution en attente existe | 1. Naviguer vers Institutions. 2. Sélectionner une institution en attente. 3. Cliquer sur « Approuver ». | Le statut de l'institution passe à « active ». Les champs approvedBy et approvedAt sont renseignés. | | FR-DP-04 |
| TC-INST-008 | Institutions | Configurer la fréquence de soumission | Admin connecté, une institution active existe | 1. Naviguer vers le détail de l'institution. 2. Définir la fréquence de soumission (ex. : « monthly », « weekly »). 3. Enregistrer. | La fréquence de soumission est mise à jour. | | FR-DP-01 |
| TC-INST-009 | Institutions | Support multi-pays | Admin connecté | 1. Créer des institutions avec différents pays : Éthiopie, Ghana, Ouganda, Libéria. | Institutions créées avec les attributions de pays correctes. | | FR-DP-01 |
| TC-INST-010 | Institutions | Pagination des institutions | De nombreuses institutions existent | 1. Naviguer vers la page Institutions. 2. Observer la pagination. | La pagination côté serveur fonctionne. Les contrôles de page/limite sont fonctionnels. | | FR-DP-01 |
| TC-INST-011 | Institutions | Lignes d'institution cliquables | Les institutions sont listées dans le tableau | 1. Cliquer sur une ligne d'institution. | La boîte de dialogue de détail de l'institution s'ouvre affichant toutes les informations de l'institution. | | FR-DP-01 |

---

## 13. Module de Facturation

| ID-CT | Module | Nom du Cas de Test | Pré-conditions | Étapes de Test | Résultat Attendu | Réussi/Échoué | Référence SRS |
|-------|--------|-------------------|----------------|----------------|------------------|---------------|---------------|
| TC-BIL-001 | Facturation | Créer une facture - soumission de données | Admin/Régulateur connecté | 1. Naviguer vers la page Facturation (`/billing`). 2. Cliquer sur « Créer une Facture ». 3. Remplir : Nom de l'Institution, Type de Service : « data_submission », Montant, Devise, Début de Période, Fin de Période. 4. Soumettre. | Enregistrement de facturation créé avec un numéro de facture unique, statut = « pending ». | | FR-COMM-01 |
| TC-BIL-002 | Facturation | Créer une facture - rapport de crédit | Admin/Régulateur connecté | 1. Créer une facture avec type de service : « credit_report ». | Enregistrement de facturation créé. | | FR-COMM-01 |
| TC-BIL-003 | Facturation | Créer une facture - accès API | Admin/Régulateur connecté | 1. Créer une facture avec type de service : « api_access ». | Enregistrement de facturation créé. | | FR-COMM-01 |
| TC-BIL-004 | Facturation | Créer une facture - abonnement | Admin/Régulateur connecté | 1. Créer une facture avec type de service : « subscription ». | Enregistrement de facturation créé. | | FR-COMM-01 |
| TC-BIL-005 | Facturation | Suivi du statut de paiement | Des enregistrements de facturation existent | 1. Consulter les enregistrements de facturation. 2. Observer les valeurs de statut. | Statuts affichés : pending, paid, overdue. | | FR-COMM-05 |
| TC-BIL-006 | Facturation | Facturation multi-devises | Admin/Régulateur connecté | 1. Créer des factures dans différentes devises (ETB, GHS, UGX, USD). | Factures créées avec la devise correcte. Les montants sont formatés selon la devise. | | FR-COMM-01 |
| TC-BIL-007 | Facturation | Lignes de facturation cliquables | Les enregistrements de facturation sont listés | 1. Cliquer sur une ligne d'enregistrement de facturation. | La boîte de dialogue de détail de la facturation s'ouvre affichant toutes les informations de la facture. | | FR-COMM-01 |
| TC-BIL-008 | Facturation | Restriction d'accès pour Prêteur/Observateur | Utilisateur Prêteur ou Observateur connecté | 1. Tenter d'accéder à la page Facturation. | Accès refusé ou page non visible dans la navigation de la barre latérale. | | FR-COMM-01 |

---

## 14. Module d'Assistance

| ID-CT | Module | Nom du Cas de Test | Pré-conditions | Étapes de Test | Résultat Attendu | Réussi/Échoué | Référence SRS |
|-------|--------|-------------------|----------------|----------------|------------------|---------------|---------------|
| TC-HD-001 | Assistance | Rechercher un emprunteur | L'utilisateur est connecté | 1. Naviguer vers la page Assistance (`/helpdesk`). 2. Saisir le nom ou l'ID de l'emprunteur dans le champ de recherche. 3. Rechercher. | Le(s) emprunteur(s) correspondant(s) affiché(s) avec les informations résumées. | | FR-CON-02 |
| TC-HD-002 | Assistance | Consulter les informations de l'emprunteur depuis l'assistance | Emprunteur trouvé via la recherche | 1. Rechercher un emprunteur. 2. Consulter les détails de l'emprunteur. | Les informations personnelles/entreprise de l'emprunteur sont affichées. Les comptes de crédit, litiges et enregistrements de consentement sont visibles. | | FR-CON-02 |
| TC-HD-003 | Assistance | Déposer un litige depuis l'assistance | Emprunteur trouvé, l'utilisateur est connecté | 1. Rechercher un emprunteur dans l'Assistance. 2. Cliquer sur « Déposer un Litige ». 3. Remplir les détails du litige. 4. Soumettre. | Litige créé depuis le contexte de l'assistance. Lié au bon emprunteur. | | FR-CON-09 |
| TC-HD-004 | Assistance | Accorder le consentement depuis l'assistance | Emprunteur trouvé, l'utilisateur est connecté | 1. Rechercher un emprunteur dans l'Assistance. 2. Cliquer sur « Accorder le Consentement ». 3. Remplir les détails du consentement. 4. Soumettre. | Enregistrement de consentement créé depuis le contexte de l'assistance. Numéro de reçu généré. | | FR-CON-09 |
| TC-HD-005 | Assistance | Consulter les litiges de l'emprunteur depuis l'assistance | L'emprunteur a des litiges | 1. Rechercher l'emprunteur. 2. Consulter la section litiges. | Tous les litiges de l'emprunteur sont affichés. | | FR-CON-02 |
| TC-HD-006 | Assistance | Consulter le consentement de l'emprunteur depuis l'assistance | L'emprunteur a des enregistrements de consentement | 1. Rechercher l'emprunteur. 2. Consulter la section consentement. | Tous les enregistrements de consentement de l'emprunteur sont affichés. | | FR-CON-02 |

---

## 15. Module de Téléchargement par Lots

| ID-CT | Module | Nom du Cas de Test | Pré-conditions | Étapes de Test | Résultat Attendu | Réussi/Échoué | Référence SRS |
|-------|--------|-------------------|----------------|----------------|------------------|---------------|---------------|
| TC-BU-001 | Téléchargement par Lots | Télécharger un fichier JSON valide | Admin/Prêteur connecté, fichier JSON valide préparé | 1. Naviguer vers la page Téléchargement par Lots (`/batch-upload`). 2. Sélectionner le format de fichier : JSON. 3. Sélectionner un fichier JSON valide avec des enregistrements de comptes de crédit. 4. Cliquer sur « Télécharger ». | Fichier traité avec succès. Enregistrements validés et importés. Nombre de succès affiché. | | FR-COL-01 |
| TC-BU-002 | Téléchargement par Lots | Télécharger un fichier CSV valide | Admin/Prêteur connecté, fichier CSV valide préparé | 1. Naviguer vers Téléchargement par Lots. 2. Sélectionner le format de fichier : CSV. 3. Sélectionner un fichier CSV valide. 4. Cliquer sur « Télécharger ». | Fichier traité avec succès. Enregistrements validés et importés. | | FR-COL-01 |
| TC-BU-003 | Téléchargement par Lots | Télécharger un JSON avec des erreurs de validation | Admin/Prêteur connecté, fichier JSON avec des enregistrements invalides | 1. Naviguer vers Téléchargement par Lots. 2. Télécharger un fichier JSON avec certains enregistrements invalides (champs requis manquants, types de données invalides). 3. Cliquer sur « Télécharger ». | Les enregistrements valides sont traités. Les enregistrements invalides sont signalés avec les détails d'erreur par enregistrement. Nombre d'erreurs affiché. | | FR-COL-01 |
| TC-BU-004 | Téléchargement par Lots | Télécharger un CSV avec des erreurs de validation | Admin/Prêteur connecté, fichier CSV avec des erreurs | 1. Télécharger un fichier CSV avec des enregistrements invalides. | Les enregistrements valides sont traités. Les erreurs sont signalées par enregistrement. | | FR-COL-01 |
| TC-BU-005 | Téléchargement par Lots | Télécharger le rapport d'erreurs | Téléchargement terminé avec des erreurs | 1. Terminer un téléchargement avec quelques erreurs. 2. Cliquer sur « Télécharger le Rapport d'Erreurs » ou équivalent. | Le rapport d'erreurs est téléchargé avec les détails des enregistrements échoués et leurs erreurs de validation. | | FR-COL-01 |
| TC-BU-006 | Téléchargement par Lots | Téléchargement d'un fichier vide | Admin/Prêteur connecté | 1. Télécharger un fichier vide. | Message d'erreur approprié : « Le corps de la requête doit contenir un tableau 'records' » ou similaire. | | FR-COL-01 |
| TC-BU-007 | Téléchargement par Lots | Restriction d'accès pour Observateur/Régulateur | Observateur ou Régulateur connecté | 1. Tenter d'accéder au Téléchargement par Lots. | Accès refusé ou page non accessible. | | FR-COL-01 |

---

## 16. Module de Piste d'Audit

| ID-CT | Module | Nom du Cas de Test | Pré-conditions | Étapes de Test | Résultat Attendu | Réussi/Échoué | Référence SRS |
|-------|--------|-------------------|----------------|----------------|------------------|---------------|---------------|
| TC-AT-001 | Piste d'Audit | Consulter les entrées du journal d'audit | Admin/Régulateur connecté, des entrées d'audit existent | 1. Naviguer vers la page Piste d'Audit (`/audit`). | Les entrées du journal d'audit sont affichées avec : horodatage, utilisateur, action, entité, ID de l'entité, détails, adresse IP. | | NFR-SEC-06 |
| TC-AT-002 | Piste d'Audit | Événements de connexion journalisés | L'utilisateur effectue une connexion | 1. Se connecter avec n'importe quel utilisateur. 2. Naviguer vers la Piste d'Audit. 3. Rechercher l'action LOGIN. | L'événement de connexion est enregistré avec l'ID utilisateur, l'horodatage et l'adresse IP. | | NFR-SEC-06 |
| TC-AT-003 | Piste d'Audit | Événements de déconnexion journalisés | L'utilisateur effectue une déconnexion | 1. Se déconnecter. 2. Se reconnecter en tant qu'Admin. 3. Vérifier la Piste d'Audit. | L'événement LOGOUT est enregistré. | | NFR-SEC-06 |
| TC-AT-004 | Piste d'Audit | Tentatives de connexion échouées journalisées | Une connexion échouée se produit | 1. Tenter une connexion avec un mauvais mot de passe. 2. Vérifier la Piste d'Audit. | L'événement LOGIN_FAILED est enregistré avec l'adresse IP. | | NFR-SEC-06 |
| TC-AT-005 | Piste d'Audit | Verrouillage de compte journalisé | Un compte est verrouillé | 1. Déclencher le verrouillage du compte (3 tentatives échouées). 2. Vérifier la Piste d'Audit. | L'événement ACCOUNT_LOCKED est enregistré. | | NFR-SEC-06 |
| TC-AT-006 | Piste d'Audit | Opérations CRUD journalisées | Toute action de création/mise à jour/suppression | 1. Effectuer une opération de données (ex. : soumettre un emprunteur). 2. Vérifier la Piste d'Audit. | L'événement SUBMIT_APPROVAL ou CREATE est journalisé avec les détails de l'entité. | | NFR-SEC-06 |
| TC-AT-007 | Piste d'Audit | Suivi de l'adresse IP | Toute action effectuée | 1. Effectuer diverses actions. 2. Vérifier les entrées de la Piste d'Audit. | Chaque entrée a un champ ipAddress renseigné. | | NFR-SEC-07 |
| TC-AT-008 | Piste d'Audit | Changement de mot de passe journalisé | L'utilisateur change son mot de passe | 1. Changer le mot de passe. 2. Vérifier la Piste d'Audit. | L'événement PASSWORD_CHANGE est enregistré. | | NFR-SEC-06 |
| TC-AT-009 | Piste d'Audit | Génération de rapport de crédit journalisée | Un rapport de crédit est généré | 1. Générer un rapport de crédit. 2. Vérifier la Piste d'Audit. | L'événement VIEW ou API_CREDIT_REPORT est journalisé avec les détails de l'emprunteur. | | NFR-SEC-06 |
| TC-AT-010 | Piste d'Audit | Restriction d'accès pour Prêteur/Observateur | Prêteur ou Observateur connecté | 1. Tenter d'accéder à la page Piste d'Audit. | Accès refusé ou page non visible dans la navigation. | | NFR-SEC-06 |
| TC-AT-011 | Piste d'Audit | Lignes de piste d'audit cliquables | Les entrées d'audit sont listées | 1. Cliquer sur une ligne d'entrée de la piste d'audit. | La boîte de dialogue de détail s'ouvre affichant toutes les informations de l'entrée d'audit. | | NFR-SEC-06 |

---

## 17. Module de Gestion des Utilisateurs

| ID-CT | Module | Nom du Cas de Test | Pré-conditions | Étapes de Test | Résultat Attendu | Réussi/Échoué | Référence SRS |
|-------|--------|-------------------|----------------|----------------|------------------|---------------|---------------|
| TC-UM-001 | Gestion des Utilisateurs | Créer un nouvel utilisateur | Admin connecté | 1. Naviguer vers la page Gestion des Utilisateurs (`/users`). 2. Cliquer sur « Ajouter un Utilisateur ». 3. Remplir : Nom d'utilisateur, Mot de passe (répondant aux exigences de complexité), Nom Complet, Email, Rôle (admin/régulateur/prêteur/observateur), Institution. 4. Soumettre. | Utilisateur créé avec succès. Le mot de passe est stocké sous forme de hachage bcrypt. Entrée dans le journal d'audit créée. | | NFR-SEC-01 |
| TC-UM-002 | Gestion des Utilisateurs | Attribuer le rôle Admin | Admin connecté | 1. Créer un utilisateur avec le rôle : « admin ». | Utilisateur créé avec le rôle admin. A accès à toutes les fonctionnalités d'administration. | | NFR-SEC-02 |
| TC-UM-003 | Gestion des Utilisateurs | Attribuer le rôle Régulateur | Admin connecté | 1. Créer un utilisateur avec le rôle : « regulator ». | Utilisateur créé avec le rôle régulateur. | | NFR-SEC-02 |
| TC-UM-004 | Gestion des Utilisateurs | Attribuer le rôle Prêteur | Admin connecté | 1. Créer un utilisateur avec le rôle : « lender ». | Utilisateur créé avec le rôle prêteur. | | NFR-SEC-02 |
| TC-UM-005 | Gestion des Utilisateurs | Attribuer le rôle Observateur | Admin connecté | 1. Créer un utilisateur avec le rôle : « viewer ». | Utilisateur créé avec le rôle observateur. Accès en lecture seule. | | NFR-SEC-02 |
| TC-UM-006 | Gestion des Utilisateurs | Suspendre un utilisateur | Admin connecté, un utilisateur actif existe | 1. Naviguer vers Gestion des Utilisateurs. 2. Sélectionner l'utilisateur. 3. Changer le statut en « suspended ». | Le statut de l'utilisateur passe à suspendu. L'utilisateur ne peut plus se connecter. Entrée dans le journal d'audit. | | NFR-SEC-02 |
| TC-UM-007 | Gestion des Utilisateurs | Désactiver un utilisateur | Admin connecté, un utilisateur actif existe | 1. Sélectionner l'utilisateur. 2. Changer le statut en « deactivated ». | Le statut de l'utilisateur passe à désactivé. L'utilisateur ne peut pas se connecter. | | NFR-SEC-02 |
| TC-UM-008 | Gestion des Utilisateurs | Réactiver un utilisateur | Admin connecté, un utilisateur suspendu/désactivé existe | 1. Sélectionner l'utilisateur. 2. Changer le statut en « active ». | Le statut de l'utilisateur passe à actif. L'utilisateur peut se reconnecter. | | NFR-SEC-02 |
| TC-UM-009 | Gestion des Utilisateurs | Mettre à jour les détails de l'utilisateur | Admin connecté | 1. Sélectionner l'utilisateur. 2. Modifier le Nom Complet et l'Email. 3. Enregistrer. | Les détails de l'utilisateur sont mis à jour. Entrée dans le journal d'audit. | | NFR-SEC-02 |
| TC-UM-010 | Gestion des Utilisateurs | Restriction d'accès pour les non-admin | Régulateur/Prêteur/Observateur connecté | 1. Tenter d'accéder à la page Gestion des Utilisateurs. | Accès refusé ou page non visible dans la barre latérale. | | NFR-SEC-02 |
| TC-UM-011 | Gestion des Utilisateurs | Réinitialiser le mot de passe d'un utilisateur | Admin connecté | 1. Sélectionner l'utilisateur. 2. Définir un nouveau mot de passe. 3. Enregistrer. | Le mot de passe est mis à jour (haché en bcrypt). L'utilisateur peut se connecter avec le nouveau mot de passe. | | NFR-SEC-04 |

---

## 18. Module des Clés API

| ID-CT | Module | Nom du Cas de Test | Pré-conditions | Étapes de Test | Résultat Attendu | Réussi/Échoué | Référence SRS |
|-------|--------|-------------------|----------------|----------------|------------------|---------------|---------------|
| TC-AK-001 | Clés API | Générer une clé API pour une institution | Admin connecté, une institution active existe | 1. Naviguer vers la page Clés API (`/api-keys`). 2. Cliquer sur « Générer une Clé API ». 3. Sélectionner l'institution. 4. Saisir un libellé. 5. Sélectionner les permissions : « submit ». 6. Soumettre. | Clé API générée. La clé complète est affichée une seule fois (sim_{préfixe}_{secret}). Le préfixe et le hachage de la clé sont stockés. Le préfixe de la clé est affiché pour identification. | | NFR-SEC-08 |
| TC-AK-002 | Clés API | Générer une clé API avec permissions de lecture | Admin connecté | 1. Générer une clé API avec permissions : « read ». | Clé générée avec des permissions en lecture seule. | | NFR-SEC-08 |
| TC-AK-003 | Clés API | Générer une clé API avec permissions complètes | Admin connecté | 1. Générer une clé API avec permissions : « full ». | Clé générée avec des permissions complètes (soumission + lecture). | | NFR-SEC-08 |
| TC-AK-004 | Clés API | Révoquer une clé API | Admin connecté, une clé API active existe | 1. Naviguer vers Clés API. 2. Sélectionner la clé active. 3. Cliquer sur « Révoquer ». | Le statut de la clé passe à « revoked ». L'horodatage revokedAt est défini. La clé ne peut plus être utilisée pour l'authentification API. | | NFR-SEC-08 |
| TC-AK-005 | Clés API | Consulter l'utilisation d'une clé API | Admin connecté, une clé API a été utilisée | 1. Naviguer vers Clés API. 2. Consulter les détails de la clé. | L'horodatage de dernière utilisation est affiché. Le préfixe de la clé est affiché pour identification. | | NFR-SEC-08 |
| TC-AK-006 | Clés API | Restriction d'accès pour les non-admin | Régulateur/Prêteur/Observateur connecté | 1. Tenter d'accéder à la page Clés API. | Accès refusé ou page non visible. | | NFR-SEC-08 |
| TC-AK-007 | Clés API | Hachage SHA-256 de la clé API | Clé API générée | 1. Générer une clé API. 2. Vérifier le stockage. | La clé complète n'est jamais stockée. Seul le hachage SHA-256 est stocké dans la base de données. Le préfixe de la clé est stocké séparément pour l'affichage. | | NFR-SEC-08 |

---

## 19. Module API Externe

| ID-CT | Module | Nom du Cas de Test | Pré-conditions | Étapes de Test | Résultat Attendu | Réussi/Échoué | Référence SRS |
|-------|--------|-------------------|----------------|----------------|------------------|---------------|---------------|
| TC-EA-001 | API Externe | Point de terminaison de vérification de santé | L'API est accessible | 1. Envoyer une requête GET à `/api/external/v1/health`. | Réponse : `{ "status": "ok", "version": "1.1", "service": "Systems In Motion Credit Registry API" }`. Aucune authentification requise. | | NFR-SEC-08 |
| TC-EA-002 | API Externe | Soumettre un emprunteur unique | Clé API valide avec permission « submit » | 1. Envoyer un POST à `/api/external/v1/borrowers` avec l'en-tête X-API-Key. 2. Corps : JSON d'emprunteur valide. | 201 Créé. La réponse inclut les données de l'emprunteur au format `{ success: true, data: {...} }`. Entrée dans le journal d'audit : API_SUBMIT. | | FR-COL-01 |
| TC-EA-003 | API Externe | Soumettre des emprunteurs par lot | Clé API valide avec permission « submit » | 1. Envoyer un POST à `/api/external/v1/borrowers` avec un tableau d'objets emprunteur. | Réponse avec les résultats du lot : nombre soumis, nombre échoué, résultats individuels et erreurs. Journal d'audit : API_BATCH_SUBMIT. | | FR-COL-01 |
| TC-EA-004 | API Externe | Soumettre un compte de crédit | Clé API valide avec permission « submit » | 1. Envoyer un POST à `/api/external/v1/credit-accounts` avec un JSON de compte de crédit. | 201 Créé. Compte de crédit créé. L'institution prêteuse est définie par défaut à l'institution de la clé API si non spécifiée. | | FR-CR-01 |
| TC-EA-005 | API Externe | Soumettre des comptes de crédit par lot | Clé API valide avec permission « submit » | 1. Envoyer un POST à `/api/external/v1/credit-accounts` avec un tableau de comptes de crédit. | Résultats du traitement par lot retournés. | | FR-CR-01 |
| TC-EA-006 | API Externe | Soumettre un historique de paiement | Clé API valide avec permission « submit » | 1. Envoyer un POST à `/api/external/v1/payment-history` avec des enregistrements d'historique de paiement. | Entrées d'historique de paiement créées. Supporte la soumission unique et par lot. | | FR-CR-08 |
| TC-EA-007 | API Externe | Soumettre un jugement judiciaire | Clé API valide avec permission « submit » | 1. Envoyer un POST à `/api/external/v1/court-judgments` avec les données du jugement. | Jugement judiciaire créé. Entrée dans le journal d'audit. | | FR-COL-05 |
| TC-EA-008 | API Externe | Rechercher des emprunteurs par Numéro d'Identité Nationale | Clé API valide avec permission « read » | 1. Envoyer un GET à `/api/external/v1/borrowers/search?nationalId={id}`. | Les emprunteurs correspondants sont retournés au format de réponse enveloppé. | | FR-CR-01 |
| TC-EA-009 | API Externe | Rechercher des emprunteurs par nom | Clé API valide avec permission « read » | 1. Envoyer un GET à `/api/external/v1/borrowers/search?name={name}`. | Les emprunteurs correspondants sont retournés. | | FR-CR-01 |
| TC-EA-010 | API Externe | Récupérer un rapport de crédit | Clé API valide avec permission « read » | 1. Envoyer un GET à `/api/external/v1/borrowers/{id}/credit-report`. | Rapport de crédit complet retourné avec : numéro de série, score de crédit, codes de motif, comptes, consultations, jugements judiciaires, enregistrements de consentement. Entrée dans le journal des rapports créée. | | FR-CR-06 |
| TC-EA-011 | API Externe | Obtenir les comptes de crédit par emprunteur | Clé API valide avec permission « read » | 1. Envoyer un GET à `/api/external/v1/credit-accounts/{borrowerId}`. | Les comptes de crédit de l'emprunteur sont retournés. | | FR-CR-01 |
| TC-EA-012 | API Externe | En-tête de clé API manquant | Pas d'en-tête X-API-Key | 1. Envoyer n'importe quelle requête à l'API externe sans en-tête X-API-Key. | 401 Non autorisé : `{ "error": "Missing X-API-Key header" }`. | | NFR-SEC-08 |
| TC-EA-013 | API Externe | Clé API invalide | Valeur de clé API invalide | 1. Envoyer une requête avec une valeur X-API-Key invalide. | 401 Non autorisé : `{ "error": "Invalid API key" }`. | | NFR-SEC-08 |
| TC-EA-014 | API Externe | Clé API révoquée | Clé API révoquée | 1. Envoyer une requête avec une clé API révoquée. | 403 Interdit : `{ "error": "API key has been revoked" }`. | | NFR-SEC-08 |
| TC-EA-015 | API Externe | Permissions insuffisantes | Clé API avec permission « read » uniquement | 1. Envoyer un POST à `/api/external/v1/borrowers` avec une clé en lecture seule. | 403 Interdit : `{ "error": "Insufficient permissions..." }`. | | NFR-SEC-08 |
| TC-EA-016 | API Externe | Clé API d'institution inactive | Clé API pour une institution suspendue/en attente | 1. Envoyer une requête avec une clé liée à une institution non active. | 403 Interdit : `{ "error": "Institution is not active" }`. | | NFR-SEC-08 |
| TC-EA-017 | API Externe | Erreur de validation lors de la soumission | Clé API valide | 1. Envoyer un POST avec des données invalides (champs requis manquants). | 400 Requête Incorrecte avec les détails des erreurs de validation. | | FR-COL-01 |
| TC-EA-018 | API Externe | Suivi de la dernière utilisation de la clé API | Clé API valide | 1. Effectuer n'importe quelle requête API authentifiée. 2. Vérifier l'enregistrement de la clé API. | L'horodatage lastUsedAt est mis à jour sur la clé API. | | NFR-SEC-08 |

---

## 20. Module Rapports & Export

| ID-CT | Module | Nom du Cas de Test | Pré-conditions | Étapes de Test | Résultat Attendu | Réussi/Échoué | Référence SRS |
|-------|--------|-------------------|----------------|----------------|------------------|---------------|---------------|
| TC-RE-001 | Rapports | Export CSV - données du portefeuille | L'utilisateur est connecté | 1. Naviguer vers la page Rapports (`/reports`). 2. Sélectionner le type d'export : « portfolio ». 3. Cliquer sur « Exporter en CSV ». | Fichier CSV téléchargé contenant les données du portefeuille (comptes par institution, types de prêts, ratios de PNP). | | INT-RPT-01 |
| TC-RE-002 | Rapports | Export CSV - données des emprunteurs | L'utilisateur est connecté | 1. Naviguer vers Rapports. 2. Sélectionner le type d'export : « borrowers ». 3. Cliquer sur « Exporter en CSV ». | Fichier CSV téléchargé contenant les enregistrements d'emprunteurs. | | INT-RPT-04 |
| TC-RE-003 | Rapports | Vue des analyses réglementaires | L'utilisateur est connecté | 1. Naviguer vers Rapports. 2. Consulter la section des analyses réglementaires. | Analyses affichées : ratios de PNP, répartition du portefeuille par institution/type de prêt, suivi des violations de SLA. | | FR-REG-01 |
| TC-RE-004 | Rapports | Répartition du portefeuille par institution | Des données existent pour plusieurs institutions | 1. Consulter les analyses réglementaires. | Les données du portefeuille sont réparties par institution montrant les volumes de prêts, les montants impayés et les ratios de PNP. | | FR-REG-02 |
| TC-RE-005 | Rapports | Suivi des violations de SLA | Des litiges avec des délais SLA dépassés existent | 1. Consulter les analyses réglementaires. | Les violations de SLA sont identifiées et comptabilisées. | | FR-REG-03 |
| TC-RE-006 | Rapports | Vue des journaux des rapports de crédit | Des rapports de crédit ont été générés | 1. Naviguer vers les journaux des rapports de crédit (via l'API ou la section rapports). | Entrées de journal affichant : emprunteur, demandéPar, institution, objet, numéro de série, horodatage. | | FR-CR-06 |

---

## 21. Module de Notifications

| ID-CT | Module | Nom du Cas de Test | Pré-conditions | Étapes de Test | Résultat Attendu | Réussi/Échoué | Référence SRS |
|-------|--------|-------------------|----------------|----------------|------------------|---------------|---------------|
| TC-NOT-001 | Notifications | Affichage de la cloche de notification | L'utilisateur est connecté | 1. Observer l'icône de cloche de notification dans l'en-tête/barre latérale. | La cloche de notification est visible. | | FR-CON-02 |
| TC-NOT-002 | Notifications | Badge de compteur de non-lus | L'utilisateur a des notifications non lues | 1. Observer la cloche de notification. | Le badge du compteur de non-lus est affiché sur l'icône de la cloche avec le nombre de notifications non lues. | | FR-CON-02 |
| TC-NOT-003 | Notifications | Consulter la liste des notifications | L'utilisateur a des notifications | 1. Cliquer sur la cloche de notification. | Un menu déroulant/panneau s'ouvre affichant la liste des notifications avec le titre, le message, l'horodatage et le statut lu/non lu. | | FR-CON-02 |
| TC-NOT-004 | Notifications | Marquer une notification unique comme lue | L'utilisateur a des notifications non lues | 1. Cliquer sur la cloche de notification. 2. Cliquer sur une notification non lue. | La notification est marquée comme lue. Le compteur de non-lus diminue de 1. | | FR-CON-02 |
| TC-NOT-005 | Notifications | Marquer toutes les notifications comme lues | L'utilisateur a plusieurs notifications non lues | 1. Cliquer sur la cloche de notification. 2. Cliquer sur « Tout Marquer comme Lu ». | Toutes les notifications sont marquées comme lues. Le badge du compteur de non-lus affiche 0 ou disparaît. | | FR-CON-02 |
| TC-NOT-006 | Notifications | Notification automatique lors d'une demande d'approbation | L'utilisateur soumet un emprunteur pour approbation | 1. Se connecter en tant que Prêteur. 2. Soumettre un nouvel emprunteur. 3. Se déconnecter. 4. Se connecter en tant qu'Admin. 5. Vérifier les notifications. | L'admin a une notification concernant la demande d'approbation en attente. | | FR-CON-02 |
| TC-NOT-007 | Notifications | Notification automatique lors du résultat d'approbation | L'admin approuve/rejette une demande | 1. L'admin approuve une demande en attente. 2. Se déconnecter. 3. Se connecter en tant que le demandeur. 4. Vérifier les notifications. | Le demandeur a une notification concernant le résultat de l'approbation/du rejet. | | FR-CON-02 |
| TC-NOT-008 | Notifications | Notification automatique lors du dépôt d'un litige | L'utilisateur dépose un litige | 1. Déposer un litige. 2. Se connecter en tant qu'Admin. 3. Vérifier les notifications. | L'admin est notifié du nouveau litige. | | FR-CON-02 |

---

## 22. Module d'Internationalisation (i18n)

| ID-CT | Module | Nom du Cas de Test | Pré-conditions | Étapes de Test | Résultat Attendu | Réussi/Échoué | Référence SRS |
|-------|--------|-------------------|----------------|----------------|------------------|---------------|---------------|
| TC-I18N-001 | i18n | Changer la langue en français | L'utilisateur est connecté | 1. Localiser le sélecteur de langue dans l'en-tête/barre latérale. 2. Cliquer pour passer de l'anglais au français (FR). | Tout le texte de l'interface passe en traductions françaises. Les libellés de la barre latérale, les titres de page, le texte des boutons et les étiquettes de formulaire sont tous en français. | | FR-REG-01 |
| TC-I18N-002 | i18n | Revenir à l'anglais | L'interface est en français | 1. Cliquer sur le sélecteur de langue. 2. Passer à l'anglais (EN). | Tout le texte de l'interface revient en anglais. | | FR-REG-01 |
| TC-I18N-003 | i18n | Libellés de navigation en français dans la barre latérale | La langue est définie sur le français | 1. Observer la navigation de la barre latérale. | Tous les éléments de la barre latérale affichent les libellés en français (ex. : « Tableau de Bord », « Emprunteurs », etc.). | | FR-REG-01 |
| TC-I18N-004 | i18n | Étiquettes de formulaire en français | La langue est définie sur le français | 1. Naviguer vers un formulaire (ex. : Ajouter un Emprunteur). | Les étiquettes des champs du formulaire s'affichent en français. | | FR-REG-01 |
| TC-I18N-005 | i18n | Contenu du tableau de bord en français | La langue est définie sur le français | 1. Naviguer vers le Tableau de Bord. | Les titres et descriptions des cartes statistiques sont en français. | | FR-REG-01 |
| TC-I18N-006 | i18n | Persistance de la langue | L'utilisateur passe en français | 1. Passer en français. 2. Naviguer entre les pages. | La langue française persiste lors de la navigation entre les pages au sein de la session. | | FR-REG-01 |
| TC-I18N-007 | i18n | Changer la langue en portugais | L'utilisateur est connecté | 1. Localiser le sélecteur de langue dans l'en-tête/barre latérale. 2. Cliquer pour passer de l'anglais au portugais (PT). | Tout le texte de l'interface passe en traductions portugaises. Les libellés de la barre latérale, les titres de page, le texte des boutons et les étiquettes de formulaire sont tous en portugais. | | FR-REG-01 |

---

## 23. Module de Thème

| ID-CT | Module | Nom du Cas de Test | Pré-conditions | Étapes de Test | Résultat Attendu | Réussi/Échoué | Référence SRS |
|-------|--------|-------------------|----------------|----------------|------------------|---------------|---------------|
| TC-THM-001 | Thème | Basculer en mode sombre | L'utilisateur est connecté, le mode clair est actif | 1. Localiser le bouton de basculement de thème. 2. Cliquer pour passer en mode sombre. | L'application passe au thème sombre. Les couleurs de fond s'assombrissent. Les couleurs de texte s'ajustent pour la lisibilité. Tous les composants (cartes, tableaux, formulaires, barre latérale) s'adaptent. | | NFR-SEC-01 |
| TC-THM-002 | Thème | Revenir au mode clair | Le mode sombre est actif | 1. Cliquer sur le basculement de thème. 2. Revenir au mode clair. | L'application revient au thème clair. Toutes les couleurs et le style reviennent aux valeurs par défaut du mode clair. | | NFR-SEC-01 |
| TC-THM-003 | Thème | Barre latérale en mode sombre | Le mode sombre est actif | 1. Observer la barre latérale en mode sombre. | Les couleurs de la barre latérale s'adaptent correctement. Le texte est lisible. Les icônes sont visibles. L'élément actif est distinguable. | | NFR-SEC-01 |
| TC-THM-004 | Thème | Formulaires et champs de saisie en mode sombre | Le mode sombre est actif | 1. Naviguer vers un formulaire. | Les champs de saisie, étiquettes, bordures et arrière-plans s'adaptent tous au mode sombre. Le texte est lisible. | | NFR-SEC-01 |
| TC-THM-005 | Thème | Tableaux en mode sombre | Le mode sombre est actif | 1. Naviguer vers une page avec un tableau de données. | Les en-têtes de tableau, les lignes, les bordures et le texte s'adaptent tous au mode sombre. Les couleurs alternées des lignes (le cas échéant) sont ajustées. | | NFR-SEC-01 |
| TC-THM-006 | Thème | Cartes statistiques en mode sombre | Le mode sombre est actif | 1. Naviguer vers le Tableau de Bord. | Les cartes statistiques s'adaptent au mode sombre avec un contraste approprié. | | NFR-SEC-01 |
| TC-THM-007 | Thème | Persistance du thème | L'utilisateur bascule le thème | 1. Passer en mode sombre. 2. Naviguer entre les pages. | La sélection du thème persiste lors de la navigation entre les pages. | | NFR-SEC-01 |

---

## 24. Approbation Finale

### 24.1 Résumé des Tests UAT

| Métrique | Nombre |
|----------|--------|
| Total des Cas de Test | 187 |
| Réussis | |
| Échoués | |
| Bloqués | |
| Non Exécutés | |

### 24.2 Approbation Finale UAT

| Rôle | Nom | Signature | Date | Commentaires |
|------|-----|-----------|------|--------------|
| Responsable UAT | | | | |
| Analyste Métier | | | | |
| Chef de Projet | | | | |
| Responsable QA | | | | |
| Représentant du Client | | | | |
| Représentant de Systems In Motion | | | | |

### 24.3 Résumé des Défauts

| ID Défaut | Cas de Test | Sévérité | Description | Statut | Résolution |
|-----------|-------------|----------|-------------|--------|------------|
| | | | | | |
| | | | | | |
| | | | | | |

### 24.4 Approbation de l'Environnement de Test

| Élément | Statut | Notes |
|---------|--------|-------|
| Données de Test Alimentées | | |
| Tous les Comptes Utilisateurs Actifs | | |
| Connectivité à la Base de Données Vérifiée | | |
| Application Accessible | | |
| Compatibilité Navigateur Confirmée | | |

---

## 25. Amélioration Entreprise : Module MFA (ENT-01)

| ID-CT | Module | Nom du Cas de Test | Pré-conditions | Étapes de Test | Résultat Attendu | Réussi/Échoué | Référence SRS |
|-------|--------|-------------------|----------------|----------------|------------------|---------------|---------------|
| TC-ENT-001 | MFA | Configuration MFA - générer un secret TOTP | L'utilisateur est connecté | 1. Naviguer vers le profil utilisateur ou la configuration MFA. 2. Cliquer sur « Activer MFA » ou équivalent. | Secret TOTP généré. URI `otpauth://` retournée pour l'affichage du code QR. La boîte de dialogue de configuration affiche l'URI/QR. | | ENT-01 |
| TC-ENT-002 | MFA | Vérification MFA - activer MFA avec un code valide | Configuration MFA terminée (TC-ENT-001) | 1. Saisir un code TOTP valide à 6 chiffres depuis l'application d'authentification. 2. Cliquer sur « Vérifier ». | MFA activé pour l'utilisateur. `mfaEnabled` = true. Message de succès affiché. | | ENT-01 |
| TC-ENT-003 | MFA | Connexion MFA - code requis après le mot de passe | L'utilisateur a MFA activé | 1. Naviguer vers la page de connexion. 2. Saisir le nom d'utilisateur et le mot de passe. 3. Cliquer sur « Connexion ». | La connexion retourne `requireMfa: true`. Le champ de saisie du code TOTP apparaît. | | ENT-01 |
| TC-ENT-004 | MFA | Connexion MFA - compléter avec un code valide | L'invite de code MFA est affichée (TC-ENT-003) | 1. Saisir un code TOTP valide à 6 chiffres. 2. Cliquer sur « Vérifier ». | L'authentification est terminée. L'utilisateur est redirigé vers le Tableau de Bord. La session est établie. | | ENT-01 |
| TC-ENT-005 | MFA | Désactiver MFA | L'utilisateur a MFA activé, est connecté | 1. Naviguer vers les paramètres MFA. 2. Cliquer sur « Désactiver MFA ». | MFA désactivé. `mfaEnabled` = false. `mfaSecret` effacé. | | ENT-01 |

---

## 26. Amélioration Entreprise : Module de Correspondance Floue d'Entités (ENT-02)

| ID-CT | Module | Nom du Cas de Test | Pré-conditions | Étapes de Test | Résultat Attendu | Réussi/Échoué | Référence SRS |
|-------|--------|-------------------|----------------|----------------|------------------|---------------|---------------|
| TC-ENT-006 | Correspondance Floue | Avertissement de doublon lors de l'enregistrement | L'utilisateur est connecté, l'emprunteur existant « Abebe Bekele » existe | 1. Naviguer vers Emprunteurs. 2. Cliquer sur « Enregistrer un Emprunteur ». 3. Saisir le prénom « Abebe » et le nom « Bekele ». | Une bannière d'avertissement apparaît montrant les emprunteurs potentiellement en doublon avec les scores de similarité. | | ENT-02 |
| TC-ENT-007 | Correspondance Floue | Point de terminaison API de correspondance floue | Des emprunteurs existent dans la base de données | 1. Appeler `GET /api/borrowers/fuzzy-match?name=Abebe`. | Retourne la liste des emprunteurs correspondants avec des scores de similarité trigramme ≥ 0.3. | | ENT-02 |

---

## 27. Amélioration Entreprise : Module de Chatbot de Litiges (ENT-03)

| ID-CT | Module | Nom du Cas de Test | Pré-conditions | Étapes de Test | Résultat Attendu | Réussi/Échoué | Référence SRS |
|-------|--------|-------------------|----------------|----------------|------------------|---------------|---------------|
| TC-ENT-008 | Chatbot | Démarrer le flux guidé du chatbot | L'utilisateur est connecté, sur la page Assistance | 1. Naviguer vers l'Assistance. 2. Localiser et ouvrir le chatbot de litiges. | L'interface du chatbot apparaît avec une invite initiale demandant le type de litige. | | ENT-03 |
| TC-ENT-009 | Chatbot | Compléter le dépôt de litige via le chatbot | Chatbot ouvert (TC-ENT-008) | 1. Sélectionner le type de problème. 2. Rechercher et sélectionner l'emprunteur. 3. Optionnellement sélectionner le compte de crédit. 4. Saisir la description. 5. Confirmer la soumission. | Le litige est automatiquement déposé via l'API. Message de succès affiché. Le litige apparaît dans la liste des litiges. | | ENT-03 |
| TC-ENT-010 | Chatbot | Annuler le flux du chatbot | Chatbot en cours | 1. Cliquer sur annuler/fermer à n'importe quelle étape. | Le chatbot se réinitialise. Le message « Annulé » est affiché. L'utilisateur peut démarrer un nouveau flux. | | ENT-03 |

---

## 28. Amélioration Entreprise : Module OAuth 2.1 (ENT-04)

| ID-CT | Module | Nom du Cas de Test | Pré-conditions | Étapes de Test | Résultat Attendu | Réussi/Échoué | Référence SRS |
|-------|--------|-------------------|----------------|----------------|------------------|---------------|---------------|
| TC-ENT-011 | OAuth 2.1 | Échange de jetons - identifiants valides | Une clé API active existe | 1. Envoyer `POST /api/external/oauth/token` avec `{ grant_type: "client_credentials", client_id: "<préfixe>", client_secret: "<clé_complète>" }`. | Retourne `{ access_token: "<jwt>", token_type: "Bearer", expires_in: 3600 }`. | | ENT-04 |
| TC-ENT-012 | OAuth 2.1 | Authentification par jeton Bearer | Jeton Bearer valide obtenu (TC-ENT-011) | 1. Envoyer `GET /api/external/v1/borrowers/search?name=test` avec l'en-tête `Authorization: Bearer <jeton>`. | La requête est authentifiée. Les résultats de recherche d'emprunteurs sont retournés. | | ENT-04 |
| TC-ENT-013 | OAuth 2.1 | Section OAuth dans la documentation API | L'utilisateur est connecté | 1. Naviguer vers la page Documentation API. | La section OAuth 2.1 est visible avec un exemple d'échange de jetons et les instructions d'utilisation du jeton Bearer. L'élément avec `data-testid="text-oauth-example"` est présent. | | ENT-04 |

---

## 29. Amélioration Entreprise : Module d'Optimisations pour Faible Bande Passante (ENT-05)

| ID-CT | Module | Nom du Cas de Test | Pré-conditions | Étapes de Test | Résultat Attendu | Réussi/Échoué | Référence SRS |
|-------|--------|-------------------|----------------|----------------|------------------|---------------|---------------|
| TC-ENT-014 | Performance | Compression Gzip active | L'application est en cours d'exécution | 1. Envoyer n'importe quelle requête API. 2. Vérifier les en-têtes de réponse. | L'en-tête `Content-Encoding: gzip` est présent dans les réponses. Le corps de la réponse est compressé. | | ENT-05 |
| TC-ENT-015 | Performance | Les routes chargées paresseusement s'affichent correctement | L'utilisateur est connecté | 1. Naviguer vers diverses pages (Emprunteurs, Comptes de Crédit, Litiges, etc.). | Les pages se chargent avec un bref indicateur de chargement (fallback Suspense). Le contenu s'affiche correctement après le chargement. Pas d'erreurs. | | ENT-05 |

---

## 30. Amélioration Entreprise : Module de Téléchargement XBRL (ENT-06)

| ID-CT | Module | Nom du Cas de Test | Pré-conditions | Étapes de Test | Résultat Attendu | Réussi/Échoué | Référence SRS |
|-------|--------|-------------------|----------------|----------------|------------------|---------------|---------------|
| TC-ENT-016 | Téléchargement XBRL | Onglet XBRL visible sur le téléchargement par lots | Admin/Prêteur connecté | 1. Naviguer vers la page Téléchargement par Lots. | Deux onglets visibles : « JSON/CSV » (`data-testid="tab-json"`) et « XBRL » (`data-testid="tab-xbrl"`). | | ENT-06 |
| TC-ENT-017 | Téléchargement XBRL | Format d'exemple XBRL affiché | Admin/Prêteur sur la page Téléchargement par Lots | 1. Cliquer sur l'onglet « XBRL ». | Le format d'exemple XML XBRL est affiché (`data-testid="text-xbrl-sample"`). La zone de téléchargement pour les fichiers .xbrl/.xml est affichée. | | ENT-06 |

---

## 31. Amélioration Entreprise : Module de Journaux d'Audit Inviolables (ENT-07)

| ID-CT | Module | Nom du Cas de Test | Pré-conditions | Étapes de Test | Résultat Attendu | Réussi/Échoué | Référence SRS |
|-------|--------|-------------------|----------------|----------------|------------------|---------------|---------------|
| TC-ENT-018 | Intégrité de l'Audit | Badge d'intégrité affiché | Admin/Régulateur connecté, des journaux d'audit existent | 1. Naviguer vers la page Piste d'Audit. | Le badge de statut d'intégrité est visible (`data-testid="badge-integrity-status"`). Affiche le statut « Valide » ou « Rompu ». | | ENT-07 |
| TC-ENT-019 | Intégrité de l'Audit | Bouton de vérification d'intégrité | Admin/Régulateur sur la page Piste d'Audit | 1. Cliquer sur le bouton « Vérifier l'Intégrité » (`data-testid="button-verify-integrity"`). | La vérification de la chaîne de hachage s'exécute. Le badge se met à jour pour afficher le résultat. L'appel API à `GET /api/audit/verify-integrity` retourne `{ valid: true/false, totalEntries, checkedEntries }`. | | ENT-07 |
| TC-ENT-020 | Intégrité de l'Audit | Intégrité de la chaîne de hachage valide | Les journaux d'audit n'ont pas été altérés | 1. Cliquer sur « Vérifier l'Intégrité ». | Le badge affiche le statut vert « Valide ». `valid: true` dans la réponse. Toutes les entrées passent la vérification de la chaîne de hachage. | | ENT-07 |

---

## 32. Module de Gestion des Taux de Change

| ID-CT | Module | Nom du Cas de Test | Pré-conditions | Étapes de Test | Résultat Attendu | Réussi/Échoué | Référence SRS |
|-------|--------|-------------------|----------------|----------------|------------------|---------------|---------------|
| TC-EXR-001 | Taux de Change | Consulter les taux de change | Utilisateur Admin connecté | 1. Naviguer vers `/exchange-rates`. | Le tableau des taux de change s'affiche avec les paires de taux prédéfinies. | | FR-CR-02 |
| TC-EXR-002 | Taux de Change | Ajouter un taux de change | Utilisateur Admin connecté | 1. Cliquer sur « Ajouter un Taux ». 2. Remplir le taux USD/ETB 57.5. 3. Soumettre. | Le nouveau taux apparaît dans le tableau, notification de succès affichée. | | FR-CR-02 |
| TC-EXR-003 | Taux de Change | Convertisseur de devises | Utilisateur Admin connecté | 1. Saisir le montant 100. 2. Sélectionner USD vers ETB. 3. Cliquer sur Convertir. | Le montant converti s'affiche correctement. | | FR-CR-02 |
| TC-EXR-004 | Taux de Change | Modifier un taux de change | Utilisateur Admin connecté, un taux existe | 1. Cliquer sur modifier sur un taux existant. 2. Changer la valeur du taux. 3. Enregistrer. | Le taux est mis à jour, notification de succès affichée. | | FR-CR-02 |
| TC-EXR-005 | Taux de Change | Supprimer un taux de change | Utilisateur Admin connecté, un taux existe | 1. Cliquer sur supprimer sur un taux. 2. Confirmer la suppression. | Le taux est supprimé du tableau. | | FR-CR-02 |

---

## 33. Module d'Administration des API

| ID-CT | Module | Nom du Cas de Test | Pré-conditions | Étapes de Test | Résultat Attendu | Réussi/Échoué | Référence SRS |
|-------|--------|-------------------|----------------|----------------|------------------|---------------|---------------|
| TC-API-ADM-001 | Administration API | Consulter les configurations API | Utilisateur Admin connecté | 1. Naviguer vers `/api-admin`. | Les cartes de configuration API s'affichent avec les données prédéfinies. | | FR-API-01 |
| TC-API-ADM-002 | Administration API | Filtrer par catégorie | Utilisateur Admin connecté | 1. Cliquer sur le filtre de catégorie « Météo ». | Seules les configurations API météo sont affichées. | | FR-API-01 |
| TC-API-ADM-003 | Administration API | Tester la connexion | Utilisateur Admin connecté | 1. Cliquer sur « Tester la Connexion » sur une configuration. | La notification du résultat du test s'affiche (accessible/inaccessible). | | FR-API-01 |
| TC-API-ADM-004 | Administration API | Ajouter une configuration API | Utilisateur Admin connecté | 1. Cliquer sur « Ajouter ». 2. Remplir le nom, l'URL, le type d'authentification. 3. Soumettre. | La nouvelle configuration apparaît, notification de succès. | | FR-API-01 |

---

## 34. Module de Politiques de Rétention des Données

| ID-CT | Module | Nom du Cas de Test | Pré-conditions | Étapes de Test | Résultat Attendu | Réussi/Échoué | Référence SRS |
|-------|--------|-------------------|----------------|----------------|------------------|---------------|---------------|
| TC-RET-001 | Politiques de Rétention | Consulter les politiques de rétention | Utilisateur Admin connecté | 1. Naviguer vers `/retention-policies`. | Le tableau des politiques s'affiche avec les politiques prédéfinies. | | FR-RET-01 |
| TC-RET-002 | Politiques de Rétention | Cartes récapitulatives | Utilisateur Admin connecté | 1. Consulter les cartes récapitulatives sur la page de rétention. | Le total des politiques, les pays couverts et la rétention moyenne sont affichés. | | FR-RET-01 |
| TC-RET-003 | Politiques de Rétention | Exécuter l'application des règles | Utilisateur Admin connecté | 1. Cliquer sur le bouton « Exécuter l'Application ». | L'application des règles se termine, notification de succès avec le nombre d'enregistrements. | | FR-RET-01 |
| TC-RET-004 | Politiques de Rétention | Ajouter une politique de rétention | Utilisateur Admin connecté | 1. Cliquer sur « Ajouter une Politique ». 2. Remplir Ghana/emprunteur/10 ans. 3. Soumettre. | La nouvelle politique apparaît dans le tableau. | | FR-RET-01 |
| TC-RET-005 | Politiques de Rétention | Modifier une politique de rétention | Utilisateur Admin connecté, une politique existe | 1. Cliquer sur modifier sur une politique. 2. Changer les années. 3. Enregistrer. | La politique est mise à jour, notification de succès. | | FR-RET-01 |

---

## 35. Module de Recherche Globale

| ID-CT | Module | Nom du Cas de Test | Pré-conditions | Étapes de Test | Résultat Attendu | Réussi/Échoué | Référence SRS |
|-------|--------|-------------------|----------------|----------------|------------------|---------------|---------------|
| TC-GS-001 | Recherche Globale | Recherche inter-entités | L'utilisateur est connecté | 1. Naviguer vers `/search`. 2. Saisir un terme de recherche dans le champ de recherche. 3. Soumettre la recherche. | Les résultats s'affichent dans trois catégories : emprunteurs, institutions et comptes de crédit. Les enregistrements correspondants sont affichés avec les détails pertinents. | | FR-COL-08 |
| TC-GS-002 | Recherche Globale | Filtre par pays | L'utilisateur est connecté | 1. Naviguer vers `/search`. 2. Saisir un terme de recherche. 3. Sélectionner un pays dans le menu déroulant de filtre par pays. 4. Soumettre la recherche. | Les résultats sont filtrés pour n'afficher que les enregistrements du pays sélectionné. | | FR-COL-08 |

---

## 36. Module de Photos d'Identité et Téléversement de Documents

| ID-CT | Module | Nom du Cas de Test | Pré-conditions | Étapes de Test | Résultat Attendu | Réussi/Échoué | Référence SRS |
|-------|--------|-------------------|----------------|----------------|------------------|---------------|---------------|
| TC-PHOTO-001 | Photos d'Identité | Téléverser une photo d'emprunteur | L'utilisateur est connecté, un emprunteur existe | 1. Naviguer vers la page de détails de l'emprunteur. 2. Cliquer sur la zone de téléversement de photo / l'icône de caméra sur l'avatar de l'emprunteur. 3. Sélectionner un fichier image (moins de 5 Mo). 4. Téléverser. | La photo est téléversée avec succès. L'avatar de l'emprunteur est mis à jour pour afficher la photo téléversée. Une entrée de journal d'audit est créée pour UPLOAD_PHOTO. | | FR-COL-07 |
| TC-PHOTO-002 | Photos d'Identité | Téléverser un document d'identité | L'utilisateur est connecté, un emprunteur existe | 1. Naviguer vers la page de détails de l'emprunteur. 2. Localiser la section Document d'Identité. 3. Cliquer sur le bouton de téléversement. 4. Sélectionner un fichier image ou PDF (moins de 10 Mo). 5. Téléverser. | Le document d'identité est téléversé avec succès. L'aperçu/lien du document est affiché sur la page de détails de l'emprunteur. Une entrée de journal d'audit est créée pour UPLOAD_ID_DOCUMENT. | | FR-COL-07 |
| TC-PHOTO-003 | Photos d'Identité | Affichage de l'avatar DiceBear | L'utilisateur est connecté, un emprunteur existe sans photo téléversée | 1. Naviguer vers la page de détails de l'emprunteur pour un emprunteur sans photo téléversée. | Un avatar DiceBear auto-généré est affiché comme photo de profil de l'emprunteur. | | FR-COL-07 |

---

## 37. Module d'Environnement de Démonstration

| ID-CT | Module | Nom du Cas de Test | Pré-conditions | Étapes de Test | Résultat Attendu | Réussi/Échoué | Référence SRS |
|-------|--------|-------------------|----------------|----------------|------------------|---------------|---------------|
| TC-DEMO-001 | Environnement de Démonstration | Connexion démo depuis la page de connexion | L'application est accessible | 1. Naviguer vers la page de connexion. 2. Cliquer sur le bouton « Essayer la Démo Interactive ». 3. Sélectionner une carte de rôle (Admin, Régulateur ou Agent Bancaire). | L'utilisateur est connecté avec le rôle de démonstration sélectionné. La bannière ambre ENVIRONNEMENT DE DÉMONSTRATION est visible en haut de l'application. | | ENT-13 |
| TC-DEMO-002 | Environnement de Démonstration | Visibilité de la bannière de démonstration | L'utilisateur est connecté via la démo | 1. Se connecter via l'environnement de démonstration. 2. Naviguer entre les pages. | La bannière ambre ENVIRONNEMENT DE DÉMONSTRATION reste visible sur toutes les pages. L'avertissement de données fictives est affiché. | | ENT-13 |

---

## 38. Module de Sélecteur de Langue sur la Page de Connexion

| ID-CT | Module | Nom du Cas de Test | Pré-conditions | Étapes de Test | Résultat Attendu | Réussi/Échoué | Référence SRS |
|-------|--------|-------------------|----------------|----------------|------------------|---------------|---------------|
| TC-LANG-001 | Langue de Connexion | Sélecteur de langue visible sur la page de connexion | Aucune | 1. Naviguer vers `/auth`. | Le menu déroulant de langue est visible dans le coin supérieur droit. | | FR-REG-01 |
| TC-LANG-002 | Langue de Connexion | Passer en français sur la page de connexion | Aucune | 1. Sélectionner FR dans le sélecteur de langue sur la page de connexion. | Les libellés de connexion passent en français. | | FR-REG-01 |
| TC-LANG-003 | Langue de Connexion | Passer en portugais sur la page de connexion | Aucune | 1. Sélectionner PT dans le sélecteur de langue sur la page de connexion. | Les libellés de connexion passent en portugais. | | FR-REG-01 |
| TC-LANG-004 | Langue de Connexion | La langue persiste après la connexion | Aucune | 1. Sélectionner FR dans le sélecteur de langue. 2. Se connecter en tant qu'admin. | Le Tableau de Bord s'affiche en français après la connexion. | | FR-REG-01 |

---

**Fin du Document**

*Ce document de test UAT couvre tous les modules du Système de Hub Central de Données Inter-Juridictionnel & Registre de Crédit v1.2, y compris les 13 améliorations entreprise (ENT-01 à ENT-13). Chaque cas de test est conçu pour valider les exigences fonctionnelles et non fonctionnelles telles que définies dans la Spécification des Exigences Logicielles (SRS).*

*Préparé par : Systems In Motion Limited*  
*Classification : Confidentiel*
