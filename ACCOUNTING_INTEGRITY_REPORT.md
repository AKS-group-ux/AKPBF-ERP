# RAPPORT D'INTÉGRITÉ COMPTABLE ERP AKPBF

Ce rapport décrit l'architecture comptable fermée et double-entrée automatisée au sein de la trésorerie de l'ERP d'assainissement AKPBF.

---

## 📊 1. AUTOMATION DU JOURNAL COMPTABLE ET GRAND LIVRE

Chaque événement financier sur l'ERP écrit une feuille de journal comptable inaltérable (`AKPBF_ERP_JOURNAL`) stockée en PostgreSQL.

### Scénario : Encaissement Rapide d'Abonné (Quick Payment)
Lorsqu'un comptable ou caissier enregistre un règlement de facture, les écritures suivantes sont passées de manière atomique :

```
Date: [Date de paiement]
Réf: REC-2026-XXXXXX  (Reçu officiel de Trésorerie)
----------------------------------------------------------------------------
Débit : 571100 - Caisse Principale                     [Montant Encaissé] [FCFA]
OU
Débit : 521200 - Trésor Orange Money (Option)          [Montant Encaissé] [FCFA]

Crédit: 411100 - Clients Divers Salubrité               [Montant Encaissé] [FCFA]
----------------------------------------------------------------------------
```

### Scénario : Émission de Facture (Invoice Generation)
Lors de l'émission mensuelle automatisée d'un titre :
```
Débit : 411100 - Clients Divers Salubrité               [Montant Forfait] [FCFA]
Crédit: 706000 - Prestations de Services Assainissement [Montant Forfait] [FCFA]
```

### Scénario : Avoir de régularisation (Credit Note / Avoir)
En cas de contestation ou de correction de trop-perçu :
```
Débit : 706000 - Prestations de Services Assainissement [Montant Rectifié] [FCFA]
Crédit: 411100 - Clients Divers Salubrité               [Montant Rectifié] [FCFA]
```

---

## 🔒 2. CONTRÔLE DE SÉCURITÉ DE TRÉSORERIE ET SOLDE DÉBITEUR

1.  **Strict Double-Entry Balanced Guard (Double Entrée) :** Le total des comptes de débit doit correspondre au centime près au total des comptes de crédit pour chaque lot de transactions.
2.  **Solde de Client Protégé :** Le solde accumulé (`c.balance` en Postgres) est décrémenté lors des règlements et incrémenté lors de la facturation. Aucune modification manuelle arbitraire n'est autorisée en dehors d'une pièce comptable de référence.
3.  **Trace d'Audit d'Opérateur :** Chaque ligne de journal sauvegarde l'ID et le nom de l'agent comptable ayant validé la transaction, pour un historique inaltérable.
