# Rapport de Conformité Sécuritaire

## Système de Hub Central de Données Inter-Juridictionnel & Registre de Crédit v1.2

**Préparé pour :** Systems In Motion Limited  
**Version du Document :** 1.2  
**Date :** Mars 2026  
**Classification :** Confidentiel

---

## 1. Résumé Exécutif

Ce document fournit une évaluation complète des contrôles de sécurité mis en œuvre dans le Système de Registre de Crédit par rapport aux exigences définies dans la Spécification des Exigences Logicielles (SRS) v1.2. Le système traite des données financières et personnelles sensibles à travers les 54 pays africains et prend en charge trois langues (anglais, français, portugais) et doit se conformer aux exigences réglementaires en matière de protection des données et de réglementation financière.

Les dix exigences de sécurité non fonctionnelles (NFR-SEC-01 à NFR-SEC-10) ont été mises en œuvre, ainsi que treize améliorations de sécurité entreprise (ENT-01 à ENT-13) incluant l'authentification multifacteur TOTP, l'échange de jetons porteur OAuth 2.1, les chaînes de hachage de journaux d'audit à preuve de falsification, la correspondance floue d'entités, le chatbot de litiges, les optimisations pour faible bande passante, la prise en charge du téléchargement XBRL, l'application de la rétention des données, la gestion des taux de change, l'administration API, la recherche globale, le téléversement de photos/documents d'identité et l'environnement de démonstration pour investisseurs. Ce rapport détaille chaque contrôle de sécurité, sa mise en œuvre et son statut de conformité.

---

## 2. Contrôles d'Authentification

### 2.1 Authentification par Mot de Passe

| Contrôle | Mise en Œuvre |
|----------|--------------|
| Méthode d'authentification | Nom d'utilisateur/mot de passe avec session côté serveur |
| Hachage du mot de passe | bcryptjs avec 10 tours de salage |
| Stockage du mot de passe | Mots de passe hachés stockés dans la colonne `users.password` ; le texte en clair n'est jamais stocké ni journalisé |
| Point d'accès de connexion | `POST /api/auth/login` |
| Point d'accès de déconnexion | `POST /api/auth/logout` |
| Vérification de session | `GET /api/auth/me` |

### 2.2 Politique de Mot de Passe

| Politique | Exigence | Mise en Œuvre |
|-----------|----------|--------------|
| Longueur minimale | 8 caractères | Validation par regex : `.{8,}` |
| Majuscule | Au moins 1 | Regex : `(?=.*[A-Z])` |
| Minuscule | Au moins 1 | Regex : `(?=.*[a-z])` |
| Chiffre | Au moins 1 | Regex : `(?=.*\d)` |
| Caractère spécial | Au moins 1 | Regex : `(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])` |
| Expiration du mot de passe | 90 jours | Horodatage `passwordChangedAt` vérifié à la connexion ; changement forcé à l'expiration |
| Changement à la première connexion | Requis lorsque signalé | Indicateur booléen `mustChangePassword` |

**Motif Regex Complet :**
```regex
^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$
```

### 2.3 Authentification Multifacteur (AMF) — ENT-01

| Contrôle | Mise en Œuvre |
|----------|--------------|
| Méthode AMF | TOTP (Mot de Passe à Usage Unique Basé sur le Temps) via la bibliothèque `otpauth` |
| Stockage du secret | Colonne `mfaSecret` (varchar, nullable) sur la table `users` ; stocké en tant que secret encodé en base32 |
| Indicateur d'activation | Colonne `mfaEnabled` (booléen, par défaut false) sur la table `users` |
| Point d'accès de configuration | `POST /api/auth/mfa/setup` — génère le secret TOTP, retourne l'URI `otpauth://` pour le code QR |
| Point d'accès de vérification | `POST /api/auth/mfa/verify` — valide le code TOTP à 6 chiffres et active l'AMF |
| Point d'accès de désactivation | `POST /api/auth/mfa/disable` — désactive l'AMF pour l'utilisateur authentifié |
| Flux de connexion | `POST /api/auth/login` retourne `{ requireMfa: true }` lorsque l'AMF est activée ; le client demande le code TOTP |
| Point d'accès de connexion AMF | `POST /api/auth/mfa/login` — valide le code TOTP et complète l'authentification |
| Composant frontend | `mfa-setup.tsx` — dialogue de configuration avec affichage du code QR et champ de saisie de vérification |
| Support i18n | Traductions complètes EN/FR/PT sous les clés `mfa.*` et `login.mfa*` |

