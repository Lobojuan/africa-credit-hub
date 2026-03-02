# Guide de Déploiement

## Système Central de Hub de Données Inter-Juridictionnel et Registre de Crédit v1.2

**Préparé pour :** Systems In Motion Limited  
**Version du Document :** 1.2  
**Date :** Mars 2026

---

## 1. Aperçu

Ce guide fournit des instructions de déploiement étape par étape pour le Système de Registre de Crédit. L'application se compose d'un frontend React servi par un backend Express.js, avec PostgreSQL comme base de données. Deux scénarios de déploiement sont couverts : le déploiement sur Replit et le déploiement général sur Linux/Docker.

---

## 2. Prérequis

### 2.1 Exigences Logicielles

| Composant | Version Minimale | Objectif |
|-----------|-----------------|----------|
| Node.js | 18.x ou ultérieur | Environnement d'exécution |
| npm | 9.x ou ultérieur | Gestion des paquets |
| PostgreSQL | 14.x ou ultérieur | Serveur de base de données |
| Git | 2.x ou ultérieur | Contrôle de version |

### 2.2 Exigences Matérielles

| Ressource | Minimum | Recommandé |
|-----------|---------|------------|
| CPU | 1 vCPU | 2+ vCPU |
| RAM | 512 Mo | 2 Go+ |
| Disque | 1 Go | 5 Go+ (espace supplémentaire requis pour les photos et documents d'identité téléversés dans le répertoire `uploads/`) |
| Réseau | 1 Mbps | 10 Mbps+ |

### 2.3 Exigences Réseau

- Accès sortant vers la base de données PostgreSQL (port 5432 ou spécifique au fournisseur)
- Accès entrant sur le port de l'application (par défaut 5000)
- Terminaison HTTPS (via un proxy inverse ou fournie par la plateforme)
- Accès HTTPS sortant vers `api.dicebear.com` (avatars auto-générés pour les emprunteurs)
- Accès HTTPS sortant vers `open.er-api.com` (récupération des taux de change en direct)

---

## 3. Variables d'Environnement

| Variable | Obligatoire | Description | Exemple |
|----------|-------------|-------------|---------|
| `DATABASE_URL` | Oui | Chaîne de connexion PostgreSQL | `postgresql://user:pass@host:5432/dbname?sslmode=require` |
| `SESSION_SECRET` | Oui (production) | Clé de chiffrement de session Express (min 32 caractères) | `a-long-random-string-at-least-32-characters` |
| `PORT` | Non | Port de l'application (par défaut : 5000) | `5000` |
| `NODE_ENV` | Non | Mode d'environnement (development/production) | `production` |

### 3.1 Génération d'un Secret de Session

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

---

## 4. Configuration de la Base de Données

### 4.1 Provisionnement PostgreSQL

Le système nécessite une base de données PostgreSQL. Les options incluent :

- **Neon** (PostgreSQL serverless, recommandé pour Replit)
- **Amazon RDS** pour les charges de travail en production
- **PostgreSQL auto-hébergé** sur des serveurs Linux
- **PostgreSQL Docker** pour les déploiements conteneurisés

### 4.2 Extensions PostgreSQL

L'application nécessite l'extension PostgreSQL suivante :

- **pg_trgm** — Similarité par trigrammes pour la correspondance floue des entités (ENT-02). Activée automatiquement au démarrage de l'application via `CREATE EXTENSION IF NOT EXISTS pg_trgm`.

Assurez-vous que l'utilisateur PostgreSQL dispose des permissions pour créer des extensions, ou pré-créez-la :
```sql
CREATE EXTENSION IF NOT EXISTS pg_trgm;
```

### 4.3 Initialisation du Schéma

L'application utilise Drizzle ORM pour la gestion du schéma. Au premier démarrage, l'application effectuera automatiquement :

1. Connexion à la base de données via `DATABASE_URL`
2. Activation de l'extension `pg_trgm` pour la correspondance floue
3. Déploiement du schéma via Drizzle (21 tables)
4. Insertion des données initiales (utilisateurs, emprunteurs, comptes de crédit, etc.)

Pour déployer manuellement le schéma :

```bash
npx drizzle-kit push
```

### 4.3 Données Initiales

Le processus d'insertion (`server/seed.ts`) crée :

- 6 utilisateurs système avec des identifiants prédéfinis
- 102 462 emprunteurs à travers les 54 pays africains
- 100 020 institutions
- 172 359 comptes de crédit
- 120 000 enregistrements d'historique de paiement
- 25 004 demandes de renseignements de crédit
- 15 000 enregistrements de consentement
- 5 063 journaux d'audit
- 3 218 litiges
- 2 147 jugements de tribunal
- 120 enregistrements de facturation

**Identifiants par défaut (à modifier en production) :**

| Nom d'utilisateur | Mot de passe | Rôle | Institution |
|-------------------|--------------|------|-------------|
| admin | admin123 | Admin | NBE |
| regulator1 | reg123 | Régulateur | NBE |
| cbe_user | cbe123 | Prêteur | CBE |
| dashen_user | dashen123 | Prêteur | Dashen |
| awash_user | awash123 | Prêteur | Awash |

### 4.4 Configuration du Pool de Connexions

L'application utilise un pool de 2 connexions à la base de données par défaut (`server/db.ts`). Pour les déploiements à fort trafic, augmentez la taille du pool :

```typescript
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,
});
```

---

## 5. Processus de Compilation

### 5.1 Installation des Dépendances

```bash
npm install
```

### 5.2 Compilation pour la Production

```bash
npm run build
```

Cela exécute deux étapes de compilation :

1. **Compilation du backend** (esbuild) : Compile le code TypeScript du serveur en `dist/index.cjs`
2. **Compilation du frontend** (Vite) : Compile l'application React dans `dist/public/`

### 5.3 Structure des Fichiers Compilés

```
dist/
  index.cjs          # Bundle serveur compilé (CommonJS)
  public/             # Ressources frontend compilées
    index.html
    assets/
      *.js            # Bundles JavaScript
      *.css           # Bundles de feuilles de style
```

---

## 6. Démarrage en Production

### 6.1 Lancement de l'Application

```bash
NODE_ENV=production node dist/index.cjs
```

Le serveur va :
1. Se connecter à PostgreSQL
2. Exécuter le processus d'insertion des données initiales (idempotent, ignoré si les données existent)
3. Servir le frontend depuis `dist/public/`
4. Écouter sur le PORT configuré (par défaut 5000)

### 6.2 Gestion des Processus

Pour la production, utilisez un gestionnaire de processus :

**Avec PM2 :**
```bash
npm install -g pm2
NODE_ENV=production pm2 start dist/index.cjs --name credit-registry
pm2 save
pm2 startup
```

**Avec systemd :**
```ini
[Unit]
Description=Credit Registry System
After=network.target

[Service]
Type=simple
User=appuser
WorkingDirectory=/opt/credit-registry
Environment=NODE_ENV=production
Environment=DATABASE_URL=postgresql://...
Environment=SESSION_SECRET=your-secret-here
ExecStart=/usr/bin/node dist/index.cjs
Restart=on-failure
RestartSec=10

[Install]
WantedBy=multi-user.target
```

---

## 7. Déploiement Spécifique à Replit

### 7.1 Configuration

L'application est préconfigurée pour le déploiement sur Replit. Le fichier `.replit` définit :

- Commande de compilation : `npm run build`
- Commande d'exécution : `node ./dist/index.cjs`
- Cible de déploiement : Autoscale

### 7.2 Secrets d'Environnement

Sur Replit, configurez les variables d'environnement via l'onglet Secrets :
1. `DATABASE_URL` - Chaîne de connexion PostgreSQL (Neon recommandé)
2. `SESSION_SECRET` - Chaîne aléatoire pour le chiffrement des sessions

### 7.3 Mode Développement

En développement, l'application fonctionne avec le HMR (Hot Module Replacement) de Vite :

```bash
npm run dev
```

Cela démarre :
- Le serveur API Express avec TypeScript via tsx
- Le serveur de développement Vite avec proxy HMR

---

## 8. Déploiement Docker

### 8.1 Dockerfile

```dockerfile
FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine AS runner

WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./

ENV NODE_ENV=production
ENV PORT=5000

EXPOSE 5000

CMD ["node", "dist/index.cjs"]
```

### 8.2 Docker Compose

```yaml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "5000:5000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://postgres:password@db:5432/credit_registry
      - SESSION_SECRET=your-production-secret-here
    depends_on:
      - db
    restart: unless-stopped

  db:
    image: postgres:16-alpine
    environment:
      - POSTGRES_DB=credit_registry
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=password
    volumes:
      - pgdata:/var/lib/postgresql/data
    ports:
      - "5432:5432"

volumes:
  pgdata:
```

### 8.3 Compilation et Exécution

```bash
docker-compose up -d --build
```

---

## 9. Vérifications de Santé

### 9.1 Santé de l'Application

```bash
curl http://localhost:5000/api/health
```

**Réponse Attendue :**
```json
{ "status": "ok" }
```

### 9.2 Santé de l'API Externe

```bash
curl http://localhost:5000/api/external/v1/health
```

**Réponse Attendue :**
```json
{
  "status": "ok",
  "version": "1.1",
  "service": "Systems In Motion Credit Registry API"
}
```

### 9.3 Script de Vérification de Santé

```bash
#!/bin/bash
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5000/api/health)
if [ "$RESPONSE" -eq 200 ]; then
  echo "Vérification de santé réussie"
  exit 0
else
  echo "Vérification de santé échouée avec le statut : $RESPONSE"
  exit 1
fi
```

---

## 10. Configuration du Proxy Inverse

### 10.1 Nginx

```nginx
server {
    listen 80;
    server_name credit-registry.example.com;

    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 10.2 SSL/TLS

Pour la production, utilisez toujours HTTPS. Options :
- **Let's Encrypt** avec certbot pour des certificats SSL gratuits
- **SSL du fournisseur cloud** (AWS ACM, Cloudflare, etc.)
- **Replit** fournit HTTPS automatiquement

---

## 11. Surveillance

### 11.1 Journalisation de l'Application

L'application enregistre toutes les requêtes API vers stdout avec le format :
```
10:30:00 AM [express] GET /api/health 200 in 5ms :: {"status":"ok"}
```

### 11.2 Piste d'Audit

Toutes les actions des utilisateurs sont enregistrées dans la table `audit_logs` avec :
- Identifiant de l'utilisateur et type d'action
- Type et identifiant de l'entité
- Adresse IP
- Horodatage
- Détails lisibles par l'humain

### 11.3 Outils de Surveillance Recommandés

| Outil | Objectif |
|-------|----------|
| PM2 | Surveillance des processus, redémarrage automatique |
| Datadog/New Relic | Surveillance des performances applicatives |
| pgAdmin | Surveillance et gestion de la base de données |
| Grafana + Prometheus | Visualisation des métriques |

---

## 12. Sauvegarde et Récupération

### 12.1 Sauvegarde de la Base de Données

```bash
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql
```

### 12.2 Sauvegardes Automatisées

```bash
# Entrée crontab pour des sauvegardes quotidiennes à 2h du matin
0 2 * * * pg_dump $DATABASE_URL | gzip > /backups/credit_registry_$(date +\%Y\%m\%d).sql.gz
```

### 12.3 Restauration depuis une Sauvegarde

```bash
psql $DATABASE_URL < backup_20250115_020000.sql
```

---

## 13. Dépannage

### 13.1 Problèmes Courants

| Problème | Cause | Solution |
|----------|-------|----------|
| Connexion refusée sur le port 5000 | Application non démarrée | Vérifiez `NODE_ENV`, confirmez que `dist/index.cjs` existe |
| Erreur de connexion à la base de données | `DATABASE_URL` invalide | Vérifiez la chaîne de connexion, contrôlez les règles réseau/pare-feu |
| Session non persistante | `SESSION_SECRET` manquant | Définissez la variable d'environnement `SESSION_SECRET` |
| 440 Session Expirée | Délai d'inactivité de 15 minutes | Reconnectez-vous ; c'est un comportement de sécurité attendu (NFR-SEC-09) |
| Échec de l'insertion initiale au premier démarrage | Tables pas encore créées | Exécutez `npx drizzle-kit push` d'abord, puis redémarrez |
| Échec de la compilation | Dépendances manquantes | Exécutez `npm install` avant `npm run build` |
| Fichiers statiques non servis | Mauvais `NODE_ENV` | Assurez-vous que `NODE_ENV=production` pour le service des fichiers statiques |
| L'API retourne 401 | Non authentifié | Connectez-vous d'abord ; vérifiez que le cookie de session est envoyé |
| L'API retourne 403 | Rôle insuffisant | Vérifiez que le rôle de l'utilisateur correspond aux exigences de la route |

### 13.2 Débogage

Activer la journalisation détaillée :
```bash
DEBUG=* NODE_ENV=production node dist/index.cjs
```

Vérifier la connectivité à la base de données :
```bash
psql $DATABASE_URL -c "SELECT 1"
```

Vérifier la création des tables :
```bash
psql $DATABASE_URL -c "\dt"
```

### 13.3 Optimisation des Performances

- Augmentez la taille du pool de la base de données pour une concurrence accrue
- Activez le pooling de connexions PostgreSQL (PgBouncer)
- Utilisez un CDN pour les ressources statiques du frontend
- La compression gzip est intégrée à l'application via le middleware `compression` (ENT-05) ; la compression par proxy inverse est optionnelle
- Surveillez et indexez les colonnes fréquemment interrogées
- Le découpage de code React.lazy réduit la taille du bundle initial pour des chargements de page plus rapides (ENT-05)

---

## 14. Liste de Contrôle de Renforcement de la Sécurité

- [ ] Modifier tous les identifiants par défaut des données initiales
- [ ] Définir un `SESSION_SECRET` robuste (64+ caractères aléatoires)
- [ ] Activer HTTPS via un proxy inverse ou la plateforme
- [ ] Définir `cookie.secure = true` en production
- [ ] Restreindre l'accès à la base de données à l'IP de l'application uniquement
- [ ] Activer le SSL PostgreSQL (`?sslmode=require`)
- [ ] Mettre en place des sauvegardes automatisées de la base de données
- [ ] Configurer les règles de pare-feu (autoriser uniquement les ports 443/80)
- [ ] Activer la rotation des journaux applicatifs
- [ ] Examiner et restreindre le CORS si nécessaire
- [ ] Mettre en place la surveillance et les alertes
- [ ] Effectuer un audit de sécurité avant la mise en production
- [ ] Imposer l'AMF (ENT-01) pour les comptes administrateurs et régulateurs
- [ ] Effectuer une rotation périodique des clés de signature JWT OAuth (ENT-04)
- [ ] Vérifier l'intégrité des journaux d'audit (ENT-07) dans le cadre des contrôles de sécurité de routine
- [ ] S'assurer que l'extension `pg_trgm` (ENT-02) est disponible dans le PostgreSQL de production
- [ ] Vérifier que les téléversements par lots XBRL/XML (ENT-06) fonctionnent avec les tailles de fichiers attendues ; aucune bibliothèque d'analyse supplémentaire n'est requise au-delà du traitement XML intégré
- [ ] Le chatbot de litiges (ENT-03) ne nécessite aucune configuration supplémentaire ; il utilise les points de terminaison existants de dépôt de litiges
- [ ] Créer et configurer les répertoires de téléversement (`uploads/photos/`, `uploads/documents/`) avec les permissions d'écriture appropriées
- [ ] Vérifier l'accès réseau sortant vers `api.dicebear.com` pour les avatars auto-générés
- [ ] Vérifier l'accès réseau sortant vers `open.er-api.com` pour la récupération des taux de change en direct
- [ ] Configurer les politiques de rétention des données par juridiction selon les exigences réglementaires locales

---

## 15. Dépendances des Améliorations Entreprise

Les paquets supplémentaires suivants ont été ajoutés pour les améliorations entreprise :

| Paquet | Objectif | Amélioration |
|--------|----------|--------------|
| `otpauth` | Génération et vérification de secrets TOTP | ENT-01 (AMF) |
| `jsonwebtoken` | Signature et vérification JWT pour les jetons Bearer | ENT-04 (OAuth 2.1) |
| `compression` | Middleware de compression gzip | ENT-05 (Faible Bande Passante) |
| `multer` | Middleware de téléversement de fichiers pour photos et documents d'identité | ENT-12 (Photos d'Identité) |
| `recharts` | Graphiques de visualisation de données réactifs et thématisés (aire, anneau, barres) | ENT-14 (Analyses Visuelles du Tableau de Bord) |

**Extension PostgreSQL :**
- `pg_trgm` — Requise pour la correspondance floue des entités (ENT-02). Créée automatiquement au démarrage.

---

## 16. Fonctionnalités et Capacités Clés

Le Système de Registre de Crédit comprend les modules et capacités suivants :

| Fonctionnalité | Description |
|----------------|-------------|
| Traitement Multi-Devises | Prise en charge de plus de 42 devises africaines plus USD, EUR, GBP à travers les 54 juridictions |
| Internationalisation (i18n) | Trois langues prises en charge : Anglais (EN), Français (FR) et Portugais (PT) |
| Sélecteur de Langue sur la Page de Connexion | Les utilisateurs peuvent sélectionner leur langue préférée directement depuis l'écran de connexion |
| Gestion des Taux de Change | Module de gestion et de mise à jour des taux de change des devises prises en charge |
| Administration API | Interface d'administration pour la gestion des clés API, la surveillance de l'utilisation et la configuration de l'accès API externe |
| Politiques de Rétention des Données | Politiques de rétention configurables avec un moteur d'application automatisé pour la conformité réglementaire |
| Authentification AMF | Authentification multi-facteurs utilisant TOTP pour les comptes administrateurs et régulateurs (ENT-01) |
| Correspondance Floue des Entités | Recherche d'emprunteurs basée sur les trigrammes utilisant pg_trgm (ENT-02) |
| Chatbot de Litiges | Chatbot interactif pour le dépôt guidé de litiges (ENT-03) |
| API Externe OAuth 2.1 | API REST sécurisée par JWT pour les intégrations tierces (ENT-04) |
| Optimisation Faible Bande Passante | Compression gzip et découpage de code pour les réseaux contraints (ENT-05) |
| Téléversement par Lots (XBRL/XML) | Ingestion de données en masse via des formats de fichiers structurés (ENT-06) |
| Piste d'Audit Inviolable | Journaux d'audit chaînés par hachage avec vérification d'intégrité (ENT-07) |
| Recherche Globale | Recherche inter-entités sur les emprunteurs, institutions et comptes de crédit (ENT-11) |
| Photos d'Identité et Documents | Téléversement de photos de profil et de documents d'identité via multer avec avatars DiceBear (ENT-12) |
| Environnement de Démonstration | Mode de démonstration en un clic pour investisseurs avec cartes de rôle et bannière de démonstration (ENT-13) |
| Analyses Visuelles du Tableau de Bord | Graphiques interactifs Recharts (tendance en aire, anneau des statuts, barres horizontales des types) et carte choroplèthe SVG de l'Afrique avec coloration thermique à travers les 54 pays ; prise en charge du mode sombre (ENT-14) |
| Visite Guidée Interactive de Démonstration | Parcours guidé en 11 étapes avec surcouche projecteur, lancement automatique après connexion démo, prise en charge multilingue dans les 5 langues de l'UA (ENT-15) |

---

## 17. Informations de Version

| Composant | Version |
|-----------|---------|
| Application | v1.2 (Améliorations Entreprise) |
| Environnement d'exécution Node.js | 20.x LTS |
| Express.js | 4.x |
| Drizzle ORM | Dernière version |
| Vite | 5.x |
| React | 18.x |
| PostgreSQL | 14+ |
| TypeScript | 5.x |
| otpauth | Dernière version (ENT-01) |
| jsonwebtoken | Dernière version (ENT-04) |
| compression | Dernière version (ENT-05) |
| multer | Dernière version (ENT-12) |
