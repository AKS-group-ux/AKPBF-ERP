# 🌍 AKPBF ERP - Plateforme de Gestion de la Salubrité Urbaine d'Abidjan

AKPBF ERP (Assainissement, Kiosques et Propreté de la Boucle du Fleuve) est une solution logicielle d'entreprise de classe de production conçue pour numériser, automatiser et optimiser la gestion de la collecte des ordures ménagères, la facturation des abonnés et le suivi de la flotte de salubrité urbaine dans les grands districts municipaux, notamment à Abidjan (Côte d'Ivoire).

---

## 🚀 Caractéristiques Clés du Système

### 1. 📋 Portail Citoyen Public (Landing Page) & Abonnements
- **Présentation interactive** des services municipaux de collecte des ordures et de salubrité.
- **Grille tarifaire dynamique** avec sélections directes de forfaits abonnés adaptés.
- **Formulaire de demande d'abonnement en ligne** avec géolocalisation et attribution automatique d'identifiants de type (`ABJ-...`).
- **Module de dépôt de réclamations** relié à une gestion de tickets d'intervention technique rapide sous 24h.

### 2. 🔐 Authentification & Contrôle d'Accès Basé sur les Rôles (RBAC)
- Authentification unifiée et résiliente pour rôles d'entreprise via **JWT (JSON Web Tokens)**.
- Rôles structurés prédéfinis :
  - **ADMINISTRATEUR :** Accès de contrôle global sur l'ERP.
  - **COMPTABLE :** Gestion de la balance abonnés, factures en souffrance et taux de recouvrement.
  - **SUPERVISEUR :** Logistique industrielle, allocation de tournées et pilotage des chauffeurs.
  - **CHAUFFEUR/AGENT :** Vue mobile de terrain, scanneur de bacs RFID/QR et itinéraires optimisés.
  - **CLIENT :** Portail d'accès personnel pour payer des factures, déclarer un déménagement ou soumettre un ticket.

### 3. 🗺️ Télémétrie Georéférencée & Logistique de Flotte (SIG)
- Télémétrie de suivi de camion en temps réel sur carte topographique interactive (Cocody, Marcory, Yopougon, Plateau).
- **Poubelles connectées IoT :** Capteurs de niveau de remplissage en temps réel (0-100%) avec indicateurs de débordement de bacs.
- Algorithme d'optimisation d'itinéraire basé sur des grappes géographiques régionales.

### 4. 🧠 AKPBF-Brain v3.5 - Décisionnel IA (Gemini Model Integration)
- Analyse prédictive des risques de défaut de paiement abonnés.
- **Simulateur de réponses en de cas d'urgence opérationnelle** (pénuries d'essence, grèves syndicales, inondations de saison pluviale à Abidjan).
- Analyse financière SWOT modélisée pour rationaliser les coûts du parc.

---

## 🛠️ Architecture Technologique

- **Frontend :** SPA moderne en React 19, Vite, Tailwind CSS, Recharts et Framer Motion (micro-animations).
- **Backend :** API REST modulaire en Express & Node.js avec types de sécurité TypeScript stricts.
- **Persistance :** PostgreSQL v15+ configuré via l'ORM Prisma, prêt pour l'intégration de production.

---

## 📂 Organisation du Code Source

```bash
├── backend/                  # API Rest Modulaire Node/Express
│   ├── src/
│   │   ├── controllers/      # Logique de contrôle (Auth, Abonnés, Logistique)
│   │   ├── middleware/       # Intercepteurs de sécurité JWT, limitations de débit (rate limiting)
│   │   ├── routes/           # Routes des endpoints Rest (API et Auth)
│   │   ├── utils/            # Logique utilitaire (générateurs, cryptographie)
│   │   └── app.ts            # Configuration Express de production
├── prisma/                   # Schéma de modélisation PostgreSQL
│   ├── schema.prisma         # Entités, clés primaires/étrangères et indexation
│   └── seed.ts               # Script automatique d'initialisation de données
├── src/                      # Interface Utilisateur React
│   ├── components/           # Composants graphiques modulaires (Bacs, Flotte, Factures, FAQ...)
│   ├── context/              # Conteneurs d'état global utilisateur (AuthContext)
│   ├── types.ts              # Déclarations typées TypeScript (Subscriber, Invoice, Route...)
│   └── App.tsx               # Point d'entrée de navigation et routage applicatif
├── server.ts                 # Serveur d'orchestration global multi-environnements
└── package.json              # Manifeste de dépendances npm
```

---

## 📋 Prérequis et Démarrage Rapide

### Installation locale

1. **Dépendances :** Installez les paquets npm :
   ```bash
   npm install
   ```

2. **Environnement :** Copiez le fichier d'exemple et configurez vos variables :
   ```bash
   cp .env.example .env
   ```

3. **Génération Prisma :** Importez le client Prisma :
   ```bash
   npx prisma generate
   ```

4. **Lancement du serveur de développement :**
   ```bash
   npm run dev
   ```
   L'application est lancée sur [http://localhost:3000](http://localhost:3000).

---

## 📜 Documentation Complète du Système

Pour plus de détails opérationnels et guides d'installation :
- **[Architecture Applicative](./ARCHITECTURE.md)**
- **[Modèle de Données & Relations](./DATABASE.md)**
- **[Configuration PostgreSQL détaillée](./POSTGRESQL_SETUP.md)**
- **[Spécifications de Sécurité RBAC](./RBAC.md)**
- **[Manuel d'Authentification](./AUTHENTICATION.md)**
- **[Répertoire des Endpoints d'API](./API.md)**
