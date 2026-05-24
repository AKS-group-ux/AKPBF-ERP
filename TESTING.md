# 🧪 TESTING.md - Stratégie de Validation Technologique et Tests

Ce guide documente l'approche rigoureuse appliquée au contrôle qualité et à la validation fonctionnelle de l'ERP AKPBF pour éliminer toute régression sur les flux de facturation d'Abidjan.

---

## 🎯 1. Niveaux de Tests Applicatifs

Pour assurer une résilience totale face à la complexité des cas métiers (ex: calculs d'arriérés comptables, niveaux de bacs erratiques), l'ERP applique 3 types de tests combinés :

```
             +-----------------------------------------+
             |         1. Tests de Typage (Static)     |
             |       (tsc verify & linter global)      |
             +--------------------+--------------------+
                                  |
                                  v
             +--------------------+--------------------+
             |      2. Tests Unitaires de Services     |
             |   (Vérification des routes et JWT)     |
             +--------------------+--------------------+
                                  |
                                  v
             +--------------------+--------------------+
             |       3. Tests d'Intégration B2B        |
             |   (Cinématiques de paiement abonnés)   |
             +-----------------------------------------+
```

---

## 🛠️ 2. Validation d'Intégrité Statique (Linter & Type System)

Le premier rempart contre les bugs en environnement Node.js réside dans la rigueur absolue du typage structurel de TypeScript.

Le script de contrôle automatisé intégré à l'ERP effectue une validation complète des imports, déclarations de types, types énumérés (`enum`) et structures de données sans émettre de fichiers transpilés :

```bash
npm run lint
```

*Note : Cette analyse statique (`tsc --noEmit`) est automatiquement intégrée dans le pipeline de validation de pré-livraison CI/CD d'AI Studio pour garantir le rejet immédiat de toute proposition de code non valide.*

---

## 🧪 3. Protocoles Individuels de Tests de Recouvrements

Afin de simuler les interactions réelles avec le Portail Citoyen et la comptabilité municipale d'Abidjan :

### A. Scénario : Demande d'Abonnement et Validation Financière
1. Connectez-vous sur le **Portail Public AKPBF** (Landing Page).
2. Naviguez vers l'onglet **S'inscrire** et complétez les champs du formulaire (Nom, Téléphone, Adresse à Riviera 3, Sélection du forfait d'abonnement).
3. Cliquez sur "Émettre ma demande".
4. **Vérification attendue :** 
   - Un identifiant structuré de type `ABJ-...` s'affiche immédiatement.
   - Les coordonnées géographiques aléatoires sont générées près de la zone d'Abidjan voulue.
   - La table d'historique de notifications conserve l'enregistrement de l'envoi du SMS de confirmation.

### B. Scénario : Processus d'Encaissement de Facture d'un Abonné
1. Connectez-vous en tant que **COMPTABLE** (`comptable@akpbf.com` / `Comptable@2026`).
2. Accédez à l'onglet de facturation/recouvrement d'abonnés et isolez un dossier muni d'un status `UNPAID` (par exemple : 'Kouassi Kouadio Jean').
3. Cliquez sur l'action "Enregistrer un paiement" ou simulez le règlement de la facture via un versement fictif Orange Money.
4. **Vérification attendue :**
   - Le statut passe immédiatement de `UNPAID` à `PAID` (Réglé).
   - Les revenus consolidés s'ajustent à la hausse en temps réel sur le widget de synthèse financière.
   - Une ligne de conformité d'audit est insérée à chaud pour mémoriser l'utilisateur comptable à l'origine du mouvement de caisse.

---

## ⚙️ 4. Automatisation des Tests Unitaires avec Mock SQL

Pour les dômes d'ingénierie avancés voulant écrire des suites automatisées complètes via **Jest** ou **Vitest** :

1. **Isolation d'instance :** Nous suggérons l'usage de bases de tests séparées ou de pilotes mémoire de SQLite pour accélérer l'exécution des scénarios d'API Express sans altérer la base PostgreSQL d'Abidjan.
2. **Utilisation recommandée de l'extension Prisma Mock Client :**
   ```typescript
   import { mockDeep, mockReset } from 'jest-mock-extended';
   import { PrismaClient } from '@prisma/client';
   
   jest.mock('@prisma/client', () => ({
     PrismaClient: () => mockPrisma,
   }));
   
   export const mockPrisma = mockDeep<PrismaClient>();
   ```
   Ce modèle de mock évite les écritures physiques sur disque et sécurise le déroulement des tests.
