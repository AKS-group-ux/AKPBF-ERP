# AUDIT DE CONFORMITÉ DES RÈGLES MÉTIER / BUSINESS RULES SPECIALIST

Ce rapport valide la modélisation et l'application des règles métier fondamentales exigées pour le fonctionnement d'un ERP de salubrité publique et assainissement (Abidjan, Côte d’Ivoire).

---

## 📋 1. SÉCURITÉ ET COHÉRENCE DE FACTURATION & PAIEMENTS

| Action | Règle Métier Appliquée EN PRODUCTION | Statut |
| :--- | :--- | :---: |
| **Paiement Facture** | Interdire l'encaissement d'un montant inférieur ou égal à `0 FCFA`. | **Actif** |
| **Traitement Paiement** | Écriture automatique double-entrée dans le journal comptable (`Caisse/Orange Money` / `Clients Divers`). | **Actif** |
| **Fonds & Soldes** | Décrémenter instantanément la balance débitrice de l'abonné du montant payé. | **Actif** |
| **Statut de Compte** | Passer l'abonné au statut `ACTIVE` et débloquer les services de collecte lors de l'apurement des dettes. | **Actif** |
| **Génération Recus** | Émettre un reçu officiel scellé `REC-YYYY-XXXXXX` avec stamp cryptographique unique. | **Actif** |

---

## 🚫 2. SÉCURITÉ DE SUPPRESSION / RELATIONAL RESTRICTIONS

*   **RESTRICT sur SubscriptionPlan :** Un forfait ne peut être supprimé s'il y a des abonnés actifs rattachés.
*   **RESTRICT sur Customer :** Un abonné ne peut être supprimé ou archivé si un historique de factures, règlements ou collectes de déchets existe en base de données.
*   **RESTRICT sur Invoices & Payments :** Un titre de facture payé est inviolable. Suppression interdite. Les règlements monétaires sont immuables (annulation possible uniquement par passation d'avoir ou écriture négative compensatoire dans le Grand Livre).
*   **RESTRICT sur Vehicles & Chauffeurs :** Suppression interdite si des plannings de tournées ou des relevés GPS en temps réel y font référence.

---

## 🔧 3. SÉCURITÉ D'ACCÈS AUX DONNÉES ET GESTIONNAIRE D'IDENTITÉ (AUTH)

*   **Zéro Trust aux Portes API :** Tous les terminaux sensibles d'Abidjan (`/api/erp/*`, `/api/billing/*`, `/api/users/*`) sont gardés par un décodage et une validation stricte du jeton JWT porteur (`authenticateToken`).
*   **Rôles Applicatifs Précis :** Filtrage sélectif des autorisations (`ADMINISTRATEUR`, `COMPTABLE`, `SUPERVISEUR`, `AGENT`, `CHAUFFEUR`, `CLIENT`) au niveau des endpoints Express router et de l'affichage du menu utilisateur.
*   **Contrôle Unique d'Inscription :** Empêcher les doublons d'adresse e-mail ou de numéro d'abonné (`subscriberId`) pour éviter les collusions et les fuites d'intégrité financière.
