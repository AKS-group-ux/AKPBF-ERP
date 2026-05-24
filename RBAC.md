# 👥 RBAC.md - Matrice Globale de Contrôle d'Accès basé sur les Rôles

Ce document spécifie les droits d'administration et les politiques de protection d'accès aux différentes routes et interfaces (vues React) de l'ERP AKPBF.

---

## 🎭 1. Les Rôles du Système

L'ERP AKPBF segmente les responsabilités et restreint l'écriture ou la consultation selon 8 paliers hiérarchiques de confiance :

```
    [Niveau]   [Rôle]                   [Responsabilités]
      20  ---> SUPER_ADMIN             (Autorité absolue sur tous les tenants)
      10  ---> ADMINISTRATEUR          (Gestion de la flotte, configuration plans, audit)
       5  ---> SUPERVISEUR             (Ressources Humaines, assignations camions)
       4  ---> COMPTABLE               (Livre des comptes, suivi des dettes, validation encaissements)
       3  ---> CAISSIER                (Guichet de caisse physique d'Abidjan)
       2  ---> CHAUFFEUR / AGENT       (Mise à jour d'alertes cuves, lecture des QR codes bacs)
       1  ---> CLIENT (CITOYEN)        (Auto-inscription, règlement de facture en ligne, signature contrat)
```

---

## 📊 2. Grille de Correspondance Opérationnelle des Vues

| Vue Métier React | Rôles Habilités | Objectif de l'Habilitation |
| :--- | :--- | :--- |
| **Architect Hub** | `ADMINISTRATEUR`, `SUPER_ADMIN` | Supervision de l'intégrité de la base de données et des versions. |
| **Comptabilité** | `COMPTABLE`, `ADMINISTRATEUR`, `SUPER_ADMIN` | Consultation du compte de résultat analytique et des dépenses. |
| **Facturation** | `COMPTABLE`, `CAISSIER`, `ADMINISTRATEUR` | Émission de factures, calcul des retards de taxation. |
| **Impayés** | `COMPTABLE`, `ADMINISTRATEUR`, `SUPER_ADMIN` | Lancement de relances SMS ou de suspensions à l'encontre des contrevenants. |
| **Tournées / GPS** | `SUPERVISEUR`, `CHAUFFEUR`, `ADMINISTRATEUR` | Optimisation spatiale de levée des conteneurs. |
| **Portail Client** | `CLIENT`, `ADMINISTRATEUR` | Consultation de dossier individuel d'abonné, paiement en ligne, relance réclamation. |

---

## 🔒 3. Mécanique de Contrôle dans les Contrôleurs Node.js/Express

L'accès à un endpoint exposé par l'API est blindé via le middleware d'évaluation hiérarchique :

```typescript
// Extrait explicatif rattaché à backend/src/middleware/rbac.ts
import { RbacMiddleware, UserRole } from '../middleware/rbac';

// Seul un COMPTABLE ou niveau hiérarchique supérieur (SUPERVISEUR, ADMIN) peut consulter la liste des impayés
router.get('/billing/debts', RbacMiddleware.requireRole(UserRole.COMPTABLE), BillingController.getUnpaidDebts);
```

### Protection Self-Or-Corporate (`requireSelfOrCorporate`)
Pour sécuriser le flux d'informations personnelles (RGPD local), un client citoyen ne peut solliciter que son propre dossier opérationnel d'abonné. S'il tente d'interroger un ID de tiers, le middleware intercepte la demande et renvoie une erreur `403 Forbidden` :
```typescript
router.get('/subscribers/:subscriberId', RbacMiddleware.requireSelfOrCorporate, ...);
```
