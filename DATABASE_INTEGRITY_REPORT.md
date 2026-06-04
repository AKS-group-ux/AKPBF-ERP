# RAPPORT D'INTÉGRITÉ DE LA BASE DE DONNÉES / DATABASE ARCHITECT

Ce rapport confirme la conformité structurelle de la base de données relationnelle PostgreSQL, ses clés étrangères, et la robustesse du schéma face aux tentatives d'injection ou d'incohérence.

---

## 🔑 1. CARDINALITÉS ET CLÉS ÉTRANGÈRES DU SCHÉMA PRISMA

Le schéma stocké sous `/prisma/schema.prisma` gère l'ensemble des dépendances métier :

*   **`User` ↔ `UserRole` ↔ `Role` (M:N) :** Assure qu'un utilisateur possède au moins un rôle système et hérite des privilèges correspondants. Clés en cascade sur suppression d'utilisateur ou rôle.
*   **`Customer` ↔ `Subscription` (1:N) :** Les abonnements des résidents sont strictement corrélés à leur identité d'abonné (`customerId` @db.Uuid).
*   **`Customer` ↔ `Invoice` (1:N) & `Invoice` ↔ `Payment` (1:N) :** Liens inaltérables de facturation. Empêche la perte de données comptables.
*   **`Bin` ↔ `Collection` (1:N) ↔ `User` (Agent) (1:1) :** Traçabilité exhaustive du poids collecté et des horaires de passage des agents.

---

## 🛑 2. VERIFICATION DES SUPPRESSIONS EN SERVICE (ON DELETE DESTRUCTION PROTECTIONS)

Pour garantir l'intégrité comptable et éviter les orphelins (orphaned records), les restrictions suivantes sont rattachées au niveau logique applicatif (Node/Express/Prisma) :

```
             ┌─────────────────┐
             │   Customer      │
             └────────┬────────┘
                      │
           (Invoices/Payments/Collections)
                      │
                      ▼
    [Relation Exist? (count > 0)]
            /            \
          Oui            Non
          /                \
         ▼                  ▼
[RESTRICT BLOQUÉ]     [STATUS = TERMINATED] 
"Impossible de          (Soft Delete & Archive)
 supprimer l'abonné"
```

1.  **Customer Restrict :** Requêtes `count` sur `Invoice`, `Payment` et `Collection` avant tout changement statutaire ou masquage.
2.  **SubscriptionPlan Restrict :** Bloquer toute modification de tarif ou suppression si un contrat d'abonnement est actif sous ce forfait.

---

## 🛡️ 3. IMMUNITÉ CONTRE LES INJECTIONS SQL ET COLLUSIONS D'EMAILS

*   **Requêtes Paramétrées par Défaut :** L'ORM Prisma compile l'ensemble des déclarations sous forme de requêtes préparées avec variables typées Postgres. Zéro injection possible.
*   **Contrainte d'Unicité d'Emails (`@unique`) :** Le schéma de table `users` impose un index unique de bas niveau sur la colonne `email`, prévenant toute corruption de session.
*   **Optimisation Clustered Lock via ID UUIDv7 :** Facilitation logique de l'ordre d'insertion et performance d'indexation accrue.
