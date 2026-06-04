# RAPPORT DES FLUX TRANSACTIONNELS ERP AKPBF

Ce rapport cartographie l'univers des flux financiers et des validations asynchrones gérées par l'ERP AKPBF pour les services de voirie d'Abidjan.

---

## 📲 1. FLUX DES PAIEMENTS MOBILE MONEY (WEBHOOKS)

Les règlements numériques via Orange Money, Moov Money et Telecel Cash suivent une exécution asynchrone sécurisée par jeton et journalisation d'événements.

### Diagramme de Séquence de Validation Mobile Money
```
[Citoyen Mobile] ───────► Initiates Charge (api/payments/charge)
                                 │
                                 ▼
                     Creates PENDING Transaction
                     & Payment records in DB
                                 │
                                 ▼
[Telco Operator] ──────► Webhook Callback Post (api/payments/webhook)
                                 │
                     Verifies Provider Signature
                     & TransactionReference
                                 │
                                 ▼
                     Updates Transaction to SUCCESS,
                     Clears corresponding Invoice,
                     Reduces Customer Debt Balance,
                     Passes Double Entry Accounting Journal entry.
```

---

## 🧾 2. ENCAISSEMENT RAPIDE COMPTABLE (QUICK CASH)

Pour les paiements directs guichet / agence enregistrés par les caissiers, le flux est immédiat et synchrone.

1.  **Recherche Multi-Critères :** Identification par Email, Téléphone, ID Unique `ABJ-...`, ou scan QR Code RFID du bac d'ordures.
2.  **Règlement & Lettrage des Factures :** Allocation prioritaire sur les plus anciennes dettes ouvertes (`UNPAID` / `OVERDUE`).
3.  **Mise à niveau :** Activation immédiate du dossier et notifications SMS instantanées transmises à la file d'attente d'Abidjan.

---

## 📈 3. SYSTÈME DE FACTURATION MENSUELLE GROUPÉE (BILLING CYCLE)

Une routine automatisée (`api/billing/cycle`) exécute les calculs mensuels :

*   **Calcul au prorata :** Facturation forfaitaire selon l'abonnement souscrit.
*   **Contrôle d'impayés :** Suspension logistique automatique pour les abonnés atteignant et dépassant la limite fixée d'un mois d'impayé. Une alerte d'interdiction de levée de bac est transmise aux smartphones des agents de terrain.
*   **Trace d'Audit :** Enregistrement de chaque cycle comptable et de ses statistiques d'erreur pour prévenir toute rupture de chaîne.
