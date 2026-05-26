# Rapport d’Audit des Données Simulées - AKPBF ERP

**Système :** Assainissement, Kiosques et Propreté de la Boucle du Fleuve (AKPBF)  
**Classification des Données :** Audit de Données Statiques vs Données de Transactions Réelles

---

## 1. CARTOGRAPHIE DES DONNÉES SIMULÉES ET STATIQUES

L'ERP AKPBF incorpore deux fichiers de semences statiques de données d'unification pour assurer la cohérence fonctionnelle de son interface utilisateur hors-ligne, tout en étant relié à l'API Rest de PostgreSQL pour les opérations de production en ligne :

### A. Fichier `src/mockData.ts`
*   **Contenu :** Échantillons de forfaits d'abonnés, liste initiale d'abonnés pré-identifiés, agents de collecte, tracés d'itinéraires types, emplacements géographiques de kiosques et journalisations initiales de test.
*   **Raison d'être :** Permet au frontend d'Abidjan d'afficher une interface immédiate, peuplée de données de salubrité complexes et réalistes dès le premier lancement, ou lors de scénarios hors-ligne.
*   **Redondance métrique :** Dès qu’un opérateur s’authentifie avec succès via l’API unifiée `/api/auth/login`, l'IFrame frontend interroge le point de terminaison backend réel `/api/erp/state`, court-circuitant structurellement ces données statiques de démarrage.

### B. Fichier `src/demo_generator.ts`
*   **Contenu :** Moteur dynamique de création de jeux de démonstration périodique (calculateur de dates glissantes, attribution de codes QR réalistes, génération dynamique de factures fictives sur les 30 derniers jours).
*   **Raison d'être :** Assurer la couverture de courbes analytiques lors de présentation de tableaux de bord aux autorités municipales d'Abidjan sans exiger des mois d'écriture de données réelles préalables.

---

## 2. RECONSTITUTION DES MAPPINGS RELATIONNELS POSTGRESQL

Pour chaque structure de données identifiée dans le fichier `src/mockData.ts`, voici la correspondance exacte des tables PostgreSQL gérées par Prisma dans `prisma/schema.prisma` et les points d'API REST correspondants :

| Variable Frontend / Structure | Description Fonctions UI | Table PostgreSQL Cible | Point d'API REST de Production |
| :---| :--- | :--- | :--- |
| `INITIAL_PLANS` | Formules tarifaires d'assainissement d'Abidjan | `subscription_plans` | `GET /api/erp/state` |
| `INITIAL_SUBSCRIBERS` | Fiches d’inscription citoyens et statuts physiques de bacs | `customers` (UUID avec `subscriberId`) | `GET /api/erp/state` , `POST /api/erp/subscribers` , `PUT /api/erp/subscribers/:id` |
| `INITIAL_INVOICES` | Titres de recouvrement fiscaux de salubrité émis | `invoices` (Foreign Key vers `customers`) | `GET /api/billing/debts` , `POST /api/erp/invoices` |
| `INITIAL_AGENTS` | Profils d'équipages et d'éboueurs d'Abidjan | `users` (Rôles `AGENT` ou `CHAUFFEUR`) | `GET /api/erp/state` |
| `INITIAL_ROUTES` | Tracés de voirie et tournées logistiques | `collection_routes` | `GET /api/erp/state` |
| `INITIAL_EMPLACEMENTS` | Coordonnées de kiosques de propreté | `settings` (JSON chiffré sous la clé `AKPBF_ERP_EMPLACEMENTS`) | `GET /api/erp/state` |

---

## 3. ANALYSE DU CRITÈRE "ZÉRO SIMULATION CONTRACTUELLE"

Certains modules d'affaires, jugés hautement stratégiques pour l'ERP Odoo-like, ont été immunisés contre les structures locales pour imposer une validation backend et PostgreSQL impérative :

1.  **Enregistrement de Nouveaux Abonnés :**
    *   Le formulaire d'onboarding public envoie directement une requête `POST /api/erp/subscribers` à l'API Express.
    *   Celle-ci invoque l'outil de contrôle de règles métier `ErpEngine.onboardClient`.
    *   Si le courriel ou le numéro de téléphone existe déjà physiquement dans la table `customers` de PostgreSQL, **une erreur d'intégrité de la base de données est levée immédiatement**, bloquant la transaction.
2.  **Validation des Encaissements et Comptabilisation (Facturation/Paiement) :**
    *   L'action d'enregistrement par l'interface `QuickPaymentView` déclenche l'appel transactionnel `POST /api/erp/payments/quick`.
    *   Toutes les modifications de soldedébiteur, l'extinction de facture dans la table `invoices`, l'insertion de ligne de transaction dans `payments` et l'affectation du débit/crédit dans le grand livre comptable `journals` s'effectuent au travers d'une transaction unifiée en cascade (`prisma.$transaction`) dans PostgreSQL.
    *   Aucune donnée locale volatile n'est utilisée pour valider le statut de paiement des créances d'Abidjan.

---

## 4. RECOMMANDATIONS DE NETTOYAGE PRÉ-PRODUCTION (CLEANUP ROADMAP)

Afin de supprimer les résidus de données de démonstration lors du déploiement définitif :
*   **Option de démarrage à blanc (Clean Slate Start) :** Intégrer un commutateur global d'accès au niveau de `src/App.tsx` (`const IS_PRODUCTION = true`) qui interdit l'évaluation de localstorage et force la redirection immédiate vers l'interface de connexion `/auth/login` si aucune connexion backend à PostgreSQL n'est active.
*   **Purge des scripts de graines :** Conserver le fichier `prisma/seed.ts` uniquement pour concevoir les rôles fondamentaux de la structure (`ADMINISTRATEUR`, `COMPTABLE`, `SUPERVISEUR`), en supprimant les fiches d'abonnés de test.
