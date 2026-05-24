# 🚀 DEPLOYMENT.md - Guide de Déploiement Intégral en Production

Ce document décrit la procédure étape par étape pour automatiser l'intégration, construire l'image Docker de production et propulser l'application full-stack sur Google Cloud Run.

---

## 🏛️ 1. Stratégie du Build et de l'Exécution (Optimisée)

L'ERP AKPBF combine le serveur d'API Express (TypeScript) et les fichiers statiques construits de React dans un conteneur unique de taille réduite grâce à une compilation à plat :

```
                                  [Code Source]
                                        |
                 +----------------------+----------------------+
                 |                                             |
          (Vite compiler)                               (Esbuild bundler)
                 |                                             |
                 v                                             v
        [dist/index.html & assets]                      [dist/server.cjs]
                 |                                             |
                 +----------------------+----------------------+
                                        |
                                        v
                            [Production Image Docker]
                                        |
                                        v
                              [Google Cloud Run]
```

### Script de construction du package (`package.json`)
```bash
npm run build
```
Ce script compile d'abord la partie cliente web (`vite build`) pour stocker les fichiers statiques dans `/dist`. Il fait ensuite appel à **Esbuild** pour lier de manière compacte tout le backend dans `/dist/server.cjs` (en format CommonJS standalone stable pour éliminer les problèmes de liaisons relatives d'ESM).

*La commande de lancement en production simplifiée est alors :*
```bash
npm start
```
*(Équivalent à `node dist/server.cjs`)*

---

## 🐳 2. Fichier Dockerfile de Production (Optimisé multi-stage)

Créez un conteneur d'exécution Docker scindé en deux étapes pour éviter les dépendances de développement en production :

```dockerfile
# STEP 1: Builder
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
# S'assurer d'accéder au client Prisma de production
RUN npx prisma generate
RUN npm run build

# STEP 2: Runner (Compact et sans dépendances de développement)
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
COPY package*.json ./
RUN npm ci --only=production
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
# Générer le client Prisma de production
RUN npx prisma generate

EXPOSE 3000
CMD ["npm", "start"]
```

---

## ☁️ 3. Déploiement sur Google Cloud Run

Pour déployer en quelques secondes après configuration de votre projet Google Cloud :

1. **Construire et publier l'image dans Artifact Registry :**
   ```bash
   gcloud builds submit --tag gcr.io/votre-projet-gcp/akpbf-erp:latest .
   ```
2. **Déployer sur Google Cloud Run (avec injecteurs .env sécurisés) :**
   ```bash
   gcloud run deploy akpbf-erp \
     --image gcr.io/votre-projet-gcp/akpbf-erp:latest \
     --platform managed \
     --region europe-west2 \
     --allow-unauthenticated \
     --port 3000 \
     --set-env-vars="NODE_ENV=production,PORT=3000,JWT_SECRET=MonSuperSecretAKPBF,DATABASE_URL=postgresql://akpbf_admin:MonMotDePasse@votre-ip:5432/akpbf_erp"
   ```
3. **Configurer les permissions (HSTS et Iframes AI Studio) :**
   Assurez-vous que l'URL d'ingress est configurée pour utiliser des certificats HTTPS de bout en bout (géré nativement par Cloud Run).
