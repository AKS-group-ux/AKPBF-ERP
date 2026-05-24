# 🏗️ ARCHITECTURE.md - Architecture de l'Écosystème ERP AKPBF d'Abidjan

Ce document présente l'architecture logicielle de l'ERP AKPBF, entreprise chargée d'assainissement et salubrité publique du district d'Abidjan (Plateau, Cocody, Yopougon, Marcory).

---

## 🗺️ 1. Vue d'Ensemble du Flux de Données

L'application est construite sur un patron full-stack entièrement découplé mais hautement intégré :

```
      +----------------------------------------------------+
      |                  PORTAIL CLIENT /                  |
      |             INTERFACE ADM (REACT WEB SPA)          |
      +-------------------------+--------------------------+
                                |
                   Requêtes HTTPS (Bearer JWT)
                                |
                                v
      +----------------------------------------------------+
      |            SERVEUR EXPRESS API SECURE              |
      |   (Filtres Sécurité, RBAC, Rate-Limit, Brain AI)   |
      +-------------------------+--------------------------+
                                |
                       Requêtes Prisma ORM
                                |
                                v
      +----------------------------------------------------+
      |                 BASE POSTGRESQL DB                 |
      |           (UUID, Indices, Clés, Contraintes)       |
      +----------------------------------------------------+
```

---

## 📦 2. Organisation Structurelle des Dossiers

L'organisation des fichiers de l'ERP suit les meilleures pratiques de la *Clean Architecture* :

```
├── /backend/src/           # Code source du Serveur API
│   ├── /config/            # Connecteurs base de données & dotenv variables
│   ├── /controllers/       # Logiques financières, GPS, factures et auth
│   ├── /middleware/        # Boucliers Sécurité, Auth sessions, RBAC, Validation et Handler Erreurs
│   ├── /routes/            # Mappages d'endpoints API (/api/auth et /api/operations)
│   ├── /utils/             # Générateurs bcrypt/jwt de cryptographie
│   └── /validators/        # Schémas sanitaires Zod d'arguments de requêtes
├── /prisma/                # Couche d'accès aux données (Prisma Schema & Seeds)
├── /src/                   # Code source de l'application Web React
│   ├── /components/        # Vues métiers (Facturation, Suivi GPS, Audit IA)
│   ├── /context/           # Fournisseur de session AuthContext
│   ├── /services/          # Couche d'intégration API HTTP configurée via Axios
│   ├── App.tsx             # Gestionnaire d'itinéraires et mise en page
│   └── main.tsx            # Montage du DOM enveloppé par le protecteur ErrorBoundary
└── package.json            # Déclarations des dépendances et scripts
```

---

## 🧩 3. Composants Clés du Système

### A. Frontend React (Single Page Application)
- **Vite & Tailwind CSS :** Pour un rendu asynchrone ultra-rapide et responsive adapté aux terminaux de terrain d'Abidjan.
- **Axios Interceptors :** Gestion centralisée du rafraîchissement des jetons d'accès, des tentatives de secours sur erreurs transitoires et de l'interception automatique des déconnexions.
- **ErrorBoundary protection :** Bouclier isolant de premier plan contre les pannes d'interface utilisateur pour offrir un fonctionnement ininterrompu aux équipes opérationnelles.

### B. REST API SECURE (Express Controller-Service)
- **Audit & Logs Actifs :** Trace l'intégralité des requêtes, des méthodes et des IP d'Abidjan pour des raisons de conformité légale.
- **Intelligence Artificielle (Gemini SDK) :** Intègre le moteur AKPBF-Brain capable d'auditer les variations comptables et simuler les plans de continuité lors de catastrophes locales.

### C. Couche Persistance (PostgreSQL & Prisma)
- **Système d'identifiants structurés :** Usage généralisé d'UUID combiné à des codes de référence lisibles (`ABJ-xxxx`).
- **Isolation d'écriture :** Transactions sécurisées pour éviter des corruptions financières de balance de facturation.
