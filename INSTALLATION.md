# 📦 INSTALLATION.md - Guide d'Installation de l'écosystème AKPBF ERP

Ce document détaille toutes les étapes de configuration et de mise en route de l'application ERP AKPBF localement ou sur des serveurs de recette.

---

## 📋 Prérequis Requis

Pour faire tourner le logiciel, vérifiez que votre poste ou serveur dispose des outils suivants :
- **Node.js :** Version `18.x` ou supérieure (v20+ préconisée).
- **npm :** Version `9.x` ou supérieure.
- **PostgreSQL :** Instance de base de données à disposition (v15+) ou Docker installé.

---

## 🚀 Étape 1 : Téléchargement et Décompression

Si vous importez l'archive ou le projet depuis Git :
```bash
# Clone du dépôt
git clone https://github.com/groupaksservices/akpbf-erp-abidjan.git
cd akpbf-erp-abidjan
```

---

## 🛠️ Étape 2 : Installation des Dépendances npm

L'installation des paquets du Frontend et du Backend d'entreprise se fait en une seule exécution grâce à la synergie de notre `package.json` unifié :

```bash
npm install
```
*Note : Cette commande résout et installe toutes les dépendances de typages TypeScript, les protocoles de chiffrement bcrypt, la validation de token JWT, ainsi que les composants graphiques du frontend.*

---

## 🔑 Étape 3 : Déclaration des Variables d'Environnement

Créez le fichier de configuration de l'index de démarrage `.env` :

```bash
cp .env.example .env
```

Modifiez le fichier `.env` nouvellement créé pour y saisir vos clés d'infrastructures réelles :

```env
# URL d'accès de votre serveur de base PostgreSQL
DATABASE_URL="postgresql://akpbf_app_user:AppKeySecurity_2026_Abidjan@localhost:5432/akpbf_erp_prod?schema=public"

# Clé secrète robuste d'encryptage des signatures JWT
JWT_SECRET="votre_cle_secrete_ultra_robuste_akpbf_2026_uemoa"

# Clé API Google Gemini pour l'IA prédictive opérationnelle (Optionnel)
GEMINI_API_KEY="votre_cle_gemini_api_réelle"
```

---

## 🤖 Étape 4 : Initialisation Prisma & Modélisation de Base

Déployez la structure logique du système de salubrité :

```bash
# 1. Analyse et exécution des requêtes SQL de création de tables et clés étrangères
npx prisma migrate dev --name deploy_production_architecture

# 2. Compilation et génération des types natifs du client d'accès Prisma
npx prisma generate

# 3. Injection automatique des jeux de données opérationnels essentiels (Seeding)
npx prisma db seed
```

---

## 💻 Étape 5 : Lancement Applicatif

Plusieurs scripts intégrés facilitent l'exécution de l'ERP :

### Mode Développement (avec recompilation en temps réel)
```bash
npm run dev
```
L'application orchestre simultanément l'API Express, la liaison asynchrone d'intelligence IA et distribue l'interface React en se liant au port `3000`. Accédez à [http://localhost:3000](http://localhost:3000).

---

## 🏗️ Étape 6 : Compilation et Lancement de Production

Afin d'obtenir des performances d'affichage maximales et d'épurer l'espace mémoire :

```bash
# 1. Compiler les assets statiques et bundler le serveur en format autonome CommonJS (.cjs)
npm run build

# 2. Démarrer le serveur de conteneur optimisé de production
npm run start
```
Le serveur s'initialisera instantanément à partir de `dist/server.cjs` pour une rentabilité optimale de ressources.
