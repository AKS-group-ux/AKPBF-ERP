# Rapport de Cartographie des Documents ERP - AKPBF

Ce rapport dresse la liste exhaustive de tous les titres documentaires officiels prévus par l'ERP AKPBF pour la municipalité d'Abidjan et leur structure de données correspondante sur les modèles PostgreSQL.

---

## 1. CARTOGRAPHIE ET TYPOLOGIE DES TITRES DOCUMENTAIRES

| Type de Document | Libellé Officiel de Titrage | Table PostgreSQL Source | Format & Paramètres de Rendu |
| :--- | :--- | :--- | :--- |
| **Facture** (`invoice`) | TITRE DE RECETTE COMMUNAL - FACTURE DE REDEVANCE | `invoice` -> `customer` | Format A4 Portrait, tableau détaillé des échéances et indices RFID, mention légale fiscale. |
| **Contrat** (`contract`) | CONTRAT CADRE DE SALUBRITÉ EN CONCESSION COMMUNALE | `customer` -> `subscription` | Clauses d'engagement, fréquence hebdomadaire des éboueurs, signatures certifiées. |
| **Reçu** (`receipt`) | REÇU D’ACQUITTEMENT FISCAL ET DE PAIEMENT SALUBRITÉ | `payment` -> `invoice` -> `customer` | Informations du versement (Wave, OM, Moov, Espèces), signature du caissier en chef, hachage d'intégrité. |
| **Rapport / Statistique** (`report`) | BILAN ANALYTIQUE RECOUVREMENT ET COMPTABILITÉ COMMUNE | `invoice` (aggregate), `payment` | Graphiques, synthèse des impayés, solde du grand livre, volume traité par quartier. |

---

## 2. SPÉCIFICATIONS FONCTIONNELLES DES DOCUMENTS

### A. Titre de Recette Communal (Facture de Redevance)
*   **Identifiant technique :** `GET /api/documents/invoice/:id/pdf`
*   **Informations clés embarquées :**
    *   Subventions ou plans souscrits (`Standard Municipal`, `Famille Nombreuse`, `Commerce`).
    *   Adresse exacte de Cocody/Riviera avec coordonnées géographiques.
    *   Calcul de la redevance mensuelle nominale (FCFA).
    *   Mentions de mise en demeure si le statut est `UNPAID` ou impayé de plus de 30 jours.

### B. Contrat Cadre de Concession de Salubrité
*   **Identifiant technique :** `GET /api/documents/contract/:id/pdf`
*   **Informations clés embarquées :**
    *   Dates d'onboarding originales de l'abonné dans l'ERP d'Abidjan.
    *   Volume estimé hebdomadaire d'ordures concédées.
    *   Fréquence de ramassage logistique par les camions bennes de voirie.
    *   Mention d'authentification IP et heure précise de signature numérique.

### C. Reçu d'Acquittement Fiscal (Quittance de Caisse)
*   **Identifiant technique :** `GET /api/documents/receipt/:id/pdf`
*   **Informations clés embarquées :**
    *   Numéro de transaction du fournisseur de Mobile Money (ex. Référence Wave ou transaction Orange Money).
    *   Date précise et heures de l'écriture en comptabilité.
    *   Montant apuré et extinction de la facture de référence liée.
    *   Cachet numérique actif et signature du Contrôleur en Chef de l'AKPBF.

### D. Bilan Analytique Comptable et Logistique (Rapport ERP)
*   **Identifiant technique :** `GET /api/documents/report/:id/pdf`
*   **Informations clés embarquées :**
    *   Récapitulatif statistique des transactions financières de l'ERP.
    *   Tableau des dettes fiscales non apurées classées par quartier.
    *   Taux de remplissage moyen des bacs connectés identifié par les capteurs d'agents de collecte.
    *   KPI de performance du parc de véhicules de voirie.