**Flux de Connexion AMF :**
1. L'utilisateur soumet son nom d'utilisateur/mot de passe via `POST /api/auth/login`
2. Si l'utilisateur a `mfaEnabled = true`, le serveur retourne `{ requireMfa: true, userId }` sans créer de session
3. Le client affiche le champ de saisie du code TOTP
4. L'utilisateur saisit le code à 6 chiffres depuis l'application d'authentification
5. Le client envoie `POST /api/auth/mfa/login` avec `{ userId, code }`
6. Le serveur valide le code TOTP par rapport au secret stocké
7. Si valide, la session est créée et l'utilisateur est authentifié
8. Si invalide, HTTP 401 retourné avec l'erreur « Code AMF invalide »

### 2.4 Verrouillage de Compte

| Contrôle | Valeur |
|----------|--------|
| Tentatives échouées maximales | 3 |
| Durée du verrouillage | 15 minutes |
| Suivi du verrouillage | Compteur `failed_login_attempts` dans la table `users` |
| Expiration du verrouillage | Horodatage `locked_until` dans la table `users` |
| Réinitialisation du compteur | À la connexion réussie (`resetFailedAttempts`) |
| Journalisation d'audit | Tentatives échouées et événements de verrouillage journalisés avec adresse IP |

**Flux de Verrouillage :**
1. Une connexion échouée incrémente `failed_login_attempts`
2. Chaque tentative échouée crée une entrée de journal d'audit `LOGIN_FAILED`
3. À 3 tentatives échouées, `locked_until` est défini à `maintenant + 15 minutes`
4. Une entrée de journal d'audit `ACCOUNT_LOCKED` est créée
5. Les tentatives de connexion suivantes pendant le verrouillage retournent HTTP 423
6. Une connexion réussie réinitialise le compteur et annule le verrouillage

---

## 3. Autorisation (RBAC)

### 3.1 Définitions des Rôles

Le système met en œuvre quatre rôles avec accès hiérarchique :

| Rôle | Description | Gestion des utilisateurs | Institutions | Facturation | Journaux d'audit | Approbations | Téléchargement par lots | Saisie de données | Consultation des données |
|------|-------------|--------------------------|--------------|-------------|-------------------|--------------|-------------------------|-------------------|--------------------------|
| admin | Accès complet au système | Oui | Oui | Oui | Oui | Oui | Oui | Oui | Oui |
| regulator | Supervision réglementaire | Non | Non | Oui | Oui | Oui | Non | Oui | Oui |
| lender | Opérations du fournisseur de données | Non | Non | Non | Non | Non | Oui | Oui | Oui |
| viewer | Accès en lecture seule | Non | Non | Non | Non | Non | Non | Non | Oui |

### 3.2 Application Côté Serveur

L'autorisation est appliquée au niveau de la couche API à l'aide d'un middleware :

```typescript
function requireRole(...roles: string[]) {
  return (req, res, next) => {
    if (!req.session?.userRole || !roles.includes(req.session.userRole)) {
      return res.status(403).json({ message: "Insufficient permissions" });
    }
    next();
  };
}
```

### 3.3 Routes Protégées

| Point d'accès | Rôles requis |
|----------------|--------------|
| `GET/POST /api/users` | admin |
| `PATCH /api/users/:id` | admin |
| `GET /api/audit-logs` | admin, regulator |
| `PATCH /api/pending-approvals/:id` | admin, regulator |
| `POST /api/court-judgments` | admin, regulator |
| `GET/POST /api/api-keys` | admin |
| `POST /api/api-keys/:id/revoke` | admin |
| `POST /api/batch-upload/*` | admin, lender |

### 3.4 RBAC Frontend

La barre latérale du frontend et l'accès aux pages sont filtrés en fonction du rôle de l'utilisateur, empêchant la navigation non autorisée. Cependant, l'application de la sécurité se fait côté serveur ; le filtrage frontend est uniquement une commodité pour l'expérience utilisateur.

---

## 4. Gestion des Sessions

### 4.1 Configuration des Sessions

| Paramètre | Valeur | Remarques |
|------------|--------|-----------|
| Stockage de session | MemoryStore | Stockage de session en mémoire avec nettoyage périodique |
| Secret de session | Variable d'environnement `SESSION_SECRET` | Utilise un secret de développement par défaut en développement |
| Cookie HttpOnly | `true` | Empêche l'accès JavaScript côté client |
| Cookie Secure | `false` (configurable) | Devrait être `true` en production avec HTTPS |
| Cookie SameSite | `lax` | Protection CSRF |
| Durée maximale de session | 8 heures | Durée de vie absolue de la session |
| Délai d'inactivité | 15 minutes | Conformité NFR-SEC-09 |
| Nettoyage du stockage | Toutes les 24 heures | `checkPeriod: 86400000` |

### 4.2 Mise en Œuvre du Délai d'Inactivité (NFR-SEC-09)

```typescript
const IDLE_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes

app.use((req, res, next) => {
  if (req.session?.userId && req.session.lastActivity) {
    const idle = Date.now() - req.session.lastActivity;
    if (idle > IDLE_TIMEOUT_MS) {
      req.session.destroy(() => {});
      return res.status(440).json({ message: "Session expired due to inactivity" });
    }
  }
  if (req.session?.userId) {
    req.session.lastActivity = Date.now();
  }
  next();
});
```

