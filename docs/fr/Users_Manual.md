# Système de Registre de Crédit — Manuel de l'Utilisateur v1.1

**Hub Central de Données Inter-Juridictionnel & Système de Registre de Crédit**

**Préparé pour :** Systems In Motion Limited

**Version :** 1.2

**Date :** Mars 2026

---

## Table des Matières

1. [Introduction](#1-introduction)
2. [Premiers Pas](#2-premiers-pas)
3. [Tableau de Bord](#3-tableau-de-bord)
4. [Gestion des Emprunteurs](#4-gestion-des-emprunteurs)
5. [Comptes de Crédit](#5-comptes-de-crédit)
6. [Recherche de Crédit & Rapports](#6-recherche-de-crédit--rapports)
7. [Flux Maker-Checker](#7-flux-maker-checker)
8. [Gestion des Litiges](#8-gestion-des-litiges)
9. [Jugements Judiciaires](#9-jugements-judiciaires)
10. [Gestion du Consentement](#10-gestion-du-consentement)
11. [Gestion des Institutions](#11-gestion-des-institutions)
12. [Facturation](#12-facturation)
13. [Service d'Assistance](#13-service-dassistance)
14. [Téléversement par Lots](#14-téléversement-par-lots)
15. [Piste d'Audit](#15-piste-daudit)
16. [Gestion des Utilisateurs](#16-gestion-des-utilisateurs)
17. [Clés API](#17-clés-api)
18. [Rapports & Exportation](#18-rapports--exportation)
19. [Notifications](#19-notifications)
20. [FAQ / « Comment faire... ? »](#20-faq--comment-faire-)
21. [Authentification Multi-Facteurs (MFA)](#21-authentification-multi-facteurs-mfa)
22. [Chatbot de Litiges](#22-chatbot-de-litiges)
23. [Téléversement XBRL](#23-téléversement-xbrl)
24. [Vérification de l'Intégrité du Journal d'Audit](#24-vérification-de-lintégrité-du-journal-daudit)
25. [Gestion des Taux de Change](#25-gestion-des-taux-de-change)
26. [Administration des API](#26-administration-des-api)
27. [Politiques de Rétention des Données](#27-politiques-de-rétention-des-données)
28. [Annexe A : Identifiants de Démonstration](#annexe-a-identifiants-de-démonstration)
29. [Annexe B : Matrice d'Accès par Rôle](#annexe-b-matrice-daccès-par-rôle)
30. [Annexe C : Devises Prises en Charge](#annexe-c-devises-prises-en-charge)
31. [Annexe D : Glossaire des Termes](#annexe-d-glossaire-des-termes)

---

## 1. Introduction

### 1.1 Objectif du Système

Le Système de Registre de Crédit est une application web développée par Systems In Motion Limited pour la gestion des informations de crédit, des dossiers d'emprunteurs et de l'évaluation du risque de crédit à travers les banques commerciales, les institutions de microfinance et les autres prestataires de services financiers. Il sert de Hub Central de Données (CDH) Inter-Juridictionnel qui permet la surveillance réglementaire, la gestion du risque de crédit et la protection des consommateurs.

### 1.2 Juridictions Prises en Charge

Le système prend en charge le déploiement dans plusieurs juridictions africaines :

- **Ghana** (GHS — Cedi ghanéen)
- **Éthiopie** (ETB — Birr éthiopien)
- **Ouganda** (UGX — Shilling ougandais)
- **Libéria** (USD — Dollar américain)

### 1.3 Langues Prises en Charge

Le système prend en charge trois langues :

- **Anglais (EN)** — Langue par défaut
- **Français (FR)** — Traduction française complète disponible
- **Portugais (PT)** — Traduction portugaise complète disponible

Les utilisateurs peuvent changer de langue à tout moment en utilisant le sélecteur de langue disponible sur la page de connexion et dans l'en-tête de l'application.

---

## 2. Premiers Pas

### 2.1 Accéder au Système

Ouvrez un navigateur web moderne (Chrome, Firefox, Safari ou Edge) et accédez à l'URL du système fournie par votre administrateur. La page de connexion s'affichera.

### 2.2 Connexion

1. Sur la page de connexion, sélectionnez votre **langue préférée** (EN/FR/PT) à l'aide du sélecteur de langue si désiré.
2. Saisissez votre **Nom d'utilisateur** dans le champ correspondant.
3. Saisissez votre **Mot de passe** dans le champ correspondant.
4. Cliquez sur le bouton **Se Connecter**.
5. Après une authentification réussie, vous serez redirigé vers le Tableau de Bord.

**Notes importantes :**
- Les comptes sont verrouillés pendant **15 minutes** après **3 tentatives de connexion échouées consécutives**.
- Si votre compte est verrouillé, attendez l'expiration de la période de verrouillage avant de réessayer.
- Si votre compte est suspendu ou désactivé, contactez votre administrateur système.

### 2.3 Changement de Mot de Passe Initial

Si votre administrateur a signalé votre compte pour un changement de mot de passe obligatoire (ou si votre mot de passe a plus de 90 jours), vous serez invité à changer votre mot de passe lors de la connexion.

**Exigences du Mot de Passe :**
- Minimum 8 caractères
- Au moins une lettre majuscule (A-Z)
- Au moins une lettre minuscule (a-z)
- Au moins un chiffre (0-9)
- Au moins un caractère spécial (!@#$%^&* etc.)

Pour changer votre mot de passe :
1. Une boîte de dialogue de changement de mot de passe apparaîtra automatiquement si nécessaire.
2. Saisissez votre **Mot de passe actuel**.
3. Saisissez votre **Nouveau mot de passe** conforme aux exigences ci-dessus.
4. Cliquez sur **Changer le mot de passe**.

Vous pouvez également changer votre mot de passe à tout moment en cliquant sur l'option de changement de mot de passe dans la barre latérale.

### 2.4 Changement de Langue (EN/FR/PT)

Pour changer la langue de l'interface :
1. Localisez le bouton de changement de langue dans la barre d'en-tête supérieure ou sur la page de connexion (affiche « EN », « FR » ou « PT »).
2. Cliquez sur le bouton pour basculer entre l'anglais, le français et le portugais.
3. L'ensemble de l'interface se mettra à jour immédiatement dans la langue sélectionnée.

### 2.5 Basculement de Thème (Clair/Sombre)

Le système prend en charge les thèmes clair et sombre :
1. Cliquez sur l'icône de basculement de thème (soleil/lune) dans la barre d'en-tête supérieure.
2. L'interface basculera entre le mode clair et le mode sombre.
3. Votre préférence est enregistrée dans le stockage local de votre navigateur.

### 2.6 Comprendre la Navigation par Barre Latérale

La barre latérale donne accès à tous les modules du système, organisés en trois sections :

**Principal :**
- Tableau de Bord
- Emprunteurs
- Comptes de Crédit
- Recherche de Crédit
- Téléversement par Lots

**Rapports & Conformité :**
- Approbations en Attente
- Litiges
- Piste d'Audit
- Gestion du Consentement
- Facturation
- Service d'Assistance

**Administration :**
- Gestion des Utilisateurs (Admin uniquement)
- Institutions (Admin uniquement)
- Clés API (Admin uniquement)
- Taux de Change (Admin uniquement)
- Administration des API (Admin uniquement)
- Politiques de Rétention (Admin/Régulateur)

La barre latérale peut être réduite en cliquant sur le bouton de basculement de la barre latérale dans l'en-tête. En mode réduit, seules les icônes sont visibles. Sur les appareils mobiles, la barre latérale s'ouvre sous forme de panneau coulissant.

### 2.7 Authentification Multi-Facteurs (MFA)

Le système prend en charge l'authentification multi-facteurs optionnelle basée sur TOTP pour une sécurité renforcée. Lorsque le MFA est activé :
1. Après avoir saisi votre nom d'utilisateur et votre mot de passe, vous serez invité à saisir un code à 6 chiffres.
2. Ouvrez votre application d'authentification (Google Authenticator, Authy, etc.) pour obtenir le code.
3. Saisissez le code et cliquez sur **Vérifier** pour terminer la connexion.

Voir la Section 21 pour les instructions détaillées de configuration du MFA.

### 2.8 Expiration de Session (Déconnexion Automatique après 15 Minutes)

Pour la conformité en matière de sécurité (NFR-SEC-09), le système vous déconnecte automatiquement après **15 minutes d'inactivité**. Lorsqu'une session expire :
- Vous serez redirigé vers la page de connexion.
- Tout travail non enregistré sera perdu.
- Une durée maximale de session de **8 heures** s'applique indépendamment de l'activité.

---

## 3. Tableau de Bord

Le Tableau de Bord fournit une vue d'ensemble rapide des métriques clés et de l'activité récente du Système de Registre de Crédit.

### 3.1 Comprendre les 8 Cartes de Statistiques

Le Tableau de Bord affiche 8 cartes de statistiques interactives :

| Carte | Description |
|-------|-------------|
| **Total des Emprunteurs** | Nombre total de dossiers d'emprunteurs enregistrés (individuels et corporatifs) |
| **Comptes de Crédit** | Nombre total de comptes de crédit/prêts dans le système |
| **Encours** | Solde total en cours sur tous les comptes actifs |
| **Impayés** | Nombre de comptes avec des paiements en retard |
| **Défauts** | Nombre de comptes non performants / en défaut |
| **Consultations** | Nombre total de consultations/recherches de crédit effectuées |
| **Approbations en Attente** | Nombre de demandes d'approbation maker-checker en attente |
| **Litiges Ouverts** | Nombre de dossiers de litiges actuellement ouverts |

### 3.2 Cliquer sur les Cartes pour les Fiches de Détail

Chaque carte de statistiques est cliquable. Cliquer sur une carte ouvre une fiche de détail affichant les enregistrements sous-jacents pour cette métrique :

1. Cliquez sur n'importe quelle carte de statistiques (ex. « Impayés »).
2. Un panneau coulissant apparaîtra montrant une liste des enregistrements concernés.
3. Cliquez sur des éléments individuels dans la liste pour naviguer vers la page d'enregistrement détaillée.
4. Fermez la fiche de détail en cliquant sur le bouton de fermeture ou en cliquant à l'extérieur du panneau.

### 3.3 Section d'Activité Récente

Sous les cartes de statistiques, le Tableau de Bord affiche l'activité récente du système, y compris :
- Les dossiers d'emprunteurs récemment créés
- Les nouveaux comptes de crédit
- Les actions d'approbation récentes
- Les dépôts et résolutions de litiges

---

## 4. Gestion des Emprunteurs

Le module de Gestion des Emprunteurs vous permet d'enregistrer, rechercher et gérer les profils d'emprunteurs.

### 4.1 Recherche d'Emprunteurs (Nom/ID)

1. Accédez à **Emprunteurs** depuis la barre latérale.
2. Utilisez la barre de recherche en haut de la page.
3. Saisissez le nom d'un emprunteur, son identifiant national ou d'autres informations d'identification.
4. Les résultats se filtrent automatiquement au fur et à mesure de la saisie.
5. Cliquez sur une carte d'emprunteur pour voir ses détails complets.

### 4.2 Enregistrement d'un Emprunteur Individuel

1. Cliquez sur le bouton **Enregistrer un Emprunteur** (en haut à droite).
2. Sélectionnez le type d'emprunteur : **Individuel**.
3. Remplissez les champs obligatoires :
   - **Prénom** (obligatoire)
   - **Nom** (obligatoire)
   - **Identifiant National** (obligatoire, doit être unique)
   - **Date de Naissance**
   - **Genre** (Masculin/Féminin)
   - **Téléphone**
   - **Email**
   - **Adresse**, **Ville**, **Région**
   - **Nom de l'Employeur**, **Profession**
   - **Secteur**
4. Cochez éventuellement la case **Indicateur PPE** si l'emprunteur est une Personne Politiquement Exposée.
   - Si PPE est coché, fournissez les **Détails PPE** décrivant la nature de l'exposition politique.
5. Sélectionnez le **Niveau d'Éducation** (Aucun, Primaire, Secondaire, Diplôme, Licence, Master, Doctorat).
6. Saisissez le nom de l'**Établissement d'Enseignement**.
7. Saisissez l'**Historique d'Emploi** dans la zone de texte.
8. Cliquez sur **Enregistrer l'Emprunteur** pour soumettre.
9. L'enregistrement sera soumis pour **approbation maker-checker** (voir Section 7).

### 4.3 Enregistrement d'un Emprunteur Corporatif

1. Cliquez sur le bouton **Enregistrer un Emprunteur**.
2. Sélectionnez le type d'emprunteur : **Corporatif**.
3. Remplissez les champs obligatoires :
   - **Nom de l'Entreprise** (obligatoire)
   - **Identifiant National** (obligatoire, doit être unique)
   - **Numéro d'Immatriculation Commerciale**
   - **Téléphone**, **Email**
   - **Adresse**, **Ville**, **Région**
   - **Secteur**
4. Définissez éventuellement l'indicateur PPE et fournissez les détails.
5. Cliquez sur **Enregistrer l'Emprunteur** pour soumettre pour approbation.

### 4.4 Signalement PPE

Un indicateur de Personne Politiquement Exposée (PPE) indique qu'un emprunteur occupe un poste public important ou est étroitement associé à quelqu'un qui en occupe un. Pour signaler un emprunteur comme PPE :

1. Lors de l'enregistrement ou de la modification d'un emprunteur, cochez la case **Indicateur PPE**.
2. Saisissez les détails dans le champ **Détails PPE** expliquant la nature de l'exposition politique.
3. Les emprunteurs signalés PPE affichent un badge PPE rouge sur leur carte de profil.

### 4.5 Consultation des Détails d'un Emprunteur

1. Cliquez sur n'importe quelle carte d'emprunteur dans la liste des emprunteurs.
2. La page de détails de l'emprunteur affiche :
   - Informations personnelles/de l'entreprise
   - Tous les comptes de crédit liés
   - Accès au rapport de crédit
   - Jugements judiciaires
   - Dossiers de consentement
   - Parties liées

### 4.6 Liaison des Parties Liées

Les emprunteurs peuvent être liés à des parties liées avec les types de relations suivants : conjoint, garant, directeur, actionnaire, bénéficiaire_effectif, filiale et société_mère :

1. Sur la page de détails de l'emprunteur, consultez la section **Parties Liées**.
2. Les emprunteurs liés sont affichés avec leur type de relation.
3. Cliquez sur une partie liée pour naviguer vers son profil d'emprunteur.

### 4.7 Comprendre le Maker-Checker (Les Modifications Nécessitent une Approbation)

Toutes les demandes de création et de modification d'emprunteurs passent par un flux maker-checker :

- Lorsque vous soumettez un nouvel emprunteur ou modifiez un existant, une **approbation en attente** est créée.
- Un autre utilisateur autorisé (Admin ou Régulateur) doit examiner et approuver la modification.
- Vous recevrez une notification lorsque votre demande est approuvée ou rejetée.
- Voir la Section 7 pour les détails complets sur le flux maker-checker.

### 4.8 Pagination

La liste des emprunteurs est paginée pour gérer de grands ensembles de données (plus de 100 000 enregistrements) :
- Utilisez les boutons **Précédent** et **Suivant** pour naviguer entre les pages.
- Le numéro de page actuel et le nombre total sont affichés en bas.
- La taille de page par défaut est de 50 enregistrements par page.

---

## 5. Comptes de Crédit

Le module Comptes de Crédit gère les prêts et les facilités de crédit associés aux emprunteurs.

### 5.1 Ajout de Comptes de Crédit

1. Accédez à **Comptes de Crédit** depuis la barre latérale.
2. Cliquez sur le bouton **Ajouter un Compte**.
3. Remplissez les champs obligatoires :
   - **Emprunteur** — Sélectionnez dans la liste déroulante
   - **Institution Prêteuse** — Nom de l'institution prêteuse
   - **Numéro de Compte** — Identifiant unique du compte
   - **Type de Compte** — Sélectionnez parmi : Prêt Personnel, Hypothèque, Prêt Véhicule, Prêt Commercial, Prêt Corporatif, Découvert, Carte de Crédit, Microfinance
   - **Montant Initial** — Montant initial du prêt/de la facilité
   - **Solde Actuel** — Solde impayé actuel
   - **Devise** — Sélectionnez parmi 18 devises prises en charge
   - **Taux d'Intérêt** — Pourcentage du taux d'intérêt annuel
   - **Statut** — En cours, Impayé, Défaut, Fermé, Restructuré
   - **Date de Décaissement** — Date de décaissement du prêt
   - **Date d'Échéance** — Date d'échéance du prêt
   - **Type de Garantie** — Type de garantie (ex. Propriété, Véhicule, Espèces)
   - **Valeur de la Garantie** — Valeur de la garantie
4. Champs supplémentaires :
   - **Sans Intérêt** — Cochez si c'est une facilité conforme à la Charia ou sans intérêt
   - **Période de Grâce (Mois)** — Nombre de mois de période de grâce
   - **Nombre de Restructurations** — Nombre de fois où le compte a été restructuré
5. Cliquez sur **Créer le Compte** pour soumettre pour approbation maker-checker.

### 5.2 Comprendre les Statuts des Comptes

| Statut | Description |
|--------|-------------|
| **En cours** | Le compte fonctionne normalement ; tous les paiements sont à jour |
| **Impayé** | Le compte a des paiements en retard mais n'est pas encore en défaut |
| **Défaut** | Le compte a été classé comme non performant |
| **Fermé** | Le compte a été entièrement remboursé ou fermé |
| **Restructuré** | Les conditions du prêt ont été modifiées/restructurées |
| **Passé en perte** | Le compte a été passé en perte |

### 5.3 Support Multi-Devises

Le système prend en charge 18 devises sur les marchés africains et internationaux. Lors de la création ou de la consultation de comptes de crédit :
- Sélectionnez la devise appropriée dans la liste déroulante.
- Les montants sont affichés avec le formatage approprié pour la devise sélectionnée.
- Voir l'Annexe C pour la liste complète des devises prises en charge.

### 5.4 Consultation de l'Historique des Paiements (Grille à 12 Périodes)

Chaque compte de crédit dispose d'un historique de paiements associé montrant une grille de performance à 12 périodes :

1. Accédez à la page de détails d'un emprunteur.
2. Cliquez sur un compte de crédit pour voir ses détails.
3. La grille d'historique de paiements affiche :
   - **Période** — Mois/Année
   - **Montant Dû** — Montant de paiement prévu
   - **Montant Payé** — Paiement effectivement reçu
   - **Statut** — À temps, En retard, Manqué ou Partiel
   - **Jours de Retard** — Nombre de jours de retard du paiement (le cas échéant)

---

## 6. Recherche de Crédit & Rapports

### 6.1 Recherche d'un Emprunteur Unique

1. Accédez à **Recherche de Crédit** depuis la barre latérale.
2. Saisissez l'**Identifiant National** ou le **Nom** d'un emprunteur dans le champ de recherche.
3. Sélectionnez le **Motif** de la consultation :
   - Nouveau Crédit
   - Révision
   - Recouvrement
   - Réglementaire
   - Suivi de Portefeuille
4. Confirmez que le **Consentement** a été fourni.
5. Cliquez sur **Rechercher** pour effectuer la vérification de référence de crédit.
6. Les résultats affichent le résumé de crédit de l'emprunteur, y compris les comptes actifs, le score de crédit et l'historique des consultations.

### 6.2 Recherche de Crédit en Masse (Identifiants Multiples)

1. Accédez à **Recherche de Crédit**.
2. Sélectionnez l'option **Recherche en Masse**.
3. Saisissez plusieurs identifiants nationaux (un par ligne ou séparés par des virgules).
4. Sélectionnez le motif de la consultation.
5. Cliquez sur **Soumettre** pour effectuer les vérifications de référence de crédit par lots.
6. Les résultats sont renvoyés pour chaque identifiant, montrant le statut trouvé/non trouvé.

### 6.3 Génération de Rapports de Crédit

1. Depuis la page de détails d'un emprunteur ou les résultats de recherche de crédit, cliquez sur **Générer un Rapport de Crédit**.
2. Sélectionnez le **Motif** du rapport.
3. Le système génère un rapport de crédit complet contenant :
   - Informations personnelles/de l'entreprise de l'emprunteur
   - Score de crédit (plage de 300 à 850)
   - Codes de motif expliquant le score
   - Tous les comptes de crédit avec leur statut et leurs soldes
   - Historique de performance des paiements
   - Consultations de crédit
   - Jugements judiciaires
   - Dossiers de consentement
   - Numéro de série du rapport

### 6.4 Comprendre les Scores de Crédit (300-850)

L'algorithme de notation de crédit attribue un score entre 300 et 850 :

| Plage de Score | Évaluation | Description |
|----------------|------------|-------------|
| 750-850 | Excellent | Très faible risque de crédit |
| 700-749 | Bon | Faible risque de crédit |
| 650-699 | Moyen | Risque de crédit modéré |
| 550-649 | Faible | Risque de crédit élevé |
| 300-549 | Très Faible | Risque de crédit très élevé |

Les facteurs qui affectent le score de crédit incluent :
- Ratio de paiements à temps
- Nombre de comptes impayés
- Comptes passés en perte
- Nombre de consultations récentes
- Jugements judiciaires
- Niveaux d'endettement

### 6.5 Codes de Motif Expliqués

Les rapports de crédit incluent des codes de motif qui expliquent les principaux facteurs affectant le score de crédit d'un emprunteur :

| Code de Motif | Description |
|---------------|-------------|
| DELINQUENT_ACCOUNTS | L'emprunteur a un ou plusieurs comptes impayés |
| WRITTEN_OFF_ACCOUNTS | L'emprunteur a des comptes qui ont été passés en perte |
| RESTRUCTURED_ACCOUNTS | L'emprunteur a des facilités de prêt restructurées |
| HIGH_INQUIRY_VOLUME | Nombre élevé de consultations de crédit récentes |
| HIGH_DEBT_LEVEL | Le niveau d'endettement total est élevé |
| COURT_JUDGMENTS_PRESENT | Des jugements judiciaires actifs existent contre l'emprunteur |
| POLITICALLY_EXPOSED_PERSON | L'emprunteur est signalé comme PPE |
| STRONG_REPAYMENT_HISTORY | Historique de paiement ponctuel constant (positif) |
| EXCELLENT_PAYMENT_RECORD | Dossier de paiement exceptionnel (positif) |
| THIN_FILE_LIMITED_HISTORY | Historique de crédit limité disponible |

### 6.6 Numéros de Série des Rapports

Chaque rapport de crédit généré se voit attribuer un numéro de série unique au format :

```
CR-{ANNEE}-{identifiant_unique}
```

Exemple : `CR-2025-k8f3x2m1`

Ce numéro de série sert de référence pour le rapport et peut être utilisé à des fins d'audit et de suivi.

### 6.7 Impression des Rapports

1. Après avoir généré un rapport de crédit, cliquez sur le bouton **Imprimer**.
2. Le rapport s'ouvre dans un format adapté à l'impression.
3. Utilisez la boîte de dialogue d'impression de votre navigateur pour imprimer ou enregistrer en PDF.
4. Le rapport imprimé inclut toutes les sections, le numéro de série, l'horodatage de génération et un avis de non-responsabilité en pied de page.

---

## 7. Flux Maker-Checker

Le flux maker-checker (principe des quatre yeux) garantit l'intégrité des données en exigeant qu'un second utilisateur autorisé approuve les modifications.

### 7.1 Comment les Modifications sont Soumises

Lorsque vous créez ou modifiez un emprunteur ou un compte de crédit :

1. Votre modification **n'est pas appliquée immédiatement**.
2. Au lieu de cela, une **demande d'approbation en attente** est créée.
3. Vous verrez un message de confirmation : « Soumis pour approbation maker-checker. »
4. Les réviseurs autorisés (rôles Admin et Régulateur) reçoivent une notification.

### 7.2 Examen des Approbations en Attente

1. Accédez à **Approbations en Attente** depuis la barre latérale.
2. La page affiche toutes les demandes d'approbation en attente avec :
   - Type d'entité (emprunteur ou compte de crédit)
   - Action (Création ou Mise à jour)
   - Nom du demandeur
   - Date de soumission
   - Statut actuel
3. Cliquez sur une demande en attente pour examiner les détails.

### 7.3 Approbation/Rejet avec Notes

1. Ouvrez une demande d'approbation en attente.
2. Examinez attentivement les données soumises.
3. Choisissez l'une des actions suivantes :
   - **Approuver** — La modification sera appliquée à la base de données.
   - **Rejeter** — La modification sera annulée.
4. Saisissez éventuellement des **Notes de Révision** expliquant votre décision.
5. Cliquez sur le bouton approprié pour soumettre votre décision.
6. Le demandeur recevra une notification concernant la décision.

### 7.4 Règle de Prévention de l'Auto-Approbation

Le système applique une règle stricte : **vous ne pouvez pas approuver vos propres demandes**. Cela signifie :
- Si vous avez soumis un enregistrement d'emprunteur, un autre Admin ou Régulateur doit l'approuver.
- Tenter d'approuver votre propre demande entraînera un message d'erreur.
- Cela garantit la conformité au véritable principe des quatre yeux.

---

## 8. Gestion des Litiges

Le module de Gestion des Litiges traite les plaintes des emprunteurs et les demandes de correction de données.

### 8.1 Dépôt d'un Litige

1. Accédez à **Litiges** depuis la barre latérale.
2. Cliquez sur le bouton **Déposer un Litige**.
3. Remplissez les champs obligatoires :
   - **Emprunteur** — Sélectionnez l'emprunteur dans la liste déroulante
   - **Compte de Crédit** — Sélectionnez éventuellement le compte spécifique en question
   - **Type de Litige** — Sélectionnez parmi :
     - Erreur de Données
     - Vol d'Identité
     - Consultation Non Autorisée
     - Enregistrement en Double
     - Autre
   - **Description** — Fournissez une description détaillée du problème
   - **Type de Correction** — Sélectionnez :
     - Financière (SLA de 2 jours)
     - Non Financière (SLA de 5 jours)
4. Cliquez sur **Déposer le Litige** pour soumettre.

### 8.2 Suivi des SLA (2 Jours Financier, 5 Jours Non Financier)

Le système calcule et suit automatiquement les délais SLA :

- **Corrections financières** : Doivent être résolues dans les **2 jours ouvrables** (DQ-04)
- **Corrections non financières** : Doivent être résolues dans les **5 jours ouvrables** (DQ-05)

Le délai SLA est affiché dans le tableau des litiges. Si le délai est dépassé et le litige est toujours ouvert, un badge rouge « Dépassé » est affiché.

### 8.3 Résolution des Litiges

1. Dans le tableau des litiges, cliquez sur le bouton **Résoudre** à côté d'un litige ouvert (ou cliquez sur la ligne pour ouvrir la boîte de dialogue de résolution).
2. Sélectionnez le nouveau statut :
   - **En Cours d'Examen** — Investigation en cours
   - **Résolu** — Le problème a été corrigé
   - **Rejeté** — Le litige a été jugé invalide
3. Saisissez les **Notes de Résolution** décrivant le résultat.
4. Cliquez sur **Mettre à Jour le Litige** pour enregistrer.

### 8.4 Consultation de l'Historique des Litiges

Le tableau des litiges affiche tous les litiges avec leur statut actuel, type, délai SLA et date de dépôt. Vous pouvez consulter l'historique complet des litiges, y compris les résolutions et les horodatages.

---

## 9. Jugements Judiciaires

Le module des Jugements Judiciaires suit les procédures judiciaires et les ordonnances du tribunal contre les emprunteurs (FR-COL-05).

### 9.1 Ajout de Jugements Judiciaires

1. Accédez à la page de détails d'un emprunteur.
2. Dans la section **Jugements Judiciaires**, cliquez sur **Ajouter un Jugement**.
3. Remplissez les champs obligatoires :
   - **Numéro de Dossier** — Numéro de référence du dossier judiciaire
   - **Tribunal** — Nom du tribunal
   - **Type de Jugement** — Sélectionnez parmi :
     - Privilège
     - Faillite
     - Procès
     - Jugement Civil
     - Condamnation Pénale
   - **Montant** — Valeur monétaire du jugement (le cas échéant)
   - **Devise** — Devise du montant du jugement
   - **Date du Jugement** — Date à laquelle le jugement a été prononcé
   - **Statut** — Actif, Résolu ou En appel
   - **Description** — Détails supplémentaires sur le jugement
4. Cliquez sur **Soumettre** pour créer l'enregistrement du jugement.

### 9.2 Consultation des Jugements par Emprunteur

Les jugements judiciaires sont affichés sur la page de détails de l'emprunteur et sont inclus dans les rapports de crédit. Chaque jugement affiche :
- Numéro de dossier et nom du tribunal
- Type et statut du jugement
- Montant et devise
- Date du jugement

### 9.3 Types de Jugements

| Type | Description |
|------|-------------|
| **Privilège** | Une revendication légale sur un bien en garantie d'une dette |
| **Faillite** | Déclaration formelle d'incapacité à payer les dettes |
| **Procès** | Une action en justice civile en cours ou conclue |
| **Jugement Civil** | Une ordonnance du tribunal dans une affaire civile (ex. recouvrement de dette) |
| **Condamnation Pénale** | Un verdict pénal pertinent pour les affaires financières |

---

## 10. Gestion du Consentement

Le module de Gestion du Consentement gère le consentement des sujets de données pour le partage des informations de crédit (FR-CON-06/07).

### 10.1 Octroi du Consentement

1. Accédez à **Gestion du Consentement** depuis la barre latérale.
2. Cliquez sur le bouton **Accorder le Consentement**.
3. Remplissez les champs obligatoires :
   - **Emprunteur** — Sélectionnez l'emprunteur accordant le consentement
   - **Accordé à** — Nom de l'institution ou de la partie recevant le consentement
   - **Motif** — Raison du partage de données (ex. évaluation de crédit, examen réglementaire)
   - **Type de Consentement** — Type de consentement (ex. consultation, partage de données, accès complet)
4. Cliquez sur **Accorder le Consentement** pour créer l'enregistrement de consentement.

### 10.2 Numéros de Reçu

Chaque enregistrement de consentement se voit automatiquement attribuer un numéro de reçu unique au format :

```
CR-{horodatage}-{identifiant_aléatoire}
```

Ce numéro de reçu sert de preuve de consentement et peut être fourni à l'emprunteur ou à l'institution demandeuse.

### 10.3 Révocation du Consentement

1. Dans le tableau des enregistrements de consentement, trouvez l'enregistrement de consentement actif.
2. Cliquez sur le bouton **Révoquer**.
3. Le statut du consentement sera modifié en « Révoqué » et l'horodatage de révocation sera enregistré.
4. Une fois révoqué, l'institution ne peut plus accéder aux données de crédit de l'emprunteur dans le cadre de ce consentement.

### 10.4 Consultation des Enregistrements de Consentement

La page de gestion du consentement affiche tous les enregistrements de consentement avec :
- Nom et identifiant de l'emprunteur
- Institution à laquelle le consentement est accordé
- Motif et type de consentement
- Statut (Actif ou Révoqué)
- Numéro de reçu
- Date d'octroi et date de révocation (le cas échéant)

---

## 11. Gestion des Institutions (Admin Uniquement)

Le module de Gestion des Institutions est disponible uniquement pour les utilisateurs ayant le rôle **Admin**.

### 11.1 Enregistrement des Institutions

1. Accédez à **Institutions** depuis la barre latérale.
2. Cliquez sur le bouton **Enregistrer**.
3. Remplissez les champs obligatoires :
   - **Nom** — Nom de l'institution
   - **Type** — Sélectionnez parmi :
     - Banque
     - IMF (Institution de Microfinance)
     - Service Public
     - Télécom
     - Prêteur Numérique
     - SACCO (Coopérative d'Épargne et de Crédit)
   - **Numéro d'Immatriculation** — Numéro d'immatriculation/licence officiel
   - **Pays** — Pays d'exploitation
   - **Email de Contact** — Adresse email principale
   - **Téléphone de Contact** — Numéro de téléphone principal
   - **Adresse** — Adresse physique
   - **Fréquence de Soumission** — Fréquence à laquelle l'institution soumet ses données :
     - Quotidienne
     - Hebdomadaire
     - Mensuelle
4. Cliquez sur **Enregistrer** pour soumettre l'institution pour approbation.

### 11.2 Approbation des Institutions

Les institutions nouvellement enregistrées ont un statut « En attente » et nécessitent l'approbation d'un administrateur :

1. Dans le tableau des institutions, localisez les institutions avec le statut « En attente ».
2. Cliquez sur le bouton **Approuver**.
3. Le statut de l'institution passera à « Active ».
4. Les institutions actives peuvent ensuite se voir attribuer des clés API pour la soumission de données.

### 11.3 Configuration de la Fréquence de Soumission

La fréquence de soumission détermine la fréquence à laquelle une institution est censée soumettre des données de crédit. Elle peut être définie lors de l'enregistrement et est affichée dans les détails de l'institution.

### 11.4 Types d'Institutions

| Type | Description |
|------|-------------|
| **Banque** | Banque commerciale ou de détail |
| **IMF** | Institution de microfinance |
| **Service Public** | Fournisseur de services publics |
| **Télécom** | Entreprise de télécommunications |
| **Prêteur Numérique** | Plateforme de prêt numérique/mobile |
| **SACCO** | Coopérative d'Épargne et de Crédit |

### 11.5 Pagination

La liste des institutions prend en charge la pagination pour les grands ensembles de données :
- Utilisez les boutons **Précédent** et **Suivant** pour naviguer entre les pages.
- 50 enregistrements sont affichés par page.

---

## 12. Facturation (Admin/Régulateur)

Le module de Facturation gère les factures et le suivi des frais pour les institutions fournisseurs de données. Il est accessible aux utilisateurs ayant les rôles **Admin** ou **Régulateur**.

### 12.1 Création de Factures

1. Accédez à **Facturation** depuis la barre latérale.
2. Cliquez sur le bouton **Créer une Facture**.
3. Remplissez les champs obligatoires :
   - **Nom de l'Institution** — Nom de l'institution facturée
   - **Type de Service** — Sélectionnez parmi :
     - Soumission de Données
     - Rapport de Crédit
     - Accès API
     - Abonnement
   - **Montant** — Montant de la facture
   - **Devise** — Devise (ETB, USD, KES, GHS, UGX)
   - **Numéro de Facture** — Numéro de référence unique de la facture
   - **Début de Période** — Date de début de la période de facturation
   - **Fin de Période** — Date de fin de la période de facturation
4. Cliquez sur **Créer la Facture** pour enregistrer.

### 12.2 Suivi du Statut de Paiement

La page de facturation affiche trois cartes récapitulatives :
- **Revenus Totaux** — Somme de tous les montants de factures
- **Montant en Attente** — Somme des factures impayées
- **Montant en Retard** — Somme des factures en retard

Statuts des factures :
| Statut | Description |
|--------|-------------|
| **En attente** | La facture a été émise mais n'est pas encore payée |
| **Payée** | La facture a été payée en totalité |
| **En retard** | La facture est en dépassement de sa date d'échéance et impayée |

### 12.3 Types de Services

| Type de Service | Description |
|----------------|-------------|
| **Soumission de Données** | Frais pour la soumission de données de crédit au registre |
| **Rapport de Crédit** | Frais pour la génération de rapports de crédit |
| **Accès API** | Frais pour l'utilisation de l'API externe |
| **Abonnement** | Frais d'abonnement périodique |

### 12.4 Consultation des Détails de Facture

Cliquez sur n'importe quelle ligne du tableau de facturation pour ouvrir une vue détaillée affichant :
- Numéro de facture et statut
- Nom de l'institution
- Type de service
- Montant et devise
- Dates de la période de facturation
- Date de création

---

## 13. Service d'Assistance

Le Service d'Assistance (Unité de Service aux Demandes) fournit une interface unifiée pour les opérations de service aux consommateurs.

### 13.1 Recherche d'Emprunteurs

1. Accédez au **Service d'Assistance** depuis la barre latérale.
2. Consultez les cartes récapitulatives affichant :
   - Nombre de Demandes Ouvertes
   - Nombre de Dépassements SLA
   - Nombre de Résolutions Aujourd'hui
3. Saisissez le nom ou l'identifiant national d'un emprunteur dans le champ de recherche.
4. Les résultats apparaissent sous forme de cartes cliquables sous le champ de recherche.
5. Cliquez sur une carte d'emprunteur pour le sélectionner et voir ses détails.

### 13.2 Consultation des Informations de l'Emprunteur, des Litiges et du Consentement

Une fois un emprunteur sélectionné, le service d'assistance affiche :
- **Informations de l'Emprunteur** — Identifiant national, téléphone, email, type
- **Litiges** — Tous les litiges associés à l'emprunteur, y compris le type, la description, le statut, le délai SLA et la date de dépôt
- **Enregistrements de Consentement** — Tous les enregistrements de consentement pour l'emprunteur, montrant l'institution bénéficiaire, le motif, le type de consentement, le statut, le numéro de reçu et la date d'octroi

### 13.3 Dépôt de Litiges depuis le Service d'Assistance

1. Avec un emprunteur sélectionné, cliquez sur le bouton **Déposer un Litige**.
2. Le nom de l'emprunteur est pré-rempli.
3. Remplissez :
   - **ID du Compte de Crédit** (optionnel)
   - **Type de Litige** — Solde Incorrect, Statut Erroné, Erreur d'Identité, Consultation Non Autorisée, Autre
   - **Type de Correction** — Financière ou Non Financière
   - **Description** — Description détaillée du problème
4. Cliquez sur **Déposer le Litige** pour soumettre.

### 13.4 Octroi du Consentement depuis le Service d'Assistance

1. Avec un emprunteur sélectionné, cliquez sur le bouton **Accorder le Consentement**.
2. Remplissez :
   - **Accordé à** — Nom de l'institution ou de la partie
   - **Motif** — Raison du partage de données
   - **Type de Consentement** — Type de consentement accordé
3. Cliquez sur **Accorder le Consentement** pour créer l'enregistrement.
4. Un numéro de reçu est automatiquement généré et attribué.

---

## 14. Téléversement par Lots

Le module de Téléversement par Lots permet l'ingestion de données en masse via des fichiers JSON ou CSV.

### 14.1 Préparation des Données JSON

Créez un fichier JSON contenant un tableau d'enregistrements de comptes de crédit. Chaque enregistrement doit inclure :

```json
[
  {
    "borrowerId": "borrower-uuid",
    "lenderInstitution": "Bank Name",
    "accountNumber": "ACC-001",
    "accountType": "Personal Loan",
    "originalAmount": "50000.00",
    "currentBalance": "35000.00",
    "currency": "ETB",
    "interestRate": "12.50",
    "status": "current"
  }
]
```

### 14.2 Préparation des Données CSV

Créez un fichier CSV avec des en-têtes correspondant aux champs requis :

```csv
borrowerId,lenderInstitution,accountNumber,accountType,originalAmount,currentBalance,currency,interestRate,status
uuid-1,Bank A,ACC-001,Personal Loan,50000.00,35000.00,ETB,12.50,current
uuid-2,Bank B,ACC-002,Mortgage,200000.00,180000.00,ETB,9.00,current
```

### 14.3 Téléversement de Fichiers

1. Accédez au **Téléversement par Lots** depuis la barre latérale.
2. Sélectionnez le type de fichier (JSON ou CSV).
3. Cliquez sur le bouton **Téléverser** ou glissez-déposez votre fichier dans la zone de téléversement.
4. Le système traite le fichier et valide chaque enregistrement.

### 14.4 Examen des Résultats de Validation

Après le téléversement, le système affiche :
- **Total des Enregistrements** — Nombre d'enregistrements dans le fichier
- **Réussis** — Enregistrements ayant passé la validation et été importés
- **Échoués** — Enregistrements ayant des erreurs de validation

### 14.5 Téléchargement des Rapports d'Erreurs

Si des enregistrements échouent à la validation :
1. Examinez les détails des erreurs indiquant quels enregistrements ont échoué et pourquoi.
2. Chaque erreur inclut le numéro d'enregistrement, le nom du champ et la description de l'erreur.
3. Corrigez les erreurs dans votre fichier source et téléversez à nouveau.

---

## 15. Piste d'Audit (Admin/Régulateur)

La Piste d'Audit fournit un journal immuable de toutes les activités du système. Elle est accessible aux utilisateurs ayant les rôles **Admin** ou **Régulateur**.

### 15.1 Consultation de l'Activité du Système

1. Accédez à la **Piste d'Audit** depuis la barre latérale.
2. Le journal d'audit affiche les entrées avec :
   - **Horodatage** — Quand l'action a eu lieu
   - **Utilisateur** — Qui a effectué l'action
   - **Action** — Type d'action effectuée
   - **Entité** — Quel type d'entité a été affecté
   - **ID de l'Entité** — Identifiant de l'enregistrement affecté
   - **Détails** — Description de ce qui s'est passé
   - **Adresse IP** — Adresse IP de l'utilisateur

### 15.2 Comprendre les Types d'Actions

| Action | Description |
|--------|-------------|
| LOGIN | L'utilisateur s'est connecté au système |
| LOGOUT | L'utilisateur s'est déconnecté |
| LOGIN_FAILED | Tentative de connexion échouée |
| ACCOUNT_LOCKED | Le compte a été verrouillé après des tentatives échouées |
| CREATE | Un nouvel enregistrement a été créé |
| UPDATE | Un enregistrement existant a été modifié |
| VIEW | Un enregistrement a été consulté/accédé |
| SUBMIT_APPROVAL | Une modification a été soumise pour approbation maker-checker |
| APPROVE | Une approbation en attente a été approuvée |
| REJECT | Une approbation en attente a été rejetée |
| FILE_DISPUTE | Un nouveau litige a été déposé |
| RESOLVE_DISPUTE | Un litige a été résolu |
| PASSWORD_CHANGE | L'utilisateur a changé son mot de passe |

### 15.3 Filtrage des Entrées

La piste d'audit peut être filtrée et recherchée par :
- Plage de dates
- Utilisateur
- Type d'action
- Type d'entité
- Adresse IP

---

## 16. Gestion des Utilisateurs (Admin Uniquement)

Le module de Gestion des Utilisateurs est disponible uniquement pour les utilisateurs ayant le rôle **Admin**.

### 16.1 Création d'Utilisateurs

1. Accédez à **Gestion des Utilisateurs** depuis la barre latérale.
2. Cliquez sur le bouton **Ajouter un Utilisateur**.
3. Remplissez les champs obligatoires :
   - **Nom d'utilisateur** — Nom d'utilisateur de connexion unique
   - **Mot de passe** — Mot de passe initial (doit respecter les exigences de complexité)
   - **Nom Complet** — Nom complet de l'utilisateur
   - **Email** — Adresse email de l'utilisateur
   - **Rôle** — Sélectionnez parmi Admin, Régulateur, Prêteur ou Observateur
   - **Institution** — Nom de l'institution associée (optionnel)
4. Cliquez sur **Créer l'Utilisateur** pour enregistrer.

### 16.2 Attribution des Rôles

Chaque utilisateur se voit attribuer l'un des quatre rôles :

| Rôle | Description |
|------|-------------|
| **Admin** | Accès complet au système, y compris la gestion des utilisateurs, des institutions et des clés API |
| **Régulateur** | Accès à la plupart des modules, y compris les approbations, la piste d'audit et la facturation |
| **Prêteur** | Accès aux emprunteurs, comptes de crédit, litiges et téléversement par lots |
| **Observateur** | Accès en lecture seule aux emprunteurs, comptes de crédit et rapports |

### 16.3 Modification du Statut de l'Utilisateur

Les comptes utilisateurs peuvent avoir l'un des trois statuts :

| Statut | Description |
|--------|-------------|
| **Actif** | L'utilisateur peut se connecter et accéder au système normalement |
| **Suspendu** | L'utilisateur est temporairement bloqué pour la connexion |
| **Désactivé** | L'utilisateur est définitivement bloqué pour la connexion |

Pour modifier le statut d'un utilisateur :
1. Dans le tableau de gestion des utilisateurs, cliquez sur l'action **Modifier** sur l'utilisateur ciblé.
2. Mettez à jour le champ de statut.
3. Cliquez sur **Enregistrer** pour appliquer la modification.

### 16.4 Comprendre les Permissions par Rôle

Voir l'**Annexe B : Matrice d'Accès par Rôle** pour un détail complet de ce à quoi chaque rôle peut accéder.

---

## 17. Clés API (Admin Uniquement)

Le module Clés API permet aux administrateurs de gérer l'accès à l'API externe pour les institutions.

### 17.1 Génération de Clés API pour les Institutions

1. Accédez aux **Clés API** depuis la barre latérale.
2. Cliquez sur le bouton **Générer une Clé**.
3. Remplissez les champs obligatoires :
   - **Institution** — Sélectionnez une institution active dans la liste déroulante
   - **Libellé** — Un nom descriptif pour la clé (ex. « Clé de Production »)
   - **Permissions** — Sélectionnez le niveau de permission :
     - **Soumission** — Peut soumettre des emprunteurs, des comptes et des données de paiement
     - **Lecture** — Peut rechercher des emprunteurs et récupérer des rapports de crédit
     - **Complet** — Permissions de soumission et de lecture combinées
4. Cliquez sur **Générer la Clé**.
5. La clé API générée sera affichée **une seule fois**. Copiez-la immédiatement.

### 17.2 Comprendre les Niveaux de Permission

| Permission | Capacités |
|------------|-----------|
| **Soumission** | POST emprunteurs, comptes de crédit, historique de paiement, jugements judiciaires |
| **Lecture** | GET recherche d'emprunteurs, rapports de crédit, comptes de crédit |
| **Complet** | Toutes les capacités de soumission et de lecture combinées |

### 17.3 Révocation des Clés

1. Dans le tableau des clés API, trouvez la clé que vous souhaitez révoquer.
2. Cliquez sur le bouton **Révoquer**.
3. Le statut de la clé passera à « Révoquée » et elle ne pourra plus être utilisée pour l'authentification API.
4. La révocation est irréversible ; une nouvelle clé doit être générée si l'accès est à nouveau nécessaire.

### 17.4 Consultation de l'Utilisation

Le tableau des clés API affiche :
- **Préfixe de Clé** — Premiers caractères de la clé pour identification
- **Libellé** — Nom descriptif
- **Institution** — Institution associée
- **Permissions** — Niveau de permission
- **Statut** — Active ou Révoquée
- **Dernière Utilisation** — Dernière utilisation de la clé pour l'authentification API
- **Créée** — Date de génération de la clé

---

## 18. Rapports & Exportation

Le module Rapports fournit des vues analytiques et des capacités d'exportation de données.

### 18.1 Exportation CSV (Portefeuille/Emprunteurs)

1. Accédez aux **Rapports** depuis la barre latérale (via Rapports de Crédit).
2. Sélectionnez le type d'exportation :
   - **Exportation de Portefeuille** — Tous les comptes de crédit avec soldes et statuts
   - **Exportation d'Emprunteurs** — Tous les dossiers d'emprunteurs
3. Cliquez sur **Exporter en CSV**.
4. Le fichier CSV sera téléchargé sur votre ordinateur.

### 18.2 Vue Analytique Réglementaire

La section d'analyse réglementaire fournit :
- **Ratios NPL** — Ratios de Prêts Non Performants par institution et type de prêt
- **Ventilations de Portefeuille** — Répartition du crédit par type, statut et devise
- **Suivi des Dépassements SLA** — Litiges ayant dépassé leurs délais SLA
- **Conformité de soumission des données** — Institutions respectant leurs exigences de fréquence de soumission

---

## 19. Notifications

Le système de notification vous tient informé des événements importants dans le système.

### 19.1 Cloche de Notification

L'icône de cloche de notification est située dans la barre d'en-tête supérieure. Elle fournit un accès rapide à vos notifications.

### 19.2 Badge de Compteur Non Lu

Un badge rouge sur la cloche de notification affiche le nombre de notifications non lues. Le badge disparaît lorsque toutes les notifications sont lues.

### 19.3 Marquer comme Lu

1. Cliquez sur la cloche de notification pour ouvrir le panneau de notifications.
2. Cliquez sur une notification individuelle pour la marquer comme lue.
3. Cliquer sur une notification peut également vous diriger vers la page concernée (ex. Approbations en Attente).

### 19.4 Tout Marquer comme Lu

Cliquez sur le bouton **Tout Marquer comme Lu** dans le panneau de notifications pour marquer toutes les notifications comme lues en une seule fois.

### 19.5 Types de Notifications

| Type | Déclencheur |
|------|-------------|
| **Approbation en Attente** | Une nouvelle demande maker-checker nécessite votre examen |
| **Résultat d'Approbation** | Votre demande soumise a été approuvée ou rejetée |
| **Litige Déposé** | Un nouveau litige a été déposé |
| **Alerte Système** | Notifications système importantes |

---

## 20. FAQ / « Comment faire... ? »

### Q : Comment réinitialiser mon mot de passe ?
R : Cliquez sur l'option de changement de mot de passe dans la barre latérale, saisissez votre mot de passe actuel et votre nouveau mot de passe, puis cliquez sur Changer le mot de passe. Si vous avez oublié votre mot de passe, contactez votre administrateur système.

### Q : Comment enregistrer un nouvel emprunteur ?
R : Accédez à Emprunteurs, cliquez sur « Enregistrer un Emprunteur », remplissez le formulaire et soumettez. Votre demande passera par l'approbation maker-checker avant la création de l'emprunteur.

### Q : Pourquoi ne puis-je pas approuver ma propre soumission ?
R : Le système applique un principe maker-checker (quatre yeux). Un autre utilisateur autorisé doit approuver vos soumissions pour garantir l'intégrité des données.

### Q : Que se passe-t-il lorsque ma session expire ?
R : Après 15 minutes d'inactivité, vous êtes automatiquement déconnecté. Accédez à la page de connexion et reconnectez-vous. Toute modification non enregistrée sera perdue.

### Q : Comment rechercher un emprunteur ?
R : Utilisez la barre de recherche sur la page Emprunteurs. Vous pouvez rechercher par nom, identifiant national ou d'autres informations d'identification.

### Q : Qu'est-ce qu'un indicateur PPE ?
R : PPE signifie Personne Politiquement Exposée. Cet indicateur signale qu'un emprunteur occupe ou a occupé un poste public important.

### Q : Quel est le délai pour résoudre un litige ?
R : Les corrections financières doivent être résolues dans les 2 jours ouvrables. Les corrections non financières doivent être résolues dans les 5 jours ouvrables.

### Q : Comment générer un rapport de crédit ?
R : Accédez à la page de détails d'un emprunteur et cliquez sur « Générer un Rapport de Crédit », ou utilisez la page Recherche de Crédit pour rechercher un emprunteur puis générer le rapport.

### Q : Puis-je exporter des données du système ?
R : Oui. Accédez à Rapports et utilisez la fonctionnalité d'Exportation CSV pour télécharger les données de portefeuille ou d'emprunteurs.

### Q : Comment changer de langue ?
R : Cliquez sur le bouton de basculement de langue (EN/FR/PT) dans la barre d'en-tête supérieure ou sur la page de connexion. L'interface changera immédiatement.

### Q : Comment basculer entre le mode clair et le mode sombre ?
R : Cliquez sur l'icône de basculement de thème (soleil/lune) dans la barre d'en-tête.

### Q : Comment accorder le consentement pour un emprunteur ?
R : Accédez à Gestion du Consentement et cliquez sur « Accorder le Consentement », ou utilisez le module Service d'Assistance pour accorder le consentement pour un emprunteur sélectionné.

### Q : À quoi servent les clés API ?
R : Les clés API permettent aux institutions externes de soumettre des données et de récupérer des rapports de crédit de manière programmatique via l'API Externe.

### Q : Comment téléverser des données en masse ?
R : Utilisez la page Téléversement par Lots. Préparez vos données au format JSON, CSV ou XBRL et téléversez le fichier. Le système valide chaque enregistrement et signale les erreurs.

### Q : Comment activer le MFA ?
R : Accédez aux paramètres de votre profil et cliquez sur « Activer le MFA ». Un code QR ou une URI de configuration vous sera présenté pour scanner avec votre application d'authentification. Saisissez le code à 6 chiffres pour vérifier et activer le MFA.

### Q : Comment vérifier l'intégrité du journal d'audit ?
R : Accédez à la page Piste d'Audit et cliquez sur le bouton « Vérifier l'Intégrité ». Le système validera la chaîne de hachage SHA-256 et affichera si les journaux sont intacts.

### Q : Qu'est-ce que le chatbot de litiges ?
R : Le chatbot de litiges est un assistant guidé disponible sur la page Service d'Assistance. Il vous guide étape par étape dans le dépôt d'un litige : sélection du type de problème, recherche de l'emprunteur, choix du compte, saisie d'une description et soumission.

### Q : Puis-je utiliser des jetons OAuth au lieu de clés API ?
R : Oui. Vous pouvez échanger votre clé API contre un jeton Bearer en utilisant le point de terminaison de jetons OAuth 2.1. Le jeton est valide pendant 1 heure et peut être utilisé dans l'en-tête `Authorization: Bearer`.

### Q : Qui peut approuver les demandes en attente ?
R : Les utilisateurs ayant le rôle Admin ou Régulateur peuvent approuver ou rejeter les demandes en attente, à condition de ne pas avoir soumis la demande eux-mêmes.

### Q : Comment ajouter un jugement judiciaire ?
R : Accédez à la page de détails d'un emprunteur, trouvez la section Jugements Judiciaires et cliquez sur « Ajouter un Jugement ». Seuls les utilisateurs Admin et Régulateur peuvent créer des jugements judiciaires.

### Q : Quelles devises le système prend-il en charge ?
R : Le système prend en charge 18 devises. Voir l'Annexe C pour la liste complète.

---

## 21. Authentification Multi-Facteurs (MFA)

> Cette section couvre ENT-01. Pour les autres améliorations d'entreprise, voir : Correspondance Floue (§21.4), Chatbot de Litiges (§22), Téléversement XBRL (§23), Intégrité d'Audit (§24), OAuth 2.1 (§21.5), Faible Bande Passante (§21.6).

Le système prend en charge l'Authentification Multi-Facteurs (MFA) basée sur TOTP pour une sécurité de connexion renforcée.

### 21.1 Activation du MFA

1. Connectez-vous au système normalement.
2. Accédez à votre profil ou aux paramètres MFA (accessible depuis la barre latérale ou le menu utilisateur).
3. Cliquez sur **Activer le MFA** ou **Configurer le MFA**.
4. Le système génère un secret TOTP et affiche une URI `otpauth://`.
5. Scannez le code QR ou saisissez manuellement le secret dans votre application d'authentification (Google Authenticator, Authy, Microsoft Authenticator, etc.).
6. Saisissez le code à 6 chiffres affiché par votre application d'authentification.
7. Cliquez sur **Vérifier** pour activer le MFA.
8. Un message de succès confirme que le MFA est maintenant activé.

### 21.2 Connexion avec MFA

1. Saisissez votre nom d'utilisateur et votre mot de passe sur la page de connexion.
2. Cliquez sur **Se Connecter**.
3. Si le MFA est activé, un second écran apparaît demandant votre code TOTP.
4. Ouvrez votre application d'authentification et saisissez le code à 6 chiffres actuel.
5. Cliquez sur **Vérifier** pour terminer la connexion.

### 21.3 Désactivation du MFA

1. Connectez-vous au système.
2. Accédez aux paramètres MFA.
3. Cliquez sur **Désactiver le MFA**.
4. Le MFA est immédiatement désactivé. Les connexions futures ne nécessiteront que le nom d'utilisateur et le mot de passe.

### 21.4 Correspondance Floue d'Entités (ENT-02)

Lors de l'enregistrement d'un nouvel emprunteur, le système vérifie automatiquement les doublons potentiels en utilisant la correspondance floue de noms. Si des emprunteurs similaires sont trouvés :

1. Une **bannière d'avertissement** apparaît sur le formulaire d'enregistrement listant les emprunteurs avec des noms similaires et leurs scores de similarité.
2. Examinez les correspondances listées pour déterminer si l'emprunteur existe déjà dans le système.
3. Si l'emprunteur est véritablement nouveau, poursuivez l'enregistrement. S'il s'agit d'un doublon, annulez et utilisez l'enregistrement existant.

Cette fonctionnalité aide à prévenir les enregistrements en double et la fraude d'identité potentielle entre les juridictions.

### 21.5 Jetons Bearer OAuth 2.1 (ENT-04)

Pour les institutions utilisant l'API Externe, les jetons Bearer OAuth 2.1 fournissent une alternative à l'authentification par clé API :

1. Accédez à la page **Documentation API** depuis la barre latérale.
2. Faites défiler jusqu'à la section **OAuth 2.1** pour les instructions d'échange de jetons et les exemples de code.
3. Utilisez `POST /api/external/oauth/token` avec vos identifiants de clé API pour obtenir un jeton Bearer.
4. Incluez le jeton dans l'en-tête `Authorization: Bearer <token>` des requêtes API.
5. Les jetons expirent après **1 heure** et doivent être renouvelés en demandant un nouveau jeton.

### 21.6 Optimisations pour Faible Bande Passante (ENT-05)

Le système inclut des optimisations intégrées pour les utilisateurs sur des réseaux plus lents ou contraints :

- **Réponses compressées** — Toutes les réponses du serveur sont compressées en gzip, réduisant le transfert de données.
- **Pages à chargement différé** — Les pages de navigation se chargent à la demande plutôt que toutes en même temps, entraînant un bref indicateur de chargement lors de la première visite d'une page.
- Aucune action de l'utilisateur n'est requise ; ces optimisations sont toujours actives.

---

## 22. Chatbot de Litiges

Le Chatbot de Litiges fournit une interface guidée, de type chat, pour le dépôt de litiges.

### 22.1 Accéder au Chatbot

1. Accédez au **Service d'Assistance** depuis la barre latérale.
2. Recherchez l'interface ou le bouton du chatbot sur la page du service d'assistance.

### 22.2 Utilisation du Chatbot

Le chatbot vous guide dans le dépôt de litiges selon les étapes suivantes :

1. **Sélectionner le Type de Problème** — Choisissez le type de litige (ex. Erreur de Données, Vol d'Identité, Consultation Non Autorisée, Enregistrement en Double, Autre).
2. **Trouver l'Emprunteur** — Recherchez l'emprunteur concerné par nom ou identifiant national.
3. **Sélectionner le Compte** — Sélectionnez éventuellement le compte de crédit spécifique lié au litige.
4. **Décrire le Problème** — Saisissez une description détaillée du problème.
5. **Confirmer et Soumettre** — Examinez le résumé et confirmez pour déposer automatiquement le litige.

### 22.3 Annulation

Vous pouvez annuler le flux du chatbot à tout moment. L'interface se réinitialisera et vous pourrez démarrer un nouveau flux guidé.

---

## 23. Téléversement XBRL

Le module de Téléversement par Lots prend en charge le format de fichier XBRL/XML en plus du JSON et du CSV.

### 23.1 Accéder au Téléversement XBRL

1. Accédez au **Téléversement par Lots** depuis la barre latérale.
2. Cliquez sur l'onglet **XBRL** (à côté de l'onglet JSON/CSV).

### 23.2 Préparation des Données XBRL

L'onglet XBRL affiche un exemple de format XML montrant la structure attendue pour les enregistrements de comptes de crédit. Utilisez cet exemple comme modèle lors de la préparation de votre fichier XBRL.

### 23.3 Téléversement de Fichiers XBRL

1. Sur l'onglet XBRL, cliquez sur la zone de téléversement ou glissez-déposez votre fichier `.xbrl` ou `.xml`.
2. Le système analyse le XML et valide chaque enregistrement.
3. Les résultats sont affichés montrant les importations réussies et les erreurs de validation éventuelles.

---

## 24. Vérification de l'Intégrité du Journal d'Audit

La Piste d'Audit comprend une chaîne de hachage inviolable qui fournit une preuve cryptographique qu'aucune entrée de journal n'a été modifiée ou supprimée.

### 24.1 Vérification de l'Intégrité

1. Accédez à la **Piste d'Audit** depuis la barre latérale (accès Admin/Régulateur requis).
2. Recherchez le badge d'intégrité en haut de la page, affichant « Valide » (vert) ou « Cassée » (rouge).
3. Cliquez sur le bouton **Vérifier l'Intégrité** pour lancer une nouvelle vérification.

### 24.2 Comprendre les Résultats

- **Valide** — Toutes les entrées du journal d'audit passent la vérification de la chaîne de hachage. Aucune altération détectée.
- **Cassée** — La chaîne de hachage est rompue à une entrée spécifique, indiquant une altération potentielle ou une corruption des données.

### 24.3 Comment Ça Fonctionne

Chaque entrée du journal d'audit contient un hachage SHA-256 calculé à partir de :
- Le hachage de l'entrée précédente (créant une chaîne)
- L'action, l'entité, les détails et l'horodatage de l'entrée courante

Si une entrée est modifiée, supprimée ou insérée dans le désordre, la chaîne de hachage se rompt et la vérification d'intégrité échoue.

---

## 25. Gestion des Taux de Change

Le module de Gestion des Taux de Change permet aux administrateurs de configurer et gérer les taux de change des devises utilisés dans l'ensemble du système.

### 25.1 Consultation des Taux de Change

1. Accédez aux **Taux de Change** depuis la section Administration dans la barre latérale (accès Admin requis).
2. La page affiche un tableau de tous les taux de change configurés, incluant :
   - **Devise de Base** — La devise source
   - **Devise Cible** — La devise de destination
   - **Taux** — Le taux de change actuel
   - **Date d'Effet** — La date à laquelle le taux est devenu effectif
3. Utilisez les contrôles de recherche ou de filtre pour localiser des paires de devises spécifiques.

### 25.2 Ajout d'un Nouveau Taux de Change

1. Cliquez sur le bouton **Ajouter un Taux** en haut de la page des Taux de Change.
2. Remplissez les champs obligatoires :
   - **Devise de Base** — Sélectionnez la devise source dans la liste déroulante
   - **Devise Cible** — Sélectionnez la devise de destination dans la liste déroulante
   - **Taux** — Saisissez la valeur du taux de change
3. Cliquez sur **Enregistrer** pour créer l'enregistrement du taux de change.

### 25.3 Modification d'un Taux de Change

1. Localisez le taux de change que vous souhaitez mettre à jour dans le tableau.
2. Cliquez sur le bouton **Modifier** (icône de crayon) sur la ligne correspondante.
3. Modifiez la valeur du taux selon les besoins.
4. Cliquez sur **Enregistrer** pour appliquer les modifications.

### 25.4 Suppression d'un Taux de Change

1. Localisez le taux de change que vous souhaitez supprimer dans le tableau.
2. Cliquez sur le bouton **Supprimer** (icône de corbeille) sur la ligne correspondante.
3. Confirmez la suppression lorsque vous y êtes invité.
4. L'enregistrement du taux de change sera définitivement supprimé.

### 25.5 Widget de Conversion de Devises

La page des Taux de Change comprend un widget de conversion de devises intégré :

1. Dans la section de conversion, sélectionnez la devise **De**.
2. Sélectionnez la devise **Vers**.
3. Saisissez le **Montant** que vous souhaitez convertir.
4. Le montant converti est affiché automatiquement en fonction des taux de change configurés.
5. Si aucun taux de change n'existe pour la paire de devises sélectionnée, un message indiquera que le taux n'est pas disponible.

---

## 26. Administration des API

Le module d'Administration des API permet aux administrateurs de configurer et gérer les connexions API externes utilisées par le système pour les intégrations avec des services tiers.

### 26.1 Accéder à l'Administration des API

1. Accédez à **Administration des API** depuis la section Administration dans la barre latérale (accès Admin requis).
2. La page affiche toutes les connexions API configurées, organisées par catégorie.

### 26.2 Catégories d'API

Les API externes sont organisées dans les catégories suivantes :

- **Météo** — Services de données météorologiques pour les informations régionales
- **Judiciaire** — Services de consultation des registres judiciaires et juridiques
- **Passerelle de Paiement** — Intégrations de traitement des paiements
- **Autre** — Intégrations de services externes supplémentaires

### 26.3 Ajout d'une Nouvelle Connexion API

1. Cliquez sur le bouton **Ajouter une API**.
2. Remplissez les champs obligatoires :
   - **Nom** — Un nom descriptif pour la connexion API
   - **Catégorie** — Sélectionnez la catégorie de l'API (Météo, Judiciaire, Passerelle de Paiement, Autre)
   - **URL de Base** — L'URL racine de l'API externe
   - **Clé API** — La clé d'authentification pour le service externe (si requise)
   - **Description** — Une brève description de l'objectif de l'API
3. Cliquez sur **Enregistrer** pour créer la connexion API.

### 26.4 Modification d'une Connexion API

1. Localisez la connexion API dans la liste.
2. Cliquez sur le bouton **Modifier** pour modifier sa configuration.
3. Mettez à jour les champs selon les besoins (nom, URL, clé API, catégorie, description).
4. Cliquez sur **Enregistrer** pour appliquer les modifications.

### 26.5 Test des Connexions API

1. Localisez la connexion API que vous souhaitez tester.
2. Cliquez sur le bouton **Tester la Connexion**.
3. Le système tentera d'atteindre l'URL configurée et de vérifier la connectivité.
4. Un message de succès ou d'échec sera affiché indiquant si l'API est joignable.

### 26.6 Gestion des Catégories d'API

Les catégories d'API aident à organiser les connexions par leur fonction. Lors de l'ajout ou de la modification d'une connexion API, sélectionnez la catégorie appropriée pour maintenir les configurations organisées et facilement repérables par les autres administrateurs.

---

## 27. Politiques de Rétention des Données

Le module de Politiques de Rétention des Données permet aux administrateurs et aux régulateurs de définir la durée de conservation des données de crédit par pays, en conformité avec les réglementations juridictionnelles.

### 27.1 Consultation des Politiques de Rétention

1. Accédez aux **Politiques de Rétention** depuis la section Administration dans la barre latérale (accès Admin ou Régulateur requis).
2. La page affiche un tableau de toutes les politiques de rétention configurées, incluant :
   - **Pays** — La juridiction à laquelle la politique s'applique
   - **Période d'Archivage (Mois)** — Durée de conservation des données dans un état archivé avant toute action ultérieure
   - **Période de Suppression (Mois)** — Durée après l'archivage avant la suppression définitive des données
   - **Statut** — Si la politique est active ou inactive
   - **Dates de création/mise à jour**

### 27.2 Comprendre les Périodes d'Archivage et de Suppression

- **Période d'Archivage** : Après ce nombre de mois, les dossiers de crédit du pays spécifié sont déplacés vers un état archivé. Les dossiers archivés ne sont plus inclus dans les recherches de crédit actives mais peuvent toujours être récupérés à des fins réglementaires ou d'audit.
- **Période de Suppression** : Après ce nombre de mois supplémentaires suivant l'archivage, les données sont définitivement supprimées (expurgées) du système. Une fois supprimées, les données ne peuvent pas être récupérées.

Par exemple, si un pays a une période d'archivage de 60 mois et une période de suppression de 24 mois, les dossiers seront archivés après 5 ans et définitivement supprimés 2 ans après l'archivage (7 ans au total).

### 27.3 Ajout d'une Politique de Rétention

1. Cliquez sur le bouton **Ajouter une Politique** en haut de la page des Politiques de Rétention.
2. Remplissez les champs obligatoires :
   - **Pays** — Saisissez le nom ou le code du pays
   - **Période d'Archivage (Mois)** — Nombre de mois avant l'archivage des données
   - **Période de Suppression (Mois)** — Nombre de mois après l'archivage avant la suppression des données
3. Cliquez sur **Enregistrer** pour créer la politique de rétention.

### 27.4 Modification d'une Politique de Rétention

1. Localisez la politique de rétention dans le tableau.
2. Cliquez sur le bouton **Modifier** sur la ligne correspondante.
3. Modifiez la période d'archivage, la période de suppression ou d'autres paramètres selon les besoins.
4. Cliquez sur **Enregistrer** pour appliquer les modifications.

### 27.5 Exécution de l'Application de la Rétention

Le bouton **Exécuter l'Application** déclenche le processus d'application de la rétention :

1. Cliquez sur le bouton **Exécuter l'Application** en haut de la page des Politiques de Rétention.
2. Le système évaluera toutes les politiques de rétention actives par rapport aux données actuelles.
3. Les dossiers ayant dépassé leur période d'archivage seront déplacés vers le statut archivé.
4. Les dossiers ayant dépassé leur période de suppression seront définitivement supprimés.
5. Un message de confirmation affichera les résultats de l'exécution de l'application, incluant le nombre de dossiers archivés et supprimés.

**Important :** L'exécution de l'application est une action irréversible pour les dossiers supprimés. Assurez-vous que les périodes de rétention sont correctement configurées avant d'exécuter l'application.

---

## Annexe A : Identifiants de Démonstration

Les identifiants suivants sont pré-configurés dans le système à des fins de test et de démonstration :

| Nom d'utilisateur | Mot de passe | Rôle | Institution |
|-------------------|-------------|------|-------------|
| admin | admin123 | Admin | NBE |
| regulator1 | reg123 | Régulateur | NBE |
| cbe_user | cbe123 | Prêteur | CBE (Banque Commerciale d'Éthiopie) |
| dashen_user | dashen123 | Prêteur | Dashen Bank |
| awash_user | awash123 | Prêteur | Awash Bank |

**Important :** Ces identifiants doivent être changés immédiatement dans un environnement de production. Tous les mots de passe doivent respecter les exigences de complexité du système.

---

## Annexe B : Matrice d'Accès par Rôle

> **Note :** La configuration/désactivation du MFA est disponible pour tous les utilisateurs authentifiés. La vérification de l'intégrité d'audit nécessite le rôle Admin ou Régulateur. Le chatbot de litiges et le téléversement XBRL suivent les mêmes règles d'accès que le Service d'Assistance et le Téléversement par Lots respectivement.

| Module / Fonctionnalité | Admin | Régulateur | Prêteur | Observateur |
|--------------------------|-------|------------|---------|-------------|
| Tableau de Bord | Accès Complet | Accès Complet | Accès Complet | Accès Complet |
| Gestion des Emprunteurs | Accès Complet | Accès Complet | Accès Complet | Lecture Seule |
| Comptes de Crédit | Accès Complet | Accès Complet | Accès Complet | Lecture Seule |
| Recherche de Crédit & Rapports | Accès Complet | Accès Complet | Accès Complet | Lecture Seule |
| Approbations en Attente (Examen) | Approuver/Rejeter | Approuver/Rejeter | Consultation Uniquement | Consultation Uniquement |
| Gestion des Litiges | Accès Complet | Accès Complet | Accès Complet | Lecture Seule |
| Jugements Judiciaires (Création) | Oui | Oui | Non | Non |
| Gestion du Consentement | Accès Complet | Accès Complet | Accès Complet | Lecture Seule |
| Piste d'Audit | Accès Complet | Accès Complet | Pas d'Accès | Pas d'Accès |
| Facturation | Accès Complet | Accès Complet | Pas d'Accès | Pas d'Accès |
| Service d'Assistance | Accès Complet | Accès Complet | Accès Complet | Accès Complet |
| Téléversement par Lots | Accès Complet | Pas d'Accès | Accès Complet | Pas d'Accès |
| Gestion des Utilisateurs | Accès Complet | Pas d'Accès | Pas d'Accès | Pas d'Accès |
| Gestion des Institutions | Accès Complet | Pas d'Accès | Pas d'Accès | Pas d'Accès |
| Clés API | Accès Complet | Pas d'Accès | Pas d'Accès | Pas d'Accès |
| Rapports & Exportation | Accès Complet | Accès Complet | Accès Complet | Accès Complet |
| Notifications | Accès Complet | Accès Complet | Accès Complet | Accès Complet |

---

## Annexe C : Devises Prises en Charge

Le système prend en charge les 18 devises suivantes :

| Code | Nom de la Devise | Symbole | Région |
|------|-----------------|---------|--------|
| ETB | Birr éthiopien | Br | Afrique de l'Est |
| KES | Shilling kényan | KSh | Afrique de l'Est |
| UGX | Shilling ougandais | USh | Afrique de l'Est |
| TZS | Shilling tanzanien | TSh | Afrique de l'Est |
| RWF | Franc rwandais | FRw | Afrique de l'Est |
| GHS | Cedi ghanéen | ₵ | Afrique de l'Ouest |
| LRD | Dollar libérien | L$ | Afrique de l'Ouest |
| NGN | Naira nigérian | ₦ | Afrique de l'Ouest |
| XOF | Franc CFA ouest-africain | CFA | Afrique de l'Ouest |
| XAF | Franc CFA d'Afrique centrale | FCFA | Afrique Centrale |
| ZAR | Rand sud-africain | R | Afrique Australe |
| BWP | Pula botswanais | P | Afrique Australe |
| MZN | Metical mozambicain | MT | Afrique Australe |
| EGP | Livre égyptienne | E£ | Afrique du Nord |
| MAD | Dirham marocain | MAD | Afrique du Nord |
| USD | Dollar américain | $ | International |
| EUR | Euro | € | International |
| GBP | Livre sterling | £ | International |

---

## Annexe D : Glossaire des Termes

| Terme | Définition |
|-------|-----------|
| **Emprunteur** | Une personne physique ou morale qui a obtenu un crédit auprès d'une institution financière |
| **CDH** | Hub Central de Données — le dépôt centralisé des données de crédit à travers les juridictions |
| **Consentement** | Autorisation accordée par un sujet de données (emprunteur) pour l'accès à ses informations de crédit |
| **Compte de Crédit** | Un prêt, une facilité de crédit ou une obligation financière associée à un emprunteur |
| **Bureau de Crédit** | Une organisation qui collecte et fournit des informations de crédit |
| **Consultation de Crédit** | Une recherche/demande d'informations de crédit d'un emprunteur |
| **Rapport de Crédit** | Un résumé complet de l'historique de crédit et de la solvabilité d'un emprunteur |
| **Score de Crédit** | Une valeur numérique (300-850) représentant la solvabilité d'un emprunteur |
| **Impayé** | Un compte avec des paiements en retard |
| **Défaut** | Un compte classé comme non performant en raison d'un non-paiement prolongé |
| **Litige** | Une plainte formelle concernant l'exactitude des informations de crédit |
| **Principe des Quatre Yeux** | Un mécanisme de contrôle nécessitant deux parties indépendantes pour vérifier une action (maker-checker) |
| **Période de Grâce** | Une période après le décaissement du prêt pendant laquelle aucun paiement n'est requis |
| **ISU** | Unité de Service aux Demandes — la fonction de service d'assistance pour les demandes des consommateurs |
| **Privilège** | Une revendication légale sur un bien utilisé comme garantie d'une dette |
| **Maker-Checker** | Un flux nécessitant qu'un utilisateur crée/modifie des données et qu'un autre les approuve |
| **IMF** | Institution de Microfinance |
| **NPL** | Prêt Non Performant — un prêt où l'emprunteur est en défaut ou proche du défaut |
| **PPE** | Personne Politiquement Exposée — quelqu'un occupant ou ayant occupé un poste public important |
| **RBAC** | Contrôle d'Accès Basé sur les Rôles — modèle de sécurité limitant l'accès selon les rôles des utilisateurs |
| **Numéro de Reçu** | Un identifiant unique émis lorsque le consentement est accordé |
| **Restructuré** | Un prêt dont les conditions ont été modifiées pour apporter un soulagement à l'emprunteur |
| **SACCO** | Coopérative d'Épargne et de Crédit |
| **Numéro de Série** | Un identifiant unique attribué à chaque rapport de crédit généré |
| **SLA** | Accord de Niveau de Service — le délai convenu pour la résolution des litiges |
| **SRS** | Spécification des Exigences Logicielles |
| **TIN** | Numéro d'Identification Fiscale |
| **UAT** | Tests d'Acceptation Utilisateur |
| **Passé en Perte** | Un compte classé comme irrécupérable et retiré des portefeuilles actifs |

---

*Ce document est confidentiel et destiné uniquement aux utilisateurs autorisés du Système de Registre de Crédit. Pour le support technique, contactez Systems In Motion Limited.*
