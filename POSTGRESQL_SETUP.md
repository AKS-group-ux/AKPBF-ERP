# 🐘 POSTGRESQL_SETUP.md - Guide de Déploiement et d'Exploitation de la Base de Données

Ce document sert de guide de référence pour installer, configurer, restaurer et surveiller la base de données relationnelle PostgreSQL de l'ERP AKPBF d'Abidjan.

---

## 🛠️ 1. Installation de PostgreSQL (Ubuntu / Debian LTS)

1. Mettre à jour les dépôts d'APT et installer le serveur PostgreSQL ainsi que l'utilitaire contrib :
   ```bash
   sudo apt update
   sudo apt install postgresql postgresql-contrib -y
   ```
2. Démarrer et activer le service postgres au démarrage :
   ```bash
   sudo systemctl start postgresql
   sudo systemctl enable postgresql
   ```
3. Se connecter au shell d'administration :
   ```bash
   sudo -i -u postgres psql
   ```
4. Créer la base de données et l'administrateur de l'ERP :
   ```sql
   CREATE DATABASE akpbf_erp;
   CREATE USER akpbf_admin WITH PASSWORD 'AKPBF_secure_2026_password';
   GRANT ALL PRIVILEGES ON DATABASE akpbf_erp TO akpbf_admin;
   ALTER DATABASE akpbf_erp OWNER TO akpbf_admin;
   \q
   ```

---

## ⚙️ 2. Configuration du fichier `.env`

Définissez la clé `DATABASE_URL` dans le fichier `.env` à la racine de votre application pour brancher Prisma :

```env
# .env
DATABASE_URL="postgresql://akpbf_admin:AKPBF_secure_2026_password@localhost:5432/akpbf_erp?schema=public"
JWT_SECRET="votre_cle_secrete_uemoa_akpbf_2026"
JWT_EXPIRES_IN="24h"
GEMINI_API_KEY="AIzaSy..."
```

---

## 🏗️ 3. Gestion Schema Prisma, Migrations & Seeds

### A. Valider et formater le fichier de schéma
```bash
npx prisma validate
npx prisma format
```

### B. Créer et appliquer une migration de production
```bash
npx prisma migrate dev --name init_akpbf_erp
```

### C. Déployer de manière industrielle sur un container de production (sans recréer la base)
```bash
npx prisma migrate deploy
```

### D. Remplir avec les données initiales de référence (Seeds)
```bash
npx prisma db seed
```

---

## 📦 4. Gestion des Sauvegardes (Automatisées)

Pour éviter toute perte d'historique de facturation citoyenne d'Abidjan :

### A. Sauvegarde à chaud (Backup)
Générez un fichier compressé SQL contenant l'intégralité du schéma, des transactions et de la table d'audit :
```bash
pg_dump -U akpbf_admin -h localhost -d akpbf_erp -F c -b -v -f /var/backups/akpbf_dump_$(date +%F).backup
```

### B. Restauration d'Urgence (Restore)
1. Recréez la base vierge :
   ```sql
   DROP DATABASE IF EXISTS akpbf_erp;
   CREATE DATABASE akpbf_erp;
   ```
2. Restaurez le fichier compressé à l'aide de l'outil `pg_restore` :
   ```bash
   pg_restore -U akpbf_admin -h localhost -d akpbf_erp -v /var/backups/akpbf_dump_xxxx-xx-xx.backup
   ```

---

## 📊 5. Télémétrie & Monitoring de Santé SQL

Afin de préserver des temps de réponse rapides (< 50ms) sur les requêtes géographiques et financières :

1. **Identifier les requêtes lentes (Slow Queries) :**
   Activez l'extension `pg_stat_statements` dans votre fichier `postgresql.conf` :
   ```sql
   CREATE EXTENSION pg_stat_statements;
   ```
2. **Mesurer l'utilisation des indices :**
   S'assurer que les tables `users`, `customers` et `invoices` exploitent pleinement les index d'identifiants :
   ```sql
   SELECT relname, 100 * idx_scan / (seq_scan + idx_scan) AS percent_of_times_indexed_used 
   FROM pg_stat_user_tables 
   WHERE (seq_scan + idx_scan) > 0;
   ```
3. **Surveiller le nombre de connexions ouvertes :**
   ```sql
   SELECT count(*), state FROM pg_stat_activity GROUP BY state;
   ```