- L'horodatage `lastActivity` est mis à jour à chaque requête authentifiée
- La session est détruite lorsque le temps d'inactivité dépasse 15 minutes
- Le statut HTTP 440 est retourné (Expiration de la connexion)
- Le frontend détecte le 440 et redirige vers la page de connexion

### 4.3 Données de Session

| Champ | Type | Description |
|-------|------|-------------|
| userId | string | Identifiant de l'utilisateur authentifié |
| userRole | string | Rôle de l'utilisateur pour l'autorisation |
| lastActivity | number | Horodatage de la dernière activité (ms depuis l'époque) |

---

## 5. Sécurité de l'API

### 5.1 Authentification de l'API Interne

Tous les points d'accès de l'API interne (sous `/api/`) nécessitent une authentification par session, à l'exception de :
- `/api/auth/login`
- `/api/auth/logout`
- `/api/auth/me`
- `/api/health`
- `/api/external/*`

Middleware d'authentification :
```typescript
app.use("/api", (req, res, next) => {
  if (req.path.startsWith("/auth") || req.path.startsWith("/external")) return next();
  requireAuth(req, res, next);
});
```

### 5.2 Authentification de l'API Externe

Les points d'accès de l'API externe prennent en charge deux méthodes d'authentification :

#### 5.2.1 Authentification par Clé X-API-Key

Authentification par clé API via l'en-tête HTTP `X-API-Key` (méthode originale) :

#### 5.2.2 Authentification par Jeton Porteur OAuth 2.1 — ENT-04

| Contrôle | Mise en Œuvre |
|----------|--------------|
| Type d'autorisation | `client_credentials` |
| Point d'accès de jeton | `POST /api/external/oauth/token` |
| Format du jeton | JWT (JSON Web Token) signé avec HS256 |
| Bibliothèque de jetons | `jsonwebtoken` |
| Expiration du jeton | 1 heure (3600 secondes) |
| Format de la requête | `{ "grant_type": "client_credentials", "client_id": "<api_key_prefix>", "client_secret": "<full_api_key>" }` |
| Format de la réponse | `{ "access_token": "<jwt>", "token_type": "Bearer", "expires_in": 3600 }` |
| Utilisation | En-tête `Authorization: Bearer <access_token>` sur les points d'accès de l'API externe |

**Flux de Jeton OAuth 2.1 :**
1. Le client envoie `POST /api/external/oauth/token` avec les identifiants de clé API
2. Le serveur valide la clé API via une recherche de hachage SHA-256
3. Le serveur génère un JWT contenant `institutionId`, `permissions` et `apiKeyId`
4. Le JWT est signé avec le secret de session et retourné au client
5. Le client inclut le JWT dans l'en-tête `Authorization: Bearer <token>` pour les requêtes suivantes
6. Le serveur valide la signature et l'expiration du JWT à chaque requête
7. L'authentification par X-API-Key et par jeton porteur sont toutes deux acceptées sur tous les points d'accès de l'API externe

Les points d'accès de l'API externe utilisent également l'authentification par clé API :

| Contrôle | Mise en Œuvre |
|----------|--------------|
| En-tête d'authentification | `X-API-Key` |
| Hachage de la clé | SHA-256 (crypto.createHash) |
| Stockage de la clé | Seul le hachage est stocké (colonne `key_hash`) ; la clé complète n'est affichée qu'une seule fois à la création |
| Préfixe de la clé | Préfixe visible pour l'identification (`sim_XXXXXXXX`) |
| Niveaux de permission | `submit` (écriture seule), `read` (lecture seule), `full` (lecture + écriture) |
| Liaison à l'institution | Chaque clé est liée à une institution spécifique |
| Vérification du statut de l'institution | L'institution doit être `active` pour que la clé fonctionne |
| Suivi de la dernière utilisation | Horodatage `last_used_at` mis à jour à chaque appel API |
| Révocation de la clé | Révocation immédiate avec horodatage `revoked_at` |

### 5.3 Génération de Clé API

```typescript
function generateApiKey() {
  const prefix = "sim_" + crypto.randomBytes(4).toString("hex");
  const secret = crypto.randomBytes(24).toString("hex");
  const fullKey = `${prefix}_${secret}`;
  const hash = crypto.createHash("sha256").update(fullKey).digest("hex");
  return { fullKey, prefix, hash };
}
```

- Format de la clé : `sim_XXXXXXXX_YYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYY`
- Préfixe : 8 caractères hexadécimaux pour l'identification
- Secret : 48 caractères hexadécimaux pour la sécurité
- Entropie totale : 224 bits (28 octets aléatoires)

### 5.4 Flux de Validation de Clé API

1. Extraire l'en-tête `X-API-Key`
2. Hacher la clé avec SHA-256
3. Rechercher le hachage dans la table `api_keys`
4. Vérifier que le statut de la clé est `active`
5. Vérifier que l'institution associée est `active`
6. Vérifier le niveau de permission par rapport aux exigences du point d'accès
7. Mettre à jour l'horodatage `last_used_at`
8. Poursuivre avec la requête

### 5.5 Atténuation SSRF

Le module d'Administration d'API inclut une protection contre les attaques SSRF (Server-Side Request Forgery) via la fonctionnalité « Tester la Connexion », afin de prévenir l'abus des requêtes HTTP sortantes.

| Contrôle | Mise en Œuvre |
|----------|--------------|
| Validation d'URL | Bloque les requêtes vers les adresses réseau internes/privées avant d'effectuer des requêtes sortantes |
| Hôtes bloqués | `localhost`, `127.0.0.1`, `169.254.169.254` (point d'accès des métadonnées cloud) |
| Plages IP bloquées | Plages IP privées : `10.x.x.x`, `192.168.x.x`, `172.16-31.x.x` |
| Restriction de protocole | Seuls les protocoles `HTTP` et `HTTPS` sont autorisés ; tous les autres schémas sont rejetés |
| Mise en œuvre | Logique de validation d'URL dans `server/routes.ts` validant toutes les URL fournies par l'utilisateur avant d'effectuer des requêtes sortantes |

**Flux de Validation SSRF :**
1. L'utilisateur soumet une URL via la fonctionnalité « Tester la Connexion » dans le module d'Administration d'API
2. Le serveur analyse l'URL et extrait le nom d'hôte et le protocole
3. Le protocole est vérifié par rapport à la liste autorisée (HTTP/HTTPS uniquement)
4. Le nom d'hôte est vérifié par rapport à la liste de blocage (localhost, 127.0.0.1, point d'accès des métadonnées)
5. Le nom d'hôte est vérifié par rapport aux plages IP privées (10.x, 192.168.x, 172.16-31.x)
6. Si une vérification échoue, la requête est rejetée avec un message d'erreur approprié
7. Si toutes les vérifications réussissent, la requête sortante est effectuée et la réponse est retournée à l'utilisateur

---

## 6. Protection des Données

### 6.1 Données au Repos

| Données | Protection |
|---------|-----------|
| Mots de passe | Hachage bcrypt (10 tours) |
| Clés API | Hachage SHA-256 |
| DCP (données des emprunteurs) | Contrôle d'accès au niveau de la base de données |
| Connexion à la base de données | SSL/TLS lorsque `sslmode=require` |

### 6.2 Données en Transit

| Canal | Protection |
|-------|-----------|
| Client vers serveur | HTTPS (fourni par la plateforme ou proxy inverse) |
| Serveur vers base de données | SSL/TLS PostgreSQL |
| Transmission de clé API | HTTPS requis pour l'API externe |

### 6.3 Traitement des Données Sensibles

- Les mots de passe ne sont jamais retournés dans les réponses API (fonction `stripPassword`)
- Les clés API complètes ne sont affichées qu'une seule fois à la création
- Les données de session sont stockées uniquement côté serveur (le cookie ne contient que l'identifiant de session)
- Les détails du journal d'audit sont tronqués à 200 caractères dans la sortie console

### 6.4 Validation des Entrées

Toutes les entrées utilisateur sont validées à l'aide de schémas Zod dérivés des définitions de tables Drizzle ORM :

```typescript
const parsed = insertBorrowerSchema.parse(req.body);
```

- Validation des types (string, number, boolean, valeurs d'énumération)
- Application des champs obligatoires
- Restriction des valeurs d'énumération
- Prévention de l'injection SQL via des requêtes paramétrées (Drizzle ORM), y compris dans le Moteur d'Application des Politiques de Rétention et les modules de Configuration d'API

---

## 7. Journalisation d'Audit

### 7.1 Couverture de la Journalisation d'Audit

| Catégorie d'action | Événements journalisés |
|---------------------|------------------------|
| Authentification | LOGIN, LOGIN_FAILED, ACCOUNT_LOCKED, LOGOUT, PASSWORD_CHANGE |
| Modifications de données | CREATE, UPDATE, SUBMIT_APPROVAL, APPROVE, REJECT |
| Litiges | FILE_DISPUTE, RESOLVE_DISPUTE |
| Consentement | GRANT_CONSENT, REVOKE_CONSENT |
| Rapports de crédit | VIEW (rapport de crédit), API_CREDIT_REPORT |
| API externe | API_SUBMIT, API_BATCH_SUBMIT, API_CREDIT_REPORT |
| Institutions | APPROVE_INSTITUTION |
| Clés API | CREATE_API_KEY, REVOKE_API_KEY |

### 7.2 Champs du Journal d'Audit

| Champ | Description |
|-------|-------------|
| id | Identifiant unique de l'entrée de journal |
| user_id | Utilisateur qui a effectué l'action |
| action | Type d'action (énumérés ci-dessus) |
| entity | Type d'entité affectée (utilisateur, emprunteur, compte de crédit, etc.) |
| entity_id | Identifiant de l'entité affectée |
| details | Description lisible par l'humain |
| ip_address | Adresse IP du client (via `req.ip` avec trust proxy activé) |
| created_at | Horodatage de l'action |

### 7.3 Chaîne de Hachage à Preuve de Falsification — ENT-07

| Contrôle | Mise en Œuvre |
|----------|--------------|
| Algorithme de hachage | SHA-256 (via le module `crypto` de Node.js) |
| Champs de hachage | Colonnes `previousHash` et `currentHash` sur la table `audit_logs` |
| Construction de la chaîne | Le `currentHash` de chaque nouvelle entrée = SHA-256(`previousHash` + `action` + `entity` + `details` + `timestamp`) |
| Première entrée | `previousHash` = `"genesis"` pour la première entrée de la chaîne |
| Point d'accès de vérification | `GET /api/audit/verify-integrity` — valide l'ensemble de la chaîne de hachage |
| Indicateur frontend | Badge d'intégrité sur la page de piste d'audit (`data-testid="badge-integrity-status"`) |
| Bouton de vérification | `data-testid="button-verify-integrity"` déclenche la vérification de la chaîne |

**Processus de Vérification de la Chaîne de Hachage :**
1. Le client appelle `GET /api/audit/verify-integrity`
2. Le serveur récupère toutes les entrées du journal d'audit ordonnées par `created_at ASC`
3. Pour chaque entrée, le serveur recalcule le `currentHash` attendu à partir du `previousHash` + données de l'entrée
4. Le serveur vérifie que le `currentHash` correspond à la valeur stockée
5. Le serveur vérifie que le `previousHash` correspond au `currentHash` de l'entrée précédente
6. Retourne `{ valid: true/false, totalEntries, checkedEntries, brokenAt }`
7. Le frontend affiche un badge vert « Valide » ou un badge rouge « Rompu » en conséquence

### 7.4 Immuabilité du Journal d'Audit

- Les journaux d'audit sont en ajout seul (opérations INSERT uniquement)
- Aucun point d'accès UPDATE ou DELETE n'existe pour les journaux d'audit
- Les journaux sont ordonnés par `created_at DESC` pour l'affichage
- Les 200 dernières entrées sont retournées via l'API (avec potentiel de pagination)
- La chaîne de hachage fournit une preuve cryptographique de falsification (ENT-07)

### 7.4 Suivi des Adresses IP

```typescript
app.set("trust proxy", true);
```

Les adresses IP sont capturées sur toutes les opérations auditées via `req.ip`, qui respecte les en-têtes `X-Forwarded-For` lorsque le système est derrière un proxy inverse.

---

## 8. Flux de Travail Créateur-Vérificateur

### 8.1 Principe des Quatre Yeux

Le système applique un principe créateur-vérificateur (quatre yeux) pour les modifications de données :

| Étape | Rôle | Action |
|-------|------|--------|
| 1. Soumission | Tout utilisateur (créateur) | Crée une demande d'approbation en attente |
| 2. Révision | Admin/Régulateur (vérificateur) | Approuve ou rejette la demande |
| 3. Application | Système | Applique automatiquement les modifications approuvées |

### 8.2 Prévention de l'Auto-Approbation

```typescript
if (approval.requestedBy === currentUserId) {
  return res.status(403).json({
    message: "Maker-checker: You cannot approve your own request."
  });
}
```

- L'application côté serveur empêche tout utilisateur d'approuver ses propres demandes
- HTTP 403 retourné lors d'une tentative d'auto-approbation
- Ceci s'applique à tous les types d'entités (emprunteurs, comptes de crédit)

### 8.3 Entités Couvertes

| Type d'entité | Actions nécessitant une approbation |
|---------------|-------------------------------------|
| Emprunteur | CREATE, UPDATE |
| Compte de crédit | CREATE, UPDATE |

### 8.4 Notifications d'Approbation

- Lorsqu'une demande est soumise, tous les utilisateurs admin/régulateur (sauf le demandeur) reçoivent une notification
- Lorsqu'une demande est approuvée/rejetée, le demandeur original reçoit une notification
- Les notifications incluent des liens vers la page des approbations

---

## 9. Contrôles de Sécurité des Améliorations Entreprise

### 9.1 Correspondance Floue d'Entités — ENT-02

| Contrôle | Mise en Œuvre |
|----------|--------------|
| Extension | `pg_trgm` (similarité par trigrammes PostgreSQL) |
| Activation | `CREATE EXTENSION IF NOT EXISTS pg_trgm` à l'initialisation du pool dans `server/db.ts` |
| Point d'accès | `GET /api/borrowers/fuzzy-match?name=<query>` |
| Seuil | Score de similarité ≥ 0,3 |
| Objectif | Détecte les doublons potentiels d'emprunteurs lors de l'enregistrement pour prévenir la fraude à l'identité |
| Intégration frontend | Bannière d'avertissement affichée sur le formulaire d'enregistrement d'emprunteur lorsque des doublons sont détectés |

### 9.2 Optimisations pour Faible Bande Passante — ENT-05

| Contrôle | Mise en Œuvre |
|----------|--------------|
| Compression | Middleware `compression` (gzip) appliqué à toutes les réponses HTTP |
| Découpage du code | `React.lazy()` pour tous les composants de route sauf Dashboard, Login et NotFound |
| Chargement différé | Enveloppe `Suspense` avec composant de repli spinner (`LazyFallback`) |
| Effet | Taille du bundle initial réduite ; réponses API compressées pour les environnements à bande passante limitée |

### 9.3 Prise en Charge du Téléchargement XBRL — ENT-06

| Contrôle | Mise en Œuvre |
|----------|--------------|
| Format de fichier | Fichiers XBRL/XML acceptés via le point d'accès de téléchargement par lots |
| Frontend | Interface à onglets (onglet JSON/CSV et onglet XBRL) sur la page de téléchargement par lots |
| Exemple | Format d'exemple XBRL fourni dans l'interface utilisateur pour les préparateurs de données |
| Analyse | Analyse XBRL/XML côté serveur dans `POST /api/batch-upload/credit-accounts` |

### 9.4 Chatbot de Litiges — ENT-03

| Contrôle | Mise en Œuvre |
|----------|--------------|
| Composant | `dispute-chatbot.tsx` — interface de chat guidée |
| Intégration | Accessible depuis la page du service d'assistance |
| Flux | Type de problème → recherche d'emprunteur → sélection de compte → description → soumission automatique |
| i18n | Traductions complètes EN/FR sous les clés `chatbot.*` |

---

## 10. Matrice de Conformité (NFR-SEC + ENT)

| Réf. SRS | Exigence | Statut | Détails de mise en œuvre |
|----------|----------|--------|--------------------------|
| NFR-SEC-01 | Contrôle d'accès basé sur les rôles avec 4 rôles | CONFORME | 4 rôles (admin, regulator, lender, viewer) avec middleware `requireRole` côté serveur sur toutes les routes protégées. Matrice d'accès complète mise en œuvre. |
| NFR-SEC-02 | Hachage des mots de passe | CONFORME | bcryptjs avec 10 tours de salage. Mots de passe hachés à la création et au changement. Le texte en clair n'est jamais stocké ni retourné dans les réponses API. |
| NFR-SEC-03 | Complexité du mot de passe (8+ caractères, majuscule, minuscule, chiffre, spécial) | CONFORME | Validation par regex sur le point d'accès de changement de mot de passe. Appliqué côté serveur. |
| NFR-SEC-04 | Verrouillage du compte après 3 tentatives échouées | CONFORME | Seuil de 3 tentatives avec verrouillage de 15 minutes. Compteur de tentatives échouées et expiration du verrouillage suivis dans la base de données. Journalisé dans l'audit. |
| NFR-SEC-05 | Journalisation d'audit complète | CONFORME | Toutes les opérations CRUD, événements d'authentification et appels API journalisés dans la table `audit_logs` avec identifiant utilisateur, action, entité, détails, IP et horodatage. |
| NFR-SEC-06 | Suivi des adresses IP dans les journaux d'audit | CONFORME | `req.ip` capturé avec `trust proxy` activé. IP stockée dans la colonne `ip_address` de `audit_logs`. |
| NFR-SEC-07 | Créateur-vérificateur (principe des quatre yeux) | CONFORME | Flux d'approbation en attente pour les modifications d'emprunteurs et de comptes de crédit. Prévention de l'auto-approbation appliquée côté serveur avec HTTP 403. |
| NFR-SEC-08 | Expiration du mot de passe à 90 jours | CONFORME | Horodatage `passwordChangedAt` vérifié à la connexion. Indicateur `mustChangePassword` pour le changement forcé. Dialogue de changement de mot de passe présenté à l'utilisateur. |
| NFR-SEC-09 | Délai d'inactivité de session de 15 minutes | CONFORME | Horodatage `lastActivity` mis à jour à chaque requête. Session détruite lorsque l'inactivité dépasse 15 minutes (900 000 ms). HTTP 440 retourné. |
| ENT-01 | Authentification multifacteur TOTP | CONFORME | TOTP via la bibliothèque `otpauth` ; points d'accès setup/verify/disable/login ; champs `mfaSecret` et `mfaEnabled` sur la table users ; intégration complète du flux de connexion. |
| ENT-02 | Correspondance floue d'entités pour la détection de doublons | CONFORME | Extension PostgreSQL `pg_trgm` activée au démarrage ; recherche de similarité par trigrammes avec seuil ≥ 0,3 ; avertissement de doublon lors de l'enregistrement d'emprunteur. |
| ENT-03 | Assistant chatbot guidé pour les litiges | CONFORME | Flux de chat multi-étapes : type de problème → recherche d'emprunteur → sélection de compte → description → soumission automatique ; i18n complète EN/FR. |
| ENT-04 | Authentification par jeton porteur OAuth 2.1 | CONFORME | Autorisation par identifiants client ; jetons JWT signés avec HS256 ; expiration d'1 heure ; double authentification (Bearer + X-API-Key) sur l'API externe. |
| ENT-05 | Optimisations pour faible bande passante | CONFORME | Middleware `compression` gzip ; découpage de code `React.lazy()` avec repli `Suspense` pour tous les composants de route. |
| ENT-06 | Prise en charge du téléchargement par lots XBRL/XML | CONFORME | Analyse de fichiers XBRL/XML dans le point d'accès de téléchargement par lots ; frontend à onglets (JSON/CSV + XBRL) ; format d'exemple fourni. |
| ENT-07 | Chaîne de hachage de journal d'audit à preuve de falsification | CONFORME | Chaîne de hachage SHA-256 (colonnes `previousHash`/`currentHash`) ; point d'accès `GET /api/audit/verify-integrity` ; badge visuel d'intégrité sur la page de piste d'audit. |
| REQ-RET-01 | Rétention des données | CONFORME | Politiques de rétention par pays appliquées à travers les 54 juridictions africaines (Ghana 10 ans, Éthiopie/Ouganda/Libéria 7 ans, autres configurables ; journaux d'audit 10 ans globalement). Moteur d'Application de Rétention avec planificateur automatisé de 24 heures et déclenchement manuel réservé aux administrateurs. SQL paramétré via Drizzle ORM ; noms de tables validés par rapport à la liste autorisée `VALID_TABLES` ; valeurs de pays validées par rapport à l'ensemble `VALID_COUNTRIES`. |
| ENT-11 | Recherche Globale | CONFORME | Recherche inter-entités sur les emprunteurs, institutions et comptes de crédit via le point d'accès `/api/global-search`. Filtre optionnel par pays. Aucune exposition de données sensibles au-delà du niveau d'accès de l'utilisateur authentifié. |
| ENT-12 | Sécurité des Téléversements de Fichiers | CONFORME | Téléversement basé sur multer avec limites de taille de fichier (5 Mo photos, 10 Mo documents), validation des types MIME, noms de fichiers aléatoires, service protégé par authentification via la route `/uploads`. Tous les téléversements sont journalisés dans l'audit. |
| ENT-13 | Environnement de Démonstration | CONFORME | Démonstration pour investisseurs avec cartes de rôle pré-configurées. Bannière ambre indiquant le mode démonstration. Utilise l'infrastructure d'authentification et d'autorisation existante. Données fictives uniquement. |
| SLA-RET-01 | SLA d'application de la rétention | CONFORME | Cycle d'application automatisé de 24 heures assurant une gestion opportune du cycle de vie des données. Déclenchement manuel via `POST /api/retention-policies/enforce` (réservé aux administrateurs, protégé par RBAC). Toutes les actions d'application sont journalisées dans l'audit avec les détails complets des résultats. |

---

## 11. Gestion des Signaux et Résilience

L'application met en œuvre une gestion défensive des signaux :

```typescript
process.on("SIGHUP", () => { /* ignorer le signal de raccrochage */ });
process.on("SIGPIPE", () => { /* ignorer le tube brisé */ });
process.on("uncaughtException", (err) => { console.error("Uncaught exception:", err); });
process.on("unhandledRejection", (err) => { console.error("Unhandled rejection:", err); });
```

- SIGHUP ignoré pour prévenir la terminaison déclenchée par le flux de travail
- SIGPIPE ignoré pour prévenir les plantages par tube brisé
- Les exceptions non capturées et les rejets non gérés sont journalisés mais ne font pas planter le processus

---

## 12. Limitations Connues et Recommandations

### 12.1 Limitations Actuelles

| Domaine | Limitation | Niveau de risque | Recommandation |
|---------|-----------|------------------|----------------|
| Stockage de session | MemoryStore (non persistant) | Moyen | Utiliser Redis ou un stockage de session PostgreSQL pour les clusters de production |
| Cookie Secure | Défini à `false` par défaut | Élevé | Définir `cookie.secure = true` lorsque HTTPS est configuré |
| Limitation du débit | Non implémentée sur les points d'accès API | Moyen | Ajouter un middleware de limitation du débit (par ex., express-rate-limit) |
| CORS | Non configuré explicitement | Faible | Configurer les en-têtes CORS si le frontend est servi depuis une origine différente |
| CSP | Pas d'en-têtes de politique de sécurité du contenu | Faible | Ajouter des en-têtes CSP via middleware ou proxy inverse |
| Historique des mots de passe | Non suivi | Faible | Suivre les hachages de mots de passe précédents pour prévenir la réutilisation |
| Clustering de sessions | MemoryStore est limité à un seul nœud | Élevé | Utiliser Redis pour les déploiements multi-nœuds |

### 12.2 Recommandations de Durcissement pour la Production

1. **Activer HTTPS** et définir `cookie.secure = true`
2. **Remplacer MemoryStore** par Redis pour le stockage de sessions dans les environnements multi-nœuds
3. **Ajouter la limitation du débit** sur les points d'accès de connexion et d'API
4. **Mettre en œuvre une politique CORS** basée sur l'architecture de déploiement
5. **Ajouter des en-têtes de politique de sécurité du contenu**
6. **Mettre en place l'agrégation des journaux** (pile ELK, Datadog, etc.)
7. **Activer SSL pour la base de données** avec `sslmode=verify-full`
8. **Effectuer des tests de pénétration** avant la mise en production
9. **Mettre en œuvre le chiffrement de la base de données au repos** si requis par la juridiction
10. **Réviser et effectuer la rotation** de tous les identifiants et secrets par défaut
11. **Imposer l'AMF** pour les rôles admin et régulateur en production
12. **Effectuer la rotation des clés de signature JWT OAuth** périodiquement

---

## 13. Cycle de Vie des Données et Sécurité de la Rétention

### 13.1 Moteur d'Application de Rétention

Le système inclut un Moteur d'Application de Rétention automatisé responsable de l'application des politiques de cycle de vie des données conformément aux exigences réglementaires par pays.

| Contrôle | Mise en Œuvre |
|----------|--------------|
| Planificateur | Cycle automatisé de 24 heures ; le moteur s'exécute une fois toutes les 24 heures |
| Déclenchement manuel | `POST /api/retention-policies/enforce` — réservé aux administrateurs, protégé par RBAC via `requireRole("admin")` |
| Emplacement du moteur | `server/retention-enforcement.ts` |

### 13.2 Politiques de Rétention par Pays

Les politiques de rétention sont configurables par juridiction à travers les 54 pays africains. Les politiques par défaut incluent :

| Pays | Période de rétention | Remarques |
|------|----------------------|-----------|
| Ghana | 10 ans | Conforme aux exigences de la loi ghanéenne sur la protection des données |
| Éthiopie | 7 ans | Rétention standard des données financières |
| Ouganda | 7 ans | Rétention standard des données financières |
| Libéria | 7 ans | Rétention standard des données financières |
| Autres pays africains | Configurable | Les administrateurs peuvent définir les politiques par pays via la table retention_policies |
| Journaux d'audit | 10 ans (global) | Appliqué uniformément dans toutes les juridictions |

### 13.3 Prévention de l'Injection SQL dans le Moteur de Rétention

Le Moteur d'Application de Rétention emploie plusieurs couches de protection contre l'injection SQL :

| Contrôle | Mise en Œuvre |
|----------|--------------|
| SQL paramétré | Utilise exclusivement les modèles balisés `sql` de Drizzle ORM — aucune interpolation de chaînes dans les requêtes |
| Validation des noms de tables | Les noms de tables sont validés par rapport à une liste autorisée codée en dur (constante `VALID_TABLES`) ; tout nom de table absent de la liste est rejeté |
| Validation des valeurs de pays | Les valeurs de pays sont validées par rapport à un ensemble `VALID_COUNTRIES` avant utilisation dans les requêtes |
| Intégration ORM | Toutes les requêtes sont construites via Drizzle ORM, qui applique l'exécution de requêtes paramétrées |

### 13.4 Journalisation d'Audit des Actions de Rétention

Toutes les actions d'application de rétention sont entièrement journalisées dans l'audit :

- Chaque exécution d'application crée une entrée de journal d'audit avec le type d'action `RETENTION_ENFORCEMENT`
- Les résultats incluent le nombre d'enregistrements évalués, supprimés et conservés par table et par pays
- Les déclenchements manuels journalisent l'utilisateur administrateur initiateur
- Les exécutions automatisées journalisent le système comme acteur
- Les détails complets des résultats sont stockés dans le champ `details` du journal d'audit

---

## 14. Approbation

| Rôle | Nom | Signature | Date |
|------|-----|-----------|------|
| Responsable de la sécurité | | | |
| Responsable technique | | | |
| Responsable de la conformité | | | |
| Représentant du client | | | |
